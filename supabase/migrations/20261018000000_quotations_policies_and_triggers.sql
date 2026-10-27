-- Migration: Add missing SELECT policy on quotations and update quotation number generation
-- Matches the SECURITY DEFINER + advisory lock pattern used in generate_lead_number and generate_feasibility_number
-- Date: 2026-10-18

-- 1. Create SELECT policy for quotations table
-- Currently quotations table has RLS enabled with only INSERT, UPDATE, DELETE policies.
-- Without a SELECT policy, any SELECT (and any INSERT ... RETURNING * / .select()) fails with code 42501.
DROP POLICY IF EXISTS quotations_select_policy ON public.quotations;

CREATE POLICY quotations_select_policy ON public.quotations
  FOR SELECT TO authenticated
  USING (
    (prepared_by = auth.uid())
    OR (approved_by = auth.uid())
    OR (EXISTS (
      WITH RECURSIVE managed_departments AS (
        SELECT d.id, d.parent_id, d.manager_id, 1 AS depth
        FROM public.departments d
        WHERE d.manager_id = auth.uid() AND d.is_active = true
        UNION ALL
        SELECT d.id, d.parent_id, d.manager_id, md_1.depth + 1
        FROM public.departments d
        JOIN managed_departments md_1 ON d.parent_id = md_1.id
        WHERE d.is_active = true AND md_1.depth < 10
      )
      SELECT 1
      FROM managed_departments md
      JOIN public.profiles p ON p.department = md.id
      WHERE p.id = quotations.prepared_by
    ))
    OR public.is_manager_of_administration()
    OR public.member_of_spanco_departments()
  );

-- 2. Update generate_quotation_number to match generate_lead_number and generate_feasibility_number
-- Uses SECURITY DEFINER, transaction advisory lock, and split_part to ensure concurrency safety and prevent sequence collisions under RLS.
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  year_val text;
  sequence_num integer;
  lock_key bigint;
  new_quotation_number text;
BEGIN
  IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
    -- Use COALESCE to handle NULL created_at
    year_val := TO_CHAR(COALESCE(NEW.created_at, NOW()), 'YYYY');
    
    -- Generate lock key from year
    lock_key := hashtext('quotation_' || year_val);
    
    -- Acquire transaction advisory lock to prevent race conditions
    PERFORM pg_advisory_xact_lock(lock_key);
    
    -- Use split_part for clean sequence extraction: QT-YYYY-00001 -> 00001
    SELECT COALESCE(MAX(CAST(split_part(quotation_number, '-', 3) AS integer)), 0) + 1
    INTO sequence_num
    FROM public.quotations
    WHERE quotation_number LIKE 'QT-' || year_val || '-%';
    
    -- Format quotation number
    new_quotation_number := 'QT-' || year_val || '-' || LPAD(sequence_num::text, 5, '0');
    
    -- Safety check against duplicates
    IF EXISTS (SELECT 1 FROM public.quotations WHERE quotation_number = new_quotation_number) THEN
      RAISE EXCEPTION 'Duplicate quotation number: %', new_quotation_number;
    END IF;
    
    NEW.quotation_number := new_quotation_number;
  END IF;
  
  RETURN NEW;
END;
$function$;

GRANT ALL ON FUNCTION public.generate_quotation_number() TO anon;
GRANT ALL ON FUNCTION public.generate_quotation_number() TO authenticated;
GRANT ALL ON FUNCTION public.generate_quotation_number() TO service_role;



