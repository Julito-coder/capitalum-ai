import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  Car, 
  Calculator, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Briefcase,
  Home,
  Utensils
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { ActionGuide } from '../ActionGuideContext';
import { PartnerRecommendations } from '../PartnerRecommendations';

// Step 1: Education
const FraisReelsEducationStep = ({ onNext }: { onNext: () => void }) => (
  <div className="space-y-6">
    <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold mb-2">Frais réels vs Abattement 10%</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Par défaut, l'administration fiscale déduit <strong>10% de tes revenus</strong> pour frais professionnels. 
            Mais si vos frais réels dépassent ce montant, tu peux les déclarer !
          </p>
        </div>
      </div>
    </div>

    {/* What can be deducted */}
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">Frais déductibles principaux</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <Car className="h-5 w-5 text-info mb-2" />
          <p className="text-sm font-medium">Transports</p>
          <p className="text-xs text-muted-foreground">Trajet domicile-travail</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <Utensils className="h-5 w-5 text-warning mb-2" />
          <p className="text-sm font-medium">Repas</p>
          <p className="text-xs text-muted-foreground">Surcoût cantine/resto</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <Home className="h-5 w-5 text-accent mb-2" />
          <p className="text-sm font-medium">Télétravail</p>
          <p className="text-xs text-muted-foreground">Bureau à domicile</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <Briefcase className="h-5 w-5 text-success mb-2" />
          <p className="text-sm font-medium">Formation</p>
          <p className="text-xs text-muted-foreground">Cours, livres pro</p>
        </div>
      </div>
    </div>

    <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
      <FileText className="h-4 w-4 text-info mt-0.5 shrink-0" />
      <p className="text-xs text-muted-foreground">
        Important : vous devez pouvoir justifier chaque dépense avec des factures ou attestations.
      </p>
    </div>
  </div>
);

