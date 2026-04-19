import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CoachRecoCard } from '@/components/coach/CoachRecoCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/dashboardService';
import {
  getCoachFeed,
  acceptRecommendation,
  markCompleted,
  snoozeRecommendation,
  dismissRecommendation,
  reopenRecommendation,
  type CoachFeed,
  type CoachRecommendation,
} from '@/lib/coachService';

const Coach = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<CoachFeed | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const f = await getCoachFeed(user.id);
      setFeed(f);
    } catch (e) {
      toast({ title: 'Erreur', description: 'Impossible de charger les recommandations.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime: refresh on profile or reco changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('coach-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_recommendations', filter: `user_id=eq.${user.id}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refresh]);

  const handleAccept = async (r: CoachRecommendation) => {
    if (!user) return;
    await acceptRecommendation(user.id, r.id, r.gain);
  };
  const handleComplete = async (r: CoachRecommendation) => {
    if (!user) return;
    await markCompleted(user.id, r.id, r.gain);
    toast({ title: '🎉 Bien joué !', description: `Tu viens de récupérer ${formatCurrency(r.gain)}/an avec Élio.` });
  };
  const handleSnooze = async (r: CoachRecommendation) => {
    if (!user) return;
    await snoozeRecommendation(user.id, r.id, r.gain, 30);
    toast({ title: 'Reporté de 30 jours', description: 'On te le rappellera.' });
  };
  const handleDismiss = async (r: CoachRecommendation, reason?: string) => {
    if (!user) return;
    await dismissRecommendation(user.id, r.id, r.gain, reason);
  };
  const handleReopen = async (r: CoachRecommendation) => {
    if (!user) return;
    await reopenRecommendation(user.id, r.id, r.gain);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!feed) return null;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex items-center gap-2 text-secondary">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Coach fiscal</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Élio te fait gagner{' '}
            <span className="text-success">{formatCurrency(feed.totalAnnualGain)}</span>/an
          </h1>
          {feed.recoveredGain > 0 && (
            <p className="text-sm text-muted-foreground">
              <CheckCircle2 className="inline h-4 w-4 text-success mr-1" />
              Tu as déjà récupéré <span className="font-semibold text-foreground">{formatCurrency(feed.recoveredGain)}/an</span> avec Élio.
            </p>
          )}
        </motion.div>

        {/* Profile incomplete banner */}
        {!feed.profileComplete && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Complète ton profil fiscal</p>
              <p className="text-xs text-muted-foreground mt-1">
                Plus ton profil est complet, plus Élio détecte d'optimisations.
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/profil/fiscal">Compléter</Link>
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="todo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todo">À faire ({feed.pending.length})</TabsTrigger>
            <TabsTrigger value="done">Faites ({feed.completed.length})</TabsTrigger>
            <TabsTrigger value="dismissed">Ignorées ({feed.dismissed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="todo" className="space-y-3 mt-4">
            {feed.pending.length === 0 ? (
              <EmptyState
                title="Profil complet, aucune optimisation détectée."
                subtitle="Reviens dans 1 mois — Élio surveille en continu."
              />
            ) : (
              feed.pending.map((r, i) => (
                <CoachRecoCard
                  key={r.id}
                  reco={r}
                  index={i}
                  onAccept={handleAccept}
                  onComplete={handleComplete}
                  onSnooze={handleSnooze}
                  onDismiss={handleDismiss}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="done" className="space-y-3 mt-4">
            {feed.completed.length === 0 ? (
              <EmptyState title="Aucune action complétée pour l'instant." subtitle="Marque tes premières actions comme faites pour suivre tes économies." />
            ) : (
              feed.completed.map((r, i) => (
                <CoachRecoCard
                  key={r.id}
                  reco={r}
                  index={i}
                  onAccept={handleAccept}
                  onComplete={handleComplete}
                  onSnooze={handleSnooze}
                  onDismiss={handleDismiss}
                  onReopen={handleReopen}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="dismissed" className="space-y-3 mt-4">
            {feed.dismissed.length === 0 ? (
              <EmptyState title="Aucune reco ignorée." subtitle="Tu peux ignorer les recos qui ne te concernent pas." />
            ) : (
              feed.dismissed.map((r, i) => (
                <CoachRecoCard
                  key={r.id}
                  reco={r}
                  index={i}
                  onAccept={handleAccept}
                  onComplete={handleComplete}
                  onSnooze={handleSnooze}
                  onDismiss={handleDismiss}
                  onReopen={handleReopen}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground text-center pb-4">
          Élio fournit des estimations à titre indicatif. Pour toute décision fiscale, consulte un professionnel habilité.
        </p>
      </div>
    </AppLayout>
  );
};

const EmptyState = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="bg-card rounded-xl border border-border p-8 text-center">
    <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
    <p className="font-medium text-foreground">{title}</p>
    <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
  </div>
);

export default Coach;
