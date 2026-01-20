import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es un expert fiscal français ultra-spécialisé dans l'analyse des déclarations d'impôts.

CONTEXTE UTILISATEUR:
{USER_PROFILE}

TYPE DE FORMULAIRE DÉTECTÉ: {FORM_TYPE}

TU DOIS ANALYSER CE DOCUMENT EN FONCTION DE SON TYPE:

## FORMULAIRES SUPPORTÉS ET RÈGLES SPÉCIFIQUES:

### 2042 - Déclaration principale
- Cases 1AJ/1BJ: Salaires (vérifier cohérence net imposable vs net perçu)
- Cases 2DC/2TS: Revenus mobiliers (flat tax 30% vs barème)
- Cases 4BA/4BE: Revenus fonciers (micro vs réel)
- Options fiscales importantes: case 2OP pour barème progressif

### 2086 - Crypto-actifs (CRITIQUE)
- Case 3AN: Plus-values crypto imposables
- Méthode FIFO GLOBALE obligatoire
- Conversion crypto→crypto: NON imposable depuis 2023
- Airdrops/Staking: imposables comme BIC ou revenus divers
- ERREUR COURANTE: 95% des déclarations crypto sont fausses

### 3916 / 3916-bis - Comptes étrangers
- AMENDE: 1500€/compte/an non déclaré (10000€ si paradis fiscal)
- Exchanges crypto = comptes à déclarer (Binance, Kraken, Coinbase...)
- Courtiers étrangers (IBKR, Degiro) = à déclarer

### 2074 - Plus-values mobilières
- Case 3VG: Plus-values nettes
- Case 3VH: Moins-values reportables (10 ans)
- Abattement durée: 50% (2-8 ans), 65% (8+ ans) si option barème
- PEA: exonéré après 5 ans (hors PS 17.2%)

### 2031 - LMNP/LMP
- Seuil LMP: >23000€ ET > autres revenus du foyer
- Amortissements: 2-3%/an bâtiment, 10-20%/an mobilier
- Déficit LMNP: reportable 10 ans sur revenus de même nature
- Micro-BIC: 50% abattement (77700€ seuil meublé tourisme)

### 2035 - BNC Professions libérales
- Micro-BNC: <77700€, abattement 34%
- Adhésion CGA/AGA: évite majoration 15%
- TVA: franchise <36800€ services

### 2047 - Revenus étrangers
- Case 8TK: Crédit d'impôt étranger
- Vérifier convention fiscale applicable
- Méthodes: crédit d'impôt ou taux effectif

### 2044 - Revenus fonciers (réel)
- Déficit max: 10700€/an sur revenu global
- Intérêts d'emprunt déductibles
- Travaux: distinguer amélioration vs construction

RÈGLES FISCALES 2026:
- Tranches IR: 0% jusqu'à 11497€, 11% jusqu'à 29315€, 30% jusqu'à 83823€, 41% jusqu'à 180294€, 45% au-delà
- Flat tax: 30% (12.8% IR + 17.2% PS)
- PER: plafond 35194€ (solo) / 70388€ (couple)

FORMAT DE RÉPONSE (JSON strict):
{
  "detectedFormType": "2042|2086|3916|2074|2031|2035|2047|2044|unknown",
  "summary": "Résumé en 2-3 phrases",
  "score": 0-100,
  "errors": [
    {
      "severity": "critical|warning|info",
      "title": "Titre court",
      "description": "Description détaillée",
      "taxBox": "Case concernée",
      "estimatedRisk": 0,
      "action": "Action corrective",
      "legalReference": "Référence CGI"
    }
  ],
  "optimizations": [
    {
      "title": "Titre",
      "description": "Explication",
      "estimatedSavings": 0,
      "effort": "Effort requis",
      "taxBox": "Case concernée",
      "deadline": "Date limite si applicable"
    }
  ],
  "extractedData": {
    "revenuBrutGlobal": 0,
    "casesRemplies": ["1AJ", ...]
  },
  "formSpecificWarnings": ["Avertissements spécifiques au type de formulaire"]
}

IMPORTANT:
- Identifie d'abord le TYPE de formulaire
- Applique les règles SPÉCIFIQUES à ce formulaire
- Cite les cases exactes
- Estime les risques financiers
- Priorise par impact`;

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

    const { documentContent, userProfile, formType } = await req.json();

    if (!documentContent) {
      return new Response(JSON.stringify({ error: "Contenu du document requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileContext = userProfile ? `
- Situation familiale: ${userProfile.family_status || 'Non renseignée'}
- Année de naissance: ${userProfile.birth_year || 'Non renseignée'}
- Statut professionnel: ${userProfile.professional_status || 'Non renseigné'}
- Nombre d'enfants: ${userProfile.children_count || 0}
- Revenus fonciers: ${userProfile.has_rental_income ? 'Oui' : 'Non'}
- Investissements: ${userProfile.has_investments ? 'Oui' : 'Non'}
` : 'Profil utilisateur non disponible';

    const detectedForm = formType || 'auto-detect';
    const systemPrompt = SYSTEM_PROMPT
      .replace('{USER_PROFILE}', profileContext)
      .replace('{FORM_TYPE}', detectedForm);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurée");
    }

    console.log(`Analyzing document, form type hint: ${detectedForm}`);

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
            content: `Analyse ce document fiscal et fournis ton rapport en JSON:\n\n${documentContent}` 
          }
        ],
        temperature: 0.2,
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
        return new Response(JSON.stringify({ error: "Crédits insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Erreur API IA: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Réponse IA vide");
    }

    let analysisResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      analysisResult = {
        summary: "Analyse effectuée mais format inattendu.",
        score: 50,
        errors: [],
        optimizations: [],
        rawResponse: content
      };
    }

    console.log(`Analysis complete. Detected form: ${analysisResult.detectedFormType || 'unknown'}`);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
