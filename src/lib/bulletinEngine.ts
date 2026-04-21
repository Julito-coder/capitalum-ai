/**
 * Moteur de priorisation du Bulletin Élio.
 * Déterministe : aucun appel LLM. Appelle les moteurs existants.
 */
import { UserProfile, calculateDashboardMetrics, DashboardAlert, DashboardRecommendation } from './dashboardService';
import { FISCAL_DEADLINES } from './deadlinesData';
import { DeadlineUserProfile } from './deadlinesTypes';

export interface BulletinAction {
  type: 'fiscal' | 'aide' | 'echeance' | 'optimisation' | 'decouverte';
  id: string;
  title: string;
  description: string;
  gainCents: number | null;
  effortMinutes: number;
  deadline?: string;
  link?: string;
}

export interface BulletinDeadline {
  date: string;
  title: string;
  amountCents: number | null;
  type: string;
  daysLeft: number;
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function effortMinutes(effort: string): number {
  if (effort.includes('5')) return 5;
  if (effort.includes('10')) return 10;
  if (effort.includes('15')) return 15;
  if (effort.includes('30')) return 30;
  if (effort.includes('60') || effort.includes('1h')) return 60;
  return 15;
}

function profileToDeadlineProfile(p: UserProfile): DeadlineUserProfile {
  return {
    isEmployee: p.isEmployee,
    isSelfEmployed: p.isSelfEmployed,
    isRetired: p.isRetired,
    isInvestor: p.isInvestor,
    isHomeowner: p.isHomeowner,
    hasRentalIncome: p.rentalPropertiesCount > 0,
    hasCrypto: p.cryptoPnl2025 !== 0,
    grossMonthlySalary: p.grossMonthlySalary,
    netMonthlySalary: p.netMonthlySalary,
    annualRevenueHt: p.annualRevenueHt,
    peaBalance: p.peaBalance,
    peaContributions2025: p.peaContributions2025,
    cryptoPnl2025: p.cryptoPnl2025,
    lifeInsuranceBalance: p.lifeInsuranceBalance,
    scpiInvestments: p.scpiInvestments,
    childrenCount: p.childrenCount,
    familyStatus: p.familyStatus,
    fiscalStatus: p.fiscalStatus,
    tmi: 0,
    hasRealExpenses: p.hasRealExpenses,
    peeAmount: p.peeAmount,
    percoAmount: p.percoAmount,
    spouseIncome: p.spouseIncome,
    mortgageRemaining: p.mortgageRemaining,
    isStudent: false,
  };
}

function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function isDeclarationPeriod(): boolean {
  const now = new Date();
  const m = now.getMonth();
  const d = now.getDate();
  return (m === 3 && d >= 15) || m === 4 || (m === 5 && d <= 10);
}

/**
 * Sélectionne l'action du jour selon les règles de priorité.
 */
export function selectActionOfTheDay(
  profile: UserProfile,
  doneActionIds: string[] = []
): BulletinAction {
  const deadlineProfile = profileToDeadlineProfile(profile);

  // Règle 1 : Échéance critique < 7 jours avec impact ≥ 20 €
  const relevantDeadlines = FISCAL_DEADLINES
    .filter(d => d.relevanceCondition(deadlineProfile))
    .map(d => ({
      ...d,
      daysLeft: daysUntil(d.date),
      impact: d.computePersonalImpact(deadlineProfile),
    }))
    .filter(d => d.daysLeft >= 0 && d.daysLeft <= 7 && (d.impact.estimatedGain >= 20 || d.impact.riskIfNoAction >= 20))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const criticalDeadline = relevantDeadlines[0];
  if (criticalDeadline && !doneActionIds.includes(criticalDeadline.key)) {
    return {
      type: 'echeance',
      id: criticalDeadline.key,
      title: criticalDeadline.title,
      description: criticalDeadline.impact.explanation,
      gainCents: Math.max(criticalDeadline.impact.estimatedGain, criticalDeadline.impact.riskIfNoAction) * 100,
      effortMinutes: 15,
      deadline: criticalDeadline.date.toISOString().split('T')[0],
      link: '/outils/calendrier',
    };
  }

  // Règle 2 : Alerte critique du dashboardService
  const metrics = calculateDashboardMetrics(profile);
  const criticalAlert = metrics.alerts
    .filter(a => a.severity === 'critical' && !doneActionIds.includes(a.id))
    .sort((a, b) => b.gain - a.gain)[0];

  if (criticalAlert) {
    return alertToAction(criticalAlert);
  }

  // Période déclaration : prioriser les items de checklist
  if (isDeclarationPeriod()) {
    const declarationAlert = metrics.alerts
      .filter(a => !doneActionIds.includes(a.id) && (a.type.includes('declaration') || a.type.includes('fiscal')))
      .sort((a, b) => b.gain - a.gain)[0];
    if (declarationAlert) return alertToAction(declarationAlert);
  }

  // Règle 3 : Meilleur ratio gain/effort parmi les recommandations
  const bestRec = metrics.recommendations
    .filter(r => !doneActionIds.includes(r.id))
    .sort((a, b) => {
      const ratioA = a.gain / effortMinutes(a.effort);
      const ratioB = b.gain / effortMinutes(b.effort);
      return ratioB - ratioA;
    })[0];

  if (bestRec) {
    return recToAction(bestRec);
  }

  // Règle 4 : Warning alerts
  const warningAlert = metrics.alerts
    .filter(a => a.severity === 'warning' && !doneActionIds.includes(a.id))
    .sort((a, b) => b.gain - a.gain)[0];
  if (warningAlert) return alertToAction(warningAlert);

  // Fallback : action de découverte
  return getDiscoveryAction(profile, isWeekend());
}

function alertToAction(alert: DashboardAlert): BulletinAction {
  return {
    type: alert.type.includes('aide') ? 'aide' : 'fiscal',
    id: alert.id,
    title: alert.title,
    description: alert.message,
    gainCents: alert.gain * 100,
    effortMinutes: 10,
    deadline: alert.deadline,
    link: alert.action,
  };
}

function recToAction(rec: DashboardRecommendation): BulletinAction {
  return {
    type: 'optimisation',
    id: rec.id,
    title: rec.title,
    description: rec.description,
    gainCents: rec.gain * 100,
    effortMinutes: effortMinutes(rec.effort),
    deadline: rec.deadline,
  };
}

function getDiscoveryAction(profile: UserProfile, weekend: boolean): BulletinAction {
  if (!profile.onboardingCompleted) {
    return {
      type: 'decouverte',
      id: 'complete-profile',
      title: 'Complète ton profil fiscal',
      description: 'Plus je te connais, plus je peux te faire économiser. 5 minutes suffisent.',
      gainCents: null,
      effortMinutes: 5,
      link: '/profil/fiscal',
    };
  }

  if (weekend) {
    return {
      type: 'decouverte',
      id: 'scan-document',
      title: 'Scanne un document fiscal',
      description: 'Profite du week-end pour numériser un avis d\'imposition ou une facture. Élio détecte les erreurs automatiquement.',
      gainCents: null,
      effortMinutes: 3,
      link: '/outils/scanner',
    };
  }

  return {
    type: 'decouverte',
    id: 'explore-calendar',
    title: 'Consulte ton calendrier fiscal',
    description: 'Toutes tes échéances administratives et fiscales au même endroit. Rien ne t\'échappe.',
    gainCents: null,
    effortMinutes: 2,
    link: '/outils/calendrier',
  };
}

/**
 * Retourne la prochaine échéance pertinente pour l'utilisateur.
 */
export function getNextDeadline(profile: UserProfile): BulletinDeadline | null {
  const deadlineProfile = profileToDeadlineProfile(profile);

  const upcoming = FISCAL_DEADLINES
    .filter(d => d.relevanceCondition(deadlineProfile))
    .map(d => ({
      ...d,
      daysLeft: daysUntil(d.date),
      impact: d.computePersonalImpact(deadlineProfile),
    }))
    .filter(d => d.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const next = upcoming[0];
  if (!next) return null;

  return {
    date: next.date.toISOString().split('T')[0],
    title: next.title,
    amountCents: next.impact.estimatedGain > 0 ? next.impact.estimatedGain * 100 : (next.impact.riskIfNoAction > 0 ? next.impact.riskIfNoAction * 100 : null),
    type: next.category,
    daysLeft: next.daysLeft,
  };
}

/**
 * Calcule le gain cumulé à partir des recommandations complétées.
 */
export function computeCumulativeGain(profile: UserProfile): { totalCents: number; weeklyDeltaCents: number } {
  const metrics = calculateDashboardMetrics(profile);
  const totalCents = metrics.potentialSavings * 100;
  // Delta hebdomadaire simplifié : on prend ~1/52 du potentiel annuel
  const weeklyDeltaCents = Math.round(totalCents / 52);
  return { totalCents, weeklyDeltaCents };
}
