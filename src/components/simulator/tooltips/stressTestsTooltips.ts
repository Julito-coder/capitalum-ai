export const stressTestsTooltips = {
  rentHaircut: {
    title: "Haircut sur loyer",
    definition: "Réduction appliquée au loyer de marché pour simuler un scénario pessimiste.",
    impact: "Un haircut de -10% simule une baisse de loyer due à une vacance prolongée ou à un marché défavorable.",
    typicalValues: "-5% à -15% selon le niveau de prudence souhaité",
    source: "Pratique bancaire standard pour l'analyse de risque"
  },
  vacancyHaircut: {
    title: "Haircut sur vacance",
    definition: "Majoration du taux de vacance locative pour stress test.",
    impact: "Augmente la période sans locataire, réduisant les revenus annuels effectifs.",
    typicalValues: "+50% à +100% du taux de vacance initial",
    source: "Hypothèses prudentes des analystes crédit immobilier"
  },
  rateHaircut: {
    title: "Stress taux d'intérêt",
    definition: "Points de pourcentage ajoutés au taux nominal pour simuler une hausse des taux.",
    impact: "Augmente la mensualité et réduit le cashflow disponible. Critique pour évaluer la résistance du projet.",
    typicalValues: "+1% à +2% selon l'horizon et la politique monétaire",
    source: "Recommandations HCSF et pratiques bancaires"
  },
  costsHaircut: {
    title: "Haircut sur charges",
    definition: "Majoration des charges d'exploitation pour anticiper des hausses imprévues.",
    impact: "Simule l'inflation des charges, travaux imprévus ou augmentation fiscale.",
    typicalValues: "+5% à +15% selon le niveau de prudence",
    source: "Analyse de sensibilité standard"
  },
  dscr: {
    title: "DSCR (Debt Service Coverage Ratio)",
    definition: "Ratio de couverture de la dette = NOI / Service de la dette annuel.",
    impact: "Mesure la capacité du projet à rembourser ses échéances. Un DSCR < 1 signifie un cashflow négatif.",
    typicalValues: "> 1.2 acceptable, > 1.3 confortable, > 1.5 excellent",
    source: "Critère clé d'analyse bancaire pour le financement immobilier"
  },
  stressedCashflow: {
    title: "Cashflow stressé",
    definition: "Cashflow mensuel après application de tous les haircuts pessimistes.",
    impact: "Montre le 'pire cas raisonnable' pour évaluer la résilience financière du projet.",
    typicalValues: "Doit rester positif ou l'effort d'épargne doit être soutenable",
    source: "Calcul interne basé sur les paramètres de stress"
  },
  safetyMargin: {
    title: "Marge de sécurité",
    definition: "Écart entre le cashflow base et le cashflow stressé.",
    impact: "Indique la capacité d'absorption des chocs. Plus la marge est grande, plus le projet est résilient.",
    typicalValues: "Minimum 20% recommandé pour un investissement serein",
    source: "Bonne pratique de gestion de risque patrimonial"
  },
  breakEvenAnalysis: {
    title: "Analyse de seuil",
    definition: "Détermine les valeurs limites (loyer min, taux max) avant que le projet devienne non viable.",
    impact: "Permet d'identifier les points de rupture et les marges de manœuvre.",
    typicalValues: "Le loyer de seuil doit être significativement inférieur au loyer de marché",
    source: "Outil d'aide à la décision pour investisseurs avertis"
  }
};
