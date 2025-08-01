<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Background matching dashboard -->
    <div class="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100" />
    <div class="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] bg-[size:75px_75px]" />
    
    <!-- Floating Elements -->
    <div class="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-emerald-400/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
    <div class="absolute top-40 right-20 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />

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
          Loading Profile
        </h2>
        <p class="text-gray-600">Fetching your information...</p>
      </div>
    </div>

    <!-- Main Profile Page -->
    <div v-else class="relative min-h-screen">
      <!-- Header with Better Back Button -->
      <div class="relative bg-white/90 backdrop-blur-lg border-b border-gray-200/50 shadow-lg">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <!-- Enhanced Back Button -->
              <UButton
                size="md"
                variant="outline"
                color="gray"
                class="bg-white/80 backdrop-blur-sm hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                @click="$router.push('/dashboard')"
              >
                <UIcon name="i-heroicons-arrow-left" class="h-5 w-5 mr-2 text-gray-600" />
                <span class="text-gray-700">Back to Dashboard</span>
              </UButton>
              <div class="hidden sm:block">
                <h1 class="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  My Profile
                </h1>
                <p class="text-gray-600">View your personal information</p>
              </div>
            </div>
            <!-- Mobile Title -->
            <div class="sm:hidden">
              <h1 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                My Profile
              </h1>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Profile Overview Card -->
        <div class="mb-8">
          <div class="relative">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-20" />
            <UCard class="relative bg-white/80 backdrop-blur-lg border-0 shadow-2xl rounded-2xl overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-500 via-blue-600 to-purple-700 p-8">
                <div class="flex items-center space-x-6">
                  <!-- User Avatar -->
                  <div class="relative">
                    <div class="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30">
                      <span class="text-4xl font-bold text-white">{{ getUserInitial() }}</span>
                    </div>
                    <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white" />
                  </div>
                  
                  <!-- User Info -->
                  <div class="text-white">
                    <h2 class="text-3xl font-bold mb-2">{{ profileData.full_name || 'User' }}</h2>
                    <div class="space-y-1">
                      <p class="text-blue-100 flex items-center">
                        <UIcon name="i-heroicons-identification" class="h-4 w-4 mr-2" />
                        {{ profileData.employee_code || 'Not set' }}
                      </p>
                      <!-- <p class="text-blue-100 flex items-center">
                        <UIcon name="i-heroicons-envelope" class="h-4 w-4 mr-2" />
                        {{ profileData.email }}
                      </p> -->
                      <p class="text-blue-100 flex items-center">
                        <UIcon name="i-heroicons-briefcase" class="h-4 w-4 mr-2" />
                        {{ profileData.employment_type || 'Employee' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Profile Information Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Profile Information (Read-only) -->
          <div class="lg:col-span-2">
            <UCard class="bg-white/80 backdrop-blur-lg border-0 shadow-xl">
              <template #header>
                <h3 class="text-lg font-semibold text-gray-900">Personal Information</h3>
              </template>

              <div class="space-y-6">
                <!-- Full Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p class="text-gray-900">{{ profileData.full_name || 'Not set' }}</p>
                  </div>
                </div>

                <!-- Employee Code -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Employee Code</label>
                  <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p class="text-gray-900">{{ profileData.employee_code || 'Not set' }}</p>
                  </div>
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p class="text-gray-900">{{ profileData.email }}</p>
                  </div>
                </div>

                <!-- Phone -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p class="text-gray-900">{{ profileData.phone || 'Not set' }}</p>
                  </div>
                </div>

                <!-- Department -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p class="text-gray-900">{{ departmentName || 'Not assigned' }}</p>
                  </div>
                </div>

                <!-- Employment Type -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p class="text-gray-900">{{ profileData.employment_type || 'Employee' }}</p>
                  </div>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Enhanced Sidebar with Better Visibility -->
          <div class="space-y-6">
            <!-- Account Status -->
            <UCard class="bg-white/90 backdrop-blur-lg border-0 shadow-xl">
              <template #header>
                <h3 class="text-lg font-semibold text-gray-900">Account Status</h3>
              </template>
              
              <div class="space-y-4">
                <!-- <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Account Status</span>
                  <UBadge 
                    :color="profileData.is_active ? 'green' : 'red'"
                    variant="subtle"
                    size="md"
                  >
                    {{ profileData.is_active ? 'Active' : 'Inactive' }}
                  </UBadge>
                </div> -->
                
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">App Access</span>
                  <UBadge 
                    :color="profileData.app_access ? 'green' : 'gray'"
                    variant="subtle"
                    size="md"
                  >
                  <span class="text-sm font-semibold text-gray-900">
                    {{ profileData.app_access ? 'Granted' : 'Pending' }}
                  </span>
                    
                  </UBadge>
                </div>

                <div v-if="profileData.date_of_joining" class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Joining Date</span>
                  <span class="text-sm font-semibold text-gray-900">
                    {{ formatDate(profileData.date_of_joining) }}
                  </span>
                </div>
              </div>
            </UCard>

            <!-- Enhanced Quick Actions with Better Visibility -->
            <UCard class="bg-white/90 backdrop-blur-lg border-0 shadow-xl">
              <template #header>
                <h3 class="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </template>
              
              <div class="space-y-3">
                <UButton
                  variant="outline"
                  color="gray"
                  size="md"
                  class="w-full justify-start bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                  @click="$router.push('/dashboard')"
                >
                  <UIcon name="i-heroicons-squares-2x2" class="h-5 w-5 mr-3 text-blue-600" />
                  <span class="text-gray-700">Dashboard</span>
                </UButton>
                
                <UButton
                  v-if="isManagerProfile"
                  variant="outline"
                  color="blue"
                  size="md"
                  class="w-full justify-start bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                  @click="$router.push('/department')"
                >
                  <UIcon name="i-heroicons-chart-bar" class="h-5 w-5 mr-3 text-blue-600" />
                  <span class="text-blue-700">Department</span>
                </UButton>
                
                <div class="border-t border-gray-200 pt-3 mt-4">
                  <UButton
                    variant="outline"
                    color="red"
                    size="md"
                    class="w-full justify-start bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                    @click="handleSignOut"
                  >
                    <UIcon name="i-heroicons-arrow-right-on-rectangle" class="h-5 w-5 mr-3 text-red-600" />
                    <span class="text-red-700">Sign Out</span>
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
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
const router = useRouter()

// Reactive state
const isLoading = ref(true)
const profileData = ref({})
const departmentName = ref('')
const isManagerProfile = ref(false)

// Functions
const getUserInitial = () => {
  const name = profileData.value.full_name || user.value?.email || ''
  return name.charAt(0).toUpperCase()
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchProfile = async () => {
  try {
    if (!user.value) return

    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .maybeSingle()

    if (error) throw error

    if (profile) {
      profileData.value = profile

      // Fetch department name if exists
      if (profile.department) {
        const { data: dept } = await supabase
          .from('departments')
          .select('name')
          .eq('id', profile.department)
          .maybeSingle()
        
        departmentName.value = dept?.name || 'Unknown Department'
      }

      // Check if user is a manager
      const { data: managedDepts } = await supabase
        .from('departments')
        .select('id')
        .eq('manager_id', user.value.id)
        .eq('is_active', true)
      
      isManagerProfile.value = managedDepts && managedDepts.length > 0
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
    toast.add({
      title: 'Error loading profile',
      description: 'Failed to load your profile information.',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

const handleSignOut = async () => {
  try {
    await supabase.auth.signOut()
    toast.add({
      title: 'Logged out successfully',
      color: 'green'
    })
    await router.push('/')
  } catch (error) {
    console.error("Unexpected logout error:", error);
    toast.add({
      title: 'Error logging out',
      color: 'red'
    })
  }
}

// Initialize on mount
onMounted(() => {
  fetchProfile()
})

// Meta
useHead({
  title: 'My Profile - Convise',
  meta: [
    { name: 'description', content: 'View your personal profile and account information.' }
  ]
})
</script>

<style scoped>
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

.animate-blob { animation: blob 7s infinite; }
.animation-delay-2000 { animation-delay: 2s; }

.bg-grid-slate-100 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(148 163 184 / 0.05)'%3e%3cpath d='m0 .5h32m-32 32v-32'/%3e%3c/svg%3e");
}
</style>
