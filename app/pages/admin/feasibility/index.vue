<template>
  <div class="space-y-6">
    <!-- ================= HEADER SECTION ================= -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-lg p-6 rounded-3xl border border-gray-200/70 shadow-xl">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800">
            Network Operations & Sales
          </span>
          <span class="text-xs text-gray-400">•</span>
          <span class="text-xs text-gray-500 font-medium">Administration Hub</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <UIcon name="i-heroicons-signal" class="w-5 h-5" />
          </div>
          <span>Feasibility Assessment Hub</span>
        </h1>
        <p class="text-xs text-gray-500 max-w-2xl leading-relaxed">
          Evaluate network reach, fiber/wireless routes, POP connectivity, CAPEX/OPEX viability, and dispatch technical review decisions for SPANCO leads.
        </p>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <button
          class="p-2.5 rounded-2xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all active:scale-95 shadow-xs"
          title="Refresh Data"
          :disabled="feasibilityStore.isLoading"
          @click="refreshData"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            :class="['w-4 h-4', feasibilityStore.isLoading ? 'animate-spin text-teal-600' : '']"
          />
        </button>

        <button
          class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold shadow-lg shadow-teal-500/25 active:scale-95 transition-all"
          @click="openNewRequestModal"
        >
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          <span>New Feasibility Request</span>
        </button>
      </div>
    </div>

    <!-- ================= METRIC KPI CARDS ================= -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      <!-- Card 1: Total Requests -->
      <div class="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-gray-200/70 shadow-sm space-y-1">
        <div class="flex items-center justify-between text-gray-400">
          <span class="text-[11px] font-bold uppercase tracking-wider">Total</span>
          <UIcon name="i-heroicons-clipboard-document-list" class="w-4 h-4 text-gray-400" />
        </div>
        <div class="text-2xl font-black text-gray-900 font-mono">
          {{ stats.total }}
        </div>
        <div class="text-[10px] text-gray-400">All submissions</div>
      </div>

      <!-- Card 2: Pending Triage -->
      <div class="bg-amber-50/60 backdrop-blur-md p-4 rounded-3xl border border-amber-200/70 shadow-sm space-y-1">
        <div class="flex items-center justify-between text-amber-600">
          <span class="text-[11px] font-bold uppercase tracking-wider">Pending</span>
          <UIcon name="i-heroicons-clock" class="w-4 h-4 text-amber-600" />
        </div>
        <div class="text-2xl font-black text-amber-900 font-mono">
          {{ stats.pending }}
        </div>
        <div class="text-[10px] text-amber-700 font-medium">Awaiting evaluation</div>
      </div>

      <!-- Card 3: Under Review -->
      <div class="bg-blue-50/60 backdrop-blur-md p-4 rounded-3xl border border-blue-200/70 shadow-sm space-y-1">
        <div class="flex items-center justify-between text-blue-600">
          <span class="text-[11px] font-bold uppercase tracking-wider">In Review</span>
          <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-blue-600" />
        </div>
        <div class="text-2xl font-black text-blue-900 font-mono">
          {{ stats.underReview }}
        </div>
        <div class="text-[10px] text-blue-700 font-medium">Route survey active</div>
      </div>

      <!-- Card 4: Feasible / Approved -->
      <div class="bg-emerald-50/60 backdrop-blur-md p-4 rounded-3xl border border-emerald-200/70 shadow-sm space-y-1">
        <div class="flex items-center justify-between text-emerald-600">
          <span class="text-[11px] font-bold uppercase tracking-wider">Approved</span>
          <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-emerald-600" />
        </div>
        <div class="text-2xl font-black text-emerald-900 font-mono">
          {{ stats.approved }}
        </div>
        <div class="text-[10px] text-emerald-700 font-semibold">{{ stats.approvalRate }}% feasibility rate</div>
      </div>

      <!-- Card 5: Rejected / Unfeasible -->
      <div class="bg-rose-50/60 backdrop-blur-md p-4 rounded-3xl border border-rose-200/70 shadow-sm space-y-1">
        <div class="flex items-center justify-between text-rose-600">
          <span class="text-[11px] font-bold uppercase tracking-wider">Rejected</span>
          <UIcon name="i-heroicons-x-circle" class="w-4 h-4 text-rose-600" />
        </div>
        <div class="text-2xl font-black text-rose-900 font-mono">
          {{ stats.rejected }}
        </div>
        <div class="text-[10px] text-rose-700 font-medium">Technical constraints</div>
      </div>

      <!-- Card 6: Total Pipeline CAPEX -->
      <div class="bg-gradient-to-br from-indigo-50 to-blue-50/80 p-4 rounded-3xl border border-indigo-200/70 shadow-sm space-y-1">
        <div class="flex items-center justify-between text-indigo-600">
          <span class="text-[11px] font-bold uppercase tracking-wider">Est. CAPEX</span>
          <UIcon name="i-heroicons-currency-rupee" class="w-4 h-4 text-indigo-600" />
        </div>
        <div class="text-lg sm:text-xl font-black text-indigo-950 font-mono truncate" :title="formatCurrency(stats.totalCapex)">
          {{ formatCurrency(stats.totalCapex) }}
        </div>
        <div class="text-[10px] text-indigo-700 truncate">Est. deployment cost</div>
      </div>
    </div>

    <!-- ================= VIEW TABS & FILTER BAR ================= -->
    <div class="bg-white/80 backdrop-blur-lg p-4 rounded-3xl border border-gray-200/70 shadow-xl space-y-4">
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <!-- View Mode Segmented Control -->
        <div class="inline-flex p-1 bg-gray-100 rounded-2xl shrink-0">
          <button
            type="button"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all',
              viewMode === 'pending'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            ]"
            @click="viewMode = 'pending'"
          >
            <UIcon name="i-heroicons-clock" class="w-4 h-4 text-amber-500" />
            <span>Pending Triage</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800">
              {{ stats.pending + stats.underReview }}
            </span>
          </button>

          <button
            type="button"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all',
              viewMode === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            ]"
            @click="viewMode = 'all'"
          >
            <UIcon name="i-heroicons-list-bullet" class="w-4 h-4 text-teal-600" />
            <span>All Requests</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-gray-200 text-gray-700">
              {{ stats.total }}
            </span>
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <UIcon
            name="i-heroicons-magnifying-glass"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by Request #, Lead #, Customer, City, Address..."
            class="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:border-teal-500 [color-scheme:light]"
          />
          <button
            v-if="searchQuery"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="searchQuery = ''"
          >
            <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Filter Controls Row -->
      <div class="flex flex-wrap items-center gap-2.5 pt-2 border-t border-gray-100 text-xs">
        <!-- Status Filter -->
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status:</span>
          <select
            v-model="selectedStatus"
            class="px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:border-teal-500 [color-scheme:light]"
          >
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Urgency Filter -->
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Urgency:</span>
          <select
            v-model="selectedUrgency"
            class="px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:border-teal-500 [color-scheme:light]"
          >
            <option value="ALL">All Urgencies</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>

        <!-- Service Type Filter -->
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Service:</span>
          <select
            v-model="selectedServiceType"
            class="px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:border-teal-500 [color-scheme:light]"
          >
            <option value="ALL">All Services</option>
            <option value="leased_line">Leased Line (ILL)</option>
            <option value="broadband">Broadband</option>
            <option value="partner">Partner Resale</option>
            <option value="bandwidth">Pure Bandwidth</option>
            <option value="fiber">Fiber Direct</option>
            <option value="wireless">Radio RF / Wireless</option>
            <option value="point_to_point">Point-to-Point (P2P)</option>
          </select>
        </div>

        <!-- Reset Button -->
        <button
          v-if="hasActiveFilters"
          class="ml-auto text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-teal-50 transition-colors"
          @click="resetFilters"
        >
          <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>

    <!-- ================= MAIN DATA TABLE ================= -->
    <div class="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/70 shadow-xl overflow-hidden">
      <!-- Loading State -->
      <div v-if="feasibilityStore.isLoading && displayedRequests.length === 0" class="p-16 flex flex-col items-center justify-center text-center">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-teal-600 animate-spin mb-3" />
        <p class="text-sm font-bold text-gray-800">Loading Feasibility Records...</p>
        <p class="text-xs text-gray-500">Querying Supabase feasibility and linked lead profiles</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="displayedRequests.length === 0" class="p-16 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
          <UIcon name="i-heroicons-signal-slash" class="w-8 h-8" />
        </div>
        <h3 class="text-sm font-bold text-gray-900 mb-1">No Feasibility Requests Found</h3>
        <p class="text-xs text-gray-500 max-w-sm mb-4">
          {{ viewMode === 'pending' ? 'All requests have been evaluated! There are currently no pending triage tasks.' : 'No records match your selected filter criteria or search query.' }}
        </p>
        <button
          class="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-all shadow-md active:scale-95"
          @click="openNewRequestModal"
        >
          Create New Request
        </button>
      </div>

      <!-- Table View -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50/80 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
              <th class="py-3 px-4">Request # & Date</th>
              <th class="py-3 px-4">Customer / Lead</th>
              <th class="py-3 px-4">Service Location</th>
              <th class="py-3 px-4">Requirements</th>
              <th class="py-3 px-4">Route Feasibility</th>
              <th class="py-3 px-4">Status & Decision</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="req in paginatedRequests"
              :key="req.id"
              class="hover:bg-teal-50/20 transition-colors group cursor-pointer"
              @click="openDetailDrawer(req)"
            >
              <!-- Request # & Date -->
              <td class="py-3.5 px-4">
                <div class="space-y-0.5">
                  <span class="font-mono font-bold text-gray-900 group-hover:text-teal-700 transition-colors block">
                    {{ req.request_number || `FR-${req.id}` }}
                  </span>
                  <span class="text-[11px] text-gray-500 block">
                    {{ formatDate(req.created_at) }}
                  </span>
                </div>
              </td>

              <!-- Customer & Lead -->
              <td class="py-3.5 px-4">
                <div class="space-y-1">
                  <div class="font-bold text-gray-900 truncate max-w-[200px]" :title="req.lead?.customer_name || 'Direct Request'">
                    {{ req.lead?.customer_name || 'Direct Request' }}
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span
                      v-if="req.lead?.lead_number"
                      class="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                    >
                      #{{ req.lead.lead_number }}
                    </span>
                    <span
                      v-if="req.lead?.company_name"
                      class="text-[11px] text-gray-500 truncate max-w-[130px]"
                      :title="req.lead.company_name"
                    >
                      {{ req.lead.company_name }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Location -->
              <td class="py-3.5 px-4">
                <div class="space-y-1 max-w-[220px]">
                  <div class="flex items-center gap-1 text-gray-900 font-semibold truncate">
                    <UIcon name="i-heroicons-map-pin" class="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{{ req.service_location?.city || 'N/A' }}</span>
                    <span v-if="req.service_location?.state" class="text-gray-400 font-normal">({{ req.service_location.state }})</span>
                  </div>
                  <div class="text-[11px] text-gray-500 truncate" :title="req.service_location?.address">
                    {{ req.service_location?.address }}
                  </div>
                </div>
              </td>

              <!-- Requirements -->
              <td class="py-3.5 px-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded-full font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {{ getServiceTypeLabel(req.service_requirements?.connection_type) }}
                    </span>
                    <span
                      v-if="req.service_requirements?.bandwidth"
                      class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-700"
                    >
                      {{ req.service_requirements.bandwidth }}
                    </span>
                  </div>
                  <span
                    :class="[
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                      getUrgencyClass(req.service_requirements?.urgency)
                    ]"
                  >
                    <UIcon :name="getUrgencyIcon(req.service_requirements?.urgency)" class="w-3 h-3" />
                    {{ req.service_requirements?.urgency || 'Normal' }}
                  </span>
                </div>
              </td>

              <!-- Route Feasibility Status -->
              <td class="py-3.5 px-4">
                <div class="space-y-1">
                  <!-- Primary Route -->
                  <div class="flex items-center gap-1.5 text-[11px]">
                    <span class="text-gray-400 font-medium">Primary:</span>
                    <span
                      v-if="req.primary_route"
                      :class="[
                        'inline-flex items-center gap-1 font-bold',
                        req.primary_route.is_feasible ? 'text-emerald-700' : 'text-rose-600'
                      ]"
                    >
                      <UIcon
                        :name="req.primary_route.is_feasible ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                        class="w-3.5 h-3.5"
                      />
                      <span>{{ req.primary_route.is_feasible ? 'Feasible' : 'Unfeasible' }}</span>
                      <span v-if="req.primary_route.distance_km" class="text-[10px] text-gray-400 font-normal">
                        ({{ req.primary_route.distance_km }} km)
                      </span>
                    </span>
                    <span v-else class="text-gray-400 italic text-[10px]">Not Evaluated</span>
                  </div>

                  <!-- Secondary Route (if present) -->
                  <div v-if="req.secondary_route" class="flex items-center gap-1.5 text-[11px]">
                    <span class="text-gray-400 font-medium">Backup:</span>
                    <span
                      :class="[
                        'inline-flex items-center gap-1 font-bold',
                        req.secondary_route.is_feasible ? 'text-emerald-700' : 'text-rose-600'
                      ]"
                    >
                      <UIcon
                        :name="req.secondary_route.is_feasible ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                        class="w-3.5 h-3.5"
                      />
                      <span>{{ req.secondary_route.is_feasible ? 'Feasible' : 'Unfeasible' }}</span>
                    </span>
                  </div>
                </div>
              </td>

              <!-- Status & Decision -->
              <td class="py-3.5 px-4">
                <div class="space-y-1">
                  <span
                    :class="[
                      'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5',
                      getStatusBadgeClass(req.status)
                    ]"
                  >
                    <UIcon :name="getStatusIcon(req.status)" class="w-3.5 h-3.5" />
                    {{ getStatusLabel(req.status) }}
                  </span>

                  <div v-if="req.reviewed_by && req.reviewer_profile" class="text-[10px] text-gray-500">
                    by {{ req.reviewer_profile.full_name }}
                  </div>
                </div>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1.5">
                  <!-- Inspect Button -->
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-teal-100 text-gray-600 hover:text-teal-700 transition-colors"
                    title="Inspect Request Details"
                    @click="openDetailDrawer(req)"
                  >
                    <UIcon name="i-heroicons-eye" class="w-4 h-4" />
                  </button>

                  <!-- Review / Evaluate Button -->
                  <button
                    class="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white transition-all shadow-xs"
                    title="Review & Technical Assessment"
                    @click="openReviewModal(req)"
                  >
                    <UIcon name="i-heroicons-document-check" class="w-4 h-4" />
                  </button>

                  <!-- Cancel Button (if pending) -->
                  <button
                    v-if="req.status === 'pending' || req.status === 'under_review'"
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-100 text-gray-600 hover:text-rose-700 transition-colors"
                    title="Cancel Request"
                    @click="confirmCancelRequest(req)"
                  >
                    <UIcon name="i-heroicons-no-symbol" class="w-4 h-4" />
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
          <span class="font-bold text-gray-900">{{ displayedRequests.length }}</span> entries
        </div>

        <div class="flex items-center gap-1.5">
          <button
            class="px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            Previous
          </button>
          <span class="px-2 font-mono font-bold text-gray-700">
            Page {{ currentPage }} / {{ totalPages || 1 }}
          </span>
          <button
            class="px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- ================= SLIDE-OVER DETAIL DRAWER ================= -->
    <div
      v-if="isDetailDrawerOpen && activeRequest"
      class="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end transition-opacity"
      @click.self="isDetailDrawerOpen = false"
    >
      <div class="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-300">
        <!-- Drawer Header -->
        <div class="p-6 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between shrink-0">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-mono font-black text-sm text-gray-900">
                {{ activeRequest.request_number || `FR-${activeRequest.id}` }}
              </span>
              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                  getStatusBadgeClass(activeRequest.status)
                ]"
              >
                {{ getStatusLabel(activeRequest.status) }}
              </span>
            </div>
            <p class="text-xs text-gray-500">
              Submitted {{ formatDateTime(activeRequest.created_at) }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              @click="openReviewModal(activeRequest)"
            >
              <UIcon name="i-heroicons-document-check" class="w-4 h-4" />
              <span>Evaluate</span>
            </button>
            <button
              class="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              @click="isDetailDrawerOpen = false"
            >
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Drawer Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Lead / Customer Summary Card -->
          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-gray-500">Customer & Pipeline Lead</span>
              <span
                v-if="activeRequest.lead?.lead_number"
                class="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-100 text-amber-800"
              >
                Lead #{{ activeRequest.lead.lead_number }}
              </span>
            </div>
            <div class="text-base font-bold text-gray-900">
              {{ activeRequest.lead?.customer_name || 'Direct Lead Request' }}
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div v-if="activeRequest.lead?.company_name">
                <span class="text-gray-400 block text-[10px]">Company:</span>
                <span class="font-medium text-gray-800">{{ activeRequest.lead.company_name }}</span>
              </div>
              <div v-if="activeRequest.lead?.phone">
                <span class="text-gray-400 block text-[10px]">Phone:</span>
                <span class="font-medium text-gray-800">{{ activeRequest.lead.phone }}</span>
              </div>
            </div>
          </div>

          <!-- Section 1: Location & Coordinates -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-rose-500" />
              <span>Service Location</span>
            </h4>
            <div class="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
              <div class="text-xs font-medium text-gray-800 leading-relaxed">
                {{ activeRequest.service_location?.address }}
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span class="text-[10px] text-gray-400 block">City</span>
                  <span class="font-bold text-gray-900">{{ activeRequest.service_location?.city || '—' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-gray-400 block">State</span>
                  <span class="font-bold text-gray-900">{{ activeRequest.service_location?.state || '—' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-gray-400 block">Pincode</span>
                  <span class="font-bold text-gray-900">{{ activeRequest.service_location?.pincode || '—' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-gray-400 block">Landmark</span>
                  <span class="font-bold text-gray-900">{{ activeRequest.service_location?.landmark || '—' }}</span>
                </div>
              </div>

              <!-- Google Maps Link if coordinates available -->
              <div
                v-if="activeRequest.service_location?.latitude && activeRequest.service_location?.longitude"
                class="pt-2 border-t border-gray-100 flex items-center justify-between"
              >
                <div class="text-[11px] font-mono text-gray-500">
                  {{ activeRequest.service_location.latitude }}, {{ activeRequest.service_location.longitude }}
                </div>
                <a
                  :href="`https://www.google.com/maps?q=${activeRequest.service_location.latitude},${activeRequest.service_location.longitude}`"
                  target="_blank"
                  class="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline"
                >
                  <UIcon name="i-heroicons-map" class="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Section 2: Service Requirements -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-indigo-500" />
              <span>Service Requirements</span>
            </h4>
            <div class="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span class="text-[10px] text-gray-400 block">Connection Type</span>
                <span class="font-bold text-indigo-700">
                  {{ getServiceTypeLabel(activeRequest.service_requirements?.connection_type) }}
                </span>
              </div>
              <div>
                <span class="text-[10px] text-gray-400 block">Required Bandwidth</span>
                <span class="font-bold font-mono text-gray-900">
                  {{ activeRequest.service_requirements?.bandwidth || 'N/A' }}
                </span>
              </div>
              <div>
                <span class="text-[10px] text-gray-400 block">Urgency / Priority</span>
                <span class="font-bold text-gray-900 capitalize">
                  {{ activeRequest.service_requirements?.urgency }} / {{ activeRequest.service_requirements?.priority }}
                </span>
              </div>
              <div>
                <span class="text-[10px] text-gray-400 block">Static IP</span>
                <span class="font-medium text-gray-800">
                  {{ activeRequest.service_requirements?.static_ip_required ? `${activeRequest.service_requirements.static_ip_count || 1} IP(s)` : 'Not Required' }}
                </span>
              </div>
              <div>
                <span class="text-[10px] text-gray-400 block">IPv6 Support</span>
                <span class="font-medium text-gray-800">
                  {{ activeRequest.service_requirements?.ipv6_required ? 'Required' : 'Standard IPv4' }}
                </span>
              </div>
              <div>
                <span class="text-[10px] text-gray-400 block">Feasibility Type</span>
                <span class="font-medium text-gray-800 capitalize">
                  {{ activeRequest.service_requirements?.feasibility_type || 'Technical' }}
                </span>
              </div>
            </div>

            <div v-if="activeRequest.service_requirements?.special_conditions" class="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
              <span class="font-bold text-amber-800 block text-[10px] uppercase">Special Client Conditions:</span>
              <p class="text-amber-900 mt-0.5">{{ activeRequest.service_requirements.special_conditions }}</p>
            </div>
          </div>

          <!-- Section 3: Primary Connectivity Route -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4 text-teal-600" />
              <span>Primary Route Assessment</span>
            </h4>

            <div v-if="activeRequest.primary_route" class="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-gray-900">
                  {{ activeRequest.primary_route.route_name || 'Route 1' }}
                </span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    activeRequest.primary_route.is_feasible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  ]"
                >
                  {{ activeRequest.primary_route.is_feasible ? 'Feasible' : 'Not Feasible' }}
                </span>
              </div>

              <!-- Route Specs -->
              <div v-if="activeRequest.primary_route.is_feasible" class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span class="text-[10px] text-gray-400 block">POP / Node</span>
                  <span class="font-bold text-gray-800">{{ activeRequest.primary_route.source_node_name || '—' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-gray-400 block">Distance (km)</span>
                  <span class="font-bold font-mono text-gray-800">{{ activeRequest.primary_route.distance_km || '—' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-gray-400 block">Fiber Length (m)</span>
                  <span class="font-bold font-mono text-gray-800">{{ activeRequest.primary_route.total_fiber_length_mtr || '—' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-gray-400 block">Right of Way (ROW)</span>
                  <span class="font-bold text-gray-800">{{ activeRequest.primary_route.requires_row ? 'Required' : 'Not Required' }}</span>
                </div>
              </div>

              <!-- Cost breakdown table if items exist -->
              <div v-if="activeRequest.primary_route.cost_items && activeRequest.primary_route.cost_items.length > 0" class="pt-2 border-t border-gray-100 space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-gray-500">Route Cost Breakdown</span>
                <div class="overflow-x-auto">
                  <table class="w-full text-[11px] text-left">
                    <thead class="bg-gray-50 text-gray-600 font-semibold">
                      <tr>
                        <th class="py-1 px-2">Item</th>
                        <th class="py-1 px-2">Category</th>
                        <th class="py-1 px-2 text-right">Qty</th>
                        <th class="py-1 px-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="(item, idx) in activeRequest.primary_route.cost_items" :key="idx">
                        <td class="py-1 px-2 font-medium">{{ item.item_description || item.name || item.item_code }}</td>
                        <td class="py-1 px-2 text-gray-500">{{ item.category }}</td>
                        <td class="py-1 px-2 text-right font-mono">{{ item.quantity }} {{ item.uom || item.unit }}</td>
                        <td class="py-1 px-2 text-right font-mono font-bold">{{ formatCurrency(item.total_cost) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="flex items-center justify-between text-xs font-bold pt-1 border-t border-gray-200">
                  <span>Total Route CAPEX</span>
                  <span class="font-mono text-teal-700">{{ formatCurrency(activeRequest.primary_route.total_capex || 0) }}</span>
                </div>
              </div>

              <!-- Not feasible reason -->
              <div v-else-if="!activeRequest.primary_route.is_feasible" class="p-3 rounded-xl bg-rose-50 text-xs text-rose-800">
                <span class="font-bold block text-[10px] uppercase">Constraint / Reason:</span>
                <p>{{ activeRequest.primary_route.reason || activeRequest.primary_route.remarks || 'Technical limitation' }}</p>
              </div>
            </div>
            <div v-else class="p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-300 text-center text-xs text-gray-400">
              Primary connectivity route has not been evaluated yet.
            </div>
          </div>

          <!-- Section 3b: Secondary Route (if present) -->
          <div v-if="activeRequest.secondary_route" class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-4 h-4 text-purple-600" />
              <span>Secondary Route (Backup Redundancy)</span>
            </h4>

            <div class="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-gray-900">
                  {{ activeRequest.secondary_route.route_name || 'Secondary Route' }}
                </span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    activeRequest.secondary_route.is_feasible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  ]"
                >
                  {{ activeRequest.secondary_route.is_feasible ? 'Feasible' : 'Not Feasible' }}
                </span>
              </div>

              <div v-if="activeRequest.secondary_route.is_feasible" class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span class="text-[10px] text-gray-400 block">POP / Node</span>
                  <span class="font-bold text-gray-800">{{ activeRequest.secondary_route.source_node_name || '—' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-gray-400 block">Distance (km)</span>
                  <span class="font-bold font-mono text-gray-800">{{ activeRequest.secondary_route.distance_km || '—' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-gray-400 block">Fiber Length (m)</span>
                  <span class="font-bold font-mono text-gray-800">{{ activeRequest.secondary_route.total_fiber_length_mtr || '—' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-gray-400 block">Right of Way</span>
                  <span class="font-bold text-gray-800">{{ activeRequest.secondary_route.requires_row ? 'Required' : 'Not Required' }}</span>
                </div>
              </div>

              <!-- Cost breakdown table if items exist -->
              <div v-if="activeRequest.secondary_route.cost_items && activeRequest.secondary_route.cost_items.length > 0" class="pt-2 border-t border-gray-100 space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-gray-500">Route Cost Breakdown</span>
                <div class="overflow-x-auto">
                  <table class="w-full text-[11px] text-left">
                    <thead class="bg-gray-50 text-gray-600 font-semibold">
                      <tr>
                        <th class="py-1 px-2">Item</th>
                        <th class="py-1 px-2">Category</th>
                        <th class="py-1 px-2 text-right">Qty</th>
                        <th class="py-1 px-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="(item, idx) in activeRequest.secondary_route.cost_items" :key="idx">
                        <td class="py-1 px-2 font-medium">{{ item.item_description || item.name || item.item_code }}</td>
                        <td class="py-1 px-2 text-gray-500">{{ item.category }}</td>
                        <td class="py-1 px-2 text-right font-mono">{{ item.quantity }} {{ item.uom || item.unit }}</td>
                        <td class="py-1 px-2 text-right font-mono font-bold">{{ formatCurrency(item.total_cost) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="flex items-center justify-between text-xs font-bold pt-1 border-t border-gray-200">
                  <span>Total Route CAPEX</span>
                  <span class="font-mono text-purple-700">{{ formatCurrency(activeRequest.secondary_route.total_capex || 0) }}</span>
                </div>
              </div>

              <div v-else-if="!activeRequest.secondary_route.is_feasible" class="p-3 rounded-xl bg-rose-50 text-xs text-rose-800">
                <span class="font-bold block text-[10px] uppercase">Constraint / Reason:</span>
                <p>{{ activeRequest.secondary_route.reason || activeRequest.secondary_route.remarks || 'Technical limitation' }}</p>
              </div>
            </div>
          </div>

          <!-- Section 3c: Site Survey (if present) -->
          <div v-if="activeRequest.site_survey" class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <UIcon name="i-heroicons-clipboard-document-check" class="w-4 h-4 text-cyan-600" />
              <span>Site Survey Report</span>
            </h4>

            <div class="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-xs text-gray-900">
                    {{ activeRequest.site_survey.surveyor_name || activeRequest.site_survey.conducted_by || 'Field Survey' }}
                  </span>
                  <span v-if="activeRequest.site_survey.survey_date" class="text-[10px] text-gray-500">
                    ({{ formatDate(activeRequest.site_survey.survey_date) }})
                  </span>
                </div>
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    activeRequest.site_survey.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  ]"
                >
                  {{ activeRequest.site_survey.completed ? 'Completed' : 'Pending' }}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-2 text-xs">
                <div class="p-2 rounded-xl bg-gray-50">
                  <span class="text-[10px] text-gray-400 block">Site Accessible</span>
                  <span class="font-bold text-gray-800">{{ activeRequest.site_survey.site_accessible !== false ? 'Yes' : 'No' }}</span>
                </div>
                <div class="p-2 rounded-xl bg-gray-50">
                  <span class="text-[10px] text-gray-400 block">Power Available</span>
                  <span class="font-bold text-gray-800">{{ activeRequest.site_survey.power_available !== false ? 'Yes' : 'No' }}</span>
                </div>
                <div class="p-2 rounded-xl bg-gray-50">
                  <span class="text-[10px] text-gray-400 block">Rack Space</span>
                  <span class="font-bold text-gray-800">{{ activeRequest.site_survey.indoor_space_available !== false ? 'Yes' : 'No' }}</span>
                </div>
              </div>

              <div v-if="activeRequest.site_survey.findings" class="pt-2 border-t border-gray-100 text-xs">
                <span class="font-bold text-gray-700 block text-[10px] uppercase">Survey Findings:</span>
                <p class="text-gray-800 mt-0.5 whitespace-pre-line">{{ activeRequest.site_survey.findings }}</p>
              </div>

              <div v-if="activeRequest.site_survey.recommendations" class="pt-2 border-t border-gray-100 text-xs">
                <span class="font-bold text-gray-700 block text-[10px] uppercase">Engineering Recommendations:</span>
                <p class="text-gray-800 mt-0.5 whitespace-pre-line">{{ activeRequest.site_survey.recommendations }}</p>
              </div>
            </div>
          </div>

          <!-- Section 4: Commercial & OPEX Assessment -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <UIcon name="i-heroicons-banknotes" class="w-4 h-4 text-emerald-600" />
              <span>Commercial & Operational Cost Assessment</span>
            </h4>
            <div class="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span class="text-[10px] text-gray-400 block">Total Est. CAPEX</span>
                  <span class="text-sm font-black font-mono text-teal-800">
                    {{ formatCurrency(activeRequest.estimated_capex || 0) }}
                  </span>
                </div>
                <div>
                  <span class="text-[10px] text-gray-400 block">Monthly OPEX</span>
                  <span class="text-sm font-black font-mono text-orange-800">
                    {{ formatCurrency(activeRequest.estimated_opex || 0) }}/mo
                  </span>
                </div>
                <div>
                  <span class="text-[10px] text-gray-400 block">Commercial Viability</span>
                  <span
                    :class="[
                      'font-bold inline-block text-xs',
                      activeRequest.is_commercially_viable ? 'text-emerald-700' : 'text-gray-500'
                    ]"
                  >
                    {{ activeRequest.is_commercially_viable ? 'Viable Business Case' : 'Under Assessment' }}
                  </span>
                </div>
              </div>

              <!-- OPEX items list if any -->
              <div v-if="activeRequest.operational_costs && activeRequest.operational_costs.length > 0" class="pt-2 border-t border-gray-100 space-y-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-gray-500">Monthly OPEX Breakdown</span>
                <div class="space-y-1">
                  <div
                    v-for="(cost, cIdx) in activeRequest.operational_costs"
                    :key="cIdx"
                    class="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50"
                  >
                    <div>
                      <span class="font-medium text-gray-800">{{ cost.description }}</span>
                      <span class="text-[10px] text-gray-400 ml-1.5">({{ cost.category }})</span>
                    </div>
                    <span class="font-mono font-bold text-gray-900">{{ formatCurrency(cost.monthly_cost) }}/mo</span>
                  </div>
                </div>
              </div>

              <div v-if="activeRequest.feasibility_remarks" class="pt-2 border-t border-gray-100 text-xs">
                <span class="font-bold text-gray-700 block text-[10px] uppercase">Manager Remarks & Technical Findings:</span>
                <p class="text-gray-800 mt-1 whitespace-pre-line">{{ activeRequest.feasibility_remarks }}</p>
              </div>
            </div>
          </div>

          <!-- Section 5: Timeline History -->
          <div v-if="activeRequest.status_history && activeRequest.status_history.length > 0" class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <UIcon name="i-heroicons-clock" class="w-4 h-4 text-gray-500" />
              <span>Status Audit Trail</span>
            </h4>
            <div class="space-y-2">
              <div
                v-for="(hist, hIdx) in activeRequest.status_history"
                :key="hIdx"
                class="p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-xs space-y-1"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-gray-900 capitalize">{{ hist.event || hist.status }}</span>
                  <span class="text-[10px] text-gray-400">{{ formatDateTime(hist.timestamp) }}</span>
                </div>
                <p class="text-gray-600 text-[11px]">{{ hist.note }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= REVIEW & EVALUATION MODAL ================= -->
    <div
      v-if="isReviewModalOpen && reviewTargetReq"
      class="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="relative w-full max-w-4xl bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[92vh]">
        <!-- Modal Header -->
        <div class="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-document-check" class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-black text-gray-900">
                  Feasibility Review & Route Evaluation
                </h3>
                <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  {{ reviewTargetReq.request_number || `FR-${reviewTargetReq.id}` }}
                </span>
              </div>
              <p class="text-xs text-gray-500">
                {{ reviewTargetReq.lead?.customer_name || 'Client' }} • {{ reviewTargetReq.service_location?.city }} ({{ getServiceTypeLabel(reviewTargetReq.service_requirements?.connection_type) }} - {{ reviewTargetReq.service_requirements?.bandwidth }})
              </p>
            </div>
          </div>

          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isReviewModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Review Tabs -->
        <div class="px-6 pt-3 border-b border-gray-200 bg-white flex gap-4 text-xs font-bold shrink-0 overflow-x-auto">
          <button
            type="button"
            :class="[
              'pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap',
              reviewTab === 'routes' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-900'
            ]"
            @click="reviewTab = 'routes'"
          >
            <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4" />
            <span>Routes & CAPEX</span>
            <span v-if="reviewForm.hasSecondaryRoute" class="px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded-full text-[9px]">Dual</span>
          </button>

          <button
            type="button"
            :class="[
              'pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap',
              reviewTab === 'survey' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-900'
            ]"
            @click="reviewTab = 'survey'"
          >
            <UIcon name="i-heroicons-clipboard-document-check" class="w-4 h-4" />
            <span>Site Survey</span>
            <span v-if="reviewForm.siteSurvey.required" class="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
          </button>

          <button
            type="button"
            :class="[
              'pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap',
              reviewTab === 'opex' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-900'
            ]"
            @click="reviewTab = 'opex'"
          >
            <UIcon name="i-heroicons-banknotes" class="w-4 h-4" />
            <span>Monthly OPEX</span>
            <span v-if="reviewForm.operationalCosts.length > 0" class="px-1.5 py-0.2 bg-orange-100 text-orange-700 rounded-full text-[9px]">{{ reviewForm.operationalCosts.length }}</span>
          </button>

          <button
            type="button"
            :class="[
              'pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap',
              reviewTab === 'decision' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-900'
            ]"
            @click="reviewTab = 'decision'"
          >
            <UIcon name="i-heroicons-check-badge" class="w-4 h-4" />
            <span>Commercial & Decision</span>
          </button>
        </div>

        <!-- Modal Form Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- TAB 1: CONNECTIVITY ROUTES (PRIMARY & SECONDARY) -->
          <div v-show="reviewTab === 'routes'" class="space-y-6">
            <!-- 1. PRIMARY ROUTE (REQUIRED) -->
            <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div class="flex items-center justify-between border-b border-gray-100 pb-3">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">1</span>
                  <div>
                    <h4 class="text-xs font-bold text-gray-900">Primary Connectivity Route *</h4>
                    <span class="text-[11px] text-gray-500">Main backbone link connecting customer premises to network POP</span>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    :class="[
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                      reviewForm.primaryRoute.isFeasible ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600'
                    ]"
                    @click="reviewForm.primaryRoute.isFeasible = true"
                  >
                    Feasible
                  </button>
                  <button
                    type="button"
                    :class="[
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                      !reviewForm.primaryRoute.isFeasible ? 'bg-rose-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600'
                    ]"
                    @click="reviewForm.primaryRoute.isFeasible = false"
                  >
                    Unfeasible
                  </button>
                </div>
              </div>

              <!-- If Primary Route is Feasible: Enter Specs -->
              <div v-if="reviewForm.primaryRoute.isFeasible" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold text-gray-700">Route Name *</label>
                    <input
                      v-model="reviewForm.primaryRoute.routeName"
                      type="text"
                      placeholder="e.g. Primary Fiber via Badarpur POP"
                      class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-teal-500 [color-scheme:light]"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold text-gray-700">Source POP / Node *</label>
                    <input
                      v-model="reviewForm.primaryRoute.sourceNodeName"
                      type="text"
                      placeholder="e.g. TKD POP, Switch 04"
                      class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-teal-500 [color-scheme:light]"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold text-gray-700">Technology *</label>
                    <select
                      v-model="reviewForm.primaryRoute.technology"
                      class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-teal-500 [color-scheme:light]"
                    >
                      <option value="Fiber (Direct Core)">Fiber (Direct Core)</option>
                      <option value="Fiber (GPON)">Fiber (GPON)</option>
                      <option value="Wireless RF (5GHz)">Wireless RF (5GHz)</option>
                      <option value="Microwave Backhaul">Microwave Backhaul</option>
                      <option value="Hybrid (Fiber + RF)">Hybrid (Fiber + RF)</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold text-gray-700">Distance (km) *</label>
                    <input
                      v-model.number="reviewForm.primaryRoute.distanceKm"
                      type="number"
                      step="0.01"
                      placeholder="2.5"
                      class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:bg-white focus:outline-none focus:border-teal-500 [color-scheme:light]"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold text-gray-700">Total Fiber Length (meters)</label>
                    <input
                      v-model.number="reviewForm.primaryRoute.fiberLengthMtr"
                      type="number"
                      placeholder="2500"
                      class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:bg-white focus:outline-none focus:border-teal-500 [color-scheme:light]"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold text-gray-700">Installation Days</label>
                    <input
                      v-model.number="reviewForm.primaryRoute.installationDays"
                      type="number"
                      placeholder="3"
                      class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:bg-white focus:outline-none focus:border-teal-500 [color-scheme:light]"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label class="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer select-none">
                    <input
                      v-model="reviewForm.primaryRoute.infrastructureAvailable"
                      type="checkbox"
                      class="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 [color-scheme:light]"
                    />
                    <div>
                      <span class="text-xs font-bold text-gray-800 block">Infrastructure Available</span>
                      <span class="text-[10px] text-gray-500">Poles, ducts, or line-of-sight ready for deployment</span>
                    </div>
                  </label>

                  <label class="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer select-none">
                    <input
                      v-model="reviewForm.primaryRoute.requiresRow"
                      type="checkbox"
                      class="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 [color-scheme:light]"
                    />
                    <div>
                      <span class="text-xs font-bold text-gray-800 block">Requires Right of Way (ROW)</span>
                      <span class="text-[10px] text-gray-500">Municipal, highway, or landlord permissions required</span>
                    </div>
                  </label>
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-gray-700">Route Notes & Engineering Remarks (Optional)</label>
                  <input
                    v-model="reviewForm.primaryRoute.remarks"
                    type="text"
                    placeholder="e.g. Splicing required at Chamber #4, Aerial installation on existing poles"
                    class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-teal-500 [color-scheme:light]"
                  />
                </div>

                <!-- Primary Route Cost Breakdown Items -->
                <div class="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-xs font-bold text-gray-900 block">Primary Route Cost Items (CAPEX)</span>
                      <span class="text-[10px] text-gray-500">Bill of materials (BOM), optical fibers, accessories, and labor</span>
                    </div>
                    <button
                      type="button"
                      class="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-teal-700 shadow-xs"
                      @click="addCostItem('primary')"
                    >
                      <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div v-if="reviewForm.primaryRoute.costItems.length === 0" class="text-xs text-gray-400 italic text-center py-2">
                    No cost items added yet. Click "+ Add Item" to specify materials (e.g. 6-Core OFC, SFP module, ONU/ONT).
                  </div>

                  <div v-else class="space-y-2">
                    <div
                      v-for="(item, idx) in reviewForm.primaryRoute.costItems"
                      :key="idx"
                      class="p-2.5 rounded-xl bg-white border border-gray-200 grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div class="col-span-2">
                        <input
                          v-model="item.item_code"
                          type="text"
                          placeholder="Code (e.g. FBR-6F)"
                          class="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none [color-scheme:light]"
                        />
                      </div>
                      <div class="col-span-3">
                        <input
                          v-model="item.item_description"
                          type="text"
                          placeholder="Description *"
                          class="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none [color-scheme:light]"
                        />
                      </div>
                      <div class="col-span-2">
                        <select
                          v-model="item.category"
                          class="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none [color-scheme:light]"
                        >
                          <option value="Consumable Capex">Consumable</option>
                          <option value="Recoverable Capex">Recoverable</option>
                        </select>
                      </div>
                      <div class="col-span-1">
                        <select
                          v-model="item.uom"
                          class="w-full px-1.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px] focus:bg-white focus:outline-none [color-scheme:light]"
                        >
                          <option value="Mtr">Mtr</option>
                          <option value="Nos">Nos</option>
                          <option value="Roll">Roll</option>
                          <option value="Day">Day</option>
                          <option value="Hour">Hour</option>
                          <option value="Lump Sum">Lump</option>
                        </select>
                      </div>
                      <div class="col-span-1">
                        <input
                          v-model.number="item.quantity"
                          type="number"
                          placeholder="Qty"
                          class="w-full px-1.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono text-right focus:bg-white focus:outline-none [color-scheme:light]"
                          @input="recalcCostItem(item)"
                        />
                      </div>
                      <div class="col-span-1">
                        <input
                          v-model.number="item.unit_price"
                          type="number"
                          placeholder="Rate"
                          class="w-full px-1.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono text-right focus:bg-white focus:outline-none [color-scheme:light]"
                          @input="recalcCostItem(item)"
                        />
                      </div>
                      <div class="col-span-1 text-right font-mono font-bold text-gray-900 truncate">
                        {{ formatCurrency(item.total_cost || 0) }}
                      </div>
                      <div class="col-span-1 text-right">
                        <button
                          type="button"
                          class="p-1 rounded text-rose-500 hover:bg-rose-50"
                          @click="removeCostItem('primary', idx)"
                        >
                          <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Route CAPEX Totals -->
                  <div class="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-4 text-gray-600">
                      <span>Consumable: <b class="font-mono text-gray-900">{{ formatCurrency(getRouteConsumableCapex(reviewForm.primaryRoute)) }}</b></span>
                      <span>Recoverable: <b class="font-mono text-gray-900">{{ formatCurrency(getRouteRecoverableCapex(reviewForm.primaryRoute)) }}</b></span>
                    </div>
                    <div class="font-bold">
                      <span class="text-gray-700">Primary Route CAPEX: </span>
                      <span class="font-mono text-teal-800 text-sm">{{ formatCurrency(getRouteTotalCapex(reviewForm.primaryRoute)) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- If Primary Route is NOT Feasible -->
              <div v-else class="space-y-3 p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                <label class="text-xs font-bold text-rose-900 block">Technical Constraint / Rejection Reason *</label>
                <input
                  v-model="reviewForm.primaryRoute.unfeasibleReason"
                  type="text"
                  placeholder="e.g. Distance exceeds maximum GPON optical power budget (> 15km) without repeater..."
                  class="w-full px-3 py-2 rounded-xl bg-white border border-rose-300 text-xs text-gray-900 focus:outline-none focus:border-rose-500"
                />
                <textarea
                  v-model="reviewForm.primaryRoute.unfeasibleRemarks"
                  rows="2"
                  placeholder="Additional remarks or engineering observations (optional)..."
                  class="w-full p-2.5 rounded-xl bg-white border border-rose-200 text-xs text-gray-900 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <!-- 2. SECONDARY ROUTE (OPTIONAL REDUNDANCY) -->
            <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div class="flex items-center justify-between border-b border-gray-100 pb-3">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center">2</span>
                  <div>
                    <h4 class="text-xs font-bold text-gray-900">Secondary Connectivity Route (Optional)</h4>
                    <span class="text-[11px] text-gray-500">Backup or failover link providing 1+1 network redundancy</span>
                  </div>
                </div>

                <label class="relative inline-flex items-center cursor-pointer">
                  <input v-model="reviewForm.hasSecondaryRoute" type="checkbox" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                </label>
              </div>

              <div v-if="reviewForm.hasSecondaryRoute" class="space-y-4">
                <!-- Secondary Route Feasibility Toggle -->
                <div class="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                  <span class="text-xs font-bold text-purple-900">Is Secondary Route Feasible?</span>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      :class="[
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                        reviewForm.secondaryRoute.isFeasible ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600'
                      ]"
                      @click="reviewForm.secondaryRoute.isFeasible = true"
                    >
                      Feasible
                    </button>
                    <button
                      type="button"
                      :class="[
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                        !reviewForm.secondaryRoute.isFeasible ? 'bg-rose-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600'
                      ]"
                      @click="reviewForm.secondaryRoute.isFeasible = false"
                    >
                      Unfeasible
                    </button>
                  </div>
                </div>

                <!-- Secondary Route Specs -->
                <div v-if="reviewForm.secondaryRoute.isFeasible" class="space-y-4">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="space-y-1">
                      <label class="text-[11px] font-bold text-gray-700">Route Name *</label>
                      <input
                        v-model="reviewForm.secondaryRoute.routeName"
                        type="text"
                        placeholder="e.g. Backup Wireless RF via Tower B"
                        class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-purple-500 [color-scheme:light]"
                      />
                    </div>
                    <div class="space-y-1">
                      <label class="text-[11px] font-bold text-gray-700">Source POP / Node *</label>
                      <input
                        v-model="reviewForm.secondaryRoute.sourceNodeName"
                        type="text"
                        placeholder="e.g. Tower B RF Station"
                        class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-purple-500 [color-scheme:light]"
                      />
                    </div>
                    <div class="space-y-1">
                      <label class="text-[11px] font-bold text-gray-700">Technology *</label>
                      <select
                        v-model="reviewForm.secondaryRoute.technology"
                        class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-purple-500 [color-scheme:light]"
                      >
                        <option value="Wireless RF (5GHz)">Wireless RF (5GHz)</option>
                        <option value="Fiber (GPON)">Fiber (GPON)</option>
                        <option value="Fiber (Direct Core)">Fiber (Direct Core)</option>
                        <option value="Microwave Backhaul">Microwave Backhaul</option>
                        <option value="Hybrid (Fiber + RF)">Hybrid (Fiber + RF)</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="space-y-1">
                      <label class="text-[11px] font-bold text-gray-700">Distance (km) *</label>
                      <input
                        v-model.number="reviewForm.secondaryRoute.distanceKm"
                        type="number"
                        step="0.01"
                        placeholder="1.2"
                        class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:bg-white focus:outline-none focus:border-purple-500 [color-scheme:light]"
                      />
                    </div>
                    <div class="space-y-1">
                      <label class="text-[11px] font-bold text-gray-700">Total Fiber / Cable (meters)</label>
                      <input
                        v-model.number="reviewForm.secondaryRoute.fiberLengthMtr"
                        type="number"
                        placeholder="120"
                        class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:bg-white focus:outline-none focus:border-purple-500 [color-scheme:light]"
                      />
                    </div>
                    <div class="space-y-1">
                      <label class="text-[11px] font-bold text-gray-700">Installation Days</label>
                      <input
                        v-model.number="reviewForm.secondaryRoute.installationDays"
                        type="number"
                        placeholder="2"
                        class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:bg-white focus:outline-none focus:border-purple-500 [color-scheme:light]"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label class="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer select-none">
                      <input
                        v-model="reviewForm.secondaryRoute.infrastructureAvailable"
                        type="checkbox"
                        class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 [color-scheme:light]"
                      />
                      <div>
                        <span class="text-xs font-bold text-gray-800 block">Infrastructure Available</span>
                        <span class="text-[10px] text-gray-500">Antenna mount / tower space ready</span>
                      </div>
                    </label>

                    <label class="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer select-none">
                      <input
                        v-model="reviewForm.secondaryRoute.requiresRow"
                        type="checkbox"
                        class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 [color-scheme:light]"
                      />
                      <div>
                        <span class="text-xs font-bold text-gray-800 block">Requires Right of Way (ROW)</span>
                        <span class="text-[10px] text-gray-500">Rooftop or building permission required</span>
                      </div>
                    </label>
                  </div>

                  <!-- Secondary Route Cost Items -->
                  <div class="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="text-xs font-bold text-gray-900 block">Secondary Route Cost Items (CAPEX)</span>
                        <span class="text-[10px] text-gray-500">BOM for redundant backup route</span>
                      </div>
                      <button
                        type="button"
                        class="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-purple-700 shadow-xs"
                        @click="addCostItem('secondary')"
                      >
                        <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    <div v-if="reviewForm.secondaryRoute.costItems.length === 0" class="text-xs text-gray-400 italic text-center py-2">
                      No cost items added yet for secondary route. Click "+ Add Item" if applicable.
                    </div>

                    <div v-else class="space-y-2">
                      <div
                        v-for="(item, idx) in reviewForm.secondaryRoute.costItems"
                        :key="idx"
                        class="p-2.5 rounded-xl bg-white border border-gray-200 grid grid-cols-12 gap-2 items-center text-xs"
                      >
                        <div class="col-span-2">
                          <input
                            v-model="item.item_code"
                            type="text"
                            placeholder="Code"
                            class="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none [color-scheme:light]"
                          />
                        </div>
                        <div class="col-span-3">
                          <input
                            v-model="item.item_description"
                            type="text"
                            placeholder="Description *"
                            class="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none [color-scheme:light]"
                          />
                        </div>
                        <div class="col-span-2">
                          <select
                            v-model="item.category"
                            class="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none [color-scheme:light]"
                          >
                            <option value="Consumable Capex">Consumable</option>
                            <option value="Recoverable Capex">Recoverable</option>
                          </select>
                        </div>
                        <div class="col-span-1">
                          <select
                            v-model="item.uom"
                            class="w-full px-1.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px] focus:bg-white focus:outline-none [color-scheme:light]"
                          >
                            <option value="Mtr">Mtr</option>
                            <option value="Nos">Nos</option>
                            <option value="Roll">Roll</option>
                            <option value="Day">Day</option>
                            <option value="Hour">Hour</option>
                            <option value="Lump Sum">Lump</option>
                          </select>
                        </div>
                        <div class="col-span-1">
                          <input
                            v-model.number="item.quantity"
                            type="number"
                            placeholder="Qty"
                            class="w-full px-1.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono text-right focus:bg-white focus:outline-none [color-scheme:light]"
                            @input="recalcCostItem(item)"
                          />
                        </div>
                        <div class="col-span-1">
                          <input
                            v-model.number="item.unit_price"
                            type="number"
                            placeholder="Rate"
                            class="w-full px-1.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono text-right focus:bg-white focus:outline-none [color-scheme:light]"
                            @input="recalcCostItem(item)"
                          />
                        </div>
                        <div class="col-span-1 text-right font-mono font-bold text-gray-900 truncate">
                          {{ formatCurrency(item.total_cost || 0) }}
                        </div>
                        <div class="col-span-1 text-right">
                          <button
                            type="button"
                            class="p-1 rounded text-rose-500 hover:bg-rose-50"
                            @click="removeCostItem('secondary', idx)"
                          >
                            <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                      <div class="flex items-center gap-4 text-gray-600">
                        <span>Consumable: <b class="font-mono text-gray-900">{{ formatCurrency(getRouteConsumableCapex(reviewForm.secondaryRoute)) }}</b></span>
                        <span>Recoverable: <b class="font-mono text-gray-900">{{ formatCurrency(getRouteRecoverableCapex(reviewForm.secondaryRoute)) }}</b></span>
                      </div>
                      <div class="font-bold">
                        <span class="text-gray-700">Secondary Route CAPEX: </span>
                        <span class="font-mono text-purple-800 text-sm">{{ formatCurrency(getRouteTotalCapex(reviewForm.secondaryRoute)) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="space-y-3 p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                  <label class="text-xs font-bold text-rose-900 block">Secondary Route Constraint / Reason *</label>
                  <input
                    v-model="reviewForm.secondaryRoute.unfeasibleReason"
                    type="text"
                    placeholder="e.g. Line of sight blocked by high-rise building..."
                    class="w-full px-3 py-2 rounded-xl bg-white border border-rose-300 text-xs text-gray-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div v-else class="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                Secondary redundancy route is disabled. Switch on the toggle above to add a backup connectivity path.
              </div>
            </div>
          </div>

          <!-- TAB 2: SITE SURVEY -->
          <div v-show="reviewTab === 'survey'" class="space-y-5">
            <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div class="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h4 class="text-xs font-bold text-gray-900">Physical Site Survey</h4>
                  <span class="text-[11px] text-gray-500">Record field technician observations, site accessibility, and civil work requirements</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input v-model="reviewForm.siteSurvey.required" type="checkbox" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600" />
                </label>
              </div>

              <div v-if="reviewForm.siteSurvey.required" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold text-gray-700">Survey Status</label>
                    <label class="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer select-none">
                      <input
                        v-model="reviewForm.siteSurvey.completed"
                        type="checkbox"
                        class="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 [color-scheme:light]"
                      />
                      <span class="text-xs font-bold text-gray-800">Survey Completed</span>
                    </label>
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold text-gray-700">Survey Date</label>
                    <input
                      v-model="reviewForm.siteSurvey.surveyDate"
                      type="date"
                      class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none [color-scheme:light]"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold text-gray-700">Surveyor / Field Engineer</label>
                    <input
                      v-model="reviewForm.siteSurvey.surveyorName"
                      type="text"
                      placeholder="e.g. Rajesh Kumar"
                      class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-cyan-500 [color-scheme:light]"
                    />
                  </div>
                </div>

                <!-- Site Verification Checks -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label class="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer select-none">
                    <input
                      v-model="reviewForm.siteSurvey.siteAccessible"
                      type="checkbox"
                      class="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 [color-scheme:light]"
                    />
                    <div>
                      <span class="text-xs font-bold text-gray-800 block">Site Accessible</span>
                      <span class="text-[10px] text-gray-500">Unrestricted access for installation</span>
                    </div>
                  </label>

                  <label class="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer select-none">
                    <input
                      v-model="reviewForm.siteSurvey.powerAvailable"
                      type="checkbox"
                      class="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 [color-scheme:light]"
                    />
                    <div>
                      <span class="text-xs font-bold text-gray-800 block">Power & UPS Available</span>
                      <span class="text-[10px] text-gray-500">230V AC socket / backup power</span>
                    </div>
                  </label>

                  <label class="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer select-none">
                    <input
                      v-model="reviewForm.siteSurvey.indoorSpaceAvailable"
                      type="checkbox"
                      class="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 [color-scheme:light]"
                    />
                    <div>
                      <span class="text-xs font-bold text-gray-800 block">Indoor Rack Space</span>
                      <span class="text-[10px] text-gray-500">Wall mount / server rack available</span>
                    </div>
                  </label>
                </div>

                <!-- Findings and Recommendations -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-gray-800">Field Survey Findings & Observations</label>
                  <textarea
                    v-model="reviewForm.siteSurvey.findings"
                    rows="3"
                    placeholder="e.g. Customer server room located on 3rd floor. Shaft pipe has clear pathway. Fiber entry point located on North side..."
                    class="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-gray-800">Engineering Recommendations</label>
                  <textarea
                    v-model="reviewForm.siteSurvey.recommendations"
                    rows="2"
                    placeholder="e.g. Provide 20m flexible conduit for indoor wiring. Recommend UPS battery backup on ONT..."
                    class="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div v-else class="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                Site survey is not marked as required for this feasibility request. Turn on the toggle above if field verification is needed.
              </div>
            </div>
          </div>

          <!-- TAB 3: OPERATIONAL COSTS (OPEX) -->
          <div v-show="reviewTab === 'opex'" class="space-y-4">
            <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div class="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h4 class="text-xs font-bold text-gray-900">Monthly Operational Costs (OPEX)</h4>
                  <span class="text-[11px] text-gray-500">Recurring expenses such as dark fiber lease, bandwidth, tower rental, power, or third-party SLA</span>
                </div>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-orange-700 shadow-xs"
                  @click="addOpexItem"
                >
                  <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                  <span>Add OPEX Item</span>
                </button>
              </div>

              <div v-if="reviewForm.operationalCosts.length === 0" class="text-xs text-gray-400 italic text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No monthly operational costs added yet. Click "+ Add OPEX Item" if there are recurring third-party rentals or lease fees.
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="(cost, cIdx) in reviewForm.operationalCosts"
                  :key="cIdx"
                  class="p-3 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-12 gap-2 items-center text-xs"
                >
                  <div class="col-span-3">
                    <label class="text-[10px] text-gray-400 block mb-0.5">Category</label>
                    <select
                      v-model="cost.category"
                      class="w-full px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs focus:outline-none [color-scheme:light]"
                    >
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Power">Power</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Bandwidth">Bandwidth</option>
                      <option value="Licensing">Licensing</option>
                      <option value="Labor">Labor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div class="col-span-4">
                    <label class="text-[10px] text-gray-400 block mb-0.5">Description *</label>
                    <input
                      v-model="cost.description"
                      type="text"
                      placeholder="e.g. Monthly Dark Fiber Lease"
                      class="w-full px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs focus:outline-none [color-scheme:light]"
                    />
                  </div>

                  <div class="col-span-2">
                    <label class="text-[10px] text-gray-400 block mb-0.5">Vendor (Opt)</label>
                    <input
                      v-model="cost.vendor"
                      type="text"
                      placeholder="e.g. RailTel"
                      class="w-full px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs focus:outline-none [color-scheme:light]"
                    />
                  </div>

                  <div class="col-span-2">
                    <label class="text-[10px] text-gray-400 block mb-0.5 text-right">Monthly (₹)</label>
                    <input
                      v-model.number="cost.monthly_cost"
                      type="number"
                      placeholder="2000"
                      class="w-full px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs font-mono text-right focus:outline-none [color-scheme:light]"
                      @input="recalcOpexItem(cost)"
                    />
                  </div>

                  <div class="col-span-1 text-right pt-4">
                    <button
                      type="button"
                      class="p-1 rounded text-rose-500 hover:bg-rose-50"
                      @click="removeOpexItem(cIdx)"
                    >
                      <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- OPEX Summary -->
              <div class="p-3 rounded-xl bg-orange-50/60 border border-orange-200/80 flex items-center justify-between text-xs font-bold">
                <span class="text-orange-900">Total Recurring OPEX:</span>
                <div class="flex items-center gap-4">
                  <span class="text-gray-600">Annual: <b class="font-mono text-gray-900">{{ formatCurrency(computedTotalAnnualOpex) }}/yr</b></span>
                  <span class="font-mono text-orange-950 text-sm bg-white px-3 py-1 rounded-lg border border-orange-200 shadow-xs">{{ formatCurrency(computedTotalMonthlyOpex) }}/mo</span>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 4: COMMERCIAL ASSESSMENT & DECISION -->
          <div v-show="reviewTab === 'decision'" class="space-y-5">
            <!-- Commercial Summary Card (Mirroring Flutter Commercial Summary) -->
            <div class="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 shadow-xs space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <UIcon name="i-heroicons-calculator" class="w-4 h-4 text-blue-700" />
                  <span>Commercial Assessment Summary</span>
                </span>
                <span class="text-[10px] font-bold text-blue-700">Auto-calculated from Routes & OPEX</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Total CAPEX Box -->
                <div class="p-4 rounded-xl bg-white/90 border border-blue-100 shadow-xs space-y-2">
                  <span class="text-[11px] font-bold text-gray-500 block">Total Estimated CAPEX</span>
                  <div class="text-xl font-black font-mono text-teal-800">
                    {{ formatCurrency(computedTotalEstimatedCapex) }}
                  </div>
                  <div class="flex items-center gap-2 flex-wrap text-[10px] pt-1 border-t border-gray-100">
                    <span class="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold">
                      Primary: {{ formatCurrency(computedPrimaryCapex) }}
                    </span>
                    <span v-if="reviewForm.hasSecondaryRoute && reviewForm.secondaryRoute.isFeasible" class="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-bold">
                      Secondary: {{ formatCurrency(computedSecondaryCapex) }}
                    </span>
                  </div>
                </div>

                <!-- Total OPEX Box -->
                <div class="p-4 rounded-xl bg-white/90 border border-blue-100 shadow-xs space-y-2">
                  <span class="text-[11px] font-bold text-gray-500 block">Total Monthly OPEX</span>
                  <div class="text-xl font-black font-mono text-orange-800">
                    {{ formatCurrency(computedTotalMonthlyOpex) }}<span class="text-xs font-medium text-gray-500">/mo</span>
                  </div>
                  <div class="text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                    Annualized: <b class="font-mono text-gray-900 font-bold">{{ formatCurrency(computedTotalAnnualOpex) }}/yr</b> ({{ reviewForm.operationalCosts.length }} cost items)
                  </div>
                </div>
              </div>

              <!-- Commercial Viability Switch -->
              <div class="p-4 rounded-xl bg-white/90 border border-blue-100 flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-gray-900 block">Commercially Viable Project?</span>
                  <span class="text-[11px] text-gray-500">Expected contract value and profit margin justify deployment CAPEX & recurring OPEX</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input v-model="reviewForm.isCommerciallyViable" type="checkbox" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>
            </div>

            <!-- Timeline & Delivery Specs -->
            <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
              <h4 class="text-xs font-bold text-gray-900">Delivery Timeline & SLAs</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-gray-700">Estimated Installation Days</label>
                  <input
                    v-model.number="reviewForm.estimatedInstallationDays"
                    type="number"
                    placeholder="3"
                    class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:bg-white focus:outline-none [color-scheme:light]"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-gray-700">Expected Handover / Completion Date</label>
                  <input
                    v-model="reviewForm.expectedCompletionDate"
                    type="date"
                    class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none [color-scheme:light]"
                  />
                </div>
              </div>
            </div>

            <!-- Decision Options Selector -->
            <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
              <span class="text-xs font-bold text-gray-900 block">Final Assessment Decision *</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  :class="[
                    'p-4 rounded-2xl border text-left transition-all flex items-center gap-3',
                    reviewForm.decision === 'approve'
                      ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 text-emerald-950'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  ]"
                  @click="reviewForm.decision = 'approve'"
                >
                  <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <span class="text-xs font-bold block">Approve Feasibility</span>
                    <span class="text-[11px] text-gray-500">Technically feasible with defined CAPEX/OPEX</span>
                  </div>
                </button>

                <button
                  type="button"
                  :class="[
                    'p-4 rounded-2xl border text-left transition-all flex items-center gap-3',
                    reviewForm.decision === 'reject'
                      ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20 text-rose-950'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  ]"
                  @click="reviewForm.decision = 'reject'"
                >
                  <UIcon name="i-heroicons-x-circle" class="w-6 h-6 text-rose-600 shrink-0" />
                  <div>
                    <span class="text-xs font-bold block">Reject Feasibility</span>
                    <span class="text-[11px] text-gray-500">Cannot fulfill service at this location</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Decision Notes & Remarks -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-gray-800">
                  Feasibility Remarks & Evaluation Notes *
                </label>
                <span class="text-[10px] text-gray-400">Required for decision submission</span>
              </div>
              <textarea
                v-model="reviewForm.remarks"
                rows="3"
                placeholder="Explain the technical evaluation rationale, key findings, and delivery requirements..."
                class="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            @click="isReviewModalOpen = false"
          >
            Cancel
          </button>

          <div class="flex items-center gap-2.5">
            <button
              type="button"
              :disabled="isSubmittingReview"
              class="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
              @click="submitSaveDraft"
            >
              <UIcon name="i-heroicons-bookmark" class="w-4 h-4 text-gray-600" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              :disabled="isSubmittingReview"
              :class="[
                'px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50',
                reviewForm.decision === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
              ]"
              @click="promptDecisionConfirmation"
            >
              <UIcon v-if="isSubmittingReview" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>{{ reviewForm.decision === 'approve' ? 'Approve Feasibility' : 'Reject Feasibility' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= CONFIRMATION DIALOG MODAL (MIRRORS FLUTTER _showConfirmationDialog) ================= -->
    <div
      v-if="isConfirmDialogOpen"
      class="fixed inset-0 z-60 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div class="relative w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-4">
        <div class="flex items-start gap-3">
          <div
            :class="[
              'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
              reviewForm.decision === 'reject' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
            ]"
          >
            <UIcon
              :name="reviewForm.decision === 'reject' ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-check-circle'"
              class="w-6 h-6"
            />
          </div>
          <div>
            <h3 class="text-sm font-black text-gray-900">Confirm Decision</h3>
            <p class="text-xs text-gray-600 mt-1 leading-relaxed">
              <span v-if="reviewForm.decision === 'reject'">
                Are you sure you want to <b>REJECT</b> this feasibility request?<br /><br />
                This will mark the request as not feasible and block the lead from proceeding to the next stage.
              </span>
              <span v-else>
                Are you sure you want to <b>APPROVE</b> this feasibility request?<br /><br />
                This will submit your technical routes, CAPEX/OPEX assessment, and allow quotation generation.
              </span>
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            @click="isConfirmDialogOpen = false"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="isSubmittingReview"
            :class="[
              'px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50',
              reviewForm.decision === 'reject'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            ]"
            @click="executeFinalDecision"
          >
            <UIcon v-if="isSubmittingReview" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <span>{{ reviewForm.decision === 'reject' ? 'Yes, Reject' : 'Yes, Approve' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ================= NEW FEASIBILITY REQUEST MODAL ================= -->
    <div
      v-if="isNewRequestModalOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="relative w-full max-w-2xl bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden my-8 flex flex-col">
        <div class="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-plus" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-black text-gray-900">Initiate Feasibility Request</h3>
              <p class="text-xs text-gray-500">Dispatch network evaluation for an active SPANCO lead</p>
            </div>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isNewRequestModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form class="p-6 space-y-4" @submit.prevent="submitNewRequest">
          <!-- Select Lead from Pipeline -->
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-gray-700">Select SPANCO Pipeline Lead *</label>
            <select
              v-model="newRequestForm.leadId"
              required
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-teal-500 [color-scheme:light]"
              @change="onLeadSelected"
            >
              <option :value="null" disabled>Choose a lead from pipeline...</option>
              <option v-for="lead in availableLeads" :key="lead.id" :value="lead.id">
                #{{ lead.lead_number }} — {{ lead.customer_info?.name || lead.customer_name || 'Customer' }} ({{ lead.customer_info?.company_name || lead.company_name || 'Individual' }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-gray-700">Connection Type *</label>
              <select
                v-model="newRequestForm.connectionType"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-teal-500 [color-scheme:light]"
              >
                <option value="leased_line">Leased Line (ILL)</option>
                <option value="broadband">Broadband</option>
                <option value="partner">Partner Resale</option>
                <option value="bandwidth">Pure Bandwidth</option>
                <option value="fiber">Fiber Direct</option>
                <option value="wireless">Radio RF / Wireless</option>
                <option value="point_to_point">Point-to-Point (P2P)</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-bold text-gray-700">Required Bandwidth *</label>
              <input
                v-model="newRequestForm.bandwidth"
                type="text"
                required
                placeholder="e.g. 100 Mbps or 1 Gbps"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:bg-white focus:outline-none focus:border-teal-500 [color-scheme:light]"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-gray-700">Urgency Level</label>
              <select
                v-model="newRequestForm.urgency"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-teal-500 [color-scheme:light]"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-bold text-gray-700">Feasibility Scope</label>
              <select
                v-model="newRequestForm.feasibilityType"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-teal-500 [color-scheme:light]"
              >
                <option value="technical">Technical</option>
                <option value="commercial">Commercial</option>
                <option value="combined">Combined</option>
              </select>
            </div>
          </div>

          <!-- Service Address -->
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-gray-700">Service Address *</label>
            <textarea
              v-model="newRequestForm.address"
              rows="2"
              required
              placeholder="Building, street, plot number..."
              class="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-gray-700">City *</label>
              <input
                v-model="newRequestForm.city"
                type="text"
                required
                class="w-full px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs [color-scheme:light]"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-gray-700">State *</label>
              <input
                v-model="newRequestForm.state"
                type="text"
                required
                class="w-full px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs [color-scheme:light]"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-gray-700">Pincode *</label>
              <input
                v-model="newRequestForm.pincode"
                type="text"
                required
                class="w-full px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono [color-scheme:light]"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-gray-700">GPS Latitude</label>
              <input
                v-model.number="newRequestForm.latitude"
                type="number"
                step="any"
                placeholder="28.560247"
                class="w-full px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono [color-scheme:light]"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-gray-700">GPS Longitude</label>
              <input
                v-model.number="newRequestForm.longitude"
                type="number"
                step="any"
                placeholder="77.199301"
                class="w-full px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono [color-scheme:light]"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-[10px] font-bold text-gray-700">Special Requirements</label>
            <input
              v-model="newRequestForm.specialConditions"
              type="text"
              placeholder="e.g. Low latency SLA required, dual fiber entry requested"
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs [color-scheme:light]"
            />
          </div>

          <div class="p-6 -mx-6 -mb-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200"
              @click="isNewRequestModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isCreatingRequest"
              class="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <UIcon v-if="isCreatingRequest" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useFeasibilityStore } from "~/stores/feasibility";
import { useUserProfileStore } from "~/stores/userProfile";
import { useSystemConfigStore } from "~/stores/systemConfig";
import type {
  FeasibilityRequest,
  CostItem,
  OperationalCostItem,
} from "~/utils/feasibility";
import {
  FeasibilityStatus,
  FEASIBILITY_STATUS_LABELS,
  FEASIBILITY_STATUS_ICONS,
  SERVICE_TYPE_LABELS,
} from "~/utils/feasibility";
import { formatDate, formatDateTime } from "~/utils/formatter";

definePageMeta({
  middleware: ["auth", "admin", "feasibility"],
});

const feasibilityStore = useFeasibilityStore();
const userProfileStore = useUserProfileStore();
const systemConfigStore = useSystemConfigStore();
const supabase = useSupabaseClient();

// In-page guard in case Feasibility is disabled via realtime
watch(
  () => systemConfigStore.isFeasibilityEnabled,
  (enabled) => {
    if (!enabled) {
      navigateTo("/admin");
    }
  }
);

// View and filter states
const viewMode = ref<"pending" | "all">("pending");
const searchQuery = ref("");
const selectedStatus = ref<string>("ALL");
const selectedUrgency = ref<string>("ALL");
const selectedServiceType = ref<string>("ALL");
const currentPage = ref(1);
const itemsPerPage = 12;

// Drawer & Modal States
const isDetailDrawerOpen = ref(false);
const activeRequest = ref<FeasibilityRequest | null>(null);

const isReviewModalOpen = ref(false);
const reviewTargetReq = ref<FeasibilityRequest | null>(null);
const reviewTab = ref<"routes" | "survey" | "opex" | "decision">("routes");
const isSubmittingReview = ref(false);
const isConfirmDialogOpen = ref(false);

const isNewRequestModalOpen = ref(false);
const isCreatingRequest = ref(false);
const availableLeads = ref<any[]>([]);

// Review Form Reactive Data matching Flutter ReviewPage model
const reviewForm = ref({
  // Primary Route (Required)
  primaryRoute: {
    isFeasible: true,
    routeName: "",
    sourceNodeName: "",
    technology: "Fiber (Direct Core)",
    distanceKm: 0,
    fiberLengthMtr: 0,
    installationDays: 3,
    infrastructureAvailable: false,
    requiresRow: false,
    remarks: "",
    unfeasibleReason: "",
    unfeasibleRemarks: "",
    costItems: [] as CostItem[],
  },
  // Secondary Route (Optional Redundancy)
  hasSecondaryRoute: false,
  secondaryRoute: {
    isFeasible: true,
    routeName: "",
    sourceNodeName: "",
    technology: "Wireless RF (5GHz)",
    distanceKm: 0,
    fiberLengthMtr: 0,
    installationDays: 3,
    infrastructureAvailable: false,
    requiresRow: false,
    remarks: "",
    unfeasibleReason: "",
    unfeasibleRemarks: "",
    costItems: [] as CostItem[],
  },
  // Site Survey
  siteSurvey: {
    required: false,
    completed: false,
    surveyDate: new Date().toISOString().substring(0, 10),
    surveyorName: "",
    siteAccessible: true,
    powerAvailable: true,
    indoorSpaceAvailable: true,
    findings: "",
    recommendations: "",
  },
  // Operational Costs (OPEX)
  operationalCosts: [] as OperationalCostItem[],
  // Commercial & Decision
  decision: "approve" as "approve" | "reject",
  isCommerciallyViable: true,
  remarks: "",
  estimatedInstallationDays: 3,
  expectedCompletionDate: "",
});

// New Request Form Reactive Data
const newRequestForm = ref({
  leadId: null as number | null,
  connectionType: "leased_line",
  bandwidth: "100 Mbps",
  urgency: "normal",
  priority: "normal",
  feasibilityType: "technical",
  address: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  latitude: null as number | null,
  longitude: null as number | null,
  specialConditions: "",
});

// Stats Computed
const stats = computed(() => feasibilityStore.stats);

// Currency formatter
function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);
}

// Helpers for badges and labels
function getStatusLabel(status: string): string {
  return FEASIBILITY_STATUS_LABELS[status] || status;
}

function getStatusIcon(status: string): string {
  return FEASIBILITY_STATUS_ICONS[status] || "i-heroicons-question-mark-circle";
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case FeasibilityStatus.APPROVED:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case FeasibilityStatus.UNDER_REVIEW:
      return "bg-blue-50 text-blue-700 border-blue-200";
    case FeasibilityStatus.PENDING:
      return "bg-amber-50 text-amber-700 border-amber-200";
    case FeasibilityStatus.REJECTED:
      return "bg-rose-50 text-rose-700 border-rose-200";
    case FeasibilityStatus.CANCELLED:
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getUrgencyClass(urgency?: string): string {
  switch (urgency?.toLowerCase()) {
    case "urgent":
      return "bg-red-50 text-red-700 border-red-200";
    case "high":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "normal":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "low":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

function getUrgencyIcon(urgency?: string): string {
  switch (urgency?.toLowerCase()) {
    case "urgent":
      return "i-heroicons-exclamation-triangle";
    case "high":
      return "i-heroicons-arrow-trending-up";
    case "normal":
      return "i-heroicons-minus";
    case "low":
      return "i-heroicons-arrow-trending-down";
    default:
      return "i-heroicons-minus";
  }
}

function getServiceTypeLabel(type?: string): string {
  if (!type) return "Leased Line";
  return SERVICE_TYPE_LABELS[type] || type.replace(/_/g, " ").toUpperCase();
}

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.trim() !== "" ||
    selectedStatus.value !== "ALL" ||
    selectedUrgency.value !== "ALL" ||
    selectedServiceType.value !== "ALL"
  );
});

function resetFilters() {
  searchQuery.value = "";
  selectedStatus.value = "ALL";
  selectedUrgency.value = "ALL";
  selectedServiceType.value = "ALL";
  currentPage.value = 1;
}

// Filtered Requests Pipeline
const displayedRequests = computed(() => {
  let list =
    viewMode.value === "pending"
      ? feasibilityStore.pendingRequests
      : feasibilityStore.allRequests;

  // Search filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((r) => {
      const matchNum = r.request_number?.toLowerCase().includes(q);
      const matchLead = r.lead?.lead_number?.toLowerCase().includes(q);
      const matchCustomer = r.lead?.customer_name?.toLowerCase().includes(q);
      const matchCompany = r.lead?.company_name?.toLowerCase().includes(q);
      const matchCity = r.service_location?.city?.toLowerCase().includes(q);
      const matchAddr = r.service_location?.address?.toLowerCase().includes(q);
      return matchNum || matchLead || matchCustomer || matchCompany || matchCity || matchAddr;
    });
  }

  // Status filter
  if (selectedStatus.value !== "ALL") {
    list = list.filter((r) => r.status === selectedStatus.value);
  }

  // Urgency filter
  if (selectedUrgency.value !== "ALL") {
    list = list.filter(
      (r) =>
        r.service_requirements?.urgency?.toLowerCase() ===
        selectedUrgency.value.toLowerCase()
    );
  }

  // Service Type filter
  if (selectedServiceType.value !== "ALL") {
    list = list.filter(
      (r) =>
        r.service_requirements?.connection_type === selectedServiceType.value
    );
  }

  return list;
});

// Pagination computed
const totalPages = computed(() => Math.ceil(displayedRequests.value.length / itemsPerPage));
const paginationStart = computed(() => (currentPage.value - 1) * itemsPerPage + 1);
const paginationEnd = computed(() =>
  Math.min(currentPage.value * itemsPerPage, displayedRequests.value.length)
);

const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return displayedRequests.value.slice(start, start + itemsPerPage);
});

// Drawer Functions
function openDetailDrawer(req: FeasibilityRequest) {
  activeRequest.value = req;
  isDetailDrawerOpen.value = true;
}

// Review Modal Functions
function openReviewModal(req: FeasibilityRequest) {
  reviewTargetReq.value = req;
  reviewTab.value = "routes";

  // Pre-fill Primary Route
  if (req.primary_route) {
    reviewForm.value.primaryRoute.isFeasible = req.primary_route.is_feasible ?? true;
    reviewForm.value.primaryRoute.routeName = req.primary_route.route_name || `Primary Route - ${req.service_location?.city || 'Site'}`;
    reviewForm.value.primaryRoute.sourceNodeName = req.primary_route.source_node_name || "";
    reviewForm.value.primaryRoute.technology = req.primary_route.technology || "Fiber (Direct Core)";
    reviewForm.value.primaryRoute.distanceKm = req.primary_route.distance_km || 0;
    reviewForm.value.primaryRoute.fiberLengthMtr = req.primary_route.total_fiber_length_mtr || 0;
    reviewForm.value.primaryRoute.installationDays = req.primary_route.installation_days || 3;
    reviewForm.value.primaryRoute.infrastructureAvailable = req.primary_route.infrastructure_available ?? false;
    reviewForm.value.primaryRoute.requiresRow = req.primary_route.requires_row ?? false;
    reviewForm.value.primaryRoute.remarks = req.primary_route.remarks || "";
    reviewForm.value.primaryRoute.unfeasibleReason = req.primary_route.reason || "";
    reviewForm.value.primaryRoute.unfeasibleRemarks = req.primary_route.remarks || "";
    reviewForm.value.primaryRoute.costItems = req.primary_route.cost_items ? JSON.parse(JSON.stringify(req.primary_route.cost_items)) : [];
  } else {
    reviewForm.value.primaryRoute.isFeasible = true;
    reviewForm.value.primaryRoute.routeName = `Primary Route - ${req.service_location?.city || 'Site'}`;
    reviewForm.value.primaryRoute.sourceNodeName = "";
    reviewForm.value.primaryRoute.technology = "Fiber (Direct Core)";
    reviewForm.value.primaryRoute.distanceKm = 0;
    reviewForm.value.primaryRoute.fiberLengthMtr = 0;
    reviewForm.value.primaryRoute.installationDays = 3;
    reviewForm.value.primaryRoute.infrastructureAvailable = false;
    reviewForm.value.primaryRoute.requiresRow = false;
    reviewForm.value.primaryRoute.remarks = "";
    reviewForm.value.primaryRoute.unfeasibleReason = "";
    reviewForm.value.primaryRoute.unfeasibleRemarks = "";
    reviewForm.value.primaryRoute.costItems = [];
  }

  // Pre-fill Secondary Route
  if (req.secondary_route) {
    reviewForm.value.hasSecondaryRoute = true;
    reviewForm.value.secondaryRoute.isFeasible = req.secondary_route.is_feasible ?? true;
    reviewForm.value.secondaryRoute.routeName = req.secondary_route.route_name || `Backup Wireless Link`;
    reviewForm.value.secondaryRoute.sourceNodeName = req.secondary_route.source_node_name || "";
    reviewForm.value.secondaryRoute.technology = req.secondary_route.technology || "Wireless RF (5GHz)";
    reviewForm.value.secondaryRoute.distanceKm = req.secondary_route.distance_km || 0;
    reviewForm.value.secondaryRoute.fiberLengthMtr = req.secondary_route.total_fiber_length_mtr || 0;
    reviewForm.value.secondaryRoute.installationDays = req.secondary_route.installation_days || 3;
    reviewForm.value.secondaryRoute.infrastructureAvailable = req.secondary_route.infrastructure_available ?? false;
    reviewForm.value.secondaryRoute.requiresRow = req.secondary_route.requires_row ?? false;
    reviewForm.value.secondaryRoute.remarks = req.secondary_route.remarks || "";
    reviewForm.value.secondaryRoute.unfeasibleReason = req.secondary_route.reason || "";
    reviewForm.value.secondaryRoute.unfeasibleRemarks = req.secondary_route.remarks || "";
    reviewForm.value.secondaryRoute.costItems = req.secondary_route.cost_items ? JSON.parse(JSON.stringify(req.secondary_route.cost_items)) : [];
  } else {
    reviewForm.value.hasSecondaryRoute = false;
    reviewForm.value.secondaryRoute.isFeasible = true;
    reviewForm.value.secondaryRoute.routeName = `Backup Route - ${req.service_location?.city || 'Site'}`;
    reviewForm.value.secondaryRoute.sourceNodeName = "";
    reviewForm.value.secondaryRoute.technology = "Wireless RF (5GHz)";
    reviewForm.value.secondaryRoute.distanceKm = 0;
    reviewForm.value.secondaryRoute.fiberLengthMtr = 0;
    reviewForm.value.secondaryRoute.installationDays = 3;
    reviewForm.value.secondaryRoute.infrastructureAvailable = false;
    reviewForm.value.secondaryRoute.requiresRow = false;
    reviewForm.value.secondaryRoute.remarks = "";
    reviewForm.value.secondaryRoute.unfeasibleReason = "";
    reviewForm.value.secondaryRoute.unfeasibleRemarks = "";
    reviewForm.value.secondaryRoute.costItems = [];
  }

  // Pre-fill Site Survey
  if (req.site_survey) {
    reviewForm.value.siteSurvey.required = req.site_survey.required ?? true;
    reviewForm.value.siteSurvey.completed = req.site_survey.completed ?? false;
    reviewForm.value.siteSurvey.surveyDate = req.site_survey.survey_date || (req.site_survey.surveyed_at ? req.site_survey.surveyed_at.substring(0, 10) : new Date().toISOString().substring(0, 10));
    reviewForm.value.siteSurvey.surveyorName = req.site_survey.surveyor_name || req.site_survey.conducted_by || req.site_survey.surveyed_by || "";
    reviewForm.value.siteSurvey.siteAccessible = req.site_survey.site_accessible ?? true;
    reviewForm.value.siteSurvey.powerAvailable = req.site_survey.power_available ?? true;
    reviewForm.value.siteSurvey.indoorSpaceAvailable = req.site_survey.indoor_space_available ?? true;
    reviewForm.value.siteSurvey.findings = req.site_survey.findings || "";
    reviewForm.value.siteSurvey.recommendations = req.site_survey.recommendations || "";
  } else {
    reviewForm.value.siteSurvey.required = false;
    reviewForm.value.siteSurvey.completed = false;
    reviewForm.value.siteSurvey.surveyDate = new Date().toISOString().substring(0, 10);
    reviewForm.value.siteSurvey.surveyorName = "";
    reviewForm.value.siteSurvey.siteAccessible = true;
    reviewForm.value.siteSurvey.powerAvailable = true;
    reviewForm.value.siteSurvey.indoorSpaceAvailable = true;
    reviewForm.value.siteSurvey.findings = "";
    reviewForm.value.siteSurvey.recommendations = "";
  }

  // Pre-fill Operational Costs
  reviewForm.value.operationalCosts = req.operational_costs ? JSON.parse(JSON.stringify(req.operational_costs)) : [];

  // Commercial & Decision
  reviewForm.value.decision = req.is_feasible === false ? "reject" : "approve";
  reviewForm.value.isCommerciallyViable = req.is_commercially_viable ?? true;
  reviewForm.value.remarks = req.feasibility_remarks || "";
  reviewForm.value.estimatedInstallationDays = req.estimated_installation_days || req.primary_route?.installation_days || 3;
  reviewForm.value.expectedCompletionDate = req.expected_completion_date ? req.expected_completion_date.substring(0, 10) : "";

  isReviewModalOpen.value = true;
}

// Cost Items Dynamic Methods
function addCostItem(route: "primary" | "secondary") {
  const target = route === "primary" ? reviewForm.value.primaryRoute : reviewForm.value.secondaryRoute;
  target.costItems.push({
    item_code: "",
    item_description: "",
    category: "Consumable Capex",
    uom: "Mtr",
    quantity: 1,
    unit_price: 0,
    total_cost: 0,
  });
}

function removeCostItem(route: "primary" | "secondary", index: number) {
  const target = route === "primary" ? reviewForm.value.primaryRoute : reviewForm.value.secondaryRoute;
  target.costItems.splice(index, 1);
}

function recalcCostItem(item: CostItem) {
  item.total_cost = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
}

// Capex Aggregations per Route
function getRouteConsumableCapex(routeData: any): number {
  if (!routeData.isFeasible) return 0;
  return routeData.costItems
    .filter((item: CostItem) => item.category === "Consumable Capex")
    .reduce((sum: number, item: CostItem) => sum + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0);
}

function getRouteRecoverableCapex(routeData: any): number {
  if (!routeData.isFeasible) return 0;
  return routeData.costItems
    .filter((item: CostItem) => item.category === "Recoverable Capex")
    .reduce((sum: number, item: CostItem) => sum + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0);
}

function getRouteTotalCapex(routeData: any): number {
  return getRouteConsumableCapex(routeData) + getRouteRecoverableCapex(routeData);
}

// Computed CAPEX Totals across all routes
const computedPrimaryCapex = computed(() => {
  return getRouteTotalCapex(reviewForm.value.primaryRoute);
});

const computedSecondaryCapex = computed(() => {
  if (!reviewForm.value.hasSecondaryRoute) return 0;
  return getRouteTotalCapex(reviewForm.value.secondaryRoute);
});

const computedTotalEstimatedCapex = computed(() => {
  return computedPrimaryCapex.value + computedSecondaryCapex.value;
});

// OPEX Items Dynamic Methods
function addOpexItem() {
  reviewForm.value.operationalCosts.push({
    category: "Infrastructure",
    description: "",
    vendor: "",
    remarks: "",
    monthly_cost: 0,
    annual_cost: 0,
  });
}

function removeOpexItem(index: number) {
  reviewForm.value.operationalCosts.splice(index, 1);
}

function recalcOpexItem(item: OperationalCostItem) {
  item.annual_cost = (Number(item.monthly_cost) || 0) * 12;
}

const computedTotalMonthlyOpex = computed(() => {
  return reviewForm.value.operationalCosts.reduce(
    (sum, c) => sum + (Number(c.monthly_cost) || 0),
    0
  );
});

const computedTotalAnnualOpex = computed(() => {
  return computedTotalMonthlyOpex.value * 12;
});

// Payload Generation Helpers (matches Flutter ConnectivityRoute.toJson())
function buildConnectivityRoutePayload(routeData: any): any {
  if (!routeData.isFeasible) {
    return {
      is_feasible: false,
      reason: routeData.unfeasibleReason || "Route not feasible",
      remarks: routeData.unfeasibleRemarks || routeData.remarks || undefined,
    };
  }

  // Ensure item total costs and route aggregates are up to date
  let consumable = 0;
  let recoverable = 0;
  for (const item of routeData.costItems) {
    const cost = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    item.total_cost = cost;
    if (item.category === "Consumable Capex") {
      consumable += cost;
    } else if (item.category === "Recoverable Capex") {
      recoverable += cost;
    }
  }

  return {
    is_feasible: true,
    route_name: routeData.routeName.trim(),
    source_node_name: routeData.sourceNodeName.trim(),
    technology: routeData.technology,
    distance_km: Number(routeData.distanceKm) || 0,
    total_fiber_length_mtr: Number(routeData.fiberLengthMtr) || 0,
    installation_days: Number(routeData.installationDays) || undefined,
    infrastructure_available: Boolean(routeData.infrastructureAvailable),
    requires_row: Boolean(routeData.requiresRow),
    remarks: routeData.remarks?.trim() || undefined,
    cost_items: routeData.costItems,
    consumable_capex: consumable,
    recoverable_capex: recoverable,
    total_capex: consumable + recoverable,
  };
}

function buildSiteSurveyPayload(): any {
  if (!reviewForm.value.siteSurvey.required) {
    return null;
  }
  return {
    required: true,
    completed: Boolean(reviewForm.value.siteSurvey.completed),
    survey_date: reviewForm.value.siteSurvey.surveyDate || new Date().toISOString().substring(0, 10),
    surveyor_name: reviewForm.value.siteSurvey.surveyorName?.trim() || undefined,
    conducted_by: reviewForm.value.siteSurvey.surveyorName?.trim() || undefined,
    findings: reviewForm.value.siteSurvey.findings?.trim() || undefined,
    recommendations: reviewForm.value.siteSurvey.recommendations?.trim() || undefined,
    site_accessible: Boolean(reviewForm.value.siteSurvey.siteAccessible),
    power_available: Boolean(reviewForm.value.siteSurvey.powerAvailable),
    indoor_space_available: Boolean(reviewForm.value.siteSurvey.indoorSpaceAvailable),
  };
}

function buildOperationalCostsPayload(): any {
  if (!reviewForm.value.operationalCosts.length) {
    return null;
  }
  return reviewForm.value.operationalCosts.map((c) => ({
    category: c.category,
    description: c.description.trim(),
    monthly_cost: Number(c.monthly_cost) || 0,
    annual_cost: (Number(c.monthly_cost) || 0) * 12,
    vendor: c.vendor?.trim() || undefined,
    remarks: c.remarks?.trim() || undefined,
  }));
}

// Save Draft (Status stays 'under_review', sets reviewed_by & reviewed_at, saves all draft routes)
async function submitSaveDraft() {
  if (!reviewTargetReq.value) return;
  isSubmittingReview.value = true;

  try {
    const userId = userProfileStore.profile?.id || "system";

    const primaryRoute = buildConnectivityRoutePayload(reviewForm.value.primaryRoute);
    const secondaryRoute = reviewForm.value.hasSecondaryRoute
      ? buildConnectivityRoutePayload(reviewForm.value.secondaryRoute)
      : null;
    const siteSurvey = buildSiteSurveyPayload();
    const operationalCosts = buildOperationalCostsPayload();
    const estimatedCapex = computedTotalEstimatedCapex.value;
    const estimatedOpex = computedTotalMonthlyOpex.value;

    await feasibilityStore.saveDraft(
      reviewTargetReq.value.id,
      {
        primary_route: primaryRoute,
        secondary_route: secondaryRoute,
        site_survey: siteSurvey,
        operational_costs: operationalCosts,
        estimated_capex: estimatedCapex,
        estimated_opex: estimatedOpex,
        is_commercially_viable: reviewForm.value.isCommerciallyViable,
        feasibility_remarks: reviewForm.value.remarks.trim() || undefined,
        estimated_installation_days: Number(reviewForm.value.estimatedInstallationDays) || undefined,
        expected_completion_date: reviewForm.value.expectedCompletionDate || undefined,
      },
      userId
    );

    isReviewModalOpen.value = false;
    if (activeRequest.value && activeRequest.value.id === reviewTargetReq.value.id) {
      activeRequest.value = feasibilityStore.allRequests.find(
        (r) => r.id === reviewTargetReq.value!.id
      ) || null;
    }
  } catch (err: any) {
    alert("Failed to save draft: " + err.message);
  } finally {
    isSubmittingReview.value = false;
  }
}

// Prompt Confirmation Dialog (Validates according to Flutter business logic)
function promptDecisionConfirmation() {
  if (!reviewTargetReq.value) return;

  // Validation 1: Primary route
  if (reviewForm.value.primaryRoute.isFeasible) {
    if (!reviewForm.value.primaryRoute.routeName.trim()) {
      alert("Please provide Route Name for Primary Route.");
      reviewTab.value = "routes";
      return;
    }
    if (!reviewForm.value.primaryRoute.sourceNodeName.trim()) {
      alert("Please provide Source POP / Node for Primary Route.");
      reviewTab.value = "routes";
      return;
    }
  } else {
    if (!reviewForm.value.primaryRoute.unfeasibleReason.trim()) {
      alert("Please provide the technical constraint / reason why Primary Route is not feasible.");
      reviewTab.value = "routes";
      return;
    }
  }

  // Validation 2: Secondary route if enabled
  if (reviewForm.value.hasSecondaryRoute) {
    if (reviewForm.value.secondaryRoute.isFeasible) {
      if (!reviewForm.value.secondaryRoute.routeName.trim()) {
        alert("Please provide Route Name for Secondary Route.");
        reviewTab.value = "routes";
        return;
      }
    } else {
      if (!reviewForm.value.secondaryRoute.unfeasibleReason.trim()) {
        alert("Please provide reason why Secondary Route is not feasible.");
        reviewTab.value = "routes";
        return;
      }
    }
  }

  // Validation 3: Final Remarks are REQUIRED for both approve and reject (matching Flutter validator)
  if (!reviewForm.value.remarks.trim()) {
    alert("Please provide remarks for your decision.");
    reviewTab.value = "decision";
    return;
  }

  // All validations passed -> Open confirmation dialog
  isConfirmDialogOpen.value = true;
}

// Execute Final Decision (Approve / Reject)
async function executeFinalDecision() {
  if (!reviewTargetReq.value) return;
  isConfirmDialogOpen.value = false;
  isSubmittingReview.value = true;

  try {
    const userId = userProfileStore.profile?.id || "system";

    const primaryRoute = buildConnectivityRoutePayload(reviewForm.value.primaryRoute);
    const secondaryRoute = reviewForm.value.hasSecondaryRoute
      ? buildConnectivityRoutePayload(reviewForm.value.secondaryRoute)
      : null;
    const siteSurvey = buildSiteSurveyPayload();
    const operationalCosts = buildOperationalCostsPayload();
    const estimatedCapex = computedTotalEstimatedCapex.value;
    const estimatedOpex = computedTotalMonthlyOpex.value;

    if (reviewForm.value.decision === "approve") {
      await feasibilityStore.approveFeasibility(
        reviewTargetReq.value.id,
        {
          remarks: reviewForm.value.remarks.trim(),
          primaryRoute,
          secondaryRoute,
          siteSurvey,
          operationalCosts,
          estimatedCapex,
          estimatedOpex,
          isCommerciallyViable: reviewForm.value.isCommerciallyViable,
          estimatedInstallationDays: Number(reviewForm.value.estimatedInstallationDays) || undefined,
          expectedCompletionDate: reviewForm.value.expectedCompletionDate || undefined,
        },
        userId
      );
    } else {
      await feasibilityStore.rejectFeasibility(
        reviewTargetReq.value.id,
        reviewForm.value.remarks.trim(),
        userId,
        {
          primary_route: primaryRoute,
          secondary_route: secondaryRoute,
          site_survey: siteSurvey,
          operational_costs: operationalCosts,
          estimated_capex: estimatedCapex,
          estimated_opex: estimatedOpex,
          is_commercially_viable: reviewForm.value.isCommerciallyViable,
        }
      );
    }

    isReviewModalOpen.value = false;
    if (activeRequest.value && activeRequest.value.id === reviewTargetReq.value.id) {
      activeRequest.value = feasibilityStore.allRequests.find(
        (r) => r.id === reviewTargetReq.value!.id
      ) || null;
    }
  } catch (err: any) {
    alert("Error submitting feasibility decision: " + err.message);
  } finally {
    isSubmittingReview.value = false;
  }
}

// Cancel Request
async function confirmCancelRequest(req: FeasibilityRequest) {
  if (confirm(`Are you sure you want to cancel Feasibility Request ${req.request_number || req.id}?`)) {
    try {
      await feasibilityStore.cancelRequest(req.id, "Cancelled by administrator");
    } catch (err: any) {
      alert("Failed to cancel request: " + err.message);
    }
  }
}

// New Request Modal & Leads Fetching
async function openNewRequestModal() {
  try {
    // Fetch active leads from supabase spanco_leads table
    const { data, error } = await (supabase as any)
      .from("spanco_leads")
      .select("id, lead_number, customer_info, service_location, service_requirements")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    availableLeads.value = data || [];
  } catch (err) {
    console.error("Could not fetch leads:", err);
  }

  // Reset form
  newRequestForm.value = {
    leadId: null,
    connectionType: "leased_line",
    bandwidth: "100 Mbps",
    urgency: "normal",
    priority: "normal",
    feasibilityType: "technical",
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    latitude: null,
    longitude: null,
    specialConditions: "",
  };

  isNewRequestModalOpen.value = true;
}

function onLeadSelected() {
  const lead = availableLeads.value.find((l) => l.id === newRequestForm.value.leadId);
  if (!lead) return;

  if (lead.service_location) {
    if (lead.service_location.address) newRequestForm.value.address = lead.service_location.address;
    if (lead.service_location.city) newRequestForm.value.city = lead.service_location.city;
    if (lead.service_location.state) newRequestForm.value.state = lead.service_location.state;
    if (lead.service_location.pincode) newRequestForm.value.pincode = lead.service_location.pincode;
    if (lead.service_location.landmark) newRequestForm.value.landmark = lead.service_location.landmark;
    if (lead.service_location.latitude) newRequestForm.value.latitude = lead.service_location.latitude;
    if (lead.service_location.longitude) newRequestForm.value.longitude = lead.service_location.longitude;
  }
  if (lead.service_requirements?.bandwidth_required) {
    newRequestForm.value.bandwidth = lead.service_requirements.bandwidth_required;
  }
}

async function submitNewRequest() {
  if (!newRequestForm.value.leadId) {
    alert("Please select a lead");
    return;
  }

  isCreatingRequest.value = true;
  try {
    const userId = userProfileStore.profile?.id || "00000000-0000-0000-0000-000000000000";
    const deptId = userProfileStore.profile?.department || 1;

    await feasibilityStore.createRequest({
      leadId: newRequestForm.value.leadId,
      requestedBy: userId,
      requestingDepartment: deptId,
      serviceLocation: {
        address: newRequestForm.value.address,
        city: newRequestForm.value.city,
        state: newRequestForm.value.state,
        pincode: newRequestForm.value.pincode,
        landmark: newRequestForm.value.landmark || undefined,
        latitude: newRequestForm.value.latitude || undefined,
        longitude: newRequestForm.value.longitude || undefined,
      },
      serviceRequirements: {
        connection_type: newRequestForm.value.connectionType,
        bandwidth: newRequestForm.value.bandwidth,
        urgency: newRequestForm.value.urgency,
        priority: newRequestForm.value.priority,
        feasibility_type: newRequestForm.value.feasibilityType,
        special_conditions: newRequestForm.value.specialConditions || undefined,
      },
    });

    isNewRequestModalOpen.value = false;
  } catch (err: any) {
    alert("Failed to submit request: " + err.message);
  } finally {
    isCreatingRequest.value = false;
  }
}

async function refreshData() {
  await feasibilityStore.fetchAllRequests();
}

onMounted(async () => {
  await feasibilityStore.fetchAllRequests();
});
</script>
