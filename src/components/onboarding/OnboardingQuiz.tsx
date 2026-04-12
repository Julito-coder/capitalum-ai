import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Lock, Calendar, Users, Baby, Briefcase, Wallet, Home,
  MapPin, Car, FileText, Heart, PiggyBank, Shield, Milestone, TrendingUp,
  Gauge, GraduationCap, Sun, Building2, Laptop, Search, UserCheck,
  CreditCard, Key, MapPinned, Train, Bike, Wifi,
  BookOpen, Landmark, BarChart3, Building, Bitcoin, Globe, LineChart,
  Frown, AlertCircle, Meh, SmilePlus, ThumbsUp,
  HeartHandshake, BabyIcon, Unlink, HomeIcon, RefreshCw, Armchair,
  Ban,
} from 'lucide-react';
import { QuizAnswers, DEFAULT_QUIZ_ANSWERS, QuizQuestion } from '@/types/onboarding';
import { calculateDiagnostic } from '@/services/scoring/diagnosticEngine';
import { storeQuizData } from '@/hooks/usePostAuthQuizSync';
import { QuizProgress } from './QuizProgress';
import { QuizStep } from './QuizStep';
import { QuizCardOption, QuizWideCard } from './QuizOption';
import { QuizResult } from './QuizResult';
import { Button } from '@/components/ui/button';
import elioSymbol from '@/assets/elio-symbol-blue.svg';
import React from 'react';

