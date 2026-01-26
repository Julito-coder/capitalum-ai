import { FieldTooltipData } from '../FieldTooltip';

export const COSTS_TOOLTIPS: Record<string, FieldTooltipData> = {
  propertyTax: {
    shortTip: "Taxe foncière annuelle du bien",
    definition: "La taxe foncière sur les propriétés bâties (TFPB) est un impôt local dû par le propriétaire au 1er janvier de l'année.",
    impact: "Charge incompressible qui réduit le NOI. Variable selon les communes.",
    typicalValue: "0.5-1.5 mois de loyer selon la localisation.",
    source: "Avis de taxe foncière de l'année précédente (demandez au vendeur).",
    example: "T2 à Lyon : 800-1200€/an. Même bien à Marseille : 1200-1800€/an."
  },

  propertyTaxGrowth: {
    shortTip: "Augmentation annuelle de la taxe",
    definition: "Le taux de revalorisation annuelle des bases d'imposition, voté par les collectivités.",
    impact: "Les taxes augmentent généralement plus vite que l'inflation, érodant la rentabilité.",
    typicalValue: "2-5%/an selon les politiques locales.",
    source: "Historique des avis de taxe foncière, presse locale.",
  },

  cfe: {
    shortTip: "Cotisation Foncière des Entreprises",
    definition: "La CFE est un impôt local dû par les loueurs meublés professionnels et non professionnels (LMNP/LMP).",
    impact: "Charge supplémentaire en meublé, absente en location nue.",
    typicalValue: "200-1000€/an selon la commune et la valeur locative.",
    source: "Centre des impôts, avis CFE de l'année précédente.",
  },

  otherTaxes: {
    shortTip: "Autres taxes et impôts locaux",
    definition: "Taxes diverses : taxe d'enlèvement des ordures ménagères (TEOM) si non récupérable, taxe de séjour...",
    impact: "Charges souvent oubliées qui grignotent la rentabilité.",
    typicalValue: "0-500€/an selon la situation.",
    source: "Avis d'imposition complémentaires, mairie.",
  },

  condoNonRecoverable: {
    shortTip: "Charges copro non récupérables",
    definition: "La part des charges de copropriété qui ne peut pas être refacturée au locataire : gros travaux, honoraires syndic, certains frais de gestion.",
    impact: "Charge fixe qui réduit directement le NOI.",
    typicalValue: "30-50% des charges totales de copropriété.",
    source: "Décompte de charges du syndic, distinction récupérable/non récupérable.",
    example: "Charges totales 2400€/an → non récupérables ~1000-1200€/an."
  },

  condoWorksReserve: {
    shortTip: "Fonds travaux obligatoire",
    definition: "Le fonds de travaux obligatoire (loi ALUR) est une épargne collective pour financer les gros travaux de copropriété.",
    impact: "Charge annuelle qui peut être importante dans les copropriétés anciennes.",
    typicalValue: "5% minimum du budget prévisionnel de la copro.",
    source: "Budget prévisionnel de copropriété, PV d'AG.",
  },

  insurancePNO: {
    shortTip: "Assurance Propriétaire Non Occupant",
    definition: "L'assurance PNO couvre les risques liés au bien quand vous n'y habitez pas : responsabilité civile, dégâts, recours des locataires.",
    impact: "Obligatoire en copropriété, fortement recommandée sinon.",
    typicalValue: "100-250€/an pour un appartement standard.",
    source: "Devis assureurs (AXA, MAIF, Allianz...), comparateurs.",
  },

  managementPct: {
    shortTip: "Commission de gestion locative",
    definition: "Le pourcentage des loyers prélevé par l'agence pour la gestion courante : encaissement, relances, suivi technique.",
    impact: "Coût récurrent mais qui libère du temps et sécurise la gestion.",
    typicalValue: "6-10% des loyers encaissés (hors frais de relocation).",
    source: "Devis agences de gestion locative.",
  },

  managementMin: {
    shortTip: "Minimum de gestion mensuel",
    definition: "Certaines agences appliquent un minimum mensuel de gestion, quelle que soit la valeur du loyer.",
    impact: "Peut rendre la gestion externe peu rentable pour les petits loyers.",
    typicalValue: "0-50€/mois minimum.",
    source: "Contrat de mandat de gestion.",
  },

  managementSpecific: {
    shortTip: "Frais de gestion ponctuels",
    definition: "Frais supplémentaires facturés par l'agence : états des lieux, régularisation de charges, contentieux, visites.",
    impact: "Coûts variables qui s'ajoutent aux honoraires de gestion.",
    typicalValue: "200-500€/an selon la rotation locative.",
    source: "Grille tarifaire de l'agence de gestion.",
  },

  accounting: {
    shortTip: "Frais de comptabilité LMNP",
    definition: "Les honoraires d'expert-comptable pour la tenue comptable et la déclaration fiscale en LMNP/LMP réel.",
    impact: "Coût nécessaire pour bénéficier de l'amortissement et des déductions au réel.",
    typicalValue: "300-600€/an pour un bien unique, dégressif si plusieurs biens.",
    source: "Devis experts-comptables spécialisés LMNP.",
  },

  membership: {
    shortTip: "Adhésion CGA ou association",
    definition: "L'adhésion à un Centre de Gestion Agréé (CGA) ou une association de gestion permet d'éviter la majoration de 25% du bénéfice.",
    impact: "Obligatoire pour éviter la pénalité fiscale en LMNP réel.",
    typicalValue: "150-250€/an.",
    source: "Sites des CGA, souvent proposé par l'expert-comptable.",
  },

  maintenanceMode: {
    shortTip: "Méthode de calcul de l'entretien",
    definition: "Choisissez entre un pourcentage des loyers ou un montant fixe pour provisionner l'entretien courant.",
    impact: "Le mode % s'adapte automatiquement si le loyer évolue.",
    typicalValue: "3-5% des loyers ou 300-800€/an selon l'état du bien.",
    source: "Règle empirique des investisseurs expérimentés.",
  },

  maintenanceValue: {
    shortTip: "Provision pour entretien courant",
    definition: "Le budget annuel pour les petites réparations et l'entretien : plomberie, électricité, peinture, équipements.",
    impact: "Charge récurrente souvent sous-estimée qui impacte le cashflow réel.",
    typicalValue: "3-5% des loyers annuels ou 300-800€/an.",
    source: "Historique de dépenses, âge et état du bien.",
    example: "Loyer 800€/mois × 5% = 480€/an de provision entretien."
  },

  majorWorks: {
    shortTip: "Provision gros travaux",
    definition: "Une épargne annuelle pour anticiper les travaux importants : toiture, ravalement, chaudière, rénovation.",
    impact: "Lisse les dépenses et évite les mauvaises surprises. Rassure les banques.",
    typicalValue: "500-1500€/an selon l'âge et l'état du bien.",
    source: "Plan pluriannuel de travaux de la copro, diagnostic technique.",
  },

  majorWorksFrequency: {
    shortTip: "Cycle de gros travaux",
    definition: "La fréquence estimée des gros travaux majeurs dans le bien.",
    impact: "Permet de modéliser des dépenses ponctuelles dans la simulation longue durée.",
    typicalValue: "7-15 ans pour un ravalement, 15-25 ans pour une toiture.",
    source: "Historique copropriété, diagnostics techniques.",
  },

  utilitiesWater: {
    shortTip: "Facture d'eau mensuelle",
    definition: "Le coût mensuel de l'eau si vous le prenez en charge (meublé, saisonnier).",
    impact: "Charge variable selon l'occupation.",
    typicalValue: "20-50€/mois selon l'occupation.",
    source: "Factures du fournisseur d'eau.",
  },

  utilitiesElec: {
    shortTip: "Facture d'électricité mensuelle",
    definition: "Le coût mensuel de l'électricité si vous le prenez en charge.",
    impact: "Peut être importante selon les équipements (chauffage électrique, climatisation).",
    typicalValue: "30-100€/mois selon équipements et occupation.",
    source: "Factures EDF/Engie, DPE du bien.",
  },

  utilitiesGas: {
    shortTip: "Facture de gaz mensuelle",
    definition: "Le coût mensuel du gaz si vous le prenez en charge.",
    impact: "Variable selon le mode de chauffage.",
    typicalValue: "0-80€/mois si chauffage gaz, 0 sinon.",
    source: "Factures fournisseur gaz.",
  },

  utilitiesInternet: {
    shortTip: "Abonnement internet mensuel",
    definition: "Le coût de l'abonnement internet inclus dans le loyer.",
    impact: "Charge fixe attendue par les locataires en meublé/saisonnier.",
    typicalValue: "25-40€/mois selon l'offre.",
    source: "Offres box internet (Orange, Free, SFR...).",
  },

  bankFees: {
    shortTip: "Frais bancaires annuels",
    definition: "Les frais de tenue de compte, cartes, virements liés à la gestion du bien.",
    impact: "Charge mineure mais récurrente.",
    typicalValue: "0-100€/an selon la banque.",
    source: "Conditions tarifaires de votre banque.",
  },

  miscFees: {
    shortTip: "Frais divers annuels",
    definition: "Autres frais non classés : déplacements, petits achats, imprévus.",
    impact: "Permet d'avoir une marge de sécurité dans le budget.",
    typicalValue: "100-300€/an comme provision de sécurité.",
    source: "Estimation personnelle.",
  },

  inflationRate: {
    shortTip: "Indexation générale des charges",
    definition: "Le taux d'augmentation annuelle des charges d'exploitation, généralement aligné sur l'inflation.",
    impact: "Les charges augmentent avec le temps, érodant le cashflow si les loyers ne suivent pas.",
    typicalValue: "2-3%/an historiquement, variable selon la conjoncture.",
    source: "INSEE (inflation), historique des charges.",
  },

  noi: {
    shortTip: "Net Operating Income (Résultat d'exploitation)",
    definition: "Le NOI est le revenu net après déduction de toutes les charges d'exploitation, mais avant charges financières et impôts.",
    impact: "C'est l'indicateur clé de la performance opérationnelle du bien, indépendamment du financement.",
    typicalValue: "40-60% des loyers bruts pour un bien bien géré.",
    source: "Calcul automatique : Loyers - Vacance - Charges d'exploitation.",
    example: "Loyers 10 000€ - Charges 4 000€ = NOI 6 000€/an."
  },
};
