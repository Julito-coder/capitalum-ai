import { useState, useMemo } from 'react';
import { Check, X, Loader2, Pencil, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FIELD_LABELS, ENUM_OPTIONS, type FieldMeta } from '@/lib/elio-agent/fieldLabels';

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

function getMeta(field: string, fallbackUnit?: string): FieldMeta {
  return FIELD_LABELS[field] ?? { label: field, unit: fallbackUnit, type: 'text' };
}

function formatValue(field: string, value: any): string {
  if (value === null || value === undefined || value === '') return '—';
  const meta = getMeta(field);
  if (meta.type === 'boolean') return value ? 'Oui' : 'Non';
  if (meta.type === 'enum') {
    const opt = ENUM_OPTIONS[field]?.find((o) => o.value === value);
    return opt?.label ?? String(value);
  }
  if (meta.type === 'number' || meta.type === 'year') {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return meta.unit === '€' ? `${n.toLocaleString('fr-FR')} €` : `${n.toLocaleString('fr-FR')}${meta.unit ? ' ' + meta.unit : ''}`;
  }
  return String(value);
}

function validate(field: string, value: any): string | null {
  const meta = getMeta(field);
  if (meta.type === 'number' || meta.type === 'year') {
    if (value === '' || value === null || value === undefined) return 'Valeur requise';
    const n = Number(value);
    if (!/^\d+(\.\d+)?$/.test(String(value))) return 'Nombre invalide';
    if (Number.isNaN(n)) return 'Nombre invalide';
    if (meta.min != null && n < meta.min) return `Min : ${meta.min}`;
    if (meta.max != null && n > meta.max) return `Max : ${meta.max.toLocaleString('fr-FR')}`;
  }
  if (meta.type === 'text' && (value === null || value === undefined || String(value).trim() === '')) {
    return 'Valeur requise';
  }
  return null;
}

function coerce(field: string, raw: any): any {
  const meta = getMeta(field);
  if (meta.type === 'number' || meta.type === 'year') return Number(raw);
  if (meta.type === 'boolean') return Boolean(raw);
  return raw;
}

