import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext, topic } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    let systemPrompt = `Tu es un expert-formateur en fiscalité et finance française pour Capitalum. 
Tu dois éduquer les utilisateurs sur les concepts fiscaux de manière claire, pédagogique et adaptée à leur situation.

RÈGLES IMPORTANTES:
- Utilise un langage simple et accessible
- Donne des exemples concrets et chiffrés quand c'est pertinent
- Structure tes réponses avec des titres et listes pour une meilleure lisibilité
- Adapte le niveau de détail à la question posée
- Mentionne toujours les sources officielles (impots.gouv.fr, urssaf.fr) quand pertinent
- Si la question sort de ton domaine d'expertise fiscale/finance, indique-le poliment

DOMAINES D'EXPERTISE:
- Impôt sur le revenu (IR) et prélèvement à la source
- Régimes micro-entrepreneur vs réel
- Cotisations URSSAF et sociales
- TVA et seuils
- Statuts juridiques (EURL, SASU, SAS, SARL)
- Optimisation fiscale légale (PER, frais réels, niches fiscales)
- Patrimoine et investissements (PEA, assurance-vie, SCPI)
- Déclarations fiscales (2042, 2044, etc.)`;

    // Add comprehensive user context if available
    if (userContext) {
      const profileTypes = [];
      if (userContext.isEmployee) profileTypes.push('Salarié');
      if (userContext.isSelfEmployed) profileTypes.push('Indépendant');
      if (userContext.isRetired) profileTypes.push('Retraité');
      if (userContext.isInvestor) profileTypes.push('Investisseur');
      
      const objectiveLabels: Record<string, string> = {
        'reduce_ir': 'Réduire mon impôt sur le revenu',
        'optimize_charges': 'Optimiser mes charges sociales',
        'prepare_retirement': 'Préparer ma retraite',
        'build_wealth': 'Constituer un patrimoine',
        'protect_family': 'Protéger ma famille'
      };
      
      systemPrompt += `\n\nCONTEXTE UTILISATEUR DÉTAILLÉ:

**Profil:**
- Types de profil: ${profileTypes.length > 0 ? profileTypes.join(', ') : 'Non renseigné'}
- Statut professionnel: ${userContext.professionalStatus || 'Non renseigné'}
- Régime fiscal: ${userContext.fiscalStatus || 'Non renseigné'}
- Année de naissance: ${userContext.birthYear || 'Non renseignée'}
- Objectif principal: ${userContext.primaryObjective ? objectiveLabels[userContext.primaryObjective] || userContext.primaryObjective : 'Non renseigné'}

**Situation familiale:**
- Statut: ${userContext.familyStatus === 'single' ? 'Célibataire' : userContext.familyStatus === 'married' ? 'Marié(e)' : userContext.familyStatus === 'pacs' ? 'Pacsé(e)' : userContext.familyStatus === 'divorced' ? 'Divorcé(e)' : userContext.familyStatus === 'widowed' ? 'Veuf/Veuve' : 'Non renseigné'}
- Nombre d'enfants: ${userContext.childrenCount ?? 'Non renseigné'}

**Revenus:**
${userContext.isEmployee ? `- Salaire brut mensuel: ${userContext.grossMonthlySalary ? userContext.grossMonthlySalary + '€' : 'Non renseigné'}
- Salaire net mensuel: ${userContext.netMonthlySalary ? userContext.netMonthlySalary + '€' : 'Non renseigné'}
- Prime annuelle: ${userContext.annualBonus ? userContext.annualBonus + '€' : 'Non renseignée'}` : ''}
${userContext.isSelfEmployed ? `- Chiffre d'affaires annuel HT: ${userContext.annualRevenue ? userContext.annualRevenue + '€' : 'Non renseigné'}
- Entreprise: ${userContext.companyName || 'Non renseignée'}
- SIRET: ${userContext.siret || 'Non renseigné'}` : ''}
${userContext.isRetired ? `- Pension principale annuelle: ${userContext.mainPension ? userContext.mainPension + '€' : 'Non renseignée'}` : ''}

**Patrimoine et investissements:**
${userContext.hasInvestments ? `- PEA: ${userContext.peaBalance ? userContext.peaBalance + '€' : 'Non renseigné'}
- Assurance-vie: ${userContext.lifeInsuranceBalance ? userContext.lifeInsuranceBalance + '€' : 'Non renseigné'}` : '- Pas d\'investissements déclarés'}
${userContext.hasRentalIncome ? '- Revenus locatifs: Oui' : ''}

**Optimisations fiscales:**
${userContext.hasRealExpenses ? `- Frais réels déclarés: ${userContext.realExpensesAmount ? userContext.realExpensesAmount + '€' : 'Oui'}` : '- Utilise l\'abattement forfaitaire de 10%'}

INSTRUCTIONS IMPORTANTES:
- Adapte TOUTES tes réponses à ce profil spécifique
- Donne des conseils personnalisés basés sur la situation réelle de l'utilisateur
- Fais des calculs concrets avec les montants fournis quand c'est pertinent
- Suggère des optimisations adaptées à son profil et objectif principal
- Si des informations manquent pour donner un conseil précis, demande-les`;
    }

    // Add topic context if viewing a specific glossary term
    if (topic) {
      systemPrompt += `\n\nL'utilisateur consulte actuellement le sujet: "${topic}". Priorise les informations liées à ce thème.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Veuillez contacter le support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("glossary-ai error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
