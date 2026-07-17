CREATE TABLE IF NOT EXISTS public.rh_legal_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  version_code text NOT NULL,
  source_name text NOT NULL,
  source_url text,
  effective_from date NOT NULL,
  effective_to date,
  payroll_parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  fgts_parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  inss_parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  irrf_parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  esocial_layout_version text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'superseded', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, version_code)
);

CREATE TABLE IF NOT EXISTS public.rh_payroll_rubrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text NOT NULL,
  event_kind text NOT NULL CHECK (event_kind IN ('earning', 'deduction', 'employer_cost', 'tax', 'information')),
  esocial_nature_code text,
  affects_inss boolean NOT NULL DEFAULT false,
  affects_fgts boolean NOT NULL DEFAULT false,
  affects_irrf boolean NOT NULL DEFAULT false,
  affects_13th boolean NOT NULL DEFAULT false,
  affects_vacation boolean NOT NULL DEFAULT false,
  formula_expression text,
  legal_rule_version_id uuid REFERENCES public.rh_legal_rule_versions(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS public.rh_admission_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.rh_employees(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES public.rh_candidates(id) ON DELETE SET NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'waiting_documents', 'validating', 'signature', 'onboarding', 'completed', 'cancelled')),
  due_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_admission_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  checklist_id uuid NOT NULL REFERENCES public.rh_admission_checklists(id) ON DELETE CASCADE,
  task_type text NOT NULL CHECK (task_type IN ('document', 'validation', 'signature', 'benefit', 'contract', 'salary', 'schedule', 'onboarding')),
  title text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'received', 'approved', 'rejected', 'done', 'waived')),
  document_id uuid REFERENCES public.rh_employee_documents(id) ON DELETE SET NULL,
  assigned_to uuid,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_employee_portal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.rh_employees(id) ON DELETE CASCADE,
  request_type text NOT NULL
    CHECK (request_type IN ('profile_update', 'vacation', 'absence', 'medical_note', 'benefit', 'payslip_question', 'document_signature', 'bank_hours', 'other')),
  title text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'resolved', 'cancelled')),
  reviewer_user_id uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_manager_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  manager_user_id uuid,
  employee_id uuid REFERENCES public.rh_employees(id) ON DELETE CASCADE,
  approval_type text NOT NULL CHECK (approval_type IN ('time_entry', 'vacation', 'absence', 'performance', 'salary_change', 'position_change', 'goal', 'other')),
  target_table text,
  target_id uuid,
  title text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'returned', 'cancelled')),
  decision_notes text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_lgpd_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.rh_employees(id) ON DELETE SET NULL,
  requester_name text NOT NULL,
  requester_email text,
  request_type text NOT NULL CHECK (request_type IN ('access', 'correction', 'export', 'deletion', 'anonymization', 'consent_revocation', 'retention_review')),
  data_category text NOT NULL DEFAULT 'employee',
  contains_sensitive_data boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'identity_check', 'in_review', 'answered', 'retained_by_legal_obligation', 'anonymized', 'rejected', 'closed')),
  due_on date,
  response_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.rh_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  data_category text NOT NULL,
  legal_basis text NOT NULL,
  retention_months integer NOT NULL,
  action_after_retention text NOT NULL DEFAULT 'review'
    CHECK (action_after_retention IN ('review', 'archive', 'anonymize', 'delete')),
  applies_to_sensitive_data boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, data_category)
);

CREATE TABLE IF NOT EXISTS public.rh_bank_payment_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  payroll_period_id uuid REFERENCES public.rh_payroll_periods(id) ON DELETE SET NULL,
  bank_code text NOT NULL,
  layout text NOT NULL DEFAULT 'CNAB240',
  file_path text,
  gross_amount numeric(14,2) NOT NULL DEFAULT 0,
  net_amount numeric(14,2) NOT NULL DEFAULT 0,
  records_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'generated', 'sent', 'accepted', 'rejected', 'cancelled')),
  response_messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_integration_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  connector_type text NOT NULL CHECK (connector_type IN ('accounting', 'esocial', 'time_clock', 'bank', 'signature', 'email', 'whatsapp', 'storage', 'benefits', 'erp', 'api')),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'configuring', 'connected', 'failed', 'paused', 'disabled')),
  credentials_ref text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, connector_type, name)
);

ALTER TABLE public.rh_legal_rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_payroll_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_admission_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_admission_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_employee_portal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_manager_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_lgpd_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_bank_payment_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_integration_connectors ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS rh_payroll_rubrics_tenant_code_idx ON public.rh_payroll_rubrics(tenant_id, code);
CREATE INDEX IF NOT EXISTS rh_portal_requests_employee_status_idx ON public.rh_employee_portal_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS rh_manager_approvals_tenant_status_idx ON public.rh_manager_approvals(tenant_id, status, approval_type);
CREATE INDEX IF NOT EXISTS rh_lgpd_requests_tenant_status_idx ON public.rh_lgpd_requests(tenant_id, status, due_on);
CREATE INDEX IF NOT EXISTS rh_integration_connectors_tenant_status_idx ON public.rh_integration_connectors(tenant_id, connector_type, status);

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'rh_legal_rule_versions',
    'rh_payroll_rubrics',
    'rh_admission_checklists',
    'rh_admission_tasks',
    'rh_employee_portal_requests',
    'rh_manager_approvals',
    'rh_lgpd_requests',
    'rh_retention_policies',
    'rh_bank_payment_files',
    'rh_integration_connectors'
  ]
  LOOP
    EXECUTE format('CREATE POLICY rh_tenant_member_select ON public.%I FOR SELECT USING (public.rh_user_has_tenant_access(tenant_id))', table_name);
    EXECUTE format('CREATE POLICY rh_tenant_member_insert ON public.%I FOR INSERT WITH CHECK (public.rh_user_has_tenant_role(tenant_id, ARRAY[''admin'', ''rh'', ''dp'', ''gestor'', ''recrutador'', ''colaborador'', ''contabilidade'']))', table_name);
    EXECUTE format('CREATE POLICY rh_tenant_staff_update ON public.%I FOR UPDATE USING (public.rh_user_has_tenant_role(tenant_id, ARRAY[''admin'', ''rh'', ''dp'', ''gestor'', ''recrutador''])) WITH CHECK (public.rh_user_has_tenant_role(tenant_id, ARRAY[''admin'', ''rh'', ''dp'', ''gestor'', ''recrutador'']))', table_name);
    EXECUTE format('CREATE POLICY rh_tenant_admin_delete ON public.%I FOR DELETE USING (public.rh_user_has_tenant_role(tenant_id, ARRAY[''admin'', ''rh'']))', table_name);
  END LOOP;
END $$;

COMMENT ON TABLE public.rh_payroll_rubrics IS
  'Rubricas versionadas da folha: codigo, natureza eSocial, incidencias INSS/FGTS/IRRF, formula e vigencia legal.';

COMMENT ON TABLE public.rh_lgpd_requests IS
  'Solicitacoes LGPD de acesso, correcao, exportacao, exclusao, anonimizacao e revisao de retencao.';

COMMENT ON TABLE public.rh_employee_portal_requests IS
  'Solicitacoes abertas pelo portal do colaborador: ferias, atestado, dados, beneficios, holerite e documentos.';
