import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  PiggyBank, 
  Target,
  BookOpen,
  TrendingUp,
  Shield,
  Scale,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Settings2,
  Layers
} from 'lucide-react';
import { SavingsInputs, SavingsSimulationResults } from '@/lib/savingsTypes';
import { generateSavingsSimulation, formatEuro } from '@/lib/savingsCalculations';
import { EnvelopesOverview } from '@/components/savings/EnvelopesOverview';
import { SavingsInputForm } from '@/components/savings/SavingsInputForm';
import { SimulationResults } from '@/components/savings/SimulationResults';
import { ComparisonTable } from '@/components/savings/ComparisonTable';
import { WarningsAndDisclaimer } from '@/components/savings/WarningsAndDisclaimer';
import { IndicesSelector } from '@/components/savings/IndicesSelector';
import { RiskAnalysis } from '@/components/savings/RiskAnalysis';
import { PersonalizationStep } from '@/components/savings/PersonalizationStep';

const STEPS = [
  { id: 'intro', title: 'Introduction', icon: BookOpen },
  { id: 'envelopes', title: 'Enveloppes', icon: PiggyBank },
  { id: 'params', title: 'Paramètres', icon: Target },
  { id: 'personalization', title: 'Personnalisation', icon: Settings2 },
  { id: 'indices-pea', title: 'Indices PEA', icon: Layers },
  { id: 'indices-per', title: 'Indices PER', icon: Layers },
  { id: 'risks', title: 'Analyse risques', icon: BarChart3 },
  { id: 'pea', title: 'Simulation PEA', icon: TrendingUp },
  { id: 'per', title: 'Simulation PER', icon: Shield },
  { id: 'comparison', title: 'Comparaison', icon: Scale },
  { id: 'warnings', title: 'Vigilance', icon: AlertTriangle },
  { id: 'conclusion', title: 'Conclusion', icon: CheckCircle2 },
];

const DEFAULT_INPUTS: SavingsInputs = {
  monthlyContribution: 200,
  durationYears: 20,
  profile: 'equilibre',
  tmi: 30,
  age: 35,
  objective: 'capital',
};

