import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user with their token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Utilisateur non trouvé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Use service role to delete all user data and the auth user
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete user data from all tables
    const tables = [
      "notifications",
      "tax_scan_history",
      "monthly_revenue",
      "invoices",
      "urssaf_contributions",
      "simulation_results",
      "sale_data",
      "tax_config",
      "operating_costs",
      "rental_income_data",
      "financing_data",
      "acquisition_data",
      "owner_occupier_data",
    ];

    // Delete project-related data first (via project ownership)
    const { data: projects } = await adminClient
      .from("real_estate_projects")
      .select("id")
      .eq("user_id", userId);

    if (projects && projects.length > 0) {
      const projectIds = projects.map((p) => p.id);
      const projectTables = [
        "simulation_results",
        "sale_data",
        "tax_config",
        "operating_costs",
        "rental_income_data",
        "financing_data",
        "acquisition_data",
        "owner_occupier_data",
      ];
      for (const table of projectTables) {
        await adminClient.from(table).delete().in("project_id", projectIds);
      }
    }

    // Delete user-owned data
    await adminClient.from("real_estate_projects").delete().eq("user_id", userId);
    await adminClient.from("notifications").delete().eq("user_id", userId);
    await adminClient.from("tax_scan_history").delete().eq("user_id", userId);
    await adminClient.from("monthly_revenue").delete().eq("user_id", userId);
    await adminClient.from("invoices").delete().eq("user_id", userId);
    await adminClient.from("urssaf_contributions").delete().eq("user_id", userId);
    await adminClient.from("profiles").delete().eq("user_id", userId);

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Erreur lors de la suppression du compte" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Erreur interne" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
