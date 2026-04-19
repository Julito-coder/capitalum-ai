import { AppLayout } from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import { Heart, Briefcase, Building2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const simulators = [
  {
    path: '/simulateurs/pacs',
    icon: Heart,
    title: 'PACS / Mariage',
    description: 'Combien tu peux économiser en t\'unissant fiscalement',
    typicalGain: 'Jusqu\'à 2 500 €/an',
    color: 'bg-primary/10 text-primary',
  },
  {
    path: '/simulateurs/freelance',
    icon: Briefcase,
    title: 'Passage freelance',
    description: 'Compare CDI, micro-entreprise, EURL et SASU',
    typicalGain: 'Choisir le bon statut peut rapporter 5 000 €/an',
    color: 'bg-secondary/10 text-secondary',
  },
  {
    path: '/outils/simulateur',
    icon: Building2,
    title: 'Investissement immobilier',
    description: 'Rentabilité, cashflow, patrimoine à terme',
    typicalGain: 'Évite les projets à perte (jusqu\'à 30 000 €)',
    color: 'bg-info/10 text-info',
  },
];

const Simulateurs = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Simulateurs de vie</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Anticipe l'impact fiscal de tes décisions importantes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {simulators.map((sim, i) => (
            <motion.button
              key={sim.path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(sim.path)}
              className="bg-card rounded-xl border border-border p-5 shadow-sm text-left hover:border-primary/30 transition-all space-y-3 group"
            >
              <div className={`h-11 w-11 rounded-xl ${sim.color} flex items-center justify-center`}>
                <sim.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {sim.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{sim.description}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs font-medium text-success">{sim.typicalGain}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </motion.button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center px-4 pt-4">
          Élio fournit des estimations à titre indicatif. Pour toute décision fiscale, consulte un professionnel habilité.
        </p>
      </div>
    </AppLayout>
  );
};

export default Simulateurs;
