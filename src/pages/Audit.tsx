import { Layout } from '@/components/layout/Layout';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  TrendingUp,
  FileText,
  CreditCard,
  Building2,
  ArrowRight
} from 'lucide-react';
import { mockUserData, formatCurrency, checkMicroThreshold } from '@/data/mockData';

const Audit = () => {
  const { financials, taxData, alerts } = mockUserData;
  const microStatus = checkMicroThreshold(financials.caProjected);
  
  const auditScore = 72;

  const validatedItems = [
    { label: 'CA cohérent avec impots.gouv', status: 'success' },
    { label: 'Dépenses catégorisées', status: 'success' },
    { label: 'Acomptes URSSAF à jour', status: 'success' },
    { label: 'Déclarations partielles OK', status: 'success' },
  ];

  const anomalies = [
    { label: 'Dépense "Cafés" (340€) : Peu déductible', severity: 'warning' },
    { label: 'Revenu Google Adsense (120€) : À déclarer?', severity: 'warning' },
    { label: 'Facture non payée (890€) : 2024 ou 2025?', severity: 'info' },
    { label: 'PER versement manquant vs 2023', severity: 'critical' },
  ];

  const opportunities = [
    { label: 'Frais réels vs abattement', gain: 690, status: 'available' },
    { label: 'Versement PER (avant 31/12)', gain: 1530, status: 'available' },
    { label: 'Réduction Sofibail', gain: 0, status: 'explore' },
    { label: 'Crédit formation', gain: 0, status: 'explore' },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-serif font-bold mb-2">Audit fiscal 2024</h1>
          <p className="text-muted-foreground">Analyse complète de ta situation fiscale</p>
        </div>

        {/* Score Card */}
        <div className="glass-card rounded-2xl p-6 lg:p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="relative">
              <svg className="w-32 h-32 -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  strokeWidth="10"
                  className="stroke-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className="stroke-primary transition-all duration-1000"
                  style={{
                    strokeDasharray: 352,
                    strokeDashoffset: 352 - (auditScore / 100) * 352
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{auditScore}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-xl font-semibold mb-2">Score global : BON</h2>
              <p className="text-muted-foreground mb-4">
                Ta situation fiscale est correcte mais peut être optimisée.
                <br />
                <span className="text-success font-medium">+{formatCurrency(2220)}</span> d'économies potentielles identifiées.
              </p>
              <button className="btn-primary">
                Appliquer les optimisations
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Validated */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Données validées
            </h3>
            <div className="space-y-3">
              {validatedItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/20">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Anomalies */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Anomalies détectées
            </h3>
            <div className="space-y-3">
              {anomalies.map((item, idx) => {
                const config = {
                  critical: { icon: XCircle, bg: 'bg-destructive/5', border: 'border-destructive/20', iconColor: 'text-destructive' },
                  warning: { icon: AlertTriangle, bg: 'bg-warning/5', border: 'border-warning/20', iconColor: 'text-warning' },
                  info: { icon: AlertTriangle, bg: 'bg-info/5', border: 'border-info/20', iconColor: 'text-info' },
                };
                const c = config[item.severity as keyof typeof config];
                return (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl ${c.bg} border ${c.border}`}>
                    <c.icon className={`h-4 w-4 ${c.iconColor} shrink-0`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Opportunities */}
          <div className="glass-card rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Opportunités d'optimisation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {opportunities.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    item.gain > 0 
                      ? 'bg-primary/5 border-primary/20 hover:border-primary/40 cursor-pointer' 
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  {item.gain > 0 ? (
                    <span className="text-success font-bold">+{formatCurrency(item.gain)}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">À explorer</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Audit;
