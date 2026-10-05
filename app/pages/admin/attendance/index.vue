<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200/70">
      <div>
        <h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>Attendance Control Center</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Live Overrides & Logs
          </span>
        </h1>
        <p class="text-xs text-gray-500 mt-0.5">
          Review daily biometric and GPS punch logs, adjust timestamps, correct late flags, or inject missing attendance.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="p-2.5 rounded-xl bg-white/80 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm transition-colors"
          title="Refresh attendance records"
          @click="fetchAttendance"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            :class="['w-4 h-4', isLoading ? 'animate-spin text-emerald-600' : '']"
          />
        </button>

        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
          @click="openAddManualModal"
        >
          <UIcon name="i-heroicons-plus-circle" class="w-4 h-4" />
          <span>Add Manual Punch</span>
        </button>
      </div>
    </div>

    <!-- Date & Filter Controls -->
    <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-md flex flex-col lg:flex-row items-center justify-between gap-4">
      <!-- Date Selector -->
      <div class="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm transition-colors"
          @click="setDateToToday"
        >
          Today
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm transition-colors"
          @click="setDateToYesterday"
        >
          Yesterday
        </button>
        <div
          class="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-emerald-500 transition-colors cursor-pointer"
          @click="dateInputRef?.showPicker?.()"
        >
          <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-emerald-600 shrink-0" />
          <input
            ref="dateInputRef"
            v-model="selectedDate"
            type="date"
            class="bg-transparent text-gray-900 text-xs font-mono font-bold focus:outline-none cursor-pointer [color-scheme:light]"
            @click.stop="(e) => (e.target as HTMLInputElement).showPicker?.()"
            @change="fetchAttendance"
          />
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        <!-- Search Employee -->
        <div class="relative w-full sm:w-64">
          <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search employee..."
            class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <!-- Department Filter -->
        <select
          v-model="selectedDepartment"
          class="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Departments</option>
          <option v-for="d in adminStore.departments" :key="d.id" :value="d.id">
            {{ d.name }}
          </option>
        </select>

        <!-- Status Filter -->
        <select
          v-model="selectedStatus"
          class="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="present">Present</option>
          <option value="late">Late Arrival</option>
          <option value="early_departure">Early Departure</option>
          <option value="half_day">Half Day</option>
          <option value="absent">Absent</option>
          <option value="on_leave">On Leave</option>
        </select>

        <!-- Face Verification Filter -->
        <select
          v-model="selectedFaceFilter"
          class="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Biometrics</option>
          <option value="VERIFIED">Face Verified Only</option>
          <option value="BYPASSED">Bypassed / Unverified</option>
        </select>
      </div>
    </div>

    <!-- Daily KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Logs</div>
        <div class="text-2xl font-black text-gray-900 mt-1 font-mono">{{ attendanceRecords.length }}</div>
        <div class="text-[10px] text-gray-500">Recorded punches</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Present</div>
        <div class="text-2xl font-black text-emerald-600 mt-1 font-mono">{{ presentCount }}</div>
        <div class="text-[10px] text-gray-500">Active today</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Face Verified</div>
        <div class="text-2xl font-black text-purple-600 mt-1 font-mono">{{ faceVerifiedCount }}</div>
        <div class="text-[10px] text-gray-500">Biometric matched</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Late Arrivals</div>
        <div class="text-2xl font-black text-amber-600 mt-1 font-mono">{{ lateCount }}</div>
        <div class="text-[10px] text-gray-500">Beyond grace limit</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Early Departures</div>
        <div class="text-2xl font-black text-rose-600 mt-1 font-mono">{{ earlyCount }}</div>
        <div class="text-[10px] text-gray-500">Left before shift end</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Avg Hours</div>
        <div class="text-2xl font-black text-blue-600 mt-1 font-mono">{{ avgWorkHours }}h</div>
        <div class="text-[10px] text-gray-500">Completed hours</div>
      </div>
    </div>

    <!-- Attendance Table -->
    <div class="rounded-2xl border border-gray-200/70 bg-white/90 backdrop-blur-lg overflow-hidden shadow-xl">
      <div v-if="isLoading" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-3 animate-spin text-emerald-600" />
        <p class="text-xs">Fetching attendance logs for {{ selectedDate }}...</p>
      </div>

      <div v-else-if="filteredRecords.length === 0" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-calendar-days" class="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <h3 class="text-sm font-semibold text-gray-800">No attendance records on {{ selectedDate }}</h3>
        <p class="text-xs text-gray-500 mt-1">
          No staff have punched in yet, or no manual entries were found for this date.
        </p>
        <button
          class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/20"
          @click="openAddManualModal"
        >
          Add Manual Punch
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
              <th class="py-3.5 px-4">Employee</th>
              <th class="py-3.5 px-4">Punch In</th>
              <th class="py-3.5 px-4">Punch Out</th>
              <th class="py-3.5 px-4">Work Hours</th>
              <th class="py-3.5 px-4">Status & Flags</th>
              <th class="py-3.5 px-4">Remarks</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="rec in filteredRecords"
              :key="rec.id"
              class="hover:bg-emerald-50/40 transition-colors group"
            >
              <!-- Employee Info -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-gray-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-gray-200">
                    {{ getInitials(rec.employee?.full_name || rec.employee?.email || 'NA') }}
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-gray-900 flex items-center gap-1.5">
                      <span class="truncate">{{ rec.employee?.full_name || 'Staff' }}</span>
                      <span
                        v-if="rec.employee?.employee_code"
                        class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 border border-gray-200"
                      >
                        {{ rec.employee?.employee_code }}
                      </span>
                    </div>
                    <div class="text-[11px] text-gray-500 truncate">
                      {{ adminStore.getDepartmentName(rec.employee?.department ?? null) }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Punch In -->
              <td class="py-3.5 px-4">
                <div v-if="rec.punch_in" class="space-y-0.5">
                  <div class="font-mono text-emerald-700 font-bold flex items-center gap-1">
                    <UIcon name="i-heroicons-arrow-right-end-on-rectangle" class="w-3.5 h-3.5 text-emerald-600" />
                    <span>{{ formatTimeWithSeconds(rec.punch_in) }}</span>
                  </div>
                  <div v-if="rec.punch_in_location" class="text-[10px] text-gray-500 truncate max-w-xs" :title="rec.punch_in_location">
                    {{ rec.punch_in_location }}
                  </div>
                </div>
                <span v-else class="text-gray-400 italic">--:--</span>
              </td>

              <!-- Punch Out -->
              <td class="py-3.5 px-4">
                <div v-if="rec.punch_out" class="space-y-0.5">
                  <div class="font-mono text-blue-700 font-bold flex items-center gap-1">
                    <UIcon name="i-heroicons-arrow-left-start-on-rectangle" class="w-3.5 h-3.5 text-blue-600" />
                    <span>{{ formatTimeWithSeconds(rec.punch_out) }}</span>
                  </div>
                  <div v-if="rec.punch_out_location" class="text-[10px] text-gray-500 truncate max-w-xs" :title="rec.punch_out_location">
                    {{ rec.punch_out_location }}
                  </div>
                </div>
                <span v-else class="text-gray-400 italic">Not Punched Out</span>
              </td>

              <!-- Work Hours -->
              <td class="py-3.5 px-4">
                <div class="font-mono font-bold text-gray-900 text-xs">
                  {{ rec.work_hours ? `${Number(rec.work_hours).toFixed(2)}h` : '0.00h' }}
                </div>
              </td>

              <!-- Status & Flags -->
              <td class="py-3.5 px-4">
                <div class="flex flex-wrap gap-1.5 items-center">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                      rec.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      rec.status === 'half_day' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      rec.status === 'absent' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-gray-100 text-gray-700'
                    ]"
                  >
                    {{ rec.status || 'present' }}
                  </span>

                  <!-- Face Verification Badges -->
                  <span
                    v-if="rec.face_verified"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-xs"
                    :title="rec.face_confidence ? `Face match confidence: ${(rec.face_confidence * 100).toFixed(1)}%` : 'Face match verified on device'"
                  >
                    <UIcon name="i-heroicons-face-smile" class="w-3.5 h-3.5 text-purple-600" />
                    <span>Verified{{ rec.face_confidence ? ` (${(rec.face_confidence * 100).toFixed(0)}%)` : '' }}</span>
                  </span>

                  <span
                    v-else-if="rec.employee?.face_recognition && rec.punch_in && !rec.face_verified"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                    title="Employee has face recognition enabled, but this punch was not verified (manual or bypassed)"
                  >
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-3.5 h-3.5 text-rose-600" />
                    <span>Face Bypassed</span>
                  </span>

                  <!-- Late Badge -->
                  <span
                    v-if="rec.is_late"
                    class="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-medium"
                    :title="`Late by ${rec.late_minutes || 0} minutes`"
                  >
                    Late ({{ rec.late_minutes }}m)
                  </span>

                  <!-- Early Departure Badge -->
                  <span
                    v-if="rec.is_early_departure"
                    class="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-medium"
                    :title="`Early departure by ${rec.early_departure_minutes || 0} minutes`"
                  >
                    Early ({{ rec.early_departure_minutes }}m)
                  </span>

                  <!-- Regularized Badge -->
                  <span
                    v-if="rec.is_regularized"
                    class="px-1.5 py-0.5 rounded text-[10px] bg-sky-50 text-sky-700 border border-sky-200 font-medium"
                  >
                    Regularized
                  </span>
                </div>
              </td>

              <!-- Remarks / Comments -->
              <td class="py-3.5 px-4 max-w-xs truncate text-[11px] text-gray-500">
                <span v-if="rec.remarks || rec.comment">{{ rec.remarks || rec.comment }}</span>
                <span v-else class="text-gray-300">-</span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Edit Punch Log"
                    @click="openEditModal(rec)"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                  </button>

                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 transition-colors"
                    title="Delete Punch Log"
                    @click="deleteRecord(rec)"
                  >
                    <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= MODAL: EDIT ATTENDANCE RECORD ================= -->
    <div
      v-if="isEditModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 class="text-base font-bold text-gray-900">Override Attendance Record</h3>
            <p class="text-xs text-gray-500">{{ activeRecord?.employee?.full_name }} — {{ selectedDate }}</p>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isEditModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Face Verification Status Info Banner in Edit Modal -->
        <div
          v-if="activeRecord?.face_verified || activeRecord?.employee?.face_recognition"
          class="flex items-center justify-between p-3 rounded-2xl border text-xs"
          :class="activeRecord?.face_verified ? 'bg-purple-50/60 border-purple-200 text-purple-900' : 'bg-amber-50/60 border-amber-200 text-amber-900'"
        >
          <div class="flex items-center gap-2">
            <UIcon
              :name="activeRecord?.face_verified ? 'i-heroicons-face-smile' : 'i-heroicons-exclamation-triangle'"
              class="w-4 h-4 shrink-0"
              :class="activeRecord?.face_verified ? 'text-purple-600' : 'text-amber-600'"
            />
            <span class="font-medium">
              {{ activeRecord?.face_verified ? 'Punch Face Verified' : 'Face Verification Missing / Bypassed' }}
            </span>
          </div>
          <span v-if="activeRecord?.face_confidence" class="font-mono font-bold text-[11px] bg-white/80 px-2 py-0.5 rounded border border-purple-200">
            Match: {{ (activeRecord.face_confidence * 100).toFixed(1) }}%
          </span>
        </div>

        <form @submit.prevent="saveRecordEdit" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Punch In Time -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Punch In Time</label>
              <input
                v-model="editForm.punch_in_time"
                type="time"
                step="1"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none cursor-pointer [color-scheme:light]"
                @click="(e) => (e.target as HTMLInputElement).showPicker?.()"
              />
            </div>

            <!-- Punch Out Time -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Punch Out Time</label>
              <input
                v-model="editForm.punch_out_time"
                type="time"
                step="1"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none cursor-pointer [color-scheme:light]"
                @click="(e) => (e.target as HTMLInputElement).showPicker?.()"
              />
            </div>

            <!-- Status -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Status</label>
              <select
                v-model="editForm.status"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="present">Present</option>
                <option value="half_day">Half Day</option>
                <option value="absent">Absent</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>

            <!-- Work Hours -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Work Hours</label>
              <input
                v-model.number="editForm.work_hours"
                type="number"
                step="0.01"
                min="0"
                max="24"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Late and Early Arrival Toggles -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <!-- Late Toggle -->
            <div class="space-y-2">
              <UCheckbox
                v-model="editForm.is_late"
                color="warning"
                size="sm"
                :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
              >
                <template #label>
                  <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Is Late Arrival</span>
                </template>
              </UCheckbox>
              <div v-if="editForm.is_late" class="space-y-1">
                <label class="text-[10px] text-gray-500">Late Minutes</label>
                <input
                  v-model.number="editForm.late_minutes"
                  type="number"
                  min="0"
                  class="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-900 text-xs"
                />
              </div>
            </div>

            <!-- Early Departure Toggle -->
            <div class="space-y-2">
              <UCheckbox
                v-model="editForm.is_early_departure"
                color="error"
                size="sm"
                :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
              >
                <template #label>
                  <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Is Early Departure</span>
                </template>
              </UCheckbox>
              <div v-if="editForm.is_early_departure" class="space-y-1">
                <label class="text-[10px] text-gray-500">Early Minutes</label>
                <input
                  v-model.number="editForm.early_departure_minutes"
                  type="number"
                  min="0"
                  class="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-900 text-xs"
                />
              </div>
            </div>
          </div>

          <!-- Remarks / Reason for Manual Edit -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700">Remarks / Reason for Override *</label>
            <textarea
              v-model="editForm.remarks"
              rows="2"
              placeholder="e.g. Approved manual correction by HR Admin due to biometric machine glitch"
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
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
              <span>Save Punch Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ================= MODAL: ADD MANUAL PUNCH ================= -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 class="text-base font-bold text-gray-900">Add Manual Attendance Punch</h3>
            <p class="text-xs text-gray-500">Inject missing punch records directly into the database.</p>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isAddModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveNewManualPunch" class="space-y-4">
          <!-- Employee Selector -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700">Select Employee *</label>
            <select
              v-model="addForm.employee_id"
              required
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="" disabled>Select an employee</option>
              <option v-for="emp in adminStore.employees" :key="emp.id" :value="emp.id">
                {{ emp.full_name || emp.email }} ({{ emp.employee_code || 'No Code' }})
              </option>
            </select>
          </div>

          <!-- Date -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700">Date *</label>
            <input
              v-model="addForm.date"
              type="date"
              required
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none cursor-pointer [color-scheme:light]"
              @click="(e) => (e.target as HTMLInputElement).showPicker?.()"
            />
          </div>

          <!-- Times -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Punch In Time</label>
              <input
                v-model="addForm.punch_in_time"
                type="time"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer [color-scheme:light]"
                @click="(e) => (e.target as HTMLInputElement).showPicker?.()"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Punch Out Time</label>
              <input
                v-model="addForm.punch_out_time"
                type="time"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer [color-scheme:light]"
                @click="(e) => (e.target as HTMLInputElement).showPicker?.()"
              />
            </div>
          </div>

          <!-- Status & Location -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Status</label>
              <select
                v-model="addForm.status"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none"
              >
                <option value="present">Present</option>
                <option value="half_day">Half Day</option>
                <option value="absent">Absent</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Location Tag</label>
              <input
                v-model="addForm.location_tag"
                type="text"
                placeholder="Admin Manual Punch"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <!-- Remarks -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700">Admin Remarks</label>
            <textarea
              v-model="addForm.remarks"
              rows="2"
              placeholder="e.g. Client site visit / missing punch added by admin"
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
              @click="isAddModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <UIcon v-if="isSaving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>Create Attendance Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAdminStore } from "~/stores/admin";

