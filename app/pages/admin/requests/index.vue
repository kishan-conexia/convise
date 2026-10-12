<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200/70">
      <div>
        <h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>Request & Approval History</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
            Monthly Audit
          </span>
        </h1>
        <p class="text-xs text-gray-500 mt-0.5">
          Review and audit employee attendance regularizations, leave applications, and approval timelines on a monthly basis.
        </p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          :disabled="isRefreshing || !selectedEmployeeId"
          title="Refresh current monthly data"
          @click="fetchEmployeeMonthlyData(true)"
        >
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" :class="isRefreshing ? 'animate-spin text-cyan-600' : 'text-gray-500'" />
          <span>Refresh</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          :disabled="!selectedEmployeeId || currentTabCount === 0"
          @click="exportCurrentViewCSV"
        >
          <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
          <span>Export CSV ({{ activeTab === 'regularizations' ? 'Regularizations' : 'Leaves' }})</span>
        </button>
      </div>
    </div>

    <!-- Toolbar: Employee & Month Picker (The key to low egress) -->
    <div class="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <!-- 1. Searchable Employee Selection -->
        <div class="md:col-span-6 space-y-1 relative" ref="employeeDropdownRef">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <UIcon name="i-heroicons-user" class="w-4 h-4 text-cyan-600" />
              <span>Select Employee *</span>
            </label>
            <span v-if="selectedEmployee" class="text-[11px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
              {{ selectedEmployee.employee_code || 'CODE' }} • {{ getDepartmentName(selectedEmployee.department) }}
            </span>
            <span v-else class="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Required
            </span>
          </div>

          <div class="relative">
            <div class="relative flex items-center">
              <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                v-model="employeeSearchInput"
                type="text"
                placeholder="Search employee by name, code, or department..."
                class="w-full h-[42px] pl-9 pr-16 rounded-xl border text-xs font-medium focus:outline-none transition-all cursor-pointer"
                :class="[
                  selectedEmployeeId
                    ? 'bg-white border-cyan-500 text-gray-900 ring-1 ring-cyan-500 shadow-xs font-semibold'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500 hover:border-gray-400'
                ]"
                @focus="isEmployeeDropdownOpen = true"
                @input="isEmployeeDropdownOpen = true"
              />
              <div class="absolute right-2 flex items-center gap-1">
                <button
                  v-if="selectedEmployeeId || employeeSearchInput"
                  type="button"
                  class="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                  title="Clear selection"
                  @click="clearEmployeeSelection"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  class="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                  @click="isEmployeeDropdownOpen = !isEmployeeDropdownOpen"
                >
                  <UIcon
                    :name="isEmployeeDropdownOpen ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                    class="w-4 h-4"
                  />
                </button>
              </div>
            </div>

            <!-- Dropdown Menu -->
            <div
              v-if="isEmployeeDropdownOpen"
              class="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1 divide-y divide-gray-100"
            >
              <div
                v-if="filteredSearchEmployees.length === 0"
                class="px-4 py-3 text-center text-xs text-gray-400"
              >
                No employees matching "{{ employeeSearchInput }}"
              </div>
              <button
                v-for="emp in filteredSearchEmployees"
                :key="emp.id"
                type="button"
                class="w-full px-3.5 py-2.5 text-left text-xs hover:bg-cyan-50/70 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                :class="emp.id === selectedEmployeeId ? 'bg-cyan-50/50 text-cyan-900 font-bold' : 'text-gray-800'"
                @click="onSelectEmployeeFromDropdown(emp)"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {{ getInitials(emp.full_name) }}
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold truncate text-gray-900">{{ emp.full_name || 'Unnamed' }}</div>
                    <div class="text-[11px] text-gray-500 font-mono">
                      {{ emp.employee_code || 'NO-CODE' }} • {{ getDepartmentName(emp.department) }}
                    </div>
                  </div>
                </div>
                <UIcon
                  v-if="emp.id === selectedEmployeeId"
                  name="i-heroicons-check"
                  class="w-4 h-4 text-cyan-600 shrink-0"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Month & Year Navigator -->
        <div class="md:col-span-6 space-y-1">
          <label class="text-xs font-bold text-gray-800 flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-purple-600" />
              <span>Select Month</span>
            </span>
            <button
              v-if="!isCurrentMonthSelected"
              type="button"
              class="text-[10px] text-purple-700 font-bold hover:underline"
              @click="resetToCurrentMonth"
            >
              Jump to Current Month
            </button>
          </label>

          <div class="flex items-center gap-1.5 h-[42px]">
            <!-- Prev Month Button -->
            <button
              type="button"
              class="h-full px-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              title="Previous Month"
              @click="shiftMonth(-1)"
            >
              <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
            </button>

            <!-- Month Select -->
            <select
              v-model.number="selectedMonthIndex"
              class="flex-1 h-full px-2.5 rounded-xl bg-gray-50 hover:bg-white border border-gray-200 text-xs font-bold text-gray-800 focus:bg-white focus:border-purple-500 focus:outline-none transition-all cursor-pointer text-center"
            >
              <option v-for="(m, idx) in monthNames" :key="m.short" :value="idx">
                {{ m.full }}
              </option>
            </select>

            <!-- Year Select -->
            <select
              v-model.number="selectedYear"
              class="w-24 h-full px-2.5 rounded-xl bg-gray-50 hover:bg-white border border-gray-200 text-xs font-mono font-bold text-gray-800 focus:bg-white focus:border-purple-500 focus:outline-none transition-all cursor-pointer text-center"
            >
              <option v-for="y in availableYears" :key="y" :value="y">
                {{ y }}
              </option>
            </select>

            <!-- Next Month Button -->
            <button
              type="button"
              class="h-full px-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              title="Next Month"
              @click="shiftMonth(1)"
            >
              <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Secondary Filters & Search Row (Only relevant when employee selected) -->
      <div v-if="selectedEmployeeId" class="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
        <!-- Status Filter -->
        <div class="flex items-center gap-1.5 w-full sm:w-auto">
          <span class="text-[11px] font-semibold text-gray-500 whitespace-nowrap">Status:</span>
          <select
            v-model="selectedStatus"
            class="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-800 focus:bg-white focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Search in loaded records -->
        <div class="relative flex-1 w-full">
          <UIcon name="i-heroicons-magnifying-glass" class="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model.trim="searchQuery"
            type="text"
            placeholder="Filter current month records by reason, type, or approver..."
            class="w-full pl-8 pr-8 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:border-cyan-500 focus:outline-none"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="searchQuery = ''"
          >
            <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Monthly Summary Bar (When Employee is Selected) -->
    <div
      v-if="selectedEmployeeId && selectedEmployee"
      class="p-4 rounded-2xl bg-gradient-to-r from-cyan-900 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center font-bold text-base shadow-sm">
          {{ getInitials(selectedEmployee.full_name) }}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-base font-bold">{{ selectedEmployee.full_name }}</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
              {{ selectedEmployee.employee_code || 'N/A' }}
            </span>
          </div>
          <div class="text-xs text-cyan-200/80 mt-0.5">
            {{ getDepartmentName(selectedEmployee.department) }} • Month: <strong>{{ currentMonthLabel }}</strong>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 text-xs">
        <div class="bg-white/10 rounded-xl px-3 py-2 border border-white/10 text-center min-w-[90px]">
          <div class="text-lg font-bold text-cyan-300">{{ regularizations.length }}</div>
          <div class="text-[10px] text-gray-300">Regularizations</div>
        </div>
        <div class="bg-white/10 rounded-xl px-3 py-2 border border-white/10 text-center min-w-[90px]">
          <div class="text-lg font-bold text-purple-300">{{ leaves.length }}</div>
          <div class="text-[10px] text-gray-300">Leave Requests</div>
        </div>
        <div class="bg-white/10 rounded-xl px-3 py-2 border border-white/10 text-center min-w-[90px]">
          <div class="text-lg font-bold text-amber-300">{{ pendingCount }}</div>
          <div class="text-[10px] text-gray-300">Pending Approvals</div>
        </div>
      </div>
    </div>

    <!-- ================= STATE 1: NO EMPLOYEE SELECTED ================= -->
    <div
      v-if="!selectedEmployeeId"
      class="p-12 text-center bg-white rounded-3xl border border-gray-200 shadow-sm space-y-3"
    >
      <div class="w-16 h-16 rounded-3xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mx-auto shadow-sm">
        <UIcon name="i-heroicons-user-circle" class="w-8 h-8" />
      </div>

      <div class="space-y-1.5 max-w-md mx-auto">
        <h3 class="text-base font-bold text-gray-900">Select an Employee to View Request History</h3>
        <p class="text-xs text-gray-500 leading-relaxed">
          Please search and select an employee above to view their monthly attendance regularizations and leave applications.
        </p>
      </div>
    </div>

    <!-- ================= STATE 2: EMPLOYEE SELECTED (TABS & AUDIT LOGS) ================= -->
    <div v-else class="space-y-4">
      <!-- Tab Headers -->
      <div class="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-all cursor-pointer border-b-2"
          :class="[
            activeTab === 'regularizations'
              ? 'text-cyan-600 border-cyan-600 bg-cyan-50/50'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
          ]"
          @click="activeTab = 'regularizations'"
        >
          <UIcon name="i-heroicons-clipboard-document-list" class="w-4 h-4" />
          <span>Attendance Regularizations</span>
          <span
            class="px-2 py-0.5 rounded-full text-[10px] font-bold"
            :class="activeTab === 'regularizations' ? 'bg-cyan-100 text-cyan-800' : 'bg-gray-100 text-gray-600'"
          >
            {{ filteredRegularizations.length }}
          </span>
        </button>

        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-all cursor-pointer border-b-2"
          :class="[
            activeTab === 'leaves'
              ? 'text-purple-600 border-purple-600 bg-purple-50/50'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
          ]"
          @click="activeTab = 'leaves'"
        >
          <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
          <span>Leave Applications</span>
          <span
            class="px-2 py-0.5 rounded-full text-[10px] font-bold"
            :class="activeTab === 'leaves' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'"
          >
            {{ filteredLeaves.length }}
          </span>
        </button>
      </div>

      <!-- ================= TAB 1: REGULARIZATIONS ================= -->
      <div v-if="activeTab === 'regularizations'" class="space-y-3">
        <!-- Loading State -->
        <div v-if="isLoading" class="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-600" />
          <p class="text-xs font-medium text-gray-600">Loading regularizations for {{ currentMonthLabel }}...</p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredRegularizations.length === 0"
          class="p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-3"
        >
          <UIcon name="i-heroicons-clipboard-document-list" class="w-12 h-12 text-gray-300 mx-auto" />
          <div class="space-y-1">
            <h4 class="text-sm font-bold text-gray-800">No Regularization Records Found</h4>
            <p class="text-xs text-gray-500 max-w-md mx-auto">
              {{ selectedEmployee?.full_name }} has no attendance regularizations recorded for <strong>{{ currentMonthLabel }}</strong>.
            </p>
          </div>
          <div class="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
              @click="shiftMonth(-1)"
            >
              ← Check Previous Month
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
              @click="shiftMonth(1)"
            >
              Check Next Month →
            </button>
          </div>
        </div>

        <!-- Regularizations List Cards -->
        <div v-else class="space-y-3">
          <div
            v-for="reg in filteredRegularizations"
            :key="reg.id"
            class="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all space-y-3.5"
          >
            <!-- Top Row: Employee & Request Status -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {{ getInitials(reg.profiles?.full_name) }}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-gray-900 truncate">{{ reg.profiles?.full_name }}</span>
                    <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                      {{ reg.profiles?.employee_code || 'NO-CODE' }}
                    </span>
                  </div>
                  <div class="text-[11px] text-gray-500 flex items-center gap-2">
                    <span>Applied: {{ formatDateTime(reg.created_at) }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 self-start sm:self-auto">
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase" :class="getRegularizationTypeBadgeClass(reg.regularization_type)">
                  {{ formatRegularizationType(reg.regularization_type) }}
                </span>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase border" :class="getStatusBadgeClass(reg.status)">
                  {{ (reg.status || 'pending').toUpperCase() }}
                </span>
              </div>
            </div>

            <!-- Middle Row: Timing Changes & Reason -->
            <div class="p-3 rounded-xl bg-gray-50/80 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <!-- Punches Comparison -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-gray-500">Punch In:</span>
                  <span class="font-mono text-gray-800">
                    <span class="line-through text-gray-400 mr-1">{{ formatDateTime(reg.original_punch_in) }}</span>
                    <UIcon name="i-heroicons-arrow-right" class="w-3 h-3 text-cyan-500 inline mx-0.5" />
                    <strong class="text-cyan-700">{{ formatDateTime(reg.requested_punch_in) }}</strong>
                  </span>
                </div>
                <div v-if="reg.original_punch_out || reg.requested_punch_out" class="flex items-center justify-between text-[11px]">
                  <span class="text-gray-500">Punch Out:</span>
                  <span class="font-mono text-gray-800">
                    <span class="line-through text-gray-400 mr-1">{{ formatDateTime(reg.original_punch_out) }}</span>
                    <UIcon name="i-heroicons-arrow-right" class="w-3 h-3 text-cyan-500 inline mx-0.5" />
                    <strong class="text-cyan-700">{{ formatDateTime(reg.requested_punch_out) }}</strong>
                  </span>
                </div>
              </div>

              <!-- Reason -->
              <div class="space-y-0.5">
                <span class="text-[11px] font-semibold text-gray-500">Reason / Notes:</span>
                <p class="text-gray-800 text-xs italic line-clamp-2">
                  "{{ reg.reason || 'No specific reason entered' }}"
                </p>
              </div>
            </div>

            <!-- Bottom Row: Multi-Level Approval Pipeline -->
            <div class="pt-2 border-t border-gray-100">
              <div class="text-[11px] font-bold text-gray-500 mb-2 flex items-center justify-between">
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-shield-check" class="w-3.5 h-3.5 text-cyan-600" />
                  <span>Approval Pipeline ({{ reg.approval_levels || 1 }} Level{{ (reg.approval_levels || 1) > 1 ? 's' : '' }})</span>
                </span>
                <button
                  type="button"
                  class="text-xs font-bold text-cyan-600 hover:text-cyan-800 hover:underline flex items-center gap-1 cursor-pointer"
                  @click="openDetailModal(reg, 'regularization')"
                >
                  <span>Full Audit Details</span>
                  <UIcon name="i-heroicons-chevron-right" class="w-3 h-3" />
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <!-- Level 1 Approver Card -->
                <div
                  class="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                  :class="getLevelBoxClass(reg.level_1_status)"
                >
                  <div class="min-w-0 pr-2">
                    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <span>L1 Approver</span>
                      <span v-if="reg.approval_levels === 1" class="text-[9px] bg-cyan-100 text-cyan-700 px-1 rounded">Final</span>
                    </div>
                    <div class="font-bold text-gray-900 truncate">
                      {{ getApproverName(reg.level_1_approver_id) }}
                    </div>
                    <div v-if="reg.level_1_action_at" class="text-[10px] text-gray-500 font-mono">
                      {{ formatDateTime(reg.level_1_action_at) }}
                    </div>
                    <div v-else class="text-[10px] text-amber-600 italic">
                      Awaiting action
                    </div>
                  </div>
                  <div class="shrink-0">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" :class="getLevelStatusPillClass(reg.level_1_status)">
                      {{ reg.level_1_status || 'pending' }}
                    </span>
                  </div>
                </div>

                <!-- Level 2 Approver Card -->
                <div
                  v-if="(reg.approval_levels && reg.approval_levels >= 2) || reg.level_2_approver_id || reg.level_2_status"
                  class="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                  :class="getLevelBoxClass(reg.level_2_status)"
                >
                  <div class="min-w-0 pr-2">
                    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <span>L2 Approver</span>
                      <span v-if="reg.approval_levels === 2" class="text-[9px] bg-cyan-100 text-cyan-700 px-1 rounded">Final</span>
                    </div>
                    <div class="font-bold text-gray-900 truncate">
                      {{ getApproverName(reg.level_2_approver_id) }}
                    </div>
                    <div v-if="reg.level_2_action_at" class="text-[10px] text-gray-500 font-mono">
                      {{ formatDateTime(reg.level_2_action_at) }}
                    </div>
                    <div v-else class="text-[10px] text-amber-600 italic">
                      {{ reg.level_1_status === 'approved' ? 'Awaiting action' : 'Pending L1' }}
                    </div>
                  </div>
                  <div class="shrink-0">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" :class="getLevelStatusPillClass(reg.level_2_status)">
                      {{ reg.level_2_status || 'pending' }}
                    </span>
                  </div>
                </div>

                <!-- Level 3 Approver Card -->
                <div
                  v-if="(reg.approval_levels && reg.approval_levels >= 3) || reg.level_3_approver_id || reg.level_3_status"
                  class="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                  :class="getLevelBoxClass(reg.level_3_status)"
                >
                  <div class="min-w-0 pr-2">
                    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <span>L3 Approver</span>
                      <span class="text-[9px] bg-cyan-100 text-cyan-700 px-1 rounded">Final</span>
                    </div>
                    <div class="font-bold text-gray-900 truncate">
                      {{ getApproverName(reg.level_3_approver_id) }}
                    </div>
                    <div v-if="reg.level_3_action_at" class="text-[10px] text-gray-500 font-mono">
                      {{ formatDateTime(reg.level_3_action_at) }}
                    </div>
                    <div v-else class="text-[10px] text-amber-600 italic">
                      {{ reg.level_2_status === 'approved' ? 'Awaiting action' : 'Pending previous' }}
                    </div>
                  </div>
                  <div class="shrink-0">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" :class="getLevelStatusPillClass(reg.level_3_status)">
                      {{ reg.level_3_status || 'pending' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= TAB 2: LEAVE APPLICATIONS ================= -->
      <div v-if="activeTab === 'leaves'" class="space-y-3">
        <!-- Loading State -->
        <div v-if="isLoading" class="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
          <p class="text-xs font-medium text-gray-600">Loading leave requests for {{ currentMonthLabel }}...</p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredLeaves.length === 0"
          class="p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-3"
        >
          <UIcon name="i-heroicons-calendar-days" class="w-12 h-12 text-gray-300 mx-auto" />
          <div class="space-y-1">
            <h4 class="text-sm font-bold text-gray-800">No Leave Applications Found</h4>
            <p class="text-xs text-gray-500 max-w-md mx-auto">
              {{ selectedEmployee?.full_name }} has no leave applications recorded for <strong>{{ currentMonthLabel }}</strong>.
            </p>
          </div>
          <div class="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
              @click="shiftMonth(-1)"
            >
              ← Check Previous Month
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
              @click="shiftMonth(1)"
            >
              Check Next Month →
            </button>
          </div>
        </div>

        <!-- Leaves List Cards -->
        <div v-else class="space-y-3">
          <div
            v-for="leave in filteredLeaves"
            :key="leave.id"
            class="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all space-y-3.5"
          >
            <!-- Top Row: Employee & Status -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {{ getInitials(leave.profiles?.full_name) }}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-gray-900 truncate">{{ leave.profiles?.full_name }}</span>
                    <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                      {{ leave.profiles?.employee_code || 'NO-CODE' }}
                    </span>
                  </div>
                  <div class="text-[11px] text-gray-500 flex items-center gap-2">
                    <span>Applied: {{ formatDateTime(leave.created_at) }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 self-start sm:self-auto">
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase bg-purple-100 text-purple-800 border border-purple-200">
                  {{ leave.leave_types?.leave_name || 'Leave' }}
                </span>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase border" :class="getStatusBadgeClass(leave.status)">
                  {{ (leave.status || 'pending').toUpperCase() }}
                </span>
              </div>
            </div>

            <!-- Middle Row: Dates & Reason -->
            <div class="p-3 rounded-xl bg-gray-50/80 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <!-- Leave Duration -->
              <div class="space-y-1">
                <span class="text-[11px] font-semibold text-gray-500">Leave Duration:</span>
                <div class="flex items-center gap-2 font-mono text-gray-900">
                  <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-purple-500 shrink-0" />
                  <span class="font-bold text-sm">{{ formatDateOnly(leave.start_date) }}</span>
                  <span class="text-gray-400">to</span>
                  <span class="font-bold text-sm">{{ formatDateOnly(leave.end_date) }}</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 ml-1">
                    {{ leave.total_days }} Day{{ Number(leave.total_days) === 1 ? '' : 's' }}
                  </span>
                </div>
              </div>

              <!-- Reason -->
              <div class="space-y-0.5">
                <span class="text-[11px] font-semibold text-gray-500">Reason / Notes:</span>
                <p class="text-gray-800 text-xs italic line-clamp-2">
                  "{{ leave.reason || 'No specific reason entered' }}"
                </p>
              </div>
            </div>

            <!-- Bottom Row: Approval Pipeline -->
            <div class="pt-2 border-t border-gray-100">
              <div class="text-[11px] font-bold text-gray-500 mb-2 flex items-center justify-between">
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-shield-check" class="w-3.5 h-3.5 text-purple-600" />
                  <span>Approval Pipeline ({{ leave.approval_levels || 1 }} Level{{ (leave.approval_levels || 1) > 1 ? 's' : '' }})</span>
                </span>
                <button
                  type="button"
                  class="text-xs font-bold text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1 cursor-pointer"
                  @click="openDetailModal(leave, 'leave')"
                >
                  <span>Full Audit Details</span>
                  <UIcon name="i-heroicons-chevron-right" class="w-3 h-3" />
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <!-- L1 Approver -->
                <div
                  class="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                  :class="getLevelBoxClass(leave.level_1_status)"
                >
                  <div class="min-w-0 pr-2">
                    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <span>L1 Approver</span>
                      <span v-if="leave.approval_levels === 1" class="text-[9px] bg-purple-100 text-purple-700 px-1 rounded">Final</span>
                    </div>
                    <div class="font-bold text-gray-900 truncate">
                      {{ getApproverName(leave.level_1_approver_id) }}
                    </div>
                    <div v-if="leave.level_1_action_at" class="text-[10px] text-gray-500 font-mono">
                      {{ formatDateTime(leave.level_1_action_at) }}
                    </div>
                    <div v-else class="text-[10px] text-amber-600 italic">
                      Awaiting action
                    </div>
                  </div>
                  <div class="shrink-0">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" :class="getLevelStatusPillClass(leave.level_1_status)">
                      {{ leave.level_1_status || 'pending' }}
                    </span>
                  </div>
                </div>

                <!-- L2 Approver -->
                <div
                  v-if="(leave.approval_levels && leave.approval_levels >= 2) || leave.level_2_approver_id || leave.level_2_status"
                  class="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                  :class="getLevelBoxClass(leave.level_2_status)"
                >
                  <div class="min-w-0 pr-2">
                    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <span>L2 Approver</span>
                      <span v-if="leave.approval_levels === 2" class="text-[9px] bg-purple-100 text-purple-700 px-1 rounded">Final</span>
                    </div>
                    <div class="font-bold text-gray-900 truncate">
                      {{ getApproverName(leave.level_2_approver_id) }}
                    </div>
                    <div v-if="leave.level_2_action_at" class="text-[10px] text-gray-500 font-mono">
                      {{ formatDateTime(leave.level_2_action_at) }}
                    </div>
                    <div v-else class="text-[10px] text-amber-600 italic">
                      {{ leave.level_1_status === 'approved' ? 'Awaiting action' : 'Pending L1' }}
                    </div>
                  </div>
                  <div class="shrink-0">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" :class="getLevelStatusPillClass(leave.level_2_status)">
                      {{ leave.level_2_status || 'pending' }}
                    </span>
                  </div>
                </div>

                <!-- L3 Approver -->
                <div
                  v-if="(leave.approval_levels && leave.approval_levels >= 3) || leave.level_3_approver_id || leave.level_3_status"
                  class="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                  :class="getLevelBoxClass(leave.level_3_status)"
                >
                  <div class="min-w-0 pr-2">
                    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <span>L3 Approver</span>
                      <span class="text-[9px] bg-purple-100 text-purple-700 px-1 rounded">Final</span>
                    </div>
                    <div class="font-bold text-gray-900 truncate">
                      {{ getApproverName(leave.level_3_approver_id) }}
                    </div>
                    <div v-if="leave.level_3_action_at" class="text-[10px] text-gray-500 font-mono">
                      {{ formatDateTime(leave.level_3_action_at) }}
                    </div>
                    <div v-else class="text-[10px] text-amber-600 italic">
                      {{ leave.level_2_status === 'approved' ? 'Awaiting action' : 'Pending previous' }}
                    </div>
                  </div>
                  <div class="shrink-0">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" :class="getLevelStatusPillClass(leave.level_3_status)">
                      {{ leave.level_3_status || 'pending' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= READ-ONLY AUDIT DETAILS MODAL ================= -->
    <div
      v-if="isModalOpen && selectedItem"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click.self="isModalOpen = false"
    >
      <div class="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl" :class="modalType === 'regularization' ? 'bg-cyan-50 text-cyan-600' : 'bg-purple-50 text-purple-600'">
              <UIcon :name="modalType === 'regularization' ? 'i-heroicons-clipboard-document-list' : 'i-heroicons-calendar-days'" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-base font-bold text-gray-900">
                {{ modalType === 'regularization' ? 'Regularization Audit Details' : 'Leave Application Audit Details' }}
              </h3>
              <p class="text-xs text-gray-500">
                Applied by {{ selectedItem.profiles?.full_name }} • {{ formatDateTime(selectedItem.created_at) }}
              </p>
            </div>
          </div>
          <button class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer" @click="isModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Read-Only Notice -->
        <div class="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-800 flex items-center gap-2">
          <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Administrator Audit Mode:</strong> This read-only log details the exact multi-level manager hierarchy approval trail, timestamps, and notes.
          </span>
        </div>

        <!-- Employee Info Card -->
        <div class="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {{ getInitials(selectedItem.profiles?.full_name) }}
            </div>
            <div>
              <div class="text-sm font-bold text-gray-900">{{ selectedItem.profiles?.full_name }}</div>
              <div class="text-xs text-gray-500">{{ selectedItem.profiles?.email }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs font-mono font-bold text-gray-700">{{ selectedItem.profiles?.employee_code }}</div>
            <div class="text-[11px] text-gray-500">{{ getDepartmentName(selectedItem.profiles?.department) }}</div>
          </div>
        </div>

        <!-- Request Specific Information -->
        <div v-if="modalType === 'regularization'" class="space-y-3">
          <h4 class="text-xs font-bold text-gray-800 uppercase tracking-wider">Attendance Adjustments</h4>
          <div class="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
            <div>
              <span class="text-gray-500 block text-[11px]">Regularization Type</span>
              <span class="font-bold text-gray-900">{{ formatRegularizationType(selectedItem.regularization_type) }}</span>
            </div>
            <div>
              <span class="text-gray-500 block text-[11px]">Current Status</span>
              <span class="font-bold capitalize" :class="getStatusTextColor(selectedItem.status)">{{ selectedItem.status || 'pending' }}</span>
            </div>
            <div class="col-span-2 pt-2 border-t border-gray-200/70">
              <span class="text-gray-500 block text-[11px]">Punch In Change</span>
              <div class="font-mono">
                <span class="line-through text-gray-400">{{ formatDateTime(selectedItem.original_punch_in) }}</span>
                <UIcon name="i-heroicons-arrow-right" class="w-3 h-3 text-cyan-600 inline mx-1" />
                <strong class="text-cyan-700">{{ formatDateTime(selectedItem.requested_punch_in) }}</strong>
              </div>
            </div>
            <div v-if="selectedItem.original_punch_out || selectedItem.requested_punch_out" class="col-span-2 pt-2 border-t border-gray-200/70">
              <span class="text-gray-500 block text-[11px]">Punch Out Change</span>
              <div class="font-mono">
                <span class="line-through text-gray-400">{{ formatDateTime(selectedItem.original_punch_out) }}</span>
                <UIcon name="i-heroicons-arrow-right" class="w-3 h-3 text-cyan-600 inline mx-1" />
                <strong class="text-cyan-700">{{ formatDateTime(selectedItem.requested_punch_out) }}</strong>
              </div>
            </div>
            <div class="col-span-2 pt-2 border-t border-gray-200/70">
              <span class="text-gray-500 block text-[11px]">Staff Submission Reason</span>
              <p class="text-gray-800 italic mt-0.5">"{{ selectedItem.reason || 'None provided' }}"</p>
            </div>
          </div>
        </div>

        <div v-else class="space-y-3">
          <h4 class="text-xs font-bold text-gray-800 uppercase tracking-wider">Leave Application Details</h4>
          <div class="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
            <div>
              <span class="text-gray-500 block text-[11px]">Category</span>
              <span class="font-bold text-gray-900">{{ selectedItem.leave_types?.leave_name || 'Leave' }}</span>
            </div>
            <div>
              <span class="text-gray-500 block text-[11px]">Total Days</span>
              <span class="font-bold text-purple-700 font-mono text-sm">{{ selectedItem.total_days }} Days</span>
            </div>
            <div class="col-span-2 pt-2 border-t border-gray-200/70">
              <span class="text-gray-500 block text-[11px]">Duration Period</span>
              <span class="font-bold text-gray-900 font-mono">{{ formatDateOnly(selectedItem.start_date) }} to {{ formatDateOnly(selectedItem.end_date) }}</span>
            </div>
            <div class="col-span-2 pt-2 border-t border-gray-200/70">
              <span class="text-gray-500 block text-[11px]">Application Reason</span>
              <p class="text-gray-800 italic mt-0.5">"{{ selectedItem.reason || 'None provided' }}"</p>
            </div>
          </div>
        </div>

        <!-- Multi-Level Approval Timeline Audit Details -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center justify-between">
            <span>Multi-Level Approval Timeline</span>
            <span class="text-[10px] text-gray-500 font-normal">
              Final Approval: {{ formatDateTime(selectedItem.final_approved_at) }}
            </span>
          </h4>

          <div class="space-y-3">
            <!-- Level 1 Card -->
            <div class="p-3.5 rounded-2xl border bg-white space-y-1.5" :class="getLevelBoxClass(selectedItem.level_1_status)">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-gray-200 text-gray-700 font-bold text-[10px] flex items-center justify-center">1</span>
                  <span class="text-xs font-bold text-gray-900">Level 1 Approver</span>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" :class="getLevelStatusPillClass(selectedItem.level_1_status)">
                  {{ selectedItem.level_1_status || 'pending' }}
                </span>
              </div>
              <div class="text-xs text-gray-700 pl-7">
                <strong>{{ getApproverName(selectedItem.level_1_approver_id) }}</strong>
                <span v-if="getApproverCode(selectedItem.level_1_approver_id)" class="text-gray-400 text-[11px] ml-1 font-mono">
                  ({{ getApproverCode(selectedItem.level_1_approver_id) }})
                </span>
              </div>
              <div class="text-[11px] text-gray-500 pl-7 flex items-center gap-2">
                <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
                <span>Action Timestamp: {{ formatDateTime(selectedItem.level_1_action_at) }}</span>
              </div>
              <div v-if="selectedItem.level_1_comments" class="text-xs text-gray-800 bg-gray-50 p-2 rounded-xl border border-gray-200 ml-7 italic">
                Comments: "{{ selectedItem.level_1_comments }}"
              </div>
            </div>

            <!-- Level 2 Card -->
            <div
              v-if="(selectedItem.approval_levels && selectedItem.approval_levels >= 2) || selectedItem.level_2_approver_id || selectedItem.level_2_status"
              class="p-3.5 rounded-2xl border bg-white space-y-1.5"
              :class="getLevelBoxClass(selectedItem.level_2_status)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-gray-200 text-gray-700 font-bold text-[10px] flex items-center justify-center">2</span>
                  <span class="text-xs font-bold text-gray-900">Level 2 Approver</span>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" :class="getLevelStatusPillClass(selectedItem.level_2_status)">
                  {{ selectedItem.level_2_status || 'pending' }}
                </span>
              </div>
              <div class="text-xs text-gray-700 pl-7">
                <strong>{{ getApproverName(selectedItem.level_2_approver_id) }}</strong>
                <span v-if="getApproverCode(selectedItem.level_2_approver_id)" class="text-gray-400 text-[11px] ml-1 font-mono">
                  ({{ getApproverCode(selectedItem.level_2_approver_id) }})
                </span>
              </div>
              <div class="text-[11px] text-gray-500 pl-7 flex items-center gap-2">
                <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
                <span>Action Timestamp: {{ formatDateTime(selectedItem.level_2_action_at) }}</span>
              </div>
              <div v-if="selectedItem.level_2_comments" class="text-xs text-gray-800 bg-gray-50 p-2 rounded-xl border border-gray-200 ml-7 italic">
                Comments: "{{ selectedItem.level_2_comments }}"
              </div>
            </div>

            <!-- Level 3 Card -->
            <div
              v-if="(selectedItem.approval_levels && selectedItem.approval_levels >= 3) || selectedItem.level_3_approver_id || selectedItem.level_3_status"
              class="p-3.5 rounded-2xl border bg-white space-y-1.5"
              :class="getLevelBoxClass(selectedItem.level_3_status)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-gray-200 text-gray-700 font-bold text-[10px] flex items-center justify-center">3</span>
                  <span class="text-xs font-bold text-gray-900">Level 3 Approver</span>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" :class="getLevelStatusPillClass(selectedItem.level_3_status)">
                  {{ selectedItem.level_3_status || 'pending' }}
                </span>
              </div>
              <div class="text-xs text-gray-700 pl-7">
                <strong>{{ getApproverName(selectedItem.level_3_approver_id) }}</strong>
                <span v-if="getApproverCode(selectedItem.level_3_approver_id)" class="text-gray-400 text-[11px] ml-1 font-mono">
                  ({{ getApproverCode(selectedItem.level_3_approver_id) }})
                </span>
              </div>
              <div class="text-[11px] text-gray-500 pl-7 flex items-center gap-2">
                <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
                <span>Action Timestamp: {{ formatDateTime(selectedItem.level_3_action_at) }}</span>
              </div>
              <div v-if="selectedItem.level_3_comments" class="text-xs text-gray-800 bg-gray-50 p-2 rounded-xl border border-gray-200 ml-7 italic">
                Comments: "{{ selectedItem.level_3_comments }}"
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            class="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 cursor-pointer"
            @click="isModalOpen = false"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useAdminStore } from "~/stores/admin";
import { formatDateTime, formatDate as formatDateOnly, formatRegularizationType, getInitials } from "~/utils/formatter";

const adminStore = useAdminStore();
const supabase = useSupabaseClient();
const route = useRoute();

// Tab state
const activeTab = ref<"regularizations" | "leaves">("regularizations");
const isLoading = ref(false);
const isRefreshing = ref(false);

// Employee selector & Search state
const selectedEmployeeId = ref<string>("");
const employeeSearchInput = ref("");
const isEmployeeDropdownOpen = ref(false);
const employeeDropdownRef = ref<HTMLElement | null>(null);

// Month filter state
const monthNames = [
  { short: "Jan", full: "January" },
  { short: "Feb", full: "February" },
  { short: "Mar", full: "March" },
  { short: "Apr", full: "April" },
  { short: "May", full: "May" },
  { short: "Jun", full: "June" },
  { short: "Jul", full: "July" },
  { short: "Aug", full: "August" },
  { short: "Sep", full: "September" },
  { short: "Oct", full: "October" },
  { short: "Nov", full: "November" },
  { short: "Dec", full: "December" },
];

const availableYears = [2024, 2025, 2026, 2027];

const today = new Date();
const selectedMonthIndex = ref<number>(today.getMonth());
const selectedYear = ref<number>(today.getFullYear());

// Secondary in-memory filter states
const selectedStatus = ref<string>("ALL");
const searchQuery = ref("");

// Raw data state (Only holds current employee's current month records)
const regularizations = ref<any[]>([]);
const leaves = ref<any[]>([]);
const approverMap = ref<Map<string, { id: string; full_name: string; employee_code?: string; email?: string }>>(new Map());

// Modal state
const isModalOpen = ref(false);
const modalType = ref<"regularization" | "leave">("regularization");
const selectedItem = ref<any | null>(null);

const currentMonthLabel = computed(() => {
  return `${monthNames[selectedMonthIndex.value]?.full || ''} ${selectedYear.value}`;
});

const isCurrentMonthSelected = computed(() => {
  return selectedMonthIndex.value === today.getMonth() && selectedYear.value === today.getFullYear();
});

function resetToCurrentMonth() {
  selectedMonthIndex.value = today.getMonth();
  selectedYear.value = today.getFullYear();
}

function shiftMonth(offset: number) {
  let m = selectedMonthIndex.value + offset;
  let y = selectedYear.value;
  if (m < 0) {
    m = 11;
    y--;
  } else if (m > 11) {
    m = 0;
    y++;
  }
  selectedMonthIndex.value = m;
  selectedYear.value = y;
}

const selectedEmployee = computed(() => {
  if (!selectedEmployeeId.value) return null;
  return adminStore.employees.find((e) => e.id === selectedEmployeeId.value) || null;
});

const sortedEmployees = computed(() => {
  return [...adminStore.employees].sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
});

function selectEmployee(id: string) {
  selectedEmployeeId.value = id;
}

// Approvers helper
function getApproverName(id?: string | null): string {
  if (!id) return "N/A";
  if (approverMap.value.has(id)) {
    return approverMap.value.get(id)?.full_name || "Manager";
  }
  const emp = adminStore.employees.find((e) => e.id === id);
  if (emp?.full_name) return emp.full_name;
  return "Assigned Manager";
}

function getApproverCode(id?: string | null): string {
  if (!id) return "";
  if (approverMap.value.has(id)) {
    return approverMap.value.get(id)?.employee_code || "";
  }
  const emp = adminStore.employees.find((e) => e.id === id);
  return emp?.employee_code || "";
}

function getDepartmentName(deptId?: number | null): string {
  return adminStore.getDepartmentName(deptId || null);
}

// Counts for loaded employee's month
const pendingCount = computed(() => {
  const regP = regularizations.value.filter((r) => (r.status || "pending") === "pending").length;
  const lP = leaves.value.filter((l) => (l.status || "pending") === "pending").length;
  return regP + lP;
});

const currentTabCount = computed(() => {
  return activeTab.value === 'regularizations' ? filteredRegularizations.value.length : filteredLeaves.value.length;
});

// Filtered Lists (Secondary filter in memory on the employee's monthly data)
const filteredRegularizations = computed(() => {
  return regularizations.value.filter((reg) => {
    // Status filter
    if (selectedStatus.value !== "ALL") {
      const s = (reg.status || "pending").toLowerCase();
      if (s !== selectedStatus.value.toLowerCase()) return false;
    }

    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const reason = (reg.reason || "").toLowerCase();
      const type = (reg.regularization_type || "").toLowerCase();
      const l1 = getApproverName(reg.level_1_approver_id).toLowerCase();
      const l2 = getApproverName(reg.level_2_approver_id).toLowerCase();

      if (
        !reason.includes(q) &&
        !type.includes(q) &&
        !l1.includes(q) &&
        !l2.includes(q)
      ) {
        return false;
      }
    }

    return true;
  });
});

const filteredLeaves = computed(() => {
  return leaves.value.filter((leave) => {
    // Status filter
    if (selectedStatus.value !== "ALL") {
      const s = (leave.status || "pending").toLowerCase();
      if (s !== selectedStatus.value.toLowerCase()) return false;
    }

    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const reason = (leave.reason || "").toLowerCase();
      const type = (leave.leave_types?.leave_name || "").toLowerCase();
      const l1 = getApproverName(leave.level_1_approver_id).toLowerCase();
      const l2 = getApproverName(leave.level_2_approver_id).toLowerCase();

      if (
        !reason.includes(q) &&
        !type.includes(q) &&
        !l1.includes(q) &&
        !l2.includes(q)
      ) {
        return false;
      }
    }

    return true;
  });
});

// Modal function
function openDetailModal(item: any, type: "regularization" | "leave") {
  selectedItem.value = item;
  modalType.value = type;
  isModalOpen.value = true;
}

// Style helpers
function getStatusBadgeClass(status?: string | null): string {
  const s = (status || "pending").toLowerCase();
  if (s === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "rejected") return "bg-rose-50 text-rose-700 border-rose-200";
  if (s === "cancelled") return "bg-gray-100 text-gray-700 border-gray-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function getStatusTextColor(status?: string | null): string {
  const s = (status || "pending").toLowerCase();
  if (s === "approved") return "text-emerald-700";
  if (s === "rejected") return "text-rose-700";
  return "text-amber-700";
}

function getRegularizationTypeBadgeClass(type?: string | null): string {
  const t = (type || "").toLowerCase();
  if (t === "late_arrival") return "bg-amber-50 text-amber-800 border border-amber-200";
  if (t === "missed_swipe") return "bg-blue-50 text-blue-800 border border-blue-200";
  if (t === "outdoor_client_visit") return "bg-indigo-50 text-indigo-800 border border-indigo-200";
  return "bg-gray-100 text-gray-800 border border-gray-200";
}

function getLevelBoxClass(status?: string | null): string {
  const s = (status || "pending").toLowerCase();
  if (s === "approved") return "bg-emerald-50/50 border-emerald-200";
  if (s === "rejected") return "bg-rose-50/50 border-rose-200";
  if (s === "bypassed") return "bg-gray-50 border-gray-200";
  return "bg-amber-50/40 border-amber-200";
}

function getLevelStatusPillClass(status?: string | null): string {
  const s = (status || "pending").toLowerCase();
  if (s === "approved") return "bg-emerald-100 text-emerald-800";
  if (s === "rejected") return "bg-rose-100 text-rose-800";
  if (s === "bypassed") return "bg-gray-200 text-gray-700";
  return "bg-amber-100 text-amber-800";
}

// ================= CORE FETCH LOGIC (Targeted Monthly Single Employee Only) =================
async function fetchEmployeeMonthlyData(force = false) {
  // CRITICAL: If no employee is selected, DO NOT query Supabase (zero egress)
  if (!selectedEmployeeId.value) {
    regularizations.value = [];
    leaves.value = [];
    return;
  }

  if (force) isRefreshing.value = true;
  else isLoading.value = true;

  try {
    const y = selectedYear.value;
    const m = selectedMonthIndex.value;

    // ISO timestamp range for the selected month (UTC)
    const isoStart = new Date(Date.UTC(y, m, 1, 0, 0, 0)).toISOString();
    const isoEnd = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999)).toISOString();

    // Date string range YYYY-MM-DD
    const dateStart = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDayOfMonth = new Date(y, m + 1, 0).getDate();
    const dateEnd = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

    // Targeted queries filtered STRICTLY on employee_id and date boundaries
    const [regByPunch, regByCreated, leaveByDate, leaveByCreated] = await Promise.all([
      (supabase as any)
        .from("attendance_regularizations")
        .select(`
          *,
          profiles!attendance_regularizations_employee_id_fkey(
            id,
            employee_code,
            full_name,
            email,
            department,
            position
          )
        `)
        .eq("employee_id", selectedEmployeeId.value)
        .gte("requested_punch_in", isoStart)
        .lte("requested_punch_in", isoEnd)
        .order("created_at", { ascending: false }),

      (supabase as any)
        .from("attendance_regularizations")
        .select(`
          *,
          profiles!attendance_regularizations_employee_id_fkey(
            id,
            employee_code,
            full_name,
            email,
            department,
            position
          )
        `)
        .eq("employee_id", selectedEmployeeId.value)
        .gte("created_at", isoStart)
        .lte("created_at", isoEnd)
        .order("created_at", { ascending: false }),

      (supabase as any)
        .from("leave_applications")
        .select(`
          *,
          profiles!leave_applications_employee_id_fkey(
            id,
            employee_code,
            full_name,
            email,
            department,
            position
          ),
          leave_types(
            id,
            leave_name,
            leave_code
          )
        `)
        .eq("employee_id", selectedEmployeeId.value)
        .lte("start_date", dateEnd)
        .gte("end_date", dateStart)
        .order("created_at", { ascending: false }),

      (supabase as any)
        .from("leave_applications")
        .select(`
          *,
          profiles!leave_applications_employee_id_fkey(
            id,
            employee_code,
            full_name,
            email,
            department,
            position
          ),
          leave_types(
            id,
            leave_name,
            leave_code
          )
        `)
        .eq("employee_id", selectedEmployeeId.value)
        .gte("created_at", isoStart)
        .lte("created_at", isoEnd)
        .order("created_at", { ascending: false }),
    ]);

    // Merge and deduplicate regularizations by ID
    const regMap = new Map<number, any>();
    [...(regByPunch.data || []), ...(regByCreated.data || [])].forEach((r) => {
      regMap.set(r.id, r);
    });
    regularizations.value = Array.from(regMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Merge and deduplicate leaves by ID
    const leaveMap = new Map<number, any>();
    [...(leaveByDate.data || []), ...(leaveByCreated.data || [])].forEach((l) => {
      leaveMap.set(l.id, l);
    });
    leaves.value = Array.from(leaveMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Resolve approver names for this specific set
    const neededApproverIds = new Set<string>();
    [...regularizations.value, ...leaves.value].forEach((item) => {
      if (item.level_1_approver_id) neededApproverIds.add(item.level_1_approver_id);
      if (item.level_2_approver_id) neededApproverIds.add(item.level_2_approver_id);
      if (item.level_3_approver_id) neededApproverIds.add(item.level_3_approver_id);
    });

    // Populate from adminStore
    adminStore.employees.forEach((emp) => {
      approverMap.value.set(emp.id, {
        id: emp.id,
        full_name: emp.full_name || "Manager",
        employee_code: emp.employee_code || "",
        email: emp.email,
      });
    });

    const missingIds = Array.from(neededApproverIds).filter((id) => !approverMap.value.has(id));
    if (missingIds.length > 0) {
      const { data: missingProfiles } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, employee_code, email")
        .in("id", missingIds);

      (missingProfiles || []).forEach((p: any) => {
        approverMap.value.set(p.id, p);
      });
    }
  } catch (err: any) {
    console.error("Failed to load employee monthly audit data:", err);
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
  }
}

// Watchers: automatically fetch ONLY when an employee is selected, and on month changes
watch([selectedEmployeeId, selectedMonthIndex, selectedYear], () => {
  if (selectedEmployeeId.value) {
    fetchEmployeeMonthlyData();
  } else {
    regularizations.value = [];
    leaves.value = [];
  }
});

// CSV Export Utilities
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return "null";
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportCurrentViewCSV() {
  if (activeTab.value === "regularizations") {
    exportRegularizationsCSV();
  } else {
    exportLeavesCSV();
  }
}

function exportRegularizationsCSV() {
  const rows = filteredRegularizations.value;
  if (!rows || rows.length === 0) {
    alert("No regularization records available to export for this month.");
    return;
  }

  // Exact header matching user's CSV:
  // Applied At,Type,Original Punch In,Requested Punch In,Reason,L1 Approver Name,L1 Status,L1 Action Time,L2 Approver Name,L2 Status,L2 Action Time
  const headers = [
    "Applied At",
    "Type",
    "Original Punch In",
    "Requested Punch In",
    "Reason",
    "L1 Approver Name",
    "L1 Status",
    "L1 Action Time",
    "L2 Approver Name",
    "L2 Status",
    "L2 Action Time",
    "L3 Approver Name",
    "L3 Status",
    "L3 Action Time",
    "Final Status",
  ];

  const csvRows = rows.map((r: any) => [
    escapeCsv(r.created_at || ""),
    escapeCsv(r.regularization_type || ""),
    escapeCsv(r.original_punch_in || "null"),
    escapeCsv(r.requested_punch_in || "null"),
    escapeCsv(r.reason || "null"),
    escapeCsv(getApproverName(r.level_1_approver_id)),
    escapeCsv(r.level_1_status || "pending"),
    escapeCsv(r.level_1_action_at || "null"),
    escapeCsv(getApproverName(r.level_2_approver_id)),
    escapeCsv(r.level_2_status || "pending"),
    escapeCsv(r.level_2_action_at || "null"),
    escapeCsv(r.level_3_approver_id ? getApproverName(r.level_3_approver_id) : "null"),
    escapeCsv(r.level_3_status || "null"),
    escapeCsv(r.level_3_action_at || "null"),
    escapeCsv(r.status || "pending"),
  ]);

  const csvContent = [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n");

  const empName = selectedEmployee.value?.full_name
    ? selectedEmployee.value.full_name.trim().split(" ")[0]
    : "Employee";
  const monthName = (monthNames[selectedMonthIndex.value]?.full || "month").toLowerCase();

  downloadCSV(csvContent, `${empName}_${monthName}_regularizations.csv`);
}

function exportLeavesCSV() {
  const rows = filteredLeaves.value;
  if (!rows || rows.length === 0) {
    alert("No leave application records available to export for this month.");
    return;
  }

  const headers = [
    "Applied At",
    "Leave Type",
    "Start Date",
    "End Date",
    "Total Days",
    "Reason",
    "L1 Approver Name",
    "L1 Status",
    "L1 Action Time",
    "L2 Approver Name",
    "L2 Status",
    "L2 Action Time",
    "L3 Approver Name",
    "L3 Status",
    "L3 Action Time",
    "Final Status",
  ];

  const csvRows = rows.map((r: any) => [
    escapeCsv(r.created_at || ""),
    escapeCsv(r.leave_types?.leave_name || "Leave"),
    escapeCsv(r.start_date || ""),
    escapeCsv(r.end_date || ""),
    escapeCsv(String(r.total_days || "")),
    escapeCsv(r.reason || "null"),
    escapeCsv(getApproverName(r.level_1_approver_id)),
    escapeCsv(r.level_1_status || "pending"),
    escapeCsv(r.level_1_action_at || "null"),
    escapeCsv(getApproverName(r.level_2_approver_id)),
    escapeCsv(r.level_2_status || "pending"),
    escapeCsv(r.level_2_action_at || "null"),
    escapeCsv(r.level_3_approver_id ? getApproverName(r.level_3_approver_id) : "null"),
    escapeCsv(r.level_3_status || "null"),
    escapeCsv(r.level_3_action_at || "null"),
    escapeCsv(r.status || "pending"),
  ]);

  const csvContent = [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n");

  const empName = selectedEmployee.value?.full_name
    ? selectedEmployee.value.full_name.trim().split(" ")[0]
    : "Employee";
  const monthName = (monthNames[selectedMonthIndex.value]?.full || "month").toLowerCase();

  downloadCSV(csvContent, `${empName}_${monthName}_leave_requests.csv`);
}

const filteredSearchEmployees = computed(() => {
  const q = employeeSearchInput.value.trim().toLowerCase();
  if (selectedEmployee.value && employeeSearchInput.value.includes(selectedEmployee.value.full_name || "")) {
    return sortedEmployees.value;
  }
  if (!q) return sortedEmployees.value;
  return sortedEmployees.value.filter((emp) => {
    const name = (emp.full_name || "").toLowerCase();
    const code = (emp.employee_code || "").toLowerCase();
    const dept = getDepartmentName(emp.department).toLowerCase();
    return name.includes(q) || code.includes(q) || dept.includes(q);
  });
});

function onSelectEmployeeFromDropdown(emp: any) {
  selectedEmployeeId.value = emp.id;
  employeeSearchInput.value = `${emp.full_name || 'Unnamed'} (${emp.employee_code || 'NO-CODE'})`;
  isEmployeeDropdownOpen.value = false;
}

function clearEmployeeSelection() {
  selectedEmployeeId.value = "";
  employeeSearchInput.value = "";
  isEmployeeDropdownOpen.value = false;
}

onMounted(async () => {
  // Click outside listener for employee dropdown
  const handleClickOutside = (e: MouseEvent) => {
    if (employeeDropdownRef.value && !employeeDropdownRef.value.contains(e.target as Node)) {
      isEmployeeDropdownOpen.value = false;
    }
  };
  document.addEventListener("click", handleClickOutside);

  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  // Check if query parameter specifies an employee
  if (route.query.employee && typeof route.query.employee === "string") {
    selectedEmployeeId.value = route.query.employee;
  }
  if (route.query.month && typeof route.query.month === "string") {
    const parsedM = parseInt(route.query.month, 10);
    if (!isNaN(parsedM) && parsedM >= 0 && parsedM <= 11) {
      selectedMonthIndex.value = parsedM;
    }
  }
  if (route.query.year && typeof route.query.year === "string") {
    const parsedY = parseInt(route.query.year, 10);
    if (!isNaN(parsedY) && availableYears.includes(parsedY)) {
      selectedYear.value = parsedY;
    }
  }

  // Load basic store metadata & employees list (cached in store)
  await Promise.all([
    adminStore.fetchMetadata(),
    adminStore.fetchEmployees(),
  ]);

  // If employee was selected from query param, sync input text and fetch
  if (selectedEmployeeId.value) {
    const emp = adminStore.employees.find((e) => e.id === selectedEmployeeId.value);
    if (emp) {
      employeeSearchInput.value = `${emp.full_name || 'Unnamed'} (${emp.employee_code || 'NO-CODE'})`;
    }
    await fetchEmployeeMonthlyData();
  }
});
</script>
