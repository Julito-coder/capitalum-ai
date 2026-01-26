import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdvancedWizardState } from '@/lib/advancedSimulatorTypes';
import { FormField, NumericInput, SwitchField } from '../FormField';
import { TAX_TOOLTIPS, TAX_REGIMES_CONFIG, TMI_BRACKETS } from '../tooltips/taxTooltips';
import { Calculator, Percent, FileText, Settings2, TrendingDown, Calendar, Coins, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';

interface TaxConfigStepProps {
  state: AdvancedWizardState;
  updateState: <K extends keyof AdvancedWizardState>(
    section: K,
    updates: Partial<AdvancedWizardState[K]>
  ) => void;
  mode: 'essential' | 'advanced';
}

export const TaxConfigStep = ({ state, updateState }: TaxConfigStepProps) => {
  const taxConfig = state.taxConfig;
  const locationType = state.rental.locationType;

  const updateTax = (updates: Partial<AdvancedWizardState['taxConfig']>) => {
    updateState('taxConfig', updates);
  };

  // Filter regimes based on location type
  const availableRegimes = TAX_REGIMES_CONFIG.filter(
    r => r.locationType.includes(locationType)
  );

  // Add a new amortization component
  const addAmortizationComponent = () => {
    const newComponents = [
      ...taxConfig.amortizationComponents,
      { name: 'Nouveau composant', valuePct: 10, durationYears: 10 }
    ];
    updateTax({ amortizationComponents: newComponents });
  };

  // Remove an amortization component
  const removeAmortizationComponent = (index: number) => {
    const newComponents = taxConfig.amortizationComponents.filter((_, i) => i !== index);
    updateTax({ amortizationComponents: newComponents });
  };

  // Update an amortization component
  const updateAmortizationComponent = (index: number, field: string, value: string | number) => {
    const newComponents = [...taxConfig.amortizationComponents];
    newComponents[index] = { ...newComponents[index], [field]: value };
    updateTax({ amortizationComponents: newComponents });
  };

  // Calculate total amortization percentage
  const totalAmortPct = taxConfig.amortizationComponents.reduce((sum, c) => sum + c.valuePct, 0);

  // Estimate annual tax based on simple mode
  const estimateAnnualTax = () => {
    const annualRent = state.rental.rentMonthly * 12;
    const selectedRegime = TAX_REGIMES_CONFIG.find(r => r.key === taxConfig.regimeKey);
    
    if (!selectedRegime) return 0;
    
    let taxableIncome = annualRent;
    if (selectedRegime.abattement > 0) {
      taxableIncome = annualRent * (1 - selectedRegime.abattement / 100);
    }
    
    const irTax = taxableIncome * (taxConfig.tmiRate / 100);
    const socialTax = taxableIncome * (taxConfig.socialRate / 100);
    
    return Math.round(irTax + socialTax);
  };

  const estimatedTax = taxConfig.taxMode === 'override' && taxConfig.annualTaxOverride
    ? taxConfig.annualTaxOverride
    : estimateAnnualTax();

  return (
    <div className="space-y-6">
      {/* Tax Mode Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Mode de calcul fiscal
          </CardTitle>
          <CardDescription>Choisissez le niveau de précision pour l'estimation de l'impôt</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={taxConfig.taxMode} 
            onValueChange={(v) => updateTax({ taxMode: v as 'simple' | 'regime' | 'override' })}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="simple" className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Simple
              </TabsTrigger>
              <TabsTrigger value="regime" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Régime
              </TabsTrigger>
              <TabsTrigger value="override" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Override
              </TabsTrigger>
            </TabsList>

            <TabsContent value="simple" className="mt-4 space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Calcul simplifié : TMI × revenus nets + prélèvements sociaux.
                  Idéal pour une première estimation rapide.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="regime" className="mt-4 space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Calcul selon le régime fiscal choisi avec ses règles spécifiques
                  (abattements, déductions, amortissements).
                </p>
              </div>
            </TabsContent>

            <TabsContent value="override" className="mt-4 space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Saisie manuelle</p>
                    <p className="text-sm text-muted-foreground">
                      Saisissez directement le montant d'impôt annuel estimé par votre comptable.
                    </p>
                  </div>
                </div>
              </div>
              <FormField 
                label="Impôt annuel (€)"
                tooltip={TAX_TOOLTIPS.annualTaxOverride}
                required
              >
                <NumericInput
                  value={taxConfig.annualTaxOverride || 0}
                  onChange={(v) => updateTax({ annualTaxOverride: v })}
                  suffix="€"
                  min={0}
                />
              </FormField>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* TMI & Social Charges */}
      {taxConfig.taxMode !== 'override' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Taux d'imposition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <FormField 
                  label="Tranche Marginale d'Imposition (TMI)"
                  tooltip={TAX_TOOLTIPS.tmi}
                  required
                >
                  <Select
                    value={String(taxConfig.tmiRate)}
                    onValueChange={(v) => updateTax({ tmiRate: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TMI_BRACKETS.map(bracket => (
                        <SelectItem key={bracket.rate} value={String(bracket.rate)}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{bracket.label}</span>
                            <span className="text-xs text-muted-foreground">{bracket.range}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <FormField 
                label="Prélèvements sociaux (%)"
                tooltip={TAX_TOOLTIPS.socialRate}
                required
              >
                <NumericInput
                  value={taxConfig.socialRate}
                  onChange={(v) => updateTax({ socialRate: v })}
                  suffix="%"
                  step={0.1}
                  min={0}
                  max={25}
                />
              </FormField>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taux global d'imposition</span>
                <span className="font-bold text-lg">
                  {taxConfig.tmiRate + taxConfig.socialRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tax Regime Selection */}
      {taxConfig.taxMode === 'regime' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Régime fiscal
            </CardTitle>
            <CardDescription>
              Régimes disponibles pour la location {locationType === 'nu' ? 'nue' : 'meublée'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableRegimes.map(regime => (
                <button
                  key={regime.key}
                  type="button"
                  onClick={() => updateTax({ regimeKey: regime.key })}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    taxConfig.regimeKey === regime.key 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{regime.label}</p>
                      <p className="text-sm text-muted-foreground">{regime.description}</p>
                    </div>
                    {regime.abattement > 0 && (
                      <Badge variant="secondary">-{regime.abattement}%</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <Separator />

            {/* Deduction Options */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Déductions activées</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SwitchField
                  label="Intérêts d'emprunt"
                  checked={taxConfig.interestDeductible}
                  onCheckedChange={(c) => updateTax({ interestDeductible: c })}
                  tooltip={TAX_TOOLTIPS.interestDeductible}
                />
                <SwitchField
                  label="Charges d'exploitation"
                  checked={taxConfig.costsDeductible}
                  onCheckedChange={(c) => updateTax({ costsDeductible: c })}
                  tooltip={TAX_TOOLTIPS.costsDeductible}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amortization (for LMNP/IS regimes) */}
      {taxConfig.taxMode === 'regime' && 
       ['lmnp_reel', 'lmp_reel', 'sci_is'].includes(taxConfig.regimeKey) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Amortissements
            </CardTitle>
            <CardDescription>Configuration des composants amortissables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SwitchField
              label="Activer l'amortissement"
              checked={taxConfig.amortizationEnabled}
              onCheckedChange={(c) => updateTax({ amortizationEnabled: c })}
              tooltip={TAX_TOOLTIPS.amortization}
              description="Déduction comptable de la valeur du bien"
            />

            {taxConfig.amortizationEnabled && (
              <>
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Composants amortissables</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAmortizationComponent}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {taxConfig.amortizationComponents.map((component, index) => (
                      <div 
                        key={index} 
                        className="grid grid-cols-12 gap-2 items-center p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="col-span-4">
                          <Input
                            value={component.name}
                            onChange={(e) => updateAmortizationComponent(index, 'name', e.target.value)}
                            placeholder="Nom du composant"
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-3">
                          <div className="relative">
                            <Input
                              type="number"
                              value={component.valuePct}
                              onChange={(e) => updateAmortizationComponent(index, 'valuePct', Number(e.target.value))}
                              className="h-9 pr-8"
                              min={0}
                              max={100}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <div className="relative">
                            <Input
                              type="number"
                              value={component.durationYears}
                              onChange={(e) => updateAmortizationComponent(index, 'durationYears', Number(e.target.value))}
                              className="h-9 pr-10"
                              min={1}
                              max={50}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ans</span>
                          </div>
                        </div>
                        <div className="col-span-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAmortizationComponent(index)}
                            className="h-9 w-9 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`p-3 rounded-lg ${totalAmortPct === 100 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total des composants</span>
                      <span className={`font-bold ${totalAmortPct === 100 ? 'text-primary' : 'text-destructive'}`}>
                        {totalAmortPct}%
                        {totalAmortPct !== 100 && (
                          <span className="text-xs font-normal ml-2">(doit être 100%)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Deficit carry-forward */}
                <SwitchField
                  label="Activer le report de déficit"
                  checked={taxConfig.deficitEnabled}
                  onCheckedChange={(c) => updateTax({ deficitEnabled: c })}
                  tooltip={TAX_TOOLTIPS.deficit}
                  description="Report des déficits sur les années suivantes"
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Exploitation Start Date */}
      {taxConfig.taxMode === 'regime' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Date de début d'exploitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField 
              label="Date de mise en location"
              tooltip={TAX_TOOLTIPS.exploitationStartDate}
              description="Pour le calcul du prorata de la première année"
            >
              <Input
                type="date"
                value={taxConfig.exploitationStartDate || ''}
                onChange={(e) => updateTax({ exploitationStartDate: e.target.value })}
              />
            </FormField>
          </CardContent>
        </Card>
      )}

      {/* Capital Gains */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Plus-values immobilières
          </CardTitle>
          <CardDescription>Taxation à la revente du bien</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Mode de calcul"
              tooltip={TAX_TOOLTIPS.capitalGainMode}
            >
              <Select
                value={taxConfig.capitalGainMode}
                onValueChange={(v: 'simple' | 'advanced') => updateTax({ capitalGainMode: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple (taux global)</SelectItem>
                  <SelectItem value="advanced">Avancé (abattements durée)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField 
              label="Taux global plus-value (%)"
              tooltip={TAX_TOOLTIPS.capitalGainRate}
            >
              <NumericInput
                value={taxConfig.capitalGainRate}
                onChange={(v) => updateTax({ capitalGainRate: v })}
                suffix="%"
                step={0.1}
                min={0}
                max={50}
              />
            </FormField>
          </div>

          {taxConfig.capitalGainMode === 'advanced' && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                En mode avancé, les abattements pour durée de détention seront calculés automatiquement
                lors de la simulation de revente (6% par an dès la 6ème année pour l'IR, 
                1.65% à 9% pour les PS).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Mode fiscal</p>
              <p className="text-lg font-bold text-foreground capitalize">
                {taxConfig.taxMode === 'override' ? 'Manuel' : taxConfig.taxMode}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Régime</p>
              <p className="text-lg font-bold text-foreground">
                {TAX_REGIMES_CONFIG.find(r => r.key === taxConfig.regimeKey)?.label || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taux global</p>
              <p className="text-lg font-bold text-foreground">
                {taxConfig.tmiRate + taxConfig.socialRate}%
              </p>
            </div>
            <div className="border-l border-primary/20 pl-4">
              <p className="text-sm text-muted-foreground">Impôt estimé</p>
              <p className="text-xl font-bold text-primary">
                {estimatedTax.toLocaleString('fr-FR')} €/an
              </p>
              <p className="text-xs text-muted-foreground">
                soit {Math.round(estimatedTax / 12).toLocaleString('fr-FR')} €/mois
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
