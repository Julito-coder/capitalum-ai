import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { ActionGuide, GuideStep } from '../ActionGuideContext';
import { Receipt, Calculator, CheckCircle2, AlertTriangle, TrendingDown, FileText } from 'lucide-react';
import { PartnerRecommendations } from '../PartnerRecommendations';

interface OptimisationIS {
  id: string;
  label: string;
  description: string;
  economie: number;
  complexite: 'facile' | 'moyen' | 'avancé';
  applicable: boolean;
}

const getOptimisationsIS = (profile: UserProfile | null): OptimisationIS[] => {
  const ca = profile?.annualRevenueHt || 60000;
  const benefice = ca * 0.4; // Estimation simplifiée
  const isEstime = benefice * 0.25;

  const optimisations: OptimisationIS[] = [
    {
      id: 'per_entreprise',
      label: 'PER Entreprise (Article 83)',
      description: 'Versements patronaux déductibles du résultat',
      economie: Math.min(benefice * 0.08, 8000) * 0.25,
      complexite: 'moyen',
      applicable: benefice > 30000
    },
    {
      id: 'amortissements',
      label: 'Optimisation des amortissements',
      description: 'Amortissement accéléré des investissements',
      economie: Math.min(benefice * 0.05, 3000),
      complexite: 'facile',
      applicable: true
    },
    {
      id: 'provisions',
      label: 'Provisions déductibles',
      description: 'Provisions pour créances douteuses, risques',
      economie: Math.min(benefice * 0.03, 2000),
      complexite: 'moyen',
      applicable: benefice > 20000
    },
    {
      id: 'credits_impot',
      label: 'Crédits d\'impôt',
      description: 'CIR, CII, crédit formation dirigeant',
      economie: Math.min(1500, isEstime * 0.15),
      complexite: 'avancé',
      applicable: true
    },
    {
      id: 'charges_deductibles',
      label: 'Charges professionnelles oubliées',
      description: 'Frais véhicule, repas, téléphonie, abonnements',
      economie: Math.min(benefice * 0.04, 2500),
      complexite: 'facile',
      applicable: true
    }
  ];
  
  return optimisations.filter(opt => opt.applicable);
};

export const createFiscaliteISGuide = (profile: UserProfile | null): ActionGuide => {
  const ca = profile?.annualRevenueHt || 60000;
  const benefice = ca * 0.4;
  const isActuel = benefice * 0.25;
  const optimisations = getOptimisationsIS(profile);
  const economieTotal = optimisations.reduce((sum, opt) => sum + opt.economie, 0);

  const complexiteColors = {
    facile: 'bg-success/10 text-success border-success/30',
    moyen: 'bg-warning/10 text-warning border-warning/30',
    avancé: 'bg-info/10 text-info border-info/30'
  };

  const steps: GuideStep[] = [
    {
      id: 'diagnostic',
      title: 'Diagnostic fiscal',
      content: (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive mb-1">Optimisations non exploitées</h4>
                <p className="text-sm text-muted-foreground">
                  Votre IS pourrait être réduit de {formatCurrency(economieTotal)} par an grâce à des leviers légaux.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
              <Receipt className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">IS estimé actuel</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(isActuel)}</p>
            </div>
            <div className="p-4 rounded-xl bg-success/5 border border-success/20 text-center">
              <TrendingDown className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">IS optimisé</p>
              <p className="text-xl font-bold text-success">{formatCurrency(Math.max(0, isActuel - economieTotal))}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Rappel : Taux d'IS en 2025</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                <span className="text-sm">Jusqu'à 42 500 €</span>
                <span className="font-semibold">15%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                <span className="text-sm">Au-delà</span>
                <span className="font-semibold">25%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Conditions : CA &lt; 10M€, capital détenu à 75% par des personnes physiques
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'optimisations',
      title: 'Leviers d\'optimisation',
      content: (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            {optimisations.length} leviers identifiés pour réduire votre IS :
          </p>

          <div className="space-y-3">
            {optimisations.map((opt) => (
              <div
                key={opt.id}
                className="p-4 rounded-xl border border-border/30 bg-secondary/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{opt.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${complexiteColors[opt.complexite]}`}>
                    {opt.complexite === 'facile' ? 'Facile' : opt.complexite === 'moyen' ? 'Modéré' : 'Avancé'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{opt.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <span className="text-xs text-muted-foreground">Économie estimée</span>
                  <span className="font-semibold text-success">-{formatCurrency(opt.economie)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-success/10 border border-success/30">
            <div className="flex items-center justify-between">
              <span className="font-medium">Économie totale possible</span>
              <span className="text-lg font-bold text-success">-{formatCurrency(economieTotal)}</span>
            </div>
          </div>
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
              <Calculator className="h-5 w-5 text-primary" />
              <span className="font-semibold">Actions prioritaires</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Commencez par les leviers "Facile" pour un impact immédiat.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Checklist immédiate</h4>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <div>
                  <p className="text-sm font-medium">Recenser les charges déductibles oubliées</p>
                  <p className="text-xs text-muted-foreground">
                    Frais de repas (19,40€/j max), téléphone, internet, abonnements pro
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <div>
                  <p className="text-sm font-medium">Vérifier les amortissements</p>
                  <p className="text-xs text-muted-foreground">
                    Matériel informatique, mobilier, véhicule (amortissement dégressif possible)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-6 h-6 rounded-full bg-warning/20 text-warning flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <div>
                  <p className="text-sm font-medium">Demander le crédit formation dirigeant</p>
                  <p className="text-xs text-muted-foreground">
                    Crédit d'impôt = nb heures × SMIC horaire (max 40h = ~460€)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-6 h-6 rounded-full bg-warning/20 text-warning flex items-center justify-center text-xs font-bold shrink-0">4</div>
                <div>
                  <p className="text-sm font-medium">Évaluer le PER Entreprise</p>
                  <p className="text-xs text-muted-foreground">
                    Déduction jusqu'à 8% de la rémunération, avec votre comptable
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-info/10 border border-info/20">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-info">Calendrier</strong> : Ces optimisations doivent être 
                mises en place avant la clôture de l'exercice. Prévoyez un RDV comptable 2 mois avant.
              </p>
            </div>
          </div>

          <h4 className="font-medium mt-2">Outils et experts recommandés</h4>
          <PartnerRecommendations type="comptabilite" profile={profile} campaign="fiscalite_is_guide" />
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
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Optimisation fiscale initiée</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              En appliquant ces leviers, vous réduisez votre IS de {formatCurrency(economieTotal)}/an.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-success/5 border border-success/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Économie d'IS estimée</span>
              <span className="text-lg font-bold text-success">-{formatCurrency(economieTotal)}</span>
            </div>
            <div className="h-2 rounded-full bg-success/20 overflow-hidden">
              <div 
                className="h-full bg-success rounded-full" 
                style={{ width: `${Math.min(100, (economieTotal / isActuel) * 100)}%` }} 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Réduction de {Math.round((economieTotal / isActuel) * 100)}% de votre IS
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Confirmez pour mettre à jour votre tableau de bord.</p>
          </div>
        </div>
      )
    }
  ];

  return {
    id: 'fiscalite-is-optimisation',
    title: 'Réduire mon IS',
    category: 'pro',
    estimatedGain: economieTotal,
    steps
  };
};
