import fs from 'node:fs/promises';
import path from 'node:path';
import { normalizeWordKey } from './word-example-generator.mjs';

const ROOT = process.cwd();
const PUBLIC_DATA_DIR = path.join(ROOT, 'public', 'data');
const METADATA_PATH = path.join(PUBLIC_DATA_DIR, 'metadata.json');
const COLLOCATION_COUNT = 4;

const PREPOSITIONS = new Set([
  'about',
  'above',
  'across',
  'after',
  'against',
  'along',
  'among',
  'around',
  'at',
  'before',
  'behind',
  'below',
  'beneath',
  'between',
  'by',
  'down',
  'during',
  'for',
  'from',
  'in',
  'into',
  'of',
  'off',
  'on',
  'over',
  'through',
  'to',
  'toward',
  'towards',
  'under',
  'with',
  'without',
]);

const ARTICLES = new Set(['a', 'an', 'the']);
const DETERMINERS = new Set([
  'this',
  'that',
  'these',
  'those',
  'my',
  'your',
  'his',
  'her',
  'its',
  'our',
  'their',
  'some',
  'any',
  'each',
  'every',
  'many',
  'much',
  'few',
  'little',
  'no',
]);

const PATTERN_ORDER = [
  '动词 + 名词',
  '形容词 + 名词',
  '名词 + 介词',
  '动词 + 介词',
  '名词 + 名词',
  '形容词 + 介词',
  '副词 + 动词',
  '冠词 + 名词',
  '常见搭配',
];

