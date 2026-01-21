import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Euro,
  FileText,
  Calculator
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  loadProProfile, 
  loadMonthlyRevenue, 
  calculateAnnualTotals,
  getURSSAFRate,
  getURSSAFSchedule,
  ProProfile
} from '@/lib/proService';
import { formatCurrency } from '@/lib/dashboardService';

const URSSAFTracking = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [annualRevenue, setAnnualRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      const [proProfile, monthlyData] = await Promise.all([
        loadProProfile(user.id),
        loadMonthlyRevenue(user.id, 2025)
      ]);
      
      setProfile(proProfile);
      
      // Use monthly data if available, otherwise use profile estimate
      const totals = calculateAnnualTotals(monthlyData);
      setAnnualRevenue(totals.totalRevenue > 0 ? totals.totalRevenue : (proProfile?.annualRevenueHt || 0));
      
      setLoading(false);
    };
    loadData();
  }, [user]);

  const urssafRate = getURSSAFRate(profile?.fiscalStatus || 'micro');
  const payments = getURSSAFSchedule(annualRevenue, urssafRate);
  
  const totalPaid = profile?.socialChargesPaid || 0;
  const yearlyTotal = annualRevenue * urssafRate;
  const totalPending = yearlyTotal - totalPaid;
  const progressPercent = yearlyTotal > 0 ? (totalPaid / yearlyTotal) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success/20 text-success border-success/30">Payé</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-warning/30">À venir</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">En retard</Badge>;
      default:
        return null;
    }
  };

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
            <h1 className="text-2xl lg:text-3xl font-bold">Suivi URSSAF</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos cotisations sociales basées sur votre CA réel
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary">
              <FileText className="h-4 w-4" />
              Exporter PDF
            </button>
            <button className="btn-primary">
              <Calculator className="h-4 w-4" />
              Simuler cotisations
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Euro className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CA déclaré</p>
                  <p className="text-xl font-bold">{formatCurrency(annualRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Déjà payé</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reste à payer</p>
                  <p className="text-xl font-bold text-warning">{formatCurrency(Math.max(0, totalPending))}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taux appliqué</p>
                  <p className="text-xl font-bold">{(urssafRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Progression annuelle</CardTitle>
            <CardDescription>
              {formatCurrency(totalPaid)} payés sur {formatCurrency(yearlyTotal)} estimés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={Math.min(progressPercent, 100)} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {progressPercent.toFixed(0)}% des cotisations annuelles réglées
            </p>
          </CardContent>
        </Card>

        {/* Payment Schedule */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Échéancier des cotisations
            </CardTitle>
            <CardDescription>
              Basé sur votre CA de {formatCurrency(annualRevenue)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map((payment, index) => {
                // Mark first payment as paid if user has paid something
                const status = index === 0 && totalPaid > 0 ? 'paid' : payment.status;
                
                return (
                  <div 
                    key={payment.period}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">{payment.period}</span>
                      </div>
                      <div>
                        <p className="font-medium">Cotisations {payment.period}</p>
                        <p className="text-sm text-muted-foreground">
                          Échéance : {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg">{formatCurrency(payment.amount)}</span>
                      {getStatusBadge(status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="glass-card border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Conseils URSSAF</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Provisionnez {(urssafRate * 100).toFixed(0)}% de votre CA pour les cotisations</li>
                  <li>• Optez pour le prélèvement mensuel pour lisser la trésorerie</li>
                  <li>• Déclarez à temps pour éviter les pénalités (10% de majoration)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default URSSAFTracking;
