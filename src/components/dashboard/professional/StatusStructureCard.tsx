import { Building, Scale, TrendingUp, Info, ChevronRight, Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { useActionGuide } from '@/components/guides/ActionGuideContext';
import { createStatutJuridiqueGuide } from '@/components/guides';

interface StatusStructureCardProps {
  profile: UserProfile | null;
  hasRealData: boolean;
}

interface StatusComparison {
  id: string;
  label: string;
  chargesSociales: number;
  impotRevenu: number;
  revenueNet: number;
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'micro': 'Micro-entrepreneur',
    'micro_bnc': 'Micro-BNC',
    'micro_bic': 'Micro-BIC',
    'reel': 'Réel simplifié',
    'eurl': 'EURL',
    'sasu': 'SASU',
    'ei': 'Entreprise Individuelle',
    'sarl': 'SARL',
    'sas': 'SAS'
  };
  return labels[status] || status;
};

const calculateStatusComparison = (profile: UserProfile | null): StatusComparison[] => {
  const ca = profile?.annualRevenueHt || 50000;
  const charges = (profile?.officeRent || 0) + (profile?.vehicleExpenses || 0) + (profile?.professionalSupplies || 0);
  
  // Micro-BNC calculation
  const microBenefice = ca * 0.66;
  const microChargesSociales = ca * 0.22;
  const microIR = microBenefice * 0.20;
  const microNet = ca - microChargesSociales - microIR;
  
  // Réel simplifié
  const reelBenefice = ca - charges;
  const reelChargesSociales = reelBenefice * 0.44;
  const reelIR = (reelBenefice - reelChargesSociales) * 0.20;
  const reelNet = reelBenefice - reelChargesSociales - reelIR;
  
  // SASU
  const sasuRemuneration = reelBenefice * 0.7;
  const sasuChargesSociales = sasuRemuneration * 0.45;
  const sasuDividendes = reelBenefice - sasuRemuneration - sasuChargesSociales;
  const sasuIR = sasuRemuneration * 0.20 + Math.max(0, sasuDividendes) * 0.30;
  const sasuNet = sasuRemuneration * 0.8 + Math.max(0, sasuDividendes) * 0.70;
  
  return [
    { id: 'micro', label: 'Micro-entrepreneur', chargesSociales: microChargesSociales, impotRevenu: microIR, revenueNet: microNet },
    { id: 'reel', label: 'Réel simplifié (EI)', chargesSociales: reelChargesSociales, impotRevenu: reelIR, revenueNet: reelNet },
    { id: 'sasu', label: 'SASU', chargesSociales: sasuChargesSociales, impotRevenu: sasuIR, revenueNet: sasuNet }
  ];
};

export const StatusStructureCard = ({ profile, hasRealData }: StatusStructureCardProps) => {
  const navigate = useNavigate();
  const { openGuide, isActionCompleted, isActionPending } = useActionGuide();
  
  if (!hasRealData || !profile?.isSelfEmployed) {
    return (
      <Card className="border border-border/30 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-accent/10">
              <Building className="h-5 w-5 text-accent" />
            </div>
            Statut & Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Building className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">
              Données insuffisantes
            </p>
            <p className="text-sm text-muted-foreground/70 mb-4 max-w-xs">
              Complétez votre profil professionnel pour comparer les statuts juridiques.
            </p>
            <Button onClick={() => navigate('/pro/onboarding')} size="sm">
              Configurer mon activité
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStatus = profile.fiscalStatus || 'micro';
  const comparisons = calculateStatusComparison(profile);
  const currentComparison = comparisons.find(c => c.id === currentStatus) || comparisons[0];
  const bestAlternative = comparisons
    .filter(c => c.id !== currentStatus)
    .sort((a, b) => b.revenueNet - a.revenueNet)[0];
  
  const potentialGain = bestAlternative ? Math.max(0, bestAlternative.revenueNet - currentComparison.revenueNet) : 0;
  const hasOpportunity = potentialGain > 2000;

  const handleAnalyzeClick = () => {
    openGuide(createStatutJuridiqueGuide(profile), profile);
  };

  const isCompleted = isActionCompleted('statut-juridique-analyse');
  const isPending = isActionPending('statut-juridique-analyse');

  return (
    <Card className="border border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-accent/10">
              <Building className="h-5 w-5 text-accent" />
            </div>
            Statut & Structure
          </CardTitle>
          {isCompleted && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              ✓ Analysé
            </Badge>
          )}
          {isPending && (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
              En cours
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Comparaison des formes juridiques</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current status */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Statut actuel</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/30">
              Actif
            </span>
          </div>
          <h4 className="text-lg font-semibold mb-1">{getStatusLabel(currentStatus)}</h4>
          
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/30 text-xs">
            <div>
              <span className="text-muted-foreground">Charges</span>
              <p className="font-semibold text-destructive">{formatCurrency(currentComparison.chargesSociales)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">IR estimé</span>
              <p className="font-semibold">{formatCurrency(currentComparison.impotRevenu)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Net estimé</span>
              <p className="font-semibold text-success">{formatCurrency(currentComparison.revenueNet)}</p>
            </div>
          </div>
        </div>

        {/* Opportunity detection */}
        {hasOpportunity && (
          <button
            onClick={handleAnalyzeClick}
            className="w-full p-4 rounded-xl bg-success/5 border border-success/20 hover:border-success/40 transition-all group text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Opportunité détectée</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-success/10 text-success border border-success/30">
                +{formatCurrency(potentialGain)}/an
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-semibold mb-0.5 group-hover:text-success transition-colors">
                  {bestAlternative.label}
                </h4>
                <p className="text-xs text-muted-foreground">pourrait être plus avantageux</p>
              </div>
              <div className="p-2 rounded-full bg-success/10 group-hover:bg-success/20 transition-colors">
                <Play className="h-4 w-4 text-success" />
              </div>
            </div>
          </button>
        )}

        {/* Main CTA if no opportunity */}
        {!hasOpportunity && (
          <Button
            onClick={handleAnalyzeClick}
            variant="outline"
            className="w-full justify-between min-h-[48px]"
          >
            <span className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Analyser mon statut
            </span>
            <Play className="h-4 w-4" />
          </Button>
        )}

        {/* Info note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>Ces estimations sont indicatives. Le guide vous accompagne dans l'analyse détaillée.</p>
        </div>

        <Button 
          variant="ghost" 
          className="w-full justify-between text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/pro/status')}
        >
          <span className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Comparateur détaillé
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
