import { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { DeadlineCard } from '@/components/calendar/DeadlineCard';
import { DeadlineActionPanel } from '@/components/calendar/DeadlineActionPanel';
import { EnrichedDeadline, FiscalDeadline } from '@/lib/deadlinesTypes';
import { URGENCY_CONFIG } from '@/lib/deadlinesTypes';
import { FISCAL_DEADLINES } from '@/lib/deadlinesData';
import {
  fetchUserTracking,
  getEnrichedDeadlines,
  toDeadlineProfile,
  upsertTracking,
} from '@/lib/deadlinesService';
import { loadUserProfile, UserProfile } from '@/lib/dashboardService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Calendar, ChevronLeft, ChevronRight, ListChecks, Globe, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { DeadlineStatus, DeadlineUserProfile } from '@/lib/deadlinesTypes';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

type TabMode = 'mine' | 'all';

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Get deadlines NOT relevant to user profile (the ones filtered out) */
function getExcludedDeadlines(profile: DeadlineUserProfile): FiscalDeadline[] {
  return FISCAL_DEADLINES.filter((d) => !d.relevanceCondition(profile));
}

const CalendarPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [tab, setTab] = useState<TabMode>('mine');
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<EnrichedDeadline | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [deadlineProfile, setDeadlineProfile] = useState<DeadlineUserProfile | null>(null);
  const [deadlines, setDeadlines] = useState<EnrichedDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);

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
        setDeadlineProfile(dp);
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

  // Subscribe to profile changes for real-time refresh
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('calendar-profile-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadData]);

  const minMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const maxMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 12, 1), [today]);

  const canGoPrev = currentMonth.getTime() > minMonth.getTime();
  const canGoNext = currentMonth.getTime() < maxMonth.getTime();

  const goToPrev = () => {
    if (!canGoPrev) return;
    setDirection(-1);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };
  const goToNext = () => {
    if (!canGoNext) return;
    setDirection(1);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const grid = useMemo(() => getMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth()), [currentMonth]);

  const deadlinesByDay = useMemo(() => {
    const map = new Map<string, EnrichedDeadline[]>();
    for (const d of deadlines) {
      const key = `${d.date.getFullYear()}-${d.date.getMonth()}-${d.date.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return map;
  }, [deadlines]);

  const getDeadlinesForDay = (day: Date) => {
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    return deadlinesByDay.get(key) || [];
  };

  const displayedDeadlines = useMemo(() => {
    if (selectedDate) {
      return getDeadlinesForDay(selectedDate);
    }
    return deadlines.filter(
      (d) => d.date.getFullYear() === currentMonth.getFullYear() && d.date.getMonth() === currentMonth.getMonth()
    );
  }, [selectedDate, deadlines, currentMonth]);

  // Excluded deadlines (not relevant to user)
  const excludedDeadlines = useMemo(() => {
    if (!deadlineProfile) return [];
    return getExcludedDeadlines(deadlineProfile);
  }, [deadlineProfile]);

  const monthLabel = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

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

  const sectionTitle = selectedDate
    ? `Échéances du ${selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
    : `Échéances de ${currentMonth.toLocaleDateString('fr-FR', { month: 'long' })}`;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-5 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Calendrier</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border/30">
          <button
            onClick={() => { setTab('mine'); setSelectedDate(null); }}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center min-h-[44px]
              ${tab === 'mine'
                ? 'bg-card text-foreground shadow-sm border border-border/50'
                : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ListChecks className="h-4 w-4" />
            <span>Mes échéances</span>
            {deadlines.length > 0 && (
              <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{deadlines.length}</span>
            )}
          </button>
          <button
            onClick={() => { setTab('all'); setSelectedDate(null); }}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center min-h-[44px]
              ${tab === 'all'
                ? 'bg-card text-foreground shadow-sm border border-border/50'
                : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Globe className="h-4 w-4" />
            <span>Toutes</span>
            {excludedDeadlines.length > 0 && (
              <span className="ml-1 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{excludedDeadlines.length}</span>
            )}
          </button>
        </div>

        {tab === 'mine' ? (
          <>
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={goToPrev}
                disabled={!canGoPrev}
                className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <span className="text-lg font-semibold text-foreground capitalize">{monthLabel}</span>
              <button
                onClick={goToNext}
                disabled={!canGoNext}
                className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Calendar grid */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentMonth.toISOString()}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.2 }}
                className="bg-card rounded-2xl border border-border p-3 shadow-sm"
              >
                <div className="grid grid-cols-7 mb-2">
                  {DAY_LABELS.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {grid.map((day, i) => {
                    if (!day) {
                      return <div key={`empty-${i}`} className="h-12" />;
                    }

                    const isToday = isSameDay(day, today);
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const dayDeadlines = getDeadlinesForDay(day);
                    const hasDeadlines = dayDeadlines.length > 0;

                    const dots = dayDeadlines.map((d) => {
                      const cfg = URGENCY_CONFIG[d.urgency];
                      return cfg.color;
                    });
                    const uniqueDots = [...new Set(dots)].slice(0, 3);

                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(hasDeadlines ? day : null)}
                        className={`h-12 flex flex-col items-center justify-center rounded-lg transition-all relative
                          ${isSelected ? 'bg-primary/10 border border-primary/30' : ''}
                          ${hasDeadlines ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default'}
                        `}
                      >
                        <span
                          className={`text-sm leading-none flex items-center justify-center w-7 h-7 rounded-full
                            ${isToday ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground'}
                          `}
                        >
                          {day.getDate()}
                        </span>
                        {uniqueDots.length > 0 && (
                          <div className="flex gap-0.5 mt-0.5">
                            {uniqueDots.map((color, di) => (
                              <span key={di} className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Deadlines list */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {sectionTitle}
              </h2>

              {displayedDeadlines.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Aucune échéance pour cette période.</p>
                </div>
              ) : (
                displayedDeadlines.map((d) => (
                  <DeadlineCard key={d.key} deadline={d} onClick={() => setSelectedDeadline(d)} />
                ))
              )}
            </div>
          </>
        ) : (
          /* TAB: Toutes les échéances */
          <div className="space-y-4">
            {/* User's active deadlines */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Tes échéances actives ({deadlines.length})
              </h2>
              {deadlines.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Complète ton profil pour découvrir tes échéances.</p>
                </div>
              ) : (
                deadlines.map((d) => (
                  <DeadlineCard key={d.key} deadline={d} onClick={() => { setTab('mine'); setSelectedDeadline(d); }} />
                ))
              )}
            </div>

            {/* Excluded deadlines with CTA */}
            {excludedDeadlines.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Autres échéances du système fiscal ({excludedDeadlines.length})
                </h2>
                <p className="text-xs text-muted-foreground px-1">
                  Ces échéances ne correspondent pas à ton profil actuel. Si l'une d'elles te concerne, mets à jour ton profil.
                </p>

                {excludedDeadlines.map((d) => (
                  <motion.div
                    key={d.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl border border-border/60 p-4 space-y-2 opacity-75"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{d.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{d.shortDescription}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          📅 {d.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/profil')}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors mt-1"
                    >
                      <UserCog className="h-3.5 w-3.5" />
                      Ça me concerne — mettre à jour mon profil
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

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
    </AppLayout>
  );
};

export default CalendarPage;
