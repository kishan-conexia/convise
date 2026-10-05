-- ====================================================
-- Unified Schema for New Supabase Instance (Abbioscience)
-- Excludes seed data dump
-- ====================================================


-- >>>>>>>>>>>>>> File: 20260924120016_remote_schema.sql <<<<<<<<<<<<<<

SET check_function_bodies = false;
DROP EXTENSION IF EXISTS pg_net;
DROP EXTENSION IF EXISTS pg_graphql;
DO $$
BEGIN
    CREATE ROLE supabase_privileged_role;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;
DO $$
BEGIN
    GRANT supabase_privileged_role TO postgres;
EXCEPTION
    WHEN OTHERS THEN NULL;
END
$$;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;
CREATE SEQUENCE IF NOT EXISTS public.profile_details_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.requests_id_seq;
CREATE FUNCTION public._handle_approval_action(regularization_id bigint, manager_id uuid, action text, comments text, current_level integer, attendance_id_param bigint)
 RETURNS TABLE(status_code integer, message text, attendance_id bigint, new_record boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    reg_record public.attendance_regularizations%ROWTYPE;
    attendance_date date;
    target_attendance_id bigint;
    new_attendance_id bigint;
    approval_adjusted boolean := false;
    new_attendance_created boolean := false;
    result_message text;
    result_status integer;
BEGIN
    -- Acquire advisory lock to prevent concurrent processing
    PERFORM pg_advisory_xact_lock(regularization_id);
    
    -- Lock and retrieve the regularization record
    SELECT * INTO reg_record
    FROM public.attendance_regularizations
    WHERE id = regularization_id
    FOR UPDATE;
    
    -- Check for terminal state
    IF reg_record.status IN ('rejected', 'cancelled', 'approved') THEN
        RETURN QUERY SELECT 
            409 AS status_code, 
            'Request already processed: ' || reg_record.status AS message,
            NULL::bigint,
            false;
        RETURN;
    END IF;
    
    -- Handle approval level adjustment if current level is higher
    IF current_level > reg_record.approval_levels THEN
        UPDATE public.attendance_regularizations
        SET approval_levels = current_level
        WHERE id = regularization_id;
        approval_adjusted := true;
    END IF;
    
    -- Update approval fields for current level
    EXECUTE format(
        'UPDATE public.attendance_regularizations
         SET 
             level_%s_approver_id = $1,
             level_%s_status = $2,
             level_%s_action_at = NOW(),
             level_%s_comments = $3,
             updated_at = NOW()
         WHERE id = $4',
        current_level, current_level, current_level, current_level
    )
    USING manager_id, action, comments, regularization_id;
    
    -- Handle lower levels (set to 'bypassed' if pending)
    FOR i IN 1..(current_level - 1) LOOP
        IF reg_record.level_1_status IS NULL OR reg_record.level_1_status = 'pending' THEN
            EXECUTE format(
                'UPDATE public.attendance_regularizations
                 SET level_%s_status = ''bypassed''
                 WHERE id = $1',
                i
            ) USING regularization_id;
        END IF;
    END LOOP;
    
    -- Handle final approval
    IF action = 'approved' AND current_level >= (
        SELECT approval_levels 
        FROM public.attendance_regularizations 
        WHERE id = regularization_id
    ) THEN
        -- Update status to approved
        UPDATE public.attendance_regularizations
        SET 
            status = 'approved',
            final_approved_at = NOW()
        WHERE id = regularization_id;
        
        -- Initialize attendance handling
        target_attendance_id := NULL;
        new_attendance_created := false;
        
        -- STEP 1: Try to use provided attendance ID if exists
        IF attendance_id_param IS NOT NULL THEN
            PERFORM 1
            FROM public.attendance
            WHERE id = attendance_id_param;
            
            IF FOUND THEN
                target_attendance_id := attendance_id_param;
                UPDATE public.attendance
                SET 
                    status = 'present',
                    is_regularized = true,
                    remarks = COALESCE(remarks, '') || ' | Regularized: ' || reg_record.reason
                WHERE id = target_attendance_id;
            END IF;
        END IF;
        
        -- STEP 2: Try to find by requested_punch_in date if not found
        IF target_attendance_id IS NULL AND reg_record.requested_punch_in IS NOT NULL THEN
            attendance_date := reg_record.requested_punch_in::date;
            
            SELECT id INTO target_attendance_id
            FROM public.attendance
            WHERE employee_id = reg_record.employee_id
              AND date = attendance_date
            LIMIT 1;  -- Take first match
            
            IF target_attendance_id IS NOT NULL THEN
                UPDATE public.attendance
                SET 
                    status = 'present',
                    is_regularized = true,
                    remarks = COALESCE(remarks, '') || ' | Regularized: ' || reg_record.reason
                WHERE id = target_attendance_id;
            END IF;
        END IF;
        
        -- STEP 3: Create new attendance record if still not found
        IF target_attendance_id IS NULL THEN
            attendance_date := CASE
                WHEN reg_record.requested_punch_in IS NOT NULL THEN reg_record.requested_punch_in::date
                ELSE reg_record.created_at::date
            END;
            
            INSERT INTO public.attendance (
                employee_id, 
                date, 
                status, 
                is_regularized,
                attendance_type,
                remarks
            )
            VALUES (
                reg_record.employee_id,
                attendance_date,
                'present',
                true,
                'system_regularized',
                'Created via regularization approval: ' || reg_record.reason
            )
            RETURNING id INTO target_attendance_id;
            
            new_attendance_created := true;
        END IF;
        
        -- Set success message
        result_message := 'Approved successfully. ';
        result_message := result_message || CASE
            WHEN new_attendance_created THEN 'Created new attendance record'
            ELSE 'Updated existing attendance record'
        END;
        
        IF approval_adjusted THEN
            result_message := result_message || ' | Approval levels adjusted';
        END IF;
        
        RETURN QUERY SELECT 
            200 AS status_code,
            result_message AS message,
            target_attendance_id,
            new_attendance_created;
        
    ELSIF action = 'rejected' THEN
        -- Update status to rejected
        UPDATE public.attendance_regularizations
        SET status = 'rejected'
        WHERE id = regularization_id;
        
        result_message := 'Request rejected';
        IF approval_adjusted THEN
            result_message := result_message || ' | Approval levels adjusted';
        END IF;
        
        RETURN QUERY SELECT 
            200 AS status_code,
            result_message AS message,
            NULL::bigint,
            false;
    ELSE
        -- Partial approval (not final)
        result_message := 'Action recorded. Waiting for further approvals';
        IF approval_adjusted THEN
            result_message := result_message || ' | Approval levels adjusted';
        END IF;
        
        RETURN QUERY SELECT 
            202 AS status_code,
            result_message AS message,
            NULL::bigint,
            false;
    END IF;
    
    RETURN;
EXCEPTION
    WHEN others THEN
        RETURN QUERY SELECT 
            500 AS status_code, 
            'ERROR: ' || SQLERRM AS message,
            NULL::bigint,
            false;
END;
$function$;
GRANT ALL ON FUNCTION public._handle_approval_action(bigint, uuid, text, text, integer, bigint) TO anon;
GRANT ALL ON FUNCTION public._handle_approval_action(bigint, uuid, text, text, integer, bigint) TO authenticated;
GRANT ALL ON FUNCTION public._handle_approval_action(bigint, uuid, text, text, integer, bigint) TO service_role;
CREATE FUNCTION public.add_feasibility_status_history()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_history_entry JSONB;
  v_event_type TEXT;
  v_note TEXT;
BEGIN
  -- Only track if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Determine event type and note
    CASE NEW.status
      WHEN 'under_review' THEN
        v_event_type := 'status_changed';
        v_note := 'Moved to under review';
      WHEN 'approved' THEN
        v_event_type := 'approved';
        v_note := CASE 
          WHEN NEW.is_feasible THEN 'Request approved - Feasible'
          ELSE 'Request approved with conditions'
        END;
      WHEN 'rejected' THEN
        v_event_type := 'rejected';
        v_note := COALESCE('Reason: ' || NEW.feasibility_remarks, 'Request rejected');
      WHEN 'cancelled' THEN
        v_event_type := 'cancelled';
        v_note := 'Request cancelled';
      ELSE
        v_event_type := 'status_changed';
        v_note := 'Status updated';
    END CASE;
    
    -- Build history entry
    v_history_entry := jsonb_build_object(
      'event', v_event_type,
      'timestamp', NOW(),
      'previous_status', OLD.status,
      'new_status', NEW.status,
      'changed_by', NEW.reviewed_by,
      'note', v_note
    );
    
    -- Add feasibility remarks if rejection
    IF NEW.status = 'rejected' AND NEW.feasibility_remarks IS NOT NULL THEN
      v_history_entry := v_history_entry || jsonb_build_object(
        'rejection_reason', NEW.feasibility_remarks
      );
    END IF;
    
    -- Append to history
    NEW.status_history := COALESCE(OLD.status_history, '[]'::jsonb) || v_history_entry;
  END IF;
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.add_feasibility_status_history() TO anon;
GRANT ALL ON FUNCTION public.add_feasibility_status_history() TO authenticated;
GRANT ALL ON FUNCTION public.add_feasibility_status_history() TO service_role;
CREATE FUNCTION public.all_leads_edit_access()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.departments d
    WHERE d.manager_id = auth.uid()
      AND d.id IN (1, 20)
      AND d.is_active = true
  );
