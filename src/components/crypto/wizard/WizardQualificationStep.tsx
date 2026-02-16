import { Info, CheckCircle2, HelpCircle } from 'lucide-react';

export const WizardQualificationStep = () => {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 4 — Qualification fiscale</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Capitalum classe automatiquement chaque opération. Vérifie et corrige si besoin.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Règles de qualification (France)</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                <span><strong>Taxable :</strong> vente crypto → EUR, achat de bien/service en crypto</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span><strong>Non taxable :</strong> transfert interne, échange crypto → crypto (selon régime), achat crypto</span>
              </li>
              <li className="flex items-start gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                <span><strong>À vérifier :</strong> staking, airdrops, revenus (selon nature et montant)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <HelpCircle className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Les transactions importées apparaîtront ici avec leur qualification.
        </p>
      </div>
    </div>
  );
};
