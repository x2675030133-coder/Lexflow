import fs from 'node:fs/promises';
import path from 'node:path';
import {
  generateExamplesForEntries,
  loadEnvFile,
  normalizeWordKey,
  examplesNeedRefresh,
  shouldRefreshWordExamples,
  buildFallbackExamples,
} from './word-example-generator.mjs';

const ROOT = process.cwd();
const PUBLIC_DATA_DIR = path.join(ROOT, 'public', 'data');
const CACHE_PATH = path.join(ROOT, 'scripts', 'data', 'word-examples-cache.json');
const METADATA_PATH = path.join(PUBLIC_DATA_DIR, 'metadata.json');
const EXAMPLE_COUNT = Math.max(1, Number(process.env.WORD_EXAMPLE_COUNT || 2));
const BATCH_SIZE = Math.max(1, Number(process.env.WORD_EXAMPLE_BATCH_SIZE || 40));

loadEnvFile();

function isWordListFile(fileName) {
  return fileName.endsWith('.json') && fileName !== 'metadata.json' && fileName !== 'generated-reading.json' && fileName !== 'generated-reading-meta.json';
}

async function readJson(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  return JSON.parse(text);
}

async function writeJson(filePath, value, pretty = false) {
  const content = pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value);
  await fs.writeFile(filePath, content, 'utf8');
}

async function saveCache(cache) {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await writeJson(CACHE_PATH, cache, true);
}

async function loadCache() {
  try {
    const cache = await readJson(CACHE_PATH);
    return cache?.words && typeof cache.words === 'object' ? cache : { version: 1, generated: '', examplesPerWord: EXAMPLE_COUNT, words: {} };
  } catch {
    return { version: 1, generated: '', examplesPerWord: EXAMPLE_COUNT, words: {} };
  }
}

function normalizeCacheWordEntry(entry, examplesPerWord = EXAMPLE_COUNT) {
  const examples = Array.isArray(entry) ? entry : Array.isArray(entry?.examples) ? entry.examples : [];
  return examples
    .map((example) => ({
      en: String(example?.en || '').trim(),
      zh: String(example?.zh || '').trim(),
    }))
    .filter((example) => example.en && example.zh)
    .slice(0, examplesPerWord);
}

async function loadWordListFiles() {
  const files = (await fs.readdir(PUBLIC_DATA_DIR)).filter(isWordListFile).sort();
  const result = [];

  for (const fileName of files) {
    const filePath = path.join(PUBLIC_DATA_DIR, fileName);
    const data = await readJson(filePath);
    if (Array.isArray(data)) {
      result.push({ fileName, filePath, words: data });
    }
  }

  return result;
}

function isPlaceholderWord(wordRecord, cacheWords) {
  const key = normalizeWordKey(wordRecord.word);
  if (cacheWords[key] && cacheWords[key].length > 0 && !examplesNeedRefresh(cacheWords[key])) return false;
  return shouldRefreshWordExamples(wordRecord);
}

async function main() {
  const cache = await loadCache();
  const cacheWords = Object.fromEntries(
    Object.entries(cache.words || {}).map(([word, examples]) => [normalizeWordKey(word), normalizeCacheWordEntry(examples, EXAMPLE_COUNT)]),
  );

  const files = await loadWordListFiles();
  const uniqueEntries = [];
  const seen = new Set();

  for (const file of files) {
    for (const wordRecord of file.words) {
      const key = normalizeWordKey(wordRecord.word);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      if (isPlaceholderWord(wordRecord, cacheWords)) {
        uniqueEntries.push({
          word: wordRecord.word,
          partOfSpeech: wordRecord.partOfSpeech || [],
          definitions: wordRecord.definitions || [],
          examples: wordRecord.examples || [],
        });
      }
    }
  }

  console.log(`Found ${uniqueEntries.length} words that still need refreshed examples.`);

  cache.words = cacheWords;
  cache.examplesPerWord = EXAMPLE_COUNT;
  cache.generated = cache.generated || '';
  cache.version = Number(cache.version || 1);
  await saveCache(cache);

  let processedCount = 0;
  const generated = uniqueEntries.length > 0
    ? await generateExamplesForEntries(uniqueEntries, {
        examplesPerWord: EXAMPLE_COUNT,
        batchSize: BATCH_SIZE,
        retries: 2,
        onBatchComplete: async ({ batch, batchResult }) => {
          batchResult.forEach((value, key) => {
            cacheWords[normalizeWordKey(key)] = value;
          });
          processedCount += batch.length;
          cache.words = cacheWords;
          cache.examplesPerWord = EXAMPLE_COUNT;
          cache.generated = new Date().toISOString();
          cache.version = Number(cache.version || 1);
          await saveCache(cache);
          console.log(`Cached ${processedCount}/${uniqueEntries.length} refreshed words`);
        },
      })
    : new Map();

  for (const [word, examples] of generated.entries()) {
    cacheWords[normalizeWordKey(word)] = examples;
  }

  cache.words = cacheWords;
  cache.examplesPerWord = EXAMPLE_COUNT;
  cache.generated = new Date().toISOString();
  cache.version = Number(cache.version || 1);
  await saveCache(cache);

  for (const file of files) {
    const nextWords = file.words.map((wordRecord) => {
      const key = normalizeWordKey(wordRecord.word);
      if (!shouldRefreshWordExamples(wordRecord)) {
        return wordRecord;
      }

      const examples = cacheWords[key] || generated.get(key);
      if (examples && examples.length > 0) {
        return {
          ...wordRecord,
          examples: examples.slice(0, EXAMPLE_COUNT),
        };
      }

      return {
        ...wordRecord,
        examples: buildFallbackExamples(wordRecord, EXAMPLE_COUNT),
      };
    });

    await writeJson(file.filePath, nextWords);
    console.log(`Updated ${file.fileName} (${nextWords.length} words)`);
  }

  const metadata = await readJson(METADATA_PATH).catch(() => ({ version: '0', generated: '', lists: {} }));
  const nextMetadata = {
    ...metadata,
    version: String(Number(metadata.version || 0) + 1),
    generated: new Date().toISOString(),
    lists: metadata.lists || {},
  };
  await writeJson(METADATA_PATH, nextMetadata, true);
  console.log('metadata.json refreshed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
