import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ScannerQuestionnaire } from '@/components/scanner/ScannerQuestionnaire';
import { ScannerResults } from '@/components/scanner/ScannerResults';
import { TaxScannerInput, DEFAULT_TAX_INPUT, ScanResult } from '@/data/taxScannerTypes';
import { detectTaxErrors } from '@/lib/taxErrorDetector';
import { detectOptimizations, calculateTaxScore } from '@/lib/taxOptimizationEngine';
import { FileSearch, Shield, AlertTriangle } from 'lucide-react';

const Scanner = () => {
  const [step, setStep] = useState<'intro' | 'questionnaire' | 'results'>('intro');
  const [input, setInput] = useState<TaxScannerInput>(DEFAULT_TAX_INPUT);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleStartScan = () => {
    setStep('questionnaire');
  };

  const handleComplete = (data: TaxScannerInput) => {
    setInput(data);
    
    const errors = detectTaxErrors(data);
    const optimizations = detectOptimizations(data);
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const score = calculateTaxScore(errors.length, criticalErrors, 0, optimizations.length);
    
    setResult({
      score,
      errors,
      optimizations,
      totalPotentialSavings: optimizations.reduce((sum, o) => sum + o.estimatedSavings, 0),
      totalRiskAmount: errors.reduce((sum, e) => sum + e.estimatedRisk, 0),
      timestamp: new Date()
    });
    
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
              adaptées à votre situation avant de soumettre votre déclaration 2026.
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
                  Découvrez les réductions et crédits d'impôt auxquels vous avez droit.
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

            <button onClick={handleStartScan} className="btn-primary text-lg px-8 py-4">
              Commencer l'analyse
            </button>

            <p className="text-xs text-muted-foreground mt-6 max-w-xl mx-auto">
              ⚠️ Cet outil aide à la détection mais ne remplace pas un conseil professionnel. 
              Consultez un fiscaliste pour les optimisations complexes.
            </p>
          </div>
        )}

        {step === 'questionnaire' && (
          <ScannerQuestionnaire 
            initialData={input}
            onComplete={handleComplete}
            onBack={() => setStep('intro')}
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
