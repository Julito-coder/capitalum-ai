import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { Gift, TrendingUp, FileWarning, Share2 } from 'lucide-react';
import { ElioScoreResult } from '@/lib/scoreElioEngine';

interface Props {
  result: ElioScoreResult;
  onCreateAccount: () => void;
  onLogin: () => void;
  isSubmitting: boolean;
}

const useCountUp = (target: number, duration = 1500, delay = 400) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
};

export const ScoreResultStep = ({ result, onCreateAccount, onLogin, isSubmitting }: Props) => {
  const animatedScore = useCountUp(result.score, 1500, 300);
  const animatedLoss = useCountUp(result.totalLoss, 1500, 800);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getScoreColor = () => {
    if (result.score > 65) return 'hsl(152 35% 45%)';
    if (result.score >= 40) return 'hsl(37 90% 51%)';
    return 'hsl(12 65% 50%)';
  };

  const handleShare = useCallback(async () => {
    const text = `Mon Score Élio : ${result.score}/100 — Je perds environ ${result.totalLoss.toLocaleString('fr-FR')} €/an sans le savoir ! Fais le test 👉`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mon Score Élio', text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  }, [result]);

  const breakdownItems = [
    { label: 'Aides non réclamées', amount: result.breakdown.aids, icon: Gift, bgClass: 'bg-success/10', textClass: 'text-success' },
    { label: 'Optimisations fiscales', amount: result.breakdown.tax, icon: TrendingUp, bgClass: 'bg-warning/10', textClass: 'text-warning' },
    { label: 'Contrats non optimisés', amount: result.breakdown.contracts, icon: FileWarning, bgClass: 'bg-destructive/10', textClass: 'text-destructive' },
  ];

  return (
    <div className="flex flex-col items-center pt-4 pb-8 px-2">
      {/* Score gauge */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-36 h-36 mb-4"
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={getScoreColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-foreground">{animatedScore}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-sm font-medium mb-6"
        style={{ color: getScoreColor() }}
      >
        {result.score > 65 ? 'Bien optimisé' : result.score >= 40 ? 'À améliorer' : 'Action urgente'}
      </motion.p>

      {/* Loss amount */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center mb-8"
      >
        <p className="text-base text-muted-foreground mb-1">Tu perds environ</p>
        <p className="text-3xl font-extrabold text-destructive">
          {animatedLoss.toLocaleString('fr-FR')} €/an
        </p>
      </motion.div>

      {/* Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="w-full space-y-3 mb-8"
      >
        {breakdownItems.filter(item => item.amount > 0).map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`flex items-center gap-3 p-4 rounded-xl ${item.bgClass}`}>
              <div className={`flex-shrink-0 p-2 rounded-lg ${item.bgClass}`}>
                <Icon className={`h-5 w-5 ${item.textClass}`} />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
              <span className={`text-sm font-bold ${item.textClass}`}>
                {item.amount.toLocaleString('fr-FR')} €/an
              </span>
            </div>
          );
        })}
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="w-full space-y-3"
      >
        <button
          onClick={onCreateAccount}
          disabled={isSubmitting}
          className="w-full h-14 bg-primary text-primary-foreground font-semibold text-base rounded-xl shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? 'Chargement…' : 'Récupérer mon argent'}
        </button>

        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <Share2 className="h-4 w-4" />
          Partager mon score
        </button>

        <button
          onClick={onLogin}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          J'ai déjà un compte
        </button>
      </motion.div>
    </div>
  );
};