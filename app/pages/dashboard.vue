<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Modern Background matching login.vue -->
    <div class="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100" />
    <div class="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] bg-[size:75px_75px]" />

    <!-- Floating Background Elements -->
    <div class="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-emerald-400/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
    <div class="absolute top-40 right-20 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
    <div class="absolute bottom-20 left-1/3 w-56 h-56 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />

    <!-- Loading State -->
    <div v-if="isLoading" class="relative min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="relative mb-6">
          <div class="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur-sm opacity-75" />
          <div class="relative bg-gradient-to-r from-emerald-500 to-blue-600 p-6 rounded-2xl">
            <UIcon name="i-heroicons-arrow-path" class="h-12 w-12 text-white animate-spin" />
          </div>
        </div>
        <h2 class="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
          Loading Dashboard
        </h2>
        <p class="text-gray-600">Preparing your workspace...</p>
      </div>
    </div>

    <!-- Main Dashboard -->
    <div v-else class="relative min-h-screen">
      <!-- Mobile Drawer Overlay -->
<div 
  v-if="showMobileDrawer" 
  class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
  @click="showMobileDrawer = false"
/>

<!-- Mobile Drawer - Simplified Header -->
<div 
  :class="[
    'fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out lg:hidden',
    showMobileDrawer ? 'translate-x-0' : '-translate-x-full'
  ]"
