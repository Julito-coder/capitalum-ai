import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Lock, Calendar, Users, Baby, Briefcase, Wallet, Home, MapPin, Car, FileText, Heart, PiggyBank, Shield, Milestone, TrendingUp, Gauge } from 'lucide-react';
import { QuizAnswers, DEFAULT_QUIZ_ANSWERS, QuizQuestion } from '@/types/onboarding';
import { calculateDiagnostic } from '@/services/scoring/diagnosticEngine';
import { storeQuizData } from '@/hooks/usePostAuthQuizSync';
import { QuizProgress } from './QuizProgress';
import { QuizStep } from './QuizStep';
import { QuizOption, QuizGridOption } from './QuizOption';
import { QuizResult } from './QuizResult';
import { Button } from '@/components/ui/button';
import elioSymbol from '@/assets/elio-symbol-blue.svg';

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'age', icon: 'Calendar', title: 'Quel âge as-tu ?',
    description: 'Certaines aides et obligations dépendent de ton âge.',
    type: 'single', field: 'age',
    options: [
      { value: '18-24', label: '18 – 24 ans' },
      { value: '25-34', label: '25 – 34 ans' },
      { value: '35-49', label: '35 – 49 ans' },
      { value: '50-64', label: '50 – 64 ans' },
      { value: '65+', label: '65 ans et plus' },
    ],
  },
  {
    id: 'family', icon: 'Users', title: 'Quelle est ta situation familiale ?',
    description: 'Ton foyer fiscal influence directement ton imposition.',
    type: 'single', field: 'familySituation',
    options: [
      { value: 'single', label: 'Célibataire' },
      { value: 'couple_married', label: 'Marié·e ou pacsé·e' },
      { value: 'couple_unmarried', label: 'En couple, ni marié·e ni pacsé·e' },
      { value: 'divorced', label: 'Divorcé·e ou séparé·e' },
      { value: 'widowed', label: 'Veuf ou veuve' },
    ],
  },
  {
    id: 'children', icon: 'Baby', title: 'Combien d\'enfants as-tu à charge ?',
    description: 'Les enfants modifient ton quotient familial et ouvrent des droits.',
    type: 'grid', field: 'children',
    options: [
      { value: '0', label: 'Aucun' },
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4' },
      { value: '5+', label: '5+' },
    ],
  },
  {
    id: 'professional', icon: 'Briefcase', title: 'Quel est ton statut professionnel ?',
    description: 'Tes obligations fiscales et aides possibles en dépendent.',
    type: 'single', field: 'professionalStatus',
    options: [
      { value: 'employee', label: 'Salarié·e du privé' },
      { value: 'public_employee', label: 'Fonctionnaire / salarié·e du public' },
      { value: 'self_employed', label: 'Indépendant·e / freelance' },
      { value: 'student', label: 'Étudiant·e' },
      { value: 'unemployed', label: 'Sans emploi / en recherche' },
      { value: 'retired', label: 'Retraité·e' },
    ],
  },
  {
    id: 'income', icon: 'Wallet', title: 'Quel est ton revenu net annuel approximatif ?',
    description: 'Une estimation suffit. Cela permet de calculer tes droits.',
    type: 'single', field: 'annualIncome',
    options: [
      { value: '0-10k', label: 'Moins de 10 000 €' },
      { value: '10-18k', label: '10 000 – 18 000 €' },
      { value: '18-26k', label: '18 000 – 26 000 €' },
      { value: '26-36k', label: '26 000 – 36 000 €' },
      { value: '36-50k', label: '36 000 – 50 000 €' },
      { value: '50-80k', label: '50 000 – 80 000 €' },
      { value: '80k+', label: 'Plus de 80 000 €' },
    ],
  },
  {
    id: 'housing', icon: 'Home', title: 'Tu es propriétaire ou locataire ?',
    description: 'Cela détermine certaines aides et impôts spécifiques.',
    type: 'single', field: 'housing',
    options: [
      { value: 'owner_no_mortgage', label: 'Propriétaire, sans crédit en cours' },
      { value: 'owner_mortgage', label: 'Propriétaire, avec un crédit en cours' },
      { value: 'tenant', label: 'Locataire' },
      { value: 'hosted', label: 'Hébergé·e gratuitement' },
    ],
  },
  {
    id: 'zone', icon: 'MapPin', title: 'Dans quelle zone habites-tu ?',
    description: 'Le montant des aides au logement varie selon ta zone.',
    type: 'single', field: 'zone',
    options: [
      { value: 'zone_1', label: 'Paris et petite couronne', subtitle: 'Paris, Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne' },
      { value: 'zone_2', label: 'Grande ville ou Île-de-France élargie', subtitle: 'Agglomérations de plus de 100 000 habitants' },
      { value: 'zone_3', label: 'Autre commune', subtitle: 'Villes moyennes, zones rurales' },
    ],
  },
  {
    id: 'transport', icon: 'Car', title: 'Comment te rends-tu au travail ?',
    description: 'Les frais de transport peuvent être déductibles de tes impôts.',
    type: 'single', field: 'transport',
    condition: (a) => ['employee', 'public_employee', 'self_employed'].includes(a.professionalStatus ?? ''),
    options: [
      { value: 'car_short', label: 'Voiture — moins de 20 km aller' },
      { value: 'car_long', label: 'Voiture — 20 km ou plus aller' },
      { value: 'public_transport', label: 'Transports en commun' },
      { value: 'bike_walk', label: 'Vélo ou à pied' },
      { value: 'remote', label: 'Télétravail principalement' },
    ],
  },
  {
    id: 'tax', icon: 'FileText', title: 'Comment remplis-tu ta déclaration d\'impôts ?',
    description: 'Beaucoup de Français valident sans vérifier. On perd de l\'argent à ce moment-là.',
    type: 'single', field: 'taxDeclaration',
    options: [
      { value: 'auto_validate', label: 'Je valide la déclaration pré-remplie sans modifier' },
      { value: 'self_check', label: 'Je vérifie et modifie moi-même certaines cases' },
      { value: 'accountant', label: 'Un comptable ou un conseiller s\'en occupe' },
      { value: 'never_done', label: 'Je n\'ai jamais fait de déclaration' },
    ],
  },
  {
    id: 'donations', icon: 'Heart', title: 'Fais-tu des dons à des associations ou organismes ?',
    description: 'Les dons ouvrent droit à une réduction d\'impôt de 66% à 75%.',
    type: 'single', field: 'donations',
    options: [
      { value: 'no_donations', label: 'Non, je ne fais pas de dons' },
      { value: 'donations_declared', label: 'Oui, et je les déclare' },
      { value: 'donations_not_declared', label: 'Oui, mais je ne les déclare pas' },
    ],
  },
  {
    id: 'savings', icon: 'PiggyBank', title: 'Quels placements as-tu actuellement ?',
    description: 'Certains placements réduisent tes impôts. D\'autres coûtent cher en fiscalité.',
    type: 'multi', field: 'savings',
    options: [
      { value: 'livret_a', label: 'Livret A / LDDS uniquement' },
      { value: 'assurance_vie', label: 'Assurance-vie' },
      { value: 'per', label: 'Plan Épargne Retraite (PER)' },
      { value: 'pea', label: 'PEA (Plan Épargne en Actions)' },
      { value: 'scpi_immo', label: 'Immobilier locatif / SCPI' },
      { value: 'none', label: 'Aucun placement' },
    ],
  },
  {
    id: 'aids', icon: 'Shield', title: 'Reçois-tu actuellement l\'une de ces aides ?',
    description: 'Coche celles que tu perçois déjà. On vérifiera si tu en oublies.',
    type: 'multi', field: 'currentAids',
    options: [
      { value: 'apl', label: 'APL (aide au logement)' },
      { value: 'prime_activite', label: 'Prime d\'activité' },
      { value: 'css', label: 'Complémentaire santé solidaire (CSS)' },
      { value: 'ars', label: 'Allocation de rentrée scolaire (ARS)' },
      { value: 'cheque_energie', label: 'Chèque énergie' },
      { value: 'allocations_familiales', label: 'Allocations familiales' },
      { value: 'none', label: 'Aucune de ces aides' },
    ],
  },
  {
    id: 'events', icon: 'Milestone', title: 'As-tu vécu l\'un de ces événements récemment ?',
    description: 'Chaque changement de vie a des conséquences fiscales, souvent ignorées.',
    type: 'multi', field: 'lifeEvents',
    options: [
      { value: 'marriage_pacs', label: 'Mariage ou PACS' },
      { value: 'birth', label: 'Naissance ou adoption' },
      { value: 'divorce', label: 'Séparation ou divorce' },
      { value: 'property_purchase', label: 'Achat immobilier' },
      { value: 'job_change', label: 'Changement d\'emploi ou de statut' },
      { value: 'retirement', label: 'Départ en retraite' },
      { value: 'none', label: 'Aucun changement récent' },
    ],
  },
  {
    id: 'investments', icon: 'TrendingUp', title: 'Possèdes-tu l\'un de ces investissements ?',
    description: 'Certains investissements nécessitent des déclarations spécifiques souvent oubliées.',
    type: 'multi', field: 'investments',
    options: [
      { value: 'rental_property', label: 'Bien immobilier en location' },
      { value: 'crypto', label: 'Crypto-monnaies (Bitcoin, Ethereum, etc.)' },
      { value: 'foreign_accounts', label: 'Comptes à l\'étranger (N26, Revolut, etc.)' },
      { value: 'stock_options', label: 'Actions, stock-options ou dividendes' },
      { value: 'none', label: 'Aucun de ces investissements' },
    ],
  },
  {
    id: 'confidence', icon: 'Gauge', title: 'Comment te sens-tu face à tes démarches fiscales ?',
    description: 'Sois honnête. Cette réponse nous aide à personnaliser tes recommandations.',
    type: 'single', field: 'confidence',
    options: [
      { value: 'lost', label: 'Complètement perdu·e, je ne comprends rien' },
      { value: 'anxious', label: 'Stressé·e, j\'ai peur de faire des erreurs' },
      { value: 'passive', label: 'Je fais le minimum, sans savoir si c\'est bien' },
      { value: 'okay', label: 'Je me débrouille, mais je rate sûrement des choses' },
      { value: 'confident', label: 'À l\'aise, je maîtrise ma situation' },
    ],
  },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Calendar, Users, Baby, Briefcase, Wallet, Home, MapPin, Car, FileText, Heart, PiggyBank, Shield, Milestone, TrendingUp, Gauge,
};

