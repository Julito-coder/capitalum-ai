import { Wallet, TrendingDown, Percent, PiggyBank, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface CurrentSituationCardProps {
  profile: UserProfile | null;
  hasRealData: boolean;
}

interface SituationStatus {
  label: string;
  color: 'success' | 'warning' | 'critical';
  description: string;
}

const getSituationStatus = (savingsRate: number): SituationStatus => {
  if (savingsRate >= 20) {
    return { label: 'Excellente', color: 'success', description: 'Capacité d\'épargne optimale' };
  }
  if (savingsRate >= 10) {
    return { label: 'Confortable', color: 'success', description: 'Marge de manœuvre saine' };
  }
  if (savingsRate >= 5) {
    return { label: 'Sous tension', color: 'warning', description: 'Épargne limitée' };
  }
  return { label: 'Critique', color: 'critical', description: 'Attention aux dépenses' };
};

const statusColors = {
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
};

export const CurrentSituationCard = ({ profile, hasRealData }: CurrentSituationCardProps) => {
  const navigate = useNavigate();

  // Calculate metrics from profile
  const monthlyIncome = profile?.isEmployee 
    ? profile.netMonthlySalary 
    : profile?.isSelfEmployed 
      ? (profile.annualRevenueHt - profile.socialChargesPaid) / 12
      : profile?.isRetired 
        ? profile.mainPensionAnnual / 12
        : 0;

  // Estimate monthly charges (simplified)
  const monthlyCharges = profile?.isSelfEmployed
    ? (profile.officeRent + profile.vehicleExpenses + profile.professionalSupplies) / 12
    : 0;

  // Calculate savings capacity (simplified estimate)
  const estimatedLivingExpenses = monthlyIncome * 0.6; // Rough estimate
  const savingsCapacity = Math.max(0, monthlyIncome - estimatedLivingExpenses - monthlyCharges);
  const savingsRate = monthlyIncome > 0 ? (savingsCapacity / monthlyIncome) * 100 : 0;

  // Effective tax rate (simplified)
  const annualIncome = monthlyIncome * 12;
  let estimatedTax = 0;
  if (annualIncome > 11294) estimatedTax += (Math.min(annualIncome, 28797) - 11294) * 0.11;
  if (annualIncome > 28797) estimatedTax += (Math.min(annualIncome, 82341) - 28797) * 0.30;
  if (annualIncome > 82341) estimatedTax += (Math.min(annualIncome, 177106) - 82341) * 0.41;
  if (annualIncome > 177106) estimatedTax += (annualIncome - 177106) * 0.45;
  const effectiveTaxRate = annualIncome > 0 ? (estimatedTax / annualIncome) * 100 : 0;

  // Reste à vivre
  const resteAVivre = monthlyIncome - monthlyCharges - (estimatedTax / 12);

  const status = getSituationStatus(savingsRate);

  if (!hasRealData) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            Situation actuelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">
              Données manquantes
            </p>
            <p className="text-sm text-muted-foreground/70 mb-4 max-w-xs">
              Complétez votre profil pour visualiser votre situation financière personnalisée.
            </p>
            <Button onClick={() => navigate('/onboarding')} size="sm">
              Compléter mon profil
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
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            Situation actuelle
          </CardTitle>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status.color]}`}>
            {status.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{status.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Revenu net mensuel</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(monthlyIncome)}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Charges mensuelles</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(monthlyCharges + estimatedLivingExpenses)}</p>
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
            <div className="flex items-center gap-1 mb-1">
              <PiggyBank className="h-3.5 w-3.5 text-success" />
              <span className="text-xs text-muted-foreground">Capacité épargne</span>
            </div>
            <p className="text-base font-semibold text-success">{formatCurrency(savingsCapacity)}/mois</p>
          </div>
          
          <div className="p-3 rounded-lg bg-info/5 border border-info/20">
            <div className="flex items-center gap-1 mb-1">
              <Percent className="h-3.5 w-3.5 text-info" />
              <span className="text-xs text-muted-foreground">Taux imposition</span>
            </div>
            <p className="text-base font-semibold text-info">{effectiveTaxRate.toFixed(1)}%</p>
          </div>
          
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-1 mb-1">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Reste à vivre</span>
            </div>
            <p className="text-base font-semibold text-primary">{formatCurrency(resteAVivre)}</p>
          </div>
        </div>

        {/* Info tooltip */}
        <p className="text-xs text-muted-foreground/70 italic">
          💡 Ces estimations sont basées sur votre profil. Complétez vos données pour plus de précision.
        </p>
      </CardContent>
    </Card>
  );
};
