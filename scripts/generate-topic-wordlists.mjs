import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import {
  buildFallbackExamples,
  normalizeWordKey,
  loadEnvFile,
} from './word-example-generator.mjs';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

loadEnvFile();

const ROOT = process.cwd();
const DB_PATH = path.join(ROOT, 'scripts', 'data', 'stardict.db');
const CACHE_PATH = path.join(ROOT, 'scripts', 'data', 'word-examples-cache.json');
const OUTPUT_DIR = path.join(ROOT, 'public', 'data');
const METADATA_PATH = path.join(OUTPUT_DIR, 'metadata.json');
const DATAMUSE_ENABLED = ['1', 'true', 'yes'].includes(String(process.env.DATAMUSE_ENABLED || '').toLowerCase());
const DATAMUSE_LIMIT = Number(process.env.DATAMUSE_LIMIT || 24);
const DEEPL_API_KEY = process.env.VITE_DEEPL_API_KEY || process.env.READING_DEEPL_API_KEY || '';
const DEEPL_API_BASE = process.env.VITE_DEEPL_API_BASE || 'https://api-free.deepl.com';
const EXAMPLE_COUNT = Math.max(1, Number(process.env.WORD_EXAMPLE_COUNT || 2));

let exampleCacheMap = null;

async function loadExampleCache() {
  if (exampleCacheMap) return exampleCacheMap;
  try {
    const cache = JSON.parse(await fs.readFile(CACHE_PATH, 'utf8'));
    exampleCacheMap = new Map();
    if (cache?.words && typeof cache.words === 'object') {
      for (const [word, examples] of Object.entries(cache.words)) {
        const list = Array.isArray(examples) ? examples : [];
        const valid = list
          .map(e => ({ en: String(e?.en || '').trim(), zh: String(e?.zh || '').trim() }))
          .filter(e => e.en && e.zh)
          .slice(0, EXAMPLE_COUNT);
        if (valid.length > 0) {
          exampleCacheMap.set(normalizeWordKey(word), valid);
        }
      }
    }
    return exampleCacheMap;
  } catch {
    exampleCacheMap = new Map();
    return exampleCacheMap;
  }
}

function getCachedExamples(word) {
  if (!exampleCacheMap) return null;
  return exampleCacheMap.get(normalizeWordKey(word)) || null;
}

