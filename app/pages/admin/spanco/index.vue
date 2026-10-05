<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200/70">
      <div>
        <h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>SPANCO Pipeline & Lead Administration</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
            {{ leads.length }} Leads
          </span>
        </h1>
        <p class="text-xs text-gray-500 mt-0.5">
          Global lead governance, stage overrides, sales representative reassignment, and pipeline analytics.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Refresh Button -->
        <button
          type="button"
          class="p-2.5 rounded-xl bg-white/80 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm transition-colors"
          title="Refresh Leads"
          :disabled="isLoading"
          @click="fetchLeads"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            :class="['w-4 h-4', isLoading ? 'animate-spin text-amber-600' : '']"
          />
        </button>

        <!-- Bulk Transfer Pipeline Button -->
        <button
          type="button"
          class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs shadow-sm transition-all active:scale-95"
          title="Bulk transfer leads from inactive or departing sales representatives to active sales staff"
          @click="openBulkTransferModal()"
        >
          <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-4 h-4 text-blue-600" />
          <span>Bulk Transfer</span>
          <span
            v-if="inactiveLeadsCount > 0"
            class="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold leading-none shadow-sm"
            :title="`${inactiveLeadsCount} lead(s) currently held by inactive representatives`"
          >
            {{ inactiveLeadsCount }}
          </span>
        </button>

        <!-- Export CSV Button -->
        <button
          type="button"
          class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs shadow-sm transition-all active:scale-95"
          @click="exportToCSV"
        >
          <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 text-gray-500" />
          <span>Export CSV</span>
        </button>

        <!-- New Lead Button -->
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 !text-white font-bold text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all"
          @click="openCreateModal"
        >
          <UIcon name="i-heroicons-plus-circle" class="w-4 h-4 text-white" />
          <span class="text-white">New SPANCO Lead</span>
        </button>
      </div>
    </div>

    <!-- Inactive Sales Reps Warning / Handover Banner -->
    <div
      v-if="inactiveSalesPersonsWithLeads.length > 0"
      class="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
    >
      <div class="flex items-start sm:items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 class="font-bold text-amber-900">
            Inactive Representative Pipeline Handover Needed
          </h4>
          <p class="text-amber-700 text-[11px] mt-0.5">
            {{ inactiveSalesPersonsWithLeads.length }} representative(s) who left the company or are inactive still have
            <span class="font-bold font-mono">{{ inactiveLeadsCount }} leads</span> assigned in SPANCO.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 !text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          @click="openBulkTransferModal(inactiveSalesPersonsWithLeads[0]?.id)"
        >
          <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-4 h-4 text-white" />
          <span class="!text-white font-bold">Bulk Assign to Active Rep</span>
        </button>
      </div>
    </div>

    <!-- KPI Metric Analytics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Leads -->
      <div class="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 p-5 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pipeline</span>
            <span class="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
              {{ activeCount }} Active
            </span>
          </div>
          <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner shrink-0">
            <UIcon name="i-heroicons-chart-pie" class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-4">
          <span class="text-2xl sm:text-3xl font-black text-gray-900 font-mono block">{{ leads.length }}</span>
        </div>
        <div class="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
          <span>Unassigned:</span>
          <span class="font-bold text-gray-800">{{ unassignedCount }}</span>
        </div>
      </div>

      <!-- Pipeline Commercial Value -->
      <div class="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 p-5 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Value</span>
            <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
              Estimated
            </span>
          </div>
          <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner shrink-0">
            <UIcon name="i-heroicons-currency-rupee" class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-4">
          <span class="text-xl sm:text-2xl font-black text-gray-900 font-mono block truncate" :title="formatCurrency(totalPipelineValue)">
            {{ formatCurrency(totalPipelineValue) }}
          </span>
        </div>
        <div class="mt-2 text-[11px] text-gray-500 flex items-center gap-1 truncate">
          <span>Won Value:</span>
          <span class="font-bold text-emerald-600 truncate">{{ formatCurrency(wonPipelineValue) }}</span>
        </div>
      </div>

      <!-- Won Conversion -->
      <div class="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 p-5 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Deals Won</span>
            <span class="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
              {{ conversionRate }}% Win
            </span>
          </div>
          <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
            <UIcon name="i-heroicons-trophy" class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-4">
          <span class="text-2xl sm:text-3xl font-black text-emerald-600 font-mono block">{{ wonCount }}</span>
        </div>
        <div class="mt-2 text-[11px] text-gray-500 flex items-center gap-1 truncate">
          <span>Lost:</span>
          <span class="font-bold text-rose-600">{{ lostCount }}</span>
          <span class="mx-1">•</span>
          <span>Hold:</span>
          <span class="font-bold text-amber-600">{{ onHoldCount }}</span>
        </div>
      </div>

      <!-- Overdue Closures -->
      <div class="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 p-5 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Overdue</span>
            <span class="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
              Action
            </span>
          </div>
          <div class="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner shrink-0">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-4">
          <span class="text-2xl sm:text-3xl font-black text-rose-600 font-mono block">{{ overdueCount }}</span>
        </div>
        <div class="mt-2 text-[11px] text-gray-500 truncate">
          <span>Requires follow-up</span>
        </div>
      </div>
    </div>

    <!-- SPANCO Stage Distribution Bar -->
    <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-md space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <UIcon name="i-heroicons-funnel" class="w-4 h-4 text-amber-600" />
          <span>Stage Funnel Distribution</span>
        </span>
        <button
          v-if="selectedStage !== 'ALL'"
          type="button"
          class="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
          @click="selectedStage = 'ALL'"
        >
          <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
          <span>Reset Stage Filter</span>
        </button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        <button
          v-for="stg in SPANCO_STAGES"
          :key="stg.value"
          type="button"
          :class="[
            'p-3 rounded-xl border text-left transition-all',
            selectedStage === stg.value
              ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/70 shadow-sm'
              : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100/70'
          ]"
          @click="selectedStage = selectedStage === stg.value ? 'ALL' : stg.value"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-bold uppercase tracking-wider" :class="stg.textColor">
              {{ stg.label }}
            </span>
            <span class="w-2 h-2 rounded-full" :class="stg.dotColor" />
          </div>
          <div class="text-lg font-black text-gray-900 font-mono">
            {{ stageCountMap[stg.value] || 0 }}
          </div>
        </button>
      </div>
    </div>

    <!-- Search & Filters Toolbar -->
    <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-md flex flex-col lg:flex-row gap-3 items-center justify-between">
      <!-- Search Input -->
      <div class="relative w-full lg:w-96">
        <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by Lead #, Customer, Contact, Phone, City, Rep..."
          class="w-full pl-9 pr-9 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 rounded-full hover:bg-gray-200/60 transition-colors"
          title="Clear search"
          @click="searchQuery = ''"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Filter Controls -->
      <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
        <!-- Stage Dropdown -->
        <select
          v-model="selectedStage"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
        >
          <option value="ALL">All Stages</option>
          <option v-for="stg in SPANCO_STAGES" :key="stg.value" :value="stg.value">
            {{ stg.label }}
          </option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>

        <!-- Status Dropdown -->
        <select
          v-model="selectedStatus"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
        >
          <option value="ALL">All Status</option>
          <option value="active">Active</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="on_hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <!-- Priority Dropdown -->
        <select
          v-model="selectedPriority"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
        >
          <option value="ALL">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
          <option value="critical">Critical</option>
        </select>

        <!-- Assignee Dropdown -->
        <select
          v-model="selectedAssignee"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-amber-500 max-w-[200px] [color-scheme:light]"
        >
          <option value="ALL">All Assignees</option>
          <option value="UNASSIGNED">Unassigned Only</option>
          <option v-for="emp in spancoEmployees" :key="emp.id" :value="emp.id">
            {{ emp.full_name }}{{ !emp.is_active ? ' [Inactive]' : '' }} ({{ emp.lead_count }})
          </option>
        </select>

        <!-- Quick Transfer Button for selected inactive rep -->
        <button
          v-if="selectedRepIsInactive"
          type="button"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs border border-amber-300 shadow-sm transition-all"
          title="Transfer all leads from this inactive representative to an active representative"
          @click="openBulkTransferModal(selectedAssignee)"
        >
          <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-3.5 h-3.5 text-amber-700" />
          <span>Transfer This Rep's Leads</span>
        </button>

        <!-- Sort Order -->
        <select
          v-model="sortBy"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="value_high">Value: High to Low</option>
          <option value="value_low">Value: Low to High</option>
          <option value="closure">Closure Date</option>
        </select>
      </div>
    </div>

    <!-- Leads Table Container -->
    <div class="rounded-2xl border border-gray-200/70 bg-white/90 backdrop-blur-lg overflow-hidden shadow-xl">
      <!-- Loading State -->
      <div v-if="isLoading" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-3 animate-spin text-amber-600" />
        <p class="text-xs">Loading SPANCO pipeline records...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredLeads.length === 0" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-inbox" class="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <h3 class="text-sm font-semibold text-gray-800">No leads match your criteria</h3>
        <p class="text-xs text-gray-500 mt-1">Try resetting filters or search query.</p>
        <button
          v-if="searchQuery || selectedStage !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL' || selectedAssignee !== 'ALL'"
          type="button"
          class="mt-4 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
          @click="resetAllFilters"
        >
          <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 text-amber-700" />
          <span>Reset All Filters & Search</span>
        </button>
      </div>

      <!-- Table View -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50/80 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
              <th class="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  class="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  :checked="isAllSelected"
                  title="Select all on this page"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="py-3 px-4">Lead # & Priority</th>
              <th class="py-3 px-4">Customer / Company</th>
              <th class="py-3 px-4">SPANCO Stage</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Est. Value</th>
              <th class="py-3 px-4">Assigned Sales Rep</th>
              <th class="py-3 px-4">Expected Closure</th>
              <th class="py-3 px-4 text-right">Admin Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="lead in paginatedLeads"
              :key="lead.id"
              class="hover:bg-amber-50/30 transition-colors group"
              :class="selectedLeadIds.includes(lead.id) ? 'bg-amber-50/50' : ''"
            >
              <!-- Multi-select Checkbox -->
              <td class="py-3.5 px-3 text-center" @click.stop>
                <input
                  v-model="selectedLeadIds"
                  type="checkbox"
                  :value="lead.id"
                  class="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </td>

              <!-- Lead # & Priority -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-gray-900">{{ lead.lead_number }}</span>
                  <span
                    class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider"
                    :class="getPriorityClass(lead.priority)"
                  >
                    {{ lead.priority }}
                  </span>
                </div>
                <div class="text-[10px] text-gray-400 mt-0.5">
                  Created {{ formatDate(lead.created_at) }}
                </div>
              </td>

              <!-- Customer Info -->
              <td class="py-3.5 px-4">
                <div class="font-bold text-gray-900 flex items-center gap-1.5">
                  <span>{{ lead.customer_info?.name || "N/A" }}</span>
                  <span
                    v-if="lead.customer_info?.type"
                    class="px-1.5 py-0.5 text-[9px] rounded bg-gray-100 text-gray-600 uppercase font-semibold"
                  >
                    {{ lead.customer_info.type }}
                  </span>
                </div>
                <div class="text-[11px] text-gray-600 flex items-center gap-2 mt-0.5">
                  <span v-if="lead.customer_info?.company_name" class="font-medium text-gray-700">
                    {{ lead.customer_info.company_name }}
                  </span>
                  <span v-if="lead.service_location?.city" class="text-gray-400">
                    • {{ lead.service_location.city }}
                  </span>
                </div>
                <div class="text-[10px] text-gray-500 font-mono mt-0.5">
                  {{ lead.customer_info?.phone || "No phone" }}
                </div>
              </td>

              <!-- Current Stage Badge -->
              <td class="py-3.5 px-4">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize shadow-sm"
                  :class="getStageBadgeClass(lead.current_stage)"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{{ STAGE_LABELS[lead.current_stage] || lead.current_stage }}</span>
                </span>
              </td>

              <!-- Status Badge -->
              <td class="py-3.5 px-4">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                  :class="getStatusBadgeClass(lead.status)"
                >
                  {{ (STATUS_LABELS as Record<string, string>)[lead.status] || lead.status }}
                </span>
              </td>

              <!-- Estimated Value -->
              <td class="py-3.5 px-4 font-mono font-bold text-gray-900">
                {{ formatCurrency(lead.commercial_details?.estimated_value || 0) }}
                <div v-if="lead.commercial_details?.proposed_monthly_rental" class="text-[10px] text-gray-400 font-normal">
                  {{ formatCurrency(lead.commercial_details.proposed_monthly_rental) }}/mo
                </div>
              </td>

              <!-- Assigned Sales Rep -->
              <td class="py-3.5 px-4">
                <div v-if="getAssignee(lead)" class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px] shadow-sm">
                    {{ (getAssignee(lead)?.full_name || "?").charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      <span>{{ getAssignee(lead)?.full_name }}</span>
                      <span
                        v-if="getAssignee(lead)?.is_active === false"
                        class="text-[9px] px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded font-semibold cursor-pointer hover:bg-rose-100 transition-colors"
                        title="Representative profile is inactive! Click to transfer all their leads."
                        @click.stop="openBulkTransferModal(lead.assigned_to || undefined)"
                      >
                        Inactive ↺
                      </span>
                    </div>
                    <div class="text-[10px] text-gray-400 font-mono">
                      {{ getAssignee(lead)?.employee_code || "Staff" }}
                    </div>
                  </div>
                </div>
                <div v-else class="inline-flex items-center gap-1 text-[11px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <UIcon name="i-heroicons-user-minus" class="w-3.5 h-3.5" />
                  <span>Unassigned</span>
                </div>
              </td>

              <!-- Expected Closure Date -->
              <td class="py-3.5 px-4">
                <div
                  v-if="lead.expected_closure_date"
                  class="text-xs font-mono"
                  :class="isOverdue(lead.expected_closure_date, lead.status) ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-gray-700'"
                >
                  <UIcon
                    v-if="isOverdue(lead.expected_closure_date, lead.status)"
                    name="i-heroicons-exclamation-circle"
                    class="w-3.5 h-3.5 shrink-0"
                  />
                  <span>{{ formatDate(lead.expected_closure_date) }}</span>
                </div>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>

              <!-- Actions Column -->
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <!-- View Details Button -->
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                    title="View Full Lead Details"
                    @click="openDetailModal(lead)"
                  >
                    <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
                  </button>

                  <!-- Stage Override Button -->
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors border border-amber-200"
                    title="Override Stage / Status"
                    @click="openStageModal(lead)"
                  >
                    <UIcon name="i-heroicons-arrows-up-down" class="w-3.5 h-3.5" />
                  </button>

                  <!-- Reassign Rep Button -->
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-200"
                    title="Reassign Sales Rep"
                    @click="openReassignModal(lead)"
                  >
                    <UIcon name="i-heroicons-user-group" class="w-3.5 h-3.5" />
                  </button>

                  <!-- Edit Lead Button -->
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors border border-emerald-200"
                    title="Edit Lead Info"
                    @click="openEditModal(lead)"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-3.5 h-3.5" />
                  </button>

                  <!-- Delete Lead Button -->
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200"
                    title="Delete Lead"
                    @click="confirmDeleteLead(lead)"
                  >
                    <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="p-4 border-t border-gray-200/80 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <div>
          Showing <span class="font-bold text-gray-900">{{ paginationStart }}</span> to
          <span class="font-bold text-gray-900">{{ paginationEnd }}</span> of
          <span class="font-bold text-gray-900">{{ filteredLeads.length }}</span> leads
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold disabled:opacity-40"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            Previous
          </button>
          <span class="font-mono text-gray-600">Page {{ currentPage }} of {{ totalPages || 1 }}</span>
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold disabled:opacity-40"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- MODAL 1: CREATE NEW SPANCO LEAD                          -->
    <!-- ========================================================= -->
    <div
      v-if="isCreateModalOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-500 to-yellow-600 text-white shrink-0">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-plus-circle" class="w-5 h-5 text-white" />
            <h2 class="text-base font-bold text-white">Create New SPANCO Lead</h2>
          </div>
          <button type="button" class="text-white/80 hover:text-white" @click="isCreateModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form class="p-6 space-y-6 flex-1 overflow-y-auto text-xs" @submit.prevent="handleCreateLead">
          <!-- Customer Information -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">
              1. Customer & Organization
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Customer / Contact Name *</label>
                <input
                  v-model="createForm.customer_name"
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Company / Business Name</label>
                <input
                  v-model="createForm.company_name"
                  type="text"
                  placeholder="e.g. Apex Technologies Ltd."
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Customer Type</label>
                <select
                  v-model="createForm.customer_type"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                <input
                  v-model="createForm.phone"
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  v-model="createForm.email"
                  type="email"
                  placeholder="e.g. contact@apex.com"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">GSTIN (Optional)</label>
                <input
                  v-model="createForm.gstin"
                  type="text"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                />
              </div>
            </div>
          </div>

          <!-- Service Location -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">
              2. Service Location
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-gray-700 mb-1">Installation Address *</label>
                <input
                  v-model="createForm.address"
                  type="text"
                  required
                  placeholder="Street / Office Address"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">City *</label>
                <input
                  v-model="createForm.city"
                  type="text"
                  required
                  placeholder="e.g. Mumbai"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">State / Province</label>
                <input
                  v-model="createForm.state"
                  type="text"
                  placeholder="e.g. Maharashtra"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                <input
                  v-model="createForm.pincode"
                  type="text"
                  placeholder="e.g. 400001"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Landmark</label>
                <input
                  v-model="createForm.landmark"
                  type="text"
                  placeholder="Nearby Landmark"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                />
              </div>
            </div>
          </div>

          <!-- SPANCO Stage, Priority & Assignment -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">
              3. SPANCO Stage, Priority & Assignment
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Initial Stage *</label>
                <select
                  v-model="createForm.stage"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                >
                  <option v-for="stg in SPANCO_STAGES" :key="stg.value" :value="stg.value">
                    {{ stg.label }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                <select
                  v-model="createForm.priority"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Assign to Sales Rep</label>
                <select
                  v-model="createForm.assigned_to"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                >
                  <option value="">Unassigned</option>
                  <option v-for="emp in spancoEmployees" :key="emp.id" :value="emp.id">
                    {{ emp.full_name }} ({{ emp.employee_code || "Staff" }}){{ !emp.is_active ? ' [Inactive]' : '' }} ({{ emp.lead_count }} leads)
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Commercials & Timeline -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">
              4. Commercials & Expected Closure
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Estimated Deal Value (₹)</label>
                <input
                  v-model.number="createForm.estimated_value"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-mono font-medium focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Monthly Rental (₹)</label>
                <input
                  v-model.number="createForm.monthly_rental"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-mono font-medium focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Expected Closure Date</label>
                <input
                  v-model="createForm.expected_closure_date"
                  type="date"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
                />
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">Initial Notes / Remarks</label>
            <textarea
              v-model="createForm.remarks"
              rows="2"
              placeholder="Admin or sales comments..."
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
            />
          </div>

          <!-- Submit Buttons -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t shrink-0">
            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700"
              @click="isCreateModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 !text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/25 disabled:opacity-50"
            >
              <UIcon v-if="isSubmitting" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-white" />
              <span class="!text-white font-bold">Create SPANCO Lead</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- MODAL 2: STAGE & STATUS OVERRIDE                          -->
    <!-- ========================================================= -->
    <div
      v-if="isStageModalOpen && activeLead"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-amber-600 text-white shrink-0">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-arrows-up-down" class="w-5 h-5 text-white" />
            <h2 class="text-base font-bold text-white">Override Stage & Status</h2>
          </div>
          <button type="button" class="text-white/80 hover:text-white" @click="isStageModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form class="p-6 space-y-4 flex-1 overflow-y-auto text-xs" @submit.prevent="handleStageOverride">
          <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <div class="font-bold text-gray-900">{{ activeLead.lead_number }} — {{ activeLead.customer_info?.name }}</div>
            <div class="text-[11px] text-amber-700 mt-0.5">
              Current Stage: <span class="font-bold uppercase">{{ activeLead.current_stage }}</span> | Status: <span class="font-bold uppercase">{{ activeLead.status }}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">Target SPANCO Stage *</label>
            <select
              v-model="stageForm.stage"
              required
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
            >
              <option v-for="stg in SPANCO_STAGES" :key="stg.value" :value="stg.value">
                {{ stg.label }}
              </option>
              <option value="won">Won (Deal Closed)</option>
              <option value="lost">Lost (Deal Failed)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">Lead Status *</label>
            <select
              v-model="stageForm.status"
              required
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
            >
              <option value="active">Active</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">Override Reason / Audit Remarks</label>
            <textarea
              v-model="stageForm.remarks"
              rows="3"
              placeholder="Provide reason for administrative stage override..."
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-amber-500 [color-scheme:light]"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t shrink-0">
            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700"
              @click="isStageModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 !text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/25 disabled:opacity-50"
            >
              <UIcon v-if="isSubmitting" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-white" />
              <span class="!text-white font-bold">Apply Stage Override</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- MODAL 3: REASSIGN SALES REPRESENTATIVE                    -->
    <!-- ========================================================= -->
    <div
      v-if="isReassignModalOpen && activeLead"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-blue-600 text-white shrink-0">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-white" />
            <h2 class="text-base font-bold text-white">Reassign Sales Representative</h2>
          </div>
          <button type="button" class="text-white/80 hover:text-white" @click="isReassignModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form class="p-6 space-y-4 flex-1 overflow-y-auto text-xs" @submit.prevent="handleReassign">
          <div class="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
            <div class="font-bold text-gray-900">{{ activeLead.lead_number }}</div>
            <div>Customer: {{ activeLead.customer_info?.name }}</div>
            <div class="text-[11px] text-blue-700 mt-1 flex items-center gap-1.5">
              <span>Currently Assigned:</span>
              <span class="font-bold text-gray-900">
                {{ getAssignee(activeLead)?.full_name || "Unassigned" }}
              </span>
              <span
                v-if="getAssignee(activeLead)?.is_active === false"
                class="text-[9px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded font-medium"
              >
                Inactive Profile
              </span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">Select New Assignee *</label>
            <select
              v-model="reassignForm.assigned_to"
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 [color-scheme:light]"
            >
              <option value="">None (Unassign)</option>
              <option v-for="emp in spancoEmployees" :key="emp.id" :value="emp.id">
                {{ emp.full_name }} ({{ emp.employee_code || "Staff" }}){{ !emp.is_active ? ' [Inactive]' : '' }} ({{ emp.lead_count }} leads)
              </option>
            </select>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t shrink-0">
            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700"
              @click="isReassignModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 !text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/25 disabled:opacity-50"
            >
              <UIcon v-if="isSubmitting" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-white" />
              <span class="!text-white font-bold">Update Assignee</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- MODAL 4: EDIT LEAD INFO (ALL FIELDS)                      -->
    <!-- ========================================================= -->
    <div
      v-if="isEditModalOpen && activeLead"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-emerald-600 text-white shrink-0">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-pencil-square" class="w-5 h-5 text-white" />
            <h2 class="text-base font-bold text-white">Edit Full Lead: {{ activeLead.lead_number }}</h2>
          </div>
          <button type="button" class="text-white/80 hover:text-white" @click="isEditModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form class="p-6 space-y-6 flex-1 overflow-y-auto text-xs" @submit.prevent="handleEditSave">
          <!-- 1. Customer & Organization -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">
              1. Customer & Organization
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Customer / Contact Name *</label>
                <input
                  v-model="editForm.customer_name"
                  type="text"
                  required
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Company Name</label>
                <input
                  v-model="editForm.company_name"
                  type="text"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Customer Type</label>
                <select
                  v-model="editForm.customer_type"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Phone *</label>
                <input
                  v-model="editForm.phone"
                  type="tel"
                  required
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Alternate Phone</label>
                <input
                  v-model="editForm.alternate_phone"
                  type="tel"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input
                  v-model="editForm.email"
                  type="email"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Contact Person</label>
                <input
                  v-model="editForm.contact_person"
                  type="text"
                  placeholder="Designated Rep"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">GSTIN</label>
                <input
                  v-model="editForm.gstin"
                  type="text"
                  placeholder="27AAAAA0000A1Z5"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">PAN</label>
                <input
                  v-model="editForm.pan"
                  type="text"
                  placeholder="ABCDE1234F"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
            </div>
          </div>

          <!-- 2. Service Location -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">
              2. Service Location & Facility
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-gray-700 mb-1">Installation Address</label>
                <input
                  v-model="editForm.address"
                  type="text"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">City</label>
                <input
                  v-model="editForm.city"
                  type="text"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">State</label>
                <input
                  v-model="editForm.state"
                  type="text"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                <input
                  v-model="editForm.pincode"
                  type="text"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Landmark</label>
                <input
                  v-model="editForm.landmark"
                  type="text"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
            </div>
          </div>

          <!-- 3. Service & Bandwidth Requirements -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">
              3. Service Requirements
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Bandwidth Required</label>
                <input
                  v-model="editForm.bandwidth_required"
                  type="text"
                  placeholder="e.g. 100 Mbps"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Plan Interest</label>
                <input
                  v-model="editForm.plan_interest"
                  type="text"
                  placeholder="e.g. Enterprise Fiber"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Number of Connections</label>
                <input
                  v-model.number="editForm.number_of_connections"
                  type="number"
                  min="1"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
            </div>
          </div>

          <!-- 4. Commercial Details & Pricing -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">
              4. Commercial Details & Pricing
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Estimated Deal Value (₹)</label>
                <input
                  v-model.number="editForm.estimated_value"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-mono font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Monthly Rental (₹)</label>
                <input
                  v-model.number="editForm.monthly_rental"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-mono font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Installation Charge (₹)</label>
                <input
                  v-model.number="editForm.installation_charge"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-mono font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Contract Period (Months)</label>
                <input
                  v-model.number="editForm.contract_period_months"
                  type="number"
                  min="1"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-gray-700 mb-1">Payment Terms</label>
                <input
                  v-model="editForm.payment_terms"
                  type="text"
                  placeholder="e.g. Monthly in Advance"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
            </div>
          </div>

          <!-- 5. SPANCO Administration & Assignment -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">
              5. SPANCO Stage, Status, Priority & Assignment
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Current Stage *</label>
                <select
                  v-model="editForm.current_stage"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                >
                  <option v-for="stg in SPANCO_STAGES" :key="stg.value" :value="stg.value">
                    {{ stg.label }}
                  </option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Status *</label>
                <select
                  v-model="editForm.status"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                >
                  <option value="active">Active</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                <select
                  v-model="editForm.priority"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Assigned Sales Rep</label>
                <select
                  v-model="editForm.assigned_to"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                >
                  <option value="">Unassigned</option>
                  <option v-for="emp in spancoEmployees" :key="emp.id" :value="emp.id">
                    {{ emp.full_name }} ({{ emp.employee_code || "Staff" }}){{ !emp.is_active ? ' [Inactive]' : '' }} ({{ emp.lead_count }} leads)
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- 6. Timeline Dates -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">
              6. Timeline Dates
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Expected Closure Date</label>
                <input
                  v-model="editForm.expected_closure_date"
                  type="date"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Next Follow-Up Date</label>
                <input
                  v-model="editForm.follow_up_date"
                  type="date"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
            </div>
          </div>

          <!-- 7. Remarks & Notes -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">
              7. Remarks & Internal Notes
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Remarks</label>
                <textarea
                  v-model="editForm.remarks"
                  rows="3"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Internal Notes</label>
                <textarea
                  v-model="editForm.internal_notes"
                  rows="3"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-emerald-500 [color-scheme:light]"
                />
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t shrink-0">
            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700"
              @click="isEditModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 !text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/25 disabled:opacity-50"
            >
              <UIcon v-if="isSubmitting" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-white" />
              <span class="!text-white font-bold">Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- MODAL 5: FULL LEAD DETAILS DRAWER / MODAL                 -->
    <!-- ========================================================= -->
    <div
      v-if="isDetailModalOpen && activeLead"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div class="text-sm font-bold flex items-center gap-2 text-white">
                <span>{{ activeLead.lead_number }}</span>
                <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold" :class="getStageBadgeClass(activeLead.current_stage)">
                  {{ activeLead.current_stage }}
                </span>
              </div>
              <div class="text-[11px] text-gray-400">
                Created {{ formatDate(activeLead.created_at) }}
              </div>
            </div>
          </div>
          <button type="button" class="text-gray-400 hover:text-white" @click="isDetailModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 space-y-6 flex-1 overflow-y-auto text-xs">
          <!-- Section 1: Customer & Business Details -->
          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-3">
            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <UIcon name="i-heroicons-user" class="w-4 h-4 text-amber-600" />
              <span>Customer & Company Information</span>
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span class="text-gray-400 block text-[10px]">Contact Person</span>
                <span class="font-bold text-gray-900">{{ activeLead.customer_info?.name || "N/A" }}</span>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px]">Company Name</span>
                <span class="font-bold text-gray-900">{{ activeLead.customer_info?.company_name || "N/A" }}</span>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px]">Assigned Sales Rep</span>
                <div v-if="getAssignee(activeLead)" class="font-bold text-gray-900 flex items-center gap-1.5">
                  <span>{{ getAssignee(activeLead)?.full_name }}</span>
                  <span
                    v-if="getAssignee(activeLead)?.is_active === false"
                    class="text-[9px] px-1 py-0.2 bg-gray-100 text-gray-500 rounded font-normal"
                  >
                    Inactive
                  </span>
                </div>
                <div v-else class="text-rose-500 font-semibold">Unassigned</div>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px]">Customer Type</span>
                <span class="font-semibold text-gray-800 capitalize">{{ activeLead.customer_info?.type || "N/A" }}</span>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px]">Phone</span>
                <span class="font-mono font-bold text-gray-900">{{ activeLead.customer_info?.phone || "N/A" }}</span>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px]">Email</span>
                <span class="font-mono text-gray-800">{{ activeLead.customer_info?.email || "N/A" }}</span>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px]">GSTIN / PAN</span>
                <span class="font-mono text-gray-800">{{ activeLead.customer_info?.gstin || activeLead.customer_info?.pan || "N/A" }}</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Service Location -->
          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-3">
            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-blue-600" />
              <span>Service Location & Facility</span>
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <span class="text-gray-400 block text-[10px]">Address</span>
                <span class="font-medium text-gray-900">{{ activeLead.service_location?.address || "N/A" }}</span>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px]">Landmark</span>
                <span class="text-gray-800">{{ activeLead.service_location?.landmark || "N/A" }}</span>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px]">City</span>
                <span class="font-bold text-gray-900">{{ activeLead.service_location?.city || "N/A" }}</span>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px]">State</span>
                <span class="text-gray-800">{{ activeLead.service_location?.state || "N/A" }}</span>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px]">Pincode</span>
                <span class="font-mono text-gray-800">{{ activeLead.service_location?.pincode || "N/A" }}</span>
              </div>
            </div>
          </div>

          <!-- Section 3: Commercial Details -->
          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-3">
            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <UIcon name="i-heroicons-currency-rupee" class="w-4 h-4 text-emerald-600" />
              <span>Commercial Terms</span>
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span class="text-gray-400 block text-[10px]">Estimated Deal Value</span>
                <span class="text-sm font-mono font-bold text-emerald-700">
                  {{ formatCurrency(activeLead.commercial_details?.estimated_value || 0) }}
                </span>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px]">Proposed Monthly Rental</span>
                <span class="font-mono font-bold text-gray-900">
                  {{ formatCurrency(activeLead.commercial_details?.proposed_monthly_rental || 0) }}
                </span>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px]">Installation Charge</span>
                <span class="font-mono text-gray-800">
                  {{ formatCurrency(activeLead.commercial_details?.proposed_installation_charge || 0) }}
                </span>
              </div>
              <div>
                <span class="text-gray-400 block text-[10px]">Contract Period</span>
                <span class="text-gray-800">
                  {{ activeLead.commercial_details?.contract_period_months ? `${activeLead.commercial_details.contract_period_months} Mos` : "N/A" }}
                </span>
              </div>
            </div>
          </div>

          <!-- Section 4: Stage History Audit Trail -->
          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-3">
            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <UIcon name="i-heroicons-clock" class="w-4 h-4 text-indigo-600" />
              <span>Stage Progression & History Trail</span>
            </h4>
            <div v-if="isLoadingHistory" class="text-center py-4 text-gray-400">
              <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 mx-auto animate-spin mb-1 text-amber-600" />
              <span>Loading stage audit trail...</span>
            </div>
            <div v-else-if="leadHistory.length === 0" class="text-gray-400 py-3 text-center">
              No previous stage transitions recorded.
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="h in leadHistory"
                :key="h.id"
                class="p-2.5 rounded-xl bg-white border border-gray-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-gray-700 uppercase">{{ h.from_stage || "Start" }}</span>
                    <UIcon name="i-heroicons-arrow-right" class="w-3.5 h-3.5 text-gray-400" />
                    <span class="font-bold text-emerald-600 uppercase">{{ h.to_stage }}</span>
                  </div>
                  <div v-if="h.remarks || h.change_reason" class="text-[11px] text-gray-500 mt-0.5">
                    {{ h.remarks || h.change_reason }}
                  </div>
                </div>
                <div class="text-[10px] text-gray-400 text-right">
                  <div>{{ formatDate(h.changed_at) }}</div>
                  <div v-if="h.days_in_previous_stage" class="text-gray-500 font-mono">
                    {{ h.days_in_previous_stage }} days in stage
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 5: Notes & Remarks -->
          <div v-if="activeLead.notes?.remarks || activeLead.notes?.internal_notes" class="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2">
            <h4 class="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Notes & Remarks
            </h4>
            <p v-if="activeLead.notes?.remarks" class="text-xs text-gray-700">
              {{ activeLead.notes.remarks }}
            </p>
            <p v-if="activeLead.notes?.internal_notes" class="text-xs text-gray-500 italic">
              {{ activeLead.notes.internal_notes }}
            </p>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 !text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              @click="isDetailModalOpen = false; openStageModal(activeLead);"
            >
              <UIcon name="i-heroicons-arrows-up-down" class="w-3.5 h-3.5 text-white" />
              <span class="!text-white font-bold">Override Stage</span>
            </button>
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 !text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              @click="isDetailModalOpen = false; openReassignModal(activeLead);"
            >
              <UIcon name="i-heroicons-user-group" class="w-3.5 h-3.5 text-white" />
              <span class="!text-white font-bold">Reassign Rep</span>
            </button>
          </div>
          <button
            type="button"
            class="px-4 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700"
            @click="isDetailModalOpen = false"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Bulk Selection Action Bar -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform translate-y-8 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-8 opacity-0"
    >
      <div
        v-if="selectedLeadIds.length > 0"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 text-xs backdrop-blur-md"
      >
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span class="font-bold font-mono">{{ selectedLeadIds.length }}</span>
          <span class="text-gray-300">lead(s) selected</span>
        </div>
        <div class="h-4 w-px bg-slate-700" />
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 !text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-all active:scale-95"
            @click="openBulkReassignSelectedModal"
          >
            <UIcon name="i-heroicons-user-group" class="w-4 h-4 text-white" />
            <span class="!text-white font-bold">Assign to Active Sales Rep</span>
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold transition-all"
            @click="selectedLeadIds = []"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </Transition>

    <!-- ========================================================= -->
    <!-- MODAL 6: BULK PIPELINE TRANSFER (OFFBOARDING / HANDOVER)  -->
    <!-- ========================================================= -->
    <div
      v-if="isBulkTransferModalOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-auto">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-800 text-white shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
              <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-bold text-white">Bulk Pipeline Handover / Transfer</h2>
              <p class="text-[11px] text-blue-100">
                Reassign leads from an inactive/departing sales representative to an active representative
              </p>
            </div>
          </div>
          <button type="button" class="text-white/80 hover:text-white" @click="isBulkTransferModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form class="p-6 space-y-4 flex-1 overflow-y-auto text-xs" @submit.prevent="handleBulkTransfer">
          <!-- Step 1: Select Source Representative -->
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">
              1. Transfer Leads From (Source Representative) *
            </label>
            <select
              v-model="bulkTransferForm.source_id"
              class="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 [color-scheme:light]"
              required
            >
              <option value="" disabled>Select representative whose leads to transfer...</option>
              <optgroup v-if="inactiveSalesPersonsWithLeads.length > 0" label="⚠️ Inactive Representatives (Left Company)">
                <option v-for="emp in inactiveSalesPersonsWithLeads" :key="emp.id" :value="emp.id">
                  {{ emp.full_name }} ({{ emp.employee_code || "Staff" }}) [INACTIVE] — {{ emp.lead_count }} lead(s)
                </option>
              </optgroup>
              <optgroup label="Active Representatives">
                <option v-for="emp in activeSpancoEmployees" :key="emp.id" :value="emp.id">
                  {{ emp.full_name }} ({{ emp.employee_code || "Staff" }}) — {{ emp.lead_count }} lead(s)
                </option>
              </optgroup>
            </select>
          </div>

          <!-- Step 2: Select Target Active Representative -->
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">
              2. Transfer Leads To (New Active Representative) *
            </label>
            <select
              v-model="bulkTransferForm.target_id"
              class="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 [color-scheme:light]"
              required
            >
              <option value="" disabled>Select an active sales representative...</option>
              <option
                v-for="emp in activeSpancoEmployees.filter((e) => e.id !== bulkTransferForm.source_id)"
                :key="emp.id"
                :value="emp.id"
              >
                {{ emp.full_name }} ({{ emp.employee_code || "Staff" }}) [Currently {{ emp.lead_count }} leads]
              </option>
            </select>
            <p v-if="activeSpancoEmployees.length === 0" class="text-[11px] text-rose-500 mt-1">
              No active sales representatives with existing leads found.
            </p>
          </div>

          <!-- Step 3: Scope Filter -->
          <div v-if="sourceRep" class="space-y-1.5 pt-1">
            <label class="block text-xs font-bold text-gray-700">3. Select Lead Transfer Scope</label>
            <div class="grid grid-cols-2 gap-3">
              <label
                class="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all"
                :class="bulkTransferForm.scope === 'all' ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold' : 'border-gray-200 bg-gray-50 text-gray-700'"
              >
                <input
                  v-model="bulkTransferForm.scope"
                  type="radio"
                  value="all"
                  class="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div class="text-xs">All Leads</div>
                  <div class="text-[10px] text-gray-500 font-mono">{{ sourceLeadsCount }} total lead(s)</div>
                </div>
              </label>

              <label
                class="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all"
                :class="bulkTransferForm.scope === 'active_only' ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold' : 'border-gray-200 bg-gray-50 text-gray-700'"
              >
                <input
                  v-model="bulkTransferForm.scope"
                  type="radio"
                  value="active_only"
                  class="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div class="text-xs">Active Deals Only</div>
                  <div class="text-[10px] text-gray-500 font-mono">{{ sourceActiveLeadsCount }} open lead(s)</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Step 4: Transfer Summary Card -->
          <div
            v-if="sourceRep && targetRep"
            class="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-2 text-xs"
          >
            <div class="flex items-center justify-between font-bold text-gray-900">
              <span>Transfer Summary</span>
              <span class="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono">
                {{ sourceTransferCount }} Lead(s)
              </span>
            </div>
            <div class="flex items-center justify-between text-[11px] text-gray-600 pt-1">
              <div>
                <span class="text-gray-400 block text-[10px]">From:</span>
                <span class="font-bold text-gray-900">{{ sourceRep.full_name }}</span>
                <span v-if="!sourceRep.is_active" class="ml-1 text-[9px] px-1 py-0.2 bg-gray-200 text-gray-600 rounded">
                  Inactive
                </span>
              </div>
              <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 text-blue-600 mx-2" />
              <div class="text-right">
                <span class="text-gray-400 block text-[10px]">To:</span>
                <span class="font-bold text-emerald-700">{{ targetRep.full_name }}</span>
                <span class="ml-1 text-[9px] px-1 py-0.2 bg-emerald-100 text-emerald-700 rounded font-semibold">
                  Active
                </span>
              </div>
            </div>
            <div class="border-t border-blue-200/60 pt-2 flex items-center justify-between text-[11px]">
              <span class="text-gray-500">Total Transferred Pipeline Value:</span>
              <span class="font-mono font-bold text-gray-900">{{ formatCurrency(sourceTransferValue) }}</span>
            </div>
          </div>

          <!-- Step 5: Transfer Reason / Internal Audit Notes -->
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">
              Reason / Audit Notes (Optional)
            </label>
            <input
              v-model="bulkTransferForm.notes"
              type="text"
              placeholder="e.g. Sales rep left company; pipeline handover to active rep"
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 [color-scheme:light]"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t shrink-0">
            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700"
              @click="isBulkTransferModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || !bulkTransferForm.source_id || !bulkTransferForm.target_id || sourceTransferCount === 0"
              class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 !text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/25 disabled:opacity-50 transition-all"
            >
              <UIcon v-if="isSubmitting" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-white" />
              <span class="!text-white font-bold">
                Transfer {{ sourceTransferCount || 0 }} Lead(s) Now
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- MODAL 7: BULK REASSIGN SELECTED LEADS                     -->
    <!-- ========================================================= -->
    <div
      v-if="isBulkReassignSelectedModalOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-auto">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-blue-700 text-white shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
              <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-bold text-white">Bulk Assign Selected Leads</h2>
              <p class="text-[11px] text-blue-100">
                Reassign {{ selectedLeadIds.length }} selected leads to an active sales representative
              </p>
            </div>
          </div>
          <button type="button" class="text-white/80 hover:text-white" @click="isBulkReassignSelectedModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form class="p-6 space-y-4 flex-1 overflow-y-auto text-xs" @submit.prevent="handleBulkReassignSelected">
          <div class="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <span class="font-bold">Total Selected Leads:</span>
            <span class="font-mono font-bold text-blue-800 text-sm">{{ selectedLeadIds.length }}</span>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">
              Select Active Sales Representative *
            </label>
            <select
              v-model="selectedBulkAssignee"
              class="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 [color-scheme:light]"
              required
            >
              <option value="" disabled>Select an active sales representative...</option>
              <option v-for="emp in activeSpancoEmployees" :key="emp.id" :value="emp.id">
                {{ emp.full_name }} ({{ emp.employee_code || "Staff" }}) [Currently {{ emp.lead_count }} leads]
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">
              Reassignment Note (Optional)
            </label>
            <input
              v-model="selectedBulkNotes"
              type="text"
              placeholder="e.g. Pipeline reallocation to active sales staff"
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 [color-scheme:light]"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t shrink-0">
            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700"
              @click="isBulkReassignSelectedModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || !selectedBulkAssignee"
              class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 !text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/25 disabled:opacity-50 transition-all"
            >
              <UIcon v-if="isSubmitting" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-white" />
              <span class="!text-white font-bold">Assign {{ selectedLeadIds.length }} Leads</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useAdminStore } from "~/stores/admin";
