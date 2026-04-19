import { supabase } from '@/integrations/supabase/client';
import { loadUserProfile, calculateDashboardMetrics, formatCurrency, type UserProfile, type DashboardRecommendation } from '@/lib/dashboardService';

export type CoachStatus = 'pending' | 'accepted' | 'dismissed' | 'completed';

export interface CoachRecommendation extends DashboardRecommendation {
  status: CoachStatus;
  category: 'epargne' | 'fiscal' | 'famille' | 'investissement' | 'declaration';
  urgencyDays?: number; // days until deadline
  isPremium?: boolean;
  guideKey?: string; // links to ActionGuideContext if available
  externalUrl?: string;
  snoozedUntil?: string;
  acceptedAt?: string;
  completedAt?: string;
  dismissedAt?: string;
}

export interface CoachFeed {
  totalAnnualGain: number;
  recoveredGain: number;
  pending: CoachRecommendation[];
  completed: CoachRecommendation[];
  dismissed: CoachRecommendation[];
  profileComplete: boolean;
}

const TMI_BRACKETS = [
  { limit: 11294, rate: 0 },
  { limit: 28797, rate: 0.11 },
  { limit: 82341, rate: 0.30 },
  { limit: 177106, rate: 0.41 },
  { limit: Infinity, rate: 0.45 },
];

