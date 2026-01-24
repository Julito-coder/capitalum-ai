import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { createProject } from "@/lib/realEstateService";
import { WizardState, WIZARD_STEPS, TAX_REGIMES } from "@/lib/realEstateTypes";
import { estimateNotaryFees } from "@/lib/simulationEngine";
import { ArrowLeft, ArrowRight, Check, Building2, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const NewSimulation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<'essential' | 'advanced'>('essential');
  
  const [state, setState] = useState<WizardState>({
    currentStep: 0,
    mode: 'essential',
    project: { type: 'LOCATIF', title: '', surface_m2: 50, rooms: 2, horizon_years: 20, strategy: 'nu', ownership_type: 'personal', property_type: 'apartment', is_new: false },
    acquisition: { price_net_seller: 200000, agency_fee_amount: 0, notary_fee_amount: 15000, works_amount: 0, furniture_amount: 0, bank_fees: 500, guarantee_fees: 2000 },
    financing: { down_payment: 30000, loan_amount: 187500, duration_months: 240, nominal_rate: 3.5, insurance_mode: 'percentage', insurance_value: 0.3, deferment_type: 'none', deferment_months: 0 },
    rental: { rent_monthly: 900, vacancy_rate: 5, default_rate: 2, rent_growth_rate: 1, is_seasonal: false },
    owner_occupier: { avoided_rent_monthly: 1200, value_growth_rate: 2, scenario_type: 'base' },
    operating_costs: { property_tax_annual: 1000, condo_nonrecoverable_annual: 1200, insurance_annual: 150, maintenance_mode: 'percentage', maintenance_value: 5, management_pct: 8, accounting_annual: 300, costs_growth_rate: 2 },
    tax_config: { tax_mode: 'simple', tmi_rate: 30, social_rate: 17.2, regime_key: 'micro_foncier', amortization_enabled: false, interest_deductible: true, costs_deductible: true },
    sale_data: { resale_year: 20, property_growth_rate: 2, resale_agency_pct: 5, capital_gain_tax_rate: 36.2 },
  });

  const updateState = (section: keyof WizardState, field: string, value: unknown) => {
    setState(prev => ({
      ...prev,
      [section]: { ...(prev[section] as object), [field]: value }
    }));
  };

  const handlePriceChange = (price: number) => {
    const notary = estimateNotaryFees(price, state.project.is_new || false);
    const total = price + (state.acquisition.agency_fee_amount || 0) + notary + (state.acquisition.works_amount || 0);
    const loan = total - (state.financing.down_payment || 0);
    updateState('acquisition', 'price_net_seller', price);
    updateState('acquisition', 'notary_fee_amount', notary);
    updateState('financing', 'loan_amount', loan);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const projectId = await createProject(user.id, state);
      toast.success("Simulation créée avec succès");
      navigate(`/simulator/${projectId}`);
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/simulator")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Nouvelle simulation</h1>
            <p className="text-sm text-muted-foreground">{WIZARD_STEPS[currentStep].title} — {WIZARD_STEPS[currentStep].description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mode</span>
            <Switch checked={mode === 'advanced'} onCheckedChange={(c) => setMode(c ? 'advanced' : 'essential')} />
            <span className="text-sm font-medium">{mode === 'advanced' ? 'Avancé' : 'Essentiel'}</span>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Step 0: Project */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" className={`p-4 border rounded-lg flex flex-col items-center gap-2 hover:border-primary transition ${state.project.type === 'LOCATIF' ? 'border-primary bg-primary/5' : ''}`} onClick={() => updateState('project', 'type', 'LOCATIF')}>
                    <Building2 className="h-8 w-8" />
                    <span className="font-medium">Locatif</span>
                  </button>
                  <button type="button" className={`p-4 border rounded-lg flex flex-col items-center gap-2 hover:border-primary transition ${state.project.type === 'RP' ? 'border-primary bg-primary/5' : ''}`} onClick={() => updateState('project', 'type', 'RP')}>
                    <Home className="h-8 w-8" />
                    <span className="font-medium">Résidence Principale</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Titre du projet</Label><Input value={state.project.title} onChange={(e) => updateState('project', 'title', e.target.value)} placeholder="Ex: T2 Lyon 7ème" /></div>
                  <div><Label>Ville</Label><Input value={state.project.city || ''} onChange={(e) => updateState('project', 'city', e.target.value)} placeholder="Lyon" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Surface (m²)</Label><Input type="number" value={state.project.surface_m2} onChange={(e) => updateState('project', 'surface_m2', Number(e.target.value))} /></div>
                  <div><Label>Pièces</Label><Input type="number" value={state.project.rooms} onChange={(e) => updateState('project', 'rooms', Number(e.target.value))} /></div>
                  <div><Label>Horizon (ans)</Label><Input type="number" value={state.project.horizon_years} onChange={(e) => updateState('project', 'horizon_years', Number(e.target.value))} /></div>
                </div>
                {state.project.type === 'LOCATIF' && (
                  <div><Label>Stratégie locative</Label>
                    <Select value={state.project.strategy} onValueChange={(v) => updateState('project', 'strategy', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nu">Location nue</SelectItem>
                        <SelectItem value="meuble">Meublé (LMNP)</SelectItem>
                        <SelectItem value="coloc">Colocation</SelectItem>
                        <SelectItem value="saisonnier">Saisonnier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Acquisition */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div><Label>Prix net vendeur (€)</Label><Input type="number" value={state.acquisition.price_net_seller} onChange={(e) => handlePriceChange(Number(e.target.value))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Frais d'agence (€)</Label><Input type="number" value={state.acquisition.agency_fee_amount} onChange={(e) => updateState('acquisition', 'agency_fee_amount', Number(e.target.value))} /></div>
                  <div><Label>Frais de notaire (€)</Label><Input type="number" value={state.acquisition.notary_fee_amount} onChange={(e) => updateState('acquisition', 'notary_fee_amount', Number(e.target.value))} /></div>
                </div>
                {mode === 'advanced' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Travaux (€)</Label><Input type="number" value={state.acquisition.works_amount} onChange={(e) => updateState('acquisition', 'works_amount', Number(e.target.value))} /></div>
                    <div><Label>Mobilier (€)</Label><Input type="number" value={state.acquisition.furniture_amount} onChange={(e) => updateState('acquisition', 'furniture_amount', Number(e.target.value))} /></div>
                  </div>
                )}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Coût total estimé</div>
                  <div className="text-2xl font-bold">{((state.acquisition.price_net_seller || 0) + (state.acquisition.agency_fee_amount || 0) + (state.acquisition.notary_fee_amount || 0) + (state.acquisition.works_amount || 0) + (state.acquisition.furniture_amount || 0)).toLocaleString('fr-FR')} €</div>
                </div>
              </div>
            )}

            {/* Step 2: Financing */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Apport (€)</Label><Input type="number" value={state.financing.down_payment} onChange={(e) => { const dp = Number(e.target.value); updateState('financing', 'down_payment', dp); updateState('financing', 'loan_amount', (state.acquisition.price_net_seller || 0) + (state.acquisition.notary_fee_amount || 0) - dp); }} /></div>
                  <div><Label>Montant emprunté (€)</Label><Input type="number" value={state.financing.loan_amount} onChange={(e) => updateState('financing', 'loan_amount', Number(e.target.value))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Durée (années)</Label><Slider value={[(state.financing.duration_months || 240) / 12]} min={5} max={30} step={1} onValueChange={([v]) => updateState('financing', 'duration_months', v * 12)} /><div className="text-center text-sm mt-1">{(state.financing.duration_months || 240) / 12} ans</div></div>
                  <div><Label>Taux nominal (%)</Label><Input type="number" step="0.1" value={state.financing.nominal_rate} onChange={(e) => updateState('financing', 'nominal_rate', Number(e.target.value))} /></div>
                </div>
                {mode === 'advanced' && (
                  <div><Label>Assurance emprunteur (%/an)</Label><Input type="number" step="0.01" value={state.financing.insurance_value} onChange={(e) => updateState('financing', 'insurance_value', Number(e.target.value))} /></div>
                )}
              </div>
            )}

            {/* Step 3: Income */}
            {currentStep === 3 && state.project.type === 'LOCATIF' && (
              <div className="space-y-4">
                <div><Label>Loyer mensuel HC (€)</Label><Input type="number" value={state.rental.rent_monthly} onChange={(e) => updateState('rental', 'rent_monthly', Number(e.target.value))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Vacance locative (%)</Label><Slider value={[state.rental.vacancy_rate || 5]} min={0} max={20} onValueChange={([v]) => updateState('rental', 'vacancy_rate', v)} /><div className="text-center text-sm">{state.rental.vacancy_rate}%</div></div>
                  <div><Label>Revalorisation loyer (%/an)</Label><Input type="number" step="0.1" value={state.rental.rent_growth_rate} onChange={(e) => updateState('rental', 'rent_growth_rate', Number(e.target.value))} /></div>
                </div>
              </div>
            )}
            {currentStep === 3 && state.project.type === 'RP' && (
              <div className="space-y-4">
                <div><Label>Loyer évité (€/mois)</Label><Input type="number" value={state.owner_occupier.avoided_rent_monthly} onChange={(e) => updateState('owner_occupier', 'avoided_rent_monthly', Number(e.target.value))} /></div>
                <div><Label>Croissance valeur bien (%/an)</Label><Input type="number" step="0.1" value={state.owner_occupier.value_growth_rate} onChange={(e) => updateState('owner_occupier', 'value_growth_rate', Number(e.target.value))} /></div>
              </div>
            )}

            {/* Step 4: Costs */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Taxe foncière (€/an)</Label><Input type="number" value={state.operating_costs.property_tax_annual} onChange={(e) => updateState('operating_costs', 'property_tax_annual', Number(e.target.value))} /></div>
                  <div><Label>Charges copro non récup. (€/an)</Label><Input type="number" value={state.operating_costs.condo_nonrecoverable_annual} onChange={(e) => updateState('operating_costs', 'condo_nonrecoverable_annual', Number(e.target.value))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Assurance PNO (€/an)</Label><Input type="number" value={state.operating_costs.insurance_annual} onChange={(e) => updateState('operating_costs', 'insurance_annual', Number(e.target.value))} /></div>
                  <div><Label>Gestion locative (%)</Label><Input type="number" value={state.operating_costs.management_pct} onChange={(e) => updateState('operating_costs', 'management_pct', Number(e.target.value))} /></div>
                </div>
              </div>
            )}

            {/* Step 5: Tax */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div><Label>Régime fiscal</Label>
                  <Select value={state.tax_config.regime_key} onValueChange={(v) => updateState('tax_config', 'regime_key', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TAX_REGIMES.map(r => <SelectItem key={r.key} value={r.key}>{r.label} — {r.description}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>TMI (%)</Label><Input type="number" value={state.tax_config.tmi_rate} onChange={(e) => updateState('tax_config', 'tmi_rate', Number(e.target.value))} /></div>
                  <div><Label>Prélèvements sociaux (%)</Label><Input type="number" value={state.tax_config.social_rate} onChange={(e) => updateState('tax_config', 'social_rate', Number(e.target.value))} /></div>
                </div>
                {mode === 'advanced' && (state.tax_config.regime_key === 'lmnp_reel' || state.tax_config.regime_key === 'sci_is') && (
                  <div className="flex items-center gap-2">
                    <Switch checked={state.tax_config.amortization_enabled} onCheckedChange={(c) => updateState('tax_config', 'amortization_enabled', c)} />
                    <Label>Activer les amortissements</Label>
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Sale */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div><Label>Année de revente</Label><Slider value={[state.sale_data.resale_year || 20]} min={1} max={30} onValueChange={([v]) => updateState('sale_data', 'resale_year', v)} /><div className="text-center text-sm">{state.sale_data.resale_year} ans</div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Croissance valeur (%/an)</Label><Input type="number" step="0.1" value={state.sale_data.property_growth_rate} onChange={(e) => updateState('sale_data', 'property_growth_rate', Number(e.target.value))} /></div>
                  <div><Label>Frais agence revente (%)</Label><Input type="number" value={state.sale_data.resale_agency_pct} onChange={(e) => updateState('sale_data', 'resale_agency_pct', Number(e.target.value))} /></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />Précédent
          </Button>
          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button onClick={() => setCurrentStep(s => s + 1)}>
              Suivant<ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Créer la simulation
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NewSimulation;
