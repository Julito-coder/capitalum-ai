import { motion } from 'framer-motion';
import { ModernOnboardingData, AgeRange } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onSelect: (updates: Partial<ModernOnboardingData>) => void;
}

const AGE_OPTIONS: { value: AgeRange; label: string; emoji: string }[] = [
  { value: '18_25', label: '18-25 ans', emoji: '🎓' },
  { value: '26_35', label: '26-35 ans', emoji: '💼' },
  { value: '36_50', label: '36-50 ans', emoji: '🏠' },
  { value: '51_plus', label: '51 ans et +', emoji: '🌿' },
];

export const ProfileStep = ({ data, onSelect }: Props) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Tu as quel âge ?</h2>
      <div className="grid grid-cols-2 gap-3">
        {AGE_OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.value}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect({ ageRange: opt.value })}
            className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition-all duration-200 ${
              data.ageRange === opt.value
                ? 'border-2 border-primary bg-primary/[0.04] shadow-md scale-[1.02]'
                : 'border border-border bg-card shadow-sm hover:border-primary/30'
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-base font-semibold text-foreground">{opt.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
