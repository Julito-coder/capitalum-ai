/**
 * Domain types for the fiscal deadlines system.
 * Separates domain logic from UI as per architecture rules.
 */

export type DeadlineCategory = 'fiscalite' | 'investissement' | 'administratif' | 'banque' | 'immobilier' | 'crypto' | 'social';

export type DeadlineStatus = 'pending' | 'in_progress' | 'optimized' | 'ignored';

export type DeadlineUrgency = 'critical' | 'high' | 'medium' | 'low';

export type CalendarViewMode = 'chronological' | 'strategic' | 'urgent';

export interface FiscalDeadline {
  /** Unique key used for tracking (e.g., 'ir-declaration-2026') */
  key: string;
  title: string;
  shortDescription: string;
  /** Full pedagogical explanation */
  explanation: string;
  /** Consequences if not optimized */
  consequences: string;
  category: DeadlineCategory;
  /** Date limite */
  date: Date;
  /** Impact score 1-5 */
  impactScore: number;
  /** Estimated financial impact in € (can be positive=gain or negative=loss) */
  estimatedImpact: number;
  /** Whether this deadline is relevant based on user profile */
  relevanceCondition: (profile: DeadlineUserProfile) => boolean;
  /** Compute personalized impact based on profile */
  computePersonalImpact: (profile: DeadlineUserProfile) => PersonalImpact;
  /** Associated guide ID from ActionGuide system */
  guideId?: string;
  /** External link (e.g., official form URL) */
  externalUrl?: string;
  /** External form label */
  externalUrlLabel?: string;
  /** Action buttons available */
  actions: DeadlineAction[];
  /** Tags for filtering */
  tags: string[];
  /** Tax form type for in-app form viewer */
  formType?: string;
  /** Whether an in-app form is available */
  hasInAppForm?: boolean;
}

export interface DeadlineAction {
  id: string;
  label: string;
  icon: string;
  type: 'guide' | 'simulation' | 'document' | 'external' | 'checklist' | 'inapp-form' | 'navigate';
  /** Route to navigate or guide ID to open */
  target?: string;
}

export interface PersonalImpact {
  estimatedGain: number;
  riskIfNoAction: number;
  patrimonialEffect10y: number;
  explanation: string;
}

export interface DeadlineUserProfile {
  isEmployee: boolean;
  isSelfEmployed: boolean;
  isRetired: boolean;
  isInvestor: boolean;
  isHomeowner: boolean;
  hasRentalIncome: boolean;
  hasCrypto: boolean;
  grossMonthlySalary: number;
  netMonthlySalary: number;
  annualRevenueHt: number;
  peaBalance: number;
  peaContributions2025: number;
  cryptoPnl2025: number;
  lifeInsuranceBalance: number;
  scpiInvestments: number;
  childrenCount: number;
  familyStatus: string;
  fiscalStatus: string;
  tmi: number;
  hasRealExpenses: boolean;
  peeAmount: number;
  percoAmount: number;
  spouseIncome: number;
  mortgageRemaining: number;
  isStudent: boolean;
}

export interface UserDeadlineTracking {
  id: string;
  user_id: string;
  deadline_key: string;
  status: DeadlineStatus;
  completed_at: string | null;
  ignored_reason: string | null;
  notes: string | null;
  uploaded_proof_url: string | null;
  guide_progress: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface EnrichedDeadline extends FiscalDeadline {
  tracking: UserDeadlineTracking | null;
  urgency: DeadlineUrgency;
  daysLeft: number;
  personalImpact: PersonalImpact;
}

/** Gamification stats */
export interface OptimizationScore {
  totalDeadlines: number;
  optimizedCount: number;
  inProgressCount: number;
  pendingCount: number;
  ignoredCount: number;
  optimizationRate: number;
  cumulativeGains: number;
  missedGains: number;
}

// Helpers

export const CATEGORY_CONFIG: Record<DeadlineCategory, { label: string; icon: string; color: string }> = {
  fiscalite: { label: 'Fiscalité', icon: 'Receipt', color: 'text-info' },
  investissement: { label: 'Investissement', icon: 'TrendingUp', color: 'text-success' },
  administratif: { label: 'Administratif', icon: 'FileText', color: 'text-muted-foreground' },
  banque: { label: 'Banque', icon: 'Landmark', color: 'text-primary' },
  immobilier: { label: 'Immobilier', icon: 'Home', color: 'text-warning' },
  crypto: { label: 'Crypto', icon: 'Bitcoin', color: 'text-orange-500' },
  social: { label: 'Social', icon: 'Users', color: 'text-purple-500' },
};

export const STATUS_CONFIG: Record<DeadlineStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'À faire', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  in_progress: { label: 'En cours', color: 'text-warning', bgColor: 'bg-warning/10' },
  optimized: { label: 'Optimisée', color: 'text-success', bgColor: 'bg-success/10' },
  ignored: { label: 'Ignorée', color: 'text-destructive', bgColor: 'bg-destructive/10' },
};

export function computeUrgency(daysLeft: number, impactScore: number): DeadlineUrgency {
  if (daysLeft < 0) return 'critical';
  if (daysLeft <= 14 && impactScore >= 4) return 'critical';
  if (daysLeft <= 30) return 'high';
  if (daysLeft <= 90) return 'medium';
  return 'low';
}

export function computeDaysLeft(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export const URGENCY_CONFIG: Record<DeadlineUrgency, { label: string; color: string; bgColor: string; borderColor: string }> = {
  critical: { label: 'Urgent', color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive/30' },
  high: { label: 'Important', color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/30' },
  medium: { label: 'À prévoir', color: 'text-info', bgColor: 'bg-info/10', borderColor: 'border-info/30' },
  low: { label: 'Planifié', color: 'text-muted-foreground', bgColor: 'bg-secondary/50', borderColor: 'border-border/30' },
};
