import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Euro,
  FileText,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  loadProProfile, 
  loadMonthlyRevenue, 
  calculateAnnualTotals,
  getURSSAFRate,
  ProProfile
} from '@/lib/proService';
import {
  loadURSSAFContributions,
  buildQuarterlyData,
  toggleContributionPaid,
  syncContributionsFromRevenue,
  QuarterData
} from '@/lib/urssafService';
import { formatCurrency } from '@/lib/dashboardService';
import { QuarterlyBreakdown } from '@/components/urssaf/QuarterlyBreakdown';
import { ContributionSimulator } from '@/components/urssaf/ContributionSimulator';
import { toast } from 'sonner';

const URSSAFTracking = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [quarters, setQuarters] = useState<QuarterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  
  const year = 2025;

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    const [proProfile, monthlyData, contributions] = await Promise.all([
      loadProProfile(user.id),
      loadMonthlyRevenue(user.id, year),
      loadURSSAFContributions(user.id, year)
    ]);
    
    setProfile(proProfile);
    
    const urssafRate = getURSSAFRate(proProfile?.fiscalStatus || 'micro');
    const quarterData = buildQuarterlyData(monthlyData, contributions, year, urssafRate);
    setQuarters(quarterData);
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleTogglePaid = async (month: number, isPaid: boolean) => {
    if (!user) return;
    
    const result = await toggleContributionPaid(user.id, year, month, isPaid);
    if (result.success) {
      toast.success(isPaid ? 'Cotisation marquée comme payée' : 'Cotisation marquée comme non payée');
      loadData();
    } else {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleSync = async () => {
    if (!user || !profile) return;
    
    setSyncing(true);
    const result = await syncContributionsFromRevenue(user.id, year, profile.fiscalStatus);
    if (result.success) {
      toast.success('Cotisations synchronisées avec le CA déclaré');
      await loadData();
    } else {
      toast.error('Erreur lors de la synchronisation');
    }
    setSyncing(false);
  };

  const urssafRate = getURSSAFRate(profile?.fiscalStatus || 'micro');
  
  // Calculate totals from quarters
  const totalRevenue = quarters.reduce((sum, q) => sum + q.totalRevenue, 0);
  const totalContributions = quarters.reduce((sum, q) => sum + q.totalContribution, 0);
  const paidContributions = quarters.reduce((sum, q) => 
    sum + q.months.filter(m => m.isPaid).reduce((s, m) => s + m.contribution, 0), 0
  );
  const pendingContributions = totalContributions - paidContributions;
  const progressPercent = totalContributions > 0 ? (paidContributions / totalContributions) * 100 : 0;

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
              Gérez vos cotisations sociales mois par mois
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="btn-secondary"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Synchroniser avec CA
            </button>
            <button 
              onClick={() => setShowSimulator(true)}
              className="btn-primary"
            >
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
                  <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
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
                  <p className="text-xl font-bold text-success">{formatCurrency(paidContributions)}</p>
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
                  <p className="text-xl font-bold text-warning">{formatCurrency(pendingContributions)}</p>
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
            <CardTitle>Progression annuelle {year}</CardTitle>
            <CardDescription>
              {formatCurrency(paidContributions)} payés sur {formatCurrency(totalContributions)} estimés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={Math.min(progressPercent, 100)} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {progressPercent.toFixed(0)}% des cotisations annuelles réglées
            </p>
          </CardContent>
        </Card>

        {/* Quarterly Breakdown */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Détail par trimestre
          </h2>
          <QuarterlyBreakdown
            quarters={quarters}
            onTogglePaid={handleTogglePaid}
            loading={loading}
          />
        </div>

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
                  <li>• Vérifiez votre éligibilité à l'ACRE (réduction de 50% la première année)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simulator Modal */}
      <ContributionSimulator
        open={showSimulator}
        onOpenChange={setShowSimulator}
        initialRevenue={totalRevenue || 50000}
        initialStatus={profile?.fiscalStatus || 'micro'}
      />
    </Layout>
  );
};

export default URSSAFTracking;
