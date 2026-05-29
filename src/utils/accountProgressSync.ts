import type { DailyStats, LearningRecord, UserProgress } from '../data/types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { PronunciationProgress } from './pronunciationProgress';
import { createDefaultProgress } from './storage';
import {
  clearProgressScope,
  DEFAULT_SCOPE,
  emitProgressChanged,
  getActiveScope,
  normalizeScope,
  readScopedJson,
  STORAGE_BASE_KEYS,
  writeScopedJson,
} from './scopedStorage';

export interface AccountProgressSnapshot {
  progress: UserProgress;
  dailyStats: DailyStats[];
  reading: string[];
  readingComplete: string[];
  readingStudy: unknown;
  listening: string[];
  podcasts: string[];
  pronunciation: PronunciationProgress;
  updatedAt: string;
}

const EMPTY_SNAPSHOT: AccountProgressSnapshot = {
  progress: createDefaultProgress(),
  dailyStats: [],
  reading: [],
  readingComplete: [],
  readingStudy: { articles: {}, updatedAt: '' },
  listening: [],
  podcasts: [],
  pronunciation: {
    favorites: [],
    practiced: [],
    lastSelectedId: '',
    updatedAt: '',
  },
  updatedAt: '',
};

const pendingUploads = new Map<string, number>();
let suppressUploads = false;

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function asArray(value: unknown): string[] {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean)))
    : [];
}

function asStats(value: unknown): DailyStats[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      date: String((item as DailyStats).date || ''),
      learned: Number((item as DailyStats).learned || 0),
      reviewed: Number((item as DailyStats).reviewed || 0),
      correctRate: Number((item as DailyStats).correctRate || 0),
      timeSpent: Number((item as DailyStats).timeSpent || 0),
    }))
    .filter((item) => Boolean(item.date));
}

function asPlainObject<T>(value: unknown, fallback: T): T {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as T : fallback;
}

function asPronunciation(value: unknown): PronunciationProgress {
  const progress = asPlainObject<Partial<PronunciationProgress>>(value, {});
  return {
    favorites: asArray(progress.favorites),
    practiced: asArray(progress.practiced),
    lastSelectedId: String(progress.lastSelectedId || '').trim(),
    updatedAt: String(progress.updatedAt || ''),
  };
}

function asRecord(value: unknown, wordId: string): LearningRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Partial<LearningRecord>;
  return {
    wordId,
    correctCount: Number(record.correctCount || 0),
    wrongCount: Number(record.wrongCount || 0),
    lastReviewDate: String(record.lastReviewDate || ''),
    nextReviewDate: String(record.nextReviewDate || ''),
    level: Number(record.level || 0),
    mastered: Boolean(record.mastered),
    updatedAt: String(record.updatedAt || ''),
  };
}

function recordStamp(record: LearningRecord): number {
  const value = Date.parse(record.updatedAt || record.lastReviewDate || '');
  return Number.isNaN(value) ? 0 : value;
}

function compareRecords(left: LearningRecord | null, right: LearningRecord | null): LearningRecord | null {
  if (!left) return right;
  if (!right) return left;

  const leftStamp = recordStamp(left);
  const rightStamp = recordStamp(right);
  if (leftStamp !== rightStamp) {
    return leftStamp > rightStamp ? left : right;
  }

  const leftAttempts = left.correctCount + left.wrongCount;
  const rightAttempts = right.correctCount + right.wrongCount;
  if (leftAttempts !== rightAttempts) {
    return leftAttempts > rightAttempts ? left : right;
  }

  if (left.level !== right.level) {
    return left.level > right.level ? left : right;
  }

  return right.mastered ? right : left;
}

function normalizeProgress(progress: Partial<UserProgress> | null | undefined): UserProgress {
  const base = createDefaultProgress();
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) {
    return base;
  }

  const records = progress.records && typeof progress.records === 'object' && !Array.isArray(progress.records)
    ? Object.entries(progress.records).reduce<Record<string, LearningRecord>>((acc, [wordId, value]) => {
        const record = asRecord(value, wordId);
        if (record) acc[wordId] = record;
        return acc;
      }, {})
    : {};

  const favorites = asArray(progress.favorites);
  const next: UserProgress = {
    ...base,
    ...progress,
    records,
    favorites,
    updatedAt: String(progress.updatedAt || ''),
  };

  if (!next.records || typeof next.records !== 'object') {
    next.records = {};
  }

  if (next.lastStudyDate !== today()) {
    next.learnedToday = 0;
  }

  next.totalLearned = Object.values(next.records).filter((record) => record.correctCount > 0).length;

  return next;
}

