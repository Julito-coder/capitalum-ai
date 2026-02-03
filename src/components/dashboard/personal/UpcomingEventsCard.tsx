import { Calendar, AlertTriangle, Clock, Bell, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DashboardAlert, UserProfile } from '@/lib/dashboardService';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface UpcomingEventsCardProps {
  alerts: DashboardAlert[];
  profile: UserProfile | null;
}

// French fiscal calendar deadlines
const getFiscalDeadlines = () => {
  const now = new Date();
  const year = now.getFullYear();
  
  return [
    { 
      id: 'ir-declaration', 
      title: 'Déclaration IR', 
      date: new Date(year, 4, 25),
      type: 'fiscal',
      description: 'Date limite revenus'
    },
    { 
      id: 'taxe-fonciere', 
      title: 'Taxe foncière', 
      date: new Date(year, 9, 15),
      type: 'fiscal',
      description: 'Échéance paiement'
    },
    { 
      id: 'pea-versement', 
      title: 'Versement PEA', 
      date: new Date(year, 11, 31),
      type: 'optimization',
      description: 'Optimiser 2025'
    },
    { 
      id: 'per-versement', 
      title: 'Versement PER', 
      date: new Date(year, 11, 31),
      type: 'optimization',
      description: 'Déduction IR'
    },
  ].filter(d => d.date > now).sort((a, b) => a.date.getTime() - b.date.getTime());
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'warning': return 'bg-warning/10 text-warning border-warning/20';
    case 'success': return 'bg-success/10 text-success border-success/20';
    default: return 'bg-info/10 text-info border-info/20';
  }
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const getDaysUntil = (date: Date) => {
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  if (diff < 7) return `${diff}j`;
  if (diff < 30) return `${Math.ceil(diff / 7)}sem`;
  return `${Math.ceil(diff / 30)}m`;
};

export const UpcomingEventsCard = ({ alerts }: UpcomingEventsCardProps) => {
  const navigate = useNavigate();
  const fiscalDeadlines = getFiscalDeadlines().slice(0, 3);
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').slice(0, 2);

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
        {/* Critical alerts - prominent display */}
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

        {/* Upcoming deadlines - touch-friendly list */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
            Prochaines échéances
          </p>
          <div className="space-y-2">
            {fiscalDeadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/20 min-h-[56px] active:scale-[0.98] transition-transform"
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  deadline.type === 'fiscal' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'
                }`}>
                  {deadline.type === 'fiscal' ? <Calendar className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{deadline.title}</p>
                  <p className="text-xs text-muted-foreground">{deadline.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{formatDate(deadline.date)}</p>
                  <p className="text-xs text-muted-foreground">{getDaysUntil(deadline.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA - full width, touch-friendly */}
        <Button 
          variant="ghost" 
          className="w-full justify-between text-muted-foreground hover:text-foreground min-h-[44px] -mx-1"
          onClick={() => navigate('/calendar')}
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Voir le calendrier
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