interface AttendanceRecord {
  id: number;
  employee_id: string;
  punch_in: string | null;
  punch_out: string | null;
  punch_in_location: string | null;
  punch_out_location: string | null;
  date: string;
  status: string;
  is_weekend: boolean;
  is_holiday: boolean;
  is_regularized: boolean;
  attendance_type: string | null;
  is_late: boolean;
  late_minutes: number;
  is_early_departure: boolean;
  early_departure_minutes: number;
  work_hours: number;
  remarks: string | null;
  comment: string | null;
  face_verified?: boolean | null;
  face_confidence?: number | null;
  employee?: {
    id: string;
    full_name: string | null;
    email: string;
    employee_code: string | null;
    department: number | null;
    face_recognition?: boolean | null;
  };
}

const adminStore = useAdminStore();
const supabase = useSupabaseClient();

const selectedDate = ref(getLocalDateString());
const dateInputRef = ref<HTMLInputElement | null>(null);
const searchQuery = ref("");
const selectedDepartment = ref<number | "ALL">("ALL");
const selectedStatus = ref<string>("ALL");
const selectedFaceFilter = ref<"ALL" | "VERIFIED" | "BYPASSED">("ALL");
const attendanceRecords = ref<AttendanceRecord[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);

// Edit Modal
const isEditModalOpen = ref(false);
const activeRecord = ref<AttendanceRecord | null>(null);
const editForm = ref({
  punch_in_time: "",
  punch_out_time: "",
  status: "present",
  is_late: false,
  late_minutes: 0,
  is_early_departure: false,
  early_departure_minutes: 0,
  work_hours: 0,
  remarks: "",
});

