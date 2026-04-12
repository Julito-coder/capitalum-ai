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
    const isEmployee = data.professionalStatus === 'employee';
    const isSelfEmployed = data.professionalStatus === 'self_employed';
    const isRetired = data.professionalStatus === 'retired';

    const updatePayload: Record<string, unknown> = {
      full_name: data.fullName || null,
      professional_status: data.professionalStatus,
      is_employee: isEmployee,
      is_self_employed: isSelfEmployed,
      is_retired: isRetired,
      is_homeowner: data.housingStatus === 'owner',
      family_status: data.familyStatus || 'single',
      age_range: data.ageRange,
      income_range: data.incomeRange,
      children_count: data.childrenRange === '3_or_more' ? 3 : data.childrenRange === '1_or_2' ? 1 : 0,
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
