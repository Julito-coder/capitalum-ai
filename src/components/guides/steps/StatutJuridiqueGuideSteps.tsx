import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { ActionGuide, GuideStep } from '../ActionGuideContext';
import { Building, Scale, CheckCircle2, AlertTriangle, TrendingUp, Shield } from 'lucide-react';

interface StatutComparison {
  id: string;
  label: string;
  chargesSociales: number;
  impots: number;
  netDirigeant: number;
  protection: string;
  avantages: string[];
  inconvenients: string[];
}

const compareStatuts = (profile: UserProfile | null): StatutComparison[] => {
  const ca = profile?.annualRevenueHt || 60000;
  const charges = (profile?.officeRent || 0) + (profile?.vehicleExpenses || 0) + (profile?.professionalSupplies || 0);
  
  // Micro-BNC
  const microBenefice = ca * 0.66;
  const microCharges = ca * 0.22;
  const microIR = microBenefice * 0.20;
  const microNet = ca - microCharges - microIR;

  // EI au réel
  const eiBenefice = ca - charges;
  const eiCharges = eiBenefice * 0.44;
  const eiIR = (eiBenefice - eiCharges) * 0.22;
  const eiNet = eiBenefice - eiCharges - eiIR;

  // EURL IS
  const eurlRemuneration = (ca - charges) * 0.6;
  const eurlCharges = eurlRemuneration * 0.45;
  const eurlIS = ((ca - charges) - eurlRemuneration - eurlCharges) * 0.15;
  const eurlDividendes = ((ca - charges) - eurlRemuneration - eurlCharges - eurlIS) * 0.70;
  const eurlNet = eurlRemuneration * 0.78 + eurlDividendes;

  // SASU
  const sasuRemuneration = (ca - charges) * 0.5;
  const sasuCharges = sasuRemuneration * 0.82;
  const sasuIS = ((ca - charges) - sasuRemuneration - sasuCharges) * 0.15;
  const sasuDividendes = ((ca - charges) - sasuRemuneration - sasuCharges - sasuIS) * 0.70;
  const sasuNet = sasuRemuneration * 0.78 + sasuDividendes;

  return [
    {
      id: 'micro',
      label: 'Micro-entreprise',
      chargesSociales: microCharges,
      impots: microIR,
      netDirigeant: microNet,
      protection: 'Basique',
      avantages: ['Simplicité maximale', 'Pas de comptabilité', 'Cotisations proportionnelles'],
      inconvenients: ['Plafond 77 700€', 'Pas de déduction charges', 'TVA non récupérable']
    },
    {
      id: 'ei_reel',
      label: 'EI Réel',
      chargesSociales: eiCharges,
      impots: eiIR,
      netDirigeant: eiNet,
      protection: 'Basique',
      avantages: ['Déduction des charges', 'Pas de plafond CA', 'Déficit reportable'],
      inconvenients: ['Comptabilité obligatoire', 'Cotisations élevées', 'Responsabilité illimitée']
    },
    {
      id: 'eurl',
      label: 'EURL à l\'IS',
      chargesSociales: eurlCharges,
      impots: eurlIS,
      netDirigeant: eurlNet,
      protection: 'Limitée',
      avantages: ['Responsabilité limitée', 'IS à 15%', 'Optimisation salaire/dividendes'],
      inconvenients: ['Formalisme', 'Coût comptable', 'Cotisations TNS']
    },
    {
      id: 'sasu',
      label: 'SASU',
      chargesSociales: sasuCharges,
      impots: sasuIS,
      netDirigeant: sasuNet,
      protection: 'Complète',
      avantages: ['Protection sociale complète', 'Responsabilité limitée', 'Flexibilité'],
      inconvenients: ['Charges très élevées', 'Formalisme', 'Coûts de gestion']
    }
  ];
};

