import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Pause, Play, RefreshCcw, Square, Volume2 } from 'lucide-react';
import type { PhonemeGroup, PhonemeItem } from '../data/phonetics';
import { useStopMediaOnUnmount } from '../hooks/useStopMediaOnUnmount';
import { getAccentSpeechLang } from '../utils/settings';
import { speakPlayback, stopSpeechPlayback } from '../utils/speechPlayback';
import {
  analyzePronunciationAttempt,
  formatPronunciationDuration,
  getPronunciationRecorderSupport,
  type PronunciationRecordingFeedback,
} from '../utils/pronunciationRecording';

type RecordingPhase = 'idle' | 'recording' | 'processing';

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface PronunciationRecordingCardProps {
  item: PhonemeItem;
  group: PhonemeGroup;
  onPracticeComplete?: (soundId: string) => void;
}

type PronunciationAttemptRecord = PronunciationRecordingFeedback & {
  id: string;
};

const toneStyles = {
  success: {
    panel: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
  },
  warning: {
    panel: 'border-amber-200 bg-amber-50 text-amber-700',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
  },
  neutral: {
    panel: 'border-blue-200 bg-blue-50 text-blue-700',
    bar: 'bg-blue-500',
    dot: 'bg-blue-500',
  },
} as const;

function createRecorderSupportLabel(support: ReturnType<typeof getPronunciationRecorderSupport>) {
  if (!support.mediaRecorder) return '浏览器不支持录音';
  return support.speechRecognition ? '录音 / 识别' : '仅录音';
}

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;

  const browserWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
}

