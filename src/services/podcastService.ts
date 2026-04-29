export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  audioUrl: string;
  sourceUrl: string;
  source: string;
  transcriptStatus?: 'ready' | 'pending' | 'unavailable';
  transcriptText?: string;
  enclosure?: {
    link?: string;
    url?: string;
    href?: string;
  };
}

function stripHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isTranscriptNoise(text: string) {
  const normalized = text.toLowerCase();
  if (!normalized || normalized.length < 20) return true;
  return /adswizz|privacy|cookie|newsletter|subscribe|sign up|all rights reserved|download the app|follow us/i.test(
    normalized,
  );
}

function collectArticleParagraphs(doc: Document) {
  const article = doc.querySelector('article') || doc.body;
  if (!article) return [];

  const paragraphs = Array.from(article.querySelectorAll('p'))
    .map((node) => stripHtml(node.textContent || ''))
    .filter((text) => !isTranscriptNoise(text));

  if (paragraphs.length) return paragraphs;

  const bodyText = stripHtml(article.textContent || '');
  return bodyText && !isTranscriptNoise(bodyText) ? [bodyText] : [];
}

function normalizeUrl(url: string, baseUrl: string) {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

function toProxyUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('voanews.com')) {
      return `/proxy/voa${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    if (parsed.hostname.includes('npr.org')) {
      return `/proxy/npr${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return url;
  } catch {
    return url;
  }
}

async function fetchTextWithProxy(url: string): Promise<string | null> {
  try {
    const response = await fetch(toProxyUrl(url), {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml, text/html, */*',
      },
    });
    if (!response.ok) return null;
    return response.text();
  } catch {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml, text/html, */*',
        },
      });
      if (!response.ok) return null;
      return response.text();
    } catch {
      return null;
    }
  }
}

function parseRssXml(xml: string, source: string, feedUrl: string, limit: number): PodcastEpisode[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) return [];

  const items = Array.from(doc.querySelectorAll('item')).slice(0, limit);
  return items
    .map((item, index) => {
      const title = stripHtml(item.querySelector('title')?.textContent ?? '');
      const description = stripHtml(
        item.querySelector('description')?.textContent ??
          item.querySelector('content\\:encoded')?.textContent ??
          item.querySelector('summary')?.textContent ??
          '',
      );
      const enclosure = item.querySelector('enclosure');
      const media = item.querySelector('media\\:content');
      const audioUrl =
        enclosure?.getAttribute('url') ||
        enclosure?.getAttribute('href') ||
        media?.getAttribute('url') ||
        media?.getAttribute('src') ||
        '';
      const sourceUrl = item.querySelector('link')?.textContent?.trim() || feedUrl;

      return {
        id: `${source}-${index}-${item.querySelector('guid')?.textContent?.trim() || title || source}`,
        title,
        description,
        publishedAt: item.querySelector('pubDate')?.textContent?.trim() || '',
        audioUrl,
        sourceUrl,
        source,
        transcriptStatus: 'unavailable' as const,
        transcriptText: '',
        enclosure: {
          link: audioUrl,
          url: audioUrl,
        },
      };
    })
    .filter((item) => item.title && item.audioUrl);
}

function parseVoaIndexPage(html: string, baseUrl: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const anchors = Array.from(doc.querySelectorAll('a[href*="/a/"]'));
  const links = anchors
    .map((node) => (node as HTMLAnchorElement).href || node.getAttribute('href') || '')
    .filter(Boolean)
    .map((href) => normalizeUrl(href, baseUrl))
    .filter((href) => /\/a\/[^/]+\.html/i.test(href));
  return Array.from(new Set(links));
}

function parseVoaArticlePage(html: string, pageUrl: string, source: string): PodcastEpisode | null {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (doc.querySelector('parsererror')) return null;

  const title =
    stripHtml(doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '') ||
    stripHtml(doc.querySelector('h1')?.textContent || '') ||
    '';
  const description =
    stripHtml(doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '') ||
    stripHtml(doc.querySelector('meta[name="description"]')?.getAttribute('content') || '') ||
    stripHtml(doc.querySelector('article p')?.textContent || '') ||
    '';
  const transcriptParagraphs = collectArticleParagraphs(doc);
  const transcriptText = transcriptParagraphs.join('\n\n').trim();
  const publishedAt =
    doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
    doc.querySelector('time')?.getAttribute('datetime') ||
    doc.querySelector('time')?.textContent?.trim() ||
    '';

  const audioAnchor = Array.from(doc.querySelectorAll('a[href]')).find((node) => {
    const href = node.getAttribute('href') || '';
    return /mp3|audio|download/i.test(href) || /mp3|audio/i.test(node.textContent || '');
  }) as HTMLAnchorElement | undefined;
  const audioUrl = audioAnchor?.href || audioAnchor?.getAttribute('href') || '';

  if (!title || !audioUrl) return null;

  return {
    id: `${source}-${pageUrl}`,
    title,
    description,
    publishedAt,
    audioUrl,
    sourceUrl: pageUrl,
    source,
    transcriptStatus: transcriptText.length >= 200 ? 'ready' : description.length >= 120 ? 'pending' : 'unavailable',
    transcriptText: transcriptText || description,
    enclosure: {
      link: audioUrl,
      url: audioUrl,
      href: audioUrl,
    },
  };
}

async function fetchVoaByEpisodesPage(indexUrl: string, limit: number) {
  const html = await fetchTextWithProxy(indexUrl);
  if (!html) return [];

  const episodeLinks = parseVoaIndexPage(html, indexUrl).slice(0, limit);
  const episodes: PodcastEpisode[] = [];
  for (const pageUrl of episodeLinks) {
    const pageHtml = await fetchTextWithProxy(pageUrl);
    if (!pageHtml) continue;
    const episode = parseVoaArticlePage(pageHtml, pageUrl, 'VOA Learning English');
    if (episode) episodes.push(episode);
  }
  return episodes;
}

async function fetchPodcastXml(feedUrl: string, source: string, limit: number) {
  const text = await fetchTextWithProxy(feedUrl);
  if (!text) return [];
  const parsed = parseRssXml(text, source, feedUrl, limit);
  if (parsed.length) return parsed;
  return [];
}

export async function fetchRssFeed(feedUrl: string, source: string, limit = 8): Promise<PodcastEpisode[]> {
  if (!feedUrl) return [];
  return fetchPodcastXml(feedUrl, source, limit);
}

export async function fetchVoaPodcastEpisodes(limit = 6): Promise<PodcastEpisode[]> {
  const envFeed =
    (import.meta.env.VITE_VOA_PODCAST_INDEX_URL as string | undefined) ||
    (import.meta.env.VITE_VOA_RSS_URL as string | undefined) ||
    '';
  const feedUrl = /\/episodes\b|\/a\/.+\.html\b/i.test(envFeed)
    ? envFeed
    : 'https://learningenglish.voanews.com/z/1689/episodes';

  const viaEpisodesPage = await fetchVoaByEpisodesPage(feedUrl, limit).catch(() => []);
  if (viaEpisodesPage.length) return viaEpisodesPage;

  const viaRss = await fetchPodcastXml(feedUrl, 'VOA Learning English', limit).catch(() => []);
  return viaRss;
}

export function getPodcastFallbackFeed() {
  const envFallback = import.meta.env.VITE_BBC_6MIN_RSS_URL as string | undefined;
  return /npr\.org/i.test(envFallback || '') ? envFallback! : 'https://feeds.npr.org/500005/podcast.xml';
}
