import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ScanResult } from '@/data/taxScannerTypes';
import { TaxFormType, TAX_FORMS, FORM_DETECTION_PATTERNS } from '@/data/taxFormTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Props {
  onAnalysisComplete: (result: ScanResult, formType?: string, fileName?: string) => void;
  onBack: () => void;
}

interface UserProfile {
  family_status?: string;
  birth_year?: number;
  professional_status?: string;
  children_count?: number;
  has_rental_income?: boolean;
  has_investments?: boolean;
  full_name?: string;
  company_name?: string;
}

const FORM_CATEGORIES = [
  { label: 'Déclaration principale', forms: ['2042', '2042-C', '2042-C-PRO', '2042-RICI'] as TaxFormType[] },
  { label: 'Immobilier', forms: ['2044', '2031'] as TaxFormType[] },
  { label: 'Revenus financiers', forms: ['2074', '2086'] as TaxFormType[] },
  { label: 'International', forms: ['2047', '3916', '3916-bis'] as TaxFormType[] },
  { label: 'Entreprise', forms: ['2035', '2065'] as TaxFormType[] },
];

export const DocumentUploadScanner = ({ onAnalysisComplete, onBack }: Props) => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [autoDetect, setAutoDetect] = useState(true);
  const [selectedFormType, setSelectedFormType] = useState<TaxFormType>('2042');
  const [detectedFormType, setDetectedFormType] = useState<TaxFormType | null>(null);

  const detectFormTypeFromContent = (content: string): TaxFormType => {
    for (const { pattern, formType } of FORM_DETECTION_PATTERNS) {
      if (pattern.test(content)) {
        return formType;
      }
    }
    return '2042'; // Default to main form
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      return await file.text();
    }
    
    // For PDFs, we'll describe what we expect and let AI handle it
    const formInfo = TAX_FORMS[autoDetect ? 'unknown' : selectedFormType];
    
    return `[Document uploadé: ${file.name}, Taille: ${(file.size / 1024).toFixed(1)} KB]

Type de formulaire ${autoDetect ? 'à détecter automatiquement' : `spécifié: ${formInfo.name} (${formInfo.code})`}

${!autoDetect ? `Cases clés à analyser: ${formInfo.keyBoxes.join(', ')}
Erreurs courantes de ce formulaire:
${formInfo.commonErrors.map(e => `- ${e}`).join('\n')}` : ''}

Veuillez analyser ce document fiscal français et identifier les erreurs et optimisations.`;
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      toast.error('Format non supporté. Utilisez PDF, TXT ou image.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 20 MB)');
      return;
    }

    setUploadedFile(file);
    
    // Try to detect form type from filename
    const detected = detectFormTypeFromContent(file.name);
    if (detected !== '2042') {
      setDetectedFormType(detected);
      if (!autoDetect) {
        setSelectedFormType(detected);
      }
    }
  }, [autoDetect]);

  const handleAnalyze = async () => {
    if (!uploadedFile || !user) return;

    setIsAnalyzing(true);
    setProgress('Extraction du contenu...');

    try {
      const documentContent = await extractTextFromFile(uploadedFile);
      
      setProgress('Récupération de votre profil...');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProgress('Analyse IA en cours...');

      const formTypeToSend = autoDetect ? 'auto-detect' : selectedFormType;

      const { data, error } = await supabase.functions.invoke('analyze-tax-document', {
        body: { 
          documentContent,
          userProfile: profile as UserProfile,
          formType: formTypeToSend
        }
      });

      if (error) {
        throw new Error(error.message || 'Erreur lors de l\'analyse');
      }

      // Update detected form type from AI response
      if (data.detectedFormType && data.detectedFormType !== 'unknown') {
        setDetectedFormType(data.detectedFormType);
      }

      const result: ScanResult = {
        score: data.score || 70,
        errors: (data.errors || []).map((e: any, idx: number) => ({
          id: `DOC_ERR_${idx}`,
          category: data.detectedFormType ? TAX_FORMS[data.detectedFormType as TaxFormType]?.category || 'Déclaration' : 'Déclaration',
          code: `D${idx + 1}`,
          severity: e.severity || 'info',
          title: e.title,
          description: e.description,
          taxBox: e.taxBox,
          estimatedRisk: e.estimatedRisk || 0,
          legalReference: e.legalReference,
          action: e.action || 'Vérifier cette information'
        })),
        optimizations: (data.optimizations || []).map((o: any, idx: number) => ({
          id: `DOC_OPT_${idx}`,
          category: 'Optimisation',
          type: 'savings' as const,
          title: o.title,
          description: o.description,
          currentValue: 0,
          optimizedValue: o.estimatedSavings || 0,
          estimatedSavings: o.estimatedSavings || 0,
          effort: o.effort || 'À évaluer',
          deadline: o.deadline,
          taxBox: o.taxBox
        })),
        totalPotentialSavings: (data.optimizations || []).reduce((sum: number, o: any) => sum + (o.estimatedSavings || 0), 0),
        totalRiskAmount: (data.errors || []).reduce((sum: number, e: any) => sum + (e.estimatedRisk || 0), 0),
        timestamp: new Date()
      };

      const detectedType = data.detectedFormType || (autoDetect ? '2042' : selectedFormType);
      toast.success(`Analyse terminée ! Formulaire: ${detectedType}`);
      onAnalysisComplete(result, detectedType, uploadedFile?.name);

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'analyse');
    } finally {
      setIsAnalyzing(false);
      setProgress('');
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      const input = document.createElement('input');
      input.type = 'file';
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      handleFileSelect({ target: input } as any);
    }
  }, [handleFileSelect]);

  const selectedFormInfo = TAX_FORMS[selectedFormType];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Analyser votre déclaration</h2>
        <p className="text-muted-foreground">
          Uploadez votre déclaration d'impôts pour une analyse IA personnalisée.
        </p>
      </div>

      {/* Form type selector */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold">Type de formulaire</h3>
              <p className="text-xs text-muted-foreground">
                {autoDetect ? 'L\'IA identifiera automatiquement le type' : 'Sélectionnez manuellement'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-detect" className="text-sm">Auto-détection</Label>
            <Switch 
              id="auto-detect"
              checked={autoDetect}
              onCheckedChange={setAutoDetect}
            />
          </div>
        </div>

        {!autoDetect && (
          <div className="space-y-4">
            <Select value={selectedFormType} onValueChange={(v) => setSelectedFormType(v as TaxFormType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un formulaire" />
              </SelectTrigger>
              <SelectContent>
                {FORM_CATEGORIES.map(category => (
                  <div key={category.label}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      {category.label}
                    </div>
                    {category.forms.map(formCode => {
                      const form = TAX_FORMS[formCode];
                      return (
                        <SelectItem key={formCode} value={formCode}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{form.code}</span>
                            <span className="text-muted-foreground">- {form.name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              form.complexity === 'expert' ? 'bg-destructive/10 text-destructive' :
                              form.complexity === 'complex' ? 'bg-warning/10 text-warning' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {form.complexity}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </div>
                ))}
              </SelectContent>
            </Select>

            {/* Selected form info */}
            <div className="p-4 rounded-xl bg-muted/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{selectedFormInfo.code}</span>
                <span className="text-sm text-muted-foreground">{selectedFormInfo.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedFormInfo.description}</p>
              
              {selectedFormInfo.commonErrors.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-destructive mb-1">Erreurs fréquentes :</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {selectedFormInfo.commonErrors.slice(0, 3).map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {detectedFormType && autoDetect && (
          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Formulaire pré-détecté : {TAX_FORMS[detectedFormType].code}</p>
              <p className="text-xs text-muted-foreground">{TAX_FORMS[detectedFormType].name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload zone */}
      <div 
        className={`glass-card rounded-2xl p-8 mb-6 border-2 border-dashed transition-all ${
          uploadedFile ? 'border-success/50 bg-success/5' : 'border-border hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {!uploadedFile ? (
          <label className="flex flex-col items-center cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium mb-2">Déposez votre déclaration ici</p>
            <p className="text-sm text-muted-foreground mb-4">ou cliquez pour sélectionner</p>
            <p className="text-xs text-muted-foreground">PDF, TXT, Images (max 20 MB)</p>
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.txt,.jpg,.jpeg,.png,application/pdf,text/plain,image/*"
              onChange={handleFileSelect}
            />
          </label>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{uploadedFile.name}</p>
              <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
            </div>
            <button 
              onClick={() => { setUploadedFile(null); setDetectedFormType(null); }}
              className="text-sm text-destructive hover:underline"
            >
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* Profile reminder */}
      <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Profil fiscal</p>
          <p className="text-xs text-muted-foreground">
            Renseignez votre profil (situation familiale, enfants, revenus fonciers) pour une analyse plus précise.
          </p>
        </div>
      </div>

      {/* Progress */}
      {isAnalyzing && (
        <div className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <p className="text-sm">{progress}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary" disabled={isAnalyzing}>
          Retour
        </button>
        <button 
          onClick={handleAnalyze} 
          className="btn-primary flex-1"
          disabled={!uploadedFile || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Analyser {!autoDetect && selectedFormType !== '2042' ? `(${selectedFormType})` : ''}
            </>
          )}
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center mt-6">
        🔒 Documents traités de manière sécurisée et non conservés après analyse.
      </p>
    </div>
  );
};
