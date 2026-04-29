import type { VideoLesson } from '../data/videoData';
import { getJsonWithTimeout, postJsonWithTimeout } from './http';

type TranslationResponse = {
  translations?: { text: string }[];
};

const PEXELS_CACHE_PREFIX = 'pexels-video-cache:';

function sanitizeQuery(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeParseJson<T>(raw: string): T | null {
  try {
    const trimmed = String(raw || '').trim();
    const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const payload = codeBlock ? codeBlock[1] : trimmed;
    const start = payload.indexOf('{');
    const end = payload.lastIndexOf('}');
    const jsonSlice = start >= 0 && end > start ? payload.slice(start, end + 1) : payload;
    return JSON.parse(jsonSlice) as T;
  } catch {
    return null;
  }
}

export function buildVideoQuery(lesson: VideoLesson) {
  const title = sanitizeQuery(lesson.title);
  const speaker = sanitizeQuery(lesson.speaker);
  const category = sanitizeQuery(lesson.category);
  const base = [title, speaker, category].filter(Boolean).join(' ');
  if (base) return base;
  return 'english speaking people';
}

function getCachedVideoUrl(query: string) {
  try {
    return localStorage.getItem(`${PEXELS_CACHE_PREFIX}${query}`) || null;
  } catch {
    return null;
  }
}

function setCachedVideoUrl(query: string, url: string) {
  try {
    localStorage.setItem(`${PEXELS_CACHE_PREFIX}${query}`, url);
  } catch {
    // ignore storage failures in private mode or blocked storage
  }
}

export async function fetchPexelsVideoUrl(query: string) {
  const cleanQuery = sanitizeQuery(query);
  if (!cleanQuery) return null;

  const cached = getCachedVideoUrl(cleanQuery);
  if (cached) return cached;

  try {
    const data = await getJsonWithTimeout<{ url?: string | null }>(`/api/pexels/video?query=${encodeURIComponent(cleanQuery)}`);
    if (data.url) {
      setCachedVideoUrl(cleanQuery, data.url);
    }
    return data.url || null;
  } catch {
    return null;
  }
}

export function getVideoFallbackQuery(lesson: VideoLesson) {
  const title = sanitizeQuery(lesson.title);
  const speaker = sanitizeQuery(lesson.speaker);
  const category = sanitizeQuery(lesson.category);
  const hints = [title, speaker, category]
    .filter(Boolean)
    .join(' ')
    .replace(/\b(on|the|and|of|a|to|for|with|in)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (hints) return hints;
  return 'people talking english';
}

export async function translateTextDeepL(text: string | string[], targetLang = 'ZH') {
  try {
    const data = await postJsonWithTimeout<TranslationResponse>('/api/translate/deepl', { text, targetLang, sourceLang: 'EN' });
    return data.translations?.map((item) => item.text) || null;
  } catch {
    return null;
  }
}

export async function fetchGuardianSearch(query: string, pageSize = 8) {
  try {
    return await getJsonWithTimeout<any[]>(`/api/guardian/search?q=${encodeURIComponent(query)}&pageSize=${pageSize}`);
  } catch {
    return [];
  }
}

export async function fetchNewsApiSearch(query: string, pageSize = 8) {
  try {
    return await getJsonWithTimeout<any[]>(`/api/newsapi/search?q=${encodeURIComponent(query)}&pageSize=${pageSize}`);
  } catch {
    return [];
  }
}

export async function translateParagraphsDeepSeek(paragraphs: string[]) {
  const cleaned = paragraphs.map((item) => item.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;

  const prompt = `
Translate the following English paragraphs into natural Simplified Chinese.
Return ONLY JSON in this schema:
{
  "translations": [
    { "index": 0, "zh": "..." }
  ]
}
Rules:
- Keep the same number and order.
- Do not leave English in the result unless it's a name or fixed term.

Paragraphs:
${cleaned.map((item, index) => `${index + 1}. ${item}`).join('\n')}
`.trim();

  try {
    const data = await postJsonWithTimeout<{ choices?: { message?: { content?: string } }[] }>('/api/deepseek/chat', {
      model: 'deepseek-chat',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You are a professional EN->ZH translator.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = data?.choices?.[0]?.message?.content || '';
    const parsed = safeParseJson<{ translations?: { index: number; zh: string }[] }>(content);
    if (!parsed?.translations || !Array.isArray(parsed.translations)) return null;

    const output = new Array<string>(cleaned.length).fill('');
    parsed.translations.forEach((item) => {
      if (typeof item?.index !== 'number') return;
      if (item.index < 0 || item.index >= output.length) return;
      output[item.index] = String(item.zh || '').trim();
    });

    if (output.some((item) => !item)) return null;
    return output;
  } catch {
    return null;
  }
}
