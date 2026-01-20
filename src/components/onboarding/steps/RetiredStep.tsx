import { OnboardingData, ComplementaryPension } from '@/data/onboardingTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, Euro, Gift, Plus, Trash2 } from 'lucide-react';

interface Props {
  data: OnboardingData;
  updateData: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
}

export const RetiredStep = ({ data, updateData }: Props) => {
  const addPension = () => {
    updateData('complementaryPensions', [...data.complementaryPensions, { name: '', annualAmount: 0 }]);
  };

  const removePension = (index: number) => {
    updateData('complementaryPensions', data.complementaryPensions.filter((_, i) => i !== index));
  };

  const updatePension = (index: number, field: keyof ComplementaryPension, value: string | number) => {
    const newPensions = [...data.complementaryPensions];
    newPensions[index] = { ...newPensions[index], [field]: value };
    updateData('complementaryPensions', newPensions);
  };

  return (
    <div className="space-y-6">
      {/* Main Pension */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Pension principale (CNAV)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mainPensionAnnual">Pension brute annuelle (€)</Label>
            <Input
              id="mainPensionAnnual"
              type="number"
              min={0}
              value={data.mainPensionAnnual}
              onChange={(e) => updateData('mainPensionAnnual', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="liquidationDate">Date de liquidation</Label>
            <Input
              id="liquidationDate"
              type="date"
              value={data.liquidationDate}
              onChange={(e) => updateData('liquidationDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Complementary Pensions */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Pensions complémentaires</h3>
          </div>
          <button
            onClick={addPension}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        {data.complementaryPensions.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 border border-dashed rounded-lg text-sm">
            AGIRC-ARRCO, RAFP, complémentaires privées...
          </p>
        ) : (
          <div className="space-y-3">
            {data.complementaryPensions.map((pension, index) => (
              <div key={index} className="flex items-center gap-3">
                <Input
                  placeholder="Nom de la caisse"
                  value={pension.name}
                  onChange={(e) => updatePension(index, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Montant annuel"
                  value={pension.annualAmount}
                  onChange={(e) => updatePension(index, 'annualAmount', parseFloat(e.target.value) || 0)}
                  className="w-40"
                />
                <button
                  onClick={() => removePension(index)}
                  className="p-2 rounded hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Income */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Revenus complémentaires</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supplementaryIncome">Cumul emploi-retraite (€/an)</Label>
            <Input
              id="supplementaryIncome"
              type="number"
              min={0}
              value={data.supplementaryIncome}
              onChange={(e) => updateData('supplementaryIncome', parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">Heures de travail complémentaires</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="capitalGains2025">Plus-values 2025 (€)</Label>
            <Input
              id="capitalGains2025"
              type="number"
              min={0}
              value={data.capitalGains2025}
              onChange={(e) => updateData('capitalGains2025', parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">Cessions immobilières ou mobilières</p>
          </div>
        </div>
      </div>
    </div>
  );
};
