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
          Loading Department
        </h2>
        <p class="text-gray-600">Fetching department information...</p>
      </div>
    </div>

    <!-- Main Department Page -->
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
                @click="$router.push('/dashboard')"
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
                  Department Management
                </h1>
                <p class="text-gray-600">
                  Manage your team and department structure
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Department Selector (if multiple departments) -->
      <div
        v-if="managedDepartments.length > 1"
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
      >
        <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
          <div class="flex items-center space-x-4">
            <label class="text-sm font-medium text-gray-700">
              {{
                managedDepartments.length > 1
                  ? "Select Department:"
                  : "Current Department:"
              }}
            </label>

            <!-- Native select dropdown - like Flutter DropdownButton -->
            <div
              v-if="managedDepartments.length > 1"
              class="relative min-w-[300px]"
            >
              <select
                v-model="selectedDepartmentId"
                :class="[
                  'w-full pl-3 pr-10 py-2.5 text-base text-gray-900 bg-white rounded-xl focus:outline-none transition-all duration-200',
                  'border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
                  'appearance-none cursor-pointer',
                ]"
                @change="onDepartmentChange"
              >
                <option value="" disabled>Choose department...</option>
                <option
                  v-for="dept in managedDepartments"
                  :key="dept.id"
                  :value="dept.id.toString()"
                >
                  {{ dept.name }} ({{ dept.code || "N/A" }})
                </option>
              </select>
              <!-- Custom dropdown arrow -->
              <UIcon
                name="i-heroicons-chevron-down"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
              />
            </div>

            <!-- Show current department name if only one -->
            <div
              v-else
              class="min-w-[300px] px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200"
            >
              <span class="font-medium text-gray-900">{{
                selectedDepartment?.name || "Loading..."
              }}</span>
              <span class="text-sm text-gray-500 ml-2"
                >({{ selectedDepartment?.code || "" }})</span
              >
            </div>
          </div>
        </UCard>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Department Overview -->
        <div v-if="selectedDepartment" class="mb-8">
          <div class="relative">
            <div
              class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-20"
            />
            <UCard
              class="relative bg-white/80 backdrop-blur-lg border-0 shadow-2xl rounded-2xl overflow-hidden"
            >
              <div
                class="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 p-6 text-white"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-2xl font-bold mb-2">
                      {{ selectedDepartment.name }}
                    </h2>
                    <div class="space-y-1">
                      <p class="text-blue-100 flex items-center">
                        <UIcon
                          name="i-heroicons-hashtag"
                          class="h-4 w-4 mr-2"
                        />
                        Code: {{ selectedDepartment.code || "N/A" }}
                      </p>
                      <p class="text-blue-100 flex items-center">
                        <UIcon
                          name="i-heroicons-chart-bar-square"
                          class="h-4 w-4 mr-2"
                        />
                        Level: {{ selectedDepartment.level || 1 }}
                      </p>
                      <p class="text-blue-100 flex items-center">
                        <UIcon name="i-heroicons-users" class="h-4 w-4 mr-2" />
                        {{ employees.length }} Employees ({{
                          subDepartmentCount
                        }}
                        sub-departments)
                      </p>
                    </div>
                  </div>
                  <div class="hidden lg:block">
                    <div
                      class="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm"
                    >
                      <UIcon
                        name="i-heroicons-building-office-2"
                        class="h-10 w-10 text-white/80"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="mb-6">
          <div
            class="border-b border-gray-200 bg-white/50 backdrop-blur-sm rounded-lg"
          >
            <nav
              class="mb-px flex space-x-4 overflow-x-auto scrollbar-none"
              style="scroll-behavior: smooth"
            >
              <button
                v-for="tab in tabs"
                :key="tab.id"
                :class="[
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm rounded-t-lg transition-all duration-200',
                ]"
                @click="activeTab = tab.id"
              >
                <UIcon :name="tab.icon" class="h-4 w-4 mr-2" />
                {{ tab.name }}
              </button>
            </nav>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="space-y-6">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <!-- Stats Cards -->

              <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
                <div class="flex items-center">
                  <div class="p-3 bg-orange-100 rounded-lg">
                    <UIcon
                      name="i-heroicons-building-office-2"
                      class="h-6 w-6 text-orange-600"
                    />
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600">
                      Sub Departments
                    </p>
                    <p class="text-2xl font-bold text-gray-900">
                      {{ subDepartmentCount }}
                    </p>
                  </div>
                </div>
              </UCard>

              <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
                <div class="flex items-center">
                  <div class="p-3 bg-blue-100 rounded-lg">
                    <UIcon
                      name="i-heroicons-user-group"
                      class="h-6 w-6 text-blue-600"
                    />
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600">
                      Team Members
                    </p>
                    <p class="text-2xl font-bold text-gray-900">
                      {{ employees.length }}
                    </p>
                  </div>
                </div>
              </UCard>

              <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
                <div class="flex items-center">
                  <div class="p-3 bg-green-100 rounded-lg">
                    <UIcon
                      name="i-heroicons-check-circle"
                      class="h-6 w-6 text-green-600"
                    />
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600">Active Now</p>
                    <p class="text-2xl font-bold text-gray-900">
                      {{ activeEmployeesCount }}
                    </p>
                  </div>
                </div>
              </UCard>

              <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
                <div class="flex items-center">
                  <div class="p-3 bg-red-100 rounded-lg">
                    <UIcon
                      name="i-heroicons-x-circle"
                      class="h-6 w-6 text-red-600"
                    />
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600">Inactive</p>
                    <p class="text-2xl font-bold text-gray-900">
                      {{ employees.length - activeEmployeesCount }}
                    </p>
                  </div>
                </div>
              </UCard>
            </div>
          </div>

          <!-- Structure Tab - Consolidated Inline -->
          <div v-if="activeTab === 'structure'">
            <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-xl">
              <template #header>
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div class="flex items-center space-x-2">
                    <UIcon
                      name="i-heroicons-building-office-2"
                      class="h-5 w-5 text-blue-600"
                    />
                    <h3 class="text-lg font-semibold text-gray-900">
                      Department Hierarchy
                    </h3>
                  </div>
                  <div class="flex items-center space-x-2 sm:space-x-4">
                    <UButton
                      variant="outline"
                      size="sm"
                      class="text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
                      @click="expandAll"
                    >
                      <UIcon
                        name="i-heroicons-plus"
                        class="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                      />
                      <span class="hidden sm:inline">Expand</span> All
                    </UButton>
                    <UButton
                      variant="outline"
                      size="sm"
                      class="text-red-600 hover:bg-red-50 text-xs sm:text-sm"
                      @click="collapseAll"
                    >
                      <UIcon
                        name="i-heroicons-minus"
                        class="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                      />
                      <span class="hidden sm:inline">Collapse</span> All
                    </UButton>
                  </div>
                </div>
              </template>

              <div v-if="flattenedHierarchy.length > 0" class="space-y-2">
                <!-- Render all departments in flattened hierarchy -->
                <template v-for="dept in flattenedHierarchy" :key="dept.id">
                  <div
                    class="flex flex-col sm:flex-row sm:items-center py-2 px-2 sm:px-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group select-none"
                    :class="{
                      'bg-blue-50 border border-blue-200':
                        dept.id === parseInt(selectedDepartmentId),
                      'border border-transparent':
                        dept.id !== parseInt(selectedDepartmentId),
                    }"
                    :style="{
                      marginLeft: isMobileView
                        ? `${Math.min(dept.hierarchy_level * 12, 72)}px`
                        : `${dept.hierarchy_level * 24}px`,
                    }"
                    @click="toggleDepartmentNode(dept)"
                  >
                    <!-- Top Row: Expand Button + Department Info -->
                    <div class="flex items-center w-full sm:flex-1">
                      <!-- Expand/Collapse Button -->
                      <div
                        class="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center mr-2 flex-shrink-0"
                      >
                        <button
                          v-if="getDepartmentChildren(dept.id).length > 0"
                          class="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                          @click.stop="toggleExpand(dept.id)"
                        >
                          <UIcon
                            :name="
                              expandedNodes.has(dept.id)
                                ? 'i-heroicons-chevron-down'
                                : 'i-heroicons-chevron-right'
                            "
                            class="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 transition-transform duration-200"
                          />
                        </button>
                        <div
                          v-else
                          class="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center"
                        >
                          <div class="w-1 h-1 bg-gray-400 rounded-full" />
                        </div>
                      </div>

                      <!-- Department Icon -->
                      <div
                        class="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0"
                        :class="getDepartmentIconClass(dept)"
                      >
                        <UIcon
                          :name="getDepartmentIcon(dept)"
                          class="h-3 w-3 sm:h-4 sm:w-4 text-white"
                        />
                      </div>

                      <!-- Department Info -->
                      <div class="flex-1 min-w-0">
                        <h4
                          class="font-medium text-gray-900 truncate text-sm sm:text-base"
                        >
                          {{ dept.name }}
                        </h4>
                        <div
                          class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-500"
                        >
                          <span>{{ dept.code || "N/A" }}</span>
                          <span>•</span>
                          <span>Level {{ dept.level || 1 }}</span>
                          <span v-if="dept.department_type && !isMobileView">
                            {{ formatDepartmentType(dept.department_type) }}
                          </span>
                        </div>
                      </div>

                      <!-- Manager Info - Desktop Only -->
                      <div
                        v-if="!isMobileView"
                        class="text-right ml-4 flex-shrink-0"
                      >
                        <div
                          v-if="dept.manager_info"
                          class="flex items-center space-x-2"
                        >
                          <!-- Manager Avatar Button - UPDATED -->

                          <div class="text-right">
                            <p class="text-sm font-medium text-gray-900">
                              {{ dept.manager_info.full_name }}
                            </p>
                          </div>
                        </div>
                        <div v-else class="text-sm text-gray-400">
                          No Manager
                        </div>
                      </div>
                    </div>

                    <!-- Mobile-Only Second Row: Manager Info + Stats -->
                    <div
                      v-if="isMobileView"
                      class="mt-2 flex items-center justify-between w-full"
                    >
                      <!-- Manager Info - Mobile -->
                      <div class="flex items-center space-x-2">
                        <div
                          v-if="dept.manager_info"
                          class="flex items-center space-x-2"
                        >
                          <!-- Manager Avatar Button Mobile - UPDATED -->
                          <div>
                            <p class="text-xs font-medium text-gray-900">
                              {{ dept.manager_info.full_name }}
                            </p>
                          </div>
                        </div>
                        <div v-else class="text-xs text-gray-400">
                          No Manager
                        </div>
                      </div>

                      <!-- Department Stats - Mobile Compact -->
                      <div
                        class="flex items-center space-x-2 text-xs text-gray-600"
                      >
                        <span class="flex items-center">
                          <UIcon
                            name="i-heroicons-users"
                            class="h-3 w-3 mr-1"
                          />
                          {{ dept.employee_count || 0 }}
                        </span>
                        <span
                          v-if="(dept.active_count || 0) > 0"
                          class="flex items-center text-green-600"
                        >
                          <div
                            class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"
                          />
                          {{ dept.active_count }}
                        </span>
                      </div>
                    </div>

                    <!-- Desktop Stats Row -->
                    <div
                      v-if="!isMobileView"
                      class="mt-1 sm:mt-2 flex items-center space-x-4 text-xs text-gray-600"
                    >
                      <span class="flex items-center">
                        <UIcon name="i-heroicons-users" class="h-3 w-3 mr-1" />
                        {{ dept.employee_count || 0 }}
                        {{
                          (dept.employee_count || 0) === 1
                            ? "employee"
                            : "employees"
                        }}
                      </span>

                      <span
                        v-if="(dept.active_count || 0) > 0"
                        class="flex items-center text-green-600"
                      >
                        <div class="w-2 h-2 bg-green-500 rounded-full mr-1" />
                        {{ dept.active_count }} active
                      </span>
                    </div>
                  </div>
                </template>
              </div>

              <div v-else class="text-center py-12 text-gray-500">
                <UIcon
                  name="i-heroicons-building-office"
                  class="h-16 w-16 mx-auto mb-4 text-gray-400"
                />
                <p class="text-lg font-medium mb-2">No Department Structure</p>
                <p class="text-sm">Unable to load department hierarchy.</p>
              </div>
            </UCard>
          </div>

          <!-- Team Tab - Mobile Optimized -->
          <div v-if="activeTab === 'team'">
            <!-- Search Bar - Mobile Responsive -->
            <div class="mb-4 sm:mb-6">
              <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
                <div class="relative">
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search employees..."
                    :class="[
                      'w-full pl-12 pr-12 text-gray-900 bg-white rounded-xl focus:outline-none transition-all duration-200 placeholder-gray-400',
                      'py-2.5 text-sm sm:py-3 sm:text-base', // Mobile responsive sizing
                      'border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
                    ]"
                    @input="filterEmployees"
                    @keyup="filterEmployees"
                    @keydown.esc="clearSearch"
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
              </UCard>
            </div>

            <!-- Employee List -->
            <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-xl">
              <template #header>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <UIcon
                      name="i-heroicons-users"
                      class="h-5 w-5 text-blue-600"
                    />
                    <h3 class="text-lg font-semibold text-gray-900">
                      Team Members ({{ filteredEmployees.length }})
                    </h3>
                  </div>
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-green-500 rounded-full" />
                    <span class="font-medium text-green-700 text-sm"
                      >{{ activeEmployeesCount }} Active</span
                    >
                  </div>
                </div>
              </template>

              <div v-if="filteredEmployees.length > 0">
                <!-- Mobile List View -->
                <div v-if="isMobileView" class="divide-y divide-gray-100">
                  <div
                    v-for="employee in filteredEmployees"
                    :key="employee.id"
                    class="flex items-center justify-between py-3 px-1 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                    @click="showEmployeeDetails(employee)"
                  >
                    <!-- Left side: Avatar + Basic Info -->
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                      <!-- Employee Avatar - UPDATED -->
                      <div
                        class="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center flex-shrink-0 overflow-hidden"
                      >
                        <img
                          v-if="hasValidAvatar(employee)"
                          :src="employee.avatar_url"
                          :alt="employee.full_name || 'Employee'"
                          class="w-full h-full object-cover"
                          @error="$event.target.style.display = 'none'"
                        >
                        <span v-else class="text-white text-sm font-medium">
                          {{ getInitials(employee.full_name) }}
                        </span>
                      </div>

                      <!-- Employee Info -->
                      <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-gray-900 truncate">
                          {{ employee.full_name || "Unknown" }}
                        </h4>
                        <div
                          class="flex items-center space-x-2 text-xs text-gray-500"
                        >
                          <span class="text-gray-300">•</span>
                          <span class="truncate">{{
                            employee.position_info?.designation || "No Position"
                          }}</span>
                        </div>
                        <div
                          class="flex items-center space-x-2 text-xs text-gray-500"
                        >
                          <span class="text-gray-300">•</span>
                          <span class="text-xs text-gray-400 mt-1">{{
                            getDepartmentName(employee.department)
                          }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Right side: Status + Arrow -->
                    <div class="flex items-center space-x-3 flex-shrink-0">
                      <!-- Status Badge -->
                      <span
                        :class="[
                          'inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium transition-colors',
                          employee.attendance_status === 'active'
                            ? 'bg-green-50 text-green-600 ring-1 ring-green-200 hover:bg-green-100'
                            : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100',
                        ]"
                      >
                        {{
                          employee.attendance_status === "active"
                            ? "Active"
                            : "Inactive"
                        }}
                      </span>

                      <!-- Arrow -->
                      <UIcon
                        name="i-heroicons-chevron-right"
                        class="h-4 w-4 text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                <!-- Desktop Card View -->
                <div v-else class="space-y-4">
                  <div
                    v-for="employee in filteredEmployees"
                    :key="employee.id"
                    class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    @click="showEmployeeDetails(employee)"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-4">
                        <!-- Employee Avatar - UPDATED -->
                        <div
                          class="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center overflow-hidden"
                        >
                          <img
                            v-if="hasValidAvatar(employee)"
                            :src="employee.avatar_url"
                            :alt="employee.full_name || 'Employee'"
                            class="w-full h-full object-cover"
                            @error="$event.target.style.display = 'none'"
                          >
                          <span v-else class="text-white font-medium">
                            {{ getInitials(employee.full_name) }}
                          </span>
                        </div>

                        <!-- Employee Info -->
                        <div>
                          <h4 class="font-medium text-gray-900">
                            {{ employee.full_name || "Unknown" }}
                          </h4>
                          <div
                            class="flex items-center space-x-4 text-sm text-gray-500"
                          >
                            <span>{{
                              employee.position_info?.designation ||
                              "No Position"
                            }}</span>
                          </div>
                          <p class="text-xs text-gray-400 mt-1">
                            {{ getDepartmentName(employee.department) }}
                          </p>
                        </div>
                      </div>

                      <!-- Status & Actions -->
                      <div class="flex items-center space-x-4">
                        <!-- Attendance Status -->
                        <span
                          :class="[
                            'inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium transition-colors',
                            employee.attendance_status === 'active'
                              ? 'bg-green-50 text-green-600 ring-1 ring-green-200 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100',
                          ]"
                        >
                          {{
                            employee.attendance_status === "active"
                              ? "Active"
                              : "Inactive"
                          }}
                        </span>

                        <!-- Arrow -->
                        <UIcon
                          name="i-heroicons-chevron-right"
                          class="h-5 w-5 text-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center py-8 sm:py-12 text-gray-500">
                <UIcon
                  name="i-heroicons-users"
                  class="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-400"
                />
                <p class="text-base sm:text-lg font-medium mb-2">
                  No employees found
                </p>
                <p class="text-sm">
                  {{
                    searchQuery
                      ? "Try adjusting your search terms"
                      : "No employees are assigned to this department"
                  }}
                </p>
              </div>
            </UCard>
          </div>
        </div>
      </div>

      <!-- No Access State -->
      <div
        v-if="!selectedDepartment && !isLoading"
        class="flex flex-col items-center justify-center py-12"
      >
        <UIcon
          name="i-heroicons-building-office"
          class="h-16 w-16 text-gray-400 mb-4"
        />
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          No Department Access
        </h3>
        <p class="text-gray-500 text-center max-w-md">
          You don't have manager access to any department. Contact your
          administrator if this seems incorrect.
        </p>
      </div>
    </div>

    <!-- Employee Details Dialog Overlay with Fade Transition -->
    <Transition name="fade">
      <div
        v-if="showEmployeeModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        @click="showEmployeeModal = false"
      >
        <div
          class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 relative"
          @click.stop
        >
          <!-- Close button (top right) -->
          <button
            aria-label="Close dialog"
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            @click="showEmployeeModal = false"
          >
            <UIcon name="i-heroicons-x-mark" class="h-6 w-6" />
          </button>

          <!-- Modal Content -->
          <div v-if="selectedEmployee" class="space-y-6">
            <!-- Modal Header -->
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg sm:text-xl font-bold text-gray-900">
                Employee Details
              </h3>
            </div>

            <!-- Employee Header -->
            <div
              class="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <div class="flex items-center space-x-4">
                <!-- Avatar (image or initial) -->
                <div
                  class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center overflow-hidden"
                >
                  <img
                    v-if="hasValidAvatar(selectedEmployee)"
                    :src="selectedEmployee.avatar_url"
                    :alt="selectedEmployee.full_name || 'Employee'"
                    class="w-full h-full object-cover"
                    @error="onAvatarError"
                  >
                  <span v-else class="text-white text-xl sm:text-2xl font-bold">
                    {{ getInitials(selectedEmployee.full_name) }}
                  </span>
                </div>
                <div class="flex-1">
                  <h4 class="text-xl sm:text-2xl font-bold text-gray-900">
                    {{ selectedEmployee.full_name || "Unknown" }}
                  </h4>
                  <p class="text-gray-600">
                    {{ selectedEmployee.employee_code || "No Code" }}
                  </p>
                  <p class="text-blue-600 font-medium">
                    {{
                      selectedEmployee.position_info?.designation ||
                      "No Position"
                    }}
                  </p>
                </div>
              </div>

              <!-- Status Badge -->
              <div class="sm:self-start">
                <span
                  :class="[
                    'inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium',
                    selectedEmployee.attendance_status === 'active'
                      ? 'bg-green-50 text-green-600 ring-1 ring-green-200'
                      : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
                  ]"
                >
                  {{
                    selectedEmployee.attendance_status === "active"
                      ? "Currently Active"
                      : "Currently Inactive"
                  }}
                </span>
              </div>
            </div>

            <!-- Details Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <!-- Contact Information -->
              <div class="space-y-4">
                <h5
                  class="font-semibold text-gray-900 text-sm uppercase tracking-wide"
                >
                  Contact Information
                </h5>
                <div>
                  <label class="text-sm font-medium text-gray-600"
                    >Email Address</label
                  >
                  <div class="mt-1 flex items-center space-x-2">
                    <UIcon
                      name="i-heroicons-envelope"
                      class="h-4 w-4 text-gray-400"
                    />
                    <p class="text-gray-900">
                      {{ selectedEmployee.email || "Not provided" }}
                    </p>
                  </div>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-600"
                    >Phone Number</label
                  >
                  <div class="mt-1 flex items-center space-x-2">
                    <UIcon
                      name="i-heroicons-phone"
                      class="h-4 w-4 text-gray-400"
                    />
                    <p class="text-gray-900">
                      {{ selectedEmployee.phone || "Not provided" }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Work Information -->
              <div class="space-y-4">
                <h5
                  class="font-semibold text-gray-900 text-sm uppercase tracking-wide"
                >
                  Work Information
                </h5>
                <div>
                  <label class="text-sm font-medium text-gray-600"
                    >Department</label
                  >
                  <div class="mt-1 flex items-center space-x-2">
                    <UIcon
                      name="i-heroicons-building-office"
                      class="h-4 w-4 text-gray-400"
                    />
                    <p class="text-gray-900">
                      {{ getDepartmentName(selectedEmployee.department) }}
                    </p>
                  </div>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-600"
                    >Employment Type</label
                  >
                  <div class="mt-1 flex items-center space-x-2">
                    <UIcon
                      name="i-heroicons-briefcase"
                      class="h-4 w-4 text-gray-400"
                    />
                    <p class="text-gray-900">
                      {{ selectedEmployee.employment_type || "Unknown" }}
                    </p>
                  </div>
                </div>
                <div v-if="selectedEmployee.date_of_joining">
                  <label class="text-sm font-medium text-gray-600"
                    >Joining Date</label
                  >
                  <div class="mt-1 flex items-center space-x-2">
                    <UIcon
                      name="i-heroicons-calendar"
                      class="h-4 w-4 text-gray-400"
                    />
                    <p class="text-gray-900">
                      {{ formatDate(selectedEmployee.date_of_joining) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="border-t pt-4">
              <h5
                class="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3"
              >
                Quick Actions
              </h5>
              <div class="flex flex-col sm:flex-row gap-3">
                <UButton
                  class="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 flex-1 justify-center text-white"
                  size="md"
                  @click="viewEmployeeAttendance(selectedEmployee)"
                >
                  <UIcon
                    name="i-heroicons-calendar-days"
                    class="h-4 w-4 mr-2 text-white"
                  />
                  View Attendance History
                </UButton>
                <UButton
                  class="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 flex-1 justify-center text-white"
                  size="md"
                  @click="contactEmployee(selectedEmployee)"
                >
                  <UIcon
                    name="i-heroicons-chat-bubble-left-right"
                    class="h-4 w-4 mr-2 text-white"
                  />
                  Email Employee
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>

// Auth guard
definePageMeta({
  middleware: "auth",
});

// Composables
const user = useSupabaseUser();
const supabase = useSupabaseClient();
const toast = useToast();
const router = useRouter();

// Reactive state
const isLoading = ref(true);
const managedDepartments = ref([]);
const selectedDepartment = ref(null);
const selectedDepartmentId = ref("");
const employees = ref([]);
const filteredEmployees = ref([]);
const subDepartments = ref([]);
const allSubDepartments = ref({});
const departmentMap = ref({});
const managers = ref([]);
const searchQuery = ref("");
const activeTab = ref("overview");
const showEmployeeModal = ref(false);
const selectedEmployee = ref(null);
const isMobileView = ref(false);

// Hierarchy state
const expandedNodes = ref(new Set());
const hierarchyTree = ref([]);

// Computed properties
const activeEmployeesCount = computed(
  () =>
    employees.value.filter((emp) => emp.attendance_status === "active").length
);

const subDepartmentCount = computed(() => {
  if (!selectedDepartmentId.value) return 0;
  const deptId = parseInt(selectedDepartmentId.value);
  return Object.values(departmentMap.value).filter(
    (dept) => dept.parent_id === deptId && dept.is_active
  ).length;
});

// const departmentOptions = computed(() =>
//   managedDepartments.value.map((dept) => ({
//     label: dept.name,
//     value: dept.id.toString(),
//   }))
// );

// Flatten hierarchy for simplified rendering
const flattenedHierarchy = computed(() => {
  const flattened = [];

  const flattenDept = (dept, level = 0) => {
    flattened.push({
      ...dept,
      hierarchy_level: level,
    });

    if (expandedNodes.value.has(dept.id)) {
      getDepartmentChildren(dept.id).forEach((child) => {
        flattenDept(child, level + 1);
      });
    }
  };

  hierarchyTree.value.forEach((dept) => flattenDept(dept));
  return flattened;
});

// Tab configuration
const tabs = [
  { id: "overview", name: "Overview", icon: "i-heroicons-chart-bar" },
  { id: "structure", name: "Structure", icon: "i-heroicons-building-office-2" },
  { id: "team", name: "Team", icon: "i-heroicons-users" },
];

// Special departments for NOC teams (matching Flutter logic)
const specialDepartments = new Set([101, 1011, 1012, 1013]);


// New function to check if avatar URL is valid
const hasValidAvatar = (employee) => {
  if (!employee?.avatar_url) return false;

  // Check if it's not empty, null, or just whitespace
  const url = employee.avatar_url.trim();
  if (!url || url === "" || url === "null" || url === "undefined") return false;

  // Basic URL validation - you can enhance this as needed
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const getDepartmentName = (deptId) => {
  if (!deptId) return "Unknown Department";
  return departmentMap.value[deptId]?.name || "Unknown Department";
};

const formatDate = (dateString) => {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const contactEmployee = (employee) => {
  if (employee.email) {
    window.location.href = `mailto:${employee.email}`;
  } else {
    toast.add({
      title: "No Contact Information",
      description: "Email address not available for this employee.",
      color: "red",
    });
  }
};

const checkMobileView = () => {
  isMobileView.value = window.innerWidth < 768;
};

// Get current time from Supabase (matching Flutter getCurrentTime)
const getCurrentTime = async () => {
  try {
    const { data } = await supabase.rpc("get_supabase_time");
    return new Date(data);
  } catch (error) {
    console.error("Error getting current time:", error);
    return new Date();
  }
};

// Load all department hierarchy data (matching Flutter approach)
const loadDepartmentHierarchy = async () => {
  try {
    const { data: allDepts, error } = await supabase
      .from("departments")
      .select(
        `
        id, name, code, description, level, parent_id, path,
        department_type, service_area, shift_type, cost_center,
        annual_budget, max_headcount, is_active, manager_id
      `
      )
      .eq("is_active", true);

    if (error) throw error;

    // Cache all departments for quick lookup (matching Flutter)
    const deptMap = {};
    allDepts.forEach((dept) => {
      deptMap[dept.id] = dept;
    });
    departmentMap.value = deptMap;
  } catch (error) {
    console.error("Error loading department hierarchy:", error);
    throw error;
  }
};

// Get department subtree from cached data (matching Flutter logic)
const getDepartmentSubtreeFromCache = (rootId) => {
  const subtree = [];
  const visited = new Set();

  const collectSubtree = (deptId) => {
    if (visited.has(deptId)) return;
    visited.add(deptId);

    const dept = departmentMap.value[deptId];
    if (dept) {
      subtree.push(dept);

      // Find children
      Object.values(departmentMap.value)
        .filter((d) => d.parent_id === deptId)
        .forEach((child) => collectSubtree(child.id));
    }
  };

  collectSubtree(rootId);
  return subtree.sort((a, b) => a.level - b.level);
};

const fetchManagedDepartments = async () => {
  try {
    if (!user.value) return;

    // Load department hierarchy first
    await loadDepartmentHierarchy();

    // Get departments managed by current user from cached data (matching Flutter)
    managedDepartments.value = Object.values(departmentMap.value)
      .filter(
        (dept) => dept.manager_id === user.value.id && dept.is_active === true
      )
      .sort((a, b) => {
        const levelCompare = a.level - b.level;
        if (levelCompare !== 0) return levelCompare;
        return a.name.localeCompare(b.name);
      });

    // Set first department as selected by default
    if (managedDepartments.value.length > 0) {
      selectedDepartmentId.value = managedDepartments.value[0].id.toString();
      selectedDepartment.value = managedDepartments.value[0];
      await loadDepartmentDetails();
    }
  } catch (error) {
    console.error("Error fetching managed departments:", error);
    toast.add({
      title: "Error loading departments",
      description: "Failed to load your managed departments.",
      color: "red",
    });
  }
};

// Update the loadDepartmentDetails function to ensure proper sequencing
const loadDepartmentDetails = async () => {
  if (!selectedDepartmentId.value) return;

  try {
    isLoading.value = true;
    employees.value = [];
    subDepartments.value = [];
    allSubDepartments.value = {};
    managers.value = []; // Reset managers

    const selectedDeptId = parseInt(selectedDepartmentId.value);

    // Get department subtree using cached data (matching Flutter)
    const subtree = getDepartmentSubtreeFromCache(selectedDeptId);
    const subtreeIds = subtree.map((d) => d.id);

    // Get ALL manager IDs from all departments early
    const allManagerIds = [
      ...new Set(
        Object.values(departmentMap.value)
          .filter((dept) => dept.manager_id && dept.is_active)
          .map((dept) => dept.manager_id)
      ),
    ];

    // Load ALL managers upfront
    if (allManagerIds.length > 0) {
      const { data: allManagersResponse, error: managersError } = await supabase
        .from("profiles")
        .select("id, full_name, employee_code, email, position, department")
        .in("id", allManagerIds)
        .eq("is_active", true);

      if (!managersError) {
        managers.value = allManagersResponse || [];
      }
    }

    // Get employees in all departments in the subtree
    const { data: employeesResponse, error: empError } = await supabase
      .from("profiles")
      .select(
        `
        id, full_name, employee_code, email, phone, avatar_url,
        employment_type, date_of_joining, is_active, department, position
      `
      )
      .in("department", subtreeIds)
      .eq("is_active", true)
      .order("department");

    if (empError) throw empError;

    // Get positions for employees
    const positionIds = [
      ...new Set(
        employeesResponse
          .filter((emp) => emp.position)
          .map((emp) => emp.position)
      ),
    ];

    let positions = [];
    if (positionIds.length > 0) {
      const { data: positionsResponse } = await supabase
        .from("positions")
        .select("id, designation, level")
        .in("id", positionIds);
      positions = positionsResponse || [];
    }

    // Get employee IDs for attendance check
    const employeeIds = employeesResponse.map((emp) => emp.id);

    // Get today's attendance data for all employees
    const today = await getCurrentTime();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    let todayAttendanceData = [];
    if (employeeIds.length > 0) {
      const { data: attendanceResponse } = await supabase
        .from("attendance")
        .select("employee_id, punch_in, punch_out, date")
        .in("employee_id", employeeIds)
        .eq("date", todayStr);
      todayAttendanceData = attendanceResponse || [];
    }

    // Enhanced attendance status logic for special departments (matching Flutter)
    const todayAttendanceEmployeeIds = new Set(
      todayAttendanceData.map((att) => att.employee_id)
    );
    const specialDeptEmployeesWithoutToday = employeesResponse
      .filter(
        (emp) =>
          specialDepartments.has(emp.department) &&
          !todayAttendanceEmployeeIds.has(emp.id)
      )
      .map((emp) => emp.id);

    let yesterdayAttendanceData = [];
    if (specialDeptEmployeesWithoutToday.length > 0) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${(
        yesterday.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${yesterday.getDate().toString().padStart(2, "0")}`;

      const { data: yesterdayResponse } = await supabase
        .from("attendance")
        .select("employee_id, punch_in, punch_out, date")
        .in("employee_id", specialDeptEmployeesWithoutToday)
        .eq("date", yesterdayStr);
      yesterdayAttendanceData = yesterdayResponse || [];
    }

    // Combine employee data with positions and attendance status (matching Flutter logic)
    employees.value = employeesResponse.map((emp) => {
      const position = positions.find((pos) => pos.id === emp.position) || {};
      const isSpecialDepartment = specialDepartments.has(emp.department);

      // Check today's attendance
      const todayAttendance = todayAttendanceData.find(
        (att) => att.employee_id === emp.id
      );
      let status = "inactive";

      if (todayAttendance) {
        if (todayAttendance.punch_in && !todayAttendance.punch_out) {
          status = "active";
        }
      } else if (isSpecialDepartment) {
        // Check yesterday's attendance for special departments
        const yesterdayAttendance = yesterdayAttendanceData.find(
          (att) => att.employee_id === emp.id
        );
        if (yesterdayAttendance?.punch_in && !yesterdayAttendance.punch_out) {
          try {
            const punchInTime = new Date(yesterdayAttendance.punch_in);
            const timeDifference = today.getTime() - punchInTime.getTime();
            const hoursDifference = timeDifference / (1000 * 60 * 60);

            // If less than 13 hours have passed, consider as active (matching Flutter)
            if (hoursDifference < 13) {
              status = "active";
            }
          } catch (error) {
            console.error("Error parsing punch_in time:", error);
          }
        }
      }

      return {
        ...emp,
        position_info: position,
        attendance_status: status,
      };
    });

    filteredEmployees.value = employees.value;

    // Build hierarchy tree directly since managers are already loaded
    hierarchyTree.value = buildHierarchyTree();

    // Auto-expand the root department
    if (selectedDepartmentId.value) {
      expandedNodes.value.add(parseInt(selectedDepartmentId.value));
    }

    await nextTick();
  } catch (error) {
    console.error("Error loading department details:", error);
    toast.add({
      title: "Error loading department",
      description: "Failed to load department details.",
      color: "red",
    });
  } finally {
    isLoading.value = false;
  }
};

// Update the buildHierarchyTree function
const buildHierarchyTree = () => {
  if (!selectedDepartmentId.value) return [];

  const rootId = parseInt(selectedDepartmentId.value);
  const rootDept = departmentMap.value[rootId];
  if (!rootDept) return [];

  // Build tree starting from root department
  const buildTree = (parentId) => {
    return Object.values(departmentMap.value)
      .filter((dept) => dept.parent_id === parentId && dept.is_active)
      .map((dept) => {
        // Find manager info from loaded managers
        const managerInfo =
          managers.value.find((mgr) => mgr.id === dept.manager_id) || null;

        // Calculate employee count for this specific department (not subtree)
        const deptEmployeeCount = employees.value.filter(
          (emp) => emp.department === dept.id
        ).length;
        const deptActiveCount = employees.value.filter(
          (emp) =>
            emp.department === dept.id && emp.attendance_status === "active"
        ).length;

        // Build children recursively
        const children = buildTree(dept.id);

        return {
          ...dept,
          manager_info: managerInfo,
          employee_count: deptEmployeeCount,
          active_count: deptActiveCount,
          children: children,
        };
      })
      .sort((a, b) => {
        const levelCompare = a.level - b.level;
        if (levelCompare !== 0) return levelCompare;
        return a.name.localeCompare(b.name);
      });
  };

  // Calculate stats for root department
  const rootEmployeeCount = employees.value.filter(
    (emp) => emp.department === rootId
  ).length;
  const rootActiveCount = employees.value.filter(
    (emp) => emp.department === rootId && emp.attendance_status === "active"
  ).length;
  const rootManagerInfo =
    managers.value.find((mgr) => mgr.id === rootDept.manager_id) || null;

  // Start with the selected department as root
  const tree = [
    {
      ...rootDept,
      manager_info: rootManagerInfo,
      employee_count: rootEmployeeCount,
      active_count: rootActiveCount,
      children: buildTree(rootId),
    },
  ];

  return tree;
};

// Get children departments for a given parent ID
const getDepartmentChildren = (parentId) => {
  return Object.values(departmentMap.value)
    .filter((dept) => dept.parent_id === parentId && dept.is_active)
    .map((dept) => {
      // Ensure the department has the required data
      const managerInfo =
        managers.value.find((mgr) => mgr.id === dept.manager_id) || null;
      const deptEmployeeCount = employees.value.filter(
        (emp) => emp.department === dept.id
      ).length;
      const deptActiveCount = employees.value.filter(
        (emp) =>
          emp.department === dept.id && emp.attendance_status === "active"
      ).length;

      return {
        ...dept,
        manager_info: managerInfo,
        employee_count: deptEmployeeCount,
        active_count: deptActiveCount,
      };
    })
    .sort((a, b) => {
      const levelCompare = a.level - b.level;
      if (levelCompare !== 0) return levelCompare;
      return a.name.localeCompare(b.name);
    });
};

// Toggle department node (for potential future use)
const toggleDepartmentNode = (dept) => {
  if (getDepartmentChildren(dept.id).length > 0) {
    toggleExpand(dept.id);
  }
};

// Get department icon based on level and type
const getDepartmentIcon = (dept) => {
  if (dept.level === 1) return "i-heroicons-building-office-2";
  if (dept.level === 2) return "i-heroicons-building-office";
  if (dept.department_type === "operational") return "i-heroicons-cog-6-tooth";
  if (dept.department_type === "support")
    return "i-heroicons-wrench-screwdriver";
  return "i-heroicons-building-storefront";
};

// Get department icon class based on level
const getDepartmentIconClass = (dept) => {
  if (dept.level === 1) return "bg-gradient-to-r from-blue-500 to-blue-600";
  if (dept.level === 2) return "bg-gradient-to-r from-orange-500 to-orange-600";
  if (dept.level === 3)
    return "bg-gradient-to-r from-emerald-500 to-emerald-600";
  if (dept.level === 4) return "bg-gradient-to-r from-amber-600 to-amber-700";
  return "bg-gradient-to-r from-gray-500 to-gray-600";
};

// Format department type for display
const formatDepartmentType = (type) => {
  if (!type) return "N/A";
  return type.replace(/_/g, " ").toUpperCase();
};

// Truncate text helper
// const truncateText = (text, maxLength) => {
//   if (!text) return "";
//   return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
// };

const toggleExpand = (deptId) => {
  if (expandedNodes.value.has(deptId)) {
    expandedNodes.value.delete(deptId);
  } else {
    expandedNodes.value.add(deptId);
  }
};

const expandAll = () => {
  const allIds = Object.keys(departmentMap.value).map((id) => parseInt(id));
  expandedNodes.value = new Set(allIds);
};

const collapseAll = () => {
  expandedNodes.value.clear();
  // Keep root department expanded
  if (selectedDepartmentId.value) {
    expandedNodes.value.add(parseInt(selectedDepartmentId.value));
  }
};

// const viewManagerDetails = (manager) => {
//   selectedEmployee.value = manager;
//   showEmployeeModal.value = true;
// };

const onDepartmentChange = () => {
  const dept = managedDepartments.value.find(
    (d) => d.id.toString() === selectedDepartmentId.value
  );
  selectedDepartment.value = dept;
  loadDepartmentDetails();
};

// Enhanced search functionality (matching Flutter)
const filterEmployees = () => {
  if (!searchQuery.value.trim()) {
    filteredEmployees.value = employees.value;
    return;
  }

  const query = searchQuery.value.toLowerCase().trim();
  filteredEmployees.value = employees.value.filter((employee) => {
    const name = employee.full_name?.toLowerCase() || "";
    const code = employee.employee_code?.toLowerCase() || "";
    const email = employee.email?.toLowerCase() || "";
    const position = employee.position_info?.designation?.toLowerCase() || "";
    const departmentName = getDepartmentName(employee.department)?.toLowerCase() || "";
    const departmentCode = departmentMap.value[employee.department]?.code?.toLowerCase() || "";

    return (
      name.includes(query) ||
      code.includes(query) ||
      email.includes(query) ||
      position.includes(query) ||
      departmentName.includes(query) ||
      departmentCode.includes(query)
    );
  });
};

const showEmployeeDetails = (employee) => {
  selectedEmployee.value = employee;
  showEmployeeModal.value = true;
};

// department.vue
const viewEmployeeAttendance = async (employee) => {
  const attendanceSummaryStore = useAttendanceSummaryStore()
  
  try {
    // Calculate manager chain
    const managerChain = await getManagerChain(employee.id)
    const managerLevel = managerChain.count + 1

    // Set employee data in sessionStorage store
    attendanceSummaryStore.setEmployeeData({
      employeeId: employee.id,
      employeeName: employee.full_name,
      employeeCode: employee.employee_code,
      employeeDateOfJoining: employee.date_of_joining,
      managerLevel,
      managerId: user.value.id,
      department: employee.department,
      position: employee.position_info?.designation,
      email: employee.email,
      phone: employee.phone
    })

    // Close modal
    showEmployeeModal.value = false

    // Navigate without query parameters
    await router.push('/attendance-summary')
    
  } catch (error) {
    console.error('Error navigating to attendance summary:', error)
    toast.add({
      title: 'Navigation Error',
      description: 'Failed to open attendance summary',
      color: 'red'
    })
  }
}



// Basic manager chain calculation (you can enhance this to match Flutter complexity)
const getManagerChain = async (employeeId) => {
  const employee = employees.value.find((e) => e.id === employeeId);
  if (!employee?.department) {
    return { chain: [], count: 0, names: [] };
  }

  let currentDeptId = employee.department;
  const managerNames = [];
  const managerIds = [];

  while (currentDeptId) {
    const dept = departmentMap.value[currentDeptId];
    if (!dept) break;

    const managerId = dept.manager_id;
    if (managerId && managerId !== user.value.id && managerId !== employeeId) {
      const manager = employees.value.find((e) => e.id === managerId);
      if (manager) {
        managerNames.push(manager.full_name || "Unknown Manager");
        managerIds.push(managerId);
      }
    }

    if (managerId === user.value.id) break;
    currentDeptId = dept.parent_id;
  }

  return {
    ids: managerIds,
    names: managerNames,
    count: managerIds.length,
  };
};

// Initialize on mount
onMounted(() => {
  fetchManagedDepartments();
  checkMobileView();
  window.addEventListener("resize", checkMobileView);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobileView);
});

// Meta
useHead({
  title: "Department Management - Convise",
  meta: [
    {
      name: "description",
      content:
        "Manage your department, team members, and organizational structure.",
    },
  ],
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

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
