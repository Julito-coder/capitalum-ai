import { motion } from 'framer-motion';
import { Briefcase, Laptop, GraduationCap, Search, Sun } from 'lucide-react';
import { ModernOnboardingData, ProfessionalStatus } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onSelect: (updates: Partial<ModernOnboardingData>) => void;
}

const OPTIONS: { value: ProfessionalStatus; label: string; icon: React.ElementType }[] = [
  { value: 'employee', label: 'Salarié·e', icon: Briefcase },
  { value: 'self_employed', label: 'Indépendant·e / Freelance', icon: Laptop },
  { value: 'student', label: 'Étudiant·e', icon: GraduationCap },
  { value: 'job_seeker', label: "En recherche d'emploi", icon: Search },
  { value: 'retired', label: 'Retraité·e', icon: Sun },
];

export const ProfessionalStep = ({ data, onSelect }: Props) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Quelle est ta situation ?</h2>

      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt, i) => {
          const Icon = opt.icon;
          const selected = data.professionalStatus === opt.value;
          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect({ professionalStatus: opt.value })}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
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
