import { supabase } from '@/integrations/supabase/client';
import { ModernOnboardingData } from '@/data/modernOnboardingTypes';

export const saveModernOnboarding = async (
  userId: string,
  data: ModernOnboardingData,
  isPartial: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    const isEmployee = data.professionalStatus === 'employee';
    const isSelfEmployed = data.professionalStatus === 'self_employed';
    const isRetired = data.professionalStatus === 'retired';

    // Map housing status to is_homeowner
    const isHomeowner = data.housingStatus === 'owner_mortgage' || data.housingStatus === 'owner_paid';

    // Map children range to count
    const childrenCountMap: Record<string, number> = { 'none': 0, '1': 1, '2': 2, '3_or_more': 3 };
    const childrenCount = data.childrenRange ? childrenCountMap[data.childrenRange] ?? 0 : 0;

    const updatePayload: Record<string, unknown> = {
      full_name: data.fullName || null,
      professional_status: data.professionalStatus,
      is_employee: isEmployee,
      is_self_employed: isSelfEmployed,
      is_retired: isRetired,
      is_homeowner: isHomeowner,
      family_status: data.familyStatus || 'single',
      age_range: data.ageRange,
      income_range: data.incomeRange,
      children_count: childrenCount,
      patrimony_range: data.savingsRange,
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
