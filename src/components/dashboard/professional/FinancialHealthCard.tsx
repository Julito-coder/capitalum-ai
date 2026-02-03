import { Activity, Wallet, TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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

const calculateHealthStatus = (profile: UserProfile | null): HealthStatus => {
  if (!profile?.isSelfEmployed) {
    return { label: 'Non applicable', color: 'warning', description: 'Activez votre profil professionnel', score: 0 };
  }
  
  const ca = profile.annualRevenueHt || 0;
  const charges = (profile.socialChargesPaid || 0) + (profile.officeRent || 0) + 
                  (profile.vehicleExpenses || 0) + (profile.professionalSupplies || 0);
  const benefice = ca - charges;
  const margeNette = ca > 0 ? (benefice / ca) * 100 : 0;
  
  if (margeNette >= 40) {
    return { label: 'Excellente', color: 'success', description: 'Marge nette optimale', score: 90 };
  }
  if (margeNette >= 25) {
    return { label: 'Bonne', color: 'success', description: 'Rentabilité saine', score: 70 };
  }
  if (margeNette >= 15) {
    return { label: 'Correcte', color: 'warning', description: 'Attention aux charges', score: 50 };
  }
  return { label: 'Tendue', color: 'critical', description: 'Optimisation nécessaire', score: 30 };
};

const statusColors = {
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
};

export const FinancialHealthCard = ({ profile, hasRealData }: FinancialHealthCardProps) => {
  const navigate = useNavigate();

  // Calculate professional metrics
  const caAnnuel = profile?.annualRevenueHt || 0;
  const caMensuel = caAnnuel / 12;
  
  // Estimate treasury (simplified)
  const chargesAnnuelles = (profile?.socialChargesPaid || 0) + 
                           (profile?.officeRent || 0) + 
                           (profile?.vehicleExpenses || 0) + 
                           (profile?.professionalSupplies || 0);
  
  const beneficeNet = caAnnuel - chargesAnnuelles;
  const tresorerieEstimee = beneficeNet * 0.3; // Rough estimate of available cash
  
  // Upcoming social charges (URSSAF quarterly)
  const urssafTrimestriel = caAnnuel * 0.22 / 4; // ~22% for micro-BNC
  
  // Optimization capacity
  const capaciteOptimisation = Math.max(0, beneficeNet * 0.1);

  const healthStatus = calculateHealthStatus(profile);

  if (!hasRealData || !profile?.isSelfEmployed) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            Santé financière
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">
              Activité professionnelle non déclarée
            </p>
            <p className="text-sm text-muted-foreground/70 mb-4 max-w-xs">
              Complétez votre profil professionnel pour suivre votre activité et optimiser votre fiscalité.
            </p>
            <Button onClick={() => navigate('/pro/onboarding')} size="sm">
              Configurer mon activité
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            Santé financière
          </CardTitle>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[healthStatus.color]}`}>
            {healthStatus.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{healthStatus.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Score de santé</span>
            <span className="font-medium">{healthStatus.score}/100</span>
          </div>
          <Progress value={healthStatus.score} className="h-2" />
        </div>

        {/* Main metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">CA mensuel</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(caMensuel)}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-info" />
              <span className="text-xs text-muted-foreground">Trésorerie</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(tresorerieEstimee)}</p>
          </div>
        </div>

        {/* Upcoming charges */}
        <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm">Charges à venir (trimestre)</span>
            </div>
            <span className="text-lg font-bold text-warning">
              {formatCurrency(urssafTrimestriel)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">URSSAF + cotisations sociales</p>
        </div>

        {/* Optimization potential */}
        <div className="p-3 rounded-lg bg-success/5 border border-success/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-success" />
              <span className="text-sm">Capacité d'optimisation</span>
            </div>
            <span className="text-lg font-bold text-success">
              +{formatCurrency(capaciteOptimisation)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Potentiel d'économie fiscale annuelle</p>
        </div>

        {/* Quick actions */}
        <Button 
          variant="ghost" 
          className="w-full justify-center text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/pro/revenue')}
        >
          Voir le détail financier
        </Button>
      </CardContent>
    </Card>
  );
};
