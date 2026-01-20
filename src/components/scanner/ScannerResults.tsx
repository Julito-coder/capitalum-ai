import { ScanResult } from '@/data/taxScannerTypes';
import { formatCurrency } from '@/data/mockData';
import { exportTaxReportPDF } from '@/lib/pdfExport';
import { AlertTriangle, CheckCircle2, XCircle, Info, TrendingUp, RotateCcw, FileDown, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  result: ScanResult;
  onReset: () => void;
}

export const ScannerResults = ({ result, onReset }: Props) => {
  const { score, errors, optimizations, totalPotentialSavings, totalRiskAmount } = result;
  
  const scoreColor = score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-destructive';
  const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Bon' : 'À améliorer';

  const criticalErrors = errors.filter(e => e.severity === 'critical');
  const warningErrors = errors.filter(e => e.severity === 'warning');
  const infoErrors = errors.filter(e => e.severity === 'info');

  const handleExportPDF = () => {
    try {
      exportTaxReportPDF(result);
      toast.success('Rapport PDF téléchargé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
      console.error(error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Résultats de l'analyse</h1>
          <p className="text-muted-foreground">
            Analysé le {result.timestamp.toLocaleDateString('fr-FR')} à {result.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportPDF} className="btn-primary">
            <FileDown className="w-4 h-4" />
            Exporter PDF
          </button>
          <button onClick={onReset} className="btn-secondary">
            <RotateCcw className="w-4 h-4" />
            Recommencer
          </button>
        </div>
      </div>

      {/* Score card */}
      <div className="glass-card rounded-2xl p-6 lg:p-8 mb-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="relative">
            <svg className="w-32 h-32 -rotate-90">
              <circle cx="64" cy="64" r="56" fill="none" strokeWidth="10" className="stroke-muted" />
              <circle cx="64" cy="64" r="56" fill="none" strokeWidth="10" strokeLinecap="round"
                className={score >= 80 ? 'stroke-success' : score >= 60 ? 'stroke-warning' : 'stroke-destructive'}
                style={{ strokeDasharray: 352, strokeDashoffset: 352 - (score / 100) * 352, transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </div>
          
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-xl font-semibold mb-2">Score : {scoreLabel}</h2>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-success">+{formatCurrency(totalPotentialSavings)}</p>
                <p className="text-xs text-muted-foreground">Économies potentielles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalRiskAmount)}</p>
                <p className="text-xs text-muted-foreground">Risque estimé</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-1">
                <span className="text-lg font-bold text-destructive">{criticalErrors.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Critiques</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-1">
                <span className="text-lg font-bold text-warning">{warningErrors.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Attention</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-1">
                <span className="text-lg font-bold text-success">{optimizations.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Optimisations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Errors section */}
      {errors.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Erreurs et alertes détectées ({errors.length})
          </h3>
          <div className="space-y-3">
            {errors.map((error) => {
              const config = {
                critical: { icon: XCircle, bg: 'bg-destructive/10', border: 'border-destructive/30', iconColor: 'text-destructive' },
                warning: { icon: AlertTriangle, bg: 'bg-warning/10', border: 'border-warning/30', iconColor: 'text-warning' },
                info: { icon: Info, bg: 'bg-info/10', border: 'border-info/30', iconColor: 'text-info' }
              };
              const c = config[error.severity];
              const Icon = c.icon;
              
              return (
                <div key={error.id} className={`rounded-xl ${c.bg} ${c.border} border p-4`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${c.bg}`}>
                      <Icon className={`h-5 w-5 ${c.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{error.title}</h4>
                        {error.taxBox && (
                          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            Case {error.taxBox}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{error.description}</p>
                      <p className="text-xs text-primary">✓ {error.action}</p>
                    </div>
                    {error.estimatedRisk > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-destructive">{formatCurrency(error.estimatedRisk)}</p>
                        <p className="text-xs text-muted-foreground">risque</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optimizations section */}
      {optimizations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Optimisations recommandées ({optimizations.length})
          </h3>
          <div className="space-y-4">
            {optimizations.slice(0, 6).map((opt) => (
              <div key={opt.id} className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold mb-1">{opt.title}</h4>
                    <p className="text-sm text-muted-foreground">{opt.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-success">+{formatCurrency(opt.estimatedSavings)}</p>
                    <p className="text-xs text-muted-foreground">économie</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {opt.taxBox && <span>📋 Case {opt.taxBox}</span>}
                  {opt.deadline && <span>⏰ Avant le {opt.deadline}</span>}
                  <span>⚡ {opt.effort}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          ⚠️ Ces recommandations sont indicatives. Pour les optimisations complexes, consultez un conseiller fiscal.
          <a href="https://www.impots.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-primary ml-1 inline-flex items-center gap-1">
            impots.gouv.fr <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>
    </div>
  );
};
