import { motion } from 'framer-motion';
import { ModernOnboardingData, IncomeRange } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onSelect: (updates: Partial<ModernOnboardingData>) => void;
}

const OPTIONS: { value: IncomeRange; label: string }[] = [
  { value: 'less_1000', label: 'Moins de 1 000 €' },
  { value: '1000_1800', label: '1 000 – 1 800 €' },
  { value: '1800_3000', label: '1 800 – 3 000 €' },
  { value: '3000_5000', label: '3 000 – 5 000 €' },
  { value: 'more_5000', label: 'Plus de 5 000 €' },
];

export const RevenueStep = ({ data, onSelect }: Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Tes revenus nets mensuels ?</h2>
        <p className="text-base text-muted-foreground">Approximatif, c'est juste pour calibrer ton diagnostic</p>
      </div>
      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt, i) => {
          const selected = data.incomeRange === opt.value;
          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect({ incomeRange: opt.value })}
              className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                selected
                  ? 'border-2 border-primary bg-primary/[0.04] shadow-md'
                  : 'border border-border bg-card shadow-sm hover:border-primary/30'
              }`}
            >
              <span className="text-base font-semibold text-foreground">{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
