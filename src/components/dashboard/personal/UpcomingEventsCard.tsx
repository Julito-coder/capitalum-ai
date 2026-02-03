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
      date: new Date(year, 4, 25), // May 25
      type: 'fiscal',
      description: 'Date limite déclaration revenus'
    },
    { 
      id: 'taxe-fonciere', 
      title: 'Taxe foncière', 
      date: new Date(year, 9, 15), // Oct 15
      type: 'fiscal',
      description: 'Échéance paiement'
    },
    { 
      id: 'taxe-habitation', 
      title: 'Taxe habitation résidence secondaire', 
      date: new Date(year, 10, 15), // Nov 15
      type: 'fiscal',
      description: 'Échéance paiement'
    },
    { 
      id: 'pea-versement', 
      title: 'Versement PEA', 
      date: new Date(year, 11, 31), // Dec 31
      type: 'optimization',
      description: 'Dernière date pour optimiser 2025'
    },
    { 
      id: 'per-versement', 
      title: 'Versement PER déductible', 
      date: new Date(year, 11, 31), // Dec 31
      type: 'optimization',
      description: 'Dernière date déduction IR'
    },
  ].filter(d => d.date > now).sort((a, b) => a.date.getTime() - b.date.getTime());
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-destructive/10 text-destructive border-destructive/30';
    case 'warning': return 'bg-warning/10 text-warning border-warning/30';
    case 'success': return 'bg-success/10 text-success border-success/30';
    default: return 'bg-info/10 text-info border-info/30';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'fiscal': return <Calendar className="h-4 w-4" />;
    case 'optimization': return <Bell className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
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
  if (diff < 7) return `Dans ${diff} jours`;
  if (diff < 30) return `Dans ${Math.ceil(diff / 7)} sem.`;
  return `Dans ${Math.ceil(diff / 30)} mois`;
};

export const UpcomingEventsCard = ({ alerts, profile }: UpcomingEventsCardProps) => {
  const navigate = useNavigate();
  const fiscalDeadlines = getFiscalDeadlines().slice(0, 3);
  
  // Filter critical alerts
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').slice(0, 2);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-warning/10">
            <Calendar className="h-5 w-5 text-warning" />
          </div>
          Ce qui arrive
        </CardTitle>
        <p className="text-sm text-muted-foreground">Échéances fiscales et alertes</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical alerts first */}
        {criticalAlerts.length > 0 && (
          <div className="space-y-2">
            {criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} flex items-start gap-3`}
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs opacity-80 truncate">{alert.message}</p>
                </div>
                {alert.deadline && (
                  <span className="text-xs font-medium shrink-0">
                    {formatDate(new Date(alert.deadline))}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Fiscal deadlines */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Prochaines échéances
          </p>
          {fiscalDeadlines.map((deadline) => (
            <div
              key={deadline.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className={`p-2 rounded-lg ${
                deadline.type === 'fiscal' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'
              }`}>
                {getTypeIcon(deadline.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{deadline.title}</p>
                <p className="text-xs text-muted-foreground">{deadline.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium">{formatDate(deadline.date)}</p>
                <p className="text-xs text-muted-foreground">{getDaysUntil(deadline.date)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar link */}
        <Button 
          variant="ghost" 
          className="w-full justify-between text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/calendar')}
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Voir le calendrier complet
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
