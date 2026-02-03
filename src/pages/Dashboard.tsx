import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw,
  UserCircle,
  Briefcase,
  Rocket,
  PiggyBank,
  BarChart3,
  Loader2,
  Building,
  Wallet,
  Calendar,
  Target,
  LineChart,
  Sparkles,
  TrendingUp,
  FileText
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

// Dashboard components
import { AnimatedCard } from '@/components/dashboard/AnimatedCard';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const }
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const { isPersonalSpace, isProfessionalSpace } = useSpace();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

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
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* Header */}
        <motion.div 
          variants={headerVariants}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg ${
                isProfessionalSpace 
                  ? 'bg-gradient-to-br from-accent/20 to-accent/10' 
                  : 'bg-gradient-to-br from-primary/20 to-primary/10'
              }`}
            >
              <ProfileIcon className={`h-7 w-7 ${isProfessionalSpace ? 'text-accent' : 'text-primary'}`} />
            </motion.div>
            <div>
              <p className="text-muted-foreground text-sm mb-1">
                Bonjour, {displayName} 👋
              </p>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
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
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(isProfessionalSpace ? '/pro/onboarding' : '/onboarding')}
                className="btn-primary px-4 py-2.5"
              >
                <UserCircle className="h-4 w-4" />
                <span>Compléter mon profil</span>
              </motion.button>
            )}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh} 
              className="btn-secondary px-4 py-2.5"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </motion.button>
            <NotificationsPanel 
              unreadCount={metrics?.alerts.filter(a => a.severity === 'critical').length}
              onCountChange={setUnreadCount}
            />
          </div>
        </motion.div>

        {/* Personal Dashboard */}
        {isPersonalSpace && (
          <div className="space-y-8">
            {/* Section 1: Vue d'ensemble */}
            <DashboardSection
              title="Vue d'ensemble"
              subtitle="Votre situation financière en un coup d'œil"
              icon={Wallet}
              iconColor="text-primary"
              columns={2}
            >
              <AnimatedCard index={0}>
                <CurrentSituationCard profile={profile} hasRealData={!!hasRealData} />
              </AnimatedCard>
              <AnimatedCard index={1}>
                <UpcomingEventsCard alerts={metrics?.alerts || []} profile={profile} />
              </AnimatedCard>
            </DashboardSection>

            {/* Section 2: Actions & Optimisation */}
            <DashboardSection
              title="Actions & Optimisation"
              subtitle="Recommandations personnalisées pour optimiser votre situation"
              icon={Target}
              iconColor="text-success"
              columns={2}
            >
              <AnimatedCard index={2} className="lg:col-span-1">
                <PriorityActionsCard 
                  recommendations={metrics?.recommendations || []} 
                  hasRealData={!!hasRealData} 
                />
              </AnimatedCard>
              <AnimatedCard index={3}>
                <TaxOptimizationCard 
                  profile={profile} 
                  hasRealData={!!hasRealData}
                  potentialSavings={metrics?.potentialSavings || 0}
                />
              </AnimatedCard>
            </DashboardSection>

            {/* Section 3: Projets & Ressources */}
            <DashboardSection
              title="Projets & Ressources"
              subtitle="Vos simulations et outils d'aide à la décision"
              icon={LineChart}
              iconColor="text-info"
              columns={2}
            >
              <AnimatedCard index={4}>
                <ProjectsSimulationsCard />
              </AnimatedCard>
              <AnimatedCard index={5}>
                <GlossaryAICard profile={profile} />
              </AnimatedCard>
            </DashboardSection>
          </div>
        )}

        {/* Professional Dashboard */}
        {isProfessionalSpace && (
          <div className="space-y-8">
            {/* Section 1: Santé Financière */}
            <DashboardSection
              title="Santé Financière"
              subtitle="Vue d'ensemble de votre activité professionnelle"
              icon={TrendingUp}
              iconColor="text-accent"
              columns={2}
            >
              <AnimatedCard index={0} variant="accent">
                <FinancialHealthCard profile={profile} hasRealData={!!hasRealData} />
              </AnimatedCard>
              <AnimatedCard index={1}>
                <ForecastsCard profile={profile} />
              </AnimatedCard>
            </DashboardSection>

            {/* Section 2: Optimisation & Statut */}
            <DashboardSection
              title="Optimisation & Statut"
              subtitle="Analyse de votre structure et recommandations"
              icon={Rocket}
              iconColor="text-success"
              columns={2}
            >
              <AnimatedCard index={2}>
                <ProOptimizationsCard profile={profile} hasRealData={!!hasRealData} />
              </AnimatedCard>
              <AnimatedCard index={3}>
                <StatusStructureCard profile={profile} hasRealData={!!hasRealData} />
              </AnimatedCard>
            </DashboardSection>

            {/* Section 3: Documents */}
            <DashboardSection
              title="Documents & Exports"
              subtitle="Vos documents et exports récents"
              icon={FileText}
              iconColor="text-info"
              columns={1}
            >
              <AnimatedCard index={4}>
                <DocumentsExportsCard />
              </AnimatedCard>
            </DashboardSection>
          </div>
        )}

        {/* Pedagogical footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/30 text-center"
        >
          <p className="text-sm text-muted-foreground">
            <Sparkles className="inline h-4 w-4 mr-1 text-primary" />
            <strong>Capitalum</strong> analyse votre situation pour vous aider à décider sereinement.
            {!hasRealData && (
              <span className="block mt-2">
                <button 
                  onClick={() => navigate(isProfessionalSpace ? '/pro/onboarding' : '/onboarding')}
                  className="text-primary hover:underline font-medium"
                >
                  Complétez votre profil
                </button>
                {' '}pour des recommandations personnalisées.
              </span>
            )}
          </p>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
