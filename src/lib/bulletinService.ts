/**
 * Service Supabase pour le Bulletin Élio.
 * Lecture/écriture des bulletins quotidiens et des streaks.
 */
import { supabase } from '@/integrations/supabase/client';

export interface DailyBulletinRow {
  id: string;
  user_id: string;
  bulletin_date: string;
  action_type: string;
  action_id: string;
  action_title: string;
  action_description: string;
  action_gain_cents: number | null;
  action_effort_minutes: number | null;
  action_status: string;
  news_title: string | null;
  news_body: string | null;
  news_context: string | null;
  next_deadline_json: Record<string, unknown> | null;
  cumulative_gain_cents: number;
  weekly_delta_cents: number;
  viewed_at: string | null;
  created_at: string;
}

export interface UserStreakRow {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_opened_date: string | null;
  updated_at: string;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// Helper pour les requêtes sur tables non encore dans les types générés
function db() {
  return supabase as any;
}

export async function getTodayBulletin(userId: string): Promise<DailyBulletinRow | null> {
  const { data, error } = await db()
    .from('daily_bulletins')
    .select('*')
    .eq('user_id', userId)
    .eq('bulletin_date', todayStr())
    .maybeSingle();

  if (error) throw error;
  return data as DailyBulletinRow | null;
}

export async function createTodayBulletin(
  userId: string,
  bulletin: Omit<DailyBulletinRow, 'id' | 'user_id' | 'created_at' | 'viewed_at'>
): Promise<DailyBulletinRow> {
  const { data, error } = await db()
    .from('daily_bulletins')
    .insert({ user_id: userId, ...bulletin })
    .select()
    .single();

  if (error) throw error;
  return data as DailyBulletinRow;
}

export async function updateActionStatus(
  bulletinId: string,
  status: 'done' | 'snoozed' | 'skipped'
): Promise<void> {
  const { error } = await db()
    .from('daily_bulletins')
    .update({ action_status: status })
    .eq('id', bulletinId);

  if (error) throw error;
}

export async function markBulletinViewed(bulletinId: string): Promise<void> {
  const { error } = await db()
    .from('daily_bulletins')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', bulletinId);

  if (error) throw error;
}

export async function getBulletinHistory(userId: string, limit = 30): Promise<DailyBulletinRow[]> {
  const { data, error } = await db()
    .from('daily_bulletins')
    .select('*')
    .eq('user_id', userId)
    .order('bulletin_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as DailyBulletinRow[];
}

export async function updateStreak(userId: string): Promise<UserStreakRow> {
  const today = todayStr();
  const yesterday = yesterdayStr();

  const { data: existing } = await db()
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const streak = existing as UserStreakRow | null;

  if (!streak) {
    const { data, error } = await db()
      .from('user_streaks')
      .insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_opened_date: today,
      })
      .select()
      .single();

    if (error) throw error;
    return data as UserStreakRow;
  }

  if (streak.last_opened_date === today) {
    return streak;
  }

  let newStreak = 1;
  if (streak.last_opened_date === yesterday) {
    newStreak = streak.current_streak + 1;
  }

  const newLongest = Math.max(streak.longest_streak, newStreak);

  const { data, error } = await db()
    .from('user_streaks')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_opened_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as UserStreakRow;
}

export async function getDoneActionIds(userId: string): Promise<string[]> {
  const { data, error } = await db()
    .from('daily_bulletins')
    .select('action_id')
    .eq('user_id', userId)
    .in('action_status', ['done', 'skipped']);

  if (error) return [];
  return (data || []).map((d: { action_id: string }) => d.action_id);
}
