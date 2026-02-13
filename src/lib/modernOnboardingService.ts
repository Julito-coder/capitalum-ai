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
    // Map professional status to profile flags
    const isEmployee = data.professionalStatus === 'salarie';
    const isSelfEmployed = data.professionalStatus === 'independant' || data.professionalStatus === 'chef_entreprise';

    // Map family situation
    let familyStatus = 'single';
    if (data.familySituation === 'en_couple') familyStatus = 'married';
    if (data.familySituation === 'avec_enfants') familyStatus = 'married';

    const updatePayload: Record<string, unknown> = {
      full_name: data.fullName || null,
      professional_status: data.professionalStatus,
      is_employee: isEmployee,
      is_self_employed: isSelfEmployed,
      family_status: familyStatus,
      age_range: data.ageRange,
      income_range: data.incomeRange,
      patrimony_range: data.patrimonyRange,
      risk_tolerance: data.riskTolerance,
      tax_bracket: data.taxBracket,
      financial_objectives: data.financialObjectives,
      declares_in_france: data.declaresInFrance,
      primary_objective: data.financialObjectives[0] === 'impots' ? 'reduce_ir' : 'treasury',
      onboarding_completed: !isPartial,
      onboarding_partial: isPartial,
      onboarding_completed_at: !isPartial ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload as any)
      .eq('user_id', userId);

    if (error) {
      console.error('Error saving modern onboarding:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Error saving modern onboarding:', err);
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
      .select('onboarding_completed, full_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return { completed: false, partial: false, fullName: null };

    const d = data as any;
    return {
      completed: d.onboarding_completed || false,
      partial: d.onboarding_partial || false,
      fullName: d.full_name || null,
    };
  } catch {
    return { completed: false, partial: false, fullName: null };
  }
};