// Add Modal
const isAddModalOpen = ref(false);
const addForm = ref({
  employee_id: "",
  date: getLocalDateString(),
  punch_in_time: "09:30",
  punch_out_time: "18:30",
  status: "present",
  location_tag: "Admin Manual Override",
  remarks: "",
});

function setDateToToday() {
  selectedDate.value = getLocalDateString();
  fetchAttendance();
}

function setDateToYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  selectedDate.value = getLocalDateString(d);
  fetchAttendance();
}

async function fetchAttendance() {
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        *,
        employee:employee_id(id, full_name, email, employee_code, department, face_recognition)
      `)
      .eq("date", selectedDate.value || "")
      .order("punch_in", { ascending: true });

    if (error) throw error;
    attendanceRecords.value = (data as any) || [];
  } catch (err: any) {
    console.error("Failed to fetch attendance:", err);
  } finally {
    isLoading.value = false;
  }
}

// Filtered Records
const filteredRecords = computed(() => {
  return attendanceRecords.value.filter((rec) => {
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const name = (rec.employee?.full_name || "").toLowerCase();
      const email = (rec.employee?.email || "").toLowerCase();
      const code = (rec.employee?.employee_code || "").toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !code.includes(q)) {
        return false;
      }
    }

    if (selectedDepartment.value !== "ALL" && rec.employee?.department !== selectedDepartment.value) {
      return false;
    }

    if (selectedStatus.value !== "ALL") {
      if (selectedStatus.value === "late" && !rec.is_late) return false;
      if (selectedStatus.value === "early_departure" && !rec.is_early_departure) return false;
      if (selectedStatus.value !== "late" && selectedStatus.value !== "early_departure" && rec.status !== selectedStatus.value) {
        return false;
      }
    }

    if (selectedFaceFilter.value === "VERIFIED" && !rec.face_verified) {
      return false;
    }
    if (selectedFaceFilter.value === "BYPASSED" && rec.face_verified) {
      return false;
    }

    return true;
  });
});

// Summary Counts
const presentCount = computed(() => {
  return attendanceRecords.value.filter((r) => r.status === "present").length;
});

const faceVerifiedCount = computed(() => {
  return attendanceRecords.value.filter((r) => r.face_verified).length;
});

const lateCount = computed(() => {
  return attendanceRecords.value.filter((r) => r.is_late).length;
});

const earlyCount = computed(() => {
  return attendanceRecords.value.filter((r) => r.is_early_departure).length;
});

const avgWorkHours = computed(() => {
  if (attendanceRecords.value.length === 0) return "0.0";
  const sum = attendanceRecords.value.reduce((acc, curr) => acc + (Number(curr.work_hours) || 0), 0);
  return (sum / attendanceRecords.value.length).toFixed(1);
});

function getInitials(name: string): string {
  if (!name) return "EM";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatTimeWithSeconds(ts: string): string {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) {
      return ts.slice(0, 8);
    }
    return d.toLocaleTimeString("en-GB", { hour12: false });
  } catch {
    return ts;
  }
}

// Edit Modal
function openEditModal(rec: AttendanceRecord) {
  activeRecord.value = rec;
  editForm.value = {
    punch_in_time: rec.punch_in ? rec.punch_in.split("T")[1]?.slice(0, 8) || "" : "",
    punch_out_time: rec.punch_out ? rec.punch_out.split("T")[1]?.slice(0, 8) || "" : "",
    status: rec.status || "present",
    is_late: rec.is_late || false,
    late_minutes: rec.late_minutes || 0,
    is_early_departure: rec.is_early_departure || false,
    early_departure_minutes: rec.early_departure_minutes || 0,
    work_hours: Number(rec.work_hours) || 0,
    remarks: rec.remarks || rec.comment || "",
  };
  isEditModalOpen.value = true;
}

async function saveRecordEdit() {
  if (!activeRecord.value) return;
  isSaving.value = true;

  try {
    const date = activeRecord.value.date;
    const punchIn = editForm.value.punch_in_time ? `${date}T${editForm.value.punch_in_time}` : null;
    const punchOut = editForm.value.punch_out_time ? `${date}T${editForm.value.punch_out_time}` : null;

    let calcHours = editForm.value.work_hours;
    if (punchIn && punchOut) {
      const diffMs = new Date(punchOut).getTime() - new Date(punchIn).getTime();
      if (diffMs > 0) {
        calcHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
      }
    }

    const { error } = await (supabase as any)
      .from("attendance")
      .update({
        punch_in: punchIn,
        punch_out: punchOut,
        status: editForm.value.status,
        is_late: editForm.value.is_late,
        late_minutes: editForm.value.late_minutes,
        is_early_departure: editForm.value.is_early_departure,
        early_departure_minutes: editForm.value.early_departure_minutes,
        work_hours: calcHours,
        remarks: editForm.value.remarks,
        comment: editForm.value.remarks,
        is_regularized: true,
      })
      .eq("id", activeRecord.value.id);

    if (error) throw error;

    await fetchAttendance();
    isEditModalOpen.value = false;
  } catch (err: any) {
    alert("Failed to update attendance: " + err.message);
  } finally {
    isSaving.value = false;
  }
}

// Add Manual Punch Modal
function openAddManualModal() {
  addForm.value = {
    employee_id: adminStore.employees[0]?.id || "",
    date: selectedDate.value,
    punch_in_time: "09:30",
    punch_out_time: "18:30",
    status: "present",
    location_tag: "Admin Manual Override",
    remarks: "Added manually via Admin Control Panel",
  };
  isAddModalOpen.value = true;
}

async function saveNewManualPunch() {
  if (!addForm.value.employee_id) {
    alert("Please select an employee");
    return;
  }
  isSaving.value = true;

  try {
    const punchIn = addForm.value.punch_in_time
      ? `${addForm.value.date}T${addForm.value.punch_in_time}:00`
      : null;
    const punchOut = addForm.value.punch_out_time
      ? `${addForm.value.date}T${addForm.value.punch_out_time}:00`
      : null;

    let workHours = 8.0;
    if (punchIn && punchOut) {
      const diffMs = new Date(punchOut).getTime() - new Date(punchIn).getTime();
      if (diffMs > 0) {
        workHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
      }
    }

    const { error } = await (supabase as any).from("attendance").insert({
      employee_id: addForm.value.employee_id,
      date: addForm.value.date,
      punch_in: punchIn,
      punch_out: punchOut,
      punch_in_location: addForm.value.location_tag,
      punch_out_location: addForm.value.location_tag,
      status: addForm.value.status,
      work_hours: workHours,
      remarks: addForm.value.remarks,
      comment: addForm.value.remarks,
      is_regularized: true,
    });

    if (error) throw error;

    if (selectedDate.value !== addForm.value.date) {
      selectedDate.value = addForm.value.date;
    }
    await fetchAttendance();
    isAddModalOpen.value = false;
  } catch (err: any) {
    alert("Failed to insert manual punch: " + err.message);
  } finally {
    isSaving.value = false;
  }
}

async function deleteRecord(rec: AttendanceRecord) {
  if (!confirm(`Are you sure you want to delete this punch record for ${rec.employee?.full_name || 'Staff'} on ${rec.date}?`)) {
    return;
  }

  try {
    const { error } = await supabase.from("attendance").delete().eq("id", rec.id);
    if (error) throw error;
    attendanceRecords.value = attendanceRecords.value.filter((r) => r.id !== rec.id);
  } catch (err: any) {
    alert("Failed to delete record: " + err.message);
  }
}

onMounted(async () => {
  await adminStore.fetchMetadata();
  await adminStore.fetchEmployees();
  await fetchAttendance();
});
</script>
