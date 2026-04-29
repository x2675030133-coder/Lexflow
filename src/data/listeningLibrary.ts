import { listeningExercises } from './listeningData';
import { listeningExtras } from './listeningExtras';

const BASE_LISTENING_EXERCISES = [...listeningExercises, ...listeningExtras];
const GENERAL_TARGET_COUNT = 900;
const IELTS_TARGET_COUNT = 1100;
const EXTENDED_SENTENCE_TARGET = 12;

type BaseExercise = (typeof BASE_LISTENING_EXERCISES)[number];
type ListeningSentence = BaseExercise['sentences'][number];

type VariantContext = {
  en: string;
  zh: string;
  focus: string;
  focusZh: string;
  setting: string;
  settingZh: string;
  task: string;
  taskZh: string;
};

type SentenceFlavor = 'base' | 'bridge' | 'check' | 'recap';

const GENERAL_CONTEXTS: VariantContext[] = [
  {
    en: 'Everyday conversation',
    zh: '日常口语',
    focus: 'daily listening',
    focusZh: '日常听力',
    setting: 'coffee shop',
    settingZh: '咖啡店',
    task: 'catch the main point',
    taskZh: '抓住主旨',
  },
  {
    en: 'Campus discussion',
    zh: '校园讨论',
    focus: 'student life',
    focusZh: '校园生活',
    setting: 'campus hall',
    settingZh: '校园大厅',
    task: 'follow the details',
    taskZh: '跟住细节',
  },
  {
    en: 'Customer service',
    zh: '服务对话',
    focus: 'service English',
    focusZh: '服务表达',
    setting: 'front desk',
    settingZh: '前台',
    task: 'confirm the request',
    taskZh: '确认需求',
  },
  {
    en: 'Short news brief',
    zh: '新闻简报',
    focus: 'news listening',
    focusZh: '新闻听力',
    setting: 'newsroom',
    settingZh: '新闻编辑部',
    task: 'pick out facts',
    taskZh: '提取事实',
  },
  {
    en: 'Mini talk',
    zh: '短讲',
    focus: 'speech rhythm',
    focusZh: '演讲节奏',
    setting: 'conference room',
    settingZh: '会议室',
    task: 'notice the structure',
    taskZh: '听出结构',
  },
  {
    en: 'Listening drill',
    zh: '专项练习',
    focus: 'training mode',
    focusZh: '训练模式',
    setting: 'training desk',
    settingZh: '训练台',
    task: 'spot key words',
    taskZh: '找关键词',
  },
];

const IELTS_CONTEXTS: VariantContext[] = [
  {
    en: 'IELTS Part 1',
    zh: '雅思Part 1',
    focus: 'basic question answering',
    focusZh: '基础问答',
    setting: 'registration desk',
    settingZh: '登记台',
    task: 'answer quickly',
    taskZh: '快速作答',
  },
  {
    en: 'IELTS Part 2',
    zh: '雅思Part 2',
    focus: 'topic monologue',
    focusZh: '话题独白',
    setting: 'presentation room',
    settingZh: '展示室',
    task: 'capture the outline',
    taskZh: '抓住框架',
  },
  {
    en: 'IELTS Part 3',
    zh: '雅思Part 3',
    focus: 'discussion and opinion',
    focusZh: '讨论与观点',
    setting: 'seminar room',
    settingZh: '研讨室',
    task: 'follow opinions and reasons',
    taskZh: '听清观点和原因',
  },
  {
    en: 'IELTS daily topic',
    zh: '雅思生活题',
    focus: 'everyday IELTS language',
    focusZh: '生活场景表达',
    setting: 'shared apartment',
    settingZh: '合租公寓',
    task: 'listen for paraphrases',
    taskZh: '识别改述',
  },
  {
    en: 'IELTS study topic',
    zh: '雅思学习题',
    focus: 'academic planning',
    focusZh: '学业规划',
    setting: 'library',
    settingZh: '图书馆',
    task: 'notice the change in tone',
    taskZh: '留意语气变化',
  },
  {
    en: 'IELTS social topic',
    zh: '雅思社会题',
    focus: 'social issues',
    focusZh: '社会议题',
    setting: 'community center',
    settingZh: '社区中心',
    task: 'track the speaker stance',
    taskZh: '跟住立场',
  },
];

const EN_SUFFIXES = [
  'for a quick review.',
  'while keeping the pace natural.',
  'so the listener can catch the key idea.',
  'with a small change in emphasis.',
  'to make the answer feel more realistic.',
  'so it sounds closer to a real exam item.',
  'with one extra detail to listen for.',
  'to add a clearer listening target.',
  'with a slightly different cue to catch.',
  'so the same idea feels less repetitive.',
  'to make the transition more noticeable.',
  'with one more listening angle.',
];

