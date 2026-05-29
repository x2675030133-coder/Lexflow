import type { Word, WordUsageMeaning } from './types';

type WordUsageNote = {
  commonMeanings: WordUsageMeaning[];
};

const WORD_USAGE_NOTES: Record<string, WordUsageNote> = {
  what: {
    commonMeanings: [
      {
        title: '询问信息',
        summary: '用于询问人或事物，常译为“什么；哪一个；多少”',
        exampleEn: 'What is your name?',
        exampleZh: '你叫什么名字？',
      },
      {
        title: '指代事物',
        summary: '用于指代前后文中的内容，意思接近“所...的；那个...的东西”',
        exampleEn: 'I know what he means.',
        exampleZh: '我知道他是什么意思。',
      },
      {
        title: '感叹',
        summary: '用于感叹，常见于 what a / what an，表示“多么；真是”',
        exampleEn: 'What a beautiful day!',
        exampleZh: '多么美好的一天啊！',
      },
      {
        title: '请重复',
        summary: '用于没听清时请对方重复',
        exampleEn: 'Sorry, what?',
        exampleZh: '抱歉，你说什么？',
      },
    ],
  },
  who: {
    commonMeanings: [
      {
        title: '询问人',
        summary: '用于问人，意思是“谁；哪位”',
        exampleEn: 'Who is calling?',
        exampleZh: '谁在打电话？',
      },
      {
        title: '指代人',
        summary: '用于指代人，意思接近“...的人”',
        exampleEn: 'She is the one who helped me.',
        exampleZh: '她就是帮助过我的那个人。',
      },
    ],
  },
  which: {
    commonMeanings: [
      {
        title: '询问选择',
        summary: '用于在已知范围中提问，意思是“哪一个；哪一些”',
        exampleEn: 'Which do you prefer?',
        exampleZh: '你更喜欢哪一个？',
      },
      {
        title: '指代前文',
        summary: '用于指代前面提到的事物',
        exampleEn: 'I bought a book, which was very helpful.',
        exampleZh: '我买了一本书，它很有帮助。',
      },
    ],
  },
  when: {
    commonMeanings: [
      {
        title: '询问时间',
        summary: '用于询问时间，意思是“什么时候”',
        exampleEn: 'When will you arrive?',
        exampleZh: '你什么时候到？',
      },
      {
        title: '在...的时候',
        summary: '用于引导时间状语从句，意思是“当...的时候”',
        exampleEn: 'Call me when you get home.',
        exampleZh: '你到家时给我打电话。',
      },
    ],
  },
  where: {
    commonMeanings: [
      {
        title: '询问地点',
        summary: '用于询问地点，意思是“哪里；在哪儿”',
        exampleEn: 'Where do you live?',
        exampleZh: '你住在哪里？',
      },
      {
        title: '在...的地方',
        summary: '用于引导地点状语从句',
        exampleEn: 'This is where I grew up.',
        exampleZh: '这就是我长大的地方。',
      },
    ],
  },
  why: {
    commonMeanings: [
      {
        title: '询问原因',
        summary: '用于询问原因，意思是“为什么；为何”',
        exampleEn: 'Why are you late?',
        exampleZh: '你为什么迟到？',
      },
      {
        title: '原因',
        summary: '用于说明原因或理由',
        exampleEn: 'I know why she left.',
        exampleZh: '我知道她为什么离开。',
      },
    ],
  },
  how: {
    commonMeanings: [
      {
        title: '询问方式',
        summary: '用于询问方式、状态或程度，意思是“怎么；如何；多么”',
        exampleEn: 'How do you spell it?',
        exampleZh: '这个怎么拼？',
      },
      {
        title: '感叹',
        summary: '用于感叹，常见于 how + 形容词/副词',
        exampleEn: 'How beautiful it is!',
        exampleZh: '它多么美啊！',
      },
    ],
  },
  can: {
    commonMeanings: [
      {
        title: '装罐',
        summary: '动词义，表示把食物等放入罐中保存',
        exampleEn: 'They can fruit for the winter.',
        exampleZh: '他们把水果装罐以备过冬。',
      },
      {
        title: '罐头；容器',
        summary: '名词义，指金属罐或罐装容器',
        exampleEn: 'He opened a can of soup.',
        exampleZh: '他打开了一罐汤。',
      },
      {
        title: '能；可以',
        summary: '情态动词，表示能力、许可或可能',
        exampleEn: 'I can open this can easily.',
        exampleZh: '我能轻松打开这个罐头。',
      },
    ],
  },
  would: {
    commonMeanings: [
      {
        title: '过去将来',
        summary: '（will 过去式）将要；将会',
        exampleEn: 'He said he would come.',
        exampleZh: '他说他会来。',
      },
      {
        title: '愿意；想要',
        summary: '常见于 would like，表示更委婉的“想要”',
        exampleEn: 'I would like tea.',
        exampleZh: '我想要茶。',
      },
      {
        title: '礼貌请求 / 建议',
        summary: '比 will 更柔和，常用于请求、邀请、建议',
        exampleEn: 'Would you help me?',
        exampleZh: '能帮帮我吗？',
      },
      {
        title: '过去常常',
        summary: '表示过去重复发生的动作或习惯',
        exampleEn: 'She would walk every morning.',
        exampleZh: '她以前每天早上散步。',
      },
      {
        title: '虚拟语气',
        summary: '表示假设结果：就会；本该',
        exampleEn: 'If I knew, I would tell you.',
        exampleZh: '我要是知道就告诉你了。',
      },
      {
        title: '宁愿',
        summary: '常见于 would rather，表示“更愿意”',
        exampleEn: 'I would rather stay home.',
        exampleZh: '我宁愿待在家。',
      },
    ],
  },
};

