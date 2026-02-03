import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  index?: number;
  className?: string;
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 16,
    scale: 0.98
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      delay: index * 0.06,
      ease: 'easeOut' as const
    }
  }),
  hover: {
    y: -2,
    transition: {
      duration: 0.15,
      ease: 'easeOut' as const
    }
  }
};

export const AnimatedCard = ({ 
  children, 
  index = 0, 
  className
}: AnimatedCardProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      custom={index}
      variants={cardVariants}
      className={cn(
        // Mobile-first card wrapper with enhanced separation
        'relative rounded-2xl sm:rounded-xl',
        // Subtle shadow for depth (softer on mobile)
        'shadow-sm hover:shadow-md',
        'shadow-black/5 hover:shadow-black/10',
        // Smooth transitions
        'transition-shadow duration-200',
        className
      )}
    >
      {children}
    </motion.div>
  );
};
