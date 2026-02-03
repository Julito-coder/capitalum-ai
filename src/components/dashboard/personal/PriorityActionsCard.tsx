import { Rocket, TrendingUp, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DashboardRecommendation, formatCurrency } from '@/lib/dashboardService';
import { Badge } from '@/components/ui/badge';

interface PriorityActionsCardProps {
  recommendations: DashboardRecommendation[];
  hasRealData: boolean;
}

const getEffortBadge = (effort: string) => {
  if (effort.includes('30') || effort.includes('min') || effort.toLowerCase().includes('faible')) {
    return { label: 'Facile', color: 'bg-success/10 text-success border-success/20' };
  }
  if (effort.includes('1h') || effort.includes('2h') || effort.toLowerCase().includes('moyen')) {
    return { label: 'Modéré', color: 'bg-warning/10 text-warning border-warning/20' };
  }
  return { label: 'Complexe', color: 'bg-info/10 text-info border-info/20' };
};

const ActionItem = ({ recommendation }: { recommendation: DashboardRecommendation }) => {
  const effort = getEffortBadge(recommendation.effort);
  
  return (
    <div className="p-4 rounded-xl bg-secondary/30 border border-border/20 active:scale-[0.99] transition-transform cursor-pointer min-h-[80px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h4 className="text-sm font-semibold">
              {recommendation.title}
            </h4>
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${effort.color}`}>
              {effort.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {recommendation.description}
          </p>
        </div>
        
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-success">
            +{formatCurrency(recommendation.gain)}
          </p>
          <p className="text-[10px] text-muted-foreground">économie</p>
        </div>
      </div>
      
      {/* Comparison - simplified for mobile */}
      <div className="mt-3 pt-3 border-t border-border/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            {formatCurrency(recommendation.currentOption.value)}
          </span>
          <TrendingUp className="h-3.5 w-3.5 text-success" />
          <span className="font-medium text-success">
            {formatCurrency(recommendation.recommendedOption.value)}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

export const PriorityActionsCard = ({ recommendations, hasRealData }: PriorityActionsCardProps) => {
  const totalPotentialGain = recommendations.reduce((sum, r) => sum + r.gain, 0);
  
  const defaultActions: DashboardRecommendation[] = [
    {
      id: 'pea-default',
      type: 'savings',
      title: 'Ouvrir un PEA',
      description: 'Fiscalité allégée après 5 ans sur vos investissements.',
      gain: 1500,
      effort: '1h',
      deadline: '2025-12-31',
      currentOption: { label: 'Sans PEA', value: 0, detail: 'Flat tax 30%' },
      recommendedOption: { label: 'Avec PEA', value: 1500, detail: 'PS 17.2%' }
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
      recommendedOption: { label: 'Versement 3000€', value: 900, detail: 'Économie IR' }
    }
  ];

  const displayedActions = recommendations.length > 0 ? recommendations.slice(0, 3) : defaultActions;
  const displayGain = totalPotentialGain > 0 ? totalPotentialGain : 2400;

  return (
    <Card className="border border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-success/10 shrink-0">
              <Rocket className="h-5 w-5 text-success" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold">
                Actions prioritaires
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {hasRealData ? 'Personnalisées' : 'Recommandations'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-success" />
            <span className="text-sm font-bold text-success">
              +{formatCurrency(displayGain)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
        {displayedActions.map((action, index) => (
          <ActionItem key={action.id || index} recommendation={action} />
        ))}
        
        {!hasRealData && (
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 text-center">
            <p className="text-xs text-muted-foreground">
              💡 <span className="text-primary font-medium">Conseil</span> : Complétez votre profil pour des recommandations personnalisées.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
