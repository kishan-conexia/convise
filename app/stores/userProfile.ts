// stores/userProfile.ts
import { defineStore } from "pinia";

export interface UserProfile {
  id: string;
  full_name: string | null;
  employee_code: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  ov_username: string | null;
  ov_password: string | null;
  department: number | null;
  is_active: boolean;
  app_access: boolean | null;
  geofencing: boolean | null;
  face_recognition?: boolean | null;
  date_of_joining: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManagedDepartment {
  id: number;
  name: string;
  code: string;
  level: number;
}

export interface UserProfileState {
  profile: UserProfile | null;
  managedDepartments: ManagedDepartment[];
  isManager: boolean;
  canAccessAdminPanel: boolean | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
}

export const useUserProfileStore = defineStore("userProfile", {
  state: (): UserProfileState => ({
    profile: null,
    managedDepartments: [],
    isManager: false,
    canAccessAdminPanel: null,
    isLoading: false,
    error: null,
    initialized: false,
  }),

  getters: {
    // Basic profile getters
    userName: (state): string => {
      return state.profile?.full_name || "User";
    },

    userEmail: (state): string => {
      return state.profile?.email || "";
    },

    empCode: (state): string => {
      return state.profile?.employee_code || "";
    },

    userAvatar: (state): string => {
      return state.profile?.avatar_url || "";
    },

    ovUsername: (state): string => {
      return state.profile?.ov_username || "";
    },

    ovPassword: (state): string => {
      return state.profile?.ov_password || "";
    },

    joiningDate: (state): string | null => {
      return state.profile?.date_of_joining || null;
    },

    departmentId: (state): number | null => {
      return state.profile?.department || null;
    },

    // Manager-related getters
    managedDepartmentIds: (state): number[] => {
      return state.managedDepartments.map((dept) => dept.id);
    },

    canAccessMonthlyAttendance: (state): boolean => {
      const allowedDepartments = new Set([1, 20, 30, 301, 302, 303]);
      return state.managedDepartments.some((dept) =>
        allowedDepartments.has(dept.id),
      );
    },

    canAccessAttendanceComment: (state): boolean => {
      const allowedDepartments = new Set([1]);
      return state.managedDepartments.some((dept) =>
        allowedDepartments.has(dept.id),
      );
    },

    showManagerTools: (state): boolean => {
      return state.isManager;
    },

    // Network monitor access
    hasNetworkMonitorAccess: (state): boolean => {
      return !!(state.profile?.ov_username && state.profile?.ov_password);
    },

    // App access
    hasAppAccess: (state): boolean => {
      return state.profile?.app_access ?? true;
    },

    // only manager of these departments is allowed
    canAccessLMS: (state): boolean => {
      const allowedDepartments = new Set([1, 20, 2013]);
      return state.managedDepartments.some((dept) =>
        allowedDepartments.has(dept.id),
      );
    },

    // Matches all_leads_edit_access() RLS function — dept 1 (CEO) or dept 20 (Sales Head)
    canEditAllLeads: (state): boolean => {
      const editDepartments = new Set([1, 20]);
      return state.managedDepartments.some((dept) =>
        editDepartments.has(dept.id),
      );
    },

    // Admin portal access (verified via access_admin_panel RPC: Dept 303, 105, 1)
    isAdmin: (state): boolean => {
      if (typeof state.canAccessAdminPanel === "boolean") {
        return state.canAccessAdminPanel;
      }
      // Fallback matching public.access_admin_panel() (departments 303, 105, 1)
      const adminDepartments = new Set([303, 105, 1]);
      return state.managedDepartments.some((dept) =>
        adminDepartments.has(dept.id),
      );
    },

    // User initials for avatar
    userInitials: (state): string => {
      const name = state.profile?.full_name || state.profile?.email || "";
      return name.charAt(0).toUpperCase();
    },
  },

  actions: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async fetchUserProfile(userId?: string, supabaseClient?: any) {
      if (this.isLoading) return;

      let supabase = supabaseClient;
      if (!supabase) {
        try {
          supabase = useSupabaseClient();
        } catch {
          // Fallback if called outside Nuxt setup context
        }
      }

      let user = null;
      try {
        const authUser = useSupabaseUser();
        user = authUser.value;
      } catch {
        // Fallback if called outside Nuxt setup context
      }

      if (!user && !userId) {
        this.error = "No user found";
        return;
      }

      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        this.error = "No user ID found";
        return;
      }

      this.isLoading = true;
      this.error = null;

      try {
        if (!supabase) {
          throw new Error("Supabase client is not available.");
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", targetUserId)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
          this.error = "Profile not found. Please contact your administrator.";
          return;
        }

        this.profile = profile;

        // Fetch managed departments
        const { data: managedDepts, error: deptError } = await supabase
          .from("departments")
          .select("id, name, code, level")
          .eq("manager_id", targetUserId)
          .eq("is_active", true)
          .order("level", { ascending: true });

        if (deptError) throw deptError;

        this.managedDepartments = managedDepts || [];
        this.isManager = this.managedDepartments.length > 0;
        this.initialized = true;

        // Check admin panel access via access_admin_panel() RPC reusing supabase instance
        await this.checkAdminAccess(supabase, false);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Error fetching user profile:", error);
        this.error = error.message || "Failed to fetch user profile";
      } finally {
        this.isLoading = false;
      }
    },

    async updateProfile(updates: Partial<UserProfile>) {
      if (!this.profile) return;

      const supabase = useSupabaseClient();
      this.isLoading = true;
      this.error = null;

      try {
        const { data, error } = await supabase
          .from("profiles")
          // @ts-expect-error - Supabase DB types not generated; 'profiles' table type resolves to never
          .update(updates)
          .eq("id", this.profile.id)
          .select()
          .single();

        if (error) throw error;

        this.profile = { ...this.profile, ...(data as Partial<UserProfile>) };
      } catch (error: any) {
        console.error("Error updating profile:", error);
        this.error = error.message || "Failed to update profile";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async refreshManagedDepartments(supabaseClient?: any) {
      if (!this.profile) return;

      let supabase = supabaseClient;
      if (!supabase) {
        try {
          supabase = useSupabaseClient();
        } catch {
          // Fallback if called outside Nuxt setup context
        }
      }
      if (!supabase) return;

      try {
        const { data: managedDepts, error } = await supabase
          .from("departments")
          .select("id, name, code, level")
          .eq("manager_id", this.profile.id)
          .eq("is_active", true)
          .order("level", { ascending: true });

        if (error) throw error;

        this.managedDepartments = managedDepts || [];
        this.isManager = this.managedDepartments.length > 0;
        await this.checkAdminAccess(supabase, true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Error refreshing managed departments:", error);
        this.error = error.message || "Failed to refresh departments";
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async checkAdminAccess(supabaseClient?: any, forceRefresh = false): Promise<boolean> {
      if (!forceRefresh && typeof this.canAccessAdminPanel === "boolean") {
        return this.canAccessAdminPanel;
      }

      let supabase = supabaseClient;
      if (!supabase) {
        try {
          supabase = useSupabaseClient();
        } catch (err) {
          console.warn("Could not get supabase client for checkAdminAccess:", err);
        }
      }

      if (supabase) {
        try {
          const { data, error } = await (supabase as any).rpc("access_admin_panel");
          if (!error && typeof data === "boolean") {
            this.canAccessAdminPanel = data;
            return data;
          }
          if (error) {
            console.warn("access_admin_panel RPC warning:", error.message || error);
          }
        } catch (err) {
          console.warn("access_admin_panel RPC exception:", err);
        }
      }

      // Fallback matching public.access_admin_panel(): Dept 303, 105, 1
      const allowedDepts = new Set([303, 105, 1]);
      const fallbackAccess = this.managedDepartments.some((d) => allowedDepts.has(d.id));
      this.canAccessAdminPanel = fallbackAccess;
      return fallbackAccess;
    },

    clearProfile() {
      this.profile = null;
      this.managedDepartments = [];
      this.isManager = false;
      this.canAccessAdminPanel = null;
      this.error = null;
      this.initialized = false;
    },

    // Initialize store - call this once on app startup
    async initialize() {
      if (this.initialized) return;

      const user = useSupabaseUser();
      if (user.value) {
        await this.fetchUserProfile(user.value.id);
      }
    },
  },
});
