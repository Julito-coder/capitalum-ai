import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, X, ExternalLink, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/dashboardService';
import type { CoachRecommendation } from '@/lib/coachService';
import { cn } from '@/lib/utils';

interface Props {
  reco: CoachRecommendation;
  index: number;
  onAccept: (r: CoachRecommendation) => void;
  onComplete: (r: CoachRecommendation) => void;
  onSnooze: (r: CoachRecommendation) => void;
  onDismiss: (r: CoachRecommendation, reason?: string) => void;
  onReopen?: (r: CoachRecommendation) => void;
}

const categoryLabel: Record<CoachRecommendation['category'], string> = {
  epargne: 'Épargne',
  fiscal: 'Fiscal',
  famille: 'Famille',
  investissement: 'Investissement',
  declaration: 'Déclaration',
};

export const CoachRecoCard = ({ reco, index, onAccept, onComplete, onSnooze, onDismiss, onReopen }: Props) => {
  const [dismissOpen, setDismissOpen] = useState(false);
  const [reason, setReason] = useState('');

  const isUrgent = reco.urgencyDays !== undefined && reco.urgencyDays > 0 && reco.urgencyDays < 30;
  const isSoon = reco.urgencyDays !== undefined && reco.urgencyDays >= 30 && reco.urgencyDays < 90;
  const isDone = reco.status === 'completed';
  const isDismissed = reco.status === 'dismissed';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className={cn(
          'bg-card rounded-xl border p-4 sm:p-5 shadow-sm space-y-3',
          isDone && 'opacity-70 border-success/30',
          isDismissed && 'opacity-60'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                {categoryLabel[reco.category]}
              </Badge>
              {isUrgent && (
                <Badge className="bg-destructive text-destructive-foreground text-[10px] gap-1">
                  <AlertTriangle className="h-3 w-3" /> {reco.urgencyDays}j restants
                </Badge>
              )}
              {isSoon && !isUrgent && (
                <Badge className="bg-warning text-warning-foreground text-[10px] gap-1">
                  <Clock className="h-3 w-3" /> {reco.urgencyDays}j
                </Badge>
              )}
              {reco.isPremium && (
                <Badge className="bg-secondary text-secondary-foreground text-[10px] gap-1">
                  <Sparkles className="h-3 w-3" /> Premium
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-foreground leading-tight">{reco.title}</h3>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg sm:text-xl font-bold text-success">+{formatCurrency(reco.gain)}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">/an</div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{reco.description}</p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {reco.effort}</span>
          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-success" /> ROI immédiat</span>
        </div>

        {/* Actions */}
        {!isDone && !isDismissed && (
          <div className="flex flex-wrap gap-2 pt-2">
            {reco.externalUrl ? (
              <Button
                size="sm"
                className="flex-1 min-w-[140px]"
                onClick={() => {
                  onAccept(reco);
                  window.open(reco.externalUrl, '_blank', 'noopener');
                }}
              >
                Faire la démarche <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1 min-w-[140px]"
                onClick={() => onComplete(reco)}
              >
                <Check className="h-3.5 w-3.5 mr-1" /> Marquer comme fait
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onSnooze(reco)}>
              Plus tard
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDismissOpen(true)} aria-label="Ignorer">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {(isDone || isDismissed) && onReopen && (
          <div className="pt-2">
            <Button size="sm" variant="outline" onClick={() => onReopen(reco)}>
              Remettre dans À faire
            </Button>
          </div>
        )}
      </motion.div>

      <Dialog open={dismissOpen} onOpenChange={setDismissOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pourquoi ignorer cette reco ?</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optionnel : ça m'aide à mieux te conseiller."
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDismissOpen(false)}>Annuler</Button>
            <Button onClick={() => { onDismiss(reco, reason || undefined); setDismissOpen(false); setReason(''); }}>
              Ignorer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
