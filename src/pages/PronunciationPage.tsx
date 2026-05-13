import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Copy,
  Keyboard,
  Play,
  RefreshCcw,
  Search,
  Shuffle,
  Sparkles,
  Star,
  Target,
  Volume2,
  X,
} from 'lucide-react';
import {
  MINIMAL_PAIR_QUIZZES,
  PHONEME_GROUP_LOOKUP,
  PHONEME_GROUPS,
  PHONEME_ITEMS,
  PHONEME_LOOKUP,
  type PhonemeItem,
} from '../data/phonetics';
import { PronunciationRecordingCard } from '../components/PronunciationRecordingCard';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';
import { getSettings, saveSettings } from '../utils/settings';
import { speakPlayback, stopSpeechPlayback } from '../utils/speechPlayback';
import {
  getPronunciationProgress,
  markPronunciationPracticed,
  setLastPronunciationSelection,
  togglePronunciationFavorite,
  type PronunciationProgress,
} from '../utils/pronunciationProgress';

type FilterMode = 'all' | 'vowels' | 'consonants' | 'favorites' | 'practiced';
type QuizAnswer = 'left' | 'right';
type QuizFeedback = {
  choice: QuizAnswer;
  correct: boolean;
};

function createQuizRound(excludeId?: string) {
  const pool = MINIMAL_PAIR_QUIZZES.filter((quiz) => quiz.id !== excludeId);
  const quiz = pool[Math.floor(Math.random() * pool.length)] || MINIMAL_PAIR_QUIZZES[0];
  const answerSide: QuizAnswer = Math.random() > 0.5 ? 'left' : 'right';
  const promptWord = answerSide === 'left' ? quiz.leftWord : quiz.rightWord;

  return { quiz, answerSide, promptWord };
}

function formatSequence(items: PhonemeItem[]) {
  if (!items.length) return '';
  return `/${items.map((item) => item.symbol).join(' ')}/`;
}

function buildSequenceSpeech(items: PhonemeItem[]) {
  return items.map((item) => item.examples[0]).join(', ');
}