const ZH_SUFFIXES = [
  '适合快速复习。',
  '语速保持自然。',
  '这样更容易抓住主旨。',
  '并带一点点强调变化。',
  '让答案更贴近真实练习。',
  '听起来更像一条真实题目。',
  '再多一个细节可以听。',
  '目标会更清晰。',
  '再换一个听法就更不一样了。',
  '同一个意思也不会太单调。',
  '这样转折会更明显。',
  '再补一个观察角度。',
];

const TITLE_VARIANTS = [
  { en: 'Review', zh: '复习' },
  { en: 'Set A', zh: 'A组' },
  { en: 'Set B', zh: 'B组' },
  { en: 'Warm-up', zh: '热身' },
  { en: 'Focus', zh: '聚焦' },
  { en: 'Sprint', zh: '冲刺' },
  { en: 'Track', zh: '追踪' },
  { en: 'Round', zh: '轮次' },
  { en: 'Check', zh: '检查' },
  { en: 'Drill', zh: '训练' },
  { en: 'Replay', zh: '重听' },
  { en: 'Wave', zh: '波次' },
];

const RHYTHM_VARIANTS = [
  { en: 'steady pace', zh: '平稳语速' },
  { en: 'light pause', zh: '轻微停顿' },
  { en: 'clean emphasis', zh: '清晰重音' },
  { en: 'exam rhythm', zh: '考试节奏' },
  { en: 'natural delivery', zh: '自然表达' },
  { en: 'slightly faster', zh: '稍快语速' },
  { en: 'clear phrasing', zh: '清楚断句' },
  { en: 'gentle contrast', zh: '轻微对比' },
];

const EN_OPENERS = [
  'In this clip,',
  'Here, the speaker',
  'This listening set',
  'The item asks you to',
  'A useful clue is that',
  'The speaker mainly',
];

const ZH_OPENERS = [
  '这段里，',
  '这里，',
  '这个练习会',
  '这道题会让你',
  '一个很实用的提示是：',
  '说话人主要在',
];

function pick<T>(items: T[], index: number) {
  return items[index % items.length];
}

function cleanKeywords(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())) )];
}

function buildSentenceVariant(
  sentence: ListeningSentence,
  index: number,
  context: VariantContext,
  variantIndex: number,
  flavor: SentenceFlavor,
): ListeningSentence {
  const primaryKeyword = sentence.keywords[0] || context.focus;
  const secondaryKeyword = sentence.keywords[1] || primaryKeyword;
  const tertiaryKeyword = sentence.keywords[2] || context.settingZh;
  const suffixIndex = (variantIndex + index) % EN_SUFFIXES.length;
  const openerIndex = (variantIndex * 5 + index) % EN_OPENERS.length;
  const suffixEn = EN_SUFFIXES[suffixIndex];
  const suffixZh = ZH_SUFFIXES[suffixIndex];

  if (flavor === 'bridge') {
    return {
      id: index + 1,
      en: `${pick(EN_OPENERS, openerIndex)} move from ${primaryKeyword} to ${secondaryKeyword}, so the listener can ${context.task} ${suffixEn}`,
      zh: `${pick(ZH_OPENERS, openerIndex)}先听${primaryKeyword}，再跟住${secondaryKeyword}，这样更容易${context.taskZh} ${suffixZh}`,
      keywords: cleanKeywords([primaryKeyword, secondaryKeyword, context.focus, context.setting, context.task]),
    };
  }

  if (flavor === 'check') {
    return {
      id: index + 1,
      en: `${pick(EN_OPENERS, openerIndex)} highlight ${primaryKeyword} first, then add ${tertiaryKeyword} as the extra clue ${suffixEn}`,
      zh: `${pick(ZH_OPENERS, openerIndex)}先抓${primaryKeyword}，再把${tertiaryKeyword}当作额外线索来听 ${suffixZh}`,
      keywords: cleanKeywords([primaryKeyword, tertiaryKeyword, context.focus, context.setting, context.task]),
    };
  }

  if (flavor === 'recap') {
    return {
      id: index + 1,
      en: `A quick recap is that ${primaryKeyword} stays central while ${secondaryKeyword} keeps the flow moving in this ${context.setting} practice ${suffixEn}`,
      zh: `快速回看时可以记住：${primaryKeyword}是核心，${secondaryKeyword}让这段${context.settingZh}练习更顺着听 ${suffixZh}`,
      keywords: cleanKeywords([primaryKeyword, secondaryKeyword, context.focus, context.setting, context.task]),
    };
  }

  return {
    id: index + 1,
    en: `${sentence.en} ${suffixEn}`,
    zh: `${sentence.zh} ${suffixZh}`,
    keywords: cleanKeywords([...(sentence.keywords || []), context.focus, context.setting, context.task]),
  };
}

