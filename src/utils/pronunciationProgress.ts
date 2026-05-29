import { emitProgressChanged, readScopedJson, STORAGE_BASE_KEYS, writeScopedJson } from './scopedStorage';

export interface PronunciationProgress {
  favorites: string[];
  practiced: string[];
  lastSelectedId: string;
  updatedAt: string;
}

export const PRONUNCIATION_CHANGED_EVENT = 'el-pronunciation-changed';

function createDefaultProgress(): PronunciationProgress {
  return {
    favorites: [],
    practiced: [],
    lastSelectedId: '',
    updatedAt: '',
  };
}

function normalizeIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  return Array.from(
    new Set(
      values
        .map((item) => String(item || '').trim())
        .filter(Boolean),
    ),
  );
}

function normalizeProgress(progress: Partial<PronunciationProgress> | null | undefined): PronunciationProgress {
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) {
    return createDefaultProgress();
  }

  return {
    favorites: normalizeIds(progress.favorites),
    practiced: normalizeIds(progress.practiced),
    lastSelectedId: String(progress.lastSelectedId || '').trim(),
    updatedAt: String(progress.updatedAt || ''),
  };
}

function readProgress(): PronunciationProgress {
  const scoped = normalizeProgress(readScopedJson<PronunciationProgress>(STORAGE_BASE_KEYS.pronunciation, createDefaultProgress()));
  if (scoped.favorites.length || scoped.practiced.length || scoped.lastSelectedId) return scoped;

  try {
    const legacyRaw = localStorage.getItem(STORAGE_BASE_KEYS.pronunciation);
    if (!legacyRaw) return scoped;
    const legacy = normalizeProgress(JSON.parse(legacyRaw) as Partial<PronunciationProgress>);
    if (legacy.favorites.length || legacy.practiced.length || legacy.lastSelectedId) {
      writeProgress(legacy);
      return legacy;
    }
  } catch {
    // Ignore legacy migration failures.
  }

  return scoped;
}

function writeProgress(progress: PronunciationProgress): void {
  writeScopedJson(STORAGE_BASE_KEYS.pronunciation, progress);
}

function emitChange(): void {
  try {
    window.dispatchEvent(new Event(PRONUNCIATION_CHANGED_EVENT));
  } catch {
    // Ignore when running outside the browser.
  }
}

export function getPronunciationProgress(): PronunciationProgress {
  return readProgress();
}

export function savePronunciationProgress(progress: Partial<PronunciationProgress>): PronunciationProgress {
  const next = normalizeProgress({
    ...readProgress(),
    ...progress,
    updatedAt: new Date().toISOString(),
  });

  writeProgress(next);
  emitChange();
  emitProgressChanged();
  return next;
}

export function togglePronunciationFavorite(soundId: string): PronunciationProgress {
  const id = String(soundId || '').trim();
  if (!id) return readProgress();

  const current = readProgress();
  const favorites = current.favorites.includes(id)
    ? current.favorites.filter((item) => item !== id)
    : [...current.favorites, id];

  return savePronunciationProgress({ favorites });
}

export function markPronunciationPracticed(soundId: string): PronunciationProgress {
  return markPronunciationPracticedMany([soundId]);
}

export function markPronunciationPracticedMany(soundIds: string[]): PronunciationProgress {
  const ids = normalizeIds(soundIds);
  if (!ids.length) return readProgress();

  const current = readProgress();
  const practiced = Array.from(new Set([...current.practiced, ...ids]));

  if (practiced.length === current.practiced.length && current.practiced.every((id) => practiced.includes(id))) {
    return current;
  }

  return savePronunciationProgress({ practiced });
}

export function setLastPronunciationSelection(soundId: string): PronunciationProgress {
  const id = String(soundId || '').trim();
  return savePronunciationProgress({ lastSelectedId: id });
}
