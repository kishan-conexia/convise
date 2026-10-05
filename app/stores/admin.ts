import { defineStore } from "pinia";

export interface AdminDepartment {
  id: number;
  name: string;
  code: string;
  description: string | null;
  parent_id: number | null;
  level: number;
  manager_id: string | null;
  department_type: string;
  service_area: string | null;
  shift_type: string;
  cost_center: string;
  annual_budget: number | null;
  max_headcount: number | null;
  is_active: boolean;
  effective_from: string;
  created_at: string;
  manager?: {
    full_name: string | null;
    email: string;
  } | null;
}

export interface AdminPosition {
  id: number;
  designation: string | null;
  code: string | null;
  description: string | null;
  main_department_id: number | null;
  job_family: string | null;
  level: string | null;
  min_salary: number | null;
  max_salary: number | null;
  is_active: boolean | null;
  created_at: string;
}

export interface AdminLeaveType {
  id: number;
  leave_code: string;
  leave_name: string;
  description: string | null;
  is_carry_forward: boolean;
  max_carry_forward: number;
  is_encashable: boolean;
  max_consecutive_days: number | null;
  requires_document: boolean;
  notice_period_days: number;
  approval_levels: number;
  is_active: boolean;
}

export interface AdminEmployee {
  id: string;
  full_name: string | null;
  employee_code: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  department: number | null;
  position: number | null;
  app_access: boolean | null;
  web_access: boolean | null;
  geofencing: boolean | null;
  face_recognition?: boolean | null;
  face_embedding?: number[] | null;
  face_enrolled_at?: string | null;
  face_enrollment_photo?: string | null;
  face_match_threshold?: number | null;
  gender: string | null;
  marital_status: string | null;
  employment_type: string | null;
  date_of_birth: string | null;
  date_of_joining: string | null;
  approval_levels: number | null;
  is_active: boolean;
  work_schedule?: {
    id: number;
    start_time: string | null;
    end_time: string | null;
    weekdays: string[] | null;
    punch_in_grace: number | null;
    wfm_allowed: boolean | null;
    office_location: string | null;
    office_radius: number | null;
    home_location: string | null;
    home_radius: number | null;
    work_location_names: string | null;
    work_location_radius: number | null;
    schedule_type: string | null;
    shift_pattern: string | null;
  } | null;
}

export const useAdminStore = defineStore("admin", {
  state: () => ({
    departments: [] as AdminDepartment[],
    positions: [] as AdminPosition[],
    leaveTypes: [] as AdminLeaveType[],
    employees: [] as AdminEmployee[],
    isMetadataLoading: false,
    isEmployeesLoading: false,
    error: null as string | null,
    metadataLoaded: false,
  }),

  getters: {
    departmentsMap: (state) => {
      const map = new Map<number, AdminDepartment>();
      for (const d of state.departments) {
        map.set(d.id, d);
      }
      return map;
    },

    positionsMap: (state) => {
      const map = new Map<number, AdminPosition>();
      for (const p of state.positions) {
        map.set(p.id, p);
      }
      return map;
    },

    leaveTypesMap: (state) => {
      const map = new Map<number, AdminLeaveType>();
      for (const lt of state.leaveTypes) {
        map.set(lt.id, lt);
      }
      return map;
    },

    activeDepartments: (state) => {
      return state.departments.filter((d) => d.is_active);
    },

    activePositions: (state) => {
      return state.positions.filter((p) => p.is_active !== false);
    },

    activeLeaveTypes: (state) => {
      return state.leaveTypes.filter((lt) => lt.is_active);
    },
  },

  actions: {
    async fetchMetadata(force = false) {
      if (this.metadataLoaded && !force) return;

      const supabase = useSupabaseClient();
      this.isMetadataLoading = true;
      this.error = null;

      try {
        const [deptRes, posRes, leaveRes] = await Promise.all([
          supabase
            .from("departments")
            .select("*, manager:manager_id(full_name, email)")
            .order("name", { ascending: true }),
          supabase
            .from("positions")
            .select("*")
            .order("designation", { ascending: true }),
          supabase
            .from("leave_types")
            .select("*")
            .order("leave_name", { ascending: true }),
        ]);

        if (deptRes.error) throw deptRes.error;
        if (posRes.error) throw posRes.error;
        if (leaveRes.error) throw leaveRes.error;

        this.departments = (deptRes.data as any) || [];
        this.positions = (posRes.data as any) || [];
        this.leaveTypes = (leaveRes.data as any) || [];
        this.metadataLoaded = true;
      } catch (err: any) {
        console.error("Failed to load admin metadata:", err);
        this.error = err.message || "Failed to load metadata";
      } finally {
        this.isMetadataLoading = false;
      }
    },

    async fetchEmployees(force = false) {
      if (this.employees.length > 0 && !force) return;

      const supabase = useSupabaseClient();
      this.isEmployeesLoading = true;
      this.error = null;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            *,
            work_schedule:work_schedules(*)
          `)
          .order("full_name", { ascending: true });

        if (error) throw error;

        // Flatten work_schedule array if single relation
        this.employees = (data || []).map((emp: any) => ({
          ...emp,
          work_schedule: Array.isArray(emp.work_schedule)
            ? emp.work_schedule[0] || null
            : emp.work_schedule || null,
        }));
      } catch (err: any) {
        console.error("Failed to fetch employees:", err);
        this.error = err.message || "Failed to fetch employees";
      } finally {
        this.isEmployeesLoading = false;
      }
    },

    getDepartmentName(deptId: number | null): string {
      if (!deptId) return "Unassigned";
      return this.departmentsMap.get(deptId)?.name || `Dept #${deptId}`;
    },

    getPositionName(posId: number | null): string {
      if (!posId) return "Unassigned";
      return this.positionsMap.get(posId)?.designation || `Position #${posId}`;
    },
  },
});
