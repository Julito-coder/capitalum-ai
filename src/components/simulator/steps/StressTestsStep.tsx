import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  TrendingDown, 
  Shield, 
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Percent,
  Calculator,
  Building,
  Wallet,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { stressTestsTooltips } from '../tooltips/stressTestsTooltips';

interface TooltipData {
  title: string;
  definition: string;
  impact: string;
  typicalValues: string;
  source: string;
}

const InfoTooltip: React.FC<{ data: TooltipData; children: React.ReactNode }> = ({ data, children }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex items-center gap-1 cursor-help">
        {children}
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
      </span>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-xs">
      <div className="space-y-1">
        <p className="font-medium">{data.title}</p>
        <p className="text-xs text-muted-foreground">{data.definition}</p>
      </div>
    </TooltipContent>
  </Tooltip>
);

interface StressTestsStepProps {
  data: {
    // Haircuts
    rentHaircut: number;
    vacancyHaircut: number;
    rateHaircut: number;
    costsHaircut: number;
    // Options
    applyAllHaircuts: boolean;
    useConservativeScenario: boolean;
    // Base values from previous steps
    rentMonthly?: number;
    vacancyRate?: number;
    nominalRate?: number;
    operatingCostsAnnual?: number;
    loanAmount?: number;
    durationMonths?: number;
    downPayment?: number;
  };
  onChange: (data: Partial<StressTestsStepProps['data']>) => void;
}

