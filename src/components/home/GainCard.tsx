import { motion } from 'framer-motion';
import { TrendingDown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GainCardProps {
  totalLoss: number;
  breakdown: { label: string; amount: number }[];
}

export const GainCard = ({ totalLoss, breakdown }: GainCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Estimation annuelle</p>
          <p className="text-2xl font-extrabold text-destructive">
            {totalLoss > 0 ? `-${totalLoss.toLocaleString('fr-FR')} €/an` : 'Calcul en cours...'}
          </p>
          <p className="text-sm text-muted-foreground">
            {totalLoss > 0 ? "d'argent que tu pourrais récupérer" : 'Complète ton profil pour estimer tes pertes'}
          </p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
          <TrendingDown className="h-5 w-5 text-destructive" />
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          {breakdown.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-destructive">-{item.amount.toLocaleString('fr-FR')} €</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => navigate('/outils/scanner')}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all hover:opacity-90"
      >
        Scanner ma situation
        <ArrowRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
};
