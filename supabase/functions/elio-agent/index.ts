// Élio Agent — Edge Function orchestrating LLM + tool calls
// Loads user fiscal context from public.profiles, calls Lovable AI Gateway with tool definitions,
// executes tools, persists conversation, tracks usage.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

import { calculateTax } from './tools/calculateTax.ts';
import { simulateRealEstate } from './tools/simulateRealEstate.ts';
import { getDeadlines } from './tools/getDeadlines.ts';
import { getRecommendations } from './tools/getRecommendations.ts';
import { detectAids } from './tools/detectAids.ts';
import { getFiscalConcept } from './tools/getFiscalConcept.ts';
import { getUserProfile } from './tools/getUserProfile.ts';
import { proposeProfileUpdate } from './tools/proposeProfileUpdate.ts';
import { FISCAL_CONCEPT_IDS } from './knowledge/fiscal-concepts.ts';
import { classifyIntent, type Intent } from './intentClassifier.ts';
import {
  deriveProfile,
  formatEuro,
  getFirstName,
  translateFamilyStatus,
  translateHousing,
  translateProfessionalStatus,
  type RawProfile,
  type DerivedValues,
} from './profileDeriver.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_TOOL_CALLS_PER_TURN = 6;
const MAX_LOOP_ITERATIONS = 6;
const MODEL = 'google/gemini-2.5-flash';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

