import { Receipt, HandCoins, CalendarClock, Sparkles, Compass, Coins, Clock, CalendarDays, ArrowRight, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { BulletinAction } from '@/lib/bulletinEngine';

interface ActionDuJourProps {
  action: BulletinAction;
  status: string;
  onStatusChange: (status: 'done' | 'snoozed' | 'skipped', reason?: string) => void;
}

const typeConfig: Record<string, { label: string; icon: typeof Receipt }> = {
  fiscal: { label: 'FISCAL', icon: Receipt },
  aide: { label: 'AIDE À RÉCLAMER', icon: HandCoins },
  echeance: { label: 'ÉCHÉANCE', icon: CalendarClock },
  optimisation: { label: 'OPTIMISATION', icon: Sparkles },
  decouverte: { label: 'DÉCOUVERTE', icon: Compass },
};

function formatEuros(cents: number): string {
  return Math.round(cents / 100).toLocaleString('fr-FR') + ' €';
}

const SNOOZE_REASONS = [
  'Je n\'ai pas le temps aujourd\'hui',
  'J\'ai besoin d\'un document que je n\'ai pas',
  'Je préfère m\'en occuper ce week-end',
];

const SKIP_REASONS = [
  'Je l\'ai déjà fait',
  'Ça ne me concerne pas',
  'Je ne comprends pas cette action',
];

export const ActionDuJour = ({ action, status, onStatusChange }: ActionDuJourProps) => {
  const navigate = useNavigate();
  const config = typeConfig[action.type] || typeConfig.decouverte;
  const TagIcon = config.icon;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'snoozed' | 'skipped'>('snoozed');
  const [customReason, setCustomReason] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const openReasonDrawer = (mode: 'snoozed' | 'skipped') => {
    setDrawerMode(mode);
    setSelectedPreset(null);
    setCustomReason('');
    setDrawerOpen(true);
  };

  const confirmAction = () => {
    const reason = selectedPreset || customReason.trim() || undefined;
    onStatusChange(drawerMode, reason);
    setDrawerOpen(false);
  };

  const presets = drawerMode === 'snoozed' ? SNOOZE_REASONS : SKIP_REASONS;
  const drawerTitle = drawerMode === 'snoozed' ? 'Reporter à demain' : 'Passer cette action';
  const drawerDesc = drawerMode === 'snoozed'
    ? 'Dis-nous pourquoi, ça nous aide à mieux te proposer des actions.'
    : 'Ça nous aide à ne plus te proposer ce type d\'action.';

  return (
    <>
      <AnimatePresence mode="wait">
        {status === 'done' ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="mx-5 lg:mx-8 mt-4 bg-success/10 border border-success/30 rounded-2xl p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            >
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            </motion.div>
            <p className="text-success font-semibold text-lg mt-3">
              Bien joué.{action.gainCents ? ` Tu as gagné ${formatEuros(action.gainCents)}.` : ''}
            </p>
            <Button
              variant="ghost"
              className="mt-4 text-success"
              onClick={() => navigate('/tableau-de-bord')}
            >
              Voir ta progression →
            </Button>
          </motion.div>
        ) : status === 'snoozed' ? (
          <motion.div
            key="snoozed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-5 lg:mx-8 mt-4 bg-muted/30 border border-border rounded-2xl p-6 text-center"
          >
            <Clock className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground font-medium mt-3">
              Reporté à demain. On s'en occupe ensemble.
            </p>
          </motion.div>
        ) : status === 'skipped' ? (
          <motion.div
            key="skipped"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-5 lg:mx-8 mt-4 bg-muted/30 border border-border rounded-2xl p-6 text-center"
          >
            <X className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground font-medium mt-3">
              Noté. On ne te la reproposera pas.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            className="mx-5 lg:mx-8 mt-4 bg-gradient-to-br from-primary to-primary/90 rounded-2xl shadow-sm p-6 lg:p-8"
          >
            {/* Tag catégoriel */}
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur text-white px-3 py-1 rounded-full text-xs uppercase tracking-wider"
            >
              <TagIcon className="h-3.5 w-3.5" />
              {config.label}
            </motion.span>

            {/* Label rituel */}
            <p className="text-secondary text-sm font-medium mt-4">L'action du jour</p>

            {/* Titre */}
            <h2 className="text-2xl lg:text-3xl font-bold text-primary-foreground mt-2">
              {action.title}
            </h2>

            {/* Description */}
            <p className="text-base text-white/80 mt-3 leading-relaxed">
              {action.description}
            </p>

            {/* Métriques */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4 mt-5"
            >
              {action.gainCents && action.gainCents > 0 && (
                <span className="inline-flex items-center gap-1.5 text-white/90 text-sm">
                  <Coins className="h-4 w-4" />
                  {formatEuros(action.gainCents)} {action.type === 'aide' ? 'récupérés' : 'd\'économisés'}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-white/90 text-sm">
                <Clock className="h-4 w-4" />
                {action.effortMinutes} min
              </span>
              {action.deadline && (
                <span className="inline-flex items-center gap-1.5 text-white/90 text-sm">
                  <CalendarDays className="h-4 w-4" />
                  Avant le {new Date(action.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </span>
              )}
            </motion.div>

            {/* CTA principal */}
            <Button
              variant="secondary"
              className="w-full h-12 rounded-xl mt-6 font-semibold text-primary"
              onClick={() => {
                onStatusChange('done');
                if (action.link) navigate(action.link);
              }}
            >
              C'est parti
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            {/* Actions discrètes */}
            <div className="flex justify-between mt-3">
              <button
                onClick={() => openReasonDrawer('snoozed')}
                className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90 transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                Reporter à demain
              </button>
              <button
                onClick={() => openReasonDrawer('skipped')}
                className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Pas pour moi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer de justification */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{drawerTitle}</DrawerTitle>
            <DrawerDescription>{drawerDesc}</DrawerDescription>
          </DrawerHeader>
          <div className="p-5 space-y-3">
            {/* Presets */}
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setSelectedPreset(selectedPreset === preset ? null : preset);
                  setCustomReason('');
                }}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                  selectedPreset === preset
                    ? 'border-primary bg-primary/5 text-foreground font-medium'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                }`}
              >
                {preset}
              </button>
            ))}

            {/* Raison libre */}
            <Textarea
              placeholder="Autre raison (optionnel)"
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value);
                if (e.target.value) setSelectedPreset(null);
              }}
              className="mt-2 resize-none rounded-xl"
              rows={2}
              maxLength={200}
            />

            {/* Confirmer */}
            <Button
              className="w-full h-11 rounded-xl mt-2"
              onClick={confirmAction}
            >
              {drawerMode === 'snoozed' ? 'Reporter' : 'Confirmer'}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
