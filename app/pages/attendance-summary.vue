<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Background matching your existing design -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100"
    />
    <div
      class="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] bg-[size:75px_75px]"
    />

    <!-- Floating Elements -->
    <div
      class="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-emerald-400/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"
    />
    <div
      class="absolute top-40 right-20 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"
    />

    <!-- Loading State -->
    <div
      v-if="loading"
      class="relative min-h-screen flex items-center justify-center"
    >
      <div class="text-center">
        <div class="relative mb-6">
          <div
            class="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur-sm opacity-75"
          />
          <div
            class="relative bg-gradient-to-r from-emerald-500 to-blue-600 p-6 rounded-2xl"
          >
            <UIcon
              name="i-heroicons-arrow-path"
              class="h-12 w-12 text-white animate-spin"
            />
          </div>
        </div>
        <h2
          class="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2"
        >
          Loading Attendance Data
        </h2>
        <p class="text-gray-600">
          Please wait while we fetch attendance records...
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="relative min-h-screen">
      <!-- Header -->
      <div
        class="relative bg-white/90 backdrop-blur-lg border-b border-gray-200/50 shadow-lg"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <!-- Back Button -->
              <UButton
                size="md"
                variant="outline"
                color="gray"
                class="bg-white/80 backdrop-blur-sm hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                @click="goBack"
              >
                <UIcon
                  name="i-heroicons-arrow-left"
                  class="h-5 w-5 mr-2 text-gray-600"
                />
                <span class="text-gray-700">Back</span>
              </UButton>
              <div class="hidden sm:block">
                <h1
                  class="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                >
                  Attendance Summary
                </h1>
                <p class="text-gray-600">
                  {{ employeeName }} - {{ currentMonthYear }}
                </p>
              </div>
            </div>
            <!-- Month/Year Display for mobile -->
            <div class="sm:hidden">
              <p class="text-sm font-medium text-gray-900">
                {{ currentMonthYear }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Summary Statistics Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <!-- Present Days -->
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 bg-green-100 rounded-lg">
                <UIcon
                  name="i-heroicons-check-circle"
                  class="h-6 w-6 text-green-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Present</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ summaryData.present }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Absent Days -->
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 bg-red-100 rounded-lg">
                <UIcon
                  name="i-heroicons-x-circle"
                  class="h-6 w-6 text-red-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Absent</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ summaryData.absent }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Half Days -->
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 bg-orange-100 rounded-lg">
                <UIcon
                  name="i-heroicons-clock"
                  class="h-6 w-6 text-orange-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Half Day</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ summaryData.halfDay }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Leave Days -->
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 bg-blue-100 rounded-lg">
                <UIcon
                  name="i-heroicons-calendar-days"
                  class="h-6 w-6 text-blue-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">On Leave</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ summaryData.onLeave }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Working Days -->
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 bg-purple-100 rounded-lg">
                <UIcon
                  name="i-heroicons-chart-bar"
                  class="h-6 w-6 text-purple-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Working Days</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ summaryData.totalWorkingDays }}
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Calendar Section -->
        <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-xl">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                Monthly Calendar
              </h3>
              <div class="flex items-center space-x-2">
                <UButton
                  variant="outline"
                  size="sm"
                  :disabled="loading"
                  @click="previousMonth"
                >
                  <UIcon name="i-heroicons-chevron-left" class="h-4 w-4" />
                </UButton>
                <span
                  class="text-black text-sm font-medium min-w-[120px] text-center"
                  >{{ currentMonthYear }}</span
                >
                <UButton
                  variant="outline"
                  size="sm"
                  :disabled="loading || isCurrentOrFutureMonth"
                  @click="nextMonth"
                >
                  <UIcon name="i-heroicons-chevron-right" class="h-4 w-4" />
                </UButton>
              </div>
            </div>
          </template>

          <!-- Calendar Content -->
          <div class="p-4">
            <!-- Weekday Headers -->
            <div class="grid grid-cols-7 gap-1 mb-4">
              <div
                v-for="day in weekDays"
                :key="day"
                class="text-center text-sm font-medium text-gray-600 py-2"
              >
                {{ day }}
              </div>
            </div>

            <!-- Calendar Grid -->
            <div class="grid grid-cols-7 gap-1">
              <!-- Empty cells to align first day of month with correct weekday -->
              <div
                v-for="n in new Date(
                  focusedDay.getFullYear(),
                  focusedDay.getMonth(),
                  1
                ).getDay()"
                :key="`empty-${n}`"
                class="h-12 sm:h-16"
              />

              <!-- Actual calendar days (current month only) -->
              <div
                v-for="(day, index) in calendarDays"
                :key="index"
                :class="[
                  'h-12 sm:h-16 flex items-center justify-center rounded-lg text-sm relative transition-all duration-200',
                  getCalendarDayClass(day),
                ]"
                @click="showAttendanceDetails(day)"
              >
                <!-- Day Number -->
                <span :class="{ 'font-bold': day.isToday }">
                  {{ day.dayNumber }}
                </span>

                <!-- Status Indicator Dot -->
                <div
                  v-if="day.status"
                  :class="[
                    'absolute bottom-1 right-1 w-2 h-2 rounded-full',
                    getStatusDotClass(day.status),
                  ]"
                />
              </div>
            </div>

            <!-- Calendar Legend -->
            <div class="mt-6 flex flex-wrap gap-4 text-xs border-t pt-4">
              <div class="flex items-center">
                <div class="w-3 h-3 bg-green-500 rounded-full mr-2" />
                <span class="text-black">Present</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 bg-red-500 rounded-full mr-2" />
                <span class="text-black">Absent</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 bg-orange-500 rounded-full mr-2" />
                <span class="text-black">Half Day</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                <span class="text-black">Leave</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 bg-gray-400 rounded-full mr-2" />
                <span class="text-black">Weekend</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 bg-purple-400 rounded-full mr-2" />
                <span class="text-black">Holiday</span>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Enhanced Attendance Details Modal -->
    <transition name="fade">
      <div
        v-if="showAttendanceModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        @click="showAttendanceModal = false"
      >
        <div
          class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 relative m-4"
          @click.stop
        >
          <!-- Close Button -->
          <button
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            @click="showAttendanceModal = false"
          >
            <UIcon name="i-heroicons-x-mark" class="h-6 w-6" />
          </button>

          <div v-if="selectedDayData" class="space-y-6">
            <!-- Header -->
            <div class="text-center">
              <h3 class="text-xl font-bold text-gray-900 mb-2">
                Attendance Details
              </h3>
              <p class="text-gray-600">
                {{ formatDetailDate(selectedDayData.date) }}
              </p>
            </div>

            <!-- Status Badge -->
            <div class="text-center">
              <span
                :class="[
                  'inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium',
                  getDetailStatusClass(selectedDayData.status),
                ]"
              >
                {{ formatStatus(selectedDayData.status) }}
              </span>
            </div>

            <!-- Main Attendance Details -->
            <div
              v-if="selectedDayData.record && !selectedDayData.record.isEmpty"
              class="space-y-4"
            >
              <!-- Basic Times -->
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 p-3 rounded-lg">
                  <label class="text-sm font-medium text-gray-600"
                    >Punch In</label
                  >
                  <p class="text-gray-900 font-medium">
                    {{ formatTime(selectedDayData.record.punch_in) }}
                  </p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <label class="text-sm font-medium text-gray-600"
                    >Punch Out</label
                  >
                  <p class="text-gray-900 font-medium">
                    {{ formatTime(selectedDayData.record.punch_out) }}
                  </p>
                </div>
              </div>

              <!-- Work Hours (Manager Level) -->
              <div
                v-if="selectedDayData.record.work_hours > 0 && managerLevel > 0"
                class="bg-blue-50 p-3 rounded-lg"
              >
                <label class="text-sm font-medium text-blue-600"
                  >Work Hours</label
                >
                <p class="text-blue-900 font-medium">
                  {{ formatWorkHours(selectedDayData.record.work_hours) }}
                </p>
              </div>

              <!-- Late Information (Manager Level) -->
              <div
                v-if="
                  selectedDayData.record.late_minutes > 0 && managerLevel > 0
                "
                class="bg-red-50 p-3 rounded-lg"
              >
                <label class="text-sm font-medium text-red-600"
                  >Late Arrival</label
                >
                <p class="text-red-900 font-medium">
                  Yes ({{ selectedDayData.record.late_minutes }} minutes)
                </p>
              </div>

              <!-- Early Departure (Manager Level) -->
              <div
                v-if="
                  selectedDayData.record.early_departure_minutes > 0 &&
                  managerLevel > 0
                "
                class="bg-orange-50 p-3 rounded-lg"
              >
                <label class="text-sm font-medium text-orange-600"
                  >Early Departure</label
                >
                <p class="text-orange-900 font-medium">
                  Yes ({{ selectedDayData.record.early_departure_minutes }}
                  minutes)
                </p>
              </div>

              <!-- Clickable Locations (Manager Level) -->
              <div
                v-if="
                  selectedDayData.record.punch_in_location && managerLevel > 0
                "
                class="bg-green-50 p-3 rounded-lg"
              >
                <label class="text-sm font-medium text-green-600"
                  >Punch In Location</label
                >
                <button
                  class="flex items-center space-x-2 text-green-900 font-medium hover:underline cursor-pointer mt-2 p-2 bg-white rounded border border-green-200 hover:bg-green-100 transition-colors"
                  @click="
                    openLocationOnMap(selectedDayData.record.punch_in_location)
                  "
                >
                  <UIcon name="i-heroicons-map-pin" class="h-4 w-4" />
                  <span>{{ selectedDayData.record.punch_in_location }}</span>
                  <UIcon
                    name="i-heroicons-arrow-top-right-on-square"
                    class="h-4 w-4"
                  />
                </button>
              </div>

              <div
                v-if="
                  selectedDayData.record.punch_out_location && managerLevel > 0
                "
                class="bg-green-50 p-3 rounded-lg"
              >
                <label class="text-sm font-medium text-green-600"
                  >Punch Out Location</label
                >
                <button
                  class="flex items-center space-x-2 text-green-900 font-medium hover:underline cursor-pointer mt-2 p-2 bg-white rounded border border-green-200 hover:bg-green-100 transition-colors"
                  @click="
                    openLocationOnMap(selectedDayData.record.punch_out_location)
                  "
                >
                  <UIcon name="i-heroicons-map-pin" class="h-4 w-4" />
                  <span>{{ selectedDayData.record.punch_out_location }}</span>
                  <UIcon
                    name="i-heroicons-arrow-top-right-on-square"
                    class="h-4 w-4"
                  />
                </button>
              </div>

              <!-- Status Flags -->
              <div class="space-y-2">
                <div
                  v-if="selectedDayData.record.is_regularized"
                  class="flex items-center space-x-2"
                >
                  <UIcon
                    name="i-heroicons-check-circle"
                    class="h-5 w-5 text-green-500"
                  />
                  <span class="text-sm font-medium text-green-700"
                    >Regularized</span
                  >
                </div>

                <div
                  v-if="selectedDayData.record.is_weekend && managerLevel > 0"
                  class="flex items-center space-x-2"
                >
                  <UIcon
                    name="i-heroicons-calendar"
                    class="h-5 w-5 text-gray-500"
                  />
                  <span class="text-sm font-medium text-gray-700">Weekend</span>
                </div>

                <div
                  v-if="selectedDayData.record.is_holiday && managerLevel > 0"
                  class="flex items-center space-x-2"
                >
                  <UIcon
                    name="i-heroicons-gift"
                    class="h-5 w-5 text-purple-500"
                  />
                  <span class="text-sm font-medium text-purple-700"
                    >Holiday</span
                  >
                </div>
              </div>

              <!-- Remarks (Manager Level) -->
              <div
                v-if="selectedDayData.record.remarks && managerLevel > 0"
                class="bg-yellow-50 p-3 rounded-lg"
              >
                <label class="text-sm font-medium text-yellow-600"
                  >Remarks</label
                >
                <p class="text-yellow-900 mt-1">
                  {{ selectedDayData.record.remarks }}
                </p>
              </div>

              <!-- Comment Section (exactly like Flutter) -->
              <div v-if="canAccessAttendanceComment" class="border-t pt-4">
                <div class="flex justify-between items-center mb-2">
                  <label class="text-sm font-medium text-gray-600"
                    >Comment</label
                  >

                  <!-- If comment exists, show options menu -->
                  <div v-if="selectedDayData.record.comment" class="relative">
                    <!-- Replace your UDropdown section with this custom dropdown -->
                    <div ref="dropdownRef" class="relative">
                      <UButton
                        variant="ghost"
                        size="sm"
                        icon="i-heroicons-ellipsis-vertical"
                        @click="showDropdown = !showDropdown"
                      />

                      <div
                        v-if="showDropdown"
                        class="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
                      >
                        <button
                          class="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center space-x-2"
                          @click="
                            showCommentDialogFn(selectedDayData.record);
                            showDropdown = false;
                          "
                        >
                          <UIcon name="i-heroicons-pencil" class="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          class="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          @click="
                            showDeleteCommentDialogFn(selectedDayData.record);
                            showDropdown = false;
                          "
                        >
                          <UIcon name="i-heroicons-trash" class="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- If no comment, show Add Comment button -->
                  <UButton
                    v-else
                    variant="outline"
                    size="sm"
                    icon="i-heroicons-chat-bubble-left-ellipsis"
                    @click="showCommentDialogFn(selectedDayData.record)"
                  >
                    Add Comment
                  </UButton>
                </div>

                <!-- Show existing comment or placeholder -->
                <div
                  v-if="selectedDayData.record.comment"
                  class="bg-gray-100 p-3 rounded-lg border border-gray-300"
                >
                  <p class="text-gray-700 text-sm">
                    {{ selectedDayData.record.comment }}
                  </p>
                </div>
                <div v-else class="text-gray-500 text-sm italic">
                  No comment added
                </div>
              </div>
            </div>

            <!-- No Record Information -->
            <div v-else class="text-center py-6">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="h-12 w-12 text-orange-500 mx-auto mb-4"
              />
              <h4 class="text-lg font-medium text-gray-900 mb-2">
                No Attendance Record
              </h4>
              <p class="text-sm text-gray-600">
                No attendance was recorded for this day
              </p>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <UButton variant="outline" @click="showAttendanceModal = false">
              Close
            </UButton>
          </div>
        </div>
      </div>
    </transition>

    <!-- Comment Dialog -->
    <transition name="fade">
      <div
        v-if="showCommentDialog"
        class="fixed inset-0 z-60 flex items-center justify-center bg-black/50"
        @click="cancelComment"
      >
        <div
          class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4"
          @click.stop
        >
          <h3 class="text-lg font-bold text-gray-900 mb-4">
            {{ isEditingComment ? "Edit Comment" : "Add Comment" }}
          </h3>

          <textarea
            v-model="commentText"
            rows="4"
            class="text-gray-900 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter your comment here..."
          />

          <div v-if="commentRecord" class="mt-2 text-xs text-gray-600">
            Date: {{ formatDetailDate(new Date(commentRecord.date)) }}
          </div>

          <div class="flex justify-end space-x-3 mt-4">
            <UButton
              variant="outline"
              class="text-red-500"
              @click="cancelComment"
            >
              Cancel
            </UButton>
            <UButton :disabled="!commentText.trim()" @click="updateComment">
              Save
            </UButton>
          </div>
        </div>
      </div>
    </transition>

    <!-- Delete Comment Confirmation Dialog -->
    <transition name="fade">
      <div
        v-if="showDeleteCommentDialog"
        class="fixed inset-0 z-60 flex items-center justify-center bg-black/50"
        @click="cancelDeleteComment"
      >
        <div
          class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4"
          @click.stop
        >
          <h3 class="text-lg font-bold text-red-600 mb-4 flex items-center">
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="h-5 w-5 mr-2"
            />
            Delete Comment
          </h3>

          <p class="text-gray-700 mb-4">
            Are you sure you want to delete this comment?
          </p>

          <div
            v-if="commentRecord?.comment"
            class="bg-gray-100 p-3 rounded-lg border mb-4"
          >
            <p class="text-gray-700 text-sm line-clamp-3">
              {{ commentRecord.comment }}
            </p>
          </div>

          <div v-if="commentRecord" class="text-xs text-gray-600 mb-4">
            Date: {{ formatDetailDate(new Date(commentRecord.date)) }}
          </div>

          <p class="text-xs text-red-600 italic mb-4">
            This action cannot be undone.
          </p>

          <div class="flex justify-end space-x-3">
            <UButton variant="outline" @click="cancelDeleteComment">
              Cancel
            </UButton>
            <UButton color="red" @click="deleteComment"> Delete </UButton>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
