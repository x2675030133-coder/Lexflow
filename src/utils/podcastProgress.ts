const STORAGE_KEY = 'el_podcast_progress';

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

