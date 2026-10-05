<template>
  <div class="space-y-6">
    <!-- Top Action & Navigation Header -->
    <div class="flex items-center justify-between pb-4 border-b border-gray-200/70">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/admin/employees"
          class="p-2 rounded-xl bg-white/80 hover:bg-gray-100 border border-gray-200 text-gray-700 shadow-sm transition-colors"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <div>
          <h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>Employee Onboarding Wizard</span>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Automated Setup
            </span>
          </h1>
          <p class="text-xs text-gray-500">
            Generates user credentials, initializes profile, configures GPS work schedule, and sets up annual leave balances in one flow.
          </p>
        </div>
      </div>

      <div class="hidden sm:flex items-center gap-2 text-xs font-mono font-bold text-gray-500">
        <span>Step {{ currentStep }} of 4</span>
      </div>
    </div>

    <!-- Stepper Navigation Header -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button
        v-for="step in steps"
        :key="step.number"
        type="button"
        class="flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all"
        :class="[
          currentStep === step.number
            ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-500/10'
            : currentStep > step.number
            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
            : 'bg-white/60 border-gray-200/70 text-gray-400 opacity-70'
        ]"
        @click="goToStep(step.number)"
      >
        <div
          class="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
          :class="[
            currentStep === step.number
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
              : currentStep > step.number
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-gray-100 text-gray-400'
          ]"
        >
          <UIcon v-if="currentStep > step.number" name="i-heroicons-check" class="w-4 h-4" />
          <span v-else>{{ step.number }}</span>
        </div>
        <div class="min-w-0">
          <div class="text-[11px] font-bold truncate" :class="currentStep === step.number ? 'text-gray-900' : 'text-gray-600'">
            {{ step.title }}
          </div>
          <div class="text-[10px] text-gray-500 truncate">{{ step.desc }}</div>
        </div>
      </button>
    </div>

    <!-- Wizard Form Cards Container -->
    <form @submit.prevent="handleSubmit">
      <!-- STEP 1: Account Credentials & Identity -->
      <div v-show="currentStep === 1" class="space-y-6">
        <div class="p-6 sm:p-8 rounded-3xl bg-white/85 backdrop-blur-lg border border-gray-200/70 shadow-xl space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div class="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <UIcon name="i-heroicons-user" class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-gray-900">Login Account & Personal Identity</h2>
              <p class="text-xs text-gray-500">User will use this email and password to log in to the portal and mobile app.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Full Name -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Full Name *</label>
              <input
                v-model="form.fullName"
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                :class="[
                  'w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border text-gray-900 placeholder-gray-400 text-xs focus:bg-white focus:outline-none transition-colors',
                  errors.fullName ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400' : 'border-gray-200 focus:border-emerald-500'
                ]"
                @input="validateField('fullName')"
                @blur="validateField('fullName')"
              />
              <p v-if="errors.fullName" class="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <UIcon name="i-heroicons-exclamation-circle" class="w-3.5 h-3.5 shrink-0" />
                <span>{{ errors.fullName }}</span>
              </p>
            </div>

            <!-- Email Address -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Email Address *</label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="e.g. rahul.sharma@company.com"
                :class="[
                  'w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border text-gray-900 placeholder-gray-400 text-xs focus:bg-white focus:outline-none transition-colors',
                  errors.email ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400' : 'border-gray-200 focus:border-emerald-500'
                ]"
                @input="validateField('email')"
                @blur="validateField('email')"
              />
              <p v-if="errors.email" class="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <UIcon name="i-heroicons-exclamation-circle" class="w-3.5 h-3.5 shrink-0" />
                <span>{{ errors.email }}</span>
              </p>
            </div>

            <!-- Password -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Initial Password *</label>
              <div class="relative">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  minlength="6"
                  placeholder="Min 6 characters"
                  :class="[
                    'w-full px-3.5 py-2.5 pr-10 rounded-xl bg-gray-50 border text-gray-900 placeholder-gray-400 text-xs focus:bg-white focus:outline-none transition-colors',
                    errors.password ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400' : 'border-gray-200 focus:border-emerald-500'
                  ]"
                  @input="validateField('password')"
                  @blur="validateField('password')"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  @click="showPassword = !showPassword"
                >
                  <UIcon :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="w-4 h-4" />
                </button>
              </div>
              <p v-if="errors.password" class="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <UIcon name="i-heroicons-exclamation-circle" class="w-3.5 h-3.5 shrink-0" />
                <span>{{ errors.password }}</span>
              </p>
            </div>

            <!-- Employee Code -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Employee Code (Login ID) *</label>
              <input
                v-model="form.employeeCode"
                type="text"
                required
                placeholder="e.g. EMP202401"
                :class="[
                  'w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border text-gray-900 placeholder-gray-400 text-xs focus:bg-white focus:outline-none font-mono uppercase transition-colors',
                  errors.employeeCode ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400' : 'border-gray-200 focus:border-emerald-500'
                ]"
                @input="validateField('employeeCode')"
                @blur="validateField('employeeCode')"
              />
              <p v-if="errors.employeeCode" class="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <UIcon name="i-heroicons-exclamation-circle" class="w-3.5 h-3.5 shrink-0" />
                <span>{{ errors.employeeCode }}</span>
              </p>
            </div>

            <!-- Phone -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Contact Phone *</label>
              <input
                v-model="form.phone"
                type="tel"
                required
                placeholder="e.g. +91 9876543210"
                :class="[
                  'w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border text-gray-900 placeholder-gray-400 text-xs focus:bg-white focus:outline-none transition-colors',
                  errors.phone ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400' : 'border-gray-200 focus:border-emerald-500'
                ]"
                @input="validateField('phone')"
                @blur="validateField('phone')"
              />
              <p v-if="errors.phone" class="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <UIcon name="i-heroicons-exclamation-circle" class="w-3.5 h-3.5 shrink-0" />
                <span>{{ errors.phone }}</span>
              </p>
            </div>

            <!-- Employment Type -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Employment Type *</label>
              <select
                v-model="form.employmentType"
                :class="[
                  'w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border text-gray-900 text-xs focus:bg-white focus:outline-none transition-colors cursor-pointer',
                  errors.employmentType ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400' : 'border-gray-200 focus:border-emerald-500'
                ]"
                @change="validateField('employmentType')"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
              <p v-if="errors.employmentType" class="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <UIcon name="i-heroicons-exclamation-circle" class="w-3.5 h-3.5 shrink-0" />
                <span>{{ errors.employmentType }}</span>
              </p>
            </div>

            <!-- Date of Joining -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Date of Joining *</label>
              <input
                v-model="form.dateOfJoining"
                type="date"
                required
                :class="[
                  'w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border text-gray-900 text-xs focus:bg-white focus:outline-none cursor-pointer [color-scheme:light] transition-colors',
                  errors.dateOfJoining ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400' : 'border-gray-200 focus:border-emerald-500'
                ]"
                @click="(e) => (e.target as HTMLInputElement).showPicker?.()"
                @input="validateField('dateOfJoining')"
                @blur="validateField('dateOfJoining')"
              />
              <p v-if="errors.dateOfJoining" class="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <UIcon name="i-heroicons-exclamation-circle" class="w-3.5 h-3.5 shrink-0" />
                <span>{{ errors.dateOfJoining }}</span>
              </p>
            </div>

            <!-- Date of Birth -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Date of Birth</label>
              <input
                v-model="form.dateOfBirth"
                type="date"
                :class="[
                  'w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border text-gray-900 text-xs focus:bg-white focus:outline-none cursor-pointer [color-scheme:light] transition-colors',
                  errors.dateOfBirth ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400' : 'border-gray-200 focus:border-emerald-500'
                ]"
                @click="(e) => (e.target as HTMLInputElement).showPicker?.()"
                @input="validateField('dateOfBirth')"
                @blur="validateField('dateOfBirth')"
              />
              <p v-if="errors.dateOfBirth" class="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <UIcon name="i-heroicons-exclamation-circle" class="w-3.5 h-3.5 shrink-0" />
                <span>{{ errors.dateOfBirth }}</span>
              </p>
            </div>

            <!-- Gender -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Gender</label>
              <select
                v-model="form.gender"
                class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Marital Status -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Marital Status</label>
              <select
                v-model="form.maritalStatus"
                class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 2: Department, Position & Access Controls -->
      <div v-show="currentStep === 2" class="space-y-6">
        <div class="p-6 sm:p-8 rounded-3xl bg-white/85 backdrop-blur-lg border border-gray-200/70 shadow-xl space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div class="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <UIcon name="i-heroicons-briefcase" class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-gray-900">Department, Position & Permissions</h2>
              <p class="text-xs text-gray-500">Map the employee to the organization hierarchy and establish authorization flags.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Department Selection -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Department *</label>
              <select
                v-model="form.departmentId"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
              >
                <option :value="null" disabled>Select department</option>
                <option v-for="dept in adminStore.departments" :key="dept.id" :value="dept.id">
                  {{ dept.name }} ({{ dept.code }})
                </option>
              </select>
            </div>

            <!-- Position Selection -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Position / Designation *</label>
              <select
                v-model="form.positionId"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
              >
                <option :value="null" disabled>Select designation</option>
                <option v-for="pos in filteredPositions" :key="pos.id" :value="pos.id">
                  {{ pos.designation }} {{ pos.code ? `(${pos.code})` : '' }}
                </option>
              </select>
            </div>

            <!-- Approval Levels -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Approval Hierarchy Levels</label>
              <select
                v-model="form.approvalLevels"
                class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
              >
                <option :value="1">1 Level (Direct Manager)</option>
                <option :value="2">2 Levels (Manager + Head of Dept)</option>
                <option :value="3">3 Levels (Manager + HOD + Executive)</option>
              </select>
            </div>

            <!-- Address Details -->
            <div class="space-y-1.5 md:col-span-2">
              <label class="text-xs font-semibold text-gray-700">Current Residence Address</label>
              <input
                v-model="form.currentAddress"
                type="text"
                placeholder="e.g. Flat 402, Sunshine Apartments, Mayur Vihar Phase 1, Delhi"
                class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <!-- Permissions & Toggles -->
          <div class="pt-4 border-t border-gray-200">
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">System Access Controls</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- App Access -->
              <div class="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-emerald-300 transition-colors">
                <UCheckbox
                  v-model="form.appAccess"
                  color="primary"
                  size="sm"
                  :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer', description: 'text-[11px] text-gray-500' }"
                >
                  <template #label>
                    <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Mobile App Access</span>
                  </template>
                  <template #description>
                    <span class="text-[11px] text-gray-500">Allow login to Convise App</span>
                  </template>
                </UCheckbox>
              </div>

              <!-- Web Access -->
              <div class="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-emerald-300 transition-colors">
                <UCheckbox
                  v-model="form.webAccess"
                  color="primary"
                  size="sm"
                  :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer', description: 'text-[11px] text-gray-500' }"
                >
                  <template #label>
                    <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Web Portal Access</span>
                  </template>
                  <template #description>
                    <span class="text-[11px] text-gray-500">Allow login to web dashboard</span>
                  </template>
                </UCheckbox>
              </div>

              <!-- Geofencing -->
              <div class="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-emerald-300 transition-colors">
                <UCheckbox
                  v-model="form.geofencing"
                  color="primary"
                  size="sm"
                  :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer', description: 'text-[11px] text-gray-500' }"
                >
                  <template #label>
                    <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">GPS Geofencing</span>
                  </template>
                  <template #description>
                    <span class="text-[11px] text-gray-500">Enforce punch within radius</span>
                  </template>
                </UCheckbox>
              </div>

              <!-- Face Recognition -->
              <div class="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-emerald-300 transition-colors space-y-3">
                <UCheckbox
                  v-model="form.faceRecognition"
                  color="primary"
                  size="sm"
                  :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer', description: 'text-[11px] text-gray-500' }"
                >
                  <template #label>
                    <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Face Recognition</span>
                  </template>
                  <template #description>
                    <span class="text-[11px] text-gray-500">Require face verification on mobile punch</span>
                  </template>
                </UCheckbox>

                <!-- Match Threshold Slider -->
                <div v-if="form.faceRecognition" class="pt-2 border-t border-gray-200/70 space-y-1.5">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-gray-600 font-medium">Match Sensitivity:</span>
                    <span class="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {{ Math.round((form.faceMatchThreshold || 0.75) * 100) }}% ({{ form.faceMatchThreshold || 0.75 }})
                    </span>
                  </div>
                  <input
                    v-model.number="form.faceMatchThreshold"
                    type="range"
                    min="0.60"
                    max="0.95"
                    step="0.01"
                    class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div class="flex justify-between text-[10px] text-gray-400">
                    <span>Lenient (0.60)</span>
                    <span class="text-emerald-700 font-medium">Recommended (0.75)</span>
                    <span>Strict (0.95)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 3: Work Schedule, GPS Locations & WFM -->
      <div v-show="currentStep === 3" class="space-y-6">
        <div class="p-6 sm:p-8 rounded-3xl bg-white/85 backdrop-blur-lg border border-gray-200/70 shadow-xl space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div class="w-9 h-9 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
              <UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-gray-900">Work Schedule, Shift Timings & Geofence Coordinates</h2>
              <p class="text-xs text-gray-500">Defines where and when the employee is eligible to punch in and out.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <!-- Schedule Type -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Schedule Type *</label>
              <select
                v-model="form.schedule.scheduleType"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="fixed">Fixed</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <!-- Start Time -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Shift Start Time *</label>
              <input
                v-model="form.schedule.startTime"
                type="time"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 font-mono cursor-pointer [color-scheme:light]"
                @click="(e) => (e.target as HTMLInputElement).showPicker?.()"
              />
            </div>

            <!-- End Time -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Shift End Time *</label>
              <input
                v-model="form.schedule.endTime"
                type="time"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 font-mono cursor-pointer [color-scheme:light]"
                @click="(e) => (e.target as HTMLInputElement).showPicker?.()"
              />
            </div>

            <!-- Grace Period -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Punch-in Grace (Minutes)</label>
              <input
                v-model.number="form.schedule.punchInGrace"
                type="number"
                min="0"
                max="60"
                class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <!-- Shift Pattern -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Shift Pattern</label>
              <select
                v-model="form.schedule.shiftPattern"
                class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
              >
                <option value="day">Day Shift</option>
                <option value="night">Night Shift</option>
                <option value="rotational">Rotational</option>
              </select>
            </div>

            <!-- Min Work Hours -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-700">Min Work Hours (for Full Day)</label>
              <input
                v-model.number="form.schedule.minWorkHours"
                type="number"
                step="0.5"
                class="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <!-- Weekdays Selection -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-gray-700">Active Working Days</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
                :key="day"
                type="button"
                :class="[
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                  form.schedule.weekdays.includes(day)
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
                @click="toggleWeekday(day)"
              >
                {{ day }}
              </button>
            </div>
          </div>

          <!-- Geofence Coordinates: Office & Home -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-200">
            <!-- Office Location -->
            <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <UIcon name="i-heroicons-building-office" class="w-4 h-4 text-emerald-600" />
                  Office Location Geofence
                </span>
                <button
                  type="button"
                  class="text-[10px] text-emerald-700 hover:underline font-mono font-bold"
                  @click="useHeadOfficeLocation"
                >
                  Set Head Office
                </button>
              </div>

              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">GPS Coordinates (Latitude, Longitude)</label>
                <input
                  v-model="form.schedule.officeLocation"
                  type="text"
                  :placeholder="systemConfigStore.officeLocation || '28.560247, 77.199301'"
                  class="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 text-xs font-mono"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">Allowed Punch Radius (Meters)</label>
                <input
                  v-model.number="form.schedule.officeRadius"
                  type="number"
                  placeholder="100"
                  class="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 text-xs font-mono"
                />
              </div>
            </div>

            <!-- Home Location & WFM -->
            <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <UIcon name="i-heroicons-home" class="w-4 h-4 text-blue-600" />
                  Home Location / WFM
                </span>
                <button
                  type="button"
                  class="text-[10px] text-blue-700 hover:underline font-mono font-bold"
                  @click="getCurrentLocationForHome"
                >
                  Use My Current GPS
                </button>
              </div>

              <div class="space-y-1">
                <label class="text-[11px] text-gray-600">Home GPS Coordinates</label>
                <input
                  v-model="form.schedule.homeLocation"
                  type="text"
                  placeholder="e.g. 28.560247, 77.199301"
                  class="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 text-xs font-mono"
                />
              </div>

              <!-- WFM Allowed Toggle -->
              <div class="pt-2">
                <UCheckbox
                  v-model="form.schedule.wfmAllowed"
                  color="primary"
                  size="sm"
                  :ui="{ label: 'text-xs font-semibold text-gray-900 cursor-pointer', description: 'text-[11px] text-gray-500' }"
                >
                  <template #label>
                    <span class="text-xs font-semibold text-gray-900 select-none cursor-pointer">Allow Work From Home / Market (WFM)</span>
                  </template>
                  <template #description>
                    <span class="text-[11px] text-gray-500">Permits remote punches outside office geofence</span>
                  </template>
                </UCheckbox>
              </div>
            </div>

            <!-- Field / Market Work Locations -->
            <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-purple-600" />
                  Field / Market Work Locations (Named Areas)
                </span>
                <span class="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  Reverse Geocoded
                </span>
              </div>
              <p class="text-[11px] text-gray-500">
                Permits staff to punch attendance in designated cities or localities when WFM is enabled.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="sm:col-span-2 space-y-1">
                  <label class="text-[11px] text-gray-600 font-medium">Allowed Cities / Localities</label>
                  <LocationTagsInput
                    v-model="form.schedule.workLocationNames"
                    placeholder="Type city or locality and press Enter or comma..."
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[11px] text-gray-600 font-medium">Detection Radius (meters)</label>
                  <input
                    v-model.number="form.schedule.workLocationRadius"
                    type="number"
                    min="10"
                    max="50000"
                    placeholder="100"
                    class="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 4: Initial Leave Balances Allocation -->
      <div v-show="currentStep === 4" class="space-y-6">
        <div class="p-6 sm:p-8 rounded-3xl bg-white/85 backdrop-blur-lg border border-gray-200/70 shadow-xl space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div class="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <UIcon name="i-heroicons-calendar-days" class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-gray-900">Initial Leave Balances (Year {{ currentYear }})</h2>
              <p class="text-xs text-gray-500">Auto-provisions leave quota for all active leave types upon employee creation.</p>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-gray-500 font-semibold border-b border-gray-200 bg-gray-50">
                <tr>
                  <th class="py-2.5 px-3">Leave Type</th>
                  <th class="py-2.5 px-3">Code</th>
                  <th class="py-2.5 px-3">Carry Forward?</th>
                  <th class="py-2.5 px-3 text-right">Allocated Days</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="item in leaveAllocations" :key="item.leaveTypeId" class="hover:bg-emerald-50/30">
                  <td class="py-3 px-3 font-medium text-gray-900">{{ item.name }}</td>
                  <td class="py-3 px-3 font-mono text-gray-500">{{ item.code }}</td>
                  <td class="py-3 px-3">
                    <span :class="item.isCarryForward ? 'text-emerald-700 font-semibold' : 'text-gray-400'">
                      {{ item.isCarryForward ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <input
                      v-model.number="item.allocatedDays"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      class="w-20 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-right text-gray-900 font-mono text-xs focus:bg-white focus:border-emerald-500"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Action Navigation Buttons (Bottom Fixed or Container) -->
      <div class="mt-6 flex items-center justify-between p-4 rounded-2xl bg-white/90 backdrop-blur-lg border border-gray-200/70 shadow-lg">
        <button
          v-if="currentStep > 1"
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
          @click="currentStep--"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          <span>Previous Step</span>
        </button>
        <div v-else />

        <div class="flex items-center gap-3">
          <NuxtLink
            to="/admin/employees"
            class="px-4 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            Cancel
          </NuxtLink>

          <button
            v-if="currentStep < 4"
            type="button"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/25 transition-all active:scale-95"
            @click="validateAndNext"
          >
            <span>Next Step</span>
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
          </button>

          <button
            v-else
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-xl shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <UIcon v-if="isSubmitting" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <UIcon v-else name="i-heroicons-check-circle" class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Onboarding Employee...' : 'Complete & Onboard Employee' }}</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAdminStore } from "~/stores/admin";
import { useSystemConfigStore } from "~/stores/systemConfig";

const router = useRouter();
const adminStore = useAdminStore();
const systemConfigStore = useSystemConfigStore();
const supabase = useSupabaseClient();
const toast = useToast();

const currentStep = ref(1);
const showPassword = ref(false);
const isSubmitting = ref(false);
const currentYear = new Date().getFullYear();

const steps = [
  { number: 1, title: "Account & Identity", desc: "Credentials & bio" },
  { number: 2, title: "Role & Access", desc: "Dept, position & flags" },
  { number: 3, title: "Work Schedule", desc: "Timings & Geofencing" },
  { number: 4, title: "Leave Quotas", desc: "Initial balances" },
];

const form = reactive({
  fullName: "",
  email: "",
  password: "",
  phone: "",
  employeeCode: "",
  employmentType: "Full Time",
  dateOfJoining: new Date().toISOString().split("T")[0],
  dateOfBirth: "1998-01-01",
  gender: "Male",
  maritalStatus: "Single",
  currentAddress: "",
  departmentId: null as number | null,
  positionId: null as number | null,
  approvalLevels: 1,
  appAccess: true,
  webAccess: false,
  geofencing: true,
  faceRecognition: false,
  faceMatchThreshold: 0.75,
  schedule: {
    startTime: "09:30",
    endTime: "18:30",
    punchInGrace: 12,
    shiftPattern: "day",
    scheduleType: "fixed",
    minWorkHours: 8,
    maxWorkHours: 12,
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    officeLocation: systemConfigStore.officeLocation || "28.560247, 77.199301",
    officeRadius: 100,
    homeLocation: "",
    homeRadius: 100,
    workLocationNames: "delhi",
    workLocationRadius: 100,
    wfmAllowed: false,
  },
});

const errors = reactive({
  fullName: "",
  email: "",
  password: "",
  employeeCode: "",
  phone: "",
  employmentType: "",
  dateOfJoining: "",
  dateOfBirth: "",
});

function validateField(field: keyof typeof errors) {
  switch (field) {
    case "fullName": {
      const val = form.fullName.trim();
      if (!val) {
        errors.fullName = "Full name is required.";
      } else if (val.length < 2) {
        errors.fullName = "Full name must be at least 2 characters.";
      } else if (!/^[a-zA-Z\s.'-]+$/.test(val)) {
        errors.fullName = "Full name can only contain letters and standard characters.";
      } else {
        errors.fullName = "";
      }
      break;
    }
    case "email": {
      const val = form.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!val) {
        errors.email = "Email address is required.";
      } else if (!emailRegex.test(val)) {
        errors.email = "Please enter a valid email address.";
      } else if (adminStore.employees.some((e) => e.email?.toLowerCase() === val.toLowerCase())) {
        errors.email = "This email is already in use by an existing employee.";
      } else {
        errors.email = "";
      }
      break;
    }
    case "password": {
      if (!form.password) {
        errors.password = "Initial password is required.";
      } else if (form.password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
      } else {
        errors.password = "";
      }
      break;
    }
    case "employeeCode": {
      const val = form.employeeCode.trim().toUpperCase();
      form.employeeCode = val;
      if (!val) {
        errors.employeeCode = "Employee code is required.";
      } else if (val.length < 2 || val.length > 20) {
        errors.employeeCode = "Employee code must be 2 to 20 characters.";
      } else if (!/^[A-Z0-9_-]+$/.test(val)) {
        errors.employeeCode = "Only uppercase letters, numbers, hyphens, and underscores allowed.";
      } else if (adminStore.employees.some((e) => e.employee_code?.toUpperCase() === val)) {
        errors.employeeCode = "This employee code is already assigned to another employee.";
      } else {
        errors.employeeCode = "";
      }
      break;
    }
    case "phone": {
      const val = form.phone.trim();
      const digits = val.replace(/\D/g, "");
      if (!val) {
        errors.phone = "Contact phone is required.";
      } else if (digits.length < 10 || digits.length > 15) {
        errors.phone = "Please enter a valid phone number (10 to 15 digits).";
      } else {
        errors.phone = "";
      }
      break;
    }
    case "employmentType": {
      if (!form.employmentType) {
        errors.employmentType = "Employment type is required.";
      } else {
        errors.employmentType = "";
      }
      break;
    }
    case "dateOfJoining": {
      if (!form.dateOfJoining) {
        errors.dateOfJoining = "Date of joining is required.";
      } else {
        errors.dateOfJoining = "";
      }
      break;
    }
    case "dateOfBirth": {
      if (form.dateOfBirth) {
        const birthDate = new Date(form.dateOfBirth);
        const today = new Date();
        if (birthDate > today) {
          errors.dateOfBirth = "Date of birth cannot be in the future.";
        } else {
          const ageYears = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          if (ageYears < 16) {
            errors.dateOfBirth = "Employee must be at least 16 years of age.";
          } else {
            errors.dateOfBirth = "";
          }
        }
      } else {
        errors.dateOfBirth = "";
      }
      break;
    }
  }
}

function validateStep1(): boolean {
  validateField("fullName");
  validateField("email");
  validateField("password");
  validateField("employeeCode");
  validateField("phone");
  validateField("employmentType");
  validateField("dateOfJoining");
  validateField("dateOfBirth");

  return (
    !errors.fullName &&
    !errors.email &&
    !errors.password &&
    !errors.employeeCode &&
    !errors.phone &&
    !errors.employmentType &&
    !errors.dateOfJoining &&
    !errors.dateOfBirth
  );
}

interface LeaveAllocationItem {
  leaveTypeId: number;
  name: string;
  code: string;
  isCarryForward: boolean;
  allocatedDays: number;
}

const leaveAllocations = ref<LeaveAllocationItem[]>([]);

onMounted(async () => {
  await Promise.all([
    adminStore.fetchMetadata(),
    adminStore.fetchEmployees(),
    systemConfigStore.fetchConfig(supabase),
  ]);

  if ((!form.schedule.officeLocation || form.schedule.officeLocation === "28.560247, 77.199301") && systemConfigStore.officeLocation) {
    form.schedule.officeLocation = systemConfigStore.officeLocation;
  }

  leaveAllocations.value = adminStore.leaveTypes.map((lt) => ({
    leaveTypeId: lt.id,
    name: lt.leave_name,
    code: lt.leave_code,
    isCarryForward: lt.is_carry_forward,
    allocatedDays: lt.leave_code === "CL" ? 12 : lt.leave_code === "SL" ? 12 : lt.leave_code === "EL" ? 15 : 0,
  }));
});

const filteredPositions = computed(() => {
  if (!form.departmentId) return adminStore.positions;
  const filtered = adminStore.positions.filter(
    (p) => p.main_department_id === form.departmentId || !p.main_department_id
  );
  return filtered.length > 0 ? filtered : adminStore.positions;
});

function toggleWeekday(day: string) {
  const idx = form.schedule.weekdays.indexOf(day);
  if (idx > -1) {
    form.schedule.weekdays.splice(idx, 1);
  } else {
    form.schedule.weekdays.push(day);
  }
}

function useHeadOfficeLocation() {
  form.schedule.officeLocation = systemConfigStore.officeLocation || "28.560247, 77.199301";
  form.schedule.officeRadius = 100;
  toast.add({ title: "Head Office Coordinates Set", color: "success" });
}

function getCurrentLocationForHome() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.schedule.homeLocation = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        toast.add({ title: "Home Location GPS captured", color: "success" });
      },
      () => {
        toast.add({ title: "Could not fetch current GPS location", color: "error" });
      }
    );
  }
}