const WORD_USAGE_NOTES_EXTRA: Record<string, WordUsageNote> = {
  if: {
    commonMeanings: [
      {
        title: '条件 / 假设',
        summary: '引导条件或假设，表示“如果；假如；倘若”。',
        exampleEn: 'If it rains, I will stay home.',
        exampleZh: '如果下雨，我就待在家里。',
      },
      {
        title: '是否',
        summary: '用于间接疑问，表示“是否；能否；是不是”。',
        exampleEn: 'I do not know if he will come.',
        exampleZh: '我不知道他是否会来。',
      },
      {
        title: '即使 / 无论',
        summary: '表示让步或泛指条件，常见于固定结构中。',
        exampleEn: 'Even if it is hard, keep going.',
        exampleZh: '即使很难，也要继续前进。',
      },
    ],
  },
};

const STOP_PREFIXES = [
  'a ',
  'an ',
  'the ',
  'to ',
  'of ',
  'for ',
  'in ',
  'on ',
  'at ',
  'by ',
  'with ',
];

function normalizePos(value: string): string {
  return value.trim().toLowerCase().replace(/\.+$/, '');
}

function hasPos(word: Word, prefixes: string[]): boolean {
  return word.partOfSpeech.some((pos) => {
    const normalized = normalizePos(pos);
    return prefixes.some((prefix) => normalized.startsWith(prefix));
  });
}

function isFunctionWord(word: Word): boolean {
  return hasPos(word, ['pron', 'det', 'prep', 'conj', 'aux', 'interj', 'int', 'art', 'num', 'd']);
}

function cleanText(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[\s,;:，；：]+/, '')
    .replace(/[\s,;:，；：.。]+$/, '')
    .trim();
}

function cleanSummary(value: string): string {
  const text = cleanText(value);
  for (const prefix of STOP_PREFIXES) {
    if (text.toLowerCase().startsWith(prefix)) {
      return cleanText(text.slice(prefix.length));
    }
  }
  return text;
}

function stripBracketTags(value: string): string {
  return String(value || '')
    .replace(/^\s*(?:\[[^\]]+\]\s*)+/g, '')
    .trim();
}

function cleanDefinitionText(value: string): string {
  return cleanSummary(stripBracketTags(String(value || '').replace(/;?\s*--.*$/u, '')));
}

function extractDefinitionPos(value: string): string {
  const match = String(value || '')
    .trim()
    .toLowerCase()
    .match(/^(?:\[[^\]]+\]\s*)*([a-z]+)\./);
  return match?.[1] || '';
}

function extractWordPosFamilies(word: Word): Set<string> {
  const families = new Set<string>();

  for (const pos of word.partOfSpeech) {
    const normalized = normalizePos(pos);
    if (normalized.startsWith('c')) families.add('conj');
    if (normalized.startsWith('d')) families.add('det');
    if (normalized.startsWith('prep')) families.add('prep');
    if (normalized.startsWith('conj')) families.add('conj');
    if (normalized.startsWith('aux')) families.add('aux');
    if (normalized.startsWith('pron')) families.add('pron');
    if (normalized.startsWith('int')) families.add('interj');
    if (normalized.startsWith('interj')) families.add('interj');
    if (normalized.startsWith('art')) families.add('art');
    if (normalized.startsWith('num')) families.add('num');
    if (normalized.startsWith('adj') || normalized.startsWith('a') || normalized.startsWith('s')) families.add('adj');
    if (normalized.startsWith('adv') || normalized.startsWith('r')) families.add('adv');
    if (normalized.startsWith('v')) families.add('v');
    if (normalized.startsWith('n')) families.add('n');
    if (normalized.startsWith('abbr')) families.add('abbr');
  }

  return families;
}

