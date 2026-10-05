import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OnboardPayload {
  email: string;
  password: string;
  fullName: string;
  avatarUrl?: string | null;
  profile?: {
    employee_code?: string | null;
    phone?: string | null;
    department?: number | null;
    position?: number | null;
    date_of_joining?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    marital_status?: string | null;
    employment_type?: string | null;
    current_address?: string | null;
    app_access?: boolean;
    web_access?: boolean;
    geofencing?: boolean;
    approval_levels?: number;
    is_active?: boolean;
  };
  schedule?: {
    start_time: string;
    end_time: string;
    weekdays: string[];
    punch_in_grace?: number;
    shift_pattern?: string;
    schedule_type?: string;
    min_work_hours?: string;
    max_work_hours?: string;
    office_location?: string;
    office_radius?: number;
    home_location?: string | null;
    home_radius?: number;
    work_location_names?: string | null;
    work_location_radius?: number;
    wfm_allowed?: boolean;
  };
  leaveAllocations?: Array<{
    leaveTypeId: number;
    allocatedDays: number;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  let createdUserId: string | null = null;

  try {
    const body: OnboardPayload = await req.json();
    const { email, password, fullName, avatarUrl, profile, schedule, leaveAllocations } = body;

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email, password, and full name are required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Starting employee onboarding for: ${email} (${fullName})`);

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: fullName,
        full_name: fullName,
        avatar_url: avatarUrl || null,
        picture: avatarUrl || null,
      },
    });

    if (authError || !authData?.user) {
      console.error("Auth creation failed:", authError);
      return new Response(
        JSON.stringify({
          success: false,
          message: authError?.message || "Failed to create user auth account",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    createdUserId = authData.user.id;
    console.log(`Auth user created successfully with ID: ${createdUserId}`);

    // 2. Upsert Profile details (using service role to bypass RLS)
    const profilePayload = {
      id: createdUserId,
      email,
      full_name: fullName,
      employee_code: profile?.employee_code || null,
      phone: profile?.phone || null,
      department: profile?.department || null,
      position: profile?.position || null,
      date_of_joining: profile?.date_of_joining || null,
      date_of_birth: profile?.date_of_birth || null,
      gender: profile?.gender || "Male",
      marital_status: profile?.marital_status || "Single",
      employment_type: profile?.employment_type || "Full Time",
      current_address: profile?.current_address || null,
      app_access: profile?.app_access ?? true,
      web_access: profile?.web_access ?? false,
      geofencing: profile?.geofencing ?? true,
      approval_levels: profile?.approval_levels ?? 1,
      is_active: profile?.is_active ?? true,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(profilePayload);

    if (profileError) {
      console.error("Profile upsert failed:", profileError);
      throw new Error(`Profile setup failed: ${profileError.message}`);
    }

    // 3. Insert Work Schedule (if provided)
    if (schedule) {
      const formatTime = (t: string) => {
        if (!t) return "10:00:00";
        return t.split(":").length === 2 ? `${t}:00` : t;
      };

      const schedulePayload = {
        employee_id: createdUserId,
        start_time: formatTime(schedule.start_time),
        end_time: formatTime(schedule.end_time),
        weekdays: schedule.weekdays && schedule.weekdays.length > 0
          ? schedule.weekdays
          : ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        punch_in_grace: schedule.punch_in_grace ?? 12,
        shift_pattern: schedule.shift_pattern || "day",
        schedule_type: schedule.schedule_type || "fixed",
        min_work_hours: String(schedule.min_work_hours || "8"),
        max_work_hours: String(schedule.max_work_hours || "12"),
        office_location: schedule.office_location || "28.560247, 77.199301",
        office_radius: schedule.office_radius ?? 100,
        home_location: schedule.home_location || null,
        home_radius: schedule.home_radius ?? 100,
        work_location_names: schedule.work_location_names || null,
        work_location_radius: schedule.work_location_radius ?? 100,
        wfm_allowed: schedule.wfm_allowed ?? false,
        updated_at: new Date().toISOString(),
      };

      const { error: scheduleError } = await supabaseAdmin
        .from("work_schedules")
        .insert(schedulePayload);

      if (scheduleError) {
        console.error("Work schedule insert failed:", scheduleError);
        throw new Error(`Schedule setup failed: ${scheduleError.message}`);
      }
    }

    // 4. Insert Initial Leave Balances (if provided)
    if (leaveAllocations && leaveAllocations.length > 0) {
      const currentYear = new Date().getFullYear();
      const leaveRows = leaveAllocations.map((item) => ({
        employee_id: createdUserId,
        leave_type_id: item.leaveTypeId,
        calendar_year: currentYear,
        allocated_days: item.allocatedDays,
        used_days: 0,
        pending_days: 0,
        carried_forward_days: 0,
        encashed_days: 0,
        expired_days: 0,
      }));

      const { error: leaveError } = await supabaseAdmin
        .from("employee_leave_balances")
        .insert(leaveRows);

      if (leaveError) {
        console.error("Leave balances insert failed:", leaveError);
        throw new Error(`Leave quota allocation failed: ${leaveError.message}`);
      }
    }

    console.log(`Onboarding completed successfully for: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Employee ${fullName} onboarded successfully`,
        uid: createdUserId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("Onboarding transaction error:", err);

    // Rollback: if auth user was created but subsequent operations failed, delete the auth user
    if (createdUserId) {
      console.warn(`Rolling back created auth user ${createdUserId}...`);
      await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch((delErr) => {
        console.error("Rollback deleteUser failed:", delErr);
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: err.message || "Internal server error during onboarding",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
