import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for a setup key to prevent unauthorized access
  const url = new URL(req.url);
  const setupKey = url.searchParams.get("key");
  if (setupKey !== "walletiq-setup-2024") {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check if super admin already exists
    const { data: existingAdmins } = await supabase
      .from("admin_roles")
      .select("id")
      .eq("role", "super_admin")
      .limit(1);

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(
        JSON.stringify({ error: "Super admin already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the super admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "superadmin@walletiq.app",
      password: "super123",
      email_confirm: true,
    });

    if (authError) {
      throw authError;
    }

    // Add to admin_roles table
    const { error: roleError } = await supabase
      .from("admin_roles")
      .insert({
        user_id: authData.user.id,
        role: "super_admin",
        must_change_password: true,
      });

    if (roleError) {
      // Cleanup: delete the auth user if role insertion fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw roleError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Super admin created successfully",
        credentials: {
          email: "superadmin@walletiq.app",
          password: "super123 (must change on first login)"
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
