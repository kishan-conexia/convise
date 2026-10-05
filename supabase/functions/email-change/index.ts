import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight check
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { uid, newEmail } = await req.json();
    console.log("Received uid:", uid);
    console.log("Received newEmail:", newEmail);

    if (!uid || !newEmail) {
      return new Response(JSON.stringify({
        success: false,
        message: "Missing uid or newEmail"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update email + user_metadata.email
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(uid, {
      email: newEmail,
      user_metadata: { email: newEmail }  // <== This will go into user_metadata
    });

    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify({
        success: false,
        message: error.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Email updated for user ${uid}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (err: any) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({
      success: false,
      message: err.message || "Internal server error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
