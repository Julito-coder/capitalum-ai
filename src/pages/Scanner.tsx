import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ScannerQuestionnaire } from '@/components/scanner/ScannerQuestionnaire';
import { ScannerResults } from '@/components/scanner/ScannerResults';
import { DocumentUploadScanner } from '@/components/scanner/DocumentUploadScanner';
import { ScanHistory } from '@/components/scanner/ScanHistory';
import { TaxScannerInput, DEFAULT_TAX_INPUT, ScanResult } from '@/data/taxScannerTypes';
import { detectTaxErrors } from '@/lib/taxErrorDetector';
import { detectOptimizations, calculateTaxScore } from '@/lib/taxOptimizationEngine';
import { saveScanToHistory } from '@/lib/scanHistoryService';
import { FileSearch, Shield, AlertTriangle, Upload, ClipboardList, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type ScannerStep = 'intro' | 'questionnaire' | 'upload' | 'results' | 'history';

const Scanner = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<ScannerStep>('intro');
  const [input, setInput] = useState<TaxScannerInput>(DEFAULT_TAX_INPUT);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleQuestionnaireComplete = async (data: TaxScannerInput) => {
    setInput(data);
    
    const errors = detectTaxErrors(data);
    const optimizations = detectOptimizations(data);
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const score = calculateTaxScore(errors.length, criticalErrors, 0, optimizations.length);
    
    const scanResult: ScanResult = {
      score,
      errors,
      optimizations,
      totalPotentialSavings: optimizations.reduce((sum, o) => sum + o.estimatedSavings, 0),
      totalRiskAmount: errors.reduce((sum, e) => sum + e.estimatedRisk, 0),
      timestamp: new Date()
    };

    setResult(scanResult);
    setStep('results');

    // Save to history
    if (user) {
      const { success, error } = await saveScanToHistory({
        userId: user.id,
        formType: '2042',
        scanSource: 'questionnaire',
        result: scanResult
      });
      if (success) {
        toast.success('Analyse sauvegardée dans l\'historique');
      }
    }
  };

  const handleDocumentAnalysisComplete = async (analysisResult: ScanResult, formType?: string, fileName?: string) => {
    setResult(analysisResult);
    setStep('results');

    // Save to history
    if (user) {
      const { success } = await saveScanToHistory({
        userId: user.id,
        formType: formType || '2042',
        fileName,
        scanSource: 'upload',
        result: analysisResult
      });
      if (success) {
        toast.success('Analyse sauvegardée dans l\'historique');
      }
    }
  };

  const handleViewHistoryScan = (scanResult: ScanResult) => {
    setResult(scanResult);
    setStep('results');
  };

  const handleReset = () => {
    setStep('intro');
    setInput(DEFAULT_TAX_INPUT);
    setResult(null);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {step === 'intro' && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
              <FileSearch className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Scanner de Déclaration Fiscale
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Détectez les erreurs potentielles et découvrez les optimisations fiscales 
              adaptées à ta situation avant de soumettre ta déclaration 2026.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="glass-card rounded-2xl p-6 text-left">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="font-semibold mb-2">Détection d'erreurs</h3>
                <p className="text-sm text-muted-foreground">
                  Identifiez les incohérences et risques de redressement avant soumission.
                </p>
              </div>
              
              <div className="glass-card rounded-2xl p-6 text-left">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-success" />
                </div>
                <h3 className="font-semibold mb-2">Optimisations</h3>
                <p className="text-sm text-muted-foreground">
                  Découvrez les réductions et crédits d'impôt auxquels tu as droit.
                </p>
              </div>
              
              <div className="glass-card rounded-2xl p-6 text-left">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <FileSearch className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Rapport détaillé</h3>
                <p className="text-sm text-muted-foreground">
                  Exportez un rapport PDF complet avec toutes les recommandations.
                </p>
              </div>
            </div>

            {/* Three options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
              <button 
                onClick={() => setStep('questionnaire')}
                className="glass-card rounded-2xl p-5 text-left hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <ClipboardList className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Questionnaire</h3>
                    <p className="text-xs text-muted-foreground">~5 min</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Répondez à quelques questions pour une analyse personnalisée.
                </p>
              </button>

              <button 
                onClick={() => setStep('upload')}
                className="glass-card rounded-2xl p-5 text-left hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Upload PDF</h3>
                    <p className="text-xs text-success">IA ✨</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Importez ta déclaration pour une analyse IA approfondie.
                </p>
              </button>

              <button 
                onClick={() => setStep('history')}
                className="glass-card rounded-2xl p-5 text-left hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <History className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Historique</h3>
                    <p className="text-xs text-muted-foreground">Comparer</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Consulte et comparez vos analyses précédentes.
                </p>
              </button>
            </div>

            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              ⚠️ Cet outil aide à la détection mais ne remplace pas un conseil professionnel.
            </p>
          </div>
        )}

        {step === 'questionnaire' && (
          <ScannerQuestionnaire 
            initialData={input}
            onComplete={handleQuestionnaireComplete}
            onBack={() => setStep('intro')}
          />
        )}

        {step === 'upload' && (
          <DocumentUploadScanner 
            onAnalysisComplete={handleDocumentAnalysisComplete}
            onBack={() => setStep('intro')}
          />
        )}

        {step === 'history' && (
          <ScanHistory 
            onViewScan={handleViewHistoryScan}
            onClose={() => setStep('intro')}
          />
        )}

        {step === 'results' && result && (
          <ScannerResults 
            result={result}
            onReset={handleReset}
          />
        )}
      </div>
    </Layout>
  );
};

export default Scanner;
