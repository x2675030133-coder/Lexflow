import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Eye,
  Mic,
  PenLine,
  Play,
  Radio,
  RotateCcw,
  Trophy,
  Volume2,
} from 'lucide-react';
import { buildPodcastPracticeSentences } from '../utils/podcastPractice';
import type { PodcastEpisode } from '../services/podcastService';
import { loadPodcastLibrary } from '../services/podcastLibraryApi';
import { markPodcastLearned } from '../utils/podcastProgress';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';
import { useStudyTimeTracker } from '../hooks/useStudyTimeTracker';

type Mode = 'dictation' | 'read-along' | 'fill-blanks';
type Stage = 'chooser' | 'practice';

const MODE_META: Record<Mode, { label: string; desc: string; icon: typeof PenLine; color: string }> = {
  dictation: {
    label: '听写模式',
    desc: '先听整句，再写出你听到的内容，训练捕捉细节和拼写能力。',
    icon: PenLine,
    color: '#0071e3',
  },
  'read-along': {
    label: '跟读模式',
    desc: '看着句子，跟着语音朗读练习，适合纠正节奏和语感。',
    icon: Mic,
    color: '#34c759',
  },
  'fill-blanks': {
    label: '填空模式',
    desc: '听句子，补全缺失的关键词，强化高频表达和核心词记忆。',
    icon: BookOpen,
    color: '#af52de',
  },
};

function speak(text: string, onEnd?: () => void) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.82;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

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

