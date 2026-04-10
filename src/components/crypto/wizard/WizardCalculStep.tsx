import { useMemo, useState, useEffect } from 'react';
import {
  Info, Calculator, TrendingUp, TrendingDown, AlertTriangle,
  ShieldCheck, Bug, ChevronDown, ChevronRight, Eye, BookOpen,
  HelpCircle, ArrowRightLeft,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  computeChronologicalPMPA,
  classifyTransaction,
  generateEnhancedAlerts,
  computeReliabilityScore,
  estimateTaxPFU,
  estimateTaxBareme,
  computeFieldMapping,
  type NormalizedTransaction,
  type CessionDetail,
  type ChronologicalResult,
} from '@/domain/crypto/portfolioEngine';
import type { TxDraft, AccountDraft } from '@/pages/crypto/CryptoWizard';
import type { CryptoDraftData } from '@/lib/cryptoDraftService';

const FIAT = new Set(['EUR', 'USD', 'GBP', 'CHF']);

const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

interface NormalizationResult {
  transactions: NormalizedTransaction[];
  excludedCount: number;
  excludedReasons: string[];
}

function draftsToNormalized(drafts: TxDraft[]): NormalizationResult {
  const excludedReasons: string[] = [];
  let excludedCount = 0;

  const transactions = drafts
    .filter((d) => {
      if (!d.date) {
        excludedCount++;
        return false;
      }
      return true;
    })
    .map((d) => {
      const assetFrom = d.assetFrom || '???';
      if (!d.assetFrom) {
        excludedReasons.push(`Transaction du ${d.date} : champ "De" vide (traité comme inconnu)`);
      }
      const type = classifyTransaction({
        assetFrom,
        assetTo: d.assetTo,
        classification: d.classification,
      });
      return {
        id: d.id,
        date: d.date,
        type,
        assetFrom,
        assetTo: d.assetTo || 'EUR',
        qtyFrom: parseFloat(d.qtyFrom) || 0,
        qtyTo: parseFloat(d.qtyTo) || 0,
        fiatValueEur: parseFloat(d.fiatValueEur) || 0,
        feesEur: parseFloat(d.feesEur) || 0,
        classification: d.classification,
        accountId: d.accountId,
        portfolioValueOverride: d.portfolioValueOverride ? parseFloat(d.portfolioValueOverride) : undefined,
      };
    });

  if (excludedCount > 0) {
    excludedReasons.unshift(`${excludedCount} transaction(s) ignorée(s) car sans date`);
  }

  return { transactions, excludedCount, excludedReasons };
}

interface Props {
  transactions: TxDraft[];
  accounts: AccountDraft[];
  initialPortfolioValue: string;
  onCalcComplete?: (snapshot: CryptoDraftData['calcSnapshot']) => void;
}

