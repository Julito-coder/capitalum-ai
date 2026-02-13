import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingDown, 
  Calculator, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Wallet,
  Target,
  FileText,
  Building2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { ActionGuide, GuideStep } from '../ActionGuideContext';
import { PartnerRecommendations } from '../PartnerRecommendations';

// Step 1: Education
const PEREducationStep = ({ onNext }: { onNext: () => void }) => (
  <div className="space-y-6">
    <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold mb-2">Qu'est-ce que le PER ?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Le <strong>Plan d'Épargne Retraite</strong> vous permet de déduire vos versements 
            de votre revenu imposable. Moins de revenus imposables = moins d'impôts.
          </p>
        </div>
      </div>
    </div>

    {/* Visual comparison */}
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
        <TrendingDown className="h-8 w-8 mx-auto text-destructive mb-2" />
        <p className="text-sm font-medium">Sans PER</p>
        <p className="text-xs text-muted-foreground mt-1">Imposition maximale</p>
      </div>
      <div className="p-4 rounded-xl bg-success/5 border border-success/20 text-center">
        <Target className="h-8 w-8 mx-auto text-success mb-2" />
        <p className="text-sm font-medium">Avec PER</p>
        <p className="text-xs text-muted-foreground mt-1">Économie d'impôt immédiate</p>
      </div>
    </div>

    {/* Example */}
    <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-info" />
        Exemple concret
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Versement PER</span>
          <span className="font-medium">3 000 €</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">TMI à 30%</span>
          <span className="font-medium">×30%</span>
        </div>
        <div className="h-px bg-border my-2" />
        <div className="flex justify-between">
          <span className="font-semibold text-success">Économie d'impôt</span>
          <span className="font-bold text-success">900 €</span>
        </div>
      </div>
    </div>

    <p className="text-xs text-muted-foreground text-center">
      💡 Plus votre TMI est élevé, plus l'avantage fiscal est important.
    </p>
  </div>
);

// Step 2: Simulation
const PERSimulationStep = ({ onNext, profile }: { onNext: () => void; profile?: UserProfile | null }) => {
  const annualIncome = profile?.isEmployee 
    ? (profile.grossMonthlySalary || 0) * 12 + (profile.annualBonus || 0)
    : profile?.isSelfEmployed 
      ? profile.annualRevenueHt || 0
      : profile?.mainPensionAnnual || 30000;

  const [versement, setVersement] = useState(3000);
  
  // Simplified TMI calculation
  const getTMI = (income: number) => {
    if (income > 177106) return 45;
    if (income > 82341) return 41;
    if (income > 28797) return 30;
    if (income > 11294) return 11;
    return 0;
  };

  const tmi = getTMI(annualIncome);
  const maxPlafond = Math.max(4399, annualIncome * 0.10);
  const economie = Math.round(versement * (tmi / 100));

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-info/5 border border-info/15">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-info" />
          Votre situation
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Revenu annuel</p>
            <p className="font-semibold">{formatCurrency(annualIncome)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Votre TMI</p>
            <p className="font-semibold">{tmi}%</p>
          </div>
        </div>
      </div>

      {/* Versement slider */}
      <div className="space-y-3">
        <Label htmlFor="versement" className="text-sm font-medium">
          Montant du versement PER
        </Label>
        <div className="flex items-center gap-4">
          <Input
            id="versement"
            type="number"
            value={versement}
            onChange={(e) => setVersement(Math.min(Number(e.target.value), maxPlafond))}
            className="text-lg font-semibold"
            min={0}
            max={maxPlafond}
          />
          <span className="text-sm text-muted-foreground shrink-0">€ / an</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Plafond disponible estimé : {formatCurrency(maxPlafond)}
        </p>
      </div>

      {/* Result */}
      <motion.div 
        className="p-5 rounded-xl bg-success/10 border border-success/20"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        key={versement}
      >
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">En versant {formatCurrency(versement)}</p>
          <p className="text-3xl font-bold text-success mb-1">
            -{formatCurrency(economie)}
          </p>
          <p className="text-sm text-success">d'impôt sur le revenu</p>
        </div>
      </motion.div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
        <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          L'argent versé est bloqué jusqu'à la retraite (sauf cas exceptionnels : achat RP, invalidité...).
        </p>
      </div>
    </div>
  );
};

