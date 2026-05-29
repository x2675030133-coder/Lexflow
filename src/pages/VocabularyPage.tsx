import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Clock, Heart, Target } from 'lucide-react';
import { wordLists } from '../data/wordLists';
import type { UserProgress } from '../data/types';
import { getProgress } from '../utils/storage';
import { getWordListMetadata } from '../utils/wordListService';
import { useStudyTimeTracker } from '../hooks/useStudyTimeTracker';

export default function VocabularyPage() {
  const [progress, setProgress] = useState<UserProgress>(getProgress());
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useStudyTimeTracker(true);

  useEffect(() => {
    const handleStorage = () => setProgress(getProgress());
    window.addEventListener('storage', handleStorage);
    window.addEventListener('el-progress-changed', handleStorage as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('el-progress-changed', handleStorage as EventListener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getWordListMetadata()
      .then((metadata) => {
        if (cancelled) return;
        setWordCounts(
          Object.fromEntries(Object.entries(metadata).map(([listId, entry]) => [listId, entry.totalWords])),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
  }, [wordCounts]);

  const grouped = useMemo(() => {
    return wordLists.reduce((acc, list) => {
      if (!acc[list.category]) acc[list.category] = [];
      acc[list.category].push(list);
      return acc;
    }, {} as Record<string, typeof wordLists>);
  }, []);

  const todayProgress = `${progress.learnedToday}/${progress.dailyGoal}`;
  const favoriteCount = progress.favorites.length;
  const todayKey = new Date().toISOString().split('T')[0];
  const learnedRecordCount = Object.values(progress.records).filter((record) => {
    return record.correctCount > 0 && !record.mastered;
  }).length;
  const reviewCount = Object.values(progress.records).filter((record) => {
    return record.correctCount > 0 && record.nextReviewDate <= todayKey && !record.mastered;
  }).length;

  const getListStats = (listId: string, totalWords: number) => {
    const prefix = `${listId}-`;
    const listRecords = Object.entries(progress.records).filter(([wordId]) => wordId.startsWith(prefix));
    const learned = listRecords.length;
    const mastered = listRecords.filter(([, record]) => record.mastered).length;
    const learnedToday = progress.currentListId === listId ? progress.learnedToday : 0;

    return {
      learned,
      mastered,
      learnedToday,
      totalWords,
    };
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-12 reveal-1">
        <h1 className="text-[40px] font-black text-[#1d1d1f] tracking-tight mb-3">背单词</h1>
        <p className="text-[19px] text-[#000000] font-medium">选择词表开始学习，也可以继续复习已经学过的单词。</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 reveal-section">
        <Link
          to="/vocabulary/learn"
          className="group flex flex-col p-8 bg-white apple-card no-underline reveal-on-scroll"
        >
          <div className="w-16 h-16 bg-[#0071e3]/10 rounded-[22px] flex items-center justify-center text-[#0071e3] mb-8 transition-all group-hover:bg-[#0071e3] group-hover:text-white group-hover:scale-110 group-hover:rotate-3">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <div className="font-black text-[24px] text-[#1d1d1f] mb-2 tracking-tight">继续学习</div>
            <div className="text-[#86868b] text-[14px] font-bold uppercase tracking-widest">今日进度 {todayProgress}</div>
          </div>
        </Link>

        <Link
          to="/vocabulary/review"
          className="group flex flex-col p-8 bg-white apple-card no-underline reveal-on-scroll"
        >
          <div className="w-16 h-16 bg-[#ff9500]/10 rounded-[22px] flex items-center justify-center text-[#ff9500] mb-8 transition-all group-hover:bg-[#ff9500] group-hover:text-white group-hover:scale-110 group-hover:rotate-3">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <div className="font-black text-[24px] text-[#1d1d1f] mb-2 tracking-tight">复习单词</div>
            <div className="text-[#86868b] text-[14px] font-bold uppercase tracking-widest">{reviewCount} 个到期复习 · 已学 {learnedRecordCount} 个</div>
          </div>
        </Link>

        <Link
          to="/vocabulary/wordbook"
          className="group flex flex-col p-8 bg-white apple-card no-underline reveal-on-scroll"
        >
          <div className="w-16 h-16 bg-[#ff2d55]/10 rounded-[22px] flex items-center justify-center text-[#ff2d55] mb-8 transition-all group-hover:bg-[#ff2d55] group-hover:text-white group-hover:scale-110 group-hover:rotate-3">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <div className="font-black text-[24px] text-[#1d1d1f] mb-2 tracking-tight">生词本</div>
            <div className="text-[#86868b] text-[14px] font-bold uppercase tracking-widest">{favoriteCount} 个收藏单词</div>
          </div>
        </Link>

        <Link
          to="/settings"
          className="group flex flex-col p-8 bg-white apple-card no-underline reveal-on-scroll"
        >
          <div className="w-16 h-16 bg-[#1d1d1f]/5 rounded-[22px] flex items-center justify-center text-[#1d1d1f] mb-8 transition-all group-hover:bg-[#1d1d1f] group-hover:text-white group-hover:scale-110 group-hover:rotate-3">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <div className="font-black text-[24px] text-[#1d1d1f] mb-2 tracking-tight">每日目标</div>
            <div className="text-[#86868b] text-[14px] font-bold uppercase tracking-widest">目标 {progress.dailyGoal} 词</div>
          </div>
        </Link>
      </div>

      {Object.entries(grouped).map(([category, lists]) => (
        <div key={category} className="mb-16 reveal-section">
          <h2 className="text-[28px] font-black text-[#1d1d1f] mb-10 flex items-center gap-4 tracking-tight reveal-on-scroll">
            <span className="w-2.5 h-10 bg-[#0071e3] rounded-full shadow-sm" />
            {category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {lists.map((list) => {
              const count = wordCounts[list.id] || list.totalWords;
              const stats = getListStats(list.id, count);
              const progressPercent = Math.min((stats.learned / Math.max(count, 1)) * 100, 100);

              return (
                <Link
                  key={list.id}
                  to={`/vocabulary/learn?list=${list.id}`}
                  className="group flex h-full flex-col bg-white apple-card p-10 no-underline reveal-on-scroll"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className={`w-18 h-18 rounded-[24px] bg-gradient-to-br ${list.color} flex items-center justify-center text-4xl shadow-lg shadow-black/5 group-hover:scale-110 transition-transform duration-500`}>
                      {list.icon}
                    </div>
                    <ChevronRight className="w-6 h-6 text-[#d2d2d7] group-hover:text-[#0071e3] group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-[22px] font-black text-[#1d1d1f] mb-1 tracking-tight group-hover:text-[#0071e3] transition-colors">{list.name}</h3>
                  <p className="text-[13px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-5">{list.nameEn}</p>
                  <p className="text-[16px] text-[#424245] mb-10 min-h-[3.5rem] leading-relaxed font-medium">{list.description}</p>

                  <div className="mt-auto space-y-5">
                    <div className="flex items-center justify-between text-[13px] font-black text-[#86868b] uppercase tracking-widest">
                      <span>已学 {stats.learned}/{count}</span>
                      <span className="text-[#1d1d1f]">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2.5 bg-[#f5f5f7] rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full bg-gradient-to-r ${list.color} rounded-full transition-all duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)] shadow-sm`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

    </div>
  );
}
