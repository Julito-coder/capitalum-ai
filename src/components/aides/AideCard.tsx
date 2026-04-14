import { ExternalLink, ChevronDown, ChevronUp, Home, Users, Briefcase, Heart, Zap, GraduationCap, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClassifiedAide } from '@/lib/aidesService';
import { AideCategory, CATEGORY_LABELS } from '@/lib/aidesData';

const categoryIcons: Record<AideCategory, React.ElementType> = {
  logement: Home,
  famille: Users,
  emploi: Briefcase,
  sante: Heart,
  energie: Zap,
  education: GraduationCap,
  investissement: TrendingUp,
};

const categoryColors: Record<AideCategory, string> = {
  logement: 'bg-primary/10 text-primary',
  famille: 'bg-accent/20 text-accent-foreground',
  emploi: 'bg-info/10 text-info',
  sante: 'bg-destructive/10 text-destructive',
  energie: 'bg-warning/10 text-warning',
  education: 'bg-secondary/20 text-secondary-foreground',
  investissement: 'bg-success/10 text-success',
};

const formatAmount = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

interface AideCardProps {
  item: ClassifiedAide;
  index: number;
}

export const AideCard = ({ item, index }: AideCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { aide, status, estimatedAmount } = item;
  const Icon = categoryIcons[aide.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${categoryColors[aide.category]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground leading-tight">{aide.title}</h3>
          <Badge variant="secondary" className="mt-1 text-[10px]">
            {CATEGORY_LABELS[aide.category]}
          </Badge>
        </div>
      </div>

      {estimatedAmount && (
        <div className="bg-success/5 border border-success/20 rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">Montant estimé</p>
          <p className="text-lg font-bold text-success">
            {formatAmount(estimatedAmount.min)}
            {estimatedAmount.max !== estimatedAmount.min && ` – ${formatAmount(estimatedAmount.max)}`}
            <span className="text-xs font-normal text-muted-foreground ml-1">/{estimatedAmount.period}</span>
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{aide.description}</p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-primary flex items-center gap-1 hover:underline"
      >
        {expanded ? 'Masquer les détails' : 'Voir les conditions'}
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2">
          <p className="text-xs text-muted-foreground"><strong>Conditions :</strong> {aide.conditions}</p>
          <div className="text-xs text-muted-foreground">
            <strong>Étapes :</strong>
            <ol className="list-decimal ml-4 mt-1 space-y-0.5">
              {aide.applicationSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </motion.div>
      )}

      <div className="pt-1">
        {status === 'eligible' ? (
          <Button size="sm" className="w-full text-xs" asChild>
            <a href={aide.applicationUrl} target="_blank" rel="noopener noreferrer">
              Faire ma demande <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => navigate('/profil/fiscal')}>
            Compléter mon profil
          </Button>
        )}
      </div>
    </motion.div>
  );
};
