// stores/feasibility.ts
import { defineStore } from "pinia";
import type {
  FeasibilityRequest,
  FeasibilityServiceLocation,
  FeasibilityServiceRequirements,
  StatusHistoryEntry,
} from "~/utils/feasibility";
import { FeasibilityStatus } from "~/utils/feasibility";

export const useFeasibilityStore = defineStore("feasibility", {
  state: () => ({
    allRequests: [] as FeasibilityRequest[],
    requestsByLead: {} as Record<number, FeasibilityRequest[]>,
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    getRequestsForLead: (state) => {
      return (leadId: number): FeasibilityRequest[] => {
        return state.requestsByLead[leadId] || [];
      };
    },

    pendingRequests: (state): FeasibilityRequest[] => {
      return state.allRequests.filter(
        (r) =>
          r.status === FeasibilityStatus.PENDING ||
          r.status === FeasibilityStatus.UNDER_REVIEW
      );
    },

    stats: (state) => {
      const total = state.allRequests.length;
      const pending = state.allRequests.filter(
        (r) => r.status === FeasibilityStatus.PENDING
      ).length;
      const underReview = state.allRequests.filter(
        (r) => r.status === FeasibilityStatus.UNDER_REVIEW
      ).length;
      const approved = state.allRequests.filter(
        (r) => r.status === FeasibilityStatus.APPROVED
      ).length;
      const rejected = state.allRequests.filter(
        (r) => r.status === FeasibilityStatus.REJECTED
      ).length;
      const cancelled = state.allRequests.filter(
        (r) => r.status === FeasibilityStatus.CANCELLED
      ).length;

      const totalCapex = state.allRequests.reduce((sum, r) => {
        return sum + (Number(r.estimated_capex) || 0);
      }, 0);

      const totalOpex = state.allRequests.reduce((sum, r) => {
        return sum + (Number(r.estimated_opex) || 0);
      }, 0);

      const approvalRate =
        total - cancelled > 0
          ? Math.round((approved / (total - cancelled)) * 100)
          : 0;

      return {
        total,
        pending,
        underReview,
        approved,
        rejected,
        cancelled,
        totalCapex,
        totalOpex,
        approvalRate,
      };
    },
  },

  actions: {
    /**
     * Fetch all feasibility requests across the organization
     */
    async fetchAllRequests() {
      const supabase = useSupabaseClient();
      this.isLoading = true;
      this.error = null;

      try {
        const { data, error } = await supabase
          .from("feasibility_requests")
          .select(
            `
            *,
            requester_profile:requested_by (
              full_name,
              employee_code,
              avatar_url
            ),
            reviewer_profile:reviewed_by (
              full_name,
              employee_code,
              avatar_url
            ),
            lead:lead_id (
              id,
              lead_number,
              current_stage,
              status,
              priority,
              customer_info
            )
          `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        const rawList = (data as unknown as FeasibilityRequest[]) || [];
        // Map convenience getters on lead for seamless access
        for (const req of rawList) {
          if (req.lead) {
            req.lead.customer_name =
              req.lead.customer_info?.name ||
              req.lead.customer_info?.company_name ||
              `Lead #${req.lead.lead_number}`;
            req.lead.company_name = req.lead.customer_info?.company_name || null;
            req.lead.phone = req.lead.customer_info?.phone || null;
            req.lead.email = req.lead.customer_info?.email || null;
          }
        }

        this.allRequests = rawList;

        // Also update requestsByLead index
        const byLead: Record<number, FeasibilityRequest[]> = {};
        for (const req of this.allRequests) {
          const list = byLead[req.lead_id] || (byLead[req.lead_id] = []);
          list.push(req);
        }
        this.requestsByLead = byLead;
      } catch (err: any) {
        console.error("Error fetching feasibility requests:", err);
        this.error = err.message || "Failed to fetch feasibility requests";
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fetch all feasibility requests for a specific lead.
     */
    async fetchRequestsForLead(leadId: number) {
      const supabase = useSupabaseClient();
      this.isLoading = true;
      this.error = null;

      try {
        const { data, error } = await supabase
          .from("feasibility_requests")
          .select(
            `
            *,
            requester_profile:requested_by (
              full_name,
              employee_code,
              avatar_url
            ),
            reviewer_profile:reviewed_by (
              full_name,
              employee_code,
              avatar_url
            )
          `
          )
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        this.requestsByLead[leadId] =
          (data as unknown as FeasibilityRequest[]) || [];
      } catch (error: any) {
        console.error("Error fetching feasibility requests for lead:", error);
        this.error =
          error.message || "Failed to fetch feasibility requests for lead";
        this.requestsByLead[leadId] = [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Create or reuse feasibility request using Supabase RPC
     */
    async createRequest(payload: {
      leadId: number;
      requestedBy: string;
      requestingDepartment: number;
      serviceLocation: FeasibilityServiceLocation;
      serviceRequirements: FeasibilityServiceRequirements;
    }) {
      const supabase = useSupabaseClient();
      this.isLoading = true;
      this.error = null;

      try {
        // Try RPC first (matches Flutter app)
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
          "create_or_reuse_feasibility_request",
          {
            p_lead_id: payload.leadId,
            p_requested_by: payload.requestedBy,
            p_requesting_department: payload.requestingDepartment,
            p_service_location: payload.serviceLocation,
            p_service_requirements: payload.serviceRequirements,
          }
        );

        if (rpcError) {
          console.warn("RPC failed, falling back to direct insert:", rpcError);
          // Fallback direct insert
          const now = new Date().toISOString();
          const { data: insertData, error: insertError } = await (supabase as any)
            .from("feasibility_requests")
            .insert({
              lead_id: payload.leadId,
              requested_by: payload.requestedBy,
              requesting_department: payload.requestingDepartment,
              requested_at: now,
              created_at: now,
              updated_at: now,
              status: FeasibilityStatus.PENDING,
              service_location: payload.serviceLocation,
              service_requirements: payload.serviceRequirements,
              status_history: [
                {
                  event: "created",
                  status: FeasibilityStatus.PENDING,
                  note: "Feasibility request initiated from Admin Portal",
                  timestamp: now,
                  requested_by: payload.requestedBy,
                  requesting_department: payload.requestingDepartment,
                },
              ],
            })
            .select()
            .single();

          if (insertError) throw insertError;
          await this.fetchAllRequests();
          return insertData;
        }

        await this.fetchAllRequests();
        return rpcData;
      } catch (err: any) {
        console.error("Failed to create feasibility request:", err);
        this.error = err.message || "Failed to create feasibility request";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Start reviewing a request (moves to under_review)
     */
    async startReview(requestId: number, reviewerId: string) {
      const supabase = useSupabaseClient();
      const now = new Date().toISOString();

      try {
        const req = this.allRequests.find((r) => r.id === requestId);
        const history: StatusHistoryEntry[] = req?.status_history ? [...req.status_history] : [];
        history.push({
          event: "review_started",
          status: FeasibilityStatus.UNDER_REVIEW,
          note: "Review started by administrator/manager",
          timestamp: now,
          requested_by: reviewerId,
        });

        const { error } = await (supabase as any)
          .from("feasibility_requests")
          .update({
            status: FeasibilityStatus.UNDER_REVIEW,
            reviewed_by: reviewerId,
            reviewed_at: now,
            updated_at: now,
            status_history: history,
          })
          .eq("id", requestId);

        if (error) throw error;
        await this.fetchAllRequests();
      } catch (err: any) {
        console.error("Failed to start review:", err);
        throw err;
      }
    },

    /**
     * Save draft review progress without final approval/rejection
     */
    async saveDraft(
      requestId: number,
      draftData: Partial<FeasibilityRequest>,
      reviewerId: string
    ) {
      const supabase = useSupabaseClient();
      const now = new Date().toISOString();

      try {
        const req = this.allRequests.find((r) => r.id === requestId);
        const history: StatusHistoryEntry[] = req?.status_history ? [...req.status_history] : [];
        history.push({
          event: "draft_saved",
          status: FeasibilityStatus.UNDER_REVIEW,
          note: "Evaluation draft updated",
          timestamp: now,
          requested_by: reviewerId,
        });

        const updates = {
          ...draftData,
          status: FeasibilityStatus.UNDER_REVIEW,
          reviewed_by: reviewerId,
          reviewed_at: now,
          updated_at: now,
          status_history: history,
        };

        const { error } = await (supabase as any)
          .from("feasibility_requests")
          .update(updates)
          .eq("id", requestId);

        if (error) throw error;
        await this.fetchAllRequests();
      } catch (err: any) {
        console.error("Failed to save draft:", err);
        throw err;
      }
    },

    /**
     * Approve feasibility request
     */
    async approveFeasibility(
      requestId: number,
      payload: {
        remarks: string;
        primaryRoute?: any;
        secondaryRoute?: any;
        siteSurvey?: any;
        operationalCosts?: any;
        estimatedCapex?: number;
        estimatedOpex?: number;
        isCommerciallyViable?: boolean;
        commercialRemarks?: string;
        estimatedInstallationDays?: number;
        expectedCompletionDate?: string;
      },
      reviewerId: string
    ) {
      const supabase = useSupabaseClient();
      const now = new Date().toISOString();

      try {
        const req = this.allRequests.find((r) => r.id === requestId);
        const history: StatusHistoryEntry[] = req?.status_history ? [...req.status_history] : [];
        history.push({
          event: "approved",
          status: FeasibilityStatus.APPROVED,
          note: payload.remarks || "Feasibility approved",
          timestamp: now,
          requested_by: reviewerId,
        });

        const updates: any = {
          status: FeasibilityStatus.APPROVED,
          is_feasible: true,
          feasibility_remarks: payload.remarks,
          reviewed_by: reviewerId,
          reviewed_at: now,
          updated_at: now,
          status_history: history,
        };

        if (payload.primaryRoute !== undefined) updates.primary_route = payload.primaryRoute;
        if (payload.secondaryRoute !== undefined) updates.secondary_route = payload.secondaryRoute;
        if (payload.siteSurvey !== undefined) updates.site_survey = payload.siteSurvey;
        if (payload.operationalCosts !== undefined) updates.operational_costs = payload.operationalCosts;
        if (payload.estimatedCapex !== undefined) updates.estimated_capex = payload.estimatedCapex;
        if (payload.estimatedOpex !== undefined) updates.estimated_opex = payload.estimatedOpex;
        if (payload.isCommerciallyViable !== undefined) updates.is_commercially_viable = payload.isCommerciallyViable;
        if (payload.commercialRemarks !== undefined) updates.commercial_remarks = payload.commercialRemarks;
        if (payload.estimatedInstallationDays !== undefined) updates.estimated_installation_days = payload.estimatedInstallationDays;
        if (payload.expectedCompletionDate !== undefined) updates.expected_completion_date = payload.expectedCompletionDate;

        const { error } = await (supabase as any)
          .from("feasibility_requests")
          .update(updates)
          .eq("id", requestId);

        if (error) throw error;
        await this.fetchAllRequests();
      } catch (err: any) {
        console.error("Failed to approve feasibility:", err);
        throw err;
      }
    },

    /**
     * Reject feasibility request
     */
    async rejectFeasibility(
      requestId: number,
      reason: string,
      reviewerId: string,
      additionalData?: Partial<FeasibilityRequest>
    ) {
      const supabase = useSupabaseClient();
      const now = new Date().toISOString();

      try {
        const req = this.allRequests.find((r) => r.id === requestId);
        const history: StatusHistoryEntry[] = req?.status_history ? [...req.status_history] : [];
        history.push({
          event: "rejected",
          status: FeasibilityStatus.REJECTED,
          note: reason || "Feasibility rejected",
          timestamp: now,
          requested_by: reviewerId,
        });

        const updates: any = {
          ...(additionalData || {}),
          status: FeasibilityStatus.REJECTED,
          is_feasible: false,
          feasibility_remarks: reason,
          reviewed_by: reviewerId,
          reviewed_at: now,
          updated_at: now,
          status_history: history,
        };

        const { error } = await (supabase as any)
          .from("feasibility_requests")
          .update(updates)
          .eq("id", requestId);

        if (error) throw error;
        await this.fetchAllRequests();
      } catch (err: any) {
        console.error("Failed to reject feasibility:", err);
        throw err;
      }
    },

    /**
     * Cancel feasibility request
     */
    async cancelRequest(requestId: number, reason: string = "Cancelled by admin") {
      const supabase = useSupabaseClient();
      const now = new Date().toISOString();

      try {
        const req = this.allRequests.find((r) => r.id === requestId);
        const history: StatusHistoryEntry[] = req?.status_history ? [...req.status_history] : [];
        history.push({
          event: "cancelled",
          status: FeasibilityStatus.CANCELLED,
          note: reason,
          timestamp: now,
        });

        const { error } = await (supabase as any)
          .from("feasibility_requests")
          .update({
            status: FeasibilityStatus.CANCELLED,
            feasibility_remarks: reason,
            updated_at: now,
            status_history: history,
          })
          .eq("id", requestId);

        if (error) throw error;
        await this.fetchAllRequests();
      } catch (err: any) {
        console.error("Failed to cancel feasibility request:", err);
        throw err;
      }
    },

    /**
     * Delete feasibility request (admin only)
     */
    async deleteRequest(requestId: number) {
      const supabase = useSupabaseClient();

      try {
        const { error } = await (supabase as any)
          .from("feasibility_requests")
          .delete()
          .eq("id", requestId);

        if (error) throw error;
        this.allRequests = this.allRequests.filter((r) => r.id !== requestId);
      } catch (err: any) {
        console.error("Failed to delete feasibility request:", err);
        throw err;
      }
    },
  },
});
