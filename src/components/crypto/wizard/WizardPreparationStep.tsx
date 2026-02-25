import { useMemo, useState } from 'react';
import {
  Info, FileText, CheckCircle2, Download, Copy, ExternalLink,
  TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import type { TxDraft, AccountDraft } from '@/pages/crypto/CryptoWizard';
import {
  computeChronologicalPMPA,
  classifyTransaction,
  computeFieldMapping,
  estimateTaxPFU,
  generateEnhancedAlerts,
  computeReliabilityScore,
  type NormalizedTransaction,
} from '@/domain/crypto/portfolioEngine';
import {
  exportCrypto2086Pdf,
  exportCryptoAuditPdf,
} from '@/lib/cryptoPdfExport';

const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

interface Props {
  transactions: TxDraft[];
  accounts: AccountDraft[];
  initialPortfolioValue: string;
}

function draftsToNormalized(drafts: TxDraft[]): NormalizedTransaction[] {
  return drafts
    .filter((d) => d.date)
    .map((d) => ({
      id: d.id,
      date: d.date,
      type: classifyTransaction({
        assetFrom: d.assetFrom || '???',
        assetTo: d.assetTo,
        classification: d.classification,
      }),
      assetFrom: d.assetFrom || '???',
      assetTo: d.assetTo || 'EUR',
      qtyFrom: parseFloat(d.qtyFrom) || 0,
      qtyTo: parseFloat(d.qtyTo) || 0,
      fiatValueEur: parseFloat(d.fiatValueEur) || 0,
      feesEur: parseFloat(d.feesEur) || 0,
      classification: d.classification,
      accountId: d.accountId,
    }));
}

const CHECKLIST_ITEMS = [
  'Comptes étrangers déclarés ? (3916 / 3916-bis)',
  'Toutes les cessions identifiées et qualifiées',
  'Valorisations EUR vérifiées',
  'Valeur globale du portefeuille renseignée',
  'Justificatifs disponibles (relevés exchange)',
];

export const WizardPreparationStep = ({ transactions, accounts, initialPortfolioValue }: Props) => {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [exporting, setExporting] = useState<string | null>(null);

  const toggleItem = (idx: number) => {
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };
  const completedCount = Object.values(checked).filter(Boolean).length;

  const normalizedTxs = useMemo(() => draftsToNormalized(transactions), [transactions]);
  const initPV = parseFloat(initialPortfolioValue) || 0;

  const result = useMemo(() => {
    if (normalizedTxs.length === 0) return null;
    return computeChronologicalPMPA(normalizedTxs, initPV);
  }, [normalizedTxs, initPV]);

  const fieldMapping = useMemo(() => {
    if (!result) return { case3AN: 0, case3BN: 0 };
    return computeFieldMapping(result);
  }, [result]);

  const taxPFU = useMemo(() => estimateTaxPFU(fieldMapping.case3AN), [fieldMapping.case3AN]);

  const alerts = useMemo(() => {
    if (!result) return [];
    return generateEnhancedAlerts(normalizedTxs, result);
  }, [normalizedTxs, result]);

  const reliability = useMemo(() => {
    return computeReliabilityScore(normalizedTxs, alerts);
  }, [normalizedTxs, alerts]);

  const hasForeignAccounts = accounts.some((a) => a.isForeignAccount);
  const cessionCount = result?.cessionLines.length ?? 0;

  const copyValue = (value: number, label: string) => {
    navigator.clipboard.writeText(value.toLocaleString('fr-FR', { minimumFractionDigits: 2 }));
    toast({ title: '📋 Copié !', description: `${label} copié dans le presse-papier.` });
  };

  const handleExportPdf = (type: 'synthese' | 'audit') => {
    if (!result) return;
    setExporting(type);
    try {
      const pdfAccounts = accounts.map((a) => ({
        name: a.name,
        accountType: a.accountType,
        country: a.country,
        isForeignAccount: a.isForeignAccount,
      }));

      const pdfLines = result.cessionLines.map((l) => ({
        date: l.date,
        assetFrom: l.assetName,
        prixCession: l.prixCession,
        prixTotalAcquisitionPortefeuille: l.prixTotalAcquisitionPortefeuille,
        valeurGlobalePortefeuille: l.valeurGlobalePortefeuille,
        fractionCedee: l.fractionCedee,
        prixAcquisitionFraction: l.prixAcquisitionFraction,
        plusValue: l.plusValue,
        frais: l.frais,
      }));

      const pdfTotals = {
        totalCessionsEur: result.totalCessionsEur,
        totalAcquisitionsEur: result.finalSnapshot.totalAcquisitionCost,
        portfolioValueEur: initPV,
        gainsEur: result.gainsEur,
        lossesEur: result.lossesEur,
        netGainEur: result.netGainEur,
        case3AN: fieldMapping.case3AN,
        case3BN: fieldMapping.case3BN,
        regime: 'PFU (30%)',
      };

      if (type === 'synthese') {
        exportCrypto2086Pdf(pdfAccounts, pdfLines, pdfTotals, 2025);
        toast({ title: '📄 PDF synthèse téléchargé' });
      } else {
        const auditEntries = result.auditTrail.map((e) => ({
          step: e.step,
          formula: e.formula,
          result: e.result,
          inputs: e.inputs,
        }));
        exportCryptoAuditPdf(auditEntries, pdfLines, pdfTotals, 2025);
        toast({ title: '📋 Journal d\'audit téléchargé' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de générer le PDF', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 6 — Synthèse fiscale crypto 2025</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Résumé complet, export PDF et montants à reporter sur impots.gouv.fr.
        </p>
      </div>

      {/* Résumé fiscal */}
      {result && (
        <Card className="border-primary/20">
          <CardContent className="py-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Résumé fiscal crypto 2025</h3>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                reliability.level === 'high' ? 'bg-success/10 text-success' :
                reliability.level === 'medium' ? 'bg-warning/10 text-warning' :
                'bg-destructive/10 text-destructive'
              }`}>
                <ShieldCheck className="h-3.5 w-3.5" />
                {reliability.score}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-muted/20">
                <p className="text-muted-foreground">Cessions taxables</p>
                <p className="text-lg font-bold">{cessionCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20">
                <p className="text-muted-foreground">Total cessions</p>
                <p className="text-lg font-bold">{formatEur(result.totalCessionsEur)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20">
                <p className="text-muted-foreground">Total acquisitions</p>
                <p className="text-lg font-bold">{formatEur(result.finalSnapshot.totalAcquisitionCost)}</p>
              </div>
              <div className={`p-3 rounded-lg ${result.netGainEur >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <p className="text-muted-foreground">Plus-value nette</p>
                <p className="text-lg font-bold flex items-center gap-1">
                  {result.netGainEur >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                  {formatEur(result.netGainEur)}
                </p>
              </div>
            </div>

            {/* Impôt estimé */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground">Impôt estimé (PFU 30%)</p>
              <p className="text-xl font-bold mt-1">{formatEur(taxPFU.totalTax)}</p>
              <p className="text-[10px] text-muted-foreground">
                IR {formatEur(taxPFU.irAmount)} + PS {formatEur(taxPFU.socialCharges)}
              </p>
            </div>

            {/* Avertissements */}
            {hasForeignAccounts && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20 text-xs">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p>
                  <strong>Obligation 3916-bis :</strong> Vous détenez des comptes à l'étranger.
                  N'oubliez pas de les déclarer via le formulaire 3916-bis.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Montants à reporter */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Copy className="h-4 w-4 text-primary" />
            Montants à reporter — impots.gouv.fr
          </h3>

          <div className="space-y-3">
            {[
              { id: 'case3AN', label: 'Case 3AN — Plus-values nettes', value: fieldMapping.case3AN, location: 'Déclaration > Annexes > 2086' },
              { id: 'case3BN', label: 'Case 3BN — Moins-values nettes', value: fieldMapping.case3BN, location: 'Déclaration > Annexes > 2086' },
            ].map((field) => (
              <div key={field.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                <div className="flex-1">
                  <p className="text-xs font-semibold">{field.label}</p>
                  <p className="text-[10px] text-muted-foreground">{field.location}</p>
                </div>
                <p className="font-mono text-lg font-bold">
                  {field.value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </p>
                <Button variant="outline" size="sm" onClick={() => copyValue(field.value, field.label)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exports */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Exports
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleExportPdf('synthese')}
              disabled={!result || exporting !== null}
              className="h-auto py-3 flex-col gap-1"
            >
              {exporting === 'synthese' ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
              <span className="text-xs">PDF Synthèse</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportPdf('audit')}
              disabled={!result || exporting !== null}
              className="h-auto py-3 flex-col gap-1"
            >
              {exporting === 'audit' ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
              <span className="text-xs">PDF Audit</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
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
