ALTER TABLE public.rh_tenant_members
  ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.rh_employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_policy jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS rh_tenant_members_employee_idx ON public.rh_tenant_members(employee_id);

CREATE TABLE IF NOT EXISTS public.rh_access_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.rh_tenant_members(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES public.rh_employees(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('login', 'logout', 'password_reset', 'permission_change', 'session_revoked', 'mfa_challenge', 'failed_login')),
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rh_access_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY rh_access_events_select ON public.rh_access_events
  FOR SELECT
  USING (public.rh_user_has_tenant_role(tenant_id, ARRAY['admin', 'rh', 'dp']));

CREATE POLICY rh_access_events_insert ON public.rh_access_events
  FOR INSERT
  WITH CHECK (public.rh_user_has_tenant_access(tenant_id));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('rh-employee-photos', 'rh-employee-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('rh-employee-documents', 'rh-employee-documents', false, 26214400, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('rh-payslips', 'rh-payslips', false, 10485760, ARRAY['application/pdf']),
  ('rh-signatures', 'rh-signatures', false, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY rh_storage_member_read ON storage.objects
  FOR SELECT
  USING (
    bucket_id IN ('rh-employee-photos', 'rh-employee-documents', 'rh-payslips', 'rh-signatures')
    AND public.rh_user_has_tenant_access((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY rh_storage_staff_write ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id IN ('rh-employee-photos', 'rh-employee-documents', 'rh-payslips', 'rh-signatures')
    AND public.rh_user_has_tenant_role((storage.foldername(name))[1]::uuid, ARRAY['admin', 'rh', 'dp'])
  );

CREATE POLICY rh_storage_staff_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id IN ('rh-employee-photos', 'rh-employee-documents', 'rh-payslips', 'rh-signatures')
    AND public.rh_user_has_tenant_role((storage.foldername(name))[1]::uuid, ARRAY['admin', 'rh', 'dp'])
  )
  WITH CHECK (
    bucket_id IN ('rh-employee-photos', 'rh-employee-documents', 'rh-payslips', 'rh-signatures')
    AND public.rh_user_has_tenant_role((storage.foldername(name))[1]::uuid, ARRAY['admin', 'rh', 'dp'])
  );

CREATE POLICY rh_storage_admin_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id IN ('rh-employee-photos', 'rh-employee-documents', 'rh-payslips', 'rh-signatures')
    AND public.rh_user_has_tenant_role((storage.foldername(name))[1]::uuid, ARRAY['admin', 'rh'])
  );

COMMENT ON TABLE public.rh_access_events IS
  'Auditoria de acesso do RH: login, logout, reset, mudança de permissão, revogação de sessão e falhas.';
