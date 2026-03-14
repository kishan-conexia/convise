<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Background matching existing design -->
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
      v-if="isLoading"
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
          Loading Monthly Attendance
        </h2>
        <p class="text-gray-600">Fetching attendance data...</p>
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
                  Monthly Attendance
                </h1>
                <p class="text-gray-600">{{ formatMonth(selectedMonth) }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <!-- Month Selector -->
              <UButton
                size="md"
                variant="outline"
                color="blue"
                class="bg-blue-50/80 backdrop-blur-sm hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                @click="openMonthPicker"
              >
                <UIcon
                  name="i-heroicons-calendar"
                  class="h-5 w-5 mr-2 text-blue-600"
                />
                <span class="text-blue-700">Select Month</span>
              </UButton>

              <!-- Export Button -->
              <UButton
                size="md"
                variant="outline"
                color="green"
                class="bg-green-50/80 backdrop-blur-sm hover:bg-green-100 border-2 border-green-200 hover:border-green-300 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                :disabled="attendanceData.length === 0"
                @click="exportCSV"
              >
                <UIcon
                  name="i-heroicons-arrow-down-tray"
                  class="h-5 w-5 mr-2 text-green-600"
                />
                <span class="text-green-700">Export CSV</span>
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Status Legend -->
        <div class="mb-8 relative z-10">
          <div class="relative">
            <div
              class="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur-sm opacity-25"
            />
            <div
              class="relative bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-2xl shadow-lg p-6"
            >
              <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                <div
                  v-for="legend in statusLegends"
                  :key="legend.code"
                  class="flex items-center space-x-2"
                >
                  <div
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2',
                      legend.bgClass,
                      legend.borderClass,
                    ]"
                  >
                    {{ legend.code }}
                  </div>
                  <span class="text-sm font-medium text-gray-700">{{
                    legend.label
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-4 sm:mb-6">
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="relative">
              <input
                v-model.trim="searchQuery"
                type="text"
                placeholder="Search by name, code, or department..."
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
            <!-- Search Results Count -->
            <div
              v-if="searchQuery"
              class="mt-3 pt-3 border-t border-gray-200/50"
            >
              <p class="text-sm text-gray-600">
                <span class="font-medium">{{
                  filteredAttendanceData.length
                }}</span>
                of
                <span class="font-medium">{{ attendanceData.length }}</span>
                employees found
              </p>
            </div>
          </UCard>
        </div>

        <!-- Attendance Table -->
        <div class="relative">
          <div
            class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-20"
          />
          <div
            class="relative bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-2xl shadow-xl"
          >
            <div
              v-if="filteredAttendanceData.length === 0"
              class="text-center py-16"
            >
              <UIcon
                name="i-heroicons-calendar-x"
                class="h-20 w-20 text-gray-400 mx-auto mb-6"
              />
              <h3 class="text-xl font-semibold text-gray-900 mb-3">
                No Attendance Data
              </h3>
              <p class="text-gray-500 text-lg">
                No attendance records found for the selected month
              </p>
            </div>
            <div v-else class="overflow-hidden rounded-2xl">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50/80 backdrop-blur-sm">
                    <tr>
                      <th
                        class="sticky left-0 z-20 bg-gray-50/90 backdrop-blur-sm px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                      >
                        Employee
                      </th>
                      <th
                        class="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Code
                      </th>
                      <th
                        class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Department
                      </th>
                      <th
                        class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Manager
                      </th>
                      <!-- Day Headers -->
                      <th
                        v-for="day in dayHeaders"
                        :key="day.day"
                        :title="day.tooltip"
                        class="px-2 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[45px] border-l border-gray-100"
                      >
                        <div class="text-center">
                          <div class="font-bold text-gray-800">
                            {{ day.day }}
                          </div>
                          <div class="text-[10px] text-gray-500 font-medium">
                            {{ day.weekday }}
                          </div>
                        </div>
                      </th>
                      <!-- Summary Headers -->
                      <th
                        v-for="summary in summaryHeaders"
                        :key="summary.code"
                        :class="[
                          'px-3 py-4 text-center text-xs font-semibold uppercase tracking-wider border-l-2',
                          getSummaryColumnClasses(summary.code),
                        ]"
                      >
                        {{ summary.code }}
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    class="bg-white/50 backdrop-blur-sm divide-y divide-gray-100"
                  >
                    <tr
                      v-for="employee in filteredAttendanceData"
                      :key="employee.id"
                      class="hover:bg-blue-50/50 transition-colors duration-150"
                    >
                      <td
                        class="sticky left-0 z-10 bg-white/90 backdrop-blur-sm px-6 py-4 whitespace-nowrap border-r border-gray-200"
                      >
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10">
                            <div
                              class="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center overflow-hidden"
                            >
                              <span class="text-white text-sm font-bold">
                                {{ getInitials(employee.full_name) }}
                              </span>
                            </div>
                          </div>
                          <div class="ml-4">
                            <div class="text-sm font-semibold text-gray-900">
                              {{ employee.full_name }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        class="px-4 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900"
                      >
                        {{ employee.employee_code }}
                      </td>
                      <td
                        class="px-4 py-4 whitespace-nowrap text-sm text-gray-700"
                      >
                        {{ employee.department }}
                      </td>
                      <td
                        class="px-4 py-4 whitespace-nowrap text-sm text-gray-700"
                      >
                        {{ employee.reporting_manager }}
                      </td>
                      <!-- Daily Status - INLINE IMPLEMENTATION -->
                      <td
                        v-for="day in dayHeaders"
                        :key="day.day"
                        class="px-2 py-4 whitespace-nowrap text-center border-l border-gray-50"
                        :title="`${day.tooltip}: ${getStatusDisplayName(
                          employee.days[day.day]
                        )}`"
                      >
                        <div class="flex justify-center">
                          <!-- Future Date Indicator -->
                          <div
                            v-if="day.isFuture || day.isToday"
                            class="w-7 h-7 flex items-center justify-center"
                          >
                            <span class="text-gray-400 text-sm font-medium"
                              >-</span
                            >
                          </div>
                          <!-- Empty Status -->
                          <div
                            v-else-if="!employee.days[day.day]"
                            class="w-7 h-7 flex items-center justify-center"
                          >
                            <span class="text-gray-300 text-sm">-</span>
                          </div>
                          <!-- Status Indicator -->
                          <div
                            v-else
                            :class="getStatusClasses(employee.days[day.day])"
                            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-110 shadow-sm cursor-pointer"
                          >
                            {{ getStatusSymbol(employee.days[day.day]) }}
                          </div>
                        </div>
                      </td>
                      <!-- Summary Totals -->
                      <td
                        v-for="summary in summaryHeaders"
                        :key="summary.code"
                        :class="[
                          'px-3 py-4 whitespace-nowrap text-sm text-center font-bold border-l-2',
                          getSummaryColumnClasses(summary.code),
                        ]"
                      >
                        {{ employee[summary.field] || 0 }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Month Picker Modal with Calendar -->
    <transition name="fade" appear>
      <div
        v-if="showMonthPicker"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="showMonthPicker = false"
      >
        <transition name="scale" appear>
          <div
            v-if="showMonthPicker"
            class="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg"
          >
            <!-- Header -->
            <div
              class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white rounded-t-2xl"
            >
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">Select Month</h3>
                <button
                  class="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
                  @click="showMonthPicker = false"
                >
                  <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
                </button>
              </div>
            </div>

            <!-- Calendar Content -->
            <div class="p-6">
              <!-- Year Navigation -->
              <div class="flex items-center justify-between mb-6">
                <button
                  class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  :disabled="calendarYear <= 2025"
                  @click="navigateYear(-1)"
                >
                  <UIcon
                    name="i-heroicons-chevron-left"
                    class="h-5 w-5 text-gray-600"
                  />
                </button>

                <h4 class="text-xl font-bold text-gray-800">
                  {{ calendarYear }}
                </h4>

                <button
                  class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  :disabled="calendarYear >= today.getFullYear()"
                  @click="navigateYear(1)"
                >
                  <UIcon
                    name="i-heroicons-chevron-right"
                    class="h-5 w-5 text-gray-600"
                  />
                </button>
              </div>

              <!-- Months Grid -->
              <div class="grid grid-cols-3 gap-3 mb-6">
                <button
                  v-for="(month, index) in monthNames"
                  :key="index"
                  :class="[
                    'p-4 rounded-lg text-sm font-medium transition-all duration-200 border-2',
                    isSelectedMonth(calendarYear, index)
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : isCurrentMonth(calendarYear, index)
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : isMonthDisabled(calendarYear, index)
                      ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300',
                  ]"
                  :disabled="isMonthDisabled(calendarYear, index)"
                  @click="selectMonth(calendarYear, index)"
                >
                  <div class="font-semibold">{{ month.short }}</div>
                  <div class="text-xs opacity-75">{{ month.full }}</div>
                </button>
              </div>

              <!-- Action Buttons -->
              <div class="flex justify-end space-x-3">
                <UButton variant="outline" @click="showMonthPicker = false">
                  Cancel
                </UButton>
                <UButton
                  :disabled="!hasSelectedMonth"
                  @click="applyMonthSelection"
                >
                  Apply
                </UButton>
              </div>
            </div>
          </div>
        </transition>
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
const userProfileStore = useUserProfileStore();
const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();

// Reactive state
const isLoading = ref(true);
const showMonthPicker = ref(false);
const attendanceData = ref([]);
const dayHeaders = ref([]);
const departmentCache = ref(new Map());
const employeeCache = ref(new Map());
const searchQuery = ref("");
const showExportMenu = ref(false)

// FIXED: Date handling with consistent timezone handling
const today = new Date();
// Create a clean "today" date without time components
const todayDateOnly = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate()
);

const selectedMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1));
const tempSelectedMonth = ref("");

const maxMonth = computed(() => {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
});

// FIXED: More reliable calculation of days in month
const daysInMonth = computed(() => {
  const year = selectedMonth.value.getFullYear();
  const month = selectedMonth.value.getMonth();
  return new Date(year, month + 1, 0).getDate();
});

// Status legends with proper styling
const statusLegends = [
  {
    code: "P",
    label: "Present",
    bgClass: "bg-green-100 text-green-800",
    borderClass: "border-green-300",
  },
  {
    code: "A",
    label: "Absent",
    bgClass: "bg-red-100 text-red-800",
    borderClass: "border-red-300",
  },
  {
    code: "½",
    label: "Half Day",
    bgClass: "bg-orange-100 text-orange-800",
    borderClass: "border-orange-300",
  },
  {
    code: "L",
    label: "Leave",
    bgClass: "bg-blue-100 text-blue-800",
    borderClass: "border-blue-300",
  },
  {
    code: "W",
    label: "Weekend",
    bgClass: "bg-gray-100 text-gray-800",
    borderClass: "border-gray-300",
  },
  {
    code: "CW",
    label: "Comp Working",
    bgClass: "bg-teal-100 text-teal-800",
    borderClass: "border-teal-300",
  },
  {
    code: "CO",
    label: "Comp Off",
    bgClass: "bg-indigo-100 text-indigo-800",
    borderClass: "border-indigo-300",
  },
  {
    code: "H",
    label: "Holiday",
    bgClass: "bg-purple-100 text-purple-800",
    borderClass: "border-purple-300",
  },
];

const summaryHeaders = [
  { code: "P", field: "total_present" },
  { code: "A", field: "total_absent" },
  { code: "½", field: "total_half_day" },
  { code: "L", field: "total_leave" },
  { code: "W", field: "total_weekend" },
  { code: "CW", field: "total_comp_w" },
  { code: "CO", field: "total_comp_off" },
  { code: "H", field: "total_holiday" },
  
]

// FIXED: Consistent date utilities
const getDateOnly = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

// INLINE STATUS INDICATOR FUNCTIONS
const getStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case "present":
      return "bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200";
    case "leave":
      return "bg-blue-100 text-blue-800 border-2 border-blue-300 hover:bg-blue-200";
    case "half-day":
      return "bg-orange-100 text-orange-800 border-2 border-orange-300 hover:bg-orange-200";
    case "weekend":
      return "bg-gray-100 text-gray-800 border-2 border-gray-300 hover:bg-gray-200";
    case "comp-w":
      return "bg-teal-100 text-teal-800 border-2 border-teal-300 hover:bg-teal-200";
    case "comp-off":
      return "bg-indigo-100 text-indigo-800 border-2 border-indigo-300 hover:bg-indigo-200";
    case "holiday":
      return "bg-purple-100 text-purple-800 border-2 border-purple-300 hover:bg-purple-200";
    default:
      return "bg-red-100 text-red-800 border-2 border-red-300 hover:bg-red-200";
  }
};

const getStatusSymbol = (status) => {
  switch (status?.toLowerCase()) {
    case "present":
      return "P";
    case "leave":
      return "L";
    case "half-day":
      return "½";
    case "weekend":
      return "W";
    case "comp-w":
      return "CW";
    case "comp-off":
      return "CO";
    case "holiday":
      return "H";
    default:
      return "A";
  }
};

// Enhanced version with hover effects
const getSummaryColumnClasses = (code, isHeader = false) => {
  const baseClasses = isHeader
    ? "hover:bg-opacity-90 transition-all duration-200"
    : "hover:bg-opacity-80 transition-colors duration-150";

  const statusMap = {
    P: `bg-green-100/80 text-green-800 border-green-200 hover:bg-green-200/60 ${baseClasses}`,
    A: `bg-red-100/80 text-red-800 border-red-200 hover:bg-red-200/60 ${baseClasses}`,
    L: `bg-blue-100/80 text-blue-800 border-blue-200 hover:bg-blue-200/60 ${baseClasses}`,
    "½": `bg-orange-100/80 text-orange-800 border-orange-200 hover:bg-orange-200/60 ${baseClasses}`,
    W: `bg-gray-100/80 text-gray-800 border-gray-200 hover:bg-gray-200/60 ${baseClasses}`,
    CW: `bg-teal-100/80 text-teal-800 border-teal-200 hover:bg-teal-200/60 ${baseClasses}`,
    CO: `bg-indigo-100/80 text-indigo-800 border-indigo-200 hover:bg-indigo-200/60 ${baseClasses}`,
    H: `bg-purple-100/80 text-purple-800 border-purple-200 hover:bg-purple-200/60 ${baseClasses}`,

  };

  return (
    statusMap[code] ||
    `bg-gray-100/50 text-gray-600 border-gray-300 ${baseClasses}`
  );
};

// Functions
const goBack = () => {
  router.back();
};

const formatMonth = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
};

// FIXED: Consistent date header building
const buildDayHeaders = () => {
  const headers = [];

  for (let i = 1; i <= daysInMonth.value; i++) {
    const date = new Date(
      selectedMonth.value.getFullYear(),
      selectedMonth.value.getMonth(),
      i
    );
    const dateOnly = getDateOnly(date);
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });

    // FIXED: Consistent future date logic - compare with today (not yesterday)
    const isFuture = dateOnly > todayDateOnly;
    const isToday = dateOnly.getTime() === todayDateOnly.getTime();

    headers.push({
      day: i,
      weekday,
      tooltip: date.toDateString(),
      isFuture,
      isToday,
      dateOnly, //for easier comparison later
    });
  }

  dayHeaders.value = headers;
};

const fetchMonthlyAttendance = async () => {
  isLoading.value = true;

  try {
    // FIXED: Cleaner date range calculation
    const year = selectedMonth.value.getFullYear();
    const month = selectedMonth.value.getMonth();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0); // Last day of the month

    // FIXED: Use consistent date-only comparison
    const actualEndDate = todayDateOnly < monthEnd ? todayDateOnly : monthEnd;

    // Fetch all employees
    const { data: allEmployees, error: employeesError } = await supabase
      .from("profiles")
      .select("id, full_name, employee_code, department, is_active");

    if (employeesError) throw employeesError;

    // Cache all employees
    employeeCache.value.clear();
    allEmployees?.forEach((emp) => {
      employeeCache.value.set(emp.id, emp);
    });

    // Filter active employees
    const activeEmployees = allEmployees?.filter((emp) => emp.is_active) || [];

    // Extract unique department IDs
    const departmentIds = [
      ...new Set(activeEmployees.map((emp) => emp.department).filter(Boolean)),
    ];

    // Fetch departments
    if (departmentIds.length > 0) {
      await prefetchDepartments(departmentIds);
    }

    // FIXED: Better date formatting for SQL queries
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from("attendance")
      .select("employee_id, date, status")
      .gte("date", formatDateForSQL(monthStart))
      .lte("date", formatDateForSQL(actualEndDate));

    if (attendanceError) throw attendanceError;

    // Process data
    processAttendanceData(
      activeEmployees,
      attendanceRecords || [],
      actualEndDate
    );
  } catch (error) {
    console.error("Error fetching monthly attendance:", error);
    toast.add({
      title: "Error loading attendance data",
      description: error.message,
      color: "red",
    });
    attendanceData.value = [];
  } finally {
    isLoading.value = false;
  }
};

const prefetchDepartments = async (departmentIds) => {
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, manager_id, parent_id")
    .in("id", departmentIds);

  departments?.forEach((dept) => {
    departmentCache.value.set(dept.id, dept);
  });

  // Fetch parent departments if needed
  const parentIds =
    departments
      ?.filter(
        (dept) => dept.parent_id && !departmentCache.value.has(dept.parent_id)
      )
      ?.map((dept) => dept.parent_id) || [];

  if (parentIds.length > 0) {
    await prefetchDepartments(parentIds);
  }
};

const findReportingManager = (employeeId, deptId) => {
  if (!deptId) return "N/A";

  let traversalCount = 0;
  let currentDeptId = deptId;

  while (currentDeptId && traversalCount < 5) {
    const dept = departmentCache.value.get(currentDeptId);
    if (!dept) break;

    const managerId = dept.manager_id;

    if (managerId && managerId !== employeeId) {
      const manager = employeeCache.value.get(managerId);
      return manager?.full_name || "N/A";
    }

    if (managerId === employeeId) {
      currentDeptId = dept.parent_id;
      traversalCount++;
      continue;
    }

    currentDeptId = dept.parent_id;
    traversalCount++;
  }

  return "N/A";
};

// FIXED: More robust attendance data processing
const processAttendanceData = (employees, attendance, actualEndDate) => {
  const employeeMap = new Map();

  // Initialize employees
  employees.forEach((emp) => {
    const empId = emp.id;
    const deptName = departmentCache.value.get(emp.department)?.name || "N/A";
    const reportingManager = findReportingManager(empId, emp.department);

    employeeMap.set(empId, {
      id: empId,
      full_name: emp.full_name || "Unknown",
      employee_code: emp.employee_code || "",
      department: deptName,
      reporting_manager: reportingManager,
      days: {},
      total_present: 0,
      total_absent: 0,
      total_leave: 0,
      total_half_day: 0,
      total_weekend: 0,
      total_comp_w: 0,
      total_comp_off: 0,
      total_holiday: 0,
    });

    // Initialize all days as empty
    for (let day = 1; day <= daysInMonth.value; day++) {
      employeeMap.get(empId).days[day] = "";
    }
  });

  // Process attendance records
  attendance.forEach((record) => {
    const empId = record.employee_id;
    if (!employeeMap.has(empId)) return;

    // FIXED: Ensure consistent date parsing
    const date = new Date(record.date + "T00:00:00");
    const day = date.getDate();
    const status = record.status || "absent";

    const employee = employeeMap.get(empId);
    employee.days[day] = status;
    updateStatusTotals(employee, status);
  });

  // FIXED: Better handling of missing attendance
  const year = selectedMonth.value.getFullYear();
  const month = selectedMonth.value.getMonth();

  employeeMap.forEach((employee) => {
    for (let day = 1; day <= daysInMonth.value; day++) {
      const dayDate = new Date(year, month, day);
      const dayDateOnly = getDateOnly(dayDate);

      // Only mark as absent if:
      // 1. The day is not in the future (compared to today)
      // 2. The day doesn't already have a status
      // 3. The day is within our fetch range (actualEndDate)
      if (
        dayDateOnly <= todayDateOnly &&
        dayDateOnly <= actualEndDate &&
        !employee.days[day]
      ) {
        employee.days[day] = "absent";
        employee.total_absent++;
      }
    }
  });

  // Sort by department, then by name
  const sortedData = Array.from(employeeMap.values()).sort((a, b) => {
    const deptComparison = a.department.localeCompare(b.department);
    if (deptComparison !== 0) return deptComparison;
    return a.full_name.localeCompare(b.full_name);
  });

  attendanceData.value = sortedData;
};

const updateStatusTotals = (employee, status) => {
  switch (status.toLowerCase()) {
    case "present":
      employee.total_present++;
      break;
    case "leave":
      employee.total_leave++;
      break;
    case "half-day":
    case "half":
      employee.total_half_day++;
      break;
    case "weekend":
      employee.total_weekend++;
      break;
    case "comp-w":
      employee.total_comp_w++;
      break;
    case "comp-off":
      employee.total_comp_off++;
      break;
      case "holiday":
      employee.total_holiday++;
      break;
    default:
      employee.total_absent++;
  }
};

const getStatusDisplayName = (status) => {
  switch (status?.toLowerCase()) {
    case "present":
      return "Present";
    case "absent":
      return "Absent";
    case "leave":
      return "Leave";
    case "half-day":
      return "Half Day";
    case "weekend":
      return "Weekend";
    case "comp-w":
      return "Comp Working";
    case "comp-off":
      return "Comp Off";
    case "holiday":
      return "Holiday";
    default:
      return status || "Unknown";
  }
};

// Add this computed property to your existing computed properties
const filteredAttendanceData = computed(() => {
  if (!searchQuery.value.trim()) {
    return attendanceData.value;
  }

  const query = searchQuery.value.toLowerCase().trim();

  return attendanceData.value.filter((employee) => {
    const fullName = employee.full_name?.toLowerCase() || "";
    const employeeCode = employee.employee_code?.toLowerCase() || "";
    const department = employee.department?.toLowerCase() || "";

    return (
      fullName.includes(query) ||
      employeeCode.includes(query) ||
      department.includes(query)
    );
  });
});


const exportCSV = () => {
  try {
    let csvContent = "Employee,Code,Department,Manager,";

    // Add day headers
    dayHeaders.value.forEach((day) => {
      csvContent += `"${day.day} ${day.weekday}",`;
    });

    // Add summary headers
    csvContent += "Present,Absent,Leave,Half Day,Weekend,Comp-W,Comp-Off,Holiday\n";

    // Add data rows
    filteredAttendanceData.value.forEach((employee) => {
      csvContent += `"${employee.full_name}","${employee.employee_code}","${employee.department}","${employee.reporting_manager}",`;

      // Add daily attendance
      dayHeaders.value.forEach((day) => {
        // FIXED: Handle future dates and today the same as UI
        if (day.isFuture || day.isToday) {
          csvContent += `"",`; // Show dash for future dates and today
        } else {
          const status = employee.days[day.day] || "";
          csvContent += `"${getStatusAbbreviation(status)}",`;
        }
      });

      // Add totals
      csvContent += `${employee.total_present},${employee.total_absent},${employee.total_leave},${employee.total_half_day},${employee.total_weekend},${employee.total_comp_w},${employee.total_comp_off},${employee.total_holiday}\n`;
    });

    // Create and download file
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const monthName = formatMonth(selectedMonth.value).replace(" ", "_");

    link.href = URL.createObjectURL(blob);
    link.download = `Monthly_Attendance_${monthName}.csv`;
    link.click();

    toast.add({
      title: "CSV exported successfully",
      description: `Monthly attendance for ${formatMonth(
        selectedMonth.value
      )} has been downloaded`,
      color: "green",
    });
  } catch (error) {
    console.error("download error", error);
    toast.add({
      title: "Export failed",
      description: "Failed to export CSV file",
      color: "red",
    });
  }
};



const getStatusAbbreviation = (status) => {
  switch (status?.toLowerCase()) {
    case "present":
      return "P";
    case "absent":
      return "A";
    case "leave":
      return "L";
    case "half-day":
      return "½";
    case "weekend":
      return "W";
    case "comp-w":
      return "CW";
    case "comp-off":
      return "CO";
    case "holiday":
      return "H";
    default:
      return "";
  }
};


// FIXED: Watcher to ensure consistent month selection
watch(selectedMonth, () => {
  const year = selectedMonth.value.getFullYear();
  const month = selectedMonth.value.getMonth() + 1;
  tempSelectedMonth.value = `${year}-${String(month).padStart(2, "0")}`;
});

// Initialize
onMounted(async () => {
  if (!userProfileStore.initialized) {
    await userProfileStore.initialize();
  }

  // Check manager access permissions
  const allowedDepartments = [1, 30, 301, 302, 303];
  const canAccess = userProfileStore.managedDepartmentIds?.some((id) =>
    allowedDepartments.includes(id)
  );

  if (!canAccess) {
    toast.add({
      title: "Access denied",
      description: "You do not have permission to view monthly attendance",
      color: "red",
    });
    router.push("/dashboard");
    return;
  }

  // FIXED: Initialize with consistent date handling
  const year = selectedMonth.value.getFullYear();
  const month = selectedMonth.value.getMonth() + 1;
  tempSelectedMonth.value = `${year}-${String(month).padStart(2, "0")}`;

  buildDayHeaders();
  await fetchMonthlyAttendance();
});

// Add these to your existing reactive state section
const calendarYear = ref(today.getFullYear());
const selectedCalendarMonth = ref(null);

// Add this computed property
const hasSelectedMonth = computed(() => selectedCalendarMonth.value !== null);

// Add this data
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

// Add these methods to your existing functions section

const navigateYear = (direction) => {
  const newYear = calendarYear.value + direction;

  // Ensure we don't go before 2025 or beyond current year
  if (newYear >= 2025 && newYear <= today.getFullYear()) {
    calendarYear.value = newYear;
  }
};

const selectMonth = (year, monthIndex) => {
  if (!isMonthDisabled(year, monthIndex)) {
    selectedCalendarMonth.value = { year, month: monthIndex };
  }
};

const isSelectedMonth = (year, monthIndex) => {
  return (
    selectedCalendarMonth.value?.year === year &&
    selectedCalendarMonth.value?.month === monthIndex
  );
};

const isCurrentMonth = (year, monthIndex) => {
  return year === today.getFullYear() && monthIndex === today.getMonth();
};

const isMonthDisabled = (year, monthIndex) => {
  const monthDate = new Date(year, monthIndex, 1);
  const maxDate = new Date(today.getFullYear(), today.getMonth(), 1);

  // Disable if month is in the future or before July 2025
  const minDate = new Date(2025, 6, 1); // July 2025
  return monthDate > maxDate || monthDate < minDate;
};

// Update the existing applyMonthSelection method
const applyMonthSelection = () => {
  if (selectedCalendarMonth.value) {
    const { year, month } = selectedCalendarMonth.value;
    selectedMonth.value = new Date(year, month, 1);
    showMonthPicker.value = false;
    buildDayHeaders();
    fetchMonthlyAttendance();

    // Reset selection for next time
    selectedCalendarMonth.value = null;
  }
};

// Add this method to your existing functions
const openMonthPicker = () => {
  // Initialize calendar with currently selected month when modal opens
  calendarYear.value = selectedMonth.value.getFullYear();
  selectedCalendarMonth.value = {
    year: selectedMonth.value.getFullYear(),
    month: selectedMonth.value.getMonth(),
  };
  showMonthPicker.value = true;
};

// Page metadata
useHead({
  title: "Monthly Attendance - Convise",
  meta: [
    {
      name: "description",
      content: "View and export monthly attendance reports for all employees.",
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

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-leave-active {
  transition: all 0.25s ease-in;
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
