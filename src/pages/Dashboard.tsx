import { useEffect, useState } from 'react';
import { 
  RefreshCw,
  Bell,
  UserCircle,
  Briefcase,
  Rocket,
  PiggyBank,
  BarChart3,
  Loader2,
  Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useSpace } from '@/contexts/SpaceContext';
import { 
  loadUserProfile, 
  calculateDashboardMetrics, 
  formatCurrency,
  UserProfile,
  DashboardMetrics
} from '@/lib/dashboardService';

// Personal dashboard cards
import { CurrentSituationCard } from '@/components/dashboard/personal/CurrentSituationCard';
import { UpcomingEventsCard } from '@/components/dashboard/personal/UpcomingEventsCard';
import { PriorityActionsCard } from '@/components/dashboard/personal/PriorityActionsCard';
import { ProjectsSimulationsCard } from '@/components/dashboard/personal/ProjectsSimulationsCard';
import { TaxOptimizationCard } from '@/components/dashboard/personal/TaxOptimizationCard';
import { GlossaryAICard } from '@/components/dashboard/personal/GlossaryAICard';

// Professional dashboard cards
import { FinancialHealthCard } from '@/components/dashboard/professional/FinancialHealthCard';
import { ForecastsCard } from '@/components/dashboard/professional/ForecastsCard';
import { ProOptimizationsCard } from '@/components/dashboard/professional/ProOptimizationsCard';
import { StatusStructureCard } from '@/components/dashboard/professional/StatusStructureCard';
import { DocumentsExportsCard } from '@/components/dashboard/professional/DocumentsExportsCard';

const Dashboard = () => {
  const { user } = useAuth();
  const { isPersonalSpace, isProfessionalSpace } = useSpace();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
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

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRefresh = () => {
    loadData();
  };

  const displayName = profile?.fullName || 'Utilisateur';
  const hasRealData = profile?.onboardingCompleted;

  const getProfileIcon = () => {
    if (isProfessionalSpace) return Building;
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
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            isProfessionalSpace ? 'bg-accent/10' : 'bg-primary/10'
          }`}>
            <ProfileIcon className={`h-6 w-6 ${isProfessionalSpace ? 'text-accent' : 'text-primary'}`} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm mb-1">
              Bonjour, {displayName} 👋
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold">
              {isProfessionalSpace ? 'Pilotage Pro' : 'Tableau de bord'}
            </h1>
            {metrics && metrics.profileTypes.length > 0 && isPersonalSpace && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {metrics.profileTypes.join(' • ')}
              </p>
            )}
            {isProfessionalSpace && profile?.fiscalStatus && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {profile.fiscalStatus === 'micro' ? 'Micro-entrepreneur' : 
                 profile.fiscalStatus === 'sasu' ? 'SASU' : 
                 profile.fiscalStatus === 'eurl' ? 'EURL' : profile.fiscalStatus}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!hasRealData && (
            <button 
              onClick={() => navigate(isProfessionalSpace ? '/pro/onboarding' : '/onboarding')}
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

      {/* Personal Dashboard */}
      {isPersonalSpace && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Row 1: Situation + Upcoming */}
          <CurrentSituationCard profile={profile} hasRealData={!!hasRealData} />
          <UpcomingEventsCard alerts={metrics?.alerts || []} profile={profile} />
          
          {/* Row 2: Actions (full width on medium) */}
          <div className="lg:col-span-2 xl:col-span-1">
            <PriorityActionsCard 
              recommendations={metrics?.recommendations || []} 
              hasRealData={!!hasRealData} 
            />
          </div>
          
          {/* Row 3: Projects + Optimization */}
          <ProjectsSimulationsCard />
          <TaxOptimizationCard 
            profile={profile} 
            hasRealData={!!hasRealData}
            potentialSavings={metrics?.potentialSavings || 0}
          />
          
          {/* Row 4: Glossary & AI */}
          <GlossaryAICard profile={profile} />
        </div>
      )}

      {/* Professional Dashboard */}
      {isProfessionalSpace && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Row 1: Financial Health + Forecasts */}
          <FinancialHealthCard profile={profile} hasRealData={!!hasRealData} />
          <ForecastsCard profile={profile} />
          
          {/* Row 2: Optimizations */}
          <div className="lg:col-span-2 xl:col-span-1">
            <ProOptimizationsCard profile={profile} hasRealData={!!hasRealData} />
          </div>
          
          {/* Row 3: Status + Documents */}
          <StatusStructureCard profile={profile} hasRealData={!!hasRealData} />
          <DocumentsExportsCard />
        </div>
      )}

      {/* Pedagogical footer */}
      <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border/50 text-center">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Capitalum</strong> analyse votre situation pour vous aider à décider sereinement.
          {!hasRealData && (
            <span className="block mt-1">
              <button 
                onClick={() => navigate(isProfessionalSpace ? '/pro/onboarding' : '/onboarding')}
                className="text-primary hover:underline"
              >
                Complétez votre profil
              </button>
              {' '}pour des recommandations personnalisées.
            </span>
          )}
        </p>
      </div>
    </Layout>
  );
};

export default Dashboard;
