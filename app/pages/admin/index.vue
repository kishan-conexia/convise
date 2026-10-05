<template>
  <div class="space-y-8">
    <!-- Hero / Welcome Banner matching Convise Dashboard Style -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-blue-600 to-purple-700 p-6 sm:p-8 text-white shadow-2xl">
      <!-- Watermark Background Icon -->
      <div class="absolute -right-6 -bottom-6 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div class="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:block opacity-20 pointer-events-none">
        <UIcon name="i-heroicons-shield-check" class="w-48 h-48 text-white" />
      </div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold shadow-sm">
            <UIcon name="i-heroicons-cpu-chip" class="w-4 h-4 text-emerald-200" />
            <span>Administrative Control Hub</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Administrative Control Center
          </h1>
          <p class="text-sm text-white/90 max-w-xl leading-relaxed">
            Centralized orchestration for employee onboarding, biometric & GPS attendance overrides, department structures, and leave policies.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <NuxtLink
            to="/admin/employees/new"
            class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-emerald-800 text-xs font-bold shadow-lg hover:bg-emerald-50 transition-all active:scale-95"
          >
            <UIcon name="i-heroicons-user-plus" class="w-4 h-4 text-emerald-600" />
            <span>Onboard Employee</span>
          </NuxtLink>

          <NuxtLink
            to="/admin/attendance"
            class="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold border border-white/30 transition-all"
          >
            <UIcon name="i-heroicons-clock" class="w-4 h-4 text-white" />
            <span>Attendance Monitor</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Live Metric KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- Total Employees -->
      <div class="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 p-5 shadow-lg hover:shadow-xl transition-all group">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Staff</span>
          <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <UIcon name="i-heroicons-users" class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-4 flex items-baseline justify-between">
          <span class="text-3xl font-black text-gray-900 font-mono">{{ stats.totalStaff }}</span>
          <span class="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {{ stats.activeStaff }} Active
          </span>
        </div>
      </div>

      <!-- Today's Attendance -->
      <div class="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 p-5 shadow-lg hover:shadow-xl transition-all group">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Today Punched In</span>
          <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-4 flex items-baseline justify-between">
          <span class="text-3xl font-black text-gray-900 font-mono">{{ stats.todayAttendance }}</span>
          <span class="text-xs text-gray-500 font-medium">
            {{ todayFormatted }}
          </span>
        </div>
      </div>

      <!-- Departments Count -->
      <div class="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 p-5 shadow-lg hover:shadow-xl transition-all group">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Departments</span>
          <div class="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
            <UIcon name="i-heroicons-building-office-2" class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-4 flex items-baseline justify-between">
          <span class="text-3xl font-black text-gray-900 font-mono">{{ stats.totalDepartments }}</span>
          <span class="text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            {{ stats.totalPositions }} Roles
          </span>
        </div>
      </div>

      <!-- Holidays -->
      <div class="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 p-5 shadow-lg hover:shadow-xl transition-all group">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Holidays Defined</span>
          <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
            <UIcon name="i-heroicons-calendar" class="w-5 h-5" />
          </div>
        </div>
        <div class="mt-4 flex items-baseline justify-between">
          <span class="text-3xl font-black text-gray-900 font-mono">{{ stats.totalHolidays }}</span>
          <span class="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-mono">
            {{ currentYear }} Calendar
          </span>
        </div>
      </div>
    </div>

    <!-- Management Modules Grid -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-bold text-gray-900">Control Modules</h2>
          <p class="text-xs text-gray-500">Select a section to manage operational parameters</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="mod in modules"
          :key="mod.path"
          :to="mod.path"
          class="group relative block"
        >
          <div
            :class="[
              'absolute -inset-0.5 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500',
              mod.glow
            ]"
          />
          <div class="relative h-full bg-white/85 backdrop-blur-lg border border-gray-200/70 shadow-lg group-hover:shadow-2xl rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group-hover:-translate-y-1">
            <div>
              <div class="flex items-center justify-between mb-4">
                <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center shadow-md', mod.iconBg]">
                  <UIcon :name="mod.icon" class="w-6 h-6" />
                </div>
                <UIcon name="i-heroicons-arrow-up-right" class="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <h3 class="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors mb-1.5">
                {{ mod.title }}
              </h3>
              <p class="text-xs text-gray-600 leading-relaxed">
                {{ mod.desc }}
              </p>
            </div>

            <div class="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
              <span class="text-gray-500 font-medium">{{ mod.stat }}</span>
              <span class="font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                <span>{{ mod.action }}</span>
                <UIcon name="i-heroicons-arrow-right" class="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAdminStore } from "~/stores/admin";
import { useSystemConfigStore } from "~/stores/systemConfig";

const adminStore = useAdminStore();
const systemConfigStore = useSystemConfigStore();
const supabase = useSupabaseClient();

const currentYear = new Date().getFullYear();
const todayFormatted = new Date().toLocaleDateString("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const stats = ref({
  totalStaff: 0,
  activeStaff: 0,
  todayAttendance: 0,
  totalDepartments: 0,
  totalPositions: 0,
  totalHolidays: 0,
});

