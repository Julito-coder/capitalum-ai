import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, Euro, TrendingUp, PiggyBank } from 'lucide-react';
import { simulateContributions, SimulationResult } from '@/lib/urssafService';
import { formatCurrency } from '@/lib/dashboardService';

interface ContributionSimulatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRevenue?: number;
  initialStatus?: string;
}

export const ContributionSimulator = ({
  open,
  onOpenChange,
  initialRevenue = 50000,
  initialStatus = 'micro',
}: ContributionSimulatorProps) => {
  const [annualRevenue, setAnnualRevenue] = useState(initialRevenue);
  const [fiscalStatus, setFiscalStatus] = useState(initialStatus);

  const result: SimulationResult = simulateContributions(annualRevenue, fiscalStatus);

  const statusOptions = [
    { value: 'micro', label: 'Micro-BNC (Prestations)' },
    { value: 'micro_bnc', label: 'Micro-BNC' },
    { value: 'micro_bic_services', label: 'Micro-BIC Services' },
    { value: 'micro_bic_vente', label: 'Micro-BIC Vente' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulateur de cotisations URSSAF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Revenue input */}
          <div className="space-y-3">
            <Label>Chiffre d'affaires annuel prévu</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={annualRevenue}
                onChange={(e) => setAnnualRevenue(Number(e.target.value))}
                className="pl-10 text-lg font-bold"
              />
            </div>
            <Slider
              value={[annualRevenue]}
              onValueChange={(v) => setAnnualRevenue(v[0])}
              min={10000}
              max={200000}
              step={1000}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10 000 €</span>
              <span>200 000 €</span>
            </div>
          </div>

          {/* Status select */}
          <div className="space-y-2">
            <Label>Statut fiscal</Label>
            <Select value={fiscalStatus} onValueChange={setFiscalStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Résultats de la simulation
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-secondary/30">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Taux URSSAF</p>
                  <p className="text-xl font-bold">{(result.urssafRate * 100).toFixed(1)}%</p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Cotisations annuelles</p>
                  <p className="text-xl font-bold text-destructive">{formatCurrency(result.annualContribution)}</p>
                </CardContent>
              </Card>

              <Card className="bg-warning/10 border-warning/20">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Par trimestre</p>
                  <p className="text-xl font-bold text-warning">{formatCurrency(result.quarterlyContribution)}</p>
                </CardContent>
              </Card>

              <Card className="bg-success/10 border-success/20">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Net après cotisations</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(result.netAfterContributions)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly breakdown */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-primary" />
                    <span className="font-medium">Revenu mensuel net</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(result.monthlyNet)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Après déduction des cotisations URSSAF (hors IR)
                </p>
              </CardContent>
            </Card>

            {/* Tips */}
            <div className="p-4 rounded-xl bg-muted/50 text-sm space-y-2">
              <p className="font-medium">💡 Conseils</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Provisionnez {(result.urssafRate * 100).toFixed(0)}% de chaque encaissement</li>
                <li>• Échéances trimestrielles : 30/04, 31/07, 31/10, 31/01</li>
                <li>• Pensez à l'ACRE si vous êtes éligible (-50% la 1ère année)</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button onClick={() => onOpenChange(false)} className="btn-primary">
              Fermer
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
