import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CryptoControls = () => {
  const navigate = useNavigate();

  // Placeholder — will come from computation + generateAlerts
  const reliabilityScore = 0;
  const blockingAlerts: { id: string; message: string; fix: string }[] = [];
  const warningAlerts: { id: string; message: string }[] = [];
  const isReady = blockingAlerts.length === 0 && reliabilityScore >= 80;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 pb-24">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/crypto/2086')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Contrôles qualité</h1>
        </div>

        {/* Reliability badge */}
        <Card className="border-primary/20">
          <CardContent className="flex items-center gap-4 py-6">
            <div
              className={`p-4 rounded-full ${
                reliabilityScore >= 95
                  ? 'bg-success/20 text-success'
                  : reliabilityScore >= 70
                  ? 'bg-warning/20 text-warning'
                  : 'bg-destructive/20 text-destructive'
              }`}
            >
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <p className="text-3xl font-bold">{reliabilityScore}%</p>
              <p className="text-sm text-muted-foreground">Score de fiabilité</p>
            </div>
            <div className="ml-auto">
              <Badge className={isReady ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>
                {isReady ? 'Prêt à reporter' : 'Corrections nécessaires'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Blocking alerts */}
        {blockingAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Alertes bloquantes ({blockingAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {blockingAlerts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{a.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.fix}</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs">
                    Corriger
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Warning alerts */}
        {warningAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                Avertissements ({warningAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {warningAlerts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-warning/5 border border-warning/20">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <p className="text-sm flex-1">{a.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {blockingAlerts.length === 0 && warningAlerts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">
                Complète d'abord la préparation pour lancer les contrôles
              </p>
              <Button variant="outline" onClick={() => navigate('/crypto/2086/wizard')}>
                Aller à la préparation
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Continue */}
        {isReady && (
          <Button className="w-full" onClick={() => navigate('/crypto/2086/report')}>
            Passer au pack de report <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </Layout>
  );
};

export default CryptoControls;
