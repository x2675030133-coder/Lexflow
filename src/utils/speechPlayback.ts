type SpeechState = {
  id: number;
  text: string;
  rate: number;
  lang: string;
  onEnd?: () => void;
  onStart?: () => void;
};

let currentSpeech: SpeechState | null = null;
let activeSpeechId = 0;
let pendingSpeechTimer: number | null = null;
let pendingSpeechToken = 0;

function getSpeechSynthesis() {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis || null;
}

function cancelPendingSpeech() {
  pendingSpeechToken += 1;

  if (pendingSpeechTimer !== null) {
    window.clearTimeout(pendingSpeechTimer);
    pendingSpeechTimer = null;
  }
}

export function stopSpeechPlayback() {
  const synthesis = getSpeechSynthesis();
  cancelPendingSpeech();
  activeSpeechId += 1;
  if (!synthesis) return;
  try {
    synthesis.cancel();
  } catch {
    // Ignore browser-specific errors.
  }
  currentSpeech = null;
}

export function pauseSpeechPlayback() {
  const synthesis = getSpeechSynthesis();
  if (!synthesis || !synthesis.speaking || synthesis.paused) return false;
  try {
    synthesis.pause();
    return true;
  } catch {
    // Ignore browser-specific errors.
    return false;
  }
}

export function resumeSpeechPlayback() {
  const synthesis = getSpeechSynthesis();
  if (!synthesis || !synthesis.paused) return false;
  try {
    synthesis.resume();
    return true;
  } catch {
    // Ignore browser-specific errors.
    return false;
  }
}

export function isSpeechPaused() {
  const synthesis = getSpeechSynthesis();
  return Boolean(synthesis?.paused);
}

export function isSpeechPlaying() {
  const synthesis = getSpeechSynthesis();
  return Boolean(synthesis?.speaking && !synthesis?.paused);
}

export function speakPlayback(
  text: string,
  options: {
    rate?: number;
    lang?: string;
    onEnd?: () => void;
    onStart?: () => void;
    cancelPrevious?: boolean;
  } = {},
): boolean {
  const synthesis = getSpeechSynthesis();
  if (!synthesis) return false;

  const nextRate = options.rate ?? 0.85;
  const nextLang = options.lang ?? 'en-US';
  const speechId = activeSpeechId + 1;
  const shouldDefer = options.cancelPrevious !== false;

  cancelPendingSpeech();

  if (shouldDefer) {
    stopSpeechPlayback();
  }

  const startSpeech = () => {
    if (speechId !== activeSpeechId + 1 && speechId !== activeSpeechId) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = nextLang;
    utterance.rate = nextRate;
    utterance.onstart = () => {
      if (speechId !== activeSpeechId) return;
      currentSpeech = {
        id: speechId,
        text,
        rate: nextRate,
        lang: nextLang,
        onEnd: options.onEnd,
        onStart: options.onStart,
      };
      options.onStart?.();
    };
    utterance.onend = () => {
      if (speechId !== activeSpeechId) return;
      currentSpeech = null;
      options.onEnd?.();
    };
    utterance.onerror = () => {
      if (speechId !== activeSpeechId) return;
      currentSpeech = null;
      options.onEnd?.();
    };

    activeSpeechId = speechId;
    currentSpeech = {
      id: speechId,
      text,
      rate: nextRate,
      lang: nextLang,
      onEnd: options.onEnd,
      onStart: options.onStart,
    };

    synthesis.speak(utterance);
  };

  if (shouldDefer) {
    const token = pendingSpeechToken;
    pendingSpeechTimer = window.setTimeout(() => {
      if (token !== pendingSpeechToken) return;
      pendingSpeechTimer = null;
      startSpeech();
    }, 0);
  } else {
    startSpeech();
  }

  return true;
}

export function restartSpeechPlayback(
  options: {
    rate?: number;
  } = {},
) {
  const current = currentSpeech;
  if (!current) return false;

  const nextRate = options.rate ?? current.rate;
  stopSpeechPlayback();
  return speakPlayback(current.text, {
    rate: nextRate,
    lang: current.lang,
    onEnd: current.onEnd,
    onStart: current.onStart,
  });
}

export function getCurrentSpeech() {
  return currentSpeech;
}
