/**
 * Edge Function — Génération du Bulletin Élio quotidien.
 * Appelé paresseusement au premier load de la journée.
 * Utilise Lovable AI Gateway pour la news personnalisée uniquement.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface ProfileSummary {
  firstName: string;
  professionalStatus: string;
  familyStatus: string;
  isHomeowner: boolean;
  hasRentalIncome: boolean;
  isInvestor: boolean;
  isRetired: boolean;
  isSelfEmployed: boolean;
  childrenCount: number;
  ageRange: string | null;
  incomeRange: string | null;
  housingStatus: string | null;
}

function buildProfileSummary(profile: any): ProfileSummary {
  return {
    firstName: profile.first_name || profile.full_name?.split(' ')[0] || '',
    professionalStatus: profile.professional_status || 'employee',
    familyStatus: profile.family_status || 'single',
    isHomeowner: profile.is_homeowner || false,
    hasRentalIncome: profile.has_rental_income || false,
    isInvestor: profile.is_investor || false,
    isRetired: profile.is_retired || false,
    isSelfEmployed: profile.is_self_employed || false,
    childrenCount: profile.children_count || 0,
    ageRange: profile.age_range,
    incomeRange: profile.income_range,
    housingStatus: profile.housing_status,
  };
}

function getFiscalSeason(): string {
  const now = new Date();
  const m = now.getMonth();
  const d = now.getDate();
  if ((m === 3 && d >= 15) || m === 4 || (m === 5 && d <= 10)) return 'Période de déclaration des revenus';
  if (m === 8 || m === 9) return 'Période de réception des avis d\'imposition';
  if (m === 10) return 'Période de paiement de la taxe foncière';
  if (m === 11) return 'Fin d\'année, dernières optimisations fiscales';
  if (m === 0) return 'Début d\'année, bilan fiscal';
  return 'Période courante';
}

function buildProfileDescription(p: ProfileSummary): string {
  const parts: string[] = [];
  if (p.firstName) parts.push(`Prénom : ${p.firstName}`);
  
  const statusMap: Record<string, string> = {
    employee: 'Salarié', self_employed: 'Indépendant', retired: 'Retraité',
    student: 'Étudiant', unemployed: 'Sans emploi',
  };
  parts.push(`Statut : ${statusMap[p.professionalStatus] || p.professionalStatus}`);
  
  const familyMap: Record<string, string> = {
    single: 'Célibataire', married: 'Marié(e)', pacs: 'Pacsé(e)',
    divorced: 'Divorcé(e)', widowed: 'Veuf/Veuve',
  };
  parts.push(`Situation : ${familyMap[p.familyStatus] || p.familyStatus}`);
  
  if (p.childrenCount > 0) parts.push(`${p.childrenCount} enfant(s)`);
  if (p.isHomeowner) parts.push('Propriétaire');
  if (p.hasRentalIncome) parts.push('Bailleur (revenus locatifs)');
  if (p.isInvestor) parts.push('Investisseur');
  if (p.isSelfEmployed) parts.push('Travailleur indépendant');
  if (p.isRetired) parts.push('Retraité');
  
  return parts.join('. ');
}

async function generatePersonalizedNews(
  profileSummary: ProfileSummary
): Promise<{ context: string; title: string; body: string } | null> {
  if (!LOVABLE_API_KEY) return null;

  const profileDesc = buildProfileDescription(profileSummary);
  const season = getFiscalSeason();

  const prompt = `Tu es Élio, copilote administratif et financier des Français.
Rédige UNE news du jour (titre + 2-3 phrases) pour cet utilisateur.

Profil : ${profileDesc}
Contexte du jour : ${season}

Contraintes absolues :
- Tutoiement.
- Zéro jargon fiscal non expliqué.
- Zéro chiffre (les chiffres viennent des moteurs déterministes, pas de toi).
- Zéro recommandation d'action (c'est le rôle de "l'action du jour").
- Juste : informer, mettre en perspective, contextualiser.
- Longueur : titre 10 mots max, body 40 mots max.
- Ton calme, adulte, jamais alarmiste.

Retourne UNIQUEMENT du JSON valide :
{ "context": "...", "title": "...", "body": "..." }`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'Tu es un rédacteur éditorial spécialisé en finance personnelle française. Tu réponds uniquement en JSON valide.' },
          { role: 'user', content: prompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_news',
              description: 'Génère une news personnalisée pour le bulletin quotidien',
              parameters: {
                type: 'object',
                properties: {
                  context: { type: 'string', description: 'Contexte de personnalisation, ex: "Parce que tu es propriétaire bailleur"' },
                  title: { type: 'string', description: 'Titre de la news, 10 mots max' },
                  body: { type: 'string', description: 'Corps de la news, 40 mots max' },
                },
                required: ['context', 'title', 'body'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'generate_news' } },
      }),
    });

    if (!response.ok) {
      console.error('AI Gateway error:', response.status);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return {
        context: parsed.context || '',
        title: parsed.title || '',
        body: parsed.body || '',
      };
    }

    // Fallback: try parsing content directly
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    return null;
  } catch (err) {
    console.error('News generation failed:', err);
    return null;
  }
}

// Fallback news when LLM fails
function getFallbackNews(profile: ProfileSummary): { context: string; title: string; body: string } {
  if (profile.isHomeowner) {
    return {
      context: 'Parce que tu es propriétaire',
      title: 'Les aides à la rénovation évoluent chaque année',
      body: 'Les dispositifs comme MaPrimeRénov\' sont régulièrement mis à jour. Garde un œil sur les conditions d\'éligibilité pour ne pas passer à côté.',
    };
  }
  if (profile.isSelfEmployed) {
    return {
      context: 'Parce que tu es indépendant',
      title: 'Tes cotisations sociales se calculent sur ton revenu réel',
      body: 'En début d\'activité, l\'URSSAF se base sur des forfaits. Une fois tes revenus connus, une régularisation peut jouer en ta faveur.',
    };
  }
  if (profile.hasRentalIncome) {
    return {
      context: 'Parce que tu es propriétaire bailleur',
      title: 'Le choix du régime fiscal impacte ta rentabilité',
      body: 'Micro-foncier ou réel, chaque régime a ses avantages selon ta situation. Le bon choix peut représenter plusieurs centaines d\'euros par an.',
    };
  }
  return {
    context: 'Pour tous les contribuables',
    title: 'Chaque situation fiscale est unique',
    body: 'Plus ton profil est complet, plus les recommandations sont précises. Quelques minutes suffisent pour débloquer des économies insoupçonnées.',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = todayStr();

    // Check if bulletin already exists
    const { data: existing } = await supabase
      .from('daily_bulletins')
      .select('*')
      .eq('user_id', user.id)
      .eq('bulletin_date', today)
      .maybeSingle();

    if (existing) {
      // Si la news manque, on la génère et on met à jour
      if (!existing.news_title) {
        const profileForNews = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileForNews.data) {
          const summary = buildProfileSummary(profileForNews.data);
          let news = await generatePersonalizedNews(summary);
          if (!news) news = getFallbackNews(summary);

          const { data: updated } = await supabase
            .from('daily_bulletins')
            .update({
              news_title: news.title,
              news_body: news.body,
              news_context: news.context,
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (updated) {
            return new Response(JSON.stringify({ bulletin: updated, cached: true, news_backfilled: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }

      return new Response(JSON.stringify({ bulletin: existing, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profil non trouvé' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const profileSummary = buildProfileSummary(profile);

    // Get body payload with action data from client-side engine
    let body: any = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch {
      body = {};
    }
    const {
      action_type, action_id, action_title, action_description,
      action_gain_cents, action_effort_minutes,
      next_deadline_json, cumulative_gain_cents, weekly_delta_cents,
    } = body;

    // If no action data provided (backfill call without bulletin yet), bail out gracefully
    if (!action_type || !action_id || !action_title) {
      return new Response(JSON.stringify({ error: 'Action data manquante', bulletin: null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate personalized news via LLM
    let news = await generatePersonalizedNews(profileSummary);
    if (!news) {
      news = getFallbackNews(profileSummary);
    }

    // Insert bulletin
    const { data: bulletin, error: insertError } = await supabase
      .from('daily_bulletins')
      .insert({
        user_id: user.id,
        bulletin_date: today,
        action_type,
        action_id,
        action_title,
        action_description,
        action_gain_cents: action_gain_cents || null,
        action_effort_minutes: action_effort_minutes || null,
        action_status: 'pending',
        news_title: news.title,
        news_body: news.body,
        news_context: news.context,
        next_deadline_json: next_deadline_json || null,
        cumulative_gain_cents: cumulative_gain_cents || 0,
        weekly_delta_cents: weekly_delta_cents || 0,
      })
      .select()
      .single();

    if (insertError) {
      // Race condition: bulletin créé en parallèle. Récupère l'existant.
      if ((insertError as any).code === '23505') {
        const { data: raceBulletin } = await supabase
          .from('daily_bulletins')
          .select('*')
          .eq('user_id', user.id)
          .eq('bulletin_date', today)
          .maybeSingle();
        if (raceBulletin) {
          return new Response(JSON.stringify({ bulletin: raceBulletin, cached: true, race: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Erreur lors de la création du bulletin' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ bulletin, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-daily-bulletin error:', err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
