import { emitProgressChanged, readScopedJson, STORAGE_BASE_KEYS, writeScopedJson } from './scopedStorage';

export type ReadingStudyRecord = {
  totalSentences: number;
  listenedSentenceKeys: string[];
  listenedParagraphIndexes: number[];
  lastParagraphIndex: number | null;
  lastSentenceKey: string | null;
  completed: boolean;
  completedAt: string;
  updatedAt: string;
};

type ReadingStudySnapshot = {
  articles: Record<string, ReadingStudyRecord>;
  updatedAt: string;
};

const EMPTY_RECORD: ReadingStudyRecord = {
  totalSentences: 0,
  listenedSentenceKeys: [],
  listenedParagraphIndexes: [],
  lastParagraphIndex: null,
  lastSentenceKey: null,
  completed: false,
  completedAt: '',
  updatedAt: '',
};

function now() {
  return new Date().toISOString();
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean))) : [];
}

function normalizeNumberArray(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item >= 0)))
    : [];
}

function normalizeRecord(record: Partial<ReadingStudyRecord> | null | undefined): ReadingStudyRecord {
  const totalSentences = Number(record?.totalSentences || 0);
  const listenedSentenceKeys = normalizeStringArray(record?.listenedSentenceKeys);
  const listenedParagraphIndexes = normalizeNumberArray(record?.listenedParagraphIndexes);
  const normalizedTotalSentences = Number.isFinite(totalSentences) && totalSentences > 0 ? Math.floor(totalSentences) : 0;
  const completed = Boolean(record?.completed) || (normalizedTotalSentences > 0 && listenedSentenceKeys.length >= normalizedTotalSentences);
  return {
    totalSentences: normalizedTotalSentences,
    listenedSentenceKeys,
    listenedParagraphIndexes,
    lastParagraphIndex:
      Number.isFinite(Number(record?.lastParagraphIndex)) && Number(record?.lastParagraphIndex) >= 0
        ? Math.floor(Number(record?.lastParagraphIndex))
        : null,
    lastSentenceKey: String(record?.lastSentenceKey || '').trim() || null,
    completed,
    completedAt: completed ? String(record?.completedAt || now()) : String(record?.completedAt || ''),
    updatedAt: String(record?.updatedAt || ''),
  };
}

function normalizeSnapshot(snapshot: Partial<ReadingStudySnapshot> | null | undefined): ReadingStudySnapshot {
  const articles = snapshot && typeof snapshot.articles === 'object' && !Array.isArray(snapshot.articles)
    ? Object.entries(snapshot.articles).reduce<Record<string, ReadingStudyRecord>>((acc, [articleId, value]) => {
        const normalizedId = String(articleId || '').trim();
        if (!normalizedId) return acc;
        acc[normalizedId] = normalizeRecord(value as Partial<ReadingStudyRecord>);
        return acc;
      }, {})
    : {};

  return {
    articles,
    updatedAt: String(snapshot?.updatedAt || ''),
  };
}

function readSnapshot(): ReadingStudySnapshot {
  return normalizeSnapshot(readScopedJson<ReadingStudySnapshot>(STORAGE_BASE_KEYS.readingStudy, { articles: {}, updatedAt: '' }));
}

function writeSnapshot(snapshot: ReadingStudySnapshot): void {
  writeScopedJson(STORAGE_BASE_KEYS.readingStudy, snapshot);
  emitProgressChanged();
}

function updateRecord(articleId: string, updater: (record: ReadingStudyRecord) => ReadingStudyRecord): ReadingStudyRecord {
  const normalizedId = String(articleId || '').trim();
  if (!normalizedId) return EMPTY_RECORD;

  const snapshot = readSnapshot();
  const previous = snapshot.articles[normalizedId] || { ...EMPTY_RECORD };
  const next = updater({ ...previous });

  snapshot.articles[normalizedId] = normalizeRecord({
    ...next,
    updatedAt: now(),
  });
  snapshot.updatedAt = now();
  writeSnapshot(snapshot);

  return snapshot.articles[normalizedId];
}

export function getReadingStudyProgress(articleId: string): ReadingStudyRecord {
  const normalizedId = String(articleId || '').trim();
  if (!normalizedId) return { ...EMPTY_RECORD };
  return readSnapshot().articles[normalizedId] || { ...EMPTY_RECORD };
}