function estimateTMI(profile: UserProfile): number {
  const annualIncome =
    profile.grossMonthlySalary * 12 +
    profile.annualBonus +
    profile.thirteenthMonth +
    profile.annualRevenueHt * 0.78 +
    profile.mainPensionAnnual +
    profile.supplementaryIncome;
  const parts = 1 + (profile.familyStatus === 'married' || profile.familyStatus === 'pacs' ? 1 : 0) + profile.childrenCount * 0.5;
  const perPart = annualIncome / Math.max(parts, 1);
  for (const b of TMI_BRACKETS) {
    if (perPart <= b.limit) return b.rate;
  }
  return 0.30;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function endOfYearISO(): string {
  return `${new Date().getFullYear()}-12-31`;
}

/**
 * Builds the full catalogue of recommendations for a profile.
 * Each reco has a stable `id` (= recommendation_key in DB).
 */
function buildRecommendations(profile: UserProfile): Omit<CoachRecommendation, 'status'>[] {
  const recos: Omit<CoachRecommendation, 'status'>[] = [];
  const tmi = estimateTMI(profile);
  const annualSalary = profile.grossMonthlySalary * 12 + profile.annualBonus + profile.thirteenthMonth;

  // Reuse existing engine recos
  const metrics = calculateDashboardMetrics(profile);
  for (const r of metrics.recommendations) {
    const category: CoachRecommendation['category'] =
      r.type === 'savings' ? 'epargne'
      : r.type === 'investment' ? 'investissement'
      : r.type === 'tax' ? 'declaration'
      : 'fiscal';
    const days = daysUntil(r.deadline);
    recos.push({
      ...r,
      category,
      urgencyDays: days,
      isPremium: r.gain >= 500,
      guideKey: r.id === 'real-expenses' ? 'frais-reels'
        : r.id === 'pee-perco' ? 'pee-perco'
        : r.id === 'pea-transfer' ? 'pea'
        : r.id === 'crypto-2086' ? undefined
        : undefined,
    });
  }

  // PER avant 31/12 (only if TMI >= 30%)
  const hasPER = recos.some(r => r.id === 'per-contribution');
  if (!hasPER && tmi >= 0.30) {
    const baseIncome = profile.isEmployee ? annualSalary : profile.annualRevenueHt;
    if (baseIncome > 0) {
      const optimalPer = Math.min(Math.round(baseIncome * 0.10), 35194);
      const gain = Math.round(optimalPer * tmi);
      if (gain >= 200) {
        const days = daysUntil(endOfYearISO());
        recos.push({
          id: 'per-contribution',
          type: 'savings',
          category: 'epargne',
          title: 'Verse sur ton PER avant le 31/12',
          description: `Tu peux déduire jusqu'à ${formatCurrency(optimalPer)} de tes revenus imposables en versant sur un PER cette année.`,
          gain,
          effort: '15 min',
          deadline: endOfYearISO(),
          urgencyDays: days,
          isPremium: gain >= 500,
          guideKey: 'per',
          currentOption: { label: 'Sans PER', value: 0, detail: 'Aucune déduction' },
          recommendedOption: { label: 'Avec PER', value: optimalPer, detail: `${Math.round(tmi * 100)}% × ${formatCurrency(optimalPer)}` },
        });
      }
    }
  }

  // Quotient familial PACS/mariage si couple non déclaré
  if (profile.familyStatus === 'single' && profile.spouseIncome > 0) {
    recos.push({
      id: 'pacs-mariage',
      type: 'fiscal',
      category: 'famille',
      title: 'Étudie le PACS ou le mariage',
      description: 'Vous vivez en couple mais déclarez séparément. Une déclaration commune peut réduire votre impôt grâce au quotient familial.',
      gain: 1500,
      effort: 'Démarche mairie / notaire',
      deadline: endOfYearISO(),
      urgencyDays: daysUntil(endOfYearISO()),
      isPremium: true,
      currentOption: { label: 'Séparés', value: 2, detail: '2 déclarations' },
      recommendedOption: { label: 'Communs', value: 1, detail: '1 déclaration, 2 parts' },
      externalUrl: 'https://www.service-public.fr/particuliers/vosdroits/N142',
    });
  }

  // Garde d'enfants (CMG / crédit impôt 50%)
  if (profile.childrenCount > 0) {
    const estimatedCare = 3500;
    const gain = Math.round(estimatedCare * 0.50);
    recos.push({
      id: 'garde-enfants',
      type: 'credit',
      category: 'famille',
      title: 'Crédit d\'impôt garde d\'enfants',
      description: `50% des frais de garde sont remboursés (jusqu'à 3 500€/enfant de moins de 6 ans). Vérifie que tu déclares bien tes frais.`,
      gain,
      effort: '10 min',
      deadline: '2026-05-31',
      urgencyDays: daysUntil('2026-05-31'),
      isPremium: false,
      currentOption: { label: 'Non déclaré', value: 0, detail: 'Aucun crédit' },
      recommendedOption: { label: 'Déclaré', value: gain, detail: 'Cases 7GA à 7GG' },
      externalUrl: 'https://www.service-public.fr/particuliers/vosdroits/F8',
    });
  }

  // Don déductible (66%)
  recos.push({
    id: 'don-deductible',
    type: 'credit',
    category: 'fiscal',
    title: 'Faire un don avant le 31/12',
    description: '66% du don est déduit de ton impôt (jusqu\'à 20% du revenu imposable). 100€ donnés = 66€ remboursés.',
    gain: 132, // exemple 200€
    effort: '5 min',
    deadline: endOfYearISO(),
    urgencyDays: daysUntil(endOfYearISO()),
    isPremium: false,
    currentOption: { label: 'Sans don', value: 0, detail: 'Aucune réduction' },
    recommendedOption: { label: '200€ donnés', value: 132, detail: '66% remboursés' },
  });

  // Investissement PME/FCPI
  if (tmi >= 0.30 && profile.isInvestor) {
    recos.push({
      id: 'pme-fcpi',
      type: 'investment',
      category: 'investissement',
      title: 'Investis en FCPI/FIP pour réduire ton IR',
      description: '18% à 25% du montant investi en réduction d\'impôt. Plafond 12 000€ (24 000€ pour un couple).',
      gain: 2200,
      effort: '1h',
      deadline: endOfYearISO(),
      urgencyDays: daysUntil(endOfYearISO()),
      isPremium: true,
      currentOption: { label: 'Sans investissement', value: 0, detail: 'Aucune réduction' },
      recommendedOption: { label: '10 000€ investis', value: 2200, detail: 'Réduction IR 22%' },
    });
  }

  return recos;
}

export async function getCoachFeed(userId: string): Promise<CoachFeed> {
  const profile = await loadUserProfile(userId);
  if (!profile) {
    return { totalAnnualGain: 0, recoveredGain: 0, pending: [], completed: [], dismissed: [], profileComplete: false };
  }

  const profileComplete = profile.onboardingCompleted;
  const all = buildRecommendations(profile);

  const { data: stored } = await supabase
    .from('user_recommendations')
    .select('*')
    .eq('user_id', userId);

  const storedMap = new Map((stored || []).map(s => [s.recommendation_key, s]));
  const now = new Date();

  const enriched: CoachRecommendation[] = all.map(r => {
    const s = storedMap.get(r.id);
    let status: CoachStatus = 'pending';
    if (s) {
      if (s.snoozed_until && new Date(s.snoozed_until) > now) {
        status = 'dismissed';
      } else {
        status = (s.status as CoachStatus) || 'pending';
      }
    }
    return {
      ...r,
      status,
      snoozedUntil: s?.snoozed_until || undefined,
      acceptedAt: s?.accepted_at || undefined,
      completedAt: s?.completed_at || undefined,
      dismissedAt: s?.dismissed_at || undefined,
    };
  });

  const pending = enriched.filter(r => r.status === 'pending' || r.status === 'accepted')
    .sort((a, b) => (b.gain - a.gain));
  const completed = enriched.filter(r => r.status === 'completed');
  const dismissed = enriched.filter(r => r.status === 'dismissed');

  const totalAnnualGain = pending.reduce((s, r) => s + r.gain, 0);
  const recoveredGain = completed.reduce((s, r) => s + r.gain, 0);

  return { totalAnnualGain, recoveredGain, pending, completed, dismissed, profileComplete };
}

async function upsertReco(userId: string, key: string, patch: Record<string, any>, gain: number) {
  await supabase
    .from('user_recommendations')
    .upsert(
      { user_id: userId, recommendation_key: key, estimated_gain: gain, ...patch },
      { onConflict: 'user_id,recommendation_key' }
    );
}

export async function acceptRecommendation(userId: string, key: string, gain: number) {
  await upsertReco(userId, key, { status: 'accepted', accepted_at: new Date().toISOString() }, gain);
}

export async function markCompleted(userId: string, key: string, gain: number) {
  await upsertReco(userId, key, { status: 'completed', completed_at: new Date().toISOString() }, gain);
}

export async function dismissRecommendation(userId: string, key: string, gain: number, reason?: string) {
  await upsertReco(userId, key, {
    status: 'dismissed',
    dismissed_at: new Date().toISOString(),
    dismissed_reason: reason || null,
  }, gain);
}

export async function snoozeRecommendation(userId: string, key: string, gain: number, days = 30) {
  const until = new Date();
  until.setDate(until.getDate() + days);
  await upsertReco(userId, key, {
    status: 'pending',
    snoozed_until: until.toISOString(),
  }, gain);
}

export async function reopenRecommendation(userId: string, key: string, gain: number) {
  await upsertReco(userId, key, {
    status: 'pending',
    accepted_at: null,
    completed_at: null,
    dismissed_at: null,
    snoozed_until: null,
    dismissed_reason: null,
  }, gain);
}