// Page metadata and middleware
definePageMeta({
  middleware: "auth",
});

// Composables
// const user = useSupabaseUser();
const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();

// Use the store
const userProfileStore = useUserProfileStore();
const attendanceSummaryStore = useAttendanceSummaryStore();

// ✅ Initialize user profile store if not already done
onMounted(async () => {
  // Ensure user profile is initialized
  if (!userProfileStore.initialized) {
    await userProfileStore.initialize();
  }

  // Initialize attendance summary store
  attendanceSummaryStore.initializeStore();

  // Check if we have data, if not redirect
  if (!attendanceSummaryStore.hasEmployeeData) {
    toast.add({
      title: "No Employee Selected",
      description: "Redirecting to department page...",
      color: "orange",
    });

    setTimeout(() => {
      router.replace("/department");
    }, 1500);
    return;
  }

  loadData();
});

// Get data from store instead of route query
const employeeId = computed(
  () => attendanceSummaryStore.currentEmployeeId || null
);
const employeeName = computed(() => attendanceSummaryStore.currentEmployeeName);
const employeeCode = computed(
  () => attendanceSummaryStore.currentEmployee?.employeeCode || "N/A"
);
const managerLevel = computed(() => attendanceSummaryStore.currentManagerLevel);
const managerId = computed(() => attendanceSummaryStore.currentManagerId);
const joiningDate = computed(() => attendanceSummaryStore.currentJoiningDate);
// Flutter-equivalent state variables
const loading = ref(false);
const isSubmitting = ref(false);
const focusedDay = ref(new Date());
const selectedDay = ref(new Date());
const currentTime = ref(new Date());

