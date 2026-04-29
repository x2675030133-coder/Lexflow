import http from 'node:http';
import tls from 'node:tls';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import { fileURLToPath } from 'node:url';

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

const emailCodes = new Map();
let podcastLibraryCache = null;
let podcastLibraryRefreshPromise = null;

function createTimeoutError(label, timeoutMs) {
  return new Error(`${label} timed out after ${Math.ceil(timeoutMs / 1000)}s`);
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
