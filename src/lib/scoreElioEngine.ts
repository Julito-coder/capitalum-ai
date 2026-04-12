import { ModernOnboardingData } from '@/data/modernOnboardingTypes';

export interface ScoreBreakdownItem {
  label: string;
  amount: number;
  icon: string;
}

export interface ElioScoreResult {
  score: number;
  totalLoss: number;
  breakdown: ScoreBreakdownItem[];
}

/**
 * Calcule le Score Élio et le montant estimé de pertes annuelles
 * basé sur les barèmes réels français.
 */
export const calculateElioScore = (data: ModernOnboardingData): ElioScoreResult => {
  const breakdown: ScoreBreakdownItem[] = [];

  // 1. Aides non réclamées
  const aidLoss = estimateUnclaimedAid(data);
  if (aidLoss > 0) {
    breakdown.push({ label: 'Aides non réclamées', amount: aidLoss, icon: '🎯' });
  }

  // 2. Erreurs fiscales potentielles
  const fiscalLoss = estimateFiscalErrors(data);
  if (fiscalLoss > 0) {
    breakdown.push({ label: 'Optimisation fiscale', amount: fiscalLoss, icon: '📉' });
  }

  // 3. Optimisations patrimoniales manquées
  const assetLoss = estimateAssetOptimizations(data);
  if (assetLoss > 0) {
    breakdown.push({ label: 'Épargne mal placée', amount: assetLoss, icon: '💰' });
  }

  const totalLoss = breakdown.reduce((sum, item) => sum + item.amount, 0);

  // Score: 100 = parfait, 0 = beaucoup de pertes
  // Échelle: 0€ perdu = 100, 5000€+ = ~20
  const rawScore = Math.max(0, 100 - Math.round((totalLoss / 5000) * 80));
  const score = Math.max(10, Math.min(100, rawScore));

  return { score, totalLoss, breakdown };
};

function estimateUnclaimedAid(data: ModernOnboardingData): number {
  let total = 0;
  const income = data.incomeRange;
  const housing = data.housingStatus;
  const family = data.familySituation;
  const status = data.professionalStatus;

  // APL: locataire + revenus < 3000€
  if (housing === 'locataire' && (income === '<1500' || income === '1500-3000')) {
    total += family === 'avec_enfants' ? 3000 : 2400; // ~200-250€/mois
  }

  // Prime d'activité: salarié ou indépendant, revenus 1500-3000€
  if ((status === 'salarie' || status === 'independant') && income === '1500-3000') {
    total += 1764; // ~147€/mois
  }

  // CSS (ex-CMU-C): revenus < 1500€
  if (income === '<1500') {
    total += 600; // ~50€/mois économie mutuelle
  }

  // Chèque énergie: revenus < 3000€
  if (income === '<1500' || income === '1500-3000') {
    total += 150;
  }

  return total;
}

function estimateFiscalErrors(data: ModernOnboardingData): number {
  let total = 0;
  const status = data.professionalStatus;
  const income = data.incomeRange;
  const bracket = data.taxBracket;

  // Salarié: potentiel frais réels non déclarés
  if (status === 'salarie' && (income === '3000-5000' || income === '>5000')) {
    total += bracket === '30-41' || bracket === '41-45' ? 800 : 400;
  }

  // Indépendant: micro vs réel mal choisi
  if ((status === 'independant' || status === 'chef_entreprise') && income !== '<1500') {
    total += 1200;
  }

  // TMI élevée sans optimisation
  if (bracket === '30-41' || bracket === '41-45') {
    total += 600; // PER non ouvert
  }

  return total;
}

function estimateAssetOptimizations(data: ModernOnboardingData): number {
  let total = 0;
  const patrimony = data.patrimonyRange;
  const income = data.incomeRange;

  // Patrimoine > 50k sans optimisation estimée
  if (patrimony === '50000-200000' || patrimony === '>200000') {
    total += 800; // rendement manqué sur livrets vs assurance-vie
  }

  // Revenus > 3000€ sans PEA estimé
  if (income === '3000-5000' || income === '>5000') {
    total += 500; // fiscalité PEA vs CTO
  }

  return total;
}
