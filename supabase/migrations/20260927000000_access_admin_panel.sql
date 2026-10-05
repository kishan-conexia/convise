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
