import { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { DeadlineCard } from '@/components/calendar/DeadlineCard';
import { DeadlineActionPanel } from '@/components/calendar/DeadlineActionPanel';
import { EnrichedDeadline } from '@/lib/deadlinesTypes';
import { URGENCY_CONFIG } from '@/lib/deadlinesTypes';
import {
  fetchUserTracking,
  getEnrichedDeadlines,
  toDeadlineProfile,
  upsertTracking,
} from '@/lib/deadlinesService';
import { loadUserProfile, UserProfile } from '@/lib/dashboardService';
import { toast } from '@/hooks/use-toast';
import { Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DeadlineStatus } from '@/lib/deadlinesTypes';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday=0 ... Sunday=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: (Date | null)[] = [];
  // Fill leading nulls
  for (let i = 0; i < startDow; i++) cells.push(null);
  // Fill days
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
  // Fill trailing nulls to complete last week
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const CalendarPage = () => {
  const { user } = useAuth();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<EnrichedDeadline | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
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

  // Navigation limits: current month to +12 months
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

  // Map deadlines by day string for quick lookup
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

  // Deadlines to show below the calendar
  const displayedDeadlines = useMemo(() => {
    if (selectedDate) {
      return getDeadlinesForDay(selectedDate);
    }
    // Default: all deadlines for the current displayed month
    return deadlines.filter(
      (d) => d.date.getFullYear() === currentMonth.getFullYear() && d.date.getMonth() === currentMonth.getMonth()
    );
  }, [selectedDate, deadlines, currentMonth]);

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
            {/* Day labels */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_LABELS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {grid.map((day, i) => {
                if (!day) {
                  return <div key={`empty-${i}`} className="h-12" />;
                }

                const isToday = isSameDay(day, today);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const dayDeadlines = getDeadlinesForDay(day);
                const hasDeadlines = dayDeadlines.length > 0;

                // Get highest urgency dot color
                const dots = dayDeadlines.map((d) => {
                  const cfg = URGENCY_CONFIG[d.urgency];
                  return cfg.color; // e.g. 'text-destructive'
                });
                // Deduplicate
                const uniqueDots = [...new Set(dots)].slice(0, 3);

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(hasDeadlines ? day : null)}
                    className={`h-12 flex flex-col items-center justify-center rounded-lg transition-all relative
                      ${isSelected ? 'bg-primary/10 border border-primary/30' : ''}
                      ${isToday && !isSelected ? '' : ''}
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

        {/* Deadlines section */}
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
