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
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
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

  const monthlyCharges = profile?.isSelfEmployed
    ? (profile.officeRent + profile.vehicleExpenses + profile.professionalSupplies) / 12
    : 0;

  const estimatedLivingExpenses = monthlyIncome * 0.6;
  const savingsCapacity = Math.max(0, monthlyIncome - estimatedLivingExpenses - monthlyCharges);
  const savingsRate = monthlyIncome > 0 ? (savingsCapacity / monthlyIncome) * 100 : 0;

  const annualIncome = monthlyIncome * 12;
  let estimatedTax = 0;
  if (annualIncome > 11294) estimatedTax += (Math.min(annualIncome, 28797) - 11294) * 0.11;
  if (annualIncome > 28797) estimatedTax += (Math.min(annualIncome, 82341) - 28797) * 0.30;
  if (annualIncome > 82341) estimatedTax += (Math.min(annualIncome, 177106) - 82341) * 0.41;
  if (annualIncome > 177106) estimatedTax += (annualIncome - 177106) * 0.45;
  const effectiveTaxRate = annualIncome > 0 ? (estimatedTax / annualIncome) * 100 : 0;

  const resteAVivre = monthlyIncome - monthlyCharges - (estimatedTax / 12);
  const status = getSituationStatus(savingsRate);

  if (!hasRealData) {
    return (
      <Card className="border border-border/30 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
            <div className="p-4 rounded-2xl bg-muted/30 mb-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">
              Données manquantes
            </p>
            <p className="text-sm text-muted-foreground mb-5 max-w-[280px]">
              Complétez votre profil pour voir votre situation financière.
            </p>
            <Button 
              onClick={() => navigate('/onboarding')} 
              size="lg"
              className="min-h-[44px] px-6"
            >
              Compléter mon profil
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/30 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Header with status badge */}
      <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold">
                Situation actuelle
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                {status.description}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0 ${statusColors[status.color]}`}>
            {status.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
        {/* Primary metric - large and prominent for mobile */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Revenu net mensuel</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {formatCurrency(monthlyIncome)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Secondary metrics grid - 2 columns on mobile */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/20">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Charges</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(monthlyCharges + estimatedLivingExpenses)}</p>
          </div>
          
          <div className="p-3.5 rounded-xl bg-success/5 border border-success/15">
            <div className="flex items-center gap-2 mb-1.5">
              <PiggyBank className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Épargne</span>
            </div>
            <p className="text-lg font-semibold text-success">{formatCurrency(savingsCapacity)}</p>
          </div>
        </div>

        {/* Tertiary metrics - compact row */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/10">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-info" />
            <span className="text-xs text-muted-foreground">Taux imposition</span>
          </div>
          <span className="text-sm font-semibold text-info">{effectiveTaxRate.toFixed(1)}%</span>
        </div>

        {/* Info footer */}
        <p className="text-[11px] text-muted-foreground/60 text-center pt-1">
          💡 Estimations basées sur votre profil
        </p>
      </CardContent>
    </Card>
  );
};
