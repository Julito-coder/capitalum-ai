/**
 * Service layer for fiscal deadlines.
 * Handles data fetching, enrichment, and persistence.
 */
import { supabase } from '@/integrations/supabase/client';
import { FISCAL_DEADLINES } from './deadlinesData';
import {
  EnrichedDeadline,
  DeadlineUserProfile,
  UserDeadlineTracking,
  DeadlineStatus,
  OptimizationScore,
  computeUrgency,
  computeDaysLeft,
} from './deadlinesTypes';
import { UserProfile } from './dashboardService';

/** Convert dashboard UserProfile to DeadlineUserProfile */
export function toDeadlineProfile(p: UserProfile): DeadlineUserProfile {
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
  };
}

/** Fetch user's deadline tracking records */
export async function fetchUserTracking(userId: string): Promise<UserDeadlineTracking[]> {
  const { data, error } = await supabase
    .from('user_deadline_tracking')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching deadline tracking:', error);
    return [];
  }

  return (data || []) as unknown as UserDeadlineTracking[];
}

/** Get enriched deadlines filtered & personalized for user */
export function getEnrichedDeadlines(
  profile: DeadlineUserProfile,
  tracking: UserDeadlineTracking[]
): EnrichedDeadline[] {
  const trackingMap = new Map(tracking.map((t) => [t.deadline_key, t]));

  return FISCAL_DEADLINES
    .filter((d) => d.relevanceCondition(profile))
    .map((d) => {
      const daysLeft = computeDaysLeft(d.date);
      const personalImpact = d.computePersonalImpact(profile);
      const track = trackingMap.get(d.key) || null;
      const urgency = track?.status === 'optimized' || track?.status === 'ignored'
        ? 'low' as const
        : computeUrgency(daysLeft, d.impactScore);

      return {
        ...d,
        tracking: track,
        urgency,
        daysLeft,
        personalImpact,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Update or create tracking record */
export async function upsertTracking(
  userId: string,
  deadlineKey: string,
  updates: Partial<Pick<UserDeadlineTracking, 'status' | 'ignored_reason' | 'notes' | 'uploaded_proof_url' | 'guide_progress'>>
): Promise<void> {
  const { error } = await supabase
    .from('user_deadline_tracking')
    .upsert(
      {
        user_id: userId,
        deadline_key: deadlineKey,
        ...updates,
        ...(updates.status === 'optimized' ? { completed_at: new Date().toISOString() } : {}),
      },
      { onConflict: 'user_id,deadline_key' }
    );

  if (error) {
    console.error('Error upserting deadline tracking:', error);
    throw error;
  }
}

/** Compute gamification score */
export function computeOptimizationScore(deadlines: EnrichedDeadline[]): OptimizationScore {
  const total = deadlines.length;
  let optimized = 0, inProgress = 0, pending = 0, ignored = 0;
  let cumulativeGains = 0, missedGains = 0;

  for (const d of deadlines) {
    const status = d.tracking?.status || 'pending';
    switch (status) {
      case 'optimized':
        optimized++;
        cumulativeGains += d.personalImpact.estimatedGain;
        break;
      case 'in_progress':
        inProgress++;
        break;
      case 'ignored':
        ignored++;
        missedGains += d.personalImpact.estimatedGain;
        break;
      default:
        pending++;
        missedGains += d.personalImpact.estimatedGain;
    }
  }

  return {
    totalDeadlines: total,
    optimizedCount: optimized,
    inProgressCount: inProgress,
    pendingCount: pending,
    ignoredCount: ignored,
    optimizationRate: total > 0 ? Math.round((optimized / total) * 100) : 0,
    cumulativeGains,
    missedGains,
  };
}