-- 1. Update trigger function to reset discount when 0% and prevent negative totals
CREATE OR REPLACE FUNCTION public.calculate_quotation_totals()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_advance_months integer := 1;
  v_advance_base numeric(10,2) := 0;
  v_advance_tax numeric(10,2) := 0;
  v_advance_total numeric(10,2) := 0;
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
  IF COALESCE(NEW.discount_percentage, 0) > 0 AND NEW.onetime_subtotal > 0 THEN
    NEW.discount_amount := ROUND((NEW.onetime_subtotal * NEW.discount_percentage / 100), 2);
  ELSE
    -- ALWAYS reset to 0 if percentage is 0 or one-time charges are 0
    NEW.discount_amount := 0;
  END IF;
  
  -- Discount can never exceed one-time subtotal
  IF NEW.discount_amount > NEW.onetime_subtotal THEN
    NEW.discount_amount := NEW.onetime_subtotal;
  END IF;
  
  -- Calculate taxable amount (minimum 0)
  NEW.taxable_amount := GREATEST(0, NEW.onetime_subtotal - COALESCE(NEW.discount_amount, 0));
  
  -- Calculate GST (either CGST+SGST or IGST, not both)
  IF NEW.taxable_amount > 0 THEN
    IF COALESCE(NEW.cgst_percentage, 0) > 0 AND COALESCE(NEW.sgst_percentage, 0) > 0 THEN
      NEW.cgst_amount := ROUND((NEW.taxable_amount * NEW.cgst_percentage / 100), 2);
      NEW.sgst_amount := ROUND((NEW.taxable_amount * NEW.sgst_percentage / 100), 2);
      NEW.igst_amount := 0;
      NEW.onetime_total_with_tax := NEW.taxable_amount + NEW.cgst_amount + NEW.sgst_amount;
    ELSIF COALESCE(NEW.igst_percentage, 0) > 0 THEN
      NEW.igst_amount := ROUND((NEW.taxable_amount * NEW.igst_percentage / 100), 2);
      NEW.cgst_amount := 0;
      NEW.sgst_amount := 0;
      NEW.onetime_total_with_tax := NEW.taxable_amount + NEW.igst_amount;
    ELSE
      NEW.cgst_amount := 0;
      NEW.sgst_amount := 0;
      NEW.igst_amount := 0;
      NEW.onetime_total_with_tax := NEW.taxable_amount;
    END IF;
  ELSE
    NEW.cgst_amount := 0;
    NEW.sgst_amount := 0;
    NEW.igst_amount := 0;
    NEW.onetime_total_with_tax := 0;
  END IF;
  
  -- Calculate Advance Rental + GST if advance payment is required
  IF COALESCE(NEW.advance_payment_required, false) = true AND COALESCE(NEW.monthly_rental, 0) > 0 THEN
    v_advance_months := GREATEST(1, COALESCE(NEW.advance_payment_months, 1));
    v_advance_base := ROUND((NEW.monthly_rental * v_advance_months), 2);
    IF COALESCE(NEW.cgst_percentage, 0) > 0 AND COALESCE(NEW.sgst_percentage, 0) > 0 THEN
      v_advance_tax := ROUND((v_advance_base * NEW.cgst_percentage / 100), 2) + ROUND((v_advance_base * NEW.sgst_percentage / 100), 2);
    ELSIF COALESCE(NEW.igst_percentage, 0) > 0 THEN
      v_advance_tax := ROUND((v_advance_base * NEW.igst_percentage / 100), 2);
    ELSE
      v_advance_tax := ROUND((v_advance_base * 18 / 100), 2);
    END IF;
    v_advance_total := v_advance_base + v_advance_tax;
  ELSE
    v_advance_total := 0;
  END IF;

  -- Total payable at activation: one-time total + security deposit + advance rental (minimum 0)
  NEW.total_payable_now := GREATEST(0, NEW.onetime_total_with_tax + COALESCE(NEW.security_deposit, 0) + v_advance_total);
  
  -- Calculate total contract value (recurring charges only)
  IF COALESCE(NEW.contract_period_months, 0) > 0 THEN
    NEW.total_contract_value := NEW.monthly_rental * NEW.contract_period_months;
  ELSE
    NEW.total_contract_value := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Recalculate existing quotations to fix total_payable_now for advance payment and discount
UPDATE public.quotations
SET updated_at = NOW()
WHERE advance_payment_required = true OR id = 12;

-- 4. Add customer portal acceptance columns
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS acceptance_token uuid DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS accepted_by_designation text,
  ADD COLUMN IF NOT EXISTS purchase_order_number text;

-- Populate tokens for existing records
UPDATE public.quotations
SET acceptance_token = gen_random_uuid()
WHERE acceptance_token IS NULL;


