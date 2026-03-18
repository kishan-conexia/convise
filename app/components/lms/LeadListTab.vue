<template>
  <div>
    <!-- Search and View Options -->
    <div class="mb-6 space-y-4">
      <!-- Search Bar -->
      <div class="flex gap-3">
        <div class="flex-1">
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search leads..."
                :class="[
                  'w-full pl-12 pr-12 text-gray-900 bg-white rounded-xl focus:outline-none transition-all duration-200 placeholder-gray-400',
                  'py-2.5 text-sm sm:py-3 sm:text-base',
                  'border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
                ]"
              >
              <!-- Search Icon -->
              <UIcon
                name="i-heroicons-magnifying-glass"
                class="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              />
              <!-- Clear Button -->
              <button
                v-if="searchQuery"
                class="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                @click="searchQuery = ''"
              >
                <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
              </button>
            </div>
          </UCard>
        </div>

        <!-- View Toggle -->
        <div class="flex gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-lg">
          <UButton
            size="sm"
            :variant="viewMode === 'kanban' ? 'solid' : 'ghost'"
            :color="viewMode === 'kanban' ? 'primary' : 'neutral'"
            class="font-medium"
            @click="viewMode = 'kanban'"
          >
            <UIcon name="i-heroicons-view-columns" class="h-4 w-4" />
          </UButton>
          <UButton
            size="sm"
            :variant="viewMode === 'table' ? 'solid' : 'ghost'"
            :color="viewMode === 'table' ? 'primary' : 'neutral'"
            class="font-medium"
            @click="viewMode = 'table'"
          >
            <UIcon name="i-heroicons-table-cells" class="h-4 w-4" />
          </UButton>
        </div>
      </div>

      <!-- Quick Filters -->
      <div class="flex flex-wrap gap-2 relative z-[60]">
        <!-- ✅ NEW: Date Range Filters -->
        <div class="flex items-center gap-2 mr-2">
          <span class="text-xs font-medium text-gray-600">Closure Date:</span>
          <UButton
            v-for="(count, range) in leadStore.leadsByDateRange"
            :key="range"
            size="xs"
            :variant="leadStore.dateFilter === range ? 'solid' : 'outline'"
            :color="getDateRangeColor(range, leadStore.dateFilter === range)"
            :class="[
              leadStore.dateFilter !== range
                ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                : '',
            ]"
            @click="toggleDateFilter(range)"
          >
            <UIcon :name="getDateRangeIcon(range)" class="h-3 w-3 mr-1" />
            {{ getDateRangeLabel(range) }}
            <span class="ml-1 text-xs opacity-75">({{ count }})</span>
          </UButton>
        </div>

        <div class="border-l border-gray-300 pl-2 flex items-center gap-2">
          <span class="text-xs font-medium text-gray-600">Status:</span>
          <UButton
            v-for="status in Object.values(LeadStatus)"
            :key="String(status)"
            size="xs"
            :variant="selectedStatus === status ? 'solid' : 'outline'"
            :color="selectedStatus === status ? 'primary' : 'neutral'"
            :class="selectedStatus !== status ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300' : ''"
            @click="toggleStatusFilter(status)"
          >
            {{ getStatusLabel(status) }}
            <span class="ml-1 text-xs opacity-75">
              ({{ leadStore.summary.byStatus[status] || 0 }})
            </span>
          </UButton>
        </div>

        <!-- ✅ Salesperson Filter — Compact Dropdown -->
        <div
          v-if="leadStore.salespeople.length > 0"
          class="border-l border-gray-300 pl-2 flex items-center gap-2 relative"
          ref="salespersonDropdownRef"
        >
          <span class="text-xs font-medium text-gray-600">Assigned:</span>
          <UButton
            size="xs"
            :variant="leadStore.filters.assignedTo ? 'solid' : 'outline'"
            :color="leadStore.filters.assignedTo ? 'primary' : 'neutral'"
            :class="!leadStore.filters.assignedTo ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300' : ''"
            @click="showSalespersonDropdown = !showSalespersonDropdown"
          >
            <UIcon name="i-heroicons-user" class="h-3 w-3 mr-1" />
            {{ leadStore.filters.assignedTo ? getAssignedToName(leadStore.filters.assignedTo) : 'All' }}
            <UIcon
              :name="showSalespersonDropdown ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
              class="h-3 w-3 ml-1"
            />
          </UButton>

          <!-- Dropdown Panel -->
          <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showSalespersonDropdown"
              class="absolute top-full left-0 mt-2 w-72 bg-white/95 backdrop-blur-lg border border-gray-200 rounded-xl shadow-xl z-[999]"
              @click.stop
            >
              <div class="p-2 border-b border-gray-100">
                <input
                  v-model="salespersonSearch"
                  type="text"
                  placeholder="Search sales manager..."
                  class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                >
              </div>
              <div class="max-h-60 overflow-y-auto p-1">
                <div
                  v-for="person in filteredSalespeople"
                  :key="person.id"
                  :class="[
                    'flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 text-sm',
                    leadStore.filters.assignedTo === person.id
                      ? 'bg-emerald-50 text-emerald-800 font-medium'
                      : 'hover:bg-gray-50 text-gray-700',
                  ]"
                  @click="selectSalesperson(person.id)"
                >
                  <span
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-xs font-bold mr-2 flex-shrink-0"
                  >
                    {{ getInitials(person.full_name) }}
                  </span>
                  <span class="truncate">{{ person.full_name || 'Unknown' }}</span>
                  <UIcon
                    v-if="leadStore.filters.assignedTo === person.id"
                    name="i-heroicons-check"
                    class="h-4 w-4 ml-auto text-emerald-600 flex-shrink-0"
                  />
                </div>
                <div
                  v-if="filteredSalespeople.length === 0"
                  class="text-center py-4 text-sm text-gray-400"
                >
                  No matching sales manager
                </div>
              </div>
            </div>
          </transition>
        </div>

        <UButton
          v-if="selectedStatus || leadStore.dateFilter !== 'all' || leadStore.filters.assignedTo"
          size="xs"
          variant="ghost"
          color="neutral"
          class="hover:bg-gray-100 text-gray-700"
          @click="clearFilters"
        >
          Clear All
        </UButton>
      </div>
    </div>

    <!-- Kanban View -->
    <div v-if="viewMode === 'kanban'" class="overflow-x-auto pb-4">
      <div class="flex gap-4 min-w-max">
        <!-- Stage Column -->
        <div
          v-for="stage in Object.values(SpancoStage)"
          :key="String(stage)"
          class="flex-shrink-0 w-80"
        >
          <!-- Column Header -->
          <div class="bg-white/90 backdrop-blur-lg rounded-t-lg border-x border-t border-gray-200 p-4 shadow-md">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'w-3 h-3 rounded-full',
                    `bg-${STAGE_COLORS[stage]}-500`,
                  ]"
                />
                <h3 class="font-semibold text-gray-900 text-sm">
                  {{ getStageLabel(stage) }}
                </h3>
              </div>
              <UBadge
                :color="getStageColorSemantic(stage)"
                variant="soft"
                size="xs"
              >
                {{ getLeadsByStage(stage).length }}
              </UBadge>
            </div>
            <div class="text-xs text-gray-500">
              ₹{{ formatStageValue(stage) }}
            </div>
          </div>

          <!-- Cards Container -->
          <div class="bg-gray-50/50 backdrop-blur-sm border-x border-b border-gray-200 rounded-b-lg p-3 min-h-[500px] max-h-[calc(100vh-400px)] overflow-y-auto space-y-3">
            <!-- Lead Card -->
            <div
              v-for="lead in getLeadsByStage(stage)"
              :key="lead.id"
              class="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer group"
              @click="openLeadDetail(lead.id)"
            >
              <!-- Card Header -->
              <div class="flex items-start justify-between gap-2 mb-2">
                <h4 class="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {{ lead.customer_info.name }}
                </h4>
                <UBadge
                  :color="getStatusColorSemantic(lead.status)"
                  variant="soft"
                  size="xs"
                >
                  {{ getStatusLabel(lead.status) }}
                </UBadge>
              </div>

              <!-- Lead Info -->
              <div class="space-y-2 mb-3">
                <div class="flex items-center text-xs text-gray-600">
                  <UIcon name="i-heroicons-hashtag" class="h-3 w-3 mr-1" />
                  {{ lead.lead_number }}
                </div>
                <div class="flex items-center text-xs text-gray-600">
                  <UIcon name="i-heroicons-building-office-2" class="h-3 w-3 mr-1" />
                  {{ getCustomerTypeLabel(lead.customer_info.type) }}
                </div>
                <div class="flex items-center text-xs text-gray-600">
                  <UIcon name="i-heroicons-map-pin" class="h-3 w-3 mr-1" />
                  {{ lead.service_location.city }}
                </div>
                <!-- ✅ NEW: Expected Closure Date -->
                <div
                  v-if="lead.expected_closure_date"
                  class="flex items-center text-xs"
                  :class="getClosureDateTextClass(lead)"
                >
                  <UIcon
                    :name="getClosureDateIcon(lead)"
                    :class="['h-3 w-3 mr-1', getClosureDateColor(lead)]"
                  />
                  {{ formatClosureDate(lead.expected_closure_date) }}
                </div>
              </div>

              <!-- Card Footer -->
              <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                <UBadge
                  :color="getPriorityColorSemantic(lead.priority)"
                  variant="soft"
                  size="xs"
                >
                  {{ getPriorityLabel(lead.priority) }}
                </UBadge>
                <div
                  v-if="lead.commercial_details?.estimated_value"
                  class="text-xs font-semibold text-green-600"
                >
                  ₹{{ formatCurrency(lead.commercial_details.estimated_value) }}
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-if="getLeadsByStage(stage).length === 0"
              class="flex flex-col items-center justify-center py-8 text-gray-400"
            >
              <UIcon name="i-heroicons-inbox" class="h-12 w-12 mb-2" />
              <p class="text-xs">No leads</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-if="viewMode === 'table'" class="bg-white/80 backdrop-blur-lg rounded-lg border border-gray-200 shadow-xl overflow-hidden">
      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Lead #
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Customer
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Type
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Location
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Stage
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Priority
              </th>
              <!-- ✅ NEW: Closure Date Column -->
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Closure Date
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Value
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="lead in filteredTableLeads"
              :key="lead.id"
              class="hover:bg-gray-50 cursor-pointer transition-colors"
              @click="openLeadDetail(lead.id)"
            >
              <td class="px-4 py-3 text-sm text-gray-900 font-medium">
                {{ lead.lead_number }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">
                {{ lead.customer_info.name }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ getCustomerTypeLabel(lead.customer_info.type) }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ lead.service_location.city }}
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :color="getStageColorSemantic(lead.current_stage)"
                  variant="soft"
                  size="xs"
                >
                  {{ getStageLabel(lead.current_stage) }}
                </UBadge>
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :color="getStatusColorSemantic(lead.status)"
                  variant="soft"
                  size="xs"
                >
                  {{ getStatusLabel(lead.status) }}
                </UBadge>
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :color="getPriorityColorSemantic(lead.priority)"
                  variant="soft"
                  size="xs"
                >
                  {{ getPriorityLabel(lead.priority) }}
                </UBadge>
              </td>
              <!-- ✅ NEW: Closure Date Cell -->
              <td class="px-4 py-3">
                <div
                  v-if="lead.expected_closure_date"
                  class="flex items-center text-sm"
                  :class="getClosureDateTextClass(lead)"
                >
                  <UIcon
                    :name="getClosureDateIcon(lead)"
                    :class="['h-4 w-4 mr-1', getClosureDateColor(lead)]"
                  />
                  {{ formatClosureDate(lead.expected_closure_date) }}
                </div>
                <span v-else class="text-sm text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 text-sm font-semibold text-green-600">
                <span v-if="lead.commercial_details?.estimated_value">
                  ₹{{ formatCurrency(lead.commercial_details.estimated_value) }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ formatDate(lead.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div
          v-if="filteredTableLeads.length === 0"
          class="text-center py-12 text-gray-500"
        >
          <UIcon name="i-heroicons-inbox" class="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h4 class="text-lg font-semibold text-gray-700 mb-2">No Leads Found</h4>
          <p class="text-gray-600">Try adjusting your search or filters</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
const leadStore = useLeadStore()

// Local state
const searchQuery = ref('')
const viewMode = ref<'kanban' | 'table'>('kanban')
const selectedStatus = ref<LeadStatus | null>(null)

// Watch search query
watch(searchQuery, (newValue) => {
  leadStore.setSearchQuery(newValue)
})

// Toggle status filter
function toggleStatusFilter(status: LeadStatus) {
  selectedStatus.value = selectedStatus.value === status ? null : status
}

// ✅ NEW: Date filter toggle
function toggleDateFilter(range: string) {
  leadStore.setDateFilter(
    leadStore.dateFilter === range ? 'all' : (range as DateFilterType)
  )
}

// ✅ NEW: Clear all filters
function clearFilters() {
  selectedStatus.value = null
  leadStore.setDateFilter('all')
  leadStore.setAssignedToFilter(undefined)
  searchQuery.value = ''
}

// ✅ NEW: Assigned-to filter — searchable dropdown state
const showSalespersonDropdown = ref(false)
const salespersonDropdownRef = ref(null);

onClickOutside(salespersonDropdownRef, () => {
  showSalespersonDropdown.value = false;
});
const salespersonSearch = ref('')

const filteredSalespeople = computed(() => {
  const query = salespersonSearch.value.toLowerCase()
  if (!query) return leadStore.salespeople
  return leadStore.salespeople.filter((p) =>
    (p.full_name || '').toLowerCase().includes(query)
  )
})

function selectSalesperson(userId: string) {
  leadStore.setAssignedToFilter(
    leadStore.filters.assignedTo === userId ? undefined : userId
  )
  showSalespersonDropdown.value = false
  salespersonSearch.value = ''
}

function getAssignedToName(userId: string): string {
  const person = leadStore.salespeople.find((p) => p.id === userId)
  return person?.full_name || 'Unknown'
}

// ✅ Get initials for avatar
function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Get leads by stage
function getLeadsByStage(stage: SpancoStage) {
  let leads = leadStore.filteredLeads.filter(lead => lead.current_stage === stage)
  
  if (selectedStatus.value) {
    leads = leads.filter(lead => lead.status === selectedStatus.value)
  }
  
  return leads
}

// Filtered leads for table view
const filteredTableLeads = computed(() => {
  let leads = leadStore.filteredLeads
  
  if (selectedStatus.value) {
    leads = leads.filter(lead => lead.status === selectedStatus.value)
  }
  
  return leads
})

// Calculate total value for stage
function formatStageValue(stage: SpancoStage): string {
  const leads = getLeadsByStage(stage)
  const total = leads.reduce((sum, lead) => {
    return sum + (lead.commercial_details?.estimated_value || 0)
  }, 0)
  
  return formatCurrency(total)
}

// Open lead detail
function openLeadDetail(leadId: number) {
  leadStore.selectLead(leadId)
}

// ✅ NEW: Date range helpers
function getDateRangeLabel(range: string): string {
  return DATE_FILTER_LABELS[range as keyof typeof DATE_FILTER_LABELS] || range
}

function getDateRangeIcon(range: string): string {
  return DATE_FILTER_ICONS[range as keyof typeof DATE_FILTER_ICONS] || 'i-heroicons-calendar'
}

function getDateRangeColor(
  range: string, 
  isActive: boolean
): "primary" | "secondary" | "success" | "warning" | "error" | "info" | "neutral" {
  if (isActive) return 'primary'
  
  const colors: Record<string, "error" | "warning" | "info" | "success" | "neutral"> = {
    overdue: 'error',
    thisweek: 'warning',
    nextweek: 'info',
    thismonth: 'success',
    later: 'neutral',
  }
  return colors[range] || 'neutral'
}

// ✅ NEW: Closure date formatting with urgency
function formatClosureDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const daysDiff = Math.ceil(diff / (1000 * 60 * 60 * 24))
  
  if (daysDiff < 0) return `Overdue ${Math.abs(daysDiff)}d`
  if (daysDiff === 0) return 'Today'
  if (daysDiff === 1) return 'Tomorrow'
  if (daysDiff <= 7) return `${daysDiff} days`
  
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function getClosureDateIcon(lead: SpancoLead): string {
  const date = new Date(lead.expected_closure_date || '')
  const now = new Date()
  
  if (date < now) return 'i-heroicons-exclamation-triangle'
  
  const daysDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff <= 3) return 'i-heroicons-bell-alert'
  
  return 'i-heroicons-calendar-days'
}

function getClosureDateColor(lead: SpancoLead): string {
  const date = new Date(lead.expected_closure_date || '')
  const now = new Date()
  
  if (date < now) return 'text-red-600'
  
  const daysDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff <= 3) return 'text-orange-600'
  if (daysDiff <= 7) return 'text-yellow-600'
  
  return 'text-green-600'
}

