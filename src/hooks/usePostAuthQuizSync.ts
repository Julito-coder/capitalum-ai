import { useEffect, useRef } from 'react';
import { saveModernOnboarding } from '@/lib/modernOnboardingService';
import { ModernOnboardingData } from '@/data/modernOnboardingTypes';

const QUIZ_STORAGE_KEY = 'elio_quiz_data';

export interface StoredQuizData {
  data: ModernOnboardingData;
  score: number;
  totalLoss: number;
}

export const storeQuizData = (quizData: StoredQuizData): void => {
  localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quizData));
};

export const getStoredQuizData = (): StoredQuizData | null => {
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredQuizData;
  } catch {
    return null;
  }
};

export const clearStoredQuizData = (): void => {
  localStorage.removeItem(QUIZ_STORAGE_KEY);
};

/**
 * After auth, sync any cached quiz data to the user's profile.
 * Returns true while syncing.
 */
export const usePostAuthQuizSync = (userId: string | undefined): boolean => {
  const syncing = useRef(false);
  const synced = useRef(false);

  useEffect(() => {
    if (!userId || synced.current || syncing.current) return;

    const quizData = getStoredQuizData();
    if (!quizData) {
      synced.current = true;
      return;
    }

    syncing.current = true;

    saveModernOnboarding(userId, quizData.data, false).then(() => {
      clearStoredQuizData();
      synced.current = true;
      syncing.current = false;
    });
  }, [userId]);

  return syncing.current;
};
