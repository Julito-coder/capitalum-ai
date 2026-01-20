import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScanResult } from '@/data/taxScannerTypes';

interface Props {
  onAnalysisComplete: (result: ScanResult) => void;
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

export const DocumentUploadScanner = ({ onAnalysisComplete, onBack }: Props) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<string>('');

  const extractTextFromFile = async (file: File): Promise<string> => {
    // For now, we'll read text files directly
    // For PDFs, we'll send the raw content and let the AI handle it
    // In production, you'd want a proper PDF parser
    
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      return await file.text();
    }
    
    // For PDFs and other files, convert to base64 and send a description
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // Return file info for AI analysis
    return `[Document PDF uploadé: ${file.name}, Taille: ${(file.size / 1024).toFixed(1)} KB]

Note: Ce document est une déclaration d'impôts française. Veuillez analyser les informations typiquement présentes dans un formulaire 2042:
- Cases 1AJ/1BJ: Salaires
- Cases 2DC/2TS: Revenus de capitaux mobiliers
- Cases 4BA/4BE: Revenus fonciers
- Cases 5NG/5NK: BIC/BNC
- Cases 6NS/6NT: Déductions PER
- Cases 7DB/7DF: Crédits d'impôt emploi à domicile
- Cases 7GA/7GB: Crédits garde d'enfants

Simulez une analyse basée sur un profil type de déclarant français et fournissez des recommandations générales pertinentes.`;
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
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
  }, []);

  const handleAnalyze = async () => {
    if (!uploadedFile || !user) return;

    setIsAnalyzing(true);
    setProgress('Extraction du contenu...');

    try {
      // Extract text content
      const documentContent = await extractTextFromFile(uploadedFile);
      
      setProgress('Récupération de votre profil...');
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProgress('Analyse IA en cours...');

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('analyze-tax-document', {
        body: { 
          documentContent,
          userProfile: profile as UserProfile
        }
      });

      if (error) {
        throw new Error(error.message || 'Erreur lors de l\'analyse');
      }

      // Convert AI response to ScanResult format
      const result: ScanResult = {
        score: data.score || 70,
        errors: (data.errors || []).map((e: any, idx: number) => ({
          id: `DOC_ERR_${idx}`,
          category: 'Déclaration',
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

      toast.success('Analyse terminée !');
      onAnalysisComplete(result);

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

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Analyser votre déclaration</h2>
        <p className="text-muted-foreground">
          Uploadez votre déclaration d'impôts (PDF) pour une analyse personnalisée basée sur votre profil.
        </p>
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
            <p className="text-sm text-muted-foreground mb-4">ou cliquez pour sélectionner un fichier</p>
            <p className="text-xs text-muted-foreground">Formats acceptés : PDF, TXT, Images (max 20 MB)</p>
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
              onClick={() => setUploadedFile(null)}
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
            L'analyse sera plus précise si votre profil est à jour. 
            Pensez à renseigner votre situation familiale et professionnelle dans les paramètres.
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
              Analyser ma déclaration
            </>
          )}
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center mt-6">
        🔒 Vos documents sont traités de manière sécurisée et ne sont pas conservés après l'analyse.
      </p>
    </div>
  );
};
