import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Wallet, PiggyBank, Percent } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { EnvelopeSimulation, SavingsProfile, PROFILE_LABELS, SAVINGS_CONSTANTS } from '@/lib/savingsTypes';
import { formatEuro, calculateInterestRatio } from '@/lib/savingsCalculations';

interface SimulationResultsProps {
  title: string;
  simulations: Record<SavingsProfile, EnvelopeSimulation>;
  showTaxSavings?: boolean;
}

const PROFILE_COLORS: Record<SavingsProfile, string> = {
  prudent: '#94a3b8',
  equilibre: '#3b82f6',
  dynamique: '#10b981',
};

export function SimulationResults({ title, simulations, showTaxSavings = false }: SimulationResultsProps) {
  // Prepare chart data for the equilibré profile by default
  const chartData = useMemo(() => {
    const equilibreProjections = simulations.equilibre.projections;
    return equilibreProjections.map((proj) => ({
      year: `An ${proj.year}`,
      'Capital versé': proj.totalContributed,
      'Capital total': proj.capitalEnd,
      'Intérêts cumulés': proj.interestCumulated,
    }));
  }, [simulations]);

  // Comparison data for all profiles
  const comparisonData = useMemo(() => {
    const maxYears = simulations.equilibre.projections.length;
    const data = [];
    
    for (let i = 0; i < maxYears; i++) {
      data.push({
        year: `An ${i + 1}`,
        Prudent: simulations.prudent.projections[i]?.capitalEnd ?? 0,
        Équilibré: simulations.equilibre.projections[i]?.capitalEnd ?? 0,
        Dynamique: simulations.dynamique.projections[i]?.capitalEnd ?? 0,
      });
    }
    
    return data;
  }, [simulations]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Simulation {title}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comparaison des trois profils de risque avec les hypothèses de rendement correspondantes.
        </p>
      </div>

      {/* Profile Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {(['prudent', 'equilibre', 'dynamique'] as SavingsProfile[]).map((profile) => {
          const sim = simulations[profile];
          const interestRatio = calculateInterestRatio(sim.totalContributed, sim.interestTotal);
          
          return (
            <Card 
              key={profile} 
              className={`glass-card transition-all ${
                profile === 'equilibre' ? 'border-primary/30 ring-2 ring-primary/20' : ''
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{PROFILE_LABELS[profile]}</CardTitle>
                  <Badge 
                    variant="secondary"
                    style={{ backgroundColor: `${PROFILE_COLORS[profile]}20`, color: PROFILE_COLORS[profile] }}
                  >
                    {SAVINGS_CONSTANTS.RATES[profile]}% / an
                  </Badge>
                </div>
                {profile === 'equilibre' && (
                  <span className="text-xs text-primary font-medium">✓ Recommandé</span>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Total Contributed */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total versé</span>
                  </div>
                  <span className="font-semibold">{formatEuro(sim.totalContributed)}</span>
                </div>

                {/* Capital End */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Capital final</span>
                  </div>
                  <span className="text-xl font-bold text-primary">{formatEuro(sim.capitalEnd)}</span>
                </div>

                {/* Interest Total */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-success" />
                    <span className="text-sm text-muted-foreground">Intérêts gagnés</span>
                  </div>
                  <span className="font-semibold text-success">+{formatEuro(sim.interestTotal)}</span>
                </div>

                {/* Interest Ratio */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Ratio intérêts/versé</span>
                  </div>
                  <span className="text-sm font-medium">{interestRatio}%</span>
                </div>

                {/* Tax Savings for PER */}
                {showTaxSavings && sim.taxSavings && sim.taxSavings > 0 && (
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <span className="text-sm text-muted-foreground">Économie d'impôt</span>
                      <span className="font-semibold text-accent">-{formatEuro(sim.taxSavings)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">Effort net réel</span>
                      <span className="text-sm font-medium">{formatEuro(sim.netEffort ?? sim.totalContributed)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Evolution Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Évolution du capital (profil Équilibré)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 12 }} 
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatEuro(value)}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Capital total"
                  stroke="#3b82f6"
                  fill="url(#colorCapital)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Intérêts cumulés"
                  stroke="#10b981"
                  fill="url(#colorInterest)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Capital versé"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-sm text-muted-foreground italic">
              📈 <strong>Ce qu'il faut retenir :</strong> Au début, les intérêts sont faibles. 
              Avec le temps, ils deviennent le moteur principal de la performance grâce à l'effet des intérêts composés.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Comparaison des 3 profils</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatEuro(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Prudent"
                  stroke={PROFILE_COLORS.prudent}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Équilibré"
                  stroke={PROFILE_COLORS.equilibre}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Dynamique"
                  stroke={PROFILE_COLORS.dynamique}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
