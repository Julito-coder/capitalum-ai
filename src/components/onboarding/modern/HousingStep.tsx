import { motion } from 'framer-motion';
import { Key, Home, Users } from 'lucide-react';
import { ModernOnboardingData, HousingStatus } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onSelect: (updates: Partial<ModernOnboardingData>) => void;
}

const OPTIONS: { value: HousingStatus; label: string; icon: React.ElementType }[] = [
  { value: 'tenant', label: 'Locataire', icon: Key },
  { value: 'owner', label: 'Propriétaire', icon: Home },
  { value: 'hosted', label: 'Hébergé·e gratuitement', icon: Users },
];

export const HousingStep = ({ data, onSelect }: Props) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Tu es…</h2>

      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt, i) => {
          const Icon = opt.icon;
          const selected = data.housingStatus === opt.value;
          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect({ housingStatus: opt.value })}
              className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                selected
                  ? 'border-2 border-primary bg-primary/[0.04] shadow-md'
                  : 'border border-border bg-card shadow-sm hover:border-primary/30'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-base font-semibold text-foreground">{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
