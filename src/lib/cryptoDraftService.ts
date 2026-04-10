/**
 * Service de persistence des brouillons 2086.
 *
 * Couche données : sauvegarde serveur (Supabase) + fallback localStorage.
 * Aucune logique UI dans ce fichier.
 */

import { supabase } from '@/integrations/supabase/client';
import type { AccountDraft, TxDraft } from '@/pages/crypto/CryptoWizard';

// ── Types ─────────────────────────────────────

export type DraftStatus = 'draft' | 'review' | 'ready' | 'reported' | 'archived';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

export interface CryptoDraftData {
  draftId: string | null;
  userId: string;
  taxYear: number;
  status: DraftStatus;
  currentStep: number;
  version: number;
  lastSavedAt: string | null;
  accounts: AccountDraft[];
  transactions: TxDraft[];
  initialPortfolioValue: string;
  calcSnapshot: {
    netGainEur: number;
    case3AN: number;
    case3BN: number;
    totalCessionsEur: number;
    gainsEur: number;
    lossesEur: number;
    reliabilityScore: number;
  } | null;
}

export const EMPTY_DRAFT: Omit<CryptoDraftData, 'userId'> = {
  draftId: null,
  taxYear: 2025,
  status: 'draft',
  currentStep: 0,
  version: 1,
  lastSavedAt: null,
  accounts: [],
  transactions: [],
  initialPortfolioValue: '',
  calcSnapshot: null,
};

const LOCAL_STORAGE_KEY = 'elio_crypto_draft_2086';

// ── Checksum ──────────────────────────────────

function computeChecksum(data: Pick<CryptoDraftData, 'accounts' | 'transactions' | 'initialPortfolioValue'>): string {
  const raw = JSON.stringify({
    a: data.accounts.length,
    t: data.transactions.length,
    pv: data.initialPortfolioValue,
    tIds: data.transactions.slice(0, 5).map((t) => t.id),
  });
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString(36);
}

// ── Local fallback ────────────────────────────

export function saveLocalDraft(draft: CryptoDraftData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      ...draft,
      _savedAt: new Date().toISOString(),
    }));
  } catch {
    // localStorage full — degrade silently
  }
}

export function loadLocalDraft(): CryptoDraftData | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CryptoDraftData;
  } catch {
    return null;
  }
}

