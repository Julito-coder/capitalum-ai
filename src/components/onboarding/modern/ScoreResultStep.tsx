import { motion } from 'framer-motion';
import { useCallback } from 'react';
import { Share2, ArrowRight, Info } from 'lucide-react';
import { ScoreElio } from '@/components/home/ScoreElio';
import { ElioScoreResult } from '@/lib/scoreElioEngine';
import { useToast } from '@/hooks/use-toast';

interface Props {
  result: ElioScoreResult;
  onComplete: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

export const ScoreResultStep = ({ result, onComplete, onSkip, isSubmitting }: Props) => {
  const { toast } = useToast();

  const handleShare = useCallback(async () => {
    const text = `Mon Score Élio : ${result.score}/100 — Je perds environ ${result.totalLoss.toLocaleString('fr-FR')} €/an sans le savoir ! Fais ton diagnostic sur elio.app`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mon Score Élio', text });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copié !', description: 'Lien copié dans le presse-papiers' });
    }
  }, [result, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center text-center px-4 py-6"
    >
      {/* Score circle */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
      >
        <ScoreElio score={result.score} label="Ton Score Élio" />
      </motion.div>

      {/* Loss amount */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6 mb-6"
      >
        <p className="text-sm text-muted-foreground mb-1">Tu perds environ</p>
        <p className="text-4xl font-extrabold text-destructive">
          {result.totalLoss.toLocaleString('fr-FR')} €<span className="text-lg font-semibold">/an</span>
        </p>
      </motion.div>

      {/* Breakdown */}
      {result.breakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="w-full max-w-sm space-y-2 mb-8"
        >
          {result.breakdown.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + i * 0.15 }}
              className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-destructive">
                -{item.amount.toLocaleString('fr-FR')} €
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="w-full max-w-sm space-y-3"
      >
        <button
          onClick={onComplete}
          disabled={isSubmitting}
          className="btn-primary w-full py-3.5 rounded-2xl text-base disabled:opacity-50"
        >
          Découvrir mes actions
          <ArrowRight className="h-5 w-5" />
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-border/50 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
        >
          <Share2 className="h-4 w-4" />
          Partager mon score
        </button>
      </motion.div>

      {/* Disclaimer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="mt-6 text-xs text-muted-foreground max-w-xs flex items-start gap-1.5"
      >
        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        Estimation indicative basée sur les barèmes en vigueur. Affine ton profil pour un diagnostic précis.
      </motion.p>
    </motion.div>
  );
};
