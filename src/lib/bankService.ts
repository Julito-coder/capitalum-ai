import { supabase } from '@/integrations/supabase/client';

export interface BankAccount {
  id: string;
  bank_name: string | null;
  account_name: string | null;
  account_type: string | null;
  iban_masked: string | null;
  balance: number;
  currency: string;
  last_update: string | null;
  is_active: boolean;
  powens_connection_id: number | null;
}

export interface BankTransaction {
  id: string;
  account_id: string;
  tx_date: string;
  label: string | null;
  amount: number;
  currency: string;
  category: string | null;
  type: string | null;
}

export interface PowensConnectionStatus {
  connected: boolean;
  last_sync_at: string | null;
  connections_count: number;
}

export interface RecurringDeadline {
  id: string;
  title: string;
  category: string;
  amount: number | null;
  frequency: string;
  next_date: string;
  provider: string | null;
  source: string;
  is_active: boolean;
  notes: string | null;
}

export async function getConnectionStatus(userId: string): Promise<PowensConnectionStatus> {
  const { data } = await supabase
    .from('powens_connections')
    .select('last_sync_at')
    .eq('user_id', userId);
  const connections = data || [];
  const latest = connections.sort((a, b) =>
    (b.last_sync_at || '').localeCompare(a.last_sync_at || '')
  )[0];
  return {
    connected: connections.length > 0,
    last_sync_at: latest?.last_sync_at ?? null,
    connections_count: connections.length,
  };
}

export async function listAccounts(userId: string): Promise<BankAccount[]> {
  const { data } = await supabase
    .from('bank_accounts')
    .select('id, bank_name, account_name, account_type, iban_masked, balance, currency, last_update, is_active, powens_connection_id')
    .eq('user_id', userId)
    .order('bank_name', { ascending: true });
  return (data || []) as BankAccount[];
}

export async function listRecentTransactions(userId: string, limit = 50): Promise<BankTransaction[]> {
  const { data } = await supabase
    .from('bank_transactions')
    .select('id, account_id, tx_date, label, amount, currency, category, type')
    .eq('user_id', userId)
    .order('tx_date', { ascending: false })
    .limit(limit);
  return (data || []) as BankTransaction[];
}

export async function listRecurringDeadlines(userId: string): Promise<RecurringDeadline[]> {
  const { data } = await supabase
    .from('user_recurring_deadlines')
    .select('id, title, category, amount, frequency, next_date, provider, source, is_active, notes')
    .eq('user_id', userId)
    .eq('source', 'bank')
    .order('next_date', { ascending: true });
  return (data || []) as RecurringDeadline[];
}

export async function toggleRecurringDeadline(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('user_recurring_deadlines')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteRecurringDeadline(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_recurring_deadlines')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function startWebview(redirectUri: string): Promise<{ webview_url: string }> {
  const { data, error } = await supabase.functions.invoke('powens-init-webview', {
    body: { redirect_uri: redirectUri },
  });
  if (error) throw error;
  return data;
}

export async function syncBankData(): Promise<{
  accounts_synced: number;
  transactions_synced: number;
  recurring_detected?: number;
  urssaf_marked?: number;
}> {
  const { data, error } = await supabase.functions.invoke('powens-sync', { body: {} });
  if (error) throw error;
  return data;
}

export async function detectRecurringFromBank(): Promise<{ detected: number; urssaf_marked: number }> {
  const { data, error } = await supabase.functions.invoke('detect-recurring-from-bank', { body: {} });
  if (error) throw error;
  return data;
}

export async function disconnectBank(): Promise<void> {
  const { error } = await supabase.functions.invoke('powens-disconnect', { body: {} });
  if (error) throw error;
}
