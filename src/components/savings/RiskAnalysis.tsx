import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  DollarSign,
  Scale,
  Shield,
  Gauge,
  Info
} from 'lucide-react';
import {
  RiskProfile,
  RISK_PROFILES,
  getRiskProfileById,
  getRiskLevelColor,
  getRiskLevelLabel,
  getIndexById,
  FRANCE_AVERAGES,
} from '@/lib/savingsIndicesData';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface RiskAnalysisProps {
  selectedProfileId: string;
  horizon: number;
  monthlyContribution: number;
}

export function RiskAnalysis({ selectedProfileId, horizon, monthlyContribution }: RiskAnalysisProps) {
  const profile = getRiskProfileById(selectedProfileId) ?? RISK_PROFILES[2]; // Default to equilibre

  // Calculate portfolio metrics
  const portfolioMetrics = profile.suggestedAllocation.map(alloc => {
    const index = getIndexById(alloc.indexId);
    return {
      ...alloc,
      index,
    };
  }).filter(a => a.index);

  // Radar chart data
  const radarData = [
    { subject: 'Rendement', value: Math.min(profile.expectedReturn * 10, 100), fullMark: 100 },
    { subject: 'Sécurité', value: 100 - profile.riskTolerance * 12, fullMark: 100 },
    { subject: 'Liquidité', value: selectedProfileId === 'securitaire' ? 95 : selectedProfileId === 'offensif' ? 60 : 75, fullMark: 100 },
    { subject: 'Diversification', value: portfolioMetrics.length * 20, fullMark: 100 },
    { subject: 'Stabilité', value: Math.max(20, 100 - profile.expectedVolatility * 5), fullMark: 100 },
  ];

  // Allocation pie data
  const allocationData = portfolioMetrics.map(a => ({
    name: a.index?.shortName ?? a.indexId,
    value: a.weight,
    color: a.index?.composition[0]?.color ?? '#6b7280',
  }));

  // Risk scenarios
  const scenarios = [
    {
      name: 'Scénario optimiste',
      description: 'Marchés favorables',
      return: profile.expectedReturn + 3,
      probability: 25,
      color: 'text-success',
    },
    {
      name: 'Scénario médian',
      description: 'Performance attendue',
      return: profile.expectedReturn,
      probability: 50,
      color: 'text-primary',
    },
    {
      name: 'Scénario prudent',
      description: 'Marchés difficiles',
      return: Math.max(0, profile.expectedReturn - 3),
      probability: 25,
      color: 'text-warning',
    },
  ];

  // Calculate projected values
  const totalContributed = monthlyContribution * 12 * horizon;
  const projectedValues = scenarios.map(s => ({
    ...s,
    projected: calculateCompoundValue(monthlyContribution, horizon, s.return),
  }));

  // Max drawdown analysis
  const worstYear = Math.min(...portfolioMetrics.map(a => a.index?.maxDrawdown ?? 0));
  const recoveryTime = profile.riskTolerance <= 2 ? '1-2 ans' : profile.riskTolerance <= 4 ? '2-4 ans' : '3-5 ans';

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Analyse des risques</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprenez les risques associés à ton profil {profile.name} et les scénarios possibles.
        </p>
      </div>

      {/* Profile Summary */}
      <Card className="glass-card gradient-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-full"
                style={{ backgroundColor: `${getRiskLevelColor(profile.riskTolerance)}20` }}
              >
                <Gauge className="h-6 w-6" style={{ color: getRiskLevelColor(profile.riskTolerance) }} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Profil {profile.name}</h3>
                <p className="text-sm text-muted-foreground">{profile.description}</p>
              </div>
            </div>
            <Badge 
              style={{ 
                backgroundColor: `${getRiskLevelColor(profile.riskTolerance)}20`,
                color: getRiskLevelColor(profile.riskTolerance)
              }}
            >
              Risque {profile.riskTolerance}/7 - {getRiskLevelLabel(profile.riskTolerance)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Rendement attendu</p>
              <p className="text-xl font-bold text-success">+{profile.expectedReturn}%/an</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Volatilité</p>
              <p className="text-xl font-bold">{profile.expectedVolatility}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Horizon conseillé</p>
              <p className="text-xl font-bold">{profile.horizon}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Supports</p>
              <p className="text-xl font-bold">{portfolioMetrics.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Caractéristiques du profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#1B3A5C"
                    fill="#1B3A5C"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Allocation Pie */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Allocation suggérée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {allocationData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenarios */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Scénarios de projection sur {horizon} ans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {projectedValues.map((scenario, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-lg border ${
                  scenario.name.includes('médian') ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{scenario.name}</span>
                  <Badge variant="outline">{scenario.probability}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Rendement annuel</span>
                    <span className={scenario.color}>+{scenario.return.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Capital projeté</span>
                    <span className="font-bold text-lg">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(scenario.projected)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Dont intérêts</span>
                    <span className="text-success">
                      +{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(scenario.projected - totalContributed)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
            <Info className="h-4 w-4 inline mr-1" />
            Ces scénarios sont des projections indicatives basées sur les hypothèses de rendement. 
            Les résultats réels peuvent différer significativement.
          </div>
        </CardContent>
      </Card>

      {/* Risk Warnings */}
      <Card className="glass-card border-warning/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Points de vigilance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                Perte maximale historique
              </h4>
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-3xl font-bold text-destructive">{worstYear}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sur une année, le portefeuille aurait pu perdre jusqu'à {Math.abs(worstYear)}% de sa valeur.
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Temps de récupération estimé : <strong>{recoveryTime}</strong> après une crise majeure.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Importance de l'horizon
              </h4>
              <div className="space-y-2">
                <div className={`p-3 rounded-lg ${horizon < 5 ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/30'}`}>
                  <p className="text-sm">
                    {horizon < 5 ? (
                      <><AlertTriangle className="h-4 w-4 inline mr-1 text-destructive" />
                      Ton horizon de {horizon} ans est court pour ce profil. Risque de perte en capital.</>
                    ) : horizon < 10 ? (
                      <>Horizon de {horizon} ans : adapté au profil {profile.name}.</>
                    ) : (
                      <><Shield className="h-4 w-4 inline mr-1 text-success" />
                      Ton horizon de {horizon} ans est idéal pour lisser la volatilité.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Risks */}
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <DollarSign className="h-5 w-5 text-muted-foreground mb-2" />
              <h5 className="font-semibold text-sm mb-1">Risque de change</h5>
              <p className="text-xs text-muted-foreground">
                Les indices mondiaux sont exposés au dollar US, ce qui peut amplifier les gains ou pertes.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <TrendingDown className="h-5 w-5 text-muted-foreground mb-2" />
              <h5 className="font-semibold text-sm mb-1">Risque de marché</h5>
              <p className="text-xs text-muted-foreground">
                Les marchés actions peuvent baisser de 30-50% lors de crises majeures.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Clock className="h-5 w-5 text-muted-foreground mb-2" />
              <h5 className="font-semibold text-sm mb-1">Risque de timing</h5>
              <p className="text-xs text-muted-foreground">
                Vendre au mauvais moment peut cristalliser des pertes importantes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* France Averages Comparison */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Comparaison avec les moyennes françaises</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-semibold mb-3">PEA en France (10 ans)</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Performance moyenne</span>
                  <span className="font-bold">+{FRANCE_AVERAGES.pea.average10Y}%/an</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Médiane</span>
                  <span>+{FRANCE_AVERAGES.pea.median10Y}%/an</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-success">Top 25%</span>
                  <span className="text-success">+{FRANCE_AVERAGES.pea.topQuartile10Y}%/an</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-destructive">Bottom 25%</span>
                  <span className="text-destructive">+{FRANCE_AVERAGES.pea.bottomQuartile10Y}%/an</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
              <h4 className="font-semibold mb-3">PER en France (2024)</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Fonds euros moyen</span>
                  <span className="font-bold">+{FRANCE_AVERAGES.per.fondsEuros2024}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Meilleurs fonds euros</span>
                  <span className="text-success">+{FRANCE_AVERAGES.per.bestFondsEuros2024}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Unités de compte (10 ans)</span>
                  <span>+{FRANCE_AVERAGES.per.uniteCompte10Y}%/an</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">
              <Info className="h-4 w-4 inline mr-1" />
              Avec un profil {profile.name} et un rendement attendu de {profile.expectedReturn}%/an, 
              vous te situes {profile.expectedReturn > FRANCE_AVERAGES.pea.median10Y ? 'au-dessus' : 'en dessous'} de 
              la médiane française des PEA.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function
function calculateCompoundValue(monthly: number, years: number, rate: number): number {
  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  
  if (monthlyRate === 0) return monthly * months;
  
  return monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}