function validateAndNext() {
  if (currentStep.value === 1) {
    if (!validateStep1()) {
      toast.add({
        title: "Please check the required fields in Step 1",
        description: "Some fields are missing or contain invalid formats.",
        color: "error",
      });
      return;
    }
  }
  if (currentStep.value === 2) {
    if (!form.departmentId || !form.positionId) {
      toast.add({ title: "Please select department and position", color: "error" });
      return;
    }
  }
  if (currentStep.value === 3) {
    if (!form.schedule.startTime || !form.schedule.endTime) {
      toast.add({ title: "Please set shift start and end times", color: "error" });
      return;
    }
    if (!form.schedule.weekdays || form.schedule.weekdays.length === 0) {
      toast.add({ title: "Please select at least one active working day", color: "error" });
      return;
    }
  }
  currentStep.value++;
}

function goToStep(step: number) {
  if (step < currentStep.value) {
    currentStep.value = step;
  } else {
    validateAndNext();
  }
}

async function handleSubmit() {
  if (!validateStep1()) {
    currentStep.value = 1;
    toast.add({
      title: "Validation Error",
      description: "Please check the required account details in Step 1.",
      color: "error",
    });
    return;
  }

  isSubmitting.value = true;

  try {
    const payload = {
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      avatarUrl: null,
      profile: {
        employee_code: form.employeeCode,
        phone: form.phone,
        department: form.departmentId,
        position: form.positionId,
        date_of_joining: form.dateOfJoining,
        date_of_birth: form.dateOfBirth,
        gender: form.gender,
        marital_status: form.maritalStatus,
        employment_type: form.employmentType,
        current_address: form.currentAddress,
        app_access: form.appAccess,
        web_access: form.webAccess,
        geofencing: form.geofencing,
        face_recognition: form.faceRecognition,
        face_match_threshold: form.faceMatchThreshold || 0.75,
        approval_levels: form.approvalLevels,
        is_active: true,
      },
      schedule: {
        start_time: form.schedule.startTime.includes(":") && form.schedule.startTime.split(":").length === 2 ? `${form.schedule.startTime}:00` : form.schedule.startTime,
        end_time: form.schedule.endTime.includes(":") && form.schedule.endTime.split(":").length === 2 ? `${form.schedule.endTime}:00` : form.schedule.endTime,
        weekdays: form.schedule.weekdays.map((d: string) => {
          const map: Record<string, string> = {
            Mon: "monday",
            Tue: "tuesday",
            Wed: "wednesday",
            Thu: "thursday",
            Fri: "friday",
            Sat: "saturday",
            Sun: "sunday",
          };
          return map[d] || d.toLowerCase();
        }),
        punch_in_grace: form.schedule.punchInGrace,
        shift_pattern: form.schedule.shiftPattern,
        schedule_type: form.schedule.scheduleType,
        min_work_hours: form.schedule.minWorkHours,
        max_work_hours: form.schedule.maxWorkHours,
        office_location: form.schedule.officeLocation || systemConfigStore.officeLocation || "28.560247, 77.199301",
        office_radius: form.schedule.officeRadius || 100,
        home_location: form.schedule.homeLocation || null,
        home_radius: form.schedule.homeRadius || 100,
        work_location_names: form.schedule.workLocationNames ? form.schedule.workLocationNames.trim().toLowerCase() : null,
        work_location_radius: form.schedule.workLocationRadius || 100,
        wfm_allowed: form.schedule.wfmAllowed,
      },
      leaveAllocations: leaveAllocations.value.map((item) => ({
        leaveTypeId: item.leaveTypeId,
        allocatedDays: item.allocatedDays,
      })),
    };

    const { data, error } = await supabase.functions.invoke("onboard-employee", {
      body: payload,
    });

    if (error || !data?.success) {
      throw new Error(error?.message || data?.message || "Failed to complete employee setup");
    }

    toast.add({
      title: "Employee Onboarded Successfully!",
      description: `${form.fullName} has been fully provisioned with account, schedule & leave quota.`,
      color: "success",
    });

    await adminStore.fetchEmployees(true);
    router.push("/admin/employees");
  } catch (err: any) {
    console.error("Onboarding failed:", err);
    toast.add({
      title: "Onboarding Failed",
      description: err.message || "Failed to complete employee setup",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>
