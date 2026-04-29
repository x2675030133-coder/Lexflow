import { generatedReading } from './generatedReading';
import { generatedReadingMeta } from './generatedReadingMeta';
import type { GeneratedReadingMeta } from './generatedReadingMeta';
import type { Article } from './articles';
import { readingExtras } from './readingExtras';
import { getJsonWithTimeout } from '../services/http';

const CACHE_KEY = 'reading-live-articles';
const BACKUP_CACHE_KEY = 'reading-live-articles-backup';
const LAST_SYNC_KEY = 'reading-last-successful-sync-at';
const GENERATED_JSON_URL = '/data/generated-reading.json';
const GENERATED_META_JSON_URL = '/data/generated-reading-meta.json';
const MAX_CACHED_ARTICLES = 120;
let runtimeCachedArticles: Article[] = [];

type ReadingCacheSnapshot = {
  savedAt: number;
  articles: Article[];
};

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

function normalizeIdentity(value: string) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeTitleIdentity(value: string) {
  return normalizeIdentity(value).replace(/\s*(?:[\(（]?\d+[\)）]?)\s*$/, '').trim();
}

function getArticleIdentity(article: Article) {
  if (article.sourceUrl) {
    return `url:${normalizeIdentity(article.sourceUrl)}`;
  }

  const paragraphLead = article.paragraphs[0]?.en || '';
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

function loadCachedArticles() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const backupRaw = localStorage.getItem(BACKUP_CACHE_KEY);
    const localArticles = readArticleList(raw);
    const backupArticles = readSnapshotArticles(backupRaw);
    return mergeAndSortArticles(runtimeCachedArticles, localArticles, backupArticles);
  } catch {
    return mergeAndSortArticles(runtimeCachedArticles);
  }
}

function readArticleList(raw: string | null) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((article): article is Article => Boolean(article) && !articleLooksCorrupted(article as Article));
  } catch {
    return [];
  }
}

function readSnapshotArticles(raw: string | null) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Partial<ReadingCacheSnapshot> | Article[];
    if (Array.isArray(parsed)) {
      return parsed.filter((article): article is Article => Boolean(article) && !articleLooksCorrupted(article as Article));
    }

    if (parsed && Array.isArray(parsed.articles)) {
      return parsed.articles.filter((article): article is Article => Boolean(article) && !articleLooksCorrupted(article as Article));
    }

    return [];
  } catch {
    return [];
  }
}

function readCacheSnapshot(key: string): ReadingCacheSnapshot | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ReadingCacheSnapshot> | Article[];

    if (Array.isArray(parsed)) {
      const articles = parsed.filter((article): article is Article => Boolean(article) && !articleLooksCorrupted(article));
      return articles.length > 0 ? { savedAt: Date.now(), articles } : null;
    }

    if (!parsed || !Array.isArray(parsed.articles)) return null;

    const articles = parsed.articles.filter((article): article is Article => Boolean(article) && !articleLooksCorrupted(article));
    if (articles.length === 0) return null;

    return {
      savedAt: Number.isFinite(parsed.savedAt as number) && (parsed.savedAt as number) > 0 ? (parsed.savedAt as number) : Date.now(),
      articles,
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

async function loadGeneratedArticles() {
  try {
    const parsed = await getJsonWithTimeout<Article[]>(GENERATED_JSON_URL, 8000);
    const clean = Array.isArray(parsed) ? parsed.filter((article) => !articleLooksCorrupted(article)) : [];
    return clean.length > 0 ? mergeAndSortArticles(clean, readingExtras) : getStaticReadingPool();
  } catch {
    return getStaticReadingPool();
  }
}

async function loadGeneratedMeta() {
  try {
    const parsed = await getJsonWithTimeout<GeneratedReadingMeta>(GENERATED_META_JSON_URL, 8000);
    return parsed && typeof parsed === 'object' ? parsed : generatedReadingMeta;
  } catch {
    return generatedReadingMeta;
  }
}

function compareArticleDate(leftDate: string, rightDate: string) {
  const left = Date.parse(leftDate);
  const right = Date.parse(rightDate);
  if (Number.isNaN(left) && Number.isNaN(right)) return 0;
  if (Number.isNaN(left)) return 1;
  if (Number.isNaN(right)) return -1;
  return right - left;
}

function dedupeArticles(nextArticles: Article[]) {
  const seen = new Set<string>();
  const unique: Article[] = [];

  nextArticles.forEach((article) => {
    const identity = getArticleIdentity(article);
    if (seen.has(identity)) return;
    seen.add(identity);
    unique.push(article);
  });

  return unique;
}

function mergeAndSortArticles(...groups: Article[][]) {
  const merged = dedupeArticles(groups.flat().filter((article) => !articleLooksCorrupted(article)));
  merged.sort((left, right) => compareArticleDate(left.date, right.date));
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

export function storeCachedArticles(nextArticles: Article[]) {
  try {
    const current = loadCachedArticles();
    const merged = mergeAndSortArticles(nextArticles, current);
    if (current.length > 0) {
      writeCacheSnapshot(BACKUP_CACHE_KEY, {
        savedAt: readLastSuccessfulSyncAt() ?? Date.now(),
        articles: current,
      });
    }
    runtimeCachedArticles = merged;
    writeCacheSnapshot(CACHE_KEY, {
      savedAt: Date.now(),
      articles: merged,
    });
    writeLastSuccessfulSyncAt(Date.now());
  } catch {
    runtimeCachedArticles = mergeAndSortArticles(nextArticles, runtimeCachedArticles);
  }
}

export function getAllArticles() {
  const merged = mergeAndSortArticles(getStaticReadingPool(), runtimeCachedArticles, loadCachedArticles());
  return merged;
}

export async function refreshGeneratedArticles() {
  const liveGenerated = await loadGeneratedArticles();
  if (liveGenerated.length > 0) {
    storeCachedArticles(liveGenerated);
  }
  return liveGenerated;
}

export async function refreshGeneratedReadingMeta() {
  return loadGeneratedMeta();
}

export function getGeneratedReadingMeta() {
  return generatedReadingMeta;
}

export function getLastSuccessfulReadingSyncAt() {
  return readLastSuccessfulSyncAt();
}

export function getReadingCacheBackupInfo() {
  const snapshot = readCacheSnapshot(BACKUP_CACHE_KEY);
  if (!snapshot || snapshot.articles.length === 0) {
    return null;
  }

  return {
    savedAt: snapshot.savedAt,
    articleCount: snapshot.articles.length,
  };
}

export function restorePreviousReadingCache() {
  const backup = readCacheSnapshot(BACKUP_CACHE_KEY);
  if (!backup || backup.articles.length === 0) {
    return null;
  }

  const current = readCacheSnapshot(CACHE_KEY) ?? {
    savedAt: Date.now(),
    articles: runtimeCachedArticles,
  };

  if (current.articles.length > 0) {
    writeCacheSnapshot(BACKUP_CACHE_KEY, current);
  }

  writeCacheSnapshot(CACHE_KEY, backup);
  runtimeCachedArticles = backup.articles;
  writeLastSuccessfulSyncAt(backup.savedAt);
  return backup.articles;
}

export function shouldAutoRefreshReadingLibrary(articleCount: number, maxAgeMs = 24 * 60 * 60 * 1000) {
  if (articleCount === 0) return true;
  const lastSync = readLastSuccessfulSyncAt();
  if (!lastSync) return true;
  return Date.now() - lastSync > maxAgeMs;
}
