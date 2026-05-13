import type { PhonemeGroup, PhonemeItem } from '../data/phonetics';

export type PronunciationFeedbackTone = 'success' | 'warning' | 'neutral';

export interface PronunciationRecorderSupport {
  microphone: boolean;
  mediaRecorder: boolean;
  speechRecognition: boolean;
}

export interface PronunciationRecordingFeedback {
  tone: PronunciationFeedbackTone;
  title: string;
  detail: string;
  summary: string;
  timingNote: string;
  nextStep: string;
  score: number;
  transcript: string;
  targetWord: string;
  recognizedWord: string | null;
  durationMs: number;
  durationLabel: string;
}

export function getPronunciationRecorderSupport(): PronunciationRecorderSupport {
  if (typeof window === 'undefined') {
    return {
      microphone: false,
      mediaRecorder: false,
      speechRecognition: false,
    };
  }

  const browserWindow = window as Window & {
    SpeechRecognition?: new () => unknown;
    webkitSpeechRecognition?: new () => unknown;
  };

  return {
    microphone: Boolean(navigator.mediaDevices?.getUserMedia),
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    speechRecognition: Boolean(browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition),
  };
}

export function normalizePronunciationText(text: string) {
  return String(text || '')
    .toLowerCase()
    .replace(/[’'"]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatPronunciationDuration(durationMs: number) {
  const durationSeconds = Math.max(0, durationMs) / 1000;
  return durationSeconds < 10 ? `${durationSeconds.toFixed(1)}s` : `${Math.round(durationSeconds)}s`;
}

export function analyzePronunciationAttempt(
  item: PhonemeItem,
  group: PhonemeGroup,
  transcript: string,
  durationMs: number,
): PronunciationRecordingFeedback {
  const targetWord = item.examples[0] || item.symbol;
  const normalizedTranscript = normalizePronunciationText(transcript);
  const normalizedExamples = item.examples.map((word) => normalizePronunciationText(word)).filter(Boolean);
  const recognizedWord = normalizedExamples.find((word) => {
    return normalizedTranscript === word || normalizedTranscript.includes(word) || word.includes(normalizedTranscript);
  });

  const isLongSound = item.groupId === 'long-vowels' || item.groupId === 'diphthongs';
  const isVowel = group.kind === 'vowel';
  const duration = Math.max(0, durationMs);
  const durationLabel = formatPronunciationDuration(duration);

  let tone: PronunciationFeedbackTone = 'neutral';
  let title = '先再读一次';
  let detail = `先读出 ${targetWord}，再看简单反馈。`;
  let summary = '这次还没有识别到目标词。';
  let timingNote = '先跟着标准音把这个词完整读一遍。';
  let nextStep = '再录一次，看看时长和识别会不会更稳。';
  let score = 55;

  if (recognizedWord) {
    tone = 'success';
    title = `识别到 ${recognizedWord}`;
    detail = `识别到了「${recognizedWord}」。`;
    summary = `系统听到了「${recognizedWord}」。`;
    timingNote = '识别到了目标词，再看长度是不是自然。';
    nextStep = '可以回放标准音，再和自己的录音比一下。';
    score = 82;
  } else if (normalizedTranscript) {
    title = '听到了你的读音';
    detail = `识别到「${transcript.trim()}」。`;
    summary = `系统听到了「${transcript.trim()}」。`;
    timingNote = '这次有识别结果，但还要看节奏是不是合适。';
    nextStep = '可以稍微放慢一点，或者把收尾说得更干净。';
    score = 66;
  }

  if (isVowel) {
    if (isLongSound) {
      if (duration < 650) {
        if (tone !== 'success') tone = 'warning';
        detail += ' 这个音可以再拖长一点。';
        timingNote = '这个长元音偏短了。';
        nextStep = '再把这个长元音拖长一点。';
        score -= 8;
      } else if (duration > 1800) {
        if (tone !== 'success') tone = 'warning';
        detail += ' 稍微收一点会更干净。';
        timingNote = '这个长元音有点拖久了。';
        nextStep = '把收尾稍微收紧一点。';
        score -= 6;
      } else {
        detail += ' 长度比较合适。';
        timingNote = '长度大体正常。';
        score += 5;
      }
    } else if (duration < 350) {
      if (tone !== 'success') tone = 'warning';
      detail += ' 可以把元音说得更完整一点。';
      timingNote = '这个短元音偏快了。';
      nextStep = '把元音开口说完整一点，再快速收尾。';
      score -= 6;
    } else if (duration > 1350) {
      if (tone !== 'success') tone = 'warning';
      detail += ' 短元音最好更利落。';
      timingNote = '这个短元音偏长了。';
      nextStep = '把尾音收短一点。';
      score -= 8;
    } else {
      detail += ' 节奏挺自然。';
      timingNote = '时长比较贴近常见节奏。';
      score += 4;
    }
  } else if (duration < 280) {
    if (tone !== 'success') tone = 'warning';
    detail += ' 起音有点急，可以更完整一点。';
    timingNote = '这个辅音起音太短了。';
    nextStep = '把起音做完整，再快速收尾。';
    score -= 6;
  } else if (duration > 1200) {
    if (tone !== 'success') tone = 'warning';
    detail += ' 辅音最好更利落一点。';
    timingNote = '这个辅音拖得有点长。';
    nextStep = '把辅音说得更脆一点。';
    score -= 8;
  } else {
    detail += ' 节奏比较干净。';
    timingNote = '辅音长度大体合适。';
    score += 4;
  }

  if (recognizedWord) {
    score += 8;
  }

  score = Math.max(40, Math.min(98, score));

  if (recognizedWord && score >= 85) {
    tone = 'success';
  } else if (tone === 'neutral' && score < 70) {
    tone = 'warning';
  }

  return {
    tone,
    title,
    detail,
    summary,
    timingNote,
    nextStep,
    score,
    transcript: transcript.trim(),
    targetWord,
    recognizedWord: recognizedWord || null,
    durationMs: duration,
    durationLabel,
  };
}
