import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { ActionGuide, GuideStep } from '../ActionGuideContext';
import { DollarSign, Calculator, CheckCircle2, TrendingUp, AlertTriangle, Wallet } from 'lucide-react';
import { PartnerRecommendations } from '../PartnerRecommendations';

interface RemunerationScenario {
  id: string;
  label: string;
  salaireBrut: number;
  dividendes: number;
  chargesSociales: number;
  impotSociete: number;
  impotRevenu: number;
  netDirigeant: number;
  coutTotal: number;
}

const calculateScenarios = (profile: UserProfile | null): RemunerationScenario[] => {
  const ca = profile?.annualRevenueHt || 60000;
  const charges = (profile?.officeRent || 0) + (profile?.vehicleExpenses || 0) + (profile?.professionalSupplies || 0);
  const beneficeAvantRemuneration = ca - charges;
  const tmi = 0.30; // TMI estimé
  
  // Scénario 1: 100% Salaire
  const salaire100 = beneficeAvantRemuneration * 0.7;
  const chargesSalaire100 = salaire100 * 0.45;
  const is100 = Math.max(0, beneficeAvantRemuneration - salaire100 - chargesSalaire100) * 0.25;
  const ir100 = salaire100 * 0.78 * tmi; // 78% du brut = net imposable
  const net100 = salaire100 * 0.78 - ir100;

  // Scénario 2: Mix 60% salaire / 40% dividendes
  const salaireMix = beneficeAvantRemuneration * 0.45;
  const chargesMix = salaireMix * 0.45;
  const beneficeNetMix = beneficeAvantRemuneration - salaireMix - chargesMix;
  const isMix = beneficeNetMix * 0.25;
  const dividendesMix = beneficeNetMix - isMix;
  const irMix = (salaireMix * 0.78 * tmi) + (dividendesMix * 0.30); // Flat tax
  const netMix = (salaireMix * 0.78) + (dividendesMix * 0.70) - irMix * 0.5;

  // Scénario 3: Dividendes majoritaires
  const salaireMin = Math.min(beneficeAvantRemuneration * 0.25, 20000);
  const chargesMin = salaireMin * 0.45;
  const beneficeNetDiv = beneficeAvantRemuneration - salaireMin - chargesMin;
  const isDiv = beneficeNetDiv * 0.25;
  const dividendesMax = beneficeNetDiv - isDiv;
  const irDiv = (salaireMin * 0.78 * tmi) + (dividendesMax * 0.30);
  const netDiv = (salaireMin * 0.78) + (dividendesMax * 0.70) - irDiv * 0.3;

  return [
    {
      id: 'salaire_100',
      label: '100% Salaire',
      salaireBrut: salaire100,
      dividendes: 0,
      chargesSociales: chargesSalaire100,
      impotSociete: is100,
      impotRevenu: ir100,
      netDirigeant: net100,
      coutTotal: salaire100 + chargesSalaire100 + is100
    },
    {
      id: 'mix_60_40',
      label: 'Mix 60/40',
      salaireBrut: salaireMix,
      dividendes: dividendesMix,
      chargesSociales: chargesMix,
      impotSociete: isMix,
      impotRevenu: irMix,
      netDirigeant: netMix,
      coutTotal: salaireMix + chargesMix + isMix
    },
    {
      id: 'dividendes_max',
      label: 'Dividendes max',
      salaireBrut: salaireMin,
      dividendes: dividendesMax,
      chargesSociales: chargesMin,
      impotSociete: isDiv,
      impotRevenu: irDiv,
      netDirigeant: netDiv,
      coutTotal: salaireMin + chargesMin + isDiv
    }
  ];
};

