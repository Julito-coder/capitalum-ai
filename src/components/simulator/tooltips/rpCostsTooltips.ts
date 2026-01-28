import { FieldTooltipData } from '../FieldTooltip';

export const RP_COSTS_TOOLTIPS: Record<string, FieldTooltipData> = {
  propertyTax: {
    shortTip: "Impôt local annuel basé sur la valeur cadastrale",
    definition: "La taxe foncière est un impôt local payé chaque année par le propriétaire, calculé sur la valeur locative cadastrale du bien.",
    impact: "Charge incompressible qui peut augmenter chaque année. Varie fortement selon les communes (du simple au triple).",
    typicalValue: "500€ à 2 000€/an pour un appartement, 1 000€ à 4 000€ pour une maison.",
    source: "Demandez au vendeur ou consultez le site impots.gouv.fr avec l'adresse du bien.",
    example: "Un T3 de 70m² à Lyon : environ 1 200€/an."
  },
  propertyTaxGrowth: {
    shortTip: "Augmentation annuelle moyenne de la taxe",
    definition: "Taux d'augmentation annuel moyen de la taxe foncière, lié à la revalorisation des bases cadastrales et aux décisions communales.",
    impact: "Une hausse de 3%/an double la taxe en 24 ans. À intégrer dans vos projections long terme.",
    typicalValue: "Entre 1% et 4% selon les communes. Moyenne nationale autour de 2-3%.",
    source: "Historique des avis de taxe foncière sur plusieurs années.",
  },
  condoCharges: {
    shortTip: "Charges de copropriété annuelles",
    definition: "Ensemble des charges pour l'entretien des parties communes : ascenseur, chauffage collectif, gardien, nettoyage, espaces verts...",
    impact: "Représente souvent 15-25% du budget logement mensuel. Des charges élevées peuvent cacher un immeuble mal géré.",
    typicalValue: "20€ à 50€/m²/an selon les prestations. Beaucoup plus avec chauffage collectif ou gardien.",
    source: "Les 3 derniers PV d'AG de copropriété et le relevé de charges annuel.",
    example: "T3 de 70m² avec ascenseur et gardien : 2 500€/an soit 35€/m²."
  },
  condoWorksReserve: {
    shortTip: "Provision obligatoire pour travaux futurs",
    definition: "Fonds de travaux obligatoire (loi ALUR) alimenté par les copropriétaires pour financer les futurs gros travaux de l'immeuble.",
    impact: "Provision utile pour éviter les appels de fonds exceptionnels. Minimum 5% du budget prévisionnel.",
    typicalValue: "200€ à 800€/an selon la taille du lot et l'état de l'immeuble.",
    source: "Budget prévisionnel de la copropriété et dernier appel de fonds.",
  },
  homeInsurance: {
    shortTip: "Assurance multirisque habitation",
    definition: "Assurance couvrant les dommages à votre logement (incendie, dégâts des eaux, vol...) et votre responsabilité civile.",
    impact: "Obligatoire pour un propriétaire occupant. Le montant dépend de la surface, localisation et garanties choisies.",
    typicalValue: "150€ à 400€/an pour un appartement, 250€ à 600€ pour une maison.",
    source: "Devis comparatifs auprès d'assureurs (en ligne ou courtier).",
  },
  maintenanceMode: {
    shortTip: "Méthode de calcul du budget entretien",
    definition: "Choisissez entre un pourcentage de la valeur du bien (méthode patrimoniale) ou un montant fixe annuel (méthode budgétaire).",
    impact: "Le % de la valeur du bien s'adapte automatiquement à l'évolution des prix. Le montant fixe est plus simple à budgéter.",
    typicalValue: "0,5% à 1,5% de la valeur du bien par an, ou 500€ à 2 000€ fixes.",
    source: "Règle prudente des experts patrimoniaux.",
  },
  maintenanceValue: {
    shortTip: "Budget annuel d'entretien courant",
    definition: "Provision pour l'entretien courant : petites réparations, remplacement d'équipements, rafraîchissement...",
    impact: "Un budget insuffisant peut créer des surprises. Mieux vaut provisionner trop que pas assez.",
    typicalValue: "500€ à 1 500€/an pour un appartement en bon état, plus pour une maison ou bien ancien.",
    source: "Historique des dépenses d'entretien du vendeur si disponible.",
  },
  majorWorks: {
    shortTip: "Provision pour gros travaux futurs",
    definition: "Épargne annuelle pour les gros travaux à prévoir : toiture, ravalement, chaudière, fenêtres...",
    impact: "Anticipe les dépenses importantes à moyen terme. Évite de devoir emprunter pour des travaux.",
    typicalValue: "500€ à 2 000€/an selon l'âge et l'état du bien.",
    source: "État des diagnostics, ancienneté des équipements, PV d'AG pour la copro.",
  },
  majorWorksFrequency: {
    shortTip: "Fréquence estimée des gros travaux",
    definition: "Intervalle moyen entre deux gros travaux nécessaires (ravalement, toiture, remplacement chaudière...).",
    impact: "Permet de lisser le budget sur plusieurs années et d'anticiper les dépenses.",
    typicalValue: "10 à 15 ans pour ravalement, 20-30 ans pour toiture, 15-20 ans pour chaudière.",
    source: "Durée de vie standard des équipements et derniers travaux réalisés.",
  },
  bankFees: {
    shortTip: "Frais de tenue de compte bancaire",
    definition: "Frais annuels liés au compte bancaire associé au prêt immobilier ou compte dédié au logement.",
    impact: "Coût faible mais récurrent. Certaines banques l'offrent dans le cadre du prêt.",
    typicalValue: "0€ à 150€/an selon les banques.",
    source: "Conditions tarifaires de votre banque.",
  },
  miscFees: {
    shortTip: "Autres frais divers annuels",
    definition: "Frais divers non classés ailleurs : petits équipements, abonnements liés au logement...",
    impact: "Poste de dépenses variable. Permet d'intégrer les imprévus dans le budget.",
    typicalValue: "100€ à 500€/an selon le style de vie.",
    source: "Estimation basée sur vos habitudes.",
  },
  inflationRate: {
    shortTip: "Taux d'inflation pour revalorisation",
    definition: "Taux d'inflation annuel utilisé pour revaloriser les charges dans les projections futures.",
    impact: "Les charges augmentent généralement avec l'inflation. Un taux réaliste améliore la fiabilité des projections.",
    typicalValue: "2% est le taux cible de la BCE. Peut être plus élevé en période inflationniste.",
    source: "INSEE pour l'historique, BCE pour les perspectives.",
  },
};
