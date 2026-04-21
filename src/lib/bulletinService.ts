/**
 * Service Supabase pour le Bulletin Élio.
 * Lecture/écriture des bulletins quotidiens et des streaks.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type DailyBulletinRow = Tables<'daily_bulletins'>;
export type UserStreakRow = Tables<'user_streaks'>;

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export async function getTodayBulletin(userId: string): Promise<DailyBulletinRow | null> {
  const { data, error } = await supabase
    .from('daily_bulletins')
    .select('*')
    .eq('user_id', userId)
    .eq('bulletin_date', todayStr())
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createTodayBulletin(
  userId: string,
  bulletin: Omit<TablesInsert<'daily_bulletins'>, 'user_id'>
): Promise<DailyBulletinRow> {
  const { data, error } = await supabase
    .from('daily_bulletins')
    .insert({ user_id: userId, ...bulletin })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateActionStatus(
  bulletinId: string,
  status: 'done' | 'snoozed' | 'skipped'
): Promise<void> {
  const { error } = await supabase
    .from('daily_bulletins')
    .update({ action_status: status })
    .eq('id', bulletinId);

  if (error) throw error;
}

export async function markBulletinViewed(bulletinId: string): Promise<void> {
  const { error } = await supabase
    .from('daily_bulletins')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', bulletinId);

  if (error) throw error;
}

export async function getBulletinHistory(userId: string, limit = 30): Promise<DailyBulletinRow[]> {
  const { data, error } = await supabase
    .from('daily_bulletins')
    .select('*')
    .eq('user_id', userId)
    .order('bulletin_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function updateStreak(userId: string): Promise<UserStreakRow> {
  const today = todayStr();
  const yesterday = yesterdayStr();

  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    const { data, error } = await supabase
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
    return data;
  }

  if (existing.last_opened_date === today) {
    return existing;
  }

  let newStreak = 1;
  if (existing.last_opened_date === yesterday) {
    newStreak = existing.current_streak + 1;
  }

  const newLongest = Math.max(existing.longest_streak, newStreak);

  const { data, error } = await supabase
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
  return data;
}

export async function getDoneActionIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('daily_bulletins')
    .select('action_id')
    .eq('user_id', userId)
    .in('action_status', ['done', 'skipped']);

  if (error) return [];
  return (data || []).map((d) => d.action_id);
}

/**
 * Récupère le gain cumulé du bulletin il y a 7 jours pour calculer le vrai delta hebdo.
 */
export async function getWeekAgoGain(userId: string): Promise<number | null> {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const weekAgoStr = d.toISOString().split('T')[0];

  const { data } = await supabase
    .from('daily_bulletins')
    .select('cumulative_gain_cents')
    .eq('user_id', userId)
    .lte('bulletin_date', weekAgoStr)
    .order('bulletin_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.cumulative_gain_cents ?? null;
}