// Modal state
const showAttendanceModal = ref(false);
const selectedDayData = ref(null);

// Summary data - exactly like Flutter
const summaryData = ref({
  present: 0,
  absent: 0,
  halfDay: 0,
  onLeave: 0,
  totalWorkingDays: 0,
});

// Calendar data - exactly like Flutter
const attendanceMap = ref(new Map());
const attendanceRecords = ref([]);
const holidays = ref([]);

// Work schedule data
const minWorkHours = ref(8.0);
const maxWorkHours = ref(12.0);
const workSchedule = ref(null);
const workingWeekdays = ref([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);

// Leave data
const leaveDates = ref([]);
const optionalHolidayDates = ref([]);

// Calendar structure
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const calendarDays = ref([]);

// Computed properties
const currentMonthYear = computed(() => {
  return focusedDay.value.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
});

const isCurrentOrFutureMonth = computed(() => {
  const current = new Date();
  const focused = focusedDay.value;
  return (
    focused.getMonth() >= current.getMonth() &&
    focused.getFullYear() >= current.getFullYear()
  );
});

// Helper functions - exactly like Flutter

// Normalize date function - exactly like Flutter _normalizeDate
const normalizeDate = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

// Get weekday name function - exactly like Flutter _getWeekdayName
const getWeekdayName = (weekday) => {
  switch (weekday) {
    case 1:
      return "monday"; // Monday = 1 in JavaScript
    case 2:
      return "tuesday";
    case 3:
      return "wednesday";
    case 4:
      return "thursday";
    case 5:
      return "friday";
    case 6:
      return "saturday";
    case 0:
      return "sunday"; // Sunday = 0 in JavaScript
    default:
      return "monday";
  }
};

// FIXED: Get attendance status - STATUS FIELD TAKES PRECEDENCE
const getAttendanceStatus = (record) => {
  // Priority 1: Leave status
  if (record.status === "leave" || record.status === "comp-off") return "leave";

  // Priority 2: Present status (regardless of punch_in)
  if (record.status === "present" || record.status === "comp-w")
    return "present";

  // Priority 3: Half-day status
  if (record.status === "half-day") return "halfDay";

  // Priority 4: Weekend status
  if (record.status === "weekend") return "weekend";

  // Priority 5: Holiday status
  if (record.status === "holiday") return "holiday";

  // Priority 6: Absent (either explicit absent status OR no punch_in with no other status)
  if (
    record.status === "absent" ||
    (!record.punch_in &&
      ![
        "present",
        "comp-w",
        "half-day",
        "leave",
        "comp-off",
        "weekend",
        "holiday",
      ].includes(record.status))
  ) {
    return "absent";
  }

  return "absent"; // Default fallback
};

// Get current time function
const getCurrentTime = async () => {
  try {
    // Try to get server time from Supabase
    const { data } = await supabase.rpc("get_supabase_time");
    return data ? new Date(data) : new Date();
  } catch (error) {
    console.log("Using local time:", error);
    return new Date();
  }
};

// Load data function - exactly like Flutter _loadData
const loadData = async () => {
  loading.value = true;

  try {
    currentTime.value = await getCurrentTime();
    focusedDay.value = new Date(currentTime.value);
    selectedDay.value = new Date(currentTime.value);

    await Promise.all([
      loadAttendanceData(currentTime.value),
      loadHolidays(currentTime.value),
    ]);

    await loadSummaryData(focusedDay.value);
  } catch (e) {
    console.error("Error loading data:", e);
    toast.add({
      title: "Error loading data",
      description: e.toString(),
      color: "red",
    });
  } finally {
    loading.value = false;
  }
};

// Load attendance data - exactly like Flutter _loadAttendanceData
const loadAttendanceData = async (month) => {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const { data } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employeeId.value)
    .or(
      `date.gte.${startOfMonth.toISOString().split("T")[0]},date.lte.${
        endOfMonth.toISOString().split("T")[0]
      }`
    );

  attendanceRecords.value = data || [];

  // Build attendance map for calendar - exactly like Flutter
  attendanceMap.value.clear();
  for (const record of attendanceRecords.value) {
    const recordDate = normalizeDate(new Date(record.date));
    attendanceMap.value.set(recordDate.getTime(), getAttendanceStatus(record));
  }
};

