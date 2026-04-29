import type { Article } from '../data/articles';
import { getAllArticles, getReadingArticleIdentity, storeCachedArticles } from '../data/readingLibrary';
import { fetchGuardianSearch, fetchNewsApiSearch, translateParagraphsDeepSeek, translateTextDeepL } from './remoteContent';
import { postJsonWithTimeout } from './http';

type LiveBrief = {
  source: string;
  title: string;
  summary: string;
  url: string;
  date?: string;
};

const LIVE_TOPICS = [
  'education technology climate culture',
  'ai learning habits language study',
  'electric vehicles city life transport',
  'podcasts listening habits education',
];
const MAX_LIVE_ARTICLES = 20;

function sanitize(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function slugify(value: string) {
  return sanitize(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function createBatchToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function countEnglishWords(text: string) {
  return sanitize(text)
    .split(/\s+/)
    .filter((word) => /[a-zA-Z]/.test(word)).length;
}

function hasChinese(text: string) {
  return /[\u4e00-\u9fff]/.test(sanitize(text));
}

function inferCategory(text: string) {
  const lower = text.toLowerCase();
  if (/(education|school|student|university|learning|class|teacher)/.test(lower)) return 'education';
  if (/(climate|environment|energy|green|nature|weather|pollution)/.test(lower)) return 'environment';
  if (/(culture|art|music|film|book|theatre|festival)/.test(lower)) return 'culture';
  if (/(technology|ai|robot|digital|app|software|device|internet|science|research|electric|vehicle|transport)/.test(lower))
    return 'technology';
  return 'news';
}

function normalizeArticle(article: Article): Article {
  return {
    ...article,
    paragraphs: article.paragraphs.map((para) => ({
      en: sanitize(para.en),
      zh: sanitize(para.zh) || sanitize(para.en),
    })),
    vocabulary: article.vocabulary.map((item) => ({
      word: sanitize(item.word),
      definition: sanitize(item.definition),
      phonetic: sanitize(item.phonetic),
    })),
  };
}

function parseJsonPayload(text: string) {
  const trimmed = sanitize(text);
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payload = codeBlock ? codeBlock[1] : trimmed;
  const start = payload.indexOf('{');
  const end = payload.lastIndexOf('}');
  const slice = start >= 0 && end > start ? payload.slice(start, end + 1) : payload;
  return JSON.parse(slice);
}

function buildFallbackArticle(
  brief: LiveBrief,
  index: number,
  titleZh: string,
  summaryZh: string,
  batchToken: string,
): Article {
  const englishLead = sanitize(brief.summary || brief.title || 'This topic gives learners a clear and practical reading path.');

  return normalizeArticle({
    id: `live-${batchToken}-${slugify(brief.source)}-${slugify(brief.title)}-${index + 1}`,
    titleEn: sanitize(brief.title || `Generated Article ${index + 1}`),
    titleZh: sanitize(titleZh || brief.title || `生成文章 ${index + 1}`),
    category: inferCategory(`${brief.title} ${brief.summary} ${brief.source}`),
    date: brief.date || new Date().toISOString().slice(0, 10),
    source: brief.source,
    sourceUrl: brief.url || undefined,
    paragraphs: [
      {
        en: `${englishLead} The article expands the topic with background, examples, and a learner-friendly explanation.`,
        zh: sanitize(summaryZh || brief.summary || brief.title || '这是一篇面向英语学习者的文章。'),
      },
      {
        en: `The source from ${brief.source} gives the core facts, but the reading version adds context so the meaning becomes easier to follow.`,
        zh: `这篇文章以 ${brief.source} 的新闻线索为基础，再补充背景和解释，让内容更容易跟上。`,
      },
      {
        en: 'As you read, notice how the article connects ideas across sentences instead of leaving each line isolated.',
        zh: '阅读时要注意文章是如何把前后句连起来的，而不是把每一句都写得孤立。',
      },
      {
        en: 'That structure helps learners review the same article more than once and still find new vocabulary the second time.',
        zh: '这样的结构可以帮助学习者反复阅读同一篇文章，而且第二次阅读时还能发现新的词汇。',
      },
      {
        en: 'A useful bilingual reading piece should be detailed enough to teach language, but smooth enough to stay enjoyable.',
        zh: '一篇有用的双语阅读，应该有足够的细节来帮助学习，又要足够流畅，读起来有意思。',
      },
    ],
    vocabulary: [
      { word: 'context', definition: 'the words and ideas around a topic that help explain it', phonetic: '/ˈkɑːntekst/' },
      { word: 'expand', definition: 'to make something larger or more detailed', phonetic: '/ɪkˈspænd/' },
      { word: 'learner-friendly', definition: 'easy for students to understand and use', phonetic: '/ˈlɜːrnər ˈfrendli/' },
      { word: 'background', definition: 'extra information that helps explain a topic', phonetic: '/ˈbækɡraʊnd/' },
      { word: 'review', definition: 'to study something again', phonetic: '/rɪˈvjuː/' },
    ],
  });
}

async function expandBriefWithDeepSeek(brief: LiveBrief, index: number, batchToken: string): Promise<Article | null> {
  try {
    const prompt = `
Write one bilingual reading article for an English learning app.
Return only valid JSON, no markdown, no code fences, no explanation.

Schema:
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

Rules:
- Rewrite the brief into a learner-friendly article, not a short summary.
- Use 8 to 10 paragraphs.
- Target 1100 to 1400 English words total.
- Include exactly 12 vocabulary items.
- Make the Chinese natural, sentence by sentence.
- Keep the English clear, specific, and not too hard.
- Expand background, examples, and explanation where needed.
- Avoid one-sentence paragraphs and avoid thin news-snippet style output.

Source brief:
Source: ${brief.source}
Title: ${brief.title}
Summary: ${brief.summary || brief.title}
Url: ${brief.url || 'none'}
`.trim();

    const payload = await postJsonWithTimeout<{ choices?: { message?: { content?: string } }[] }>('/api/deepseek/chat', {
      model: 'deepseek-chat',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You write polished bilingual reading articles for an English learning app.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = payload?.choices?.[0]?.message?.content || '';
    if (!content) return null;

    const parsed = parseJsonPayload(content);
    const rawParagraphs = Array.isArray(parsed.paragraphs)
      ? parsed.paragraphs
          .filter((para: any) => para && para.en && para.zh)
          .map((para: any) => ({ en: sanitize(para.en), zh: sanitize(para.zh) }))
      : [];
    let paragraphs = rawParagraphs;

    const missingIndexes = rawParagraphs
      .map((paragraph: { en: string; zh: string }, paragraphIndex: number) => ({ paragraph, paragraphIndex }))
      .filter(
        ({ paragraph }: { paragraph: { en: string; zh: string }; paragraphIndex: number }) =>
          !hasChinese(paragraph.zh) || paragraph.zh === paragraph.en,
      )
      .map(({ paragraphIndex }: { paragraph: { en: string; zh: string }; paragraphIndex: number }) => paragraphIndex);

    if (missingIndexes.length > 0) {
      const translated = await translateParagraphsDeepSeek(missingIndexes.map((i: number) => rawParagraphs[i].en));
      if (translated && translated.length === missingIndexes.length) {
        paragraphs = rawParagraphs.map((paragraph: { en: string; zh: string }, paragraphIndex: number) => {
          const missingPos = missingIndexes.indexOf(paragraphIndex);
          if (missingPos === -1) return paragraph;
          const replacement = sanitize(translated[missingPos]);
          if (!replacement) return paragraph;
          return { ...paragraph, zh: replacement };
        });
      }
    }
    const vocabulary = Array.isArray(parsed.vocabulary)
      ? parsed.vocabulary
          .filter((item: any) => item && item.word)
          .slice(0, 12)
          .map((item: any) => ({
            word: sanitize(item.word),
            definition: sanitize(item.definition || ''),
            phonetic: sanitize(item.phonetic || ''),
          }))
      : [];

    const englishWords = paragraphs.reduce((total: number, para: { en: string }) => total + countEnglishWords(para.en), 0);
    if (paragraphs.length < 7 || vocabulary.length < 8 || englishWords < 950) {
      return null;
    }

    return normalizeArticle({
      id: sanitize(parsed.id || `live-${batchToken}-${slugify(brief.source)}-${slugify(brief.title)}-${index + 1}`),
      titleEn: sanitize(parsed.titleEn || brief.title),
      titleZh: sanitize(parsed.titleZh || brief.title),
      category: ['technology', 'culture', 'education', 'environment', 'news'].includes(parsed.category)
        ? parsed.category
        : inferCategory(`${brief.title} ${brief.summary} ${brief.source}`),
      date: /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : brief.date || new Date().toISOString().slice(0, 10),
      source: sanitize(parsed.source || brief.source || 'DeepSeek'),
      sourceUrl: brief.url || undefined,
      paragraphs,
      vocabulary,
    });
  } catch {
    return null;
  }
}

async function buildArticleFromBrief(brief: LiveBrief, index: number, batchToken: string) {
  const deepSeekArticle = await expandBriefWithDeepSeek(brief, index, batchToken);
  if (deepSeekArticle) {
    return deepSeekArticle;
  }

  try {
    const translated = await translateTextDeepL([brief.title, brief.summary || brief.title], 'ZH');
    const [titleZh = brief.title, summaryZh = brief.summary || brief.title] = translated || [];
    return buildFallbackArticle(brief, index, titleZh, summaryZh, batchToken);
  } catch {
    return buildFallbackArticle(brief, index, brief.title, brief.summary || brief.title, batchToken);
  }
}

async function buildArticlesWithConcurrency(briefs: LiveBrief[], batchToken: string, concurrency = 4) {
  const articles: Article[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < briefs.length) {
      const currentIndex = cursor;
      cursor += 1;
      const article = await buildArticleFromBrief(briefs[currentIndex], currentIndex, batchToken);
      if (article) {
        articles.push(article);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, briefs.length) }, () => worker());
  await Promise.all(workers);
  return articles;
}

function buildSyntheticBriefs(): LiveBrief[] {
  const today = new Date().toISOString().slice(0, 10);
  return [
    {
      source: 'AI Editor',
      title: 'How AI Helps English Study Stay Consistent',
      summary: 'A learner-friendly article about using small, repeatable habits to keep English study moving every day.',
      url: 'ai-study-consistency',
      date: today,
    },
    {
      source: 'AI Editor',
      title: 'Why Electric Cars Are Changing City Life',
      summary: 'A bilingual reading piece about transport, energy, and cleaner streets in modern cities.',
      url: 'ai-ev-city-life',
      date: today,
    },
    {
      source: 'AI Editor',
      title: 'Podcasts Turn Spare Minutes Into Real Progress',
      summary: 'A reading article about listening habits, commuting, and micro-learning throughout a busy day.',
      url: 'ai-podcast-progress',
      date: today,
    },
    {
      source: 'AI Editor',
      title: 'Schools Use Technology to Support Better Reading',
      summary: 'A practical story about classroom tools, reading support, and learner motivation.',
      url: 'ai-school-reading',
      date: today,
    },
    {
      source: 'AI Editor',
      title: 'Cities Adapt to Climate Challenges Step by Step',
      summary: 'A detailed article about public planning, climate resilience, and community choices.',
      url: 'ai-climate-cities',
      date: today,
    },
    {
      source: 'AI Editor',
      title: 'Language Learning Works Best Through Repetition',
      summary: 'A longer bilingual text about spaced review, memory, and daily practice.',
      url: 'ai-language-repetition',
      date: today,
    },
  ];
}

async function fetchLiveBriefs() {
  const perTopicPageSize = 6;
  const results = await Promise.all(
    LIVE_TOPICS.map(async (query) => {
      const [guardianArticles, newsApiArticles] = await Promise.all([
        fetchGuardianSearch(query, perTopicPageSize),
        fetchNewsApiSearch(query, perTopicPageSize),
      ]);

      return [
        ...guardianArticles.map((item: any) => ({
          source: item.source || 'The Guardian',
          title: sanitize(item.titleEn || item.title || ''),
          summary: sanitize(item.paragraphs?.[0]?.en || item.summary || item.description || ''),
          url: item.sourceUrl || item.url || '',
          date: item.date || '',
        })),
        ...newsApiArticles.map((item: any) => ({
          source: item.source || 'NewsAPI',
          title: sanitize(item.titleEn || item.title || ''),
          summary: sanitize(item.paragraphs?.[0]?.en || item.summary || item.description || ''),
          url: item.sourceUrl || item.url || '',
          date: item.date || '',
        })),
      ] as LiveBrief[];
    }),
  );

  const seen = new Set<string>();
  const merged: LiveBrief[] = [];

  for (const group of results) {
    for (const item of group) {
      if (!item.title && !item.summary) continue;
      const key = `${item.source}|${item.title}|${item.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  const fallback = buildSyntheticBriefs();
  const combined = merged.length > 0 ? [...merged, ...fallback] : fallback;
  const existingKeys = new Set(getAllArticles().map((article) => getReadingArticleIdentity(article)));
  const uniqueSeen = new Set<string>();
  const unique: LiveBrief[] = [];
  for (const item of combined) {
    const key = `${item.source}|${item.title}|${item.url}`;
    if (uniqueSeen.has(key)) continue;
    const identity = getReadingArticleIdentity({
      id: key,
      titleEn: item.title,
      titleZh: item.title,
      category: inferCategory(`${item.title} ${item.summary} ${item.source}`),
      date: item.date || new Date().toISOString().slice(0, 10),
      source: item.source,
      sourceUrl: item.url || undefined,
      paragraphs: [{ en: item.summary || item.title, zh: item.summary || item.title }],
      vocabulary: [],
    });
    if (existingKeys.has(identity)) continue;
    uniqueSeen.add(key);
    unique.push(item);
    if (unique.length >= MAX_LIVE_ARTICLES) break;
  }

  return unique;
}

export async function refreshReadingCache() {
  const batchToken = createBatchToken();
  const briefs = await fetchLiveBriefs();
  if (briefs.length === 0) {
    return [];
  }

  const articles = await buildArticlesWithConcurrency(briefs, batchToken, 4);

  if (articles.length > 0) {
    storeCachedArticles(articles);
  }

  return articles;
}