$function$;
GRANT ALL ON FUNCTION public.all_leads_edit_access() TO anon;
GRANT ALL ON FUNCTION public.all_leads_edit_access() TO authenticated;
GRANT ALL ON FUNCTION public.all_leads_edit_access() TO service_role;
CREATE FUNCTION public.approve_document_request(p_request_id bigint, p_reviewer_id uuid, p_permanent_path text, p_permanent_path_back text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_request    requests%ROWTYPE;
  v_doc_type   text;
  v_url_col    text;
  v_number_col text;
  v_number     text;
  v_no_number  text[] := ARRAY['cheque', 'passbook'];
BEGIN
  SELECT * INTO v_request
  FROM requests
  WHERE id = p_request_id
    AND status IN ('pending', 'under_review');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already actioned';
  END IF;

  v_doc_type := v_request.new_data->>'document_type';

  v_url_col := CASE v_doc_type
    WHEN 'cheque'   THEN 'cancelled_cheque_url'
    WHEN 'passbook' THEN 'passbook_url'
    WHEN 'aadhaar'  THEN 'aadhaar_url'
    WHEN 'pan'      THEN 'pan_url'
    WHEN 'passport' THEN 'passport_url'
    ELSE v_doc_type || '_url'
  END;

  -- Ensure profile_details row exists
  INSERT INTO profile_details (user_id)
  VALUES (v_request.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF v_doc_type = 'aadhaar' THEN
    -- ── Aadhaar: number + front URL + back URL ───────────
    UPDATE profile_details
    SET aadhaar_number   = COALESCE(
                             v_request.new_data->>'aadhaar_number',
                             aadhaar_number
                           ),
        aadhaar_url      = p_permanent_path,
        aadhaar_back_url = p_permanent_path_back,
        updated_at       = now()
    WHERE user_id = v_request.user_id;

  ELSIF v_doc_type = ANY(v_no_number) THEN
  -- ── Cheque / Passbook: URL + bank_details jsonb ──────
  EXECUTE format(
    'UPDATE profile_details
     SET %I           = $1,
         bank_details = $2,
         updated_at   = now()
     WHERE user_id = $3',
    v_url_col
  )
  USING
    p_permanent_path,
    jsonb_build_object(
      'account_holder', v_request.new_data->>'account_holder',
      'account_number', v_request.new_data->>'account_number',
      'account_type',   v_request.new_data->>'account_type',
      'ifsc_code',      v_request.new_data->>'ifsc_code',
      'bank_name',      v_request.new_data->>'bank_name',
      'branch_name',    v_request.new_data->>'branch_name'
    ),
    v_request.user_id;

  ELSE
    -- ── PAN / Passport: number + URL ─────────────────────
    v_number_col := v_doc_type || '_number';
    v_number     := v_request.new_data->>v_number_col;

    EXECUTE format(
      'UPDATE profile_details
       SET %I = $1, %I = $2, updated_at = now()
       WHERE user_id = $3',
      v_number_col,
      v_url_col
    )
    USING v_number, p_permanent_path, v_request.user_id;
  END IF;

  -- ── Mark request as approved ──────────────────────────
  UPDATE requests SET
    status      = 'approved',
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    updated_at  = now()
  WHERE id = p_request_id;
END;
$function$;
GRANT ALL ON FUNCTION public.approve_document_request(bigint, uuid, text, text) TO anon;
GRANT ALL ON FUNCTION public.approve_document_request(bigint, uuid, text, text) TO authenticated;
GRANT ALL ON FUNCTION public.approve_document_request(bigint, uuid, text, text) TO service_role;
CREATE FUNCTION public.approve_document_request(p_request_id bigint, p_reviewer_id uuid, p_permanent_path text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_request      requests%ROWTYPE;
  v_doc_type     text;
  v_url_col      text;
  v_number_col   text;
  v_number       text;
  -- Doc types that have NO number field
  v_no_number    text[] := ARRAY['cheque', 'passbook'];
BEGIN
  SELECT * INTO v_request
  FROM requests
  WHERE id = p_request_id
    AND status IN ('pending', 'under_review');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already actioned';
  END IF;

  v_doc_type := v_request.new_data->>'document_type';

  -- ── Map doc_type → actual column name ─────────────────────────
  v_url_col := CASE v_doc_type
    WHEN 'cheque'   THEN 'cancelled_cheque_url'   -- not "cheque_url"
    WHEN 'passbook' THEN 'passbook_url'
    WHEN 'aadhaar'  THEN 'aadhaar_url'
    WHEN 'pan'      THEN 'pan_url'
    WHEN 'passport' THEN 'passport_url'
    ELSE v_doc_type || '_url'                      -- safe fallback
  END;

  -- Ensure profile_details row exists
  INSERT INTO profile_details (user_id)
  VALUES (v_request.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF v_doc_type = ANY(v_no_number) THEN
    -- ── URL only (cheque, passbook) ──────────────────────────────
    EXECUTE format(
      'UPDATE profile_details SET %I = $1, updated_at = now()
       WHERE user_id = $2',
      v_url_col
    )
    USING p_permanent_path, v_request.user_id;

  ELSE
    -- ── Number + URL (aadhaar, pan, passport) ────────────────────
    v_number_col := v_doc_type || '_number';
    v_number     := v_request.new_data->>v_number_col;

    EXECUTE format(
      'UPDATE profile_details SET %I = $1, %I = $2, updated_at = now()
       WHERE user_id = $3',
      v_number_col,
      v_url_col
    )
    USING v_number, p_permanent_path, v_request.user_id;
  END IF;

  -- Mark approved
  UPDATE requests SET
    status      = 'approved',
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    updated_at  = now()
  WHERE id = p_request_id;
END;
$function$;
GRANT ALL ON FUNCTION public.approve_document_request(bigint, uuid, text) TO anon;
GRANT ALL ON FUNCTION public.approve_document_request(bigint, uuid, text) TO authenticated;
GRANT ALL ON FUNCTION public.approve_document_request(bigint, uuid, text) TO service_role;
CREATE FUNCTION public.approve_profile_update_request(p_request_id bigint, p_reviewer_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_request  requests%ROWTYPE;
  v_subtype  text;
  v_field    text;
BEGIN
  SELECT * INTO v_request
  FROM requests
  WHERE id = p_request_id
    AND request_type = 'profile_update'
    AND status IN ('pending', 'under_review');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already actioned';
  END IF;

  v_subtype := v_request.new_data->>'subtype';

  -- Ensure profile_details row exists
  INSERT INTO profile_details (user_id)
  VALUES (v_request.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- ── Route by subtype ──────────────────────────────────────
  CASE v_subtype

    -- ── Profile field (dob, marital_status, addresses) ──────
    WHEN 'profile_field' THEN
      v_field := v_request.new_data->>'field';

      IF v_field NOT IN (
        'date_of_birth', 'marital_status',
        'current_address', 'permanent_address'
      ) THEN
        RAISE EXCEPTION 'Field % is not allowed for profile_field subtype', v_field;
      END IF;

      IF v_field = 'date_of_birth' THEN
        EXECUTE format(
          'UPDATE profile_details SET %I = $1::date, updated_at = now()
           WHERE user_id = $2',
          v_field
        )
        USING v_request.new_data->>'value', v_request.user_id;
      ELSE
        EXECUTE format(
          'UPDATE profile_details SET %I = $1, updated_at = now()
           WHERE user_id = $2',
          v_field
        )
        USING v_request.new_data->>'value', v_request.user_id;
      END IF;

    -- ── Family simple fields (father, mother, spouse) ────────
    WHEN 'family_field' THEN
      v_field := v_request.new_data->>'field';

      IF v_field NOT IN ('father_name', 'mother_name', 'spouse_name') THEN
        RAISE EXCEPTION 'Field % is not allowed for family_field subtype', v_field;
      END IF;

      EXECUTE format(
        'UPDATE profile_details SET %I = $1, updated_at = now()
         WHERE user_id = $2',
        v_field
      )
      USING v_request.new_data->>'value', v_request.user_id;

    -- ── Children (full jsonb array replacement) ──────────────
    WHEN 'children' THEN
      UPDATE profile_details
      SET children   = (v_request.new_data->'value')::jsonb,
          updated_at = now()
      WHERE user_id = v_request.user_id;

    -- ── Nominees (full jsonb array replacement) ──────────────
    WHEN 'nominees' THEN
      UPDATE profile_details
      SET nominees   = (v_request.new_data->'value')::jsonb,
          updated_at = now()
      WHERE user_id = v_request.user_id;

    -- ── Device change ─────────────────────────────────────── ← NEW
    WHEN 'device_change' THEN
      UPDATE profiles
      SET device_info     = (v_request.new_data->'device_info')::jsonb,
          new_device_info = NULL
      WHERE id = v_request.user_id;

    ELSE
      RAISE EXCEPTION 'Unknown subtype: %', v_subtype;
  END CASE;

  -- ── Mark approved ─────────────────────────────────────────
  UPDATE requests SET
    status      = 'approved',
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    updated_at  = now()
  WHERE id = p_request_id;
END;
$function$;
GRANT ALL ON FUNCTION public.approve_profile_update_request(bigint, uuid) TO anon;
GRANT ALL ON FUNCTION public.approve_profile_update_request(bigint, uuid) TO authenticated;
GRANT ALL ON FUNCTION public.approve_profile_update_request(bigint, uuid) TO service_role;
CREATE FUNCTION public.calculate_contract_dates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Calculate contract end date from contract start date
  IF NEW.contract_start_date IS NOT NULL AND NEW.contract_period_months IS NOT NULL THEN
    NEW.contract_end_date := NEW.contract_start_date + (NEW.contract_period_months || ' months')::interval;
  END IF;
  
  -- Calculate service end date from service start date (if set)
  IF NEW.service_start_date IS NOT NULL AND NEW.contract_period_months IS NOT NULL THEN
    NEW.service_end_date := NEW.service_start_date + (NEW.contract_period_months || ' months')::interval;
  END IF;
  
  -- When activated, set service start date if not already set
  IF NEW.status = 'activated' AND (OLD.status IS NULL OR OLD.status != 'activated') AND NEW.service_start_date IS NULL THEN
    NEW.service_start_date := CURRENT_DATE;
    
    -- Also calculate service end date
    IF NEW.contract_period_months IS NOT NULL THEN
      NEW.service_end_date := NEW.service_start_date + (NEW.contract_period_months || ' months')::interval;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.calculate_contract_dates() IS 'Auto-calculates contract_end_date and service_end_date. Sets service_start_date when order is activated.';
GRANT ALL ON FUNCTION public.calculate_contract_dates() TO anon;
GRANT ALL ON FUNCTION public.calculate_contract_dates() TO authenticated;
GRANT ALL ON FUNCTION public.calculate_contract_dates() TO service_role;
CREATE FUNCTION public.calculate_customer_metrics()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  months_active numeric;
  remaining_months numeric;
BEGIN
  -- Calculate average monthly revenue if total revenue changes
  IF NEW.total_revenue_generated IS NOT NULL AND NEW.customer_since IS NOT NULL THEN
    -- Calculate months since customer joined (using 30.44 = average days per month)
    months_active := EXTRACT(EPOCH FROM (CURRENT_DATE - NEW.customer_since)) / (30.44 * 24 * 60 * 60);
    
    IF months_active > 0 THEN
      NEW.average_monthly_revenue := ROUND(NEW.total_revenue_generated / months_active, 2);
    ELSE
      -- New customer (less than 1 month) - use current monthly rental as estimate
      NEW.average_monthly_revenue := NEW.monthly_rental;
    END IF;
  END IF;
  
  -- Calculate lifetime value projection (current MRR × remaining contract months + past revenue)
  IF NEW.monthly_rental IS NOT NULL AND NEW.service_end_date IS NOT NULL THEN
    -- Calculate remaining months in contract
    remaining_months := EXTRACT(EPOCH FROM (NEW.service_end_date - CURRENT_DATE)) / (30.44 * 24 * 60 * 60);
    
    IF remaining_months > 0 THEN
      -- Project future revenue + past revenue
      NEW.lifetime_value := COALESCE(NEW.total_revenue_generated, 0) + (NEW.monthly_rental * remaining_months);
    ELSE
      -- Contract expired or about to expire - LTV is just past revenue
      NEW.lifetime_value := COALESCE(NEW.total_revenue_generated, 0);
    END IF;
  ELSIF NEW.monthly_rental IS NOT NULL AND NEW.contract_period_months IS NOT NULL THEN
    -- Fallback: If no service_end_date but have contract period
    NEW.lifetime_value := NEW.monthly_rental * NEW.contract_period_months;
  END IF;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.calculate_customer_metrics() IS 'Auto-calculates customer metrics: average monthly revenue (based on tenure) and projected lifetime value (remaining contract value + past revenue)';
GRANT ALL ON FUNCTION public.calculate_customer_metrics() TO anon;
GRANT ALL ON FUNCTION public.calculate_customer_metrics() TO authenticated;
GRANT ALL ON FUNCTION public.calculate_customer_metrics() TO service_role;
CREATE FUNCTION public.calculate_customer_renewal_date()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Calculate next renewal date based on service start date and contract period
  IF NEW.service_start_date IS NOT NULL AND NEW.contract_period_months IS NOT NULL THEN
    NEW.next_renewal_date := NEW.service_start_date + (NEW.contract_period_months || ' months')::interval;
  END IF;
  
  -- If service_end_date is set, ensure next_renewal_date doesn't exceed it
  IF NEW.service_end_date IS NOT NULL AND NEW.next_renewal_date > NEW.service_end_date THEN
    NEW.next_renewal_date := NEW.service_end_date;
  END IF;
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.calculate_customer_renewal_date() TO anon;
GRANT ALL ON FUNCTION public.calculate_customer_renewal_date() TO authenticated;
GRANT ALL ON FUNCTION public.calculate_customer_renewal_date() TO service_role;
CREATE FUNCTION public.calculate_document_dates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Calculate is_expired (documents with expiry dates)
  IF NEW.document_expiry_date IS NOT NULL THEN
    NEW.is_expired := NEW.document_expiry_date < CURRENT_DATE;
    
    -- Auto-update verification status if expired
    IF NEW.is_expired = true AND NEW.verification_status = 'verified' THEN
      NEW.verification_status := 'expired';
    END IF;
  ELSE
    NEW.is_expired := false;
  END IF;
  
  -- Calculate can_be_deleted_after (retention policy)
  IF NEW.uploaded_at IS NOT NULL AND NEW.retention_period_years IS NOT NULL THEN
    NEW.can_be_deleted_after := NEW.uploaded_at + (NEW.retention_period_years || ' years')::interval;
  END IF;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.calculate_document_dates() IS 'Auto-calculates is_expired (based on expiry date) and can_be_deleted_after (based on retention policy)';
GRANT ALL ON FUNCTION public.calculate_document_dates() TO anon;
GRANT ALL ON FUNCTION public.calculate_document_dates() TO authenticated;
GRANT ALL ON FUNCTION public.calculate_document_dates() TO service_role;
CREATE FUNCTION public.calculate_quotation_totals()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Calculate one-time charges subtotal (EXCLUDES security deposit and monthly rental)
  NEW.onetime_subtotal := 
    COALESCE(NEW.installation_charges, 0) +
    COALESCE(NEW.equipment_charges, 0) +
    COALESCE(NEW.router_charges, 0) +
    COALESCE(NEW.ont_charges, 0) +
    COALESCE(NEW.static_ip_charges, 0) +
    COALESCE(NEW.other_charges, 0);
  
  -- Calculate discount (applied to one-time charges only)
  IF NEW.discount_percentage > 0 THEN
    NEW.discount_amount := ROUND((NEW.onetime_subtotal * NEW.discount_percentage / 100), 2);
  END IF;
  
  -- Calculate taxable amount (one-time charges minus discount)
  -- FIXED: Security deposit NOT included in taxable amount
  NEW.taxable_amount := NEW.onetime_subtotal - COALESCE(NEW.discount_amount, 0);
  
  -- Calculate GST (either CGST+SGST or IGST, not both)
  IF NEW.cgst_percentage > 0 AND NEW.sgst_percentage > 0 THEN
    -- Intra-state (CGST + SGST)
    NEW.cgst_amount := ROUND((NEW.taxable_amount * NEW.cgst_percentage / 100), 2);
    NEW.sgst_amount := ROUND((NEW.taxable_amount * NEW.sgst_percentage / 100), 2);
    NEW.igst_amount := 0;
    NEW.onetime_total_with_tax := NEW.taxable_amount + NEW.cgst_amount + NEW.sgst_amount;
  ELSIF NEW.igst_percentage > 0 THEN
    -- Inter-state (IGST)
    NEW.igst_amount := ROUND((NEW.taxable_amount * NEW.igst_percentage / 100), 2);
    NEW.cgst_amount := 0;
    NEW.sgst_amount := 0;
    NEW.onetime_total_with_tax := NEW.taxable_amount + NEW.igst_amount;
  ELSE
    -- No tax
    NEW.onetime_total_with_tax := NEW.taxable_amount;
  END IF;
  
  -- FIXED: Security deposit added separately (not taxed)
  NEW.total_payable_now := NEW.onetime_total_with_tax + COALESCE(NEW.security_deposit, 0);
  
  -- Calculate total contract value (recurring charges only)
  IF NEW.contract_period_months > 0 THEN
    NEW.total_contract_value := NEW.monthly_rental * NEW.contract_period_months;
  END IF;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.calculate_quotation_totals() IS 'Auto-calculates quotation totals. Security deposit is added to final total but NOT included in taxable amount (as it is refundable).';
GRANT ALL ON FUNCTION public.calculate_quotation_totals() TO anon;
GRANT ALL ON FUNCTION public.calculate_quotation_totals() TO authenticated;
GRANT ALL ON FUNCTION public.calculate_quotation_totals() TO service_role;
CREATE FUNCTION public.cancel_attendance_regularization(regularization_id bigint)
 RETURNS TABLE(status_code integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 SET "TimeZone" TO 'Asia/Kolkata'
AS $function$
DECLARE
    current_employee_id uuid;
    reg_record public.attendance_regularizations%ROWTYPE;
BEGIN
    -- Acquire advisory lock
    PERFORM pg_advisory_xact_lock(regularization_id);

    -- Get current authenticated employee
    current_employee_id := auth.uid();
    
    -- Get the regularization record with lock
    SELECT * INTO reg_record
    FROM public.attendance_regularizations
    WHERE id = regularization_id
    FOR UPDATE;
    
    -- Check if record exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT 404, 'Regularization request not found';
        RETURN;
    END IF;
    
    -- Verify ownership
    IF reg_record.employee_id != current_employee_id THEN
        RETURN QUERY SELECT 403, 'You can only cancel your own regularization requests';
        RETURN;
    END IF;
    
    -- Check status - allow cancellation until not approved/rejected
    IF reg_record.status IN ('approved', 'rejected', 'cancelled', 'expired') THEN
        RETURN QUERY SELECT 400, format(
            'Cannot cancel regularization in current state: %s', 
            reg_record.status
        );
        RETURN;
    END IF;
    
    -- Update status to cancelled
    UPDATE public.attendance_regularizations
    SET 
        status = 'cancelled',
        updated_at = NOW()
    WHERE id = regularization_id;
    
    RETURN QUERY SELECT 200, 'Regularization request cancelled successfully';
EXCEPTION
    WHEN others THEN
        RETURN QUERY SELECT 500, 'ERROR: ' || SQLERRM;
END;
$function$;
GRANT ALL ON FUNCTION public.cancel_attendance_regularization(bigint) TO anon;
GRANT ALL ON FUNCTION public.cancel_attendance_regularization(bigint) TO authenticated;
GRANT ALL ON FUNCTION public.cancel_attendance_regularization(bigint) TO service_role;
CREATE FUNCTION public.cancel_leave_application(leave_application_id bigint)
 RETURNS TABLE(status_code integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 SET "TimeZone" TO 'Asia/Kolkata'
AS $function$
DECLARE
    current_employee_id uuid;
    app_record public.leave_applications%ROWTYPE;
BEGIN
    -- Acquire advisory lock
    PERFORM pg_advisory_xact_lock(leave_application_id);

    -- Get current authenticated employee
    current_employee_id := auth.uid();
    
    -- Get the leave application with lock
    SELECT * INTO app_record
    FROM public.leave_applications
    WHERE id = leave_application_id
    FOR UPDATE;
    
    -- Check if record exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT 404, 'Leave application not found';
        RETURN;
    END IF;
    
    -- Verify ownership
    IF app_record.employee_id != current_employee_id THEN
        RETURN QUERY SELECT 403, 'You can only cancel your own leave applications';
        RETURN;
    END IF;
    
    -- Check status - allow cancellation until not approved/rejected
    IF app_record.status IN ('approved', 'rejected', 'cancelled', 'withdrawn', 'expired') THEN
        RETURN QUERY SELECT 400, format(
            'Cannot cancel leave application in current state: %s', 
            app_record.status
        );
        RETURN;
    END IF;
    
    -- Update status to cancelled
    UPDATE public.leave_applications
    SET 
        status = 'cancelled',
        updated_at = NOW()
    WHERE id = leave_application_id;
    
    -- Update leave balances only if status was pending/partially approved
    IF app_record.status IN ('pending', 'partially_approved') THEN
        UPDATE public.employee_leave_balances
        SET pending_days = GREATEST(pending_days - app_record.total_days, 0)
        WHERE employee_id = current_employee_id
          AND leave_type_id = app_record.leave_type_id
          AND calendar_year = EXTRACT(YEAR FROM app_record.created_at)::smallint;
    END IF;
    
    RETURN QUERY SELECT 200, 'Leave application cancelled successfully';
EXCEPTION
    WHEN others THEN
        RETURN QUERY SELECT 500, 'ERROR: ' || SQLERRM;
END;
$function$;
GRANT ALL ON FUNCTION public.cancel_leave_application(bigint) TO anon;
GRANT ALL ON FUNCTION public.cancel_leave_application(bigint) TO authenticated;
GRANT ALL ON FUNCTION public.cancel_leave_application(bigint) TO service_role;
CREATE FUNCTION public.check_checklist_dependencies()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  dependency_id bigint;
  dependency_completed boolean;
  all_dependencies_met boolean := true;
  blocked_items text := '';
  dep_item_name text;
  new_status text;
  new_blocked_by text;
BEGIN
  -- Only check if this item has dependencies
  IF NEW.depends_on_item_ids IS NULL OR array_length(NEW.depends_on_item_ids, 1) = 0 THEN
    -- No dependencies, ensure not blocked by dependency
    IF NEW.status = 'blocked' AND (NEW.blocked_by IS NULL OR NEW.blocked_by LIKE 'Dependency:%') THEN
      NEW.status := 'pending';
      NEW.blocked_by := NULL;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Skip check if already completed or skipped (no point checking)
  IF NEW.status IN ('completed', 'skipped') THEN
    RETURN NEW;
  END IF;
  
  -- Check each dependency
  FOREACH dependency_id IN ARRAY NEW.depends_on_item_ids
  LOOP
    SELECT is_completed, item_name 
    INTO dependency_completed, dep_item_name
    FROM order_processing_checklist
    WHERE id = dependency_id;
    
    -- If dependency not found or not completed
    IF NOT COALESCE(dependency_completed, false) THEN
      all_dependencies_met := false;
      
      -- Build list of blocking items
      IF blocked_items != '' THEN
        blocked_items := blocked_items || ', ';
      END IF;
      blocked_items := blocked_items || COALESCE(dep_item_name, 'Item #' || dependency_id);
    END IF;
  END LOOP;
  
  -- Determine new status and blocked_by
  IF NOT all_dependencies_met THEN
    new_status := 'blocked';
    new_blocked_by := 'Dependency: ' || blocked_items;
  ELSE
    -- All dependencies met
    IF NEW.status = 'blocked' AND (NEW.blocked_by IS NULL OR NEW.blocked_by LIKE 'Dependency:%') THEN
      new_status := 'pending';
      new_blocked_by := NULL;
    ELSE
      -- Keep current status if not blocked by dependency
      new_status := NEW.status;
      new_blocked_by := NEW.blocked_by;
    END IF;
  END IF;
  
  -- CRITICAL: Only update if actually changing (prevents infinite loops)
  IF NEW.status IS DISTINCT FROM new_status OR NEW.blocked_by IS DISTINCT FROM new_blocked_by THEN
    NEW.status := new_status;
    NEW.blocked_by := new_blocked_by;
  END IF;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.check_checklist_dependencies() IS 'Auto-checks dependencies and sets blocked status. Loop-safe: only updates if status actually changes. Uses BEFORE trigger to prevent infinite recursion.';
GRANT ALL ON FUNCTION public.check_checklist_dependencies() TO anon;
GRANT ALL ON FUNCTION public.check_checklist_dependencies() TO authenticated;
GRANT ALL ON FUNCTION public.check_checklist_dependencies() TO service_role;
CREATE FUNCTION public.check_leave_overlap(p_employee_id uuid, p_start_date date, p_end_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  overlap_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.leave_applications  -- Explicit schema
    WHERE employee_id = p_employee_id
      AND status IN ('approved', 'pending')
      AND (start_date, end_date) OVERLAPS (p_start_date, p_end_date)
  ) INTO overlap_exists;

  RETURN overlap_exists;
END;
$function$;
GRANT ALL ON FUNCTION public.check_leave_overlap(uuid, date, date) TO anon;
GRANT ALL ON FUNCTION public.check_leave_overlap(uuid, date, date) TO authenticated;
GRANT ALL ON FUNCTION public.check_leave_overlap(uuid, date, date) TO service_role;
CREATE FUNCTION public.create_or_reuse_feasibility_request(p_lead_id bigint, p_requested_by uuid, p_requesting_department smallint, p_service_location jsonb, p_service_requirements jsonb)
 RETURNS TABLE(request_id bigint, was_reused boolean, request_number text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_existing_id BIGINT;
  v_existing_number TEXT;
  v_existing_status TEXT;
  v_new_id BIGINT;
  v_new_number TEXT;
  v_history_entry JSONB;
BEGIN
  -- Check if there's a cancelled request for this lead
  SELECT fr.id, fr.request_number, fr.status  -- ✅ Qualify with table alias
  INTO v_existing_id, v_existing_number, v_existing_status
  FROM feasibility_requests fr
  WHERE fr.lead_id = p_lead_id 
    AND fr.status = 'cancelled'
  ORDER BY fr.updated_at DESC
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- ✅ REUSE: Update existing cancelled request
    
    -- Create history entry for reactivation
    v_history_entry := jsonb_build_object(
      'event', 'reactivated',
      'timestamp', NOW(),
      'previous_status', v_existing_status,
      'new_status', 'pending',
      'requested_by', p_requested_by,
      'requesting_department', p_requesting_department,
      'note', 'Cancelled request reused for new submission'
    );
    
    UPDATE feasibility_requests
    SET
      -- Reset to initial state
      status = 'pending',
      requested_by = p_requested_by,
      requesting_department = p_requesting_department,
      requested_at = NOW(),
      service_location = p_service_location,
      service_requirements = p_service_requirements,
      updated_at = NOW(),
      
      -- Clear review data
      is_feasible = NULL,
      feasibility_remarks = NULL,
      reviewed_by = NULL,
      reviewed_at = NULL,
      
      -- Clear routes and survey
      primary_route = NULL,
      secondary_route = NULL,
      site_survey = NULL,
      
      -- Clear commercial data
      estimated_capex = NULL,
      estimated_opex = NULL,
      estimated_roi_months = NULL,
      is_commercially_viable = NULL,
      commercial_remarks = NULL,
      estimated_installation_days = NULL,
      expected_completion_date = NULL,
      operational_costs = NULL,
      attachments = '[]'::jsonb,
      
      -- ✅ Append to history
      status_history = COALESCE(status_history, '[]'::jsonb) || v_history_entry
    WHERE id = v_existing_id;
    
    RETURN QUERY SELECT v_existing_id, TRUE, v_existing_number;
    
  ELSE
    -- ✅ CREATE: No cancelled request exists, insert new one
    
    -- Create initial history entry
    v_history_entry := jsonb_build_object(
      'event', 'created',
      'timestamp', NOW(),
      'status', 'pending',
      'requested_by', p_requested_by,
      'requesting_department', p_requesting_department,
      'note', 'Initial feasibility request created'
    );
    
    INSERT INTO feasibility_requests (
      lead_id,
      requested_by,
      requesting_department,
      requested_at,
      service_location,
      service_requirements,
      status,
      status_history
    )
    VALUES (
      p_lead_id,
      p_requested_by,
      p_requesting_department,
      NOW(),
      p_service_location,
      p_service_requirements,
      'pending',
      jsonb_build_array(v_history_entry)
    )
    RETURNING 
      feasibility_requests.id,  -- ✅ Fully qualify table name
      feasibility_requests.request_number  -- ✅ Fully qualify table name
    INTO v_new_id, v_new_number;
    
    RETURN QUERY SELECT v_new_id, FALSE, v_new_number;
  END IF;
END;
$function$;
GRANT ALL ON FUNCTION public.create_or_reuse_feasibility_request(bigint, uuid, smallint, jsonb, jsonb) TO anon;
GRANT ALL ON FUNCTION public.create_or_reuse_feasibility_request(bigint, uuid, smallint, jsonb, jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.create_or_reuse_feasibility_request(bigint, uuid, smallint, jsonb, jsonb) TO service_role;
CREATE FUNCTION public.generate_approval_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  year_val text;
  sequence_num integer;
BEGIN
  year_val := TO_CHAR(NEW.created_at, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(approval_number FROM 'BA-' || year_val || '-(.*)') AS integer)), 0) + 1
  INTO sequence_num
  FROM business_approvals
  WHERE approval_number LIKE 'BA-' || year_val || '-%';
  
  NEW.approval_number := 'BA-' || year_val || '-' || LPAD(sequence_num::text, 5, '0');
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.generate_approval_number() TO anon;
GRANT ALL ON FUNCTION public.generate_approval_number() TO authenticated;
GRANT ALL ON FUNCTION public.generate_approval_number() TO service_role;
CREATE FUNCTION public.generate_customer_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  year_val text;
  sequence_num integer;
BEGIN
  year_val := TO_CHAR(NEW.created_at, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM 'CUST-' || year_val || '-(.*)') AS integer)), 0) + 1
  INTO sequence_num
  FROM customers
  WHERE customer_id LIKE 'CUST-' || year_val || '-%';
  
  NEW.customer_id := 'CUST-' || year_val || '-' || LPAD(sequence_num::text, 5, '0');
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.generate_customer_id() TO anon;
GRANT ALL ON FUNCTION public.generate_customer_id() TO authenticated;
GRANT ALL ON FUNCTION public.generate_customer_id() TO service_role;
CREATE FUNCTION public.generate_feasibility_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  year_val text;
  sequence_num integer;
  lock_key bigint;
  new_request_number text;
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    -- ✅ FIX 1: Use COALESCE to handle NULL created_at
    year_val := TO_CHAR(COALESCE(NEW.created_at, NOW()), 'YYYY');
    
    -- Generate lock key from year
    lock_key := hashtext('feasibility_request_' || year_val);
    
    -- Acquire advisory lock
    PERFORM pg_advisory_xact_lock(lock_key);
    
    -- ✅ FIX 2: Use split_part instead of SUBSTRING regex
    SELECT COALESCE(MAX(CAST(split_part(request_number, '-', 3) AS integer)), 0) + 1
    INTO sequence_num
    FROM feasibility_requests
    WHERE request_number LIKE 'FR-' || year_val || '-%';
    
    -- Generate request number
    new_request_number := 'FR-' || year_val || '-' || LPAD(sequence_num::text, 5, '0');
    
    -- Safety check
    IF EXISTS (SELECT 1 FROM feasibility_requests WHERE request_number = new_request_number) THEN
      RAISE EXCEPTION 'Duplicate request number: %', new_request_number;
    END IF;
    
    NEW.request_number := new_request_number;
  END IF;
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.generate_feasibility_number() TO anon;
GRANT ALL ON FUNCTION public.generate_feasibility_number() TO authenticated;
GRANT ALL ON FUNCTION public.generate_feasibility_number() TO service_role;
CREATE FUNCTION public.generate_lead_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  year_val text;
  sequence_num integer;
  lock_key bigint;
  new_lead_number text;
BEGIN
  IF NEW.lead_number IS NULL OR NEW.lead_number = '' THEN
    year_val := TO_CHAR(COALESCE(NEW.created_at, NOW()), 'YYYY');
    lock_key := hashtext('spanco_lead_' || year_val);
    
    PERFORM pg_advisory_xact_lock(lock_key);
    
    SELECT COALESCE(MAX(CAST(split_part(lead_number, '-', 3) AS integer)), 0) + 1
    INTO sequence_num
    FROM spanco_leads
    WHERE lead_number LIKE 'LEAD-' || year_val || '-%';
    
    new_lead_number := 'LEAD-' || year_val || '-' || LPAD(sequence_num::text, 5, '0');
    
    RAISE NOTICE 'Generated: % (year: %, seq: %)', new_lead_number, year_val, sequence_num;
    
    IF EXISTS (SELECT 1 FROM spanco_leads WHERE lead_number = new_lead_number) THEN
      RAISE EXCEPTION 'Duplicate lead number: %', new_lead_number;
    END IF;
    
    NEW.lead_number := new_lead_number;
  END IF;
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.generate_lead_number() TO anon;
GRANT ALL ON FUNCTION public.generate_lead_number() TO authenticated;
GRANT ALL ON FUNCTION public.generate_lead_number() TO service_role;
CREATE FUNCTION public.generate_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  year_val text;
  sequence_num integer;
BEGIN
  year_val := TO_CHAR(NEW.created_at, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'ORD-' || year_val || '-(.*)') AS integer)), 0) + 1
  INTO sequence_num
  FROM sales_orders
  WHERE order_number LIKE 'ORD-' || year_val || '-%';
  
  NEW.order_number := 'ORD-' || year_val || '-' || LPAD(sequence_num::text, 5, '0');
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.generate_order_number() TO anon;
GRANT ALL ON FUNCTION public.generate_order_number() TO authenticated;
GRANT ALL ON FUNCTION public.generate_order_number() TO service_role;
CREATE FUNCTION public.generate_quotation_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  year_val text;
  sequence_num integer;
BEGIN
  year_val := TO_CHAR(NEW.created_at, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(quotation_number FROM 'QT-' || year_val || '-(.*)') AS integer)), 0) + 1
  INTO sequence_num
  FROM quotations
  WHERE quotation_number LIKE 'QT-' || year_val || '-%';
  
  NEW.quotation_number := 'QT-' || year_val || '-' || LPAD(sequence_num::text, 5, '0');
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.generate_quotation_number() TO anon;
GRANT ALL ON FUNCTION public.generate_quotation_number() TO authenticated;
GRANT ALL ON FUNCTION public.generate_quotation_number() TO service_role;
CREATE FUNCTION public.get_attendance_details(attendance_date date)
 RETURNS TABLE("Name" text, "Department" text, "Date" date, "Status" text, "Punch In" time without time zone, "Punch Out" time without time zone, "Punch In Location" text, "Punch Out Location" text)
 LANGUAGE sql
AS $function$
SET search_path = '';

WITH date_check AS (
    SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date AS today_ist
)
SELECT 
  p.full_name AS "Name",
  d.name AS "Department",
  COALESCE(a.date, attendance_date) AS "Date",
  CASE 
    WHEN attendance_date = dc.today_ist THEN NULL
    ELSE a.status
  END AS "Status",
  a.punch_in AS "Punch In",
  a.punch_out AS "Punch Out",
  a.punch_in_location AS "Punch In Location",
  a.punch_out_location AS "Punch Out Location"
FROM public.profiles p
LEFT JOIN public.attendance a 
  ON p.id = a.employee_id AND a.date = attendance_date
LEFT JOIN public.departments d 
  ON p.department = d.id
CROSS JOIN date_check dc
WHERE p.is_active = true
  AND attendance_date <= dc.today_ist
ORDER BY d.name;
$function$;
GRANT ALL ON FUNCTION public.get_attendance_details(date) TO anon;
GRANT ALL ON FUNCTION public.get_attendance_details(date) TO authenticated;
GRANT ALL ON FUNCTION public.get_attendance_details(date) TO service_role;
CREATE FUNCTION public.get_lead_stage_journey(p_lead_id bigint)
 RETURNS TABLE(stage_number integer, stage_name text, entered_at timestamp with time zone, duration_days numeric, changed_by_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ssh.changed_at)::int as stage_number,
    ssh.to_stage as stage_name,
    ssh.changed_at as entered_at,
    ROUND(EXTRACT(EPOCH FROM ssh.duration_in_stage)/86400, 2) as duration_days,
    p.full_name as changed_by_name
  FROM spanco_stage_history ssh
  JOIN profiles p ON ssh.changed_by = p.id
  WHERE ssh.lead_id = p_lead_id
  ORDER BY ssh.changed_at;
END;
$function$;
GRANT ALL ON FUNCTION public.get_lead_stage_journey(bigint) TO anon;
GRANT ALL ON FUNCTION public.get_lead_stage_journey(bigint) TO authenticated;
GRANT ALL ON FUNCTION public.get_lead_stage_journey(bigint) TO service_role;
CREATE FUNCTION public.get_supabase_time()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Converts UTC to IST and removes the timezone offset (+00)
  RETURN (now() AT TIME ZONE 'Asia/Kolkata')::text;
END;
$function$;
GRANT ALL ON FUNCTION public.get_supabase_time() TO anon;
GRANT ALL ON FUNCTION public.get_supabase_time() TO authenticated;
GRANT ALL ON FUNCTION public.get_supabase_time() TO service_role;
CREATE FUNCTION public.handle_document_versioning()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- When a document is marked as superseded
  IF NEW.superseded_by_document_id IS NOT NULL AND 
     (OLD.superseded_by_document_id IS NULL OR OLD.superseded_by_document_id != NEW.superseded_by_document_id) THEN
    
    -- Mark this as not the latest version
    NEW.is_latest_version := false;
    
    -- Optionally mark as expired if verification status is verified
    IF NEW.verification_status = 'verified' THEN
      NEW.verification_status := 'expired';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.handle_document_versioning() IS 'Automatically manages document versions when superseded_by_document_id is set';
