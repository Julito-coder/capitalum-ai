import { motion } from 'framer-motion';
import { ModernOnboardingData, IncomeRange } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onSelect: (updates: Partial<ModernOnboardingData>) => void;
}

const OPTIONS: { value: IncomeRange; label: string; emoji: string }[] = [
  { value: 'less_1500', label: 'Moins de 1 500 €', emoji: '💰' },
  { value: '1500_2500', label: '1 500 – 2 500 €', emoji: '💵' },
  { value: '2500_4000', label: '2 500 – 4 000 €', emoji: '💳' },
  { value: 'more_4000', label: 'Plus de 4 000 €', emoji: '🏦' },
];

export const RevenueStep = ({ data, onSelect }: Props) => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Tes revenus nets mensuels ?</h2>
        <p className="text-sm text-muted-foreground">Approximatif, c'est juste pour calibrer</p>
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {OPTIONS.map((opt, i) => {
          const selected = data.incomeRange === opt.value;
          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect({ incomeRange: opt.value })}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border transition-all duration-200 ${
                selected
                  ? 'border-2 border-primary bg-primary/[0.04] shadow-md scale-[1.02]'
                  : 'border border-border bg-card shadow-sm hover:border-primary/30'
              }`}
            >
              <span className="text-3xl">{opt.emoji}</span>
              <span className="text-sm font-semibold text-foreground">{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
