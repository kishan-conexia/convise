<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200/70">
      <div>
        <h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>Work Schedules & Geofencing</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">
            GPS & Remote Punch Control
          </span>
        </h1>
        <p class="text-xs text-gray-500 mt-0.5">
          Manage shift patterns, office coordinates, employee home locations, and grant Work-From-Home (WFM) authorization.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="p-2.5 rounded-xl bg-white/80 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm transition-colors"
          title="Refresh schedules"
          @click="refreshData"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            :class="['w-4 h-4', isRefreshing ? 'animate-spin text-teal-600' : '']"
          />
        </button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[11px] font-bold uppercase tracking-wider text-gray-500">Staff Configured</div>
        <div class="text-2xl font-black text-gray-900 mt-1 font-mono">{{ totalWithSchedule }}</div>
        <div class="text-[10px] text-gray-500 mt-0.5">{{ fixedCount }} fixed • {{ flexibleCount }} flexible</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[11px] font-bold uppercase tracking-wider text-teal-700">WFM Authorized</div>
        <div class="text-2xl font-black text-teal-600 mt-1 font-mono">{{ wfmCount }}</div>
        <div class="text-[10px] text-gray-500 mt-0.5">Remote home punch</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[11px] font-bold uppercase tracking-wider text-blue-700">Office Only</div>
        <div class="text-2xl font-black text-blue-600 mt-1 font-mono">{{ officeOnlyCount }}</div>
        <div class="text-[10px] text-gray-500 mt-0.5">Strict office perimeter</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[11px] font-bold uppercase tracking-wider text-amber-700">Unconfigured</div>
        <div class="text-2xl font-black text-amber-600 mt-1 font-mono">{{ missingScheduleCount }}</div>
        <div class="text-[10px] text-gray-500 mt-0.5">Needs schedule assignment</div>
      </div>
    </div>

    <!-- Search & Filters Toolbar -->
    <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-md flex flex-col md:flex-row gap-3 items-center justify-between">
      <div class="relative w-full md:w-80">
        <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search employee name, email..."
          class="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-teal-500"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
        <!-- Department Filter -->
        <select
          v-model="selectedDepartment"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-teal-500"
        >
          <option value="ALL">All Departments</option>
          <option v-for="d in adminStore.departments" :key="d.id" :value="d.id">
            {{ d.name }}
          </option>
        </select>

        <!-- Schedule Type Filter -->
        <select
          v-model="selectedScheduleType"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-teal-500"
        >
          <option value="ALL">All Schedule Types</option>
          <option value="fixed">Fixed Timings</option>
          <option value="flexible">Flexible Timings</option>
        </select>

        <!-- WFM Mode Filter -->
        <select
          v-model="selectedMode"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-teal-500"
        >
          <option value="ALL">All Work Modes</option>
          <option value="WFM">WFM Allowed</option>
          <option value="OFFICE">Office Only</option>
          <option value="NO_SCHEDULE">Missing Schedule</option>
        </select>
      </div>
    </div>

    <!-- Schedules Table -->
    <div class="rounded-2xl border border-gray-200/70 bg-white/90 backdrop-blur-lg overflow-hidden shadow-xl">
      <div v-if="adminStore.isEmployeesLoading" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-3 animate-spin text-teal-600" />
        <p class="text-xs">Loading schedules and geofence perimeters...</p>
      </div>

      <div v-else-if="filteredEmployees.length === 0" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-map-pin" class="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <h3 class="text-sm font-semibold text-gray-800">No matching schedules found</h3>
        <p class="text-xs text-gray-500 mt-1">Try resetting your search query.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
              <th class="py-3.5 px-4">Employee</th>
              <th class="py-3.5 px-4">Shift Timings & Type</th>
              <th class="py-3.5 px-4">WFM Status</th>
              <th class="py-3.5 px-4">Office Geofence</th>
              <th class="py-3.5 px-4">Home & Field Areas</th>
              <th class="py-3.5 px-4">Grace / Work Days</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="emp in filteredEmployees"
              :key="emp.id"
              class="hover:bg-teal-50/30 transition-colors group"
            >
              <!-- Employee Info -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-gray-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 border border-gray-200">
                    {{ getInitials(emp.full_name || emp.email) }}
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-gray-900 group-hover:text-teal-700 transition-colors truncate">
                      {{ emp.full_name || 'Staff' }}
                    </div>
                    <div class="text-[11px] text-gray-500 truncate">
                      {{ adminStore.getDepartmentName(emp.department) }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Shift Timings & Type -->
              <td class="py-3.5 px-4">
                <div v-if="emp.work_schedule?.schedule_type === 'flexible'" class="space-y-0.5">
                  <div class="flex items-center gap-1.5 font-bold text-purple-700 text-xs">
                    <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-3.5 h-3.5 text-purple-600" />
                    <span>Flexible Schedule</span>
                  </div>
                  <div class="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                    <span class="text-purple-700 font-bold font-sans">Min:</span>
                    <span>{{ emp.work_schedule.min_work_hours ?? 8 }} hrs/day</span>
                  </div>
                </div>
                <div v-else-if="emp.work_schedule" class="space-y-0.5">
                  <div class="font-mono text-gray-900 font-bold flex items-center gap-1.5">
                    <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5 text-teal-600" />
                    <span>{{ formatTime(emp.work_schedule.start_time) }} - {{ formatTime(emp.work_schedule.end_time) }}</span>
                  </div>
                  <div class="text-[10px] text-gray-500 capitalize flex items-center gap-1.5">
                    <span>{{ emp.work_schedule.shift_pattern || 'Day Shift' }}</span>
                    <span v-if="emp.work_schedule.min_work_hours" class="text-gray-400 font-mono">• {{ emp.work_schedule.min_work_hours }}h min</span>
                  </div>
                </div>
                <span v-else class="text-amber-600 italic text-[11px] font-semibold">Unassigned</span>
              </td>

              <!-- WFM Status (View Only) -->
              <td class="py-3.5 px-4">
                <span
                  v-if="emp.work_schedule?.wfm_allowed"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  <span>Allowed</span>
                </span>
                <span
                  v-else-if="emp.work_schedule"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <span>Office Only</span>
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Unassigned</span>
                </span>
              </td>

              <!-- Office Geofence -->
              <td class="py-3.5 px-4">
                <div v-if="emp.work_schedule" class="space-y-0.5">
                  <div class="font-mono text-gray-800 text-[11px] truncate max-w-xs" :title="emp.work_schedule.office_location || 'Default HQ'">
                    {{ emp.work_schedule.office_location || '28.560247, 77.199301' }}
                  </div>
                  <div class="text-[10px] text-gray-500 flex items-center gap-1">
                    <span class="text-teal-700 font-bold">Radius:</span>
                    <span>{{ emp.work_schedule.office_radius || 100 }}m</span>
                  </div>
                </div>
                <span v-else class="text-gray-400">-</span>
              </td>

              <!-- Home & Field Areas -->
              <td class="py-3.5 px-4">
                <div v-if="emp.work_schedule" class="space-y-1">
                  <!-- Home GPS -->
                  <div v-if="emp.work_schedule.home_location" class="text-[11px] text-gray-800 font-mono truncate max-w-xs" :title="emp.work_schedule.home_location">
                    <span class="text-blue-600 font-semibold font-sans">Home:</span> {{ emp.work_schedule.home_location }}
                    <span class="text-[10px] text-gray-500 font-sans">({{ emp.work_schedule.home_radius || 100 }}m)</span>
                  </div>
                  <div v-else class="text-[10px] text-gray-400 italic">No home GPS set</div>

                  <!-- Field Named Locations -->
                  <div v-if="emp.work_schedule.work_location_names" class="text-[11px] text-purple-700 truncate max-w-xs" :title="emp.work_schedule.work_location_names">
                    <span class="font-bold">Field:</span> <span class="capitalize">{{ emp.work_schedule.work_location_names }}</span>
                    <span class="text-[10px] text-gray-500">({{ emp.work_schedule.work_location_radius || 100 }}m)</span>
                  </div>
                </div>
                <span v-else class="text-gray-400">-</span>
              </td>

              <!-- Grace / Weekdays -->
              <td class="py-3.5 px-4">
                <div v-if="emp.work_schedule" class="space-y-0.5">
                  <div class="text-gray-800 font-medium">
                    Grace: <span class="font-mono text-teal-700 font-bold">{{ emp.work_schedule.punch_in_grace || 12 }}m</span>
                  </div>
                  <div class="text-[10px] text-gray-500">
                    {{ emp.work_schedule.weekdays?.length || 5 }} days/wk
                  </div>
                </div>
                <span v-else class="text-gray-400">-</span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right">
                <button
                  class="p-1.5 rounded-lg bg-gray-100 hover:bg-teal-100 text-gray-600 hover:text-teal-700 transition-colors"
                  title="Configure Schedule & GPS"
                  @click="openScheduleModal(emp)"
                >
                  <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= MODAL: EDIT SCHEDULE & GEOFENCING ================= -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 class="text-base font-bold text-gray-900">Geofencing & Work Schedule</h3>
            <p class="text-xs text-gray-500">{{ activeEmp?.full_name }} ({{ activeEmp?.email }})</p>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isModalOpen = false">
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
                :class="form.schedule_type === 'fixed' ? 'bg-teal-100 text-teal-800 border border-teal-200' : 'bg-purple-100 text-purple-800 border border-purple-200'"
              >
                {{ form.schedule_type === 'fixed' ? 'Fixed Timings' : 'Flexible Timings' }}
              </span>
            </div>

            <!-- Segmented Selector: Fixed vs Flexible -->
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer"
                :class="form.schedule_type === 'fixed' ? 'bg-white border-teal-500 shadow-sm ring-1 ring-teal-500' : 'bg-white/60 border-gray-200 hover:bg-white text-gray-600'"
                @click="setScheduleType('fixed')"
              >
                <div class="p-1.5 rounded-lg shrink-0" :class="form.schedule_type === 'fixed' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'">
                  <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-bold" :class="form.schedule_type === 'fixed' ? 'text-teal-900' : 'text-gray-800'">
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
                :class="form.schedule_type === 'flexible' ? 'bg-white border-purple-500 shadow-sm ring-1 ring-purple-500' : 'bg-white/60 border-gray-200 hover:bg-white text-gray-600'"
                @click="setScheduleType('flexible')"
              >
                <div class="p-1.5 rounded-lg shrink-0" :class="form.schedule_type === 'flexible' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400'">
                  <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-4 h-4" />
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-bold" :class="form.schedule_type === 'flexible' ? 'text-purple-900' : 'text-gray-800'">
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
                  <label class="text-xs font-semibold truncate" :class="form.schedule_type === 'fixed' ? 'text-gray-700' : 'text-gray-400'">
                    Shift Start Time {{ form.schedule_type === 'fixed' ? '*' : '' }}
                  </label>
                  <span
                    v-if="form.schedule_type === 'fixed'"
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
                  v-model="form.start_time"
                  type="time"
                  :disabled="form.schedule_type === 'flexible'"
                  :required="form.schedule_type === 'fixed'"
                  class="w-full h-[38px] px-3 rounded-xl border text-xs focus:outline-none transition-all font-mono [color-scheme:light]"
                  :class="[
                    form.schedule_type === 'fixed'
                      ? 'bg-white border-gray-200 text-gray-900 focus:border-teal-500 cursor-pointer shadow-sm'
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  ]"
                  @click="(e) => form.schedule_type === 'fixed' && (e.target as HTMLInputElement).showPicker?.()"
                />
              </div>

              <!-- Shift End Time -->
              <div class="space-y-1.5 flex flex-col">
                <div class="flex items-center justify-between min-h-[22px] gap-1">
                  <label class="text-xs font-semibold truncate" :class="form.schedule_type === 'fixed' ? 'text-gray-700' : 'text-gray-400'">
                    Shift End Time {{ form.schedule_type === 'fixed' ? '*' : '' }}
                  </label>
                  <span
                    v-if="form.schedule_type === 'fixed'"
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
                  v-model="form.end_time"
                  type="time"
                  :disabled="form.schedule_type === 'flexible'"
                  :required="form.schedule_type === 'fixed'"
                  class="w-full h-[38px] px-3 rounded-xl border text-xs focus:outline-none transition-all font-mono [color-scheme:light]"
                  :class="[
                    form.schedule_type === 'fixed'
                      ? 'bg-white border-gray-200 text-gray-900 focus:border-teal-500 cursor-pointer shadow-sm'
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  ]"
                  @click="(e) => form.schedule_type === 'fixed' && (e.target as HTMLInputElement).showPicker?.()"
                />
              </div>

              <!-- Min Work Hours -->
              <div class="space-y-1.5 flex flex-col">
                <div class="flex items-center justify-between min-h-[22px] gap-1">
                  <label class="text-xs font-semibold text-gray-700 truncate">Min Work Hours *</label>
                  <span
                    v-if="form.schedule_type === 'fixed'"
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
                    form.schedule_type === 'fixed'
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
                      :readonly="form.schedule_type === 'fixed'"
                      title="Work Hours"
                      placeholder="0"
                      class="w-full h-full pl-3 pr-8 bg-transparent font-mono text-xs font-bold text-center focus:outline-none"
                      :class="form.schedule_type === 'fixed' ? 'text-gray-700 cursor-not-allowed' : 'text-purple-900'"
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
                      :readonly="form.schedule_type === 'fixed'"
                      title="Work Minutes"
                      placeholder="0"
                      class="w-full h-full pl-3 pr-8 bg-transparent font-mono text-xs font-bold text-center focus:outline-none"
                      :class="form.schedule_type === 'fixed' ? 'text-gray-700 cursor-not-allowed' : 'text-purple-900'"
                    />
                    <span class="absolute right-2 text-[11px] font-semibold text-gray-400 select-none pointer-events-none">min</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Informational Notice -->
            <div
              v-if="form.schedule_type === 'fixed'"
              class="text-[11px] text-teal-700 bg-teal-50/70 border border-teal-200/80 rounded-xl px-3 py-2 flex items-center gap-2"
            >
              <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                Fixed Schedule: Shift runs from <strong>{{ form.start_time }}</strong> to <strong>{{ form.end_time }}</strong>. Minimum required hours dynamically computed as <strong>{{ formatHoursToHuman(form.min_work_hours) }}</strong> (after subtracting {{ form.punch_in_grace || 0 }}m punch-in grace).
              </span>
            </div>
            <div
              v-else
              class="text-[11px] text-purple-700 bg-purple-50/70 border border-purple-200/80 rounded-xl px-3 py-2 flex items-center gap-2"
            >
              <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                Flexible Schedule: Shift start and end timings are <strong>ignored</strong>. Minimum work hours can be adjusted directly (currently <strong>{{ formatHoursToHuman(form.min_work_hours) }}</strong>).
              </span>
            </div>

            <!-- Grace Period & Shift Pattern Sub-row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-200/70">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-700">Punch-in Grace (Minutes)</label>
                <input
                  v-model.number="form.punch_in_grace"
                  type="number"
                  min="0"
                  max="60"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-700">Shift Pattern</label>
                <select
                  v-model="form.shift_pattern"
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
              <input v-model="form.wfm_allowed" type="checkbox" class="sr-only peer" />
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
                @click="form.office_location = systemConfigStore.officeLocation || '28.560247, 77.199301'"
              >
                Set Default HQ
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">Office Coordinates (Lat, Long)</label>
                <input
                  v-model="form.office_location"
                  type="text"
                  :placeholder="systemConfigStore.officeLocation || '28.560247, 77.199301'"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">Perimeter Radius (meters)</label>
                <input
                  v-model.number="form.office_radius"
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
                  v-model="form.home_location"
                  type="text"
                  placeholder="e.g. 28.560247, 77.199301"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">Perimeter Radius (meters)</label>
                <input
                  v-model.number="form.home_radius"
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
                  v-model="form.work_location_names"
                  placeholder="Type city or locality and press Enter or comma..."
                />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] text-gray-600 font-medium">Detection Radius (meters)</label>
                <input
                  v-model.number="form.work_location_radius"
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
                  @click="form.weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']"
                >
                  Mon-Fri
                </button>
                <span class="text-gray-300 text-xs">|</span>
                <button
                  type="button"
                  class="text-[11px] text-teal-700 hover:text-teal-800 font-semibold hover:underline"
                  @click="form.weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']"
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
              @click="isModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-teal-500/25 disabled:opacity-50"
            >
              <UIcon v-if="isSaving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>Save Schedule</span>
            </button>
          </div>
        </form>
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