// Step 3: Action Choice
const PERActionStep = ({ onNext, profile }: { onNext: () => void; profile?: UserProfile | null }) => {
  const [hasPerAlready, setHasPerAlready] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-center">Avez-vous déjà un PER ?</h3>

      <RadioGroup value={hasPerAlready || ''} onValueChange={setHasPerAlready} className="space-y-3">
        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
          hasPerAlready === 'yes' ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
        }`}>
          <RadioGroupItem value="yes" id="yes" />
          <Label htmlFor="yes" className="flex-1 cursor-pointer">
            <span className="font-medium">Oui, j'ai déjà un PER</span>
            <p className="text-xs text-muted-foreground mt-0.5">Je veux augmenter mes versements</p>
          </Label>
        </div>

        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
          hasPerAlready === 'no' ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
        }`}>
          <RadioGroupItem value="no" id="no" />
          <Label htmlFor="no" className="flex-1 cursor-pointer">
            <span className="font-medium">Non, je n'ai pas encore de PER</span>
            <p className="text-xs text-muted-foreground mt-0.5">Je veux en ouvrir un</p>
          </Label>
        </div>
      </RadioGroup>

      {hasPerAlready === 'yes' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Actions à réaliser
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                <span>Connectez-vous à l'espace client de votre PER</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                <span>Vérifiez votre plafond disponible (rubrique "Mes plafonds")</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                <span>Effectuez un versement libre avant le 31/12</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">4.</span>
                <span>Conservez le justificatif pour votre déclaration</span>
              </li>
            </ul>
          </div>
        </motion.div>
      )}

      {hasPerAlready === 'no' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h4 className="font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-info" />
            Où ouvrir un PER ?
          </h4>
          <PartnerRecommendations type="per" profile={profile || null} campaign="per_guide" />

          <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
            <FileText className="h-4 w-4 text-info mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Documents nécessaires : pièce d'identité, RIB, justificatif de domicile, dernier avis d'imposition.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Step 4: Confirmation
const PERConfirmationStep = ({ onNext }: { onNext: () => void }) => (
  <div className="space-y-6 text-center">
    <div className="p-6 rounded-2xl bg-success/10 border border-success/20">
      <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Félicitations !</h3>
      <p className="text-sm text-muted-foreground">
        Vous avez toutes les informations pour optimiser votre PER.
      </p>
    </div>

    <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-left">
      <h4 className="font-semibold mb-3">Prochaines étapes</h4>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
          <span>Ouvrir ou accéder à votre PER</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
          <span>Effectuer le versement avant le 31/12</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
          <span>Déclarer le montant sur votre déclaration 2025</span>
        </li>
      </ul>
    </div>

    <p className="text-xs text-muted-foreground">
      Indiquez ci-dessous si vous avez réalisé cette action ou si vous la ferez plus tard.
    </p>
  </div>
);

// Export the complete guide
export const createPERGuide = (estimatedGain: number = 900): ActionGuide => ({
  id: 'per-optimization',
  title: 'Optimisez votre PER',
  subtitle: 'Réduisez votre impôt sur le revenu',
  category: 'savings',
  estimatedGain,
  effort: '30 min',
  deadline: '2025-12-31',
  steps: [
    {
      id: 'education',
      title: 'Comprendre',
      description: 'Découvrez comment le PER réduit vos impôts',
      type: 'education',
      component: PEREducationStep
    },
    {
      id: 'simulation',
      title: 'Simuler',
      description: 'Calculez votre économie personnalisée',
      type: 'simulation',
      component: PERSimulationStep
    },
    {
      id: 'action',
      title: 'Agir',
      description: 'Passez à l\'action concrète',
      type: 'action',
      component: PERActionStep
    },
    {
      id: 'confirmation',
      title: 'Confirmer',
      description: 'Validez votre action',
      type: 'confirmation',
      component: PERConfirmationStep
    }
  ]
});