export function PronunciationRecordingCard({ item, group, onPracticeComplete }: PronunciationRecordingCardProps) {
  useStopMediaOnUnmount();

  const support = useMemo(() => getPronunciationRecorderSupport(), []);
  const [phase, setPhase] = useState<RecordingPhase>('idle');
  const [durationMs, setDurationMs] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<PronunciationRecordingFeedback | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<PronunciationAttemptRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [referencePlaying, setReferencePlaying] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const transcriptRef = useRef('');
  const saveAttemptRef = useRef(false);
  const startTimeRef = useRef(0);
  const mountedRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioUrl(null);
  }, []);

  const stopHardware = useCallback(() => {
    clearTimer();

    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Ignore recognition shutdown errors.
      }
    }

    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // Ignore detached tracks.
      }
    });

    recorderRef.current = null;
  }, [clearTimer]);

  const resetAudioPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.pause();
    } catch {
      // Ignore playback shutdown errors.
    }

    try {
      audio.currentTime = 0;
    } catch {
      // Ignore browsers that do not allow seeking yet.
    }

    setIsPlaying(false);
  }, []);

  const stopReferencePlayback = useCallback(() => {
    stopSpeechPlayback();
    setReferencePlaying(false);
  }, []);

  const discardAttempt = useCallback(() => {
    saveAttemptRef.current = false;
    setPhase('idle');
    setDurationMs(0);
    transcriptRef.current = '';
    setTranscript('');
    setFeedback(null);
    setError(null);
    stopReferencePlayback();
    resetAudioPlayback();
    revokeAudioUrl();

    const recorder = recorderRef.current;
    if (recorder && recorder.state === 'recording') {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore shutdown errors.
      }

      try {
        recorder.stop();
      } catch {
        // Ignore double-stop errors.
      }
      return;
    }

    stopHardware();
  }, [resetAudioPlayback, revokeAudioUrl, stopHardware, stopReferencePlayback]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      saveAttemptRef.current = false;
      clearTimer();

      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore teardown errors.
      }

      const stream = streamRef.current;
      stream?.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore detached tracks.
        }
      });

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      stopSpeechPlayback();
      setReferencePlaying(false);
    };
  }, [clearTimer]);

  useEffect(() => {
    discardAttempt();
  }, [item.id, discardAttempt]);

  const handleRecognitionResult = useCallback((event: any) => {
    if (!mountedRef.current) return;

    const lastResult = event?.results?.[event.results.length - 1];
    const transcriptText = String(lastResult?.[0]?.transcript || '').trim();
    transcriptRef.current = transcriptText;
    setTranscript(transcriptText);
  }, []);

  const handleRecognitionError = useCallback((event: any) => {
    if (!mountedRef.current) return;

    const code = String(event?.error || '');
    if (code === 'not-allowed' || code === 'service-not-allowed') {
      setError('语音识别权限被拒绝了，不过录音还是可以继续。');
      return;
    }

    if (code === 'audio-capture') {
      setError('没有检测到可用麦克风。');
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!support.mediaRecorder || !support.microphone) {
      setError('当前浏览器暂时不支持麦克风录音。');
      return;
    }

    stopSpeechPlayback();
    resetAudioPlayback();
    setError(null);
    setPhase('processing');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const recorder = new MediaRecorder(stream);
      const recognitionConstructor = getSpeechRecognitionConstructor();
      const speechLang = getAccentSpeechLang();
      const nextStart = Date.now();

      chunksRef.current = [];
      transcriptRef.current = '';
      startTimeRef.current = nextStart;
      streamRef.current = stream;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        if (!mountedRef.current) return;
        setError('录音时出了点问题，换个声音再试一次。');
        setPhase('idle');
      };

      recorder.onstop = () => {
        if (!mountedRef.current) {
          stopHardware();
          return;
        }

        clearTimer();
        const elapsed = Date.now() - startTimeRef.current;
        setDurationMs(elapsed);

        const shouldSave = saveAttemptRef.current;
        saveAttemptRef.current = false;

        const currentStream = streamRef.current;
        streamRef.current = null;
        currentStream?.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            // Ignore detached tracks.
          }
        });

        const recognition = recognitionRef.current;
        recognitionRef.current = null;
        if (recognition) {
          try {
            recognition.stop();
          } catch {
            // Ignore shutdown errors.
          }
        }

        recorderRef.current = null;

        if (!shouldSave) {
          chunksRef.current = [];
          setPhase('idle');
          return;
        }

        if (!chunksRef.current.length) {
          setPhase('idle');
          setError('没有采到有效音频，再试一次吧。');
          return;
        }

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        chunksRef.current = [];

        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }

        const nextUrl = URL.createObjectURL(blob);
        audioUrlRef.current = nextUrl;
        setAudioUrl(nextUrl);

        const nextFeedback = analyzePronunciationAttempt(item, group, transcriptRef.current, elapsed);
        setFeedback(nextFeedback);
        setRecentAttempts((current) => [
          {
            ...nextFeedback,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          },
          ...current,
        ].slice(0, 3));
        onPracticeComplete?.(item.id);
        setError(null);
        setPhase('idle');
      };

      if (recognitionConstructor) {
        const recognition = new recognitionConstructor();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = speechLang;
        recognition.onresult = handleRecognitionResult;
        recognition.onerror = handleRecognitionError;
        recognition.onend = () => {
          if (recognitionRef.current === recognition) {
            recognitionRef.current = null;
          }
        };
        recognitionRef.current = recognition;
      }

      try {
        recorder.start();
      } catch {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('褰曢煶鍚姩澶辫触');
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          recognitionRef.current = null;
        }
      }

      saveAttemptRef.current = true;
      setDurationMs(0);
      setTranscript('');
      setFeedback(null);
      revokeAudioUrl();
      setIsPlaying(false);
      setPhase('recording');

      clearTimer();
      timerRef.current = window.setInterval(() => {
        if (!mountedRef.current) return;
        setDurationMs(Date.now() - startTimeRef.current);
      }, 120);
    } catch {
      saveAttemptRef.current = false;
      stopHardware();
      setPhase('idle');
      setError('麦克风打不开，先检查权限再试一次。');
    }
  }, [
    clearTimer,
    handleRecognitionError,
    handleRecognitionResult,
    item,
    group,
    onPracticeComplete,
    resetAudioPlayback,
    revokeAudioUrl,
    stopHardware,
    support.mediaRecorder,
    support.microphone,
  ]);

  const handleStopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;

    saveAttemptRef.current = true;
    setPhase('processing');

    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore recognition shutdown errors.
    }

    try {
      recorder.stop();
    } catch {
      setPhase('idle');
    }
  }, []);

  const handleDiscardRecording = useCallback(() => {
    discardAttempt();
  }, [discardAttempt]);

  const handleTogglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audioUrl || !audio) return;

    try {
      stopReferencePlayback();
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
      }
    } catch {
      setError('暂时无法播放这段录音。');
    }
  }, [audioUrl, stopReferencePlayback]);

  const handlePlayReference = useCallback(() => {
    const spoken = item.examples.join('，') || item.symbol;
    if (!spoken) return;

    resetAudioPlayback();
    const started = speakPlayback(spoken, {
      lang: getAccentSpeechLang(),
      rate: 0.85,
      onStart: () => setReferencePlaying(true),
      onEnd: () => setReferencePlaying(false),
    });

    if (!started) {
      setReferencePlaying(false);
      setError('当前浏览器暂时无法播放标准音。');
    }
  }, [item.examples, item.symbol, resetAudioPlayback]);

  const supportLabel = createRecorderSupportLabel(support);
  const statusLabel =
    phase === 'recording'
      ? '正在录音'
      : phase === 'processing'
        ? '处理中'
        : feedback
          ? '已完成'
          : '等待开始';

  const tone = feedback?.tone ?? 'neutral';
  const toneStyle = feedback ? toneStyles[tone] : toneStyles.neutral;

  const isRecordEnabled = support.mediaRecorder && support.microphone && phase !== 'processing';
  const recordButtonLabel = phase === 'recording' ? '停止录音' : '开始录音';
  const recordButtonIcon = phase === 'recording' ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />;

  const waveformBars = useMemo(
    () => Array.from({ length: 12 }, (_, index) => 0.42 + ((index * 17) % 9) * 0.055),
    [],
  );

  return (
    <section className="rounded-[32px] border border-[#d2d2d7]/60 bg-white/85 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.22em] text-[#86868b]">璺熻褰曢煶</div>
          <h3 className="mt-1 text-[24px] font-black tracking-tight text-[#1d1d1f]">
            璇诲嚭 {item.examples[0] || item.symbol}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[13px] font-black text-[#1d1d1f]">
              褰撳墠渚嬭瘝
            </span>
            <span className="inline-flex items-center rounded-full border border-[#d2d2d7] bg-[#f5f5f7] px-3 py-1.5 text-[13px] font-black text-[#636366]">
              {supportLabel}
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-3 py-2 text-[13px] font-black text-[#636366]">
          <Volume2 className="h-4 w-4 text-[#86868b]" />
          {statusLabel}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
        <button
          type="button"
          onClick={phase === 'recording' ? handleStopRecording : startRecording}
          disabled={!isRecordEnabled && phase !== 'recording'}
          className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-[20px] px-4 py-3 text-[15px] font-black transition-all ${
            phase === 'recording'
              ? 'bg-rose-500 text-white shadow-[0_16px_30px_rgba(244,63,94,0.25)] hover:bg-rose-600'
              : isRecordEnabled
                ? 'bg-[#1d1d1f] text-white hover:scale-[1.01] active:scale-95'
                : 'cursor-not-allowed bg-[#e5e5ea] text-[#a1a1a6]'
          }`}
        >
          {recordButtonIcon}
          {recordButtonLabel}
        </button>

        <button
          type="button"
          onClick={handleTogglePlayback}
          disabled={!audioUrl}
          className={`inline-flex min-h-[56px] items-center justify-center gap-2 rounded-[20px] border px-4 py-3 text-[15px] font-black transition-all ${
            audioUrl
              ? 'border-[#d2d2d7] bg-white text-[#1d1d1f] hover:border-blue-200 hover:text-blue-600'
              : 'cursor-not-allowed border-[#e5e5ea] bg-[#f5f5f7] text-[#a1a1a6]'
          }`}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? '鏆傚仠鎾斁' : '鎾斁褰曢煶'}
        </button>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={handleDiscardRecording}
          className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[14px] font-black text-[#1d1d1f] transition-all hover:border-blue-200 hover:text-blue-600"
        >
          <RefreshCcw className="h-4 w-4" />
          閲嶆柊鏉ヤ竴娆?        </button>
      </div>

      <div className="mt-5 rounded-[24px] bg-[#f5f5f7] p-4">
        <div className="flex items-center justify-between gap-4 text-[13px] font-black uppercase tracking-[0.18em] text-[#86868b]">
          <span className="inline-flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                phase === 'recording' ? 'bg-rose-500 animate-pulse' : feedback ? toneStyle.dot : 'bg-[#86868b]'
              }`}
            />
            {error || statusLabel}
          </span>
          <span>{formatPronunciationDuration(durationMs)}</span>
        </div>

        <div className="mt-4 flex h-10 items-end gap-1">
          {waveformBars.map((baseHeight, index) => (
            <span
              key={index}
              className={`w-full max-w-[6px] rounded-full transition-all ${
                phase === 'recording'
                  ? 'bg-rose-500 animate-pulse'
                  : feedback
                    ? toneStyle.bar
                    : 'bg-[#d2d2d7]'
              }`}
              style={{
                height: `${Math.round(baseHeight * 100)}%`,
                opacity: phase === 'recording' ? 1 : feedback ? 0.9 : 0.55,
                animationDelay: `${index * 60}ms`,
              }}
            />
          ))}
        </div>

        <p className="mt-3 text-[15px] font-medium leading-relaxed text-[#636366]">
          {transcript ? `识别到：${transcript}` : '录完后这里会出现识别到的文字。'}
        </p>
      </div>

      <div
        aria-live="polite"
        className={`mt-4 rounded-[24px] border p-4 ${
          feedback ? toneStyle.panel : 'border-[#d2d2d7] bg-white text-[#636366]'
        }`}
      >
        {feedback ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[12px] font-black uppercase tracking-[0.2em] opacity-70">简单反馈</div>
                <div className="mt-1 text-[19px] font-black text-current">{feedback.title}</div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-black uppercase tracking-[0.2em] opacity-70">参考分</div>
                <div className="text-[30px] font-black leading-none text-current">{feedback.score}</div>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/60">
              <div className={`h-full rounded-full ${toneStyle.bar}`} style={{ width: `${feedback.score}%` }} />
            </div>

            <p className="text-[15px] font-medium leading-relaxed text-current">{feedback.detail}</p>

            <div className="flex flex-wrap gap-2 text-[13px] font-black tracking-[0.14em]">
              <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-2 text-current">
                目标 {feedback.targetWord}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-2 text-current">
                用时 {feedback.durationLabel}
              </span>
              {feedback.recognizedWord ? (
                <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-2 text-current">
                  识别 {feedback.recognizedWord}
                </span>
              ) : null}
            </div>

            <div className="rounded-[20px] bg-white/45 p-3">
              <div className="text-[12px] font-black uppercase tracking-[0.18em] text-current/70">对比播放</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handlePlayReference}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[18px] border border-white/70 bg-white px-4 py-3 text-[14px] font-black text-[#1d1d1f] transition-all hover:border-blue-200 hover:text-blue-600"
                >
                  {referencePlaying ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  {referencePlaying ? '暂停标准音' : '播放标准音'}
                </button>
                <button
                  type="button"
                  onClick={handleTogglePlayback}
                  disabled={!audioUrl}
                  className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[18px] border px-4 py-3 text-[14px] font-black transition-all ${
                    audioUrl
                      ? 'border-[#d2d2d7] bg-white text-[#1d1d1f] hover:border-blue-200 hover:text-blue-600'
                      : 'cursor-not-allowed border-[#e5e5ea] bg-[#f5f5f7] text-[#a1a1a6]'
                  }`}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? '暂停我的录音' : '播放我的录音'}
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[20px] bg-white/45 p-4 text-current">
                <div className="text-[12px] font-black uppercase tracking-[0.18em] text-current/70">听到了什么</div>
                <p className="mt-2 text-[15px] font-medium leading-relaxed">{feedback.summary}</p>
              </div>
              <div className="rounded-[20px] bg-white/45 p-4 text-current">
                <div className="text-[12px] font-black uppercase tracking-[0.18em] text-current/70">节奏提示</div>
                <p className="mt-2 text-[15px] font-medium leading-relaxed">{feedback.timingNote}</p>
              </div>
              <div className="rounded-[20px] bg-white/45 p-4 text-current">
                <div className="text-[12px] font-black uppercase tracking-[0.18em] text-current/70">下一步建议</div>
                <p className="mt-2 text-[15px] font-medium leading-relaxed">{feedback.nextStep}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[15px] font-medium leading-relaxed">
            录一遍就行，先听自己怎么落音，再看下面的简单反馈。
          </div>
        )}
      </div>
      {recentAttempts.length ? (
        <div className="mt-4">
          <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[#86868b]">最近练习</div>
          <div className="mt-3 space-y-2">
            {recentAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="rounded-[20px] border border-[#e5e5ea] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[15px] font-black text-[#1d1d1f]">{attempt.title}</div>
                    <div className="mt-1 text-[13px] font-medium leading-relaxed text-[#636366]">
                      {attempt.detail}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-black uppercase tracking-[0.18em] text-[#86868b]">鍒嗘暟</div>
                    <div className="text-[22px] font-black leading-none text-[#1d1d1f]">{attempt.score}</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-[#f5f5f7] px-3 py-1.5 text-[12px] font-black text-[#636366]">
                    鐩爣 {attempt.targetWord}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[#f5f5f7] px-3 py-1.5 text-[12px] font-black text-[#636366]">
                    鐢ㄦ椂 {attempt.durationLabel}
                  </span>
                  {attempt.recognizedWord ? (
                    <span className="inline-flex items-center rounded-full bg-[#f5f5f7] px-3 py-1.5 text-[12px] font-black text-[#636366]">
                      璇嗗埆 {attempt.recognizedWord}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        className="hidden"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
    </section>
  );
}