import { useSystemConfigStore } from "~/stores/systemConfig";
import {
  STAGE_LABELS,
  STATUS_LABELS,
} from "~/utils/lead";
import type { SpancoStageHistory } from "~/utils/lead";

definePageMeta({
  middleware: ["auth", "admin", "spanco"],
});

const systemConfigStore = useSystemConfigStore();

// In-page guard in case Spanco is disabled via realtime
watch(
  () => systemConfigStore.isSpancoEnabled,
  (enabled) => {
    if (!enabled) {
      navigateTo("/admin");
    }
  }
);

interface LeadRow {
  id: number;
  lead_number: string;
  created_at: string;
  updated_at?: string;
  current_stage: string;
  stage_updated_at?: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  assigned_at?: string | null;
  sales_team_id?: number | null;
  expected_closure_date?: string | null;
  customer_info: {
    name?: string;
    company_name?: string;
    type?: string;
    phone?: string;
    alternate_phone?: string;
    contact_person?: string;
    email?: string;
    gstin?: string;
    pan?: string;
  };
  service_location: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };
  service_requirements: {
    bandwidth_required?: string;
    plan_interest?: string;
    connection_type?: string;
    number_of_connections?: number;
    special_requirements?: string;
  };
  commercial_details?: {
    estimated_value?: number;
    proposed_monthly_rental?: number;
    proposed_installation_charge?: number;
    contract_period_months?: number;
    payment_terms?: string;
  };
  timeline?: {
    expected_closure_date?: string;
    follow_up_date?: string;
    last_contact_date?: string;
    won_date?: string;
  };
  notes?: {
    remarks?: string;
    internal_notes?: string;
  };
  profiles?: {
    id?: string;
    full_name: string | null;
    employee_code: string | null;
    avatar_url: string | null;
    is_active?: boolean;
  };
}