const PHRASE_PATTERNS = new Map([
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

const SPECIAL_COLLOCATIONS = {
  the: [
    { pattern: '冠词 + 名词', en: 'the sun', zh: '太阳' },
    { pattern: '冠词 + 名词', en: 'the book', zh: '这本书' },
    { pattern: '冠词 + 名词', en: 'the idea', zh: '这个想法' },
    { pattern: '冠词 + 名词', en: 'the city', zh: '这座城市' },
  ],
  their: [
    { pattern: '限定词 + 名词', en: 'their plan', zh: '他们的计划' },
    { pattern: '限定词 + 名词', en: 'their idea', zh: '他们的想法' },
    { pattern: '限定词 + 名词', en: 'their work', zh: '他们的工作' },
    { pattern: '限定词 + 名词', en: 'their role', zh: '他们的角色' },
  ],
  a: [
    { pattern: '冠词 + 名词', en: 'a book', zh: '一本书' },
    { pattern: '冠词 + 名词', en: 'a student', zh: '一名学生' },
    { pattern: '冠词 + 名词', en: 'a day', zh: '一天' },
    { pattern: '限定词 + 形容词', en: 'a little', zh: '一点；稍微' },
  ],
  an: [
    { pattern: '冠词 + 名词', en: 'an apple', zh: '一个苹果' },
    { pattern: '冠词 + 名词', en: 'an idea', zh: '一个想法' },
    { pattern: '冠词 + 名词', en: 'an hour', zh: '一小时' },
    { pattern: '冠词 + 名词', en: 'an answer', zh: '一个答案' },
  ],
  of: [
    { pattern: '名词 + 介词', en: 'the end of', zh: '……的末尾' },
    { pattern: '数量短语', en: 'a lot of', zh: '很多' },
    { pattern: '介词短语', en: 'because of', zh: '因为' },
    { pattern: '程度短语', en: 'kind of', zh: '有点儿；有几分' },
  ],
  for: [
    { pattern: '名词 + 介词', en: 'reason for', zh: '……的原因' },
    { pattern: '动词 + 介词', en: 'look for', zh: '寻找' },
    { pattern: '动词 + 介词', en: 'wait for', zh: '等待' },
    { pattern: '动词 + 介词', en: 'prepare for', zh: '为……做准备' },
  ],
  after: [
    { pattern: '动词 + 介词', en: 'look after', zh: '照顾' },
    { pattern: '动词 + 介词', en: 'run after', zh: '追赶' },
    { pattern: '动词 + 介词', en: 'ask after', zh: '问候' },
    { pattern: '动词 + 介词', en: 'take after', zh: '像；与……相像' },
  ],
  to: [
    { pattern: '动词 + 介词', en: 'listen to', zh: '听' },
    { pattern: '动词 + 介词', en: 'talk to', zh: '与……交谈' },
    { pattern: '动词 + 介词', en: 'go to', zh: '去' },
    { pattern: '动词 + 介词', en: 'lead to', zh: '导致' },
  ],
  to: [
    { pattern: '\u52a8\u8bcd + \u4ecb\u8bcd', en: 'go to', zh: '\u53bb' },
    { pattern: '\u52a8\u8bcd + \u4e0d\u5b9a\u5f0f', en: 'want to do', zh: '\u60f3\u8981\u505a' },
    { pattern: '\u52a8\u8bcd + \u4e0d\u5b9a\u5f0f', en: 'need to do', zh: '\u9700\u8981\u505a' },
    { pattern: '\u5f62\u5bb9\u8bcd + \u4e0d\u5b9a\u5f0f', en: 'be able to', zh: '\u80fd\u591f' },
  ],
  with: [
    { pattern: '动词 + 介词', en: 'deal with', zh: '处理' },
    { pattern: '动词 + 介词', en: 'agree with', zh: '同意；赞同' },
    { pattern: '动词 + 介词', en: 'compare with', zh: '与……比较' },
    { pattern: '动词 + 介词', en: 'work with', zh: '与……合作' },
  ],
  have: [
    { pattern: '\u52a8\u8bcd + \u540d\u8bcd', en: 'have a plan', zh: '\u6709\u8ba1\u5212' },
    { pattern: '\u52a8\u8bcd + \u540d\u8bcd', en: 'have time', zh: '\u6709\u65f6\u95f4' },
    { pattern: '\u52a8\u8bcd + \u540d\u8bcd', en: 'have a look', zh: '\u770b\u4e00\u770b' },
    { pattern: '\u52a8\u8bcd + \u540d\u8bcd', en: 'have trouble', zh: '\u6709\u56f0\u96be' },
  ],
  be: [
    { pattern: '系动词 + 形容词', en: 'be happy', zh: '开心；快乐' },
    { pattern: '系动词 + 形容词', en: 'be careful', zh: '小心；注意' },
    { pattern: '系动词 + 形容词', en: 'be ready', zh: '准备好' },
    { pattern: '系动词 + 形容词', en: 'be able to', zh: '能够' },
  ],
  make: [
    { pattern: '动词 + 名词', en: 'make a decision', zh: '做决定' },
    { pattern: '动词 + 名词', en: 'make progress', zh: '取得进步' },
    { pattern: '动词 + 名词', en: 'make sense', zh: '有道理' },
    { pattern: '动词 + 名词', en: 'make sure', zh: '确保' },
  ],
  take: [
    { pattern: '动词 + 名词', en: 'take a break', zh: '休息一下' },
    { pattern: '动词 + 名词', en: 'take care', zh: '照顾；注意' },
    { pattern: '动词 + 名词', en: 'take part', zh: '参加' },
    { pattern: '动词 + 名词', en: 'take time', zh: '花时间' },
  ],
  get: [
    { pattern: '动词 + 名词', en: 'get ready', zh: '准备好' },
    { pattern: '动词 + 名词', en: 'get information', zh: '获取信息' },
    { pattern: '动词 + 名词', en: 'get support', zh: '得到支持' },
    { pattern: '动词 + 名词', en: 'get better', zh: '变得更好' },
  ],
  give: [
    { pattern: '动词 + 名词', en: 'give advice', zh: '给建议' },
    { pattern: '动词 + 名词', en: 'give a hand', zh: '帮忙' },
    { pattern: '动词 + 名词', en: 'give a speech', zh: '发表演讲' },
    { pattern: '动词 + 名词', en: 'give support', zh: '提供支持' },
  ],
  look: [
    { pattern: '动词 + 介词', en: 'look after', zh: '照顾' },
    { pattern: '动词 + 介词', en: 'look for', zh: '寻找' },
    { pattern: '动词 + 介词', en: 'look at', zh: '看' },
    { pattern: '动词 + 介词', en: 'look into', zh: '调查' },
  ],
  government: [
    { pattern: '形容词 + 名词', en: 'local government', zh: '地方政府' },
    { pattern: '形容词 + 名词', en: 'government policy', zh: '政府政策' },
    { pattern: '形容词 + 名词', en: 'federal government', zh: '联邦政府' },
    { pattern: '形容词 + 名词', en: 'government official', zh: '政府官员' },
  ],
  people: [
    { pattern: '形容词 + 名词', en: 'young people', zh: '年轻人' },
    { pattern: '形容词 + 名词', en: 'many people', zh: '很多人' },
    { pattern: '名词 + 介词', en: 'people around the world', zh: '世界各地的人们' },
    { pattern: '动词 + 名词', en: 'help people', zh: '帮助人们' },
  ],
  time: [
    { pattern: '动词 + 名词', en: 'spend time', zh: '花时间' },
    { pattern: '形容词 + 名词', en: 'free time', zh: '空闲时间' },
    { pattern: '形容词 + 名词', en: 'long time', zh: '很长时间' },
    { pattern: '名词 + 介词', en: 'at the same time', zh: '同时' },
  ],
  work: [
    { pattern: '形容词 + 名词', en: 'hard work', zh: '辛勤工作' },
    { pattern: '动词 + 介词', en: 'work together', zh: '一起工作' },
    { pattern: '名词 + 名词', en: 'work experience', zh: '工作经验' },
    { pattern: '动词 + 名词', en: 'find work', zh: '找工作' },
  ],
  and: [
    { pattern: '常见搭配', en: 'and then', zh: '然后' },
    { pattern: '常见搭配', en: 'and also', zh: '而且' },
    { pattern: '常见搭配', en: 'both and', zh: '两者都' },
    { pattern: '常见搭配', en: 'and so on', zh: '等等' },
  ],
  but: [
    { pattern: '常见搭配', en: 'but also', zh: '不仅' },
    { pattern: '常见搭配', en: 'but then', zh: '但是后来' },
    { pattern: '常见搭配', en: 'but not', zh: '但不是' },
    { pattern: '常见搭配', en: 'but rather', zh: '而是' },
  ],
  or: [
    { pattern: '常见搭配', en: 'or else', zh: '否则' },
    { pattern: '常见搭配', en: 'either or', zh: '要么...要么' },
    { pattern: '常见搭配', en: 'one or the other', zh: '二者之一' },
    { pattern: '常见搭配', en: 'A or B', zh: 'A或B' },
  ],
  if: [
    { pattern: '常见搭配', en: 'if so', zh: '如果如此' },
    { pattern: '常见搭配', en: 'if not', zh: '如果不是' },
    { pattern: '常见搭配', en: 'if only', zh: '只要' },
    { pattern: '常见搭配', en: 'if necessary', zh: '如有必要' },
  ],
  when: [
    { pattern: '常见搭配', en: 'when needed', zh: '必要时' },
    { pattern: '常见搭配', en: 'when possible', zh: '尽可能' },
    { pattern: '常见搭配', en: 'when to go', zh: '什么时候去' },
    { pattern: '常见搭配', en: 'when and where', zh: '何时何地' },
  ],
  while: [
    { pattern: '常见搭配', en: 'while doing', zh: '在...时' },
    { pattern: '常见搭配', en: 'while waiting', zh: '在等待时' },
    { pattern: '常见搭配', en: 'while still', zh: '仍然' },
    { pattern: '常见搭配', en: 'while at work', zh: '在工作时' },
  ],
  because: [
    { pattern: '常见搭配', en: 'because of', zh: '因为' },
    { pattern: '常见搭配', en: 'because of this', zh: '因为这个' },
    { pattern: '常见搭配', en: 'because of that', zh: '因为那个' },
    { pattern: '常见搭配', en: 'because of me', zh: '因为我' },
  ],
  although: [
    { pattern: '常见搭配', en: 'although still', zh: '虽然如此' },
    { pattern: '常见搭配', en: 'although not', zh: '虽然不是' },
    { pattern: '常见搭配', en: 'although possible', zh: '虽然可能' },
    { pattern: '常见搭配', en: 'although it', zh: '虽然它' },
  ],
  nor: [
    { pattern: '常见搭配', en: 'neither nor', zh: '既不...也不' },
    { pattern: '常见搭配', en: 'nor do I', zh: '我也不' },
    { pattern: '常见搭配', en: 'nor can he', zh: '他也不能' },
    { pattern: '常见搭配', en: 'nor yet', zh: '也不' },
  ],
  so: [
    { pattern: '常见搭配', en: 'so that', zh: '以便' },
    { pattern: '常见搭配', en: 'so far', zh: '到目前为止' },
    { pattern: '常见搭配', en: 'so much', zh: '如此多' },
    { pattern: '常见搭配', en: 'so on', zh: '等等' },
  ],
};

function isWordListFile(fileName) {
  return fileName.endsWith('.json') && fileName !== 'metadata.json' && fileName !== 'generated-reading.json' && fileName !== 'generated-reading-meta.json';
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

async function loadWordListFiles() {
  const files = (await fs.readdir(PUBLIC_DATA_DIR)).filter(isWordListFile).sort();
  const result = [];
  for (const fileName of files) {
    const filePath = path.join(PUBLIC_DATA_DIR, fileName);
    const data = await readJson(filePath);
    if (Array.isArray(data)) result.push({ fileName, filePath, words: data });
  }
  return result;
}

const KNOWN_POS = /^(?:n|v|vt|vi|adj|adv|prep|conj|pron|art|num|int|abbr|aux|det|interj)\./i;

function cleanMeaning(value) {
  return String(value ?? '')
    .replace(new RegExp(`^\\s*(?:\\[[^\\]]+\\]\\s*)*(?:${KNOWN_POS.source}\\s*)+`, 'i'), '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getMeaningText(wordRecord) {
  const defs = Array.isArray(wordRecord?.definitions) ? wordRecord.definitions : [];
  const first = defs[0] || {};
  return cleanMeaning(first.zh || wordRecord?.word || '') || String(wordRecord?.word || '').trim();
}

function getPosFlags(wordRecord) {
  const pos = Array.isArray(wordRecord?.partOfSpeech) ? wordRecord.partOfSpeech.map((item) => String(item).toLowerCase()) : [];
  return {
    isVerb: pos.some((item) => item.startsWith('v.') || item.startsWith('vi.') || item.startsWith('vt.')),
    isAdj: pos.some((item) => ['adj.', 'a.', 's.', 'j.'].includes(item)),
    isNoun: pos.some((item) => item.startsWith('n.')),
    isAdv: pos.some((item) => ['adv.', 'r.'].includes(item)),
    isPrep: pos.some((item) => item === 'prep.'),
    isConj: pos.some((item) => item === 'conj.' || item === 'c.'),
  };
}

function inferPattern(wordRecord, collocation) {
  const phrasePattern = PHRASE_PATTERNS.get(
    (String(collocation?.en || '').toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []).join(' '),
  );
  if (phrasePattern) return phrasePattern;

  if (collocation?.pattern) return collocation.pattern;

  const word = normalizeWordKey(wordRecord.word);
  const tokens = String(collocation?.en || '')
    .toLowerCase()
    .match(/[a-z]+(?:'[a-z]+)?/g) || [];
  const index = tokens.indexOf(word);
  const next = index >= 0 ? tokens[index + 1] : undefined;
  const prev = index > 0 ? tokens[index - 1] : undefined;
  const { isVerb, isAdj, isNoun, isConj } = getPosFlags(wordRecord);
  const isArticle = ARTICLES.has(word);
  const isDeterminer = DETERMINERS.has(word) || isArticle;

  if (isArticle) {
    return '冠词 + 名词';
  }

  if (isDeterminer) {
    return '限定词 + 名词';
  }

  if (isConj) {
    return '甯歌鎼厤';
  }

  if (isVerb) {
    if (next && PREPOSITIONS.has(next)) return '动词 + 介词';
    return '动词 + 名词';
  }

  if (isAdj) {
    if (next && PREPOSITIONS.has(next)) return '形容词 + 介词';
    return '形容词 + 名词';
  }

  if (isNoun) {
    if (next && PREPOSITIONS.has(next)) return '名词 + 介词';
    if (prev && PREPOSITIONS.has(prev)) return '名词 + 介词';
    return '名词 + 名词';
  }

  return '常见搭配';
}

function normalizeRow(wordRecord, row) {
  const en = cleanMeaning(row?.en);
  const zh = cleanMeaning(row?.zh);
  if (!en || !zh) return null;
  return {
    en,
    zh,
    pattern: inferPattern(wordRecord, { en, zh, pattern: row?.pattern }),
  };
}

function uniqueRows(rows) {
  const seen = new Set();
  const result = [];
  for (const row of rows) {
    const key = `${row.en.toLowerCase()}|${row.zh.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }
  return result;
}

function fallbackRows(wordRecord) {
  const word = normalizeWordKey(wordRecord.word);
  const meaning = getMeaningText(wordRecord);
  const { isVerb, isAdj, isNoun, isAdv, isPrep, isConj } = getPosFlags(wordRecord);

  if (SPECIAL_COLLOCATIONS[word]) {
    return SPECIAL_COLLOCATIONS[word];
  }

  return [];

  if (isConj) {
    return [];
  }

  if (isPrep) {
    return [
      { pattern: '名词 + 介词', en: `reason ${word}`, zh: '……的原因' },
      { pattern: '动词 + 介词', en: `look ${word}`, zh: '相关用法' },
      { pattern: '动词 + 介词', en: `depend ${word}`, zh: '依赖……' },
      { pattern: '动词 + 介词', en: `prepare ${word}`, zh: '为……做准备' },
    ];
  }

  if (isVerb) {
    return [
      { pattern: '动词 + 名词', en: `${word} a decision`, zh: '做决定' },
      { pattern: '动词 + 名词', en: `${word} a plan`, zh: '制定计划' },
      { pattern: '动词 + 名词', en: `${word} progress`, zh: '取得进展' },
      { pattern: '动词 + 名词', en: `${word} time`, zh: '花时间' },
    ];
  }

  if (isAdj) {
    return [
      { pattern: '形容词 + 名词', en: `fast ${word}`, zh: `快速的${meaning}` },
      { pattern: '形容词 + 名词', en: `new ${word}`, zh: `新的${meaning}` },
      { pattern: '形容词 + 名词', en: `good ${word}`, zh: `好的${meaning}` },
      { pattern: '形容词 + 名词', en: `important ${word}`, zh: `重要的${meaning}` },
    ];
  }

  if (isNoun) {
    return [
      { pattern: '形容词 + 名词', en: `important ${word}`, zh: `重要的${meaning}` },
      { pattern: '形容词 + 名词', en: `new ${word}`, zh: `新的${meaning}` },
      { pattern: '名词 + 介词', en: `${word} of`, zh: `……的${meaning}` },
      { pattern: '名词 + 名词', en: `${word} system`, zh: `${meaning}系统` },
    ];
  }

  if (isAdv) {
    return [
      { pattern: '副词 + 动词', en: `speak ${word}`, zh: `说得${meaning}` },
      { pattern: '副词 + 动词', en: `move ${word}`, zh: `移动得${meaning}` },
      { pattern: '副词 + 动词', en: `act ${word}`, zh: `行动得${meaning}` },
      { pattern: '副词 + 动词', en: `work ${word}`, zh: `工作得${meaning}` },
    ];
  }

  return [
    { pattern: '常见搭配', en: `${word} in use`, zh: '正在使用' },
    { pattern: '常见搭配', en: `${word} at work`, zh: '在工作中' },
    { pattern: '常见搭配', en: `${word} with care`, zh: '认真地；谨慎地' },
    { pattern: '常见搭配', en: `${word} in daily life`, zh: '在日常生活中' },
  ];
}

function buildStructuredCollocations(wordRecord) {
  const fallback = fallbackRows(wordRecord)
    .map((row) => normalizeRow(wordRecord, row))
    .filter(Boolean);

  const rows = uniqueRows(fallback).slice(0, COLLOCATION_COUNT);

  return rows
    .map((row) => ({
      en: row.en,
      zh: row.zh,
      pattern: inferPattern(wordRecord, row),
    }))
    .sort((a, b) => {
      const aIndex = PATTERN_ORDER.indexOf(a.pattern || '常见搭配');
      const bIndex = PATTERN_ORDER.indexOf(b.pattern || '常见搭配');
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.en.localeCompare(b.en);
    });
}

export async function generateCollocationsForEntries(entries) {
  const results = new Map();
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry?.word) continue;
    results.set(normalizeWordKey(entry.word), buildStructuredCollocations(entry));
  }
  return results;
}

async function rewriteWordListFile(file) {
  const nextWords = file.words.map((wordRecord) => ({
    ...wordRecord,
    collocations: buildStructuredCollocations(wordRecord),
  }));
  await writeJson(file.filePath, nextWords);
  return nextWords.length;
}

async function rewriteMetadata() {
  let metadata = await readJson(METADATA_PATH).catch(() => null);
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const numericKeys = Object.keys(metadata).filter((key) => /^\d+$/.test(key));
    if (numericKeys.length > 0) {
      const reconstructed = numericKeys
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => metadata[key])
        .join('');
      try {
        metadata = JSON.parse(reconstructed);
      } catch {
        metadata = null;
      }
    }
  }

  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch {
      metadata = null;
    }
  }
  if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') {
    metadata = { version: '0', generated: '', lists: {} };
  }

  const nextMetadata = {
    ...metadata,
    version: String(Number(metadata.version || 0) + 1),
    generated: new Date().toISOString(),
    lists: metadata.lists || {},
  };
  await fs.writeFile(METADATA_PATH, JSON.stringify(nextMetadata, null, 2), 'utf8');
}

async function main() {
  const filterLists = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  const includeAll = filterLists.length === 0;

  const files = await loadWordListFiles();
  const filteredFiles = includeAll
    ? files
    : files.filter((f) => filterLists.some((id) => f.fileName.startsWith(id + '.json') || f.fileName === id + '.json'));

  if (!includeAll) console.log(`Filtering to: ${filterLists.join(', ')}`);

  let totalWords = 0;
  let updatedWords = 0;

  for (const file of filteredFiles) {
    totalWords += file.words.length;
    const fileUpdated = await rewriteWordListFile(file);
    updatedWords += fileUpdated;
    console.log(`${file.fileName}: ${fileUpdated}/${file.words.length} updated`);
  }

  await rewriteMetadata();
  console.log(`Done! ${updatedWords}/${totalWords} words updated.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
