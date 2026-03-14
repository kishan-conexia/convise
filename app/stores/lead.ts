// stores/lead.ts
import { defineStore } from "pinia";

// ✅ No imports needed! All types are auto-imported from /utils/lead.ts

export interface LeadState {
  leads: SpancoLead[];
  stageHistory: Record<number, SpancoStageHistory[]>;
  filters: LeadFilters;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    perPage: number;
    total: number;
  };
  selectedLeadId: number | null;
  dateFilter:
    | "all"
    | "overdue"
    | "thisweek"
    | "nextweek"
    | "thismonth"
    | "later";
}

export const useLeadStore = defineStore("lead", {
  state: (): LeadState => ({
    leads: [],
    stageHistory: {},
    filters: {
      search: "",
      stage: undefined,
      status: undefined,
      priority: undefined,
    },
    isLoading: false,
    isLoadingMore: false,
    hasMore: true,
    error: null,
    pagination: {
      currentPage: 1,
      perPage: 20,
      total: 0,
    },
    selectedLeadId: null,
    dateFilter: "all",
  }),

  getters: {
    // Date range calculations
    dateRanges(): any {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // This week (Monday to Sunday)
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      // Next week
      const nextMonday = new Date(sunday);
      nextMonday.setDate(sunday.getDate() + 1);
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextMonday.getDate() + 6);

      // This month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return {
        today,
        thisWeekStart: monday,
        thisWeekEnd: sunday,
        nextWeekStart: nextMonday,
        nextWeekEnd: nextSunday,
        thisMonthStart: monthStart,
        thisMonthEnd: monthEnd,
      };
    },

    // Check if lead is in date range
    isLeadInDateRange() {
      return (lead: SpancoLead, filter: string): boolean => {
        const expectedDate = lead.expected_closure_date;

        if (!expectedDate) return filter === "later"; // No date = "Later"

        const closureDate = new Date(expectedDate);
        const ranges = this.dateRanges;

        switch (filter) {
          case "overdue":
            return closureDate < ranges.today;
          case "thisweek":
            return (
              closureDate >= ranges.thisWeekStart &&
              closureDate <= ranges.thisWeekEnd
            );
          case "nextweek":
            return (
              closureDate >= ranges.nextWeekStart &&
              closureDate <= ranges.nextWeekEnd
            );
          case "thismonth":
            return (
              closureDate >= ranges.thisMonthStart &&
              closureDate <= ranges.thisMonthEnd
            );
          case "later":
            return closureDate > ranges.thisMonthEnd || !expectedDate;
          default:
            return true;
        }
      };
    },

    // Filtered leads based on current filters + date filter + sorted by closure date
    filteredLeads(): SpancoLead[] {
      let filtered = [...this.leads];

      // Search filter
      if (this.filters.search) {
        const query = this.filters.search.toLowerCase();
        filtered = filtered.filter((lead) => {
          const searchableText = [
            lead.lead_number,
            lead.customer_info.name,
            lead.customer_info.phone,
            lead.customer_info.email,
            lead.service_location.city,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return searchableText.includes(query);
        });
      }

      // Stage filter
      if (this.filters.stage) {
        filtered = filtered.filter(
          (lead) => lead.current_stage === this.filters.stage,
        );
      }

      // Status filter
      if (this.filters.status) {
        filtered = filtered.filter(
          (lead) => lead.status === this.filters.status,
        );
      }

      // Priority filter
      if (this.filters.priority) {
        filtered = filtered.filter(
          (lead) => lead.priority === this.filters.priority,
        );
      }

      // Date filter
      if (this.dateFilter !== "all") {
        filtered = filtered.filter((lead) =>
          this.isLeadInDateRange(lead, this.dateFilter),
        );
      }

      // Sort by expected closure date (overdue first, then by date ascending)
      filtered.sort((a, b) => {
        const dateA = a.expected_closure_date;
        const dateB = b.expected_closure_date;

        // No date goes to end
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        const closureA = new Date(dateA);
        const closureB = new Date(dateB);
        const now = new Date();

        // Both overdue - sort by date (earliest first)
        if (closureA < now && closureB < now) {
          return closureA.getTime() - closureB.getTime();
        }

        // One overdue - overdue comes first
        if (closureA < now) return -1;
        if (closureB < now) return 1;

        // Both upcoming - sort by date (earliest first)
        return closureA.getTime() - closureB.getTime();
      });

      return filtered;
    },

    // Paginated leads
    paginatedLeads(): SpancoLead[] {
      const filtered = this.filteredLeads;
      const start = (this.pagination.currentPage - 1) * this.pagination.perPage;
      const end = start + this.pagination.perPage;
      return filtered.slice(start, end);
    },

    // Total pages
    totalPages(): number {
      const filtered = this.filteredLeads;
      return Math.ceil(filtered.length / this.pagination.perPage);
    },

    // Activity feed - sorted by most recent activity
    activityFeed(): SpancoLead[] {
      return [...this.leads].sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at).getTime();
        const bTime = new Date(b.updated_at || b.created_at).getTime();
        return bTime - aTime;
      });
    },

    // Leads grouped by stage
    leadsByStage(): Partial<Record<SpancoStage, SpancoLead[]>> {
      const grouped: Partial<Record<SpancoStage, SpancoLead[]>> = {};
      this.leads.forEach((lead) => {
        if (!grouped[lead.current_stage]) {
          grouped[lead.current_stage] = [];
        }
        grouped[lead.current_stage]!.push(lead);
      });
      return grouped;
    },

    // Lead counts by date range
    leadsByDateRange(): Record<string, number> {
      const ranges = this.dateRanges;
      const counts = {
        overdue: 0,
        thisweek: 0,
        nextweek: 0,
        thismonth: 0,
        later: 0,
      };

      this.leads.forEach((lead) => {
        const expectedDate = lead.expected_closure_date;

        if (!expectedDate) {
          counts.later++;
          return;
        }

        const closureDate = new Date(expectedDate);

        if (closureDate < ranges.today) {
          counts.overdue++;
        } else if (
          closureDate >= ranges.thisWeekStart &&
          closureDate <= ranges.thisWeekEnd
        ) {
          counts.thisweek++;
        } else if (
          closureDate >= ranges.nextWeekStart &&
          closureDate <= ranges.nextWeekEnd
        ) {
          counts.nextweek++;
        } else if (
          closureDate >= ranges.thisMonthStart &&
          closureDate <= ranges.thisMonthEnd
        ) {
          counts.thismonth++;
        } else {
          counts.later++;
        }
      });

      return counts;
    },

    // Summary statistics
    summary(): LeadSummary {
      const byStage: Partial<Record<SpancoStage, number>> = {};
      const byStatus: Partial<Record<LeadStatus, number>> = {};
      const byPriority: Partial<Record<Priority, number>> = {};

      this.leads.forEach((lead) => {
        byStage[lead.current_stage] = (byStage[lead.current_stage] || 0) + 1;
        byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
        byPriority[lead.priority] = (byPriority[lead.priority] || 0) + 1;
      });

      return {
        total: this.leads.length,
        byStage: byStage as Record<SpancoStage, number>,
        byStatus: byStatus as Record<LeadStatus, number>,
        byPriority: byPriority as Record<Priority, number>,
      };
    },

    // Selected lead
    selectedLead(): SpancoLead | null {
      if (!this.selectedLeadId) return null;
      return this.leads.find((lead) => lead.id === this.selectedLeadId) || null;
    },

    // Check if there are active filters
    hasActiveFilters(): boolean {
      return !!(
        this.filters.stage ||
        this.filters.status ||
        this.filters.priority ||
        this.filters.search ||
        this.dateFilter !== "all"
      );
    },
  },

  actions: {
    // Update the fetchLeads action
    async fetchLeads(options?: {
      append?: boolean;
      limit?: number;
      offset?: number;
    }) {
      if (this.isLoading && !options?.append) return;

      const supabase = useSupabaseClient();

      if (options?.append) {
        this.isLoadingMore = true;
      } else {
        this.isLoading = true;
      }
      this.error = null;

      try {
        const pageSize = options?.limit || 1000;
        const from =
          options?.offset ?? (options?.append ? this.leads.length : 0);
        const to = from + pageSize - 1;

        // ✅ UPDATED: Join with profiles table to fetch assigned user info
        const { data, error, count } = await supabase
          .from("spanco_leads")
          .select(
            `
        *,
        profiles:assigned_to (
          full_name,
          employee_code,
          avatar_url
        )
      `,
            { count: "exact" },
          )
          .order("updated_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        if (options?.append) {
          this.leads = [...this.leads, ...(data as SpancoLead[])];
        } else {
          this.leads = (data as SpancoLead[]) || [];
        }

        this.pagination.total = count || 0;
        this.hasMore = this.leads.length < (count || 0);
      } catch (error: any) {
        console.error("Error fetching leads:", error);
        this.error = error.message || "Failed to fetch leads";
      } finally {
        this.isLoading = false;
        this.isLoadingMore = false;
      }
    },

    // Load more leads
    async loadMoreLeads() {
      if (!this.hasMore || this.isLoadingMore) return;
      await this.fetchLeads({ append: true });
    },

    // Refresh leads
    async refreshLeads() {
      await this.fetchLeads();
    },

    // Fetch stage history for a lead
    async fetchStageHistory(leadId: number) {
      const supabase = useSupabaseClient();

      try {
        const { data, error } = await supabase
          .from("spanco_stage_history")
          .select("*")
          .eq("lead_id", leadId)
          .order("changed_at", { ascending: false });

        if (error) throw error;

        this.stageHistory[leadId] = (data as SpancoStageHistory[]) || [];
      } catch (error: any) {
        console.error("Error fetching stage history:", error);
      }
    },

    // Set filters
    setStageFilter(stage: SpancoStage | undefined) {
      this.filters.stage = stage;
      this.pagination.currentPage = 1;
    },

    setStatusFilter(status: LeadStatus | undefined) {
      this.filters.status = status;
      this.pagination.currentPage = 1;
    },

    setPriorityFilter(priority: Priority | undefined) {
      this.filters.priority = priority;
      this.pagination.currentPage = 1;
    },

    setSearchQuery(query: string) {
      this.filters.search = query;
      this.pagination.currentPage = 1;
    },

    // Set date filter
    setDateFilter(filter: LeadState["dateFilter"]) {
      this.dateFilter = filter;
      this.pagination.currentPage = 1;
    },

    // Clear all filters
    clearFilters() {
      this.filters = {
        search: "",
        stage: undefined,
        status: undefined,
        priority: undefined,
      };
      this.dateFilter = "all";
      this.pagination.currentPage = 1;
    },

    // Pagination
    setPage(page: number) {
      if (page >= 1 && page <= this.totalPages) {
        this.pagination.currentPage = page;
      }
    },

    nextPage() {
      if (this.pagination.currentPage < this.totalPages) {
        this.pagination.currentPage++;
      }
    },

    previousPage() {
      if (this.pagination.currentPage > 1) {
        this.pagination.currentPage--;
      }
    },

    // Select a lead (for detail modal)
    selectLead(leadId: number | null) {
      this.selectedLeadId = leadId;
      if (leadId) {
        this.fetchStageHistory(leadId);
      }
    },

    // Clear error
    clearError() {
      this.error = null;
    },

    // Initialize store
    async initialize() {
      await this.fetchLeads();
    },

    // Reset store (useful for logout)
    $reset() {
      this.leads = [];
      this.stageHistory = {};
      this.filters = {
        search: "",
        stage: undefined,
        status: undefined,
        priority: undefined,
      };
      this.isLoading = false;
      this.isLoadingMore = false;
      this.hasMore = true;
      this.error = null;
      this.pagination = {
        currentPage: 1,
        perPage: 20,
        total: 0,
      };
      this.selectedLeadId = null;
      this.dateFilter = "all";
    },
  },
});
