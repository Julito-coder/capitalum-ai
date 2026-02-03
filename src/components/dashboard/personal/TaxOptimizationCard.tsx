import { Target, Check, X, Lightbulb, ChevronRight, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';

interface TaxOptimizationCardProps {
  profile: UserProfile | null;
  hasRealData: boolean;
  potentialSavings: number;
}

interface OptimizationLever {
  id: string;
  label: string;
  description: string;
  isActivated: boolean;
  potentialGain: number;
  condition: (profile: UserProfile | null) => boolean;
}

const getOptimizationLevers = (profile: UserProfile | null): OptimizationLever[] => [
  {
    id: 'frais-reels',
    label: 'Frais réels',
    description: 'Déduction des frais professionnels réels',
    isActivated: profile?.hasRealExpenses || false,
    potentialGain: profile?.realExpensesAmount ? Math.round(profile.realExpensesAmount * 0.15) : 500,
    condition: (p) => !!p?.isEmployee
  },
  {
    id: 'pea',
    label: 'PEA',
    description: 'Optimisation fiscale après 5 ans',
    isActivated: (profile?.peaBalance || 0) > 0,
    potentialGain: Math.round((profile?.peaBalance || 0) * 0.05 * 0.17),
    condition: () => true
  },
  {
    id: 'per',
    label: 'PER',
    description: 'Déduction des versements de l\'IR',
    isActivated: (profile?.percoAmount || 0) > 0,
    potentialGain: 900, // Estimated for 3000€ at 30%
    condition: () => true
  },
  {
    id: 'pee-perco',
    label: 'Épargne salariale',
    description: 'PEE/PERCO avec abondement',
    isActivated: (profile?.peeAmount || 0) + (profile?.percoAmount || 0) > 0,
    potentialGain: Math.round(((profile?.peeAmount || 0) + (profile?.percoAmount || 0)) * 0.15),
    condition: (p) => !!p?.isEmployee
  },
  {
    id: 'deficit-foncier',
    label: 'Déficit foncier',
    description: 'Déduction travaux locatifs',
    isActivated: (profile?.annualRentalWorks || 0) > 0,
    potentialGain: Math.round((profile?.annualRentalWorks || 0) * 0.3),
    condition: (p) => p?.rentalPropertiesCount ? p.rentalPropertiesCount > 0 : false
  },
  {
    id: 'quotient-familial',
    label: 'Quotient familial',
    description: 'Parts fiscales enfants',
    isActivated: (profile?.childrenCount || 0) > 0,
    potentialGain: (profile?.childrenCount || 0) * 1500,
    condition: () => true
  }
];

const getOptimizationLevel = (activatedCount: number, totalCount: number): { 
  label: string; 
  color: string; 
  bgColor: string;
  description: string;
} => {
  const ratio = activatedCount / totalCount;
  if (ratio >= 0.75) {
    return { 
      label: 'Forte', 
      color: 'text-success', 
      bgColor: 'bg-success',
      description: 'Votre situation est bien optimisée'
    };
  }
  if (ratio >= 0.5) {
    return { 
      label: 'Moyenne', 
      color: 'text-warning', 
      bgColor: 'bg-warning',
      description: 'Des optimisations sont encore possibles'
    };
  }
  return { 
    label: 'Faible', 
    color: 'text-destructive', 
    bgColor: 'bg-destructive',
    description: 'Potentiel d\'optimisation important'
  };
};

export const TaxOptimizationCard = ({ profile, hasRealData, potentialSavings }: TaxOptimizationCardProps) => {
  const navigate = useNavigate();
  
  const allLevers = getOptimizationLevers(profile);
  const applicableLevers = allLevers.filter(l => l.condition(profile));
  const activatedLevers = applicableLevers.filter(l => l.isActivated);
  const inactiveLevers = applicableLevers.filter(l => !l.isActivated);
  
  const optimizationLevel = getOptimizationLevel(activatedLevers.length, applicableLevers.length);
  const progressPercent = (activatedLevers.length / applicableLevers.length) * 100;
  
  const remainingPotential = inactiveLevers.reduce((sum, l) => sum + l.potentialGain, 0);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-accent/10">
              <Target className="h-5 w-5 text-accent" />
            </div>
            Optimisation fiscale
          </CardTitle>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${optimizationLevel.color} ${optimizationLevel.bgColor}/10 border border-current/30`}>
            {optimizationLevel.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{optimizationLevel.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Leviers activés</span>
            <span className="font-medium">{activatedLevers.length}/{applicableLevers.length}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Activated levers */}
        {activatedLevers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
              Leviers activés
            </p>
            <div className="flex flex-wrap gap-2">
              {activatedLevers.map((lever) => (
                <div 
                  key={lever.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/30 text-success text-xs"
                >
                  <Check className="h-3 w-3" />
                  {lever.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inactive levers */}
        {inactiveLevers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
              Non activés
            </p>
            <div className="flex flex-wrap gap-2">
              {inactiveLevers.slice(0, 4).map((lever) => (
                <div 
                  key={lever.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border/50 text-muted-foreground text-xs"
                >
                  <X className="h-3 w-3" />
                  {lever.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remaining potential */}
        {remainingPotential > 0 && (
          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-success" />
                <span className="text-sm">Potentiel restant estimé</span>
              </div>
              <span className="text-lg font-bold text-success">
                +{formatCurrency(remainingPotential)}
              </span>
            </div>
          </div>
        )}

        {/* Scanner link */}
        <Button 
          variant="ghost" 
          className="w-full justify-between text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/scanner')}
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analyser ma situation fiscale
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
