import { defineStore } from "pinia";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface UserAppConfigRecord {
  id: number;
  platform: string;
  min_version: number;
  max_version: number;
  force_update?: boolean | null;
  max_force_note?: string | null;
  app_url?: string | null;
  image_links?: string | null;
  faq?: any;
  is_spanco_enabled?: boolean;
  is_feasibility_enabled?: boolean;
  office_location?: string | null;
  is_face_recognition_enabled?: boolean | null;
}

// Module-level reference to the RealtimeChannel outside Pinia state
// to prevent SSR serialization errors (Cannot stringify arbitrary non-POJOs)
let realtimeChannel: RealtimeChannel | null = null;

export const useSystemConfigStore = defineStore("systemConfig", {
  state: () => ({
    isSpancoEnabled: true,
    isFeasibilityEnabled: true,
    isFaceRecognitionEnabled: true,
    officeLocation: "28.560247, 77.199301",
    isLoading: false,
    initialized: false,
  }),

  getters: {
    canAccessSpanco: (state): boolean => state.isSpancoEnabled,
    canAccessFeasibility: (state): boolean => state.isFeasibilityEnabled,
    canUseFaceRecognition: (state): boolean => state.isFaceRecognitionEnabled,
    defaultOfficeLocation: (state): string => state.officeLocation || "28.560247, 77.199301",
    // Backward compatibility aliases
    defaultOfficeAddress: (state): string => state.officeLocation || "28.560247, 77.199301",
    officeAddress: (state): string => state.officeLocation || "28.560247, 77.199301",
  },

  actions: {
    applyConfig(config: Partial<UserAppConfigRecord>) {
      if (config.is_spanco_enabled !== undefined && config.is_spanco_enabled !== null) {
        this.isSpancoEnabled = Boolean(config.is_spanco_enabled);
      }
      if (config.is_feasibility_enabled !== undefined && config.is_feasibility_enabled !== null) {
        this.isFeasibilityEnabled = Boolean(config.is_feasibility_enabled);
      }
      if (config.is_face_recognition_enabled !== undefined && config.is_face_recognition_enabled !== null) {
        this.isFaceRecognitionEnabled = Boolean(config.is_face_recognition_enabled);
      }
      if (config.office_location !== undefined && config.office_location !== null && config.office_location.trim() !== "") {
        this.officeLocation = config.office_location.trim();
      }
    },

    async fetchConfig(supabaseClient?: any) {
      let supabase = supabaseClient;
      if (!supabase) {
        try {
          supabase = useSupabaseClient();
        } catch {
          // Fallback if called outside Nuxt setup context
        }
      }

      if (!supabase) return;

      this.isLoading = true;
      try {
        // Query user_app_config. Prefer 'web' platform if exists, else first configuration row (id = 1)
        const { data, error } = await supabase
          .from("user_app_config")
          .select("id, platform, is_spanco_enabled, is_feasibility_enabled, office_location, is_face_recognition_enabled")
          .order("id", { ascending: true });

        if (error) throw error;

        if (Array.isArray(data) && data.length > 0) {
          // If a 'web' row exists, use it; otherwise fallback to the primary row (id: 1)
          const target = data.find((row: any) => row.platform?.toLowerCase() === "web") || data[0];
          this.applyConfig(target);
        }

        this.initialized = true;

        // Setup realtime subscription strictly on the client
        if (import.meta.client) {
          this.setupRealtimeSubscription(supabase);
        }
      } catch (err: any) {
        console.error("Failed to load system config from user_app_config:", err);
      } finally {
        this.isLoading = false;
      }
    },

    setupRealtimeSubscription(supabase: any) {
      if (!import.meta.client || realtimeChannel || !supabase) return;

      try {
        realtimeChannel = supabase
          .channel("user_app_config_realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "user_app_config",
            },
            (payload: any) => {
              if (payload.new) {
                this.applyConfig(payload.new);
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscription for user_app_config could not be established:", err);
      }
    },
  },
});
