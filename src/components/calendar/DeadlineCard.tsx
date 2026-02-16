import { motion } from 'framer-motion';
import {
  Receipt, TrendingUp, FileText, Landmark, Home, Bitcoin, Users,
  Clock, CheckCircle2, AlertTriangle, XCircle, Star,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { EnrichedDeadline, CATEGORY_CONFIG, STATUS_CONFIG, URGENCY_CONFIG } from '@/lib/deadlinesTypes';

interface DeadlineCardProps {
  deadline: EnrichedDeadline;
  onClick: () => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Receipt, TrendingUp, FileText, Landmark, Home, Bitcoin, Users,
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  in_progress: AlertTriangle,
  optimized: CheckCircle2,
  ignored: XCircle,
};

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export const DeadlineCard = ({ deadline, onClick }: DeadlineCardProps) => {
  const categoryConf = CATEGORY_CONFIG[deadline.category];
  const status = deadline.tracking?.status || 'pending';
  const statusConf = STATUS_CONFIG[status];
  const urgencyConf = URGENCY_CONFIG[deadline.urgency];
  const CategoryIcon = CATEGORY_ICONS[categoryConf.icon] || FileText;
  const StatusIcon = STATUS_ICONS[status] || Clock;

  const daysLabel = deadline.daysLeft === 0
    ? "Aujourd'hui"
    : deadline.daysLeft < 0
    ? `${Math.abs(deadline.daysLeft)}j de retard`
    : deadline.daysLeft <= 7
    ? `${deadline.daysLeft}j`
    : deadline.daysLeft <= 30
    ? `${Math.ceil(deadline.daysLeft / 7)} sem`
    : `${Math.ceil(deadline.daysLeft / 30)} mois`;

  const gain = deadline.personalImpact.estimatedGain;
  const risk = deadline.personalImpact.riskIfNoAction;

  return (
    <motion.button
      onClick={onClick}
      className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all
        ${urgencyConf.bgColor} ${urgencyConf.borderColor}
        hover:shadow-lg active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      {/* Top row: category + urgency + status */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${urgencyConf.bgColor} ${urgencyConf.color} border ${urgencyConf.borderColor}`}>
          <CategoryIcon className="h-3 w-3" />
          {categoryConf.label}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusConf.bgColor} ${statusConf.color}`}>
          <StatusIcon className="h-3 w-3" />
          {statusConf.label}
        </span>
        {/* Impact score stars */}
        <div className="ml-auto flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${i < deadline.impactScore ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`}
            />
          ))}
        </div>
      </div>

      {/* Title + description */}
      <h3 className="font-semibold text-base mb-1 leading-tight">{deadline.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{deadline.shortDescription}</p>

      {/* Bottom row: date + impact + arrow */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-xs font-semibold ${deadline.daysLeft <= 14 ? 'text-destructive' : 'text-muted-foreground'}`}>
          📅 {deadline.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {daysLabel}
        </span>

        <div className="ml-auto flex items-center gap-3">
          {gain > 0 && (
            <span className="text-sm font-bold text-success">+{formatCurrency(gain)}</span>
          )}
          {risk > 0 && gain === 0 && (
            <span className="text-sm font-bold text-destructive">⚠ {formatCurrency(risk)}</span>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </motion.button>
  );
};
