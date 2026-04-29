import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Headphones, Mic, PenLine, Radio } from 'lucide-react';
import { allListeningExercises } from '../data/listeningLibrary';
import { loadPodcastLibrary, type PodcastLibraryMeta } from '../services/podcastLibraryApi';
import { type PodcastEpisode } from '../services/podcastService';
import { isListeningLearned } from '../utils/listeningProgress';

const PAGE_SIZE = 12;

const difficulties = ['all', 'beginner', 'intermediate', 'advanced'] as const;
const difficultyTabs: Record<string, string> = {
  all: '全部',
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
};

const difficultyLabels: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
};

const categories = ['all', 'daily-conversation', 'news', 'speech', 'academic', 'ielts'] as const;
const categoryTabs: Record<string, string> = {
  all: '全部分类',
  'daily-conversation': '日常对话',
  news: '新闻听力',
  speech: '演讲片段',
  academic: '学术讲座',
  ielts: '雅思听力',
};

const categoryIcons: Record<string, string> = {
  'daily-conversation': '💬',
  news: '📰',
  speech: '🎤',
  academic: '📚',
  ielts: '🎧',
};

function formatPodcastSyncTime(value?: string | null) {
  if (!value) return '暂无同步记录';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '暂无同步记录';

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function useListeningFilters() {
  const [selectedDifficulty, setSelectedDifficultyState] = useState<string>('all');
  const [selectedCategory, setSelectedCategoryState] = useState<string>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const items = allListeningExercises.filter((exercise) => {
      const matchDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty;
      const matchCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
      return matchDifficulty && matchCategory;
    });

    return items.sort((a, b) => {
      const learnedA = isListeningLearned(a.id);
      const learnedB = isListeningLearned(b.id);
      if (learnedA !== learnedB) return learnedA ? 1 : -1;
      return a.title.localeCompare(b.title);
    });
  }, [selectedCategory, selectedDifficulty]);

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return {
    selectedDifficulty,
    selectedCategory,
    setSelectedDifficulty: (value: string) => {
      setSelectedDifficultyState(value);
      setPage(1);
    },
    setSelectedCategory: (value: string) => {
      setSelectedCategoryState(value);
      setPage(1);
    },
    page,
    setPage,
    currentPage,
    totalPages,
    filtered,
    pageItems,
  };
}

