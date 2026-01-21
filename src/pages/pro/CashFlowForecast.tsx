import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  Euro,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { loadUserProfile, formatCurrency } from '@/lib/dashboardService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

interface MonthlyForecast {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  cumulative: number;
}

const CashFlowForecast = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [monthlyIncome, setMonthlyIncome] = useState(6000);
  const [fixedExpenses, setFixedExpenses] = useState(2000);
  const [urssafRate, setUrssafRate] = useState(22);
  const [currentBalance, setCurrentBalance] = useState(15000);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const data = await loadUserProfile(user.id);
      if (data) {
        setProfile(data);
        setMonthlyIncome(data.annualRevenueHt / 12 || 6000);
      }
    };
    loadData();
  }, [user]);

  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  
  // Seasonality factors (freelance typical pattern)
  const seasonality = [0.9, 0.95, 1.1, 1.0, 1.15, 1.1, 0.7, 0.5, 1.0, 1.1, 1.2, 0.9];
  
  // URSSAF quarterly payments (months 4, 7, 10, 1)
  const urssafMonths = [3, 6, 9, 0]; // April, July, October, January
  
  // Generate 12-month forecast
  const generateForecast = (): MonthlyForecast[] => {
    const currentMonth = new Date().getMonth();
    let cumulative = currentBalance;
    
    return months.map((month, index) => {
      const adjustedIndex = (currentMonth + index) % 12;
      const income = monthlyIncome * seasonality[adjustedIndex];
      
      // Calculate expenses
      let expenses = fixedExpenses;
      
      // Add quarterly URSSAF payment
      if (urssafMonths.includes(adjustedIndex)) {
        const quarterlyCA = monthlyIncome * 3;
        expenses += quarterlyCA * (urssafRate / 100);
      }
      
      const balance = income - expenses;
      cumulative += balance;
      
      return {
        month: months[adjustedIndex],
        income: Math.round(income),
        expenses: Math.round(expenses),
        balance: Math.round(balance),
        cumulative: Math.round(cumulative)
      };
    });
  };

  const forecast = generateForecast();
  const lowestPoint = Math.min(...forecast.map(f => f.cumulative));
  const highestPoint = Math.max(...forecast.map(f => f.cumulative));
  const negativeMonths = forecast.filter(f => f.cumulative < 0);
  const totalIncome = forecast.reduce((sum, f) => sum + f.income, 0);
  const totalExpenses = forecast.reduce((sum, f) => sum + f.expenses, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Prévisions trésorerie</h1>
            <p className="text-muted-foreground mt-1">
              Anticipez vos flux de trésorerie sur 12 mois
            </p>
          </div>
          <Badge className={negativeMonths.length > 0 ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}>
            {negativeMonths.length > 0 
              ? `⚠️ ${negativeMonths.length} mois à risque`
              : '✓ Trésorerie saine'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Input Parameters */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Paramètres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Trésorerie actuelle</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>CA mensuel moyen</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Charges fixes mensuelles</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={fixedExpenses}
                    onChange={(e) => setFixedExpenses(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Taux URSSAF (%)</Label>
                <Input
                  type="number"
                  value={urssafRate}
                  onChange={(e) => setUrssafRate(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Main Chart */}
          <Card className="glass-card lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Projection sur 12 mois
              </CardTitle>
              <CardDescription>
                Évolution de la trésorerie avec saisonnalité et échéances URSSAF
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecast}>
                    <defs>
                      <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${v/1000}k€`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [formatCurrency(value), name === 'cumulative' ? 'Trésorerie' : name]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#colorPositive)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entrées totales</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(totalIncome)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sorties totales</p>
                  <p className="text-xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${lowestPoint < 0 ? 'bg-destructive/10' : 'bg-warning/10'}`}>
                  <AlertTriangle className={`h-5 w-5 ${lowestPoint < 0 ? 'text-destructive' : 'text-warning'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Point bas</p>
                  <p className={`text-xl font-bold ${lowestPoint < 0 ? 'text-destructive' : ''}`}>{formatCurrency(lowestPoint)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Solde final</p>
                  <p className="text-xl font-bold">{formatCurrency(forecast[forecast.length - 1].cumulative)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Details */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Détail mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {forecast.map((month, index) => (
                <div 
                  key={month.month}
                  className={`p-4 rounded-xl transition-all ${
                    month.cumulative < 0 
                      ? 'bg-destructive/10 border border-destructive/30' 
                      : month.balance < 0 
                        ? 'bg-warning/10 border border-warning/30'
                        : 'bg-secondary/50'
                  }`}
                >
                  <p className="font-medium text-sm mb-2">{month.month}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entrées</span>
                      <span className="text-success">+{formatCurrency(month.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sorties</span>
                      <span className="text-destructive">-{formatCurrency(month.expenses)}</span>
                    </div>
                    <div className="h-px bg-border my-1" />
                    <div className="flex justify-between font-medium">
                      <span>Solde</span>
                      <span className={month.cumulative < 0 ? 'text-destructive' : ''}>
                        {formatCurrency(month.cumulative)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Recommendations */}
        {negativeMonths.length > 0 && (
          <Card className="glass-card border-destructive/30">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Attention : trésorerie négative prévue</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Votre trésorerie pourrait devenir négative sur {negativeMonths.length} mois. Voici quelques recommandations :
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Anticipez les paiements URSSAF en provisionnant chaque mois</li>
                    <li>• Réduisez vos charges fixes si possible</li>
                    <li>• Accélérez vos encaissements clients</li>
                    <li>• Envisagez une facilité de caisse auprès de votre banque</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default CashFlowForecast;