GRANT ALL ON FUNCTION public.handle_document_versioning() TO anon;
GRANT ALL ON FUNCTION public.handle_document_versioning() TO authenticated;
GRANT ALL ON FUNCTION public.handle_document_versioning() TO service_role;
CREATE FUNCTION public.handle_leave_approval(leave_application_id bigint, manager_id uuid, action text, current_level integer)
 RETURNS TABLE(status_code integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 SET "TimeZone" TO 'Asia/Kolkata'
AS $function$
DECLARE
    app_record public.leave_applications%ROWTYPE;
    current_year smallint;
    next_year smallint;
    current_year_days numeric;
    next_year_days numeric;
    balance_record public.employee_leave_balances%ROWTYPE;
    approval_adjusted boolean := false;
    result_message text;
    now_timestamptz timestamptz := NOW();
    current_date_in_tz date := (now_timestamptz)::date;
    leave_day date;
BEGIN
    -- Acquire advisory lock
    PERFORM pg_advisory_xact_lock(leave_application_id);
    
    -- Lock and retrieve leave application
    SELECT * INTO app_record
    FROM public.leave_applications
    WHERE id = leave_application_id
    FOR UPDATE;
    
    -- Check terminal state
    IF app_record.status IN ('rejected', 'cancelled', 'approved') THEN
        RETURN QUERY SELECT 
            409 AS status_code, 
            'Request already processed: ' || app_record.status AS message;
        RETURN;
    END IF;
    
    -- Handle approval level adjustment
    IF current_level > app_record.approval_levels THEN
        UPDATE public.leave_applications
        SET approval_levels = current_level
        WHERE id = leave_application_id;
        approval_adjusted := true;
    END IF;
    
    -- Update approval fields using captured time (removed comments)
    EXECUTE format(
        'UPDATE public.leave_applications
         SET 
             level_%s_approver_id = $1,
             level_%s_status = $2,
             level_%s_action_at = $4,  -- Parameter index reduced
             updated_at = $4
         WHERE id = $3',  -- Removed comments column update
        current_level, current_level, current_level
    )
    USING manager_id, action, leave_application_id, now_timestamptz;  -- Removed comments value
    
    -- Handle lower levels
    FOR i IN 1..(current_level - 1) LOOP
        IF app_record.level_1_status IS NULL OR app_record.level_1_status = 'pending' THEN
            EXECUTE format(
                'UPDATE public.leave_applications
                 SET level_%s_status = ''bypassed''
                 WHERE id = $1',
                i
            ) USING leave_application_id;
        END IF;
    END LOOP;
    
    -- Handle final approval using app_record.approval_levels
    IF action = 'approved' AND current_level >= app_record.approval_levels THEN
        -- Calculate year spans
        current_year := EXTRACT(YEAR FROM app_record.start_date)::smallint;
        next_year := current_year + 1;
        
        -- Calculate days in each year
        IF EXTRACT(YEAR FROM app_record.end_date) = current_year THEN
            current_year_days := app_record.total_days;
            next_year_days := 0;
        ELSE
            current_year_days := (DATE(current_year::text || '-12-31') - app_record.start_date) + 1;
            next_year_days := (app_record.end_date - DATE(next_year::text || '-01-01')) + 1;
        END IF;
        
        -- Update status
        UPDATE public.leave_applications
        SET 
            status = 'approved',
            final_approved_at = now_timestamptz
        WHERE id = leave_application_id;
        
        -- Handle current year balance
        INSERT INTO public.employee_leave_balances (
            employee_id, leave_type_id, calendar_year
        )
        VALUES (
            app_record.employee_id,
            app_record.leave_type_id,
            current_year
        )
        ON CONFLICT (employee_id, leave_type_id, calendar_year) DO NOTHING;
        
        UPDATE public.employee_leave_balances
        SET 
            used_days = used_days + current_year_days,
            pending_days = pending_days - app_record.total_days
        WHERE employee_id = app_record.employee_id
          AND leave_type_id = app_record.leave_type_id
          AND calendar_year = current_year;
        
        -- Handle next year days
        IF next_year_days > 0 THEN
            -- Check if next year balance exists
            SELECT 1 INTO balance_record
            FROM public.employee_leave_balances
            WHERE employee_id = app_record.employee_id
              AND leave_type_id = app_record.leave_type_id
              AND calendar_year = next_year;
            
            IF FOUND THEN
                -- Deduct from next year's balance
                UPDATE public.employee_leave_balances
                SET 
                    used_days = used_days + next_year_days,
                    pending_days = pending_days - next_year_days
                WHERE employee_id = app_record.employee_id
                  AND leave_type_id = app_record.leave_type_id
                  AND calendar_year = next_year;
            ELSE
                -- Use current year's balance with next_year_days marker
                UPDATE public.employee_leave_balances
                SET 
                    used_days = used_days + next_year_days,
                    next_year_days = COALESCE(next_year_days, 0) + next_year_days
                WHERE employee_id = app_record.employee_id
                  AND leave_type_id = app_record.leave_type_id
                  AND calendar_year = current_year;
            END IF;
        END IF;
        
        -- Update attendance records for leave days up to current date
        IF app_record.start_date <= current_date_in_tz THEN
            -- Determine end date for attendance updates
            DECLARE
                end_date_for_attendance date := LEAST(app_record.end_date, current_date_in_tz);
            BEGIN
                -- Loop through each day in leave period
                FOR leave_day IN SELECT generate_series(
                    app_record.start_date, 
                    end_date_for_attendance, 
                    '1 day'::interval
                )::date
                LOOP
                    -- Upsert with conflict target on (employee_id, date)
                    INSERT INTO public.attendance (
                        employee_id, 
                        date, 
                        status, 
                        attendance_type
                    )  -- Removed comments from insert
                    VALUES (
                        app_record.employee_id,
                        leave_day,
                        'leave',
                        'system_generated'
                    )
                    ON CONFLICT (employee_id, date)
                    DO UPDATE SET
                        status = 'leave',
                        attendance_type = 'system_generated'
                    ;  -- Removed remarks update
                END LOOP;
            END;
        END IF;
        
        -- Build success message
        result_message := format('Leave approved: %s days',
                                app_record.total_days);
        
        IF approval_adjusted THEN
            result_message := result_message || ' | Approval levels adjusted';
        END IF;
        
        RETURN QUERY SELECT 
            200 AS status_code,
            result_message AS message;
        
    ELSIF action = 'rejected' THEN
        -- Update status
        UPDATE public.leave_applications
        SET status = 'rejected'
        WHERE id = leave_application_id;
        
        -- Remove pending days from all affected years
        FOR year_offset IN 0..1 LOOP
            DECLARE
                year_val smallint := EXTRACT(YEAR FROM app_record.start_date)::smallint + year_offset;
            BEGIN
                UPDATE public.employee_leave_balances
                SET pending_days = GREATEST(pending_days - app_record.total_days, 0)
                WHERE employee_id = app_record.employee_id
                  AND leave_type_id = app_record.leave_type_id
                  AND calendar_year = year_val;
            END;
        END LOOP;
        
        result_message := 'Leave request rejected.';
        IF approval_adjusted THEN
            result_message := result_message || ' | Approval levels adjusted';
        END IF;
        
        RETURN QUERY SELECT 
            200 AS status_code,
            result_message AS message;
    ELSE
        -- Partial approval
        result_message := 'Action recorded. Waiting for further approvals';
        IF approval_adjusted THEN
            result_message := result_message || ' | Approval levels adjusted';
        END IF;
        
        RETURN QUERY SELECT 
            202 AS status_code,
            result_message AS message;
    END IF;
    
    RETURN;
EXCEPTION
    WHEN others THEN
        RETURN QUERY SELECT 
            500 AS status_code, 
            'ERROR: ' || SQLERRM AS message;
END;
$function$;
GRANT ALL ON FUNCTION public.handle_leave_approval(bigint, uuid, text, integer) TO anon;
GRANT ALL ON FUNCTION public.handle_leave_approval(bigint, uuid, text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.handle_leave_approval(bigint, uuid, text, integer) TO service_role;
CREATE FUNCTION public.handle_leave_approval(leave_application_id bigint, manager_id uuid, action text, comments text, current_level integer)
 RETURNS TABLE(status_code integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 SET "TimeZone" TO 'Asia/Kolkata'
AS $function$
DECLARE
    app_record public.leave_applications%ROWTYPE;
    current_year smallint;
    next_year smallint;
    current_year_days numeric;
    next_year_days numeric;
    balance_record public.employee_leave_balances%ROWTYPE;
    approval_adjusted boolean := false;
    result_message text;
    now_timestamptz timestamptz := NOW();
    current_date_in_tz date := (now_timestamptz)::date;
    leave_day date;
BEGIN
    -- Acquire advisory lock
    PERFORM pg_advisory_xact_lock(leave_application_id);
    
    -- Lock and retrieve leave application
    SELECT * INTO app_record
    FROM public.leave_applications
    WHERE id = leave_application_id
    FOR UPDATE;
    
    -- Check terminal state
    IF app_record.status IN ('rejected', 'cancelled', 'approved') THEN
        RETURN QUERY SELECT 
            409 AS status_code, 
            'Request already processed: ' || app_record.status AS message;
        RETURN;
    END IF;
    
    -- Handle approval level adjustment
    IF current_level > app_record.approval_levels THEN
        UPDATE public.leave_applications
        SET approval_levels = current_level
        WHERE id = leave_application_id;
        approval_adjusted := true;
    END IF;
    
    -- Update approval fields using captured time
    EXECUTE format(
        'UPDATE public.leave_applications
         SET 
             level_%s_approver_id = $1,
             level_%s_status = $2,
             level_%s_action_at = $5,
             level_%s_comments = $3,
             updated_at = $5
         WHERE id = $4',
        current_level, current_level, current_level, current_level
    )
    USING manager_id, action, comments, leave_application_id, now_timestamptz;
    
    -- Handle lower levels
    FOR i IN 1..(current_level - 1) LOOP
        IF app_record.level_1_status IS NULL OR app_record.level_1_status = 'pending' THEN
            EXECUTE format(
                'UPDATE public.leave_applications
                 SET level_%s_status = ''bypassed''
                 WHERE id = $1',
                i
            ) USING leave_application_id;
        END IF;
    END LOOP;
    
    -- Handle final approval using app_record.approval_levels
    IF action = 'approved' AND current_level >= app_record.approval_levels THEN
        -- Calculate year spans
        current_year := EXTRACT(YEAR FROM app_record.start_date)::smallint;
        next_year := current_year + 1;
        
        -- Calculate days in each year
        IF EXTRACT(YEAR FROM app_record.end_date) = current_year THEN
            current_year_days := app_record.total_days;
            next_year_days := 0;
        ELSE
            current_year_days := (DATE(current_year::text || '-12-31') - app_record.start_date) + 1;
            next_year_days := (app_record.end_date - DATE(next_year::text || '-01-01')) + 1;
        END IF;
        
        -- Update status
        UPDATE public.leave_applications
        SET 
            status = 'approved',
            final_approved_at = now_timestamptz
        WHERE id = leave_application_id;
        
        -- Handle current year balance
        INSERT INTO public.employee_leave_balances (
            employee_id, leave_type_id, calendar_year
        )
        VALUES (
            app_record.employee_id,
            app_record.leave_type_id,
            current_year
        )
        ON CONFLICT (employee_id, leave_type_id, calendar_year) DO NOTHING;
        
        UPDATE public.employee_leave_balances
        SET 
            used_days = used_days + current_year_days,
            pending_days = pending_days - app_record.total_days
        WHERE employee_id = app_record.employee_id
          AND leave_type_id = app_record.leave_type_id
          AND calendar_year = current_year;
        
        -- Handle next year days
        IF next_year_days > 0 THEN
            -- Check if next year balance exists
            SELECT 1 INTO balance_record
            FROM public.employee_leave_balances
            WHERE employee_id = app_record.employee_id
              AND leave_type_id = app_record.leave_type_id
              AND calendar_year = next_year;
            
            IF FOUND THEN
                -- Deduct from next year's balance
                UPDATE public.employee_leave_balances
                SET 
                    used_days = used_days + next_year_days,
                    pending_days = pending_days - next_year_days
                WHERE employee_id = app_record.employee_id
                  AND leave_type_id = app_record.leave_type_id
                  AND calendar_year = next_year;
            ELSE
                -- Use current year's balance with next_year_days marker
                UPDATE public.employee_leave_balances
                SET 
                    used_days = used_days + next_year_days,
                    next_year_days = COALESCE(next_year_days, 0) + next_year_days
                WHERE employee_id = app_record.employee_id
                  AND leave_type_id = app_record.leave_type_id
                  AND calendar_year = current_year;
            END IF;
        END IF;
        
        -- NEW: Update attendance records for leave days up to current date
        IF app_record.start_date <= current_date_in_tz THEN
            -- Determine end date for attendance updates
            DECLARE
                end_date_for_attendance date := LEAST(app_record.end_date, current_date_in_tz);
            BEGIN
                -- Loop through each day in leave period
                FOR leave_day IN SELECT generate_series(
                    app_record.start_date, 
                    end_date_for_attendance, 
                    '1 day'::interval
                )::date
                LOOP
                    -- Upsert with conflict target on (employee_id, date)
                    INSERT INTO public.attendance (
                        employee_id, 
                        date, 
                        status, 
                        attendance_type,
                        remarks
                    )
                    VALUES (
                        app_record.employee_id,
                        leave_day,
                        'leave',
                        'system_generated',
                        'Approved leave: ' || app_record.reason
                    )
                    ON CONFLICT (employee_id, date)  -- Fixed conflict target
                    DO UPDATE SET
                        status = 'leave',
                        attendance_type = 'system_generated',
                        remarks = COALESCE(attendance.remarks, '') || ' | Approved leave: ' || app_record.reason
                    ;
                END LOOP;
            END;
        END IF;
        
        -- Build success message
        result_message := format('Leave approved: %s days',
                                app_record.total_days);
        
        IF approval_adjusted THEN
            result_message := result_message || ' | Approval levels adjusted';
        END IF;
        
        RETURN QUERY SELECT 
            200 AS status_code,
            result_message AS message;
        
    ELSIF action = 'rejected' THEN
        -- Update status
        UPDATE public.leave_applications
        SET status = 'rejected'
        WHERE id = leave_application_id;
        
        -- Remove pending days from all affected years
        FOR year_offset IN 0..1 LOOP
            DECLARE
                year_val smallint := EXTRACT(YEAR FROM app_record.start_date)::smallint + year_offset;
            BEGIN
                UPDATE public.employee_leave_balances
                SET pending_days = GREATEST(pending_days - app_record.total_days, 0)
                WHERE employee_id = app_record.employee_id
                  AND leave_type_id = app_record.leave_type_id
                  AND calendar_year = year_val;
            END;
        END LOOP;
        
        result_message := 'Leave request rejected.';
        IF approval_adjusted THEN
            result_message := result_message || ' | Approval levels adjusted';
        END IF;
        
        RETURN QUERY SELECT 
            200 AS status_code,
            result_message AS message;
    ELSE
        -- Partial approval
        result_message := 'Action recorded. Waiting for further approvals';
        IF approval_adjusted THEN
            result_message := result_message || ' | Approval levels adjusted';
        END IF;
        
        RETURN QUERY SELECT 
            202 AS status_code,
            result_message AS message;
    END IF;
    
    RETURN;
EXCEPTION
    WHEN others THEN
        RETURN QUERY SELECT 
            500 AS status_code, 
            'ERROR: ' || SQLERRM AS message;
END;
$function$;
GRANT ALL ON FUNCTION public.handle_leave_approval(bigint, uuid, text, text, integer) TO anon;
GRANT ALL ON FUNCTION public.handle_leave_approval(bigint, uuid, text, text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.handle_leave_approval(bigint, uuid, text, text, integer) TO service_role;
CREATE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;$function$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;
CREATE FUNCTION public.is_manager_of_administration()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.departments d
    WHERE d.manager_id = auth.uid()
      AND d.id IN (303, 105)
      AND d.is_active = true
  );
$function$;
GRANT ALL ON FUNCTION public.is_manager_of_administration() TO anon;
GRANT ALL ON FUNCTION public.is_manager_of_administration() TO authenticated;
GRANT ALL ON FUNCTION public.is_manager_of_administration() TO service_role;
CREATE FUNCTION public.is_manager_of_feasibility()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.departments d
    WHERE d.manager_id = auth.uid()
      AND d.id IN (103)
      AND d.is_active = true
  );
$function$;
GRANT ALL ON FUNCTION public.is_manager_of_feasibility() TO anon;
GRANT ALL ON FUNCTION public.is_manager_of_feasibility() TO authenticated;
GRANT ALL ON FUNCTION public.is_manager_of_feasibility() TO service_role;
CREATE FUNCTION public.is_manager_of_specific_departments()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.departments d
    WHERE d.manager_id = auth.uid()
      AND d.id IN (1, 30, 301, 302, 303)
      AND d.is_active = true
  );
$function$;
GRANT ALL ON FUNCTION public.is_manager_of_specific_departments() TO anon;
GRANT ALL ON FUNCTION public.is_manager_of_specific_departments() TO authenticated;
GRANT ALL ON FUNCTION public.is_manager_of_specific_departments() TO service_role;
CREATE FUNCTION public.manager_of_feasibility_departments()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.departments d
    WHERE d.manager_id = auth.uid()
      AND d.id IN (103, 105) -- added 104 software department for development purpose
      AND d.is_active = true
  );
$function$;
GRANT ALL ON FUNCTION public.manager_of_feasibility_departments() TO anon;
GRANT ALL ON FUNCTION public.manager_of_feasibility_departments() TO authenticated;
GRANT ALL ON FUNCTION public.manager_of_feasibility_departments() TO service_role;
CREATE FUNCTION public.manager_of_spanco_departments()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.departments d
    WHERE d.manager_id = auth.uid()
      AND d.id IN (1, 20, 201, 202, 2011, 2012, 2013, 2014)
      AND d.is_active = true
  );
$function$;
GRANT ALL ON FUNCTION public.manager_of_spanco_departments() TO anon;
GRANT ALL ON FUNCTION public.manager_of_spanco_departments() TO authenticated;
GRANT ALL ON FUNCTION public.manager_of_spanco_departments() TO service_role;
CREATE FUNCTION public.mark_checklist_completed()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Set is_completed flag
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.is_completed := true;
    NEW.completed_at := COALESCE(NEW.completed_at, now());
  ELSIF NEW.status != 'completed' THEN
    NEW.is_completed := false;
  END IF;
  
  -- Set started_at when moving to in_progress
  IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status = 'pending') AND NEW.started_at IS NULL THEN
    NEW.started_at := now();
  END IF;
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.mark_checklist_completed() TO anon;
GRANT ALL ON FUNCTION public.mark_checklist_completed() TO authenticated;
GRANT ALL ON FUNCTION public.mark_checklist_completed() TO service_role;
CREATE FUNCTION public.mark_daily_attendance()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    -- Change: Use previous day's date
    current_date_tz DATE := (NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '1 day')::date;
    current_day_name TEXT := LOWER(TRIM(TO_CHAR(current_date_tz, 'Day')));
BEGIN
    INSERT INTO public.attendance (employee_id, date, status, is_weekend, is_holiday, attendance_type)
    SELECT
        p.id,
        current_date_tz,
        CASE
            -- Priority order: Leave > Holiday > Weekend > Absent
            WHEN la.id IS NOT NULL THEN 'leave'
            WHEN h.id IS NOT NULL OR ehs.id IS NOT NULL THEN 'holiday'
            WHEN (ws.weekdays IS NULL AND current_day_name = 'sunday') 
                 OR (ws.weekdays IS NOT NULL AND NOT (current_day_name = ANY(ws.weekdays))) 
                 THEN 'weekend'
            ELSE 'absent'
        END AS status,
        (ws.weekdays IS NULL AND current_day_name = 'sunday') 
        OR (ws.weekdays IS NOT NULL AND NOT (current_day_name = ANY(ws.weekdays))) 
        AS is_weekend,
        (h.id IS NOT NULL OR ehs.id IS NOT NULL) AS is_holiday,
        'system_generated' AS attendance_type
    FROM public.profiles p
    INNER JOIN public.work_schedules ws ON p.id = ws.employee_id
    -- Check for approved leaves
    LEFT JOIN LATERAL (
        SELECT 1 AS id
        FROM public.leave_applications la
        WHERE p.id = la.employee_id
            AND current_date_tz BETWEEN la.start_date AND la.end_date
            AND la.status = 'approved'
        LIMIT 1
    ) la ON true
    -- Check for mandatory holidays (department-specific or national)
    LEFT JOIN LATERAL (
        SELECT 1 AS id
        FROM public.holidays h
        WHERE h.holiday_date = current_date_tz
            AND h.is_active
            AND h.is_optional = false  -- Mandatory holidays only
            AND (
                h.applicable_departments IS NULL 
                OR p.department = ANY(h.applicable_departments)
            )
            AND h.calendar_year = EXTRACT(YEAR FROM current_date_tz)
        LIMIT 1
    ) h ON true
    -- Check for approved optional holidays
    LEFT JOIN LATERAL (
        SELECT 1 AS id
        FROM public.employee_holiday_selections ehs
        INNER JOIN public.holidays h ON ehs.holiday_id = h.id
            AND h.holiday_date = current_date_tz
            AND h.is_optional = true
        WHERE ehs.employee_id = p.id
            AND ehs.selected_date = current_date_tz
            AND ehs.status = 'approved'
        LIMIT 1
    ) ehs ON true
    WHERE p.is_active
        AND NOT EXISTS (
            SELECT 1
            FROM public.attendance a
            WHERE a.employee_id = p.id
                AND a.date = current_date_tz
        );
END;
$function$;
GRANT ALL ON FUNCTION public.mark_daily_attendance() TO anon;
GRANT ALL ON FUNCTION public.mark_daily_attendance() TO authenticated;
GRANT ALL ON FUNCTION public.mark_daily_attendance() TO service_role;
CREATE FUNCTION public.member_of_spanco_departments()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.departments d ON d.id = p.department
    WHERE p.id = auth.uid()
      AND p.department IN (1, 20, 105, 201, 202, 2011, 2012, 2013, 2014)
      AND d.is_active = true
      AND p.is_active = true
  );
