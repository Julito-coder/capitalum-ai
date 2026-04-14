import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es un expert en extraction de données contractuelles à partir de documents français.

À partir du contenu d'un document (contrat, facture, relevé, échéancier), tu dois extraire TOUTES les échéances et prélèvements récurrents.

Types de documents supportés :
- Contrats d'énergie (EDF, Engie, TotalEnergies...)
- Contrats télécom/internet (Orange, Free, SFR, Bouygues...)
- Contrats d'assurance (auto, habitation, mutuelle, prévoyance)
- Contrats de crédit/prêt immobilier
- Factures avec échéancier
- Abonnements (streaming, salle de sport, cloud, apps)
- Quittances de loyer

Pour chaque échéance trouvée, extrais :
- title: nom clair de l'échéance (ex: "Prélèvement EDF", "Mutuelle AG2R")
- category: une parmi [energie, telecom, assurance, abonnement, logement, credit, autre]
- amount: montant en euros (null si non trouvé)
- frequency: une parmi [monthly, quarterly, annually]
- next_date: prochaine date de prélèvement au format YYYY-MM-DD (estimer si pas explicite)
- provider: nom du fournisseur
- contract_ref: référence du contrat si trouvée

Réponds UNIQUEMENT en JSON strict :
{
  "deadlines": [
    {
      "title": "string",
      "category": "string",
      "amount": number|null,
      "frequency": "string",
      "next_date": "YYYY-MM-DD",
      "provider": "string",
      "contract_ref": "string|null"
    }
  ],
  "documentType": "string",
  "confidence": 0-100
}

Si le document ne contient aucune échéance exploitable, renvoie : { "deadlines": [], "documentType": "unknown", "confidence": 0 }`;

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

    const { documentContent, documentPath } = await req.json();

    if (!documentContent) {
      return new Response(JSON.stringify({ error: "Contenu du document requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY non configurée");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyse ce document et extrais les échéances :\n\n${documentContent}` },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Erreur API IA: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) throw new Error("Réponse IA vide");

    let result;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      result = JSON.parse((jsonMatch[1] || content).trim());
    } catch {
      result = { deadlines: [], documentType: "unknown", confidence: 0 };
    }

    // Save extracted deadlines to DB
    if (result.deadlines && result.deadlines.length > 0) {
      const rows = result.deadlines.map((d: any) => ({
        user_id: user.id,
        title: d.title || "Échéance",
        category: d.category || "autre",
        amount: d.amount,
        frequency: d.frequency || "monthly",
        next_date: d.next_date,
        provider: d.provider || null,
        contract_ref: d.contract_ref || null,
        source: "document",
        source_document_path: documentPath || null,
      }));

      const { error: insertError } = await supabase
        .from("user_recurring_deadlines")
        .insert(rows);

      if (insertError) {
        console.error("Insert error:", insertError);
      }
    }

    return new Response(JSON.stringify(result), {
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