const searchQuery = ref("");
const selectedDepartment = ref<number | "ALL">("ALL");
const selectedScheduleType = ref("ALL");
const selectedMode = ref("ALL");
const isRefreshing = ref(false);

const isModalOpen = ref(false);
const activeEmp = ref<AdminEmployee | null>(null);
const isSaving = ref(false);

const availableDays = [
  { key: "monday", label: "Mon", full: "Monday" },
  { key: "tuesday", label: "Tue", full: "Tuesday" },
  { key: "wednesday", label: "Wed", full: "Wednesday" },
  { key: "thursday", label: "Thu", full: "Thursday" },
  { key: "friday", label: "Fri", full: "Friday" },
  { key: "saturday", label: "Sat", full: "Saturday" },
  { key: "sunday", label: "Sun", full: "Sunday" },
];

const form = ref({
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

// Computed Stats
const totalWithSchedule = computed(() => {
  return adminStore.employees.filter((e) => e.work_schedule).length;
});

const fixedCount = computed(() => {
  return adminStore.employees.filter((e) => (e.work_schedule?.schedule_type || "fixed") === "fixed").length;
});

const flexibleCount = computed(() => {
  return adminStore.employees.filter((e) => e.work_schedule?.schedule_type === "flexible").length;
});

const wfmCount = computed(() => {
  return adminStore.employees.filter((e) => e.work_schedule?.wfm_allowed).length;
});

const officeOnlyCount = computed(() => {
  return adminStore.employees.filter((e) => e.work_schedule && !e.work_schedule.wfm_allowed).length;
});

const missingScheduleCount = computed(() => {
  return adminStore.employees.filter((e) => !e.work_schedule).length;
});

// Filtered Employees
const filteredEmployees = computed(() => {
  return adminStore.employees.filter((emp) => {
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const name = (emp.full_name || "").toLowerCase();
      const email = (emp.email || "").toLowerCase();
      if (!name.includes(q) && !email.includes(q)) return false;
    }

    if (selectedDepartment.value !== "ALL" && emp.department !== selectedDepartment.value) {
      return false;
    }

    if (selectedScheduleType.value !== "ALL") {
      const empType = emp.work_schedule?.schedule_type || "fixed";
      if (selectedScheduleType.value === "fixed" && empType !== "fixed") return false;
      if (selectedScheduleType.value === "flexible" && empType !== "flexible") return false;
    }

    if (selectedMode.value === "WFM" && !emp.work_schedule?.wfm_allowed) return false;
    if (selectedMode.value === "OFFICE" && (!emp.work_schedule || emp.work_schedule?.wfm_allowed)) return false;
    if (selectedMode.value === "NO_SCHEDULE" && emp.work_schedule) return false;

    return true;
  });
});

function getInitials(name: string): string {
  if (!name) return "EM";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatTime(val: string | null | undefined): string {
  if (!val) return "--:--";
  return val.slice(0, 5);
}

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
    if (!form.value.min_work_hours || form.value.min_work_hours <= 0) return 8;
    const totalMinutes = Math.round(form.value.min_work_hours * 60);
    return Math.floor(totalMinutes / 60);
  },
  set: (val: number) => {
    if (form.value.schedule_type === 'fixed') return;
    const h = Math.max(0, Math.min(24, Number(val) || 0));
    const m = scheduleFlexibleMinutes.value;
    const totalMinutes = h * 60 + m;
    form.value.min_work_hours = Math.round((totalMinutes / 60) * 100) / 100;
  },
});