$function$;
GRANT ALL ON FUNCTION public.member_of_spanco_departments() TO anon;
GRANT ALL ON FUNCTION public.member_of_spanco_departments() TO authenticated;
GRANT ALL ON FUNCTION public.member_of_spanco_departments() TO service_role;
CREATE FUNCTION public.reject_document_request(p_request_id bigint, p_reviewer_id uuid, p_rejection_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE requests SET
    status           = 'rejected',
    reviewed_by      = p_reviewer_id,
    reviewed_at      = now(),
    rejection_reason = p_rejection_reason,
    updated_at       = now()
  WHERE id = p_request_id
    AND status IN ('pending', 'under_review');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already actioned';
  END IF;
END;
$function$;
GRANT ALL ON FUNCTION public.reject_document_request(bigint, uuid, text) TO anon;
GRANT ALL ON FUNCTION public.reject_document_request(bigint, uuid, text) TO authenticated;
GRANT ALL ON FUNCTION public.reject_document_request(bigint, uuid, text) TO service_role;
CREATE FUNCTION public.submit_leave_application(p_employee_id uuid, p_leave_type_id smallint, p_start_date date, p_end_date date, p_total_days numeric, p_reason text, p_applied_by uuid, p_approval_levels smallint DEFAULT 2, p_calendar_year smallint DEFAULT NULL::smallint, p_current_time timestamp with time zone DEFAULT now())
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  overlap_exists boolean;
  new_application_id bigint;
BEGIN
  -- Set p_calendar_year to the year of p_start_date if it is not provided
  IF p_calendar_year IS NULL THEN
    p_calendar_year := EXTRACT(YEAR FROM p_start_date)::smallint;
  END IF;

  -- 1. Check for date clashes
  SELECT EXISTS(
    SELECT 1
    FROM public.leave_applications
    WHERE employee_id = p_employee_id
      AND status IN ('approved', 'pending')
      AND (p_start_date, p_end_date) OVERLAPS (start_date, end_date)
  ) INTO overlap_exists;

  IF overlap_exists THEN
    RETURN json_build_object('success', false, 'message', 'Selected dates conflict with existing leave application');
  END IF;

  -- 2. Insert new leave application
  INSERT INTO public.leave_applications (
    employee_id, leave_type_id, start_date, end_date, total_days, reason,
    applied_by, approval_levels, status, created_at
  ) VALUES (
    p_employee_id, p_leave_type_id, p_start_date, p_end_date, p_total_days, p_reason,
    p_applied_by, p_approval_levels, 'pending', p_current_time
  ) RETURNING id INTO new_application_id;

  -- 3. Update pending days in balance
  UPDATE public.employee_leave_balances
  SET pending_days = pending_days + p_total_days,
      updated_at = p_current_time
  WHERE employee_id = p_employee_id
    AND leave_type_id = p_leave_type_id
    AND calendar_year = p_calendar_year;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No leave balance record found for employee: %, leave type: %, year: %', 
                    p_employee_id, p_leave_type_id, p_calendar_year;
  END IF;

  RETURN json_build_object('success', true, 'application_id', new_application_id);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$function$;
GRANT ALL ON FUNCTION public.submit_leave_application(uuid, smallint, date, date, numeric, text, uuid, smallint, smallint, timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.submit_leave_application(uuid, smallint, date, date, numeric, text, uuid, smallint, smallint, timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.submit_leave_application(uuid, smallint, date, date, numeric, text, uuid, smallint, smallint, timestamp with time zone) TO service_role;
CREATE FUNCTION public.sync_department_response()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  parent_record RECORD;
BEGIN
  -- Calculate is_overdue
  IF NEW.sla_hours IS NOT NULL AND NEW.status != 'completed' THEN
    NEW.is_overdue := EXTRACT(EPOCH FROM (now() - NEW.assigned_at))/3600 > NEW.sla_hours;
  ELSE
    NEW.is_overdue := false;
  END IF;
  
  -- Set completed_at when status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at := now();
  END IF;
  
  -- Set started_at when status changes from pending
  IF NEW.status = 'in_review' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    NEW.started_at := now();
  END IF;
  
  -- When completed, update parent feasibility_requests table
  IF NEW.status = 'completed' AND NEW.responded_by IS NOT NULL THEN
    
    -- Get all department IDs from parent record in one query
    SELECT 
      inventory_department_id,
      noc_department_id,
      feasibility_department_id,
      field_ops_department_id,
      finance_department_id
    INTO parent_record
    FROM feasibility_requests
    WHERE id = NEW.feasibility_request_id;
    
    -- Update based on which department this is (null-safe)
    IF parent_record.inventory_department_id IS NOT NULL 
       AND parent_record.inventory_department_id = NEW.department_id THEN
      
      UPDATE feasibility_requests
      SET 
        inventory_status = NEW.response_result,
        inventory_remarks = NEW.remarks,
        inventory_reviewed_by = NEW.responded_by,
        inventory_reviewed_at = NEW.responded_at
      WHERE id = NEW.feasibility_request_id;
      
    ELSIF parent_record.noc_department_id IS NOT NULL 
          AND parent_record.noc_department_id = NEW.department_id THEN
      
      UPDATE feasibility_requests
      SET 
        noc_status = NEW.response_result,
        noc_remarks = NEW.remarks,
        noc_reviewed_by = NEW.responded_by,
        noc_reviewed_at = NEW.responded_at
      WHERE id = NEW.feasibility_request_id;
      
    ELSIF parent_record.feasibility_department_id IS NOT NULL 
          AND parent_record.feasibility_department_id = NEW.department_id THEN
      
      UPDATE feasibility_requests
      SET 
        feasibility_status = NEW.response_result,
        feasibility_remarks = NEW.remarks,
        feasibility_reviewed_by = NEW.responded_by,
        feasibility_reviewed_at = NEW.responded_at
      WHERE id = NEW.feasibility_request_id;
      
    ELSIF parent_record.field_ops_department_id IS NOT NULL 
          AND parent_record.field_ops_department_id = NEW.department_id THEN
      
      UPDATE feasibility_requests
      SET 
        field_ops_status = NEW.response_result,
        field_ops_remarks = NEW.remarks,
        field_ops_reviewed_by = NEW.responded_by,
        field_ops_reviewed_at = NEW.responded_at
      WHERE id = NEW.feasibility_request_id;
      
    ELSIF parent_record.finance_department_id IS NOT NULL 
          AND parent_record.finance_department_id = NEW.department_id THEN
      
      -- Extract financial data from JSONB (with null safety)
      UPDATE feasibility_requests
      SET 
        finance_status = NEW.response_result,
        finance_remarks = NEW.remarks,
        finance_reviewed_by = NEW.responded_by,
        finance_reviewed_at = NEW.responded_at,
        estimated_capex = COALESCE(
          NULLIF(NEW.response_data->>'capex', '')::numeric, 
          estimated_capex
        ),
        estimated_opex = COALESCE(
          NULLIF(NEW.response_data->>'opex', '')::numeric, 
          estimated_opex
        ),
        estimated_roi_months = COALESCE(
          NULLIF(NEW.response_data->>'roi_months', '')::integer, 
          estimated_roi_months
        )
      WHERE id = NEW.feasibility_request_id;
      
    END IF;
    -- If department_id doesn't match any configured departments, nothing happens (graceful)
    
  END IF;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.sync_department_response() IS 'Syncs department response to parent feasibility_requests. Uses dynamic department mapping from parent record. Null-safe: handles missing department IDs gracefully.';
GRANT ALL ON FUNCTION public.sync_department_response() TO anon;
GRANT ALL ON FUNCTION public.sync_department_response() TO authenticated;
GRANT ALL ON FUNCTION public.sync_department_response() TO service_role;
CREATE FUNCTION public.sync_quotation_conversion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- INSERT: New order from quotation
  IF TG_OP = 'INSERT' AND NEW.quotation_id IS NOT NULL THEN
    UPDATE quotations
    SET 
      converted_to_order = true,
      order_id = NEW.id,
      converted_at = now(),
      status = 'accepted'
    WHERE id = NEW.quotation_id
      AND converted_to_order = false;
  
  -- UPDATE: Handle quotation_id changes
  ELSIF TG_OP = 'UPDATE' THEN
    
    -- Unlink old quotation (if changed or removed)
    IF OLD.quotation_id IS NOT NULL AND (NEW.quotation_id IS NULL OR OLD.quotation_id != NEW.quotation_id) THEN
      UPDATE quotations
      SET 
        converted_to_order = false,
        order_id = NULL,
        converted_at = NULL
      WHERE id = OLD.quotation_id
        AND order_id = NEW.id; -- FIXED: Use NEW.id (same as OLD.id in UPDATE)
    END IF;
    
    -- Link new quotation (if changed or newly set)
    IF NEW.quotation_id IS NOT NULL AND (OLD.quotation_id IS NULL OR OLD.quotation_id != NEW.quotation_id) THEN
      UPDATE quotations
      SET 
        converted_to_order = true,
        order_id = NEW.id,
        converted_at = now(),
        status = 'accepted'
      WHERE id = NEW.quotation_id
        AND (converted_to_order = false OR order_id IS NULL);
    END IF;
  
  -- DELETE: Unlink quotation when order is deleted
  ELSIF TG_OP = 'DELETE' AND OLD.quotation_id IS NOT NULL THEN
    UPDATE quotations
    SET 
      converted_to_order = false,
      order_id = NULL,
      converted_at = NULL,
      status = 'sent' -- Revert to 'sent' so it can be re-quoted
    WHERE id = OLD.quotation_id
      AND order_id = OLD.id;
    
    RETURN OLD; -- Must return OLD for DELETE trigger
  END IF;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.sync_quotation_conversion() IS 'Bidirectionally syncs order ↔ quotation conversion status. Handles INSERT, UPDATE, DELETE, and re-linking scenarios. Unlinks quotation if order is deleted.';
GRANT ALL ON FUNCTION public.sync_quotation_conversion() TO anon;
GRANT ALL ON FUNCTION public.sync_quotation_conversion() TO authenticated;
GRANT ALL ON FUNCTION public.sync_quotation_conversion() TO service_role;
CREATE FUNCTION public.track_spanco_stage_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  days_in_stage integer;
BEGIN
  -- Only track if stage actually changed
  IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
    
    -- Calculate days in previous stage
    days_in_stage := EXTRACT(DAY FROM (now() - OLD.stage_updated_at))::integer;
    
    -- Insert into history table
    INSERT INTO spanco_stage_history (
      lead_id, 
      from_stage, 
      to_stage, 
      changed_by,
      days_in_previous_stage,
      changed_at
    )
    VALUES (
      NEW.id, 
      OLD.current_stage, 
      NEW.current_stage, 
      auth.uid(),
      days_in_stage,
      now()
    );
    
    -- Update stage_updated_at
    NEW.stage_updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.track_spanco_stage_change() TO anon;
GRANT ALL ON FUNCTION public.track_spanco_stage_change() TO authenticated;
GRANT ALL ON FUNCTION public.track_spanco_stage_change() TO service_role;
CREATE FUNCTION public.unblock_dependent_items()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  affected_rows integer;
BEGIN
  -- Only proceed if status changed to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Find all items in this order that depend on the completed item
    -- and trigger a re-check of their dependencies
    WITH dependent_items AS (
      SELECT id
      FROM order_processing_checklist
      WHERE order_id = NEW.order_id
        AND id != NEW.id
        AND NEW.id = ANY(depends_on_item_ids)
        AND status = 'blocked'
        AND (blocked_by IS NULL OR blocked_by LIKE 'Dependency:%')
    )
    UPDATE order_processing_checklist
    SET 
      -- Force a re-check by updating a timestamp
      -- The check_checklist_dependencies trigger will handle the rest
      updated_at = now()
    WHERE id IN (SELECT id FROM dependent_items);
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Optional: Log for debugging
    IF affected_rows > 0 THEN
      RAISE NOTICE 'Unblocked % dependent item(s) after completing "%"', affected_rows, NEW.item_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.unblock_dependent_items() IS 'When an item is completed, triggers re-evaluation of dependent blocked items. The check_checklist_dependencies trigger handles the actual unblocking.';
GRANT ALL ON FUNCTION public.unblock_dependent_items() TO anon;
GRANT ALL ON FUNCTION public.unblock_dependent_items() TO authenticated;
GRANT ALL ON FUNCTION public.unblock_dependent_items() TO service_role;
CREATE FUNCTION public.update_approval_chain_overdue()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.sla_hours IS NOT NULL AND NEW.status = 'pending' THEN
    NEW.is_overdue := EXTRACT(EPOCH FROM (now() - NEW.assigned_at))/3600 > NEW.sla_hours;
  ELSE
    NEW.is_overdue := false;
  END IF;
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.update_approval_chain_overdue() TO anon;
GRANT ALL ON FUNCTION public.update_approval_chain_overdue() TO authenticated;
GRANT ALL ON FUNCTION public.update_approval_chain_overdue() TO service_role;
CREATE FUNCTION public.update_approval_from_chain()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  next_approver RECORD;
  all_approved boolean;
  any_rejected boolean;
BEGIN
  -- When an approver makes a decision
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    
    -- Check if rejected
    IF NEW.status = 'rejected' THEN
      UPDATE business_approvals
      SET 
        status = 'rejected',
        final_status = 'rejected',
        final_approved_by = NEW.approver_id,
        final_approved_at = now(),
        final_remarks = NEW.decision_remarks,
        completed_at = now()
      WHERE id = NEW.approval_id;
      
      RETURN NEW;
    END IF;
    
    -- Check if all approvals in current level are complete
    IF NEW.status = 'approved' THEN
      
      -- Get the next pending approver at the next level
      SELECT * INTO next_approver
      FROM business_approval_chain
      WHERE approval_id = NEW.approval_id
        AND approver_level = NEW.approver_level + 1
        AND status = 'pending'
      ORDER BY approver_level, id
      LIMIT 1;
      
      -- Check if there are any remaining approvals at current level
      IF NOT EXISTS (
        SELECT 1 FROM business_approval_chain
        WHERE approval_id = NEW.approval_id
          AND approver_level = NEW.approver_level
          AND status = 'pending'
      ) THEN
        
        -- Current level complete, move to next level
        IF next_approver IS NOT NULL THEN
          -- Update parent to point to next approver
          UPDATE business_approvals
          SET 
            current_approver_id = next_approver.approver_id,
            current_approver_department = next_approver.department_id,
            current_approval_level = next_approver.approver_level,
            assigned_at = now(),
            status = 'in_progress'
          WHERE id = NEW.approval_id;
          
        ELSE
          -- No more approvers, check if all approved
          SELECT 
            bool_and(status = 'approved') as all_approved,
            bool_or(status = 'rejected') as any_rejected
          INTO all_approved, any_rejected
          FROM business_approval_chain
          WHERE approval_id = NEW.approval_id;
          
          IF all_approved AND NOT any_rejected THEN
            -- All approved!
            UPDATE business_approvals
            SET 
              status = 'approved',
              final_status = 'approved',
              final_approved_by = NEW.approver_id,
              final_approved_at = now(),
              completed_at = now()
            WHERE id = NEW.approval_id;
          END IF;
        END IF;
        
      END IF;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.update_approval_from_chain() TO anon;
GRANT ALL ON FUNCTION public.update_approval_from_chain() TO authenticated;
GRANT ALL ON FUNCTION public.update_approval_from_chain() TO service_role;
CREATE FUNCTION public.update_business_approval_overdue()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.sla_hours IS NOT NULL AND NEW.status NOT IN ('approved', 'rejected', 'cancelled') THEN
    NEW.is_overdue := EXTRACT(EPOCH FROM (now() - NEW.created_at))/3600 > NEW.sla_hours;
  ELSE
    NEW.is_overdue := false;
  END IF;
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.update_business_approval_overdue() TO anon;
GRANT ALL ON FUNCTION public.update_business_approval_overdue() TO authenticated;
GRANT ALL ON FUNCTION public.update_business_approval_overdue() TO service_role;
CREATE FUNCTION public.update_checklist_overdue()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.due_at IS NOT NULL AND NEW.is_completed = false THEN
    NEW.is_overdue := now() > NEW.due_at;
  ELSE
    NEW.is_overdue := false;
  END IF;
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.update_checklist_overdue() TO anon;
GRANT ALL ON FUNCTION public.update_checklist_overdue() TO authenticated;
GRANT ALL ON FUNCTION public.update_checklist_overdue() TO service_role;
CREATE FUNCTION public.update_feasibility_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- When manager marks as feasible
  IF NEW.is_feasible = true AND OLD.is_feasible IS DISTINCT FROM NEW.is_feasible THEN
    NEW.status := 'approved';
    IF NEW.reviewed_at IS NULL THEN
      NEW.reviewed_at := now();
    END IF;
  END IF;
  
  -- When manager marks as not feasible
  IF NEW.is_feasible = false AND OLD.is_feasible IS DISTINCT FROM NEW.is_feasible THEN
    NEW.status := 'rejected';
    IF NEW.reviewed_at IS NULL THEN
      NEW.reviewed_at := now();
    END IF;
  END IF;
  
  -- When reviewed_by is set, mark as under_review
  IF NEW.reviewed_by IS NOT NULL AND NEW.status = 'pending' THEN
    NEW.status := 'under_review';
  END IF;
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.update_feasibility_status() TO anon;
GRANT ALL ON FUNCTION public.update_feasibility_status() TO authenticated;
GRANT ALL ON FUNCTION public.update_feasibility_status() TO service_role;
CREATE FUNCTION public.update_order_on_customer_creation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Link back to sales_order if order_id is provided
  IF NEW.order_id IS NOT NULL THEN
    UPDATE sales_orders
    SET 
      customer_id = NEW.customer_id,
      status = 'activated' -- Mark order as activated
    WHERE id = NEW.order_id
      AND status != 'activated'; -- Only if not already activated
  END IF;
  
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.update_order_on_customer_creation() IS 'Updates sales_orders.customer_id when customer record is created';
GRANT ALL ON FUNCTION public.update_order_on_customer_creation() TO anon;
GRANT ALL ON FUNCTION public.update_order_on_customer_creation() TO authenticated;
GRANT ALL ON FUNCTION public.update_order_on_customer_creation() TO service_role;
CREATE FUNCTION public.update_order_status_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status != OLD.status THEN
    NEW.status_updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.update_order_status_timestamp() TO anon;
GRANT ALL ON FUNCTION public.update_order_status_timestamp() TO authenticated;
GRANT ALL ON FUNCTION public.update_order_status_timestamp() TO service_role;
CREATE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;
CREATE TABLE public.attendance (id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL, employee_id uuid NOT NULL, punch_in timestamp without time zone, punch_out timestamp without time zone, remarks text, punch_in_location text, punch_out_location text, date date, status text DEFAULT 'present'::text, is_weekend boolean DEFAULT false, is_holiday boolean DEFAULT false, is_regularized boolean DEFAULT false, attendance_type text, is_late boolean DEFAULT false, late_minutes smallint DEFAULT '0'::smallint, is_early_departure boolean DEFAULT false, early_departure_minutes smallint DEFAULT '0'::smallint, work_hours numeric DEFAULT '0'::numeric, comment text);
-- public.attendance_id_seq is created automatically by GENERATED BY DEFAULT AS IDENTITY
GRANT ALL ON SEQUENCE public.attendance_id_seq TO anon;
GRANT ALL ON SEQUENCE public.attendance_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.attendance_id_seq TO service_role;
COMMENT ON COLUMN public.attendance.status IS 'present'', ''absent'', ''comp-off'', ''comp-w'', ''half_day'', ''late'', ''early_departure, ''on_leave''';
COMMENT ON COLUMN public.attendance.attendance_type IS 'regular'', ''holiday'', ''comp-off-earned'', ''comp-off-used'', ''leave'', ''wfm''';
COMMENT ON COLUMN public.attendance.late_minutes IS 'count from start if punch in is out of grace period';
COMMENT ON COLUMN public.attendance.is_early_departure IS 'to check early punch out before min_work_hours or end_time';
COMMENT ON COLUMN public.attendance.work_hours IS 'for total work hours of employee in a day';
COMMENT ON COLUMN public.attendance.comment IS 'for specific use only for MD or CEO';
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_employee_date_unique UNIQUE (employee_id, date);
ALTER TABLE public.attendance ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);
GRANT ALL ON public.attendance TO anon;
GRANT ALL ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
CREATE POLICY "Denied" ON public.attendance FOR DELETE USING (false);
CREATE POLICY "Insertable by user and specific managers" ON public.attendance FOR INSERT WITH CHECK (((employee_id = auth.uid()) OR public.is_manager_of_specific_departments()));
CREATE TABLE public.attendance_regularizations (id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone, attendance_id bigint, employee_id uuid, regularization_type text, original_punch_in timestamp with time zone, original_punch_out timestamp with time zone, requested_punch_in timestamp with time zone, requested_punch_out timestamp with time zone, reason text, applied_by uuid, status text DEFAULT 'pending'::text, approval_levels smallint DEFAULT '1'::smallint, level_1_approver_id uuid, level_1_status text DEFAULT 'pending'::text, level_1_action_at timestamp with time zone, level_1_comments text, level_2_approver_id uuid, level_2_status text, level_2_action_at timestamp with time zone, level_2_comments text, level_3_approver_id uuid, level_3_status text, level_3_action_at timestamp with time zone, level_3_comments text, final_approved_at timestamp with time zone);
COMMENT ON COLUMN public.attendance_regularizations.regularization_type IS 'late_arrival, missed_swipe, outdoor_client_visit, other';
COMMENT ON COLUMN public.attendance_regularizations.status IS '''pending'', ''approved'', ''rejected'', ''cancelled''';
COMMENT ON COLUMN public.attendance_regularizations.level_1_status IS '''pending'', ''approved'', ''rejected'', ''bypassed''';
ALTER TABLE public.attendance_regularizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_regularizations ADD CONSTRAINT attendance_regularizations_pkey PRIMARY KEY (id);
GRANT ALL ON public.attendance_regularizations TO anon;
GRANT ALL ON public.attendance_regularizations TO authenticated;
GRANT ALL ON public.attendance_regularizations TO service_role;
CREATE POLICY "Specific department managers can delete" ON public.attendance_regularizations FOR DELETE USING (public.is_manager_of_specific_departments());
CREATE TABLE public.business_approval_chain (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, approval_id bigint NOT NULL, approver_id uuid NOT NULL, approver_level integer NOT NULL, approver_role text NOT NULL, department_id smallint, status text DEFAULT 'pending'::text NOT NULL, reviewed_at timestamp with time zone, decision text, decision_remarks text, conditions text, attached_documents jsonb DEFAULT '[]'::jsonb, delegated_to uuid, delegation_reason text, delegated_at timestamp with time zone, assigned_at timestamp with time zone DEFAULT now(), sla_hours integer, due_at timestamp with time zone, is_overdue boolean DEFAULT false, escalation_count integer DEFAULT 0, can_be_parallel boolean DEFAULT false, requires_all_at_level boolean DEFAULT false);
COMMENT ON TABLE public.business_approval_chain IS 'Multi-level approval chain for business approvals. Supports sequential, parallel, and conditional approval workflows with unlimited hierarchy levels.';
COMMENT ON COLUMN public.business_approval_chain.approver_level IS 'Sequence level: 1 = first approver, 2 = second approver, etc. Can have multiple approvers at same level for parallel approval.';
COMMENT ON COLUMN public.business_approval_chain.can_be_parallel IS 'If true, multiple approvers at this level can review simultaneously';
COMMENT ON COLUMN public.business_approval_chain.requires_all_at_level IS 'If true, all approvers at this level must approve before moving to next level';
ALTER TABLE public.business_approval_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_approval_chain ADD CONSTRAINT business_approval_chain_pkey PRIMARY KEY (id);
ALTER TABLE public.business_approval_chain ADD CONSTRAINT valid_chain_status CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'skipped'::text, 'delegated'::text]));
ALTER TABLE public.business_approval_chain ADD CONSTRAINT valid_decision CHECK (decision = ANY (ARRAY['approved'::text, 'rejected'::text, 'revision_required'::text, 'escalated'::text]));
GRANT ALL ON public.business_approval_chain TO anon;
GRANT ALL ON public.business_approval_chain TO authenticated;
GRANT ALL ON public.business_approval_chain TO service_role;
CREATE TRIGGER update_approval_chain_overdue_trigger BEFORE UPDATE ON public.business_approval_chain FOR EACH ROW EXECUTE FUNCTION public.update_approval_chain_overdue();
CREATE TRIGGER update_approval_from_chain_trigger AFTER UPDATE ON public.business_approval_chain FOR EACH ROW EXECUTE FUNCTION public.update_approval_from_chain();
CREATE TABLE public.business_approvals (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, approval_number text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, lead_id bigint NOT NULL, feasibility_id bigint, approval_type text NOT NULL, requested_by uuid NOT NULL, requesting_department smallint NOT NULL, requested_at timestamp with time zone DEFAULT now() NOT NULL, request_reason text, subject text NOT NULL, description text, deal_value numeric(12,2), monthly_recurring_revenue numeric(12,2), onetime_charges numeric(12,2), installation_charges numeric(10,2), security_deposit numeric(10,2), discount_amount numeric(12,2), discount_percentage numeric(5,2), discount_justification text, capex_required numeric(12,2), contract_value numeric(12,2), contract_period_months integer, customer_lifetime_value numeric(12,2), expected_roi_months integer, payback_period_months integer, profit_margin_percentage numeric(5,2), strategic_importance text, payment_terms text, special_conditions text, billing_cycle text, advance_payment_required boolean DEFAULT false, advance_payment_months integer, current_approver_id uuid, current_approver_department smallint, current_approval_level integer DEFAULT 1, total_approval_levels integer DEFAULT 1, assigned_at timestamp with time zone, status text DEFAULT 'pending'::text NOT NULL, final_status text, final_approved_by uuid, final_approved_at timestamp with time zone, final_remarks text, completed_at timestamp with time zone, risk_level text, risk_factors text, mitigation_plan text, compliance_check_required boolean DEFAULT false, legal_review_required boolean DEFAULT false, priority text DEFAULT 'normal'::text, sla_hours integer, due_date timestamp with time zone, is_overdue boolean DEFAULT false, attachments jsonb DEFAULT '[]'::jsonb, notes text, revision_count integer DEFAULT 0);
COMMENT ON TABLE public.business_approvals IS 'Multi-level business approval workflow for pricing, discounts, CAPEX, and commercial terms. Supports sequential and parallel approval chains.';
COMMENT ON COLUMN public.business_approvals.lead_id IS 'Foreign key to spanco_leads table (bigint to match leads.id)';
COMMENT ON COLUMN public.business_approvals.approval_type IS 'Type: pricing_approval, discount_approval, capex_approval, contract_approval, special_terms, waiver_approval, credit_approval';
COMMENT ON COLUMN public.business_approvals.current_approval_level IS 'Current level in the approval chain (1, 2, 3, ...). Updated automatically as approvals progress.';
COMMENT ON COLUMN public.business_approvals.status IS 'Overall approval status. Changes from pending → in_progress → approved/rejected as chain progresses.';
ALTER TABLE public.business_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_approvals ADD CONSTRAINT business_approvals_approval_number_key UNIQUE (approval_number);
ALTER TABLE public.business_approvals ADD CONSTRAINT business_approvals_pkey PRIMARY KEY (id);
ALTER TABLE public.business_approval_chain ADD CONSTRAINT business_approval_chain_approval_id_fkey FOREIGN KEY (approval_id) REFERENCES public.business_approvals(id) ON DELETE CASCADE;
ALTER TABLE public.business_approvals ADD CONSTRAINT valid_approval_status CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'approved'::text, 'rejected'::text, 'escalated'::text, 'revision_required'::text, 'cancelled'::text]));
ALTER TABLE public.business_approvals ADD CONSTRAINT valid_priority CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]));
ALTER TABLE public.business_approvals ADD CONSTRAINT valid_strategic_importance CHECK (strategic_importance = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'strategic'::text, 'critical'::text]));
GRANT ALL ON public.business_approvals TO anon;
GRANT ALL ON public.business_approvals TO authenticated;
GRANT ALL ON public.business_approvals TO service_role;
CREATE TRIGGER generate_approval_number_trigger BEFORE INSERT ON public.business_approvals FOR EACH ROW WHEN (new.approval_number IS NULL) EXECUTE FUNCTION public.generate_approval_number();
CREATE TRIGGER update_business_approval_overdue_trigger BEFORE UPDATE ON public.business_approvals FOR EACH ROW EXECUTE FUNCTION public.update_business_approval_overdue();
CREATE TRIGGER update_business_approvals_updated_at BEFORE UPDATE ON public.business_approvals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY business_approvals_delete_policy ON public.business_approvals FOR DELETE USING ((((requested_by = auth.uid()) AND (status = 'pending'::text)) OR public.is_manager_of_administration()));
CREATE TABLE public.customer_documents (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, lead_id bigint, order_id bigint, customer_id bigint, document_type text NOT NULL, document_category text NOT NULL, document_name text NOT NULL, document_description text, file_url text NOT NULL, file_type text, file_size_bytes bigint, document_number text, document_issuer text, document_issue_date date, document_expiry_date date, is_expired boolean DEFAULT false, uploaded_by uuid NOT NULL, uploaded_at timestamp with time zone DEFAULT now() NOT NULL, upload_source text DEFAULT 'manual'::text, verification_status text DEFAULT 'pending'::text NOT NULL, verified_by uuid, verified_at timestamp with time zone, verification_remarks text, rejection_reason text, is_valid boolean DEFAULT true, is_mandatory boolean DEFAULT false, is_sensitive boolean DEFAULT true, retention_period_years integer DEFAULT 7, can_be_deleted_after date, version_number integer DEFAULT 1, superseded_by_document_id bigint, is_latest_version boolean DEFAULT true, tags text[], search_keywords text, metadata jsonb DEFAULT '{}'::jsonb);
COMMENT ON TABLE public.customer_documents IS 'Centralized document repository for customer KYC, agreements, compliance, and service documents with verification workflow';
COMMENT ON COLUMN public.customer_documents.document_number IS 'Document ID number (Aadhar, PAN, Passport number, etc.)';
COMMENT ON COLUMN public.customer_documents.is_expired IS 'Auto-calculated by trigger: true if document_expiry_date has passed';
COMMENT ON COLUMN public.customer_documents.can_be_deleted_after IS 'Auto-calculated by trigger: Date after which document can be deleted per retention policy';
COMMENT ON COLUMN public.customer_documents.superseded_by_document_id IS 'Links to newer version if this document has been replaced';
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents ADD CONSTRAINT at_least_one_entity_link CHECK (lead_id IS NOT NULL OR order_id IS NOT NULL OR customer_id IS NOT NULL);
ALTER TABLE public.customer_documents ADD CONSTRAINT customer_documents_pkey PRIMARY KEY (id);
ALTER TABLE public.customer_documents ADD CONSTRAINT customer_documents_superseded_by_document_id_fkey FOREIGN KEY (superseded_by_document_id) REFERENCES public.customer_documents(id);
ALTER TABLE public.customer_documents ADD CONSTRAINT valid_document_category CHECK (document_category = ANY (ARRAY['kyc'::text, 'address_proof'::text, 'business'::text, 'financial'::text, 'legal'::text, 'billing'::text, 'other'::text]));
ALTER TABLE public.customer_documents ADD CONSTRAINT valid_verification_status CHECK (verification_status = ANY (ARRAY['pending'::text, 'in_review'::text, 'verified'::text, 'rejected'::text, 'expired'::text, 'requires_update'::text]));
GRANT ALL ON public.customer_documents TO anon;
GRANT ALL ON public.customer_documents TO authenticated;
GRANT ALL ON public.customer_documents TO service_role;
CREATE TRIGGER calculate_document_dates_trigger BEFORE INSERT OR UPDATE ON public.customer_documents FOR EACH ROW EXECUTE FUNCTION public.calculate_document_dates();
CREATE TRIGGER handle_document_versioning_trigger BEFORE UPDATE ON public.customer_documents FOR EACH ROW EXECUTE FUNCTION public.handle_document_versioning();
CREATE TRIGGER update_customer_documents_updated_at BEFORE UPDATE ON public.customer_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY customer_docs_delete_policy ON public.customer_documents FOR DELETE USING ((public.is_manager_of_administration() OR ((can_be_deleted_after < CURRENT_DATE) AND (is_sensitive = false))));
CREATE POLICY customer_docs_insert_policy ON public.customer_documents FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND ((uploaded_by = auth.uid()) OR public.is_manager_of_administration())));
CREATE TABLE public.customers (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, customer_id text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, lead_id bigint, order_id bigint, customer_type text NOT NULL, customer_category text DEFAULT 'retail'::text, customer_name text NOT NULL, contact_person text, contact_phone text NOT NULL, contact_email text, alternate_phone text, alternate_email text, company_name text, gstin text, pan text, tan text, business_registration_number text, business_type text, billing_address text NOT NULL, billing_city text NOT NULL, billing_state text NOT NULL, billing_pincode text NOT NULL, service_address text NOT NULL, service_city text NOT NULL, service_state text NOT NULL, service_pincode text NOT NULL, service_latitude numeric(10,8), service_longitude numeric(11,8), same_as_billing_address boolean DEFAULT false, plan_name text NOT NULL, bandwidth text NOT NULL, connection_type text NOT NULL, monthly_rental numeric(10,2) NOT NULL, status text DEFAULT 'active'::text NOT NULL, status_reason text, status_changed_at timestamp with time zone, status_changed_by uuid, service_start_date date NOT NULL, service_end_date date, contract_period_months integer DEFAULT 12, next_renewal_date date, billing_cycle text DEFAULT 'monthly'::text, payment_mode text, security_deposit numeric(10,2) DEFAULT 0, outstanding_balance numeric(12,2) DEFAULT 0, last_payment_date date, last_invoice_date date, customer_connection_id text, ont_serial_number text, router_serial_number text, ip_address text, mac_address text, vlan_id text, port_number text, pop_connected text, account_manager_id uuid, assigned_sales_rep_id uuid, customer_since date DEFAULT CURRENT_DATE, lifetime_value numeric(12,2) DEFAULT 0, total_revenue_generated numeric(12,2) DEFAULT 0, average_monthly_revenue numeric(10,2), payment_history_score integer, average_uptime_percentage numeric(5,2), total_complaints integer DEFAULT 0, total_service_requests integer DEFAULT 0, last_complaint_date date, last_service_request_date date, preferred_communication_channel text DEFAULT 'phone'::text, allow_marketing_communication boolean DEFAULT true, preferred_language text DEFAULT 'english'::text, notes text, internal_notes text, tags text[], metadata jsonb DEFAULT '{}'::jsonb);
COMMENT ON TABLE public.customers IS 'Master customer registry for activated customers with ongoing service, billing, and relationship management';
COMMENT ON COLUMN public.customers.customer_id IS 'Unique customer identifier (CUST-2025-0001)';
COMMENT ON COLUMN public.customers.customer_connection_id IS 'Unique service connection/account number';
COMMENT ON COLUMN public.customers.lifetime_value IS 'Total expected revenue from customer over entire relationship';
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ADD CONSTRAINT customers_customer_connection_id_key UNIQUE (customer_connection_id);
ALTER TABLE public.customers ADD CONSTRAINT customers_customer_id_key UNIQUE (customer_id);
ALTER TABLE public.customers ADD CONSTRAINT customers_payment_history_score_check CHECK (payment_history_score >= 0 AND payment_history_score <= 100);
ALTER TABLE public.customers ADD CONSTRAINT customers_pkey PRIMARY KEY (id);
ALTER TABLE public.customer_documents ADD CONSTRAINT customer_documents_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD CONSTRAINT valid_customer_status CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'temporarily_disconnected'::text, 'terminated'::text, 'migrated'::text]));
ALTER TABLE public.customers ADD CONSTRAINT valid_customer_type CHECK (customer_type = ANY (ARRAY['individual'::text, 'business'::text, 'enterprise'::text, 'government'::text]));
GRANT ALL ON public.customers TO anon;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
CREATE TRIGGER calculate_customer_metrics_trigger BEFORE INSERT OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.calculate_customer_metrics();
CREATE TRIGGER calculate_customer_renewal_date_trigger BEFORE INSERT OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.calculate_customer_renewal_date();
CREATE TRIGGER generate_customer_id_trigger BEFORE INSERT ON public.customers FOR EACH ROW WHEN (new.customer_id IS NULL) EXECUTE FUNCTION public.generate_customer_id();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_on_customer_creation_trigger AFTER INSERT ON public.customers FOR EACH ROW WHEN (new.order_id IS NOT NULL) EXECUTE FUNCTION public.update_order_on_customer_creation();
CREATE POLICY customers_delete_policy ON public.customers FOR DELETE USING (public.is_manager_of_administration());
CREATE TABLE public.departments (id smallint GENERATED BY DEFAULT AS IDENTITY NOT NULL, name text NOT NULL, code text NOT NULL, description text, parent_id smallint, level smallint DEFAULT 1 NOT NULL, path text, manager_id uuid, department_type text DEFAULT 'operational'::text NOT NULL, service_area text, shift_type text DEFAULT 'business_hours'::text, cost_center text NOT NULL, annual_budget numeric(15,2) DEFAULT 0, max_headcount smallint, is_active boolean DEFAULT true NOT NULL, effective_from date DEFAULT CURRENT_DATE NOT NULL, effective_until date, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, created_by uuid, updated_by uuid);
CREATE FUNCTION public.get_department_subtree(root_id smallint)
 RETURNS SETOF public.departments
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$

