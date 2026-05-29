import http from 'node:http';
import tls from 'node:tls';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { URL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile() {
  const serverDir = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(serverDir, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) continue;

    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const PORT = Number(process.env.PORT || 3001);
const DEEPSEEK_ENDPOINT = process.env.DEEPSEEK_API_ENDPOINT || process.env.READING_AI_ENDPOINT || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || process.env.READING_AI_MODEL || 'deepseek-chat';
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || process.env.READING_AI_API_KEY || '';
const GUARDIAN_KEY = process.env.GUARDIAN_API_KEY || process.env.READING_GUARDIAN_KEY || '';
const NEWSAPI_KEY = process.env.NEWSAPI_KEY || process.env.READING_NEWSAPI_KEY || '';
const DEEPL_KEY = process.env.DEEPL_API_KEY || '';
const DEEPL_BASE = process.env.DEEPL_API_BASE || 'https://api-free.deepl.com';
const PEXELS_KEY = process.env.PEXELS_API_KEY || '';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const EMAIL_CODE_TTL_MINUTES = Number(process.env.EMAIL_CODE_TTL_MINUTES || 10);
const EMAIL_CODE_COOLDOWN_SECONDS = Number(process.env.EMAIL_CODE_COOLDOWN_SECONDS || 60);
const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SERVER_DIR, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const EXTERNAL_API_TIMEOUT_MS = Number(process.env.EXTERNAL_API_TIMEOUT_MS || 20000);
const PODCAST_CACHE_DIR = path.join(PROJECT_ROOT, '.cache');
const PODCAST_CACHE_FILE = path.join(PODCAST_CACHE_DIR, 'podcast-library.json');
const PODCAST_CACHE_TTL_MS = Number(process.env.PODCAST_CACHE_TTL_MS || 12 * 60 * 60 * 1000);
const PODCAST_SOURCE_LIMIT = Number(process.env.PODCAST_SOURCE_LIMIT || 8);
const READING_PROGRESS_FILE = path.join(PODCAST_CACHE_DIR, 'reading-progress.json');
const USER_PROGRESS_FILE = path.join(PODCAST_CACHE_DIR, 'user-progress.json');
const READING_LIBRARY_DIR = path.join(SERVER_DIR, 'data');
const READING_LIBRARY_FILE = path.join(READING_LIBRARY_DIR, 'reading-library.json');
const READING_LIBRARY_META_FILE = path.join(READING_LIBRARY_DIR, 'reading-library-meta.json');
const GENERATED_READING_LIBRARY_FILE = path.join(READING_LIBRARY_DIR, 'generated-reading.json');
const GENERATED_READING_META_FILE = path.join(READING_LIBRARY_DIR, 'generated-reading-meta.json');
const READING_GENERATOR_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'generate-reading-content.mjs');
const ADMIN_ACTIVITY_FILE = path.join(PODCAST_CACHE_DIR, 'admin-activity.json');
const ADMIN_DASHBOARD_TOKEN = String(process.env.ADMIN_DASHBOARD_TOKEN || '').trim();
const SUPABASE_URL = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const SUPABASE_USERS_CACHE_MS = Number(process.env.SUPABASE_USERS_CACHE_MS || 5 * 60 * 1000);
const SUPABASE_USERS_PAGE_SIZE = Math.max(1, Math.min(1000, Number(process.env.SUPABASE_USERS_PAGE_SIZE || 1000)));

const emailCodes = new Map();
let podcastLibraryCache = null;
let podcastLibraryRefreshPromise = null;
let readingProgressCache = null;
let userProgressCache = null;
let adminActivityCache = null;
let readingLibraryCache = null;
let readingLibraryRefreshPromise = null;
let supabaseAdminClient = null;
let supabaseUserCountCache = {
  count: null,
  fetchedAt: 0,
  source: 'activity',
  error: '',
};

function createTimeoutError(label, timeoutMs) {
  return new Error(`${label} timed out after ${Math.ceil(timeoutMs / 1000)}s`);
}

function ensureCacheDir() {
  if (!fs.existsSync(PODCAST_CACHE_DIR)) {
    fs.mkdirSync(PODCAST_CACHE_DIR, { recursive: true });
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function readJsonObjectFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeJsonObjectFile(filePath, payload) {
  try {
    ensureCacheDir();
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  } catch {
    // ignore cache write failures
  }
}

function getSupabaseAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdminClient;
}

async function getRegisteredUsersCount() {
  const now = Date.now();
  if (supabaseUserCountCache.count !== null && now - supabaseUserCountCache.fetchedAt < SUPABASE_USERS_CACHE_MS) {
    return supabaseUserCountCache;
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    const fallbackCount = Object.values(readAdminActivityStore()).filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry) && entry.verifiedAt).length;
    supabaseUserCountCache = {
      count: fallbackCount,
      fetchedAt: now,
      source: 'activity',
      error: SUPABASE_SERVICE_ROLE_KEY ? 'Missing SUPABASE_URL' : 'Missing SUPABASE_SERVICE_ROLE_KEY',
    };
    return supabaseUserCountCache;
  }

  let page = 1;
  let total = 0;

  try {
    while (true) {
      const { data, error } = await client.auth.admin.listUsers({
        page,
        perPage: SUPABASE_USERS_PAGE_SIZE,
      });

      if (error) {
        throw error;
      }

      const users = Array.isArray(data?.users) ? data.users : [];
      total += users.length;

      if (users.length < SUPABASE_USERS_PAGE_SIZE) {
        break;
      }

      page += 1;
      if (page > 1000) {
        break;
      }
    }

    supabaseUserCountCache = {
      count: total,
      fetchedAt: now,
      source: 'supabase',
      error: '',
    };
  } catch (error) {
    const fallbackCount = Object.values(readAdminActivityStore()).filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry) && entry.verifiedAt).length;
    supabaseUserCountCache = {
      count: fallbackCount,
      fetchedAt: now,
      source: 'activity',
      error: error instanceof Error ? error.message : 'Failed to load Supabase user count',
    };
  }

  return supabaseUserCountCache;
}

