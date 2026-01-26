import { FieldTooltipData } from '../FieldTooltip';

export const RENTAL_TOOLTIPS: Record<string, FieldTooltipData> = {
  rentMonthly: {
    shortTip: "Loyer mensuel hors charges récupérables",
    definition: "Le loyer mensuel HC (hors charges) est le montant perçu chaque mois avant déduction des charges récupérables sur le locataire.",
    impact: "C'est la base de calcul de tous vos revenus locatifs et de la rentabilité brute.",
    typicalValue: "Variable selon zone : 10-15€/m² en province, 20-35€/m² à Paris.",
    source: "Annonces immobilières locales, observatoires des loyers (OLAP, Clameur).",
    example: "T2 de 40m² à Lyon → loyer marché ~600-700€/mois HC."
  },

  roomsRented: {
    shortTip: "Nombre de chambres mises en location",
    definition: "En colocation, le nombre de chambres louées individuellement, chacune avec son propre bail.",
    impact: "Plus de chambres = revenus potentiellement plus élevés mais gestion plus complexe.",
    typicalValue: "2 à 5 chambres selon la taille du logement.",
    source: "Plan du logement, réglementation locale sur la colocation.",
  },

  recoverableCharges: {
    shortTip: "Charges récupérables sur le locataire",
    definition: "Les charges récupérables sont les dépenses que le propriétaire peut refacturer au locataire (eau, ordures ménagères, entretien parties communes...).",
    impact: "Ces charges sont neutres pour votre rentabilité mais augmentent le loyer affiché.",
    typicalValue: "30-80€/mois pour un appartement standard.",
    source: "Décret du 26 août 1987, budget prévisionnel de copropriété.",
  },

  rentGrowthRate: {
    shortTip: "Augmentation annuelle du loyer",
    definition: "Le taux de revalorisation annuelle du loyer, généralement indexé sur l'IRL (Indice de Référence des Loyers).",
    impact: "Permet de maintenir le pouvoir d'achat du loyer face à l'inflation.",
    typicalValue: "1-2%/an historiquement, variable selon l'IRL.",
    source: "INSEE (publication trimestrielle de l'IRL).",
    example: "Loyer initial 800€, +1.5%/an → 824€ après 2 ans."
  },

  vacancyRate: {
    shortTip: "% du temps où le bien est vacant",
    definition: "Le taux de vacance représente la période pendant laquelle le bien n'est pas loué entre deux locataires.",
    impact: "Réduit directement vos revenus. Un taux élevé dégrade la rentabilité et le DSCR.",
    typicalValue: "2-5% en zone tendue (grandes villes), 5-10% en zone moins demandée.",
    source: "Statistiques locales, agences immobilières, historique du bien.",
    example: "5% = environ 18 jours de vacance par an."
  },

  defaultRate: {
    shortTip: "% de loyers impayés",
    definition: "Le taux d'impayés représente la part des loyers qui ne sont pas recouvrés malgré les procédures.",
    impact: "Réduit le NOI et peut créer des problèmes de trésorerie importants.",
    typicalValue: "1-3% en moyenne nationale, variable selon le profil locataire.",
    source: "Statistiques ANIL, assureurs loyers impayés.",
    example: "2% sur 10 000€/an = 200€ de perte annuelle."
  },

  relocationCost: {
    shortTip: "Coût de mise en location",
    definition: "Les frais engagés à chaque changement de locataire : honoraires d'agence, remise en état, annonces...",
    impact: "Coût ponctuel mais récurrent qui impacte le cashflow l'année du changement.",
    typicalValue: "500-1500€ par relocation, selon si gestion directe ou agence.",
    source: "Devis agences immobilières, coût moyen des petits travaux.",
  },

  relocationFrequency: {
    shortTip: "Durée moyenne d'occupation",
    definition: "La durée moyenne pendant laquelle un locataire reste dans le logement avant de partir.",
    impact: "Plus la rotation est fréquente, plus les frais de relocation pèsent.",
    typicalValue: "2-3 ans pour les étudiants, 4-6 ans pour les familles.",
    source: "Statistiques locales, type de bien et de locataire cible.",
  },

  nightlyRate: {
    shortTip: "Tarif moyen par nuit",
    definition: "Le prix moyen facturé par nuit en location saisonnière, avant frais de plateforme.",
    impact: "Détermine directement vos revenus bruts annuels.",
    typicalValue: "50-150€/nuit selon localisation, équipements et saisonnalité.",
    source: "Analyse des tarifs Airbnb/Booking dans votre zone.",
    example: "T2 centre-ville station ski → 100€/nuit en moyenne annuelle."
  },

  occupancyRate: {
    shortTip: "% de nuits louées sur l'année",
    definition: "Le taux d'occupation représente le pourcentage de nuits effectivement louées sur une année.",
    impact: "Multiplie le tarif nuitée pour donner le revenu annuel réel.",
    typicalValue: "50-70% pour un bien bien géré, variable selon la destination.",
    source: "Statistiques AirDNA, données Airbnb/Booking locales.",
    example: "70% = 255 nuits louées sur 365."
  },

  platformFees: {
    shortTip: "Commission des plateformes",
    definition: "Les frais prélevés par Airbnb, Booking.com ou autres plateformes sur chaque réservation.",
    impact: "Réduit directement vos revenus nets. Souvent oublié dans les calculs.",
    typicalValue: "3-15% côté hôte selon la plateforme et les options.",
    source: "Conditions générales Airbnb (3%), Booking (15%).",
  },

  seasonalCoefficients: {
    shortTip: "Multiplicateur de tarif par mois",
    definition: "Les coefficients de saisonnalité permettent d'ajuster le tarif nuitée selon la période de l'année.",
    impact: "Permet de modéliser les variations haute/basse saison dans les revenus.",
    typicalValue: "0.5-0.8 en basse saison, 1.0 en moyenne, 1.3-2.0 en haute saison.",
    source: "Historique de réservations, calendrier événementiel local.",
    example: "Coefficient 1.5 en août = tarif de 100€ devient 150€."
  },

  cleaningFee: {
    shortTip: "Frais de ménage par séjour",
    definition: "Le coût du ménage effectué entre chaque locataire en location saisonnière.",
    impact: "Charge variable qui augmente avec le nombre de rotations.",
    typicalValue: "30-80€ par ménage selon surface et prestataire.",
    source: "Devis sociétés de ménage, tarifs conciergeries.",
  },

  linenCost: {
    shortTip: "Location/lavage du linge de maison",
    definition: "Les frais mensuels liés au linge de maison : draps, serviettes, lavage, remplacement.",
    impact: "Charge récurrente en saisonnier, souvent sous-estimée.",
    typicalValue: "50-150€/mois selon fréquence de rotation.",
    source: "Tarifs blanchisseries, coût de renouvellement du linge.",
  },

  checkInCost: {
    shortTip: "Frais d'accueil des voyageurs",
    definition: "Le coût mensuel lié à l'accueil des voyageurs : remise de clés, explication du logement.",
    impact: "Charge importante si vous n'assurez pas l'accueil vous-même.",
    typicalValue: "0€ si autogéré, 15-30€ par check-in si délégué.",
    source: "Tarifs conciergeries locales.",
  },

  utilitiesCost: {
    shortTip: "Consommations incluses dans le tarif",
    definition: "Les frais mensuels d'eau, électricité, gaz et internet inclus dans le prix de la nuitée.",
    impact: "En saisonnier, ces charges sont à votre charge et réduisent le revenu net.",
    typicalValue: "100-200€/mois selon équipements et occupation.",
    source: "Factures énergétiques, abonnements internet.",
  },

  conciergerie: {
    shortTip: "Commission de gestion saisonnière",
    definition: "Le pourcentage prélevé par une conciergerie pour gérer intégralement le bien en saisonnier.",
    impact: "Simplifie la gestion mais réduit significativement la marge.",
    typicalValue: "15-25% du chiffre d'affaires selon les services inclus.",
    source: "Devis conciergeries locales (Luckey, GuestReady, locaux...).",
  },
};
