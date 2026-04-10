import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Coins, PlayCircle, CheckCircle2, AlertTriangle, ClipboardCopy,
  Download, ArrowRight, Info, Clock, Loader2, RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CURRENT_YEAR = 2025;

interface DraftInfo {
  id: string;
  status: string;
  currentStep: number;
  updatedAt: string;
  txCount: number;
  accountCount: number;
}

const CryptoDashboard = () => {
  const navigate = useNavigate();
  const [taxYear] = useState(CURRENT_YEAR);
  const [draftInfo, setDraftInfo] = useState<DraftInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDraftInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [draftRes, txRes, accRes] = await Promise.all([
        supabase
          .from('tax_form_2086_drafts')
          .select('id, status, current_step, updated_at')
          .eq('user_id', user.id)
          .eq('tax_year', taxYear)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('crypto_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('tax_year', taxYear),
        supabase
          .from('crypto_accounts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('tax_year', taxYear),
      ]);

      if (draftRes.data) {
        setDraftInfo({
          id: draftRes.data.id,
          status: (draftRes.data as any).status || 'draft',
          currentStep: (draftRes.data as any).current_step ?? 0,
          updatedAt: draftRes.data.updated_at,
          txCount: txRes.count || 0,
          accountCount: accRes.count || 0,
        });
      }

      setLoading(false);
    };

    loadDraftInfo();
  }, [taxYear]);

  const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: 'Brouillon', color: 'bg-muted text-muted-foreground' },
    review: { label: 'En revue', color: 'bg-warning/20 text-warning' },
    ready: { label: 'Prêt à reporter', color: 'bg-success/20 text-success' },
    reported: { label: 'Reporté', color: 'bg-primary/20 text-primary' },
    archived: { label: 'Archivé', color: 'bg-muted text-muted-foreground' },
  };

  const currentStatus = statusMap[draftInfo?.status || 'draft'] || statusMap.draft;
  const completionPct = draftInfo ? Math.round(((draftInfo.currentStep + 1) / 6) * 100) : 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Coins className="h-7 w-7 text-primary" />
              Déclaration Crypto 2086
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Année fiscale {taxYear} — Prépare et reporte tes plus-values crypto
            </p>
          </div>
          <Badge className={currentStatus.color}>{currentStatus.label}</Badge>
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-xl bg-info/5 border border-info/20">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Elio t'aide à <strong>préparer</strong> ta déclaration 2086 et à{' '}
              <strong>reporter</strong> les montants sur impots.gouv.fr. Ce n'est pas un service
              de dépôt fiscal officiel.
            </p>
          </div>
        </div>

        {/* Draft resume card */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : draftInfo ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">Brouillon en cours</span>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(draftInfo.updatedAt).toLocaleDateString('fr-FR')} à{' '}
                  {new Date(draftInfo.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Progression</span>
                <span className="text-xs font-bold text-primary">{completionPct}%</span>
              </div>
              <Progress value={completionPct} className="h-2" />
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{draftInfo.accountCount} compte(s)</span>
                <span>{draftInfo.txCount} transaction(s)</span>
                <span>Étape {draftInfo.currentStep + 1}/6</span>
              </div>
              <Button onClick={() => navigate('/crypto/2086/wizard')} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reprendre le brouillon
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Progression globale</span>
                <span className="text-sm font-bold text-primary">0%</span>
              </div>
              <Progress value={0} className="h-3" />
              <p className="text-xs text-muted-foreground mt-4">
                Aucune déclaration commencée pour {taxYear}.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Steps grid */}
        <div className="grid gap-4">
          {[
            {
              icon: PlayCircle,
              title: 'Préparation guidée',
              desc: 'Import, saisie, qualification et calcul étape par étape',
              path: '/crypto/2086/wizard',
              cta: draftInfo ? 'Reprendre' : 'Commencer',
            },
            {
              icon: AlertTriangle,
              title: 'Contrôles qualité',
              desc: 'Vérifie la complétude et la fiabilité de tes données',
              path: '/crypto/2086/controls',
              cta: 'Vérifier',
            },
            {
              icon: ClipboardCopy,
              title: 'Pack de report',
              desc: 'Copier/coller champ par champ pour impots.gouv',
              path: '/crypto/2086/report',
              cta: 'Reporter',
            },
            {
              icon: Download,
              title: 'Exports & Archivage',
              desc: 'PDF de synthèse, journal d\'audit et documents justificatifs',
              path: '/crypto/2086/exports',
              cta: 'Exporter',
            },
          ].map((item) => (
            <Card
              key={item.path}
              className="cursor-pointer hover:border-primary/30 transition-colors group"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="flex items-center gap-4 py-5">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0 group-hover:text-primary">
                  {item.cta}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CryptoDashboard;
