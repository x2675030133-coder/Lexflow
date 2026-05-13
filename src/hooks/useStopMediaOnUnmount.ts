import { useEffect } from 'react';
import { stopSpeechPlayback } from '../utils/speechPlayback';

export function stopPageMedia() {
  if (typeof window === 'undefined') return;

  try {
    stopSpeechPlayback();
  } catch {
    // Ignore browser-specific errors.
  }

  const mediaElements = Array.from(document.querySelectorAll('audio, video')) as HTMLMediaElement[];
  mediaElements.forEach((media) => {
    try {
      media.pause();
    } catch {
      // Ignore detached or already-ended media.
    }

    try {
      media.currentTime = 0;
    } catch {
      // Some live streams or unavailable media cannot be reset.
    }
  });
}

export function useStopMediaOnUnmount() {
  useEffect(() => stopPageMedia, []);
}
