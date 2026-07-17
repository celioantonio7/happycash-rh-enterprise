CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.rh_user_has_tenant_access(target_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.rh_tenant_members member
    WHERE member.tenant_id = target_tenant_id
      AND member.auth_user_id = auth.uid()
      AND member.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.rh_user_has_tenant_role(target_tenant_id uuid, allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.rh_tenant_members member
    WHERE member.tenant_id = target_tenant_id
      AND member.auth_user_id = auth.uid()
      AND member.status = 'active'
      AND member.role = ANY(allowed_roles)
  );
$$;

CREATE TABLE IF NOT EXISTS public.rh_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  trade_name text,
  cnpj text,
  erp_store_account_id uuid,
  status text NOT NULL DEFAULT 'implementation'
    CHECK (status IN ('implementation', 'active', 'suspended', 'cancelled')),
  plan text NOT NULL DEFAULT 'enterprise',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  auth_user_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'rh', 'dp', 'gestor', 'recrutador', 'colaborador', 'contabilidade')),
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'invited')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, auth_user_id)
);

CREATE TABLE IF NOT EXISTS public.rh_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  city text,
  state text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.rh_departments(id) ON DELETE SET NULL,
  title text NOT NULL,
  cbo_code text,
  salary_floor numeric(14,2),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.rh_units(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.rh_departments(id) ON DELETE SET NULL,
  position_id uuid REFERENCES public.rh_positions(id) ON DELETE SET NULL,
  employee_number text,
  full_name text NOT NULL,
  social_name text,
  cpf text,
  pis_pasep text,
  email text,
  phone text,
  birth_date date,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'vacation', 'leave', 'terminated', 'candidate', 'admission')),
  contract_type text NOT NULL DEFAULT 'clt'
    CHECK (contract_type IN ('clt', 'pj', 'internship', 'temporary', 'apprentice', 'partner', 'other')),
  admission_date date,
  termination_date date,
  salary_amount numeric(14,2),
  salary_currency text NOT NULL DEFAULT 'BRL',
  photo_path text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  bank_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  emergency_contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  dependents jsonb NOT NULL DEFAULT '[]'::jsonb,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, employee_number),
  UNIQUE (tenant_id, cpf)
);

CREATE TABLE IF NOT EXISTS public.rh_employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.rh_employees(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  title text NOT NULL,
  file_path text,
  issue_date date,
  expiration_date date,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'valid', 'rejected', 'expired', 'archived')),
  sensitive boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  weekly_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  tolerance_minutes integer NOT NULL DEFAULT 5,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_employee_schedule_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.rh_employees(id) ON DELETE CASCADE,
  schedule_id uuid NOT NULL REFERENCES public.rh_schedules(id) ON DELETE RESTRICT,
  starts_on date NOT NULL,
  ends_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.rh_employees(id) ON DELETE CASCADE,
  entry_type text NOT NULL CHECK (entry_type IN ('clock_in', 'break_start', 'break_end', 'clock_out', 'manual_adjustment')),
  occurred_at timestamptz NOT NULL,
  source text NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'mobile', 'desktop', 'tablet', 'device', 'import', 'manual')),
  latitude numeric(10,7),
  longitude numeric(10,7),
  device_id text,
  approved_by uuid,
  approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  audit_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.rh_employees(id) ON DELETE CASCADE,
  absence_type text NOT NULL CHECK (absence_type IN ('vacation', 'sick_note', 'leave', 'day_off', 'unjustified', 'other')),
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'approved', 'rejected', 'cancelled', 'closed')),
  document_id uuid REFERENCES public.rh_employee_documents(id) ON DELETE SET NULL,
  requested_by uuid,
  approved_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  benefit_type text NOT NULL CHECK (benefit_type IN ('transport', 'meal', 'food', 'health', 'dental', 'life_insurance', 'custom')),
  default_company_amount numeric(14,2) NOT NULL DEFAULT 0,
  default_employee_discount numeric(14,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_employee_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.rh_employees(id) ON DELETE CASCADE,
  benefit_id uuid NOT NULL REFERENCES public.rh_benefits(id) ON DELETE RESTRICT,
  starts_on date NOT NULL,
  ends_on date,
  company_amount numeric(14,2) NOT NULL DEFAULT 0,
  employee_discount numeric(14,2) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  competence_month date NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'calculated', 'review', 'approved', 'esocial_sent', 'closed', 'reopened')),
  legal_rule_version text NOT NULL,
  gross_total numeric(14,2) NOT NULL DEFAULT 0,
  net_total numeric(14,2) NOT NULL DEFAULT 0,
  employer_cost_total numeric(14,2) NOT NULL DEFAULT 0,
  approved_by uuid,
  approved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, competence_month)
);

CREATE TABLE IF NOT EXISTS public.rh_payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  payroll_period_id uuid NOT NULL REFERENCES public.rh_payroll_periods(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.rh_employees(id) ON DELETE RESTRICT,
  gross_amount numeric(14,2) NOT NULL DEFAULT 0,
  discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  net_amount numeric(14,2) NOT NULL DEFAULT 0,
  employer_cost_amount numeric(14,2) NOT NULL DEFAULT 0,
  calculation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'calculated', 'review', 'approved', 'released', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payroll_period_id, employee_id)
);