const adminStore = useAdminStore();
const supabase = useSupabaseClient();
const user = useSupabaseUser();

// Data State
const leads = ref<LeadRow[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);

// Filters State
const searchQuery = ref("");
const selectedStage = ref<string>("ALL");
const selectedStatus = ref<string>("ALL");
const selectedPriority = ref<string>("ALL");
const selectedAssignee = ref<string>("ALL");
const sortBy = ref<string>("newest");

// Pagination State
const currentPage = ref(1);
const perPage = 20;

// Multi-select State
const selectedLeadIds = ref<number[]>([]);
const selectedBulkAssignee = ref("");
const selectedBulkNotes = ref("");

// Active Lead & Modals
const activeLead = ref<LeadRow | null>(null);
const isCreateModalOpen = ref(false);
const isStageModalOpen = ref(false);
const isReassignModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isDetailModalOpen = ref(false);
const isBulkTransferModalOpen = ref(false);
const isBulkReassignSelectedModalOpen = ref(false);

// Bulk Transfer Pipeline Form
const bulkTransferForm = ref({
  source_id: "",
  target_id: "",
  scope: "all" as "all" | "active_only",
  notes: "",
});

const leadHistory = ref<SpancoStageHistory[]>([]);
const isLoadingHistory = ref(false);

