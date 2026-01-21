import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Scale, 
  Euro,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Star,
  Building2,
  Briefcase,
  Rocket
} from 'lucide-react';
import { formatCurrency } from '@/lib/dashboardService';

interface StatusAnalysis {
  name: string;
  icon: typeof Building2;
  charges: number;
  ir: number;
  netAfterTax: number;
  chargesRate: number;
  irRate: number;
  pros: string[];
  cons: string[];
  recommended?: boolean;
}

const StatusComparator = () => {
  const [annualRevenue, setAnnualRevenue] = useState(50000);
  const [businessExpenses, setBusinessExpenses] = useState(10000);

  const MICRO_THRESHOLD = 77700;
  const isMicroEligible = annualRevenue <= MICRO_THRESHOLD;

  // Calculate for each status
  const calculateMicroBNC = (): StatusAnalysis => {
    const abattement = annualRevenue * 0.34;
    const taxableIncome = annualRevenue - abattement;
    const charges = annualRevenue * 0.22;
    
    let ir = 0;
    if (taxableIncome > 11294) ir += (Math.min(taxableIncome, 28797) - 11294) * 0.11;
    if (taxableIncome > 28797) ir += (Math.min(taxableIncome, 82341) - 28797) * 0.30;
    if (taxableIncome > 82341) ir += (taxableIncome - 82341) * 0.41;

    return {
      name: 'Micro-BNC',
      icon: Rocket,
      charges,
      ir,
      netAfterTax: annualRevenue - charges - ir,
      chargesRate: 22,
      irRate: (ir / annualRevenue) * 100,
      pros: ['Comptabilité simplifiée', 'Franchise de TVA', 'Déclarations trimestrielles'],
      cons: ['Plafond de CA', 'Pas de déduction de charges', 'Abattement forfaitaire'],
      recommended: isMicroEligible && businessExpenses < annualRevenue * 0.34
    };
  };

  const calculateEURL = (): StatusAnalysis => {
    const profit = annualRevenue - businessExpenses;
    const charges = profit * 0.45; // Approximation RSI
    const taxableIncome = profit - charges;
    
    let ir = 0;
    if (taxableIncome > 11294) ir += (Math.min(taxableIncome, 28797) - 11294) * 0.11;
    if (taxableIncome > 28797) ir += (Math.min(taxableIncome, 82341) - 28797) * 0.30;
    if (taxableIncome > 82341) ir += (taxableIncome - 82341) * 0.41;

    return {
      name: 'EURL (IR)',
      icon: Building2,
      charges,
      ir,
      netAfterTax: annualRevenue - businessExpenses - charges - ir,
      chargesRate: (charges / annualRevenue) * 100,
      irRate: (ir / annualRevenue) * 100,
      pros: ['Déduction des charges réelles', 'Pas de plafond de CA', 'Crédibilité'],
      cons: ['Comptabilité obligatoire', 'Cotisations + élevées', 'Formalités'],
      recommended: businessExpenses > annualRevenue * 0.4
    };
  };

  const calculateSASU = (): StatusAnalysis => {
    const profit = annualRevenue - businessExpenses;
    const salary = profit * 0.6; // 60% en salaire
    const dividends = profit * 0.4 * 0.7; // 40% en dividendes après IS
    const salaryCosts = salary * 0.82; // Charges sur salaire
    const is = profit * 0.4 * 0.25; // IS sur part dividendes
    const dividendTax = dividends * 0.30; // Flat tax
    
    const totalCharges = salary - salaryCosts + is;
    const totalTax = dividendTax;

    return {
      name: 'SASU',
      icon: Briefcase,
      charges: totalCharges,
      ir: totalTax,
      netAfterTax: salaryCosts + dividends - dividendTax,
      chargesRate: (totalCharges / annualRevenue) * 100,
      irRate: (totalTax / annualRevenue) * 100,
      pros: ['Protection sociale complète', 'Dividendes possibles', 'Image pro'],
      cons: ['Charges élevées', 'Gestion complexe', 'Coûts fixes'],
      recommended: annualRevenue > 80000 && businessExpenses > 20000
    };
  };

  const calculatePortage = (): StatusAnalysis => {
    const fraisGestion = annualRevenue * 0.10; // 10% frais de gestion
    const available = annualRevenue - fraisGestion;
    const charges = available * 0.50; // ~50% charges totales
    const net = available - charges;
    const ir = net * 0.15; // Estimation IR

    return {
      name: 'Portage salarial',
      icon: Building2,
      charges: fraisGestion + charges,
      ir,
      netAfterTax: net - ir,
      chargesRate: ((fraisGestion + charges) / annualRevenue) * 100,
      irRate: (ir / annualRevenue) * 100,
      pros: ['Aucune gestion', 'Protection chômage', 'CDI possible'],
      cons: ['Frais de gestion', 'Moins de net', 'Dépendance'],
      recommended: false
    };
  };

  const statuses = [
    calculateMicroBNC(),
    calculateEURL(),
    calculateSASU(),
    calculatePortage()
  ].sort((a, b) => b.netAfterTax - a.netAfterTax);

  const bestStatus = statuses[0];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Comparateur de statuts</h1>
            <p className="text-muted-foreground mt-1">
              Analysez le meilleur statut juridique selon votre situation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Input Form */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Vos paramètres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>CA annuel prévu</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={annualRevenue}
                    onChange={(e) => setAnnualRevenue(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
                <Slider
                  value={[annualRevenue]}
                  onValueChange={(v) => setAnnualRevenue(v[0])}
                  min={20000}
                  max={200000}
                  step={5000}
                  className="mt-2"
                />
              </div>

              <div className="space-y-2">
                <Label>Charges estimées</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={businessExpenses}
                    onChange={(e) => setBusinessExpenses(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
                <Slider
                  value={[businessExpenses]}
                  onValueChange={(v) => setBusinessExpenses(v[0])}
                  min={0}
                  max={annualRevenue * 0.6}
                  step={1000}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground">
                  Ratio charges/CA : {((businessExpenses / annualRevenue) * 100).toFixed(0)}%
                </p>
              </div>

              {!isMicroEligible && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm text-warning">
                    ⚠️ CA supérieur au seuil micro ({formatCurrency(MICRO_THRESHOLD)})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {statuses.map((status, index) => (
              <Card 
                key={status.name}
                className={`glass-card transition-all ${
                  index === 0 ? 'border-success/50 ring-2 ring-success/20' : ''
                } ${status.name === 'Micro-BNC' && !isMicroEligible ? 'opacity-50' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        index === 0 ? 'bg-success/10' : 'bg-primary/10'
                      }`}>
                        <status.icon className={`h-5 w-5 ${index === 0 ? 'text-success' : 'text-primary'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{status.name}</CardTitle>
                        {index === 0 && (
                          <Badge className="bg-success/20 text-success border-success/30 mt-1">
                            <Star className="h-3 w-3 mr-1" />
                            Recommandé
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Net after tax */}
                  <div className="p-4 rounded-xl bg-success/10">
                    <p className="text-sm text-muted-foreground">Net après impôts</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(status.netAfterTax)}</p>
                    <p className="text-xs text-muted-foreground">
                      soit {((status.netAfterTax / annualRevenue) * 100).toFixed(0)}% du CA
                    </p>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cotisations</span>
                      <span className="text-destructive">-{formatCurrency(status.charges)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Impôt sur le revenu</span>
                      <span className="text-destructive">-{formatCurrency(status.ir)}</span>
                    </div>
                  </div>

                  {/* Pros & Cons */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    {status.pros.slice(0, 2).map((pro, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{pro}</span>
                      </div>
                    ))}
                    {status.cons.slice(0, 1).map((con, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                        <XCircle className="h-3 w-3" />
                        <span>{con}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Summary */}
        <Card className="glass-card border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Analyse personnalisée</h4>
                <p className="text-muted-foreground">
                  Avec un CA de {formatCurrency(annualRevenue)} et {formatCurrency(businessExpenses)} de charges, 
                  le statut <strong className="text-foreground">{bestStatus.name}</strong> vous permet de conserver 
                  <strong className="text-success"> {formatCurrency(bestStatus.netAfterTax)}</strong> soit 
                  <strong> {((bestStatus.netAfterTax / annualRevenue) * 100).toFixed(0)}%</strong> de votre CA.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Différence avec le moins avantageux : {formatCurrency(bestStatus.netAfterTax - statuses[statuses.length - 1].netAfterTax)}/an
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StatusComparator;