export const OnboardingQuiz = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'welcome' | 'quiz' | 'result'>('welcome');
  const [answers, setAnswers] = useState<QuizAnswers>({ ...DEFAULT_QUIZ_ANSWERS });
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeQuestions = useMemo(
    () => QUESTIONS.filter((q) => !q.condition || q.condition(answers)),
    [answers]
  );

  const currentQuestion = activeQuestions[stepIndex];
  const totalSteps = activeQuestions.length;
  const isLastStep = stepIndex === totalSteps - 1;

  const result = useMemo(() => calculateDiagnostic(answers), [answers]);

  const canContinue = useMemo(() => {
    if (!currentQuestion) return false;
    const field = currentQuestion.field;
    const val = answers[field];
    if (Array.isArray(val)) return val.length > 0;
    return val !== null;
  }, [currentQuestion, answers]);

  const handleSingleSelect = useCallback((field: keyof QuizAnswers, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleMultiSelect = useCallback((field: keyof QuizAnswers, value: string) => {
    setAnswers((prev) => {
      const current = (prev[field] as string[]) || [];
      if (value === 'none') return { ...prev, [field]: ['none'] };
      const filtered = current.filter((v) => v !== 'none');
      const exists = filtered.includes(value);
      return {
        ...prev,
        [field]: exists ? filtered.filter((v) => v !== value) : [...filtered, value],
      };
    });
  }, []);

  const next = useCallback(() => {
    if (isLastStep) {
      setPhase('result');
    } else {
      setDirection(1);
      setStepIndex((i) => i + 1);
    }
  }, [isLastStep]);

  const prev = useCallback(() => {
    if (stepIndex > 0) {
      setDirection(-1);
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex]);

  const handleFinish = useCallback(() => {
    setIsSubmitting(true);
    localStorage.setItem('elio_diagnostic', JSON.stringify({ answers, result }));

    const ageMap: Record<string, 'eighteen_25' | '26_35' | '36_50' | '51_plus'> = {
      '18-24': '18_25' as never, '25-34': '26_35', '35-49': '36_50', '50-64': '51_plus', '65+': '51_plus',
    };
    const proMap: Record<string, 'employee' | 'self_employed' | 'student' | 'job_seeker' | 'retired'> = {
      employee: 'employee', public_employee: 'employee', self_employed: 'self_employed',
      student: 'student', unemployed: 'job_seeker', retired: 'retired',
    };
    const famMap: Record<string, 'single' | 'couple' | 'married' | 'divorced'> = {
      single: 'single', couple_married: 'married', couple_unmarried: 'couple',
      divorced: 'divorced', widowed: 'single',
    };
    const taxMap: Record<string, 'online_self' | 'accountant' | 'not_yet' | 'unknown'> = {
      auto_validate: 'online_self', self_check: 'online_self', accountant: 'accountant', never_done: 'not_yet',
    };
    const childVal = answers.children ?? '0';
    const childrenRange = (['3', '4', '5+'].includes(childVal) ? '3_or_more' : childVal === '0' ? 'none' : childVal) as 'none' | '1' | '2' | '3_or_more';
    const housingVal = answers.housing === 'owner_no_mortgage' ? 'owner_paid' : answers.housing === 'hosted' ? 'hosted' : (answers.housing ?? 'tenant');

    storeQuizData({
      data: {
        ageRange: (ageMap[answers.age ?? '25-34'] ?? '26_35') as '18_25' | '26_35' | '36_50' | '51_plus',
        professionalStatus: proMap[answers.professionalStatus ?? 'employee'] ?? 'employee',
        familyStatus: famMap[answers.familySituation ?? 'single'] ?? 'single',
        childrenRange,
        housingStatus: housingVal as 'tenant' | 'owner_mortgage' | 'owner_paid' | 'hosted',
        incomeRange: 'less_1500',
        savingsRange: 'none',
        taxDeclarationMode: taxMap[answers.taxDeclaration ?? 'auto_validate'] ?? 'unknown',
        fullName: '',
      },
      score: result.score,
      totalLoss: result.totalLoss,
    });
    navigate('/auth?tab=signup');
  }, [answers, result, navigate]);

  const handleLogin = useCallback(() => {
    navigate('/auth?tab=login');
  }, [navigate]);

  // ─── WELCOME SCREEN ───
  if (phase === 'welcome') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.img
          src={elioSymbol}
          alt="Élio"
          className="h-12 w-12 mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
        <motion.h1
          className="text-2xl font-bold text-foreground text-center mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          Découvre combien tu perds chaque année
        </motion.h1>
        <motion.p
          className="text-base text-muted-foreground text-center mb-8 max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          15 questions rapides. 2 minutes. Résultat immédiat.
        </motion.p>
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Button
            onClick={() => setPhase('quiz')}
            className="w-full h-12 rounded-lg font-semibold text-sm"
          >
            Commencer mon diagnostic
          </Button>
        </motion.div>
        <motion.p
          className="flex items-center gap-1.5 text-xs text-muted-foreground mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Lock className="h-3 w-3" />
          Tes données restent privées et sécurisées.
        </motion.p>
        <motion.button
          onClick={handleLogin}
          className="mt-6 text-sm text-muted-foreground underline underline-offset-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          J'ai déjà un compte
        </motion.button>
      </div>
    );
  }

  // ─── RESULT SCREEN ───
  if (phase === 'result') {
    return <QuizResult result={result} onFinish={handleFinish} isSubmitting={isSubmitting} />;
  }

  // ─── QUIZ QUESTIONS ───
  const Icon = ICON_MAP[currentQuestion.icon] ?? Calendar;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="px-4 pt-3">
        <QuizProgress current={stepIndex} total={totalSteps} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        {stepIndex > 0 ? (
          <button onClick={prev} className="p-1">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        ) : (
          <div className="w-7" />
        )}
        <span className="text-xs text-muted-foreground">{stepIndex + 1}/{totalSteps}</span>
      </div>

      {/* Question content */}
      <div className="flex-1 flex flex-col px-6 pb-4 overflow-y-auto">
        <QuizStep stepKey={currentQuestion.id} direction={direction}>
          <div className="flex flex-col items-center mb-6">
            <Icon className="h-8 w-8 text-primary mb-3" />
            <h2 className="text-xl font-bold text-foreground text-center">{currentQuestion.title}</h2>
            <p className="text-sm text-muted-foreground text-center mt-1.5 max-w-xs">{currentQuestion.description}</p>
          </div>

          <div className={currentQuestion.type === 'grid' ? 'grid grid-cols-3 gap-3' : 'flex flex-col gap-3'}>
            {currentQuestion.options.map((opt) => {
              if (currentQuestion.type === 'grid') {
                return (
                  <QuizGridOption
                    key={opt.value}
                    label={opt.label}
                    selected={answers[currentQuestion.field] === opt.value}
                    onClick={() => handleSingleSelect(currentQuestion.field, opt.value)}
                  />
                );
              }

              const field = currentQuestion.field;
              const isMulti = currentQuestion.type === 'multi';
              const selected = isMulti
                ? ((answers[field] as string[]) || []).includes(opt.value)
                : answers[field] === opt.value;

              return (
                <QuizOption
                  key={opt.value}
                  label={opt.label}
                  subtitle={opt.subtitle}
                  selected={selected}
                  type={isMulti ? 'multi' : 'single'}
                  onClick={() =>
                    isMulti
                      ? handleMultiSelect(field, opt.value)
                      : handleSingleSelect(field, opt.value)
                  }
                />
              );
            })}
          </div>
        </QuizStep>
      </div>

      {/* Continue button - sticky bottom */}
      <div className="sticky bottom-0 bg-background px-6 pb-8 pt-3 border-t border-border/50">
        <Button
          onClick={next}
          disabled={!canContinue}
          className="w-full h-12 rounded-lg font-semibold text-sm"
        >
          {isLastStep ? 'Voir mon résultat' : 'Continuer'}
        </Button>
      </div>
    </div>
  );
};
