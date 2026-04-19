// Crée un user Powens (si besoin) et retourne l'URL Webview Connect
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const POWENS_DOMAIN = Deno.env.get('POWENS_DOMAIN')!;
    const POWENS_CLIENT_ID = Deno.env.get('POWENS_CLIENT_ID')!;
    const POWENS_CLIENT_SECRET = Deno.env.get('POWENS_CLIENT_SECRET')!;
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
    const baseUrl = `https://${POWENS_DOMAIN}`;

    // 1. Récupérer ou créer le user Powens
    const { data: existing } = await admin
      .from('powens_connections')
      .select('powens_user_id, auth_token')
      .eq('user_id', userId)
      .maybeSingle();

    let powensUserId: number;
    let authToken: string;

    if (existing) {
      powensUserId = Number(existing.powens_user_id);
      authToken = existing.auth_token;
    } else {
      // Créer un permanent user token
      const initRes = await fetch(`${baseUrl}/2.0/auth/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: POWENS_CLIENT_ID,
          client_secret: POWENS_CLIENT_SECRET,
        }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) {
        console.error('Powens init failed', initData);
        return new Response(JSON.stringify({ error: 'Powens init failed', details: initData }), { status: 500, headers: corsHeaders });
      }
      powensUserId = initData.id_user;
      authToken = initData.auth_token;

      await admin.from('powens_connections').insert({
        user_id: userId,
        powens_user_id: powensUserId,
        auth_token: authToken,
      });
    }

    // 2. Générer un code temporaire pour la webview
    const codeRes = await fetch(`${baseUrl}/2.0/auth/token/code?type=singleAccess`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const codeData = await codeRes.json();
    if (!codeRes.ok) {
      return new Response(JSON.stringify({ error: 'Token code failed', details: codeData }), { status: 500, headers: corsHeaders });
    }

    // 3. Construire l'URL webview
    const body = await req.json().catch(() => ({}));
    const redirectUri = body?.redirect_uri || '';
    const webviewUrl = `https://webview.powens.com/connect?domain=${POWENS_DOMAIN}&client_id=${POWENS_CLIENT_ID}&code=${codeData.code}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return new Response(JSON.stringify({ webview_url: webviewUrl, powens_user_id: powensUserId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('powens-init-webview error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
