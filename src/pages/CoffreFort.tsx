import { AppLayout } from '@/components/layout/AppLayout';
import { FolderLock } from 'lucide-react';

const CoffreFortPage = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Coffre-fort</h1>
        <p className="text-muted-foreground">
          Stocke et organise tes documents fiscaux en toute sécurité.
        </p>

        <div className="bg-card rounded-xl border border-border p-12 shadow-sm text-center space-y-4">
          <FolderLock className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Bientôt disponible</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Le coffre-fort te permettra de stocker tes avis d'imposition, fiches de paie, et autres documents importants.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default CoffreFortPage;
