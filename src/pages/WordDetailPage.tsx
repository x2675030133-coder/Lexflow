import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Volume2,
  Heart,
  ArrowLeft,
  BookOpen,
  GitBranch,
  Quote,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { words as fallbackWords } from '../data/words';
import type { Collocation, Word } from '../data/types';
import { getProgress, saveProgress } from '../utils/storage';
import { findWordByWord, loadWordList } from '../utils/wordListService';
import { findNextNewStudyIndex } from '../utils/studyFlow';
import { speakText } from '../utils/settings';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';
import { useStudyTimeTracker } from '../hooks/useStudyTimeTracker';
import { getCommonMeanings, getPrimaryMeaning } from '../data/wordUsageNotes';

const etymologyColors: Record<string, { bg: string; text: string; label: string }> = {
  prefix: { bg: 'bg-blue-100', text: 'text-blue-700', label: '前缀' },
  root: { bg: 'bg-orange-100', text: 'text-orange-700', label: '词根' },
  suffix: { bg: 'bg-purple-100', text: 'text-purple-700', label: '后缀' },
};

const T = {
  backToList: '返回词表',
  notFound: '未找到该单词',
  definitions: '释义',
  examples: '例句',
  collocations: '词组搭配',
  synonyms: '近义词',
  antonyms: '反义词',
  wordBreakdown: '词根拆解',
  etymology: '词源',
  continue: '继续学习',
  startLearning: '开始学习',
};

