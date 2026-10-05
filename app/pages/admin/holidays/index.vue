<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200/70">
      <div>
        <h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>Holiday Calendar & Scheduling</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
            {{ selectedYear }} Schedule
          </span>
        </h1>
        <p class="text-xs text-gray-500 mt-0.5">
          Publish company gazetted holidays, restricted options, and department-specific non-working dates.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Year Switcher -->
        <div class="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm text-xs">
          <button
            v-for="yr in availableYears"
            :key="yr"
            type="button"
            :class="[
              'px-3 py-1.5 rounded-lg font-mono font-bold transition-colors',
              selectedYear === yr ? 'bg-amber-500 text-white shadow' : 'text-gray-600 hover:text-gray-900'
            ]"
            @click="setYear(yr)"
          >
            {{ yr }}
          </button>
        </div>

        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all"
          @click="openCreateModal"
        >
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          <span>Add Holiday</span>
        </button>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Holidays in {{ selectedYear }}</div>
        <div class="text-2xl font-black text-gray-900 mt-1 font-mono">{{ holidays.length }}</div>
        <div class="text-[10px] text-gray-500 mt-0.5">Approved annual dates</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[11px] font-bold uppercase tracking-wider text-amber-700">Mandatory / Paid</div>
        <div class="text-2xl font-black text-amber-600 mt-1 font-mono">{{ mandatoryCount }}</div>
        <div class="text-[10px] text-gray-500 mt-0.5">Company-wide off</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[11px] font-bold uppercase tracking-wider text-teal-700">Restricted / Optional</div>
        <div class="text-2xl font-black text-teal-600 mt-1 font-mono">{{ optionalCount }}</div>
        <div class="text-[10px] text-gray-500 mt-0.5">Flexible choice days</div>
      </div>
      <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <div class="text-[11px] font-bold uppercase tracking-wider text-blue-700">Upcoming This Year</div>
        <div class="text-2xl font-black text-blue-600 mt-1 font-mono">{{ upcomingCount }}</div>
        <div class="text-[10px] text-gray-500 mt-0.5">Remaining in {{ selectedYear }}</div>
      </div>
    </div>

    <!-- Holidays List Table -->
    <div class="rounded-2xl border border-gray-200/70 bg-white/90 backdrop-blur-lg overflow-hidden shadow-xl">
      <div v-if="isLoading" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-3 animate-spin text-amber-600" />
        <p class="text-xs">Loading holiday calendar for {{ selectedYear }}...</p>
      </div>

      <div v-else-if="holidays.length === 0" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-calendar" class="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <h3 class="text-sm font-semibold text-gray-800">No holidays scheduled for {{ selectedYear }}</h3>
        <p class="text-xs text-gray-500 mt-1">Publish new holidays to populate the company attendance calendar.</p>
        <button
          class="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20"
          @click="openCreateModal"
        >
          Add First Holiday
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
              <th class="py-3.5 px-4">Date & Day</th>
              <th class="py-3.5 px-4">Holiday Title</th>
              <th class="py-3.5 px-4">Category</th>
              <th class="py-3.5 px-4">Applicability</th>
              <th class="py-3.5 px-4">Compensation</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="h in sortedHolidays"
              :key="h.id"
              class="hover:bg-amber-50/30 transition-colors group"
            >
              <!-- Date & Day -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center shrink-0">
                    <span class="text-[9px] uppercase font-bold text-amber-700">
                      {{ formatMonth(h.holiday_date) }}
                    </span>
                    <span class="text-base font-black text-gray-900 leading-none">
                      {{ formatDay(h.holiday_date) }}
                    </span>
                  </div>
                  <div>
                    <div class="font-bold text-gray-900">{{ formatFullDate(h.holiday_date) }}</div>
                    <div class="text-[10px] text-gray-500">{{ getDayName(h.holiday_date) }}</div>
                  </div>
                </div>
              </td>

              <!-- Title & Description -->
              <td class="py-3.5 px-4">
                <div class="font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
                  {{ h.title }}
                </div>
                <div v-if="h.description" class="text-[11px] text-gray-500 max-w-sm truncate mt-0.5">
                  {{ h.description }}
                </div>
              </td>

              <!-- Category -->
              <td class="py-3.5 px-4">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider capitalize',
                    h.is_optional
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  ]"
                >
                  {{ h.is_optional ? 'Optional' : h.holiday_type || 'Mandatory' }}
                </span>
              </td>

              <!-- Applicability -->
              <td class="py-3.5 px-4">
                <div v-if="!h.applicable_departments || h.applicable_departments.length === 0" class="text-gray-800 font-medium flex items-center gap-1.5">
                  <UIcon name="i-heroicons-globe-alt" class="w-3.5 h-3.5 text-blue-600" />
                  <span>All Company</span>
                </div>
                <div v-else class="text-[11px] text-gray-600 font-medium">
                  <span>{{ h.applicable_departments.length }} Departments</span>
                </div>
              </td>

              <!-- Compensation -->
              <td class="py-3.5 px-4">
                <span class="text-gray-800 font-mono text-[11px] capitalize">
                  {{ h.compensation_type || 'Paid' }}
                </span>
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5',
                    h.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  ]"
                >
                  <span :class="['w-1.5 h-1.5 rounded-full', h.is_active ? 'bg-emerald-500' : 'bg-red-500']" />
                  {{ h.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Edit Holiday"
                    @click="openEditModal(h)"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                  </button>

                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 transition-colors"
                    title="Delete Holiday"
                    @click="deleteHoliday(h)"
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

    <!-- ================= MODAL: CREATE / EDIT HOLIDAY ================= -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-xl bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 class="text-base font-bold text-gray-900">{{ isEditing ? 'Edit Holiday' : 'Add New Holiday' }}</h3>
            <p class="text-xs text-gray-500">{{ isEditing ? `Updating ${activeHoliday?.title}` : `Scheduling for calendar year ${selectedYear}` }}</p>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveHoliday" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Holiday Title -->
            <div class="space-y-1 sm:col-span-2">
              <label class="text-xs font-semibold text-gray-700">Holiday Title *</label>
              <input
                v-model="form.title"
                type="text"
                required
                placeholder="e.g. Diwali, Independence Day, Eid-ul-Fitr"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <!-- Date -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Holiday Date *</label>
              <input
                v-model="form.holiday_date"
                type="date"
                required
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none cursor-pointer [color-scheme:light]"
                @click="(e) => (e.target as HTMLInputElement).showPicker?.()"
              />
            </div>

            <!-- Holiday Type -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Holiday Classification</label>
              <select
                v-model="form.holiday_type"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
              >
                <option value="national">National Holiday</option>
                <option value="gazetted">Gazetted Public Holiday</option>
                <option value="restricted">Restricted / Optional Holiday</option>
                <option value="company">Company Special Off</option>
              </select>
            </div>

            <!-- Compensation Type -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Compensation</label>
              <select
                v-model="form.compensation_type"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
              >
                <option value="paid">Paid Off</option>
                <option value="unpaid">Unpaid Off</option>
              </select>
            </div>

            <!-- Optional Holiday Toggle -->
            <div class="flex items-center pt-5">
              <UCheckbox
                v-model="form.is_optional"
                color="primary"
                size="sm"
                :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
              >
                <template #label>
                  <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Restricted / Optional Day</span>
                </template>
              </UCheckbox>
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700">Description</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Significance and celebration notes..."
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <!-- Department Applicability Selection -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-900">Applicable Departments</span>
              <button
                type="button"
                class="text-[11px] text-amber-700 hover:text-amber-800 underline font-semibold"
                @click="form.all_departments = !form.all_departments"
              >
                {{ form.all_departments ? 'Select Specific Departments' : 'Apply to All Company' }}
              </button>
            </div>

            <div v-if="form.all_departments" class="text-[11px] text-gray-500 italic">
              Applies to all staff across all departments.
            </div>

            <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pt-2">
              <div
                v-for="d in adminStore.departments"
                :key="d.id"
                class="flex items-center gap-2 p-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-[11px] text-gray-800"
              >
                <UCheckbox
                  :model-value="Array.isArray(form.applicable_departments) && form.applicable_departments.includes(d.id)"
                  color="warning"
                  size="xs"
                  :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
                  @update:model-value="(checked: boolean | string) => {
                    if (!Array.isArray(form.applicable_departments)) form.applicable_departments = [];
                    if (checked) {
                      if (!form.applicable_departments.includes(d.id)) form.applicable_departments.push(d.id);
                    } else {
                      form.applicable_departments = form.applicable_departments.filter((id: number) => id !== d.id);
                    }
                  }"
                >
                  <template #label>
                    <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">{{ d.name }}</span>
                  </template>
                </UCheckbox>
              </div>
            </div>
          </div>

          <!-- Active Toggle -->
          <div class="flex items-center gap-2 pt-1">
            <UCheckbox
              v-model="form.is_active"
              color="primary"
              size="sm"
              :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
            >
              <template #label>
                <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Holiday is Active</span>
              </template>
            </UCheckbox>
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
              class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/25 disabled:opacity-50"
            >
              <UIcon v-if="isSaving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>{{ isEditing ? 'Update Holiday' : 'Save Holiday' }}</span>
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

interface HolidayItem {
  id: number;
  holiday_date: string;
  title: string;
  description: string | null;
  holiday_type: string;
  is_national: boolean;
  is_optional: boolean;
  is_active: boolean;
  applicable_departments: number[] | null;
  compensation_type: string;
  calendar_year: number;
}

const adminStore = useAdminStore();
const supabase = useSupabaseClient();

const currentYear = new Date().getFullYear();
const availableYears = [currentYear - 1, currentYear, currentYear + 1];
const selectedYear = ref(currentYear);

const holidays = ref<HolidayItem[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);

const isModalOpen = ref(false);
const isEditing = ref(false);
const activeHoliday = ref<HolidayItem | null>(null);

const form = ref({
  title: "",
  holiday_date: `${currentYear}-01-01`,
  holiday_type: "national",
  compensation_type: "paid",
  is_optional: false,
  description: "",
  all_departments: true,
  applicable_departments: [] as number[],
  is_active: true,
});

function setYear(yr: number) {
  selectedYear.value = yr;
  fetchHolidays();
}

async function fetchHolidays() {
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from("holidays")
      .select("*")
      .eq("calendar_year", selectedYear.value)
      .order("holiday_date", { ascending: true });

    if (error) throw error;
    holidays.value = (data as any) || [];
  } catch (err: any) {
    console.error("Failed to fetch holidays:", err);
  } finally {
    isLoading.value = false;
  }
}

