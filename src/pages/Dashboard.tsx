import { useEffect, useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Receipt, 
  Landmark,
  RefreshCw,
  Bell,
  UserCircle,
  Briefcase,
  Rocket,
  PiggyBank,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { CalendarPreview } from '@/components/dashboard/CalendarPreview';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { useAuth } from '@/contexts/AuthContext';
import { 
  loadUserProfile, 
  calculateDashboardMetrics, 
  formatCurrency,
  UserProfile,
  DashboardMetrics
} from '@/lib/dashboardService';
import { mockUserData, checkMicroThreshold, SEUIL_MICRO_2024 } from '@/data/mockData';

const MICRO_THRESHOLD = 77700;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        const userProfile = await loadUserProfile(user.id);
        if (userProfile) {
          setProfile(userProfile);
          const calculatedMetrics = calculateDashboardMetrics(userProfile);
          setMetrics(calculatedMetrics);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleRefresh = async () => {
    setLoading(true);
    if (user) {
      const userProfile = await loadUserProfile(user.id);
      if (userProfile) {
        setProfile(userProfile);
        setMetrics(calculateDashboardMetrics(userProfile));
      }
    }
    setLoading(false);
  };

  // Use real data if available, fallback to mock
  const displayName = profile?.fullName || mockUserData.profile.name;
  const hasRealData = profile?.onboardingCompleted;
  
  // Micro status for self-employed
  const microStatus = profile?.isSelfEmployed 
    ? {
        percentageUsed: (profile.annualRevenueHt / MICRO_THRESHOLD) * 100,
        remainingCapacity: MICRO_THRESHOLD - profile.annualRevenueHt,
        riskLevel: profile.annualRevenueHt / MICRO_THRESHOLD > 0.9 ? 'high' : profile.annualRevenueHt / MICRO_THRESHOLD > 0.7 ? 'medium' : 'low'
      }
    : checkMicroThreshold(mockUserData.financials.caProjected);

  // Profile icons
  const getProfileIcon = () => {
    if (profile?.isEmployee) return Briefcase;
    if (profile?.isSelfEmployed) return Rocket;
    if (profile?.isRetired) return PiggyBank;
    if (profile?.isInvestor) return BarChart3;
    return UserCircle;
  };

  const ProfileIcon = getProfileIcon();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ProfileIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm mb-1">Bonjour, {displayName} 👋</p>
            <h1 className="text-2xl lg:text-3xl font-bold">Tableau de bord fiscal</h1>
            {metrics && metrics.profileTypes.length > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {metrics.profileTypes.join(' • ')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!hasRealData && (
            <button 
              onClick={() => navigate('/onboarding')}
              className="btn-primary px-4 py-2.5"
            >
              <UserCircle className="h-4 w-4" />
              <span>Compléter mon profil</span>
            </button>
          )}
          <button onClick={handleRefresh} className="btn-secondary px-4 py-2.5">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button className="relative p-2.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <Bell className="h-5 w-5" />
            {metrics && metrics.alerts.filter(a => a.severity === 'critical').length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-[10px] font-bold rounded-full flex items-center justify-center">
                {metrics.alerts.filter(a => a.severity === 'critical').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <MetricCard
          title={profile?.isSelfEmployed ? "Chiffre d'affaires 2025" : "Revenus annuels"}
          value={formatCurrency(metrics?.totalAnnualIncome || 0)}
          subtitle={hasRealData ? "Basé sur votre profil" : "Complétez votre profil"}
          icon={Wallet}
          status={hasRealData ? 'success' : 'info'}
        />
        <MetricCard
          title="IR estimé"
          value={formatCurrency(metrics?.estimatedTax || 0)}
          subtitle="Avant optimisations"
          icon={Landmark}
          status="info"
        />
        <MetricCard
          title="Dépenses déductibles"
          value={formatCurrency(metrics?.deductibleExpenses || 0)}
          subtitle={profile?.isSelfEmployed ? "Charges pro déclarées" : "Frais et cotisations"}
          icon={Receipt}
        />
        <MetricCard
          title="Économies possibles"
          value={`+${formatCurrency(metrics?.potentialSavings || 0)}`}
          subtitle={`${metrics?.recommendations.length || 0} optimisation(s)`}
          icon={TrendingUp}
          status="success"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column - Alerts & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alerts */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              Alertes actives
            </h2>
            {metrics && metrics.alerts.length > 0 ? (
              <div className="space-y-3">
                {metrics.alerts.map((alert) => (
                  <AlertCard 
                    key={alert.id} 
                    alert={alert} 
                    onAction={() => {
                      if (alert.id === 'complete-profile') navigate('/onboarding');
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-6 text-center">
                <p className="text-muted-foreground">Aucune alerte active 🎉</p>
              </div>
            )}
          </section>

          {/* Recommendations */}
          <section>
            <h2 className="text-lg font-semibold mb-4">💡 Recommandations personnalisées</h2>
            {metrics && metrics.recommendations.length > 0 ? (
              <div className="space-y-4">
                {metrics.recommendations.map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-6 text-center">
                <p className="text-muted-foreground">
                  {hasRealData 
                    ? "Votre situation est déjà optimisée ! 🏆" 
                    : "Complétez votre profil pour des recommandations personnalisées."}
                </p>
                {!hasRealData && (
                  <button 
                    onClick={() => navigate('/onboarding')}
                    className="btn-primary mt-4"
                  >
                    Compléter mon profil
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Status & Calendar */}
        <div className="space-y-6">
          {/* Micro Status - Only for self-employed */}
          {(profile?.isSelfEmployed || !hasRealData) && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-6">
                {profile?.isSelfEmployed ? "Statut micro-entrepreneur" : "Seuil micro-entreprise"}
              </h3>
              <div className="flex flex-col items-center">
                <ProgressRing 
                  progress={microStatus.percentageUsed} 
                  status={microStatus.riskLevel === 'high' ? 'warning' : microStatus.riskLevel === 'medium' ? 'warning' : 'success'}
                />
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(profile?.annualRevenueHt || mockUserData.financials.caProjected)} / {formatCurrency(MICRO_THRESHOLD)}
                  </p>
                  {microStatus.remainingCapacity > 0 ? (
                    <p className="text-sm mt-1">
                      <span className="text-success font-medium">
                        {formatCurrency(Math.abs(microStatus.remainingCapacity))}
                      </span> de marge
                    </p>
                  ) : (
                    <p className="text-sm mt-1">
                      <span className="text-destructive font-medium">
                        Dépassement de {formatCurrency(Math.abs(microStatus.remainingCapacity))}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profile Summary for other types */}
          {hasRealData && !profile?.isSelfEmployed && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Résumé du profil</h3>
              <div className="space-y-3">
                {profile?.isEmployee && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Salaire mensuel brut</span>
                    <span className="font-medium">{formatCurrency(profile.grossMonthlySalary)}</span>
                  </div>
                )}
                {profile?.isRetired && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Pension annuelle</span>
                    <span className="font-medium">{formatCurrency(profile.mainPensionAnnual)}</span>
                  </div>
                )}
                {profile?.isInvestor && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">PEA</span>
                      <span className="font-medium">{formatCurrency(profile.peaBalance)}</span>
                    </div>
                    {profile.lifeInsuranceBalance > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Assurance-vie</span>
                        <span className="font-medium">{formatCurrency(profile.lifeInsuranceBalance)}</span>
                      </div>
                    )}
                  </>
                )}
                {profile?.childrenCount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Enfants à charge</span>
                    <span className="font-medium">{profile.childrenCount}</span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => navigate('/onboarding')}
                className="w-full btn-secondary text-sm py-2 mt-4"
              >
                Modifier mon profil
              </button>
            </div>
          )}

          {/* URSSAF Summary - Only for self-employed */}
          {profile?.isSelfEmployed && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Cotisations sociales</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Charges payées</span>
                  <span className="font-semibold">{formatCurrency(profile.socialChargesPaid)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Charges pro totales</span>
                  <span className="font-semibold">
                    {formatCurrency(profile.officeRent + profile.vehicleExpenses + profile.professionalSupplies)}
                  </span>
                </div>
                <div className="h-px bg-border" />
                <button className="w-full btn-secondary text-sm py-2">
                  Simuler mes cotisations
                </button>
              </div>
            </div>
          )}

          {/* Calendar Preview */}
          <CalendarPreview tasks={mockUserData.calendar} />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