const fallbackCollocationRows: Record<string, Collocation[]> = {
  the: [
    { pattern: '冠词 + 名词', en: 'the sun', zh: '太阳' },
    { pattern: '冠词 + 名词', en: 'the book', zh: '这本书' },
    { pattern: '冠词 + 名词', en: 'the idea', zh: '这个想法' },
    { pattern: '冠词 + 形容词', en: 'the first', zh: '第一个；首先' },
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
    { pattern: '冠词 + 形容词', en: 'an old friend', zh: '一位老朋友' },
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
    { pattern: '动词 + 介词', en: 'go to', zh: '去' },
    { pattern: '动词 + 不定式', en: 'want to do', zh: '想要做' },
    { pattern: '动词 + 不定式', en: 'need to do', zh: '需要做' },
    { pattern: '形容词 + 不定式', en: 'be able to', zh: '能够' },
  ],
  with: [
    { pattern: '动词 + 介词', en: 'agree with', zh: '同意；赞同' },
    { pattern: '动词 + 介词', en: 'deal with', zh: '处理' },
    { pattern: '形容词 + 介词', en: 'angry with', zh: '对……生气' },
    { pattern: '形容词 + 介词', en: 'familiar with', zh: '熟悉' },
    { pattern: '形容词 + 介词', en: 'satisfied with', zh: '对……满意' },
    { pattern: '介词 + 名词', en: 'with care', zh: '小心地' },
    { pattern: '介词 + 名词', en: 'with ease', zh: '轻松地' },
    { pattern: '介词 + 名词', en: 'with confidence', zh: '自信地' },
  ],
  in: [
    { pattern: '动词 + 介词', en: 'believe in', zh: '相信' },
    { pattern: '动词 + 介词', en: 'result in', zh: '导致' },
    { pattern: '形容词 + 介词', en: 'interested in', zh: '对……感兴趣' },
    { pattern: '名词 + 介词', en: 'interest in', zh: '对……的兴趣' },
  ],
  on: [
    { pattern: '动词 + 介词', en: 'depend on', zh: '依赖' },
    { pattern: '动词 + 介词', en: 'rely on', zh: '依靠' },
    { pattern: '动词 + 介词', en: 'focus on', zh: '专注于' },
    { pattern: '形容词 + 介词', en: 'keen on', zh: '热衷于' },
  ],
  at: [
    { pattern: '动词 + 介词', en: 'look at', zh: '看' },
    { pattern: '动词 + 介词', en: 'arrive at', zh: '到达' },
    { pattern: '形容词 + 介词', en: 'good at', zh: '擅长' },
    { pattern: '动词 + 介词', en: 'laugh at', zh: '嘲笑' },
  ],
  about: [
    { pattern: '动词 + 介词', en: 'think about', zh: '思考' },
    { pattern: '动词 + 介词', en: 'talk about', zh: '谈论' },
    { pattern: '动词 + 介词', en: 'worry about', zh: '担心' },
    { pattern: '形容词 + 介词', en: 'excited about', zh: '对……感到兴奋' },
  ],
  from: [
    { pattern: '动词 + 介词', en: 'come from', zh: '来自' },
    { pattern: '动词 + 介词', en: 'suffer from', zh: '遭受' },
    { pattern: '动词 + 介词', en: 'benefit from', zh: '受益于' },
    { pattern: '形容词 + 介词', en: 'different from', zh: '不同于' },
  ],
  by: [
    { pattern: '动词 + 介词', en: 'stand by', zh: '支持' },
    { pattern: '动词 + 介词', en: 'pass by', zh: '经过' },
    { pattern: '名词 + 介词', en: 'side by side', zh: '并排' },
  ],
  into: [
    { pattern: '动词 + 介词', en: 'look into', zh: '调查' },
    { pattern: '动词 + 介词', en: 'run into', zh: '偶遇' },
    { pattern: '动词 + 介词', en: 'turn into', zh: '变成' },
    { pattern: '介词 + 名词', en: 'into the night', zh: '到深夜' },
  ],
  off: [
    { pattern: '动词 + 介词', en: 'take off', zh: '起飞；脱下' },
    { pattern: '动词 + 介词', en: 'turn off', zh: '关闭' },
    { pattern: '介词 + 名词', en: 'off duty', zh: '下班' },
    { pattern: '动词 + 介词', en: 'set off', zh: '出发；触发' },
  ],
  over: [
    { pattern: '动词 + 介词', en: 'go over', zh: '复习' },
    { pattern: '动词 + 介词', en: 'take over', zh: '接管' },
    { pattern: '介词 + 名词', en: 'over time', zh: '随着时间的推移' },
    { pattern: '形容词 + 介词', en: 'enthusiastic over', zh: '对……热心' },
  ],
  under: [
    { pattern: '介词 + 名词', en: 'under control', zh: '在控制之下' },
    { pattern: '介词 + 名词', en: 'under pressure', zh: '处于压力下' },
    { pattern: '动词 + 介词', en: 'go under', zh: '破产；下沉' },
  ],
  through: [
    { pattern: '动词 + 介词', en: 'go through', zh: '经历' },
    { pattern: '动词 + 介词', en: 'look through', zh: '浏览' },
    { pattern: '介词 + 名词', en: 'through the years', zh: '这些年来' },
  ],
  without: [
    { pattern: '介词 + 名词', en: 'without doubt', zh: '毫无疑问' },
    { pattern: '动词 + 介词', en: 'do without', zh: '没有……也行' },
    { pattern: '动词 + 介词', en: 'go without', zh: '没有……将就' },
  ],
  across: [
    { pattern: '动词 + 介词', en: 'come across', zh: '偶遇' },
    { pattern: '动词 + 介词', en: 'get across', zh: '使理解' },
    { pattern: '介词 + 名词', en: 'across the world', zh: '世界各地' },
  ],
  against: [
    { pattern: '动词 + 介词', en: 'fight against', zh: '对抗' },
    { pattern: '动词 + 介词', en: 'go against', zh: '违反' },
    { pattern: '介词 + 名词', en: 'against the law', zh: '违法' },
  ],
  along: [
    { pattern: '动词 + 介词', en: 'get along', zh: '相处' },
    { pattern: '动词 + 介词', en: 'come along', zh: '一起来' },
    { pattern: '介词 + 名词', en: 'along the way', zh: '沿途；一路上' },
  ],
  among: [
    { pattern: '介词 + 名词', en: 'among friends', zh: '在朋友中' },
    { pattern: '介词 + 其他', en: 'among others', zh: '除其他外' },
    { pattern: '形容词 + 介词', en: 'popular among', zh: '在……中受欢迎' },
  ],
  around: [
    { pattern: '动词 + 介词', en: 'look around', zh: '环顾' },
    { pattern: '动词 + 介词', en: 'get around', zh: '四处走动' },
    { pattern: '介词 + 名词', en: 'around the world', zh: '世界各地' },
  ],
  before: [
    { pattern: '介词 + 名词', en: 'before long', zh: '不久' },
    { pattern: '介词 + 名词', en: 'before dawn', zh: '黎明前' },
    { pattern: '动词 + 介词', en: 'think before', zh: '三思而行' },
  ],
  behind: [
    { pattern: '动词 + 介词', en: 'fall behind', zh: '落后' },
    { pattern: '动词 + 介词', en: 'leave behind', zh: '留下' },
    { pattern: '介词 + 名词', en: 'behind the scenes', zh: '在幕后' },
  ],
  between: [
    { pattern: '名词 + 介词', en: 'difference between', zh: '……之间的差异' },
    { pattern: '介词 + 名词', en: 'between us', zh: '我们之间' },
    { pattern: '动词 + 介词', en: 'choose between', zh: '在……之间选择' },
  ],
  down: [
    { pattern: '动词 + 介词', en: 'break down', zh: '分解；崩溃' },
    { pattern: '动词 + 介词', en: 'slow down', zh: '减速' },
    { pattern: '介词 + 名词', en: 'down the road', zh: '沿途；将来' },
    { pattern: '动词 + 介词', en: 'calm down', zh: '冷静' },
  ],
  during: [
    { pattern: '介词 + 名词', en: 'during the day', zh: '在白天' },
    { pattern: '介词 + 名词', en: 'during summer', zh: '在夏季' },
  ],
  below: [
    { pattern: '介词 + 名词', en: 'below average', zh: '低于平均' },
    { pattern: '介词 + 名词', en: 'below zero', zh: '零度以下' },
  ],
  above: [
    { pattern: '介词 + 其他', en: 'above all', zh: '首先；最重要的是' },
    { pattern: '介词 + 名词', en: 'above average', zh: '高于平均' },
  ],
  toward: [
    { pattern: '名词 + 介词', en: 'attitude toward', zh: '对……的态度' },
    { pattern: '动词 + 介词', en: 'move toward', zh: '向……移动' },
    { pattern: '动词 + 介词', en: 'work toward', zh: '努力达到' },
  ],
  towards: [
    { pattern: '名词 + 介词', en: 'attitude towards', zh: '对……的态度' },
    { pattern: '动词 + 介词', en: 'move towards', zh: '向……移动' },
    { pattern: '动词 + 介词', en: 'work towards', zh: '努力达到' },
  ],
  beneath: [
    { pattern: '介词 + 名词', en: 'beneath notice', zh: '不值一提' },
  ],
  their: [
    { pattern: '限定词 + 名词', en: 'their plan', zh: '他们的计划' },
    { pattern: '限定词 + 名词', en: 'their idea', zh: '他们的想法' },
    { pattern: '限定词 + 名词', en: 'their work', zh: '他们的工作' },
    { pattern: '限定词 + 名词', en: 'their role', zh: '他们的角色' },
  ],
  have: [
    { pattern: '动词 + 名词', en: 'have a plan', zh: '有计划' },
    { pattern: '动词 + 名词', en: 'have time', zh: '有时间' },
    { pattern: '动词 + 名词', en: 'have a look', zh: '看一看' },
    { pattern: '动词 + 名词', en: 'have trouble', zh: '有困难' },
  ],
};