const scheduleFlexibleMinutes = computed({
  get: () => {
    if (!form.value.min_work_hours || form.value.min_work_hours <= 0) return 0;
    const totalMinutes = Math.round(form.value.min_work_hours * 60);
    return totalMinutes % 60;
  },
  set: (val: number) => {
    if (form.value.schedule_type === 'fixed') return;
    const h = scheduleFlexibleHours.value;
    const m = Math.max(0, Math.min(59, Number(val) || 0));
    const totalMinutes = h * 60 + m;
    form.value.min_work_hours = Math.round((totalMinutes / 60) * 100) / 100;
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
  form.value.schedule_type = type;
  if (type === "fixed") {
    if (!form.value.start_time) form.value.start_time = "09:30";
    if (!form.value.end_time) form.value.end_time = "18:30";
    form.value.min_work_hours = calculateHoursBetween(
      form.value.start_time,
      form.value.end_time,
      form.value.punch_in_grace || 0
    );
  } else {
    if (!form.value.min_work_hours || form.value.min_work_hours <= 0) {
      form.value.min_work_hours = 8;
    }
  }
}

watch(
  [
    () => form.value.start_time,
    () => form.value.end_time,
    () => form.value.punch_in_grace,
    () => form.value.schedule_type,
  ],
  ([newStart, newEnd, newGrace, newType]) => {
    if (newType === "fixed" && newStart && newEnd) {
      form.value.min_work_hours = calculateHoursBetween(newStart, newEnd, newGrace || 0);
    }
  }
);

async function refreshData() {
  isRefreshing.value = true;
  await adminStore.fetchEmployees(true);
  isRefreshing.value = false;
}

function isWeekdaySelected(dayKey: string): boolean {
  const target = dayKey.toLowerCase().trim();
  return (form.value.weekdays || []).some((d) => {
    const s = String(d).toLowerCase().trim();
    return s === target || s === target.slice(0, 3);
  });
}

function toggleWeekday(dayKey: string) {
  const target = dayKey.toLowerCase().trim();
  const current = (form.value.weekdays || []).map((d) => {
    const s = String(d).toLowerCase().trim();
    const matched = availableDays.find((day) => day.key === s || day.label.toLowerCase() === s);
    return matched ? matched.key : s;
  });

  if (isWeekdaySelected(target)) {
    form.value.weekdays = current.filter((d) => d !== target);
  } else {
    form.value.weekdays = [...current, target];
  }
}

function captureDeviceGPS() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.value.home_location = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
    },
    (err) => {
      alert("GPS error: " + err.message);
    }
  );
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

  form.value = {
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
  isModalOpen.value = true;
}

