import { OnboardingData, PROFILE_LABELS, OBJECTIVE_LABELS } from '@/data/onboardingTypes';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface Props {
  data: OnboardingData;
  updateData: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
}

export const ConsentStep = ({ data, updateData }: Props) => {
  const dataCategories = [
    { label: 'Identité & Contact', filled: !!data.fullName },
    { label: 'Situation familiale', filled: data.familyStatus !== 'single' || data.childrenCount > 0 },
    { label: 'Objectif fiscal', filled: !!data.primaryObjective },
    ...(data.profileTypes.includes('employee') ? [{ label: 'Revenus salariés', filled: data.grossMonthlySalary > 0 }] : []),
    ...(data.profileTypes.includes('self_employed') ? [{ label: 'Activité indépendante', filled: !!data.siret || data.annualRevenueHt > 0 }] : []),
    ...(data.profileTypes.includes('retired') ? [{ label: 'Revenus retraite', filled: data.mainPensionAnnual > 0 }] : []),
    ...(data.profileTypes.includes('investor') ? [{ label: 'Investissements', filled: data.rentalProperties.length > 0 || data.peaBalance > 0 }] : []),
  ];

  const filledCount = dataCategories.filter(c => c.filled).length;
  const completionPercent = Math.round((filledCount / dataCategories.length) * 100);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          Récapitulatif de tes données
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Complétude</span>
            <span className="font-medium">{completionPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${completionPercent >= 80 ? 'bg-success' : completionPercent >= 50 ? 'bg-warning' : 'bg-destructive'}`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {dataCategories.map((cat, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {cat.filled ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={cat.filled ? 'text-foreground' : 'text-muted-foreground'}>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Summary */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-medium">Ton profil Élio</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Profils actifs</span>
            <span>{data.profileTypes.map(p => PROFILE_LABELS[p]).join(', ') || 'Aucun'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Objectif principal</span>
            <span>{OBJECTIVE_LABELS[data.primaryObjective]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Foyer fiscal</span>
            <span>{data.childrenCount > 0 ? `${data.childrenCount} enfant(s)` : 'Sans enfant'}</span>
          </div>
        </div>
      </div>

      {/* Consents */}
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="cursor-pointer font-medium">Consentement RGPD *</Label>
              <p className="text-sm text-muted-foreground mt-1">
                J'accepte que mes données soient traitées pour l'analyse fiscale personnalisée. 
                Données chiffrées, supprimables en 1 clic.
              </p>
            </div>
            <Switch
              checked={data.gdprConsent}
              onCheckedChange={(v) => updateData('gdprConsent', v)}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="cursor-pointer font-medium">Analyse IA</Label>
              <p className="text-sm text-muted-foreground mt-1">
                J'autorise l'utilisation de l'IA pour optimiser mes recommandations fiscales et détecter des opportunités.
              </p>
            </div>
            <Switch
              checked={data.aiAnalysisConsent}
              onCheckedChange={(v) => updateData('aiAnalysisConsent', v)}
            />
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
        <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Sécurité & Confidentialité</p>
          <ul className="space-y-1">
            <li>• Chiffrement AES-256 de toutes tes données</li>
            <li>• Hébergement RGPD en Europe</li>
            <li>• Suppression complète sur demande</li>
            <li>• Conseil non-substitutif d'un expert-comptable</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
