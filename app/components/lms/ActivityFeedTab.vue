<template>
  <div>
    <!-- Search and Filters -->
    <div class="mb-6 space-y-4">
      <!-- Search Bar - Following Department Pattern -->
      <div class="flex gap-3">
        <div class="flex-1">
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by name, phone, lead number..."
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
        <UButton
          size="lg"
          variant="outline"
          color="neutral"
          class="bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300 font-medium"
          @click="showFilters = !showFilters"
        >
          <UIcon name="i-heroicons-funnel" class="h-5 w-5 mr-2 text-gray-600" />
          Filters
          <UBadge
            v-if="activeFilterCount > 0"
            color="primary"
            variant="solid"
            size="xs"
            class="ml-2"
          >
            {{ activeFilterCount }}
          </UBadge>
        </UButton>
      </div>

      <!-- Filter Chips -->
      <div
        v-if="showFilters"
        class="bg-white/80 backdrop-blur-lg rounded-lg p-4 space-y-3 border border-gray-200 shadow-lg relative z-[60]"
      >
        <!-- ✅ NEW: Date Range Filter -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-2 block">
            Expected Closure Date
          </label>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="(count, range) in leadStore.leadsByDateRange"
              :key="range"
              size="sm"
              :variant="leadStore.dateFilter === range ? 'solid' : 'outline'"
              :color="getDateRangeColor(range, leadStore.dateFilter === range)"
              :class="[
                leadStore.dateFilter !== range
                  ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                  : '',
              ]"
              @click="toggleDateFilter(range)"
            >
              <UIcon :name="getDateRangeIcon(range)" class="h-3.5 w-3.5 mr-1.5" />
              <span class="font-medium">{{ getDateRangeLabel(range) }}</span>
              <span class="ml-1.5 text-xs opacity-75">({{ count }})</span>
            </UButton>
          </div>
        </div>

        <!-- Stage Filter -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-2 block">
            Stage
          </label>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="stage in Object.values(SpancoStage)"
              :key="String(stage)"
              size="sm"
              :variant="leadStore.filters.stage === stage ? 'solid' : 'outline'"
              :color="leadStore.filters.stage === stage ? 'primary' : 'neutral'"
              :class="[
                leadStore.filters.stage !== stage
                  ? 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300'
                  : '',
              ]"
              @click="toggleStageFilter(stage)"
            >
              <span class="font-medium">{{ getStageLabel(stage) }}</span>
              <span class="ml-2 text-xs opacity-75">
                ({{ leadStore.summary.byStage[stage] || 0 }})
              </span>
            </UButton>
          </div>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-2 block">
            Status
          </label>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="status in Object.values(LeadStatus)"
              :key="String(status)"
              size="sm"
              :variant="
                leadStore.filters.status === status ? 'solid' : 'outline'
              "
              :color="
                leadStore.filters.status === status ? 'primary' : 'neutral'
              "
              :class="[
                leadStore.filters.status !== status
                  ? 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300'
                  : '',
              ]"
              @click="toggleStatusFilter(status)"
            >
              <span class="font-medium">{{ getStatusLabel(status) }}</span>
              <span class="ml-2 text-xs opacity-75">
                ({{ leadStore.summary.byStatus[status] || 0 }})
              </span>
            </UButton>
          </div>
        </div>

        <!-- Priority Filter -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-2 block">
            Priority
          </label>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="priority in Object.values(Priority)"
              :key="String(priority)"
              size="sm"
              :variant="
                leadStore.filters.priority === priority ? 'solid' : 'outline'
              "
              :color="
                leadStore.filters.priority === priority ? 'primary' : 'neutral'
              "
              :class="[
                leadStore.filters.priority !== priority
                  ? 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300'
                  : '',
              ]"
              @click="togglePriorityFilter(priority)"
            >
              <span class="font-medium">{{ getPriorityLabel(priority) }}</span>
              <span class="ml-2 text-xs opacity-75">
                ({{ leadStore.summary.byPriority[priority] || 0 }})
              </span>
            </UButton>
          </div>
        </div>

        <!-- ✅ Assigned To (Salesperson) Filter — Searchable Dropdown -->
        <div v-if="leadStore.salespeople.length > 0">
          <label class="text-sm font-medium text-gray-700 mb-2 block">
            Assigned To
          </label>
          <div class="relative" ref="salespersonDropdownRef">
            <UButton
              size="sm"
              :variant="leadStore.filters.assignedTo ? 'solid' : 'outline'"
              :color="leadStore.filters.assignedTo ? 'primary' : 'neutral'"
              :class="[
                !leadStore.filters.assignedTo
                  ? 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300'
                  : '',
              ]"
              @click="showSalespersonDropdown = !showSalespersonDropdown"
            >
              <UIcon name="i-heroicons-user" class="h-4 w-4 mr-1.5" />
              <span class="font-medium">
                {{ leadStore.filters.assignedTo ? getAssignedToName(leadStore.filters.assignedTo) : 'All Sales Managers' }}
              </span>
              <UIcon
                :name="showSalespersonDropdown ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                class="h-3.5 w-3.5 ml-1.5"
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
                class="absolute left-0 mt-2 w-72 bg-white/95 backdrop-blur-lg border border-gray-200 rounded-xl shadow-xl z-[999]"
                @click.stop
              >
                <!-- Search -->
                <div class="p-2 border-b border-gray-100">
                  <input
                    v-model="salespersonSearch"
                    type="text"
                    placeholder="Search sales manager..."
                    class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                  >
                </div>
                <!-- List -->
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
        </div>

        <!-- Clear Filters -->
        <div class="flex justify-end pt-2">
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            class="hover:bg-gray-100 text-gray-700 hover:text-gray-900 font-medium"
            @click="clearAllFilters"
          >
            Clear All Filters
          </UButton>
        </div>
      </div>

      <!-- Active Filter Display -->
      <div
        v-if="activeFilterCount > 0"
        class="flex flex-wrap items-center gap-2"
      >
        <span class="text-sm text-gray-600">Active filters:</span>
        <!-- ✅ NEW: Date Filter Badge -->
        <UBadge
          v-if="leadStore.dateFilter !== 'all'"
          color="primary"
          variant="soft"
          size="sm"
          class="bg-blue-50"
        >
          Date: {{ getDateRangeLabel(leadStore.dateFilter) }}
          <button
            class="ml-1 hover:text-blue-800"
            @click="leadStore.setDateFilter('all')"
          >
            ×
          </button>
        </UBadge>
        <UBadge
          v-if="leadStore.filters.stage"
          color="primary"
          variant="soft"
          size="sm"
          class="bg-blue-50"
        >
          Stage: {{ getStageLabel(leadStore.filters.stage) }}
          <button
            class="ml-1 hover:text-blue-800"
            @click="leadStore.setStageFilter(undefined)"
          >
            ×
          </button>
        </UBadge>
        <UBadge
          v-if="leadStore.filters.status"
          color="primary"
          variant="soft"
          size="sm"
          class="bg-blue-50"
        >
          Status: {{ getStatusLabel(leadStore.filters.status) }}
          <button
            class="ml-1 hover:text-blue-800"
            @click="leadStore.setStatusFilter(undefined)"
          >
            ×
          </button>
        </UBadge>
        <UBadge
          v-if="leadStore.filters.priority"
          color="primary"
          variant="soft"
          size="sm"
          class="bg-blue-50"
        >
          Priority: {{ getPriorityLabel(leadStore.filters.priority) }}
          <button
            class="ml-1 hover:text-blue-800"
            @click="leadStore.setPriorityFilter(undefined)"
          >
            ×
          </button>
        </UBadge>
        <UBadge
          v-if="leadStore.filters.assignedTo"
          color="primary"
          variant="soft"
          size="sm"
          class="bg-blue-50"
        >
          Assigned: {{ getAssignedToName(leadStore.filters.assignedTo) }}
          <button
            class="ml-1 hover:text-blue-800"
            @click="leadStore.setAssignedToFilter(undefined)"
          >
            ×
          </button>
        </UBadge>
      </div>
    </div>

    <!-- Results Info -->
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm text-gray-600">
        Showing {{ leadStore.paginatedLeads.length }} of
        {{ leadStore.filteredLeads.length }} leads
      </p>
    </div>

    <!-- Lead Cards -->
    <div
      v-if="leadStore.filteredLeads.length === 0"
      class="text-center py-12 bg-white/80 backdrop-blur-lg rounded-lg border border-gray-200"
    >
      <UIcon
        name="i-heroicons-inbox"
        class="h-16 w-16 text-gray-300 mx-auto mb-4"
      />
      <h4 class="text-lg font-semibold text-gray-700 mb-2">No Leads Found</h4>
      <p class="text-gray-600 mb-4">
        Try adjusting your filters or search query
      </p>
      <UButton
        variant="outline"
        class="bg-white hover:bg-gray-50"
        @click="clearAllFilters"
      >
        Clear Filters
      </UButton>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="lead in leadStore.paginatedLeads"
        :key="lead.id"
        class="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-gray-50"
        @click="openLeadDetail(lead.id)"
      >
        <div class="flex items-start gap-4">
          <!-- Lead Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h4 class="text-sm font-semibold text-gray-900">
                    {{ lead.customer_info.name }}
                  </h4>
                  <UBadge
                    :color="getStageColorSemantic(lead.current_stage)"
                    variant="soft"
                    size="xs"
                  >
                    {{ getStageLabel(lead.current_stage) }}
                  </UBadge>
                </div>
                <p class="text-xs text-gray-500">{{ lead.lead_number }}</p>
              </div>
              <UBadge
                :color="getStatusColorSemantic(lead.status)"
                variant="soft"
                size="sm"
              >
                {{ getStatusLabel(lead.status) }}
              </UBadge>
            </div>

            <!-- Lead Metadata -->
            <div
              class="flex flex-wrap items-center gap-3 text-xs text-gray-600"
            >
              <div class="flex items-center">
                <UIcon
                  name="i-heroicons-building-office-2"
                  class="h-4 w-4 mr-1"
                />
                {{ getCustomerTypeLabel(lead.customer_info.type) }}
              </div>
              <div class="flex items-center">
                <UIcon name="i-heroicons-map-pin" class="h-4 w-4 mr-1" />
                {{ lead.service_location.city }}
              </div>
              <UBadge
                :color="getPriorityColorSemantic(lead.priority)"
                variant="soft"
                size="xs"
              >
                {{ getPriorityLabel(lead.priority) }}
              </UBadge>
              <div
                v-if="lead.commercial_details?.estimated_value"
                class="flex items-center font-medium text-green-600"
              >
                <UIcon name="i-heroicons-currency-rupee" class="h-4 w-4 mr-1" />
                ₹{{ formatCurrency(lead.commercial_details.estimated_value) }}
              </div>
              <!-- ✅ NEW: Expected Closure Date with Urgency Indicator -->
              <div
                v-if="lead.expected_closure_date"
                class="flex items-center"
                :class="getClosureDateTextClass(lead)"
              >
                <UIcon
                  :name="getClosureDateIcon(lead)"
                  :class="['h-4 w-4 mr-1', getClosureDateColor(lead)]"
                />
                <span class="font-medium">
                  {{ formatClosureDate(lead.expected_closure_date) }}
                </span>
              </div>
              <div class="flex items-center text-gray-500">
                <UIcon name="i-heroicons-clock" class="h-4 w-4 mr-1" />
                {{ formatDate(lead.created_at) }}
              </div>
            </div>
          </div>

          <!-- Arrow -->
          <UIcon
            name="i-heroicons-chevron-right"
            class="h-5 w-5 text-gray-400 flex-shrink-0"
          />
        </div>
      </div>
    </div>

    <!-- ✅ NEW: Load More Button -->
    <div
      v-if="leadStore.hasMore && !leadStore.isLoading"
      class="flex justify-center mt-6"
    >
      <UButton
        size="lg"
        variant="outline"
        color="primary"
        class="bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300 font-medium"
        :loading="leadStore.isLoadingMore"
        @click="loadMore"
      >
        <UIcon name="i-heroicons-arrow-down-circle" class="h-5 w-5 mr-2" />
        Load More Leads
      </UButton>
    </div>

    <!-- Loading More Indicator -->
    <div v-if="leadStore.isLoadingMore" class="flex justify-center py-6">
      <div class="flex items-center gap-3 text-gray-600">
        <UIcon name="i-heroicons-arrow-path" class="h-5 w-5 animate-spin" />
        <span class="text-sm">Loading more leads...</span>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="leadStore.totalPages > 1"
      class="flex items-center justify-center gap-2 mt-6"
    >
      <UButton
        size="sm"
        variant="outline"
        color="neutral"
        class="bg-white hover:bg-gray-50"
        :disabled="leadStore.pagination.currentPage === 1"
        @click="leadStore.previousPage()"
      >
        <UIcon name="i-heroicons-chevron-left" class="h-4 w-4" />
        Previous
      </UButton>
      <span class="text-sm text-gray-600 px-4">
        Page {{ leadStore.pagination.currentPage }} of
        {{ leadStore.totalPages }}
      </span>
      <UButton
        size="sm"
        variant="outline"
        color="neutral"
        class="bg-white hover:bg-gray-50"
        :disabled="leadStore.pagination.currentPage === leadStore.totalPages"
        @click="leadStore.nextPage()"
      >
        Next
        <UIcon name="i-heroicons-chevron-right" class="h-4 w-4" />
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
// ✅ No imports! Everything auto-imported from /utils/lead.ts

