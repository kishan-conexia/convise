// =============================================================================
// quotation-portal — Supabase Edge Function
// =============================================================================
//
// Carrier-Grade Customer Quotation Review & Acceptance Portal.
// Serves a fast, responsive, branded HTML web page directly to the customer's
// browser without requiring web hosting or external dependencies.
//
// SUPPORTS:
//   - GET ?token={UUID} : Renders interactive proposal with view tracking
//   - POST              : Accepts digital approval or revision request
//
// REQUIRED SECRETS:
//   SUPABASE_URL              — Auto-provided by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — Auto-provided by Supabase
// =============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface Quotation {
  id: number;
  quotation_number: string | null;
  lead_id: number | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  company_name: string | null;
  gstin: string | null;
  connection_type: string;
  plan_name: string;
  bandwidth: string;
  service_type: string | null;
  monthly_rental: number;
  installation_charges: number;
  equipment_charges: number;
  router_charges: number;
  ont_charges: number;
  static_ip_charges: number;
  other_charges: number;
  other_charges_description: string | null;
  onetime_subtotal: number | null;
  security_deposit: number;
  discount_percentage: number;
  discount_amount: number | null;
  discount_remarks: string | null;
  taxable_amount: number | null;
  cgst_percentage: number;
  cgst_amount: number | null;
  sgst_percentage: number;
  sgst_amount: number | null;
  igst_percentage: number;
  igst_amount: number | null;
  onetime_total_with_tax: number | null;
  total_payable_now: number | null;
  contract_period_months: number | null;
  total_contract_value: number | null;
  payment_terms: string | null;
  billing_cycle: string | null;
  advance_payment_required: boolean | null;
  advance_payment_months: number | null;
  terms_and_conditions: string | null;
  special_notes: string | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  uptime_guarantee: string | null;
  support_type: string | null;
  response_time: string | null;
  resolution_time: string | null;
  status: string;
  valid_until: string | null;
  quotation_date: string | null;
  revision_number: number;
  viewed_at: string | null;
  viewed_count: number;
  accepted_at: string | null;
  accepted_by_name: string | null;
  accepted_by_designation: string | null;
  purchase_order_number: string | null;
  acceptance_remarks: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  rejection_remarks: string | null;
  prepared_by: string;
  acceptance_token: string | null;
  place_of_supply?: string | null;
  place_of_supply_code?: string | null;
}

// ─────────────────────────────────────────────────────────────
// GST State Code Directory (Indian GST Standard)
// ─────────────────────────────────────────────────────────────
const GST_STATE_MAP: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};

/**
 * Resolves Place of Supply and State Code for tax invoicing & billing customer onboarding.
 * Prioritizes explicit field, then GSTIN prefix (first 2 digits), then address match,
 * falling back safely to company state (Delhi / 07).
 */
