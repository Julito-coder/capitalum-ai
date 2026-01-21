import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Euro,
  Calendar,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { loadUserProfile, formatCurrency } from '@/lib/dashboardService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

const MICRO_THRESHOLD = 77700;

const monthlyData = [
  { month: 'Jan', ca: 6500, objectif: 6000 },
  { month: 'Fév', ca: 5800, objectif: 6000 },
  { month: 'Mar', ca: 7200, objectif: 6000 },
  { month: 'Avr', ca: 6100, objectif: 6000 },
  { month: 'Mai', ca: 8500, objectif: 6000 },
  { month: 'Juin', ca: 7800, objectif: 6000 },
  { month: 'Juil', ca: 4200, objectif: 6000 },
  { month: 'Août', ca: 3100, objectif: 6000 },
  { month: 'Sep', ca: 6900, objectif: 6000 },
  { month: 'Oct', ca: 7500, objectif: 6000 },
  { month: 'Nov', ca: 8200, objectif: 6000 },
  { month: 'Déc', ca: 0, objectif: 6000 },
];

const RevenueTracker = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const data = await loadUserProfile(user.id);
      setProfile(data);
    };
    loadData();
  }, [user]);

  const annualCA = profile?.annualRevenueHt || monthlyData.reduce((sum, m) => sum + m.ca, 0);
  const currentMonthCA = monthlyData[new Date().getMonth()].ca || 0;
  const lastMonthCA = monthlyData[Math.max(0, new Date().getMonth() - 1)].ca || 0;
  const monthlyGrowth = lastMonthCA > 0 ? ((currentMonthCA - lastMonthCA) / lastMonthCA) * 100 : 0;
  
  const thresholdUsage = (annualCA / MICRO_THRESHOLD) * 100;
  const remainingCapacity = MICRO_THRESHOLD - annualCA;
  const averageMonthlyCA = annualCA / 12;
  const projectedAnnual = averageMonthlyCA * 12;

  const yearlyObjectif = 72000;
  const objectifProgress = (annualCA / yearlyObjectif) * 100;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Suivi du chiffre d'affaires</h1>
            <p className="text-muted-foreground mt-1">
              Analysez votre CA mensuel et anticipez vos objectifs
            </p>
          </div>
          <div className="flex gap-3">
            <select className="btn-secondary px-4 py-2">
              <option>2025</option>
              <option>2024</option>
              <option>2023</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">CA annuel</p>
                  <p className="text-2xl font-bold">{formatCurrency(annualCA)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Moyenne : {formatCurrency(averageMonthlyCA)}/mois
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Euro className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ce mois</p>
                  <p className="text-2xl font-bold">{formatCurrency(currentMonthCA)}</p>
                  <div className={`flex items-center gap-1 text-xs mt-1 ${monthlyGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {monthlyGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(monthlyGrowth).toFixed(1)}% vs mois dernier
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Objectif annuel</p>
                  <p className="text-2xl font-bold">{objectifProgress.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(annualCA)} / {formatCurrency(yearlyObjectif)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Seuil micro</p>
                  <p className="text-2xl font-bold">{thresholdUsage.toFixed(0)}%</p>
                  <p className={`text-xs mt-1 ${remainingCapacity > 10000 ? 'text-success' : 'text-warning'}`}>
                    Marge : {formatCurrency(remainingCapacity)}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${thresholdUsage > 90 ? 'bg-destructive/10' : 'bg-muted'}`}>
                  <BarChart3 className={`h-6 w-6 ${thresholdUsage > 90 ? 'text-destructive' : 'text-muted-foreground'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>CA mensuel 2025</CardTitle>
              <CardDescription>Évolution du chiffre d'affaires par mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="ca" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="objectif" stroke="hsl(var(--warning))" strokeDasharray="5 5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Cumulative Revenue */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>CA cumulé</CardTitle>
              <CardDescription>Progression vers l'objectif annuel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData.map((m, i) => ({
                    ...m,
                    cumul: monthlyData.slice(0, i + 1).reduce((sum, d) => sum + d.ca, 0),
                    objectifCumul: (i + 1) * 6000
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area type="monotone" dataKey="cumul" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" />
                    <Line type="monotone" dataKey="objectifCumul" stroke="hsl(var(--warning))" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Threshold Warning */}
        <Card className={`glass-card ${thresholdUsage > 80 ? 'border-warning/50' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Seuil micro-entrepreneur 2025
            </CardTitle>
            <CardDescription>
              Plafond annuel : {formatCurrency(MICRO_THRESHOLD)} pour les prestations de services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={thresholdUsage} className="h-4" />
            <div className="flex justify-between text-sm">
              <span>CA réalisé : {formatCurrency(annualCA)}</span>
              <span className={remainingCapacity > 0 ? 'text-success' : 'text-destructive'}>
                {remainingCapacity > 0 ? `Marge restante : ${formatCurrency(remainingCapacity)}` : `Dépassement : ${formatCurrency(Math.abs(remainingCapacity))}`}
              </span>
            </div>
            {thresholdUsage > 80 && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning">
                  ⚠️ Attention : vous approchez du seuil micro-entrepreneur. Au-delà de {formatCurrency(MICRO_THRESHOLD)}, vous devrez passer au régime réel.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RevenueTracker;