function expandSentenceList(exercise: BaseExercise, context: VariantContext, variantIndex: number) {
  const sourceSentences = exercise.sentences.map((sentence) => ({ ...sentence }));
  const expanded: ListeningSentence[] = [];
  const flavors: SentenceFlavor[] = ['base', 'bridge', 'check', 'recap'];

  if (sourceSentences.length === 0) {
    return [
      {
        id: 1,
        en: `Listen for ${context.focus} in this ${context.setting} practice ${EN_SUFFIXES[variantIndex % EN_SUFFIXES.length]}`,
        zh: `在这段${context.settingZh}练习里重点听${context.focusZh} ${ZH_SUFFIXES[variantIndex % ZH_SUFFIXES.length]}`,
        keywords: cleanKeywords([context.focus, context.setting, context.task]),
      },
    ];
  }

  let cursor = 0;
  while (expanded.length < EXTENDED_SENTENCE_TARGET) {
    const sentence = sourceSentences[cursor % sourceSentences.length];
    const flavor = flavors[Math.floor(cursor / sourceSentences.length) % flavors.length];
    expanded.push({
      ...buildSentenceVariant(sentence, expanded.length, context, variantIndex, flavor),
      id: expanded.length + 1,
    });
    cursor += 1;
  }

  return expanded;
}

function distributeCounts(targetCount: number, itemsLength: number) {
  const base = Math.floor(targetCount / itemsLength);
  const remainder = targetCount % itemsLength;

  return Array.from({ length: itemsLength }, (_, index) => base + (index < remainder ? 1 : 0));
}

function buildVariant(exercise: BaseExercise, variantIndex: number, context: VariantContext, bucket: 'general' | 'ielts'): BaseExercise {
  const titleVariant = TITLE_VARIANTS[variantIndex % TITLE_VARIANTS.length];
  const rhythmVariant = RHYTHM_VARIANTS[(variantIndex + (bucket === 'ielts' ? 3 : 0)) % RHYTHM_VARIANTS.length];
  const variantSection = [exercise.section, context.zh, titleVariant.zh, rhythmVariant.zh].filter(Boolean).join(' · ');
  const speedOffset = ((variantIndex % 9) - 4) * 0.02;
  const variantSeed: BaseExercise = {
    ...exercise,
    section: variantSection,
    speed: Math.min(1.25, Math.max(0.76, exercise.speed + speedOffset)),
  };

  return {
    ...variantSeed,
    id: `${exercise.id}-${bucket}-${variantIndex + 1}`,
    title: `${exercise.title} · ${context.en} · ${titleVariant.en} · ${rhythmVariant.en}`,
    titleZh: `${exercise.titleZh} · ${context.zh} · ${titleVariant.zh} · ${rhythmVariant.zh}`,
    sentences: expandSentenceList(variantSeed, context, variantIndex).map((sentence, sentenceIndex) => ({
      ...sentence,
      id: sentenceIndex + 1,
    })),
  };
}

function buildVariantPool(items: BaseExercise[], targetCount: number, contexts: VariantContext[], bucket: 'general' | 'ielts') {
  if (items.length === 0) return [] as BaseExercise[];
  const counts = distributeCounts(targetCount, items.length);

  return items.flatMap((exercise, exerciseIndex) => {
    const count = counts[exerciseIndex];
    return Array.from({ length: count }, (_, variantIndex) => {
      const context = contexts[(exerciseIndex * 11 + variantIndex * 5) % contexts.length];
      return buildVariant(exercise, variantIndex, context, bucket);
    });
  });
}

function expandListeningExercises() {
  const ieltsExercises = BASE_LISTENING_EXERCISES.filter((exercise) => exercise.category === 'ielts');
  const generalExercises = BASE_LISTENING_EXERCISES.filter((exercise) => exercise.category !== 'ielts');

  const expandedGeneral = buildVariantPool(generalExercises, GENERAL_TARGET_COUNT, GENERAL_CONTEXTS, 'general');
  const expandedIelts = buildVariantPool(ieltsExercises, IELTS_TARGET_COUNT, IELTS_CONTEXTS, 'ielts');

  return [...expandedGeneral, ...expandedIelts];
}

export const allListeningExercises = expandListeningExercises();