const sortedHolidays = computed(() => {
  return [...holidays.value].sort(
    (a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime()
  );
});

const mandatoryCount = computed(() => holidays.value.filter((h) => !h.is_optional).length);
const optionalCount = computed(() => holidays.value.filter((h) => h.is_optional).length);
const upcomingCount = computed(() => {
  const today = new Date().toISOString().split("T")[0] || "";
  return holidays.value.filter((h) => h.holiday_date >= today).length;
});

function formatMonth(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("en-US", { month: "short" });
  } catch {
    return "JAN";
  }
}

function formatDay(dateStr: string): string {
  try {
    return new Date(dateStr).getDate().toString().padStart(2, "0");
  } catch {
    return "01";
  }
}

function formatFullDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getDayName(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
  } catch {
    return "";
  }
}

function openCreateModal() {
  isEditing.value = false;
  activeHoliday.value = null;
  form.value = {
    title: "",
    holiday_date: `${selectedYear.value}-08-15`,
    holiday_type: "national",
    compensation_type: "paid",
    is_optional: false,
    description: "",
    all_departments: true,
    applicable_departments: [],
    is_active: true,
  };
  isModalOpen.value = true;
}

function openEditModal(h: HolidayItem) {
  isEditing.value = true;
  activeHoliday.value = h;
  form.value = {
    title: h.title,
    holiday_date: h.holiday_date,
    holiday_type: h.holiday_type || "national",
    compensation_type: h.compensation_type || "paid",
    is_optional: h.is_optional,
    description: h.description || "",
    all_departments: !h.applicable_departments || h.applicable_departments.length === 0,
    applicable_departments: h.applicable_departments || [],
    is_active: h.is_active,
  };
  isModalOpen.value = true;
}

