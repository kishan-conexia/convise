<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200/70">
      <div>
        <h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>Designations & Positions</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
            {{ adminStore.positions.length }} Roles
          </span>
        </h1>
        <p class="text-xs text-gray-500 mt-0.5">
          Define job roles, career levels, salary compensation bands, and link them to operational departments.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="p-2.5 rounded-xl bg-white/80 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm transition-colors"
          title="Refresh positions"
          @click="refreshPositions"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            :class="['w-4 h-4', isRefreshing ? 'animate-spin text-blue-600' : '']"
          />
        </button>

        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all"
          @click="openCreateModal"
        >
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          <span>New Position</span>
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
          placeholder="Search designation, code, job family..."
          class="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-blue-500"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
        <!-- Department Filter -->
        <select
          v-model="selectedDepartment"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Departments</option>
          <option v-for="d in adminStore.departments" :key="d.id" :value="d.id">
            {{ d.name }}
          </option>
        </select>

        <!-- Status Filter -->
        <select
          v-model="selectedStatus"
          class="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>
      </div>
    </div>

    <!-- Positions Table -->
    <div class="rounded-2xl border border-gray-200/70 bg-white/90 backdrop-blur-lg overflow-hidden shadow-xl">
      <div v-if="adminStore.isMetadataLoading" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-3 animate-spin text-blue-600" />
        <p class="text-xs">Loading designations...</p>
      </div>

      <div v-else-if="filteredPositions.length === 0" class="p-12 text-center text-gray-500">
        <UIcon name="i-heroicons-briefcase" class="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <h3 class="text-sm font-semibold text-gray-800">No designations found</h3>
        <p class="text-xs text-gray-500 mt-1">Try resetting your search query or add a new position.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
              <th class="py-3.5 px-4">Designation</th>
              <th class="py-3.5 px-4">Role Code</th>
              <th class="py-3.5 px-4">Primary Department</th>
              <th class="py-3.5 px-4">Job Family / Level</th>
              <th class="py-3.5 px-4">Salary Bracket (Annual)</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="pos in filteredPositions"
              :key="pos.id"
              class="hover:bg-blue-50/30 transition-colors group"
            >
              <!-- Designation -->
              <td class="py-3.5 px-4">
                <div class="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {{ pos.designation || 'Untitled Position' }}
                </div>
                <div v-if="pos.description" class="text-[11px] text-gray-500 max-w-sm truncate">
                  {{ pos.description }}
                </div>
              </td>

              <!-- Code -->
              <td class="py-3.5 px-4">
                <span class="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                  {{ pos.code || `POS-${pos.id}` }}
                </span>
              </td>

              <!-- Primary Department -->
              <td class="py-3.5 px-4">
                <div class="font-medium text-gray-800">
                  {{ adminStore.getDepartmentName(pos.main_department_id) }}
                </div>
              </td>

              <!-- Job Family & Level -->
              <td class="py-3.5 px-4">
                <div class="font-medium text-gray-800 capitalize">
                  {{ pos.job_family || 'General' }}
                </div>
                <div class="text-[10px] text-gray-500">
                  Level: <span class="font-mono font-bold text-gray-700">{{ pos.level || 'Standard' }}</span>
                </div>
              </td>

              <!-- Salary Range -->
              <td class="py-3.5 px-4">
                <div v-if="pos.min_salary || pos.max_salary" class="font-mono font-medium text-gray-900">
                  ₹{{ Number(pos.min_salary || 0).toLocaleString('en-IN') }} - ₹{{ Number(pos.max_salary || 0).toLocaleString('en-IN') }}
                </div>
                <span v-else class="text-gray-400 italic">Not defined</span>
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5',
                    pos.is_active !== false
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  ]"
                >
                  <span :class="['w-1.5 h-1.5 rounded-full', pos.is_active !== false ? 'bg-emerald-500' : 'bg-red-500']" />
                  {{ pos.is_active !== false ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Edit Designation"
                    @click="openEditModal(pos)"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                  </button>

                  <button
                    class="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-colors"
                    :title="pos.is_active !== false ? 'Deactivate' : 'Activate'"
                    @click="togglePosStatus(pos)"
                  >
                    <UIcon :name="pos.is_active !== false ? 'i-heroicons-no-symbol' : 'i-heroicons-check-circle'" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= MODAL: CREATE / EDIT POSITION ================= -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-xl bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 class="text-base font-bold text-gray-900">{{ isEditing ? 'Edit Designation' : 'Create New Position' }}</h3>
            <p class="text-xs text-gray-500">{{ isEditing ? `Editing ${activePos?.designation}` : 'Add a role to the organization catalog' }}</p>
          </div>
          <button class="p-1 rounded-lg text-gray-400 hover:text-gray-700" @click="isModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="savePosition" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Designation Title -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Designation Title *</label>
              <input
                v-model="form.designation"
                type="text"
                required
                placeholder="e.g. Senior Software Engineer"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <!-- Code -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Position Code *</label>
              <input
                v-model="form.code"
                type="text"
                required
                placeholder="e.g. ENG-SR-01"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none font-mono uppercase"
              />
            </div>

            <!-- Primary Department -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Primary Department</label>
              <select
                v-model="form.main_department_id"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                <option :value="null">Unassigned</option>
                <option v-for="d in adminStore.departments" :key="d.id" :value="d.id">
                  {{ d.name }}
                </option>
              </select>
            </div>

            <!-- Job Family -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Job Family</label>
              <input
                v-model="form.job_family"
                type="text"
                placeholder="e.g. Engineering, Sales, Operations"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <!-- Level -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Career Level</label>
              <select
                v-model="form.level"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Associate">Associate (L1)</option>
                <option value="Intermediate">Intermediate (L2)</option>
                <option value="Senior">Senior (L3)</option>
                <option value="Lead">Team Lead (L4)</option>
                <option value="Manager">Manager (M1)</option>
                <option value="Director">Director / Head (D1)</option>
                <option value="Executive">Executive / VP (E1)</option>
              </select>
            </div>

            <!-- Salary Range -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Min Salary (Annual ₹)</label>
              <input
                v-model.number="form.min_salary"
                type="number"
                step="10000"
                min="0"
                placeholder="e.g. 500000"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-700">Max Salary (Annual ₹)</label>
              <input
                v-model.number="form.max_salary"
                type="number"
                step="10000"
                min="0"
                placeholder="e.g. 1200000"
                class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700">Job Description / Responsibilities</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Key responsibilities and expectations..."
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
            />
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
                <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Position is Active</span>
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
              class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/25 disabled:opacity-50"
            >
              <UIcon v-if="isSaving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>{{ isEditing ? 'Update Position' : 'Create Position' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAdminStore, type AdminPosition } from "~/stores/admin";

const adminStore = useAdminStore();
const supabase = useSupabaseClient();

const searchQuery = ref("");
const selectedDepartment = ref<number | "ALL">("ALL");
const selectedStatus = ref("ALL");
const isRefreshing = ref(false);

const isModalOpen = ref(false);
const isEditing = ref(false);
const activePos = ref<AdminPosition | null>(null);
const isSaving = ref(false);

const form = ref({
  designation: "",
  code: "",
  main_department_id: null as number | null,
  job_family: "Engineering",
  level: "Senior",
  min_salary: 0,
  max_salary: 0,
  description: "",
  is_active: true,
});

const filteredPositions = computed(() => {
  return adminStore.positions.filter((pos) => {
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const des = (pos.designation || "").toLowerCase();
      const code = (pos.code || "").toLowerCase();
      const family = (pos.job_family || "").toLowerCase();
      if (!des.includes(q) && !code.includes(q) && !family.includes(q)) {
        return false;
      }
    }

    if (selectedDepartment.value !== "ALL" && pos.main_department_id !== selectedDepartment.value) {
      return false;
    }

    if (selectedStatus.value === "ACTIVE" && pos.is_active === false) return false;
    if (selectedStatus.value === "INACTIVE" && pos.is_active !== false) return false;

    return true;
  });
});

async function refreshPositions() {
  isRefreshing.value = true;
  await adminStore.fetchMetadata(true);
  isRefreshing.value = false;
}

function openCreateModal() {
  isEditing.value = false;
  activePos.value = null;
  form.value = {
    designation: "",
    code: "",
    main_department_id: adminStore.departments[0]?.id || null,
    job_family: "Operations",
    level: "Intermediate",
    min_salary: 350000,
    max_salary: 600000,
    description: "",
    is_active: true,
  };
  isModalOpen.value = true;
}

function openEditModal(pos: AdminPosition) {
  isEditing.value = true;
  activePos.value = pos;
  form.value = {
    designation: pos.designation || "",
    code: pos.code || "",
    main_department_id: pos.main_department_id,
    job_family: pos.job_family || "General",
    level: pos.level || "Standard",
    min_salary: pos.min_salary || 0,
    max_salary: pos.max_salary || 0,
    description: pos.description || "",
    is_active: pos.is_active !== false,
  };
  isModalOpen.value = true;
}

async function savePosition() {
  isSaving.value = true;

  try {
    const payload = {
      designation: form.value.designation,
      code: form.value.code.toUpperCase(),
      main_department_id: form.value.main_department_id,
      job_family: form.value.job_family,
      level: form.value.level,
      min_salary: form.value.min_salary,
      max_salary: form.value.max_salary,
      description: form.value.description || null,
      is_active: form.value.is_active,
    };

    if (isEditing.value && activePos.value) {
      const { error } = await (supabase as any)
        .from("positions")
        .update(payload)
        .eq("id", activePos.value.id);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from("positions").insert(payload);
      if (error) throw error;
    }

    await adminStore.fetchMetadata(true);
    isModalOpen.value = false;
  } catch (err: any) {
    alert("Failed to save designation: " + err.message);
  } finally {
    isSaving.value = false;
  }
}

async function togglePosStatus(pos: AdminPosition) {
  const newStatus = pos.is_active === false;
  if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} "${pos.designation}"?`)) {
    return;
  }

  try {
    const { error } = await (supabase as any)
      .from("positions")
      .update({ is_active: newStatus })
      .eq("id", pos.id);
    if (error) throw error;
    pos.is_active = newStatus;
  } catch (err: any) {
    alert("Failed to update status: " + err.message);
  }
}

onMounted(async () => {
  await adminStore.fetchMetadata();
});
</script>