export default function PodcastPracticePage() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>('chooser');
  const [mode, setMode] = useState<Mode>('dictation');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [episode, setEpisode] = useState<PodcastEpisode | null>(null);
  const [loadingEpisode, setLoadingEpisode] = useState(true);

  const [dictInput, setDictInput] = useState('');
  const [dictResult, setDictResult] = useState<
    { word: string; status: 'correct' | 'wrong'; userWord: string }[] | null
  >(null);
  const [dictScore, setDictScore] = useState(0);
  const [dictTotal, setDictTotal] = useState(0);
  const [showNote, setShowNote] = useState(false);

  const [blankInputs, setBlankInputs] = useState<Record<number, string>>({});
  const [blankResult, setBlankResult] = useState<Record<number, boolean> | null>(null);
  const [fillScore, setFillScore] = useState(0);
  const [fillTotal, setFillTotal] = useState(0);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isEnteringPractice, setIsEnteringPractice] = useState(false);

  useStopMediaOnUnmount();
  useStudyTimeTracker(stage === 'practice');

  useEffect(() => {
    if (!episodeId) return;

    const load = async () => {
      const direct = sessionStorage.getItem(`podcast-episode:${episodeId}`);
      if (direct) {
        try {
          setEpisode(JSON.parse(direct) as PodcastEpisode);
          setLoadingEpisode(false);
          return;
        } catch {}
      }

      const listRaw = sessionStorage.getItem('podcast-episode-cache');
      if (listRaw) {
        try {
          const list = JSON.parse(listRaw) as PodcastEpisode[];
          setEpisode(list.find((item) => item.id === episodeId) || null);
          setLoadingEpisode(false);
          return;
        } catch {
          // fall through to backend fetch
        }
      }

      try {
        const data = await loadPodcastLibrary();
        const list = data.episodes || [];
        if (list.length) {
          sessionStorage.setItem('podcast-episode-cache', JSON.stringify(list));
          setEpisode(list.find((item) => item.id === episodeId) || null);
        } else {
          setEpisode(null);
        }
      } catch {
        setEpisode(null);
      }

      setLoadingEpisode(false);
    };

    void load();
  }, [episodeId]);

  const sentences = useMemo(() => (episode ? buildPodcastPracticeSentences(episode, 5) : []), [episode]);
  const isPracticeReady = episode?.transcriptStatus === 'ready' && sentences.length > 0;
  const current = sentences[currentIndex];
  const blanksData = useMemo(() => {
    if (!current) return { parts: [], blanks: [] };
    return makeBlanks(current.en, current.keywords);
  }, [current]);

  const resetSentenceState = useCallback(() => {
    setDictInput('');
    setDictResult(null);
    setShowNote(false);
    setBlankInputs({});
    setBlankResult(null);
    setIsPlaying(false);
  }, []);

  const resetRoundState = useCallback(() => {
    setCurrentIndex(0);
    setIsFinished(false);
    setDictScore(0);
    setDictTotal(0);
    setFillScore(0);
    setFillTotal(0);
    resetSentenceState();
  }, [resetSentenceState]);

  const startPractice = useCallback(
    (nextMode: Mode) => {
      setIsExiting(true);
      window.setTimeout(() => {
        setMode(nextMode);
        setIsExiting(false);
        setIsEnteringPractice(true);
        setStage('practice');
        resetRoundState();

        window.setTimeout(() => {
          setIsEnteringPractice(false);
        }, 800);
      }, 450);
    },
    [resetRoundState],
  );

  const backToChooser = useCallback(() => {
    setIsExiting(true);
    window.setTimeout(() => {
      setStage('chooser');
      setIsExiting(false);
      setIsEnteringPractice(true);
      resetRoundState();

      window.setTimeout(() => {
        setIsEnteringPractice(false);
      }, 800);
    }, 450);
  }, [resetRoundState]);

  const handleNext = () => {
    setIsTransitioning(true);
    window.setTimeout(() => {
      if (currentIndex < sentences.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        resetSentenceState();
      } else {
        markPodcastLearned(episode?.id || '');
        setIsFinished(true);
      }
      window.setTimeout(() => setIsTransitioning(false), 50);
    }, 250);
  };

  const handleRestart = () => {
    resetRoundState();
  };

  const handlePlay = () => {
    if (!current) return;
    setIsPlaying(true);
    speak(current.en, () => setIsPlaying(false));
  };

  const handleDictCheck = () => {
    if (!current || !dictInput.trim()) return;
    const result = compareWords(current.en, dictInput);
    setDictResult(result);
    const correct = result.filter((item) => item.status === 'correct').length;
    setDictScore((prev) => prev + correct);
    setDictTotal((prev) => prev + result.length);
  };

  const handleFillCheck = () => {
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
  };

  if (loadingEpisode) {
    return (
      <div className="podcast-practice-page mx-auto max-w-lg px-4 py-32 text-center animate-in fade-in duration-700">
        <div className="relative mx-auto mb-8 h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-[#0071e3]/10" />
          <div className="absolute inset-0 rounded-full border-4 border-[#0071e3] border-t-transparent animate-spin" />
        </div>
        <p className="text-[19px] font-medium text-[#86868b]">正在准备播客练习...</p>
      </div>
    );
  }

  if (!episode || !isPracticeReady) {
    const statusLabel =
      episode?.transcriptStatus === 'pending'
        ? '这期播客已经抓到音频，但还没生成完整逐句稿。'
        : '这期播客暂时没有可用于练习的逐句稿。';

    return (
      <div className="podcast-practice-page mx-auto max-w-3xl px-4 py-24 text-center animate-in fade-in">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-100 text-slate-500">
          <Radio className="h-8 w-8" />
        </div>
        <h2 className="mb-4 text-[28px] font-bold text-[#1d1d1f]">当前播客只支持播放</h2>
        <p className="mb-8 text-[18px] font-medium text-[#86868b]">{statusLabel}</p>
        {episode?.audioUrl ? (
          <div className="mx-auto mb-10 max-w-2xl rounded-[32px] border border-[#d2d2d7]/30 bg-white p-8 shadow-sm">
            <audio controls src={episode.audioUrl} className="w-full" />
          </div>
        ) : null}
        <button
          onClick={() => navigate('/listening/podcasts')}
          className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f7] px-6 py-3 font-bold text-[#1d1d1f] transition-all hover:bg-[#e8e8ed] active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          返回播客列表
        </button>
      </div>
    );
  }

  if (isFinished) {
    const accuracy =
      dictTotal + fillTotal > 0 ? Math.round(((dictScore + fillScore) / (dictTotal + fillTotal)) * 100) : 100;

    return (
      <div className="podcast-practice-page mx-auto max-w-2xl px-4 py-20 text-center animate-in fade-in zoom-in-95 duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] bg-[#34c759] shadow-xl">
          <Trophy className="h-12 w-12 text-white" />
        </div>
        <h2 className="mb-2 text-[34px] font-bold tracking-tight text-[#1d1d1f]">播客挑战完成</h2>
        <p className="mb-12 text-[19px] text-[#86868b]">{episode.title}</p>
        <div className="mb-12 grid grid-cols-3 gap-5">
          <div className="rounded-[24px] border border-[#d2d2d7]/30 bg-white p-6 shadow-sm">
            <p className="text-[28px] font-black text-[#0071e3]">{sentences.length}</p>
            <p className="mt-1 text-[13px] font-bold uppercase tracking-wider text-[#86868b]">总句数</p>
          </div>
          <div className="rounded-[24px] border border-[#d2d2d7]/30 bg-white p-6 shadow-sm">
            <p className="text-[28px] font-black text-[#34c759]">{accuracy}%</p>
            <p className="mt-1 text-[13px] font-bold uppercase tracking-wider text-[#86868b]">正确率</p>
          </div>
          <div className="rounded-[24px] border border-[#d2d2d7]/30 bg-white p-6 shadow-sm">
            <p className="text-[28px] font-black text-[#af52de]">
              {mode === 'dictation' ? '听写' : mode === 'read-along' ? '跟读' : '填空'}
            </p>
            <p className="mt-1 text-[13px] font-bold uppercase tracking-wider text-[#86868b]">模式</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <button
            onClick={handleRestart}
            className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-[#0071e3] py-5 text-[20px] font-black text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95"
          >
            <RotateCcw className="h-6 w-6" />
            再练一轮
          </button>
          <Link
            to="/listening/podcasts"
            className="w-full rounded-[24px] bg-[#f5f5f7] py-5 text-[20px] font-bold text-[#1d1d1f] no-underline transition-all active:scale-95"
          >
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  const progressVal = ((currentIndex + 1) / sentences.length) * 100;

  return (
    <div className="podcast-practice-page mx-auto max-w-[1000px] px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link
          to="/listening/podcasts"
          className="flex items-center gap-2 text-[16px] font-bold text-[#86868b] no-underline transition-colors hover:text-[#1d1d1f]"
        >
          <ArrowLeft className="h-4 w-4" />
          返回播客列表
        </Link>
        <div className="rounded-full border border-[#d2d2d7]/20 bg-[#f5f5f7] px-4 py-1.5 text-[13px] font-bold uppercase tracking-widest text-[#86868b]">
          {episode.source}
        </div>
      </div>

      <div className="mb-10">
        <h1 className="mb-2 text-[28px] font-bold tracking-tight text-[#1d1d1f] leading-tight">{episode.title}</h1>
        <div className="mt-6 space-y-4">
          <div className="flex justify-between text-[14px] font-bold uppercase tracking-wider text-[#86868b]">
            <span>
              第 {currentIndex + 1} / {sentences.length} 句
            </span>
            <span>{Math.round(progressVal)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#d2d2d7]/30">
            <div
              className="h-full rounded-full bg-[#0071e3] transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              style={{ width: `${progressVal}%` }}
            />
          </div>
        </div>
      </div>

      {stage === 'chooser' ? (
        <div className={`animate-in fade-in zoom-in-95 duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isExiting ? 'apple-mode-exit' : ''}`}>
          <div className="mb-10 flex items-center gap-6 rounded-[40px] border border-[#d2d2d7]/30 bg-white p-8 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#0071e3]/5 text-[#0071e3] shadow-inner">
              <Radio className="h-8 w-8" />
            </div>
            <div>
              <h2 className="mb-1 text-[22px] font-bold text-[#1d1d1f]">本期播客原音频</h2>
              <p className="text-[15px] font-medium text-[#86868b]">
                建议先听一遍全文，熟悉语境后再开始下面的专项练习。
              </p>
              <audio controls src={episode.audioUrl} className="mt-4 h-10 w-full max-w-md" />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {(Object.keys(MODE_META) as Mode[]).map((key) => {
              const meta = MODE_META[key];
              const Icon = meta.icon;
              return (
                <button
                  key={key}
                  onClick={() => startPractice(key)}
                  className="group relative flex flex-col rounded-[40px] border border-[#d2d2d7]/30 bg-white p-10 text-left transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.95]"
                >
                  <div
                    className="mb-8 flex h-16 w-16 items-center justify-center rounded-[20px]"
                    style={{ backgroundColor: `${meta.color}10`, color: meta.color }}
                  >
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-3 text-[22px] font-black tracking-tight text-[#1d1d1f]">{meta.label}</h3>
                  <p className="text-[16px] font-medium leading-relaxed text-[#86868b]">{meta.desc}</p>
                  <div
                    className="mt-8 flex items-center gap-2 text-[14px] font-black uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: meta.color }}
                  >
                    开始练习
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
                  ? 'translate-y-12 scale-[0.98] opacity-0'
                  : 'scale-100 translate-y-0 opacity-100'
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={backToChooser}
              className="group flex items-center gap-2 rounded-full border border-[#d2d2d7]/30 bg-white px-5 py-2 text-[15px] font-bold text-[#1d1d1f] shadow-sm transition-all hover:bg-[#f5f5f7] active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
              返回模式选择
            </button>
            <div className="rounded-full bg-[#1d1d1f] px-5 py-2 text-[13px] font-bold uppercase tracking-widest text-white shadow-lg shadow-black/10">
              {MODE_META[mode].label}
            </div>
          </div>

          <div className="mb-12 overflow-hidden rounded-[40px] border border-[#d2d2d7]/30 bg-white shadow-[0_50px_100px_rgba(0,0,0,0.08)]">
            {mode === 'dictation' && (
              <div className="p-12 md:p-16">
                <div className="mb-12 text-center">
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className={`mx-auto flex h-24 w-28 items-center justify-center rounded-[32px] transition-all duration-500 active:scale-90 ${
                      isPlaying
                        ? 'scale-105 bg-[#0071e3]/10 text-[#0071e3]'
                        : 'bg-[#0071e3] text-white shadow-blue-500/20 hover:scale-105 hover:shadow-2xl'
                    }`}
                  >
                    {isPlaying ? <Volume2 className="h-12 w-12" /> : <Play className="ml-2 h-12 w-12" />}
                  </button>
                  <p className="mt-8 text-[18px] font-bold tracking-tight text-[#86868b]">
                    {isPlaying ? '正在为你朗读...' : '点击播放中心按钮听原声'}
                  </p>
                </div>

                <textarea
                  value={dictInput}
                  onChange={(e) => setDictInput(e.target.value)}
                  placeholder="在这里输入你听到的句子..."
                  rows={3}
                  disabled={dictResult !== null}
                  className="w-full resize-none rounded-[40px] border-transparent bg-[#f5f5f7] p-10 text-[24px] font-bold text-[#1d1d1f] shadow-inner transition-all focus:border-[#0071e3] focus:bg-white focus:ring-[12px] focus:ring-[#0071e3]/5"
                />

                {dictResult && (
                  <div className="mt-10 rounded-[40px] bg-[#f5f5f7] p-10 animate-in fade-in slide-in-from-top-6 duration-700">
                    <p className="mb-6 text-[14px] font-bold uppercase tracking-widest text-[#86868b] opacity-60">对比分析</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-4 leading-relaxed">
                      {dictResult.map((item, index) => (
                        <span
                          key={index}
                          className={`inline-block rounded-xl px-3 py-1 text-[22px] font-black ${
                            item.status === 'correct'
                              ? 'bg-[#34c759]/10 text-[#34c759]'
                              : 'bg-[#ff3b30]/10 text-[#ff3b30] line-through decoration-[4px]'
                          }`}
                        >
                          {item.word}
                        </span>
                      ))}
                    </div>
                    <div className="mt-10 border-t border-[#d2d2d7]/40 pt-10">
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                          <span className="text-[12px] font-bold uppercase tracking-widest text-[#86868b] opacity-60">你的输入</span>
                          <p className="text-[20px] font-bold italic text-[#1d1d1f] opacity-50">
                            {dictResult.map((item, index) => (
                              <span
                                key={index}
                                className={`mr-2 inline-block ${item.status === 'wrong' ? 'font-black text-[#ff3b30] opacity-100' : ''}`}
                              >
                                {item.userWord || '___'}
                              </span>
                            ))}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-[12px] font-bold uppercase tracking-widest text-[#86868b] opacity-60">播客翻译</span>
                          <p className="text-[22px] font-bold leading-relaxed text-[#1d1d1f]">{current?.note || episode.source}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-12 flex gap-5">
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className="flex items-center gap-2 rounded-[28px] bg-[#f5f5f7] px-8 py-5 text-[18px] font-bold text-[#1d1d1f] transition-all hover:bg-[#e8e8ed] active:scale-95"
                  >
                    <RotateCcw className="h-6 w-6" />
                    再听一遍
                  </button>
                  {dictResult === null ? (
                    <button
                      onClick={handleDictCheck}
                      disabled={!dictInput.trim()}
                      className="flex flex-1 items-center justify-center gap-3 rounded-[28px] bg-[#0071e3] px-8 py-5 text-[20px] font-black text-white shadow-xl shadow-blue-500/20 transition-all disabled:opacity-30 active:scale-97"
                    >
                      <Check className="h-6 w-6" />
                      核对答案
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex flex-1 items-center justify-center gap-3 rounded-[28px] bg-[#1d1d1f] px-8 py-5 text-[20px] font-black text-white shadow-2xl transition-all active:scale-97 hover:bg-black"
                    >
                      {currentIndex < sentences.length - 1 ? '下一句' : '完成复习'}
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {mode === 'read-along' && (
              <div className="p-12 text-center md:p-16">
                <p className="mb-12 text-[32px] font-black leading-tight tracking-tight text-[#1d1d1f] md:text-[40px]">
                  {current?.en}
                </p>
                {showNote ? (
                  <div className="mb-12 animate-in fade-in slide-in-from-top-4 rounded-[32px] bg-[#f5f5f7] p-8 duration-700">
                    <p className="text-[20px] font-bold italic leading-relaxed text-[#86868b]">{current?.note}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNote(true)}
                    className="mx-auto mb-12 flex items-center gap-2 text-[17px] font-black text-[#0071e3] transition-transform hover:underline active:scale-95"
                  >
                    <Eye className="h-5 w-5" />
                    查看参考说明
                  </button>
                )}
                <div className="mb-12 flex flex-wrap justify-center gap-4">
                  {current?.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-[#0071e3]/10 bg-[#0071e3]/5 px-6 py-2 text-[15px] font-black uppercase tracking-wider text-[#0071e3] shadow-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col justify-center gap-5 sm:flex-row">
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className={`flex items-center justify-center gap-4 rounded-[32px] px-12 py-6 text-[22px] font-black transition-all active:scale-95 ${
                      isPlaying
                        ? 'scale-105 bg-[#0071e3]/10 text-[#0071e3]'
                        : 'bg-[#0071e3] text-white shadow-2xl shadow-blue-500/30 hover:scale-105'
                    }`}
                  >
                    {isPlaying ? <Volume2 className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
                    {isPlaying ? '原声播放中...' : '开始朗读练习'}
                  </button>
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className="flex items-center justify-center gap-3 rounded-[32px] bg-[#f5f5f7] px-8 py-6 text-[19px] font-bold text-[#1d1d1f] transition-all hover:bg-[#e8e8ed] active:scale-95"
                  >
                    <RotateCcw className="h-6 w-6" />
                    重新播放
                  </button>
                </div>
                <div className="mt-16 border-t border-[#f5f5f7] pt-16">
                  <button
                    onClick={handleNext}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-[28px] bg-[#1d1d1f] px-16 py-5 text-[20px] font-black text-white shadow-xl shadow-black/10 transition-all active:scale-95 hover:bg-black sm:w-auto"
                  >
                    {currentIndex < sentences.length - 1 ? '下一句' : '结束本轮'}
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              </div>
            )}

            {mode === 'fill-blanks' && (
              <div className="p-12 md:p-16">
                <div className="mb-12 text-center">
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className={`mx-auto flex h-24 w-28 items-center justify-center rounded-[32px] transition-all duration-500 active:scale-90 ${
                      isPlaying
                        ? 'scale-105 bg-[#0071e3]/10 text-[#0071e3]'
                        : 'bg-[#0071e3] text-white shadow-2xl shadow-blue-500/20 hover:scale-105'
                    }`}
                  >
                    {isPlaying ? <Volume2 className="h-12 w-12" /> : <Play className="ml-2 h-12 w-12" />}
                  </button>
                  <p className="mt-8 text-[18px] font-bold tracking-tight text-[#86868b]">
                    {isPlaying ? '正在朗读...' : '点击播放中心按钮并听出关键词'}
                  </p>
                </div>

                <div className="mb-10 rounded-[40px] bg-[#f5f5f7] p-10 shadow-inner md:p-16">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-8 text-[28px] font-black tracking-tight text-[#1d1d1f] md:text-[34px]">
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
                            className={`w-40 border-b-[6px] bg-transparent px-2 py-1 text-center text-[34px] font-black focus:outline-none transition-all ${
                              checked
                                ? isCorrect
                                  ? 'border-[#34c759] text-[#34c759]'
                                  : 'border-[#ff3b30] text-[#ff3b30]'
                                : 'border-[#0071e3]/30 focus:border-[#0071e3]'
                            }`}
                            placeholder="______"
                          />
                          {checked && !isCorrect && blank ? (
                            <span className="absolute -bottom-9 animate-in fade-in slide-in-from-top-2 rounded-lg bg-[#34c759]/10 px-3 py-1 text-[14px] font-black uppercase tracking-widest text-[#34c759]">
                              {blank.answer}
                            </span>
                          ) : null}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {blankResult !== null ? (
                  <div className="mb-10 rounded-[32px] border-l-[8px] border-[#0071e3]/20 bg-[#f5f5f7] p-8 animate-in fade-in duration-700">
                    <span className="mb-3 block text-[12px] font-bold uppercase tracking-widest text-[#86868b] opacity-60">
                      参考翻译
                    </span>
                    <p className="text-[22px] font-bold leading-relaxed text-[#1d1d1f]">{current?.note}</p>
                  </div>
                ) : null}

                <div className="mt-12 flex gap-5">
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className="flex items-center gap-2 rounded-[28px] bg-[#f5f5f7] px-8 py-5 text-[18px] font-bold text-[#1d1d1f] transition-all hover:bg-[#e8e8ed] active:scale-95"
                  >
                    <RotateCcw className="h-6 w-6" />
                    再听一遍
                  </button>
                  {blankResult === null ? (
                    <button
                      onClick={handleFillCheck}
                      className="flex flex-1 items-center justify-center gap-3 rounded-[28px] bg-[#0071e3] px-8 py-5 text-[20px] font-black text-white shadow-xl shadow-blue-500/20 transition-all active:scale-97 hover:bg-[#0077ed]"
                    >
                      <Check className="h-6 w-6" />
                      核对答案
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex flex-1 items-center justify-center gap-3 rounded-[28px] bg-[#1d1d1f] px-8 py-5 text-[20px] font-black text-white shadow-2xl transition-all active:scale-97 hover:bg-black"
                    >
                      {currentIndex < sentences.length - 1 ? '下一句' : '完成练习'}
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
