// // stores/attendance.ts
// import { defineStore } from 'pinia'
// import { useSupabaseUser, useSupabaseClient } from '#imports'

// export const useAttendanceStore = defineStore('attendance', {
//   state: () => ({
//     today: null as null | any,           // Today's attendance
//     todayLoading: false,
//     recent: [] as any[],                 // Recent attendance records (optional)
//     summary: [] as any[],                // For monthly reports, etc
//   }),
//   actions: {
//     async fetchToday() {
//       this.todayLoading = true
//       const user = useSupabaseUser().value
//       if (!user) { this.todayLoading = false; return }
//       const supabase = useSupabaseClient()
//       const todayStr = new Date().toISOString().substring(0, 10)
//       const { data, error } = await supabase
//         .from('attendance')
//         .select('*')
//         .eq('employee_id', user.id)
//         .eq('date', todayStr)
//         .maybeSingle()
//       this.today = data || null
//       this.todayLoading = false
//     },
//     async punchIn() {
//       const user = useSupabaseUser().value
//       if (!user) return false
//       const supabase = useSupabaseClient()
//       const todayStr = new Date().toISOString().substring(0, 10)
//       const { error } = await supabase
//         .from('attendance')
//         .upsert({
//           employee_id: user.id,
//           date: todayStr,
//           punch_in: new Date().toISOString()
//         }, { onConflict: ['employee_id', 'date'] })
//       await this.fetchToday()
//       return !error
//     },
//     async punchOut() {
//       const user = useSupabaseUser().value
//       if (!user) return false
//       const supabase = useSupabaseClient()
//       const todayStr = new Date().toISOString().substring(0, 10)
//       const { error } = await supabase
//         .from('attendance')
//         .update({
//           punch_out: new Date().toISOString()
//         })
//         .eq('employee_id', user.id)
//         .eq('date', todayStr)
//       await this.fetchToday()
//       return !error
//     },
//     async fetchSummary({ start, end }: { start: string, end: string }) {
//       const user = useSupabaseUser().value
//       if (!user) return
//       const supabase = useSupabaseClient()
//       const { data, error } = await supabase
//         .from('attendance')
//         .select('*')
//         .eq('employee_id', user.id)
//         .gte('date', start)
//         .lte('date', end)
//         .order('date')
//       this.summary = data || []
//     }
//   }
// })