const TOPICS = [
  {
    id: 'ai-tech',
    title: 'AI Technology',
    description: 'Artificial intelligence, machine learning, and modern product terms.',
    icon: '\uD83E\uDDE0',
    color: 'from-sky-400 to-cyan-600',
    category: 'scene english',
    seeds: [
      'ai', 'algorithm', 'analysis', 'analyze', 'automation', 'benchmark', 'bot', 'compute', 'computer',
      'data', 'dataset', 'deep', 'deploy', 'device', 'digital', 'engine', 'future', 'generate', 'growth',
      'inference', 'intelligence', 'learn', 'machine', 'model', 'network', 'prompt', 'robot', 'signal', 'system',
      'training', 'transform', 'vision', 'voice', 'workflow', 'accuracy', 'adaptive', 'agent', 'assistant', 'cloud',
      'context', 'forecast', 'framework', 'graph', 'hybrid', 'language', 'layer', 'logic', 'metric', 'neural',
      'optimize', 'pattern', 'predict', 'query', 'retrain', 'scale', 'semantic', 'token', 'vector', 'version',
    ],
  },
  {
    id: 'programming',
    title: 'Programming English',
    description: 'Core vocabulary for coding, debugging, and shipping software.',
    icon: '\uD83D\uDCBB',
    color: 'from-indigo-400 to-blue-600',
    category: 'scene english',
    seeds: [
      'api', 'array', 'binary', 'cache', 'class', 'compile', 'component', 'const', 'database', 'debug',
      'deploy', 'dictionary', 'endpoint', 'function', 'hook', 'input', 'interface', 'library', 'module', 'network',
      'object', 'output', 'package', 'parse', 'pipeline', 'query', 'queue', 'react', 'refactor', 'render',
      'request', 'response', 'route', 'scope', 'script', 'state', 'storage', 'syntax', 'thread', 'type',
      'variable', 'version', 'web', 'worker', 'async', 'auth', 'build', 'chunk', 'commit', 'context',
      'component', 'condition', 'convert', 'deploy', 'event', 'feature', 'git', 'import', 'install', 'log',
      'mock', 'optimize', 'patch', 'plugin', 'priority', 'release', 'schema', 'server', 'store', 'test',
    ],
  },
  {
    id: 'business',
    title: 'Business English',
    description: 'Meetings, sales, strategy, and workplace communication.',
    icon: '\uD83D\uDCCA',
    color: 'from-emerald-400 to-teal-600',
    category: 'scene english',
    seeds: [
      'agenda', 'budget', 'brand', 'business', 'client', 'close', 'company', 'contract', 'cost', 'customer',
      'deadline', 'deliver', 'demand', 'growth', 'income', 'market', 'meeting', 'negotiate', 'partner', 'plan',
      'profit', 'project', 'proposal', 'revenue', 'sales', 'schedule', 'service', 'share', 'strategy', 'team',
      'value', 'target', 'trend', 'update', 'workflow', 'analysis', 'approve', 'balance', 'benefit', 'board',
      'capital', 'channel', 'conference', 'consult', 'contract', 'customer', 'decision', 'finance', 'forecast', 'goal',
      'invest', 'lead', 'manage', 'margin', 'office', 'owner', 'performance', 'presentation', 'priority', 'product',
      'research', 'resource', 'risk', 'shareholder', 'supply', 'trade', 'value', 'vision', 'workload', 'yield',
    ],
  },
  {
    id: 'science',
    title: 'Science English',
    description: 'Physics, chemistry, biology, and research language.',
    icon: '\uD83E\uDDEA',
    color: 'from-violet-400 to-fuchsia-600',
    category: 'scene english',
    seeds: [
      'atom', 'biology', 'cell', 'chemical', 'chemistry', 'climate', 'code', 'data', 'energy', 'experiment',
      'factor', 'gene', 'gravity', 'heat', 'hypothesis', 'impact', 'laboratory', 'measurement', 'molecule', 'nature',
      'observation', 'particle', 'physics', 'planet', 'reaction', 'research', 'science', 'signal', 'species', 'system',
      'theory', 'temperature', 'trial', 'universe', 'variable', 'analysis', 'behaviour', 'control', 'density', 'device',
      'element', 'evidence', 'growth', 'health', 'input', 'method', 'model', 'process', 'result', 'sample',
      'structure', 'surface', 'technology', 'test', 'topic', 'wave', 'water', 'energy', 'researcher', 'observable',
    ],
  },
  {
    id: 'automotive',
    title: 'Automotive English',
    description: 'Car parts, maintenance, driving, and mobility vocabulary.',
    icon: '\uD83D\uDE97',
    color: 'from-orange-400 to-red-600',
    category: 'scene english',
    seeds: [
      'accelerate', 'airbag', 'brake', 'car', 'clutch', 'dashboard', 'dealer', 'engine', 'fuel', 'garage',
      'gear', 'grip', 'headlight', 'hybrid', 'ignition', 'lane', 'maintenance', 'mechanic', 'mirror', 'motor',
      'oil', 'parking', 'pedal', 'performance', 'plate', 'repair', 'road', 'safety', 'sedan', 'speed',
      'steer', 'suspension', 'tire', 'traction', 'transmission', 'trunk', 'vehicle', 'wheel', 'windshield', 'battery',
      'charging', 'electric', 'efficiency', 'emission', 'navigation', 'sensor', 'software', 'torque', 'traffic', 'turbo',
      'warning', 'warranty', 'wheelbase', 'automobile', 'bump', 'cab', 'door', 'drive', 'driver', 'emergency',
      'fleet', 'fuel', 'inspection', 'license', 'mirror', 'motorist', 'route', 'service', 'signal', 'speedometer',
    ],
  },
  {
    id: 'medical',
    title: 'Medical English',
    description: 'Health care, symptoms, treatment, and hospital vocabulary.',
    icon: '\u2695',
    color: 'from-rose-400 to-pink-600',
    category: 'scene english',
    seeds: [
      'allergy', 'anatomy', 'appointment', 'blood', 'care', 'clinic', 'condition', 'cure', 'diagnosis', 'doctor',
      'disease', 'dose', 'emergency', 'fever', 'health', 'hygiene', 'hospital', 'immune', 'infection', 'injury',
      'medicine', 'nurse', 'pain', 'patient', 'pharmacy', 'prescription', 'pressure', 'pulse', 'recovery', 'rehabilitation',
      'symptom', 'therapy', 'treatment', 'virus', 'vaccine', 'wellness', 'wound', 'ward', 'surgery', 'screening',
      'anxiety', 'clinic', 'consultation', 'dehydration', 'fatigue', 'fracture', 'immunization', 'radiology', 'scan', 'stethoscope',
      'tablet', 'temperature', 'test', 'therapy', 'urgent', 'vital', 'ward', 'weight', 'xray', 'oxygen',
      'bloodstream', 'cardiology', 'dermatology', 'epidemic', 'gene', 'nutrition', 'outpatient', 'paramedic', 'prevention', 'rehab',
    ],
  },
  {
    id: 'finance',
    title: 'Finance English',
    description: 'Money, banking, investing, and market vocabulary.',
    icon: '\uD83D\uDCB0',
    color: 'from-green-400 to-emerald-600',
    category: 'scene english',
    seeds: [
      'account', 'asset', 'bank', 'bond', 'budget', 'capital', 'cash', 'cost', 'credit', 'debt',
      'deposit', 'economy', 'equity', 'finance', 'fund', 'income', 'interest', 'investment', 'invoice', 'loan',
      'market', 'money', 'payment', 'profit', 'rate', 'revenue', 'risk', 'saving', 'share', 'stock',
      'tax', 'trade', 'value', 'wealth', 'withdraw', 'audit', 'balance', 'borrow', 'broker', 'budgeting',
      'cashflow', 'creditor', 'currency', 'dividend', 'exchange', 'expense', 'forecast', 'inflation', 'liability', 'margin',
      'portfolio', 'quote', 'return', 'securities', 'statement', 'transaction', 'treasury', 'valuation', 'yield', 'asset',
      'banking', 'capital', 'charge', 'commission', 'consumer', 'deposit', 'funding', 'insure', 'liquid', 'payment',
    ],
  },
];