>
  <!-- Background matching index.vue -->
  <div class="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100"/>
  <div class="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] bg-[size:75px_75px]"/>
  
  <!-- Floating Elements (smaller for drawer) -->
  <div class="absolute top-16 left-4 w-32 h-32 bg-gradient-to-r from-emerald-400/30 to-blue-500/30 rounded-full mix-blend-multiply filter blur-xl animate-blob"/>
  <div class="absolute top-32 right-4 w-28 h-28 bg-gradient-to-r from-purple-400/30 to-pink-500/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"/>
  
  <div class="relative h-full bg-white/80 backdrop-blur-lg border-r border-gray-200/50 shadow-2xl flex flex-col overflow-y-auto">
    
    <!-- Simplified Header - Just Close Button -->
    <div class="p-4 flex justify-end">
      <button 
        class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors"
        @click="showMobileDrawer = false"
      >
        <UIcon name="i-heroicons-x-mark" class="h-6 w-6" />
      </button>
    </div>

    <!-- User Info Section -->
    <div class="px-6 pb-6 border-b border-gray-200/50">
      <div class="relative">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-20"/>
        <div class="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
          <div class="flex items-center space-x-4 mb-3">
            <div class="relative">
              <div class="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span class="text-lg font-bold text-white">{{ getUserInitial() }}</span>
              </div>
              <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"/>
            </div>
            <div class="flex-1">
              <h3 class="text-base font-bold text-gray-900">{{ appState.userName }}</h3>
              <p class="text-sm text-gray-600">{{ appState.empCode || user?.email }}</p>
            </div>
          </div>
          <div class="inline-flex items-center px-3 py-1 bg-gradient-to-r from-emerald-500/10 to-blue-600/10 rounded-full text-xs">
            <div class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"/>
            <span class="text-gray-700 font-medium">System Connected</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Items -->
    <div class="flex-1 py-6 px-4">
      <nav class="space-y-3">
        <!-- Profile -->
        <div class="group">
          <div class="relative">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"/>
            <button 
              class="relative w-full flex items-center space-x-3 px-4 py-3 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-xl transition-all duration-200 border border-gray-200/50 hover:border-gray-300/50"
              @click="handleDrawerNavigation('/profile')"
            >
              <UIcon name="i-heroicons-user" class="h-5 w-5 text-emerald-600" />
              <span class="font-medium text-gray-900">Profile</span>
            </button>
          </div>
        </div>

        <!-- Network Monitor (Conditional) -->
        <div v-if="appState.ovUsername && appState.ovPassword" class="group">
          <div class="relative">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"/>
            <button 
              class="relative w-full flex items-center space-x-3 px-4 py-3 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-xl transition-all duration-200 border border-gray-200/50 hover:border-gray-300/50"
              @click="handleDrawerNavigation('/network-monitor')"
            >
              <UIcon name="i-heroicons-signal" class="h-5 w-5 text-orange-600" />
              <span class="font-medium text-gray-900">Network Monitor</span>
            </button>
          </div>
        </div>

        <!-- Manager Tools Section -->
        <div v-if="showManagerTools" class="pt-4">
          <div class="px-4 py-2 mb-3">
            <p class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Management Tools</p>
          </div>
          
          <!-- Department -->
          <div class="group mb-3">
            <div class="relative">
              <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"/>
              <button 
                class="relative w-full flex items-center space-x-3 px-4 py-3 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-xl transition-all duration-200 border border-gray-200/50 hover:border-gray-300/50"
                @click="handleDrawerNavigation('/department')"
              >
                <UIcon name="i-heroicons-chart-bar" class="h-5 w-5 text-blue-600" />
                <span class="font-medium text-gray-900">Department</span>
              </button>
            </div>
          </div>

          <!-- Team Requests -->
          <div class="group mb-3">
            <div class="relative">
              <div class="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"/>
              <button 
                class="relative w-full flex items-center space-x-3 px-4 py-3 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-xl transition-all duration-200 border border-gray-200/50 hover:border-gray-300/50"
                @click="handleDrawerNavigation('/team-requests')"
              >
                <UIcon name="i-heroicons-users" class="h-5 w-5 text-violet-600" />
                <span class="font-medium text-gray-900">Team Requests</span>
              </button>
            </div>
          </div>

          <!-- Monthly Attendance (Conditional) -->
          <div v-if="canAccessMonthlyAttendance" class="group">
            <div class="relative">
              <div class="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"/>
              <button 
                class="relative w-full flex items-center space-x-3 px-4 py-3 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-xl transition-all duration-200 border border-gray-200/50 hover:border-gray-300/50"
                @click="handleDrawerNavigation('/monthly-attendance')"
              >
                <UIcon name="i-heroicons-calendar-days" class="h-5 w-5 text-pink-600" />
                <span class="font-medium text-gray-900">Monthly Reports</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>

    <!-- Sign Out Button -->
    <div class="p-6 border-t border-gray-200/50">
      <div class="group">
        <div class="relative">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"/>
          <button 
            class="relative w-full flex items-center space-x-3 px-4 py-3 bg-white/60 backdrop-blur-sm hover:bg-red-50 rounded-xl transition-all duration-200 border border-gray-200/50 hover:border-red-300/50"
            @click="handleSignOut"
          >
            <UIcon name="i-heroicons-arrow-right-on-rectangle" class="h-5 w-5 text-red-600" />
            <span class="font-medium text-red-700">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>


      <!-- Top Navigation Bar -->
      <header class="relative bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <!-- Mobile Menu Button + Logo Section -->
            <div class="flex items-center">
              <!-- Mobile Menu Button -->
              <button 
                class="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mr-4"
                @click="showMobileDrawer = true"
              >
                <UIcon name="i-heroicons-bars-3" class="h-6 w-6" />
              </button>

              <!-- Logo -->
              <div class="flex items-center">
                <div class="relative mr-4">
                  <div class="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl blur-sm opacity-75" />
                  <div class="relative bg-gradient-to-r from-emerald-500 to-blue-600 p-3 rounded-xl">
                    <UIcon name="i-heroicons-building-office" class="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Convise Dashboard
                  </h1>
                  <p class="text-sm text-gray-600 hidden sm:block">Employee Portal</p>
                </div>
              </div>
            </div>

            <!-- Desktop User Profile Section -->
            <div class="hidden lg:flex items-center space-x-4">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-700">{{ appState.userName }}</p>
                <p class="text-xs text-gray-500">{{ appState.empCode || user?.email }}</p>
              </div>
              
              <!-- ✅ FIXED: Changed UDropdown to UPopover -->
              <UPopover :popper="{ placement: 'bottom-end' }">
                <UButton color="white" variant="outline" class="rounded-full border-gray-200">
                  <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center">
                      <span class="text-white text-sm font-medium">{{ getUserInitial() }}</span>
                    </div>
                    <UIcon name="i-heroicons-chevron-down" class="h-4 w-4 text-gray-400" />
                  </div>
                </UButton>
                
                <template #panel>
                  <div class="p-2 space-y-1">
                    <UButton
                      variant="ghost"
                      color="gray"
                      class="w-full justify-start"
                      @click="navigateTo('/profile')"
                    >
                      <UIcon name="i-heroicons-user" class="mr-2" />
                      Profile
                    </UButton>
                    <UButton
                      variant="ghost"
                      color="red"
                      class="w-full justify-start"
                      @click="handleSignOut"
                    >
                      <UIcon name="i-heroicons-arrow-right-on-rectangle" class="mr-2" />
                      Sign Out
                    </UButton>
                  </div>
                </template>
              </UPopover>
            </div>

            <!-- Mobile User Avatar (shows on tablet/mobile) -->
            <div class="lg:hidden">
              <div class="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center">
                <span class="text-white text-sm font-medium">{{ getUserInitial() }}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <!-- Welcome Banner -->
        <section class="mb-12">
          <div class="relative">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-20" />
            <UCard class="relative bg-white/80 backdrop-blur-lg border-0 shadow-2xl rounded-2xl overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-500 via-blue-600 to-purple-700 p-8 text-white">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="flex items-center mb-3">
                      <UIcon name="i-heroicons-hand-raised" class="h-7 w-7 text-yellow-300 mr-3" />
                      <h2 class="text-2xl md:text-3xl font-bold">Welcome back, {{ appState.userName.split(' ')[0] }}! 👋</h2>
                    </div>
                    <p class="text-blue-100 text-base md:text-lg mb-4">Ready to manage your day efficiently</p>
                    <div class="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                      <div class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"/>
                      <span class="text-sm font-medium">System Status: All Connected</span>
                    </div>
                  </div>
                  <div class="hidden lg:block">
                    <div class="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <UIcon name="i-heroicons-chart-bar-square" class="h-16 w-16 text-white/80" />
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </section>

        <!-- Quick Actions Grid -->
        <section class="mb-12">
          <div class="mb-8">
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h3>
            <p class="text-gray-600">Access your most-used features instantly</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Attendance Card -->
            <!-- <div class="group cursor-pointer" @click="navigateTo('/attendance')">
              <div class="relative">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <UCard class="relative bg-white/80 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 p-6">
                  <div class="text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-6">
                      <UIcon name="i-heroicons-fingerprint" class="h-8 w-8 text-white" />
                    </div>
                    <h4 class="text-xl font-bold text-gray-900 mb-2">Attendance</h4>
                    <p class="text-gray-600">Mark your daily presence and view history</p>
                  </div>
                </UCard>
              </div>
            </div> -->

            <!-- Profile Card -->
            <div class="group cursor-pointer" @click="navigateTo('/profile')">
              <div class="relative">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <UCard class="relative bg-white/80 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 p-6">
                  <div class="text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mb-6">
                      <UIcon name="i-heroicons-user" class="h-8 w-8 text-white" />
                    </div>
                    <h4 class="text-xl font-bold text-gray-900 mb-2">My Profile</h4>
                    <p class="text-gray-600">View and update your information</p>
                  </div>
                </UCard>
              </div>
            </div>

            <!-- Network Monitor Card (Conditional) -->
            <div 
              v-if="appState.ovUsername && appState.ovPassword"
              class="group cursor-pointer" 
              @click="navigateTo('/network-monitor')"
            >
              <div class="relative">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <UCard class="relative bg-white/80 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 p-6">
                  <div class="text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl mb-6">
                      <UIcon name="i-heroicons-signal" class="h-8 w-8 text-white" />
                    </div>
                    <h4 class="text-xl font-bold text-gray-900 mb-2">Network Monitor</h4>
                    <p class="text-gray-600">Check device and network status</p>
                  </div>
                </UCard>
              </div>
            </div>
          </div>
        </section>

        <!-- Manager Tools (Conditional) -->
        <section v-if="showManagerTools" class="mb-12">
          <div class="mb-8">
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Management Tools</h3>
            <p class="text-gray-600">Administrative functions for team leaders</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Department Management -->
            <div class="group cursor-pointer" @click="navigateTo('/department')">
              <div class="relative">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <UCard class="relative bg-white/80 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 p-6">
                  <div class="text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl mb-6">
                      <UIcon name="i-heroicons-chart-bar" class="h-8 w-8 text-white" />
                    </div>
                    <h4 class="text-xl font-bold text-gray-900 mb-2">Department</h4>
                    <p class="text-gray-600">Manage department statistics</p>
                  </div>
                </UCard>
              </div>
            </div>

            <!-- Team Requests -->
            <div class="group cursor-pointer" @click="navigateTo('/team-requests')">
              <div class="relative">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <UCard class="relative bg-white/80 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 p-6">
                  <div class="text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl mb-6">
                      <UIcon name="i-heroicons-users" class="h-8 w-8 text-white" />
                    </div>
                    <h4 class="text-xl font-bold text-gray-900 mb-2">Team Requests</h4>
                    <p class="text-gray-600">Review and approve team submissions</p>
                  </div>
                </UCard>
              </div>
            </div>

            <!-- Monthly Attendance (Conditional) -->
            <div 
              v-if="canAccessMonthlyAttendance"
              class="group cursor-pointer" 
              @click="navigateTo('/monthly-attendance')"
            >
              <div class="relative">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <UCard class="relative bg-white/80 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 p-6">
                  <div class="text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl mb-6">
                      <UIcon name="i-heroicons-calendar-days" class="h-8 w-8 text-white" />
                    </div>
                    <h4 class="text-xl font-bold text-gray-900 mb-2">Monthly Reports</h4>
                    <p class="text-gray-600">View comprehensive attendance reports</p>
                  </div>
                </UCard>
              </div>
            </div>
          </div>
        </section>

        <!-- Key Features Showcase -->
        <section class="mb-12">
          <div class="mb-8">
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Platform Highlights</h3>
            <p class="text-gray-600">Why employees love using Convise</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <UCard 
              v-for="(feature, index) in keyFeatures" 
              :key="index"
              class="bg-white/60 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300 p-6"
            >
              <div class="text-center">
                <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" :class="feature.bgColor">
                  <UIcon :name="feature.icon" class="h-7 w-7 text-white" />
                </div>
                <h4 class="text-lg font-bold text-gray-900 mb-2">{{ feature.title }}</h4>
                <p class="text-gray-600 text-sm">{{ feature.description }}</p>
              </div>
            </UCard>
          </div>
        </section>

        <!-- Footer CTA -->
        <section class="text-center">
          <div class="relative">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-20" />
            <UCard class="relative bg-white/80 backdrop-blur-lg border-0 shadow-xl p-8">
              <h3 class="text-2xl font-bold text-gray-900 mb-4">Need Help?</h3>
              <p class="text-gray-600 mb-6">Our support team is here to assist you with any questions</p>
              <UButton 
                size="lg" 
                class="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <UIcon name="i-heroicons-chat-bubble-left-right" class="mr-2" />
                Contact Support
              </UButton>
            </UCard>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
