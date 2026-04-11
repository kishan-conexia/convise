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
              <UButton
                v-if="canEditLead && !isEditing"
                color="primary"
                variant="soft"
                size="sm"
                @click="startEditing"
              >
                <UIcon name="i-heroicons-pencil-square" class="h-4 w-4 mr-1" />
                Edit
              </UButton>
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
            <div v-if="!isEditing" class="flex items-center gap-3">
              <UBadge
                :color="getStatusColorSemantic(getEffectiveStatus(lead))"
                variant="soft"
                size="lg"
              >
                <UIcon
                  :name="getStatusIcon(getEffectiveStatus(lead))"
                  class="h-4 w-4 mr-1"
                />
                {{ getStatusLabel(getEffectiveStatus(lead)) }}
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
            <!-- Editable Status, Priority, Stage -->
            <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white border-l-4 border-l-blue-500 border border-gray-200 rounded-lg p-4">
              <div>
                <label class="text-xs font-semibold text-gray-800 mb-1 block">Stage</label>
                <select v-model="editForm.current_stage" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option v-for="s in Object.values(SpancoStage)" :key="s" :value="s">{{ getStageLabel(s) }}</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-800 mb-1 block">Status</label>
                <select v-model="editForm.status" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option v-for="s in Object.values(LeadStatus)" :key="s" :value="s">{{ getStatusLabel(s) }}</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-800 mb-1 block">Priority</label>
                <select v-model="editForm.priority" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option v-for="p in Object.values(Priority)" :key="p" :value="p">{{ getPriorityLabel(p) }}</option>
                </select>
              </div>
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
              <!-- View mode -->
              <div
                v-if="!isEditing"
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
                <LmsDetailRow label="Phone" :value="lead.customer_info.phone" is-phone />
                <LmsDetailRow
                  v-if="lead.customer_info.email"
                  label="Email"
                  :value="lead.customer_info.email"
                />
                <LmsDetailRow
                  v-if="lead.customer_info.alternate_phone"
                  label="Alternate Phone"
                  :value="lead.customer_info.alternate_phone"
                  is-phone
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
              <!-- Edit mode -->
              <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border-l-4 border-l-blue-500 border border-gray-200 rounded-lg p-4"
              >
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Name</label>
                  <input v-model="editForm.customer_info.name" type="text" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Type</label>
                  <select v-model="editForm.customer_info.type" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option v-for="t in Object.values(CustomerType)" :key="t" :value="t">{{ getCustomerTypeLabel(t) }}</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Contact Person</label>
                  <input v-model="editForm.customer_info.contact_person" type="text" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Phone</label>
                  <input v-model="editForm.customer_info.phone" type="text" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Email</label>
                  <input v-model="editForm.customer_info.email" type="email" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Alternate Phone</label>
                  <input v-model="editForm.customer_info.alternate_phone" type="text" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Company</label>
                  <input v-model="editForm.customer_info.company_name" type="text" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">GSTIN</label>
                  <input v-model="editForm.customer_info.gstin" type="text" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
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
              <!-- View mode -->
              <div
                v-if="!isEditing"
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
              <!-- Edit mode -->
              <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border-l-4 border-l-blue-500 border border-gray-200 rounded-lg p-4"
              >
                <div class="md:col-span-2">
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Address</label>
                  <input v-model="editForm.service_location.address" type="text" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">City</label>
                  <input v-model="editForm.service_location.city" type="text" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">State</label>
                  <input v-model="editForm.service_location.state" type="text" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Pincode</label>
                  <input v-model="editForm.service_location.pincode" type="text" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Landmark</label>
                  <input v-model="editForm.service_location.landmark" type="text" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
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
              <!-- View mode -->
              <div
                v-if="!isEditing"
                class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4"
              >
                <LmsDetailRow
                  label="Service Type"
                  :value="getCustomerTypeLabel(lead.customer_info.type)"
                />
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
                <LmsDetailRow
                  v-if="lead.service_requirements.number_of_connections != null"
                  label="No. of Connections"
                  :value="String(lead.service_requirements.number_of_connections)"
                />
                <LmsDetailRow
                  v-if="lead.service_requirements.current_customers != null"
                  label="Current Customers"
                  :value="String(lead.service_requirements.current_customers)"
                />
                <LmsDetailRow
                  v-if="lead.service_requirements.expected_customers != null"
                  label="Expected Customers"
                  :value="String(lead.service_requirements.expected_customers)"
                />
                <LmsDetailRow
                  v-if="lead.service_requirements.special_requirements"
                  label="Special Requirements"
                  :value="lead.service_requirements.special_requirements"
                  class="md:col-span-2"
                />
              </div>
              <!-- Edit mode -->
              <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border-l-4 border-l-blue-500 border border-gray-200 rounded-lg p-4"
              >
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Bandwidth Required</label>
                  <input v-model="editForm.service_requirements.bandwidth_required" type="text" placeholder="e.g. 100 Mbps" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Plan Interest</label>
                  <input v-model="editForm.service_requirements.plan_interest" type="text" placeholder="e.g. Business Fiber" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">No. of Connections</label>
                  <input v-model.number="editForm.service_requirements.number_of_connections" type="number" min="1" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Current Customers</label>
                  <input v-model.number="editForm.service_requirements.current_customers" type="number" min="0" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Expected Customers</label>
                  <input v-model.number="editForm.service_requirements.expected_customers" type="number" min="0" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div class="md:col-span-2">
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Special Requirements</label>
                  <textarea v-model="editForm.service_requirements.special_requirements" rows="2" placeholder="Any special requirements..." class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
                </div>
              </div>
            </div>

            <!-- Commercial Details -->
            <div v-if="lead.commercial_details || isEditing">
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-currency-rupee"
                  class="h-5 w-5 mr-2 text-emerald-600"
                />
                Commercial Details
              </h4>
              <!-- View mode -->
              <div
                v-if="!isEditing"
                class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4"
              >
                <LmsDetailRow
                  v-if="lead.commercial_details?.estimated_value"
                  label="Estimated Value"
                  :value="`₹${lead.commercial_details.estimated_value.toLocaleString(
                    'en-IN'
                  )}`"
                />
                <LmsDetailRow
                  v-if="lead.commercial_details?.proposed_monthly_rental"
                  label="Monthly Rental"
                  :value="`₹${lead.commercial_details.proposed_monthly_rental.toLocaleString(
                    'en-IN'
                  )}`"
                />
                <LmsDetailRow
                  v-if="lead.commercial_details?.proposed_installation_charge"
                  label="Installation Charge"
                  :value="`₹${lead.commercial_details.proposed_installation_charge.toLocaleString(
                    'en-IN'
                  )}`"
                />
                <LmsDetailRow
                  v-if="lead.commercial_details?.contract_period_months"
                  label="Contract Period"
                  :value="`${lead.commercial_details.contract_period_months} months`"
                />
                <LmsDetailRow
                  v-if="lead.commercial_details?.payment_terms"
                  label="Payment Terms"
                  :value="lead.commercial_details.payment_terms"
                  class="md:col-span-2"
                />
              </div>
              <!-- Edit mode -->
              <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border-l-4 border-l-blue-500 border border-gray-200 rounded-lg p-4"
              >
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Estimated Value (₹)</label>
                  <input v-model.number="editForm.commercial_details.estimated_value" type="number" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Monthly Rental (₹)</label>
                  <input v-model.number="editForm.commercial_details.proposed_monthly_rental" type="number" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Installation Charge (₹)</label>
                  <input v-model.number="editForm.commercial_details.proposed_installation_charge" type="number" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Contract Period (months)</label>
                  <input v-model.number="editForm.commercial_details.contract_period_months" type="number" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div class="md:col-span-2">
                  <label class="text-xs font-semibold text-gray-800 mb-1 block">Payment Terms</label>
                  <input v-model="editForm.commercial_details.payment_terms" type="text" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
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
            <div v-if="lead.notes?.remarks || lead.notes?.internal_notes || isEditing">
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-document-text"
                  class="h-5 w-5 mr-2 text-indigo-600"
                />
                Notes
              </h4>
              <!-- View mode -->
              <div v-if="!isEditing" class="space-y-3">
                <div
                  v-if="lead.notes?.remarks"
                  class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                >
                  <p class="text-xs font-medium text-yellow-800 mb-1">
                    Remarks
                  </p>
                  <p class="text-sm text-gray-700">{{ lead.notes.remarks }}</p>
                </div>
              </div>
              <!-- Edit mode -->
              <div v-else class="bg-white border-l-4 border-l-blue-500 border border-gray-200 rounded-lg p-4">
                <label class="text-xs font-semibold text-gray-800 mb-1 block">Remarks</label>
                <textarea v-model="editForm.notes.remarks" rows="3" class="w-full text-sm text-gray-900 bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter remarks..."></textarea>
              </div>
            </div>

            <!-- Outcome Details (for Lost/Won leads) -->
            <div
              v-if="
                lead.outcome_details &&
                (getEffectiveStatus(lead) === LeadStatus.LOST ||
                  getEffectiveStatus(lead) === LeadStatus.WON)
              "
            >
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  :name="
                    getEffectiveStatus(lead) === LeadStatus.WON
                      ? 'i-heroicons-trophy'
                      : 'i-heroicons-x-circle'
                  "
                  :class="[
                    'h-5 w-5 mr-2',
                    getEffectiveStatus(lead) === LeadStatus.WON
                      ? 'text-green-600'
                      : 'text-red-600',
                  ]"
                />
                {{
                  getEffectiveStatus(lead) === LeadStatus.WON
                    ? "Win Details"
                    : "Loss Details"
                }}
              </h4>
              <div
                :class="[
                  'rounded-lg p-4 space-y-3',
                  getEffectiveStatus(lead) === LeadStatus.WON
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

            <!-- ✅ Feasibility Requests Section -->
            <div>
              <h4
                class="text-sm font-semibold text-gray-900 mb-3 flex items-center"
              >
                <UIcon
                  name="i-heroicons-signal"
                  class="h-5 w-5 mr-2 text-teal-600"
                />
                Feasibility Requests
                <UBadge
                  v-if="feasibilityRequests.length > 0"
                  color="info"
                  variant="soft"
                  size="xs"
                  class="ml-2"
                >
                  {{ feasibilityRequests.length }}
                </UBadge>
              </h4>

              <!-- Loading state -->
              <div
                v-if="feasibilityStore.isLoading"
                class="bg-gray-50 rounded-lg p-6 flex items-center justify-center"
              >
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="h-5 w-5 text-gray-400 animate-spin mr-2"
                />
                <span class="text-sm text-gray-500"
                  >Loading feasibility data...</span
                >
              </div>

              <!-- Empty state -->
              <div
                v-else-if="feasibilityRequests.length === 0"
                class="bg-gray-50 rounded-lg p-6 flex flex-col items-center justify-center text-center"
              >
                <UIcon
                  name="i-heroicons-document-magnifying-glass"
                  class="h-8 w-8 text-gray-300 mb-2"
                />
                <p class="text-sm text-gray-500">No feasibility requests yet</p>
                <p class="text-xs text-gray-400 mt-1">
                  Feasibility requests can be created from the mobile app
                </p>
              </div>

              <!-- Request cards -->
              <div v-else class="space-y-3">
                <div
                  v-for="req in feasibilityRequests"
                  :key="req.id"
                  class="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <!-- Card Header -->
                  <div
                    class="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold text-gray-900">{{
                        req.request_number
                      }}</span>
                      <UBadge
                        :color="getFeasibilityStatusColor(req.status)"
                        variant="soft"
                        size="xs"
                      >
                        <UIcon
                          :name="getFeasibilityStatusIcon(req.status)"
                          class="h-3 w-3 mr-1"
                        />
                        {{ getFeasibilityStatusLabel(req.status) }}
                      </UBadge>
                    </div>
                    <span class="text-xs text-gray-500">{{
                      formatDate(req.created_at)
                    }}</span>
                  </div>

                  <!-- Card Body -->
                  <div class="p-4 space-y-4">

                    <!-- ═══ 1. Location Details ═══ -->
                    <div>
                      <h5 class="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <UIcon name="i-heroicons-map-pin" class="h-4 w-4 text-rose-500" />
                        Location
                      </h5>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
                        <LmsDetailRow label="Address" :value="req.service_location.address" />
                        <LmsDetailRow label="City" :value="req.service_location.city" />
                        <LmsDetailRow label="State" :value="req.service_location.state" />
                        <LmsDetailRow label="Pincode" :value="req.service_location.pincode" />
                      </div>
                    </div>

                    <!-- ═══ 2. Service Requirements ═══ -->
                    <div>
                      <h5 class="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <UIcon name="i-heroicons-cog-6-tooth" class="h-4 w-4 text-purple-500" />
                        Service Requirements
                      </h5>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
                        <LmsDetailRow
                          v-if="req.service_requirements?.feasibility_type"
                          label="Feasibility Type"
                          :value="capitalize(req.service_requirements.feasibility_type)"
                        />
                        <LmsDetailRow
                          v-if="req.service_requirements?.connection_type"
                          label="Service Type"
                          :value="formatConnectionType(req.service_requirements.connection_type)"
                        />
                        <LmsDetailRow
                          v-if="req.service_requirements?.bandwidth"
                          label="Bandwidth"
                          :value="req.service_requirements.bandwidth"
                        />
                        <LmsDetailRow
                          v-if="req.service_requirements?.urgency"
                          label="Urgency"
                          :value="capitalize(req.service_requirements.urgency)"
                        />
                        <LmsDetailRow
                          v-if="req.service_requirements?.priority"
                          label="Priority"
                          :value="capitalize(req.service_requirements.priority)"
                        />
                        <LmsDetailRow
                          v-if="req.service_requirements?.static_ip_required"
                          label="Static IP"
                          :value="`Yes (${req.service_requirements.static_ip_count || 0})`"
                        />
                        <LmsDetailRow
                          v-if="req.service_requirements?.ipv6_required"
                          label="IPv6 Required"
                          value="Yes"
                        />
                        <LmsDetailRow
                          v-if="req.service_requirements?.special_conditions"
                          label="Special Conditions"
                          :value="req.service_requirements.special_conditions"
                          class="md:col-span-2"
                        />
                      </div>
                    </div>

                    <!-- ═══ 3. Primary Route ═══ -->
                    <div>
                      <h5 class="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <UIcon name="i-heroicons-arrow-trending-up" class="h-4 w-4 text-blue-500" />
                        Primary Connectivity Route
                        <UBadge
                          :color="req.primary_route ? (req.primary_route.is_feasible ? 'success' : 'error') : 'neutral'"
                          variant="soft"
                          size="xs"
                        >
                          {{ req.primary_route ? (req.primary_route.is_feasible ? 'Feasible' : 'Not Feasible') : 'Pending Evaluation' }}
                        </UBadge>
                      </h5>
                      <!-- Pending -->
                      <div
                        v-if="!req.primary_route"
                        class="bg-gray-50 rounded-lg p-4 text-center text-xs text-gray-400"
                      >
                        <UIcon name="i-heroicons-minus-circle" class="h-5 w-5 mx-auto mb-1" />
                        Awaiting route evaluation
                      </div>
                      <!-- Not feasible -->
                      <div
                        v-else-if="!req.primary_route.is_feasible"
                        class="bg-red-50 border border-red-100 rounded-lg p-3 space-y-2"
                      >
                        <LmsDetailRow v-if="req.primary_route.reason" label="Reason" :value="req.primary_route.reason" />
                        <LmsDetailRow v-if="req.primary_route.remarks" label="Remarks" :value="req.primary_route.remarks" />
                        <LmsDetailRow
                          v-if="req.primary_route.technical_constraints?.length"
                          label="Constraints"
                          :value="req.primary_route.technical_constraints.join(', ')"
                        />
                      </div>
                      <!-- Feasible: full details -->
                      <div v-else class="space-y-2">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 bg-green-50 border border-green-100 rounded-lg p-3">
                          <LmsDetailRow v-if="req.primary_route.route_name" label="Route Name" :value="req.primary_route.route_name" />
                          <LmsDetailRow v-if="req.primary_route.source_node_name" label="Source Node" :value="req.primary_route.source_node_name" />
                          <LmsDetailRow v-if="req.primary_route.distance_km != null" label="Distance" :value="`${req.primary_route.distance_km} km`" />
                          <LmsDetailRow v-if="req.primary_route.technology" label="Technology" :value="req.primary_route.technology" />
                          <LmsDetailRow v-if="req.primary_route.total_fiber_length_mtr != null" label="Fiber Length" :value="`${req.primary_route.total_fiber_length_mtr} m`" />
                          <LmsDetailRow v-if="req.primary_route.infrastructure_available != null" label="Infra Available" :value="req.primary_route.infrastructure_available ? 'Yes' : 'No'" />
                          <LmsDetailRow v-if="req.primary_route.requires_row" label="Requires ROW" value="Yes" />
                          <LmsDetailRow v-if="req.primary_route.installation_days != null" label="Installation" :value="`${req.primary_route.installation_days} days`" />
                          <LmsDetailRow v-if="req.primary_route.remarks" label="Remarks" :value="req.primary_route.remarks" class="md:col-span-2" />
                        </div>
                        <!-- Cost Breakdown Table -->
                        <div v-if="req.primary_route.cost_items?.length" class="border border-gray-200 rounded-lg overflow-hidden text-xs">
                          <div class="bg-gray-100 px-3 py-2 grid grid-cols-12 gap-1 font-semibold text-gray-600">
                            <span class="col-span-5">Item</span>
                            <span class="col-span-2">UOM</span>
                            <span class="col-span-2 text-right">Qty</span>
                            <span class="col-span-3 text-right">Cost</span>
                          </div>
                          <div
                            v-for="(item, ci) in req.primary_route.cost_items"
                            :key="ci"
                            class="px-3 py-2 grid grid-cols-12 gap-1 border-t border-gray-100"
                          >
                            <span class="col-span-5 text-gray-700">{{ item.name }}</span>
                            <span class="col-span-2 text-gray-500">{{ item.unit }}</span>
                            <span class="col-span-2 text-right text-gray-700">{{ item.quantity }}</span>
                            <span class="col-span-3 text-right font-medium text-gray-900">₹{{ item.total_cost?.toLocaleString('en-IN') }}</span>
                          </div>
                          <!-- Cost summary -->
                          <div class="bg-blue-50 px-3 py-2 space-y-1 border-t border-blue-100">
                            <div v-if="req.primary_route.consumable_capex != null" class="flex justify-between">
                              <span class="text-gray-600">Consumable CAPEX</span>
                              <span class="font-medium">₹{{ req.primary_route.consumable_capex.toLocaleString('en-IN') }}</span>
                            </div>
                            <div v-if="req.primary_route.recoverable_capex != null" class="flex justify-between">
                              <span class="text-gray-600">Recoverable CAPEX</span>
                              <span class="font-medium">₹{{ req.primary_route.recoverable_capex.toLocaleString('en-IN') }}</span>
                            </div>
                            <div v-if="req.primary_route.total_capex != null" class="flex justify-between pt-1 border-t border-blue-200 font-semibold">
                              <span>Total CAPEX</span>
                              <span class="text-blue-900">₹{{ req.primary_route.total_capex.toLocaleString('en-IN') }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- ═══ 4. Secondary Route ═══ -->
                    <div>
                      <h5 class="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <UIcon name="i-heroicons-arrow-trending-up" class="h-4 w-4 text-indigo-500" />
                        Secondary Connectivity Route
                        <UBadge
                          :color="req.secondary_route ? (req.secondary_route.is_feasible ? 'success' : 'error') : 'neutral'"
                          variant="soft"
                          size="xs"
                        >
                          {{ req.secondary_route ? (req.secondary_route.is_feasible ? 'Feasible' : 'Not Feasible') : 'Pending Evaluation' }}
                        </UBadge>
                      </h5>
                      <div
                        v-if="!req.secondary_route"
                        class="bg-gray-50 rounded-lg p-4 text-center text-xs text-gray-400"
                      >
                        <UIcon name="i-heroicons-minus-circle" class="h-5 w-5 mx-auto mb-1" />
                        Awaiting route evaluation
                      </div>
                      <div
                        v-else-if="!req.secondary_route.is_feasible"
                        class="bg-red-50 border border-red-100 rounded-lg p-3 space-y-2"
                      >
                        <LmsDetailRow v-if="req.secondary_route.reason" label="Reason" :value="req.secondary_route.reason" />
                        <LmsDetailRow v-if="req.secondary_route.remarks" label="Remarks" :value="req.secondary_route.remarks" />
                        <LmsDetailRow
                          v-if="req.secondary_route.technical_constraints?.length"
                          label="Constraints"
                          :value="req.secondary_route.technical_constraints.join(', ')"
                        />
                      </div>
                      <div v-else class="space-y-2">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 bg-green-50 border border-green-100 rounded-lg p-3">
                          <LmsDetailRow v-if="req.secondary_route.route_name" label="Route Name" :value="req.secondary_route.route_name" />
                          <LmsDetailRow v-if="req.secondary_route.source_node_name" label="Source Node" :value="req.secondary_route.source_node_name" />
                          <LmsDetailRow v-if="req.secondary_route.distance_km != null" label="Distance" :value="`${req.secondary_route.distance_km} km`" />
                          <LmsDetailRow v-if="req.secondary_route.technology" label="Technology" :value="req.secondary_route.technology" />
                          <LmsDetailRow v-if="req.secondary_route.total_fiber_length_mtr != null" label="Fiber Length" :value="`${req.secondary_route.total_fiber_length_mtr} m`" />
                          <LmsDetailRow v-if="req.secondary_route.infrastructure_available != null" label="Infra Available" :value="req.secondary_route.infrastructure_available ? 'Yes' : 'No'" />
                          <LmsDetailRow v-if="req.secondary_route.requires_row" label="Requires ROW" value="Yes" />
                          <LmsDetailRow v-if="req.secondary_route.installation_days != null" label="Installation" :value="`${req.secondary_route.installation_days} days`" />
                          <LmsDetailRow v-if="req.secondary_route.remarks" label="Remarks" :value="req.secondary_route.remarks" class="md:col-span-2" />
                        </div>
                        <!-- Cost Breakdown Table -->
                        <div v-if="req.secondary_route.cost_items?.length" class="border border-gray-200 rounded-lg overflow-hidden text-xs">
                          <div class="bg-gray-100 px-3 py-2 grid grid-cols-12 gap-1 font-semibold text-gray-600">
                            <span class="col-span-5">Item</span>
                            <span class="col-span-2">UOM</span>
                            <span class="col-span-2 text-right">Qty</span>
                            <span class="col-span-3 text-right">Cost</span>
                          </div>
                          <div
                            v-for="(item, ci) in req.secondary_route.cost_items"
                            :key="ci"
                            class="px-3 py-2 grid grid-cols-12 gap-1 border-t border-gray-100"
                          >
                            <span class="col-span-5 text-gray-700">{{ item.name }}</span>
                            <span class="col-span-2 text-gray-500">{{ item.unit }}</span>
                            <span class="col-span-2 text-right text-gray-700">{{ item.quantity }}</span>
                            <span class="col-span-3 text-right font-medium text-gray-900">₹{{ item.total_cost?.toLocaleString('en-IN') }}</span>
                          </div>
                          <div class="bg-blue-50 px-3 py-2 space-y-1 border-t border-blue-100">
                            <div v-if="req.secondary_route.consumable_capex != null" class="flex justify-between">
                              <span class="text-gray-600">Consumable CAPEX</span>
                              <span class="font-medium">₹{{ req.secondary_route.consumable_capex.toLocaleString('en-IN') }}</span>
                            </div>
                            <div v-if="req.secondary_route.recoverable_capex != null" class="flex justify-between">
                              <span class="text-gray-600">Recoverable CAPEX</span>
                              <span class="font-medium">₹{{ req.secondary_route.recoverable_capex.toLocaleString('en-IN') }}</span>
                            </div>
                            <div v-if="req.secondary_route.total_capex != null" class="flex justify-between pt-1 border-t border-blue-200 font-semibold">
                              <span>Total CAPEX</span>
                              <span class="text-blue-900">₹{{ req.secondary_route.total_capex.toLocaleString('en-IN') }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- ═══ 5. Site Survey ═══ -->
                    <div v-if="req.site_survey">
                      <h5 class="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <UIcon name="i-heroicons-clipboard-document-check" class="h-4 w-4 text-amber-500" />
                        Site Survey
                      </h5>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
                        <LmsDetailRow v-if="req.site_survey.surveyed_by" label="Surveyor" :value="req.site_survey.surveyed_by" />
                        <LmsDetailRow v-if="req.site_survey.surveyed_at" label="Survey Date" :value="formatDate(req.site_survey.surveyed_at)" />
                        <LmsDetailRow v-if="req.site_survey.site_accessible != null" label="Site Accessible" :value="req.site_survey.site_accessible ? 'Yes' : 'No'" />
                        <LmsDetailRow v-if="req.site_survey.power_available != null" label="Power Available" :value="req.site_survey.power_available ? 'Yes' : 'No'" />
                        <LmsDetailRow v-if="req.site_survey.indoor_space_available != null" label="Indoor Space" :value="req.site_survey.indoor_space_available ? 'Yes' : 'No'" />
                        <LmsDetailRow v-if="req.site_survey.mounting_type" label="Mounting Type" :value="req.site_survey.mounting_type" />
                        <LmsDetailRow v-if="req.site_survey.notes" label="Notes" :value="req.site_survey.notes" class="md:col-span-2" />
                      </div>
                    </div>

                    <!-- ═══ 6. Commercial Assessment ═══ -->
                    <div v-if="req.estimated_capex != null || req.estimated_opex != null || req.estimated_roi_months != null">
                      <h5 class="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <UIcon name="i-heroicons-currency-rupee" class="h-4 w-4 text-emerald-500" />
                        Commercial Assessment
                      </h5>
                      <div class="border border-gray-200 rounded-lg overflow-hidden">
                        <!-- CAPEX -->
                        <div v-if="req.estimated_capex != null" class="bg-blue-50 px-4 py-3">
                          <div class="flex items-center gap-2 text-xs text-blue-600 font-medium mb-1">
                            <UIcon name="i-heroicons-calculator" class="h-3.5 w-3.5" />
                            Capital Expenditure (CAPEX)
                          </div>
                          <p class="text-lg font-bold text-blue-900">
                            ₹{{ req.estimated_capex.toLocaleString('en-IN') }}
                          </p>
                        </div>
                        <!-- OPEX -->
                        <div v-if="req.estimated_opex != null" class="px-4 py-3 border-t border-gray-200" :class="req.estimated_capex == null ? 'bg-orange-50' : ''">
                          <div class="flex items-center gap-2 text-xs text-orange-600 font-medium mb-1">
                            <UIcon name="i-heroicons-arrow-trending-up" class="h-3.5 w-3.5" />
                            Monthly Operational Expenditure
                          </div>
                          <p class="text-lg font-bold text-orange-900">
                            ₹{{ req.estimated_opex.toLocaleString('en-IN') }}/mo
                          </p>
                        </div>
                        <!-- ROI & Viability -->
                        <div v-if="req.estimated_roi_months != null || req.is_commercially_viable != null" class="px-4 py-3 border-t border-gray-200 flex items-center gap-4">
                          <div v-if="req.estimated_roi_months != null" class="text-xs">
                            <span class="text-gray-500">ROI Period:</span>
                            <span class="font-semibold text-gray-900 ml-1">{{ req.estimated_roi_months }} months</span>
                          </div>
                          <UBadge
                            v-if="req.is_commercially_viable != null"
                            :color="req.is_commercially_viable ? 'success' : 'error'"
                            variant="soft"
                            size="xs"
                          >
                            {{ req.is_commercially_viable ? 'Commercially Viable' : 'Not Viable' }}
                          </UBadge>
                        </div>
                        <!-- Commercial remarks -->
                        <div v-if="req.commercial_remarks" class="px-4 py-3 border-t border-gray-200 text-xs text-gray-600">
                          <span class="font-medium text-gray-700">Remarks:</span> {{ req.commercial_remarks }}
                        </div>
                      </div>
                    </div>

                    <!-- ═══ 7. Review Status ═══ -->
                    <div>
                      <h5 class="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <UIcon name="i-heroicons-shield-check" class="h-4 w-4 text-gray-500" />
                        Review Status
                      </h5>
                      <!-- Not yet reviewed -->
                      <div
                        v-if="req.reviewed_by == null || req.is_feasible == null"
                        class="rounded-lg p-4 flex items-center gap-3"
                        :class="{
                          'bg-gray-50 border border-gray-200': req.status === 'pending',
                          'bg-blue-50 border border-blue-200': req.status === 'under_review',
                          'bg-orange-50 border border-orange-200': req.status === 'cancelled',
                        }"
                      >
                        <UIcon
                          :name="req.status === 'under_review' ? 'i-heroicons-magnifying-glass' : req.status === 'cancelled' ? 'i-heroicons-no-symbol' : 'i-heroicons-clock'"
                          class="h-5 w-5"
                          :class="{
                            'text-gray-500': req.status === 'pending',
                            'text-blue-600': req.status === 'under_review',
                            'text-orange-600': req.status === 'cancelled',
                          }"
                        />
                        <span class="text-sm font-medium" :class="{
                          'text-gray-600': req.status === 'pending',
                          'text-blue-700': req.status === 'under_review',
                          'text-orange-700': req.status === 'cancelled',
                        }">
                          {{ req.status === 'under_review' ? 'Feasibility assessment in progress' : req.status === 'cancelled' ? 'Request has been cancelled' : 'Awaiting feasibility review' }}
                        </span>
                      </div>
                      <!-- Reviewed (approved or rejected) -->
                      <div
                        v-else
                        class="rounded-lg p-4 space-y-3"
                        :class="req.is_feasible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'"
                      >
                        <div class="flex items-center gap-2">
                          <UIcon
                            :name="req.is_feasible ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                            class="h-5 w-5"
                            :class="req.is_feasible ? 'text-green-600' : 'text-red-600'"
                          />
                          <span class="text-sm font-semibold" :class="req.is_feasible ? 'text-green-700' : 'text-red-700'">
                            {{ req.is_feasible ? 'Approved' : 'Rejected' }}
                          </span>
                        </div>
                        <div v-if="req.feasibility_remarks" class="bg-white rounded-md p-3 text-sm text-gray-700">
                          {{ req.feasibility_remarks }}
                        </div>
                        <p v-if="req.reviewed_at" class="text-xs text-gray-500">
                          Reviewed on {{ formatDate(req.reviewed_at) }}
                        </p>
                      </div>
                    </div>

                    <!-- ═══ 8. Assignment & Timeline ═══ -->
                    <div class="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <div class="flex items-center gap-1.5">
                        <UIcon name="i-heroicons-user" class="h-3.5 w-3.5" />
                        <span>Requested by {{ req.requester_profile?.full_name || 'Unknown' }}</span>
                      </div>
                      <div v-if="req.reviewer_profile?.full_name" class="flex items-center gap-1.5">
                        <UIcon name="i-heroicons-check-badge" class="h-3.5 w-3.5" />
                        <span>Reviewed by {{ req.reviewer_profile.full_name }}</span>
                      </div>
                    </div>

                    <!-- ═══ 9. Status History Timeline ═══ -->
                    <div
                      v-if="req.status_history && req.status_history.length > 0"
                      class="pt-3 border-t border-gray-100"
                    >
                      <p class="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <UIcon name="i-heroicons-clock" class="h-4 w-4 text-gray-400" />
                        Status History ({{ req.status_history.length }} event{{ req.status_history.length > 1 ? 's' : '' }})
                      </p>
                      <div class="space-y-1.5">
                        <div
                          v-for="(entry, idx) in req.status_history"
                          :key="idx"
                          class="flex items-start gap-2 text-xs"
                        >
                          <div
                            class="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                            :class="idx === req.status_history.length - 1 ? 'bg-blue-500' : 'bg-gray-300'"
                          />
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                              <UBadge
                                :color="getFeasibilityStatusColor(entry.status)"
                                variant="soft"
                                size="xs"
                              >
                                {{ getFeasibilityStatusLabel(entry.status) }}
                              </UBadge>
                              <span class="text-gray-400">{{ formatDate(entry.timestamp) }}</span>
                            </div>
                            <p v-if="entry.note" class="text-gray-500 mt-0.5">{{ entry.note }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-6 pt-4 border-t flex justify-end gap-2">
            <template v-if="isEditing">
              <UButton
                color="neutral"
                variant="outline"
                class="bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300 font-medium"
                @click="cancelEditing"
                :disabled="isSaving"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                class="font-medium"
                @click="saveChanges"
                :loading="isSaving"
              >
                <UIcon name="i-heroicons-check" class="h-4 w-4 mr-1" />
                Save Changes
              </UButton>
            </template>
            <UButton
              v-else
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
const feasibilityStore = useFeasibilityStore();
const userProfileStore = useUserProfileStore();
const supabaseUser = useSupabaseUser();

const isOpen = computed(() => leadStore.selectedLeadId !== null);
const lead = computed(() => leadStore.selectedLead);
const stageHistory = computed(() => {
  if (!lead.value) return [];
  return leadStore.stageHistory[lead.value.id] || [];
});

// ======== Edit mode ========
const isEditing = ref(false);
const isSaving = ref(false);
const saveError = ref<string | null>(null);

// User can edit if they have all_leads_edit_access OR are the assigned user
const canEditLead = computed(() => {
  if (!lead.value) return false;
  const isAssignedUser = lead.value.assigned_to === supabaseUser.value?.id;
  return userProfileStore.canEditAllLeads || isAssignedUser;
});

// Reactive edit form — populated from lead when entering edit mode
const editForm = reactive({
  current_stage: '' as string,
  status: '' as string,
  priority: '' as string,
  customer_info: {
    name: '',
    type: '' as string,
    phone: '',
    email: '',
    alternate_phone: '',
    contact_person: '',
    company_name: '',
    gstin: '',
    pan: '',
  },
  service_location: {
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  },
  service_requirements: {
    bandwidth_required: '',
    plan_interest: '',
    number_of_connections: undefined as number | undefined,
    current_customers: undefined as number | undefined,
    expected_customers: undefined as number | undefined,
    special_requirements: '',
  },
  commercial_details: {
    estimated_value: undefined as number | undefined,
    proposed_monthly_rental: undefined as number | undefined,
    proposed_installation_charge: undefined as number | undefined,
    contract_period_months: undefined as number | undefined,
    payment_terms: '',
  },
  notes: {
    remarks: '',
    internal_notes: '',
  },
});

function startEditing() {
  if (!lead.value) return;
  // Deep-copy current lead data into form
  editForm.current_stage = lead.value.current_stage;
  editForm.status = lead.value.status;
  editForm.priority = lead.value.priority;

  editForm.customer_info.name = lead.value.customer_info.name || '';
  editForm.customer_info.type = lead.value.customer_info.type || '';
  editForm.customer_info.phone = lead.value.customer_info.phone || '';
  editForm.customer_info.email = lead.value.customer_info.email || '';
  editForm.customer_info.alternate_phone = lead.value.customer_info.alternate_phone || '';
  editForm.customer_info.contact_person = lead.value.customer_info.contact_person || '';
  editForm.customer_info.company_name = lead.value.customer_info.company_name || '';
  editForm.customer_info.gstin = lead.value.customer_info.gstin || '';
  editForm.customer_info.pan = lead.value.customer_info.pan || '';

  editForm.service_location.address = lead.value.service_location.address || '';
  editForm.service_location.city = lead.value.service_location.city || '';
  editForm.service_location.state = lead.value.service_location.state || '';
  editForm.service_location.pincode = lead.value.service_location.pincode || '';
  editForm.service_location.landmark = lead.value.service_location.landmark || '';

  editForm.service_requirements.bandwidth_required = lead.value.service_requirements.bandwidth_required || '';
  editForm.service_requirements.plan_interest = lead.value.service_requirements.plan_interest || '';
  editForm.service_requirements.number_of_connections = lead.value.service_requirements.number_of_connections;
  editForm.service_requirements.current_customers = lead.value.service_requirements.current_customers;
  editForm.service_requirements.expected_customers = lead.value.service_requirements.expected_customers;
  editForm.service_requirements.special_requirements = lead.value.service_requirements.special_requirements || '';

  editForm.commercial_details.estimated_value = lead.value.commercial_details?.estimated_value;
  editForm.commercial_details.proposed_monthly_rental = lead.value.commercial_details?.proposed_monthly_rental;
  editForm.commercial_details.proposed_installation_charge = lead.value.commercial_details?.proposed_installation_charge;
  editForm.commercial_details.contract_period_months = lead.value.commercial_details?.contract_period_months;
  editForm.commercial_details.payment_terms = lead.value.commercial_details?.payment_terms || '';

  editForm.notes.remarks = lead.value.notes?.remarks || '';
  editForm.notes.internal_notes = lead.value.notes?.internal_notes || '';

  saveError.value = null;
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
  saveError.value = null;
}

async function saveChanges() {
  if (!lead.value) return;

  isSaving.value = true;
  saveError.value = null;

  try {
    const updates: Record<string, unknown> = {
      current_stage: editForm.current_stage,
      status: editForm.status,
      priority: editForm.priority,
      customer_info: { ...editForm.customer_info },
      service_location: { ...editForm.service_location },
      service_requirements: { ...editForm.service_requirements },
      commercial_details: { ...editForm.commercial_details },
      notes: { ...editForm.notes },
    };

    const success = await leadStore.updateLead(lead.value.id, updates);

    if (success) {
      isEditing.value = false;
    } else {
      saveError.value = leadStore.error || 'Failed to save changes';
    }
  } catch (err: any) {
    saveError.value = err.message || 'An unexpected error occurred';
  } finally {
    isSaving.value = false;
  }
}

// Feasibility requests for the current lead
const feasibilityRequests = computed(() => {
  if (!lead.value) return [];
  return feasibilityStore.getRequestsForLead(lead.value.id);
});

// Fetch feasibility requests whenever a lead is selected
watch(
  () => leadStore.selectedLeadId,
  (newId) => {
    if (newId !== null) {
      feasibilityStore.fetchRequestsForLead(newId);
    }
  },
);

// Reset edit mode when modal closes
watch(isOpen, (open) => {
  if (!open) {
    isEditing.value = false;
    saveError.value = null;
  }
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

// Feasibility helpers
function getFeasibilityStatusLabel(status: string): string {
  return FEASIBILITY_STATUS_LABELS[status] || status;
}

function getFeasibilityStatusColor(
  status: string,
): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const color = FEASIBILITY_STATUS_COLORS[status];
  return (color as any) || 'neutral';
}

function getFeasibilityStatusIcon(status: string): string {
  return FEASIBILITY_STATUS_ICONS[status] || 'i-heroicons-question-mark-circle';
}

function formatConnectionType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
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
