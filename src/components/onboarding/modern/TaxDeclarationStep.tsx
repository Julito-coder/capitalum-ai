import { motion } from 'framer-motion';
import { Monitor, Calculator, HelpCircle, XCircle } from 'lucide-react';
import { ModernOnboardingData, TaxDeclarationMode } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onSelect: (updates: Partial<ModernOnboardingData>) => void;
}

const OPTIONS: { value: TaxDeclarationMode; label: string; icon: React.ElementType }[] = [
  { value: 'online_self', label: 'Seul·e en ligne', icon: Monitor },
  { value: 'accountant', label: 'Avec un comptable', icon: Calculator },
  { value: 'not_yet', label: 'Je ne déclare pas encore', icon: XCircle },
  { value: 'unknown', label: 'Je ne sais pas', icon: HelpCircle },
];

export const TaxDeclarationStep = ({ data, onSelect }: Props) => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)]">
      <h2 className="text-2xl font-bold text-foreground mb-6">Tu déclares tes impôts…</h2>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {OPTIONS.map((opt, i) => {
          const Icon = opt.icon;
          const selected = data.taxDeclarationMode === opt.value;
          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect({ taxDeclarationMode: opt.value })}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border transition-all duration-200 ${
                selected
                  ? 'border-2 border-primary bg-primary/[0.04] shadow-md scale-[1.02]'
                  : 'border border-border bg-card shadow-sm hover:border-primary/30'
              }`}
            >
              <Icon className={`h-7 w-7 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm font-semibold text-foreground text-center">{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
