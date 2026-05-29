import fs from 'node:fs';
import path from 'node:path';

function resolveEnvPath() {
  return path.join(process.cwd(), '.env');
}

export function loadEnvFile(envPath = resolveEnvPath()) {
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;

    let value = line.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function resolveReadingApiKey(options = {}) {
  return String(
    options.apiKey ||
      process.env.READING_AI_API_KEY ||
      process.env.READING_GUARDIAN_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      '',
  ).trim();
}

export function normalizeWordKey(value) {
  return String(value ?? '').trim().toLowerCase();
}

const KNOWN_POS = /^(?:n|v|vt|vi|adj|adv|prep|conj|pron|art|num|int|abbr|aux|det|interj)\./i;

export function cleanTagPrefix(value) {
  return String(value ?? '')
    .replace(new RegExp(`^\\s*(?:\\[[^\\]]+\\]\\s*)*(?:${KNOWN_POS.source}\\s*)+`, 'i'), '')
    .trim();
}

export function cleanMeaning(value) {
  return cleanTagPrefix(value).replace(/;\s*$/u, '').trim();
}

function pickMeaning(wordRecord) {
  const definitions = Array.isArray(wordRecord?.definitions) ? wordRecord.definitions : [];
  const firstDefinition = definitions[0] || {};
  return {
    en: cleanMeaning(firstDefinition.en || wordRecord?.word || ''),
    zh: cleanMeaning(firstDefinition.zh || wordRecord?.word || ''),
  };
}

function isHighRiskFallbackWord(wordRecord) {
  const word = String(wordRecord?.word || '').trim();
  const pos = Array.isArray(wordRecord?.partOfSpeech) ? wordRecord.partOfSpeech : [];
  const normalizedPos = pos
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);

  const highRiskPos = normalizedPos.some((item) =>
    item.startsWith('pron.') ||
    item.startsWith('det.') ||
    item.startsWith('prep.') ||
    item.startsWith('conj.') ||
    item.startsWith('aux.') ||
    item.startsWith('interj.') ||
    item.startsWith('int.') ||
    item.startsWith('art.') ||
    item.startsWith('num.') ||
    item.startsWith('d.') ||
    item.startsWith('abbr.')
  );

  return !word || word.length <= 3 || highRiskPos || normalizedPos.length > 1;
}

function makeFallbackExamples(wordRecord, count = 2) {
  const examples = Array.isArray(wordRecord?.examples) ? wordRecord.examples : [];
  return examples
    .map((example) => ({
      en: String(example?.en || '').trim(),
      zh: String(example?.zh || '').trim(),
    }))
    .filter((example) => example.en && example.zh)
    .slice(0, Math.max(1, count));
}

function looksLikePlaceholderExample(example) {
  const text = `${example?.en || ''} ${example?.zh || ''}`.toLowerCase();
  return (
    text.includes('i need to learn the word') ||
    text.includes('i use the word') ||
    text.includes('appears in a simple sentence') ||
    text.includes('natural context') ||
    text.includes('try using') ||
    text.includes('this sentence uses') ||
    text.includes('the word "') ||
    text.includes('when i study this topic') ||
    text.includes('when studying this topic') ||
    text.includes('i am learning the word') ||
    text.includes('this is an example sentence') ||
    text.includes('here is an example') ||
    text.includes('here is a sentence') ||
    text.includes('sample sentence') ||
    text.includes('placeholder')
  );
}

export function examplesNeedRefresh(examples) {
  const list = Array.isArray(examples) ? examples : [];
  if (list.length === 0) return true;
  return list.every(looksLikePlaceholderExample);
}

export function needsExampleRefresh(wordRecord) {
  return examplesNeedRefresh(wordRecord?.examples);
}

export function buildFallbackExamples(wordRecord, count = 2) {
  return makeFallbackExamples(wordRecord, count).slice(0, count);
}

