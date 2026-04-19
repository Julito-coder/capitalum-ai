// Règles d'éligibilité simplifiées pour les 10 aides nationales V1.
// Source : service-public.fr / CAF / ANAH (barèmes 2025).
// Principe de prudence : si un champ critique manque -> "needs_info".
// Si la situation est ambiguë -> "uncertain" plutôt que faux positif.

export type AidStatus = 'eligible' | 'not_eligible' | 'needs_info' | 'uncertain';

export interface AidCheckResult {
  status: AidStatus;
  reason: string;
  estimated_amount?: string; // ex: "~185€/mois"
  missing_fields?: string[];
}

export interface AidRule {
  id: string;
  name: string;
  category: 'housing' | 'income' | 'health' | 'family' | 'energy' | 'student' | 'disability';
  source_url: string;
  required_fields: string[];
  check: (profile: any) => AidCheckResult;
}

// Helpers
const annualIncome = (p: any): number => {
  if (!p) return 0;
  // Prend le max entre net mensuel × 12 et brut mensuel × 12 × 0.78 pour éviter de sous-estimer
  const netSal = (Number(p.net_monthly_salary) || 0) * 12;
  const grossSal = (Number(p.gross_monthly_salary) || 0) * 12;
  const sal = Math.max(netSal, grossSal);
  const freelanceMonthly = (Number(p.monthly_revenue_freelance) || 0) * 12;
  const indep = Math.max(Number(p.annual_revenue_ht) || 0, freelanceMonthly);
  const bonus = Number(p.annual_bonus) || 0;
  const thirteenth = Number(p.thirteenth_month) || 0;
  const pens = Number(p.main_pension_annual) || 0;
  const supp = Number(p.supplementary_income) || 0;
  const spouse = Number(p.spouse_income) || 0;
  return sal + indep + bonus + thirteenth + pens + supp + spouse;
};

const incomeRangeToEstimate = (range?: string | null): number | null => {
  if (!range) return null;
  const map: Record<string, number> = {
    'under_15k': 12000,
    '15k_25k': 20000,
    '25k_40k': 32000,
    '40k_60k': 50000,
    '60k_100k': 80000,
    'over_100k': 120000,
  };
  return map[range] ?? null;
};

const estimateAnnualIncome = (p: any): number | null => {
  // 1. Priorité au RFR si renseigné (donnée fiscale officielle)
  const rfr = Number(p?.reference_tax_income);
  if (rfr > 0) return rfr;
  // 2. Sinon dérivé des composantes salariales/freelance
  const direct = annualIncome(p);
  if (direct > 0) return direct;
  // 3. Sinon fourchette déclarative
  return incomeRangeToEstimate(p?.income_range);
};

const ageFromBirthYear = (birthYear?: number | null): number | null => {
  if (!birthYear) return null;
  return new Date().getFullYear() - birthYear;
};

