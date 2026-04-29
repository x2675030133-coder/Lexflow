import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProgress, DailyStats } from '../data/types';

export async function syncProgressToCloud(userId: string, progress: UserProgress): Promise<void> {
  if (!isSupabaseConfigured) return;

  await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      data: progress,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
}

export async function getProgressFromCloud(userId: string): Promise<UserProgress | null> {
  if (!isSupabaseConfigured) return null;

  const { data } = await supabase
    .from('user_progress')
    .select('data')
    .eq('user_id', userId)
    .single();

  return data?.data ?? null;
}

export async function syncStatsToCloud(userId: string, stats: DailyStats[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  await supabase
    .from('user_daily_stats')
    .upsert({
      user_id: userId,
      data: stats,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
}

export async function getStatsFromCloud(userId: string): Promise<DailyStats[] | null> {
  if (!isSupabaseConfigured) return null;

  const { data } = await supabase
    .from('user_daily_stats')
    .select('data')
    .eq('user_id', userId)
    .single();

  return data?.data ?? null;
}