const leadStore = useLeadStore();

// Local state
const showFilters = ref(false);
const searchQuery = ref("");

// Watch search query
watch(searchQuery, (newValue) => {
  leadStore.setSearchQuery(newValue);
});

// Active filter count (including date filter)
const activeFilterCount = computed(() => {
  let count = 0;
  if (leadStore.dateFilter !== 'all') count++;
  if (leadStore.filters.stage) count++;
  if (leadStore.filters.status) count++;
  if (leadStore.filters.priority) count++;
  if (leadStore.filters.assignedTo) count++;
  return count;
});

// Filter toggle functions
function toggleStageFilter(stage: SpancoStage) {
  leadStore.setStageFilter(
    leadStore.filters.stage === stage ? undefined : stage
  );
}

function toggleStatusFilter(status: LeadStatus) {
  leadStore.setStatusFilter(
    leadStore.filters.status === status ? undefined : status
  );
}

function togglePriorityFilter(priority: Priority) {
  leadStore.setPriorityFilter(
    leadStore.filters.priority === priority ? undefined : priority
  );
}

// ✅ NEW: Date filter toggle
function toggleDateFilter(range: string) {
  leadStore.setDateFilter(
    leadStore.dateFilter === range ? 'all' : (range as DateFilterType)
  );
}