// Forms
const createForm = ref({
  customer_name: "",
  company_name: "",
  customer_type: "business",
  phone: "",
  email: "",
  gstin: "",
  address: "",
  city: "",
  state: "Maharashtra",
  pincode: "",
  landmark: "",
  stage: "suspect",
  priority: "medium",
  assigned_to: "",
  estimated_value: 0,
  monthly_rental: 0,
  expected_closure_date: "",
  remarks: "",
});

const stageForm = ref({
  stage: "suspect",
  status: "active",
  remarks: "",
});

const reassignForm = ref({
  assigned_to: "",
});

const editForm = ref({
  // 1. Customer & Org
  customer_name: "",
  company_name: "",
  customer_type: "business",
  phone: "",
  alternate_phone: "",
  contact_person: "",
  email: "",
  gstin: "",
  pan: "",

  // 2. Service Location
  address: "",
  city: "",
  state: "Maharashtra",
  pincode: "",
  landmark: "",

  // 3. Requirements
  bandwidth_required: "",
  plan_interest: "",
  number_of_connections: 1,
  special_requirements: "",

  // 4. Commercials
  estimated_value: 0,
  monthly_rental: 0,
  installation_charge: 0,
  contract_period_months: 12,
  payment_terms: "Monthly in Advance",

  // 5. Administration
  current_stage: "suspect",
  status: "active",
  priority: "medium",
  assigned_to: "",

  // 6. Timeline
  expected_closure_date: "",
  follow_up_date: "",

  // 7. Remarks
  remarks: "",
  internal_notes: "",
});