function snapshotStamp(snapshot: AccountProgressSnapshot): number {
  const progressStamp = Date.parse(snapshot.progress.updatedAt || '');
  const fallbackStamp = snapshot.dailyStats
    .map((item) => Date.parse(item.date || ''))
    .filter((value) => !Number.isNaN(value))
    .sort((left, right) => right - left)[0] || 0;
  return Number.isNaN(progressStamp) ? fallbackStamp : progressStamp;
}

function readSnapshotForScope(scope: string): AccountProgressSnapshot {
  const nextScope = normalizeScope(scope);
  const progress = normalizeProgress(readScopedJson<UserProgress>(STORAGE_BASE_KEYS.progress, createDefaultProgress(), nextScope));
  return {
    progress,
    dailyStats: asStats(readScopedJson<DailyStats[]>(STORAGE_BASE_KEYS.dailyStats, [], nextScope)),
    reading: asArray(readScopedJson<string[]>(STORAGE_BASE_KEYS.reading, [], nextScope)),
    readingComplete: asArray(readScopedJson<string[]>(STORAGE_BASE_KEYS.readingComplete, [], nextScope)),
    readingStudy: asPlainObject(readScopedJson<unknown>(STORAGE_BASE_KEYS.readingStudy, { articles: {}, updatedAt: '' }, nextScope), { articles: {}, updatedAt: '' }),
    listening: asArray(readScopedJson<string[]>(STORAGE_BASE_KEYS.listening, [], nextScope)),
    podcasts: asArray(readScopedJson<string[]>(STORAGE_BASE_KEYS.podcast, [], nextScope)),
    pronunciation: asPronunciation(readScopedJson<PronunciationProgress>(STORAGE_BASE_KEYS.pronunciation, EMPTY_SNAPSHOT.pronunciation, nextScope)),
    updatedAt: progress.updatedAt || '',
  };
}

function writeSnapshotForScope(scope: string, snapshot: AccountProgressSnapshot): void {
  const nextScope = normalizeScope(scope);
  const stampedProgress = normalizeProgress({
    ...snapshot.progress,
    updatedAt: snapshot.progress.updatedAt || now(),
  });

  writeScopedJson(STORAGE_BASE_KEYS.progress, stampedProgress, nextScope);
  writeScopedJson(STORAGE_BASE_KEYS.dailyStats, snapshot.dailyStats.slice(-30), nextScope);
  writeScopedJson(STORAGE_BASE_KEYS.reading, Array.from(new Set(snapshot.reading)), nextScope);
  writeScopedJson(STORAGE_BASE_KEYS.readingComplete, Array.from(new Set(snapshot.readingComplete)), nextScope);
  writeScopedJson(STORAGE_BASE_KEYS.readingStudy, asPlainObject(snapshot.readingStudy, { articles: {}, updatedAt: '' }), nextScope);
  writeScopedJson(STORAGE_BASE_KEYS.listening, Array.from(new Set(snapshot.listening)), nextScope);
  writeScopedJson(STORAGE_BASE_KEYS.podcast, Array.from(new Set(snapshot.podcasts)), nextScope);
  writeScopedJson(STORAGE_BASE_KEYS.pronunciation, asPronunciation(snapshot.pronunciation), nextScope);
  emitProgressChanged();
}

function mergeDailyStats(primary: DailyStats[], secondary: DailyStats[]): DailyStats[] {
  const map = new Map<string, DailyStats>();
  primary.forEach((item) => {
    if (item.date) map.set(item.date, item);
  });
  secondary.forEach((item) => {
    if (item.date && !map.has(item.date)) map.set(item.date, item);
  });
  return Array.from(map.values()).sort((left, right) => left.date.localeCompare(right.date));
}

