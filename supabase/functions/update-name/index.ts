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
    const { uid, name, full_name } = await req.json();
    console.log("Updating name for:", uid);

    if (!uid || (!name && !full_name)) {
      return new Response(JSON.stringify({
        success: false,
        message: "Missing uid or no fields to update"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const user_metadata: any = {};
    if (name) user_metadata.name = name;
    if (full_name) user_metadata.full_name = full_name;

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(uid, {
      user_metadata
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
      message: `Name updated for user ${uid}`,
      data
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
