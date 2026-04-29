const STORAGE_KEY = 'el_reading_progress';

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export function getReadArticleIds(): Set<string> {
  return new Set(readIds());
}

export function isArticleRead(id: string): boolean {
  return getReadArticleIds().has(id);
}

export function markArticleRead(id: string): void {
  const ids = readIds();
  if (!ids.includes(id)) {
    ids.push(id);
    writeIds(ids);
  }
}