function clearAllFilters() {
  leadStore.clearFilters();
  searchQuery.value = "";
  showFilters.value = false;
}

// ✅ NEW: Assigned-to filter — searchable dropdown state
const showSalespersonDropdown = ref(false);
const salespersonDropdownRef = ref(null);

onClickOutside(salespersonDropdownRef, () => {
  showSalespersonDropdown.value = false;
});
const salespersonSearch = ref("");

const filteredSalespeople = computed(() => {
  const query = salespersonSearch.value.toLowerCase();
  if (!query) return leadStore.salespeople;
  return leadStore.salespeople.filter((p) =>
    (p.full_name || '').toLowerCase().includes(query)
  );
});

function selectSalesperson(userId: string) {
  leadStore.setAssignedToFilter(
    leadStore.filters.assignedTo === userId ? undefined : userId
  );
  showSalespersonDropdown.value = false;
  salespersonSearch.value = "";
}

// ✅ NEW: Get salesperson name for active filter badge
function getAssignedToName(userId: string): string {
  const person = leadStore.salespeople.find((p) => p.id === userId);
  return person?.full_name || 'Unknown';
}

// ✅ NEW: Get initials for avatar
function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function openLeadDetail(leadId: number) {
  leadStore.selectLead(leadId);
}

// ✅ NEW: Load more function
async function loadMore() {
  await leadStore.loadMoreLeads();
}

