// Synchronise comptes + transactions (90 derniers jours) depuis Powens
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const POWENS_DOMAIN = Deno.env.get('POWENS_DOMAIN')!;
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (!claims?.claims?.sub) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    const userId = claims.claims.sub;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const baseUrl = `https://${POWENS_DOMAIN}`;

    const { data: conn } = await admin
      .from('powens_connections')
      .select('auth_token')
      .eq('user_id', userId)
      .maybeSingle();

    if (!conn) {
      return new Response(JSON.stringify({ error: 'No Powens connection. Connect a bank first.' }), { status: 404, headers: corsHeaders });
    }

    const headers = { Authorization: `Bearer ${conn.auth_token}` };

    // 1. Comptes
    const accRes = await fetch(`${baseUrl}/2.0/users/me/accounts?expand=connection`, { headers });
    const accData = await accRes.json();
    if (!accRes.ok) {
      return new Response(JSON.stringify({ error: 'Powens accounts fetch failed', details: accData }), { status: 500, headers: corsHeaders });
    }

    const accounts = accData.accounts || [];
    let accountsUpserted = 0;
    const accountIdMap = new Map<number, string>(); // powens_id -> uuid

    for (const a of accounts) {
      const iban = a.iban ? `**** ${String(a.iban).slice(-4)}` : null;
      const { data: up } = await admin
        .from('bank_accounts')
        .upsert(
          {
            user_id: userId,
            powens_account_id: a.id,
            powens_connection_id: a.id_connection ?? null,
            bank_name: a.connection?.connector?.name ?? a.bank?.name ?? null,
            account_name: a.name ?? a.original_name ?? null,
            account_type: a.type ?? null,
            iban_masked: iban,
            balance: a.balance ?? 0,
            currency: a.currency?.id || a.currency || 'EUR',
            last_update: a.last_update ?? null,
            is_active: !a.disabled,
            raw: a,
          },
          { onConflict: 'user_id,powens_account_id' },
        )
        .select('id, powens_account_id')
        .single();
      if (up) {
        accountsUpserted++;
        accountIdMap.set(a.id, up.id);
      }
    }

    // 2. Transactions sur 90 jours
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const sinceStr = since.toISOString().slice(0, 10);

    const txRes = await fetch(
      `${baseUrl}/2.0/users/me/transactions?min_date=${sinceStr}&limit=1000`,
      { headers },
    );
    const txData = await txRes.json();
    if (!txRes.ok) {
      return new Response(JSON.stringify({ error: 'Powens transactions fetch failed', details: txData }), { status: 500, headers: corsHeaders });
    }

    const transactions = txData.transactions || [];
    const rows = transactions
      .map((t: any) => {
        const accUuid = accountIdMap.get(t.id_account);
        if (!accUuid) return null;
        return {
          user_id: userId,
          account_id: accUuid,
          powens_transaction_id: t.id,
          tx_date: t.date,
          value_date: t.rdate ?? t.vdate ?? null,
          label: t.simplified_wording || t.wording || t.original_wording,
          original_label: t.original_wording ?? null,
          amount: t.value ?? 0,
          currency: t.currency?.id || 'EUR',
          category: t.category?.name ?? null,
          type: t.type ?? null,
          raw: t,
        };
      })
      .filter(Boolean);

    let txInserted = 0;
    if (rows.length) {
      const { error, count } = await admin
        .from('bank_transactions')
        .upsert(rows, { onConflict: 'user_id,powens_transaction_id', count: 'exact' });
      if (!error) txInserted = count ?? rows.length;
    }

    await admin.from('powens_connections').update({ last_sync_at: new Date().toISOString() }).eq('user_id', userId);

    return new Response(
      JSON.stringify({
        success: true,
        accounts_synced: accountsUpserted,
        transactions_synced: txInserted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('powens-sync error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
