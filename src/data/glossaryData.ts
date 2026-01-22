// Glossary data with fiscal and finance terms
export interface GlossaryTerm {
  id: string;
  term: string;
  shortDefinition: string;
  fullExplanation: string;
  category: GlossaryCategory;
  relatedTerms: string[];
  examples?: string[];
  officialSource?: string;
}

export type GlossaryCategory = 
  | 'impots'
  | 'entreprise'
  | 'social'
  | 'patrimoine'
  | 'declarations'
  | 'statuts';

export const categoryLabels: Record<GlossaryCategory, { label: string; description: string; icon: string }> = {
  impots: {
    label: "Impôts & Prélèvements",
    description: "IR, TMI, prélèvement à la source, crédits d'impôt",
    icon: "Receipt"
  },
  entreprise: {
    label: "Entreprise & Activité",
    description: "CA, TVA, régimes fiscaux, seuils",
    icon: "Building2"
  },
  social: {
    label: "Cotisations Sociales",
    description: "URSSAF, CFE, charges sociales",
    icon: "Users"
  },
  patrimoine: {
    label: "Patrimoine & Épargne",
    description: "PER, PEA, assurance-vie, SCPI",
    icon: "PiggyBank"
  },
  declarations: {
    label: "Déclarations Fiscales",
    description: "2042, 2044, 2035, échéances",
    icon: "FileText"
  },
  statuts: {
    label: "Statuts Juridiques",
    description: "Micro, EURL, SASU, SAS, SARL",
    icon: "Scale"
  }
};

