import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FiscalProfileData } from '@/lib/fiscalProfileService';

interface Props {
  data: FiscalProfileData;
  onChange: (updates: Partial<FiscalProfileData>) => void;
}

export const ConsentsSection = ({ data, onChange }: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch
          checked={data.declaresInFrance}
          onCheckedChange={(v) => onChange({ declaresInFrance: v })}
        />
        <Label>Je déclare mes revenus en France</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={data.gdprConsent}
          onCheckedChange={(v) => onChange({ gdprConsent: v })}
        />
        <div>
          <Label>Consentement RGPD</Label>
          <p className="text-xs text-muted-foreground">J'accepte le traitement de mes données personnelles conformément à la politique de confidentialité.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={data.aiAnalysisConsent}
          onCheckedChange={(v) => onChange({ aiAnalysisConsent: v })}
        />
        <div>
          <Label>Analyse IA</Label>
          <p className="text-xs text-muted-foreground">J'autorise l'utilisation de mes données pour des recommandations personnalisées par IA.</p>
        </div>
      </div>
    </div>
  );
};