// ✅ NEW: Date range helpers
function getDateRangeLabel(range: string): string {
  return DATE_FILTER_LABELS[range as keyof typeof DATE_FILTER_LABELS] || range;
}

function getDateRangeIcon(range: string): string {
  return DATE_FILTER_ICONS[range as keyof typeof DATE_FILTER_ICONS] || 'i-heroicons-calendar';
}

// ✅ FIXED: Date range color with proper return type
function getDateRangeColor(
  range: string, 
  isActive: boolean
): "primary" | "secondary" | "success" | "warning" | "error" | "info" | "neutral" {
  if (isActive) return 'primary';
  
  const colors: Record<string, "error" | "warning" | "info" | "success" | "neutral"> = {
    overdue: 'error',
    thisweek: 'warning',
    nextweek: 'info',
    thismonth: 'success',
    later: 'neutral',
  };
  return colors[range] || 'neutral';
}


// ✅ NEW: Closure date formatting with urgency
function formatClosureDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const daysDiff = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) return `Overdue ${Math.abs(daysDiff)}d`;
  if (daysDiff === 0) return 'Today';
  if (daysDiff === 1) return 'Tomorrow';
  if (daysDiff <= 7) return `${daysDiff} days`;
  
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getClosureDateIcon(lead: SpancoLead): string {
  const date = new Date(lead.expected_closure_date || '');
  const now = new Date();
  
  if (date < now) return 'i-heroicons-exclamation-triangle';
  
  const daysDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 3) return 'i-heroicons-bell-alert';
  
  return 'i-heroicons-calendar-days';
}

