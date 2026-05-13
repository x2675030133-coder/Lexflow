import { generatedReading } from './generatedReading';
import { generatedReadingMeta } from './generatedReadingMeta';
import type { GeneratedReadingMeta } from './generatedReadingMeta';
import type { Article } from './articles';
import { readingExtras } from './readingExtras';
import { getArticleIdentity } from '../utils/articleIdentity';
import { isArticleRead } from '../utils/readingProgress';
import { fetchReadingLibrarySnapshot } from '../services/readingLibraryApi';

const CACHE_KEY = 'reading-live-articles';
const BACKUP_CACHE_KEY = 'reading-live-articles-backup';
const LAST_SYNC_KEY = 'reading-last-successful-sync-at';
const MAX_CACHED_ARTICLES = 800;

type ReadingCacheSnapshot = {
  savedAt: number;
  articles: Article[];
  meta: GeneratedReadingMeta;
  batchIndex?: number;
};

let runtimeCachedArticles: Article[] = [];
let runtimeCachedMeta: GeneratedReadingMeta = generatedReadingMeta;

function hasMojibake(value: string) {
  return /[\uFFFD]|\\u[0-9a-fA-F]{4}/.test(value);
}

function articleLooksCorrupted(article: Article) {
  return (
    hasMojibake(article.titleEn) ||
    hasMojibake(article.titleZh) ||
    article.paragraphs.some((paragraph) => hasMojibake(paragraph.zh) || hasMojibake(paragraph.en)) ||
    article.vocabulary.some(
      (vocab) => hasMojibake(vocab.definition) || hasMojibake(vocab.word) || hasMojibake(vocab.phonetic),
    )
  );
}

function normalizeMeta(meta?: Partial<GeneratedReadingMeta> | null): GeneratedReadingMeta {
  return {
    ...generatedReadingMeta,
    ...runtimeCachedMeta,
    ...(meta || {}),
  };
}

function normalizeIdentity(value: string) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeTitleIdentity(value: string) {
  return normalizeIdentity(value).replace(/\s*(?:[\[(（【]?\d+[\])）】]?)\s*$/, '').trim();
}

function getStableIdentity(article: Article) {
  if (article.sourceUrl) {
    return `url:${normalizeIdentity(article.sourceUrl)}`;
  }

  const paragraphLead = article.paragraphs.slice(0, 2).map((paragraph) => normalizeIdentity(paragraph.en)).join('|');
  return [
    normalizeTitleIdentity(article.titleEn),
    normalizeTitleIdentity(article.titleZh),
    normalizeIdentity(article.source),
    normalizeIdentity(paragraphLead),
  ]
    .filter(Boolean)
    .join('|');
}

export function getReadingArticleIdentity(article: Article) {
  return getArticleIdentity(article);
}

function getStaticReadingPool() {
  return mergeAndSortArticles(generatedReading, readingExtras);
}

function readArticleList(raw: string | null) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((article): article is Article => Boolean(article) && !articleLooksCorrupted(article));
  } catch {
    return [];
  }
}

function readCacheSnapshot(raw: string | null): ReadingCacheSnapshot | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ReadingCacheSnapshot> | Article[];
    if (Array.isArray(parsed)) {
      const articles = parsed.filter((article): article is Article => Boolean(article) && !articleLooksCorrupted(article));
      if (articles.length === 0) return null;
      return {
        savedAt: Date.now(),
        articles,
        meta: normalizeMeta(),
      };
    }

    if (!parsed || !Array.isArray(parsed.articles)) return null;

    const articles = parsed.articles.filter((article): article is Article => Boolean(article) && !articleLooksCorrupted(article));
    if (articles.length === 0) return null;

    return {
      savedAt: Number.isFinite(parsed.savedAt as number) && (parsed.savedAt as number) > 0 ? (parsed.savedAt as number) : Date.now(),
      articles,
      meta: normalizeMeta(parsed.meta as GeneratedReadingMeta | undefined),
    };
  } catch {
    return null;
  }
}

function writeCacheSnapshot(key: string, snapshot: ReadingCacheSnapshot) {
  try {
    localStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    // ignore storage failures
  }
}

function loadCachedSnapshot() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const backupRaw = localStorage.getItem(BACKUP_CACHE_KEY);
    const localArticles = readArticleList(raw);
    const backupSnapshot = readCacheSnapshot(backupRaw);
    const currentSnapshot = readCacheSnapshot(raw);

    const snapshots = [runtimeCachedArticles, localArticles, currentSnapshot?.articles || [], backupSnapshot?.articles || []];
    const mergedArticles = mergeAndSortArticles(...snapshots);
    const meta = normalizeMeta(currentSnapshot?.meta || backupSnapshot?.meta);

    return {
      savedAt: currentSnapshot?.savedAt || backupSnapshot?.savedAt || Date.now(),
      articles: mergedArticles,
      meta,
    };
  } catch {
    return {
      savedAt: Date.now(),
      articles: mergeAndSortArticles(runtimeCachedArticles),
      meta: normalizeMeta(),
    };
  }
}

