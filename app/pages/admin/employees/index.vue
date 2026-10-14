<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200/70">
      <div>
        <h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>Employee Directory</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            {{ filteredEmployees.length }} Staff
          </span>
        </h1>
        <p class="text-xs text-gray-500 mt-0.5">
          Manage staff profiles, modify roles, reset credentials, and adjust geofencing perimeters.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="p-2.5 rounded-xl bg-white/80 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm transition-colors"
          title="Refresh employees"
          @click="refreshData"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            :class="['w-4 h-4', isRefreshing ? 'animate-spin text-emerald-600' : '']"
          />
        </button>

        <NuxtLink
          to="/admin/employees/new"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
        >
          <UIcon name="i-heroicons-user-plus" class="w-4 h-4" />
          <span>Onboard New Employee</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Staff</div>
        <div class="text-2xl font-black text-gray-900 mt-1 font-mono">{{ adminStore.employees.length }}</div>
        <div class="text-[10px] text-gray-500 mt-0.5">Enrolled members</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active Profiles</div>
        <div class="text-2xl font-black text-emerald-600 mt-1 font-mono">{{ activeEmployeesCount }}</div>
        <div class="text-[10px] text-gray-500 mt-0.5">Operational accounts</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[11px] font-bold uppercase tracking-wider text-blue-700">WFM Authorized</div>
        <div class="text-2xl font-black text-blue-600 mt-1 font-mono">{{ wfmEmployeesCount }}</div>
        <div class="text-[10px] text-gray-500 mt-0.5">Remote-punch enabled</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[11px] font-bold uppercase tracking-wider text-purple-700">Departments</div>
        <div class="text-2xl font-black text-purple-600 mt-1 font-mono">{{ adminStore.departments.length }}</div>
        <div class="text-[10px] text-gray-500 mt-0.5">Organizational units</div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-md flex flex-col md:flex-row gap-3 items-center justify-between">
      <!-- Search Input -->
      <div class="relative w-full md:w-80">
        <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search name, email, employee code..."
          class="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          v-if="searchQuery"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          @click="searchQuery = ''"
        >
          <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Dropdown Filters -->
      <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
        <!-- Department Filter -->
        <select
          v-model="selectedDepartment"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Departments ({{ adminStore.departments.length }})</option>
          <option v-for="d in adminStore.departments" :key="d.id" :value="d.id">
            {{ d.name }}
          </option>
        </select>

        <!-- Status Filter -->
        <select
          v-model="selectedStatus"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>

        <!-- Remote WFM Filter -->
        <select
          v-model="selectedWfm"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Work Modes</option>
          <option value="WFM_YES">WFM Allowed</option>
          <option value="WFM_NO">Office Only</option>
        </select>

        <button
          v-if="hasActiveFilters"
          class="px-2.5 py-1.5 rounded-lg text-[11px] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium"
          @click="resetFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Employee Directory Table -->
    <div class="rounded-2xl border border-gray-200/70 bg-white/90 backdrop-blur-lg overflow-hidden shadow-xl">
      <div v-if="adminStore.isEmployeesLoading" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-3 animate-spin text-emerald-600" />
        <p class="text-xs">Loading employee records...</p>
      </div>

      <div v-else-if="filteredEmployees.length === 0" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-users" class="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <h3 class="text-sm font-semibold text-gray-800">No employees found</h3>
        <p class="text-xs text-gray-500 mt-1">Try adjusting your search criteria or onboard a new team member.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
              <th class="py-3.5 px-4">Employee</th>
              <th class="py-3.5 px-4">Dept & Position</th>
              <th class="py-3.5 px-4">Schedule / Hours</th>
              <th class="py-3.5 px-4">Geofencing & WFM</th>
              <th class="py-3.5 px-4">Access</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="emp in paginatedEmployees"
              :key="emp.id"
              class="hover:bg-emerald-50/40 transition-colors group cursor-pointer"
              @click="openDetailModal(emp)"
            >
              <!-- Employee Info -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0 overflow-hidden">
                    <img
                      v-if="emp.avatar_url"
                      :src="emp.avatar_url"
                      :alt="emp.full_name || 'Staff'"
                      class="w-full h-full object-cover"
                    />
                    <span v-else>{{ getInitials(emp.full_name || emp.email) }}</span>
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                      <span class="truncate">{{ emp.full_name || 'Unnamed Employee' }}</span>
                      <span
                        v-if="emp.employee_code"
                        class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 border border-gray-200"
                      >
                        {{ emp.employee_code }}
                      </span>
                    </div>
                    <div class="text-[11px] text-gray-500 truncate">{{ emp.email }}</div>
                    <div v-if="emp.phone" class="text-[10px] text-gray-400 font-mono">{{ emp.phone }}</div>
                  </div>
                </div>
              </td>

              <!-- Dept & Position -->
              <td class="py-3.5 px-4">
                <div class="font-bold text-gray-800">
                  {{ adminStore.getDepartmentName(emp.department) }}
                </div>
                <div class="text-[11px] text-gray-600">
                  {{ adminStore.getPositionName(emp.position) }}
                </div>
                <div v-if="emp.employment_type" class="text-[10px] text-gray-400 capitalize">
                  {{ emp.employment_type }}
                </div>
              </td>

              <!-- Work Schedule -->
              <td class="py-3.5 px-4">
                <div v-if="emp.work_schedule" class="space-y-0.5">
                  <div class="font-mono text-emerald-700 font-bold">
                    {{ formatTime(emp.work_schedule.start_time) }} - {{ formatTime(emp.work_schedule.end_time) }}
                  </div>
                  <div class="text-[10px] text-gray-500">
                    Grace: {{ emp.work_schedule.punch_in_grace || 12 }}m
                  </div>
                </div>
                <div v-else class="text-gray-400 italic text-[11px]">
                  No schedule assigned
                </div>
              </td>

              <!-- Geofencing & WFM -->
              <td class="py-3.5 px-4">
                <div class="flex flex-col gap-1 items-start">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1',
                      emp.work_schedule?.wfm_allowed
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600'
                    ]"
                  >
                    <UIcon :name="emp.work_schedule?.wfm_allowed ? 'i-heroicons-home' : 'i-heroicons-building-office'" class="w-3 h-3" />
                    {{ emp.work_schedule?.wfm_allowed ? 'WFM Allowed' : 'Office Only' }}
                  </span>

                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1',
                      emp.geofencing
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    ]"
                  >
                    <UIcon name="i-heroicons-map-pin" class="w-3 h-3" />
                    {{ emp.geofencing ? 'Geofenced' : 'No Geofence' }}
                  </span>
                </div>
              </td>

              <!-- Access Permissions -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-1.5">
                  <span
                    title="Mobile App Access"
                    :class="[
                      'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold',
                      emp.app_access ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                    ]"
                  >
                    <UIcon name="i-heroicons-device-phone-mobile" class="w-3.5 h-3.5" />
                  </span>
                  <span
                    title="Web Dashboard Access"
                    :class="[
                      'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold',
                      emp.web_access ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                    ]"
                  >
                    <UIcon name="i-heroicons-computer-desktop" class="w-3.5 h-3.5" />
                  </span>
                  <span
                    v-if="emp.face_recognition"
                    :title="emp.face_enrolled_at ? `Face Enrolled (${formatDate(emp.face_enrolled_at)} • Threshold: ${emp.face_match_threshold ?? 0.75})` : 'Face Required (Pending Mobile Enrollment)'"
                    :class="[
                      'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold relative transition-transform hover:scale-110',
                      emp.face_enrolled_at ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                    ]"
                  >
                    <UIcon name="i-heroicons-face-smile" class="w-3.5 h-3.5" />
                    <span
                      v-if="!emp.face_enrolled_at"
                      class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                      title="Pending Face Enrollment"
                    />
                  </span>
                  <span
                    v-if="emp.approval_levels"
                    class="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-mono font-bold"
                    title="Approval Levels"
                  >
                    L{{ emp.approval_levels }}
                  </span>
                </div>
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5',
                    emp.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  ]"
                >
                  <span :class="['w-1.5 h-1.5 rounded-full', emp.is_active ? 'bg-emerald-500' : 'bg-red-500']" />
                  {{ emp.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5" @click.stop>
                  <!-- View Full Profile Details -->
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-100 text-gray-600 hover:text-emerald-700 transition-colors"
                    title="View Full Profile Details"
                    @click.stop="openDetailModal(emp)"
                  >
                    <UIcon name="i-heroicons-eye" class="w-4 h-4" />
                  </button>

                  <!-- Edit Profile -->
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Edit Profile Details"
                    @click.stop="openEditModal(emp)"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                  </button>

                  <!-- Password Reset -->
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-amber-100 text-gray-600 hover:text-amber-700 transition-colors"
                    title="Reset Login Password"
                    @click.stop="openPasswordModal(emp)"
                  >
                    <UIcon name="i-heroicons-key" class="w-4 h-4" />
                  </button>

                  <!-- Work Schedule & GPS -->
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-colors"
                    title="Edit Geofencing & Work Schedule"
                    @click.stop="openScheduleModal(emp)"
                  >
                    <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                  </button>

                  <!-- Request & Approval History -->
                  <NuxtLink
                    :to="`/admin/requests?employee=${emp.id}`"
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-cyan-100 text-gray-600 hover:text-cyan-700 transition-colors inline-flex items-center justify-center"
                    title="View Regularization & Leave History"
                    @click.stop
                  >
                    <UIcon name="i-heroicons-clipboard-document-list" class="w-4 h-4" />
                  </NuxtLink>

                  <!-- Toggle Active Status -->
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 transition-colors"
                    :title="emp.is_active ? 'Deactivate Account' : 'Reactivate Account'"
                    @click.stop="toggleEmployeeStatus(emp)"
                  >
                    <UIcon :name="emp.is_active ? 'i-heroicons-no-symbol' : 'i-heroicons-check-circle'" class="w-4 h-4" />
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
          <span class="font-bold text-gray-900">{{ filteredEmployees.length }}</span> entries
        </div>

        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium transition-colors shadow-sm"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            Previous
          </button>
          <span class="px-2 font-mono text-gray-600">Page {{ currentPage }} / {{ totalPages || 1 }}</span>
          <button
            class="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium transition-colors shadow-sm"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- MODAL 0: EMPLOYEE FULL DETAILS & PROFILE INSPECTOR               -->
    <!-- ================================================================= -->
    <div
      v-if="isDetailModalOpen && selectedDetailEmp"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      <div
        class="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity"
        @click="isDetailModalOpen = false"
      />

      <div
        class="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-gray-200 z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- Modal Top Header Banner -->
        <div class="px-6 py-5 bg-gradient-to-r from-gray-50 via-white to-emerald-50/40 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div class="flex items-center gap-4 min-w-0">
            <!-- Large Avatar -->
            <div class="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-base shadow-lg shrink-0 overflow-hidden border-2 border-white ring-2 ring-emerald-100">
              <img
                v-if="selectedDetailEmp.avatar_url"
                :src="selectedDetailEmp.avatar_url"
                :alt="selectedDetailEmp.full_name || 'Staff'"
                class="w-full h-full object-cover"
              />
              <span v-else>{{ getInitials(selectedDetailEmp.full_name || selectedDetailEmp.email) }}</span>
              <span
                class="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                :class="selectedDetailEmp.is_active ? 'bg-emerald-500' : 'bg-red-500'"
                :title="selectedDetailEmp.is_active ? 'Active Employee' : 'Inactive Employee'"
              />
            </div>

            <!-- Name, Code & Position -->
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base sm:text-lg font-black text-gray-900 truncate">
                  {{ selectedDetailEmp.full_name || 'Unnamed Employee' }}
                </h3>
                <span
                  v-if="selectedDetailEmp.employee_code"
                  class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-300"
                >
                  {{ selectedDetailEmp.employee_code }}
                </span>
                <span
                  class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                  :class="selectedDetailEmp.is_active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'"
                >
                  {{ selectedDetailEmp.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                <span class="font-medium text-gray-700 flex items-center gap-1">
                  <UIcon name="i-heroicons-briefcase" class="w-3.5 h-3.5 text-gray-400" />
                  {{ adminStore.getPositionName(selectedDetailEmp.position) }}
                </span>
                <span class="text-gray-300">•</span>
                <span class="font-medium text-gray-700 flex items-center gap-1">
                  <UIcon name="i-heroicons-building-office" class="w-3.5 h-3.5 text-gray-400" />
                  {{ adminStore.getDepartmentName(selectedDetailEmp.department) }}
                </span>
                <span class="text-gray-300">•</span>
                <span class="font-mono text-gray-500 flex items-center gap-1">
                  <UIcon name="i-heroicons-envelope" class="w-3.5 h-3.5 text-gray-400" />
                  {{ selectedDetailEmp.email }}
                </span>
                <span v-if="selectedDetailEmp.phone" class="text-gray-300">•</span>
                <span v-if="selectedDetailEmp.phone" class="font-mono text-gray-500 flex items-center gap-1">
                  <UIcon name="i-heroicons-phone" class="w-3.5 h-3.5 text-gray-400" />
                  {{ selectedDetailEmp.phone }}
                </span>
              </div>
            </div>
          </div>

          <!-- Header Quick Action Shortcuts -->
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <!-- Edit Profile -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 text-xs font-bold border border-gray-200 hover:border-emerald-200 transition-colors"
              title="Edit Employee Profile"
              @click="openEditFromDetail"
            >
              <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 text-emerald-600" />
              <span class="hidden sm:inline">Edit</span>
            </button>

            <!-- Schedule & GPS -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs font-bold border border-gray-200 hover:border-blue-200 transition-colors"
              title="Edit Work Schedule & Geofence"
              @click="openScheduleFromDetail"
            >
              <UIcon name="i-heroicons-clock" class="w-4 h-4 text-blue-600" />
              <span class="hidden sm:inline">Schedule</span>
            </button>

            <!-- Reset Password -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-amber-50 text-gray-700 hover:text-amber-700 text-xs font-bold border border-gray-200 hover:border-amber-200 transition-colors"
              title="Reset Password"
              @click="openPasswordFromDetail"
            >
              <UIcon name="i-heroicons-key" class="w-4 h-4 text-amber-600" />
              <span class="hidden sm:inline">Password</span>
            </button>

            <!-- Close Modal -->
            <button
              type="button"
              class="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              @click="isDetailModalOpen = false"
            >
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Navigation Tabs Bar -->
        <div class="px-6 border-b border-gray-200 bg-gray-50/60 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            class="py-3 px-3.5 border-b-2 text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap"
            :class="detailActiveTab === 'overview' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-900'"
            @click="detailActiveTab = 'overview'"
          >
            <UIcon name="i-heroicons-user" class="w-4 h-4" />
            <span>Profile & Identity</span>
          </button>

          <button
            type="button"
            class="py-3 px-3.5 border-b-2 text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap"
            :class="detailActiveTab === 'job' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-900'"
            @click="detailActiveTab = 'job'"
          >
            <UIcon name="i-heroicons-briefcase" class="w-4 h-4" />
            <span>Job & Hierarchy</span>
          </button>

          <button
            type="button"
            class="py-3 px-3.5 border-b-2 text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap"
            :class="detailActiveTab === 'schedule' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-900'"
            @click="detailActiveTab = 'schedule'"
          >
            <UIcon name="i-heroicons-clock" class="w-4 h-4" />
            <span>Schedule & Geofence</span>
          </button>

          <button
            type="button"
            class="py-3 px-3.5 border-b-2 text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap"
            :class="detailActiveTab === 'family' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-900'"
            @click="detailActiveTab = 'family'"
          >
            <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
            <span>Family & Nominees</span>
          </button>

          <button
            type="button"
            class="py-3 px-3.5 border-b-2 text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap"
            :class="detailActiveTab === 'documents' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-900'"
            @click="detailActiveTab = 'documents'"
          >
            <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
            <span>Compliance & Banking</span>
          </button>

          <button
            type="button"
            class="py-3 px-3.5 border-b-2 text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap"
            :class="detailActiveTab === 'security' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-900'"
            @click="detailActiveTab = 'security'"
          >
            <UIcon name="i-heroicons-shield-check" class="w-4 h-4" />
            <span>Access & Biometrics</span>
          </button>
        </div>

        <!-- Copy Feedback Banner -->
        <div v-if="copySuccessMsg" class="bg-emerald-600 text-white text-[11px] font-bold py-1 px-4 text-center shrink-0">
          {{ copySuccessMsg }}
        </div>

        <!-- Modal Body Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">

          <!-- TAB 1: PROFILE & IDENTITY -->
          <div v-if="detailActiveTab === 'overview'" class="space-y-6">
            <!-- Personal Info Card -->
            <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                    <UIcon name="i-heroicons-identification" class="w-4 h-4" />
                  </div>
                  <h4 class="text-sm font-bold text-gray-900">Personal Information</h4>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Full Name</span>
                  <span class="font-bold text-gray-900">{{ selectedDetailEmp.full_name || '-' }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Employee Code</span>
                  <span class="font-mono font-bold text-emerald-700">{{ selectedDetailEmp.employee_code || '-' }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Gender</span>
                  <span class="font-semibold text-gray-800 capitalize">{{ selectedDetailEmp.gender || '-' }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Date of Birth & Age</span>
                  <span class="font-semibold text-gray-900">
                    {{ formatDateOnly(selectedDetailEmp.date_of_birth || detailProfileData?.date_of_birth) }}
                    <span v-if="calculateAge(selectedDetailEmp.date_of_birth || detailProfileData?.date_of_birth)" class="text-emerald-700 font-bold ml-1">
                      ({{ calculateAge(selectedDetailEmp.date_of_birth || detailProfileData?.date_of_birth) }})
                    </span>
                  </span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Marital Status</span>
                  <span class="font-semibold text-gray-800 capitalize">{{ selectedDetailEmp.marital_status || detailProfileData?.marital_status || '-' }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Contact Phone</span>
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-semibold text-gray-900">{{ selectedDetailEmp.phone || '-' }}</span>
                    <button
                      v-if="selectedDetailEmp.phone"
                      type="button"
                      class="text-gray-400 hover:text-emerald-600"
                      title="Copy phone"
                      @click="copyToClipboard(selectedDetailEmp.phone, 'phone')"
                    >
                      <UIcon name="i-heroicons-clipboard-document" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1 sm:col-span-2 lg:col-span-3">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Email Address</span>
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-gray-900">{{ selectedDetailEmp.email }}</span>
                    <button
                      type="button"
                      class="text-gray-400 hover:text-emerald-600"
                      title="Copy email"
                      @click="copyToClipboard(selectedDetailEmp.email, 'email')"
                    >
                      <UIcon name="i-heroicons-clipboard-document" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Addresses Card -->
            <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                    <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
                  </div>
                  <h4 class="text-sm font-bold text-gray-900">Residential Addresses</h4>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <!-- Current Address -->
                <div class="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                  <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <UIcon name="i-heroicons-home" class="w-3.5 h-3.5 text-blue-500" />
                    <span>Current Address</span>
                  </div>
                  <p class="text-xs text-gray-800 leading-relaxed font-medium">
                    {{ selectedDetailEmp.current_address || detailProfileData?.current_address || 'No current address recorded' }}
                  </p>
                </div>

                <!-- Permanent Address -->
                <div class="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                  <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <UIcon name="i-heroicons-building-office-2" class="w-3.5 h-3.5 text-gray-500" />
                    <span>Permanent Address</span>
                  </div>
                  <p class="text-xs text-gray-800 leading-relaxed font-medium">
                    {{ selectedDetailEmp.permanent_address || detailProfileData?.permanent_address || 'No permanent address recorded' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Emergency Contacts Card -->
            <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/60">
                    <UIcon name="i-heroicons-phone-arrow-up-right" class="w-4 h-4" />
                  </div>
                  <h4 class="text-sm font-bold text-gray-900">Emergency Contacts</h4>
                </div>
              </div>

              <div v-if="normalizeEmergencyContacts(selectedDetailEmp.emergency_contacts).length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  v-for="(ec, idx) in normalizeEmergencyContacts(selectedDetailEmp.emergency_contacts)"
                  :key="idx"
                  class="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1 text-xs"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-gray-900">{{ ec.name || 'Emergency Contact' }}</span>
                    <span v-if="ec.relation" class="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                      {{ ec.relation }}
                    </span>
                  </div>
                  <div v-if="ec.phone" class="font-mono text-gray-600 text-xs flex items-center gap-1.5 mt-1">
                    <UIcon name="i-heroicons-phone" class="w-3.5 h-3.5 text-gray-400" />
                    {{ ec.phone }}
                  </div>
                </div>
              </div>
              <div v-else class="text-xs text-gray-400 italic py-2">
                No emergency contacts registered on profile.
              </div>
            </div>
          </div>

          <!-- TAB 2: JOB & HIERARCHY -->
          <div v-else-if="detailActiveTab === 'job'" class="space-y-6">
            <!-- Organization Placement Card -->
            <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
                    <UIcon name="i-heroicons-building-office" class="w-4 h-4" />
                  </div>
                  <h4 class="text-sm font-bold text-gray-900">Employment & Organizational Placement</h4>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Department</span>
                  <span class="font-bold text-gray-900">{{ adminStore.getDepartmentName(selectedDetailEmp.department) }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Position / Designation</span>
                  <span class="font-bold text-gray-900">{{ adminStore.getPositionName(selectedDetailEmp.position) }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Employment Type</span>
                  <span class="font-semibold text-gray-800 capitalize">{{ (selectedDetailEmp.employment_type || 'full_time').replace('_', ' ') }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Date of Joining</span>
                  <span class="font-semibold text-gray-900">{{ formatDateOnly(selectedDetailEmp.date_of_joining) }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Company Tenure</span>
                  <span class="font-bold text-purple-700">{{ calculateTenure(selectedDetailEmp.date_of_joining) }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Employment Status</span>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block"
                    :class="selectedDetailEmp.is_active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'"
                  >
                    {{ selectedDetailEmp.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Approval Hierarchy Chain Card -->
            <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                    <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-gray-900">Department Approval Hierarchy Chain</h4>
                    <p class="text-[11px] text-gray-500">Resolves leaves and profile requests through department management chain</p>
                  </div>
                </div>

                <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Configured: Level {{ selectedDetailEmp.approval_levels || 1 }}
                </span>
              </div>

              <div v-if="getHierarchyApproversFor(selectedDetailEmp.department, selectedDetailEmp.id).length > 0" class="space-y-3">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    v-for="(appr, idx) in getHierarchyApproversFor(selectedDetailEmp.department, selectedDetailEmp.id)"
                    :key="appr.managerId"
                    class="p-4 rounded-xl border transition-all"
                    :class="idx + 1 <= (selectedDetailEmp.approval_levels || 1) ? 'bg-emerald-50/50 border-emerald-200 shadow-xs' : 'bg-gray-50 border-gray-200 opacity-60'"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span
                        class="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono"
                        :class="idx + 1 <= (selectedDetailEmp.approval_levels || 1) ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'"
                      >
                        Level {{ appr.level }}
                      </span>

                      <span
                        v-if="idx + 1 === (selectedDetailEmp.approval_levels || 1)"
                        class="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200"
                      >
                        Final Approver
                      </span>
                    </div>

                    <div class="font-bold text-gray-900 text-xs">{{ appr.managerName }}</div>
                    <div class="text-[11px] text-gray-500 mt-0.5">{{ appr.departmentName }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-amber-600 shrink-0" />
                <span>No manager is assigned to this employee's department or parent departments.</span>
              </div>
            </div>
          </div>

          <!-- TAB 3: SCHEDULE & GEOFENCE -->
          <div v-else-if="detailActiveTab === 'schedule'" class="space-y-6">
            <template v-if="selectedDetailEmp.work_schedule">
              <!-- Shift Timing & Work Hours -->
              <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                      <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                    </div>
                    <div>
                      <h4 class="text-sm font-bold text-gray-900">Shift Timings & Work Hours</h4>
                      <p class="text-[11px] text-gray-500">Scheduled attendance rules and required hours</p>
                    </div>
                  </div>

                  <span
                    class="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                    :class="selectedDetailEmp.work_schedule.schedule_type === 'flexible' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'"
                  >
                    {{ selectedDetailEmp.work_schedule.schedule_type === 'flexible' ? 'Flexible Hours' : 'Fixed Timing' }}
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Start Time</span>
                    <span class="font-mono font-bold text-gray-900 text-sm">{{ formatTime(selectedDetailEmp.work_schedule.start_time) }}</span>
                  </div>

                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">End Time</span>
                    <span class="font-mono font-bold text-gray-900 text-sm">{{ formatTime(selectedDetailEmp.work_schedule.end_time) }}</span>
                  </div>

                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Min Work Hours</span>
                    <span class="font-mono font-bold text-emerald-700 text-sm">
                      {{ selectedDetailEmp.work_schedule.min_work_hours ? `${selectedDetailEmp.work_schedule.min_work_hours} hrs/day` : 'Default' }}
                    </span>
                  </div>

                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Punch-in Grace</span>
                    <span class="font-mono font-bold text-gray-900 text-sm">{{ selectedDetailEmp.work_schedule.punch_in_grace || 12 }} mins</span>
                  </div>
                </div>

                <!-- Assigned Weekdays -->
                <div class="space-y-2 pt-2 border-t border-gray-100">
                  <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Weekdays</span>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="day in ALL_WEEKDAYS"
                      :key="day"
                      class="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                      :class="isDayScheduled(day) ? 'bg-emerald-500 text-white shadow-xs' : 'bg-gray-100 text-gray-400'"
                    >
                      {{ day.slice(0, 3) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Geofencing & Work Location Boundaries -->
              <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                      <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
                    </div>
                    <div>
                      <h4 class="text-sm font-bold text-gray-900">Geofencing & Work Location Boundaries</h4>
                      <p class="text-[11px] text-gray-500">Punch-in location verification and remote permissions</p>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <!-- WFM Status -->
                  <div class="p-3.5 rounded-xl border flex items-center justify-between" :class="selectedDetailEmp.work_schedule.wfm_allowed ? 'bg-blue-50/60 border-blue-200' : 'bg-gray-50 border-gray-200'">
                    <div>
                      <span class="text-[10px] text-gray-400 block uppercase font-bold">WFM Policy</span>
                      <span class="font-bold text-gray-900">{{ selectedDetailEmp.work_schedule.wfm_allowed ? 'Work From Home Allowed' : 'Office Only' }}</span>
                    </div>
                    <UIcon :name="selectedDetailEmp.work_schedule.wfm_allowed ? 'i-heroicons-home' : 'i-heroicons-building-office'" class="w-5 h-5 text-blue-600" />
                  </div>

                  <!-- Geofence Status -->
                  <div class="p-3.5 rounded-xl border flex items-center justify-between" :class="selectedDetailEmp.geofencing ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'">
                    <div>
                      <span class="text-[10px] text-gray-400 block uppercase font-bold">Geofence Lock</span>
                      <span class="font-bold text-gray-900">{{ selectedDetailEmp.geofencing ? 'GPS Geofencing Active' : 'No Geofence Enforced' }}</span>
                    </div>
                    <UIcon name="i-heroicons-map-pin" class="w-5 h-5" :class="selectedDetailEmp.geofencing ? 'text-emerald-600' : 'text-amber-600'" />
                  </div>

                  <!-- Office Location -->
                  <div class="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Office GPS Coordinates</span>
                    <span class="font-mono text-gray-900 font-semibold">{{ selectedDetailEmp.work_schedule.office_location || 'Not Configured' }}</span>
                    <span v-if="selectedDetailEmp.work_schedule.office_radius" class="text-[11px] text-gray-500 block">Radius: {{ selectedDetailEmp.work_schedule.office_radius }} meters</span>
                  </div>

                  <!-- Home Location -->
                  <div class="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Home GPS Coordinates</span>
                    <span class="font-mono text-gray-900 font-semibold">{{ selectedDetailEmp.work_schedule.home_location || 'Not Configured' }}</span>
                    <span v-if="selectedDetailEmp.work_schedule.home_radius" class="text-[11px] text-gray-500 block">Radius: {{ selectedDetailEmp.work_schedule.home_radius }} meters</span>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <UIcon name="i-heroicons-clock" class="w-10 h-10 text-gray-400 mx-auto" />
              <h4 class="text-sm font-bold text-gray-800">No Work Schedule Assigned</h4>
              <p class="text-xs text-gray-500 max-w-sm mx-auto">This employee currently has no schedule or GPS geofence configured.</p>
              <button
                type="button"
                class="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                @click="openScheduleFromDetail"
              >
                Configure Work Schedule
              </button>
            </div>
          </div>

          <!-- TAB 4: FAMILY & NOMINEES -->
          <div v-else-if="detailActiveTab === 'family'" class="space-y-6">
            <div v-if="isLoadingDetailProfile" class="py-12 text-center text-gray-500 space-y-2 bg-gray-50 rounded-2xl">
              <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
              <p class="text-xs">Loading family and nominee records...</p>
            </div>

            <template v-else>
              <!-- Immediate Family -->
              <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200/60">
                      <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
                    </div>
                    <h4 class="text-sm font-bold text-gray-900">Parents & Spouse</h4>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Father's Name</span>
                    <span class="font-bold text-gray-900">{{ detailProfileData?.father_name || '-' }}</span>
                  </div>

                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Mother's Name</span>
                    <span class="font-bold text-gray-900">{{ detailProfileData?.mother_name || '-' }}</span>
                  </div>

                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Spouse's Name</span>
                    <span class="font-bold text-gray-900">{{ detailProfileData?.spouse_name || '-' }}</span>
                  </div>
                </div>
              </div>

              <!-- Children Records -->
              <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                      <UIcon name="i-heroicons-face-smile" class="w-4 h-4" />
                    </div>
                    <h4 class="text-sm font-bold text-gray-900">Children Records</h4>
                  </div>

                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {{ (detailProfileData?.children || []).length }} Child(ren)
                  </span>
                </div>

                <div v-if="Array.isArray(detailProfileData?.children) && detailProfileData.children.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div
                    v-for="(child, idx) in detailProfileData.children"
                    :key="idx"
                    class="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800 font-mono">
                        Child {{ idx + 1 }}
                      </span>
                      <span
                        v-if="child.gender"
                        class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                        :class="String(child.gender).toLowerCase() === 'female' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-blue-50 text-blue-700 border border-blue-200'"
                      >
                        {{ child.gender }}
                      </span>
                    </div>

                    <div>
                      <span class="text-[10px] text-gray-400 block uppercase font-bold">Child Name</span>
                      <span class="font-bold text-gray-900">{{ child.name || '-' }}</span>
                    </div>

                    <div v-if="child.dob">
                      <span class="text-[10px] text-gray-400 block uppercase font-bold">Date of Birth</span>
                      <span class="font-mono text-gray-700">{{ child.dob }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-xs text-gray-400 italic py-2">
                  No children records recorded on profile.
                </div>
              </div>

              <!-- Nominees Records -->
              <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
                      <UIcon name="i-heroicons-shield-check" class="w-4 h-4" />
                    </div>
                    <h4 class="text-sm font-bold text-gray-900">Nominees Records</h4>
                  </div>

                  <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    Total Share: {{ calculateTotalNomineeShare(detailProfileData?.nominees) }}%
                  </span>
                </div>

                <div v-if="Array.isArray(detailProfileData?.nominees) && detailProfileData.nominees.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div
                    v-for="(nominee, idx) in detailProfileData.nominees"
                    :key="idx"
                    class="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100/70 text-purple-800 font-mono">
                        Nominee {{ idx + 1 }}
                      </span>
                      <span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {{ nominee.share_percentage || 0 }}% Share
                      </span>
                    </div>

                    <div>
                      <span class="text-[10px] text-gray-400 block uppercase font-bold">Nominee Name</span>
                      <span class="font-bold text-gray-900">{{ nominee.name || '-' }}</span>
                    </div>

                    <div v-if="nominee.relation">
                      <span class="text-[10px] text-gray-400 block uppercase font-bold">Relationship</span>
                      <span class="font-semibold text-gray-700 flex items-center gap-1 mt-0.5">
                        <UIcon name="i-heroicons-heart" class="w-3.5 h-3.5 text-purple-500" />
                        {{ nominee.relation }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-xs text-gray-400 italic py-2">
                  No nominees recorded on profile.
                </div>
              </div>
            </template>
          </div>

          <!-- TAB 5: COMPLIANCE & BANKING -->
          <div v-else-if="detailActiveTab === 'documents'" class="space-y-6">
            <div v-if="isLoadingDetailProfile" class="py-12 text-center text-gray-500 space-y-2 bg-gray-50 rounded-2xl">
              <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
              <p class="text-xs">Loading banking and compliance document records...</p>
            </div>

            <template v-else>
              <!-- Bank Account Details -->
              <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                      <UIcon name="i-heroicons-credit-card" class="w-4 h-4" />
                    </div>
                    <h4 class="text-sm font-bold text-gray-900">Bank Account & Salary Disbursement</h4>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Account Holder</span>
                    <span class="font-bold text-gray-900">{{ detailProfileData?.bank_details?.account_holder || '-' }}</span>
                  </div>

                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Bank Name</span>
                    <span class="font-bold text-gray-900">{{ detailProfileData?.bank_details?.bank_name || '-' }}</span>
                  </div>

                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Account Number</span>
                    <div class="flex items-center justify-between">
                      <span class="font-mono font-bold text-emerald-800">{{ detailProfileData?.bank_details?.account_number || '-' }}</span>
                      <button
                        v-if="detailProfileData?.bank_details?.account_number"
                        type="button"
                        class="text-gray-400 hover:text-emerald-600"
                        title="Copy account number"
                        @click="copyToClipboard(detailProfileData.bank_details.account_number, 'account number')"
                      >
                        <UIcon name="i-heroicons-clipboard-document" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">IFSC Code</span>
                    <div class="flex items-center justify-between">
                      <span class="font-mono font-bold text-emerald-800">{{ detailProfileData?.bank_details?.ifsc_code || '-' }}</span>
                      <button
                        v-if="detailProfileData?.bank_details?.ifsc_code"
                        type="button"
                        class="text-gray-400 hover:text-emerald-600"
                        title="Copy IFSC code"
                        @click="copyToClipboard(detailProfileData.bank_details.ifsc_code, 'IFSC')"
                      >
                        <UIcon name="i-heroicons-clipboard-document" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Cheque / Passbook Attachment Previews -->
                <div v-if="detailDocUrls.cancelled_cheque || detailDocUrls.passbook" class="pt-3 border-t border-gray-100 flex flex-wrap gap-3">
                  <a
                    v-if="detailDocUrls.cancelled_cheque"
                    :href="detailDocUrls.cancelled_cheque"
                    target="_blank"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200"
                  >
                    <UIcon name="i-heroicons-document-arrow-down" class="w-4 h-4" />
                    <span>View Cancelled Cheque</span>
                  </a>

                  <a
                    v-if="detailDocUrls.passbook"
                    :href="detailDocUrls.passbook"
                    target="_blank"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200"
                  >
                    <UIcon name="i-heroicons-document-arrow-down" class="w-4 h-4" />
                    <span>View Bank Passbook</span>
                  </a>
                </div>
              </div>

              <!-- Government ID Documents -->
              <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
                      <UIcon name="i-heroicons-identification" class="w-4 h-4" />
                    </div>
                    <h4 class="text-sm font-bold text-gray-900">Government Identity Records</h4>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <!-- Aadhaar Card -->
                  <div class="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-gray-900">Aadhaar Card</span>
                      <UIcon name="i-heroicons-finger-print" class="w-4 h-4 text-gray-400" />
                    </div>

                    <div class="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
                      <span class="font-mono font-bold text-gray-800">{{ maskAadhaar(detailProfileData?.aadhaar_number) }}</span>
                      <button
                        v-if="detailProfileData?.aadhaar_number"
                        type="button"
                        class="text-gray-400 hover:text-emerald-600"
                        title="Copy Aadhaar"
                        @click="copyToClipboard(detailProfileData.aadhaar_number, 'Aadhaar')"
                      >
                        <UIcon name="i-heroicons-clipboard-document" class="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div class="flex flex-wrap gap-2 pt-1">
                      <a
                        v-if="detailDocUrls.aadhaar_front"
                        :href="detailDocUrls.aadhaar_front"
                        target="_blank"
                        class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200"
                      >
                        <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3" />
                        <span>Front Side</span>
                      </a>
                      <a
                        v-if="detailDocUrls.aadhaar_back"
                        :href="detailDocUrls.aadhaar_back"
                        target="_blank"
                        class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200"
                      >
                        <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3" />
                        <span>Back Side</span>
                      </a>
                      <span v-if="!detailDocUrls.aadhaar_front && !detailDocUrls.aadhaar_back" class="text-[11px] text-gray-400 italic">
                        No document attached
                      </span>
                    </div>
                  </div>

                  <!-- PAN Card -->
                  <div class="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-gray-900">PAN Card</span>
                      <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-gray-400" />
                    </div>

                    <div class="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
                      <span class="font-mono font-bold uppercase text-gray-800">{{ detailProfileData?.pan_number || '-' }}</span>
                      <button
                        v-if="detailProfileData?.pan_number"
                        type="button"
                        class="text-gray-400 hover:text-emerald-600"
                        title="Copy PAN"
                        @click="copyToClipboard(detailProfileData.pan_number, 'PAN')"
                      >
                        <UIcon name="i-heroicons-clipboard-document" class="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div class="pt-1">
                      <a
                        v-if="detailDocUrls.pan"
                        :href="detailDocUrls.pan"
                        target="_blank"
                        class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200"
                      >
                        <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3" />
                        <span>View PAN Doc</span>
                      </a>
                      <span v-else class="text-[11px] text-gray-400 italic">No document attached</span>
                    </div>
                  </div>

                  <!-- Passport -->
                  <div class="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-gray-900">Passport</span>
                      <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-gray-400" />
                    </div>

                    <div class="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
                      <span class="font-mono font-bold uppercase text-gray-800">{{ detailProfileData?.passport_number || '-' }}</span>
                      <button
                        v-if="detailProfileData?.passport_number"
                        type="button"
                        class="text-gray-400 hover:text-emerald-600"
                        title="Copy Passport"
                        @click="copyToClipboard(detailProfileData.passport_number, 'passport')"
                      >
                        <UIcon name="i-heroicons-clipboard-document" class="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div class="pt-1">
                      <a
                        v-if="detailDocUrls.passport"
                        :href="detailDocUrls.passport"
                        target="_blank"
                        class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200"
                      >
                        <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3" />
                        <span>View Passport Doc</span>
                      </a>
                      <span v-else class="text-[11px] text-gray-400 italic">No document attached</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- TAB 6: ACCESS & BIOMETRICS -->
          <div v-else-if="detailActiveTab === 'security'" class="space-y-6">
            <!-- Access Permissions Card -->
            <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                    <UIcon name="i-heroicons-lock-closed" class="w-4 h-4" />
                  </div>
                  <h4 class="text-sm font-bold text-gray-900">Application Access Permissions</h4>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div class="p-3.5 rounded-xl border flex items-center justify-between" :class="selectedDetailEmp.app_access ? 'bg-emerald-50/50 border-emerald-200' : 'bg-gray-50 border-gray-200'">
                  <div>
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Mobile App Access</span>
                    <span class="font-bold text-gray-900">{{ selectedDetailEmp.app_access ? 'Active (Allowed)' : 'Blocked' }}</span>
                  </div>
                  <UIcon name="i-heroicons-device-phone-mobile" class="w-5 h-5" :class="selectedDetailEmp.app_access ? 'text-emerald-600' : 'text-gray-400'" />
                </div>

                <div class="p-3.5 rounded-xl border flex items-center justify-between" :class="selectedDetailEmp.web_access ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50 border-gray-200'">
                  <div>
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Web Dashboard</span>
                    <span class="font-bold text-gray-900">{{ selectedDetailEmp.web_access ? 'Active (Allowed)' : 'Blocked' }}</span>
                  </div>
                  <UIcon name="i-heroicons-computer-desktop" class="w-5 h-5" :class="selectedDetailEmp.web_access ? 'text-blue-600' : 'text-gray-400'" />
                </div>

                <div class="p-3.5 rounded-xl border flex items-center justify-between" :class="selectedDetailEmp.geofencing ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'">
                  <div>
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Geofencing Enforced</span>
                    <span class="font-bold text-gray-900">{{ selectedDetailEmp.geofencing ? 'Yes (Enforced)' : 'No (Anywhere)' }}</span>
                  </div>
                  <UIcon name="i-heroicons-map-pin" class="w-5 h-5" :class="selectedDetailEmp.geofencing ? 'text-emerald-600' : 'text-amber-600'" />
                </div>
              </div>
            </div>

            <!-- Device Registration Card -->
            <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200/60">
                    <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4" />
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-gray-900">Bound Mobile Hardware Device</h4>
                    <p class="text-[11px] text-gray-500">Device linked for attendance punches and security</p>
                  </div>
                </div>

                <span
                  class="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase"
                  :class="selectedDetailEmp.device_id || selectedDetailEmp.device_info ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'"
                >
                  {{ selectedDetailEmp.device_id || selectedDetailEmp.device_info ? 'Device Paired' : 'Not Paired' }}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Platform / OS</span>
                  <span class="font-bold text-gray-900">{{ selectedDetailEmp.device_info?.platform || selectedDetailEmp.device_info?.systemName || '-' }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Device Model</span>
                  <span class="font-bold text-gray-900">{{ selectedDetailEmp.device_info?.model || selectedDetailEmp.device_info?.name || '-' }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Manufacturer</span>
                  <span class="font-bold text-gray-900">{{ selectedDetailEmp.device_info?.manufacturer || '-' }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1 sm:col-span-2 lg:col-span-3">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Device Identifier</span>
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-gray-800 text-[11px] truncate">{{ selectedDetailEmp.device_id || selectedDetailEmp.device_info?.identifier || selectedDetailEmp.device_info?.deviceId || '-' }}</span>
                    <button
                      v-if="selectedDetailEmp.device_id || selectedDetailEmp.device_info?.identifier"
                      type="button"
                      class="text-gray-400 hover:text-emerald-600 shrink-0 ml-2"
                      title="Copy Device ID"
                      @click="copyToClipboard(selectedDetailEmp.device_id || selectedDetailEmp.device_info?.identifier, 'Device ID')"
                    >
                      <UIcon name="i-heroicons-clipboard-document" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Face Biometric Recognition Card -->
            <div class="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
                    <UIcon name="i-heroicons-face-smile" class="w-4 h-4" />
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-gray-900">Face Biometric Authentication</h4>
                    <p class="text-[11px] text-gray-500">Facial recognition matching configuration</p>
                  </div>
                </div>

                <span
                  class="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase"
                  :class="selectedDetailEmp.face_enrolled_at ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-amber-100 text-amber-800 border border-amber-200'"
                >
                  {{ selectedDetailEmp.face_enrolled_at ? 'Face Enrolled' : 'Pending Enrollment' }}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Face Required</span>
                  <span class="font-bold text-gray-900">{{ selectedDetailEmp.face_recognition ? 'Yes (Enforced)' : 'Optional' }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Enrolled At</span>
                  <span class="font-semibold text-gray-900">{{ formatDate(selectedDetailEmp.face_enrolled_at) }}</span>
                </div>

                <div class="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span class="text-[10px] text-gray-400 block uppercase font-bold">Match Threshold</span>
                  <span class="font-mono font-bold text-purple-700">{{ selectedDetailEmp.face_match_threshold ?? 0.75 }}</span>
                </div>
              </div>

              <!-- Enrolled Face Photo Preview -->
              <div v-if="detailFacePhotoUrl" class="p-4 rounded-xl bg-purple-50/50 border border-purple-200 flex flex-col sm:flex-row items-center gap-4">
                <div class="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border-2 border-white shadow-md shrink-0">
                  <img :src="detailFacePhotoUrl" alt="Enrolled Face" class="w-full h-full object-cover" />
                </div>
                <div class="space-y-1 text-center sm:text-left">
                  <div class="text-xs font-bold text-purple-950">Active Face Enrollment Photo</div>
                  <p class="text-[11px] text-purple-700">This photo template is used for mobile punch-in verification with cosine similarity matching.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
              @click="isDetailModalOpen = false"
            >
              Close
            </button>
          </div>

          <div class="flex items-center gap-2">
            <!-- Edit Profile Shortcut -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
              @click="openEditFromDetail"
            >
              <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
              <span>Edit Profile Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= MODAL 1: EDIT PROFILE ================= -->
    <div
      v-if="isEditModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 class="text-base font-bold text-gray-900">Edit Employee Profile</h3>
            <p class="text-xs text-gray-500">{{ activeEmp?.email }}</p>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isEditModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveProfileEdit" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Full Name -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Full Name *</label>
              <input
                v-model="editForm.full_name"
                type="text"
                required
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <!-- Employee Code -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-gray-700">Employee Code *</label>
                <span class="text-[10px] text-gray-400 font-mono">Min. 3 characters</span>
              </div>
              <input
                v-model="editForm.employee_code"
                type="text"
                required
                minlength="3"
                maxlength="20"
                placeholder="e.g. ABB001"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border text-gray-900 text-xs focus:bg-white focus:outline-none font-mono uppercase transition-colors"
                :class="editCodeError ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'"
                @input="validateEditCode"
                @blur="validateEditCode"
              />
              <p v-if="editCodeError" class="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <UIcon name="i-heroicons-exclamation-circle" class="w-3.5 h-3.5 shrink-0" />
                <span>{{ editCodeError }}</span>
              </p>
            </div>

            <!-- Phone -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Phone</label>
              <input
                v-model="editForm.phone"
                type="tel"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <!-- Department -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Department</label>
              <select
                v-model="editForm.department"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
              >
                <option :value="null">Unassigned</option>
                <option v-for="d in adminStore.departments" :key="d.id" :value="d.id">
                  {{ d.name }}
                </option>
              </select>
            </div>

            <!-- Position -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Position / Designation</label>
              <select
                v-model="editForm.position"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
              >
                <option :value="null">Unassigned</option>
                <option v-for="p in adminStore.positions" :key="p.id" :value="p.id">
                  {{ p.designation }}
                </option>
              </select>
            </div>

            <!-- Employment Type -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Employment Type</label>
              <select
                v-model="editForm.employment_type"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>

            <!-- Date of Joining -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Date of Joining</label>
              <input
                v-model="editForm.date_of_joining"
                type="date"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none cursor-pointer [color-scheme:light]"
                @click="(e) => (e.target as HTMLInputElement).showPicker?.()"
              />
            </div>

            <!-- Approval Levels -->
            <div class="sm:col-span-2 space-y-2 pt-2 border-t border-gray-100">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <UIcon name="i-heroicons-user-group" class="w-4 h-4 text-emerald-600" />
                  <label class="text-xs font-semibold text-gray-700">Approval Hierarchy Levels</label>
                </div>
                <span
                  v-if="maxApprovalLevels > 0"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  :class="maxApprovalLevels >= 3 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'"
                >
                  Max {{ maxApprovalLevels }} Level{{ maxApprovalLevels > 1 ? 's' : '' }} Available
                </span>
                <span v-else class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  No Approvers in Hierarchy
                </span>
              </div>

              <select
                v-model.number="editForm.approval_levels"
                :disabled="maxApprovalLevels === 0"
                class="w-full px-3 py-2 rounded-xl border text-gray-900 text-xs focus:outline-none transition-all cursor-pointer"
                :class="maxApprovalLevels === 0 ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-500'"
              >
                <template v-if="maxApprovalLevels === 0">
                  <option :value="1" disabled>0 Managers in Hierarchy (Cannot assign approval levels)</option>
                </template>
                <template v-else>
                  <option
                    v-for="lvl in maxApprovalLevels"
                    :key="lvl"
                    :value="lvl"
                  >
                    {{ getApprovalLevelLabel(lvl) }}
                  </option>
                </template>
              </select>

              <!-- Hierarchy Approvers Chain Preview -->
              <div v-if="availableHierarchyApprovers.length > 0" class="p-3 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2 text-[11px]">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Department Approvers Chain</span>
                  <span class="text-gray-500 font-mono">{{ availableHierarchyApprovers.length }} Level(s) in Tree</span>
                </div>
                <div class="space-y-1.5">
                  <div
                    v-for="(appr, idx) in availableHierarchyApprovers"
                    :key="appr.managerId"
                    class="flex items-center gap-2 p-1.5 rounded-lg transition-colors"
                    :class="idx + 1 <= editForm.approval_levels ? 'bg-white border border-emerald-200/70 text-gray-900 font-semibold shadow-xs' : 'text-gray-400 opacity-60'"
                  >
                    <span
                      class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      :class="idx + 1 <= editForm.approval_levels ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'"
                    >
                      L{{ appr.level }}
                    </span>
                    <span class="truncate">
                      {{ appr.managerName }}
                      <span class="text-[10px] text-gray-500 font-normal">({{ appr.departmentName }})</span>
                    </span>
                    <span
                      v-if="idx + 1 === editForm.approval_levels"
                      class="ml-auto text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0"
                    >
                      Final Approver
                    </span>
                  </div>
                </div>
              </div>

              <!-- Hierarchy limit notice -->
              <p v-if="maxApprovalLevels > 0 && maxApprovalLevels < 3" class="text-[11px] text-amber-700 bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex items-center gap-2">
                <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Hierarchy limit: Only <strong>{{ maxApprovalLevels }}</strong> manager level(s) exist in this department path. Level {{ maxApprovalLevels + 1 }} is unavailable to prevent requests getting stuck.
                </span>
              </p>
              <p v-else-if="maxApprovalLevels === 0" class="text-[11px] text-rose-700 bg-rose-50/70 border border-rose-200/80 rounded-xl p-2.5 flex items-center gap-2">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  No manager is assigned to this department or its parents. Requests cannot be completed until a manager is designated in the hierarchy.
                </span>
              </p>
            </div>
          </div>

          <!-- Feature Toggles -->
          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <UCheckbox
              v-model="editForm.app_access"
              color="primary"
              size="sm"
              :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
            >
              <template #label>
                <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">App Access</span>
              </template>
            </UCheckbox>
            <UCheckbox
              v-model="editForm.web_access"
              color="primary"
              size="sm"
              :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
            >
              <template #label>
                <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Web Access</span>
              </template>
            </UCheckbox>
            <UCheckbox
              v-model="editForm.geofencing"
              color="primary"
              size="sm"
              :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
            >
              <template #label>
                <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Geofencing</span>
              </template>
            </UCheckbox>
            <UCheckbox
              v-model="editForm.face_recognition"
              color="primary"
              size="sm"
              :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
            >
              <template #label>
                <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Face Recognition</span>
              </template>
            </UCheckbox>
          </div>

          <!-- Face Recognition Settings & Enrollment Card -->
          <div
            v-if="editForm.face_recognition"
            class="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-3.5"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <UIcon name="i-heroicons-face-smile" class="w-4 h-4 text-purple-600" />
                Face Biometrics & Matching
              </span>
              <span
                v-if="activeEmp?.face_enrolled_at"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"
              >
                Enrolled
              </span>
              <span
                v-else
                class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
              >
                Pending First Punch
              </span>
            </div>

            <!-- Sensitivity Threshold Slider -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-gray-700">Cosine Match Sensitivity</label>
                <span class="font-mono text-xs font-bold text-purple-700 bg-white px-2 py-0.5 rounded-lg border border-purple-200">
                  {{ Number(editForm.face_match_threshold || 0.75).toFixed(2) }}
                </span>
              </div>
              <input
                v-model.number="editForm.face_match_threshold"
                type="range"
                min="0.60"
                max="0.95"
                step="0.01"
                class="w-full accent-purple-600 cursor-pointer"
              />
              <div class="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>0.60 (Lenient)</span>
                <span class="text-purple-700 font-bold">0.75 (Standard)</span>
                <span>0.95 (Strict)</span>
              </div>
              <p class="text-[11px] text-gray-500">
                Adjust for this employee if needed. Default is 0.75. Lower (0.70) if employee wears glasses or faces outdoor lighting glare.
              </p>
            </div>

            <!-- Enrolled Photo & Reset Section -->
            <div v-if="activeEmp?.face_enrolled_at" class="pt-3 border-t border-purple-200/60 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  <img
                    v-if="enrolledPhotoUrl"
                    :src="enrolledPhotoUrl"
                    alt="Enrolled Face"
                    class="w-full h-full object-cover"
                  />
                  <UIcon v-else name="i-heroicons-user" class="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div class="text-xs font-bold text-gray-900">Enrolled Face Scan</div>
                  <div class="text-[10px] text-gray-500 font-mono">
                    {{ formatDate(activeEmp.face_enrolled_at) }}
                  </div>
                  <div class="text-[10px] text-purple-700 font-mono font-medium">
                    192-dim vector stored
                  </div>
                </div>
              </div>

              <button
                type="button"
                :disabled="isResettingFace"
                class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Wipe face embedding to force re-enrollment on next punch"
                @click="resetFaceEnrollment"
              >
                <UIcon v-if="isResettingFace" name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
                <UIcon v-else name="i-heroicons-arrow-path" class="w-3.5 h-3.5" />
                <span>Reset Face</span>
              </button>
            </div>

            <div v-else class="text-[11px] text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80 flex items-start gap-2">
              <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Employee has not enrolled their face yet. The Convise mobile app will automatically prompt them to capture and enroll their face on their first mobile punch.
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
              @click="isEditModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <UIcon v-if="isSaving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ================= MODAL 2: PASSWORD RESET ================= -->
    <div
      v-if="isPasswordModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-md bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <UIcon name="i-heroicons-key" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-gray-900">Reset Staff Password</h3>
              <p class="text-[11px] text-gray-500">{{ activeEmp?.email }}</p>
            </div>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isPasswordModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="savePasswordReset" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-700">New Password *</label>
            <input
              v-model="newPassword"
              type="password"
              required
              minlength="6"
              placeholder="Minimum 6 characters"
              class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-700">Confirm New Password *</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              minlength="6"
              placeholder="Retype password"
              class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div v-if="passwordError" class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {{ passwordError }}
          </div>

          <div v-if="passwordSuccess" class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            Password successfully updated!
          </div>

          <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
              @click="isPasswordModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSavingPassword"
              class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-50 shadow-md shadow-amber-500/20"
            >
              <UIcon v-if="isSavingPassword" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ================= MODAL 3: WORK SCHEDULE & GEOFENCING ================= -->
    <div
      v-if="isScheduleModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 class="text-base font-bold text-gray-900">Geofencing & Work Schedule</h3>
            <p class="text-xs text-gray-500">{{ activeEmp?.full_name }} ({{ activeEmp?.email }})</p>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isScheduleModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveSchedule" class="space-y-4">
          <!-- Schedule Type & Working Hours Configuration Card -->
          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-teal-600" />
                <span>Schedule Type & Working Hours</span>
              </label>
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                :class="scheduleForm.schedule_type === 'fixed' ? 'bg-teal-100 text-teal-800 border border-teal-200' : 'bg-purple-100 text-purple-800 border border-purple-200'"
              >
                {{ scheduleForm.schedule_type === 'fixed' ? 'Fixed Timings' : 'Flexible Timings' }}
              </span>
            </div>

            <!-- Segmented Selector: Fixed vs Flexible -->
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer"
                :class="scheduleForm.schedule_type === 'fixed' ? 'bg-white border-teal-500 shadow-sm ring-1 ring-teal-500' : 'bg-white/60 border-gray-200 hover:bg-white text-gray-600'"
                @click="setScheduleType('fixed')"
              >
                <div class="p-1.5 rounded-lg shrink-0" :class="scheduleForm.schedule_type === 'fixed' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'">
                  <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-bold" :class="scheduleForm.schedule_type === 'fixed' ? 'text-teal-900' : 'text-gray-800'">
                    Fixed Schedule
                  </div>
                  <div class="text-[10px] text-gray-500 line-clamp-1">
                    Start & end shift timings enforced
                  </div>
                </div>
              </button>

              <button
                type="button"
                class="p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer"
                :class="scheduleForm.schedule_type === 'flexible' ? 'bg-white border-purple-500 shadow-sm ring-1 ring-purple-500' : 'bg-white/60 border-gray-200 hover:bg-white text-gray-600'"
                @click="setScheduleType('flexible')"
              >
                <div class="p-1.5 rounded-lg shrink-0" :class="scheduleForm.schedule_type === 'flexible' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400'">
                  <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-4 h-4" />
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-bold" :class="scheduleForm.schedule_type === 'flexible' ? 'text-purple-900' : 'text-gray-800'">
                    Flexible Schedule
                  </div>
                  <div class="text-[10px] text-gray-500 line-clamp-1">
                    Timings ignored, direct min hours
                  </div>
                </div>
              </button>
            </div>

            <!-- Timings & Hours Row -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 items-start">
              <!-- Shift Start Time -->
              <div class="space-y-1.5 flex flex-col">
                <div class="flex items-center justify-between min-h-[22px] gap-1">
                  <label class="text-xs font-semibold truncate" :class="scheduleForm.schedule_type === 'fixed' ? 'text-gray-700' : 'text-gray-400'">
                    Shift Start Time {{ scheduleForm.schedule_type === 'fixed' ? '*' : '' }}
                  </label>
                  <span
                    v-if="scheduleForm.schedule_type === 'fixed'"
                    class="text-[9px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 whitespace-nowrap"
                  >
                    Required
                  </span>
                  <span
                    v-else
                    class="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 whitespace-nowrap"
                  >
                    Ignored
                  </span>
                </div>
                <input
                  v-model="scheduleForm.start_time"
                  type="time"
                  :disabled="scheduleForm.schedule_type === 'flexible'"
                  :required="scheduleForm.schedule_type === 'fixed'"
                  class="w-full h-[38px] px-3 rounded-xl border text-xs focus:outline-none transition-all font-mono [color-scheme:light]"
                  :class="[
                    scheduleForm.schedule_type === 'fixed'
                      ? 'bg-white border-gray-200 text-gray-900 focus:border-teal-500 cursor-pointer shadow-sm'
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  ]"
                  @click="(e) => scheduleForm.schedule_type === 'fixed' && (e.target as HTMLInputElement).showPicker?.()"
                />
              </div>

              <!-- Shift End Time -->
              <div class="space-y-1.5 flex flex-col">
                <div class="flex items-center justify-between min-h-[22px] gap-1">
                  <label class="text-xs font-semibold truncate" :class="scheduleForm.schedule_type === 'fixed' ? 'text-gray-700' : 'text-gray-400'">
                    Shift End Time {{ scheduleForm.schedule_type === 'fixed' ? '*' : '' }}
                  </label>
                  <span
                    v-if="scheduleForm.schedule_type === 'fixed'"
                    class="text-[9px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 whitespace-nowrap"
                  >
                    Required
                  </span>
                  <span
                    v-else
                    class="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 whitespace-nowrap"
                  >
                    Ignored
                  </span>
                </div>
                <input
                  v-model="scheduleForm.end_time"
                  type="time"
                  :disabled="scheduleForm.schedule_type === 'flexible'"
                  :required="scheduleForm.schedule_type === 'fixed'"
                  class="w-full h-[38px] px-3 rounded-xl border text-xs focus:outline-none transition-all font-mono [color-scheme:light]"
                  :class="[
                    scheduleForm.schedule_type === 'fixed'
                      ? 'bg-white border-gray-200 text-gray-900 focus:border-teal-500 cursor-pointer shadow-sm'
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  ]"
                  @click="(e) => scheduleForm.schedule_type === 'fixed' && (e.target as HTMLInputElement).showPicker?.()"
                />
              </div>

              <!-- Min Work Hours -->
              <div class="space-y-1.5 flex flex-col">
                <div class="flex items-center justify-between min-h-[22px] gap-1">
                  <label class="text-xs font-semibold text-gray-700 truncate">Min Work Hours *</label>
                  <span
                    v-if="scheduleForm.schedule_type === 'fixed'"
                    class="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 whitespace-nowrap"
                  >
                    Auto
                  </span>
                  <span
                    v-else
                    class="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 whitespace-nowrap"
                  >
                    Editable
                  </span>
                </div>
                <!-- Single Cohesive Hours & Minutes Field -->
                <div
                  class="w-full h-[38px] rounded-xl border flex items-center overflow-hidden transition-all"
                  :class="[
                    scheduleForm.schedule_type === 'fixed'
                      ? 'bg-gray-100/80 border-gray-200 text-gray-700 cursor-not-allowed'
                      : 'bg-white border-purple-300 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 shadow-sm'
                  ]"
                >
                  <!-- Hours -->
                  <div class="relative flex-1 h-full flex items-center">
                    <input
                      v-model.number="scheduleFlexibleHours"
                      type="number"
                      min="0"
                      max="24"
                      :readonly="scheduleForm.schedule_type === 'fixed'"
                      title="Work Hours"
                      placeholder="0"
                      class="w-full h-full pl-3 pr-8 bg-transparent font-mono text-xs font-bold text-center focus:outline-none"
                      :class="scheduleForm.schedule_type === 'fixed' ? 'text-gray-700 cursor-not-allowed' : 'text-purple-900'"
                    />
                    <span class="absolute right-2 text-[11px] font-semibold text-gray-400 select-none pointer-events-none">hrs</span>
                  </div>

                  <span class="text-gray-300 font-bold select-none">•</span>

                  <!-- Minutes -->
                  <div class="relative flex-1 h-full flex items-center">
                    <input
                      v-model.number="scheduleFlexibleMinutes"
                      type="number"
                      min="0"
                      max="59"
                      step="5"
                      :readonly="scheduleForm.schedule_type === 'fixed'"
                      title="Work Minutes"
                      placeholder="0"
                      class="w-full h-full pl-3 pr-8 bg-transparent font-mono text-xs font-bold text-center focus:outline-none"
                      :class="scheduleForm.schedule_type === 'fixed' ? 'text-gray-700 cursor-not-allowed' : 'text-purple-900'"
                    />
                    <span class="absolute right-2 text-[11px] font-semibold text-gray-400 select-none pointer-events-none">min</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Informational Notice -->
            <div
              v-if="scheduleForm.schedule_type === 'fixed'"
              class="text-[11px] text-teal-700 bg-teal-50/70 border border-teal-200/80 rounded-xl px-3 py-2 flex items-center gap-2"
            >
              <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                Fixed Schedule: Shift runs from <strong>{{ scheduleForm.start_time }}</strong> to <strong>{{ scheduleForm.end_time }}</strong>. Minimum required hours dynamically computed as <strong>{{ formatHoursToHuman(scheduleForm.min_work_hours) }}</strong> (after subtracting {{ scheduleForm.punch_in_grace || 0 }}m punch-in grace).
              </span>
            </div>
            <div
              v-else
              class="text-[11px] text-purple-700 bg-purple-50/70 border border-purple-200/80 rounded-xl px-3 py-2 flex items-center gap-2"
            >
              <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                Flexible Schedule: Shift start and end timings are <strong>ignored</strong>. Minimum work hours can be adjusted directly (currently <strong>{{ formatHoursToHuman(scheduleForm.min_work_hours) }}</strong>).
              </span>
            </div>

            <!-- Grace Period & Shift Pattern Sub-row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-200/70">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-700">Punch-in Grace (Minutes)</label>
                <input
                  v-model.number="scheduleForm.punch_in_grace"
                  type="number"
                  min="0"
                  max="60"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-700">Shift Pattern</label>
                <select
                  v-model="scheduleForm.shift_pattern"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-teal-500 focus:outline-none"
                >
                  <option value="day">Day Shift</option>
                  <option value="night">Night Shift</option>
                  <option value="rotational">Rotational</option>
                </select>
              </div>
            </div>
          </div>

          <!-- WFM Allowed Toggle -->
          <div class="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
            <div>
              <div class="text-xs font-bold text-gray-900">Work From Home (WFM) Allowed</div>
              <div class="text-[11px] text-gray-500">Permits staff to punch attendance from authorized home location coordinates.</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="scheduleForm.wfm_allowed" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500" />
            </label>
          </div>

          <!-- Office Geofence -->
          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                <UIcon name="i-heroicons-building-office" class="w-4 h-4 text-teal-600" />
                <span>Office Coordinates & Perimeter</span>
              </div>
              <button
                type="button"
                class="text-[10px] text-teal-700 hover:underline font-bold"
                @click="scheduleForm.office_location = systemConfigStore.officeLocation || '28.560247, 77.199301'"
              >
                Set Default HQ
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">Office Coordinates (Lat, Long)</label>
                <input
                  v-model="scheduleForm.office_location"
                  type="text"
                  :placeholder="systemConfigStore.officeLocation || '28.560247, 77.199301'"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">Perimeter Radius (meters)</label>
                <input
                  v-model.number="scheduleForm.office_radius"
                  type="number"
                  min="20"
                  max="5000"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Home Geofence -->
          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                <UIcon name="i-heroicons-home" class="w-4 h-4 text-blue-600" />
                <span>Home Coordinates (Required for WFM)</span>
              </div>
              <button
                type="button"
                class="text-[10px] text-blue-700 hover:underline font-bold"
                @click="captureDeviceGPS"
              >
                Capture Current GPS
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">Home Coordinates (Lat, Long)</label>
                <input
                  v-model="scheduleForm.home_location"
                  type="text"
                  placeholder="e.g. 28.560247, 77.199301"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">Perimeter Radius (meters)</label>
                <input
                  v-model.number="scheduleForm.home_radius"
                  type="number"
                  min="20"
                  max="5000"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Field / Market Work Locations -->
          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-purple-600" />
                <span>Field / Market Work Locations (Named Areas)</span>
              </div>
              <span class="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                Reverse Geocoded
              </span>
            </div>
            <p class="text-[11px] text-gray-500">
              Permits staff to punch attendance in designated cities or localities when WFM is enabled (matched by reverse geocoding placemarks).
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2 space-y-1">
                <label class="text-[11px] text-gray-600 font-medium">Allowed Cities / Localities</label>
                <LocationTagsInput
                  v-model="scheduleForm.work_location_names"
                  placeholder="Type city or locality and press Enter or comma..."
                />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] text-gray-600 font-medium">Detection Radius (meters)</label>
                <input
                  v-model.number="scheduleForm.work_location_radius"
                  type="number"
                  min="10"
                  max="50000"
                  placeholder="100"
                  class="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Weekdays Selection -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-gray-700">Working Weekdays</label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="text-[11px] text-teal-700 hover:text-teal-800 font-semibold hover:underline"
                  @click="scheduleForm.weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']"
                >
                  Mon-Fri
                </button>
                <span class="text-gray-300 text-xs">|</span>
                <button
                  type="button"
                  class="text-[11px] text-teal-700 hover:text-teal-800 font-semibold hover:underline"
                  @click="scheduleForm.weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']"
                >
                  Mon-Sat
                </button>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="day in availableDays"
                :key="day.key"
                type="button"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                :class="[
                  isWeekdaySelected(day.key)
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-500/20'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                ]"
                @click="toggleWeekday(day.key)"
              >
                {{ day.label }}
              </button>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
              @click="isScheduleModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSavingSchedule"
              class="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-teal-500/20 disabled:opacity-50"
            >
              <UIcon v-if="isSavingSchedule" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>Save Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ================= MODAL 4: EMPLOYEE STATUS CONFIRMATION ================= -->
    <div
      v-if="isStatusModalOpen && statusTargetEmp"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-md bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-5">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div
              :class="[
                'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                isDeactivating ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              ]"
            >
              <UIcon :name="isDeactivating ? 'i-heroicons-no-symbol' : 'i-heroicons-check-circle'" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-gray-900">
                {{ isDeactivating ? 'Deactivate Employee' : 'Reactivate Employee' }}
              </h3>
              <p class="text-xs text-gray-500 truncate max-w-[240px]">
                {{ statusTargetEmp.full_name }} ({{ statusTargetEmp.employee_code || statusTargetEmp.email }})
              </p>
            </div>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isStatusModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="space-y-4">
          <p class="text-xs text-gray-600 leading-relaxed">
            Are you sure you want to {{ isDeactivating ? 'deactivate' : 'reactivate' }}
            <span class="font-bold text-gray-900">{{ statusTargetEmp.full_name }}</span>?
            <span v-if="isDeactivating">
              The employee will be marked as inactive and won't be able to perform regular workflow operations.
            </span>
            <span v-else>
              The employee will be restored as active and eligible for regular workflow operations.
            </span>
          </p>

          <!-- Access Permissions Toggles -->
          <div
            :class="[
              'p-4 rounded-2xl border space-y-3',
              isDeactivating ? 'bg-red-50/50 border-red-200/80' : 'bg-emerald-50/50 border-emerald-200/80'
            ]"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-900">
                {{ isDeactivating ? 'Revoke System Access' : 'Grant System Access' }}
              </span>
              <span class="text-[10px] text-gray-500 font-medium">Select options below</span>
            </div>

            <div class="space-y-2.5">
              <!-- App Access Option -->
              <label class="flex items-start gap-3 cursor-pointer select-none group p-1.5 rounded-xl hover:bg-black/[0.02] transition-colors">
                <div class="relative flex items-center justify-center shrink-0 mt-0.5">
                  <input
                    v-model="toggleAppAccess"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div
                    class="w-4 h-4 rounded border transition-all flex items-center justify-center shadow-xs"
                    :class="[
                      toggleAppAccess
                        ? (isDeactivating ? 'bg-red-600 border-red-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white')
                        : 'bg-white border-gray-300 text-transparent group-hover:border-gray-400'
                    ]"
                  >
                    <UIcon name="i-heroicons-check" class="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-gray-800">
                      {{ isDeactivating ? 'Disable Mobile App Access (app_access)' : 'Enable Mobile App Access (app_access)' }}
                    </span>
                    <span
                      class="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      :class="statusTargetEmp.app_access ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'"
                    >
                      Currently: {{ statusTargetEmp.app_access ? 'Enabled' : 'Disabled' }}
                    </span>
                  </div>
                  <span class="text-[11px] text-gray-500 block">
                    {{ isDeactivating ? 'Prevents mobile app login and attendance punch-in' : 'Allows mobile app login and regular attendance punch-in' }}
                  </span>
                </div>
              </label>

              <!-- Web Access Option -->
              <label class="flex items-start gap-3 cursor-pointer select-none group p-1.5 rounded-xl hover:bg-black/[0.02] transition-colors">
                <div class="relative flex items-center justify-center shrink-0 mt-0.5">
                  <input
                    v-model="toggleWebAccess"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div
                    class="w-4 h-4 rounded border transition-all flex items-center justify-center shadow-xs"
                    :class="[
                      toggleWebAccess
                        ? (isDeactivating ? 'bg-red-600 border-red-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white')
                        : 'bg-white border-gray-300 text-transparent group-hover:border-gray-400'
                    ]"
                  >
                    <UIcon name="i-heroicons-check" class="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-gray-800">
                      {{ isDeactivating ? 'Disable Web Portal Access (web_access)' : 'Enable Web Portal Access (web_access)' }}
                    </span>
                    <span
                      class="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      :class="statusTargetEmp.web_access ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'"
                    >
                      Currently: {{ statusTargetEmp.web_access ? 'Enabled' : 'Disabled' }}
                    </span>
                  </div>
                  <span class="text-[11px] text-gray-500 block">
                    {{ isDeactivating ? 'Prevents access to web management dashboard' : 'Grants access to web portal features and dashboard' }}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div v-if="statusError" class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {{ statusError }}
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
            @click="isStatusModalOpen = false"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="isUpdatingStatus"
            :class="[
              'px-5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50',
              isDeactivating
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
            ]"
            @click="confirmToggleStatus"
          >
            <UIcon v-if="isUpdatingStatus" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <UIcon v-else :name="isDeactivating ? 'i-heroicons-no-symbol' : 'i-heroicons-check'" class="w-4 h-4" />
            <span>{{ isDeactivating ? 'Confirm Deactivation' : 'Confirm Activation' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useAdminStore, type AdminEmployee } from "~/stores/admin";
import { useSystemConfigStore } from "~/stores/systemConfig";

const adminStore = useAdminStore();
const systemConfigStore = useSystemConfigStore();
const supabase = useSupabaseClient();

// Filters & Search
const searchQuery = ref("");
const selectedDepartment = ref<number | "ALL">("ALL");
const selectedStatus = ref<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
const selectedWfm = ref<"ALL" | "WFM_YES" | "WFM_NO">("ALL");
const isRefreshing = ref(false);

// Pagination
const currentPage = ref(1);
const pageSize = 15;

// Modal States
const isEditModalOpen = ref(false);
const isPasswordModalOpen = ref(false);
const isScheduleModalOpen = ref(false);
const activeEmp = ref<AdminEmployee | null>(null);

// Employee Details Modal State
const isDetailModalOpen = ref(false);
const selectedDetailEmp = ref<AdminEmployee | null>(null);
const detailActiveTab = ref<"overview" | "job" | "schedule" | "family" | "documents" | "security">("overview");
const detailProfileData = ref<any | null>(null);
const isLoadingDetailProfile = ref(false);
const detailFacePhotoUrl = ref<string | null>(null);
const detailDocUrls = ref<Record<string, string | null>>({});
const copySuccessMsg = ref("");
let copyTimeout: any = null;
const ALL_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Forms
const editForm = ref({
  full_name: "",
  employee_code: "",
  phone: "",
  department: null as number | null,
  position: null as number | null,
  employment_type: "full_time",
  date_of_joining: "",
  approval_levels: 1,
  app_access: true,
  web_access: true,
  geofencing: true,
  face_recognition: false,
  face_match_threshold: 0.75,
});

const editCodeError = ref("");

function validateEditCode(): boolean {
  const val = (editForm.value.employee_code || "").trim().toUpperCase();
  editForm.value.employee_code = val;
  if (!val) {
    editCodeError.value = "Employee code is required.";
  } else if (val.length < 3 || val.length > 20) {
    editCodeError.value = "Employee code must be between 3 and 20 characters.";
  } else if (!/^[A-Z0-9_-]+$/.test(val)) {
    editCodeError.value = "Only uppercase letters, numbers, hyphens, and underscores allowed.";
  } else if (
    adminStore.employees.some(
      (e) => e.id !== activeEmp.value?.id && e.employee_code?.toUpperCase() === val
    )
  ) {
    editCodeError.value = "This employee code is already assigned to another employee.";
  } else {
    editCodeError.value = "";
  }
  return !editCodeError.value;
}

interface HierarchyApprover {
  level: number;
  managerId: string;
  managerName: string;
  departmentName: string;
}

function getHierarchyApproversFor(deptId: number | null, employeeId?: string | null): HierarchyApprover[] {
  if (!deptId) return [];

  const approvers: HierarchyApprover[] = [];
  const visitedDeptIds = new Set<number>();
  const seenManagerIds = new Set<string>();

  let currentDeptId: number | null = deptId;

  while (currentDeptId && !visitedDeptIds.has(currentDeptId) && approvers.length < 3) {
    visitedDeptIds.add(currentDeptId);
    const dept = adminStore.departments.find((d) => d.id === currentDeptId);
    if (!dept) break;

    const managerId = dept.manager_id;
    if (managerId && managerId !== employeeId && !seenManagerIds.has(managerId)) {
      seenManagerIds.add(managerId);

      const managerProfile = adminStore.employees.find((e) => e.id === managerId);
      const managerName = dept.manager?.full_name || managerProfile?.full_name || "Department Manager";

      approvers.push({
        level: approvers.length + 1,
        managerId,
        managerName,
        departmentName: dept.name,
      });
    }

    currentDeptId = dept.parent_id;
  }

  return approvers;
}

const availableHierarchyApprovers = computed(() => {
  return getHierarchyApproversFor(editForm.value.department, activeEmp.value?.id);
});

const maxApprovalLevels = computed(() => {
  return availableHierarchyApprovers.value.length;
});

function getApprovalLevelLabel(lvl: number): string {
  const appr = availableHierarchyApprovers.value[lvl - 1];
  if (!appr) return `${lvl} Level${lvl > 1 ? "s" : ""}`;
  if (lvl === 1) {
    return `1 Level (${appr.managerName} - ${appr.departmentName})`;
  } else if (lvl === 2) {
    return `2 Levels (Up to: ${appr.managerName} - ${appr.departmentName})`;
  } else {
    return `3 Levels (Up to: ${appr.managerName} - ${appr.departmentName})`;
  }
}

watch(
  () => maxApprovalLevels.value,
  (maxLvl) => {
    if (maxLvl > 0 && editForm.value.approval_levels > maxLvl) {
      editForm.value.approval_levels = maxLvl;
    }
  }
);

const enrolledPhotoUrl = ref<string | null>(null);
const isResettingFace = ref(false);

async function loadEnrolledPhoto(photoPath: string | null) {
  enrolledPhotoUrl.value = null;
  if (!photoPath) return;
  try {
    const { data, error } = await supabase.storage
      .from("profile-documents")
      .createSignedUrl(photoPath, 3600);
    if (!error && data?.signedUrl) {
      enrolledPhotoUrl.value = data.signedUrl;
    }
  } catch (e) {
    console.error("Failed to load signed URL for enrolled photo:", e);
  }
}

async function resetFaceEnrollment() {
  if (!activeEmp.value) return;
  const empName = activeEmp.value.full_name || activeEmp.value.email;
  if (!confirm(`Are you sure you want to reset face enrollment for "${empName}"?\n\nThis will clear their enrolled face template and permanently delete all photos from /face-enrollment storage. They will be required to capture a new face scan on their next mobile punch.`)) {
    return;
  }
  isResettingFace.value = true;
  try {
    // 1. Remove all files from /face-enrollment storage folder in profile-documents bucket
    const folderPath = `${activeEmp.value.id}/face-enrollment`;
    const pathsToRemove: string[] = [];

    try {
      const { data: fileList } = await supabase.storage
        .from("profile-documents")
        .list(folderPath, { limit: 100 });

      if (fileList && fileList.length > 0) {
        for (const item of fileList) {
          if (item.name) {
            pathsToRemove.push(`${folderPath}/${item.name}`);
          }
        }
      }
    } catch (listErr) {
      console.warn("Could not list face-enrollment folder from storage:", listErr);
    }

    if (activeEmp.value.face_enrollment_photo && !pathsToRemove.includes(activeEmp.value.face_enrollment_photo)) {
      pathsToRemove.push(activeEmp.value.face_enrollment_photo);
    }

    if (pathsToRemove.length > 0) {
      const { error: removeError } = await supabase.storage
        .from("profile-documents")
        .remove(pathsToRemove);

      if (removeError) {
        console.warn("Storage deletion encountered an issue (proceeding with profile reset):", removeError);
      }
    }

    // 2. Wipe database columns in profiles
    const { error } = await (supabase as any)
      .from("profiles")
      .update({
        face_embedding: null,
        face_enrolled_at: null,
        face_enrollment_photo: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeEmp.value.id);

    if (error) throw error;

    activeEmp.value.face_embedding = null;
    activeEmp.value.face_enrolled_at = null;
    activeEmp.value.face_enrollment_photo = null;
    enrolledPhotoUrl.value = null;

    await adminStore.fetchEmployees(true);
  } catch (err: any) {
    alert("Failed to reset face enrollment: " + err.message);
  } finally {
    isResettingFace.value = false;
  }
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

const newPassword = ref("");
const confirmPassword = ref("");
const passwordError = ref("");
const passwordSuccess = ref(false);
const isSavingPassword = ref(false);

const availableDays = [
  { key: "monday", label: "Mon", full: "Monday" },
  { key: "tuesday", label: "Tue", full: "Tuesday" },
  { key: "wednesday", label: "Wed", full: "Wednesday" },
  { key: "thursday", label: "Thu", full: "Thursday" },
  { key: "friday", label: "Fri", full: "Friday" },
  { key: "saturday", label: "Sat", full: "Saturday" },
  { key: "sunday", label: "Sun", full: "Sunday" },
];

const scheduleForm = ref({
  schedule_type: "fixed" as "fixed" | "flexible",
  min_work_hours: 8,
  start_time: "09:30",
  end_time: "18:30",
  shift_pattern: "day",
  punch_in_grace: 12,
  wfm_allowed: false,
  office_location: systemConfigStore.officeLocation || "28.560247, 77.199301",
  office_radius: 100,
  home_location: "",
  home_radius: 100,
  work_location_names: "delhi",
  work_location_radius: 100,
  weekdays: ["monday", "tuesday", "wednesday", "thursday", "friday"] as string[],
});

function formatHoursToHuman(decimalHours: number | null | undefined): string {
  if (decimalHours == null || isNaN(decimalHours) || decimalHours <= 0) return "0 hrs 0 mins";
  const totalMinutes = Math.round(decimalHours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return `${h} hr${h === 1 ? '' : 's'}`;
  if (h === 0) return `${m} min${m === 1 ? '' : 's'}`;
  return `${h} hr${h === 1 ? '' : 's'} ${m} min${m === 1 ? '' : 's'}`;
}

const scheduleFlexibleHours = computed({
  get: () => {
    if (!scheduleForm.value.min_work_hours || scheduleForm.value.min_work_hours <= 0) return 8;
    const totalMinutes = Math.round(scheduleForm.value.min_work_hours * 60);
    return Math.floor(totalMinutes / 60);
  },
  set: (val: number) => {
    if (scheduleForm.value.schedule_type === 'fixed') return;
    const h = Math.max(0, Math.min(24, Number(val) || 0));
    const m = scheduleFlexibleMinutes.value;
    const totalMinutes = h * 60 + m;
    scheduleForm.value.min_work_hours = Math.round((totalMinutes / 60) * 100) / 100;
  },
});

const scheduleFlexibleMinutes = computed({
  get: () => {
    if (!scheduleForm.value.min_work_hours || scheduleForm.value.min_work_hours <= 0) return 0;
    const totalMinutes = Math.round(scheduleForm.value.min_work_hours * 60);
    return totalMinutes % 60;
  },
  set: (val: number) => {
    if (scheduleForm.value.schedule_type === 'fixed') return;
    const h = scheduleFlexibleHours.value;
    const m = Math.max(0, Math.min(59, Number(val) || 0));
    const totalMinutes = h * 60 + m;
    scheduleForm.value.min_work_hours = Math.round((totalMinutes / 60) * 100) / 100;
  },
});

function calculateHoursBetween(start: string, end: string, punchInGraceMinutes = 0): number {
  if (!start || !end) return 0;
  const startParts = start.split(":");
  const endParts = end.split(":");
  const sH = Number(startParts[0]);
  const sM = Number(startParts[1]);
  const eH = Number(endParts[0]);
  const eM = Number(endParts[1]);
  if (Number.isNaN(sH) || Number.isNaN(sM) || Number.isNaN(eH) || Number.isNaN(eM)) return 0;
  let startMinutes = sH * 60 + sM;
  let endMinutes = eH * 60 + eM;
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Crosses midnight
  }
  const diffMinutes = endMinutes - startMinutes;
  const graceMinutes = Math.max(0, Number(punchInGraceMinutes) || 0);
  const netMinutes = Math.max(0, diffMinutes - graceMinutes);
  const hours = netMinutes / 60;
  return Math.round(hours * 100) / 100;
}

function setScheduleType(type: "fixed" | "flexible") {
  scheduleForm.value.schedule_type = type;
  if (type === "fixed") {
    if (!scheduleForm.value.start_time) scheduleForm.value.start_time = "09:30";
    if (!scheduleForm.value.end_time) scheduleForm.value.end_time = "18:30";
    scheduleForm.value.min_work_hours = calculateHoursBetween(
      scheduleForm.value.start_time,
      scheduleForm.value.end_time,
      scheduleForm.value.punch_in_grace || 0
    );
  } else {
    if (!scheduleForm.value.min_work_hours || scheduleForm.value.min_work_hours <= 0) {
      scheduleForm.value.min_work_hours = 8;
    }
  }
}

watch(
  [
    () => scheduleForm.value.start_time,
    () => scheduleForm.value.end_time,
    () => scheduleForm.value.punch_in_grace,
    () => scheduleForm.value.schedule_type,
  ],
  ([newStart, newEnd, newGrace, newType]) => {
    if (newType === "fixed" && newStart && newEnd) {
      scheduleForm.value.min_work_hours = calculateHoursBetween(newStart, newEnd, newGrace || 0);
    }
  }
);

function isWeekdaySelected(dayKey: string): boolean {
  const target = dayKey.toLowerCase().trim();
  return (scheduleForm.value.weekdays || []).some((d) => {
    const s = String(d).toLowerCase().trim();
    return s === target || s === target.slice(0, 3);
  });
}

function toggleWeekday(dayKey: string) {
  const target = dayKey.toLowerCase().trim();
  const current = (scheduleForm.value.weekdays || []).map((d) => {
    const s = String(d).toLowerCase().trim();
    const matched = availableDays.find((day) => day.key === s || day.label.toLowerCase() === s);
    return matched ? matched.key : s;
  });

  if (isWeekdaySelected(target)) {
    scheduleForm.value.weekdays = current.filter((d) => d !== target);
  } else {
    scheduleForm.value.weekdays = [...current, target];
  }
}

function captureDeviceGPS() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      scheduleForm.value.home_location = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
    },
    (err) => {
      alert("GPS error: " + err.message);
    }
  );
}


const isSaving = ref(false);
const isSavingSchedule = ref(false);

// Computed stats
const activeEmployeesCount = computed(() => {
  return adminStore.employees.filter((e) => e.is_active).length;
});

const wfmEmployeesCount = computed(() => {
  return adminStore.employees.filter((e) => e.work_schedule?.wfm_allowed).length;
});

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.trim() !== "" ||
    selectedDepartment.value !== "ALL" ||
    selectedStatus.value !== "ALL" ||
    selectedWfm.value !== "ALL"
  );
});

function resetFilters() {
  searchQuery.value = "";
  selectedDepartment.value = "ALL";
  selectedStatus.value = "ALL";
  selectedWfm.value = "ALL";
  currentPage.value = 1;
}

// Filtered list
const filteredEmployees = computed(() => {
  return adminStore.employees.filter((emp) => {
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const name = (emp.full_name || "").toLowerCase();
      const email = (emp.email || "").toLowerCase();
      const code = (emp.employee_code || "").toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !code.includes(q)) {
        return false;
      }
    }

    if (selectedDepartment.value !== "ALL" && emp.department !== selectedDepartment.value) {
      return false;
    }

    if (selectedStatus.value === "ACTIVE" && !emp.is_active) return false;
    if (selectedStatus.value === "INACTIVE" && emp.is_active) return false;

    if (selectedWfm.value === "WFM_YES" && !emp.work_schedule?.wfm_allowed) return false;
    if (selectedWfm.value === "WFM_NO" && emp.work_schedule?.wfm_allowed) return false;

    return true;
  });
});

// Pagination
const totalPages = computed(() => Math.ceil(filteredEmployees.value.length / pageSize));
const paginationStart = computed(() => (currentPage.value - 1) * pageSize + 1);
const paginationEnd = computed(() =>
  Math.min(currentPage.value * pageSize, filteredEmployees.value.length)
);

const paginatedEmployees = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredEmployees.value.slice(start, start + pageSize);
});

function getInitials(name: string): string {
  if (!name) return "EM";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatTime(val: string | null | undefined): string {
  if (!val) return "--:--";
  return val.slice(0, 5);
}

async function refreshData() {
  isRefreshing.value = true;
  await adminStore.fetchEmployees(true);
  isRefreshing.value = false;
}

function openEditModal(emp: AdminEmployee) {
  activeEmp.value = emp;
  editCodeError.value = "";
  const approvers = getHierarchyApproversFor(emp.department, emp.id);
  const maxLvl = approvers.length;
  let initialApprovalLevels = emp.approval_levels || 1;
  if (maxLvl > 0 && initialApprovalLevels > maxLvl) {
    initialApprovalLevels = maxLvl;
  }
  editForm.value = {
    full_name: emp.full_name || "",
    employee_code: emp.employee_code || "",
    phone: emp.phone || "",
    department: emp.department,
    position: emp.position,
    employment_type: emp.employment_type || "full_time",
    date_of_joining: emp.date_of_joining || "",
    approval_levels: initialApprovalLevels,
    app_access: emp.app_access ?? true,
    web_access: emp.web_access ?? true,
    geofencing: emp.geofencing ?? true,
    face_recognition: emp.face_recognition ?? false,
    face_match_threshold: emp.face_match_threshold ?? 0.75,
  };
  loadEnrolledPhoto(emp.face_enrollment_photo || null);
  isEditModalOpen.value = true;
}

async function saveProfileEdit() {
  if (!activeEmp.value) return;
  if (!validateEditCode()) return;
  if (maxApprovalLevels.value > 0 && editForm.value.approval_levels > maxApprovalLevels.value) {
    alert(
      `Cannot set ${editForm.value.approval_levels} approval levels. Only ${maxApprovalLevels.value} manager level(s) exist in this department's hierarchy.`
    );
    return;
  }
  isSaving.value = true;
  try {
    const { error } = await (supabase as any)
      .from("profiles")
      .update({
        full_name: editForm.value.full_name,
        employee_code: editForm.value.employee_code || null,
        phone: editForm.value.phone || null,
        department: editForm.value.department,
        position: editForm.value.position,
        employment_type: editForm.value.employment_type,
        date_of_joining: editForm.value.date_of_joining || null,
        approval_levels: editForm.value.approval_levels,
        app_access: editForm.value.app_access,
        web_access: editForm.value.web_access,
        geofencing: editForm.value.geofencing,
        face_recognition: editForm.value.face_recognition,
        face_match_threshold: editForm.value.face_match_threshold ?? 0.75,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeEmp.value.id);

    if (error) throw error;

    await adminStore.fetchEmployees(true);
    isEditModalOpen.value = false;
  } catch (err: any) {
    alert("Failed to update profile: " + err.message);
  } finally {
    isSaving.value = false;
  }
}

function openPasswordModal(emp: AdminEmployee) {
  activeEmp.value = emp;
  newPassword.value = "";
  confirmPassword.value = "";
  passwordError.value = "";
  passwordSuccess.value = false;
  isPasswordModalOpen.value = true;
}

async function savePasswordReset() {
  if (!activeEmp.value) return;
  passwordError.value = "";
  passwordSuccess.value = false;

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = "Passwords do not match.";
    return;
  }

  isSavingPassword.value = true;
  try {
    const { data, error } = await supabase.functions.invoke("password-change", {
      body: {
        uid: activeEmp.value.id,
        newPassword: newPassword.value,
      },
    });

    if (error) {
      let errMsg = error.message;
      try {
        const errJson = await (error as any).context?.json();
        if (errJson?.message) errMsg = errJson.message;
      } catch (_) {}
      throw new Error(errMsg || "Failed to update password");
    }
    if (data && !data.success) {
      throw new Error(data.message || "Failed to update password");
    }

    passwordSuccess.value = true;
    setTimeout(() => {
      isPasswordModalOpen.value = false;
    }, 1500);
  } catch (err: any) {
    passwordError.value = err.message || "Failed to reset password";
  } finally {
    isSavingPassword.value = false;
  }
}

function openScheduleModal(emp: AdminEmployee) {
  activeEmp.value = emp;
  const s = emp.work_schedule;

  // Normalize existing weekdays array (handles lowercase, capitalized, or abbreviated days)
  let loadedWeekdays: string[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  if (Array.isArray(s?.weekdays) && s.weekdays.length > 0) {
    loadedWeekdays = s.weekdays.map((d: string) => {
      const lower = String(d).toLowerCase().trim();
      const matched = availableDays.find(
        (day) => day.key === lower || day.label.toLowerCase() === lower
      );
      return matched ? matched.key : lower;
    });
  }

  const scheduleType = (s?.schedule_type?.toLowerCase() === "flexible" ? "flexible" : "fixed") as "fixed" | "flexible";
  const startTime = s?.start_time ? s.start_time.slice(0, 5) : "09:30";
  const endTime = s?.end_time ? s.end_time.slice(0, 5) : "18:30";
  const punchInGrace = Number(s?.punch_in_grace ?? 12);

  let minHours = s?.min_work_hours ?? 8;
  if (scheduleType === "fixed") {
    minHours = calculateHoursBetween(startTime, endTime, punchInGrace);
  }

  scheduleForm.value = {
    schedule_type: scheduleType,
    min_work_hours: minHours,
    start_time: startTime,
    end_time: endTime,
    shift_pattern: s?.shift_pattern || "day",
    punch_in_grace: punchInGrace,
    wfm_allowed: s?.wfm_allowed ?? false,
    office_location: s?.office_location || systemConfigStore.officeLocation || "28.560247, 77.199301",
    office_radius: s?.office_radius ?? 100,
    home_location: s?.home_location || "",
    home_radius: s?.home_radius ?? 100,
    work_location_names: s?.work_location_names || "",
    work_location_radius: s?.work_location_radius ?? 100,
    weekdays: loadedWeekdays,
  };
  isScheduleModalOpen.value = true;
}

async function saveSchedule() {
  if (!activeEmp.value || isSavingSchedule.value) return;
  isSavingSchedule.value = true;

  try {
    const isFlexible = scheduleForm.value.schedule_type === "flexible";

    const payload = {
      employee_id: activeEmp.value.id,
      schedule_type: scheduleForm.value.schedule_type,
      min_work_hours: scheduleForm.value.min_work_hours || 8,
      start_time: isFlexible ? null : (scheduleForm.value.start_time ? `${scheduleForm.value.start_time}:00` : null),
      end_time: isFlexible ? null : (scheduleForm.value.end_time ? `${scheduleForm.value.end_time}:00` : null),
      punch_in_grace: scheduleForm.value.punch_in_grace,
      shift_pattern: scheduleForm.value.shift_pattern || "day",
      wfm_allowed: scheduleForm.value.wfm_allowed,
      office_location: scheduleForm.value.office_location,
      office_radius: scheduleForm.value.office_radius,
      home_location: scheduleForm.value.home_location || null,
      home_radius: scheduleForm.value.home_radius,
      work_location_names: scheduleForm.value.work_location_names ? scheduleForm.value.work_location_names.trim().toLowerCase() : null,
      work_location_radius: scheduleForm.value.work_location_radius || 100,
      weekdays: scheduleForm.value.weekdays.map((d) => String(d).toLowerCase().trim()),
      updated_at: new Date().toISOString(),
    };

    let targetScheduleId = activeEmp.value.work_schedule?.id;

    if (!targetScheduleId) {
      const { data: existingRecords } = await (supabase as any)
        .from("work_schedules")
        .select("id")
        .eq("employee_id", activeEmp.value.id)
        .order("id", { ascending: false });

      if (existingRecords && existingRecords.length > 0) {
        targetScheduleId = existingRecords[0].id;
      }
    }

    if (targetScheduleId) {
      const { data: updated, error } = await (supabase as any)
        .from("work_schedules")
        .update(payload)
        .eq("employee_id", activeEmp.value.id)
        .select();

      if (error) throw error;
      if (updated && updated.length > 0 && activeEmp.value) {
        activeEmp.value.work_schedule = updated[0];
      }
    } else {
      const { data: inserted, error } = await (supabase as any)
        .from("work_schedules")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      if (inserted && activeEmp.value) {
        activeEmp.value.work_schedule = inserted;
      }
    }

    await adminStore.fetchEmployees(true);
    isScheduleModalOpen.value = false;
  } catch (err: any) {
    alert("Failed to update work schedule: " + err.message);
  } finally {
    isSavingSchedule.value = false;
  }
}

// Status Confirmation Modal State
const isStatusModalOpen = ref(false);
const statusTargetEmp = ref<AdminEmployee | null>(null);
const isDeactivating = ref(false);
const toggleAppAccess = ref(true);
const toggleWebAccess = ref(true);
const isUpdatingStatus = ref(false);
const statusError = ref("");

function toggleEmployeeStatus(emp: AdminEmployee) {
  statusTargetEmp.value = emp;
  isDeactivating.value = Boolean(emp.is_active);
  toggleAppAccess.value = true;
  toggleWebAccess.value = isDeactivating.value; // ticked when deactivating, unticked by default when reactivating
  statusError.value = "";
  isStatusModalOpen.value = true;
}

async function confirmToggleStatus() {
  if (!statusTargetEmp.value) return;

  isUpdatingStatus.value = true;
  statusError.value = "";

  try {
    const emp = statusTargetEmp.value;
    const newStatus = !isDeactivating.value;

    const updates: {
      is_active: boolean;
      updated_at: string;
      app_access?: boolean;
      web_access?: boolean;
    } = {
      is_active: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (isDeactivating.value) {
      if (toggleAppAccess.value) updates.app_access = false;
      if (toggleWebAccess.value) updates.web_access = false;
    } else {
      updates.app_access = toggleAppAccess.value;
      updates.web_access = toggleWebAccess.value;
    }

    const { error } = await (supabase as any)
      .from("profiles")
      .update(updates)
      .eq("id", emp.id);

    if (error) throw error;

    emp.is_active = newStatus;
    if (updates.app_access !== undefined) emp.app_access = updates.app_access;
    if (updates.web_access !== undefined) emp.web_access = updates.web_access;

    isStatusModalOpen.value = false;
    await adminStore.fetchEmployees(true);
  } catch (err: any) {
    statusError.value = err.message || "Failed to update employee status";
  } finally {
    isUpdatingStatus.value = false;
  }
}

function isDayScheduled(day: string): boolean {
  const w = selectedDetailEmp.value?.work_schedule?.weekdays;
  if (!Array.isArray(w)) return false;
  return w.some((d: string) => d.toLowerCase().startsWith(day.toLowerCase().slice(0, 3)));
}

function normalizeEmergencyContacts(val: any): Array<{ name?: string; phone?: string; relation?: string }> {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "object") return [val];
  return [];
}

function formatDateOnly(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function calculateAge(dobStr?: string | null): string {
  if (!dobStr) return "";
  try {
    const birth = new Date(dobStr);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age} yrs` : "";
  } catch {
    return "";
  }
}

function calculateTenure(joiningDateStr?: string | null): string {
  if (!joiningDateStr) return "N/A";
  try {
    const start = new Date(joiningDateStr);
    const now = new Date();
    let totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (totalMonths < 0) totalMonths = 0;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (years === 0 && months === 0) return "Just joined";
    if (years === 0) return `${months} mo${months === 1 ? "" : "s"}`;
    if (months === 0) return `${years} yr${years === 1 ? "" : "s"}`;
    return `${years} yr${years === 1 ? "" : "s"}, ${months} mo${months === 1 ? "" : "s"}`;
  } catch {
    return "N/A";
  }
}

function calculateTotalNomineeShare(nominees: any): number {
  if (!Array.isArray(nominees)) return 0;
  return nominees.reduce((acc, curr) => acc + (Number(curr.share_percentage) || 0), 0);
}

function maskAadhaar(num?: string | null): string {
  if (!num) return "-";
  const cleaned = num.replace(/\D/g, "");
  if (cleaned.length === 12) {
    return `XXXX-XXXX-${cleaned.slice(8)}`;
  }
  return num;
}

function copyToClipboard(text?: string | null, label?: string) {
  if (!text || text === "-") return;
  navigator.clipboard?.writeText(text);
  copySuccessMsg.value = `Copied ${label || "text"} to clipboard`;
  clearTimeout(copyTimeout);
  copyTimeout = setTimeout(() => {
    copySuccessMsg.value = "";
  }, 2500);
}

async function preloadDocumentUrls(details: any) {
  if (!details) return;
  const docFields: Record<string, string | null | undefined> = {
    aadhaar_front: details.aadhaar_url,
    aadhaar_back: details.aadhaar_back_url,
    pan: details.pan_url,
    passport: details.passport_url,
    cancelled_cheque: details.cancelled_cheque_url,
    passbook: details.passbook_url,
  };

  for (const [key, path] of Object.entries(docFields)) {
    if (!path) continue;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      detailDocUrls.value[key] = path;
      continue;
    }
    supabase.storage
      .from("profile-documents")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) {
          detailDocUrls.value[key] = data.signedUrl;
        }
      })
      .catch(() => {});
  }
}

async function openDetailModal(emp: AdminEmployee) {
  selectedDetailEmp.value = emp;
  detailActiveTab.value = "overview";
  isDetailModalOpen.value = true;
  detailProfileData.value = null;
  detailFacePhotoUrl.value = null;
  detailDocUrls.value = {};

  if (emp.face_enrollment_photo) {
    supabase.storage
      .from("profile-documents")
      .createSignedUrl(emp.face_enrollment_photo, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) {
          detailFacePhotoUrl.value = data.signedUrl;
        }
      })
      .catch(() => {});
  }

  isLoadingDetailProfile.value = true;
  try {
    const { data, error } = await (supabase as any)
      .from("profile_details")
      .select("*")
      .eq("user_id", emp.id)
      .maybeSingle();

    if (!error && data) {
      detailProfileData.value = data;
      preloadDocumentUrls(data);
    }
  } catch (err: any) {
    console.error("Failed to load profile details for modal:", err);
  } finally {
    isLoadingDetailProfile.value = false;
  }
}

function openEditFromDetail() {
  if (!selectedDetailEmp.value) return;
  const emp = selectedDetailEmp.value;
  isDetailModalOpen.value = false;
  openEditModal(emp);
}

function openScheduleFromDetail() {
  if (!selectedDetailEmp.value) return;
  const emp = selectedDetailEmp.value;
  isDetailModalOpen.value = false;
  openScheduleModal(emp);
}

function openPasswordFromDetail() {
  if (!selectedDetailEmp.value) return;
  const emp = selectedDetailEmp.value;
  isDetailModalOpen.value = false;
  openPasswordModal(emp);
}

onMounted(async () => {
  await Promise.all([
    adminStore.fetchMetadata(),
    adminStore.fetchEmployees(),
    systemConfigStore.fetchConfig(supabase),
  ]);
});
</script>
