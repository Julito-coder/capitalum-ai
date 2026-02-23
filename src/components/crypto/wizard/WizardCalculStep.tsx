import { useMemo } from 'react';
import {
  Info, Calculator, TrendingUp, TrendingDown, AlertTriangle,
  ShieldCheck, Bug, ChevronDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from '@/domain/crypto/portfolioEngine';
import type { TxDraft, AccountDraft } from '@/pages/crypto/CryptoWizard';

const FIAT = new Set(['EUR', 'USD', 'GBP', 'CHF']);

const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

function draftsToNormalized(drafts: TxDraft[]): NormalizedTransaction[] {
  return drafts
    .filter((d) => d.date && d.assetFrom)
    .map((d) => {
      const type = classifyTransaction({
        assetFrom: d.assetFrom,
        assetTo: d.assetTo,
        classification: d.classification,
      });
      return {
        id: d.id,
        date: d.date,
        type,
        assetFrom: d.assetFrom,
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
}

interface Props {
  transactions: TxDraft[];
  accounts: AccountDraft[];
  initialPortfolioValue: string;
}

export const WizardCalculStep = ({ transactions = [], accounts = [], initialPortfolioValue }: Props) => {
  const normalizedTxs = useMemo(() => draftsToNormalized(transactions), [transactions]);

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
            <div className="font-mono text-xs bg-muted/30 p-3 rounded-lg mt-2">
              Pour chaque cession :<br />
              PV = Prix de cession<br />
              &nbsp;&nbsp;&nbsp;− (Prix total acq. × Prix cession / Valeur globale portefeuille)<br />
              &nbsp;&nbsp;&nbsp;− Frais de cession<br /><br />
              Puis : totalAcq -= fraction × totalAcq ; portfolioValue -= prixCession
            </div>
          </div>
        </div>
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
          <div className="text-right text-xs text-muted-foreground">
            <p>{cessionCount} cession{cessionCount > 1 ? 's' : ''}</p>
            <p>{acquisitionCount} acquisition{acquisitionCount > 1 ? 's' : ''}</p>
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

      {/* Résultats */}
      {!result || cessionCount === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Calculator className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Ajoutez des cessions taxables avec une valorisation EUR aux étapes précédentes.
          </p>
        </div>
      ) : (
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

          {/* Détail par cession */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-2">
              <ChevronDown className="h-3 w-3" />
              Détail par cession ({result.cessionLines.length})
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 mt-2">
                {result.cessionLines.map((line, idx) => (
                  <Card key={line.transactionId} className="border-border/20">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">#{idx + 1} — {line.date} — {line.assetName}</span>
                        <Badge variant={line.plusValue >= 0 ? 'default' : 'destructive'} className="text-[10px]">
                          {line.plusValue >= 0 ? '+' : ''}{formatEur(line.plusValue)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-muted-foreground">
                        <span>Prix cession : {formatEur(line.prixCession)}</span>
                        <span>Frais : {formatEur(line.frais)}</span>
                        <span>Fraction cédée : {(line.fractionCedee * 100).toFixed(4)}%</span>
                        <span>Acq. fraction : {formatEur(line.prixAcquisitionFraction)}</span>
                        <span>Total acq. : {formatEur(line.prixTotalAcquisitionPortefeuille)}</span>
                        <span>Valeur portefeuille : {formatEur(line.valeurGlobalePortefeuille)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Audit trail */}
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
