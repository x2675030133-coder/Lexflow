import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  FileText,
  Flame,
  Headphones,
  Podcast,
  Target,
  X,
} from 'lucide-react';
import { words } from '../data/words';
import { allListeningExercises } from '../data/listeningLibrary';
import { getAllArticles } from '../data/readingLibrary';
import { PHONEME_LOOKUP } from '../data/phonetics';
import { getLearnedListeningIds } from '../utils/listeningProgress';
import { getLearnedPodcastIds } from '../utils/podcastProgress';
import { getPronunciationProgress } from '../utils/pronunciationProgress';
import { getReadArticleIds } from '../utils/readingProgress';
import { loadWordList } from '../utils/wordListService';
import { getDailyStats, getProgress } from '../utils/storage';
import { getPrimaryMeaning } from '../data/wordUsageNotes';

type DetailMode = 'today' | 'mastered';
type DetailTab = 'words' | 'listening' | 'podcasts' | 'reading' | 'pronunciation';

type DetailEntry = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
};

function loadPodcastTitleMap(): Map<string, { title: string; source?: string }> {
  const map = new Map<string, { title: string; source?: string }>();

  try {
    const raw = sessionStorage.getItem('podcast-episode-cache');
    if (!raw) return map;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return map;

    parsed.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const id = String((item as { id?: string }).id || '');
      if (!id) return;
      map.set(id, {
        title: String((item as { title?: string }).title || id),
        source: String((item as { podcastTitle?: string }).podcastTitle || ''),
      });
    });
  } catch {
    // ignore
  }

  return map;
}

