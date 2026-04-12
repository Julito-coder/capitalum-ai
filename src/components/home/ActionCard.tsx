import { motion } from 'framer-motion';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gain?: number;
  link: string;
  severity: 'critical' | 'warning' | 'success' | 'info';
  index?: number;
}

const severityStyles = {
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  success: 'bg-success/10 text-success border-success/20',
  info: 'bg-info/10 text-info border-info/20',
};

const iconBgStyles = {
  critical: 'bg-destructive/10',
  warning: 'bg-warning/10',
  success: 'bg-success/10',
  info: 'bg-info/10',
};

const iconTextStyles = {
  critical: 'text-destructive',
  warning: 'text-warning',
  success: 'text-success',
  info: 'text-info',
};

export const ActionCard = ({ icon: Icon, title, description, gain, link, severity, index = 0 }: ActionCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
      onClick={() => navigate(link)}
      className="w-full bg-card rounded-xl border border-border p-4 shadow-sm text-left flex items-start gap-4 hover:border-primary/30 transition-all"
    >
      <div className={`h-10 w-10 rounded-xl ${iconBgStyles[severity]} flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${iconTextStyles[severity]}`} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        {gain !== undefined && gain > 0 && (
          <p className="text-xs font-semibold text-success">+{gain.toLocaleString('fr-FR')} € d'économie potentielle</p>
        )}
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
    </motion.button>
  );
};