function extractJsonPayload(text) {
  const trimmed = String(text ?? '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  const firstBracket = trimmed.indexOf('[');
  const firstBrace = trimmed.indexOf('{');
  if (firstBracket === -1 && firstBrace === -1) return trimmed;
  if (firstBracket === -1) return trimmed.slice(firstBrace);
  if (firstBrace === -1) return trimmed.slice(firstBracket);
  return trimmed.slice(Math.min(firstBracket, firstBrace));
}

async function callOpenAiCompatible(prompt, { apiKey, endpoint, model, temperature = 0.35 }) {
  const url = endpoint.endsWith('/chat/completions') ? endpoint : `${endpoint.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You write concise bilingual English learning examples and return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature,
      stream: false,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Model request failed: ${response.status}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Model response did not include content.');
  }

  return text;
}

async function callGemini(prompt, { apiKey, endpoint, model, temperature = 0.35 }) {
  const url = new URL(endpoint || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);
  if (!url.searchParams.has('key')) {
    url.searchParams.set('key', apiKey);
  }

  const response = await fetch(url.toString(), {
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
        temperature,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Model request failed: ${response.status}`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('') || '';
  if (!text.trim()) {
    throw new Error('Model response did not include content.');
  }

  return text;
}

async function callLanguageModel(prompt, config) {
  if (!config?.apiKey) return null;
  if (config.provider === 'gemini') {
    return callGemini(prompt, config);
  }
  return callOpenAiCompatible(prompt, config);
}

function buildBatchPrompt(entries, examplesPerWord) {
  const payload = entries.map((entry) => {
    const meanings = Array.isArray(entry.definitions) ? entry.definitions.slice(0, 2) : [];
    return {
      word: entry.word,
      partOfSpeech: Array.isArray(entry.partOfSpeech) ? entry.partOfSpeech : [],
      meaningZh: meanings.map((item) => cleanMeaning(item?.zh || '')).filter(Boolean).join('；'),
      meaningEn: meanings.map((item) => cleanMeaning(item?.en || '')).filter(Boolean).join(' | '),
    };
  });

  const demoWord = 'zarpox';
  return [
    'You are generating bilingual English-learning examples for vocabulary flashcards.',
    `Return valid JSON only. No markdown, no commentary.`,
    `For each input item, produce exactly ${examplesPerWord} examples.`,
    'Rules:',
    '- Each English sentence must be simple, natural, and suitable for learners.',
    '- The target word must appear naturally in every English sentence.',
    '- Keep each English sentence short, ideally 8 to 14 words.',
    '- Keep each Chinese translation concise and faithful.',
    '- Do not mention "word list", "example", or "sentence" in the output.',
    '- If a word has multiple meanings, favor the most common meaning in the provided context.',
    '- IMPORTANT: The demo below uses a made-up word as format illustration only. Generate ORIGINAL sentences for each real word — never copy or paraphrase the demo sentences.',
    '',
    'Input JSON:',
    JSON.stringify(payload, null, 2),
    '',
    'Output schema:',
    JSON.stringify([
      {
        word: demoWord,
        examples: [
          { en: `The ${demoWord} shines brightly in the morning sky.`, zh: '那个虚构物在晨空中闪闪发光。' },
          { en: `Everyone was amazed by the rare ${demoWord}.`, zh: '每个人都对那个罕见的虚构物感到惊讶。' },
        ],
      },
    ], null, 2),
  ].join('\n');
}

function normalizeGeneratedItems(items, expectedWords, examplesPerWord) {
  const map = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const key = normalizeWordKey(item?.word);
    if (!key) continue;
    const rawExamples = Array.isArray(item?.examples) ? item.examples : [];
    const examples = rawExamples
      .map((example) => ({
        en: String(example?.en || '').trim(),
        zh: String(example?.zh || '').trim(),
      }))
      .filter((example) => example.en && example.zh)
      .slice(0, examplesPerWord);
    if (examples.length > 0) {
      map.set(key, examples);
    }
  }

  const result = new Map();
  for (const entry of expectedWords) {
    const key = normalizeWordKey(entry.word);
    const generated = map.get(key);
    if (generated && generated.length >= examplesPerWord) {
      result.set(key, generated.slice(0, examplesPerWord));
    } else {
      result.set(key, buildFallbackExamples(entry, examplesPerWord));
    }
  }
  return result;
}

async function generateBatch(entries, config, depth = 0) {
  const {
    examplesPerWord,
    provider,
    apiKey,
    endpoint,
    model,
    retries,
    fallbackOnly,
  } = config;

  if (!Array.isArray(entries) || entries.length === 0) {
    return new Map();
  }

  if (fallbackOnly) {
    return new Map(
      entries.map((entry) => {
        const key = normalizeWordKey(entry.word);
        return [key, buildFallbackExamples(entry, examplesPerWord)];
      }),
    );
  }

  const prompt = buildBatchPrompt(entries, examplesPerWord);
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const responseText = await callLanguageModel(prompt, {
        provider,
        apiKey,
        endpoint,
        model,
        temperature: 0.35,
      });
      const parsed = JSON.parse(extractJsonPayload(responseText));
      const normalized = normalizeGeneratedItems(parsed, entries, examplesPerWord);
      if (normalized.size === entries.length) {
        return normalized;
      }

      const missing = entries.filter((entry) => !normalized.has(normalizeWordKey(entry.word)));
      if (missing.length === 0) {
        return normalized;
      }

      if (missing.length < entries.length && entries.length > 1) {
        const recovered = await generateBatch(missing, config, depth + 1);
        missing.forEach((entry) => {
          const key = normalizeWordKey(entry.word);
          normalized.set(key, recovered.get(key) || buildFallbackExamples(entry, examplesPerWord));
        });
        return normalized;
      }

      return normalized;
    } catch (error) {
      lastError = error;
    }
  }

  if (entries.length === 1 || depth >= 3) {
    return new Map(
      entries.map((entry) => {
        const key = normalizeWordKey(entry.word);
        return [key, buildFallbackExamples(entry, examplesPerWord)];
      }),
    );
  }

  const midpoint = Math.max(1, Math.floor(entries.length / 2));
  const left = await generateBatch(entries.slice(0, midpoint), config, depth + 1);
  const right = await generateBatch(entries.slice(midpoint), config, depth + 1);
  const merged = new Map();
  left.forEach((value, key) => merged.set(key, value));
  right.forEach((value, key) => merged.set(key, value));
  if (merged.size > 0) {
    return merged;
  }

  if (lastError) {
    console.warn(`Example generation fell back after error: ${lastError.message || String(lastError)}`);
  }

  return new Map(
    entries.map((entry) => {
      const key = normalizeWordKey(entry.word);
      return [key, buildFallbackExamples(entry, examplesPerWord)];
    }),
  );
}

