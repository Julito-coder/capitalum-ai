import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { DeadlineCard } from '@/components/calendar/DeadlineCard';
import { DeadlineActionPanel } from '@/components/calendar/DeadlineActionPanel';
import { CalendarViewSelector } from '@/components/calendar/CalendarViewSelector';
import { OptimizationScoreBar } from '@/components/calendar/OptimizationScoreBar';
import { CalendarViewMode, EnrichedDeadline, DeadlineStatus } from '@/lib/deadlinesTypes';
import {
  fetchUserTracking,
  getEnrichedDeadlines,
  toDeadlineProfile,
  upsertTracking,
  computeOptimizationScore,
} from '@/lib/deadlinesService';
import { loadUserProfile, UserProfile } from '@/lib/dashboardService';
import { toast } from '@/hooks/use-toast';
import { Loader2, Calendar, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const CalendarPage = () => {
  const { user } = useAuth();
  const [view, setView] = useState<CalendarViewMode>('urgent');
  const [selectedDeadline, setSelectedDeadline] = useState<EnrichedDeadline | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [deadlines, setDeadlines] = useState<EnrichedDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DeadlineStatus | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userProfile, tracking] = await Promise.all([
        loadUserProfile(user.id),
        fetchUserTracking(user.id),
      ]);
      setProfile(userProfile);
      if (userProfile) {
        const dp = toDeadlineProfile(userProfile);
        const enriched = getEnrichedDeadlines(dp, tracking);
        setDeadlines(enriched);
      }
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (key: string, status: DeadlineStatus, reason?: string) => {
    if (!user) return;
    try {
      await upsertTracking(user.id, key, {
        status,
        ...(reason ? { ignored_reason: reason } : {}),
      });
      toast({
        title: status === 'optimized' ? '✅ Échéance optimisée !' : status === 'ignored' ? '⏭️ Échéance ignorée' : '🔄 Statut mis à jour',
        description: 'Le suivi a été enregistré.',
      });
      setSelectedDeadline(null);
      loadData();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder.', variant: 'destructive' });
    }
  };

  // Apply view filter & status filter
  const filteredDeadlines = useMemo(() => {
    let result = [...deadlines];

    // Apply status filter from score bar clicks
    if (statusFilter) {
      result = result.filter((d) => {
        const trackingStatus = d.tracking?.status ?? 'pending';
        return trackingStatus === statusFilter;
      });
    }

    switch (view) {
      case 'urgent':
        if (!statusFilter) {
          result = result.filter((d) => d.daysLeft <= 90 && d.tracking?.status !== 'optimized');
        }
        break;
      case 'strategic':
        result.sort((a, b) => b.personalImpact.estimatedGain - a.personalImpact.estimatedGain);
        break;
      case 'chronological':
      default:
        break;
    }
    return result;
  }, [deadlines, view, statusFilter]);

  // Group by month for chronological view
  const groupedByMonth = useMemo(() => {
    if (view !== 'chronological') return null;
    const groups: Record<string, EnrichedDeadline[]> = {};
    for (const d of filteredDeadlines) {
      const key = d.date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    }
    return groups;
  }, [filteredDeadlines, view]);

  const score = useMemo(() => computeOptimizationScore(deadlines), [deadlines]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-serif font-bold">Cockpit patrimonial</h1>
              <p className="text-muted-foreground text-sm">
                Tes échéances fiscales personnalisées · {deadlines.length} actions détectées
              </p>
            </div>
          </div>
        </motion.div>

        {/* Gamification score */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <OptimizationScoreBar score={score} activeFilter={statusFilter} onFilterByStatus={setStatusFilter} />
        </motion.div>

        {/* View selector */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <CalendarViewSelector activeView={view} onChange={setView} />
        </motion.div>

        {/* Deadlines list */}
        <div className="space-y-3">
          {filteredDeadlines.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-success mx-auto mb-3" />
              <p className="text-lg font-semibold">Aucune échéance urgente</p>
              <p className="text-sm text-muted-foreground mt-1">
                {view === 'urgent'
                  ? 'Toutes tes échéances des 90 prochains jours sont optimisées. 🎉'
                  : 'Aucune échéance ne correspond à ton profil.'}
              </p>
            </div>
          )}

          {view === 'chronological' && groupedByMonth
            ? Object.entries(groupedByMonth).map(([month, items]) => (
                <div key={month}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1 capitalize">
                    {month}
                  </h3>
                  <div className="space-y-3">
                    {items.map((d) => (
                      <DeadlineCard key={d.key} deadline={d} onClick={() => setSelectedDeadline(d)} />
                    ))}
                  </div>
                </div>
              ))
            : filteredDeadlines.map((d) => (
                <DeadlineCard key={d.key} deadline={d} onClick={() => setSelectedDeadline(d)} />
              ))}
        </div>

        {/* Action panel */}
        {selectedDeadline && (
          <DeadlineActionPanel
            deadline={selectedDeadline}
            onClose={() => setSelectedDeadline(null)}
            onStatusChange={handleStatusChange}
            profile={profile}
          />
        )}
      </div>
    </Layout>
  );
};

export default CalendarPage;
