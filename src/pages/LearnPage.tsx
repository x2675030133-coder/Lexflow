import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Edit3,
  Heart,
  Home,
  XCircle,
  Volume2,
} from 'lucide-react';
import type { Word } from '../data/types';
import { words as fallbackWords } from '../data/words';
import { wordLists } from '../data/wordLists';
import { calculateNextReview, getProgress, saveProgress, updateStreak } from '../utils/storage';
import { speakText } from '../utils/settings';
import { loadWordList } from '../utils/wordListService';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';

type LearnMode = 'choice' | 'spelling';
type Stage = 'select' | 'practice' | 'result';

function today() {
  return new Date().toISOString().split('T')[0];
}

function getMainDefinition(word: Word) {
  return word.definitions[0]?.zh || '暂无释义';
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeOptions(current: Word, pool: Word[]) {
  const wrong = shuffle(pool.filter((item) => item.id !== current.id)).slice(0, 3).map(getMainDefinition);
  return shuffle([getMainDefinition(current), ...wrong]);
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

function isRedundantMemoryTip(word: Word, tip: string) {
  const normalizedTip = normalizeText(tip);
  const normalizedWord = normalizeText(word.word);
  const normalizedDefinition = normalizeText(getMainDefinition(word));
  return (
    normalizedTip === normalizedWord ||
    normalizedTip === normalizedDefinition ||
    (normalizedTip.includes(normalizedWord) && normalizedTip.includes(normalizedDefinition))
  );
}

function getMemoryAssistantText(word: Word) {
  const tip = word.memoryTip?.trim();
  if (tip && !isRedundantMemoryTip(word, tip)) {
    return tip;
  }

  if (word.etymology?.trim()) {
    return `拆分记忆：${word.etymology.trim()}`;
  }

  if (word.etymologyParts && word.etymologyParts.length > 0) {
    const parts = word.etymologyParts.map((item) => `${item.part}(${item.meaning})`).join(' + ');
    return `拆分记忆：${parts}`;
  }

  return null;
}

function getDisplayExamples(word: Word) {
  const examples = word.examples.slice(0, 2);
  if (examples.length === 1) {
    examples.push({
      en: `Try using "${word.word}" in a sentence.`,
      zh: `试着用 “${word.word}” 造个句。`,
    });
  }
  return examples;
}

export default function LearnPage() {
  const [searchParams] = useSearchParams();
  const initialProgress = getProgress();
  const [selectedListId, setSelectedListId] = useState(searchParams.get('list') || initialProgress.currentListId || 'cet4');
  const [wordPool, setWordPool] = useState<Word[]>(fallbackWords);
  const [progress, setProgress] = useState(initialProgress);
  const [mode, setMode] = useState<LearnMode>('choice');
  const [stage, setStage] = useState<Stage>('select');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [spelling, setSpelling] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const resultTimerRef = useRef<number | null>(null);
  const bookPickerRef = useRef<HTMLDivElement | null>(null);

  useStopMediaOnUnmount();

  useEffect(() => {
    let mounted = true;
    loadWordList(selectedListId)
      .then((loaded) => {
        if (mounted && loaded.length > 0) setWordPool(loaded);
      })
      .catch(() => {
        if (mounted) setWordPool(fallbackWords);
      });

    return () => {
      mounted = false;
    };
  }, [selectedListId]);

  useEffect(() => {
    return () => {
      if (resultTimerRef.current !== null) {
        window.clearTimeout(resultTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!bookPickerOpen) return;
      if (bookPickerRef.current?.contains(event.target as Node)) return;
      setBookPickerOpen(false);
    }

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [bookPickerOpen]);

  const dailyGoal = progress.dailyGoal || 20;
  const currentWord = wordPool[index % wordPool.length];
  const options = useMemo(() => makeOptions(currentWord, wordPool), [currentWord, wordPool]);
  const learnedToday = Math.min(progress.learnedToday || 0, dailyGoal);
  const displayExamples = useMemo(() => getDisplayExamples(currentWord), [currentWord]);
  const memoryAssistantText = useMemo(() => getMemoryAssistantText(currentWord), [currentWord]);
  const currentRecord = progress.records[currentWord.id];
  const currentListMeta = wordLists.find((item) => item.id === selectedListId);
  const currentListLabel = currentListMeta?.name || selectedListId;

  function BookListPicker({ compact = false }: { compact?: boolean }) {
    return (
      <div
        ref={bookPickerRef}
        className={`relative inline-flex w-full flex-col gap-3 rounded-[28px] border border-[#f5f5f7] bg-white/85 p-4 shadow-sm backdrop-blur-sm ${
          compact ? 'min-w-[280px]' : 'sm:min-w-[360px]'
        }`}
      >
        <div className="text-[13px] font-black uppercase tracking-widest text-[#86868b]">切换词表</div>
        <button
          type="button"
          onClick={() => setBookPickerOpen((value) => !value)}
          className={`flex h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-left font-bold text-[#1d1d1f] shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50/40 focus:border-orange-300 ${
            bookPickerOpen ? 'border-orange-300 bg-orange-50/50' : 'border-[#d2d2d7]/50 bg-white'
          }`}
        >
          <span className="truncate text-[15px]">{currentListMeta?.name || '请选择词表'}</span>
          <span className="text-[12px] font-black uppercase tracking-widest text-[#86868b]">
            {currentListMeta?.id.toUpperCase()}
          </span>
        </button>

        {bookPickerOpen ? (
          <div className="mt-1 grid max-h-80 overflow-auto rounded-[24px] border border-[#d2d2d7]/60 bg-white p-2 shadow-inner shadow-black/5">
            {wordLists.map((list) => {
              const isSelected = list.id === selectedListId;
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => {
                    switchList(list.id);
                    setBookPickerOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                    isSelected
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                  }`}
                >
                  <span className="truncate text-[14px] font-bold">{list.name}</span>
                  <span className="shrink-0 rounded-full border border-[#d2d2d7]/60 bg-white px-3 py-1 text-[12px] font-black uppercase tracking-widest text-[#86868b]">
                    {list.id.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  function clearResultTimer() {
    if (resultTimerRef.current !== null) {
      window.clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
  }

  function resetPracticeState() {
    clearResultTimer();
    setSelected(null);
    setSpelling('');
    setFeedback(null);
  }

  function enterPractice(nextMode: LearnMode) {
    resetPracticeState();
    setMode(nextMode);
    setStage('practice');
  }

  function backToSelect() {
    resetPracticeState();
    setStage('select');
  }

  function switchList(nextListId: string) {
    setSelectedListId(nextListId);
    setBookPickerOpen(false);
    setStage('select');
    setMode('choice');
    setIndex(0);
    setSelected(null);
    setSpelling('');
    setFeedback(null);
  }

  function persistAnswer(correct: boolean) {
    const next = updateStreak({ ...progress });
    const existing = next.records[currentWord.id] || {
      wordId: currentWord.id,
      correctCount: 0,
      wrongCount: 0,
      lastReviewDate: today(),
      nextReviewDate: today(),
      level: 0,
      mastered: false,
    };

    const nextLevel = correct ? Math.min(existing.level + 1, 6) : Math.max(existing.level - 1, 0);
    next.records[currentWord.id] = {
      ...existing,
      correctCount: existing.correctCount + (correct ? 1 : 0),
      wrongCount: existing.wrongCount + (correct ? 0 : 1),
      lastReviewDate: today(),
      nextReviewDate: calculateNextReview(nextLevel),
      level: nextLevel,
      mastered: nextLevel >= 5,
    };

    if (correct && existing.correctCount === 0) {
      next.learnedToday = (next.learnedToday || 0) + 1;
      next.totalLearned = (next.totalLearned || 0) + 1;
    }

    next.currentListId = selectedListId;
    saveProgress(next);
    setProgress(next);
  }

  function answerChoice(option: string) {
    if (feedback === 'correct') return;
    setSelected(option);
    const correct = option === getMainDefinition(currentWord);
    setFeedback(correct ? 'correct' : 'wrong');
    persistAnswer(correct);
    if (correct) {
      clearResultTimer();
      resultTimerRef.current = window.setTimeout(() => setStage('result'), 180);
    }
  }

  function submitSpelling() {
    if (!spelling.trim()) return;
    const correct = spelling.trim().toLowerCase() === currentWord.word.toLowerCase();
    setFeedback(correct ? 'correct' : 'wrong');
    persistAnswer(correct);
    if (correct) {
      clearResultTimer();
      resultTimerRef.current = window.setTimeout(() => setStage('result'), 180);
    }
  }

  function nextWord() {
    clearResultTimer();
    setIndex((value) => (value + 1) % wordPool.length);
    resetPracticeState();
    setStage('practice');
  }

  if (stage === 'select') {
    return (
      <div className="mx-auto max-w-5xl animate-in fade-in px-4 py-16 duration-700">
        <Link
          to="/vocabulary"
          className="mb-10 inline-flex items-center gap-2 rounded-2xl border border-[#d2d2d7]/50 bg-white px-5 py-3 text-[15px] font-bold text-[#86868b] shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 active:scale-95"
        >
          <ArrowLeft size={18} />
          返回词表
        </Link>

        <div className="mb-14 flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div className="reveal-1">
            <div className="mb-4 flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.2em] text-[#86868b]">
              <Home size={16} />
              词表学习 · {currentListLabel}
            </div>
            <h1 className="text-[48px] font-black leading-tight tracking-tight text-[#1d1d1f]">选择练习模式</h1>
            <div className="mt-6 text-[17px] font-medium text-[#1d1d1f]">
              今日已学 <span className="font-black text-blue-600">{learnedToday}</span>/{dailyGoal} 词 · 总进度{' '}
              {progress.totalLearned || 0}/{wordPool.length}
            </div>
            <div className="mt-5 h-2.5 w-72 overflow-hidden rounded-full bg-[#f5f5f7] shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm transition-all duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                style={{ width: `${Math.min(100, (learnedToday / dailyGoal) * 100)}%` }}
              />
            </div>

            <div className="mt-6">
              <BookListPicker />
            </div>
          </div>

          <Link
            to="/settings"
            className="reveal-2 rounded-2xl border border-[#d2d2d7]/50 bg-white px-6 py-4 text-[15px] font-bold text-blue-600 shadow-sm transition-all hover:border-blue-100 hover:bg-blue-50 active:scale-95"
          >
            去设置修改每日目标
          </Link>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <button
            onClick={() => enterPractice('choice')}
            className="group apple-card reveal-1 bg-gradient-to-br from-blue-50 to-white p-8 text-left"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110 group-hover:rotate-3">
                <ArrowRight size={24} className="-rotate-45" />
              </div>
              <ArrowRight className="text-blue-600 transition-transform group-hover:translate-x-2" size={24} />
            </div>
            <h2 className="text-[26px] font-black tracking-tight text-[#1d1d1f]">选择释义</h2>
            <p className="mt-3 text-[16px] font-medium leading-relaxed text-[#86868b]">
              看英文，选中文释义，快速建立词义映射。适合新词预热。
            </p>
          </button>

          <button onClick={() => enterPractice('spelling')} className="group apple-card reveal-2 p-8 text-left">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Edit3 size={28} />
              </div>
              <ArrowRight className="text-[#1d1d1f] transition-transform group-hover:translate-x-2" size={24} />
            </div>
            <h2 className="text-[26px] font-black tracking-tight text-[#1d1d1f]">拼写模式</h2>
            <p className="mt-3 text-[16px] font-medium leading-relaxed text-[#86868b]">
              根据中文释义默写英文，强化主动输出能力。适合深度巩固。
            </p>
          </button>
        </div>
      </div>
    );
  }

  const promptText =
    mode === 'choice'
      ? '选择正确的中文释义'
      : '根据中文释义默写英文';

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in px-4 py-10 duration-500">
      <div className="mb-10 flex items-center justify-between">
        <button
          onClick={backToSelect}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#d2d2d7]/50 bg-white px-5 py-3 text-[15px] font-bold text-[#1d1d1f] shadow-sm transition-all hover:bg-[#f5f5f7] active:scale-95"
        >
          <ArrowLeft size={18} />
          返回中心
        </button>
        <div className="flex items-center gap-3">
          <BookListPicker compact />
          <div className="rounded-full bg-orange-50 px-4 py-1.5 text-[13px] font-black uppercase tracking-widest text-orange-600 border border-orange-100">
            {mode === 'choice' ? '选择释义' : '拼写模式'}
          </div>
        </div>
      </div>

      <section
        className={`overflow-hidden rounded-[40px] bg-white shadow-2xl shadow-black/5 transition-all duration-500 ${
          feedback === 'wrong' ? 'animate-apple-shake' : feedback === 'correct' ? 'animate-apple-pop' : ''
        }`}
      >
        <div className="relative overflow-hidden bg-[#f5f5f7]/50 px-8 py-12 text-center">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-30">
            <div className="absolute left-[-10%] top-[-50%] h-[120%] w-[60%] rounded-full bg-blue-100 blur-[100px]" />
            <div className="absolute bottom-[-50%] right-[-10%] h-[120%] w-[60%] rounded-full bg-indigo-50 blur-[100px]" />
          </div>

          <div className="relative z-10">
            <div className="mb-5 flex items-center justify-center gap-4">
              <h1 className="text-[clamp(3rem,7vw,5.25rem)] font-black tracking-tighter text-[#1d1d1f]">{currentWord.word}</h1>
              <button
                onClick={() => speakText(currentWord.word)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-xl shadow-blue-500/10 transition-all hover:scale-110 active:scale-90"
              >
                <Volume2 size={24} />
              </button>
            </div>
            <p className="mb-6 text-[clamp(1rem,2.4vw,1.35rem)] font-bold italic tracking-tight text-[#86868b] opacity-60">
              {currentWord.phonetic}
            </p>
            <div className="flex justify-center gap-3">
              {currentWord.partOfSpeech.map((part) => (
                <span key={part} className="rounded-xl bg-blue-600/10 px-4 py-1.5 text-sm font-black text-blue-700">
                  {part}
                </span>
              ))}
              <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-400 transition-all hover:bg-red-500 hover:text-white active:scale-90">
                <Heart size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8 rounded-3xl bg-[#f5f5f7] px-8 py-6 text-center">
            <div className="mb-2 text-[13px] font-black uppercase tracking-widest text-[#86868b]">当前提示</div>
            <div className="text-[22px] font-black text-[#1d1d1f]">{promptText}</div>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[13px] font-black uppercase tracking-widest text-[#86868b]">
              {currentListLabel}
            </span>
            <span className="rounded-full bg-blue-50 px-4 py-2 text-[13px] font-black uppercase tracking-widest text-blue-600">
              {currentRecord?.mastered ? '已掌握' : `Lv.${currentRecord?.level ?? 0}`}
            </span>
            {memoryAssistantText ? (
              <span className="rounded-full bg-amber-50 px-4 py-2 text-[13px] font-black text-amber-700">
                {memoryAssistantText}
              </span>
            ) : null}
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            {displayExamples.map((example) => (
              <article key={example.en} className="rounded-3xl border border-[#f5f5f7] bg-white px-5 py-4 shadow-sm">
                <p className="text-[15px] font-bold text-[#1d1d1f]">{example.en}</p>
                <p className="mt-2 text-[14px] font-medium text-[#86868b]">{example.zh}</p>
              </article>
            ))}
          </div>

          {stage === 'practice' && mode === 'spelling' ? (
            <div className="space-y-6">
              <div className="flex gap-4">
                <input
                  autoFocus
                  value={spelling}
                  onChange={(event) => setSpelling(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submitSpelling();
                  }}
                  className="h-16 flex-1 rounded-[24px] border-2 border-[#f5f5f7] px-8 text-xl font-bold outline-none transition-all focus:border-orange-400 focus:bg-white shadow-sm"
                  placeholder="输入单词拼写..."
                />
                <button
                  onClick={submitSpelling}
                  className="rounded-[24px] bg-orange-500 px-10 font-black text-white shadow-xl shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95"
                >
                  提交
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {options.map((option, optionIndex) => {
                const correctAnswer = mode === 'choice' ? getMainDefinition(currentWord) : currentWord.word;
                const isSelected = selected === option;
                const isCorrect = option === correctAnswer;
                const stateClass =
                  isSelected && feedback === 'wrong'
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-red-100'
                    : isSelected && feedback === 'correct'
                      ? 'border-green-500 bg-green-50 text-green-700 shadow-green-100'
                      : feedback === 'wrong' && isCorrect
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-green-100'
                        : 'border-[#f5f5f7] bg-white text-[#1d1d1f] hover:border-orange-300 hover:bg-orange-50 shadow-sm';

                return (
                  <button
                    key={option}
                    onClick={() => answerChoice(option)}
                    className={`flex w-full items-center gap-6 rounded-3xl border-2 px-8 py-6 text-left text-[19px] font-bold transition-all duration-300 active:scale-[0.98] shadow-md hover:shadow-xl ${stateClass}`}
                  >
                    <span className="text-[16px] font-black text-[#d2d2d7]">{String.fromCharCode(65 + optionIndex)}</span>
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            {feedback === 'wrong' && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-5 py-3 font-black text-red-600 animate-in slide-in-from-top-2 duration-300">
                <XCircle size={18} /> 加油，再试一次！
              </div>
            )}
            {feedback === 'correct' && (
              <div className="flex items-center gap-3 rounded-2xl bg-green-50 px-5 py-3 font-black text-green-700 animate-in slide-in-from-top-2 duration-300">
                <CheckCircle2 size={18} /> 太棒了，完全正确！
                <button
                  type="button"
                  onClick={nextWord}
                  className="rounded-full bg-white px-3 py-1 text-[13px] font-black text-green-700 shadow-sm"
                >
                  下一个单词
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
