import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Building2, RefreshCw, Plug, Trash2, ArrowLeft, Loader2, Landmark, Sparkles } from 'lucide-react';
import {
  getConnectionStatus,
  listAccounts,
  listRecentTransactions,
  startWebview,
  syncBankData,
  disconnectBank,
  detectRecurringFromBank,
  type BankAccount,
  type BankTransaction,
  type PowensConnectionStatus,
} from '@/lib/bankService';

const BanquesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'connect' | 'sync' | 'disconnect' | null>(null);
  const [status, setStatus] = useState<PowensConnectionStatus>({ connected: false, last_sync_at: null });
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [s, accs, txs] = await Promise.all([
        getConnectionStatus(user.id),
        listAccounts(user.id),
        listRecentTransactions(user.id, 30),
      ]);
      setStatus(s);
      setAccounts(accs);
      setTransactions(txs);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Si l'utilisateur revient depuis la webview Powens (?connection_id=...), on lance une sync
  useEffect(() => {
    if (searchParams.get('connection_id') && user) {
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  const handleConnect = async () => {
    setBusy('connect');
    try {
      const redirectUri = `${window.location.origin}/outils/banques`;
      const { webview_url } = await startWebview(redirectUri);
      window.location.href = webview_url;
    } catch (e) {
      console.error(e);
      toast.error('Connexion impossible. Réessaie dans un instant.');
      setBusy(null);
    }
  };

  const handleSync = async () => {
    setBusy('sync');
    try {
      const r = await syncBankData();
      toast.success(`${r.accounts_synced} compte(s) et ${r.transactions_synced} opération(s) synchronisé(s).`);
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error('La synchronisation a échoué.');
    } finally {
      setBusy(null);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Déconnecter ta banque ? Tes comptes et opérations stockés seront supprimés.')) return;
    setBusy('disconnect');
    try {
      await disconnectBank();
      toast.success('Banque déconnectée.');
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error('Impossible de déconnecter.');
    } finally {
      setBusy(null);
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/outils')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Outils
        </button>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Landmark className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mes comptes bancaires</h1>
            <p className="text-sm text-muted-foreground">
              Connecte ta banque en sécurité (DSP2) pour qu'Élio comprenne tes flux et trouve plus d'optimisations.
            </p>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !status.connected ? (
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-semibold text-foreground">Aucune banque connectée</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  La connexion est sécurisée et conforme DSP2. Tu peux te déconnecter à tout moment.
                </p>
              </div>
              <Button onClick={handleConnect} disabled={busy === 'connect'} className="w-full sm:w-auto">
                {busy === 'connect' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plug className="h-4 w-4 mr-2" />}
                Connecter ma banque
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="shadow-sm">
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Solde total</p>
                  <p className="text-3xl font-bold text-foreground">
                    {totalBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  </p>
                  {status.last_sync_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Dernière synchro : {new Date(status.last_sync_at).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={handleSync} disabled={busy === 'sync'}>
                    {busy === 'sync' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Synchroniser
                  </Button>
                  <Button variant="outline" onClick={handleConnect} disabled={busy === 'connect'}>
                    <Plug className="h-4 w-4 mr-2" /> Ajouter une banque
                  </Button>
                  <Button variant="ghost" onClick={handleDisconnect} disabled={busy === 'disconnect'} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Déconnecter
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Comptes ({accounts.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Aucun compte. Lance une synchro.</p>
                ) : (
                  accounts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{a.account_name || a.bank_name || 'Compte'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {a.bank_name} {a.iban_masked && `· ${a.iban_masked}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-semibold text-foreground">
                          {Number(a.balance).toLocaleString('fr-FR', { style: 'currency', currency: a.currency || 'EUR', maximumFractionDigits: 0 })}
                        </p>
                        {a.account_type && <Badge variant="outline" className="text-[10px] mt-1">{a.account_type}</Badge>}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Opérations récentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Aucune opération sur 90 jours.</p>
                ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{t.label || 'Opération'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.tx_date).toLocaleDateString('fr-FR')} {t.category && `· ${t.category}`}
                        </p>
                      </div>
                      <p className={`text-sm font-semibold shrink-0 ml-3 ${Number(t.amount) < 0 ? 'text-destructive' : 'text-success'}`}>
                        {Number(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: t.currency || 'EUR' })}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Élio utilise Powens, prestataire agréé ACPR pour l'agrégation bancaire DSP2. Tes identifiants ne sont jamais stockés par Élio.
        </p>
      </div>
    </AppLayout>
  );
};

export default BanquesPage;
