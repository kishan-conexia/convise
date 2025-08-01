// middleware/attendance-guard.ts
export default defineNuxtRouteMiddleware(() => {
  // Only check on client side
  if (import.meta.client) {
    const attendanceSummaryStore = useAttendanceSummaryStore()
    
    // Initialize store first
    attendanceSummaryStore.initializeStore()
    
    // Check if we have employee data
    if (!attendanceSummaryStore.hasEmployeeData) {
      console.log('🔄 No employee data found in middleware, redirecting to department')
      
      // Show notification
      const toast = useToast()
      toast.add({
        title: 'Redirecting',
        description: 'Please select an employee from the department page to view attendance.',
        color: 'blue',
        timeout: 2000
      })
      
      // Redirect to department page
      return navigateTo('/department', { replace: true })
    }
  }
})
