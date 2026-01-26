import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { createProject, fetchFullProject, recalculateProject } from "@/lib/realEstateService";
import { supabase } from "@/integrations/supabase/client";
import { WizardState, WIZARD_STEPS } from "@/lib/realEstateTypes";
import { AdvancedWizardState, LOCATIF_WIZARD_STEPS, RP_WIZARD_STEPS, getDefaultAdvancedState } from "@/lib/advancedSimulatorTypes";
import { WizardStepIndicator } from "@/components/simulator/WizardStepIndicator";
import { ProjectStep } from "@/components/simulator/steps/ProjectStep";
import { AcquisitionStep } from "@/components/simulator/steps/AcquisitionStep";
import { FinancingStep } from "@/components/simulator/steps/FinancingStep";
import { RentalIncomeStep } from "@/components/simulator/steps/RentalIncomeStep";
import { OperatingCostsStep } from "@/components/simulator/steps/OperatingCostsStep";
import { TaxConfigStep } from "@/components/simulator/steps/TaxConfigStep";
import { SaleStep } from "@/components/simulator/steps/SaleStep";
import StressTestsStep from "@/components/simulator/steps/StressTestsStep";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { estimateNotaryFees } from "@/lib/simulationEngine";
import { TAX_REGIMES } from "@/lib/realEstateTypes";

