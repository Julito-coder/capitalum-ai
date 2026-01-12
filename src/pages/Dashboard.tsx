import { 
  Wallet, 
  TrendingUp, 
  Receipt, 
  Landmark,
  RefreshCw,
  Bell
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { CalendarPreview } from '@/components/dashboard/CalendarPreview';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { 
  mockUserData, 
  formatCurrency, 
  checkMicroThreshold,
  SEUIL_MICRO_2024 
} from '@/data/mockData';

const Dashboard = () => {
  const { profile, financials, taxData, alerts, recommendations, calendar } = mockUserData;
  const microStatus = checkMicroThreshold(financials.caProjected);
  
  const totalPotentialSavings = 
    taxData.potentialOptimization.realExpenses + 
    taxData.potentialOptimization.per;

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-muted-foreground text-sm mb-1">Bonjour, {profile.name} 👋</p>
          <h1 className="text-2xl lg:text-3xl font-bold">Tableau de bord fiscal</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary px-4 py-2.5">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button className="relative p-2.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-[10px] font-bold rounded-full flex items-center justify-center">
              {alerts.filter(a => a.severity === 'critical').length}
            </span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <MetricCard
          title="Chiffre d'affaires 2024"
          value={formatCurrency(financials.ca)}
          subtitle={`Projeté: ${formatCurrency(financials.caProjected)}`}
          icon={Wallet}
          trend={{ value: 12, label: 'vs 2023' }}
          status={microStatus.riskLevel === 'high' ? 'warning' : 'success'}
        />
        <MetricCard
          title="IR estimé"
          value={formatCurrency(taxData.estimatedIR2024)}
          subtitle="Avant optimisations"
          icon={Landmark}
          status="info"
        />
        <MetricCard
          title="Dépenses déductibles"
          value={formatCurrency(financials.expenses)}
          subtitle={`${Object.keys(financials.expensesByCategory).length} catégories`}
          icon={Receipt}
        />
        <MetricCard
          title="Économies possibles"
          value={`+${formatCurrency(totalPotentialSavings)}`}
          subtitle="2 optimisations disponibles"
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
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </section>

          {/* Recommendations */}
          <section>
            <h2 className="text-lg font-semibold mb-4">💡 Recommandations personnalisées</h2>
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </section>
        </div>

        {/* Right Column - Status & Calendar */}
        <div className="space-y-6">
          {/* Micro Status */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-6">Statut micro-entrepreneur</h3>
            <div className="flex flex-col items-center">
              <ProgressRing 
                progress={microStatus.percentageUsed} 
                status={microStatus.riskLevel === 'high' ? 'warning' : microStatus.riskLevel === 'medium' ? 'warning' : 'success'}
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(financials.caProjected)} / {formatCurrency(SEUIL_MICRO_2024)}
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

          {/* URSSAF Summary */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Cotisations URSSAF</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Acompte mensuel</span>
                <span className="font-semibold">{formatCurrency(650)}/mois</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total versé (11 mois)</span>
                <span className="font-semibold">{formatCurrency(financials.totalURSSAFPaid)}</span>
              </div>
              <div className="h-px bg-border" />
              <button className="w-full btn-secondary text-sm py-2">
                Réviser mes acomptes
              </button>
            </div>
          </div>

          {/* Calendar Preview */}
          <CalendarPreview tasks={calendar} />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
