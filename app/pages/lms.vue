<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Background matching dashboard -->
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
      v-if="leadStore.isLoading && leadStore.leads.length === 0"
      class="relative min-h-screen flex items-center justify-center"
    >
      <div class="text-center">
        <div class="relative mb-6">
          <div
            class="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl blur-sm opacity-75"
          />
          <div
            class="relative bg-gradient-to-r from-amber-500 to-yellow-600 p-6 rounded-2xl"
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
          Loading Leads
        </h2>
        <p class="text-gray-600">Fetching your sales pipeline...</p>
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
                color="primary"
                class="bg-white/80 backdrop-blur-sm hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                @click="navigateTo('/dashboard')"
              >
                <UIcon
                  name="i-heroicons-arrow-left"
                  class="h-5 w-5 mr-2 text-gray-600"
                />
                <span class="text-gray-700">Back to Dashboard</span>
              </UButton>
              <div class="hidden sm:block">
                <h1
                  class="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                >
                  Lead Management System
                </h1>
                <p class="text-gray-600">SPANCO Sales Pipeline</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- Export Dropdown -->
              <UDropdownMenu :items="exportMenuItems">
                <UButton
                  size="sm"
                  variant="soft"
                  color="neutral"
                  :loading="exportLeads.isExporting.value"
                >
                  <UIcon
                    name="i-heroicons-arrow-down-tray"
                    class="h-4 w-4 mr-2"
                  />
                  Export
                  <UIcon name="i-heroicons-chevron-down" class="h-3 w-3 ml-1" />
                </UButton>
              </UDropdownMenu>
              <!-- Refresh Button -->
              <UButton
                size="sm"
                variant="soft"
                color="primary"
                :loading="leadStore.isLoading"
                @click="leadStore.refreshLeads()"
              >
                <UIcon name="i-heroicons-arrow-path" class="h-4 w-4 mr-2" />
                Refresh
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Summary Statistics Cards - Row 1: Status -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <!-- Total Leads -->
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 bg-blue-100 rounded-lg">
                <UIcon
                  name="i-heroicons-chart-pie"
                  class="h-6 w-6 text-blue-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Total Leads</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ leadStore.summary.total }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Active Leads -->
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 bg-green-100 rounded-lg">
                <UIcon
                  name="i-heroicons-check-circle"
                  class="h-6 w-6 text-green-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Active</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ leadStore.summary.byStatus.active || 0 }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Won Leads -->
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 bg-emerald-100 rounded-lg">
                <UIcon
                  name="i-heroicons-trophy"
                  class="h-6 w-6 text-emerald-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Won</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ leadStore.summary.byStatus.won || 0 }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Lost Leads -->
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 bg-red-100 rounded-lg">
                <UIcon
                  name="i-heroicons-x-circle"
                  class="h-6 w-6 text-red-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Lost</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ leadStore.summary.byStatus.lost || 0 }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- On Hold -->
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 bg-orange-100 rounded-lg">
                <UIcon
                  name="i-heroicons-pause-circle"
                  class="h-6 w-6 text-orange-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">On Hold</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ leadStore.summary.byStatus.on_hold || 0 }}
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- ✅ NEW: Summary Statistics Cards - Row 2: Timeline -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <!-- Overdue Leads -->
          <UCard
            class="bg-white/80 backdrop-blur-lg border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            @click="quickFilterByDate('overdue')"
          >
            <div class="flex items-center">
              <div class="p-3 bg-red-100 rounded-lg">
                <UIcon
                  name="i-heroicons-exclamation-triangle"
                  class="h-6 w-6 text-red-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Overdue</p>
                <p class="text-2xl font-bold text-red-600">
                  {{ leadStore.leadsByDateRange.overdue || 0 }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- This Week -->
          <UCard
            class="bg-white/80 backdrop-blur-lg border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            @click="quickFilterByDate('thisweek')"
          >
            <div class="flex items-center">
              <div class="p-3 bg-yellow-100 rounded-lg">
                <UIcon
                  name="i-heroicons-calendar-days"
                  class="h-6 w-6 text-yellow-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">This Week</p>
                <p class="text-2xl font-bold text-yellow-600">
                  {{ leadStore.leadsByDateRange.thisweek || 0 }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Next Week -->
          <UCard
            class="bg-white/80 backdrop-blur-lg border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            @click="quickFilterByDate('nextweek')"
          >
            <div class="flex items-center">
              <div class="p-3 bg-blue-100 rounded-lg">
                <UIcon
                  name="i-heroicons-calendar"
                  class="h-6 w-6 text-blue-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Next Week</p>
                <p class="text-2xl font-bold text-blue-600">
                  {{ leadStore.leadsByDateRange.nextweek || 0 }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- This Month -->
          <UCard
            class="bg-white/80 backdrop-blur-lg border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            @click="quickFilterByDate('thismonth')"
          >
            <div class="flex items-center">
              <div class="p-3 bg-green-100 rounded-lg">
                <UIcon
                  name="i-heroicons-calendar-date-range"
                  class="h-6 w-6 text-green-600"
                />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">This Month</p>
                <p class="text-2xl font-bold text-green-600">
                  {{ leadStore.leadsByDateRange.thismonth || 0 }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Later/No Date -->
          <UCard
            class="bg-white/80 backdrop-blur-lg border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            @click="quickFilterByDate('later')"
          >
            <div class="flex items-center">
              <div class="p-3 bg-gray-100 rounded-lg">
                <UIcon name="i-heroicons-clock" class="h-6 w-6 text-gray-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Later</p>
                <p class="text-2xl font-bold text-gray-600">
                  {{ leadStore.leadsByDateRange.later || 0 }}
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Tabs and Content -->
        <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-xl">
          <template #header>
            <UTabs
              v-model="selectedTab"
              :items="tabs"
              variant="link"
              color="primary"
              class="w-full"
              :ui="{
                list: 'bg-white/50 backdrop-blur-sm border-b border-gray-200',
                trigger:
                  'data-[state=active]:text-emerald-600 data-[state=active]:border-emerald-500',
              }"
            />
          </template>

          <!-- Tab Content -->
          <div class="p-4 bg-white">
            <!-- Activity Feed Tab -->
            <div v-if="selectedTab === 'activity'">
              <LmsActivityFeedTab />
            </div>

            <!-- Lead List Tab -->
            <div v-if="selectedTab === 'list'">
              <LmsLeadListTab />
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Lead Detail Modal -->
    <LmsLeadDetailModal />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const leadStore = useLeadStore();
const toast = useToast();
const exportLeads = useExportLeads();

// State - Use string value matching official docs
const selectedTab = ref("activity");

// Tabs configuration with value property (official API)
const tabs = [
  {
    value: "activity",
    label: "Activity Feed",
    icon: "i-heroicons-clock",
  },
  {
    value: "list",
    label: "Lead List",
    icon: "i-heroicons-list-bullet",
  },
];

// Export menu items
const exportMenuItems = [
  [
    {
      label: "Export All Leads",
      icon: "i-heroicons-cloud-arrow-down",
      onSelect: handleExportAll,
    },
    {
      label: "Export Current View",
      icon: "i-heroicons-funnel",
      onSelect: handleExportCurrentView,
    },
  ],
];

async function handleExportAll() {
  try {
    const count = await exportLeads.exportAllLeads();
    toast.add({
      title: "Export Complete",
      description: `Exported ${count} leads to Excel`,
      color: "success",
      icon: "i-heroicons-check-circle",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    toast.add({
      title: "Export Failed",
      description: error.message,
      color: "error",
    });
  }
}

function handleExportCurrentView() {
  const leads = leadStore.filteredLeads;
  if (leads.length === 0) {
    toast.add({
      title: "No Data",
      description: "No leads to export with current filters",
      color: "warning",
    });
    return;
  }
  const count = exportLeads.exportCurrentView(leads);
  toast.add({
    title: "Export Complete",
    description: `Exported ${count} leads to Excel`,
    color: "success",
    icon: "i-heroicons-check-circle",
  });
}

// ✅ NEW: Quick filter by date and switch to activity tab
function quickFilterByDate(dateFilter: DateFilterType) {
  leadStore.setDateFilter(dateFilter);
  selectedTab.value = "activity";

  // Show toast
  const label = DATE_FILTER_LABELS[dateFilter];
  toast.add({
    title: `Filtered by ${label}`,
    description: `Showing leads with ${label.toLowerCase()} closure dates`,
    color: "success",
    icon: DATE_FILTER_ICONS[dateFilter],
  });
}

// Initialize
onMounted(async () => {
  try {
    await leadStore.initialize();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error initializing LMS:", error);
    toast.add({
      title: "Error loading leads",
      description: error.message,
      color: "error",
    });
  }
});

// Meta
useHead({
  title: "Lead Management - Convise",
  meta: [
    {
      name: "description",
      content: "Manage your sales pipeline with SPANC0 methodology",
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
</style>
