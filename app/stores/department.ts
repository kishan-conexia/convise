// // stores/departments.ts
// import { defineStore } from 'pinia'
// import { useSupabaseClient } from '#imports'

// export const useDepartmentsStore = defineStore('departments', {
//   state: () => ({
//     managedDepartments: [] as any[],
//     allDepartments: [] as any[],
//     selectedDepartmentId: null as null | number,
//     departmentEmployees: [] as any[],
//     loading: false
//   }),
//   actions: {
//     async fetchManagedDepartments(managerId: string) {
//       // Fetch all departments where this manager is assigned
//       const supabase = useSupabaseClient()
//       this.loading = true
//       const { data, error } = await supabase
//         .from('departments')
//         .select('*')
//         .eq('is_active', true)
//         .eq('manager_id', managerId)
//       this.managedDepartments = data || []
//       this.loading = false
//     },
//     async fetchAllDepartments() {
//       const supabase = useSupabaseClient()
//       const { data, error } = await supabase
//         .from('departments')
//         .select('*')
//         .eq('is_active', true)
//       this.allDepartments = data || []
//     },
//     async fetchDepartmentEmployees(departmentId: number) {
//       const supabase = useSupabaseClient()
//       this.loading = true
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('id, full_name, employee_code, email, avatar_url, position, is_active')
//         .eq('department', departmentId)
//         .eq('is_active', true)
//       this.departmentEmployees = data || []
//       this.loading = false
//     },
//     setSelectedDepartment(id: number) {
//       this.selectedDepartmentId = id
//     }
//   }
// })
