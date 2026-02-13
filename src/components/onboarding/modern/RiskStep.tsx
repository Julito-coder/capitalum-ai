import { motion } from 'framer-motion';
import { ModernOnboardingData, RISK_OPTIONS } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onChange: (updates: Partial<ModernOnboardingData>) => void;
}

export const RiskStep = ({ data, onChange }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold mb-1">Quand tu penses à l'investissement, tu es plutôt…</h3>
        <p className="text-sm text-muted-foreground mb-6">Ta tolérance au risque guide nos recommandations</p>
      </div>

      <div className="space-y-3">
        {RISK_OPTIONS.map((opt, i) => {
          const selected = data.riskTolerance === opt.value;
          // Gradient intensity based on risk level
          const intensity = i / (RISK_OPTIONS.length - 1);
          const barWidth = 20 + intensity * 80;

          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange({ riskTolerance: opt.value })}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                selected
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border/50 bg-card/50 hover:border-primary/30'
              }`}
            >
              <span className="text-3xl flex-shrink-0">{opt.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{opt.label}</p>
                {/* Risk bar */}
                <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, hsl(var(--success)), hsl(var(--warning)), hsl(var(--destructive)))`,
                    }}
                  />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