const StressTestsStep: React.FC<StressTestsStepProps> = ({ data, onChange }) => {
  // Default base values if not provided
  const baseRent = data.rentMonthly || 800;
  const baseVacancy = data.vacancyRate || 5;
  const baseRate = data.nominalRate || 3.5;
  const baseCosts = data.operatingCostsAnnual || 3000;
  const loanAmount = data.loanAmount || 150000;
  const durationMonths = data.durationMonths || 240;

  // Calculate stressed values
  const stressedValues = useMemo(() => {
    const stressedRent = baseRent * (1 + data.rentHaircut / 100);
    const stressedVacancy = Math.min(100, baseVacancy * (1 + data.vacancyHaircut / 100));
    const stressedRate = baseRate + data.rateHaircut;
    const stressedCosts = baseCosts * (1 + data.costsHaircut / 100);

    // Calculate monthly payment with stressed rate
    const monthlyRate = stressedRate / 100 / 12;
    const stressedPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) / 
                            (Math.pow(1 + monthlyRate, durationMonths) - 1);

    // Base payment
    const baseMonthlyRate = baseRate / 100 / 12;
    const basePayment = loanAmount * (baseMonthlyRate * Math.pow(1 + baseMonthlyRate, durationMonths)) / 
                        (Math.pow(1 + baseMonthlyRate, durationMonths) - 1);

    // Annual revenues
    const baseAnnualRent = baseRent * 12 * (1 - baseVacancy / 100);
    const stressedAnnualRent = stressedRent * 12 * (1 - stressedVacancy / 100);

    // NOI (Net Operating Income)
    const baseNOI = baseAnnualRent - baseCosts;
    const stressedNOI = stressedAnnualRent - stressedCosts;

    // Annual debt service
    const baseDebtService = basePayment * 12;
    const stressedDebtService = stressedPayment * 12;

    // DSCR
    const baseDSCR = baseDebtService > 0 ? baseNOI / baseDebtService : 0;
    const stressedDSCR = stressedDebtService > 0 ? stressedNOI / stressedDebtService : 0;

    // Monthly cashflow
    const baseCashflow = (baseNOI - baseDebtService) / 12;
    const stressedCashflow = (stressedNOI - stressedDebtService) / 12;

    // Safety margin
    const safetyMargin = baseCashflow !== 0 ? ((baseCashflow - stressedCashflow) / Math.abs(baseCashflow)) * 100 : 0;

    // Break-even rent (minimum rent to cover all costs with stressed parameters)
    const totalAnnualCosts = stressedCosts + stressedDebtService;
    const effectiveMonths = 12 * (1 - stressedVacancy / 100);
    const breakEvenRent = effectiveMonths > 0 ? totalAnnualCosts / effectiveMonths : 0;

    // Maximum rate before negative cashflow
    let maxRate = baseRate;
    for (let testRate = baseRate; testRate <= 15; testRate += 0.1) {
      const testMonthlyRate = testRate / 100 / 12;
      const testPayment = loanAmount * (testMonthlyRate * Math.pow(1 + testMonthlyRate, durationMonths)) / 
                          (Math.pow(1 + testMonthlyRate, durationMonths) - 1);
      const testDebtService = testPayment * 12;
      const testCashflow = stressedAnnualRent - stressedCosts - testDebtService;
      if (testCashflow < 0) {
        maxRate = testRate - 0.1;
        break;
      }
      maxRate = testRate;
    }

    return {
      stressedRent,
      stressedVacancy,
      stressedRate,
      stressedCosts,
      stressedPayment,
      basePayment,
      baseAnnualRent,
      stressedAnnualRent,
      baseNOI,
      stressedNOI,
      baseDSCR,
      stressedDSCR,
      baseCashflow,
      stressedCashflow,
      safetyMargin,
      breakEvenRent,
      maxRate,
      rentDelta: stressedRent - baseRent,
      vacancyDelta: stressedVacancy - baseVacancy,
      paymentDelta: stressedPayment - basePayment,
      costsDelta: stressedCosts - baseCosts
    };
  }, [baseRent, baseVacancy, baseRate, baseCosts, loanAmount, durationMonths, data]);

  const applyConservativeScenario = () => {
    onChange({
      rentHaircut: -10,
      vacancyHaircut: 50,
      rateHaircut: 1,
      costsHaircut: 10,
      useConservativeScenario: true
    });
  };

  const resetHaircuts = () => {
    onChange({
      rentHaircut: 0,
      vacancyHaircut: 0,
      rateHaircut: 0,
      costsHaircut: 0,
      useConservativeScenario: false
    });
  };

  const getDSCRStatus = (dscr: number) => {
    if (dscr >= 1.3) return { color: 'text-success', icon: CheckCircle2, label: 'Excellent' };
    if (dscr >= 1.2) return { color: 'text-success', icon: CheckCircle2, label: 'Acceptable' };
    if (dscr >= 1.0) return { color: 'text-warning', icon: AlertCircle, label: 'Limite' };
    return { color: 'text-destructive', icon: XCircle, label: 'Insuffisant' };
  };

  const getCashflowStatus = (cashflow: number) => {
    if (cashflow >= 100) return { color: 'text-success', bg: 'bg-success/10' };
    if (cashflow >= 0) return { color: 'text-warning', bg: 'bg-warning/10' };
    return { color: 'text-destructive', bg: 'bg-destructive/10' };
  };

  const baseDSCRStatus = getDSCRStatus(stressedValues.baseDSCR);
  const stressedDSCRStatus = getDSCRStatus(stressedValues.stressedDSCR);
  const baseCashflowStatus = getCashflowStatus(stressedValues.baseCashflow);
  const stressedCashflowStatus = getCashflowStatus(stressedValues.stressedCashflow);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Stress Tests Banque</h3>
            <p className="text-sm text-muted-foreground">
              Simulez des scénarios pessimistes pour évaluer la résilience de votre projet
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetHaircuts}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
          >
            Réinitialiser
          </button>
          <button
            onClick={applyConservativeScenario}
            className="px-3 py-1.5 text-sm rounded-md bg-warning text-warning-foreground hover:bg-warning/90 transition-colors"
          >
            Scénario Banque
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Haircuts Configuration */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Haircuts (Décotes)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rent Haircut */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <InfoTooltip data={stressTestsTooltips.rentHaircut}>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    Décote loyer
                  </Label>
                </InfoTooltip>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={data.rentHaircut}
                    onChange={(e) => onChange({ rentHaircut: parseFloat(e.target.value) || 0 })}
                    className="w-20 h-8 text-right"
                    step={1}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <Slider
                value={[data.rentHaircut]}
                onValueChange={([value]) => onChange({ rentHaircut: value })}
                min={-30}
                max={0}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-30%</span>
                <span className="text-foreground font-medium">
                  {baseRent.toFixed(0)}€ → {stressedValues.stressedRent.toFixed(0)}€
                  <span className="text-destructive ml-1">
                    ({stressedValues.rentDelta >= 0 ? '+' : ''}{stressedValues.rentDelta.toFixed(0)}€)
                  </span>
                </span>
                <span>0%</span>
              </div>
            </div>

            <Separator />

            {/* Vacancy Haircut */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <InfoTooltip data={stressTestsTooltips.vacancyHaircut}>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    Majoration vacance
                  </Label>
                </InfoTooltip>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={data.vacancyHaircut}
                    onChange={(e) => onChange({ vacancyHaircut: parseFloat(e.target.value) || 0 })}
                    className="w-20 h-8 text-right"
                    step={10}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <Slider
                value={[data.vacancyHaircut]}
                onValueChange={([value]) => onChange({ vacancyHaircut: value })}
                min={0}
                max={200}
                step={10}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="text-foreground font-medium">
                  {baseVacancy.toFixed(1)}% → {stressedValues.stressedVacancy.toFixed(1)}%
                  <span className="text-warning ml-1">
                    (+{stressedValues.vacancyDelta.toFixed(1)} pts)
                  </span>
                </span>
                <span>+200%</span>
              </div>
            </div>

            <Separator />

            {/* Rate Haircut */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <InfoTooltip data={stressTestsTooltips.rateHaircut}>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    Stress taux
                  </Label>
                </InfoTooltip>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={data.rateHaircut}
                    onChange={(e) => onChange({ rateHaircut: parseFloat(e.target.value) || 0 })}
                    className="w-20 h-8 text-right"
                    step={0.25}
                  />
                  <span className="text-sm text-muted-foreground">pts</span>
                </div>
              </div>
              <Slider
                value={[data.rateHaircut]}
                onValueChange={([value]) => onChange({ rateHaircut: value })}
                min={0}
                max={3}
                step={0.25}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 pts</span>
                <span className="text-foreground font-medium">
                  {baseRate.toFixed(2)}% → {stressedValues.stressedRate.toFixed(2)}%
                  <span className="text-warning ml-1">
                    (+{data.rateHaircut.toFixed(2)} pts)
                  </span>
                </span>
                <span>+3 pts</span>
              </div>
            </div>

            <Separator />

            {/* Costs Haircut */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <InfoTooltip data={stressTestsTooltips.costsHaircut}>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    Majoration charges
                  </Label>
                </InfoTooltip>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={data.costsHaircut}
                    onChange={(e) => onChange({ costsHaircut: parseFloat(e.target.value) || 0 })}
                    className="w-20 h-8 text-right"
                    step={5}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <Slider
                value={[data.costsHaircut]}
                onValueChange={([value]) => onChange({ costsHaircut: value })}
                min={0}
                max={30}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="text-foreground font-medium">
                  {baseCosts.toFixed(0)}€/an → {stressedValues.stressedCosts.toFixed(0)}€/an
                  <span className="text-warning ml-1">
                    (+{stressedValues.costsDelta.toFixed(0)}€)
                  </span>
                </span>
                <span>+30%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {/* DSCR Comparison */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <InfoTooltip data={stressTestsTooltips.dscr}>
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    DSCR (Ratio de couverture)
                  </span>
                </InfoTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Scénario Base</p>
                  <p className={`text-2xl font-bold ${baseDSCRStatus.color}`}>
                    {stressedValues.baseDSCR.toFixed(2)}
                  </p>
                  <Badge variant="outline" className={`mt-2 ${baseDSCRStatus.color}`}>
                    <baseDSCRStatus.icon className="h-3 w-3 mr-1" />
                    {baseDSCRStatus.label}
                  </Badge>
                </div>
                <div className="p-4 rounded-lg bg-warning/5 border border-warning/20 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Scénario Stressé</p>
                  <p className={`text-2xl font-bold ${stressedDSCRStatus.color}`}>
                    {stressedValues.stressedDSCR.toFixed(2)}
                  </p>
                  <Badge variant="outline" className={`mt-2 ${stressedDSCRStatus.color}`}>
                    <stressedDSCRStatus.icon className="h-3 w-3 mr-1" />
                    {stressedDSCRStatus.label}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seuil minimum bancaire</span>
                  <span className="font-medium">1.20</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Marge vs seuil</span>
                  <span className={`font-medium ${stressedValues.stressedDSCR >= 1.2 ? 'text-success' : 'text-destructive'}`}>
                    {((stressedValues.stressedDSCR - 1.2) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cashflow Comparison */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <InfoTooltip data={stressTestsTooltips.stressedCashflow}>
                  <span className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    Cashflow Mensuel
                  </span>
                </InfoTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${baseCashflowStatus.bg} text-center`}>
                  <p className="text-xs text-muted-foreground mb-1">Scénario Base</p>
                  <p className={`text-2xl font-bold ${baseCashflowStatus.color}`}>
                    {stressedValues.baseCashflow >= 0 ? '+' : ''}{stressedValues.baseCashflow.toFixed(0)}€
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    /mois
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${stressedCashflowStatus.bg} border border-warning/20 text-center`}>
                  <p className="text-xs text-muted-foreground mb-1">Scénario Stressé</p>
                  <p className={`text-2xl font-bold ${stressedCashflowStatus.color}`}>
                    {stressedValues.stressedCashflow >= 0 ? '+' : ''}{stressedValues.stressedCashflow.toFixed(0)}€
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    /mois
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Perte de cashflow</span>
                  <span className="font-medium text-destructive">
                    {(stressedValues.baseCashflow - stressedValues.stressedCashflow).toFixed(0)}€/mois
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <InfoTooltip data={stressTestsTooltips.safetyMargin}>
                    <span className="text-muted-foreground">Marge de sécurité</span>
                  </InfoTooltip>
                  <span className={`font-medium ${stressedValues.safetyMargin <= 50 ? 'text-success' : 'text-warning'}`}>
                    {stressedValues.safetyMargin.toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Break-even Analysis */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <InfoTooltip data={stressTestsTooltips.breakEvenAnalysis}>
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Seuils de Rupture
                  </span>
                </InfoTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Loyer minimum</p>
                  <p className="text-xs text-muted-foreground">Pour couvrir les charges stressées</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${stressedValues.breakEvenRent < baseRent ? 'text-success' : 'text-destructive'}`}>
                    {stressedValues.breakEvenRent.toFixed(0)}€
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Marge: {((baseRent - stressedValues.breakEvenRent) / baseRent * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Taux maximum</p>
                  <p className="text-xs text-muted-foreground">Avant cashflow négatif</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${stressedValues.maxRate > stressedValues.stressedRate ? 'text-success' : 'text-destructive'}`}>
                    {stressedValues.maxRate.toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Marge: +{(stressedValues.maxRate - stressedValues.stressedRate).toFixed(2)} pts
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Mensualité stressée</p>
                  <p className="text-xs text-muted-foreground">Avec taux majoré</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {stressedValues.stressedPayment.toFixed(0)}€
                  </p>
                  <p className="text-xs text-destructive">
                    +{stressedValues.paymentDelta.toFixed(0)}€ vs base
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary Alert */}
      <Card className={`border-2 ${stressedValues.stressedDSCR >= 1.2 && stressedValues.stressedCashflow >= -200 ? 'border-success/50 bg-success/5' : 'border-warning/50 bg-warning/5'}`}>
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            {stressedValues.stressedDSCR >= 1.2 && stressedValues.stressedCashflow >= -200 ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-success">Projet résilient</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Votre projet résiste au scénario de stress bancaire. Le DSCR reste au-dessus du seuil minimum 
                    et le cashflow reste soutenable. Ce projet devrait être finançable par une banque.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-warning">Attention requise</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Le scénario stressé révèle des fragilités. Considérez un apport plus important, 
                    une renégociation du prix, ou vérifiez que vous pouvez assumer l'effort d'épargne 
                    de {Math.abs(stressedValues.stressedCashflow).toFixed(0)}€/mois en cas de conditions défavorables.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StressTestsStep;