export const createRemunerationGuide = (profile: UserProfile | null): ActionGuide => {
  const scenarios = calculateScenarios(profile);
  const currentNet = profile?.annualRevenueHt ? (profile.annualRevenueHt - (profile.socialChargesPaid || 0)) * 0.7 : 0;
  const bestScenario = scenarios.reduce((best, s) => s.netDirigeant > best.netDirigeant ? s : best);
  const potentialGain = Math.max(0, bestScenario.netDirigeant - currentNet);
  const fiscalStatus = profile?.fiscalStatus || 'micro';

  const steps: GuideStep[] = [
    {
      id: 'diagnostic',
      title: 'Diagnostic de votre rémunération',
      content: (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-warning mb-1">Signal détecté</h4>
                <p className="text-sm text-muted-foreground">
                  Votre structure de rémunération actuelle n'est pas optimisée pour votre niveau de CA.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Les 3 piliers de la rémunération du dirigeant
            </h4>
            <div className="grid gap-3">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                <span className="text-sm font-medium">1. Salaire</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Protection sociale (retraite, maladie), mais charges élevées (~45%)
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                <span className="text-sm font-medium">2. Dividendes</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Flat tax à 30%, mais aucune protection sociale
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                <span className="text-sm font-medium">3. Avantages en nature</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Véhicule, téléphone, frais de déplacement optimisés
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm">
              <strong>L'équilibre optimal</strong> dépend de votre TMI, votre besoin de protection sociale, 
              et votre stratégie patrimoniale (épargne vs revenus immédiats).
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'simulation',
      title: 'Simulation personnalisée',
      content: (
        <div className="space-y-5">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Bénéfice disponible</span>
            <span className="font-semibold">{formatCurrency(profile?.annualRevenueHt || 60000)}</span>
          </div>

          <div className="space-y-3">
            {scenarios.map((scenario, index) => {
              const isBest = scenario.id === bestScenario.id;
              return (
                <div
                  key={scenario.id}
                  className={`p-4 rounded-xl border ${
                    isBest 
                      ? 'bg-success/5 border-success/30' 
                      : 'bg-secondary/30 border-border/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isBest ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isBest ? '✓ Recommandé' : `Option ${index + 1}`}
                      </span>
                      <span className="font-medium">{scenario.label}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">Salaire brut</span>
                      <p className="font-medium">{formatCurrency(scenario.salaireBrut)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dividendes</span>
                      <p className="font-medium">{formatCurrency(scenario.dividendes)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Charges sociales</span>
                      <p className="font-medium text-destructive">{formatCurrency(scenario.chargesSociales)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">IS + IR</span>
                      <p className="font-medium">{formatCurrency(scenario.impotSociete + scenario.impotRevenu)}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/30 flex items-center justify-between">
                    <span className="text-sm font-medium">Net dirigeant</span>
                    <span className={`text-lg font-bold ${isBest ? 'text-success' : ''}`}>
                      {formatCurrency(scenario.netDirigeant)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {potentialGain > 1000 && (
            <div className="p-4 rounded-xl bg-success/10 border border-success/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                <span className="font-semibold text-success">
                  Gain potentiel : +{formatCurrency(potentialGain)}/an
                </span>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'action',
      title: 'Plan d\'action',
      content: (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">Scénario recommandé : {bestScenario.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Ce scénario maximise votre revenu net tout en maintenant une protection sociale correcte.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Checklist d'exécution</h4>
            
            <div className="space-y-2">
              {fiscalStatus === 'micro' ? (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <div>
                      <p className="text-sm font-medium">Évaluer le passage en société</p>
                      <p className="text-xs text-muted-foreground">L'optimisation salaire/dividendes nécessite une structure type SASU ou EURL</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <div>
                      <p className="text-sm font-medium">Consulter un expert-comptable</p>
                      <p className="text-xs text-muted-foreground">Valider le scénario avec votre comptable avant mise en œuvre</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <div>
                      <p className="text-sm font-medium">Définir le montant de rémunération mensuelle</p>
                      <p className="text-xs text-muted-foreground">Salaire brut recommandé : {formatCurrency(bestScenario.salaireBrut / 12)}/mois</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <div>
                      <p className="text-sm font-medium">Planifier la distribution de dividendes</p>
                      <p className="text-xs text-muted-foreground">Idéalement après clôture de l'exercice, en juin-juillet</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</div>
                    <div>
                      <p className="text-sm font-medium">Vérifier la trésorerie disponible</p>
                      <p className="text-xs text-muted-foreground">Conserver 3 mois de charges en réserve minimum</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-warning">Attention URSSAF</strong> : Un ratio dividendes/salaire trop élevé 
                peut être requalifié. Maintenez au moins 20-25% en salaire.
              </p>
            </div>
          </div>

          <h4 className="font-medium mt-2">Experts-comptables en ligne</h4>
          <PartnerRecommendations type="comptabilite" profile={profile} campaign="remuneration_guide" />
        </div>
      )
    },
    {
      id: 'confirmation',
      title: 'Validation',
      content: (
        <div className="space-y-5">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Optimisation initiée</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              En appliquant le scénario "{bestScenario.label}", tu peux améliorer votre revenu net de {formatCurrency(potentialGain)}/an.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-success/5 border border-success/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Impact estimé</span>
              <span className="text-lg font-bold text-success">+{formatCurrency(potentialGain)}/an</span>
            </div>
            <div className="h-2 rounded-full bg-success/20 overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: '75%' }} />
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Confirmez pour mettre à jour votre tableau de bord.</p>
          </div>
        </div>
      )
    }
  ];

  return {
    id: 'remuneration-optimisation',
    title: 'Optimiser ma rémunération',
    category: 'pro',
    estimatedGain: potentialGain,
    steps
  };
};
