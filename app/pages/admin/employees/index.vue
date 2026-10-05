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
              class="hover:bg-emerald-50/40 transition-colors group"
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
                <div class="flex items-center justify-end gap-1.5">
                  <!-- Edit Profile -->
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Edit Profile Details"
                    @click="openEditModal(emp)"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                  </button>

                  <!-- Password Reset -->
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-amber-100 text-gray-600 hover:text-amber-700 transition-colors"
                    title="Reset Login Password"
                    @click="openPasswordModal(emp)"
                  >
                    <UIcon name="i-heroicons-key" class="w-4 h-4" />
                  </button>

                  <!-- Work Schedule & GPS -->
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-colors"
                    title="Edit Geofencing & Work Schedule"
                    @click="openScheduleModal(emp)"
                  >
                    <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                  </button>

                  <!-- Toggle Active Status -->
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 transition-colors"
                    :title="emp.is_active ? 'Deactivate Account' : 'Reactivate Account'"
                    @click="toggleEmployeeStatus(emp)"
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
              <label class="text-xs font-semibold text-gray-700">Employee Code</label>
              <input
                v-model="editForm.employee_code"
                type="text"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
              />
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
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Approval Hierarchy Levels</label>
              <select
                v-model.number="editForm.approval_levels"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                <option :value="1">1 Level (Direct Manager)</option>
                <option :value="2">2 Levels (Manager + Head of Dept)</option>
                <option :value="3">3 Levels (Manager + HOD + Executive)</option>
              </select>
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
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-gray-900">Work Schedule & Geofencing</h3>
              <p class="text-[11px] text-gray-500">{{ activeEmp?.full_name }} ({{ activeEmp?.email }})</p>
            </div>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isScheduleModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveSchedule" class="space-y-4">
          <!-- Timings & Grace -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Shift Start Time *</label>
              <input
                v-model="scheduleForm.start_time"
                type="time"
                required
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer [color-scheme:light]"
                @click="(e) => (e.target as HTMLInputElement).showPicker?.()"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Shift End Time *</label>
              <input
                v-model="scheduleForm.end_time"
                type="time"
                required
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer [color-scheme:light]"
                @click="(e) => (e.target as HTMLInputElement).showPicker?.()"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Punch Grace (Minutes)</label>
              <input
                v-model.number="scheduleForm.punch_in_grace"
                type="number"
                min="0"
                max="60"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
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
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          <!-- Office Geofencing -->
          <div class="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-3">
            <div class="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <UIcon name="i-heroicons-building-office" class="w-4 h-4 text-emerald-600" />
              <span>Office Geofence Location</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">Office GPS (Lat, Long)</label>
                <input
                  v-model="scheduleForm.office_location"
                  type="text"
                  :placeholder="systemConfigStore.officeLocation || '28.560247, 77.199301'"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">Office Radius (meters)</label>
                <input
                  v-model.number="scheduleForm.office_radius"
                  type="number"
                  min="20"
                  max="5000"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Home Geofencing -->
          <div class="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-3">
            <div class="text-xs font-bold text-blue-800 flex items-center gap-1.5">
              <UIcon name="i-heroicons-home" class="w-4 h-4 text-blue-600" />
              <span>Home Geofence Location (For WFM)</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">Home GPS (Lat, Long)</label>
                <input
                  v-model="scheduleForm.home_location"
                  type="text"
                  placeholder="e.g. 28.560247, 77.199301"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">Home Radius (meters)</label>
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
          <div class="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-purple-600" />
                <span>Field / Market Work Locations</span>
              </div>
              <span class="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                Reverse Geocoded
              </span>
            </div>
            <p class="text-[11px] text-gray-500">
              Permits staff to punch attendance in designated cities or localities when WFM is enabled.
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
              class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
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
import { ref, computed, onMounted } from "vue";
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

const scheduleForm = ref({
  start_time: "09:30",
  end_time: "18:30",
  punch_in_grace: 12,
  wfm_allowed: false,
  office_location: systemConfigStore.officeLocation || "28.560247, 77.199301",
  office_radius: 100,
  home_location: "",
  home_radius: 100,
  work_location_names: "delhi",
  work_location_radius: 100,
});

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
  editForm.value = {
    full_name: emp.full_name || "",
    employee_code: emp.employee_code || "",
    phone: emp.phone || "",
    department: emp.department,
    position: emp.position,
    employment_type: emp.employment_type || "full_time",
    date_of_joining: emp.date_of_joining || "",
    approval_levels: emp.approval_levels || 1,
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
    const { data, error } = await supabase.functions.invoke("Password-Change", {
      body: {
        uid: activeEmp.value.id,
        newPassword: newPassword.value,
      },
    });

    if (error) throw error;
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
  scheduleForm.value = {
    start_time: s?.start_time ? s.start_time.slice(0, 5) : "09:30",
    end_time: s?.end_time ? s.end_time.slice(0, 5) : "18:30",
    punch_in_grace: s?.punch_in_grace ?? 12,
    wfm_allowed: s?.wfm_allowed ?? false,
    office_location: s?.office_location || systemConfigStore.officeLocation || "28.560247, 77.199301",
    office_radius: s?.office_radius ?? 100,
    home_location: s?.home_location || "",
    home_radius: s?.home_radius ?? 100,
    work_location_names: s?.work_location_names || "",
    work_location_radius: s?.work_location_radius ?? 100,
  };
  isScheduleModalOpen.value = true;
}

async function saveSchedule() {
  if (!activeEmp.value) return;
  isSavingSchedule.value = true;

  try {
    const scheduleData = {
      employee_id: activeEmp.value.id,
      start_time: `${scheduleForm.value.start_time}:00`,
      end_time: `${scheduleForm.value.end_time}:00`,
      punch_in_grace: scheduleForm.value.punch_in_grace,
      wfm_allowed: scheduleForm.value.wfm_allowed,
      office_location: scheduleForm.value.office_location,
      office_radius: scheduleForm.value.office_radius,
      home_location: scheduleForm.value.home_location || null,
      home_radius: scheduleForm.value.home_radius,
      work_location_names: scheduleForm.value.work_location_names ? scheduleForm.value.work_location_names.trim().toLowerCase() : null,
      work_location_radius: scheduleForm.value.work_location_radius || 100,
      weekdays: activeEmp.value.work_schedule?.weekdays || ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      schedule_type: "fixed",
      shift_pattern: "day",
      updated_at: new Date().toISOString(),
    };

    if (activeEmp.value.work_schedule?.id) {
      const { error } = await (supabase as any)
        .from("work_schedules")
        .update(scheduleData)
        .eq("id", activeEmp.value.work_schedule.id);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from("work_schedules").insert(scheduleData);
      if (error) throw error;
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

onMounted(async () => {
  await Promise.all([
    adminStore.fetchMetadata(),
    adminStore.fetchEmployees(),
    systemConfigStore.fetchConfig(supabase),
  ]);
});
</script>
