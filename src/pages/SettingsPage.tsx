import { useEffect, useState, type ChangeEvent } from 'react';
import { ArrowLeft, Download, RotateCcw, Save, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { wordLists } from '../data/wordLists';
import { readCurrentAccountSnapshot, writeCurrentAccountSnapshot } from '../utils/accountProgressSync';
import { getWordListMetadata } from '../utils/wordListService';
import { clearProgressScope, getActiveScope } from '../utils/scopedStorage';
import { getProgress, saveProgress } from '../utils/storage';

const DAILY_GOALS = [10, 20, 30, 50, 100];

const T = {
  title: '学习设置',
  subtitle: '在这里统一管理每日目标、默认词表和学习数据。',
  dailyGoal: '今日目标',
  currentGoal: '当前目标',
  defaultWordList: '默认词表',
  save: '保存设置',
  saved: '已保存',
  dataManagement: '数据管理',
  export: '导出进度',
  import: '导入进度',
  reset: '重置所有数据',
  resetConfirm: '要重置所有学习数据吗？这个操作无法撤销。',
  importSuccess: '导入成功',
  importFail: '导入失败：文件格式不正确。',
  words: '词',
};

export default function SettingsPage() {
  const [progress, setProgress] = useState(getProgress());
  const [dailyGoal, setDailyGoal] = useState(progress.dailyGoal);
  const [dailyGoalInput, setDailyGoalInput] = useState(String(progress.dailyGoal));
  const [currentList, setCurrentList] = useState(progress.currentListId);
  const [saved, setSaved] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, { totalWords: number }>>({});

  useEffect(() => {
    const refresh = () => setProgress(getProgress());
    window.addEventListener('storage', refresh);
    window.addEventListener('el-progress-changed', refresh as EventListener);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('el-progress-changed', refresh as EventListener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getWordListMetadata();
      if (!cancelled) setMetadata(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = () => {
    const parsedGoal = Number.parseInt(dailyGoalInput, 10);
    const nextDailyGoal = Number.isFinite(parsedGoal) && parsedGoal > 0 ? parsedGoal : dailyGoal;
    const next = { ...progress, dailyGoal: nextDailyGoal, currentListId: currentList };
    saveProgress(next);
    setProgress(next);
    setDailyGoal(nextDailyGoal);
    setDailyGoalInput(String(nextDailyGoal));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  const handleReset = () => {
    if (!window.confirm(T.resetConfirm)) return;
    clearProgressScope(getActiveScope());
    window.location.reload();
  };

  const handleExport = () => {
    const data = {
      ...readCurrentAccountSnapshot(),
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `lexflow-progress-${new Date().toISOString().split('T')[0]}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(String(ev.target?.result ?? '{}'));
        if (data && typeof data === 'object') {
          const nextSnapshot = {
            progress: data.progress || getProgress(),
            dailyStats: Array.isArray(data.dailyStats) ? data.dailyStats : [],
            reading: Array.isArray(data.reading) ? data.reading : [],
            readingComplete: Array.isArray(data.readingComplete) ? data.readingComplete : [],
            readingStudy: data.readingStudy && typeof data.readingStudy === 'object' && !Array.isArray(data.readingStudy)
              ? data.readingStudy
              : { articles: {}, updatedAt: '' },
            listening: Array.isArray(data.listening) ? data.listening : [],
            podcasts: Array.isArray(data.podcasts) ? data.podcasts : [],
            pronunciation: data.pronunciation && typeof data.pronunciation === 'object' && !Array.isArray(data.pronunciation)
              ? data.pronunciation
              : { favorites: [], practiced: [], lastSelectedId: '', updatedAt: '' },
            updatedAt: String(data.updatedAt || ''),
          };
          writeCurrentAccountSnapshot(nextSnapshot);
          saveProgress(nextSnapshot.progress);
          setProgress(nextSnapshot.progress);
          setDailyGoal(nextSnapshot.progress.dailyGoal);
          setCurrentList(nextSnapshot.progress.currentListId);
          alert(T.importSuccess);
        }
      } catch {
        alert(T.importFail);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/vocabulary"
        className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-md"
      >
        <ArrowLeft size={18} />
        返回背单词
      </Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{T.title}</h1>
      <p className="text-gray-500 mb-8">{T.subtitle}</p>

      <div className="space-y-6">
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800">{T.dailyGoal}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {T.currentGoal}：{dailyGoal}
            </p>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {DAILY_GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => {
                  setDailyGoal(goal);
                  setDailyGoalInput(String(goal));
                }}
                className={`py-3 rounded-xl font-medium text-sm transition-all ${
                  dailyGoal === goal
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
                >
                {goal}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">自定义目标</label>
            <input
              type="number"
              min={1}
              step={1}
              value={dailyGoalInput}
              onChange={(event) => setDailyGoalInput(event.target.value)}
              placeholder="输入每日目标数量"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 outline-none transition-colors focus:border-blue-400 focus:bg-white"
            />
            <p className="mt-2 text-xs text-gray-400">你可以直接输入任意正整数，保存后立即生效。</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">{T.defaultWordList}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {wordLists.map((list) => {
              const totalWords = metadata[list.id]?.totalWords ?? list.totalWords;
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => setCurrentList(list.id)}
                  className={`p-4 rounded-xl text-left transition-all border-2 ${
                    currentList === list.id
                      ? 'bg-blue-50 border-blue-400'
                      : 'bg-gray-50 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="text-lg mb-1">{list.icon}</div>
                  <div className="font-medium text-gray-800 text-sm">{list.name}</div>
                  <div className="text-xs text-gray-400">
                    {totalWords} {T.words}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saved ? T.saved : T.save}
        </button>

        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">{T.dataManagement}</h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleExport}
              className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {T.export}
            </button>
            <label className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              {T.import}
              <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
            </label>
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {T.reset}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