const SPANCO_STAGES = [
  { value: "suspect", label: "Suspect", textColor: "text-gray-600", dotColor: "bg-gray-400" },
  { value: "prospect", label: "Prospect", textColor: "text-blue-600", dotColor: "bg-blue-500" },
  { value: "approach", label: "Approach", textColor: "text-cyan-600", dotColor: "bg-cyan-500" },
  { value: "negotiation", label: "Negotiation", textColor: "text-purple-600", dotColor: "bg-purple-500" },
  { value: "closure", label: "Closure", textColor: "text-amber-600", dotColor: "bg-amber-500" },
  { value: "order", label: "Order", textColor: "text-emerald-600", dotColor: "bg-emerald-500" },
];

interface SpancoEmployee {
  id: string;
  full_name: string;
  employee_code?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  lead_count: number;
}

// Helper to reliably resolve assignee profile information
function getAssignee(lead: LeadRow | null | undefined) {
  if (!lead) return null;
  if (lead.profiles && lead.profiles.full_name) {
    const fromStore = lead.assigned_to
      ? adminStore.employees.find((e) => e.id === lead.assigned_to)
      : null;
    return {
      id: lead.profiles.id || lead.assigned_to || "",
      full_name: lead.profiles.full_name,
      employee_code: lead.profiles.employee_code || fromStore?.employee_code || null,
      avatar_url: lead.profiles.avatar_url || fromStore?.avatar_url || null,
      is_active: fromStore ? fromStore.is_active : (lead.profiles.is_active ?? true),
    };
  }
  if (lead.assigned_to) {
    const fromStore = adminStore.employees.find((e) => e.id === lead.assigned_to);
    if (fromStore) {
      return {
        id: fromStore.id,
        full_name: fromStore.full_name || "Unknown Staff",
        employee_code: fromStore.employee_code || null,
        avatar_url: fromStore.avatar_url || null,
        is_active: fromStore.is_active,
      };
    }
  }
  return null;
}

