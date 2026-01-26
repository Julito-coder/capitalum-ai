import { FieldTooltipData } from '../FieldTooltip';

export const SALE_TOOLTIPS: Record<string, FieldTooltipData> = {
  resaleYear: {
    shortTip: "Année de revente prévue",
    definition: "L'horizon de détention avant revente du bien, en nombre d'années depuis l'acquisition.",
    impact: "Détermine la durée d'amortissement du crédit, les abattements sur plus-value, et la stratégie patrimoniale.",
    typicalValue: "10-20 ans pour un investissement locatif, variable pour une RP.",
    source: "Votre stratégie patrimoniale, objectifs de vie.",
    example: "Revente à 15 ans → crédit potentiellement remboursé, abattements PV significatifs."
  },

  propertyGrowthRate: {
    shortTip: "Taux de croissance annuelle du bien",
    definition: "Le taux d'appréciation annuel estimé de la valeur du bien immobilier.",
    impact: "Détermine directement la valeur de revente et donc le patrimoine final et la plus-value.",
    typicalValue: "1-3%/an historiquement en France, très variable selon les zones.",
    source: "Indices notaires-INSEE, historique local, tendances marché.",
    example: "200 000€ avec +2%/an pendant 20 ans → ~297 000€."
  },

  prudentGrowthRate: {
    shortTip: "Hypothèse pessimiste de croissance",
    definition: "Un scénario conservateur de croissance de la valeur, utilisé pour le stress test.",
    impact: "Permet de voir si le projet reste viable même avec une faible valorisation.",
    typicalValue: "0-1%/an, voire négatif dans certains marchés.",
    source: "Analyse du risque, historique des corrections de marché.",
  },

  optimistGrowthRate: {
    shortTip: "Hypothèse optimiste de croissance",
    definition: "Un scénario favorable de croissance de la valeur, pour estimer le potentiel maximal.",
    impact: "Montre le potentiel de gains si le marché est porteur.",
    typicalValue: "3-5%/an dans les zones dynamiques.",
    source: "Projets urbains, dynamisme économique local.",
  },

  resaleAgencyPct: {
    shortTip: "Commission agence à la revente",
    definition: "Le pourcentage de commission prélevé par l'agence immobilière lors de la revente.",
    impact: "Réduit le produit net de cession. Négociable selon le marché et le prix.",
    typicalValue: "3-6% selon le prix du bien et le marché local.",
    source: "Mandats de vente, négociation avec les agences.",
    example: "Revente 300 000€ avec 5% de frais → 15 000€ de commission."
  },

  resaleOtherFees: {
    shortTip: "Autres frais de revente",
    definition: "Les frais annexes à la revente : diagnostics obligatoires, état datés, mainlevée d'hypothèque...",
    impact: "Coûts souvent oubliés qui réduisent le produit net.",
    typicalValue: "500-2000€ selon la situation.",
    source: "Devis diagnostiqueurs, syndic, banque.",
  },

  resaleWorks: {
    shortTip: "Travaux de valorisation avant revente",
    definition: "Les travaux effectués pour améliorer le bien et maximiser le prix de vente.",
    impact: "Investissement qui peut augmenter significativement le prix de vente si bien ciblé.",
    typicalValue: "0€ si le bien est entretenu, 5-15% du prix si rénovation nécessaire.",
    source: "État du bien, standards du marché local.",
  },

  capitalGainTaxMode: {
    shortTip: "Mode de calcul de l'impôt sur plus-value",
    definition: "Choisissez entre un calcul simplifié (taux global) ou détaillé (avec abattements pour durée).",
    impact: "Le mode détaillé est plus précis et prend en compte les exonérations progressives.",
    typicalValue: "Simple pour une estimation rapide, Détaillé pour une simulation précise.",
    source: "Articles 150 U et suivants du CGI.",
  },

  capitalGainTaxRate: {
    shortTip: "Taux global sur plus-values",
    definition: "Le taux d'imposition combiné (IR + PS) sur la plus-value immobilière avant abattements.",
    impact: "36.2% sans abattement, réduit progressivement avec la durée de détention.",
    typicalValue: "36.2% (19% IR + 17.2% PS), exonération totale après 22/30 ans.",
    source: "Service des impôts, simulation notaire.",
  },

  netSaleProceeds: {
    shortTip: "Produit net de cession",
    definition: "Le montant restant après déduction de tous les frais et impôts sur la vente.",
    impact: "C'est la somme réellement encaissée lors de la revente, base du calcul patrimonial.",
    typicalValue: "Valeur de revente - dette restante - frais - impôts.",
    source: "Calcul automatique basé sur vos hypothèses.",
  },

  netPatrimony: {
    shortTip: "Patrimoine net final",
    definition: "La valeur nette totale générée par l'investissement : produit de cession + cashflows cumulés.",
    impact: "Indicateur clé de la réussite de l'investissement sur la durée.",
    typicalValue: "Produit net + cashflows cumulés - apport initial.",
    source: "Calcul automatique.",
  },

  equity: {
    shortTip: "Équité / Valeur nette",
    definition: "La différence entre la valeur du bien et le capital restant dû sur le prêt.",
    impact: "Représente votre patrimoine réel dans le bien à un instant T.",
    typicalValue: "Croît avec les remboursements de capital et la valorisation du bien.",
    source: "Valeur estimée - CRD du prêt.",
    example: "Bien à 250 000€ avec CRD de 150 000€ → Équité de 100 000€."
  },

  irr: {
    shortTip: "Taux de Rentabilité Interne",
    definition: "Le TRI (IRR) est le taux d'actualisation qui annule la VAN de tous les flux de l'investissement.",
    impact: "Mesure la performance globale en intégrant le timing des flux. Compare les investissements entre eux.",
    typicalValue: "5-10% pour un investissement immobilier correct, >10% excellent.",
    source: "Calcul automatique basé sur tous les flux : apport, cashflows, revente.",
    example: "TRI de 8% signifie que l'investissement a généré 8%/an de rendement composé."
  },
};

// Capital gains tax brackets (simplified French model)
export const CAPITAL_GAINS_BRACKETS = {
  irRate: 19, // Impôt sur le revenu
  socialRate: 17.2, // Prélèvements sociaux
  totalRate: 36.2,
  // IR abatement by year of ownership (after 5 years)
  irAbatement: [
    { fromYear: 0, toYear: 5, rate: 0 },
    { fromYear: 6, toYear: 21, rate: 6 }, // 6% per year from year 6 to 21
    { fromYear: 22, rate: 4 }, // 4% for year 22 (full exemption at 22)
  ],
  // Social contributions abatement
  socialAbatement: [
    { fromYear: 0, toYear: 5, rate: 0 },
    { fromYear: 6, toYear: 21, rate: 1.65 }, // 1.65% per year
    { fromYear: 22, rate: 1.6 }, // 1.6% for year 22
    { fromYear: 23, toYear: 30, rate: 9 }, // 9% per year from 23 to 30
  ],
  irExemptionYear: 22,
  socialExemptionYear: 30,
};
