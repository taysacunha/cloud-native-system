import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Find collaborators whose notice period (aviso prévio) ended today or before
    const { data: expiredNotices, error: fetchError } = await supabase
      .from("ferias_colaboradores")
      .select("id, nome, aviso_previo_fim")
      .eq("status", "ativo")
      .not("aviso_previo_fim", "is", null)
      .lte("aviso_previo_fim", today);

    if (fetchError) {
      console.error("Error fetching expired notices:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!expiredNotices || expiredNotices.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired notices found", deactivated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const deactivatedIds: string[] = [];
    const errors: string[] = [];

    for (const collaborator of expiredNotices) {
      // Deactivate the collaborator
      const { error: updateError } = await supabase
        .from("ferias_colaboradores")
        .update({ 
          status: "inativo",
          updated_at: new Date().toISOString()
        })
        .eq("id", collaborator.id);

      if (updateError) {
        console.error(`Error deactivating ${collaborator.nome}:`, updateError);
        errors.push(`${collaborator.nome}: ${updateError.message}`);
      } else {
        deactivatedIds.push(collaborator.id);
        console.log(`Deactivated: ${collaborator.nome} (notice ended: ${collaborator.aviso_previo_fim})`);

        // Log the action in audit table
        await supabase.from("ferias_audit_logs").insert({
          action: "DEACTIVATE_BY_NOTICE",
          entity_type: "ferias_colaboradores",
          entity_id: collaborator.id,
          details: `Colaborador ${collaborator.nome} desativado automaticamente pelo término do aviso prévio em ${collaborator.aviso_previo_fim}`,
          new_data: { status: "inativo" },
          old_data: { status: "ativo", aviso_previo_fim: collaborator.aviso_previo_fim },
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Deactivated ${deactivatedIds.length} collaborators`,
        deactivated: deactivatedIds.length,
        deactivatedIds,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