export async function generateExamplesForEntries(entries, options = {}) {
  const examplesPerWord = Math.max(1, Number(options.examplesPerWord || 2));
  const provider = String(options.provider || process.env.READING_AI_PROVIDER || 'deepseek').toLowerCase();
  const apiKey = resolveReadingApiKey(options);
  const endpoint = String(
    options.endpoint ||
      process.env.READING_AI_ENDPOINT ||
      process.env.DEEPSEEK_API_ENDPOINT ||
      (provider === 'gemini'
        ? `https://generativelanguage.googleapis.com/v1beta/models/${process.env.READING_AI_MODEL || 'gemini-1.5-flash'}:generateContent`
        : 'https://api.deepseek.com/chat/completions'),
  ).trim();
  const model = String(options.model || process.env.READING_AI_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : 'deepseek-chat')).trim();
  const batchSize = Math.max(1, Number(options.batchSize || 40));
  const retries = Math.max(0, Number(options.retries || 2));
  const onBatchComplete = typeof options.onBatchComplete === 'function' ? options.onBatchComplete : null;
  const results = new Map();
  const workItems = Array.isArray(entries) ? entries.filter((entry) => entry && entry.word) : [];

  if (!apiKey) {
    throw new Error('AI API key is required for example generation. Template fallback has been removed.');
  }

  for (let index = 0; index < workItems.length; index += batchSize) {
    const batch = workItems.slice(index, index + batchSize);
    const batchResult = await generateBatch(batch, {
      examplesPerWord,
      provider,
      apiKey,
      endpoint,
      model,
      retries,
      fallbackOnly: false,
    });

    batchResult.forEach((value, key) => results.set(key, value));
    if (onBatchComplete) {
      await onBatchComplete({
        batch,
        batchResult,
        startIndex: index,
        totalCount: workItems.length,
        results,
      });
    }
  }

  return results;
}

export function applyGeneratedExamples(wordRecord, generatedExamples, examplesPerWord = 2) {
  const key = normalizeWordKey(wordRecord.word);
  const examples = generatedExamples.get(key);
  if (examples && examples.length > 0) {
    return {
      ...wordRecord,
      examples: examples.slice(0, examplesPerWord),
    };
  }

  return {
    ...wordRecord,
    examples: buildFallbackExamples(wordRecord, examplesPerWord),
  };
}

export function shouldRefreshWordExamples(wordRecord) {
  return needsExampleRefresh(wordRecord);
}

/* ------------------------------------------------------------------ */
/*  Collocation generation                                             */
/* ------------------------------------------------------------------ */

const COLLOCATION_COUNT_DEFAULT = 3;

function buildCollocationPrompt(entries, collocationCount) {
  const payload = entries.map((entry) => {
    const meanings = Array.isArray(entry.definitions) ? entry.definitions.slice(0, 2) : [];
    return {
      word: entry.word,
      partOfSpeech: Array.isArray(entry.partOfSpeech) ? entry.partOfSpeech.slice(0, 2) : [],
      meaningZh: meanings.map((item) => cleanMeaning(item?.zh || '')).filter(Boolean).join('；'),
    };
  });

  return [
    'You are generating bilingual collocations / phrase combinations for English vocabulary flashcards.',
    'A collocation is a natural word pairing, like "heavy rain", "make a decision", "take a photo".',
    `Return valid JSON only. No markdown, no commentary.`,
    `For each input word, produce exactly ${collocationCount} collocations.`,
    'Rules:',
    '- Each collocation must be a phrase (2-4 words) that commonly co-occurs with the target word.',
    '- Prefer noun+noun pairs whenever the target word can be used as a noun.',
    '- If the target word has a noun sense, keep the final collocations in noun+noun form.',
    '- The target word must appear in every collocation.',
    '- Keep Chinese translations concise (2-6 characters ideal).',
    '- Use the word\'s primary meaning from the provided context.',
    '- The demo below uses a fake word — generate ORIGINAL collocations for real words.',
    '',
    'Input JSON:',
    JSON.stringify(payload, null, 2),
    '',
    'Output schema:',
    JSON.stringify([
      {
        word: 'zarpox',
        collocations: [
          { en: 'zarpox system', zh: '虚构物系统' },
          { en: 'zarpox model', zh: '虚构物模型' },
          { en: 'zarpox group', zh: '虚构物小组' },
        ],
      },
    ], null, 2),
  ].join('\n');
}

