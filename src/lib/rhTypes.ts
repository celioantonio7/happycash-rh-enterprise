export type EmployeeStatus = "Ativo" | "Ferias" | "Afastado" | "Desligado";
export type TimeEntryType = "Entrada" | "Intervalo" | "Retorno" | "Saida";
export type PayrollStatus = "Rascunho" | "Calculado" | "Conferido" | "Liberado";
export type ESocialStatus = "Rascunho" | "Pendente" | "Validado" | "Aceito" | "Rejeitado";
export type ESocialCode = "S-2200" | "S-1200" | "S-1210" | "S-2299" | "S-2230";

export type RoutineKey =
  | "recruitment"
  | "admission"
  | "vacations"
  | "benefits"
  | "performance"
  | "training"
  | "communication"
  | "employeePortal"
  | "managerPortal"
  | "security"
  | "lgpd"
  | "integrations";

export interface Employee {
  id: string;
  name: string;
  photo: string;
  cpf: string;
  email: string;
  phone: string;
  role: string;
  cbo: string;
  department: string;
  unit: string;
  admissionDate: string;
  contractType: string;
  status: EmployeeStatus;
  salary: number;
  schedule: string;
  workHours: string;
  address: string;
  bank: string;
  emergency: string;
  dependents: string[];
  documents: string[];
  benefits: string[];
  history: string[];
  permissions: string[];
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  type: TimeEntryType;
  timestamp: string;
  source: string;
  status: "Pendente" | "Aprovado";
}

export interface PayrollEvent {
  code: string;
  label: string;
  kind: "Provento" | "Desconto";
  reference: string;
  amount: number;
}

export interface PayrollItem {
  id: string;
  employeeId: string;
  competence: string;
  gross: number;
  discounts: number;
  net: number;
  status: PayrollStatus;
  releasedAt?: string;
  paymentDate: string;
  salaryBase: number;
  inssBase: number;
  fgtsBase: number;
  fgtsDeposit: number;
  irrfBase: number;
  bankFileLine: string;
  hash: string;
  events: PayrollEvent[];
}

export interface ESocialEvent {
  id: string;
  employeeId?: string;
  competence?: string;
  code: ESocialCode;
  title: string;
  status: ESocialStatus;
  xml: string;
  protocol?: string;
  validationMessages: string[];
  createdAt: string;
}

export interface RoutineRecord {
  id: string;
  module: RoutineKey;
  employeeId?: string;
  title: string;
  status: string;
  date: string;
  details: string;
}

export interface RoutineDraft {
  title: string;
  status: string;
  date: string;
  details: string;
  employeeId: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  actor: string;
  date: string;
  details: string;
}

export interface HRData {
  employees: Employee[];
  timeEntries: TimeEntry[];
  payroll: PayrollItem[];
  esocial: ESocialEvent[];
  routines: RoutineRecord[];
  auditLogs: AuditLog[];
  integrationPrepared?: boolean;
}
