import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Volume2 } from 'lucide-react';
import { getAllArticles } from '../data/readingLibrary';
import { markArticleRead } from '../utils/readingProgress';
import { speakText } from '../utils/settings';
import { translateParagraphsDeepSeek } from '../services/remoteContent';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';

function hasChinese(text: string) {
  return /[\u4e00-\u9fff]/.test(String(text || ''));
}

export default function ArticleReadPage() {
  const { id } = useParams();
  const articles = useMemo(() => getAllArticles(), []);
  const article = articles.find((item) => item.id === id);
  const [resolvedParagraphs, setResolvedParagraphs] = useState(article?.paragraphs || []);

  useStopMediaOnUnmount();

  useEffect(() => {
    if (article) markArticleRead(article.id);
  }, [article]);

  useEffect(() => {
    setResolvedParagraphs(article?.paragraphs || []);
  }, [article]);

  useEffect(() => {
    if (!article || resolvedParagraphs.length === 0) return;

    const missingIndexes = resolvedParagraphs
      .map((paragraph, index) => ({ paragraph, index }))
      .filter(({ paragraph }) => !hasChinese(paragraph.zh) || paragraph.zh.trim() === paragraph.en.trim())
      .map(({ index }) => index);

    if (missingIndexes.length === 0) return;

    let cancelled = false;
    const toTranslate = missingIndexes.map((index) => resolvedParagraphs[index].en);

    translateParagraphsDeepSeek(toTranslate).then((translated) => {
      if (cancelled || !translated || translated.length !== toTranslate.length) return;

      setResolvedParagraphs((previous) =>
        previous.map((paragraph, index) => {
          const missingPosition = missingIndexes.indexOf(index);
          if (missingPosition === -1) return paragraph;
          const nextZh = translated[missingPosition]?.trim();
          if (!nextZh) return paragraph;
          return { ...paragraph, zh: nextZh };
        }),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [article, resolvedParagraphs]);

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black text-gray-900">文章未找到</h1>
        <p className="mt-3 text-gray-600">抱歉，您请求的文章可能已被移除或不存在。</p>
        <Link to="/reading" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white">
          <ArrowLeft size={18} /> 返回阅读列表
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/reading" className="inline-flex items-center gap-2 text-gray-500 transition hover:text-blue-600 font-bold">
        <ArrowLeft size={18} /> 返回阅读列表
      </Link>

      <article className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <header className="border-b border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold text-blue-600">
            <BookOpen size={16} /> {article.category}
          </div>
          <h1 className="text-4xl font-black leading-tight text-gray-900">{article.titleEn}</h1>
          <p className="mt-3 text-xl text-gray-600 font-medium">{article.titleZh}</p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-500 font-bold">
            <span className="flex items-center gap-1">{article.date}</span>
            <span className="flex items-center gap-1">来源：{article.source}</span>
            <span className="flex items-center gap-1">{article.paragraphs.length} 段落</span>
            <span className="flex items-center gap-1">{article.vocabulary.length} 核心词汇</span>
          </div>
        </header>

        <div className="space-y-8 p-8">
          {resolvedParagraphs.map((paragraph, index) => (
            <section key={`${paragraph.en}-${index}`} className="rounded-3xl bg-gray-50 p-6 transition hover:bg-white hover:shadow-md border border-transparent hover:border-blue-100">
              <button
                type="button"
                onClick={() => speakText(paragraph.en, 0.85)}
                className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-600 shadow-sm border border-blue-50 transition hover:bg-blue-50"
              >
                <Volume2 size={16} /> 朗读段落
              </button>
              <p className="text-lg leading-9 text-gray-900 font-medium">{paragraph.en}</p>
              <p className="mt-4 border-l-4 border-blue-200 pl-4 text-base leading-8 text-gray-600">
                {paragraph.zh || '该段译文生成中...'}
              </p>
            </section>
          ))}
        </div>
      </article>

      <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black text-gray-900">核心词汇</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {article.vocabulary.map((item) => (
            <div key={item.word} className="rounded-2xl border border-orange-100 bg-orange-50 p-5 transition hover:scale-[1.02]">
              <div className="flex items-center justify-between gap-4">
                <div className="text-xl font-black text-gray-900">{item.word}</div>
                <span className="text-sm text-gray-500 font-bold">{item.phonetic}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-700 font-medium">{item.definition}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
