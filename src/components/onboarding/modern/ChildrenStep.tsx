import { motion } from 'framer-motion';
import { ModernOnboardingData, ChildrenRange } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onSelect: (updates: Partial<ModernOnboardingData>) => void;
}

const OPTIONS: { value: ChildrenRange; label: string }[] = [
  { value: 'none', label: 'Aucun' },
  { value: '1_or_2', label: '1 ou 2' },
  { value: '3_or_more', label: '3 ou plus' },
];

export const ChildrenStep = ({ data, onSelect }: Props) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Tu as des enfants à charge ?</h2>

      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt, i) => {
          const selected = data.childrenRange === opt.value;
          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect({ childrenRange: opt.value })}
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
