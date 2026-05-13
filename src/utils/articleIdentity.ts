import type { Article } from '../data/articles';

const TRACKING_PARAMS = new Set([
  'fbclid',
  'gclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'ref',
  'ref_src',
  'source',
  'spm',
  'utm_campaign',
  'utm_content',
  'utm_medium',
  'utm_source',
  'utm_term',
]);

function normalizeText(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(value: string) {
  return normalizeText(value).replace(/\s*(?:[\[(（【]?\d+[\])）】]?)\s*$/, '').trim();
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function canonicalizeUrl(value: string | undefined | null) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw, 'https://example.com');
    url.hash = '';

    for (const key of Array.from(url.searchParams.keys())) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }

    const search = Array.from(url.searchParams.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, itemValue]) => `${key}=${itemValue}`)
      .join('&');

    return `${url.origin}${url.pathname}${search ? `?${search}` : ''}`;
  } catch {
    return normalizeText(raw);
  }
}

export function getArticleFingerprint(article: Pick<Article, 'titleEn' | 'titleZh' | 'source' | 'sourceUrl' | 'paragraphs' | 'vocabulary'>) {
  const lead = article.paragraphs
    .slice(0, 3)
    .map((paragraph) => normalizeText(paragraph.en))
    .filter(Boolean)
    .join(' | ');

  const vocabularySeed = article.vocabulary
    .slice(0, 5)
    .map((item) => normalizeText(item.word))
    .filter(Boolean)
    .join(' | ');

  return hashString(
    [
      canonicalizeUrl(article.sourceUrl),
      normalizeTitle(article.titleEn),
      normalizeTitle(article.titleZh),
      normalizeText(article.source),
      lead,
      vocabularySeed,
    ]
      .filter(Boolean)
      .join(' || '),
  );
}

export function getArticleIdentity(article: Pick<Article, 'titleEn' | 'titleZh' | 'source' | 'sourceUrl' | 'paragraphs' | 'vocabulary'>) {
  return `reading:${getArticleFingerprint(article)}`;
}

export function getArticleLearningKeys(article: Article) {
  const keys = new Set<string>();
  const id = String(article.id || '').trim();
  if (id) keys.add(id);

  const identity = getArticleIdentity(article);
  if (identity) keys.add(identity);

  const canonicalUrl = canonicalizeUrl(article.sourceUrl);
  if (canonicalUrl) keys.add(`url:${canonicalUrl}`);

  return Array.from(keys);
}
