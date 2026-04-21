import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Building2, RefreshCw, Plug, Trash2, ArrowLeft, Loader2,
  Landmark, Sparkles, CalendarClock, Zap, Shield, CreditCard,
  Wifi, Home, FileText, MoreHorizontal, Power, TrendingDown,
  Clock
} from 'lucide-react';
import {
  getConnectionStatus,
  listAccounts,
  listRecentTransactions,
  listRecurringDeadlines,
  startWebview,
  syncBankData,
  disconnectBank,
  detectRecurringFromBank,
  toggleRecurringDeadline,
  deleteRecurringDeadline,
  type BankAccount,
  type BankTransaction,
  type PowensConnectionStatus,
  type RecurringDeadline,
} from '@/lib/bankService';

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  energie: { label: 'Énergie', icon: Zap, color: 'text-amber-600 bg-amber-50' },
  telecom: { label: 'Télécom', icon: Wifi, color: 'text-blue-600 bg-blue-50' },
  assurance: { label: 'Assurance', icon: Shield, color: 'text-emerald-600 bg-emerald-50' },
  abonnement: { label: 'Abonnement', icon: CreditCard, color: 'text-purple-600 bg-purple-50' },
  logement: { label: 'Logement', icon: Home, color: 'text-rose-600 bg-rose-50' },
  credit: { label: 'Crédit', icon: FileText, color: 'text-orange-600 bg-orange-50' },
  autre: { label: 'Autre', icon: MoreHorizontal, color: 'text-gray-600 bg-gray-50' },
};

const FREQ_LABELS: Record<string, string> = {
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  annually: 'Annuel',
};

const BanquesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'connect' | 'sync' | 'disconnect' | 'detect' | null>(null);
  const [status, setStatus] = useState<PowensConnectionStatus>({ connected: false, last_sync_at: null, connections_count: 0 });
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringDeadline[]>([]);
  const [activeTab, setActiveTab] = useState('comptes');

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [s, accs, txs, rec] = await Promise.all([
        getConnectionStatus(user.id),
        listAccounts(user.id),
        listRecentTransactions(user.id, 50),
        listRecurringDeadlines(user.id),
      ]);
      setStatus(s);
      setAccounts(accs);
      setTransactions(txs);
      setRecurring(rec);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

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
      const parts: string[] = [`${r.accounts_synced} compte(s) et ${r.transactions_synced} opération(s) synchronisé(s)`];
      if (r.recurring_detected) parts.push(`${r.recurring_detected} prélèvement(s) récurrent(s) ajouté(s)`);
      if (r.urssaf_marked) parts.push(`${r.urssaf_marked} cotisation(s) URSSAF marquée(s) payée(s)`);
      toast.success(parts.join(' · '));
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error('La synchronisation a échoué.');
    } finally {
      setBusy(null);
    }
  };

  const handleDetectRecurring = async () => {
    setBusy('detect');
    try {
      const r = await detectRecurringFromBank();
      if (r.detected === 0 && r.urssaf_marked === 0) {
        toast.info('Aucun nouveau prélèvement récurrent détecté.');
      } else {
        toast.success(
          `${r.detected} prélèvement(s) récurrent(s) ajouté(s)${r.urssaf_marked ? ` · ${r.urssaf_marked} URSSAF` : ''}.`,
        );
      }
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error('Détection impossible.');
    } finally {
      setBusy(null);
    }
  };

  const handleToggleRecurring = async (item: RecurringDeadline) => {
    try {
      await toggleRecurringDeadline(item.id, !item.is_active);
      setRecurring(prev => prev.map(r => r.id === item.id ? { ...r, is_active: !r.is_active } : r));
      toast.success(item.is_active ? 'Prélèvement désactivé' : 'Prélèvement réactivé');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const handleDeleteRecurring = async (item: RecurringDeadline) => {
    if (!confirm(`Supprimer "${item.title}" de tes prélèvements récurrents ?`)) return;
    try {
      await deleteRecurringDeadline(item.id);
      setRecurring(prev => prev.filter(r => r.id !== item.id));
      toast.success('Prélèvement supprimé');
    } catch {
      toast.error('Erreur lors de la suppression.');
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

  // Group accounts by bank
  const bankGroups = accounts.reduce<Record<string, BankAccount[]>>((acc, a) => {
    const key = a.bank_name || 'Banque inconnue';
    (acc[key] = acc[key] || []).push(a);
    return acc;
  }, {});

  // Group recurring by category
  const recurringByCategory = recurring.reduce<Record<string, RecurringDeadline[]>>((acc, r) => {
    (acc[r.category] = acc[r.category] || []).push(r);
    return acc;
  }, {});

  const totalRecurringMonthly = recurring
    .filter(r => r.is_active)
    .reduce((s, r) => {
      const amount = Number(r.amount || 0);
      if (r.frequency === 'monthly') return s + amount;
      if (r.frequency === 'quarterly') return s + amount / 3;
      if (r.frequency === 'annually') return s + amount / 12;
      return s;
    }, 0);

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
              Connecte tes banques en sécurité (DSP2) pour qu'Élio comprenne tes flux et trouve plus d'optimisations.
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
            {/* Summary bar */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Solde total · {accounts.length} compte(s) · {Object.keys(bankGroups).length} banque(s)</p>
                    <p className="text-3xl font-bold text-foreground">
                      {totalBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {status.last_sync_at && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Synchro : {new Date(status.last_sync_at).toLocaleString('fr-FR')}
                        </p>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        <RefreshCw className="h-2.5 w-2.5 mr-1" /> Auto toutes les heures
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={handleSync} disabled={busy === 'sync'}>
                      {busy === 'sync' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                      Synchroniser
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleConnect} disabled={busy === 'connect'}>
                      <Plug className="h-4 w-4 mr-1" /> Ajouter une banque
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="comptes">Comptes</TabsTrigger>
                <TabsTrigger value="prelevements">
                  Prélèvements
                  {recurring.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{recurring.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="operations">Opérations</TabsTrigger>
              </TabsList>

              {/* TAB: Comptes */}
              <TabsContent value="comptes" className="space-y-4 mt-4">
                {Object.entries(bankGroups).map(([bankName, bankAccounts]) => (
                  <Card key={bankName} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          {bankName}
                          <Badge variant="outline" className="text-[10px]">{bankAccounts.length} compte(s)</Badge>
                        </CardTitle>
                        <p className="text-sm font-semibold text-foreground">
                          {bankAccounts.reduce((s, a) => s + Number(a.balance || 0), 0)
                            .toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {bankAccounts.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate text-sm">{a.account_name || 'Compte'}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {a.iban_masked && `${a.iban_masked}`}
                              {a.account_type && ` · ${a.account_type}`}
                            </p>
                          </div>
                          <p className="font-semibold text-foreground text-sm shrink-0 ml-3">
                            {Number(a.balance).toLocaleString('fr-FR', { style: 'currency', currency: a.currency || 'EUR', maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-center gap-3 pt-2">
                  <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={busy === 'disconnect'} className="text-destructive">
                    <Power className="h-4 w-4 mr-1" /> Déconnecter toutes les banques
                  </Button>
                </div>
              </TabsContent>

              {/* TAB: Prélèvements récurrents */}
              <TabsContent value="prelevements" className="space-y-4 mt-4">
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="shadow-sm">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Prélèvements détectés</p>
                      <p className="text-2xl font-bold text-foreground">{recurring.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Coût mensuel estimé</p>
                      <p className="text-2xl font-bold text-destructive">
                        -{totalRecurringMonthly.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Button
                  onClick={handleDetectRecurring}
                  disabled={busy === 'detect'}
                  variant="outline"
                  className="w-full"
                >
                  {busy === 'detect' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Relancer la détection automatique
                </Button>

                {recurring.length === 0 ? (
                  <Card className="shadow-sm">
                    <CardContent className="p-8 text-center">
                      <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-semibold text-foreground">Aucun prélèvement détecté</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Lance une synchronisation bancaire puis clique sur "Détecter" pour analyser tes transactions.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  Object.entries(recurringByCategory).map(([cat, items]) => {
                    const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.autre;
                    const Icon = config.icon;
                    const catTotal = items
                      .filter(r => r.is_active)
                      .reduce((s, r) => s + Number(r.amount || 0), 0);

                    return (
                      <Card key={cat} className="shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${config.color}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              {config.label}
                              <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
                            </CardTitle>
                            <p className="text-sm font-semibold text-foreground">
                              {catTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}/occurrence
                            </p>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-1">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-3 rounded-lg border border-border transition-opacity ${
                                !item.is_active ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[10px]">
                                    {FREQ_LABELS[item.frequency] || item.frequency}
                                  </Badge>
                                  {item.provider && (
                                    <span className="text-[10px] text-muted-foreground truncate">{item.provider}</span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">
                                    Prochain : {new Date(item.next_date).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 ml-3">
                                <p className="text-sm font-semibold text-foreground">
                                  {Number(item.amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </p>
                                <Switch
                                  checked={item.is_active}
                                  onCheckedChange={() => handleToggleRecurring(item)}
                                />
                                <button
                                  onClick={() => handleDeleteRecurring(item)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              {/* TAB: Opérations */}
              <TabsContent value="operations" className="space-y-4 mt-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Opérations récentes ({transactions.length})</CardTitle>
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
              </TabsContent>
            </Tabs>
          </>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Élio utilise Powens, prestataire agréé ACPR pour l'agrégation bancaire DSP2. Tes identifiants ne sont jamais stockés par Élio. Synchronisation automatique toutes les heures.
        </p>
      </div>
    </AppLayout>
  );
};

export default BanquesPage;
