import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { FormField, NumericInput, SwitchField } from '@/components/simulator/FormField';
import { AdvancedWizardState } from '@/lib/advancedSimulatorTypes';
import { calculateMonthlyPayment, calculateInsurance, generateAmortizationTable } from '@/lib/simulationEngine';
import { Separator } from '@/components/ui/separator';
import { Landmark, Percent, Shield, Clock, Calendar } from 'lucide-react';
import { useEffect } from 'react';

interface FinancingStepProps {
  state: AdvancedWizardState;
  updateState: <K extends keyof AdvancedWizardState>(
    section: K, 
    updates: Partial<AdvancedWizardState[K]>
  ) => void;
  mode: 'essential' | 'advanced';
  totalProjectCost: number;
}

export const FinancingStep = ({ state, updateState, mode, totalProjectCost }: FinancingStepProps) => {
  // Calculate loan amount based on down payment
  useEffect(() => {
    const loanAmount = Math.max(0, totalProjectCost - state.financing.downPayment);
    if (loanAmount !== state.financing.loanAmount) {
      updateState('financing', { loanAmount });
    }
  }, [state.financing.downPayment, totalProjectCost]);

  // Calculate monthly payment and totals
  const calculateFinancingDetails = () => {
    const { loanAmount, nominalRate, durationMonths, insuranceMode, insuranceValue, defermentType, defermentMonths } = state.financing;
    
    const monthlyPaymentBase = calculateMonthlyPayment(loanAmount, nominalRate, durationMonths - defermentMonths);
    const monthlyInsurance = calculateInsurance(
      loanAmount, 
      insuranceMode === 'monthly' ? 'fixed' : 'percentage',
      insuranceMode === 'monthly' ? insuranceValue : insuranceValue
    );
    
    const monthlyTotal = monthlyPaymentBase + monthlyInsurance;
    
    // Generate amortization for totals
    const amortTable = generateAmortizationTable(
      loanAmount,
      nominalRate,
      durationMonths,
      insuranceMode === 'monthly' ? 'fixed' : 'percentage',
      insuranceValue,
      defermentType,
      defermentMonths
    );
    
    const totalInterest = amortTable.reduce((sum, row) => sum + row.interest, 0);
    const totalInsurance = amortTable.reduce((sum, row) => sum + row.insurance, 0);
    const totalCost = loanAmount + totalInterest + totalInsurance;

    return { monthlyPaymentBase, monthlyInsurance, monthlyTotal, totalInterest, totalInsurance, totalCost };
  };

  const { monthlyPaymentBase, monthlyInsurance, monthlyTotal, totalInterest, totalInsurance, totalCost } = calculateFinancingDetails();

  const durationYears = state.financing.durationMonths / 12;

  return (
    <div className="space-y-6">
      {/* Apport et emprunt */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Structure du financement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField 
              label="Apport personnel"
              tooltip={{
                shortTip: "Fonds propres investis dans le projet",
                definition: "L'apport est la somme que vous investissez sans emprunter. Il peut couvrir les frais ou une partie du bien.",
                impact: "Un apport plus élevé réduit le montant emprunté et améliore le cashflow, mais mobilise votre épargne.",
                typicalValue: "10-20% du projet minimum, souvent les frais de notaire.",
                source: "Votre épargne disponible."
              }}
            >
              <NumericInput
                value={state.financing.downPayment}
                onChange={(v) => updateState('financing', { downPayment: v })}
                suffix="€"
              />
            </FormField>

            <FormField label="Montant emprunté">
              <NumericInput
                value={state.financing.loanAmount}
                onChange={(v) => updateState('financing', { loanAmount: v, downPayment: totalProjectCost - v })}
                suffix="€"
              />
            </FormField>
          </div>

          {mode === 'advanced' && (
            <FormField label="Affectation apport">
              <Select
                value={state.financing.downPaymentAllocation}
                onValueChange={(v) => updateState('financing', { downPaymentAllocation: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fees">Frais uniquement (notaire, agence)</SelectItem>
                  <SelectItem value="capital">Capital uniquement</SelectItem>
                  <SelectItem value="mixed">Mixte</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}

          {/* Taux de financement */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taux de financement</span>
              <span className="font-medium">
                {((state.financing.loanAmount / totalProjectCost) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions du prêt */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Conditions du prêt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <FormField label={`Durée: ${durationYears} ans`}>
              <Slider
                value={[durationYears]}
                min={5}
                max={30}
                step={1}
                onValueChange={([v]) => updateState('financing', { durationMonths: v * 12 })}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5 ans</span>
                <span>30 ans</span>
              </div>
            </FormField>

            <FormField 
              label="Taux nominal"
              tooltip={{
                shortTip: "Taux d'intérêt annuel du prêt",
                definition: "Le taux nominal est le taux d'intérêt de base du prêt, avant assurance et frais.",
                impact: "Détermine le coût des intérêts et la mensualité. +0.5% peut représenter des milliers d'euros sur la durée.",
                typicalValue: "3-4% en 2024 pour un prêt immobilier classique.",
                source: "Offre de prêt de votre banque ou courtier."
              }}
            >
              <div className="flex items-center gap-2">
                <Slider
                  value={[state.financing.nominalRate]}
                  min={0.5}
                  max={8}
                  step={0.1}
                  onValueChange={([v]) => updateState('financing', { nominalRate: v })}
                  className="flex-1"
                />
                <span className="text-lg font-bold min-w-[60px] text-right">
                  {state.financing.nominalRate.toFixed(2)}%
                </span>
              </div>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Assurance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Assurance emprunteur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField 
            label="Mode de calcul"
            tooltip={{
              shortTip: "Comment l'assurance est calculée",
              definition: "L'assurance peut être calculée sur le capital initial (stable) ou sur le capital restant dû (décroissante).",
              impact: "L'assurance sur CRD coûte moins cher au total mais plus en début de prêt. L'assurance fixe est plus prévisible.",
              typicalValue: "0.10% à 0.40% selon l'âge et la santé.",
              source: "Devis assurance emprunteur."
            }}
          >
            <Select
              value={state.financing.insuranceMode}
              onValueChange={(v) => updateState('financing', { insuranceMode: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Montant fixe mensuel (€/mois)</SelectItem>
                <SelectItem value="initial_percent">% du capital initial</SelectItem>
                <SelectItem value="crd_percent">% du capital restant dû</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={state.financing.insuranceMode === 'monthly' ? 'Montant mensuel' : 'Taux annuel'}>
            <NumericInput
              value={state.financing.insuranceValue}
              onChange={(v) => updateState('financing', { insuranceValue: v })}
              suffix={state.financing.insuranceMode === 'monthly' ? '€/mois' : '%'}
              step={state.financing.insuranceMode === 'monthly' ? 1 : 0.01}
            />
          </FormField>

          {mode === 'advanced' && (
            <>
              <FormField label="Type de garantie">
                <Select
                  value={state.financing.guaranteeType}
                  onValueChange={(v) => updateState('financing', { guaranteeType: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="surety">Caution (Crédit Logement, etc.)</SelectItem>
                    <SelectItem value="mortgage">Hypothèque</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Coût de la garantie">
                <NumericInput
                  value={state.financing.guaranteeCost}
                  onChange={(v) => updateState('financing', { guaranteeCost: v })}
                  suffix="€"
                />
              </FormField>
            </>
          )}
        </CardContent>
      </Card>

      {/* Différé */}
      {mode === 'advanced' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Différé de remboursement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField 
              label="Type de différé"
              tooltip={{
                shortTip: "Reporter le remboursement du capital",
                definition: "Le différé permet de ne pas rembourser le capital pendant une période donnée. Partiel = vous payez les intérêts. Total = vous ne payez rien mais les intérêts s'ajoutent au capital.",
                impact: "Améliore le cashflow initial mais augmente le coût total du crédit.",
                typicalValue: "0 à 24 mois, souvent utilisé pendant les travaux.",
                source: "Négociation avec la banque."
              }}
            >
              <Select
                value={state.financing.defermentType}
                onValueChange={(v) => updateState('financing', { defermentType: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun différé</SelectItem>
                  <SelectItem value="partial">Différé partiel (intérêts payés)</SelectItem>
                  <SelectItem value="total">Différé total (intérêts capitalisés)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {state.financing.defermentType !== 'none' && (
              <FormField label="Durée du différé (mois)">
                <NumericInput
                  value={state.financing.defermentMonths}
                  onChange={(v) => updateState('financing', { defermentMonths: v })}
                  min={0}
                  max={36}
                />
              </FormField>
            )}
          </CardContent>
        </Card>
      )}

      {/* PTZ pour RP */}
      {state.project.type === 'RP' && mode === 'advanced' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Prêt à Taux Zéro (PTZ)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SwitchField
              label="PTZ éligible"
              checked={state.financing.ptzEnabled}
              onCheckedChange={(c) => updateState('financing', { ptzEnabled: c })}
              description="Sous conditions de revenus et zone"
            />
            {state.financing.ptzEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Montant PTZ">
                  <NumericInput
                    value={state.financing.ptzAmount}
                    onChange={(v) => updateState('financing', { ptzAmount: v })}
                    suffix="€"
                  />
                </FormField>
                <FormField label="Durée PTZ (ans)">
                  <NumericInput
                    value={state.financing.ptzDuration}
                    onChange={(v) => updateState('financing', { ptzDuration: v })}
                    min={0}
                    max={25}
                  />
                </FormField>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Récapitulatif */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Mensualité totale</div>
              <div className="text-3xl font-bold text-primary">
                {Math.round(monthlyTotal).toLocaleString('fr-FR')} €/mois
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                dont {Math.round(monthlyInsurance)}€ d'assurance
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Coût total du crédit</div>
              <div className="text-2xl font-bold">
                {Math.round(totalCost).toLocaleString('fr-FR')} €
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Capital emprunté</div>
              <div className="font-medium">{state.financing.loanAmount.toLocaleString('fr-FR')} €</div>
            </div>
            <div>
              <div className="text-muted-foreground">Total intérêts</div>
              <div className="font-medium">{Math.round(totalInterest).toLocaleString('fr-FR')} €</div>
            </div>
            <div>
              <div className="text-muted-foreground">Total assurance</div>
              <div className="font-medium">{Math.round(totalInsurance).toLocaleString('fr-FR')} €</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
