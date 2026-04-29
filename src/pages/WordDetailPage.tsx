import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Volume2,
  Heart,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  GitBranch,
  Quote,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { words as fallbackWords } from '../data/words';
import type { Word } from '../data/types';
import { getProgress, saveProgress } from '../utils/storage';
import { findWordByWord, loadWordList } from '../utils/wordListService';
import { speakText } from '../utils/settings';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';

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
  memoryTip: '记忆提示',
  synonyms: '近义词',
  antonyms: '反义词',
  wordBreakdown: '词根拆解',
  etymology: '词源',
  continue: '继续学习',
  startLearning: '开始学习',
};

const fallbackCollocations: Record<string, { en: string; zh: string }[]> = {
  apple: [
    { en: 'apple pie', zh: '苹果派' },
    { en: 'apple juice', zh: '苹果汁' },
    { en: 'apple tree', zh: '苹果树' },
    { en: 'an apple a day', zh: '一天一个苹果' },
  ],
  change: [
    { en: 'change your mind', zh: '改变主意' },
    { en: 'change course', zh: '改变方向' },
    { en: 'change your seat', zh: '换座位' },
    { en: 'change into', zh: '变成；改换成' },
  ],
  improve: [
    { en: 'improve your skills', zh: '提高技能' },
    { en: 'improve efficiency', zh: '提高效率' },
    { en: 'improve the situation', zh: '改善情况' },
  ],
  make: [
    { en: 'make a plan', zh: '制定计划' },
    { en: 'make progress', zh: '取得进步' },
    { en: 'make a decision', zh: '做决定' },
    { en: 'make sense', zh: '有道理' },
  ],
};

function getCollocations(wordData: Word) {
  if (wordData.collocations && wordData.collocations.length > 0) {
    return wordData.collocations;
  }
  return fallbackCollocations[wordData.word.toLowerCase()] || [];
}

export default function WordDetailPage() {
  const { word: wordParam } = useParams<{ word: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(getProgress());
  const [activeWords, setActiveWords] = useState<Word[]>(fallbackWords);
  const [wordData, setWordData] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);

  useStopMediaOnUnmount();

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
  const nextWord = currentIdx >= 0 && currentIdx < activeWords.length - 1 ? activeWords[currentIdx + 1] : null;
  const isFavorite = progress.favorites.includes(wordData.id);
  const record = progress.records[wordData.id];
  const collocations = getCollocations(wordData);

  const speak = (text: string) => {
    speakText(text, 0.8);
  };

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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/vocabulary"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 no-underline text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        {T.backToList}
      </Link>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-10 text-center text-white">
          <div className="flex items-center justify-center gap-4 mb-3">
            <h1 className="text-5xl font-bold">{wordData.word}</h1>
            <button
              onClick={() => speak(wordData.word)}
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>
          <p className="text-blue-100 text-xl mb-3">{wordData.phonetic}</p>
          <div className="flex items-center justify-center gap-3">
            {wordData.partOfSpeech.map((pos, i) => (
              <span key={i} className="text-sm bg-white/20 px-3 py-1 rounded-full">
                {pos}
              </span>
            ))}
            <button onClick={toggleFavorite}>
              <Heart className={`w-6 h-6 ${isFavorite ? 'text-red-300 fill-red-300' : 'text-white/50 hover:text-red-300'}`} />
            </button>
          </div>

          {record && (
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-blue-100">
              <span>正确 {record.correctCount}</span>
              <span>错误 {record.wrongCount}</span>
              <span>等级 Lv.{record.level}</span>
            </div>
          )}
        </div>

        <div className="p-8 space-y-8">
          {wordData.etymologyParts && wordData.etymologyParts.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                <GitBranch className="w-5 h-5 text-purple-500" />
                {T.wordBreakdown}
              </h3>
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
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
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {wordData.etymologyParts.map((ep, i) => (
                    <span key={i} className="text-sm text-gray-600">
                      <span className={`font-semibold ${etymologyColors[ep.type].text}`}>{ep.part}</span>({ep.meaning})
                      {i < wordData.etymologyParts!.length - 1 && <span className="mx-1">+</span>}
                    </span>
                  ))}
                  <span className="text-sm text-gray-500 ml-1">→ {wordData.definitions[0].zh}</span>
                </div>
              </div>
            </section>
          )}

          {wordData.etymology && (!wordData.etymologyParts || wordData.etymologyParts.length === 0) && (
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                <GitBranch className="w-5 h-5 text-purple-500" />
                {T.etymology}
              </h3>
              <div className="bg-purple-50 rounded-xl p-5">
                <p className="text-gray-700">{wordData.etymology}</p>
              </div>
            </section>
          )}

          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
              <BookOpen className="w-5 h-5 text-blue-500" />
              {T.definitions}
            </h3>
            <div className="space-y-4">
              {wordData.definitions.map((def, i) => (
                <div key={i} className="pl-4 border-l-3 border-blue-200">
                  <p className="text-gray-600 italic mb-1">{def.en}</p>
                  <p className="text-gray-800 font-medium">{def.zh}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
              <Quote className="w-5 h-5 text-green-500" />
              {T.examples}
            </h3>
            <div className="space-y-4">
              {wordData.examples.map((ex, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => speak(ex.en)}
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

          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
              <Layers className="w-5 h-5 text-teal-500" />
              {T.collocations}
            </h3>
            <div className="bg-teal-50 rounded-2xl p-4 space-y-3">
              {collocations.length > 0 ? (
                collocations.map((col, i) => (
                  <div key={i} className="bg-white/80 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                    <span className="font-medium text-gray-800">{col.en}</span>
                    <span className="text-sm text-gray-500 text-right">{col.zh}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">当前词条还没有整理好的词组搭配。</p>
              )}
            </div>
          </section>

          {wordData.memoryTip && (
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                {T.memoryTip}
              </h3>
              <div className="bg-yellow-50 rounded-xl p-5">
                <p className="text-gray-700">{wordData.memoryTip}</p>
              </div>
            </section>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {wordData.synonyms && wordData.synonyms.length > 0 && (
              <section>
                <h3 className="font-bold text-gray-800 mb-3">{T.synonyms}</h3>
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
                <h3 className="font-bold text-gray-800 mb-3">{T.antonyms}</h3>
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

      <div className="flex gap-4">
        {nextWord ? (
          <button
            onClick={() => navigate(`/word/${nextWord.word}`)}
            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {T.continue} <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <Link
            to="/vocabulary/learn"
            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 no-underline"
          >
            {T.startLearning} <ArrowRight className="w-5 h-5" />
          </Link>
        )}
      </div>
    </div>
  );
}