function mergeProgress(primary: UserProgress, secondary: UserProgress): UserProgress {
  const mergedRecords: Record<string, LearningRecord> = {};
  const ids = new Set([...Object.keys(secondary.records), ...Object.keys(primary.records)]);
  const primaryUpdatedAt = primary.updatedAt || '';
  const secondaryUpdatedAt = secondary.updatedAt || '';
  const primaryIsNewer = primaryUpdatedAt >= secondaryUpdatedAt;

  ids.forEach((wordId) => {
    const chosen = compareRecords(primary.records[wordId] || null, secondary.records[wordId] || null);
    if (chosen) {
      mergedRecords[wordId] = chosen;
    }
  });

  const favorites = Array.from(new Set([...(secondary.favorites || []), ...(primary.favorites || [])]));
  const totalLearned = Object.values(mergedRecords).filter((record) => record.correctCount > 0).length;
  const learnedToday = Object.values(mergedRecords).filter((record) => record.correctCount > 0 && record.lastReviewDate === today()).length;

  return {
    ...secondary,
    ...primary,
    currentListId: primary.currentListId || secondary.currentListId || 'cet4',
    dailyGoal: primary.dailyGoal || secondary.dailyGoal || 20,
    streak: Math.max(primary.streak || 0, secondary.streak || 0),
    lastStudyDate: primaryIsNewer ? primary.lastStudyDate : secondary.lastStudyDate,
    learnedToday: Math.max(primary.learnedToday || 0, secondary.learnedToday || 0, learnedToday),
    totalLearned: Math.max(primary.totalLearned || 0, secondary.totalLearned || 0, totalLearned),
    records: mergedRecords,
    favorites,
    updatedAt: primaryIsNewer ? primaryUpdatedAt : secondaryUpdatedAt,
  };
}

function mergeReadingStudy(primary: unknown, secondary: unknown): unknown {
  const left = asPlainObject<{ articles?: Record<string, unknown>; updatedAt?: string }>(secondary, {});
  const right = asPlainObject<{ articles?: Record<string, unknown>; updatedAt?: string }>(primary, {});
  return {
    ...left,
    ...right,
    articles: {
      ...(left.articles || {}),
      ...(right.articles || {}),
    },
    updatedAt: right.updatedAt || left.updatedAt || '',
  };
}

function mergePronunciation(primary: PronunciationProgress, secondary: PronunciationProgress): PronunciationProgress {
  return {
    favorites: Array.from(new Set([...(secondary.favorites || []), ...(primary.favorites || [])])),
    practiced: Array.from(new Set([...(secondary.practiced || []), ...(primary.practiced || [])])),
    lastSelectedId: primary.lastSelectedId || secondary.lastSelectedId || '',
    updatedAt: primary.updatedAt || secondary.updatedAt || '',
  };
}

function normalizeSnapshotPayload(data: Partial<AccountProgressSnapshot> | null | undefined, fallbackUpdatedAt = ''): AccountProgressSnapshot {
  return {
    progress: normalizeProgress(data?.progress),
    dailyStats: asStats(data?.dailyStats),
    reading: asArray(data?.reading),
    readingComplete: asArray(data?.readingComplete),
    readingStudy: asPlainObject(data?.readingStudy, { articles: {}, updatedAt: '' }),
    listening: asArray(data?.listening),
    podcasts: asArray(data?.podcasts),
    pronunciation: asPronunciation(data?.pronunciation),
    updatedAt: String(data?.updatedAt || fallbackUpdatedAt || ''),
  };
}

export function readCurrentAccountSnapshot(scope = getActiveScope()): AccountProgressSnapshot {
  return readSnapshotForScope(scope);
}

export function writeCurrentAccountSnapshot(snapshot: AccountProgressSnapshot, scope = getActiveScope()): void {
  writeSnapshotForScope(scope, snapshot);
}

export function isAccountSnapshotEmpty(snapshot: AccountProgressSnapshot): boolean {
  return (
    snapshot.progress.totalLearned === 0 &&
    snapshot.progress.learnedToday === 0 &&
    Object.keys(snapshot.progress.records).length === 0 &&
    snapshot.dailyStats.length === 0 &&
    snapshot.reading.length === 0 &&
    snapshot.readingComplete.length === 0 &&
    snapshot.listening.length === 0 &&
    snapshot.podcasts.length === 0 &&
    snapshot.pronunciation.favorites.length === 0 &&
    snapshot.pronunciation.practiced.length === 0
  );
}

export function mergeAccountSnapshots(primary: AccountProgressSnapshot, secondary: AccountProgressSnapshot): AccountProgressSnapshot {
  const primaryStamp = snapshotStamp(primary);
  const secondaryStamp = snapshotStamp(secondary);
  const newer = primaryStamp >= secondaryStamp ? primary : secondary;
  const older = primaryStamp >= secondaryStamp ? secondary : primary;

  return {
    progress: mergeProgress(newer.progress, older.progress),
    dailyStats: mergeDailyStats(newer.dailyStats, older.dailyStats),
    reading: Array.from(new Set([...(newer.reading || []), ...(older.reading || [])])),
    readingComplete: Array.from(new Set([...(newer.readingComplete || []), ...(older.readingComplete || [])])),
    readingStudy: mergeReadingStudy(newer.readingStudy, older.readingStudy),
    listening: Array.from(new Set([...(newer.listening || []), ...(older.listening || [])])),
    podcasts: Array.from(new Set([...(newer.podcasts || []), ...(older.podcasts || [])])),
    pronunciation: mergePronunciation(newer.pronunciation, older.pronunciation),
    updatedAt: newer.updatedAt || older.updatedAt || now(),
  };
}

