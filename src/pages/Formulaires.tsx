import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import {
  FileText, ChevronRight, Coins, Building2, Receipt, Clock,
  CheckCircle2, FolderOpen, Trash2, ArrowRight, Loader2,
  Download, TrendingUp, TrendingDown, Wallet, BarChart3, Archive,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  exportCrypto2086Pdf,
  type CryptoAccount,
  type CryptoTxLine,
  type CryptoTotals,
} from '@/lib/cryptoPdfExport';

// ── Types ──

interface FormProcess {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  category: string;
  status: 'available' | 'coming_soon';
  tags: string[];
}

interface EnrichedDraft {
  id: string;
  tax_year: number;
  status: string | null;
  updated_at: string;
  regime: string | null;
  notes: string | null;
  current_step: number | null;
  form_data: Record<string, any> | null;
  txCount: number;
  accCount: number;
}

// ── Constants ──

const TOTAL_STEPS = 6;

const FORM_PROCESSES: FormProcess[] = [
  {
    id: 'crypto-2086',
    title: 'Formulaire 2086 — Plus-values crypto',
    description: 'Préparation complète de la déclaration des cessions de crypto-actifs. Calcul PMPA, pack de report et exports.',
    icon: Coins,
    route: '/crypto/2086',
    category: 'Crypto',
    status: 'available',
    tags: ['crypto', 'obligatoire', 'annuel'],
  },
  {
    id: 'ir-2042',
    title: 'Déclaration de revenus (2042)',
    description: 'Assistance à la déclaration de revenus : revenus, déductions, crédits d\'impôt.',
    icon: Receipt,
    route: '#',
    category: 'Fiscalité',
    status: 'coming_soon',
    tags: ['IR', 'obligatoire', 'annuel'],
  },
  {
    id: 'sci-2072',
    title: 'Déclaration SCI (2072)',
    description: 'Déclaration des revenus fonciers pour les sociétés civiles immobilières.',
    icon: Building2,
    route: '#',
    category: 'Immobilier',
    status: 'coming_soon',
    tags: ['SCI', 'immobilier', 'annuel'],
  },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Brouillon', color: 'bg-muted/60 text-muted-foreground', icon: FileText },
  review: { label: 'En revue', color: 'bg-warning/10 text-warning', icon: BarChart3 },
  ready: { label: 'Prêt', color: 'bg-success/10 text-success', icon: CheckCircle2 },
  reported: { label: 'Reporté', color: 'bg-primary/10 text-primary', icon: CheckCircle2 },
  archived: { label: 'Archivé', color: 'bg-muted/40 text-muted-foreground', icon: Archive },
};

// ── Helpers ──

function getStepLabel(step: number): string {
  const labels = ['Qualification', 'Sources', 'Transactions', 'Valorisation', 'Calcul', 'Préparation'];
  return labels[step] || `Étape ${step + 1}`;
}

