import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  Calculator, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Receipt,
  Scale,
  FileText
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { ActionGuide } from '../ActionGuideContext';

// Step 1: Education
const RegimeReelEducationStep = ({ onNext }: { onNext: () => void }) => (
  <div className="space-y-6">
    <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold mb-2">Micro vs Réel : quelle différence ?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            En <strong>micro-entreprise</strong>, un abattement forfaitaire est appliqué (22% pour services).
            En <strong>régime réel</strong>, vous déduisez vos charges réelles.
          </p>
        </div>
      </div>
    </div>

    {/* Comparison */}
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
        <Receipt className="h-6 w-6 text-info mb-2" />
        <p className="text-sm font-medium">Micro</p>
        <p className="text-xs text-muted-foreground mt-1">Abattement forfaitaire</p>
        <p className="text-xs text-muted-foreground">Simple, pas de compta</p>
      </div>
      <div className="p-4 rounded-xl bg-success/5 border border-success/20">
        <Scale className="h-6 w-6 text-success mb-2" />
        <p className="text-sm font-medium">Réel</p>
        <p className="text-xs text-muted-foreground mt-1">Charges déduites</p>
        <p className="text-xs text-muted-foreground">Comptable nécessaire</p>
      </div>
    </div>

    {/* When is it interesting */}
    <div className="p-4 rounded-xl bg-success/5 border border-success/20">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-success" />
        Quand passer au réel ?
      </h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li>• Vos charges dépassent 22% de ton CA</li>
        <li>• Tu as des investissements importants (matériel, véhicule)</li>
        <li>• Vous approchez du plafond micro (77 700€)</li>
        <li>• Tu peux amortir du matériel coûteux</li>
      </ul>
    </div>

    <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
      <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
      <p className="text-xs text-muted-foreground">
        Le passage au réel nécessite une comptabilité rigoureuse et souvent un expert-comptable.
      </p>
    </div>
  </div>
);

