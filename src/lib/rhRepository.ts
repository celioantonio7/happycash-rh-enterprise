import { hasRhSupabaseConfig, rhSupabase, rhTenantId } from "./rhSupabase";
import type { AuditLog, Employee, ESocialEvent, HRData, PayrollItem, RoutineRecord, TimeEntry } from "./rhTypes";

export type RHRepositoryMode = "local" | "supabase";

const storageKey = "happycash-rh-enterprise:data";
type JsonRecord = Record<string, unknown>;
type SupabaseRow = Record<string, unknown>;

const isUuid = (value?: string) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

const createJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const asRecord = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const asString = (value: unknown) => typeof value === "string" ? value : "";
const asStringArray = (value: unknown) => Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
const asTextArray = (value: unknown) => Array.isArray(value)
  ? value.map((item) => {
    if (item && typeof item === "object" && "text" in item) return String((item as { text?: unknown }).text || "");
    return String(item || "");
  }).filter(Boolean)
  : [];

const toEmployeeRow = (employee: Employee) => ({
  ...(isUuid(employee.id) ? { id: employee.id } : {}),
  tenant_id: rhTenantId,
  employee_number: employee.id,
  full_name: employee.name,
  cpf: employee.cpf || null,
  email: employee.email || null,
  phone: employee.phone || null,
  status: employee.status === "Ferias" ? "vacation" : employee.status === "Afastado" ? "leave" : employee.status === "Desligado" ? "terminated" : "active",
  contract_type: employee.contractType.toLocaleLowerCase("pt-BR").includes("clt") ? "clt" : "other",
  admission_date: employee.admissionDate || null,
  salary_amount: Number(employee.salary || 0),
  photo_path: employee.photo || null,
  address: { text: employee.address },
  bank_data: { text: employee.bank },
  emergency_contacts: employee.emergency ? [{ text: employee.emergency }] : [],
  dependents: employee.dependents.map((item) => ({ text: item })),
  custom_fields: {
    app_id: employee.id,
    role: employee.role,
    cbo: employee.cbo,
    department: employee.department,
    unit: employee.unit,
    schedule: employee.schedule,
    work_hours: employee.workHours,
    documents: employee.documents,
    benefits: employee.benefits,
    history: employee.history,
    permissions: employee.permissions,
  },
});

const fromEmployeeRow = (row: SupabaseRow): Employee => {
  const custom = asRecord(row.custom_fields);
  const address = asRecord(row.address);
  const bankData = asRecord(row.bank_data);
  return {
    id: asString(row.id),
    name: asString(row.full_name),
    photo: asString(row.photo_path),
    cpf: asString(row.cpf),
    email: asString(row.email),
    phone: asString(row.phone),
    role: asString(custom.role),
    cbo: asString(custom.cbo),
    department: asString(custom.department),
    unit: asString(custom.unit),
    admissionDate: asString(row.admission_date),
    contractType: row.contract_type === "clt" ? "CLT" : "Outro",
    status: row.status === "vacation" ? "Ferias" : row.status === "leave" ? "Afastado" : row.status === "terminated" ? "Desligado" : "Ativo",
    salary: Number(row.salary_amount || 0),
    schedule: asString(custom.schedule),
    workHours: asString(custom.work_hours),
    address: asString(address.text),
    bank: asString(bankData.text),
    emergency: asTextArray(row.emergency_contacts)[0] || "",
    dependents: asTextArray(row.dependents),
    documents: asStringArray(custom.documents),
    benefits: asStringArray(custom.benefits),
    history: asStringArray(custom.history),
    permissions: asStringArray(custom.permissions),
  };
};

const toTimeEntryRow = (entry: TimeEntry) => ({
  ...(isUuid(entry.id) ? { id: entry.id } : {}),
  tenant_id: rhTenantId,
  employee_id: isUuid(entry.employeeId) ? entry.employeeId : null,
  entry_type: entry.type === "Entrada" ? "clock_in" : entry.type === "Intervalo" ? "break_start" : entry.type === "Retorno" ? "break_end" : "clock_out",
  occurred_at: entry.timestamp,
  source: entry.source.toLocaleLowerCase("pt-BR").includes("tablet") ? "tablet" : "web",
  approval_status: entry.status === "Aprovado" ? "approved" : "pending",
  audit_reason: isUuid(entry.employeeId) ? null : `legacy_employee_id:${entry.employeeId}`,
});

const fromTimeEntryRow = (row: SupabaseRow): TimeEntry => ({
  id: asString(row.id),
  employeeId: asString(row.employee_id),
  type: row.entry_type === "clock_in" ? "Entrada" : row.entry_type === "break_start" ? "Intervalo" : row.entry_type === "break_end" ? "Retorno" : "Saida",
  timestamp: asString(row.occurred_at),
  source: asString(row.source) || "web",
  status: row.approval_status === "approved" ? "Aprovado" : "Pendente",
});