async function fetchWithTimeout(input, init = {}, label = 'Request', timeoutMs = EXTERNAL_API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (controller.signal.aborted) {
      throw createTimeoutError(label, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function setJsonHeaders(res, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
}

function sendJson(res, status, payload) {
  setJsonHeaders(res, status);
  res.end(JSON.stringify(payload));
}

function sendText(res, status, content, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(content);
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.mjs':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.ico':
      return 'image/x-icon';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}

function serveStaticFile(res, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }

  const content = fs.readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': getMimeType(filePath),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(content);
  return true;
}

function serveFrontend(req, res, url) {
  if (req.method !== 'GET') return false;
  if (url.pathname.startsWith('/api/')) return false;

  const requestPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const normalizedPath = path.normalize(decodeURIComponent(requestPath)).replace(/^([/\\])+/, '');
  const candidate = path.resolve(DIST_DIR, normalizedPath);

  if (candidate.startsWith(DIST_DIR) && serveStaticFile(res, candidate)) {
    return true;
  }

  const indexPath = path.join(DIST_DIR, 'index.html');
  if (serveStaticFile(res, indexPath)) {
    return true;
  }

  sendText(res, 404, 'Frontend build not found. Run npm run build first.');
  return true;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtmlEntities(value = '') {
  return String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)));
}

function stripHtml(value = '') {
  return decodeHtmlEntities(String(value))
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(source, tagName) {
  const pattern = new RegExp(`<${escapeRegExp(tagName)}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapeRegExp(tagName)}>`, 'i');
  const match = String(source).match(pattern);
  return match ? decodeHtmlEntities(match[1].trim()) : '';
}

function extractAttr(source, tagName, attrName) {
  const pattern = new RegExp(`<${escapeRegExp(tagName)}[^>]*\\b${escapeRegExp(attrName)}="([^"]+)"[^>]*>`, 'i');
  const match = String(source).match(pattern);
  return match ? decodeHtmlEntities(match[1].trim()) : '';
}

function normalizePodcastUrl(url, baseUrl) {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return decodeHtmlEntities(String(url || '').trim());
  }
}

function getPodcastSourceConfig() {
  const voaSource =
    process.env.VOA_PODCAST_INDEX_URL ||
    process.env.VOA_RSS_URL ||
    process.env.VITE_VOA_PODCAST_INDEX_URL ||
    process.env.VITE_VOA_RSS_URL ||
    'https://learningenglish.voanews.com/z/1689/episodes';

  const fallbackSource =
    process.env.PODCAST_FALLBACK_RSS_URL ||
    process.env.BBC_6MIN_RSS_URL ||
    process.env.VITE_BBC_6MIN_RSS_URL ||
    'https://feeds.npr.org/500005/podcast.xml';

  return [
    { source: 'VOA Learning English', url: voaSource, kind: 'voa' },
    { source: 'NPR News Podcast', url: fallbackSource, kind: 'rss' },
  ];
}

function parsePodcastRss(xml, source, feedUrl, limit) {
  const items = String(xml).match(/<item\b[\s\S]*?<\/item>/gi) || [];
  return items.slice(0, limit).map((item, index) => {
    const title = stripHtml(extractTag(item, 'title'));
    const description = stripHtml(
      extractTag(item, 'description') ||
        extractTag(item, 'content:encoded') ||
        extractTag(item, 'summary') ||
        extractTag(item, 'itunes:summary'),
    );
    const enclosureUrl = extractAttr(item, 'enclosure', 'url') || extractAttr(item, 'enclosure', 'href');
    const mediaUrl = extractAttr(item, 'media:content', 'url') || extractAttr(item, 'media:content', 'src');
    const link = stripHtml(extractTag(item, 'link')) || feedUrl;
    const publishedAt = stripHtml(extractTag(item, 'pubDate') || extractTag(item, 'published') || extractTag(item, 'dc:date'));
    const guid = stripHtml(extractTag(item, 'guid'));
    const audioUrl = enclosureUrl || mediaUrl || '';

    return {
      id: `${source}-${guid || link || title || index}`.replace(/\s+/g, '-'),
      title,
      description,
      publishedAt,
      audioUrl,
      sourceUrl: link,
      source,
      transcriptStatus: 'unavailable',
      transcriptText: '',
      enclosure: audioUrl
        ? {
            link: audioUrl,
            url: audioUrl,
            href: audioUrl,
          }
        : undefined,
    };
  }).filter((item) => item.title && item.audioUrl);
}

function parseVoaIndexLinks(html, baseUrl) {
  const links = new Set();
  const patterns = [
    /href="([^"]*\/a\/[^"]+\.html[^"]*)"/gi,
    /href='([^']*\/a\/[^']+\.html[^']*)'/gi,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(String(html))) !== null) {
      const href = normalizePodcastUrl(match[1], baseUrl);
      if (/\/a\/[^/]+\.html/i.test(href)) {
        links.add(href);
      }
    }
  });

  return Array.from(links);
}

