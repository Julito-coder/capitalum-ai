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
import {
  Loader2, Calendar, ChevronLeft, ChevronRight, ListChecks, Globe, UserCog,
  Plus, Repeat, X, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { DeadlineStatus, DeadlineUserProfile } from '@/lib/deadlinesTypes';
import {
  fetchRecurringDeadlines,
  createRecurringDeadline,
  deleteRecurringDeadline,
  getDeadlinesForMonth,
  getEffectiveDateInMonth,
  getCategoryInfo,
  CATEGORIES,
  FREQUENCIES,
  type RecurringDeadline,
} from '@/lib/recurringDeadlinesService';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

type TabMode = 'mine' | 'personal' | 'all';

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

function getExcludedDeadlines(profile: DeadlineUserProfile): FiscalDeadline[] {
  return FISCAL_DEADLINES.filter((d) => !d.relevanceCondition(profile));
}

const CalendarPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const [tab, setTab] = useState<TabMode>('mine');
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<EnrichedDeadline | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [deadlineProfile, setDeadlineProfile] = useState<DeadlineUserProfile | null>(null);
  const [deadlines, setDeadlines] = useState<EnrichedDeadline[]>([]);
  const [recurringDeadlines, setRecurringDeadlines] = useState<RecurringDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('autre');
  const [newAmount, setNewAmount] = useState('');
  const [newFrequency, setNewFrequency] = useState('monthly');
  const [newDate, setNewDate] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [addingDeadline, setAddingDeadline] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userProfile, tracking, recurring] = await Promise.all([
        loadUserProfile(user.id),
        fetchUserTracking(user.id),
        fetchRecurringDeadlines(user.id),
      ]);
      setProfile(userProfile);
      setRecurringDeadlines(recurring);
      if (userProfile) {
        const dp = toDeadlineProfile(userProfile);
        setDeadlineProfile(dp);
        setDeadlines(getEnrichedDeadlines(dp, tracking));
      }
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time sync for profiles + recurring deadlines
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('calendar-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_recurring_deadlines', filter: `user_id=eq.${user.id}` }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadData]);

  const minMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const maxMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 12, 1), [today]);
  const canGoPrev = currentMonth.getTime() > minMonth.getTime();
  const canGoNext = currentMonth.getTime() < maxMonth.getTime();

  const goToPrev = () => { if (!canGoPrev) return; setDirection(-1); setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)); setSelectedDate(null); };
  const goToNext = () => { if (!canGoNext) return; setDirection(1); setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)); setSelectedDate(null); };

  const grid = useMemo(() => getMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth()), [currentMonth]);

  // Combine fiscal + recurring deadlines into day map
  const recurringForMonth = useMemo(
    () => getDeadlinesForMonth(recurringDeadlines, currentMonth.getFullYear(), currentMonth.getMonth()),
    [recurringDeadlines, currentMonth]
  );

  const deadlinesByDay = useMemo(() => {
    const map = new Map<string, EnrichedDeadline[]>();
    for (const d of deadlines) {
      const key = `${d.date.getFullYear()}-${d.date.getMonth()}-${d.date.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return map;
  }, [deadlines]);

  const recurringByDay = useMemo(() => {
    const map = new Map<string, RecurringDeadline[]>();
    for (const d of recurringForMonth) {
      const effectiveDate = getEffectiveDateInMonth(d, currentMonth.getFullYear(), currentMonth.getMonth());
      const key = `${effectiveDate.getFullYear()}-${effectiveDate.getMonth()}-${effectiveDate.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return map;
  }, [recurringForMonth, currentMonth]);

  const getDeadlinesForDay = (day: Date) => {
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    return deadlinesByDay.get(key) || [];
  };
  const getRecurringForDay = (day: Date) => {
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    return recurringByDay.get(key) || [];
  };

  const displayedDeadlines = useMemo(() => {
    if (selectedDate) return getDeadlinesForDay(selectedDate);
    return deadlines.filter(
      (d) => d.date.getFullYear() === currentMonth.getFullYear() && d.date.getMonth() === currentMonth.getMonth()
    );
  }, [selectedDate, deadlines, currentMonth]);

  const displayedRecurring = useMemo(() => {
    if (selectedDate) return getRecurringForDay(selectedDate);
    return recurringForMonth;
  }, [selectedDate, recurringForMonth]);

  const excludedDeadlines = useMemo(() => {
    if (!deadlineProfile) return [];
    return getExcludedDeadlines(deadlineProfile);
  }, [deadlineProfile]);

  const monthLabel = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const handleStatusChange = async (key: string, status: DeadlineStatus, reason?: string) => {
    if (!user) return;
    try {
      await upsertTracking(user.id, key, { status, ...(reason ? { ignored_reason: reason } : {}) });
      toast({ title: status === 'optimized' ? '✅ Échéance optimisée !' : status === 'ignored' ? '⏭️ Échéance ignorée' : '🔄 Statut mis à jour', description: 'Le suivi a été enregistré.' });
      setSelectedDeadline(null);
      loadData();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder.', variant: 'destructive' });
    }
  };

  const handleAddRecurring = async () => {
    if (!user || !newTitle.trim() || !newDate) return;
    setAddingDeadline(true);
    try {
      await createRecurringDeadline(user.id, {
        title: newTitle.trim(),
        category: newCategory,
        amount: newAmount ? parseFloat(newAmount) : null,
        frequency: newFrequency,
        next_date: newDate,
        provider: newProvider.trim() || null,
        contract_ref: null,
        notes: null,
        source: 'manual',
        source_document_path: null,
      });
      toast({ title: '✅ Échéance ajoutée', description: `« ${newTitle} » ajouté à ton calendrier.` });
      setShowAddForm(false);
      setNewTitle(''); setNewCategory('autre'); setNewAmount(''); setNewFrequency('monthly'); setNewDate(''); setNewProvider('');
      loadData();
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'ajouter l'échéance.", variant: 'destructive' });
    } finally {
      setAddingDeadline(false);
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    try {
      await deleteRecurringDeadline(id);
      toast({ title: '🗑️ Échéance supprimée' });
      loadData();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer.', variant: 'destructive' });
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
          {([
            { key: 'mine' as TabMode, icon: ListChecks, label: 'Fiscal', count: deadlines.length },
            { key: 'personal' as TabMode, icon: Repeat, label: 'Perso', count: recurringDeadlines.length },
            { key: 'all' as TabMode, icon: Globe, label: 'Toutes', count: excludedDeadlines.length },
          ]).map(({ key, icon: Icon, label, count }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSelectedDate(null); }}
              className={`flex items-center gap-1 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center min-h-[44px]
                ${tab === key
                  ? 'bg-card text-foreground shadow-sm border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
              {count > 0 && (
                <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab === key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ========== TAB: FISCAL ========== */}
        {tab === 'mine' && (
          <>
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button onClick={goToPrev} disabled={!canGoPrev} className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-30">
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <span className="text-lg font-semibold text-foreground capitalize">{monthLabel}</span>
              <button onClick={goToNext} disabled={!canGoNext} className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-30">
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
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {grid.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} className="h-12" />;
                    const isToday = isSameDay(day, today);
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const dayDeadlines = getDeadlinesForDay(day);
                    const dayRecurring = getRecurringForDay(day);
                    const hasContent = dayDeadlines.length > 0 || dayRecurring.length > 0;

                    const dots = [
                      ...dayDeadlines.map((d) => URGENCY_CONFIG[d.urgency].color),
                      ...dayRecurring.map(() => 'text-accent'),
                    ];
                    const uniqueDots = [...new Set(dots)].slice(0, 3);

                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(hasContent ? day : null)}
                        className={`h-12 flex flex-col items-center justify-center rounded-lg transition-all relative
                          ${isSelected ? 'bg-primary/10 border border-primary/30' : ''}
                          ${hasContent ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default'}`}
                      >
                        <span className={`text-sm leading-none flex items-center justify-center w-7 h-7 rounded-full
                          ${isToday ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground'}`}>
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
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">{sectionTitle}</h2>
              {displayedDeadlines.length === 0 && displayedRecurring.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Aucune échéance pour cette période.</p>
                </div>
              ) : (
                <>
                  {displayedDeadlines.map((d) => (
                    <DeadlineCard key={d.key} deadline={d} onClick={() => setSelectedDeadline(d)} />
                  ))}
                  {displayedRecurring.map((d) => {
                    const cat = getCategoryInfo(d.category);
                    return (
                      <motion.div
                        key={d.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-2xl border border-border p-4 flex items-start gap-3"
                      >
                        <span className="text-lg">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{d.title}</p>
                          {d.provider && <p className="text-xs text-muted-foreground">{d.provider}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            {d.amount && (
                              <span className="text-xs font-medium text-foreground">
                                {d.amount.toLocaleString('fr-FR')} €
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {FREQUENCIES.find(f => f.value === d.frequency)?.label}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRecurring(d.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </>
              )}
            </div>
          </>
        )}

        {/* ========== TAB: PERSONAL ========== */}
        {tab === 'personal' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Tes prélèvements ({recurringDeadlines.length})
              </h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>

            {/* Add form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Nouvelle échéance</p>
                      <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-muted rounded-lg">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Nom (ex: Mutuelle, EDF, Netflix...)"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <select
                        value={newFrequency}
                        onChange={(e) => setNewFrequency(e.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {FREQUENCIES.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Montant €"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Fournisseur (optionnel)"
                      value={newProvider}
                      onChange={(e) => setNewProvider(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />

                    <button
                      onClick={handleAddRecurring}
                      disabled={!newTitle.trim() || !newDate || addingDeadline}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50 transition-colors hover:bg-primary/90"
                    >
                      {addingDeadline ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Ajouter au calendrier'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List */}
            {recurringDeadlines.length === 0 && !showAddForm ? (
              <div className="text-center py-8">
                <Repeat className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Aucun prélèvement récurrent pour l'instant.
                </p>
                <p className="text-xs text-muted-foreground">
                  Ajoute-les manuellement ou uploade un contrat dans le coffre-fort pour une détection automatique.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recurringDeadlines.map((d, i) => {
                  const cat = getCategoryInfo(d.category);
                  return (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-card rounded-2xl border border-border p-4 flex items-start gap-3"
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{d.title}</p>
                        {d.provider && <p className="text-xs text-muted-foreground">{d.provider}</p>}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {d.amount && (
                            <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded-full">
                              {d.amount.toLocaleString('fr-FR')} €
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {FREQUENCIES.find(f => f.value === d.frequency)?.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            → {new Date(d.next_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          {d.source === 'document' && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Auto</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRecurring(d.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== TAB: ALL ========== */}
        {tab === 'all' && (
          <div className="space-y-4">
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
