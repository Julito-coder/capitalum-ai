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
import { loadUserProfile, formatCurrency } from '@/lib/dashboardService';

interface URSSAFPayment {
  id: string;
  period: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  type: 'quarterly' | 'monthly';
}

const URSSAFTracking = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const data = await loadUserProfile(user.id);
      setProfile(data);
      setLoading(false);
    };
    loadData();
  }, [user]);

  // Calculate URSSAF rates based on fiscal status
  const getURSSAFRate = () => {
    if (!profile) return 0.22;
    switch (profile.fiscalStatus) {
      case 'micro_bnc': return 0.22;
      case 'micro_bic_services': return 0.22;
      case 'micro_bic_vente': return 0.128;
      default: return 0.22;
    }
  };

  const urssafRate = getURSSAFRate();
  const annualCA = profile?.annualRevenueHt || 0;
  const quarterlyCA = annualCA / 4;
  const estimatedQuarterlyContribution = quarterlyCA * urssafRate;

  // Mock payment schedule
  const payments: URSSAFPayment[] = [
    { id: '1', period: 'T1 2025', dueDate: '2025-04-30', amount: estimatedQuarterlyContribution, status: 'paid', type: 'quarterly' },
    { id: '2', period: 'T2 2025', dueDate: '2025-07-31', amount: estimatedQuarterlyContribution, status: 'pending', type: 'quarterly' },
    { id: '3', period: 'T3 2025', dueDate: '2025-10-31', amount: estimatedQuarterlyContribution, status: 'pending', type: 'quarterly' },
    { id: '4', period: 'T4 2025', dueDate: '2026-01-31', amount: estimatedQuarterlyContribution, status: 'pending', type: 'quarterly' },
  ];

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0);
  const yearlyTotal = annualCA * urssafRate;
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Suivi URSSAF</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos cotisations sociales et anticipez vos échéances
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
                  <p className="text-sm text-muted-foreground">CA annuel</p>
                  <p className="text-xl font-bold">{formatCurrency(annualCA)}</p>
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
                  <p className="text-xl font-bold text-warning">{formatCurrency(totalPending)}</p>
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
            <Progress value={progressPercent} className="h-3" />
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map((payment) => (
                <div 
                  key={payment.id}
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
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              ))}
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
                  <li>• Provisionnez 22-25% de votre CA pour les cotisations</li>
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
