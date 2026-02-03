import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  index?: number;
  className?: string;
  variant?: 'default' | 'highlight' | 'accent';
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: index * 0.1,
      ease: 'easeOut' as const
    }
  }),
  hover: {
    y: -4,
    transition: {
      duration: 0.2,
      ease: 'easeOut' as const
    }
  }
};

export const AnimatedCard = ({ 
  children, 
  index = 0, 
  className,
  variant = 'default'
}: AnimatedCardProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      custom={index}
      variants={cardVariants}
      className={cn(
        'transition-shadow duration-200 hover:shadow-lg hover:shadow-primary/5',
        className
      )}
    >
      {children}
    </motion.div>
  );
};
