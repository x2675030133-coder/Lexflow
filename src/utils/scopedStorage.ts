export const PROGRESS_CHANGED_EVENT = 'el-progress-changed';
export const ACTIVE_SCOPE_KEY = 'el_progress_scope';
export const DEFAULT_SCOPE = 'anonymous';

export const STORAGE_BASE_KEYS = {
  progress: 'el_user_progress',
  dailyStats: 'el_daily_stats',
  reading: 'el_reading_progress',
  readingComplete: 'el_reading_complete',
  readingStudy: 'el_reading_study',
  listening: 'el_listening_progress',
  podcast: 'el_podcast_progress',
  pronunciation: 'el_pronunciation_progress',
} as const;

const SCOPE_SANITIZER = /[^a-z0-9._-]+/g;

export function normalizeScope(scope: string | null | undefined): string {
  const value = String(scope || '').trim().toLowerCase();
  if (!value) return DEFAULT_SCOPE;
  return value.replace(SCOPE_SANITIZER, '_') || DEFAULT_SCOPE;
}

export function getActiveScope(): string {
  try {
    return normalizeScope(localStorage.getItem(ACTIVE_SCOPE_KEY));
  } catch {
    return DEFAULT_SCOPE;
  }
}

export function setActiveScope(scope: string | null | undefined): void {
  try {
    localStorage.setItem(ACTIVE_SCOPE_KEY, normalizeScope(scope));
  } catch {
    // Ignore storage failures. The app can still fall back to in-memory state.
  }
}

export function scopedKey(baseKey: string, scope: string | null | undefined = getActiveScope()): string {
  return `${baseKey}:${normalizeScope(scope)}`;
}

export function readScopedJson<T>(baseKey: string, fallback: T, scope: string | null | undefined = getActiveScope()): T {
  try {
    const raw = localStorage.getItem(scopedKey(baseKey, scope));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeScopedJson(baseKey: string, value: unknown, scope: string | null | undefined = getActiveScope()): void {
  try {
    localStorage.setItem(scopedKey(baseKey, scope), JSON.stringify(value));
  } catch {
    // Ignore quota or privacy-mode failures.
  }
}

export function removeScopedJson(baseKey: string, scope: string | null | undefined = getActiveScope()): void {
  try {
    localStorage.removeItem(scopedKey(baseKey, scope));
  } catch {
    // Ignore storage failures.
  }
}

export function clearProgressScope(scope: string | null | undefined = getActiveScope()): void {
  Object.values(STORAGE_BASE_KEYS).forEach((baseKey) => removeScopedJson(baseKey, scope));
}

export function emitProgressChanged(): void {
  try {
    window.dispatchEvent(new Event(PROGRESS_CHANGED_EVENT));
  } catch {
    // Ignore when running without a browser window.
  }
}
