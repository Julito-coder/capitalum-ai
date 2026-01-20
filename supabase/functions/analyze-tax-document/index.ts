import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es un expert fiscal français spécialisé dans l'analyse des déclarations d'impôts.

CONTEXTE UTILISATEUR:
{USER_PROFILE}

DOCUMENT À ANALYSER:
L'utilisateur te fournit le contenu extrait de sa déclaration d'impôts (formulaire 2042 ou annexes).

TES MISSIONS:
1. DÉTECTER LES ERREURS potentielles dans la déclaration
2. IDENTIFIER LES INCOHÉRENCES avec le profil utilisateur
3. RECOMMANDER DES OPTIMISATIONS fiscales applicables

RÈGLES FISCALES 2026 À APPLIQUER:
- Tranches IR: 0% jusqu'à 11497€, 11% de 11497€ à 29315€, 30% de 29315€ à 83823€, 41% de 83823€ à 180294€, 45% au-delà
- Abattement 10% salariés: min 495€, max 14171€
- Plafond micro-BNC: 77700€ (abattement 34%)
- Plafond micro-BIC: 188700€ (abattement 71%)
- Déficit foncier: max 10700€/an
- PER: plafond 35194€ (solo) / 70388€ (couple)
- Crédit garde enfants: 50% plafonné à 3500€/enfant
- Crédit emploi domicile: 50% plafonné à 12000€/an

FORMAT DE RÉPONSE (JSON strict):
{
  "summary": "Résumé en 2-3 phrases de l'analyse",
  "score": 0-100,
  "errors": [
    {
      "severity": "critical|warning|info",
      "title": "Titre court",
      "description": "Description détaillée",
      "taxBox": "Case concernée (ex: 1AJ)",
      "estimatedRisk": 0,
      "action": "Action corrective recommandée",
      "legalReference": "Référence CGI si applicable"
    }
  ],
  "optimizations": [
    {
      "title": "Titre de l'optimisation",
      "description": "Explication",
      "estimatedSavings": 0,
      "effort": "Effort requis",
      "taxBox": "Case concernée",
      "deadline": "Date limite si applicable"
    }
  ],
  "extractedData": {
    "revenuBrutGlobal": 0,
    "revenuNetImposable": 0,
    "impotEstime": 0,
    "casesRemplies": ["1AJ", "1BJ", ...]
  }
}

IMPORTANT:
- Sois précis et cite les cases de déclaration concernées
- Estime les montants quand possible
- Priorise par impact financier
- Reste factuel et professionnel`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Utilisateur non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { documentContent, userProfile } = await req.json();

    if (!documentContent) {
      return new Response(JSON.stringify({ error: "Contenu du document requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build user profile context
    const profileContext = userProfile ? `
- Situation familiale: ${userProfile.family_status || 'Non renseignée'}
- Année de naissance: ${userProfile.birth_year || 'Non renseignée'}
- Statut professionnel: ${userProfile.professional_status || 'Non renseigné'}
- Nombre d'enfants: ${userProfile.children_count || 0}
- Revenus fonciers: ${userProfile.has_rental_income ? 'Oui' : 'Non'}
- Investissements: ${userProfile.has_investments ? 'Oui' : 'Non'}
- Nom: ${userProfile.full_name || 'Non renseigné'}
- Entreprise: ${userProfile.company_name || 'Non renseignée'}
` : 'Profil utilisateur non disponible';

    const systemPrompt = SYSTEM_PROMPT.replace('{USER_PROFILE}', profileContext);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurée");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Voici le contenu extrait de ma déclaration d'impôts. Analyse-le et fournis ton rapport en JSON:\n\n${documentContent}` 
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants, veuillez recharger." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`Erreur API IA: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Réponse IA vide");
    }

    // Parse JSON from AI response (handle markdown code blocks)
    let analysisResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      // Return a simplified error response if parsing fails
      analysisResult = {
        summary: "L'analyse a été effectuée mais le format de réponse était inattendu.",
        score: 50,
        errors: [],
        optimizations: [],
        rawResponse: content
      };
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-tax-document:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur interne" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
