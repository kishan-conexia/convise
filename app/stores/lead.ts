// stores/lead.ts
import { defineStore } from "pinia";

// ✅ No imports needed! All types are auto-imported from /utils/lead.ts

interface DepartmentCacheEntry {
  id: number;
  name: string;
  manager_id: string | null;
  parent_id: number | null;
}

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
  // ✅ Server-side summary counts (always accurate, independent of pagination)
  serverSummary: ServerSummary;
  isLoadingSummary: boolean;
  // ✅ Salesperson filter (department hierarchy)
  salespeople: SalesPerson[];
  departmentsCache: Map<number, DepartmentCacheEntry>;
  isLoadingSalespeople: boolean;
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
      assignedTo: undefined,
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
    // ✅ Server-side summary (always accurate)
    serverSummary: {
      total: 0,
      byStatus: {},
      byDateRange: {
        overdue: 0,
        thisweek: 0,
        nextweek: 0,
        thismonth: 0,
        later: 0,
      },
    },
    isLoadingSummary: false,
    salespeople: [],
    departmentsCache: new Map(),
    isLoadingSalespeople: false,
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

      // ✅ Assigned-to (salesperson) filter
      if (this.filters.assignedTo) {
        filtered = filtered.filter(
          (lead) => lead.assigned_to === this.filters.assignedTo,
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

    // ✅ UPDATED: Lead counts by date range — uses server data for accuracy
    leadsByDateRange(): Record<string, number> {
      return this.serverSummary.byDateRange;
    },

    // ✅ UPDATED: Summary statistics — uses server data for total + status counts
    summary(): LeadSummary {
      // Stage and priority counts are still computed client-side (used for tab filtering)
      const byStage: Partial<Record<SpancoStage, number>> = {};
      const byPriority: Partial<Record<Priority, number>> = {};

      this.leads.forEach((lead) => {
        byStage[lead.current_stage] = (byStage[lead.current_stage] || 0) + 1;
        byPriority[lead.priority] = (byPriority[lead.priority] || 0) + 1;
      });

      return {
        total: this.serverSummary.total,
        byStage: byStage as Record<SpancoStage, number>,
        byStatus: this.serverSummary.byStatus as Record<LeadStatus, number>,
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
        this.filters.assignedTo ||
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

    // ✅ NEW: Fetch accurate summary counts from Supabase (independent of pagination)
    async fetchSummaryCounts() {
      const supabase = useSupabaseClient();
      this.isLoadingSummary = true;

      try {
        // Helper: count rows with optional filters
        const countWithFilter = async (
          filters: Record<string, string> = {},
        ): Promise<number> => {
          let query = supabase
            .from("spanco_leads")
            .select("*", { count: "exact", head: true });

          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value);
          }

          const { count, error } = await query;
          if (error) throw error;
          return count || 0;
        };

        // --- Date range boundaries (same logic as dateRanges getter) ---
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );

        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const nextMonday = new Date(sunday);
        nextMonday.setDate(sunday.getDate() + 1);
        const nextSunday = new Date(nextMonday);
        nextSunday.setDate(nextMonday.getDate() + 6);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Format date for Supabase (YYYY-MM-DD)
        const fmt = (d: Date) => d.toISOString().split("T")[0];

        // Helper: count rows with date range filters
        const countByDateRange = async (
          gte?: Date,
          lte?: Date,
          lt?: Date,
          isNull?: boolean,
        ): Promise<number> => {
          let query = supabase
            .from("spanco_leads")
            .select("*", { count: "exact", head: true });

          if (isNull) {
            query = query.is("expected_closure_date", null);
          } else {
            if (lt) query = query.lt("expected_closure_date", fmt(lt));
            if (gte) query = query.gte("expected_closure_date", fmt(gte));
            if (lte) query = query.lte("expected_closure_date", fmt(lte));
          }

          const { count, error } = await query;
          if (error) throw error;
          return count || 0;
        };

        // Fire all queries in parallel for speed
        const [
          total,
          active,
          won,
          lost,
          onHold,
          overdue,
          thisweek,
          nextweek,
          thismonth,
          laterWithDate,
          laterNoDate,
        ] = await Promise.all([
          // Status counts
          countWithFilter(),
          countWithFilter({ status: "active" }),
          countWithFilter({ status: "won" }),
          countWithFilter({ status: "lost" }),
          countWithFilter({ status: "on_hold" }),
          // Date range counts
          countByDateRange(undefined, undefined, today),
          countByDateRange(monday, sunday),
          countByDateRange(nextMonday, nextSunday),
          countByDateRange(monthStart, monthEnd),
          // "Later" = after this month
          countByDateRange(new Date(monthEnd.getTime() + 86400000)),
          // "Later" also includes leads with no date
          countByDateRange(undefined, undefined, undefined, true),
        ]);

        this.serverSummary = {
          total,
          byStatus: {
            active,
            won,
            lost,
            on_hold: onHold,
          },
          byDateRange: {
            overdue,
            thisweek,
            nextweek,
            thismonth,
            later: laterWithDate + laterNoDate,
          },
        };
      } catch (error: any) {
        console.error("Error fetching summary counts:", error);
        // Fallback: compute from loaded leads (best effort)
      } finally {
        this.isLoadingSummary = false;
      }
    },

    // Refresh leads
    async refreshLeads() {
      await Promise.all([this.fetchLeads(), this.fetchSummaryCounts()]);
    },

    // ✅ Fetch salespeople scoped to current user's department + downline only
    async fetchSalespeople() {
      const supabase = useSupabaseClient();
      const userProfileStore = useUserProfileStore();
      this.isLoadingSalespeople = true;

      try {
        // Step 1: Determine the starting department(s) for this user
        // The user can only see profiles in their managed department and its children
        const userManagedDeptIds = userProfileStore.managedDepartmentIds;
        if (userManagedDeptIds.length === 0) {
          this.salespeople = [];
          return;
        }

        // Step 2: Fetch all active departments as a plain array
        const { data: allDepts, error: deptError } = await supabase
          .from("departments")
          .select("id, name, manager_id, parent_id")
          .eq("is_active", true);

        if (deptError) throw deptError;
        const departments = (allDepts || []) as DepartmentCacheEntry[];
        if (departments.length === 0) {
          this.salespeople = [];
          return;
        }

        // Step 3: Determine root departments for the BFS
        // - If user manages dept 1 (CEO), start from dept 20 (sales root)
        // - Otherwise, use only the user's managed depts that fall within the sales tree
        const SALES_ROOT_DEPT_ID = 20;

        // Build full sales subtree IDs for intersection check
        const allSalesIds = new Set<number>([SALES_ROOT_DEPT_ID]);
        let parents = [SALES_ROOT_DEPT_ID];
        while (parents.length > 0) {
          const kids = departments.filter(
            (d) => d.parent_id !== null && parents.includes(d.parent_id),
          );
          const kidIds = kids.map((d) => d.id);
          kidIds.forEach((id) => allSalesIds.add(id));
          parents = kidIds;
        }

        let rootDeptIds: number[];

        if (userManagedDeptIds.includes(1)) {
          // CEO — show entire sales tree
          rootDeptIds = [SALES_ROOT_DEPT_ID];
        } else {
          // Intersect user's managed depts with the sales tree
          rootDeptIds = userManagedDeptIds.filter((id) => allSalesIds.has(id));
        }

        if (rootDeptIds.length === 0) {
          this.salespeople = [];
          return;
        }

        // Step 4: BFS from user's root dept(s) to collect downline department IDs
        const scopedDeptIds: number[] = [...rootDeptIds];
        let currentParentIds = [...rootDeptIds];
        while (currentParentIds.length > 0) {
          const children = departments.filter(
            (d) =>
              d.parent_id !== null && currentParentIds.includes(d.parent_id),
          );
          const childIds = children.map((d) => d.id);
          scopedDeptIds.push(...childIds);
          currentParentIds = childIds;
        }

        // Step 5: Fetch profiles ONLY from the scoped departments
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, employee_code, avatar_url")
          .in("department", scopedDeptIds)
          .eq("is_active", true)
          .order("full_name");

        if (profileError) throw profileError;

        this.salespeople = (profiles as SalesPerson[]) || [];
      } catch (error: any) {
        console.error("Error fetching salespeople:", error);
        this.salespeople = [];
      } finally {
        this.isLoadingSalespeople = false;
      }
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

    // ✅ NEW: Assigned-to filter
    setAssignedToFilter(userId: string | undefined) {
      this.filters.assignedTo = userId;
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
        assignedTo: undefined,
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
      await Promise.all([
        this.fetchLeads(),
        this.fetchSummaryCounts(),
        this.fetchSalespeople(),
      ]);
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
        assignedTo: undefined,
      };
      this.salespeople = [];
      this.departmentsCache = new Map();
      this.isLoadingSalespeople = false;
      this.isLoading = false;
      this.isLoadingMore = false;
      this.isLoadingSummary = false;
      this.hasMore = true;
      this.error = null;
      this.pagination = {
        currentPage: 1,
        perPage: 20,
        total: 0,
      };
      this.selectedLeadId = null;
      this.dateFilter = "all";
      this.serverSummary = {
        total: 0,
        byStatus: {},
        byDateRange: {
          overdue: 0,
          thisweek: 0,
          nextweek: 0,
          thismonth: 0,
          later: 0,
        },
      };
    },
  },
});