async function loadGeneratedLibrary() {
  try {
    const snapshot = await fetchReadingLibrarySnapshot();
    const cleanArticles = Array.isArray(snapshot.articles)
      ? snapshot.articles.filter((article) => !articleLooksCorrupted(article))
      : [];

    if (cleanArticles.length > 0) {
      return {
        articles: mergeAndSortArticles(cleanArticles, readingExtras),
        meta: normalizeMeta(snapshot.meta),
      };
    }
  } catch {
    // fall through to static data
  }

  return {
    articles: getStaticReadingPool(),
    meta: normalizeMeta(),
  };
}

function compareArticleDate(leftDate: string, rightDate: string) {
  const left = Date.parse(leftDate);
  const right = Date.parse(rightDate);
  if (Number.isNaN(left) && Number.isNaN(right)) return 0;
  if (Number.isNaN(left)) return 1;
  if (Number.isNaN(right)) return -1;
  return right - left;
}

function compareArticles(left: Article, right: Article) {
  const leftRead = isArticleRead(left);
  const rightRead = isArticleRead(right);
  if (leftRead !== rightRead) {
    return leftRead ? 1 : -1;
  }

  const dateCompare = compareArticleDate(left.date, right.date);
  if (dateCompare !== 0) return dateCompare;

  return getStableIdentity(left).localeCompare(getStableIdentity(right));
}

function dedupeArticles(nextArticles: Article[]) {
  const seen = new Set<string>();
  const unique: Article[] = [];

  nextArticles.forEach((article) => {
    const identity = getStableIdentity(article);
    if (seen.has(identity)) return;
    seen.add(identity);
    unique.push(article);
  });

  return unique;
}

function mergeAndSortArticles(...groups: Article[][]) {
  const merged = dedupeArticles(groups.flat().filter((article) => !articleLooksCorrupted(article)));
  merged.sort(compareArticles);
  return merged.slice(0, MAX_CACHED_ARTICLES);
}

function readLastSuccessfulSyncAt() {
  try {
    const raw = localStorage.getItem(LAST_SYNC_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeLastSuccessfulSyncAt(timestamp: number) {
  try {
    localStorage.setItem(LAST_SYNC_KEY, String(timestamp));
  } catch {
    // ignore storage failures
  }
}

export function storeCachedArticles(nextArticles: Article[], nextMeta?: GeneratedReadingMeta | null) {
  try {
    const current = loadCachedSnapshot();
    const mergedArticles = mergeAndSortArticles(nextArticles, current.articles);
    const mergedMeta = normalizeMeta(nextMeta || current.meta);

    if (current.articles.length > 0) {
      writeCacheSnapshot(BACKUP_CACHE_KEY, {
        savedAt: current.savedAt,
        articles: current.articles,
        meta: current.meta,
      });
    }

    runtimeCachedArticles = mergedArticles;
    runtimeCachedMeta = mergedMeta;

    writeCacheSnapshot(CACHE_KEY, {
      savedAt: Date.now(),
      articles: mergedArticles,
      meta: mergedMeta,
    });
    writeLastSuccessfulSyncAt(Date.now());
  } catch {
    runtimeCachedArticles = mergeAndSortArticles(nextArticles, runtimeCachedArticles);
    runtimeCachedMeta = normalizeMeta(nextMeta || runtimeCachedMeta);
  }
}

export function getAllArticles() {
  const current = loadCachedSnapshot();
  const merged = mergeAndSortArticles(getStaticReadingPool(), runtimeCachedArticles, current.articles);
  runtimeCachedMeta = normalizeMeta(current.meta);
  return merged;
}

export async function refreshGeneratedArticles() {
  const generated = await loadGeneratedLibrary();
  if (generated.articles.length > 0) {
    storeCachedArticles(generated.articles, generated.meta);
  }
  return generated.articles;
}

export async function refreshGeneratedReadingMeta() {
  const generated = await loadGeneratedLibrary();
  runtimeCachedMeta = normalizeMeta(generated.meta);
  return runtimeCachedMeta;
}

export function getGeneratedReadingMeta() {
  return runtimeCachedMeta || generatedReadingMeta;
}

export function getLastSuccessfulReadingSyncAt() {
  return readLastSuccessfulSyncAt();
}

export function getReadingCacheBackupInfo() {
  const snapshot = readCacheSnapshot(localStorage.getItem(BACKUP_CACHE_KEY));
  if (!snapshot || snapshot.articles.length === 0) {
    return null;
  }

  return {
    savedAt: snapshot.savedAt,
    articleCount: snapshot.articles.length,
  };
}

export function restorePreviousReadingCache() {
  const backup = readCacheSnapshot(localStorage.getItem(BACKUP_CACHE_KEY));
  if (!backup || backup.articles.length === 0) {
    return null;
  }

  const current = readCacheSnapshot(localStorage.getItem(CACHE_KEY)) ?? {
    savedAt: Date.now(),
    articles: runtimeCachedArticles,
    meta: runtimeCachedMeta,
  };

  if (current.articles.length > 0) {
    writeCacheSnapshot(BACKUP_CACHE_KEY, current);
  }

  writeCacheSnapshot(CACHE_KEY, backup);
  runtimeCachedArticles = backup.articles;
  runtimeCachedMeta = backup.meta;
  writeLastSuccessfulSyncAt(backup.savedAt);
  return backup.articles;
}

export function shouldAutoRefreshReadingLibrary(articleCount: number, unreadCount = articleCount) {
  return articleCount >= 0 && unreadCount >= 0;
}