// ── Option icons per question ──
const OPTION_ICONS: Record<string, Record<string, React.ReactNode>> = {
  age: {
    '18-24': <GraduationCap className="h-7 w-7" />,
    '25-34': <Briefcase className="h-7 w-7" />,
    '35-49': <Home className="h-7 w-7" />,
    '50-64': <Heart className="h-7 w-7" />,
    '65+': <Sun className="h-7 w-7" />,
  },
  family: {
    single: <Users className="h-7 w-7" />,
    couple_married: <HeartHandshake className="h-7 w-7" />,
    couple_unmarried: <Heart className="h-7 w-7" />,
    divorced: <Unlink className="h-7 w-7" />,
    widowed: <UserCheck className="h-7 w-7" />,
  },
  children: {
    '0': <Ban className="h-7 w-7" />,
    '1': <BabyIcon className="h-7 w-7" />,
    '2': <Users className="h-7 w-7" />,
    '3': <Users className="h-7 w-7" />,
    '4': <Users className="h-7 w-7" />,
    '5+': <Users className="h-7 w-7" />,
  },
  professional: {
    employee: <Building2 className="h-7 w-7" />,
    public_employee: <Landmark className="h-7 w-7" />,
    self_employed: <Laptop className="h-7 w-7" />,
    student: <GraduationCap className="h-7 w-7" />,
    unemployed: <Search className="h-7 w-7" />,
    retired: <Sun className="h-7 w-7" />,
  },
  income: {
    '0-10k': <Wallet className="h-7 w-7" />,
    '10-18k': <Wallet className="h-7 w-7" />,
    '18-26k': <Wallet className="h-7 w-7" />,
    '26-36k': <Wallet className="h-7 w-7" />,
    '36-50k': <BarChart3 className="h-7 w-7" />,
    '50-80k': <BarChart3 className="h-7 w-7" />,
    '80k+': <TrendingUp className="h-7 w-7" />,
  },
  housing: {
    owner_no_mortgage: <Home className="h-7 w-7" />,
    owner_mortgage: <CreditCard className="h-7 w-7" />,
    tenant: <Key className="h-7 w-7" />,
    hosted: <Users className="h-7 w-7" />,
  },
  zone: {
    zone_1: <MapPinned className="h-7 w-7" />,
    zone_2: <Building className="h-7 w-7" />,
    zone_3: <MapPin className="h-7 w-7" />,
  },
  transport: {
    car_short: <Car className="h-7 w-7" />,
    car_long: <Car className="h-7 w-7" />,
    public_transport: <Train className="h-7 w-7" />,
    bike_walk: <Bike className="h-7 w-7" />,
    remote: <Wifi className="h-7 w-7" />,
  },
  tax: {
    auto_validate: <FileText className="h-7 w-7" />,
    self_check: <Search className="h-7 w-7" />,
    accountant: <UserCheck className="h-7 w-7" />,
    never_done: <AlertCircle className="h-7 w-7" />,
  },
  donations: {
    no_donations: <Ban className="h-7 w-7" />,
    donations_declared: <Heart className="h-7 w-7" />,
    donations_not_declared: <AlertCircle className="h-7 w-7" />,
  },
  savings: {
    livret_a: <BookOpen className="h-5 w-5" />,
    assurance_vie: <Shield className="h-5 w-5" />,
    per: <Landmark className="h-5 w-5" />,
    pea: <BarChart3 className="h-5 w-5" />,
    scpi_immo: <Building className="h-5 w-5" />,
    none: <Ban className="h-5 w-5" />,
  },
  aids: {
    apl: <Home className="h-5 w-5" />,
    prime_activite: <Wallet className="h-5 w-5" />,
    css: <Shield className="h-5 w-5" />,
    ars: <GraduationCap className="h-5 w-5" />,
    cheque_energie: <Sun className="h-5 w-5" />,
    allocations_familiales: <Users className="h-5 w-5" />,
    none: <Ban className="h-5 w-5" />,
  },
  events: {
    marriage_pacs: <HeartHandshake className="h-5 w-5" />,
    birth: <Baby className="h-5 w-5" />,
    divorce: <Unlink className="h-5 w-5" />,
    property_purchase: <HomeIcon className="h-5 w-5" />,
    job_change: <RefreshCw className="h-5 w-5" />,
    retirement: <Armchair className="h-5 w-5" />,
    none: <Ban className="h-5 w-5" />,
  },
  investments: {
    rental_property: <Building className="h-5 w-5" />,
    crypto: <Bitcoin className="h-5 w-5" />,
    foreign_accounts: <Globe className="h-5 w-5" />,
    stock_options: <LineChart className="h-5 w-5" />,
    none: <Ban className="h-5 w-5" />,
  },
  confidence: {
    lost: <Frown className="h-7 w-7" />,
    anxious: <AlertCircle className="h-7 w-7" />,
    passive: <Meh className="h-7 w-7" />,
    okay: <SmilePlus className="h-7 w-7" />,
    confident: <ThumbsUp className="h-7 w-7" />,
  },
};

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
      { value: 'couple_unmarried', label: 'En couple, non marié·e' },
      { value: 'divorced', label: 'Divorcé·e ou séparé·e' },
      { value: 'widowed', label: 'Veuf ou veuve' },
    ],
  },
  {
    id: 'children', icon: 'Baby', title: 'Combien d\'enfants as-tu à charge ?',
    description: 'Les enfants modifient ton quotient familial et ouvrent des droits.',
    type: 'single', field: 'children',
    options: [
      { value: '0', label: 'Aucun' },
      { value: '1', label: '1 enfant' },
      { value: '2', label: '2 enfants' },
      { value: '3', label: '3 enfants' },
      { value: '4', label: '4 enfants' },
      { value: '5+', label: '5 ou plus' },
    ],
  },
  {
    id: 'professional', icon: 'Briefcase', title: 'Quel est ton statut professionnel ?',
    description: 'Tes obligations fiscales et aides possibles en dépendent.',
    type: 'single', field: 'professionalStatus',
    options: [
      { value: 'employee', label: 'Salarié·e du privé' },
      { value: 'public_employee', label: 'Fonctionnaire' },
      { value: 'self_employed', label: 'Indépendant·e' },
      { value: 'student', label: 'Étudiant·e' },
      { value: 'unemployed', label: 'Sans emploi' },
      { value: 'retired', label: 'Retraité·e' },
    ],
  },
  {
    id: 'income', icon: 'Wallet', title: 'Tes revenus nets annuels ?',
    description: 'Une estimation suffit. Cela permet de calculer tes droits.',
    type: 'single', field: 'annualIncome',
    options: [
      { value: '0-10k', label: '< 10 000 €' },
      { value: '10-18k', label: '10 – 18k €' },
      { value: '18-26k', label: '18 – 26k €' },
      { value: '26-36k', label: '26 – 36k €' },
      { value: '36-50k', label: '36 – 50k €' },
      { value: '50-80k', label: '50 – 80k €' },
      { value: '80k+', label: '> 80 000 €' },
    ],
  },
  {
    id: 'housing', icon: 'Home', title: 'Tu es propriétaire ou locataire ?',
    description: 'Cela détermine certaines aides et impôts spécifiques.',
    type: 'single', field: 'housing',
    options: [
      { value: 'owner_no_mortgage', label: 'Proprio sans crédit' },
      { value: 'owner_mortgage', label: 'Proprio avec crédit' },
      { value: 'tenant', label: 'Locataire' },
      { value: 'hosted', label: 'Hébergé·e' },
    ],
  },
  {
    id: 'zone', icon: 'MapPin', title: 'Dans quelle zone habites-tu ?',
    description: 'Le montant des aides au logement varie selon ta zone.',
    type: 'single', field: 'zone',
    options: [
      { value: 'zone_1', label: 'Paris & petite couronne' },
      { value: 'zone_2', label: 'Grande ville' },
      { value: 'zone_3', label: 'Autre commune' },
    ],
  },
  {
    id: 'transport', icon: 'Car', title: 'Comment te rends-tu au travail ?',
    description: 'Les frais de transport peuvent être déductibles de tes impôts.',
    type: 'single', field: 'transport',
    condition: (a) => ['employee', 'public_employee', 'self_employed'].includes(a.professionalStatus ?? ''),
    options: [
      { value: 'car_short', label: 'Voiture < 20 km' },
      { value: 'car_long', label: 'Voiture ≥ 20 km' },
      { value: 'public_transport', label: 'Transports en commun' },
      { value: 'bike_walk', label: 'Vélo ou à pied' },
      { value: 'remote', label: 'Télétravail' },
    ],
  },
  {
    id: 'tax', icon: 'FileText', title: 'Comment déclares-tu tes impôts ?',
    description: 'Beaucoup de Français valident sans vérifier.',
    type: 'single', field: 'taxDeclaration',
    options: [
      { value: 'auto_validate', label: 'Je valide sans modifier' },
      { value: 'self_check', label: 'Je vérifie moi-même' },
      { value: 'accountant', label: 'Un comptable s\'en occupe' },
      { value: 'never_done', label: 'Jamais déclaré' },
    ],
  },
  {
    id: 'donations', icon: 'Heart', title: 'Fais-tu des dons à des associations ?',
    description: 'Les dons ouvrent droit à une réduction d\'impôt de 66% à 75%.',
    type: 'single', field: 'donations',
    options: [
      { value: 'no_donations', label: 'Non' },
      { value: 'donations_declared', label: 'Oui, déclarés' },
      { value: 'donations_not_declared', label: 'Oui, non déclarés' },
    ],
  },
  {
    id: 'savings', icon: 'PiggyBank', title: 'Quels placements as-tu ?',
    description: 'Certains placements réduisent tes impôts.',
    type: 'multi', field: 'savings',
    options: [
      { value: 'livret_a', label: 'Livret A / LDDS' },
      { value: 'assurance_vie', label: 'Assurance-vie' },
      { value: 'per', label: 'Plan Épargne Retraite' },
      { value: 'pea', label: 'PEA' },
      { value: 'scpi_immo', label: 'Immobilier / SCPI' },
      { value: 'none', label: 'Aucun placement' },
    ],
  },
  {
    id: 'aids', icon: 'Shield', title: 'Quelles aides perçois-tu ?',
    description: 'Coche celles que tu perçois déjà.',
    type: 'multi', field: 'currentAids',
    options: [
      { value: 'apl', label: 'APL' },
      { value: 'prime_activite', label: 'Prime d\'activité' },
      { value: 'css', label: 'CSS (santé solidaire)' },
      { value: 'ars', label: 'Allocation rentrée scolaire' },
      { value: 'cheque_energie', label: 'Chèque énergie' },
      { value: 'allocations_familiales', label: 'Allocations familiales' },
      { value: 'none', label: 'Aucune aide' },
    ],
  },
  {
    id: 'events', icon: 'Milestone', title: 'Un changement de vie récent ?',
    description: 'Chaque changement a des conséquences fiscales.',
    type: 'multi', field: 'lifeEvents',
    options: [
      { value: 'marriage_pacs', label: 'Mariage ou PACS' },
      { value: 'birth', label: 'Naissance ou adoption' },
      { value: 'divorce', label: 'Séparation ou divorce' },
      { value: 'property_purchase', label: 'Achat immobilier' },
      { value: 'job_change', label: 'Changement d\'emploi' },
      { value: 'retirement', label: 'Départ en retraite' },
      { value: 'none', label: 'Aucun changement' },
    ],
  },
  {
    id: 'investments', icon: 'TrendingUp', title: 'Tes investissements ?',
    description: 'Certains nécessitent des déclarations spécifiques.',
    type: 'multi', field: 'investments',
    options: [
      { value: 'rental_property', label: 'Bien en location' },
      { value: 'crypto', label: 'Crypto-monnaies' },
      { value: 'foreign_accounts', label: 'Comptes à l\'étranger' },
      { value: 'stock_options', label: 'Actions / dividendes' },
      { value: 'none', label: 'Aucun investissement' },
    ],
  },
  {
    id: 'confidence', icon: 'Gauge', title: 'Comment te sens-tu face au fiscal ?',
    description: 'Sois honnête. On adapte tes recommandations.',
    type: 'single', field: 'confidence',
    options: [
      { value: 'lost', label: 'Complètement perdu·e' },
      { value: 'anxious', label: 'Stressé·e' },
      { value: 'passive', label: 'Je fais le minimum' },
      { value: 'okay', label: 'Je me débrouille' },
      { value: 'confident', label: 'À l\'aise' },
    ],
  },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Calendar, Users, Baby, Briefcase, Wallet, Home, MapPin, Car, FileText,
  Heart, PiggyBank, Shield, Milestone, TrendingUp, Gauge,
};

