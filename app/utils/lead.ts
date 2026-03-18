// /utils/lead.ts - All types, enums, and constants in utils for auto-import

// ============= ENUMS =============
export enum SpancoStage {
  SUSPECT = 'suspect',
  PROSPECT = 'prospect',
  APPROACH = 'approach',
  NEGOTIATION = 'negotiation',
  CLOSURE = 'closure',
  ORDER = 'order',
}

export enum LeadStatus {
  ACTIVE = 'active',
  WON = 'won',
  LOST = 'lost',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical', // ✅ Added CRITICAL (from your data)
}

export enum LeadSource {
  WALK_IN = 'walk_in',
  REFERRAL = 'referral',
  WEBSITE = 'website',
  PHONE_INQUIRY = 'phone_inquiry',
  EMAIL = 'email',
  SOCIAL_MEDIA = 'social_media',
  PARTNER = 'partner',
  EVENT = 'event',
  OTHER = 'other',
}

export enum CustomerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

// ✅ NEW: Date Filter Type
export type DateFilterType = 'all' | 'overdue' | 'thisweek' | 'nextweek' | 'thismonth' | 'later'

// ============= LABEL MAPPINGS =============
export const STAGE_LABELS = {
  suspect: 'Suspect',
  prospect: 'Prospect',
  approach: 'Approach',
  negotiation: 'Negotiation',
  closure: 'Closure',
  order: 'Order',
} as const

export const STATUS_LABELS = {
  active: 'Active',
  won: 'Won',
  lost: 'Lost',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
} as const

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
  critical: 'Critical', // ✅ Added CRITICAL
} as const

export const CUSTOMER_TYPE_LABELS = {
  individual: 'Individual',
  business: 'Business',
  enterprise: 'Enterprise',
} as const

// ✅ NEW: Date Filter Labels
export const DATE_FILTER_LABELS = {
  all: 'All Dates',
  overdue: 'Overdue',
  thisweek: 'This Week',
  nextweek: 'Next Week',
  thismonth: 'This Month',
  later: 'Later',
} as const

// ============= COLOR MAPPINGS =============
export const STAGE_COLORS = {
  suspect: 'gray',
  prospect: 'blue',
  approach: 'cyan',
  negotiation: 'purple',
  closure: 'orange',
  order: 'green',
} as const

export const STATUS_COLORS = {
  active: 'green',
  won: 'emerald',
  lost: 'red',
  on_hold: 'orange',
  cancelled: 'gray',
} as const

export const PRIORITY_COLORS = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
  critical: 'rose', // ✅ Added CRITICAL color
} as const

// ✅ NEW: Date Filter Colors (for Nuxt UI semantic colors)
export const DATE_FILTER_COLORS = {
  all: 'neutral',
  overdue: 'error',
  thisweek: 'warning',
  nextweek: 'info',
  thismonth: 'success',
  later: 'neutral',
} as const

// ✅ NEW: Date Filter Icons
export const DATE_FILTER_ICONS = {
  all: 'i-heroicons-calendar',
  overdue: 'i-heroicons-exclamation-triangle',
  thisweek: 'i-heroicons-calendar-days',
  nextweek: 'i-heroicons-calendar',
  thismonth: 'i-heroicons-calendar-date-range',
  later: 'i-heroicons-clock',
} as const

// ============= INTERFACES =============
export interface CustomerInfo {
  name: string
  type: CustomerType
  phone: string
  email?: string
  alternate_phone?: string
  contact_person?: string
  company_name?: string
  gstin?: string
  pan?: string
}

export interface AssignedUser {
  full_name: string | null;
  employee_code: string | null;
  avatar_url: string | null;
}

export interface ServiceLocation {
  address: string
  city: string
  state: string
  pincode: string
  landmark?: string
}

export interface ServiceRequirements {
  bandwidth_required?: string
  plan_interest?: string
  number_of_connections: number
  current_customers?: number
  expected_customers?: number
  special_requirements?: string
}

export interface CommercialDetails {
  estimated_value?: number
  proposed_monthly_rental?: number
  proposed_installation_charge?: number
  contract_period_months?: number
  payment_terms?: string
}

export interface Timeline {
  expected_closure_date?: string
  follow_up_date?: string
  last_contact_date?: string
  won_date?: string
  order_date?: string // ✅ Added from your schema
  actual_closure_date?: string // ✅ Added from your schema
  installation_type?: string // ✅ Added from your schema
}

export interface LeadTracking {
  source: LeadSource
  source_details?: string
  referral_by?: string
  campaign_id?: string
}

export interface Notes {
  remarks?: string
  internal_notes?: string
}

export interface OutcomeDetails {
  reason?: string
  remarks?: string
  competitor_name?: string
  result?: string // ✅ Added from your schema (for "lost" tracking)
  lost_date?: string // ✅ Added from your schema
}

export interface SpancoLead {
  id: number
  lead_number: string
  customer_info: CustomerInfo
  service_location: ServiceLocation
  service_requirements: ServiceRequirements
  current_stage: SpancoStage
  status: LeadStatus
  priority: Priority
  commercial_details?: CommercialDetails
  timeline?: Timeline
  lead_tracking?: LeadTracking
  notes?: Notes
  outcome_details?: OutcomeDetails
  expected_closure_date?: string
  created_by: string
  created_at: string
  updated_at?: string
  assigned_to?: string
  stage_updated_at?: string // ✅ Added from your schema
  assigned_at?: string // ✅ Added from your schema
  sales_team_id?: number // ✅ Added from your schema
  profiles?: AssignedUser;

}

export interface SpancoStageHistory {
  id: number
  lead_id: number
  from_stage?: SpancoStage
  to_stage: SpancoStage
  changed_by: string
  changed_at: string
  remarks?: string
  days_in_previous_stage?: number
  change_reason?: string // ✅ Added from your schema
}

export interface LeadFilters {
  stage?: SpancoStage
  status?: LeadStatus
  priority?: Priority
  search?: string
  assignedTo?: string // UUID of the salesperson
}

// ✅ NEW: Salesperson (fetched from department hierarchy, not from leads)
export interface SalesPerson {
  id: string
  full_name: string | null
  employee_code: string | null
  avatar_url: string | null
}

export interface LeadSummary {
  total: number
  byStage: Record<SpancoStage, number>
  byStatus: Record<LeadStatus, number>
  byPriority: Record<Priority, number>
}

// ✅ NEW: Date Range Calculations Interface
export interface DateRanges {
  today: Date
  thisWeekStart: Date
  thisWeekEnd: Date
  nextWeekStart: Date
  nextWeekEnd: Date
  thisMonthStart: Date
  thisMonthEnd: Date
}

// ✅ NEW: Helper type for date filter counts
export type DateFilterCounts = Record<Exclude<DateFilterType, 'all'>, number>

// ✅ NEW: Server-side summary counts (fetched independently from pagination)
export interface ServerSummary {
  total: number
  byStatus: Partial<Record<LeadStatus, number>>
  byDateRange: DateFilterCounts
}
