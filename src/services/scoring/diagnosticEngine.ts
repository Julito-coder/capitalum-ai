import { QuizAnswers, DiagnosticResult, DiagnosticDetail } from '@/types/onboarding';

const incomeToNumber = (income: string | null): number => {
  const map: Record<string, number> = {
    '0-10k': 5000, '10-18k': 14000, '18-26k': 22000,
    '26-36k': 31000, '36-50k': 43000, '50-80k': 65000, '80k+': 100000,
  };
  return income ? map[income] ?? 0 : 0;
};

const childrenToNumber = (c: string | null): number => {
  if (!c || c === '0') return 0;
  if (c === '5+') return 5;
  return parseInt(c, 10);
};

const isCouple = (fs: string | null): boolean =>
  fs === 'couple_married' || fs === 'couple_unmarried';

export const calculateDiagnostic = (answers: QuizAnswers): DiagnosticResult => {
  const details: DiagnosticDetail[] = [];
  const income = incomeToNumber(answers.annualIncome);
  const children = childrenToNumber(answers.children);
  const hasAid = (aid: string) => answers.currentAids.includes(aid as never);
  const hasSaving = (s: string) => answers.savings.includes(s as never);
  const hasInvestment = (i: string) => answers.investments.includes(i as never);

  // ─── AIDES NON RÉCLAMÉES ───

  // APL
  const aplThreshold = isCouple(answers.familySituation) ? 36000 : 26000;
  if (answers.housing === 'tenant' && income < aplThreshold && !hasAid('apl')) {
    const zoneAmounts: Record<string, number> = { zone_1: 3600, zone_2: 2400, zone_3: 1200 };
    const amount = zoneAmounts[answers.zone ?? 'zone_3'] ?? 1200;
    details.push({ label: 'APL non réclamée', amount, category: 'aid' });
  }

  // Prime d'activité
  if (
    ['employee', 'public_employee', 'self_employed'].includes(answers.professionalStatus ?? '') &&
    income >= 4000 && income <= 18000 &&
    !hasAid('prime_activite')
  ) {
    const amount = income < 10000 ? 3000 : 1200;
    details.push({ label: 'Prime d\'activité non demandée', amount, category: 'aid' });
  }

  // CSS
  const cssThreshold = isCouple(answers.familySituation) ? 18000 : 12000;
  if (income < cssThreshold && !hasAid('css')) {
    details.push({ label: 'Complémentaire santé solidaire (CSS)', amount: 600, category: 'aid' });
  }

  // ARS
  if (children > 0 && income < 26000 + children * 6000 && !hasAid('ars')) {
    details.push({ label: 'Allocation de rentrée scolaire', amount: children * 450, category: 'aid' });
  }

  // Chèque énergie
  const chequeThreshold = isCouple(answers.familySituation) ? 18000 : 11000;
  if (income < chequeThreshold && !hasAid('cheque_energie')) {
    details.push({ label: 'Chèque énergie', amount: 200, category: 'aid' });
  }

  // Bourse CROUS
  if (answers.professionalStatus === 'student' && income < 26000) {
    details.push({ label: 'Bourse CROUS potentielle', amount: income < 10000 ? 5000 : 1800, category: 'aid' });
  }

  // Allocations familiales
  if (children >= 2 && !hasAid('allocations_familiales')) {
    const amounts: Record<number, number> = { 2: 1500, 3: 3000, 4: 4200, 5: 4800 };
    const amount = amounts[Math.min(children, 5)] ?? 4800;
    details.push({ label: 'Allocations familiales', amount, category: 'aid' });
  }

  // RSA
  if (answers.professionalStatus === 'unemployed' && income < 7000) {
    details.push({ label: 'RSA non demandé', amount: 7000, category: 'aid' });
  }

  // ─── OPTIMISATIONS FISCALES ───

  // Frais réels
  if (
    answers.transport === 'car_long' &&
    answers.taxDeclaration === 'auto_validate' &&
    ['employee', 'public_employee'].includes(answers.professionalStatus ?? '')
  ) {
    const amount = income > 36000 ? 800 : income > 26000 ? 500 : 300;
    details.push({ label: 'Frais réels non déclarés (trajet voiture)', amount, category: 'optimization' });
  }

  // Dons non déclarés
  if (answers.donations === 'donations_not_declared') {
    details.push({ label: 'Réduction d\'impôt dons non déclarée', amount: 200, category: 'optimization' });
  }

  // PER
  if (income > 36000 && !hasSaving('per')) {
    const amount = income > 80000 ? 1500 : income > 50000 ? 1000 : 400;
    details.push({ label: 'Économie d\'impôt PER non exploitée', amount, category: 'optimization' });
  }

  // Couple non pacsé
  if (answers.familySituation === 'couple_unmarried' && income > 26000) {
    const amount = income > 50000 ? 1200 : income > 36000 ? 600 : 300;
    details.push({ label: 'Avantage fiscal couple non pacsé', amount, category: 'optimization' });
  }

  // Déclaration auto-validée
  if (answers.taxDeclaration === 'auto_validate') {
    details.push({ label: 'Erreurs potentielles déclaration pré-remplie', amount: 200, category: 'optimization' });
  }

  // Emploi à domicile
  if (
    (answers.confidence === 'lost' || answers.confidence === 'anxious' || answers.confidence === 'passive') &&
    income > 26000
  ) {
    details.push({ label: 'Crédit d\'impôt emploi à domicile non exploité', amount: 150, category: 'optimization' });
  }

  // Propriétaire avec crédit - intérêts
  if (answers.housing === 'owner_mortgage' && answers.taxDeclaration === 'auto_validate') {
    details.push({ label: 'Intérêts d\'emprunt potentiellement déductibles', amount: 300, category: 'optimization' });
  }

  // ─── RISQUES ───

  // Crypto non déclarée
  if (hasInvestment('crypto')) {
    details.push({ label: 'Déclaration crypto obligatoire (formulaire 2086)', amount: 750, category: 'risk' });
  }

  // Comptes étrangers
  if (hasInvestment('foreign_accounts')) {
    details.push({ label: 'Comptes étrangers non déclarés (amende potentielle)', amount: 1500, category: 'risk' });
  }

  // Événements de vie non traités
  if (
    answers.lifeEvents.length > 0 &&
    !answers.lifeEvents.includes('none') &&
    answers.taxDeclaration === 'auto_validate'
  ) {
    details.push({ label: 'Événement de vie non pris en compte fiscalement', amount: 300, category: 'risk' });
  }

  // ─── CALCUL FINAL ───
  const missedAids = details.filter(d => d.category === 'aid').reduce((s, d) => s + d.amount, 0);
  const missedOptimizations = details.filter(d => d.category === 'optimization').reduce((s, d) => s + d.amount, 0);
  const risks = details.filter(d => d.category === 'risk').reduce((s, d) => s + d.amount, 0);
  const totalLoss = missedAids + missedOptimizations + risks;

  let score: number;
  if (totalLoss < 200) score = 90;
  else if (totalLoss < 500) score = 77;
  else if (totalLoss < 1500) score = 57;
  else if (totalLoss < 3000) score = 35;
  else score = 15;

  // Fine-tune based on totalLoss within range
  if (totalLoss >= 200 && totalLoss < 500) score = Math.round(84 - ((totalLoss - 200) / 300) * 14);
  else if (totalLoss >= 500 && totalLoss < 1500) score = Math.round(69 - ((totalLoss - 500) / 1000) * 24);
  else if (totalLoss >= 1500 && totalLoss < 3000) score = Math.round(44 - ((totalLoss - 1500) / 1500) * 19);
  else if (totalLoss >= 3000) score = Math.round(24 - Math.min((totalLoss - 3000) / 5000, 1) * 19);
  else if (totalLoss < 200) score = Math.round(100 - (totalLoss / 200) * 15);

  // Confidence adjustment
  if (answers.confidence === 'lost' || answers.confidence === 'anxious') score -= 5;
  else if (answers.confidence === 'confident') score += 5;

  score = Math.max(5, Math.min(98, score));

  return {
    score,
    totalLoss,
    breakdown: { missedAids, missedOptimizations, risks },
    details,
  };
};
