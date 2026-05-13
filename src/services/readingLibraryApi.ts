import type { Article } from '../data/articles';
import { generatedReadingMeta, type GeneratedReadingMeta } from '../data/generatedReadingMeta';
import { getJsonWithTimeout, postJsonWithTimeout } from './http';

export interface ReadingLibrarySnapshot {
  articles: Article[];
  meta: GeneratedReadingMeta;
  notice?: string;
  error?: string;
  updatedAt?: string;
  batchIndex?: number;
  canRefresh?: boolean;
  unreadCount?: number;
}

function normalizeSnapshot(value: unknown): ReadingLibrarySnapshot {
  if (Array.isArray(value)) {
    return {
      articles: value.filter((item): item is Article => Boolean(item)),
      meta: generatedReadingMeta,
    };
  }

  if (!value || typeof value !== 'object') {
    return {
      articles: [],
      meta: generatedReadingMeta,
    };
  }

  const snapshot = value as Partial<ReadingLibrarySnapshot> & { meta?: Partial<GeneratedReadingMeta> };
  return {
    articles: Array.isArray(snapshot.articles) ? snapshot.articles.filter((item): item is Article => Boolean(item)) : [],
    meta: {
      ...generatedReadingMeta,
      ...(snapshot.meta || {}),
    },
    notice: typeof snapshot.notice === 'string' ? snapshot.notice : '',
    error: typeof snapshot.error === 'string' ? snapshot.error : '',
    updatedAt: typeof snapshot.updatedAt === 'string' ? snapshot.updatedAt : '',
    batchIndex: Number.isFinite(snapshot.batchIndex as number) ? (snapshot.batchIndex as number) : undefined,
    canRefresh: typeof snapshot.canRefresh === 'boolean' ? snapshot.canRefresh : undefined,
    unreadCount: Number.isFinite(snapshot.unreadCount as number) ? (snapshot.unreadCount as number) : undefined,
  };
}

export async function fetchReadingLibrarySnapshot(): Promise<ReadingLibrarySnapshot> {
  const parsed = await getJsonWithTimeout<unknown>('/api/reading/library', 12000);
  return normalizeSnapshot(parsed);
}

export async function refreshReadingLibrarySnapshot(): Promise<ReadingLibrarySnapshot> {
  const parsed = await postJsonWithTimeout<unknown>('/api/reading/library/refresh', {}, 12000);
  return normalizeSnapshot(parsed);
}
