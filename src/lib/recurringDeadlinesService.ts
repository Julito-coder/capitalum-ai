import { supabase } from '@/integrations/supabase/client';

export interface RecurringDeadline {
  id: string;
  user_id: string;
  title: string;
  category: string;
  amount: number | null;
  frequency: string;
  next_date: string;
  provider: string | null;
  contract_ref: string | null;
  notes: string | null;
  source: string;
  source_document_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const CATEGORIES = [
  { value: 'energie', label: '⚡ Énergie', icon: '⚡' },
  { value: 'telecom', label: '📡 Télécom / Internet', icon: '📡' },
  { value: 'assurance', label: '🛡️ Assurance', icon: '🛡️' },
  { value: 'abonnement', label: '📺 Abonnement', icon: '📺' },
  { value: 'logement', label: '🏠 Logement', icon: '🏠' },
  { value: 'credit', label: '🏦 Crédit', icon: '🏦' },
  { value: 'autre', label: '📋 Autre', icon: '📋' },
] as const;

export const FREQUENCIES = [
  { value: 'monthly', label: 'Mensuel' },
  { value: 'quarterly', label: 'Trimestriel' },
  { value: 'annually', label: 'Annuel' },
] as const;

export async function fetchRecurringDeadlines(userId: string): Promise<RecurringDeadline[]> {
  const { data, error } = await supabase
    .from('user_recurring_deadlines')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('next_date', { ascending: true });

  if (error) {
    console.error('Error fetching recurring deadlines:', error);
    return [];
  }
  return (data || []) as unknown as RecurringDeadline[];
}

export async function createRecurringDeadline(
  userId: string,
  deadline: Omit<RecurringDeadline, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>
): Promise<void> {
  const { error } = await supabase
    .from('user_recurring_deadlines')
    .insert({ user_id: userId, ...deadline } as any);

  if (error) throw error;
}

export async function deleteRecurringDeadline(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_recurring_deadlines')
    .update({ is_active: false } as any)
    .eq('id', id);

  if (error) throw error;
}

export function getCategoryInfo(category: string) {
  return CATEGORIES.find((c) => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
}

/** Get all recurring deadlines that fall in a given month */
export function getDeadlinesForMonth(deadlines: RecurringDeadline[], year: number, month: number): RecurringDeadline[] {
  return deadlines.filter((d) => {
    const date = new Date(d.next_date);
    if (d.frequency === 'monthly') return true;
    if (d.frequency === 'quarterly') {
      const deadlineMonth = date.getMonth();
      const diff = (month - deadlineMonth + 12) % 12;
      return diff % 3 === 0;
    }
    if (d.frequency === 'annually') {
      return date.getMonth() === month;
    }
    return false;
  });
}

/** Get the effective date for a recurring deadline in a specific month */
export function getEffectiveDateInMonth(deadline: RecurringDeadline, year: number, month: number): Date {
  const original = new Date(deadline.next_date);
  return new Date(year, month, original.getDate());
}

export async function analyzeDocumentForDeadlines(
  documentContent: string,
  documentPath?: string
): Promise<{ deadlines: any[]; confidence: number }> {
  const { data, error } = await supabase.functions.invoke('extract-document-deadlines', {
    body: { documentContent, documentPath },
  });

  if (error) throw error;
  return data;
}