BEGIN
  RETURN QUERY
  WITH RECURSIVE dept_tree AS (
    SELECT * FROM public.departments WHERE id = root_id
    UNION ALL
    SELECT d.* 
    FROM public.departments d
    INNER JOIN dept_tree dt ON d.parent_id = dt.id
  )
  SELECT * FROM dept_tree;
END;
$function$;
GRANT ALL ON FUNCTION public.get_department_subtree(smallint) TO anon;
GRANT ALL ON FUNCTION public.get_department_subtree(smallint) TO authenticated;
GRANT ALL ON FUNCTION public.get_department_subtree(smallint) TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ADD CONSTRAINT departments_annual_budget_check CHECK (annual_budget >= 0::numeric);
ALTER TABLE public.departments ADD CONSTRAINT departments_code_key UNIQUE (code);
ALTER TABLE public.departments ADD CONSTRAINT departments_department_type_check CHECK (department_type = ANY (ARRAY['executive'::text, 'operational'::text, 'technical'::text, 'customer_facing'::text, 'support'::text]));
ALTER TABLE public.departments ADD CONSTRAINT departments_no_self_reference CHECK (id <> parent_id);
ALTER TABLE public.departments ADD CONSTRAINT departments_pkey PRIMARY KEY (id);
ALTER TABLE public.business_approval_chain ADD CONSTRAINT business_approval_chain_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.business_approvals ADD CONSTRAINT business_approvals_current_approver_department_fkey FOREIGN KEY (current_approver_department) REFERENCES public.departments(id);
ALTER TABLE public.business_approvals ADD CONSTRAINT business_approvals_requesting_department_fkey FOREIGN KEY (requesting_department) REFERENCES public.departments(id);
ALTER TABLE public.departments ADD CONSTRAINT departments_shift_type_check CHECK (shift_type = ANY (ARRAY['business_hours'::text, '24x7'::text, 'rotating_shifts'::text, 'field_work'::text]));
ALTER TABLE public.departments ADD CONSTRAINT departments_valid_dates CHECK (effective_until IS NULL OR effective_until > effective_from);
GRANT ALL ON public.departments TO anon;
GRANT ALL ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
CREATE POLICY "Denied" ON public.departments FOR DELETE USING (false);
CREATE POLICY "Specific department manager can insert" ON public.departments FOR INSERT WITH CHECK (public.is_manager_of_specific_departments());
CREATE POLICY "Specific department manager can update" ON public.departments FOR UPDATE USING (public.is_manager_of_specific_departments());
CREATE POLICY "Viewable active and all for specific managers" ON public.departments FOR SELECT USING (((is_active = true) OR public.is_manager_of_specific_departments()));
CREATE TABLE public.employee_holiday_selections (id smallint GENERATED BY DEFAULT AS IDENTITY NOT NULL, employee_id uuid NOT NULL, holiday_id smallint NOT NULL, selected_date date NOT NULL, status text DEFAULT 'pending'::text, applied_at timestamp with time zone DEFAULT timezone('utc'::text, now()), approved_by uuid, approved_at timestamp with time zone, remarks text);
ALTER TABLE public.employee_holiday_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_holiday_selections ADD CONSTRAINT employee_holiday_selections_pkey PRIMARY KEY (id);
ALTER TABLE public.employee_holiday_selections ADD CONSTRAINT employee_holiday_selections_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'taken'::text]));
ALTER TABLE public.employee_holiday_selections ADD CONSTRAINT employee_holiday_selections_unique UNIQUE (employee_id, holiday_id, selected_date);
GRANT ALL ON public.employee_holiday_selections TO anon;
GRANT ALL ON public.employee_holiday_selections TO authenticated;
GRANT ALL ON public.employee_holiday_selections TO service_role;
CREATE POLICY "Specific department managers can delete" ON public.employee_holiday_selections FOR DELETE USING (public.is_manager_of_specific_departments());
CREATE TABLE public.employee_leave_balances (id smallint GENERATED BY DEFAULT AS IDENTITY NOT NULL, employee_id uuid NOT NULL, leave_type_id smallint NOT NULL, calendar_year smallint NOT NULL, allocated_days numeric DEFAULT 0 NOT NULL, used_days numeric DEFAULT 0 NOT NULL, pending_days numeric DEFAULT 0 NOT NULL, carried_forward_days numeric DEFAULT 0 NOT NULL, encashed_days numeric DEFAULT 0 NOT NULL, expired_days numeric DEFAULT 0 NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone, available_days numeric GENERATED ALWAYS AS (((allocated_days + carried_forward_days) - (((used_days + pending_days) + encashed_days) + expired_days))) STORED, next_year_days numeric DEFAULT '0'::numeric);
COMMENT ON COLUMN public.employee_leave_balances.next_year_days IS 'to keep records of advance use of next year days';
ALTER TABLE public.employee_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_balances ADD CONSTRAINT employee_leave_balances_pkey PRIMARY KEY (id);
ALTER TABLE public.employee_leave_balances ADD CONSTRAINT employee_leave_balances_unique_constraint UNIQUE (employee_id, leave_type_id, calendar_year);
GRANT ALL ON public.employee_leave_balances TO anon;
GRANT ALL ON public.employee_leave_balances TO authenticated;
GRANT ALL ON public.employee_leave_balances TO service_role;
CREATE POLICY "Specific department manager can delete" ON public.employee_leave_balances FOR DELETE USING (public.is_manager_of_specific_departments());
CREATE POLICY "Specific department manager can insert" ON public.employee_leave_balances FOR INSERT WITH CHECK (public.is_manager_of_specific_departments());
CREATE TABLE public.feasibility_department_responses (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, feasibility_request_id bigint NOT NULL, department_id smallint NOT NULL, department_name text NOT NULL, assigned_at timestamp with time zone DEFAULT now() NOT NULL, assigned_by uuid NOT NULL, assigned_to uuid, status text DEFAULT 'pending'::text NOT NULL, response_result text, response_data jsonb DEFAULT '{}'::jsonb, remarks text, recommendation text, conditions text, risk_factors text, confidence_level text, responded_by uuid, responded_at timestamp with time zone, sequence_order integer DEFAULT 0, sla_hours integer, is_mandatory boolean DEFAULT true, is_overdue boolean DEFAULT false, started_at timestamp with time zone, completed_at timestamp with time zone, attachments jsonb DEFAULT '[]'::jsonb);
ALTER TABLE public.feasibility_department_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_department_responses ADD CONSTRAINT feasibility_department_responses_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.feasibility_department_responses ADD CONSTRAINT feasibility_dept_responses_pkey PRIMARY KEY (id);
ALTER TABLE public.feasibility_department_responses ADD CONSTRAINT unique_feasibility_dept UNIQUE (feasibility_request_id, department_id);
ALTER TABLE public.feasibility_department_responses ADD CONSTRAINT valid_response_result CHECK (response_result = ANY (ARRAY['approved'::text, 'rejected'::text, 'conditional'::text, 'available'::text, 'unavailable'::text, 'feasible'::text, 'not_feasible'::text]));
ALTER TABLE public.feasibility_department_responses ADD CONSTRAINT valid_status CHECK (status = ANY (ARRAY['pending'::text, 'in_review'::text, 'completed'::text, 'escalated'::text]));
GRANT ALL ON public.feasibility_department_responses TO anon;
GRANT ALL ON public.feasibility_department_responses TO authenticated;
GRANT ALL ON public.feasibility_department_responses TO service_role;
CREATE TRIGGER sync_dept_response_trigger BEFORE UPDATE ON public.feasibility_department_responses FOR EACH ROW EXECUTE FUNCTION public.sync_department_response();
CREATE POLICY dept_response_delete_policy ON public.feasibility_department_responses FOR DELETE USING (public.is_manager_of_administration());
CREATE POLICY dept_response_insert_policy ON public.feasibility_department_responses FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND ((assigned_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.departments d
  WHERE ((d.id = feasibility_department_responses.department_id) AND (d.manager_id = auth.uid())))) OR public.is_manager_of_administration())));
CREATE POLICY dept_response_update_policy ON public.feasibility_department_responses FOR UPDATE USING (((assigned_to = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.departments d
  WHERE ((d.id = feasibility_department_responses.department_id) AND (d.manager_id = auth.uid())))) OR public.is_manager_of_administration())) WITH CHECK (((assigned_to = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.departments d
  WHERE ((d.id = feasibility_department_responses.department_id) AND (d.manager_id = auth.uid())))) OR public.is_manager_of_administration()));