function buildGenericCollocations(_wordData: Word): Collocation[] {
  void _wordData;
  return [];
}

const COLLOCATION_ORDER = [
  '动词 + 名词',
  '系动词 + 形容词',
  '系动词 + 名词',
  '形容词 + 名词',
  '副词 + 动词',
  '副词 + 形容词',
  '名词 + 形容词',
  '冠词 + 名词',
  '冠词 + 形容词',
  '限定词 + 名词',
  '限定词 + 形容词',
  '名词 + 介词',
  '动词 + 介词',
  '动词 + 不定式',
  '名词 + 名词',
  '形容词 + 介词',
  '形容词 + 不定式',
  '介词 + 名词',
  '介词 + 其他',
  '递进连接',
  '顺承连接',
  '并列结构',
  '列举表达',
  '转折连接',
  '选择结构',
  '条件表达',
  '时间表达',
  '原因表达',
  '让步表达',
  '结果表达',
  '程度表达',
  '数量短语',
  '介词短语',
  '程度短语',
  '常见搭配',
];

const CONJUNCTION_PHRASE_PATTERNS: Record<string, string> = {
  'and also': '递进连接',
  'and so on': '列举表达',
  'and then': '顺承连接',
  'both and': '并列结构',
  'but also': '递进连接',
  'but then': '转折连接',
  'but not': '转折连接',
  'but rather': '转折连接',
  'or else': '选择结构',
  'either or': '选择结构',
  'one or the other': '选择结构',
  'a or b': '选择结构',
  'if so': '条件表达',
  'if not': '条件表达',
  'if only': '条件表达',
  'if necessary': '条件表达',
  'when needed': '时间表达',
  'when possible': '时间表达',
  'when to go': '时间表达',
  'when and where': '时间表达',
  'while doing': '时间表达',
  'while waiting': '时间表达',
  'while still': '让步表达',
  'while at work': '时间表达',
  'because of': '原因表达',
  'because of this': '原因表达',
  'because of that': '原因表达',
  'because of me': '原因表达',
  'although still': '让步表达',
  'although not': '让步表达',
  'although possible': '让步表达',
  'although it': '让步表达',
  'neither nor': '并列结构',
  'nor do i': '并列结构',
  'nor can he': '并列结构',
  'nor yet': '并列结构',
  'so that': '结果表达',
  'so far': '时间表达',
  'so much': '程度表达',
  'so on': '列举表达',
};

