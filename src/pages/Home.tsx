import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScoreElio } from '@/components/home/ScoreElio';
import { GainCard } from '@/components/home/GainCard';
import { ActionCard } from '@/components/home/ActionCard';
import { CalendarPreview } from '@/components/home/CalendarPreview';
import { useAuth } from '@/contexts/AuthContext';
import { loadUserProfile, computeDashboardMetrics } from '@/lib/dashboardService';
import { FISCAL_DEADLINES } from '@/lib/deadlinesData';
import { AlertTriangle, FileSearch, PiggyBank, Shield, Building2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [totalLoss, setTotalLoss] = useState(0);
  const [breakdown, setBreakdown] = useState<{ label: string; amount: number }[]>([]);
  const [actions, setActions] = useState<Array<{
    icon: typeof AlertTriangle;
    title: string;
    description: string;
    gain: number;
    link: string;
    severity: 'critical' | 'warning' | 'success' | 'info';
  }>>([]);
  const [userName, setUserName] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await loadUserProfile(user.id);
      if (!profile) {
        setLoading(false);
        return;
      }

      setUserName(profile.fullName?.split(' ')[0] || '');
      const metrics = computeDashboardMetrics(profile);

      // Compute score based on profile completeness + optimizations
      const profileFields = [
        profile.isEmployee || profile.isSelfEmployed || profile.isRetired,
        profile.grossMonthlySalary > 0 || profile.annualRevenueHt > 0 || profile.mainPensionAnnual > 0,
        profile.familyStatus !== 'single' || profile.childrenCount > 0,
        profile.onboardingCompleted,
      ];
      const completeness = profileFields.filter(Boolean).length / profileFields.length;
      const optimizationPenalty = Math.min(metrics.recommendations.length * 10, 40);
      const alertPenalty = metrics.alerts.filter(a => a.severity === 'critical').length * 15;
      const computedScore = Math.max(0, Math.min(100, Math.round(completeness * 60 + 40 - optimizationPenalty - alertPenalty)));
      setScore(computedScore);

      // Build breakdown
      const bd: { label: string; amount: number }[] = [];
      if (metrics.potentialSavings > 0) bd.push({ label: 'Optimisations fiscales', amount: metrics.potentialSavings });
      const alertTotal = metrics.alerts.reduce((s, a) => s + a.gain, 0);
      if (alertTotal > 0) bd.push({ label: 'Risques détectés', amount: alertTotal });
      setBreakdown(bd);
      setTotalLoss(metrics.potentialSavings + alertTotal);

      // Build action cards from alerts + recommendations
      const actionList = [
        ...metrics.alerts.slice(0, 2).map(a => ({
          icon: a.severity === 'critical' ? AlertTriangle : Shield,
          title: a.title,
          description: a.message,
          gain: a.gain,
          link: '/outils/scanner',
          severity: a.severity,
        })),
        ...metrics.recommendations.slice(0, 3).map(r => ({
          icon: r.type === 'savings' ? PiggyBank : r.type === 'real_estate' ? Building2 : FileSearch,
          title: r.title,
          description: r.description,
          gain: r.gain,
          link: r.type === 'real_estate' ? '/outils/simulateur' : '/outils/scanner',
          severity: 'info' as const,
        })),
      ];
      setActions(actionList);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const upcomingDeadlines = FISCAL_DEADLINES
    .filter(d => d.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)
    .map(d => ({ title: d.title, date: d.date, impactScore: d.impactScore }));

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
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground">
            {userName ? `Bonjour ${userName}` : 'Bonjour'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ne perds plus un euro par manque d'information.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6 shadow-sm flex justify-center"
        >
          <ScoreElio score={score} />
        </motion.div>

        <GainCard totalLoss={totalLoss} breakdown={breakdown} />

        {actions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Actions recommandées</h2>
            {actions.map((action, i) => (
              <ActionCard key={i} {...action} index={i} />
            ))}
          </div>
        )}

        <CalendarPreview deadlines={upcomingDeadlines} />

        <p className="text-xs text-muted-foreground text-center pb-4">
          Élio fournit des estimations à titre indicatif. Elles ne constituent pas un conseil fiscal personnalisé au sens de l'article L. 541-1 du Code monétaire et financier.
        </p>
      </div>
    </AppLayout>
  );
};

export default HomePage;
