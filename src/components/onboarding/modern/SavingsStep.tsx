import { motion } from 'framer-motion';
import { PiggyBank, Wallet, TrendingUp, Landmark } from 'lucide-react';
import { ModernOnboardingData, SavingsRange } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onSelect: (updates: Partial<ModernOnboardingData>) => void;
}

const OPTIONS: { value: SavingsRange; label: string; icon: React.ElementType }[] = [
  { value: 'none', label: 'Pas d\'épargne', icon: Wallet },
  { value: 'less_10k', label: 'Moins de 10 000 €', icon: PiggyBank },
  { value: '10k_50k', label: '10 000 – 50 000 €', icon: TrendingUp },
  { value: 'more_50k', label: 'Plus de 50 000 €', icon: Landmark },
];

export const SavingsStep = ({ data, onSelect }: Props) => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Tu as de l'épargne placée ?</h2>
        <p className="text-sm text-muted-foreground">Livrets, assurance-vie, PEA, etc.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {OPTIONS.map((opt, i) => {
          const Icon = opt.icon;
          const selected = data.savingsRange === opt.value;
          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect({ savingsRange: opt.value })}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border transition-all duration-200 ${
                selected
                  ? 'border-2 border-primary bg-primary/[0.04] shadow-md scale-[1.02]'
                  : 'border border-border bg-card shadow-sm hover:border-primary/30'
              }`}
            >
              <Icon className={`h-7 w-7 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm font-semibold text-foreground text-center">{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
