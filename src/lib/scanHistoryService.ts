import { supabase } from '@/integrations/supabase/client';
import { ScanResult, TaxError, TaxOptimization } from '@/data/taxScannerTypes';

interface SaveScanParams {
  userId: string;
  formType: string;
  fileName?: string;
  scanSource: 'upload' | 'questionnaire';
  result: ScanResult;
}

export async function saveScanToHistory({
  userId,
  formType,
  fileName,
  scanSource,
  result
}: SaveScanParams): Promise<{ success: boolean; error?: string }> {
  try {
    const criticalErrors = result.errors.filter(e => e.severity === 'critical').length;
    
    const insertData = {
      user_id: userId,
      form_type: formType,
      file_name: fileName || null,
      scan_source: scanSource,
      score: result.score,
      errors_count: result.errors.length,
      critical_errors_count: criticalErrors,
      optimizations_count: result.optimizations.length,
      total_potential_savings: result.totalPotentialSavings,
      total_risk_amount: result.totalRiskAmount,
      errors: JSON.parse(JSON.stringify(result.errors)),
      optimizations: JSON.parse(JSON.stringify(result.optimizations)),
    };

    const { error } = await supabase
      .from('tax_scan_history')
      .insert(insertData as any);

    if (error) {
      console.error('Error saving scan:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in saveScanToHistory:', err);
    return { success: false, error: 'Erreur inattendue' };
  }
}
