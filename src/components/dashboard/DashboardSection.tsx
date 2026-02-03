import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3;
}

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export const DashboardSection = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  children,
  className,
  columns = 2
}: DashboardSectionProps) => {
  // Mobile-first: single column, then expand on larger screens
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
  };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className={cn('space-y-4 sm:space-y-5', className)}
    >
      {/* Section header - mobile optimized */}
      <div className="flex items-center gap-3 pb-3 border-b border-border/20">
        {Icon && (
          <div className={cn(
            'p-2.5 sm:p-2 rounded-xl sm:rounded-lg shrink-0',
            'bg-gradient-to-br shadow-sm',
            iconColor === 'text-primary' && 'from-primary/15 to-primary/5 shadow-primary/10',
            iconColor === 'text-success' && 'from-success/15 to-success/5 shadow-success/10',
            iconColor === 'text-warning' && 'from-warning/15 to-warning/5 shadow-warning/10',
            iconColor === 'text-info' && 'from-info/15 to-info/5 shadow-info/10',
            iconColor === 'text-accent' && 'from-accent/15 to-accent/5 shadow-accent/10'
          )}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold tracking-tight truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Cards grid - generous spacing for mobile separation */}
      <div className={cn(
        'grid gap-4 sm:gap-5 md:gap-6',
        gridCols[columns]
      )}>
        {children}
      </div>
    </motion.section>
  );
};
