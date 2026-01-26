import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { FormField, NumericInput, SwitchField } from '@/components/simulator/FormField';
import { FIELD_TOOLTIPS } from '@/components/simulator/FieldTooltip';
import { AdvancedWizardState } from '@/lib/advancedSimulatorTypes';
import { fetchZones } from '@/lib/realEstateService';
import { ZoneData } from '@/lib/realEstateTypes';
import { estimateNotaryFees } from '@/lib/simulationEngine';
import { Building2, Home, MapPin, Search, Ruler, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectStepProps {
  state: AdvancedWizardState;
  updateState: <K extends keyof AdvancedWizardState>(
    section: K, 
    updates: Partial<AdvancedWizardState[K]>
  ) => void;
  mode: 'essential' | 'advanced';
}

export const ProjectStep = ({ state, updateState, mode }: ProjectStepProps) => {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [filteredZones, setFilteredZones] = useState<ZoneData[]>([]);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);

  useEffect(() => {
    fetchZones().then(setZones).catch(console.error);
  }, []);

  const handleCityChange = (city: string) => {
    updateState('project', { city });
    
    // Filter zones for autocomplete
    if (city.length >= 2) {
      const matches = zones.filter(z => 
        z.city.toLowerCase().includes(city.toLowerCase())
      ).slice(0, 5);
      setFilteredZones(matches);
      setShowZoneDropdown(matches.length > 0);
    } else {
      setShowZoneDropdown(false);
    }
  };

  const selectZone = (zone: ZoneData) => {
    updateState('project', { 
      city: zone.city, 
      zoneId: zone.id,
      postalCode: zone.postal_code_prefix 
    });
    
    // Auto-fill default values from zone
    if (zone.price_per_m2_default && state.project.surfaceM2) {
      const estimatedPrice = zone.price_per_m2_default * state.project.surfaceM2;
      const notaryFees = estimateNotaryFees(estimatedPrice, state.project.condition === 'new');
      updateState('acquisition', {
        priceNetSeller: estimatedPrice,
        notaryFeeAmount: notaryFees,
      });
    }
    if (zone.rent_per_m2_default && state.project.surfaceM2) {
      updateState('rental', {
        rentMonthly: Math.round(zone.rent_per_m2_default * state.project.surfaceM2),
      });
    }
    if (zone.vacancy_default) {
      updateState('rental', { vacancyRate: zone.vacancy_default });
    }
    if (zone.property_tax_estimate) {
      updateState('operatingCosts', { propertyTaxAnnual: zone.property_tax_estimate });
    }
    
    setShowZoneDropdown(false);
    toast.success(`Valeurs par défaut appliquées pour ${zone.city}`);
  };

  return (
    <div className="space-y-6">
      {/* Type de projet */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          className={`p-6 border-2 rounded-xl flex flex-col items-center gap-3 hover:border-primary/50 transition-all ${
            state.project.type === 'LOCATIF' ? 'border-primary bg-primary/5 shadow-lg' : 'border-border'
          }`}
          onClick={() => updateState('project', { type: 'LOCATIF' })}
        >
          <Building2 className={`h-10 w-10 ${state.project.type === 'LOCATIF' ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="font-semibold">Investissement Locatif</span>
          <span className="text-xs text-muted-foreground text-center">Location nue, meublée, colocation, saisonnier</span>
        </button>
        <button
          type="button"
          className={`p-6 border-2 rounded-xl flex flex-col items-center gap-3 hover:border-primary/50 transition-all ${
            state.project.type === 'RP' ? 'border-primary bg-primary/5 shadow-lg' : 'border-border'
          }`}
          onClick={() => updateState('project', { type: 'RP' })}
        >
          <Home className={`h-10 w-10 ${state.project.type === 'RP' ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="font-semibold">Résidence Principale</span>
          <span className="text-xs text-muted-foreground text-center">Achat pour y habiter</span>
        </button>
      </div>

      {/* Informations de base */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informations du bien</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Titre du projet" required>
            <Input
              value={state.project.title}
              onChange={(e) => updateState('project', { title: e.target.value })}
              placeholder="Ex: Studio Bordeaux Centre"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Ville" required>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={state.project.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  onFocus={() => state.project.city.length >= 2 && setShowZoneDropdown(filteredZones.length > 0)}
                  onBlur={() => setTimeout(() => setShowZoneDropdown(false), 200)}
                  placeholder="Paris, Lyon, Marseille..."
                  className="pl-10"
                />
                {showZoneDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-auto">
                    {filteredZones.map((zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-muted flex justify-between items-center"
                        onClick={() => selectZone(zone)}
                      >
                        <span>{zone.city}</span>
                        <span className="text-xs text-muted-foreground">
                          Zone {zone.zone_category} • {zone.price_per_m2_default}€/m²
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FormField>
            {mode === 'advanced' && (
              <FormField label="Code postal">
                <Input
                  value={state.project.postalCode || ''}
                  onChange={(e) => updateState('project', { postalCode: e.target.value })}
                  placeholder="75001"
                />
              </FormField>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField label="Type de bien">
              <Select
                value={state.project.propertyType}
                onValueChange={(v) => updateState('project', { propertyType: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Appartement</SelectItem>
                  <SelectItem value="house">Maison</SelectItem>
                  <SelectItem value="building">Immeuble</SelectItem>
                  <SelectItem value="commercial">Local commercial</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Surface (m²)" required>
              <NumericInput
                value={state.project.surfaceM2}
                onChange={(v) => updateState('project', { surfaceM2: v })}
                suffix="m²"
                min={1}
              />
            </FormField>

            <FormField label="Pièces">
              <NumericInput
                value={state.project.rooms}
                onChange={(v) => updateState('project', { rooms: v })}
                min={1}
                max={20}
              />
            </FormField>

            {mode === 'advanced' && state.project.propertyType === 'building' && (
              <FormField label="Nombre de lots">
                <NumericInput
                  value={state.project.lots || 1}
                  onChange={(v) => updateState('project', { lots: v })}
                  min={1}
                />
              </FormField>
            )}
          </div>

          {/* État du bien */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="État">
              <Select
                value={state.project.condition}
                onValueChange={(v) => updateState('project', { condition: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_refresh">À rafraîchir</SelectItem>
                  <SelectItem value="good">Bon état</SelectItem>
                  <SelectItem value="renovated">Rénové</SelectItem>
                  <SelectItem value="new">Neuf</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {mode === 'advanced' && (
              <FormField label="DPE">
                <Select
                  value={state.project.dpe || 'unknown'}
                  onValueChange={(v) => updateState('project', { dpe: v === 'unknown' ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non renseigné" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Non renseigné</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="E">E</SelectItem>
                    <SelectItem value="F">F (Passoire)</SelectItem>
                    <SelectItem value="G">G (Passoire)</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            )}
          </div>

          {/* Options avancées */}
          {mode === 'advanced' && (
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Étage">
                <NumericInput
                  value={state.project.floor || 0}
                  onChange={(v) => updateState('project', { floor: v })}
                  min={0}
                />
              </FormField>
              <SwitchField
                label="Ascenseur"
                checked={state.project.hasElevator || false}
                onCheckedChange={(c) => updateState('project', { hasElevator: c })}
              />
              <SwitchField
                label="Extérieur"
                checked={state.project.hasExterior || false}
                onCheckedChange={(c) => updateState('project', { hasExterior: c })}
              />
            </div>
          )}

          {/* Encadrement loyers */}
          {state.project.type === 'LOCATIF' && mode === 'advanced' && (
            <SwitchField
              label="Zone encadrement des loyers"
              checked={state.project.rentControl || false}
              onCheckedChange={(c) => updateState('project', { rentControl: c })}
              description="Paris, Lyon, Lille..."
              tooltip={{
                shortTip: "Certaines villes limitent le montant des loyers",
                definition: "L'encadrement des loyers plafonne le loyer que vous pouvez demander dans certaines zones tendues.",
                impact: "Peut limiter la rentabilité mais réduit aussi le risque de vacance.",
                typicalValue: "Paris, Lyon, Lille, Bordeaux, Montpellier et d'autres grandes villes.",
                source: "Préfecture ou site du gouvernement."
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Stratégie locative (si Locatif) */}
      {state.project.type === 'LOCATIF' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stratégie locative</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'nu', label: 'Location nue', desc: 'Bail 3 ans, fiscalité foncière' },
                { key: 'meuble', label: 'Meublé (LMNP)', desc: 'Bail 1 an, amortissements' },
                { key: 'coloc', label: 'Colocation', desc: 'Multi-locataires, +rentable' },
                { key: 'saisonnier', label: 'Saisonnier', desc: 'Airbnb, rotation haute' },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`p-4 border rounded-lg text-left transition-all ${
                    state.rental.locationType === option.key 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/30'
                  }`}
                  onClick={() => updateState('rental', { 
                    locationType: option.key as any,
                    seasonalEnabled: option.key === 'saisonnier'
                  })}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info zone data */}
      {state.project.zoneId && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Valeurs par défaut appliquées</p>
            <p className="text-muted-foreground">
              Prix, loyer et charges pré-remplis selon les données de marché de {state.project.city}. 
              Vous pouvez les modifier dans les étapes suivantes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
