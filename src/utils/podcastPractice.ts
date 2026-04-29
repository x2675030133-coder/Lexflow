import type { PodcastEpisode } from '../services/podcastService';

export interface PracticeSentence {
  id: number;
  en: string;
  note: string;
  keywords: string[];
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'that',
  'with',
  'from',
  'this',
  'have',
  'your',
  'about',
  'into',
  'there',
  'their',
  'would',
  'could',
  'should',
  'what',
  'when',
  'where',
  'which',
  'will',
  'been',
  'were',
  'they',
  'them',
  'than',
  'then',
  'you',
  'our',
  'out',
  'are',
  'was',
  'but',
  'not',
  'can',
  'all',
  'has',
  'had',
  'his',
  'her',
  'its',
  'who',
  'why',
  'how',
  'one',
  'two',
  'new',
  'more',
  'some',
  'most',
  'also',
  'say',
  'said',
  'very',
  'may',
  'might',
  'over',
  'under',
  'after',
  'before',
]);

function stripHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text: string) {
  const cleaned = stripHtml(text).replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const byPunctuation = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (byPunctuation.length > 1) {
    return byPunctuation.flatMap((item) =>
      item
        .split(/\s*[,:;]\s+/)
        .map((part) => part.trim())
        .filter((part) => part.length > 10),
    );
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  const chunked: string[] = [];
  for (let i = 0; i < words.length; i += 14) {
    const chunk = words.slice(i, i + 14).join(' ').trim();
    if (chunk) chunked.push(chunk);
  }
  return chunked.length ? chunked : [cleaned];
}

function pickKeywords(sentence: string, limit = 4) {
  const words = sentence
    .toLowerCase()
    .match(/[a-z]+(?:'[a-z]+)?/g)
    ?.filter((word) => word.length >= 4 && !STOP_WORDS.has(word)) ?? [];

  return Array.from(new Set(words)).slice(0, limit);
}

export function buildPodcastPracticeSentences(episode: PodcastEpisode, limit = 5): PracticeSentence[] {
  const transcriptText = String(episode.transcriptText || '').trim();
  const isReady = episode.transcriptStatus === 'ready' && transcriptText.length > 80;
  if (!isReady) {
    return [];
  }

  const sourceText = transcriptText;
  const segments = splitSentences(sourceText);
  const fallback = splitSentences(episode.description);
  const merged = Array.from(new Set([...segments, ...fallback])).filter((item) => item.length > 8);
  const selected = merged.slice(0, limit);

  if (!selected.length) {
    return [
      {
        id: 1,
        en: episode.title || 'Podcast lesson',
        note: episode.source,
        keywords: pickKeywords(episode.title || episode.source),
      },
    ];
  }

  while (selected.length < limit && selected.length > 0) {
    selected.push(selected[selected.length - 1]);
  }

  return selected.slice(0, limit).map((sentence, index) => ({
    id: index + 1,
    en: sentence,
    note: index === 0 ? episode.source : 'Podcast excerpt',
    keywords: pickKeywords(sentence, 5),
  }));
}