function buildWordLookup(words: Word[]) {
  const lookup = new Map<string, Word>();
  words.forEach((item) => {
    lookup.set(item.word.toLowerCase(), item);
  });
  return lookup;
}

function tokenizeCollocation(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
}

function getPhrasePattern(collocation: Collocation) {
  const key = tokenizeCollocation(collocation.en).join(' ');
  return CONJUNCTION_PHRASE_PATTERNS[key];
}

function resolveCollocationPattern(_wordData: Word, collocation: Collocation, _wordLookup: Map<string, Word>) {
  void _wordData;
  void _wordLookup;
  return collocation.pattern || getPhrasePattern(collocation) || '常见搭配';
}

function getCollocationRows(wordData: Word, wordLookup: Map<string, Word>) {
  const wordCollocations = (wordData.collocations && wordData.collocations.length > 0) ? wordData.collocations : [];
  const exactFallback = fallbackCollocationRows[wordData.word.toLowerCase()] || [];
  const useFallbackFirst = exactFallback.length > 0 && (wordData.word.toLowerCase() === 'the' || wordData.word.toLowerCase() === 'their');
  const baseRows = useFallbackFirst ? exactFallback : (wordCollocations.length > 0 ? wordCollocations : (exactFallback.length > 0 ? exactFallback : buildGenericCollocations(wordData)));

  return baseRows
    .map((item) => ({ ...item, pattern: resolveCollocationPattern(wordData, item, wordLookup) }))
    .sort((a, b) => {
      const aIndex = COLLOCATION_ORDER.indexOf(a.pattern || '常见搭配');
      const bIndex = COLLOCATION_ORDER.indexOf(b.pattern || '常见搭配');
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.en.localeCompare(b.en);
    });
}

