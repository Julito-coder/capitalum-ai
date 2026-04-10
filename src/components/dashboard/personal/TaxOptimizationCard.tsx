import { Target, Check, X, Lightbulb, ChevronRight, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { 
  useActionGuide, 
  createPERGuide, 
  createPEAGuide,
  createEpargneSalarialeGuide,
  createFraisReelsGuide,
  createRegimeReelGuide
} from '@/components/guides';

interface TaxOptimizationCardProps {
  profile: UserProfile | null;
  hasRealData: boolean;
  potentialSavings: number;
}

interface OptimizationLever {
  id: string;
  label: string;
  isActivated: boolean;
  potentialGain: number;
  condition: (profile: UserProfile | null) => boolean;
  guideType: 'per' | 'pea' | 'epargne-salariale' | 'frais-reels' | 'quotient';
}

const getOptimizationLevers = (profile: UserProfile | null): OptimizationLever[] => [
  {
    id: 'frais-reels',
    label: 'Frais réels',
    isActivated: profile?.hasRealExpenses || false,
    potentialGain: profile?.realExpensesAmount ? Math.round(profile.realExpensesAmount * 0.15) : 500,
    condition: (p) => !!p?.isEmployee,
    guideType: 'frais-reels'
  },
  {
    id: 'pea',
    label: 'PEA',
    isActivated: (profile?.peaBalance || 0) > 0,
    potentialGain: Math.max(500, Math.round((profile?.peaBalance || 0) * 0.05 * 0.17)),
    condition: () => true,
    guideType: 'pea'
  },
  {
    id: 'per',
    label: 'PER',
    isActivated: (profile?.percoAmount || 0) > 0,
    potentialGain: 900,
    condition: () => true,
    guideType: 'per'
  },
  {
    id: 'pee-perco',
    label: 'Épargne sal.',
    isActivated: (profile?.peeAmount || 0) + (profile?.percoAmount || 0) > 0,
    potentialGain: Math.max(500, Math.round(((profile?.peeAmount || 0) + (profile?.percoAmount || 0)) * 0.15)),
    condition: (p) => !!p?.isEmployee,
    guideType: 'epargne-salariale'
  },
  {
    id: 'quotient-familial',
    label: 'Quotient fam.',
    isActivated: (profile?.childrenCount || 0) > 0,
    potentialGain: (profile?.childrenCount || 0) * 1500,
    condition: () => true,
    guideType: 'quotient'
  }
];

const getOptimizationLevel = (activatedCount: number, totalCount: number) => {
  const ratio = activatedCount / totalCount;
  if (ratio >= 0.75) {
    return { label: 'Forte', color: 'text-success', bgColor: 'bg-success' };
  }
  if (ratio >= 0.5) {
    return { label: 'Moyenne', color: 'text-warning', bgColor: 'bg-warning' };
  }
  return { label: 'Faible', color: 'text-destructive', bgColor: 'bg-destructive' };
};

const getGuideForLever = (lever: OptimizationLever) => {
  switch (lever.guideType) {
    case 'per':
      return createPERGuide(lever.potentialGain);
    case 'pea':
      return createPEAGuide(lever.potentialGain);
    case 'epargne-salariale':
      return createEpargneSalarialeGuide(lever.potentialGain);
    case 'frais-reels':
      return createFraisReelsGuide(lever.potentialGain);
    default:
      return null;
  }
};

export const TaxOptimizationCard = ({ profile, hasRealData }: TaxOptimizationCardProps) => {
  const navigate = useNavigate();
  const { openGuide, isActionCompleted, isActionPending } = useActionGuide();
  
  const allLevers = getOptimizationLevers(profile);
  const applicableLevers = allLevers.filter(l => l.condition(profile));
  const activatedLevers = applicableLevers.filter(l => l.isActivated || isActionCompleted(l.id));
  const inactiveLevers = applicableLevers.filter(l => !l.isActivated && !isActionCompleted(l.id));
  
  const optimizationLevel = getOptimizationLevel(activatedLevers.length, applicableLevers.length);
  const progressPercent = applicableLevers.length > 0 ? (activatedLevers.length / applicableLevers.length) * 100 : 0;
  const remainingPotential = inactiveLevers.reduce((sum, l) => sum + l.potentialGain, 0);

  const handleLeverClick = (lever: OptimizationLever) => {
    if (lever.guideType === 'quotient') {
      // Quotient familial doesn't have a guide, it's informational
      return;
    }
    const guide = getGuideForLever(lever);
    if (guide) {
      openGuide(guide, profile);
    }
  };

  return (
    <Card className="border border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-accent/10 shrink-0">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold">
                Optimisation fiscale
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">Vos leviers</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${optimizationLevel.color} ${optimizationLevel.bgColor}/10 border border-current/20 shrink-0`}>
            {optimizationLevel.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
        {/* Progress bar - prominent metric */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Leviers activés</span>
            <span className="font-semibold">{activatedLevers.length}/{applicableLevers.length}</span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
        </div>

        {/* Levers display - compact pills */}
        <div className="space-y-3">
          {activatedLevers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activatedLevers.map((lever) => (
                <div 
                  key={lever.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success text-xs font-medium"
                >
                  <Check className="h-3 w-3" />
                  {lever.label}
                </div>
              ))}
            </div>
          )}
          
          {inactiveLevers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {inactiveLevers.slice(0, 3).map((lever) => (
                <button 
                  key={lever.id}
                  onClick={() => handleLeverClick(lever)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                    lever.guideType !== 'quotient'
                      ? 'bg-muted/40 border-border/30 text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary cursor-pointer'
                      : 'bg-muted/40 border-border/30 text-muted-foreground cursor-default'
                  } ${isActionPending(lever.id) ? 'border-warning/30 bg-warning/5' : ''}`}
                >
                  <X className="h-3 w-3" />
                  {lever.label}
                  {lever.guideType !== 'quotient' && (
                    <span className="text-success font-medium">+{formatCurrency(lever.potentialGain)}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Potential savings - key metric prominent */}
        {remainingPotential > 0 && (
          <div className="p-4 rounded-xl bg-success/5 border border-success/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lightbulb className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Potentiel restant</span>
              </div>
              <span className="text-xl font-bold text-success">
                +{formatCurrency(remainingPotential)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Clique sur un levier inactif pour débloquer cette économie
            </p>
          </div>
        )}

        {/* CTA - touch friendly */}
        <Button 
          variant="ghost" 
          className="w-full justify-between text-muted-foreground hover:text-foreground min-h-[44px] -mx-1"
          onClick={() => navigate('/scanner')}
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analyser ma situation
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
