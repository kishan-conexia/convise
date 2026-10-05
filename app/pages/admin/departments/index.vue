<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200/70">
      <div>
        <h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>Department Management</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
            {{ adminStore.departments.length }} Units
          </span>
        </h1>
        <p class="text-xs text-gray-500 mt-0.5">
          Configure organizational hierarchy, cost centers, shift structures, and assign department managers.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="p-2.5 rounded-xl bg-white/80 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm transition-colors"
          title="Refresh departments"
          @click="refreshDepartments"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            :class="['w-4 h-4', isRefreshing ? 'animate-spin text-purple-600' : '']"
          />
        </button>

        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/25 active:scale-95 transition-all"
          @click="openCreateModal"
        >
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          <span>New Department</span>
        </button>
      </div>
    </div>

    <!-- Search & Filters Toolbar -->
    <div class="p-4 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200/70 shadow-md flex flex-col md:flex-row gap-3 items-center justify-between">
      <div class="relative w-full md:w-80">
        <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search name, code, cost center..."
          class="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-purple-500"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
        <select
          v-model="selectedType"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-purple-500"
        >
          <option value="ALL">All Types</option>
          <option value="operational">Operational</option>
          <option value="support">Support</option>
          <option value="executive">Executive</option>
        </select>

        <select
          v-model="selectedShift"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-purple-500"
        >
          <option value="ALL">All Shifts</option>
          <option value="business_hours">Business Hours</option>
          <option value="rotational">Rotational</option>
          <option value="24x7">24x7</option>
        </select>

        <select
          v-model="selectedStatus"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-purple-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>
      </div>
    </div>

    <!-- Departments Table -->
    <div class="rounded-2xl border border-gray-200/70 bg-white/90 backdrop-blur-lg overflow-hidden shadow-xl">
      <div v-if="adminStore.isMetadataLoading" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-3 animate-spin text-purple-600" />
        <p class="text-xs">Loading department hierarchy...</p>
      </div>

      <div v-else-if="filteredDepartments.length === 0" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-building-office-2" class="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <h3 class="text-sm font-semibold text-gray-800">No departments match your filters</h3>
        <p class="text-xs text-gray-500 mt-1">Try resetting your search query.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
              <th class="py-3.5 px-4">Department</th>
              <th class="py-3.5 px-4">Code / ID</th>
              <th class="py-3.5 px-4">Hierarchy (Parent)</th>
              <th class="py-3.5 px-4">Manager</th>
              <th class="py-3.5 px-4">Cost Center / Shift</th>
              <th class="py-3.5 px-4">Budget / Headcount</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="dept in filteredDepartments"
              :key="dept.id"
              class="hover:bg-purple-50/30 transition-colors group"
            >
              <!-- Name & Type -->
              <td class="py-3.5 px-4">
                <div class="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                  {{ dept.name }}
                </div>
                <div class="text-[10px] text-gray-500 capitalize flex items-center gap-1.5 mt-0.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span>{{ dept.department_type }}</span>
                  <span v-if="dept.service_area" class="text-gray-400">({{ dept.service_area }})</span>
                </div>
              </td>

              <!-- Code & ID -->
              <td class="py-3.5 px-4">
                <span class="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                  {{ dept.code }}
                </span>
                <div class="text-[10px] text-gray-400 font-mono mt-0.5">ID: #{{ dept.id }}</div>
              </td>

              <!-- Parent Dept / Level -->
              <td class="py-3.5 px-4">
                <div v-if="dept.parent_id" class="text-gray-800 font-medium">
                  {{ adminStore.getDepartmentName(dept.parent_id) }}
                </div>
                <div v-else class="text-gray-400 italic">Top Level Entity</div>
                <div class="text-[10px] text-gray-500">Level {{ dept.level }}</div>
              </td>

              <!-- Manager -->
              <td class="py-3.5 px-4">
                <div v-if="dept.manager" class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-lg bg-gray-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                    {{ getInitials(dept.manager.full_name || dept.manager.email) }}
                  </div>
                  <div class="min-w-0">
                    <div class="font-medium text-gray-900 truncate">{{ dept.manager.full_name || 'Staff' }}</div>
                    <div class="text-[10px] text-gray-500 truncate">{{ dept.manager.email }}</div>
                  </div>
                </div>
                <span v-else class="text-gray-400 italic">No manager assigned</span>
              </td>

              <!-- Cost Center & Shift -->
              <td class="py-3.5 px-4">
                <div class="font-mono text-gray-800 font-medium text-[11px]">{{ dept.cost_center }}</div>
                <div class="text-[10px] text-gray-500 capitalize">{{ formatShiftName(dept.shift_type) }}</div>
              </td>

              <!-- Budget & Headcount -->
              <td class="py-3.5 px-4">
                <div class="font-mono font-medium text-gray-900">
                  {{ dept.annual_budget ? `₹${Number(dept.annual_budget).toLocaleString('en-IN')}` : '₹0' }}
                </div>
                <div class="text-[10px] text-gray-500">
                  Max: {{ dept.max_headcount || 'Uncapped' }} pax
                </div>
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5',
                    dept.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  ]"
                >
                  <span :class="['w-1.5 h-1.5 rounded-full', dept.is_active ? 'bg-emerald-500' : 'bg-red-500']" />
                  {{ dept.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Edit Department"
                    @click="openEditModal(dept)"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                  </button>

                  <button
                    v-if="dept.parent_id"
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 transition-colors"
                    :title="dept.is_active ? 'Deactivate' : 'Activate'"
                    @click="toggleDeptStatus(dept)"
                  >
                    <UIcon :name="dept.is_active ? 'i-heroicons-no-symbol' : 'i-heroicons-check-circle'" class="w-4 h-4" />
                  </button>
                  <button
                    v-else
                    disabled
                    class="p-1.5 rounded-lg bg-gray-50 text-gray-300 cursor-not-allowed"
                    title="Top Level Entity cannot be deactivated from the web portal"
                  >
                    <UIcon name="i-heroicons-lock-closed" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= MODAL: CREATE / EDIT DEPARTMENT ================= -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 class="text-base font-bold text-gray-900">{{ isEditing ? 'Edit Department' : 'Create New Department' }}</h3>
            <p class="text-xs text-gray-500">{{ isEditing ? `Updating ${activeDept?.name}` : 'Set up a new organizational unit' }}</p>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveDepartment" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Name -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Department Name *</label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="e.g. Talent Acquisition"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <!-- Code -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Department Code *</label>
              <input
                v-model="form.code"
                type="text"
                required
                placeholder="e.g. TA"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-purple-500 focus:outline-none font-mono uppercase"
              />
            </div>

            <!-- Parent Dept -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-gray-700">Parent Department</label>
                <span v-if="isEditing && !activeDept?.parent_id" class="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <UIcon name="i-heroicons-lock-closed" class="w-3.5 h-3.5 text-amber-500" />
                  Locked for Top Level Entity
                </span>
              </div>
              <select
                v-model="form.parent_id"
                :disabled="isEditing && !activeDept?.parent_id"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-purple-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-200"
              >
                <option :value="null">None (Top Level Entity)</option>
                <option
                  v-for="d in adminStore.departments"
                  :key="d.id"
                  :value="d.id"
                  :disabled="isEditing && activeDept?.id === d.id"
                >
                  {{ d.name }} ({{ d.code }})
                </option>
              </select>
              <p v-if="isEditing && !activeDept?.parent_id" class="text-[11px] text-gray-400">
                Top Level Entity parent hierarchy cannot be modified here. Configure directly in the Supabase UI.
              </p>
            </div>

            <!-- Manager -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-gray-700">Department Manager</label>
                <span v-if="!form.parent_id" class="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <UIcon name="i-heroicons-lock-closed" class="w-3.5 h-3.5 text-amber-500" />
                  Locked for Top Level Entity
                </span>
              </div>
              <select
                v-model="form.manager_id"
                :disabled="!form.parent_id"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-purple-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-200"
              >
                <option :value="null">No Manager Assigned</option>
                <option v-for="emp in adminStore.employees" :key="emp.id" :value="emp.id">
                  {{ emp.full_name || emp.email }}
                </option>
              </select>
              <p v-if="!form.parent_id" class="text-[11px] text-gray-400">
                Top Level Entity managers cannot be modified here. Configure directly in the Supabase UI.
              </p>
            </div>

            <!-- Department Type -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Department Type *</label>
              <select
                v-model="form.department_type"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-purple-500 focus:outline-none"
              >
                <option value="operational">Operational</option>
                <option value="support">Support</option>
                <option value="executive">Executive</option>
                <option value="technical">Technical</option>
                <option value="customer_facing">Customer Facing</option>
              </select>
            </div>

            <!-- Shift Type -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Shift Type *</label>
              <select
                v-model="form.shift_type"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-purple-500 focus:outline-none"
              >
                <option value="business_hours">Business Hours</option>
                <option value="rotating_shifts">Rotating Shifts</option>
                <option value="24x7">24x7</option>
                <option value="field_work">Field Work</option>
              </select>
            </div>

            <!-- Cost Center -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Cost Center Code *</label>
              <input
                v-model="form.cost_center"
                type="text"
                required
                placeholder="e.g. CC-HR-01"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-purple-500 focus:outline-none font-mono"
              />
            </div>

            <!-- Annual Budget -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Annual Budget (INR)</label>
              <input
                v-model.number="form.annual_budget"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-purple-500 focus:outline-none font-mono"
              />
            </div>

            <!-- Max Headcount -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Max Headcount</label>
              <input
                v-model.number="form.max_headcount"
                type="number"
                min="1"
                placeholder="e.g. 25"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <!-- Service Area -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Service Area</label>
              <input
                v-model="form.service_area"
                type="text"
                placeholder="e.g. Delhi NCR / Nationwide"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700">Description</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Scope of work and duties..."
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <!-- Active Toggle -->
          <div class="flex items-center gap-2 pt-1">
            <UCheckbox
              v-model="form.is_active"
              :disabled="!form.parent_id"
              color="primary"
              size="sm"
              :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer' }"
            >
              <template #label>
                <span class="text-xs font-semibold text-gray-900 select-none">Department is Active</span>
              </template>
            </UCheckbox>
            <span v-if="!form.parent_id" class="text-[10px] text-amber-600 font-medium flex items-center gap-1">
              <UIcon name="i-heroicons-lock-closed" class="w-3.5 h-3.5 text-amber-500" />
              Locked for Top Level Entity
            </span>
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
              class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-500/25 disabled:opacity-50"
            >
              <UIcon v-if="isSaving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>{{ isEditing ? 'Update Department' : 'Create Department' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useAdminStore, type AdminDepartment } from "~/stores/admin";

const adminStore = useAdminStore();
const supabase = useSupabaseClient();

const searchQuery = ref("");
const selectedType = ref("ALL");
const selectedShift = ref("ALL");
const selectedStatus = ref("ALL");
const isRefreshing = ref(false);

const isModalOpen = ref(false);
const isEditing = ref(false);
const activeDept = ref<AdminDepartment | null>(null);
const isSaving = ref(false);

const form = ref({
  name: "",
  code: "",
  parent_id: null as number | null,
  manager_id: null as string | null,
  department_type: "operational",
  shift_type: "business_hours",
  cost_center: "",
  annual_budget: 0,
  max_headcount: 20,
  service_area: "",
  description: "",
  is_active: true,
});

const filteredDepartments = computed(() => {
  return adminStore.departments.filter((d) => {
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const name = d.name.toLowerCase();
      const code = d.code.toLowerCase();
      const cc = (d.cost_center || "").toLowerCase();
      if (!name.includes(q) && !code.includes(q) && !cc.includes(q)) {
        return false;
      }
    }

    if (selectedType.value !== "ALL" && d.department_type !== selectedType.value) {
      return false;
    }

    if (selectedShift.value !== "ALL" && d.shift_type !== selectedShift.value) {
      return false;
    }

    if (selectedStatus.value === "ACTIVE" && !d.is_active) return false;
    if (selectedStatus.value === "INACTIVE" && d.is_active) return false;

    return true;
  });
});

function getInitials(name: string): string {
  if (!name) return "MG";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatShiftName(shift: string): string {
  if (shift === "business_hours") return "Business Hours (9-6)";
  if (shift === "rotational") return "Rotational Shift";
  if (shift === "24x7") return "24x7 Operations";
  return shift;
}

async function refreshDepartments() {
  isRefreshing.value = true;
  await adminStore.fetchMetadata(true);
  isRefreshing.value = false;
}

function openCreateModal() {
  isEditing.value = false;
  activeDept.value = null;
  form.value = {
    name: "",
    code: "",
    parent_id: null,
    manager_id: null,
    department_type: "operational",
    shift_type: "business_hours",
    cost_center: `CC-${Math.floor(100 + Math.random() * 900)}`,
    annual_budget: 0,
    max_headcount: 10,
    service_area: "Delhi NCR",
    description: "",
    is_active: true,
  };
  isModalOpen.value = true;
}

function openEditModal(dept: AdminDepartment) {
  isEditing.value = true;
  activeDept.value = dept;
  form.value = {
    name: dept.name,
    code: dept.code,
    parent_id: dept.parent_id,
    manager_id: dept.manager_id,
    department_type: dept.department_type,
    shift_type: dept.shift_type,
    cost_center: dept.cost_center,
    annual_budget: dept.annual_budget || 0,
    max_headcount: dept.max_headcount || 10,
    service_area: dept.service_area || "",
    description: dept.description || "",
    is_active: dept.is_active,
  };
  isModalOpen.value = true;
}

watch(
  () => form.value.parent_id,
  (newParentId) => {
    if (!newParentId) {
      form.value.manager_id = isEditing.value && activeDept.value ? (activeDept.value.manager_id ?? null) : null;
    }
  }
);

async function saveDepartment() {
  isSaving.value = true;

  try {
    const isTopLevel = (isEditing.value && !activeDept.value?.parent_id) || !form.value.parent_id;
    const finalParentId = (isEditing.value && !activeDept.value?.parent_id) ? null : form.value.parent_id;
    const finalManagerId = isTopLevel
      ? (isEditing.value && activeDept.value ? (activeDept.value.manager_id ?? null) : null)
      : form.value.manager_id;
    const finalIsActive = isTopLevel
      ? (isEditing.value && activeDept.value ? activeDept.value.is_active : true)
      : form.value.is_active;

    const payload = {
      name: form.value.name,
      code: form.value.code.toUpperCase(),
      parent_id: finalParentId,
      manager_id: finalManagerId,
      department_type: form.value.department_type,
      shift_type: form.value.shift_type,
      cost_center: form.value.cost_center,
      annual_budget: form.value.annual_budget,
      max_headcount: form.value.max_headcount,
      service_area: form.value.service_area || null,
      description: form.value.description || null,
      is_active: finalIsActive,
      updated_at: new Date().toISOString(),
    };

    if (isEditing.value && activeDept.value) {
      const { error } = await (supabase as any)
        .from("departments")
        .update(payload)
        .eq("id", activeDept.value.id);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from("departments").insert({
        ...payload,
        level: form.value.parent_id ? 2 : 1,
        effective_from: new Date().toISOString().split("T")[0],
      });
      if (error) throw error;
    }

    await adminStore.fetchMetadata(true);
    isModalOpen.value = false;
  } catch (err: any) {
    alert("Failed to save department: " + err.message);
  } finally {
    isSaving.value = false;
  }
}

async function toggleDeptStatus(dept: AdminDepartment) {
  if (!dept.parent_id) {
    alert("Top Level Entity cannot be deactivated from the web portal. Please configure directly in the Supabase UI.");
    return;
  }

  const newStatus = !dept.is_active;
  if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} department "${dept.name}"?`)) {
    return;
  }

  try {
    const { error } = await (supabase as any)
      .from("departments")
      .update({ is_active: newStatus, updated_at: new Date().toISOString() })
      .eq("id", dept.id);
    if (error) throw error;
    dept.is_active = newStatus;
  } catch (err: any) {
    alert("Failed to update status: " + err.message);
  }
}

onMounted(async () => {
  await adminStore.fetchMetadata();
  await adminStore.fetchEmployees();
});
</script>
