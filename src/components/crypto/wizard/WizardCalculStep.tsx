import { Info, Calculator } from 'lucide-react';

export const WizardCalculStep = () => {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 5 — Calcul PV / MV</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Capitalum applique la méthode officielle française (art. 150 VH bis CGI) pour calculer
          tes plus-values et moins-values.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Formule de calcul (PMPA)</p>
            <div className="font-mono text-xs bg-muted/30 p-3 rounded-lg mt-2">
              PV = Prix de cession<br />
              &nbsp;&nbsp;&nbsp;− (Prix total acquisition × Prix cession / Valeur globale portefeuille)<br />
              &nbsp;&nbsp;&nbsp;− Frais de cession
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Cette formule est appliquée à chaque cession individuellement, puis les résultats
              sont agrégés pour obtenir le gain net de l'année.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Calculator className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Complète les étapes précédentes pour lancer le calcul automatique.
        </p>
      </div>
    </div>
  );
};
