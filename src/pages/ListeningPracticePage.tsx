import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Eye,
  Mic,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Trophy,
  Volume2,
  PenLine,
} from 'lucide-react';
import { difficultyLabels, categoryLabels } from '../data/listeningData';
import { allListeningExercises } from '../data/listeningLibrary';
import { markListeningLearned } from '../utils/listeningProgress';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';
import { useStudyTimeTracker } from '../hooks/useStudyTimeTracker';
import {
  pauseSpeechPlayback,
  resumeSpeechPlayback,
  restartSpeechPlayback,
  speakPlayback,
  stopSpeechPlayback,
} from '../utils/speechPlayback';

type Mode = 'dictation' | 'read-along' | 'fill-blanks';
type Stage = 'chooser' | 'practice';

const MODE_META: Record<Mode, { label: string; desc: string; icon: typeof PenLine }> = {
  dictation: {
    label: '听写模式',
    desc: '先听句子，再写出你听到的内容。',
    icon: PenLine,
  },
  'read-along': {
    label: '跟读模式',
    desc: '看着句子，跟着语音练习朗读。',
    icon: Mic,
  },
  'fill-blanks': {
    label: '填空模式',
    desc: '听句子，补全缺失的关键词。',
    icon: BookOpen,
  },
};

function compareWords(correct: string, input: string) {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^\w\s']/g, '')
      .split(/\s+/)
      .filter(Boolean);

  const correctWords = normalize(correct);
  const inputWords = normalize(input);

  return correctWords.map((word, index) => ({
    word,
    status: inputWords[index] === word ? ('correct' as const) : ('wrong' as const),
    userWord: inputWords[index] || '',
  }));
}

