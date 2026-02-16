import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Download, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface CessionEntry {
  id: string;
  date: string;
  assetName: string;
  prixCession: number;
  prixTotalAcquisitionPortefeuille: number;
  valeurGlobalePortefeuille: number;
  frais: number;
}

interface Crypto2086FormProps {
  initialData?: { entries: CessionEntry[]; regime: string };
  cryptoPnl?: number;
  onSave: (data: { entries: CessionEntry[]; totals: { totalPV: number; totalMV: number; case3AN: number; case3BN: number }; regime: string }) => void;
  onFieldFocus?: (fieldName: string) => void;
}

function createEmptyEntry(): CessionEntry {
  return {
    id: crypto.randomUUID(),
    date: '',
    assetName: '',
    prixCession: 0,
    prixTotalAcquisitionPortefeuille: 0,
    valeurGlobalePortefeuille: 0,
    frais: 0,
  };
}

/** Calcul PMPA : Plus/Moins-value = Prix de cession - (Prix total acquisition × (Prix cession / Valeur globale portefeuille)) - Frais */
function computePV(entry: CessionEntry): number {
  if (entry.valeurGlobalePortefeuille <= 0) return 0;
  const fractionCedee = entry.prixCession / entry.valeurGlobalePortefeuille;
  const prixAcquisitionFraction = entry.prixTotalAcquisitionPortefeuille * fractionCedee;
  return Math.round((entry.prixCession - prixAcquisitionFraction - entry.frais) * 100) / 100;
}

export const Crypto2086Form = ({ initialData, cryptoPnl, onSave, onFieldFocus }: Crypto2086FormProps) => {
  const [entries, setEntries] = useState<CessionEntry[]>(initialData?.entries ?? [createEmptyEntry()]);
  const [regime, setRegime] = useState(initialData?.regime ?? 'pfu');

  const totals = useMemo(() => {
    let totalPV = 0;
    let totalMV = 0;
    for (const e of entries) {
      const pv = computePV(e);
      if (pv >= 0) totalPV += pv;
      else totalMV += pv;
    }
    return {
      totalPV: Math.round(totalPV * 100) / 100,
      totalMV: Math.round(totalMV * 100) / 100,
      case3AN: Math.max(0, Math.round((totalPV + totalMV) * 100) / 100),
      case3BN: Math.abs(Math.min(0, Math.round((totalPV + totalMV) * 100) / 100)),
    };
  }, [entries]);

  const updateEntry = useCallback((id: string, field: keyof CessionEntry, value: string | number) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }, []);

  const addEntry = () => setEntries((prev) => [...prev, createEmptyEntry()]);
  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const handleSave = () => {
    onSave({ entries, totals, regime });
    toast({ title: '✅ Formulaire sauvegardé', description: 'Les données du 2086 ont été enregistrées.' });
  };

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Formulaire 2086 — Plus-values sur actifs numériques</p>
            <p className="text-muted-foreground">
              Déclare ici chaque cession de crypto-actifs (vente contre euros ou achat de bien/service). 
              Les échanges crypto-crypto ne sont pas des cessions imposables.
            </p>
            {cryptoPnl !== undefined && cryptoPnl !== 0 && (
              <p className="mt-2 font-medium text-primary">
                💡 D'après ton profil, ta PnL crypto est de {cryptoPnl.toLocaleString('fr-FR')} €
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Régime fiscal */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold" onFocus={() => onFieldFocus?.('regime')}>Régime d'imposition</Label>
        <Select value={regime} onValueChange={setRegime}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pfu">PFU — Flat tax 30% (12,8% IR + 17,2% PS)</SelectItem>
            <SelectItem value="bareme">Barème progressif (sur option)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cessions list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Cessions réalisées</h3>
          <Button variant="outline" size="sm" onClick={addEntry}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter une cession
          </Button>
        </div>

        {entries.map((entry, idx) => {
          const pv = computePV(entry);
          return (
            <div key={entry.id} className="p-4 rounded-xl border border-border/30 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Cession n°{idx + 1}</p>
                {entries.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeEntry(entry.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Date de cession</Label>
                  <Input
                    type="date"
                    value={entry.date}
                    onChange={(e) => updateEntry(entry.id, 'date', e.target.value)}
                    onFocus={() => onFieldFocus?.('date_cession')}
                  />
                </div>
                <div>
                  <Label className="text-xs">Actif cédé</Label>
                  <Input
                    placeholder="Ex: BTC, ETH..."
                    value={entry.assetName}
                    onChange={(e) => updateEntry(entry.id, 'assetName', e.target.value)}
                    onFocus={() => onFieldFocus?.('actif_cede')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Prix de cession (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={entry.prixCession || ''}
                    onChange={(e) => updateEntry(entry.id, 'prixCession', parseFloat(e.target.value) || 0)}
                    onFocus={() => onFieldFocus?.('prix_cession')}
                  />
                </div>
                <div>
                  <Label className="text-xs">Valeur globale du portefeuille (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={entry.valeurGlobalePortefeuille || ''}
                    onChange={(e) => updateEntry(entry.id, 'valeurGlobalePortefeuille', parseFloat(e.target.value) || 0)}
                    onFocus={() => onFieldFocus?.('valeur_globale_portefeuille')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Prix total d'acquisition du portefeuille (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={entry.prixTotalAcquisitionPortefeuille || ''}
                    onChange={(e) => updateEntry(entry.id, 'prixTotalAcquisitionPortefeuille', parseFloat(e.target.value) || 0)}
                    onFocus={() => onFieldFocus?.('prix_total_acquisition')}
                  />
                </div>
                <div>
                  <Label className="text-xs">Frais de cession (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={entry.frais || ''}
                    onChange={(e) => updateEntry(entry.id, 'frais', parseFloat(e.target.value) || 0)}
                    onFocus={() => onFieldFocus?.('frais')}
                  />
                </div>
              </div>

              {/* PV/MV result */}
              <div className={`p-2 rounded-lg text-sm font-medium text-center ${pv >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {pv >= 0 ? '+' : ''}{pv.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € — {pv >= 0 ? 'Plus-value' : 'Moins-value'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals — Cases 3AN / 3BN */}
      <div className="p-5 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-3">
        <h3 className="font-bold text-sm">Récapitulatif — Cases à reporter</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-xl bg-success/10 border border-success/20" onClick={() => onFieldFocus?.('case_3AN')}>
            <p className="text-xs text-muted-foreground mb-1">Case 3AN — Plus-values</p>
            <p className="text-xl font-bold text-success">{totals.case3AN.toLocaleString('fr-FR')} €</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-destructive/10 border border-destructive/20" onClick={() => onFieldFocus?.('case_3BN')}>
            <p className="text-xs text-muted-foreground mb-1">Case 3BN — Moins-values</p>
            <p className="text-xl font-bold text-destructive">{totals.case3BN.toLocaleString('fr-FR')} €</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Impôt estimé ({regime === 'pfu' ? 'PFU 30%' : 'Barème'}) : {(totals.case3AN * (regime === 'pfu' ? 0.30 : 0.30)).toLocaleString('fr-FR')} €
        </p>
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <Button className="flex-1" onClick={handleSave}>
          Sauvegarder
        </Button>
        <Button variant="outline" onClick={() => {
          toast({ title: '📄 Export PDF', description: 'Fonctionnalité bientôt disponible.' });
        }}>
          <Download className="h-4 w-4 mr-1" /> PDF
        </Button>
      </div>
    </div>
  );
};
