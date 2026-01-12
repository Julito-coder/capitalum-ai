import { AlertTriangle, Info, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Alert } from '@/data/mockData';

interface AlertCardProps {
  alert: Alert;
  onAction?: () => void;
}

export const AlertCard = ({ alert, onAction }: AlertCardProps) => {
  const config = {
    critical: {
      icon: XCircle,
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      iconColor: 'text-destructive',
      badge: 'bg-destructive/20 text-destructive'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      iconColor: 'text-warning',
      badge: 'bg-warning/20 text-warning'
    },
    success: {
      icon: CheckCircle2,
      bg: 'bg-success/10',
      border: 'border-success/30',
      iconColor: 'text-success',
      badge: 'bg-success/20 text-success'
    },
    info: {
      icon: Info,
      bg: 'bg-info/10',
      border: 'border-info/30',
      iconColor: 'text-info',
      badge: 'bg-info/20 text-info'
    }
  };

  const { icon: Icon, bg, border, iconColor, badge } = config[alert.severity];

  return (
    <div className={`rounded-xl ${bg} ${border} border p-4 transition-all duration-200 hover:scale-[1.01]`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground">{alert.title}</h4>
            {alert.gain > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>
                +{alert.gain.toLocaleString('fr-FR')}€
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{alert.message}</p>
          
          {alert.deadline && (
            <p className="text-xs text-muted-foreground mt-2">
              ⏰ Avant le {new Date(alert.deadline).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          )}
        </div>

        <button 
          onClick={onAction}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Voir
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
