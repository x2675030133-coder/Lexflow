import { addDailyStat } from './storage';

function today() {
  return new Date().toISOString().split('T')[0];
}

export function recordStudyTime(minutes: number): void {
  const value = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes * 100) / 100) : 0;
  if (value <= 0) return;

  addDailyStat({
    date: today(),
    learned: 0,
    reviewed: 0,
    correctRate: 0,
    timeSpent: value,
  });
}

export function formatStudyDuration(totalMinutes: number): string {
  const totalSeconds = Math.max(0, Math.round(totalMinutes * 60));
  if (totalSeconds === 0) return '0秒';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}时${String(minutes).padStart(2, '0')}分` : `${hours}时`;
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}分${String(seconds).padStart(2, '0')}秒` : `${minutes}分`;
  }

  return `${seconds}秒`;
}