// Auth guard
definePageMeta({
  middleware: 'auth'
})

// Composables
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const toast = useToast()

// Reactive state
const isLoading = ref(true)
const showMobileDrawer = ref(false)
const appState = reactive({
  userName: 'John Doe',
  empCode: 'EMP001',
  userEmail: user.value?.email || '',
  isManager: false,
  managedDepartmentIds: [],
  ovUsername: '',
  ovPassword: '',
  initialized: false
})

// Functions
const handleSignOut = async () => {
  try {
    await supabase.auth.signOut()
    toast.add({
      title: 'Logged out successfully',
      color: 'green'
    })
    await navigateTo('/')
  } catch (error) {
    console.error("Unexpected navigation error to going lanading page:", error);
    toast.add({
      title: 'Error logging out',
      color: 'red'
    })
  }
}

const getUserInitial = () => {
  const name = appState.userName || user.value?.email || ''
  return name.charAt(0).toUpperCase()
}

const handleDrawerNavigation = (path) => {
  showMobileDrawer.value = false
  navigateTo(path)
}

const initializeAppState = async () => {
  try {
    // await new Promise(resolve => setTimeout(resolve, 2000)) // keep UX delay if you want

    // Fetch user profile from Supabase
    if (!user.value) {
      throw new Error('No user found.')
    }
    // Fetch profile info (replace 'profiles' and fields as needed per your schema)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, employee_code, ov_username, ov_password')
      .eq('id', user.value.id)
      .maybeSingle()

    if (error) throw error

    appState.userName = profile?.full_name || user.value.user_metadata?.full_name || 'User'
    appState.userEmail = user.value.email || ''
    appState.empCode = profile?.employee_code || '' // update if needed

    // Fetch manager status: are there any departments managed by this user?
    const { data: managed, error: deptError } = await supabase
      .from('departments')
      .select('id')
      .eq('manager_id', user.value.id)
      .eq('is_active', true)
    if (deptError) throw deptError

    appState.isManager = Array.isArray(managed) && managed.length > 0
    appState.managedDepartmentIds = managed?.map(d => d.id) || []

    // Optionally fill network monitor fields if used
    appState.ovUsername = profile?.ov_username || ''
    appState.ovPassword = profile?.ov_password || ''

    appState.initialized = true
    isLoading.value = false
  } catch (error) {
    console.error('Failed to initialize app state:', error)
    toast.add({
      title: 'Initialization Error',
      description: 'Failed to load user data. Please refresh the page.',
      color: 'red'
    })
  }
}


