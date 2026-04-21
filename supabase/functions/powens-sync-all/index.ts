// Cron-triggered: synchronise tous les utilisateurs Powens actifs
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const POWENS_DOMAIN = Deno.env.get('POWENS_DOMAIN')!;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Récupérer toutes les connexions actives
    const { data: connections, error: connErr } = await admin
      .from('powens_connections')
      .select('user_id, auth_token')
      .eq('status', 'active');

    if (connErr || !connections?.length) {
      return new Response(JSON.stringify({ synced: 0, message: 'No active connections' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = `https://${POWENS_DOMAIN}`;
    let totalSynced = 0;
    let errors = 0;

    for (const conn of connections) {
      try {
        const headers = { Authorization: `Bearer ${conn.auth_token}` };

        // Comptes
        const accRes = await fetch(`${baseUrl}/2.0/users/me/accounts?expand=connection`, { headers });
        if (!accRes.ok) { errors++; continue; }
        const accData = await accRes.json();
        const accounts = accData.accounts || [];
        const accountIdMap = new Map<number, string>();

        for (const a of accounts) {
          const iban = a.iban ? `**** ${String(a.iban).slice(-4)}` : null;
          const { data: up } = await admin
            .from('bank_accounts')
            .upsert(
              {
                user_id: conn.user_id,
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
          if (up) accountIdMap.set(a.id, up.id);
        }

        // Transactions 90j
        const since = new Date();
        since.setDate(since.getDate() - 90);
        const txRes = await fetch(
          `${baseUrl}/2.0/users/me/transactions?min_date=${since.toISOString().slice(0, 10)}&limit=1000`,
          { headers },
        );
        if (txRes.ok) {
          const txData = await txRes.json();
          const rows = (txData.transactions || [])
            .map((t: any) => {
              const accUuid = accountIdMap.get(t.id_account);
              if (!accUuid) return null;
              return {
                user_id: conn.user_id,
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

          if (rows.length) {
            await admin
              .from('bank_transactions')
              .upsert(rows, { onConflict: 'user_id,powens_transaction_id' });
          }
        }

        await admin
          .from('powens_connections')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('user_id', conn.user_id);

        totalSynced++;
      } catch (e) {
        console.error(`Sync failed for user ${conn.user_id}`, e);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ synced: totalSynced, errors, total: connections.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('powens-sync-all error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