const modules = computed(() => {
  const list = [
    {
      title: "Employee Directory",
      desc: "Search staff, edit contact profiles, reset credentials, and trigger single-submit onboarding.",
      icon: "i-heroicons-users",
      path: "/admin/employees",
      stat: "Staff Directory",
      action: "Manage",
      iconBg: "bg-blue-500 text-white shadow-blue-500/25",
      glow: "bg-gradient-to-r from-blue-500 to-indigo-500",
    },
    {
      title: "Attendance Control",
      desc: "Inspect daily punches, override punch in/out timestamps, adjust late minutes, and insert missing records.",
      icon: "i-heroicons-clock",
      path: "/admin/attendance",
      stat: "Biometrics & Overrides",
      action: "Review",
      iconBg: "bg-emerald-500 text-white shadow-emerald-500/25",
      glow: "bg-gradient-to-r from-emerald-500 to-teal-500",
    },
    {
      title: "Schedules & Geofencing",
      desc: "Configure shift hours, punch grace periods, office/home GPS coordinates, radius, and WFM permissions.",
      icon: "i-heroicons-map-pin",
      path: "/admin/schedules",
      stat: "GPS & Work Modes",
      action: "Configure",
      iconBg: "bg-teal-500 text-white shadow-teal-500/25",
      glow: "bg-gradient-to-r from-teal-500 to-cyan-500",
    },
    {
      title: "Departments",
      desc: "Create and edit organizational hierarchy, cost centers, shift models, and assign department managers.",
      icon: "i-heroicons-building-office-2",
      path: "/admin/departments",
      stat: "Org Hierarchy",
      action: "Structure",
      iconBg: "bg-purple-500 text-white shadow-purple-500/25",
      glow: "bg-gradient-to-r from-purple-500 to-pink-500",
    },
    {
      title: "Positions & Roles",
      desc: "Manage job designations, department mappings, career bands, and salary compensation brackets.",
      icon: "i-heroicons-briefcase",
      path: "/admin/positions",
      stat: "Role Catalog",
      action: "Explore",
      iconBg: "bg-indigo-500 text-white shadow-indigo-500/25",
      glow: "bg-gradient-to-r from-indigo-500 to-blue-500",
    },
    {
      title: "Holidays & Leaves",
      desc: "Set calendar holidays, configure leave category rules, and adjust employee annual quota balances.",
      icon: "i-heroicons-calendar-days",
      path: "/admin/leaves",
      stat: "Policies & Quotas",
      action: "Adjust",
      iconBg: "bg-amber-500 text-white shadow-amber-500/25",
      glow: "bg-gradient-to-r from-amber-500 to-orange-500",
    },
    {
      title: "Storage & Documents",
      desc: "Manage employee compliance files, review attachments, and browse secure document archives.",
      icon: "i-heroicons-cloud-arrow-up",
      path: "/admin/storage",
      stat: "Document Vault",
      action: "Browse",
      iconBg: "bg-teal-500 text-white shadow-teal-500/25",
      glow: "bg-gradient-to-r from-teal-500 to-emerald-500",
    },
  ];

  if (systemConfigStore.isSpancoEnabled) {
    list.push({
      title: "SPANCO Pipeline",
      desc: "Administer the end-to-end sales pipeline, reassign lead owners, override deal stages, and inspect conversion metrics.",
      icon: "i-heroicons-chart-pie",
      path: "/admin/spanco",
      stat: "Sales Funnel",
      action: "Orchestrate",
      iconBg: "bg-amber-500 text-white shadow-amber-500/25",
      glow: "bg-gradient-to-r from-amber-500 to-yellow-500",
    });
  }

  if (systemConfigStore.isFeasibilityEnabled) {
    list.push({
      title: "Feasibility Review",
      desc: "Evaluate technical reach, route surveys, POP connectivity, CAPEX/OPEX viability, and dispatch decisions.",
      icon: "i-heroicons-signal",
      path: "/admin/feasibility",
      stat: "Technical Eval",
      action: "Evaluate",
      iconBg: "bg-emerald-500 text-white shadow-emerald-500/25",
      glow: "bg-gradient-to-r from-emerald-500 to-teal-500",
    });
  }

  return list;
});

async function loadLiveStats() {
  const todayStr = getLocalDateString();

  stats.value.totalStaff = adminStore.employees.length;
  stats.value.activeStaff = adminStore.employees.filter((e) => e.is_active).length;
  stats.value.totalDepartments = adminStore.departments.length;
  stats.value.totalPositions = adminStore.positions.length;

  try {
    const [attRes, holRes] = await Promise.all([
      (supabase as any).from("attendance").select("id", { count: "exact", head: true }).eq("date", todayStr),
      (supabase as any).from("holidays").select("id", { count: "exact", head: true }).eq("calendar_year", currentYear),
    ]);

    stats.value.todayAttendance = attRes.count || 0;
    stats.value.totalHolidays = holRes.count || 0;
  } catch (err) {
    console.error("Failed to load dashboard live stats:", err);
  }
}

onMounted(async () => {
  await systemConfigStore.fetchConfig(supabase);
  await adminStore.fetchMetadata();
  await adminStore.fetchEmployees();
  await loadLiveStats();
});
</script>
