<!-- app/pages/dashboard.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top Navigation -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center">
            <UIcon name="i-heroicons-building-office" class="h-8 w-8 text-primary-600 mr-3" />
            <h1 class="text-xl font-semibold text-gray-900">Convise Dashboard</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-700">
              Welcome, {{ user?.email }}
            </span>
            <UButton color="red" variant="ghost" @click="handleLogout">
              <UIcon name="i-heroicons-arrow-right-on-rectangle" />
              Logout
            </UButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Employee Dashboard</h2>
        <p class="text-gray-600">Manage your organization efficiently</p>
      </div>

      <!-- Dashboard Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <UCard>
          <div class="flex items-center">
            <UIcon name="i-heroicons-users" class="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p class="text-sm text-gray-600">Total Employees</p>
              <p class="text-2xl font-semibold">{{ stats.employees }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center">
            <UIcon name="i-heroicons-calendar-days" class="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p class="text-sm text-gray-600">Present Today</p>
              <p class="text-2xl font-semibold">{{ stats.present }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center">
            <UIcon name="i-heroicons-clock" class="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p class="text-sm text-gray-600">Pending Leaves</p>
              <p class="text-2xl font-semibold">{{ stats.pendingLeaves }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center">
            <UIcon name="i-heroicons-currency-dollar" class="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p class="text-sm text-gray-600">Payroll Ready</p>
              <p class="text-2xl font-semibold">{{ stats.payrollReady }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Quick Actions -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Quick Actions</h3>
        </template>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UButton block variant="outline" class="h-20 flex-col">
            <UIcon name="i-heroicons-user-plus" class="h-6 w-6 mb-2" />
            Add Employee
          </UButton>
          
          <UButton block variant="outline" class="h-20 flex-col">
            <UIcon name="i-heroicons-calendar" class="h-6 w-6 mb-2" />
            Mark Attendance
          </UButton>
          
          <UButton block variant="outline" class="h-20 flex-col">
            <UIcon name="i-heroicons-document-text" class="h-6 w-6 mb-2" />
            Leave Requests
          </UButton>
          
          <UButton block variant="outline" class="h-20 flex-col">
            <UIcon name="i-heroicons-chart-bar" class="h-6 w-6 mb-2" />
            View Reports
          </UButton>
        </div>
      </UCard>
    </main>
  </div>
</template>

<script setup>
// Auth guard - redirect to login if not authenticated
definePageMeta({
  middleware: 'auth'
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const toast = useToast()

// Mock stats data - replace with real data from your Supabase
const stats = reactive({
  employees: 24,
  present: 18,
  pendingLeaves: 3,
  payrollReady: 15
})

const handleLogout = async () => {
  try {
    await supabase.auth.signOut()
    toast.add({
      title: 'Logged out successfully',
      color: 'green'
    })
    await navigateTo('/')
  } catch (error) {
    toast.add({
      title: 'Error logging out',
      color: 'red'
    })
  }
}
</script>
