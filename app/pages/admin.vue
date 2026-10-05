<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 text-gray-900 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
    <!-- Background Grid Pattern & Ambient Blobs matching Convise Dashboard -->
    <div class="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] bg-[size:75px_75px] pointer-events-none" />
    <div class="absolute top-20 left-20 w-80 h-80 bg-gradient-to-r from-emerald-400/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-2xl animate-blob pointer-events-none" />
    <div class="absolute top-48 right-20 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-2000 pointer-events-none" />
    <div class="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-4000 pointer-events-none" />

    <!-- Top Modern Navigation Bar -->
    <header class="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-gray-200/70 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Left: Logo & Admin Title -->
          <div class="flex items-center space-x-4">
            <button
              class="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none transition-colors"
              @click="isMobileMenuOpen = !isMobileMenuOpen"
            >
              <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
            </button>

            <NuxtLink to="/admin" class="flex items-center space-x-3 group">
              <div class="inline-flex items-center justify-center w-11 h-11 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/25 text-white transition-transform group-hover:scale-105">
                <UIcon name="i-heroicons-shield-check" class="w-6 h-6" />
              </div>
              <div class="flex flex-col">
                <div class="flex items-center space-x-2">
                  <span class="text-lg font-black tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                    Convise
                  </span>
                  <span class="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center gap-1 shadow-sm">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Admin
                  </span>
                </div>
                <span class="text-[11px] text-gray-500 font-medium">Control Center</span>
              </div>
            </NuxtLink>
          </div>

          <!-- Center: Breadcrumbs on desktop -->
          <div class="hidden md:flex items-center space-x-2 text-xs font-medium text-gray-500">
            <NuxtLink to="/dashboard" class="hover:text-emerald-600 transition-colors">Workspace</NuxtLink>
            <UIcon name="i-heroicons-chevron-right" class="w-3.5 h-3.5 text-gray-400" />
            <NuxtLink to="/admin" class="hover:text-emerald-600 transition-colors font-medium">Admin Center</NuxtLink>
            <template v-if="currentNavTitle">
              <UIcon name="i-heroicons-chevron-right" class="w-3.5 h-3.5 text-gray-400" />
              <span class="text-emerald-600 font-bold">{{ currentNavTitle }}</span>
            </template>
          </div>

          <!-- Right: Actions & User Info -->
          <div class="flex items-center space-x-3">
            <NuxtLink
              to="/admin/employees/new"
              class="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/25 transition-all active:scale-95"
            >
              <UIcon name="i-heroicons-user-plus" class="w-4 h-4" />
              <span>Onboard Staff</span>
            </NuxtLink>

            <NuxtLink
              to="/dashboard"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white/80 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 shadow-sm transition-colors"
            >
              <UIcon name="i-heroicons-arrow-left-on-rectangle" class="w-4 h-4 text-gray-500" />
              <span class="hidden sm:inline">Exit to Dashboard</span>
            </NuxtLink>

            <div class="flex items-center pl-2 border-l border-gray-200">
              <div class="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                {{ userProfileStore.userInitials }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Workspace Container -->
    <div class="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
      <!-- Desktop Sidebar Navigation -->
      <aside class="hidden lg:flex flex-col w-64 shrink-0 space-y-6">
        <!-- Fast Track Action Card -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-600 p-5 text-white shadow-xl shadow-emerald-500/20">
          <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
            <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5 text-yellow-300" />
            <span>Fast Track</span>
          </div>
          <h4 class="text-sm font-bold text-white mb-1">Add Team Member</h4>
          <p class="text-xs text-emerald-100/90 mb-4">Auto-provision credentials, work schedule & leave quotas in one submit.</p>
          <NuxtLink
            to="/admin/employees/new"
            class="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-all shadow-md active:scale-95"
          >
            <UIcon name="i-heroicons-user-plus" class="w-4 h-4 text-emerald-600" />
            <span>New Employee Wizard</span>
          </NuxtLink>
        </div>

        <!-- Navigation Links Card -->
        <nav class="space-y-1.5 bg-white/80 backdrop-blur-lg p-3 rounded-3xl border border-gray-200/70 shadow-xl">
          <div class="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400">
            System Modules
          </div>
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group',
              isCurrent(item.path)
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
            ]"
          >
            <div class="flex items-center gap-3">
              <UIcon
                :name="item.icon"
                :class="[
                  'w-4 h-4 transition-colors',
                  isCurrent(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-emerald-600'
                ]"
              />
              <span>{{ item.label }}</span>
            </div>
            <span
              v-if="item.badge"
              :class="[
                'text-[10px] px-2 py-0.5 rounded-full font-mono font-bold',
                isCurrent(item.path) ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              ]"
            >
              {{ item.badge }}
            </span>
          </NuxtLink>
        </nav>

      </aside>

      <!-- Mobile Slide-over Drawer -->
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 z-50 lg:hidden flex"
      >
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="isMobileMenuOpen = false" />
        <div class="relative w-72 max-w-xs bg-white border-r border-gray-200 p-5 flex flex-col space-y-4 shadow-2xl z-10">
          <div class="flex items-center justify-between pb-3 border-b border-gray-200">
            <span class="text-sm font-bold text-gray-900">Admin Modules</span>
            <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isMobileMenuOpen = false">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>

          <NuxtLink
            to="/admin/employees/new"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
            @click="isMobileMenuOpen = false"
          >
            <UIcon name="i-heroicons-user-plus" class="w-4 h-4" />
            <span>Onboard Staff</span>
          </NuxtLink>

          <nav class="space-y-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              :class="[
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium',
                isCurrent(item.path)
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              ]"
              @click="isMobileMenuOpen = false"
            >
              <UIcon :name="item.icon" class="w-4 h-4" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </nav>
        </div>
      </div>

      <!-- Main Content Page View -->
      <main class="flex-1 min-w-0">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useUserProfileStore } from "~/stores/userProfile";
