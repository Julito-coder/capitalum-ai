import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  Calculator, 
  CheckCircle2, 
  AlertCircle,
  Wallet,
  Gift,
  Building2,
  Percent,
  Users
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { ActionGuide } from '../ActionGuideContext';

// Step 1: Education
const EpargneSalarialeEducationStep = ({ onNext }: { onNext: () => void }) => (
  <div className="space-y-6">
    <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold mb-2">C'est quoi l'épargne salariale ?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Le <strong>PEE</strong> (Plan Épargne Entreprise) et le <strong>PERCO/PER Collectif</strong> permettent 
            d'épargner avec l'aide de votre employeur grâce à l'<strong>abondement</strong>.
          </p>
        </div>
      </div>
    </div>

    {/* Abondement explanation */}
    <div className="p-4 rounded-xl bg-success/5 border border-success/20">
      <div className="flex items-center gap-3 mb-3">
        <Gift className="h-6 w-6 text-success" />
        <h4 className="font-semibold">L'abondement = Argent gratuit !</h4>
      </div>
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          Votre employeur peut compléter vos versements jusqu'à 300% !
        </p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="p-3 rounded-lg bg-background/50 text-center">
            <p className="text-xs text-muted-foreground">Vous versez</p>
            <p className="text-xl font-bold">500 €</p>
          </div>
          <div className="p-3 rounded-lg bg-success/10 text-center">
            <p className="text-xs text-muted-foreground">Votre employeur ajoute</p>
            <p className="text-xl font-bold text-success">+500 €</p>
          </div>
        </div>
      </div>
    </div>

    {/* PEE vs PERCO */}
    <div className="grid grid-cols-2 gap-3">
      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
        <p className="font-semibold text-sm">PEE</p>
        <p className="text-xs text-muted-foreground mt-1">Bloqué 5 ans</p>
        <p className="text-xs text-muted-foreground">Déblocable (mariage, achat RP...)</p>
      </div>
      <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
        <p className="font-semibold text-sm">PER Collectif</p>
        <p className="text-xs text-muted-foreground mt-1">Bloqué retraite</p>
        <p className="text-xs text-muted-foreground">Déductible des impôts</p>
      </div>
    </div>

    <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
      <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
      <p className="text-xs text-muted-foreground">
        Ne pas profiter de l'abondement, c'est refuser de l'argent gratuit !
      </p>
    </div>
  </div>
);

