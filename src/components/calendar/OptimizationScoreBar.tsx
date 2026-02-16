import { Progress } from '@/components/ui/progress';
import { OptimizationScore } from '@/lib/deadlinesTypes';
import { Trophy, TrendingUp, AlertCircle, Target } from 'lucide-react';

interface ScoreBarProps {
  score: OptimizationScore;
}

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export const OptimizationScoreBar = ({ score }: ScoreBarProps) => {
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center p-3 rounded-xl bg-success/10 border border-success/20">
          <p className="text-lg font-bold text-success">{score.optimizedCount}</p>
          <p className="text-xs text-muted-foreground">Optimisées</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-warning/10 border border-warning/20">
          <p className="text-lg font-bold text-warning">{score.inProgressCount}</p>
          <p className="text-xs text-muted-foreground">En cours</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted border border-border/20">
          <p className="text-lg font-bold">{score.pendingCount}</p>
          <p className="text-xs text-muted-foreground">À faire</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <p className="text-lg font-bold text-destructive">{score.ignoredCount}</p>
          <p className="text-xs text-muted-foreground">Ignorées</p>
        </div>
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
