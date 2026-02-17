import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, FolderArchive, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  exportCrypto2086Pdf,
  exportCryptoAuditPdf,
  type CryptoAccount,
  type CryptoTxLine,
  type CryptoTotals,
  type CryptoAuditEntry,
} from '@/lib/cryptoPdfExport';

const CryptoExports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<'synthese' | 'audit' | null>(null);

  const fetchDataAndExport = async (type: 'synthese' | 'audit') => {
    setLoading(type);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Erreur', description: 'Vous devez être connecté.', variant: 'destructive' });
        return;
      }

      // Fetch accounts
      const { data: accountsRaw } = await supabase
        .from('crypto_accounts')
        .select('*')
        .eq('user_id', user.id);

      const accounts: CryptoAccount[] = (accountsRaw || []).map((a) => ({
        name: a.name,
        accountType: a.account_type,
        country: a.country || 'FR',
        isForeignAccount: a.is_foreign_account || false,
      }));

      // Fetch computation
      const { data: compRaw } = await supabase
        .from('crypto_tax_computations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      const comp = compRaw?.[0];

      const computedLines = (comp?.computed_lines as any[] | null) || [];
      const auditTrail = (comp?.audit_trail as any[] | null) || [];

      const lines: CryptoTxLine[] = computedLines.map((l: any) => ({
        date: l.date || '',
        assetFrom: l.assetName || l.asset_from || '',
        prixCession: l.prixCession || l.prix_cession || 0,
        fractionCedee: l.fractionCedee || l.fraction_cedee || 0,
        plusValue: l.plusValue || l.plus_value || 0,
        frais: l.frais || l.fees || 0,
      }));

      const totals: CryptoTotals = {
        totalCessionsEur: comp?.total_cessions_eur || 0,
        totalAcquisitionsEur: comp?.total_acquisitions_eur || 0,
        portfolioValueEur: comp?.portfolio_value_eur || 0,
        gainsEur: comp?.gains_eur || 0,
        lossesEur: comp?.losses_eur || 0,
        netGainEur: comp?.net_gain_eur || 0,
        case3AN: Math.max(comp?.net_gain_eur || 0, 0),
        case3BN: Math.abs(Math.min(comp?.net_gain_eur || 0, 0)),
        regime: 'PFU (30%)',
      };

      const taxYear = comp?.tax_year || 2025;

      if (type === 'synthese') {
        exportCrypto2086Pdf(accounts, lines, totals, taxYear);
        toast({ title: '📄 PDF généré', description: 'Le dossier 2086 synthèse a été téléchargé.' });
      } else {
        const auditEntries: CryptoAuditEntry[] = auditTrail.map((e: any) => ({
          step: e.step || '',
          formula: e.formula || '',
          result: e.result || 0,
        }));
        exportCryptoAuditPdf(auditEntries, lines, totals, taxYear);
        toast({ title: '📋 PDF généré', description: "Le journal d'audit a été téléchargé." });
      }
    } catch (err) {
      console.error('Export PDF error:', err);
      toast({ title: 'Erreur', description: "Impossible de générer le PDF.", variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 pb-24">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/crypto/2086')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Exports & Archivage</h1>
        </div>

        <div className="grid gap-4">
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Dossier 2086 — Synthèse</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Résumé complet : comptes, cessions, montants à reporter, hypothèses
                </p>
              </div>
              <Button size="sm" onClick={() => fetchDataAndExport('synthese')} disabled={loading !== null}>
                {loading === 'synthese' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                PDF
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="p-3 rounded-xl bg-accent/10 text-accent">
                <FolderArchive className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Journal de calcul (Audit)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Formules, inputs, étapes détaillées du calcul PV/MV
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => fetchDataAndExport('audit')} disabled={loading !== null}>
                {loading === 'audit' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="py-6 text-center space-y-3">
            <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Les documents exportés seront archivés automatiquement dans
              <br />
              <span className="font-mono text-xs">Capitalum Drive / 2025 / Fiscalité / Crypto / 2086</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CryptoExports;
