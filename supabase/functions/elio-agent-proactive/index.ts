// Élio Agent Proactive — cron hebdo (lundi 8h UTC).
// Génère des notifications type 'deadline' et 'optimization' pour chaque user
// avec onboarding complété. Dédoublonnage par (user_id, type, title) non-dismissed.
//
// Sécurité : la fonction est appelée par pg_cron (header X-Cron-Source) OU
// déclenchée manuellement par un user authentifié (utile pour test).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { detectOptimizations, profileToScannerInput } from './_taxOptimizationEngine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-source',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Échéances fiscales 2025-2026 (synchro avec elio-agent/tools/getDeadlines.ts)
const DEADLINES = [
  { key: 'taxe_fonciere_2025', title: 'Paiement taxe foncière', date: '2025-10-15', amount: 840 },
  { key: 'taxe_habitation_rs_2025', title: 'Taxe d\'habitation résidence secondaire', date: '2025-12-15', amount: 0 },
  { key: 'per_versement_2025', title: 'Dernier versement PER déductible 2025', date: '2025-12-31', amount: 0 },
  { key: 'don_oeuvres_2025', title: 'Dons aux œuvres déductibles', date: '2025-12-31', amount: 0 },
  { key: 'urssaf_q4_2025', title: 'Acompte URSSAF Q4', date: '2026-01-31', amount: 0 },
  { key: 'declaration_2026', title: 'Déclaration de revenus 2025', date: '2026-05-21', amount: 0 },
];

type SupaClient = ReturnType<typeof createClient>;

async function rephraseWithLLM(title: string, savings: number, description: string): Promise<string> {
  if (!LOVABLE_API_KEY) return `${description} Gain estimé : ${savings}€.`;
  try {
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Tu es Élio. Reformule en français, ton "tu", chaleureux et direct, 1-2 phrases max. Pas d\'emoji. Mentionne le gain en €.' },
          { role: 'user', content: `Optimisation: ${title}\nDescription: ${description}\nGain estimé: ${savings}€` },
        ],
      }),
    });
    if (!resp.ok) return `${description} Tu peux économiser environ ${savings}€.`;
    const json = await resp.json();
    return json.choices?.[0]?.message?.content?.trim() || `${description} Gain estimé : ${savings}€.`;
  } catch {
    return `${description} Gain estimé : ${savings}€.`;
  }
}

async function existsNotification(supa: SupaClient, userId: string, type: string, title: string): Promise<boolean> {
  const { data } = await supa
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .eq('title', title)
    .eq('is_dismissed', false)
    .limit(1);
  return !!(data && data.length);
}

async function processDeadlines(supa: SupaClient, userId: string): Promise<number> {
  const today = new Date();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 14);
  let created = 0;

  for (const d of DEADLINES) {
    const date = new Date(d.date);
    if (date < today || date > horizon) continue;
    const days = Math.ceil((date.getTime() - today.getTime()) / 86400000);
    const title = `Échéance dans ${days} jour${days > 1 ? 's' : ''} : ${d.title}`;
    if (await existsNotification(supa, userId, 'deadline', title)) continue;

    const priority = days <= 3 ? 1 : days <= 7 ? 3 : 5;
    const dateLabel = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    const amountSentence = d.amount > 0 ? ` Montant estimé : ${d.amount}€.` : '';
    const expires = new Date(date);
    expires.setDate(expires.getDate() + 1);

    const { error } = await supa.from('notifications').insert({
      user_id: userId,
      type: 'deadline',
      category: 'agent_proactive',
      title,
      message: `${d.title} tombe le ${dateLabel}.${amountSentence}`,
      priority,
      expires_at: expires.toISOString(),
      data: {
        action_label: 'Préparer',
        action_prompt: `Prépare-moi pour l'échéance ${d.title}`,
        estimated_gain: null,
        deadline_key: d.key,
      },
    });
    if (!error) created++;
  }
  return created;
}

