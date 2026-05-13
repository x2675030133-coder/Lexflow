import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Heart, Trash2, Volume2 } from 'lucide-react';
import { words as fallbackWords } from '../data/words';
import type { Word } from '../data/types';
import { getProgress, saveProgress } from '../utils/storage';
import { findWordById, loadWordList } from '../utils/wordListService';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';

export default function WordbookPage() {
  const [progress, setProgress] = useState(getProgress());
  const [favoriteWords, setFavoriteWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useStopMediaOnUnmount();

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
      const listId = progress.currentListId || 'cet4';
      const currentList = await loadWordList(listId).catch(() => fallbackWords);
      const words = await Promise.all(
        progress.favorites.map(async (wordId) => {
          const found = await findWordById(wordId, listId);
          return found || currentList.find((word) => word.id === wordId) || fallbackWords.find((word) => word.id === wordId) || null;
        }),
      );

      if (!cancelled) {
        setFavoriteWords(words.filter(Boolean) as Word[]);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [progress.currentListId, progress.favorites]);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const removeFavorite = (id: string) => {
    const nextProgress = { ...progress };
    nextProgress.favorites = nextProgress.favorites.filter((favoriteId) => favoriteId !== id);
    saveProgress(nextProgress);
    setProgress(nextProgress);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        to="/vocabulary"
        className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-[#d2d2d7]/50 bg-white px-5 py-3 text-[15px] font-bold text-[#1d1d1f] shadow-sm transition-all hover:bg-[#f5f5f7] active:scale-95 no-underline"
      >
        <ArrowLeft className="h-4 w-4" />
        返回词表
      </Link>

      {loading ? (
        <div className="py-16 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-blue-200 border-t-blue-500" />
        </div>
      ) : favoriteWords.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-50">
            <BookOpen className="h-10 w-10 text-purple-300" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">生词本为空</h2>
          <p className="mb-6 text-gray-500">在学习过程中点击心形图标收藏单词</p>
          <Link
            to="/vocabulary/learn"
            className="inline-flex rounded-xl bg-blue-600 px-6 py-3 font-medium text-white no-underline transition-all hover:bg-blue-700"
          >
            开始学习
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-bold text-gray-800">生词本</h1>
              <p className="text-sm text-gray-500">{favoriteWords.length} 个收藏单词</p>
            </div>
          </div>

          <div className="space-y-3">
            {favoriteWords.map((word) => (
              <div key={word.id} className="rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => speak(word.word)}
                      aria-label={`朗读 ${word.word}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 transition-colors hover:bg-blue-100"
                    >
                      <Volume2 className="h-5 w-5 text-blue-600" />
                    </button>
                    <div>
                      <Link to={`/word/${word.word}`} className="text-lg font-bold text-gray-800 no-underline hover:text-blue-600">
                        {word.word}
                      </Link>
                      <span className="ml-2 text-sm text-gray-400">{word.phonetic}</span>
                      <p className="mt-0.5 text-sm text-gray-500">{word.definitions[0].zh}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => removeFavorite(word.id)}
                      aria-label={`从生词本移除 ${word.word}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
