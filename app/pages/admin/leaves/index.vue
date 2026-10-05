<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200/70">
      <div>
        <h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>Leave Policies & Quotas</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Balances & Policy Engine
          </span>
        </h1>
        <p class="text-xs text-gray-500 mt-0.5">
          Configure organizational leave categories, adjust staff leave quotas, and credit or debit annual balances.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- View Tabs -->
        <div class="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm text-xs">
          <button
            type="button"
            :class="[
              'px-3.5 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5',
              activeTab === 'balances' ? 'bg-emerald-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'
            ]"
            @click="activeTab = 'balances'"
          >
            <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
            <span>Staff Balances</span>
          </button>
          <button
            type="button"
            :class="[
              'px-3.5 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5',
              activeTab === 'types' ? 'bg-emerald-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'
            ]"
            @click="activeTab = 'types'"
          >
            <UIcon name="i-heroicons-clipboard-document-list" class="w-4 h-4" />
            <span>Leave Types ({{ adminStore.leaveTypes.length }})</span>
          </button>
        </div>

        <button
          v-if="activeTab === 'types'"
          type="button"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
          @click="openCreateTypeModal"
        >
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          <span>New Leave Type</span>
        </button>

        <button
          v-if="activeTab === 'balances'"
          type="button"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
          @click="openAddBalanceModal"
        >
          <UIcon name="i-heroicons-plus-circle" class="w-4 h-4" />
          <span>Allocate / Adjust Quota</span>
        </button>
      </div>
    </div>

    <!-- ================= TAB 1: EMPLOYEE BALANCES ================= -->
    <div v-if="activeTab === 'balances'" class="space-y-4">
      <!-- Filter Toolbar -->
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-md flex flex-col md:flex-row gap-3 items-center justify-between">
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <!-- Year Switcher -->
          <div class="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <span class="text-xs text-gray-500 font-medium">Year:</span>
            <select
              v-model="selectedYear"
              class="bg-transparent text-gray-900 text-xs font-mono font-bold focus:outline-none"
              @change="fetchBalances"
            >
              <option :value="2024">2024</option>
              <option :value="2025">2025</option>
              <option :value="2026">2026</option>
              <option :value="2027">2027</option>
            </select>
          </div>

          <!-- Search -->
          <div class="relative w-full sm:w-64">
            <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search employee..."
              class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <!-- Leave Type Filter -->
          <select
            v-model="selectedLeaveType"
            class="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Leave Types</option>
            <option v-for="lt in adminStore.leaveTypes" :key="lt.id" :value="lt.id">
              {{ lt.leave_name }} ({{ lt.leave_code }})
            </option>
          </select>
        </div>

        <button
          type="button"
          class="p-2 rounded-xl bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm"
          title="Refresh balances"
          @click="fetchBalances"
        >
          <UIcon name="i-heroicons-arrow-path" :class="['w-4 h-4', isBalancesLoading ? 'animate-spin text-emerald-600' : '']" />
        </button>
      </div>

      <!-- Balances Table -->
      <div class="rounded-2xl border border-gray-200/70 bg-white/90 backdrop-blur-lg overflow-hidden shadow-xl">
        <div v-if="isBalancesLoading" class="p-12 text-center text-gray-500">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-3 animate-spin text-emerald-600" />
          <p class="text-xs">Loading leave balances for {{ selectedYear }}...</p>
        </div>

        <div v-else-if="filteredBalances.length === 0" class="p-12 text-center text-gray-500">
          <UIcon name="i-heroicons-inbox" class="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <h3 class="text-sm font-semibold text-gray-800">No leave balance records found for {{ selectedYear }}</h3>
          <p class="text-xs text-gray-500 mt-1">Assign quota to employees for this calendar year.</p>
          <button
            class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/20"
            @click="openAddBalanceModal"
          >
            Assign Quota
          </button>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                <th class="py-3.5 px-4">Employee</th>
                <th class="py-3.5 px-4">Leave Category</th>
                <th class="py-3.5 px-4">Allocated</th>
                <th class="py-3.5 px-4">Carried Forward</th>
                <th class="py-3.5 px-4">Used Days</th>
                <th class="py-3.5 px-4">Pending</th>
                <th class="py-3.5 px-4">Available Days</th>
                <th class="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="b in filteredBalances"
                :key="b.id"
                class="hover:bg-emerald-50/40 transition-colors group"
              >
                <!-- Employee -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-gray-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-gray-200">
                      {{ getInitials(b.employee?.full_name || b.employee?.email || 'Staff') }}
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors truncate">
                        {{ b.employee?.full_name || 'Staff' }}
                      </div>
                      <div class="text-[11px] text-gray-500 truncate">
                        {{ adminStore.getDepartmentName(b.employee?.department ?? null) }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Leave Category -->
                <td class="py-3.5 px-4">
                  <div class="font-bold text-gray-800">
                    {{ b.leave_type?.leave_name || `Type #${b.leave_type_id}` }}
                  </div>
                  <span class="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {{ b.leave_type?.leave_code }}
                  </span>
                </td>

                <!-- Allocated -->
                <td class="py-3.5 px-4 font-mono font-semibold text-gray-900">
                  {{ b.allocated_days }} days
                </td>

                <!-- Carried Forward -->
                <td class="py-3.5 px-4 font-mono font-medium text-gray-600">
                  {{ b.carried_forward_days }} days
                </td>

                <!-- Used -->
                <td class="py-3.5 px-4 font-mono font-bold text-amber-700">
                  {{ b.used_days }} days
                </td>

                <!-- Pending -->
                <td class="py-3.5 px-4 font-mono font-medium text-blue-700">
                  {{ b.pending_days }} days
                </td>

                <!-- Available Balance -->
                <td class="py-3.5 px-4">
                  <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {{ b.available_days ?? (Number(b.allocated_days) + Number(b.carried_forward_days) - Number(b.used_days) - Number(b.pending_days)) }} days
                  </span>
                </td>

                <!-- Actions -->
                <td class="py-3.5 px-4 text-right">
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-100 text-gray-600 hover:text-emerald-700 transition-colors"
                    title="Adjust Leave Quota"
                    @click="openEditBalanceModal(b)"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ================= TAB 2: LEAVE TYPES CONFIGURATION ================= -->
    <div v-if="activeTab === 'types'" class="space-y-4">
      <div class="rounded-2xl border border-gray-200/70 bg-white/90 backdrop-blur-lg overflow-hidden shadow-xl">
        <div v-if="adminStore.leaveTypes.length === 0" class="p-12 text-center text-gray-500">
          <UIcon name="i-heroicons-clipboard-document-list" class="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <h3 class="text-sm font-semibold text-gray-800">No leave categories defined</h3>
          <p class="text-xs text-gray-500 mt-1">Create leave types to establish quota rules.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                <th class="py-3.5 px-4">Leave Type</th>
                <th class="py-3.5 px-4">Code</th>
                <th class="py-3.5 px-4">Carry Forward</th>
                <th class="py-3.5 px-4">Encashable</th>
                <th class="py-3.5 px-4">Max Days / Notice</th>
                <th class="py-3.5 px-4">Approval Levels</th>
                <th class="py-3.5 px-4">Status</th>
                <th class="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="lt in adminStore.leaveTypes"
                :key="lt.id"
                class="hover:bg-emerald-50/30 transition-colors group"
              >
                <!-- Name & Description -->
                <td class="py-3.5 px-4">
                  <div class="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {{ lt.leave_name }}
                  </div>
                  <div v-if="lt.description" class="text-[11px] text-gray-500 truncate max-w-xs mt-0.5">
                    {{ lt.description }}
                  </div>
                </td>

                <!-- Code -->
                <td class="py-3.5 px-4">
                  <span class="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    {{ lt.leave_code }}
                  </span>
                </td>

                <!-- Carry Forward -->
                <td class="py-3.5 px-4">
                  <div v-if="lt.is_carry_forward" class="text-emerald-700 font-semibold">
                    Yes (Max {{ lt.max_carry_forward || 0 }}d)
                  </div>
                  <span v-else class="text-gray-400">No</span>
                </td>

                <!-- Encashable -->
                <td class="py-3.5 px-4">
                  <span :class="lt.is_encashable ? 'text-blue-700 font-semibold' : 'text-gray-400'">
                    {{ lt.is_encashable ? 'Yes' : 'No' }}
                  </span>
                </td>

                <!-- Max Days & Notice -->
                <td class="py-3.5 px-4">
                  <div class="text-gray-900 font-medium">
                    Max: {{ lt.max_consecutive_days ? `${lt.max_consecutive_days}d in stretch` : 'Unrestricted' }}
                  </div>
                  <div class="text-[10px] text-gray-500">
                    Notice: {{ lt.notice_period_days || 1 }} days
                  </div>
                </td>

                <!-- Approvals -->
                <td class="py-3.5 px-4">
                  <span class="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[10px] font-bold">
                    {{ lt.approval_levels || 2 }} Approver(s)
                  </span>
                </td>

                <!-- Status -->
                <td class="py-3.5 px-4">
                  <span
                    :class="[
                      'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5',
                      lt.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    ]"
                  >
                    <span :class="['w-1.5 h-1.5 rounded-full', lt.is_active ? 'bg-emerald-500' : 'bg-red-500']" />
                    {{ lt.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="py-3.5 px-4 text-right">
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Edit Leave Policy"
                    @click="openEditTypeModal(lt)"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ================= MODAL 1: ADJUST / ASSIGN BALANCE ================= -->
    <div
      v-if="isBalanceModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 class="text-base font-bold text-gray-900">{{ isEditingBalance ? 'Adjust Leave Balance' : 'Assign Leave Quota' }}</h3>
            <p class="text-xs text-gray-500">Year {{ selectedYear }} — Quota Allocation</p>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isBalanceModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveBalance" class="space-y-4">
          <!-- Employee Selector (only if creating new) -->
          <div v-if="!isEditingBalance" class="space-y-1">
            <label class="text-xs font-semibold text-gray-700">Select Employee *</label>
            <select
              v-model="balanceForm.employee_id"
              required
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="" disabled>Choose staff member</option>
              <option v-for="emp in adminStore.employees" :key="emp.id" :value="emp.id">
                {{ emp.full_name || emp.email }} ({{ emp.employee_code || 'No Code' }})
              </option>
            </select>
          </div>
          <div v-else class="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <div class="text-gray-500 text-[10px]">Employee</div>
            <div class="font-bold text-gray-900 text-sm">{{ activeBalance?.employee?.full_name || activeBalance?.employee?.email }}</div>
          </div>

          <!-- Leave Type Selector -->
          <div v-if="!isEditingBalance" class="space-y-1">
            <label class="text-xs font-semibold text-gray-700">Leave Type *</label>
            <select
              v-model.number="balanceForm.leave_type_id"
              required
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
            >
              <option v-for="lt in adminStore.leaveTypes" :key="lt.id" :value="lt.id">
                {{ lt.leave_name }} ({{ lt.leave_code }})
              </option>
            </select>
          </div>
          <div v-else class="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <div class="text-gray-500 text-[10px]">Leave Type</div>
            <div class="font-bold text-gray-900 text-sm">{{ activeBalance?.leave_type?.leave_name }} ({{ activeBalance?.leave_type?.leave_code }})</div>
          </div>

          <!-- Quota Days -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Allocated Days *</label>
              <input
                v-model.number="balanceForm.allocated_days"
                type="number"
                step="0.5"
                min="0"
                required
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs font-mono focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Carried Forward</label>
              <input
                v-model.number="balanceForm.carried_forward_days"
                type="number"
                step="0.5"
                min="0"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs font-mono focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
              @click="isBalanceModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/25 disabled:opacity-50"
            >
              <UIcon v-if="isSaving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>Save Leave Balance</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ================= MODAL 2: CREATE / EDIT LEAVE TYPE ================= -->
    <div
      v-if="isTypeModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 class="text-base font-bold text-gray-900">{{ isEditingType ? 'Edit Leave Category' : 'Create Leave Category' }}</h3>
            <p class="text-xs text-gray-500">Establish quota rules and approvals</p>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isTypeModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveLeaveType" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Name -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Leave Name *</label>
              <input
                v-model="typeForm.leave_name"
                type="text"
                required
                placeholder="e.g. Annual Leave, Casual Leave"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <!-- Code -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Code *</label>
              <input
                v-model="typeForm.leave_code"
                type="text"
                required
                placeholder="e.g. AL, CL, SL"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none font-mono uppercase"
              />
            </div>

            <!-- Carry Forward Days -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Max Carry Forward (Days)</label>
              <input
                v-model.number="typeForm.max_carry_forward"
                type="number"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs font-mono"
              />
            </div>

            <!-- Consecutive Days -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Max Consecutive Days</label>
              <input
                v-model.number="typeForm.max_consecutive_days"
                type="number"
                min="1"
                placeholder="Uncapped"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs"
              />
            </div>

            <!-- Notice Period Days -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Notice Period Required (Days)</label>
              <input
                v-model.number="typeForm.notice_period_days"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs"
              />
            </div>

            <!-- Approval Levels -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Approval Levels</label>
              <input
                v-model.number="typeForm.approval_levels"
                type="number"
                min="1"
                max="3"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700">Policy Description</label>
            <textarea
              v-model="typeForm.description"
              rows="2"
              placeholder="Eligibility guidelines..."
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs"
            />
          </div>

          <!-- Policy Toggles -->
          <div class="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <UCheckbox
              v-model="typeForm.is_carry_forward"
              color="primary"
              size="sm"
              :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
            >
              <template #label>
                <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Carry Forward</span>
              </template>
            </UCheckbox>
            <UCheckbox
              v-model="typeForm.is_encashable"
              color="primary"
              size="sm"
              :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
            >
              <template #label>
                <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Encashable</span>
              </template>
            </UCheckbox>
            <UCheckbox
              v-model="typeForm.requires_document"
              color="primary"
              size="sm"
              :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
            >
              <template #label>
                <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Doc Proof</span>
              </template>
            </UCheckbox>
            <UCheckbox
              v-model="typeForm.is_active"
              color="primary"
              size="sm"
              :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
            >
              <template #label>
                <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Active</span>
              </template>
            </UCheckbox>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
              @click="isTypeModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/25 disabled:opacity-50"
            >
              <UIcon v-if="isSaving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>{{ isEditingType ? 'Update Leave Type' : 'Create Leave Type' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAdminStore, type AdminLeaveType } from "~/stores/admin";

interface EmployeeLeaveBalance {
  id: number;
  employee_id: string;
  leave_type_id: number;
  calendar_year: number;
  allocated_days: number;
  used_days: number;
  pending_days: number;
  carried_forward_days: number;
  available_days?: number;
  employee?: {
    id: string;
    full_name: string | null;
    email: string;
    department: number | null;
  };
  leave_type?: {
    id: number;
    leave_code: string;
    leave_name: string;
  };
}

const adminStore = useAdminStore();
const supabase = useSupabaseClient();

const activeTab = ref<"balances" | "types">("balances");
const selectedYear = ref(new Date().getFullYear());
const searchQuery = ref("");
const selectedLeaveType = ref<number | "ALL">("ALL");

const balances = ref<EmployeeLeaveBalance[]>([]);
const isBalancesLoading = ref(false);
const isSaving = ref(false);

// Balance Modal
const isBalanceModalOpen = ref(false);
const isEditingBalance = ref(false);
const activeBalance = ref<EmployeeLeaveBalance | null>(null);
const balanceForm = ref({
  employee_id: "",
  leave_type_id: 1,
  allocated_days: 12,
  carried_forward_days: 0,
});

// Leave Type Modal
const isTypeModalOpen = ref(false);
const isEditingType = ref(false);
const activeType = ref<AdminLeaveType | null>(null);
const typeForm = ref({
  leave_name: "",
  leave_code: "",
  description: "",
  is_carry_forward: false,
  max_carry_forward: 0,
  is_encashable: false,
  max_consecutive_days: null as number | null,
  requires_document: false,
  notice_period_days: 1,
  approval_levels: 2,
  is_active: true,
});

async function fetchBalances() {
  isBalancesLoading.value = true;
  try {
    const { data, error } = await supabase
      .from("employee_leave_balances")
      .select(`
        *,
        employee:employee_id(id, full_name, email, department),
        leave_type:leave_type_id(id, leave_code, leave_name)
      `)
      .eq("calendar_year", selectedYear.value)
      .order("created_at", { ascending: false });

    if (error) throw error;
    balances.value = (data as any) || [];
  } catch (err: any) {
    console.error("Failed to fetch leave balances:", err);
  } finally {
    isBalancesLoading.value = false;
  }
}

const filteredBalances = computed(() => {
  return balances.value.filter((b) => {
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const name = (b.employee?.full_name || "").toLowerCase();
      const email = (b.employee?.email || "").toLowerCase();
      if (!name.includes(q) && !email.includes(q)) return false;
    }

    if (selectedLeaveType.value !== "ALL" && b.leave_type_id !== selectedLeaveType.value) {
      return false;
    }

    return true;
  });
});

function getInitials(name: string): string {
  if (!name) return "EM";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function openAddBalanceModal() {
  isEditingBalance.value = false;
  activeBalance.value = null;
  balanceForm.value = {
    employee_id: adminStore.employees[0]?.id || "",
    leave_type_id: adminStore.leaveTypes[0]?.id || 1,
    allocated_days: 12,
    carried_forward_days: 0,
  };
  isBalanceModalOpen.value = true;
}

function openEditBalanceModal(b: EmployeeLeaveBalance) {
  isEditingBalance.value = true;
  activeBalance.value = b;
  balanceForm.value = {
    employee_id: b.employee_id,
    leave_type_id: b.leave_type_id,
    allocated_days: Number(b.allocated_days),
    carried_forward_days: Number(b.carried_forward_days),
  };
  isBalanceModalOpen.value = true;
}

async function saveBalance() {
  isSaving.value = true;

  try {
    if (isEditingBalance.value && activeBalance.value) {
      const { error } = await (supabase as any)
        .from("employee_leave_balances")
        .update({
          allocated_days: balanceForm.value.allocated_days,
          carried_forward_days: balanceForm.value.carried_forward_days,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeBalance.value.id);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from("employee_leave_balances").insert({
        employee_id: balanceForm.value.employee_id,
        leave_type_id: balanceForm.value.leave_type_id,
        calendar_year: selectedYear.value,
        allocated_days: balanceForm.value.allocated_days,
        carried_forward_days: balanceForm.value.carried_forward_days,
        used_days: 0,
        pending_days: 0,
      });
      if (error) throw error;
    }

    await fetchBalances();
    isBalanceModalOpen.value = false;
  } catch (err: any) {
    alert("Failed to save leave balance: " + err.message);
  } finally {
    isSaving.value = false;
  }
}

function openCreateTypeModal() {
  isEditingType.value = false;
  activeType.value = null;
  typeForm.value = {
    leave_name: "",
    leave_code: "",
    description: "",
    is_carry_forward: false,
    max_carry_forward: 0,
    is_encashable: false,
    max_consecutive_days: null,
    requires_document: false,
    notice_period_days: 1,
    approval_levels: 2,
    is_active: true,
  };
  isTypeModalOpen.value = true;
}

function openEditTypeModal(lt: AdminLeaveType) {
  isEditingType.value = true;
  activeType.value = lt;
  typeForm.value = {
    leave_name: lt.leave_name,
    leave_code: lt.leave_code,
    description: lt.description || "",
    is_carry_forward: lt.is_carry_forward,
    max_carry_forward: lt.max_carry_forward || 0,
    is_encashable: lt.is_encashable,
    max_consecutive_days: lt.max_consecutive_days,
    requires_document: lt.requires_document,
    notice_period_days: lt.notice_period_days || 1,
    approval_levels: lt.approval_levels || 2,
    is_active: lt.is_active,
  };
  isTypeModalOpen.value = true;
}

async function saveLeaveType() {
  isSaving.value = true;

  try {
    const payload = {
      leave_name: typeForm.value.leave_name,
      leave_code: typeForm.value.leave_code.toUpperCase(),
      description: typeForm.value.description || null,
      is_carry_forward: typeForm.value.is_carry_forward,
      max_carry_forward: typeForm.value.max_carry_forward,
      is_encashable: typeForm.value.is_encashable,
      max_consecutive_days: typeForm.value.max_consecutive_days,
      requires_document: typeForm.value.requires_document,
      notice_period_days: typeForm.value.notice_period_days,
      approval_levels: typeForm.value.approval_levels,
      is_active: typeForm.value.is_active,
      updated_at: new Date().toISOString(),
    };

    if (isEditingType.value && activeType.value) {
      const { error } = await (supabase as any)
        .from("leave_types")
        .update(payload)
        .eq("id", activeType.value.id);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from("leave_types").insert(payload);
      if (error) throw error;
    }

    await adminStore.fetchMetadata(true);
    isTypeModalOpen.value = false;
  } catch (err: any) {
    alert("Failed to save leave category: " + err.message);
  } finally {
    isSaving.value = false;
  }
}

onMounted(async () => {
  await adminStore.fetchMetadata();
  await adminStore.fetchEmployees();
  await fetchBalances();
});
</script>
