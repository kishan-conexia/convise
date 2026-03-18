// composables/exportLeads.ts
import * as XLSX from "xlsx";

export function useExportLeads() {
  const supabase = useSupabaseClient();
  const isExporting = ref(false);

  /**
   * Flatten a SpancoLead into a plain row object for Excel export
   */
  function flattenLead(lead: SpancoLead) {
    return {
      "Lead #": lead.lead_number,
      Customer: lead.customer_info.name,
      Type: CUSTOMER_TYPE_LABELS[lead.customer_info.type] || lead.customer_info.type,
      Phone: lead.customer_info.phone,
      Email: lead.customer_info.email || "",
      City: lead.service_location.city,
      State: lead.service_location.state,
      Stage: STAGE_LABELS[lead.current_stage] || lead.current_stage,
      Status: STATUS_LABELS[lead.status] || lead.status,
      Priority: PRIORITY_LABELS[lead.priority] || lead.priority,
      "Closure Date": lead.expected_closure_date
        ? new Date(lead.expected_closure_date).toLocaleDateString("en-IN")
        : "",
      "Estimated Value": lead.commercial_details?.estimated_value || "",
      "Monthly Rental": lead.commercial_details?.proposed_monthly_rental || "",
      "Assigned To": lead.profiles?.full_name || "",
      "Created At": new Date(lead.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
  }

  /**
   * Export an array of leads to .xlsx
   */
  function exportToExcel(leads: SpancoLead[], filename?: string) {
    if (leads.length === 0) return;

    const rows = leads.map(flattenLead);
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns based on content
    const firstRow = rows[0];
    if (firstRow) {
      const colWidths = Object.keys(firstRow).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...rows.map((row) => String(row[key as keyof typeof row] ?? "").length),
        );
        return { wch: Math.min(maxLen + 2, 40) };
      });
      worksheet["!cols"] = colWidths;
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, filename || `leads_export_${today}.xlsx`);
  }

  /**
   * Fetch ALL leads from Supabase (bypassing pagination) for export
   */
  async function fetchAllForExport(): Promise<SpancoLead[]> {
    const allLeads: SpancoLead[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
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
        )
        .order("updated_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allLeads.push(...(data as SpancoLead[]));
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return allLeads;
  }

  /**
   * Export all leads (fetches from DB, ignoring pagination)
   */
  async function exportAllLeads() {
    isExporting.value = true;
    try {
      const allLeads = await fetchAllForExport();
      exportToExcel(allLeads, `all_leads_export_${new Date().toISOString().split("T")[0]}.xlsx`);
      return allLeads.length;
    } finally {
      isExporting.value = false;
    }
  }

  /**
   * Export only the currently filtered/loaded leads
   */
  function exportCurrentView(leads: SpancoLead[]) {
    exportToExcel(leads, `filtered_leads_export_${new Date().toISOString().split("T")[0]}.xlsx`);
    return leads.length;
  }

  return {
    isExporting,
    exportAllLeads,
    exportCurrentView,
    exportToExcel,
  };
}