CREATE TABLE public.feasibility_requests (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, request_number text NOT NULL, lead_id bigint NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, requested_by uuid NOT NULL, requesting_department smallint NOT NULL, requested_at timestamp with time zone DEFAULT now() NOT NULL, service_location jsonb NOT NULL, service_requirements jsonb NOT NULL, primary_route jsonb, secondary_route jsonb, site_survey jsonb, status text DEFAULT 'pending'::text NOT NULL, is_feasible boolean, feasibility_remarks text, reviewed_by uuid, reviewed_at timestamp with time zone, estimated_capex numeric(12,2), estimated_opex numeric(12,2), estimated_roi_months integer, is_commercially_viable boolean, commercial_remarks text, estimated_installation_days integer, expected_completion_date date, attachments jsonb DEFAULT '[]'::jsonb NOT NULL, operational_costs jsonb, status_history jsonb DEFAULT '[]'::jsonb NOT NULL);
COMMENT ON COLUMN public.feasibility_requests.operational_costs IS 'JSONB array of operational cost items with category, description, monthly cost, etc.';
ALTER TABLE public.feasibility_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_requests ADD CONSTRAINT feasibility_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.feasibility_requests ADD CONSTRAINT feasibility_requests_request_number_key UNIQUE (request_number);
ALTER TABLE public.feasibility_requests ADD CONSTRAINT feasibility_requests_requesting_department_fkey FOREIGN KEY (requesting_department) REFERENCES public.departments(id);
ALTER TABLE public.feasibility_requests ADD CONSTRAINT valid_status CHECK (status = ANY (ARRAY['pending'::text, 'under_review'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text]));
GRANT ALL ON public.feasibility_requests TO anon;
GRANT ALL ON public.feasibility_requests TO authenticated;
GRANT ALL ON public.feasibility_requests TO service_role;
CREATE TRIGGER generate_feasibility_number_trigger BEFORE INSERT ON public.feasibility_requests FOR EACH ROW EXECUTE FUNCTION public.generate_feasibility_number();
CREATE TRIGGER track_feasibility_status_changes BEFORE UPDATE ON public.feasibility_requests FOR EACH ROW WHEN (old.status IS DISTINCT FROM new.status) EXECUTE FUNCTION public.add_feasibility_status_history();
CREATE TRIGGER update_feasibility_requests_updated_at BEFORE UPDATE ON public.feasibility_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY feasibility_requests_delete_policy ON public.feasibility_requests FOR DELETE TO authenticated USING (false);
CREATE POLICY feasibility_requests_insert_policy ON public.feasibility_requests FOR INSERT TO authenticated WITH CHECK (public.member_of_spanco_departments());
CREATE POLICY feasibility_requests_update_policy ON public.feasibility_requests FOR UPDATE TO authenticated USING (((requested_by = auth.uid()) OR public.manager_of_feasibility_departments())) WITH CHECK (((requested_by = auth.uid()) OR public.manager_of_feasibility_departments()));
CREATE TABLE public.holidays (id smallint GENERATED BY DEFAULT AS IDENTITY NOT NULL, holiday_date date NOT NULL, title text NOT NULL, description text, holiday_type text DEFAULT 'national'::text, is_national boolean DEFAULT false, is_optional boolean DEFAULT false, is_active boolean DEFAULT true, is_recurring boolean DEFAULT false, applicable_departments smallint[], compensation_type text DEFAULT 'paid'::text, requires_approval boolean DEFAULT false, max_employees_per_day smallint, calendar_year smallint DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone);
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ADD CONSTRAINT holidays_compensation_type_check CHECK (compensation_type = ANY (ARRAY['paid'::text, 'unpaid'::text, 'half_day'::text]));
ALTER TABLE public.holidays ADD CONSTRAINT holidays_holiday_type_check CHECK (holiday_type = ANY (ARRAY['national'::text, 'regional'::text, 'religious'::text, 'company'::text, 'floating'::text]));
ALTER TABLE public.holidays ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);
ALTER TABLE public.employee_holiday_selections ADD CONSTRAINT employee_holiday_selections_holiday_id_fkey FOREIGN KEY (holiday_id) REFERENCES public.holidays(id) ON DELETE CASCADE;
ALTER TABLE public.holidays ADD CONSTRAINT holidays_unique_entry UNIQUE (holiday_date, holiday_type, calendar_year, title);
GRANT ALL ON public.holidays TO anon;
GRANT ALL ON public.holidays TO authenticated;
GRANT ALL ON public.holidays TO service_role;
CREATE POLICY "Specific department manager can delete" ON public.holidays FOR DELETE USING (public.is_manager_of_specific_departments());
CREATE POLICY "Specific department manager can insert" ON public.holidays FOR INSERT WITH CHECK (public.is_manager_of_specific_departments());
CREATE POLICY "Specific department manager can update" ON public.holidays FOR UPDATE USING (public.is_manager_of_specific_departments());
CREATE POLICY "Viewable for everyone" ON public.holidays FOR SELECT USING (true);
CREATE TABLE public.leave_allocation_rules (id smallint GENERATED BY DEFAULT AS IDENTITY NOT NULL, leave_type_id smallint NOT NULL, employee_level text, years_of_service_min smallint, years_of_service_max smallint, monthly_accrual numeric, annual_allocation numeric NOT NULL, is_active boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone);
ALTER TABLE public.leave_allocation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_allocation_rules ADD CONSTRAINT leave_allocation_rules_pkey PRIMARY KEY (id);
GRANT ALL ON public.leave_allocation_rules TO anon;
GRANT ALL ON public.leave_allocation_rules TO authenticated;
GRANT ALL ON public.leave_allocation_rules TO service_role;
CREATE POLICY "Specific department manager can do all" ON public.leave_allocation_rules USING (public.is_manager_of_specific_departments());
CREATE TABLE public.leave_applications (id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL, employee_id uuid NOT NULL, leave_type_id smallint, start_date date NOT NULL, end_date date NOT NULL, total_days numeric NOT NULL, reason text, applied_by uuid NOT NULL, status text DEFAULT 'pending'::text NOT NULL, approval_levels smallint DEFAULT 2 NOT NULL, level_1_approver_id uuid, level_1_status text DEFAULT 'pending'::text, level_1_action_at timestamp with time zone, level_1_comments text, level_2_approver_id uuid, level_2_status text, level_2_action_at timestamp with time zone, level_2_comments text, level_3_approver_id uuid, level_3_status text, level_3_action_at timestamp with time zone, level_3_comments text, final_approved_at timestamp with time zone, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone);
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_applications ADD CONSTRAINT leave_applications_dates_check CHECK (end_date >= start_date);
ALTER TABLE public.leave_applications ADD CONSTRAINT leave_applications_pkey PRIMARY KEY (id);
GRANT ALL ON public.leave_applications TO anon;
GRANT ALL ON public.leave_applications TO authenticated;
GRANT ALL ON public.leave_applications TO service_role;
CREATE POLICY "Specific department manager can delete" ON public.leave_applications FOR SELECT USING (public.is_manager_of_specific_departments());
CREATE TABLE public.leave_types (id smallint GENERATED BY DEFAULT AS IDENTITY NOT NULL, leave_code text NOT NULL, leave_name text NOT NULL, description text, is_carry_forward boolean DEFAULT false NOT NULL, max_carry_forward numeric DEFAULT 0, is_encashable boolean DEFAULT false NOT NULL, max_consecutive_days smallint, requires_document boolean DEFAULT false NOT NULL, notice_period_days smallint DEFAULT 1 NOT NULL, approval_levels smallint DEFAULT 2 NOT NULL, is_active boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone);
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ADD CONSTRAINT leave_types_leave_code_key UNIQUE (leave_code);
ALTER TABLE public.leave_types ADD CONSTRAINT leave_types_pkey PRIMARY KEY (id);
ALTER TABLE public.employee_leave_balances ADD CONSTRAINT employee_leave_balances_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id) ON DELETE RESTRICT;
ALTER TABLE public.leave_allocation_rules ADD CONSTRAINT leave_allocation_rules_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id) ON DELETE CASCADE;
ALTER TABLE public.leave_applications ADD CONSTRAINT leave_applications_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id) ON DELETE CASCADE;
GRANT ALL ON public.leave_types TO anon;
GRANT ALL ON public.leave_types TO authenticated;
GRANT ALL ON public.leave_types TO service_role;
CREATE POLICY "Specific department manager can delete" ON public.leave_types FOR DELETE USING (public.is_manager_of_specific_departments());
CREATE POLICY "Specific department manager can insert" ON public.leave_types FOR INSERT WITH CHECK (public.is_manager_of_specific_departments());
CREATE POLICY "Specific department manager can update" ON public.leave_types FOR UPDATE USING (public.is_manager_of_specific_departments());
CREATE POLICY "Viewable by everyone which is active and all for specific" ON public.leave_types FOR SELECT USING (((is_active = true) OR public.is_manager_of_specific_departments()));
CREATE TABLE public.order_processing_checklist (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, order_id bigint NOT NULL, category text NOT NULL, item_name text NOT NULL, item_description text, sequence_order integer NOT NULL, status text DEFAULT 'pending'::text NOT NULL, is_mandatory boolean DEFAULT true, is_completed boolean DEFAULT false, responsible_department_id smallint, assigned_to uuid, assigned_at timestamp with time zone, started_at timestamp with time zone, completed_by uuid, completed_at timestamp with time zone, completion_remarks text, depends_on_item_ids bigint[], blocked_by text, expected_completion_hours integer, due_at timestamp with time zone, is_overdue boolean DEFAULT false, requires_verification boolean DEFAULT false, verified_by uuid, verified_at timestamp with time zone, verification_remarks text, is_verified boolean DEFAULT false, failure_reason text, retry_count integer DEFAULT 0, max_retries integer DEFAULT 3, attachments jsonb DEFAULT '[]'::jsonb, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.order_processing_checklist IS 'Granular checklist for order processing with dependencies, SLA tracking, verification, and failure handling';
COMMENT ON COLUMN public.order_processing_checklist.sequence_order IS 'Global sequence order across all categories (1, 2, 3...)';
COMMENT ON COLUMN public.order_processing_checklist.depends_on_item_ids IS 'Array of checklist item IDs that must be completed before this item can start';
COMMENT ON COLUMN public.order_processing_checklist.blocked_by IS 'Human-readable explanation of what is blocking this item';
ALTER TABLE public.order_processing_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_processing_checklist ADD CONSTRAINT order_processing_checklist_pkey PRIMARY KEY (id);
ALTER TABLE public.order_processing_checklist ADD CONSTRAINT order_processing_checklist_responsible_department_id_fkey FOREIGN KEY (responsible_department_id) REFERENCES public.departments(id);
ALTER TABLE public.order_processing_checklist ADD CONSTRAINT valid_checklist_category CHECK (category = ANY (ARRAY['documentation'::text, 'payment'::text, 'installation'::text, 'activation'::text, 'billing'::text, 'handover'::text, 'quality_check'::text]));
ALTER TABLE public.order_processing_checklist ADD CONSTRAINT valid_checklist_status CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'skipped'::text, 'failed'::text, 'blocked'::text]));
GRANT ALL ON public.order_processing_checklist TO anon;
GRANT ALL ON public.order_processing_checklist TO authenticated;
GRANT ALL ON public.order_processing_checklist TO service_role;
CREATE TRIGGER check_checklist_dependencies_trigger BEFORE INSERT OR UPDATE ON public.order_processing_checklist FOR EACH ROW EXECUTE FUNCTION public.check_checklist_dependencies();
CREATE TRIGGER mark_checklist_completed_trigger BEFORE UPDATE ON public.order_processing_checklist FOR EACH ROW EXECUTE FUNCTION public.mark_checklist_completed();
CREATE TRIGGER unblock_dependent_items_trigger AFTER UPDATE ON public.order_processing_checklist FOR EACH ROW WHEN (new.status = 'completed'::text AND old.status IS DISTINCT FROM 'completed'::text) EXECUTE FUNCTION public.unblock_dependent_items();
CREATE TRIGGER update_checklist_overdue_trigger BEFORE INSERT OR UPDATE ON public.order_processing_checklist FOR EACH ROW EXECUTE FUNCTION public.update_checklist_overdue();
CREATE TRIGGER update_checklist_updated_at BEFORE UPDATE ON public.order_processing_checklist FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY checklist_delete_policy ON public.order_processing_checklist FOR DELETE USING (public.is_manager_of_administration());
CREATE POLICY checklist_update_policy ON public.order_processing_checklist FOR UPDATE USING (((assigned_to = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM managed_departments md
  WHERE (md.id = order_processing_checklist.responsible_department_id))) OR public.is_manager_of_administration())) WITH CHECK (((assigned_to = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM managed_departments md
  WHERE (md.id = order_processing_checklist.responsible_department_id))) OR public.is_manager_of_administration()));
CREATE TABLE public.positions (id smallint GENERATED BY DEFAULT AS IDENTITY NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, designation text, main_department_id smallint, code text, description text, job_family text, is_active boolean, min_salary numeric, max_salary numeric, requirements jsonb, responsibilities jsonb, level text);
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ADD CONSTRAINT positions_pkey PRIMARY KEY (id);
GRANT ALL ON public.positions TO anon;
GRANT ALL ON public.positions TO authenticated;
GRANT ALL ON public.positions TO service_role;
CREATE POLICY "Denied" ON public.positions FOR DELETE USING (false);
CREATE POLICY "Positions viewable for everyone if active but specific departme" ON public.positions FOR SELECT USING (((is_active = true) OR public.is_manager_of_specific_departments()));
CREATE POLICY "Specifi department manager can update" ON public.positions FOR UPDATE USING (public.is_manager_of_specific_departments());
CREATE POLICY "Specific department manager can insert" ON public.positions FOR INSERT WITH CHECK (public.is_manager_of_specific_departments());
CREATE TABLE public.profile_details (id bigint DEFAULT nextval('public.profile_details_id_seq'::regclass) NOT NULL, user_id uuid NOT NULL, aadhaar_number text, aadhaar_url text, pan_number text, pan_url text, passport_number text, passport_url text, father_name text, mother_name text, spouse_name text, children jsonb DEFAULT '[]'::jsonb, nominees jsonb DEFAULT '[]'::jsonb, cancelled_cheque_url text, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, passbook_url text, aadhaar_back_url text, bank_details jsonb, date_of_birth date, marital_status text, current_address text, permanent_address text);
ALTER SEQUENCE public.profile_details_id_seq OWNED BY public.profile_details.id;
GRANT ALL ON SEQUENCE public.profile_details_id_seq TO anon;
GRANT ALL ON SEQUENCE public.profile_details_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.profile_details_id_seq TO service_role;
ALTER TABLE public.profile_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_details ADD CONSTRAINT profile_details_pkey PRIMARY KEY (id);
ALTER TABLE public.profile_details ADD CONSTRAINT profile_details_user_id_key UNIQUE (user_id);
GRANT ALL ON public.profile_details TO anon;
GRANT ALL ON public.profile_details TO authenticated;
GRANT ALL ON public.profile_details TO service_role;
CREATE POLICY profile_details_insert ON public.profile_details FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY profile_details_select ON public.profile_details FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.is_manager_of_administration()));
CREATE POLICY profile_details_update ON public.profile_details FOR UPDATE TO authenticated USING (public.is_manager_of_administration());
CREATE TABLE public.profiles (id uuid NOT NULL, updated_at timestamp with time zone, employee_code text, full_name text, avatar_url text, email text, phone text, app_access boolean DEFAULT false, ov_username text, ov_password text, device_id text, new_device_id text, geofencing boolean DEFAULT true, date_of_birth date, gender text DEFAULT 'Male'::text, marital_status text, current_address text, permanent_address text, emergency_contacts jsonb, employment_type text DEFAULT 'Full Time'::text, is_active boolean DEFAULT true, "position" smallint, department smallint, date_of_joining date DEFAULT '2025-04-01'::date, approval_levels smallint DEFAULT '2'::smallint, device_info jsonb, new_device_info jsonb, web_access boolean DEFAULT false);
CREATE POLICY "Updatable in hierarchy and specific managers" ON public.attendance FOR UPDATE USING (((employee_id = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = attendance.employee_id))) OR public.is_manager_of_specific_departments()));
CREATE POLICY "Viewable in hierarchy and specific managers" ON public.attendance FOR SELECT USING (((employee_id = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = attendance.employee_id))) OR public.is_manager_of_specific_departments()));
CREATE POLICY "Insertable in hierarchy and specific managers" ON public.attendance_regularizations FOR INSERT WITH CHECK (((employee_id = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = attendance_regularizations.employee_id))) OR public.is_manager_of_specific_departments()));
CREATE POLICY "Updatable in hierarchy and specific managers" ON public.attendance_regularizations FOR UPDATE USING (((employee_id = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = attendance_regularizations.employee_id))) OR public.is_manager_of_specific_departments()));
CREATE POLICY "Viewable in hierarchy and specific managers" ON public.attendance_regularizations FOR SELECT USING (((employee_id = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = attendance_regularizations.employee_id))) OR public.is_manager_of_specific_departments()));
CREATE POLICY approval_chain_delete_policy ON public.business_approval_chain FOR DELETE USING (((EXISTS ( SELECT 1
   FROM public.business_approvals ba
  WHERE ((ba.id = business_approval_chain.approval_id) AND (ba.status = 'pending'::text) AND (ba.requested_by = auth.uid())))) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM ((managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
     JOIN public.business_approvals ba ON ((ba.requested_by = p.id)))
  WHERE ((ba.id = business_approval_chain.approval_id) AND (ba.status = 'pending'::text)))) OR public.is_manager_of_administration()));
CREATE POLICY approval_chain_insert_policy ON public.business_approval_chain FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM public.business_approvals ba
  WHERE ((ba.id = business_approval_chain.approval_id) AND (ba.requested_by = auth.uid()) AND (ba.status = 'pending'::text)))) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM ((managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
     JOIN public.business_approvals ba ON ((ba.requested_by = p.id)))
  WHERE (ba.id = business_approval_chain.approval_id))) OR public.is_manager_of_administration())));
CREATE POLICY approval_chain_select_policy ON public.business_approval_chain FOR SELECT USING (((approver_id = auth.uid()) OR (delegated_to = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.business_approvals ba
  WHERE ((ba.id = business_approval_chain.approval_id) AND (ba.requested_by = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM ((public.business_approvals ba
     JOIN public.profiles p ON ((ba.requested_by = p.id)))
     JOIN public.departments d ON ((p.department = d.id)))
  WHERE ((ba.id = business_approval_chain.approval_id) AND (d.manager_id = auth.uid())))) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM ((managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
     JOIN public.business_approvals ba ON ((ba.requested_by = p.id)))
  WHERE (ba.id = business_approval_chain.approval_id))) OR public.is_manager_of_administration()));
CREATE POLICY approval_chain_update_policy ON public.business_approval_chain FOR UPDATE USING ((((approver_id = auth.uid()) AND (status = 'pending'::text)) OR ((delegated_to = auth.uid()) AND (status = 'pending'::text)) OR (EXISTS ( SELECT 1
   FROM (public.profiles p
     JOIN public.departments d ON ((p.department = d.id)))
  WHERE ((p.id = business_approval_chain.approver_id) AND (d.manager_id = auth.uid())))) OR public.is_manager_of_administration())) WITH CHECK (((approver_id = auth.uid()) OR (delegated_to = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (public.profiles p
     JOIN public.departments d ON ((p.department = d.id)))
  WHERE ((p.id = business_approval_chain.approver_id) AND (d.manager_id = auth.uid())))) OR public.is_manager_of_administration()));
CREATE POLICY business_approvals_insert_policy ON public.business_approvals FOR INSERT WITH CHECK (((requested_by = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = business_approvals.requested_by))) OR public.is_manager_of_administration()));
CREATE POLICY business_approvals_select_policy ON public.business_approvals FOR SELECT USING (((requested_by = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = business_approvals.requested_by))) OR (current_approver_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.business_approval_chain bac
  WHERE ((bac.approval_id = business_approvals.id) AND ((bac.approver_id = auth.uid()) OR (bac.delegated_to = auth.uid()))))) OR public.is_manager_of_administration()));
CREATE POLICY business_approvals_update_policy ON public.business_approvals FOR UPDATE USING ((((requested_by = auth.uid()) AND (status = 'pending'::text)) OR (current_approver_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.business_approval_chain bac
  WHERE ((bac.approval_id = business_approvals.id) AND ((bac.approver_id = auth.uid()) OR (bac.delegated_to = auth.uid())) AND (bac.status = 'pending'::text)))) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = business_approvals.requested_by))) OR public.is_manager_of_administration())) WITH CHECK (((requested_by = auth.uid()) OR (current_approver_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.business_approval_chain bac
  WHERE ((bac.approval_id = business_approvals.id) AND ((bac.approver_id = auth.uid()) OR (bac.delegated_to = auth.uid()))))) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = business_approvals.requested_by))) OR public.is_manager_of_administration()));
