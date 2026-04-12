import { motion } from 'framer-motion';
import { ModernOnboardingData, ChildrenRange } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onSelect: (updates: Partial<ModernOnboardingData>) => void;
}

const OPTIONS: { value: ChildrenRange; label: string; emoji: string }[] = [
  { value: 'none', label: 'Aucun', emoji: '🚫' },
  { value: '1', label: '1 enfant', emoji: '👶' },
  { value: '2', label: '2 enfants', emoji: '👧👦' },
  { value: '3_or_more', label: '3 ou plus', emoji: '👨‍👩‍👧‍👦' },
];

export const ChildrenStep = ({ data, onSelect }: Props) => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)]">
      <h2 className="text-2xl font-bold text-foreground mb-6">Tu as des enfants à charge ?</h2>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {OPTIONS.map((opt, i) => {
          const selected = data.childrenRange === opt.value;
          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect({ childrenRange: opt.value })}
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
