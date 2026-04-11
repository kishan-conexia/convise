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
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
}

export const useUserProfileStore = defineStore("userProfile", {
  state: (): UserProfileState => ({
    profile: null,
    managedDepartments: [],
    isManager: false,
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
      const allowedDepartments = new Set([1, 30, 301, 302, 303]);
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

    // User initials for avatar
    userInitials: (state): string => {
      const name = state.profile?.full_name || state.profile?.email || "";
      return name.charAt(0).toUpperCase();
    },
  },

  actions: {
    async fetchUserProfile(userId?: string) {
      if (this.isLoading) return;

      const supabase = useSupabaseClient();
      const user = useSupabaseUser();

      if (!user.value && !userId) {
        this.error = "No user found";
        return;
      }

      const targetUserId = userId || user.value!.id;

      this.isLoading = true;
      this.error = null;

      try {
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

    async refreshManagedDepartments() {
      if (!this.profile) return;

      const supabase = useSupabaseClient();

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Error refreshing managed departments:", error);
        this.error = error.message || "Failed to refresh departments";
      }
    },

    clearProfile() {
      this.profile = null;
      this.managedDepartments = [];
      this.isManager = false;
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
