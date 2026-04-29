import type { UserProgress, DailyStats } from '../data/types';

const STORAGE_KEYS = {
  PROGRESS: 'el_user_progress',
  DAILY_STATS: 'el_daily_stats',
  SETTINGS: 'el_settings',
};

const defaultProgress: UserProgress = {
  currentListId: 'cet4',
  dailyGoal: 20,
  learnedToday: 0,
  totalLearned: 0,
  streak: 0,
  lastStudyDate: '',
  records: {},
  favorites: [],
};

export function getProgress(): UserProgress {
  const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
  if (!data) return { ...defaultProgress };
  const progress = JSON.parse(data) as UserProgress;
  const today = new Date().toISOString().split('T')[0];
  if (progress.lastStudyDate !== today) {
    progress.learnedToday = 0;
  }
  return progress;
}

export function saveProgress(progress: UserProgress): void {
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
}

export function getDailyStats(): DailyStats[] {
  const data = localStorage.getItem(STORAGE_KEYS.DAILY_STATS);
  if (!data) return [];
  return JSON.parse(data) as DailyStats[];
}

export function saveDailyStats(stats: DailyStats[]): void {
  localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(stats));
}

export function addDailyStat(stat: DailyStats): void {
  const stats = getDailyStats();
  const existingIndex = stats.findIndex(s => s.date === stat.date);
  if (existingIndex >= 0) {
    stats[existingIndex] = {
      ...stats[existingIndex],
      learned: stats[existingIndex].learned + stat.learned,
      reviewed: stats[existingIndex].reviewed + stat.reviewed,
      correctRate: (stats[existingIndex].correctRate + stat.correctRate) / 2,
      timeSpent: stats[existingIndex].timeSpent + stat.timeSpent,
    };
  } else {
    stats.push(stat);
  }
  saveDailyStats(stats.slice(-30));
}

export function calculateNextReview(level: number): string {
  const intervals = [1, 2, 4, 7, 15, 30];
  const days = intervals[Math.min(level, intervals.length - 1)];
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString().split('T')[0];
}

export function updateStreak(progress: UserProgress): UserProgress {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (progress.lastStudyDate === today) return progress;
  if (progress.lastStudyDate === yesterday) {
    progress.streak += 1;
  } else if (progress.lastStudyDate !== today) {
    progress.streak = 1;
  }
  progress.lastStudyDate = today;
  return progress;
}