function findDbFile() {
  if (existsSync(DB_PATH)) return DB_PATH;
  throw new Error(`Could not find SQLite database at ${DB_PATH}`);
}

function existsSync(filePath) {
  try {
    return require('node:fs').existsSync(filePath);
  } catch {
    return false;
  }
}

function uniq(items) {
  return [...new Set(items)];
}

function normalize(value) {
  return String(value ?? '').trim();
}

function parsePartsOfSpeech(pos) {
  const parts = [];
  if (!pos) return ['n.'];

  for (const raw of String(pos).split('/')) {
    const match = raw.trim().match(/^([a-z]+)/i);
    if (!match) continue;
    const item = `${match[1].toLowerCase()}.`;
    if (!parts.includes(item)) parts.push(item);
  }

  return parts.length ? parts.slice(0, 3) : ['n.'];
}

function buildDefinitions(row, word) {
  const enDefs = normalize(row.definition).split('\n').map(s => s.trim()).filter(Boolean);
  const zhDefs = normalize(row.translation).split('\n').map(s => s.trim()).filter(Boolean);

  if (zhDefs.length > 0) {
    return zhDefs.slice(0, 3).map((zh, i) => ({
      en: enDefs[i] || '',
      zh,
    }));
  }

  if (enDefs.length > 0) {
    return enDefs.slice(0, 3).map((en) => ({
      en,
      zh: word,
    }));
  }

  return [{ en: word, zh: word }];
}

function buildWord(row, index, listId) {
  const word = normalize(row.word);
  const definitions = buildDefinitions(row, word);
  const partOfSpeech = parsePartsOfSpeech(row.pos);
  const cached = getCachedExamples(word);
  return {
    id: `${listId}-${String(index + 1).padStart(4, '0')}`,
    word,
    phonetic: row.phonetic ? `/${normalize(row.phonetic)}/` : '',
    partOfSpeech,
    definitions,
    examples: cached || buildFallbackExamples({
      word,
      partOfSpeech,
      definitions,
    }, EXAMPLE_COUNT),
    imageQuery: word,
  };
}