function getClosureDateColor(lead: SpancoLead): string {
  const date = new Date(lead.expected_closure_date || '');
  const now = new Date();
  
  if (date < now) return 'text-red-600';
  
  const daysDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 3) return 'text-orange-600';
  if (daysDiff <= 7) return 'text-yellow-600';
  
  return 'text-green-600';
}

function getClosureDateTextClass(lead: SpancoLead): string {
  const date = new Date(lead.expected_closure_date || '');
  const now = new Date();
  
  if (date < now) return 'text-red-600 font-semibold';
  
  const daysDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 3) return 'text-orange-600 font-semibold';
  
  return 'text-gray-600';
}

// Formatting helpers
function formatCurrency(value: number): string {
  if (value >= 100000) {
    return `${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Label helpers
const getStageLabel = (stage: SpancoStage) => STAGE_LABELS[stage];
const getStatusLabel = (status: LeadStatus) => STATUS_LABELS[status];
const getPriorityLabel = (priority: Priority) => PRIORITY_LABELS[priority];
const getCustomerTypeLabel = (type: string) =>
  CUSTOMER_TYPE_LABELS[type as keyof typeof CUSTOMER_TYPE_LABELS];

// Color mapping to Nuxt UI v4 semantic colors
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
    amber: "warning",
    green: "success",
    red: "error",
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
</script>
