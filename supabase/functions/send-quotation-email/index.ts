// =============================================================================
// send-quotation-email — Supabase Edge Function
// =============================================================================
//
// Sends a quotation email to a customer using the Resend API.
//
// REQUIRED SECRETS (set via `supabase secrets set`):
//   RESEND_API_KEY         — Your Resend API key
//   RESEND_FROM_DOMAIN     — Verified sender domain (e.g. mail.conexiaworld.com)
//   SUPABASE_URL           — Auto-provided by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — Auto-provided by Supabase
//
// REQUEST BODY:
//   {
//     "quotation_id": number,
//     "recipient_email": string
//   }
//
// RESPONSE:
//   {
//     "success": boolean,
//     "message_id": string | null,
//     "error": string | null
//   }
// =============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

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
  security_deposit: number;
  discount_percentage: number;
  discount_remarks: string | null;
  onetime_subtotal: number | null;
  discount_amount: number | null;
  taxable_amount: number | null;
  cgst_percentage: number;
  sgst_percentage: number;
  igst_percentage: number;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  onetime_total_with_tax: number | null;
  total_payable_now: number | null;
  total_contract_value: number | null;
  contract_period_months: number | null;
  billing_cycle: string;
  payment_terms: string | null;
  advance_payment_required: boolean;
  advance_payment_months: number;
  terms_and_conditions: string | null;
  special_notes: string | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  uptime_guarantee: string | null;
  support_type: string | null;
  response_time: string | null;
  resolution_time: string | null;
  quotation_date: string | null;
  valid_until: string | null;
  revision_number: number;
  status: string;
  prepared_by: string | null;
  sent_to_email: string | null;
  acceptance_token: string | null;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const trimmed = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parts = trimmed.split("-").map(Number);
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
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