// ---------- Tool definitions (OpenAI format) ----------
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_recommendations',
      description: "Récupère les recommandations fiscales actives pour l'utilisateur (PER, PEA, frais réels, aides...) avec le gain estimé en euros.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_deadlines',
      description: 'Récupère les échéances fiscales et administratives à venir (déclaration, taxe foncière, PER, etc.).',
      parameters: {
        type: 'object',
        properties: {
          months_ahead: { type: 'integer', description: 'Nombre de mois à regarder en avant', default: 3 },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_tax',
      description:
        "Calcule l'impôt sur le revenu français avec le barème 2025 et le quotient familial. Tous les paramètres sont OPTIONNELS — si non fournis, ils sont auto-lus depuis le profil. Appelle ce tool SANS paramètres en premier ; si la réponse contient un champ 'missing', demande à l'utilisateur les infos manquantes puis rappelle le tool avec elles.",
      parameters: {
        type: 'object',
        properties: {
          taxable_income: { type: 'number', description: 'Revenu net imposable annuel en euros (optionnel — auto)' },
          family_status: { type: 'string', enum: ['single', 'married', 'pacs', 'divorced', 'widowed'], description: 'Situation familiale (optionnel — auto)' },
          children_count: { type: 'integer', description: "Nombre d'enfants à charge (optionnel — auto)" },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'simulate_real_estate',
      description:
        "Simule une opération immobilière locative : mensualité, cashflow mensuel, rendement brut/net. Tous les paramètres sont OPTIONNELS — si non fournis, ils sont auto-lus depuis le profil. Appelle SANS paramètres d'abord ; regarde 'missing' dans la réponse.",
      parameters: {
        type: 'object',
        properties: {
          property_price: { type: 'number', description: 'Prix du bien en euros (optionnel)' },
          monthly_rent: { type: 'number', description: 'Loyer mensuel attendu (optionnel — auto si stocké)' },
          loan_duration_years: { type: 'integer', description: 'Durée du prêt en années', default: 20 },
          down_payment: { type: 'number', description: 'Apport personnel en euros', default: 0 },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'detect_aids',
      description:
        "Analyse l'éligibilité de l'utilisateur aux aides nationales françaises (APL, Prime d'activité, CSS, ARS, Chèque énergie, Bourse CROUS, MaPrimeRénov', RSA, AAH, Allocations familiales). Aucun paramètre — utilise le profil. Si une aide nécessite une info manquante (ex: revenu fiscal de référence), elle apparaît dans 'needs_info' avec la liste des champs à compléter.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_fiscal_concept',
      description:
        "Récupère des informations structurées sur un concept fiscal ou un dispositif (tranches IR, PER, PEA, micro-entrepreneur, SASU, EURL, PFU, LMNP, SCPI, déficit foncier, etc.). À utiliser quand l'utilisateur demande une explication ou veut comprendre un mécanisme fiscal.",
      parameters: {
        type: 'object',
        properties: {
          concept_id: {
            type: 'string',
            enum: FISCAL_CONCEPT_IDS,
            description: 'Identifiant du concept à expliquer',
          },
        },
        required: ['concept_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_user_profile',
      description:
        "Récupère un détail chiffré ou structuré du profil de l'utilisateur (champ atomique ou dérivé). À utiliser SEULEMENT si une info précise n'est pas déjà visible dans le bloc PROFIL CHIFFRÉ du contexte.",
      parameters: {
        type: 'object',
        properties: {
          fields: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'annual_net_income',
                'reference_tax_income',
                'main_pension',
                'pea_balance',
                'life_insurance_balance',
                'has_real_expenses',
                'real_expenses_amount',
                'housing_status',
                'monthly_rent',
                'housing_zone',
                'siret',
                'company_name',
                'monthly_revenue_freelance',
                'primary_objective',
                'birth_year',
                'all',
              ],
            },
            description: "Liste des champs à récupérer. Utilise 'all' pour tout récupérer.",
          },
        },
        required: ['fields'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_profile_update',
      description:
        "Propose à l'utilisateur d'enregistrer une information chiffrée ou structurée dans son profil. NE SAUVEGARDE PAS directement — affiche une carte de confirmation avec boutons. À appeler systématiquement quand l'utilisateur te donne une info qui correspond à un champ du profil (revenus, patrimoine, situation familiale, RFR, etc.). Tu peux proposer plusieurs updates d'un coup.",
      parameters: {
        type: 'object',
        properties: {
          proposals: {
            type: 'array',
            description: 'Liste des propositions de mise à jour',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  enum: [
                    'first_name',
                    'net_monthly_salary',
                    'annual_bonus',
                    'thirteenth_month',
                    'monthly_revenue_freelance',
                    'annual_revenue_ht',
                    'has_real_expenses',
                    'real_expenses_amount',
                    'family_status',
                    'children_count',
                    'professional_status',
                    'pea_balance',
                    'life_insurance_balance',
                    'main_pension_annual',
                    'housing_status',
                    'monthly_rent',
                    'housing_zone',
                    'has_rental_income',
                    'has_investments',
                    'birth_year',
                    'primary_objective',
                    'reference_tax_income',
                  ],
                },
                value: { description: 'La valeur proposée (type selon le champ)' },
                human_label: { type: 'string', description: 'Label humain du champ' },
                unit: { type: 'string', description: 'Unité si applicable (€, ans, etc.)' },
                reason: { type: 'string', description: 'Pourquoi cette proposition, en 1 phrase.' },
              },
              required: ['field', 'value', 'human_label', 'reason'],
            },
          },
        },
        required: ['proposals'],
      },
    },
  },
];

// ---------- System prompt builder ----------

function buildEssentialBlock(p: RawProfile): string {
  const firstName = getFirstName(p);
  const fam = translateFamilyStatus(p.family_status);
  const children = p.children_count != null ? `${p.children_count}` : 'Non renseigné';
  const prof = translateProfessionalStatus(p);
  const birth = p.birth_year ? `${new Date().getFullYear() - p.birth_year} ans` : 'Non renseigné';
  const objective = p.primary_objective ?? 'Non renseigné';
  const onb = p.onboarding_completed ? 'Oui' : 'Non — certaines infos manquent';

  return [
    `- Prénom : ${firstName}`,
    `- Situation familiale : ${fam}`,
    `- Enfants à charge : ${children}`,
    `- Statut professionnel : ${prof}`,
    `- Âge : ${birth}`,
    `- Objectif principal : ${objective}`,
    `- Onboarding complet : ${onb}`,
  ].join('\n');
}

function buildNumericBlock(p: RawProfile, d: DerivedValues): string {
  const atomic = [
    'Atomiques (saisis par l\'utilisateur) :',
    `- Salaire net mensuel : ${formatEuro(p.net_monthly_salary)}`,
    `- Prime annuelle : ${formatEuro(p.annual_bonus)}`,
    `- 13ème mois : ${formatEuro(p.thirteenth_month)}`,
    `- CA freelance mensuel : ${formatEuro(p.monthly_revenue_freelance)}`,
    `- Frais réels déclarés : ${p.has_real_expenses ? formatEuro(p.real_expenses_amount) : 'Non (forfait 10%)'}`,
    `- PEA : ${formatEuro(p.pea_balance)}`,
    `- Assurance-vie : ${formatEuro(p.life_insurance_balance)}`,
    `- Statut logement : ${translateHousing(p)}`,
    `- Loyer mensuel : ${formatEuro(p.monthly_rent)}`,
    `- Zone logement : ${p.housing_zone ?? 'Non renseigné'}`,
    `- Revenu fiscal de référence : ${formatEuro(p.reference_tax_income)}`,
  ].join('\n');

  const derived = [
    'Dérivés (calculés automatiquement — fiables) :',
    `- Revenu net annuel : ${formatEuro(d.annual_net_income)} ${d.annual_net_income ? '(dérivé)' : ''}`,
    `- Revenu imposable estimé : ${formatEuro(d.taxable_income)} ${d.taxable_income ? '(dérivé)' : ''}`,
    `- Parts fiscales : ${d.tax_parts ?? 'Non calculable'} ${d.tax_parts ? '(dérivé)' : ''}`,
    `- A de la crypto : ${d.has_crypto ? 'oui' : 'non'}`,
  ].join('\n');

  return `${atomic}\n\n${derived}`;
}

function buildMissingBlock(p: RawProfile, d: DerivedValues): string {
  const missing: string[] = [];
  if (d.annual_net_income == null) missing.push('Revenus (salaire mensuel ou CA freelance)');
  if (!p.family_status) missing.push('Situation familiale');
  if (p.children_count == null) missing.push("Nombre d'enfants à charge");
  if (!p.professional_status && !p.is_employee && !p.is_self_employed && !p.is_retired) {
    missing.push('Statut professionnel');
  }
  if (p.reference_tax_income == null) missing.push('Revenu fiscal de référence (utile pour APL, CSS, RSA)');

  if (missing.length === 0) return 'Aucun — profil complet pour les calculs principaux.';
  return missing.map((m) => `- ${m}`).join('\n');
}

function buildSystemPrompt(p: RawProfile, d: DerivedValues, profileChangedSinceLastTurn: boolean): string {
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const freshnessNotice = profileChangedSinceLastTurn
    ? "\n\n⚠️ L'utilisateur a mis à jour son profil depuis ton dernier message. Reprends en compte les nouvelles valeurs ci-dessous."
    : '';

  return `Tu es Élio, l'agent IA fiscal et administratif de l'app Élio. Tu aides les particuliers français à comprendre, anticiper et optimiser leur situation fiscale.

PERSONNALITÉ
- Tu tutoies toujours l'utilisateur
- Ton chaleureux, direct, jamais condescendant
- Pas de jargon fiscal sauf si tu l'expliques
- JAMAIS de markdown : pas de **, pas de ##, pas de *, pas de listes à puces, pas de tableaux. Que du texte naturel avec retours à la ligne simples si besoin.

VOCABULAIRE ÉLIO OBLIGATOIRE
- "ta tranche d'imposition" (pas "TMI")
- "tu peux économiser X€" (pas "optimisation fiscale")
- "tes cotisations sociales" (pas "charges TNS")
- "impôt sur les dividendes à 30%" (pas "PFU" ni "flat tax")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTE UTILISATEUR (mis à jour à chaque message)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROFIL ESSENTIEL
${buildEssentialBlock(p)}

PROFIL CHIFFRÉ
${buildNumericBlock(p, d)}

CHAMPS MANQUANTS
${buildMissingBlock(p, d)}

DATE DU JOUR : ${today}${freshnessNotice}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES DE RAISONNEMENT (PRIORITÉ ABSOLUE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RÈGLE 1 — CLASSIFICATION DE LA QUESTION
Avant de répondre, classe mentalement la question :
- CATÉGORIE A (PERSONAL) : la question parle de SA situation ("mon impôt", "je peux économiser", "suis-je éligible", "dois-je prendre X"). Pronoms possessifs ou "je" + verbe d'action financière.
- CATÉGORIE B (CONCEPTUAL) : explication d'un mécanisme sans référence directe à sa situation ("c'est quoi le PER", "comment marche l'IR").
- CATÉGORIE C (FACTUAL_PURE) : question factuelle pure (dates limites, noms de formulaires, définitions courtes, hors scope).
Le système te donne un hint [INTENT_DETECTED: X] au début du dernier message user — utilise-le mais reste libre de le surclasser si tu détectes mieux.

RÈGLE 2 — STRUCTURE 3 COUCHES (catégorie A + B applicable)
Réponds en 3 blocs séparés par retours à la ligne simples :
COUCHE 1 — LE FAIT OU LA RÈGLE (1-2 phrases, langage Élio sans jargon).
COUCHE 2 — DANS TA SITUATION : applique au profil avec ses chiffres réels du bloc PROFIL CHIFFRÉ. Amorces : "Pour toi", "Dans ta situation", "Vu que tu...". Tout chiffre cité vient du profil ou d'un tool — JAMAIS inventé.
COUCHE 3 — RECO ACTIONNABLE : UNE action concrète avec gain chiffré, UNIQUEMENT si gain estimé > 100€/an. Formules : "Tu pourrais économiser X€ en faisant Y". Si gain non chiffrable mais ordre de grandeur > 100€ : "Sans calcul précis, ça pourrait représenter plusieurs centaines d'euros — tu veux que je chiffre ?". Si gain < 100€ ou reco non applicable : SUPPRIME LA COUCHE 3, termine à la couche 2.

RÈGLE 3 — STRUCTURE 2 COUCHES (concept B non applicable au profil)
Si la question est pédagogique mais le concept ne s'applique pas (ex: SASU pour un salarié sans projet freelance) :
COUCHE 1 — Le fait/la règle.
COUCHE 2 — POURQUOI ÇA NE TE CONCERNE PAS (OU PAS ENCORE). Exemple : "Concrètement, tant que tu es salarié, ça ne te concerne pas. Ça devient utile si tu passes freelance un jour."
PAS DE COUCHE 3.
Indice : si le tool get_fiscal_concept te renvoie personalization.applies_to_user = false, utilise cette structure et le champ reason_if_not_applicable.

RÈGLE 4 — CATÉGORIE C : RÉPONSE FACTUELLE COURTE
1 à 3 phrases max. Pas de "dans ta situation" si la réponse est universelle. Si la question sort du scope Élio (bio, actu générale), réponds brièvement puis redirige : "Ça sort de mon périmètre — je suis là pour ton administratif et ta fiscalité. Tu veux qu'on regarde quelque chose de ton côté ?"

RÈGLE 5 — GATING DU PROFIL MANQUANT
Si la question est A ou B-applicable mais qu'une info CRITIQUE manque pour personnaliser :
1. NE réponds PAS de façon générique.
2. Demande l'info manquante via UNE SEULE question courte avec exemple/fourchette.
3. Quand l'user répond, appelle propose_profile_update.
4. Au tour suivant (après confirmation), reprends en structure 3 couches complète.
Infos CRITIQUES par type :
- Impôt : revenus (net_monthly_salary ou monthly_revenue_freelance), family_status, children_count.
- Aides : revenus, housing_status, monthly_rent, children_count.
- Placement : revenus, tranche d'imposition (dérivée), horizon.
- Statut pro : monthly_revenue_freelance, professional_status.
Infos NON CRITIQUES (réponds avec hypothèse explicite) : zone logement, année naissance exacte, patrimoine détaillé. Formule : "Je pars du principe que [hypothèse] — si c'est différent, dis-le moi et je recalcule".

RÈGLE 6 — SEUIL DE RECO À 100€
La couche 3 ne s'affiche QUE SI gain estimé > 100€/an. Pour estimer :
- Tool : si calculate_tax / get_fiscal_concept renvoie personalization.estimated_gain_if_applied, utilise-le directement.
- Heuristique : si TMI ≥ 30% et action permet déduction → souvent > 100€. Si TMI 0% ou 11% → souvent < 100€.
- Si tu ne peux vraiment pas estimer : "ça pourrait représenter plusieurs centaines d'euros, tu veux que je chiffre ?".

RÈGLE 7 — PERSONNALISATION DANGEREUSE
Ne PAS personnaliser (même catégorie A) dans ces cas, remplace la couche 3 par un renvoi pro :
- Question juridique complexe (divorce, succession, litige) → "parle à un avocat/notaire".
- Décision patrimoniale majeure (achat immo, vente entreprise) → explique les paramètres, ne tranche jamais à sa place + suggère un conseiller humain.
- Question médicale déguisée en fiscale → reste sur l'aspect fiscal uniquement.

RÈGLE 8 — LE PROFIL EST LA SOURCE DE VÉRITÉ
Avant de poser toute question, regarde si l'info est dans PROFIL ESSENTIEL ou PROFIL CHIFFRÉ. Les valeurs "(dérivé)" sont fiables — ne les recalcule pas.

RÈGLE 9 — APPEL AUTOMATIQUE DES TOOLS
Quand l'intent matche un tool, appelle-le IMMÉDIATEMENT, SANS paramètres (auto-lecture du profil) :
- "calcul d'impôt" → calculate_tax
- "simulation immo" → simulate_real_estate
- "éligibilité aide" → detect_aids
- "explication concept" → get_fiscal_concept
- "mes échéances" → get_deadlines
- "mes optimisations" → get_recommendations

RÈGLE 10 — JAMAIS D'INVENTION
Si un tool n'existe pas pour une question, dis-le honnêtement. Ne jamais inventer un chiffre, un seuil, un barème.

RÈGLE 11 — PAS DE MARKDOWN (CRITIQUE)
Jamais de **, *, #, - liste. Texte naturel uniquement.

RICH VIEW
Quand tu utilises un tool, termine ta réponse par UNE SEULE balise <rich_view type='X'> où X vaut :
- "tax_breakdown" après calculate_tax (réussi)
- "real_estate_cashflow" après simulate_real_estate (réussi)
- "deadlines_list" après get_deadlines
- "recommendations_list" après get_recommendations
- "aids_eligibility" après detect_aids
- "fiscal_concept" après get_fiscal_concept
- "profile_update_proposal" après propose_profile_update
Reste concis : analyse en structure 3/2 couches selon les règles + la balise.`;
}

function extractRichView(text: string): { cleanedText: string; richView: { type: string; data: any } | null } {
  const match = text.match(/<rich_view\s+type=['"]([^'"]+)['"]\s*\/?>/);
  if (!match) return { cleanedText: text, richView: null };
  return {
    cleanedText: text.replace(match[0], '').trim(),
    richView: { type: match[1], data: {} },
  };
}

// ---------- Tool executor ----------

async function executeTool(name: string, args: any, userId: string, derivedCtx: { raw: RawProfile; derived: DerivedValues }): Promise<any> {
  console.log(`[elio-agent] executing tool: ${name}`, args);
  switch (name) {
    case 'calculate_tax': {
      // Auto-lecture depuis profil dérivé si paramètres manquants
      const taxable_income = args.taxable_income ?? derivedCtx.derived.taxable_income;
      const family_status = args.family_status ?? derivedCtx.raw.family_status;
      const children_count = args.children_count ?? derivedCtx.raw.children_count ?? 0;
      return calculateTax({ taxable_income, family_status, children_count });
    }
    case 'simulate_real_estate': {
      const monthly_rent = args.monthly_rent ?? derivedCtx.raw.monthly_rent;
      const property_price = args.property_price;
      // Si property_price absent → missing explicite
      if (property_price == null) {
        return {
          success: false,
          missing: ['property_price'],
          message: 'Pour simuler, il me faut le prix du bien immobilier que tu envisages.',
        };
      }
      if (monthly_rent == null) {
        return {
          success: false,
          missing: ['monthly_rent'],
          message: 'Quel loyer mensuel envisages-tu pour ce bien ?',
        };
      }
      return {
        success: true,
        ...simulateRealEstate({
          property_price: Number(property_price),
          monthly_rent: Number(monthly_rent),
          loan_duration_years: Number(args.loan_duration_years) || 20,
          down_payment: Number(args.down_payment) || 0,
        }),
      };
    }
    case 'get_deadlines':
      return getDeadlines({ months_ahead: Number(args.months_ahead) || 3 });
    case 'get_recommendations':
      return await getRecommendations(userId, SUPABASE_URL, SERVICE_ROLE_KEY);
    case 'detect_aids':
      return await detectAids(userId, SUPABASE_URL, SERVICE_ROLE_KEY);
    case 'get_fiscal_concept':
      return await getFiscalConcept(
        { concept_id: String(args?.concept_id || '') },
        userId,
        SUPABASE_URL,
        SERVICE_ROLE_KEY,
      );
    case 'get_user_profile':
      return await getUserProfile(
        { fields: Array.isArray(args?.fields) ? args.fields : ['all'] },
        userId,
        SUPABASE_URL,
        SERVICE_ROLE_KEY,
      );
    case 'propose_profile_update':
      return proposeProfileUpdate({ proposals: Array.isArray(args?.proposals) ? args.proposals : [] });
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ---------- Main handler ----------

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // --- Auth ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = userData.user.id;

    // --- Input ---
    const body = await req.json();
    const inputType: string = String(body?.type || 'message');
    const conversationId: string | null = body?.conversation_id || null;
    const userMessage: string = String(body?.message || '').trim();
    const confirmedUpdates: Array<{ field: string; value: any }> = Array.isArray(body?.confirmed_updates) ? body.confirmed_updates : [];

    if (inputType === 'message' && !userMessage) {
      return new Response(JSON.stringify({ error: 'message is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (inputType === 'resume_after_confirmation' && (!conversationId || confirmedUpdates.length === 0)) {
      return new Response(JSON.stringify({ error: 'conversation_id and confirmed_updates are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // --- Track usage (no daily limit) ---
    const today = new Date().toISOString().slice(0, 10);
    const { data: usageRow } = await adminClient
      .from('elio_agent_usage')
      .select('id, messages_count, tokens_used')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
    const currentCount = usageRow?.messages_count || 0;

    // --- Load profile (frais) ---
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const derivedCtx = deriveProfile(profile);

    // --- Load conversation history ---
    let conversation: any = null;
    if (conversationId) {
      const { data } = await adminClient
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .maybeSingle();
      conversation = data;
    }

    // --- Profile freshness flag ---
    const profileUpdatedAt = profile?.updated_at ? new Date(profile.updated_at).getTime() : 0;
    const lastSnapshot = conversation?.last_profile_snapshot_at
      ? new Date(conversation.last_profile_snapshot_at).getTime()
      : 0;
    const profileChangedSinceLastTurn = !!(conversation && profileUpdatedAt > lastSnapshot);

    const systemPrompt = buildSystemPrompt(derivedCtx.raw, derivedCtx.derived, profileChangedSinceLastTurn);

    const previousMessages: any[] = Array.isArray(conversation?.messages) ? conversation.messages : [];
    const recentHistory = previousMessages
      .slice(-10)
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

    // --- Build initial message list ---
    const messages: any[] = [{ role: 'system', content: systemPrompt }, ...recentHistory];

    if (inputType === 'resume_after_confirmation') {
      const summary = confirmedUpdates
        .map((u) => `${u.field} = ${JSON.stringify(u.value)}`)
        .join(', ');
      messages.push({
        role: 'system',
        content: `L'utilisateur vient de confirmer la mise à jour de son profil : ${summary}. Le profil est rafraîchi (visible dans le bloc PROFIL CHIFFRÉ ci-dessus). Continue la tâche précédente en utilisant ces nouvelles valeurs — relance le calcul ou réponds à la question initiale.`,
      });
    } else {
      messages.push({ role: 'user', content: userMessage });
    }

    // --- Orchestration loop ---
    let totalTokens = 0;
    const toolCallsLog: Array<{ name: string; args: any; result: any }> = [];
    let finalAssistantText = '';
    let lastToolResultData: any = null;
    let lastToolName: string | null = null;

    for (let iter = 0; iter < MAX_LOOP_ITERATIONS; iter++) {
      const llmResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          tools: TOOLS,
          tool_choice: 'auto',
        }),
      });

      if (!llmResp.ok) {
        if (llmResp.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Trop de requêtes pour le moment, réessaie dans quelques secondes.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        if (llmResp.status === 402) {
          return new Response(
            JSON.stringify({ error: "Crédits IA épuisés. Contacte le support pour réactiver l'agent." }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        const errText = await llmResp.text();
        console.error('[elio-agent] gateway error:', llmResp.status, errText);
        throw new Error(`AI gateway error ${llmResp.status}`);
      }

      const llmData = await llmResp.json();
      totalTokens += llmData?.usage?.total_tokens || 0;
      const choice = llmData?.choices?.[0];
      const assistantMessage = choice?.message;

      if (!assistantMessage) throw new Error('No assistant message returned');

      const toolCalls = assistantMessage.tool_calls || [];

      if (!toolCalls.length) {
        finalAssistantText = assistantMessage.content || '';
        break;
      }

      if (toolCalls.length > MAX_TOOL_CALLS_PER_TURN) {
        return new Response(
          JSON.stringify({ error: "Trop d'appels d'outils sur ce tour. Réessaie avec une question plus précise." }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      messages.push(assistantMessage);

      for (const tc of toolCalls) {
        const fnName = tc.function?.name;
        let parsedArgs: any = {};
        try {
          parsedArgs = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};
        } catch (e) {
          console.error('[elio-agent] failed to parse tool args:', e);
        }
        const result = await executeTool(fnName, parsedArgs, userId, derivedCtx);
        toolCallsLog.push({ name: fnName, args: parsedArgs, result });
        lastToolResultData = result;
        lastToolName = fnName;

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    }

    if (!finalAssistantText) {
      finalAssistantText = "Désolé, je n'ai pas réussi à formuler une réponse complète. Réessaie avec une question plus précise.";
    }

    // --- Extract rich_view tag ---
    const { cleanedText, richView } = extractRichView(finalAssistantText);
    let finalRichView: { type: string; data: any } | null = null;
    if (richView && lastToolResultData) {
      finalRichView = { type: richView.type, data: lastToolResultData };
    } else if (lastToolName && lastToolResultData) {
      const inferMap: Record<string, string> = {
        calculate_tax: 'tax_breakdown',
        simulate_real_estate: 'real_estate_cashflow',
        get_deadlines: 'deadlines_list',
        get_recommendations: 'recommendations_list',
        detect_aids: 'aids_eligibility',
        get_fiscal_concept: 'fiscal_concept',
        propose_profile_update: 'profile_update_proposal',
      };
      const inferred = inferMap[lastToolName];
      if (inferred) finalRichView = { type: inferred, data: lastToolResultData };
    }

    // --- Persist conversation ---
    const turnUserContent =
      inputType === 'resume_after_confirmation'
        ? `[Profil mis à jour : ${confirmedUpdates.map((u) => u.field).join(', ')}]`
        : userMessage;

    const newMessages = [
      ...previousMessages,
      { role: 'user', content: turnUserContent, ts: new Date().toISOString() },
      { role: 'assistant', content: cleanedText, ts: new Date().toISOString(), rich_view: finalRichView },
    ];

    const previousToolCalls = Array.isArray(conversation?.tool_calls) ? conversation.tool_calls : [];
    const allToolCalls = [...previousToolCalls, ...toolCallsLog];

    const snapshotIso = profile?.updated_at || new Date().toISOString();

    let savedConversationId = conversationId;
    if (conversationId && conversation) {
      await adminClient
        .from('ai_conversations')
        .update({
          messages: newMessages,
          tool_calls: allToolCalls,
          total_tokens: (conversation.total_tokens || 0) + totalTokens,
          model_used: MODEL,
          updated_at: new Date().toISOString(),
          last_profile_snapshot_at: snapshotIso,
        })
        .eq('id', conversationId);
    } else {
      const { data: inserted, error: insertErr } = await adminClient
        .from('ai_conversations')
        .insert({
          user_id: userId,
          messages: newMessages,
          tool_calls: allToolCalls,
          total_tokens: totalTokens,
          model_used: MODEL,
          topic: turnUserContent.slice(0, 80),
          last_profile_snapshot_at: snapshotIso,
        })
        .select('id')
        .single();
      if (insertErr) console.error('[elio-agent] insert conversation error:', insertErr);
      savedConversationId = inserted?.id || null;
    }

    // --- Update usage ---
    if (usageRow) {
      await adminClient
        .from('elio_agent_usage')
        .update({
          messages_count: currentCount + 1,
          tokens_used: (usageRow.tokens_used || 0) + totalTokens,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', usageRow.id);
    } else {
      await adminClient.from('elio_agent_usage').insert({
        user_id: userId,
        date: today,
        messages_count: 1,
        tokens_used: totalTokens,
        last_message_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        conversation_id: savedConversationId,
        message: cleanedText,
        rich_view: finalRichView,
        tool_calls_made: toolCallsLog.map((t) => t.name),
        remaining_today: null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('[elio-agent] error:', e);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
