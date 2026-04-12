import { AppLayout } from '@/components/layout/AppLayout';
import { Sparkles } from 'lucide-react';

const AgentPage = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-secondary" strokeWidth={2.5} />
          <h1 className="text-3xl font-bold text-foreground">Élio Agent</h1>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
          <p className="text-foreground">
            Bonjour ! Je suis Élio, ton copilote fiscal. Pose-moi une question ou choisis une action rapide :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Calcule mon impôt 2025',
              'Vérifie si j'ai droit à des aides',
              'Quelles sont mes prochaines échéances ?',
              'Compare micro vs SASU',
            ].map((suggestion) => (
              <button
                key={suggestion}
                className="text-left px-4 py-3 rounded-lg border border-border bg-muted/50 hover:bg-accent transition-colors text-sm font-medium text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Élio fournit des estimations à titre indicatif. Elles ne constituent pas un conseil fiscal personnalisé.
        </p>
      </div>
    </AppLayout>
  );
};

export default AgentPage;
