import { ReactNode } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  status?: 'success' | 'warning' | 'critical' | 'info';
  action?: ReactNode;
}

export const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  status,
  action 
}: MetricCardProps) => {
  const statusClasses = {
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    critical: 'border-destructive/30 bg-destructive/5',
    info: 'border-info/30 bg-info/5'
  };

  const iconClasses = {
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    critical: 'text-destructive bg-destructive/10',
    info: 'text-info bg-info/10'
  };

  return (
    <div className={`metric-card ${status ? statusClasses[status] : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${status ? iconClasses[status] : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend.value >= 0 ? 'text-success' : 'text-destructive'
          }`}>
            {trend.value >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl lg:text-3xl font-bold tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {action && (
        <div className="mt-4 pt-4 border-t border-border/50">
          {action}
        </div>
      )}
    </div>
  );
};