async function processWeeklyInsight(supa: SupaClient, userId: string, profile: any): Promise<number> {
  // Bilan hebdo : compte les optimisations actives (notifications type 'optimization' non dismissed)
  // + somme des estimated_gain. Crée un insight par semaine (dédoublonnage par titre daté).
  const weekLabel = (() => {
    const d = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    return `S${week}-${d.getFullYear()}`;
  })();
  const title = `Bilan de la semaine (${weekLabel})`;
  if (await existsNotification(supa, userId, 'insight', title)) return 0;

  const { data: activeOpts } = await supa
    .from('notifications')
    .select('data')
    .eq('user_id', userId)
    .eq('type', 'optimization')
    .eq('is_dismissed', false);

  const count = activeOpts?.length ?? 0;
  const totalGain = (activeOpts ?? []).reduce((sum: number, n: any) => {
    const g = Number(n?.data?.estimated_gain ?? 0);
    return sum + (isFinite(g) ? g : 0);
  }, 0);

  let message: string;
  let actionPrompt: string;
  if (count === 0) {
    message = `Cette semaine, aucune optimisation active. Veux-tu qu'on en cherche ensemble ?`;
    actionPrompt = `Trouve-moi des optimisations fiscales pour ma situation.`;
  } else {
    message = `Cette semaine, tu as ${count} optimisation${count > 1 ? 's' : ''} active${count > 1 ? 's' : ''}${totalGain > 0 ? ` valant ${Math.round(totalGain)}€` : ''}. On s'en occupe ?`;
    actionPrompt = `Fais-moi le bilan de mes optimisations actives et dis-moi par laquelle commencer.`;
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  const { error } = await supa.from('notifications').insert({
    user_id: userId,
    type: 'insight',
    category: 'agent_proactive',
    title,
    message,
    priority: 4,
    expires_at: expires.toISOString(),
    data: {
      action_label: count > 0 ? 'Faire le point' : 'Chercher',
      action_prompt: actionPrompt,
      estimated_gain: Math.round(totalGain),
      active_count: count,
    },
  });
  return error ? 0 : 1;
}

async function processOptimizations(supa: SupaClient, userId: string, profile: any): Promise<number> {
  // Mensuel : seulement le premier lundi du mois
  const today = new Date();
  const isFirstMondayOfMonth = today.getDay() === 1 && today.getDate() <= 7;
  if (!isFirstMondayOfMonth) return 0;

  const input = profileToScannerInput(profile);
  const opts = detectOptimizations(input).filter(o => o.estimatedSavings > 100);
  let created = 0;

  for (const opt of opts.slice(0, 5)) {
    const title = `Optimisation possible : ${opt.title}`;
    if (await existsNotification(supa, userId, 'optimization', title)) continue;

    const message = await rephraseWithLLM(opt.title, opt.estimatedSavings, opt.description);
    const priority = opt.estimatedSavings > 500 ? 2 : 4;

    const { error } = await supa.from('notifications').insert({
      user_id: userId,
      type: 'optimization',
      category: 'agent_proactive',
      title,
      message,
      priority,
      data: {
        action_label: 'Voir comment',
        action_prompt: `Explique-moi l'optimisation "${opt.title}" et comment l'appliquer.`,
        estimated_gain: opt.estimatedSavings,
        optimization_id: opt.id,
      },
    });
    if (!error) created++;
  }
  return created;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Sécurité : autoriser pg_cron (header X-Cron-Source) OU user authentifié
  const cronSource = req.headers.get('X-Cron-Source');
  const authHeader = req.headers.get('Authorization');
  if (cronSource !== 'pg_cron' && !authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const { data: profiles, error: pErr } = await supa
      .from('profiles')
      .select('*')
      .eq('onboarding_completed', true);

    if (pErr) throw pErr;

    let usersProcessed = 0;
    let itemsCreated = 0;

    for (const profile of profiles ?? []) {
      try {
        const userId = profile.user_id;
        const dl = await processDeadlines(supa, userId);
        const opt = await processOptimizations(supa, userId, profile);
        itemsCreated += dl + opt;
        usersProcessed++;
      } catch (e) {
        console.error('[elio-agent-proactive] user error', profile.user_id, e);
      }
    }

    console.log(`[elio-agent-proactive] processed=${usersProcessed} created=${itemsCreated}`);
    return new Response(
      JSON.stringify({ users_processed: usersProcessed, items_created: itemsCreated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[elio-agent-proactive] fatal', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
