import { UserProfile } from './dashboardService';

export type AideStatus = 'eligible' | 'to_verify' | 'not_eligible';
export type AideCategory = 'logement' | 'famille' | 'emploi' | 'sante' | 'energie' | 'education' | 'investissement';

export interface AideDefinition {
  key: string;
  title: string;
  description: string;
  category: AideCategory;
  conditions: string;
  applicationUrl: string;
  applicationSteps: string[];
  eligibilityCheck: (profile: UserProfile) => AideStatus;
  estimateAmount: (profile: UserProfile) => { min: number; max: number; period: string } | null;
}

const getAnnualIncome = (p: UserProfile): number => {
  if (p.isEmployee) return (p.grossMonthlySalary || 0) * 12 + (p.annualBonus || 0);
  if (p.isSelfEmployed) return p.annualRevenueHt || 0;
  if (p.isRetired) return p.mainPensionAnnual || 0;
  return 0;
};

const isCouple = (p: UserProfile): boolean =>
  ['married', 'pacs', 'couple', 'marié', 'pacsé'].includes(p.familyStatus || '');

const getIncomeThreshold = (p: UserProfile, baseSingle: number): number => {
  let threshold = baseSingle;
  if (isCouple(p)) threshold *= 1.5;
  threshold += (p.childrenCount || 0) * baseSingle * 0.3;
  return threshold;
};