import { useAdminStore } from "~/stores/admin";
import { useSystemConfigStore } from "~/stores/systemConfig";

definePageMeta({
  middleware: ["auth", "admin"],
});

const route = useRoute();
const supabase = useSupabaseClient();
const userProfileStore = useUserProfileStore();
const adminStore = useAdminStore();
const systemConfigStore = useSystemConfigStore();
const isMobileMenuOpen = ref(false);

interface AdminNavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
}

const navItems = computed<AdminNavItem[]>(() => {
  const items: AdminNavItem[] = [
    { label: "Overview", path: "/admin", icon: "i-heroicons-squares-2x2" },
    { label: "Employees", path: "/admin/employees", icon: "i-heroicons-users" },
    { label: "Attendance Control", path: "/admin/attendance", icon: "i-heroicons-clock" },
  ];

  // SPANCO Pipeline module toggle
  if (systemConfigStore.isSpancoEnabled) {
    items.push({ label: "SPANCO Pipeline", path: "/admin/spanco", icon: "i-heroicons-chart-pie" });
  }

  // Feasibility module toggle
  if (systemConfigStore.isFeasibilityEnabled) {
    items.push({ label: "Feasibility", path: "/admin/feasibility", icon: "i-heroicons-signal" });
  }

  items.push(
    { label: "Departments", path: "/admin/departments", icon: "i-heroicons-building-office-2" },
    { label: "Positions", path: "/admin/positions", icon: "i-heroicons-briefcase" },
    { label: "Work Schedules", path: "/admin/schedules", icon: "i-heroicons-map-pin" },
    { label: "Holidays", path: "/admin/holidays", icon: "i-heroicons-calendar" },
    { label: "Leave Management", path: "/admin/leaves", icon: "i-heroicons-clipboard-document-check" },
    { label: "Storage & Documents", path: "/admin/storage", icon: "i-heroicons-cloud-arrow-up" },
  );

  return items;
});

function isCurrent(path: string) {
  if (path === "/admin") {
    return route.path === "/admin";
  }
  return route.path.startsWith(path);
}

const currentNavTitle = computed(() => {
  const match = navItems.value.find((item) => isCurrent(item.path));
  return match && match.path !== "/admin" ? match.label : "";
});

// Guard against accessing disabled modules directly while within the admin workspace
watch(
  [() => route.path, () => systemConfigStore.isSpancoEnabled, () => systemConfigStore.isFeasibilityEnabled],
  ([path, spancoEnabled, feasEnabled]) => {
    if (!spancoEnabled && path.startsWith("/admin/spanco")) {
      navigateTo("/admin");
    }
    if (!feasEnabled && path.startsWith("/admin/feasibility")) {
      navigateTo("/admin");
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await systemConfigStore.fetchConfig(supabase);
  await adminStore.fetchMetadata();
  await adminStore.fetchEmployees();
});
</script>
