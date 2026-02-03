import { Rocket, TrendingUp, Wallet, Clock, ChevronRight, Sparkles, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';

interface ProOptimizationsCardProps {
  profile: UserProfile | null;
  hasRealData: boolean;
}

interface ProOptimization {
  id: string;
  title: string;
  description: string;
  impactTresorerie: number;
  impactFiscal: number;
  effortAdmin: 'faible' | 'moyen' | 'élevé';
  roi: number; // Return on effort
  category: 'charges' | 'structure' | 'investissement' | 'social';
}

const getProOptimizations = (profile: UserProfile | null): ProOptimization[] => {
  const ca = profile?.annualRevenueHt || 0;
  const optimizations: ProOptimization[] = [];

  // Passage au réel si micro avec charges élevées
  const charges = (profile?.officeRent || 0) + (profile?.vehicleExpenses || 0) + (profile?.professionalSupplies || 0);
  const microAbattement = ca * 0.34; // Abattement BNC
  
  if (profile?.fiscalStatus === 'micro' && charges > microAbattement * 0.6 && ca > 30000) {
    const gain = Math.round((charges - microAbattement) * 0.3);
    if (gain > 0) {
      optimizations.push({
        id: 'passage-reel',
        title: 'Passage au régime réel',
        description: 'Vos charges dépassent l\'abattement micro. Le réel serait plus avantageux.',
        impactTresorerie: gain,
        impactFiscal: gain,
        effortAdmin: 'élevé',
        roi: gain / 500, // Cost of accounting
        category: 'structure'
      });
    }
  }

  // PER professionnel
  if (ca > 40000 && (profile?.percoAmount || 0) === 0) {
    const versementSuggere = Math.min(ca * 0.1, 32000);
    const gainFiscal = Math.round(versementSuggere * 0.30);
    optimizations.push({
      id: 'per-pro',
      title: 'Ouvrir un PER professionnel',
      description: 'Déduisez jusqu\'à 10% de votre bénéfice de votre revenu imposable.',
      impactTresorerie: -versementSuggere,
      impactFiscal: gainFiscal,
      effortAdmin: 'faible',
      roi: gainFiscal / versementSuggere,
      category: 'investissement'
    });
  }

  // Frais kilométriques optimisés
  if ((profile?.vehicleExpenses || 0) < ca * 0.05 && ca > 30000) {
    const potentiel = Math.round(ca * 0.03);
    optimizations.push({
      id: 'frais-km',
      title: 'Optimiser les frais kilométriques',
      description: 'Déclarez tous vos déplacements professionnels pour réduire votre base imposable.',
      impactTresorerie: 0,
      impactFiscal: Math.round(potentiel * 0.3),
      effortAdmin: 'moyen',
      roi: 2,
      category: 'charges'
    });
  }

  // Madelin / contrats pro
  optimizations.push({
    id: 'madelin',
    title: 'Contrats Madelin',
    description: 'Prévoyance et mutuelle déductibles pour les TNS.',
    impactTresorerie: -1500,
    impactFiscal: Math.round(1500 * 0.3),
    effortAdmin: 'faible',
    roi: 1.3,
    category: 'social'
  });

  // Sort by ROI
  return optimizations.sort((a, b) => b.roi - a.roi).slice(0, 4);
};

const getEffortBadge = (effort: string) => {
  switch (effort) {
    case 'faible': return { label: 'Facile', color: 'bg-success/10 text-success border-success/30' };
    case 'moyen': return { label: 'Modéré', color: 'bg-warning/10 text-warning border-warning/30' };
    default: return { label: 'Complexe', color: 'bg-info/10 text-info border-info/30' };
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'charges': return <Wallet className="h-4 w-4" />;
    case 'structure': return <Rocket className="h-4 w-4" />;
    case 'investissement': return <TrendingUp className="h-4 w-4" />;
    default: return <Zap className="h-4 w-4" />;
  }
};

export const ProOptimizationsCard = ({ profile, hasRealData }: ProOptimizationsCardProps) => {
  const navigate = useNavigate();
  const optimizations = getProOptimizations(profile);
  
  const totalFiscalGain = optimizations.reduce((sum, o) => sum + Math.max(0, o.impactFiscal), 0);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-success/10">
              <Rocket className="h-5 w-5 text-success" />
            </div>
            Optimisations prioritaires
          </CardTitle>
          {totalFiscalGain > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 border border-success/30">
              <Sparkles className="h-3.5 w-3.5 text-success" />
              <span className="text-sm font-semibold text-success">
                +{formatCurrency(totalFiscalGain)}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Classées par ROI (retour sur effort)</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {optimizations.map((opt) => {
          const effort = getEffortBadge(opt.effortAdmin);
          
          return (
            <div 
              key={opt.id}
              className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
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
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${effort.color}`}>
                      {effort.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {opt.description}
                  </p>
                </div>
              </div>
              
              {/* Impact indicators */}
              <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Trésorerie</span>
                  <p className={`font-semibold ${opt.impactTresorerie >= 0 ? 'text-success' : 'text-muted-foreground'}`}>
                    {opt.impactTresorerie >= 0 ? '+' : ''}{formatCurrency(opt.impactTresorerie)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Gain fiscal</span>
                  <p className="font-semibold text-success">+{formatCurrency(opt.impactFiscal)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ROI</span>
                  <p className="font-semibold text-primary">{opt.roi.toFixed(1)}x</p>
                </div>
              </div>
            </div>
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
