import { motion } from 'framer-motion';

interface QuizProgressProps {
  current: number;
  total: number;
}

export const QuizProgress = ({ current, total }: QuizProgressProps) => {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 25,
        }}
      />
    </div>
  );
};
