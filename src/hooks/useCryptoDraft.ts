/**
 * Hook de persistence du brouillon 2086.
 *
 * Gère : chargement initial, auto-save (debounce), visibilitychange,
 * beforeunload, statut de sauvegarde, fallback local.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { AccountDraft, TxDraft } from '@/pages/crypto/CryptoWizard';
import {
  type CryptoDraftData,
  type SaveStatus,
  type DraftStatus,
  EMPTY_DRAFT,
  loadServerDraft,
  saveServerDraft,
  loadLocalDraft,
  saveLocalDraft,
  clearLocalDraft,
} from '@/lib/cryptoDraftService';

const DEBOUNCE_MS = 1200;

export interface UseCryptoDraftReturn {
  // State
  accounts: AccountDraft[];
  transactions: TxDraft[];
  initialPortfolioValue: string;
  currentStep: number;
  draftId: string | null;
  draftStatus: DraftStatus;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  isLoading: boolean;
  hasExistingDraft: boolean;

  // Setters
  setAccounts: React.Dispatch<React.SetStateAction<AccountDraft[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<TxDraft[]>>;
  setInitialPortfolioValue: React.Dispatch<React.SetStateAction<string>>;
  setCurrentStep: (step: number) => void;
  setCalcSnapshot: (snapshot: CryptoDraftData['calcSnapshot']) => void;

  // Actions
  saveNow: () => Promise<void>;
  resetDraft: () => void;
}

export function useCryptoDraft(taxYear = 2025): UseCryptoDraftReturn {
  const { user } = useAuth();
  const userId = user?.id || '';

  const [accounts, setAccounts] = useState<AccountDraft[]>([]);
  const [transactions, setTransactions] = useState<TxDraft[]>([]);
  const [initialPortfolioValue, setInitialPortfolioValue] = useState('');
  const [currentStep, setCurrentStepState] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('draft');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingDraft, setHasExistingDraft] = useState(false);
  const [calcSnapshot, setCalcSnapshotState] = useState<CryptoDraftData['calcSnapshot']>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);

  // ── Build draft object ──
  const buildDraft = useCallback((): CryptoDraftData => ({
    draftId,
    userId,
    taxYear,
    status: draftStatus,
    currentStep,
    version: 1,
    lastSavedAt,
    accounts,
    transactions,
    initialPortfolioValue,
    calcSnapshot,
  }), [draftId, userId, taxYear, draftStatus, currentStep, lastSavedAt, accounts, transactions, initialPortfolioValue, calcSnapshot]);

  // ── Save ──
  const performSave = useCallback(async () => {
    if (!userId || isSavingRef.current) return;
    isSavingRef.current = true;
    setSaveStatus('saving');

    const draft = buildDraft();
    const result = await saveServerDraft(draft);

    if (result.success) {
      setSaveStatus('saved');
      if (result.draftId && result.draftId !== draftId) {
        setDraftId(result.draftId);
      }
      setLastSavedAt(new Date().toISOString());
      isDirtyRef.current = false;
    } else {
      setSaveStatus('offline');
      saveLocalDraft(draft);
    }

    isSavingRef.current = false;
  }, [buildDraft, userId, draftId]);

  const saveNow = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await performSave();
  }, [performSave]);

  // ── Debounced auto-save ──
  const scheduleSave = useCallback(() => {
    isDirtyRef.current = true;
    setSaveStatus('idle');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSave();
    }, DEBOUNCE_MS);
  }, [performSave]);

  // ── Step change triggers save ──
  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
    // Save immediately on step change
    setTimeout(() => performSave(), 100);
  }, [performSave]);

  const setCalcSnapshot = useCallback((snapshot: CryptoDraftData['calcSnapshot']) => {
    setCalcSnapshotState(snapshot);
  }, []);

  // ── Watch data changes ──
  useEffect(() => {
    if (!isLoading && userId) {
      scheduleSave();
    }
  }, [accounts, transactions, initialPortfolioValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load on mount ──
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadDraft = async () => {
      setIsLoading(true);
      try {
        const serverDraft = await loadServerDraft(userId, taxYear);
        const localDraft = loadLocalDraft();

        // Prefer server, fallback to local
        const draft = serverDraft || localDraft;

        if (draft) {
          setHasExistingDraft(true);
          setDraftId(draft.draftId);
          setAccounts(draft.accounts);
          setTransactions(draft.transactions);
          setInitialPortfolioValue(draft.initialPortfolioValue);
          setCurrentStepState(draft.currentStep);
          setDraftStatus(draft.status);
          setLastSavedAt(draft.lastSavedAt);
          setCalcSnapshotState(draft.calcSnapshot);

          if (serverDraft) {
            clearLocalDraft();
          }
        }
      } catch (err) {
        console.error('[CryptoDraft] Load error:', err);
        // Try local fallback
        const localDraft = loadLocalDraft();
        if (localDraft) {
          setHasExistingDraft(true);
          setAccounts(localDraft.accounts);
          setTransactions(localDraft.transactions);
          setInitialPortfolioValue(localDraft.initialPortfolioValue);
          setCurrentStepState(localDraft.currentStep);
          setSaveStatus('offline');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [userId, taxYear]);

  // ── Visibility change → save ──
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isDirtyRef.current && userId) {
        performSave();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [performSave, userId]);

  // ── Before unload → save ──
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current && userId) {
        // Sync save via localStorage as last resort
        saveLocalDraft(buildDraft());
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [buildDraft, userId]);

  // ── Reset ──
  const resetDraft = useCallback(() => {
    setAccounts([]);
    setTransactions([]);
    setInitialPortfolioValue('');
    setCurrentStepState(0);
    setDraftId(null);
    setDraftStatus('draft');
    setLastSavedAt(null);
    setCalcSnapshotState(null);
    setHasExistingDraft(false);
    clearLocalDraft();
  }, []);

  return {
    accounts,
    transactions,
    initialPortfolioValue,
    currentStep,
    draftId,
    draftStatus,
    saveStatus,
    lastSavedAt,
    isLoading,
    hasExistingDraft,
    setAccounts,
    setTransactions,
    setInitialPortfolioValue,
    setCurrentStep,
    setCalcSnapshot,
    saveNow,
    resetDraft,
  };
}