// Show employees who have at least one lead in spanco_leads (regardless of active status in profiles)
const spancoEmployees = computed<SpancoEmployee[]>(() => {
  const countMap = new Map<string, number>();
  for (const lead of leads.value) {
    if (lead.assigned_to) {
      countMap.set(lead.assigned_to, (countMap.get(lead.assigned_to) || 0) + 1);
    }
  }

  const empMap = new Map<string, SpancoEmployee>();

  // 1. Populate employees from adminStore.employees who have at least one lead
  for (const emp of adminStore.employees) {
    const count = countMap.get(emp.id) || 0;
    if (count > 0) {
      empMap.set(emp.id, {
        id: emp.id,
        full_name: emp.full_name || "Unknown",
        employee_code: emp.employee_code || null,
        avatar_url: emp.avatar_url || null,
        is_active: emp.is_active ?? true,
        lead_count: count,
      });
    }
  }

  // 2. Fallback: check leads.value for any assigned_to profile not found in adminStore.employees
  for (const lead of leads.value) {
    if (lead.assigned_to && !empMap.has(lead.assigned_to)) {
      const count = countMap.get(lead.assigned_to) || 1;
      empMap.set(lead.assigned_to, {
        id: lead.assigned_to,
        full_name: lead.profiles?.full_name || "Unknown Staff",
        employee_code: lead.profiles?.employee_code || null,
        avatar_url: lead.profiles?.avatar_url || null,
        is_active: lead.profiles?.is_active ?? true,
        lead_count: count,
      });
    }
  }

  return Array.from(empMap.values()).sort((a, b) =>
    a.full_name.localeCompare(b.full_name, undefined, { sensitivity: "base" })
  );
});

// Backward compatibility alias for any remaining references
const activeEmployees = spancoEmployees;

// Active sales representatives who have at least one lead
const activeSpancoEmployees = computed<SpancoEmployee[]>(() => {
  return spancoEmployees.value.filter((e) => e.is_active && e.lead_count > 0);
});

// Inactive sales representatives who have at least one lead
const inactiveSalesPersonsWithLeads = computed<SpancoEmployee[]>(() => {
  return spancoEmployees.value.filter((e) => !e.is_active && e.lead_count > 0);
});

// Total leads held by inactive representatives
const inactiveLeadsCount = computed(() => {
  return inactiveSalesPersonsWithLeads.value.reduce((sum, e) => sum + e.lead_count, 0);
});

// Check if currently filtered assignee is inactive
const selectedRepIsInactive = computed(() => {
  if (selectedAssignee.value === "ALL" || selectedAssignee.value === "UNASSIGNED") return false;
  const emp = spancoEmployees.value.find((e) => e.id === selectedAssignee.value);
  return !!(emp && !emp.is_active);
});

// Multi-select table computed
const isAllSelected = computed(() => {
  if (paginatedLeads.value.length === 0) return false;
  return paginatedLeads.value.every((lead) => selectedLeadIds.value.includes(lead.id));
});

// Bulk Transfer dynamic preview computeds
const sourceRep = computed(() => {
  if (!bulkTransferForm.value.source_id) return null;
  return spancoEmployees.value.find((e) => e.id === bulkTransferForm.value.source_id) || null;
});

const targetRep = computed(() => {
  if (!bulkTransferForm.value.target_id) return null;
  return activeSpancoEmployees.value.find((e) => e.id === bulkTransferForm.value.target_id) || null;
});

const sourceLeads = computed(() => {
  if (!bulkTransferForm.value.source_id) return [];
  return leads.value.filter((l) => l.assigned_to === bulkTransferForm.value.source_id);
});

const sourceLeadsCount = computed(() => sourceLeads.value.length);

const sourceActiveLeadsCount = computed(() => {
  return sourceLeads.value.filter((l) => l.status === "active").length;
});

const sourceTransferValue = computed(() => {
  const list = bulkTransferForm.value.scope === "active_only"
    ? sourceLeads.value.filter((l) => l.status === "active")
    : sourceLeads.value;
  return list.reduce((sum, l) => sum + (Number(l.commercial_details?.estimated_value) || 0), 0);
});

const sourceTransferCount = computed(() => {
  return bulkTransferForm.value.scope === "active_only"
    ? sourceActiveLeadsCount.value
    : sourceLeadsCount.value;
});

// KPI Analytics
const activeCount = computed(() => {
  return leads.value.filter((l) => l.status === "active").length;
});

const unassignedCount = computed(() => {
  return leads.value.filter((l) => !l.assigned_to).length;
});

const wonCount = computed(() => {
  return leads.value.filter((l) => l.status === "won" || l.current_stage === "won").length;
});

const lostCount = computed(() => {
  return leads.value.filter((l) => l.status === "lost" || l.current_stage === "lost").length;
});

const onHoldCount = computed(() => {
  return leads.value.filter((l) => l.status === "on_hold").length;
});

const conversionRate = computed(() => {
  if (leads.value.length === 0) return 0;
  return Math.round((wonCount.value / leads.value.length) * 100);
});

const totalPipelineValue = computed(() => {
  return leads.value.reduce((sum, l) => sum + (Number(l.commercial_details?.estimated_value) || 0), 0);
});

const wonPipelineValue = computed(() => {
  return leads.value
    .filter((l) => l.status === "won" || l.current_stage === "won")
    .reduce((sum, l) => sum + (Number(l.commercial_details?.estimated_value) || 0), 0);
});

const overdueCount = computed(() => {
  const today = getLocalDateString();
  return leads.value.filter((l) => {
    return l.status === "active" && l.expected_closure_date && l.expected_closure_date < today;
  }).length;
});

const stageCountMap = computed(() => {
  const counts: Record<string, number> = {};
  for (const l of leads.value) {
    counts[l.current_stage] = (counts[l.current_stage] || 0) + 1;
  }
  return counts;
});

