import type { PodcastEpisode } from './podcastService';

export type PodcastLibraryMeta = {
  generatedAt?: string | null;
  lastSyncAt?: string | null;
  sourceCount?: number;
  episodeCount?: number;
  stale?: boolean;
  sources?: Array<{
    source: string;
    count: number;
    error?: string | null;
  }>;
};

export type PodcastLibraryResponse = {
  episodes: PodcastEpisode[];
  meta: PodcastLibraryMeta;
  error?: string;
  notice?: string;
};

async function requestPodcastLibrary(path: string, method: 'GET' | 'POST' = 'GET'): Promise<PodcastLibraryResponse> {
  const response = await fetch(path, {
    method,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Podcast library request failed: ${response.status}`);
  }

  return response.json() as Promise<PodcastLibraryResponse>;
}

export async function loadPodcastLibrary(): Promise<PodcastLibraryResponse> {
  return requestPodcastLibrary('/api/podcasts/library', 'GET');
}

export async function refreshPodcastLibrary(): Promise<PodcastLibraryResponse> {
  return requestPodcastLibrary('/api/podcasts/refresh', 'POST');
}
