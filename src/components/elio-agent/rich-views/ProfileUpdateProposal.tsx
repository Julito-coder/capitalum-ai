import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Proposal {
  field: string;
  value: any;
  human_label: string;
  unit?: string;
  reason: string;
}

interface Props {
  data: {
    view_type?: string;
    proposal_id?: string;
    proposals?: Proposal[];
    rejected?: Proposal[];
  };
  onConfirm?: (accepted: Array<{ field: string; value: any }>) => void;
}

function formatValue(value: any, unit?: string): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') {
    return unit === '€' || unit === 'eur'
      ? `${value.toLocaleString('fr-FR')} €`
      : `${value.toLocaleString('fr-FR')}${unit ? ' ' + unit : ''}`;
  }
  return `${value}${unit ? ' ' + unit : ''}`;
}

export const ProfileUpdateProposal = ({ data, onConfirm }: Props) => {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set((data?.proposals ?? []).map((p) => p.field)),
  );
  const [status, setStatus] = useState<'pending' | 'submitting' | 'done' | 'cancelled'>('pending');

  const proposals = data?.proposals ?? [];
  if (!proposals.length) return null;

  const toggle = (field: string) => {
    if (status !== 'pending') return;
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (status !== 'pending') return;
    const accepted = proposals
      .filter((p) => selectedFields.has(p.field))
      .map((p) => ({ field: p.field, value: p.value }));

    if (!accepted.length) {
      setStatus('cancelled');
      return;
    }

    setStatus('submitting');
    try {
      await onConfirm?.(accepted);
      setStatus('done');
    } catch {
      setStatus('pending');
    }
  };

  const handleCancel = () => {
    if (status !== 'pending') return;
    setStatus('cancelled');
  };

  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-sm font-semibold text-foreground">Élio te propose d'enregistrer</p>
        <p className="text-xs text-muted-foreground">
          Coche les infos à sauvegarder dans ton profil — tu pourras les modifier plus tard.
        </p>
      </div>

      <div className="space-y-2">
        {proposals.map((p) => {
          const isSelected = selectedFields.has(p.field);
          const disabled = status !== 'pending';
          return (
            <button
              key={p.field}
              type="button"
              onClick={() => toggle(p.field)}
              disabled={disabled}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:border-muted-foreground/40'
              } ${disabled ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{p.human_label}</span>
                  <span className="text-sm font-semibold text-primary">{formatValue(p.value, p.unit)}</span>
                </div>
                {p.reason && <p className="mt-0.5 text-xs text-muted-foreground">{p.reason}</p>}
              </div>
            </button>
          );
        })}
      </div>

      {status === 'pending' && (
        <div className="mt-4 flex gap-2">
          <Button onClick={handleConfirm} className="flex-1" size="sm">
            <Check className="mr-1 h-4 w-4" />
            Enregistrer ({selectedFields.size})
          </Button>
          <Button onClick={handleCancel} variant="outline" size="sm">
            <X className="mr-1 h-4 w-4" />
            Plus tard
          </Button>
        </div>
      )}

      {status === 'submitting' && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Enregistrement en cours…
        </div>
      )}

      {status === 'done' && (
        <p className="mt-4 text-sm text-primary">✓ Profil mis à jour. Élio reprend ton calcul.</p>
      )}

      {status === 'cancelled' && (
        <p className="mt-4 text-sm text-muted-foreground">Aucune sauvegarde — tu pourras le faire plus tard.</p>
      )}
    </div>
  );
};
