import { Info, FileText, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';
import type { TxDraft } from '@/pages/crypto/CryptoWizard';

interface Props {
  transactions: TxDraft[];
}

const CHECKLIST_ITEMS = [
  'Comptes étrangers déclarés ? (3916 / 3916-bis)',
  'Toutes les cessions ont été identifiées et qualifiées',
  'Valorisations EUR vérifiées',
  'Justificatifs importés (relevés exchange)',
  'Export PDF généré',
];

export const WizardPreparationStep = ({ transactions }: Props) => {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggleItem = (idx: number) => {
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const completedCount = Object.values(checked).filter(Boolean).length;

  const taxableCount = transactions.filter((t) =>
    ['crypto_to_fiat', 'payment'].includes(t.classification)
  ).length;

  const missingValorisation = transactions.filter(
    (t) => ['crypto_to_fiat', 'payment'].includes(t.classification) && (!t.fiatValueEur || parseFloat(t.fiatValueEur) <= 0)
  ).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 6 — Préparer le 2086</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Vérifie la checklist finale avant de passer aux contrôles et au report.
        </p>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p>
              Le formulaire 2086 sera pré-rempli avec les montants calculés. Tu pourras ensuite
              les copier/coller sur impots.gouv.fr dans le <strong>Pack de report</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-3 text-xs">
        <Badge variant="secondary">{transactions.length} transaction{transactions.length > 1 ? 's' : ''}</Badge>
        <Badge variant="secondary">{taxableCount} taxable{taxableCount > 1 ? 's' : ''}</Badge>
        {missingValorisation > 0 && (
          <Badge className="bg-warning/10 text-warning">{missingValorisation} valorisation{missingValorisation > 1 ? 's' : ''} manquante{missingValorisation > 1 ? 's' : ''}</Badge>
        )}
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Checklist finale
          </h3>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{CHECKLIST_ITEMS.length}
          </span>
        </div>

        {CHECKLIST_ITEMS.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
              checked[idx]
                ? 'bg-success/5 border-success/20'
                : 'bg-muted/10 border-border/20'
            }`}
            onClick={() => toggleItem(idx)}
          >
            <Checkbox checked={checked[idx] ?? false} />
            <span className={`text-sm ${checked[idx] ? 'line-through text-muted-foreground' : ''}`}>
              {item}
            </span>
            {checked[idx] && <CheckCircle2 className="h-4 w-4 text-success ml-auto" />}
          </div>
        ))}
      </div>
    </div>
  );
};
