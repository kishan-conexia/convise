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
    const { email, password, name, avatar_url } = await req.json();
    console.log("Creating user with email:", email);
    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        message: "Email and password are required"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        avatar_url,
        full_name: name,
        picture: avatar_url
      }
    });
    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify({
        success: false,
        message: error.message
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }
    return new Response(JSON.stringify({
      success: true,
      message: `User created with email ${email}`,
      uid: data?.user?.id
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err: any) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({
      success: false,
      message: err.message || "Internal server error"
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