function definitionMatchesWordPos(word: Word, definitionEn: string): boolean {
  const defPos = extractDefinitionPos(definitionEn);
  if (!defPos) return true;

  const families = extractWordPosFamilies(word);
  if (families.size === 0) return true;

  const normalized = defPos.toLowerCase();
  if (normalized === 'c' || normalized === 'conj') return families.has('conj');
  if (normalized === 'd' || normalized === 'det') return families.has('det') || families.has('art');
  if (normalized === 'prep') return families.has('prep');
  if (normalized === 'aux') return families.has('aux');
  if (normalized === 'pron') return families.has('pron');
  if (normalized === 'int' || normalized === 'interj') return families.has('interj');
  if (normalized === 'art') return families.has('art') || families.has('det');
  if (normalized === 'num') return families.has('num');
  if (normalized === 'abbr') return families.has('abbr');
  if (normalized === 'adv' || normalized === 'r') return families.has('adv');
  if (normalized === 'adj' || normalized === 'a' || normalized === 's') return families.has('adj');
  if (normalized === 'v' || normalized === 'vt' || normalized === 'vi') return families.has('v');
  if (normalized === 'n') return families.has('n');
  return true;
}

function isSuspiciousMeaningText(value: string): boolean {
  const text = String(value || '').toLowerCase();
  return (
    text.includes('dos批处理命令') ||
    text.includes('批处理命令') ||
    text.includes('united states territory') ||
    text.includes('metric unit') ||
    text.includes('chemical element') ||
    text.includes('roman alphabet') ||
    text.includes('samoa') ||
    text.includes('oklahoma') ||
    text.includes('ohio') ||
    text.includes('hour angle') ||
    text.includes('abbreviation')
  );
}

function pickOriginalExample(word: Word, index: number) {
  return word.examples[index] || word.examples[0] || null;
}

function buildFallbackExample(_word: Word, _summary: string, _index: number) {
  return {
    exampleEn: '',
    exampleZh: '',
  };
}

function buildDerivedCommonMeanings(word: Word): WordUsageMeaning[] {
  const isHighRiskWord = isFunctionWord(word) || word.word.trim().length <= 3;
  const matchedDefinitions = word.definitions
    .filter((definition) => !isHighRiskWord || definitionMatchesWordPos(word, definition.en));
  const definitionCandidates = matchedDefinitions.length > 0 ? matchedDefinitions : word.definitions;
  const sourceDefinitions = definitionCandidates
    .map((definition) => {
      const en = cleanDefinitionText(definition.en);
      const zh = cleanDefinitionText(definition.zh);
      return {
        en,
        zh: isSuspiciousMeaningText(zh) ? '' : zh,
      };
    })
    .map((definition) => ({
      en: definition.en,
      zh: definition.zh || definition.en,
    }))
    .filter((definition) => definition.zh || definition.en);

  if (sourceDefinitions.length === 0) {
    const original = pickOriginalExample(word, 0);
    return [
      {
        title: '常用意思 1',
        summary: '暂无整理后的释义',
        exampleEn: original?.en || '',
        exampleZh: original?.zh || '',
      },
    ];
  }

  return sourceDefinitions.slice(0, 3).map((definition, index) => {
    const original = pickOriginalExample(word, index);
    const fallback = buildFallbackExample(word, definition.zh || definition.en || '', index);

    return {
      title: `常用意思 ${index + 1}`,
      summary: definition.zh || definition.en || '暂无释义',
      exampleEn: original?.en || fallback.exampleEn || '',
      exampleZh: original?.zh || fallback.exampleZh || '',
    };
  });
}

export function getWordUsageNotes(word: string): WordUsageNote | null {
  const key = word.trim().toLowerCase();
  return WORD_USAGE_NOTES[key] || WORD_USAGE_NOTES_EXTRA[key] || null;
}

export function getCommonMeanings(word: Word): WordUsageMeaning[] {
  const override = getWordUsageNotes(word.word);
  if (override?.commonMeanings?.length) {
    return override.commonMeanings;
  }

  return buildDerivedCommonMeanings(word);
}

export function getPrimaryMeaning(word: Word): string {
  const meanings = getCommonMeanings(word);
  if (meanings.length > 0) {
    return meanings[0].summary;
  }

  return word.definitions.find((definition) => definition.zh || definition.en)?.zh
    || word.definitions.find((definition) => definition.zh || definition.en)?.en
    || '暂无释义';
}
