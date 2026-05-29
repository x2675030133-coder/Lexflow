import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Edit3, Heart, Home, Volume2, XCircle } from 'lucide-react';
import type { Word } from '../data/types';
import { words as fallbackWords } from '../data/words';
import { wordLists } from '../data/wordLists';
import { calculateNextReview, getProgress, saveProgress, updateStreak } from '../utils/storage';
import { speakText } from '../utils/settings';
import { loadWordList } from '../utils/wordListService';
import { findNextNewStudyIndex, isNewStudyWord } from '../utils/studyFlow';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';
import { useStudyTimeTracker } from '../hooks/useStudyTimeTracker';
import { getPrimaryMeaning } from '../data/wordUsageNotes';

type LearnMode = 'choice' | 'spelling';
type Stage = 'select' | 'practice';

function today() {
  return new Date().toISOString().split('T')[0];
}

function getMainDefinition(word: Word) {
  return getPrimaryMeaning(word);
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeOptions(current: Word, pool: Word[]) {
  const wrong = shuffle(pool.filter((item) => item.id !== current.id)).slice(0, 3).map(getMainDefinition);
  return shuffle([getMainDefinition(current), ...wrong]);
}

function getDisplayExamples(word: Word) {
  return word.examples.slice(0, 2);
}

function makeStudyQueue(words: Word[], progress: ReturnType<typeof getProgress>, startIndex = 0) {
  const nextIndex = findNextNewStudyIndex(words, progress, startIndex);
  if (nextIndex < 0) return [];
  return [...words.slice(nextIndex), ...words.slice(0, nextIndex)].filter((word) => isNewStudyWord(word, progress));
}

export default function LearnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const startWord = searchParams.get('start') || searchParams.get('word');
  const initialProgress = getProgress();
  const [selectedListId, setSelectedListId] = useState(searchParams.get('list') || initialProgress.currentListId || 'cet4');
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [wordPool, setWordPool] = useState<Word[]>(fallbackWords);
  const [progress, setProgress] = useState(initialProgress);
  const [mode, setMode] = useState<LearnMode>('choice');
  const [stage, setStage] = useState<Stage>('select');
  const [sessionQueue, setSessionQueue] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [spelling, setSpelling] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const startWordAppliedRef = useRef(false);
  const resultTimerRef = useRef<number | null>(null);
  const listMenuRef = useRef<HTMLDivElement | null>(null);
  const practicePanelRef = useRef<HTMLDivElement | null>(null);

  useStopMediaOnUnmount();
  useStudyTimeTracker(stage === 'practice');

  const clearResultTimer = useCallback(() => {
    if (resultTimerRef.current !== null) {
      window.clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
  }, []);

  const resetPracticeState = useCallback(() => {
    clearResultTimer();
    setSelected(null);
    setSpelling('');
    setFeedback(null);
  }, [clearResultTimer]);

  useEffect(() => {
    let mounted = true;
    loadWordList(selectedListId)
      .then((loaded) => {
        if (!mounted) return;
        if (loaded.length > 0) {
          setWordPool(loaded);
          if (startWord && !startWordAppliedRef.current) {
            const startIndex = loaded.findIndex((word) => word.word === startWord);
            if (startIndex >= 0) {
              setSessionQueue(makeStudyQueue(loaded, getProgress(), startIndex));
              setIndex(0);
              setStage('practice');
              resetPracticeState();
            }
            startWordAppliedRef.current = true;
          }
        }
      })
      .catch(() => {
        if (mounted) setWordPool(fallbackWords);
      });

    return () => {
      mounted = false;
    };
  }, [resetPracticeState, selectedListId, startWord]);

  useEffect(() => {
    return () => {
      if (resultTimerRef.current !== null) {
        window.clearTimeout(resultTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (listMenuRef.current && !listMenuRef.current.contains(event.target as Node)) {
        setListMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (stage !== 'practice') return;

    const node = practicePanelRef.current;
    if (!node) return;

    const frame = window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [stage, selectedListId, mode]);

  const dailyGoal = progress.dailyGoal || 20;
  const currentWord = sessionQueue.length > 0
    ? sessionQueue[index % sessionQueue.length]
    : wordPool[index % wordPool.length];
  const options = useMemo(() => makeOptions(currentWord, wordPool), [currentWord, wordPool]);
  const learnedToday = Math.min(progress.learnedToday || 0, dailyGoal);
  const displayExamples = useMemo(() => getDisplayExamples(currentWord), [currentWord]);
  const currentRecord = progress.records[currentWord.id];
  const currentListMeta = wordLists.find((item) => item.id === selectedListId);
  const currentListLabel = currentListMeta?.name || selectedListId;

  function enterPractice(nextMode: LearnMode) {
    resetPracticeState();
    setSessionQueue(makeStudyQueue(wordPool, progress, 0));
    setIndex(0);
    setMode(nextMode);
    setStage('practice');
  }

  function backToSelect() {
    resetPracticeState();
    setSessionQueue([]);
    setIndex(0);
    setStage('select');
  }

  function switchList(nextListId: string) {
    setSelectedListId(nextListId);
    setIndex(0);
    setSessionQueue([]);
    resetPracticeState();
    setStage('select');
    setListMenuOpen(false);
  }

  function persistAnswer(correct: boolean) {
    const next = updateStreak({ ...progress });
    const now = new Date().toISOString();
    const existing = next.records[currentWord.id] || {
      wordId: currentWord.id,
      correctCount: 0,
      wrongCount: 0,
      lastReviewDate: today(),
      nextReviewDate: today(),
      level: 0,
      mastered: false,
      updatedAt: now,
    };

    const nextLevel = correct ? Math.min(existing.level + 1, 6) : Math.max(existing.level - 1, 0);
    next.records[currentWord.id] = {
      ...existing,
      correctCount: existing.correctCount + (correct ? 1 : 0),
      wrongCount: existing.wrongCount + (correct ? 0 : 1),
      lastReviewDate: today(),
      nextReviewDate: correct ? calculateNextReview(nextLevel) : today(),
      level: nextLevel,
      mastered: nextLevel >= 5,
      updatedAt: now,
    };

    if (correct && existing.correctCount === 0) {
      next.learnedToday = (next.learnedToday || 0) + 1;
      next.totalLearned = (next.totalLearned || 0) + 1;
    }

    next.currentListId = selectedListId;
    saveProgress(next);
    setProgress(next);
  }

  function toggleFavorite() {
    const next = { ...progress };
    if (next.favorites.includes(currentWord.id)) {
      next.favorites = next.favorites.filter((id) => id !== currentWord.id);
    } else {
      next.favorites = [...next.favorites, currentWord.id];
    }

    saveProgress(next);
    setProgress(next);
  }

  function enqueueRetryLater(item: Word) {
    setSessionQueue((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      const insertAt = Math.min(index + 2, next.length);
      next.splice(insertAt, 0, item);
      return next;
    });
  }

  function answerChoice(option: string) {
    if (feedback !== null) return;
    setSelected(option);
    const correct = option === getMainDefinition(currentWord);
    setFeedback(correct ? 'correct' : 'wrong');
    persistAnswer(correct);
    if (correct) {
      clearResultTimer();
      resultTimerRef.current = window.setTimeout(() => goToWordDetail(currentWord), 180);
    } else {
      enqueueRetryLater(currentWord);
      clearResultTimer();
      resultTimerRef.current = window.setTimeout(nextWord, 3000);
    }
  }

  function submitSpelling() {
    if (feedback !== null || !spelling.trim()) return;
    const correct = spelling.trim().toLowerCase() === currentWord.word.toLowerCase();
    setFeedback(correct ? 'correct' : 'wrong');
    persistAnswer(correct);
    if (correct) {
      clearResultTimer();
      resultTimerRef.current = window.setTimeout(() => goToWordDetail(currentWord), 180);
    } else {
      enqueueRetryLater(currentWord);
      clearResultTimer();
      resultTimerRef.current = window.setTimeout(nextWord, 3000);
    }
  }

  function goToWordDetail(word: Word) {
    navigate(`/word/${encodeURIComponent(word.word)}`);
  }

  function nextWord() {
    clearResultTimer();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const nextIndex = findNextNewStudyIndex(sessionQueue, getProgress(), index + 1);
    if (nextIndex < 0) {
      setSessionQueue([]);
      setIndex(0);
      resetPracticeState();
      setStage('practice');
      return;
    }
    setIndex(nextIndex);
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
          </div>

          <Link
            to="/settings"
            className="reveal-2 rounded-2xl border border-[#d2d2d7]/50 bg-white px-6 py-4 text-[15px] font-bold text-blue-600 shadow-sm transition-all hover:border-blue-100 hover:bg-blue-50 active:scale-95"
          >
            去设置修改每日目标
          </Link>
        </div>

        <div ref={listMenuRef} className="relative mb-10 w-full max-w-[360px] rounded-[28px] border border-[#d2d2d7]/50 bg-white p-4 shadow-sm">
          <div className="mb-3 text-[13px] font-black uppercase tracking-[0.2em] text-[#86868b]">切换词表</div>
          <button
            type="button"
            onClick={() => setListMenuOpen((value) => !value)}
            className="flex h-14 w-full items-center justify-between rounded-2xl border border-[#e5e5ea] bg-white px-5 text-[15px] font-bold text-[#1d1d1f] shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50"
          >
            <span>{wordLists.find((list) => list.id === selectedListId)?.name || selectedListId}</span>
            <span className="inline-flex items-center gap-2 text-[#86868b]">
              <span className="text-[12px] font-black uppercase tracking-[0.18em]">{selectedListId}</span>
              <ArrowRight className={`transition-transform duration-200 ${listMenuOpen ? 'rotate-90' : '-rotate-90'}`} size={18} />
            </span>
          </button>

          {listMenuOpen && (
            <div className="absolute left-4 right-4 top-[100%] z-50 mt-3 max-h-72 overflow-auto rounded-3xl border border-[#e5e5ea] bg-white p-2 shadow-2xl shadow-black/10">
              {wordLists.map((list) => {
                const active = list.id === selectedListId;
                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => switchList(list.id)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all ${
                      active ? 'bg-blue-50 text-blue-700' : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                    }`}
                  >
                    <span className="font-bold">{list.name}</span>
                    <span className="text-[12px] font-black uppercase tracking-[0.18em] text-[#86868b]">{list.id}</span>
                  </button>
                );
              })}
            </div>
          )}
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

  const promptText = mode === 'choice' ? '选择正确的中文释义' : '根据中文释义默写英文';

  if (sessionQueue.length === 0) {
    return (
      <div className="mx-auto max-w-3xl animate-in fade-in px-4 py-16 text-center duration-500">
        <div className="rounded-[32px] bg-white px-8 py-10 shadow-2xl shadow-black/5">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <CheckCircle2 size={30} />
          </div>
          <h1 className="text-[32px] font-black tracking-tight text-[#1d1d1f]">新词已经学完了</h1>
          <p className="mx-auto mt-3 max-w-md text-[16px] font-medium leading-relaxed text-[#86868b]">
            这张词表里已经首次答对的单词会进入复习，不再混回背单词练习。
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/vocabulary/review"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 font-black text-white no-underline shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95"
            >
              去复习单词
            </Link>
            <button
              type="button"
              onClick={backToSelect}
              className="inline-flex items-center justify-center rounded-2xl border border-[#d2d2d7]/60 bg-white px-6 py-3 font-black text-[#1d1d1f] shadow-sm transition-all hover:bg-[#f5f5f7] active:scale-95"
            >
              返回中心
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-in fade-in px-4 py-8 duration-500">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={backToSelect}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#d2d2d7]/50 bg-white px-5 py-3 text-[15px] font-bold text-[#1d1d1f] shadow-sm transition-all hover:bg-[#f5f5f7] active:scale-95"
        >
          <ArrowLeft size={18} />
          返回中心
        </button>
        <div className="rounded-full border border-orange-100 bg-orange-50 px-4 py-1.5 text-[13px] font-black uppercase tracking-widest text-orange-600">
          {mode === 'choice' ? '选择释义' : '拼写模式'}
        </div>
      </div>

      <section
        ref={practicePanelRef}
        className={`overflow-hidden rounded-[36px] bg-white shadow-2xl shadow-black/5 transition-all duration-500 ${
          feedback === 'wrong' ? 'animate-apple-shake' : feedback === 'correct' ? 'animate-apple-pop' : ''
        }`}
      >
        <div className="relative overflow-hidden bg-[#f5f5f7]/50 px-6 py-8 text-center">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-30">
            <div className="absolute left-[-10%] top-[-50%] h-[120%] w-[60%] rounded-full bg-blue-100 blur-[100px]" />
            <div className="absolute bottom-[-50%] right-[-10%] h-[120%] w-[60%] rounded-full bg-indigo-50 blur-[100px]" />
          </div>

          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-center gap-3">
              <h1 className="text-[clamp(2.6rem,5.6vw,4.6rem)] font-black tracking-tighter text-[#1d1d1f]">
                {currentWord.word}
              </h1>
              <button
                type="button"
                onClick={() => speakText(currentWord.word)}
                aria-label={`朗读 ${currentWord.word}`}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-600 shadow-xl shadow-blue-500/10 transition-all hover:scale-110 active:scale-90"
              >
                <Volume2 size={21} />
              </button>
            </div>
            <p className="mb-5 text-[clamp(0.95rem,2vw,1.15rem)] font-bold italic tracking-tight text-[#86868b] opacity-60">
              {currentWord.phonetic}
            </p>
            <div className="flex justify-center gap-2.5">
              {currentWord.partOfSpeech.map((part) => (
                <span key={part} className="rounded-xl bg-blue-600/10 px-3.5 py-1.5 text-[13px] font-black text-blue-700">
                  {part}
                </span>
              ))}
              <button
                type="button"
                onClick={toggleFavorite}
                aria-label={progress.favorites.includes(currentWord.id) ? `取消收藏 ${currentWord.word}` : `收藏 ${currentWord.word}`}
                aria-pressed={progress.favorites.includes(currentWord.id)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-400 transition-all hover:bg-red-500 hover:text-white active:scale-90"
              >
                <Heart size={17} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-4 rounded-3xl bg-[#f5f5f7] px-5 py-4 text-center">
            <div className="mb-2 text-[13px] font-black uppercase tracking-widest text-[#86868b]">当前提示</div>
            <div className="text-[18px] font-black text-[#1d1d1f] sm:text-[19px]">{promptText}</div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-center gap-2.5">
            <span className="rounded-full bg-[#f5f5f7] px-3.5 py-2 text-[12px] font-black uppercase tracking-widest text-[#86868b]">
              {currentListLabel}
            </span>
            <span className="rounded-full bg-blue-50 px-3.5 py-2 text-[12px] font-black uppercase tracking-widest text-blue-600">
              {currentRecord?.mastered ? '已掌握' : `Lv.${currentRecord?.level ?? 0}`}
            </span>
          </div>

          <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
            {displayExamples.map((example) => (
              <article key={example.en} className="rounded-3xl border border-[#f5f5f7] bg-white px-4 py-3 shadow-sm">
                <p className="text-[14px] font-bold text-[#1d1d1f]">{example.en}</p>
              </article>
            ))}
          </div>

          {stage === 'practice' && mode === 'spelling' ? (
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  autoFocus
                  value={spelling}
                  onChange={(event) => setSpelling(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submitSpelling();
                  }}
                  className="h-14 flex-1 rounded-[24px] border-2 border-[#f5f5f7] px-6 text-lg font-bold outline-none shadow-sm transition-all focus:border-orange-400 focus:bg-white"
                  placeholder="输入单词拼写..."
                  disabled={feedback !== null}
                />
                <button
                  onClick={submitSpelling}
                  disabled={feedback !== null}
                  className="rounded-[24px] bg-orange-500 px-8 font-black text-white shadow-xl shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交
                </button>
              </div>
              {feedback === null && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSpelling(currentWord.word);
                      setFeedback('wrong');
                      persistAnswer(false);
                      enqueueRetryLater(currentWord);
                      clearResultTimer();
                      resultTimerRef.current = window.setTimeout(nextWord, 3000);
                    }}
                    className="rounded-2xl border border-[#d2d2d7]/60 bg-white px-5 py-2.5 text-[14px] font-bold text-[#86868b] shadow-sm transition-all hover:border-orange-300 hover:text-orange-600 active:scale-95"
                  >
                    显示答案
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
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
                    disabled={feedback !== null}
                    className={`flex w-full items-center gap-3 rounded-3xl border-2 px-5 py-4 text-left text-[16px] font-bold transition-all duration-300 active:scale-[0.98] shadow-md hover:shadow-xl disabled:cursor-default ${stateClass}`}
                  >
                    <span className="text-[14px] font-black text-[#d2d2d7]">{String.fromCharCode(65 + optionIndex)}</span>
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex justify-center">
            {feedback === 'wrong' && (
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-red-50 px-5 py-3 animate-in slide-in-from-top-2 duration-300">
                <div className="text-[15px] font-bold text-red-700">
                  正确答案：
                  <span className="font-black text-[17px]">
                    {mode === 'spelling' ? currentWord.word : getMainDefinition(currentWord)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-red-600"><XCircle size={18} className="inline" /> {mode === 'spelling' ? '未答对' : '看一下答案再继续'}</span>
                </div>
              </div>
            )}
            {feedback === 'wrong' && mode !== 'spelling' && (
              <div className="mt-3 flex justify-center">
                <span className="text-[13px] font-bold text-[#86868b]">将自动进入下一题</span>
              </div>
            )}
            {feedback === 'correct' && (
              <div className="flex items-center gap-3 rounded-2xl bg-green-50 px-5 py-3 font-black text-green-700 animate-in slide-in-from-top-2 duration-300">
                <CheckCircle2 size={18} /> 完全正确
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