export default function ListeningPage() {
  const {
    selectedDifficulty,
    selectedCategory,
    setSelectedDifficulty,
    setSelectedCategory,
    page,
    setPage,
    currentPage,
    totalPages,
    filtered,
    pageItems,
  } = useListeningFilters();

  const containerRef = useRef<HTMLDivElement>(null);
  const [podcastEpisodes, setPodcastEpisodes] = useState<PodcastEpisode[]>([]);
  const [podcastMeta, setPodcastMeta] = useState<PodcastLibraryMeta | null>(null);
  const [podcastLoading, setPodcastLoading] = useState(true);
  const [podcastNotice, setPodcastNotice] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements = entry.target.querySelectorAll('.reveal-on-scroll');
            elements.forEach((el, i) => {
              setTimeout(() => {
                el.classList.add('is-visible');
              }, i * 100);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      const sections = containerRef.current.querySelectorAll('.reveal-section');
      sections.forEach((section) => observer.observe(section));
    }

    return () => observer.disconnect();
  }, [pageItems]);

  useEffect(() => {
    let active = true;

    const loadPodcastPreview = async () => {
      setPodcastLoading(true);
      try {
        const data = await loadPodcastLibrary();
        if (!active) return;

        const merged = Array.isArray(data.episodes) ? data.episodes : [];
        setPodcastEpisodes(merged.slice(0, 3));
        setPodcastMeta(data.meta || null);
        setPodcastNotice(data.notice || (merged.length ? '' : '播客内容正在同步中，稍后会自动补全到这里。'));
      } catch {
        if (!active) return;
        setPodcastEpisodes([]);
        setPodcastMeta(null);
        setPodcastNotice('播客内容暂时还没同步出来，先点进播客页刷新一下即可。');
      } finally {
        if (active) setPodcastLoading(false);
      }
    };

    void loadPodcastPreview();

    return () => {
      active = false;
    };
  }, []);

  const learnedCount = filtered.filter((item) => isListeningLearned(item.id)).length;
  const podcastSourceCount = podcastMeta?.sourceCount || 0;
  const podcastEpisodeCount = podcastMeta?.episodeCount || podcastEpisodes.length;

  return (
    <main ref={containerRef} className="listening-page mx-auto max-w-6xl px-6 py-16 text-[#1d1d1f]">
      <section className="mb-16 reveal-1">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[13px] font-black uppercase tracking-widest text-blue-600 shadow-sm">
          <Headphones className="h-4 w-4" />
          Listening & Speaking
        </div>
        <h1 className="mb-6 text-[48px] font-black leading-tight tracking-tight sm:text-[56px]">听力口语练习</h1>
        <p className="max-w-2xl text-[21px] font-medium leading-relaxed text-[#86868b]">
          听写、跟读、填空三种模式，围绕真实语境训练听力和口语。雅思听力会单独分类，适合按考试节奏来练。
        </p>
      </section>

      <section className="mb-16 grid grid-cols-1 gap-8 sm:grid-cols-3 reveal-section">
        <div className="reveal-on-scroll apple-card p-10">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0071e3]/5 text-[#0071e3] shadow-inner">
            <PenLine className="h-8 w-8" />
          </div>
          <h3 className="mb-4 text-[22px] font-black tracking-tight">听写模式</h3>
          <p className="text-[17px] font-medium leading-relaxed text-[#86868b]">先听完整句子，再写出你听到的内容，训练捕捉细节和拼写能力。</p>
        </div>
        <div className="reveal-on-scroll apple-card p-10">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#34c759]/5 text-[#34c759] shadow-inner">
            <Mic className="h-8 w-8" />
          </div>
          <h3 className="mb-4 text-[22px] font-black tracking-tight">跟读模式</h3>
          <p className="text-[17px] font-medium leading-relaxed text-[#86868b]">看句子，跟着语音朗读练习，适合纠正节奏、重音和语感。</p>
        </div>
        <div className="reveal-on-scroll apple-card p-10">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#af52de]/5 text-[#af52de] shadow-inner">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="mb-4 text-[22px] font-black tracking-tight">填空模式</h3>
          <p className="text-[17px] font-medium leading-relaxed text-[#86868b]">听句子，补全缺失关键词，适合强化高频表达和核心词汇记忆。</p>
        </div>
      </section>

      <section className="mb-16 overflow-hidden rounded-[40px] border border-[#d2d2d7]/30 bg-white/70 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl reveal-section">
        <div className="reveal-on-scroll grid gap-8 p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#0071e3] to-[#5856d6] text-white shadow-xl shadow-blue-500/25">
                <Radio className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-[28px] font-black tracking-tight text-[#1d1d1f]">播客听力预览</h2>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-[12px] font-black text-blue-700">
                    最近同步 {formatPodcastSyncTime(podcastMeta?.lastSyncAt || podcastMeta?.generatedAt)}
                  </span>
                  <span className="rounded-full border border-[#d2d2d7]/40 bg-white px-3 py-1 text-[12px] font-black text-[#86868b]">
                    来源 {podcastSourceCount} 个
                  </span>
                  <span className="rounded-full border border-[#d2d2d7]/40 bg-white px-3 py-1 text-[12px] font-black text-[#86868b]">
                    条目 {podcastEpisodeCount} 条
                  </span>
                </div>
                <p className="max-w-3xl text-[17px] font-medium leading-relaxed text-[#86868b]">
                  这里会直接展示当前同步到的播客内容摘要，方便你在听力首页先扫一眼，确认有没有新内容，再决定要不要进去练。
                </p>
              </div>
            </div>

            {podcastNotice ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-[15px] font-semibold text-blue-700">
                {podcastNotice}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Link
                to="/listening/podcasts"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0071e3] px-8 text-[15px] font-black text-white no-underline shadow-xl shadow-blue-500/20 transition-all hover:bg-[#0077ed] hover:scale-[1.02] active:scale-95"
              >
                进入播客页
                <ArrowRight className="h-5 w-5" />
              </Link>
              <span className="inline-flex h-12 items-center rounded-full border border-[#d2d2d7]/40 bg-white px-5 text-[14px] font-black text-[#86868b]">
                {podcastLoading ? '正在同步预览...' : '预览已接入外层'}
              </span>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d2d2d7]/30 bg-white px-6 py-4 shadow-inner">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.26em] text-[#86868b]">Latest</p>
                <h3 className="mt-1 text-[20px] font-black tracking-tight text-[#1d1d1f]">最新播客</h3>
              </div>
              <Link to="/listening/podcasts" className="text-sm font-bold text-[#0071e3] transition hover:text-[#005bb5]">
                查看全部
              </Link>
            </div>
            {podcastEpisodes.length ? (
              <div className="divide-y divide-[#f0f0f4]">
                {podcastEpisodes.map((episode) => (
                  <Link
                    key={episode.id}
                    to="/listening/podcasts"
                    className="flex items-start justify-between gap-4 py-4 no-underline transition hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-black text-[#1d1d1f]">{episode.title}</div>
                      <div className="mt-1 line-clamp-2 text-[13px] font-medium leading-relaxed text-[#86868b]">
                        {episode.description || '暂无简介'}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-[12px] font-bold text-[#86868b]">
                      <div>{episode.source}</div>
                      <div className="mt-1">{episode.publishedAt ? episode.publishedAt.slice(0, 10) : '最新'}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-[#d2d2d7]/50 bg-[#f5f5f7] px-6 py-10 text-center">
                <Radio className="mx-auto mb-4 h-10 w-10 text-[#d2d2d7]" />
                <p className="text-[15px] font-semibold text-[#86868b]">暂时还没有同步到播客内容，稍后会自动补到这里。</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-12 space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="inline-flex rounded-full border border-[#d2d2d7]/30 bg-[#f5f5f7] p-1.5">
            {difficulties.map((item) => (
              <button
                key={item}
                onClick={() => setSelectedDifficulty(item)}
                className={`rounded-full px-8 py-2.5 text-[15px] font-black transition-all ${
                  selectedDifficulty === item
                    ? 'bg-white text-[#0071e3] shadow-sm'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                {difficultyTabs[item]}
              </button>
            ))}
          </div>
          <div className="text-[15px] font-black uppercase tracking-widest text-[#86868b]">
            已学习 <span className="text-[#0071e3]">{learnedCount}</span> / {filtered.length}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setSelectedCategory(item)}
              className={`rounded-full border px-6 py-2.5 text-[15px] font-black transition-all ${
                selectedCategory === item
                  ? 'border-transparent bg-[#0071e3] text-white shadow-lg shadow-blue-500/20'
                  : 'border-[#d2d2d7]/50 bg-white text-[#1d1d1f] hover:border-[#0071e3] hover:text-[#0071e3]'
              }`}
            >
              {categoryIcons[item] ? <span className="mr-2">{categoryIcons[item]}</span> : null}
              {categoryTabs[item]}
            </button>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className="rounded-[40px] border border-[#d2d2d7]/30 bg-white/50 py-32 text-center shadow-inner">
          <Headphones className="mx-auto mb-6 h-20 w-20 text-[#d2d2d7] opacity-50" />
          <p className="text-[21px] font-bold text-[#86868b]">没有找到匹配的听力练习</p>
        </section>
      ) : (
        <>
          <div className="mb-10 flex items-center justify-between px-2">
            <h2 className="text-[24px] font-black tracking-tight">全部练习 ({filtered.length})</h2>
            <span className="text-[14px] font-black uppercase tracking-widest text-[#86868b]">第 {currentPage} / {totalPages} 页</span>
          </div>

          <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 reveal-section">
            {pageItems.map((exercise) => {
              const learned = isListeningLearned(exercise.id);

              return (
                <Link
                  key={exercise.id}
                  to={`/listening/${exercise.id}`}
                  className="group apple-card reveal-on-scroll flex aspect-square flex-col overflow-hidden text-[#1d1d1f] no-underline"
                >
                  <div className="relative flex h-full flex-col p-8">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-tight text-blue-600">
                        {difficultyLabels[exercise.difficulty]}
                      </span>
                      {learned ? (
                        <span className="rounded-full bg-[#34c759] px-2.5 py-1 text-[10px] font-black text-white shadow-lg shadow-green-500/20">已学习</span>
                      ) : null}
                    </div>

                    <div className="flex flex-1 flex-col items-center justify-center text-center">
                      <span className="mb-4 text-[56px] transition-transform duration-500 group-hover:scale-110 drop-shadow-sm">
                        {categoryIcons[exercise.category] || '🎧'}
                      </span>
                      <h3 className="mb-2 line-clamp-2 px-2 text-[20px] font-black leading-[1.2] tracking-tight transition-colors group-hover:text-[#0071e3]">
                        {exercise.title}
                      </h3>
                      <p className="text-[14px] font-bold uppercase tracking-widest text-[#86868b]">{categoryTabs[exercise.category]}</p>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-[#f5f5f7] pt-6">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-[12px] font-black text-[#1d1d1f]">
                          <Headphones className="h-3 w-3 text-[#86868b]" />
                          {exercise.sentences.length} 句
                        </span>
                        <span className="max-w-[120px] truncate text-[11px] font-medium text-[#86868b]">{exercise.titleZh}</span>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f7] text-[#1d1d1f] transition-all group-hover:translate-x-1 group-hover:bg-[#0071e3] group-hover:text-white">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>

          <div className="mt-20 flex items-center justify-center gap-4 reveal-1">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[#d2d2d7]/50 bg-white px-6 text-[15px] font-black text-[#1d1d1f] transition-all hover:border-[#0071e3] hover:text-[#0071e3] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
              上一页
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((num) => {
                if (totalPages > 7 && num !== 1 && num !== totalPages && Math.abs(num - currentPage) > 1) {
                  if (num === 2 || num === totalPages - 1) return <span key={num} className="font-black text-[#d2d2d7]">...</span>;
                  return null;
                }

                return (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`h-12 w-12 rounded-full text-[15px] font-black transition-all ${
                      num === currentPage
                        ? 'scale-110 bg-[#0071e3] text-white shadow-xl shadow-blue-500/25'
                        : 'text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[#d2d2d7]/50 bg-white px-6 text-[15px] font-black text-[#1d1d1f] transition-all hover:border-[#0071e3] hover:text-[#0071e3] disabled:cursor-not-allowed disabled:opacity-30"
            >
              下一页
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </main>
  );
}
