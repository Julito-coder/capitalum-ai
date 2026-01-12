export interface UserProfile {
  name: string;
  email: string;
  siret: string;
  status: string;
  year: number;
}

export interface Financials {
  ca: number;
  caProjected: number;
  expenses: number;
  expensesByCategory: Record<string, number>;
  urssafAcomptes: { month: string; paid: number }[];
  totalURSSAFPaid: number;
  perVersement: number;
}

export interface TaxData {
  lastDeclaration: string;
  lastIR: number;
  estimatedIR2024: number;
  abatement: string;
  potentialOptimization: {
    realExpenses: number;
    per: number;
    sofibail: number;
  };
}

export interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  gain: number;
  deadline?: string;
  action?: string;
}

export interface CalendarTask {
  id: string;
  priority: 'critical' | 'warning' | 'normal';
  date: string;
  title: string;
  description?: string;
  gain: number;
  status: 'pending' | 'in_progress' | 'done';
}

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  currentOption: {
    label: string;
    value: number;
    detail: string;
  };
  recommendedOption: {
    label: string;
    value: number;
    detail: string;
  };
  gain: number;
  effort: string;
  deadline: string;
}

export const mockUserData = {
  profile: {
    name: "Jean Dupont",
    email: "jean@example.com",
    siret: "123 456 789 00012",
    status: "Micro-entrepreneur",
    year: 2024
  } as UserProfile,

  financials: {
    ca: 28400,
    caProjected: 30200,
    expenses: 4300,
    expensesByCategory: {
      "Fournitures": 1200,
      "Téléphone": 480,
      "Logiciel/Cloud": 890,
      "Déplacements": 730,
      "Autres": 1000
    },
    urssafAcomptes: [
      { month: "Jan", paid: 650 },
      { month: "Fév", paid: 650 },
      { month: "Mar", paid: 650 },
      { month: "Avr", paid: 650 },
      { month: "Mai", paid: 650 },
      { month: "Jun", paid: 650 },
      { month: "Jul", paid: 650 },
      { month: "Aoû", paid: 650 },
      { month: "Sep", paid: 650 },
      { month: "Oct", paid: 650 },
      { month: "Nov", paid: 650 }
    ],
    totalURSSAFPaid: 7150,
    perVersement: 0
  } as Financials,

  taxData: {
    lastDeclaration: "2023",
    lastIR: 4800,
    estimatedIR2024: 4200,
    abatement: "10%",
    potentialOptimization: {
      realExpenses: 690,
      per: 1530,
      sofibail: 0
    }
  } as TaxData,

  alerts: [
    {
      id: "1",
      type: "seuil_micro",
      severity: "warning",
      title: "Seuil micro approchant",
      message: "CA projeté dépasse seuil micro (+2 150€)",
      gain: 0,
      action: "Revoir projections ou basculer réel"
    },
    {
      id: "2",
      type: "per_manquant",
      severity: "critical",
      title: "Versement PER recommandé",
      message: "Économisez 1 530€ d'impôts avant le 31/12",
      gain: 1530,
      deadline: "2024-12-31"
    },
    {
      id: "3",
      type: "frais_reels",
      severity: "info",
      title: "Frais réels plus avantageux",
      message: "Vos dépenses réelles dépassent l'abattement 10%",
      gain: 690,
      deadline: "2025-05-31"
    }
  ] as Alert[],

  recommendations: [
    {
      id: "1",
      type: "frais_reels",
      title: "Frais réels vs Abattement 10%",
      description: "Vos dépenses réelles sont supérieures à l'abattement forfaitaire",
      currentOption: {
        label: "Abattement 10%",
        value: 2840,
        detail: "28 400€ × 10% = 2 840€ de déduction"
      },
      recommendedOption: {
        label: "Frais réels",
        value: 4300,
        detail: "4 300€ de dépenses réelles déductibles"
      },
      gain: 690,
      effort: "Classer factures (15 min)",
      deadline: "2025-05-31"
    },
    {
      id: "2",
      type: "per",
      title: "Versement PER avant fin d'année",
      description: "Déduisez jusqu'à 4 000€ de votre revenu imposable",
      currentOption: {
        label: "Versement actuel",
        value: 0,
        detail: "Aucun versement PER en 2024"
      },
      recommendedOption: {
        label: "Versement recommandé",
        value: 3400,
        detail: "3 400€ × 45% TMI = 1 530€ économisés"
      },
      gain: 1530,
      effort: "Virement bancaire (5 min)",
      deadline: "2024-12-31"
    }
  ] as Recommendation[],

  calendar: [
    {
      id: "1",
      priority: "critical",
      date: "2024-12-15",
      title: "Dépenser en fournitures pro",
      description: "Achats déductibles avant fin d'année",
      gain: 430,
      status: "pending"
    },
    {
      id: "2",
      priority: "critical",
      date: "2024-12-20",
      title: "Verser PER 3 400€",
      description: "Dernière date pour déduction 2024",
      gain: 1530,
      status: "pending"
    },
    {
      id: "3",
      priority: "warning",
      date: "2024-12-31",
      title: "Valider CA annuel",
      description: "Confirmer le chiffre d'affaires 2024",
      gain: 0,
      status: "pending"
    },
    {
      id: "4",
      priority: "normal",
      date: "2025-01-31",
      title: "Collecter justificatifs",
      description: "Rassembler tous les documents fiscaux",
      gain: 0,
      status: "pending"
    },
    {
      id: "5",
      priority: "critical",
      date: "2025-05-31",
      title: "Déclaration 2042",
      description: "Date limite déclaration impôts",
      gain: 0,
      status: "pending"
    }
  ] as CalendarTask[]
};

// Tax calculation utilities
export const SEUIL_MICRO_2024 = 28050;
export const SEUIL_MICRO_2025 = 30900;
export const TAUX_MICRO_URSSAF = 0.227;

export const calculateIR = (revenus: number, charges: number, per: number = 0): number => {
  const revenuImposable = Math.max(0, revenus - charges - per);
  
  const tranches = [
    { limit: 11200, rate: 0 },
    { limit: 28297, rate: 0.11 },
    { limit: 66794, rate: 0.30 },
    { limit: 160448, rate: 0.41 },
    { limit: Infinity, rate: 0.45 }
  ];
  
  let ir = 0;
  let previousLimit = 0;
  
  for (const tranche of tranches) {
    const taxableInThisTranche = Math.min(revenuImposable, tranche.limit) - previousLimit;
    if (taxableInThisTranche > 0) {
      ir += taxableInThisTranche * tranche.rate;
    }
    previousLimit = tranche.limit;
  }
  
  return Math.round(ir);
};

export const checkMicroThreshold = (ca: number, year: number = 2024) => {
  const seuil = year === 2024 ? SEUIL_MICRO_2024 : SEUIL_MICRO_2025;
  
  return {
    isWithinMicro: ca <= seuil,
    remainingCapacity: seuil - ca,
    percentageUsed: (ca / seuil) * 100,
    riskLevel: ca / seuil > 0.85 ? "high" : ca / seuil > 0.70 ? "medium" : "low"
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