async function saveHoliday() {
  isSaving.value = true;

  try {
    const yr = new Date(form.value.holiday_date).getFullYear();
    const payload = {
      title: form.value.title,
      holiday_date: form.value.holiday_date,
      holiday_type: form.value.holiday_type,
      compensation_type: form.value.compensation_type,
      is_optional: form.value.is_optional,
      description: form.value.description || null,
      applicable_departments: form.value.all_departments ? null : form.value.applicable_departments,
      calendar_year: yr,
      is_active: form.value.is_active,
      updated_at: new Date().toISOString(),
    };

    if (isEditing.value && activeHoliday.value) {
      const { error } = await (supabase as any)
        .from("holidays")
        .update(payload)
        .eq("id", activeHoliday.value.id);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from("holidays").insert(payload);
      if (error) throw error;
    }

    await fetchHolidays();
    isModalOpen.value = false;
  } catch (err: any) {
    alert("Failed to save holiday: " + err.message);
  } finally {
    isSaving.value = false;
  }
}

async function deleteHoliday(h: HolidayItem) {
  if (!confirm(`Are you sure you want to delete holiday "${h.title}" on ${h.holiday_date}?`)) {
    return;
  }

  try {
    const { error } = await supabase.from("holidays").delete().eq("id", h.id);
    if (error) throw error;
    holidays.value = holidays.value.filter((item) => item.id !== h.id);
  } catch (err: any) {
    alert("Failed to delete holiday: " + err.message);
  }
}

onMounted(async () => {
  await adminStore.fetchMetadata();
  await fetchHolidays();
});
</script>
