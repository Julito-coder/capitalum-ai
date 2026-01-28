import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Wallet, Home, TrendingUp, PiggyBank, Euro, 
  Calculator, AlertTriangle, CheckCircle2, Info,
  Building2, Percent
} from 'lucide-react';
import { formatCurrency } from '@/data/mockData';
import { FullProjectData, SimulationResults } from '@/lib/realEstateTypes';
import { RPMetrics, HouseholdData, calculateRPMetrics, getDebtRatioStatus, getResteAVivreStatus } from '@/lib/rpCalculations';
import { AmortizationChart } from './AmortizationChart';
import { PatrimonyEvolutionChart } from './PatrimonyEvolutionChart';
import { 
  ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend
} from 'recharts';

interface RPResultsDashboardProps {
  data: FullProjectData;
  results: SimulationResults;
  household: HouseholdData;
}

// KPI Card component for RP
interface RPKPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  tooltip: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
}

const RPKPICard: React.FC<RPKPICardProps> = ({ title, value, subtitle, icon, tooltip, status }) => {
  const statusClasses = {
    success: 'border-success/50 bg-success/5',
    warning: 'border-warning/50 bg-warning/5',
    danger: 'border-destructive/50 bg-destructive/5',
    neutral: '',
  };

  const statusBadges = {
    success: <Badge className="bg-success text-success-foreground text-[10px] px-1.5 py-0">Excellent</Badge>,
    warning: <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0">À surveiller</Badge>,
    danger: <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0">Attention</Badge>,
    neutral: null,
  };

  return (
    <Card className={`relative overflow-hidden ${statusClasses[status || 'neutral']}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-muted/50">
            {icon}
          </div>
          <div className="flex items-center gap-1">
            {status && statusBadges[status]}
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
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export const RPResultsDashboard: React.FC<RPResultsDashboardProps> = ({ data, results, household }) => {
  const { project, acquisition, financing, operating_costs } = data;
  
  // Calculate all metrics using centralized function
  const metrics = calculateRPMetrics(data, household);
  
  // Budget breakdown data for pie chart
  const budgetData = [
    { name: 'Mensualité crédit', value: metrics.monthlyPayment, color: 'hsl(var(--primary))' },
    { name: 'Taxe foncière', value: metrics.monthlyPropertyTax, color: 'hsl(var(--warning))' },
    { name: 'Charges copro', value: metrics.monthlyCondoCharges, color: 'hsl(var(--chart-2))' },
    { name: 'Assurance', value: metrics.monthlyInsurance, color: 'hsl(var(--chart-3))' },
  ].filter(item => item.value > 0);

  // Stress test scenarios
  const horizonYears = project.horizon_years || 20;
  const debtRatioStatus = getDebtRatioStatus(metrics.debtRatio);
  const resteAVivreStatus = getResteAVivreStatus(metrics.resteAVivre, metrics.memberCount);
  
  const stressScenarios = [
    {
      name: 'Base',
      dti: metrics.debtRatio,
    },
    {
      name: 'Taux +1%',
      dti: metrics.debtRatio * 1.08,
    },
    {
      name: 'Charges +20%',
      dti: metrics.debtRatio + 2,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Analyse du ménage</p>
              <p className="text-lg font-semibold">
                {metrics.memberCount} personne{metrics.memberCount > 1 ? 's' : ''} — Revenus : {formatCurrency(metrics.totalHouseholdIncome)}/mois
              </p>
            </div>
            <Badge className={`text-sm ${
              metrics.statusLevel === 'success' ? 'bg-success text-success-foreground' :
              metrics.statusLevel === 'warning' ? 'bg-warning text-warning-foreground' :
              'bg-destructive text-destructive-foreground'
            }`}>
              {metrics.statusMessage}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <RPKPICard
          title="Mensualité totale"
          value={formatCurrency(metrics.monthlyPayment)}
          subtitle="Crédit + assurance"
          icon={<Wallet className="h-5 w-5 text-primary" />}
          tooltip="Mensualité de crédit incluant l'assurance emprunteur."
          status="neutral"
        />
        <RPKPICard
          title="Coût logement/mois"
          value={formatCurrency(metrics.totalHousingCostMonthly)}
          subtitle="Crédit + charges + taxes"
          icon={<Home className="h-5 w-5 text-chart-2" />}
          tooltip="Coût mensuel total du logement incluant crédit, charges de copropriété, taxe foncière et assurance."
          status="neutral"
        />
        <RPKPICard
          title="Taux d'endettement"
          value={`${metrics.debtRatio.toFixed(1)}%`}
          subtitle={metrics.debtRatio <= 35 ? "Dans les normes HCSF" : "Hors normes HCSF"}
          icon={<Percent className="h-5 w-5 text-warning" />}
          tooltip="Ratio entre les crédits totaux (existants + nouveau) et les revenus du ménage. Seuil HCSF : 35%."
          status={debtRatioStatus.status}
        />
        <RPKPICard
          title="Reste à vivre"
          value={formatCurrency(metrics.resteAVivre)}
          subtitle={`${formatCurrency(metrics.resteAVivre / metrics.memberCount)}/pers.`}
          icon={<PiggyBank className="h-5 w-5 text-success" />}
          tooltip="Revenus restants après paiement de tous les crédits. Indicateur clé pour les banques."
          status={resteAVivreStatus.status}
        />
        <RPKPICard
          title="Effort mensuel"
          value={formatCurrency(Math.abs(metrics.monthlyEffort))}
          subtitle={metrics.monthlyEffort > 0 ? "vs loyer évité" : "Économie vs location"}
          icon={<Calculator className="h-5 w-5 text-chart-4" />}
          tooltip="Différence entre le coût total du logement et le loyer que vous payeriez en location."
          status={metrics.monthlyEffort <= 200 ? 'success' : metrics.monthlyEffort <= 500 ? 'warning' : 'neutral'}
        />
        <RPKPICard
          title="LTV (Loan-to-Value)"
          value={`${metrics.ltv.toFixed(0)}%`}
          subtitle="Part financée"
          icon={<TrendingUp className="h-5 w-5 text-chart-5" />}
          tooltip="Pourcentage du bien financé par emprunt. Un LTV élevé (>80%) peut nécessiter une garantie supplémentaire."
          status={metrics.ltv <= 80 ? 'success' : metrics.ltv <= 90 ? 'warning' : 'danger'}
        />
        <RPKPICard
          title="Patrimoine net"
          value={formatCurrency(metrics.netPatrimonyAtHorizon)}
          subtitle={`À ${horizonYears} ans`}
          icon={<Building2 className="h-5 w-5 text-primary" />}
          tooltip="Valeur estimée du bien moins la dette restante à l'horizon de détention."
          status={metrics.netPatrimonyAtHorizon > financing.down_payment * 1.5 ? 'success' : 'warning'}
        />
        <RPKPICard
          title="Coût total crédit"
          value={formatCurrency(metrics.totalCreditCost)}
          subtitle="Intérêts + assurance"
          icon={<Euro className="h-5 w-5 text-destructive" />}
          tooltip="Coût total du crédit sur toute sa durée, incluant intérêts et assurance."
          status="neutral"
        />
      </div>

      {/* Viability badges */}
      {metrics.debtRatio > 35 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="text-sm">
              <span className="block font-medium">Taux d'endettement supérieur à 35%</span>
              <span className="text-muted-foreground">Ce dossier pourrait être refusé selon les critères HCSF. Envisagez d'augmenter l'apport ou la durée du prêt.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {metrics.debtRatio <= 35 && metrics.resteAVivre >= 400 * metrics.memberCount && (
        <Card className="border-success/50 bg-success/5">
          <CardContent className="py-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div className="text-sm">
              <span className="block font-medium">Dossier bancaire équilibré</span>
              <span className="text-muted-foreground">Le taux d'endettement et le reste à vivre sont dans les normes bancaires.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Répartition du budget logement</CardTitle>
            <CardDescription>Coût mensuel détaillé</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={budgetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ value }) => formatCurrency(value)}
                    labelLine={false}
                  >
                    {budgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px' 
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm font-medium">
                <span>Total mensuel</span>
                <span className="text-primary">{formatCurrency(metrics.totalHousingCostMonthly)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Analyse solvabilité banque</CardTitle>
            <CardDescription>Scénarios de stress test</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stressScenarios} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <RechartsTooltip 
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px' 
                    }}
                  />
                  <Bar dataKey="dti" fill="hsl(var(--primary))" name="Taux d'endettement" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seuil HCSF</span>
                <span className="font-medium text-warning">35%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marge de sécurité</span>
                <span className={`font-medium ${35 - metrics.debtRatio > 5 ? 'text-success' : 'text-warning'}`}>
                  {(35 - metrics.debtRatio).toFixed(1)} pts
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acquisition & Financing summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Budget d'acquisition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Prix net vendeur</span><span className="font-medium">{formatCurrency(acquisition.price_net_seller)}</span></div>
            <div className="flex justify-between"><span>Frais d'agence</span><span>{formatCurrency(acquisition.agency_fee_amount)}</span></div>
            <div className="flex justify-between"><span>Frais de notaire</span><span>{formatCurrency(acquisition.notary_fee_amount)}</span></div>
            {acquisition.works_amount > 0 && <div className="flex justify-between"><span>Travaux</span><span>{formatCurrency(acquisition.works_amount)}</span></div>}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Coût total</span>
              <span>{formatCurrency(metrics.totalProjectCost)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Structure de financement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Apport personnel</span><span className="font-medium">{formatCurrency(financing.down_payment)}</span></div>
            <div className="flex justify-between"><span>Montant emprunté</span><span>{formatCurrency(financing.loan_amount)}</span></div>
            <div className="flex justify-between"><span>Durée</span><span>{financing.duration_months / 12} ans</span></div>
            <div className="flex justify-between"><span>Taux nominal</span><span>{financing.nominal_rate}%</span></div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Mensualité</span>
              <span>{formatCurrency(financing.monthly_payment)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Amortization chart */}
      <AmortizationChart 
        amortizationTable={financing.amortization_table || []}
        loanAmount={financing.loan_amount}
        totalInterest={financing.total_interest || 0}
        totalInsurance={financing.total_insurance || 0}
      />

      {/* Patrimony evolution */}
      <PatrimonyEvolutionChart 
        patrimonySeries={results.patrimony_series || []}
        downPayment={financing.down_payment}
      />
    </div>
  );
};

export default RPResultsDashboard;
