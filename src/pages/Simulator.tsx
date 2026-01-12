import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { 
  Calculator,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  PiggyBank,
  FileText
} from 'lucide-react';
import { mockUserData, formatCurrency, calculateIR, SEUIL_MICRO_2024 } from '@/data/mockData';

const Simulator = () => {
  const { financials, taxData } = mockUserData;
  
  const [ca, setCa] = useState(financials.ca);
  const [expenses, setExpenses] = useState(financials.expenses);
  const [per, setPer] = useState(0);

  // Calculations
  const baseIR = calculateIR(ca, ca * 0.1); // Abattement 10%
  const optimizedIR = calculateIR(ca, Math.max(expenses, ca * 0.1), per);
  const savings = baseIR - optimizedIR;

  const scenarios = [
    {
      id: 'base',
      title: 'Status quo',
      description: 'Sans optimisation',
      icon: FileText,
      ir: baseIR,
      per: 0,
      expenses: ca * 0.1,
    },
    {
      id: 'optimized',
      title: 'Optimisé',
      description: 'Avec recommandations',
      icon: TrendingUp,
      ir: optimizedIR,
      per: per,
      expenses: expenses,
    },
    {
      id: 'max',
      title: 'Maximum',
      description: 'PER + Frais réels max',
      icon: PiggyBank,
      ir: calculateIR(ca, expenses + 2000, 4000),
      per: 4000,
      expenses: expenses + 2000,
    }
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Simulateur fiscal</h1>
          <p className="text-muted-foreground">Explorez différents scénarios et optimisez votre situation</p>
        </div>

        {/* Input Controls */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Paramètres de simulation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Chiffre d'affaires 2024
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="5000"
                  max="50000"
                  step="500"
                  value={ca}
                  onChange={(e) => setCa(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-2xl font-bold">{formatCurrency(ca)}</span>
                  {ca > SEUIL_MICRO_2024 && (
                    <span className="text-xs text-destructive font-medium px-2 py-1 bg-destructive/10 rounded">
                      Hors seuil micro
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Dépenses réelles
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="15000"
                  step="100"
                  value={expenses}
                  onChange={(e) => setExpenses(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-2xl font-bold">{formatCurrency(expenses)}</span>
                  {expenses > ca * 0.1 && (
                    <span className="text-xs text-success font-medium px-2 py-1 bg-success/10 rounded">
                      &gt; abattement
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Versement PER
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={per}
                  onChange={(e) => setPer(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-2xl font-bold">{formatCurrency(per)}</span>
                  <span className="text-xs text-muted-foreground">
                    Max: {formatCurrency((ca * 0.1) + 1250)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Summary */}
        <div className="glass-card rounded-2xl p-6 mb-8 gradient-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-muted-foreground mb-1">Économies potentielles</p>
              <p className="text-4xl font-bold gradient-text">+{formatCurrency(savings)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                par rapport au status quo
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">IR sans optimisation</p>
                <p className="text-xl font-semibold text-destructive">{formatCurrency(baseIR)}</p>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground self-center" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">IR optimisé</p>
                <p className="text-xl font-semibold text-success">{formatCurrency(optimizedIR)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scenarios Comparison */}
        <h3 className="text-lg font-semibold mb-4">Comparaison des scénarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((scenario, idx) => (
            <div 
              key={scenario.id}
              className={`glass-card rounded-2xl p-6 transition-all ${
                idx === 1 ? 'border-primary/30 glow-sm' : ''
              }`}
            >
              {idx === 1 && (
                <div className="text-xs font-bold text-primary mb-4 uppercase tracking-wide">
                  ✓ Recommandé
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${idx === 1 ? 'bg-primary/10' : 'bg-muted'}`}>
                  <scenario.icon className={`h-5 w-5 ${idx === 1 ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h4 className="font-semibold">{scenario.title}</h4>
                  <p className="text-xs text-muted-foreground">{scenario.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Déduction</span>
                  <span className="font-medium">{formatCurrency(scenario.expenses)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">PER</span>
                  <span className="font-medium">{formatCurrency(scenario.per)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IR estimé</span>
                  <span className={`text-xl font-bold ${idx === 1 ? 'text-success' : ''}`}>
                    {formatCurrency(scenario.ir)}
                  </span>
                </div>
              </div>

              {idx > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">vs Status quo</span>
                  <span className={`flex items-center gap-1 font-semibold ${
                    baseIR - scenario.ir > 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {baseIR - scenario.ir > 0 ? (
                      <ArrowDownRight className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                    {formatCurrency(Math.abs(baseIR - scenario.ir))}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Simulator;
