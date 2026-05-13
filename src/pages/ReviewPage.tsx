import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Headphones, Keyboard, Languages, RefreshCcw, Volume2, XCircle } from 'lucide-react';
import type { Word } from '../data/types';
import { words as fallbackWords } from '../data/words';
import { wordLists } from '../data/wordLists';
import { calculateNextReview, getProgress, saveProgress } from '../utils/storage';
import { isWordPending } from '../utils/studyFlow';
import { loadWordLists } from '../utils/wordListService';
import { speakText } from '../utils/settings';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';

type ReviewMode = 'mixed' | 'enToZh' | 'zhToEn' | 'typing' | 'audio';
type Stage = 'select' | 'practice';
type ReviewSessionItem = {
  wordId: string;
  mode: Exclude<ReviewMode, 'mixed'>;
};

const modeCards: Array<{ id: ReviewMode; title: string; desc: string; icon: typeof RefreshCcw }> = [
  { id: 'mixed', title: '综合复习', desc: '多种模式随机切换', icon: RefreshCcw },
  { id: 'enToZh', title: '英译汉', desc: '根据单词选正确释义', icon: Languages },
  { id: 'zhToEn', title: '汉译英', desc: '根据释义选正确单词', icon: Languages },
  { id: 'typing', title: '单词拼写', desc: '通过输入巩固记忆', icon: Keyboard },
  { id: 'audio', title: '听力辨析', desc: '通过发音识别单词', icon: Headphones },
];

