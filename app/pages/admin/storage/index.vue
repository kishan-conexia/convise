<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="p-6 sm:p-8 rounded-3xl bg-white/85 backdrop-blur-lg border border-gray-200/70 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-emerald-600" />
          <span>Secure Document Vault</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Documents & Storage Center
        </h1>
        <p class="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
          Manage employee compliance files, review Aadhaar, PAN, Passport and Bank proof submissions, and browse secured private storage files with signed URL access.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <button
          type="button"
          class="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold border border-gray-200 shadow-sm transition-all active:scale-95"
          :disabled="isRefreshing"
          @click="refreshCurrentTab"
        >
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-gray-500" :class="{ 'animate-spin': isRefreshing }" />
          <span>Refresh</span>
        </button>

        <button
          v-if="activeTab === 'vault'"
          type="button"
          class="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          @click="openAdminUploadModal"
        >
          <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4" />
          <span>Upload Staff Doc</span>
        </button>
      </div>
    </div>
 
    <!-- Storage Vault Status & Tab Navigation Bar -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Security Badge -->
      <div class="p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-gray-200/70 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-inner">
          <UIcon name="i-heroicons-lock-closed" class="w-6 h-6" />
        </div>
        <div class="min-w-0">
          <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Storage Repository</div>
          <div class="text-sm font-black text-gray-900 truncate">Employee Documents</div>
          <div class="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Private RLS Protected
          </div>
        </div>
      </div>

      <!-- Pending Verification Counter -->
      <div
        class="p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-gray-200/70 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-300 transition-all"
        @click="activeTab = 'approvals'"
      >
        <div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pending Approvals</div>
          <div class="text-2xl font-black text-amber-600 font-mono mt-0.5">{{ pendingRequestsCount }}</div>
          <div class="text-[11px] text-gray-500">Awaiting HR verification</div>
        </div>
        <div class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <UIcon name="i-heroicons-clock" class="w-5 h-5" />
        </div>
      </div>

      <!-- Verified Staff Count -->
      <div
        class="p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-gray-200/70 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-300 transition-all"
        @click="activeTab = 'vault'"
      >
        <div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Staff Records</div>
          <div class="text-2xl font-black text-blue-600 font-mono mt-0.5">{{ adminStore.employees.length || 0 }}</div>
          <div class="text-[11px] text-gray-500">Employee document vaults</div>
        </div>
        <div class="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
          <UIcon name="i-heroicons-user-group" class="w-5 h-5" />
        </div>
      </div>

      <!-- Signed URL Security Mode -->
      <div class="p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-gray-200/70 shadow-sm flex items-center justify-between">
        <div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400">URL Security Token</div>
          <div class="text-sm font-black text-gray-900 mt-1">3600 Seconds (1 Hr)</div>
          <div class="text-[11px] text-gray-500">Time-limited signed tokens</div>
        </div>
        <div class="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
          <UIcon name="i-heroicons-key" class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Workspace Tabs Navigation Header -->
    <div class="flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 backdrop-blur-md border border-gray-200/70 shadow-sm w-fit">
      <button
        type="button"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
          activeTab === 'approvals'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        ]"
        @click="activeTab = 'approvals'"
      >
        <UIcon name="i-heroicons-clipboard-document-check" class="w-4 h-4" />
        <span>Verification Requests</span>
        <span
          v-if="pendingRequestsCount > 0"
          :class="[
            'px-2 py-0.5 rounded-full text-[10px] font-bold font-mono',
            activeTab === 'approvals' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
          ]"
        >
          {{ pendingRequestsCount }}
        </span>
      </button>

      <button
        type="button"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
          activeTab === 'vault'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        ]"
        @click="activeTab = 'vault'"
      >
        <UIcon name="i-heroicons-identification" class="w-4 h-4" />
        <span>Employee Document Vault</span>
      </button>

      <button
        type="button"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
          activeTab === 'explorer'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        ]"
        @click="activeTab = 'explorer'"
      >
        <UIcon name="i-heroicons-folder-open" class="w-4 h-4" />
        <span>File Explorer</span>
      </button>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 1: VERIFICATION REQUESTS (Approvals Queue)                    -->
    <!-- ================================================================= -->
    <div v-if="activeTab === 'approvals'" class="p-6 sm:p-8 rounded-3xl bg-white/85 backdrop-blur-lg border border-gray-200/70 shadow-xl space-y-6">
      <!-- Filter Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
        <!-- Status Pills with Live Counts -->
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <button
            v-for="s in requestStatusFilters"
            :key="s.value"
            type="button"
            :class="[
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all',
              selectedStatusFilter === s.value
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            ]"
            @click="selectedStatusFilter = s.value"
          >
            <span>{{ s.label }}</span>
            <span
              :class="[
                'text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none',
                selectedStatusFilter === s.value
                  ? 'bg-white/25 text-white'
                  : 'bg-gray-200/80 text-gray-600'
              ]"
            >
              {{ getStatusCount(s.value) }}
            </span>
          </button>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <!-- Search Input -->
          <div class="relative flex-1 sm:w-72">
            <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="requestsSearchQuery"
              type="text"
              placeholder="Search employee, doc #, note..."
              class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <!-- Refresh Button -->
          <button
            type="button"
            class="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors shrink-0"
            title="Refresh verification requests"
            :disabled="isLoadingRequests"
            @click="fetchRequests"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" :class="{ 'animate-spin': isLoadingRequests }" />
          </button>
        </div>
      </div>

      <!-- Requests Loading State -->
      <div v-if="isLoadingRequests" class="py-16 text-center space-y-3">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p class="text-xs text-gray-500">Loading document verification requests...</p>
      </div>

      <!-- Requests Empty State -->
      <div v-else-if="filteredRequests.length === 0" class="py-16 text-center space-y-3">
        <div
          class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          :class="selectedStatusFilter === 'under_review' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'"
        >
          <UIcon
            :name="selectedStatusFilter === 'under_review' ? 'i-heroicons-magnifying-glass' : 'i-heroicons-check-circle'"
            class="w-8 h-8"
          />
        </div>
        <h4 class="text-sm font-bold text-gray-900">
          {{
            selectedStatusFilter === 'under_review'
              ? 'No requests currently under review'
              : selectedStatusFilter === 'pending'
                ? 'No pending verification requests'
                : 'No requests found'
          }}
        </h4>
        <p class="text-xs text-gray-500 max-w-sm mx-auto">
          {{
            selectedStatusFilter === 'under_review'
              ? 'When actively evaluating a request, click "Review" on any pending submission to track it under review here.'
              : selectedStatusFilter === 'pending'
                ? 'All caught up! No pending verification requests awaiting approval.'
                : 'No document requests matching the current status and search filters.'
          }}
        </p>
      </div>

      <!-- Requests List Grid -->
      <div v-else class="grid grid-cols-1 gap-4">
        <div
          v-for="req in filteredRequests"
          :key="req.id"
          class="p-5 rounded-2xl bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
        >
          <!-- Left: Employee & Document Information -->
          <div class="flex items-start gap-4 min-w-0">
            <!-- Employee Avatar -->
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
              {{ getInitials(req.profiles?.full_name || 'Staff') }}
            </div>

            <!-- Details -->
            <div class="space-y-1.5 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-black text-gray-900 truncate">
                  {{ req.profiles?.full_name || 'Unknown Employee' }}
                </span>
                <span class="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 font-mono font-bold text-gray-600">
                  {{ req.profiles?.employee_code || 'EMP-???' }}
                </span>
                <span
                  class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                  :class="getStatusBadgeClass(req.status)"
                >
                  {{ normalizeStatus(req.status).replace('_', ' ') }}
                </span>
                <span
                  v-if="req.priority && req.priority !== 'normal'"
                  class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                  :class="req.priority === 'urgent' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200'"
                >
                  {{ req.priority }}
                </span>
              </div>

              <!-- Document Type & Extracted Number -->
              <div class="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                <div class="inline-flex items-center gap-1 font-semibold text-emerald-800">
                  <UIcon :name="getDocIcon(req.documentType)" class="w-4 h-4 text-emerald-600" />
                  <span>{{ formatDocType(req.documentType) }}</span>
                </div>

                <span v-if="req.documentNumber" class="text-gray-400">•</span>
                <span v-if="req.documentNumber" class="font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                  # {{ req.documentNumber }}
                </span>

                <!-- Bank Details Summary if cheque/passbook -->
                <template v-if="req.isBankDoc && req.new_data">
                  <span class="text-gray-400">•</span>
                  <span class="text-gray-600 truncate max-w-xs">
                    {{ req.new_data.bank_name || 'Bank' }} • A/C: {{ req.new_data.account_number }} • IFSC: {{ req.new_data.ifsc_code }}
                  </span>
                </template>
                <!-- Attachment Status Indicator -->
                <span class="text-gray-400">•</span>
                <span
                  v-if="hasAttachment(req)"
                  class="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]"
                >
                  <UIcon name="i-heroicons-paper-clip" class="w-3 h-3 text-emerald-600" />
                  <span>Attachment</span>
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded text-[10px]"
                >
                  <UIcon name="i-heroicons-document-minus" class="w-3 h-3 text-gray-400" />
                  <span>No Attachment</span>
                </span>
              </div>

              <div class="text-[11px] text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
                <span>Submitted: {{ formatDateTime(req.created_at) }}</span>
                <span v-if="normalizeStatus(req.status) === 'under_review' && req.reviewed_at">
                  • Under Review since: {{ formatDateTime(req.reviewed_at) }}
                </span>
                <span v-if="normalizeStatus(req.status) === 'under_review' && req.reviewerName" class="text-blue-600 font-semibold">
                  • Reviewer: {{ req.reviewerName }}
                </span>
                <span v-if="req.new_data?.date_folder">• Folder: {{ req.new_data.date_folder }}</span>
                <span v-if="req.user_note" class="text-gray-600 italic">• Note: "{{ req.user_note }}"</span>
                <span v-if="req.rejection_reason" class="text-rose-600 font-semibold">• Reason: {{ req.rejection_reason }}</span>
              </div>
            </div>
          </div>

          <!-- Right: Action Buttons -->
          <div class="flex items-center gap-2 shrink-0 self-end lg:self-center">
            <!-- Inspect Document Button (Only shown when request has an attachment) -->
            <button
              v-if="hasAttachment(req)"
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors"
              @click="openReviewModal(req)"
            >
              <UIcon name="i-heroicons-eye" class="w-4 h-4" />
              <span>Inspect</span>
            </button>

            <!-- Mark Under Review (For pending) -->
            <button
              v-if="normalizeStatus(req.status) === 'pending'"
              type="button"
              class="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors"
              :disabled="actioningRequestId === req.id"
              title="Mark as Under Review"
              @click="markUnderReview(req)"
            >
              <UIcon v-if="actioningRequestId === req.id" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-heroicons-magnifying-glass" class="w-4 h-4" />
              <span>Review</span>
            </button>

            <!-- Move back to Pending (For under_review) -->
            <button
              v-if="normalizeStatus(req.status) === 'under_review'"
              type="button"
              class="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
              :disabled="actioningRequestId === req.id"
              title="Move back to Pending status"
              @click="markBackToPending(req)"
            >
              <UIcon v-if="actioningRequestId === req.id" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-heroicons-arrow-uturn-left" class="w-4 h-4" />
              <span>To Pending</span>
            </button>

            <!-- Quick Approve (Only if pending or under_review) -->
            <button
              v-if="['pending', 'under_review'].includes(normalizeStatus(req.status))"
              type="button"
              class="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
              :disabled="actioningRequestId === req.id"
              @click="approveRequest(req)"
            >
              <UIcon v-if="actioningRequestId === req.id" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-heroicons-check" class="w-4 h-4" />
              <span>Approve</span>
            </button>

            <!-- Quick Reject (Only if pending or under_review) -->
            <button
              v-if="['pending', 'under_review'].includes(normalizeStatus(req.status))"
              type="button"
              class="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
              :disabled="actioningRequestId === req.id"
              @click="openRejectModal(req)"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
              <span>Reject</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 2: EMPLOYEE DOCUMENT VAULT (Dossier)                          -->
    <!-- ================================================================= -->
    <div v-if="activeTab === 'vault'" class="space-y-6">
      <!-- Employee Selector Bar -->
      <div
        class="p-6 rounded-3xl bg-white/85 backdrop-blur-lg border border-gray-200/70 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
        :class="isEmployeeDropdownOpen ? 'relative z-40' : 'relative z-10'"
      >
        <div class="space-y-1 w-full md:w-auto relative z-40">
          <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Select Employee</label>
          <div ref="employeeDropdownRef" class="relative w-full sm:w-84">
            <!-- Searchable Dropdown Trigger -->
            <button
              type="button"
              class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-white border border-gray-200 hover:border-emerald-400 text-left text-xs font-semibold text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
              @click="toggleEmployeeDropdown"
            >
              <div class="flex items-center gap-2 min-w-0">
                <div
                  v-if="selectedEmployee"
                  class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0"
                >
                  {{ getInitials(selectedEmployee.full_name) }}
                </div>
                <UIcon v-else name="i-heroicons-user" class="w-4 h-4 text-gray-400 shrink-0" />
                <span v-if="selectedEmployee" class="truncate font-bold text-gray-900">
                  {{ selectedEmployee.full_name }}
                  <span class="text-gray-500 font-mono text-[11px] font-normal">({{ selectedEmployee.employee_code || 'EMP' }})</span>
                </span>
                <span v-else class="text-gray-400 font-normal">Choose an employee...</span>
              </div>
              <UIcon
                name="i-heroicons-chevron-down"
                class="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180 text-emerald-600': isEmployeeDropdownOpen }"
              />
            </button>

            <!-- Dropdown Popover with Search & Filtered List -->
            <div
              v-if="isEmployeeDropdownOpen"
              class="absolute left-0 top-full mt-2 w-full sm:w-96 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 p-2 space-y-2 animate-in fade-in duration-100"
            >
              <!-- Search Input inside Dropdown -->
              <div class="relative">
                <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref="employeeSearchInputRef"
                  v-model="employeeSearchQuery"
                  type="text"
                  placeholder="Search by name, code, email..."
                  class="w-full pl-8 pr-7 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
                  @click.stop
                  @keydown.esc="isEmployeeDropdownOpen = false"
                />
                <button
                  v-if="employeeSearchQuery"
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5"
                  @click.stop="employeeSearchQuery = ''"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Options List -->
              <div class="max-h-60 overflow-y-auto space-y-1 pr-1">
                <button
                  v-for="emp in filteredVaultEmployees"
                  :key="emp.id"
                  type="button"
                  class="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left transition-colors text-xs"
                  :class="selectedEmployeeId === emp.id ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-gray-50 text-gray-700'"
                  @click="selectVaultEmployee(emp.id)"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div
                      class="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0"
                      :class="selectedEmployeeId === emp.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'"
                    >
                      {{ getInitials(emp.full_name) }}
                    </div>
                    <div class="min-w-0">
                      <div class="truncate font-semibold leading-tight">{{ emp.full_name }}</div>
                      <div class="text-[10px] text-gray-400 font-mono truncate">
                        {{ emp.employee_code || 'EMP' }} • {{ emp.email || 'No email' }}
                      </div>
                    </div>
                  </div>
                  <UIcon
                    v-if="selectedEmployeeId === emp.id"
                    name="i-heroicons-check"
                    class="w-4 h-4 text-emerald-600 shrink-0"
                  />
                </button>

                <div v-if="filteredVaultEmployees.length === 0" class="py-6 text-center text-xs text-gray-400">
                  No employees matching "{{ employeeSearchQuery }}"
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedEmployee" class="flex flex-wrap items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
            {{ getInitials(selectedEmployee.full_name || 'Staff') }}
          </div>
          <div>
            <div class="text-xs font-bold text-gray-900">{{ selectedEmployee.full_name }}</div>
            <div class="text-[11px] text-gray-500 font-mono">{{ selectedEmployee.employee_code }} • {{ selectedEmployee.email }}</div>
          </div>
          <button
            type="button"
            title="Scan storage to sync missing compliance files"
            class="inline-flex items-center gap-1.5 ml-auto sm:ml-2 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 text-xs font-semibold transition-all border border-gray-200 shadow-sm"
            :disabled="isLoadingVault || isSyncingStorage"
            @click="forceSyncVaultWithStorage"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5" :class="{ 'animate-spin': isSyncingStorage || isLoadingVault }" />
            <span>Sync Storage</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingVault" class="py-16 text-center space-y-3 p-8 rounded-3xl bg-white/85 border border-gray-200">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p class="text-xs text-gray-500">Loading compliance document records from profile_details...</p>
      </div>

      <!-- 4 Core Document Cards Grid -->
      <div v-else-if="selectedEmployee" class="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-0">
        <!-- 1. Aadhaar Card -->
        <div class="p-6 rounded-3xl bg-white/85 backdrop-blur-lg border border-gray-200/70 shadow-lg space-y-4 flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UIcon name="i-heroicons-identification" class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-gray-900">Aadhaar Card</h3>
                  <p class="text-[11px] text-gray-500">Government Identity Proof (Dual Side)</p>
                </div>
              </div>

              <span
                class="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase"
                :class="currentProfileDetails?.aadhaar_url ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'"
              >
                {{ currentProfileDetails?.aadhaar_url ? 'Verified' : 'Not Uploaded' }}
              </span>
            </div>

            <!-- Aadhaar Number -->
            <div class="p-3 rounded-2xl bg-gray-50 border border-gray-200/70 text-xs">
              <span class="text-gray-500 block text-[10px] uppercase font-bold">Aadhaar Number</span>
              <span class="font-mono font-bold text-gray-900">
                {{ currentProfileDetails?.aadhaar_number || 'Not Recorded' }}
              </span>
            </div>
          </div>

          <!-- Document Attachments & Actions -->
          <div class="pt-3 border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <div v-if="currentProfileDetails?.aadhaar_url" class="inline-flex items-center rounded-xl bg-emerald-50 border border-emerald-200/60 overflow-hidden shadow-xs">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
                  @click="previewPermanentFile(currentProfileDetails.aadhaar_url, 'Aadhaar Front')"
                >
                  <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
                  <span>Front Side</span>
                </button>
                <button
                  type="button"
                  title="Download Front Side"
                  class="p-1.5 border-l border-emerald-200/60 hover:bg-emerald-100 text-emerald-700 transition-colors"
                  @click="downloadPermanentFile(currentProfileDetails.aadhaar_url, 'aadhaar_front.jpg')"
                >
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
                </button>
              </div>

              <div v-if="currentProfileDetails?.aadhaar_back_url" class="inline-flex items-center rounded-xl bg-emerald-50 border border-emerald-200/60 overflow-hidden shadow-xs">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
                  @click="previewPermanentFile(currentProfileDetails.aadhaar_back_url, 'Aadhaar Back')"
                >
                  <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
                  <span>Back Side</span>
                </button>
                <button
                  type="button"
                  title="Download Back Side"
                  class="p-1.5 border-l border-emerald-200/60 hover:bg-emerald-100 text-emerald-700 transition-colors"
                  @click="downloadPermanentFile(currentProfileDetails.aadhaar_back_url, 'aadhaar_back.jpg')"
                >
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-emerald-700"
              @click="openAdminDirectUploadModal('aadhaar')"
            >
              <UIcon name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5" />
              <span>{{ currentProfileDetails?.aadhaar_url ? 'Replace' : 'Upload' }}</span>
            </button>
          </div>
        </div>

        <!-- 2. PAN Card -->
        <div class="p-6 rounded-3xl bg-white/85 backdrop-blur-lg border border-gray-200/70 shadow-lg space-y-4 flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <UIcon name="i-heroicons-document-text" class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-gray-900">PAN Card</h3>
                  <p class="text-[11px] text-gray-500">Tax Identification Record</p>
                </div>
              </div>

              <span
                class="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase"
                :class="currentProfileDetails?.pan_url ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'"
              >
                {{ currentProfileDetails?.pan_url ? 'Verified' : 'Not Uploaded' }}
              </span>
            </div>

            <!-- PAN Number -->
            <div class="p-3 rounded-2xl bg-gray-50 border border-gray-200/70 text-xs">
              <span class="text-gray-500 block text-[10px] uppercase font-bold">PAN Number</span>
              <span class="font-mono font-bold text-gray-900">
                {{ currentProfileDetails?.pan_number || 'Not Recorded' }}
              </span>
            </div>
          </div>

          <!-- Document Attachments & Actions -->
          <div class="pt-3 border-t border-gray-200/60 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <div v-if="currentProfileDetails?.pan_url" class="inline-flex items-center rounded-xl bg-blue-50 border border-blue-200/60 overflow-hidden shadow-xs">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                  @click="previewPermanentFile(currentProfileDetails.pan_url, 'PAN Card')"
                >
                  <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
                  <span>View PAN Card</span>
                </button>
                <button
                  type="button"
                  title="Download PAN Card"
                  class="p-1.5 border-l border-blue-200/60 hover:bg-blue-100 text-blue-700 transition-colors"
                  @click="downloadPermanentFile(currentProfileDetails.pan_url, 'pan_card.pdf')"
                >
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-emerald-700"
              @click="openAdminDirectUploadModal('pan')"
            >
              <UIcon name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5" />
              <span>{{ currentProfileDetails?.pan_url ? 'Replace' : 'Upload' }}</span>
            </button>
          </div>
        </div>

        <!-- 3. Passport -->
        <div class="p-6 rounded-3xl bg-white/85 backdrop-blur-lg border border-gray-200/70 shadow-lg space-y-4 flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <UIcon name="i-heroicons-globe-americas" class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-gray-900">Passport</h3>
                  <p class="text-[11px] text-gray-500">International Travel & Citizenship</p>
                </div>
              </div>

              <span
                class="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase"
                :class="currentProfileDetails?.passport_url ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'"
              >
                {{ currentProfileDetails?.passport_url ? 'Verified' : 'Not Uploaded' }}
              </span>
            </div>

            <!-- Passport Number -->
            <div class="p-3 rounded-2xl bg-gray-50 border border-gray-200/70 text-xs">
              <span class="text-gray-500 block text-[10px] uppercase font-bold">Passport Number</span>
              <span class="font-mono font-bold text-gray-900">
                {{ currentProfileDetails?.passport_number || 'Not Recorded' }}
              </span>
            </div>
          </div>

          <!-- Document Attachments & Actions -->
          <div class="pt-3 border-t border-gray-200/60 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <div v-if="currentProfileDetails?.passport_url" class="inline-flex items-center rounded-xl bg-indigo-50 border border-indigo-200/60 overflow-hidden shadow-xs">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
                  @click="previewPermanentFile(currentProfileDetails.passport_url, 'Passport')"
                >
                  <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
                  <span>View Passport</span>
                </button>
                <button
                  type="button"
                  title="Download Passport"
                  class="p-1.5 border-l border-indigo-200/60 hover:bg-indigo-100 text-indigo-700 transition-colors"
                  @click="downloadPermanentFile(currentProfileDetails.passport_url, 'passport.pdf')"
                >
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-emerald-700"
              @click="openAdminDirectUploadModal('passport')"
            >
              <UIcon name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5" />
              <span>{{ currentProfileDetails?.passport_url ? 'Replace' : 'Upload' }}</span>
            </button>
          </div>
        </div>

        <!-- 4. Bank Account & Cheque / Passbook -->
        <div class="p-6 rounded-3xl bg-white/85 backdrop-blur-lg border border-gray-200/70 shadow-lg space-y-4 flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <UIcon name="i-heroicons-building-library" class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-gray-900">Bank Account & Cheque / Passbook</h3>
                  <p class="text-[11px] text-gray-500">Payroll Disbursement Details</p>
                </div>
              </div>

              <span
                class="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase"
                :class="(currentProfileDetails?.cancelled_cheque_url || currentProfileDetails?.passbook_url) ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'"
              >
                {{ (currentProfileDetails?.cancelled_cheque_url || currentProfileDetails?.passbook_url) ? 'Verified' : 'Not Uploaded' }}
              </span>
            </div>

            <!-- Bank Details Box -->
            <div class="p-3 rounded-2xl bg-gray-50 border border-gray-200/70 text-xs space-y-1">
              <div class="flex justify-between">
                <span class="text-gray-500 text-[10px] uppercase font-bold">Bank Name:</span>
                <span class="font-bold text-gray-900">{{ currentProfileDetails?.bank_details?.bank_name || 'Not Recorded' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 text-[10px] uppercase font-bold">A/C Number:</span>
                <span class="font-mono font-bold text-gray-900">{{ currentProfileDetails?.bank_details?.account_number || 'Not Recorded' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 text-[10px] uppercase font-bold">IFSC Code:</span>
                <span class="font-mono font-bold text-gray-900">{{ currentProfileDetails?.bank_details?.ifsc_code || 'Not Recorded' }}</span>
              </div>
            </div>
          </div>

          <!-- Document Attachments & Actions -->
          <div class="pt-3 border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <div v-if="currentProfileDetails?.cancelled_cheque_url" class="inline-flex items-center rounded-xl bg-amber-50 border border-amber-200/60 overflow-hidden shadow-xs">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors"
                  @click="previewPermanentFile(currentProfileDetails.cancelled_cheque_url, 'Cancelled Cheque')"
                >
                  <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
                  <span>Cheque Proof</span>
                </button>
                <button
                  type="button"
                  title="Download Cheque Proof"
                  class="p-1.5 border-l border-amber-200/60 hover:bg-amber-100 text-amber-700 transition-colors"
                  @click="downloadPermanentFile(currentProfileDetails.cancelled_cheque_url, 'cancelled_cheque.pdf')"
                >
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
                </button>
              </div>

              <div v-if="currentProfileDetails?.passbook_url" class="inline-flex items-center rounded-xl bg-amber-50 border border-amber-200/60 overflow-hidden shadow-xs">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors"
                  @click="previewPermanentFile(currentProfileDetails.passbook_url, 'Bank Passbook')"
                >
                  <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
                  <span>Passbook</span>
                </button>
                <button
                  type="button"
                  title="Download Passbook"
                  class="p-1.5 border-l border-amber-200/60 hover:bg-amber-100 text-amber-700 transition-colors"
                  @click="downloadPermanentFile(currentProfileDetails.passbook_url, 'passbook.pdf')"
                >
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-emerald-700"
              @click="openAdminDirectUploadModal('cheque')"
            >
              <UIcon name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5" />
              <span>{{ (currentProfileDetails?.cancelled_cheque_url || currentProfileDetails?.passbook_url) ? 'Replace' : 'Upload' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 3: STORAGE EXPLORER (Secure File Browser)                  -->
    <!-- ================================================================= -->
    <div v-if="activeTab === 'explorer'" class="p-6 sm:p-8 rounded-3xl bg-white/85 backdrop-blur-lg border border-gray-200/70 shadow-xl space-y-5">
      <!-- Breadcrumb Bar & Search -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
        <!-- Breadcrumb Path Trail -->
        <div class="flex items-center flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 font-bold text-gray-700 transition-colors"
            @click="navigateToFolder('')"
          >
            <UIcon name="i-heroicons-folder" class="w-4 h-4 text-emerald-600" />
            <span>Document Root</span>
          </button>

          <template v-for="(seg, idx) in currentPathSegments" :key="idx">
            <UIcon name="i-heroicons-chevron-right" class="w-3.5 h-3.5 text-gray-400" />
            <button
              type="button"
              class="px-2.5 py-1.5 rounded-lg font-bold transition-colors truncate max-w-xs"
              :class="idx === currentPathSegments.length - 1 ? 'bg-emerald-50 text-emerald-700 font-black' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'"
              @click="navigateToSegmentIndex(idx)"
            >
              {{ resolvePathLabel(seg, idx) }}
            </button>
          </template>
        </div>

        <!-- Search in Folder -->
        <div class="relative w-full sm:w-64">
          <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="explorerSearchQuery"
            type="text"
            placeholder="Search files, employee, doc..."
            class="w-full pl-9 pr-8 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
          />
          <button
            v-if="explorerSearchQuery"
            type="button"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5"
            title="Clear search"
            @click="explorerSearchQuery = ''"
          >
            <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingFiles" class="py-16 text-center space-y-3">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p class="text-xs text-gray-500">Loading document vault files...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredFiles.length === 0" class="py-16 text-center space-y-3">
        <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
          <UIcon
            :name="explorerSearchQuery.trim() ? 'i-heroicons-magnifying-glass' : 'i-heroicons-folder-open'"
            class="w-8 h-8"
          />
        </div>
        <h4 class="text-sm font-bold text-gray-900">
          {{ explorerSearchQuery.trim() ? 'No matching items found' : 'This directory is empty' }}
        </h4>
        <p class="text-xs text-gray-500 max-w-sm mx-auto">
          {{
            explorerSearchQuery.trim()
              ? `No files or folders matching "${explorerSearchQuery}" in this directory.`
              : currentPath
                ? `No files found in "/${currentPath}".`
                : 'No files or employee folders found.'
          }}
        </p>
        <div v-if="explorerSearchQuery.trim()">
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
            @click="explorerSearchQuery = ''"
          >
            Clear Search
          </button>
        </div>
      </div>

      <!-- Files and Folders Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="item in filteredFiles"
          :key="item.name"
          class="group p-4 rounded-2xl bg-gray-50/70 hover:bg-white border border-gray-200/80 hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col justify-between"
        >
          <!-- Item Header & Icon -->
          <div class="flex items-start gap-3">
            <!-- Folder Icon -->
            <button
              v-if="isFolder(item)"
              type="button"
              class="w-10 h-10 rounded-xl bg-amber-100 group-hover:bg-amber-200 text-amber-700 flex items-center justify-center shrink-0 transition-colors"
              @click="openFolder(item.name)"
            >
              <UIcon name="i-heroicons-folder" class="w-5 h-5" />
            </button>

            <!-- File Icon (clickable to view) -->
            <button
              v-else
              type="button"
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 hover:scale-105 transition-all cursor-pointer shadow-xs"
              :class="getFileTypeBadgeClass(item.name)"
              title="View file"
              @click="previewSignedFile(item.name)"
            >
              <UIcon :name="getFileIcon(item.name)" class="w-5 h-5" />
            </button>

            <!-- Name & Meta -->
            <div class="min-w-0 flex-1">
              <button
                v-if="isFolder(item)"
                type="button"
                class="text-left font-bold text-xs text-gray-900 group-hover:text-amber-800 truncate block w-full"
                @click="openFolder(item.name)"
              >
                {{ resolveItemDisplayName(item.name) }}
              </button>
              <button
                v-else
                type="button"
                class="text-left font-bold text-xs text-gray-900 hover:text-emerald-700 hover:underline truncate block w-full cursor-pointer"
                :title="`View ${item.name}`"
                @click="previewSignedFile(item.name)"
              >
                {{ item.name }}
              </button>

              <div class="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5 font-mono">
                <span v-if="!isFolder(item)">{{ formatBytes(item.metadata?.size) }}</span>
                <span v-else>Directory</span>
                <span v-if="item.created_at">• {{ formatDate(item.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- File Action Buttons (Only for files) -->
          <div v-if="!isFolder(item)" class="flex items-center justify-between pt-3 mt-3 border-t border-gray-200/60">
            <span class="text-[10px] font-mono uppercase font-bold text-gray-400">
              {{ getFileExt(item.name) }}
            </span>

            <div class="flex items-center gap-1">
              <!-- Signed URL View/Preview Button -->
              <button
                type="button"
                class="p-1.5 rounded-lg bg-white hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-200 shadow-sm transition-colors disabled:opacity-50"
                :disabled="previewingFileName === item.name"
                title="View / Preview File"
                @click="previewSignedFile(item.name)"
              >
                <UIcon
                  :name="previewingFileName === item.name ? 'i-heroicons-arrow-path' : 'i-heroicons-eye'"
                  class="w-3.5 h-3.5"
                  :class="{ 'animate-spin': previewingFileName === item.name }"
                />
              </button>

              <!-- Signed URL Download Button -->
              <button
                type="button"
                class="p-1.5 rounded-lg bg-white hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-200 shadow-sm transition-colors disabled:opacity-50"
                :disabled="downloadingFileName === item.name"
                title="Download File"
                @click="downloadSignedFile(item.name)"
              >
                <UIcon
                  :name="downloadingFileName === item.name ? 'i-heroicons-arrow-path' : 'i-heroicons-arrow-down-tray'"
                  class="w-3.5 h-3.5"
                  :class="{ 'animate-spin': downloadingFileName === item.name }"
                />
              </button>

              <!-- Delete Button -->
              <button
                type="button"
                class="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-200 shadow-sm transition-colors"
                title="Delete File"
                @click="deleteFile(item.name)"
              >
                <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Folder Enter Button -->
          <div v-else class="flex justify-end pt-3 mt-3 border-t border-gray-200/60">
            <button
              type="button"
              class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800"
              @click="openFolder(item.name)"
            >
              <span>Browse</span>
              <UIcon name="i-heroicons-chevron-right" class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- MODAL 1: INSPECT & VERIFY REQUEST (Full Image/PDF Preview)        -->
    <!-- ================================================================= -->
    <div v-if="isReviewModalOpen && selectedReviewRequest" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" @click="isReviewModalOpen = false" />
      <div class="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 z-10 flex flex-col overflow-hidden space-y-6">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-gray-900">
                Document Inspection • {{ formatDocType(selectedReviewRequest.documentType) }}
              </h3>
              <span
                class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                :class="getStatusBadgeClass(selectedReviewRequest.status)"
              >
                {{ normalizeStatus(selectedReviewRequest.status).replace('_', ' ') }}
              </span>
            </div>
            <p class="text-xs text-gray-500">
              Submitted by {{ selectedReviewRequest.profiles?.full_name }} ({{ selectedReviewRequest.profiles?.employee_code }}) on {{ formatDateTime(selectedReviewRequest.created_at) }}
            </p>
          </div>
          <button type="button" class="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700" @click="isReviewModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body (Split layout: Previews & Info) -->
        <div class="flex-1 overflow-y-auto space-y-6 pr-1">
          <!-- Document Preview Images -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400">Attached Staging Documents</h4>

            <div v-if="isLoadingPreviewUrls" class="py-12 text-center space-y-2 bg-gray-50 rounded-2xl">
              <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
              <p class="text-xs text-gray-500">Generating secure signed preview URL...</p>
            </div>

            <!-- Aadhaar Dual-Side Previews -->
            <div v-else-if="selectedReviewRequest.isDualAadhaar" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Front Preview -->
              <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div class="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Front Side</span>
                  <a v-if="previewUrlFront" :href="previewUrlFront" target="_blank" class="text-emerald-600 hover:underline flex items-center gap-1 text-[11px]">
                    <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                    <span>Open Full</span>
                  </a>
                </div>
                <div class="h-64 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
                  <img v-if="previewUrlFront && !isPdf(previewUrlFront)" :src="previewUrlFront" alt="Aadhaar Front" class="w-full h-full object-contain" />
                  <iframe v-else-if="previewUrlFront" :src="previewUrlFront" class="w-full h-full" />
                  <span v-else class="text-xs text-gray-400">No front image</span>
                </div>
              </div>

              <!-- Back Preview -->
              <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div class="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Back Side</span>
                  <a v-if="previewUrlBack" :href="previewUrlBack" target="_blank" class="text-emerald-600 hover:underline flex items-center gap-1 text-[11px]">
                    <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                    <span>Open Full</span>
                  </a>
                </div>
                <div class="h-64 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
                  <img v-if="previewUrlBack && !isPdf(previewUrlBack)" :src="previewUrlBack" alt="Aadhaar Back" class="w-full h-full object-contain" />
                  <iframe v-else-if="previewUrlBack" :src="previewUrlBack" class="w-full h-full" />
                  <span v-else class="text-xs text-gray-400">No back image</span>
                </div>
              </div>
            </div>

            <!-- Single Document Preview -->
            <div v-else class="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-gray-700">
                <span>{{ formatDocType(selectedReviewRequest.documentType) }} Attachment</span>
                <a v-if="previewUrlSingle" :href="previewUrlSingle" target="_blank" class="text-emerald-600 hover:underline flex items-center gap-1 text-[11px]">
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                  <span>Open in Full Viewport</span>
                </a>
              </div>
              <div class="h-80 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
                <img v-if="previewUrlSingle && !isPdf(previewUrlSingle)" :src="previewUrlSingle" alt="Document" class="w-full h-full object-contain" />
                <iframe v-else-if="previewUrlSingle" :src="previewUrlSingle" class="w-full h-full" />
                <span v-else class="text-xs text-gray-400">Document unavailable or moved to storage</span>
              </div>
            </div>
          </div>

          <!-- Metadata Fields Grid -->
          <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500">Submitted Metadata</h4>
              <span v-if="selectedReviewRequest.priority && selectedReviewRequest.priority !== 'normal'" class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" :class="selectedReviewRequest.priority === 'urgent' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200'">
                Priority: {{ selectedReviewRequest.priority }}
              </span>
            </div>

            <!-- Under Review Info Banner -->
            <div
              v-if="normalizeStatus(selectedReviewRequest.status) === 'under_review'"
              class="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2"
            >
              <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Currently Under Review
                <strong v-if="selectedReviewRequest.reviewerName">by {{ selectedReviewRequest.reviewerName }}</strong>
                <span v-if="selectedReviewRequest.reviewed_at"> (since {{ formatDateTime(selectedReviewRequest.reviewed_at) }})</span>
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <span class="text-gray-400 block text-[10px] uppercase font-bold">Document Type</span>
                <span class="font-bold text-gray-900">{{ formatDocType(selectedReviewRequest.documentType) }}</span>
              </div>

              <div v-if="selectedReviewRequest.documentNumber">
                <span class="text-gray-400 block text-[10px] uppercase font-bold">Document Number</span>
                <span class="font-mono font-bold text-gray-900">{{ selectedReviewRequest.documentNumber }}</span>
              </div>

              <div v-if="selectedReviewRequest.new_data?.date_folder">
                <span class="text-gray-400 block text-[10px] uppercase font-bold">Target Date Folder</span>
                <span class="font-mono text-gray-700">{{ selectedReviewRequest.new_data.date_folder }}</span>
              </div>

              <!-- Bank fields if cheque or passbook -->
              <template v-if="selectedReviewRequest.isBankDoc && selectedReviewRequest.new_data">
                <div>
                  <span class="text-gray-400 block text-[10px] uppercase font-bold">Account Holder</span>
                  <span class="font-bold text-gray-900">{{ selectedReviewRequest.new_data.account_holder || '-' }}</span>
                </div>
                <div>
                  <span class="text-gray-400 block text-[10px] uppercase font-bold">Account Number</span>
                  <span class="font-mono font-bold text-gray-900">{{ selectedReviewRequest.new_data.account_number || '-' }}</span>
                </div>
                <div>
                  <span class="text-gray-400 block text-[10px] uppercase font-bold">IFSC Code</span>
                  <span class="font-mono font-bold text-gray-900">{{ selectedReviewRequest.new_data.ifsc_code || '-' }}</span>
                </div>
                <div>
                  <span class="text-gray-400 block text-[10px] uppercase font-bold">Bank Name</span>
                  <span class="font-bold text-gray-900">{{ selectedReviewRequest.new_data.bank_name || '-' }}</span>
                </div>
                <div>
                  <span class="text-gray-400 block text-[10px] uppercase font-bold">Branch Name</span>
                  <span class="font-bold text-gray-900">{{ selectedReviewRequest.new_data.branch_name || '-' }}</span>
                </div>
                <div>
                  <span class="text-gray-400 block text-[10px] uppercase font-bold">Account Type</span>
                  <span class="font-bold text-gray-900">{{ selectedReviewRequest.new_data.account_type || '-' }}</span>
                </div>
              </template>
            </div>

            <!-- Notes -->
            <div v-if="selectedReviewRequest.user_note" class="pt-2 border-t border-gray-200 text-xs">
              <span class="text-gray-400 block text-[10px] uppercase font-bold">Employee Submission Note</span>
              <p class="text-gray-700 italic mt-0.5">{{ selectedReviewRequest.user_note }}</p>
            </div>
            <div v-if="selectedReviewRequest.review_note" class="pt-2 border-t border-gray-200 text-xs">
              <span class="text-gray-400 block text-[10px] uppercase font-bold">Reviewer Note</span>
              <p class="text-gray-700 mt-0.5">{{ selectedReviewRequest.review_note }}</p>
            </div>
            <div v-if="selectedReviewRequest.rejection_reason" class="pt-2 border-t border-gray-200 text-xs">
              <span class="text-rose-500 block text-[10px] uppercase font-bold">Rejection Reason</span>
              <p class="text-rose-700 font-medium mt-0.5">{{ selectedReviewRequest.rejection_reason }}</p>
            </div>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <div class="flex items-center gap-2">
            <button
              v-if="normalizeStatus(selectedReviewRequest.status) === 'pending'"
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
              :disabled="actioningRequestId === selectedReviewRequest.id"
              @click="markUnderReview(selectedReviewRequest)"
            >
              <UIcon v-if="actioningRequestId === selectedReviewRequest.id" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-heroicons-magnifying-glass" class="w-4 h-4" />
              <span>Mark as Under Review</span>
            </button>

            <button
              v-else-if="normalizeStatus(selectedReviewRequest.status) === 'under_review'"
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
              :disabled="actioningRequestId === selectedReviewRequest.id"
              @click="markBackToPending(selectedReviewRequest)"
            >
              <UIcon v-if="actioningRequestId === selectedReviewRequest.id" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-heroicons-arrow-uturn-left" class="w-4 h-4" />
              <span>Move back to Pending</span>
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
              @click="isReviewModalOpen = false"
            >
              Close
            </button>

            <button
              v-if="['pending', 'under_review'].includes(normalizeStatus(selectedReviewRequest.status))"
              type="button"
              class="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
              @click="openRejectModal(selectedReviewRequest)"
            >
              Reject
            </button>

            <button
              v-if="['pending', 'under_review'].includes(normalizeStatus(selectedReviewRequest.status))"
              type="button"
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
              :disabled="actioningRequestId === selectedReviewRequest.id"
              @click="approveRequest(selectedReviewRequest)"
            >
              <UIcon v-if="actioningRequestId === selectedReviewRequest.id" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-heroicons-check" class="w-4 h-4" />
              <span>Confirm Approval</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- MODAL 2: REJECT REQUEST PROMPT                                    -->
    <!-- ================================================================= -->
    <div v-if="isRejectModalOpen && targetRejectRequest" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="isRejectModalOpen = false" />
      <div class="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 z-10 space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <h3 class="text-sm font-bold text-gray-900">Reject Document Submission</h3>
          <button type="button" class="p-1 text-gray-400 hover:text-gray-700" @click="isRejectModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="confirmRejectRequest">
          <p class="text-xs text-gray-600 leading-relaxed">
            Rejecting this request will remove the staged document file and notify the employee with the reason.
          </p>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700">Rejection Reason *</label>
            <textarea
              v-model="rejectionReasonText"
              rows="3"
              required
              placeholder="e.g. Scanned copy is illegible or document number does not match."
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-gray-100 text-xs font-semibold text-gray-700"
              @click="isRejectModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              :disabled="!rejectionReasonText.trim() || actioningRequestId === targetRejectRequest.id"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- MODAL 3: ADMIN DIRECT DOCUMENT UPLOAD / UPDATE                    -->
    <!-- ================================================================= -->
    <div v-if="isAdminUploadModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="isAdminUploadModalOpen = false" />
      <div class="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 z-10 space-y-6">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <h3 class="text-base font-bold text-gray-900">Direct Staff Document Upload</h3>
            <p class="text-xs text-gray-500">Directly saves to permanent storage & updates profile_details</p>
          </div>
          <button type="button" class="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700" @click="isAdminUploadModalOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="handleAdminDirectUpload">
          <!-- Employee Selection -->
          <div class="space-y-1 relative z-20">
            <label class="text-xs font-semibold text-gray-700">Target Employee *</label>
            <div ref="adminUploadDropdownRef" class="relative w-full">
              <!-- Searchable Dropdown Trigger -->
              <button
                type="button"
                class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-white border border-gray-200 hover:border-emerald-400 text-left text-xs font-semibold text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                @click="toggleUploadDropdown"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <div
                    v-if="selectedUploadEmployee"
                    class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0"
                  >
                    {{ getInitials(selectedUploadEmployee.full_name) }}
                  </div>
                  <UIcon v-else name="i-heroicons-user" class="w-4 h-4 text-gray-400 shrink-0" />
                  <span v-if="selectedUploadEmployee" class="truncate font-bold text-gray-900">
                    {{ selectedUploadEmployee.full_name }}
                    <span class="text-gray-500 font-mono text-[11px] font-normal">({{ selectedUploadEmployee.employee_code || 'EMP' }})</span>
                  </span>
                  <span v-else class="text-gray-400 font-normal">Choose employee...</span>
                </div>
                <UIcon
                  name="i-heroicons-chevron-down"
                  class="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
                  :class="{ 'rotate-180 text-emerald-600': isAdminUploadDropdownOpen }"
                />
              </button>

              <!-- Dropdown Popover with Search & Filtered List -->
              <div
                v-if="isAdminUploadDropdownOpen"
                class="absolute left-0 top-full mt-1.5 w-full bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 p-2 space-y-2 animate-in fade-in duration-100"
              >
                <!-- Search Input inside Dropdown -->
                <div class="relative">
                  <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref="adminUploadSearchInputRef"
                    v-model="adminUploadSearchQuery"
                    type="text"
                    placeholder="Search by name, code, email..."
                    class="w-full pl-8 pr-7 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
                    @click.stop
                    @keydown.esc="isAdminUploadDropdownOpen = false"
                  />
                  <button
                    v-if="adminUploadSearchQuery"
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5"
                    @click.stop="adminUploadSearchQuery = ''"
                  >
                    <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Options List -->
                <div class="max-h-52 overflow-y-auto space-y-1 pr-1">
                  <button
                    v-for="emp in filteredUploadEmployees"
                    :key="emp.id"
                    type="button"
                    class="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left transition-colors text-xs"
                    :class="adminUploadTargetUserId === emp.id ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-gray-50 text-gray-700'"
                    @click="selectUploadEmployee(emp.id)"
                  >
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div
                        class="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0"
                        :class="adminUploadTargetUserId === emp.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'"
                      >
                        {{ getInitials(emp.full_name) }}
                      </div>
                      <div class="min-w-0">
                        <div class="truncate font-semibold leading-tight">{{ emp.full_name }}</div>
                        <div class="text-[10px] text-gray-400 font-mono truncate">
                          {{ emp.employee_code || 'EMP' }} • {{ emp.email || 'No email' }}
                        </div>
                      </div>
                    </div>
                    <UIcon
                      v-if="adminUploadTargetUserId === emp.id"
                      name="i-heroicons-check"
                      class="w-4 h-4 text-emerald-600 shrink-0"
                    />
                  </button>

                  <div v-if="filteredUploadEmployees.length === 0" class="py-4 text-center text-xs text-gray-400">
                    No employees matching "{{ adminUploadSearchQuery }}"
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Document Type Selection -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700">Document Type *</label>
            <select
              v-model="adminUploadDocType"
              required
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
              @change="onAdminDocTypeChange"
            >
              <option value="aadhaar">Aadhaar Card</option>
              <option value="pan">PAN Card</option>
              <option value="passport">Passport</option>
              <option value="cheque">Cancelled Cheque</option>
              <option value="passbook">Bank Passbook</option>
            </select>
          </div>

          <!-- Document Number / Bank Details Fields -->
          <div v-if="['aadhaar', 'pan', 'passport'].includes(adminUploadDocType)" class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-gray-700">{{ formatDocType(adminUploadDocType) }} Number *</label>
              <span class="text-[10px] text-gray-400 font-mono">
                <span v-if="adminUploadDocType === 'aadhaar'">12 Digits Only</span>
                <span v-else-if="adminUploadDocType === 'pan'">10 Characters (ABCDE1234F)</span>
                <span v-else>8 Characters Alphanumeric</span>
              </span>
            </div>
            <input
              v-model="adminUploadDocNumber"
              type="text"
              required
              :maxlength="adminUploadDocType === 'aadhaar' ? 14 : adminUploadDocType === 'pan' ? 10 : 9"
              :placeholder="adminUploadDocType === 'aadhaar' ? 'e.g. 1234 5678 9012' : adminUploadDocType === 'pan' ? 'e.g. ABCDE1234F' : 'e.g. A1234567'"
              class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs uppercase font-mono focus:bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <!-- Bank Fields if cheque/passbook -->
          <div v-if="['cheque', 'passbook'].includes(adminUploadDocType)" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-700">Account Holder Name *</label>
                <input
                  v-model="adminUploadBankDetails.account_holder"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-700">Account Type *</label>
                <select
                  v-model="adminUploadBankDetails.account_type"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                  <option value="Salary">Salary</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-700">Account Number *</label>
                <input
                  v-model="adminUploadBankDetails.account_number"
                  type="text"
                  required
                  placeholder="e.g. 501002345678"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs font-mono focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-700">IFSC Code *</label>
                <input
                  v-model="adminUploadBankDetails.ifsc_code"
                  type="text"
                  required
                  maxlength="11"
                  placeholder="e.g. HDFC0001234"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs uppercase font-mono focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-700">Bank Name</label>
                <input
                  v-model="adminUploadBankDetails.bank_name"
                  type="text"
                  placeholder="e.g. HDFC Bank"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-700">Branch Name</label>
                <input
                  v-model="adminUploadBankDetails.branch_name"
                  type="text"
                  placeholder="e.g. Connaught Place"
                  class="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- File Picker(s) -->
          <div v-if="adminUploadDocType === 'aadhaar'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-gray-700">Front Side *</label>
                <span class="text-[10px] text-gray-400">JPG/PNG · Max 5MB</span>
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                required
                class="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                @change="handleAdminFileFrontChange"
              />
            </div>
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-gray-700">Back Side *</label>
                <span class="text-[10px] text-gray-400">JPG/PNG · Max 5MB</span>
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                required
                class="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                @change="handleAdminFileBackChange"
              />
            </div>
          </div>

          <div v-else class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-gray-700">Select Document File *</label>
              <span class="text-[10px] text-gray-400">PDF, JPG, PNG · Max 5MB</span>
            </div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              required
              class="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              @change="handleAdminFileSingleChange"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-gray-100 text-xs font-semibold text-gray-700"
              @click="isAdminUploadModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
              :disabled="isAdminUploading"
            >
              <UIcon v-if="isAdminUploading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>{{ isAdminUploading ? 'Uploading...' : 'Save Document' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useAdminStore } from "~/stores/admin";
import { useUserProfileStore } from "~/stores/userProfile";

const supabase = useSupabaseClient();
const adminStore = useAdminStore();
const userProfileStore = useUserProfileStore();

// Navigation Tabs
type TabType = "approvals" | "vault" | "explorer";
const activeTab = ref<TabType>("approvals");
const isRefreshing = ref(false);

// =====================================================================
// TAB 1: VERIFICATION REQUESTS STATE & LOGIC
// =====================================================================
interface DocumentRequest {
  id: number;
  user_id: string;
  request_type: string;
  new_data: any;
  status: string;
  created_at: string;
  updated_at: string;
  user_note?: string | null;
  priority?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  rejection_reason?: string;
  profiles?: {
    id: string;
    full_name: string | null;
    employee_code: string | null;
    avatar_url: string | null;
  };
  reviewerName?: string | null;
  // Computed helpers
  documentType: string;
  documentNumber: string;
  isDualAadhaar: boolean;
  isBankDoc: boolean;
  hasAttachment?: boolean;
}

const requests = ref<DocumentRequest[]>([]);
const isLoadingRequests = ref(false);
const requestsSearchQuery = ref("");
const selectedStatusFilter = ref<string>("pending");
const actioningRequestId = ref<number | null>(null);

const requestStatusFilters = [
  { label: "Pending", value: "pending" },
  { label: "Under Review", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All Requests", value: "all" },
];

function normalizeStatus(s?: string | null): string {
  if (!s) return "pending";
  const clean = s.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (clean === "in_review") return "under_review";
  return clean;
}

function getReviewerName(reviewerId?: string | null): string {
  if (!reviewerId) return "";
  if (userProfileStore.profile?.id === reviewerId) {
    return userProfileStore.profile?.full_name || "You";
  }
  const emp = adminStore.employees.find((e) => e.id === reviewerId);
  return emp?.full_name || "Admin Reviewer";
}

function getStatusCount(statusKey: string): number {
  if (statusKey === "all") return requests.value.length;
  return requests.value.filter((r) => normalizeStatus(r.status) === statusKey).length;
}

const pendingRequestsCount = computed(() => {
  return requests.value.filter((r) => ["pending", "under_review"].includes(normalizeStatus(r.status))).length;
});

const filteredRequests = computed(() => {
  let list = requests.value;
  if (selectedStatusFilter.value !== "all") {
    list = list.filter((r) => normalizeStatus(r.status) === selectedStatusFilter.value);
  }
  if (requestsSearchQuery.value.trim()) {
    const q = requestsSearchQuery.value.toLowerCase();
    list = list.filter((r) => {
      const name = (r.profiles?.full_name || "").toLowerCase();
      const code = (r.profiles?.employee_code || "").toLowerCase();
      const docType = (r.documentType || "").toLowerCase();
      const docNum = (r.documentNumber || "").toLowerCase();
      const reviewer = (r.reviewerName || "").toLowerCase();
      const note = (r.user_note || "").toLowerCase();
      return name.includes(q) || code.includes(q) || docType.includes(q) || docNum.includes(q) || reviewer.includes(q) || note.includes(q);
    });
  }
  return list;
});

async function fetchRequests() {
  isLoadingRequests.value = true;
  try {
    const { data, error } = await (supabase as any)
      .from("requests")
      .select(`
        id,
        user_id,
        request_type,
        new_data,
        user_note,
        priority,
        status,
        reviewed_by,
        reviewed_at,
        review_note,
        rejection_reason,
        created_at,
        updated_at,
        profiles (
          id,
          full_name,
          employee_code,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    requests.value = (data || []).map((item: any) => {
      let parsedNewData: any = item.new_data;
      if (typeof parsedNewData === "string") {
        try {
          parsedNewData = JSON.parse(parsedNewData);
        } catch (_) {
          parsedNewData = {};
        }
      } else if (!parsedNewData) {
        parsedNewData = {};
      }

      const docType =
        parsedNewData.document_type ||
        parsedNewData.doc_type ||
        parsedNewData.documentType ||
        parsedNewData.subtype ||
        (item.request_type === "device_change" ? "device_change" : "document");

      const docNum =
        parsedNewData[`${docType}_number`] ||
        parsedNewData.document_number ||
        parsedNewData.number ||
        parsedNewData.account_number ||
        "";

      const isDual =
        docType === "aadhaar" &&
        !!parsedNewData.staging_path_front &&
        !!parsedNewData.staging_path_back;

      const isBank = ["cheque", "passbook"].includes(docType);

      const isNonEmptyStr = (val: any) => typeof val === "string" && val.trim().length > 0;
      const isNonDocSubtype = [
        "device_change",
        "profile_field",
        "family_field",
        "children",
        "nominees",
      ].includes(parsedNewData.subtype) || item.request_type === "device_change" || docType === "device_change";

      const hasAttach =
        !isNonDocSubtype &&
        Boolean(
          isNonEmptyStr(parsedNewData.staging_path) ||
            isNonEmptyStr(parsedNewData.staging_path_front) ||
            isNonEmptyStr(parsedNewData.staging_path_back) ||
            isNonEmptyStr(parsedNewData.file_path) ||
            isNonEmptyStr(parsedNewData.file_url) ||
            isNonEmptyStr(parsedNewData.attachment_url) ||
            isNonEmptyStr(parsedNewData.document_url) ||
            isNonEmptyStr(parsedNewData.storage_path) ||
            isNonEmptyStr(parsedNewData.url) ||
            isNonEmptyStr(parsedNewData.attachment) ||
            (Array.isArray(parsedNewData.attachments) && parsedNewData.attachments.length > 0)
        );

      const prof = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      const emp = adminStore.employees.find((e) => e.id === item.user_id);
      const resolvedProfile = {
        id: item.user_id,
        full_name: prof?.full_name || emp?.full_name || "Employee",
        employee_code: prof?.employee_code || emp?.employee_code || "EMP-???",
        avatar_url: prof?.avatar_url || emp?.avatar_url || null,
      };

      return {
        ...item,
        new_data: parsedNewData,
        profiles: resolvedProfile,
        documentType: docType,
        documentNumber: docNum,
        isDualAadhaar: isDual,
        isBankDoc: isBank,
        hasAttachment: hasAttach,
        reviewerName: getReviewerName(item.reviewed_by),
      };
    });
  } catch (err: any) {
    console.error("Failed to fetch document requests:", err);
  } finally {
    isLoadingRequests.value = false;
  }
}

function hasAttachment(req: DocumentRequest | any): boolean {
  if (!req) return false;
  if (typeof req.hasAttachment === "boolean") return req.hasAttachment;
  const d = req.new_data || {};
  if (
    req.request_type === "device_change" ||
    req.documentType === "device_change" ||
    ["device_change", "profile_field", "family_field", "children", "nominees"].includes(d.subtype)
  ) {
    return false;
  }
  const isNonEmptyStr = (val: any) => typeof val === "string" && val.trim().length > 0;
  return Boolean(
    isNonEmptyStr(d.staging_path) ||
    isNonEmptyStr(d.staging_path_front) ||
    isNonEmptyStr(d.staging_path_back) ||
    isNonEmptyStr(d.file_path) ||
    isNonEmptyStr(d.file_url) ||
    isNonEmptyStr(d.attachment_url) ||
    isNonEmptyStr(d.document_url) ||
    isNonEmptyStr(d.storage_path) ||
    isNonEmptyStr(d.url) ||
    isNonEmptyStr(d.attachment) ||
    (Array.isArray(d.attachments) && d.attachments.length > 0)
  );
}

// Review Inspection Modal State
const isReviewModalOpen = ref(false);
const selectedReviewRequest = ref<DocumentRequest | null>(null);
const isLoadingPreviewUrls = ref(false);
const previewUrlFront = ref<string | null>(null);
const previewUrlBack = ref<string | null>(null);
const previewUrlSingle = ref<string | null>(null);

async function openReviewModal(req: DocumentRequest) {
  if (!hasAttachment(req)) return;
  selectedReviewRequest.value = req;
  isReviewModalOpen.value = true;
  isLoadingPreviewUrls.value = true;
  previewUrlFront.value = null;
  previewUrlBack.value = null;
  previewUrlSingle.value = null;

  try {
    const isApproved = normalizeStatus(req.status) === "approved";

    if (req.isDualAadhaar) {
      let frontPath = req.new_data?.staging_path_front;
      let backPath = req.new_data?.staging_path_back;

      // If approved, staged files moved to permanent path — fallback to profile_details
      if (isApproved) {
        const { data: profDetails } = await (supabase as any)
          .from("profile_details")
          .select("aadhaar_url, aadhaar_back_url")
          .eq("user_id", req.user_id)
          .maybeSingle();
        if (profDetails) {
          frontPath = profDetails.aadhaar_url || frontPath;
          backPath = profDetails.aadhaar_back_url || backPath;
        }
      }

      if (frontPath) {
        const { data: fData } = await supabase.storage.from("profile-documents").createSignedUrl(frontPath, 3600);
        previewUrlFront.value = fData?.signedUrl || null;
      }
      if (backPath) {
        const { data: bData } = await supabase.storage.from("profile-documents").createSignedUrl(backPath, 3600);
        previewUrlBack.value = bData?.signedUrl || null;
      }
    } else {
      let storagePath = req.new_data?.staging_path;

      // If approved, staged file moved to permanent path — fallback to profile_details
      if (isApproved) {
        const urlCol = getProfileDetailsUrlColumn(req.documentType);
        if (urlCol) {
          const { data: profDetails } = await (supabase as any)
            .from("profile_details")
            .select(urlCol)
            .eq("user_id", req.user_id)
            .maybeSingle();
          if (profDetails && profDetails[urlCol]) {
            storagePath = profDetails[urlCol];
          }
        }
      }

      if (storagePath) {
        const { data: sData } = await supabase.storage.from("profile-documents").createSignedUrl(storagePath, 3600);
        previewUrlSingle.value = sData?.signedUrl || null;
      }
    }
  } catch (err: any) {
    console.error("Failed to generate preview signed URLs:", err);
  } finally {
    isLoadingPreviewUrls.value = false;
  }
}

// Approve Request Workflow
async function approveRequest(req: DocumentRequest) {
  if (!confirm(`Are you sure you want to approve ${formatDocType(req.documentType)} for ${req.profiles?.full_name}?`)) {
    return;
  }

  actioningRequestId.value = req.id;
  try {
    const userId = req.user_id;
    const reviewerId = userProfileStore.profile?.id || userId;

    // Check if this is a profile update or device change (non-document request)
    const isProfileUpdate =
      req.request_type === "profile_update" ||
      req.request_type === "device_change" ||
      !req.new_data?.document_type ||
      req.documentType === "device_change" ||
      [
        "device_change",
        "profile_field",
        "family_field",
        "children",
        "nominees",
      ].includes(req.new_data?.subtype);

    if (isProfileUpdate) {
      // Universal RPC for profile / device change requests (no storage file operations needed)
      const { error: rpcErr } = await (supabase as any).rpc("approve_profile_update_request", {
        p_request_id: req.id,
        p_reviewer_id: reviewerId,
      });

      if (rpcErr) {
        // Fallback for device_change in case the request in database has request_type = 'device_change'
        // instead of request_type = 'profile_update'
        if (
          (req.documentType === "device_change" ||
            req.new_data?.subtype === "device_change" ||
            req.request_type === "device_change") &&
          rpcErr.message?.includes("Request not found")
        ) {
          const deviceInfo = req.new_data?.device_info || null;
          const { error: profileErr } = await (supabase as any)
            .from("profiles")
            .update({
              device_info: deviceInfo,
              new_device_info: null,
            })
            .eq("id", userId);

          if (profileErr) throw profileErr;

          const { error: reqErr } = await (supabase as any)
            .from("requests")
            .update({
              status: "approved",
              reviewed_by: reviewerId,
              reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", req.id);

          if (reqErr) throw reqErr;
        } else {
          throw rpcErr;
        }
      }

      alert(`${formatDocType(req.documentType)} approved successfully!`);
      isReviewModalOpen.value = false;
      await fetchRequests();
      if (selectedEmployeeId.value === req.user_id) {
        await fetchEmployeeDetails();
      }
      return;
    }

    // Document upload request workflow: move file in storage & update profile_details
    const docType = req.documentType;
    const dateFolder = req.new_data?.date_folder || new Date().toISOString().split("T")[0];

    let permanentPath = "";
    let permanentPathBack: string | null = null;

    if (req.isDualAadhaar) {
      const frontStaging = req.new_data.staging_path_front;
      const backStaging = req.new_data.staging_path_back;
      const frontExt = frontStaging.split(".").pop() || "jpg";
      const backExt = backStaging.split(".").pop() || "jpg";

      const frontPerm = `${userId}/aadhaar/${dateFolder}/front.${frontExt}`;
      const backPerm = `${userId}/aadhaar/${dateFolder}/back.${backExt}`;

      // Move front
      await supabase.storage.from("profile-documents").remove([frontPerm]).catch(() => {});
      await supabase.storage.from("profile-documents").move(frontStaging, frontPerm);

      // Move back
      await supabase.storage.from("profile-documents").remove([backPerm]).catch(() => {});
      await supabase.storage.from("profile-documents").move(backStaging, backPerm);

      permanentPath = frontPerm;
      permanentPathBack = backPerm;
    } else {
      const stagingPath = req.new_data?.staging_path;
      const fileName = stagingPath ? stagingPath.split("/").pop() || "document.pdf" : "document.pdf";
      permanentPath = `${userId}/${docType}/${dateFolder}/${fileName}`;

      if (stagingPath) {
        await supabase.storage.from("profile-documents").remove([permanentPath]).catch(() => {});
        await supabase.storage.from("profile-documents").move(stagingPath, permanentPath);
      }
    }

    // Call approve_document_request RPC
    const { error: rpcErr } = await (supabase as any).rpc("approve_document_request", {
      p_request_id: req.id,
      p_reviewer_id: reviewerId,
      p_permanent_path: permanentPath,
      p_permanent_path_back: permanentPathBack,
    });

    if (rpcErr) throw rpcErr;

    alert(`Document approved successfully! Compliance records updated.`);
    isReviewModalOpen.value = false;
    await fetchRequests();
    if (selectedEmployeeId.value === req.user_id) {
      await fetchEmployeeDetails();
    }
  } catch (err: any) {
    alert("Approval failed: " + err.message);
  } finally {
    actioningRequestId.value = null;
  }
}

// Reject Request Modal & Logic
const isRejectModalOpen = ref(false);
const targetRejectRequest = ref<DocumentRequest | null>(null);
const rejectionReasonText = ref("");

function openRejectModal(req: DocumentRequest) {
  targetRejectRequest.value = req;
  rejectionReasonText.value = "";
  isRejectModalOpen.value = true;
}

async function confirmRejectRequest() {
  if (!targetRejectRequest.value || !rejectionReasonText.value.trim()) return;

  const req = targetRejectRequest.value;
  actioningRequestId.value = req.id;
  try {
    const reviewerId = userProfileStore.profile?.id || req.user_id;

    // Remove staged file(s) from profile-documents if any exist
    const pathsToRemove: string[] = [];
    if (req.isDualAadhaar) {
      if (req.new_data?.staging_path_front) pathsToRemove.push(req.new_data.staging_path_front);
      if (req.new_data?.staging_path_back) pathsToRemove.push(req.new_data.staging_path_back);
    } else if (req.new_data?.staging_path) {
      pathsToRemove.push(req.new_data.staging_path);
    }

    if (pathsToRemove.length > 0) {
      await supabase.storage.from("profile-documents").remove(pathsToRemove).catch(() => {});
    }

    // Call reject_document_request RPC
    const { error: rpcErr } = await (supabase as any).rpc("reject_document_request", {
      p_request_id: req.id,
      p_reviewer_id: reviewerId,
      p_rejection_reason: rejectionReasonText.value.trim(),
    });

    if (rpcErr) throw rpcErr;

    // If device change request, clear new_device_info from profiles
    if (
      req.documentType === "device_change" ||
      req.new_data?.subtype === "device_change" ||
      req.request_type === "device_change"
    ) {
      await (supabase as any)
        .from("profiles")
        .update({ new_device_info: null })
        .eq("id", req.user_id);
    }

    alert("Request marked as rejected.");
    isRejectModalOpen.value = false;
    isReviewModalOpen.value = false;
    await fetchRequests();
  } catch (err: any) {
    alert("Rejection failed: " + err.message);
  } finally {
    actioningRequestId.value = null;
  }
}

// Mark under review
async function markUnderReview(req: DocumentRequest) {
  actioningRequestId.value = req.id;
  try {
    const reviewerId = userProfileStore.profile?.id || req.user_id;
    const now = new Date().toISOString();
    const { error } = await (supabase as any)
      .from("requests")
      .update({
        status: "under_review",
        reviewed_by: reviewerId,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", req.id);

    if (error) throw error;
    req.status = "under_review";
    req.reviewed_by = reviewerId;
    req.reviewed_at = now;
    req.reviewerName = getReviewerName(reviewerId);
  } catch (err: any) {
    alert("Failed to update status: " + err.message);
  } finally {
    actioningRequestId.value = null;
  }
}

// Move back to pending
async function markBackToPending(req: DocumentRequest) {
  actioningRequestId.value = req.id;
  try {
    const now = new Date().toISOString();
    const { error } = await (supabase as any)
      .from("requests")
      .update({
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        updated_at: now,
      })
      .eq("id", req.id);

    if (error) throw error;
    req.status = "pending";
    req.reviewed_by = null;
    req.reviewed_at = null;
    req.reviewerName = null;
  } catch (err: any) {
    alert("Failed to move back to pending: " + err.message);
  } finally {
    actioningRequestId.value = null;
  }
}

// =====================================================================
// TAB 2: EMPLOYEE DOCUMENT VAULT (Dossier) STATE & LOGIC
// =====================================================================
interface ProfileDetails {
  id?: number;
  user_id: string;
  aadhaar_number?: string | null;
  aadhaar_url?: string | null;
  aadhaar_back_url?: string | null;
  pan_number?: string | null;
  pan_url?: string | null;
  passport_number?: string | null;
  passport_url?: string | null;
  cancelled_cheque_url?: string | null;
  passbook_url?: string | null;
  bank_details?: {
    account_holder?: string;
    account_number?: string;
    account_type?: string;
    ifsc_code?: string;
    bank_name?: string;
    branch_name?: string;
  } | null;
}

const selectedEmployeeId = ref("");
const currentProfileDetails = ref<ProfileDetails | null>(null);
const isLoadingVault = ref(false);
const isSyncingStorage = ref(false);

const isEmployeeDropdownOpen = ref(false);
const employeeSearchQuery = ref("");
const employeeDropdownRef = ref<HTMLElement | null>(null);
const employeeSearchInputRef = ref<HTMLInputElement | null>(null);

onClickOutside(employeeDropdownRef, () => {
  isEmployeeDropdownOpen.value = false;
});

const filteredVaultEmployees = computed(() => {
  const list = adminStore.employees || [];
  if (!employeeSearchQuery.value.trim()) return list;
  const q = employeeSearchQuery.value.toLowerCase().trim();
  return list.filter((emp) => {
    const name = (emp.full_name || "").toLowerCase();
    const code = (emp.employee_code || "").toLowerCase();
    const email = (emp.email || "").toLowerCase();
    const phone = (emp.phone || "").toLowerCase();
    return name.includes(q) || code.includes(q) || email.includes(q) || phone.includes(q);
  });
});

function toggleEmployeeDropdown() {
  isEmployeeDropdownOpen.value = !isEmployeeDropdownOpen.value;
  if (isEmployeeDropdownOpen.value) {
    nextTick(() => {
      employeeSearchInputRef.value?.focus();
    });
  }
}

function selectVaultEmployee(id: string) {
  selectedEmployeeId.value = id;
  isEmployeeDropdownOpen.value = false;
  employeeSearchQuery.value = "";
  fetchEmployeeDetails();
}

const selectedEmployee = computed(() => {
  return adminStore.employees.find((e) => e.id === selectedEmployeeId.value);
});

async function forceSyncVaultWithStorage() {
  if (!selectedEmployeeId.value) return;
  isSyncingStorage.value = true;
  try {
    await reconcileEmployeeDocumentsFromStorage(selectedEmployeeId.value, true);
  } finally {
    isSyncingStorage.value = false;
  }
}

// Scans storage bucket for any existing compliance files and reconciles them with profile_details
async function reconcileEmployeeDocumentsFromStorage(userId: string, force = false) {
  if (!userId) return;

  const current: ProfileDetails = currentProfileDetails.value
    ? { ...currentProfileDetails.value }
    : { user_id: userId, id: 0 };

  const updates: Record<string, any> = {};

  // 1. Aadhaar Card
  if (force || !current.aadhaar_url) {
    try {
      const { data: items } = await supabase.storage
        .from("profile-documents")
        .list(`${userId}/aadhaar`, {
          limit: 100,
          sortBy: { column: "name", order: "desc" },
        });

      if (items && items.length > 0) {
        const folders = items.filter((i) => !i.metadata || !i.metadata.mimetype || !i.name.includes("."));
        const directFiles = items.filter((i) => i.name.includes("."));

        let frontPath: string | null = null;
        let backPath: string | null = null;

        if (folders.length > 0 && folders[0]) {
          folders.sort((a, b) => b.name.localeCompare(a.name));
          const latestFolder = folders[0]?.name;

          if (latestFolder) {
            const { data: dateFiles } = await supabase.storage
              .from("profile-documents")
              .list(`${userId}/aadhaar/${latestFolder}`, { limit: 50 });

            if (dateFiles && dateFiles.length > 0) {
              const front = dateFiles.find((f) => f.name.toLowerCase().includes("front")) || dateFiles[0];
              const back = dateFiles.find((f) => f.name.toLowerCase().includes("back")) || (dateFiles.length > 1 && dateFiles[1]?.name !== front?.name ? dateFiles[1] : null);

              if (front) frontPath = `${userId}/aadhaar/${latestFolder}/${front.name}`;
              if (back) backPath = `${userId}/aadhaar/${latestFolder}/${back.name}`;
            }
          }
        } else if (directFiles.length > 0) {
          const front = directFiles.find((f) => f.name.toLowerCase().includes("front")) || directFiles[0];
          const back = directFiles.find((f) => f.name.toLowerCase().includes("back"));

          if (front) frontPath = `${userId}/aadhaar/${front.name}`;
          if (back) backPath = `${userId}/aadhaar/${back.name}`;
        }

        if (frontPath) {
          current.aadhaar_url = frontPath;
          updates.aadhaar_url = frontPath;
          if (backPath) {
            current.aadhaar_back_url = backPath;
            updates.aadhaar_back_url = backPath;
          }
        }
      }
    } catch (e) {
      console.warn("Storage check for aadhaar failed:", e);
    }
  }

  // 2. PAN Card
  if (force || !current.pan_url) {
    try {
      const { data: items } = await supabase.storage
        .from("profile-documents")
        .list(`${userId}/pan`, {
          limit: 50,
          sortBy: { column: "name", order: "desc" },
        });

      if (items && items.length > 0) {
        const folders = items.filter((i) => !i.metadata || !i.metadata.mimetype || !i.name.includes("."));
        const directFiles = items.filter((i) => i.name.includes("."));

        let panPath: string | null = null;
        if (folders.length > 0 && folders[0]) {
          folders.sort((a, b) => b.name.localeCompare(a.name));
          const latestFolder = folders[0]?.name;
          if (latestFolder) {
            const { data: dateFiles } = await supabase.storage
              .from("profile-documents")
              .list(`${userId}/pan/${latestFolder}`, { limit: 10 });
            if (dateFiles && dateFiles.length > 0 && dateFiles[0]) {
              panPath = `${userId}/pan/${latestFolder}/${dateFiles[0].name}`;
            }
          }
        } else if (directFiles.length > 0 && directFiles[0]) {
          panPath = `${userId}/pan/${directFiles[0].name}`;
        }

        if (panPath) {
          current.pan_url = panPath;
          updates.pan_url = panPath;
        }
      }
    } catch (e) {
      console.warn("Storage check for pan failed:", e);
    }
  }

  // 3. Passport
  if (force || !current.passport_url) {
    try {
      const { data: items } = await supabase.storage
        .from("profile-documents")
        .list(`${userId}/passport`, {
          limit: 50,
          sortBy: { column: "name", order: "desc" },
        });

      if (items && items.length > 0) {
        const folders = items.filter((i) => !i.metadata || !i.metadata.mimetype || !i.name.includes("."));
        const directFiles = items.filter((i) => i.name.includes("."));

        let passPath: string | null = null;
        if (folders.length > 0 && folders[0]) {
          folders.sort((a, b) => b.name.localeCompare(a.name));
          const latestFolder = folders[0]?.name;
          if (latestFolder) {
            const { data: dateFiles } = await supabase.storage
              .from("profile-documents")
              .list(`${userId}/passport/${latestFolder}`, { limit: 10 });
            if (dateFiles && dateFiles.length > 0 && dateFiles[0]) {
              passPath = `${userId}/passport/${latestFolder}/${dateFiles[0].name}`;
            }
          }
        } else if (directFiles.length > 0 && directFiles[0]) {
          passPath = `${userId}/passport/${directFiles[0].name}`;
        }

        if (passPath) {
          current.passport_url = passPath;
          updates.passport_url = passPath;
        }
      }
    } catch (e) {
      console.warn("Storage check for passport failed:", e);
    }
  }

  // 4. Cancelled Cheque
  if (force || !current.cancelled_cheque_url) {
    try {
      const { data: items } = await supabase.storage
        .from("profile-documents")
        .list(`${userId}/cheque`, {
          limit: 50,
          sortBy: { column: "name", order: "desc" },
        });

      if (items && items.length > 0) {
        const folders = items.filter((i) => !i.metadata || !i.metadata.mimetype || !i.name.includes("."));
        const directFiles = items.filter((i) => i.name.includes("."));

        let chqPath: string | null = null;
        if (folders.length > 0 && folders[0]) {
          folders.sort((a, b) => b.name.localeCompare(a.name));
          const latestFolder = folders[0]?.name;
          if (latestFolder) {
            const { data: dateFiles } = await supabase.storage
              .from("profile-documents")
              .list(`${userId}/cheque/${latestFolder}`, { limit: 10 });
            if (dateFiles && dateFiles.length > 0 && dateFiles[0]) {
              chqPath = `${userId}/cheque/${latestFolder}/${dateFiles[0].name}`;
            }
          }
        } else if (directFiles.length > 0 && directFiles[0]) {
          chqPath = `${userId}/cheque/${directFiles[0].name}`;
        }

        if (chqPath) {
          current.cancelled_cheque_url = chqPath;
          updates.cancelled_cheque_url = chqPath;
        }
      }
    } catch (e) {
      console.warn("Storage check for cheque failed:", e);
    }
  }

  // 5. Passbook
  if (force || !current.passbook_url) {
    try {
      const { data: items } = await supabase.storage
        .from("profile-documents")
        .list(`${userId}/passbook`, {
          limit: 50,
          sortBy: { column: "name", order: "desc" },
        });

      if (items && items.length > 0) {
        const folders = items.filter((i) => !i.metadata || !i.metadata.mimetype || !i.name.includes("."));
        const directFiles = items.filter((i) => i.name.includes("."));

        let pbPath: string | null = null;
        if (folders.length > 0 && folders[0]) {
          folders.sort((a, b) => b.name.localeCompare(a.name));
          const latestFolder = folders[0]?.name;
          if (latestFolder) {
            const { data: dateFiles } = await supabase.storage
              .from("profile-documents")
              .list(`${userId}/passbook/${latestFolder}`, { limit: 10 });
            if (dateFiles && dateFiles.length > 0 && dateFiles[0]) {
              pbPath = `${userId}/passbook/${latestFolder}/${dateFiles[0].name}`;
            }
          }
        } else if (directFiles.length > 0 && directFiles[0]) {
          pbPath = `${userId}/passbook/${directFiles[0].name}`;
        }

        if (pbPath) {
          current.passbook_url = pbPath;
          updates.passbook_url = pbPath;
        }
      }
    } catch (e) {
      console.warn("Storage check for passbook failed:", e);
    }
  }

  // Immediately reflect in reactive state
  currentProfileDetails.value = current;

  // Persist discovered paths to profile_details table
  if (Object.keys(updates).length > 0) {
    try {
      updates.user_id = userId;
      updates.updated_at = new Date().toISOString();
      await (supabase as any)
        .from("profile_details")
        .upsert(updates, { onConflict: "user_id" });
    } catch (dbErr) {
      console.warn("Could not auto-heal profile_details:", dbErr);
    }
  }
}

async function fetchEmployeeDetails() {
  if (!selectedEmployeeId.value) {
    currentProfileDetails.value = null;
    return;
  }
  isLoadingVault.value = true;
  try {
    const { data, error } = await (supabase as any)
      .from("profile_details")
      .select("*")
      .eq("user_id", selectedEmployeeId.value)
      .maybeSingle();

    if (error) {
      console.warn("Could not load employee details from DB, checking storage fallback:", error);
    }
    currentProfileDetails.value = data || null;

    // Check storage bucket to discover any documents existing in bucket but missing in profile_details
    await reconcileEmployeeDocumentsFromStorage(selectedEmployeeId.value);
  } catch (err: any) {
    console.error("Failed to load employee details:", err);
  } finally {
    isLoadingVault.value = false;
  }
}

async function previewPermanentFile(path: string, label: string) {
  if (!path) return;
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      window.open(path, "_blank");
      return;
    }
    const { data, error } = await supabase.storage.from("profile-documents").createSignedUrl(path, 3600);
    if (error) throw error;
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  } catch (err: any) {
    alert(`Failed to preview ${label}: ` + err.message);
  }
}

async function downloadPermanentFile(path: string, defaultName: string) {
  if (!path) return;
  try {
    const fileName = path.split("/").pop() || defaultName;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const res = await fetch(path);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      return;
    }
    const { data, error } = await supabase.storage.from("profile-documents").createSignedUrl(path, 3600, {
      download: fileName,
    });
    if (error) throw error;
    if (data?.signedUrl) {
      const res = await fetch(data.signedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }
  } catch (err: any) {
    alert("Download failed: " + err.message);
  }
}

// Admin Direct Upload Modal
const isAdminUploadModalOpen = ref(false);
const adminUploadTargetUserId = ref("");
const adminUploadDocType = ref("pan");
const adminUploadDocNumber = ref("");
const adminUploadBankDetails = ref({
  account_holder: "",
  account_number: "",
  account_type: "Savings",
  ifsc_code: "",
  bank_name: "",
  branch_name: "",
});
const adminUploadFileSingle = ref<File | null>(null);
const adminUploadFileFront = ref<File | null>(null);
const adminUploadFileBack = ref<File | null>(null);
const isAdminUploading = ref(false);

const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB matching Flutter

function syncAdminUploadDefaults(targetUserId: string, docType: string) {
  const emp = adminStore.employees.find((e) => e.id === targetUserId);
  adminUploadDocNumber.value = "";
  if (targetUserId === selectedEmployeeId.value && currentProfileDetails.value) {
    const details = currentProfileDetails.value;
    if (docType === "aadhaar") {
      adminUploadDocNumber.value = details.aadhaar_number || "";
    } else if (docType === "pan") {
      adminUploadDocNumber.value = details.pan_number || "";
    } else if (docType === "passport") {
      adminUploadDocNumber.value = details.passport_number || "";
    }
    const bd = details.bank_details;
    adminUploadBankDetails.value = {
      account_holder: bd?.account_holder || emp?.full_name || "",
      account_number: bd?.account_number || "",
      account_type: bd?.account_type || "Savings",
      ifsc_code: bd?.ifsc_code || "",
      bank_name: bd?.bank_name || "",
      branch_name: bd?.branch_name || "",
    };
  } else {
    adminUploadBankDetails.value = {
      account_holder: emp?.full_name || "",
      account_number: "",
      account_type: "Savings",
      ifsc_code: "",
      bank_name: "",
      branch_name: "",
    };
  }
}

const isAdminUploadDropdownOpen = ref(false);
const adminUploadSearchQuery = ref("");
const adminUploadDropdownRef = ref<HTMLElement | null>(null);
const adminUploadSearchInputRef = ref<HTMLInputElement | null>(null);

onClickOutside(adminUploadDropdownRef, () => {
  isAdminUploadDropdownOpen.value = false;
});

const filteredUploadEmployees = computed(() => {
  const list = adminStore.employees || [];
  if (!adminUploadSearchQuery.value.trim()) return list;
  const q = adminUploadSearchQuery.value.toLowerCase().trim();
  return list.filter((emp) => {
    const name = (emp.full_name || "").toLowerCase();
    const code = (emp.employee_code || "").toLowerCase();
    const email = (emp.email || "").toLowerCase();
    return name.includes(q) || code.includes(q) || email.includes(q);
  });
});

const selectedUploadEmployee = computed(() => {
  return adminStore.employees.find((e) => e.id === adminUploadTargetUserId.value);
});

function toggleUploadDropdown() {
  isAdminUploadDropdownOpen.value = !isAdminUploadDropdownOpen.value;
  if (isAdminUploadDropdownOpen.value) {
    nextTick(() => {
      adminUploadSearchInputRef.value?.focus();
    });
  }
}

function selectUploadEmployee(id: string) {
  adminUploadTargetUserId.value = id;
  isAdminUploadDropdownOpen.value = false;
  adminUploadSearchQuery.value = "";
  syncAdminUploadDefaults(id, adminUploadDocType.value);
}

function onAdminDocTypeChange() {
  syncAdminUploadDefaults(adminUploadTargetUserId.value, adminUploadDocType.value);
  adminUploadFileSingle.value = null;
  adminUploadFileFront.value = null;
  adminUploadFileBack.value = null;
}

function handleAdminFileSingleChange(e: any) {
  const file = e.target.files?.[0];
  if (!file) {
    adminUploadFileSingle.value = null;
    return;
  }
  if (file.size > MAX_DOC_SIZE) {
    alert(`File "${file.name}" exceeds the 5MB size limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a file under 5MB.`);
    e.target.value = "";
    adminUploadFileSingle.value = null;
    return;
  }
  adminUploadFileSingle.value = file;
}

function handleAdminFileFrontChange(e: any) {
  const file = e.target.files?.[0];
  if (!file) {
    adminUploadFileFront.value = null;
    return;
  }
  if (file.size > MAX_DOC_SIZE) {
    alert(`Front file "${file.name}" exceeds the 5MB size limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a file under 5MB.`);
    e.target.value = "";
    adminUploadFileFront.value = null;
    return;
  }
  adminUploadFileFront.value = file;
}

function handleAdminFileBackChange(e: any) {
  const file = e.target.files?.[0];
  if (!file) {
    adminUploadFileBack.value = null;
    return;
  }
  if (file.size > MAX_DOC_SIZE) {
    alert(`Back file "${file.name}" exceeds the 5MB size limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a file under 5MB.`);
    e.target.value = "";
    adminUploadFileBack.value = null;
    return;
  }
  adminUploadFileBack.value = file;
}

function openAdminUploadModal() {
  adminUploadTargetUserId.value = selectedEmployeeId.value || (adminStore.employees[0]?.id ?? "");
  adminUploadDocType.value = "pan";
  syncAdminUploadDefaults(adminUploadTargetUserId.value, "pan");
  adminUploadFileSingle.value = null;
  adminUploadFileFront.value = null;
  adminUploadFileBack.value = null;
  isAdminUploadModalOpen.value = true;
}

function openAdminDirectUploadModal(docType: string) {
  adminUploadTargetUserId.value = selectedEmployeeId.value;
  adminUploadDocType.value = docType;
  syncAdminUploadDefaults(adminUploadTargetUserId.value, docType);
  adminUploadFileSingle.value = null;
  adminUploadFileFront.value = null;
  adminUploadFileBack.value = null;
  isAdminUploadModalOpen.value = true;
}

async function handleAdminDirectUpload() {
  if (!adminUploadTargetUserId.value) {
    alert("Please select a target employee.");
    return;
  }

  const userId = adminUploadTargetUserId.value;
  const docType = adminUploadDocType.value;
  const dateFolder = new Date().toISOString().split("T")[0];

  // 1. Thorough Validation matching Flutter App specifications
  if (docType === "aadhaar") {
    if (!adminUploadFileFront.value) {
      alert("Please select the front side photo of Aadhaar.");
      return;
    }
    if (!adminUploadFileBack.value) {
      alert("Please select the back side photo of Aadhaar.");
      return;
    }
    if (adminUploadFileFront.value.size > MAX_DOC_SIZE || adminUploadFileBack.value.size > MAX_DOC_SIZE) {
      alert("Aadhaar files must not exceed 5MB.");
      return;
    }
    const cleanAadhaar = adminUploadDocNumber.value.replace(/\D/g, "");
    if (cleanAadhaar.length !== 12) {
      alert("Aadhaar number must be exactly 12 digits.");
      return;
    }
    adminUploadDocNumber.value = cleanAadhaar;

  } else if (docType === "pan") {
    if (!adminUploadFileSingle.value) {
      alert("Please select the PAN card document file.");
      return;
    }
    if (adminUploadFileSingle.value.size > MAX_DOC_SIZE) {
      alert("PAN document file must not exceed 5MB.");
      return;
    }
    const cleanPan = adminUploadDocNumber.value.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
      alert("Enter a valid 10-character PAN number (e.g. ABCDE1234F).");
      return;
    }
    adminUploadDocNumber.value = cleanPan;

  } else if (docType === "passport") {
    if (!adminUploadFileSingle.value) {
      alert("Please select the Passport document file.");
      return;
    }
    if (adminUploadFileSingle.value.size > MAX_DOC_SIZE) {
      alert("Passport document file must not exceed 5MB.");
      return;
    }
    const cleanPassport = adminUploadDocNumber.value.trim().toUpperCase();
    if (cleanPassport.length < 8) {
      alert("Passport number must be at least 8 alphanumeric characters.");
      return;
    }
    adminUploadDocNumber.value = cleanPassport;

  } else if (["cheque", "passbook"].includes(docType)) {
    if (!adminUploadFileSingle.value) {
      alert(`Please select the ${docType === 'cheque' ? 'Cancelled Cheque' : 'Bank Passbook'} document file.`);
      return;
    }
    if (adminUploadFileSingle.value.size > MAX_DOC_SIZE) {
      alert("Bank document file must not exceed 5MB.");
      return;
    }
    if (!adminUploadBankDetails.value.account_holder.trim()) {
      alert("Account Holder Name is required.");
      return;
    }
    if (!adminUploadBankDetails.value.account_number.trim()) {
      alert("Account Number is required.");
      return;
    }
    const cleanIfsc = adminUploadBankDetails.value.ifsc_code.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      alert("Enter a valid 11-character IFSC code (e.g. HDFC0001234).");
      return;
    }
    adminUploadBankDetails.value.ifsc_code = cleanIfsc;
  }

  isAdminUploading.value = true;

  try {
    // 2. Ensure profile_details row exists
    await (supabase as any)
      .from("profile_details")
      .upsert({ user_id: userId }, { onConflict: "user_id" });

    // Fetch previous paths to clean up obsolete permanent files
    const { data: prevDetails } = await (supabase as any)
      .from("profile_details")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (docType === "aadhaar") {
      const frontExt = adminUploadFileFront.value!.name.split(".").pop()?.toLowerCase() || "jpg";
      const backExt = adminUploadFileBack.value!.name.split(".").pop()?.toLowerCase() || "jpg";

      // EXACT Flutter permanent bucket path convention:
      const frontPerm = `${userId}/aadhaar/${dateFolder}/front.${frontExt}`;
      const backPerm = `${userId}/aadhaar/${dateFolder}/back.${backExt}`;

      // Clean up previous files if different
      const toRemove: string[] = [];
      if (prevDetails?.aadhaar_url && prevDetails.aadhaar_url !== frontPerm) {
        toRemove.push(prevDetails.aadhaar_url);
      }
      if (prevDetails?.aadhaar_back_url && prevDetails.aadhaar_back_url !== backPerm) {
        toRemove.push(prevDetails.aadhaar_back_url);
      }
      if (toRemove.length > 0) {
        await supabase.storage.from("profile-documents").remove(toRemove).catch(() => {});
      }

      // Upload front & back to permanent storage
      const { error: frontErr } = await supabase.storage
        .from("profile-documents")
        .upload(frontPerm, adminUploadFileFront.value!, { upsert: true });
      if (frontErr) throw frontErr;

      const { error: backErr } = await supabase.storage
        .from("profile-documents")
        .upload(backPerm, adminUploadFileBack.value!, { upsert: true });
      if (backErr) throw backErr;

      // Update compliance record
      const { error: dbErr } = await (supabase as any)
        .from("profile_details")
        .update({
          aadhaar_number: adminUploadDocNumber.value.trim(),
          aadhaar_url: frontPerm,
          aadhaar_back_url: backPerm,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (dbErr) throw dbErr;

    } else if (["cheque", "passbook"].includes(docType)) {
      const ext = adminUploadFileSingle.value!.name.split(".").pop()?.toLowerCase() || "pdf";
      // EXACT Flutter permanent bucket path convention:
      const permPath = `${userId}/${docType}/${dateFolder}/document.${ext}`;

      const urlCol = docType === "cheque" ? "cancelled_cheque_url" : "passbook_url";
      if (prevDetails?.[urlCol] && prevDetails[urlCol] !== permPath) {
        await supabase.storage.from("profile-documents").remove([prevDetails[urlCol]]).catch(() => {});
      }

      const { error: upErr } = await supabase.storage
        .from("profile-documents")
        .upload(permPath, adminUploadFileSingle.value!, { upsert: true });
      if (upErr) throw upErr;

      const { error: dbErr } = await (supabase as any)
        .from("profile_details")
        .update({
          [urlCol]: permPath,
          bank_details: {
            account_holder: adminUploadBankDetails.value.account_holder.trim(),
            account_number: adminUploadBankDetails.value.account_number.trim(),
            account_type: adminUploadBankDetails.value.account_type,
            ifsc_code: adminUploadBankDetails.value.ifsc_code.trim().toUpperCase(),
            bank_name: adminUploadBankDetails.value.bank_name.trim(),
            branch_name: adminUploadBankDetails.value.branch_name.trim(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (dbErr) throw dbErr;

    } else {
      // PAN or Passport
      const ext = adminUploadFileSingle.value!.name.split(".").pop()?.toLowerCase() || "pdf";
      // EXACT Flutter permanent bucket path convention:
      const permPath = `${userId}/${docType}/${dateFolder}/document.${ext}`;

      const numberCol = `${docType}_number`;
      const urlCol = `${docType}_url`;

      if (prevDetails?.[urlCol] && prevDetails[urlCol] !== permPath) {
        await supabase.storage.from("profile-documents").remove([prevDetails[urlCol]]).catch(() => {});
      }

      const { error: upErr } = await supabase.storage
        .from("profile-documents")
        .upload(permPath, adminUploadFileSingle.value!, { upsert: true });
      if (upErr) throw upErr;

      const { error: dbErr } = await (supabase as any)
        .from("profile_details")
        .update({
          [numberCol]: adminUploadDocNumber.value.trim(),
          [urlCol]: permPath,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (dbErr) throw dbErr;
    }

    // 3. Auto-resolve pending/under_review requests for this user & docType if any
    try {
      const { data: activeRequests } = await (supabase as any)
        .from("requests")
        .select("id, new_data")
        .eq("user_id", userId)
        .in("status", ["pending", "under_review"]);

      const matching = activeRequests?.filter(
        (r: any) => r.new_data?.document_type === docType
      );
      if (matching && matching.length > 0) {
        const reviewerId = userProfileStore.profile?.id || userId;
        for (const req of matching) {
          const stagingFiles = [
            req.new_data?.staging_path,
            req.new_data?.staging_path_front,
            req.new_data?.staging_path_back,
          ].filter(Boolean);
          if (stagingFiles.length > 0) {
            await supabase.storage.from("profile-documents").remove(stagingFiles).catch(() => {});
          }
          await (supabase as any)
            .from("requests")
            .update({
              status: "approved",
              reviewed_by: reviewerId,
              reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", req.id);
        }
        await fetchRequests();
      }
    } catch (reqErr) {
      console.warn("Could not auto-resolve pending request:", reqErr);
    }

    alert(`Successfully saved ${formatDocType(docType)} to employee compliance record in storage.`);
    isAdminUploadModalOpen.value = false;

    if (selectedEmployeeId.value === userId) {
      await fetchEmployeeDetails();
    }
  } catch (err: any) {
    alert("Upload failed: " + err.message);
  } finally {
    isAdminUploading.value = false;
  }
}

// =====================================================================
// TAB 3: STORAGE EXPLORER STATE & LOGIC
// =====================================================================
interface StorageFile {
  name: string;
  id?: string;
  created_at?: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  };
}

const currentPath = ref("");
const files = ref<StorageFile[]>([]);
const isLoadingFiles = ref(false);
const explorerSearchQuery = ref("");


const currentPathSegments = computed(() => {
  return currentPath.value.split("/").filter(Boolean);
});

const filteredFiles = computed(() => {
  if (!explorerSearchQuery.value.trim()) return files.value;
  const q = explorerSearchQuery.value.toLowerCase().trim();

  return files.value.filter((f) => {
    // 1. Raw file/folder name
    const rawName = (f.name || "").toLowerCase();
    if (rawName.includes(q)) return true;

    // 2. Resolved display name (resolves UUID to "Name (Code)")
    const displayName = resolveItemDisplayName(f.name).toLowerCase();
    if (displayName.includes(q)) return true;

    // 3. Formatted document type (e.g. "aadhaar" -> "Aadhaar Card", "pan" -> "PAN Card")
    const docTypeLabel = formatDocType(f.name).toLowerCase();
    if (docTypeLabel.includes(q)) return true;

    // 4. Employee matching if item is an employee UUID folder
    const emp = adminStore.employees.find((e) => e.id === f.name);
    if (emp) {
      const name = (emp.full_name || "").toLowerCase();
      const code = (emp.employee_code || "").toLowerCase();
      const email = (emp.email || "").toLowerCase();
      if (name.includes(q) || code.includes(q) || email.includes(q)) return true;
    }

    // 5. File extension check (e.g. searching "pdf", "jpg", "png")
    const ext = getFileExt(f.name).toLowerCase();
    if (ext && ext.includes(q)) return true;

    return false;
  });
});

function isFolder(item: StorageFile): boolean {
  return !item.metadata || !item.metadata.mimetype;
}

function resolvePathLabel(segment: string, index: number): string {
  if (index === 0) {
    const emp = adminStore.employees.find((e) => e.id === segment);
    if (emp) return `${emp.full_name || 'Staff'} (${emp.employee_code || 'EMP'})`;
  }
  return segment;
}

function resolveItemDisplayName(name: string): string {
  // If at root level, name is userId folder
  if (!currentPath.value) {
    const emp = adminStore.employees.find((e) => e.id === name);
    if (emp) return `${emp.full_name || 'Staff'} (${emp.employee_code || 'EMP'})`;
  }
  return name;
}

async function fetchFiles() {
  isLoadingFiles.value = true;
  try {
    const { data, error } = await supabase.storage.from("profile-documents").list(currentPath.value, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    files.value = (data || []).filter((f) => f.name !== ".emptyFolderPlaceholder");
  } catch (err: any) {
    console.error("Failed to list files:", err);
    files.value = [];
  } finally {
    isLoadingFiles.value = false;
  }
}

function openFolder(folderName: string) {
  currentPath.value = currentPath.value ? `${currentPath.value}/${folderName}` : folderName;
  explorerSearchQuery.value = "";
  fetchFiles();
}

function navigateToFolder(path: string) {
  currentPath.value = path;
  explorerSearchQuery.value = "";
  fetchFiles();
}

function navigateToSegmentIndex(idx: number) {
  const segs = currentPathSegments.value.slice(0, idx + 1);
  currentPath.value = segs.join("/");
  explorerSearchQuery.value = "";
  fetchFiles();
}


const downloadingFileName = ref<string | null>(null);
const previewingFileName = ref<string | null>(null);

async function previewSignedFile(fileName: string) {
  previewingFileName.value = fileName;
  try {
    const fullPath = currentPath.value ? `${currentPath.value}/${fileName}` : fileName;
    const { data, error } = await supabase.storage.from("profile-documents").createSignedUrl(fullPath, 3600);
    if (error) throw error;
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  } catch (err: any) {
    alert("Failed to view file: " + err.message);
  } finally {
    previewingFileName.value = null;
  }
}

async function downloadSignedFile(fileName: string) {
  downloadingFileName.value = fileName;
  try {
    const fullPath = currentPath.value ? `${currentPath.value}/${fileName}` : fileName;
    const { data, error } = await supabase.storage.from("profile-documents").createSignedUrl(fullPath, 3600, {
      download: fileName,
    });
    if (error) throw error;
    if (data?.signedUrl) {
      const res = await fetch(data.signedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }
  } catch (err: any) {
    alert("Failed to download file: " + err.message);
  } finally {
    downloadingFileName.value = null;
  }
}

async function deleteFile(fileName: string) {
  if (!confirm(`Are you sure you want to permanently delete "${fileName}"?`)) return;

  try {
    const fullPath = currentPath.value ? `${currentPath.value}/${fileName}` : fileName;
    const { error } = await supabase.storage.from("profile-documents").remove([fullPath]);
    if (error) throw error;
    await fetchFiles();
  } catch (err: any) {
    alert("Failed to delete file: " + err.message);
  }
}

// =====================================================================
// UTILITIES & HELPERS
// =====================================================================
function refreshCurrentTab() {
  isRefreshing.value = true;
  if (activeTab.value === "approvals") {
    fetchRequests().finally(() => { isRefreshing.value = false; });
  } else if (activeTab.value === "vault") {
    fetchEmployeeDetails().finally(() => { isRefreshing.value = false; });
  } else {
    fetchFiles().finally(() => { isRefreshing.value = false; });
  }
}

function getInitials(name?: string | null): string {
  if (!name) return "ST";
  const parts = name.trim().split(" ");
  return parts.length > 1
    ? ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase()
    : (name[0] || "").toUpperCase();
}

function formatDocType(type?: string): string {
  switch (type) {
    case "aadhaar": return "Aadhaar Card";
    case "pan": return "PAN Card";
    case "passport": return "Passport";
    case "cheque": return "Cancelled Cheque";
    case "passbook": return "Bank Passbook";
    case "device_change": return "Device Change Request";
    case "profile_field": return "Profile Field Update";
    case "family_field": return "Family Details Update";
    case "nominees": return "Nominees Update";
    case "children": return "Children Details Update";
    default: return type ? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Document";
  }
}

function getDocIcon(type?: string): string {
  switch (type) {
    case "aadhaar": return "i-heroicons-identification";
    case "pan": return "i-heroicons-document-text";
    case "passport": return "i-heroicons-globe-americas";
    case "cheque":
    case "passbook": return "i-heroicons-building-library";
    case "device_change": return "i-heroicons-device-phone-mobile";
    case "profile_field":
    case "family_field":
    case "nominees":
    case "children": return "i-heroicons-user-circle";
    default: return "i-heroicons-document";
  }
}

function getStatusBadgeClass(status?: string): string {
  const norm = normalizeStatus(status);
  switch (norm) {
    case "pending": return "bg-amber-100 text-amber-800 border border-amber-200";
    case "under_review": return "bg-blue-100 text-blue-800 border border-blue-200";
    case "approved": return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    case "rejected": return "bg-rose-100 text-rose-800 border border-rose-200";
    default: return "bg-gray-100 text-gray-700";
  }
}

function getProfileDetailsUrlColumn(docType: string): string {
  switch (docType) {
    case "aadhaar": return "aadhaar_url";
    case "pan": return "pan_url";
    case "passport": return "passport_url";
    case "cheque": return "cancelled_cheque_url";
    case "passbook": return "passbook_url";
    default: return `${docType}_url`;
  }
}

function getFileExt(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

function getFileIcon(name: string): string {
  const ext = getFileExt(name);
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "i-heroicons-photo";
  if (["pdf"].includes(ext)) return "i-heroicons-document-text";
  if (["xls", "xlsx", "csv"].includes(ext)) return "i-heroicons-table-cells";
  return "i-heroicons-document";
}

function getFileTypeBadgeClass(name: string): string {
  const ext = getFileExt(name);
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "bg-purple-100 text-purple-700";
  if (["pdf"].includes(ext)) return "bg-rose-100 text-rose-700";
  return "bg-blue-100 text-blue-700";
}

function isPdf(url: string): boolean {
  return url.toLowerCase().includes(".pdf");
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Watchers
watch(activeTab, async (newTab) => {
  if (newTab === "approvals") {
    fetchRequests();
  } else if (newTab === "vault") {
    if (adminStore.employees.length === 0) {
      await adminStore.fetchEmployees();
    }
    if (!selectedEmployeeId.value && adminStore.employees.length > 0) {
      selectedEmployeeId.value = adminStore.employees[0]?.id ?? "";
    }
    await fetchEmployeeDetails();
  } else if (newTab === "explorer") {
    fetchFiles();
  }
});

watch(
  () => adminStore.employees,
  (emps) => {
    if (!selectedEmployeeId.value && emps && emps.length > 0) {
      selectedEmployeeId.value = emps[0]?.id ?? "";
      if (activeTab.value === "vault") {
        fetchEmployeeDetails();
      }
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await Promise.all([
    fetchRequests(),
    adminStore.fetchEmployees(),
  ]);
  if (!selectedEmployeeId.value && adminStore.employees.length > 0) {
    selectedEmployeeId.value = adminStore.employees[0]?.id ?? "";
  }
  if (selectedEmployeeId.value && activeTab.value === "vault") {
    await fetchEmployeeDetails();
  }
});
</script>
