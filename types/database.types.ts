export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          attendance_type: string | null
          comment: string | null
          date: string | null
          early_departure_minutes: number | null
          employee_id: string
          face_confidence: number | null
          face_verified: boolean | null
          id: number
          is_early_departure: boolean | null
          is_holiday: boolean | null
          is_late: boolean | null
          is_regularized: boolean | null
          is_weekend: boolean | null
          late_minutes: number | null
          punch_in: string | null
          punch_in_location: string | null
          punch_out: string | null
          punch_out_location: string | null
          remarks: string | null
          status: string | null
          work_hours: number | null
        }
        Insert: {
          attendance_type?: string | null
          comment?: string | null
          date?: string | null
          early_departure_minutes?: number | null
          employee_id: string
          face_confidence?: number | null
          face_verified?: boolean | null
          id?: number
          is_early_departure?: boolean | null
          is_holiday?: boolean | null
          is_late?: boolean | null
          is_regularized?: boolean | null
          is_weekend?: boolean | null
          late_minutes?: number | null
          punch_in?: string | null
          punch_in_location?: string | null
          punch_out?: string | null
          punch_out_location?: string | null
          remarks?: string | null
          status?: string | null
          work_hours?: number | null
        }
        Update: {
          attendance_type?: string | null
          comment?: string | null
          date?: string | null
          early_departure_minutes?: number | null
          employee_id?: string
          face_confidence?: number | null
          face_verified?: boolean | null
          id?: number
          is_early_departure?: boolean | null
          is_holiday?: boolean | null
          is_late?: boolean | null
          is_regularized?: boolean | null
          is_weekend?: boolean | null
          late_minutes?: number | null
          punch_in?: string | null
          punch_in_location?: string | null
          punch_out?: string | null
          punch_out_location?: string | null
          remarks?: string | null
          status?: string | null
          work_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_regularizations: {
        Row: {
          applied_by: string | null
          approval_levels: number | null
          attendance_id: number | null
          created_at: string
          employee_id: string | null
          final_approved_at: string | null
          id: number
          level_1_action_at: string | null
          level_1_approver_id: string | null
          level_1_comments: string | null
          level_1_status: string | null
          level_2_action_at: string | null
          level_2_approver_id: string | null
          level_2_comments: string | null
          level_2_status: string | null
          level_3_action_at: string | null
          level_3_approver_id: string | null
          level_3_comments: string | null
          level_3_status: string | null
          original_punch_in: string | null
          original_punch_out: string | null
          reason: string | null
          regularization_type: string | null
          requested_punch_in: string | null
          requested_punch_out: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applied_by?: string | null
          approval_levels?: number | null
          attendance_id?: number | null
          created_at?: string
          employee_id?: string | null
          final_approved_at?: string | null
          id?: number
          level_1_action_at?: string | null
          level_1_approver_id?: string | null
          level_1_comments?: string | null
          level_1_status?: string | null
          level_2_action_at?: string | null
          level_2_approver_id?: string | null
          level_2_comments?: string | null
          level_2_status?: string | null
          level_3_action_at?: string | null
          level_3_approver_id?: string | null
          level_3_comments?: string | null
          level_3_status?: string | null
          original_punch_in?: string | null
          original_punch_out?: string | null
          reason?: string | null
          regularization_type?: string | null
          requested_punch_in?: string | null
          requested_punch_out?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applied_by?: string | null
          approval_levels?: number | null
          attendance_id?: number | null
          created_at?: string
          employee_id?: string | null
          final_approved_at?: string | null
          id?: number
          level_1_action_at?: string | null
          level_1_approver_id?: string | null
          level_1_comments?: string | null
          level_1_status?: string | null
          level_2_action_at?: string | null
          level_2_approver_id?: string | null
          level_2_comments?: string | null
          level_2_status?: string | null
          level_3_action_at?: string | null
          level_3_approver_id?: string | null
          level_3_comments?: string | null
          level_3_status?: string | null
          original_punch_in?: string | null
          original_punch_out?: string | null
          reason?: string | null
          regularization_type?: string | null
          requested_punch_in?: string | null
          requested_punch_out?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_regularizations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_approval_chain: {
        Row: {
          approval_id: number
          approver_id: string
          approver_level: number
          approver_role: string
          assigned_at: string | null
          attached_documents: Json | null
          can_be_parallel: boolean | null
          conditions: string | null
          decision: string | null
          decision_remarks: string | null
          delegated_at: string | null
          delegated_to: string | null
          delegation_reason: string | null
          department_id: number | null
          due_at: string | null
          escalation_count: number | null
          id: number
          is_overdue: boolean | null
          requires_all_at_level: boolean | null
          reviewed_at: string | null
          sla_hours: number | null
          status: string
        }
        Insert: {
          approval_id: number
          approver_id: string
          approver_level: number
          approver_role: string
          assigned_at?: string | null
          attached_documents?: Json | null
          can_be_parallel?: boolean | null
          conditions?: string | null
          decision?: string | null
          decision_remarks?: string | null
          delegated_at?: string | null
          delegated_to?: string | null
          delegation_reason?: string | null
          department_id?: number | null
          due_at?: string | null
          escalation_count?: number | null
          id?: never
          is_overdue?: boolean | null
          requires_all_at_level?: boolean | null
          reviewed_at?: string | null
          sla_hours?: number | null
          status?: string
        }
        Update: {
          approval_id?: number
          approver_id?: string
          approver_level?: number
          approver_role?: string
          assigned_at?: string | null
          attached_documents?: Json | null
          can_be_parallel?: boolean | null
          conditions?: string | null
          decision?: string | null
          decision_remarks?: string | null
          delegated_at?: string | null
          delegated_to?: string | null
          delegation_reason?: string | null
          department_id?: number | null
          due_at?: string | null
          escalation_count?: number | null
          id?: never
          is_overdue?: boolean | null
          requires_all_at_level?: boolean | null
          reviewed_at?: string | null
          sla_hours?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_approval_chain_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "business_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_approval_chain_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_approval_chain_delegated_to_fkey"
            columns: ["delegated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_approval_chain_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      business_approvals: {
        Row: {
          advance_payment_months: number | null
          advance_payment_required: boolean | null
          approval_number: string
          approval_type: string
          assigned_at: string | null
          attachments: Json | null
          billing_cycle: string | null
          capex_required: number | null
          completed_at: string | null
          compliance_check_required: boolean | null
          contract_period_months: number | null
          contract_value: number | null
          created_at: string
          current_approval_level: number | null
          current_approver_department: number | null
          current_approver_id: string | null
          customer_lifetime_value: number | null
          deal_value: number | null
          description: string | null
          discount_amount: number | null
          discount_justification: string | null
          discount_percentage: number | null
          due_date: string | null
          expected_roi_months: number | null
          feasibility_id: number | null
          final_approved_at: string | null
          final_approved_by: string | null
          final_remarks: string | null
          final_status: string | null
          id: number
          installation_charges: number | null
          is_overdue: boolean | null
          lead_id: number
          legal_review_required: boolean | null
          mitigation_plan: string | null
          monthly_recurring_revenue: number | null
          notes: string | null
          onetime_charges: number | null
          payback_period_months: number | null
          payment_terms: string | null
          priority: string | null
          profit_margin_percentage: number | null
          request_reason: string | null
          requested_at: string
          requested_by: string
          requesting_department: number
          revision_count: number | null
          risk_factors: string | null
          risk_level: string | null
          security_deposit: number | null
          sla_hours: number | null
          special_conditions: string | null
          status: string
          strategic_importance: string | null
          subject: string
          total_approval_levels: number | null
          updated_at: string
        }
        Insert: {
          advance_payment_months?: number | null
          advance_payment_required?: boolean | null
          approval_number: string
          approval_type: string
          assigned_at?: string | null
          attachments?: Json | null
          billing_cycle?: string | null
          capex_required?: number | null
          completed_at?: string | null
          compliance_check_required?: boolean | null
          contract_period_months?: number | null
          contract_value?: number | null
          created_at?: string
          current_approval_level?: number | null
          current_approver_department?: number | null
          current_approver_id?: string | null
          customer_lifetime_value?: number | null
          deal_value?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_justification?: string | null
          discount_percentage?: number | null
          due_date?: string | null
          expected_roi_months?: number | null
          feasibility_id?: number | null
          final_approved_at?: string | null
          final_approved_by?: string | null
          final_remarks?: string | null
          final_status?: string | null
          id?: never
          installation_charges?: number | null
          is_overdue?: boolean | null
          lead_id: number
          legal_review_required?: boolean | null
          mitigation_plan?: string | null
          monthly_recurring_revenue?: number | null
          notes?: string | null
          onetime_charges?: number | null
          payback_period_months?: number | null
          payment_terms?: string | null
          priority?: string | null
          profit_margin_percentage?: number | null
          request_reason?: string | null
          requested_at?: string
          requested_by: string
          requesting_department: number
          revision_count?: number | null
          risk_factors?: string | null
          risk_level?: string | null
          security_deposit?: number | null
          sla_hours?: number | null
          special_conditions?: string | null
          status?: string
          strategic_importance?: string | null
          subject: string
          total_approval_levels?: number | null
          updated_at?: string
        }
        Update: {
          advance_payment_months?: number | null
          advance_payment_required?: boolean | null
          approval_number?: string
          approval_type?: string
          assigned_at?: string | null
          attachments?: Json | null
          billing_cycle?: string | null
          capex_required?: number | null
          completed_at?: string | null
          compliance_check_required?: boolean | null
          contract_period_months?: number | null
          contract_value?: number | null
          created_at?: string
          current_approval_level?: number | null
          current_approver_department?: number | null
          current_approver_id?: string | null
          customer_lifetime_value?: number | null
          deal_value?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_justification?: string | null
          discount_percentage?: number | null
          due_date?: string | null
          expected_roi_months?: number | null
          feasibility_id?: number | null
          final_approved_at?: string | null
          final_approved_by?: string | null
          final_remarks?: string | null
          final_status?: string | null
          id?: never
          installation_charges?: number | null
          is_overdue?: boolean | null
          lead_id?: number
          legal_review_required?: boolean | null
          mitigation_plan?: string | null
          monthly_recurring_revenue?: number | null
          notes?: string | null
          onetime_charges?: number | null
          payback_period_months?: number | null
          payment_terms?: string | null
          priority?: string | null
          profit_margin_percentage?: number | null
          request_reason?: string | null
          requested_at?: string
          requested_by?: string
          requesting_department?: number
          revision_count?: number | null
          risk_factors?: string | null
          risk_level?: string | null
          security_deposit?: number | null
          sla_hours?: number | null
          special_conditions?: string | null
          status?: string
          strategic_importance?: string | null
          subject?: string
          total_approval_levels?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_approvals_current_approver_department_fkey"
            columns: ["current_approver_department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_approvals_current_approver_id_fkey"
            columns: ["current_approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_approvals_final_approved_by_fkey"
            columns: ["final_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_approvals_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_approvals_requesting_department_fkey"
            columns: ["requesting_department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_documents: {
        Row: {
          can_be_deleted_after: string | null
          created_at: string
          customer_id: number | null
          document_category: string
          document_description: string | null
          document_expiry_date: string | null
          document_issue_date: string | null
          document_issuer: string | null
          document_name: string
          document_number: string | null
          document_type: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: number
          is_expired: boolean | null
          is_latest_version: boolean | null
          is_mandatory: boolean | null
          is_sensitive: boolean | null
          is_valid: boolean | null
          lead_id: number | null
          metadata: Json | null
          order_id: number | null
          rejection_reason: string | null
          retention_period_years: number | null
          search_keywords: string | null
          superseded_by_document_id: number | null
          tags: string[] | null
          updated_at: string
          upload_source: string | null
          uploaded_at: string
          uploaded_by: string
          verification_remarks: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
          version_number: number | null
        }
        Insert: {
          can_be_deleted_after?: string | null
          created_at?: string
          customer_id?: number | null
          document_category: string
          document_description?: string | null
          document_expiry_date?: string | null
          document_issue_date?: string | null
          document_issuer?: string | null
          document_name: string
          document_number?: string | null
          document_type: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: never
          is_expired?: boolean | null
          is_latest_version?: boolean | null
          is_mandatory?: boolean | null
          is_sensitive?: boolean | null
          is_valid?: boolean | null
          lead_id?: number | null
          metadata?: Json | null
          order_id?: number | null
          rejection_reason?: string | null
          retention_period_years?: number | null
          search_keywords?: string | null
          superseded_by_document_id?: number | null
          tags?: string[] | null
          updated_at?: string
          upload_source?: string | null
          uploaded_at?: string
          uploaded_by: string
          verification_remarks?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          version_number?: number | null
        }
        Update: {
          can_be_deleted_after?: string | null
          created_at?: string
          customer_id?: number | null
          document_category?: string
          document_description?: string | null
          document_expiry_date?: string | null
          document_issue_date?: string | null
          document_issuer?: string | null
          document_name?: string
          document_number?: string | null
          document_type?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: never
          is_expired?: boolean | null
          is_latest_version?: boolean | null
          is_mandatory?: boolean | null
          is_sensitive?: boolean | null
          is_valid?: boolean | null
          lead_id?: number | null
          metadata?: Json | null
          order_id?: number | null
          rejection_reason?: string | null
          retention_period_years?: number | null
          search_keywords?: string | null
          superseded_by_document_id?: number | null
          tags?: string[] | null
          updated_at?: string
          upload_source?: string | null
          uploaded_at?: string
          uploaded_by?: string
          verification_remarks?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "active_customers_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_due_for_renewal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "high_value_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "my_managed_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "installation_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "my_assigned_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_superseded_by_document_id_fkey"
            columns: ["superseded_by_document_id"]
            isOneToOne: false
            referencedRelation: "customer_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_manager_id: string | null
          allow_marketing_communication: boolean | null
          alternate_email: string | null
          alternate_phone: string | null
          assigned_sales_rep_id: string | null
          average_monthly_revenue: number | null
          average_uptime_percentage: number | null
          bandwidth: string
          billing_address: string
          billing_city: string
          billing_cycle: string | null
          billing_pincode: string
          billing_state: string
          business_registration_number: string | null
          business_type: string | null
          company_name: string | null
          connection_type: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string
          contract_period_months: number | null
          created_at: string
          customer_category: string | null
          customer_connection_id: string | null
          customer_id: string
          customer_name: string
          customer_since: string | null
          customer_type: string
          gstin: string | null
          id: number
          internal_notes: string | null
          ip_address: string | null
          last_complaint_date: string | null
          last_invoice_date: string | null
          last_payment_date: string | null
          last_service_request_date: string | null
          lead_id: number | null
          lifetime_value: number | null
          mac_address: string | null
          metadata: Json | null
          monthly_rental: number
          next_renewal_date: string | null
          notes: string | null
          ont_serial_number: string | null
          order_id: number | null
          outstanding_balance: number | null
          pan: string | null
          payment_history_score: number | null
          payment_mode: string | null
          plan_name: string
          pop_connected: string | null
          port_number: string | null
          preferred_communication_channel: string | null
          preferred_language: string | null
          router_serial_number: string | null
          same_as_billing_address: boolean | null
          security_deposit: number | null
          service_address: string
          service_city: string
          service_end_date: string | null
          service_latitude: number | null
          service_longitude: number | null
          service_pincode: string
          service_start_date: string
          service_state: string
          status: string
          status_changed_at: string | null
          status_changed_by: string | null
          status_reason: string | null
          tags: string[] | null
          tan: string | null
          total_complaints: number | null
          total_revenue_generated: number | null
          total_service_requests: number | null
          updated_at: string
          vlan_id: string | null
        }
        Insert: {
          account_manager_id?: string | null
          allow_marketing_communication?: boolean | null
          alternate_email?: string | null
          alternate_phone?: string | null
          assigned_sales_rep_id?: string | null
          average_monthly_revenue?: number | null
          average_uptime_percentage?: number | null
          bandwidth: string
          billing_address: string
          billing_city: string
          billing_cycle?: string | null
          billing_pincode: string
          billing_state: string
          business_registration_number?: string | null
          business_type?: string | null
          company_name?: string | null
          connection_type: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone: string
          contract_period_months?: number | null
          created_at?: string
          customer_category?: string | null
          customer_connection_id?: string | null
          customer_id: string
          customer_name: string
          customer_since?: string | null
          customer_type: string
          gstin?: string | null
          id?: never
          internal_notes?: string | null
          ip_address?: string | null
          last_complaint_date?: string | null
          last_invoice_date?: string | null
          last_payment_date?: string | null
          last_service_request_date?: string | null
          lead_id?: number | null
          lifetime_value?: number | null
          mac_address?: string | null
          metadata?: Json | null
          monthly_rental: number
          next_renewal_date?: string | null
          notes?: string | null
          ont_serial_number?: string | null
          order_id?: number | null
          outstanding_balance?: number | null
          pan?: string | null
          payment_history_score?: number | null
          payment_mode?: string | null
          plan_name: string
          pop_connected?: string | null
          port_number?: string | null
          preferred_communication_channel?: string | null
          preferred_language?: string | null
          router_serial_number?: string | null
          same_as_billing_address?: boolean | null
          security_deposit?: number | null
          service_address: string
          service_city: string
          service_end_date?: string | null
          service_latitude?: number | null
          service_longitude?: number | null
          service_pincode: string
          service_start_date: string
          service_state: string
          status?: string
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          tags?: string[] | null
          tan?: string | null
          total_complaints?: number | null
          total_revenue_generated?: number | null
          total_service_requests?: number | null
          updated_at?: string
          vlan_id?: string | null
        }
        Update: {
          account_manager_id?: string | null
          allow_marketing_communication?: boolean | null
          alternate_email?: string | null
          alternate_phone?: string | null
          assigned_sales_rep_id?: string | null
          average_monthly_revenue?: number | null
          average_uptime_percentage?: number | null
          bandwidth?: string
          billing_address?: string
          billing_city?: string
          billing_cycle?: string | null
          billing_pincode?: string
          billing_state?: string
          business_registration_number?: string | null
          business_type?: string | null
          company_name?: string | null
          connection_type?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string
          contract_period_months?: number | null
          created_at?: string
          customer_category?: string | null
          customer_connection_id?: string | null
          customer_id?: string
          customer_name?: string
          customer_since?: string | null
          customer_type?: string
          gstin?: string | null
          id?: never
          internal_notes?: string | null
          ip_address?: string | null
          last_complaint_date?: string | null
          last_invoice_date?: string | null
          last_payment_date?: string | null
          last_service_request_date?: string | null
          lead_id?: number | null
          lifetime_value?: number | null
          mac_address?: string | null
          metadata?: Json | null
          monthly_rental?: number
          next_renewal_date?: string | null
          notes?: string | null
          ont_serial_number?: string | null
          order_id?: number | null
          outstanding_balance?: number | null
          pan?: string | null
          payment_history_score?: number | null
          payment_mode?: string | null
          plan_name?: string
          pop_connected?: string | null
          port_number?: string | null
          preferred_communication_channel?: string | null
          preferred_language?: string | null
          router_serial_number?: string | null
          same_as_billing_address?: boolean | null
          security_deposit?: number | null
          service_address?: string
          service_city?: string
          service_end_date?: string | null
          service_latitude?: number | null
          service_longitude?: number | null
          service_pincode?: string
          service_start_date?: string
          service_state?: string
          status?: string
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          tags?: string[] | null
          tan?: string | null
          total_complaints?: number | null
          total_revenue_generated?: number | null
          total_service_requests?: number | null
          updated_at?: string
          vlan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_account_manager_id_fkey"
            columns: ["account_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_assigned_sales_rep_id_fkey"
            columns: ["assigned_sales_rep_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "installation_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "my_assigned_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_status_changed_by_fkey"
            columns: ["status_changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          annual_budget: number | null
          code: string
          cost_center: string
          created_at: string
          created_by: string | null
          department_type: string
          description: string | null
          effective_from: string
          effective_until: string | null
          id: number
          is_active: boolean
          level: number
          manager_id: string | null
          max_headcount: number | null
          name: string
          parent_id: number | null
          path: string | null
          service_area: string | null
          shift_type: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          annual_budget?: number | null
          code: string
          cost_center: string
          created_at?: string
          created_by?: string | null
          department_type?: string
          description?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: number
          is_active?: boolean
          level?: number
          manager_id?: string | null
          max_headcount?: number | null
          name: string
          parent_id?: number | null
          path?: string | null
          service_area?: string | null
          shift_type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          annual_budget?: number | null
          code?: string
          cost_center?: string
          created_at?: string
          created_by?: string | null
          department_type?: string
          description?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: number
          is_active?: boolean
          level?: number
          manager_id?: string | null
          max_headcount?: number | null
          name?: string
          parent_id?: number | null
          path?: string | null
          service_area?: string | null
          shift_type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_holiday_selections: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          employee_id: string
          holiday_id: number
          id: number
          remarks: string | null
          selected_date: string
          status: string | null
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          employee_id: string
          holiday_id: number
          id?: number
          remarks?: string | null
          selected_date: string
          status?: string | null
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          employee_id?: string
          holiday_id?: number
          id?: number
          remarks?: string | null
          selected_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_holiday_selections_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_holiday_selections_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_holiday_selections_holiday_id_fkey"
            columns: ["holiday_id"]
            isOneToOne: false
            referencedRelation: "holidays"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_leave_balances: {
        Row: {
          allocated_days: number
          available_days: number | null
          calendar_year: number
          carried_forward_days: number
          created_at: string
          employee_id: string
          encashed_days: number
          expired_days: number
          id: number
          leave_type_id: number
          next_year_days: number | null
          pending_days: number
          updated_at: string | null
          used_days: number
        }
        Insert: {
          allocated_days?: number
          available_days?: number | null
          calendar_year: number
          carried_forward_days?: number
          created_at?: string
          employee_id: string
          encashed_days?: number
          expired_days?: number
          id?: number
          leave_type_id: number
          next_year_days?: number | null
          pending_days?: number
          updated_at?: string | null
          used_days?: number
        }
        Update: {
          allocated_days?: number
          available_days?: number | null
          calendar_year?: number
          carried_forward_days?: number
          created_at?: string
          employee_id?: string
          encashed_days?: number
          expired_days?: number
          id?: number
          leave_type_id?: number
          next_year_days?: number | null
          pending_days?: number
          updated_at?: string | null
          used_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      feasibility_department_responses: {
        Row: {
          assigned_at: string
          assigned_by: string
          assigned_to: string | null
          attachments: Json | null
          completed_at: string | null
          conditions: string | null
          confidence_level: string | null
          department_id: number
          department_name: string
          feasibility_request_id: number
          id: number
          is_mandatory: boolean | null
          is_overdue: boolean | null
          recommendation: string | null
          remarks: string | null
          responded_at: string | null
          responded_by: string | null
          response_data: Json | null
          response_result: string | null
          risk_factors: string | null
          sequence_order: number | null
          sla_hours: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assigned_to?: string | null
          attachments?: Json | null
          completed_at?: string | null
          conditions?: string | null
          confidence_level?: string | null
          department_id: number
          department_name: string
          feasibility_request_id: number
          id?: never
          is_mandatory?: boolean | null
          is_overdue?: boolean | null
          recommendation?: string | null
          remarks?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_data?: Json | null
          response_result?: string | null
          risk_factors?: string | null
          sequence_order?: number | null
          sla_hours?: number | null
          started_at?: string | null
          status?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assigned_to?: string | null
          attachments?: Json | null
          completed_at?: string | null
          conditions?: string | null
          confidence_level?: string | null
          department_id?: number
          department_name?: string
          feasibility_request_id?: number
          id?: never
          is_mandatory?: boolean | null
          is_overdue?: boolean | null
          recommendation?: string | null
          remarks?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_data?: Json | null
          response_result?: string | null
          risk_factors?: string | null
          sequence_order?: number | null
          sla_hours?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_department_responses_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_department_responses_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_department_responses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_department_responses_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feasibility_requests: {
        Row: {
          attachments: Json
          commercial_remarks: string | null
          created_at: string
          estimated_capex: number | null
          estimated_installation_days: number | null
          estimated_opex: number | null
          estimated_roi_months: number | null
          expected_completion_date: string | null
          feasibility_remarks: string | null
          id: number
          is_commercially_viable: boolean | null
          is_feasible: boolean | null
          lead_id: number
          operational_costs: Json | null
          primary_route: Json | null
          request_number: string
          requested_at: string
          requested_by: string
          requesting_department: number
          reviewed_at: string | null
          reviewed_by: string | null
          secondary_route: Json | null
          service_location: Json
          service_requirements: Json
          site_survey: Json | null
          status: string
          status_history: Json
          updated_at: string
        }
        Insert: {
          attachments?: Json
          commercial_remarks?: string | null
          created_at?: string
          estimated_capex?: number | null
          estimated_installation_days?: number | null
          estimated_opex?: number | null
          estimated_roi_months?: number | null
          expected_completion_date?: string | null
          feasibility_remarks?: string | null
          id?: never
          is_commercially_viable?: boolean | null
          is_feasible?: boolean | null
          lead_id: number
          operational_costs?: Json | null
          primary_route?: Json | null
          request_number: string
          requested_at?: string
          requested_by: string
          requesting_department: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          secondary_route?: Json | null
          service_location: Json
          service_requirements: Json
          site_survey?: Json | null
          status?: string
          status_history?: Json
          updated_at?: string
        }
        Update: {
          attachments?: Json
          commercial_remarks?: string | null
          created_at?: string
          estimated_capex?: number | null
          estimated_installation_days?: number | null
          estimated_opex?: number | null
          estimated_roi_months?: number | null
          expected_completion_date?: string | null
          feasibility_remarks?: string | null
          id?: never
          is_commercially_viable?: boolean | null
          is_feasible?: boolean | null
          lead_id?: number
          operational_costs?: Json | null
          primary_route?: Json | null
          request_number?: string
          requested_at?: string
          requested_by?: string
          requesting_department?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          secondary_route?: Json | null
          service_location?: Json
          service_requirements?: Json
          site_survey?: Json | null
          status?: string
          status_history?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "spanco_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "spanco_stage_analytics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "feasibility_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_requests_requesting_department_fkey"
            columns: ["requesting_department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          applicable_departments: number[] | null
          calendar_year: number
          compensation_type: string | null
          created_at: string | null
          description: string | null
          holiday_date: string
          holiday_type: string | null
          id: number
          is_active: boolean | null
          is_national: boolean | null
          is_optional: boolean | null
          is_recurring: boolean | null
          max_employees_per_day: number | null
          requires_approval: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          applicable_departments?: number[] | null
          calendar_year?: number
          compensation_type?: string | null
          created_at?: string | null
          description?: string | null
          holiday_date: string
          holiday_type?: string | null
          id?: number
          is_active?: boolean | null
          is_national?: boolean | null
          is_optional?: boolean | null
          is_recurring?: boolean | null
          max_employees_per_day?: number | null
          requires_approval?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          applicable_departments?: number[] | null
          calendar_year?: number
          compensation_type?: string | null
          created_at?: string | null
          description?: string | null
          holiday_date?: string
          holiday_type?: string | null
          id?: number
          is_active?: boolean | null
          is_national?: boolean | null
          is_optional?: boolean | null
          is_recurring?: boolean | null
          max_employees_per_day?: number | null
          requires_approval?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      leave_allocation_rules: {
        Row: {
          annual_allocation: number
          created_at: string
          employee_level: string | null
          id: number
          is_active: boolean
          leave_type_id: number
          monthly_accrual: number | null
          updated_at: string | null
          years_of_service_max: number | null
          years_of_service_min: number | null
        }
        Insert: {
          annual_allocation: number
          created_at?: string
          employee_level?: string | null
          id?: number
          is_active?: boolean
          leave_type_id: number
          monthly_accrual?: number | null
          updated_at?: string | null
          years_of_service_max?: number | null
          years_of_service_min?: number | null
        }
        Update: {
          annual_allocation?: number
          created_at?: string
          employee_level?: string | null
          id?: number
          is_active?: boolean
          leave_type_id?: number
          monthly_accrual?: number | null
          updated_at?: string | null
          years_of_service_max?: number | null
          years_of_service_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_allocation_rules_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_applications: {
        Row: {
          applied_by: string
          approval_levels: number
          created_at: string
          employee_id: string
          end_date: string
          final_approved_at: string | null
          id: number
          leave_type_id: number | null
          level_1_action_at: string | null
          level_1_approver_id: string | null
          level_1_comments: string | null
          level_1_status: string | null
          level_2_action_at: string | null
          level_2_approver_id: string | null
          level_2_comments: string | null
          level_2_status: string | null
          level_3_action_at: string | null
          level_3_approver_id: string | null
          level_3_comments: string | null
          level_3_status: string | null
          reason: string | null
          start_date: string
          status: string
          total_days: number
          updated_at: string | null
        }
        Insert: {
          applied_by: string
          approval_levels?: number
          created_at?: string
          employee_id: string
          end_date: string
          final_approved_at?: string | null
          id?: number
          leave_type_id?: number | null
          level_1_action_at?: string | null
          level_1_approver_id?: string | null
          level_1_comments?: string | null
          level_1_status?: string | null
          level_2_action_at?: string | null
          level_2_approver_id?: string | null
          level_2_comments?: string | null
          level_2_status?: string | null
          level_3_action_at?: string | null
          level_3_approver_id?: string | null
          level_3_comments?: string | null
          level_3_status?: string | null
          reason?: string | null
          start_date: string
          status?: string
          total_days: number
          updated_at?: string | null
        }
        Update: {
          applied_by?: string
          approval_levels?: number
          created_at?: string
          employee_id?: string
          end_date?: string
          final_approved_at?: string | null
          id?: number
          leave_type_id?: number | null
          level_1_action_at?: string | null
          level_1_approver_id?: string | null
          level_1_comments?: string | null
          level_1_status?: string | null
          level_2_action_at?: string | null
          level_2_approver_id?: string | null
          level_2_comments?: string | null
          level_2_status?: string | null
          level_3_action_at?: string | null
          level_3_approver_id?: string | null
          level_3_comments?: string | null
          level_3_status?: string | null
          reason?: string | null
          start_date?: string
          status?: string
          total_days?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_applications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_applications_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          approval_levels: number
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          is_carry_forward: boolean
          is_encashable: boolean
          leave_code: string
          leave_name: string
          max_carry_forward: number | null
          max_consecutive_days: number | null
          notice_period_days: number
          requires_document: boolean
          updated_at: string | null
        }
        Insert: {
          approval_levels?: number
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_carry_forward?: boolean
          is_encashable?: boolean
          leave_code: string
          leave_name: string
          max_carry_forward?: number | null
          max_consecutive_days?: number | null
          notice_period_days?: number
          requires_document?: boolean
          updated_at?: string | null
        }
        Update: {
          approval_levels?: number
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_carry_forward?: boolean
          is_encashable?: boolean
          leave_code?: string
          leave_name?: string
          max_carry_forward?: number | null
          max_consecutive_days?: number | null
          notice_period_days?: number
          requires_document?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      order_processing_checklist: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          attachments: Json | null
          blocked_by: string | null
          category: string
          completed_at: string | null
          completed_by: string | null
          completion_remarks: string | null
          created_at: string
          depends_on_item_ids: number[] | null
          due_at: string | null
          expected_completion_hours: number | null
          failure_reason: string | null
          id: number
          is_completed: boolean | null
          is_mandatory: boolean | null
          is_overdue: boolean | null
          is_verified: boolean | null
          item_description: string | null
          item_name: string
          max_retries: number | null
          order_id: number
          requires_verification: boolean | null
          responsible_department_id: number | null
          retry_count: number | null
          sequence_order: number
          started_at: string | null
          status: string
          updated_at: string
          verification_remarks: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          blocked_by?: string | null
          category: string
          completed_at?: string | null
          completed_by?: string | null
          completion_remarks?: string | null
          created_at?: string
          depends_on_item_ids?: number[] | null
          due_at?: string | null
          expected_completion_hours?: number | null
          failure_reason?: string | null
          id?: never
          is_completed?: boolean | null
          is_mandatory?: boolean | null
          is_overdue?: boolean | null
          is_verified?: boolean | null
          item_description?: string | null
          item_name: string
          max_retries?: number | null
          order_id: number
          requires_verification?: boolean | null
          responsible_department_id?: number | null
          retry_count?: number | null
          sequence_order: number
          started_at?: string | null
          status?: string
          updated_at?: string
          verification_remarks?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          blocked_by?: string | null
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          completion_remarks?: string | null
          created_at?: string
          depends_on_item_ids?: number[] | null
          due_at?: string | null
          expected_completion_hours?: number | null
          failure_reason?: string | null
          id?: never
          is_completed?: boolean | null
          is_mandatory?: boolean | null
          is_overdue?: boolean | null
          is_verified?: boolean | null
          item_description?: string | null
          item_name?: string
          max_retries?: number | null
          order_id?: number
          requires_verification?: boolean | null
          responsible_department_id?: number | null
          retry_count?: number | null
          sequence_order?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          verification_remarks?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_processing_checklist_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_processing_checklist_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_processing_checklist_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "installation_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_processing_checklist_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "my_assigned_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_processing_checklist_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_processing_checklist_responsible_department_id_fkey"
            columns: ["responsible_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_processing_checklist_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          designation: string | null
          id: number
          is_active: boolean | null
          job_family: string | null
          level: string | null
          main_department_id: number | null
          max_salary: number | null
          min_salary: number | null
          requirements: Json | null
          responsibilities: Json | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          designation?: string | null
          id?: number
          is_active?: boolean | null
          job_family?: string | null
          level?: string | null
          main_department_id?: number | null
          max_salary?: number | null
          min_salary?: number | null
          requirements?: Json | null
          responsibilities?: Json | null
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          designation?: string | null
          id?: number
          is_active?: boolean | null
          job_family?: string | null
          level?: string | null
          main_department_id?: number | null
          max_salary?: number | null
          min_salary?: number | null
          requirements?: Json | null
          responsibilities?: Json | null
        }
        Relationships: []
      }
      profile_details: {
        Row: {
          aadhaar_back_url: string | null
          aadhaar_number: string | null
          aadhaar_url: string | null
          bank_details: Json | null
          cancelled_cheque_url: string | null
          children: Json | null
          created_at: string
          current_address: string | null
          date_of_birth: string | null
          father_name: string | null
          id: number
          marital_status: string | null
          mother_name: string | null
          nominees: Json | null
          pan_number: string | null
          pan_url: string | null
          passbook_url: string | null
          passport_number: string | null
          passport_url: string | null
          permanent_address: string | null
          spouse_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aadhaar_back_url?: string | null
          aadhaar_number?: string | null
          aadhaar_url?: string | null
          bank_details?: Json | null
          cancelled_cheque_url?: string | null
          children?: Json | null
          created_at?: string
          current_address?: string | null
          date_of_birth?: string | null
          father_name?: string | null
          id?: number
          marital_status?: string | null
          mother_name?: string | null
          nominees?: Json | null
          pan_number?: string | null
          pan_url?: string | null
          passbook_url?: string | null
          passport_number?: string | null
          passport_url?: string | null
          permanent_address?: string | null
          spouse_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aadhaar_back_url?: string | null
          aadhaar_number?: string | null
          aadhaar_url?: string | null
          bank_details?: Json | null
          cancelled_cheque_url?: string | null
          children?: Json | null
          created_at?: string
          current_address?: string | null
          date_of_birth?: string | null
          father_name?: string | null
          id?: number
          marital_status?: string | null
          mother_name?: string | null
          nominees?: Json | null
          pan_number?: string | null
          pan_url?: string | null
          passbook_url?: string | null
          passport_number?: string | null
          passport_url?: string | null
          permanent_address?: string | null
          spouse_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          app_access: boolean | null
          approval_levels: number | null
          avatar_url: string | null
          current_address: string | null
          date_of_birth: string | null
          date_of_joining: string | null
          department: number | null
          device_id: string | null
          device_info: Json | null
          email: string | null
          emergency_contacts: Json | null
          employee_code: string | null
          employment_type: string | null
          face_embedding: number[] | null
          face_enrolled_at: string | null
          face_enrollment_photo: string | null
          face_match_threshold: number | null
          face_recognition: boolean | null
          full_name: string | null
          gender: string | null
          geofencing: boolean | null
          id: string
          is_active: boolean | null
          marital_status: string | null
          new_device_id: string | null
          new_device_info: Json | null
          ov_password: string | null
          ov_username: string | null
          permanent_address: string | null
          phone: string | null
          position: number | null
          updated_at: string | null
          web_access: boolean | null
        }
        Insert: {
          app_access?: boolean | null
          approval_levels?: number | null
          avatar_url?: string | null
          current_address?: string | null
          date_of_birth?: string | null
          date_of_joining?: string | null
          department?: number | null
          device_id?: string | null
          device_info?: Json | null
          email?: string | null
          emergency_contacts?: Json | null
          employee_code?: string | null
          employment_type?: string | null
          face_embedding?: number[] | null
          face_enrolled_at?: string | null
          face_enrollment_photo?: string | null
          face_match_threshold?: number | null
          face_recognition?: boolean | null
          full_name?: string | null
          gender?: string | null
          geofencing?: boolean | null
          id: string
          is_active?: boolean | null
          marital_status?: string | null
          new_device_id?: string | null
          new_device_info?: Json | null
          ov_password?: string | null
          ov_username?: string | null
          permanent_address?: string | null
          phone?: string | null
          position?: number | null
          updated_at?: string | null
          web_access?: boolean | null
        }
        Update: {
          app_access?: boolean | null
          approval_levels?: number | null
          avatar_url?: string | null
          current_address?: string | null
          date_of_birth?: string | null
          date_of_joining?: string | null
          department?: number | null
          device_id?: string | null
          device_info?: Json | null
          email?: string | null
          emergency_contacts?: Json | null
          employee_code?: string | null
          employment_type?: string | null
          face_embedding?: number[] | null
          face_enrolled_at?: string | null
          face_enrollment_photo?: string | null
          face_match_threshold?: number | null
          face_recognition?: boolean | null
          full_name?: string | null
          gender?: string | null
          geofencing?: boolean | null
          id?: string
          is_active?: boolean | null
          marital_status?: string | null
          new_device_id?: string | null
          new_device_info?: Json | null
          ov_password?: string | null
          ov_username?: string | null
          permanent_address?: string | null
          phone?: string | null
          position?: number | null
          updated_at?: string | null
          web_access?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_fkey"
            columns: ["department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_fkey"
            columns: ["position"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          acceptance_remarks: string | null
          accepted_at: string | null
          accepted_by_name: string | null
          advance_payment_months: number | null
          advance_payment_required: boolean | null
          approved_at: string | null
          approved_by: string | null
          attachments: Json | null
          bandwidth: string
          billing_cycle: string | null
          business_approval_id: number | null
          cgst_amount: number | null
          cgst_percentage: number | null
          company_name: string | null
          connection_type: string
          contract_period_months: number | null
          converted_at: string | null
          converted_to_order: boolean | null
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          discount_amount: number | null
          discount_percentage: number | null
          discount_remarks: string | null
          equipment_charges: number | null
          exclusions: string[] | null
          feasibility_id: number | null
          gstin: string | null
          id: number
          igst_amount: number | null
          igst_percentage: number | null
          inclusions: string[] | null
          installation_charges: number | null
          is_final_quote: boolean | null
          lead_id: number
          monthly_rental: number
          onetime_subtotal: number | null
          onetime_total_with_tax: number
          ont_charges: number | null
          order_id: number | null
          other_charges: number | null
          other_charges_description: string | null
          parent_quotation_id: number | null
          payment_terms: string | null
          pdf_url: string | null
          plan_name: string
          prepared_by: string
          quotation_date: string | null
          quotation_number: string
          rejected_at: string | null
          rejection_reason: string | null
          rejection_remarks: string | null
          remarks: string | null
          resolution_time: string | null
          response_time: string | null
          revision_number: number | null
          router_charges: number | null
          security_deposit: number | null
          sent_at: string | null
          sent_by: string | null
          sent_to_email: string | null
          service_type: string | null
          sgst_amount: number | null
          sgst_percentage: number | null
          special_notes: string | null
          static_ip_charges: number | null
          status: string
          support_type: string | null
          taxable_amount: number
          terms_and_conditions: string | null
          total_contract_value: number | null
          total_payable_now: number
          updated_at: string
          uptime_guarantee: string | null
          valid_until: string | null
          viewed_at: string | null
          viewed_count: number | null
        }
        Insert: {
          acceptance_remarks?: string | null
          accepted_at?: string | null
          accepted_by_name?: string | null
          advance_payment_months?: number | null
          advance_payment_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          bandwidth: string
          billing_cycle?: string | null
          business_approval_id?: number | null
          cgst_amount?: number | null
          cgst_percentage?: number | null
          company_name?: string | null
          connection_type: string
          contract_period_months?: number | null
          converted_at?: string | null
          converted_to_order?: boolean | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          discount_remarks?: string | null
          equipment_charges?: number | null
          exclusions?: string[] | null
          feasibility_id?: number | null
          gstin?: string | null
          id?: never
          igst_amount?: number | null
          igst_percentage?: number | null
          inclusions?: string[] | null
          installation_charges?: number | null
          is_final_quote?: boolean | null
          lead_id: number
          monthly_rental: number
          onetime_subtotal?: number | null
          onetime_total_with_tax: number
          ont_charges?: number | null
          order_id?: number | null
          other_charges?: number | null
          other_charges_description?: string | null
          parent_quotation_id?: number | null
          payment_terms?: string | null
          pdf_url?: string | null
          plan_name: string
          prepared_by: string
          quotation_date?: string | null
          quotation_number: string
          rejected_at?: string | null
          rejection_reason?: string | null
          rejection_remarks?: string | null
          remarks?: string | null
          resolution_time?: string | null
          response_time?: string | null
          revision_number?: number | null
          router_charges?: number | null
          security_deposit?: number | null
          sent_at?: string | null
          sent_by?: string | null
          sent_to_email?: string | null
          service_type?: string | null
          sgst_amount?: number | null
          sgst_percentage?: number | null
          special_notes?: string | null
          static_ip_charges?: number | null
          status?: string
          support_type?: string | null
          taxable_amount: number
          terms_and_conditions?: string | null
          total_contract_value?: number | null
          total_payable_now: number
          updated_at?: string
          uptime_guarantee?: string | null
          valid_until?: string | null
          viewed_at?: string | null
          viewed_count?: number | null
        }
        Update: {
          acceptance_remarks?: string | null
          accepted_at?: string | null
          accepted_by_name?: string | null
          advance_payment_months?: number | null
          advance_payment_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          bandwidth?: string
          billing_cycle?: string | null
          business_approval_id?: number | null
          cgst_amount?: number | null
          cgst_percentage?: number | null
          company_name?: string | null
          connection_type?: string
          contract_period_months?: number | null
          converted_at?: string | null
          converted_to_order?: boolean | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          discount_remarks?: string | null
          equipment_charges?: number | null
          exclusions?: string[] | null
          feasibility_id?: number | null
          gstin?: string | null
          id?: never
          igst_amount?: number | null
          igst_percentage?: number | null
          inclusions?: string[] | null
          installation_charges?: number | null
          is_final_quote?: boolean | null
          lead_id?: number
          monthly_rental?: number
          onetime_subtotal?: number | null
          onetime_total_with_tax?: number
          ont_charges?: number | null
          order_id?: number | null
          other_charges?: number | null
          other_charges_description?: string | null
          parent_quotation_id?: number | null
          payment_terms?: string | null
          pdf_url?: string | null
          plan_name?: string
          prepared_by?: string
          quotation_date?: string | null
          quotation_number?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          rejection_remarks?: string | null
          remarks?: string | null
          resolution_time?: string | null
          response_time?: string | null
          revision_number?: number | null
          router_charges?: number | null
          security_deposit?: number | null
          sent_at?: string | null
          sent_by?: string | null
          sent_to_email?: string | null
          service_type?: string | null
          sgst_amount?: number | null
          sgst_percentage?: number | null
          special_notes?: string | null
          static_ip_charges?: number | null
          status?: string
          support_type?: string | null
          taxable_amount?: number
          terms_and_conditions?: string | null
          total_contract_value?: number | null
          total_payable_now?: number
          updated_at?: string
          uptime_guarantee?: string | null
          valid_until?: string | null
          viewed_at?: string | null
          viewed_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_business_approval_id_fkey"
            columns: ["business_approval_id"]
            isOneToOne: false
            referencedRelation: "business_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_parent_quotation_id_fkey"
            columns: ["parent_quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          created_at: string
          id: number
          new_data: Json
          old_data: Json | null
          priority: string
          rejection_reason: string | null
          request_type: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          user_note: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          new_data?: Json
          old_data?: Json | null
          priority?: string
          rejection_reason?: string | null
          request_type: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_note?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          new_data?: Json
          old_data?: Json | null
          priority?: string
          rejection_reason?: string | null
          request_type?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          account_number: string | null
          activated_by: string | null
          activation_date: string | null
          activation_status: string | null
          admin_assigned_at: string | null
          admin_assigned_to: string | null
          admin_department_id: number | null
          advance_amount: number | null
          advance_payment_date: string | null
          advance_payment_mode: string | null
          advance_payment_received_by: string | null
          advance_payment_reference: string | null
          advance_payment_required: boolean | null
          advance_payment_status: string | null
          agreement_document_url: string | null
          agreement_number: string | null
          agreement_prepared_date: string | null
          agreement_sent_date: string | null
          agreement_signed_date: string | null
          agreement_status: string | null
          agreement_type: string | null
          bandwidth: string
          billing_address: string | null
          billing_city: string | null
          billing_cycle: string | null
          billing_pincode: string | null
          billing_state: string | null
          billing_system_id: string | null
          billing_system_status: string | null
          business_approval_id: number | null
          cancellation_approved: boolean | null
          cancellation_approved_by: string | null
          cancellation_approved_date: string | null
          cancellation_effective_date: string | null
          cancellation_reason: string | null
          cancellation_requested: boolean | null
          cancellation_requested_by: string | null
          cancellation_requested_date: string | null
          company_name: string | null
          connection_id: string | null
          connection_type: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string
          contract_end_date: string | null
          contract_period_months: number | null
          contract_start_date: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_special_requirements: string | null
          customer_type: string
          documentation_status: string | null
          documents_received: Json | null
          documents_required: string[] | null
          documents_verified: boolean | null
          equipment_charges: number | null
          equipment_installed: string[] | null
          feasibility_id: number | null
          fiber_length_used: number | null
          field_engineer_id: string | null
          first_invoice_date: string | null
          first_invoice_generated: boolean | null
          first_invoice_number: string | null
          gstin: string | null
          id: number
          installation_address: string
          installation_charges: number | null
          installation_city: string
          installation_completed_date: string | null
          installation_latitude: number | null
          installation_longitude: number | null
          installation_photos: Json | null
          installation_pincode: string
          installation_priority: string | null
          installation_remarks: string | null
          installation_scheduled_date: string | null
          installation_state: string
          installation_status: string | null
          installation_supervisor_id: string | null
          installation_team_id: number | null
          installation_time_slot: string | null
          installation_type: string | null
          internal_notes: string | null
          ip_address_assigned: string | null
          ipv6_enabled: boolean | null
          lead_id: number
          mac_address: string | null
          monthly_rental: number
          notes: string | null
          ont_serial_number: string | null
          order_number: string
          other_charges: number | null
          pan: string | null
          payment_required: boolean | null
          payment_terms: string | null
          plan_name: string
          pop_connected: string | null
          port_number: string | null
          quotation_id: number | null
          renewal_reminder_sent: boolean | null
          renewal_status: string | null
          router_serial_number: string | null
          same_as_installation_address: boolean | null
          security_deposit: number | null
          security_deposit_date: string | null
          security_deposit_payment_mode: string | null
          security_deposit_reference: string | null
          security_deposit_required: boolean | null
          security_deposit_status: string | null
          service_end_date: string | null
          service_start_date: string | null
          service_type: string
          signatory_designation: string | null
          signatory_name: string | null
          sla_resolution_time_hours: number | null
          sla_response_time_hours: number | null
          sla_uptime_percentage: number | null
          static_ip_count: number | null
          status: string
          status_updated_at: string | null
          total_order_value: number
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          vlan_id: string | null
        }
        Insert: {
          account_number?: string | null
          activated_by?: string | null
          activation_date?: string | null
          activation_status?: string | null
          admin_assigned_at?: string | null
          admin_assigned_to?: string | null
          admin_department_id?: number | null
          advance_amount?: number | null
          advance_payment_date?: string | null
          advance_payment_mode?: string | null
          advance_payment_received_by?: string | null
          advance_payment_reference?: string | null
          advance_payment_required?: boolean | null
          advance_payment_status?: string | null
          agreement_document_url?: string | null
          agreement_number?: string | null
          agreement_prepared_date?: string | null
          agreement_sent_date?: string | null
          agreement_signed_date?: string | null
          agreement_status?: string | null
          agreement_type?: string | null
          bandwidth: string
          billing_address?: string | null
          billing_city?: string | null
          billing_cycle?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          billing_system_id?: string | null
          billing_system_status?: string | null
          business_approval_id?: number | null
          cancellation_approved?: boolean | null
          cancellation_approved_by?: string | null
          cancellation_approved_date?: string | null
          cancellation_effective_date?: string | null
          cancellation_reason?: string | null
          cancellation_requested?: boolean | null
          cancellation_requested_by?: string | null
          cancellation_requested_date?: string | null
          company_name?: string | null
          connection_id?: string | null
          connection_type: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone: string
          contract_end_date?: string | null
          contract_period_months?: number | null
          contract_start_date?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_special_requirements?: string | null
          customer_type: string
          documentation_status?: string | null
          documents_received?: Json | null
          documents_required?: string[] | null
          documents_verified?: boolean | null
          equipment_charges?: number | null
          equipment_installed?: string[] | null
          feasibility_id?: number | null
          fiber_length_used?: number | null
          field_engineer_id?: string | null
          first_invoice_date?: string | null
          first_invoice_generated?: boolean | null
          first_invoice_number?: string | null
          gstin?: string | null
          id?: never
          installation_address: string
          installation_charges?: number | null
          installation_city: string
          installation_completed_date?: string | null
          installation_latitude?: number | null
          installation_longitude?: number | null
          installation_photos?: Json | null
          installation_pincode: string
          installation_priority?: string | null
          installation_remarks?: string | null
          installation_scheduled_date?: string | null
          installation_state: string
          installation_status?: string | null
          installation_supervisor_id?: string | null
          installation_team_id?: number | null
          installation_time_slot?: string | null
          installation_type?: string | null
          internal_notes?: string | null
          ip_address_assigned?: string | null
          ipv6_enabled?: boolean | null
          lead_id: number
          mac_address?: string | null
          monthly_rental: number
          notes?: string | null
          ont_serial_number?: string | null
          order_number: string
          other_charges?: number | null
          pan?: string | null
          payment_required?: boolean | null
          payment_terms?: string | null
          plan_name: string
          pop_connected?: string | null
          port_number?: string | null
          quotation_id?: number | null
          renewal_reminder_sent?: boolean | null
          renewal_status?: string | null
          router_serial_number?: string | null
          same_as_installation_address?: boolean | null
          security_deposit?: number | null
          security_deposit_date?: string | null
          security_deposit_payment_mode?: string | null
          security_deposit_reference?: string | null
          security_deposit_required?: boolean | null
          security_deposit_status?: string | null
          service_end_date?: string | null
          service_start_date?: string | null
          service_type: string
          signatory_designation?: string | null
          signatory_name?: string | null
          sla_resolution_time_hours?: number | null
          sla_response_time_hours?: number | null
          sla_uptime_percentage?: number | null
          static_ip_count?: number | null
          status?: string
          status_updated_at?: string | null
          total_order_value: number
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          vlan_id?: string | null
        }
        Update: {
          account_number?: string | null
          activated_by?: string | null
          activation_date?: string | null
          activation_status?: string | null
          admin_assigned_at?: string | null
          admin_assigned_to?: string | null
          admin_department_id?: number | null
          advance_amount?: number | null
          advance_payment_date?: string | null
          advance_payment_mode?: string | null
          advance_payment_received_by?: string | null
          advance_payment_reference?: string | null
          advance_payment_required?: boolean | null
          advance_payment_status?: string | null
          agreement_document_url?: string | null
          agreement_number?: string | null
          agreement_prepared_date?: string | null
          agreement_sent_date?: string | null
          agreement_signed_date?: string | null
          agreement_status?: string | null
          agreement_type?: string | null
          bandwidth?: string
          billing_address?: string | null
          billing_city?: string | null
          billing_cycle?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          billing_system_id?: string | null
          billing_system_status?: string | null
          business_approval_id?: number | null
          cancellation_approved?: boolean | null
          cancellation_approved_by?: string | null
          cancellation_approved_date?: string | null
          cancellation_effective_date?: string | null
          cancellation_reason?: string | null
          cancellation_requested?: boolean | null
          cancellation_requested_by?: string | null
          cancellation_requested_date?: string | null
          company_name?: string | null
          connection_id?: string | null
          connection_type?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string
          contract_end_date?: string | null
          contract_period_months?: number | null
          contract_start_date?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_special_requirements?: string | null
          customer_type?: string
          documentation_status?: string | null
          documents_received?: Json | null
          documents_required?: string[] | null
          documents_verified?: boolean | null
          equipment_charges?: number | null
          equipment_installed?: string[] | null
          feasibility_id?: number | null
          fiber_length_used?: number | null
          field_engineer_id?: string | null
          first_invoice_date?: string | null
          first_invoice_generated?: boolean | null
          first_invoice_number?: string | null
          gstin?: string | null
          id?: never
          installation_address?: string
          installation_charges?: number | null
          installation_city?: string
          installation_completed_date?: string | null
          installation_latitude?: number | null
          installation_longitude?: number | null
          installation_photos?: Json | null
          installation_pincode?: string
          installation_priority?: string | null
          installation_remarks?: string | null
          installation_scheduled_date?: string | null
          installation_state?: string
          installation_status?: string | null
          installation_supervisor_id?: string | null
          installation_team_id?: number | null
          installation_time_slot?: string | null
          installation_type?: string | null
          internal_notes?: string | null
          ip_address_assigned?: string | null
          ipv6_enabled?: boolean | null
          lead_id?: number
          mac_address?: string | null
          monthly_rental?: number
          notes?: string | null
          ont_serial_number?: string | null
          order_number?: string
          other_charges?: number | null
          pan?: string | null
          payment_required?: boolean | null
          payment_terms?: string | null
          plan_name?: string
          pop_connected?: string | null
          port_number?: string | null
          quotation_id?: number | null
          renewal_reminder_sent?: boolean | null
          renewal_status?: string | null
          router_serial_number?: string | null
          same_as_installation_address?: boolean | null
          security_deposit?: number | null
          security_deposit_date?: string | null
          security_deposit_payment_mode?: string | null
          security_deposit_reference?: string | null
          security_deposit_required?: boolean | null
          security_deposit_status?: string | null
          service_end_date?: string | null
          service_start_date?: string | null
          service_type?: string
          signatory_designation?: string | null
          signatory_name?: string | null
          sla_resolution_time_hours?: number | null
          sla_response_time_hours?: number | null
          sla_uptime_percentage?: number | null
          static_ip_count?: number | null
          status?: string
          status_updated_at?: string | null
          total_order_value?: number
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          vlan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_admin_assigned_to_fkey"
            columns: ["admin_assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_admin_department_id_fkey"
            columns: ["admin_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_advance_payment_received_by_fkey"
            columns: ["advance_payment_received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_business_approval_id_fkey"
            columns: ["business_approval_id"]
            isOneToOne: false
            referencedRelation: "business_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_cancellation_approved_by_fkey"
            columns: ["cancellation_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_cancellation_requested_by_fkey"
            columns: ["cancellation_requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_field_engineer_id_fkey"
            columns: ["field_engineer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_installation_supervisor_id_fkey"
            columns: ["installation_supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_installation_team_id_fkey"
            columns: ["installation_team_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spanco_leads: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          commercial_details: Json | null
          created_at: string
          current_stage: string
          customer_info: Json
          expected_closure_date: string | null
          id: number
          lead_number: string
          lead_tracking: Json | null
          notes: Json | null
          outcome_details: Json | null
          priority: string
          sales_team_id: number | null
          service_location: Json
          service_requirements: Json
          stage_updated_at: string
          status: string
          timeline: Json | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          commercial_details?: Json | null
          created_at?: string
          current_stage?: string
          customer_info: Json
          expected_closure_date?: string | null
          id?: never
          lead_number: string
          lead_tracking?: Json | null
          notes?: Json | null
          outcome_details?: Json | null
          priority?: string
          sales_team_id?: number | null
          service_location: Json
          service_requirements: Json
          stage_updated_at?: string
          status?: string
          timeline?: Json | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          commercial_details?: Json | null
          created_at?: string
          current_stage?: string
          customer_info?: Json
          expected_closure_date?: string | null
          id?: never
          lead_number?: string
          lead_tracking?: Json | null
          notes?: Json | null
          outcome_details?: Json | null
          priority?: string
          sales_team_id?: number | null
          service_location?: Json
          service_requirements?: Json
          stage_updated_at?: string
          status?: string
          timeline?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spanco_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spanco_leads_sales_team_id_fkey"
            columns: ["sales_team_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      spanco_stage_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string
          days_in_previous_stage: number | null
          from_stage: string | null
          id: number
          lead_id: number
          remarks: string | null
          to_stage: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by: string
          days_in_previous_stage?: number | null
          from_stage?: string | null
          id?: never
          lead_id: number
          remarks?: string | null
          to_stage: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string
          days_in_previous_stage?: number | null
          from_stage?: string | null
          id?: never
          lead_id?: number
          remarks?: string | null
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "spanco_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spanco_stage_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "spanco_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spanco_stage_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "spanco_stage_analytics"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      user_app_config: {
        Row: {
          app_url: string | null
          faq: Json | null
          force_update: boolean | null
          id: number
          image_links: string | null
          is_face_recognition_enabled: boolean | null
          is_feasibility_enabled: boolean
          is_spanco_enabled: boolean
          max_force_note: string | null
          max_version: number
          min_version: number
          office_location: string | null
          platform: string
        }
        Insert: {
          app_url?: string | null
          faq?: Json | null
          force_update?: boolean | null
          id?: number
          image_links?: string | null
          is_face_recognition_enabled?: boolean | null
          is_feasibility_enabled?: boolean
          is_spanco_enabled?: boolean
          max_force_note?: string | null
          max_version: number
          min_version: number
          office_location?: string | null
          platform: string
        }
        Update: {
          app_url?: string | null
          faq?: Json | null
          force_update?: boolean | null
          id?: number
          image_links?: string | null
          is_face_recognition_enabled?: boolean | null
          is_feasibility_enabled?: boolean
          is_spanco_enabled?: boolean
          max_force_note?: string | null
          max_version?: number
          min_version?: number
          office_location?: string | null
          platform?: string
        }
        Relationships: []
      }
      work_schedules: {
        Row: {
          created_at: string
          employee_id: string
          end_time: string | null
          home_location: string | null
          home_radius: number | null
          id: number
          max_work_hours: number | null
          min_work_hours: number | null
          office_location: string | null
          office_radius: number | null
          punch_in_grace: number | null
          schedule_type: string | null
          shift_pattern: string | null
          start_time: string | null
          updated_at: string | null
          weekdays: string[] | null
          wfm_allowed: boolean | null
          work_location_names: string | null
          work_location_radius: number | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_time?: string | null
          home_location?: string | null
          home_radius?: number | null
          id?: number
          max_work_hours?: number | null
          min_work_hours?: number | null
          office_location?: string | null
          office_radius?: number | null
          punch_in_grace?: number | null
          schedule_type?: string | null
          shift_pattern?: string | null
          start_time?: string | null
          updated_at?: string | null
          weekdays?: string[] | null
          wfm_allowed?: boolean | null
          work_location_names?: string | null
          work_location_radius?: number | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_time?: string | null
          home_location?: string | null
          home_radius?: number | null
          id?: number
          max_work_hours?: number | null
          min_work_hours?: number | null
          office_location?: string | null
          office_radius?: number | null
          punch_in_grace?: number | null
          schedule_type?: string | null
          shift_pattern?: string | null
          start_time?: string | null
          updated_at?: string | null
          weekdays?: string[] | null
          wfm_allowed?: boolean | null
          work_location_names?: string | null
          work_location_radius?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_customers_dashboard: {
        Row: {
          account_manager_name: string | null
          average_uptime_percentage: number | null
          bandwidth: string | null
          contact_email: string | null
          contact_phone: string | null
          customer_id: string | null
          customer_name: string | null
          days_to_renewal: number | null
          id: number | null
          monthly_rental: number | null
          next_renewal_date: string | null
          outstanding_balance: number | null
          payment_risk_level: string | null
          plan_name: string | null
          renewal_due_soon: boolean | null
          sales_rep_name: string | null
          service_city: string | null
          service_start_date: string | null
          status: string | null
          total_complaints: number | null
        }
        Relationships: []
      }
      customers_due_for_renewal: {
        Row: {
          account_manager_name: string | null
          account_manager_phone: string | null
          contact_email: string | null
          contact_phone: string | null
          contract_period_months: number | null
          customer_id: string | null
          customer_name: string | null
          days_remaining: number | null
          id: number | null
          monthly_rental: number | null
          next_renewal_date: string | null
          plan_name: string | null
          renewal_urgency: string | null
          service_city: string | null
          total_revenue_generated: number | null
        }
        Relationships: []
      }
      high_value_customers: {
        Row: {
          account_manager_name: string | null
          average_monthly_revenue: number | null
          contact_phone: string | null
          customer_category: string | null
          customer_id: string | null
          customer_name: string | null
          id: number | null
          lifetime_value: number | null
          monthly_rental: number | null
          months_as_customer: number | null
          payment_history_score: number | null
          plan_name: string | null
          service_city: string | null
          total_revenue_generated: number | null
        }
        Relationships: []
      }
      installation_schedule: {
        Row: {
          bandwidth: string | null
          connection_type: string | null
          contact_phone: string | null
          customer_name: string | null
          customer_special_requirements: string | null
          engineer_phone: string | null
          field_engineer_name: string | null
          id: number | null
          installation_address: string | null
          installation_city: string | null
          installation_priority: string | null
          installation_scheduled_date: string | null
          installation_team_name: string | null
          installation_time_slot: string | null
          installation_type: string | null
          order_number: string | null
          plan_name: string | null
          schedule_status: string | null
          supervisor_name: string | null
        }
        Relationships: []
      }
      my_assigned_orders: {
        Row: {
          contact_phone: string | null
          customer_name: string | null
          id: number | null
          installation_city: string | null
          installation_priority: string | null
          installation_scheduled_date: string | null
          my_role: string | null
          order_number: string | null
          plan_name: string | null
          status: string | null
        }
        Insert: {
          contact_phone?: string | null
          customer_name?: string | null
          id?: number | null
          installation_city?: string | null
          installation_priority?: string | null
          installation_scheduled_date?: string | null
          my_role?: never
          order_number?: string | null
          plan_name?: string | null
          status?: string | null
        }
        Update: {
          contact_phone?: string | null
          customer_name?: string | null
          id?: number | null
          installation_city?: string | null
          installation_priority?: string | null
          installation_scheduled_date?: string | null
          my_role?: never
          order_number?: string | null
          plan_name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      my_managed_customers: {
        Row: {
          attention_priority: string | null
          contact_phone: string | null
          customer_id: string | null
          customer_name: string | null
          days_to_renewal: number | null
          id: number | null
          last_complaint_date: string | null
          next_renewal_date: string | null
          outstanding_balance: number | null
          plan_name: string | null
          service_city: string | null
          status: string | null
          total_complaints: number | null
        }
        Insert: {
          attention_priority?: never
          contact_phone?: string | null
          customer_id?: string | null
          customer_name?: string | null
          days_to_renewal?: never
          id?: number | null
          last_complaint_date?: string | null
          next_renewal_date?: string | null
          outstanding_balance?: number | null
          plan_name?: string | null
          service_city?: string | null
          status?: string | null
          total_complaints?: number | null
        }
        Update: {
          attention_priority?: never
          contact_phone?: string | null
          customer_id?: string | null
          customer_name?: string | null
          days_to_renewal?: never
          id?: number | null
          last_complaint_date?: string | null
          next_renewal_date?: string | null
          outstanding_balance?: number | null
          plan_name?: string | null
          service_city?: string | null
          status?: string | null
          total_complaints?: number | null
        }
        Relationships: []
      }
      my_pending_checklist_items: {
        Row: {
          assigned_at: string | null
          blocked_by: string | null
          category: string | null
          contact_phone: string | null
          customer_name: string | null
          dependency_status: string | null
          due_at: string | null
          hours_pending: number | null
          hours_remaining: number | null
          id: number | null
          is_mandatory: boolean | null
          is_overdue: boolean | null
          item_description: string | null
          item_name: string | null
          order_id: number | null
          order_number: string | null
          sequence_order: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_processing_checklist_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "installation_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_processing_checklist_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "my_assigned_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_processing_checklist_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_checklist_progress: {
        Row: {
          all_mandatory_completed: boolean | null
          blocked_items: number | null
          completed_items: number | null
          created_at: string | null
          customer_name: string | null
          in_progress_items: number | null
          mandatory_completed: number | null
          mandatory_items: number | null
          mandatory_progress_percentage: number | null
          order_id: number | null
          order_number: string | null
          order_status: string | null
          overall_progress_percentage: number | null
          overdue_items: number | null
          total_items: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_processing_checklist_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "installation_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_processing_checklist_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "my_assigned_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_processing_checklist_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      spanco_stage_analytics: {
        Row: {
          assigned_to: string | null
          avg_days_per_stage: number | null
          current_stage: string | null
          customer_name: string | null
          customer_phone: string | null
          days_in_current_stage: number | null
          estimated_value: number | null
          first_stage_change: string | null
          last_stage_change: string | null
          lead_age_days: number | null
          lead_id: number | null
          lead_number: string | null
          priority: string | null
          proposed_monthly_rental: number | null
          service_city: string | null
          status: string | null
          total_stage_changes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spanco_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _handle_approval_action: {
        Args: {
          action: string
          attendance_id_param: number
          comments: string
          current_level: number
          manager_id: string
          regularization_id: number
        }
        Returns: {
          attendance_id: number
          message: string
          new_record: boolean
          status_code: number
        }[]
      }
      access_admin_panel: { Args: Record<PropertyKey, never>; Returns: boolean }
      all_leads_edit_access: { Args: never; Returns: boolean }
      approve_document_request:
        | {
            Args: {
              p_permanent_path: string
              p_request_id: number
              p_reviewer_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_permanent_path: string
              p_permanent_path_back?: string
              p_request_id: number
              p_reviewer_id: string
            }
            Returns: undefined
          }
      approve_profile_update_request: {
        Args: { p_request_id: number; p_reviewer_id: string }
        Returns: undefined
      }
      cancel_attendance_regularization: {
        Args: { regularization_id: number }
        Returns: {
          message: string
          status_code: number
        }[]
      }
      cancel_leave_application: {
        Args: { leave_application_id: number }
        Returns: {
          message: string
          status_code: number
        }[]
      }
      check_leave_overlap: {
        Args: {
          p_employee_id: string
          p_end_date: string
          p_start_date: string
        }
        Returns: boolean
      }
      create_or_reuse_feasibility_request: {
        Args: {
          p_lead_id: number
          p_requested_by: string
          p_requesting_department: number
          p_service_location: Json
          p_service_requirements: Json
        }
        Returns: {
          request_id: number
          request_number: string
          was_reused: boolean
        }[]
      }
      get_attendance_details: {
        Args: { attendance_date: string }
        Returns: {
          Date: string
          Department: string
          Name: string
          "Punch In": string
          "Punch In Location": string
          "Punch Out": string
          "Punch Out Location": string
          Status: string
        }[]
      }
      get_department_subtree: {
        Args: { root_id: number }
        Returns: {
          annual_budget: number | null
          code: string
          cost_center: string
          created_at: string
          created_by: string | null
          department_type: string
          description: string | null
          effective_from: string
          effective_until: string | null
          id: number
          is_active: boolean
          level: number
          manager_id: string | null
          max_headcount: number | null
          name: string
          parent_id: number | null
          path: string | null
          service_area: string | null
          shift_type: string | null
          updated_at: string
          updated_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "departments"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_lead_stage_journey: {
        Args: { p_lead_id: number }
        Returns: {
          changed_by_name: string
          duration_days: number
          entered_at: string
          stage_name: string
          stage_number: number
        }[]
      }
      get_supabase_time: { Args: never; Returns: string }
      handle_leave_approval:
        | {
            Args: {
              action: string
              comments: string
              current_level: number
              leave_application_id: number
              manager_id: string
            }
            Returns: {
              message: string
              status_code: number
            }[]
          }
        | {
            Args: {
              action: string
              current_level: number
              leave_application_id: number
              manager_id: string
            }
            Returns: {
              message: string
              status_code: number
            }[]
          }
      is_manager_of_administration: { Args: never; Returns: boolean }
      is_manager_of_feasibility: { Args: never; Returns: boolean }
      is_manager_of_specific_departments: { Args: never; Returns: boolean }
      manager_of_feasibility_departments: { Args: never; Returns: boolean }
      manager_of_spanco_departments: { Args: never; Returns: boolean }
      mark_daily_attendance: { Args: never; Returns: undefined }
      member_of_spanco_departments: { Args: never; Returns: boolean }
      reject_document_request: {
        Args: {
          p_rejection_reason: string
          p_request_id: number
          p_reviewer_id: string
        }
        Returns: undefined
      }
      submit_leave_application: {
        Args: {
          p_applied_by: string
          p_approval_levels?: number
          p_calendar_year?: number
          p_current_time?: string
          p_employee_id: string
          p_end_date: string
          p_leave_type_id: number
          p_reason: string
          p_start_date: string
          p_total_days: number
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
