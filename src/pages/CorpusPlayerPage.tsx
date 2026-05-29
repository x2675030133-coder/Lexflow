import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Repeat,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  Mic,
  BookOpen,
  X,
  Film,
  MessageSquare,
} from 'lucide-react';
import { videoLessons, highlightDefinitions } from '../data/videoData';
import type { SubtitleLine } from '../data/videoData';
import { buildVideoQuery, fetchPexelsVideoUrl } from '../services/remoteContent';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';
import { useStudyTimeTracker } from '../hooks/useStudyTimeTracker';

export default function CorpusPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const lesson = videoLessons.find((v) => v.id === id);

  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [subtitleMode, setSubtitleMode] = useState<'bilingual' | 'en' | 'zh'>('bilingual');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [likedLines, setLikedLines] = useState<Set<number>>(new Set());
  const [playerMode, setPlayerMode] = useState<'video' | 'tts'>('video');
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [activeVideoSrc, setActiveVideoSrc] = useState<string | null>(null);
  const [fallbackVideoSrc, setFallbackVideoSrc] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subtitleListRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useStopMediaOnUnmount();
  useStudyTimeTracker(true);

  const currentLine: SubtitleLine | undefined = lesson?.subtitles[currentLineIndex];

  const speak = useCallback(
    (text: string, rate: number = 1) => {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = rate * playbackSpeed;
      u.onend = () => {
        if (!lesson) return;
        if (isLooping) {
          setTimeout(() => speak(text, rate), 500);
        } else if (isPlaying && playerMode === 'tts') {
          if (currentLineIndex < lesson.subtitles.length - 1) {
            setCurrentLineIndex((prev) => prev + 1);
          } else {
            setIsPlaying(false);
          }
        }
      };
      speechSynthesis.speak(u);
    },
    [playbackSpeed, isLooping, isPlaying, currentLineIndex, lesson, playerMode],
  );

  useEffect(() => {
    if (playerMode === 'tts' && isPlaying && currentLine) {
      speak(currentLine.en, 0.85);
    }
    return () => {
      if (playerMode === 'tts') {
        speechSynthesis.cancel();
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentLineIndex, isPlaying, currentLine, speak, playerMode]);

  useEffect(() => {
    if (subtitleListRef.current) {
      const activeEl = subtitleListRef.current.querySelector('[data-active="true"]');
      activeEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLineIndex]);

  useEffect(() => {
    if (!lesson) return;

    if (lesson.videoSource === 'embed' && lesson.videoUrl) {
      setPlayerMode('video');
    } else if (lesson.videoSource === 'local' && lesson.videoUrl) {
      setPlayerMode('video');
    }

    setCurrentLineIndex(0);
    setIsPlaying(false);
    setVideoReady(false);
    setVideoError(false);
    setActiveVideoSrc(lesson.videoUrl || null);
    setFallbackVideoSrc(null);
    setVideoLoading(false);
  }, [lesson]);

  useEffect(() => {
    let cancelled = false;

    if (!lesson || playerMode !== 'video' || lesson.videoSource === 'embed') {
      return;
    }

    const query = buildVideoQuery(lesson);

    setVideoLoading(true);
    void fetchPexelsVideoUrl(query)
      .then((url) => {
        if (!cancelled && url) {
          setFallbackVideoSrc(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFallbackVideoSrc(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setVideoLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lesson, playerMode]);

  useEffect(() => {
    if (playerMode !== 'video') return;
    if (!fallbackVideoSrc) return;
    if (!videoError) return;
    if (activeVideoSrc === fallbackVideoSrc) return;

    setActiveVideoSrc(fallbackVideoSrc);
    setVideoReady(false);
    setVideoError(false);
  }, [activeVideoSrc, fallbackVideoSrc, playerMode, videoError]);

  useEffect(() => {
    if (playerMode !== 'video' || !videoRef.current || !lesson) return;
    const video = videoRef.current;
    const onTimeUpdate = () => {
      const t = video.currentTime;
      const idx = lesson.subtitles.findIndex(
        (s, i) => t >= s.startTime && (i === lesson.subtitles.length - 1 || t < lesson.subtitles[i + 1].startTime),
      );
      if (idx >= 0 && idx !== currentLineIndex) {
        setCurrentLineIndex(idx);
      }
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [playerMode, lesson, currentLineIndex]);

  if (!lesson) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">未找到课程</h2>
        <Link to="/corpus" className="text-blue-600 hover:underline">
          返回课程列表
        </Link>
      </div>
    );
  }

  const togglePlay = () => {
    if (playerMode === 'video' && videoRef.current && videoReady) {
      if (videoRef.current.paused) {
        void videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const prevLine = () => {
    speechSynthesis.cancel();
    const newIndex = Math.max(0, currentLineIndex - 1);
    setCurrentLineIndex(newIndex);
    if (playerMode === 'video' && videoRef.current) {
      videoRef.current.currentTime = lesson.subtitles[newIndex].startTime;
    } else if (!isPlaying) {
      const line = lesson.subtitles[newIndex];
      if (line) speak(line.en, 0.85);
    }
  };

  const nextLine = () => {
    speechSynthesis.cancel();
    const newIndex = Math.min(lesson.subtitles.length - 1, currentLineIndex + 1);
    setCurrentLineIndex(newIndex);
    if (playerMode === 'video' && videoRef.current) {
      videoRef.current.currentTime = lesson.subtitles[newIndex].startTime;
    } else if (!isPlaying) {
      const line = lesson.subtitles[newIndex];
      if (line) speak(line.en, 0.85);
    }
  };

  const replay = () => {
    speechSynthesis.cancel();
    if (playerMode === 'video' && videoRef.current && currentLine) {
      videoRef.current.currentTime = currentLine.startTime;
      void videoRef.current.play();
      setIsPlaying(true);
    } else if (currentLine) {
      speak(currentLine.en, 0.85);
    }
  };

  const goToLine = (index: number) => {
    speechSynthesis.cancel();
    setCurrentLineIndex(index);
    if (playerMode === 'video' && videoRef.current) {
      videoRef.current.currentTime = lesson.subtitles[index].startTime;
      void videoRef.current.play();
      setIsPlaying(true);
    } else {
      const line = lesson.subtitles[index];
      if (line) speak(line.en, 0.85);
    }
  };

  const toggleSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5];
    const idx = speeds.indexOf(playbackSpeed);
    const newSpeed = speeds[(idx + 1) % speeds.length];
    setPlaybackSpeed(newSpeed);
    if (playerMode === 'video' && videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  const copyText = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  const toggleLike = (lineId: number) => {
    setLikedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const handleVideoError = () => {
    if (fallbackVideoSrc && activeVideoSrc !== fallbackVideoSrc) {
      setActiveVideoSrc(fallbackVideoSrc);
      setVideoReady(false);
      setVideoError(false);
      return;
    }
    setVideoError(true);
  };

  const renderHighlightedText = (text: string, highlights: string[], isSubtitlePanel = false) => {
    if (highlights.length === 0) return <span>{text}</span>;

    const regex = new RegExp(`(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) => {
          const isHighlight = highlights.some((h) => h.toLowerCase() === part.toLowerCase());
          if (isHighlight) {
            return (
              <span
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWord(part.toLowerCase());
                }}
                className={`cursor-pointer font-medium border-b-2 border-dashed transition-colors ${
                  isSubtitlePanel
                    ? 'text-orange-600 border-orange-300 bg-orange-50 px-1 rounded hover:bg-orange-100'
                    : 'text-orange-500 border-orange-400 hover:text-orange-600'
                }`}
              >
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/corpus" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 no-underline text-sm">
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Link>
          <div className="text-center">
            <span className="text-sm font-medium text-gray-800">第 {lesson.episode} 集</span>
            <span className="text-gray-300 mx-2">|</span>
            <span className="text-sm text-gray-500">{lesson.speaker}</span>
          </div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setPlayerMode('video')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  playerMode === 'video'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                视频模式
              </button>
              <button
                onClick={() => {
                  setPlayerMode('tts');
                  speechSynthesis.cancel();
                  if (videoRef.current) videoRef.current.pause();
                  setIsPlaying(false);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  playerMode === 'tts'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                视听模式
              </button>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden mb-4 aspect-video flex items-center justify-center relative">
              {playerMode === 'video' && lesson.videoSource === 'embed' && lesson.videoUrl ? (
                <iframe
                  src={`${lesson.videoUrl}?rel=0&modestbranding=1`}
                  className="w-full h-full absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={lesson.title}
                />
              ) : playerMode === 'video' && (lesson.videoSource === 'local' || fallbackVideoSrc) ? (
                <>
                  <video
                    key={activeVideoSrc || fallbackVideoSrc || lesson.videoUrl}
                    ref={videoRef}
                    src={activeVideoSrc || fallbackVideoSrc || lesson.videoUrl}
                    className="w-full h-full absolute inset-0 object-contain bg-black"
                    onLoadedData={() => setVideoReady(true)}
                    onError={handleVideoError}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    playsInline
                    preload="auto"
                  />
                  {(videoLoading || (!videoReady && !videoError)) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                      <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin mb-3" />
                      <p className="text-white/60 text-sm">
                        {videoLoading ? '正在查找可播放视频...' : '正在加载视频...'}
                      </p>
                    </div>
                  )}
                  {videoError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-900/90">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-3">
                        <Film className="w-8 h-8 text-white/50" />
                      </div>
                      <p className="text-white/70 text-sm mb-1">未找到视频，已尝试切换到备用视频源。</p>
                      <p className="text-white/40 text-xs mb-4">如果备用视频源也失败，请检查 Pexels API 配置，或切换到视听模式。</p>
                      <p className="text-white/30 text-xs">课程：{lesson.title}</p>
                      <button
                        onClick={() => setPlayerMode('tts')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        切换到视听模式
                      </button>
                    </div>
                  )}
                  {videoReady && !isPlaying && (
                    <div
                      className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer bg-black/20"
                      onClick={togglePlay}
                    >
                      <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Play className="w-7 h-7 text-white ml-1" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-center cursor-pointer" onClick={togglePlay}>
                    <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3 hover:bg-white/20 transition-colors">
                      {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
                    </div>
                    <p className="text-white/70 text-sm">{lesson.speaker}</p>
                    <p className="text-white/40 text-xs mt-1">Ep.{lesson.episode}</p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-300"
                        style={{ width: `${((currentLineIndex + 1) / lesson.subtitles.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isLooping ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title="循环播放"
                >
                  <Repeat className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (currentLine) speak(currentLine.en, 0.85);
                  }}
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
                  title="朗读当前句"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={prevLine}
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
                  title="上一句"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={replay}
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
                  title="重播"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center shadow-lg"
                  title="播放 / 暂停"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
                <button
                  onClick={nextLine}
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
                  title="下一句"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleSpeed}
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-xs font-bold"
                  title="切换语速"
                >
                  {playbackSpeed}x
                </button>
                <button
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
                  title="跳到下一句并朗读"
                  onClick={() => {
                    speechSynthesis.cancel();
                    setIsPlaying(false);
                    if (currentLine) speak(currentLine.en, 0.85);
                  }}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              {currentLine && (
                <div>
                  <p className="text-lg leading-relaxed text-gray-800 mb-3">
                    {renderHighlightedText(currentLine.en, currentLine.highlights)}
                  </p>
                  {subtitleMode !== 'en' && <p className="text-sm text-gray-500 leading-relaxed">{currentLine.zh}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-full flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">动态字幕</h3>
                <div className="flex gap-1">
                  {(['bilingual', 'en', 'zh'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSubtitleMode(mode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        subtitleMode === mode
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {mode === 'bilingual' ? '双语' : mode === 'en' ? '英文' : '中文'}
                    </button>
                  ))}
                </div>
              </div>

              <div ref={subtitleListRef} className="flex-1 overflow-y-auto p-4 space-y-1 max-h-[600px]">
                {lesson.subtitles.map((line, index) => {
                  const isActive = index === currentLineIndex;
                  return (
                    <div
                      key={line.id}
                      data-active={isActive}
                      onClick={() => goToLine(index)}
                      className={`group p-4 rounded-xl cursor-pointer transition-all ${
                        isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      {subtitleMode !== 'zh' && (
                        <p className={`leading-relaxed mb-1.5 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                          {renderHighlightedText(line.en, line.highlights, true)}
                        </p>
                      )}
                      {subtitleMode !== 'en' && <p className="text-sm text-gray-400 leading-relaxed">{line.zh}</p>}

                      <div
                        className={`flex items-center gap-3 mt-2 text-gray-300 ${
                          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        } transition-opacity`}
                      >
                        <span className="text-xs text-gray-400 mr-auto">{line.id}</span>
                        <button onClick={(e) => { e.stopPropagation(); goToLine(index); }} className="hover:text-blue-500" title="播放">
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); copyText(line.en); }} className="hover:text-blue-500" title="复制">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(line.id);
                          }}
                          className={likedLines.has(line.id) ? 'text-red-500' : 'hover:text-red-400'}
                          title="收藏"
                        >
                          <Heart className={`w-3.5 h-3.5 ${likedLines.has(line.id) ? 'fill-red-500' : ''}`} />
                        </button>
                        <button onClick={(e) => e.stopPropagation()} className="hover:text-blue-500" title="跟读">
                          <Mic className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs text-gray-400">
                          {formatTime(line.startTime)} - {formatTime(line.endTime)}
                        </span>
                      </div>

                      {isActive && (
                        <div className="h-0.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full animate-progress" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedWord && highlightDefinitions[selectedWord] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedWord(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedWord(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedWord}</h3>
                <p className="text-sm text-gray-400">{highlightDefinitions[selectedWord].phonetic}</p>
              </div>
              <button
                onClick={() => {
                  const u = new SpeechSynthesisUtterance(selectedWord);
                  u.lang = 'en-US';
                  u.rate = 0.8;
                  speechSynthesis.speak(u);
                }}
                className="ml-auto w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center hover:bg-blue-100"
              >
                <Volume2 className="w-4 h-4 text-blue-600" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">English</p>
                <p className="text-gray-700">{highlightDefinitions[selectedWord].en}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-400 mb-1">中文</p>
                <p className="text-blue-700 font-medium">{highlightDefinitions[selectedWord].zh}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedWord(null)}
              className="w-full mt-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