// Load holidays - exactly like Flutter _loadHolidays
const loadHolidays = async (month) => {
  const { data } = await supabase
    .from("holidays")
    .select("*")
    .eq("calendar_year", month.getFullYear())
    .eq("is_active", true);

  holidays.value = data || [];
};

// Load summary data - exactly like Flutter _loadSummaryData
const loadSummaryData = async (month) => {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  // Get work schedule for the employee
  const { data: workScheduleData } = await supabase
    .from("work_schedules")
    .select("*")
    .eq("employee_id", employeeId.value)
    .maybeSingle();

  if (workScheduleData) {
    workSchedule.value = workScheduleData;
    minWorkHours.value = workScheduleData.min_work_hours || 8.0;
    maxWorkHours.value = workScheduleData.max_work_hours || 12.0;
    workingWeekdays.value = workScheduleData.weekdays || [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
  }

  // Get leave applications for the month
  const { data: leaveData } = await supabase
    .from("leave_applications")
    .select("start_date, end_date, status")
    .eq("employee_id", employeeId.value)
    .eq("status", "approved")
    .or(
      `start_date.lte.${endOfMonth.toISOString().split("T")[0]},end_date.gte.${
        startOfMonth.toISOString().split("T")[0]
      }`
    );

  leaveDates.value = [];
  for (const leave of leaveData || []) {
    const startDate = new Date(leave.start_date);
    const endDate = new Date(leave.end_date);

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      leaveDates.value.push(normalizeDate(date));
    }
  }

  // Get optional holiday selections
  const { data: optionalHolidayData } = await supabase
    .from("employee_holiday_selections")
    .select("selected_date")
    .eq("employee_id", employeeId.value)
    .eq("status", "approved");

  optionalHolidayDates.value = (optionalHolidayData || []).map((e) =>
    normalizeDate(new Date(e.selected_date))
  );

  // Calculate working days and attendance summary - exactly like Flutter
  let workingDays = 0;
  let present = 0;
  let absent = 0;
  let halfDay = 0;
  let onLeave = 0;

  const today = normalizeDate(currentTime.value);

  for (
    let day = new Date(startOfMonth);
    day <= endOfMonth;
    day.setDate(day.getDate() + 1)
  ) {
    const normalizedDay = normalizeDate(day);

    // Check if it's a working day
    const weekdayName = getWeekdayName(day.getDay());

    // === Priority: 1. Leave === - exactly like Flutter
    if (
      leaveDates.value.some((ld) => ld.getTime() === normalizedDay.getTime())
    ) {
      onLeave++;
      attendanceMap.value.set(normalizedDay.getTime(), "leave");
      continue;
    }

    // === Priority: 2. Optional Holiday === - exactly like Flutter
    if (
      optionalHolidayDates.value.some(
        (oh) => oh.getTime() === normalizedDay.getTime()
      )
    ) {
      attendanceMap.value.set(normalizedDay.getTime(), "holiday");
      continue;
    }

    // Check if it's a holiday
    const isHoliday = holidays.value.some(
      (h) =>
        normalizeDate(new Date(h.holiday_date)).getTime() ===
        normalizedDay.getTime()
    );
    if (isHoliday) {
      if (!attendanceMap.value.has(normalizedDay.getTime())) {
        attendanceMap.value.set(normalizedDay.getTime(), "holiday");
      }
      continue;
    }

    if (workingWeekdays.value.includes(weekdayName) && !isHoliday) {
      workingDays++;
    }

    if (
      !attendanceMap.value.has(normalizedDay.getTime()) &&
      normalizedDay.getTime() < normalizeDate(currentTime.value).getTime() &&
      workingWeekdays.value.includes(weekdayName)
    ) {
      attendanceMap.value.set(normalizedDay.getTime(), "absent");

      // Add to records if needed elsewhere
      attendanceRecords.value.push({
        date: normalizedDay.toISOString().split("T")[0],
        employee_id: employeeId.value,
        status: "absent",
        punch_in: null,
        punch_out: null,
        isEmpty: true,
      });
    }

    // Find attendance record
    const record = attendanceRecords.value.find((r) => {
      const recordDate = new Date(r.date);
      return (
        recordDate.getFullYear() === day.getFullYear() &&
        recordDate.getMonth() === day.getMonth() &&
        recordDate.getDate() === day.getDate()
      );
    });

    // Check if weekend (non-working day) - exactly like Flutter
    if (
      !workingWeekdays.value.includes(weekdayName) &&
      (record?.status === "comp-w" || record?.status === "present")
    ) {
      attendanceMap.value.set(normalizedDay.getTime(), "present");
    } else if (
      !workingWeekdays.value.includes(weekdayName) &&
      (record?.status === "leave" || record?.status === "comp-off")
    ) {
      attendanceMap.value.set(normalizedDay.getTime(), "leave");
    } else if (
      !workingWeekdays.value.includes(weekdayName) &&
      normalizedDay.getTime() < today.getTime() &&
      record?.status !== "absent"
    ) {
      attendanceMap.value.set(normalizedDay.getTime(), "weekend");
    }

    if (
      normalizedDay.getTime() === today.getTime() ||
      normalizedDay.getTime() > today.getTime()
    )
      continue;

    if (!record || record.isEmpty) {
      // No attendance record
      if (
        day.getTime() < currentTime.value.getTime() - 24 * 60 * 60 * 1000 &&
        workingWeekdays.value.includes(weekdayName)
      ) {
        absent++;
      }
    } else {
      // Handle compensatory work as present - exactly like Flutter
      if (record.status === "comp-w") {
        present++;
      }
      // Handle other statuses - FIXED: Use status field primarily
      else if (record.status === "present") {
        present++;
      } else if (record.status === "half-day") {
        halfDay++;
      } else if (record.status === "absent") {
        absent++;
      } else if (record.status === "leave" || record.status === "comp-off") {
        onLeave++;
      }
    }
  }

  summaryData.value = {
    present,
    absent,
    halfDay,
    onLeave,
    totalWorkingDays: workingDays,
  };

  buildCalendar();
};

