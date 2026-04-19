// Catalogue des champs de profil que l'agent peut proposer de mettre à jour.
// Utilisé par ProfileUpdateProposal pour afficher des labels lisibles et
// rendre les bons inputs en mode édition.

export type FieldType = 'number' | 'enum' | 'boolean' | 'year' | 'text';

export interface FieldMeta {
  label: string;
  unit?: string;
  type: FieldType;
  min?: number;
  max?: number;
}

export const FIELD_LABELS: Record<string, FieldMeta> = {
  net_monthly_salary: { label: 'Salaire net mensuel', unit: '€', type: 'number', min: 0, max: 1_000_000 },
  annual_bonus: { label: 'Prime annuelle', unit: '€', type: 'number', min: 0, max: 1_000_000 },
  thirteenth_month: { label: '13ème mois', unit: '€', type: 'number', min: 0, max: 1_000_000 },
  monthly_revenue_freelance: { label: 'CA freelance mensuel', unit: '€', type: 'number', min: 0, max: 1_000_000 },
  annual_revenue_ht: { label: 'CA annuel HT', unit: '€', type: 'number', min: 0, max: 10_000_000 },
  has_real_expenses: { label: 'Frais réels déclarés', type: 'boolean' },
  real_expenses_amount: { label: 'Montant des frais réels', unit: '€', type: 'number', min: 0, max: 1_000_000 },
  family_status: { label: 'Situation familiale', type: 'enum' },
  children_count: { label: "Nombre d'enfants à charge", type: 'number', min: 0, max: 20 },
  professional_status: { label: 'Statut professionnel', type: 'enum' },
  pea_balance: { label: 'PEA', unit: '€', type: 'number', min: 0, max: 10_000_000 },
  life_insurance_balance: { label: 'Assurance-vie', unit: '€', type: 'number', min: 0, max: 10_000_000 },
  main_pension_annual: { label: 'Pension annuelle', unit: '€', type: 'number', min: 0, max: 1_000_000 },
  housing_status: { label: 'Statut logement', type: 'enum' },
  monthly_rent: { label: 'Loyer mensuel', unit: '€', type: 'number', min: 0, max: 50_000 },
  housing_zone: { label: 'Zone logement', type: 'enum' },
  has_rental_income: { label: 'Revenus fonciers', type: 'boolean' },
  has_investments: { label: 'Investissements', type: 'boolean' },
  birth_year: { label: 'Année de naissance', type: 'year', min: 1920, max: new Date().getFullYear() },
  primary_objective: { label: 'Objectif principal', type: 'enum' },
  reference_tax_income: { label: 'Revenu fiscal de référence', unit: '€', type: 'number', min: 0, max: 10_000_000 },
  first_name: { label: 'Prénom', type: 'text' },
  is_homeowner: { label: 'Propriétaire', type: 'boolean' },
};

export const ENUM_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  family_status: [
    { value: 'single', label: 'Célibataire' },
    { value: 'married', label: 'Marié(e)' },
    { value: 'pacs', label: 'Pacsé(e)' },
    { value: 'divorced', label: 'Divorcé(e)' },
    { value: 'widowed', label: 'Veuf/veuve' },
  ],
  professional_status: [
    { value: 'employee', label: 'Salarié' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'entrepreneur', label: 'Entrepreneur' },
    { value: 'civil_servant', label: 'Fonctionnaire' },
    { value: 'retired', label: 'Retraité' },
    { value: 'student', label: 'Étudiant' },
    { value: 'unemployed', label: 'Sans emploi' },
  ],
  housing_status: [
    { value: 'owner', label: 'Propriétaire' },
    { value: 'tenant', label: 'Locataire' },
    { value: 'housed_free', label: 'Logé à titre gratuit' },
  ],
  housing_zone: [
    { value: 'A_bis', label: 'A bis (Paris et proche)' },
    { value: 'A', label: 'A' },
    { value: 'B1', label: 'B1' },
    { value: 'B2', label: 'B2' },
    { value: 'C', label: 'C' },
  ],
  primary_objective: [
    { value: 'reduce_ir', label: "Réduire mon impôt" },
    { value: 'build_patrimony', label: 'Construire mon patrimoine' },
    { value: 'prepare_retirement', label: 'Préparer ma retraite' },
    { value: 'optimize_taxes', label: 'Optimiser ma fiscalité' },
    { value: 'real_estate', label: 'Investir dans l\'immobilier' },
  ],
};
