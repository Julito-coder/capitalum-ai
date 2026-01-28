import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdvancedWizardState } from '@/lib/advancedSimulatorTypes';
import { FormField, NumericInput } from '../FormField';
import { Receipt, Building2, Wrench, TrendingUp, Home } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RP_COSTS_TOOLTIPS } from '../tooltips/rpCostsTooltips';

interface RPOperatingCostsStepProps {
  state: AdvancedWizardState;
  updateState: <K extends keyof AdvancedWizardState>(
    section: K,
    updates: Partial<AdvancedWizardState[K]>
  ) => void;
  mode: 'essential' | 'advanced';
}

export const RPOperatingCostsStep = ({ state, updateState }: RPOperatingCostsStepProps) => {
  const costs = state.operatingCosts;

  const updateCosts = (updates: Partial<AdvancedWizardState['operatingCosts']>) => {
    updateState('operatingCosts', updates);
  };

  // Calculate maintenance based on property value estimate
  const propertyValue = state.acquisition.priceNetSeller || 200000;
  const maintenanceCost = costs.maintenanceMode === 'percentage'
    ? propertyValue * (costs.maintenanceValue / 100)
    : costs.maintenanceValue;

  // Total annual costs for RP (no rental-related costs)
  const totalAnnualCosts = 
    costs.propertyTaxAnnual +
    costs.condoNonRecoverableAnnual +
    costs.condoWorksReserve +
    costs.insurancePNO +
    maintenanceCost +
    costs.majorWorksProvision +
    costs.bankFees +
    costs.miscFees;

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
          <CardDescription>Charges fiscales annuelles du propriétaire occupant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Taxe foncière (€/an)"
              tooltip={RP_COSTS_TOOLTIPS.propertyTax}
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
              tooltip={RP_COSTS_TOOLTIPS.propertyTaxGrowth}
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
          <CardDescription>Charges mensuelles et provisions pour travaux</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Charges copropriété (€/an)"
              tooltip={RP_COSTS_TOOLTIPS.condoCharges}
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
              tooltip={RP_COSTS_TOOLTIPS.condoWorksReserve}
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

      {/* Home Insurance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Assurance habitation
          </CardTitle>
          <CardDescription>Assurance multirisque habitation du propriétaire occupant</CardDescription>
        </CardHeader>
        <CardContent>
          <FormField 
            label="Assurance habitation (€/an)"
            tooltip={RP_COSTS_TOOLTIPS.homeInsurance}
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

      {/* Maintenance & Works */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Entretien & Travaux
          </CardTitle>
          <CardDescription>Budget annuel pour l'entretien courant et les gros travaux</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <FormField 
                label="Mode de calcul entretien"
                tooltip={RP_COSTS_TOOLTIPS.maintenanceMode}
              >
                <Select
                  value={costs.maintenanceMode}
                  onValueChange={(v: 'percentage' | 'fixed') => updateCosts({ maintenanceMode: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">% de la valeur du bien</SelectItem>
                    <SelectItem value="fixed">Montant fixe €/an</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField 
                label={costs.maintenanceMode === 'percentage' ? "Entretien (% valeur)" : "Entretien (€/an)"}
                tooltip={RP_COSTS_TOOLTIPS.maintenanceValue}
              >
                <NumericInput
                  value={costs.maintenanceValue}
                  onChange={(v) => updateCosts({ maintenanceValue: v })}
                  suffix={costs.maintenanceMode === 'percentage' ? '%' : '€'}
                  step={costs.maintenanceMode === 'percentage' ? 0.1 : 100}
                  min={0}
                />
              </FormField>
            </div>

            <div className="space-y-3">
              <FormField 
                label="Provision gros travaux (€/an)"
                tooltip={RP_COSTS_TOOLTIPS.majorWorks}
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
                tooltip={RP_COSTS_TOOLTIPS.majorWorksFrequency}
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

      {/* Miscellaneous */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Divers & Indexation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField 
              label="Frais bancaires (€/an)"
              tooltip={RP_COSTS_TOOLTIPS.bankFees}
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
              tooltip={RP_COSTS_TOOLTIPS.miscFees}
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
              tooltip={RP_COSTS_TOOLTIPS.inflationRate}
              description="Revalorisation des charges"
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
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Taxe foncière</p>
              <p className="text-lg font-bold text-foreground">
                {costs.propertyTaxAnnual.toLocaleString('fr-FR')} €
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Charges copro</p>
              <p className="text-lg font-bold text-foreground">
                {(costs.condoNonRecoverableAnnual + costs.condoWorksReserve).toLocaleString('fr-FR')} €
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entretien</p>
              <p className="text-lg font-bold text-foreground">
                {Math.round(maintenanceCost + costs.majorWorksProvision).toLocaleString('fr-FR')} €
              </p>
            </div>
            <div className="border-l border-primary/20 pl-4">
              <p className="text-sm text-muted-foreground">Total charges annuelles</p>
              <p className="text-xl font-bold text-primary">
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
