import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, ChevronRight, FileText, Tag } from 'lucide-react';
import { categoryIcons, categoryLabels } from '../data/articles';
import {
  getAllArticles,
  getGeneratedReadingMeta,
  getLastSuccessfulReadingSyncAt,
  getReadingCacheBackupInfo,
  refreshGeneratedArticles,
  refreshGeneratedReadingMeta,
  restorePreviousReadingCache,
  shouldAutoRefreshReadingLibrary,
} from '../data/readingLibrary';
import ReadingGenerationStatus from '../components/ReadingGenerationStatus';
import { fetchAppConfig } from '../services/apiConfig';
import { refreshReadingCache } from '../services/readingFeed';
import { isArticleRead } from '../utils/readingProgress';

const categories = ['all', 'technology', 'culture', 'education', 'environment', 'news'] as const;
const AUTO_REFRESH_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export default function ArticleListPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshTick, setRefreshTick] = useState(0);
  const [generatedMeta, setGeneratedMeta] = useState(getGeneratedReadingMeta());
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(getLastSuccessfulReadingSyncAt());
  const [hasBackupCache, setHasBackupCache] = useState(Boolean(getReadingCacheBackupInfo()));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasLiveNewsKeys, setHasLiveNewsKeys] = useState(false);
  const [hasTranslationKey, setHasTranslationKey] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoRefreshStartedRef = useRef(false);

  const articles = useMemo(() => getAllArticles(), [refreshTick]);
  const filtered = useMemo(
    () => (selectedCategory === 'all' ? articles : articles.filter((article) => article.category === selectedCategory)),
    [articles, selectedCategory],
  );
  const readCount = filtered.filter((article) => isArticleRead(article.id)).length;

  useEffect(() => {
    const revealElements = () => {
      const root = containerRef.current;
      if (!root) return;

      const elements = root.querySelectorAll('.reveal-on-scroll');
      elements.forEach((el, index) => {
        window.setTimeout(() => {
          el.classList.add('is-visible');
        }, index * 60);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealElements();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '50px' },
    );

    const root = containerRef.current;
    if (root) {
      const sections = root.querySelectorAll('.reveal-section');
      if (sections.length > 0) {
        sections.forEach((section) => observer.observe(section));
      } else {
        window.setTimeout(revealElements, 100);
      }
    }

    const fallbackTimer = window.setTimeout(revealElements, 500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallbackTimer);
    };
  }, [selectedCategory, filtered]);

  const refreshLibrary = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    setNotice(null);

    try {
      let shouldRerender = false;
      const failures: string[] = [];

      try {
        const generatedArticles = await refreshGeneratedArticles();
        if (generatedArticles.length > 0) shouldRerender = true;
      } catch {
        failures.push('基础文章');
      }

      try {
        const liveArticles = await refreshReadingCache();
        if (liveArticles.length > 0) shouldRerender = true;
      } catch {
        failures.push('在线同步');
      }

      try {
        const meta = await refreshGeneratedReadingMeta();
        setGeneratedMeta(meta);
      } catch {
        failures.push('状态信息');
      }

      setLastSyncAt(getLastSuccessfulReadingSyncAt());
      setHasBackupCache(Boolean(getReadingCacheBackupInfo()));

      if (shouldRerender) {
        setRefreshTick((value) => value + 1);
      }

      if (failures.length === 3) {
        setRefreshError('同步超时，已保留本地文章');
      } else if (failures.length > 0) {
        setRefreshError(`同步部分失败：${failures.join('、')}，已保留本地文章`);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const restoreLibrary = useCallback(() => {
    const restored = restorePreviousReadingCache();
    if (!restored) {
      setNotice('没有找到可恢复的上次缓存');
      return;
    }

    setNotice(`已恢复上次缓存，共 ${restored.length} 篇`);
    setRefreshError(null);
    setHasBackupCache(Boolean(getReadingCacheBackupInfo()));
    setLastSyncAt(getLastSuccessfulReadingSyncAt());
    setRefreshTick((value) => value + 1);
  }, []);

  useEffect(() => {
    void refreshGeneratedReadingMeta()
      .then((meta) => setGeneratedMeta(meta))
      .catch(() => setGeneratedMeta(getGeneratedReadingMeta()));
    setLastSyncAt(getLastSuccessfulReadingSyncAt());
    setHasBackupCache(Boolean(getReadingCacheBackupInfo()));

    void fetchAppConfig()
      .then((config) => {
        setHasLiveNewsKeys(config.hasLiveNewsKeys);
        setHasTranslationKey(config.hasTranslationKey);
      })
      .catch(() => {
        setHasLiveNewsKeys(false);
        setHasTranslationKey(false);
      });
  }, []);

  useEffect(() => {
    if (autoRefreshStartedRef.current) return;
    autoRefreshStartedRef.current = true;

    const articleCount = getAllArticles().length;
    const shouldRefresh = shouldAutoRefreshReadingLibrary(articleCount, AUTO_REFRESH_MAX_AGE_MS);
    if (!shouldRefresh) return;

    void refreshLibrary();
  }, [refreshLibrary]);

  return (
    <div ref={containerRef} className="mx-auto max-w-6xl px-6 py-16 text-[#1d1d1f]">
      <header className="mb-16">
        <div className="reveal-1 mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[13px] font-black uppercase tracking-widest text-blue-600 shadow-sm">
          <BookOpen className="h-4 w-4" />
          Bilingual Reading
        </div>
        <h1 className="reveal-2 mb-6 text-[48px] font-black leading-tight tracking-tight sm:text-[56px]">双语阅读</h1>
        <p className="reveal-3 mb-10 max-w-2xl text-[21px] font-medium leading-relaxed text-[#86868b]">
          精选中英双语文章，在真实语境中提升语感。点击句子可即时朗读，点击单词可快速查阅。
        </p>

        <div className="mt-8 reveal-4">
          <ReadingGenerationStatus
            meta={generatedMeta}
            hasLiveNewsKeys={hasLiveNewsKeys}
            hasTranslationKey={hasTranslationKey}
            lastSyncAt={lastSyncAt ? new Date(lastSyncAt).toISOString() : null}
            onRefresh={() => void refreshLibrary()}
            onRestore={restoreLibrary}
            hasRestoreBackup={hasBackupCache}
            isRefreshing={isRefreshing}
            error={refreshError}
            notice={notice}
          />
        </div>
      </header>

      <nav className="mb-12 flex flex-wrap gap-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-8 py-3 text-[15px] font-black transition-all ${
              selectedCategory === cat
                ? 'bg-[#0071e3] text-white shadow-lg shadow-blue-500/20'
                : 'bg-[#f5f5f7] text-[#86868b] hover:bg-[#e8e8ed] hover:text-[#1d1d1f]'
            }`}
          >
            {categoryIcons[cat] ? <span className="mr-2">{categoryIcons[cat]}</span> : null}
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </nav>

      <div className={`transition-all duration-500 ${isRefreshing ? 'opacity-40 blur-[2px]' : 'opacity-100'}`}>
        <div className="mb-10 flex items-center justify-between px-2">
          <h2 className="text-[24px] font-black tracking-tight">为您精选 ({filtered.length})</h2>
          <span className="text-[14px] font-black uppercase tracking-widest text-[#86868b]">
            已学习 {readCount} / {filtered.length} 篇
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-[40px] border border-[#d2d2d7]/30 bg-[#f5f5f7] py-32 text-center shadow-inner">
            <FileText className="mx-auto mb-6 h-20 w-20 text-[#d2d2d7] opacity-50" />
            <p className="text-[21px] font-bold text-[#86868b]">没有找到匹配的文章</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 reveal-section">
            {filtered.map((article) => {
              const read = isArticleRead(article.id);

              return (
                <Link
                  key={article.id}
                  to={`/reading/${article.id}`}
                  className="group apple-card flex flex-col no-underline text-[#1d1d1f] reveal-on-scroll"
                >
                  <div className="flex flex-1 flex-col p-10">
                    <div className="mb-8 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[12px] font-black text-blue-600">
                        <Tag className="h-3.5 w-3.5" />
                        {categoryLabels[article.category]}
                      </span>
                      <span className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-[#86868b]">
                        <Calendar className="h-3.5 w-3.5" />
                        {article.date}
                      </span>
                    </div>

                    <div className="mb-8">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <h3 className="line-clamp-2 text-[26px] font-black leading-tight tracking-tight transition-colors group-hover:text-[#0071e3]">
                          {article.titleEn}
                        </h3>
                        {read && (
                          <span className="shrink-0 rounded-full bg-[#34c759] px-2.5 py-1 text-[11px] font-black text-white shadow-lg shadow-green-500/20">
                            已学习
                          </span>
                        )}
                      </div>
                      <p className="mb-4 line-clamp-1 text-[18px] font-bold text-[#1d1d1f] opacity-90">{article.titleZh}</p>
                      <p className="line-clamp-2 text-[17px] font-medium leading-relaxed text-[#86868b]">{article.paragraphs[0]?.en}</p>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-[#f5f5f7] pt-8">
                      <div className="flex items-center gap-4 text-[14px] font-black uppercase tracking-widest text-[#86868b]">
                        <span>{article.paragraphs.length} 段落</span>
                        <span>{article.vocabulary.length} 核心词</span>
                        <span className="ml-2 text-blue-500 opacity-0 transition-opacity group-hover:opacity-100">
                          来源: {article.source}
                        </span>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f7] text-[#1d1d1f] transition-all group-hover:translate-x-1 group-hover:bg-[#0071e3] group-hover:text-white">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {article.vocabulary.slice(0, 3).map((item) => (
                        <span key={item.word} className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-bold text-[#86868b]">
                          {item.word}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