async function saveSchedule() {
  if (!activeEmp.value || isSaving.value) return;
  isSaving.value = true;

  try {
    const isFlexible = form.value.schedule_type === "flexible";

    const payload = {
      employee_id: activeEmp.value.id,
      schedule_type: form.value.schedule_type,
      min_work_hours: form.value.min_work_hours || 8,
      start_time: isFlexible ? null : (form.value.start_time ? `${form.value.start_time}:00` : null),
      end_time: isFlexible ? null : (form.value.end_time ? `${form.value.end_time}:00` : null),
      punch_in_grace: form.value.punch_in_grace,
      shift_pattern: form.value.shift_pattern || "day",
      wfm_allowed: form.value.wfm_allowed,
      office_location: form.value.office_location,
      office_radius: form.value.office_radius,
      home_location: form.value.home_location || null,
      home_radius: form.value.home_radius,
      work_location_names: form.value.work_location_names ? form.value.work_location_names.trim().toLowerCase() : null,
      work_location_radius: form.value.work_location_radius || 100,
      weekdays: form.value.weekdays.map((d) => String(d).toLowerCase().trim()),
      updated_at: new Date().toISOString(),
    };

    // 1. Resolve existing schedule ID from activeEmp or directly from the DB
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
      // Update by employee_id to keep all existing rows for this employee synchronized
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
      // Only insert when no schedule exists for this employee
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
    isModalOpen.value = false;
  } catch (err: any) {
    alert("Failed to save schedule: " + err.message);
  } finally {
    isSaving.value = false;
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