CREATE POLICY customer_docs_update_policy ON public.customer_documents FOR UPDATE USING ((((uploaded_by = auth.uid()) AND (verification_status = 'pending'::text)) OR (verification_status = ANY (ARRAY['pending'::text, 'in_review'::text])) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = customer_documents.uploaded_by))) OR public.is_manager_of_administration())) WITH CHECK (((uploaded_by = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = customer_documents.uploaded_by))) OR public.is_manager_of_administration()));
CREATE POLICY customers_insert_policy ON public.customers FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND ((account_manager_id = auth.uid()) OR (assigned_sales_rep_id = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = ANY (ARRAY[customers.account_manager_id, customers.assigned_sales_rep_id])))) OR public.is_manager_of_administration())));
CREATE POLICY customers_update_policy ON public.customers FOR UPDATE USING (((account_manager_id = auth.uid()) OR (assigned_sales_rep_id = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = ANY (ARRAY[customers.account_manager_id, customers.assigned_sales_rep_id])))) OR public.is_manager_of_administration())) WITH CHECK (((account_manager_id = auth.uid()) OR (assigned_sales_rep_id = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = ANY (ARRAY[customers.account_manager_id, customers.assigned_sales_rep_id])))) OR public.is_manager_of_administration()));
CREATE POLICY "Insertable in hierarchy and specific managers" ON public.employee_holiday_selections FOR INSERT WITH CHECK (((auth.uid() = employee_id) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = employee_holiday_selections.employee_id))) OR public.is_manager_of_specific_departments()));
CREATE POLICY "Updatable in hierarchy and specific managers" ON public.employee_holiday_selections FOR UPDATE USING (((auth.uid() = employee_id) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = employee_holiday_selections.employee_id))) OR public.is_manager_of_specific_departments()));
CREATE POLICY "Viewable in hierarchy and specific managers" ON public.employee_holiday_selections FOR SELECT USING (((auth.uid() = employee_id) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = employee_holiday_selections.employee_id))) OR public.is_manager_of_specific_departments()));
CREATE POLICY "Updatable in hierarchy and specific managers" ON public.employee_leave_balances FOR UPDATE USING (((auth.uid() = employee_id) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE ((p.id = employee_leave_balances.employee_id) AND (p.is_active = true)))) OR public.is_manager_of_specific_departments()));
CREATE POLICY "Viewable by everyone in hierarchy and specific managers" ON public.employee_leave_balances FOR SELECT USING (((auth.uid() = employee_id) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE ((p.id = employee_leave_balances.employee_id) AND (p.is_active = true)))) OR public.is_manager_of_specific_departments()));
CREATE POLICY feasibility_requests_select_policy ON public.feasibility_requests FOR SELECT TO authenticated USING (((requested_by = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = feasibility_requests.requested_by))) OR public.manager_of_feasibility_departments() OR public.is_manager_of_administration()));
CREATE POLICY "Insertable by user in hierarchy and specific managers" ON public.leave_applications FOR INSERT WITH CHECK (((auth.uid() = employee_id) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = leave_applications.employee_id))) OR public.is_manager_of_specific_departments()));
CREATE POLICY "Updatable within hierarchy and specific managers" ON public.leave_applications FOR UPDATE USING (((auth.uid() = employee_id) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = leave_applications.employee_id))) OR public.is_manager_of_specific_departments()));
CREATE POLICY "Viewable by everyone in hierarchy and specific manager" ON public.leave_applications FOR SELECT USING (((auth.uid() = employee_id) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = leave_applications.employee_id))) OR public.is_manager_of_specific_departments()));
COMMENT ON COLUMN public.profiles.device_id IS 'for device mapping';
COMMENT ON COLUMN public.profiles.employment_type IS 'full-time, part-time, contract, intern';
COMMENT ON COLUMN public.profiles.approval_levels IS 'for leave, regularization, etc';
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_department_fkey FOREIGN KEY (department) REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.attendance ADD CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.attendance_regularizations ADD CONSTRAINT attendance_regularizations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.business_approval_chain ADD CONSTRAINT business_approval_chain_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.profiles(id);
ALTER TABLE public.business_approval_chain ADD CONSTRAINT business_approval_chain_delegated_to_fkey FOREIGN KEY (delegated_to) REFERENCES public.profiles(id);
ALTER TABLE public.business_approvals ADD CONSTRAINT business_approvals_current_approver_id_fkey FOREIGN KEY (current_approver_id) REFERENCES public.profiles(id);
ALTER TABLE public.business_approvals ADD CONSTRAINT business_approvals_final_approved_by_fkey FOREIGN KEY (final_approved_by) REFERENCES public.profiles(id);
ALTER TABLE public.business_approvals ADD CONSTRAINT business_approvals_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id);
ALTER TABLE public.customer_documents ADD CONSTRAINT customer_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);
ALTER TABLE public.customer_documents ADD CONSTRAINT customer_documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.profiles(id);
ALTER TABLE public.customers ADD CONSTRAINT customers_account_manager_id_fkey FOREIGN KEY (account_manager_id) REFERENCES public.profiles(id);
ALTER TABLE public.customers ADD CONSTRAINT customers_assigned_sales_rep_id_fkey FOREIGN KEY (assigned_sales_rep_id) REFERENCES public.profiles(id);
ALTER TABLE public.customers ADD CONSTRAINT customers_status_changed_by_fkey FOREIGN KEY (status_changed_by) REFERENCES public.profiles(id);
ALTER TABLE public.departments ADD CONSTRAINT departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.employee_holiday_selections ADD CONSTRAINT employee_holiday_selections_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.employee_holiday_selections ADD CONSTRAINT employee_holiday_selections_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.employee_leave_balances ADD CONSTRAINT employee_leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.feasibility_department_responses ADD CONSTRAINT feasibility_department_responses_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id);
ALTER TABLE public.feasibility_department_responses ADD CONSTRAINT feasibility_department_responses_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);
ALTER TABLE public.feasibility_department_responses ADD CONSTRAINT feasibility_department_responses_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.profiles(id);
ALTER TABLE public.feasibility_requests ADD CONSTRAINT feasibility_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id);
ALTER TABLE public.feasibility_requests ADD CONSTRAINT feasibility_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id);
ALTER TABLE public.leave_applications ADD CONSTRAINT leave_applications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.order_processing_checklist ADD CONSTRAINT order_processing_checklist_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);
ALTER TABLE public.order_processing_checklist ADD CONSTRAINT order_processing_checklist_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.profiles(id);
ALTER TABLE public.order_processing_checklist ADD CONSTRAINT order_processing_checklist_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.profiles(id);
ALTER TABLE public.profile_details ADD CONSTRAINT profile_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_position_fkey FOREIGN KEY ("position") REFERENCES public.positions(id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (employee_code);
ALTER TABLE public.profiles ADD CONSTRAINT username_length CHECK (char_length(employee_code) >= 3);
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
CREATE POLICY "Denied" ON public.profiles FOR DELETE USING (false);
CREATE POLICY "Specific department manager can insert in the profiles" ON public.profiles FOR INSERT WITH CHECK (((id = auth.uid()) OR public.is_manager_of_specific_departments()));
CREATE POLICY "Specific department manager can update in the profiles" ON public.profiles FOR UPDATE USING (((id = auth.uid()) OR public.is_manager_of_specific_departments()));
CREATE POLICY "Viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE TABLE public.quotations (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, quotation_number text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, lead_id bigint NOT NULL, feasibility_id bigint, business_approval_id bigint, quotation_date date DEFAULT CURRENT_DATE, valid_until date, revision_number integer DEFAULT 1, parent_quotation_id bigint, prepared_by uuid NOT NULL, approved_by uuid, approved_at timestamp with time zone, customer_name text NOT NULL, customer_email text, customer_phone text, customer_address text, company_name text, gstin text, connection_type text NOT NULL, plan_name text NOT NULL, bandwidth text NOT NULL, service_type text, monthly_rental numeric(10,2) NOT NULL, installation_charges numeric(10,2) DEFAULT 0, equipment_charges numeric(10,2) DEFAULT 0, router_charges numeric(10,2) DEFAULT 0, ont_charges numeric(10,2) DEFAULT 0, static_ip_charges numeric(10,2) DEFAULT 0, other_charges numeric(10,2) DEFAULT 0, other_charges_description text, onetime_subtotal numeric(10,2), security_deposit numeric(10,2) DEFAULT 0, discount_percentage numeric(5,2) DEFAULT 0, discount_amount numeric(10,2) DEFAULT 0, discount_remarks text, taxable_amount numeric(10,2) NOT NULL, cgst_percentage numeric(5,2) DEFAULT 9, cgst_amount numeric(10,2), sgst_percentage numeric(5,2) DEFAULT 9, sgst_amount numeric(10,2), igst_percentage numeric(5,2) DEFAULT 18, igst_amount numeric(10,2), onetime_total_with_tax numeric(10,2) NOT NULL, total_payable_now numeric(10,2) NOT NULL, contract_period_months integer DEFAULT 12, total_contract_value numeric(12,2), payment_terms text, billing_cycle text DEFAULT 'monthly'::text, advance_payment_required boolean DEFAULT false, advance_payment_months integer, terms_and_conditions text, special_notes text, inclusions text[], exclusions text[], uptime_guarantee text, support_type text, response_time text, resolution_time text, status text DEFAULT 'draft'::text NOT NULL, sent_at timestamp with time zone, sent_by uuid, sent_to_email text, viewed_at timestamp with time zone, viewed_count integer DEFAULT 0, accepted_at timestamp with time zone, accepted_by_name text, acceptance_remarks text, rejected_at timestamp with time zone, rejection_reason text, rejection_remarks text, converted_to_order boolean DEFAULT false, order_id bigint, converted_at timestamp with time zone, attachments jsonb DEFAULT '[]'::jsonb, pdf_url text, is_final_quote boolean DEFAULT false, remarks text);
COMMENT ON TABLE public.quotations IS 'Quotations/proposals generated for leads after feasibility approval. Supports revisions, tax calculations, and conversion tracking.';
COMMENT ON COLUMN public.quotations.business_approval_id IS 'Links to business_approvals if this quotation required approval (e.g., special discount, custom pricing)';
COMMENT ON COLUMN public.quotations.security_deposit IS 'Refundable deposit - NOT included in taxable amount, shown separately in total_payable_now';
COMMENT ON COLUMN public.quotations.onetime_total_with_tax IS 'One-time charges after discount + GST (excludes security deposit)';
COMMENT ON COLUMN public.quotations.total_payable_now IS 'Total payable at installation: onetime_total_with_tax + security_deposit';
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ADD CONSTRAINT quotations_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id);
ALTER TABLE public.quotations ADD CONSTRAINT quotations_business_approval_id_fkey FOREIGN KEY (business_approval_id) REFERENCES public.business_approvals(id);
ALTER TABLE public.quotations ADD CONSTRAINT quotations_pkey PRIMARY KEY (id);
ALTER TABLE public.quotations ADD CONSTRAINT quotations_parent_quotation_id_fkey FOREIGN KEY (parent_quotation_id) REFERENCES public.quotations(id);
ALTER TABLE public.quotations ADD CONSTRAINT quotations_prepared_by_fkey FOREIGN KEY (prepared_by) REFERENCES public.profiles(id);
ALTER TABLE public.quotations ADD CONSTRAINT quotations_quotation_number_key UNIQUE (quotation_number);
ALTER TABLE public.quotations ADD CONSTRAINT quotations_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES public.profiles(id);
ALTER TABLE public.quotations ADD CONSTRAINT valid_quotation_status CHECK (status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'approved'::text, 'sent'::text, 'viewed'::text, 'accepted'::text, 'rejected'::text, 'expired'::text, 'revised'::text]));
GRANT ALL ON public.quotations TO anon;
GRANT ALL ON public.quotations TO authenticated;
GRANT ALL ON public.quotations TO service_role;
CREATE TRIGGER calculate_quotation_totals_trigger BEFORE INSERT OR UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.calculate_quotation_totals();
CREATE TRIGGER generate_quotation_number_trigger BEFORE INSERT ON public.quotations FOR EACH ROW WHEN (new.quotation_number IS NULL) EXECUTE FUNCTION public.generate_quotation_number();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY quotations_delete_policy ON public.quotations FOR DELETE TO authenticated USING ((((prepared_by = auth.uid()) AND (status = 'draft'::text)) OR public.is_manager_of_administration()));
CREATE POLICY quotations_insert_policy ON public.quotations FOR INSERT WITH CHECK (((prepared_by = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = quotations.prepared_by))) OR public.is_manager_of_administration()));
CREATE POLICY quotations_update_policy ON public.quotations FOR UPDATE USING ((((prepared_by = auth.uid()) AND (status = ANY (ARRAY['draft'::text, 'pending_approval'::text]))) OR (approved_by = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = quotations.prepared_by))) OR public.is_manager_of_administration())) WITH CHECK (((prepared_by = auth.uid()) OR (approved_by = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = quotations.prepared_by))) OR public.is_manager_of_administration()));
CREATE TABLE public.requests (id bigint DEFAULT nextval('public.requests_id_seq'::regclass) NOT NULL, user_id uuid NOT NULL, request_type text NOT NULL, new_data jsonb DEFAULT '{}'::jsonb NOT NULL, user_note text, priority text DEFAULT 'normal'::text NOT NULL, status text DEFAULT 'pending'::text NOT NULL, reviewed_by uuid, reviewed_at timestamp with time zone, review_note text, rejection_reason text, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, old_data jsonb);
ALTER SEQUENCE public.requests_id_seq OWNED BY public.requests.id;
GRANT ALL ON SEQUENCE public.requests_id_seq TO anon;
GRANT ALL ON SEQUENCE public.requests_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.requests_id_seq TO service_role;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ADD CONSTRAINT requests_pkey PRIMARY KEY (id);
ALTER TABLE public.requests ADD CONSTRAINT requests_priority_check CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]));
ALTER TABLE public.requests ADD CONSTRAINT requests_request_type_check CHECK (request_type = ANY (ARRAY['profile_update'::text, 'device_change'::text]));
ALTER TABLE public.requests ADD CONSTRAINT requests_status_check CHECK (status = ANY (ARRAY['pending'::text, 'under_review'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text]));
ALTER TABLE public.requests ADD CONSTRAINT requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
GRANT ALL ON public.requests TO anon;
GRANT ALL ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;
CREATE POLICY delete_disabled ON public.requests FOR DELETE USING (false);
CREATE POLICY requests_select ON public.requests FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.is_manager_of_administration()));
CREATE POLICY requests_update ON public.requests FOR UPDATE TO authenticated USING ((((auth.uid() = user_id) AND (status = 'pending'::text)) OR public.is_manager_of_administration())) WITH CHECK ((((auth.uid() = user_id) AND (status = 'cancelled'::text)) OR public.is_manager_of_administration()));
CREATE POLICY users_insert_own_requests ON public.requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE TABLE public.sales_orders (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, order_number text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, lead_id bigint NOT NULL, feasibility_id bigint, business_approval_id bigint, quotation_id bigint, customer_name text NOT NULL, customer_type text NOT NULL, contact_person text, contact_phone text NOT NULL, contact_email text, company_name text, gstin text, pan text, installation_address text NOT NULL, installation_city text NOT NULL, installation_state text NOT NULL, installation_pincode text NOT NULL, installation_latitude numeric(10,8), installation_longitude numeric(11,8), billing_address text, billing_city text, billing_state text, billing_pincode text, same_as_installation_address boolean DEFAULT true, service_type text NOT NULL, connection_type text NOT NULL, plan_name text NOT NULL, bandwidth text NOT NULL, static_ip_count integer DEFAULT 0, ipv6_enabled boolean DEFAULT false, monthly_rental numeric(10,2) NOT NULL, installation_charges numeric(10,2) DEFAULT 0, security_deposit numeric(10,2) DEFAULT 0, equipment_charges numeric(10,2) DEFAULT 0, other_charges numeric(10,2) DEFAULT 0, total_order_value numeric(12,2) NOT NULL, contract_period_months integer DEFAULT 12, contract_start_date date, contract_end_date date, billing_cycle text DEFAULT 'monthly'::text, payment_terms text, status text DEFAULT 'pending_documentation'::text NOT NULL, status_updated_at timestamp with time zone DEFAULT now(), admin_assigned_to uuid, admin_department_id smallint, admin_assigned_at timestamp with time zone, documentation_status text DEFAULT 'pending'::text, documents_required text[], documents_received jsonb DEFAULT '[]'::jsonb, documents_verified boolean DEFAULT false, verified_by uuid, verified_at timestamp with time zone, agreement_type text, agreement_number text, agreement_prepared_date date, agreement_sent_date date, agreement_signed_date date, agreement_document_url text, agreement_status text DEFAULT 'pending'::text, signatory_name text, signatory_designation text, payment_required boolean DEFAULT true, advance_payment_required boolean DEFAULT false, advance_amount numeric(10,2), advance_payment_status text DEFAULT 'pending'::text, advance_payment_mode text, advance_payment_reference text, advance_payment_date date, advance_payment_received_by uuid, security_deposit_required boolean DEFAULT true, security_deposit_status text DEFAULT 'pending'::text, security_deposit_payment_mode text, security_deposit_reference text, security_deposit_date date, installation_type text DEFAULT 'new'::text, installation_priority text DEFAULT 'normal'::text, installation_scheduled_date date, installation_time_slot text, installation_completed_date date, installation_team_id smallint, field_engineer_id uuid, installation_supervisor_id uuid, installation_status text DEFAULT 'pending'::text, installation_remarks text, installation_photos jsonb DEFAULT '[]'::jsonb, equipment_installed text[], ont_serial_number text, router_serial_number text, mac_address text, ip_address_assigned text, vlan_id text, port_number text, pop_connected text, fiber_length_used numeric(10,2), activation_date date, activated_by uuid, activation_status text DEFAULT 'pending'::text, customer_id text, connection_id text, account_number text, billing_system_id text, billing_system_status text, first_invoice_generated boolean DEFAULT false, first_invoice_date date, first_invoice_number text, sla_uptime_percentage numeric(5,2) DEFAULT 99.9, sla_response_time_hours integer DEFAULT 4, sla_resolution_time_hours integer DEFAULT 24, service_start_date date, service_end_date date, renewal_status text DEFAULT 'active'::text, renewal_reminder_sent boolean DEFAULT false, cancellation_requested boolean DEFAULT false, cancellation_requested_date date, cancellation_requested_by uuid, cancellation_reason text, cancellation_approved boolean DEFAULT false, cancellation_approved_by uuid, cancellation_approved_date date, cancellation_effective_date date, notes text, internal_notes text, customer_special_requirements text);
CREATE POLICY checklist_insert_policy ON public.order_processing_checklist FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM public.sales_orders so
  WHERE (so.id = order_processing_checklist.order_id))) OR public.is_manager_of_administration())));
CREATE POLICY checklist_select_policy ON public.order_processing_checklist FOR SELECT USING (((assigned_to = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.sales_orders so
  WHERE (so.id = order_processing_checklist.order_id))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.department = order_processing_checklist.responsible_department_id)))) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM managed_departments md
  WHERE (md.id = order_processing_checklist.responsible_department_id))) OR public.is_manager_of_administration()));
COMMENT ON TABLE public.sales_orders IS 'Complete order lifecycle management from documentation to activation including payment, installation, and billing integration';
COMMENT ON COLUMN public.sales_orders.lead_id IS 'Foreign key to spanco_leads table (bigint to match leads.id)';
COMMENT ON COLUMN public.sales_orders.business_approval_id IS 'Links to business approval if pricing/discount was approved';
COMMENT ON COLUMN public.sales_orders.status IS 'Order processing status from documentation through activation';
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_activated_by_fkey FOREIGN KEY (activated_by) REFERENCES public.profiles(id);
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_admin_assigned_to_fkey FOREIGN KEY (admin_assigned_to) REFERENCES public.profiles(id);
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_admin_department_id_fkey FOREIGN KEY (admin_department_id) REFERENCES public.departments(id);
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_advance_payment_received_by_fkey FOREIGN KEY (advance_payment_received_by) REFERENCES public.profiles(id);
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_business_approval_id_fkey FOREIGN KEY (business_approval_id) REFERENCES public.business_approvals(id);
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_cancellation_approved_by_fkey FOREIGN KEY (cancellation_approved_by) REFERENCES public.profiles(id);
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_cancellation_requested_by_fkey FOREIGN KEY (cancellation_requested_by) REFERENCES public.profiles(id);
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_field_engineer_id_fkey FOREIGN KEY (field_engineer_id) REFERENCES public.profiles(id);
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_installation_supervisor_id_fkey FOREIGN KEY (installation_supervisor_id) REFERENCES public.profiles(id);
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_installation_team_id_fkey FOREIGN KEY (installation_team_id) REFERENCES public.departments(id);
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_order_number_key UNIQUE (order_number);
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.customer_documents ADD CONSTRAINT customer_documents_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.sales_orders(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD CONSTRAINT customers_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.sales_orders(id);
ALTER TABLE public.order_processing_checklist ADD CONSTRAINT order_processing_checklist_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.sales_orders(id) ON DELETE CASCADE;
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id);
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.profiles(id);
ALTER TABLE public.sales_orders ADD CONSTRAINT valid_order_status CHECK (status = ANY (ARRAY['pending_documentation'::text, 'documentation_in_progress'::text, 'documentation_complete'::text, 'pending_payment'::text, 'payment_received'::text, 'pending_installation'::text, 'installation_scheduled'::text, 'installation_in_progress'::text, 'installation_complete'::text, 'pending_activation'::text, 'activated'::text, 'on_hold'::text, 'cancelled'::text]));
GRANT ALL ON public.sales_orders TO anon;
GRANT ALL ON public.sales_orders TO authenticated;
GRANT ALL ON public.sales_orders TO service_role;
CREATE TRIGGER calculate_contract_dates_trigger BEFORE INSERT OR UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.calculate_contract_dates();
CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON public.sales_orders FOR EACH ROW WHEN (new.order_number IS NULL) EXECUTE FUNCTION public.generate_order_number();
CREATE TRIGGER sync_quotation_conversion_trigger AFTER INSERT OR DELETE OR UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.sync_quotation_conversion();
CREATE TRIGGER update_order_status_timestamp_trigger BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.update_order_status_timestamp();
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY sales_orders_delete_policy ON public.sales_orders FOR DELETE USING (public.is_manager_of_administration());
CREATE POLICY sales_orders_insert_policy ON public.sales_orders FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND ((admin_assigned_to = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM managed_departments md
  WHERE (md.id = sales_orders.admin_department_id))) OR public.is_manager_of_administration())));
CREATE POLICY sales_orders_update_policy ON public.sales_orders FOR UPDATE USING (((admin_assigned_to = auth.uid()) OR (field_engineer_id = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM managed_departments md
  WHERE (md.id = ANY (ARRAY[sales_orders.admin_department_id, sales_orders.installation_team_id])))) OR public.is_manager_of_administration())) WITH CHECK (((admin_assigned_to = auth.uid()) OR (field_engineer_id = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM managed_departments md
  WHERE (md.id = ANY (ARRAY[sales_orders.admin_department_id, sales_orders.installation_team_id])))) OR public.is_manager_of_administration()));
CREATE TABLE public.spanco_leads (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, lead_number text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, current_stage text DEFAULT 'suspect'::text NOT NULL, stage_updated_at timestamp with time zone DEFAULT now() NOT NULL, status text DEFAULT 'active'::text NOT NULL, priority text DEFAULT 'medium'::text NOT NULL, assigned_to uuid, assigned_at timestamp with time zone, sales_team_id smallint, customer_info jsonb NOT NULL, service_location jsonb NOT NULL, service_requirements jsonb NOT NULL, commercial_details jsonb, lead_tracking jsonb, timeline jsonb, outcome_details jsonb, notes jsonb DEFAULT '{"remarks": null, "internal_notes": null}'::jsonb, expected_closure_date date);
COMMENT ON TABLE public.spanco_leads IS 'SPANCO sales leads with JSONB structure for flexible data storage';
COMMENT ON COLUMN public.spanco_leads.expected_closure_date IS 'created for ease of query instead of parsing it from column timeline';
ALTER TABLE public.spanco_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spanco_leads ADD CONSTRAINT spanco_leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);
ALTER TABLE public.spanco_leads ADD CONSTRAINT spanco_leads_lead_number_key UNIQUE (lead_number);
ALTER TABLE public.spanco_leads ADD CONSTRAINT spanco_leads_pkey PRIMARY KEY (id);
ALTER TABLE public.feasibility_requests ADD CONSTRAINT feasibility_requests_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.spanco_leads(id) ON DELETE CASCADE;
ALTER TABLE public.spanco_leads ADD CONSTRAINT spanco_leads_sales_team_id_fkey FOREIGN KEY (sales_team_id) REFERENCES public.departments(id);
ALTER TABLE public.spanco_leads ADD CONSTRAINT valid_priority CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text, 'critical'::text]));
ALTER TABLE public.spanco_leads ADD CONSTRAINT valid_stage CHECK (current_stage = ANY (ARRAY['suspect'::text, 'prospect'::text, 'approach'::text, 'negotiation'::text, 'closure'::text, 'order'::text, 'won'::text, 'lost'::text]));
ALTER TABLE public.spanco_leads ADD CONSTRAINT valid_status CHECK (status = ANY (ARRAY['active'::text, 'on_hold'::text, 'won'::text, 'lost'::text, 'cancelled'::text]));
GRANT ALL ON public.spanco_leads TO anon;
GRANT ALL ON public.spanco_leads TO authenticated;
GRANT ALL ON public.spanco_leads TO service_role;
CREATE TRIGGER generate_lead_number_trigger BEFORE INSERT ON public.spanco_leads FOR EACH ROW EXECUTE FUNCTION public.generate_lead_number();
CREATE TRIGGER track_stage_changes BEFORE UPDATE ON public.spanco_leads FOR EACH ROW EXECUTE FUNCTION public.track_spanco_stage_change();
CREATE TRIGGER update_spanco_leads_updated_at BEFORE UPDATE ON public.spanco_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Deletion is disabled" ON public.spanco_leads FOR DELETE TO authenticated USING (false);
CREATE POLICY "User can update leads" ON public.spanco_leads FOR UPDATE TO authenticated USING (((assigned_to = auth.uid()) OR public.all_leads_edit_access())) WITH CHECK (((assigned_to = auth.uid()) OR public.all_leads_edit_access()));
CREATE POLICY "User, Upline & Admin can view leads" ON public.spanco_leads FOR SELECT TO authenticated USING (((assigned_to = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = spanco_leads.assigned_to))) OR public.is_manager_of_administration()));
CREATE POLICY "Users can create leads" ON public.spanco_leads FOR INSERT TO authenticated WITH CHECK (public.member_of_spanco_departments());
CREATE TABLE public.spanco_stage_history (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, lead_id bigint NOT NULL, from_stage text, to_stage text NOT NULL, changed_at timestamp with time zone DEFAULT now() NOT NULL, changed_by uuid NOT NULL, change_reason text, remarks text, days_in_previous_stage integer);
COMMENT ON TABLE public.spanco_stage_history IS 'Audit trail for SPANCO stage changes';
ALTER TABLE public.spanco_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spanco_stage_history ADD CONSTRAINT spanco_stage_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id);
ALTER TABLE public.spanco_stage_history ADD CONSTRAINT spanco_stage_history_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.spanco_leads(id) ON DELETE CASCADE;
ALTER TABLE public.spanco_stage_history ADD CONSTRAINT spanco_stage_history_pkey PRIMARY KEY (id);
ALTER TABLE public.spanco_stage_history ADD CONSTRAINT valid_from_stage CHECK (from_stage IS NULL OR (from_stage = ANY (ARRAY['suspect'::text, 'prospect'::text, 'approach'::text, 'negotiation'::text, 'closure'::text, 'order'::text, 'won'::text, 'lost'::text])));
ALTER TABLE public.spanco_stage_history ADD CONSTRAINT valid_to_stage CHECK (to_stage = ANY (ARRAY['suspect'::text, 'prospect'::text, 'approach'::text, 'negotiation'::text, 'closure'::text, 'order'::text, 'won'::text, 'lost'::text]));
GRANT ALL ON public.spanco_stage_history TO anon;
GRANT ALL ON public.spanco_stage_history TO authenticated;
GRANT ALL ON public.spanco_stage_history TO service_role;
CREATE INDEX idx_stage_history_changed_at ON public.spanco_stage_history (changed_at DESC);
CREATE INDEX idx_stage_history_lead_id ON public.spanco_stage_history (lead_id);
CREATE POLICY "Stage history cannot be deleted" ON public.spanco_stage_history FOR DELETE TO authenticated USING (false);
CREATE POLICY "Stage history is immutable" ON public.spanco_stage_history FOR UPDATE TO authenticated USING (false);
CREATE POLICY "User can insert history stage" ON public.spanco_stage_history FOR INSERT TO authenticated WITH CHECK ((public.member_of_spanco_departments() AND (EXISTS ( SELECT 1
   FROM public.spanco_leads sl
  WHERE ((sl.id = spanco_stage_history.lead_id) AND ((sl.assigned_to = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
                 SELECT d.id,
                    d.parent_id,
                    d.manager_id,
                    1 AS depth
                   FROM public.departments d
                  WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
                UNION ALL
                 SELECT d.id,
                    d.parent_id,
                    d.manager_id,
                    (md_1.depth + 1)
                   FROM (public.departments d
                     JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
                  WHERE ((d.is_active = true) AND (md_1.depth < 10))
                )
         SELECT 1
           FROM (managed_departments md
             JOIN public.profiles p ON ((p.department = md.id)))
          WHERE (p.id = sl.assigned_to)))))))));