const NewSimulation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = !!editId;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<'essential' | 'advanced'>('essential');
  
  // Advanced state
  const [advState, setAdvState] = useState<AdvancedWizardState>(getDefaultAdvancedState('LOCATIF'));

  // Load existing project data in edit mode
  useEffect(() => {
    if (editId) {
      loadExistingProject(editId);
    }
  }, [editId]);

  const loadExistingProject = async (projectId: string) => {
    try {
      const fullData = await fetchFullProject(projectId);
      if (!fullData) {
        toast.error("Projet introuvable");
        navigate("/simulator");
        return;
      }
      
      const { project, acquisition, financing, rental, owner_occupier, operating_costs, tax_config, sale_data } = fullData;
      
      // Set mode to advanced if complex data
      setMode('advanced');
      
      // Update advanced state with loaded data
      setAdvState({
        project: {
          type: project.type as 'LOCATIF' | 'RP',
          title: project.title || '',
          city: project.city || '',
          postalCode: project.postal_code || '',
          surfaceM2: project.surface_m2 || 50,
          rooms: project.rooms || 2,
          propertyType: (project.property_type as 'apartment' | 'house') || 'apartment',
          isNew: project.is_new || false,
          dpe: project.dpe || undefined,
          floor: project.floor || undefined,
          strategy: (project.strategy as 'nu' | 'meuble' | 'coloc' | 'saisonnier') || 'nu',
          horizonYears: project.horizon_years || 20,
          ownershipType: (project.ownership_type as 'personal' | 'sci' | 'other') || 'personal',
        },
        acquisition: {
          priceNetSeller: acquisition?.price_net_seller || 200000,
          agencyFeePct: acquisition?.agency_fee_pct || 0,
          agencyFeeAmount: acquisition?.agency_fee_amount || 0,
          notaryFeeAmount: acquisition?.notary_fee_amount || 15000,
          notaryFeeEstimated: acquisition?.notary_fee_estimated ?? true,
          worksAmount: acquisition?.works_amount || 0,
          worksScheduleMonths: acquisition?.works_schedule_months || 0,
          furnitureAmount: acquisition?.furniture_amount || 0,
          bankFees: acquisition?.bank_fees || 500,
          guaranteeFees: acquisition?.guarantee_fees || 2000,
          brokerageFees: acquisition?.brokerage_fees || 0,
        },
        financing: {
          downPayment: financing?.down_payment || 30000,
          downPaymentAllocation: (financing?.down_payment_allocation as 'fees' | 'capital' | 'mixed') || 'fees',
          loanAmount: financing?.loan_amount || 170000,
          durationMonths: financing?.duration_months || 240,
          nominalRate: financing?.nominal_rate || 3.5,
          insuranceMode: (financing?.insurance_mode as 'percentage' | 'fixed') || 'percentage',
          insuranceValue: financing?.insurance_value || 0.3,
          defermentType: (financing?.deferment_type as 'none' | 'partial' | 'total') || 'none',
          defermentMonths: financing?.deferment_months || 0,
        },
        rental: {
          rentMonthly: rental?.rent_monthly || 900,
          recoverableCharges: rental?.recoverable_charges || 0,
          vacancyRate: rental?.vacancy_rate || 5,
          defaultRate: rental?.default_rate || 2,
          rentGrowthRate: rental?.rent_growth_rate || 1,
          isSeasonal: rental?.is_seasonal || false,
          seasonalOccupancyRate: rental?.seasonal_occupancy_rate || 70,
          seasonalAvgNight: rental?.seasonal_avg_night || 80,
          seasonalPlatformFees: rental?.seasonal_platform_fees || 15,
          seasonalCleaningFees: rental?.seasonal_cleaning_fees || 30,
        },
        ownerOccupier: {
          avoidedRentMonthly: owner_occupier?.avoided_rent_monthly || 1200,
          valueGrowthRate: owner_occupier?.value_growth_rate || 2,
          scenarioType: (owner_occupier?.scenario_type as 'prudent' | 'base' | 'optimist') || 'base',
          prudentGrowthRate: owner_occupier?.prudent_growth_rate || 1,
          optimistGrowthRate: owner_occupier?.optimist_growth_rate || 3,
        },
        operatingCosts: {
          propertyTaxAnnual: operating_costs?.property_tax_annual || 1000,
          propertyTaxGrowthRate: operating_costs?.property_tax_growth_rate || 2,
          condoNonrecoverableAnnual: operating_costs?.condo_nonrecoverable_annual || 1200,
          insuranceAnnual: operating_costs?.insurance_annual || 150,
          maintenanceMode: (operating_costs?.maintenance_mode as 'percentage' | 'fixed') || 'percentage',
          maintenanceValue: operating_costs?.maintenance_value || 5,
          managementPct: operating_costs?.management_pct || 8,
          lettingFeesAnnual: operating_costs?.letting_fees_annual || 0,
          accountingAnnual: operating_costs?.accounting_annual || 300,
          cfeAnnual: operating_costs?.cfe_annual || 0,
          utilitiesAnnual: operating_costs?.utilities_annual || 0,
          otherCosts: (operating_costs?.other_costs as { name: string; amount: number }[]) || [],
          costsGrowthRate: operating_costs?.costs_growth_rate || 2,
        },
        taxConfig: {
          taxMode: (tax_config?.tax_mode as 'simple' | 'advanced' | 'override') || 'simple',
          tmiRate: tax_config?.tmi_rate || 30,
          socialRate: tax_config?.social_rate || 17.2,
          regimeKey: tax_config?.regime_key || 'micro_foncier',
          interestDeductible: tax_config?.interest_deductible ?? true,
          costsDeductible: tax_config?.costs_deductible ?? true,
          amortizationEnabled: tax_config?.amortization_enabled || false,
          amortizationComponents: (tax_config?.amortization_components as { name: string; value_pct: number; duration_years: number }[]) || [],
          deficitEnabled: tax_config?.deficit_enabled || false,
          annualTaxOverride: tax_config?.annual_tax_override || undefined,
          capitalGainMode: (tax_config?.capital_gain_mode as 'simple' | 'advanced') || 'simple',
          capitalGainRate: tax_config?.capital_gain_rate || 36.2,
          exploitationStartDate: tax_config?.exploitation_start_date || undefined,
        },
        saleData: {
          resaleYear: sale_data?.resale_year || 20,
          propertyGrowthRate: sale_data?.property_growth_rate || 2,
          resaleAgencyPct: sale_data?.resale_agency_pct || 5,
          resaleOtherFees: sale_data?.resale_other_fees || 0,
          capitalGainTaxRate: sale_data?.capital_gain_tax_rate || 36.2,
        },
        stressTests: {
          rentHaircut: 10,
          vacancyHaircut: 50,
          rateHaircut: 1,
          costsHaircut: 10,
        },
      });
      
      toast.success("Projet chargé pour modification");
    } catch (error) {
      toast.error("Erreur lors du chargement du projet");
    } finally {
      setInitialLoading(false);
    }
  };

  // Legacy state for essential mode
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

  const updateAdvState = <K extends keyof AdvancedWizardState>(
    section: K, 
    updates: Partial<AdvancedWizardState[K]>
  ) => {
    setAdvState(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

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

  // Calculate total project cost for advanced mode
  const advTotalCost = advState.acquisition.priceNetSeller + 
    (advState.acquisition.agencyFeeMode === 'percentage' 
      ? advState.acquisition.priceNetSeller * (advState.acquisition.agencyFeeValue / 100)
      : advState.acquisition.agencyFeeValue) +
    advState.acquisition.notaryFeeAmount +
    Object.values(advState.acquisition.works).reduce((a, b) => a + b, 0) +
    Object.values(advState.acquisition.furniture).reduce((a, b) => a + b, 0) +
    advState.acquisition.bankFees +
    advState.acquisition.guaranteeFees;

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Convert advanced state to wizard state for submission
      const wizardState: WizardState = mode === 'advanced' ? {
        currentStep: 0,
        mode: 'advanced',
        project: {
          type: advState.project.type,
          title: advState.project.title,
          city: advState.project.city,
          postal_code: advState.project.postalCode,
          surface_m2: advState.project.surfaceM2,
          rooms: advState.project.rooms,
          property_type: advState.project.propertyType === 'building' || advState.project.propertyType === 'commercial' ? 'other' : advState.project.propertyType,
          is_new: advState.project.condition === 'new',
          strategy: advState.rental.locationType,
          horizon_years: advState.saleData.resaleYear,
          ownership_type: 'personal',
        },
        acquisition: {
          price_net_seller: advState.acquisition.priceNetSeller,
          agency_fee_amount: advState.acquisition.agencyFeeMode === 'percentage' 
            ? advState.acquisition.priceNetSeller * (advState.acquisition.agencyFeeValue / 100)
            : advState.acquisition.agencyFeeValue,
          notary_fee_amount: advState.acquisition.notaryFeeAmount,
          works_amount: Object.values(advState.acquisition.works).reduce((a, b) => a + b, 0),
          furniture_amount: Object.values(advState.acquisition.furniture).reduce((a, b) => a + b, 0),
          bank_fees: advState.acquisition.bankFees,
          guarantee_fees: advState.acquisition.guaranteeFees,
        },
        financing: {
          down_payment: advState.financing.downPayment,
          loan_amount: advState.financing.loanAmount,
          duration_months: advState.financing.durationMonths,
          nominal_rate: advState.financing.nominalRate,
          insurance_mode: advState.financing.insuranceMode === 'monthly' ? 'fixed' : 'percentage',
          insurance_value: advState.financing.insuranceValue,
          deferment_type: advState.financing.defermentType,
          deferment_months: advState.financing.defermentMonths,
        },
        rental: {
          rent_monthly: advState.rental.rentMonthly,
          vacancy_rate: advState.rental.vacancyRate,
          default_rate: advState.rental.defaultRate,
          rent_growth_rate: advState.rental.rentGrowthRate,
          is_seasonal: advState.rental.seasonalEnabled,
        },
        owner_occupier: {
          avoided_rent_monthly: advState.ownerOccupier.avoidedRentMonthly,
          value_growth_rate: advState.ownerOccupier.valueGrowthRate,
          scenario_type: advState.ownerOccupier.scenarioType,
        },
        operating_costs: {
          property_tax_annual: advState.operatingCosts.propertyTaxAnnual,
          condo_nonrecoverable_annual: advState.operatingCosts.condoNonRecoverableAnnual,
          insurance_annual: advState.operatingCosts.insurancePNO,
          maintenance_mode: advState.operatingCosts.maintenanceMode,
          maintenance_value: advState.operatingCosts.maintenanceValue,
          management_pct: advState.operatingCosts.managementPct,
          accounting_annual: advState.operatingCosts.accountingAnnual,
          costs_growth_rate: advState.operatingCosts.inflationRate,
        },
        tax_config: {
          tax_mode: advState.taxConfig.taxMode === 'regime' ? 'advanced' : advState.taxConfig.taxMode as 'simple' | 'advanced' | 'override',
          tmi_rate: advState.taxConfig.tmiRate,
          social_rate: advState.taxConfig.socialRate,
          regime_key: advState.taxConfig.regimeKey,
          amortization_enabled: advState.taxConfig.amortizationEnabled,
          interest_deductible: advState.taxConfig.interestDeductible,
          costs_deductible: advState.taxConfig.costsDeductible,
        },
        sale_data: {
          resale_year: advState.saleData.resaleYear,
          property_growth_rate: advState.saleData.propertyGrowthRate,
          resale_agency_pct: advState.saleData.resaleAgencyPct,
          capital_gain_tax_rate: advState.taxConfig.capitalGainRate,
        },
      } : state;

      const projectId = await createProject(user.id, wizardState);
      toast.success("Simulation créée avec succès");
      navigate(`/simulator/${projectId}`);
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const steps = mode === 'advanced' 
    ? (advState.project.type === 'LOCATIF' ? LOCATIF_WIZARD_STEPS : RP_WIZARD_STEPS)
    : WIZARD_STEPS;

  const maxStep = steps.length - 1;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/simulator")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Nouvelle simulation</h1>
            <p className="text-sm text-muted-foreground">
              {steps[currentStep]?.title} — {steps[currentStep]?.description}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
            <span className={`text-sm ${mode === 'essential' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Essentiel
            </span>
            <Switch 
              checked={mode === 'advanced'} 
              onCheckedChange={(c) => {
                setMode(c ? 'advanced' : 'essential');
                setCurrentStep(0);
              }} 
            />
            <span className={`text-sm ${mode === 'advanced' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Avancé
            </span>
          </div>
        </div>

        {/* Step indicator */}
        <WizardStepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={(i) => i <= currentStep && setCurrentStep(i)}
        />

        {/* Content */}
        {mode === 'advanced' ? (
          <div>
            {currentStep === 0 && (
              <ProjectStep state={advState} updateState={updateAdvState} mode={mode} />
            )}
            {currentStep === 1 && (
              <AcquisitionStep state={advState} updateState={updateAdvState} mode={mode} />
            )}
            {currentStep === 2 && (
              <FinancingStep state={advState} updateState={updateAdvState} mode={mode} totalProjectCost={advTotalCost} />
            )}
            {currentStep === 3 && advState.project.type === 'LOCATIF' && (
              <RentalIncomeStep state={advState} updateState={updateAdvState} mode={mode} />
            )}
            {currentStep === 4 && advState.project.type === 'LOCATIF' && (
              <OperatingCostsStep state={advState} updateState={updateAdvState} mode={mode} />
            )}
            {currentStep === 5 && advState.project.type === 'LOCATIF' && (
              <TaxConfigStep state={advState} updateState={updateAdvState} mode={mode} />
            )}
            {currentStep === 6 && advState.project.type === 'LOCATIF' && (
              <SaleStep state={advState} updateState={updateAdvState} mode={mode} />
            )}
            {currentStep === 7 && advState.project.type === 'LOCATIF' && (
              <StressTestsStep 
                data={{
                  rentHaircut: advState.stressSettings.rentHaircut ? -advState.stressSettings.rentHaircut : 0,
                  vacancyHaircut: advState.stressSettings.vacancyIncrease || 0,
                  rateHaircut: advState.stressSettings.rateIncrease || 0,
                  costsHaircut: advState.stressSettings.chargesIncrease || 0,
                  applyAllHaircuts: advState.stressSettings.enabled,
                  useConservativeScenario: false,
                  rentMonthly: advState.rental.rentMonthly,
                  vacancyRate: advState.rental.vacancyRate,
                  nominalRate: advState.financing.nominalRate,
                  operatingCostsAnnual: advState.operatingCosts.propertyTaxAnnual + 
                    advState.operatingCosts.condoNonRecoverableAnnual + 
                    advState.operatingCosts.insurancePNO + 
                    advState.operatingCosts.accountingAnnual,
                  loanAmount: advState.financing.loanAmount,
                  durationMonths: advState.financing.durationMonths,
                }}
                onChange={(updates) => {
                  setAdvState(prev => ({
                    ...prev,
                    stressSettings: {
                      ...prev.stressSettings,
                      rentHaircut: updates.rentHaircut !== undefined ? -updates.rentHaircut : prev.stressSettings.rentHaircut,
                      vacancyIncrease: updates.vacancyHaircut ?? prev.stressSettings.vacancyIncrease,
                      rateIncrease: updates.rateHaircut ?? prev.stressSettings.rateIncrease,
                      chargesIncrease: updates.costsHaircut ?? prev.stressSettings.chargesIncrease,
                      enabled: updates.useConservativeScenario ?? prev.stressSettings.enabled,
                    }
                  }));
                }}
              />
            )}
            {/* RP steps placeholder */}
            {(currentStep >= 3 && advState.project.type === 'RP') && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Étape en cours de développement. Créez la simulation pour voir les résultats.
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Essential mode - existing simple wizard */
          <Card>
            <CardContent className="pt-6 space-y-6">
              
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" className={`p-4 border rounded-lg flex flex-col items-center gap-2 hover:border-primary transition ${state.project.type === 'LOCATIF' ? 'border-primary bg-primary/5' : ''}`} onClick={() => updateState('project', 'type', 'LOCATIF')}>
                      <span className="font-medium">Locatif</span>
                    </button>
                    <button type="button" className={`p-4 border rounded-lg flex flex-col items-center gap-2 hover:border-primary transition ${state.project.type === 'RP' ? 'border-primary bg-primary/5' : ''}`} onClick={() => updateState('project', 'type', 'RP')}>
                      <span className="font-medium">Résidence Principale</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Titre</Label><Input value={state.project.title} onChange={(e) => updateState('project', 'title', e.target.value)} placeholder="Ex: T2 Lyon" /></div>
                    <div><Label>Ville</Label><Input value={state.project.city || ''} onChange={(e) => updateState('project', 'city', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>Surface (m²)</Label><Input type="number" value={state.project.surface_m2} onChange={(e) => updateState('project', 'surface_m2', Number(e.target.value))} /></div>
                    <div><Label>Pièces</Label><Input type="number" value={state.project.rooms} onChange={(e) => updateState('project', 'rooms', Number(e.target.value))} /></div>
                    <div><Label>Horizon (ans)</Label><Input type="number" value={state.project.horizon_years} onChange={(e) => updateState('project', 'horizon_years', Number(e.target.value))} /></div>
                  </div>
                </div>
              )}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div><Label>Prix net vendeur (€)</Label><Input type="number" value={state.acquisition.price_net_seller} onChange={(e) => handlePriceChange(Number(e.target.value))} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Frais d'agence (€)</Label><Input type="number" value={state.acquisition.agency_fee_amount} onChange={(e) => updateState('acquisition', 'agency_fee_amount', Number(e.target.value))} /></div>
                    <div><Label>Frais de notaire (€)</Label><Input type="number" value={state.acquisition.notary_fee_amount} onChange={(e) => updateState('acquisition', 'notary_fee_amount', Number(e.target.value))} /></div>
                  </div>
                </div>
              )}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Apport (€)</Label><Input type="number" value={state.financing.down_payment} onChange={(e) => updateState('financing', 'down_payment', Number(e.target.value))} /></div>
                    <div><Label>Montant emprunté (€)</Label><Input type="number" value={state.financing.loan_amount} onChange={(e) => updateState('financing', 'loan_amount', Number(e.target.value))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Durée ({(state.financing.duration_months || 240) / 12} ans)</Label><Slider value={[(state.financing.duration_months || 240) / 12]} min={5} max={30} step={1} onValueChange={([v]) => updateState('financing', 'duration_months', v * 12)} /></div>
                    <div><Label>Taux (%)</Label><Input type="number" step="0.1" value={state.financing.nominal_rate} onChange={(e) => updateState('financing', 'nominal_rate', Number(e.target.value))} /></div>
                  </div>
                </div>
              )}
              {currentStep === 3 && state.project.type === 'LOCATIF' && (
                <div className="space-y-4">
                  <div><Label>Loyer mensuel (€)</Label><Input type="number" value={state.rental.rent_monthly} onChange={(e) => updateState('rental', 'rent_monthly', Number(e.target.value))} /></div>
                  <div><Label>Vacance (%)</Label><Slider value={[state.rental.vacancy_rate || 5]} min={0} max={20} onValueChange={([v]) => updateState('rental', 'vacancy_rate', v)} /></div>
                </div>
              )}
              {currentStep === 3 && state.project.type === 'RP' && (
                <div className="space-y-4">
                  <div><Label>Loyer évité (€/mois)</Label><Input type="number" value={state.owner_occupier.avoided_rent_monthly} onChange={(e) => updateState('owner_occupier', 'avoided_rent_monthly', Number(e.target.value))} /></div>
                </div>
              )}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Taxe foncière (€/an)</Label><Input type="number" value={state.operating_costs.property_tax_annual} onChange={(e) => updateState('operating_costs', 'property_tax_annual', Number(e.target.value))} /></div>
                    <div><Label>Charges copro (€/an)</Label><Input type="number" value={state.operating_costs.condo_nonrecoverable_annual} onChange={(e) => updateState('operating_costs', 'condo_nonrecoverable_annual', Number(e.target.value))} /></div>
                  </div>
                </div>
              )}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div><Label>Régime fiscal</Label>
                    <Select value={state.tax_config.regime_key} onValueChange={(v) => updateState('tax_config', 'regime_key', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TAX_REGIMES.map(r => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>TMI (%)</Label><Input type="number" value={state.tax_config.tmi_rate} onChange={(e) => updateState('tax_config', 'tmi_rate', Number(e.target.value))} /></div>
                    <div><Label>PS (%)</Label><Input type="number" value={state.tax_config.social_rate} onChange={(e) => updateState('tax_config', 'social_rate', Number(e.target.value))} /></div>
                  </div>
                </div>
              )}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div><Label>Année de revente: {state.sale_data.resale_year} ans</Label><Slider value={[state.sale_data.resale_year || 20]} min={1} max={30} onValueChange={([v]) => updateState('sale_data', 'resale_year', v)} /></div>
                  <div><Label>Croissance valeur (%/an)</Label><Input type="number" step="0.1" value={state.sale_data.property_growth_rate} onChange={(e) => updateState('sale_data', 'property_growth_rate', Number(e.target.value))} /></div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />Précédent
          </Button>
          {currentStep < maxStep ? (
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

