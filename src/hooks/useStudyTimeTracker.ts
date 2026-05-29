import { useEffect, useRef } from 'react';
import { recordStudyTime } from '../utils/studyTime';

export function useStudyTimeTracker(enabled = true) {
  const startedAtRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);

  useEffect(() => {
    if (!enabled || document.visibilityState !== 'visible') {
      return () => {
        if (startedAtRef.current !== null) {
          accumulatedMsRef.current += performance.now() - startedAtRef.current;
          startedAtRef.current = null;
        }
        recordStudyTime(accumulatedMsRef.current / 60000);
        accumulatedMsRef.current = 0;
      };
    }

    const startTimer = () => {
      if (startedAtRef.current !== null) return;
      startedAtRef.current = performance.now();
    };

    const stopTimer = () => {
      if (startedAtRef.current === null) return;
      accumulatedMsRef.current += performance.now() - startedAtRef.current;
      startedAtRef.current = null;
    };

    const flushTimer = () => {
      stopTimer();
      recordStudyTime(accumulatedMsRef.current / 60000);
      accumulatedMsRef.current = 0;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startTimer();
      } else {
        flushTimer();
      }
    };

    startTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', flushTimer);
    window.addEventListener('beforeunload', flushTimer);

    return () => {
      flushTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', flushTimer);
      window.removeEventListener('beforeunload', flushTimer);
    };
  }, [enabled]);
}
