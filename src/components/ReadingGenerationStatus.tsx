import { Clock3, Sparkles, RefreshCcw } from 'lucide-react';
import type { GeneratedReadingMeta } from '../data/generatedReadingMeta';

interface ReadingGenerationStatusProps {
  meta: GeneratedReadingMeta;
  hasLiveNewsKeys: boolean;
  hasTranslationKey: boolean;
  lastSyncAt?: string | null;
  onRefresh?: () => void;
  onRestore?: () => void;
  hasRestoreBackup?: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  notice?: string | null;
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '今天 08:30';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (isToday) {
    return `今天 ${timeStr}`;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export default function ReadingGenerationStatus({
  meta,
  hasLiveNewsKeys,
  hasTranslationKey,
  lastSyncAt = null,
  onRefresh,
  onRestore,
  hasRestoreBackup = false,
  isRefreshing = false,
  error = null,
  notice = null,
}: ReadingGenerationStatusProps) {
  const scheduleLabel = meta.generationSchedule?.label || '每天 02:00';
  const displayDate = lastSyncAt || meta.generatedAt;

  return (
    <div className="rounded-[32px] border border-blue-100 bg-blue-50/40 px-8 py-8 shadow-sm backdrop-blur-md">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full border px-4 py-1.5 text-[12px] font-black uppercase tracking-wider ${
              hasLiveNewsKeys ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {hasLiveNewsKeys ? '实时新闻源' : '本地文章库'}
          </span>
          <span
            className={`rounded-full border px-4 py-1.5 text-[12px] font-black uppercase tracking-wider ${
              hasTranslationKey ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}
          >
            {hasTranslationKey ? 'AI 翻译已启用' : '本地离线译文'}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-violet-700">
            <Sparkles className="h-3.5 w-3.5" />
            {meta.sourceMode === 'model' ? 'AI 深度解析' : '算法驱动'}
          </span>
        </div>

        {(onRefresh || onRestore) && (
          <div className="flex flex-col items-end gap-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-600 px-6 text-[15px] font-black text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                <RefreshCcw className={`h-4.5 w-4.5 ${isRefreshing ? 'animate-spin' : ''} transition-colors`} />
                {isRefreshing ? '正在同步...' : '刷新阅读库'}
              </button>
            )}

            {onRestore && (
              <button
                onClick={onRestore}
                disabled={isRefreshing || !hasRestoreBackup}
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-5 text-[14px] font-black text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                {hasRestoreBackup ? '恢复上次缓存' : '暂无可恢复缓存'}
              </button>
            )}

            {notice && <p className="max-w-[22rem] text-right text-[13px] font-medium leading-relaxed text-slate-600">{notice}</p>}
            {error && <p className="max-w-[22rem] text-right text-[13px] font-medium leading-relaxed text-rose-600">{error}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-50 bg-white shadow-sm">
            <Clock3 className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-black uppercase tracking-widest leading-none text-[#86868b]">最近更新</p>
            <p className="text-[18px] font-bold text-[#1d1d1f]">{formatGeneratedAt(displayDate)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-50 bg-white text-lg font-black text-blue-600 shadow-sm">
            源
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-black uppercase tracking-widest leading-none text-[#86868b]">内容来源</p>
            <p className="text-[18px] font-bold text-[#1d1d1f]">
              {meta.provider || 'AI Editor'} · {meta.articleCount} 篇
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-50 bg-white text-sm font-black text-blue-600 shadow-sm">
            24H
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-black uppercase tracking-widest leading-none text-[#86868b]">自动化计划</p>
            <p className="text-[18px] font-bold text-[#1d1d1f]">{scheduleLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
