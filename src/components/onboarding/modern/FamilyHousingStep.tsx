import { motion } from 'framer-motion';
import { User, Heart, Users, UserMinus } from 'lucide-react';
import { ModernOnboardingData, FamilyStatus } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onSelect: (updates: Partial<ModernOnboardingData>) => void;
}

const OPTIONS: { value: FamilyStatus; label: string; icon: React.ElementType }[] = [
  { value: 'single', label: 'Célibataire', icon: User },
  { value: 'couple', label: 'En couple / Pacsé·e', icon: Heart },
  { value: 'married', label: 'Marié·e', icon: Users },
  { value: 'divorced', label: 'Divorcé·e / Veuf·ve', icon: UserMinus },
];

export const FamilyHousingStep = ({ data, onSelect }: Props) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Ta situation familiale ?</h2>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt, i) => {
          const Icon = opt.icon;
          const selected = data.familyStatus === opt.value;
          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect({ familyStatus: opt.value })}
              className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition-all duration-200 ${
                selected
                  ? 'border-2 border-primary bg-primary/[0.04] shadow-md scale-[1.02]'
                  : 'border border-border bg-card shadow-sm hover:border-primary/30'
              }`}
            >
              <Icon className={`h-5 w-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm font-semibold text-foreground">{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
