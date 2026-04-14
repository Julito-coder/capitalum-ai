/**
 * French fiscal calendar deadlines data.
 * Each deadline is personalized based on user profile.
 */
import { FiscalDeadline, DeadlineUserProfile, PersonalImpact } from './deadlinesTypes';

const currentYear = new Date().getFullYear();

/** Estimate TMI from gross salary */
function estimateTMI(profile: DeadlineUserProfile): number {
  if (profile.tmi > 0) return profile.tmi;
  const annualNet = profile.netMonthlySalary * 12 || profile.annualRevenueHt * 0.66;
  if (annualNet > 168994) return 45;
  if (annualNet > 78570) return 41;
  if (annualNet > 28797) return 30;
  if (annualNet > 11294) return 11;
  return 0;
}

function defaultImpact(): PersonalImpact {
  return { estimatedGain: 0, riskIfNoAction: 0, patrimonialEffect10y: 0, explanation: '' };
}

export const FISCAL_DEADLINES: FiscalDeadline[] = [
  // ===== FISCALITÉ =====
  {
    key: `ir-declaration-${currentYear}`,
    title: 'Déclaration de revenus (IR)',
    shortDescription: `Date limite pour déclarer tes revenus ${currentYear - 1}`,
    explanation: `La déclaration de revenus est obligatoire chaque année. Elle sert de base au calcul de ton impôt sur le revenu. Des erreurs ou oublis peuvent entraîner des majorations de 10% à 40%.`,
    consequences: `Majoration de 10% en cas de retard, 20% après mise en demeure, 40% en cas d'activité occulte. Perte d'éventuels crédits d'impôt non déclarés.`,
    category: 'fiscalite',
    date: new Date(currentYear, 4, 22), // 22 mai
    impactScore: 5,
    estimatedImpact: 2000,
    relevanceCondition: () => true,
    computePersonalImpact: (p) => {
      const tmi = estimateTMI(p);
      const deductible = p.hasRealExpenses ? p.netMonthlySalary * 0.1 * 12 : 0;
      const gain = Math.round(deductible * tmi / 100);
      return {
        estimatedGain: gain,
        riskIfNoAction: Math.round((p.netMonthlySalary * 12 * tmi / 100) * 0.1),
        patrimonialEffect10y: gain * 10,
        explanation: gain > 0
          ? `En optimisant ta déclaration (frais réels, déductions), tu peux économiser environ ${gain} €/an.`
          : `Déclarer à temps évite une majoration de 10% sur ton impôt.`,
      };
    },
    guideId: 'frais-reels',
    externalUrl: 'https://www.impots.gouv.fr/accueil',
    externalUrlLabel: 'Accéder à impots.gouv.fr',
    actions: [
      { id: 'optimize', label: 'Optimiser ma déclaration', icon: 'Sparkles', type: 'guide', target: 'frais-reels' },
      { id: 'scan', label: 'Scanner mes erreurs', icon: 'Search', type: 'guide', target: '/scanner' },
      { id: 'external', label: 'Déclarer en ligne', icon: 'ExternalLink', type: 'external', target: 'https://www.impots.gouv.fr/accueil' },
    ],
    tags: ['obligatoire', 'annuel'],
  },
  {
    key: `taxe-fonciere-${currentYear}`,
    title: 'Taxe foncière',
    shortDescription: 'Échéance de paiement de la taxe foncière',
    explanation: `La taxe foncière est due par tout propriétaire au 1er janvier. Le montant dépend de la valeur locative cadastrale. La mensualisation permet d'étaler le paiement.`,
    consequences: `Majoration de 10% en cas de retard de paiement. Risque de poursuites par le Trésor Public.`,
    category: 'fiscalite',
    date: new Date(currentYear, 9, 15), // 15 octobre
    impactScore: 3,
    estimatedImpact: 0,
    relevanceCondition: (p) => p.isHomeowner || p.hasRentalIncome || p.isInvestor,
    computePersonalImpact: () => ({
      ...defaultImpact(),
      explanation: `Pense à vérifier le montant et à mensualiser si nécessaire pour lisser ta trésorerie.`,
    }),
    actions: [
      { id: 'external', label: 'Accéder à impots.gouv.fr', icon: 'ExternalLink', type: 'external', target: 'https://www.impots.gouv.fr/accueil' },
    ],
    tags: ['propriétaire', 'annuel'],
  },
  {
    key: `ifi-declaration-${currentYear}`,
    title: 'Déclaration IFI',
    shortDescription: 'Impôt sur la Fortune Immobilière si patrimoine > 1,3M€',
    explanation: `L'IFI concerne les contribuables dont le patrimoine immobilier net dépasse 1 300 000 €. Il est déclaré en même temps que l'IR.`,
    consequences: `Majoration de 10% + intérêts de retard. L'IFI est un impôt progressif de 0,5% à 1,5%.`,
    category: 'fiscalite',
    date: new Date(currentYear, 4, 22),
    impactScore: 4,
    estimatedImpact: 0,
    relevanceCondition: (p) => p.scpiInvestments + (p.hasRentalIncome ? 500000 : 0) > 1300000,
    computePersonalImpact: () => ({
      ...defaultImpact(),
      explanation: `Si ton patrimoine immobilier net dépasse 1,3M€, la déclaration IFI est obligatoire.`,
    }),
    actions: [
      { id: 'external', label: 'Déclarer IFI', icon: 'ExternalLink', type: 'external', target: 'https://www.impots.gouv.fr/accueil' },
    ],
    tags: ['patrimoine', 'annuel'],
  },

  // ===== INVESTISSEMENT =====
  {
    key: `pea-versement-${currentYear}`,
    title: 'Versement PEA',
    shortDescription: `Optimise ton plafond PEA avant le 31/12/${currentYear}`,
    explanation: `Le PEA permet de bénéficier d'une exonération d'impôt sur les plus-values après 5 ans (hors prélèvements sociaux de 17,2%). Le plafond est de 150 000 €. Chaque euro versé cette année te rapproche de la fiscalité optimale.`,
    consequences: `Les plus-values réalisées hors PEA sont taxées au PFU de 30% (12,8% IR + 17,2% PS). En PEA, seuls les 17,2% de PS s'appliquent après 5 ans.`,
    category: 'investissement',
    date: new Date(currentYear, 11, 31),
    impactScore: 4,
    estimatedImpact: 1500,
    relevanceCondition: (p) => p.isInvestor || p.peaBalance > 0 || p.netMonthlySalary > 2500,
    computePersonalImpact: (p) => {
      const remainingPlafond = Math.max(0, 150000 - (p.peaBalance || 0));
      const potentialInvestment = Math.min(remainingPlafond, p.netMonthlySalary * 3);
      const gainVsPFU = Math.round(potentialInvestment * 0.07 * 0.128); // 7% return, 12.8% tax saving
      return {
        estimatedGain: gainVsPFU,
        riskIfNoAction: 0,
        patrimonialEffect10y: gainVsPFU * 10,
        explanation: `En investissant ${potentialInvestment.toLocaleString('fr-FR')} € en PEA, tu économises ${gainVsPFU} €/an vs un CTO (12,8% d'IR en moins sur les gains).`,
      };
    },
    guideId: 'pea-optimization',
    actions: [
      { id: 'guide', label: 'Guide PEA complet', icon: 'BookOpen', type: 'guide', target: 'pea-optimization' },
      { id: 'simulate', label: 'Simuler mon épargne', icon: 'Calculator', type: 'simulation', target: '/savings' },
    ],
    tags: ['épargne', 'annuel', 'exonération'],
  },
  {
    key: `per-versement-${currentYear}`,
    title: 'Versement PER',
    shortDescription: `Réduis ton IR en versant sur ton PER avant le 31/12/${currentYear}`,
    explanation: `Le Plan Épargne Retraite (PER) permet de déduire les versements de ton revenu imposable, dans la limite d'un plafond (10% des revenus N-1, min 4 399€). C'est l'un des leviers de réduction d'IR les plus puissants.`,
    consequences: `Chaque euro non versé cette année est une déduction perdue (le plafond non utilisé est reportable 3 ans seulement).`,
    category: 'investissement',
    date: new Date(currentYear, 11, 31),
    impactScore: 5,
    estimatedImpact: 3000,
    relevanceCondition: (p) => estimateTMI(p) >= 30,
    computePersonalImpact: (p) => {
      const tmi = estimateTMI(p);
      const annualIncome = Math.max(p.netMonthlySalary * 12, p.annualRevenueHt * 0.66);
      const plafond = Math.max(4399, Math.round(annualIncome * 0.1));
      const gain = Math.round(plafond * tmi / 100);
      return {
        estimatedGain: gain,
        riskIfNoAction: 0,
        patrimonialEffect10y: gain * 10,
        explanation: `Avec un TMI de ${tmi}%, verser ${plafond.toLocaleString('fr-FR')} € sur ton PER te fait économiser ${gain} € d'IR cette année.`,
      };
    },
    guideId: 'per-optimization',
    actions: [
      { id: 'guide', label: 'Optimiser mon PER', icon: 'Sparkles', type: 'guide', target: 'per-optimization' },
      { id: 'simulate', label: 'Simuler l\'impact', icon: 'Calculator', type: 'simulation', target: '/savings' },
    ],
    tags: ['épargne', 'retraite', 'déduction IR'],
  },
  {
    key: `assurance-vie-versement-${currentYear}`,
    title: 'Versement Assurance Vie',
    shortDescription: 'Optimise la fiscalité de ton assurance-vie',
    explanation: `L'assurance-vie bénéficie d'une fiscalité avantageuse après 8 ans : abattement de 4 600 €/an (9 200 € couple) sur les gains. Les versements avant le 31/12 comptent pour l'ancienneté.`,
    consequences: `Retarder les versements repousse la date d'ancienneté fiscale de 8 ans.`,
    category: 'investissement',
    date: new Date(currentYear, 11, 31),
    impactScore: 3,
    estimatedImpact: 800,
    relevanceCondition: (p) => p.lifeInsuranceBalance > 0 || p.netMonthlySalary > 3000,
    computePersonalImpact: (p) => {
      const gain = p.lifeInsuranceBalance > 0 ? Math.round(p.lifeInsuranceBalance * 0.03 * 0.128) : 500;
      return {
        estimatedGain: gain,
        riskIfNoAction: 0,
        patrimonialEffect10y: gain * 10,
        explanation: `L'abattement de 4 600 € après 8 ans peut te faire économiser jusqu'à ${gain} €/an sur les rachats.`,
      };
    },
    actions: [
      { id: 'simulate', label: 'Simuler mon épargne', icon: 'Calculator', type: 'simulation', target: '/savings' },
    ],
    tags: ['épargne', 'long terme'],
  },

  // ===== CRYPTO =====
  {
    key: `crypto-2086-${currentYear}`,
    title: 'Formulaire 2086 — Plus-values crypto',
    shortDescription: `Déclaration des cessions de crypto-actifs ${currentYear - 1}`,
    explanation: `Le formulaire 2086 est obligatoire si tu as réalisé des cessions de crypto-actifs (vente contre euros, échange contre un bien/service). Le régime applicable est le PFU de 30% (flat tax) ou le barème progressif sur option. Chaque cession doit être déclarée individuellement avec la méthode du prix moyen pondéré d'acquisition (PMPA).`,
    consequences: `Non-déclaration : amende de 750 € par compte non déclaré (1 500 € si valeur > 50 000 €). Majoration de 10% à 80% sur l'impôt dû. Risque de redressement fiscal sur 3 ans (6 ans en cas de fraude).`,
    category: 'crypto',
    date: new Date(currentYear, 4, 22),
    impactScore: 4,
    estimatedImpact: 0,
    relevanceCondition: (p) => p.hasCrypto || (p.cryptoPnl2025 !== 0),
    computePersonalImpact: (p) => {
      const pnl = p.cryptoPnl2025;
      const tax = pnl > 0 ? Math.round(pnl * 0.30) : 0;
      return {
        estimatedGain: pnl > 0 ? Math.round(pnl * 0.005) : 0, // small optimization via loss harvesting
        riskIfNoAction: pnl > 0 ? tax + 750 : 750,
        patrimonialEffect10y: 0,
        explanation: pnl > 0
          ? `Tes plus-values de ${pnl.toLocaleString('fr-FR')} € génèrent un impôt de ~${tax.toLocaleString('fr-FR')} €. Déclarer correctement évite 750 € d'amende minimum.`
          : pnl < 0
          ? `Tes moins-values de ${Math.abs(pnl).toLocaleString('fr-FR')} € doivent quand même être déclarées. Elles ne sont pas reportables sur les années suivantes.`
          : `Même sans cession, les comptes sur plateformes étrangères doivent être déclarés (formulaire 3916-bis).`,
      };
    },
    externalUrl: 'https://www.impots.gouv.fr/sites/default/files/formulaires/2086/2024/2086_4442.pdf',
    externalUrlLabel: 'Formulaire 2086 officiel',
    formType: '2086',
    hasInAppForm: true,
    actions: [
      { id: 'prepare-2086', label: 'Préparer le formulaire 2086', icon: 'FileText', type: 'navigate', target: '/crypto/2086' },
      { id: 'scan', label: 'Vérifier ma déclaration', icon: 'Search', type: 'guide', target: '/scanner' },
      { id: 'checklist', label: 'Checklist crypto', icon: 'CheckSquare', type: 'checklist' },
    ],
    tags: ['crypto', 'obligatoire', 'annuel'],
  },
  {
    key: `crypto-3916bis-${currentYear}`,
    title: 'Formulaire 3916-bis — Comptes crypto étrangers',
    shortDescription: 'Déclaration des comptes sur plateformes étrangères',
    explanation: `Si tu détiens un compte sur une plateforme crypto basée hors de France (Binance, Kraken, Coinbase…), tu dois le déclarer via le formulaire 3916-bis. C'est obligatoire même si le compte est inactif ou à solde nul.`,
    consequences: `Amende de 750 € par compte non déclaré (1 500 € si valeur > 50 000 €). Cette obligation existe indépendamment de toute cession.`,
    category: 'crypto',
    date: new Date(currentYear, 4, 22),
    impactScore: 3,
    estimatedImpact: 0,
    relevanceCondition: (p) => p.hasCrypto,
    computePersonalImpact: () => ({
      estimatedGain: 0,
      riskIfNoAction: 750,
      patrimonialEffect10y: 0,
      explanation: `Chaque compte crypto étranger non déclaré expose à 750 € d'amende minimum. Simple formulaire à remplir.`,
    }),
    externalUrl: 'https://www.impots.gouv.fr/sites/default/files/formulaires/3916/2024/3916_4738.pdf',
    externalUrlLabel: 'Formulaire 3916-bis officiel',
    formType: '3916-bis',
    hasInAppForm: true,
    actions: [
      { id: 'inapp-form', label: 'Remplir le 3916-bis', icon: 'FileText', type: 'inapp-form' },
    ],
    tags: ['crypto', 'obligatoire', 'annuel'],
  },

  // ===== SOCIAL / PRO =====
  {
    key: `urssaf-q1-${currentYear}`,
    title: 'Déclaration URSSAF — T1',
    shortDescription: `Cotisations sociales du 1er trimestre ${currentYear}`,
    explanation: `En tant qu'indépendant, tu dois déclarer ton chiffre d'affaires trimestriellement (ou mensuellement) à l'URSSAF. Le taux de cotisation dépend de ton activité (22% prestations de services, 12,3% vente).`,
    consequences: `Majoration de 5% + pénalités de retard. Risque de taxation d'office si pas de déclaration.`,
    category: 'social',
    date: new Date(currentYear, 3, 30), // 30 avril
    impactScore: 4,
    estimatedImpact: 0,
    relevanceCondition: (p) => p.isSelfEmployed,
    computePersonalImpact: (p) => {
      const quarterly = Math.round(p.annualRevenueHt / 4);
      const cotisation = Math.round(quarterly * 0.22);
      return {
        estimatedGain: 0,
        riskIfNoAction: Math.round(cotisation * 0.05),
        patrimonialEffect10y: 0,
        explanation: `CA estimé T1 : ${quarterly.toLocaleString('fr-FR')} €. Cotisation : ~${cotisation.toLocaleString('fr-FR')} €. Retard = 5% de majoration.`,
      };
    },
    actions: [
      { id: 'urssaf', label: 'Déclarer URSSAF', icon: 'FileText', type: 'external', target: 'https://www.autoentrepreneur.urssaf.fr/' },
      { id: 'track', label: 'Suivi URSSAF', icon: 'BarChart', type: 'simulation', target: '/pro/urssaf' },
    ],
    tags: ['indépendant', 'trimestriel', 'obligatoire'],
  },
  {
    key: `urssaf-q2-${currentYear}`,
    title: 'Déclaration URSSAF — T2',
    shortDescription: `Cotisations sociales du 2ème trimestre ${currentYear}`,
    explanation: `Déclaration trimestrielle obligatoire de ton chiffre d'affaires à l'URSSAF.`,
    consequences: `Majoration de 5% + pénalités de retard.`,
    category: 'social',
    date: new Date(currentYear, 6, 31),
    impactScore: 4,
    estimatedImpact: 0,
    relevanceCondition: (p) => p.isSelfEmployed,
    computePersonalImpact: (p) => {
      const quarterly = Math.round(p.annualRevenueHt / 4);
      const cotisation = Math.round(quarterly * 0.22);
      return { estimatedGain: 0, riskIfNoAction: Math.round(cotisation * 0.05), patrimonialEffect10y: 0, explanation: `CA estimé T2 : ${quarterly.toLocaleString('fr-FR')} €.` };
    },
    actions: [
      { id: 'urssaf', label: 'Déclarer URSSAF', icon: 'FileText', type: 'external', target: 'https://www.autoentrepreneur.urssaf.fr/' },
    ],
    tags: ['indépendant', 'trimestriel', 'obligatoire'],
  },
  {
    key: `urssaf-q3-${currentYear}`,
    title: 'Déclaration URSSAF — T3',
    shortDescription: `Cotisations sociales du 3ème trimestre ${currentYear}`,
    explanation: `Déclaration trimestrielle obligatoire de ton chiffre d'affaires à l'URSSAF.`,
    consequences: `Majoration de 5% + pénalités de retard.`,
    category: 'social',
    date: new Date(currentYear, 9, 31),
    impactScore: 4,
    estimatedImpact: 0,
    relevanceCondition: (p) => p.isSelfEmployed,
    computePersonalImpact: (p) => {
      const quarterly = Math.round(p.annualRevenueHt / 4);
      const cotisation = Math.round(quarterly * 0.22);
      return { estimatedGain: 0, riskIfNoAction: Math.round(cotisation * 0.05), patrimonialEffect10y: 0, explanation: `CA estimé T3 : ${quarterly.toLocaleString('fr-FR')} €.` };
    },
    actions: [
      { id: 'urssaf', label: 'Déclarer URSSAF', icon: 'FileText', type: 'external', target: 'https://www.autoentrepreneur.urssaf.fr/' },
    ],
    tags: ['indépendant', 'trimestriel', 'obligatoire'],
  },
  {
    key: `urssaf-q4-${currentYear}`,
    title: 'Déclaration URSSAF — T4',
    shortDescription: `Cotisations sociales du 4ème trimestre ${currentYear}`,
    explanation: `Déclaration trimestrielle obligatoire de ton chiffre d'affaires à l'URSSAF.`,
    consequences: `Majoration de 5% + pénalités de retard.`,
    category: 'social',
    date: new Date(currentYear + 1, 0, 31),
    impactScore: 4,
    estimatedImpact: 0,
    relevanceCondition: (p) => p.isSelfEmployed,
    computePersonalImpact: (p) => {
      const quarterly = Math.round(p.annualRevenueHt / 4);
      const cotisation = Math.round(quarterly * 0.22);
      return { estimatedGain: 0, riskIfNoAction: Math.round(cotisation * 0.05), patrimonialEffect10y: 0, explanation: `CA estimé T4 : ${quarterly.toLocaleString('fr-FR')} €.` };
    },
    actions: [
      { id: 'urssaf', label: 'Déclarer URSSAF', icon: 'FileText', type: 'external', target: 'https://www.autoentrepreneur.urssaf.fr/' },
    ],
    tags: ['indépendant', 'trimestriel', 'obligatoire'],
  },

  // ===== EMPLOI =====
  {
    key: `epargne-salariale-${currentYear}`,
    title: 'Épargne salariale (PEE/PERCO)',
    shortDescription: 'Maximise l\'abondement employeur avant fin d\'année',
    explanation: `L'épargne salariale (PEE, PERCO) permet de bénéficier d'un abondement employeur (jusqu'à 300% de ton versement). Les sommes sont exonérées d'IR si bloquées 5 ans (PEE) ou jusqu'à la retraite (PERCO).`,
    consequences: `L'abondement non utilisé est perdu. C'est de l'argent "gratuit" que tu laisses sur la table.`,
    category: 'investissement',
    date: new Date(currentYear, 11, 15),
    impactScore: 4,
    estimatedImpact: 2000,
    relevanceCondition: (p) => p.isEmployee && (p.peeAmount > 0 || p.percoAmount > 0),
    computePersonalImpact: (p) => {
      const totalEpargne = p.peeAmount + p.percoAmount;
      const estimatedAbondement = Math.round(totalEpargne * 0.5); // estimate 50% match
      return {
        estimatedGain: estimatedAbondement,
        riskIfNoAction: estimatedAbondement,
        patrimonialEffect10y: estimatedAbondement * 10,
        explanation: `Ton abondement employeur estimé est de ~${estimatedAbondement.toLocaleString('fr-FR')} €/an. Ne pas verser = perdre cet argent.`,
      };
    },
    guideId: 'epargne-salariale',
    actions: [
      { id: 'guide', label: 'Guide épargne salariale', icon: 'BookOpen', type: 'guide', target: 'epargne-salariale' },
    ],
    tags: ['salarié', 'abondement', 'annuel'],
  },

  // ===== IMMOBILIER =====
  {
    key: `revision-loyers-${currentYear}`,
    title: 'Révision annuelle des loyers',
    shortDescription: 'Ajuste tes loyers selon l\'IRL',
    explanation: `L'Indice de Référence des Loyers (IRL) permet de revaloriser les loyers chaque année. Ne pas le faire = perte de revenus cumulée sur toute la durée du bail.`,
    consequences: `Perte de revenus locatifs cumulée. En moyenne 2-3% par an non récupérés.`,
    category: 'immobilier',
    date: new Date(currentYear, 0, 15),
    impactScore: 3,
    estimatedImpact: 500,
    relevanceCondition: (p) => p.hasRentalIncome,
    computePersonalImpact: () => ({
      estimatedGain: 500,
      riskIfNoAction: 500,
      patrimonialEffect10y: 5000,
      explanation: `La revalorisation IRL représente ~2-3% de tes loyers annuels. Sur 10 ans, ne pas ajuster peut coûter plus de 5 000 €.`,
    }),
    actions: [
      { id: 'simulate', label: 'Simuler l\'impact', icon: 'Calculator', type: 'simulation', target: '/simulator' },
    ],
    tags: ['propriétaire', 'locatif', 'annuel'],
  },

  // ===== PROPRIÉTAIRE RÉSIDENCE PRINCIPALE =====
  {
    key: `taxe-habitation-${currentYear}`,
    title: 'Taxe d\'habitation (résidences secondaires)',
    shortDescription: 'Paiement de la taxe d\'habitation sur résidences secondaires',
    explanation: `Depuis 2023, la taxe d'habitation ne concerne plus les résidences principales. Mais si tu possèdes une résidence secondaire, elle reste due. Le paiement est à effectuer avant mi-décembre.`,
    consequences: `Majoration de 10% en cas de retard de paiement.`,
    category: 'fiscalite',
    date: new Date(currentYear, 11, 15),
    impactScore: 2,
    estimatedImpact: 0,
    relevanceCondition: (p) => p.isHomeowner && p.hasRentalIncome,
    computePersonalImpact: () => ({
      ...defaultImpact(),
      explanation: `Si tu as une résidence secondaire, vérifie ton avis de taxe d'habitation sur impots.gouv.fr.`,
    }),
    actions: [
      { id: 'external', label: 'Vérifier sur impots.gouv', icon: 'ExternalLink', type: 'external', target: 'https://www.impots.gouv.fr/accueil' },
    ],
    tags: ['propriétaire', 'annuel'],
  },
  {
    key: `assurance-habitation-revision-${currentYear}`,
    title: 'Révision assurance habitation',
    shortDescription: 'Compare et optimise ton contrat d\'assurance habitation',
    explanation: `L'assurance habitation augmente en moyenne de 3-5% par an. Comparer les offres chaque année peut faire économiser 100 à 300 €. C'est aussi l'occasion de vérifier que ta couverture correspond à ta situation.`,
    consequences: `Surcoût annuel cumulé. Risque de sous-assurance si ta situation a changé (travaux, valeur mobilier).`,
    category: 'administratif',
    date: new Date(currentYear, 0, 31),
    impactScore: 2,
    estimatedImpact: 200,
    relevanceCondition: (p) => p.isHomeowner,
    computePersonalImpact: () => ({
      estimatedGain: 200,
      riskIfNoAction: 0,
      patrimonialEffect10y: 2000,
      explanation: `En comparant chaque année, tu peux économiser ~200 €/an sur ton assurance habitation.`,
    }),
    actions: [],
    tags: ['propriétaire', 'annuel', 'optimisation'],
  },
  {
    key: `declaration-biens-immobiliers-${currentYear}`,
    title: 'Déclaration d\'occupation des biens immobiliers',
    shortDescription: 'Déclarer l\'occupation de tes biens sur impots.gouv.fr',
    explanation: `Depuis 2023, tous les propriétaires doivent déclarer l'occupation de leurs biens immobiliers (résidence principale, secondaire, locations) sur impots.gouv.fr avant le 1er juillet.`,
    consequences: `Amende de 150 € par local non déclaré ou mal déclaré.`,
    category: 'fiscalite',
    date: new Date(currentYear, 5, 30),
    impactScore: 3,
    estimatedImpact: 0,
    relevanceCondition: (p) => p.isHomeowner || p.hasRentalIncome,
    computePersonalImpact: () => ({
      estimatedGain: 0,
      riskIfNoAction: 150,
      patrimonialEffect10y: 0,
      explanation: `Tu dois indiquer qui occupe chacun de tes biens. Non-déclaration = 150 € d'amende par local.`,
    }),
    actions: [
      { id: 'external', label: 'Déclarer sur impots.gouv', icon: 'ExternalLink', type: 'external', target: 'https://www.impots.gouv.fr/biens-immobiliers' },
    ],
    tags: ['propriétaire', 'obligatoire', 'annuel'],
  },

  // ===== ENFANTS / FAMILLE =====
  {
    key: `allocation-rentree-scolaire-${currentYear}`,
    title: 'Allocation de rentrée scolaire (ARS)',
    shortDescription: 'Vérifie ton éligibilité à l\'ARS pour tes enfants',
    explanation: `L'ARS est versée mi-août par la CAF aux familles ayant des enfants de 6 à 18 ans scolarisés. Le montant varie de 398 € à 434 € par enfant selon l'âge (2025). Sous conditions de ressources.`,
    consequences: `Non-demande = perte de 398 à 434 € par enfant. L'aide n'est pas rétroactive.`,
    category: 'administratif',
    date: new Date(currentYear, 6, 15),
    impactScore: 4,
    estimatedImpact: 400,
    relevanceCondition: (p) => p.childrenCount > 0,
    computePersonalImpact: (p) => {
      const gain = p.childrenCount * 416;
      return {
        estimatedGain: gain,
        riskIfNoAction: gain,
        patrimonialEffect10y: gain * 10,
        explanation: `Avec ${p.childrenCount} enfant(s), tu peux recevoir jusqu'à ${gain} € pour la rentrée scolaire.`,
      };
    },
    actions: [
      { id: 'external', label: 'Vérifier sur caf.fr', icon: 'ExternalLink', type: 'external', target: 'https://www.caf.fr/allocataires/droits-et-prestations/s-informer-sur-les-aides/enfance-et-jeunesse/l-allocation-de-rentree-scolaire-ars' },
    ],
    tags: ['famille', 'annuel', 'aide'],
  },
  {
    key: `declaration-garde-enfant-${currentYear}`,
    title: 'Crédit d\'impôt frais de garde',
    shortDescription: 'Déclare les frais de garde pour récupérer 50% en crédit d\'impôt',
    explanation: `Si tu fais garder tes enfants de moins de 6 ans (crèche, nounou, centre de loisirs), tu bénéficies d'un crédit d'impôt de 50% des dépenses, plafonné à 3 500 € par enfant (soit 1 750 € de crédit max).`,
    consequences: `Oubli de déclaration = perte de 1 750 € de crédit d'impôt par enfant de moins de 6 ans.`,
    category: 'fiscalite',
    date: new Date(currentYear, 4, 22),
    impactScore: 5,
    estimatedImpact: 1750,
    relevanceCondition: (p) => p.childrenCount > 0,
    computePersonalImpact: (p) => {
      const credit = p.childrenCount * 1750;
      return {
        estimatedGain: credit,
        riskIfNoAction: credit,
        patrimonialEffect10y: credit * 6,
        explanation: `Avec ${p.childrenCount} enfant(s), tu peux récupérer jusqu'à ${credit} € de crédit d'impôt pour frais de garde.`,
      };
    },
    actions: [
      { id: 'scan', label: 'Scanner ma déclaration', icon: 'Search', type: 'guide', target: '/scanner' },
    ],
    tags: ['famille', 'crédit impôt', 'annuel'],
  },
  {
    key: `allocations-familiales-${currentYear}`,
    title: 'Allocations familiales — mise à jour',
    shortDescription: 'Mets à jour ta situation familiale sur caf.fr',
    explanation: `Les allocations familiales sont versées dès le 2ème enfant. Tu dois déclarer chaque changement de situation (naissance, déménagement, changement de revenus) pour ne pas perdre tes droits. La CAF effectue un recalcul en janvier.`,
    consequences: `Trop-perçus à rembourser ou droits non versés en cas de situation non actualisée.`,
    category: 'administratif',
    date: new Date(currentYear, 0, 15),
    impactScore: 3,
    estimatedImpact: 0,
    relevanceCondition: (p) => p.childrenCount >= 2,
    computePersonalImpact: (p) => {
      const monthlyAF = p.childrenCount === 2 ? 141 : p.childrenCount === 3 ? 322 : p.childrenCount >= 4 ? 503 : 0;
      return {
        estimatedGain: monthlyAF * 12,
        riskIfNoAction: monthlyAF * 3,
        patrimonialEffect10y: 0,
        explanation: `Tes allocations familiales estimées : ~${monthlyAF} €/mois. Vérifie que ta situation est à jour.`,
      };
    },
    actions: [
      { id: 'external', label: 'Mettre à jour sur caf.fr', icon: 'ExternalLink', type: 'external', target: 'https://www.caf.fr/' },
    ],
    tags: ['famille', 'mensuel'],
  },
  {
    key: `prime-naissance-${currentYear}`,
    title: 'Prime à la naissance / adoption',
    shortDescription: 'Demande la prime de naissance (1 003,95 €) avant le 7ème mois',
    explanation: `La prime à la naissance est versée au 7ème mois de grossesse (1 003,95 € en 2025). Pour l'adoption, elle est de 2 007,90 €. La demande doit être faite avant la fin du 6ème mois de grossesse via la CAF.`,
    consequences: `Si la déclaration de grossesse n'est pas faite à temps, le versement peut être retardé ou perdu.`,
    category: 'administratif',
    date: new Date(currentYear, 5, 1),
    impactScore: 4,
    estimatedImpact: 1004,
    relevanceCondition: (p) => p.childrenCount > 0 && p.familyStatus !== 'single',
    computePersonalImpact: () => ({
      estimatedGain: 1004,
      riskIfNoAction: 1004,
      patrimonialEffect10y: 0,
      explanation: `Si tu attends un enfant, pense à déclarer ta grossesse avant le 6ème mois pour recevoir la prime de 1 003,95 €.`,
    }),
    actions: [
      { id: 'external', label: 'Demander sur caf.fr', icon: 'ExternalLink', type: 'external', target: 'https://www.caf.fr/' },
    ],
    tags: ['famille', 'naissance', 'aide'],
  },

  // ===== COUPLE / MARIAGE / PACS =====
  {
    key: `declaration-commune-${currentYear}`,
    title: 'Déclaration commune (couple marié/pacsé)',
    shortDescription: 'Optimise ta déclaration en couple pour réduire ton impôt',
    explanation: `Si tu es marié(e) ou pacsé(e), la déclaration commune peut réduire ton impôt grâce au quotient conjugal (2 parts au lieu d'une). L'avantage est maximal quand les revenus sont déséquilibrés dans le couple.`,
    consequences: `Déclaration séparée quand la commune est plus avantageuse = surcoût fiscal potentiel de plusieurs centaines à milliers d'euros.`,
    category: 'fiscalite',
    date: new Date(currentYear, 4, 22),
    impactScore: 4,
    estimatedImpact: 1500,
    relevanceCondition: (p) => ['married', 'pacs'].includes(p.familyStatus),
    computePersonalImpact: (p) => {
      const totalIncome = (p.netMonthlySalary + p.spouseIncome) * 12;
      const diff = Math.abs(p.netMonthlySalary - p.spouseIncome) * 12;
      const gain = Math.round(diff * 0.05);
      return {
        estimatedGain: gain,
        riskIfNoAction: 0,
        patrimonialEffect10y: gain * 10,
        explanation: totalIncome > 0 
          ? `L'écart de revenus dans ton couple (${diff.toLocaleString('fr-FR')} €/an) peut générer une économie de ~${gain} € via la déclaration commune.`
          : `La déclaration commune permet de bénéficier du quotient conjugal.`,
      };
    },
    actions: [
      { id: 'optimize', label: 'Simuler l\'avantage', icon: 'Calculator', type: 'simulation', target: '/simulator' },
    ],
    tags: ['couple', 'annuel', 'optimisation'],
  },

  // ===== RETRAITE =====
  {
    key: `verification-releve-carriere-${currentYear}`,
    title: 'Vérification relevé de carrière',
    shortDescription: 'Vérifie tes trimestres validés sur info-retraite.fr',
    explanation: `Des trimestres manquants ou mal enregistrés peuvent réduire ta pension de retraite. Plus tu vérifies tôt, plus c'est facile à corriger. Un trimestre manquant peut coûter jusqu'à 1,25% de pension en moins.`,
    consequences: `Pension de retraite diminuée définitivement. Les corrections sont plus difficiles après la liquidation.`,
    category: 'administratif',
    date: new Date(currentYear, 2, 31),
    impactScore: 4,
    estimatedImpact: 2000,
    relevanceCondition: (p) => p.isRetired || (p.isEmployee && estimateTMI(p) >= 30),
    computePersonalImpact: () => ({
      estimatedGain: 2000,
      riskIfNoAction: 5000,
      patrimonialEffect10y: 20000,
      explanation: `Chaque trimestre manquant peut réduire ta pension. Vérifie ton relevé de carrière chaque année.`,
    }),
    actions: [
      { id: 'external', label: 'Consulter info-retraite.fr', icon: 'ExternalLink', type: 'external', target: 'https://www.info-retraite.fr/' },
    ],
    tags: ['retraite', 'annuel'],
  },

  // ===== OPTIMISATIONS PROACTIVES =====
  {
    key: `cheque-energie-${currentYear}`,
    title: 'Chèque énergie',
    shortDescription: 'Vérifie si tu es éligible au chèque énergie (48 à 277 €)',
    explanation: `Le chèque énergie est envoyé automatiquement aux foyers éligibles (sous conditions de revenus). Il peut être utilisé pour payer les factures d'énergie ou financer des travaux de rénovation. Si tu ne l'as pas reçu, tu peux vérifier ton éligibilité.`,
    consequences: `Aide non réclamée = perte de 48 à 277 € par an.`,
    category: 'administratif',
    date: new Date(currentYear, 3, 30),
    impactScore: 3,
    estimatedImpact: 150,
    relevanceCondition: (p) => {
      const annualIncome = p.netMonthlySalary * 12 || p.annualRevenueHt * 0.66;
      return annualIncome < 11000 || (annualIncome < 17400 && p.childrenCount > 0);
    },
    computePersonalImpact: () => ({
      estimatedGain: 150,
      riskIfNoAction: 150,
      patrimonialEffect10y: 1500,
      explanation: `Tu es potentiellement éligible au chèque énergie. Vérifie sur chequeenergie.gouv.fr.`,
    }),
    actions: [
      { id: 'external', label: 'Vérifier l\'éligibilité', icon: 'ExternalLink', type: 'external', target: 'https://chequeenergie.gouv.fr/' },
    ],
    tags: ['aide', 'annuel'],
  },
  {
    key: `maprimerennov-${currentYear}`,
    title: 'MaPrimeRénov\'',
    shortDescription: 'Aide pour les travaux de rénovation énergétique',
    explanation: `MaPrimeRénov' finance les travaux de rénovation énergétique (isolation, chauffage, ventilation). Le montant dépend de tes revenus et du type de travaux. Jusqu'à 20 000 € d'aide possible.`,
    consequences: `Travaux plus chers si non financés par l'aide. DPE bas = moins-value immobilière.`,
    category: 'immobilier',
    date: new Date(currentYear, 2, 31),
    impactScore: 4,
    estimatedImpact: 5000,
    relevanceCondition: (p) => p.isHomeowner,
    computePersonalImpact: () => ({
      estimatedGain: 5000,
      riskIfNoAction: 0,
      patrimonialEffect10y: 15000,
      explanation: `En tant que propriétaire, tu peux bénéficier de MaPrimeRénov' pour tes travaux de rénovation énergétique (jusqu'à 20 000 €).`,
    }),
    actions: [
      { id: 'external', label: 'Simuler sur maprimerenov.gouv.fr', icon: 'ExternalLink', type: 'external', target: 'https://www.maprimerenov.gouv.fr/' },
    ],
    tags: ['propriétaire', 'aide', 'rénovation'],
  },
  {
    key: `prime-activite-${currentYear}`,
    title: 'Prime d\'activité',
    shortDescription: 'Complément de revenus pour les travailleurs modestes',
    explanation: `La prime d'activité est versée par la CAF aux salariés, indépendants ou étudiants salariés gagnant plus de 1 047 € net/mois. Le montant dépend de la composition du foyer et des revenus. Elle se demande tous les 3 mois.`,
    consequences: `En moyenne 180 €/mois non réclamés. L'aide n'est pas rétroactive au-delà de 3 mois.`,
    category: 'administratif',
    date: new Date(currentYear, 0, 5),
    impactScore: 5,
    estimatedImpact: 2160,
    relevanceCondition: (p) => {
      const monthlyIncome = p.netMonthlySalary || p.annualRevenueHt / 12 * 0.66;
      return monthlyIncome > 1047 && monthlyIncome < 1900;
    },
    computePersonalImpact: (p) => {
      const monthlyIncome = p.netMonthlySalary || p.annualRevenueHt / 12 * 0.66;
      const estimatedPrime = Math.max(0, Math.round((1900 - monthlyIncome) * 0.5));
      return {
        estimatedGain: estimatedPrime * 12,
        riskIfNoAction: estimatedPrime * 3,
        patrimonialEffect10y: estimatedPrime * 120,
        explanation: `Avec tes revenus, tu pourrais recevoir ~${estimatedPrime} €/mois de prime d'activité. Pense à renouveler la demande tous les 3 mois.`,
      };
    },
    actions: [
      { id: 'external', label: 'Demander sur caf.fr', icon: 'ExternalLink', type: 'external', target: 'https://www.caf.fr/allocataires/droits-et-prestations/s-informer-sur-les-aides/solidarite-et-insertion/la-prime-d-activite' },
    ],
    tags: ['aide', 'trimestriel'],
  },
  {
    key: `declaration-revenus-locatifs-${currentYear}`,
    title: 'Déclaration revenus locatifs (2044)',
    shortDescription: 'Déclare tes revenus fonciers et déduis tes charges',
    explanation: `Si tu perçois des revenus locatifs, tu dois les déclarer via le formulaire 2044 (régime réel) ou directement sur la 2042 (micro-foncier < 15 000 €/an). Le régime réel permet de déduire travaux, intérêts d'emprunt, assurances.`,
    consequences: `Non-déclaration = redressement fiscal avec majoration. En régime réel, les charges non déduites = impôt payé en trop.`,
    category: 'fiscalite',
    date: new Date(currentYear, 4, 22),
    impactScore: 5,
    estimatedImpact: 2000,
    relevanceCondition: (p) => p.hasRentalIncome,
    computePersonalImpact: (p) => {
      const tmi = estimateTMI(p);
      const deductible = p.mortgageRemaining > 0 ? 3000 : 1000;
      const gain = Math.round(deductible * tmi / 100);
      return {
        estimatedGain: gain,
        riskIfNoAction: Math.round(deductible * tmi / 100 * 0.1),
        patrimonialEffect10y: gain * 10,
        explanation: `En déclarant correctement tes revenus locatifs et charges déductibles, tu peux économiser ~${gain} €/an.`,
      };
    },
    actions: [
      { id: 'scan', label: 'Scanner ma déclaration', icon: 'Search', type: 'guide', target: '/scanner' },
      { id: 'simulate', label: 'Simuler l\'impact', icon: 'Calculator', type: 'simulation', target: '/simulator' },
    ],
    tags: ['locatif', 'obligatoire', 'annuel'],
  },
  {
    key: `dons-deduction-${currentYear}`,
    title: 'Déduction dons et mécénat',
    shortDescription: 'Déclare tes dons pour bénéficier de 66% à 75% de réduction',
    explanation: `Les dons aux associations reconnues d'utilité publique ouvrent droit à une réduction d'impôt de 66% (dans la limite de 20% du revenu imposable). Pour les associations d'aide aux personnes en difficulté, c'est 75% jusqu'à 1 000 €.`,
    consequences: `Ne pas déclarer tes dons = perdre 66 à 75% de leur valeur en réduction d'impôt.`,
    category: 'fiscalite',
    date: new Date(currentYear, 4, 22),
    impactScore: 3,
    estimatedImpact: 500,
    relevanceCondition: () => true,
    computePersonalImpact: () => ({
      estimatedGain: 500,
      riskIfNoAction: 0,
      patrimonialEffect10y: 5000,
      explanation: `Si tu as fait des dons cette année, pense à les déclarer pour récupérer 66 à 75% en réduction d'impôt.`,
    }),
    actions: [
      { id: 'scan', label: 'Vérifier ma déclaration', icon: 'Search', type: 'guide', target: '/scanner' },
    ],
    tags: ['déduction', 'annuel'],
  },
];
