import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DATA_DIR = path.join(ROOT, 'public', 'data');
const WORD_LIST_EXCLUDE = new Set(['metadata.json', 'generated-reading.json', 'generated-reading-meta.json']);

const PLACEHOLDER_PATTERNS = [
  'i need to learn the word',
  'i use the word',
  'appears in a simple sentence',
  'natural context',
  'try using',
  'this sentence uses',
  'when i study this topic',
  'when studying this topic',
  'i am learning the word',
  'this is an example sentence',
  'sample sentence',
  'placeholder',
];

const PLACEHOLDER_REGEXES = [
  /\bwe used\b.*\bin the sentence\b/i,
  /\bplease pay attention to\b/i,
];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function buildFallbackExampleSet(word) {
  const lower = normalizeText(word);
  if (!lower) return new Set();

  return new Set([
    `the ${lower} plays an important role in daily life.`,
    `people use the ${lower} in many situations.`,
    `this ${lower} helps people solve a problem.`,
    `a good ${lower} can make things easier.`,
    `she learned about the ${lower} in class.`,
    `they ${lower} every day to make progress.`,
    `we need to ${lower} carefully before we decide.`,
    `the team will ${lower} the plan this week.`,
    `she tried to ${lower} the problem step by step.`,
    `students often ${lower} when they practice every day.`,
    `the result is ${lower}.`,
    `it is a ${lower} choice for this task.`,
    `her answer sounded ${lower}.`,
    `the room looks ${lower} after cleaning.`,
    `that was a ${lower} idea.`,
    `he spoke ${lower}.`,
    `please read it ${lower}.`,
    `the team finished the task ${lower}.`,
    `she replied ${lower} and left the room.`,
    `we should move ${lower} and stay focused.`,
  ]);
}

function looksSuspicious(word, example) {
  const text = normalizeText(`${example?.en || ''} ${example?.zh || ''}`);
  if (!text) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => text.includes(pattern))
    || PLACEHOLDER_REGEXES.some((pattern) => pattern.test(text))
    || buildFallbackExampleSet(word?.word).has(normalizeText(example?.en));
}

async function readJson(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  return JSON.parse(text);
}

async function main() {
  const files = (await fs.readdir(PUBLIC_DATA_DIR))
    .filter((name) => name.endsWith('.json') && !WORD_LIST_EXCLUDE.has(name))
    .sort();

  const issues = [];
  let checkedWords = 0;

  for (const fileName of files) {
    const filePath = path.join(PUBLIC_DATA_DIR, fileName);
    const data = await readJson(filePath);
    if (!Array.isArray(data)) continue;

    for (const word of data) {
      checkedWords += 1;
      const examples = Array.isArray(word?.examples) ? word.examples : [];
      const normalized = examples.map((example) => normalizeText(example?.en));
      const duplicates = normalized.filter(Boolean).filter((value, index, arr) => arr.indexOf(value) !== index);
      const suspiciousExamples = examples.filter((example) => looksSuspicious(word, example));

      if (duplicates.length > 0 || suspiciousExamples.length > 0) {
        issues.push({
          fileName,
          word: word?.word || '',
          duplicateCount: duplicates.length,
          suspiciousCount: suspiciousExamples.length,
        });
      }
    }
  }

  console.log(`Checked ${checkedWords} words across ${files.length} files.`);
  if (issues.length === 0) {
    console.log('No suspicious example sentences found.');
  }

  const notesPath = path.join(ROOT, 'src', 'data', 'wordUsageNotes.ts');
  const notesText = await fs.readFile(notesPath, 'utf8').catch(() => '');
  const hasTemplateText = PLACEHOLDER_PATTERNS.some((pattern) => notesText.toLowerCase().includes(pattern));

  if (issues.length > 0) {
    console.log(`Found ${issues.length} suspicious entries:`);
    for (const issue of issues.slice(0, 50)) {
      console.log(`- ${issue.fileName}: ${issue.word} (duplicates: ${issue.duplicateCount}, suspicious: ${issue.suspiciousCount})`);
    }
    if (issues.length > 50) {
      console.log(`... and ${issues.length - 50} more.`);
    }
  }

  if (hasTemplateText) {
    console.log('Template-style example text was found in src/data/wordUsageNotes.ts.');
  }

  if (issues.length > 0 || hasTemplateText) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
