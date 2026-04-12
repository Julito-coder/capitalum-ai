import { supabase } from '@/integrations/supabase/client';
import { ModernOnboardingData } from '@/data/modernOnboardingTypes';

/**
 * Save the modern simplified onboarding data to the profiles table.
 */
export const saveModernOnboarding = async (
  userId: string,
  data: ModernOnboardingData,
  isPartial: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    const isEmployee = data.professionalStatus === 'salarie';
    const isSelfEmployed = data.professionalStatus === 'independant' || data.professionalStatus === 'chef_entreprise';

    let familyStatus = 'single';
    if (data.familySituation === 'en_couple') familyStatus = 'married';
    if (data.familySituation === 'avec_enfants') familyStatus = 'married';

    const updatePayload: Record<string, unknown> = {
      full_name: data.fullName || null,
      professional_status: data.professionalStatus,
      is_employee: isEmployee,
      is_self_employed: isSelfEmployed,
      is_homeowner: data.housingStatus === 'proprietaire',
      family_status: familyStatus,
      age_range: data.ageRange,
      income_range: data.incomeRange,
      patrimony_range: data.patrimonyRange,
      tax_bracket: data.taxBracket,
      financial_objectives: data.financialObjectives,
      declares_in_france: data.declaresInFrance,
      primary_objective: data.financialObjectives[0] === 'impots' ? 'reduce_ir' : 'treasury',
      onboarding_completed: true,
      onboarding_partial: isPartial,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload as Record<string, unknown>)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Une erreur est survenue' };
  }
};

/**
 * Load existing profile data to check onboarding status.
 */
export const loadOnboardingStatus = async (
  userId: string
): Promise<{ completed: boolean; partial: boolean; fullName: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed, onboarding_partial, full_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return { completed: false, partial: false, fullName: null };

    return {
      completed: data.onboarding_completed || false,
      partial: data.onboarding_partial || false,
      fullName: data.full_name || null,
    };
  } catch {
    return { completed: false, partial: false, fullName: null };
  }
};
