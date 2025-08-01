// stores/attendanceSummary.ts
export interface AttendanceSummaryData {
  employeeId: string
  employeeName: string
  employeeCode?: string
  employeeDateOfJoining?: string
  managerLevel: number
  managerId: string
  department?: number
  position?: string
  email?: string
  phone?: string
}

export const useAttendanceSummaryStore = defineStore('attendanceSummary', () => {
  // ✅ FIX: Use regular ref, NOT readonly
  const employeeData = ref<AttendanceSummaryData | null>(null)
  const isLoading = ref(false)
  
  const STORAGE_KEY = 'attendanceSummaryData'
  
  const initializeStore = () => {
    if (import.meta.client) {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          
          if (parsed._timestamp && Date.now() - parsed._timestamp < 24 * 60 * 60 * 1000) {
            const { _timestamp, ...cleanData } = parsed
            employeeData.value = cleanData // ✅ This now works
          } else {
            sessionStorage.removeItem(STORAGE_KEY)
          }
        }
      } catch (error) {
        console.error('Error parsing sessionStorage data:', error)
        sessionStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  const setEmployeeData = (data: AttendanceSummaryData) => {
    employeeData.value = data // ✅ This now works
    
    if (import.meta.client) {
      const dataWithTimestamp = { ...data, _timestamp: Date.now() }
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithTimestamp))
      } catch (error) {
        console.error('Error storing data:', error)
      }
    }
  }

  const clearEmployeeData = () => {
    employeeData.value = null
    if (import.meta.client) {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }

  const updateEmployeeData = (updates: Partial<AttendanceSummaryData>) => {
    if (employeeData.value) {
      employeeData.value = { ...employeeData.value, ...updates } // ✅ This now works
      
      if (import.meta.client) {
        const dataWithTimestamp = { ...employeeData.value, _timestamp: Date.now() }
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithTimestamp))
        } catch (error) {
          console.error('Error updating sessionStorage:', error)
        }
      }
    }
  }

  // ✅ FIX: Use computed for getters, not readonly
  const hasEmployeeData = computed(() => employeeData.value !== null)
  const currentEmployee = computed(() => employeeData.value)
  const currentEmployeeId = computed(() => employeeData.value?.employeeId)
  const currentEmployeeName = computed(() => employeeData.value?.employeeName || 'Employee')
  const currentManagerLevel = computed(() => employeeData.value?.managerLevel || 0)
  const currentManagerId = computed(() => employeeData.value?.managerId || '')
  const currentJoiningDate = computed(() => employeeData.value?.employeeDateOfJoining)

  return {
    // ✅ FIX: Return refs directly, no readonly wrapper
    employeeData,
    isLoading,
    
    setEmployeeData,
    clearEmployeeData,
    updateEmployeeData,
    initializeStore,
    
    hasEmployeeData,
    currentEmployee,
    currentEmployeeId,
    currentEmployeeName,
    currentManagerLevel,
    currentManagerId,
    currentJoiningDate
  }
})
