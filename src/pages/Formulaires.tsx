import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { FileText, ChevronRight, Coins, Building2, Receipt, Clock, CheckCircle2, FolderOpen, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

interface DraftRow {
  id: string;
  tax_year: number;
  status: string | null;
  updated_at: string;
  regime: string | null;
  notes: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-muted/50 text-muted-foreground' },
  review: { label: 'En revue', color: 'bg-warning/10 text-warning' },
  ready: { label: 'Prêt', color: 'bg-success/10 text-success' },
  reported: { label: 'Reporté', color: 'bg-primary/10 text-primary' },
};

const FormulairesPage = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [draftsOpen, setDraftsOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrafts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingDrafts(false);
        return;
      }
      const { data } = await supabase
        .from('tax_form_2086_drafts')
        .select('id, tax_year, status, updated_at, regime, notes')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setDrafts(data || []);
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Formulaires</h1>
              <p className="text-muted-foreground text-sm">
                Tous les processus de déclaration guidés par Capitalum
              </p>
            </div>
          </div>
        </motion.div>

        {/* Mes brouillons */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Collapsible open={draftsOpen} onOpenChange={setDraftsOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 w-full text-left py-2 group">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Mes brouillons</span>
                <Badge variant="outline" className="text-[10px] ml-1">{drafts.length}</Badge>
                <ChevronRight className={`h-4 w-4 text-muted-foreground ml-auto transition-transform ${draftsOpen ? 'rotate-90' : ''}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {loadingDrafts ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : drafts.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">Aucun formulaire en cours.</p>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {drafts.map((draft) => {
                    const statusInfo = STATUS_LABELS[draft.status || 'draft'] || STATUS_LABELS.draft;
                    return (
                      <Card key={draft.id} className="border-border/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold">2086 — {draft.tax_year}</span>
                                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                Modifié le {new Date(draft.updated_at).toLocaleDateString('fr-FR')}
                                {draft.regime && ` · ${draft.regime.toUpperCase()}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button size="sm" variant="outline" onClick={() => navigate('/crypto/2086')}>
                                Reprendre <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                disabled={deletingId === draft.id}
                                onClick={() => handleDeleteDraft(draft.id)}
                              >
                                {deletingId === draft.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </motion.div>

        {/* Separator */}
        <div className="h-px bg-border/30" />

        {/* Formulaires disponibles */}
        <div className="space-y-3">
          {FORM_PROCESSES.map((form, i) => {
            const Icon = form.icon;
            const isAvailable = form.status === 'available';

            return (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 + 0.1 }}
              >
                <Card
                  className={`border border-border/30 transition-all ${
                    isAvailable
                      ? 'cursor-pointer hover:border-primary/30 hover:shadow-md active:scale-[0.99]'
                      : 'opacity-60'
                  }`}
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
                              <Clock className="h-3 w-3 mr-1" />
                              Bientôt
                            </Badge>
                          )}
                          {isAvailable && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-success/10 text-success border-success/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Disponible
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {form.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {form.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      {isAvailable && (
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-muted/30 border border-border/20 text-center"
        >
          <p className="text-xs text-muted-foreground">
            💡 Les formulaires sont également accessibles depuis le <strong>calendrier fiscal</strong> et les <strong>recommandations du tableau de bord</strong>.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default FormulairesPage;