async function fetchAccountSnapshotFromSupabase(userId: string): Promise<AccountProgressSnapshot | null> {
  if (!isSupabaseConfigured || !userId) return null;

  const { data, error } = await supabase
    .from('account_progress')
    .select('snapshot, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return null;
  if (!data) return null;

  return normalizeSnapshotPayload(data.snapshot as Partial<AccountProgressSnapshot>, String(data.updated_at || ''));
}

async function saveAccountSnapshotToSupabase(
  email: string,
  userId: string,
  snapshot: AccountProgressSnapshot,
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  const updatedAt = now();
  const { error } = await supabase
    .from('account_progress')
    .upsert({
      user_id: userId,
      email: String(email || '').trim().toLowerCase(),
      snapshot: {
        ...snapshot,
        updatedAt,
      },
      updated_at: updatedAt,
    }, { onConflict: 'user_id' });

  return !error;
}

export async function fetchAccountSnapshot(email: string, userId = ''): Promise<AccountProgressSnapshot | null> {
  const supabaseSnapshot = await fetchAccountSnapshotFromSupabase(userId);
  if (supabaseSnapshot) return supabaseSnapshot;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  try {
    const response = await fetch(`/api/user/progress?email=${encodeURIComponent(normalizedEmail)}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Partial<AccountProgressSnapshot> & { email?: string };
    return normalizeSnapshotPayload(data, String(data.updatedAt || ''));
  } catch {
    return null;
  }
}

export async function saveAccountSnapshot(email: string, snapshot: AccountProgressSnapshot, userId = ''): Promise<boolean> {
  const savedToSupabase = await saveAccountSnapshotToSupabase(email, userId, snapshot);
  if (savedToSupabase) return true;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return false;

  try {
    const stampedSnapshot = {
      ...snapshot,
      progress: normalizeProgress({
        ...snapshot.progress,
        updatedAt: snapshot.progress.updatedAt || now(),
      }),
    };

    const response = await fetch('/api/user/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        progress: stampedSnapshot.progress,
        dailyStats: stampedSnapshot.dailyStats,
        listening: stampedSnapshot.listening,
        podcasts: stampedSnapshot.podcasts,
        reading: stampedSnapshot.reading,
        readingComplete: stampedSnapshot.readingComplete,
        readingStudy: stampedSnapshot.readingStudy,
        pronunciation: stampedSnapshot.pronunciation,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function hydrateAccountProgress(email: string, userId = ''): Promise<AccountProgressSnapshot> {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return readSnapshotForScope(DEFAULT_SCOPE);
  }

  suppressUploads = true;
  try {
    const accountSnapshot = readSnapshotForScope(normalizedEmail);
    const guestSnapshot = readSnapshotForScope(DEFAULT_SCOPE);
    const remoteSnapshot = (await fetchAccountSnapshot(normalizedEmail, userId)) ?? EMPTY_SNAPSHOT;
    const merged = mergeAccountSnapshots(
      mergeAccountSnapshots(accountSnapshot, guestSnapshot),
      remoteSnapshot,
    );

    writeSnapshotForScope(normalizedEmail, merged);
    if (!isAccountSnapshotEmpty(guestSnapshot)) {
      clearProgressScope(DEFAULT_SCOPE);
    }

    if (!isAccountSnapshotEmpty(merged)) {
      await saveAccountSnapshot(normalizedEmail, merged, userId);
    }

    return merged;
  } finally {
    suppressUploads = false;
  }
}

export function scheduleAccountUpload(email: string, userId = ''): void {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || suppressUploads) return;

  const existingTimer = pendingUploads.get(normalizedEmail);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }

  const timer = window.setTimeout(async () => {
    pendingUploads.delete(normalizedEmail);
    const snapshot = readSnapshotForScope(normalizedEmail);
    if (isAccountSnapshotEmpty(snapshot)) return;
    await saveAccountSnapshot(normalizedEmail, snapshot, userId);
  }, 1200);

  pendingUploads.set(normalizedEmail, timer);
}