export const AIDE_CATALOG: AideDefinition[] = [
  // --- LOGEMENT ---
  {
    key: 'apl',
    title: 'APL — Aide personnalisée au logement',
    description: 'Aide mensuelle pour réduire ton loyer ou tes mensualités de prêt immobilier.',
    category: 'logement',
    conditions: 'Locataire ou accédant à la propriété, revenus modestes',
    applicationUrl: 'https://www.caf.fr/allocataires/mes-aides/logement',
    applicationSteps: [
      'Crée ton compte sur caf.fr',
      'Remplis la demande d\'APL en ligne',
      'Fournis ton bail et tes justificatifs de revenus',
      'L\'aide est versée directement à ton propriétaire ou à toi',
    ],
    eligibilityCheck: (p) => {
      if (p.isHomeowner && !p.mortgageRemaining) return 'not_eligible';
      const income = getAnnualIncome(p);
      if (income === 0) return 'to_verify';
      const threshold = getIncomeThreshold(p, 15000);
      if (income <= threshold) return 'eligible';
      if (income <= threshold * 1.3) return 'to_verify';
      return 'not_eligible';
    },
    estimateAmount: (p) => {
      const income = getAnnualIncome(p);
      if (income <= 10000) return { min: 300, max: 400, period: 'mois' };
      if (income <= 15000) return { min: 200, max: 300, period: 'mois' };
      return { min: 100, max: 200, period: 'mois' };
    },
  },

  // --- EMPLOI ---
  {
    key: 'prime_activite',
    title: 'Prime d\'activité',
    description: 'Complément de revenus pour les travailleurs aux revenus modestes.',
    category: 'emploi',
    conditions: 'Salarié ou indépendant, revenu net entre 1 000€ et 1 800€/mois environ',
    applicationUrl: 'https://www.caf.fr/allocataires/mes-aides/prime-d-activite',
    applicationSteps: [
      'Connecte-toi sur caf.fr',
      'Fais une simulation en ligne',
      'Si éligible, remplis la demande',
      'Déclare tes revenus chaque trimestre',
    ],
    eligibilityCheck: (p) => {
      if (!p.isEmployee && !p.isSelfEmployed) return 'not_eligible';
      const monthly = p.isEmployee ? (p.netMonthlySalary || 0) : (p.annualRevenueHt || 0) / 12;
      if (monthly === 0) return 'to_verify';
      if (monthly >= 1000 && monthly <= 1900) return 'eligible';
      if (monthly > 800 && monthly < 2200) return 'to_verify';
      return 'not_eligible';
    },
    estimateAmount: (p) => {
      const monthly = p.isEmployee ? (p.netMonthlySalary || 0) : (p.annualRevenueHt || 0) / 12;
      if (monthly <= 1200) return { min: 200, max: 250, period: 'mois' };
      if (monthly <= 1500) return { min: 150, max: 200, period: 'mois' };
      return { min: 100, max: 150, period: 'mois' };
    },
  },
  {
    key: 'rsa',
    title: 'RSA — Revenu de solidarité active',
    description: 'Revenu minimum garanti pour les personnes sans ressources.',
    category: 'emploi',
    conditions: 'Sans emploi ou revenus très faibles, plus de 25 ans (ou parent)',
    applicationUrl: 'https://www.caf.fr/allocataires/mes-aides/rsa',
    applicationSteps: [
      'Fais une simulation sur caf.fr',
      'Remplis la demande en ligne',
      'Un rendez-vous d\'orientation sera proposé',
      'Déclare tes revenus chaque trimestre',
    ],
    eligibilityCheck: (p) => {
      const income = getAnnualIncome(p);
      if (income === 0 && !p.isEmployee && !p.isSelfEmployed && !p.isRetired) return 'to_verify';
      const threshold = isCouple(p) ? 12000 : 7000;
      if (income > 0 && income <= threshold) return 'eligible';
      if (income <= threshold * 1.2) return 'to_verify';
      return 'not_eligible';
    },
    estimateAmount: (p) => {
      if (isCouple(p)) return { min: 800, max: 950, period: 'mois' };
      return { min: 600, max: 635, period: 'mois' };
    },
  },

  // --- SANTE ---
  {
    key: 'css',
    title: 'CSS — Complémentaire santé solidaire',
    description: 'Mutuelle gratuite ou à moins de 1€/jour pour les revenus modestes.',
    category: 'sante',
    conditions: 'Revenu annuel inférieur à ~12 000€ (personne seule)',
    applicationUrl: 'https://www.ameli.fr/assure/droits-demarches/complementaire-sante-solidaire',
    applicationSteps: [
      'Connecte-toi sur ameli.fr',
      'Vérifie ton éligibilité via le simulateur',
      'Remplis le formulaire de demande',
      'Reçois ta carte de tiers payant',
    ],
    eligibilityCheck: (p) => {
      const income = getAnnualIncome(p);
      if (income === 0) return 'to_verify';
      const threshold = getIncomeThreshold(p, 12000);
      if (income <= threshold) return 'eligible';
      if (income <= threshold * 1.15) return 'to_verify';
      return 'not_eligible';
    },
    estimateAmount: () => ({ min: 500, max: 700, period: 'an' }),
  },

  // --- FAMILLE ---
  {
    key: 'allocations_familiales',
    title: 'Allocations familiales',
    description: 'Aide mensuelle automatique à partir de 2 enfants à charge.',
    category: 'famille',
    conditions: 'Au moins 2 enfants de moins de 20 ans à charge',
    applicationUrl: 'https://www.caf.fr/allocataires/mes-aides/allocations-familiales',
    applicationSteps: [
      'Déclare tes enfants sur caf.fr',
      'Les allocations sont versées automatiquement',
      'Montant ajusté selon tes revenus',
    ],
    eligibilityCheck: (p) => {
      if ((p.childrenCount || 0) >= 2) return 'eligible';
      if ((p.childrenCount || 0) === 1) return 'not_eligible';
      return 'to_verify';
    },
    estimateAmount: (p) => {
      const n = p.childrenCount || 2;
      if (n === 2) return { min: 141, max: 141, period: 'mois' };
      if (n === 3) return { min: 322, max: 322, period: 'mois' };
      return { min: 322 + (n - 3) * 181, max: 322 + (n - 3) * 181, period: 'mois' };
    },
  },
  {
    key: 'ars',
    title: 'ARS — Allocation de rentrée scolaire',
    description: 'Aide annuelle versée en août pour les frais de rentrée scolaire.',
    category: 'famille',
    conditions: 'Enfants de 6 à 18 ans, revenus inférieurs au plafond',
    applicationUrl: 'https://www.caf.fr/allocataires/mes-aides/allocation-de-rentree-scolaire',
    applicationSteps: [
      'Si tu es déjà allocataire CAF, c\'est automatique',
      'Sinon, déclare tes enfants sur caf.fr',
      'L\'ARS est versée mi-août chaque année',
    ],
    eligibilityCheck: (p) => {
      if ((p.childrenCount || 0) === 0) return 'not_eligible';
      const income = getAnnualIncome(p);
      if (income === 0) return 'to_verify';
      const threshold = getIncomeThreshold(p, 26000);
      if (income <= threshold) return 'eligible';
      return 'not_eligible';
    },
    estimateAmount: (p) => ({
      min: 400 * (p.childrenCount || 1),
      max: 450 * (p.childrenCount || 1),
      period: 'an',
    }),
  },

  // --- ENERGIE ---
  {
    key: 'cheque_energie',
    title: 'Chèque énergie',
    description: 'Aide annuelle pour payer tes factures d\'énergie ou des travaux de rénovation.',
    category: 'energie',
    conditions: 'Revenu fiscal de référence inférieur à ~11 000€ (personne seule)',
    applicationUrl: 'https://chequeenergie.gouv.fr',
    applicationSteps: [
      'Le chèque est envoyé automatiquement par courrier',
      'Vérifie ton éligibilité sur chequeenergie.gouv.fr',
      'Utilise-le auprès de ton fournisseur d\'énergie',
    ],
    eligibilityCheck: (p) => {
      const income = getAnnualIncome(p);
      if (income === 0) return 'to_verify';
      const threshold = getIncomeThreshold(p, 11000);
      if (income <= threshold) return 'eligible';
      return 'not_eligible';
    },
    estimateAmount: (p) => {
      const income = getAnnualIncome(p);
      if (income <= 5000) return { min: 194, max: 277, period: 'an' };
      if (income <= 8000) return { min: 100, max: 194, period: 'an' };
      return { min: 48, max: 100, period: 'an' };
    },
  },
  {
    key: 'maprimerenov',
    title: 'MaPrimeRénov\'',
    description: 'Aide pour financer des travaux de rénovation énergétique de ton logement.',
    category: 'energie',
    conditions: 'Propriétaire occupant ou bailleur, logement de plus de 15 ans',
    applicationUrl: 'https://www.maprimerenov.gouv.fr',
    applicationSteps: [
      'Crée ton compte sur maprimerenov.gouv.fr',
      'Décris ton projet de travaux',
      'Obtiens des devis d\'artisans RGE',
      'Dépose ta demande avant les travaux',
    ],
    eligibilityCheck: (p) => {
      if (p.isHomeowner) return 'eligible';
      return 'not_eligible';
    },
    estimateAmount: (p) => {
      const income = getAnnualIncome(p);
      if (income <= 22000) return { min: 7000, max: 10000, period: 'projet' };
      if (income <= 35000) return { min: 4000, max: 7000, period: 'projet' };
      return { min: 2000, max: 4000, period: 'projet' };
    },
  },

  // --- EDUCATION ---
  {
    key: 'bourse_crous',
    title: 'Bourse CROUS',
    description: 'Aide mensuelle pour les étudiants selon les revenus du foyer.',
    category: 'education',
    conditions: 'Étudiant inscrit dans l\'enseignement supérieur, revenus du foyer modestes',
    applicationUrl: 'https://www.messervices.etudiant.gouv.fr',
    applicationSteps: [
      'Constitue ton DSE sur messervices.etudiant.gouv.fr',
      'Renseigne les revenus de tes parents',
      'Valide ta demande avant le 15 mai',
      'Le versement commence en septembre',
    ],
    eligibilityCheck: (p) => {
      const isStudent = p.fiscalStatus === 'student' || p.fiscalStatus === 'étudiant';
      if (!isStudent && (p.childrenCount || 0) === 0) return 'not_eligible';
      if (isStudent) {
        const income = getAnnualIncome(p);
        if (income === 0) return 'to_verify';
        if (income <= 35000) return 'eligible';
        return 'to_verify';
      }
      return 'to_verify';
    },
    estimateAmount: () => ({ min: 100, max: 500, period: 'mois' }),
  },

  // --- INVESTISSEMENT ---
  {
    key: 'credit_impot_emploi_domicile',
    title: 'Crédit d\'impôt emploi à domicile',
    description: 'Récupère 50% des dépenses pour ménage, garde, jardinage, soutien scolaire…',
    category: 'investissement',
    conditions: 'Employer quelqu\'un à domicile (CESU ou prestataire)',
    applicationUrl: 'https://www.impots.gouv.fr',
    applicationSteps: [
      'Déclare tes dépenses d\'emploi à domicile sur impots.gouv.fr',
      'Cases 7DB à 7DG de la déclaration 2042',
      'Le crédit d\'impôt est calculé automatiquement',
      'Versement sous forme de remboursement ou acompte en janvier',
    ],
    eligibilityCheck: (p) => {
      const income = getAnnualIncome(p);
      if (income >= 26000) return 'to_verify';
      return 'not_eligible';
    },
    estimateAmount: () => ({ min: 1000, max: 6000, period: 'an' }),
  },
];

export const CATEGORY_LABELS: Record<AideCategory, string> = {
  logement: 'Logement',
  famille: 'Famille',
  emploi: 'Emploi',
  sante: 'Santé',
  energie: 'Énergie',
  education: 'Éducation',
  investissement: 'Investissement',
};

export const CATEGORY_ICONS: Record<AideCategory, string> = {
  logement: 'Home',
  famille: 'Users',
  emploi: 'Briefcase',
  sante: 'Heart',
  energie: 'Zap',
  education: 'GraduationCap',
  investissement: 'TrendingUp',
};