// Computed properties
const showManagerTools = computed(() => appState.isManager)

const canAccessMonthlyAttendance = computed(() => {
  const allowedDepartments = new Set([1, 30, 301, 302, 303])
  return appState.managedDepartmentIds.some(id => allowedDepartments.has(id))
})

// Key features data
const keyFeatures = [
  {
    icon: 'i-heroicons-shield-check',
    title: 'Secure Access',
    description: 'Enterprise-grade security for all your data',
    bgColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600'
  },
  {
    icon: 'i-heroicons-clock',
    title: 'Real-time Sync',
    description: 'Instant updates across all your devices',
    bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600'
  },
  {
    icon: 'i-heroicons-chart-bar-square',
    title: 'Smart Analytics',
    description: 'Comprehensive insights and reporting',
    bgColor: 'bg-gradient-to-r from-purple-500 to-purple-600'
  },
  {
    icon: 'i-heroicons-device-phone-mobile',
    title: 'Mobile Ready',
    description: 'Perfect experience on any device',
    bgColor: 'bg-gradient-to-r from-orange-500 to-orange-600'
  },
  {
    icon: 'i-heroicons-user-group',
    title: 'Team Collaboration',
    description: 'Built for modern team workflows',
    bgColor: 'bg-gradient-to-r from-teal-500 to-teal-600'
  },
  {
    icon: 'i-heroicons-heart',
    title: '24/7 Support',
    description: 'Always here when you need us',
    bgColor: 'bg-gradient-to-r from-pink-500 to-pink-600'
  }
]

// Close drawer when clicking outside or pressing escape
onMounted(() => {
  initializeAppState()
  
  // Close drawer on escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape' && showMobileDrawer.value) {
      showMobileDrawer.value = false
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})

// Meta
useHead({
  title: 'Dashboard - Convise',
  meta: [
    { name: 'description', content: 'Your personalized HR dashboard with attendance tracking, team management, and more.' }
  ]
})
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

.animation-delay-4000 {
  animation-delay: 4s;
}

.bg-grid-slate-100 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(148 163 184 / 0.05)'%3e%3cpath d='m0 .5h32m-32 32v-32'/%3e%3c/svg%3e");
}
</style>
