import { Info, AlertTriangle } from 'lucide-react';

export const WizardValorisationStep = () => {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 3 — Valorisation en EUR</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chaque événement taxable doit avoir une valorisation en euros au moment de la cession.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Comment ça marche ?</p>
            <ul className="space-y-1 text-xs">
              <li>• Si tu as saisi la valeur EUR dans tes transactions, c'est déjà fait ✓</li>
              <li>• Sinon, tu peux importer un fichier de taux ou saisir manuellement</li>
              <li>• Les estimations seront marquées "faible confiance"</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Ajoute des transactions à l'étape précédente pour voir les valorisations ici.
        </p>
      </div>
    </div>
  );
};
