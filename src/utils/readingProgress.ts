import type { Article } from '../data/articles';
import { getArticleLearningKeys } from './articleIdentity';
import { emitProgressChanged, readScopedJson, STORAGE_BASE_KEYS, writeScopedJson } from './scopedStorage';

function readIds(): string[] {
  const ids = readScopedJson<string[]>(STORAGE_BASE_KEYS.readingComplete, []);
  return Array.isArray(ids) ? ids.filter((item) => typeof item === 'string') : [];
}

function writeIds(ids: string[]): void {
  writeScopedJson(STORAGE_BASE_KEYS.readingComplete, Array.from(new Set(ids)));
  emitProgressChanged();
}

function resolveReadKeys(input: string | Article) {
  if (typeof input === 'string') {
    const value = input.trim();
    return value ? [value] : [];
  }

  return getArticleLearningKeys(input);
}

export function getReadArticleIds(): Set<string> {
  return new Set(readIds().filter((key) => !key.startsWith('reading:') && !key.startsWith('url:')));
}

export function getReadArticleKeys(): Set<string> {
  return new Set(readIds());
}

export function isArticleRead(input: string | Article): boolean {
  const readIds = getReadArticleKeys();
  return resolveReadKeys(input).some((key) => readIds.has(key));
}

export function markArticleRead(input: string | Article): void {
  const nextKeys = resolveReadKeys(input);
  if (nextKeys.length === 0) return;

  const ids = readIds();
  const next = new Set(ids);
  nextKeys.forEach((key) => next.add(key));

  if (next.size !== ids.length) {
    ids.length = 0;
    ids.push(...Array.from(next));
    writeIds(ids);
  }
}

export function saveReadArticleIds(ids: string[]): void {
  writeIds(ids);
}
