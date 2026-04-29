import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const OUTPUT_FILE = path.join(ROOT, 'src', 'data', 'generatedReading.ts');
const OUTPUT_META_FILE = path.join(ROOT, 'src', 'data', 'generatedReadingMeta.ts');
const OUTPUT_JSON = path.join(ROOT, 'public', 'data', 'generated-reading.json');
const OUTPUT_META_JSON = path.join(ROOT, 'public', 'data', 'generated-reading-meta.json');
const ENV_FILE = path.join(ROOT, '.env');

const TARGET_ARTICLE_COUNT = Math.max(Number.parseInt(process.env.READING_TARGET_ARTICLE_COUNT || '20', 10) || 20, 1);
const MAX_STORED_ARTICLES = Math.max(Number.parseInt(process.env.READING_MAX_STORED_ARTICLES || '200', 10) || 200, TARGET_ARTICLE_COUNT);
const DEFAULT_SCHEDULE_HOUR = Math.max(0, Math.min(Number.parseInt(process.env.READING_GENERATION_HOUR || '2', 10) || 2, 23));
const DEFAULT_SCHEDULE_MINUTE = Math.max(0, Math.min(Number.parseInt(process.env.READING_GENERATION_MINUTE || '0', 10) || 0, 59));

async function loadEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex <= 0) return;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    });
  } catch {
    // ignore missing .env
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeTs(value) {
  return JSON.stringify(value, null, 2);
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeArticleIdentity(value) {
  return normalizeText(value).toLowerCase().replace(/\s*(?:[\(（]?\d+[\)）]?)\s*$/, '');
}

function expandParagraphs(paragraphs, titleEn, titleZh, minimum = 8) {
  const cleaned = Array.isArray(paragraphs)
    ? paragraphs
        .filter((para) => para && para.en && para.zh)
        .map((para) => ({
          en: normalizeText(para.en),
          zh: normalizeText(para.zh),
        }))
    : [];

  const baseEn = normalizeText(titleEn || 'This article');
  const baseZh = normalizeText(titleZh || '这篇文章');

  if (cleaned.length === 0) {
    cleaned.push({
      en: `${baseEn} begins with a short, learner-friendly overview.`,
      zh: `${baseZh} 先从一段适合学习者的简短概述开始。`,
    });
  }

  while (cleaned.length < minimum) {
    const seed = cleaned[(cleaned.length - 1) % cleaned.length];
    const nextIndex = cleaned.length + 1;
    cleaned.push({
      en: `${baseEn} adds another angle ${nextIndex}. ${seed.en.replace(/\.$/, '')} This keeps the article moving at a steady pace.`,
      zh: `${baseZh} 再补充第 ${nextIndex} 个角度。${seed.zh.replace(/[。！？!?]$/, '')} 这样文章会保持更稳定的节奏。`,
    });
  }

  return cleaned.slice(0, minimum);
}

function expandVocabulary(vocabulary, titleEn, minimum = 12) {
  const cleaned = Array.isArray(vocabulary)
    ? vocabulary
        .filter((item) => item && item.word)
        .map((item) => ({
          word: normalizeText(item.word),
          definition: normalizeText(item.definition || ''),
          phonetic: normalizeText(item.phonetic || ''),
        }))
    : [];

  const seeds = ['insight', 'context', 'pattern', 'summary', 'detail', 'habit', 'source', 'review', 'topic', 'shift', 'evidence', 'progress'];
  let index = 0;

  while (cleaned.length < minimum) {
    const word = `${seeds[index % seeds.length]}-${cleaned.length + 1}`;
    cleaned.push({
      word,
      definition: `A learner-friendly word related to ${normalizeText(titleEn || 'the topic')}.`,
      phonetic: `/${word.replace(/-/g, '')}/`,
    });
    index += 1;
  }

  return cleaned.slice(0, minimum);
}

function parseJsonEnv(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchSourceBriefs() {
  const briefs = [];
  const guardianKey = process.env.READING_GUARDIAN_KEY || process.env.VITE_GUARDIAN_API_KEY || '';
  const newsApiKey = process.env.READING_NEWSAPI_KEY || process.env.VITE_NEWSAPI_KEY || '';

  if (guardianKey) {
    const url = new URL('https://content.guardianapis.com/search');
    url.searchParams.set('q', 'technology OR education OR climate OR culture');
    url.searchParams.set('page-size', '8');
    url.searchParams.set('show-fields', 'trailText,bodyText');
    url.searchParams.set('order-by', 'newest');
    url.searchParams.set('api-key', guardianKey);
    try {
      const data = await fetchJson(url.toString());
      for (const item of data?.response?.results || []) {
        briefs.push({
          source: 'The Guardian',
          title: normalizeText(item.webTitle),
          summary: normalizeText(item.fields?.trailText || ''),
          url: item.webUrl || '',
        });
      }
    } catch {
      // ignore
    }
  }

  if (newsApiKey) {
    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', 'technology education climate culture');
    url.searchParams.set('language', 'en');
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('pageSize', '8');
    url.searchParams.set('apiKey', newsApiKey);
    try {
      const data = await fetchJson(url.toString());
      for (const item of data?.articles || []) {
        briefs.push({
          source: item.source?.name || 'NewsAPI',
          title: normalizeText(item.title || ''),
          summary: normalizeText(item.description || item.content || ''),
          url: item.url || '',
        });
      }
    } catch {
      // ignore
    }
  }

  return briefs.filter((item) => item.title || item.summary);
}

async function loadExistingGeneratedArticles() {
  try {
    const raw = await fs.readFile(OUTPUT_JSON, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => normalizeArticleRecord(item, index))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function mergeArticles(...groups) {
  const seen = new Set();
  const merged = [];

  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const article of group) {
      if (!article) continue;

      const identity = article.sourceUrl
        ? `url:${normalizeArticleIdentity(article.sourceUrl)}`
        : [
            normalizeArticleIdentity(article.titleEn),
            normalizeArticleIdentity(article.titleZh),
            normalizeArticleIdentity(article.source),
            normalizeArticleIdentity(article.paragraphs?.[0]?.en || ''),
          ]
            .filter(Boolean)
            .join('|');

      if (seen.has(identity)) continue;
      seen.add(identity);
      merged.push(article);
    }
  }

  return merged.sort((left, right) => {
    const dateCompare = String(right.date || '').localeCompare(String(left.date || ''));
    if (dateCompare !== 0) return dateCompare;
    return String(left.titleEn || '').localeCompare(String(right.titleEn || ''));
  });
}

function buildFallbackArticles() {
  return [
    {
      id: 'ai-study-boost',
      titleEn: 'How AI Makes English Study More Consistent',
      titleZh: '人工智能如何让英语学习更持续',
      category: 'education',
      source: 'AI Editor',
      paragraphs: [
        {
          en: 'Artificial intelligence can help learners build a small but steady study habit.',
          zh: '人工智能可以帮助学习者建立一个小而稳定的学习习惯。',
        },
        {
          en: 'It can suggest topics, turn news into easier reading, and keep vocabulary practice focused.',
          zh: '它可以推荐话题，把新闻变成更容易阅读的内容，并让词汇练习更有针对性。',
        },
        {
          en: 'That matters because consistency often beats intensity when people are learning a language.',
          zh: '这很重要，因为在语言学习里，持续性往往比一时的强度更有效。',
        },
        {
          en: 'A good learning app should feel like a guide that quietly keeps the rhythm moving forward.',
          zh: '一个好的学习应用应该像一个安静的向导，让节奏持续向前。',
        },
      ],
      vocabulary: [
        { word: 'consistent', definition: 'happening in the same way over time', phonetic: '/kənˈsɪstənt/' },
        { word: 'steady', definition: 'regular and not changing suddenly', phonetic: '/ˈstedi/' },
        { word: 'focus', definition: 'the main attention on something', phonetic: '/ˈfoʊkəs/' },
        { word: 'intensity', definition: 'the quality of being strong or concentrated', phonetic: '/ɪnˈtensəti/' },
        { word: 'rhythm', definition: 'a regular repeated pattern', phonetic: '/ˈrɪðəm/' },
      ],
    },
    {
      id: 'ev-city-future',
      titleEn: 'Why Electric Cars Are Changing City Life',
      titleZh: '为什么电动车正在改变城市生活',
      category: 'technology',
      source: 'AI Editor',
      paragraphs: [
        {
          en: 'Electric cars are becoming a normal part of daily travel in many cities.',
          zh: '电动车正在成为许多城市日常出行的一部分。',
        },
        {
          en: 'As charging stations grow and batteries improve, drivers gain more freedom and confidence.',
          zh: '随着充电站增多和电池升级，司机获得了更多自由和信心。',
        },
        {
          en: 'This gives learners useful vocabulary about energy, transport, and the environment.',
          zh: '这也给英语学习者提供了关于能源、交通和环境的实用词汇。',
        },
        {
          en: 'A topic like this is fresh, relevant, and easy to discuss.',
          zh: '围绕这个主题做成学习文章，会让内容更鲜活、更相关，也更容易讨论。',
        },
      ],
      vocabulary: [
        { word: 'charging', definition: 'putting electricity into a battery', phonetic: '/ˈtʃɑːrdʒɪŋ/' },
        { word: 'freedom', definition: 'the ability to act without limit', phonetic: '/ˈfriːdəm/' },
        { word: 'confidence', definition: 'a feeling of trust in yourself', phonetic: '/ˈkɑːnfɪdəns/' },
        { word: 'environment', definition: 'the natural world around us', phonetic: '/ɪnˈvaɪrənmənt/' },
        { word: 'relevant', definition: 'closely related to the subject', phonetic: '/ˈreləvənt/' },
      ],
    },
    {
      id: 'podcast-study-habit',
      titleEn: 'Podcasts Turn Spare Minutes Into Real Progress',
      titleZh: '播客让零碎时间变成真正的进步',
      category: 'news',
      source: 'AI Editor',
      paragraphs: [
        {
          en: 'Podcasts are useful because they fit into the small spaces of a busy day.',
          zh: '播客很有用，因为它们能塞进忙碌一天里的那些小缝隙。',
        },
        {
          en: 'A learner can listen while walking, commuting, or doing simple tasks at home.',
          zh: '学习者可以在走路、通勤或做家务时收听。',
        },
        {
          en: 'Repeated exposure helps English sound more natural and less separate word by word.',
          zh: '这种反复接触会让英语听起来更自然，不再是一个个孤立的单词。',
        },
        {
          en: 'Listening, reading, and speaking can all connect through the same content.',
          zh: '同一份内容就能把听、读、说联系在一起。',
        },
      ],
      vocabulary: [
        { word: 'exposure', definition: 'the fact of experiencing something regularly', phonetic: '/ɪkˈspoʊʒər/' },
        { word: 'commuting', definition: 'traveling regularly to work or school', phonetic: '/kəˈmjuːtɪŋ/' },
        { word: 'natural', definition: 'normal and not forced', phonetic: '/ˈnætʃərəl/' },
        { word: 'connect', definition: 'to join things together', phonetic: '/kəˈnekt/' },
        { word: 'progress', definition: 'forward movement toward a goal', phonetic: '/ˈprɑːɡres/' },
      ],
    },
  ];
}

function normalizeArticleRecord(item, index = 0) {
  if (!item || typeof item !== 'object') return null;

  const titleEn = normalizeText(item.titleEn || `Generated Article ${index + 1}`);
  const titleZh = normalizeText(item.titleZh || item.titleEn || `生成文章 ${index + 1}`);
  const category = ['technology', 'culture', 'education', 'environment', 'news'].includes(item.category)
    ? item.category
    : 'news';

  return {
    id: normalizeText(item.id || `generated-${index + 1}-${slugify(titleEn || 'article')}`),
    titleEn,
    titleZh,
    category,
    date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : new Date().toISOString().slice(0, 10),
    source: normalizeText(item.source || 'AI Editor'),
    paragraphs: expandParagraphs(item.paragraphs, titleEn, titleZh, 8),
    vocabulary: expandVocabulary(item.vocabulary, titleEn, 12),
  };
}

function cloneFallbackArticles(count = TARGET_ARTICLE_COUNT) {
  const seedArticles = buildFallbackArticles();
  const startDate = Date.now();

  return Array.from({ length: count }, (_, index) => {
    const base = seedArticles[index % seedArticles.length];
    const articleNumber = index + 1;
    const cycle = Math.floor(index / seedArticles.length);
    const date = new Date(startDate - index * 86400000).toISOString().slice(0, 10);

    return {
      ...base,
      id: `${base.id}-${articleNumber}`,
      titleEn: `${base.titleEn} ${articleNumber}`,
      titleZh: `${base.titleZh} ${articleNumber}${cycle > 0 ? ` 第${cycle + 1}轮` : ''}`,
      date,
    };
  });
}

function createPrompt(sourceBriefs, targetCount = TARGET_ARTICLE_COUNT) {
  const sourceBlock = sourceBriefs.length
    ? sourceBriefs
        .slice(0, 8)
        .map((item) => `- ${item.source}: ${item.title}${item.summary ? ` | ${item.summary}` : ''}`)
        .join('\n')
    : '- No live sources configured. Create evergreen learner-friendly articles.';

  return `
You are editing content for an English learning app.
Return ONLY valid JSON, no markdown, no code fences, no explanation.

Create ${targetCount} bilingual reading articles with this exact schema:
[
  {
    "id": "string",
    "titleEn": "string",
    "titleZh": "string",
    "category": "technology | culture | education | environment | news",
    "date": "YYYY-MM-DD",
    "source": "string",
    "paragraphs": [
      { "en": "string", "zh": "string" }
    ],
    "vocabulary": [
      { "word": "string", "definition": "string", "phonetic": "string" }
    ]
  }
]

Rules:
- Keep the English at an upper-beginner to intermediate level.
- Each article should have 8 to 10 paragraphs.
- Each article should be about 1100 to 1500 English words overall.
- Each article should have exactly 12 vocabulary items.
- Vocabulary should be genuinely useful and distinct.
- Chinese should be natural and sentence-by-sentence.
- Use the following source inspiration when relevant:
${sourceBlock}

Preferred topics:
- artificial intelligence and learning
- electric vehicles and cleaner cities
- podcasts, listening habits, and language progress

Generate articles that feel polished, specific, and useful for language learners.
`.trim();
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 60000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('Request timed out')), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAiCompatible(prompt) {
  const apiKey = process.env.READING_AI_API_KEY || '';
  if (!apiKey) return null;

  const endpoint = process.env.READING_AI_ENDPOINT || 'https://api.deepseek.com/chat/completions';
  const model = process.env.READING_AI_MODEL || 'deepseek-chat';
  const extraHeaders = parseJsonEnv(process.env.READING_AI_EXTRA_HEADERS_JSON);
  const normalizedEndpoint = endpoint.endsWith('/chat/completions') || endpoint.endsWith('/responses')
    ? endpoint
    : `${endpoint.replace(/\/$/, '')}/chat/completions`;

  const response = await fetchWithTimeout(normalizedEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(
      normalizedEndpoint.endsWith('/responses')
        ? {
            model,
            input: [
              {
                role: 'system',
                content: [{ type: 'input_text', text: 'You are a meticulous bilingual editor for an English learning product.' }],
              },
              {
                role: 'user',
                content: [{ type: 'input_text', text: prompt }],
              },
            ],
          }
        : {
            model,
            temperature: 0.7,
            messages: [
              {
                role: 'system',
                content: 'You are a meticulous bilingual editor for an English learning product.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
          },
    ),
  });

  if (!response.ok) {
    throw new Error(`Model request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text =
    data?.choices?.[0]?.message?.content ||
    data?.output_text ||
    data?.output?.flatMap((item) => item?.content || []).map((part) => part?.text || '').join('') ||
    '';
  return text;
}

async function callGemini(prompt) {
  const apiKey = process.env.READING_AI_API_KEY || '';
  if (!apiKey) return null;

  const model = process.env.READING_AI_MODEL || 'gemini-1.5-flash';
  const endpoint = process.env.READING_AI_ENDPOINT || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const url = new URL(endpoint);
  if (!url.searchParams.has('key')) {
    url.searchParams.set('key', apiKey);
  }

  const response = await fetchWithTimeout(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('') || '';
}

async function callLanguageModel(prompt) {
  if (process.env.READING_AI_DISABLE === '1') {
    return null;
  }

  const provider = (process.env.READING_AI_PROVIDER || 'deepseek').toLowerCase();
  if (provider === 'gemini') {
    return callGemini(prompt);
  }
  return callOpenAiCompatible(prompt);
}

function parseJsonPayload(text) {
  const trimmed = normalizeText(text);
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payload = codeBlock ? codeBlock[1] : trimmed;
  const start = payload.indexOf('[');
  const end = payload.lastIndexOf(']');
  const slice = start >= 0 && end > start ? payload.slice(start, end + 1) : payload;
  return JSON.parse(slice);
}

function sanitizeArticles(rawArticles) {
  if (!Array.isArray(rawArticles)) return [];

  return rawArticles
    .map((item, index) => normalizeArticleRecord(item, index))
    .filter((item) => item && item.titleEn && item.titleZh);
}

function stampGenerationBatch(articles, token) {
  return articles.map((article, index) => ({
    ...article,
    id: `${token}-${index + 1}-${slugify(article.id || article.titleEn || 'article')}`,
  }));
}

function renderTypeScript(articles) {
  return `import type { Article } from './articles';\n\nexport const generatedReading: Article[] = ${escapeTs(articles)};\n`;
}

function renderMetaTypeScript(meta) {
  return `export interface GeneratedReadingMeta {
  generatedAt: string;
  articleCount: number;
  sourceMode: 'model' | 'fallback';
  provider: string;
  sourceBriefCount: number;
  sourceNames: string[];
  targetArticleCount?: number;
  generationSchedule?: {
    hour: number;
    minute: number;
    label: string;
  };
}

export const generatedReadingMeta: GeneratedReadingMeta = ${escapeTs(meta)};
`;
}

async function main() {
  await loadEnvFile(ENV_FILE);

  const sourceBriefs = await fetchSourceBriefs();
  const prompt = createPrompt(sourceBriefs, TARGET_ARTICLE_COUNT);
  const existingArticles = await loadExistingGeneratedArticles();
  const generationToken = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

  let articles = null;
  let sourceMode = 'fallback';
  try {
    const modelText = await callLanguageModel(prompt);
    if (modelText) {
      articles = sanitizeArticles(parseJsonPayload(modelText));
      sourceMode = 'model';
    }
  } catch (error) {
    console.warn(`Model generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!articles || articles.length === 0) {
    articles = cloneFallbackArticles(TARGET_ARTICLE_COUNT);
    sourceMode = 'fallback';
  }

  articles = articles.map((article, index) => normalizeArticleRecord(article, index)).filter(Boolean);
  articles = stampGenerationBatch(articles, generationToken);

  const mergedArticles = mergeArticles(articles, existingArticles).slice(0, MAX_STORED_ARTICLES);

  const meta = {
    generatedAt: new Date().toISOString(),
    articleCount: mergedArticles.length,
    sourceMode,
    provider: (process.env.READING_AI_PROVIDER || 'deepseek').toLowerCase(),
    sourceBriefCount: sourceBriefs.length,
    sourceNames: [...new Set(mergedArticles.map((article) => article.source).filter(Boolean))],
    targetArticleCount: TARGET_ARTICLE_COUNT,
    generationSchedule: {
      hour: DEFAULT_SCHEDULE_HOUR,
      minute: DEFAULT_SCHEDULE_MINUTE,
      label: `每天 ${String(DEFAULT_SCHEDULE_HOUR).padStart(2, '0')}:${String(DEFAULT_SCHEDULE_MINUTE).padStart(2, '0')}`,
    },
  };

  await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true });
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(mergedArticles, null, 2), 'utf8');
  await fs.writeFile(OUTPUT_META_JSON, JSON.stringify(meta, null, 2), 'utf8');
  await fs.writeFile(OUTPUT_FILE, renderTypeScript(mergedArticles), 'utf8');
  await fs.writeFile(OUTPUT_META_FILE, renderMetaTypeScript(meta), 'utf8');
  console.log(`Wrote ${mergedArticles.length} generated reading articles to ${path.relative(ROOT, OUTPUT_FILE)}`);
}

await main();
