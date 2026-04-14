import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HandCoins, AlertTriangle, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AideCard } from '@/components/aides/AideCard';
import { AidesResult, loadAidesForUser } from '@/lib/aidesService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const AidesDetector = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [result, setResult] = useState<AidesResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await loadAidesForUser(user.id);
        setResult(data);
      } catch {
        toast({ title: 'Erreur', description: 'Impossible de charger les aides.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64" />
            <div className="h-24 bg-muted rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted rounded-xl" />)}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!result) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto text-center py-12 space-y-4">
          <HandCoins className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Impossible de charger ton profil.</p>
          <Button onClick={() => navigate('/profil/fiscal')}>Compléter mon profil</Button>
        </div>
      </AppLayout>
    );
  }

  const { eligible, toVerify, notEligible, totalEligibleAnnual, profileComplete } = result;

  const renderColumn = (items: typeof eligible, emptyMsg: string) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">{emptyMsg}</p>
      ) : (
        items.map((item, i) => <AideCard key={item.aide.key} item={item} index={i} />)
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Détecteur d'aides</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Découvre les aides auxquelles tu as droit selon ta situation.
          </p>
        </motion.div>

        {/* Banner profil incomplet */}
        {!profileComplete && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Profil incomplet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complète ton profil fiscal pour que le détecteur soit plus précis.
              </p>
              <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => navigate('/profil/fiscal')}>
                Compléter mon profil
              </Button>
            </div>
          </motion.div>
        )}

        {/* Total eligible */}
        {totalEligibleAnnual > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-success/5 border border-success/20 rounded-xl p-5 text-center"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Tu pourrais récupérer jusqu'à</p>
            <p className="text-3xl md:text-4xl font-bold text-success mt-1">{formatCurrency(totalEligibleAnnual)}<span className="text-base font-normal">/an</span></p>
            <p className="text-xs text-muted-foreground mt-1">{eligible.length} aide{eligible.length > 1 ? 's' : ''} identifiée{eligible.length > 1 ? 's' : ''}</p>
          </motion.div>
        )}

        {/* Kanban / Tabs */}
        {isMobile ? (
          <Tabs defaultValue="eligible" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="eligible" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" /> Éligible ({eligible.length})
              </TabsTrigger>
              <TabsTrigger value="verify" className="text-xs gap-1">
                <HelpCircle className="h-3 w-3" /> À vérifier ({toVerify.length})
              </TabsTrigger>
              <TabsTrigger value="no" className="text-xs gap-1">
                <XCircle className="h-3 w-3" /> Non ({notEligible.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="eligible">{renderColumn(eligible, 'Aucune aide éligible détectée pour le moment.')}</TabsContent>
            <TabsContent value="verify">{renderColumn(toVerify, 'Aucune aide à vérifier.')}</TabsContent>
            <TabsContent value="no">{renderColumn(notEligible, 'Toutes les aides ont été analysées.')}</TabsContent>
          </Tabs>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {/* Eligible */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-success" />
                <h2 className="text-sm font-semibold text-foreground">Éligible ({eligible.length})</h2>
              </div>
              {renderColumn(eligible, 'Aucune aide éligible détectée.')}
            </div>
            {/* À vérifier */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-warning" />
                <h2 className="text-sm font-semibold text-foreground">À vérifier ({toVerify.length})</h2>
              </div>
              {renderColumn(toVerify, 'Aucune aide à vérifier.')}
            </div>
            {/* Non concerné */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Non concerné ({notEligible.length})</h2>
              </div>
              {renderColumn(notEligible, 'Toutes les aides sont analysées.')}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground text-center pt-4">
          Élio fournit des estimations à titre indicatif. Pour toute décision fiscale, consulte un professionnel habilité.
        </p>
      </div>
    </AppLayout>
  );
};

export default AidesDetector;
