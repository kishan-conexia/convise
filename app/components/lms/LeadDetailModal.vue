<template>
  <!-- Lead Detail Modal Overlay with Fade Transition -->
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      @click="closeModal"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto relative"
        @click.stop
      >
        <!-- Close button -->
        <button
          aria-label="Close dialog"
          class="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 bg-white rounded-full p-2 shadow-md transition-colors duration-200"
          @click="closeModal"
        >
          <UIcon name="i-heroicons-x-mark" class="h-6 w-6" />
        </button>

        <!-- Modal Content -->
        <div v-if="lead" class="p-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6 pr-10">
            <div>
              <h3 class="text-xl font-bold text-gray-900">
                {{ lead.lead_number }}
              </h3>
              <p class="text-sm text-gray-600 mt-1">
                {{ lead.customer_info.name }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <UBadge
                :color="getStageColorSemantic(lead.current_stage)"
                variant="soft"
                size="lg"
              >
                {{ getStageLabel(lead.current_stage) }}
              </UBadge>
            </div>
          </div>

          <!-- Scrollable Content -->
          <div class="max-h-[calc(90vh-200px)] overflow-y-auto space-y-6 pr-2">
            <!-- Status and Priority -->
            <div class="flex items-center gap-3">
              <UBadge
                :color="getStatusColorSemantic(lead.status)"
                variant="soft"
                size="lg"
              >
                <UIcon
                  :name="getStatusIcon(lead.status)"
                  class="h-4 w-4 mr-1"
                />
                {{ getStatusLabel(lead.status) }}
              </UBadge>
              <UBadge
                :color="getPriorityColorSemantic(lead.priority)"
                variant="soft"
                size="lg"
              >
                <UIcon name="i-heroicons-flag" class="h-4 w-4 mr-1" />
                {{ getPriorityLabel(lead.priority) }}
              </UBadge>
            </div>

            <!-- Customer Information -->
            <div>
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-user-circle"
                  class="h-5 w-5 mr-2 text-blue-600"
                />
                Customer Information
              </h4>
              <div
                class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4"
              >
                <LmsDetailRow label="Name" :value="lead.customer_info.name" />
                <LmsDetailRow
                  label="Type"
                  :value="getCustomerTypeLabel(lead.customer_info.type)"
                />
                <LmsDetailRow
                  v-if="lead.customer_info.contact_person"
                  label="Contact Person"
                  :value="lead.customer_info.contact_person"
                />
                <LmsDetailRow label="Phone" :value="lead.customer_info.phone" />
                <LmsDetailRow
                  v-if="lead.customer_info.email"
                  label="Email"
                  :value="lead.customer_info.email"
                />
                <LmsDetailRow
                  v-if="lead.customer_info.alternate_phone"
                  label="Alternate Phone"
                  :value="lead.customer_info.alternate_phone"
                />
                <LmsDetailRow
                  v-if="lead.customer_info.company_name"
                  label="Company"
                  :value="lead.customer_info.company_name"
                />
                <LmsDetailRow
                  v-if="lead.customer_info.gstin"
                  label="GSTIN"
                  :value="lead.customer_info.gstin"
                />
                <LmsDetailRow
                  v-if="lead.customer_info.pan"
                  label="PAN"
                  :value="lead.customer_info.pan"
                />
              </div>
            </div>

            <!-- Service Location -->
            <div>
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-map-pin"
                  class="h-5 w-5 mr-2 text-green-600"
                />
                Service Location
              </h4>
              <div
                class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4"
              >
                <LmsDetailRow
                  label="Address"
                  :value="lead.service_location.address"
                  class="md:col-span-2"
                />
                <LmsDetailRow
                  label="City"
                  :value="lead.service_location.city"
                />
                <LmsDetailRow
                  label="State"
                  :value="lead.service_location.state"
                />
                <LmsDetailRow
                  label="Pincode"
                  :value="lead.service_location.pincode"
                />
                <LmsDetailRow
                  v-if="lead.service_location.landmark"
                  label="Landmark"
                  :value="lead.service_location.landmark"
                />
              </div>
            </div>

            <!-- Service Requirements -->
            <div>
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-signal"
                  class="h-5 w-5 mr-2 text-purple-600"
                />
                Service Requirements
              </h4>
              <div
                class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4"
              >
                <LmsDetailRow
                  label="Service Type"
                  :value="getCustomerTypeLabel(lead.customer_info.type)"
                />

                <!-- Enterprise-specific fields -->
                <template
                  v-if="lead.customer_info.type === CustomerType.ENTERPRISE"
                >
                  <!-- ✅ FIXED: Added null check -->
                  <LmsDetailRow
                    v-if="lead.service_requirements.current_customers != null"
                    label="Current Customers"
                    :value="String(lead.service_requirements.current_customers)"
                  />
                  <LmsDetailRow
                    v-if="lead.service_requirements.expected_customers != null"
                    label="Expected Customers"
                    :value="
                      String(lead.service_requirements.expected_customers)
                    "
                  />
                </template>

                <!-- Individual-specific fields -->
                <template
                  v-if="lead.customer_info.type === CustomerType.INDIVIDUAL"
                >
                  <!-- ✅ FIXED: Added null check -->
                  <LmsDetailRow
                    v-if="lead.service_requirements.bandwidth_required"
                    label="Bandwidth Required"
                    :value="lead.service_requirements.bandwidth_required"
                  />
                </template>

                <!-- Business-specific fields -->
                <template
                  v-if="lead.customer_info.type === CustomerType.BUSINESS"
                >
                  <!-- ✅ FIXED: Added null check -->
                  <LmsDetailRow
                    v-if="lead.service_requirements.bandwidth_required"
                    label="Bandwidth Required"
                    :value="lead.service_requirements.bandwidth_required"
                  />
                  <LmsDetailRow
                    v-if="lead.service_requirements.plan_interest"
                    label="Plan Interest"
                    :value="lead.service_requirements.plan_interest"
                  />
                  <!-- ✅ FIXED: Added null check -->
                  <LmsDetailRow
                    v-if="
                      lead.service_requirements.number_of_connections != null
                    "
                    label="Number of Connections"
                    :value="
                      String(lead.service_requirements.number_of_connections)
                    "
                  />
                </template>

                <!-- ✅ NEW: Special requirements (all types) -->
                <LmsDetailRow
                  v-if="lead.service_requirements.special_requirements"
                  label="Special Requirements"
                  :value="lead.service_requirements.special_requirements"
                  class="md:col-span-2"
                />
              </div>
            </div>

            <!-- Commercial Details -->
            <div v-if="lead.commercial_details">
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-currency-rupee"
                  class="h-5 w-5 mr-2 text-emerald-600"
                />
                Commercial Details
              </h4>
              <div
                class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4"
              >
                <LmsDetailRow
                  v-if="lead.commercial_details.estimated_value"
                  label="Estimated Value"
                  :value="`₹${lead.commercial_details.estimated_value.toLocaleString(
                    'en-IN'
                  )}`"
                />
                <LmsDetailRow
                  v-if="lead.commercial_details.proposed_monthly_rental"
                  label="Monthly Rental"
                  :value="`₹${lead.commercial_details.proposed_monthly_rental.toLocaleString(
                    'en-IN'
                  )}`"
                />
                <LmsDetailRow
                  v-if="lead.commercial_details.proposed_installation_charge"
                  label="Installation Charge"
                  :value="`₹${lead.commercial_details.proposed_installation_charge.toLocaleString(
                    'en-IN'
                  )}`"
                />
                <LmsDetailRow
                  v-if="lead.commercial_details.contract_period_months"
                  label="Contract Period"
                  :value="`${lead.commercial_details.contract_period_months} months`"
                />
                <LmsDetailRow
                  v-if="lead.commercial_details.payment_terms"
                  label="Payment Terms"
                  :value="lead.commercial_details.payment_terms"
                  class="md:col-span-2"
                />
              </div>
            </div>

            <!-- Timeline -->
            <div v-if="lead.timeline">
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-calendar-days"
                  class="h-5 w-5 mr-2 text-orange-600"
                />
                Timeline
              </h4>
              <div
                class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4"
              >
                <LmsDetailRow
                  label="Created"
                  :value="formatDate(lead.created_at)"
                />
                <LmsDetailRow
                  v-if="lead.updated_at"
                  label="Last Updated"
                  :value="formatDate(lead.updated_at)"
                />
                <!-- ✅ NEW: Added urgency indicator for expected closure date -->
                <div
                  v-if="lead.expected_closure_date"
                  class="flex items-start justify-between"
                >
                  <span class="text-xs font-medium text-gray-600"
                    >Expected Closure</span
                  >
                  <div class="flex items-center gap-1">
                    <UIcon
                      :name="getClosureDateIcon(lead)"
                      :class="['h-4 w-4', getClosureDateColor(lead)]"
                    />
                    <span
                      class="text-sm"
                      :class="getClosureDateTextClass(lead)"
                    >
                      {{ formatDate(lead.expected_closure_date) }}
                    </span>
                  </div>
                </div>
                <LmsDetailRow
                  v-if="lead.timeline.follow_up_date"
                  label="Follow Up Date"
                  :value="formatDate(lead.timeline.follow_up_date)"
                />
                <LmsDetailRow
                  v-if="lead.timeline.last_contact_date"
                  label="Last Contact"
                  :value="formatDate(lead.timeline.last_contact_date)"
                />
                <LmsDetailRow
                  v-if="lead.timeline.won_date"
                  label="Won Date"
                  :value="formatDate(lead.timeline.won_date)"
                />
                <LmsDetailRow
                  v-if="lead.timeline.order_date"
                  label="Order Date"
                  :value="formatDate(lead.timeline.order_date)"
                />
              </div>
            </div>

            <!-- Assigned User -->
            <div v-if="lead.assigned_to">
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-user"
                  class="h-5 w-5 mr-2 text-purple-600"
                />
                Assignment Details
              </h4>
              <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                <div class="flex items-center gap-3">
                  <!-- Avatar -->
                  <div
                    v-if="lead.profiles?.avatar_url"
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center overflow-hidden"
                  >
                    <img
                      :src="lead.profiles.avatar_url"
                      :alt="lead.profiles.full_name || 'User'"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white font-semibold"
                  >
                    {{ getInitials(lead.profiles?.full_name) }}
                  </div>

                  <!-- User Info -->
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">
                      {{ lead.profiles?.full_name || "Unassigned" }}
                    </p>
                    <p
                      v-if="lead.profiles?.employee_code"
                      class="text-xs text-gray-500"
                    >
                      {{ lead.profiles.employee_code }}
                    </p>
                  </div>

                  <!-- Assignment Badge -->
                  <UBadge color="info" variant="soft" size="sm">
                    <UIcon
                      name="i-heroicons-check-badge"
                      class="h-3 w-3 mr-1"
                    />
                    Assigned
                  </UBadge>
                </div>

                <LmsDetailRow
                  v-if="lead.assigned_at"
                  label="Assigned On"
                  :value="formatDate(lead.assigned_at)"
                />
              </div>
            </div>

            <!-- Lead Source -->
            <div v-if="lead.lead_tracking?.source">
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-arrow-trending-up"
                  class="h-5 w-5 mr-2 text-cyan-600"
                />
                Lead Source
              </h4>
              <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                <LmsDetailRow
                  label="Source"
                  :value="getLeadSourceLabel(lead.lead_tracking.source)"
                />
                <LmsDetailRow
                  v-if="lead.lead_tracking.source_details"
                  label="Details"
                  :value="lead.lead_tracking.source_details"
                />
                <LmsDetailRow
                  v-if="lead.lead_tracking.referral_by"
                  label="Referred By"
                  :value="lead.lead_tracking.referral_by"
                />
                <LmsDetailRow
                  v-if="lead.lead_tracking.campaign_id"
                  label="Campaign ID"
                  :value="lead.lead_tracking.campaign_id"
                />
              </div>
            </div>

            <!-- Notes -->
            <div v-if="lead.notes?.remarks || lead.notes?.internal_notes">
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-document-text"
                  class="h-5 w-5 mr-2 text-indigo-600"
                />
                Notes
              </h4>
              <div class="space-y-3">
                <div
                  v-if="lead.notes.remarks"
                  class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                >
                  <p class="text-xs font-medium text-yellow-800 mb-1">
                    Remarks
                  </p>
                  <p class="text-sm text-gray-700">{{ lead.notes.remarks }}</p>
                </div>
                <!-- Internal notes commented out for security -->
                <!-- <div
                  v-if="lead.notes.internal_notes"
                  class="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <p class="text-xs font-medium text-blue-800 mb-1">
                    Internal Notes
                  </p>
                  <p class="text-sm text-gray-700">
                    {{ lead.notes.internal_notes }}
                  </p>
                </div> -->
              </div>
            </div>

            <!-- Outcome Details (for Lost/Won leads) -->
            <div
              v-if="
                lead.outcome_details &&
                (lead.status === LeadStatus.LOST ||
                  lead.status === LeadStatus.WON)
              "
            >
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  :name="
                    lead.status === LeadStatus.WON
                      ? 'i-heroicons-trophy'
                      : 'i-heroicons-x-circle'
                  "
                  :class="[
                    'h-5 w-5 mr-2',
                    lead.status === LeadStatus.WON
                      ? 'text-green-600'
                      : 'text-red-600',
                  ]"
                />
                {{
                  lead.status === LeadStatus.WON
                    ? "Win Details"
                    : "Loss Details"
                }}
              </h4>
              <div
                :class="[
                  'rounded-lg p-4 space-y-3',
                  lead.status === LeadStatus.WON
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200',
                ]"
              >
                <LmsDetailRow
                  v-if="lead.outcome_details.reason"
                  label="Reason"
                  :value="lead.outcome_details.reason"
                />
                <LmsDetailRow
                  v-if="lead.outcome_details.remarks"
                  label="Remarks"
                  :value="lead.outcome_details.remarks"
                />
                <LmsDetailRow
                  v-if="lead.outcome_details.competitor_name"
                  label="Competitor"
                  :value="lead.outcome_details.competitor_name"
                />
              </div>
            </div>

            <!-- Stage History -->
            <div v-if="stageHistory.length > 0">
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-clock"
                  class="h-5 w-5 mr-2 text-gray-600"
                />
                Stage History
              </h4>
              <div class="space-y-2">
                <div
                  v-for="(history, index) in stageHistory"
                  :key="history.id"
                  class="flex items-start gap-3 bg-gray-50 rounded-lg p-3"
                >
                  <div class="flex-shrink-0">
                    <div
                      :class="[
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        index === 0 ? 'bg-blue-100' : 'bg-gray-200',
                      ]"
                    >
                      <UIcon
                        name="i-heroicons-arrow-right"
                        :class="[
                          'h-4 w-4',
                          index === 0 ? 'text-blue-600' : 'text-gray-600',
                        ]"
                      />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <UBadge
                        v-if="history.from_stage"
                        :color="getStageColorSemantic(history.from_stage)"
                        variant="soft"
                        size="xs"
                      >
                        {{ getStageLabel(history.from_stage) }}
                      </UBadge>
                      <UIcon
                        name="i-heroicons-arrow-right"
                        class="h-3 w-3 text-gray-400"
                      />
                      <UBadge
                        :color="getStageColorSemantic(history.to_stage)"
                        variant="soft"
                        size="xs"
                      >
                        {{ getStageLabel(history.to_stage) }}
                      </UBadge>
                    </div>
                    <p class="text-xs text-gray-600">
                      {{ formatDate(history.changed_at) }}
                      <span v-if="history.days_in_previous_stage">
                        • {{ history.days_in_previous_stage }} days in previous
                        stage
                      </span>
                    </p>
                    <p
                      v-if="history.remarks"
                      class="text-xs text-gray-500 mt-1"
                    >
                      {{ history.remarks }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-6 pt-4 border-t flex justify-end">
            <UButton
              color="neutral"
              variant="outline"
              class="bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300 font-medium"
              @click="closeModal"
            >
              Close
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const leadStore = useLeadStore();

const isOpen = computed(() => leadStore.selectedLeadId !== null);
const lead = computed(() => leadStore.selectedLead);
const stageHistory = computed(() => {
  if (!lead.value) return [];
  return leadStore.stageHistory[lead.value.id] || [];
});

function closeModal() {
  leadStore.selectLead(null);
}

// Formatting helpers
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ✅ NEW: Closure date urgency helpers
function getClosureDateIcon(lead: SpancoLead): string {
  if (!lead.expected_closure_date) return "i-heroicons-calendar-days";

  const date = new Date(lead.expected_closure_date);
  const now = new Date();

  if (date < now) return "i-heroicons-exclamation-triangle";

  const daysDiff = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff <= 3) return "i-heroicons-bell-alert";

  return "i-heroicons-calendar-days";
}

function getClosureDateColor(lead: SpancoLead): string {
  if (!lead.expected_closure_date) return "text-gray-600";

  const date = new Date(lead.expected_closure_date);
  const now = new Date();

  if (date < now) return "text-red-600";

  const daysDiff = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff <= 3) return "text-orange-600";
  if (daysDiff <= 7) return "text-yellow-600";

  return "text-green-600";
}

function getClosureDateTextClass(lead: SpancoLead): string {
  if (!lead.expected_closure_date) return "text-gray-600";

  const date = new Date(lead.expected_closure_date);
  const now = new Date();

  if (date < now) return "text-red-600 font-semibold";

  const daysDiff = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff <= 3) return "text-orange-600 font-semibold";

  return "text-gray-600";
}

function getStatusIcon(status: LeadStatus): string {
  switch (status) {
    case LeadStatus.ACTIVE:
      return "i-heroicons-check-circle";
    case LeadStatus.WON:
      return "i-heroicons-trophy";
    case LeadStatus.LOST:
      return "i-heroicons-x-circle";
    case LeadStatus.ON_HOLD:
      return "i-heroicons-pause-circle";
    case LeadStatus.CANCELLED:
      return "i-heroicons-no-symbol";
    default:
      return "i-heroicons-information-circle";
  }
}

function getLeadSourceLabel(source: LeadSource): string {
  const labels: Record<LeadSource, string> = {
    [LeadSource.WALK_IN]: "Walk In",
    [LeadSource.REFERRAL]: "Referral",
    [LeadSource.WEBSITE]: "Website",
    [LeadSource.PHONE_INQUIRY]: "Phone Inquiry",
    [LeadSource.EMAIL]: "Email",
    [LeadSource.SOCIAL_MEDIA]: "Social Media",
    [LeadSource.PARTNER]: "Partner",
    [LeadSource.EVENT]: "Event",
    [LeadSource.OTHER]: "Other",
  };
  return labels[source];
}

// Label helpers
const getStageLabel = (stage: SpancoStage) => STAGE_LABELS[stage];
const getStatusLabel = (status: LeadStatus) => STATUS_LABELS[status];
const getPriorityLabel = (priority: Priority) => PRIORITY_LABELS[priority];
const getCustomerTypeLabel = (type: string) =>
  CUSTOMER_TYPE_LABELS[type as keyof typeof CUSTOMER_TYPE_LABELS];

// Color mapping
function getStageColorSemantic(
  stage: SpancoStage
):
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral" {
  const colorMap: Record<
    string,
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "neutral"
  > = {
    gray: "neutral",
    blue: "primary",
    cyan: "info",
    purple: "secondary",
    orange: "warning",
    green: "success",
  };
  return colorMap[STAGE_COLORS[stage]] || "neutral";
}

function getStatusColorSemantic(
  status: LeadStatus
):
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral" {
  const colorMap: Record<
    string,
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "neutral"
  > = {
    green: "success",
    orange: "warning",
    emerald: "success",
    red: "error",
    gray: "neutral",
  };
  return colorMap[STATUS_COLORS[status]] || "neutral";
}

function getPriorityColorSemantic(
  priority: Priority
):
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral" {
  const colorMap: Record<
    string,
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "neutral"
  > = {
    gray: "neutral",
    blue: "primary",
    orange: "warning",
    red: "error",
    rose: "error",
  };
  return colorMap[PRIORITY_COLORS[priority]] || "neutral";
}
// Helper to get user initials
function getInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(p => p.length > 0);
  
  if (parts.length === 0) return 'U';
  if (parts.length === 1) {
    return (parts[0]?.substring(0, 2) || 'U').toUpperCase();
  }
  
  // Get first and last name initials
  const firstInitial = parts[0]?.[0];
  const lastInitial = parts[parts.length - 1]?.[0];
  
  if (firstInitial && lastInitial) {
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }
  
  return (parts[0]?.substring(0, 2) || 'U').toUpperCase();
}


</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
