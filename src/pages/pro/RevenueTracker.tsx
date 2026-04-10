import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown,
  Euro,
  Calendar,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Save,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  loadMonthlyRevenue, 
  saveMonthlyRevenue, 
  loadProProfile,
  calculateAnnualTotals,
  MonthlyRevenue,
  ProProfile 
} from '@/lib/proService';
import { formatCurrency } from '@/lib/dashboardService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Line, ComposedChart } from 'recharts';

const MICRO_THRESHOLD = 77700;
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const RevenueTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editValue, setEditValue] = useState({ revenue: 0, expenses: 0 });
  const [saving, setSaving] = useState(false);
  const [selectedYear] = useState(2025);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      const [proProfile, revenueData] = await Promise.all([
        loadProProfile(user.id),
        loadMonthlyRevenue(user.id, selectedYear)
      ]);
      
      setProfile(proProfile);
      setMonthlyData(revenueData);
      setLoading(false);
    };
    loadData();
  }, [user, selectedYear]);

  const handleEdit = (month: number) => {
    const existing = monthlyData.find(m => m.month === month);
    setEditValue({
      revenue: existing?.revenue || 0,
      expenses: existing?.expenses || 0,
    });
    setEditingMonth(month);
  };

  const handleSave = async (month: number) => {
    if (!user) return;
    
    setSaving(true);
    const result = await saveMonthlyRevenue(user.id, {
      year: selectedYear,
      month,
      revenue: editValue.revenue,
      expenses: editValue.expenses,
    });

    if (result.success) {
      // Update local state
      setMonthlyData(prev => {
        const existing = prev.findIndex(m => m.month === month);
        const newEntry: MonthlyRevenue = {
          id: '',
          userId: user.id,
          year: selectedYear,
          month,
          revenue: editValue.revenue,
          expenses: editValue.expenses,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], ...newEntry };
          return updated;
        }
        return [...prev, newEntry];
      });
      
      toast({
        title: "Enregistré",
        description: `CA de ${MONTHS[month - 1]} mis à jour.`,
      });
    } else {
      toast({
        title: "Erreur",
        description: result.error,
        variant: "destructive",
      });
    }
    
    setEditingMonth(null);
    setSaving(false);
  };

  const handleCancel = () => {
    setEditingMonth(null);
    setEditValue({ revenue: 0, expenses: 0 });
  };

  // Calculate metrics
  const annualTotals = calculateAnnualTotals(monthlyData);
  const currentMonth = new Date().getMonth() + 1;
  const currentMonthData = monthlyData.find(m => m.month === currentMonth);
  const lastMonthData = monthlyData.find(m => m.month === currentMonth - 1);
  
  const monthlyGrowth = lastMonthData && lastMonthData.revenue > 0 
    ? ((currentMonthData?.revenue || 0) - lastMonthData.revenue) / lastMonthData.revenue * 100 
    : 0;

  const thresholdUsage = (annualTotals.totalRevenue / MICRO_THRESHOLD) * 100;
  const remainingCapacity = MICRO_THRESHOLD - annualTotals.totalRevenue;

  // Prepare chart data
  const chartData = MONTHS.map((month, index) => {
    const monthNum = index + 1;
    const data = monthlyData.find(m => m.month === monthNum);
    return {
      month,
      ca: data?.revenue || 0,
      expenses: data?.expenses || 0,
      objectif: profile?.annualRevenueHt ? profile.annualRevenueHt / 12 : 5000,
    };
  });

  const cumulativeData = chartData.map((item, index) => ({
    ...item,
    cumul: chartData.slice(0, index + 1).reduce((sum, d) => sum + d.ca, 0),
    objectifCumul: (index + 1) * (profile?.annualRevenueHt ? profile.annualRevenueHt / 12 : 5000),
  }));

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Suivi du chiffre d'affaires</h1>
            <p className="text-muted-foreground mt-1">
              Saisissez ton CA mensuel pour un suivi précis
            </p>
          </div>
          <select className="btn-secondary px-4 py-2 w-fit">
            <option>2025</option>
            <option>2024</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">CA réalisé</p>
                  <p className="text-2xl font-bold">{formatCurrency(annualTotals.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {annualTotals.monthsWithData} mois renseignés
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
                  <p className="text-2xl font-bold">{formatCurrency(currentMonthData?.revenue || 0)}</p>
                  {monthlyGrowth !== 0 && (
                    <div className={`flex items-center gap-1 text-xs mt-1 ${monthlyGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {monthlyGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(monthlyGrowth).toFixed(1)}% vs mois dernier
                    </div>
                  )}
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
                  <p className="text-sm text-muted-foreground">Moyenne mensuelle</p>
                  <p className="text-2xl font-bold">{formatCurrency(annualTotals.averageMonthlyRevenue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Projection : {formatCurrency(annualTotals.projectedAnnual)}
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

        {/* Monthly Input Grid */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Saisie mensuelle {selectedYear}
            </CardTitle>
            <CardDescription>
              Clique sur un mois pour saisir ou modifier ton CA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {MONTHS.map((month, index) => {
                const monthNum = index + 1;
                const data = monthlyData.find(m => m.month === monthNum);
                const isEditing = editingMonth === monthNum;
                const isPast = monthNum <= currentMonth;
                
                return (
                  <div 
                    key={month}
                    className={`p-4 rounded-xl transition-all ${
                      isEditing 
                        ? 'bg-primary/10 border-2 border-primary' 
                        : data?.revenue 
                          ? 'bg-success/10 border border-success/30 cursor-pointer hover:border-success/50'
                          : isPast
                            ? 'bg-warning/10 border border-warning/30 cursor-pointer hover:border-warning/50'
                            : 'bg-secondary/50 border border-transparent cursor-pointer hover:border-border'
                    }`}
                    onClick={() => !isEditing && handleEdit(monthNum)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{month}</span>
                      {data?.revenue ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : isPast ? (
                        <Edit2 className="h-4 w-4 text-warning" />
                      ) : null}
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-muted-foreground">CA</label>
                          <Input
                            type="number"
                            value={editValue.revenue || ''}
                            onChange={(e) => setEditValue(prev => ({ ...prev, revenue: Number(e.target.value) }))}
                            className="h-8 text-sm"
                            placeholder="0"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Dépenses</label>
                          <Input
                            type="number"
                            value={editValue.expenses || ''}
                            onChange={(e) => setEditValue(prev => ({ ...prev, expenses: Number(e.target.value) }))}
                            className="h-8 text-sm"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1 h-7" 
                            onClick={() => handleSave(monthNum)}
                            disabled={saving}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7"
                            onClick={handleCancel}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className={`text-lg font-bold ${data?.revenue ? 'text-success' : 'text-muted-foreground'}`}>
                          {data?.revenue ? formatCurrency(data.revenue) : '—'}
                        </p>
                        {data?.expenses ? (
                          <p className="text-xs text-destructive">
                            -{formatCurrency(data.expenses)}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>CA mensuel</CardTitle>
              <CardDescription>Évolution de ton chiffre d'affaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
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
                    <Bar dataKey="ca" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="CA" />
                    <Line type="monotone" dataKey="objectif" stroke="hsl(var(--warning))" strokeDasharray="5 5" name="Objectif" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>CA cumulé</CardTitle>
              <CardDescription>Progression vers le seuil micro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeData}>
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
                    <Area type="monotone" dataKey="cumul" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" name="Cumulé" />
                    <Line type="monotone" dataKey="objectifCumul" stroke="hsl(var(--warning))" strokeDasharray="5 5" name="Objectif" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Threshold */}
        <Card className={`glass-card ${thresholdUsage > 80 ? 'border-warning/50' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Seuil micro-entrepreneur 2025
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={Math.min(thresholdUsage, 100)} className="h-4" />
            <div className="flex justify-between text-sm">
              <span>CA réalisé : {formatCurrency(annualTotals.totalRevenue)}</span>
              <span className={remainingCapacity > 0 ? 'text-success' : 'text-destructive'}>
                {remainingCapacity > 0 
                  ? `Marge : ${formatCurrency(remainingCapacity)}`
                  : `Dépassement : ${formatCurrency(Math.abs(remainingCapacity))}`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RevenueTracker;