function parseVoaArticlePage(html, pageUrl, source) {
  const title =
    stripHtml(
      extractMetaContent(html, 'property', 'og:title') ||
        extractMetaContent(html, 'name', 'title') ||
        extractFirstTagContent(html, 'h1'),
    );
  const description =
    stripHtml(
      extractMetaContent(html, 'property', 'og:description') ||
        extractMetaContent(html, 'name', 'description') ||
        extractFirstTagContent(html, 'article p') ||
        extractFirstTagContent(html, 'p'),
    );
  const transcriptParagraphs = extractParagraphs(html);
  const transcriptText = transcriptParagraphs.join('\n\n').trim();
  const publishedAt = stripHtml(
    extractMetaContent(html, 'property', 'article:published_time') ||
      extractFirstTagContent(html, 'time') ||
      '',
  );

  const audioUrl =
    findFirstUrl(String(html), /https?:\/\/[^"'<> ]+\.mp3[^"'<> ]*/i) ||
    findFirstUrl(String(html), /href="([^"]*(?:mp3|audio)[^"]*)"/i) ||
    findFirstUrl(String(html), /href='([^']*(?:mp3|audio)[^']*)'/i);

  if (!title || !audioUrl) return null;

  return {
    id: `voa-${pageUrl}`.replace(/\s+/g, '-'),
    title,
    description,
    publishedAt,
    audioUrl: normalizePodcastUrl(audioUrl, pageUrl),
    sourceUrl: pageUrl,
    source,
    transcriptStatus: transcriptText.length >= 200 ? 'ready' : description.length >= 120 ? 'pending' : 'unavailable',
    transcriptText: transcriptText || description,
    enclosure: {
      link: normalizePodcastUrl(audioUrl, pageUrl),
      url: normalizePodcastUrl(audioUrl, pageUrl),
      href: normalizePodcastUrl(audioUrl, pageUrl),
    },
  };
}

function extractMetaContent(html, attrName, attrValue) {
  const pattern = new RegExp(
    `<meta[^>]*\\b${escapeRegExp(attrName)}=["']${escapeRegExp(attrValue)}["'][^>]*\\bcontent=["']([^"']+)["'][^>]*>`,
    'i',
  );
  const match = String(html).match(pattern);
  return match ? decodeHtmlEntities(match[1].trim()) : '';
}

function extractFirstTagContent(html, selectorLike) {
  const tagName = selectorLike.trim().toLowerCase();
  if (tagName === 'article p') {
    const match = String(html).match(/<article[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
    return match ? decodeHtmlEntities(match[1].trim()) : '';
  }

  const pattern = new RegExp(`<${escapeRegExp(tagName)}[^>]*>([\\s\\S]*?)<\\/${escapeRegExp(tagName)}>`, 'i');
  const match = String(html).match(pattern);
  return match ? decodeHtmlEntities(match[1].trim()) : '';
}

function extractParagraphs(html) {
  const articleMatch = String(html).match(/<article[\s\S]*?<\/article>/i);
  const scope = articleMatch ? articleMatch[0] : String(html);
  const paragraphs = [];
  const pattern = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match;

  while ((match = pattern.exec(scope)) !== null) {
    const text = stripHtml(match[1]);
    if (text.length < 20) continue;
    if (/adswizz|privacy|cookie|newsletter|subscribe|sign up|follow us|all rights reserved/i.test(text)) continue;
    paragraphs.push(text);
  }

  if (paragraphs.length) return paragraphs;

  const fallback = stripHtml(scope);
  if (fallback && fallback.length >= 80) return [fallback];
  return [];
}

function findFirstUrl(source, pattern) {
  const match = String(source).match(pattern);
  if (!match) return '';
  return match[1] || match[0] || '';
}

async function fetchPodcastText(url) {
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml, text/html, */*',
      },
    },
    'Podcast fetch',
  );

  if (!response.ok) {
    throw new Error(`Podcast request failed: ${response.status}`);
  }

  return response.text();
}

async function fetchPodcastRssFeed(feedUrl, source, limit) {
  const text = await fetchPodcastText(feedUrl);
  return parsePodcastRss(text, source, feedUrl, limit);
}

async function fetchVoaPodcastEpisodes(limit) {
  const { source, url } = getPodcastSourceConfig()[0];
  if (!url) return [];

  if (/\/episodes\b|\/a\/[^/]+\.html\b/i.test(url)) {
    const indexHtml = await fetchPodcastText(url);
    const episodeLinks = parseVoaIndexLinks(indexHtml, url).slice(0, limit);
    const episodes = [];
    for (const pageUrl of episodeLinks) {
      try {
        const pageHtml = await fetchPodcastText(pageUrl);
        const episode = parseVoaArticlePage(pageHtml, pageUrl, source);
        if (episode) episodes.push(episode);
      } catch {
        continue;
      }
    }
    return episodes;
  }

  return fetchPodcastRssFeed(url, source, limit);
}

function readPodcastCacheFile() {
  try {
    if (!fs.existsSync(PODCAST_CACHE_FILE)) return null;
    const raw = fs.readFileSync(PODCAST_CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.episodes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePodcastCacheFile(payload) {
  try {
    if (!fs.existsSync(PODCAST_CACHE_DIR)) {
      fs.mkdirSync(PODCAST_CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(PODCAST_CACHE_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch {
    // ignore cache write failures
  }
}

function readReadingProgressFile() {
  try {
    if (!fs.existsSync(READING_PROGRESS_FILE)) return null;
    const raw = fs.readFileSync(READING_PROGRESS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeReadingProgressFile(payload) {
  try {
    if (!fs.existsSync(PODCAST_CACHE_DIR)) {
      fs.mkdirSync(PODCAST_CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(READING_PROGRESS_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch {
    // ignore cache write failures
  }
}

function normalizeReadingIds(articleIds = []) {
  return Array.from(
    new Set(
      Array.isArray(articleIds)
        ? articleIds.map((item) => String(item || '').trim()).filter(Boolean)
        : [],
    ),
  );
}

function readReadingProgressStore() {
  const cached = readingProgressCache || readReadingProgressFile();
  if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
    readingProgressCache = cached;
    return cached;
  }
  return {};
}

function getReadingProgressEntry(email) {
  const store = readReadingProgressStore();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const entry = normalizedEmail ? store[normalizedEmail] : null;
  return {
    email: normalizedEmail,
    articleIds: normalizeReadingIds(entry?.articleIds || []),
    updatedAt: typeof entry?.updatedAt === 'string' ? entry.updatedAt : '',
  };
}

function setReadingProgressEntry(email, articleIds = []) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const store = readReadingProgressStore();
  const payload = {
    ...store,
    [normalizedEmail]: {
      articleIds: normalizeReadingIds(articleIds),
      updatedAt: new Date().toISOString(),
    },
  };

  readingProgressCache = payload;
  writeReadingProgressFile(payload);
  touchAdminActivity(normalizedEmail, 'reading-progress');
  return getReadingProgressEntry(normalizedEmail);
}

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeJsonValueFile(filePath, payload) {
  try {
    ensureDirectory(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  } catch {
    // ignore cache write failures
  }
}

function normalizeReadingText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function canonicalizeReadingUrl(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw, 'https://lexflow.local');
    url.hash = '';

    for (const key of Array.from(url.searchParams.keys())) {
      if (/^(utm_|fbclid|gclid|igshid|mc_cid|mc_eid|ref|source|spm)/i.test(key)) {
        url.searchParams.delete(key);
      }
    }

    const search = Array.from(url.searchParams.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, itemValue]) => `${key}=${itemValue}`)
      .join('&');

    return `${url.origin}${url.pathname}${search ? `?${search}` : ''}`;
  } catch {
    return normalizeReadingText(raw);
  }
}

function hashReadingString(value = '') {
  let hash = 2166136261;
  const text = String(value || '');

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function getReadingArticleIdentity(article = {}) {
  const paragraphs = Array.isArray(article.paragraphs) ? article.paragraphs : [];
  const vocabulary = Array.isArray(article.vocabulary) ? article.vocabulary : [];
  const lead = paragraphs
    .slice(0, 3)
    .map((paragraph) => normalizeReadingText(paragraph?.en || ''))
    .filter(Boolean)
    .join(' | ');
  const vocabSeed = vocabulary
    .slice(0, 5)
    .map((item) => normalizeReadingText(item?.word || ''))
    .filter(Boolean)
    .join(' | ');

  return `reading:${hashReadingString(
    [
      canonicalizeReadingUrl(article.sourceUrl || article.url || ''),
      normalizeReadingText(article.titleEn || article.title || ''),
      normalizeReadingText(article.titleZh || article.title || ''),
      normalizeReadingText(article.source || ''),
      lead,
      vocabSeed,
    ]
      .filter(Boolean)
      .join(' || '),
  )}`;
}

function normalizeReadingArticle(article, index = 0) {
  if (!article || typeof article !== 'object' || Array.isArray(article)) {
    return null;
  }

  const titleEn = String(article.titleEn || article.title || '').trim();
  const titleZh = String(article.titleZh || article.title || '').trim();
  const category = ['technology', 'culture', 'education', 'environment', 'news'].includes(article.category)
    ? article.category
    : 'news';

  const paragraphs = Array.isArray(article.paragraphs)
    ? article.paragraphs
        .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
        .map((item) => ({
          en: String(item.en || '').trim(),
          zh: String(item.zh || '').trim(),
        }))
        .filter((item) => item.en && item.zh)
    : [];

  const vocabulary = Array.isArray(article.vocabulary)
    ? article.vocabulary
        .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
        .map((item) => ({
          word: String(item.word || '').trim(),
          definition: String(item.definition || '').trim(),
          definitionZh: String(item.definitionZh || '').trim() || undefined,
          phonetic: String(item.phonetic || '').trim(),
        }))
        .filter((item) => item.word && item.definition)
    : [];

  return {
    id: String(article.id || `reading-${index + 1}-${hashReadingString(titleEn || titleZh || index)}`),
    titleEn: titleEn || `Reading Article ${index + 1}`,
    titleZh: titleZh || titleEn || `阅读文章 ${index + 1}`,
    category,
    date: /^\d{4}-\d{2}-\d{2}$/.test(article.date) ? article.date : new Date().toISOString().slice(0, 10),
    source: String(article.source || 'AI Editor').trim() || 'AI Editor',
    sourceUrl: String(article.sourceUrl || article.url || '').trim() || undefined,
    paragraphs,
    vocabulary,
  };
}

function normalizeReadingLibraryMeta(meta = {}, articleCount) {
  return {
    generatedAt: typeof meta.generatedAt === 'string' ? meta.generatedAt : new Date().toISOString(),
    articleCount: Number.isFinite(Number(articleCount)) ? Number(articleCount) : Number(meta.articleCount || articleCount || 0),
    sourceMode: meta.sourceMode === 'model' ? 'model' : 'fallback',
    provider: typeof meta.provider === 'string' ? meta.provider : 'deepseek',
    sourceBriefCount: Number.isFinite(Number(meta.sourceBriefCount)) ? Number(meta.sourceBriefCount) : 0,
    sourceNames: Array.isArray(meta.sourceNames) ? meta.sourceNames.map((item) => String(item || '').trim()).filter(Boolean) : [],
    targetArticleCount: Number.isFinite(Number(meta.targetArticleCount)) ? Number(meta.targetArticleCount) : undefined,
    generationSchedule:
      meta.generationSchedule && typeof meta.generationSchedule === 'object'
        ? {
            hour: Number.isFinite(Number(meta.generationSchedule.hour)) ? Number(meta.generationSchedule.hour) : 2,
            minute: Number.isFinite(Number(meta.generationSchedule.minute)) ? Number(meta.generationSchedule.minute) : 0,
            label: String(meta.generationSchedule.label || '每天 02:00'),
          }
        : undefined,
    batchIndex: Number.isFinite(Number(meta.batchIndex)) ? Number(meta.batchIndex) : 0,
  };
}

function dedupeReadingArticles(articles = []) {
  const seen = new Set();
  const unique = [];

  for (const article of articles) {
    const normalized = normalizeReadingArticle(article, unique.length);
    if (!normalized) continue;

    const identity = getReadingArticleIdentity(normalized);
    if (seen.has(identity)) continue;
    seen.add(identity);
    unique.push(normalized);
  }

  unique.sort((left, right) => {
    const leftDate = Date.parse(left.date || '');
    const rightDate = Date.parse(right.date || '');
    if (Number.isNaN(leftDate) && Number.isNaN(rightDate)) return 0;
    if (Number.isNaN(leftDate)) return 1;
    if (Number.isNaN(rightDate)) return -1;
    return rightDate - leftDate;
  });

  return unique;
}

function readReadingLibrarySnapshot(filePath, metaPath = READING_LIBRARY_META_FILE) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      const meta = readJsonObjectFile(metaPath) || {};
      return {
        articles: dedupeReadingArticles(parsed),
        meta: normalizeReadingLibraryMeta(meta, parsed.length),
        updatedAt: new Date().toISOString(),
        batchIndex: Number.isFinite(Number(meta.batchIndex)) ? Number(meta.batchIndex) : 0,
      };
    }

    if (!parsed || typeof parsed !== 'object') return null;

    const articles = Array.isArray(parsed.articles) ? parsed.articles : [];
    const meta = parsed.meta && typeof parsed.meta === 'object' ? parsed.meta : readJsonObjectFile(metaPath) || {};
    return {
      articles: dedupeReadingArticles(articles),
      meta: normalizeReadingLibraryMeta(meta, articles.length),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      batchIndex: Number.isFinite(Number(parsed.batchIndex)) ? Number(parsed.batchIndex) : Number(meta.batchIndex || 0),
    };
  } catch {
    return null;
  }
}

function writeReadingLibrarySnapshot(snapshot) {
  const payload = {
    articles: dedupeReadingArticles(snapshot.articles || []),
    meta: normalizeReadingLibraryMeta(snapshot.meta || {}, snapshot.articles?.length || 0),
    updatedAt: snapshot.updatedAt || new Date().toISOString(),
    batchIndex: Number.isFinite(Number(snapshot.batchIndex)) ? Number(snapshot.batchIndex) : Number((snapshot.meta || {}).batchIndex || 0),
  };

  readingLibraryCache = payload;
  ensureDirectory(READING_LIBRARY_DIR);
  writeJsonValueFile(READING_LIBRARY_FILE, payload);
  writeJsonValueFile(READING_LIBRARY_META_FILE, payload.meta);
  return payload;
}

function readGeneratedReadingSnapshot() {
  return (
    readReadingLibrarySnapshot(GENERATED_READING_LIBRARY_FILE, GENERATED_READING_META_FILE) ||
    readReadingLibrarySnapshot(path.join(PROJECT_ROOT, 'public', 'data', 'generated-reading.json'), path.join(PROJECT_ROOT, 'public', 'data', 'generated-reading-meta.json'))
  );
}

function getReadingLibraryStore() {
  if (readingLibraryCache && Array.isArray(readingLibraryCache.articles)) {
    return readingLibraryCache;
  }

  const persisted = readReadingLibrarySnapshot(READING_LIBRARY_FILE);
  if (persisted) {
    readingLibraryCache = persisted;
    return persisted;
  }

  const generated = readGeneratedReadingSnapshot();
  if (generated) {
    return writeReadingLibrarySnapshot(generated);
  }

  const fallback = {
    articles: dedupeReadingArticles([]),
    meta: normalizeReadingLibraryMeta({}, 0),
    updatedAt: new Date().toISOString(),
    batchIndex: 0,
  };
  readingLibraryCache = fallback;
  return fallback;
}

function refreshReadingLibraryStore() {
  if (readingLibraryRefreshPromise) {
    return readingLibraryRefreshPromise;
  }

  readingLibraryRefreshPromise = (async () => {
    const current = getReadingLibraryStore();
    const nextBatchIndex = Number(current.batchIndex || current.meta?.batchIndex || 0) + 1;
    const env = {
      ...process.env,
      READING_TARGET_ARTICLE_COUNT: String(Number(process.env.READING_TARGET_ARTICLE_COUNT || 300)),
      READING_MAX_STORED_ARTICLES: String(Number(process.env.READING_MAX_STORED_ARTICLES || 600)),
      READING_BATCH_INDEX: String(nextBatchIndex),
    };

    const result = spawnSync(process.execPath, [READING_GENERATOR_SCRIPT], {
      cwd: PROJECT_ROOT,
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || 'Failed to regenerate reading library');
    }

    const generated = readGeneratedReadingSnapshot();
    const nextArticles = dedupeReadingArticles([
      ...(current.articles || []),
      ...((generated && generated.articles) || []),
    ]);
    const meta = normalizeReadingLibraryMeta(
      {
        ...(current.meta || {}),
        ...(generated?.meta || {}),
        generatedAt: new Date().toISOString(),
        articleCount: nextArticles.length,
        targetArticleCount: Number(process.env.READING_TARGET_ARTICLE_COUNT || 300),
        batchIndex: nextBatchIndex,
        sourceNames: [...new Set(nextArticles.map((article) => article.source).filter(Boolean))],
      },
      nextArticles.length,
    );

    return writeReadingLibrarySnapshot({
      articles: nextArticles,
      meta,
      updatedAt: new Date().toISOString(),
      batchIndex: nextBatchIndex,
    });
  })();

  return readingLibraryRefreshPromise.finally(() => {
    readingLibraryRefreshPromise = null;
  });
}

function readUserProgressFile() {
  try {
    if (!fs.existsSync(USER_PROGRESS_FILE)) return null;
    const raw = fs.readFileSync(USER_PROGRESS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeUserProgressFile(payload) {
  try {
    if (!fs.existsSync(PODCAST_CACHE_DIR)) {
      fs.mkdirSync(PODCAST_CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(USER_PROGRESS_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch {
    // ignore cache write failures
  }
}

function readUserProgressStore() {
  const cached = userProgressCache || readUserProgressFile();
  if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
    userProgressCache = cached;
    return cached;
  }
  return {};
}

function readAdminActivityStore() {
  const cached = adminActivityCache || readJsonObjectFile(ADMIN_ACTIVITY_FILE);
  if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
    adminActivityCache = cached;
    return cached;
  }
  return {};
}

function touchAdminActivity(email, source = 'unknown', options = {}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const store = readAdminActivityStore();
  const now = new Date().toISOString();
  const current = store[normalizedEmail] || {};
  const sources = current.sources && typeof current.sources === 'object' && !Array.isArray(current.sources)
    ? current.sources
    : {};

  const next = {
    email: normalizedEmail,
    firstSeen: current.firstSeen || now,
    lastSeen: now,
    verifiedAt: current.verifiedAt || '',
    lastSource: source,
    sources: {
      ...sources,
      [source]: now,
    },
  };

  if (options.verified) {
    next.verifiedAt = current.verifiedAt || now;
  }

  store[normalizedEmail] = next;
  adminActivityCache = store;
  writeJsonObjectFile(ADMIN_ACTIVITY_FILE, store);
  return next;
}

async function getAdminSummary() {
  const activityStore = readAdminActivityStore();
  const userProgressStore = readUserProgressStore();
  const readingProgressStore = readReadingProgressStore();
  const activityEntries = Object.values(activityStore)
    .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
    .map((entry) => ({
      email: normalizeEmail(entry.email),
      firstSeen: typeof entry.firstSeen === 'string' ? entry.firstSeen : '',
      lastSeen: typeof entry.lastSeen === 'string' ? entry.lastSeen : '',
      verifiedAt: typeof entry.verifiedAt === 'string' ? entry.verifiedAt : '',
      lastSource: typeof entry.lastSource === 'string' ? entry.lastSource : '',
      sources: entry.sources && typeof entry.sources === 'object' && !Array.isArray(entry.sources) ? entry.sources : {},
    }))
    .filter((entry) => entry.email);

  const now = Date.now();
  const onlineCutoff = now - 5 * 60 * 1000;
  const activeTodayCutoff = new Date(new Date().toDateString()).getTime();
  const registeredUsers = await getRegisteredUsersCount();

  const recentUsers = activityEntries
    .slice()
    .sort((a, b) => Date.parse(b.lastSeen || '') - Date.parse(a.lastSeen || ''))
    .slice(0, 20)
    .map((entry) => ({
      ...entry,
      online: Date.parse(entry.lastSeen || '') >= onlineCutoff,
      activeToday: Date.parse(entry.lastSeen || '') >= activeTodayCutoff,
    }));

    const onlineUsers = activityEntries.filter((entry) => Date.parse(entry.lastSeen || '') >= onlineCutoff).length;
    const activeTodayUsers = activityEntries.filter((entry) => Date.parse(entry.lastSeen || '') >= activeTodayCutoff).length;
  const knownUsers = new Set([
    ...Object.keys(activityStore),
    ...Object.keys(userProgressStore),
    ...Object.keys(readingProgressStore),
  ].map((email) => normalizeEmail(email)).filter(Boolean)).size;

    return {
      generatedAt: new Date().toISOString(),
      registeredUsers: registeredUsers.count ?? 0,
      registeredUsersSource: registeredUsers.source,
      registeredUsersNote: registeredUsers.error,
      onlineUsers,
      activeTodayUsers,
      knownUsers,
    userProgressUsers: Object.keys(userProgressStore).length,
    readingProgressUsers: Object.keys(readingProgressStore).length,
    recentUsers,
  };
}

function normalizeProgressSnapshot(snapshot = {}) {
  const safeObject = (value, fallback = {}) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
    return value;
  };

  const safeArray = (value) => (
    Array.isArray(value)
      ? Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean)))
      : []
  );

  return {
    progress: safeObject(snapshot.progress),
    dailyStats: Array.isArray(snapshot.dailyStats) ? snapshot.dailyStats : [],
    listening: safeArray(snapshot.listening),
    podcasts: safeArray(snapshot.podcasts),
    reading: safeArray(snapshot.reading),
    readingComplete: safeArray(snapshot.readingComplete),
    readingStudy: safeObject(snapshot.readingStudy),
    pronunciation: safeObject(snapshot.pronunciation, {
      favorites: [],
      practiced: [],
      lastSelectedId: '',
      updatedAt: '',
    }),
    updatedAt: typeof snapshot.updatedAt === 'string' ? snapshot.updatedAt : new Date().toISOString(),
  };
}

function getUserProgressEntry(email) {
  const store = readUserProgressStore();
  const normalizedEmail = normalizeEmail(email);
  const entry = normalizedEmail ? store[normalizedEmail] : null;
  return {
    email: normalizedEmail,
    ...normalizeProgressSnapshot(entry || {}),
  };
}

function setUserProgressEntry(email, snapshot = {}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const store = readUserProgressStore();
  const payload = {
    ...store,
    [normalizedEmail]: {
      ...normalizeProgressSnapshot(snapshot),
      updatedAt: new Date().toISOString(),
    },
  };

  userProgressCache = payload;
  writeUserProgressFile(payload);
  touchAdminActivity(normalizedEmail, 'user-progress');
  return getUserProgressEntry(normalizedEmail);
}

function isPodcastCacheFresh(cache) {
  const lastSyncAt = cache?.meta?.lastSyncAt || '';
  if (!lastSyncAt) return false;
  const timestamp = Date.parse(lastSyncAt);
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp < PODCAST_CACHE_TTL_MS;
}

function normalizePodcastEpisodes(episodes) {
  const seen = new Set();
  return episodes
    .filter((item) => item && item.title && item.audioUrl)
    .filter((item) => {
      const key = `${item.audioUrl || ''}::${item.title || ''}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function buildPodcastLibrary({ force = false } = {}) {
  const cached = podcastLibraryCache || readPodcastCacheFile();
  if (!force && cached && isPodcastCacheFresh(cached)) {
    podcastLibraryCache = cached;
    return { ...cached, meta: { ...cached.meta, stale: false } };
  }

  if (podcastLibraryRefreshPromise) {
    return podcastLibraryRefreshPromise;
  }

  podcastLibraryRefreshPromise = (async () => {
    const sources = getPodcastSourceConfig();
    const sourceResults = [];

    for (const config of sources) {
      try {
        const episodes = config.kind === 'voa'
          ? await fetchVoaPodcastEpisodes(PODCAST_SOURCE_LIMIT)
          : await fetchPodcastRssFeed(config.url, config.source, PODCAST_SOURCE_LIMIT);
        sourceResults.push({ ...config, episodes });
      } catch (error) {
        sourceResults.push({
          ...config,
          episodes: [],
          error: error instanceof Error ? error.message : 'Unknown podcast error',
        });
      }
    }

    const mergedEpisodes = normalizePodcastEpisodes(
      sourceResults.flatMap((entry) => entry.episodes || []),
    ).sort((left, right) => (right.publishedAt || '').localeCompare(left.publishedAt || ''));

    const failedSources = sourceResults.filter((entry) => entry.error);
    const partialNotice =
      failedSources.length > 0 && mergedEpisodes.length > 0
        ? `Some podcast sources were unavailable: ${failedSources.map((entry) => entry.source).join(', ')}.`
        : '';

    const payload = {
      episodes: mergedEpisodes,
      meta: {
        generatedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
        sourceCount: sourceResults.length,
        episodeCount: mergedEpisodes.length,
        stale: false,
        sources: sourceResults.map((entry) => ({
          source: entry.source,
          count: entry.episodes.length,
          error: entry.error || null,
        })),
      },
      notice: partialNotice,
      error: mergedEpisodes.length ? '' : 'No podcast episodes available.',
    };

    podcastLibraryCache = payload;
    writePodcastCacheFile(payload);
    return payload;
  })();

  try {
    return await podcastLibraryRefreshPromise;
  } finally {
    podcastLibraryRefreshPromise = null;
  }
}

function sanitizeQuery(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickBestPexelsFile(files = []) {
  const usable = files
    .filter((file) => file.link && file.file_type === 'video/mp4')
    .sort((a, b) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)));

  return usable[0]?.link || null;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createEmailCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function encodeMailHeader(value) {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function normalizeAddress(value) {
  const match = String(value).match(/<([^>]+)>/);
  return match ? match[1] : String(value).trim();
}

function dotStuff(value) {
  return String(value).replace(/^\./gm, '..');
}

function readSmtpResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = '';

    const onData = (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) return;
      const last = lines[lines.length - 1];
      if (/^\d{3}\s/.test(last)) {
        cleanup();
        const code = Number(last.slice(0, 3));
        if (code >= 400) {
          reject(new Error(last));
        } else {
          resolve({ code, message: buffer });
        }
      }
    };

    const onError = (error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      socket.off('data', onData);
      socket.off('error', onError);
    };

    socket.on('data', onData);
    socket.on('error', onError);
  });
}

async function smtpCommand(socket, command) {
  socket.write(`${command}\r\n`);
  return readSmtpResponse(socket);
}

async function sendVerificationEmail(to, code) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP is not configured.');
  }

  const fromAddress = normalizeAddress(SMTP_FROM);
  const subject = 'LexFlow 注册验证码';
  const text = [
    '您好，您正在进行 LexFlow 邮箱验证。',
    '',
    `您的验证码为：${code}`,
    '',
    `验证码 ${EMAIL_CODE_TTL_MINUTES} 分钟内有效。如果不是本人操作，请忽略。`,
  ].join('\n');

  const message = [
    `From: ${SMTP_FROM.includes('<') ? SMTP_FROM : `LexFlow <${SMTP_FROM}>`}`,
    `To: ${to}`,
    `Subject: ${encodeMailHeader(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
  ].join('\r\n');

  const socket = tls.connect({
    host: SMTP_HOST,
    port: SMTP_PORT,
    servername: SMTP_HOST,
  });

  try {
    await readSmtpResponse(socket);
    await smtpCommand(socket, `EHLO ${SMTP_HOST}`);
    await smtpCommand(socket, 'AUTH LOGIN');
    await smtpCommand(socket, Buffer.from(SMTP_USER).toString('base64'));
    await smtpCommand(socket, Buffer.from(SMTP_PASS).toString('base64'));
    await smtpCommand(socket, `MAIL FROM:<${fromAddress}>`);
    await smtpCommand(socket, `RCPT TO:<${to}>`);
    await smtpCommand(socket, 'DATA');
    await smtpCommand(socket, `${dotStuff(message)}\r\n.`);
    await smtpCommand(socket, 'QUIT').catch(() => undefined);
  } finally {
    socket.end();
  }
}

async function handleSendEmailCode(body) {
  const email = String(body.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, error: '请输入有效邮箱。' };
  }

  const now = Date.now();
  const existing = emailCodes.get(email);
  if (existing && now - existing.lastSentAt < EMAIL_CODE_COOLDOWN_SECONDS * 1000) {
    const waitSeconds = Math.ceil((EMAIL_CODE_COOLDOWN_SECONDS * 1000 - (now - existing.lastSentAt)) / 1000);
    return { ok: false, error: `请 ${waitSeconds} 秒后再获取验证码。` };
  }

  const code = createEmailCode();
  const expiresAt = now + EMAIL_CODE_TTL_MINUTES * 60 * 1000;

  await sendVerificationEmail(email, code);
  emailCodes.set(email, {
    code,
    expiresAt,
    lastSentAt: now,
    attempts: 0,
  });

  return { ok: true, ttlMinutes: EMAIL_CODE_TTL_MINUTES, cooldownSeconds: EMAIL_CODE_COOLDOWN_SECONDS };
}

function handleVerifyEmailCode(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const code = String(body.code || '').trim();
  const record = emailCodes.get(email);

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return { ok: false, error: '邮箱或验证码格式不正确。' };
  }

  if (!record) {
    return { ok: false, error: '请先获取验证码。' };
  }

  if (Date.now() > record.expiresAt) {
    emailCodes.delete(email);
    return { ok: false, error: '验证码已过期，请重新获取。' };
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    emailCodes.delete(email);
    return { ok: false, error: '验证码错误次数过多，请重新获取。' };
  }

  if (record.code !== code) {
    return { ok: false, error: '验证码不正确。' };
  }

  emailCodes.delete(email);
  touchAdminActivity(email, 'auth', { verified: true });
  return { ok: true };
}

async function handleGuardianSearch(searchParams) {
  if (!GUARDIAN_KEY) return [];
  const query = searchParams.get('q') || 'education technology climate culture';
  const pageSize = searchParams.get('pageSize') || '8';
  const url = new URL('https://content.guardianapis.com/search');
  url.searchParams.set('q', query);
  url.searchParams.set('page-size', pageSize);
  url.searchParams.set('show-fields', 'trailText,bodyText,thumbnail');
  url.searchParams.set('order-by', 'newest');
  url.searchParams.set('api-key', GUARDIAN_KEY);

  const response = await fetchWithTimeout(url, {}, 'Guardian search');
  if (!response.ok) {
    throw new Error(`Guardian request failed: ${response.status}`);
  }

  const data = await response.json();
  return (data.response?.results || []).map((item) => ({
    id: item.id,
    titleEn: item.webTitle,
    titleZh: item.webTitle,
    category: item.sectionName || 'news',
    date: item.webPublicationDate ? item.webPublicationDate.slice(0, 10) : '',
    source: 'The Guardian',
    paragraphs: [
      {
        en: item.fields?.trailText || item.webTitle,
        zh: item.fields?.trailText || item.webTitle,
      },
    ],
    vocabulary: [],
    sourceUrl: item.webUrl,
  }));
}

async function handleNewsApiSearch(searchParams) {
  if (!NEWSAPI_KEY) return [];
  const query = searchParams.get('q') || 'education technology climate culture';
  const pageSize = searchParams.get('pageSize') || '8';
  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', query);
  url.searchParams.set('language', 'en');
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('pageSize', pageSize);
  url.searchParams.set('apiKey', NEWSAPI_KEY);

  const response = await fetchWithTimeout(url, {}, 'NewsAPI search');
  if (!response.ok) {
    throw new Error(`NewsAPI request failed: ${response.status}`);
  }

  const data = await response.json();
  return (data.articles || []).map((item, index) => ({
    id: `newsapi-${index}-${sanitizeQuery(item.title || query).slice(0, 32)}`,
    titleEn: item.title || query,
    titleZh: item.title || query,
    category: 'news',
    date: item.publishedAt ? item.publishedAt.slice(0, 10) : '',
    source: item.source?.name || 'NewsAPI',
    paragraphs: [
      {
        en: item.description || item.content || item.title || query,
        zh: item.description || item.content || item.title || query,
      },
    ],
    vocabulary: [],
    sourceUrl: item.url || '',
  }));
}

async function handleDeepL(body) {
  if (!DEEPL_KEY) return { translations: [] };
  const texts = Array.isArray(body.text) ? body.text : [body.text].filter(Boolean);
  if (texts.length === 0) return { translations: [] };

  const response = await fetchWithTimeout(
    `${DEEPL_BASE.replace(/\/$/, '')}/v2/translate`,
    {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texts,
        target_lang: body.targetLang || 'ZH',
        source_lang: body.sourceLang || 'EN',
      }),
    },
    'DeepL translate',
  );

  if (!response.ok) {
    throw new Error(`DeepL request failed: ${response.status}`);
  }

  return response.json();
}

async function handlePexels(searchParams) {
  if (!PEXELS_KEY) return { url: null };
  const query = sanitizeQuery(searchParams.get('query') || 'english speaking people');
  if (!query) return { url: null };

  const url = new URL('https://api.pexels.com/videos/search');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '10');
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('size', 'large');
  url.searchParams.set('locale', 'en-US');

  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        Authorization: PEXELS_KEY,
      },
    },
    'Pexels search',
  );

  if (!response.ok) {
    throw new Error(`Pexels request failed: ${response.status}`);
  }

  const data = await response.json();
  const bestUrl = pickBestPexelsFile(data.videos?.[0]?.video_files || []);
  return { url: bestUrl };
}

async function handleDeepSeek(body) {
  if (!DEEPSEEK_KEY) {
    return { error: 'DeepSeek API key is not configured.' };
  }

  const response = await fetchWithTimeout(
    DEEPSEEK_ENDPOINT,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: body.model || DEEPSEEK_MODEL,
        messages: body.messages || [],
        temperature: body.temperature ?? 0.7,
        stream: false,
      }),
    },
    'DeepSeek chat',
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `DeepSeek request failed: ${response.status}`);
  }

  return data;
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 404, { error: 'Missing URL' });
    return;
  }

  if (req.method === 'OPTIONS') {
    setJsonHeaders(res, 204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (serveFrontend(req, res, url)) {
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/config') {
      sendJson(res, 200, {
        hasLiveNewsKeys: Boolean(GUARDIAN_KEY || NEWSAPI_KEY),
        hasTranslationKey: Boolean(DEEPL_KEY),
        hasDeepSeekKey: Boolean(DEEPSEEK_KEY),
        hasSmtpMail: Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS),
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/reading/library') {
      const library = getReadingLibraryStore();
      sendJson(res, 200, {
        articles: library.articles,
        meta: library.meta,
        updatedAt: library.updatedAt,
        batchIndex: library.batchIndex,
        canRefresh: true,
        notice: '',
        error: '',
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/reading/library/refresh') {
      const library = await refreshReadingLibraryStore();
      sendJson(res, 200, {
        articles: library.articles,
        meta: library.meta,
        updatedAt: library.updatedAt,
        batchIndex: library.batchIndex,
        canRefresh: true,
        notice: '',
        error: '',
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/podcasts/library') {
      const library = await buildPodcastLibrary({ force: false });
      sendJson(res, 200, library);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/podcasts/refresh') {
      const library = await buildPodcastLibrary({ force: true });
      sendJson(res, 200, library);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/guardian/search') {
      sendJson(res, 200, await handleGuardianSearch(url.searchParams));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/newsapi/search') {
      sendJson(res, 200, await handleNewsApiSearch(url.searchParams));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/pexels/video') {
      sendJson(res, 200, await handlePexels(url.searchParams));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/translate/deepl') {
      const body = await parseJsonBody(req);
      sendJson(res, 200, await handleDeepL(body));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/deepseek/chat') {
      const body = await parseJsonBody(req);
      sendJson(res, 200, await handleDeepSeek(body));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/send-email-code') {
      const body = await parseJsonBody(req);
      sendJson(res, 200, await handleSendEmailCode(body));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/verify-email-code') {
      const body = await parseJsonBody(req);
      sendJson(res, 200, handleVerifyEmailCode(body));
      return;
    }

    if (url.pathname === '/api/reading/progress' && req.method === 'GET') {
      const email = url.searchParams.get('email') || '';
      if (email) touchAdminActivity(email, 'reading-progress:get');
      sendJson(res, 200, getReadingProgressEntry(email));
      return;
    }

    if (url.pathname === '/api/reading/progress' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (body.email) touchAdminActivity(body.email, 'reading-progress:post');
      const entry = setReadingProgressEntry(body.email, body.articleIds);
      sendJson(res, 200, entry || { email: '', articleIds: [], updatedAt: '' });
      return;
    }

    if (url.pathname === '/api/user/progress' && req.method === 'GET') {
      const email = url.searchParams.get('email') || '';
      if (email) touchAdminActivity(email, 'user-progress:get');
      sendJson(res, 200, getUserProgressEntry(email));
      return;
    }

    if (url.pathname === '/api/user/progress' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (body.email) touchAdminActivity(body.email, 'user-progress:post');
      const entry = setUserProgressEntry(body.email, body);
      sendJson(res, 200, entry || { email: '', progress: {}, dailyStats: [], listening: [], podcasts: [], reading: [], updatedAt: '' });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/summary') {
      if (ADMIN_DASHBOARD_TOKEN) {
        const providedToken = String(req.headers['x-admin-token'] || url.searchParams.get('token') || '').trim();
        if (providedToken !== ADMIN_DASHBOARD_TOKEN) {
          sendJson(res, 403, { error: 'Forbidden' });
          return;
        }
      }

      sendJson(res, 200, await getAdminSummary());
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown server error',
    });
  }
});

server.listen(PORT, () => {
  console.log(`LexFlow API server running at http://127.0.0.1:${PORT}`);
});
