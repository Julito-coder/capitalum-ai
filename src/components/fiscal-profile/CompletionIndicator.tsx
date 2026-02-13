import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface CompletionIndicatorProps {
  percentage: number;
}

export const CompletionIndicator = ({ percentage }: CompletionIndicatorProps) => {
  const isComplete = percentage >= 100;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            strokeWidth="6"
            className="stroke-muted"
          />
          <motion.circle
            cx="50" cy="50" r="40"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className="stroke-primary"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            strokeDasharray={circumference}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{percentage}%</span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <AlertCircle className="h-5 w-5 text-warning" />
          )}
          <span className="font-semibold text-foreground">
            {isComplete ? 'Profil fiscal complété' : 'Profil fiscal incomplet'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {isComplete
            ? 'Toutes les informations sont à jour.'
            : 'Complète ton profil pour des recommandations plus précises.'}
        </p>
      </div>
    </div>
  );
};