CREATE POLICY "Users, Upline & Admin can view stage history" ON public.spanco_stage_history FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.spanco_leads sl
  WHERE ((sl.id = spanco_stage_history.lead_id) AND ((sl.assigned_to = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
                 SELECT d.id,
                    d.parent_id,
                    d.manager_id,
                    1 AS depth
                   FROM public.departments d
                  WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
                UNION ALL
                 SELECT d.id,
                    d.parent_id,
                    d.manager_id,
                    (md_1.depth + 1)
                   FROM (public.departments d
                     JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
                  WHERE ((d.is_active = true) AND (md_1.depth < 10))
                )
         SELECT 1
           FROM (managed_departments md
             JOIN public.profiles p ON ((p.department = md.id)))
          WHERE (p.id = sl.assigned_to))) OR public.is_manager_of_administration())))));
CREATE TABLE public.user_app_config (id smallint GENERATED BY DEFAULT AS IDENTITY NOT NULL, platform text NOT NULL, min_version smallint NOT NULL, max_version smallint NOT NULL, force_update boolean DEFAULT false, max_force_note text, app_url text, image_links text, faq jsonb);
ALTER TABLE public.user_app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_app_config ADD CONSTRAINT user_app_config_pkey PRIMARY KEY (id);
GRANT ALL ON public.user_app_config TO anon;
GRANT ALL ON public.user_app_config TO authenticated;
GRANT ALL ON public.user_app_config TO service_role;
CREATE POLICY allow_authenticated ON public.user_app_config FOR SELECT USING (true);
CREATE POLICY deny_delete ON public.user_app_config FOR DELETE USING (false);
CREATE POLICY deny_insert ON public.user_app_config FOR INSERT WITH CHECK (false);
CREATE POLICY deny_update ON public.user_app_config FOR UPDATE USING (false) WITH CHECK (false);
CREATE TABLE public.work_schedules (id smallint GENERATED BY DEFAULT AS IDENTITY NOT NULL, start_time time without time zone, end_time time without time zone, weekdays text[], punch_in_grace smallint DEFAULT '12'::smallint, schedule_type text DEFAULT 'fixed'::text, created_at timestamp with time zone DEFAULT now() NOT NULL, employee_id uuid NOT NULL, shift_pattern text DEFAULT 'day'::text, min_work_hours numeric DEFAULT '8'::numeric, updated_at timestamp with time zone, max_work_hours numeric DEFAULT '12'::numeric, home_location text, wfm_allowed boolean DEFAULT false, office_location text DEFAULT '28.560247, 77.199301'::text, office_radius smallint DEFAULT '100'::smallint, home_radius smallint DEFAULT '100'::smallint, work_location_names text DEFAULT 'delhi'::text, work_location_radius smallint DEFAULT '100'::smallint);
COMMENT ON COLUMN public.work_schedules.weekdays IS 'should be in lower case for rpc funtion and others too';
COMMENT ON COLUMN public.work_schedules.schedule_type IS '''fixed'', ''flexible'', ''shift'', ''compressed''';
COMMENT ON COLUMN public.work_schedules.shift_pattern IS '''day'', ''night'', ''rotating'', ''split'', ''evening''';
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_schedules ADD CONSTRAINT work_schedules_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.work_schedules ADD CONSTRAINT work_schedules_pkey PRIMARY KEY (id);
GRANT ALL ON public.work_schedules TO anon;
GRANT ALL ON public.work_schedules TO authenticated;
GRANT ALL ON public.work_schedules TO service_role;
CREATE POLICY "Denied" ON public.work_schedules FOR DELETE USING (false);
CREATE POLICY "Specific department managers can insert" ON public.work_schedules FOR INSERT WITH CHECK (public.is_manager_of_specific_departments());
CREATE POLICY "Specific department managers can update" ON public.work_schedules FOR UPDATE USING (public.is_manager_of_specific_departments());
CREATE POLICY "Viewable in hierarchy and specific managers" ON public.work_schedules FOR SELECT USING (((employee_id = auth.uid()) OR (EXISTS ( WITH RECURSIVE managed_departments AS (
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            1 AS depth
           FROM public.departments d
          WHERE ((d.manager_id = auth.uid()) AND (d.is_active = true))
        UNION ALL
         SELECT d.id,
            d.parent_id,
            d.manager_id,
            (md_1.depth + 1)
           FROM (public.departments d
             JOIN managed_departments md_1 ON ((d.parent_id = md_1.id)))
          WHERE ((d.is_active = true) AND (md_1.depth < 10))
        )
 SELECT 1
   FROM (managed_departments md
     JOIN public.profiles p ON ((p.department = md.id)))
  WHERE (p.id = work_schedules.employee_id))) OR public.is_manager_of_specific_departments()));
CREATE VIEW public.active_customers_dashboard WITH (security_invoker=on) AS SELECT c.id,
    c.customer_id,
    c.customer_name,
    c.contact_phone,
    c.contact_email,
    c.service_city,
    c.plan_name,
    c.bandwidth,
    c.monthly_rental,
    c.status,
    c.service_start_date,
    c.next_renewal_date,
    (c.next_renewal_date - CURRENT_DATE) AS days_to_renewal,
    c.outstanding_balance,
    c.total_complaints,
    c.average_uptime_percentage,
    am.full_name AS account_manager_name,
    sales_rep.full_name AS sales_rep_name,
        CASE
            WHEN (c.outstanding_balance > (c.monthly_rental * (2)::numeric)) THEN 'high_risk'::text
            WHEN (c.outstanding_balance > c.monthly_rental) THEN 'medium_risk'::text
            WHEN (c.outstanding_balance > (0)::numeric) THEN 'low_risk'::text
            ELSE 'good'::text
        END AS payment_risk_level,
        CASE
            WHEN (c.next_renewal_date <= (CURRENT_DATE + 30)) THEN true
            ELSE false
        END AS renewal_due_soon
   FROM ((public.customers c
     LEFT JOIN public.profiles am ON ((c.account_manager_id = am.id)))
     LEFT JOIN public.profiles sales_rep ON ((c.assigned_sales_rep_id = sales_rep.id)))
  WHERE (c.status = 'active'::text)
  ORDER BY c.customer_since DESC;
GRANT ALL ON public.active_customers_dashboard TO anon;
GRANT ALL ON public.active_customers_dashboard TO authenticated;
GRANT ALL ON public.active_customers_dashboard TO service_role;
CREATE VIEW public.customers_due_for_renewal WITH (security_invoker=on) AS SELECT c.id,
    c.customer_id,
    c.customer_name,
    c.contact_phone,
    c.contact_email,
    c.service_city,
    c.plan_name,
    c.monthly_rental,
    c.next_renewal_date,
    (c.next_renewal_date - CURRENT_DATE) AS days_remaining,
    c.contract_period_months,
    c.total_revenue_generated,
    am.full_name AS account_manager_name,
    am.phone AS account_manager_phone,
        CASE
            WHEN (c.next_renewal_date < CURRENT_DATE) THEN 'overdue'::text
            WHEN (c.next_renewal_date <= (CURRENT_DATE + 7)) THEN 'urgent'::text
            WHEN (c.next_renewal_date <= (CURRENT_DATE + 30)) THEN 'upcoming'::text
            ELSE 'future'::text
        END AS renewal_urgency
   FROM (public.customers c
     LEFT JOIN public.profiles am ON ((c.account_manager_id = am.id)))
  WHERE ((c.status = 'active'::text) AND (c.next_renewal_date IS NOT NULL) AND (c.next_renewal_date <= (CURRENT_DATE + 60)))
  ORDER BY c.next_renewal_date;
GRANT ALL ON public.customers_due_for_renewal TO anon;
GRANT ALL ON public.customers_due_for_renewal TO authenticated;
GRANT ALL ON public.customers_due_for_renewal TO service_role;
CREATE VIEW public.high_value_customers WITH (security_invoker=on) AS SELECT c.id,
    c.customer_id,
    c.customer_name,
    c.customer_category,
    c.contact_phone,
    c.service_city,
    c.plan_name,
    c.monthly_rental,
    c.lifetime_value,
    c.total_revenue_generated,
    c.average_monthly_revenue,
    c.payment_history_score,
    (((EXTRACT(year FROM age((CURRENT_DATE)::timestamp with time zone, (c.customer_since)::timestamp with time zone)))::integer * 12) + (EXTRACT(month FROM age((CURRENT_DATE)::timestamp with time zone, (c.customer_since)::timestamp with time zone)))::integer) AS months_as_customer,
    am.full_name AS account_manager_name
   FROM (public.customers c
     LEFT JOIN public.profiles am ON ((c.account_manager_id = am.id)))
  WHERE ((c.status = 'active'::text) AND ((c.lifetime_value > (100000)::numeric) OR (c.monthly_rental > (5000)::numeric) OR (c.customer_category = ANY (ARRAY['corporate'::text, 'vip'::text]))))
  ORDER BY c.lifetime_value DESC NULLS LAST;
GRANT ALL ON public.high_value_customers TO anon;
GRANT ALL ON public.high_value_customers TO authenticated;
GRANT ALL ON public.high_value_customers TO service_role;
CREATE VIEW public.installation_schedule WITH (security_invoker=on) AS SELECT so.id,
    so.order_number,
    so.customer_name,
    so.contact_phone,
    so.installation_address,
    so.installation_city,
    so.installation_scheduled_date,
    so.installation_time_slot,
    so.installation_priority,
    engineer.full_name AS field_engineer_name,
    engineer.phone AS engineer_phone,
    supervisor.full_name AS supervisor_name,
    dept.name AS installation_team_name,
    so.plan_name,
    so.bandwidth,
    so.connection_type,
    so.installation_type,
    so.customer_special_requirements,
        CASE
            WHEN (so.installation_scheduled_date = CURRENT_DATE) THEN 'Today'::text
            WHEN (so.installation_scheduled_date = (CURRENT_DATE + 1)) THEN 'Tomorrow'::text
            WHEN (so.installation_scheduled_date < CURRENT_DATE) THEN 'Overdue'::text
            ELSE 'Upcoming'::text
        END AS schedule_status
   FROM (((public.sales_orders so
     LEFT JOIN public.profiles engineer ON ((so.field_engineer_id = engineer.id)))
     LEFT JOIN public.profiles supervisor ON ((so.installation_supervisor_id = supervisor.id)))
     LEFT JOIN public.departments dept ON ((so.installation_team_id = dept.id)))
  WHERE ((so.status = ANY (ARRAY['installation_scheduled'::text, 'installation_in_progress'::text])) AND (so.installation_scheduled_date IS NOT NULL))
  ORDER BY so.installation_scheduled_date, so.installation_time_slot;
COMMENT ON VIEW public.installation_schedule IS 'Shows scheduled installations with team assignments and priority';
GRANT ALL ON public.installation_schedule TO anon;
GRANT ALL ON public.installation_schedule TO authenticated;
GRANT ALL ON public.installation_schedule TO service_role;
CREATE VIEW public.my_assigned_orders WITH (security_invoker=on) AS SELECT so.id,
    so.order_number,
    so.status,
    so.customer_name,
    so.contact_phone,
    so.installation_city,
    so.plan_name,
    so.installation_scheduled_date,
    so.installation_priority,
        CASE
            WHEN (so.admin_assigned_to = auth.uid()) THEN 'Admin'::text
            WHEN (so.field_engineer_id = auth.uid()) THEN 'Field Engineer'::text
            WHEN (so.installation_supervisor_id = auth.uid()) THEN 'Supervisor'::text
            ELSE 'Unknown'::text
        END AS my_role
   FROM public.sales_orders so
  WHERE ((so.admin_assigned_to = auth.uid()) OR (so.field_engineer_id = auth.uid()) OR (so.installation_supervisor_id = auth.uid()))
  ORDER BY so.installation_scheduled_date, so.created_at DESC;
GRANT ALL ON public.my_assigned_orders TO anon;
GRANT ALL ON public.my_assigned_orders TO authenticated;
GRANT ALL ON public.my_assigned_orders TO service_role;
CREATE VIEW public.my_managed_customers WITH (security_invoker=on) AS SELECT c.id,
    c.customer_id,
    c.customer_name,
    c.contact_phone,
    c.service_city,
    c.plan_name,
    c.status,
    c.outstanding_balance,
    c.next_renewal_date,
    c.total_complaints,
    c.last_complaint_date,
    (c.next_renewal_date - CURRENT_DATE) AS days_to_renewal,
        CASE
            WHEN (c.status = 'suspended'::text) THEN 'critical'::text
            WHEN (c.outstanding_balance > (c.monthly_rental * (2)::numeric)) THEN 'high'::text
            WHEN (c.next_renewal_date <= (CURRENT_DATE + 30)) THEN 'medium'::text
            ELSE 'low'::text
        END AS attention_priority
   FROM public.customers c
  WHERE (c.account_manager_id = auth.uid())
  ORDER BY
        CASE
            WHEN (c.status = 'suspended'::text) THEN 1
            WHEN (c.outstanding_balance > (c.monthly_rental * (2)::numeric)) THEN 2
            WHEN (c.next_renewal_date <= (CURRENT_DATE + 30)) THEN 3
            ELSE 4
        END, c.outstanding_balance DESC;
GRANT ALL ON public.my_managed_customers TO anon;
GRANT ALL ON public.my_managed_customers TO authenticated;
GRANT ALL ON public.my_managed_customers TO service_role;
CREATE VIEW public.my_pending_checklist_items WITH (security_invoker=on) AS SELECT ocl.id,
    ocl.order_id,
    so.order_number,
    so.customer_name,
    so.contact_phone,
    ocl.category,
    ocl.item_name,
    ocl.item_description,
    ocl.status,
    ocl.is_mandatory,
    ocl.sequence_order,
    ocl.due_at,
    ocl.is_overdue,
    ocl.assigned_at,
    ocl.blocked_by,
    round((EXTRACT(epoch FROM (now() - ocl.assigned_at)) / (3600)::numeric), 1) AS hours_pending,
        CASE
            WHEN (ocl.due_at IS NOT NULL) THEN round((EXTRACT(epoch FROM (ocl.due_at - now())) / (3600)::numeric), 1)
            ELSE NULL::numeric
        END AS hours_remaining,
        CASE
            WHEN ((ocl.depends_on_item_ids IS NULL) OR (array_length(ocl.depends_on_item_ids, 1) = 0)) THEN 'No dependencies'::text
            WHEN (ocl.status = 'blocked'::text) THEN ('Blocked: '::text || COALESCE(ocl.blocked_by, 'Unknown'::text))
            ELSE 'Dependencies met'::text
        END AS dependency_status
   FROM (public.order_processing_checklist ocl
     JOIN public.sales_orders so ON ((ocl.order_id = so.id)))
  WHERE ((ocl.assigned_to = auth.uid()) AND (ocl.is_completed = false))
  ORDER BY ocl.is_overdue DESC,
        CASE ocl.status
            WHEN 'blocked'::text THEN 1
            WHEN 'in_progress'::text THEN 2
            ELSE 3
        END, ocl.due_at, ocl.sequence_order;
GRANT ALL ON public.my_pending_checklist_items TO anon;
GRANT ALL ON public.my_pending_checklist_items TO authenticated;
GRANT ALL ON public.my_pending_checklist_items TO service_role;
CREATE VIEW public.order_checklist_progress WITH (security_invoker=on) AS SELECT ocl.order_id,
    so.order_number,
    so.customer_name,
    so.status AS order_status,
    so.created_at,
    count(*) AS total_items,
    count(*) FILTER (WHERE (ocl.is_completed = true)) AS completed_items,
    count(*) FILTER (WHERE (ocl.status = 'in_progress'::text)) AS in_progress_items,
    count(*) FILTER (WHERE (ocl.status = 'blocked'::text)) AS blocked_items,
    count(*) FILTER (WHERE ((ocl.is_overdue = true) AND (ocl.is_completed = false))) AS overdue_items,
    count(*) FILTER (WHERE (ocl.is_mandatory = true)) AS mandatory_items,
    count(*) FILTER (WHERE ((ocl.is_mandatory = true) AND (ocl.is_completed = true))) AS mandatory_completed,
    round((((count(*) FILTER (WHERE (ocl.is_completed = true)))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 1) AS overall_progress_percentage,
    round((((count(*) FILTER (WHERE ((ocl.is_mandatory = true) AND (ocl.is_completed = true))))::numeric / (NULLIF(count(*) FILTER (WHERE (ocl.is_mandatory = true)), 0))::numeric) * (100)::numeric), 1) AS mandatory_progress_percentage,
        CASE
            WHEN (count(*) FILTER (WHERE ((ocl.is_mandatory = true) AND (ocl.is_completed = false))) = 0) THEN true
            ELSE false
        END AS all_mandatory_completed
   FROM (public.order_processing_checklist ocl
     JOIN public.sales_orders so ON ((ocl.order_id = so.id)))
  GROUP BY ocl.order_id, so.order_number, so.customer_name, so.status, so.created_at
  ORDER BY so.created_at DESC;
GRANT ALL ON public.order_checklist_progress TO anon;
GRANT ALL ON public.order_checklist_progress TO authenticated;
GRANT ALL ON public.order_checklist_progress TO service_role;
CREATE VIEW public.spanco_stage_analytics WITH (security_invoker=on) AS SELECT sl.id AS lead_id,
    sl.lead_number,
    (sl.customer_info ->> 'name'::text) AS customer_name,
    (sl.customer_info ->> 'phone'::text) AS customer_phone,
    (sl.service_location ->> 'city'::text) AS service_city,
    sl.current_stage,
    sl.status,
    sl.priority,
    sl.assigned_to,
    count(ssh.id) AS total_stage_changes,
    min(ssh.changed_at) AS first_stage_change,
    max(ssh.changed_at) AS last_stage_change,
    (EXTRACT(epoch FROM (now() - sl.created_at)) / (86400)::numeric) AS lead_age_days,
    (EXTRACT(epoch FROM (now() - sl.stage_updated_at)) / (86400)::numeric) AS days_in_current_stage,
        CASE
            WHEN (count(ssh.id) > 0) THEN avg(ssh.days_in_previous_stage)
            ELSE NULL::numeric
        END AS avg_days_per_stage,
    ((sl.commercial_details ->> 'estimated_value'::text))::numeric AS estimated_value,
    ((sl.commercial_details ->> 'proposed_monthly_rental'::text))::numeric AS proposed_monthly_rental
   FROM (public.spanco_leads sl
     LEFT JOIN public.spanco_stage_history ssh ON ((sl.id = ssh.lead_id)))
  GROUP BY sl.id, sl.lead_number, sl.customer_info, sl.service_location, sl.current_stage, sl.status, sl.priority, sl.assigned_to, sl.created_at, sl.stage_updated_at, sl.commercial_details;
COMMENT ON VIEW public.spanco_stage_analytics IS 'Analytics view with JSONB field extraction for stage progression metrics';
GRANT ALL ON public.spanco_stage_analytics TO anon;
GRANT ALL ON public.spanco_stage_analytics TO authenticated;
GRANT ALL ON public.spanco_stage_analytics TO service_role;


-- >>>>>>>>>>>>>> File: 20260924120017_storage_setup.sql <<<<<<<<<<<<<<

-- 1. Create the profile-documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-documents', 'profile-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS policies for profile-documents bucket
DROP POLICY IF EXISTS "admin_update_files" ON "storage"."objects";
CREATE POLICY "admin_update_files" ON "storage"."objects"
FOR UPDATE TO "authenticated"
USING ((("bucket_id" = 'profile-documents'::"text") AND "public"."is_manager_of_administration"()))
WITH CHECK ((("bucket_id" = 'profile-documents'::"text") AND "public"."is_manager_of_administration"()));

DROP POLICY IF EXISTS "user_delete_own_staging" ON "storage"."objects";
CREATE POLICY "user_delete_own_staging" ON "storage"."objects"
FOR DELETE TO "authenticated"
USING ((("bucket_id" = 'profile-documents'::"text") AND (((("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text") AND (("storage"."foldername"("name"))[2] = 'staging'::"text")) OR "public"."is_manager_of_administration"())));

DROP POLICY IF EXISTS "user_insert_own_staging" ON "storage"."objects";
CREATE POLICY "user_insert_own_staging" ON "storage"."objects"
FOR INSERT TO "authenticated"
WITH CHECK ((("bucket_id" = 'profile-documents'::"text") AND (((("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text") AND (("storage"."foldername"("name"))[2] = 'staging'::"text")) OR "public"."is_manager_of_administration"())));

DROP POLICY IF EXISTS "user_select_own_files" ON "storage"."objects";
CREATE POLICY "user_select_own_files" ON "storage"."objects"
FOR SELECT TO "authenticated"
USING ((("bucket_id" = 'profile-documents'::"text") AND ((("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text") OR "public"."is_manager_of_administration"())));


-- >>>>>>>>>>>>>> File: 20260927000000_access_admin_panel.sql <<<<<<<<<<<<<<

-- Function to check admin panel access (departments 303, 105, 1)
CREATE OR REPLACE FUNCTION public.access_admin_panel()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.departments d
    WHERE d.manager_id = auth.uid()
      AND d.id IN (303, 105, 1)
      AND d.is_active = true
  );
$$;

GRANT ALL ON FUNCTION public.access_admin_panel() TO anon;
GRANT ALL ON FUNCTION public.access_admin_panel() TO authenticated;
GRANT ALL ON FUNCTION public.access_admin_panel() TO service_role;


-- >>>>>>>>>>>>>> File: 20261001000000_system_modules_config.sql <<<<<<<<<<<<<<


-- ============================================================
-- Face Recognition Feature — Column Additions Only
-- ============================================================

-- 1. Profile: face enrollment data & per-employee match threshold
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS face_recognition boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS face_embedding float8[],
  ADD COLUMN IF NOT EXISTS face_enrolled_at timestamptz,
  ADD COLUMN IF NOT EXISTS face_enrollment_photo text,
  ADD COLUMN IF NOT EXISTS face_match_threshold float8 DEFAULT 0.75;

-- 2. Attendance: track face verification per punch
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS face_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS face_confidence float8;

-- 3. Global feature flag (master kill switch)
ALTER TABLE public.user_app_config
  ADD COLUMN IF NOT EXISTS is_face_recognition_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_spanco_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_feasibility_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS office_location text DEFAULT '28.560247, 77.199301';


-- ====================================================
-- Initial Default Configuration for user_app_config
-- ====================================================
INSERT INTO public.user_app_config (id, platform, min_version, max_version, force_update, is_spanco_enabled, is_feasibility_enabled, office_location, is_face_recognition_enabled)
VALUES (1, 'android', 1, 1, false, true, true, '28.560247, 77.199301', true)
ON CONFLICT (id) DO NOTHING;