function buildFallbackRemoteWord(word, index, listId) {
  const clean = normalize(word);
  const definitions = [{ en: clean, zh: clean }];
  const partOfSpeech = ['n.'];
  const cached = getCachedExamples(clean);
  return {
    id: `${listId}-remote-${String(index + 1).padStart(4, '0')}`,
    word: clean,
    phonetic: '',
    partOfSpeech,
    definitions,
    examples: cached || buildFallbackExamples({
      word: clean,
      partOfSpeech,
      definitions,
    }, EXAMPLE_COUNT),
    imageQuery: clean,
  };
}

function queryWords(db, seeds) {
  const normalized = uniq(seeds.map(seed => seed.toLowerCase())).filter(Boolean);
  if (normalized.length === 0) return [];
  const placeholders = normalized.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT word, phonetic, definition, translation, pos, bnc, frq
     FROM stardict
     WHERE LOWER(word) IN (${placeholders})
     ORDER BY CASE WHEN bnc > 0 THEN bnc ELSE 999999 END ASC,
              CASE WHEN frq > 0 THEN frq ELSE 0 END DESC`
  ).all(...normalized);

  const seen = new Set();
  return rows.filter((row) => {
    const key = String(row.word || '').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchDatamuseWords(seed) {
  if (!DATAMUSE_ENABLED) return [];

  const url = new URL('https://api.datamuse.com/words');
  url.searchParams.set('ml', seed);
  url.searchParams.set('max', String(DATAMUSE_LIMIT));

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'WordWise-Topic-Generator/1.0',
      },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data)
      ? data
          .map(item => normalize(item.word))
          .filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

async function expandSeedsWithDatamuse(seeds) {
  if (!DATAMUSE_ENABLED) return uniq(seeds);
  const uniqueSeeds = uniq(seeds.map(seed => seed.toLowerCase())).filter(Boolean);
  const related = await Promise.all(uniqueSeeds.slice(0, 6).map(seed => fetchDatamuseWords(seed)));
  return uniq([...uniqueSeeds, ...related.flat()]);
}

function isRemoteWordCandidate(word) {
  return /^[a-z][a-z'-]*$/i.test(word) && word.length > 1;
}

async function fetchDictionaryApiEntry(word) {
  const clean = normalize(word).toLowerCase();
  if (!clean || !isRemoteWordCandidate(clean)) return null;

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`);
    if (!response.ok) return null;
    const data = await response.json();
    const entry = Array.isArray(data) ? data[0] : null;
    if (!entry) return null;

    const meanings = Array.isArray(entry.meanings) ? entry.meanings : [];
    const partOfSpeech = [];
    const definitionTexts = [];
    const exampleTexts = [];

    for (const meaning of meanings.slice(0, 3)) {
      const pos = normalize(meaning.partOfSpeech);
      if (pos) {
        const normalizedPos = `${pos.split(' ')[0].toLowerCase()}.`;
        if (!partOfSpeech.includes(normalizedPos)) partOfSpeech.push(normalizedPos);
      }

      const definitions = Array.isArray(meaning.definitions) ? meaning.definitions : [];
      for (const def of definitions.slice(0, 2)) {
        const text = normalize(def.definition);
        if (text && !definitionTexts.includes(text)) {
          definitionTexts.push(text);
        }
        const example = normalize(def.example);
        if (example && !exampleTexts.includes(example)) {
          exampleTexts.push(example);
        }
      }
    }

    const phonetic = normalize(entry.phonetic || entry.phonetics?.find((item) => normalize(item?.text))?.text || '');

    return {
      word: entry.word || clean,
      phonetic: phonetic ? phonetic : '',
      partOfSpeech: partOfSpeech.length ? partOfSpeech.slice(0, 3) : ['n.'],
      definitionTexts: definitionTexts.length ? definitionTexts : [clean],
      exampleTexts: exampleTexts.length ? exampleTexts.slice(0, 2) : [],
      origin: normalize(entry.origin || ''),
    };
  } catch {
    return null;
  }
}