export default function DashboardPage() {
  const [progress, setProgress] = useState(() => getProgress());
  const [stats, setStats] = useState(() => getDailyStats());
  const [learnedListeningIds, setLearnedListeningIds] = useState(() => Array.from(getLearnedListeningIds()));
  const [learnedPodcastIds, setLearnedPodcastIds] = useState(() => Array.from(getLearnedPodcastIds()));
  const [pronunciationProgress, setPronunciationProgress] = useState(() => getPronunciationProgress());
  const [readArticleIds, setReadArticleIds] = useState(() => Array.from(getReadArticleIds()));
  const [detailMode, setDetailMode] = useState<DetailMode | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('words');

  useEffect(() => {
    function refresh() {
      setProgress(getProgress());
      setStats(getDailyStats());
      setLearnedListeningIds(Array.from(getLearnedListeningIds()));
      setLearnedPodcastIds(Array.from(getLearnedPodcastIds()));
      setPronunciationProgress(getPronunciationProgress());
      setReadArticleIds(Array.from(getReadArticleIds()));
    }

    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('el-progress-changed', refresh as EventListener);
    window.addEventListener('el-pronunciation-changed', refresh as EventListener);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('el-progress-changed', refresh as EventListener);
      window.removeEventListener('el-pronunciation-changed', refresh as EventListener);
    };
  }, []);

  const records = useMemo(() => Object.values(progress.records), [progress.records]);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const masteredCount = records.filter((record) => record.mastered).length;
  const learningCount = records.filter(
    (record) => !record.mastered && (record.correctCount > 0 || record.wrongCount > 0),
  ).length;
  const totalAttempts = records.reduce((sum, record) => sum + record.correctCount + record.wrongCount, 0);
  const totalCorrect = records.reduce((sum, record) => sum + record.correctCount, 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const pronunciationPracticedCount = pronunciationProgress.practiced.length;
  const pronunciationFavoriteCount = pronunciationProgress.favorites.length;

  const wordMap = useMemo(() => {
    const map = new Map<string, (typeof words)[number]>();
    words.forEach((item) => map.set(item.id, item));
    return map;
  }, []);

  const [resolvedWordMap, setResolvedWordMap] = useState(() => new Map(wordMap));

  useEffect(() => {
    let cancelled = false;

    const resolveCurrentWordList = async () => {
      try {
        const currentListWords = await loadWordList(progress.currentListId);
        if (cancelled) return;

        const nextMap = new Map(wordMap);
        currentListWords.forEach((item) => nextMap.set(item.id, item));
        setResolvedWordMap(nextMap);
      } catch {
        if (!cancelled) {
          setResolvedWordMap(new Map(wordMap));
        }
      }
    };

    resolveCurrentWordList();

    return () => {
      cancelled = true;
    };
  }, [progress.currentListId, wordMap]);

  const listeningMap = useMemo(() => {
    const map = new Map<string, (typeof allListeningExercises)[number]>();
    allListeningExercises.forEach((item) => map.set(String(item.id), item));
    return map;
  }, []);

  const readingMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getAllArticles>[number]>();
    getAllArticles().forEach((article) => map.set(article.id, article));
    return map;
  }, []);

  const podcastTitleMap = useMemo(loadPodcastTitleMap, []);

  const todayWordEntries = useMemo<DetailEntry[]>(
    () =>
      records
        .filter((record) => record.lastReviewDate === today)
        .sort((left, right) => right.correctCount + right.wrongCount - (left.correctCount + left.wrongCount))
        .map((record) => {
          const word = resolvedWordMap.get(record.wordId);
          return {
            id: record.wordId,
            title: word?.word || record.wordId,
            subtitle: word ? getPrimaryMeaning(word) : '暂无释义',
            meta: `Lv.${record.level} · 对 ${record.correctCount} / 错 ${record.wrongCount}`,
          };
        }),
    [records, today, resolvedWordMap],
  );

  const masteredWordEntries = useMemo<DetailEntry[]>(
    () =>
      records
        .filter((record) => record.mastered)
        .sort((left, right) => right.level - left.level)
        .map((record) => {
          const word = resolvedWordMap.get(record.wordId);
          return {
            id: record.wordId,
            title: word?.word || record.wordId,
            subtitle: word ? getPrimaryMeaning(word) : '暂无释义',
            meta: `Lv.${record.level} · 对 ${record.correctCount} / 错 ${record.wrongCount}`,
          };
        }),
    [records, resolvedWordMap],
  );

  const listeningEntries = useMemo<DetailEntry[]>(
    () =>
      learnedListeningIds.map((id) => {
        const exercise = listeningMap.get(String(id));
        const sentenceCount = exercise?.sentences?.length || 0;
        return {
          id: String(id),
          title: exercise?.title || `听力练习 ${id}`,
          subtitle: exercise?.titleZh || exercise?.category || '听力材料',
          meta: `${sentenceCount} 句 · ${exercise?.difficulty || '未知难度'}`,
        };
      }),
    [learnedListeningIds, listeningMap],
  );

  const podcastEntries = useMemo<DetailEntry[]>(
    () =>
      learnedPodcastIds.map((id) => {
        const info = podcastTitleMap.get(String(id));
        return {
          id: String(id),
          title: info?.title || `播客 ${id}`,
          subtitle: info?.source || '播客练习',
          meta: '已完成',
        };
      }),
    [learnedPodcastIds, podcastTitleMap],
  );

  const pronunciationEntries = useMemo<DetailEntry[]>(
    () =>
      pronunciationProgress.practiced.map((soundId) => {
        const sound = PHONEME_LOOKUP[soundId];
        return {
          id: soundId,
          title: sound?.symbol || soundId,
          subtitle: sound?.examples?.join(' · ') || '音标练习',
          meta: sound ? sound.cue : '练习过的音标',
        };
      }),
    [pronunciationProgress.practiced],
  );

  const readingEntries = useMemo<DetailEntry[]>(
    () =>
      readArticleIds.map((id) => {
        const article = readingMap.get(String(id));
        return {
          id: String(id),
          title: article?.titleEn || `阅读文章 ${id}`,
          subtitle: article?.titleZh || '双语阅读',
          meta: article?.date || '已完成',
        };
      }),
    [readArticleIds, readingMap],
  );

  const lastSevenDays = useMemo(() => {
    const source = [...stats].slice(-7);
    while (source.length < 7) {
      source.unshift({ date: '', learned: 0, reviewed: 0, correctRate: 0, timeSpent: 0 });
    }
    return source;
  }, [stats]);

  const metrics = [
    {
      key: 'today' as const,
      icon: Target,
      label: '今日已学',
      value: progress.learnedToday,
      color: '#0071e3',
      clickable: true,
    },
    {
      key: 'streak' as const,
      icon: Flame,
      label: '连续打卡',
      value: progress.streak,
      color: '#ff9500',
      clickable: false,
    },
    {
      key: 'mastered' as const,
      icon: CheckCircle2,
      label: '已掌握词汇',
      value: masteredCount,
      color: '#34c759',
      clickable: true,
    },
    {
      key: 'accuracy' as const,
      icon: BarChart3,
      label: '准确率',
      value: `${accuracy}%`,
      color: '#af52de',
      clickable: false,
    },
    {
      key: 'pronunciation' as const,
      icon: Headphones,
      label: '音标练习',
      value: pronunciationPracticedCount,
      color: '#0ea5e9',
      clickable: true,
    },
  ];

  const detailTabs = detailMode === 'mastered'
    ? [{ key: 'words' as const, label: `单词 ${masteredWordEntries.length}`, icon: BookMarked }]
    : [
        { key: 'words' as const, label: `单词 ${todayWordEntries.length}`, icon: BookMarked },
        { key: 'listening' as const, label: `听力 ${listeningEntries.length}`, icon: Headphones },
        { key: 'podcasts' as const, label: `播客 ${podcastEntries.length}`, icon: Podcast },
        { key: 'reading' as const, label: `阅读 ${readingEntries.length}`, icon: FileText },
        { key: 'pronunciation' as const, label: `音标 ${pronunciationEntries.length}`, icon: Headphones },
      ];

  const activeEntries = useMemo<DetailEntry[]>(() => {
    if (!detailMode) return [];

    if (detailMode === 'mastered') {
      return masteredWordEntries;
    }

    switch (activeTab) {
      case 'words':
        return todayWordEntries;
      case 'listening':
        return listeningEntries;
      case 'podcasts':
        return podcastEntries;
      case 'reading':
        return readingEntries;
      case 'pronunciation':
        return pronunciationEntries;
      default:
        return [];
    }
  }, [detailMode, activeTab, masteredWordEntries, todayWordEntries, listeningEntries, podcastEntries, readingEntries, pronunciationEntries]);

  const detailTitle = detailMode === 'mastered'
    ? '已掌握明细'
    : activeTab === 'pronunciation'
      ? '音标练习明细'
      : '学习明细';
  const detailHint = detailMode === 'mastered'
    ? '这里展示你已掌握的词汇，可用于复习巩固。'
    : activeTab === 'pronunciation'
      ? `这里展示你练过的音标，收藏 ${pronunciationFavoriteCount} 个。`
    : activeTab === 'words'
      ? '这里展示今天学习/复习过的单词。'
      : '这里展示当前账号累计学习过的内容。';

  const openDetail = (mode: DetailMode) => {
    setDetailMode(mode);
    setActiveTab('words');
  };

  const openPronunciationDetail = () => {
    setDetailMode('today');
    setActiveTab('pronunciation');
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 text-[#1d1d1f]">
      <header className="mb-16">
        <h1 className="mb-4 text-[48px] font-black leading-tight tracking-tight sm:text-[56px]">学习统计</h1>
        <p className="max-w-2xl text-[21px] font-medium leading-relaxed text-[#86868b]">
          实时掌握你的英语学习进度与成果，每一份努力都清晰可见。
        </p>
      </header>

      <section className="mb-16 grid gap-8 md:grid-cols-3 xl:grid-cols-5">
        {metrics.map((item, index) => {
          const Icon = item.icon;
          const isClickable = item.clickable;
          const mode = item.key === 'today' ? 'today' : item.key === 'mastered' ? 'mastered' : null;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (isClickable && mode) openDetail(mode);
                if (isClickable && item.key === 'pronunciation') openPronunciationDetail();
              }}
              style={{ animationDelay: `${index * 100}ms` }}
              className={`apple-card animate-stat-in flex flex-col items-start p-10 text-left ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className="mb-10 flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundColor: `${item.color}10`, color: item.color }}
              >
                <Icon size={28} />
              </div>
              <div className="mb-2 text-[42px] font-black leading-none tracking-tight text-[#1d1d1f]">{item.value}</div>
              <div className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#86868b]">{item.label}</div>
              {isClickable && (
                <div className="mt-5 flex items-center gap-1.5 text-[13px] font-bold text-[#0071e3] opacity-0 group-hover:opacity-100 transition-opacity">
                  查看明细 <Target size={14} />
                </div>
              )}
            </button>
          );
        })}
      </section>

      <div className="mb-16 grid gap-8 lg:grid-cols-3">
        <section className="apple-card p-10 lg:col-span-2 reveal-1">
          <h2 className="mb-12 flex items-center gap-3 text-[24px] font-black tracking-tight">
            <CalendarDays className="text-[#0071e3]" size={26} />
            最近 7 天活跃度
          </h2>
          <div className="flex h-60 items-end gap-5 px-2 sm:gap-8">
            {lastSevenDays.map((day, index) => {
              const maxVal = Math.max(...lastSevenDays.map((item) => item.learned), 10);
              const height = (day.learned / maxVal) * 100;
              return (
                <div key={`${day.date}-${index}`} className="group relative flex flex-1 flex-col items-center">
                  <div className="pointer-events-none absolute -top-12 rounded-[12px] bg-[#1d1d1f] px-4 py-2 text-[13px] font-bold text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-2 shadow-xl z-20">
                    {day.learned} 词
                  </div>
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-b from-[#0071e3] to-indigo-400 animate-bar-grow shadow-sm group-hover:brightness-110 group-hover:shadow-lg transition-all"
                    style={{ 
                      height: `${Math.max(8, height)}%`,
                      animationDelay: `${index * 100}ms`
                    }}
                  />
                  <div className="mt-6 text-[13px] font-bold uppercase tracking-wider text-[#86868b]">
                    {day.date ? new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' }) : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="apple-card p-10 reveal-2">
          <h2 className="mb-12 flex items-center gap-3 text-[24px] font-black tracking-tight">
            <BookMarked className="text-[#0071e3]" size={26} />
            词库掌握概览
          </h2>
          <div className="space-y-12">
            {[
              ['已掌握核心', masteredCount, '#34c759'],
              ['正在攻克', learningCount, '#0071e3'],
              ['收藏生词', progress.favorites.length, '#ff9500'],
            ].map(([label, value, color], index) => (
              <div key={String(label)}>
                <div className="mb-4 flex items-end justify-between">
                  <span className="text-[16px] font-bold tracking-tight text-[#1d1d1f]">{label}</span>
                  <span className="text-[19px] font-black text-[#1d1d1f]">{value}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#f5f5f7] shadow-inner">
                  <div
                    className="h-full rounded-full animate-progress-grow shadow-sm"
                    style={{
                      width: `${Math.min(100, ((Number(value) || 0) / (records.length || 1)) * 100)}%`,
                      backgroundColor: String(color),
                      animationDelay: `${index * 200}ms`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>


      <section>
        <div className="apple-card p-10">
          <h2 className="mb-8 text-[22px] font-black tracking-tight">近期复习轨迹</h2>
          <div className="flex flex-wrap gap-4">
            {records.slice(-15).reverse().map((record) => {
              const word = wordMap.get(record.wordId);
              return (
                <div key={record.wordId} className="group relative">
                  <span className="inline-flex cursor-default items-center gap-2 rounded-2xl border border-[#d2d2d7]/50 bg-white px-5 py-3 text-[16px] font-bold text-[#1d1d1f] transition-all hover:scale-105 hover:border-[#0071e3] hover:text-[#0071e3]">
                    {word?.word || record.wordId}
                    <span className="text-[12px] font-black tracking-tighter opacity-40">LV.{record.level}</span>
                  </span>
                </div>
              );
            })}
            {records.length === 0 && (
              <div className="w-full py-12 text-center">
                <p className="text-[17px] font-medium text-[#86868b]">暂无学习记录，先去背几个单词再回来看看吧。</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {detailMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
          onClick={() => setDetailMode(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-4xl rounded-[28px] border border-[#d2d2d7]/40 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between border-b border-[#d2d2d7]/40 px-8 py-6">
              <div>
                <h3 className="text-[28px] font-black tracking-tight">{detailTitle}</h3>
                <p className="mt-1 text-[15px] text-[#86868b]">{detailHint}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailMode(null)}
                className="rounded-full p-2 text-[#86868b] transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
                aria-label="关闭详情"
              >
                <X size={22} />
              </button>
            </div>

            <div className="px-8 py-6">
              <div className="mb-5 flex flex-wrap gap-2">
                {detailTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-bold transition-all ${
                        active
                          ? 'border-[#0071e3] bg-[#0071e3] text-white'
                          : 'border-[#d2d2d7] bg-white text-[#1d1d1f] hover:border-[#0071e3]'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="max-h-[460px] overflow-auto rounded-2xl border border-[#e5e5ea]">
                {activeEntries.length === 0 ? (
                  <div className="p-10 text-center text-[15px] font-medium text-[#86868b]">当前没有可展示的数据。</div>
                ) : (
                  <ul className="divide-y divide-[#f2f2f7]">
                    {activeEntries.map((entry) => (
                      <li key={`${activeTab}-${entry.id}`} className="px-6 py-4">
                        <div className="text-[17px] font-bold text-[#1d1d1f]">{entry.title}</div>
                        {entry.subtitle && <div className="mt-1 text-[15px] text-[#4b5563]">{entry.subtitle}</div>}
                        <div className="mt-1 text-[13px] text-[#86868b]">{entry.meta || entry.id}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
