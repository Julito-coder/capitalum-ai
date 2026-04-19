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
import { FISCAL_CONCEPT_IDS } from './knowledge/fiscal-concepts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DAILY_LIMIT = 5;
const MAX_TOOL_CALLS_PER_TURN = 5;
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
      description: 'Récupère les recommandations fiscales actives pour l\'utilisateur (PER, PEA, frais réels, aides...) avec le gain estimé en euros.',
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
      description: 'Calcule l\'impôt sur le revenu français avec le barème 2025 et le quotient familial. À UTILISER pour tout calcul d\'IR.',
      parameters: {
        type: 'object',
        properties: {
          taxable_income: { type: 'number', description: 'Revenu net imposable annuel en euros' },
          family_status: { type: 'string', enum: ['single', 'married', 'pacs', 'divorced', 'widowed'], description: 'Situation familiale' },
          children_count: { type: 'integer', description: 'Nombre d\'enfants à charge', default: 0 },
        },
        required: ['taxable_income', 'family_status', 'children_count'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'simulate_real_estate',
      description: 'Simule une opération immobilière locative : mensualité, cashflow mensuel, rendement brut/net.',
      parameters: {
        type: 'object',
        properties: {
          property_price: { type: 'number', description: 'Prix du bien en euros' },
          monthly_rent: { type: 'number', description: 'Loyer mensuel attendu' },
          loan_duration_years: { type: 'integer', description: 'Durée du prêt en années', default: 20 },
          down_payment: { type: 'number', description: 'Apport personnel en euros', default: 0 },
        },
        required: ['property_price', 'monthly_rent', 'loan_duration_years', 'down_payment'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'detect_aids',
      description: 'Analyse l\'éligibilité de l\'utilisateur aux 10 principales aides nationales françaises (APL, Prime d\'activité, CSS, ARS, Chèque énergie, Bourse CROUS, MaPrimeRénov\', RSA, AAH, Allocations familiales) en fonction de son profil fiscal. Retourne la liste des aides éligibles, non éligibles, et celles nécessitant des infos complémentaires.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_fiscal_concept',
      description: 'Récupère des informations structurées sur un concept fiscal ou un dispositif (tranches IR, PER, PEA, micro-entrepreneur, SASU, EURL, PFU, LMNP, SCPI, déficit foncier, etc.). À utiliser quand l\'utilisateur demande une explication ou veut comprendre un mécanisme fiscal.',
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
      description: "Récupère les détails chiffrés et précis du profil fiscal de l'utilisateur connecté (revenus, montants, valeurs). À utiliser dès que tu as besoin d'un chiffre précis sur sa situation. Retourne {value, status} pour chaque champ — si status='not_filled', demande à l'utilisateur de compléter plutôt que d'inventer.",
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
];

// ---------- Helpers ----------

function buildProfileSummary(profile: any): string {
  if (!profile) return "Profil fiscal non renseigné. Demande à l'utilisateur de compléter son profil.";

  const familyMap: Record<string, string> = {
    single: 'célibataire', married: 'marié(e)', pacs: 'pacsé(e)', divorced: 'divorcé(e)', widowed: 'veuf/veuve',
  };
  const profStatus: string[] = [];
  if (profile.is_employee) profStatus.push('salarié');
  if (profile.is_self_employed) profStatus.push('indépendant');
  if (profile.is_retired) profStatus.push('retraité');
  if (profile.is_investor) profStatus.push('investisseur');

  const firstName = (profile.full_name || '').split(' ')[0] || "l'utilisateur";
  const hasCrypto = !!(profile.crypto_pnl_2025 || profile.crypto_wallet_address);
  const updatedAt = profile.updated_at
    ? new Date(profile.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'inconnu';

  return [
    `- Prénom : ${firstName}`,
    `- Situation familiale : ${familyMap[profile.family_status] || 'non renseignée'}`,
    `- Nombre d'enfants : ${profile.children_count ?? 'non renseigné'}`,
    `- Statut professionnel : ${profStatus.length ? profStatus.join(', ') : 'non renseigné'}`,
    `- A des revenus fonciers : ${profile.has_rental_income ? 'oui' : 'non'}`,
    `- A des investissements : ${profile.has_investments ? 'oui' : 'non'}`,
    `- A de la crypto : ${hasCrypto ? 'oui' : 'non'}`,
    `- Onboarding complet : ${profile.onboarding_completed ? 'oui' : 'non — certaines infos manquent'}`,
    `- Profil mis à jour le : ${updatedAt}`,
  ].join('\n');
}

function buildSystemPrompt(profileSummary: string, profileChangedSinceLastTurn: boolean): string {
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const freshnessNotice = profileChangedSinceLastTurn
    ? "\n\n⚠️ L'utilisateur a mis à jour son profil depuis ton dernier message. Prends en compte les nouvelles infos. Si tu as des données chiffrées en mémoire qui pourraient être obsolètes, re-vérifie via get_user_profile."
    : '';

  return `Tu es Élio, l'agent IA fiscal et administratif de l'app Élio. Tu aides les particuliers français à comprendre, anticiper et optimiser leur situation fiscale et administrative.

PERSONNALITÉ
- Tu tutoies toujours l'utilisateur
- Ton chaleureux, direct, jamais condescendant
- Registre courant, pas de jargon fiscal sauf si tu l'expliques
- Tu es l'ami compétent en impôts, pas un prof, pas un robot, pas un banquier
- Tu annonces clairement ce que tu vas faire avant d'appeler un tool

VOCABULAIRE ÉLIO (obligatoire)
- "ta tranche d'imposition" (pas "TMI")
- "tu peux économiser X€" (pas "optimisation fiscale")
- "tes cotisations sociales" (pas "charges TNS")
- "impôt sur les dividendes (30%)" (pas "PFU" ni "flat tax")

RÈGLE CRITIQUE : TU UTILISES LES TOOLS POUR TOUT ÉLÉMENT FACTUEL
- Calculs (impôt, immo) → calculate_tax, simulate_real_estate
- Éligibilité à une aide (APL, Prime d'activité, CSS, RSA, ARS, AAH, etc.) → detect_aids
- Explication d'un dispositif fiscal (PER, PEA, LMNP, SASU, tranches IR, PFU…) → get_fiscal_concept
- Échéances / recommandations → get_deadlines, get_recommendations
- Si aucun tool ne couvre la question : dis honnêtement que tu ne peux pas y répondre pour l'instant, et propose une piste alternative ou un lien officiel. NE JAMAIS INVENTER de barème, seuil ou montant.

PROFIL ESSENTIEL DE L'UTILISATEUR (toujours à jour)
${profileSummary}

POUR TOUT DÉTAIL CHIFFRÉ (revenus annuels, montants épargnés, PEA, assurance-vie, frais réels, pension, CA freelance, etc.) → utilise OBLIGATOIREMENT le tool get_user_profile avec les champs voulus. Ne jamais deviner un chiffre.
SI L'UTILISATEUR DIT "j'ai changé X dans mon profil" → re-appelle get_user_profile pour re-vérifier.
SI un champ revient avec status='not_filled' → demande à l'utilisateur de compléter, ne fabrique pas de valeur.${freshnessNotice}

LIMITES DE V1
- Pas de soumission directe à impots.gouv
- Pas de connexion aux comptes bancaires
- Pas de conseil patrimonial personnalisé au sens du CMF (disclaimer quand on touche à ça)
- Pour les actions irréversibles : toujours demander confirmation

RICH VIEW (IMPORTANT)
Quand tu utilises un tool, termine ta réponse par UNE SEULE balise <rich_view type='X'> où X vaut :
- "tax_breakdown" après calculate_tax
- "real_estate_cashflow" après simulate_real_estate
- "deadlines_list" après get_deadlines
- "recommendations_list" après get_recommendations
- "aids_eligibility" après detect_aids
- "fiscal_concept" après get_fiscal_concept
(get_user_profile n'a pas de rich_view, juste un texte concis.)
Ne mets jamais les chiffres bruts complets dans ton texte si un rich_view les affichera. Reste concis : 1-2 phrases d'analyse + la balise.

DATE DU JOUR : ${today}`;
}

function extractRichView(text: string): { cleanedText: string; richView: { type: string; data: any } | null } {
  const match = text.match(/<rich_view\s+type=['"]([^'"]+)['"]\s*\/?>/);
  if (!match) return { cleanedText: text, richView: null };
  return {
    cleanedText: text.replace(match[0], '').trim(),
    richView: { type: match[1], data: {} }, // data injecté plus tard depuis le dernier tool result
  };
}

async function executeTool(
  name: string,
  args: any,
  userId: string,
): Promise<any> {
  console.log(`[elio-agent] executing tool: ${name}`, args);
  switch (name) {
    case 'calculate_tax':
      return calculateTax({
        taxable_income: Number(args.taxable_income),
        family_status: String(args.family_status),
        children_count: Number(args.children_count) || 0,
      });
    case 'simulate_real_estate':
      return simulateRealEstate({
        property_price: Number(args.property_price),
        monthly_rent: Number(args.monthly_rent),
        loan_duration_years: Number(args.loan_duration_years) || 20,
        down_payment: Number(args.down_payment) || 0,
      });
    case 'get_deadlines':
      return getDeadlines({ months_ahead: Number(args.months_ahead) || 3 });
    case 'get_recommendations':
      return await getRecommendations(userId, SUPABASE_URL, SERVICE_ROLE_KEY);
    case 'detect_aids':
      return await detectAids(userId, SUPABASE_URL, SERVICE_ROLE_KEY);
    case 'get_fiscal_concept':
      return getFiscalConcept({ concept_id: String(args?.concept_id || '') });
    case 'get_user_profile':
      return await getUserProfile(
        { fields: Array.isArray(args?.fields) ? args.fields : ['all'] },
        userId,
        SUPABASE_URL,
        SERVICE_ROLE_KEY,
      );
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
    const userMessage: string = String(body?.message || '').trim();
    const conversationId: string | null = body?.conversation_id || null;
    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'message is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // --- Rate limit (ad-hoc) ---
    const today = new Date().toISOString().slice(0, 10);
    const { data: usageRow } = await adminClient
      .from('elio_agent_usage')
      .select('id, messages_count, tokens_used')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    const currentCount = usageRow?.messages_count || 0;
    // Pas de limite quotidienne — usage tracké pour stats uniquement.

    // --- Load profile (frais) ---
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

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

    // --- Compute profile freshness flag ---
    const profileUpdatedAt = profile?.updated_at ? new Date(profile.updated_at).getTime() : 0;
    const lastSnapshot = conversation?.last_profile_snapshot_at
      ? new Date(conversation.last_profile_snapshot_at).getTime()
      : 0;
    const profileChangedSinceLastTurn = !!(conversation && profileUpdatedAt > lastSnapshot);

    const profileSummary = buildProfileSummary(profile);
    const systemPrompt = buildSystemPrompt(profileSummary, profileChangedSinceLastTurn);

    const previousMessages: any[] = Array.isArray(conversation?.messages) ? conversation.messages : [];
    const recentHistory = previousMessages
      .slice(-10)
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

    // --- Build initial message list ---
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: userMessage },
    ];

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
            JSON.stringify({ error: 'Crédits IA épuisés. Contacte le support pour réactiver l\'agent.' }),
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
          JSON.stringify({ error: 'Trop d\'appels d\'outils sur ce tour. Réessaie avec une question plus précise.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Push assistant message containing tool_calls
      messages.push(assistantMessage);

      // Execute each tool
      for (const tc of toolCalls) {
        const fnName = tc.function?.name;
        let parsedArgs: any = {};
        try {
          parsedArgs = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};
        } catch (e) {
          console.error('[elio-agent] failed to parse tool args:', e);
        }
        const result = await executeTool(fnName, parsedArgs, userId);
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
      finalAssistantText = 'Désolé, je n\'ai pas réussi à formuler une réponse complète. Réessaie avec une question plus précise.';
    }

    // --- Extract rich_view tag ---
    const { cleanedText, richView } = extractRichView(finalAssistantText);
    let finalRichView: { type: string; data: any } | null = null;
    if (richView && lastToolResultData) {
      finalRichView = { type: richView.type, data: lastToolResultData };
    } else if (lastToolName && lastToolResultData) {
      // Fallback : si l'agent oublie la balise mais a appelé un tool, on infère
      const inferMap: Record<string, string> = {
        calculate_tax: 'tax_breakdown',
        simulate_real_estate: 'real_estate_cashflow',
        get_deadlines: 'deadlines_list',
        get_recommendations: 'recommendations_list',
        detect_aids: 'aids_eligibility',
        get_fiscal_concept: 'fiscal_concept',
      };
      const inferred = inferMap[lastToolName];
      if (inferred) finalRichView = { type: inferred, data: lastToolResultData };
    }

    // --- Persist conversation ---
    const newMessages = [
      ...previousMessages,
      { role: 'user', content: userMessage, ts: new Date().toISOString() },
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
          topic: userMessage.slice(0, 80),
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
        tool_calls_made: toolCallsLog.map(t => t.name),
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