function makeBlanks(sentence: string, keywords: string[]) {
  const lowerKeywords = keywords.map((keyword) => keyword.toLowerCase());
  const words = sentence.split(/\s+/);
  const blanks: { index: number; answer: string }[] = [];

  const parts = words.map((word, index) => {
    const cleaned = word.replace(/[^\w']/g, '').toLowerCase();
    if (lowerKeywords.includes(cleaned)) {
      blanks.push({ index, answer: cleaned });
      const pre = word.match(/^([^\w']*)/)?.[0] || '';
      const post = word.match(/([^\w']*)$/)?.[0] || '';
      return { display: `${pre}___${post}`, isBlank: true, index };
    }
    return { display: word, isBlank: false, index };
  });

  return { parts, blanks };
}

export default function ListeningPracticePage() {
  const { id } = useParams<{ id: string }>();
  const exercise = allListeningExercises.find((item) => item.id === id);

  const [stage, setStage] = useState<Stage>('chooser');
  const [mode, setMode] = useState<Mode>('dictation');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.9);
  const [dictInput, setDictInput] = useState('');
  const [dictResult, setDictResult] = useState<
    { word: string; status: 'correct' | 'wrong'; userWord: string }[] | null
  >(null);
  const [dictScore, setDictScore] = useState(0);
  const [dictTotal, setDictTotal] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [blankInputs, setBlankInputs] = useState<Record<number, string>>({});
  const [blankResult, setBlankResult] = useState<Record<number, boolean> | null>(null);
  const [fillScore, setFillScore] = useState(0);
  const [fillTotal, setFillTotal] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isEnteringPractice, setIsEnteringPractice] = useState(false);
  const playbackActionAtRef = useRef(0);

  useStopMediaOnUnmount();
  useStudyTimeTracker(stage === 'practice');

  const sentences = exercise?.sentences || [];
  const current = sentences[currentIndex];

  const blanksData = useMemo(() => {
    if (!current) return { parts: [], blanks: [] };
    return makeBlanks(current.en, current.keywords);
  }, [current]);

  const resetSentenceState = useCallback(() => {
    stopSpeechPlayback();
    setDictInput('');
    setDictResult(null);
    setShowTranslation(false);
    setBlankInputs({});
    setBlankResult(null);
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const startPractice = useCallback(
    (nextMode: Mode) => {
      setIsExiting(true);
      window.setTimeout(() => {
        setMode(nextMode);
        setIsExiting(false);
        setIsEnteringPractice(true);
        setStage('practice');
        setCurrentIndex(0);
        setIsFinished(false);
        setDictScore(0);
        setDictTotal(0);
        setFillScore(0);
        setFillTotal(0);
        resetSentenceState();
        window.setTimeout(() => setIsEnteringPractice(false), 240);
      }, 160);
    },
    [resetSentenceState],
  );

  const backToChooser = useCallback(() => {
    setStage('chooser');
    resetSentenceState();
  }, [resetSentenceState]);

  const handleNext = useCallback(() => {
    stopSpeechPlayback();
    setIsTransitioning(true);
    window.setTimeout(() => {
      if (currentIndex < sentences.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        resetSentenceState();
      } else if (exercise) {
        markListeningLearned(exercise.id);
        setIsFinished(true);
      }
      window.setTimeout(() => setIsTransitioning(false), 80);
    }, 180);
  }, [currentIndex, exercise, resetSentenceState, sentences.length]);

  useEffect(() => {
    setStage('chooser');
    setMode('dictation');
    setCurrentIndex(0);
    setIsFinished(false);
    setDictScore(0);
    setDictTotal(0);
    setFillScore(0);
    setFillTotal(0);
    resetSentenceState();
  }, [exercise?.id, resetSentenceState]);

  const handlePlay = useCallback(() => {
    if (!current) return;
    const now = Date.now();
    if (now - playbackActionAtRef.current < 180) return;
    playbackActionAtRef.current = now;

    if (isPlaying && !isPaused) {
      const paused = pauseSpeechPlayback();
      if (paused) {
        setIsPaused(true);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
      }
      return;
    }

    if (isPlaying && isPaused) {
      const resumed = resumeSpeechPlayback();
      if (resumed) {
        setIsPaused(false);
        return;
      }

      stopSpeechPlayback();
      speakPlayback(current.en, {
        rate: playbackRate,
        lang: 'en-US',
        onEnd: () => {
          setIsPlaying(false);
          setIsPaused(false);
        },
      });
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    setIsPlaying(true);
    setIsPaused(false);
    speakPlayback(current.en, {
      rate: playbackRate,
      lang: 'en-US',
      onEnd: () => {
        setIsPlaying(false);
        setIsPaused(false);
      },
    });
  }, [current, isPaused, isPlaying, playbackRate]);

  const applyPlaybackRate = useCallback(
    (nextRate: number) => {
      const now = Date.now();
      if (now - playbackActionAtRef.current < 180) return;
      playbackActionAtRef.current = now;

      setPlaybackRate(nextRate);
      if (!isPlaying && !isPaused) return;

      const restarted = restartSpeechPlayback({ rate: nextRate });
      if (restarted) {
        setIsPlaying(true);
        setIsPaused(false);
      }
    },
    [isPaused, isPlaying],
  );

  const handleRestart = useCallback(() => {
    stopSpeechPlayback();
    setCurrentIndex(0);
    setIsFinished(false);
    setDictScore(0);
    setDictTotal(0);
    setFillScore(0);
    setFillTotal(0);
    resetSentenceState();
  }, [resetSentenceState]);

  const handleDictCheck = useCallback(() => {
    if (!current || !dictInput.trim()) return;
    const result = compareWords(current.en, dictInput);
    setDictResult(result);
    const correct = result.filter((item) => item.status === 'correct').length;
    setDictScore((prev) => prev + correct);
    setDictTotal((prev) => prev + result.length);
  }, [current, dictInput]);

  const handleFillCheck = useCallback(() => {
    if (!current) return;
    const results: Record<number, boolean> = {};
    let correct = 0;

    blanksData.blanks.forEach((blank) => {
      const userVal = (blankInputs[blank.index] || '').trim().toLowerCase();
      const isCorrect = userVal === blank.answer;
      results[blank.index] = isCorrect;
      if (isCorrect) correct += 1;
    });

    setBlankResult(results);
    setFillScore((prev) => prev + correct);
    setFillTotal((prev) => prev + blanksData.blanks.length);
  }, [blankInputs, blanksData.blanks, current]);

  if (!exercise) {
    return (
      <div className="listening-practice-page mx-auto max-w-3xl px-4 py-24 text-center animate-in fade-in duration-700">
        <p className="mb-6 text-[18px] font-medium text-black dark:text-[#a1a1a6]">
          没有找到这个练习内容
        </p>
        <Link
          to="/listening"
          className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f7] px-5 py-2.5 font-bold text-[#1d1d1f] no-underline transition-all hover:bg-[#e8e8ed]"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Link>
      </div>
    );
  }

  if (isFinished) {
    const totalScore =
      mode === 'dictation' ? dictScore : mode === 'fill-blanks' ? fillScore : sentences.length;
    const totalPossible =
      mode === 'dictation' ? dictTotal : mode === 'fill-blanks' ? fillTotal : sentences.length;
    const accuracy = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 100;

    return (
      <div className="listening-practice-page mx-auto max-w-3xl px-4 py-16 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#34c759] shadow-xl">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <h2 className="mb-2 text-[30px] font-bold tracking-tight text-[#1d1d1f]">练习完成</h2>
        <p className="mb-8 text-[17px] text-black dark:text-[#a1a1a6]">{exercise.title}</p>

        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-[22px] border border-[#d2d2d7]/30 bg-white p-4 shadow-sm">
            <p className="text-[24px] font-black text-[#0071e3]">{sentences.length}</p>
            <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-black dark:text-[#a1a1a6]">
              总句数
            </p>
          </div>
          <div className="rounded-[22px] border border-[#d2d2d7]/30 bg-white p-4 shadow-sm">
            <p className="text-[24px] font-black text-[#34c759]">{accuracy}%</p>
            <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-black dark:text-[#a1a1a6]">
              正确率
            </p>
          </div>
          <div className="rounded-[22px] border border-[#d2d2d7]/30 bg-white p-4 shadow-sm">
            <p className="text-[24px] font-black text-[#af52de]">
              {mode === 'dictation' ? '听写' : mode === 'read-along' ? '跟读' : '填空'}
            </p>
            <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-black dark:text-[#a1a1a6]">
              模式
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleRestart}
            className="inline-flex items-center justify-center gap-3 rounded-[22px] bg-[#0071e3] px-5 py-4 text-[16px] font-black text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95"
          >
            <RefreshCw className="h-5 w-5" />
            再练一轮
          </button>
          <Link
            to="/listening"
            className="inline-flex items-center justify-center rounded-[22px] bg-[#f5f5f7] px-5 py-4 text-[16px] font-bold text-[#1d1d1f] no-underline transition-all active:scale-95"
          >
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / sentences.length) * 100;
  const speedOptions = [0.75, 0.9, 1, 1.1, 1.25];

  return (
    <div className="listening-practice-page mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link
          to="/listening"
          className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7]/30 bg-white px-4 py-2 text-[14px] font-bold text-[#1d1d1f] no-underline shadow-sm transition-all hover:bg-[#f5f5f7] hover:shadow-md active:scale-95 dark:text-[#1d1d1f]"
        >
          <ArrowLeft className="h-4 w-4 text-[#0071e3]" />
          返回列表
        </Link>
        <div className="rounded-full border border-[#d2d2d7]/20 bg-[#f5f5f7] px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest text-black dark:text-[#a1a1a6]">
          {categoryLabels[exercise.category]} · {difficultyLabels[exercise.difficulty]}
        </div>
      </div>

      <div className="mb-5">
        <h1 className="mb-2 text-[26px] font-bold leading-tight tracking-tight text-[#1d1d1f] md:text-[30px]">
          {exercise.title}
        </h1>
        <p className="mb-4 text-[16px] font-medium leading-relaxed text-black dark:text-[#a1a1a6] md:text-[18px]">
          {exercise.titleZh}
        </p>

        <div className="space-y-3">
          <div className="flex justify-between text-[12px] font-bold uppercase tracking-wider text-black dark:text-[#a1a1a6]">
            <span>
              第 {currentIndex + 1} / {sentences.length} 句
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#d2d2d7]/30">
            <div
              className="h-full rounded-full bg-[#0071e3] transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {stage === 'chooser' ? (
        <div
          className={`animate-in fade-in zoom-in-95 duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isExiting ? 'apple-mode-exit' : ''
          }`}
        >
          <p className="mb-6 text-[17px] font-bold tracking-tight text-[#1d1d1f]">请选择练习模式</p>
          <div className="grid gap-5 sm:grid-cols-3">
            {(Object.keys(MODE_META) as Mode[]).map((key) => {
              const meta = MODE_META[key];
              const Icon = meta.icon;

              return (
                <button
                  key={key}
                  onClick={() => startPractice(key)}
                  className="group relative flex flex-col rounded-[32px] border border-[#d2d2d7]/30 bg-white p-8 text-left transition-all duration-500 hover:translate-y-[-4px] hover:shadow-2xl active:scale-[0.95]"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#0071e3]/5 text-[#0071e3] transition-colors group-hover:bg-[#0071e3] group-hover:text-white">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-2 text-[20px] font-black tracking-tight text-[#1d1d1f]">{meta.label}</h3>
                  <p className="text-[15px] font-medium leading-relaxed text-black dark:text-[#a1a1a6]">
                    {meta.desc}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-[13px] font-black uppercase tracking-wider text-[#0071e3] opacity-0 transition-opacity group-hover:opacity-100">
                    进入模式
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className={`transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isExiting
              ? 'animate-apple-slide-down'
              : isEnteringPractice
                ? 'apple-mode-enter'
                : isTransitioning
                  ? 'opacity-0 translate-y-8 scale-[0.98]'
                  : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              onClick={backToChooser}
              className="group inline-flex items-center gap-2 rounded-full border border-[#d2d2d7]/30 bg-white px-5 py-2 text-[15px] font-bold text-[#1d1d1f] shadow-sm transition-all hover:bg-[#f5f5f7] active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-[-2px]" />
              返回模式选择
            </button>
            <div className="rounded-full bg-[#1d1d1f] px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest text-white shadow-lg shadow-black/10">
              {MODE_META[mode].label}
            </div>
          </div>

          <div className="mb-8 overflow-hidden rounded-[32px] border border-[#d2d2d7]/30 bg-white shadow-[0_28px_60px_rgba(0,0,0,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f5f5f7] px-5 py-3 md:px-6">
              <button
                onClick={handlePlay}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold transition-all active:scale-95 ${
                  isPlaying && !isPaused
                    ? 'bg-[#0071e3] text-white shadow-lg shadow-blue-500/20'
                    : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                }`}
              >
                {isPlaying && !isPaused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying && !isPaused ? '暂停' : isPlaying && isPaused ? '继续' : '播放'}
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#86868b]">语速</span>
                {speedOptions.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => applyPlaybackRate(speed)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-black transition-all ${
                      playbackRate === speed
                        ? 'bg-[#1d1d1f] text-white shadow-sm'
                        : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    stopSpeechPlayback();
                    setIsPlaying(false);
                    setIsPaused(false);
                  }}
                  className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#86868b] transition-colors hover:bg-[#f5f5f7]"
                >
                  停止
                </button>
              </div>
            </div>

            {mode === 'dictation' && (
              <div className="p-8 md:p-10">
                <div className="mb-8 text-center">
                  <button
                    onClick={handlePlay}
                    className={`mx-auto flex h-20 w-24 items-center justify-center rounded-[24px] transition-all duration-500 active:scale-90 ${
                      isPlaying && !isPaused
                        ? 'scale-105 bg-[#0071e3]/10 text-[#0071e3]'
                        : 'bg-[#0071e3] text-white shadow-blue-500/20 hover:scale-105 hover:shadow-2xl'
                    }`}
                  >
                    {isPlaying && !isPaused ? <Volume2 className="h-10 w-10" /> : <Play className="ml-1 h-10 w-10" />}
                  </button>
                  <p className="mt-5 text-[16px] font-bold tracking-tight text-black dark:text-[#a1a1a6]">
                    {isPlaying && !isPaused
                      ? '正在朗读...'
                      : isPlaying && isPaused
                        ? '已暂停'
                        : '点击播放中心按钮听原声'}
                  </p>
                </div>

                <textarea
                  value={dictInput}
                  onChange={(event) => setDictInput(event.target.value)}
                  placeholder="在这里输入你听到的句子..."
                  rows={2}
                  disabled={dictResult !== null}
                  className="w-full resize-none rounded-[28px] border-transparent bg-[#f5f5f7] p-6 text-[20px] font-bold text-[#1d1d1f] shadow-inner transition-all placeholder:text-[#86868b]/30 focus:border-[#0071e3] focus:bg-white focus:ring-[10px] focus:ring-[#0071e3]/5 disabled:opacity-80"
                />

                {dictResult && (
                  <div className="mt-6 rounded-[28px] bg-[#f5f5f7] p-6 animate-in fade-in slide-in-from-top-6 duration-700">
                    <p className="mb-4 text-[12px] font-bold uppercase tracking-widest text-black opacity-60 dark:text-[#a1a1a6]">
                      对比分析
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-4 leading-relaxed">
                      {dictResult.map((item, index) => (
                        <span
                          key={index}
                          className={`inline-block rounded-xl px-3 py-1 text-[18px] font-black ${
                            item.status === 'correct'
                              ? 'bg-[#34c759]/10 text-[#34c759]'
                              : 'bg-[#ff3b30]/10 text-[#ff3b30] decoration-[4px]'
                          }`}
                        >
                          {item.word}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 border-t border-[#d2d2d7]/40 pt-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-black opacity-60 dark:text-[#a1a1a6]">
                            你的输入
                          </span>
                          <p className="text-[17px] font-bold italic text-[#1d1d1f] opacity-50">
                            {dictResult.map((item, index) => (
                              <span
                                key={index}
                                className={`inline-block mr-2 ${item.status === 'wrong' ? 'font-black text-[#ff3b30] opacity-100' : ''}`}
                              >
                                {item.userWord || '___'}
                              </span>
                            ))}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-black opacity-60 dark:text-[#a1a1a6]">
                            中文释义
                          </span>
                          <p className="text-[18px] font-bold leading-relaxed text-[#1d1d1f]">{current.zh}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <button
                    onClick={handlePlay}
                    className="inline-flex items-center gap-2 rounded-[22px] bg-[#f5f5f7] px-6 py-4 text-[16px] font-bold text-[#1d1d1f] transition-all hover:bg-[#e8e8ed] active:scale-95"
                  >
                    <RotateCcw className="h-5 w-5" />
                    再听一遍
                  </button>
                  {dictResult === null ? (
                    <button
                      onClick={handleDictCheck}
                      disabled={!dictInput.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-3 rounded-[22px] bg-[#0071e3] px-6 py-4 text-[17px] font-black text-white shadow-xl shadow-blue-500/20 transition-all disabled:opacity-30 active:scale-97"
                    >
                      <Check className="h-5 w-5" />
                      核对答案
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex-1 inline-flex items-center justify-center gap-3 rounded-[22px] bg-[#1d1d1f] px-6 py-4 text-[17px] font-black text-white shadow-2xl transition-all hover:bg-black active:scale-97"
                    >
                      {currentIndex < sentences.length - 1 ? '下一句' : '完成练习'}
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {mode === 'read-along' && (
              <div className="p-8 text-center md:p-10">
                <p className="mb-6 text-[30px] font-black leading-tight tracking-tight text-[#1d1d1f] md:text-[38px]">
                  {current.en}
                </p>

                {showTranslation ? (
                  <div className="mb-6 rounded-[24px] bg-[#f5f5f7] p-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <p className="text-[18px] font-bold italic leading-relaxed text-black dark:text-[#a1a1a6]">
                      {current.zh}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTranslation(true)}
                    className="mx-auto mb-6 flex items-center gap-2 text-[16px] font-black text-[#0071e3] transition-transform hover:underline active:scale-95"
                  >
                    <Eye className="h-5 w-5" />
                    查看中文翻译
                  </button>
                )}

                <div className="mb-6 flex flex-wrap justify-center gap-3">
                  {current.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-[#0071e3]/10 bg-[#0071e3]/5 px-4 py-1.5 text-[13px] font-black uppercase tracking-wider text-[#0071e3] shadow-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    onClick={handlePlay}
                    className={`inline-flex items-center justify-center gap-3 rounded-[24px] px-8 py-4 text-[18px] font-black transition-all active:scale-95 ${
                      isPlaying
                        ? 'bg-[#0071e3]/10 text-[#0071e3] scale-105'
                        : 'bg-[#0071e3] text-white shadow-2xl shadow-blue-500/30 hover:scale-105'
                    }`}
                  >
                    {isPlaying ? <Volume2 className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                    {isPlaying && !isPaused ? '正在跟读' : isPlaying && isPaused ? '继续跟读' : '开始跟读练习'}
                  </button>
                  <button
                    onClick={handlePlay}
                    className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-[#f5f5f7] px-6 py-4 text-[16px] font-bold text-[#1d1d1f] transition-all hover:bg-[#e8e8ed] active:scale-95"
                  >
                    <RotateCcw className="h-5 w-5" />
                    重新播放
                  </button>
                </div>

                <div className="mt-8 border-t border-[#f5f5f7] pt-6">
                  <button
                    onClick={handleNext}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-[22px] bg-[#1d1d1f] px-10 py-4 text-[17px] font-black text-white shadow-xl shadow-black/10 transition-all hover:bg-black active:scale-95 sm:w-auto"
                  >
                    {currentIndex < sentences.length - 1 ? '下一句' : '结束本轮'}
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              </div>
            )}

            {mode === 'fill-blanks' && (
              <div className="p-8 md:p-10">
                <div className="mb-8 text-center">
                  <button
                    onClick={handlePlay}
                    className={`mx-auto flex h-20 w-24 items-center justify-center rounded-[24px] transition-all duration-500 active:scale-90 ${
                      isPlaying
                        ? 'scale-105 bg-[#0071e3]/10 text-[#0071e3]'
                        : 'bg-[#0071e3] text-white shadow-blue-500/20 hover:scale-105 hover:shadow-2xl'
                    }`}
                  >
                    {isPlaying ? <Volume2 className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
                  </button>
                  <p className="mt-5 text-[16px] font-bold tracking-tight text-black dark:text-[#a1a1a6]">
                    {isPlaying ? '正在朗读...' : '点击播放中心按钮听关键词'}
                  </p>
                </div>

                <div className="mb-6 rounded-[28px] bg-[#f5f5f7] p-6 shadow-inner">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-6 text-[22px] font-black leading-relaxed tracking-tight text-[#1d1d1f] md:text-[28px]">
                    {blanksData.parts.map((part, index) => {
                      if (!part.isBlank) {
                        return <span key={index}>{part.display}</span>;
                      }

                      const checked = blankResult !== null;
                      const isCorrect = blankResult?.[part.index];
                      const blank = blanksData.blanks.find((item) => item.index === part.index);

                      return (
                        <span key={index} className="relative inline-flex flex-col items-center gap-2">
                          <input
                            type="text"
                            value={blankInputs[part.index] || ''}
                            onChange={(event) =>
                              setBlankInputs((prev) => ({
                                ...prev,
                                [part.index]: event.target.value,
                              }))
                            }
                            disabled={checked}
                            className={`w-32 border-b-[4px] bg-transparent px-2 py-1 text-center text-[24px] font-black transition-all focus:outline-none ${
                              checked
                                ? isCorrect
                                  ? 'border-[#34c759] text-[#34c759]'
                                  : 'border-[#ff3b30] text-[#ff3b30]'
                                : 'border-[#0071e3]/30 focus:border-[#0071e3]'
                            }`}
                            placeholder="____"
                          />
                          {checked && !isCorrect && blank && (
                            <span className="absolute -bottom-8 rounded-lg bg-[#34c759]/10 px-2 py-1 text-[12px] font-black uppercase tracking-widest text-[#34c759] animate-in fade-in slide-in-from-top-2">
                              {blank.answer}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {blankResult !== null && (
                  <div className="mb-6 rounded-[24px] border-l-[6px] border-[#0071e3]/20 bg-[#f5f5f7] p-6 animate-in fade-in duration-700">
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-black opacity-60 dark:text-[#a1a1a6]">
                      参考翻译
                    </span>
                    <p className="text-[18px] font-bold leading-relaxed text-[#1d1d1f]">{current.zh}</p>
                  </div>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <button
                    onClick={handlePlay}
                    className="inline-flex items-center gap-2 rounded-[22px] bg-[#f5f5f7] px-6 py-4 text-[16px] font-bold text-[#1d1d1f] transition-all hover:bg-[#e8e8ed] active:scale-95"
                  >
                    <RotateCcw className="h-5 w-5" />
                    再听一遍
                  </button>
                  {blankResult === null ? (
                    <button
                      onClick={handleFillCheck}
                      className="flex-1 inline-flex items-center justify-center gap-3 rounded-[22px] bg-[#0071e3] px-6 py-4 text-[17px] font-black text-white shadow-xl shadow-blue-500/20 transition-all active:scale-97"
                    >
                      <Check className="h-5 w-5" />
                      核对答案
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex-1 inline-flex items-center justify-center gap-3 rounded-[22px] bg-[#1d1d1f] px-6 py-4 text-[17px] font-black text-white shadow-2xl transition-all hover:bg-black active:scale-97"
                    >
                      {currentIndex < sentences.length - 1 ? '下一句' : '完成练习'}
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-8 text-[14px] font-black tracking-wider text-black dark:text-[#a1a1a6]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase">正确率</span>
              <span className="text-[18px] text-[#1d1d1f]">
                {Math.round(
                  ((mode === 'dictation' ? dictScore : mode === 'fill-blanks' ? fillScore : currentIndex + 1) /
                    Math.max(
                      mode === 'dictation' ? dictTotal : mode === 'fill-blanks' ? fillTotal : currentIndex + 1,
                      1,
                    )) *
                    100,
                )}
                %
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase">进度</span>
              <span className="text-[18px] text-[#1d1d1f]">
                {currentIndex + 1} / {sentences.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