function formatAmount(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

function isIntraState(q: Quotation): boolean {
  return q.cgst_percentage > 0 && q.sgst_percentage > 0;
}

// ─────────────────────────────────────────────────────────────
// Email HTML Template — Conexia Carrier-Grade Design
// ─────────────────────────────────────────────────────────────

function buildEmailHtml(
  q: Quotation,
  employeePhone?: string | null,
  employeeName?: string | null,
  portalUrl?: string | null
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
  const advanceRequired = Boolean(q.advance_payment_required);
  const advanceMonths = advanceRequired ? Math.max(1, q.advance_payment_months || 1) : 0;
  const advanceBaseRental = advanceRequired && q.monthly_rental > 0
    ? q.monthly_rental * advanceMonths
    : 0;

  // Advance tax
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
  const chargeRows: string[] = [];
  if (q.installation_charges > 0)
    chargeRows.push(chargeRow("Installation Charges", q.installation_charges));
  if (q.equipment_charges > 0)
    chargeRows.push(chargeRow("Equipment Charges", q.equipment_charges));
  if (q.router_charges > 0)
    chargeRows.push(chargeRow("Router Charges", q.router_charges));
  if (q.ont_charges > 0)
    chargeRows.push(chargeRow("ONT Charges", q.ont_charges));
  if (q.static_ip_charges > 0)
    chargeRows.push(chargeRow("Static IP Charges", q.static_ip_charges));
  if (q.other_charges > 0)
    chargeRows.push(
      chargeRow(q.other_charges_description || "Other Charges", q.other_charges)
    );

  const calculatedCgst = q.cgst_amount ?? (taxableAmt > 0 && q.cgst_percentage > 0 ? Math.round(taxableAmt * (q.cgst_percentage / 100) * 100) / 100 : 0);
  const calculatedSgst = q.sgst_amount ?? (taxableAmt > 0 && q.sgst_percentage > 0 ? Math.round(taxableAmt * (q.sgst_percentage / 100) * 100) / 100 : 0);
  const calculatedIgst = q.igst_amount ?? (taxableAmt > 0 && q.igst_percentage > 0 ? Math.round(taxableAmt * (q.igst_percentage / 100) * 100) / 100 : 0);

  const taxRows = isIntraState(q)
    ? `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#475569;">CGST (${q.cgst_percentage}%)</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right;font-weight:600;color:#0f172a;">${formatAmount(Math.max(0, calculatedCgst))}</td></tr>
       <tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#475569;">SGST (${q.sgst_percentage}%)</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right;font-weight:600;color:#0f172a;">${formatAmount(Math.max(0, calculatedSgst))}</td></tr>`
    : `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#475569;">IGST (${q.igst_percentage}%)</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right;font-weight:600;color:#0f172a;">${formatAmount(Math.max(0, calculatedIgst))}</td></tr>`;

  // SLA check
  const hasSla = Boolean(
    (q.uptime_guarantee && q.uptime_guarantee.trim().length > 0) ||
    (q.support_type && q.support_type.trim().length > 0) ||
    (q.response_time && q.response_time.trim().length > 0) ||
    (q.resolution_time && q.resolution_time.trim().length > 0)
  );

  // Terms & Conditions check — renders if any term, advance condition, or note exists
  const hasTerms = Boolean(
    (q.terms_and_conditions && q.terms_and_conditions.trim().length > 0) ||
    advanceRequired ||
    (q.payment_terms && q.payment_terms.trim().length > 0) ||
    (q.special_notes && q.special_notes.trim().length > 0) ||
    (q.inclusions && q.inclusions.length > 0) ||
    (q.exclusions && q.exclusions.length > 0)
  );

  // Conexia Official Hosted Logo (Accessible by Gmail, Outlook, Apple Mail, etc.)
  const conexiaLogoUrl = "https://billing.conexiaworld.com/conexia_logo.svg";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation ${q.quotation_number ?? "Draft"} | Conexia</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f1f5f9;color:#1e293b;line-height:1.5;">

  <!-- Outer Canvas (Light, Clean) -->
  <div style="background-color:#f1f5f9;padding:24px 12px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">

      <!-- Top Accent Bar (Conexia Magenta to Blue) -->
      <div style="height:4px;background:linear-gradient(90deg,#B62175 0%,#0091D0 100%);"></div>

      <!-- Executive Header (Clean White with Conexia Official Hosted Logo) -->
      <div style="background:#ffffff;padding:24px 32px;border-bottom:1px solid #f1f5f9;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="vertical-align:middle;">
              <!-- Conexia Logo Image above Carrier-Grade Connectivity Solutions -->
              <div style="display:block;margin-bottom:6px;">
                <a href="https://www.conexiaworld.com" target="_blank" style="text-decoration:none;display:inline-block;">
                  <img src="${conexiaLogoUrl}" alt="CONEXIA" width="160" style="display:block;width:160px;max-width:160px;height:auto;border:0;outline:none;text-decoration:none;" />
                </a>
              </div>
              <div style="font-size:11px;font-weight:600;color:#64748b;letter-spacing:0.5px;">
                Carrier-Grade Connectivity Solutions
              </div>
            </td>
            <td style="vertical-align:middle;text-align:right;">
              <span style="display:inline-block;background:#e0f2fe;border:1px solid #bae6fd;color:#0369a1;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                QUOTATION
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Metadata Strip -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-bottom:1px solid #e2e8f0;border-collapse:collapse;">
        <tr>
          <td style="padding:14px 20px;border-right:1px solid #e2e8f0;width:33%;">
            <div style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:0.8px;text-transform:uppercase;">Quotation Ref</div>
            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-top:2px;">
              ${q.quotation_number ?? "DRAFT"}
              ${q.revision_number > 1 ? `<span style="font-size:10px;background:#ede9fe;color:#6d28d9;padding:2px 6px;border-radius:4px;margin-left:4px;">Rev.${q.revision_number}</span>` : ""}
            </div>
          </td>
          <td style="padding:14px 20px;border-right:1px solid #e2e8f0;width:33%;">
            <div style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:0.8px;text-transform:uppercase;">Issue Date</div>
            <div style="font-size:13px;font-weight:700;color:#0f172a;margin-top:2px;">${formatDate(q.quotation_date)}</div>
          </td>
          <td style="padding:14px 20px;width:34%;text-align:right;">
            <div style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:0.8px;text-transform:uppercase;">Validity</div>
            <div style="font-size:13px;font-weight:700;color:#0284c7;margin-top:2px;">${q.valid_until ? `Until ${formatDate(q.valid_until)}` : "30 Days"}</div>
          </td>
        </tr>
      </table>

      <!-- Main Body Container -->
      <div style="padding:28px 32px;">

        <!-- Executive Greeting (Conexia only, removed Enterprise) -->
        <p style="font-size:15px;color:#1e293b;margin:0 0 18px 0;line-height:1.6;">
          Dear <strong>${q.customer_name}</strong>,<br><br>
          Thank you for choosing <strong>Conexia</strong>. We are pleased to present our official quotation tailored for <strong>${q.company_name && q.company_name.trim() ? q.company_name : q.customer_name}</strong> to deliver high-capacity connectivity.
        </p>

        <!-- Customer Card -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="vertical-align:top;">
                <div style="font-size:11px;font-weight:800;color:#0091D0;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">CLIENT INFORMATION</div>
                <div style="font-size:15px;font-weight:800;color:#0f172a;">${q.customer_name}</div>
                ${q.company_name && q.company_name.trim() ? `<div style="font-size:13px;font-weight:600;color:#475569;margin-top:2px;">${q.company_name}</div>` : ""}
                ${q.customer_address && q.customer_address.trim() ? `<div style="font-size:12px;color:#64748b;margin-top:4px;line-height:1.4;">📍 ${q.customer_address}</div>` : ""}
              </td>
              <td style="vertical-align:top;text-align:right;font-size:12px;color:#64748b;line-height:1.6;">
                ${q.customer_phone && q.customer_phone.trim() ? `<div>📞 <strong style="color:#0f172a;">${q.customer_phone}</strong></div>` : ""}
                ${q.customer_email && q.customer_email.trim() ? `<div>✉️ <span style="color:#0284c7;">${q.customer_email}</span></div>` : ""}
                ${q.gstin && q.gstin.trim() ? `<div style="margin-top:4px;"><span style="background:#e2e8f0;color:#334155;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">GSTIN: ${q.gstin}</span></div>` : ""}
              </td>
            </tr>
          </table>
        </div>

        <!-- Service Architecture Card -->
        <div style="margin-bottom:24px;">
          <div style="font-size:12px;font-weight:800;color:#0f172a;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">
            🌐 CONNECTIVITY SPECIFICATIONS
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tr style="background:#f8fafc;">
              <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;width:35%;">Solution Type</td>
              <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#0f172a;">${formatConnectionType(q.connection_type)}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;">Plan Name</td>
              <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#0091D0;">${q.plan_name}</td>
            </tr>
            <tr style="background:#f8fafc;">
              <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;">Committed Bandwidth</td>
              <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:800;color:#0f172a;">${q.bandwidth} (1:1 Symmetric)</td>
            </tr>
            ${q.service_type && q.service_type.trim() ? `
            <tr>
              <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;">Service Type</td>
              <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#0f172a;">${q.service_type}</td>
            </tr>` : ""}
            ${hasContract ? `
            <tr style="background:#f8fafc;">
              <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;">Contract Commitment</td>
              <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#0f172a;">${contractMonths} Months</td>
            </tr>` : ""}
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;">Billing Cycle</td>
              <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#0f172a;text-transform:capitalize;">${q.billing_cycle}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:12px;color:#64748b;">Payment Terms</td>
              <td style="padding:10px 16px;font-size:13px;font-weight:700;color:#0f172a;">
                ${advanceRequired
                  ? `<span style="color:#0284c7;">${advanceMonths} Month${advanceMonths > 1 ? "s" : ""} Advance Rental${q.payment_terms ? ` • ${q.payment_terms}` : " Required"}</span>`
                  : (q.payment_terms && q.payment_terms.trim() ? q.payment_terms : "Postpaid (Monthly Billing)")}
              </td>
            </tr>
          </table>

          <!-- Feature Pills -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border-collapse:collapse;">
            <tr>
              <td style="padding:4px;width:25%;">
                <div style="background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;font-size:10px;font-weight:700;padding:6px 8px;border-radius:6px;text-align:center;">
                  ⚡ 1:1 Symmetric
                </div>
              </td>
              <td style="padding:4px;width:25%;">
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;font-size:10px;font-weight:700;padding:6px 8px;border-radius:6px;text-align:center;">
                  🛡️ DDoS Protected
                </div>
              </td>
              <td style="padding:4px;width:25%;">
                <div style="background:#f5f3ff;border:1px solid #ddd6fe;color:#5b21b6;font-size:10px;font-weight:700;padding:6px 8px;border-radius:6px;text-align:center;">
                  🌐 24x7 NOC Support
                </div>
              </td>
              <td style="padding:4px;width:25%;">
                <div style="background:#ecfeff;border:1px solid #a5f3fc;color:#155e75;font-size:10px;font-weight:700;padding:6px 8px;border-radius:6px;text-align:center;">
                  📈 Low Latency
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Monthly Recurring Rental (MRC) Highlight -->
        <div style="background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:1px solid #6ee7b7;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="vertical-align:middle;">
                <div style="font-size:11px;font-weight:800;color:#047857;letter-spacing:1px;text-transform:uppercase;">MONTHLY RECURRING RENTAL (MRC)</div>
                <div style="font-size:26px;font-weight:900;color:#065f46;margin-top:2px;">
                  ${formatAmount(q.monthly_rental)}<span style="font-size:13px;font-weight:600;color:#047857;"> / month</span>
                </div>
                <div style="font-size:11px;color:#047857;margin-top:2px;">+ applicable GST as per state rules</div>
              </td>
              ${hasContract ? `
              <td style="vertical-align:middle;text-align:right;">
                <div style="font-size:11px;color:#64748b;font-weight:600;">Total Contract Value (${contractMonths} mo)</div>
                <div style="font-size:17px;font-weight:800;color:#0f172a;margin-top:2px;">
                  ${formatAmount(contractValue)}
                </div>
              </td>` : ""}
            </tr>
          </table>
        </div>

        <!-- One-Time Charges Section (Clean Light Table, No Black Header) -->
        <div style="margin-bottom:24px;">
          <div style="font-size:12px;font-weight:800;color:#0f172a;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">
            📋 ONE-TIME CHARGES (OTC) & SETUP
          </div>

          ${onetimeSubtotal > 0 ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc;color:#475569;border-bottom:2px solid #e2e8f0;">
                <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Description</th>
                <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${chargeRows.join("\n")}
              <tr style="background:#f8fafc;">
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:700;color:#334155;">One-Time Subtotal</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:800;color:#0f172a;">${formatAmount(onetimeSubtotal)}</td>
              </tr>
              ${discountAmt > 0 ? `
              <tr>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#dc2626;">
                  Discount (${q.discount_percentage}%)${q.discount_remarks ? ` · <span style="font-size:11px;color:#64748b;">${q.discount_remarks}</span>` : ""}
                </td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:700;color:#dc2626;">- ${formatAmount(discountAmt)}</td>
              </tr>` : ""}
              <tr>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">Taxable Amount</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:700;color:#0f172a;">${formatAmount(taxableAmt)}</td>
              </tr>
              ${taxRows}
              <tr style="background:#f8fafc;">
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:700;color:#0f172a;">One-Time Total (with GST)</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:800;color:#0f172a;">${formatAmount(onetimeTotal)}</td>
              </tr>
              ${advanceRequired ? `
              <tr style="background:#f0fdf4;">
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:700;color:#166534;">
                  Advance Rental (${advanceMonths} Month${advanceMonths > 1 ? "s" : ""})
                </td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:800;color:#166534;">
                  ${formatAmount(advanceBaseRental)}
                </td>
              </tr>
              <tr>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">
                  GST on Advance (${isIntraState(q) ? `CGST ${q.cgst_percentage}% + SGST ${q.sgst_percentage}%` : `IGST ${q.igst_percentage}%`})
                </td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:600;color:#0f172a;">
                  ${formatAmount(advanceTotalTax)}
                </td>
              </tr>
              <tr style="background:#f0fdf4;">
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:700;color:#15803d;">
                  Advance Rental Total (with GST)
                </td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:800;color:#15803d;">
                  ${formatAmount(advanceTotalWithTax)}
                </td>
              </tr>` : ""}
              ${securityDeposit > 0 ? `
              <tr>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">Security Deposit (Refundable)</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:700;color:#0f172a;">${formatAmount(securityDeposit)}</td>
              </tr>` : ""}
            </tbody>
          </table>
          ` : `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;margin-bottom:10px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td>
                  <span style="display:inline-block;background:#dcfce7;color:#15803d;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:800;margin-right:8px;">✓ WAIVED</span>
                  <span style="font-size:13px;font-weight:700;color:#0f172a;">Zero One-Time Setup Charges</span>
                  <div style="font-size:11px;color:#64748b;margin-top:2px;">Installation, configuration, and hardware setup are fully included with zero upfront fee.</div>
                </td>
                <td style="text-align:right;font-size:14px;font-weight:800;color:#15803d;">₹0.00</td>
              </tr>
            </table>
          </div>
          ${advanceRequired ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:10px;">
            <thead>
              <tr style="background:#f0fdf4;color:#166534;border-bottom:2px solid #bbf7d0;">
                <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Advance Commitment</th>
                <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">Advance Rental (${advanceMonths} Month${advanceMonths > 1 ? "s" : ""})</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:700;color:#0f172a;">${formatAmount(advanceBaseRental)}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">GST on Advance (${isIntraState(q) ? `CGST ${q.cgst_percentage}% + SGST ${q.sgst_percentage}%` : `IGST ${q.igst_percentage}%`})</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:600;color:#0f172a;">${formatAmount(advanceTotalTax)}</td>
              </tr>
              <tr style="background:#f0fdf4;">
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:700;color:#15803d;">Advance Rental Total (with GST)</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:800;color:#15803d;">${formatAmount(advanceTotalWithTax)}</td>
              </tr>
              ${securityDeposit > 0 ? `
              <tr>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">Security Deposit (Refundable)</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:700;color:#0f172a;">${formatAmount(securityDeposit)}</td>
              </tr>` : ""}
            </tbody>
          </table>` : ""}
          `}

          <!-- Total Payable Now Banner (Clean Highlighted Card, No Black) -->
          <div style="background:#f0f9ff;border:1.5px solid #0091D0;border-radius:10px;padding:16px 20px;margin-top:14px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="vertical-align:middle;">
                  <div style="font-size:11px;font-weight:800;color:#0284c7;letter-spacing:1px;text-transform:uppercase;">TOTAL PAYABLE AT ACTIVATION</div>
                  <div style="font-size:11px;color:#64748b;margin-top:2px;">
                    ${advanceRequired
                      ? `Includes ${advanceMonths} month${advanceMonths > 1 ? "s" : ""} advance rental & GST${onetimeTotal > 0 ? ", setup charges" : ""}${securityDeposit > 0 ? ", security deposit" : ""}`
                      : (totalPayable > 0 ? "Includes one-time setup, GST & security deposit" : "One-time setup is waived; monthly rental billed post-activation")}
                  </div>
                </td>
                <td style="vertical-align:middle;text-align:right;">
                  <span style="font-size:24px;font-weight:900;color:#0f172a;letter-spacing:0.5px;">${formatAmount(totalPayable)}</span>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Enterprise SLA Commitments (Rendered only if provided) -->
        ${hasSla ? `
        <div style="margin-bottom:24px;">
          <div style="font-size:12px;font-weight:800;color:#0f172a;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">
            ⏱️ SERVICE LEVEL AGREEMENT (SLA) COMMITMENTS
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              ${q.uptime_guarantee && q.uptime_guarantee.trim() ? `
              <td style="padding:6px;width:50%;">
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #0091D0;border-radius:8px;padding:12px 14px;">
                  <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Uptime Guarantee</div>
                  <div style="font-size:15px;font-weight:800;color:#0f172a;margin-top:2px;">${q.uptime_guarantee}</div>
                </div>
              </td>` : ""}
              ${q.support_type && q.support_type.trim() ? `
              <td style="padding:6px;width:50%;">
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #059669;border-radius:8px;padding:12px 14px;">
                  <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Support Operations</div>
                  <div style="font-size:15px;font-weight:800;color:#0f172a;margin-top:2px;">${q.support_type}</div>
                </div>
              </td>` : ""}
            </tr>
            <tr>
              ${q.response_time && q.response_time.trim() ? `
              <td style="padding:6px;width:50%;">
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #d97706;border-radius:8px;padding:12px 14px;">
                  <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Response Time SLA</div>
                  <div style="font-size:15px;font-weight:800;color:#0f172a;margin-top:2px;">${q.response_time}</div>
                </div>
              </td>` : ""}
              ${q.resolution_time && q.resolution_time.trim() ? `
              <td style="padding:6px;width:50%;">
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #7c3aed;border-radius:8px;padding:12px 14px;">
                  <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Resolution SLA</div>
                  <div style="font-size:15px;font-weight:800;color:#0f172a;margin-top:2px;">${q.resolution_time}</div>
                </div>
              </td>` : ""}
            </tr>
          </table>
        </div>` : ""}

        <!-- Terms & Conditions Section (Rendered if terms, advance, or clauses exist) -->
        ${hasTerms ? `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <div style="font-size:11px;font-weight:800;color:#0f172a;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">
            ${q.terms_and_conditions && q.terms_and_conditions.trim() ? "TERMS & CONDITIONS" : "COMMERCIAL CLAUSES & PAYMENT TERMS"}
          </div>
          ${q.terms_and_conditions && q.terms_and_conditions.trim() ? `
          <div style="font-size:11px;color:#475569;line-height:1.6;margin-bottom:8px;">
            ${q.terms_and_conditions}
          </div>` : ""}
          ${advanceRequired ? `
          <div style="font-size:12px;color:#0f172a;margin-top:6px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px 12px;">
            <strong>💳 Advance Payment:</strong> ${advanceMonths} month${advanceMonths > 1 ? "s" : ""} advance rental (${formatAmount(advanceTotalWithTax)} incl. GST) payable upon order confirmation prior to link activation.
          </div>` : ""}
          ${q.payment_terms && q.payment_terms.trim() ? `
          <div style="font-size:12px;color:#334155;margin-top:6px;">
            <strong>Payment Terms:</strong> ${q.payment_terms}
          </div>` : ""}
          ${q.inclusions && q.inclusions.length > 0 ? `
          <div style="margin-top:8px;">
            <div style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;">Inclusions:</div>
            ${q.inclusions.map((inc) => `<div style="font-size:12px;color:#334155;margin-top:2px;">✓ ${inc}</div>`).join("")}
          </div>` : ""}
          ${q.exclusions && q.exclusions.length > 0 ? `
          <div style="margin-top:8px;">
            <div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;">Exclusions:</div>
            ${q.exclusions.map((exc) => `<div style="font-size:12px;color:#334155;margin-top:2px;">✗ ${exc}</div>`).join("")}
          </div>` : ""}
          ${q.special_notes && q.special_notes.trim() ? `
          <div style="margin-top:8px;font-size:11px;color:#b45309;background:#fef3c7;padding:8px 12px;border-radius:6px;">
            <strong>Special Note:</strong> ${q.special_notes}
          </div>` : ""}
        </div>` : ""}

        <!-- Action / CTA Card -->
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;text-align:center;margin-bottom:8px;">
          <div style="font-size:15px;font-weight:800;color:#1e3a8a;margin-bottom:4px;">
            Ready to Activate Your Connection?
          </div>
          <p style="font-size:12px;color:#3b82f6;margin:0 0 16px 0;">
            Review your quotation or contact your representative to finalize your order.
          </p>
          <div style="margin-top:14px;">
            <a href="${portalUrl || 'https://www.conexiaworld.com/contact?type=enterprise'}" style="display:inline-block;background:#0091D0;color:#ffffff;padding:12px 28px;border-radius:8px;font-size:13px;font-weight:800;text-decoration:none;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(0,145,208,0.35);">
              Review & Accept Quotation Online →
            </a>
          </div>
          ${employeePhone ? `
          <div style="font-size:12px;color:#475569;margin-top:14px;padding-top:12px;border-top:1px solid #dbeafe;">
            Need adjustments? Contact ${employeeName ? `${employeeName}: ` : "your representative: "}<strong style="color:#0f172a;">📞 ${employeePhone}</strong>
          </div>` : ""}
        </div>

      </div>

      <!-- Corporate Conexia Footer (Clean Light Background, Conexia Only) -->
      <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 32px;color:#64748b;font-size:11px;line-height:1.6;text-align:center;">
        <div style="font-weight:800;color:#0f172a;font-size:12px;letter-spacing:0.8px;margin-bottom:4px;">
          CONEXIA TELECOM PRIVATE LIMITED
        </div>
        <div style="color:#64748b;font-size:10px;margin-bottom:6px;">
          Class-A ISP Licensed by Department of Telecommunications (DoT), Govt. of India
        </div>
        <div style="color:#64748b;font-size:10px;margin-bottom:8px;">
          Regd. Office: C-61/2, Arjun Nagar, Safdarjung Enclave Extn., New Delhi 110029, India
        </div>
        <div style="margin-bottom:10px;">
          <a href="https://www.conexiaworld.com" style="color:#0091D0;text-decoration:none;font-weight:700;">www.conexiaworld.com</a>
        </div>
        <div style="border-top:1px solid #e2e8f0;padding-top:10px;color:#94a3b8;font-size:10px;">
          This quotation is electronically generated by Conexia. Valid until ${formatDate(q.valid_until)}.
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;
}

function formatConnectionType(type?: string): string {
  if (!type) return "—";
  const map: Record<string, string> = {
    leased_line: "Leased Line",
    internet_leased_line: "Internet Leased Line (ILL)",
    broadband: "Broadband",
    ftth: "FTTH",
    mpls: "MPLS VPN",
    sdwan: "SD-WAN",
    cloud_telephony: "Cloud Telephony",
    sip_trunk: "SIP Trunk",
    voip: "VoIP",
    point_to_point: "Point to Point (P2P)",
  };
  const key = type.toLowerCase().trim();
  if (map[key]) return map[key];
  return type
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function chargeRow(label: string, amount: number): string {
  return `<tr>
    <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#475569;">${label}</td>
    <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right;font-weight:600;color:#0f172a;">${formatAmount(amount)}</td>
  </tr>`;
}

function buildPlainText(
  q: Quotation,
  employeePhone?: string | null,
  employeeName?: string | null,
  portalUrl?: string | null
): string {
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

  const onetimeTotal = Math.max(0, q.onetime_total_with_tax ?? 0);
  const totalPayable = Math.max(
    0,
    q.total_payable_now ?? (onetimeTotal + (q.security_deposit ?? 0) + advanceTotalWithTax)
  );
  const hasContract = (q.contract_period_months ?? 0) > 0;
  const contractMonths = q.contract_period_months ?? 0;
  const contractValue = hasContract
    ? Math.max(0, q.total_contract_value ?? (q.monthly_rental * contractMonths))
    : 0;

  let out = `CONEXIA - QUOTATION
==============================================================
Carrier-Grade Connectivity Solutions

Quotation No: ${q.quotation_number ?? "DRAFT"} (Rev.${q.revision_number})
Date: ${formatDate(q.quotation_date)}
Valid Until: ${formatDate(q.valid_until)}

CLIENT: ${q.customer_name}${q.company_name ? ` (${q.company_name})` : ""}
PHONE: ${q.customer_phone ?? "—"}
EMAIL: ${q.customer_email ?? "—"}

CONNECTIVITY SPECIFICATIONS:
- Plan: ${q.plan_name}
- Bandwidth: ${q.bandwidth} (1:1 Symmetric Committed)
- Connection Type: ${formatConnectionType(q.connection_type)}
${hasContract ? `- Contract Commitment: ${contractMonths} Months\n` : ""}- Billing Cycle: ${q.billing_cycle}
- Payment Terms: ${advanceRequired ? `${advanceMonths} Month${advanceMonths > 1 ? "s" : ""} Advance Rental (${formatAmount(advanceTotalWithTax)} incl. GST) Required` : (q.payment_terms ? q.payment_terms : "Postpaid (Monthly Billing)")}

COMMERCIALS:
- Monthly Rental (MRC): ${formatAmount(q.monthly_rental)} / month (+ GST)
${hasContract ? `- Total Contract Value: ${formatAmount(contractValue)} (${contractMonths} months)\n` : ""}- One-Time Setup: ${onetimeTotal > 0 ? formatAmount(onetimeTotal) : "Waived (₹0.00)"}
${advanceRequired ? `- Advance Rental (${advanceMonths} mo with GST): ${formatAmount(advanceTotalWithTax)}\n` : ""}${q.security_deposit && q.security_deposit > 0 ? `- Security Deposit (Refundable): ${formatAmount(q.security_deposit)}\n` : ""}- Total Payable at Activation: ${formatAmount(totalPayable)}
`;

  if (q.uptime_guarantee || q.support_type) {
    out += `
SLA COMMITMENTS:
- Uptime Guarantee: ${q.uptime_guarantee ?? "99.5%"}
- Support Operations: ${q.support_type ?? "24x7 Dedicated NOC"}
- Response SLA: ${q.response_time ?? "< 4 Hours"}
`;
  }

  if (q.terms_and_conditions && q.terms_and_conditions.trim().length > 0) {
    out += `
TERMS & CONDITIONS:
${q.terms_and_conditions}
`;
  }

  if (portalUrl) {
    out += `

Review & Accept Quotation Online:
${portalUrl}
`;
  }

  out += `
---
Conexia Telecom Private Limited · Class-A ISP
Regd. Office: C-61/2, Arjun Nagar, Safdarjung Enclave Extn., New Delhi 110029, India
Web: https://www.conexiaworld.com`;

  if (employeePhone) {
    out += `
Contact (${employeeName ?? "Representative"}): ${employeePhone}`;
  }

  return out;
}

// ─────────────────────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Validate environment ──────────────────────────
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromDomain = Deno.env.get("RESEND_FROM_DOMAIN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email service not configured (missing API key)",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!fromDomain) {
      console.error("RESEND_FROM_DOMAIN is not set");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email service not configured (missing sender domain)",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // ── 2. Parse request ─────────────────────────────────
    const { quotation_id, recipient_email, sender_phone, sender_name } =
      await req.json();

    const cleanRecipientEmail = String(recipient_email ?? "").trim().toLowerCase();

    if (!quotation_id || !cleanRecipientEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing quotation_id or recipient_email",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanRecipientEmail)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email address",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(
      `Sending quotation ${quotation_id} to ${cleanRecipientEmail}`
    );

    // ── 3. Fetch quotation from database ─────────────────
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: quotation, error: fetchError } = await supabaseAdmin
      .from("quotations")
      .select("*")
      .eq("id", quotation_id)
      .single();

    if (fetchError || !quotation) {
      console.error("Failed to fetch quotation:", fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Quotation not found: ${fetchError?.message ?? "Unknown error"}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    const q = quotation as Quotation;

    // ── 3b. Fetch employee details (mobile number of sender) ──
    let employeePhone = sender_phone ? String(sender_phone).trim() : null;
    let employeeName = sender_name ? String(sender_name).trim() : null;

    if (!employeePhone && q.prepared_by) {
      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, phone")
          .eq("id", q.prepared_by)
          .maybeSingle();

        if (profile?.phone && profile.phone.trim().length > 0) {
          employeePhone = profile.phone.trim();
        }
        if (
          !employeeName &&
          profile?.full_name &&
          profile.full_name.trim().length > 0
        ) {
          employeeName = profile.full_name.trim();
        }
      } catch (profileErr) {
        console.warn("Could not fetch employee profile for prepared_by:", profileErr);
      }
    }

    // ── 3c. Ensure acceptance_token exists (E11) ───────────
    let acceptanceToken = q.acceptance_token;
    if (!acceptanceToken) {
      acceptanceToken = crypto.randomUUID();
      try {
        await supabaseAdmin
          .from("quotations")
          .update({ acceptance_token: acceptanceToken })
          .eq("id", q.id);
        q.acceptance_token = acceptanceToken;
      } catch (tokenErr) {
        console.warn("Could not save auto-generated acceptance_token:", tokenErr);
      }
    }

    const portalBaseUrl = Deno.env.get("PORTAL_BASE_URL") || "https://billing.conexiaworld.com/quotation";
    const portalUrl = acceptanceToken
      ? `${portalBaseUrl}/${acceptanceToken}`
      : "https://www.conexiaworld.com/contact?type=enterprise";

    // ── 4. Generate email content ────────────────────────
    const htmlContent = buildEmailHtml(q, employeePhone, employeeName, portalUrl);
    const textContent = buildPlainText(q, employeePhone, employeeName, portalUrl);
    const subject = `Quotation ${q.quotation_number ?? ""} - ${q.plan_name} | Conexia`;
    const fromEmail = `Conexia <quotations@${fromDomain}>`;

    // ── 5. Send email via Resend ─────────────────────────
    console.log(`Sending email from: ${fromEmail}`);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [cleanRecipientEmail],
        subject: subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: "quotation_id", value: String(quotation_id) },
          { name: "quotation_number", value: q.quotation_number ?? "draft" },
        ],
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Email delivery failed: ${resendData.message ?? resendResponse.statusText}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        }
      );
    }

    console.log("Email sent successfully. Message ID:", resendData.id);

    // ── 6. Update quotation status in database ───────────
    const userId = null; // Edge function doesn't have user context, Flutter passes it
    const updatePayload: Record<string, unknown> = {
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_to_email: cleanRecipientEmail,
      updated_at: new Date().toISOString(),
    };

    // Increment send count if field exists
    if (q.sent_to_email) {
      // Re-sending — don't overwrite sent_at
      delete updatePayload.sent_at;
    }

    const { error: updateError } = await supabaseAdmin
      .from("quotations")
      .update(updatePayload)
      .eq("id", quotation_id);

    if (updateError) {
      // Email was sent but status update failed — log but don't fail
      console.error(
        "Warning: Email sent but failed to update quotation status:",
        updateError
      );
    }

    // ── 7. Return success ────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        message_id: resendData.id,
        sent_to: cleanRecipientEmail,
        portal_url: portalUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
