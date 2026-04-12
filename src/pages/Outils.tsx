import { AppLayout } from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ScanSearch,
  Building2,
  PiggyBank,
  FolderLock,
} from 'lucide-react';

const tools = [
  {
    path: '/outils/calendrier',
    icon: Calendar,
    title: 'Calendrier fiscal',
    description: 'Tes échéances et prélèvements à venir',
  },
  {
    path: '/outils/scanner',
    icon: ScanSearch,
    title: 'Scanner fiscal',
    description: 'Détecte les erreurs et optimisations',
  },
  {
    path: '/outils/simulateur',
    icon: Building2,
    title: 'Simulateur immobilier',
    description: 'Rentabilité, cashflow, patrimoine',
  },
  {
    path: '/outils/epargne',
    icon: PiggyBank,
    title: 'Épargne long terme',
    description: 'Projections et comparaisons',
  },
  {
    path: '/outils/coffre',
    icon: FolderLock,
    title: 'Coffre-fort',
    description: 'Tes documents fiscaux sécurisés',
  },
];

const OutilsPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Outils</h1>
        <p className="text-muted-foreground">
          Tous tes outils fiscaux et financiers au même endroit.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <button
              key={tool.path}
              onClick={() => navigate(tool.path)}
              className="bg-card rounded-xl border border-border p-6 shadow-sm text-left hover:border-primary/30 transition-all duration-200 space-y-3"
            >
              <tool.icon className="h-8 w-8 text-primary" strokeWidth={2} />
              <div>
                <h3 className="text-lg font-semibold text-foreground">{tool.title}</h3>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default OutilsPage;
