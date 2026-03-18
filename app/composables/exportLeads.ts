// composables/exportLeads.ts
import * as XLSX from "xlsx";

export function useExportLeads() {
  const supabase = useSupabaseClient();
  const isExporting = ref(false);

  /**
   * Flatten a SpancoLead into a comprehensive row object for Excel export
   * Includes all JSONB sub-fields matching the full table structure
   */
  function flattenLead(lead: SpancoLead) {
    const formatDate = (d?: string | null) => {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const formatDateTime = (d?: string | null) => {
      if (!d) return "";
      return new Date(d).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return {
      // ── Core Lead Info ──
      "Lead #": lead.lead_number,
      "Stage": STAGE_LABELS[lead.current_stage] || lead.current_stage,
      "Stage Updated At": formatDateTime(lead.stage_updated_at),
      "Status": STATUS_LABELS[lead.status] || lead.status,
      "Priority": PRIORITY_LABELS[lead.priority] || lead.priority,

      // ── Customer Info (JSONB) ──
      "Customer Name": lead.customer_info.name,
      "Customer Type": CUSTOMER_TYPE_LABELS[lead.customer_info.type] || lead.customer_info.type,
      "Contact Person": lead.customer_info.contact_person || "",
      "Phone": lead.customer_info.phone,
      "Alternate Phone": lead.customer_info.alternate_phone || "",
      "Email": lead.customer_info.email || "",
      "Company Name": lead.customer_info.company_name || "",
      "GSTIN": lead.customer_info.gstin || "",
      "PAN": lead.customer_info.pan || "",

      // ── Service Location (JSONB) ──
      "Service Address": lead.service_location.address || "",
      "City": lead.service_location.city,
      "State": lead.service_location.state,
      "Pincode": lead.service_location.pincode || "",
      "Landmark": lead.service_location.landmark || "",

      // ── Service Requirements (JSONB) ──
      "Bandwidth Required": lead.service_requirements?.bandwidth_required || "",
      "Plan Interest": lead.service_requirements?.plan_interest || "",
      "No. of Connections": lead.service_requirements?.number_of_connections ?? "",
      "Current Customers": lead.service_requirements?.current_customers ?? "",
      "Expected Customers": lead.service_requirements?.expected_customers ?? "",
      "Special Requirements": lead.service_requirements?.special_requirements || "",

      // ── Commercial Details (JSONB) ──
      "Estimated Value (₹)": lead.commercial_details?.estimated_value ?? "",
      "Monthly Rental (₹)": lead.commercial_details?.proposed_monthly_rental ?? "",
      "Installation Charge (₹)": lead.commercial_details?.proposed_installation_charge ?? "",
      "Contract Period (Months)": lead.commercial_details?.contract_period_months ?? "",
      "Payment Terms": lead.commercial_details?.payment_terms || "",

      // ── Lead Tracking (JSONB) ──
      "Lead Source": lead.lead_tracking?.source || "",
      "Source Details": lead.lead_tracking?.source_details || "",
      "Referral By": lead.lead_tracking?.referral_by || "",
      "Campaign ID": lead.lead_tracking?.campaign_id || "",

      // ── Assignment ──
      "Assigned To": lead.profiles?.full_name || "",
      "Employee Code": lead.profiles?.employee_code || "",
      "Assigned At": formatDateTime(lead.assigned_at),

      // ── Dates & Timeline (JSONB + top-level) ──
      "Expected Closure Date": formatDate(lead.expected_closure_date),
      "Follow-up Date": formatDate(lead.timeline?.follow_up_date),
      "Last Contact Date": formatDate(lead.timeline?.last_contact_date),
      "Won Date": formatDate(lead.timeline?.won_date),
      "Order Date": formatDate(lead.timeline?.order_date),
      "Actual Closure Date": formatDate(lead.timeline?.actual_closure_date),
      "Installation Type": lead.timeline?.installation_type || "",

      // ── Notes (JSONB) ──
      "Remarks": lead.notes?.remarks || "",

      // ── Timestamps ──
      "Created At": formatDateTime(lead.created_at),
      "Updated At": formatDateTime(lead.updated_at),
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
