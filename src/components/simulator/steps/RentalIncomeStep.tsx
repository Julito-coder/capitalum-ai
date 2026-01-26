import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdvancedWizardState } from '@/lib/advancedSimulatorTypes';
import { FormField, NumericInput, SwitchField } from '../FormField';
import { RENTAL_TOOLTIPS } from '../tooltips/rentalTooltips';
import { Home, Building, Users, Palmtree, TrendingUp, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface RentalIncomeStepProps {
  state: AdvancedWizardState;
  updateState: <K extends keyof AdvancedWizardState>(
    section: K,
    updates: Partial<AdvancedWizardState[K]>
  ) => void;
  mode: 'essential' | 'advanced';
}

const LOCATION_TYPES = [
  { value: 'nu', label: 'Location nue', icon: Home, description: 'Logement vide' },
  { value: 'meuble', label: 'Meublé', icon: Building, description: 'LMNP/LMP' },
  { value: 'coloc', label: 'Colocation', icon: Users, description: 'Loyers par chambre' },
  { value: 'saisonnier', label: 'Saisonnier', icon: Palmtree, description: 'Airbnb, Booking...' },
] as const;

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export const RentalIncomeStep = ({ state, updateState }: RentalIncomeStepProps) => {
  const rental = state.rental;

  const updateRental = (updates: Partial<AdvancedWizardState['rental']>) => {
    updateState('rental', updates);
  };

  const updateSeasonalCoeff = (index: number, value: number) => {
    const newCoeffs = [...rental.seasonalCoefficients];
    newCoeffs[index] = value;
    updateRental({ seasonalCoefficients: newCoeffs });
  };

  // Calculate estimated annual income
  const estimatedAnnualRent = rental.seasonalEnabled
    ? rental.nightlyRate * 365 * (rental.occupancyRate / 100)
    : rental.rentMonthly * 12;
  
  const vacancyLoss = rental.seasonalEnabled 
    ? 0 
    : estimatedAnnualRent * (rental.vacancyRate / 100);
  
  const defaultLoss = estimatedAnnualRent * (rental.defaultRate / 100);
  const netAnnualRent = estimatedAnnualRent - vacancyLoss - defaultLoss;

  return (
    <div className="space-y-6">
      {/* Location Type Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Type de location
          </CardTitle>
          <CardDescription>Choisissez la stratégie locative pour ce bien</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {LOCATION_TYPES.map(({ value, label, icon: Icon, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateRental({ 
                  locationType: value,
                  seasonalEnabled: value === 'saisonnier'
                })}
                className={`p-4 border rounded-lg flex flex-col items-center gap-2 hover:border-primary transition-all ${
                  rental.locationType === value 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                    : 'border-border'
                }`}
              >
                <Icon className={`h-6 w-6 ${rental.locationType === value ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Standard Rental Income - shown for nu, meuble, coloc */}
      {!rental.seasonalEnabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenus locatifs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                label={rental.locationType === 'coloc' ? "Loyer par chambre (€/mois)" : "Loyer mensuel HC (€)"}
                tooltip={RENTAL_TOOLTIPS.rentMonthly}
                required
              >
                <NumericInput
                  value={rental.rentMonthly}
                  onChange={(v) => updateRental({ rentMonthly: v })}
                  suffix="€"
                  min={0}
                />
              </FormField>

              {rental.locationType === 'coloc' && (
                <FormField 
                  label="Nombre de chambres louées"
                  tooltip={RENTAL_TOOLTIPS.roomsRented}
                >
                  <NumericInput
                    value={rental.rentPerRoom || state.project.rooms}
                    onChange={(v) => updateRental({ rentPerRoom: v })}
                    min={1}
                    max={10}
                  />
                </FormField>
              )}

              <FormField 
                label="Charges récupérables (€/mois)"
                tooltip={RENTAL_TOOLTIPS.recoverableCharges}
              >
                <NumericInput
                  value={rental.recoverableCharges}
                  onChange={(v) => updateRental({ recoverableCharges: v })}
                  suffix="€"
                  min={0}
                />
              </FormField>

              <FormField 
                label="Revalorisation annuelle (%)"
                tooltip={RENTAL_TOOLTIPS.rentGrowthRate}
              >
                <NumericInput
                  value={rental.rentGrowthRate}
                  onChange={(v) => updateRental({ rentGrowthRate: v })}
                  suffix="%"
                  step={0.1}
                  min={0}
                  max={10}
                />
              </FormField>
            </div>

            <Separator />

            {/* Vacancy & Default */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Risques locatifs
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField 
                  label={`Vacance locative (${rental.vacancyRate}%)`}
                  tooltip={RENTAL_TOOLTIPS.vacancyRate}
                >
                  <Slider
                    value={[rental.vacancyRate]}
                    onValueChange={([v]) => updateRental({ vacancyRate: v })}
                    min={0}
                    max={25}
                    step={1}
                    className="mt-2 [&_[role=slider]]:bg-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ≈ {Math.round(rental.vacancyRate * 365 / 100)} jours/an
                  </p>
                </FormField>

                <FormField 
                  label={`Impayés (${rental.defaultRate}%)`}
                  tooltip={RENTAL_TOOLTIPS.defaultRate}
                >
                  <Slider
                    value={[rental.defaultRate]}
                    onValueChange={([v]) => updateRental({ defaultRate: v })}
                    min={0}
                    max={10}
                    step={0.5}
                    className="mt-2"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField 
                  label="Frais de relocation (€)"
                  tooltip={RENTAL_TOOLTIPS.relocationCost}
                >
                  <NumericInput
                    value={rental.relocationCost}
                    onChange={(v) => updateRental({ relocationCost: v })}
                    suffix="€"
                    min={0}
                  />
                </FormField>

                <FormField 
                  label="Fréquence relocation (années)"
                  tooltip={RENTAL_TOOLTIPS.relocationFrequency}
                >
                  <NumericInput
                    value={rental.relocationFrequencyYears}
                    onChange={(v) => updateRental({ relocationFrequencyYears: v })}
                    suffix="ans"
                    min={1}
                    max={10}
                  />
                </FormField>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seasonal Rental - shown for saisonnier */}
      {rental.seasonalEnabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palmtree className="h-5 w-5 text-primary" />
              Location saisonnière
            </CardTitle>
            <CardDescription>Configurez vos tarifs et taux d'occupation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField 
                label="Tarif nuitée moyen (€)"
                tooltip={RENTAL_TOOLTIPS.nightlyRate}
                required
              >
                <NumericInput
                  value={rental.nightlyRate}
                  onChange={(v) => updateRental({ nightlyRate: v })}
                  suffix="€"
                  min={0}
                />
              </FormField>

              <FormField 
                label={`Taux d'occupation (${rental.occupancyRate}%)`}
                tooltip={RENTAL_TOOLTIPS.occupancyRate}
                required
              >
                <Slider
                  value={[rental.occupancyRate]}
                  onValueChange={([v]) => updateRental({ occupancyRate: v })}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {Math.round(rental.occupancyRate * 365 / 100)} nuits/an
                </p>
              </FormField>

              <FormField 
                label="Frais plateforme (%)"
                tooltip={RENTAL_TOOLTIPS.platformFees}
              >
                <NumericInput
                  value={rental.platformFeesPct}
                  onChange={(v) => updateRental({ platformFeesPct: v })}
                  suffix="%"
                  min={0}
                  max={30}
                />
              </FormField>
            </div>

            <Separator />

            {/* Seasonality coefficients */}
            <div className="space-y-3">
              <FormField 
                label="Coefficients de saisonnalité"
                tooltip={RENTAL_TOOLTIPS.seasonalCoefficients}
              >
                <p className="text-xs text-muted-foreground mb-3">
                  Ajustez le coefficient multiplicateur pour chaque mois (1.0 = tarif de base)
                </p>
              </FormField>
              
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {MONTHS.map((month, i) => (
                  <div key={month} className="text-center">
                    <Label className="text-xs text-muted-foreground">{month}</Label>
                    <NumericInput
                      value={rental.seasonalCoefficients[i]}
                      onChange={(v) => updateSeasonalCoeff(i, v)}
                      step={0.1}
                      min={0.1}
                      max={3}
                      className="text-center text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Operating costs for seasonal */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Charges d'exploitation saisonnière</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField 
                  label="Ménage par séjour (€)"
                  tooltip={RENTAL_TOOLTIPS.cleaningFee}
                >
                  <NumericInput
                    value={rental.cleaningFeePerStay}
                    onChange={(v) => updateRental({ cleaningFeePerStay: v })}
                    suffix="€"
                    min={0}
                  />
                </FormField>

                <FormField 
                  label="Linge (€/mois)"
                  tooltip={RENTAL_TOOLTIPS.linenCost}
                >
                  <NumericInput
                    value={rental.linenCost}
                    onChange={(v) => updateRental({ linenCost: v })}
                    suffix="€"
                    min={0}
                  />
                </FormField>

                <FormField 
                  label="Check-in (€/mois)"
                  tooltip={RENTAL_TOOLTIPS.checkInCost}
                >
                  <NumericInput
                    value={rental.checkInCost}
                    onChange={(v) => updateRental({ checkInCost: v })}
                    suffix="€"
                    min={0}
                  />
                </FormField>

                <FormField 
                  label="Consommations (€/mois)"
                  tooltip={RENTAL_TOOLTIPS.utilitiesCost}
                >
                  <NumericInput
                    value={rental.utilitiesCost}
                    onChange={(v) => updateRental({ utilitiesCost: v })}
                    suffix="€"
                    min={0}
                  />
                </FormField>

                <FormField 
                  label="Conciergerie (%)"
                  tooltip={RENTAL_TOOLTIPS.conciergerie}
                >
                  <NumericInput
                    value={rental.conciergeriePct}
                    onChange={(v) => updateRental({ conciergeriePct: v })}
                    suffix="%"
                    min={0}
                    max={30}
                  />
                </FormField>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Revenus bruts annuels</p>
              <p className="text-xl font-bold text-foreground">
                {estimatedAnnualRent.toLocaleString('fr-FR')} €
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Perte vacance</p>
              <p className="text-xl font-bold text-warning">
                -{vacancyLoss.toLocaleString('fr-FR')} €
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Perte impayés</p>
              <p className="text-xl font-bold text-destructive">
                -{defaultLoss.toLocaleString('fr-FR')} €
              </p>
            </div>
            <div className="border-l border-primary/20 pl-4">
              <p className="text-sm text-muted-foreground">Revenus nets estimés</p>
              <p className="text-xl font-bold text-primary">
                {netAnnualRent.toLocaleString('fr-FR')} €
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
