import { Activity, Wallet, TrendingUp, AlertTriangle, Target, Sparkles, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useActionGuide } from '@/components/guides/ActionGuideContext';
import { createTresorerieGuide, createRemunerationGuide } from '@/components/guides';

interface FinancialHealthCardProps {
  profile: UserProfile | null;
  hasRealData: boolean;
}

interface HealthStatus {
  label: string;
  color: 'success' | 'warning' | 'critical';
  description: string;
  score: number;
}

interface ActionableInsight {
  id: string;
  signal: string;
  gain: number;
  action: string;
  guide: 'tresorerie' | 'remuneration';
  priority: 'urgent' | 'important' | 'opportunite';
}

const calculateHealthStatus = (profile: UserProfile | null): HealthStatus => {
  if (!profile?.isSelfEmployed) {
    return { label: 'N/A', color: 'warning', description: 'Activez ton profil pro', score: 0 };
  }
  
  const ca = profile.annualRevenueHt || 0;
  const charges = (profile.socialChargesPaid || 0) + (profile.officeRent || 0) + 
                  (profile.vehicleExpenses || 0) + (profile.professionalSupplies || 0);
  const benefice = ca - charges;
  const margeNette = ca > 0 ? (benefice / ca) * 100 : 0;
  
  if (margeNette >= 40) return { label: 'Excellente', color: 'success', description: 'Marge optimale', score: 90 };
  if (margeNette >= 25) return { label: 'Bonne', color: 'success', description: 'Rentabilité saine', score: 70 };
  if (margeNette >= 15) return { label: 'Correcte', color: 'warning', description: 'Surveiller les charges', score: 50 };
  return { label: 'Tendue', color: 'critical', description: 'Optimisation requise', score: 30 };
};

const getActionableInsights = (profile: UserProfile | null): ActionableInsight[] => {
  const ca = profile?.annualRevenueHt || 0;
  const charges = (profile?.socialChargesPaid || 0) + (profile?.officeRent || 0);
  const tresorerieEstimee = Math.max((ca - charges) * 0.3, 20000);
  const insights: ActionableInsight[] = [];

  // Trésorerie dormante
  if (tresorerieEstimee > 15000) {
    insights.push({
      id: 'tresorerie',
      signal: 'Trésorerie sous-utilisée',
      gain: Math.round(tresorerieEstimee * 0.035),
      action: 'Déployer la trésorerie',
      guide: 'tresorerie',
      priority: 'opportunite'
    });
  }

  // Rémunération non optimisée
  if (ca > 40000) {
    insights.push({
      id: 'remuneration',
      signal: 'Rémunération non optimisée',
      gain: Math.round(ca * 0.08),
      action: 'Optimiser ma rémunération',
      guide: 'remuneration',
      priority: 'important'
    });
  }

  return insights;
};

const statusColors = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

const priorityColors = {
  urgent: 'bg-destructive/10 text-destructive',
  important: 'bg-warning/10 text-warning',
  opportunite: 'bg-success/10 text-success'
};

export const FinancialHealthCard = ({ profile, hasRealData }: FinancialHealthCardProps) => {
  const navigate = useNavigate();
  const { openGuide } = useActionGuide();

  const caAnnuel = profile?.annualRevenueHt || 0;
  const caMensuel = caAnnuel / 12;
  
  const chargesAnnuelles = (profile?.socialChargesPaid || 0) + 
                           (profile?.officeRent || 0) + 
                           (profile?.vehicleExpenses || 0) + 
                           (profile?.professionalSupplies || 0);
  
  const beneficeNet = caAnnuel - chargesAnnuelles;
  const tresorerieEstimee = beneficeNet * 0.3;

  const healthStatus = calculateHealthStatus(profile);
  const insights = getActionableInsights(profile);
  const totalGain = insights.reduce((sum, i) => sum + i.gain, 0);

  const handleInsightClick = (insight: ActionableInsight) => {
    if (insight.guide === 'tresorerie') {
      openGuide(createTresorerieGuide(profile), profile);
    } else if (insight.guide === 'remuneration') {
      openGuide(createRemunerationGuide(profile), profile);
    }
  };

  if (!hasRealData || !profile?.isSelfEmployed) {
    return (
      <Card className="border border-border/30 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
            <div className="p-4 rounded-2xl bg-muted/30 mb-4">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium mb-1">Activité non configurée</p>
            <p className="text-sm text-muted-foreground mb-5 max-w-[280px]">
              Complétez ton profil professionnel pour suivre ton activité.
            </p>
            <Button 
              onClick={() => navigate('/pro/onboarding')} 
              size="lg"
              className="min-h-[44px] px-6"
            >
              Configurer mon activité
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/30 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-accent/10 shrink-0">
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold">
                Santé financière
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {healthStatus.description}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0 ${statusColors[healthStatus.color]}`}>
            {healthStatus.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
        {/* Health score */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Score de santé</span>
            <span className="font-semibold">{healthStatus.score}/100</span>
          </div>
          <Progress value={healthStatus.score} className="h-2.5" />
        </div>

        {/* Primary metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-gradient-to-br from-accent/5 to-transparent border border-accent/10">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">CA mensuel</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(caMensuel)}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Wallet className="h-4 w-4 text-info" />
              <span className="text-xs text-muted-foreground">Trésorerie</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(tresorerieEstimee)}</p>
          </div>
        </div>

        {/* Actionable insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Actions recommandées
              </span>
              {totalGain > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10">
                  <Sparkles className="h-3 w-3 text-success" />
                  <span className="text-xs font-semibold text-success">+{formatCurrency(totalGain)}</span>
                </div>
              )}
            </div>
            
            {insights.slice(0, 2).map((insight) => (
              <button
                key={insight.id}
                onClick={() => handleInsightClick(insight)}
                className="w-full p-3 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all group text-left"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    <span className="text-xs text-muted-foreground">{insight.signal}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColors[insight.priority]}`}>
                    +{formatCurrency(insight.gain)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {insight.action}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* CTA */}
        <Button 
          variant="ghost" 
          className="w-full justify-center text-muted-foreground hover:text-foreground min-h-[44px]"
          onClick={() => navigate('/pro/revenue')}
        >
          Voir le détail financier
        </Button>
      </CardContent>
    </Card>
  );
};
