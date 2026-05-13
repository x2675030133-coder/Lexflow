import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'public', 'data');
const IGNORE_FILES = new Set(['metadata.json', 'generated-reading.json', 'generated-reading-meta.json']);

const BANNED_PATTERNS = [
  'and and development',
  'important and',
  'study of and',
  'use of and',
  'more the',
  'quite the',
  'very the',
  'be successfully',
  'how to be',
  'to be effectively',
  'try to be',
  'feel the',
  'have a decision',
  'have progress',
  'behave a decision',
  'behave a plan',
  'behave progress',
  'behave time',
  'shave a decision',
  'shave a plan',
  'shave progress',
  'shave time',
];

const REQUIRED_PHRASE_PATTERNS = new Map([
  ['go to', '\u52a8\u8bcd + \u4ecb\u8bcd'],
  ['want to do', '\u52a8\u8bcd + \u4e0d\u5b9a\u5f0f'],
  ['need to do', '\u52a8\u8bcd + \u4e0d\u5b9a\u5f0f'],
  ['be able to', '\u5f62\u5bb9\u8bcd + \u4e0d\u5b9a\u5f0f'],
  ['and also', '\u9012\u8fdb\u8fde\u63a5'],
  ['and so on', '\u5217\u4e3e\u8868\u8fbe'],
  ['and then', '\u987a\u627f\u8fde\u63a5'],
  ['both and', '\u5e76\u5217\u7ed3\u6784'],
  ['but also', '\u9012\u8fdb\u8fde\u63a5'],
  ['but then', '\u8f6c\u6298\u8fde\u63a5'],
  ['but not', '\u8f6c\u6298\u8fde\u63a5'],
  ['but rather', '\u8f6c\u6298\u8fde\u63a5'],
  ['or else', '\u9009\u62e9\u7ed3\u6784'],
  ['either or', '\u9009\u62e9\u7ed3\u6784'],
  ['one or the other', '\u9009\u62e9\u7ed3\u6784'],
  ['a or b', '\u9009\u62e9\u7ed3\u6784'],
  ['if so', '\u6761\u4ef6\u8868\u8fbe'],
  ['if not', '\u6761\u4ef6\u8868\u8fbe'],
  ['if only', '\u6761\u4ef6\u8868\u8fbe'],
  ['if necessary', '\u6761\u4ef6\u8868\u8fbe'],
  ['when needed', '\u65f6\u95f4\u8868\u8fbe'],
  ['when possible', '\u65f6\u95f4\u8868\u8fbe'],
  ['when to go', '\u65f6\u95f4\u8868\u8fbe'],
  ['when and where', '\u65f6\u95f4\u8868\u8fbe'],
  ['while doing', '\u65f6\u95f4\u8868\u8fbe'],
  ['while waiting', '\u65f6\u95f4\u8868\u8fbe'],
  ['while still', '\u8ba9\u6b65\u8868\u8fbe'],
  ['while at work', '\u65f6\u95f4\u8868\u8fbe'],
  ['because of', '\u539f\u56e0\u8868\u8fbe'],
  ['because of this', '\u539f\u56e0\u8868\u8fbe'],
  ['because of that', '\u539f\u56e0\u8868\u8fbe'],
  ['because of me', '\u539f\u56e0\u8868\u8fbe'],
  ['although still', '\u8ba9\u6b65\u8868\u8fbe'],
  ['although not', '\u8ba9\u6b65\u8868\u8fbe'],
  ['although possible', '\u8ba9\u6b65\u8868\u8fbe'],
  ['although it', '\u8ba9\u6b65\u8868\u8fbe'],
  ['neither nor', '\u5e76\u5217\u7ed3\u6784'],
  ['nor do i', '\u5e76\u5217\u7ed3\u6784'],
  ['nor can he', '\u5e76\u5217\u7ed3\u6784'],
  ['nor yet', '\u5e76\u5217\u7ed3\u6784'],
  ['so that', '\u7ed3\u679c\u8868\u8fbe'],
  ['so far', '\u65f6\u95f4\u8868\u8fbe'],
  ['so much', '\u7a0b\u5ea6\u8868\u8fbe'],
  ['so on', '\u5217\u4e3e\u8868\u8fbe'],
]);

const STRICT_WORD_PATTERNS = new Map([
  ['a', new Set(['冠词 + 名词', '限定词 + 形容词'])],
  ['an', new Set(['冠词 + 名词', '限定词 + 形容词'])],
  ['the', new Set(['冠词 + 名词', '冠词 + 形容词'])],
  ['their', new Set(['限定词 + 名词'])],
  ['and', new Set(['常见搭配'])],
  ['but', new Set(['常见搭配'])],
  ['or', new Set(['常见搭配'])],
  ['if', new Set(['常见搭配'])],
  ['when', new Set(['常见搭配'])],
  ['while', new Set(['常见搭配'])],
  ['because', new Set(['常见搭配'])],
  ['although', new Set(['常见搭配'])],
  ['nor', new Set(['常见搭配'])],
  ['so', new Set(['常见搭配'])],
  ['for', new Set(['名词 + 介词', '动词 + 介词', '常见搭配'])],
  ['of', new Set(['名词 + 介词', '数量短语', '介词短语', '程度短语'])],
]);

STRICT_WORD_PATTERNS.set('to', new Set([
  '\u52a8\u8bcd + \u4ecb\u8bcd',
  '\u52a8\u8bcd + \u4e0d\u5b9a\u5f0f',
  '\u5f62\u5bb9\u8bcd + \u4e0d\u5b9a\u5f0f',
]));

async function main() {
  const files = (await fs.readdir(DATA_DIR))
    .filter((file) => file.endsWith('.json') && !IGNORE_FILES.has(file))
    .sort();

  const hits = [];

  for (const file of files) {
    const fullPath = path.join(DATA_DIR, file);
    const data = JSON.parse(await fs.readFile(fullPath, 'utf8'));
    const words = Array.isArray(data) ? data : [];

    for (const wordRecord of words) {
      const word = String(wordRecord?.word || '').toLowerCase();
      const collocations = Array.isArray(wordRecord?.collocations) ? wordRecord.collocations : [];
      for (const row of collocations) {
        const phrase = String(row?.en || '').toLowerCase().trim();
        if (BANNED_PATTERNS.includes(phrase)) {
          hits.push({ file, word: wordRecord?.word, pattern: phrase });
        }
        const requiredPattern = REQUIRED_PHRASE_PATTERNS.get(phrase);
        const rowPattern = String(row?.pattern || '');
        if (phrase === 'be able to' && word !== 'to') {
          continue;
        }
        if (requiredPattern) {
          if (rowPattern !== requiredPattern) {
            hits.push({ file, word: wordRecord?.word, expected: requiredPattern, pattern: rowPattern, phrase });
          }
          continue;
        }
        const allowedPatterns = STRICT_WORD_PATTERNS.get(word);
        if (allowedPatterns && !allowedPatterns.has(rowPattern)) {
          hits.push({ file, word: wordRecord?.word, pattern: rowPattern, phrase });
        }
      }
    }
  }

  if (hits.length > 0) {
    console.error(JSON.stringify(hits, null, 2));
    process.exit(1);
  }

  console.log(`ok: scanned ${files.length} word lists, no banned collocation patterns found.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