// Build calendar
const buildCalendar = () => {
  const lastDay = new Date(
    focusedDay.value.getFullYear(),
    focusedDay.value.getMonth() + 1,
    0
  );

  const days = [];
  const todayNormalized = normalizeDate(currentTime.value);

  // Generate only the days of the current month (instead of 42 days)
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const currentDate = new Date(
      focusedDay.value.getFullYear(),
      focusedDay.value.getMonth(),
      day
    );

    const normalizedCurrentDate = normalizeDate(currentDate);
    const isCurrentMonth = true; // Always true since we're only generating current month days
    const isToday =
      normalizedCurrentDate.getTime() === todayNormalized.getTime();
    const status = attendanceMap.value.get(normalizedCurrentDate.getTime());

    // Find the actual record for this day
    const record = attendanceRecords.value.find((r) => {
      const recordDate = new Date(r.date);
      return (
        recordDate.getFullYear() === currentDate.getFullYear() &&
        recordDate.getMonth() === currentDate.getMonth() &&
        recordDate.getDate() === currentDate.getDate()
      );
    });

    days.push({
      date: new Date(currentDate),
      dayNumber: currentDate.getDate(),
      dateString: normalizedCurrentDate.toISOString().split("T")[0],
      isCurrentMonth,
      isToday,
      status,
      record,
    });
  }

  calendarDays.value = days;
};

