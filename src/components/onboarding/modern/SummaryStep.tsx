import { motion } from 'framer-motion';
import { ModernOnboardingData, PROFESSIONAL_STATUS_OPTIONS, OBJECTIVE_OPTIONS, RISK_OPTIONS, INCOME_OPTIONS, PATRIMONY_OPTIONS, TAX_BRACKET_OPTIONS } from '@/data/modernOnboardingTypes';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface Props {
  data: ModernOnboardingData;
  onComplete: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

export const SummaryStep = ({ data, onComplete, onSkip, isSubmitting }: Props) => {
  const status = PROFESSIONAL_STATUS_OPTIONS.find((o) => o.value === data.professionalStatus);
  const objectives = OBJECTIVE_OPTIONS.filter((o) => data.financialObjectives.includes(o.value));
  const risk = RISK_OPTIONS.find((o) => o.value === data.riskTolerance);
  const income = INCOME_OPTIONS.find((o) => o.value === data.incomeRange);
  const patrimony = PATRIMONY_OPTIONS.find((o) => o.value === data.patrimonyRange);
  const bracket = TAX_BRACKET_OPTIONS.find((o) => o.value === data.taxBracket);

  const items = [
    status && `${status.emoji} ${status.label}${data.ageRange ? ` • ${data.ageRange} ans` : ''}`,
    objectives.length > 0 && `🎯 ${objectives.map((o) => o.label).join(', ')}`,
    income && `💰 Revenu : ${income.label}/mois`,
    patrimony && `🏦 Patrimoine : ${patrimony.label}`,
    risk && `${risk.emoji} Profil ${risk.label.toLowerCase()}`,
    bracket && `📊 TMI : ${bracket.label}`,
  ].filter(Boolean) as string[];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-success/20 mb-4"
        >
          <CheckCircle2 className="h-8 w-8 text-success" />
        </motion.div>
        <h3 className="text-xl font-bold">Ton profil est prêt !</h3>
        <p className="text-sm text-muted-foreground mt-1">Voici un récapitulatif rapide</p>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.07 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card/80 border border-border/50"
          >
            <span className="text-sm">{item}</span>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3 pt-4">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onComplete}
          disabled={isSubmitting}
          className="btn-primary w-full py-4 rounded-2xl text-base disabled:opacity-50"
        >
          <Sparkles className="h-5 w-5" />
          {isSubmitting ? 'Sauvegarde…' : 'Accéder à mon tableau de bord personnalisé'}
        </motion.button>

        <button
          onClick={onSkip}
          disabled={isSubmitting}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Je compléterai plus tard
        </button>
      </div>
    </motion.div>
  );
};
