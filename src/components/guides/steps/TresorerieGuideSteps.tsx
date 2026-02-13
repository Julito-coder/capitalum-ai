import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { ActionGuide, GuideStep } from '../ActionGuideContext';
import { Wallet, TrendingUp, CheckCircle2, AlertTriangle, PiggyBank, Building2 } from 'lucide-react';
import { PartnerRecommendations } from '../PartnerRecommendations';

interface TresorerieOption {
  id: string;
  label: string;
  description: string;
  rendement: number;
  liquidite: string;
  risque: string;
  montantRecommande: number;
}

const getTresorerieOptions = (tresorerieDisponible: number): TresorerieOption[] => {
  const seuilSecurite = tresorerieDisponible * 0.25; // 25% en réserve
  const montantOptimisable = tresorerieDisponible - seuilSecurite;

  return [
    {
      id: 'compte_terme',
      label: 'Compte à terme',
      description: 'Capital garanti, taux fixe sur 6-12 mois',
      rendement: 3.5,
      liquidite: '6-12 mois',
      risque: 'Très faible',
      montantRecommande: montantOptimisable * 0.4
    },
    {
      id: 'fonds_monetaire',
      label: 'Fonds monétaire',
      description: 'Liquidité quotidienne, rendement variable',
      rendement: 3.8,
      liquidite: 'Immédiate',
      risque: 'Faible',
      montantRecommande: montantOptimisable * 0.35
    },
    {
      id: 'holding',
      label: 'Remontée en holding',
      description: 'Optimisation fiscale long terme',
      rendement: 0,
      liquidite: 'Long terme',
      risque: 'Moyen',
      montantRecommande: montantOptimisable * 0.25
    }
  ];
};

export const createTresorerieGuide = (profile: UserProfile | null): ActionGuide => {
  const ca = profile?.annualRevenueHt || 60000;
  const charges = (profile?.socialChargesPaid || 0) + (profile?.officeRent || 0);
  const tresorerieEstimee = Math.max((ca - charges) * 0.3, 20000); // Estimation conservatrice
  const options = getTresorerieOptions(tresorerieEstimee);
  const gainPotentiel = options.reduce((sum, opt) => sum + (opt.montantRecommande * opt.rendement / 100), 0);
  const seuilSecurite = tresorerieEstimee * 0.25;

  const steps: GuideStep[] = [
    {
      id: 'diagnostic',
      title: 'Analyse de votre trésorerie',
      content: (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-warning mb-1">Trésorerie dormante détectée</h4>
                <p className="text-sm text-muted-foreground">
                  Votre trésorerie génère peu ou pas de rendement. À 3.5% de rendement moyen, 
                  vous perdez environ {formatCurrency(tresorerieEstimee * 0.035)}/an.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/30 text-center">
              <Wallet className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Trésorerie estimée</p>
              <p className="text-xl font-bold">{formatCurrency(tresorerieEstimee)}</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <PiggyBank className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Réserve sécurité</p>
              <p className="text-xl font-bold">{formatCurrency(seuilSecurite)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Règle d'or de la trésorerie</h4>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm">
                <strong>3 mois de charges</strong> = seuil de sécurité minimum
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Au-delà, l'excédent peut être optimisé sans risque pour l'activité.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-success/5 border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="font-semibold text-success">Montant optimisable</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(tresorerieEstimee - seuilSecurite)}</p>
            <p className="text-xs text-muted-foreground mt-1">Sans impacter votre sécurité financière</p>
          </div>
        </div>
      )
    },
    {
      id: 'options',
      title: 'Options de placement',
      content: (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Voici les 3 stratégies adaptées à votre profil de dirigeant :
          </p>

          <div className="space-y-3">
            {options.map((option) => (
              <div
                key={option.id}
                className="p-4 rounded-xl border border-border/30 bg-secondary/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{option.label}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">
                    {option.rendement}%/an
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{option.description}</p>
                
                <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-border/30">
                  <div>
                    <span className="text-muted-foreground">Liquidité</span>
                    <p className="font-medium">{option.liquidite}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risque</span>
                    <p className="font-medium">{option.risque}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant</span>
                    <p className="font-medium text-primary">{formatCurrency(option.montantRecommande)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-success/10 border border-success/30">
            <div className="flex items-center justify-between">
              <span className="font-medium">Gain annuel estimé</span>
              <span className="text-lg font-bold text-success">+{formatCurrency(gainPotentiel)}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'action',
      title: 'Plan de déploiement',
      content: (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">Stratégie recommandée : Mix sécurisé</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Répartition entre compte à terme et fonds monétaire pour optimiser rendement et liquidité.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Étapes de mise en œuvre</h4>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <div>
                  <p className="text-sm font-medium">Définir le seuil de sécurité</p>
                  <p className="text-xs text-muted-foreground">
                    Conservez {formatCurrency(seuilSecurite)} sur votre compte courant
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <div>
                  <p className="text-sm font-medium">Ouvrir un compte à terme</p>
                  <p className="text-xs text-muted-foreground">
                    Chez votre banque pro ou néobanque (Qonto, Shine, etc.)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <div>
                  <p className="text-sm font-medium">Souscrire un fonds monétaire</p>
                  <p className="text-xs text-muted-foreground">
                    Via votre courtier ou assurance (AXA, Generali, etc.)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">4</div>
                <div>
                  <p className="text-sm font-medium">Planifier les virements</p>
                  <p className="text-xs text-muted-foreground">
                    Automatisez les transferts mensuels vers vos placements
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-info/10 border border-info/20">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-info">Option holding</strong> : Si votre CA dépasse 100k€ et que vous 
                n'avez pas besoin de la trésorerie à court terme, la création d'une holding permet 
                d'optimiser la fiscalité des placements (régime mère-fille).
              </p>
            </div>
          </div>

          <h4 className="font-medium mt-2">Plateformes de placement trésorerie</h4>
          <PartnerRecommendations type="tresorerie" profile={profile} campaign="tresorerie_guide" />
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
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Plan de déploiement validé</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              En déployant votre trésorerie excédentaire, vous générez {formatCurrency(gainPotentiel)} de revenus supplémentaires par an.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-success/5 border border-success/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Rendement annuel estimé</span>
              <span className="text-lg font-bold text-success">+{formatCurrency(gainPotentiel)}</span>
            </div>
            <div className="h-2 rounded-full bg-success/20 overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: '60%' }} />
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
    id: 'tresorerie-optimisation',
    title: 'Optimiser ma trésorerie',
    category: 'pro',
    estimatedGain: gainPotentiel,
    steps
  };
};
