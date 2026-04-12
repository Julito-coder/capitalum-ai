import { ReactNode, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

interface QuizStepProps {
  stepKey: string;
  direction: number;
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const QuizStep = ({ stepKey, direction, children, onSwipeLeft, onSwipeRight }: QuizStepProps) => {
  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight]);

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