export default function WordDetailPage() {
  const { word: wordParam } = useParams<{ word: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(getProgress());
  const [activeWords, setActiveWords] = useState<Word[]>(fallbackWords);
  const [wordData, setWordData] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const wordLookup = buildWordLookup([...fallbackWords, ...activeWords]);

  useStopMediaOnUnmount();
  useStudyTimeTracker(true);

  useEffect(() => {
    const refresh = () => setProgress(getProgress());
    window.addEventListener('storage', refresh);
    window.addEventListener('el-progress-changed', refresh as EventListener);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('el-progress-changed', refresh as EventListener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const listId = progress.currentListId || 'cet4';
      const currentList = await loadWordList(listId).catch(() => fallbackWords);
      const directMatch = currentList.find(word => word.word === wordParam);
      const fallbackMatch = directMatch || (await findWordByWord(wordParam || '', listId));

      if (!cancelled) {
        setActiveWords(currentList.length > 0 ? currentList : fallbackWords);
        setWordData(fallbackMatch || null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [progress.currentListId, wordParam]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!wordData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{T.notFound}</h2>
        <Link to="/vocabulary" className="text-blue-600 hover:underline">
          {T.backToList}
        </Link>
      </div>
    );
  }

  const currentIdx = activeWords.findIndex(word => word.word === wordData.word);
  const nextStudyIndex = findNextNewStudyIndex(activeWords, progress, currentIdx >= 0 ? currentIdx + 1 : 0);
  const nextWord = nextStudyIndex >= 0 ? activeWords[nextStudyIndex] : null;
  const isFavorite = progress.favorites.includes(wordData.id);
  const record = progress.records[wordData.id];
  const commonMeanings = getCommonMeanings(wordData);
  const primaryMeaning = getPrimaryMeaning(wordData);
  const collocations = getCollocationRows(wordData, wordLookup);

  const speak = (text: string) => {
    speakText(text, 0.8);
  };

  const continueHref = nextWord
    ? `/vocabulary/learn?list=${encodeURIComponent(progress.currentListId || 'cet4')}&start=${encodeURIComponent(nextWord.word)}`
    : '/vocabulary/learn';

  const toggleFavorite = () => {
    const p = { ...progress };
    if (p.favorites.includes(wordData.id)) {
      p.favorites = p.favorites.filter(id => id !== wordData.id);
    } else {
      p.favorites.push(wordData.id);
    }
    saveProgress(p);
    setProgress(p);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-32">
      <div className="mx-auto">
        <Link
          to="/vocabulary"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 no-underline text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {T.backToList}
        </Link>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 md:p-7 text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-3xl md:text-5xl font-bold leading-none">{wordData.word}</h1>
              <button
                type="button"
                onClick={() => speak(wordData.word)}
                aria-label={`朗读 ${wordData.word}`}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors shrink-0"
              >
                <Volume2 className="w-4.5 h-4.5" />
              </button>
            </div>
            <p className="text-blue-100 text-base md:text-lg mb-2">{wordData.phonetic}</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {wordData.partOfSpeech.map((pos, i) => (
                <span key={i} className="text-xs md:text-sm bg-white/20 px-3 py-1 rounded-full">
                  {pos}
                </span>
              ))}
              <button
                type="button"
                onClick={toggleFavorite}
                aria-label={isFavorite ? `取消收藏 ${wordData.word}` : `收藏 ${wordData.word}`}
                aria-pressed={isFavorite}
                className="ml-1"
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'text-red-300 fill-red-300' : 'text-white/50 hover:text-red-300'}`} />
              </button>
            </div>

            {record && (
              <div className="flex items-center justify-center gap-4 mt-3 text-xs md:text-sm text-blue-100">
                <span>正确 {record.correctCount}</span>
                <span>错误 {record.wrongCount}</span>
                <span>等级 Lv.{record.level}</span>
              </div>
            )}

            <div className="mt-5 flex justify-center">
              {nextWord ? (
                <button
                  onClick={() => navigate(continueHref)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
                >
                  {T.continue}
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <Link
                  to={continueHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-blue-700 no-underline shadow-sm transition-colors hover:bg-blue-50"
                >
                  {T.startLearning}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>

          <div className="p-5 md:p-7 space-y-4 md:space-y-5">
            {wordData.etymologyParts && wordData.etymologyParts.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-800 mb-2.5">
                <GitBranch className="w-5 h-5 text-purple-500" />
                {T.wordBreakdown}
              </h3>
              <div className="bg-gray-50 rounded-2xl p-4 md:p-5">
                <div className="flex items-center justify-center gap-3 flex-wrap mb-2.5">
                  {wordData.etymologyParts.map((ep, i) => {
                    const color = etymologyColors[ep.type];
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <span className={`text-2xl font-bold ${color.text} mb-1`}>{ep.part}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${color.bg} ${color.text} font-medium`}>
                          {color.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap text-center">
                  {wordData.etymologyParts.map((ep, i) => (
                    <span key={i} className="text-sm text-gray-600">
                      <span className={`font-semibold ${etymologyColors[ep.type].text}`}>{ep.part}</span>({ep.meaning})
                      {i < wordData.etymologyParts!.length - 1 && <span className="mx-1">+</span>}
                    </span>
                  ))}
                  <span className="text-sm text-gray-500 ml-1">→ {primaryMeaning}</span>
                </div>
              </div>
            </section>
          )}

            {wordData.etymology && (!wordData.etymologyParts || wordData.etymologyParts.length === 0) && (
            <section>
              <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-800 mb-2.5">
                <GitBranch className="w-5 h-5 text-purple-500" />
                {T.etymology}
              </h3>
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-gray-700">{wordData.etymology}</p>
              </div>
            </section>
          )}

          {commonMeanings.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-800 mb-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                常用意思
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                {commonMeanings.map((meaning, index) => (
                  <div key={`${wordData.id}-meaning-${index}`} className="rounded-xl border border-amber-100 bg-amber-50/65 px-3 py-3">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold text-amber-600 shadow-sm">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-bold text-gray-800">{meaning.title}</span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            常用
                          </span>
                        </div>
                        <p className="mt-0.5 text-[14px] leading-6 text-gray-700">{meaning.summary}</p>
                        {meaning.exampleEn && (
                          <div className="mt-2 flex items-start gap-2 rounded-lg bg-white/90 px-2.5 py-2 ring-1 ring-amber-100">
                            <button
                              type="button"
                              onClick={() => speak(meaning.exampleEn)}
                              aria-label={`朗读常用意思 ${index + 1} 例句`}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 transition-colors hover:bg-amber-200"
                            >
                              <Volume2 className="h-4 w-4" />
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold leading-5 text-gray-800">{meaning.exampleEn}</p>
                              <p className="mt-0.5 text-[12px] leading-5 text-gray-500">{meaning.exampleZh}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

            <section>
            <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-800 mb-2.5">
              <BookOpen className="w-5 h-5 text-blue-500" />
              {T.definitions}
            </h3>
            <div className="space-y-2.5">
              {wordData.definitions.map((def, i) => (
                <div key={i} className="pl-4 border-l-3 border-blue-200">
                  <p className="text-gray-600 italic mb-1">{def.en}</p>
                  <p className="text-gray-800 font-medium">{def.zh}</p>
                </div>
              ))}
            </div>
            </section>

            {wordData.examples.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-800 mb-2.5">
                  <Quote className="w-5 h-5 text-green-500" />
                  {T.examples}
                </h3>
                <div className="space-y-2">
                  {wordData.examples.map((ex, i) => (
                    <div key={`${wordData.id}-example-${i}`} className="bg-gray-50 rounded-2xl overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => speak(ex.en)}
                            aria-label={`朗读例句 ${i + 1}`}
                            className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 hover:bg-green-200"
                          >
                            <Volume2 className="w-4 h-4 text-green-600" />
                          </button>
                          <div>
                            <p className="text-gray-700 leading-relaxed mb-1">{ex.en}</p>
                            <p className="text-gray-500 text-sm">{ex.zh}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {collocations.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-800 mb-2.5">
                <Layers className="w-5 h-5 text-teal-500" />
                {T.collocations}
              </h3>
              <div className="space-y-2">
                {collocations.map((col, i) => (
                  <div key={`${col.en}-${i}`} className="rounded-2xl bg-teal-50 px-4 py-2">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-sm font-bold text-teal-700">{col.pattern}：</span>
                      <span className="font-semibold text-gray-800">{col.en}</span>
                      <span className="text-sm text-gray-500">{col.zh}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {wordData.synonyms && wordData.synonyms.length > 0 && (
              <section>
                <h3 className="font-bold text-gray-800 mb-2.5">{T.synonyms}</h3>
                <div className="flex flex-wrap gap-2">
                  {wordData.synonyms.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}
            {wordData.antonyms && wordData.antonyms.length > 0 && (
              <section>
                <h3 className="font-bold text-gray-800 mb-2.5">{T.antonyms}</h3>
                <div className="flex flex-wrap gap-2">
                  {wordData.antonyms.map((a, i) => (
                    <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                      {a}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-50 px-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {nextWord ? (
            <button
              onClick={() =>
                navigate(
                  `/vocabulary/learn?list=${encodeURIComponent(progress.currentListId || 'cet4')}&start=${encodeURIComponent(nextWord.word)}`,
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 font-bold text-base text-white shadow-xl shadow-blue-500/25 transition-colors hover:bg-blue-700"
            >
              {T.continue} <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <Link
              to="/vocabulary/learn"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 font-bold text-base text-white no-underline shadow-xl shadow-blue-500/25 transition-colors hover:bg-blue-700"
            >
              {T.startLearning} <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