// Step 2: Simulation
const RegimeReelSimulationStep = ({ onNext, profile }: { onNext: () => void; profile?: UserProfile | null }) => {
  const ca = profile?.annualRevenueHt || 50000;
  const [charges, setCharges] = useState(profile?.socialChargesPaid || 0 + (profile?.officeRent || 0) * 12 + (profile?.vehicleExpenses || 0) + (profile?.professionalSupplies || 0) || 10000);
  
  // Micro calculation (22% abattement for services)
  const abattementMicro = ca * 0.22;
  const baseMicro = ca - abattementMicro;
  
  // Réel calculation
  const baseReel = ca - charges;
  
  // Simplified social charges (22% for micro, variable for réel)
  const cotisationsMicro = ca * 0.22;
  const cotisationsReel = Math.max(0, baseReel * 0.45); // Approximation
  
  // IR (simplified at 30% TMI)
  const irMicro = baseMicro * 0.30;
  const irReel = Math.max(0, baseReel * 0.30);
  
  const totalMicro = cotisationsMicro + irMicro;
  const totalReel = cotisationsReel + irReel;
  
  const difference = totalMicro - totalReel;
  const isReelBetter = difference > 0;

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-info/5 border border-info/15">
        <h3 className="font-semibold mb-2">Ta situation actuelle</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">CA annuel</p>
            <p className="font-semibold">{formatCurrency(ca)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Statut</p>
            <p className="font-semibold">{profile?.fiscalStatus === 'micro' ? 'Micro-entreprise' : 'Régime réel'}</p>
          </div>
        </div>
      </div>

      {/* Input charges */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Total de vos charges annuelles déductibles
        </Label>
        <div className="flex items-center gap-4">
          <Input
            type="number"
            value={charges}
            onChange={(e) => setCharges(Number(e.target.value))}
            className="text-lg font-semibold"
          />
          <span className="text-sm text-muted-foreground shrink-0">€ / an</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Inclut : loyer bureau, cotisations, véhicule, matériel, sous-traitance...
        </p>
      </div>

      {/* Comparison */}
      <motion.div 
        className="grid grid-cols-2 gap-3"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        key={charges}
      >
        <div className={`p-4 rounded-xl ${!isReelBetter ? 'bg-success/10 border border-success/20' : 'bg-muted/30 border border-border/30'}`}>
          <p className="text-xs text-muted-foreground mb-1">Micro-entreprise</p>
          <p className={`text-xl font-bold ${!isReelBetter ? 'text-success' : ''}`}>
            {formatCurrency(totalMicro)}
          </p>
          <p className="text-xs text-muted-foreground">charges + IR</p>
        </div>
        <div className={`p-4 rounded-xl ${isReelBetter ? 'bg-success/10 border border-success/20' : 'bg-muted/30 border border-border/30'}`}>
          <p className="text-xs text-muted-foreground mb-1">Régime réel</p>
          <p className={`text-xl font-bold ${isReelBetter ? 'text-success' : ''}`}>
            {formatCurrency(totalReel)}
          </p>
          <p className="text-xs text-muted-foreground">charges + IR</p>
        </div>
      </motion.div>

      {/* Verdict */}
      {isReelBetter ? (
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
          <p className="text-sm text-muted-foreground">Le régime réel vous ferait économiser</p>
          <p className="text-2xl font-bold text-success">+{formatCurrency(difference)}/an</p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-info/10 border border-info/20 text-center">
          <p className="text-sm text-muted-foreground">Le micro-entreprise reste avantageux</p>
          <p className="text-xs text-info mt-1">
            Économie de {formatCurrency(Math.abs(difference))} vs le réel
          </p>
        </div>
      )}

      <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
        <p className="text-xs text-muted-foreground">
          ⚠️ Simulation indicative. Consulte un expert-comptable pour une analyse précise.
        </p>
      </div>
    </div>
  );
};

// Step 3: Action
const RegimeReelActionStep = ({ onNext }: { onNext: () => void }) => {
  const [decision, setDecision] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-center">Que souhaitez-vous faire ?</h3>

      <RadioGroup value={decision || ''} onValueChange={setDecision} className="space-y-3">
        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
          decision === 'change' ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
        }`}>
          <RadioGroupItem value="change" id="change" />
          <Label htmlFor="change" className="flex-1 cursor-pointer">
            <span className="font-medium">Passer au régime réel</span>
            <p className="text-xs text-muted-foreground mt-0.5">Je veux optimiser mes charges</p>
          </Label>
        </div>

        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
          decision === 'consult' ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
        }`}>
          <RadioGroupItem value="consult" id="consult" />
          <Label htmlFor="consult" className="flex-1 cursor-pointer">
            <span className="font-medium">Consulter un expert-comptable</span>
            <p className="text-xs text-muted-foreground mt-0.5">Je veux un avis professionnel</p>
          </Label>
        </div>

        <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
          decision === 'keep' ? 'border-primary bg-primary/5' : 'border-border/30 hover:border-primary/30'
        }`}>
          <RadioGroupItem value="keep" id="keep" />
          <Label htmlFor="keep" className="flex-1 cursor-pointer">
            <span className="font-medium">Rester en micro-entreprise</span>
            <p className="text-xs text-muted-foreground mt-0.5">Le statut actuel me convient</p>
          </Label>
        </div>
      </RadioGroup>

      {decision === 'change' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-muted/30 border border-border/30"
        >
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-info" />
            Étapes pour passer au réel
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">1.</span>
              <span>Optez avant le 30 septembre N pour l'année N+1</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">2.</span>
              <span>Trouvez un expert-comptable (obligatoire ou recommandé)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">3.</span>
              <span>Mettez en place une comptabilité rigoureuse</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">4.</span>
              <span>Conservez tous vos justificatifs de charges</span>
            </li>
          </ul>
        </motion.div>
      )}

      {decision === 'consult' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-info/5 border border-info/20"
        >
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-info" />
            Trouver un expert-comptable
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Plateformes en ligne : Dougs, Indy, L-Expert-comptable</li>
            <li>• Cabinet traditionnel de proximité</li>
            <li>• Budget : 80-150€/mois en moyenne</li>
            <li>• Premier RDV souvent gratuit</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

// Step 4: Confirmation
const RegimeReelConfirmationStep = ({ onNext }: { onNext: () => void }) => (
  <div className="space-y-6 text-center">
    <div className="p-6 rounded-2xl bg-success/10 border border-success/20">
      <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Analyse terminée !</h3>
      <p className="text-sm text-muted-foreground">
        Tu as les éléments pour décider du meilleur régime fiscal.
      </p>
    </div>

    <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-left">
      <h4 className="font-semibold mb-3">Points clés à retenir</h4>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Comparer charges réelles vs 22% d'abattement</span>
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Anticiper les frais de comptabilité</span>
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Option à exercer avant le 30/09</span>
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>L'option est valable 2 ans minimum</span>
        </li>
      </ul>
    </div>
  </div>
);

// Export the complete guide
export const createRegimeReelGuide = (estimatedGain: number = 2000): ActionGuide => ({
  id: 'regime-reel',
  title: 'Étudier le passage au réel',
  subtitle: 'Optimisez la fiscalité de ton activité',
  category: 'status',
  estimatedGain,
  effort: 'Étude comptable',
  deadline: '2025-09-30',
  steps: [
    {
      id: 'education',
      title: 'Comprendre',
      description: 'Micro vs Réel expliqué',
      type: 'education',
      component: RegimeReelEducationStep
    },
    {
      id: 'simulation',
      title: 'Simuler',
      description: 'Comparez les deux régimes',
      type: 'simulation',
      component: RegimeReelSimulationStep
    },
    {
      id: 'action',
      title: 'Décider',
      description: 'Choisissez votre option',
      type: 'action',
      component: RegimeReelActionStep
    },
    {
      id: 'confirmation',
      title: 'Confirmer',
      description: 'Validez votre décision',
      type: 'confirmation',
      component: RegimeReelConfirmationStep
    }
  ]
});