export const glossaryTerms: GlossaryTerm[] = [
  // IMPOTS
  {
    id: "ir",
    term: "Impôt sur le Revenu (IR)",
    shortDefinition: "Impôt annuel calculé sur l'ensemble des revenus d'un foyer fiscal.",
    fullExplanation: `L'Impôt sur le Revenu est un impôt progressif calculé selon un barème par tranches. Il s'applique à l'ensemble des revenus du foyer fiscal : salaires, revenus fonciers, BIC, BNC, plus-values, etc.

Le calcul se fait en plusieurs étapes :
1. Calcul du revenu net imposable (après abattements)
2. Division par le nombre de parts fiscales (quotient familial)
3. Application du barème progressif
4. Multiplication par le nombre de parts

Le prélèvement à la source a été instauré en 2019 pour collecter l'impôt en temps réel.`,
    category: "impots",
    relatedTerms: ["tmi", "quotient-familial", "pas"],
    examples: [
      "Un célibataire gagnant 30 000€ net imposable paiera environ 2 400€ d'IR",
      "Un couple avec 2 enfants gagnant 60 000€ bénéficie de 3 parts fiscales"
    ],
    officialSource: "https://www.impots.gouv.fr/particulier/questions/comment-est-calcule-mon-impot-sur-le-revenu"
  },
  {
    id: "tmi",
    term: "Taux Marginal d'Imposition (TMI)",
    shortDefinition: "Taux d'imposition appliqué à la dernière tranche de revenus.",
    fullExplanation: `Le TMI est le taux de la dernière tranche du barème de l'IR dans laquelle tombe votre revenu. C'est un indicateur crucial pour l'optimisation fiscale.

Barème 2024 :
- 0% jusqu'à 11 294€
- 11% de 11 294€ à 28 797€
- 30% de 28 797€ à 82 341€
- 41% de 82 341€ à 177 106€
- 45% au-delà de 177 106€

⚠️ Important : Le TMI n'est pas le taux moyen ! Si votre TMI est de 30%, chaque euro supplémentaire sera imposé à 30%, mais l'ensemble de vos revenus n'est pas imposé à ce taux.`,
    category: "impots",
    relatedTerms: ["ir", "per", "frais-reels"],
    examples: [
      "Avec un TMI de 30%, verser 1 000€ sur un PER permet d'économiser 300€ d'impôt",
      "Passer de 28 000€ à 29 000€ de revenus = 200€ d'IR supplémentaire (30% de 1 000€)"
    ]
  },
  {
    id: "pas",
    term: "Prélèvement à la Source (PAS)",
    shortDefinition: "Collecte de l'IR directement sur le revenu au moment de son versement.",
    fullExplanation: `Depuis janvier 2019, l'impôt sur le revenu est prélevé directement par l'employeur ou l'organisme payeur au moment du versement du revenu.

Types de taux :
- Taux personnalisé : calculé par l'administration selon vos revenus
- Taux individualisé : pour les couples avec des revenus différents
- Taux non personnalisé (neutre) : si vous ne souhaitez pas communiquer votre situation à l'employeur

Le taux est actualisé chaque année après la déclaration de revenus. Les acomptes concernent les revenus sans tiers collecteur (BIC, BNC, fonciers).`,
    category: "impots",
    relatedTerms: ["ir", "acompte"],
    officialSource: "https://www.impots.gouv.fr/particulier/le-prelevement-la-source"
  },
  {
    id: "quotient-familial",
    term: "Quotient Familial",
    shortDefinition: "Mécanisme divisant le revenu imposable par le nombre de parts fiscales.",
    fullExplanation: `Le quotient familial permet d'adapter l'impôt à la composition du foyer. Le revenu imposable est divisé par le nombre de parts pour appliquer le barème progressif.

Attribution des parts :
- Célibataire/Divorcé/Veuf : 1 part
- Marié/Pacsé : 2 parts
- 1er et 2ème enfant : +0,5 part chacun
- À partir du 3ème enfant : +1 part chacun
- Parent isolé : +0,5 part supplémentaire

⚠️ Plafonnement : L'avantage fiscal est limité à 1 759€ par demi-part supplémentaire (2024).`,
    category: "impots",
    relatedTerms: ["ir", "tmi"],
    examples: [
      "Couple avec 2 enfants = 3 parts (2 + 0,5 + 0,5)",
      "Parent isolé avec 1 enfant = 2 parts (1 + 0,5 + 0,5 isolement)"
    ]
  },
  {
    id: "frais-reels",
    term: "Frais Réels",
    shortDefinition: "Option permettant de déduire les dépenses professionnelles réelles au lieu de l'abattement de 10%.",
    fullExplanation: `Par défaut, un abattement forfaitaire de 10% s'applique aux salaires pour représenter les frais professionnels. L'option frais réels permet de déduire les dépenses réelles si elles sont supérieures.

Frais déductibles :
- Frais de transport domicile-travail (barème kilométrique)
- Frais de repas (différence avec le minimum repas à domicile)
- Formation professionnelle
- Double résidence pour raisons professionnelles
- Matériel et fournitures professionnels

⚠️ Obligation de conserver les justificatifs pendant 3 ans.`,
    category: "impots",
    relatedTerms: ["ir", "tmi"],
    examples: [
      "30km aller-retour quotidien = ~4 000€/an de frais kilométriques",
      "Repas pris sur lieu de travail = ~1 200€/an déductibles"
    ],
    officialSource: "https://www.impots.gouv.fr/particulier/questions/comment-puis-je-deduire-mes-frais-reels"
  },
  
  // ENTREPRISE
  {
    id: "ca",
    term: "Chiffre d'Affaires (CA)",
    shortDefinition: "Total des ventes de biens ou services facturées sur une période.",
    fullExplanation: `Le chiffre d'affaires correspond au montant total des ventes réalisées. Il est exprimé HT (hors taxes) pour les entreprises assujetties à la TVA.

Importance du CA :
- Détermine le régime fiscal applicable (micro vs réel)
- Base de calcul des cotisations URSSAF en micro-entreprise
- Indicateur clé de la santé de l'activité

Seuils micro-entreprise 2024 :
- Services/Libéral : 77 700€
- Vente de marchandises : 188 700€`,
    category: "entreprise",
    relatedTerms: ["micro-entreprise", "urssaf", "tva"],
    examples: [
      "Consultant facturant 5 000€ HT/mois = CA annuel de 60 000€",
      "Dépassement du seuil micro = passage obligatoire au réel"
    ]
  },
  {
    id: "micro-entreprise",
    term: "Micro-Entreprise",
    shortDefinition: "Régime fiscal simplifié avec abattement forfaitaire sur le CA.",
    fullExplanation: `La micro-entreprise (ex auto-entrepreneur) est un régime fiscal et social simplifié pour les petites activités.

Caractéristiques :
- Comptabilité ultra-simplifiée (livre des recettes)
- Pas de TVA collectée (franchise en base)
- Cotisations sociales proportionnelles au CA (12,3% à 21,2%)
- IR calculé après abattement forfaitaire (34% à 71% selon activité)

Seuils 2024 :
- Ventes : 188 700€
- Services : 77 700€

Option versement libératoire : payer l'IR mensuellement (1% à 2,2% du CA) si revenus du foyer < 27 478€ par part.`,
    category: "entreprise",
    relatedTerms: ["ca", "urssaf", "versement-liberatoire"],
    officialSource: "https://www.autoentrepreneur.urssaf.fr/"
  },
  {
    id: "tva",
    term: "Taxe sur la Valeur Ajoutée (TVA)",
    shortDefinition: "Impôt indirect sur la consommation collecté par les entreprises.",
    fullExplanation: `La TVA est un impôt sur la consommation. Les entreprises la collectent auprès des clients et la reversent à l'État, déduction faite de la TVA payée sur leurs achats.

Taux en France :
- 20% : taux normal
- 10% : restauration, travaux, transports
- 5,5% : alimentation, livres, énergie
- 2,1% : médicaments, presse

Franchise en base (pas de TVA) :
- Services : CA < 36 800€
- Ventes : CA < 91 900€

Au-delà, obligation de facturer la TVA et de la déclarer.`,
    category: "entreprise",
    relatedTerms: ["ca", "micro-entreprise"],
    examples: [
      "Prestation de 1 000€ HT = 1 200€ TTC (avec TVA 20%)",
      "Micro-entrepreneur sous le seuil = facture sans TVA"
    ]
  },

  // SOCIAL
  {
    id: "urssaf",
    term: "URSSAF",
    shortDefinition: "Organisme collectant les cotisations sociales des travailleurs indépendants et salariés.",
    fullExplanation: `L'URSSAF (Union de Recouvrement des cotisations de Sécurité Sociale et d'Allocations Familiales) collecte les cotisations qui financent la protection sociale.

Pour les indépendants :
- Cotisations calculées sur le revenu professionnel
- Déclaration mensuelle ou trimestrielle
- Taux micro-entreprise : 12,3% à 21,2% selon activité

Cotisations financent :
- Assurance maladie-maternité
- Retraite de base et complémentaire
- Allocations familiales
- CSG/CRDS

⚠️ Régularisation annuelle : les cotisations définitives sont calculées sur le revenu réel déclaré.`,
    category: "social",
    relatedTerms: ["micro-entreprise", "ca", "cfe"],
    officialSource: "https://www.urssaf.fr/"
  },
  {
    id: "cfe",
    term: "Cotisation Foncière des Entreprises (CFE)",
    shortDefinition: "Impôt local annuel dû par toutes les entreprises.",
    fullExplanation: `La CFE est un impôt local basé sur la valeur locative des biens immobiliers utilisés par l'entreprise. Elle est due par toute entreprise ou travailleur indépendant.

Caractéristiques :
- Due au 15 décembre chaque année
- Exonération la première année d'activité
- Montant minimum selon la commune (entre 200€ et 2 000€)
- Pas de déclaration annuelle (sauf changement de situation)

Exonérations possibles :
- Artistes, enseignants, certaines professions libérales
- CA < 5 000€ (depuis 2019)`,
    category: "social",
    relatedTerms: ["urssaf", "micro-entreprise"],
    examples: [
      "Consultant travaillant de chez lui = CFE minimum de la commune (~200-500€)",
      "Exonération totale si CA < 5 000€"
    ]
  },

  // PATRIMOINE
  {
    id: "per",
    term: "Plan Épargne Retraite (PER)",
    shortDefinition: "Produit d'épargne retraite permettant de déduire les versements du revenu imposable.",
    fullExplanation: `Le PER est un produit d'épargne long terme offrant un avantage fiscal immédiat. Les versements volontaires sont déductibles du revenu imposable.

Avantages :
- Déduction fiscale immédiate (selon TMI)
- Capital bloqué jusqu'à la retraite (sauf cas de déblocage anticipé)
- Sortie en capital et/ou rente à la retraite

Plafond de déduction :
- 10% des revenus professionnels (max ~35 000€/an)
- ou 10% du PASS si plus favorable (~4 400€)
- Report des plafonds non utilisés sur 3 ans

⚠️ À la sortie, le capital est imposé (mais généralement à un TMI plus faible).`,
    category: "patrimoine",
    relatedTerms: ["tmi", "ir", "pea"],
    examples: [
      "TMI 30% + versement 5 000€ = économie immédiate de 1 500€",
      "TMI 41% = effet de levier fiscal encore plus important"
    ],
    officialSource: "https://www.economie.gouv.fr/particuliers/plan-epargne-retraite-per"
  },
  {
    id: "pea",
    term: "Plan Épargne en Actions (PEA)",
    shortDefinition: "Enveloppe fiscale pour investir en actions avec exonération d'impôt après 5 ans.",
    fullExplanation: `Le PEA est une enveloppe fiscale permettant d'investir en actions européennes avec une fiscalité avantageuse.

Caractéristiques :
- Plafond de versements : 150 000€ (PEA classique)
- Investissement en actions européennes et OPCVM éligibles
- Pas de fiscalité tant que l'argent reste dans le PEA

Fiscalité des retraits :
- Avant 5 ans : flat tax 30% (ou barème IR) + clôture du plan
- Après 5 ans : exonération d'IR (seuls 17,2% de prélèvements sociaux)

⚠️ Un seul PEA par personne. Le PEA-PME permet 75 000€ supplémentaires.`,
    category: "patrimoine",
    relatedTerms: ["per", "assurance-vie"],
    examples: [
      "Plus-value de 10 000€ après 5 ans = 1 720€ de prélèvements sociaux (vs 3 000€ avant 5 ans)",
      "Dividendes dans le PEA = 0% d'impôt"
    ]
  },
  {
    id: "assurance-vie",
    term: "Assurance-Vie",
    shortDefinition: "Contrat d'épargne polyvalent avec fiscalité avantageuse après 8 ans.",
    fullExplanation: `L'assurance-vie est le placement préféré des Français. Elle offre une grande souplesse et une fiscalité attractive.

Caractéristiques :
- Pas de plafond de versements
- Supports : fonds euros (garantis) + unités de compte (actions, immobilier...)
- Disponibilité des fonds à tout moment

Fiscalité des rachats (après 8 ans) :
- Abattement annuel : 4 600€ (célibataire) ou 9 200€ (couple)
- Au-delà : 7,5% ou 12,8% selon les versements
- Prélèvements sociaux : 17,2%

Transmission :
- Abattement de 152 500€ par bénéficiaire (versements avant 70 ans)
- Hors succession classique`,
    category: "patrimoine",
    relatedTerms: ["pea", "per", "scpi"],
    examples: [
      "Contrat de 100 000€ avec 20 000€ de gains : rachat total après 8 ans = ~2 300€ de fiscalité",
      "Versement de 100 000€ avant 70 ans = transmission à 2 enfants sans droits"
    ]
  },
  {
    id: "scpi",
    term: "SCPI (Société Civile de Placement Immobilier)",
    shortDefinition: "Placement collectif permettant d'investir dans l'immobilier sans gestion directe.",
    fullExplanation: `Les SCPI permettent d'investir dans l'immobilier professionnel (bureaux, commerces, santé...) sans les contraintes de gestion.

Caractéristiques :
- Ticket d'entrée accessible (quelques centaines d'euros)
- Revenus distribués régulièrement (trimestriellement)
- Rendement moyen : 4-6% par an
- Frais d'entrée : ~8-10%

Fiscalité :
- Revenus imposés comme revenus fonciers (TMI + 17,2% PS)
- Option micro-foncier si < 15 000€/an (abattement 30%)
- Plus-values immobilières à la revente

⚠️ Investissement long terme recommandé (8-10 ans minimum).`,
    category: "patrimoine",
    relatedTerms: ["ir", "revenus-fonciers", "assurance-vie"],
    examples: [
      "10 000€ investis à 5% = 500€/an de revenus",
      "Via assurance-vie = fiscalité plus douce sur les revenus"
    ]
  },

  // DECLARATIONS
  {
    id: "declaration-2042",
    term: "Déclaration 2042",
    shortDefinition: "Formulaire principal de déclaration de revenus des particuliers.",
    fullExplanation: `La déclaration 2042 est le formulaire central pour déclarer l'ensemble des revenus d'un foyer fiscal.

Revenus à déclarer :
- Salaires et traitements
- Revenus de capitaux mobiliers
- Plus-values
- Revenus fonciers (renvoi vers 2044 si réel)
- BIC, BNC, BA (selon régime)

Annexes courantes :
- 2042-C : revenus complémentaires
- 2042-RICI : réductions et crédits d'impôt
- 2044 : revenus fonciers au réel

Échéances 2024 (revenus 2023) :
- Papier : 20 mai
- Internet : 23 mai à 6 juin selon département`,
    category: "declarations",
    relatedTerms: ["ir", "declaration-2044"],
    officialSource: "https://www.impots.gouv.fr/formulaire/2042/declaration-des-revenus"
  },
  {
    id: "declaration-2044",
    term: "Déclaration 2044",
    shortDefinition: "Formulaire pour déclarer les revenus fonciers au régime réel.",
    fullExplanation: `La déclaration 2044 permet de détailler les revenus et charges des locations immobilières au régime réel.

Obligatoire si :
- Revenus fonciers > 15 000€/an
- Option pour le réel (charges > 30% des revenus)
- Location meublée non professionnelle

Charges déductibles :
- Intérêts d'emprunt
- Travaux d'entretien et réparation
- Charges de copropriété non récupérables
- Assurances
- Frais de gestion (20€/local)

Le résultat (bénéfice ou déficit) est reporté sur la 2042.`,
    category: "declarations",
    relatedTerms: ["declaration-2042", "revenus-fonciers", "scpi"],
    examples: [
      "Loyers 12 000€ - charges 5 000€ = revenu foncier net de 7 000€",
      "Déficit foncier imputable sur le revenu global (max 10 700€/an)"
    ]
  },

  // STATUTS
  {
    id: "eurl",
    term: "EURL (Entreprise Unipersonnelle à Responsabilité Limitée)",
    shortDefinition: "Société à associé unique offrant une responsabilité limitée aux apports.",
    fullExplanation: `L'EURL est une SARL à associé unique. Elle sépare le patrimoine personnel du patrimoine professionnel.

Caractéristiques :
- Capital social libre (1€ minimum)
- Responsabilité limitée aux apports
- Gérant = associé unique (le plus souvent)
- Régime social TNS (moins coûteux que salarié)

Fiscalité :
- IR par défaut (transparence fiscale)
- Option IS possible (impositions séparées)

Cotisations sociales :
- Base : rémunération + quote-part des bénéfices
- Taux global : ~45% de la rémunération

Avantages vs micro : déduction des charges réelles, crédibilité, protection du patrimoine.`,
    category: "statuts",
    relatedTerms: ["sasu", "micro-entreprise", "is"],
    examples: [
      "EURL à l'IR : bénéfice de 50 000€ = imposé directement au TMI du gérant",
      "EURL à l'IS : possibilité de laisser des bénéfices dans la société (IS 15%)"
    ]
  },
  {
    id: "sasu",
    term: "SASU (Société par Actions Simplifiée Unipersonnelle)",
    shortDefinition: "Société à associé unique avec grande flexibilité statutaire.",
    fullExplanation: `La SASU est une SAS à associé unique. Elle offre une grande liberté dans l'organisation et le fonctionnement.

Caractéristiques :
- Capital social libre
- Responsabilité limitée aux apports
- Président = dirigeant (statut assimilé-salarié)
- Grande liberté statutaire

Fiscalité :
- IS par défaut
- Option IR possible (5 premières années, conditions)

Régime social du président :
- Assimilé-salarié = couverture sociale complète
- Cotisations : ~65-80% de la rémunération brute
- Pas de cotisation minimum si pas de rémunération

Avantages : protection sociale, crédibilité, dividendes non soumis à cotisations sociales.`,
    category: "statuts",
    relatedTerms: ["eurl", "micro-entreprise", "is"],
    examples: [
      "Rémunération 3 000€ brut = ~4 500€ de coût total (vs ~4 350€ en EURL)",
      "Dividendes SASU : flat tax 30% uniquement (pas de cotisations sociales)"
    ]
  },
  {
    id: "is",
    term: "Impôt sur les Sociétés (IS)",
    shortDefinition: "Impôt sur les bénéfices des sociétés (15% puis 25%).",
    fullExplanation: `L'IS est l'impôt payé par les sociétés sur leurs bénéfices. Il est distinct de l'imposition personnelle du dirigeant.

Taux 2024 :
- 15% jusqu'à 42 500€ de bénéfice (PME < 10M€ de CA)
- 25% au-delà

Avantages de l'IS :
- Taux fixe (vs progressivité de l'IR)
- Possibilité de réinvestir les bénéfices
- Optimisation rémunération / dividendes

Inconvénients :
- Double imposition : IS sur bénéfice + IR/flat tax sur dividendes
- Formalisme comptable plus lourd

L'IS est obligatoire pour SA, SAS. Optionnel pour SARL, EURL, SCI.`,
    category: "statuts",
    relatedTerms: ["eurl", "sasu", "ir"],
    examples: [
      "Bénéfice 50 000€ = IS de 8 875€ (15% sur 42 500€ + 25% sur 7 500€)",
      "Laisser 30 000€ dans la société = 30 000€ - 4 500€ IS = 25 500€ de trésorerie"
    ]
  },
  {
    id: "versement-liberatoire",
    term: "Versement Libératoire",
    shortDefinition: "Option micro-entreprise pour payer l'IR mensuellement avec les cotisations URSSAF.",
    fullExplanation: `Le versement libératoire permet aux micro-entrepreneurs de payer l'IR en même temps que les cotisations sociales, de façon proportionnelle au CA.

Taux selon activité :
- Ventes : 1%
- Prestations de services BIC : 1,7%
- Prestations de services BNC : 2,2%

Conditions d'éligibilité :
- Revenu fiscal de référence N-2 < 27 478€ par part
- Demande avant le 30 septembre pour l'année suivante

Avantages :
- Simplicité : tout est prélevé en une fois
- Taux fixe = prévisibilité
- Pas de régularisation annuelle

⚠️ Pas toujours avantageux si TMI < taux du versement libératoire.`,
    category: "entreprise",
    relatedTerms: ["micro-entreprise", "urssaf", "ir"],
    examples: [
      "CA 50 000€ (services BNC) = IR libératoire de 1 100€ (2,2%)",
      "Si TMI à 11% : versement libératoire potentiellement plus coûteux"
    ]
  }
];

export const getTermsByCategory = (category: GlossaryCategory): GlossaryTerm[] => {
  return glossaryTerms.filter(term => term.category === category);
};

export const searchTerms = (query: string): GlossaryTerm[] => {
  const lowerQuery = query.toLowerCase();
  return glossaryTerms.filter(term => 
    term.term.toLowerCase().includes(lowerQuery) ||
    term.shortDefinition.toLowerCase().includes(lowerQuery) ||
    term.fullExplanation.toLowerCase().includes(lowerQuery)
  );
};

export const getTermById = (id: string): GlossaryTerm | undefined => {
  return glossaryTerms.find(term => term.id === id);
};

export const getRelatedTerms = (termId: string): GlossaryTerm[] => {
  const term = getTermById(termId);
  if (!term) return [];
  return term.relatedTerms
    .map(id => getTermById(id))
    .filter((t): t is GlossaryTerm => t !== undefined);
};
