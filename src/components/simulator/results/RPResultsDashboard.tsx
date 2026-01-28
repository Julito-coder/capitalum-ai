import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Wallet, Home, TrendingUp, Shield, Users, Euro, 
  Calculator, PiggyBank, AlertTriangle, CheckCircle2, Info,
  Building2, Percent, BarChart3
} from 'lucide-react';
import { formatCurrency } from '@/data/mockData';
import { FullProjectData, SimulationResults, PatrimonyYear } from '@/lib/realEstateTypes';
import { AmortizationChart } from './AmortizationChart';
import { PatrimonyEvolutionChart } from './PatrimonyEvolutionChart';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, Legend, 
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

interface RPResultsDashboardProps {
  data: FullProjectData;
  results: SimulationResults;
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

export const RPResultsDashboard: React.FC<RPResultsDashboardProps> = ({ data, results }) => {
  const { project, acquisition, financing, operating_costs, owner_occupier } = data;
  
  // Calculate RP-specific metrics
  const totalProjectCost = acquisition.total_project_cost || 
    (acquisition.price_net_seller + acquisition.agency_fee_amount + acquisition.notary_fee_amount + acquisition.works_amount);
  
  const monthlyPaymentTotal = financing.monthly_payment || 0;
  
  // Get household data from owner_occupier or defaults
  const householdIncome = owner_occupier?.avoided_rent_monthly 
    ? (owner_occupier.avoided_rent_monthly * 4) // Rough estimate if not stored
    : 5000;
  
  // Property tax and charges monthly
  const propertyTaxMonthly = (operating_costs.property_tax_annual || 0) / 12;
  const chargesMonthly = (operating_costs.condo_nonrecoverable_annual || 0) / 12;
  const insuranceMonthly = (operating_costs.insurance_annual || 0) / 12;
  
  const totalHousingCostMonthly = monthlyPaymentTotal + propertyTaxMonthly + chargesMonthly + insuranceMonthly;
  
  // DTI calculation (using monthly payment vs estimated income)
  const estimatedMonthlyIncome = householdIncome;
  const dti = estimatedMonthlyIncome > 0 ? (monthlyPaymentTotal / estimatedMonthlyIncome) * 100 : 0;
  
  // Reste à vivre
  const resteAVivre = estimatedMonthlyIncome - totalHousingCostMonthly;
  
  // Effort mensuel (vs avoided rent if RP)
  const avoidedRent = owner_occupier?.avoided_rent_monthly || 0;
  const monthlyEffort = totalHousingCostMonthly - avoidedRent;
  
  // LTV ratio
  const ltv = acquisition.price_net_seller > 0 
    ? (financing.loan_amount / acquisition.price_net_seller) * 100 
    : 0;
  
  // Net patrimony at horizon
  const horizonYears = project.horizon_years || 20;
  const lastPatrimony = results.patrimony_series?.[results.patrimony_series.length - 1];
  const netPatrimony = lastPatrimony?.net_patrimony || results.net_patrimony || 0;
  const propertyValueAtHorizon = lastPatrimony?.property_value || acquisition.price_net_seller;
  const remainingDebt = lastPatrimony?.remaining_debt || 0;
  
  // Cost of credit
  const totalCreditCost = (financing.total_interest || 0) + (financing.total_insurance || 0);
  
  // Budget breakdown data for pie chart
  const budgetData = [
    { name: 'Mensualité crédit', value: monthlyPaymentTotal, color: 'hsl(var(--primary))' },
    { name: 'Taxe foncière', value: propertyTaxMonthly, color: 'hsl(var(--warning))' },
    { name: 'Charges copro', value: chargesMonthly, color: 'hsl(var(--chart-2))' },
    { name: 'Assurance', value: insuranceMonthly, color: 'hsl(var(--chart-3))' },
  ].filter(item => item.value > 0);

  // Stress test scenarios
  const stressScenarios = [
    {
      name: 'Base',
      dti: dti,
      resteAVivre: resteAVivre,
      monthlyPayment: monthlyPaymentTotal,
    },
    {
      name: 'Taux +1%',
      dti: dti * 1.08, // Approximation
      resteAVivre: resteAVivre * 0.92,
      monthlyPayment: monthlyPaymentTotal * 1.08,
    },
    {
      name: 'Charges +20%',
      dti: dti + 2,
      resteAVivre: resteAVivre - (chargesMonthly * 0.2),
      monthlyPayment: monthlyPaymentTotal,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <RPKPICard
          title="Mensualité totale"
          value={formatCurrency(monthlyPaymentTotal)}
          subtitle="Crédit + assurance"
          icon={<Wallet className="h-5 w-5 text-primary" />}
          tooltip="Mensualité de crédit incluant l'assurance emprunteur."
          status="neutral"
        />
        <RPKPICard
          title="Coût logement/mois"
          value={formatCurrency(totalHousingCostMonthly)}
          subtitle="Crédit + charges + taxes"
          icon={<Home className="h-5 w-5 text-chart-2" />}
          tooltip="Coût mensuel total du logement incluant crédit, charges de copropriété, taxe foncière et assurance."
          status="neutral"
        />
        <RPKPICard
          title="Taux d'endettement"
          value={`${dti.toFixed(1)}%`}
          subtitle={dti <= 35 ? "Dans les normes" : "Hors normes HCSF"}
          icon={<Percent className="h-5 w-5 text-warning" />}
          tooltip="Ratio entre la mensualité de crédit et les revenus du ménage. Les banques appliquent généralement un seuil de 35%."
          status={dti <= 30 ? 'success' : dti <= 35 ? 'warning' : 'danger'}
        />
        <RPKPICard
          title="Reste à vivre"
          value={formatCurrency(resteAVivre)}
          subtitle="Après charges logement"
          icon={<PiggyBank className="h-5 w-5 text-success" />}
          tooltip="Revenus restants après paiement de toutes les charges liées au logement. Indicateur clé pour les banques."
          status={resteAVivre >= 1500 ? 'success' : resteAVivre >= 1000 ? 'warning' : 'danger'}
        />
        <RPKPICard
          title="Effort mensuel"
          value={formatCurrency(Math.abs(monthlyEffort))}
          subtitle={monthlyEffort > 0 ? "vs loyer évité" : "Économie vs location"}
          icon={<Calculator className="h-5 w-5 text-chart-4" />}
          tooltip="Différence entre le coût total du logement et le loyer que vous payeriez en location."
          status={monthlyEffort <= 200 ? 'success' : monthlyEffort <= 500 ? 'warning' : 'neutral'}
        />
        <RPKPICard
          title="LTV (Loan-to-Value)"
          value={`${ltv.toFixed(0)}%`}
          subtitle="Part financée"
          icon={<TrendingUp className="h-5 w-5 text-chart-5" />}
          tooltip="Pourcentage du bien financé par emprunt. Un LTV élevé (>80%) peut nécessiter une garantie supplémentaire."
          status={ltv <= 80 ? 'success' : ltv <= 90 ? 'warning' : 'danger'}
        />
        <RPKPICard
          title="Patrimoine net"
          value={formatCurrency(netPatrimony)}
          subtitle={`À ${horizonYears} ans`}
          icon={<Building2 className="h-5 w-5 text-primary" />}
          tooltip="Valeur estimée du bien moins la dette restante à l'horizon de détention."
          status={netPatrimony > financing.down_payment * 1.5 ? 'success' : 'warning'}
        />
        <RPKPICard
          title="Coût total crédit"
          value={formatCurrency(totalCreditCost)}
          subtitle="Intérêts + assurance"
          icon={<Euro className="h-5 w-5 text-destructive" />}
          tooltip="Coût total du crédit sur toute sa durée, incluant intérêts et assurance."
          status="neutral"
        />
      </div>

      {/* Viability badge */}
      {dti > 35 && (
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

      {dti <= 35 && resteAVivre >= 1000 && (
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
                    label={({ name, value }) => `${formatCurrency(value)}`}
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
                <span className="text-primary">{formatCurrency(totalHousingCostMonthly)}</span>
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
                <span className={`font-medium ${35 - dti > 5 ? 'text-success' : 'text-warning'}`}>
                  {(35 - dti).toFixed(1)} pts
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acquisition summary */}
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
              <span>{formatCurrency(totalProjectCost)}</span>
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
