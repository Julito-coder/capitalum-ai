import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface ProjectStatusBadgeProps {
  dscr: number;
  cashflow: number;
  className?: string;
}

export const ProjectStatusBadge = ({ dscr, cashflow, className }: ProjectStatusBadgeProps) => {
  // Determine status based on DSCR and cashflow
  let status: 'ok' | 'warning' | 'risky';
  let label: string;
  let Icon: typeof CheckCircle;

  if (dscr >= 1.2 && cashflow >= 0) {
    status = 'ok';
    label = 'Banque OK';
    Icon = CheckCircle;
  } else if (dscr >= 1.0 && cashflow >= -100) {
    status = 'warning';
    label = 'À surveiller';
    Icon = AlertTriangle;
  } else {
    status = 'risky';
    label = 'Risqué';
    Icon = XCircle;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        status === 'ok' && "border-green-500/50 bg-green-500/10 text-green-600",
        status === 'warning' && "border-yellow-500/50 bg-yellow-500/10 text-yellow-600",
        status === 'risky' && "border-red-500/50 bg-red-500/10 text-red-600",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

interface TrendBadgeProps {
  value: number;
  suffix?: string;
  positive?: 'up' | 'down'; // Which direction is positive
  className?: string;
}

export const TrendBadge = ({ value, suffix = '', positive = 'up', className }: TrendBadgeProps) => {
  const isPositive = positive === 'up' ? value > 0 : value < 0;
  const Icon = value > 0 ? TrendingUp : TrendingDown;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        isPositive && "border-green-500/50 bg-green-500/10 text-green-600",
        !isPositive && value !== 0 && "border-red-500/50 bg-red-500/10 text-red-600",
        value === 0 && "border-muted-foreground/50",
        className
      )}
    >
      {value !== 0 && <Icon className="h-3 w-3" />}
      {value > 0 && '+'}{value.toLocaleString('fr-FR')}{suffix}
    </Badge>
  );
};
