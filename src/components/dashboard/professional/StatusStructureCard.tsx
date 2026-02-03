import { Building, Scale, TrendingUp, ArrowRight, Info, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';

interface StatusStructureCardProps {
  profile: UserProfile | null;
  hasRealData: boolean;
}

interface StatusComparison {
  id: string;
  label: string;
  description: string;
  chargesSociales: number;
  impotRevenu: number;
  revenueNet: number;
  avantages: string[];
  inconvenients: string[];
}

const MICRO_THRESHOLD = 77700;

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
  const microBenefice = ca * 0.66; // 34% abattement
  const microChargesSociales = ca * 0.22;
  const microIR = microBenefice * 0.20; // Simplified
  const microNet = ca - microChargesSociales - microIR;
  
  // Réel simplifié
  const reelBenefice = ca - charges;
  const reelChargesSociales = reelBenefice * 0.44;
  const reelIR = (reelBenefice - reelChargesSociales) * 0.20;
  const reelNet = reelBenefice - reelChargesSociales - reelIR;
  
  // SASU (président assimilé salarié)
  const sasuRemuneration = reelBenefice * 0.7;
  const sasuChargesSociales = sasuRemuneration * 0.45; // Charges patronales
  const sasuDividendes = reelBenefice - sasuRemuneration - sasuChargesSociales;
  const sasuIR = sasuRemuneration * 0.20 + Math.max(0, sasuDividendes) * 0.30;
  const sasuNet = sasuRemuneration * 0.8 + Math.max(0, sasuDividendes) * 0.70;
  
  return [
    {
      id: 'micro',
      label: 'Micro-entrepreneur',
      description: 'Simplicité maximale, charges proportionnelles',
      chargesSociales: microChargesSociales,
      impotRevenu: microIR,
      revenueNet: microNet,
      avantages: ['Simplicité comptable', 'Pas de frais de structure', 'Cotisations proportionnelles'],
      inconvenients: ['Plafond CA', 'Pas de déduction charges', 'Moins crédible']
    },
    {
      id: 'reel',
      label: 'Réel simplifié (EI)',
      description: 'Déduction des charges réelles',
      chargesSociales: reelChargesSociales,
      impotRevenu: reelIR,
      revenueNet: reelNet,
      avantages: ['Déduction des charges', 'Pas de plafond', 'Déficit reportable'],
      inconvenients: ['Comptabilité obligatoire', 'Cotisations élevées', 'Risque illimité']
    },
    {
      id: 'sasu',
      label: 'SASU',
      description: 'Protection sociale maximale',
      chargesSociales: sasuChargesSociales,
      impotRevenu: sasuIR,
      revenueNet: sasuNet,
      avantages: ['Responsabilité limitée', 'Protection sociale', 'Flexibilité rémunération'],
      inconvenients: ['Charges élevées', 'Formalisme', 'Coûts de gestion']
    }
  ];
};

export const StatusStructureCard = ({ profile, hasRealData }: StatusStructureCardProps) => {
  const navigate = useNavigate();
  
  if (!hasRealData || !profile?.isSelfEmployed) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
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
  
  const potentialGain = bestAlternative ? bestAlternative.revenueNet - currentComparison.revenueNet : 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-accent/10">
            <Building className="h-5 w-5 text-accent" />
          </div>
          Statut & Structure
        </CardTitle>
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
          <p className="text-sm text-muted-foreground">{currentComparison.description}</p>
          
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

        {/* Best alternative */}
        {bestAlternative && potentialGain > 500 && (
          <div className="p-4 rounded-xl bg-success/5 border border-success/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Alternative recommandée</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-success/10 text-success border border-success/30">
                +{formatCurrency(potentialGain)}/an
              </span>
            </div>
            <h4 className="text-base font-semibold mb-1">{bestAlternative.label}</h4>
            <p className="text-sm text-muted-foreground">{bestAlternative.description}</p>
            
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/30 text-xs">
              <div>
                <span className="text-muted-foreground">Charges</span>
                <p className="font-semibold">{formatCurrency(bestAlternative.chargesSociales)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">IR estimé</span>
                <p className="font-semibold">{formatCurrency(bestAlternative.impotRevenu)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Net estimé</span>
                <p className="font-semibold text-success">{formatCurrency(bestAlternative.revenueNet)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>Ces estimations sont indicatives. Consultez un expert-comptable avant tout changement de statut.</p>
        </div>

        <Button 
          variant="ghost" 
          className="w-full justify-between text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/pro/status')}
        >
          <span className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Comparateur de statuts détaillé
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
