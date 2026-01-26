import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdvancedWizardState } from '@/lib/advancedSimulatorTypes';
import { FormField, NumericInput } from '../FormField';
import { SALE_TOOLTIPS, CAPITAL_GAINS_BRACKETS } from '../tooltips/saleTooltips';
import { TrendingUp, Percent, Receipt, Calculator, PiggyBank, BarChart3, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface SaleStepProps {
  state: AdvancedWizardState;
  updateState: <K extends keyof AdvancedWizardState>(
    section: K,
    updates: Partial<AdvancedWizardState[K]>
  ) => void;
  mode: 'essential' | 'advanced';
}

export const SaleStep = ({ state, updateState }: SaleStepProps) => {
  const saleData = state.saleData;
  const acquisition = state.acquisition;
  const financing = state.financing;

  const updateSale = (updates: Partial<AdvancedWizardState['saleData']>) => {
    updateState('saleData', updates);
  };

  // Calculate total acquisition cost
  const totalAcquisitionCost = useMemo(() => {
    const agencyFee = acquisition.agencyFeeMode === 'percentage'
      ? acquisition.priceNetSeller * (acquisition.agencyFeeValue / 100)
      : acquisition.agencyFeeValue;
    
    const worksTotal = Object.values(acquisition.works).reduce((a, b) => a + b, 0);
    const furnitureTotal = Object.values(acquisition.furniture).reduce((a, b) => a + b, 0);
    
    return acquisition.priceNetSeller + agencyFee + acquisition.notaryFeeAmount + 
           worksTotal + furnitureTotal + acquisition.bankFees + acquisition.guaranteeFees;
  }, [acquisition]);

  // Calculate property value at resale for each scenario
  const calculateFutureValue = (growthRate: number, years: number) => {
    return Math.round(acquisition.priceNetSeller * Math.pow(1 + growthRate / 100, years));
  };

  const futureValues = useMemo(() => ({
    prudent: calculateFutureValue(saleData.prudentGrowthRate, saleData.resaleYear),
    base: calculateFutureValue(saleData.propertyGrowthRate, saleData.resaleYear),
    optimist: calculateFutureValue(saleData.optimistGrowthRate, saleData.resaleYear),
  }), [saleData, acquisition.priceNetSeller]);

  // Calculate capital gain
  const calculateCapitalGain = (salePrice: number) => {
    // Simplified: capital gain = sale price - purchase price (including works)
    const purchasePrice = acquisition.priceNetSeller + acquisition.notaryFeeAmount + 
                          Object.values(acquisition.works).reduce((a, b) => a + b, 0);
    return Math.max(0, salePrice - purchasePrice);
  };

  // Calculate capital gains tax with abatements
  const calculateCapitalGainsTax = (capitalGain: number, years: number) => {
    if (saleData.capitalGainTaxMode === 'simple') {
      return Math.round(capitalGain * (saleData.capitalGainTaxRate / 100));
    }

    // Detailed calculation with abatements
    let irAbatement = 0;
    let socialAbatement = 0;

    if (years >= CAPITAL_GAINS_BRACKETS.irExemptionYear) {
      irAbatement = 100; // Full IR exemption
    } else if (years > 5) {
      irAbatement = Math.min(100, (years - 5) * 6);
    }

    if (years >= CAPITAL_GAINS_BRACKETS.socialExemptionYear) {
      socialAbatement = 100; // Full social exemption
    } else if (years > 5) {
      if (years <= 21) {
        socialAbatement = (years - 5) * 1.65;
      } else if (years === 22) {
        socialAbatement = 16 * 1.65 + 1.6;
      } else {
        socialAbatement = 16 * 1.65 + 1.6 + (years - 22) * 9;
      }
      socialAbatement = Math.min(100, socialAbatement);
    }

    const taxableGainIR = capitalGain * (1 - irAbatement / 100);
    const taxableGainSocial = capitalGain * (1 - socialAbatement / 100);

    const irTax = taxableGainIR * (CAPITAL_GAINS_BRACKETS.irRate / 100);
    const socialTax = taxableGainSocial * (CAPITAL_GAINS_BRACKETS.socialRate / 100);

    return Math.round(irTax + socialTax);
  };

  // Calculate remaining debt at resale year
  const calculateRemainingDebt = (years: number) => {
    const monthlyRate = financing.nominalRate / 100 / 12;
    const totalMonths = financing.durationMonths;
    const monthsElapsed = years * 12;

    if (monthsElapsed >= totalMonths) return 0;

    // Remaining principal calculation for amortizing loan
    const monthlyPayment = financing.loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
      (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const remainingMonths = totalMonths - monthsElapsed;
    const remainingDebt = monthlyPayment * 
      (1 - Math.pow(1 + monthlyRate, -remainingMonths)) / monthlyRate;

    return Math.round(remainingDebt);
  };

  // Calculate net sale proceeds for each scenario
  const calculateNetProceeds = (futureValue: number) => {
    const agencyFees = futureValue * (saleData.resaleAgencyPct / 100);
    const capitalGain = calculateCapitalGain(futureValue);
    const capitalGainsTax = calculateCapitalGainsTax(capitalGain, saleData.resaleYear);
    const remainingDebt = calculateRemainingDebt(saleData.resaleYear);

    return Math.round(
      futureValue - 
      agencyFees - 
      saleData.resaleOtherFees - 
      saleData.resaleWorks - 
      capitalGainsTax - 
      remainingDebt
    );
  };

  const netProceeds = useMemo(() => ({
    prudent: calculateNetProceeds(futureValues.prudent),
    base: calculateNetProceeds(futureValues.base),
    optimist: calculateNetProceeds(futureValues.optimist),
  }), [futureValues, saleData, financing]);

  // Calculate total return (net proceeds + cumulative cashflows - initial investment)
  const annualCashflow = state.rental.rentMonthly * 12 * (1 - state.rental.vacancyRate / 100) - 
                         state.operatingCosts.propertyTaxAnnual - 
                         state.operatingCosts.condoNonRecoverableAnnual - 
                         state.operatingCosts.insurancePNO;
  const cumulativeCashflow = annualCashflow * saleData.resaleYear;

  const totalReturn = useMemo(() => ({
    prudent: netProceeds.prudent + cumulativeCashflow - financing.downPayment,
    base: netProceeds.base + cumulativeCashflow - financing.downPayment,
    optimist: netProceeds.optimist + cumulativeCashflow - financing.downPayment,
  }), [netProceeds, cumulativeCashflow, financing.downPayment]);

  // Simplified IRR calculation (approximate)
  const calculateApproxIRR = (totalReturn: number, years: number, initialInvestment: number) => {
    if (initialInvestment <= 0 || years <= 0) return 0;
    const irr = Math.pow((totalReturn + initialInvestment) / initialInvestment, 1 / years) - 1;
    return Math.round(irr * 1000) / 10; // One decimal
  };

  const approxIRR = useMemo(() => ({
    prudent: calculateApproxIRR(totalReturn.prudent, saleData.resaleYear, financing.downPayment),
    base: calculateApproxIRR(totalReturn.base, saleData.resaleYear, financing.downPayment),
    optimist: calculateApproxIRR(totalReturn.optimist, saleData.resaleYear, financing.downPayment),
  }), [totalReturn, saleData.resaleYear, financing.downPayment]);

  const remainingDebt = calculateRemainingDebt(saleData.resaleYear);
  const capitalGainBase = calculateCapitalGain(futureValues.base);
  const taxBase = calculateCapitalGainsTax(capitalGainBase, saleData.resaleYear);

  return (
    <div className="space-y-6">
      {/* Resale Horizon */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Horizon de revente
          </CardTitle>
          <CardDescription>Définissez votre stratégie de sortie</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField 
            label={`Revente après ${saleData.resaleYear} ans`}
            tooltip={SALE_TOOLTIPS.resaleYear}
            required
          >
            <Slider
              value={[saleData.resaleYear]}
              onValueChange={([v]) => updateSale({ resaleYear: v })}
              min={1}
              max={30}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 an</span>
              <span>15 ans</span>
              <span>30 ans</span>
            </div>
          </FormField>

          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Capital restant dû</p>
              <p className="text-lg font-bold text-foreground">
                {remainingDebt.toLocaleString('fr-FR')} €
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Abattement IR PV</p>
              <p className="text-lg font-bold text-foreground">
                {saleData.resaleYear >= 22 ? '100%' : saleData.resaleYear > 5 ? `${(saleData.resaleYear - 5) * 6}%` : '0%'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Abattement PS PV</p>
              <p className="text-lg font-bold text-foreground">
                {saleData.resaleYear >= 30 ? '100%' : saleData.resaleYear > 5 ? `~${Math.round((saleData.resaleYear - 5) * 1.65)}%` : '0%'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Growth Scenarios */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Scénarios de croissance
          </CardTitle>
          <CardDescription>Hypothèses de valorisation du bien</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Prudent */}
            <div className="p-4 border rounded-lg border-destructive/30 bg-destructive/5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownRight className="h-4 w-4 text-destructive" />
                <span className="font-medium text-sm">Prudent</span>
              </div>
              <FormField 
                label="Croissance (%/an)"
                tooltip={SALE_TOOLTIPS.prudentGrowthRate}
              >
                <NumericInput
                  value={saleData.prudentGrowthRate}
                  onChange={(v) => updateSale({ prudentGrowthRate: v })}
                  suffix="%"
                  step={0.5}
                  min={-5}
                  max={10}
                />
              </FormField>
              <div className="mt-3 pt-3 border-t border-destructive/20">
                <p className="text-xs text-muted-foreground">Valeur à {saleData.resaleYear} ans</p>
                <p className="text-lg font-bold text-destructive">
                  {futureValues.prudent.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>

            {/* Base */}
            <div className="p-4 border rounded-lg border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Minus className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Base</span>
                <Badge variant="secondary" className="ml-auto">Défaut</Badge>
              </div>
              <FormField 
                label="Croissance (%/an)"
                tooltip={SALE_TOOLTIPS.propertyGrowthRate}
              >
                <NumericInput
                  value={saleData.propertyGrowthRate}
                  onChange={(v) => updateSale({ propertyGrowthRate: v })}
                  suffix="%"
                  step={0.5}
                  min={-5}
                  max={10}
                />
              </FormField>
              <div className="mt-3 pt-3 border-t border-primary/20">
                <p className="text-xs text-muted-foreground">Valeur à {saleData.resaleYear} ans</p>
                <p className="text-lg font-bold text-primary">
                  {futureValues.base.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>

            {/* Optimist */}
            <div className="p-4 border rounded-lg border-chart-2/30 bg-chart-2/5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight className="h-4 w-4 text-chart-2" />
                <span className="font-medium text-sm">Optimiste</span>
              </div>
              <FormField 
                label="Croissance (%/an)"
                tooltip={SALE_TOOLTIPS.optimistGrowthRate}
              >
                <NumericInput
                  value={saleData.optimistGrowthRate}
                  onChange={(v) => updateSale({ optimistGrowthRate: v })}
                  suffix="%"
                  step={0.5}
                  min={-5}
                  max={10}
                />
              </FormField>
              <div className="mt-3 pt-3 border-t border-chart-2/20">
                <p className="text-xs text-muted-foreground">Valeur à {saleData.resaleYear} ans</p>
                <p className="text-lg font-bold text-chart-2">
                  {futureValues.optimist.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resale Costs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Frais de revente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField 
              label="Commission agence (%)"
              tooltip={SALE_TOOLTIPS.resaleAgencyPct}
            >
              <NumericInput
                value={saleData.resaleAgencyPct}
                onChange={(v) => updateSale({ resaleAgencyPct: v })}
                suffix="%"
                step={0.5}
                min={0}
                max={10}
              />
            </FormField>

            <FormField 
              label="Autres frais (€)"
              tooltip={SALE_TOOLTIPS.resaleOtherFees}
              description="Diagnostics, mainlevée..."
            >
              <NumericInput
                value={saleData.resaleOtherFees}
                onChange={(v) => updateSale({ resaleOtherFees: v })}
                suffix="€"
                min={0}
              />
            </FormField>

            <FormField 
              label="Travaux avant revente (€)"
              tooltip={SALE_TOOLTIPS.resaleWorks}
              description="Valorisation optionnelle"
            >
              <NumericInput
                value={saleData.resaleWorks}
                onChange={(v) => updateSale({ resaleWorks: v })}
                suffix="€"
                min={0}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Capital Gains Tax */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Imposition des plus-values
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Mode de calcul"
              tooltip={SALE_TOOLTIPS.capitalGainTaxMode}
            >
              <Select
                value={saleData.capitalGainTaxMode}
                onValueChange={(v: 'simple' | 'detailed') => updateSale({ capitalGainTaxMode: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple (taux global)</SelectItem>
                  <SelectItem value="detailed">Détaillé (avec abattements)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {saleData.capitalGainTaxMode === 'simple' && (
              <FormField 
                label="Taux global (%)"
                tooltip={SALE_TOOLTIPS.capitalGainTaxRate}
              >
                <NumericInput
                  value={saleData.capitalGainTaxRate}
                  onChange={(v) => updateSale({ capitalGainTaxRate: v })}
                  suffix="%"
                  step={0.1}
                  min={0}
                  max={50}
                />
              </FormField>
            )}
          </div>

          {saleData.capitalGainTaxMode === 'detailed' && (
            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <p className="text-sm font-medium">Calcul détaillé (scénario base)</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Plus-value brute</span>
                  <span className="float-right font-medium">{capitalGainBase.toLocaleString('fr-FR')} €</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Après abattements IR</span>
                  <span className="float-right font-medium">
                    {Math.round(capitalGainBase * (1 - Math.min(100, saleData.resaleYear > 5 ? (saleData.resaleYear - 5) * 6 : 0) / 100)).toLocaleString('fr-FR')} €
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Impôt estimé</span>
                  <span className="float-right font-medium text-destructive">{taxBase.toLocaleString('fr-FR')} €</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            Synthèse patrimoniale à {saleData.resaleYear} ans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium"></th>
                  <th className="text-right py-2 font-medium text-destructive">Prudent</th>
                  <th className="text-right py-2 font-medium text-primary">Base</th>
                  <th className="text-right py-2 font-medium text-chart-2">Optimiste</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 text-muted-foreground">Valeur du bien</td>
                  <td className="text-right py-2">{futureValues.prudent.toLocaleString('fr-FR')} €</td>
                  <td className="text-right py-2">{futureValues.base.toLocaleString('fr-FR')} €</td>
                  <td className="text-right py-2">{futureValues.optimist.toLocaleString('fr-FR')} €</td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">Produit net de cession</td>
                  <td className="text-right py-2 font-medium">{netProceeds.prudent.toLocaleString('fr-FR')} €</td>
                  <td className="text-right py-2 font-medium">{netProceeds.base.toLocaleString('fr-FR')} €</td>
                  <td className="text-right py-2 font-medium">{netProceeds.optimist.toLocaleString('fr-FR')} €</td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">+ Cashflows cumulés</td>
                  <td className="text-right py-2" colSpan={3}>{cumulativeCashflow.toLocaleString('fr-FR')} €</td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">- Apport initial</td>
                  <td className="text-right py-2" colSpan={3}>-{financing.downPayment.toLocaleString('fr-FR')} €</td>
                </tr>
                <tr className="border-t-2 border-primary/30">
                  <td className="py-3 font-medium">Gain net total</td>
                  <td className="text-right py-3 font-bold text-destructive">{totalReturn.prudent.toLocaleString('fr-FR')} €</td>
                  <td className="text-right py-3 font-bold text-primary">{totalReturn.base.toLocaleString('fr-FR')} €</td>
                  <td className="text-right py-3 font-bold text-chart-2">{totalReturn.optimist.toLocaleString('fr-FR')} €</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">TRI approximatif</td>
                  <td className="text-right py-2 font-bold text-destructive">{approxIRR.prudent}%</td>
                  <td className="text-right py-2 font-bold text-primary">{approxIRR.base}%</td>
                  <td className="text-right py-2 font-bold text-chart-2">{approxIRR.optimist}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
