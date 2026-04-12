import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Share2, Shield, FileSearch, AlertTriangle } from 'lucide-react';
import { DiagnosticResult } from '@/types/onboarding';
import { Button } from '@/components/ui/button';

interface QuizResultProps {
  result: DiagnosticResult;
  onFinish: () => void;
  isSubmitting: boolean;
}

const formatEuros = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const useCountUp = (target: number, duration = 800, delay = 500) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
};

const ScoreRing = ({ score }: { score: number }) => {
  const size = 180;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference * (1 - score / 100));
    }, 500);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  const getColor = () => {
    if (score <= 30) return 'hsl(var(--destructive))';
    if (score <= 50) return 'hsl(var(--warning))';
    if (score <= 70) return 'hsl(var(--secondary))';
    return 'hsl(var(--success))';
  };

  const displayScore = useCountUp(score, 1500, 500);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={getColor()} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold text-foreground">{displayScore}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
};

const getScoreLabel = (score: number) => {
  if (score <= 30) return { text: 'Situation préoccupante', className: 'text-destructive' };
  if (score <= 50) return { text: 'Des améliorations importantes à faire', className: 'text-warning' };
  if (score <= 70) return { text: 'Correct, mais tu peux mieux faire', className: 'text-secondary' };
  return { text: 'Bonne maîtrise de ta situation', className: 'text-success' };
};

const stagger = (i: number) => ({ delay: 0.2 + i * 0.2 });
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export const QuizResult = ({ result, onFinish, isSubmitting }: QuizResultProps) => {
  const { score, totalLoss, breakdown } = result;
  const label = getScoreLabel(score);
  const animatedLoss = useCountUp(totalLoss, 800, 1200);

  const handleShare = useCallback(async () => {
    const text = `Mon Score Élio : ${score}/100 — Je perds environ ${formatEuros(totalLoss)}/an sans le savoir. Fais ton diagnostic`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Mon Score Élio', text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  }, [score, totalLoss]);

  const breakdownCards = [
    { icon: Shield, amount: breakdown.missedAids, label: 'Aides non réclamées' },
    { icon: FileSearch, amount: breakdown.missedOptimizations, label: 'Optimisations fiscales' },
    { icon: AlertTriangle, amount: breakdown.risks, label: 'Risques détectés' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-8" style={{
      background: 'radial-gradient(ellipse at top, rgba(27,58,92,0.06), transparent 60%)',
    }}>
      {/* Title */}
      <motion.p {...fadeUp} transition={stagger(0)} className="text-lg font-semibold text-muted-foreground mb-6">
        Ton diagnostic Élio
      </motion.p>

      {/* Score ring */}
      <motion.div {...fadeUp} transition={{ ...stagger(1), duration: 0.5 }}>
        <ScoreRing score={score} />
      </motion.div>

      <motion.p {...fadeUp} transition={stagger(2)} className={`mt-3 font-semibold text-sm ${label.className}`}>
        {label.text}
      </motion.p>

      {/* Total loss card */}
      <motion.div {...fadeUp} transition={stagger(3)}
        className="mt-6 w-full bg-card border border-border rounded-xl p-6 shadow-sm text-center"
      >
        <p className="text-sm text-muted-foreground">Tu perds environ</p>
        <p className="text-4xl font-extrabold text-destructive mt-1">{formatEuros(animatedLoss)} / an</p>
        <p className="text-sm text-muted-foreground mt-1">en aides non réclamées et optimisations manquées</p>
      </motion.div>

      {/* Breakdown */}
      <motion.div {...fadeUp} transition={stagger(4)} className="mt-4 w-full flex gap-3">
        {breakdownCards.map(({ icon: Icon, amount, label: l }, i) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 + i * 0.1 }}
            className="flex-1 bg-card border border-border rounded-xl p-3 text-center shadow-sm"
          >
            <Icon className="h-5 w-5 text-secondary mx-auto mb-1.5" />
            <p className="text-lg font-bold text-foreground">{formatEuros(amount)}</p>
            <p className="text-xs text-muted-foreground">{l}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* CTAs */}
      <motion.div {...fadeUp} transition={stagger(5)} className="mt-8 w-full space-y-3">
        <Button onClick={onFinish} disabled={isSubmitting} className="w-full h-12 rounded-lg font-semibold text-sm">
          {isSubmitting ? 'Sauvegarde en cours…' : 'Récupérer mon argent'}
        </Button>
        <Button variant="outline" onClick={handleShare} className="w-full h-11 rounded-lg font-medium text-sm border-primary text-primary">
          <Share2 className="h-4 w-4 mr-2" />
          Partager mon score
        </Button>
      </motion.div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center mt-8 max-w-xs">
        Ces estimations sont à titre indicatif et ne constituent pas un conseil fiscal.
      </p>
    </div>
  );
};
