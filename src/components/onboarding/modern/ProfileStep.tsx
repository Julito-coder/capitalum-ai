import { motion } from 'framer-motion';
import {
  ModernOnboardingData,
  PROFESSIONAL_STATUS_OPTIONS,
  AGE_RANGE_OPTIONS,
  FAMILY_OPTIONS,
  ProfessionalStatus,
  AgeRange,
  FamilySituation,
} from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onChange: (updates: Partial<ModernOnboardingData>) => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export const ProfileStep = ({ data, onChange }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* Professional Status */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Tu es plutôt…</h3>
        <p className="text-sm text-muted-foreground mb-4">Sélectionne ta situation principale</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PROFESSIONAL_STATUS_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange({ professionalStatus: opt.value })}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
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

      {/* Age Range */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Tranche d'âge</h3>
        <div className="flex flex-wrap gap-2">
          {AGE_RANGE_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              custom={i + 5}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ ageRange: opt.value })}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                data.ageRange === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 bg-card/50 hover:border-primary/30'
              }`}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Family */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Situation familiale</h3>
        <p className="text-xs text-muted-foreground mb-3">Optionnel</p>
        <div className="grid grid-cols-3 gap-3">
          {FAMILY_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              custom={i + 10}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange({ familySituation: data.familySituation === opt.value ? null : opt.value })}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                data.familySituation === opt.value
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
    </motion.div>
  );
};
