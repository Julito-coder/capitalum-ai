import { Rocket, TrendingUp, Wallet, ChevronRight, Sparkles, Zap, Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { useActionGuide } from '@/components/guides/ActionGuideContext';
import { 
  createRemunerationGuide, 
  createTresorerieGuide, 
  createFiscaliteISGuide 
} from '@/components/guides';

interface ProOptimizationsCardProps {
  profile: UserProfile | null;
  hasRealData: boolean;
}

interface ProOptimization {
  id: string;
  title: string;
  signal: string;
  impactAnnuel: number;
  effortAdmin: 'faible' | 'moyen' | 'élevé';
  category: 'remuneration' | 'tresorerie' | 'fiscalite' | 'structure';
  guideType: 'remuneration' | 'tresorerie' | 'fiscalite';
}

const getProOptimizations = (profile: UserProfile | null): ProOptimization[] => {
  const ca = profile?.annualRevenueHt || 0;
  const charges = (profile?.officeRent || 0) + (profile?.vehicleExpenses || 0) + (profile?.professionalSupplies || 0);
  const benefice = ca - charges;
  const tresorerie = benefice * 0.3;
  const optimizations: ProOptimization[] = [];

  // Optimisation rémunération
  if (ca > 40000 && profile?.fiscalStatus !== 'micro') {
    optimizations.push({
      id: 'remuneration',
      title: 'Optimiser ma rémunération',
      signal: 'Mix salaire/dividendes non optimisé',
      impactAnnuel: Math.round(ca * 0.08),
      effortAdmin: 'moyen',
      category: 'remuneration',
      guideType: 'remuneration'
    });
  }

  // Trésorerie dormante
  if (tresorerie > 20000) {
    optimizations.push({
      id: 'tresorerie',
      title: 'Déployer ma trésorerie',
      signal: 'Trésorerie inactive depuis 6+ mois',
      impactAnnuel: Math.round(tresorerie * 0.035),
      effortAdmin: 'faible',
      category: 'tresorerie',
      guideType: 'tresorerie'
    });
  }

  // Réduction IS
  if (benefice > 30000 && profile?.fiscalStatus !== 'micro') {
    optimizations.push({
      id: 'fiscalite',
      title: 'Réduire mon IS',
      signal: 'Leviers fiscaux non exploités',
      impactAnnuel: Math.round(benefice * 0.25 * 0.15),
      effortAdmin: 'moyen',
      category: 'fiscalite',
      guideType: 'fiscalite'
    });
  }

  // Charges déductibles oubliées (toujours pertinent)
  optimizations.push({
    id: 'charges',
    title: 'Recenser mes charges déductibles',
    signal: 'Frais pro potentiellement oubliés',
    impactAnnuel: Math.min(2500, benefice * 0.04),
    effortAdmin: 'faible',
    category: 'fiscalite',
    guideType: 'fiscalite'
  });

  // Sort by impact
  return optimizations.sort((a, b) => b.impactAnnuel - a.impactAnnuel).slice(0, 4);
};

const getEffortBadge = (effort: string) => {
  switch (effort) {
    case 'faible': return { label: 'Facile', color: 'bg-success/10 text-success border-success/30' };
    case 'moyen': return { label: 'Modéré', color: 'bg-warning/10 text-warning border-warning/30' };
    default: return { label: 'Avancé', color: 'bg-info/10 text-info border-info/30' };
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'remuneration': return <Wallet className="h-4 w-4" />;
    case 'tresorerie': return <TrendingUp className="h-4 w-4" />;
    case 'fiscalite': return <Zap className="h-4 w-4" />;
    default: return <Rocket className="h-4 w-4" />;
  }
};

export const ProOptimizationsCard = ({ profile, hasRealData }: ProOptimizationsCardProps) => {
  const navigate = useNavigate();
  const { openGuide, isActionCompleted, isActionPending } = useActionGuide();
  const optimizations = getProOptimizations(profile);
  
  const totalGain = optimizations.reduce((sum, o) => sum + o.impactAnnuel, 0);

  const handleOptimizationClick = (opt: ProOptimization) => {
    switch (opt.guideType) {
      case 'remuneration':
        openGuide(createRemunerationGuide(profile), profile);
        break;
      case 'tresorerie':
        openGuide(createTresorerieGuide(profile), profile);
        break;
      case 'fiscalite':
        openGuide(createFiscaliteISGuide(profile), profile);
        break;
    }
  };

  const getActionStatus = (optId: string) => {
    if (isActionCompleted(`${optId}-optimisation`)) return 'completed';
    if (isActionPending(`${optId}-optimisation`)) return 'pending';
    return 'available';
  };

  return (
    <Card className="border border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-success/10">
              <Rocket className="h-5 w-5 text-success" />
            </div>
            Optimisations prioritaires
          </CardTitle>
          {totalGain > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 border border-success/30">
              <Sparkles className="h-3.5 w-3.5 text-success" />
              <span className="text-sm font-semibold text-success">
                +{formatCurrency(totalGain)}/an
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Cliquez pour démarrer un parcours guidé</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {optimizations.map((opt) => {
          const effort = getEffortBadge(opt.effortAdmin);
          const status = getActionStatus(opt.id);
          
          return (
            <button 
              key={opt.id}
              onClick={() => handleOptimizationClick(opt)}
              className="w-full p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getCategoryIcon(opt.category)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {opt.title}
                    </h4>
                    {status === 'completed' && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-success/10 text-success border-success/30">
                        ✓ Réalisé
                      </Badge>
                    )}
                    {status === 'pending' && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-warning/10 text-warning border-warning/30">
                        En cours
                      </Badge>
                    )}
                    {status === 'available' && (
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${effort.color}`}>
                        {effort.label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {opt.signal}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-success">+{formatCurrency(opt.impactAnnuel)}</p>
                    <p className="text-[10px] text-muted-foreground">par an</p>
                  </div>
                  <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Play className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        <Button 
          variant="ghost" 
          className="w-full justify-between text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/scanner')}
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analyse fiscale complète
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