function today() {
  return new Date().toISOString().split('T')[0];
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function mainZh(word: Word) {
  return word.definitions[0]?.zh || '暂无释义';
}

function uniqueStrings(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function uniqueWords(words: Word[]) {
  const seen = new Set<string>();
  return words.filter((word) => {
    if (seen.has(word.id)) return false;
    seen.add(word.id);
    return true;
  });
}

function getReviewListIds(progress: ReturnType<typeof getProgress>) {
  const knownIds = wordLists.map((list) => list.id).sort((a, b) => b.length - a.length);
  const ids = new Set<string>([progress.currentListId]);

  Object.keys(progress.records).forEach((wordId) => {
    const matched = knownIds.find((listId) => wordId.startsWith(`${listId}-`));
    if (matched) ids.add(matched);
  });

  return Array.from(ids).filter(Boolean);
}

function pickActualMode(mode: ReviewMode): Exclude<ReviewMode, 'mixed'> {
  if (mode !== 'mixed') return mode;
  return shuffle<Exclude<ReviewMode, 'mixed'>>(['enToZh', 'zhToEn', 'typing', 'audio'])[0];
}

export default function ReviewPage() {
  const [initialProgress] = useState(() => getProgress());
  const [progress, setProgress] = useState(initialProgress);
  const [wordPool, setWordPool] = useState<Word[]>(fallbackWords.slice(0, 20));
  const [sessionQueue, setSessionQueue] = useState<ReviewSessionItem[]>([]);
  const [stage, setStage] = useState<Stage>('select');
  const [mode, setMode] = useState<ReviewMode>('mixed');
  const [actualMode, setActualMode] = useState<Exclude<ReviewMode, 'mixed'>>('enToZh');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const resultTimerRef = useRef<number | null>(null);

  useStopMediaOnUnmount();

  function clearResultTimer() {
    if (resultTimerRef.current !== null) {
      window.clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
  }

  function resetQuestionState() {
    clearResultTimer();
    setSelected(null);
    setTyped('');
    setFeedback(null);
  }

  useEffect(() => {
    return () => clearResultTimer();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadReviewPool() {
      try {
        const loadedLists = await loadWordLists(getReviewListIds(initialProgress));
        if (cancelled) return;

        const learnedWords = uniqueWords([...Object.values(loadedLists).flat(), ...fallbackWords]).filter((word) => {
          const record = initialProgress.records[word.id];
          return Boolean(record) && record.correctCount > 0 && !record.mastered;
        });
        const dueWords = learnedWords.filter((word) => isWordPending(word, initialProgress));

        setWordPool((dueWords.length ? dueWords : learnedWords.length ? learnedWords : fallbackWords).slice(0, 20));
      } catch {
        if (cancelled) return;
        const learnedWords = fallbackWords.filter((word) => {
          const record = initialProgress.records[word.id];
          return Boolean(record) && record.correctCount > 0 && !record.mastered;
        });
        const dueWords = learnedWords.filter((word) => isWordPending(word, initialProgress));
        setWordPool((dueWords.length ? dueWords : learnedWords.length ? learnedWords : fallbackWords).slice(0, 20));
      }
    }

    void loadReviewPool();

    return () => {
      cancelled = true;
    };
  }, [initialProgress]);

  const currentItem = sessionQueue[index] ?? sessionQueue[0];
  const currentWord = useMemo(() => {
    if (!currentItem) return wordPool[0] ?? fallbackWords[0];
    return (
      wordPool.find((word) => word.id === currentItem.wordId) ??
      fallbackWords.find((word) => word.id === currentItem.wordId) ??
      wordPool[0] ??
      fallbackWords[0]
    );
  }, [currentItem, wordPool]);
  const distractorPool = useMemo(() => uniqueWords([...wordPool, ...fallbackWords]), [wordPool]);
  const options = useMemo(() => {
    const wrongCandidates = distractorPool.filter((item) => item.id !== currentWord.id);
    const wrongChoices = shuffle(wrongCandidates)
      .filter((item) => mainZh(item) !== mainZh(currentWord))
      .slice(0, 3);

    const primaryOptions =
      actualMode === 'enToZh'
        ? [mainZh(currentWord), ...wrongChoices.map(mainZh)]
        : [currentWord.word, ...wrongChoices.map((word) => word.word)];

    const backupOptions =
      actualMode === 'enToZh'
        ? distractorPool.filter((item) => item.id !== currentWord.id).map(mainZh)
        : distractorPool.filter((item) => item.id !== currentWord.id).map((item) => item.word);

    return shuffle(uniqueStrings([...primaryOptions, ...backupOptions]).slice(0, 4));
  }, [actualMode, currentWord, distractorPool]);

  function startMode(nextMode: ReviewMode) {
    resetQuestionState();
    const queue = shuffle([...wordPool]).map<ReviewSessionItem>((word) => ({
      wordId: word.id,
      mode: nextMode === 'mixed' ? pickActualMode(nextMode) : nextMode,
    }));
    setMode(nextMode);
    setSessionQueue(queue);
    setIndex(0);
    setActualMode(queue[0]?.mode ?? pickActualMode(nextMode));
    setStage('practice');
    if (queue[0]?.mode === 'audio') setTimeout(() => speakText(wordPool[0]?.word ?? ''), 120);
  }

  function persist(correct: boolean) {
    const next = { ...progress };
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
    saveProgress(next);
    setProgress(next);
  }

  function enqueueRetryLater(item: ReviewSessionItem) {
    setSessionQueue((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      const insertAt = Math.min(index + 3, next.length);
      next.splice(insertAt, 0, item);
      return next;
    });
  }

  function answer(option: string) {
    if (feedback) return;
    clearResultTimer();
    setSelected(option);
    const correctAnswer = actualMode === 'enToZh' ? mainZh(currentWord) : currentWord.word;
    const correct = option === correctAnswer;
    setFeedback(correct ? 'correct' : 'wrong');
    persist(correct);
    if (!correct && currentItem) {
      enqueueRetryLater(currentItem);
    }
    resultTimerRef.current = window.setTimeout(nextQuestion, correct ? 450 : 3000);
  }

  function submitTyped() {
    if (feedback || !typed.trim()) return;
    clearResultTimer();
    const correct = typed.trim().toLowerCase() === currentWord.word.toLowerCase();
    setFeedback(correct ? 'correct' : 'wrong');
    persist(correct);
    if (!correct && currentItem) {
      enqueueRetryLater(currentItem);
    }
    resultTimerRef.current = window.setTimeout(nextQuestion, correct ? 450 : 3000);
  }

  function nextQuestion() {
    clearResultTimer();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const nextIndex = (index + 1) % Math.max(sessionQueue.length, 1);
    setIndex(nextIndex);
    const nextItem = sessionQueue[nextIndex];
    if (nextItem) {
      setActualMode(nextItem.mode);
    }
    setSelected(null);
    setTyped('');
    setFeedback(null);
  }

  if (stage === 'select') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 animate-in fade-in duration-700">
        <div className="mb-14 flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div>
            <Link to="/vocabulary" className="mb-8 inline-flex items-center gap-2 rounded-2xl border border-[#d2d2d7]/50 bg-white px-5 py-3 text-[15px] font-bold text-[#86868b] shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:text-orange-600 active:scale-95">
              <ArrowLeft size={18} /> 返回背单词
            </Link>
            <h1 className="flex items-center gap-4 text-[48px] font-black text-[#1d1d1f] tracking-tight leading-tight">
              <RefreshCcw className="text-orange-500 animate-spin" style={{ animationDuration: '3s' }} size={48} /> 
              复习中心
            </h1>
            <p className="mt-4 text-[19px] font-medium text-[#86868b]">巩固已学知识，让记忆更持久。</p>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {modeCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <button 
                key={card.id} 
                onClick={() => startMode(card.id)} 
                className="group apple-card p-10 text-left reveal-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <Icon size={32} />
                </div>
                <h2 className="text-[24px] font-black text-[#1d1d1f] tracking-tight group-hover:text-orange-600 transition-colors">{card.title}</h2>
                <p className="mt-3 text-[16px] font-medium leading-relaxed text-[#86868b]">{card.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const showWord = actualMode === 'enToZh';
  const promptText = actualMode === 'enToZh'
    ? '选择正确的中文释义'
    : actualMode === 'zhToEn'
      ? mainZh(currentWord)
      : actualMode === 'typing'
        ? mainZh(currentWord)
        : '通过听力选择单词';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 animate-in fade-in duration-500">
      <div className="mb-10 flex items-center justify-between">
        <button 
          onClick={() => {
            resetQuestionState();
            setStage('select');
          }} 
          className="inline-flex items-center gap-2 rounded-2xl border border-[#d2d2d7]/50 bg-white px-5 py-3 text-[15px] font-bold text-[#1d1d1f] shadow-sm hover:bg-[#f5f5f7] transition-all active:scale-95"
        >
          <ArrowLeft size={18} /> 返回中心
        </button>
        <div className="px-4 py-1.5 rounded-full bg-orange-50 text-[13px] font-black text-orange-600 uppercase tracking-widest border border-orange-100">
          {modeCards.find((item) => item.id === mode)?.title}
        </div>
      </div>

      <section className={`overflow-hidden rounded-[40px] bg-white shadow-2xl shadow-black/5 transition-all duration-500 ${feedback === 'wrong' ? 'animate-apple-shake' : feedback === 'correct' ? 'animate-apple-pop' : ''}`}>
        <div className="bg-orange-50/50 px-8 py-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
            <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[120%] bg-orange-100 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-50%] right-[-10%] w-[60%] h-[120%] bg-yellow-50 blur-[100px] rounded-full" />
          </div>

          <div className="relative z-10">
            {showWord ? (
              <>
                <div className="flex items-center justify-center gap-6 mb-4">
                  <h1 className="text-7xl font-black text-[#1d1d1f] tracking-tighter">{currentWord.word}</h1>
                  <button
                    type="button"
                    onClick={() => speakText(currentWord.word)}
                    aria-label={`朗读 ${currentWord.word}`}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-orange-600 shadow-xl shadow-orange-500/10 transition-all hover:scale-110 active:scale-90"
                  >
                    <Volume2 size={28} />
                  </button>
                </div>
                <p className="text-2xl font-bold text-[#86868b] tracking-tight italic opacity-60">{currentWord.phonetic}</p>
              </>
            ) : actualMode === 'audio' ? (
              <button 
                onClick={() => speakText(currentWord.word)} 
                className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-orange-500 text-white shadow-2xl shadow-orange-500/30 transition-all hover:scale-110 active:scale-90"
              >
                <Headphones size={48} />
              </button>
            ) : (
              <div className="text-[32px] font-black text-[#1d1d1f] tracking-tight">
                {actualMode === 'typing' ? '请根据释义拼写单词' : '请翻译为英文'}
              </div>
            )}
          </div>
        </div>

        <div className="p-10">
          <div className="mb-8 rounded-3xl bg-[#f5f5f7] px-8 py-6 text-center">
            <div className="text-[#86868b] text-[13px] font-black uppercase tracking-widest mb-2">当前提示</div>
            <div className="text-[22px] font-black text-[#1d1d1f]">{promptText}</div>
          </div>

          {actualMode === 'typing' ? (
            <div className="space-y-6">
              <div className="flex gap-4">
                <input 
                  autoFocus 
                  value={typed} 
                  onChange={(event) => setTyped(event.target.value)} 
                  onKeyDown={(event) => { if (event.key === 'Enter') submitTyped(); }} 
                  className="h-16 flex-1 rounded-[24px] border-2 border-[#f5f5f7] px-8 text-xl font-bold outline-none transition-all focus:border-orange-400 focus:bg-white shadow-sm" 
                  placeholder="输入单词拼写..." 
                  disabled={feedback !== null}
                />
                <button 
                  onClick={submitTyped} 
                  disabled={feedback !== null}
                  className="rounded-[24px] bg-orange-500 px-10 font-black text-white shadow-xl shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  提交
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {options.map((option, optionIndex) => {
                const correctAnswer = actualMode === 'enToZh' ? mainZh(currentWord) : currentWord.word;
                const isSelected = selected === option;
                const isCorrect = option === correctAnswer;
                const stateClass = isSelected && feedback === 'wrong'
                  ? 'border-red-500 bg-red-50 text-red-700 shadow-red-100'
                  : isSelected && feedback === 'correct'
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-green-100'
                    : feedback === 'wrong' && isCorrect
                      ? 'border-green-500 bg-green-50 text-green-700 shadow-green-100'
                      : 'border-[#f5f5f7] bg-white text-[#1d1d1f] hover:border-orange-300 hover:bg-orange-50 shadow-sm';
                
                return (
                  <button 
                    key={option} 
                    onClick={() => answer(option)} 
                    disabled={feedback !== null}
                    className={`flex w-full items-center gap-6 rounded-3xl border-2 px-8 py-6 text-left text-[19px] font-bold transition-all duration-300 active:scale-[0.98] shadow-md hover:shadow-xl disabled:cursor-default ${stateClass}`}
                  >
                    <span className="font-black text-[#d2d2d7] text-[16px]">{String.fromCharCode(65 + optionIndex)}</span>
                    {option}
                  </button>
                );
              })}
            </div>
          )}
          
          <div className="mt-8 flex justify-center">
            {feedback === 'wrong' && (
              <div className="flex flex-col gap-2 rounded-2xl bg-red-50 px-5 py-3 text-red-600 font-black animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2">
                  <XCircle size={18} />
                  加油，再看看答案
                </div>
                <div className="text-[15px] font-bold text-red-700">
                  正确答案：
                  <span className="font-black">{actualMode === 'enToZh' ? mainZh(currentWord) : currentWord.word}</span>
                </div>
              </div>
            )}
            {feedback === 'correct' && (
              <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-5 py-3 text-green-700 font-black animate-in slide-in-from-top-2 duration-300">
                <CheckCircle2 size={18} /> 太棒了，完全正确！
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}