function normalizeCollocationItems(items, expectedWords, collocationCount) {
  const map = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const key = normalizeWordKey(item?.word);
    if (!key) continue;
    const rawCollocations = Array.isArray(item?.collocations) ? item.collocations : [];
    const collocations = rawCollocations
      .map((c) => ({
        en: String(c?.en || '').trim(),
        zh: String(c?.zh || '').trim(),
      }))
      .filter((c) => c.en && c.zh && c.en.toLowerCase().includes(key))
      .slice(0, collocationCount);
    if (collocations.length > 0) {
      map.set(key, collocations);
    }
  }

  const result = new Map();
  for (const entry of expectedWords) {
    const key = normalizeWordKey(entry.word);
    const generated = map.get(key);
    result.set(key, generated && generated.length >= collocationCount ? generated.slice(0, collocationCount) : []);
  }
  return result;
}

async function generateCollocationBatch(entries, config, depth = 0) {
  const { collocationCount, provider, apiKey, endpoint, model, retries } = config;

  if (!Array.isArray(entries) || entries.length === 0) {
    return new Map();
  }

  const prompt = buildCollocationPrompt(entries, collocationCount);
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const responseText = await callLanguageModel(prompt, {
        provider,
        apiKey,
        endpoint,
        model,
        temperature: 0.3,
      });
      const parsed = JSON.parse(extractJsonPayload(responseText));
      return normalizeCollocationItems(parsed, entries, collocationCount);
    } catch (error) {
      lastError = error;
    }
  }

  if (entries.length === 1 || depth >= 3) {
    return new Map(entries.map((entry) => [normalizeWordKey(entry.word), []]));
  }

  const midpoint = Math.max(1, Math.floor(entries.length / 2));
  const left = await generateCollocationBatch(entries.slice(0, midpoint), config, depth + 1);
  const right = await generateCollocationBatch(entries.slice(midpoint), config, depth + 1);
  const merged = new Map();
  left.forEach((value, key) => merged.set(key, value));
  right.forEach((value, key) => merged.set(key, value));

  if (lastError) {
    console.warn(`Collocation generation fell back after error: ${lastError.message || String(lastError)}`);
  }
  return merged;
}

export async function generateCollocationsForEntries(entries, options = {}) {
  const collocationCount = Math.max(1, Number(options.collocationCount || COLLOCATION_COUNT_DEFAULT));
  const provider = String(options.provider || process.env.READING_AI_PROVIDER || 'deepseek').toLowerCase();
  const apiKey = resolveReadingApiKey(options);
  const endpoint = String(
    options.endpoint ||
      process.env.READING_AI_ENDPOINT ||
      process.env.DEEPSEEK_API_ENDPOINT ||
      (provider === 'gemini'
        ? `https://generativelanguage.googleapis.com/v1beta/models/${process.env.READING_AI_MODEL || 'gemini-1.5-flash'}:generateContent`
        : 'https://api.deepseek.com/chat/completions'),
  ).trim();
  const model = String(options.model || process.env.READING_AI_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : 'deepseek-chat')).trim();
  const batchSize = Math.max(1, Number(options.batchSize || 40));
  const retries = Math.max(0, Number(options.retries || 2));
  const onBatchComplete = typeof options.onBatchComplete === 'function' ? options.onBatchComplete : null;
  const results = new Map();

  const workItems = Array.isArray(entries) ? entries.filter((entry) => entry && entry.word) : [];

  for (let index = 0; index < workItems.length; index += batchSize) {
    const batch = workItems.slice(index, index + batchSize);
    const batchResult = await generateCollocationBatch(batch, {
      collocationCount,
      provider,
      apiKey,
      endpoint,
      model,
      retries,
    });

    batchResult.forEach((value, key) => results.set(key, value));
    if (onBatchComplete) {
      await onBatchComplete({
        batch,
        batchResult,
        startIndex: index,
        totalCount: workItems.length,
        results,
      });
    }
  }

  return results;
}
