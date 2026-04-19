// Détecte les prélèvements récurrents depuis bank_transactions et insère dans user_recurring_deadlines.
// Cas spécial URSSAF : marque la cotisation correspondante comme payée.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalise un libellé pour grouper "EDF 11/2024" et "EDF 12/2024" ensemble
function normalizeLabel(s: string): string {
  return (s || '')
    .toUpperCase()
    .replace(/\d+/g, ' ')
    .replace(/[^A-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length >= 3)
    .slice(0, 3)
    .join(' ');
}

// Détecte la catégorie depuis le libellé brut
function detectCategory(label: string): { category: string; isUrssaf: boolean } {
  const u = (label || '').toUpperCase();
  if (/URSSAF|RSI|SECU INDEPENDANT/.test(u)) return { category: 'autre', isUrssaf: true };
  if (/EDF|ENGIE|TOTAL ?ENERGIES|ENI|EKWATEUR|VATTENFALL|GAZ|ELECTRICIT/.test(u)) return { category: 'energie', isUrssaf: false };
  if (/ORANGE|SFR|FREE|BOUYGUES|SOSH|RED |BYTEL|TELECOM|INTERNET|FIBRE/.test(u)) return { category: 'telecom', isUrssaf: false };
  if (/MAIF|MACIF|MATMUT|GROUPAMA|AXA|ALLIANZ|GENERALI|MMA|GMF|ASSUR|MUTUELLE|HARMONIE/.test(u)) return { category: 'assurance', isUrssaf: false };
  if (/NETFLIX|SPOTIFY|DISNEY|AMAZON PRIME|CANAL|DEEZER|APPLE|YOUTUBE|MICROSOFT|ADOBE|ABONNEMENT/.test(u)) return { category: 'abonnement', isUrssaf: false };
  if (/LOYER|SCI |FONCIA|CITYA|NEXITY|SYNDIC|BAILLEUR/.test(u)) return { category: 'logement', isUrssaf: false };
  if (/CREDIT |PRET |EMPRUNT|BNP|CIC|LCL|SG |CAISSE EPARGNE|BANQUE POSTALE.*PRET/.test(u)) return { category: 'credit', isUrssaf: false };
  return { category: 'autre', isUrssaf: false };
}

function detectFrequency(dates: string[]): 'monthly' | 'quarterly' | 'annually' | null {
  if (dates.length < 2) return null;
  const sorted = [...dates].sort();
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1]).getTime();
    const b = new Date(sorted[i]).getTime();
    gaps.push(Math.round((b - a) / 86400000));
  }
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avg >= 25 && avg <= 35 && dates.length >= 3) return 'monthly';
  if (avg >= 80 && avg <= 100 && dates.length >= 2) return 'quarterly';
  if (avg >= 350 && avg <= 380) return 'annually';
  return null;
}

function nextDate(lastDate: string, freq: 'monthly' | 'quarterly' | 'annually'): string {
  const d = new Date(lastDate);
  if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
  if (freq === 'quarterly') d.setMonth(d.getMonth() + 3);
  if (freq === 'annually') d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userErr || !userData?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Récupérer les transactions sortantes (débits) sur 180 jours
    const since = new Date();
    since.setDate(since.getDate() - 180);
    const { data: txs } = await admin
      .from('bank_transactions')
      .select('label, amount, tx_date')
      .eq('user_id', userId)
      .lt('amount', 0)
      .gte('tx_date', since.toISOString().slice(0, 10));

    if (!txs || txs.length === 0) {
      return new Response(JSON.stringify({ detected: 0, urssaf_marked: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Grouper par libellé normalisé + montant arrondi
    const groups = new Map<string, { label: string; amount: number; dates: string[] }>();
    for (const t of txs) {
      const norm = normalizeLabel(t.label || '');
      if (!norm) continue;
      const amt = Math.round(Math.abs(Number(t.amount)));
      if (amt < 5) continue; // ignorer les micro-paiements
      const key = `${norm}|${amt}`;
      const g = groups.get(key) || { label: t.label!, amount: amt, dates: [] };
      g.dates.push(t.tx_date);
      groups.set(key, g);
    }

    // 3. Charger les récurrents existants pour éviter les doublons
    const { data: existing } = await admin
      .from('user_recurring_deadlines')
      .select('title, amount, source')
      .eq('user_id', userId)
      .eq('is_active', true);
    const existingKeys = new Set(
      (existing || []).map((e: any) => `${normalizeLabel(e.title)}|${Math.round(Number(e.amount || 0))}`),
    );

    // 4. Détecter les récurrents et insérer
    const toInsert: any[] = [];
    let urssafMarked = 0;
    const urssafDates: string[] = [];

    for (const [key, g] of groups) {
      const freq = detectFrequency(g.dates);
      if (!freq) continue;
      if (existingKeys.has(key)) continue;

      const { category, isUrssaf } = detectCategory(g.label);
      const lastDate = g.dates.sort().slice(-1)[0];

      if (isUrssaf) {
        urssafDates.push(...g.dates);
      }

      toInsert.push({
        user_id: userId,
        title: g.label.slice(0, 100),
        category,
        amount: g.amount,
        frequency: freq,
        next_date: nextDate(lastDate, freq),
        provider: g.label.split(' ').slice(0, 2).join(' ').slice(0, 50),
        source: 'bank',
        notes: `Détecté automatiquement depuis ta banque (${g.dates.length} prélèvements)`,
        is_active: true,
      });
    }

    let inserted = 0;
    if (toInsert.length) {
      const { error, count } = await admin
        .from('user_recurring_deadlines')
        .insert(toInsert, { count: 'exact' });
      if (!error) inserted = count ?? toInsert.length;
      else console.error('Insert recurring failed', error);
    }

    // 5. URSSAF : marquer les cotisations correspondantes comme payées
    for (const d of urssafDates) {
      const date = new Date(d);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const { error } = await admin
        .from('urssaf_contributions')
        .upsert(
          {
            user_id: userId,
            year,
            month,
            quarter: Math.ceil(month / 3),
            is_paid: true,
            paid_date: d,
          },
          { onConflict: 'user_id,year,month' },
        );
      if (!error) urssafMarked++;
    }

    return new Response(
      JSON.stringify({ detected: inserted, urssaf_marked: urssafMarked, candidates: toInsert.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('detect-recurring-from-bank error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