// ── Diagnostic component for zero/empty results ──
function ZeroDiagnostic({ normalizedTxs }: { normalizedTxs: NormalizedTransaction[] }) {
  const cessions = normalizedTxs.filter((t) => t.type === 'cession');
  const acquisitions = normalizedTxs.filter((t) => t.type === 'acquisition');
  const transfers = normalizedTxs.filter((t) => t.type === 'transfer');
  const nonTaxable = normalizedTxs.filter((t) => t.type === 'non_taxable');
  const missingVal = cessions.filter((t) => !t.fiatValueEur || t.fiatValueEur <= 0);
  const missingDate = normalizedTxs.filter((t) => !t.date);

  const diagnostics: { icon: React.ReactNode; label: string; detail: string }[] = [];

  if (normalizedTxs.length === 0) {
    diagnostics.push({
      icon: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
      label: 'Aucune transaction importée',
      detail: 'Importez vos transactions via CSV ou saisie manuelle à l\'étape 2.',
    });
  } else if (cessions.length === 0) {
    diagnostics.push({
      icon: <ArrowRightLeft className="h-4 w-4 text-info" />,
      label: '0 cession taxable détectée',
      detail: `Vos ${normalizedTxs.length} opérations sont actuellement classées comme : ${acquisitions.length} acquisition(s), ${transfers.length} transfert(s), ${nonTaxable.length} échange(s) crypto-crypto. Seules les ventes vers EUR ou paiements en crypto sont taxables.`,
    });
  }

  if (missingVal.length > 0) {
    diagnostics.push({
      icon: <AlertTriangle className="h-4 w-4 text-warning" />,
      label: `${missingVal.length} valorisation(s) EUR manquante(s)`,
      detail: 'Les cessions sans valeur EUR ne peuvent pas être calculées. Renseignez-les à l\'étape 3.',
    });
  }

  if (missingDate.length > 0) {
    diagnostics.push({
      icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
      label: `${missingDate.length} transaction(s) sans date`,
      detail: 'Les dates sont indispensables pour le calcul chronologique.',
    });
  }

  if (cessions.length > 0 && acquisitions.length === 0) {
    diagnostics.push({
      icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
      label: 'Aucune acquisition renseignée',
      detail: 'Le prix d\'acquisition est considéré comme 0 €, ce qui maximise la plus-value. Ajoutez vos achats à l\'étape 2.',
    });
  }

  if (diagnostics.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5" />
        Diagnostic — Pourquoi ce résultat ?
      </p>
      {diagnostics.map((d, i) => (
        <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/10 border border-border/20 text-xs">
          <span className="shrink-0 mt-0.5">{d.icon}</span>
          <div>
            <p className="font-semibold">{d.label}</p>
            <p className="text-muted-foreground mt-0.5">{d.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Pedagogical cession detail ──
function CessionPedagogical({ line, index }: { line: CessionDetail; index: number }) {
  const [mode, setMode] = useState<'simple' | 'expert'>('simple');

  return (
    <Card className="border-border/20">
      <CardContent className="py-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">
            #{index + 1} — {line.date} — {line.assetName}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={line.plusValue >= 0 ? 'default' : 'destructive'} className="text-[10px]">
              {line.plusValue >= 0 ? '+' : ''}{formatEur(line.plusValue)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setMode(mode === 'simple' ? 'expert' : 'simple')}
            >
              {mode === 'simple' ? <Eye className="h-3 w-3 mr-1" /> : <BookOpen className="h-3 w-3 mr-1" />}
              {mode === 'simple' ? 'Expert' : 'Simple'}
            </Button>
          </div>
        </div>

        {mode === 'simple' ? (
          <div className="text-xs text-muted-foreground space-y-1.5 p-3 rounded-lg bg-muted/10">
            <p>
              Vous avez vendu pour <strong>{formatEur(line.prixCession)}</strong> de {line.assetName}.
            </p>
            <p>
              Au moment de cette vente, votre portefeuille global valait{' '}
              <strong>{formatEur(line.valeurGlobalePortefeuille)}</strong> et le prix total d'acquisition
              cumulé était de <strong>{formatEur(line.prixTotalAcquisitionPortefeuille)}</strong>.
            </p>
            <p>
              La part du prix d'acquisition imputable à cette cession est de{' '}
              <strong>{formatEur(line.prixAcquisitionFraction)}</strong>{' '}
              (soit {(line.fractionCedee * 100).toFixed(2)}% du portefeuille).
            </p>
            {line.frais > 0 && (
              <p>Les frais de cession s'élèvent à <strong>{formatEur(line.frais)}</strong>.</p>
            )}
            <p className="font-semibold pt-1">
              {line.plusValue >= 0
                ? `→ Cette cession génère une plus-value de ${formatEur(line.plusValue)}.`
                : `→ Cette cession génère une moins-value de ${formatEur(line.plusValue)}.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
              <span>Prix cession (P<sub>c</sub>) :</span>
              <span className="font-mono font-semibold text-right">{formatEur(line.prixCession)}</span>
              <span>Prix total acq. (PA<sub>total</sub>) :</span>
              <span className="font-mono font-semibold text-right">{formatEur(line.prixTotalAcquisitionPortefeuille)}</span>
              <span>Valeur globale portefeuille (V<sub>g</sub>) :</span>
              <span className="font-mono font-semibold text-right">{formatEur(line.valeurGlobalePortefeuille)}</span>
              <span>Fraction cédée (P<sub>c</sub> / V<sub>g</sub>) :</span>
              <span className="font-mono font-semibold text-right">{(line.fractionCedee * 100).toFixed(4)}%</span>
              <span>PA imputable (PA<sub>total</sub> × fraction) :</span>
              <span className="font-mono font-semibold text-right">{formatEur(line.prixAcquisitionFraction)}</span>
              <span>Frais de cession :</span>
              <span className="font-mono font-semibold text-right">{formatEur(line.frais)}</span>
            </div>
            <div className="p-2 rounded-lg bg-muted/20 font-mono text-[10px]">
              PV = {formatEur(line.prixCession)} − {formatEur(line.prixAcquisitionFraction)} − {formatEur(line.frais)} = <strong>{formatEur(line.plusValue)}</strong>
            </div>
            {/* Portfolio state after */}
            <div className="text-[10px] text-muted-foreground p-2 rounded-lg border border-border/10">
              <p className="font-semibold mb-1">État du portefeuille après cette cession :</p>
              <p>PA total : {formatEur(line.portfolioSnapshot.totalAcquisitionCost - line.prixAcquisitionFraction)}</p>
              <p>Valeur portefeuille : {formatEur(line.portfolioSnapshot.portfolioValue - line.prixCession)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const WizardCalculStep = ({ transactions = [], accounts = [], initialPortfolioValue, onCalcComplete }: Props) => {
  const normResult = useMemo(() => draftsToNormalized(transactions), [transactions]);
  const normalizedTxs = normResult.transactions;
  const initPV = parseFloat(initialPortfolioValue) || 0;

  const result = useMemo(() => {
    if (normalizedTxs.length === 0) return null;
    return computeChronologicalPMPA(normalizedTxs, initPV);
  }, [normalizedTxs, initPV]);

  const alerts = useMemo(() => {
    if (!result) return [];
    return generateEnhancedAlerts(normalizedTxs, result);
  }, [normalizedTxs, result]);

  const reliability = useMemo(() => {
    return computeReliabilityScore(normalizedTxs, alerts);
  }, [normalizedTxs, alerts]);

  const fieldMapping = useMemo(() => {
    if (!result) return { case3AN: 0, case3BN: 0 };
    return computeFieldMapping(result);
  }, [result]);

  const taxPFU = useMemo(() => estimateTaxPFU(fieldMapping.case3AN), [fieldMapping.case3AN]);
  const taxBareme = useMemo(() => estimateTaxBareme(fieldMapping.case3AN), [fieldMapping.case3AN]);

  const cessionCount = normalizedTxs.filter((t) => t.type === 'cession').length;
  const acquisitionCount = normalizedTxs.filter((t) => t.type === 'acquisition').length;
  const transferCount = normalizedTxs.filter((t) => t.type === 'transfer').length;
  const nonTaxableCount = normalizedTxs.filter((t) => t.type === 'non_taxable').length;

  // Notify parent of calc result
  useEffect(() => {
    if (result && onCalcComplete) {
      onCalcComplete({
        netGainEur: result.netGainEur,
        case3AN: fieldMapping.case3AN,
        case3BN: fieldMapping.case3BN,
        totalCessionsEur: result.totalCessionsEur,
        gainsEur: result.gainsEur,
        lossesEur: result.lossesEur,
        reliabilityScore: reliability.score,
      });
    }
  }, [result, fieldMapping, reliability.score]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasBlockingAlerts = alerts.some((a) => a.type === 'blocking');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 5 — Calcul PV / MV</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Calcul chronologique PMPA — chaque cession met à jour l'état du portefeuille.
        </p>
      </div>

      {/* Formule */}
      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Méthode PMPA chronologique (art. 150 VH bis CGI)</p>
            <p className="text-xs text-muted-foreground mb-2">
              Pour chaque cession taxable, la plus-value est calculée en prenant en compte la valeur 
              globale de votre portefeuille au moment de la vente :
            </p>
            <div className="font-mono text-xs bg-muted/30 p-3 rounded-lg">
              PV = Prix de cession<br />
              &nbsp;&nbsp;&nbsp;− (Prix total acq. × Prix cession / Valeur globale portefeuille)<br />
              &nbsp;&nbsp;&nbsp;− Frais de cession<br /><br />
              Après chaque cession : le prix d'acquisition et la valeur du portefeuille sont réduits.
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown of transactions */}
      <div className="p-3 rounded-xl bg-muted/10 border border-border/20">
        <p className="text-xs font-semibold mb-2">Ce que Elio a analysé</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="text-center p-2 rounded-lg bg-background">
            <p className="text-lg font-bold">{normalizedTxs.length}</p>
            <p className="text-muted-foreground">Total transactions</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-destructive/5">
            <p className="text-lg font-bold text-destructive">{cessionCount}</p>
            <p className="text-muted-foreground">Cession(s) taxable(s)</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-success/5">
            <p className="text-lg font-bold text-success">{acquisitionCount}</p>
            <p className="text-muted-foreground">Acquisition(s)</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/20">
            <p className="text-lg font-bold">{transferCount + nonTaxableCount}</p>
            <p className="text-muted-foreground">Exclue(s)</p>
          </div>
        </div>
        {normResult.excludedReasons.length > 0 && (
          <div className="mt-2 space-y-1">
            {normResult.excludedReasons.map((r, i) => (
              <p key={i} className="text-[10px] text-warning flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {r}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Reliability score */}
      <Card className={`border-${reliability.level === 'high' ? 'success' : reliability.level === 'medium' ? 'warning' : 'destructive'}/20`}>
        <CardContent className="flex items-center gap-4 py-4">
          <div className={`p-3 rounded-full ${
            reliability.level === 'high' ? 'bg-success/20 text-success' :
            reliability.level === 'medium' ? 'bg-warning/20 text-warning' :
            'bg-destructive/20 text-destructive'
          }`}>
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{reliability.score}%</p>
            <p className="text-xs text-muted-foreground">{reliability.label}</p>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.filter((a) => a.type === 'blocking').map((a) => (
            <div key={a.id} className="flex items-start gap-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-xs">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{a.message}</p>
                {a.fix && <p className="text-muted-foreground mt-0.5">{a.fix}</p>}
              </div>
            </div>
          ))}
          {alerts.filter((a) => a.type === 'warning').slice(0, 5).map((a) => (
            <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg bg-warning/5 border border-warning/10 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
              <p className="text-muted-foreground">{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Diagnostic if no results */}
      {(!result || cessionCount === 0) && (
        <ZeroDiagnostic normalizedTxs={normalizedTxs} />
      )}

      {/* Blocking alert */}
      {hasBlockingAlerts && result && (
        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm font-semibold">Le calcul est bloqué</p>
          <p className="text-xs text-muted-foreground mt-1">
            Corrigez les alertes bloquantes ci-dessus avant de valider votre déclaration.
          </p>
        </div>
      )}

      {/* Résultats */}
      {result && cessionCount > 0 && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <Card className={result.netGainEur >= 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}>
              <CardContent className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Gain net</p>
                <p className="text-lg font-bold flex items-center justify-center gap-1">
                  {result.netGainEur >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  {formatEur(result.netGainEur)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total cessions</p>
                <p className="text-lg font-bold">{formatEur(result.totalCessionsEur)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Plus-values</p>
                <p className="text-sm font-bold text-success">{formatEur(result.gainsEur)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Moins-values</p>
                <p className="text-sm font-bold text-destructive">{formatEur(result.lossesEur)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Cases fiscales */}
          <Card className="border-primary/20">
            <CardContent className="py-4 space-y-3">
              <h3 className="font-semibold text-sm">Montants à reporter</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/20 text-center">
                  <p className="text-[10px] text-muted-foreground">Case 3AN (PV nettes)</p>
                  <p className="text-lg font-bold text-success">{formatEur(fieldMapping.case3AN)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 text-center">
                  <p className="text-[10px] text-muted-foreground">Case 3BN (MV nettes)</p>
                  <p className="text-lg font-bold text-destructive">{formatEur(fieldMapping.case3BN)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simulation impôt */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <h3 className="font-semibold text-sm">Estimation de l'impôt</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-[10px] text-muted-foreground font-semibold">PFU (Flat Tax 30%)</p>
                  <p className="text-lg font-bold mt-1">{formatEur(taxPFU.totalTax)}</p>
                  <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                    <p>IR (12,8%) : {formatEur(taxPFU.irAmount)}</p>
                    <p>PS (17,2%) : {formatEur(taxPFU.socialCharges)}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
                  <p className="text-[10px] text-muted-foreground font-semibold">Barème progressif</p>
                  <p className="text-lg font-bold mt-1">{formatEur(taxBareme.totalTax)}</p>
                  <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                    <p>IR barème : {formatEur(taxBareme.irAmount)}</p>
                    <p>PS (17,2%) : {formatEur(taxBareme.socialCharges)}</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                💡 {taxPFU.totalTax <= taxBareme.totalTax
                  ? 'Le PFU est plus avantageux dans votre cas.'
                  : 'Le barème progressif semble plus avantageux — consultez votre fiscaliste.'}
              </p>
            </CardContent>
          </Card>

          {/* Journal de calcul — détail par cession (pédagogique) */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Journal de calcul — {result.cessionLines.length} cession(s) taxable(s)
            </h3>
            <p className="text-xs text-muted-foreground">
              Chaque cession est détaillée ci-dessous. Basculez entre le mode simple (explication) 
              et le mode expert (formule + variables).
            </p>
          </div>

          {result.cessionLines.map((line, idx) => (
            <CessionPedagogical key={line.transactionId} line={line} index={idx} />
          ))}

          {/* Audit trail — debug mode */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-2">
              <Bug className="h-3 w-3" />
              Mode debug fiscal — Journal d'audit ({result.auditTrail.length} entrées)
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 mt-2 max-h-96 overflow-y-auto">
                {result.auditTrail.map((entry, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-muted/10 border border-border/10 text-xs">
                    <p className="font-semibold">{entry.step}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{entry.formula}</p>
                    <details className="mt-1">
                      <summary className="text-[10px] text-muted-foreground cursor-pointer">Inputs</summary>
                      <pre className="text-[9px] mt-1 overflow-x-auto">
                        {JSON.stringify(entry.inputs, null, 2)}
                      </pre>
                    </details>
                    <p className="text-[10px] mt-1">Résultat : <span className="font-bold">{formatEur(entry.result)}</span></p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
};
