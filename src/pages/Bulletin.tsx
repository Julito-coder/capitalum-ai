import { AppLayout } from '@/components/layout/AppLayout';
import { BulletinHeader } from '@/components/bulletin/BulletinHeader';
import { GainCumule } from '@/components/bulletin/GainCumule';
import { ActionDuJour } from '@/components/bulletin/ActionDuJour';
import { ProchaineEcheance } from '@/components/bulletin/ProchaineEcheance';
import { NewsPersonnalisee } from '@/components/bulletin/NewsPersonnalisee';
import { BulletinFooter } from '@/components/bulletin/BulletinFooter';
import { BulletinSkeleton } from '@/components/bulletin/BulletinSkeleton';
import { BulletinEmptyState } from '@/components/bulletin/BulletinEmptyState';
import { useDailyBulletin } from '@/hooks/useDailyBulletin';
import { History } from 'lucide-react';
import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { getBulletinHistory, DailyBulletinRow } from '@/lib/bulletinService';
import { useAuth } from '@/contexts/AuthContext';

const Bulletin = () => {
  const { data, loading, newsLoading, handleActionStatus } = useDailyBulletin();
  const { user } = useAuth();
  const [history, setHistory] = useState<DailyBulletinRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const h = await getBulletinHistory(user.id);
      setHistory(h);
    } catch {
      // silencieux
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <BulletinSkeleton />
      </AppLayout>
    );
  }

  const showEmptyState = !data || data.profileCompletionPct < 30;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24 lg:pb-8">
        {/* Header avec bouton historique */}
        <div className="relative">
          <BulletinHeader
            userName={data?.userName || ''}
            currentStreak={data?.streak.current_streak || 0}
          />
          <Drawer onOpenChange={(open) => open && loadHistory()}>
            <DrawerTrigger asChild>
              <button className="absolute top-8 right-5 lg:top-12 lg:right-8 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <History className="h-5 w-5 text-muted-foreground" />
              </button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Bulletins précédents</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 max-h-96 overflow-y-auto space-y-3">
                {historyLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun bulletin précédent</p>
                ) : (
                  history.map((b) => (
                    <div key={b.id} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(b.bulletin_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                          <p className="text-sm font-medium text-foreground mt-0.5">{b.action_title}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          b.action_status === 'done' ? 'bg-success/10 text-success' :
                          b.action_status === 'skipped' ? 'bg-muted text-muted-foreground' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {b.action_status === 'done' ? 'Fait' : b.action_status === 'skipped' ? 'Passé' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Gain cumulé */}
        <GainCumule
          totalCents={data?.cumulativeGainCents || 0}
          weeklyDeltaCents={data?.weeklyDeltaCents || 0}
        />

        {/* Action du jour ou empty state */}
        {showEmptyState ? (
          <BulletinEmptyState />
        ) : data && (
          <ActionDuJour
            action={data.action}
            status={data.bulletin.action_status}
            onStatusChange={handleActionStatus}
          />
        )}

        {/* Prochaine échéance */}
        {data?.deadline && (
          <ProchaineEcheance deadline={data.deadline} />
        )}

        {/* News personnalisée — skeleton si en cours de génération */}
        {(data?.bulletin || newsLoading) && (
          <NewsPersonnalisee
            context={data?.bulletin?.news_context ?? null}
            title={data?.bulletin?.news_title ?? null}
            body={data?.bulletin?.news_body ?? null}
            loading={newsLoading && !data?.bulletin?.news_title}
          />
        )}

        {/* Footer raccourcis */}
        <BulletinFooter />
      </div>
    </AppLayout>
  );
};

export default Bulletin;