// Load data for month - exactly like Flutter _loadDataForMonth
const loadDataForMonth = async (month) => {
  loading.value = true;
  try {
    await Promise.all([loadAttendanceData(month), loadHolidays(month)]);
    await loadSummaryData(month);
  } catch (e) {
    console.error("Error loading month data:", e);
  } finally {
    loading.value = false;
  }
};

// Navigation functions
const previousMonth = async () => {
  const newMonth = new Date(focusedDay.value);
  newMonth.setMonth(newMonth.getMonth() - 1);
  focusedDay.value = newMonth;
  await loadDataForMonth(newMonth);
};

const nextMonth = async () => {
  if (!isCurrentOrFutureMonth.value) {
    const newMonth = new Date(focusedDay.value);
    newMonth.setMonth(newMonth.getMonth() + 1);
    focusedDay.value = newMonth;
    await loadDataForMonth(newMonth);
  }
};

const goBack = () => {
  router.back();
};

// Clear store data when component is unmounted
// onUnmounted(() => {
//   attendanceSummaryStore.clearEmployeeData()
// })

// UI helper functions
const getCalendarDayClass = (day) => {
  const classes = ["cursor-pointer", "hover:bg-gray-50"];

  if (!day.isCurrentMonth) {
    classes.push("text-gray-300", "bg-gray-50/50");
  } else if (day.isToday) {
    classes.push("bg-blue-500", "text-white", "font-bold");
  } else {
    classes.push("text-gray-900");

    switch (day.status) {
      case "present":
        classes.push("bg-green-50", "border", "border-green-200");
        break;
      case "absent":
        classes.push("bg-red-50", "border", "border-red-200");
        break;
      case "halfDay":
        classes.push("bg-orange-50", "border", "border-orange-200");
        break;
      case "leave":
        classes.push("bg-blue-50", "border", "border-blue-200");
        break;
      case "holiday":
        classes.push("bg-purple-100", "border", "border-purple-300");
        break;
      case "weekend":
        classes.push("bg-gray-50", "border", "border-gray-200");
        break;
    }
  }

  return classes.join(" ");
};