export function clearLocalDraft(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

// ── Server persistence ────────────────────────

export async function loadServerDraft(userId: string, taxYear = 2025): Promise<CryptoDraftData | null> {
  // 1. Load draft metadata
  const { data: draftRow, error: draftErr } = await supabase
    .from('tax_form_2086_drafts')
    .select('*')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (draftErr || !draftRow) return null;

  // 2. Load accounts
  const { data: accountRows } = await supabase
    .from('crypto_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('tax_year', taxYear);

  const accounts: AccountDraft[] = (accountRows || []).map((a) => ({
    id: a.id,
    name: a.name,
    accountType: a.account_type as 'exchange' | 'wallet',
    country: a.country || 'FR',
    isForeignAccount: a.is_foreign_account || false,
  }));

  // 3. Load transactions
  const { data: txRows } = await supabase
    .from('crypto_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .order('tx_timestamp', { ascending: true });

  const transactions: TxDraft[] = (txRows || []).map((t) => ({
    id: t.id,
    accountId: t.account_id || '',
    date: t.tx_timestamp ? new Date(t.tx_timestamp).toISOString().split('T')[0] : '',
    assetFrom: t.asset_from || '',
    assetTo: t.asset_to || 'EUR',
    qtyFrom: String(t.qty_from || 0),
    qtyTo: String(t.qty_to || 0),
    fiatValueEur: String(t.fiat_value_eur || ''),
    feesEur: String(t.fees_eur || 0),
    classification: (t.classification || 'crypto_to_fiat') as TxDraft['classification'],
  }));

  // 4. Extract form_data
  const formData = (draftRow as any).form_data as Record<string, unknown> || {};

  return {
    draftId: draftRow.id,
    userId,
    taxYear,
    status: (draftRow.status || 'draft') as DraftStatus,
    currentStep: (draftRow as any).current_step ?? 0,
    version: (draftRow as any).version ?? 1,
    lastSavedAt: draftRow.updated_at,
    accounts,
    transactions,
    initialPortfolioValue: String(formData.initialPortfolioValue || ''),
    calcSnapshot: (formData.calcSnapshot as CryptoDraftData['calcSnapshot']) || null,
  };
}

export async function saveServerDraft(draft: CryptoDraftData): Promise<{ success: boolean; draftId: string | null; error?: string }> {
  try {
    const checksum = computeChecksum(draft);

    // 1. Upsert draft metadata
    const draftPayload = {
      user_id: draft.userId,
      tax_year: draft.taxYear,
      status: draft.status,
      current_step: draft.currentStep,
      version: draft.version,
      data_checksum: checksum,
      form_data: {
        initialPortfolioValue: draft.initialPortfolioValue,
        calcSnapshot: draft.calcSnapshot,
      },
    };

    let draftId = draft.draftId;

    if (draftId) {
      const { error } = await supabase
        .from('tax_form_2086_drafts')
        .update(draftPayload)
        .eq('id', draftId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from('tax_form_2086_drafts')
        .insert(draftPayload)
        .select('id')
        .single();
      if (error) throw error;
      draftId = data.id;
    }

    // 2. Sync accounts — delete + re-insert (simple for now)
    await supabase
      .from('crypto_accounts')
      .delete()
      .eq('user_id', draft.userId)
      .eq('tax_year', draft.taxYear);

    if (draft.accounts.length > 0) {
      const accountRows = draft.accounts.map((a) => ({
        id: a.id,
        user_id: draft.userId,
        tax_year: draft.taxYear,
        name: a.name || 'Sans nom',
        account_type: a.accountType,
        country: a.country,
        is_foreign_account: a.isForeignAccount,
      }));
      await supabase.from('crypto_accounts').insert(accountRows);
    }

    // 3. Sync transactions — delete + re-insert
    await supabase
      .from('crypto_transactions')
      .delete()
      .eq('user_id', draft.userId)
      .eq('tax_year', draft.taxYear);

    if (draft.transactions.length > 0) {
      // Batch insert in chunks of 100
      const CHUNK_SIZE = 100;
      for (let i = 0; i < draft.transactions.length; i += CHUNK_SIZE) {
        const chunk = draft.transactions.slice(i, i + CHUNK_SIZE);
        const txRows = chunk.map((t) => ({
          id: t.id,
          user_id: draft.userId,
          tax_year: draft.taxYear,
          account_id: t.accountId || null,
          tx_timestamp: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
          asset_from: t.assetFrom || '',
          asset_to: t.assetTo || 'EUR',
          qty_from: parseFloat(t.qtyFrom) || 0,
          qty_to: parseFloat(t.qtyTo) || 0,
          fiat_value_eur: parseFloat(t.fiatValueEur) || null,
          fees_eur: parseFloat(t.feesEur) || 0,
          classification: t.classification,
          source: 'wizard',
        }));
        await supabase.from('crypto_transactions').insert(txRows);
      }
    }

    // Also save locally as backup
    saveLocalDraft({ ...draft, draftId, lastSavedAt: new Date().toISOString() });

    return { success: true, draftId };
  } catch (err: any) {
    // Fallback: save locally
    saveLocalDraft(draft);
    return { success: false, draftId: draft.draftId, error: err.message || 'Erreur serveur' };
  }
}

export async function deleteDraft(draftId: string, userId: string, taxYear = 2025): Promise<boolean> {
  const { error } = await supabase
    .from('tax_form_2086_drafts')
    .delete()
    .eq('id', draftId);

  if (!error) {
    await supabase.from('crypto_accounts').delete().eq('user_id', userId).eq('tax_year', taxYear);
    await supabase.from('crypto_transactions').delete().eq('user_id', userId).eq('tax_year', taxYear);
    clearLocalDraft();
  }

  return !error;
}
