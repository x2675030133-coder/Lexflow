import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Pause, Play, Square, Volume2 } from 'lucide-react';
import { getAllArticles } from '../data/readingLibrary';
import { markArticleRead } from '../utils/readingProgress';
import { translateParagraphsDeepSeek } from '../services/remoteContent';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';
import { getSettings } from '../utils/settings';
import {
  pauseSpeechPlayback,
  resumeSpeechPlayback,
  restartSpeechPlayback,
  speakPlayback,
  stopSpeechPlayback,
} from '../utils/speechPlayback';
import { splitEnglishSentences, tokenizeEnglishWords } from '../utils/textSegments';

type PlaybackMode = 'idle' | 'article' | 'paragraph' | 'sentence' | 'word';

type SentenceSegment = {
  key: string;
  paragraphIndex: number;
  sentenceIndex: number;
  text: string;
  tokens: ReturnType<typeof tokenizeEnglishWords>;
};

function hasChinese(text: string) {
  return /[\u4e00-\u9fff]/.test(String(text || ''));
}

function getVoiceLang() {
  return getSettings().accent === 'uk' ? 'en-GB' : 'en-US';
}

export default function ArticleReadPage() {
  const { id } = useParams();
  const articles = useMemo(() => getAllArticles(), []);
  const article = articles.find((item) => item.id === id);

  const [resolvedParagraphs, setResolvedParagraphs] = useState(article?.paragraphs || []);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('idle');
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number | null>(null);
  const [currentSentenceKey, setCurrentSentenceKey] = useState<string | null>(null);
  const [currentWordKey, setCurrentWordKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.85);
  const playbackActionAtRef = useRef(0);
  const playbackSessionIdRef = useRef(0);
  const sentenceNodeRefs = useRef(new Map<string, HTMLElement>());
  const paragraphNodeRefs = useRef(new Map<number, HTMLElement>());

  useStopMediaOnUnmount();

  useEffect(() => {
    if (article) markArticleRead(article);
  }, [article]);

  useEffect(() => {
    setResolvedParagraphs(article?.paragraphs || []);
    playbackSessionIdRef.current += 1;
    stopSpeechPlayback();
    setPlaybackMode('idle');
    setCurrentParagraphIndex(null);
    setCurrentSentenceKey(null);
    setCurrentWordKey(null);
    setIsPlaying(false);
    setIsPaused(false);
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

  const sentenceSegments = useMemo<SentenceSegment[]>(() => {
    return resolvedParagraphs.flatMap((paragraph, paragraphIndex) => {
      const sentences = splitEnglishSentences(paragraph.en);
      const fallback = sentences.length > 0 ? sentences : [paragraph.en];

      return fallback.map((text, sentenceIndex) => ({
        key: `${paragraphIndex}-${sentenceIndex}`,
        paragraphIndex,
        sentenceIndex,
        text,
        tokens: tokenizeEnglishWords(text),
      }));
    });
  }, [resolvedParagraphs]);

  useEffect(() => {
    if (currentSentenceKey) {
      const node = sentenceNodeRefs.current.get(currentSentenceKey);
      if (node) {
        node.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
    }

    if (currentParagraphIndex !== null) {
      const node = paragraphNodeRefs.current.get(currentParagraphIndex);
      if (node) {
        node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [currentParagraphIndex, currentSentenceKey]);

  function clearPlaybackState() {
    setPlaybackMode('idle');
    setCurrentParagraphIndex(null);
    setCurrentSentenceKey(null);
    setCurrentWordKey(null);
    setIsPlaying(false);
    setIsPaused(false);
  }

  function beginNewPlaybackSession() {
    playbackSessionIdRef.current += 1;
    stopSpeechPlayback();
    clearPlaybackState();
    return playbackSessionIdRef.current;
  }

  function allowPlaybackAction() {
    const now = Date.now();
    if (now - playbackActionAtRef.current < 180) return false;
    playbackActionAtRef.current = now;
    return true;
  }

  function startSpeech(
    text: string,
    target: {
      mode: Exclude<PlaybackMode, 'idle'>;
      paragraphIndex: number | null;
      sentenceKey?: string | null;
      wordKey?: string | null;
    },
    onEnd?: () => void,
  ) {
    const sessionId = playbackSessionIdRef.current;
    const started = speakPlayback(text, {
      rate: playbackRate,
      lang: getVoiceLang(),
      cancelPrevious: false,
      onEnd: () => {
        if (playbackSessionIdRef.current !== sessionId) return;
        onEnd?.();
      },
    });

    if (!started) {
      clearPlaybackState();
      return false;
    }

    setPlaybackMode(target.mode);
    setCurrentParagraphIndex(target.paragraphIndex);
    setCurrentSentenceKey(target.sentenceKey ?? null);
    setCurrentWordKey(target.wordKey ?? null);
    setIsPlaying(true);
    setIsPaused(false);
    return true;
  }

  function playArticleFromIndex(startIndex = 0) {
    if (!allowPlaybackAction() || sentenceSegments.length === 0) return;

    const sessionId = beginNewPlaybackSession();

    const playAt = (index: number) => {
      if (playbackSessionIdRef.current !== sessionId) return;

      const segment = sentenceSegments[index];
      if (!segment) {
        clearPlaybackState();
        return;
      }

      const started = speakPlayback(segment.text, {
        rate: playbackRate,
        lang: getVoiceLang(),
        cancelPrevious: false,
        onEnd: () => {
          if (playbackSessionIdRef.current !== sessionId) return;
          playAt(index + 1);
        },
      });

      if (!started) {
        clearPlaybackState();
        return;
      }

      setPlaybackMode('article');
      setCurrentParagraphIndex(segment.paragraphIndex);
      setCurrentSentenceKey(segment.key);
      setCurrentWordKey(null);
      setIsPlaying(true);
      setIsPaused(false);
    };

    playAt(startIndex);
  }

  function playParagraph(paragraphIndex: number) {
    if (!allowPlaybackAction()) return;

    const paragraph = resolvedParagraphs[paragraphIndex];
    if (!paragraph) return;

    beginNewPlaybackSession();
    startSpeech(paragraph.en, { mode: 'paragraph', paragraphIndex });
  }

  function playSentence(segment: SentenceSegment) {
    if (!allowPlaybackAction()) return;

    beginNewPlaybackSession();
    startSpeech(segment.text, {
      mode: 'sentence',
      paragraphIndex: segment.paragraphIndex,
      sentenceKey: segment.key,
    });
  }

  function playWord(segment: SentenceSegment, wordText: string, wordIndex: number) {
    if (!allowPlaybackAction()) return;

    const cleaned = wordText.trim();
    if (!cleaned) return;

    beginNewPlaybackSession();
    startSpeech(cleaned, {
      mode: 'word',
      paragraphIndex: segment.paragraphIndex,
      sentenceKey: segment.key,
      wordKey: `${segment.key}-${wordIndex}`,
    });
  }

  function handlePrimaryPlayback() {
    if (!allowPlaybackAction()) return;

    if (isPlaying && !isPaused) {
      const paused = pauseSpeechPlayback();
      if (paused) {
        setIsPaused(true);
      } else {
        clearPlaybackState();
      }
      return;
    }

    if (isPlaying && isPaused) {
      const resumed = resumeSpeechPlayback();
      if (resumed) {
        setIsPaused(false);
        return;
      }

      const restarted = restartSpeechPlayback({ rate: playbackRate });
      if (restarted) {
        setIsPlaying(true);
        setIsPaused(false);
        return;
      }

      clearPlaybackState();
      return;
    }

    playArticleFromIndex(0);
  }

  function stopReading() {
    if (!allowPlaybackAction()) return;

    playbackSessionIdRef.current += 1;
    stopSpeechPlayback();
    clearPlaybackState();
  }

  function changePlaybackRate(nextRate: number) {
    if (!allowPlaybackAction()) return;

    setPlaybackRate(nextRate);
    if (currentSentenceKey === null && currentParagraphIndex === null) return;

    const restarted = restartSpeechPlayback({ rate: nextRate });
    if (restarted) {
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    clearPlaybackState();
  }

  const speedOptions = [0.75, 0.85, 1, 1.15, 1.25];
  const currentSpeedLabel = speedOptions.map(String).includes(String(playbackRate))
    ? `${playbackRate}x`
    : '0.85x';
  const primaryButtonLabel = isPlaying && !isPaused ? '暂停播放' : isPlaying && isPaused ? '继续播放' : '播放全文';
  const primaryButtonIcon = isPlaying && !isPaused ? <Pause size={16} /> : <Play size={16} />;
  const playbackModeLabel =
    playbackMode === 'article'
      ? '全文'
      : playbackMode === 'paragraph'
        ? '段落'
        : playbackMode === 'sentence'
          ? '句子'
          : playbackMode === 'word'
            ? '单词'
            : '待命';

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black text-gray-900">文章未找到</h1>
        <p className="mt-3 text-gray-600">抱歉，你请求的文章可能已被移动或不存在。</p>
        <Link
          to="/reading"
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#d2d2d7]/30 bg-white px-5 py-2.5 font-bold text-[#1d1d1f] shadow-sm transition-all hover:bg-[#f5f5f7] hover:shadow-md"
        >
          <ArrowLeft size={18} className="text-[#0071e3]" /> 返回阅读列表
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link
          to="/reading"
          className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7]/30 bg-white px-5 py-2.5 text-[14px] font-bold text-[#1d1d1f] shadow-sm transition-all hover:bg-[#f5f5f7] hover:shadow-md active:scale-95"
        >
          <ArrowLeft size={18} className="text-[#0071e3]" /> 返回阅读列表
        </Link>
        <div className="rounded-full border border-[#d2d2d7]/20 bg-[#f5f5f7] px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest text-black dark:text-[#a1a1a6]">
          {article.category}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <main className="min-w-0">
          <section className="overflow-hidden rounded-[30px] border border-gray-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <header className="border-b border-gray-100 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-6 md:p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-blue-600 shadow-sm">
                <BookOpen size={15} /> {article.category}
              </div>
              <h1 className="text-[30px] font-black leading-tight tracking-tight text-gray-900 md:text-[38px]">
                {article.titleEn}
              </h1>
              <p className="mt-3 text-[17px] font-medium leading-relaxed text-gray-600 md:text-[19px]">
                {article.titleZh}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-[12px] font-bold text-gray-500 md:text-[13px]">
                <span>{article.date}</span>
                <span>来源: {article.source}</span>
                <span>{article.paragraphs.length} 段落</span>
                <span>{article.vocabulary.length} 核心词汇</span>
              </div>
            </header>

            <div className="border-b border-gray-100 px-4 py-4 md:hidden">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrimaryPlayback}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold transition-all ${
                    isPlaying && !isPaused
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                  }`}
                >
                  {primaryButtonIcon}
                  {primaryButtonLabel}
                </button>
                <button
                  type="button"
                  onClick={stopReading}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-gray-500 shadow-sm transition-all hover:bg-gray-100"
                >
                  <Square size={15} /> 停止播放
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">语速</span>
                {speedOptions.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => changePlaybackRate(speed)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-black transition-all ${
                      playbackRate === speed
                        ? 'bg-slate-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-10 px-5 py-8 md:px-10 md:py-10">
              {resolvedParagraphs.map((paragraph, paragraphIndex) => {
                const paragraphSentenceSegments = sentenceSegments.filter(
                  (segment) => segment.paragraphIndex === paragraphIndex,
                );
                const activeParagraph = currentParagraphIndex === paragraphIndex;

                return (
                  <section
                    key={`${paragraph.en}-${paragraphIndex}`}
                    ref={(node) => {
                      if (node) {
                        paragraphNodeRefs.current.set(paragraphIndex, node);
                      } else {
                        paragraphNodeRefs.current.delete(paragraphIndex);
                      }
                    }}
                    className={`group rounded-[24px] border-l-2 py-2 pl-5 transition-colors ${
                      activeParagraph
                        ? 'border-blue-200 bg-blue-50/30'
                        : 'border-transparent hover:border-blue-100 hover:bg-gray-50/40'
                    }`}
                  >
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 opacity-90 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => playParagraph(paragraphIndex)}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-bold transition-all ${
                          activeParagraph
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                            : 'border border-blue-50 bg-white text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <Volume2 size={14} /> 朗读段落
                      </button>
                      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
                        段落 {paragraphIndex + 1}
                      </span>
                    </div>

                    <div className="space-y-6">
                      {paragraphSentenceSegments.map((segment) => {
                        const isCurrentSentence = currentSentenceKey === segment.key;
                        return (
                          <div
                            key={segment.key}
                            ref={(node) => {
                              if (node) {
                                sentenceNodeRefs.current.set(segment.key, node);
                              } else {
                                sentenceNodeRefs.current.delete(segment.key);
                              }
                            }}
                            className={`group/sentence scroll-mt-24 rounded-2xl transition-colors ${
                              isCurrentSentence ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => playSentence(segment)}
                                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all ${
                                  isCurrentSentence && playbackMode === 'sentence'
                                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                    : 'border-blue-100 bg-white text-blue-600 hover:border-blue-200 hover:bg-blue-50'
                                }`}
                                aria-label="朗读句子"
                              >
                                <Volume2 size={14} />
                              </button>
                              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">
                                句子 {segment.sentenceIndex + 1}
                              </span>
                            </div>

                            <p className="whitespace-pre-wrap text-[18px] leading-9 text-gray-900 md:text-[19px] md:leading-[2.15rem]">
                              {segment.tokens.map((token, tokenIndex) => {
                                const wordKey = `${segment.key}-${tokenIndex}`;

                                if (!token.isWordLike) {
                                  return <span key={wordKey}>{token.text}</span>;
                                }

                                const isCurrentWord = currentWordKey === wordKey;
                                return (
                                  <button
                                    key={wordKey}
                                    type="button"
                                    onClick={() => playWord(segment, token.text, tokenIndex)}
                                    className={`inline-flex items-center rounded-[4px] px-0.5 py-0.5 align-baseline transition-colors ${
                                      isCurrentWord
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'hover:bg-blue-50 hover:text-blue-700'
                                    }`}
                                    aria-label={`朗读单词 ${token.text.trim()}`}
                                  >
                                    {token.text}
                                  </button>
                                );
                              })}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <p className="mt-5 border-l-2 border-blue-100 pl-4 text-[14px] leading-7 text-gray-500 italic md:text-[15px] md:leading-7">
                      {paragraph.zh || '该段译文正在生成...'}
                    </p>
                  </section>
                );
              })}
            </div>
          </section>
        </main>

        <aside className="hidden xl:block xl:sticky xl:top-24 xl:self-start">
          <div className="space-y-4">
            <section className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-gray-500">
                <Volume2 size={16} /> 播放控制
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
                  {playbackModeLabel}
                </span>
                <span className="text-[12px] font-bold text-gray-400">{currentSpeedLabel}</span>
              </div>
              <button
                type="button"
                onClick={handlePrimaryPlayback}
                className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-[15px] font-bold transition-all ${
                  isPlaying && !isPaused
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                }`}
              >
                {primaryButtonIcon}
                {primaryButtonLabel}
              </button>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">语速</span>
                {speedOptions.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => changePlaybackRate(speed)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-black transition-all ${
                      playbackRate === speed
                        ? 'bg-slate-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={stopReading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-bold text-gray-600 transition-all hover:bg-gray-50"
              >
                <Square size={15} /> 停止播放
              </button>
            </section>

            <section className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-[13px] font-black uppercase tracking-widest text-gray-500">文章信息</div>
              <div className="mt-4 space-y-3 text-[14px] text-gray-600">
                <div className="flex items-center justify-between gap-4">
                  <span>日期</span>
                  <span className="font-bold text-gray-900">{article.date}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>来源</span>
                  <span className="max-w-[180px] truncate font-bold text-gray-900">{article.source}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>段落</span>
                  <span className="font-bold text-gray-900">{article.paragraphs.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>词汇</span>
                  <span className="font-bold text-gray-900">{article.vocabulary.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>当前语速</span>
                  <span className="font-bold text-gray-900">{currentSpeedLabel}</span>
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-gray-500">
                <BookOpen size={16} /> 核心词汇
              </div>
              <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
                {article.vocabulary.map((item) => (
                  <div key={item.word} className="rounded-[18px] border border-orange-100 bg-orange-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-[16px] font-black text-gray-900">{item.word}</div>
                      <span className="text-[12px] font-bold text-gray-500">{item.phonetic}</span>
                    </div>
                    <p className="mt-1 text-[13px] leading-6 text-gray-700">{item.definition}</p>
                    {item.definitionZh && (
                      <p className="mt-1 text-[13px] font-semibold leading-6 text-orange-700">{item.definitionZh}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