export const AIDS_RULES: AidRule[] = [
  // 1. APL
  {
    id: 'apl',
    name: 'APL (Aide personnalisée au logement)',
    category: 'housing',
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F12006',
    required_fields: ['is_homeowner', 'income'],
    check: (p) => {
      if (p?.is_homeowner === true) {
        return { status: 'not_eligible', reason: 'Tu es propriétaire de ta résidence principale, l\'APL ne s\'applique pas.' };
      }
      const income = estimateAnnualIncome(p);
      if (income == null) {
        return { status: 'needs_info', reason: 'Il me faut tes revenus et ta situation logement.', missing_fields: ['income_range', 'is_homeowner'] };
      }
      const household = 1 + (p?.family_status === 'married' || p?.family_status === 'pacs' ? 1 : 0) + (Number(p?.children_count) || 0);
      const ceiling = 18000 + (household - 1) * 5000;
      if (income > ceiling) {
        return { status: 'not_eligible', reason: `Tes revenus (${Math.round(income).toLocaleString('fr-FR')}€) dépassent le plafond indicatif (~${ceiling.toLocaleString('fr-FR')}€) pour ton foyer.` };
      }
      return {
        status: 'uncertain',
        reason: 'Tu pourrais y avoir droit si tu es locataire. Le montant dépend du loyer, de la zone et de la composition du foyer.',
        estimated_amount: '50€ à 300€/mois selon ton loyer',
      };
    },
  },

  // 2. Prime d'activité
  {
    id: 'prime_activite',
    name: 'Prime d\'activité',
    category: 'income',
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F2882',
    required_fields: ['gross_monthly_salary', 'family_status'],
    check: (p) => {
      const monthlyNet = Number(p?.net_monthly_salary) || (Number(p?.gross_monthly_salary) || 0) * 0.78;
      if (!monthlyNet || monthlyNet === 0) {
        if (p?.is_self_employed) {
          return { status: 'uncertain', reason: 'En tant qu\'indépendant, ton éligibilité dépend de ton revenu mensuel récent. À vérifier sur caf.fr.' };
        }
        return { status: 'needs_info', reason: 'J\'ai besoin de ton salaire mensuel.', missing_fields: ['net_monthly_salary'] };
      }
      // Plafond simplifié 2025 pour personne seule sans enfant : ~1900€ net/mois
      const household = 1 + (p?.family_status === 'married' || p?.family_status === 'pacs' ? 1 : 0) + (Number(p?.children_count) || 0) * 0.3;
      const ceiling = 1900 * household;
      if (monthlyNet > ceiling) {
        return { status: 'not_eligible', reason: `Ton revenu net mensuel (${Math.round(monthlyNet)}€) dépasse le plafond indicatif (~${Math.round(ceiling)}€) pour ton foyer.` };
      }
      if (monthlyNet < 600) {
        return { status: 'uncertain', reason: 'Avec un revenu très faible, vérifie aussi le RSA.', estimated_amount: '~250€/mois' };
      }
      return { status: 'eligible', reason: 'Tu travailles avec un revenu modeste : tu as probablement droit à la prime d\'activité.', estimated_amount: '~150€ à 250€/mois' };
    },
  },

  // 3. CSS
  {
    id: 'css',
    name: 'Complémentaire santé solidaire (CSS)',
    category: 'health',
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F10027',
    required_fields: ['income', 'family_status'],
    check: (p) => {
      const income = estimateAnnualIncome(p);
      if (income == null) {
        return { status: 'needs_info', reason: 'J\'ai besoin de tes revenus annuels.', missing_fields: ['income_range'] };
      }
      const household = 1 + (p?.family_status === 'married' || p?.family_status === 'pacs' ? 1 : 0) + (Number(p?.children_count) || 0);
      // Plafond 2025 personne seule : 10 166€ (gratuite) / 13 724€ (participation)
      const ceilingFree = 10166 * (1 + (household - 1) * 0.5);
      const ceilingPaid = 13724 * (1 + (household - 1) * 0.5);
      if (income <= ceilingFree) {
        return { status: 'eligible', reason: 'Tes revenus sont sous le plafond : tu as droit à la CSS gratuite.', estimated_amount: 'Gratuit (~600€/an d\'économie)' };
      }
      if (income <= ceilingPaid) {
        return { status: 'eligible', reason: 'Tu peux bénéficier de la CSS avec une participation modeste (1€ à 30€/mois selon âge).', estimated_amount: '1€ à 30€/mois' };
      }
      return { status: 'not_eligible', reason: `Tes revenus (${Math.round(income).toLocaleString('fr-FR')}€/an) dépassent les plafonds CSS.` };
    },
  },

  // 4. ARS
  {
    id: 'ars',
    name: 'Allocation de rentrée scolaire (ARS)',
    category: 'family',
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F1878',
    required_fields: ['children_count', 'income'],
    check: (p) => {
      const kids = Number(p?.children_count) || 0;
      if (kids === 0) {
        return { status: 'not_eligible', reason: 'L\'ARS concerne les enfants scolarisés de 6 à 18 ans.' };
      }
      const income = estimateAnnualIncome(p);
      if (income == null) {
        return { status: 'needs_info', reason: 'J\'ai besoin de tes revenus annuels.', missing_fields: ['income_range'] };
      }
      // Plafond 2025 : 27 141€ (1 enfant) + ~6 500€/enfant supplémentaire
      const ceiling = 27141 + (kids - 1) * 6500;
      if (income > ceiling) {
        return { status: 'not_eligible', reason: `Tes revenus dépassent le plafond ARS (${ceiling.toLocaleString('fr-FR')}€) pour ${kids} enfant(s).` };
      }
      return {
        status: 'uncertain',
        reason: `Sous condition que tes enfants aient entre 6 et 18 ans et soient scolarisés. ${kids} enfant(s) déclaré(s).`,
        estimated_amount: '~430€ à 470€ par enfant (rentrée 2025)',
      };
    },
  },

  // 5. Chèque énergie
  {
    id: 'cheque_energie',
    name: 'Chèque énergie',
    category: 'energy',
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F35551',
    required_fields: ['income'],
    check: (p) => {
      const income = estimateAnnualIncome(p);
      if (income == null) {
        return { status: 'needs_info', reason: 'J\'ai besoin de tes revenus annuels (revenu fiscal de référence).', missing_fields: ['income_range'] };
      }
      const household = 1 + (p?.family_status === 'married' || p?.family_status === 'pacs' ? 1 : 0) + (Number(p?.children_count) || 0) * 0.3;
      const rfrEstimate = income / Math.max(household, 1);
      // Plafond RFR/UC 2025 : 11 000€
      if (rfrEstimate <= 11000) {
        return { status: 'eligible', reason: 'Tes revenus sont sous le plafond du chèque énergie. Il est envoyé automatiquement (pas de demande).', estimated_amount: '48€ à 277€/an' };
      }
      return { status: 'not_eligible', reason: 'Tes revenus dépassent le plafond du chèque énergie (11 000€/UC).' };
    },
  },

  // 6. Bourse CROUS
  {
    id: 'bourse_crous',
    name: 'Bourse sur critères sociaux (CROUS)',
    category: 'student',
    source_url: 'https://www.etudiant.gouv.fr/fr/bourse-sur-criteres-sociaux',
    required_fields: ['age', 'professional_status'],
    check: (p) => {
      const age = ageFromBirthYear(p?.birth_year);
      const isStudent = p?.professional_status === 'student';
      if (age != null && age > 28 && !isStudent) {
        return { status: 'not_eligible', reason: 'La bourse CROUS s\'adresse aux étudiants de moins de 28 ans à l\'inscription.' };
      }
      if (!isStudent && age != null && age > 25) {
        return { status: 'not_eligible', reason: 'Tu n\'as pas le statut étudiant.' };
      }
      if (isStudent || (age != null && age <= 25)) {
        return {
          status: 'uncertain',
          reason: 'Si tu es étudiant inscrit dans un établissement reconnu, ton éligibilité dépend des revenus de tes parents.',
          estimated_amount: '~1 450€ à 6 800€/an selon échelon',
        };
      }
      return { status: 'needs_info', reason: 'Confirme-moi ton âge et ton statut étudiant.', missing_fields: ['birth_year', 'professional_status'] };
    },
  },

  // 7. MaPrimeRénov'
  {
    id: 'maprimerenov',
    name: 'MaPrimeRénov\'',
    category: 'housing',
    source_url: 'https://france-renov.gouv.fr/aides/maprimerenov',
    required_fields: ['is_homeowner'],
    check: (p) => {
      if (p?.is_homeowner !== true) {
        return { status: 'not_eligible', reason: 'MaPrimeRénov\' s\'adresse aux propriétaires occupants ou bailleurs.' };
      }
      return {
        status: 'uncertain',
        reason: 'Tu es propriétaire : tu peux y avoir droit si tu réalises des travaux de rénovation énergétique. Le montant dépend de tes revenus et du type de travaux.',
        estimated_amount: '~1 500€ à 20 000€ selon projet et revenus',
      };
    },
  },

  // 8. RSA
  {
    id: 'rsa',
    name: 'RSA (Revenu de solidarité active)',
    category: 'income',
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/N19775',
    required_fields: ['age', 'income'],
    check: (p) => {
      const age = ageFromBirthYear(p?.birth_year);
      if (age != null && age < 25) {
        return { status: 'not_eligible', reason: 'Le RSA est ouvert dès 25 ans (ou avant sous conditions strictes : enfant à charge, jeune actif).' };
      }
      const income = estimateAnnualIncome(p);
      if (income == null) {
        return { status: 'needs_info', reason: 'J\'ai besoin de tes revenus mensuels.', missing_fields: ['income_range'] };
      }
      const monthly = income / 12;
      // RSA 2025 personne seule : 635€/mois
      if (monthly < 600) {
        return { status: 'eligible', reason: 'Tes revenus sont très faibles : tu as probablement droit au RSA.', estimated_amount: '~635€/mois (personne seule)' };
      }
      if (monthly > 1200) {
        return { status: 'not_eligible', reason: 'Tes revenus dépassent le plafond RSA. Vérifie plutôt la prime d\'activité.' };
      }
      return { status: 'uncertain', reason: 'Tes revenus sont à la limite. Une simulation sur caf.fr permettra de confirmer.' };
    },
  },

  // 9. AAH
  {
    id: 'aah',
    name: 'AAH (Allocation aux adultes handicapés)',
    category: 'disability',
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/N12230',
    required_fields: ['disability_status'],
    check: () => {
      return {
        status: 'uncertain',
        reason: 'L\'AAH dépend d\'un taux d\'incapacité reconnu par la MDPH (≥80%, ou 50-79% avec restriction d\'accès à l\'emploi). Si tu es concerné, dépose un dossier MDPH.',
        estimated_amount: 'jusqu\'à 1 016€/mois (2025)',
      };
    },
  },

  // 10. Allocations familiales
  {
    id: 'allocations_familiales',
    name: 'Allocations familiales',
    category: 'family',
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F13213',
    required_fields: ['children_count'],
    check: (p) => {
      const kids = Number(p?.children_count) || 0;
      if (kids < 2) {
        return { status: 'not_eligible', reason: 'Les allocations familiales sont versées à partir de 2 enfants à charge de moins de 20 ans.' };
      }
      const income = estimateAnnualIncome(p);
      // Versées dès 2 enfants, sous conditions de ressources modulées
      if (income != null && income > 80000) {
        return { status: 'eligible', reason: `Tu as ${kids} enfants : tu y as droit, mais le montant est réduit au-dessus de 80 000€/an.`, estimated_amount: '~36€ à 145€/mois (modulé)' };
      }
      return { status: 'eligible', reason: `Tu as ${kids} enfants à charge : tu as droit aux allocations familiales.`, estimated_amount: kids === 2 ? '~145€/mois' : kids === 3 ? '~331€/mois' : '~500€+/mois' };
    },
  },
];
