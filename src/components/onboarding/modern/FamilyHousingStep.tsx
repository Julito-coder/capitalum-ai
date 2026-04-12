import { motion } from 'framer-motion';
import { ModernOnboardingData, FAMILY_OPTIONS, HOUSING_OPTIONS } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onChange: (updates: Partial<ModernOnboardingData>) => void;
}

export const FamilyHousingStep = ({ data, onChange }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* Family situation */}
      <div>
        <h2 className="text-xl font-bold mb-1">Ta situation</h2>
        <p className="text-sm text-muted-foreground mb-4">Famille et logement</p>
        <div className="grid grid-cols-3 gap-3">
          {FAMILY_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange({ familySituation: opt.value })}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all duration-200 ${
                data.familySituation === opt.value
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border/50 bg-card/50 hover:border-primary/30'
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-xs font-medium">{opt.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Housing */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Ton logement</h3>
        <div className="grid grid-cols-2 gap-3">
          {HOUSING_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ housingStatus: opt.value })}
              className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 ${
                data.housingStatus === opt.value
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border/50 bg-card/50 hover:border-primary/30'
              }`}
            >
              <span className="text-3xl">{opt.emoji}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