export const ProfileUpdateProposal = ({ data, onConfirm }: Props) => {
  const initialProposals = data?.proposals ?? [];

  const [editedValues, setEditedValues] = useState<Record<string, any>>(() =>
    Object.fromEntries(initialProposals.map((p) => [p.field, p.value])),
  );
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(initialProposals.map((p) => p.field)),
  );
  const [status, setStatus] = useState<'pending' | 'editing' | 'submitting' | 'confirmed' | 'cancelled'>('pending');

  const errors = useMemo(() => {
    const out: Record<string, string | null> = {};
    for (const p of initialProposals) {
      out[p.field] = validate(p.field, editedValues[p.field]);
    }
    return out;
  }, [editedValues, initialProposals]);

  const hasErrors = Object.values(errors).some((e) => !!e);

  if (!initialProposals.length) return null;

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
    if (status !== 'pending' || hasErrors) return;
    const accepted = initialProposals
      .filter((p) => selectedFields.has(p.field))
      .map((p) => ({ field: p.field, value: coerce(p.field, editedValues[p.field]) }));

    if (!accepted.length) {
      setStatus('cancelled');
      return;
    }

    setStatus('submitting');
    try {
      await onConfirm?.(accepted);
      setStatus('confirmed');
    } catch {
      setStatus('pending');
    }
  };

  const handleCancel = () => {
    if (status === 'submitting' || status === 'confirmed') return;
    setStatus('cancelled');
  };

  // === État confirmé ===
  if (status === 'confirmed') {
    const confirmedItems = initialProposals.filter((p) => selectedFields.has(p.field));
    return (
      <div
        className="mt-3 rounded-xl p-4"
        style={{ backgroundColor: '#F5F9F5', border: '1px solid #10B981', opacity: 0.85, fontFamily: 'Sora' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-5 h-5" style={{ color: '#10B981' }} />
          <p className="text-sm font-semibold" style={{ color: '#1B3A5C' }}>Profil mis à jour</p>
        </div>
        <ul className="text-xs space-y-1" style={{ color: '#4B5563' }}>
          {confirmedItems.map((p) => (
            <li key={p.field}>
              {getMeta(p.field, p.unit).label} : <span className="font-medium">{formatValue(p.field, editedValues[p.field])}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // === État annulé ===
  if (status === 'cancelled') {
    return (
      <div
        className="mt-3 rounded-xl p-3 flex items-center gap-2"
        style={{ backgroundColor: '#F5F5F5', border: '1px solid #9CA3AF', opacity: 0.75, fontFamily: 'Sora' }}
      >
        <XCircle className="w-4 h-4" style={{ color: '#9CA3AF' }} />
        <p className="text-xs" style={{ color: '#6B7280' }}>
          {initialProposals.length} proposition{initialProposals.length > 1 ? 's' : ''} ignorée{initialProposals.length > 1 ? 's' : ''}.
        </p>
      </div>
    );
  }

  // === État pending / editing / submitting ===
  return (
    <div
      className="mt-3 rounded-xl p-5"
      style={{ backgroundColor: '#FFFBF2', border: '2px solid #C8943E', fontFamily: 'Sora' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5" style={{ color: '#C8943E' }} />
        <p className="text-sm font-semibold" style={{ color: '#1B3A5C' }}>
          Je propose d'enregistrer dans ton profil
        </p>
      </div>
      <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
        Tu peux modifier les valeurs avant de confirmer.
      </p>

      <div className="space-y-3">
        {initialProposals.map((p) => {
          const meta = getMeta(p.field, p.unit);
          const isSelected = selectedFields.has(p.field);
          const currentVal = editedValues[p.field];
          const wasEdited = currentVal !== p.value;
          const error = errors[p.field];

          return (
            <div
              key={p.field}
              className={`rounded-lg p-3 transition ${isSelected ? '' : 'opacity-50'}`}
              style={{
                backgroundColor: 'white',
                border: `1px solid ${isSelected ? '#E5DED3' : '#E5E7EB'}`,
              }}
            >
              <div className="flex items-start gap-3">
                {status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => toggle(p.field)}
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border"
                    style={{
                      borderColor: isSelected ? '#1B3A5C' : '#9CA3AF',
                      backgroundColor: isSelected ? '#1B3A5C' : 'transparent',
                    }}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <span className="text-sm font-medium" style={{ color: '#1F3347' }}>
                      {meta.label}
                    </span>
                    {status === 'pending' && (
                      <span
                        className="text-sm font-semibold"
                        style={{ color: wasEdited ? '#C8943E' : '#1B3A5C' }}
                      >
                        {wasEdited && '→ '}
                        {formatValue(p.field, currentVal)}
                      </span>
                    )}
                  </div>

                  {/* Mode édition inline */}
                  {status === 'editing' && (
                    <div className="mt-2 space-y-1">
                      {meta.type === 'enum' && (
                        <Select
                          value={String(currentVal ?? '')}
                          onValueChange={(v) => setEditedValues((prev) => ({ ...prev, [p.field]: v }))}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(ENUM_OPTIONS[p.field] ?? []).map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {meta.type === 'boolean' && (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(currentVal)}
                            onCheckedChange={(v) => setEditedValues((prev) => ({ ...prev, [p.field]: v }))}
                          />
                          <span className="text-xs" style={{ color: '#6B7280' }}>
                            {currentVal ? 'Oui' : 'Non'}
                          </span>
                        </div>
                      )}
                      {(meta.type === 'number' || meta.type === 'year') && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={currentVal ?? ''}
                            onChange={(e) => setEditedValues((prev) => ({ ...prev, [p.field]: e.target.value }))}
                            className="h-9 text-sm"
                            style={{ borderColor: error ? '#C9432E' : undefined }}
                          />
                          {meta.unit && (
                            <span className="text-sm shrink-0" style={{ color: '#6B7280' }}>{meta.unit}</span>
                          )}
                        </div>
                      )}
                      {meta.type === 'text' && (
                        <Input
                          type="text"
                          value={currentVal ?? ''}
                          onChange={(e) => setEditedValues((prev) => ({ ...prev, [p.field]: e.target.value }))}
                          className="h-9 text-sm"
                          style={{ borderColor: error ? '#C9432E' : undefined }}
                        />
                      )}
                      {error && (
                        <p className="text-xs" style={{ color: '#C9432E' }}>{error}</p>
                      )}
                    </div>
                  )}

                  {status !== 'editing' && p.reason && (
                    <p className="text-xs italic" style={{ color: '#6B7280' }}>{p.reason}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {status === 'pending' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={handleConfirm}
            disabled={selectedFields.size === 0 || hasErrors}
            size="sm"
            style={{ backgroundColor: '#1B3A5C', color: 'white' }}
            className="flex-1 hover:opacity-90"
          >
            <Check className="mr-1 h-4 w-4" />
            Confirmer ({selectedFields.size})
          </Button>
          <Button
            onClick={() => setStatus('editing')}
            variant="outline"
            size="sm"
            style={{ borderColor: '#C8943E', color: '#C8943E' }}
          >
            <Pencil className="mr-1 h-4 w-4" />
            Modifier
          </Button>
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="sm"
            style={{ color: '#6B7280' }}
          >
            <X className="mr-1 h-4 w-4" />
            Annuler
          </Button>
        </div>
      )}

      {status === 'editing' && (
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => setStatus('pending')}
            disabled={hasErrors}
            size="sm"
            style={{ backgroundColor: '#1B3A5C', color: 'white' }}
            className="flex-1 hover:opacity-90"
          >
            <Check className="mr-1 h-4 w-4" />
            Valider les modifs
          </Button>
          <Button
            onClick={() => {
              // Retour : restaure les valeurs initiales
              setEditedValues(Object.fromEntries(initialProposals.map((p) => [p.field, p.value])));
              setStatus('pending');
            }}
            variant="ghost"
            size="sm"
            style={{ color: '#6B7280' }}
          >
            Retour
          </Button>
        </div>
      )}

      {status === 'submitting' && (
        <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Enregistrement en cours…
        </div>
      )}
    </div>
  );
};
