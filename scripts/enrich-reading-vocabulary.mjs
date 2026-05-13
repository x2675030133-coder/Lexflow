import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const SRC_OUTPUT_FILE = path.join(ROOT, 'src', 'data', 'generatedReading.ts');
const PUBLIC_OUTPUT_FILE = path.join(ROOT, 'public', 'data', 'generated-reading.json');
const SERVER_OUTPUT_FILE = path.join(ROOT, 'server', 'data', 'generated-reading.json');
const WORD_LIST_EXCLUDE = new Set(['metadata.json', 'generated-reading.json', 'generated-reading-meta.json']);

function cleanZhDefinition(value) {
  return String(value || '')
    .replace(/^\s*(?:n|v|vt|vi|adj|adv|prep|conj|pron|art|num|int|abbr|aux|det|pl|a|r|c|i|s)\.\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function buildDefinitionZhLookup() {
  const lookup = new Map();
  const files = (await fs.readdir(DATA_DIR))
    .filter((file) => file.endsWith('.json') && !WORD_LIST_EXCLUDE.has(file))
    .sort();

  for (const file of files) {
    const records = JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf8'));
    if (!Array.isArray(records)) continue;

    for (const record of records) {
      const word = String(record?.word || '').toLowerCase().trim();
      if (!word || lookup.has(word)) continue;
      const definitions = Array.isArray(record?.definitions) ? record.definitions : [];
      const zh = cleanZhDefinition(definitions.find((definition) => definition?.zh)?.zh);
      if (zh) lookup.set(word, zh);
    }
  }

  return lookup;
}

function enrichArticles(articles, lookup) {
  let updated = 0;
  const nextArticles = articles.map((article) => ({
    ...article,
    vocabulary: Array.isArray(article.vocabulary)
      ? article.vocabulary.map((item) => {
          const word = String(item?.word || '').toLowerCase().trim();
          const definitionZh = lookup.get(word);
          if (!definitionZh || item.definitionZh === definitionZh) return item;
          updated += 1;
          return { ...item, definitionZh };
        })
      : [],
  }));

  return { articles: nextArticles, updated };
}

function renderTypeScript(articles) {
  return `import type { Article } from './articles';\n\nexport const generatedReading: Article[] = ${JSON.stringify(articles, null, 2)};\n`;
}

async function main() {
  const lookup = await buildDefinitionZhLookup();
  const articles = JSON.parse(await fs.readFile(PUBLIC_OUTPUT_FILE, 'utf8'));
  const { articles: enrichedArticles, updated } = enrichArticles(Array.isArray(articles) ? articles : [], lookup);
  const json = JSON.stringify(enrichedArticles, null, 2);

  await Promise.all([
    fs.writeFile(PUBLIC_OUTPUT_FILE, json, 'utf8'),
    fs.writeFile(SERVER_OUTPUT_FILE, json, 'utf8'),
    fs.writeFile(SRC_OUTPUT_FILE, renderTypeScript(enrichedArticles), 'utf8'),
  ]);

  console.log(`ok: enriched ${updated} reading vocabulary entries.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
