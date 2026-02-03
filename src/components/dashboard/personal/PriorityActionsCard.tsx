import { Rocket, Zap, Clock, TrendingUp, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DashboardRecommendation, formatCurrency } from '@/lib/dashboardService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PriorityActionsCardProps {
  recommendations: DashboardRecommendation[];
  hasRealData: boolean;
}

const getEffortBadge = (effort: string) => {
  if (effort.includes('30') || effort.includes('min') || effort.toLowerCase().includes('faible')) {
    return { label: 'Facile', color: 'bg-success/10 text-success border-success/30' };
  }
  if (effort.includes('1h') || effort.includes('2h') || effort.toLowerCase().includes('moyen')) {
    return { label: 'Modéré', color: 'bg-warning/10 text-warning border-warning/30' };
  }
  return { label: 'Complexe', color: 'bg-info/10 text-info border-info/30' };
};

const ActionItem = ({ recommendation }: { recommendation: DashboardRecommendation }) => {
  const effort = getEffortBadge(recommendation.effort);
  
  return (
    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg group cursor-pointer">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
              {recommendation.title}
            </h4>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${effort.color}`}>
              {effort.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {recommendation.description}
          </p>
        </div>
        
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-success">
            +{formatCurrency(recommendation.gain)}
          </p>
          <p className="text-xs text-muted-foreground">économie estimée</p>
        </div>
      </div>
      
      {/* Comparison preview */}
      <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-muted-foreground">Actuel: </span>
            <span className="font-medium">{formatCurrency(recommendation.currentOption.value)}</span>
          </div>
          <TrendingUp className="h-3 w-3 text-success" />
          <div>
            <span className="text-muted-foreground">Optimisé: </span>
            <span className="font-medium text-success">{formatCurrency(recommendation.recommendedOption.value)}</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
};

export const PriorityActionsCard = ({ recommendations, hasRealData }: PriorityActionsCardProps) => {
  const totalPotentialGain = recommendations.reduce((sum, r) => sum + r.gain, 0);
  
  // Default actions when no data
  const defaultActions = [
    {
      id: 'pea-default',
      type: 'savings',
      title: 'Ouvrir un PEA',
      description: 'Profitez d\'une fiscalité allégée après 5 ans sur vos investissements actions.',
      gain: 1500,
      effort: '1h',
      deadline: '2025-12-31',
      currentOption: { label: 'Sans PEA', value: 0, detail: 'Flat tax 30%' },
      recommendedOption: { label: 'Avec PEA', value: 1500, detail: 'PS 17.2% après 5 ans' }
    },
    {
      id: 'per-default',
      type: 'tax',
      title: 'Verser sur un PER',
      description: 'Déduisez vos versements de votre revenu imposable.',
      gain: 900,
      effort: '30 min',
      deadline: '2025-12-31',
      currentOption: { label: 'Sans PER', value: 0, detail: 'Pas de déduction' },
      recommendedOption: { label: 'Versement 3000€', value: 900, detail: 'Économie IR à 30%' }
    }
  ];

  const displayedActions = recommendations.length > 0 ? recommendations.slice(0, 5) : defaultActions.slice(0, 3);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-success/10">
              <Rocket className="h-5 w-5 text-success" />
            </div>
            Actions prioritaires
          </CardTitle>
          {totalPotentialGain > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 border border-success/30">
              <Sparkles className="h-3.5 w-3.5 text-success" />
              <span className="text-sm font-semibold text-success">
                +{formatCurrency(totalPotentialGain)}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {hasRealData 
            ? 'Optimisations personnalisées basées sur votre profil'
            : 'Actions génériques - complétez votre profil pour personnaliser'}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedActions.map((action, index) => (
          <ActionItem key={action.id || index} recommendation={action} />
        ))}
        
        {!hasRealData && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground">
              💡 <strong className="text-primary">Conseil :</strong> Complétez votre profil pour débloquer des recommandations sur mesure.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
