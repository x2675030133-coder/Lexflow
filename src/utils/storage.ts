import type { DailyStats, UserProgress } from '../data/types';
import {
  emitProgressChanged,
  readScopedJson,
  STORAGE_BASE_KEYS,
  writeScopedJson,
} from './scopedStorage';

function today() {
  return new Date().toISOString().split('T')[0];
}

export function createDefaultProgress(): UserProgress {
  return {
    currentListId: 'cet4',
    dailyGoal: 20,
    learnedToday: 0,
    totalLearned: 0,
    streak: 0,
    lastStudyDate: '',
    records: {},
    favorites: [],
    updatedAt: '',
  };
}

function normalizeProgress(progress: UserProgress): UserProgress {
  const records = progress.records && typeof progress.records === 'object' && !Array.isArray(progress.records)
    ? progress.records
    : {};
  const favorites = Array.isArray(progress.favorites)
    ? Array.from(new Set(progress.favorites.map((item) => String(item || '').trim()).filter(Boolean)))
    : [];
  const next: UserProgress = {
    ...createDefaultProgress(),
    ...progress,
    records,
    favorites,
  };

  if (next.lastStudyDate !== today()) {
    next.learnedToday = 0;
  }

  return next;
}

export function getProgress(): UserProgress {
  return normalizeProgress(readScopedJson<UserProgress>(STORAGE_BASE_KEYS.progress, createDefaultProgress()));
}

export function saveProgress(progress: UserProgress): void {
  const next = normalizeProgress({
    ...progress,
    updatedAt: new Date().toISOString(),
  });
  writeScopedJson(STORAGE_BASE_KEYS.progress, next);
  emitProgressChanged();
}

export function getDailyStats(): DailyStats[] {
  const stats = readScopedJson<DailyStats[]>(STORAGE_BASE_KEYS.dailyStats, []);
  return Array.isArray(stats) ? stats : [];
}

export function saveDailyStats(stats: DailyStats[]): void {
  writeScopedJson(STORAGE_BASE_KEYS.dailyStats, Array.isArray(stats) ? stats.slice(-30) : []);
  emitProgressChanged();
}

export function addDailyStat(stat: DailyStats): void {
  const stats = getDailyStats();
  const existingIndex = stats.findIndex((item) => item.date === stat.date);
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
  const currentToday = today();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (progress.lastStudyDate === currentToday) return progress;
  if (progress.lastStudyDate === yesterday) {
    progress.streak += 1;
  } else if (progress.lastStudyDate !== currentToday) {
    progress.streak = 1;
  }
  progress.lastStudyDate = currentToday;
  return progress;
}
