import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface QuizCardOptionProps {
  label: string;
  subtitle?: string;
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  index?: number;
  type?: 'single' | 'multi';
}

export const QuizCardOption = ({
  label,
  subtitle,
  selected,
  onClick,
  icon,
  index = 0,
  type = 'single',
}: QuizCardOptionProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.05,
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border bg-card p-4 text-center transition-all duration-150 cursor-pointer overflow-hidden',
        selected
          ? 'border-2 border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:bg-muted/50 hover:border-[hsl(210,20%,80%)]'
      )}
    >
      {/* Check overlay */}
      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
        </motion.div>
      )}

      {/* Multi-select indicator */}
      {type === 'multi' && !selected && (
        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
      )}

      {/* Icon */}
      {icon && (
        <span className={cn(
          'transition-colors duration-150',
          selected ? 'text-primary' : 'text-muted-foreground'
        )}>
          {icon}
        </span>
      )}

      {/* Label */}
      <span className={cn(
        'text-sm font-semibold leading-tight',
        selected ? 'text-primary' : 'text-foreground'
      )}>
        {label}
      </span>

      {/* Subtitle */}
      {subtitle && (
        <span className="text-xs text-muted-foreground leading-snug">
          {subtitle}
        </span>
      )}
    </motion.button>
  );
};

// Wide card for multi-select lists
interface QuizWideCardProps {
  label: string;
  subtitle?: string;
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  index?: number;
}

export const QuizWideCard = ({
  label,
  subtitle,
  selected,
  onClick,
  icon,
  index = 0,
}: QuizWideCardProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.04,
        type: 'spring',
        stiffness: 400,
        damping: 28,
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border bg-card text-left transition-all duration-150 cursor-pointer',
        selected
          ? 'border-2 border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:bg-muted/50 hover:border-[hsl(210,20%,80%)]'
      )}
    >
      {/* Check / empty circle */}
      <div className={cn(
        'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150',
        selected ? 'bg-primary' : 'border-2 border-muted-foreground/30'
      )}>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
          </motion.div>
        )}
      </div>

      {/* Icon */}
      {icon && (
        <span className={cn(
          'flex-shrink-0 transition-colors',
          selected ? 'text-primary' : 'text-muted-foreground'
        )}>
          {icon}
        </span>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <span className={cn(
          'text-sm block leading-tight',
          selected ? 'text-primary font-semibold' : 'text-foreground font-medium'
        )}>
          {label}
        </span>
        {subtitle && (
          <span className="text-xs text-muted-foreground block mt-0.5">{subtitle}</span>
        )}
      </div>
    </motion.button>
  );
};