async function translateTextsDeepL(texts) {
  const key = normalize(DEEPL_API_KEY);
  if (!key || !Array.isArray(texts) || texts.length === 0) return null;

  const response = await fetch(`${DEEPL_API_BASE.replace(/\/$/, '')}/v2/translate`, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: texts,
      target_lang: 'ZH',
      source_lang: 'EN',
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return Array.isArray(data?.translations) ? data.translations.map((item) => normalize(item?.text)) : null;
}

async function enrichRemoteEntries(remoteWords, listId) {
  const entries = [];
  for (const word of remoteWords) {
    const entry = await fetchDictionaryApiEntry(word);
    if (entry) entries.push(entry);
  }

  if (entries.length === 0) return [];

  const translationInputs = entries.flatMap((entry) => [...entry.definitionTexts, ...entry.exampleTexts]);
  const translated = await translateTextsDeepL(translationInputs);
  let cursor = 0;

  return entries.map((entry, index) => {
    const definitions = entry.definitionTexts.map((text) => {
      const zh = translated?.[cursor++] || '';
      return {
        en: text,
        zh: zh || text,
      };
    });

    const examples = entry.exampleTexts.length > 0
      ? entry.exampleTexts.map((text) => {
          const zh = translated?.[cursor++] || '';
          return {
            en: text,
            zh: zh || text,
          };
        })
      : getCachedExamples(normalize(entry.word)) || buildFallbackExamples({
          word: normalize(entry.word),
          partOfSpeech: entry.partOfSpeech,
          definitions,
        }, EXAMPLE_COUNT);

    return {
      id: `${listId}-remote-${String(index + 1).padStart(4, '0')}`,
      word: normalize(entry.word),
      phonetic: entry.phonetic || '',
      partOfSpeech: entry.partOfSpeech.length ? entry.partOfSpeech : ['n.'],
      definitions,
      examples,
      imageQuery: normalize(entry.word),
      etymology: entry.origin || undefined,
    };
  });
}

async function loadMetadata() {
  try {
    const raw = await fs.readFile(METADATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { version: '0', generated: new Date().toISOString(), lists: {} };
  }
}

async function writeMetadata(topicCounts) {
  const previous = await loadMetadata();
  const merged = {
    version: '3',
    generated: new Date().toISOString(),
    lists: {
      ...(previous.lists || {}),
      ...Object.fromEntries(Object.entries(topicCounts).map(([id, totalWords]) => [id, { totalWords }])),
    },
  };
  await fs.mkdir(path.dirname(METADATA_PATH), { recursive: true });
  await fs.writeFile(METADATA_PATH, JSON.stringify(merged, null, 2), 'utf8');
}

async function main() {
  await loadExampleCache();
  const dbPath = findDbFile();
  const db = new Database(dbPath, { readonly: true });
  const generatedCounts = {};

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const topic of TOPICS) {
    const expandedSeeds = await expandSeedsWithDatamuse(topic.seeds);
    const rows = queryWords(db, expandedSeeds);
    const localWords = rows.map((row, index) => buildWord(row, index, topic.id));
    const localWordSet = new Set(rows.map((row) => normalize(row.word).toLowerCase()).filter(Boolean));
    const remoteSeeds = expandedSeeds.filter((seed) => !localWordSet.has(seed.toLowerCase()));
    const remoteWords = await enrichRemoteEntries(remoteSeeds.slice(0, 18), topic.id);
    const words = [...localWords, ...remoteWords];
    const outputPath = path.join(OUTPUT_DIR, `${topic.id}.json`);
    await fs.writeFile(outputPath, JSON.stringify(words, null, 2), 'utf8');
    generatedCounts[topic.id] = words.length;
    console.log(`${topic.id}: ${words.length} words${DATAMUSE_ENABLED ? ` (expanded from ${expandedSeeds.length} seeds, ${remoteWords.length} remote)` : ''}`);
  }

  db.close();
  await writeMetadata(generatedCounts);
  console.log('metadata.json updated');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