export function touchReadingStudyProgress(articleId: string, totalSentences: number): ReadingStudyRecord {
  return updateRecord(articleId, (record) => ({
    ...record,
    totalSentences: Math.max(record.totalSentences || 0, Number.isFinite(totalSentences) ? Math.floor(totalSentences) : 0),
  }));
}

export function markReadingSentenceListened(
  articleId: string,
  sentenceKey: string,
  paragraphIndex: number,
  totalSentences: number,
): ReadingStudyRecord {
  const cleanedSentenceKey = String(sentenceKey || '').trim();
  const cleanedParagraphIndex = Number.isFinite(Number(paragraphIndex)) && Number(paragraphIndex) >= 0 ? Math.floor(Number(paragraphIndex)) : null;

  return updateRecord(articleId, (record) => {
    const listenedSentenceKeys = cleanedSentenceKey
      ? Array.from(new Set([...record.listenedSentenceKeys, cleanedSentenceKey]))
      : record.listenedSentenceKeys;
    const listenedParagraphIndexes =
      cleanedParagraphIndex === null
        ? record.listenedParagraphIndexes
        : Array.from(new Set([...record.listenedParagraphIndexes, cleanedParagraphIndex]));
    const normalizedTotalSentences = Math.max(record.totalSentences || 0, Number.isFinite(totalSentences) ? Math.floor(totalSentences) : 0);
    const completed = normalizedTotalSentences > 0 && listenedSentenceKeys.length >= normalizedTotalSentences;

    return {
      ...record,
      totalSentences: normalizedTotalSentences,
      listenedSentenceKeys,
      listenedParagraphIndexes,
      lastParagraphIndex: cleanedParagraphIndex,
      lastSentenceKey: cleanedSentenceKey || record.lastSentenceKey,
      completed,
      completedAt: completed ? record.completedAt || now() : record.completedAt,
    };
  });
}

export function markReadingParagraphListened(
  articleId: string,
  paragraphIndex: number,
  sentenceKeys: string[],
  totalSentences: number,
): ReadingStudyRecord {
  const cleanedSentenceKeys = Array.isArray(sentenceKeys)
    ? sentenceKeys.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const cleanedParagraphIndex = Number.isFinite(Number(paragraphIndex)) && Number(paragraphIndex) >= 0 ? Math.floor(Number(paragraphIndex)) : null;

  return updateRecord(articleId, (record) => {
    const listenedSentenceKeys = Array.from(new Set([...record.listenedSentenceKeys, ...cleanedSentenceKeys]));
    const listenedParagraphIndexes =
      cleanedParagraphIndex === null
        ? record.listenedParagraphIndexes
        : Array.from(new Set([...record.listenedParagraphIndexes, cleanedParagraphIndex]));
    const normalizedTotalSentences = Math.max(record.totalSentences || 0, Number.isFinite(totalSentences) ? Math.floor(totalSentences) : 0);
    const completed = normalizedTotalSentences > 0 && listenedSentenceKeys.length >= normalizedTotalSentences;

    return {
      ...record,
      totalSentences: normalizedTotalSentences,
      listenedSentenceKeys,
      listenedParagraphIndexes,
      lastParagraphIndex: cleanedParagraphIndex,
      lastSentenceKey: cleanedSentenceKeys[cleanedSentenceKeys.length - 1] || record.lastSentenceKey,
      completed,
      completedAt: completed ? record.completedAt || now() : record.completedAt,
    };
  });
}

export function markReadingStudyStarted(articleId: string, totalSentences: number): ReadingStudyRecord {
  return updateRecord(articleId, (record) => ({
    ...record,
    totalSentences: Math.max(record.totalSentences || 0, Number.isFinite(totalSentences) ? Math.floor(totalSentences) : 0),
  }));
}

export function clearReadingStudyProgress(articleId: string): void {
  const normalizedId = String(articleId || '').trim();
  if (!normalizedId) return;

  const snapshot = readSnapshot();
  if (!snapshot.articles[normalizedId]) return;

  delete snapshot.articles[normalizedId];
  snapshot.updatedAt = now();
  writeSnapshot(snapshot);
}