const getStatusDotClass = (status) => {
  switch (status) {
    case "present":
      return "bg-green-500";
    case "absent":
      return "bg-red-500";
    case "halfDay":
      return "bg-orange-500";
    case "leave":
      return "bg-blue-500";
    case "holiday":
      return "bg-purple-400";
    case "weekend":
      return "bg-gray-500";
    default:
      return "bg-gray-300";
  }
};

const getDetailStatusClass = (status) => {
  switch (status) {
    case "present":
      return "bg-green-50 text-green-600 ring-1 ring-green-200";
    case "absent":
      return "bg-red-50 text-red-600 ring-1 ring-red-200";
    case "halfDay":
      return "bg-orange-50 text-orange-600 ring-1 ring-orange-200";
    case "leave":
      return "bg-blue-50 text-blue-600 ring-1 ring-blue-200";
    case "holiday":
      return "bg-gray-50 text-gray-600 ring-1 ring-gray-200";
    case "weekend":
      return "bg-gray-50 text-gray-600 ring-1 ring-gray-200";
    default:
      return "bg-gray-50 text-gray-600 ring-1 ring-gray-200";
  }
};

const formatStatus = (status) => {
  switch (status) {
    case "present":
      return "Present";
    case "absent":
      return "Absent";
    case "halfDay":
      return "Half Day";
    case "leave":
      return "On Leave";
    case "holiday":
      return "Holiday";
    case "weekend":
      return "Weekend";
    default:
      return "Unknown";
  }
};

const formatTime = (timeStr) => {
  if (!timeStr) return "Not recorded";
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timeStr;
  }
};

const formatDetailDate = (date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Additional reactive refs for comment functionality
const showCommentDialog = ref(false);
const showDeleteCommentDialog = ref(false);
const commentText = ref("");
const commentRecord = ref(null);
const isEditingComment = ref(false);
const showDropdown = ref(false);
const dropdownRef = ref(null);

// Computed property to check if user can access monthly attendance comments (exactly like Flutter)
const canAccessAttendanceComment = computed(
  () => userProfileStore.canAccessAttendanceComment
);

// Enhanced function to show detailed attendance information - similar to Flutter
const showAttendanceDetails = (day) => {
  if (!day) return;

  // Find the attendance record for the selected date
  let attendanceRecord = day.record;

  // If no record found, create empty record (similar to Flutter AttendanceRecord.empty)
  if (!attendanceRecord) {
    attendanceRecord = {
      id: null,
      date: day.dateString,
      employee_id: employeeId.value,
      status: "absent",
      punch_in: null,
      punch_out: null,
      work_hours: null,
      late_minutes: 0,
      early_departure_minutes: 0,
      overtime_hours: 0,
      punch_in_location: null,
      punch_out_location: null,
      is_regularized: false,
      is_late: false,
      is_early_departure: false,
      is_weekend: false,
      is_holiday: false,
      remarks: null,
      isEmpty: true,
    };
  }

  // Check if selected date is today
  const today = normalizeDate(currentTime.value);
  const selectedDate = normalizeDate(day.date);
  const isSelectedDateToday = selectedDate.getTime() === today.getTime();

  // Check if it's a weekend day
  const weekdayName = getWeekdayName(day.date.getDay());
  const isWeekend = !workingWeekdays.value.includes(weekdayName);

  // Check if it's a holiday
  const isHoliday = holidays.value.some((h) => {
    const holidayDate = normalizeDate(new Date(h.holiday_date));
    return holidayDate.getTime() === selectedDate.getTime();
  });

  // Set comprehensive modal data
  selectedDayData.value = {
    date: day.date,
    dateString: day.dateString,
    status: day.status || attendanceRecord.status,
    record: attendanceRecord,
    isToday: isSelectedDateToday,
    isWeekend,
    isHoliday,
    canAccessAttendanceComment,
    managerLevel: managerLevel.value,
    employeeName: employeeName.value,
    // Additional computed properties
    hasRecord: !attendanceRecord.isEmpty,
    workHours: attendanceRecord.work_hours || 0,
    isLate: attendanceRecord.is_late || attendanceRecord.late_minutes > 0,
    isEarlyDeparture:
      attendanceRecord.is_early_departure ||
      attendanceRecord.early_departure_minutes > 0,
    isRegularized: attendanceRecord.is_regularized || false,
  };

  // Show the modal
  showAttendanceModal.value = true;
};

// Helper function to format work hours
const formatWorkHours = (hours) => {
  if (!hours || hours <= 0) return "Not recorded";

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours % 1) * 60);

  if (minutes === 0) {
    return `${wholeHours} hours`;
  }
  return `${wholeHours} hours ${minutes} minutes`;
};

