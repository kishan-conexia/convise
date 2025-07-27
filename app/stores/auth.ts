// import { defineStore } from 'pinia'
// import { useSupabaseUser, useSupabaseClient } from '#imports'

// export const useAuthStore = defineStore('auth', {
//   state: () => ({
//     userName: '',
//     empCode: '',
//     userEmail: '',
//     isManager: false,
//     managedDepartmentIds: [] as number[],
//     ovUsername: '',
//     ovPassword: '',
//     initialized: false,
//     loading: false
//   }),
//   actions: {
//     async initialize() {
//       this.loading = true
//       const user = useSupabaseUser().value
//       const supabase = useSupabaseClient()
//       if (!user) {
//         this.loading = false
//         return
//       }
//       // Fetch user profile
//       const { data: profile } = await supabase
//         .from('profiles')
//         .select('full_name, employee_code, ov_username, ov_password')
//         .eq('id', user.id)
//         .maybeSingle()
//       this.userName = profile?.full_name || user.user_metadata?.full_name || 'User'
//       this.userEmail = user.email || ''
//       this.empCode = profile?.employee_code || ''
//       this.ovUsername = profile?.ov_username || ''
//       this.ovPassword = profile?.ov_password || ''
//       // Fetch managed departments & manager flag
//       const { data: managed } = await supabase
//         .from('departments')
//         .select('id')
//         .eq('manager_id', user.id)
//         .eq('is_active', true)
//       this.isManager = Array.isArray(managed) && managed.length > 0
//       this.managedDepartmentIds = managed?.map((d: any) => d.id) || []
//       this.initialized = true
//       this.loading = false
//     },
//     async signOut() {
//       const supabase = useSupabaseClient()
//       await supabase.auth.signOut()
//       this.$reset()
//     }
//   },
//   getters: {
//     userInitial(state): string {
//       return (state.userName || state.userEmail || '').charAt(0).toUpperCase()
//     }
//   }
// })