// Determine grid layout based on option count and type
const getGridClass = (count: number, type: string): string => {
  if (type === 'multi') return 'flex flex-col gap-2.5';
  if (count <= 4) return 'grid grid-cols-2 gap-3';
  if (count <= 6) return 'grid grid-cols-2 gap-2.5';
  return 'grid grid-cols-2 gap-2';
};

export const OnboardingQuiz = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'welcome' | 'quiz' | 'result'>('welcome');
  const [answers, setAnswers] = useState<QuizAnswers>({ ...DEFAULT_QUIZ_ANSWERS });
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeQuestions = useMemo(
    () => QUESTIONS.filter((q) => !q.condition || q.condition(answers)),
    [answers]
  );

  const currentQuestion = activeQuestions[stepIndex];
  const totalSteps = activeQuestions.length;
  const isLastStep = stepIndex === totalSteps - 1;
  const isMulti = currentQuestion?.type === 'multi';

  const result = useMemo(() => calculateDiagnostic(answers), [answers]);

  const canContinue = useMemo(() => {
    if (!currentQuestion) return false;
    const field = currentQuestion.field;
    const val = answers[field];
    if (Array.isArray(val)) return val.length > 0;
    return val !== null;
  }, [currentQuestion, answers]);

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

  const handleSingleSelect = useCallback((field: keyof QuizAnswers, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    // Auto-advance after 400ms
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => {
      next();
    }, 400);
  }, [next]);

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

  const handleFinish = useCallback(() => {
    setIsSubmitting(true);
    localStorage.setItem('elio_diagnostic', JSON.stringify({ answers, result }));

    const ageMap: Record<string, string> = {
      '18-24': '18_25', '25-34': '26_35', '35-49': '36_50', '50-64': '51_plus', '65+': '51_plus',
    };
    const proMap: Record<string, string> = {
      employee: 'employee', public_employee: 'employee', self_employed: 'self_employed',
      student: 'student', unemployed: 'job_seeker', retired: 'retired',
    };
    const famMap: Record<string, string> = {
      single: 'single', couple_married: 'married', couple_unmarried: 'couple',
      divorced: 'divorced', widowed: 'single',
    };
    const taxMap: Record<string, string> = {
      auto_validate: 'online_self', self_check: 'online_self', accountant: 'accountant', never_done: 'not_yet',
    };
    const childVal = answers.children ?? '0';
    const childrenRange = (['3', '4', '5+'].includes(childVal) ? '3_or_more' : childVal === '0' ? 'none' : childVal) as 'none' | '1' | '2' | '3_or_more';
    const housingVal = answers.housing === 'owner_no_mortgage' ? 'owner_paid' : answers.housing === 'hosted' ? 'hosted' : (answers.housing ?? 'tenant');

    storeQuizData({
      data: {
        ageRange: (ageMap[answers.age ?? '25-34'] ?? '26_35') as '18_25' | '26_35' | '36_50' | '51_plus',
        professionalStatus: (proMap[answers.professionalStatus ?? 'employee'] ?? 'employee') as 'employee' | 'self_employed' | 'student' | 'job_seeker' | 'retired',
        familyStatus: (famMap[answers.familySituation ?? 'single'] ?? 'single') as 'single' | 'couple' | 'married' | 'divorced',
        childrenRange,
        housingStatus: housingVal as 'tenant' | 'owner_mortgage' | 'owner_paid' | 'hosted',
        incomeRange: 'less_1500',
        savingsRange: 'none',
        taxDeclarationMode: (taxMap[answers.taxDeclaration ?? 'auto_validate'] ?? 'unknown') as 'online_self' | 'accountant' | 'not_yet' | 'unknown',
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
          className="h-14 w-14 mb-8"
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        />
        <motion.h1
          className="text-2xl font-bold text-foreground text-center mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
        >
          Découvre combien tu perds chaque année
        </motion.h1>
        <motion.p
          className="text-base text-muted-foreground text-center mb-10 max-w-xs leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 20 }}
        >
          15 questions rapides. 2 minutes. Résultat immédiat.
        </motion.p>
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={() => setPhase('quiz')}
            className="w-full h-12 rounded-lg font-semibold text-sm"
          >
            Commencer mon diagnostic
          </Button>
        </motion.div>
        <motion.p
          className="flex items-center gap-1.5 text-xs text-muted-foreground mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
        >
          <Lock className="h-3 w-3" />
          Tes données restent privées et sécurisées.
        </motion.p>
        <motion.button
          onClick={handleLogin}
          className="mt-6 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
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
  const HeaderIcon = ICON_MAP[currentQuestion.icon] ?? Calendar;
  const optionIcons = OPTION_ICONS[currentQuestion.id] ?? {};
  const gridClass = getGridClass(currentQuestion.options.length, currentQuestion.type);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="px-4 pt-3 pb-1">
        <QuizProgress current={stepIndex} total={totalSteps} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        {stepIndex > 0 ? (
          <motion.button
            onClick={prev}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </motion.button>
        ) : (
          <div className="w-8" />
        )}
        <span className="text-xs text-muted-foreground font-medium">{stepIndex + 1}/{totalSteps}</span>
      </div>

      {/* Question content — fullscreen */}
      <div className="flex-1 flex flex-col px-5 pb-4">
        <QuizStep
          stepKey={currentQuestion.id}
          direction={direction}
          onSwipeLeft={canContinue || !isMulti ? next : undefined}
          onSwipeRight={stepIndex > 0 ? prev : undefined}
        >
          {/* Question header */}
          <div className="flex flex-col items-center mb-5 pt-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <HeaderIcon className="h-8 w-8 text-primary mb-3" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground text-center leading-tight">
              {currentQuestion.title}
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-1.5 max-w-xs leading-relaxed">
              {currentQuestion.description}
            </p>
          </div>

          {/* Options grid */}
          <div className={gridClass}>
            {currentQuestion.options.map((opt, i) => {
              const field = currentQuestion.field;
              const selected = isMulti
                ? ((answers[field] as string[]) || []).includes(opt.value)
                : answers[field] === opt.value;

              if (isMulti) {
                return (
                  <QuizWideCard
                    key={opt.value}
                    label={opt.label}
                    subtitle={opt.subtitle}
                    selected={selected}
                    icon={optionIcons[opt.value]}
                    index={i}
                    onClick={() => handleMultiSelect(field, opt.value)}
                  />
                );
              }

              return (
                <QuizCardOption
                  key={opt.value}
                  label={opt.label}
                  subtitle={opt.subtitle}
                  selected={selected}
                  icon={optionIcons[opt.value]}
                  index={i}
                  type="single"
                  onClick={() => handleSingleSelect(field, opt.value)}
                />
              );
            })}
          </div>
        </QuizStep>
      </div>

      {/* Continue button — only for multi-select */}
      {isMulti && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky bottom-0 bg-background/95 backdrop-blur-sm px-5 pb-6 pt-3 border-t border-border/30"
        >
          <Button
            onClick={next}
            disabled={!canContinue}
            className="w-full h-12 rounded-lg font-semibold text-sm"
          >
            {isLastStep ? 'Voir mon résultat' : 'Continuer'}
          </Button>
        </motion.div>
      )}
    </div>
  );
};