// Location opening function - exactly like Flutter
const openLocationOnMap = async (location) => {
  try {
    if (!location) return;

    // Check if location contains coordinates (lat,lng format)
    if (location.includes(",")) {
      const coordinates = location.split(",");
      if (coordinates.length === 2) {
        const lat = parseFloat(coordinates[0].trim());
        const lng = parseFloat(coordinates[1].trim());

        if (!isNaN(lat) && !isNaN(lng)) {
          await openCoordinatesOnMap(lat, lng);
          return;
        }
      }
    }

    // If not coordinates, treat as address and search
    await openAddressOnMap(location);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    showLocationError();
  }
};

// Open coordinates on map
const openCoordinatesOnMap = async (lat, lng) => {
  // For web, we'll use Google Maps as primary option
  const urls = [
    `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    `https://maps.apple.com/?q=${lat},${lng}`, // Apple Maps fallback
  ];

  for (const url of urls) {
    try {
      window.open(url, "_blank");
      return;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log("Failed to open URL:", url);
    }
  }

  showLocationError();
};

// Open address on map
const openAddressOnMap = async (address) => {
  const encodedAddress = encodeURIComponent(address);
  const urls = [
    `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    `https://maps.apple.com/?q=${encodedAddress}`, // Apple Maps fallback
  ];

  for (const url of urls) {
    try {
      window.open(url, "_blank");
      return;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log("Failed to open URL:", url);
    }
  }

  showLocationError();
};

// Show error when location cannot be opened
const showLocationError = () => {
  toast.add({
    title: "Could not open location on map",
    description: "Please try again later",
    color: "red",
  });
};

// Comment dialog functions - exactly like Flutter
const showCommentDialogFn = (attendanceRecord) => {
  commentRecord.value = attendanceRecord;

  if (attendanceRecord.comment && attendanceRecord.comment.trim() !== "") {
    isEditingComment.value = true;
    commentText.value = attendanceRecord.comment;
  } else {
    isEditingComment.value = false;
    commentText.value = "";
  }

  showCommentDialog.value = true;
};

const showDeleteCommentDialogFn = (attendanceRecord) => {
  commentRecord.value = attendanceRecord;
  showDeleteCommentDialog.value = true;
};

const cancelComment = () => {
  showCommentDialog.value = false;
  commentText.value = "";
  commentRecord.value = null;
  isEditingComment.value = false;
};

const cancelDeleteComment = () => {
  showDeleteCommentDialog.value = false;
  commentRecord.value = null;
};

// Update comment in Supabase - exactly like Flutter
const updateComment = async () => {
  if (!commentText.value.trim()) {
    toast.add({
      title: "Please enter a comment",
      color: "red",
    });
    return;
  }

  if (!commentRecord.value?.id) {
    toast.add({
      title: "Invalid attendance record",
      color: "red",
    });
    return;
  }

  try {
    // Show loading
    toast.add({
      title: "Updating comment...",
      color: "blue",
    });

    // Update in Supabase
    const { error } = await supabase
      .from("attendance")
      .update({ comment: commentText.value.trim() })
      .eq("id", commentRecord.value.id);

    if (error) throw error;

    // Update local attendanceRecords
    const recordIndex = attendanceRecords.value.findIndex(
      (record) => record.id === commentRecord.value.id
    );
    if (recordIndex !== -1) {
      attendanceRecords.value[recordIndex] = {
        ...attendanceRecords.value[recordIndex],
        comment: commentText.value.trim(),
      };
    }

    // Update selectedDayData if it's the same record
    if (selectedDayData.value?.record?.id === commentRecord.value.id) {
      selectedDayData.value.record.comment = commentText.value.trim();
    }

    // Close dialog
    showCommentDialog.value = false;

    toast.add({
      title: "Comment updated successfully",
      color: "green",
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    toast.add({
      title: "Error updating comment",
      description: error.message,
      color: "red",
    });
  }
};

// Delete comment from Supabase - exactly like Flutter
const deleteComment = async () => {
  if (!commentRecord.value?.id) {
    toast.add({
      title: "Invalid attendance record",
      color: "red",
    });
    return;
  }

  try {
    // Show loading
    toast.add({
      title: "Deleting comment...",
      color: "blue",
    });

    // Update in Supabase - set comment to null
    const { error } = await supabase
      .from("attendance")
      .update({ comment: null })
      .eq("id", commentRecord.value.id);

    if (error) throw error;

    // Update local attendanceRecords
    const recordIndex = attendanceRecords.value.findIndex(
      (record) => record.id === commentRecord.value.id
    );
    if (recordIndex !== -1) {
      attendanceRecords.value[recordIndex] = {
        ...attendanceRecords.value[recordIndex],
        comment: null,
      };
    }

    // Update selectedDayData if it's the same record
    if (selectedDayData.value?.record?.id === commentRecord.value.id) {
      selectedDayData.value.record.comment = null;
    }

    // Close dialogs
    showDeleteCommentDialog.value = false;
    showAttendanceModal.value = false;

    toast.add({
      title: "Comment deleted successfully",
      color: "green",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    toast.add({
      title: "Error deleting comment",
      description: error.message,
      color: "red",
    });
  }
};

// Page metadata
useHead({
  title: `Attendance Summary - ${employeeName.value}`,
  meta: [
    {
      name: "description",
      content: "View detailed attendance summary and calendar.",
    },
  ],
});
</script>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.bg-grid-slate-100 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(148 163 184 / 0.05)'%3e%3cpath d='m0 .5h32m-32 32v-32'/%3e%3c/svg%3e");
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
