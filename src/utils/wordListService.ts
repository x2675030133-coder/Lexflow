import type { Word } from '../data/types';

const DB_NAME = 'wordwise_cache';
const DB_VERSION = 4;
const STORE_NAME = 'wordLists';

type DerivedWordListConfig = {
  sources: string[];
  limit: number;
  offset?: number;
};

const DERIVED_WORD_LISTS: Record<string, DerivedWordListConfig> = {
  zhongkao: { sources: ['junior'], limit: 1200 },
  gaokao: { sources: ['senior'], limit: 3500 },
  zhuanshengben: { sources: ['cet4'], limit: 3200, offset: 300 },
  'postgraduate-core': { sources: ['cet6'], limit: 4500 },
  'postgraduate-highfreq': { sources: ['cet4', 'cet6'], limit: 2200, offset: 500 },
  tem4: { sources: ['cet4', 'cet6'], limit: 4500 },
  tem8: { sources: ['cet6', 'gre'], limit: 6500 },
  ket: { sources: ['primary', 'junior'], limit: 1500 },
  pet: { sources: ['junior', 'senior'], limit: 2500 },
  fce: { sources: ['senior', 'cet4'], limit: 3600 },
  cae: { sources: ['cet6', 'ielts'], limit: 4200 },
  gmat: { sources: ['gre'], limit: 5200, offset: 500 },
  sat: { sources: ['toefl', 'gre'], limit: 5000 },
  act: { sources: ['toefl', 'senior'], limit: 3600 },
  oxford3000: { sources: ['primary', 'junior', 'senior'], limit: 3000 },
  oxford5000: { sources: ['primary', 'junior', 'senior', 'cet4'], limit: 5000 },
  'high-frequency': { sources: ['primary', 'junior', 'cet4'], limit: 3000 },
  awl: { sources: ['ielts', 'toefl'], limit: 1200, offset: 200 },
  'news-core': { sources: ['cet4', 'cet6', 'toefl'], limit: 1800, offset: 600 },
  'speaking-phrases': { sources: ['junior', 'senior'], limit: 1600, offset: 200 },
  'writing-upgrade': { sources: ['cet4', 'cet6'], limit: 1800, offset: 900 },
  'phrasal-verbs': { sources: ['junior', 'senior', 'cet4'], limit: 900, offset: 500 },
  legal: { sources: ['cet6', 'gre'], limit: 900, offset: 1200 },
  travel: { sources: ['primary', 'junior', 'senior'], limit: 900, offset: 100 },
};

const FALLBACK_LIST_IDS = [
  'primary',
  'junior',
  'senior',
  'cet4',
  'cet6',
  'ielts',
  'toefl',
  'gre',
  ...Object.keys(DERIVED_WORD_LISTS),
];

type WordListMetadataEntry = { totalWords: number };
type WordListMetadataFile = {
  version?: string;
  generated?: string;
  lists?: Record<string, WordListMetadataEntry>;
};

type WordListCacheEntry = {
  listId: string;
  metadataVersion: string;
  metadataGenerated: string;
  totalWords: number;
  words: Word[];
};

const wordListMemoryCache = new Map<string, WordListCacheEntry>();
let metadataCache: WordListMetadataFile | null = null;

function getMetadataSignature(metadata: WordListMetadataFile): string {
  return `${metadata.version ?? ''}:${metadata.generated ?? ''}`;
}

function getMetadataListEntry(metadata: WordListMetadataFile, listId: string): WordListMetadataEntry | undefined {
  return metadata.lists?.[listId];
}

function isFreshCacheEntry(
  entry: WordListCacheEntry,
  metadata: WordListMetadataFile,
  listId: string,
): boolean {
  const metadataEntry = getMetadataListEntry(metadata, listId);
  if (!metadataEntry) return true;
  return (
    `${entry.metadataVersion}:${entry.metadataGenerated}` === getMetadataSignature(metadata) &&
    entry.totalWords === metadataEntry.totalWords
  );
}

function normalizeCachedEntry(
  listId: string,
  cached: WordListCacheEntry | Word[] | null,
): WordListCacheEntry | null {
  if (!cached) return null;
  if (Array.isArray(cached)) {
    return {
      listId,
      metadataVersion: '',
      metadataGenerated: '',
      totalWords: cached.length,
      words: cached,
    };
  }
  return cached;
}


