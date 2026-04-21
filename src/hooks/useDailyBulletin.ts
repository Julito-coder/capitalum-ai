/**
 * Hook principal du Bulletin Élio.
 * Génération lazy : appelle l'edge function au premier load de la journée
 * pour la news LLM. Le moteur de priorisation reste côté client (déterministe).
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { loadUserProfile, UserProfile } from '@/lib/dashboardService';
import { selectActionOfTheDay, getNextDeadline, computeCumulativeGain, BulletinAction, BulletinDeadline } from '@/lib/bulletinEngine';
import {
  getTodayBulletin,
  updateActionStatus,
  markBulletinViewed,
  updateStreak,
  getDoneActionIds,
  getWeekAgoGain,
  DailyBulletinRow,
  UserStreakRow,
} from '@/lib/bulletinService';
import { toast } from '@/hooks/use-toast';

export interface BulletinData {
  bulletin: DailyBulletinRow;
  action: BulletinAction;
  deadline: BulletinDeadline | null;
  streak: UserStreakRow;
  cumulativeGainCents: number;
  weeklyDeltaCents: number;
  userName: string;
  profileCompletionPct: number;
}

export function useDailyBulletin() {
  const { user } = useAuth();
  const [data, setData] = useState<BulletinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBulletin = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const profile = await loadUserProfile(user.id);
      if (!profile) {
        setData(null);
        setLoading(false);
        return;
      }

      const firstName = profile.fullName?.split(' ')[0] || '';

      // Score de complétion simplifié
      const filledFields = [
        profile.isEmployee, profile.isSelfEmployed, profile.isRetired, profile.isInvestor,
        profile.grossMonthlySalary > 0, profile.netMonthlySalary > 0,
        profile.childrenCount > 0, profile.familyStatus !== 'single',
        profile.isHomeowner, profile.onboardingCompleted,
      ].filter(Boolean).length;
      const profileCompletionPct = Math.round((filledFields / 10) * 100);

      // Streak
      const streak = await updateStreak(user.id);

      // Vérifier si un bulletin existe déjà
      let bulletin = await getTodayBulletin(user.id);

      if (!bulletin) {
        // Calculer action + deadline côté client (déterministe)
        const doneIds = await getDoneActionIds(user.id);
        const action = selectActionOfTheDay(profile, doneIds);
        const deadline = getNextDeadline(profile);
        const gains = computeCumulativeGain(profile);

        // Appeler l'edge function pour générer la news LLM + persister
        try {
          const { data: fnData, error: fnError } = await supabase.functions.invoke(
            'generate-daily-bulletin',
            {
              body: {
                action_type: action.type,
                action_id: action.id,
                action_title: action.title,
                action_description: action.description,
                action_gain_cents: action.gainCents,
                action_effort_minutes: action.effortMinutes,
                next_deadline_json: deadline || null,
                cumulative_gain_cents: gains.totalCents,
                weekly_delta_cents: gains.weeklyDeltaCents,
              },
            }
          );

          if (fnError) throw fnError;
          bulletin = fnData?.bulletin as DailyBulletinRow;
        } catch (fnErr) {
          console.warn('Edge function failed, fallback local:', fnErr);
          // Fallback : créer localement sans news
          const { createTodayBulletin } = await import('@/lib/bulletinService');
          const todayStr = new Date().toISOString().split('T')[0];
          bulletin = await createTodayBulletin(user.id, {
            bulletin_date: todayStr,
            action_type: action.type,
            action_id: action.id,
            action_title: action.title,
            action_description: action.description,
            action_gain_cents: action.gainCents,
            action_effort_minutes: action.effortMinutes,
            action_status: 'pending',
            news_title: null,
            news_body: null,
            news_context: null,
            next_deadline_json: deadline ? JSON.parse(JSON.stringify(deadline)) : null,
            cumulative_gain_cents: gains.totalCents,
            weekly_delta_cents: gains.weeklyDeltaCents,
          });
        }
      }

      if (!bulletin) {
        setError('Impossible de générer le bulletin.');
        setLoading(false);
        return;
      }

      // Si le bulletin existe mais sans news, backfill asynchrone (ne bloque pas le rendu)
      const needsNewsBackfill = !bulletin.news_title;
      if (needsNewsBackfill) {
        setNewsLoading(true);
      }

      // Marquer comme vu
      if (!bulletin.viewed_at) {
        await markBulletinViewed(bulletin.id);
      }

      const action: BulletinAction = {
        type: bulletin.action_type as BulletinAction['type'],
        id: bulletin.action_id,
        title: bulletin.action_title,
        description: bulletin.action_description,
        gainCents: bulletin.action_gain_cents,
        effortMinutes: bulletin.action_effort_minutes || 10,
      };

      const deadline = bulletin.next_deadline_json as unknown as BulletinDeadline | null;

      // Calcul du vrai delta hebdomadaire
      const weekAgoGain = await getWeekAgoGain(user.id);
      const realWeeklyDelta = weekAgoGain !== null
        ? bulletin.cumulative_gain_cents - weekAgoGain
        : bulletin.weekly_delta_cents;

      setData({
        bulletin,
        action,
        deadline,
        streak,
        cumulativeGainCents: bulletin.cumulative_gain_cents,
        weeklyDeltaCents: realWeeklyDelta,
        userName: firstName,
        profileCompletionPct,
      });

      // Backfill news asynchrone après affichage du bulletin
      if (needsNewsBackfill) {
        supabase.functions.invoke('generate-daily-bulletin', { body: {} })
          .then(({ data: fnData }) => {
            if (fnData?.bulletin?.news_title) {
              const updated = fnData.bulletin as DailyBulletinRow;
              setData(prev => prev ? {
                ...prev,
                bulletin: { ...prev.bulletin, news_title: updated.news_title, news_body: updated.news_body, news_context: updated.news_context },
              } : null);
            }
          })
          .catch(() => {})
          .finally(() => setNewsLoading(false));
      }
    } catch (err) {
      console.error('Erreur chargement bulletin:', err);
      setError('Impossible de charger ton bulletin du jour.');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger ton bulletin. Réessaie plus tard.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBulletin();
  }, [loadBulletin]);

  const handleActionStatus = useCallback(async (status: 'done' | 'snoozed' | 'skipped', reason?: string) => {
    if (!data?.bulletin) return;
    try {
      await updateActionStatus(data.bulletin.id, status, reason);
      setData(prev => prev ? {
        ...prev,
        bulletin: { ...prev.bulletin, action_status: status },
      } : null);

      if (status === 'done') {
        toast({ title: 'Bien joué !', description: 'Action marquée comme terminée.' });
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour l\'action.', variant: 'destructive' });
    }
  }, [data]);

  return { data, loading, newsLoading, error, handleActionStatus, reload: loadBulletin };
}
