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
  if (setupKey !== "walletiq-reset-2024") {
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

    // Reset super admin password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      "2a4fae56-4072-4e4a-a458-54ef453b9b6d", // superadmin@walletiq.app
      { password: "SuperAdmin@123" }
    );

    if (updateError) {
      throw updateError;
    }

    // Update must_change_password to false
    await supabase
      .from("admin_roles")
      .update({ must_change_password: false })
      .eq("user_id", "2a4fae56-4072-4e4a-a458-54ef453b9b6d");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset successfully",
        credentials: {
          superAdmin: {
            email: "superadmin@walletiq.app",
            password: "SuperAdmin@123"
          }
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
