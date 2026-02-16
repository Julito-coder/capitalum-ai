import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Coins,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ClipboardCopy,
  Download,
  ArrowRight,
  Info,
} from 'lucide-react';

const CURRENT_YEAR = 2025;

const CryptoDashboard = () => {
  const navigate = useNavigate();
  const [taxYear] = useState(CURRENT_YEAR);

  // Placeholder data — will be replaced by real DB queries
  const status = 'draft' as const;
  const completionPct = 0;
  const blockingAlerts = 0;
  const totalTransactions = 0;

  const statusMap = {
    draft: { label: 'Brouillon', color: 'bg-muted text-muted-foreground' },
    in_review: { label: 'En revue', color: 'bg-warning/20 text-warning' },
    ready: { label: 'Prêt à reporter', color: 'bg-success/20 text-success' },
    reported: { label: 'Reporté', color: 'bg-primary/20 text-primary' },
    archived: { label: 'Archivé', color: 'bg-muted text-muted-foreground' },
  };

  const currentStatus = statusMap[status];

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
              Capitalum t'aide à <strong>préparer</strong> ta déclaration 2086 et à{' '}
              <strong>reporter</strong> les montants sur impots.gouv.fr. Ce n'est pas un service
              de dépôt fiscal officiel.
            </p>
          </div>
        </div>

        {/* Progress */}
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Progression globale</span>
              <span className="text-sm font-bold text-primary">{completionPct}%</span>
            </div>
            <Progress value={completionPct} className="h-3" />
            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
              <span>{totalTransactions} transactions</span>
              <span>{blockingAlerts} alertes bloquantes</span>
            </div>
          </CardContent>
        </Card>

        {/* Steps grid */}
        <div className="grid gap-4">
          {[
            {
              icon: PlayCircle,
              title: 'Préparation guidée',
              desc: 'Import, saisie, qualification et calcul étape par étape',
              path: '/crypto/2086/wizard',
              cta: 'Commencer',
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
