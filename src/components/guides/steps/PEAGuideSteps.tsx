import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  Calculator, 
  CheckCircle2, 
  AlertCircle,
  Wallet,
  BarChart3,
  Clock,
  Percent
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { ActionGuide } from '../ActionGuideContext';

// Step 1: Education
const PEAEducationStep = ({ onNext }: { onNext: () => void }) => (
  <div className="space-y-6">
    <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold mb-2">Qu'est-ce que le PEA ?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Le <strong>Plan d'Épargne en Actions</strong> est une enveloppe fiscale avantageuse 
            pour investir en Bourse. Après 5 ans, vos gains sont exonérés d'impôt sur le revenu.
          </p>
        </div>
      </div>
    </div>

    {/* Visual comparison */}
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
        <Percent className="h-8 w-8 mx-auto text-destructive mb-2" />
        <p className="text-sm font-medium">CTO</p>
        <p className="text-2xl font-bold text-destructive mt-1">30%</p>
        <p className="text-xs text-muted-foreground">Flat tax sur gains</p>
      </div>
      <div className="p-4 rounded-xl bg-success/5 border border-success/20 text-center">
        <TrendingUp className="h-8 w-8 mx-auto text-success mb-2" />
        <p className="text-sm font-medium">PEA</p>
        <p className="text-2xl font-bold text-success mt-1">17.2%</p>
        <p className="text-xs text-muted-foreground">Après 5 ans</p>
      </div>
    </div>

    {/* Timeline */}
    <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-info" />
        Avantage fiscal progressif
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between p-2 rounded-lg bg-warning/5">
          <span>0-5 ans</span>
          <span className="font-medium text-warning">PFU 30% + perte avantage</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-success/5">
          <span>&gt; 5 ans</span>
          <span className="font-medium text-success">17.2% prélèvements sociaux</span>
        </div>
      </div>
    </div>

    <p className="text-xs text-muted-foreground text-center">
      💡 Plus vous ouvrez tôt, plus vite vous profitez de l'avantage fiscal.
    </p>
  </div>
);

// Step 2: Simulation
const PEASimulationStep = ({ onNext, profile }: { onNext: () => void; profile?: UserProfile | null }) => {
  const currentPeaBalance = profile?.peaBalance || 0;
  const [investmentAmount, setInvestmentAmount] = useState(5000);
  const [years, setYears] = useState(10);
  
  const annualReturn = 0.07; // 7% average return
  const futureValuePea = investmentAmount * Math.pow(1 + annualReturn, years);
  const futureValueCto = investmentAmount * Math.pow(1 + annualReturn, years);
  
  const gainPea = futureValuePea - investmentAmount;
  const gainCto = futureValueCto - investmentAmount;
  
  const taxPea = gainPea * 0.172; // Only social contributions
  const taxCto = gainCto * 0.30; // Flat tax
  
  const netPea = futureValuePea - taxPea;
  const netCto = futureValueCto - taxCto;
  const savings = netPea - netCto;

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-info/5 border border-info/15">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-info" />
          Votre PEA actuel
        </h3>
        <p className="text-2xl font-bold">{formatCurrency(currentPeaBalance)}</p>
        <p className="text-xs text-muted-foreground">Plafond : 150 000 €</p>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="investment" className="text-sm font-medium">
            Montant à investir
          </Label>
          <div className="flex items-center gap-4">
            <Input
              id="investment"
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Number(e.target.value))}
              className="text-lg font-semibold"
              min={0}
              max={150000 - currentPeaBalance}
            />
            <span className="text-sm text-muted-foreground shrink-0">€</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="years" className="text-sm font-medium">
            Horizon de placement
          </Label>
          <div className="flex items-center gap-4">
            <Input
              id="years"
              type="number"
              value={years}
              onChange={(e) => setYears(Math.max(5, Number(e.target.value)))}
              className="text-lg font-semibold"
              min={5}
              max={40}
            />
            <span className="text-sm text-muted-foreground shrink-0">ans</span>
          </div>
        </div>
      </div>

      {/* Comparison result */}
      <motion.div 
        className="grid grid-cols-2 gap-3"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        key={`${investmentAmount}-${years}`}
      >
        <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-center">
          <p className="text-xs text-muted-foreground mb-1">Avec CTO</p>
          <p className="text-xl font-bold">{formatCurrency(netCto)}</p>
          <p className="text-xs text-destructive">-{formatCurrency(taxCto)} d'impôts</p>
        </div>
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
          <p className="text-xs text-muted-foreground mb-1">Avec PEA</p>
          <p className="text-xl font-bold text-success">{formatCurrency(netPea)}</p>
          <p className="text-xs text-success">-{formatCurrency(taxPea)} d'impôts</p>
        </div>
      </motion.div>

      <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
        <p className="text-sm text-muted-foreground">Économie avec le PEA</p>
        <p className="text-2xl font-bold text-success">+{formatCurrency(savings)}</p>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
        <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Simulation basée sur un rendement annuel moyen de 7%. Les performances passées ne préjugent pas des performances futures.
        </p>
      </div>
    </div>
  );
};

