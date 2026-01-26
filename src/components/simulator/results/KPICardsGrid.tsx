import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, TrendingDown, Wallet, Percent, Calculator, 
  PiggyBank, Building2, Target, Shield, Info, ArrowUp, ArrowDown,
  Euro, CalendarDays, BarChart3
} from 'lucide-react';
import { formatCurrency } from '@/data/mockData';
import { SimulationResults } from '@/lib/realEstateTypes';

interface KPICardsGridProps {
  results: SimulationResults;
  projectType: 'LOCATIF' | 'RP';
  acquisition: {
    price_net_seller: number;
    total_project_cost?: number;
  };
  financing: {
    down_payment: number;
    loan_amount: number;
    monthly_payment: number;
  };
  rental?: {
    rent_monthly: number;
  };
}

interface KPICardData {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  tooltip: string;
  status?: 'excellent' | 'good' | 'warning' | 'bad';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const getStatusColor = (status?: KPICardData['status']) => {
  switch (status) {
    case 'excellent': return 'border-emerald-500/50 bg-emerald-500/5';
    case 'good': return 'border-success/50 bg-success/5';
    case 'warning': return 'border-warning/50 bg-warning/5';
    case 'bad': return 'border-destructive/50 bg-destructive/5';
    default: return '';
  }
};

const getStatusBadge = (status?: KPICardData['status']) => {
  switch (status) {
    case 'excellent': return <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0">Excellent</Badge>;
    case 'good': return <Badge className="bg-success text-success-foreground text-[10px] px-1.5 py-0">Bon</Badge>;
    case 'warning': return <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0">Attention</Badge>;
    case 'bad': return <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0">Critique</Badge>;
    default: return null;
  }
};

const KPICard: React.FC<KPICardData> = ({ 
  title, value, subtitle, icon, tooltip, status, trend, trendValue 
}) => (
  <Card className={`relative overflow-hidden ${getStatusColor(status)}`}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg bg-muted/50">
          {icon}
        </div>
        <div className="flex items-center gap-1">
          {getStatusBadge(status)}
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center text-xs ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>
              {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : trend === 'down' ? <ArrowDown className="h-3 w-3" /> : null}
              {trendValue}
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </CardContent>
  </Card>
);

export const KPICardsGrid: React.FC<KPICardsGridProps> = ({
  results,
  projectType,
  acquisition,
  financing,
  rental
}) => {
  const r = results;
  
  // Calculate additional metrics
  const roi = financing.down_payment > 0 
    ? ((r.net_patrimony - financing.down_payment) / financing.down_payment * 100) 
    : 0;
  
  const leverageRatio = acquisition.price_net_seller > 0 
    ? (financing.loan_amount / acquisition.price_net_seller * 100) 
    : 0;
  
  const annualCashflow = (r.monthly_cashflow_after_tax || 0) * 12;
  const cashOnCash = financing.down_payment > 0 
    ? (annualCashflow / financing.down_payment * 100) 
    : 0;

  const locatifKPIs: KPICardData[] = [
    {
      title: 'Rentabilité brute',
      value: `${(r.gross_yield || 0).toFixed(2)}%`,
      subtitle: 'Loyer annuel / Coût total',
      icon: <Percent className="h-5 w-5 text-primary" />,
      tooltip: 'Ratio entre le loyer annuel brut et le coût total du projet. Premier indicateur de comparaison entre biens.',
      status: r.gross_yield >= 7 ? 'excellent' : r.gross_yield >= 5 ? 'good' : r.gross_yield >= 3 ? 'warning' : 'bad',
    },
    {
      title: 'Rentabilité nette',
      value: `${(r.net_yield || 0).toFixed(2)}%`,
      subtitle: 'Après charges, avant impôts',
      icon: <TrendingUp className="h-5 w-5 text-chart-2" />,
      tooltip: 'Rentabilité après déduction des charges d\'exploitation (taxe foncière, copro, assurance, gestion) mais avant fiscalité.',
      status: r.net_yield >= 5 ? 'excellent' : r.net_yield >= 3.5 ? 'good' : r.net_yield >= 2 ? 'warning' : 'bad',
    },
    {
      title: 'Rentabilité nette-nette',
      value: `${(r.net_net_yield || 0).toFixed(2)}%`,
      subtitle: 'Après impôts',
      icon: <BarChart3 className="h-5 w-5 text-chart-3" />,
      tooltip: 'Rentabilité réelle après toutes charges et fiscalité. C\'est le rendement effectif de votre investissement.',
      status: r.net_net_yield >= 4 ? 'excellent' : r.net_net_yield >= 2.5 ? 'good' : r.net_net_yield >= 1 ? 'warning' : 'bad',
    },
    {
      title: 'Cashflow mensuel',
      value: formatCurrency(r.monthly_cashflow_after_tax || 0),
      subtitle: 'Après impôts',
      icon: <Wallet className="h-5 w-5 text-primary" />,
      tooltip: 'Somme restante chaque mois après toutes les dépenses (crédit, charges, impôts). Un cashflow positif signifie autofinancement.',
      status: r.monthly_cashflow_after_tax >= 100 ? 'excellent' : r.monthly_cashflow_after_tax >= 0 ? 'good' : r.monthly_cashflow_after_tax >= -200 ? 'warning' : 'bad',
    },
    {
      title: 'DSCR',
      value: (r.dscr || 0).toFixed(2),
      subtitle: 'Ratio couverture dette',
      icon: <Shield className="h-5 w-5 text-warning" />,
      tooltip: 'Debt Service Coverage Ratio : NOI / Annuité crédit. Un ratio > 1.2 est généralement exigé par les banques.',
      status: r.dscr >= 1.3 ? 'excellent' : r.dscr >= 1.2 ? 'good' : r.dscr >= 1 ? 'warning' : 'bad',
    },
    {
      title: 'TRI (IRR)',
      value: `${(r.irr || 0).toFixed(1)}%`,
      subtitle: 'Sur l\'horizon',
      icon: <Calculator className="h-5 w-5 text-chart-4" />,
      tooltip: 'Taux de Rentabilité Interne : mesure la performance globale incluant plus-value, cashflows et effet de levier.',
      status: r.irr >= 10 ? 'excellent' : r.irr >= 6 ? 'good' : r.irr >= 3 ? 'warning' : 'bad',
    },
    {
      title: 'Cash-on-Cash',
      value: `${cashOnCash.toFixed(1)}%`,
      subtitle: 'Rendement sur apport',
      icon: <Euro className="h-5 w-5 text-success" />,
      tooltip: 'Rendement annuel sur votre apport personnel (cashflow annuel / apport). Mesure l\'efficacité de votre capital.',
      status: cashOnCash >= 10 ? 'excellent' : cashOnCash >= 5 ? 'good' : cashOnCash >= 0 ? 'warning' : 'bad',
    },
    {
      title: 'Patrimoine net',
      value: formatCurrency(r.net_patrimony || 0),
      subtitle: 'À horizon',
      icon: <Building2 className="h-5 w-5 text-primary" />,
      tooltip: 'Valeur estimée du bien à l\'horizon moins dette restante plus cashflows cumulés. C\'est votre enrichissement total.',
      status: r.net_patrimony > financing.down_payment * 2 ? 'excellent' : r.net_patrimony > financing.down_payment ? 'good' : 'warning',
    },
    {
      title: 'Effet de levier',
      value: `${leverageRatio.toFixed(0)}%`,
      subtitle: 'LTV ratio',
      icon: <TrendingUp className="h-5 w-5 text-chart-5" />,
      tooltip: 'Loan-to-Value : pourcentage du bien financé par emprunt. Un levier élevé amplifie les gains mais aussi les risques.',
      status: leverageRatio <= 80 ? 'good' : leverageRatio <= 90 ? 'warning' : 'bad',
    },
    {
      title: 'Effort d\'épargne',
      value: formatCurrency(r.monthly_effort || 0),
      subtitle: 'Mensuel',
      icon: <PiggyBank className="h-5 w-5 text-chart-4" />,
      tooltip: 'Si cashflow négatif, c\'est la somme à sortir chaque mois. Si positif, c\'est votre marge de sécurité.',
      status: r.monthly_effort <= 0 ? 'excellent' : r.monthly_effort <= 200 ? 'good' : r.monthly_effort <= 400 ? 'warning' : 'bad',
    },
    {
      title: 'Loyer seuil',
      value: formatCurrency(r.break_even_rent || 0),
      subtitle: 'Break-even',
      icon: <Target className="h-5 w-5 text-warning" />,
      tooltip: 'Loyer minimum pour atteindre l\'équilibre (cashflow = 0). Plus votre loyer actuel est au-dessus, plus vous avez de marge.',
      status: rental && r.break_even_rent < rental.rent_monthly * 0.8 ? 'excellent' : rental && r.break_even_rent < rental.rent_monthly ? 'good' : 'warning',
    },
    {
      title: 'ROI total',
      value: `${roi.toFixed(0)}%`,
      subtitle: 'Sur apport initial',
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
      tooltip: 'Retour sur investissement : (Patrimoine final - Apport) / Apport. Mesure votre multiplication de capital.',
      status: roi >= 100 ? 'excellent' : roi >= 50 ? 'good' : roi >= 0 ? 'warning' : 'bad',
    },
  ];

  const rpKPIs: KPICardData[] = [
    {
      title: 'Coût mensuel total',
      value: formatCurrency(financing.monthly_payment || 0),
      subtitle: 'Crédit + charges',
      icon: <Wallet className="h-5 w-5 text-primary" />,
      tooltip: 'Coût mensuel total de votre résidence principale incluant crédit et charges récurrentes.',
      status: undefined,
    },
    {
      title: 'Patrimoine net',
      value: formatCurrency(r.net_patrimony || 0),
      subtitle: 'À horizon',
      icon: <Building2 className="h-5 w-5 text-primary" />,
      tooltip: 'Valeur estimée du bien moins la dette restante. C\'est votre capital immobilier net.',
      status: r.net_patrimony > financing.down_payment * 1.5 ? 'good' : 'warning',
    },
    {
      title: 'Effet de levier',
      value: `${leverageRatio.toFixed(0)}%`,
      subtitle: 'LTV ratio',
      icon: <TrendingUp className="h-5 w-5 text-chart-5" />,
      tooltip: 'Part du bien financée à crédit. Un LTV > 80% peut nécessiter une garantie supplémentaire.',
      status: leverageRatio <= 80 ? 'good' : leverageRatio <= 90 ? 'warning' : 'bad',
    },
    {
      title: 'Enrichissement',
      value: `${roi.toFixed(0)}%`,
      subtitle: 'Sur apport',
      icon: <TrendingUp className="h-5 w-5 text-success" />,
      tooltip: 'Multiplication de votre apport initial grâce à la valorisation du bien et au remboursement du crédit.',
      status: roi >= 50 ? 'good' : roi >= 0 ? 'warning' : 'bad',
    },
  ];

  const kpis = projectType === 'LOCATIF' ? locatifKPIs : rpKPIs;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  );
};

export default KPICardsGrid;
