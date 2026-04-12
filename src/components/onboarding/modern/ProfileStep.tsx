import { motion } from 'framer-motion';
import { ModernOnboardingData, PROFESSIONAL_STATUS_OPTIONS, AGE_RANGE_OPTIONS } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onChange: (updates: Partial<ModernOnboardingData>) => void;
}

export const ProfileStep = ({ data, onChange }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-xl font-bold mb-1">Qui es-tu ?</h2>
        <p className="text-sm text-muted-foreground mb-4">Ta situation professionnelle</p>
        <div className="grid grid-cols-2 gap-3">
          {PROFESSIONAL_STATUS_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange({ professionalStatus: opt.value })}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all duration-200 ${
                data.professionalStatus === opt.value
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border/50 bg-card/50 hover:border-primary/30'
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Ta tranche d'âge</h3>
        <div className="flex flex-wrap gap-2">
          {AGE_RANGE_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ ageRange: opt.value })}
              className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                data.ageRange === opt.value
                  ? 'border-primary bg-primary/10 text-primary shadow-md'
                  : 'border-border/50 bg-card/50 hover:border-primary/30'
              }`}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
