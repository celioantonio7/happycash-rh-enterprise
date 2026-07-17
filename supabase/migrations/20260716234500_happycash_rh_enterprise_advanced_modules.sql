CREATE TABLE IF NOT EXISTS public.rh_recruitment_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.rh_units(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.rh_departments(id) ON DELETE SET NULL,
  position_id uuid REFERENCES public.rh_positions(id) ON DELETE SET NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'paused', 'closed', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  openings integer NOT NULL DEFAULT 1,
  source_channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  pipeline_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.rh_recruitment_jobs(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  source text,
  resume_path text,
  current_step text,
  status text NOT NULL DEFAULT 'candidate'
    CHECK (status IN ('candidate', 'screening', 'interview', 'approved', 'rejected', 'hired', 'archived')),
  evaluation jsonb NOT NULL DEFAULT '{}'::jsonb,
  converted_employee_id uuid REFERENCES public.rh_employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text,
  mandatory boolean NOT NULL DEFAULT false,
  validity_months integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_training_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.rh_training_courses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.rh_employees(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'in_progress', 'completed', 'expired', 'cancelled')),
  completed_at timestamptz,
  certificate_path text,
  expires_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_performance_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'calibration', 'closed', 'cancelled')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES public.rh_performance_cycles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.rh_employees(id) ON DELETE CASCADE,
  reviewer_user_id uuid,
  review_type text NOT NULL CHECK (review_type IN ('manager', 'self', 'peer', 'hr', '360')),
  score numeric(8,2),
  goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  feedback text,
  pdi jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'returned', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_sst_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.rh_employees(id) ON DELETE SET NULL,
  record_type text NOT NULL CHECK (record_type IN ('pgr', 'pcmso', 'aso', 'epi', 'cipa', 'cat', 'exam', 'risk')),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'expired', 'closed', 'cancelled')),
  issued_on date,
  expires_on date,
  file_path text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_legal_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  obligation_type text NOT NULL CHECK (obligation_type IN ('rais', 'dirf', 'caged', 'income_statement', 'fgts', 'inss', 'other')),
  competence_year integer NOT NULL,
  competence_month integer,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'generated', 'sent', 'accepted', 'rejected', 'cancelled')),
  file_path text,
  protocol_number text,
  response_messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('contract', 'addendum', 'term', 'warning', 'declaration', 'policy', 'custom')),
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  requires_signature boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  requires_acknowledgement boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  report_type text NOT NULL,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  groupings jsonb NOT NULL DEFAULT '[]'::jsonb,
  metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  orientation text NOT NULL DEFAULT 'portrait' CHECK (orientation IN ('portrait', 'landscape')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  user_id uuid,
  title text,
  context_type text NOT NULL DEFAULT 'general'
    CHECK (context_type IN ('general', 'clt_question', 'payroll_simulation', 'audit_review', 'recruitment', 'document')),
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rh_menu_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.rh_tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  menu_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  favorite_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  home_module text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

ALTER TABLE public.rh_recruitment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_performance_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_sst_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_legal_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_menu_preferences ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS rh_candidates_job_status_idx ON public.rh_candidates(job_id, status);
CREATE INDEX IF NOT EXISTS rh_training_enrollments_employee_idx ON public.rh_training_enrollments(employee_id, status);
CREATE INDEX IF NOT EXISTS rh_sst_records_tenant_expiry_idx ON public.rh_sst_records(tenant_id, expires_on);
CREATE INDEX IF NOT EXISTS rh_legal_obligations_tenant_type_year_idx ON public.rh_legal_obligations(tenant_id, obligation_type, competence_year);
CREATE INDEX IF NOT EXISTS rh_report_templates_tenant_type_idx ON public.rh_report_templates(tenant_id, report_type);

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'rh_recruitment_jobs',
    'rh_candidates',
    'rh_training_courses',
    'rh_training_enrollments',
    'rh_performance_cycles',
    'rh_performance_reviews',
    'rh_sst_records',
    'rh_legal_obligations',
    'rh_document_templates',
    'rh_announcements',
    'rh_report_templates',
    'rh_ai_conversations',
    'rh_menu_preferences'
  ]
  LOOP
    EXECUTE format('CREATE POLICY rh_tenant_member_select ON public.%I FOR SELECT USING (public.rh_user_has_tenant_access(tenant_id))', table_name);
    EXECUTE format('CREATE POLICY rh_tenant_staff_insert ON public.%I FOR INSERT WITH CHECK (public.rh_user_has_tenant_role(tenant_id, ARRAY[''admin'', ''rh'', ''dp'', ''gestor'', ''recrutador'']))', table_name);
    EXECUTE format('CREATE POLICY rh_tenant_staff_update ON public.%I FOR UPDATE USING (public.rh_user_has_tenant_role(tenant_id, ARRAY[''admin'', ''rh'', ''dp'', ''gestor'', ''recrutador''])) WITH CHECK (public.rh_user_has_tenant_role(tenant_id, ARRAY[''admin'', ''rh'', ''dp'', ''gestor'', ''recrutador'']))', table_name);
    EXECUTE format('CREATE POLICY rh_tenant_admin_delete ON public.%I FOR DELETE USING (public.rh_user_has_tenant_role(tenant_id, ARRAY[''admin'', ''rh'']))', table_name);
  END LOOP;
END $$;

COMMENT ON TABLE public.rh_ai_conversations IS
  'Historico do assistente IA do RH. Nao deve ser usado como fonte legal final sem validacao humana.';

COMMENT ON TABLE public.rh_sst_records IS
  'Registros de saude e seguranca ocupacional: PGR, PCMSO, ASO, EPI, CIPA, CAT, exames e riscos.';