export default function SavingsSimulator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState<SavingsInputs>(DEFAULT_INPUTS);
  const [selectedProfileId, setSelectedProfileId] = useState('equilibre');
  const [selectedPeaIndices, setSelectedPeaIndices] = useState<string[]>(['msci-world']);
  const [selectedPerIndices, setSelectedPerIndices] = useState<string[]>(['msci-world', 'fonds-euros']);

  // Generate simulation results
  const results: SavingsSimulationResults = useMemo(() => {
    return generateSavingsSimulation(inputs);
  }, [inputs]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'intro':
        return <IntroductionStep inputs={inputs} />;
      case 'envelopes':
        return <EnvelopesOverview />;
      case 'params':
        return <SavingsInputForm inputs={inputs} onChange={setInputs} />;
      case 'personalization':
        return (
          <PersonalizationStep 
            inputs={inputs} 
            onChange={setInputs}
            onProfileSelect={setSelectedProfileId}
            selectedProfileId={selectedProfileId}
          />
        );
      case 'indices-pea':
        return (
          <IndicesSelector 
            envelope="pea" 
            selectedIndices={selectedPeaIndices}
            onSelect={setSelectedPeaIndices}
          />
        );
      case 'indices-per':
        return (
          <IndicesSelector 
            envelope="per" 
            selectedIndices={selectedPerIndices}
            onSelect={setSelectedPerIndices}
          />
        );
      case 'risks':
        return (
          <RiskAnalysis 
            selectedProfileId={selectedProfileId}
            horizon={inputs.durationYears}
            monthlyContribution={inputs.monthlyContribution}
          />
        );
      case 'pea':
        return <SimulationResults title="PEA" simulations={results.pea} />;
      case 'per':
        return <SimulationResults title="PER" simulations={results.per} showTaxSavings />;
      case 'comparison':
        return <ComparisonTable results={results} />;
      case 'warnings':
        return <WarningsAndDisclaimer />;
      case 'conclusion':
        return (
          <ConclusionStep 
            inputs={inputs} 
            results={results} 
            profileId={selectedProfileId}
            onRestart={() => setCurrentStep(0)} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <PiggyBank className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold">Simulation d'épargne long terme</h1>
          </div>
          <p className="text-muted-foreground">
            Comprenez et projetez votre épargne avec les enveloppes PEA et PER — indices détaillés, risques et performances.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Étape {currentStep + 1} / {STEPS.length} — {STEPS[currentStep].title}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Step indicators - scrollable on mobile */}
          <div className="flex justify-between mt-4 overflow-x-auto pb-2 gap-1">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`flex flex-col items-center gap-1 transition-all min-w-[48px] ${
                    isActive ? 'text-primary' : isPast ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`p-1.5 md:p-2 rounded-full transition-all ${
                    isActive ? 'bg-primary/10 ring-2 ring-primary' : 
                    isPast ? 'bg-success/10' : 'bg-muted/30'
                  }`}>
                    <StepIcon className="h-3 w-3 md:h-4 md:w-4" />
                  </div>
                  <span className="text-[10px] md:text-xs hidden lg:block whitespace-nowrap">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[500px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={goNext} className="gap-2">
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep(2)} variant="outline" className="gap-2">
              Modifier les paramètres
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Introduction Step Component
function IntroductionStep({ inputs }: { inputs: SavingsInputs }) {
  const objectiveLabels = {
    retraite: 'compléter vos revenus à la retraite',
    capital: 'constituer un capital long terme',
    complement: 'disposer d\'un complément futur',
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card gradient-border">
        <CardContent className="p-8 text-center">
          <PiggyBank className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Simulation d'épargne long terme</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cette simulation vise à vous aider à comprendre comment épargner progressivement 
            via des solutions simples et accessibles en France.
          </p>
        </CardContent>
      </Card>

      {/* User Profile Summary */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Votre profil
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Âge</p>
              <p className="text-xl font-bold">{inputs.age} ans</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">TMI</p>
              <p className="text-xl font-bold">{inputs.tmi}%</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Objectif</p>
              <p className="text-xl font-bold capitalize">{inputs.objective}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Vous souhaitez <strong>{objectiveLabels[inputs.objective]}</strong>.
          </p>
        </CardContent>
      </Card>

      {/* What's new */}
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ce que vous allez découvrir
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Layers className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Indices détaillés</p>
                <p className="text-xs text-muted-foreground">MSCI World, S&P 500, STOXX 600, Émergents...</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <BarChart3 className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-sm">Performances historiques</p>
                <p className="text-xs text-muted-foreground">Données réelles 2015-2024</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-sm">Analyse des risques</p>
                <p className="text-xs text-muted-foreground">Volatilité, drawdown, scénarios</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Settings2 className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="font-medium text-sm">5 profils de risque</p>
                <p className="text-xs text-muted-foreground">De sécuritaire à offensif</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Message */}
      <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
        <p className="text-lg font-medium text-primary">
          🌱 L'épargne est un marathon, pas un sprint.
        </p>
        <p className="text-muted-foreground mt-2">
          Le facteur le plus puissant reste <strong>le temps</strong>.
        </p>
      </div>
    </div>
  );
}

// Conclusion Step Component
function ConclusionStep({ 
  inputs, 
  results,
  profileId,
  onRestart 
}: { 
  inputs: SavingsInputs; 
  results: SavingsSimulationResults;
  profileId: string;
  onRestart: () => void;
}) {
  const peaEquilibre = results.pea.equilibre;
  const perEquilibre = results.per.equilibre;

  return (
    <div className="space-y-6">
      <Card className="glass-card gradient-border">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Comprendre est la première étape</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Vous avez maintenant une vision claire des mécanismes d'épargne long terme en France,
            des indices disponibles et des risques associés.
          </p>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Récapitulatif de votre simulation</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold">PEA (Équilibré)</span>
              </div>
              <p className="text-2xl font-bold text-primary">{formatEuro(peaEquilibre.capitalEnd)}</p>
              <p className="text-sm text-muted-foreground">
                dont {formatEuro(peaEquilibre.interestTotal)} d'intérêts
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-accent" />
                <span className="font-semibold">PER (Équilibré)</span>
              </div>
              <p className="text-2xl font-bold text-accent">{formatEuro(perEquilibre.capitalEnd)}</p>
              <p className="text-sm text-muted-foreground">
                effort net : {formatEuro(perEquilibre.netEffort ?? perEquilibre.totalContributed)}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Avec {formatEuro(inputs.monthlyContribution)}/mois pendant {inputs.durationYears} ans, 
              vous auriez versé {formatEuro(inputs.monthlyContribution * 12 * inputs.durationYears)} au total.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Learnings */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Ce que vous avez appris</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <Layers className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-medium">Indices</p>
              <p className="text-xs text-muted-foreground">
                MSCI World, S&P 500, STOXX 600 et leurs caractéristiques
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <BarChart3 className="h-5 w-5 text-success mb-2" />
              <p className="text-sm font-medium">Performances</p>
              <p className="text-xs text-muted-foreground">
                8-13% annualisés sur 10 ans pour les actions monde
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <AlertTriangle className="h-5 w-5 text-warning mb-2" />
              <p className="text-sm font-medium">Risques</p>
              <p className="text-xs text-muted-foreground">
                Volatilité, change, timing - importance de l'horizon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Prochaines étapes suggérées
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <span className="text-primary font-bold">1</span>
              <p className="text-sm text-muted-foreground">
                <strong>Ajustez les paramètres</strong> pour explorer d'autres durées, montants ou profils de risque
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <span className="text-primary font-bold">2</span>
              <p className="text-sm text-muted-foreground">
                <strong>Comparez les courtiers</strong> proposant des PEA/PER à faibles frais (Boursorama, Fortuneo, Trade Republic...)
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <span className="text-primary font-bold">3</span>
              <p className="text-sm text-muted-foreground">
                <strong>Consultez un conseiller</strong> pour un accompagnement personnalisé si nécessaire
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onRestart} variant="outline" size="lg">
          Recommencer la simulation
        </Button>
        <Button size="lg" className="gap-2">
          Exporter en PDF
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