function getClosureDateTextClass(lead: SpancoLead): string {
  const date = new Date(lead.expected_closure_date || '')
  const now = new Date()
  
  if (date < now) return 'text-red-600 font-semibold'
  
  const daysDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff <= 3) return 'text-orange-600 font-semibold'
  
  return 'text-gray-600'
}

// Formatting helpers
function formatCurrency(value: number): string {
  if (value >= 10000000) {
    return `${(value / 10000000).toFixed(2)}Cr`
  }
  if (value >= 100000) {
    return `${(value / 100000).toFixed(1)}L`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toString()
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })
}

// Label helpers
const getStageLabel = (stage: SpancoStage) => STAGE_LABELS[stage]
const getStatusLabel = (status: LeadStatus) => STATUS_LABELS[status]
const getPriorityLabel = (priority: Priority) => PRIORITY_LABELS[priority]
const getCustomerTypeLabel = (type: string) => CUSTOMER_TYPE_LABELS[type as keyof typeof CUSTOMER_TYPE_LABELS]

// Color mapping
function getStageColorSemantic(stage: SpancoStage): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    gray: 'neutral',
    blue: 'primary',
    cyan: 'info',
    purple: 'secondary',
    orange: 'warning',
    amber: 'warning',
    green: 'success',
    red: 'error',
  }
  return colorMap[STAGE_COLORS[stage]] || 'neutral'
}

function getStatusColorSemantic(status: LeadStatus): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    green: 'success',
    orange: 'warning',
    emerald: 'success',
    red: 'error',
    gray: 'neutral',
  }
  return colorMap[STATUS_COLORS[status]] || 'neutral'
}

function getPriorityColorSemantic(priority: Priority): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    gray: 'neutral',
    blue: 'primary',
    orange: 'warning',
    red: 'error',
    rose: 'error',
  }
  return colorMap[PRIORITY_COLORS[priority]] || 'neutral'
}
</script>

<style scoped>
/* Custom scrollbar for Kanban columns */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
