// /utils/feasibility.ts — Types, enums, and constants for Feasibility Requests

// ============= ENUMS =============
export enum FeasibilityStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

// ============= LABEL & STYLE MAPPINGS =============
export const FEASIBILITY_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export const FEASIBILITY_STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  under_review: 'info',
  approved: 'success',
  rejected: 'error',
  cancelled: 'neutral',
}

export const FEASIBILITY_STATUS_ICONS: Record<string, string> = {
  pending: 'i-heroicons-clock',
  under_review: 'i-heroicons-magnifying-glass',
  approved: 'i-heroicons-check-circle',
  rejected: 'i-heroicons-x-circle',
  cancelled: 'i-heroicons-no-symbol',
}

export const FEASIBILITY_URGENCY_COLORS: Record<string, string> = {
  urgent: 'text-red-700 bg-red-50 border-red-200',
  high: 'text-orange-700 bg-orange-50 border-orange-200',
  normal: 'text-blue-700 bg-blue-50 border-blue-200',
  low: 'text-emerald-700 bg-emerald-50 border-emerald-200',
}

export const FEASIBILITY_URGENCY_ICONS: Record<string, string> = {
  urgent: 'i-heroicons-exclamation-triangle',
  high: 'i-heroicons-arrow-trending-up',
  normal: 'i-heroicons-minus',
  low: 'i-heroicons-arrow-trending-down',
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  leased_line: 'Leased Line (ILL)',
  broadband: 'Broadband',
  partner: 'Partner Resale',
  bandwidth: 'Pure Bandwidth',
  fiber: 'Fiber Direct',
  wireless: 'Radio RF / Wireless',
  hybrid: 'Hybrid Network',
  point_to_point: 'Point-to-Point (P2P)',
}

// ============= JSONB SUB-INTERFACES =============

/** Matches the service_location JSONB from feasibility_requests */
export interface FeasibilityServiceLocation {
  address: string
  city: string
  state: string
  pincode: string
  landmark?: string
  latitude?: number
  longitude?: number
}

/** Matches the service_requirements JSONB from feasibility_requests */
export interface FeasibilityServiceRequirements {
  bandwidth?: string
  connection_type?: string
  urgency?: string
  priority?: string
  feasibility_type?: string
  special_conditions?: string
  static_ip_required?: boolean
  static_ip_count?: number
  ipv6_required?: boolean
}

/** status_history JSONB array entry */
export interface StatusHistoryEntry {
  event: string
  status: string
  note: string
  timestamp: string
  requested_by?: string
  requesting_department?: number
}

/** Cost breakdown item in route */
export interface CostItem {
  item_code?: string
  item_description?: string
  name?: string
  category: string // 'Consumable Capex' | 'Recoverable Capex'
  uom?: string // 'Mtr' | 'Nos' | 'Roll' | 'Day' | 'Hour' | 'Lump Sum'
  unit?: string
  quantity: number
  unit_price?: number
  unit_cost?: number
  total_cost: number
}

/** Operational cost item (OPEX) */
export interface OperationalCostItem {
  category: string // 'Infrastructure' | 'Power' | 'Maintenance' | 'Bandwidth' | 'Licensing' | 'Labor' | 'Other'
  description: string
  monthly_cost: number
  annual_cost: number
  vendor?: string
  remarks?: string
}

/** Connectivity route JSONB (primary_route / secondary_route) */
export interface ConnectivityRoute {
  is_feasible: boolean
  // Feasible route fields
  route_name?: string
  source_node_name?: string
  distance_km?: number
  technology?: string
  total_fiber_length_mtr?: number
  infrastructure_available?: boolean
  requires_row?: boolean
  row_details?: string
  installation_days?: number
  remarks?: string
  cost_items?: CostItem[]
  consumable_capex?: number
  recoverable_capex?: number
  total_capex?: number
  // Not-feasible route fields
  evaluated_by?: string
  evaluated_at?: string
  reason?: string
  technical_constraints?: string[]
}

/** Site survey JSONB */
export interface SiteSurvey {
  required?: boolean
  completed?: boolean
  survey_date?: string
  surveyed_at?: string
  conducted_by?: string
  surveyed_by?: string
  surveyor_name?: string
  report_url?: string
  photos?: string[]
  findings?: string
  recommendations?: string
  site_accessible?: boolean
  power_available?: boolean
  indoor_space_available?: boolean
  mounting_type?: string
  notes?: string
}

/** Attachment JSONB */
export interface FeasibilityAttachment {
  id: string
  file_name: string
  file_url: string
  file_type?: string
  file_size?: number
  uploaded_by?: string
  uploaded_at?: string
  description?: string
}

/** Requester profile (joined from profiles table) */
export interface FeasibilityRequester {
  full_name: string | null
  employee_code: string | null
  avatar_url: string | null
}

/** Reviewer profile (joined from profiles table) */
export interface FeasibilityReviewer {
  full_name: string | null
  employee_code: string | null
  avatar_url: string | null
}

/** Joined Lead details from spanco_leads */
export interface FeasibilityLead {
  id: number
  lead_number: string
  current_stage?: string | null
  status?: string | null
  priority?: string | null
  customer_info?: {
    name?: string
    company_name?: string
    contact_person?: string
    phone?: string
    email?: string
  }
  customer_name?: string
  company_name?: string | null
  phone?: string | null
  email?: string | null
}

// ============= MAIN INTERFACE =============
export interface FeasibilityRequest {
  id: number
  request_number: string
  lead_id: number

  // Timestamps
  created_at: string
  updated_at: string

  // Request info
  requested_by: string
  requesting_department: number
  requested_at: string

  // Service details (JSONB)
  service_location: FeasibilityServiceLocation
  service_requirements: FeasibilityServiceRequirements

  // Connectivity routes (JSONB, nullable)
  primary_route: ConnectivityRoute | null
  secondary_route: ConnectivityRoute | null

  // Site survey (JSONB, nullable)
  site_survey: SiteSurvey | null

  // Review status
  status: FeasibilityStatus
  is_feasible: boolean | null
  feasibility_remarks: string | null
  reviewed_by: string | null
  reviewed_at: string | null

  // Commercial assessment
  estimated_capex: number | null
  estimated_opex: number | null
  estimated_roi_months: number | null
  is_commercially_viable: boolean | null
  commercial_remarks: string | null

  // Timeline
  estimated_installation_days: number | null
  expected_completion_date: string | null

  // Attachments & operational costs (JSONB)
  attachments: FeasibilityAttachment[]
  operational_costs: OperationalCostItem[] | null

  // Status history (JSONB)
  status_history: StatusHistoryEntry[]

  // Joined profiles & lead (from Supabase select)
  requester_profile?: FeasibilityRequester
  reviewer_profile?: FeasibilityReviewer
  lead?: FeasibilityLead
}