function formatEur(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

// ── Component ──

const FormulairesPage = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<EnrichedDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [inProgressOpen, setInProgressOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrafts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingDrafts(false); return; }

      // Parallel fetches
      const [draftsRes, txRes, accRes] = await Promise.all([
        supabase
          .from('tax_form_2086_drafts')
          .select('id, tax_year, status, updated_at, regime, notes, current_step, form_data')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('crypto_transactions')
          .select('tax_year')
          .eq('user_id', user.id),
        supabase
          .from('crypto_accounts')
          .select('tax_year')
          .eq('user_id', user.id),
      ]);

      // Count per tax_year
      const txCounts: Record<number, number> = {};
      (txRes.data || []).forEach((t: any) => { txCounts[t.tax_year] = (txCounts[t.tax_year] || 0) + 1; });
      const accCounts: Record<number, number> = {};
      (accRes.data || []).forEach((a: any) => { accCounts[a.tax_year] = (accCounts[a.tax_year] || 0) + 1; });

      const enriched: EnrichedDraft[] = (draftsRes.data || []).map((d: any) => ({
        ...d,
        form_data: d.form_data && typeof d.form_data === 'object' ? d.form_data : null,
        txCount: txCounts[d.tax_year] || 0,
        accCount: accCounts[d.tax_year] || 0,
      }));

      setDrafts(enriched);
      setLoadingDrafts(false);
    };
    fetchDrafts();
  }, []);

  const handleDeleteDraft = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('tax_form_2086_drafts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer le brouillon.', variant: 'destructive' });
    } else {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      toast({ title: 'Supprimé', description: 'Le brouillon a été supprimé.' });
    }
    setDeletingId(null);
  };

  const handleExportPdf = async (draft: EnrichedDraft) => {
    setExportingId(draft.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [accountsRes, compRes] = await Promise.all([
        supabase.from('crypto_accounts').select('*').eq('user_id', user.id).eq('tax_year', draft.tax_year),
        supabase.from('crypto_tax_computations').select('*').eq('user_id', user.id).eq('tax_year', draft.tax_year).order('updated_at', { ascending: false }).limit(1),
      ]);

      const accounts: CryptoAccount[] = (accountsRes.data || []).map((a) => ({
        name: a.name, accountType: a.account_type, country: a.country || 'FR', isForeignAccount: a.is_foreign_account || false,
      }));

      const comp = compRes.data?.[0];
      const computedLines = (comp?.computed_lines as any[] | null) || [];
      const lines: CryptoTxLine[] = computedLines.map((l: any) => ({
        date: l.date || '', assetFrom: l.assetName || l.asset_from || '',
        prixCession: l.prixCession || l.prix_cession || 0,
        prixTotalAcquisitionPortefeuille: l.prixTotalAcquisitionPortefeuille || 0,
        valeurGlobalePortefeuille: l.valeurGlobalePortefeuille || 0,
        fractionCedee: l.fractionCedee || 0,
        prixAcquisitionFraction: l.prixAcquisitionFraction || 0,
        plusValue: l.plusValue || l.plus_value || 0,
        frais: l.frais || l.fees || 0,
      }));

      const totals: CryptoTotals = {
        totalCessionsEur: comp?.total_cessions_eur || 0,
        totalAcquisitionsEur: comp?.total_acquisitions_eur || 0,
        portfolioValueEur: comp?.portfolio_value_eur || 0,
        gainsEur: comp?.gains_eur || 0, lossesEur: comp?.losses_eur || 0,
        netGainEur: comp?.net_gain_eur || 0,
        case3AN: Math.max(comp?.net_gain_eur || 0, 0),
        case3BN: Math.abs(Math.min(comp?.net_gain_eur || 0, 0)),
        regime: 'PFU (30%)',
      };

      exportCrypto2086Pdf(accounts, lines, totals, draft.tax_year);
      toast({ title: '📄 PDF généré', description: `Dossier 2086 ${draft.tax_year} téléchargé.` });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de générer le PDF.', variant: 'destructive' });
    } finally {
      setExportingId(null);
    }
  };

  // Separate drafts
  const inProgressDrafts = drafts.filter((d) => ['draft', 'review'].includes(d.status || 'draft'));
  const completedDrafts = drafts.filter((d) => ['ready', 'reported', 'archived'].includes(d.status || ''));

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Formulaires</h1>
              <p className="text-muted-foreground text-sm">
                Hub central de toutes vos déclarations fiscales
              </p>
            </div>
          </div>
        </motion.div>

        {/* En cours */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <DraftSection
            title="En cours"
            icon={<FolderOpen className="h-4 w-4 text-warning" />}
            count={inProgressDrafts.length}
            open={inProgressOpen}
            onOpenChange={setInProgressOpen}
            loading={loadingDrafts}
            emptyMessage="Aucun formulaire en cours."
            drafts={inProgressDrafts}
            deletingId={deletingId}
            exportingId={exportingId}
            onDelete={handleDeleteDraft}
            onExport={handleExportPdf}
            onResume={(d) => navigate('/crypto/2086')}
            isCompleted={false}
          />
        </motion.div>

        {/* Finalisés */}
        {completedDrafts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DraftSection
              title="Finalisés"
              icon={<CheckCircle2 className="h-4 w-4 text-success" />}
              count={completedDrafts.length}
              open={completedOpen}
              onOpenChange={setCompletedOpen}
              loading={false}
              emptyMessage=""
              drafts={completedDrafts}
              deletingId={deletingId}
              exportingId={exportingId}
              onDelete={handleDeleteDraft}
              onExport={handleExportPdf}
              onResume={(d) => navigate('/crypto/2086')}
              isCompleted
            />
          </motion.div>
        )}

        {/* Separator */}
        <div className="h-px bg-border/30" />

        {/* Available forms */}
        <div className="space-y-3">
          {FORM_PROCESSES.map((form, i) => {
            const Icon = form.icon;
            const isAvailable = form.status === 'available';
            return (
              <motion.div key={form.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 + 0.15 }}>
                <Card
                  className={`border border-border/30 transition-all ${isAvailable ? 'cursor-pointer hover:border-primary/30 hover:shadow-md active:scale-[0.99]' : 'opacity-60'}`}
                  onClick={() => isAvailable && navigate(form.route)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl shrink-0 ${isAvailable ? 'bg-primary/10' : 'bg-muted/50'}`}>
                        <Icon className={`h-6 w-6 ${isAvailable ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm sm:text-base">{form.title}</h3>
                          {!isAvailable && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-muted/50 text-muted-foreground border-border/30">
                              <Clock className="h-3 w-3 mr-1" />Bientôt
                            </Badge>
                          )}
                          {isAvailable && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-success/10 text-success border-success/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />Disponible
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{form.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {form.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">{tag}</span>
                          ))}
                        </div>
                      </div>
                      {isAvailable && <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="p-4 rounded-xl bg-muted/30 border border-border/20 text-center">
          <p className="text-xs text-muted-foreground">
            💡 Les formulaires sont également accessibles depuis le <strong>calendrier fiscal</strong> et les <strong>recommandations du tableau de bord</strong>.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};

// ── Draft Section ──

interface DraftSectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading: boolean;
  emptyMessage: string;
  drafts: EnrichedDraft[];
  deletingId: string | null;
  exportingId: string | null;
  onDelete: (id: string) => void;
  onExport: (d: EnrichedDraft) => void;
  onResume: (d: EnrichedDraft) => void;
  isCompleted: boolean;
}

function DraftSection({ title, icon, count, open, onOpenChange, loading, emptyMessage, drafts, deletingId, exportingId, onDelete, onExport, onResume, isCompleted }: DraftSectionProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2 w-full text-left py-2 group">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
          <Badge variant="outline" className="text-[10px] ml-1">{count}</Badge>
          <ChevronRight className={`h-4 w-4 text-muted-foreground ml-auto transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                isCompleted={isCompleted}
                isDeleting={deletingId === draft.id}
                isExporting={exportingId === draft.id}
                onDelete={() => onDelete(draft.id)}
                onExport={() => onExport(draft)}
                onResume={() => onResume(draft)}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Draft Card ──

interface DraftCardProps {
  draft: EnrichedDraft;
  isCompleted: boolean;
  isDeleting: boolean;
  isExporting: boolean;
  onDelete: () => void;
  onExport: () => void;
  onResume: () => void;
}

function DraftCard({ draft, isCompleted, isDeleting, isExporting, onDelete, onExport, onResume }: DraftCardProps) {
  const statusInfo = STATUS_CONFIG[draft.status || 'draft'] || STATUS_CONFIG.draft;
  const step = draft.current_step ?? 0;
  const progressPct = Math.round(((step + 1) / TOTAL_STEPS) * 100);
  const calcSnapshot = draft.form_data?.calcSnapshot as Record<string, any> | undefined;
  const case3AN = calcSnapshot?.case3AN ?? null;
  const case3BN = calcSnapshot?.case3BN ?? null;
  const hasResults = case3AN !== null || case3BN !== null;

  return (
    <Card className="border-border/30 hover:border-primary/20 transition-all">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">2086 — Crypto {draft.tax_year}</span>
              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Modifié le {new Date(draft.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {draft.regime && ` · ${draft.regime.toUpperCase()}`}
            </p>
          </div>
        </div>

        {/* Progress bar (in-progress only) */}
        {!isCompleted && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Étape {step + 1}/{TOTAL_STEPS} — {getStepLabel(step)}</span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>
        )}

        {/* Counters + fiscal results */}
        <div className="flex flex-wrap gap-3 text-[11px]">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Wallet className="h-3 w-3" />
            <span>{draft.accCount} compte{draft.accCount > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <BarChart3 className="h-3 w-3" />
            <span>{draft.txCount} transaction{draft.txCount > 1 ? 's' : ''}</span>
          </div>
          {hasResults && case3AN != null && case3AN > 0 && (
            <div className="flex items-center gap-1 text-success">
              <TrendingUp className="h-3 w-3" />
              <span>3AN : {formatEur(case3AN)}</span>
            </div>
          )}
          {hasResults && case3BN != null && case3BN > 0 && (
            <div className="flex items-center gap-1 text-destructive">
              <TrendingDown className="h-3 w-3" />
              <span>3BN : {formatEur(case3BN)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {isCompleted ? (
            <>
              <Button size="sm" variant="outline" onClick={onResume}>
                Voir le résumé <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
              <Button size="sm" onClick={onExport} disabled={isExporting}>
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Download className="h-3.5 w-3.5 mr-1" />}
                Exporter PDF
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={onResume}>
              Reprendre — {getStepLabel(step)} <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive ml-auto"
            disabled={isDeleting}
            onClick={onDelete}
          >
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default FormulairesPage;
