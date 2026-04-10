import { useNavigate } from 'react-router-dom';
import { Rocket, TrendingUp, ChevronRight, Sparkles, Check, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DashboardRecommendation, formatCurrency, UserProfile } from '@/lib/dashboardService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  useActionGuide, 
  createPERGuide, 
  createPEAGuide,
  createEpargneSalarialeGuide,
  createFraisReelsGuide,
  createRegimeReelGuide
} from '@/components/guides';

interface PriorityActionsCardProps {
  recommendations: DashboardRecommendation[];
  hasRealData: boolean;
  profile?: UserProfile | null;
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

// Map recommendation types to guides
const getGuideForRecommendation = (recommendation: DashboardRecommendation) => {
  switch (recommendation.id) {
    case 'per-default':
    case 'per-optimization':
      return createPERGuide(recommendation.gain);
    case 'pea-default':
    case 'pea-transfer':
      return createPEAGuide(recommendation.gain);
    case 'pee-perco':
    case 'epargne-salariale':
      return createEpargneSalarialeGuide(recommendation.gain);
    case 'real-expenses':
    case 'frais-reels':
      return createFraisReelsGuide(recommendation.gain);
    case 'regime-reel':
      return createRegimeReelGuide(recommendation.gain);
    default:
      // Create a generic guide based on recommendation type
      if (recommendation.type === 'savings') return createPEAGuide(recommendation.gain);
      if (recommendation.type === 'deduction') return createFraisReelsGuide(recommendation.gain);
      if (recommendation.type === 'status') return createRegimeReelGuide(recommendation.gain);
      return createPERGuide(recommendation.gain);
  }
};

const ActionItem = ({ 
  recommendation, 
  profile,
  onOpenGuide 
}: { 
  recommendation: DashboardRecommendation;
  profile?: UserProfile | null;
  onOpenGuide: () => void;
}) => {
  const effort = getEffortBadge(recommendation.effort);
  const { isActionCompleted, isActionPending } = useActionGuide();
  
  const isCompleted = isActionCompleted(recommendation.id);
  const isPending = isActionPending(recommendation.id);
  
  return (
    <div 
      className={`p-4 rounded-xl border transition-all cursor-pointer min-h-[80px] ${
        isCompleted 
          ? 'bg-success/5 border-success/30' 
          : isPending 
            ? 'bg-warning/5 border-warning/30'
            : 'bg-secondary/30 border-border/20 active:scale-[0.99]'
      }`}
      onClick={!isCompleted ? onOpenGuide : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {isCompleted && (
              <div className="p-1 rounded-full bg-success/20">
                <Check className="h-3 w-3 text-success" />
              </div>
            )}
            {isPending && !isCompleted && (
              <div className="p-1 rounded-full bg-warning/20">
                <Clock className="h-3 w-3 text-warning" />
              </div>
            )}
            <h4 className={`text-sm font-semibold ${isCompleted ? 'text-success' : ''}`}>
              {recommendation.title}
            </h4>
            {!isCompleted && (
              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${effort.color}`}>
                {effort.label}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {isCompleted 
              ? '✅ Optimisation en cours'
              : isPending 
                ? '⏳ À faire prochainement'
                : recommendation.description
            }
          </p>
        </div>
        
        <div className="text-right shrink-0">
          <p className={`text-lg font-bold ${isCompleted ? 'text-success/60' : 'text-success'}`}>
            +{formatCurrency(recommendation.gain)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {isCompleted ? 'économisé' : 'économie'}
          </p>
        </div>
      </div>
      
      {/* Comparison or CTA */}
      {!isCompleted && (
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-primary hover:text-primary"
          >
            <span className="text-xs font-medium">Optimiser</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export const PriorityActionsCard = ({ recommendations, hasRealData, profile }: PriorityActionsCardProps) => {
  const { openGuide, completedActions } = useActionGuide();
  
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
    },
    {
      id: 'pee-perco',
      type: 'savings',
      title: 'Activer l\'épargne salariale',
      description: 'Profitez de l\'abondement employeur sur le PEE/PERCO.',
      gain: 2000,
      effort: '30 min',
      deadline: '2025-12-31',
      currentOption: { label: 'Sans épargne', value: 0, detail: 'Pas d\'abondement' },
      recommendedOption: { label: 'Avec PEE', value: 2000, detail: 'Abondement 100%' }
    }
  ];

  const displayedActions = recommendations.length > 0 ? recommendations.slice(0, 3) : defaultActions;
  
  // Calculate totals
  const totalPotentialGain = displayedActions.reduce((sum, r) => sum + r.gain, 0);
  const completedGain = displayedActions
    .filter(r => completedActions.includes(r.id))
    .reduce((sum, r) => sum + r.gain, 0);
  const remainingGain = totalPotentialGain - completedGain;

  const navigate = useNavigate();

  const handleOpenGuide = (recommendation: DashboardRecommendation) => {
    // Navigate directly for crypto-2086
    if (recommendation.id === 'crypto-2086') {
      navigate('/crypto/2086');
      return;
    }
    const guide = getGuideForRecommendation(recommendation);
    openGuide(guide, profile);
  };

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
                {completedActions.length > 0 
                  ? `${completedActions.length} action${completedActions.length > 1 ? 's' : ''} réalisée${completedActions.length > 1 ? 's' : ''}`
                  : hasRealData ? 'Personnalisées' : 'Recommandations'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-success" />
            <span className="text-sm font-bold text-success">
              +{formatCurrency(remainingGain > 0 ? remainingGain : totalPotentialGain)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
        {displayedActions.map((action, index) => (
          <ActionItem 
            key={action.id || index} 
            recommendation={action}
            profile={profile}
            onOpenGuide={() => handleOpenGuide(action)}
          />
        ))}
        
        {!hasRealData && (
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 text-center">
            <p className="text-xs text-muted-foreground">
              💡 <span className="text-primary font-medium">Conseil</span> : Complétez ton profil pour des recommandations personnalisées.
            </p>
          </div>
        )}
        
        {completedGain > 0 && (
          <div className="p-3.5 rounded-xl bg-success/5 border border-success/15 text-center">
            <p className="text-xs text-muted-foreground">
              🎉 <span className="text-success font-medium">{formatCurrency(completedGain)}</span> d'économies en cours de réalisation !
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
