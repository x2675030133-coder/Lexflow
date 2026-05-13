import { emitProgressChanged, readScopedJson, STORAGE_BASE_KEYS, writeScopedJson } from './scopedStorage';

function readIds(): string[] {
  const ids = readScopedJson<string[]>(STORAGE_BASE_KEYS.podcast, []);
  return Array.isArray(ids) ? ids.filter((item) => typeof item === 'string') : [];
}

function writeIds(ids: string[]): void {
  writeScopedJson(STORAGE_BASE_KEYS.podcast, Array.from(new Set(ids)));
  emitProgressChanged();
}

export function getLearnedPodcastIds(): Set<string> {
  return new Set(readIds());
}

export function isPodcastLearned(id: string): boolean {
  return getLearnedPodcastIds().has(id);
}

export function markPodcastLearned(id: string): void {
  const ids = readIds();
  if (!ids.includes(id)) {
    ids.push(id);
    writeIds(ids);
  }
}

export function saveLearnedPodcastIds(ids: string[]): void {
  writeIds(ids);
}
