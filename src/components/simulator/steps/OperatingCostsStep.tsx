import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdvancedWizardState } from '@/lib/advancedSimulatorTypes';
import { FormField, NumericInput, SwitchField } from '../FormField';
import { COSTS_TOOLTIPS } from '../tooltips/costsTooltips';
import { Receipt, Building2, Shield, Wrench, Calculator, Zap, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OperatingCostsStepProps {
  state: AdvancedWizardState;
  updateState: <K extends keyof AdvancedWizardState>(
    section: K,
    updates: Partial<AdvancedWizardState[K]>
  ) => void;
  mode: 'essential' | 'advanced';
}

export const OperatingCostsStep = ({ state, updateState }: OperatingCostsStepProps) => {
  const costs = state.operatingCosts;
  const rental = state.rental;
  const isSeasonalOrFurnished = rental.seasonalEnabled || rental.locationType === 'meuble';

  const updateCosts = (updates: Partial<AdvancedWizardState['operatingCosts']>) => {
    updateState('operatingCosts', updates);
  };

  // Calculate total annual costs
  const maintenanceCost = costs.maintenanceMode === 'percentage'
    ? (rental.rentMonthly * 12) * (costs.maintenanceValue / 100)
    : costs.maintenanceValue;

  const managementCost = Math.max(
    (rental.rentMonthly * 12) * (costs.managementPct / 100),
    costs.managementMinMonthly * 12
  ) + costs.managementSpecificFees;

  const utilitiesCost = isSeasonalOrFurnished 
    ? (costs.utilitiesWater + costs.utilitiesElec + costs.utilitiesGas + costs.utilitiesInternet) * 12
    : 0;

  const totalAnnualCosts = 
    costs.propertyTaxAnnual +
    costs.condoNonRecoverableAnnual +
    costs.condoWorksReserve +
    costs.insurancePNO +
    managementCost +
    maintenanceCost +
    costs.majorWorksProvision +
    costs.accountingAnnual +
    costs.membershipFees +
    costs.bankFees +
    costs.miscFees +
    utilitiesCost +
    costs.cfeAnnual +
    costs.otherTaxes;

  const monthlyCosts = totalAnnualCosts / 12;

  return (
    <div className="space-y-6">
      {/* Taxes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Taxes & Impôts locaux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Taxe foncière (€/an)"
              tooltip={COSTS_TOOLTIPS.propertyTax}
              required
            >
              <NumericInput
                value={costs.propertyTaxAnnual}
                onChange={(v) => updateCosts({ propertyTaxAnnual: v })}
                suffix="€"
                min={0}
              />
            </FormField>

            <FormField 
              label="Revalorisation taxe (%/an)"
              tooltip={COSTS_TOOLTIPS.propertyTaxGrowth}
            >
              <NumericInput
                value={costs.propertyTaxGrowthRate}
                onChange={(v) => updateCosts({ propertyTaxGrowthRate: v })}
                suffix="%"
                step={0.5}
                min={0}
                max={10}
              />
            </FormField>

            <FormField 
              label="CFE (€/an)"
              tooltip={COSTS_TOOLTIPS.cfe}
              description="Cotisation Foncière des Entreprises (si LMNP/LMP)"
            >
              <NumericInput
                value={costs.cfeAnnual}
                onChange={(v) => updateCosts({ cfeAnnual: v })}
                suffix="€"
                min={0}
              />
            </FormField>

            <FormField 
              label="Autres taxes (€/an)"
              tooltip={COSTS_TOOLTIPS.otherTaxes}
            >
              <NumericInput
                value={costs.otherTaxes}
                onChange={(v) => updateCosts({ otherTaxes: v })}
                suffix="€"
                min={0}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Condo / Copropriété */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Charges de copropriété
          </CardTitle>
          <CardDescription>Charges non récupérables sur le locataire</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Charges non récupérables (€/an)"
              tooltip={COSTS_TOOLTIPS.condoNonRecoverable}
              required
            >
              <NumericInput
                value={costs.condoNonRecoverableAnnual}
                onChange={(v) => updateCosts({ condoNonRecoverableAnnual: v })}
                suffix="€"
                min={0}
              />
            </FormField>

            <FormField 
              label="Fonds travaux copro (€/an)"
              tooltip={COSTS_TOOLTIPS.condoWorksReserve}
            >
              <NumericInput
                value={costs.condoWorksReserve}
                onChange={(v) => updateCosts({ condoWorksReserve: v })}
                suffix="€"
                min={0}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Insurance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Assurances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField 
            label="Assurance PNO (€/an)"
            tooltip={COSTS_TOOLTIPS.insurancePNO}
            required
          >
            <NumericInput
              value={costs.insurancePNO}
              onChange={(v) => updateCosts({ insurancePNO: v })}
              suffix="€"
              min={0}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Property Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Gestion locative
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField 
              label="Honoraires gestion (%)"
              tooltip={COSTS_TOOLTIPS.managementPct}
            >
              <NumericInput
                value={costs.managementPct}
                onChange={(v) => updateCosts({ managementPct: v })}
                suffix="%"
                step={0.5}
                min={0}
                max={15}
              />
            </FormField>

            <FormField 
              label="Minimum mensuel (€)"
              tooltip={COSTS_TOOLTIPS.managementMin}
            >
              <NumericInput
                value={costs.managementMinMonthly}
                onChange={(v) => updateCosts({ managementMinMonthly: v })}
                suffix="€"
                min={0}
              />
            </FormField>

            <FormField 
              label="Frais spécifiques (€/an)"
              tooltip={COSTS_TOOLTIPS.managementSpecific}
              description="États des lieux, contentieux..."
            >
              <NumericInput
                value={costs.managementSpecificFees}
                onChange={(v) => updateCosts({ managementSpecificFees: v })}
                suffix="€"
                min={0}
              />
            </FormField>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Comptabilité (€/an)"
              tooltip={COSTS_TOOLTIPS.accounting}
              description="Expert-comptable LMNP"
            >
              <NumericInput
                value={costs.accountingAnnual}
                onChange={(v) => updateCosts({ accountingAnnual: v })}
                suffix="€"
                min={0}
              />
            </FormField>

            <FormField 
              label="Adhésions / CGA (€/an)"
              tooltip={COSTS_TOOLTIPS.membership}
            >
              <NumericInput
                value={costs.membershipFees}
                onChange={(v) => updateCosts({ membershipFees: v })}
                suffix="€"
                min={0}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance & Works */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Entretien & Travaux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <FormField 
                label="Mode de calcul entretien"
                tooltip={COSTS_TOOLTIPS.maintenanceMode}
              >
                <Select
                  value={costs.maintenanceMode}
                  onValueChange={(v: 'percentage' | 'fixed') => updateCosts({ maintenanceMode: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">% des loyers</SelectItem>
                    <SelectItem value="fixed">Montant fixe €/an</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField 
                label={costs.maintenanceMode === 'percentage' ? "Entretien (% loyers)" : "Entretien (€/an)"}
                tooltip={COSTS_TOOLTIPS.maintenanceValue}
              >
                <NumericInput
                  value={costs.maintenanceValue}
                  onChange={(v) => updateCosts({ maintenanceValue: v })}
                  suffix={costs.maintenanceMode === 'percentage' ? '%' : '€'}
                  step={costs.maintenanceMode === 'percentage' ? 0.5 : 100}
                  min={0}
                />
              </FormField>
            </div>

            <div className="space-y-3">
              <FormField 
                label="Provision gros travaux (€/an)"
                tooltip={COSTS_TOOLTIPS.majorWorks}
              >
                <NumericInput
                  value={costs.majorWorksProvision}
                  onChange={(v) => updateCosts({ majorWorksProvision: v })}
                  suffix="€"
                  min={0}
                />
              </FormField>

              <FormField 
                label="Fréquence gros travaux (années)"
                tooltip={COSTS_TOOLTIPS.majorWorksFrequency}
              >
                <NumericInput
                  value={costs.majorWorksFrequencyYears}
                  onChange={(v) => updateCosts({ majorWorksFrequencyYears: v })}
                  suffix="ans"
                  min={1}
                  max={30}
                />
              </FormField>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Utilities (for furnished/seasonal) */}
      {isSeasonalOrFurnished && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Consommations (à charge du bailleur)
            </CardTitle>
            <CardDescription>Fluides et abonnements inclus dans le loyer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField 
                label="Eau (€/mois)"
                tooltip={COSTS_TOOLTIPS.utilitiesWater}
              >
                <NumericInput
                  value={costs.utilitiesWater}
                  onChange={(v) => updateCosts({ utilitiesWater: v })}
                  suffix="€"
                  min={0}
                />
              </FormField>

              <FormField 
                label="Électricité (€/mois)"
                tooltip={COSTS_TOOLTIPS.utilitiesElec}
              >
                <NumericInput
                  value={costs.utilitiesElec}
                  onChange={(v) => updateCosts({ utilitiesElec: v })}
                  suffix="€"
                  min={0}
                />
              </FormField>

              <FormField 
                label="Gaz (€/mois)"
                tooltip={COSTS_TOOLTIPS.utilitiesGas}
              >
                <NumericInput
                  value={costs.utilitiesGas}
                  onChange={(v) => updateCosts({ utilitiesGas: v })}
                  suffix="€"
                  min={0}
                />
              </FormField>

              <FormField 
                label="Internet (€/mois)"
                tooltip={COSTS_TOOLTIPS.utilitiesInternet}
              >
                <NumericInput
                  value={costs.utilitiesInternet}
                  onChange={(v) => updateCosts({ utilitiesInternet: v })}
                  suffix="€"
                  min={0}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Miscellaneous */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Divers & Indexation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Frais bancaires (€/an)"
              tooltip={COSTS_TOOLTIPS.bankFees}
            >
              <NumericInput
                value={costs.bankFees}
                onChange={(v) => updateCosts({ bankFees: v })}
                suffix="€"
                min={0}
              />
            </FormField>

            <FormField 
              label="Frais divers (€/an)"
              tooltip={COSTS_TOOLTIPS.miscFees}
            >
              <NumericInput
                value={costs.miscFees}
                onChange={(v) => updateCosts({ miscFees: v })}
                suffix="€"
                min={0}
              />
            </FormField>

            <FormField 
              label="Inflation générale (%/an)"
              tooltip={COSTS_TOOLTIPS.inflationRate}
              description="Revalorisation annuelle des charges"
            >
              <NumericInput
                value={costs.inflationRate}
                onChange={(v) => updateCosts({ inflationRate: v })}
                suffix="%"
                step={0.5}
                min={0}
                max={10}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Costs Summary */}
      <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Taxes annuelles</p>
              <p className="text-lg font-bold text-foreground">
                {(costs.propertyTaxAnnual + costs.cfeAnnual + costs.otherTaxes).toLocaleString('fr-FR')} €
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Copro + Assurance</p>
              <p className="text-lg font-bold text-foreground">
                {(costs.condoNonRecoverableAnnual + costs.condoWorksReserve + costs.insurancePNO).toLocaleString('fr-FR')} €
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gestion + Entretien</p>
              <p className="text-lg font-bold text-foreground">
                {Math.round(managementCost + maintenanceCost + costs.majorWorksProvision).toLocaleString('fr-FR')} €
              </p>
            </div>
            <div className="border-l border-destructive/20 pl-4">
              <p className="text-sm text-muted-foreground">Total charges annuelles</p>
              <p className="text-xl font-bold text-destructive">
                {Math.round(totalAnnualCosts).toLocaleString('fr-FR')} €
              </p>
              <p className="text-xs text-muted-foreground">
                soit {Math.round(monthlyCosts).toLocaleString('fr-FR')} €/mois
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
