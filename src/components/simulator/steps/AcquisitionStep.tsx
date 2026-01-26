import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField, NumericInput, PercentOrAmountInput, SwitchField } from '@/components/simulator/FormField';
import { AdvancedWizardState } from '@/lib/advancedSimulatorTypes';
import { estimateNotaryFees } from '@/lib/simulationEngine';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Calculator, Hammer, Sofa, Receipt } from 'lucide-react';

interface AcquisitionStepProps {
  state: AdvancedWizardState;
  updateState: <K extends keyof AdvancedWizardState>(
    section: K, 
    updates: Partial<AdvancedWizardState[K]>
  ) => void;
  mode: 'essential' | 'advanced';
}

export const AcquisitionStep = ({ state, updateState, mode }: AcquisitionStepProps) => {
  // Calculate totals
  const calculateTotals = () => {
    const worksTotal = Object.values(state.acquisition.works).reduce((a, b) => a + b, 0);
    const furnitureTotal = Object.values(state.acquisition.furniture).reduce((a, b) => a + b, 0);
    
    const agencyFees = state.acquisition.agencyFeeMode === 'percentage'
      ? state.acquisition.priceNetSeller * (state.acquisition.agencyFeeValue / 100)
      : state.acquisition.agencyFeeValue;
    
    const totalCost = 
      state.acquisition.priceNetSeller +
      agencyFees +
      state.acquisition.notaryFeeAmount +
      worksTotal +
      furnitureTotal +
      state.acquisition.diagnostics +
      state.acquisition.condoDossier +
      state.acquisition.bankFees +
      state.acquisition.guaranteeFees +
      state.acquisition.brokerageFees +
      state.acquisition.otherFees;

    return { worksTotal, furnitureTotal, agencyFees, totalCost };
  };

  const { worksTotal, furnitureTotal, agencyFees, totalCost } = calculateTotals();

  const handlePriceChange = (price: number) => {
    const notaryFees = estimateNotaryFees(price, state.project.condition === 'new');
    updateState('acquisition', { 
      priceNetSeller: price,
      notaryFeeAmount: state.acquisition.notaryFeeEstimated ? notaryFees : state.acquisition.notaryFeeAmount
    });
  };

  return (
    <div className="space-y-6">
      {/* Prix et frais principaux */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Prix d'acquisition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField 
            label="Prix net vendeur" 
            required
            tooltip={{
              shortTip: "Prix affiché hors frais d'agence",
              definition: "Le prix net vendeur est le montant qui revient au vendeur, sans les frais d'agence ni de notaire.",
              impact: "Base de calcul pour les frais de notaire et la rentabilité.",
              typicalValue: "Variable selon le marché local.",
              source: "Annonce immobilière, négociation avec le vendeur."
            }}
          >
            <NumericInput
              value={state.acquisition.priceNetSeller}
              onChange={handlePriceChange}
              suffix="€"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <PercentOrAmountInput
              label="Frais d'agence"
              mode={state.acquisition.agencyFeeMode}
              onModeChange={(m) => updateState('acquisition', { agencyFeeMode: m })}
              value={state.acquisition.agencyFeeValue}
              onChange={(v) => updateState('acquisition', { agencyFeeValue: v })}
              baseAmount={state.acquisition.priceNetSeller}
            />

            <FormField 
              label="Frais de notaire"
              description={state.acquisition.notaryFeeEstimated ? "Estimation automatique" : "Montant personnalisé"}
              tooltip={{
                shortTip: "~7.5% dans l'ancien, ~2.5% dans le neuf",
                definition: "Les frais de notaire incluent les droits de mutation, les émoluments et les frais divers.",
                impact: "Augmentent le coût total et réduisent la rentabilité.",
                typicalValue: "7-8% dans l'ancien, 2-3% dans le neuf.",
                source: "Simulation notariale ou devis du notaire."
              }}
            >
              <div className="flex gap-2">
                <NumericInput
                  value={state.acquisition.notaryFeeAmount}
                  onChange={(v) => updateState('acquisition', { notaryFeeAmount: v, notaryFeeEstimated: false })}
                  suffix="€"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const estimated = estimateNotaryFees(state.acquisition.priceNetSeller, state.project.condition === 'new');
                    updateState('acquisition', { notaryFeeAmount: estimated, notaryFeeEstimated: true });
                  }}
                  className="px-3 py-2 text-xs font-medium rounded-md border hover:bg-muted transition-colors"
                >
                  Auto
                </button>
              </div>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Travaux */}
      {mode === 'advanced' ? (
        <Accordion type="single" collapsible defaultValue={worksTotal > 0 ? "works" : undefined}>
          <AccordionItem value="works" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <Hammer className="h-4 w-4" />
                <span>Travaux</span>
                {worksTotal > 0 && (
                  <span className="ml-2 text-sm text-primary font-normal">
                    {worksTotal.toLocaleString('fr-FR')} €
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'structure', label: 'Structure/Gros œuvre' },
                  { key: 'electrical', label: 'Électricité' },
                  { key: 'plumbing', label: 'Plomberie' },
                  { key: 'flooring', label: 'Sols' },
                  { key: 'painting', label: 'Peinture' },
                  { key: 'kitchen', label: 'Cuisine' },
                  { key: 'bathroom', label: 'Salle de bain' },
                  { key: 'other', label: 'Autres' },
                ].map((item) => (
                  <FormField key={item.key} label={item.label}>
                    <NumericInput
                      value={state.acquisition.works[item.key as keyof typeof state.acquisition.works]}
                      onChange={(v) => updateState('acquisition', { 
                        works: { ...state.acquisition.works, [item.key]: v }
                      })}
                      suffix="€"
                    />
                  </FormField>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <FormField label="Durée travaux (mois)">
                  <NumericInput
                    value={state.acquisition.worksScheduleMonths}
                    onChange={(v) => updateState('acquisition', { worksScheduleMonths: v })}
                    min={0}
                  />
                </FormField>
                <FormField 
                  label="Vacance initiale (mois)"
                  tooltip={{
                    shortTip: "Mois sans revenus après achat",
                    definition: "La période entre l'achat et la première mise en location, pendant laquelle vous n'avez pas de revenus.",
                    impact: "Réduit les revenus de l'année 1 et affecte le cashflow initial.",
                    typicalValue: "1-3 mois pour travaux, 0 si achat occupé.",
                    source: "Estimation selon l'ampleur des travaux."
                  }}
                >
                  <NumericInput
                    value={state.acquisition.initialVacancyMonths}
                    onChange={(v) => updateState('acquisition', { initialVacancyMonths: v })}
                    min={0}
                  />
                </FormField>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <FormField label="Travaux (montant total)">
          <NumericInput
            value={worksTotal}
            onChange={(v) => updateState('acquisition', { 
              works: { ...state.acquisition.works, other: v }
            })}
            suffix="€"
          />
        </FormField>
      )}

      {/* Mobilier (si meublé) */}
      {(state.rental.locationType === 'meuble' || state.rental.locationType === 'saisonnier' || state.rental.locationType === 'coloc') && (
        mode === 'advanced' ? (
          <Accordion type="single" collapsible>
            <AccordionItem value="furniture" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Sofa className="h-4 w-4" />
                  <span>Mobilier & Équipement</span>
                  {furnitureTotal > 0 && (
                    <span className="ml-2 text-sm text-primary font-normal">
                      {furnitureTotal.toLocaleString('fr-FR')} €
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'bedroom', label: 'Chambre' },
                    { key: 'living', label: 'Salon' },
                    { key: 'kitchen', label: 'Cuisine' },
                    { key: 'bathroom', label: 'Salle de bain' },
                    { key: 'appliances', label: 'Électroménager' },
                    { key: 'other', label: 'Autres' },
                  ].map((item) => (
                    <FormField key={item.key} label={item.label}>
                      <NumericInput
                        value={state.acquisition.furniture[item.key as keyof typeof state.acquisition.furniture]}
                        onChange={(v) => updateState('acquisition', { 
                          furniture: { ...state.acquisition.furniture, [item.key]: v }
                        })}
                        suffix="€"
                      />
                    </FormField>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <FormField label="Mobilier & Équipement (total)">
            <NumericInput
              value={furnitureTotal}
              onChange={(v) => updateState('acquisition', { 
                furniture: { ...state.acquisition.furniture, other: v }
              })}
              suffix="€"
            />
          </FormField>
        )
      )}

      {/* Frais divers (mode avancé) */}
      {mode === 'advanced' && (
        <Accordion type="single" collapsible>
          <AccordionItem value="fees" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span>Frais divers</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <FormField label="Diagnostics">
                  <NumericInput
                    value={state.acquisition.diagnostics}
                    onChange={(v) => updateState('acquisition', { diagnostics: v })}
                    suffix="€"
                  />
                </FormField>
                <FormField label="Dossier copro">
                  <NumericInput
                    value={state.acquisition.condoDossier}
                    onChange={(v) => updateState('acquisition', { condoDossier: v })}
                    suffix="€"
                  />
                </FormField>
                <FormField label="Frais dossier banque">
                  <NumericInput
                    value={state.acquisition.bankFees}
                    onChange={(v) => updateState('acquisition', { bankFees: v })}
                    suffix="€"
                  />
                </FormField>
                <FormField label="Garantie (caution)">
                  <NumericInput
                    value={state.acquisition.guaranteeFees}
                    onChange={(v) => updateState('acquisition', { guaranteeFees: v })}
                    suffix="€"
                  />
                </FormField>
                <FormField label="Courtage">
                  <NumericInput
                    value={state.acquisition.brokerageFees}
                    onChange={(v) => updateState('acquisition', { brokerageFees: v })}
                    suffix="€"
                  />
                </FormField>
                <FormField label="Autres frais">
                  <NumericInput
                    value={state.acquisition.otherFees}
                    onChange={(v) => updateState('acquisition', { otherFees: v })}
                    suffix="€"
                  />
                </FormField>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Récapitulatif */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground mb-1">Coût total du projet</div>
          <div className="text-3xl font-bold text-primary">
            {totalCost.toLocaleString('fr-FR')} €
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Prix net</div>
              <div className="font-medium">{state.acquisition.priceNetSeller.toLocaleString('fr-FR')} €</div>
            </div>
            <div>
              <div className="text-muted-foreground">Frais agence</div>
              <div className="font-medium">{Math.round(agencyFees).toLocaleString('fr-FR')} €</div>
            </div>
            <div>
              <div className="text-muted-foreground">Notaire</div>
              <div className="font-medium">{state.acquisition.notaryFeeAmount.toLocaleString('fr-FR')} €</div>
            </div>
            <div>
              <div className="text-muted-foreground">Travaux</div>
              <div className="font-medium">{worksTotal.toLocaleString('fr-FR')} €</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