// Step 2: Simulation
const EpargneSalarialeSimulationStep = ({ onNext, profile }: { onNext: () => void; profile?: UserProfile | null }) => {
  const currentPee = profile?.peeAmount || 0;
  const currentPerco = profile?.percoAmount || 0;
  const grossSalary = profile?.grossMonthlySalary || 3500;
  
  const [versementMensuel, setVersementMensuel] = useState(100);
  const [abondementRate, setAbondementRate] = useState(100); // 100% matching

  const versementAnnuel = versementMensuel * 12;
  const abondementAnnuel = Math.min(versementAnnuel * (abondementRate / 100), 3709.44); // Plafond 2024
  const totalEpargne = versementAnnuel + abondementAnnuel;
  const economieCharges = abondementAnnuel * 0.097; // CSG-CRDS only on abondement

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-info/5 border border-info/15">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-info" />
          Votre épargne salariale actuelle
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">PEE</p>
            <p className="font-semibold">{formatCurrency(currentPee)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">PERCO/PER Co.</p>
            <p className="font-semibold">{formatCurrency(currentPerco)}</p>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="versement" className="text-sm font-medium">
            Versement mensuel envisagé
          </Label>
          <div className="flex items-center gap-4">
            <Input
              id="versement"
              type="number"
              value={versementMensuel}
              onChange={(e) => setVersementMensuel(Number(e.target.value))}
              className="text-lg font-semibold"
              min={0}
              max={1000}
            />
            <span className="text-sm text-muted-foreground shrink-0">€ / mois</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="abondement" className="text-sm font-medium">
            Taux d'abondement employeur
          </Label>
          <div className="flex items-center gap-4">
            <Input
              id="abondement"
              type="number"
              value={abondementRate}
              onChange={(e) => setAbondementRate(Math.min(300, Number(e.target.value)))}
              className="text-lg font-semibold"
              min={0}
              max={300}
            />
            <span className="text-sm text-muted-foreground shrink-0">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Maximum légal : 300%. Vérifiez dans votre accord d'entreprise.
          </p>
        </div>
      </div>

      {/* Result */}
      <motion.div 
        className="p-5 rounded-xl bg-success/10 border border-success/20"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        key={`${versementMensuel}-${abondementRate}`}
      >
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Vos versements</span>
            <span className="font-semibold">{formatCurrency(versementAnnuel)}/an</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Gift className="h-4 w-4 text-success" />
              Abondement employeur
            </span>
            <span className="font-bold text-success">+{formatCurrency(abondementAnnuel)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total épargné</span>
            <span className="text-xl font-bold text-success">{formatCurrency(totalEpargne)}/an</span>
          </div>
        </div>
      </motion.div>

      <div className="p-3 rounded-lg bg-info/10 border border-info/20">
        <p className="text-xs text-muted-foreground">
          💡 L'abondement n'est pas soumis à l'impôt sur le revenu, seulement à la CSG-CRDS (9.7%).
        </p>
      </div>
    </div>
  );
};

// Step 3: Action
const EpargneSalarialeActionStep = ({ onNext }: { onNext: () => void }) => {
  const [hasAccess, setHasAccess] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-center">Avez-vous accès à un dispositif d'épargne salariale ?</h3>

      <RadioGroup value={hasAccess || ''} onValueChange={setHasAccess} className="space-y-3">
        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
          hasAccess === 'yes' ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
        }`}>
          <RadioGroupItem value="yes" id="yes" />
          <Label htmlFor="yes" className="flex-1 cursor-pointer">
            <span className="font-medium">Oui, j'ai accès</span>
            <p className="text-xs text-muted-foreground mt-0.5">Je connais mon PEE/PERCO</p>
          </Label>
        </div>

        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
          hasAccess === 'unknown' ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
        }`}>
          <RadioGroupItem value="unknown" id="unknown" />
          <Label htmlFor="unknown" className="flex-1 cursor-pointer">
            <span className="font-medium">Je ne sais pas</span>
            <p className="text-xs text-muted-foreground mt-0.5">Je dois vérifier avec mon employeur</p>
          </Label>
        </div>

        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
          hasAccess === 'no' ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
        }`}>
          <RadioGroupItem value="no" id="no" />
          <Label htmlFor="no" className="flex-1 cursor-pointer">
            <span className="font-medium">Non, pas de dispositif</span>
            <p className="text-xs text-muted-foreground mt-0.5">Mon entreprise n'en propose pas</p>
          </Label>
        </div>
      </RadioGroup>

      {hasAccess === 'yes' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-muted/30 border border-border/30"
        >
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Actions à réaliser
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">1.</span>
              <span>Connectez-vous à votre espace épargne salariale (Natixis, Amundi, Eres...)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">2.</span>
              <span>Vérifiez votre plafond d'abondement et le taux applicable</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">3.</span>
              <span>Mettez en place un versement mensuel automatique</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">4.</span>
              <span>Affectez votre participation/intéressement pour maximiser</span>
            </li>
          </ul>
        </motion.div>
      )}

      {hasAccess === 'unknown' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-info/5 border border-info/20"
        >
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-info" />
            Comment vérifier ?
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Demandez à votre service RH</li>
            <li>• Consultez votre intranet entreprise</li>
            <li>• Vérifiez vos bulletins de paie (rubrique épargne salariale)</li>
            <li>• Cherchez un courrier/mail de votre gestionnaire d'épargne</li>
          </ul>
        </motion.div>
      )}

      {hasAccess === 'no' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-warning/5 border border-warning/20"
        >
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-warning" />
            Alternatives
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Suggérez à votre employeur de mettre en place un dispositif</li>
            <li>• Ouvrez un PER individuel pour profiter d'avantages fiscaux similaires</li>
            <li>• Utilisez le PEA pour une épargne à fiscalité avantageuse</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

// Step 4: Confirmation
const EpargneSalarialeConfirmationStep = ({ onNext }: { onNext: () => void }) => (
  <div className="space-y-6 text-center">
    <div className="p-6 rounded-2xl bg-success/10 border border-success/20">
      <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Parfait !</h3>
      <p className="text-sm text-muted-foreground">
        Vous savez maintenant comment optimiser votre épargne salariale.
      </p>
    </div>

    <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-left">
      <h4 className="font-semibold mb-3">Règles d'or</h4>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Toujours maximiser l'abondement employeur</span>
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Affecter participation/intéressement au PEE</span>
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Investir sur des supports diversifiés</span>
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Connaître les cas de déblocage anticipé</span>
        </li>
      </ul>
    </div>
  </div>
);

// Export the complete guide
export const createEpargneSalarialeGuide = (estimatedGain: number = 2000): ActionGuide => ({
  id: 'epargne-salariale',
  title: 'Activer l\'épargne salariale',
  subtitle: 'Profitez de l\'abondement employeur',
  category: 'savings',
  estimatedGain,
  effort: '30 min',
  deadline: '2025-12-31',
  steps: [
    {
      id: 'education',
      title: 'Comprendre',
      description: 'Découvrez l\'épargne salariale',
      type: 'education',
      component: EpargneSalarialeEducationStep
    },
    {
      id: 'simulation',
      title: 'Simuler',
      description: 'Calculez votre gain potentiel',
      type: 'simulation',
      component: EpargneSalarialeSimulationStep
    },
    {
      id: 'action',
      title: 'Agir',
      description: 'Passez à l\'action',
      type: 'action',
      component: EpargneSalarialeActionStep
    },
    {
      id: 'confirmation',
      title: 'Confirmer',
      description: 'Validez votre action',
      type: 'confirmation',
      component: EpargneSalarialeConfirmationStep
    }
  ]
});
