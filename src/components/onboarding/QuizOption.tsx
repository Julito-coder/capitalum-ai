import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizOptionProps {
  label: string;
  subtitle?: string;
  selected: boolean;
  onClick: () => void;
  type?: 'single' | 'multi';
  icon?: React.ReactNode;
}

export const QuizOption = ({ label, subtitle, selected, onClick, type = 'single', icon }: QuizOptionProps) => {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-150',
        selected
          ? 'border-2 border-primary bg-primary/5'
          : 'border border-border bg-card hover:bg-muted/50 hover:border-[#C8D4E0]'
      )}
    >
      {type === 'multi' && (
        <div
          className={cn(
            'flex-shrink-0 w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-colors',
            selected ? 'bg-primary border-primary' : 'border-muted-foreground'
          )}
        >
          {selected && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
      )}
      {icon && (
        <span className={cn('flex-shrink-0', selected ? 'text-primary' : 'text-muted-foreground')}>
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <span className={cn(
          'text-sm block',
          selected ? 'text-primary font-semibold' : 'text-foreground font-medium'
        )}>
          {label}
        </span>
        {subtitle && (
          <span className="text-xs text-muted-foreground block mt-0.5">{subtitle}</span>
        )}
      </div>
      {type === 'single' && selected && (
        <Check className="h-4 w-4 text-primary flex-shrink-0" />
      )}
    </motion.button>
  );
};

interface QuizGridOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export const QuizGridOption = ({ label, selected, onClick }: QuizGridOptionProps) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-xl border transition-all duration-150 aspect-square',
        selected
          ? 'border-2 border-primary bg-primary/5'
          : 'border border-border bg-card hover:bg-muted/50'
      )}
    >
      <span className={cn(
        'text-xl font-bold',
        selected ? 'text-primary' : 'text-foreground'
      )}>
        {label}
      </span>
    </motion.button>
  );
};