function getKnownWordListIds(): string[] {
  const metadataIds = metadataCache?.lists ? Object.keys(metadataCache.lists) : [];
  return Array.from(new Set([...FALLBACK_LIST_IDS, ...metadataIds]));
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getFromCache(listId: string): Promise<WordListCacheEntry | Word[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(listId);
      req.onsuccess = () => resolve(normalizeCachedEntry(listId, req.result || null));
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveToCache(listId: string, words: Word[], metadata: WordListMetadataFile): Promise<void> {
  try {
    const db = await openDB();
    const entry: WordListCacheEntry = {
      listId,
      metadataVersion: metadata.version ?? '',
      metadataGenerated: metadata.generated ?? '',
      totalWords: words.length,
      words,
    };

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(entry, listId);
      wordListMemoryCache.set(listId, entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    wordListMemoryCache.set(listId, {
      listId,
      metadataVersion: metadata.version ?? '',
      metadataGenerated: metadata.generated ?? '',
      totalWords: words.length,
      words,
    });
  }
}

async function getWordListMetadataFile(): Promise<WordListMetadataFile> {
  if (metadataCache) return metadataCache;
  try {
    const res = await fetch('/data/metadata.json', { cache: 'no-store' });
    if (!res.ok) return metadataCache ?? {};
    metadataCache = await res.json() as WordListMetadataFile;
    return metadataCache;
  } catch {
    return metadataCache ?? {};
  }
}

export async function getWordListMetadata(): Promise<Record<string, WordListMetadataEntry>> {
  const metadata = await getWordListMetadataFile();
  return metadata.lists || {};
}

async function fetchWordList(listId: string): Promise<Word[]> {
  const res = await fetch(`/data/${listId}.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load word list: ${listId}`);
  return res.json() as Promise<Word[]>;
}

function makeDerivedWordId(listId: string, word: Word, index: number): string {
  const slug = word.word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${listId}-${slug || 'word'}-${index + 1}`;
}

async function buildDerivedWordList(listId: string): Promise<Word[]> {
  const config = DERIVED_WORD_LISTS[listId];
  if (!config) throw new Error(`Unknown derived word list: ${listId}`);

  const sourceLists = await Promise.all(config.sources.map((sourceId) => loadWordList(sourceId)));
  const uniqueWords: Word[] = [];
  const seen = new Set<string>();

  sourceLists.flat().forEach((word) => {
    const key = word.word.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    uniqueWords.push(word);
  });

  const start = config.offset ?? 0;
  return uniqueWords.slice(start, start + config.limit).map((word, index) => ({
    ...word,
    id: makeDerivedWordId(listId, word, index),
  }));
}

export async function loadWordList(listId: string): Promise<Word[]> {
  const metadata = await getWordListMetadataFile();

  const memoryCached = wordListMemoryCache.get(listId);
  if (memoryCached && isFreshCacheEntry(memoryCached, metadata, listId)) {
    return memoryCached.words;
  }

  const cached = normalizeCachedEntry(listId, await getFromCache(listId));
  if (cached && isFreshCacheEntry(cached, metadata, listId)) {
    wordListMemoryCache.set(listId, cached);
    return cached.words;
  }

  try {
    const words = DERIVED_WORD_LISTS[listId]
      ? await buildDerivedWordList(listId)
      : await fetchWordList(listId);
    await saveToCache(listId, words, metadata);
    return words;
  } catch (error) {
    if (memoryCached) return memoryCached.words;
    if (cached) return cached.words;
    throw error;
  }
}

export async function loadWordLists(listIds: string[] = getKnownWordListIds()): Promise<Record<string, Word[]>> {
  const uniqueIds = Array.from(new Set(listIds));
  const entries = await Promise.all(uniqueIds.map(async (listId) => [listId, await loadWordList(listId)] as const));
  return Object.fromEntries(entries);
}

export async function findWordById(wordId: string, preferredListId?: string): Promise<Word | null> {
  const listIds = preferredListId
    ? [preferredListId, ...getKnownWordListIds().filter(id => id !== preferredListId)]
    : getKnownWordListIds();

  for (const listId of Array.from(new Set(listIds))) {
    const words = await loadWordList(listId);
    const found = words.find(word => word.id === wordId);
    if (found) return found;
  }

  return null;
}

export async function findWordByWord(word: string, preferredListId?: string): Promise<Word | null> {
  const normalized = word.trim().toLowerCase();
  const listIds = preferredListId
    ? [preferredListId, ...getKnownWordListIds().filter(id => id !== preferredListId)]
    : getKnownWordListIds();

  for (const listId of Array.from(new Set(listIds))) {
    const words = await loadWordList(listId);
    const found = words.find(item => item.word.toLowerCase() === normalized);
    if (found) return found;
  }

  return null;
}

export async function clearWordListCache(listId?: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    if (listId) {
      store.delete(listId);
      wordListMemoryCache.delete(listId);
    } else {
      store.clear();
      wordListMemoryCache.clear();
      metadataCache = null;
    }
  } catch {
    if (listId) {
      wordListMemoryCache.delete(listId);
    } else {
      wordListMemoryCache.clear();
      metadataCache = null;
    }
  }

  Object.keys(localStorage)
    .filter(key => key.startsWith('wordwise_list_'))
    .forEach(key => localStorage.removeItem(key));
}