const toAuditRow = (log: AuditLog) => ({
  ...(isUuid(log.id) ? { id: log.id } : {}),
  tenant_id: rhTenantId,
  actor_email: log.actor,
  action: log.action,
  entity_table: log.entity,
  after_data: { details: log.details, app_id: log.id },
  created_at: log.date,
});

const fromAuditRow = (row: SupabaseRow): AuditLog => ({
  id: asString(row.id),
  action: asString(row.action),
  entity: asString(row.entity_table),
  actor: asString(row.actor_email) || "sistema",
  date: asString(row.created_at),
  details: asString(asRecord(row.after_data).details),
});

const toRoutineAuditRow = (routine: RoutineRecord) => ({
  ...(isUuid(routine.id) ? { id: routine.id } : {}),
  tenant_id: rhTenantId,
  actor_email: "rh.enterprise",
  action: `routine:${routine.module}:${routine.status}`,
  entity_table: "rh_enterprise_routine",
  entity_id: isUuid(routine.employeeId) ? routine.employeeId : null,
  after_data: createJson(routine),
  created_at: new Date(`${routine.date}T12:00:00`).toISOString(),
});

const fromRoutineAuditRow = (row: SupabaseRow): RoutineRecord => {
  const data = asRecord(row.after_data);
  return {
    id: asString(data.id) || asString(row.id),
    module: (asString(data.module) || "communication") as RoutineRecord["module"],
    employeeId: asString(data.employeeId) || undefined,
    title: asString(data.title) || asString(row.action),
    status: asString(data.status) || "Registrado",
    date: asString(data.date) || asString(row.created_at).slice(0, 10),
    details: asString(data.details),
  };
};

const loadLocalData = <T,>(fallback: T): T => {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "null") || fallback;
  } catch {
    return fallback;
  }
};

export const getRHRepositoryMode = (): RHRepositoryMode => (hasRhSupabaseConfig ? "supabase" : "local");

export const loadHRData = async (fallback: HRData): Promise<HRData> => {
  if (!rhSupabase) return loadLocalData(fallback);

  const [employeesResult, timeResult, auditResult] = await Promise.all([
    rhSupabase.from("rh_employees").select("*").eq("tenant_id", rhTenantId).order("created_at", { ascending: false }),
    rhSupabase.from("rh_time_entries").select("*").eq("tenant_id", rhTenantId).order("occurred_at", { ascending: false }),
    rhSupabase.from("rh_audit_logs").select("*").eq("tenant_id", rhTenantId).order("created_at", { ascending: false }).limit(300),
  ]);

  if (employeesResult.error) throw employeesResult.error;
  if (timeResult.error) throw timeResult.error;
  if (auditResult.error) throw auditResult.error;

  const auditRows = auditResult.data || [];
  return {
    ...fallback,
    employees: employeesResult.data?.length ? employeesResult.data.map(fromEmployeeRow) : fallback.employees,
    timeEntries: timeResult.data?.map(fromTimeEntryRow) || [],
    routines: auditRows.filter((row) => row.entity_table === "rh_enterprise_routine").map(fromRoutineAuditRow),
    auditLogs: auditRows.filter((row) => row.entity_table !== "rh_enterprise_routine").map(fromAuditRow),
  };
};

export const persistHRData = async (data: HRData) => {
  if (!rhSupabase) {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
    return;
  }

  const employees = data.employees.map(toEmployeeRow);
  const timeEntries = data.timeEntries.filter((entry) => isUuid(entry.employeeId)).map(toTimeEntryRow);
  const auditLogs = data.auditLogs.filter((log) => isUuid(log.id)).slice(0, 100).map(toAuditRow);
  const routines = data.routines.filter((routine) => isUuid(routine.id)).slice(0, 100).map(toRoutineAuditRow);

  if (employees.length) {
    const { error } = await rhSupabase.from("rh_employees").upsert(employees, { onConflict: "tenant_id,employee_number" });
    if (error) throw error;
  }

  if (timeEntries.length) {
    const { error } = await rhSupabase.from("rh_time_entries").upsert(timeEntries);
    if (error) throw error;
  }

  if (auditLogs.length || routines.length) {
    const { error } = await rhSupabase.from("rh_audit_logs").upsert([...auditLogs, ...routines], { onConflict: "id" });
    if (error) throw error;
  }
};

export const exportPayrollSnapshot = (payroll: PayrollItem[], esocial: ESocialEvent[]) => ({
  generatedAt: new Date().toISOString(),
  tenantId: rhTenantId || "local",
  payroll,
  esocial,
});
