import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ScoreElioProps {
  score: number; // 0-100
  label?: string;
}

export const ScoreElio = ({ score, label = 'Score Élio' }: ScoreElioProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = () => {
    if (score >= 70) return 'hsl(152 35% 45%)';
    if (score >= 40) return 'hsl(37 90% 51%)';
    return 'hsl(12 65% 50%)';
  };

  const getScoreLabel = () => {
    if (score >= 70) return 'Bien optimisé';
    if (score >= 40) return 'À améliorer';
    return 'Action urgente';
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="hsl(220 13% 91%)"
            strokeWidth="8"
          />
          <motion.circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={getScoreColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-extrabold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {animatedScore}
          </motion.span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color: getScoreColor() }}>
        {score > 0 ? getScoreLabel() : 'Complète ton profil'}
      </p>
    </div>
  );
};
