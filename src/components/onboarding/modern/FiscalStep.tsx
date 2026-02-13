import { motion } from 'framer-motion';
import { ModernOnboardingData, TAX_BRACKET_OPTIONS } from '@/data/modernOnboardingTypes';
import { Info } from 'lucide-react';

interface Props {
  data: ModernOnboardingData;
  onChange: (updates: Partial<ModernOnboardingData>) => void;
}

export const FiscalStep = ({ data, onChange }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* Declares in France */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Tu déclares tes revenus en France ?</h3>
        <p className="text-xs text-muted-foreground mb-4">Nécessaire pour les recommandations fiscales</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: true, label: 'Oui 🇫🇷', desc: 'Résident fiscal français' },
            { value: false, label: 'Non', desc: 'Autre pays de résidence' },
          ].map((opt) => (
            <motion.button
              key={String(opt.value)}
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange({ declaresInFrance: opt.value })}
              className={`flex flex-col items-center gap-1 p-5 rounded-2xl border-2 transition-all duration-200 ${
                data.declaresInFrance === opt.value
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border/50 bg-card/50 hover:border-primary/30'
              }`}
            >
              <span className="text-lg font-semibold">{opt.label}</span>
              <span className="text-xs text-muted-foreground">{opt.desc}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tax bracket */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Ta tranche d'imposition approximative</h3>
        <p className="text-xs text-muted-foreground mb-4">TMI – Taux Marginal d'Imposition</p>
        <div className="grid grid-cols-3 gap-2">
          {TAX_BRACKET_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ taxBracket: opt.value })}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                data.taxBracket === opt.value
                  ? 'border-primary bg-primary/10 text-primary shadow-md'
                  : 'border-border/50 bg-card/50 hover:border-primary/30'
              }`}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/20"
      >
        <Info className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Tu pourras compléter et modifier ton{' '}
          <span className="font-semibold text-foreground">profil fiscal</span> à tout moment dans l'app
          pour affiner tes recommandations.
        </p>
      </motion.div>
    </motion.div>
  );
};
