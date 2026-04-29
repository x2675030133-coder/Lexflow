import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  RefreshCw,
  RotateCcw,
  Trophy,
  Volume2,
} from 'lucide-react';
import { difficultyLabels, categoryLabels } from '../data/listeningData';
import { allListeningExercises } from '../data/listeningLibrary';
import { markListeningLearned } from '../utils/listeningProgress';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';

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
    desc: '看着句子，跟着语音朗读练习。',
    icon: Mic,
  },
  'fill-blanks': {
    label: '填空模式',
    desc: '听句子，补全缺失的关键词。',
    icon: BookOpen,
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
      return { display: pre + '___' + post, isBlank: true, index };
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

  useStopMediaOnUnmount();

  const sentences = exercise?.sentences || [];
  const current = sentences[currentIndex];

  const blanksData = useMemo(() => {
    if (!current) return { parts: [], blanks: [] };
    return makeBlanks(current.en, current.keywords);
  }, [current]);

  const resetSentenceState = useCallback(() => {
    setDictInput('');
    setDictResult(null);
    setShowTranslation(false);
    setBlankInputs({});
    setBlankResult(null);
    setIsPlaying(false);
  }, []);

  const startPractice = useCallback(
    (nextMode: Mode) => {
      setIsExiting(true);
      // Significantly reduced delay for immediate response
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
        
        window.setTimeout(() => {
          setIsEnteringPractice(false);
        }, 300);
      }, 200);
    },
    [resetSentenceState],
  );

  const backToChooser = useCallback(() => {
    // Immediate state change for zero lag
    setStage('chooser');
    resetSentenceState();
  }, [resetSentenceState]);

  const handleNext = () => {
    setIsTransitioning(true);
    window.setTimeout(() => {
      if (currentIndex < sentences.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        resetSentenceState();
      } else {
        markListeningLearned(exercise?.id || '');
        setIsFinished(true);
      }
      window.setTimeout(() => setIsTransitioning(false), 50);
    }, 250);
  };

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

  if (!exercise) {
    return (
    <div className="listening-practice-page max-w-3xl mx-auto px-4 py-32 text-center animate-in fade-in duration-700">
        <p className="text-black dark:text-[#a1a1a6] text-[19px] mb-8 font-medium">没有找到这个练习内容</p>
        <Link to="/listening" className="inline-flex items-center gap-2 px-6 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-full font-bold no-underline hover:bg-[#e8e8ed] transition-all">
          <ArrowLeft className="w-4 h-4" /> 返回列表
        </Link>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / sentences.length) * 100;

  const handlePlay = () => {
    if (!current) return;
    setIsPlaying(true);
    speak(current.en, () => setIsPlaying(false));
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFinished(false);
    setDictScore(0);
    setDictTotal(0);
    setFillScore(0);
    setFillTotal(0);
    resetSentenceState();
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

  if (isFinished) {
    const totalScore = mode === 'dictation' ? dictScore : mode === 'fill-blanks' ? fillScore : sentences.length;
    const totalPossible = mode === 'dictation' ? dictTotal : mode === 'fill-blanks' ? fillTotal : sentences.length;
    const accuracy = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 100;

    return (
    <div className="listening-practice-page max-w-2xl mx-auto px-4 py-20 text-center animate-in fade-in zoom-in-95 duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
        <div className="w-24 h-24 bg-[#34c759] rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-[34px] font-bold text-[#1d1d1f] tracking-tight mb-2">练习完成</h2>
        <p className="text-[19px] text-black dark:text-[#a1a1a6] mb-12">{exercise.title}</p>

        <div className="grid grid-cols-3 gap-5 mb-12">
          <div className="bg-white rounded-[24px] p-6 border border-[#d2d2d7]/30 shadow-sm">
            <p className="text-[28px] font-black text-[#0071e3]">{sentences.length}</p>
            <p className="text-[13px] font-bold text-black dark:text-[#a1a1a6] uppercase tracking-wider mt-1">总句数</p>
          </div>
          <div className="bg-white rounded-[24px] p-6 border border-[#d2d2d7]/30 shadow-sm">
            <p className="text-[28px] font-black text-[#34c759]">{accuracy}%</p>
            <p className="text-[13px] font-bold text-black dark:text-[#a1a1a6] uppercase tracking-wider mt-1">正确率</p>
          </div>
          <div className="bg-white rounded-[24px] p-6 border border-[#d2d2d7]/30 shadow-sm">
            <p className="text-[28px] font-black text-[#af52de]">
              {mode === 'dictation' ? '听写' : mode === 'read-along' ? '跟读' : '填空'}
            </p>
            <p className="text-[13px] font-bold text-black dark:text-[#a1a1a6] uppercase tracking-wider mt-1">模式</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleRestart}
            className="w-full py-5 bg-[#0071e3] text-white rounded-[24px] text-[20px] font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <RefreshCw className="w-6 h-6" /> 再练一轮
          </button>
          <Link
            to="/listening"
            className="w-full py-5 bg-[#f5f5f7] text-[#1d1d1f] rounded-[24px] text-[20px] font-bold no-underline active:scale-95 transition-all"
          >
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="listening-practice-page max-w-[1000px] mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/listening"
          className="flex items-center gap-2 text-black dark:text-[#a1a1a6] hover:text-[#1d1d1f] transition-colors no-underline text-[16px] font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> 返回列表
        </Link>
        <div className="px-4 py-1.5 bg-[#f5f5f7] rounded-full text-[13px] font-bold text-black dark:text-[#a1a1a6] uppercase tracking-widest border border-[#d2d2d7]/20">
          {categoryLabels[exercise.category]} · {difficultyLabels[exercise.difficulty]}
        </div>
      </div>

      <div className="mb-12">
        <h1 className="text-[32px] font-bold text-[#1d1d1f] tracking-tight mb-2 leading-tight">{exercise.title}</h1>
        <p className="text-[19px] text-black dark:text-[#a1a1a6] font-medium mb-8 leading-relaxed">{exercise.titleZh}</p>

        <div className="space-y-4">
          <div className="flex justify-between text-[14px] font-bold text-black dark:text-[#a1a1a6] uppercase tracking-wider">
            <span>第 {currentIndex + 1} / {sentences.length} 句</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-[#d2d2d7]/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0071e3] rounded-full transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {stage === 'chooser' ? (
        <div className={`animate-in fade-in zoom-in-95 duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isExiting ? 'apple-mode-exit' : ''}`}>
          <p className="mb-8 text-[18px] font-bold text-[#1d1d1f] tracking-tight">请选择练习模式</p>
          <div className="grid gap-6 sm:grid-cols-3">
            {(Object.keys(MODE_META) as Mode[]).map((key) => {
              const meta = MODE_META[key];
              const Icon = meta.icon;
              return (
                <button
                  key={key}
                  onClick={() => startPractice(key)}
                  className="group relative flex flex-col p-10 rounded-[40px] bg-white border border-[#d2d2d7]/30 text-left transition-all duration-500 hover:shadow-2xl hover:translate-y-[-4px] active:scale-[0.95]"
                >
                  <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#0071e3]/5 text-[#0071e3] transition-colors group-hover:bg-[#0071e3] group-hover:text-white">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-3 text-[22px] font-black text-[#1d1d1f] tracking-tight">{meta.label}</h3>
                  <p className="text-[16px] leading-relaxed text-black dark:text-[#a1a1a6] font-medium">{meta.desc}</p>
                  <div className="mt-8 flex items-center gap-2 text-[#0071e3] text-[14px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    进入模式 <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div 
          className={`transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isExiting ? 'animate-apple-slide-down' : 
            isEnteringPractice ? 'apple-mode-enter' : 
            isTransitioning ? 'opacity-0 scale-[0.98] translate-y-12' : 
            'opacity-100 scale-100 translate-y-0'
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={backToChooser}
              className="group flex items-center gap-2.5 rounded-full bg-white px-6 py-2.5 text-[16px] font-bold text-[#1d1d1f] shadow-sm border border-[#d2d2d7]/30 transition-all hover:bg-[#f5f5f7] active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-[-2px]" />
              返回模式选择
            </button>
            <div className="px-5 py-2 bg-[#1d1d1f] rounded-full text-[13px] font-bold text-white uppercase tracking-widest shadow-lg shadow-black/10">
              {MODE_META[mode].label}
            </div>
          </div>

          <div className="bg-white rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.08)] border border-[#d2d2d7]/30 overflow-hidden mb-12">
            {mode === 'dictation' && (
              <div className="p-12 md:p-16">
                <div className="text-center mb-12">
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className={`w-28 h-24 rounded-[32px] flex items-center justify-center mx-auto transition-all duration-500 active:scale-90 ${
                      isPlaying
                        ? 'bg-[#0071e3]/10 text-[#0071e3] scale-105'
                        : 'bg-[#0071e3] text-white hover:shadow-2xl hover:scale-105 shadow-blue-500/20'
                    }`}
                  >
                    {isPlaying ? <Volume2 className="w-12 h-12" /> : <Play className="w-12 h-12 ml-2" />}
                  </button>
                  <p className="text-[18px] font-bold text-black dark:text-[#a1a1a6] mt-8 tracking-tight">{isPlaying ? '正在为您朗读...' : '点击播放中心按钮听原声'}</p>
                </div>

                <textarea
                  value={dictInput}
                  onChange={(event) => setDictInput(event.target.value)}
                  placeholder="在这里输入你听到的句子..."
                  rows={3}
                  disabled={dictResult !== null}
                  className="w-full p-10 bg-[#f5f5f7] border-transparent rounded-[40px] text-[24px] font-bold text-[#1d1d1f] placeholder-[#86868b]/30 focus:bg-white focus:ring-[12px] focus:ring-[#0071e3]/5 focus:border-[#0071e3] resize-none transition-all disabled:opacity-80 shadow-inner"
                />

                {dictResult && (
                  <div className="mt-10 p-10 bg-[#f5f5f7] rounded-[40px] animate-in fade-in slide-in-from-top-6 duration-700">
                    <p className="text-[14px] font-bold text-black dark:text-[#a1a1a6] mb-6 uppercase tracking-widest opacity-60">比对分析</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-4 leading-relaxed">
                      {dictResult.map((item, index) => (
                        <span
                          key={index}
                          className={`inline-block px-3 py-1 rounded-xl text-[22px] font-black ${
                            item.status === 'correct'
                              ? 'bg-[#34c759]/10 text-[#34c759]'
                              : 'bg-[#ff3b30]/10 text-[#ff3b30] line-through decoration-[4px]'
                          }`}
                        >
                          {item.word}
                        </span>
                      ))}
                    </div>
                    <div className="mt-10 pt-10 border-t border-[#d2d2d7]/40">
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                          <span className="text-[12px] font-bold text-black dark:text-[#a1a1a6] uppercase tracking-widest opacity-60">您的输入</span>
                          <p className="text-[20px] font-bold text-[#1d1d1f] italic opacity-50">
                            {dictResult.map((item, index) => (
                              <span
                                key={index}
                                className={`inline-block mr-2 ${
                                  item.status === 'wrong' ? 'text-[#ff3b30] font-black opacity-100' : ''
                                }`}
                              >
                                {item.userWord || '___'}
                              </span>
                            ))}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-[12px] font-bold text-black dark:text-[#a1a1a6] uppercase tracking-widest opacity-60">中文释义</span>
                          <p className="text-[22px] font-bold text-[#1d1d1f] leading-relaxed">{current.zh}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-5 mt-12">
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className="px-8 py-5 bg-[#f5f5f7] text-[#1d1d1f] rounded-[28px] text-[18px] font-bold hover:bg-[#e8e8ed] transition-all flex items-center gap-2 active:scale-95"
                  >
                    <RotateCcw className="w-6 h-6" /> 再听一遍
                  </button>
                  {dictResult === null ? (
                    <button
                      onClick={handleDictCheck}
                      disabled={!dictInput.trim()}
                      className="flex-1 px-8 py-5 bg-[#0071e3] text-white rounded-[28px] text-[20px] font-black hover:bg-[#0077ed] transition-all disabled:opacity-30 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-97"
                    >
                      <Check className="w-6 h-6" /> 核对答案
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex-1 px-8 py-5 bg-[#1d1d1f] text-white rounded-[28px] text-[20px] font-black hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-97 shadow-2xl"
                    >
                      {currentIndex < sentences.length - 1 ? '下一句' : '完成复习'} <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {mode === 'read-along' && (
              <div className="p-12 md:p-16 text-center">
                <p className="text-[36px] md:text-[48px] font-black text-[#1d1d1f] leading-tight mb-12 tracking-tight">{current.en}</p>

                {showTranslation ? (
                  <div className="mb-12 p-8 bg-[#f5f5f7] rounded-[32px] animate-in fade-in slide-in-from-top-4 duration-700">
                    <p className="text-[22px] font-bold text-black dark:text-[#a1a1a6] leading-relaxed italic">
                      {current.zh}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTranslation(true)}
                    className="mb-12 text-[17px] font-black text-[#0071e3] hover:underline flex items-center gap-2 mx-auto active:scale-95 transition-transform"
                  >
                    <Eye className="w-5 h-5" /> 查看中文翻译
                  </button>
                )}

                <div className="flex flex-wrap gap-4 justify-center mb-12">
                  {current.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="text-[15px] font-black bg-[#0071e3]/5 text-[#0071e3] px-6 py-2 rounded-full border border-[#0071e3]/10 uppercase tracking-wider shadow-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-5 justify-center">
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className={`px-12 py-6 rounded-[32px] text-[22px] font-black flex items-center justify-center gap-4 transition-all active:scale-95 ${
                      isPlaying ? 'bg-[#0071e3]/10 text-[#0071e3] scale-105' : 'bg-[#0071e3] text-white shadow-2xl shadow-blue-500/30 hover:scale-105'
                    }`}
                  >
                    {isPlaying ? <Volume2 className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                    {isPlaying ? '原声朗读中...' : '开始跟读练习'}
                  </button>
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className="px-8 py-6 bg-[#f5f5f7] text-[#1d1d1f] rounded-[32px] text-[19px] font-bold hover:bg-[#e8e8ed] transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    <RotateCcw className="w-6 h-6" /> 重新播放
                  </button>
                </div>

                <div className="mt-16 pt-16 border-t border-[#f5f5f7]">
                  <button
                    onClick={handleNext}
                    className="w-full sm:w-auto px-16 py-5 bg-[#1d1d1f] text-white rounded-[28px] text-[20px] font-black hover:bg-black transition-all inline-flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-black/10"
                  >
                    {currentIndex < sentences.length - 1 ? '下一句' : '结束本轮'} <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}

            {mode === 'fill-blanks' && (
              <div className="p-12 md:p-16">
                <div className="text-center mb-12">
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className={`w-28 h-24 rounded-[32px] flex items-center justify-center mx-auto transition-all duration-500 active:scale-90 ${
                      isPlaying
                        ? 'bg-[#0071e3]/10 text-[#0071e3] scale-105'
                        : 'bg-[#0071e3] text-white shadow-2xl hover:scale-105 shadow-blue-500/20'
                    }`}
                  >
                    {isPlaying ? <Volume2 className="w-12 h-12" /> : <Play className="w-12 h-12 ml-2" />}
                  </button>
                  <p className="text-[18px] font-bold text-black dark:text-[#a1a1a6] mt-8 tracking-tight">{isPlaying ? '正在朗读...' : '点击播放中心按钮并听出关键词'}</p>
                </div>

                <div className="bg-[#f5f5f7] rounded-[40px] p-10 md:p-16 mb-10 shadow-inner">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-8 leading-relaxed text-[28px] md:text-[34px] font-black text-[#1d1d1f] tracking-tight">
                    {blanksData.parts.map((part, index) => {
                      if (!part.isBlank) {
                        return (
                          <span key={index}>
                            {part.display}
                          </span>
                        );
                      }

                      const checked = blankResult !== null;
                      const isCorrect = blankResult?.[part.index];
                      const blank = blanksData.blanks.find((item) => item.index === part.index);

                      return (
                        <span key={index} className="inline-flex flex-col items-center gap-2 relative">
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
                            className={`w-40 px-2 py-1 text-center border-b-[6px] bg-transparent text-[34px] font-black focus:outline-none transition-all ${
                              checked
                                ? isCorrect
                                  ? 'border-[#34c759] text-[#34c759]'
                                  : 'border-[#ff3b30] text-[#ff3b30]'
                                : 'border-[#0071e3]/30 focus:border-[#0071e3]'
                            }`}
                            placeholder="····"
                          />
                          {checked && !isCorrect && blank && (
                            <span className="absolute -bottom-9 text-[14px] font-black text-[#34c759] bg-[#34c759]/10 px-3 py-1 rounded-lg uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                              {blank.answer}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {blankResult !== null && (
                  <div className="mb-10 p-8 bg-[#f5f5f7] rounded-[32px] animate-in fade-in duration-700 border-l-[8px] border-[#0071e3]/20">
                    <span className="text-[12px] font-bold text-black dark:text-[#a1a1a6] uppercase tracking-widest block mb-3 opacity-60">参考翻译</span>
                    <p className="text-[22px] font-bold text-[#1d1d1f] leading-relaxed">{current.zh}</p>
                  </div>
                )}

                <div className="flex gap-5 mt-12">
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className="px-8 py-5 bg-[#f5f5f7] text-[#1d1d1f] rounded-[28px] text-[18px] font-bold hover:bg-[#e8e8ed] transition-all flex items-center gap-2 active:scale-95"
                  >
                    <RotateCcw className="w-6 h-6" /> 再听一遍
                  </button>
                  {blankResult === null ? (
                    <button
                      onClick={handleFillCheck}
                      className="flex-1 px-8 py-5 bg-[#0071e3] text-white rounded-[28px] text-[20px] font-black hover:bg-[#0077ed] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-97"
                    >
                      <Check className="w-6 h-6" /> 核对答案
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex-1 px-8 py-5 bg-[#1d1d1f] text-white rounded-[28px] text-[20px] font-black hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-97 shadow-2xl"
                    >
                      {currentIndex < sentences.length - 1 ? '下一句' : '完成练习'} <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-12 text-[16px] font-black text-black dark:text-[#a1a1a6] mt-12 tracking-wider">
            <div className="flex items-center gap-2">
              <span className="uppercase text-[12px]">正确率</span>
              <span className="text-[#1d1d1f] text-[20px]">{Math.round(
                ((mode === 'dictation' ? dictScore : mode === 'fill-blanks' ? fillScore : currentIndex + 1) /
                  Math.max(mode === 'dictation' ? dictTotal : mode === 'fill-blanks' ? fillTotal : currentIndex + 1, 1)) *
                  100
              )}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="uppercase text-[12px]">进度</span>
              <span className="text-[#1d1d1f] text-[20px]">{currentIndex + 1} / {sentences.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