CREATE TABLE IF NOT EXISTS public.rh_payroll_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  payroll_item_id uuid NOT NULL REFERENCES public.rh_payroll_items(id) ON DELETE CASCADE,
  event_code text NOT NULL,
  description text NOT NULL,
  event_kind text NOT NULL CHECK (event_kind IN ('earning', 'deduction', 'employer_cost', 'tax', 'information')),
  reference_value numeric(14,4),
  amount numeric(14,2) NOT NULL DEFAULT 0,
  legal_rule_version text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  payroll_item_id uuid NOT NULL REFERENCES public.rh_payroll_items(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.rh_employees(id) ON DELETE RESTRICT,
  pdf_path text,
  released_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'released', 'viewed', 'signed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_esocial_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  payroll_period_id uuid REFERENCES public.rh_payroll_periods(id) ON DELETE SET NULL,
  environment text NOT NULL DEFAULT 'restricted' CHECK (environment IN ('restricted', 'production')),
  layout_version text NOT NULL,
  event_group text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'queued', 'sent', 'accepted', 'rejected', 'partial', 'cancelled')),
  protocol_number text,
  response_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.rh_esocial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES public.rh_esocial_batches(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES public.rh_employees(id) ON DELETE SET NULL,
  event_code text NOT NULL,
  operation text NOT NULL DEFAULT 'include' CHECK (operation IN ('include', 'update', 'delete', 'rectify')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'queued', 'sent', 'accepted', 'rejected', 'rectified', 'cancelled')),
  xml_payload text NOT NULL,
  receipt_number text,
  rejection_messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  accepted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.rh_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  actor_user_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_table text NOT NULL,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rh_tenant_members_tenant_idx ON public.rh_tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS rh_employees_tenant_status_idx ON public.rh_employees(tenant_id, status);
CREATE INDEX IF NOT EXISTS rh_time_entries_employee_time_idx ON public.rh_time_entries(employee_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS rh_absences_employee_period_idx ON public.rh_absences(employee_id, starts_on, ends_on);
CREATE INDEX IF NOT EXISTS rh_payroll_periods_tenant_competence_idx ON public.rh_payroll_periods(tenant_id, competence_month DESC);
CREATE INDEX IF NOT EXISTS rh_esocial_events_tenant_status_idx ON public.rh_esocial_events(tenant_id, status, event_code);
CREATE INDEX IF NOT EXISTS rh_audit_logs_tenant_created_idx ON public.rh_audit_logs(tenant_id, created_at DESC);

ALTER TABLE public.rh_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_employee_schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_employee_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_payroll_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_esocial_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_esocial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY rh_tenant_member_can_read_tenant ON public.rh_tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rh_tenant_members member
      WHERE member.tenant_id = rh_tenants.id
        AND member.auth_user_id = auth.uid()
        AND member.status = 'active'
    )
  );

CREATE POLICY rh_member_can_read_own_membership ON public.rh_tenant_members
  FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY rh_tenant_admin_can_manage_membership ON public.rh_tenant_members
  FOR ALL
  USING (public.rh_user_has_tenant_role(tenant_id, ARRAY['admin', 'rh', 'dp']))
  WITH CHECK (public.rh_user_has_tenant_role(tenant_id, ARRAY['admin', 'rh', 'dp']));

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'rh_units',
    'rh_departments',
    'rh_positions',
    'rh_employees',
    'rh_employee_documents',
    'rh_schedules',
    'rh_employee_schedule_assignments',
    'rh_time_entries',
    'rh_absences',
    'rh_benefits',
    'rh_employee_benefits',
    'rh_payroll_periods',
    'rh_payroll_items',
    'rh_payroll_events',
    'rh_payslips',
    'rh_esocial_batches',
    'rh_esocial_events',
    'rh_audit_logs'
  ]
  LOOP
    EXECUTE format('CREATE POLICY rh_tenant_member_select ON public.%I FOR SELECT USING (public.rh_user_has_tenant_access(tenant_id))', table_name);
    EXECUTE format('CREATE POLICY rh_tenant_staff_insert ON public.%I FOR INSERT WITH CHECK (public.rh_user_has_tenant_role(tenant_id, ARRAY[''admin'', ''rh'', ''dp'']))', table_name);
    EXECUTE format('CREATE POLICY rh_tenant_staff_update ON public.%I FOR UPDATE USING (public.rh_user_has_tenant_role(tenant_id, ARRAY[''admin'', ''rh'', ''dp''])) WITH CHECK (public.rh_user_has_tenant_role(tenant_id, ARRAY[''admin'', ''rh'', ''dp'']))', table_name);
    EXECUTE format('CREATE POLICY rh_tenant_admin_delete ON public.%I FOR DELETE USING (public.rh_user_has_tenant_role(tenant_id, ARRAY[''admin'']))', table_name);
  END LOOP;
END $$;

COMMENT ON TABLE public.rh_esocial_events IS
  'Fila de eventos eSocial. Cada linha deve preservar XML, status, recibo, rejeicoes e retificacoes por leiaute/competencia.';

COMMENT ON TABLE public.rh_payroll_periods IS
  'Fechamento de folha versionado por competencia e versao de regra legal.';
