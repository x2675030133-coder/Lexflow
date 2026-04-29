import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Headphones, Play, Radio, RefreshCw } from 'lucide-react';
import { type PodcastEpisode } from '../services/podcastService';
import {
  loadPodcastLibrary,
  refreshPodcastLibrary,
  type PodcastLibraryMeta,
} from '../services/podcastLibraryApi';
import { isPodcastLearned } from '../utils/podcastProgress';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';

const PAGE_SIZE = 20;

function formatSyncTime(value?: string | null) {
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

function readSessionPodcastCache(): PodcastEpisode[] {
  try {
    const raw = sessionStorage.getItem('podcast-episode-cache');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.id && item.audioUrl) : [];
  } catch {
    return [];
  }
}

export default function PodcastListeningPage() {
  const navigate = useNavigate();
  const playerRef = useRef<HTMLDivElement | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selected, setSelected] = useState<PodcastEpisode | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [libraryMeta, setLibraryMeta] = useState<PodcastLibraryMeta | null>(null);
  const [page, setPage] = useState(1);

  useStopMediaOnUnmount();

  const loadLibrary = useCallback(async (force = false) => {
    const cachedEpisodes = readSessionPodcastCache();

    if (force) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');
    setNotice('');

    try {
      const data = force ? await refreshPodcastLibrary() : await loadPodcastLibrary();
      const merged = Array.isArray(data.episodes) ? data.episodes : [];

      sessionStorage.setItem('podcast-episode-cache', JSON.stringify(merged));

      setEpisodes(merged);
      setSelected((current) => {
        if (current && merged.some((episode) => episode.id === current.id)) return current;
        return merged[0] || current || null;
      });
      setLibraryMeta(data.meta || null);
      setError(merged.length ? data.error || '' : '');
      setNotice(merged.length ? data.notice || '' : data.notice || data.error || '播客库还没有同步到内容，稍后再试或点刷新即可。');

      if (!merged.length && cachedEpisodes.length) {
        setEpisodes(cachedEpisodes);
        setSelected((current) => current || cachedEpisodes[0] || null);
        setNotice('已回退到本地缓存，稍后会再次尝试同步。');
      }
    } catch {
      if (cachedEpisodes.length) {
        setEpisodes(cachedEpisodes);
        setSelected((current) => current || cachedEpisodes[0] || null);
        setNotice('播客库同步失败，已保留本地缓存。');
      } else {
        setError('播客库暂时不可用，请稍后再试。');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLibrary(false);
  }, [loadLibrary]);

  const sortedEpisodes = useMemo(() => {
    return [...episodes].sort((a, b) => {
      const learnedA = isPodcastLearned(a.id);
      const learnedB = isPodcastLearned(b.id);
      if (learnedA !== learnedB) return learnedA ? 1 : -1;
      return (b.publishedAt || '').localeCompare(a.publishedAt || '');
    });
  }, [episodes]);

  const totalPages = Math.max(Math.ceil(sortedEpisodes.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);
  const pageItems = sortedEpisodes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const learnedCount = sortedEpisodes.filter((episode) => isPodcastLearned(episode.id)).length;
  const currentAudio = selected?.audioUrl || '';
  const metaSources = libraryMeta?.sources || [];

  const handleSelect = (episode: PodcastEpisode) => {
    setSelected(episode);
    window.setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const openPractice = (episode: PodcastEpisode) => {
    sessionStorage.setItem(`podcast-episode:${episode.id}`, JSON.stringify(episode));
    navigate(`/listening/podcasts/${encodeURIComponent(episode.id)}`);
  };

  const handleRefresh = () => {
    void loadLibrary(true);
  };

  return (
    <main className="podcast-page mx-auto max-w-5xl px-4 py-12 md:py-16 text-slate-950">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <button
            onClick={() => navigate('/listening')}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            <ChevronLeft className="h-4 w-4" />
            返回听力练习
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Headphones className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">播客听力</h1>
              <p className="mt-1 text-slate-600">内容会自动同步 VOA 和 NPR 的公开音频，随时打开都能看到最新一期。</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-700">
              最近同步 {formatSyncTime(libraryMeta?.lastSyncAt || libraryMeta?.generatedAt)}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">
              来源 {libraryMeta?.sourceCount || 0} 个
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">
              条目 {libraryMeta?.episodeCount || sortedEpisodes.length} 条
            </span>
          </div>
          {metaSources.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {metaSources.map((source) => (
                <span
                  key={source.source}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-500"
                >
                  {source.source} · {source.count}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? '正在同步...' : '刷新'}
        </button>
      </header>

      {notice ? (
        <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
          {notice}
        </div>
      ) : null}

      <section ref={playerRef} className="mb-10 rounded-[28px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/70">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950">当前播放</h2>
            <p className="text-sm text-slate-600">点击任意卡片后，播放器会自动切换到对应音频。</p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          {currentAudio ? (
            <audio key={currentAudio} controls autoPlay src={currentAudio} className="w-full apple-audio-player" />
          ) : (
            <div className="flex h-14 items-center justify-center text-sm font-medium text-slate-400">暂无可播放音频</div>
          )}
        </div>
      </section>

      {error ? (
        <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex items-center justify-between px-1">
        <h3 className="text-xl font-black text-slate-950">最新播客 ({sortedEpisodes.length})</h3>
        <div className="text-sm font-semibold text-slate-500">
          已学习 <span className="text-blue-600">{learnedCount}</span>/{sortedEpisodes.length}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-[24px] border border-slate-100 bg-white shadow-sm" />
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <section className="rounded-[28px] border border-slate-100 bg-white py-20 text-center shadow-sm">
          <Radio className="mx-auto mb-4 h-14 w-14 text-slate-300" />
          <p className="text-lg font-semibold text-slate-700">暂无播客数据</p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {pageItems.map((episode) => {
            const learned = isPodcastLearned(episode.id);
            const isSelected = selected?.id === episode.id;

            return (
              <article
                key={episode.id}
                onClick={() => handleSelect(episode)}
                className={`cursor-pointer rounded-[24px] border bg-white p-6 shadow-sm shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/60 ${
                  isSelected ? 'border-blue-300 ring-2 ring-blue-200' : 'border-slate-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className={`truncate text-lg font-black ${isSelected ? 'text-blue-600' : 'text-slate-950'}`}>
                        {episode.title}
                      </h3>
                      {learned ? (
                        <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                          已学习
                        </span>
                      ) : null}
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <span className="rounded-lg bg-slate-100 px-2 py-1">{episode.source}</span>
                      <span>{episode.publishedAt || '暂无日期'}</span>
                    </div>
                    <p className="line-clamp-3 text-sm leading-6 text-slate-600">{episode.description}</p>
                  </div>
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    <Play className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSelect(episode);
                    }}
                    className={`text-xs font-bold transition ${isSelected ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}
                  >
                    {isSelected ? '正在播放' : '播放音频'}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openPractice(episode);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-600"
                  >
                    进入练习
                    <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <div className="mt-12 flex items-center justify-center gap-2">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          上一页
        </button>

        <div className="flex items-center gap-1 px-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((num) => {
            if (totalPages > 7 && num !== 1 && num !== totalPages && Math.abs(num - currentPage) > 1) {
              if (num === 2 || num === totalPages - 1) return <span key={num} className="px-1 text-slate-400">...</span>;
              return null;
            }

            return (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`h-10 min-w-10 rounded-xl text-sm font-bold transition ${
                  num === currentPage
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-blue-700'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          下一页
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
}
