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
          Loading Team Requests
        </h2>
        <p class="text-gray-600">Fetching team member requests...</p>
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
                  Team Requests
                </h1>
                <p class="text-gray-600">
                  Manage team leave and regularization requests
                </p>
              </div>
            </div>
            <!-- Team Member Count & Refresh Button -->
            <!-- <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-500 hidden sm:block">
                {{ teamMembers.length }} team member(s)
              </div>
              <UButton
                size="md"
                variant="outline"
                color="blue"
                class="bg-blue-50/80 backdrop-blur-sm hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                :loading="isRefreshing"
                @click="refreshData"
              >
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="h-5 w-5 mr-2 text-blue-600"
                />
                <span class="text-blue-700">Refresh</span>
              </UButton>
            </div> -->
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Auto-Trimming Search Bar with v-model.trim -->
        <div class="mb-4 sm:mb-6">
          <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
            <div class="relative">
              <input
                v-model.trim="searchQuery"
                type="text"
                placeholder="Search by name, status, or request type..."
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
          </UCard>
        </div>

        <!-- Complete Updated Tab Section with Mobile Responsive Design -->
        <div class="relative">
          <div
            class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-20"
          />
          <UCard
            class="relative bg-white/80 backdrop-blur-lg border-0 shadow-xl"
          >
            <!-- Tab Headers - Horizontally Scrollable on Mobile -->
            <div
              class="flex border-b border-gray-200 overflow-x-auto scrollbar-hide"
            >
              <button
                v-for="tab in tabs"
                :key="tab.id"
                :class="[
                  'flex-shrink-0 min-w-max px-3 py-3 sm:px-4 md:px-6 font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-1.5 sm:space-x-2',
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50',
                ]"
                @click="activeTab = tab.id"
              >
                <UIcon
                  :name="tab.icon"
                  class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"
                />
                <span class="whitespace-nowrap">{{ tab.name }}</span>
                <span
                  v-if="tab.count > 0"
                  class="bg-red-100 text-red-800 text-xs font-medium px-1.5 py-0.5 sm:px-2 rounded-full flex-shrink-0"
                >
                  {{ tab.count }}
                </span>
              </button>
            </div>

            <!-- Tab Content with Mobile-Optimized Padding -->
            <div class="p-3 sm:p-4 md:p-6">
              <!-- Regularization Requests Tab -->
              <div v-if="activeTab === 'regularizations'">
                <div
                  v-if="filteredRegularizationRequests.length === 0"
                  class="text-center py-8 sm:py-12"
                >
                  <UIcon
                    name="i-heroicons-clipboard-document-list"
                    class="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4"
                  />
                  <h3
                    class="text-base sm:text-lg font-medium text-gray-900 mb-2"
                  >
                    {{
                      searchQuery
                        ? "No matching regularization requests"
                        : "No regularization requests"
                    }}
                  </h3>
                  <p class="text-sm text-gray-500 px-4">
                    {{
                      searchQuery
                        ? "Try adjusting your search criteria"
                        : "Your team hasn't submitted any regularization requests yet"
                    }}
                  </p>
                </div>
                <div v-else class="space-y-3 sm:space-y-4">
                  <div
                    v-for="request in sortedRegularizationRequests"
                    :key="request.id"
                    :class="[
                      'cursor-pointer transition-all duration-200',
                      needsRegularizationAction(request)
                        ? 'animate-pulse-soft'
                        : '',
                    ]"
                    @click="showRegularizationDetails(request)"
                  >
                    <!-- Mobile-Optimized Regularization Request Card -->
                    <div
                      :class="[
                        'bg-white rounded-xl shadow-sm border transition-all duration-200',
                        needsRegularizationAction(request)
                          ? 'border-orange-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                          : 'border-gray-200 hover:shadow-md hover:border-gray-300',
                      ]"
                    >
                      <!-- Action Required Banner -->
                      <div
                        v-if="needsRegularizationAction(request)"
                        class="bg-gradient-to-r from-orange-100 to-red-100 border-b border-orange-200 px-3 sm:px-4 py-2 rounded-t-xl"
                      >
                        <div class="flex items-center space-x-2">
                          <UIcon
                            name="i-heroicons-exclamation-triangle"
                            class="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0"
                          />
                          <span
                            class="text-xs sm:text-sm font-semibold text-orange-800"
                          >
                            ACTION REQUIRED - Your approval needed
                          </span>
                        </div>
                      </div>

                      <!-- Card Content with Status Background -->
                      <div
                        :class="[
                          'transition-all duration-200',
                          getCardStatusClasses(request.status),
                          // Mobile: stack vertically, Desktop: horizontal
                          'flex flex-col md:flex-row md:items-start md:justify-between',
                          // Responsive padding
                          'p-3 md:p-6',
                          // Responsive spacing
                          'space-y-3 md:space-y-0',
                        ]"
                      >
                        <!-- Mobile: Avatar + Name Row, Desktop: Left Section -->
                        <div
                          class="flex items-start space-x-3 md:space-x-4 flex-1 min-w-0"
                        >
                          <!-- Employee Avatar -->
                          <div class="flex-shrink-0">
                            <div
                              :class="[
                                'rounded-full flex items-center justify-center text-white font-bold',
                                needsRegularizationAction(request)
                                  ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                  : 'bg-gradient-to-r from-emerald-500 to-blue-600',
                                // Responsive avatar size
                                'w-10 h-10 text-sm md:w-12 md:h-12 md:text-lg',
                              ]"
                            >
                            <span class="text-white font-medium">{{ getInitials(request.profiles?.full_name) }}</span>
                            </div>
                          </div>

                          <!-- Request Details -->
                          <div class="flex-1 min-w-0">
                            <!-- Employee Name + Department + Status -->
                            <div
                              class="flex flex-col md:flex-row md:items-center md:space-x-3 mb-2"
                            >
                              <h4
                                class="text-sm md:text-lg font-semibold text-gray-900 truncate"
                              >
                                {{ request.profiles?.full_name }}
                              </h4>
                              <span
                                class="text-xs md:text-sm text-gray-500 truncate"
                              >
                                {{ getEmployeeDepartment(request.employee_id) }}
                              </span>
                              <div class="mt-1 md:mt-0">
                                <UBadge
                                  :class="getStatusClasses(request.status)"
                                >
                                  {{ formatStatus(request.status) }}
                                </UBadge>
                              </div>
                            </div>

                            <!-- Request Info Grid -->
                            <div
                              class="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-4 mb-2 md:mb-3"
                            >
                              <div>
                                <span
                                  class="text-xs md:text-sm font-medium text-gray-500"
                                >
                                  Request Type:
                                </span>
                                <p
                                  class="text-xs md:text-sm text-gray-900 truncate"
                                >
                                  {{
                                    formatRegularizationType(
                                      request.regularization_type
                                    )
                                  }}
                                </p>
                              </div>
                              <div>
                                <span
                                  class="text-xs md:text-sm font-medium text-gray-500"
                                >
                                  Date:
                                </span>
                                <p
                                  class="text-xs md:text-sm font-medium text-gray-900 truncate"
                                >
                                  {{ formatDate(request.requested_punch_in) }}
                                </p>
                              </div>
                            </div>

                            <!-- Reason -->
                            <div v-if="request.reason" class="mb-2 md:mb-3">
                              <span
                                class="text-xs md:text-sm font-medium text-gray-500"
                              >
                                Reason:
                              </span>
                              <p
                                class="text-xs md:text-sm text-gray-900 line-clamp-2"
                              >
                                {{ request.reason }}
                              </p>
                            </div>

                            <!-- Approval Progress Bar -->
                            <div
                              v-if="request.status === 'pending'"
                              class="flex items-center space-x-2"
                            >
                              <span class="text-xs font-semibold text-gray-600">
                                APPROVAL:
                              </span>
                              <div
                                class="flex-1 bg-gray-200 rounded-full h-1.5 md:h-2"
                              >
                                <div
                                  :class="[
                                    'h-1.5 md:h-2 rounded-full transition-all duration-500',
                                    needsRegularizationAction(request)
                                      ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                      : 'bg-gradient-to-r from-blue-500 to-purple-600',
                                  ]"
                                  :style="{
                                    width: `${getApprovalProgress(request)}%`,
                                  }"
                                />
                              </div>
                              <span class="text-xs font-bold text-gray-600">
                                {{ getApprovedLevels(request) }}/{{
                                  request.approval_levels || 1
                                }}
                              </span>
                            </div>
                          </div>
                        </div>

                        <!-- Applied Date -->
                        <div
                          class="text-center md:text-right border-t pt-2 md:border-t-0 md:pt-0 md:flex-shrink-0 md:ml-4"
                        >
                          <p class="text-xs text-gray-500">Applied On</p>
                          <p
                            class="text-xs md:text-sm font-medium text-gray-900"
                          >
                            {{ formatDateTime(request.created_at) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Leave Requests Tab -->
              <div v-if="activeTab === 'leave'">
                <div
                  v-if="filteredLeaveRequests.length === 0"
                  class="text-center py-8 sm:py-12"
                >
                  <UIcon
                    name="i-heroicons-calendar-days"
                    class="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4"
                  />
                  <h3
                    class="text-base sm:text-lg font-medium text-gray-900 mb-2"
                  >
                    {{
                      searchQuery
                        ? "No matching leave requests"
                        : "No leave requests"
                    }}
                  </h3>
                  <p class="text-sm text-gray-500 px-4">
                    {{
                      searchQuery
                        ? "Try adjusting your search criteria"
                        : "Your team hasn't submitted any leave requests yet"
                    }}
                  </p>
                </div>
                <div v-else class="space-y-3 sm:space-y-4">
                  <div
                    v-for="request in sortedLeaveRequests"
                    :key="request.id"
                    :class="[
                      'cursor-pointer transition-all duration-200',
                      needsLeaveAction(request) ? 'animate-pulse-soft' : '',
                    ]"
                    @click="showLeaveDetails(request)"
                  >
                    <!-- Mobile-Optimized Leave Request Card -->
                    <div
                      :class="[
                        'bg-white rounded-xl shadow-sm border transition-all duration-200',
                        needsLeaveAction(request)
                          ? 'border-orange-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                          : 'border-gray-200 hover:shadow-md hover:border-gray-300',
                      ]"
                    >
                      <!-- Action Required Banner -->
                      <div
                        v-if="needsLeaveAction(request)"
                        class="bg-gradient-to-r from-orange-100 to-red-100 border-b border-orange-200 px-3 sm:px-4 py-2 rounded-t-xl"
                      >
                        <div class="flex items-center space-x-2">
                          <UIcon
                            name="i-heroicons-exclamation-triangle"
                            class="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0"
                          />
                          <span
                            class="text-xs sm:text-sm font-semibold text-orange-800"
                          >
                            ACTION REQUIRED - Your approval needed
                          </span>
                        </div>
                      </div>

                      <!-- Card Content with Status Background -->
                      <div
                        :class="[
                          'transition-all duration-200',
                          getCardStatusClasses(request.status),
                          // Mobile: stack vertically, Desktop: horizontal
                          'flex flex-col md:flex-row md:items-start md:justify-between',
                          // Responsive padding
                          'p-3 md:p-6',
                          // Responsive spacing
                          'space-y-3 md:space-y-0',
                        ]"
                      >
                        <!-- Mobile: Avatar + Name Row, Desktop: Left Section -->
                        <div
                          class="flex items-start space-x-3 md:space-x-4 flex-1 min-w-0"
                        >
                          <!-- Employee Avatar -->
                          <div class="flex-shrink-0">
                            <div
                              :class="[
                                'rounded-full flex items-center justify-center text-white font-bold',
                                needsLeaveAction(request)
                                  ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                  : 'bg-gradient-to-r from-emerald-500 to-blue-600',
                                // Responsive avatar size
                                'w-10 h-10 text-sm md:w-12 md:h-12 md:text-lg',
                              ]"
                            >
                            <span class="text-white font-medium">{{ getInitials(request.profiles?.full_name) }}</span>
                            </div>
                          </div>

                          <!-- Request Details -->
                          <div class="flex-1 min-w-0">
                            <!-- Employee Name + Department + Status -->
                            <div
                              class="flex flex-col md:flex-row md:items-center md:space-x-3 mb-2"
                            >
                              <h4
                                class="text-sm md:text-lg font-semibold text-gray-900 truncate"
                              >
                                {{ request.profiles?.full_name }}
                              </h4>
                              <span
                                class="text-xs md:text-sm text-gray-500 truncate"
                              >
                                {{ getEmployeeDepartment(request.employee_id) }}
                              </span>
                              <div class="mt-1 md:mt-0">
                                <UBadge
                                  :class="getStatusClasses(request.status)"
                                  variant="soft"
                                >
                                  {{ formatStatus(request.status) }}
                                </UBadge>
                              </div>
                            </div>

                            <!-- Leave Details Grid -->
                            <div
                              class="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-4 mb-2 md:mb-3"
                            >
                              <div>
                                <span
                                  class="text-xs md:text-sm font-medium text-gray-500"
                                >
                                  Leave Type:
                                </span>
                                <p
                                  class="text-xs md:text-sm text-gray-900 truncate"
                                >
                                  {{ request.leave_types?.leave_name || "N/A" }}
                                </p>
                              </div>
                              <div>
                                <span
                                  class="text-xs md:text-sm font-medium text-gray-500"
                                >
                                  Duration:
                                </span>
                                <p class="text-xs md:text-sm text-gray-900">
                                  {{ request.total_days || 0 }}
                                  {{
                                    (request.total_days || 0) === 1
                                      ? "day"
                                      : "days"
                                  }}
                                </p>
                              </div>
                              <div>
                                <span
                                  class="text-xs md:text-sm font-medium text-gray-500"
                                >
                                  From:
                                </span>
                                <p
                                  class="text-xs md:text-sm font-medium text-gray-900 truncate"
                                >
                                  {{ formatDate(request.start_date) }}
                                </p>
                              </div>
                              <div>
                                <span
                                  class="text-xs md:text-sm font-medium text-gray-500"
                                >
                                  To:
                                </span>
                                <p
                                  class="text-xs md:text-sm font-medium text-gray-900 truncate"
                                >
                                  {{ formatDate(request.end_date) }}
                                </p>
                              </div>
                            </div>

                            <!-- Reason -->
                            <div v-if="request.reason" class="mb-2 md:mb-3">
                              <span
                                class="text-xs md:text-sm font-medium text-gray-500"
                              >
                                Reason:
                              </span>
                              <p
                                class="text-xs md:text-sm text-gray-900 line-clamp-2"
                              >
                                {{ request.reason }}
                              </p>
                            </div>

                            <!-- Approval Progress Bar -->
                            <div
                              v-if="request.status === 'pending'"
                              class="flex items-center space-x-2"
                            >
                              <span class="text-xs font-semibold text-gray-600">
                                APPROVAL:
                              </span>
                              <div
                                class="flex-1 bg-gray-200 rounded-full h-1.5 md:h-2"
                              >
                                <div
                                  :class="[
                                    'h-1.5 md:h-2 rounded-full transition-all duration-500',
                                    needsLeaveAction(request)
                                      ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                      : 'bg-gradient-to-r from-emerald-500 to-blue-600',
                                  ]"
                                  :style="{
                                    width: `${getApprovalProgress(request)}%`,
                                  }"
                                />
                              </div>
                              <span class="text-xs font-bold text-gray-600">
                                {{ getApprovedLevels(request) }}/{{
                                  request.approval_levels || 1
                                }}
                              </span>
                            </div>
                          </div>
                        </div>

                        <!-- Applied Date -->
                        <div
                          class="text-center md:text-right border-t pt-2 md:border-t-0 md:pt-0 md:flex-shrink-0 md:ml-4"
                        >
                          <p class="text-xs text-gray-500">Applied</p>
                          <p
                            class="text-xs md:text-sm font-medium text-gray-900"
                          >
                            {{ formatDateTime(request.created_at) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Regularization Details Modal with Flutter-like Details -->
    <transition name="modal-overlay" appear>
      <div
        v-if="showRegularizationModal"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="showRegularizationModal = false"
      >
        <transition name="modal-content" appear>
          <div
            v-if="showRegularizationModal"
            class="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <!-- Modal Header -->
            <div
              class="relative bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white"
            >
              <div class="absolute inset-0 bg-white/10 backdrop-blur-sm" />
              <div class="relative flex items-center justify-between">
                <h3 class="text-xl font-bold">Regularization Details</h3>
                <button
                  class="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
                  @click="showRegularizationModal = false"
                >
                  <UIcon name="i-heroicons-x-mark" class="h-6 w-6" />
                </button>
              </div>
            </div>

            <!-- Modal Content -->
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div v-if="selectedRegularization" class="space-y-6">
                <!-- Header with Date and Status -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="p-2 bg-blue-100 rounded-xl">
                      <UIcon
                        :name="
                          getRegularizationTypeIcon(
                            selectedRegularization.regularization_type
                          )
                        "
                        class="h-6 w-6 text-blue-600"
                      />
                    </div>
                    <div>
                      <h4 class="text-lg font-bold text-gray-900">
                        {{
                          formatRegularizationType(
                            selectedRegularization.regularization_type
                          )
                        }}
                      </h4>
                      <p class="text-sm text-gray-600">
                        Date:
                        {{
                          formatDate(selectedRegularization.requested_punch_in)
                        }}
                      </p>
                    </div>
                  </div>
                  <UBadge
                    :class="getStatusClasses(selectedRegularization.status)"
                    variant="soft"
                    size="lg"
                  >
                    {{ selectedRegularization.status?.toUpperCase() }}
                  </UBadge>
                </div>

                <!-- Employee Info -->
                <div class="relative">
                  <div
                    class="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-20"
                  />
                  <div
                    class="relative flex items-center space-x-4 p-4 bg-white/80 backdrop-blur-lg border border-gray-200/50 rounded-xl"
                  >
                    <div
                      class="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <span class="text-white font-bold text-lg">
                        {{
                          getInitials(
                            selectedRegularization.profiles?.full_name
                          )
                        }}
                      </span>
                    </div>
                    <div>
                      <h4 class="font-bold text-gray-900 text-lg">
                        {{ selectedRegularization.profiles?.full_name }}
                      </h4>
                      <p class="text-sm text-gray-600 font-medium">
                        {{ selectedRegularization.profiles?.employee_code }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{
                          getEmployeeDepartment(
                            selectedRegularization.employee_id
                          )
                        }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Basic Information Section -->
                <div class="space-y-4">
                  <h5
                    class="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2"
                  >
                    Basic Information
                  </h5>
                  <div
                    class="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 space-y-3"
                  >
                    <!-- Type -->
                    <div class="flex justify-between items-center py-2">
                      <span class="text-sm font-medium text-gray-600"
                        >Type:</span
                      >
                      <span class="text-gray-900 font-semibold">{{
                        formatRegularizationType(
                          selectedRegularization.regularization_type
                        )
                      }}</span>
                    </div>
                    <!-- Applied On -->
                    <div class="flex justify-between items-center py-2">
                      <span class="text-sm font-medium text-gray-600"
                        >Applied On:</span
                      >
                      <span class="text-gray-900">{{
                        formatDateTime(selectedRegularization.created_at)
                      }}</span>
                    </div>
                    <!-- Reason -->
                    <div class="py-2">
                      <span class="text-sm font-medium text-gray-600 block mb-1"
                        >Reason:</span
                      >
                      <span class="text-gray-900">{{
                        selectedRegularization.reason || "N/A"
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Time Details Section -->
                <div class="space-y-4">
                  <h5
                    class="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2"
                  >
                    Time Details
                  </h5>
                  <div class="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4">
                    <!-- Punch In Comparison -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span
                          class="text-sm font-medium text-gray-600 block mb-1"
                          >Original Punch In:</span
                        >
                        <span class="text-gray-900">{{
                          formatTime(selectedRegularization.original_punch_in)
                        }}</span>
                      </div>
                      <div>
                        <span
                          class="text-sm font-medium text-gray-600 block mb-1"
                          >Original Punch Out:</span
                        >
                        <span class="text-gray-900">{{
                          formatTime(selectedRegularization.original_punch_out)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Additional Details (Conditional) -->
                <div
                  v-if="hasAdditionalDetails(selectedRegularization)"
                  class="space-y-4"
                >
                  <h5
                    class="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2"
                  >
                    Additional Details
                  </h5>
                  <div
                    class="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 space-y-3"
                  >
                    <!-- Punch In Location -->
                    <div
                      v-if="selectedRegularization.punch_in_location"
                      class="flex justify-between items-center py-2"
                    >
                      <span class="text-sm font-medium text-gray-600"
                        >Punch In Location:</span
                      >
                      <button
                        class="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                        @click="
                          openLocation(selectedRegularization.punch_in_location)
                        "
                      >
                        <UIcon name="i-heroicons-map-pin" class="h-4 w-4" />
                        <span class="underline">{{
                          selectedRegularization.punch_in_location
                        }}</span>
                        <UIcon
                          name="i-heroicons-arrow-top-right-on-square"
                          class="h-3 w-3"
                        />
                      </button>
                    </div>
                    <!-- Punch Out Location -->
                    <div
                      v-if="selectedRegularization.punch_out_location"
                      class="flex justify-between items-center py-2"
                    >
                      <span class="text-sm font-medium text-gray-600"
                        >Punch Out Location:</span
                      >
                      <button
                        class="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                        @click="
                          openLocation(
                            selectedRegularization.punch_out_location
                          )
                        "
                      >
                        <UIcon name="i-heroicons-map-pin" class="h-4 w-4" />
                        <span class="underline">{{
                          selectedRegularization.punch_out_location
                        }}</span>
                        <UIcon
                          name="i-heroicons-arrow-top-right-on-square"
                          class="h-3 w-3"
                        />
                      </button>
                    </div>
                    <!-- Regularized Status -->
                    <div
                      v-if="selectedRegularization.is_regularized"
                      class="flex justify-between items-center py-2"
                    >
                      <span class="text-sm font-medium text-gray-600"
                        >Regularized:</span
                      >
                      <span class="text-green-600 font-semibold">Yes</span>
                    </div>
                    <!-- Weekend Status -->
                    <div
                      v-if="selectedRegularization.is_weekend"
                      class="flex justify-between items-center py-2"
                    >
                      <span class="text-sm font-medium text-gray-600"
                        >Weekend:</span
                      >
                      <span class="text-orange-600 font-semibold">Yes</span>
                    </div>
                    <!-- Holiday Status -->
                    <div
                      v-if="selectedRegularization.is_holiday"
                      class="flex justify-between items-center py-2"
                    >
                      <span class="text-sm font-medium text-gray-600"
                        >Holiday:</span
                      >
                      <span class="text-purple-600 font-semibold">Yes</span>
                    </div>
                    <!-- Remarks -->
                    <div v-if="selectedRegularization.remarks" class="py-2">
                      <span class="text-sm font-medium text-gray-600 block mb-1"
                        >Remarks:</span
                      >
                      <span class="text-gray-900">{{
                        selectedRegularization.remarks
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Comments Section -->
                <!-- <div class="space-y-4">
                  <div class="border-t border-gray-200 pt-4">
                    <div class="flex items-center justify-between mb-3">
                      <h5 class="text-sm font-semibold text-gray-700">
                        Comment
                      </h5>
                      <div
                        v-if="selectedRegularization.comment"
                        class="flex space-x-2"
                      >
                        <button
                          class="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          @click="editComment(selectedRegularization)"
                        >
                          Edit
                        </button>
                        <button
                          class="text-red-600 hover:text-red-800 text-xs font-medium"
                          @click="deleteComment(selectedRegularization)"
                        >
                          Delete
                        </button>
                      </div>
                      <button
                        v-else
                        class="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center space-x-1"
                        @click="addComment(selectedRegularization)"
                      >
                        <UIcon name="i-heroicons-plus" class="h-3 w-3" />
                        <span>Add Comment</span>
                      </button>
                    </div>
                    <div
                      class="bg-gray-100 rounded-lg p-3 border border-gray-200"
                    >
                      <p class="text-sm text-gray-700">
                        {{
                          selectedRegularization.comment || "No comment added"
                        }}
                      </p>
                    </div>
                  </div>
                </div> -->

                <!-- Approval Levels Progress (if applicable) -->
                <div
                  v-if="
                    selectedRegularization.approval_levels &&
                    selectedRegularization.approval_levels > 0
                  "
                  class="space-y-4"
                >
                  <h5
                    class="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2"
                  >
                    Approval Progress
                  </h5>
                  <div class="space-y-3">
                    <div
                      v-for="level in selectedRegularization.approval_levels"
                      :key="level"
                      class="bg-white rounded-lg p-4 border border-gray-300 shadow-sm"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                          <div
                            :class="[
                              'w-8 h-8 rounded-full flex items-center justify-center',
                              getApprovalLevelStatus(
                                selectedRegularization,
                                level
                              ) === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : getApprovalLevelStatus(
                                    selectedRegularization,
                                    level
                                  ) === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : getApprovalLevelStatus(
                                    selectedRegularization,
                                    level
                                  ) === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-200 text-gray-700',
                            ]"
                          >
                            <UIcon
                              :name="
                                getApprovalLevelStatus(
                                  selectedRegularization,
                                  level
                                ) === 'approved'
                                  ? 'i-heroicons-check'
                                  : getApprovalLevelStatus(
                                      selectedRegularization,
                                      level
                                    ) === 'rejected'
                                  ? 'i-heroicons-x-mark'
                                  : getApprovalLevelStatus(
                                      selectedRegularization,
                                      level
                                    ) === 'pending'
                                  ? 'i-heroicons-clock'
                                  : 'i-heroicons-minus'
                              "
                              class="h-4 w-4"
                            />
                          </div>
                          <span class="text-sm font-semibold text-gray-900"
                            >Level {{ level }} Approver</span
                          >
                        </div>
                        <UBadge
                          :class="
                            getApprovalLevelStatus(
                              selectedRegularization,
                              level
                            ) === 'approved'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : getApprovalLevelStatus(
                                  selectedRegularization,
                                  level
                                ) === 'rejected'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : getApprovalLevelStatus(
                                  selectedRegularization,
                                  level
                                ) === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          "
                          variant="soft"
                          size="xs"
                        >
                          {{
                            getApprovalLevelStatus(
                              selectedRegularization,
                              level
                            ).toUpperCase()
                          }}
                        </UBadge>
                      </div>
                      <!-- Action date and comments if available -->
                      <!-- <div
                        v-if="
                          selectedRegularization[`level_${level}_action_at`]
                        "
                        class="mt-3 text-sm text-gray-800 font-medium"
                      >
                        Action taken:
                        {{
                          formatDateTime(
                            selectedRegularization[`level_${level}_action_at`]
                          )
                        }}
                      </div> -->
                      <div
                        v-if="selectedRegularization[`level_${level}_comments`]"
                        class="mt-2 text-sm text-gray-900 bg-gray-50 p-2 rounded border-l-3 border-blue-400"
                      >
                        <span class="font-semibold text-gray-700"
                          >Comments:</span
                        >
                        {{ selectedRegularization[`level_${level}_comments`] }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div
                  v-if="canTakeAction(selectedRegularization)"
                  class="flex space-x-4 pt-6 border-t border-gray-200"
                >
                  <button
                    class="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    :disabled="isProcessing"
                    @click="approveRequest(selectedRegularization)"
                  >
                    <UIcon
                      v-if="!isProcessing"
                      name="i-heroicons-check"
                      class="h-5 w-5"
                    />
                    <div
                      v-else
                      class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                    />
                    <span>{{
                      isProcessing
                        ? "Processing..."
                        : `Take Level ${selectedLevel} Action`
                    }}</span>
                  </button>
                  <button
                    class="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    :disabled="isProcessing"
                    @click="rejectRequest(selectedRegularization)"
                  >
                    <UIcon
                      v-if="!isProcessing"
                      name="i-heroicons-x-mark"
                      class="h-5 w-5"
                    />
                    <div
                      v-else
                      class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                    />
                    <span>{{ isProcessing ? "Processing..." : "Reject" }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Leave Details Modal with Flutter-like Details -->
    <transition name="modal-overlay" appear>
      <div
        v-if="showLeaveModal"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="showLeaveModal = false"
      >
        <transition name="modal-content" appear>
          <div
            v-if="showLeaveModal"
            class="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <!-- Modal Header -->
            <div
              class="relative bg-gradient-to-r from-emerald-500 to-blue-600 px-6 py-4 text-white"
            >
              <div class="absolute inset-0 bg-white/10 backdrop-blur-sm" />
              <div class="relative flex items-center justify-between">
                <h3 class="text-xl font-bold">Leave Request Details</h3>
                <button
                  class="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
                  @click="showLeaveModal = false"
                >
                  <UIcon name="i-heroicons-x-mark" class="h-6 w-6" />
                </button>
              </div>
            </div>

            <!-- Modal Content -->
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div v-if="selectedLeave" class="space-y-6">
                <!-- Header with Leave Type and Status -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="p-2 bg-emerald-100 rounded-xl">
                      <UIcon
                        name="i-heroicons-calendar-days"
                        class="h-6 w-6 text-emerald-600"
                      />
                    </div>
                    <div>
                      <h4 class="text-lg font-bold text-gray-900">
                        {{
                          selectedLeave.leave_types?.leave_name ||
                          "Leave Request"
                        }}
                      </h4>
                      <p class="text-sm text-gray-600">
                        {{ selectedLeave.total_days || 0 }}
                        {{
                          (selectedLeave.total_days || 0) === 1 ? "day" : "days"
                        }}
                        • {{ formatDate(selectedLeave.start_date) }} to
                        {{ formatDate(selectedLeave.end_date) }}
                      </p>
                    </div>
                  </div>
                  <UBadge
                    :class="getStatusClasses(selectedLeave.status)"
                    variant="soft"
                    size="lg"
                  >
                    {{ selectedLeave.status?.toUpperCase() }}
                  </UBadge>
                </div>

                <!-- Employee Info -->
                <div class="relative">
                  <div
                    class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl blur opacity-20"
                  />
                  <div
                    class="relative flex items-center space-x-4 p-4 bg-white/80 backdrop-blur-lg border border-gray-200/50 rounded-xl"
                  >
                    <div
                      class="w-14 h-14 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <span class="text-white font-bold text-lg">
                        {{ getInitials(selectedLeave.profiles?.full_name) }}
                      </span>
                    </div>
                    <div>
                      <h4 class="font-bold text-gray-900 text-lg">
                        {{ selectedLeave.profiles?.full_name }}
                      </h4>
                      <p class="text-sm text-gray-600 font-medium">
                        {{ selectedLeave.profiles?.employee_code }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ getEmployeeDepartment(selectedLeave.employee_id) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Basic Information Section -->
                <div class="space-y-4">
                  <h5
                    class="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2"
                  >
                    Leave Information
                  </h5>
                  <div
                    class="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 space-y-3"
                  >
                    <!-- Leave Type -->
                    <div class="flex justify-between items-center py-2">
                      <span class="text-sm font-medium text-gray-600"
                        >Leave Type:</span
                      >
                      <span class="text-gray-900 font-semibold">{{
                        selectedLeave.leave_types?.leave_name || "N/A"
                      }}</span>
                    </div>
                    <!-- Applied On -->
                    <div class="flex justify-between items-center py-2">
                      <span class="text-sm font-medium text-gray-600"
                        >Applied On:</span
                      >
                      <span class="text-gray-900">{{
                        formatDateTime(selectedLeave.created_at)
                      }}</span>
                    </div>
                    <!-- Duration -->
                    <div class="flex justify-between items-center py-2">
                      <span class="text-sm font-medium text-gray-600"
                        >Total Days:</span
                      >
                      <span class="text-gray-900 font-bold"
                        >{{ selectedLeave.total_days || 0 }}
                        {{
                          (selectedLeave.total_days || 0) === 1 ? "day" : "days"
                        }}</span
                      >
                    </div>
                  </div>
                </div>

                <!-- Leave Duration Section -->
                <div class="space-y-4">
                  <h5
                    class="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2"
                  >
                    Duration Details
                  </h5>
                  <div class="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <span
                          class="text-sm font-medium text-gray-600 block mb-1"
                          >Start Date:</span
                        >
                        <span class="text-emerald-700 font-semibold">{{
                          formatDate(selectedLeave.start_date)
                        }}</span>
                      </div>
                      <div>
                        <span
                          class="text-sm font-medium text-gray-600 block mb-1"
                          >End Date:</span
                        >
                        <span class="text-emerald-700 font-semibold">{{
                          formatDate(selectedLeave.end_date)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Reason Section -->
                <div class="space-y-3">
                  <h5
                    class="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2"
                  >
                    Reason
                  </h5>
                  <div class="relative">
                    <div
                      class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl blur opacity-10"
                    />
                    <div
                      class="relative p-4 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl border border-gray-200/50"
                    >
                      <p class="text-gray-900 leading-relaxed">
                        {{ selectedLeave.reason || "No reason provided" }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Approval Levels Progress (if applicable) -->
                <div
                  v-if="
                    selectedLeave.approval_levels &&
                    selectedLeave.approval_levels > 0
                  "
                  class="space-y-4"
                >
                  <h5
                    class="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2"
                  >
                    Approval Progress
                  </h5>
                  <div class="space-y-3">
                    <div
                      v-for="level in selectedLeave.approval_levels"
                      :key="level"
                      class="bg-white rounded-lg p-4 border border-gray-300 shadow-sm"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                          <div
                            :class="[
                              'w-8 h-8 rounded-full flex items-center justify-center',
                              getApprovalLevelStatus(selectedLeave, level) ===
                              'approved'
                                ? 'bg-green-100 text-green-700'
                                : getApprovalLevelStatus(
                                    selectedLeave,
                                    level
                                  ) === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : getApprovalLevelStatus(
                                    selectedLeave,
                                    level
                                  ) === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-200 text-gray-700',
                            ]"
                          >
                            <UIcon
                              :name="
                                getApprovalLevelStatus(selectedLeave, level) ===
                                'approved'
                                  ? 'i-heroicons-check'
                                  : getApprovalLevelStatus(
                                      selectedLeave,
                                      level
                                    ) === 'rejected'
                                  ? 'i-heroicons-x-mark'
                                  : getApprovalLevelStatus(
                                      selectedLeave,
                                      level
                                    ) === 'pending'
                                  ? 'i-heroicons-clock'
                                  : 'i-heroicons-minus'
                              "
                              class="h-4 w-4"
                            />
                          </div>
                          <span class="text-sm font-semibold text-gray-900"
                            >Level {{ level }} Approver</span
                          >
                        </div>
                        <UBadge
                          :class="
                            getApprovalLevelStatus(selectedLeave, level) ===
                            'approved'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : getApprovalLevelStatus(selectedLeave, level) ===
                                'rejected'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : getApprovalLevelStatus(selectedLeave, level) ===
                                'pending'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          "
                          variant="soft"
                          size="xs"
                        >
                          {{
                            getApprovalLevelStatus(
                              selectedLeave,
                              level
                            ).toUpperCase()
                          }}
                        </UBadge>
                      </div>
                      <!-- Action date and comments if available -->
                      <div
                        v-if="selectedLeave[`level_${level}_action_at`]"
                        class="mt-3 text-sm text-gray-800 font-medium"
                      >
                        Action taken:
                        {{
                          formatDateTime(
                            selectedLeave[`level_${level}_action_at`]
                          )
                        }}
                      </div>
                      <div
                        v-if="selectedLeave[`level_${level}_comments`]"
                        class="mt-2 text-sm text-gray-900 bg-gray-50 p-2 rounded border-l-3 border-blue-400"
                      >
                        <span class="font-semibold text-gray-700"
                          >Comments:</span
                        >
                        {{ selectedLeave[`level_${level}_comments`] }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div
                  v-if="canTakeAction(selectedLeave)"
                  class="flex space-x-4 pt-6 border-t border-gray-200"
                >
                  <button
                    :disabled="isProcessing"
                    class="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    @click="approveRequest(selectedLeave)"
                  >
                    <UIcon
                      v-if="!isProcessing"
                      name="i-heroicons-check"
                      class="h-5 w-5"
                    />
                    <div
                      v-else
                      class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                    />
                    <span>{{
                      isProcessing
                        ? "Processing..."
                        : `Take Level ${selectedLevelForLeave} Action`
                    }}</span>
                  </button>
                  <button
                    :disabled="isProcessing"
                    class="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    @click="rejectRequest(selectedLeave)"
                  >
                    <UIcon
                      v-if="!isProcessing"
                      name="i-heroicons-x-mark"
                      class="h-5 w-5"
                    />
                    <div
                      v-else
                      class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                    />
                    <span>{{ isProcessing ? "Processing..." : "Reject" }}</span>
                  </button>
                </div>
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
const isRefreshing = ref(false);
const isProcessing = ref(false);
const searchQuery = ref("");
const activeTab = ref("regularizations");

// Modal state
const showRegularizationModal = ref(false);
const showLeaveModal = ref(false);
const selectedRegularization = ref(null);
const selectedLeave = ref(null);
const selectedLevel = ref(0);
const selectedLevelForLeave = ref(0);

// Data
const teamMembers = ref([]);
const regularizationRequests = ref([]);
const leaveRequests = ref([]);
const departmentsCache = ref(new Map());
const employeeDepartmentMap = ref(new Map());

// CORRECTED: Tab configuration with proper count properties
const tabs = computed(() => [
  {
    id: "regularizations",
    name: "Regularizations",
    icon: "i-heroicons-clipboard-document-list",
    count: pendingRegularizationCount.value,
  },
  {
    id: "leave",
    name: "Leave Requests",
    icon: "i-heroicons-calendar-days",
    count: pendingLeaveCount.value,
  },
]);

// CORRECTED: Count computations using proper function names
const pendingRegularizationCount = computed(() => {
  return regularizationRequests.value.filter(
    (req) => req.status === "pending" && needsRegularizationAction(req)
  ).length;
});

const pendingLeaveCount = computed(() => {
  return leaveRequests.value.filter(
    (req) => req.status === "pending" && needsLeaveAction(req)
  ).length;
});

const filteredRegularizationRequests = computed(() => {
  if (!searchQuery.value) return regularizationRequests.value;

  const query = searchQuery.value.toLowerCase();
  return regularizationRequests.value.filter((request) => {
    const employeeName = request.profiles?.full_name?.toLowerCase() || "";
    const employeeCode = request.profiles?.employee_code?.toLowerCase() || "";
    const status = request.status?.toLowerCase() || "";
    const requestType = request.regularization_type?.toLowerCase() || "";
    const reason = request.reason?.toLowerCase() || "";

    return (
      employeeName.includes(query) ||
      employeeCode.includes(query) ||
      status.includes(query) ||
      requestType.includes(query) ||
      reason.includes(query)
    );
  });
});

const filteredLeaveRequests = computed(() => {
  if (!searchQuery.value) return leaveRequests.value;

  const query = searchQuery.value.toLowerCase();
  return leaveRequests.value.filter((request) => {
    const employeeName = request.profiles?.full_name?.toLowerCase() || "";
    const employeeCode = request.profiles?.employee_code?.toLowerCase() || "";
    const status = request.status?.toLowerCase() || "";
    const leaveType = request.leave_types?.leave_name?.toLowerCase() || "";
    const reason = request.reason?.toLowerCase() || "";

    return (
      employeeName.includes(query) ||
      employeeCode.includes(query) ||
      status.includes(query) ||
      leaveType.includes(query) ||
      reason.includes(query)
    );
  });
});

// CORRECTED: Sorted requests using proper sorting function
const sortedRegularizationRequests = computed(() => {
  return sortRequestsByActionNeeded(
    filteredRegularizationRequests.value,
    needsRegularizationAction
  );
});

const sortedLeaveRequests = computed(() => {
  return sortRequestsByActionNeeded(
    filteredLeaveRequests.value,
    needsLeaveAction
  );
});

// Functions
const goBack = () => {
  router.back();
};

const refreshData = async () => {
  isRefreshing.value = true;
  try {
    await loadData();
    toast.add({
      title: "Data refreshed",
      description: "Team requests have been updated",
      color: "green",
    });
  } catch (error) {
    toast.add({
      title: "Refresh failed",
      description: "Failed to refresh team requests",
      color: "red",
    });
  } finally {
    isRefreshing.value = false;
  }
};

const loadData = async () => {
  try {
    await loadDepartmentHierarchy();
    await loadTeamMembers();
    await Promise.all([loadRegularizationRequests(), loadLeaveRequests()]);
  } catch (error) {
    console.error("Error loading team requests data:", error);
    throw error;
  }
};

const loadDepartmentHierarchy = async () => {
  const { data: allDepartments } = await supabase
    .from("departments")
    .select("id, name, manager_id, parent_id")
    .eq("is_active", true);

  // Cache all departments for quick lookup
  allDepartments?.forEach((dept) => {
    departmentsCache.value.set(dept.id, dept);
  });
};

const loadTeamMembers = async () => {
  // Get all departments managed by current user including sub-departments
  const allDepartmentIds = getAllManagedDepartmentIds(
    userProfileStore.profile?.id
  );

  if (allDepartmentIds.length === 0) {
    teamMembers.value = [];
    return;
  }

  const { data: membersResponse } = await supabase
    .from("profiles")
    .select(
      `
      id, employee_code, full_name, email, department,
      departments!profiles_department_fkey(id, name),
      positions(designation)
    `
    )
    .in("department", allDepartmentIds)
    .eq("is_active", true);

  teamMembers.value = membersResponse || [];

  // Build employee-department mapping for quick lookup
  teamMembers.value.forEach((member) => {
    employeeDepartmentMap.value.set(member.id, member.department);
  });
};

const loadRegularizationRequests = async () => {
  if (teamMembers.value.length === 0) return;

  const teamMemberIds = teamMembers.value.map((member) => member.id);

  const { data: response } = await supabase
    .from("attendance_regularizations")
    .select(
      `
      *,
      profiles!attendance_regularizations_employee_id_fkey(id, employee_code, full_name, position)
    `
    )
    .in("employee_id", teamMemberIds)
    .order("created_at", { ascending: false });

  regularizationRequests.value = response || [];
};

const loadLeaveRequests = async () => {
  if (teamMembers.value.length === 0) return;

  const teamMemberIds = teamMembers.value.map((member) => member.id);

  const { data: response } = await supabase
    .from("leave_applications")
    .select(
      `
      *,
      profiles!leave_applications_employee_id_fkey(id, employee_code, full_name, position),
      leave_types(leave_name, leave_code)
    `
    )
    .in("employee_id", teamMemberIds)
    .order("created_at", { ascending: false });

  leaveRequests.value = response || [];
};

// Helper functions from Flutter
const getAllManagedDepartmentIds = (managerId) => {
  const allDepartmentIds = new Set();

  // Get departments directly managed by this manager
  const directDepartments = Array.from(departmentsCache.value.values()).filter(
    (dept) => dept.manager_id === managerId
  );

  directDepartments.forEach((dept) => {
    allDepartmentIds.add(dept.id);
  });

  // Recursively get all sub-departments
  const getSubDepartments = (parentIds) => {
    if (parentIds.length === 0) return;

    const subDepartments = Array.from(departmentsCache.value.values()).filter(
      (dept) => parentIds.includes(dept.parent_id)
    );

    const subIds = subDepartments.map((dept) => dept.id);
    subIds.forEach((id) => allDepartmentIds.add(id));

    if (subIds.length > 0) {
      getSubDepartments(subIds);
    }
  };

  getSubDepartments(Array.from(allDepartmentIds));
  return Array.from(allDepartmentIds);
};

const calculateApprovalLevel = (employeeId) => {
  try {
    const employeeDepartmentId = employeeDepartmentMap.value.get(employeeId);
    if (!employeeDepartmentId) return 1;

    return getHierarchyLevelFromCache(
      employeeDepartmentId,
      userProfileStore.profile?.id,
      employeeId
    );
  } catch (error) {
    console.error("Error calculating approval level:", error);
    return 1;
  }
};

const getHierarchyLevelFromCache = (
  employeeDepartmentId,
  currentManagerId,
  employeeId
) => {
  let level = 1;
  let currentDepartmentId = employeeDepartmentId;

  while (true) {
    const department = departmentsCache.value.get(currentDepartmentId);
    if (!department) break;

    const departmentManagerId = department.manager_id;

    // If current department's manager is the current user, return the level
    if (departmentManagerId === currentManagerId) return level;

    // If the manager is the employee themselves, decrement level
    if (departmentManagerId === employeeId) level--;

    // If there's a manager but it's not the current user, increment level
    if (departmentManagerId) level++;

    // Move to parent department
    const parentId = department.parent_id;
    if (!parentId) break;
    currentDepartmentId = parentId;
  }

  return level;
};

// CORRECTED: Function names matching the reference code
const needsRegularizationAction = (request) => {
  const status = request.status || "pending";
  const totalLevels = request.approval_levels || 1;
  const employeeId = request.employee_id;

  if (status !== "pending" || totalLevels === 0) return false;

  const currentManagerLevel = calculateApprovalLevel(employeeId);

  // Don't show action needed if manager level is above approval levels
  if (currentManagerLevel > totalLevels) return false;

  // Check if all previous levels are approved/bypassed
  let allPreviousLevelsCompleted = true;
  for (let i = 1; i < currentManagerLevel; i++) {
    const levelStatus = request[`level_${i}_status`];
    if (levelStatus !== "approved" && levelStatus !== "bypassed") {
      allPreviousLevelsCompleted = false;
      break;
    }
  }

  // Check if current manager's level is pending
  const currentLevelStatus = request[`level_${currentManagerLevel}_status`];
  const isCurrentLevelPending =
    currentLevelStatus === "pending" ||
    currentLevelStatus === null ||
    currentLevelStatus?.toString() === "";

  return (
    allPreviousLevelsCompleted &&
    isCurrentLevelPending &&
    userProfileStore.profile?.id !== employeeId
  );
};

const needsLeaveAction = (request) => {
  const status = request.status || "pending";
  const totalLevels = request.approval_levels || 1;
  const employeeId = request.employee_id;

  if (status !== "pending" || totalLevels === 0) return false;

  const currentManagerLevel = calculateApprovalLevel(employeeId);

  // Don't show action needed if manager level is above approval levels
  if (currentManagerLevel > totalLevels) return false;

  // Check if all previous levels are approved/bypassed
  let allPreviousLevelsCompleted = true;
  for (let i = 1; i < currentManagerLevel; i++) {
    const levelStatus = request[`level_${i}_status`];
    if (levelStatus !== "approved" && levelStatus !== "bypassed") {
      allPreviousLevelsCompleted = false;
      break;
    }
  }

  // Check if current manager's level is pending
  const currentLevelStatus = request[`level_${currentManagerLevel}_status`];
  const isCurrentLevelPending =
    currentLevelStatus === "pending" ||
    currentLevelStatus === null ||
    currentLevelStatus?.toString() === "";

  return (
    allPreviousLevelsCompleted &&
    isCurrentLevelPending &&
    userProfileStore.profile?.id !== employeeId
  );
};

// CORRECTED: Sorting function that puts action-required requests first
const sortRequestsByActionNeeded = (requests, needsActionChecker) => {
  const actionNeeded = [];
  const noActionNeeded = [];

  requests.forEach((request) => {
    if (needsActionChecker(request)) {
      actionNeeded.push(request);
    } else {
      noActionNeeded.push(request);
    }
  });

  // Sort both arrays by created_at (newest first)
  const sortByDate = (a, b) => new Date(b.created_at) - new Date(a.created_at);
  actionNeeded.sort(sortByDate);
  noActionNeeded.sort(sortByDate);

  // Return action needed first, then others
  return [...actionNeeded, ...noActionNeeded];
};

// Progress calculation functions
const getApprovalProgress = (request) => {
  const totalLevels = request.approval_levels || 1;
  const approvedLevels = getApprovedLevels(request);
  return Math.round((approvedLevels / totalLevels) * 100);
};

const getApprovedLevels = (request) => {
  let approvedLevels = 0;
  const totalLevels = request.approval_levels || 1;

  for (let i = 1; i <= totalLevels; i++) {
    const levelStatus = request[`level_${i}_status`];
    if (levelStatus === "approved" || levelStatus === "bypassed") {
      approvedLevels++;
    }
  }

  return approvedLevels;
};

// Modal functions
// Update your existing showRegularizationDetails function
const showRegularizationDetails = (request) => {
  selectedRegularization.value = request;
  selectedLevel.value = calculateApprovalLevel(request.employee_id); // Calculate level when showing modal
  showRegularizationModal.value = true;
};

// Update your existing showLeaveDetails function
const showLeaveDetails = (request) => {
  selectedLeave.value = request;
  selectedLevelForLeave.value = calculateApprovalLevel(request.employee_id); // Calculate level when showing modal
  showLeaveModal.value = true;
};

// CORRECTED: Single canTakeAction function
const canTakeAction = (request) => {
  if (activeTab.value === "leave") {
    return canTakeManagerAction(request);
  } else {
    return canTakeManagerAction(request);
  }
};

// Updated function to allow higher-level managers to take action
const canTakeManagerAction = (request) => {
  const status = request.status || "pending";
  const totalLevels = request.approval_levels || 0;
  const employeeId = request.employee_id;

  // Check if in terminal state
  const terminalStates = ["rejected", "cancelled", "withdrawn", "approved"];
  const isTerminalState = terminalStates.includes(status.toLowerCase());
  if (isTerminalState) return false;

  const currentManagerLevel = calculateApprovalLevel(employeeId);

  // Must be valid level (1-3) as per Flutter logic
  if (currentManagerLevel <= 0 || currentManagerLevel > 3) return false;

  // Cannot approve own request
  if (userProfileStore.profile?.id === employeeId) return false;

  // Check if any lower level has rejected
  let isRejectedAtLowerLevel = false;
  for (let i = 1; i < currentManagerLevel; i++) {
    const lowerLevelStatus = request[`level_${i}_status`];
    if (lowerLevelStatus && lowerLevelStatus.toLowerCase() === "rejected") {
      isRejectedAtLowerLevel = true;
      break;
    }
  }
  if (isRejectedAtLowerLevel) return false;

  // Get status at current manager level
  const currentLevelStatus =
    request[`level_${currentManagerLevel}_status`] || "pending";
  const isCurrentLevelPending =
    currentLevelStatus === "pending" ||
    currentLevelStatus === null ||
    currentLevelStatus === "";

  // Check if current level is pending and not bypassed
  return isCurrentLevelPending && currentLevelStatus !== "bypassed";
};

// CORRECTED: Single approval/rejection functions
const approveRequest = async (request) => {
  if (!request) return;

  isProcessing.value = true;
  try {
    if (activeTab.value === "leave") {
      // Handle leave approval - CORRECTED field names
      const level = calculateApprovalLevel(request.employee_id);
      const updateData = {
        [`level_${level}_status`]: "approved",
        [`level_${level}_approver_id`]: userProfileStore.profile?.id, // ✅ CORRECTED: approver_id (not approved_by)
        [`level_${level}_action_at`]: new Date().toISOString(), // ✅ CORRECTED: action_at (not approved_at)
      };

      // If this is the final level, update overall status
      if (level >= (request.approval_levels || 1)) {
        updateData.status = "approved";
        updateData.final_approved_at = new Date().toISOString(); // ✅ This field exists
      }

      const { error } = await supabase
        .from("leave_applications")
        .update(updateData)
        .eq("id", request.id);

      if (error) throw error;

      toast.add({
        title: "Leave request approved",
        color: "green",
      });
    } else {
      // Handle regularization approval - CORRECTED field names
      const level = calculateApprovalLevel(request.employee_id);
      const updateData = {
        [`level_${level}_status`]: "approved",
        [`level_${level}_approver_id`]: userProfileStore.profile?.id, // ✅ CORRECTED: approver_id (not approved_by)
        [`level_${level}_action_at`]: new Date().toISOString(), // ✅ CORRECTED: action_at (not approved_at)
      };

      // If this is the final level, update overall status
      if (level >= (request.approval_levels || 1)) {
        updateData.status = "approved";
        updateData.final_approved_at = new Date().toISOString(); // ✅ This field exists
      }

      const { error } = await supabase
        .from("attendance_regularizations")
        .update(updateData)
        .eq("id", request.id);

      if (error) throw error;

      toast.add({
        title: "Regularization request approved",
        color: "green",
      });
    }

    showRegularizationModal.value = false;
    showLeaveModal.value = false;
    await loadData();
  } catch (error) {
    console.error("Error approving request:", error);
    toast.add({
      title: "Error approving request",
      description: error.message,
      color: "red",
    });
  } finally {
    isProcessing.value = false;
  }
};

const rejectRequest = async (request) => {
  if (!request) return;

  isProcessing.value = true;
  try {
    if (activeTab.value === "leave") {
      // Handle leave rejection - CORRECTED field names
      const level = calculateApprovalLevel(request.employee_id);
      const updateData = {
        [`level_${level}_status`]: "rejected",
        [`level_${level}_approver_id`]: userProfileStore.profile?.id, // ✅ CORRECTED: approver_id (not approved_by)
        [`level_${level}_action_at`]: new Date().toISOString(), // ✅ CORRECTED: action_at (not approved_at)
        status: "rejected",
      };

      const { error } = await supabase
        .from("leave_applications")
        .update(updateData)
        .eq("id", request.id);

      if (error) throw error;

      toast.add({
        title: "Leave request rejected",
        color: "orange",
      });
    } else {
      // Handle regularization rejection - CORRECTED field names
      const level = calculateApprovalLevel(request.employee_id);
      const updateData = {
        [`level_${level}_status`]: "rejected",
        [`level_${level}_approver_id`]: userProfileStore.profile?.id, // ✅ CORRECTED: approver_id (not approved_by)
        [`level_${level}_action_at`]: new Date().toISOString(), // ✅ CORRECTED: action_at (not approved_at)
        status: "rejected",
      };

      const { error } = await supabase
        .from("attendance_regularizations")
        .update(updateData)
        .eq("id", request.id);

      if (error) throw error;

      toast.add({
        title: "Regularization request rejected",
        color: "orange",
      });
    }

    showRegularizationModal.value = false;
    showLeaveModal.value = false;
    await loadData();
  } catch (error) {
    console.error("Error rejecting request:", error);
    toast.add({
      title: "Error rejecting request",
      description: error.message,
      color: "red",
    });
  } finally {
    isProcessing.value = false;
  }
};

// Utility functions
const getInitials = (fullName) => {
  if (!fullName) return "?";
  const names = fullName.split(" ");
  return names.length > 1 ? names[0][0] + names[1][0] : names[0][0];
};

const getEmployeeDepartment = (employeeId) => {
  const member = teamMembers.value.find((m) => m.id === employeeId);
  return member?.departments?.name || "Unknown Department";
};

const formatRegularizationType = (type) => {
  if (!type) return "N/A";

  const types = {
    late_arrival: "Late Arrival",
    missed_swipe: "Missed Swipe",
    outdoor_client_visit: "Outdoor/Client Visit",
    other: "Other",
  };

  return (
    types[type] ||
    type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

const getStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium px-2.5 py-0.5 rounded-full text-xs";
    case "rejected":
      return "bg-red-100 text-red-800 border border-red-200 font-medium px-2.5 py-0.5 rounded-full text-xs";
    case "pending":
      return "bg-amber-100 text-amber-800 border border-amber-200 font-medium px-2.5 py-0.5 rounded-full text-xs";
    case "cancelled":
      return "bg-slate-100 text-slate-800 border border-slate-200 font-medium px-2.5 py-0.5 rounded-full text-xs";
    case "withdrawn":
      return "bg-slate-100 text-slate-800 border border-slate-200 font-medium px-2.5 py-0.5 rounded-full text-xs";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200 font-medium px-2.5 py-0.5 rounded-full text-xs";
  }
};

const getCardStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-green-50/60 border-green-100"; // Light green with subtle border
    case "rejected":
      return "bg-red-50/60 border-red-100"; // Light red with subtle border
    case "pending":
      return "bg-yellow-50/60 border-orange-100"; // Light orange with subtle border
    case "cancelled":
      return "bg-gray-50/60 border-gray-100"; // Light gray with subtle border
    case "withdrawn":
      return "bg-gray-50/60 border-gray-100"; // Light gray with subtle border
    default:
      return "bg-gray-50/40 border-gray-100"; // Default light gray
  }
};

// const getStatusColor = (status) => {
//   switch (status?.toLowerCase()) {
//     case "approved":
//       return "green";
//     case "rejected":
//       return "red";
//     case "pending":
//       return "yellow";
//     case "cancelled":
//       return "gray";
//     case "withdrawn":
//       return "gray";
//     default:
//       return "gray";
//   }
// };

const formatStatus = (status) => {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return "N/A";

  try {
    const date = new Date(dateTime);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Invalid date";
  }
};

const formatDate = (date) => {
  if (!date) return "N/A";

  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};

const formatTime = (dateTime) => {
  if (!dateTime) return "N/A";

  try {
    const date = new Date(dateTime);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Invalid time";
  }
};

// Initialize store and load data
onMounted(async () => {
  if (!userProfileStore.initialized) {
    await userProfileStore.initialize();
  }

  if (!userProfileStore.isManager) {
    toast.add({
      title: "Access denied",
      description: "You do not have permission to view team requests",
      color: "red",
    });
    router.push("/dashboard");
    return;
  }

  try {
    await loadData();
  } catch (error) {
    console.error("Failed to load team requests:", error);
    toast.add({
      title: "Loading failed",
      description: "Failed to load team requests data",
      color: "red",
    });
  } finally {
    isLoading.value = false;
  }
});

// Add this function to your existing script setup section
const getApprovalLevelStatus = (request, level) => {
  if (!request) return "pending";
  const status = request[`level_${level}_status`];
  if (!status || status === "") return "pending";
  return status;
};

// Additional utility functions for Flutter-like functionality
const getRegularizationTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case "late_arrival":
      return "i-heroicons-clock";
    case "missed_swipe":
      return "i-heroicons-finger-print";
    case "outdoor_client_visit":
      return "i-heroicons-map-pin";
    case "other":
      return "i-heroicons-exclamation-triangle";
    default:
      return "i-heroicons-clock";
  }
};

const hasAdditionalDetails = (request) => {
  return (
    request.punch_in_location ||
    request.punch_out_location ||
    request.is_regularized ||
    request.is_weekend ||
    request.is_holiday ||
    request.remarks
  );
};

const openLocation = (location) => {
  // Handle location opening - you can implement this to open maps
  if (location) {
    // Check if it's coordinates (lat,lng format)
    if (location.includes(",")) {
      const [lat, lng] = location.split(",").map((coord) => coord.trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        // Open coordinates in maps
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(url, "_blank");
        return;
      }
    }
    // Treat as address
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      location
    )}`;
    window.open(url, "_blank");
  }
};

// Page metadata
useHead({
  title: "Team Requests - Convise",
  meta: [
    {
      name: "description",
      content: "Manage team leave and regularization requests.",
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

.animate-pulse-soft {
  animation: pulse-soft 2s ease-in-out infinite;
}

@keyframes pulse-soft {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.bg-grid-slate-100 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(148 163 184 / 0.05)'%3e%3cpath d='m0 .5h32m-32 32v-32'/%3e%3c/svg%3e");
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Modal Transitions */
.modal-overlay-enter-active,
.modal-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.modal-overlay-enter-from,
.modal-overlay-leave-to {
  opacity: 0;
}

.modal-content-enter-active,
.modal-content-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-content-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-50px);
}

.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

/* Additional modal styling */
.modal-content-enter-active {
  transition-delay: 0.1s;
}

/* Custom button hover effects */
@keyframes buttonPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.animate-button-pulse:hover {
  animation: buttonPulse 0.6s ease-in-out;
}
</style>
