import { AppLayout } from '@/components/layout/AppLayout';
import { UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <UserCircle className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Mon profil</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/profil/fiscal')}
            className="bg-card rounded-xl border border-border p-6 shadow-sm text-left hover:border-primary/30 transition-all"
          >
            <h3 className="text-lg font-semibold text-foreground">Profil fiscal</h3>
            <p className="text-sm text-muted-foreground mt-1">Ta situation fiscale complète</p>
          </button>

          <button
            onClick={() => navigate('/profil/parametres')}
            className="bg-card rounded-xl border border-border p-6 shadow-sm text-left hover:border-primary/30 transition-all"
          >
            <h3 className="text-lg font-semibold text-foreground">Paramètres</h3>
            <p className="text-sm text-muted-foreground mt-1">Compte, notifications, données</p>
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilPage;
