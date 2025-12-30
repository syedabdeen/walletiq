import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const results: { superAdmin?: string; testUser?: string } = {};

    // ========== SUPER ADMIN SETUP ==========
    const superAdminEmail = "superadmin@walletiq.app";
    const superAdminPassword = "Admin@123";

    // Check if super admin user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingSuperAdmin = existingUsers?.users?.find(u => u.email === superAdminEmail);

    if (existingSuperAdmin) {
      // Reset password for existing super admin
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingSuperAdmin.id,
        { password: superAdminPassword }
      );
      if (updateError) throw updateError;

      // Ensure admin role exists
      await supabase
        .from("admin_roles")
        .upsert({
          user_id: existingSuperAdmin.id,
          role: "super_admin",
          must_change_password: false,
        }, { onConflict: "user_id" });

      results.superAdmin = `Password reset for ${superAdminEmail}`;
    } else {
      // Create new super admin
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: superAdminEmail,
        password: superAdminPassword,
        email_confirm: true,
      });
      if (authError) throw authError;

      await supabase
        .from("admin_roles")
        .insert({
          user_id: authData.user.id,
          role: "super_admin",
          must_change_password: false,
        });

      results.superAdmin = `Created ${superAdminEmail}`;
    }

    // ========== TEST USER SETUP ==========
    const testUserEmail = "testuser@walletiq.app";
    const testUserPassword = "Test@123";

    const existingTestUser = existingUsers?.users?.find(u => u.email === testUserEmail);

    let testUserId: string;

    if (existingTestUser) {
      // Reset password for existing test user
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingTestUser.id,
        { password: testUserPassword }
      );
      if (updateError) throw updateError;
      testUserId = existingTestUser.id;
      results.testUser = `Password reset for ${testUserEmail}`;
    } else {
      // Create new test user
      const { data: testAuthData, error: testAuthError } = await supabase.auth.admin.createUser({
        email: testUserEmail,
        password: testUserPassword,
        email_confirm: true,
        user_metadata: { full_name: "Test User" }
      });
      if (testAuthError) throw testAuthError;
      testUserId = testAuthData.user.id;
      results.testUser = `Created ${testUserEmail}`;
    }

    // Get yearly plan for permanent subscription
    const { data: yearlyPlan } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("plan_type", "yearly")
      .eq("is_active", true)
      .single();

    if (yearlyPlan) {
      // Cancel any existing subscriptions
      await supabase
        .from("user_subscriptions")
        .update({ status: "cancelled" })
        .eq("user_id", testUserId)
        .eq("status", "active");

      // Create 100-year subscription (effectively permanent)
      await supabase
        .from("user_subscriptions")
        .insert({
          user_id: testUserId,
          plan_id: yearlyPlan.id,
          plan_type: "yearly",
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: "active",
          amount_paid: 0,
          is_renewal: false,
        });

      results.testUser += " with permanent subscription";
    }

    console.log("Setup completed successfully:", results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Setup completed successfully",
        results,
        credentials: {
          superAdmin: {
            email: superAdminEmail,
            password: superAdminPassword,
            loginUrl: "/admin/login"
          },
          testUser: {
            email: testUserEmail,
            password: testUserPassword,
            loginUrl: "/auth"
          }
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Setup error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