// Step 3: Action
const PEAActionStep = ({ onNext }: { onNext: () => void }) => {
  const [hasPea, setHasPea] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-center">Avez-vous déjà un PEA ?</h3>

      <RadioGroup value={hasPea || ''} onValueChange={setHasPea} className="space-y-3">
        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
          hasPea === 'yes' ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
        }`}>
          <RadioGroupItem value="yes" id="yes" />
          <Label htmlFor="yes" className="flex-1 cursor-pointer">
            <span className="font-medium">Oui, j'ai déjà un PEA</span>
            <p className="text-xs text-muted-foreground mt-0.5">Je veux optimiser mes investissements</p>
          </Label>
        </div>

        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
          hasPea === 'no' ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
        }`}>
          <RadioGroupItem value="no" id="no" />
          <Label htmlFor="no" className="flex-1 cursor-pointer">
            <span className="font-medium">Non, je n'ai pas encore de PEA</span>
            <p className="text-xs text-muted-foreground mt-0.5">Je veux en ouvrir un</p>
          </Label>
        </div>
      </RadioGroup>

      {hasPea === 'yes' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Actions recommandées
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                <span>Vérifiez l'ancienneté de votre PEA (5 ans minimum pour l'avantage fiscal)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                <span>Privilégiez les ETF diversifiés (MSCI World, S&P 500)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                <span>Évitez les retraits avant 5 ans (perte de l'avantage)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">4.</span>
                <span>Investissez régulièrement (DCA) pour lisser les risques</span>
              </li>
            </ul>
          </div>
        </motion.div>
      )}

      {hasPea === 'no' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-info" />
              Meilleurs PEA 2025
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 p-2 rounded-lg bg-background/50">
                <div className="flex-1">
                  <p className="font-medium">Boursorama</p>
                  <p className="text-xs text-muted-foreground">0€ de frais de garde</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">Recommandé</span>
              </li>
              <li className="flex items-start gap-3 p-2 rounded-lg bg-background/50">
                <div className="flex-1">
                  <p className="font-medium">Bourse Direct</p>
                  <p className="text-xs text-muted-foreground">Frais d'ordre bas</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">Low cost</span>
              </li>
              <li className="flex items-start gap-3 p-2 rounded-lg bg-background/50">
                <div className="flex-1">
                  <p className="font-medium">Fortuneo</p>
                  <p className="text-xs text-muted-foreground">Interface moderne</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-info/10 text-info">Équilibré</span>
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-info/10 border border-info/20">
            <p className="text-xs text-muted-foreground">
              💡 Ouvrez votre PEA maintenant, même avec 10€ : le compteur des 5 ans démarre immédiatement !
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Step 4: Confirmation
const PEAConfirmationStep = ({ onNext }: { onNext: () => void }) => (
  <div className="space-y-6 text-center">
    <div className="p-6 rounded-2xl bg-success/10 border border-success/20">
      <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Prêt à optimiser !</h3>
      <p className="text-sm text-muted-foreground">
        Vous savez maintenant comment profiter de la fiscalité avantageuse du PEA.
      </p>
    </div>

    <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-left">
      <h4 className="font-semibold mb-3">À retenir</h4>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Ouvrir un PEA le plus tôt possible</span>
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Investir régulièrement (mensuel)</span>
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Ne pas retirer avant 5 ans</span>
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Privilégier les ETF diversifiés</span>
        </li>
      </ul>
    </div>
  </div>
);

// Export the complete guide
export const createPEAGuide = (estimatedGain: number = 1500): ActionGuide => ({
  id: 'pea-optimization',
  title: 'Ouvrir un PEA',
  subtitle: 'Fiscalité allégée sur vos investissements',
  category: 'investment',
  estimatedGain,
  effort: '1h',
  deadline: '2025-12-31',
  steps: [
    {
      id: 'education',
      title: 'Comprendre',
      description: 'Découvrez les avantages du PEA',
      type: 'education',
      component: PEAEducationStep
    },
    {
      id: 'simulation',
      title: 'Simuler',
      description: 'Calculez vos gains potentiels',
      type: 'simulation',
      component: PEASimulationStep
    },
    {
      id: 'action',
      title: 'Agir',
      description: 'Passez à l\'action concrète',
      type: 'action',
      component: PEAActionStep
    },
    {
      id: 'confirmation',
      title: 'Confirmer',
      description: 'Validez votre action',
      type: 'confirmation',
      component: PEAConfirmationStep
    }
  ]
});
