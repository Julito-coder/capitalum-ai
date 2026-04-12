import { AppLayout } from '@/components/layout/AppLayout';
import { ElioLogo } from '@/components/layout/ElioLogo';

const HomePage = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <ElioLogo variant="symbol" size={32} />
          <h1 className="text-3xl font-bold text-foreground">Bonjour 👋</h1>
        </div>
        <p className="text-muted-foreground">
          Ton copilote administratif et financier. Ne perds plus un euro par manque d'information.
        </p>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm text-center space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Score Élio</p>
          <p className="text-5xl font-extrabold text-primary">—</p>
          <p className="text-sm text-muted-foreground">Complète ton profil pour obtenir ton score</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-2">
          <h2 className="text-xl font-bold text-foreground">Tu perds peut-être de l'argent</h2>
          <p className="text-muted-foreground text-sm">
            Élio analyse ta situation et détecte les aides non réclamées, les erreurs fiscales, et les contrats non optimisés.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default HomePage;
