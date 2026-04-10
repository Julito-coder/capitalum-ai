import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Users, 
  Euro,
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Briefcase
} from 'lucide-react';
import { formatCurrency } from '@/lib/dashboardService';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HiringSimulator = () => {
  const [grossSalary, setGrossSalary] = useState(2500);
  const [contractType, setContractType] = useState('cdi');
  const [workTime, setWorkTime] = useState(100);
  const [executiveStatus, setExecutiveStatus] = useState(false);

  // Calculate costs
  const adjustedGross = grossSalary * (workTime / 100);
  
  // Employer charges (average rates)
  const employerChargesRate = executiveStatus ? 0.45 : 0.42;
  const employerCharges = adjustedGross * employerChargesRate;
  const totalCost = adjustedGross + employerCharges;
  
  // Employee charges (for net salary estimation)
  const employeeChargesRate = executiveStatus ? 0.25 : 0.22;
  const netSalary = adjustedGross * (1 - employeeChargesRate);

  // Annual costs
  const annualGross = adjustedGross * 12;
  const annualEmployerCharges = employerCharges * 12;
  const annualTotalCost = totalCost * 12;
  const annualNetSalary = netSalary * 12;

  // Aide embauche estimations
  const aides = {
    apprenti: contractType === 'apprentissage' ? 6000 : 0,
    jeune: grossSalary <= 1800 ? 4000 : 0,
    zoneRurale: 0, // Can be enabled
  };
  const totalAides = Object.values(aides).reduce((sum, v) => sum + v, 0);
  const netCostAfterAides = annualTotalCost - totalAides;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold">Simulateur d'embauche</h1>
            <p className="text-muted-foreground mt-1">
              Calculez le coût réel d'une embauche avec les aides disponibles
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <Card className="glass-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Paramètres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Type de contrat</Label>
                <Select value={contractType} onValueChange={setContractType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cdi">CDI</SelectItem>
                    <SelectItem value="cdd">CDD</SelectItem>
                    <SelectItem value="apprentissage">Apprentissage</SelectItem>
                    <SelectItem value="professionnalisation">Contrat Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Salaire brut mensuel</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
                <Slider
                  value={[grossSalary]}
                  onValueChange={(v) => setGrossSalary(v[0])}
                  min={1800}
                  max={6000}
                  step={100}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground">
                  SMIC 2025 : 1 801,80 € brut
                </p>
              </div>

              <div className="space-y-2">
                <Label>Temps de travail : {workTime}%</Label>
                <Slider
                  value={[workTime]}
                  onValueChange={(v) => setWorkTime(v[0])}
                  min={20}
                  max={100}
                  step={10}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div>
                  <p className="font-medium">Statut cadre</p>
                  <p className="text-xs text-muted-foreground">Charges patronales + élevées</p>
                </div>
                <button
                  onClick={() => setExecutiveStatus(!executiveStatus)}
                  className={`w-12 h-6 rounded-full transition-colors ${executiveStatus ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${executiveStatus ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Breakdown */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Coût mensuel employeur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <p className="text-sm text-muted-foreground">Brut mensuel</p>
                    <p className="text-xl font-bold">{formatCurrency(adjustedGross)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-destructive/10">
                    <p className="text-sm text-muted-foreground">Charges patronales</p>
                    <p className="text-xl font-bold text-destructive">+{formatCurrency(employerCharges)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/10">
                    <p className="text-sm text-muted-foreground">Coût total</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(totalCost)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-success/10">
                    <p className="text-sm text-muted-foreground">Net salarié (≈)</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(netSalary)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Annual Summary */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Récapitulatif annuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span>Salaire brut annuel</span>
                    <span className="font-bold">{formatCurrency(annualGross)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span>Charges patronales annuelles</span>
                    <span className="font-bold text-destructive">+{formatCurrency(annualEmployerCharges)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border text-lg">
                    <span className="font-semibold">Coût total annuel</span>
                    <span className="font-bold text-primary">{formatCurrency(annualTotalCost)}</span>
                  </div>
                  
                  {totalAides > 0 && (
                    <>
                      <div className="flex justify-between items-center py-3 border-b border-border text-success">
                        <span>Aides à l'embauche</span>
                        <span className="font-bold">-{formatCurrency(totalAides)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 text-xl">
                        <span className="font-semibold">Coût net après aides</span>
                        <span className="font-bold text-success">{formatCurrency(netCostAfterAides)}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Aides disponibles */}
            <Card className="glass-card border-success/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Aides à l'embauche éligibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contractType === 'apprentissage' && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-success/10">
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-success" />
                        <div>
                          <p className="font-medium">Aide unique apprentissage</p>
                          <p className="text-sm text-muted-foreground">Pour les entreprises de moins de 250 salariés</p>
                        </div>
                      </div>
                      <span className="font-bold text-success">{formatCurrency(6000)}/an</span>
                    </div>
                  )}
                  
                  {grossSalary <= 1800 && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-success/10">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-success" />
                        <div>
                          <p className="font-medium">Réduction Fillon</p>
                          <p className="text-sm text-muted-foreground">Réduction des cotisations patronales</p>
                        </div>
                      </div>
                      <span className="font-bold text-success">Jusqu'à {formatCurrency(4000)}/an</span>
                    </div>
                  )}

                  {totalAides === 0 && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                      <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Aucune aide spécifique détectée. Consulte un expert pour vérifier votre éligibilité.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HiringSimulator;
