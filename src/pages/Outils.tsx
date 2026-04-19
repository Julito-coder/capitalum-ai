import { AppLayout } from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import { Calendar, ScanSearch, Building2, PiggyBank, FolderLock, HandCoins, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const tools = [
  {
    path: '/coach',
    icon: Sparkles,
    title: 'Coach fiscal',
    description: 'Tes optimisations personnalisées avec gain estimé',
    color: 'bg-secondary/10 text-secondary',
  },
  {
    path: '/outils/calendrier',
    icon: Calendar,
    title: 'Calendrier fiscal',
    description: 'Tes échéances et prélèvements mois par mois',
    color: 'bg-primary/10 text-primary',
  },
  {
    path: '/outils/scanner',
    icon: ScanSearch,
    title: 'Scanner fiscal',
    description: 'Détecte les erreurs et optimisations sur ta déclaration',
    color: 'bg-warning/10 text-warning',
  },
  {
    path: '/outils/simulateur',
    icon: Building2,
    title: 'Simulateur immobilier',
    description: 'Calcule la rentabilité de ton investissement locatif',
    color: 'bg-info/10 text-info',
  },
  {
    path: '/outils/epargne',
    icon: PiggyBank,
    title: 'Simulateur épargne',
    description: 'Projette ton épargne sur le long terme',
    color: 'bg-success/10 text-success',
  },
  {
    path: '/outils/coffre',
    icon: FolderLock,
    title: 'Coffre-fort',
    description: 'Tes documents fiscaux en sécurité',
    color: 'bg-secondary/10 text-secondary',
  },
  {
    path: '/outils/aides',
    icon: HandCoins,
    title: 'Détecteur d\'aides',
    description: 'Découvre les aides auxquelles tu as droit',
    color: 'bg-success/10 text-success',
  },
];

const OutilsPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Outils</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tous les outils pour prendre le contrôle de ta situation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool, i) => (
            <motion.button
              key={tool.path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(tool.path)}
              className="bg-card rounded-xl border border-border p-5 shadow-sm text-left hover:border-primary/30 transition-all space-y-3 group"
            >
              <div className={`h-11 w-11 rounded-xl ${tool.color} flex items-center justify-center`}>
                <tool.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default OutilsPage;