// Step 2: Simulation
const FraisReelsSimulationStep = ({ onNext, profile }: { onNext: () => void; profile?: UserProfile | null }) => {
  const grossSalary = (profile?.grossMonthlySalary || 3000) * 12;
  const abattement10 = grossSalary * 0.10;
  
  const [kmAnnuel, setKmAnnuel] = useState(8000);
  const [cv, setCv] = useState(5);
  const [repas, setRepas] = useState(180);
  
  // Barème kilométrique 2024 simplifié
  const getBaremeKm = (km: number, chevaux: number) => {
    if (km <= 5000) return km * (chevaux <= 3 ? 0.529 : chevaux <= 4 ? 0.606 : chevaux <= 5 ? 0.636 : 0.665);
    if (km <= 20000) return km * (chevaux <= 3 ? 0.316 : chevaux <= 4 ? 0.340 : chevaux <= 5 ? 0.357 : 0.374) + 1065;
    return km * (chevaux <= 3 ? 0.370 : chevaux <= 4 ? 0.407 : chevaux <= 5 ? 0.427 : 0.447);
  };

  const fraisKm = getBaremeKm(kmAnnuel, cv);
  const fraisRepas = repas * (5.35); // Surcoût par repas (environ 5.35€ en 2024)
  const totalFraisReels = fraisKm + fraisRepas;
  
  const difference = totalFraisReels - abattement10;
  const economie = difference > 0 ? Math.round(difference * 0.30) : 0; // TMI 30%

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-info/5 border border-info/15">
        <h3 className="font-semibold mb-2">Votre abattement 10% actuel</h3>
        <p className="text-2xl font-bold">{formatCurrency(abattement10)}</p>
        <p className="text-xs text-muted-foreground">À battre pour que les frais réels soient intéressants</p>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Car className="h-4 w-4" />
            Kilomètres domicile-travail par an
          </Label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={kmAnnuel}
              onChange={(e) => setKmAnnuel(Number(e.target.value))}
              className="text-lg font-semibold"
            />
            <span className="text-sm text-muted-foreground shrink-0">km</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Puissance fiscale du véhicule</Label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={cv}
              onChange={(e) => setCv(Math.min(7, Math.max(1, Number(e.target.value))))}
              className="text-lg font-semibold"
              min={1}
              max={7}
            />
            <span className="text-sm text-muted-foreground shrink-0">CV</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Repas pris hors domicile par an
          </Label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={repas}
              onChange={(e) => setRepas(Number(e.target.value))}
              className="text-lg font-semibold"
            />
            <span className="text-sm text-muted-foreground shrink-0">repas</span>
          </div>
        </div>
      </div>

      {/* Result */}
      <motion.div 
        className="space-y-3"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        key={`${kmAnnuel}-${cv}-${repas}`}
      >
        <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frais kilométriques</span>
              <span className="font-medium">{formatCurrency(fraisKm)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frais de repas</span>
              <span className="font-medium">{formatCurrency(fraisRepas)}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between">
              <span className="font-semibold">Total frais réels</span>
              <span className="font-bold">{formatCurrency(totalFraisReels)}</span>
            </div>
          </div>
        </div>

        {difference > 0 ? (
          <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
            <p className="text-sm text-muted-foreground">Économie potentielle</p>
            <p className="text-2xl font-bold text-success">+{formatCurrency(economie)}/an</p>
            <p className="text-xs text-success mt-1">
              +{formatCurrency(difference)} de déduction supplémentaire
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-center">
            <p className="text-sm text-muted-foreground">L'abattement 10% est plus avantageux</p>
            <p className="text-xs text-warning mt-1">
              Vos frais réels sont inférieurs de {formatCurrency(Math.abs(difference))}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Step 3: Action
const FraisReelsActionStep = ({ onNext }: { onNext: () => void }) => {
  const [decision, setDecision] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-center">Voulez-vous passer aux frais réels ?</h3>

      <RadioGroup value={decision || ''} onValueChange={setDecision} className="space-y-3">
        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
          decision === 'yes' ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
        }`}>
          <RadioGroupItem value="yes" id="yes" />
          <Label htmlFor="yes" className="flex-1 cursor-pointer">
            <span className="font-medium">Oui, je passe aux frais réels</span>
            <p className="text-xs text-muted-foreground mt-0.5">Je prépare mes justificatifs</p>
          </Label>
        </div>

        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
          decision === 'no' ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
        }`}>
          <RadioGroupItem value="no" id="no" />
          <Label htmlFor="no" className="flex-1 cursor-pointer">
            <span className="font-medium">Non, je garde l'abattement 10%</span>
            <p className="text-xs text-muted-foreground mt-0.5">C'est plus simple</p>
          </Label>
        </div>
      </RadioGroup>

      {decision === 'yes' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-muted/30 border border-border/30"
        >
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-info" />
            Documents à préparer
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <span>Carte grise du véhicule (puissance fiscale)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <span>Attestation employeur (distance domicile-travail)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <span>Calendrier de présence (jours travaillés)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <span>Tickets de péage/parking si applicable</span>
            </li>
          </ul>
          
          <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              Conservez vos justificatifs 3 ans en cas de contrôle fiscal.
            </p>
          </div>

          <h4 className="font-semibold text-sm mt-2">Simulateurs officiels</h4>
          <PartnerRecommendations type="optimisation_fiscale" profile={null} campaign="frais_reels_guide" />
        </motion.div>
      )}
    </div>
  );
};

// Step 4: Confirmation
const FraisReelsConfirmationStep = ({ onNext }: { onNext: () => void }) => (
  <div className="space-y-6 text-center">
    <div className="p-6 rounded-2xl bg-success/10 border border-success/20">
      <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Analyse terminée !</h3>
      <p className="text-sm text-muted-foreground">
        Vous savez maintenant si les frais réels sont intéressants pour vous.
      </p>
    </div>

    <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-left">
      <h4 className="font-semibold mb-3">Points clés</h4>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Comparer chaque année (situation peut changer)</span>
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Ne pas oublier tous les frais (formation, matériel...)</span>
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Déclarer case 1AK (et non 1AJ) si frais réels</span>
        </li>
      </ul>
    </div>
  </div>
);

// Export the complete guide
export const createFraisReelsGuide = (estimatedGain: number = 500): ActionGuide => ({
  id: 'frais-reels',
  title: 'Passer aux frais réels',
  subtitle: 'Déduisez vos vraies dépenses professionnelles',
  category: 'deduction',
  estimatedGain,
  effort: '2h',
  deadline: '2025-05-31',
  steps: [
    {
      id: 'education',
      title: 'Comprendre',
      description: 'Les frais réels expliqués',
      type: 'education',
      component: FraisReelsEducationStep
    },
    {
      id: 'simulation',
      title: 'Simuler',
      description: 'Calculez vos frais',
      type: 'simulation',
      component: FraisReelsSimulationStep
    },
    {
      id: 'action',
      title: 'Décider',
      description: 'Préparez vos justificatifs',
      type: 'action',
      component: FraisReelsActionStep
    },
    {
      id: 'confirmation',
      title: 'Confirmer',
      description: 'Validez votre décision',
      type: 'confirmation',
      component: FraisReelsConfirmationStep
    }
  ]
});
