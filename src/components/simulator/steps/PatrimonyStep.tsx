import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Euro, Home, AlertTriangle } from "lucide-react";
import { AdvancedWizardState } from "@/lib/advancedSimulatorTypes";
import { formatCurrency } from "@/data/mockData";

interface PatrimonyStepProps {
  state: AdvancedWizardState;
  updateState: <K extends keyof AdvancedWizardState>(
    section: K,
    updates: Partial<AdvancedWizardState[K]>
  ) => void;
  mode: 'essential' | 'advanced';
  totalProjectCost?: number;
  loanAmount?: number;
}

export function PatrimonyStep({ state, updateState, totalProjectCost = 0, loanAmount = 0 }: PatrimonyStepProps) {
  const resaleYear = state.saleData.resaleYear || 20;
  const growthRate = state.ownerOccupier.valueGrowthRate || 2;
  const prudentRate = state.ownerOccupier.prudentGrowthRate || 1;
  const optimistRate = state.ownerOccupier.optimistGrowthRate || 3;
  
  // Prix d'achat estimé
  const purchasePrice = state.acquisition.priceNetSeller || totalProjectCost;
  
  // Calcul de la valeur future selon différents scénarios
  const calculateFutureValue = (rate: number, years: number) => {
    return purchasePrice * Math.pow(1 + rate / 100, years);
  };
  
  const futureValueBase = calculateFutureValue(growthRate, resaleYear);
  const futureValuePrudent = calculateFutureValue(prudentRate, resaleYear);
  const futureValueOptimist = calculateFutureValue(optimistRate, resaleYear);
  
  // Estimation de la dette restante (approximation simplifiée)
  const monthlyRate = (state.financing.nominalRate || 3.5) / 100 / 12;
  const totalMonths = state.financing.durationMonths || 240;
  const resaleMonths = resaleYear * 12;
  const remainingMonths = Math.max(0, totalMonths - resaleMonths);
  
  // Formule CRD simplifiée
  const crd = remainingMonths > 0 && monthlyRate > 0
    ? loanAmount * (Math.pow(1 + monthlyRate, totalMonths) - Math.pow(1 + monthlyRate, resaleMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    : 0;
  
  // Équité nette
  const netEquityBase = futureValueBase - crd;
  const netEquityPrudent = futureValuePrudent - crd;
  const netEquityOptimist = futureValueOptimist - crd;

  const getScenarioLabel = (scenario: string) => {
    switch (scenario) {
      case 'prudent': return 'Prudent';
      case 'base': return 'Base';
      case 'optimist': return 'Optimiste';
      default: return scenario;
    }
  };

  return (
    <div className="space-y-6">
      {/* Scénario de valorisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Valorisation du patrimoine
          </CardTitle>
          <CardDescription>
            Hypothèses de croissance de la valeur immobilière
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Scénario principal</Label>
            <Select
              value={state.ownerOccupier.scenarioType}
              onValueChange={(v) =>
                updateState("ownerOccupier", {
                  scenarioType: v as 'prudent' | 'base' | 'optimist',
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prudent">Prudent (+{prudentRate}%/an)</SelectItem>
                <SelectItem value="base">Base (+{growthRate}%/an)</SelectItem>
                <SelectItem value="optimist">Optimiste (+{optimistRate}%/an)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Taux prudent (%/an)</Label>
              <Input
                type="number"
                step="0.5"
                value={prudentRate}
                onChange={(e) =>
                  updateState("ownerOccupier", {
                    prudentGrowthRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Taux base (%/an)</Label>
              <Input
                type="number"
                step="0.5"
                value={growthRate}
                onChange={(e) =>
                  updateState("ownerOccupier", {
                    valueGrowthRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Taux optimiste (%/an)</Label>
              <Input
                type="number"
                step="0.5"
                value={optimistRate}
                onChange={(e) =>
                  updateState("ownerOccupier", {
                    optimistGrowthRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horizon de revente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Horizon de revente
          </CardTitle>
          <CardDescription>
            Durée de détention envisagée pour l'analyse patrimoniale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label>Durée de détention</Label>
              <Badge variant="outline">{resaleYear} ans</Badge>
            </div>
            <Slider
              value={[resaleYear]}
              min={1}
              max={30}
              step={1}
              onValueChange={([v]) =>
                updateState("saleData", { resaleYear: v })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Frais de revente (%)</Label>
              <Input
                type="number"
                step="0.5"
                value={state.saleData.resaleAgencyPct || 5}
                onChange={(e) =>
                  updateState("saleData", {
                    resaleAgencyPct: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Autres frais de sortie (€)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={state.saleData.resaleOtherFees || 0}
                  onChange={(e) =>
                    updateState("saleData", {
                      resaleOtherFees: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loyer évité */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Loyer évité</CardTitle>
          <CardDescription>
            Estimation du loyer que vous auriez payé en location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Loyer mensuel évité (€)</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={state.ownerOccupier.avoidedRentMonthly || ""}
                onChange={(e) =>
                  updateState("ownerOccupier", {
                    avoidedRentMonthly: parseFloat(e.target.value) || 0,
                  })
                }
                className="pl-9"
                placeholder="1200"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Utilisé pour calculer l'économie réalisée par rapport à la location
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Projection patrimoniale */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Projection patrimoniale à {resaleYear} ans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-background rounded-lg border border-warning/30">
                <p className="text-xs text-muted-foreground mb-1">Scénario Prudent</p>
                <p className="text-sm font-medium">{formatCurrency(futureValuePrudent)}</p>
                <p className="text-xs text-success mt-1">
                  Équité: {formatCurrency(netEquityPrudent)}
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-primary/30">
                <p className="text-xs text-muted-foreground mb-1">Scénario Base</p>
                <p className="text-lg font-bold">{formatCurrency(futureValueBase)}</p>
                <p className="text-sm text-success mt-1">
                  Équité: {formatCurrency(netEquityBase)}
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-success/30">
                <p className="text-xs text-muted-foreground mb-1">Scénario Optimiste</p>
                <p className="text-sm font-medium">{formatCurrency(futureValueOptimist)}</p>
                <p className="text-xs text-success mt-1">
                  Équité: {formatCurrency(netEquityOptimist)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Note importante</p>
                <p>
                  Ces projections sont indicatives et basées sur les hypothèses de croissance définies. 
                  La valeur réelle dépendra des conditions du marché immobilier.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PatrimonyStep;
