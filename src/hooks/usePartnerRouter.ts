import { useMemo } from 'react';
import { Partner, PARTNERS, PartnerCategory } from '@/data/partnersData';
import { UserProfile } from '@/lib/dashboardService';

export type RecommendationType = 
  | 'per' | 'pea' | 'assurance_vie' | 'neobanque' 
  | 'credit' | 'optimisation_fiscale' | 'epargne_salariale'
  | 'comptabilite' | 'tresorerie';

export interface PartnerRouterResult {
  primary: Partner;
  alternatives: Partner[];
  neobanking: Partner | null;
  relevanceScore: number; // 0-100
}

const getCurrentYear = () => new Date().getFullYear();

const getUserAge = (profile: UserProfile | null): number => {
  // Estimate from birth year if available, default 35
  return 35;
};

const getUserSegment = (profile: UserProfile | null): string => {
  if (!profile) return 'unknown';
  if (profile.isSelfEmployed) return 'independant';
  if (profile.isEmployee) return 'salarie';
  if (profile.isRetired) return 'retraite';
  return 'investisseur';
};

const getAnnualIncome = (profile: UserProfile | null): number => {
  if (!profile) return 30000;
  if (profile.isEmployee) return (profile.grossMonthlySalary || 0) * 12 + (profile.annualBonus || 0);
  if (profile.isSelfEmployed) return profile.annualRevenueHt || 0;
  if (profile.isRetired) return profile.mainPensionAnnual || 0;
  return 30000;
};

const getNetWorth = (profile: UserProfile | null): number => {
  if (!profile) return 0;
  return (profile.peaBalance || 0) + (profile.lifeInsuranceBalance || 0) + (profile.scpiInvestments || 0);
};

const routePER = (profile: UserProfile | null): PartnerRouterResult => {
  const partners = PARTNERS.per;
  const income = getAnnualIncome(profile);
  const netWorth = getNetWorth(profile);
  const isSelfEmployed = profile?.isSelfEmployed || false;

  let primaryIndex = 0; // Default: Carac
  let relevance = 75;

  if (income < 30000) {
    primaryIndex = 2; // Nalo - gestion pilotée, frais bas
    relevance = 80;
  } else if (netWorth > 500000) {
    primaryIndex = 0; // Carac - premium
    relevance = 90;
  } else if (isSelfEmployed) {
    primaryIndex = 0; // Carac - adapté TNS
    relevance = 85;
  }

  const primary = partners[primaryIndex];
  const alternatives = partners.filter((_, i) => i !== primaryIndex);

  return {
    primary,
    alternatives: alternatives.slice(0, 2),
    neobanking: income > 20000 ? PARTNERS.neobanque[0] : null, // N26
    relevanceScore: relevance,
  };
};

const routePEA = (profile: UserProfile | null): PartnerRouterResult => {
  const partners = PARTNERS.pea;
  const peaBalance = profile?.peaBalance || 0;
  const income = getAnnualIncome(profile);

  let primaryIndex = 0; // Trade Republic for beginners
  let relevance = 70;

  if (peaBalance > 50000 || income > 60000) {
    primaryIndex = 1; // Boursorama - gamme large
    relevance = 85;
  } else if (peaBalance > 0) {
    primaryIndex = 2; // Fortuneo - bon compromis
    relevance = 75;
  } else {
    primaryIndex = 0; // Trade Republic - débutant
    relevance = 80;
  }

  const primary = partners[primaryIndex];
  const alternatives = partners.filter((_, i) => i !== primaryIndex);

  return {
    primary,
    alternatives: alternatives.slice(0, 2),
    neobanking: null,
    relevanceScore: relevance,
  };
};

const routeAssuranceVie = (profile: UserProfile | null): PartnerRouterResult => {
  const partners = PARTNERS.assurance_vie;
  const netWorth = getNetWorth(profile);

  let primaryIndex = 0; // Linxea
  if (netWorth < 10000) primaryIndex = 2; // Yomoni - gestion pilotée
  else if (netWorth < 50000) primaryIndex = 1; // Boursorama Vie

  const primary = partners[primaryIndex];
  return {
    primary,
    alternatives: partners.filter((_, i) => i !== primaryIndex).slice(0, 2),
    neobanking: null,
    relevanceScore: 75,
  };
};

const routeNeobanque = (profile: UserProfile | null): PartnerRouterResult => {
  const partners = PARTNERS.neobanque;
  // Default N26, could be Revolut for travelers
  return {
    primary: partners[0],
    alternatives: partners.slice(1, 3),
    neobanking: null,
    relevanceScore: 70,
  };
};

const routeGeneric = (category: PartnerCategory, profile: UserProfile | null): PartnerRouterResult => {
  const partners = PARTNERS[category] || [];
  if (partners.length === 0) {
    return {
      primary: PARTNERS.neobanque[0],
      alternatives: [],
      neobanking: null,
      relevanceScore: 50,
    };
  }

  return {
    primary: partners[0],
    alternatives: partners.slice(1, 3),
    neobanking: null,
    relevanceScore: 70,
  };
};

export const usePartnerRouter = (
  recommendationType: RecommendationType,
  profile: UserProfile | null
): PartnerRouterResult => {
  return useMemo(() => {
    switch (recommendationType) {
      case 'per': return routePER(profile);
      case 'pea': return routePEA(profile);
      case 'assurance_vie': return routeAssuranceVie(profile);
      case 'neobanque': return routeNeobanque(profile);
      default: return routeGeneric(recommendationType, profile);
    }
  }, [recommendationType, profile]);
};

export { getUserSegment };