function resolvePlaceOfSupply(q: Quotation): { state: string; code: string } {
  // 1. Explicitly present on quotation
  if (q.place_of_supply_code && GST_STATE_MAP[q.place_of_supply_code]) {
    return {
      code: q.place_of_supply_code,
      state: q.place_of_supply || GST_STATE_MAP[q.place_of_supply_code],
    };
  }

  // 2. Derive from customer GSTIN (15 chars, first 2 digits = state code)
  if (q.gstin && typeof q.gstin === "string") {
    const cleanGst = q.gstin.trim().toUpperCase();
    if (/^[0-9]{2}/.test(cleanGst)) {
      const stateCode = cleanGst.substring(0, 2);
      if (GST_STATE_MAP[stateCode]) {
        return {
          code: stateCode,
          state: GST_STATE_MAP[stateCode],
        };
      }
    }
  }

  // 3. Search customer address for known state names
  if (q.customer_address && typeof q.customer_address === "string") {
    const addr = q.customer_address.toLowerCase();
    for (const [code, stateName] of Object.entries(GST_STATE_MAP)) {
      if (addr.includes(stateName.toLowerCase())) {
        return { code, state: stateName };
      }
    }
  }

  // 4. Default seller location (Delhi, 07)
  return { code: "07", state: "Delhi" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Server configuration error: missing Supabase credentials.", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const url = new URL(req.url);

  // 1. Extract Token (from query param ?token=... or path /.../<token>)
  let token = url.searchParams.get("token");
  if (!token) {
    const segments = url.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last !== "quotation-portal" && last !== "quotation" && last !== "v1") {
      token = last;
    }
  }

  // Check POST body for token if not in query
  let postAction: string | null = null;
  let postName: string | null = null;
  let postDesignation: string | null = null;
  let postPoNumber: string | null = null;
  let postRemarks: string | null = null;
  let postReason: string | null = null;
  let postConsent: boolean = false;

  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      token = (formData.get("token") as string) || token;
      postAction = (formData.get("action") as string) || "accept";
      postName = (formData.get("accepted_by_name") as string) || null;
      postDesignation = (formData.get("accepted_by_designation") as string) || null;
      postPoNumber = (formData.get("purchase_order_number") as string) || null;
      postRemarks = (formData.get("acceptance_remarks") as string) || null;
      postReason = (formData.get("rejection_reason") as string) || null;
      postConsent = formData.get("consent_checkbox") === "on";
    } else if (contentType.includes("application/json")) {
      try {
        const body = await req.json();
        token = body.token || token;
        postAction = body.action || "accept";
        postName = body.accepted_by_name || null;
        postDesignation = body.accepted_by_designation || null;
        postPoNumber = body.purchase_order_number || null;
        postRemarks = body.acceptance_remarks || null;
        postReason = body.rejection_reason || null;
        postConsent = Boolean(body.consent_checkbox);
      } catch {
        // ignore parse error
      }
    }
  }

  if (!token || token.trim().length === 0) {
    return new Response(renderErrorPage("Invalid Link", "The quotation link is missing or invalid. Please check your email or contact Conexia."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // 2. Fetch Quotation by Token
  const { data: quoteData, error: quoteError } = await supabase
    .from("quotations")
    .select("*")
    .eq("acceptance_token", token.trim())
    .maybeSingle();

  if (quoteError || !quoteData) {
    return new Response(
      renderErrorPage(
        "Proposal Not Found",
        "We could not locate the requested quotation. The link may have expired or been replaced by an updated revision."
      ),
      {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  const q = quoteData as Quotation;

  // Fetch Sales Rep profile details for direct assistance
  let repName = "Conexia Enterprise Team";
  let repPhone = "+91 99991 23125";
  let repEmail = "enterprise@conexiaworld.com";

  if (q.prepared_by) {
    const { data: repProfile } = await supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("id", q.prepared_by)
      .maybeSingle();

    if (repProfile) {
      if (repProfile.full_name) repName = repProfile.full_name;
      if (repProfile.phone && repProfile.phone.trim()) repPhone = repProfile.phone.trim();
      if ((repProfile as any).email && (repProfile as any).email.trim()) repEmail = (repProfile as any).email.trim();
    }
  }

  // Check for Newer / Superseded Revision (E6)
  let newerRevision: { id: number; revision_number: number; acceptance_token: string | null } | null = null;
  if (q.lead_id) {
    const { data: latestQuote } = await supabase
      .from("quotations")
      .select("id, revision_number, acceptance_token")
      .eq("lead_id", q.lead_id)
      .gt("revision_number", q.revision_number)
      .order("revision_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestQuote) {
      newerRevision = latestQuote;
    }
  }

  // Evaluate Life Cycle States
  const isExpired = q.valid_until ? isDatePassed(q.valid_until) : false;
  const isAccepted = q.status === "accepted";
  const isRejected = q.status === "rejected";
  const isDraftOrReview = q.status === "draft" || q.status === "pending_approval";
  const isSuperseded = Boolean(newerRevision);

  // 3. Handle POST Actions (Accept or Decline)
  if (req.method === "POST") {
    if (postAction === "accept") {
      // Validation: Already Accepted
      if (isAccepted) {
        return new Response(renderSuccessPage(q, repName, repPhone, "Already Approved", token), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      // Validation: Draft / Internal Review
      if (isDraftOrReview) {
        return new Response(
          renderErrorPage(
            "Quotation Not Released",
            "This quotation is currently undergoing internal commercial review and is not yet released for acceptance.",
            repPhone,
            repEmail,
            true,
            token
          ),
          { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      // Validation: Superseded by newer revision
      if (isSuperseded && newerRevision?.acceptance_token) {
        return new Response(
          renderErrorPage(
            "Superseded Revision",
            `A newer revision (Rev. ${newerRevision.revision_number}) has already been generated. Please review and accept the latest revision instead.`,
            repPhone,
            repEmail,
            true,
            newerRevision.acceptance_token
          ),
          { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      // Validation: Expired
      if (isExpired) {
        return new Response(
          renderErrorPage(
            "Quotation Expired",
            `This quotation expired on ${formatDate(q.valid_until)}. Please contact ${repName} (${repPhone}) to receive an updated proposal.`,
            repPhone,
            repEmail
          ),
          { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      if (!postName || postName.trim().length === 0) {
        return new Response(
          renderErrorPage("Validation Error", "Full Name is required for official acceptance.", undefined, undefined, true, token),
          { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      if (!postDesignation || postDesignation.trim().length === 0) {
        return new Response(
          renderErrorPage("Validation Error", "Corporate Designation / Title is required for acceptance.", undefined, undefined, true, token),
          { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      if (!postConsent) {
        return new Response(
          renderErrorPage("Validation Error", "You must confirm authorization and agreement to Conexia terms.", undefined, undefined, true, token),
          { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      // Atomic Update: accept quotation
      const cleanName = postName.trim().slice(0, 100);
      const cleanDesignation = postDesignation.trim().slice(0, 100);
      const cleanPo = postPoNumber ? postPoNumber.trim().slice(0, 50) : null;
      const cleanRemarks = postRemarks ? postRemarks.trim().slice(0, 500) : null;
      const nowIso = new Date().toISOString();

      const { data: updatedQuote, error: updateError } = await supabase
        .from("quotations")
        .update({
          status: "accepted",
          accepted_at: nowIso,
          accepted_by_name: cleanName,
          accepted_by_designation: cleanDesignation,
          purchase_order_number: cleanPo,
          acceptance_remarks: cleanRemarks,
          updated_at: nowIso,
        })
        .eq("acceptance_token", token)
        .in("status", ["sent", "viewed"])
        .select()
        .maybeSingle();

      if (updateError) {
        return new Response(
          renderErrorPage("Update Error", "Failed to record acceptance. Please try again or contact your representative."),
          { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      // Auto-progress SPANCO Lead to Order Won ('order') if lead_id exists
      if (q.lead_id) {
        try {
          await supabase
            .from("spanco_leads")
            .update({
              current_stage: "order",
              stage_updated_at: nowIso,
              updated_at: nowIso,
            })
            .eq("id", q.lead_id);
        } catch {
          // Non-blocking log
        }
      }

      // Sync accepted quotation to Billing Portal
      try {
        const pos = resolvePlaceOfSupply(q);
        const billingPayload = {
          convise_quotation_id: q.id,
          quotation_number: q.quotation_number,
          lead_id: q.lead_id,
          quotation_date: q.quotation_date,
          valid_until: q.valid_until,
          revision_number: q.revision_number,
          customer_name: q.customer_name,
          customer_email: q.customer_email,
          customer_phone: q.customer_phone,
          customer_address: q.customer_address,
          company_name: q.company_name,
          gstin: q.gstin,
          place_of_supply: pos.state,
          place_of_supply_code: pos.code,
          connection_type: q.connection_type,
          plan_name: q.plan_name,
          bandwidth: q.bandwidth,
          service_type: q.service_type,
          monthly_rental: q.monthly_rental,
          installation_charges: q.installation_charges,
          equipment_charges: q.equipment_charges,
          router_charges: q.router_charges,
          ont_charges: q.ont_charges,
          static_ip_charges: q.static_ip_charges,
          other_charges: q.other_charges,
          other_charges_description: q.other_charges_description,
          onetime_subtotal: q.onetime_subtotal,
          security_deposit: q.security_deposit,
          discount_percentage: q.discount_percentage,
          discount_amount: q.discount_amount,
          discount_remarks: q.discount_remarks,
          taxable_amount: q.taxable_amount,
          cgst_percentage: q.cgst_percentage,
          cgst_amount: q.cgst_amount,
          sgst_percentage: q.sgst_percentage,
          sgst_amount: q.sgst_amount,
          igst_percentage: q.igst_percentage,
          igst_amount: q.igst_amount,
          onetime_total_with_tax: q.onetime_total_with_tax,
          total_payable_now: q.total_payable_now,
          contract_period_months: q.contract_period_months,
          total_contract_value: q.total_contract_value,
          billing_cycle: q.billing_cycle,
          payment_terms: q.payment_terms,
          advance_payment_required: q.advance_payment_required,
          advance_payment_months: q.advance_payment_months,
          inclusions: q.inclusions,
          exclusions: q.exclusions,
          special_notes: q.special_notes,
          terms_and_conditions: q.terms_and_conditions,
          uptime_guarantee: q.uptime_guarantee,
          support_type: q.support_type,
          response_time: q.response_time,
          resolution_time: q.resolution_time,
          acceptance_token: token,
          prepared_by: q.prepared_by || null,
          sender_name: repName,
          sender_email: repEmail,
          sender_phone: repPhone,
          accepted_at: nowIso,
          accepted_by_name: cleanName,
          accepted_by_designation: cleanDesignation,
          purchase_order_number: cleanPo,
          acceptance_remarks: cleanRemarks,
          status: "accepted",
          billing_status: "pending_onboarding",
        };

        // 1. Direct write to Billing Supabase Database (fires Postgres auto-onboard trigger)
        const billingDbUrl = Deno.env.get("BILLING_SUPABASE_URL") || "";
        const billingServiceKey = Deno.env.get("BILLING_SUPABASE_SERVICE_KEY") || "";

        const dbRes = await fetch(`${billingDbUrl}/rest/v1/quotations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": billingServiceKey,
            "Authorization": `Bearer ${billingServiceKey}`,
            "Prefer": "resolution=merge-duplicates",
          },
          body: JSON.stringify(billingPayload),
        });

        if (!dbRes.ok) {
          console.warn("[quotation-portal] Billing Supabase direct write status:", dbRes.status, await dbRes.text());
        }

        // 2. Also forward to Billing API webhook
        const billingUrl = Deno.env.get("BILLING_URL") || "https://billing.conexiaworld.com";
        fetch(`${billingUrl}/api/quotations/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(billingPayload),
        }).catch(() => { });
      } catch (syncErr) {
        console.warn("[quotation-portal] Notice: Billing sync failed", syncErr);
      }

      const finalQuote = (updatedQuote || q) as Quotation;
      finalQuote.status = "accepted";
      finalQuote.accepted_at = nowIso;
      finalQuote.accepted_by_name = cleanName;
      finalQuote.accepted_by_designation = cleanDesignation;
      if (cleanPo) finalQuote.purchase_order_number = cleanPo;

      return new Response(renderSuccessPage(finalQuote, repName, repPhone, "Quotation Accepted", token), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } else if (postAction === "decline") {
      // Rejection / Revision Request
      const cleanReason = (postReason || "Revision Requested").trim().slice(0, 100);
      const cleanRemarks = postRemarks ? postRemarks.trim().slice(0, 500) : null;
      const nowIso = new Date().toISOString();

      await supabase
        .from("quotations")
        .update({
          status: "rejected",
          rejected_at: nowIso,
          rejection_reason: cleanReason,
          rejection_remarks: cleanRemarks,
          updated_at: nowIso,
        })
        .eq("acceptance_token", token)
        .in("status", ["sent", "viewed"]);

      return new Response(renderDeclinedPage(q, cleanReason, repName, repPhone, repEmail, token), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  // 4. Handle GET: View Tracking
  // Only track views if quotation is published (not draft / internal review)
  if (!isDraftOrReview) {
    if (q.status === "sent") {
      // First view transition: sent -> viewed
      await supabase
        .from("quotations")
        .update({
          status: "viewed",
          viewed_at: new Date().toISOString(),
          viewed_count: 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", q.id);
      q.status = "viewed";
      q.viewed_count = 1;
    } else {
      // Subsequent views: audit count increment
      await supabase
        .from("quotations")
        .update({
          viewed_count: (q.viewed_count || 0) + 1,
        })
        .eq("id", q.id);
    }
  }

  // 5. Render Full Interactive Portal Page
  const html = renderQuotationPortalHtml(
    q,
    token,
    repName,
    repPhone,
    repEmail,
    isExpired,
    isAccepted,
    isRejected,
    isDraftOrReview,
    newerRevision
  );

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});

// ─────────────────────────────────────────────────────────────
// HTML Page Generator
// ─────────────────────────────────────────────────────────────

function renderQuotationPortalHtml(
  q: Quotation,
  token: string,
  repName: string,
  repPhone: string,
  repEmail: string,
  isExpired: boolean,
  isAccepted: boolean,
  isRejected: boolean,
  isDraftOrReview: boolean,
  newerRevision: { id: number; revision_number: number; acceptance_token: string | null } | null
): string {
  const onetimeSubtotal = Math.max(0, q.onetime_subtotal ?? 0);
  const discountAmt = onetimeSubtotal > 0
    ? Math.min(onetimeSubtotal, Math.max(0, q.discount_amount ?? 0))
    : 0;
  const taxableAmt = Math.max(
    0,
    q.taxable_amount ?? (onetimeSubtotal - discountAmt)
  );
  const onetimeTotal = Math.max(0, q.onetime_total_with_tax ?? 0);
  const securityDeposit = Math.max(0, q.security_deposit ?? 0);

  // Advance Rental
  const advanceRequired = Boolean(q.advance_payment_required);
  const advanceMonths = advanceRequired ? Math.max(1, q.advance_payment_months || 1) : 0;
  const advanceBaseRental = advanceRequired && q.monthly_rental > 0
    ? q.monthly_rental * advanceMonths
    : 0;
  let advanceCgst = 0;
  let advanceSgst = 0;
  let advanceIgst = 0;
  if (advanceBaseRental > 0) {
    if (isIntraState(q)) {
      advanceCgst = Math.round(advanceBaseRental * (q.cgst_percentage / 100) * 100) / 100;
      advanceSgst = Math.round(advanceBaseRental * (q.sgst_percentage / 100) * 100) / 100;
    } else {
      advanceIgst = Math.round(advanceBaseRental * (q.igst_percentage / 100) * 100) / 100;
    }
  }
  const advanceTotalTax = isIntraState(q) ? (advanceCgst + advanceSgst) : advanceIgst;
  const advanceTotalWithTax = advanceBaseRental + advanceTotalTax;

  const totalPayable = Math.max(
    0,
    q.total_payable_now ?? (onetimeTotal + securityDeposit + advanceTotalWithTax)
  );
  const hasContract = (q.contract_period_months ?? 0) > 0;
  const contractMonths = q.contract_period_months ?? 0;
  const contractValue = hasContract
    ? Math.max(0, q.total_contract_value ?? (q.monthly_rental * contractMonths))
    : 0;

  // Charge rows
  const chargeRows: { name: string; amount: number }[] = [];
  if (q.installation_charges > 0) chargeRows.push({ name: "Installation Charges", amount: q.installation_charges });
  if (q.equipment_charges > 0) chargeRows.push({ name: "Equipment Charges", amount: q.equipment_charges });
  if (q.router_charges > 0) chargeRows.push({ name: "Router Charges", amount: q.router_charges });
  if (q.ont_charges > 0) chargeRows.push({ name: "ONT Charges", amount: q.ont_charges });
  if (q.static_ip_charges > 0) chargeRows.push({ name: "Static IP Charges", amount: q.static_ip_charges });
  if (q.other_charges > 0) chargeRows.push({ name: q.other_charges_description || "Other Charges", amount: q.other_charges });

  const hasSla = Boolean(
    (q.uptime_guarantee && q.uptime_guarantee.trim()) ||
    (q.support_type && q.support_type.trim()) ||
    (q.response_time && q.response_time.trim()) ||
    (q.resolution_time && q.resolution_time.trim())
  );

  const hasExplicitTerms = Boolean(q.terms_and_conditions && q.terms_and_conditions.trim().length > 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation ${q.quotation_number ?? "Proposal"} | Conexia Enterprise Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      line-height: 1.5;
      padding: 24px 12px 60px;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .top-accent {
      height: 5px;
      background: linear-gradient(90deg, #B62175 0%, #0091D0 100%);
    }
    .header {
      padding: 28px 36px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .logo-box img {
      width: 170px;
      height: auto;
      display: block;
    }
    .logo-sub {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-top: 4px;
      letter-spacing: 0.5px;
    }
    .header-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .badge-approved { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-review { background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; }
    .badge-expired { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-amber { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-declined { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

    .content { padding: 32px 36px; }

    /* State Alert Banners */
    .banner {
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }
    .banner-green { background: #f0fdf4; border: 1.5px solid #86efac; color: #166534; }
    .banner-amber { background: #fffbeb; border: 1.5px solid #fcd34d; color: #92400e; }
    .banner-red { background: #fef2f2; border: 1.5px solid #fca5a5; color: #991b1b; }
    .banner-icon { font-size: 22px; line-height: 1; }
    .banner-title { font-weight: 800; font-size: 14px; margin-bottom: 2px; }
    .banner-desc { font-size: 12px; line-height: 1.5; }

    /* Section Headings */
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 28px 0 10px;
    }

    /* Clean Light Table */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      font-size: 13px;
    }
    table.data-table th {
      background: #f8fafc;
      padding: 10px 16px;
      font-weight: 700;
      color: #475569;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
    }
    table.data-table td {
      padding: 11px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    table.data-table tr:last-child td { border-bottom: none; }
    table.data-table tr.even { background: #f8fafc; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; color: #0f172a; }
    .highlight-blue { color: #0091D0; font-weight: 800; }
    .highlight-green { color: #15803d; font-weight: 800; }

    /* Highlights */
    .mrc-card {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 1px solid #6ee7b7;
      border-radius: 12px;
      padding: 22px 26px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 14px;
      flex-wrap: wrap;
      gap: 14px;
    }
    .mrc-label { font-size: 11px; font-weight: 800; color: #047857; letter-spacing: 1px; }
    .mrc-amount { font-size: 28px; font-weight: 900; color: #065f46; margin-top: 2px; }
    .mrc-sub { font-size: 11px; color: #047857; margin-top: 2px; }

    .total-card {
      background: #f0f9ff;
      border: 1.5px solid #0091D0;
      border-radius: 10px;
      padding: 18px 24px;
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .total-label { font-size: 11px; font-weight: 800; color: #0284c7; letter-spacing: 1px; text-transform: uppercase; }
    .total-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .total-amount { font-size: 26px; font-weight: 900; color: #0f172a; }

    /* Pills */
    .pills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px;
      margin-top: 10px;
    }
    .pill {
      font-size: 10.5px;
      font-weight: 700;
      padding: 7px 10px;
      border-radius: 6px;
      text-align: center;
    }

    /* SLA Cards */
    .sla-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
    }
    .sla-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .sla-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .sla-val { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px; }

    /* Action Box */
    .action-container {
      margin-top: 36px;
      background: #f8fafc;
      border: 1.5px solid #bae6fd;
      border-radius: 12px;
      padding: 28px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
    }
    .form-label span.req { color: #dc2626; }
    .form-input {
      width: 100%;
      padding: 11px 14px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-size: 13px;
      font-family: inherit;
      color: #0f172a;
      background: #ffffff;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-input:focus { border-color: #0091D0; box-shadow: 0 0 0 3px rgba(0, 145, 208, 0.15); }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 12px;
      color: #334155;
      cursor: pointer;
      margin: 18px 0;
      line-height: 1.5;
    }
    .checkbox-label input { margin-top: 3px; cursor: pointer; }

    .btn-group {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 18px;
    }
    .btn {
      padding: 13px 26px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: none;
      transition: transform 0.1s, box-shadow 0.2s, background-color 0.2s;
    }
    .btn-primary {
      background: #059669;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
    }
    .btn-primary:hover { background: #047857; }
    .btn-secondary {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
    }
    .btn-secondary:hover { background: #f1f5f9; color: #0f172a; }
    .btn-decline {
      background: #ffffff;
      border: 1px solid #fecaca;
      color: #dc2626;
      font-size: 12px;
      padding: 10px 18px;
    }
    .btn-decline:hover { background: #fef2f2; }

    /* Print Styles */
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { border: none; box-shadow: none; max-width: 100%; }
      .action-container, .print-btn-box, .header-badge { display: none !important; }
      .mrc-card { border: 1px solid #10b981; }
      .total-card { border: 1px solid #0091D0; }
    }
    @media (max-width: 600px) {
      .content { padding: 20px 16px; }
      .header { padding: 20px 16px; }
      .form-row { grid-template-columns: 1fr; gap: 0; }
      .mrc-card { flex-direction: column; align-items: flex-start; }
      .total-card { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="top-accent"></div>

    <!-- Header -->
    <div class="header">
      <div class="logo-box">
        <a href="https://www.conexiaworld.com" target="_blank">
          <img src="https://billing.conexiaworld.com/conexia_logo.svg" alt="Conexia">
        </a>
        <div class="logo-sub">Carrier-Grade Connectivity Solutions</div>
      </div>
      <div>
        ${isAccepted
      ? '<span class="header-badge badge-approved">✓ Approved</span>'
      : (newerRevision
        ? '<span class="header-badge badge-amber">Superseded</span>'
        : (isExpired
          ? '<span class="header-badge badge-expired">Expired</span>'
          : (isRejected
            ? '<span class="header-badge badge-declined">Declined</span>'
            : (isDraftOrReview
              ? '<span class="header-badge badge-review">Internal Review</span>'
              : '<span class="header-badge badge-review">Ready for Approval</span>'))))}
      </div>
    </div>

    <!-- Main Content -->
    <div class="content">

      <!-- Status Alerts -->
      ${newerRevision && newerRevision.acceptance_token ? `
      <div class="banner banner-amber">
        <div class="banner-icon">ℹ️</div>
        <div>
          <div class="banner-title">Newer Revision Available (Rev. ${newerRevision.revision_number})</div>
          <div class="banner-desc">
            A newer revision of this commercial proposal has been prepared. Please <a href="?token=${encodeURIComponent(newerRevision.acceptance_token)}" style="color:#92400e;font-weight:800;text-decoration:underline;">Click Here to Review Revision ${newerRevision.revision_number} →</a>. Acceptance has been disabled on this older version.
          </div>
        </div>
      </div>` : ""}

      ${isDraftOrReview ? `
      <div class="banner banner-amber">
        <div class="banner-icon">⏳</div>
        <div>
          <div class="banner-title">Quotation Under Internal Review</div>
          <div class="banner-desc">
            This quotation is currently undergoing internal commercial review (Status: <strong>${escapeHtml(q.status)}</strong>) and has not yet been formally issued for acceptance.
          </div>
        </div>
      </div>` : ""}

      ${isAccepted ? `
      <div class="banner banner-green">
        <div class="banner-icon">✓</div>
        <div>
          <div class="banner-title">Quotation Approved</div>
          <div class="banner-desc">
            This proposal was officially accepted by <strong>${escapeHtml(q.accepted_by_name || q.customer_name)}</strong>${q.accepted_by_designation ? ` (${escapeHtml(q.accepted_by_designation)})` : ""} on <strong>${formatDateTime(q.accepted_at)}</strong>.${q.purchase_order_number ? ` PO Ref: <strong>${escapeHtml(q.purchase_order_number)}</strong>.` : ""} Our operations team has initiated link provisioning.
          </div>
        </div>
      </div>` : ""}

      ${isExpired ? `
      <div class="banner banner-amber">
        <div class="banner-icon">⚠️</div>
        <div>
          <div class="banner-title">Quotation Expired</div>
          <div class="banner-desc">
            This commercial proposal expired on <strong>${formatDate(q.valid_until)}</strong>. To request an updated quotation with current tariff validation, please contact your account representative <strong>${escapeHtml(repName)}</strong> at <a href="tel:${escapeHtml(repPhone)}" style="color:#92400e;font-weight:700;">${escapeHtml(repPhone)}</a>.
          </div>
        </div>
      </div>` : ""}

      ${isRejected ? `
      <div class="banner banner-red">
        <div class="banner-icon">✕</div>
        <div>
          <div class="banner-title">Proposal Closed / Declined</div>
          <div class="banner-desc">
            This proposal was closed on <strong>${formatDateTime(q.rejected_at)}</strong>.${q.rejection_reason ? ` Reason: <strong>${escapeHtml(q.rejection_reason)}</strong>.` : ""} Contact your representative for alternative plans.
          </div>
        </div>
      </div>` : ""}

      <!-- Executive Overview -->
      <table class="data-table" style="margin-bottom:20px;">
        <tr class="even">
          <td style="width:25%;" class="font-bold">Quotation Reference</td>
          <td style="width:25%;" class="highlight-blue">${escapeHtml(q.quotation_number ?? "QT-DRAFT")} (Rev.${q.revision_number})</td>
          <td style="width:25%;" class="font-bold">Quotation Date</td>
          <td style="width:25%;">${formatDate(q.quotation_date)}</td>
        </tr>
        <tr>
          <td class="font-bold">Customer / Client</td>
          <td>${escapeHtml(q.customer_name)}${q.company_name ? `<br><span style="font-size:11px;color:#64748b;">${escapeHtml(q.company_name)}</span>` : ""}</td>
          <td class="font-bold">Validity</td>
          <td>Until ${formatDate(q.valid_until)}</td>
        </tr>
        ${q.gstin ? `
        <tr class="even">
          <td class="font-bold">Client GSTIN</td>
          <td colspan="3">${escapeHtml(q.gstin)}</td>
        </tr>` : ""}
      </table>

      <!-- Connectivity Specifications -->
      <div class="section-title">🌐 CONNECTIVITY SPECIFICATIONS</div>
      <table class="data-table">
        <tr class="even">
          <td style="width:35%;" class="font-bold">Solution Type</td>
          <td>${formatConnectionType(q.connection_type)}</td>
        </tr>
        <tr>
          <td class="font-bold">Plan Name</td>
          <td class="highlight-blue">${escapeHtml(q.plan_name)}</td>
        </tr>
        <tr class="even">
          <td class="font-bold">Committed Bandwidth</td>
          <td class="font-bold">${escapeHtml(q.bandwidth)} (1:1 Symmetric Committed)</td>
        </tr>
        ${q.service_type && q.service_type.trim() ? `
        <tr>
          <td class="font-bold">Service Type</td>
          <td>${escapeHtml(q.service_type)}</td>
        </tr>` : ""}
        ${hasContract ? `
        <tr class="even">
          <td class="font-bold">Contract Commitment</td>
          <td>${contractMonths} Months</td>
        </tr>` : ""}
        <tr>
          <td class="font-bold">Billing Cycle</td>
          <td>${formatBillingCycle(q.billing_cycle)}</td>
        </tr>
        <tr class="even">
          <td class="font-bold">Payment Terms</td>
          <td>
            ${advanceRequired
      ? `${advanceMonths} Month${advanceMonths > 1 ? "s" : ""} Advance Rental${q.payment_terms ? ` • ${escapeHtml(q.payment_terms)}` : " Required"}`
      : (q.payment_terms ? escapeHtml(q.payment_terms) : "Postpaid (Monthly Billing)")}
          </td>
        </tr>
      </table>

      <!-- Feature Pills -->
      <div class="pills-grid">
        <div class="pill" style="background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;">⚡ 1:1 Symmetric</div>
        <div class="pill" style="background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;">🛡️ DDoS Protected</div>
        <div class="pill" style="background:#f5f3ff;border:1px solid #ddd6fe;color:#5b21b6;">🌐 24x7 NOC Support</div>
        <div class="pill" style="background:#ecfeff;border:1px solid #a5f3fc;color:#155e75;">📈 Low Latency Backbone</div>
      </div>

      <!-- MRC Highlight Card -->
      <div class="mrc-card">
        <div>
          <div class="mrc-label">MONTHLY RECURRING RENTAL (MRC)</div>
          <div class="mrc-amount">${formatAmount(q.monthly_rental)}<span style="font-size:14px;font-weight:600;color:#047857;"> / month</span></div>
          <div class="mrc-sub">+ applicable GST as per government notification</div>
        </div>
        ${hasContract ? `
        <div style="text-align:right;">
          <div style="font-size:11px;color:#64748b;font-weight:600;">Total Contract Value (${contractMonths} mo)</div>
          <div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:2px;">${formatAmount(contractValue)}</div>
        </div>` : ""}
      </div>

      <!-- One-Time Charges & Setup -->
      <div class="section-title">📋 ONE-TIME CHARGES (OTC) & SETUP</div>
      ${onetimeSubtotal > 0 ? `
      <table class="data-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${chargeRows.map((r, i) => `
          <tr class="${i % 2 === 0 ? "even" : ""}">
            <td>${escapeHtml(r.name)}</td>
            <td class="text-right font-bold">${formatAmount(r.amount)}</td>
          </tr>`).join("")}
          <tr class="even">
            <td class="font-bold">One-Time Subtotal</td>
            <td class="text-right font-bold">${formatAmount(onetimeSubtotal)}</td>
          </tr>
          ${discountAmt > 0 ? `
          <tr>
            <td style="color:#dc2626;">Discount (${q.discount_percentage}%)${q.discount_remarks ? ` · ${escapeHtml(q.discount_remarks)}` : ""}</td>
            <td class="text-right font-bold" style="color:#dc2626;">- ${formatAmount(discountAmt)}</td>
          </tr>` : ""}
          <tr>
            <td>Taxable Amount</td>
            <td class="text-right font-bold">${formatAmount(taxableAmt)}</td>
          </tr>
          ${isIntraState(q) ? `
          <tr class="even">
            <td>CGST (${q.cgst_percentage}%)</td>
            <td class="text-right">${formatAmount(q.cgst_amount ?? 0)}</td>
          </tr>
          <tr>
            <td>SGST (${q.sgst_percentage}%)</td>
            <td class="text-right">${formatAmount(q.sgst_amount ?? 0)}</td>
          </tr>` : `
          <tr class="even">
            <td>IGST (${q.igst_percentage}%)</td>
            <td class="text-right">${formatAmount(q.igst_amount ?? 0)}</td>
          </tr>`}
          <tr class="even">
            <td class="font-bold">One-Time Total (with GST)</td>
            <td class="text-right font-bold">${formatAmount(onetimeTotal)}</td>
          </tr>
          ${advanceRequired ? `
          <tr style="background:#f0fdf4;">
            <td class="font-bold highlight-green">Advance Rental (${advanceMonths} Month${advanceMonths > 1 ? "s" : ""})</td>
            <td class="text-right font-bold highlight-green">${formatAmount(advanceBaseRental)}</td>
          </tr>
          <tr>
            <td>GST on Advance (${isIntraState(q) ? `CGST ${q.cgst_percentage}% + SGST ${q.sgst_percentage}%` : `IGST ${q.igst_percentage}%`})</td>
            <td class="text-right font-bold">${formatAmount(advanceTotalTax)}</td>
          </tr>
          <tr style="background:#f0fdf4;">
            <td class="font-bold highlight-green">Advance Rental Total (with GST)</td>
            <td class="text-right font-bold highlight-green">${formatAmount(advanceTotalWithTax)}</td>
          </tr>` : ""}
          ${securityDeposit > 0 ? `
          <tr>
            <td>Security Deposit (Refundable)</td>
            <td class="text-right font-bold">${formatAmount(securityDeposit)}</td>
          </tr>` : ""}
        </tbody>
      </table>` : `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="background:#dcfce7;color:#15803d;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:800;margin-right:8px;">✓ WAIVED</span>
          <span style="font-size:13px;font-weight:700;">Zero One-Time Setup Charges</span>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">Installation, configuration, and hardware setup are fully included with zero upfront fee.</div>
        </div>
        <div style="font-size:15px;font-weight:800;color:#15803d;">₹0.00</div>
      </div>
      ${advanceRequired ? `
      <table class="data-table" style="margin-bottom:12px;">
        <thead>
          <tr style="background:#f0fdf4;color:#166534;">
            <th>Advance Commitment Breakdown</th>
            <th class="text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Advance Rental (${advanceMonths} Month${advanceMonths > 1 ? "s" : ""})</td>
            <td class="text-right font-bold">${formatAmount(advanceBaseRental)}</td>
          </tr>
          <tr class="even">
            <td>GST on Advance (${isIntraState(q) ? `CGST ${q.cgst_percentage}% + SGST ${q.sgst_percentage}%` : `IGST ${q.igst_percentage}%`})</td>
            <td class="text-right font-bold">${formatAmount(advanceTotalTax)}</td>
          </tr>
          <tr style="background:#f0fdf4;">
            <td class="font-bold highlight-green">Advance Rental Total (with GST)</td>
            <td class="text-right font-bold highlight-green">${formatAmount(advanceTotalWithTax)}</td>
          </tr>
          ${securityDeposit > 0 ? `
          <tr>
            <td>Security Deposit (Refundable)</td>
            <td class="text-right font-bold">${formatAmount(securityDeposit)}</td>
          </tr>` : ""}
        </tbody>
      </table>` : ""}
      `}

      <!-- Total Payable at Activation Banner -->
      <div class="total-card">
        <div>
          <div class="total-label">TOTAL PAYABLE AT ACTIVATION</div>
          <div class="total-sub">
            ${advanceRequired
      ? `Includes ${advanceMonths} month${advanceMonths > 1 ? "s" : ""} advance rental & GST${onetimeTotal > 0 ? ", setup charges" : ""}${securityDeposit > 0 ? ", security deposit" : ""}`
      : (totalPayable > 0 ? "Includes one-time setup, GST & security deposit" : "One-time setup is waived; monthly rental billed post-activation")}
          </div>
        </div>
        <div class="total-amount">${formatAmount(totalPayable)}</div>
      </div>

      <!-- SLA Commitments -->
      ${hasSla ? `
      <div class="section-title">⏱️ SERVICE LEVEL AGREEMENT (SLA) COMMITMENTS</div>
      <div class="sla-grid">
        ${q.uptime_guarantee ? `<div class="sla-card" style="border-left:3px solid #0091D0;"><div class="sla-label">Uptime SLA</div><div class="sla-val">${escapeHtml(q.uptime_guarantee)}</div></div>` : ""}
        ${q.support_type ? `<div class="sla-card" style="border-left:3px solid #059669;"><div class="sla-label">Support NOC</div><div class="sla-val">${escapeHtml(q.support_type)}</div></div>` : ""}
        ${q.response_time ? `<div class="sla-card" style="border-left:3px solid #d97706;"><div class="sla-label">Response SLA</div><div class="sla-val">${escapeHtml(q.response_time)}</div></div>` : ""}
        ${q.resolution_time ? `<div class="sla-card" style="border-left:3px solid #7c3aed;"><div class="sla-label">Resolution SLA</div><div class="sla-val">${escapeHtml(q.resolution_time)}</div></div>` : ""}
      </div>` : ""}

      <!-- Scope of Work & Deliverables -->
      ${((q.inclusions && q.inclusions.length > 0) || (q.exclusions && q.exclusions.length > 0)) ? `
      <div class="section-title">📦 SCOPE OF WORK & DELIVERABLES</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:14px;margin-bottom:20px;">
        ${q.inclusions && q.inclusions.length > 0 ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;">
          <div style="font-size:11px;font-weight:800;color:#166534;margin-bottom:6px;text-transform:uppercase;">✓ Included in Scope</div>
          <ul style="margin:0;padding-left:16px;font-size:12px;color:#14532d;line-height:1.6;">
            ${q.inclusions.map(inc => `<li>${escapeHtml(inc)}</li>`).join("")}
          </ul>
        </div>` : ""}
        ${q.exclusions && q.exclusions.length > 0 ? `
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;">
          <div style="font-size:11px;font-weight:800;color:#991b1b;margin-bottom:6px;text-transform:uppercase;">✕ Excluded from Scope</div>
          <ul style="margin:0;padding-left:16px;font-size:12px;color:#7f1d1d;line-height:1.6;">
            ${q.exclusions.map(exc => `<li>${escapeHtml(exc)}</li>`).join("")}
          </ul>
        </div>` : ""}
      </div>` : ""}

      <!-- Terms & Conditions Section -->
      <div class="section-title">${hasExplicitTerms ? "TERMS & CONDITIONS" : "COMMERCIAL CLAUSES & PAYMENT TERMS"}</div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;font-size:12px;color:#475569;line-height:1.6;">
        ${hasExplicitTerms ? `
        <div style="margin-bottom:8px;">${escapeHtml(q.terms_and_conditions!)}</div>` : `
        <p style="margin-bottom:6px;font-weight:700;color:#1e293b;">Standard Commercial Conditions:</p>
        <ul style="margin:0;padding-left:18px;">
          <li><strong>Service Delivery:</strong> Installation and commissioning within standard committed timelines upon order confirmation.</li>
          <li><strong>Invoicing & Taxation:</strong> All recurring and one-time charges are subject to statutory GST (18%). Invoices billed in advance as per billing cycle.</li>
          <li><strong>Handover & Acceptance:</strong> Service handover notice issued upon link stabilization and ping test sign-off.</li>
        </ul>`}

        ${advanceRequired ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 14px;color:#166534;font-size:12px;margin-top:10px;">
          <strong>💳 Advance Payment:</strong> ${advanceMonths} month${advanceMonths > 1 ? "s" : ""} advance rental (${formatAmount(advanceTotalWithTax)} incl. GST) payable upon order confirmation prior to link activation.
        </div>` : ""}

        ${q.special_notes ? `
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;color:#92400e;font-size:12px;margin-top:10px;">
          <strong>Special Note:</strong> ${escapeHtml(q.special_notes)}
        </div>` : ""}
      </div>

      <!-- Action Box -->
      ${!isAccepted && !isExpired && !isRejected && !isDraftOrReview && !newerRevision ? `
      <div class="action-container" id="accept-section">
        <h3 style="font-size:16px;font-weight:800;color:#0f172a;margin-bottom:4px;">
          Accept Quotation & Authorize Order
        </h3>
        <p style="font-size:12px;color:#64748b;margin-bottom:20px;">
          Please provide your details below to authorize delivery of this enterprise connectivity service.
        </p>

        <form method="POST" action="" id="accept-form" onsubmit="event.preventDefault(); handleAcceptSubmit();">
          <input type="hidden" name="token" value="${escapeHtml(token)}">
          <input type="hidden" name="action" value="accept">

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name <span class="req">*</span></label>
              <input type="text" id="accepted_by_name" name="accepted_by_name" class="form-input" value="${escapeHtml(q.customer_name)}" required maxlength="100">
            </div>
            <div class="form-group">
              <label class="form-label">Corporate Title / Designation <span class="req">*</span></label>
              <input type="text" id="accepted_by_designation" name="accepted_by_designation" class="form-input" placeholder="e.g. Director of IT / Purchase Head" required maxlength="100">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Purchase Order (PO) Number <span style="font-size:11px;color:#64748b;">(Optional)</span></label>
              <input type="text" id="purchase_order_number" name="purchase_order_number" class="form-input" placeholder="e.g. PO-2026-8801" maxlength="50">
            </div>
            <div class="form-group">
              <label class="form-label">Special Delivery Remarks <span style="font-size:11px;color:#64748b;">(Optional)</span></label>
              <input type="text" id="acceptance_remarks" name="acceptance_remarks" class="form-input" placeholder="e.g. Server rack on 3rd floor" maxlength="200">
            </div>
          </div>

          <label class="checkbox-label">
            <input type="checkbox" id="consent_checkbox" name="consent_checkbox" required>
            <span>I confirm that I am authorized on behalf of <strong>${escapeHtml(q.company_name || q.customer_name)}</strong> to approve this quotation and place the order in accordance with Conexia Telecom Private Limited commercial terms.</span>
          </label>

          <div class="btn-group">
            <button type="button" class="btn btn-primary" id="submit-btn" onclick="handleAcceptSubmit();">
              ✓ Confirm & Accept Quotation
            </button>
            <button type="button" class="btn btn-secondary" onclick="window.print();">
              🖨️ Print / Download PDF
            </button>
          </div>
        </form>

      </div>` : `
      <div style="margin-top:24px;text-align:center;" class="print-btn-box">
        <button type="button" class="btn btn-secondary" onclick="window.print();">
          🖨️ Print / Download PDF Copy
        </button>
      </div>`}

    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 36px;color:#64748b;font-size:11px;text-align:center;line-height:1.6;">
      <div style="font-weight:800;color:#0f172a;font-size:12px;margin-bottom:3px;">CONEXIA TELECOM PRIVATE LIMITED</div>
      <div>Class-A ISP Licensed by Department of Telecommunications (DoT), Govt. of India</div>
      <div>Regd. Office: C-61/2, Arjun Nagar, Safdarjung Enclave Extn., New Delhi 110029, India</div>
      <div style="margin-top:6px;"><a href="https://www.conexiaworld.com" target="_blank" style="color:#0091D0;text-decoration:none;font-weight:700;">www.conexiaworld.com</a></div>
    </div>
  </div>

  <script>
    function syncSubmitButtonState() {
      var nameEl = document.getElementById('accepted_by_name');
      var desigEl = document.getElementById('accepted_by_designation');
      var submitBtn = document.getElementById('submit-btn');
      if (!submitBtn) return;
      var nameVal = (nameEl ? nameEl.value : '').trim();
      var desigVal = (desigEl ? desigEl.value : '').trim();
      if (nameVal.length > 0 && desigVal.length > 0) {
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      } else {
        submitBtn.style.opacity = '0.55';
        submitBtn.style.cursor = 'not-allowed';
      }
    }

    function handleAcceptSubmit() {
      var form = document.getElementById('accept-form');
      var nameEl = document.getElementById('accepted_by_name');
      var desigEl = document.getElementById('accepted_by_designation');
      var consentEl = document.getElementById('consent_checkbox');
      var submitBtn = document.getElementById('submit-btn');

      if (!form || !submitBtn) return;

      var nameVal = (nameEl ? nameEl.value : '').trim();
      var desigVal = (desigEl ? desigEl.value : '').trim();

      if (!nameVal) {
        if (nameEl) {
          nameEl.focus();
          nameEl.reportValidity();
        }
        return;
      }

      if (!desigVal) {
        if (desigEl) {
          desigEl.focus();
          desigEl.reportValidity();
        }
        return;
      }

      if (consentEl && !consentEl.checked) {
        consentEl.focus();
        consentEl.reportValidity();
        return;
      }

      submitBtn.innerHTML = 'Processing...';
      submitBtn.style.opacity = '0.7';
      submitBtn.style.pointerEvents = 'none';
      form.submit();
    }

    (function() {
      var nameEl = document.getElementById('accepted_by_name');
      var desigEl = document.getElementById('accepted_by_designation');
      if (nameEl) nameEl.addEventListener('input', syncSubmitButtonState);
      if (desigEl) desigEl.addEventListener('input', syncSubmitButtonState);
      syncSubmitButtonState();
    })();
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// Success & Error Screens
// ─────────────────────────────────────────────────────────────

function renderSuccessPage(
  q: Quotation,
  repName: string,
  repPhone: string,
  title: string,
  token?: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Conexia Enterprise</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background:#f1f5f9; padding:40px 16px; margin:0; color:#0f172a; text-align:center; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 40px 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
    .check { width: 64px; height: 64px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px; font-weight: 800; }
    h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    p { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
    .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; text-align: left; font-size: 13px; margin-bottom: 24px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .row:last-child { margin-bottom: 0; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; background: #0091D0; color: #fff; font-weight: 700; font-size: 13px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">✓</div>
    <h1>Thank You! Quotation Approved</h1>
    <p>Your acceptance of quotation <strong>${escapeHtml(q.quotation_number ?? "QT-DRAFT")}</strong> for <strong>${escapeHtml(q.plan_name)} (${escapeHtml(q.bandwidth)})</strong> has been successfully recorded.</p>

    <div class="summary-box">
      <div class="row"><span style="color:#64748b;">Authorized By:</span><strong>${escapeHtml(q.accepted_by_name ?? q.customer_name)}${q.accepted_by_designation ? ` (${escapeHtml(q.accepted_by_designation)})` : ""}</strong></div>
      <div class="row"><span style="color:#64748b;">Timestamp:</span><strong>${formatDateTime(q.accepted_at)}</strong></div>
      ${q.purchase_order_number ? `<div class="row"><span style="color:#64748b;">PO Number:</span><strong>${escapeHtml(q.purchase_order_number)}</strong></div>` : ""}
      <div class="row"><span style="color:#64748b;">Monthly Rental (MRC):</span><strong style="color:#059669;">${formatAmount(q.monthly_rental)} / mo (+ GST)</strong></div>
      <div class="row"><span style="color:#64748b;">Activation Due:</span><strong style="color:#0284c7;">${formatAmount(q.total_payable_now ?? 0)}</strong></div>
    </div>

    <p style="font-size:12px;color:#0f172a;"><strong>What's Next?</strong><br>Our technical provisioning team will reach out within 24 hours to schedule hardware dispatch and on-site fiber termination.</p>

    <div style="margin-top:20px;">
      ${token ? `<a href="?token=${encodeURIComponent(token)}" class="btn" style="background:#ffffff;color:#475569;border:1px solid #cbd5e1;margin-right:8px;">← Return to Proposal</a>` : ""}
      <a href="tel:${escapeHtml(repPhone)}" class="btn">📞 Contact ${escapeHtml(repName)}</a>
    </div>
  </div>
</body>
</html>`;
}

function renderDeclinedPage(
  q: Quotation,
  reason: string,
  repName: string,
  repPhone: string,
  repEmail: string,
  token?: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedback Received | Conexia Enterprise</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background:#f1f5f9; padding:40px 16px; margin:0; color:#0f172a; text-align:center; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 40px 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
    h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    p { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; background: #0091D0; color: #fff; font-weight: 700; font-size: 13px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:36px;margin-bottom:14px;">✉️</div>
    <h1>Feedback Submitted</h1>
    <p>Thank you for your response regarding proposal <strong>${escapeHtml(q.quotation_number ?? "QT-DRAFT")}</strong>. We have informed your account manager <strong>${escapeHtml(repName)}</strong> about: <em>"${escapeHtml(reason)}"</em>.</p>
    <p style="font-size:12px;">We will prepare revised commercials aligned with your requirements shortly.</p>
    <div style="margin-top:20px;">
      ${token ? `<a href="?token=${encodeURIComponent(token)}" class="btn" style="background:#ffffff;color:#475569;border:1px solid #cbd5e1;margin-right:8px;">← Return to Proposal</a>` : ""}
      <a href="tel:${escapeHtml(repPhone)}" class="btn">📞 Speak with ${escapeHtml(repName)}</a>
    </div>
  </div>
</body>
</html>`;
}

function renderErrorPage(
  title: string,
  message: string,
  repPhone?: string,
  repEmail?: string,
  showRetry?: boolean,
  token?: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Conexia Enterprise</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background:#f1f5f9; padding:40px 16px; margin:0; color:#0f172a; text-align:center; }
    .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 40px 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
    h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    p { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; background: #0091D0; color: #fff; font-weight: 700; font-size: 13px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:36px;margin-bottom:14px;">⚠️</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    ${showRetry && token ? `<a href="?token=${encodeURIComponent(token)}" class="btn" style="background:#059669;margin-right:8px;">← Go Back & Try Again</a>` : ""}
    ${repPhone ? `<a href="tel:${escapeHtml(repPhone)}" class="btn">📞 Call Representative</a>` : `<a href="https://www.conexiaworld.com" class="btn">Visit Conexia Homepage</a>`}
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function isIntraState(q: Quotation): boolean {
  if (q.igst_percentage && q.igst_percentage > 0) return false;
  if (q.cgst_percentage && q.cgst_percentage > 0) return true;
  return true;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "30 Days from Issue";
  try {
    const trimmed = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parts = trimmed.split("-").map(Number);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${parts[2]} ${months[parts[1] - 1]} ${parts[0]}`;
    }
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "Recently";
  try {
    const d = new Date(dateStr);
    const datePart = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
    const timePart = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d).toUpperCase();
    return `${datePart} at ${timePart} IST`;
  } catch {
    return dateStr;
  }
}

function isDatePassed(dateStr: string): boolean {
  try {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      // IST is UTC+5:30, so 23:59:59 IST is 18:29:59 UTC
      const expiryUtc = Date.UTC(year, month, day, 18, 29, 59, 999);
      return expiryUtc < Date.now();
    }
    const target = new Date(dateStr);
    return target.getTime() < Date.now();
  } catch {
    return false;
  }
}

function formatAmount(amount: number | null | undefined): string {
  const num = typeof amount === "number" && !isNaN(amount) ? amount : Number(amount) || 0;
  return "₹" + num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


function formatConnectionType(type?: string): string {
  if (!type) return "—";
  const map: Record<string, string> = {
    leased_line: "Leased Line (ILL)",
    broadband: "Broadband",
    mpls: "MPLS VPN",
    sd_wan: "SD-WAN",
    cloud_telephony: "Cloud Telephony",
    sip_trunk: "SIP Trunk",
    voip: "VoIP",
    point_to_point: "Point to Point (P2P)",
  };
  const key = type.toLowerCase().trim();
  if (map[key]) return map[key];
  return type.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatBillingCycle(cycle?: string | null): string {
  if (!cycle) return "Monthly in Advance";
  const map: Record<string, string> = {
    monthly: "Monthly in Advance",
    quarterly: "Quarterly in Advance",
    semi_annually: "Semi-Annually in Advance",
    annually: "Annually in Advance",
  };
  const key = cycle.toLowerCase().trim();
  return map[key] || (cycle.charAt(0).toUpperCase() + cycle.slice(1));
}

function escapeHtml(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
