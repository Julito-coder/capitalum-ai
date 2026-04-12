import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';
import { ElioLogo } from '@/components/layout/ElioLogo';

interface Props {
  onStart: () => void;
  onLogin: () => void;
}

export const WelcomeStep = ({ onStart, onLogin }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-center px-6 py-12 min-h-[70vh]"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="mb-8">
          <ElioLogo variant="symbol" size={64} />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl lg:text-4xl font-bold mb-4"
      >
        Découvre combien tu{' '}
        <span className="text-destructive font-extrabold">perds</span>{' '}
        chaque année
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg text-muted-foreground max-w-md mb-2"
      >
        En 2 minutes, Élio analyse ta situation et te montre les{' '}
        <span className="text-success font-semibold">euros que tu laisses sur la table</span>.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 text-sm text-muted-foreground mb-10"
      >
        <Clock className="h-4 w-4" />
        <span>8 questions rapides • ~2 min</span>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="btn-primary text-lg px-8 py-4 rounded-2xl shadow-lg"
      >
        <Sparkles className="h-5 w-5" />
        Faire mon diagnostic
        <ArrowRight className="h-5 w-5" />
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={onLogin}
        className="mt-6 text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
      >
        J'ai déjà un compte
      </motion.button>
    </motion.div>
  );
};
