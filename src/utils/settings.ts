export type AppSettings = {
  accent: 'us' | 'uk';
  notifications: boolean;
  hidePremiumCard: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  accent: 'us',
  notifications: true,
  hidePremiumCard: false,
};

const SETTINGS_KEY = 'el_settings';

export function getSettings(): AppSettings {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(data) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const next = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('settingsUpdated'));
  return next;
}

export function speakText(text: string, rate = 0.85) {
  const settings = getSettings();
  speakPlayback(text, {
    rate,
    lang: settings.accent === 'uk' ? 'en-GB' : 'en-US',
  });
}

export function getAccentSpeechLang() {
  return getSettings().accent === 'uk' ? 'en-GB' : 'en-US';
}

import { speakPlayback, stopSpeechPlayback } from './speechPlayback';

export function stopTextSpeech() {
  stopSpeechPlayback();
}