// Filtering & Sorting
const filteredLeads = computed(() => {
  let list = [...leads.value];

  // Stage Filter
  if (selectedStage.value !== "ALL") {
    list = list.filter((l) => l.current_stage === selectedStage.value);
  }

  // Status Filter
  if (selectedStatus.value !== "ALL") {
    list = list.filter((l) => l.status === selectedStatus.value);
  }

  // Priority Filter
  if (selectedPriority.value !== "ALL") {
    list = list.filter((l) => l.priority === selectedPriority.value);
  }

  // Assignee Filter
  if (selectedAssignee.value === "UNASSIGNED") {
    list = list.filter((l) => !l.assigned_to);
  } else if (selectedAssignee.value !== "ALL") {
    list = list.filter((l) => l.assigned_to === selectedAssignee.value);
  }

  // Text Search with multi-token matching across all fields
  if (searchQuery.value.trim()) {
    const rawQuery = searchQuery.value.toLowerCase().trim();
    const tokens = rawQuery.split(/\s+/).filter(Boolean);

    list = list.filter((l) => {
      const rep = getAssignee(l);
      const searchableContent = [
        l.lead_number,
        l.lead_number?.replace(/\D/g, ""), // numeric lead number e.g. "45" or "00045"
        l.customer_info?.name,
        l.customer_info?.company_name,
        l.customer_info?.contact_person,
        l.customer_info?.phone,
        l.customer_info?.alternate_phone,
        l.customer_info?.email,
        l.customer_info?.gstin,
        l.customer_info?.pan,
        l.customer_info?.type,
        l.service_location?.address,
        l.service_location?.city,
        l.service_location?.state,
        l.service_location?.pincode,
        l.service_location?.landmark,
        l.current_stage,
        (STAGE_LABELS as Record<string, string>)[l.current_stage],
        l.status,
        (STATUS_LABELS as Record<string, string>)[l.status],
        l.priority,
        l.service_requirements?.plan_interest,
        l.service_requirements?.bandwidth_required,
        l.service_requirements?.connection_type,
        l.notes?.remarks,
        l.notes?.internal_notes,
        rep?.full_name,
        rep?.employee_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return tokens.every((token) => searchableContent.includes(token));
    });
  }

  // Sort
  if (sortBy.value === "newest") {
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sortBy.value === "oldest") {
    list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (sortBy.value === "value_high") {
    list.sort((a, b) => (b.commercial_details?.estimated_value || 0) - (a.commercial_details?.estimated_value || 0));
  } else if (sortBy.value === "value_low") {
    list.sort((a, b) => (a.commercial_details?.estimated_value || 0) - (b.commercial_details?.estimated_value || 0));
  } else if (sortBy.value === "closure") {
    list.sort((a, b) => (a.expected_closure_date || "9999").localeCompare(b.expected_closure_date || "9999"));
  }

  return list;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredLeads.value.length / perPage)));

const safeCurrentPage = computed(() => {
  if (currentPage.value < 1) return 1;
  if (currentPage.value > totalPages.value) return totalPages.value;
  return currentPage.value;
});

const paginationStart = computed(() => {
  if (filteredLeads.value.length === 0) return 0;
  return (safeCurrentPage.value - 1) * perPage + 1;
});

const paginationEnd = computed(() => Math.min(safeCurrentPage.value * perPage, filteredLeads.value.length));

const paginatedLeads = computed(() => {
  const start = (safeCurrentPage.value - 1) * perPage;
  return filteredLeads.value.slice(start, start + perPage);
});

// Watch search query and filter controls to automatically reset pagination to page 1
watch(
  [searchQuery, selectedStage, selectedStatus, selectedPriority, selectedAssignee, sortBy],
  () => {
    currentPage.value = 1;
  }
);

// Methods & Supabase Actions
async function fetchLeads() {
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from("spanco_leads")
      .select(`
        *,
        profiles:assigned_to (
          id,
          full_name,
          employee_code,
          avatar_url,
          is_active
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    leads.value = (data as unknown as LeadRow[]) || [];
  } catch (err: any) {
    console.error("Failed to fetch SPANCO leads:", err);
    alert("Error loading leads: " + (err.message || err));
  } finally {
    isLoading.value = false;
  }
}

// Open Modals
function openCreateModal() {
  createForm.value = {
    customer_name: "",
    company_name: "",
    customer_type: "business",
    phone: "",
    email: "",
    gstin: "",
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    landmark: "",
    stage: "suspect",
    priority: "medium",
    assigned_to: "",
    estimated_value: 0,
    monthly_rental: 0,
    expected_closure_date: "",
    remarks: "",
  };
  isCreateModalOpen.value = true;
}

function openStageModal(lead: LeadRow) {
  activeLead.value = lead;
  stageForm.value = {
    stage: lead.current_stage || "suspect",
    status: lead.status || "active",
    remarks: "",
  };
  isStageModalOpen.value = true;
}

function openReassignModal(lead: LeadRow) {
  activeLead.value = lead;
  reassignForm.value = {
    assigned_to: lead.assigned_to || "",
  };
  isReassignModalOpen.value = true;
}

function openEditModal(lead: LeadRow) {
  activeLead.value = lead;
  editForm.value = {
    customer_name: lead.customer_info?.name || "",
    company_name: lead.customer_info?.company_name || "",
    customer_type: lead.customer_info?.type || "business",
    phone: lead.customer_info?.phone || "",
    alternate_phone: lead.customer_info?.alternate_phone || "",
    contact_person: lead.customer_info?.contact_person || "",
    email: lead.customer_info?.email || "",
    gstin: lead.customer_info?.gstin || "",
    pan: lead.customer_info?.pan || "",

    address: lead.service_location?.address || "",
    city: lead.service_location?.city || "",
    state: lead.service_location?.state || "Maharashtra",
    pincode: lead.service_location?.pincode || "",
    landmark: lead.service_location?.landmark || "",

    bandwidth_required: lead.service_requirements?.bandwidth_required || "",
    plan_interest: lead.service_requirements?.plan_interest || "",
    number_of_connections: lead.service_requirements?.number_of_connections || 1,
    special_requirements: lead.service_requirements?.special_requirements || "",

    estimated_value: lead.commercial_details?.estimated_value || 0,
    monthly_rental: lead.commercial_details?.proposed_monthly_rental || 0,
    installation_charge: lead.commercial_details?.proposed_installation_charge || 0,
    contract_period_months: lead.commercial_details?.contract_period_months || 12,
    payment_terms: lead.commercial_details?.payment_terms || "Monthly in Advance",

    current_stage: lead.current_stage || "suspect",
    status: lead.status || "active",
    priority: lead.priority || "medium",
    assigned_to: lead.assigned_to || "",

    expected_closure_date: lead.expected_closure_date || "",
    follow_up_date: lead.timeline?.follow_up_date || "",

    remarks: lead.notes?.remarks || "",
    internal_notes: lead.notes?.internal_notes || "",
  };
  isEditModalOpen.value = true;
}

async function openDetailModal(lead: LeadRow) {
  activeLead.value = lead;
  isDetailModalOpen.value = true;
  isLoadingHistory.value = true;
  leadHistory.value = [];

  try {
    const { data, error } = await supabase
      .from("spanco_stage_history")
      .select("*")
      .eq("lead_id", lead.id)
      .order("changed_at", { ascending: false });

    if (!error && data) {
      leadHistory.value = data as SpancoStageHistory[];
    }
  } catch (err) {
    console.warn("Could not load stage history:", err);
  } finally {
    isLoadingHistory.value = false;
  }
}

// Handlers
async function handleCreateLead() {
  if (!createForm.value.customer_name || !createForm.value.phone) {
    alert("Please fill in customer name and phone.");
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      lead_number: "", // Will be filled by generate_lead_number trigger
      current_stage: createForm.value.stage,
      status: "active",
      priority: createForm.value.priority,
      assigned_to: createForm.value.assigned_to || null,
      assigned_at: createForm.value.assigned_to ? new Date().toISOString() : null,
      customer_info: {
        name: createForm.value.customer_name,
        company_name: createForm.value.company_name,
        type: createForm.value.customer_type,
        phone: createForm.value.phone,
        email: createForm.value.email,
        gstin: createForm.value.gstin,
      },
      service_location: {
        address: createForm.value.address,
        city: createForm.value.city,
        state: createForm.value.state,
        pincode: createForm.value.pincode,
        landmark: createForm.value.landmark,
      },
      service_requirements: {
        number_of_connections: 1,
      },
      commercial_details: {
        estimated_value: createForm.value.estimated_value || 0,
        proposed_monthly_rental: createForm.value.monthly_rental || 0,
      },
      expected_closure_date: createForm.value.expected_closure_date || null,
      notes: {
        remarks: createForm.value.remarks || null,
        internal_notes: "Created via Admin SPANCO Control Panel",
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("spanco_leads").insert([payload]);
    if (error) throw error;

    isCreateModalOpen.value = false;
    await fetchLeads();
  } catch (err: any) {
    alert("Failed to create lead: " + (err.message || err));
  } finally {
    isSubmitting.value = false;
  }
}

async function handleStageOverride() {
  if (!activeLead.value) return;

  isSubmitting.value = true;
  try {
    const user = useSupabaseUser();
    const leadId = activeLead.value.id;
    const oldStage = activeLead.value.current_stage;
    const newStage = stageForm.value.stage;
    const newStatus = stageForm.value.status;

    // 1. Update lead
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("spanco_leads")
      .update({
        current_stage: newStage,
        status: newStatus,
        stage_updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (updateError) throw updateError;

    // 2. Append to stage history
    if (oldStage !== newStage && user.value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("spanco_stage_history").insert([
        {
          lead_id: leadId,
          from_stage: oldStage,
          to_stage: newStage,
          changed_by: user.value.id,
          change_reason: "Admin Stage Override",
          remarks: stageForm.value.remarks || "Updated via Admin SPANCO Control",
        },
      ]);
    }

    isStageModalOpen.value = false;
    await fetchLeads();
  } catch (err: any) {
    alert("Failed to override stage: " + (err.message || err));
  } finally {
    isSubmitting.value = false;
  }
}

async function handleReassign() {
  if (!activeLead.value) return;

  isSubmitting.value = true;
  try {
    const newAssignee = reassignForm.value.assigned_to || null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("spanco_leads")
      .update({
        assigned_to: newAssignee,
        assigned_at: newAssignee ? new Date().toISOString() : null,
      })
      .eq("id", activeLead.value.id);

    if (error) throw error;

    isReassignModalOpen.value = false;
    await fetchLeads();
  } catch (err: any) {
    alert("Failed to reassign lead: " + (err.message || err));
  } finally {
    isSubmitting.value = false;
  }
}

async function handleEditSave() {
  if (!activeLead.value) return;

  isSubmitting.value = true;
  try {
    const currentCustomer = activeLead.value.customer_info || {};
    const currentLocation = activeLead.value.service_location || {};
    const currentReqs = activeLead.value.service_requirements || {};
    const currentCommercial = activeLead.value.commercial_details || {};
    const currentNotes = activeLead.value.notes || {};
    const currentTimeline = activeLead.value.timeline || {};

    const oldStage = activeLead.value.current_stage;
    const newStage = editForm.value.current_stage;
    const oldAssignee = activeLead.value.assigned_to;
    const newAssignee = editForm.value.assigned_to || null;

    const updates = {
      current_stage: newStage,
      status: editForm.value.status,
      priority: editForm.value.priority,
      assigned_to: newAssignee,
      assigned_at: newAssignee !== oldAssignee ? (newAssignee ? new Date().toISOString() : null) : activeLead.value.assigned_at,
      expected_closure_date: editForm.value.expected_closure_date || null,
      stage_updated_at: oldStage !== newStage ? new Date().toISOString() : activeLead.value.stage_updated_at || new Date().toISOString(),
      customer_info: {
        ...currentCustomer,
        name: editForm.value.customer_name,
        company_name: editForm.value.company_name,
        type: editForm.value.customer_type,
        phone: editForm.value.phone,
        alternate_phone: editForm.value.alternate_phone,
        contact_person: editForm.value.contact_person,
        email: editForm.value.email,
        gstin: editForm.value.gstin,
        pan: editForm.value.pan,
      },
      service_location: {
        ...currentLocation,
        address: editForm.value.address,
        city: editForm.value.city,
        state: editForm.value.state,
        pincode: editForm.value.pincode,
        landmark: editForm.value.landmark,
      },
      service_requirements: {
        ...currentReqs,
        bandwidth_required: editForm.value.bandwidth_required,
        plan_interest: editForm.value.plan_interest,
        number_of_connections: editForm.value.number_of_connections,
        special_requirements: editForm.value.special_requirements,
      },
      commercial_details: {
        ...currentCommercial,
        estimated_value: editForm.value.estimated_value,
        proposed_monthly_rental: editForm.value.monthly_rental,
        proposed_installation_charge: editForm.value.installation_charge,
        contract_period_months: editForm.value.contract_period_months,
        payment_terms: editForm.value.payment_terms,
      },
      timeline: {
        ...currentTimeline,
        expected_closure_date: editForm.value.expected_closure_date || null,
        follow_up_date: editForm.value.follow_up_date || null,
      },
      notes: {
        ...currentNotes,
        remarks: editForm.value.remarks,
        internal_notes: editForm.value.internal_notes,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("spanco_leads")
      .update(updates)
      .eq("id", activeLead.value.id);

    if (error) throw error;

    // Audit stage change if changed
    if (oldStage !== newStage) {
      const user = useSupabaseUser();
      if (user.value) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("spanco_stage_history").insert([
          {
            lead_id: activeLead.value.id,
            from_stage: oldStage,
            to_stage: newStage,
            changed_by: user.value.id,
            change_reason: "Admin Lead Edit",
            remarks: "Stage updated during admin lead details editing",
          },
        ]);
      }
    }

    isEditModalOpen.value = false;
    await fetchLeads();
  } catch (err: any) {
    alert("Failed to save changes: " + (err.message || err));
  } finally {
    isSubmitting.value = false;
  }
}

async function confirmDeleteLead(lead: LeadRow) {
  if (!confirm(`Are you sure you want to permanently delete lead ${lead.lead_number} (${lead.customer_info?.name})? This action cannot be undone.`)) {
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("spanco_leads").delete().eq("id", lead.id);
    if (error) throw error;
    await fetchLeads();
  } catch (err: any) {
    alert("Failed to delete lead: " + (err.message || err));
  }
}

// Table Multi-select Methods
function toggleSelectAll() {
  if (isAllSelected.value) {
    const pageIds = new Set(paginatedLeads.value.map((l) => l.id));
    selectedLeadIds.value = selectedLeadIds.value.filter((id) => !pageIds.has(id));
  } else {
    const current = new Set(selectedLeadIds.value);
    for (const l of paginatedLeads.value) {
      current.add(l.id);
    }
    selectedLeadIds.value = Array.from(current);
  }
}

function openBulkTransferModal(sourceId?: string) {
  bulkTransferForm.value.source_id = sourceId || (inactiveSalesPersonsWithLeads.value[0]?.id || "");
  bulkTransferForm.value.target_id = "";
  bulkTransferForm.value.scope = "all";
  bulkTransferForm.value.notes = "";
  isBulkTransferModalOpen.value = true;
}

function openBulkReassignSelectedModal() {
  if (selectedLeadIds.value.length === 0) return;
  selectedBulkAssignee.value = "";
  selectedBulkNotes.value = "";
  isBulkReassignSelectedModalOpen.value = true;
}

// Bulk Transfer Pipeline (Handover all/filtered leads from one representative to an active representative)
async function handleBulkTransfer() {
  if (!bulkTransferForm.value.source_id || !bulkTransferForm.value.target_id) {
    alert("Please select both source and target sales representatives.");
    return;
  }
  if (bulkTransferForm.value.source_id === bulkTransferForm.value.target_id) {
    alert("Source and target representatives cannot be the same person.");
    return;
  }

  isSubmitting.value = true;
  try {
    const leadsToUpdate = bulkTransferForm.value.scope === "active_only"
      ? sourceLeads.value.filter((l) => l.status === "active")
      : sourceLeads.value;

    if (leadsToUpdate.length === 0) {
      alert("No leads match the selected scope to transfer.");
      isSubmitting.value = false;
      return;
    }

    const leadIds = leadsToUpdate.map((l) => l.id);
    const newAssignee = bulkTransferForm.value.target_id;
    const nowIso = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("spanco_leads")
      .update({
        assigned_to: newAssignee,
        assigned_at: nowIso,
      })
      .in("id", leadIds);

    if (error) throw error;

    // Append stage history / transfer log if user is logged in
    if (user.value) {
      const historyRows = leadIds.map((id) => ({
        lead_id: id,
        from_stage: leadsToUpdate.find((l) => l.id === id)?.current_stage || "suspect",
        to_stage: leadsToUpdate.find((l) => l.id === id)?.current_stage || "suspect",
        changed_by: user.value?.id,
        change_reason: "Bulk Reassignment",
        remarks: bulkTransferForm.value.notes?.trim()
          ? `Transferred from ${sourceRep.value?.full_name || "prev rep"} to ${targetRep.value?.full_name || "new rep"}: ${bulkTransferForm.value.notes.trim()}`
          : `Pipeline transferred from ${sourceRep.value?.full_name || "previous representative"} to ${targetRep.value?.full_name || "new representative"}`,
      }));

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("spanco_stage_history").insert(historyRows);
      } catch (histErr) {
        console.warn("Could not insert stage history for bulk transfer:", histErr);
      }
    }

    alert(`Successfully transferred ${leadIds.length} lead(s) to ${targetRep.value?.full_name || "the new representative"}.`);
    isBulkTransferModalOpen.value = false;
    await fetchLeads();
  } catch (err: any) {
    alert("Failed to bulk transfer leads: " + (err.message || err));
  } finally {
    isSubmitting.value = false;
  }
}

// Bulk Reassign Checked Table Leads
async function handleBulkReassignSelected() {
  if (selectedLeadIds.value.length === 0 || !selectedBulkAssignee.value) {
    alert("Please select an active sales representative.");
    return;
  }

  isSubmitting.value = true;
  try {
    const leadIds = [...selectedLeadIds.value];
    const newAssignee = selectedBulkAssignee.value;
    const target = activeSpancoEmployees.value.find((e) => e.id === newAssignee);
    const nowIso = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("spanco_leads")
      .update({
        assigned_to: newAssignee,
        assigned_at: nowIso,
      })
      .in("id", leadIds);

    if (error) throw error;

    // Insert history trail
    if (user.value) {
      const historyRows = leadIds.map((id) => {
        const lead = leads.value.find((l) => l.id === id);
        return {
          lead_id: id,
          from_stage: lead?.current_stage || "suspect",
          to_stage: lead?.current_stage || "suspect",
          changed_by: user.value?.id,
          change_reason: "Bulk Reassignment",
          remarks: selectedBulkNotes.value?.trim()
            ? `Bulk reassigned to ${target?.full_name || "new rep"}: ${selectedBulkNotes.value.trim()}`
            : `Bulk reassigned to ${target?.full_name || "new representative"}`,
        };
      });

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("spanco_stage_history").insert(historyRows);
      } catch (histErr) {
        console.warn("Could not insert stage history for bulk reassign:", histErr);
      }
    }

    alert(`Successfully reassigned ${leadIds.length} lead(s) to ${target?.full_name || "the active representative"}.`);
    selectedLeadIds.value = [];
    isBulkReassignSelectedModalOpen.value = false;
    await fetchLeads();
  } catch (err: any) {
    alert("Failed to bulk reassign leads: " + (err.message || err));
  } finally {
    isSubmitting.value = false;
  }
}

// Helpers
function resetAllFilters() {
  searchQuery.value = "";
  selectedStage.value = "ALL";
  selectedStatus.value = "ALL";
  selectedPriority.value = "ALL";
  selectedAssignee.value = "ALL";
  sortBy.value = "newest";
  currentPage.value = 1;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function isOverdue(dateStr: string | null | undefined, status: string): boolean {
  if (!dateStr || status !== "active") return false;
  return dateStr < getLocalDateString();
}

function getPriorityClass(p: string): string {
  switch (p) {
    case "critical":
    case "urgent":
      return "bg-rose-100 text-rose-800 border border-rose-200";
    case "high":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "medium":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200";
  }
}

function getStageBadgeClass(stg: string): string {
  switch (stg) {
    case "suspect":
      return "bg-gray-100 text-gray-700 border border-gray-200";
    case "prospect":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "approach":
      return "bg-cyan-100 text-cyan-800 border border-cyan-200";
    case "negotiation":
      return "bg-purple-100 text-purple-700 border border-purple-200";
    case "closure":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "order":
    case "won":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    case "lost":
      return "bg-rose-100 text-rose-800 border border-rose-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusBadgeClass(st: string): string {
  switch (st) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "won":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "lost":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "on_hold":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "cancelled":
      return "bg-gray-100 text-gray-600 border border-gray-200";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function exportToCSV() {
  if (filteredLeads.value.length === 0) {
    alert("No leads to export.");
    return;
  }

  const headers = [
    "Lead Number",
    "Customer Name",
    "Company Name",
    "Customer Type",
    "Phone",
    "Alternate Phone",
    "Email",
    "Address",
    "City",
    "State",
    "Pincode",
    "Stage",
    "Status",
    "Priority",
    "Estimated Value",
    "Monthly Rental",
    "Installation Charge",
    "Assigned Rep",
    "Expected Closure Date",
    "Created At",
  ];

  const rows = filteredLeads.value.map((l) => [
    l.lead_number,
    `"${(l.customer_info?.name || "").replace(/"/g, '""')}"`,
    `"${(l.customer_info?.company_name || "").replace(/"/g, '""')}"`,
    l.customer_info?.type || "",
    `"${l.customer_info?.phone || ""}"`,
    `"${l.customer_info?.alternate_phone || ""}"`,
    l.customer_info?.email || "",
    `"${(l.service_location?.address || "").replace(/"/g, '""')}"`,
    `"${(l.service_location?.city || "").replace(/"/g, '""')}"`,
    `"${(l.service_location?.state || "").replace(/"/g, '""')}"`,
    l.service_location?.pincode || "",
    l.current_stage,
    l.status,
    l.priority,
    l.commercial_details?.estimated_value || 0,
    l.commercial_details?.proposed_monthly_rental || 0,
    l.commercial_details?.proposed_installation_charge || 0,
    `"${(getAssignee(l)?.full_name || "Unassigned").replace(/"/g, '""')}"`,
    l.expected_closure_date || "",
    l.created_at,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `SPANCO_Leads_Export_${getLocalDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(async () => {
  await Promise.all([
    adminStore.fetchEmployees(),
    fetchLeads(),
  ]);
});
</script>
