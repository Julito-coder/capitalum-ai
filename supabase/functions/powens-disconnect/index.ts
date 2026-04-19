// Déconnecte l'utilisateur de Powens et purge ses données bancaires
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

    const { data: conn } = await admin
      .from('powens_connections')
      .select('auth_token')
      .eq('user_id', userId)
      .maybeSingle();

    if (conn) {
      // Révoquer côté Powens (best-effort)
      try {
        await fetch(`https://${POWENS_DOMAIN}/2.0/users/me`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${conn.auth_token}` },
        });
      } catch (_) { /* ignore */ }
    }

    await admin.from('bank_transactions').delete().eq('user_id', userId);
    await admin.from('bank_accounts').delete().eq('user_id', userId);
    await admin.from('powens_connections').delete().eq('user_id', userId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('powens-disconnect error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
