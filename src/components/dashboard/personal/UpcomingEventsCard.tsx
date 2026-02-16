import { Calendar, AlertTriangle, Bell, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DashboardAlert, UserProfile } from '@/lib/dashboardService';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { FISCAL_DEADLINES } from '@/lib/deadlinesData';
import { toDeadlineProfile } from '@/lib/deadlinesService';
import { computeDaysLeft, computeUrgency, URGENCY_CONFIG } from '@/lib/deadlinesTypes';

interface UpcomingEventsCardProps {
  alerts: DashboardAlert[];
  profile: UserProfile | null;
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const getDaysLabel = (daysLeft: number) => {
  if (daysLeft === 0) return "Aujourd'hui";
  if (daysLeft === 1) return "Demain";
  if (daysLeft < 7) return `${daysLeft}j`;
  if (daysLeft < 30) return `${Math.ceil(daysLeft / 7)}sem`;
  return `${Math.ceil(daysLeft / 30)}m`;
};

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export const UpcomingEventsCard = ({ alerts, profile }: UpcomingEventsCardProps) => {
  const navigate = useNavigate();

  const upcomingDeadlines = useMemo(() => {
    if (!profile) return [];
    const dp = toDeadlineProfile(profile);
    return FISCAL_DEADLINES
      .filter((d) => d.relevanceCondition(dp))
      .map((d) => {
        const daysLeft = computeDaysLeft(d.date);
        const urgency = computeUrgency(daysLeft, d.impactScore);
        const impact = d.computePersonalImpact(dp);
        return { ...d, daysLeft, urgency, impact };
      })
      .filter((d) => d.daysLeft >= 0 && d.daysLeft <= 180)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 3);
  }, [profile]);

  const criticalAlerts = alerts
    .filter((a) => a.severity === 'critical' || a.severity === 'warning')
    .slice(0, 2);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-info/10 text-info border-info/20';
    }
  };

  return (
    <Card className="border border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-warning/10 shrink-0">
            <Calendar className="h-5 w-5 text-warning" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg font-semibold">Ce qui arrive</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">Échéances & alertes</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
        {criticalAlerts.length > 0 && (
          <div className="space-y-2.5">
            {criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border ${getSeverityColor(alert.severity)} flex items-start gap-3`}
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{alert.title}</p>
                  <p className="text-xs opacity-75 mt-0.5 line-clamp-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
            Prochaines échéances
          </p>
          <div className="space-y-2">
            {upcomingDeadlines.map((deadline) => {
              const urgencyConf = URGENCY_CONFIG[deadline.urgency];
              return (
                <button
                  key={deadline.key}
                  onClick={() => navigate('/calendar')}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left min-h-[56px] active:scale-[0.98] transition-all
                    ${urgencyConf.bgColor} ${urgencyConf.borderColor}`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${urgencyConf.bgColor}`}>
                    {deadline.category === 'investissement' ? (
                      <Sparkles className={`h-4 w-4 ${urgencyConf.color}`} />
                    ) : (
                      <Calendar className={`h-4 w-4 ${urgencyConf.color}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{deadline.title}</p>
                    <p className="text-xs text-muted-foreground">{deadline.shortDescription.slice(0, 50)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatDate(deadline.date)}</p>
                    <p className="text-xs text-muted-foreground">{getDaysLabel(deadline.daysLeft)}</p>
                  </div>
                  {deadline.impact.estimatedGain > 0 && (
                    <span className="text-xs font-bold text-success shrink-0">
                      +{formatCurrency(deadline.impact.estimatedGain)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-between text-muted-foreground hover:text-foreground min-h-[44px] -mx-1"
          onClick={() => navigate('/calendar')}
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Voir le cockpit patrimonial
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
