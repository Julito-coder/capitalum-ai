import { Progress } from '@/components/ui/progress';
import { OptimizationScore, DeadlineStatus } from '@/lib/deadlinesTypes';
import { Trophy, TrendingUp, AlertCircle } from 'lucide-react';

interface ScoreBarProps {
  score: OptimizationScore;
  activeFilter: DeadlineStatus | null;
  onFilterByStatus: (status: DeadlineStatus | null) => void;
}

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

const STATUS_BUTTONS: { status: DeadlineStatus; label: string; colorClasses: string; activeClasses: string }[] = [
  { status: 'optimized', label: 'Optimisées', colorClasses: 'bg-success/10 border-success/20', activeClasses: 'ring-2 ring-success ring-offset-2 ring-offset-card scale-105' },
  { status: 'in_progress', label: 'En cours', colorClasses: 'bg-warning/10 border-warning/20', activeClasses: 'ring-2 ring-warning ring-offset-2 ring-offset-card scale-105' },
  { status: 'pending', label: 'À faire', colorClasses: 'bg-muted border-border/20', activeClasses: 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-105' },
  { status: 'ignored', label: 'Ignorées', colorClasses: 'bg-destructive/10 border-destructive/20', activeClasses: 'ring-2 ring-destructive ring-offset-2 ring-offset-card scale-105' },
];

function getCount(score: OptimizationScore, status: DeadlineStatus): number {
  switch (status) {
    case 'optimized': return score.optimizedCount;
    case 'in_progress': return score.inProgressCount;
    case 'pending': return score.pendingCount;
    case 'ignored': return score.ignoredCount;
  }
}

function getCountColor(status: DeadlineStatus): string {
  switch (status) {
    case 'optimized': return 'text-success';
    case 'in_progress': return 'text-warning';
    case 'pending': return 'text-foreground';
    case 'ignored': return 'text-destructive';
  }
}

export const OptimizationScoreBar = ({ score, activeFilter, onFilterByStatus }: ScoreBarProps) => {
  return (
    <div className="p-5 rounded-2xl border-2 border-border/30 bg-card/80 backdrop-blur-sm space-y-4">
      {/* Main progress */}
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="font-semibold text-sm">Score d'optimisation</h3>
            <span className="text-xl font-bold text-primary">{score.optimizationRate}%</span>
          </div>
          <Progress value={score.optimizationRate} className="h-2.5" />
        </div>
      </div>

      {/* Stats grid — clickable buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_BUTTONS.map(({ status, label, colorClasses, activeClasses }) => {
          const isActive = activeFilter === status;
          return (
            <button
              key={status}
              onClick={() => onFilterByStatus(isActive ? null : status)}
              className={`text-center p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] ${colorClasses} ${isActive ? activeClasses : ''}`}
            >
              <p className={`text-lg font-bold ${getCountColor(status)}`}>{getCount(score, status)}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </button>
          );
        })}
      </div>

      {/* Gains summary */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-success" />
          <span className="text-muted-foreground">Gains réalisés :</span>
          <span className="font-bold text-success">{formatCurrency(score.cumulativeGains)}</span>
        </div>
        {score.missedGains > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-muted-foreground">Potentiel restant :</span>
            <span className="font-bold text-destructive">{formatCurrency(score.missedGains)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