export const createStatutJuridiqueGuide = (profile: UserProfile | null): ActionGuide => {
  const currentStatus = profile?.fiscalStatus || 'micro';
  const statuts = compareStatuts(profile);
  const currentStatut = statuts.find(s => s.id === currentStatus) || statuts[0];
  const bestStatut = statuts.reduce((best, s) => s.netDirigeant > best.netDirigeant ? s : best);
  const gainPotentiel = Math.max(0, bestStatut.netDirigeant - currentStatut.netDirigeant);

  const steps: GuideStep[] = [
    {
      id: 'diagnostic',
      title: 'Analyse de votre statut',
      content: (
        <div className="space-y-5">
          {gainPotentiel > 2000 ? (
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-success mb-1">Opportunité détectée</h4>
                  <p className="text-sm text-muted-foreground">
                    Un changement de statut pourrait vous faire gagner {formatCurrency(gainPotentiel)}/an.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-primary mb-1">Statut adapté</h4>
                  <p className="text-sm text-muted-foreground">
                    Votre statut actuel semble optimal pour votre niveau d'activité.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Statut actuel</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Actif
              </span>
            </div>
            <h4 className="text-lg font-semibold mb-1">{currentStatut.label}</h4>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/30 text-xs">
              <div>
                <span className="text-muted-foreground">Charges</span>
                <p className="font-semibold text-destructive">{formatCurrency(currentStatut.chargesSociales)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Impôts</span>
                <p className="font-semibold">{formatCurrency(currentStatut.impots)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Net estimé</span>
                <p className="font-semibold text-success">{formatCurrency(currentStatut.netDirigeant)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Protection sociale : {currentStatut.protection}
            </h4>
            <p className="text-sm text-muted-foreground">
              {currentStatut.protection === 'Complète' 
                ? 'Régime général : retraite, maladie, chômage (ARE possible)'
                : currentStatut.protection === 'Limitée'
                  ? 'TNS : retraite et maladie basiques, pas de chômage'
                  : 'Minimum : couverture maladie, retraite minimale'
              }
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'comparaison',
      title: 'Comparaison des statuts',
      content: (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Simulation basée sur votre CA de {formatCurrency(profile?.annualRevenueHt || 60000)} :
          </p>

          <div className="space-y-3">
            {statuts.map((statut) => {
              const isCurrent = statut.id === currentStatus;
              const isBest = statut.id === bestStatut.id;
              
              return (
                <div
                  key={statut.id}
                  className={`p-4 rounded-xl border ${
                    isCurrent 
                      ? 'bg-primary/5 border-primary/30' 
                      : isBest && !isCurrent
                        ? 'bg-success/5 border-success/30'
                        : 'bg-secondary/30 border-border/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{statut.label}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary">
                          Actuel
                        </span>
                      )}
                      {isBest && !isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-success/20 text-success">
                          Recommandé
                        </span>
                      )}
                    </div>
                    <span className={`text-lg font-bold ${isBest ? 'text-success' : ''}`}>
                      {formatCurrency(statut.netDirigeant)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Charges</span>
                      <p className="font-medium">{formatCurrency(statut.chargesSociales)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Impôts</span>
                      <p className="font-medium">{formatCurrency(statut.impots)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Protection</span>
                      <p className="font-medium">{statut.protection}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {gainPotentiel > 500 && (
            <div className="p-4 rounded-xl bg-success/10 border border-success/30">
              <div className="flex items-center justify-between">
                <span className="font-medium">Gain avec {bestStatut.label}</span>
                <span className="text-lg font-bold text-success">+{formatCurrency(gainPotentiel)}/an</span>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'decision',
      title: 'Aide à la décision',
      content: (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-5 w-5 text-primary" />
              <span className="font-semibold">Critères de choix</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Le meilleur statut dépend de 4 facteurs clés :
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary/50">
              <h5 className="text-sm font-medium mb-1">1. Niveau de CA</h5>
              <p className="text-xs text-muted-foreground">
                &lt; 40k€ → Micro | 40-80k€ → EI Réel ou EURL | &gt; 80k€ → SASU/EURL IS
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <h5 className="text-sm font-medium mb-1">2. Niveau de charges</h5>
              <p className="text-xs text-muted-foreground">
                Charges élevées → Régime réel avantageux pour déduire
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <h5 className="text-sm font-medium mb-1">3. Besoin de protection sociale</h5>
              <p className="text-xs text-muted-foreground">
                Famille, santé fragile → SASU (régime général)
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <h5 className="text-sm font-medium mb-1">4. Stratégie patrimoniale</h5>
              <p className="text-xs text-muted-foreground">
                Capitalisation → Société à l'IS | Revenus immédiats → IR
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-warning">Important</strong> : Un changement de statut a des 
                implications fiscales, sociales et juridiques. Consultez un expert-comptable avant 
                toute décision.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'confirmation',
      title: 'Validation',
      content: (
        <div className="space-y-5">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analyse complétée</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {gainPotentiel > 2000 
                ? `Le passage en ${bestStatut.label} pourrait vous faire gagner ${formatCurrency(gainPotentiel)}/an.`
                : `Votre statut ${currentStatut.label} reste adapté à votre situation actuelle.`
              }
            </p>
          </div>

          {gainPotentiel > 500 && (
            <div className="p-4 rounded-xl bg-success/5 border border-success/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Gain potentiel</span>
                <span className="text-lg font-bold text-success">+{formatCurrency(gainPotentiel)}/an</span>
              </div>
              <div className="h-2 rounded-full bg-success/20 overflow-hidden">
                <div 
                  className="h-full bg-success rounded-full" 
                  style={{ width: `${Math.min(100, (gainPotentiel / (currentStatut.netDirigeant || 1)) * 100)}%` }} 
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Prochaines étapes :</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Prendre RDV avec votre expert-comptable</p>
              <p>• Simuler l'impact sur 3 ans</p>
              <p>• Planifier le changement (idéalement en début d'année)</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return {
    id: 'statut-juridique-analyse',
    title: 'Analyser mon statut',
    category: 'pro',
    estimatedGain: gainPotentiel,
    steps
  };
};
