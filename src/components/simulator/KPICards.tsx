import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldTooltip, FIELD_TOOLTIPS } from './FieldTooltip';
import { TrendBadge } from './ProjectStatusBadge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendSuffix?: string;
  tooltipKey?: keyof typeof FIELD_TOOLTIPS;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export const KPICard = ({
  title,
  value,
  subtitle,
  trend,
  trendSuffix = '',
  tooltipKey,
  variant = 'default',
  icon: Icon,
  className
}: KPICardProps) => {
  const tooltip = tooltipKey ? FIELD_TOOLTIPS[tooltipKey] : undefined;

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      variant === 'success' && "border-green-500/30 bg-green-500/5",
      variant === 'warning' && "border-yellow-500/30 bg-yellow-500/5",
      variant === 'danger' && "border-red-500/30 bg-red-500/5",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm text-muted-foreground">{title}</span>
              {tooltip && <FieldTooltip data={tooltip} />}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-2xl font-bold",
                variant === 'success' && "text-green-600",
                variant === 'warning' && "text-yellow-600",
                variant === 'danger' && "text-red-600",
              )}>
                {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
              </span>
              {trend !== undefined && (
                <TrendBadge value={trend} suffix={trendSuffix} />
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "p-2 rounded-lg",
              variant === 'default' && "bg-primary/10 text-primary",
              variant === 'success' && "bg-green-500/10 text-green-600",
              variant === 'warning' && "bg-yellow-500/10 text-yellow-600",
              variant === 'danger' && "bg-red-500/10 text-red-600",
            )}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Grid of KPIs for Locatif
interface LocatifKPIGridProps {
  results: {
    grossYield: number;
    netYield: number;
    netNetYield: number;
    monthlyCashflowBeforeTax: number;
    monthlyCashflowAfterTax: number;
    dscr: number;
    irr: number;
    netPatrimony: number;
    breakEvenRent: number;
    breakEvenPrice: number;
    breakEvenRate: number;
  };
  stressed?: {
    dscr: number;
    cashflow: number;
  };
  className?: string;
}

export const LocatifKPIGrid = ({ results, stressed, className }: LocatifKPIGridProps) => {
  const getCashflowVariant = (value: number) => {
    if (value >= 100) return 'success';
    if (value >= 0) return 'default';
    if (value >= -100) return 'warning';
    return 'danger';
  };

  const getDSCRVariant = (value: number) => {
    if (value >= 1.3) return 'success';
    if (value >= 1.1) return 'default';
    if (value >= 1.0) return 'warning';
    return 'danger';
  };

  return (
    <div className={cn("grid gap-4", className)}>
      {/* Rendements */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Rentabilité brute"
          value={`${results.grossYield.toFixed(2)}%`}
          tooltipKey="grossYield"
        />
        <KPICard
          title="Rentabilité nette"
          value={`${results.netYield.toFixed(2)}%`}
          tooltipKey="netYield"
        />
        <KPICard
          title="Rentabilité nette-nette"
          value={`${results.netNetYield.toFixed(2)}%`}
          tooltipKey="netNetYield"
        />
      </div>

      {/* Cashflow & DSCR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Cashflow avant impôts"
          value={`${results.monthlyCashflowBeforeTax >= 0 ? '+' : ''}${results.monthlyCashflowBeforeTax.toFixed(0)} €/mois`}
          tooltipKey="cashflowBeforeTax"
          variant={getCashflowVariant(results.monthlyCashflowBeforeTax)}
        />
        <KPICard
          title="Cashflow après impôts"
          value={`${results.monthlyCashflowAfterTax >= 0 ? '+' : ''}${results.monthlyCashflowAfterTax.toFixed(0)} €/mois`}
          tooltipKey="cashflowAfterTax"
          variant={getCashflowVariant(results.monthlyCashflowAfterTax)}
        />
        <KPICard
          title="DSCR"
          value={results.dscr.toFixed(2)}
          subtitle={results.dscr >= 1.2 ? "Excellent" : results.dscr >= 1.0 ? "Correct" : "Insuffisant"}
          tooltipKey="dscr"
          variant={getDSCRVariant(results.dscr)}
        />
        <KPICard
          title="TRI (IRR)"
          value={`${results.irr.toFixed(1)}%`}
          subtitle="Sur horizon de détention"
        />
      </div>

      {/* Patrimoine & Seuils */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Patrimoine net final"
          value={`${(results.netPatrimony / 1000).toFixed(0)}k €`}
          subtitle="Valeur - Dette + Cashflows"
        />
        <KPICard
          title="Seuil loyer"
          value={`${results.breakEvenRent.toFixed(0)} €/mois`}
          subtitle="Pour cashflow = 0"
          tooltipKey="breakEvenRent"
        />
        <KPICard
          title="Seuil prix"
          value={`${(results.breakEvenPrice / 1000).toFixed(0)}k €`}
          subtitle="Prix max rentable"
          tooltipKey="breakEvenPrice"
        />
        <KPICard
          title="Seuil taux"
          value={`${results.breakEvenRate.toFixed(2)}%`}
          subtitle="Taux max rentable"
        />
      </div>

      {/* Stress test results */}
      {stressed && (
        <div className="mt-4 p-4 rounded-lg border border-dashed border-orange-500/50 bg-orange-500/5">
          <h4 className="text-sm font-semibold mb-3 text-orange-600 flex items-center gap-2">
            📊 Stress Test Banque
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">DSCR stressé</span>
              <div className="text-xl font-bold">{stressed.dscr.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Cashflow stressé</span>
              <div className="text-xl font-bold">{stressed.cashflow.toFixed(0)} €/mois</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Grid of KPIs for RP
interface RPKPIGridProps {
  results: {
    monthlyPayment: number;
    totalCostOfOwnership: number;
    monthlyEffort: number;
    debtRatio: number;
    resteAVivre: number;
    equityAtHorizon: number;
    propertyValueAtHorizon: number;
    remainingDebtAtHorizon: number;
  };
  householdIncome: number;
  className?: string;
}

export const RPKPIGrid = ({ results, householdIncome, className }: RPKPIGridProps) => {
  const getDebtRatioVariant = (value: number) => {
    if (value <= 30) return 'success';
    if (value <= 35) return 'warning';
    return 'danger';
  };

  return (
    <div className={cn("grid gap-4", className)}>
      {/* Mensualités */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Mensualité totale"
          value={`${results.monthlyPayment.toFixed(0)} €`}
          subtitle="Capital + Intérêts + Assurance"
        />
        <KPICard
          title="Coût logement/an"
          value={`${results.totalCostOfOwnership.toFixed(0)} €`}
          subtitle="Mensualité + Charges"
        />
        <KPICard
          title="Effort mensuel"
          value={`${results.monthlyEffort.toFixed(0)} €`}
          subtitle="Mensualité - Loyer évité"
        />
      </div>

      {/* Ratios banque */}
      <div className="grid grid-cols-2 gap-4">
        <KPICard
          title="Taux d'endettement"
          value={`${results.debtRatio.toFixed(1)}%`}
          subtitle={results.debtRatio <= 35 ? "Dans les normes" : "Hors normes bancaires"}
          variant={getDebtRatioVariant(results.debtRatio)}
        />
        <KPICard
          title="Reste à vivre"
          value={`${results.resteAVivre.toFixed(0)} €/mois`}
          subtitle={`${((results.resteAVivre / householdIncome) * 100).toFixed(0)}% des revenus`}
          tooltipKey="resteAVivre"
          variant={results.resteAVivre >= 1000 ? 'success' : 'warning'}
        />
      </div>

      {/* Patrimoine */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Valeur à terme"
          value={`${(results.propertyValueAtHorizon / 1000).toFixed(0)}k €`}
          subtitle="Estimation fin de prêt"
        />
        <KPICard
          title="Dette restante"
          value={`${(results.remainingDebtAtHorizon / 1000).toFixed(0)}k €`}
        />
        <KPICard
          title="Équité"
          value={`${(results.equityAtHorizon / 1000).toFixed(0)}k €`}
          subtitle="Valeur - Dette"
          tooltipKey="equity"
          variant="success"
        />
      </div>
    </div>
  );
};
