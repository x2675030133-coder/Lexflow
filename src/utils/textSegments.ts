export type WordToken = {
  text: string;
  isWordLike: boolean;
};

function normalizeText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getSegmenter(granularity: 'sentence' | 'word') {
  if (typeof Intl === 'undefined' || typeof Intl.Segmenter === 'undefined') return null;
  try {
    return new Intl.Segmenter('en', { granularity });
  } catch {
    return null;
  }
}

export function splitEnglishSentences(text: string) {
  const cleaned = normalizeText(text);
  if (!cleaned) return [];

  const segmenter = getSegmenter('sentence');
  if (segmenter) {
    const segments = Array.from(segmenter.segment(cleaned))
      .map((item) => String(item.segment || '').trim())
      .filter(Boolean);
    if (segments.length > 0) {
      return segments;
    }
  }

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

export function tokenizeEnglishWords(text: string): WordToken[] {
  const cleaned = String(text || '');
  if (!cleaned.trim()) return [];

  const segmenter = getSegmenter('word');
  if (segmenter) {
    return Array.from(segmenter.segment(cleaned))
      .map((item) => ({
        text: String(item.segment || ''),
        isWordLike: Boolean(item.isWordLike),
      }))
      .filter((item) => item.text.length > 0);
  }

  const matches = cleaned.match(/[A-Za-z]+(?:'[A-Za-z]+)?|\s+|[^\w\s]+/g) || [cleaned];
  return matches
    .map((text) => ({
      text,
      isWordLike: /[A-Za-z]+(?:'[A-Za-z]+)?/.test(text),
    }))
    .filter((item) => item.text.length > 0);
}
