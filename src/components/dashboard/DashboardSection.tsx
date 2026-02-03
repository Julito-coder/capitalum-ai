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
      staggerChildren: 0.1,
      delayChildren: 0.1
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
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
  };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className={cn('space-y-4', className)}
    >
      {/* Section header with visual separator */}
      <div className="flex items-center gap-3 pb-2 border-b border-border/30">
        {Icon && (
          <div className={cn(
            'p-2 rounded-lg bg-gradient-to-br',
            iconColor === 'text-primary' && 'from-primary/10 to-primary/5',
            iconColor === 'text-success' && 'from-success/10 to-success/5',
            iconColor === 'text-warning' && 'from-warning/10 to-warning/5',
            iconColor === 'text-info' && 'from-info/10 to-info/5',
            iconColor === 'text-accent' && 'from-accent/10 to-accent/5'
          )}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Section content grid */}
      <div className={cn('grid gap-6', gridCols[columns])}>
        {children}
      </div>
    </motion.section>
  );
};