export default function PronunciationPage() {
  const initialProgress = getPronunciationProgress();
  const [progress, setProgress] = useState<PronunciationProgress>(initialProgress);
  const [selectedId, setSelectedId] = useState(initialProgress.lastSelectedId || PHONEME_ITEMS[0].id);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [query, setQuery] = useState('');
  const [sequenceIds, setSequenceIds] = useState<string[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [quizRound, setQuizRound] = useState(() => createQuizRound());
  const [quizFeedback, setQuizFeedback] = useState<QuizFeedback | null>(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [quizPlaying, setQuizPlaying] = useState(false);
  const [accent, setAccent] = useState(() => getSettings().accent);
  const containerRef = useRef<HTMLDivElement>(null);

  useStopMediaOnUnmount();

  useEffect(() => {
    const refresh = () => setProgress(getPronunciationProgress());

    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('el-pronunciation-changed', refresh as EventListener);

    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('el-pronunciation-changed', refresh as EventListener);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements = entry.target.querySelectorAll('.reveal-on-scroll');
            elements.forEach((element, index) => {
              window.setTimeout(() => {
                element.classList.add('is-visible');
              }, index * 90);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    if (containerRef.current) {
      const sections = containerRef.current.querySelectorAll('.reveal-section');
      sections.forEach((section) => observer.observe(section));
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (selectedId && selectedId !== progress.lastSelectedId) {
      setSelectedId(progress.lastSelectedId || selectedId);
    }
  }, [progress.lastSelectedId, selectedId]);

  useEffect(() => {
    const refreshAccent = () => setAccent(getSettings().accent);

    refreshAccent();
    window.addEventListener('storage', refreshAccent);
    window.addEventListener('settingsUpdated', refreshAccent as EventListener);

    return () => {
      window.removeEventListener('storage', refreshAccent);
      window.removeEventListener('settingsUpdated', refreshAccent as EventListener);
    };
  }, []);

  const favoriteSet = useMemo(() => new Set(progress.favorites), [progress.favorites]);
  const practicedSet = useMemo(() => new Set(progress.practiced), [progress.practiced]);

  const selectedItem = PHONEME_LOOKUP[selectedId] || PHONEME_ITEMS[0];
  const selectedGroup = PHONEME_GROUP_LOOKUP[selectedItem.groupId] || PHONEME_GROUPS[0];

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();

    return PHONEME_ITEMS.filter((item) => {
      const group = PHONEME_GROUP_LOOKUP[item.groupId];
      const searchText = [
        item.symbol,
        item.cue,
        item.contrast,
        item.mistake,
        group?.label || '',
        ...item.examples,
        ...item.searchTerms,
      ]
        .join(' ')
        .toLowerCase();

      const matchQuery = !term || searchText.includes(term);
      const matchMode =
        filterMode === 'all' ||
        (filterMode === 'vowels' && group?.kind === 'vowel') ||
        (filterMode === 'consonants' && group?.kind === 'consonant') ||
        (filterMode === 'favorites' && favoriteSet.has(item.id)) ||
        (filterMode === 'practiced' && practicedSet.has(item.id));

      return matchQuery && matchMode;
    });
  }, [favoriteSet, filterMode, practicedSet, query]);

  const visibleGroups = useMemo(() => {
    return PHONEME_GROUPS.map((group) => {
      const items = filteredItems.filter((item) => item.groupId === group.id);
      return items.length ? { group, items } : null;
    }).filter(Boolean) as Array<{ group: (typeof PHONEME_GROUPS)[number]; items: PhonemeItem[] }>;
  }, [filteredItems]);

  const visibleCount = filteredItems.length;
  const practicedCount = practicedSet.size;
  const favoriteCount = favoriteSet.size;

  const sequenceItems = useMemo(() => {
    return sequenceIds.map((id) => PHONEME_LOOKUP[id]).filter(Boolean) as PhonemeItem[];
  }, [sequenceIds]);

  const speechLang = accent === 'uk' ? 'en-GB' : 'en-US';
  const accentLabel = accent === 'uk' ? '英音' : '美音';

  const currentFilterLabel = {
    all: '全部',
    vowels: '元音',
    consonants: '辅音',
    favorites: '收藏',
    practiced: '已练习',
  }[filterMode];

  const speakItem = (item: PhonemeItem) => {
    stopSpeechPlayback();
    const spoken = item.examples.join(', ');
    const started = speakPlayback(spoken, {
      lang: speechLang,
      rate: 0.84,
      onStart: () => setPlayingId(item.id),
      onEnd: () => setPlayingId((current) => (current === item.id ? null : current)),
    });

    if (!started) {
      setPlayingId(null);
    }
  };

  const handleSelectItem = (item: PhonemeItem) => {
    setSelectedId(item.id);
    setProgress(setLastPronunciationSelection(item.id));
    speakItem(item);
  };

  const handleFavoriteToggle = (itemId: string) => {
    setProgress(togglePronunciationFavorite(itemId));
  };

  const handleAddToSequence = (itemId: string) => {
    setSequenceIds((current) => (current.includes(itemId) ? current : [...current, itemId]));
  };

  const handleRandomSelect = () => {
    const pool = filteredItems.length ? filteredItems : PHONEME_ITEMS;
    const next = pool[Math.floor(Math.random() * pool.length)] || PHONEME_ITEMS[0];
    handleSelectItem(next);
  };

  const handleRandomSequence = () => {
    const pool = filteredItems.length ? filteredItems : PHONEME_ITEMS;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setSequenceIds(shuffled.slice(0, Math.min(4, shuffled.length)).map((item) => item.id));
  };

  const handlePlaySequence = () => {
    const source = sequenceItems.length ? sequenceItems : [selectedItem];
    const text = buildSequenceSpeech(source);
    stopSpeechPlayback();
    const started = speakPlayback(text, {
      lang: speechLang,
      rate: 0.8,
      onStart: () => setPlayingId(source[0]?.id || null),
      onEnd: () => setPlayingId(null),
    });

    if (!started) {
      setPlayingId(null);
    }
  };

  const handleCopySequence = async () => {
    const text = formatSequence(sequenceItems.length ? sequenceItems : [selectedItem]);
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Ignore clipboard failures.
    }
  };

  const handleQuizPlay = () => {
    stopSpeechPlayback();
    const started = speakPlayback(quizRound.promptWord, {
      lang: speechLang,
      rate: 0.84,
      onStart: () => setQuizPlaying(true),
      onEnd: () => setQuizPlaying(false),
    });

    if (!started) {
      setQuizPlaying(false);
    }
  };

  const handleQuizChoice = (choice: QuizAnswer) => {
    if (quizFeedback) return;

    const correct = choice === quizRound.answerSide;
    setQuizFeedback({ choice, correct });
    setQuizScore((current) => ({
      correct: current.correct + (correct ? 1 : 0),
      total: current.total + 1,
    }));
  };

  const handleNextQuiz = () => {
    setQuizRound((current) => createQuizRound(current.quiz.id));
    setQuizFeedback(null);
  };

  return (
    <div ref={containerRef} className="mx-auto max-w-7xl px-4 py-8 text-[#1d1d1f] sm:px-6 lg:px-8">
      <section
        className="reveal-1 overflow-hidden rounded-[42px] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-10"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(0,113,227,0.10), rgba(52,199,89,0.10), rgba(255,149,0,0.10))',
        }}
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-4 py-2 text-[13px] font-black uppercase tracking-[0.22em] text-blue-600 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Pronunciation Lab
            </div>
            <h1 className="text-[44px] font-black leading-[1.04] tracking-tight text-[#1d1d1f] sm:text-[62px]">
              音标发音实验室
            </h1>
            <p className="mt-5 max-w-2xl text-[18px] font-medium leading-relaxed text-[#636366] sm:text-[21px]">
              44 个音素按类别铺开，例词、口型提示和最小对立练习放在同一页。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => speakItem(selectedItem)}
                className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-6 py-3 text-[15px] font-black text-white shadow-lg shadow-blue-500/20 transition-transform hover:scale-[1.02] active:scale-95"
              >
                <Play className="h-4 w-4" />
                播放当前音
              </button>
              <button
                type="button"
                onClick={handleRandomSelect}
                className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white/75 px-6 py-3 text-[15px] font-black text-[#1d1d1f] shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
              >
                <Shuffle className="h-4 w-4" />
                随机练习
              </button>
              <Link
                to="/tools"
                className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-3 text-[15px] font-black text-[#0071e3] no-underline transition-transform hover:translate-x-0.5"
              >
                返回工具页
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: '音素总数', value: PHONEME_ITEMS.length, color: '#0071e3' },
              { label: '当前分组', value: PHONEME_GROUPS.length, color: '#34c759' },
              { label: '收藏音标', value: favoriteCount, color: '#ff9500' },
              { label: '已练习', value: practicedCount, color: '#0ea5e9' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_14px_30px_rgba(0,0,0,0.06)] backdrop-blur-sm"
              >
                <div className="mb-3 h-2 w-16 rounded-full" style={{ backgroundColor: stat.color }} />
                <div className="text-[13px] font-black uppercase tracking-[0.22em] text-[#86868b]">{stat.label}</div>
                <div className="mt-3 text-[34px] font-black tracking-tight text-[#1d1d1f]">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="reveal-section mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="reveal-on-scroll space-y-4">
          <div className="rounded-[32px] border border-[#d2d2d7]/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.22em] text-[#86868b]">音标总览</div>
                <h2 className="mt-1 text-[28px] font-black tracking-tight text-[#1d1d1f]">
                  {currentFilterLabel} · {visibleCount} 个结果
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'vowels', 'consonants', 'favorites', 'practiced'] as FilterMode[]).map((mode) => {
                  const active = filterMode === mode;
                  const label = {
                    all: '全部',
                    vowels: '元音',
                    consonants: '辅音',
                    favorites: '收藏',
                    practiced: '已练习',
                  }[mode];

                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFilterMode(mode)}
                      className={`rounded-full px-4 py-2 text-[14px] font-black transition-all ${
                        active
                          ? 'bg-[#1d1d1f] text-white shadow-lg shadow-black/10'
                          : 'bg-[#f5f5f7] text-[#636366] hover:bg-[#e8e8ed]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索音标、例词或提示"
                className="w-full rounded-[22px] border border-[#d2d2d7] bg-white px-11 py-4 text-[15px] font-medium text-[#1d1d1f] outline-none transition-all placeholder:text-[#a1a1a6] focus:border-[#0071e3] focus:ring-4 focus:ring-blue-100"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#86868b] transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
                  aria-label="清空搜索"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            {visibleGroups.map(({ group, items }) => (
              <section key={group.id} className="reveal-section rounded-[32px] border border-[#d2d2d7]/60 bg-white/75 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                <div className="reveal-on-scroll mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: group.tone }} />
                    <h3 className="text-[20px] font-black tracking-tight text-[#1d1d1f]">{group.label}</h3>
                  </div>
                  <div className="text-[13px] font-black uppercase tracking-[0.2em] text-[#86868b]">
                    {items.length} 个音素
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => {
                    const groupMeta = PHONEME_GROUP_LOOKUP[item.groupId];
                    const selected = item.id === selectedId;
                    const practiced = practicedSet.has(item.id);
                    const favorite = favoriteSet.has(item.id);
                    const playing = playingId === item.id;

                    return (
                      <article
                        key={item.id}
                        className={`relative overflow-hidden rounded-[24px] border transition-all ${
                          selected
                            ? 'border-blue-200 bg-blue-50/70 shadow-[0_18px_30px_rgba(0,113,227,0.12)]'
                            : 'border-[#e5e5ea] bg-white hover:-translate-y-0.5 hover:border-[#c7d7ff] hover:shadow-[0_16px_30px_rgba(0,0,0,0.06)]'
                        }`}
                      >
                        <span className="absolute left-0 top-0 h-1.5 w-full" style={{ backgroundColor: groupMeta?.tone }} />
                        <button
                          type="button"
                          onClick={() => handleSelectItem(item)}
                          className="flex min-h-[148px] w-full flex-col justify-between px-4 py-4 text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[34px] font-black leading-none tracking-tight text-[#1d1d1f]">
                                {item.symbol}
                              </div>
                              <div className="mt-2 text-[12px] font-black uppercase tracking-[0.2em] text-[#86868b]">
                                {groupMeta?.label || group.label}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {practiced ? (
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                  <Check className="h-4 w-4" />
                                </span>
                              ) : null}
                              {playing ? (
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                  <Volume2 className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-6">
                            <div className="text-[16px] font-black text-[#1d1d1f]">{item.examples[0]}</div>
                            <div className="mt-1 text-[13px] font-medium leading-relaxed text-[#636366]">{item.cue}</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleFavoriteToggle(item.id);
                          }}
                          className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                            favorite
                              ? 'border-amber-200 bg-amber-50 text-amber-500'
                              : 'border-[#e5e5ea] bg-white/90 text-[#86868b] hover:text-amber-500'
                          }`}
                          aria-label={favorite ? `取消收藏 ${item.symbol}` : `收藏 ${item.symbol}`}
                          aria-pressed={favorite}
                        >
                          <Star className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <aside className="reveal-on-scroll space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-[32px] border border-[#d2d2d7]/60 bg-white/85 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.22em] text-[#86868b]">当前音标</div>
                <h2 className="mt-2 text-[40px] font-black tracking-tight text-[#1d1d1f]">{selectedItem.symbol}</h2>
                <div className="mt-2 text-[14px] font-black uppercase tracking-[0.2em]" style={{ color: selectedGroup.tone }}>
                  {selectedGroup.label}
                </div>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f7] text-[#1d1d1f]">
                <Target className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-6 rounded-[24px] bg-[#f5f5f7] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[#86868b]">发音偏好</div>
                  <p className="mt-1 text-[14px] font-medium text-[#636366]">选择当前音标页的朗读口音。</p>
                </div>
                <div className="inline-flex rounded-full border border-[#d2d2d7] bg-white p-1 shadow-inner">
                  {([
                    { key: 'us', label: '美音' },
                    { key: 'uk', label: '英音' },
                  ] as const).map((option) => {
                    const active = accent === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => {
                          const nextAccent = option.key;
                          setAccent(nextAccent);
                          saveSettings({ accent: nextAccent });
                        }}
                        className={`rounded-full px-4 py-2 text-[13px] font-black transition-all ${
                          active ? 'bg-[#1d1d1f] text-white shadow-sm' : 'text-[#636366] hover:bg-[#f5f5f7]'
                        }`}
                        aria-pressed={active}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 text-[12px] font-black uppercase tracking-[0.18em] text-[#86868b]">
                当前：{accentLabel}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => speakItem(selectedItem)}
                className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-[#1d1d1f] px-4 py-3 text-[15px] font-black text-white transition-transform hover:scale-[1.01] active:scale-95"
              >
                <Play className="h-4 w-4" />
                播放例词
              </button>
              <button
                type="button"
                onClick={() => handleFavoriteToggle(selectedItem.id)}
                className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[#d2d2d7] bg-white px-4 py-3 text-[15px] font-black text-[#1d1d1f] transition-transform hover:scale-[1.01] active:scale-95"
                aria-pressed={favoriteSet.has(selectedItem.id)}
              >
                <Star className={`h-4 w-4 ${favoriteSet.has(selectedItem.id) ? 'fill-current text-amber-500' : 'text-[#86868b]'}`} />
                {favoriteSet.has(selectedItem.id) ? '已收藏' : '收藏'}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] bg-[#f5f5f7] p-4">
                <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[#86868b]">发音提示</div>
                <p className="mt-2 text-[16px] font-medium leading-relaxed text-[#1d1d1f]">{selectedItem.cue}</p>
              </div>
              <div className="rounded-[24px] bg-[#f5f5f7] p-4">
                <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[#86868b]">对比重点</div>
                <p className="mt-2 text-[16px] font-medium leading-relaxed text-[#1d1d1f]">{selectedItem.contrast}</p>
              </div>
              <div className="rounded-[24px] bg-[#fff7f3] p-4">
                <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[#f97316]">常见误区</div>
                <p className="mt-2 text-[16px] font-medium leading-relaxed text-[#1d1d1f]">{selectedItem.mistake}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[#86868b]">例词</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedItem.examples.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center rounded-full border border-[#d2d2d7] bg-white px-3 py-2 text-[14px] font-bold text-[#1d1d1f]"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAddToSequence(selectedItem.id)}
                className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[14px] font-black text-[#1d1d1f] transition-all hover:border-blue-200 hover:text-blue-600"
              >
                <Keyboard className="h-4 w-4" />
                加入练习串
              </button>
              <button
                type="button"
                onClick={handleRandomSelect}
                className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[14px] font-black text-[#1d1d1f] transition-all hover:border-blue-200 hover:text-blue-600"
              >
                <Shuffle className="h-4 w-4" />
                随机下一个
              </button>
            </div>
          </section>

          <section className="rounded-[32px] border border-[#d2d2d7]/60 bg-white/85 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.22em] text-[#86868b]">练习串</div>
                <h3 className="mt-1 text-[24px] font-black tracking-tight text-[#1d1d1f]">
                  {sequenceItems.length ? `${sequenceItems.length} 个音标` : '空白'}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopySequence}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d2d2d7] bg-white text-[#1d1d1f] transition-all hover:border-blue-200 hover:text-blue-600"
                  aria-label="复制练习串"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRandomSequence}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d2d2d7] bg-white text-[#1d1d1f] transition-all hover:border-blue-200 hover:text-blue-600"
                  aria-label="随机生成练习串"
                >
                  <Shuffle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handlePlaySequence}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d2d2d7] bg-white text-[#1d1d1f] transition-all hover:border-blue-200 hover:text-blue-600"
                  aria-label="播放练习串"
                >
                  <Play className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] bg-[#f5f5f7] p-4">
              {sequenceItems.length ? (
                <div className="flex flex-wrap gap-2">
                  {sequenceItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSequenceIds((current) => current.filter((id) => id !== item.id))}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[14px] font-black text-[#1d1d1f] shadow-sm transition-transform hover:scale-[1.01]"
                      aria-label={`移除 ${item.symbol}`}
                    >
                      <span>{item.symbol}</span>
                      <X className="h-3.5 w-3.5 text-[#86868b]" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[15px] font-medium leading-relaxed text-[#86868b]">
                  先选几个音标，组成一串练习节奏。
                </p>
              )}
              {sequenceItems.length ? (
                <p className="mt-3 text-[14px] font-medium leading-relaxed text-[#636366]">
                  {formatSequence(sequenceItems)}
                </p>
              ) : null}
            </div>
          </section>

          <PronunciationRecordingCard
            item={selectedItem}
            group={selectedGroup}
            onPracticeComplete={(soundId) => setProgress(markPronunciationPracticed(soundId))}
          />

          <section className="rounded-[32px] border border-[#d2d2d7]/60 bg-white/85 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.22em] text-[#86868b]">听音辨词</div>
                <h3 className="mt-1 text-[24px] font-black tracking-tight text-[#1d1d1f]">{quizRound.quiz.focus}</h3>
              </div>
              <div className="text-[13px] font-black uppercase tracking-[0.2em] text-[#86868b]">
                {quizScore.correct}/{quizScore.total}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <button
                type="button"
                onClick={handleQuizPlay}
                className="flex min-h-[160px] items-center justify-center rounded-[28px] border border-[#d2d2d7] bg-[#f5f5f7] p-6 text-center transition-all hover:border-blue-200 hover:bg-blue-50"
              >
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1d1d1f] text-white">
                    <Volume2 className="h-6 w-6" />
                  </div>
                  <div className="mt-4 text-[18px] font-black text-[#1d1d1f]">
                    {quizPlaying ? '播放中' : '播放题目'}
                  </div>
                  <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#636366]">
                    听完以后，再选左边还是右边。
                  </p>
                </div>
              </button>

              <div className="grid gap-3">
                {(
                  [
                    {
                      side: 'left',
                      word: quizRound.quiz.leftWord,
                      hint: quizRound.quiz.leftHint,
                    },
                    {
                      side: 'right',
                      word: quizRound.quiz.rightWord,
                      hint: quizRound.quiz.rightHint,
                    },
                  ] as const
                ).map((option) => {
                  const resolvedCorrect = quizRound.answerSide === option.side;
                  const resolvedChosen = quizFeedback?.choice === option.side;
                  const activeStyle = quizFeedback
                    ? resolvedCorrect
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : resolvedChosen
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : 'border-[#d2d2d7] bg-white text-[#1d1d1f]'
                    : 'border-[#d2d2d7] bg-white text-[#1d1d1f] hover:border-blue-200 hover:bg-blue-50';

                  return (
                    <button
                      key={option.side}
                      type="button"
                      onClick={() => handleQuizChoice(option.side)}
                      className={`rounded-[24px] border p-5 text-left transition-all ${activeStyle}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[26px] font-black tracking-tight">{option.word}</div>
                          <div className="mt-2 text-[13px] font-black uppercase tracking-[0.18em] opacity-70">
                            {option.hint}
                          </div>
                        </div>
                        {quizFeedback ? (
                          resolvedCorrect ? (
                            <Check className="h-5 w-5" />
                          ) : resolvedChosen ? (
                            <X className="h-5 w-5" />
                          ) : null
                        ) : (
                          <ChevronRightIcon />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`mt-4 rounded-[24px] p-4 ${
                quizFeedback
                  ? quizFeedback.correct
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                  : 'bg-[#f5f5f7] text-[#636366]'
              }`}
            >
              {quizFeedback ? (
                <div className="text-[15px] font-medium leading-relaxed">
                  {quizFeedback.correct ? '答对了。' : `正确答案是 ${quizRound.answerSide === 'left' ? quizRound.quiz.leftWord : quizRound.quiz.rightWord}。`}
                  <span className="ml-2">{quizRound.quiz.explanation}</span>
                </div>
              ) : (
                <div className="text-[15px] font-medium leading-relaxed">
                  {quizRound.quiz.explanation}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleNextQuiz}
                className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[14px] font-black text-[#1d1d1f] transition-all hover:border-blue-200 hover:text-blue-600"
              >
                <RefreshCcw className="h-4 w-4" />
                换一题
              </button>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function ChevronRightIcon() {
  return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f7] text-[#86868b]">›</div>;
}
