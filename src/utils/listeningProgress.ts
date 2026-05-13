import { emitProgressChanged, readScopedJson, STORAGE_BASE_KEYS, writeScopedJson } from './scopedStorage';

function readIds(): string[] {
  const ids = readScopedJson<string[]>(STORAGE_BASE_KEYS.listening, []);
  return Array.isArray(ids) ? ids.filter((item) => typeof item === 'string') : [];
}

function writeIds(ids: string[]): void {
  writeScopedJson(STORAGE_BASE_KEYS.listening, Array.from(new Set(ids)));
  emitProgressChanged();
}

export function getLearnedListeningIds(): Set<string> {
  return new Set(readIds());
}

export function isListeningLearned(id: string): boolean {
  return getLearnedListeningIds().has(id);
}

export function markListeningLearned(id: string): void {
  const ids = readIds();
  if (!ids.includes(id)) {
    ids.push(id);
    writeIds(ids);
  }
}

export function markManyListeningLearned(ids: string[]): void {
  const current = readIds();
  writeIds([...current, ...ids]);
}

export function saveLearnedListeningIds(ids: string[]): void {
  writeIds(ids);
}
