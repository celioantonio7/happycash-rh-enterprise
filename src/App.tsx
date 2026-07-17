import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileSearch,
  FileText,
  Fingerprint,
  KeyRound,
  Landmark,
  LockKeyhole,
  MailCheck,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UploadCloud,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import happyCashLogo from "./assets/happycash.svg";
import { enterpriseModules } from "./lib/rhEnterpriseCatalog";
import { getRHRepositoryMode, loadHRData, persistHRData } from "./lib/rhRepository";
import type {
  AuditLog,
  Employee,
  EmployeeStatus,
  ESocialCode,
  ESocialEvent,
  HRData,
  PayrollItem,
  PayrollStatus,
  RoutineDraft,
  RoutineKey,
  RoutineRecord,
  TimeEntry,
  TimeEntryType,
} from "./lib/rhTypes";

type ViewKey = "painel" | "colaboradores" | "ponto" | "folha" | "holerites" | "portal" | "gestor" | "esocial" | "relatorios" | "configuracoes";
type ModalKey = null | "employee" | "profile" | "permissions" | "time" | "payroll" | "payslip" | "esocial" | "config" | "integration" | "routine";
type ConfigModalKey = "permissions" | "integration" | "rubrics" | "sst" | "esocial" | "audit";

const today = new Date().toISOString().slice(0, 10);
const currentCompetence = new Date().toISOString().slice(0, 7);

const companyInfo = {
  legalName: "HappyCash RH Demonstração Ltda.",
  tradeName: "HappyCash RH",
  cnpj: "12.345.678/0001-90",
  address: "Av. Gestão de Pessoas, 1000 - Centro - São José dos Campos/SP",
  payrollResponsible: "Departamento Pessoal",
};

const routineLabels: Record<RoutineKey, { title: string; description: string; sampleAction: string }> = {
  recruitment: {
    title: "Recrutamento e seleção",
    description: "Vagas, página de candidatura, banco de currículos, entrevistas, avaliação e conversão em colaborador.",
    sampleAction: "Nova vaga publicada",
  },
  admission: {
    title: "Admissão digital",
    description: "Checklist, envio/validação de documentos, assinatura, benefícios, cargo, salário e onboarding.",
    sampleAction: "Checklist de admissão criado",
  },
  vacations: {
    title: "Férias, folgas e afastamentos",
    description: "Solicitações, aprovações, período aquisitivo, férias vencidas, atestados, licenças e calendário.",
    sampleAction: "Solicitação de férias registrada",
  },
  benefits: {
    title: "Benefícios",
    description: "VT, VR, VA, saúde, odontológico, seguro de vida, dependentes, descontos e benefícios personalizados.",
    sampleAction: "Benefício vinculado ao colaborador",
  },
  performance: {
    title: "Avaliação de desempenho",
    description: "Metas, competências, feedbacks, avaliação 360, autoavaliação, PDI e histórico por ciclo.",
    sampleAction: "Ciclo de desempenho aberto",
  },
  training: {
    title: "Treinamentos",
    description: "Cursos, trilhas, obrigatoriedade, certificados, presença, provas, validade e alertas.",
    sampleAction: "Treinamento obrigatório atribuído",
  },
  communication: {
    title: "Comunicação interna",
    description: "Avisos, políticas, confirmação de ciência, aniversariantes, eventos, pesquisas e sugestões.",
    sampleAction: "Comunicado publicado",
  },
  employeePortal: {
    title: "Portal do colaborador",
    description: "Dados, holerites, ponto, férias, atestados, benefícios, banco de horas, documentos e solicitações.",
    sampleAction: "Acesso do colaborador habilitado",
  },
  managerPortal: {
    title: "Portal do gestor",
    description: "Equipe, aprovações, faltas, atrasos, metas, aniversários, ausências e solicitações de alteração.",
    sampleAction: "Painel do gestor atualizado",
  },
  security: {
    title: "Segurança e permissões",
    description: "Perfis, módulos, cargos, setores, autenticação, recuperação, sessões, logs, backup e exportação.",
    sampleAction: "Política de acesso revisada",
  },
  lgpd: {
    title: "LGPD",
    description: "Termos, política, consentimentos, acesso, visualização, exportação, correção, retenção e anonimização.",
    sampleAction: "Solicitação LGPD registrada",
  },
  integrations: {
    title: "Integrações",
    description: "Contabilidade, eSocial, relógio de ponto, bancos, assinatura, e-mail, WhatsApp, storage e benefícios.",
    sampleAction: "Conector marcado para implantação",
  },
};

const routineKeys: RoutineKey[] = [
  "recruitment",
  "admission",
  "vacations",
  "benefits",
  "performance",
  "training",
  "communication",
  "employeePortal",
  "managerPortal",
  "security",
  "lgpd",
  "integrations",
];

const routineStatuses: Record<RoutineKey, string[]> = {
  recruitment: ["Aberta", "Triagem", "Entrevista", "Aprovado", "Reprovado", "Convertido"],
  admission: ["Checklist", "Documentos", "Assinatura", "Onboarding", "Concluido"],
  vacations: ["Solicitado", "Aprovado", "Programado", "Em andamento", "Concluido"],
  benefits: ["Solicitado", "Ativo", "Em desconto", "Suspenso", "Encerrado"],
  performance: ["Rascunho", "Aberto", "Em avaliação", "Calibração", "Concluido"],
  training: ["Atribuido", "Em andamento", "Concluido", "Vencendo", "Expirado"],
  communication: ["Rascunho", "Publicado", "Ciencia pendente", "Ciencia completa", "Arquivado"],
  employeePortal: ["Habilitado", "Solicitação aberta", "Aguardando RH", "Resolvido"],
  managerPortal: ["Aguardando gestor", "Aprovado", "Rejeitado", "Resolvido"],
  security: ["Rascunho", "Em revisão", "Ativo", "Bloqueado", "Auditado"],
  lgpd: ["Solicitado", "Em análise", "Atendido", "Retido por obrigação legal", "Anonimizado"],
  integrations: ["Planejado", "Em implantação", "Conectado", "Falha", "Monitorado"],
};

const routineBlueprints: Record<RoutineKey, string[]> = {
  recruitment: ["Vaga e prioridade", "Página de candidatura", "Currículo", "Etapas", "Entrevista", "Avaliação", "Aprovação", "Conversão em colaborador"],
  admission: ["Checklist de documentos", "Validação", "Assinatura", "Benefícios", "Cargo", "Salário", "Jornada", "Onboarding"],
  vacations: ["Solicitação", "Período aquisitivo", "Aprovação", "Férias vencidas", "Folgas", "Atestado", "Licença", "Calendário"],
  benefits: ["Vale-transporte", "Vale-refeição", "Vale-alimentação", "Saúde", "Odontológico", "Seguro", "Dependentes", "Desconto em folha"],
  performance: ["Metas", "Competências", "Autoavaliação", "Gestor", "360 graus", "Feedback", "PDI", "Histórico"],
  training: ["Curso", "Trilha", "Obrigatoriedade", "Presença", "Prova", "Certificado", "Validade", "Alerta"],
  communication: ["Aviso", "Política interna", "Ciência obrigatória", "Eventos", "Pesquisa", "Sugestões", "Aniversariantes"],
  employeePortal: ["Dados pessoais", "Holerite", "Ponto", "Férias", "Atestado", "Benefícios", "Banco de horas", "Assinatura"],
  managerPortal: ["Equipe", "Ponto", "Férias", "Faltas", "Atrasos", "Metas", "Aniversários", "Solicitações"],
  security: ["Perfis", "Permissões", "Sessões", "MFA", "Logs", "Backup", "Exportação", "Segregação por empresa"],
  lgpd: ["Termos", "Privacidade", "Consentimento", "Visualização", "Correção", "Exportação", "Retenção", "Anonimização"],
  integrations: ["Contabilidade", "eSocial", "Relógio de ponto", "Bancos", "Assinatura", "E-mail", "WhatsApp", "Storage"],
};

const configDetails: Record<Exclude<ConfigModalKey, "permissions" | "integration">, { title: string; description: string; items: string[] }> = {
  rubrics: {
    title: "Rubricas e folha",
    description: "Parâmetros de verbas, bases, descontos, proventos, líquido, encargos, CNAB e fechamento por competência.",
    items: ["Código da verba", "Natureza eSocial", "Incidência INSS", "Incidência FGTS", "Incidência IRRF", "Memória de cálculo", "Aprovação", "Retificação"],
  },
  sst: {
    title: "SST ocupacional",
    description: "Controle de PGR, PCMSO, ASO, EPI, CIPA, CAT, exames, riscos e vencimentos por colaborador.",
    items: ["PGR", "PCMSO", "ASO", "EPI", "CIPA", "CAT", "Exames", "Alertas de vencimento"],
  },
  esocial: {
    title: "eSocial",
    description: "Leiaute, XML, XSD, fila de envio, recibo, rejeição, retificação e ambiente por empresa.",
    items: ["S-2200", "S-1200", "S-1210", "S-2230", "S-2299", "XML", "Protocolo", "Retificação"],
  },
  audit: {
    title: "LGPD e auditoria",
    description: "Consentimento, acesso, exportação, correção, retenção, anonimização e logs de alteração.",
    items: ["Termos", "Política", "Consentimento", "Visualização", "Correção", "Exportação", "Retenção", "Anonimização"],
  },
};

const permissionGroups = [
  {
    title: "Portal do colaborador",
    items: [
      ["portal.view_profile", "Consultar dados pessoais"],
      ["portal.clock", "Registrar ponto"],
      ["portal.payslip", "Consultar holerites"],
      ["portal.vacation_request", "Solicitar férias"],
      ["portal.medical_note", "Enviar atestado"],
      ["portal.announcements", "Visualizar comunicados"],
    ],
  },
  {
    title: "Operação de RH",
    items: [
      ["hr.employees.read", "Visualizar colaboradores"],
      ["hr.employees.write", "Cadastrar e editar colaboradores"],
      ["hr.documents.write", "Gerenciar documentos"],
      ["hr.time.approve", "Aprovar ponto"],
      ["hr.vacations.approve", "Aprovar férias e afastamentos"],
      ["hr.reports.read", "Visualizar relatórios"],
    ],
  },
  {
    title: "Departamento pessoal",
    items: [
      ["dp.payroll.calculate", "Calcular folha"],
      ["dp.payslip.release", "Liberar holerites"],
      ["dp.esocial.manage", "Gerenciar eSocial"],
      ["dp.legal_obligations", "Gerenciar RAIS, DIRF, CAGED e informes"],
      ["dp.sst.manage", "Gerenciar SST, ASO, EPI, CIPA e CAT"],
    ],
  },
  {
    title: "Administração",
    items: [
      ["admin.permissions", "Alterar permissões"],
      ["admin.integration", "Preparar integração com HappyCash"],
      ["admin.settings", "Configurações gerais"],
      ["admin.audit", "Auditoria e LGPD"],
    ],
  },
] as const;

const navItems: Array<{ key: ViewKey; label: string; icon: typeof UsersRound }> = [
  { key: "painel", label: "Painel", icon: BarChart3 },
  { key: "colaboradores", label: "Colaboradores", icon: UsersRound },
  { key: "ponto", label: "Ponto", icon: Fingerprint },
  { key: "folha", label: "Folha", icon: Banknote },
  { key: "holerites", label: "Holerites", icon: ReceiptText },
  { key: "portal", label: "Portal", icon: UserRound },
  { key: "gestor", label: "Gestor", icon: BriefcaseBusiness },
  { key: "esocial", label: "eSocial", icon: Landmark },
  { key: "relatorios", label: "Relatórios", icon: FileText },
  { key: "configuracoes", label: "Configurações", icon: LockKeyhole },
];

const defaultEmployeePermissions = [
  "portal.view_profile",
  "portal.clock",
  "portal.payslip",
  "portal.vacation_request",
  "portal.medical_note",
  "portal.announcements",
];

const rhManagerPermissions = [
  ...defaultEmployeePermissions,
  "hr.employees.read",
  "hr.employees.write",
  "hr.documents.write",
  "hr.time.approve",
  "hr.vacations.approve",
  "hr.reports.read",
  "dp.payroll.calculate",
  "dp.payslip.release",
  "dp.esocial.manage",
  "admin.permissions",
  "admin.audit",
];

const employeeSeed: Employee[] = [
  {
    id: "emp-ana",
    name: "Ana Paula Martins",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80",
    cpf: "123.456.789-10",
    email: "ana@empresa.com.br",
    phone: "(12) 98888-1200",
    role: "Analista de RH",
    cbo: "2524-05",
    department: "Recursos Humanos",
    unit: "Matriz",
    admissionDate: "2024-03-12",
    contractType: "CLT",
    status: "Ativo",
    salary: 4200,
    schedule: "Segunda a sexta, 08:00-17:48",
    workHours: "220h mensais",
    address: "Rua das Palmeiras, 120 - Centro",
    bank: "Banco 001 - Ag. 1234 - CC 56789-0",
    emergency: "Marcos Martins - (12) 97777-4411",
    dependents: ["Helena Martins - filha - IRRF"],
    documents: ["Contrato CLT", "RG/CPF", "Comprovante de endereço", "ASO admissional"],
    benefits: ["Vale-refeição", "Vale-transporte", "Plano de saúde"],
    history: ["Admissão em 12/03/2024", "Treinamento LGPD concluído", "Promoção para Analista de RH"],
    permissions: rhManagerPermissions,
  },
  {
    id: "emp-lucas",
    name: "Lucas Ferreira",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=220&q=80",
    cpf: "222.333.444-55",
    email: "lucas@empresa.com.br",
    phone: "(12) 98888-7788",
    role: "Operador de Caixa",
    cbo: "4211-25",
    department: "Loja",
    unit: "Filial 01",
    admissionDate: "2023-09-01",
    contractType: "CLT",
    status: "Ativo",
    salary: 2140,
    schedule: "Segunda a sábado, 14:00-22:20",
    workHours: "220h mensais",
    address: "Av. Principal, 455 - Jardim Azul",
    bank: "Banco 237 - Ag. 0102 - CC 44321-8",
    emergency: "Carla Ferreira - (12) 96666-2323",
    dependents: [],
    documents: ["Contrato CLT", "Comprovante bancário", "Termo LGPD"],
    benefits: ["Vale-transporte", "Vale-alimentação"],
    history: ["Admissão em 01/09/2023", "Mudança de filial para Filial 01"],
    permissions: defaultEmployeePermissions,
  },
  {
    id: "emp-bruna",
    name: "Bruna Souza",
    photo: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=220&q=80",
    cpf: "321.654.987-00",
    email: "bruna@empresa.com.br",
    phone: "(12) 95555-8811",
    role: "Supervisora",
    cbo: "4101-05",
    department: "Operação",
    unit: "Matriz",
    admissionDate: "2022-11-18",
    contractType: "CLT",
    status: "Ferias",
    salary: 5150,
    schedule: "Escala 6x1, 09:00-17:20",
    workHours: "220h mensais",
    address: "Rua Norte, 88 - Vila Nova",
    bank: "Banco 341 - Ag. 7832 - CC 99001-2",
    emergency: "Rafael Souza - (12) 94444-0001",
    dependents: ["Pedro Souza - filho - IRRF", "Lia Souza - filha - IRRF"],
    documents: ["Contrato CLT", "ASO periódico", "Advertência arquivada"],
    benefits: ["Vale-refeição", "Plano odontológico"],
    history: ["Admissão em 18/11/2022", "Férias programadas", "Avaliação de desempenho acima da meta"],
    permissions: [...defaultEmployeePermissions, "hr.time.approve", "hr.vacations.approve"],
  },
];

const initialData: HRData = {
  employees: employeeSeed,
  timeEntries: [
    { id: "time-1", employeeId: "emp-lucas", type: "Entrada", timestamp: `${today}T14:02:00`, source: "Web", status: "Aprovado" },
    { id: "time-2", employeeId: "emp-lucas", type: "Intervalo", timestamp: `${today}T18:00:00`, source: "Web", status: "Pendente" },
    { id: "time-3", employeeId: "emp-ana", type: "Entrada", timestamp: `${today}T08:01:00`, source: "Tablet", status: "Aprovado" },
  ],
  payroll: [],
  esocial: [],
  routines: [
    { id: "routine-1", module: "recruitment", title: "Vaga Operador de Caixa", status: "Aberta", date: today, details: "Etapas: triagem, entrevista, teste prático e proposta." },
    { id: "routine-2", module: "vacations", employeeId: "emp-bruna", title: "Férias Bruna Souza", status: "Aprovado", date: today, details: "Período aquisitivo controlado e calendário bloqueado." },
    { id: "routine-3", module: "communication", title: "Política interna atualizada", status: "Publicado", date: today, details: "Exige confirmação de ciência no portal." },
  ],
  auditLogs: [
    { id: "audit-1", action: "create", entity: "employee", actor: "admin.demo", date: new Date().toISOString(), details: "Carga inicial de colaboradores." },
  ],
  integrationPrepared: false,
};

const blankEmployee: Omit<Employee, "id" | "documents" | "benefits" | "dependents" | "history" | "permissions"> = {
  name: "",
  photo: "",
  cpf: "",
  email: "",
  phone: "",
  role: "",
  cbo: "",
  department: "",
  unit: "Matriz",
  admissionDate: today,
  contractType: "CLT",
  status: "Ativo",
  salary: 0,
  schedule: "Segunda a sexta, 08:00-17:48",
  workHours: "220h mensais",
  address: "",
  bank: "",
  emergency: "",
};

const blankRoutineDraft: RoutineDraft = {
  title: "",
  status: "Aberta",
  date: today,
  details: "",
  employeeId: "",
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

const createId = (prefix: string) => crypto.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const getLastPaymentDate = (competenceValue: string) => {
  const [year, month] = competenceValue.split("-").map(Number);
  if (!year || !month) return today;
  return new Date(year, month, 0).toISOString().slice(0, 10);
};

const createPayrollHash = (value: string) => {
  try {
    return btoa(value).replace(/=/g, "").slice(0, 18).toUpperCase();
  } catch {
    return value.replace(/[^a-z0-9]/gi, "").slice(0, 18).toUpperCase();
  }
};

const normalizeEmployee = (employee: Employee): Employee => ({
  ...employee,
  cbo: employee.cbo || "",
  workHours: employee.workHours || "220h mensais",
  dependents: employee.dependents || [],
  history: employee.history || [],
  permissions: employee.permissions?.length ? employee.permissions : defaultEmployeePermissions,
});

const normalizePayrollItem = (item: Partial<PayrollItem>): PayrollItem => {
  const gross = Number(item.gross || 0);
  const discounts = Number(item.discounts || 0);
  const net = Number(item.net ?? gross - discounts);
  const competenceValue = item.competence || currentCompetence;
  const events = item.events?.length
    ? item.events.map((event, index) => ({
      code: event.code || String(index + 1).padStart(3, "0"),
      label: event.label,
      kind: event.kind === "Desconto" ? "Desconto" as const : "Provento" as const,
      reference: event.reference || "Competência",
      amount: Number(event.amount || 0),
    }))
    : [
      { code: "001", label: "Salário base", kind: "Provento" as const, reference: "Mensal", amount: gross },
      { code: "999", label: "Descontos", kind: "Desconto" as const, reference: "Total", amount: discounts },
    ].filter((event) => event.amount > 0);

  return {
    id: item.id || createId("pay"),
    employeeId: item.employeeId || "",
    competence: competenceValue,
    gross,
    discounts,
    net,
    status: item.status || "Calculado",
    releasedAt: item.releasedAt,
    paymentDate: item.paymentDate || getLastPaymentDate(competenceValue),
    salaryBase: Number(item.salaryBase || gross),
    inssBase: Number(item.inssBase || gross),
    fgtsBase: Number(item.fgtsBase || gross),
    fgtsDeposit: Number(item.fgtsDeposit || Math.round(gross * 0.08)),
    irrfBase: Number(item.irrfBase || Math.max(0, gross - discounts)),
    bankFileLine: item.bankFileLine || `CNAB240|${item.employeeId || "sem-matricula"}|${net}`,
    hash: item.hash || createPayrollHash(`${item.employeeId}:${competenceValue}:${gross}:${discounts}`),
    events,
  };
};

const normalizeData = (value: unknown): HRData => {
  const parsed = value as Partial<HRData> | null;
  return {
    employees: parsed?.employees?.length ? parsed.employees.map((employee) => normalizeEmployee(employee as Employee)) : initialData.employees,
    timeEntries: parsed?.timeEntries ?? initialData.timeEntries,
    payroll: parsed?.payroll?.map((item) => normalizePayrollItem(item)) ?? initialData.payroll,
    esocial: parsed?.esocial ?? initialData.esocial,
    routines: parsed?.routines ?? initialData.routines,
    auditLogs: parsed?.auditLogs ?? initialData.auditLogs,
    integrationPrepared: parsed?.integrationPrepared ?? false,
  };
};

const useHRData = () => {
  const [data, setData] = useState<HRData>(() => {
    try {
      return normalizeData(JSON.parse(window.localStorage.getItem("happycash-rh-enterprise:data") || "null"));
    } catch {
      return initialData;
    }
  });
  const [repositoryStatus, setRepositoryStatus] = useState("Modo local pronto.");
  const repositoryMode = getRHRepositoryMode();

  useEffect(() => {
    let active = true;
    void loadHRData(initialData)
      .then((loaded) => {
        if (!active) return;
        setData(normalizeData(loaded));
        setRepositoryStatus(repositoryMode === "supabase" ? "Dados carregados do Supabase RH." : "Modo local usando navegador.");
      })
      .catch((error) => {
        if (!active) return;
        setRepositoryStatus(`Falha ao carregar Supabase RH: ${error instanceof Error ? error.message : "erro desconhecido"}. Usando cache local.`);
      });

    return () => {
      active = false;
    };
  }, [repositoryMode]);

  useEffect(() => {
    window.localStorage.setItem("happycash-rh-enterprise:data", JSON.stringify(data));
  }, [data]);

  const syncData = async () => {
    try {
      await persistHRData(data);
      setRepositoryStatus(repositoryMode === "supabase" ? "Sincronizado com Supabase RH." : "Salvo no modo local.");
    } catch (error) {
      setRepositoryStatus(`Falha ao sincronizar: ${error instanceof Error ? error.message : "erro desconhecido"}.`);
      throw error;
    }
  };

  return [data, setData, repositoryMode, repositoryStatus, syncData] as const;
};

const SplashScreen = ({ progress }: { progress: number }) => (
  <div className="splash-screen" aria-label="Carregando HappyCash RH">
    <div className="splash-shell">
      <img src={happyCashLogo} alt="HappyCash" className="splash-logo" />
      <p className="splash-kicker">RH ENTERPRISE</p>
      <h1>Gestão completa de pessoas, folha, holerites e eSocial.</h1>
      <div className="splash-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="splash-meta">
        <span>{progress}%</span>
        <span>Carregando módulos de RH</span>
      </div>
    </div>
  </div>
);

interface ModalProps {
  title: string;
  description?: string;
  size?: "md" | "lg" | "xl";
  onClose: () => void;
  children: ReactNode;
}

const Modal = ({ title, description, size = "lg", onClose, children }: ModalProps) => (
  <div className="rh-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="rh-modal-title">
    <div className={`rh-modal rh-modal-${size}`}>
      <header className="rh-modal-header">
        <div>
          <h2 id="rh-modal-title">{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        <button type="button" className="rh-icon-button" onClick={onClose} aria-label="Fechar modal">
          <X size={20} />
        </button>
      </header>
      <div className="rh-modal-body">{children}</div>
    </div>
  </div>
);

const App = () => {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<ViewKey>("painel");
  const [modal, setModal] = useState<ModalKey>(null);
  const [configModal, setConfigModal] = useState<ConfigModalKey | null>(null);
  const [data, setData, repositoryMode, repositoryStatus, syncData] = useHRData();
  const [query, setQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(data.employees[0]?.id || "");
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeForm, setEmployeeForm] = useState(blankEmployee);
  const [documentInput, setDocumentInput] = useState("Contrato de trabalho");
  const [benefitInput, setBenefitInput] = useState("Vale-refeição");
  const [dependentInput, setDependentInput] = useState("");
  const [historyInput, setHistoryInput] = useState("");
  const [permissionDraft, setPermissionDraft] = useState<string[]>(defaultEmployeePermissions);
  const [timeType, setTimeType] = useState<TimeEntryType>("Entrada");
  const [competence, setCompetence] = useState(currentCompetence);
  const [selectedPayrollId, setSelectedPayrollId] = useState("");
  const [esocialCode, setESocialCode] = useState<ESocialCode>("S-1200");
  const [routineKey, setRoutineKey] = useState<RoutineKey>("recruitment");
  const [routineDraft, setRoutineDraft] = useState<RoutineDraft>(blankRoutineDraft);
  const [notice, setNotice] = useState("Pronto para operar. Use os botões para abrir cada rotina em modal.");

  const syncRepository = async () => {
    try {
      await syncData();
      setNotice(repositoryMode === "supabase" ? "Dados sincronizados com o banco RH." : "Dados salvos no modo local.");
    } catch {
      setNotice("Não foi possível sincronizar agora. Confira as variáveis do Supabase RH.");
    }
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(100, current + 5);
        if (next === 100) {
          window.clearInterval(interval);
          window.setTimeout(() => setReady(true), 260);
        }
        return next;
      });
    }, 45);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId && data.employees[0]) {
      setSelectedEmployeeId(data.employees[0].id);
    }
  }, [data.employees, selectedEmployeeId]);

  const employees = data.employees;
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId) || employees[0];
  const editingEmployee = editingEmployeeId ? employees.find((employee) => employee.id === editingEmployeeId) : null;
  const filteredEmployees = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return employees;
    return employees.filter((employee) =>
      [employee.name, employee.role, employee.department, employee.unit, employee.cpf, employee.email]
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(term)),
    );
  }, [employees, query]);

  const activeEmployees = employees.filter((employee) => employee.status === "Ativo").length;
  const payrollForCompetence = data.payroll.filter((item) => item.competence === competence);
  const totalGross = payrollForCompetence.reduce((sum, item) => sum + item.gross, 0);
  const totalDiscounts = payrollForCompetence.reduce((sum, item) => sum + item.discounts, 0);
  const totalNet = payrollForCompetence.reduce((sum, item) => sum + item.net, 0);
  const pendingTimeEntries = data.timeEntries.filter((entry) => entry.status === "Pendente").length;
  const pendingESocial = data.esocial.filter((event) => event.status === "Pendente" || event.status === "Rascunho" || event.status === "Validado").length;
  const selectedPayroll = data.payroll.find((item) => item.id === selectedPayrollId) || data.payroll[0];
  const selectedEmployeePayroll = selectedEmployee ? data.payroll.filter((item) => item.employeeId === selectedEmployee.id) : [];
  const selectedEmployeeTimeEntries = selectedEmployee ? data.timeEntries.filter((entry) => entry.employeeId === selectedEmployee.id) : [];
  const selectedEmployeeRoutines = selectedEmployee ? data.routines.filter((record) => record.employeeId === selectedEmployee.id) : [];
  const selectedRoutineLabel = routineLabels[routineKey];
  const selectedRoutineRecords = data.routines.filter((record) => record.module === routineKey);

  const closeModal = () => {
    setModal(null);
    setConfigModal(null);
  };

  const fillEmployeeForm = (employee?: Employee) => {
    if (employee) {
      setEditingEmployeeId(employee.id);
      setSelectedEmployeeId(employee.id);
      setEmployeeForm({
        name: employee.name,
        photo: employee.photo,
        cpf: employee.cpf,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        cbo: employee.cbo,
        department: employee.department,
        unit: employee.unit,
        admissionDate: employee.admissionDate,
        contractType: employee.contractType,
        status: employee.status,
        salary: employee.salary,
        schedule: employee.schedule,
        workHours: employee.workHours,
        address: employee.address,
        bank: employee.bank,
        emergency: employee.emergency,
      });
      setDocumentInput(employee.documents.join(", "));
      setBenefitInput(employee.benefits.join(", "));
      setDependentInput(employee.dependents.join(", "));
      setHistoryInput(employee.history.join(", "));
      setPermissionDraft(employee.permissions);
    } else {
      setEditingEmployeeId(null);
      setEmployeeForm(blankEmployee);
      setDocumentInput("Contrato de trabalho, RG/CPF, Comprovante de endereço");
      setBenefitInput("Vale-refeição, Vale-transporte");
      setDependentInput("");
      setHistoryInput("Cadastro inicial");
      setPermissionDraft(defaultEmployeePermissions);
    }
  };

  const openEmployeeModal = (employee?: Employee) => {
    fillEmployeeForm(employee);
    setModal("employee");
  };

  const openProfileModal = (employee: Employee) => {
    setSelectedEmployeeId(employee.id);
    setModal("profile");
  };

  const openPermissionsModal = (employee: Employee) => {
    setSelectedEmployeeId(employee.id);
    setPermissionDraft(employee.permissions);
    setModal("permissions");
  };

  const openRoutineModal = (key: RoutineKey, employeeId = "") => {
    const firstStatus = routineStatuses[key][0] || "Aberta";
    setRoutineKey(key);
    setRoutineDraft({
      title: routineLabels[key].sampleAction,
      status: firstStatus,
      date: today,
      details: routineBlueprints[key].join(", "),
      employeeId,
    });
    setModal("routine");
  };

  const saveRoutineRecord = () => {
    if (!routineDraft.title.trim()) {
      setNotice("Informe o título da rotina.");
      return;
    }
    const record: RoutineRecord = {
      id: createId("routine"),
      module: routineKey,
      employeeId: routineDraft.employeeId || undefined,
      title: routineDraft.title.trim(),
      status: routineDraft.status,
      date: routineDraft.date || today,
      details: routineDraft.details.trim(),
    };
    const employeeName = routineDraft.employeeId
      ? employees.find((employee) => employee.id === routineDraft.employeeId)?.name
      : "sem colaborador vinculado";
    setData((current) => ({
      ...current,
      routines: [record, ...current.routines],
      auditLogs: [{
        id: createId("audit"),
        action: "create_routine",
        entity: routineKey,
        actor: "rh.demo",
        date: new Date().toISOString(),
        details: `${selectedRoutineLabel.title}: ${record.title} (${employeeName})`,
      }, ...current.auditLogs],
    }));
    setNotice(`${selectedRoutineLabel.title} registrado.`);
    closeModal();
  };

  const removeRoutineRecord = (recordId: string) => {
    setData((current) => ({
      ...current,
      routines: current.routines.filter((record) => record.id !== recordId),
      auditLogs: [{
        id: createId("audit"),
        action: "delete_routine",
        entity: "routine",
        actor: "rh.demo",
        date: new Date().toISOString(),
        details: `Removeu rotina ${recordId}`,
      }, ...current.auditLogs],
    }));
    setNotice("Rotina removida.");
  };

  const saveEmployee = () => {
    if (!employeeForm.name.trim()) {
      setNotice("Informe o nome do colaborador.");
      return;
    }

    const documents = documentInput.split(",").map((item) => item.trim()).filter(Boolean);
    const benefits = benefitInput.split(",").map((item) => item.trim()).filter(Boolean);
    const dependents = dependentInput.split(",").map((item) => item.trim()).filter(Boolean);
    const history = historyInput.split(",").map((item) => item.trim()).filter(Boolean);
    const audit: AuditLog = {
      id: createId("audit"),
      action: editingEmployee ? "update" : "create",
      entity: "employee",
      actor: "admin.demo",
      date: new Date().toISOString(),
      details: `${editingEmployee ? "Atualizou" : "Cadastrou"} colaborador ${employeeForm.name}`,
    };

    if (editingEmployee) {
      setData((current) => ({
        ...current,
        employees: current.employees.map((employee) =>
          employee.id === editingEmployee.id
            ? { ...employee, ...employeeForm, salary: Number(employeeForm.salary), documents, benefits, dependents, history: [...history, `Atualizado em ${new Date().toLocaleString("pt-BR")}`] }
            : employee,
        ),
        auditLogs: [audit, ...current.auditLogs],
      }));
      setNotice("Colaborador atualizado.");
    } else {
      const employee: Employee = {
        id: createId("emp"),
        ...employeeForm,
        salary: Number(employeeForm.salary),
        photo: employeeForm.photo || "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=220&q=80",
        documents,
        benefits,
        dependents,
        history,
        permissions: defaultEmployeePermissions,
      };
      setData((current) => ({ ...current, employees: [employee, ...current.employees], auditLogs: [audit, ...current.auditLogs] }));
      setSelectedEmployeeId(employee.id);
      setNotice("Colaborador cadastrado.");
    }

    closeModal();
  };

  const removeEmployee = (employeeId: string) => {
    setData((current) => ({
      ...current,
      employees: current.employees.filter((employee) => employee.id !== employeeId),
      timeEntries: current.timeEntries.filter((entry) => entry.employeeId !== employeeId),
      payroll: current.payroll.filter((item) => item.employeeId !== employeeId),
      esocial: current.esocial.filter((event) => event.employeeId !== employeeId),
      routines: current.routines.filter((routine) => routine.employeeId !== employeeId),
      auditLogs: [{
        id: createId("audit"),
        action: "delete",
        entity: "employee",
        actor: "admin.demo",
        date: new Date().toISOString(),
        details: `Removeu colaborador ${employees.find((employee) => employee.id === employeeId)?.name || employeeId}`,
      }, ...current.auditLogs],
    }));
    setSelectedEmployeeId(data.employees.find((employee) => employee.id !== employeeId)?.id || "");
    setNotice("Colaborador removido do teste local.");
    closeModal();
  };

  const togglePermission = (permission: string) => {
    setPermissionDraft((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const savePermissions = () => {
    if (!selectedEmployee) return;
    setData((current) => ({
      ...current,
      employees: current.employees.map((employee) =>
        employee.id === selectedEmployee.id ? { ...employee, permissions: permissionDraft } : employee,
      ),
      auditLogs: [{
        id: createId("audit"),
        action: "update_permissions",
        entity: "employee",
        actor: "admin.demo",
        date: new Date().toISOString(),
        details: `Alterou permissões de ${selectedEmployee.name}`,
      }, ...current.auditLogs],
    }));
    setNotice(`Permissões atualizadas para ${selectedEmployee.name}.`);
    closeModal();
  };

  const registerTimeEntry = (employeeId = selectedEmployee?.id) => {
    if (!employeeId) return;
    const entry: TimeEntry = {
      id: createId("time"),
      employeeId,
      type: timeType,
      timestamp: new Date().toISOString(),
      source: "Web",
      status: timeType === "Entrada" || timeType === "Saida" ? "Aprovado" : "Pendente",
    };
    setData((current) => ({
      ...current,
      timeEntries: [entry, ...current.timeEntries],
      auditLogs: [{
        id: createId("audit"),
        action: "clock",
        entity: "time_entry",
        actor: "portal.demo",
        date: new Date().toISOString(),
        details: `${timeType} registrada para ${employees.find((employee) => employee.id === employeeId)?.name || employeeId}`,
      }, ...current.auditLogs],
    }));
    setNotice(`${timeType} registrada para ${employees.find((employee) => employee.id === employeeId)?.name || "colaborador"}.`);
    closeModal();
  };

  const approveTimeEntry = (entryId: string) => {
    setData((current) => ({
      ...current,
      timeEntries: current.timeEntries.map((entry) => entry.id === entryId ? { ...entry, status: "Aprovado" } : entry),
      auditLogs: [{
        id: createId("audit"),
        action: "approve_time",
        entity: "time_entry",
        actor: "gestor.demo",
        date: new Date().toISOString(),
        details: `Aprovou marcação ${entryId}`,
      }, ...current.auditLogs],
    }));
    setNotice("Marcação aprovada.");
  };

  const calculatePayroll = () => {
    const payroll = employees
      .filter((employee) => employee.status !== "Desligado")
      .map((employee) => {
        const overtime = employee.status === "Ativo" ? Math.round(employee.salary * 0.045) : 0;
        const additional = employee.department === "Operação" ? Math.round(employee.salary * 0.08) : 0;
        const commission = employee.role.toLocaleLowerCase("pt-BR").includes("caixa") ? 120 : 0;
        const bonus = employee.history.length > 2 ? 80 : 0;
        const absenceDiscount = employee.status === "Afastado" ? Math.round(employee.salary / 30) : 0;
        const benefitDiscount = employee.benefits.length * 42;
        const gross = employee.salary + overtime + additional + commission + bonus;
        const inssBase = gross - absenceDiscount;
        const inss = Math.round(inssBase * 0.09);
        const irrfBase = Math.max(0, inssBase - inss - employee.dependents.length * 189.59);
        const irrf = irrfBase > 3000 ? Math.round(irrfBase * 0.075) : 0;
        const fgtsBase = gross - absenceDiscount;
        const fgtsDeposit = Math.round(fgtsBase * 0.08);
        const discounts = benefitDiscount + inss + irrf + absenceDiscount;
        const paymentDate = getLastPaymentDate(competence);
        const hash = createPayrollHash(`${employee.id}:${competence}:${gross}:${discounts}`);
        return {
          id: createId("pay"),
          employeeId: employee.id,
          competence,
          gross,
          discounts,
          net: gross - discounts,
          status: "Calculado" as PayrollStatus,
          paymentDate,
          salaryBase: employee.salary,
          inssBase,
          fgtsBase,
          fgtsDeposit,
          irrfBase,
          bankFileLine: `CNAB240|${employee.cpf}|${employee.bank}|${gross - discounts}`,
          hash,
          events: [
            { code: "001", label: "Salário base", kind: "Provento" as const, reference: employee.workHours, amount: employee.salary },
            { code: "050", label: "Horas extras", kind: "Provento" as const, reference: "Estimado pelo ponto", amount: overtime },
            { code: "070", label: "Adicional operacional", kind: "Provento" as const, reference: "8%", amount: additional },
            { code: "090", label: "Comissões", kind: "Provento" as const, reference: "Período", amount: commission },
            { code: "095", label: "Bonificação", kind: "Provento" as const, reference: "Avaliação", amount: bonus },
            { code: "305", label: "Faltas e atrasos", kind: "Desconto" as const, reference: "Espelho de ponto", amount: absenceDiscount },
            { code: "501", label: "INSS", kind: "Desconto" as const, reference: "Base INSS", amount: inss },
            { code: "502", label: "IRRF", kind: "Desconto" as const, reference: "Base IRRF", amount: irrf },
            { code: "610", label: "Desconto de benefícios", kind: "Desconto" as const, reference: employee.benefits.length ? `${employee.benefits.length} benefícios` : "Sem benefício", amount: benefitDiscount },
          ].filter((event) => event.amount > 0),
        };
      });

    setData((current) => ({
      ...current,
      payroll: [...payroll, ...current.payroll.filter((item) => item.competence !== competence)],
      auditLogs: [{
        id: createId("audit"),
        action: "calculate",
        entity: "payroll",
        actor: "dp.demo",
        date: new Date().toISOString(),
        details: `Calculou folha ${competence} com ${payroll.length} holerites`,
      }, ...current.auditLogs],
    }));
    setSelectedPayrollId(payroll[0]?.id || "");
    setNotice(`Folha ${competence} calculada com ${payroll.length} holerites.`);
    closeModal();
  };

  const updatePayrollStatus = (payrollId: string, status: PayrollStatus) => {
    setData((current) => ({
      ...current,
      payroll: current.payroll.map((item) =>
        item.id === payrollId
          ? { ...item, status, releasedAt: status === "Liberado" ? new Date().toISOString() : item.releasedAt }
          : item,
      ),
      auditLogs: [{
        id: createId("audit"),
        action: status === "Liberado" ? "release_payslip" : "review_payslip",
        entity: "payslip",
        actor: "dp.demo",
        date: new Date().toISOString(),
        details: `Alterou holerite ${payrollId} para ${status}`,
      }, ...current.auditLogs],
    }));
    setNotice(status === "Liberado" ? "Holerite liberado ao colaborador." : "Status da folha atualizado.");
  };

  const openPayslipModal = (payroll: PayrollItem) => {
    setSelectedPayrollId(payroll.id);
    setModal("payslip");
  };

  const printPayslip = () => {
    if (!selectedPayroll) return;
    const employee = employees.find((item) => item.id === selectedPayroll.employeeId);
    const rows = selectedPayroll.events
      .map((event) => `<tr><td>${event.code}</td><td>${event.label}</td><td>${event.reference}</td><td>${event.kind === "Provento" ? formatMoney(event.amount) : ""}</td><td>${event.kind === "Desconto" ? formatMoney(event.amount) : ""}</td></tr>`)
      .join("");
    const html = `
      <html><head><title>Holerite ${selectedPayroll.competence}</title>
      <style>body{font-family:Arial;padding:32px;color:#17233d}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #d5e2f1;padding:10px;text-align:left}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.box{border:1px solid #d5e2f1;padding:12px}.total{font-size:20px;font-weight:700}.sign{margin-top:42px;border-top:1px solid #17233d;text-align:center;padding-top:8px}</style>
      </head><body>
      <h1>Holerite ${selectedPayroll.competence}</h1>
      <div class="grid"><div class="box"><strong>${companyInfo.legalName}</strong><br/>CNPJ ${companyInfo.cnpj}<br/>${companyInfo.address}</div><div class="box"><strong>${employee?.name || ""}</strong><br/>CPF ${employee?.cpf || ""}<br/>Cargo ${employee?.role || ""} · CBO ${employee?.cbo || ""}<br/>Admissão ${employee?.admissionDate || ""}</div></div>
      <table><thead><tr><th>Código</th><th>Descrição</th><th>Referência</th><th>Proventos</th><th>Descontos</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="grid"><div class="box">Base INSS: ${formatMoney(selectedPayroll.inssBase)}<br/>Base FGTS: ${formatMoney(selectedPayroll.fgtsBase)}<br/>FGTS do mês: ${formatMoney(selectedPayroll.fgtsDeposit)}<br/>Base IRRF: ${formatMoney(selectedPayroll.irrfBase)}</div><div class="box">Total proventos: ${formatMoney(selectedPayroll.gross)}<br/>Total descontos: ${formatMoney(selectedPayroll.discounts)}<br/><span class="total">Líquido: ${formatMoney(selectedPayroll.net)}</span><br/>Hash: ${selectedPayroll.hash}</div></div>
      <p class="total">Líquido: ${formatMoney(selectedPayroll.net)}</p>
      <p>Recebi a importância líquida discriminada neste demonstrativo, conforme recibo de pagamento salarial.</p>
      <div class="sign">${employee?.name || "Colaborador"}</div>
      </body></html>`;
    const printWindow = window.open("", "_blank", "width=900,height=720");
    printWindow?.document.write(html);
    printWindow?.document.close();
    printWindow?.focus();
    printWindow?.print();
  };

  const buildESocialXml = (employee: Employee, code: ESocialCode) => {
    const tagByCode: Record<ESocialCode, string> = {
      "S-2200": "evtAdmissao",
      "S-1200": "evtRemun",
      "S-1210": "evtPgtos",
      "S-2299": "evtDeslig",
      "S-2230": "evtAfastTemp",
    };
    return `<eSocial><${tagByCode[code]} id="${employee.id}"><cpf>${employee.cpf}</cpf><nmTrab>${employee.name}</nmTrab><perApur>${competence}</perApur></${tagByCode[code]}></eSocial>`;
  };

  const generateESocialEvent = () => {
    if (!selectedEmployee) return;
    const event: ESocialEvent = {
      id: createId("evt"),
      employeeId: selectedEmployee.id,
      competence,
      code: esocialCode,
      title: `${esocialCode} · ${selectedEmployee.name}`,
      status: "Pendente",
      xml: buildESocialXml(selectedEmployee, esocialCode),
      validationMessages: ["CPF informado", "Competência preenchida", "XML pronto para validação"],
      createdAt: new Date().toISOString(),
    };
    setData((current) => ({
      ...current,
      esocial: [event, ...current.esocial],
      auditLogs: [{
        id: createId("audit"),
        action: "generate_esocial",
        entity: "esocial",
        actor: "dp.demo",
        date: new Date().toISOString(),
        details: `Gerou ${esocialCode} para ${selectedEmployee.name}`,
      }, ...current.auditLogs],
    }));
    setNotice(`Evento ${esocialCode} gerado para ${selectedEmployee.name}.`);
    closeModal();
  };

  const validateESocialEvent = (eventId: string) => {
    setData((current) => ({
      ...current,
      esocial: current.esocial.map((event) =>
        event.id === eventId
          ? { ...event, status: event.xml.includes("<cpf>") ? "Validado" : "Rejeitado", validationMessages: event.xml.includes("<cpf>") ? ["XML validado", "CPF localizado", "Pronto para envio"] : ["CPF ausente"] }
          : event,
      ),
    }));
    setNotice("Validação do evento concluída.");
  };

  const sendESocialEvent = (eventId: string) => {
    setData((current) => ({
      ...current,
      esocial: current.esocial.map((event) =>
        event.id === eventId
          ? { ...event, status: "Aceito", protocol: `REC-${Date.now().toString().slice(-8)}`, validationMessages: [...event.validationMessages, "Evento aceito no ambiente de teste"] }
          : event,
      ),
    }));
    setNotice("Evento enviado e aceito no ambiente de teste.");
  };

  const prepareIntegration = () => {
    setData((current) => ({
      ...current,
      integrationPrepared: true,
      auditLogs: [{
        id: createId("audit"),
        action: "prepare_integration",
        entity: "integration",
        actor: "admin.demo",
        date: new Date().toISOString(),
        details: "Preparou caminho de integração com HappyCash para colaboradores, fotos, cargos, escalas e permissões.",
      }, ...current.auditLogs],
    }));
    setNotice("Caminho de integração com HappyCash preparado para colaboradores, fotos, cargos, escalas e permissões.");
  };

  const resetDemo = () => {
    setData(initialData);
    setSelectedEmployeeId(initialData.employees[0].id);
    setEditingEmployeeId(null);
    setNotice("Dados de demonstração restaurados.");
    closeModal();
  };

  if (!ready) {
    return <SplashScreen progress={progress} />;
  }

  return (
    <main className="rh-app-shell">
      <aside className="rh-sidebar">
        <img src={happyCashLogo} alt="HappyCash" className="rh-logo" />
        <span className="rh-product-pill">RH Enterprise</span>
        <nav className="rh-nav" aria-label="Módulos do RH">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={view === item.key ? "active" : ""} type="button" onClick={() => setView(item.key)}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="rh-sidebar-note">
          <ShieldCheck size={18} />
          <span>Teste local sem login. Os dados ficam salvos no navegador.</span>
        </div>
      </aside>

      <section className="rh-workspace">
        <header className="rh-topbar">
          <div>
            <p>Gestão completa de RH</p>
            <h1>HappyCash RH Enterprise</h1>
          </div>
          <div className="rh-topbar-actions">
            <button type="button" className="secondary" onClick={syncRepository}>
              <RefreshCw size={18} />
              {repositoryMode === "supabase" ? "Sincronizar banco RH" : "Salvar local"}
            </button>
            <button type="button" className="secondary" onClick={resetDemo}>Restaurar demo</button>
            <button type="button" onClick={() => openEmployeeModal()}>
              <Plus size={18} />
              Novo colaborador
            </button>
          </div>
        </header>

        <div className="rh-notice">
          <Bot size={18} />
          <span>{notice} <small>{repositoryStatus}</small></span>
        </div>

        {view === "painel" ? (
          <>
            <section className="rh-dashboard-grid">
              {[
                { label: "Colaboradores ativos", value: activeEmployees, icon: UsersRound },
                { label: "Marcações pendentes", value: pendingTimeEntries, icon: Clock3 },
                { label: `Folha ${competence}`, value: formatMoney(totalNet), icon: ReceiptText },
                { label: "Eventos eSocial pendentes", value: pendingESocial, icon: Landmark },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <button key={metric.label} type="button" className="rh-metric" onClick={() => setView(metric.icon === ReceiptText ? "holerites" : metric.icon === Landmark ? "esocial" : metric.icon === Clock3 ? "ponto" : "colaboradores")}>
                    <Icon />
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                  </button>
                );
              })}
            </section>

            <section className="rh-content-grid">
              <article className="rh-panel">
                <div className="rh-section-heading">
                  <span><BadgeCheck size={16} /> Rotinas rápidas</span>
                  <h2>Ações em modal</h2>
                </div>
                <div className="rh-action-grid">
                  {([
                    ["Cadastrar colaborador", "Inclui dados, documentos, benefícios e permissões.", () => openEmployeeModal()],
                    ["Registrar ponto", "Marca entrada, intervalo, retorno e saída.", () => setModal("time")],
                    ["Calcular folha", "Gera eventos e holerites por competência.", () => setModal("payroll")],
                    ["Gerar eSocial", "Cria XML, valida e envia evento legal.", () => setModal("esocial")],
                  ] satisfies Array<[string, string, () => void]>).map(([title, description, action]) => (
                    <button key={String(title)} type="button" className="rh-action-card" onClick={action}>
                      <strong>{title}</strong>
                      <span>{description}</span>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </div>
              </article>

              <article className="rh-panel">
                <div className="rh-section-heading">
                  <span><FileCheck2 size={16} /> Alertas</span>
                  <h2>Conferências inteligentes</h2>
                </div>
                <ol className="rh-check-list">
                  <li><CheckCircle2 size={18} /><span>{pendingTimeEntries} marcações aguardam aprovação.</span></li>
                  <li><CheckCircle2 size={18} /><span>{employees.filter((item) => item.documents.length < 3).length} colaboradores com documentos incompletos.</span></li>
                  <li><CheckCircle2 size={18} /><span>{data.payroll.filter((item) => item.status === "Calculado").length} holerites calculados aguardam liberação.</span></li>
                  <li><CheckCircle2 size={18} /><span>{pendingESocial} eventos legais aguardam envio.</span></li>
                </ol>
              </article>
            </section>

            <section className="rh-panel rh-enterprise-panel">
              <div className="rh-section-heading row">
                <div>
                  <span><BriefcaseBusiness size={16} /> Rotinas Enterprise</span>
                  <h2>Operação completa por módulo</h2>
                </div>
                <button type="button" onClick={() => openRoutineModal("recruitment")}><Plus size={16} /> Nova rotina</button>
              </div>
              <div className="rh-routine-grid">
                {routineKeys.map((key) => (
                  <button key={key} type="button" className="rh-routine-card" onClick={() => openRoutineModal(key)}>
                    <strong>{routineLabels[key].title}</strong>
                    <span>{routineLabels[key].description}</span>
                    <small>{data.routines.filter((record) => record.module === key).length} registros</small>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {view === "colaboradores" ? (
          <section className="rh-panel">
            <div className="rh-section-heading row">
              <div>
                <span><UsersRound size={16} /> Colaboradores</span>
                <h2>Funcionários cadastrados</h2>
              </div>
              <button type="button" onClick={() => openEmployeeModal()}><Plus size={16} /> Novo colaborador</button>
            </div>
            <label className="rh-search">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, CPF, cargo, setor ou unidade" />
            </label>
            <div className="rh-employee-grid">
              {filteredEmployees.map((employee) => (
                <article key={employee.id} className="rh-employee-card">
                  <button type="button" className="rh-employee-main" onClick={() => openProfileModal(employee)}>
                    <img src={employee.photo} alt="" />
                    <span>
                      <strong>{employee.name}</strong>
                      <small>{employee.role} · {employee.department} · {employee.unit}</small>
                    </span>
                    <em>{employee.status}</em>
                  </button>
                  <div className="rh-card-actions">
                    <button type="button" onClick={() => openProfileModal(employee)}><Eye size={16} /> Pasta</button>
                    <button type="button" onClick={() => openEmployeeModal(employee)}><Pencil size={16} /> Editar</button>
                    <button type="button" onClick={() => openPermissionsModal(employee)}><KeyRound size={16} /> Acessos</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {view === "ponto" ? (
          <section className="rh-panel">
            <div className="rh-section-heading row">
              <div>
                <span><Fingerprint size={16} /> Ponto</span>
                <h2>Espelho de marcações</h2>
              </div>
              <button type="button" onClick={() => setModal("time")}><Clock3 size={16} /> Registrar ponto</button>
            </div>
            <div className="rh-table">
              {data.timeEntries.map((entry) => {
                const employee = employees.find((item) => item.id === entry.employeeId);
                return (
                  <div key={entry.id} className="rh-table-row">
                    <span><strong>{employee?.name}</strong><small>{entry.type} · {formatDateTime(entry.timestamp)} · {entry.source}</small></span>
                    <em className={entry.status === "Pendente" ? "warning" : ""}>{entry.status}</em>
                    {entry.status === "Pendente" ? <button type="button" onClick={() => approveTimeEntry(entry.id)}>Aprovar</button> : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {view === "folha" ? (
          <section className="rh-content-grid">
            <article className="rh-panel">
              <div className="rh-section-heading row">
                <div>
                  <span><Banknote size={16} /> Folha</span>
                  <h2>Fechamento por competência</h2>
                </div>
                <button type="button" onClick={() => setModal("payroll")}><Banknote size={16} /> Calcular folha</button>
              </div>
              <div className="rh-payroll-summary">
                <span><small>Bruto</small><strong>{formatMoney(totalGross)}</strong></span>
                <span><small>Descontos</small><strong>{formatMoney(totalDiscounts)}</strong></span>
                <span><small>Líquido</small><strong>{formatMoney(totalNet)}</strong></span>
              </div>
            </article>
            <article className="rh-panel">
              <div className="rh-section-heading">
                <span><ReceiptText size={16} /> Holerites gerados</span>
                <h2>{payrollForCompetence.length} registros</h2>
              </div>
              <div className="rh-table">
                {payrollForCompetence.map((item) => {
                  const employee = employees.find((candidate) => candidate.id === item.employeeId);
                  return (
                    <button key={item.id} type="button" className="rh-table-row clickable" onClick={() => openPayslipModal(item)}>
                      <span><strong>{employee?.name}</strong><small>{item.status} · líquido {formatMoney(item.net)}</small></span>
                      <ChevronRight size={18} />
                    </button>
                  );
                })}
              </div>
            </article>
          </section>
        ) : null}

        {view === "holerites" ? (
          <section className="rh-panel">
            <div className="rh-section-heading row">
              <div>
                <span><ReceiptText size={16} /> Holerites</span>
                <h2>Prévia, conferência e impressão</h2>
              </div>
              <button type="button" onClick={() => setModal("payroll")}><Banknote size={16} /> Calcular competência</button>
            </div>
            <div className="rh-table">
              {data.payroll.length ? data.payroll.map((item) => {
                const employee = employees.find((candidate) => candidate.id === item.employeeId);
                return (
                  <button key={item.id} type="button" className="rh-table-row clickable" onClick={() => openPayslipModal(item)}>
                    <span><strong>{employee?.name}</strong><small>{item.competence} · {item.status} · líquido {formatMoney(item.net)}</small></span>
                    <ChevronRight size={18} />
                  </button>
                );
              }) : <div className="rh-empty-state">Nenhum holerite gerado. Clique em calcular competência.</div>}
            </div>
          </section>
        ) : null}

        {view === "portal" && selectedEmployee ? (
          <section className="rh-content-grid">
            <article className="rh-panel">
              <div className="rh-section-heading row">
                <div>
                  <span><UserRound size={16} /> Portal do colaborador</span>
                  <h2>{selectedEmployee.name}</h2>
                </div>
                <button type="button" onClick={() => openProfileModal(selectedEmployee)}><Eye size={16} /> Ver pasta</button>
              </div>
              <div className="rh-profile-header">
                <img src={selectedEmployee.photo} alt="" />
                <div>
                  <h3>{selectedEmployee.role}</h3>
                  <p>{selectedEmployee.department} · {selectedEmployee.unit} · {selectedEmployee.status}</p>
                </div>
                <em>{selectedEmployee.contractType}</em>
              </div>
              <div className="rh-action-grid">
                <button type="button" className="rh-action-card" onClick={() => setModal("time")}>
                  <strong>Registrar ponto</strong>
                  <span>Entrada, intervalo, retorno e saída com fonte e auditoria.</span>
                  <ChevronRight size={18} />
                </button>
                <button type="button" className="rh-action-card" onClick={() => openRoutineModal("vacations", selectedEmployee.id)}>
                  <strong>Solicitar férias/ausência</strong>
                  <span>Férias, folga, atestado, licença ou afastamento.</span>
                  <ChevronRight size={18} />
                </button>
                <button type="button" className="rh-action-card" onClick={() => openRoutineModal("employeePortal", selectedEmployee.id)}>
                  <strong>Atualizar dados</strong>
                  <span>Solicitação de correção cadastral, endereço ou contato.</span>
                  <ChevronRight size={18} />
                </button>
                <button type="button" className="rh-action-card" onClick={() => openRoutineModal("communication", selectedEmployee.id)}>
                  <strong>Assinar ciência</strong>
                  <span>Comunicados, políticas internas, documentos e aceite.</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </article>
            <article className="rh-panel">
              <div className="rh-section-heading">
                <span><ReceiptText size={16} /> Dados disponíveis</span>
                <h2>Consulta rápida</h2>
              </div>
              <div className="rh-table compact">
                {selectedEmployeePayroll.length ? selectedEmployeePayroll.map((item) => (
                  <button key={item.id} type="button" className="rh-table-row clickable" onClick={() => openPayslipModal(item)}>
                    <span><strong>Holerite {item.competence}</strong><small>{item.status} · líquido {formatMoney(item.net)}</small></span>
                    <ChevronRight size={18} />
                  </button>
                )) : <div className="rh-empty-state">Nenhum holerite liberado para este colaborador.</div>}
                {selectedEmployeeTimeEntries.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="rh-table-row">
                    <span><strong>{entry.type}</strong><small>{formatDateTime(entry.timestamp)} · {entry.source} · {entry.status}</small></span>
                  </div>
                ))}
                {selectedEmployeeRoutines.slice(0, 4).map((record) => (
                  <div key={record.id} className="rh-table-row">
                    <span><strong>{routineLabels[record.module].title}</strong><small>{record.status} · {record.date} · {record.title}</small></span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        {view === "gestor" ? (
          <section className="rh-content-grid">
            <article className="rh-panel">
              <div className="rh-section-heading">
                <span><BriefcaseBusiness size={16} /> Portal do gestor</span>
                <h2>Equipe, aprovações e indicadores</h2>
              </div>
              <div className="rh-report-grid">
                {[
                  ["Equipe", `${employees.length}`, "Colaboradores visíveis"],
                  ["Ponto pendente", `${pendingTimeEntries}`, "Aprovar ou devolver"],
                  ["Férias", `${data.routines.filter((record) => record.module === "vacations").length}`, "Solicitações e calendário"],
                  ["Metas", `${data.routines.filter((record) => record.module === "performance").length}`, "Ciclos de desempenho"],
                  ["Treinamentos", `${data.routines.filter((record) => record.module === "training").length}`, "Pendências e certificados"],
                  ["Aniversários", "2", "Próximos 30 dias"],
                ].map(([title, value, description]) => (
                  <button key={title} type="button" className="rh-report-card">
                    <span>{title}</span>
                    <strong>{value}</strong>
                    <small>{description}</small>
                  </button>
                ))}
              </div>
            </article>
            <article className="rh-panel">
              <div className="rh-section-heading row">
                <div>
                  <span><Clock3 size={16} /> Aprovações</span>
                  <h2>Ponto e solicitações</h2>
                </div>
                <button type="button" onClick={() => openRoutineModal("managerPortal")}><Plus size={16} /> Nova solicitação</button>
              </div>
              <div className="rh-table compact">
                {data.timeEntries.filter((entry) => entry.status === "Pendente").map((entry) => {
                  const employee = employees.find((item) => item.id === entry.employeeId);
                  return (
                    <div key={entry.id} className="rh-table-row">
                      <span><strong>{employee?.name}</strong><small>{entry.type} · {formatDateTime(entry.timestamp)}</small></span>
                      <button type="button" onClick={() => approveTimeEntry(entry.id)}>Aprovar</button>
                    </div>
                  );
                })}
                {data.routines.filter((record) => ["vacations", "performance", "managerPortal"].includes(record.module)).slice(0, 6).map((record) => {
                  const employee = employees.find((item) => item.id === record.employeeId);
                  return (
                    <div key={record.id} className="rh-table-row">
                      <span><strong>{record.title}</strong><small>{routineLabels[record.module].title} · {record.status} {employee ? `· ${employee.name}` : ""}</small></span>
                      <button type="button" onClick={() => removeRoutineRecord(record.id)}>Concluir</button>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>
        ) : null}

        {view === "esocial" ? (
          <section className="rh-panel">
            <div className="rh-section-heading row">
              <div>
                <span><Landmark size={16} /> eSocial</span>
                <h2>Eventos, validação, XML e recibos</h2>
              </div>
              <button type="button" onClick={() => setModal("esocial")}><FileCheck2 size={16} /> Novo evento</button>
            </div>
            <div className="rh-table">
              {data.esocial.length ? data.esocial.map((event) => {
                const employee = employees.find((item) => item.id === event.employeeId);
                return (
                  <div key={event.id} className="rh-table-row esocial">
                    <span>
                      <strong>{event.code} · {employee?.name || event.title}</strong>
                      <small>{event.status} {event.protocol ? `· ${event.protocol}` : ""}</small>
                      <code>{event.xml}</code>
                    </span>
                    <div className="rh-row-actions">
                      {event.status === "Pendente" || event.status === "Rascunho" ? <button type="button" onClick={() => validateESocialEvent(event.id)}>Validar</button> : null}
                      {event.status !== "Aceito" && event.status !== "Rejeitado" ? <button type="button" onClick={() => sendESocialEvent(event.id)}><Send size={16} /> Enviar</button> : null}
                    </div>
                  </div>
                );
              }) : <div className="rh-empty-state">Nenhum evento gerado. Clique em novo evento.</div>}
            </div>
          </section>
        ) : null}

        {view === "relatorios" ? (
          <>
          <section className="rh-content-grid">
            <article className="rh-panel">
              <div className="rh-section-heading">
                <span><BarChart3 size={16} /> Relatórios</span>
                <h2>Indicadores do quadro</h2>
              </div>
              <div className="rh-report-grid">
                {[
                  ["Turnover", "0,8%", "Baixo para o período"],
                  ["Absenteísmo", `${Math.max(1, pendingTimeEntries)} pendências`, "Validar espelho de ponto"],
                  ["Custo líquido", formatMoney(totalNet), `Competência ${competence}`],
                  ["Documentos", `${employees.reduce((sum, item) => sum + item.documents.length, 0)} arquivos`, "Pasta de colaboradores"],
                  ["eSocial", `${data.esocial.filter((event) => event.status === "Aceito").length} aceitos`, `${pendingESocial} pendentes`],
                  ["Benefícios", `${employees.reduce((sum, item) => sum + item.benefits.length, 0)} vínculos`, "Integrados à folha"],
                ].map(([title, value, description]) => (
                  <button key={title} type="button" className="rh-report-card">
                    <span>{title}</span>
                    <strong>{value}</strong>
                    <small>{description}</small>
                  </button>
                ))}
              </div>
            </article>
            <article className="rh-panel">
              <div className="rh-section-heading">
                <span><Bot size={16} /> IA de conferência</span>
                <h2>Leitura automática</h2>
              </div>
              <ol className="rh-check-list">
                <li><CheckCircle2 size={18} /><span>Comparar folha calculada com ponto e benefícios.</span></li>
                <li><CheckCircle2 size={18} /><span>Sinalizar CPF, admissão ou documentos ausentes.</span></li>
                <li><CheckCircle2 size={18} /><span>Checar eventos eSocial pendentes antes do fechamento.</span></li>
                <li><CheckCircle2 size={18} /><span>Gerar relatório de risco por colaborador, setor e unidade.</span></li>
              </ol>
            </article>
          </section>
          <section className="rh-panel rh-enterprise-panel">
            <div className="rh-section-heading row">
              <div>
                <span><ShieldCheck size={16} /> Auditoria e indicadores</span>
                <h2>Rastreabilidade operacional</h2>
              </div>
              <button type="button" onClick={() => { setConfigModal("audit"); setModal("config"); }}><FileSearch size={16} /> LGPD e logs</button>
            </div>
            <div className="rh-report-grid">
              {[
                ["Admissões", `${employees.filter((item) => item.admissionDate.startsWith(new Date().getFullYear().toString())).length}`, "Entradas no ano"],
                ["Férias/afastamentos", `${data.routines.filter((item) => item.module === "vacations").length}`, "Solicitações e aprovações"],
                ["Treinamentos", `${data.routines.filter((item) => item.module === "training").length}`, "Atribuições e certificados"],
                ["Recrutamento", `${data.routines.filter((item) => item.module === "recruitment").length}`, "Vagas e candidatos"],
                ["Logs de alteração", `${data.auditLogs.length}`, "Trilha de auditoria"],
                ["LGPD", `${data.routines.filter((item) => item.module === "lgpd").length}`, "Consentimentos e solicitações"],
              ].map(([title, value, description]) => (
                <button key={title} type="button" className="rh-report-card">
                  <span>{title}</span>
                  <strong>{value}</strong>
                  <small>{description}</small>
                </button>
              ))}
            </div>
            <div className="rh-module-list compact">
              {data.auditLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="rh-module-row static">
                  <ShieldCheck size={20} />
                  <span>
                    <strong>{log.action} · {log.entity}</strong>
                    <small>{formatDateTime(log.date)} · {log.actor} · {log.details}</small>
                  </span>
                </div>
              ))}
            </div>
          </section>
          </>
        ) : null}

        {view === "configuracoes" ? (
          <section className="rh-panel">
            <div className="rh-section-heading">
              <span><Settings2 size={16} /> Configurações</span>
              <h2>Escolha uma área para configurar</h2>
            </div>
            <div className="rh-settings-grid">
              {([
                ["permissions", KeyRound, "Perfis e permissões", "Acessos por checkbox para colaborador, RH, gestor e DP."],
                ["integration", UploadCloud, "Integrar com HappyCash", "Prepara migração de colaboradores, fotos, cargos, escalas e permissões."],
                ["rubrics", ReceiptText, "Rubricas e folha", "Eventos, bases, descontos, proventos, encargos e holerites."],
                ["sst", Stethoscope, "SST", "PGR, PCMSO, ASO, EPI, CIPA, CAT e vencimentos."],
                ["esocial", Landmark, "eSocial", "Leiaute, ambiente, fila, XML, recibo, rejeição e retificação."],
                ["audit", ShieldCheck, "LGPD e auditoria", "Logs, retenção, exportação, consentimento e dados sensíveis."],
              ] satisfies Array<[ConfigModalKey, typeof KeyRound, string, string]>).map(([key, Icon, title, description]) => {
                const SettingsIcon = Icon as typeof KeyRound;
                return (
                  <button key={String(key)} type="button" className="rh-settings-card" onClick={() => { setConfigModal(key); setModal("config"); }}>
                    <SettingsIcon size={22} />
                    <strong>{title}</strong>
                    <span>{description}</span>
                  </button>
                );
              })}
            </div>
            <div className="rh-section-heading rh-subheading">
              <span><BriefcaseBusiness size={16} /> Cobertura Enterprise</span>
              <h2>Módulos disponíveis para parametrizar</h2>
            </div>
            <div className="rh-routine-grid compact">
              {routineKeys.map((key) => (
                <button key={key} type="button" className="rh-routine-card" onClick={() => openRoutineModal(key)}>
                  <strong>{routineLabels[key].title}</strong>
                  <span>{routineBlueprints[key].slice(0, 4).join(" · ")}</span>
                  <small>{routineStatuses[key].length} status configuráveis</small>
                </button>
              ))}
            </div>
            <div className="rh-module-catalog">
              {enterpriseModules.slice(0, 10).map((module) => {
                const ModuleIcon = module.icon;
                return (
                  <span key={module.title}>
                    <ModuleIcon size={16} />
                    {module.title}
                  </span>
                );
              })}
            </div>
          </section>
        ) : null}
      </section>

      {modal === "employee" ? (
        <Modal title={editingEmployee ? "Editar colaborador" : "Novo colaborador"} description="Cadastro completo com foto, documentos, benefícios, contrato, salário e escala." onClose={closeModal} size="xl">
          <div className="rh-form-grid">
            <label>Nome completo<input value={employeeForm.name} onChange={(event) => setEmployeeForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label>CPF<input value={employeeForm.cpf} onChange={(event) => setEmployeeForm((current) => ({ ...current, cpf: event.target.value }))} /></label>
            <label>Email<input type="email" value={employeeForm.email} onChange={(event) => setEmployeeForm((current) => ({ ...current, email: event.target.value }))} /></label>
            <label>Telefone<input value={employeeForm.phone} onChange={(event) => setEmployeeForm((current) => ({ ...current, phone: event.target.value }))} /></label>
            <label>Cargo<input value={employeeForm.role} onChange={(event) => setEmployeeForm((current) => ({ ...current, role: event.target.value }))} /></label>
            <label>CBO<input value={employeeForm.cbo} onChange={(event) => setEmployeeForm((current) => ({ ...current, cbo: event.target.value }))} /></label>
            <label>Setor<input value={employeeForm.department} onChange={(event) => setEmployeeForm((current) => ({ ...current, department: event.target.value }))} /></label>
            <label>Unidade<input value={employeeForm.unit} onChange={(event) => setEmployeeForm((current) => ({ ...current, unit: event.target.value }))} /></label>
            <label>Admissão<input type="date" value={employeeForm.admissionDate} onChange={(event) => setEmployeeForm((current) => ({ ...current, admissionDate: event.target.value }))} /></label>
            <label>Contrato<select value={employeeForm.contractType} onChange={(event) => setEmployeeForm((current) => ({ ...current, contractType: event.target.value }))}><option>CLT</option><option>PJ</option><option>Estágio</option><option>Temporário</option></select></label>
            <label>Status<select value={employeeForm.status} onChange={(event) => setEmployeeForm((current) => ({ ...current, status: event.target.value as EmployeeStatus }))}><option>Ativo</option><option>Ferias</option><option>Afastado</option><option>Desligado</option></select></label>
            <label>Salário<input type="number" value={employeeForm.salary} onChange={(event) => setEmployeeForm((current) => ({ ...current, salary: Number(event.target.value) }))} /></label>
            <label>Escala<input value={employeeForm.schedule} onChange={(event) => setEmployeeForm((current) => ({ ...current, schedule: event.target.value }))} /></label>
            <label>Jornada<input value={employeeForm.workHours} onChange={(event) => setEmployeeForm((current) => ({ ...current, workHours: event.target.value }))} /></label>
            <label className="wide">Foto URL<input value={employeeForm.photo} onChange={(event) => setEmployeeForm((current) => ({ ...current, photo: event.target.value }))} /></label>
            <label className="wide">Endereço<input value={employeeForm.address} onChange={(event) => setEmployeeForm((current) => ({ ...current, address: event.target.value }))} /></label>
            <label className="wide">Dados bancários<input value={employeeForm.bank} onChange={(event) => setEmployeeForm((current) => ({ ...current, bank: event.target.value }))} /></label>
            <label className="wide">Contato de emergência<input value={employeeForm.emergency} onChange={(event) => setEmployeeForm((current) => ({ ...current, emergency: event.target.value }))} /></label>
            <label className="wide">Dependentes<input value={dependentInput} onChange={(event) => setDependentInput(event.target.value)} placeholder="Nome - parentesco - IRRF, outro dependente..." /></label>
            <label className="wide">Documentos<input value={documentInput} onChange={(event) => setDocumentInput(event.target.value)} /></label>
            <label className="wide">Benefícios<input value={benefitInput} onChange={(event) => setBenefitInput(event.target.value)} /></label>
            <label className="wide">Histórico<input value={historyInput} onChange={(event) => setHistoryInput(event.target.value)} placeholder="Admissão, promoções, alterações, observações..." /></label>
          </div>
          <div className="rh-modal-actions">
            {editingEmployee ? <button type="button" className="danger" onClick={() => removeEmployee(editingEmployee.id)}><Trash2 size={17} /> Excluir</button> : null}
            <button type="button" onClick={saveEmployee}><Save size={17} /> Salvar</button>
          </div>
        </Modal>
      ) : null}

      {modal === "profile" && selectedEmployee ? (
        <Modal title="Pasta do colaborador" description="Dados salvos, acessos e rotinas vinculadas ao colaborador." onClose={closeModal} size="xl">
          <div className="rh-profile-header">
            <img src={selectedEmployee.photo} alt="" />
            <div>
              <h3>{selectedEmployee.name}</h3>
              <p>{selectedEmployee.role} · {selectedEmployee.department} · {selectedEmployee.unit}</p>
            </div>
            <em>{selectedEmployee.status}</em>
          </div>
          <div className="rh-profile-grid">
            {[
              ["CPF", selectedEmployee.cpf],
              ["Email", selectedEmployee.email],
              ["Telefone", selectedEmployee.phone],
              ["CBO", selectedEmployee.cbo],
              ["Admissão", selectedEmployee.admissionDate],
              ["Contrato", selectedEmployee.contractType],
              ["Salário", formatMoney(selectedEmployee.salary)],
              ["Escala", selectedEmployee.schedule],
              ["Jornada", selectedEmployee.workHours],
              ["Endereço", selectedEmployee.address],
              ["Banco", selectedEmployee.bank],
              ["Emergência", selectedEmployee.emergency],
              ["Dependentes", selectedEmployee.dependents.join(" · ") || "Nenhum"],
              ["Documentos", selectedEmployee.documents.join(" · ")],
              ["Benefícios", selectedEmployee.benefits.join(" · ")],
              ["Histórico", selectedEmployee.history.join(" · ") || "Sem histórico"],
            ].map(([label, value]) => (
              <span key={label}><small>{label}</small><strong>{value}</strong></span>
            ))}
          </div>
          <section className="rh-profile-section">
            <div className="rh-section-heading row">
              <div>
                <span><FileText size={16} /> Rotinas vinculadas</span>
                <h2>Pasta operacional</h2>
              </div>
              <div className="rh-inline-actions">
                <button type="button" onClick={() => openRoutineModal("vacations", selectedEmployee.id)}>Férias</button>
                <button type="button" onClick={() => openRoutineModal("benefits", selectedEmployee.id)}>Benefícios</button>
                <button type="button" onClick={() => openRoutineModal("performance", selectedEmployee.id)}>Desempenho</button>
                <button type="button" onClick={() => openRoutineModal("training", selectedEmployee.id)}>Treinamento</button>
              </div>
            </div>
            <div className="rh-module-list compact">
              {data.routines.filter((record) => record.employeeId === selectedEmployee.id).length ? (
                data.routines.filter((record) => record.employeeId === selectedEmployee.id).map((record) => (
                  <div key={record.id} className="rh-module-row static">
                    <FileCheck2 size={20} />
                    <span>
                      <strong>{routineLabels[record.module].title} · {record.title}</strong>
                      <small>{record.status} · {record.date} · {record.details}</small>
                    </span>
                    <button type="button" className="rh-link-button" onClick={() => removeRoutineRecord(record.id)}>Remover</button>
                  </div>
                ))
              ) : <div className="rh-empty-state">Nenhuma rotina vinculada. Use os botões acima para férias, benefícios, desempenho ou treinamentos.</div>}
            </div>
          </section>
          <div className="rh-modal-actions">
            <button type="button" onClick={() => openEmployeeModal(selectedEmployee)}><Pencil size={17} /> Editar</button>
            <button type="button" onClick={() => openPermissionsModal(selectedEmployee)}><KeyRound size={17} /> Acessos</button>
            <button type="button" onClick={() => setModal("time")}><Clock3 size={17} /> Ponto</button>
          </div>
        </Modal>
      ) : null}

      {modal === "permissions" && selectedEmployee ? (
        <Modal title="Permissões do colaborador" description="Mesmo padrão de liberação por checkbox: marque exatamente o que este usuário pode acessar." onClose={closeModal} size="xl">
          <div className="rh-permissions-grid">
            {permissionGroups.map((group) => (
              <section key={group.title} className="rh-permission-group">
                <h3>{group.title}</h3>
                {group.items.map(([permission, label]) => (
                  <label key={permission} className="rh-checkbox-row">
                    <input type="checkbox" checked={permissionDraft.includes(permission)} onChange={() => togglePermission(permission)} />
                    <span>{label}</span>
                  </label>
                ))}
              </section>
            ))}
          </div>
          <div className="rh-modal-actions">
            <button type="button" className="secondary" onClick={() => setPermissionDraft(defaultEmployeePermissions)}>Portal básico</button>
            <button type="button" className="secondary" onClick={() => setPermissionDraft(rhManagerPermissions)}>RH completo</button>
            <button type="button" onClick={savePermissions}><Save size={17} /> Salvar acessos</button>
          </div>
        </Modal>
      ) : null}

      {modal === "time" ? (
        <Modal title="Registrar ponto" description="Marcação rápida para o colaborador selecionado." onClose={closeModal} size="md">
          <div className="rh-form-grid single">
            <label>Colaborador<select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)}>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
            <label>Tipo<select value={timeType} onChange={(event) => setTimeType(event.target.value as TimeEntryType)}><option>Entrada</option><option>Intervalo</option><option>Retorno</option><option>Saida</option></select></label>
          </div>
          <div className="rh-modal-actions">
            <button type="button" onClick={() => registerTimeEntry()}><Clock3 size={17} /> Registrar agora</button>
          </div>
        </Modal>
      ) : null}

      {modal === "payroll" ? (
        <Modal title="Calcular folha" description="Gera holerites com eventos, descontos e líquido por competência." onClose={closeModal} size="md">
          <div className="rh-form-grid single">
            <label>Competência<input type="month" value={competence} onChange={(event) => setCompetence(event.target.value)} /></label>
          </div>
          <div className="rh-modal-actions">
            <button type="button" onClick={calculatePayroll}><Banknote size={17} /> Calcular holerites</button>
          </div>
        </Modal>
      ) : null}

      {modal === "payslip" && selectedPayroll ? (
        <Modal title="Holerite" description="Prévia do holerite com conferência, liberação e impressão/PDF." onClose={closeModal} size="lg">
          {(() => {
            const employee = employees.find((item) => item.id === selectedPayroll.employeeId);
            const totalEarnings = selectedPayroll.events.filter((event) => event.kind === "Provento").reduce((sum, event) => sum + event.amount, 0);
            const totalDeductions = selectedPayroll.events.filter((event) => event.kind === "Desconto").reduce((sum, event) => sum + event.amount, 0);

            return (
              <div className="payslip">
                <div className="payslip-header">
                  <img src={happyCashLogo} alt="HappyCash" />
                  <span>Demonstrativo de pagamento · {selectedPayroll.competence}</span>
                </div>
                <div className="rh-payslip-meta">
                  <span><small>Empregador</small><strong>{companyInfo.legalName}</strong><em>CNPJ {companyInfo.cnpj}</em><em>{companyInfo.address}</em></span>
                  <span><small>Empregado</small><strong>{employee?.name}</strong><em>CPF {employee?.cpf} · Matrícula {employee?.id}</em><em>{employee?.role} · CBO {employee?.cbo} · Admissão {employee?.admissionDate}</em></span>
                  <span><small>Contrato</small><strong>{employee?.contractType}</strong><em>{employee?.department} · {employee?.unit}</em><em>{employee?.schedule} · {employee?.workHours}</em></span>
                  <span><small>Pagamento</small><strong>{selectedPayroll.paymentDate}</strong><em>{employee?.bank}</em><em>Arquivo bancário: {selectedPayroll.bankFileLine}</em></span>
                </div>
                <div className="rh-payslip-table">
                  <div className="rh-payslip-row head"><span>Cód.</span><span>Descrição</span><span>Referência</span><span>Proventos</span><span>Descontos</span></div>
                  {selectedPayroll.events.map((event) => (
                    <div key={`${event.code}-${event.label}`} className="rh-payslip-row">
                      <span>{event.code}</span>
                      <span>{event.label}</span>
                      <span>{event.reference}</span>
                      <span>{event.kind === "Provento" ? formatMoney(event.amount) : "-"}</span>
                      <span>{event.kind === "Desconto" ? formatMoney(event.amount) : "-"}</span>
                    </div>
                  ))}
                </div>
                <div className="rh-payroll-summary">
                  <span><small>Total proventos</small><strong>{formatMoney(totalEarnings)}</strong></span>
                  <span><small>Total descontos</small><strong>{formatMoney(totalDeductions)}</strong></span>
                  <span><small>Líquido a receber</small><strong>{formatMoney(selectedPayroll.net)}</strong></span>
                </div>
                <div className="rh-payslip-meta bases">
                  <span><small>Base INSS</small><strong>{formatMoney(selectedPayroll.inssBase)}</strong></span>
                  <span><small>Base FGTS</small><strong>{formatMoney(selectedPayroll.fgtsBase)}</strong><em>FGTS do mês: {formatMoney(selectedPayroll.fgtsDeposit)}</em></span>
                  <span><small>Base IRRF</small><strong>{formatMoney(selectedPayroll.irrfBase)}</strong><em>Dependentes: {employee?.dependents.length || 0}</em></span>
                  <span><small>Recibo</small><strong>{selectedPayroll.hash}</strong><em>Status: {selectedPayroll.status}</em></span>
                </div>
                <div className="rh-payslip-receipt">
                  <p>Declaro ter recebido a importância líquida discriminada neste demonstrativo de pagamento salarial.</p>
                  <span>{employee?.name || "Assinatura do colaborador"}</span>
                </div>
              </div>
            );
          })()}
          <div className="rh-modal-actions">
            <button type="button" className="secondary" onClick={() => updatePayrollStatus(selectedPayroll.id, "Conferido")}><CheckCircle2 size={17} /> Conferir</button>
            <button type="button" className="secondary" onClick={() => updatePayrollStatus(selectedPayroll.id, "Liberado")}><MailCheck size={17} /> Liberar</button>
            <button type="button" onClick={printPayslip}><Printer size={17} /> Imprimir/PDF</button>
          </div>
        </Modal>
      ) : null}

      {modal === "esocial" ? (
        <Modal title="Gerar evento eSocial" description="Cria XML de teste, valida e coloca na fila de envio." onClose={closeModal} size="md">
          <div className="rh-form-grid single">
            <label>Colaborador<select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)}>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
            <label>Evento<select value={esocialCode} onChange={(event) => setESocialCode(event.target.value as ESocialCode)}><option>S-2200</option><option>S-1200</option><option>S-1210</option><option>S-2299</option><option>S-2230</option></select></label>
            <label>Competência<input type="month" value={competence} onChange={(event) => setCompetence(event.target.value)} /></label>
          </div>
          <div className="rh-modal-actions">
            <button type="button" onClick={generateESocialEvent}><FileCheck2 size={17} /> Gerar XML</button>
          </div>
        </Modal>
      ) : null}

      {modal === "routine" ? (
        <Modal title={selectedRoutineLabel.title} description={selectedRoutineLabel.description} onClose={closeModal} size="xl">
          <div className="rh-form-grid">
            <label>Módulo
              <select
                value={routineKey}
                onChange={(event) => {
                  const key = event.target.value as RoutineKey;
                  setRoutineKey(key);
                  setRoutineDraft((current) => ({
                    ...current,
                    title: routineLabels[key].sampleAction,
                    status: routineStatuses[key][0] || current.status,
                    details: routineBlueprints[key].join(", "),
                  }));
                }}
              >
                {routineKeys.map((key) => <option key={key} value={key}>{routineLabels[key].title}</option>)}
              </select>
            </label>
            <label>Colaborador vinculado
              <select value={routineDraft.employeeId} onChange={(event) => setRoutineDraft((current) => ({ ...current, employeeId: event.target.value }))}>
                <option value="">Sem vínculo direto</option>
                {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
              </select>
            </label>
            <label>Título<input value={routineDraft.title} onChange={(event) => setRoutineDraft((current) => ({ ...current, title: event.target.value }))} /></label>
            <label>Status
              <select value={routineDraft.status} onChange={(event) => setRoutineDraft((current) => ({ ...current, status: event.target.value }))}>
                {routineStatuses[routineKey].map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label>Data<input type="date" value={routineDraft.date} onChange={(event) => setRoutineDraft((current) => ({ ...current, date: event.target.value }))} /></label>
            <label className="wide">Detalhes
              <textarea value={routineDraft.details} onChange={(event) => setRoutineDraft((current) => ({ ...current, details: event.target.value }))} rows={4} />
            </label>
          </div>
          <div className="rh-blueprint-grid">
            {routineBlueprints[routineKey].map((item) => (
              <span key={item}><CheckCircle2 size={15} /> {item}</span>
            ))}
          </div>
          <div className="rh-section-heading rh-subheading">
            <span><FileSearch size={16} /> Registros do módulo</span>
            <h2>{selectedRoutineRecords.length} registros</h2>
          </div>
          <div className="rh-module-list compact">
            {selectedRoutineRecords.length ? selectedRoutineRecords.map((record) => {
              const employee = employees.find((item) => item.id === record.employeeId);
              return (
                <div key={record.id} className="rh-module-row static">
                  <FileCheck2 size={20} />
                  <span>
                    <strong>{record.title}</strong>
                    <small>{record.status} · {record.date} {employee ? `· ${employee.name}` : ""} · {record.details}</small>
                  </span>
                  <button type="button" className="rh-link-button" onClick={() => removeRoutineRecord(record.id)}>Remover</button>
                </div>
              );
            }) : <div className="rh-empty-state">Nenhum registro neste módulo. Preencha os campos acima e salve.</div>}
          </div>
          <div className="rh-modal-actions">
            <button type="button" onClick={saveRoutineRecord}><Save size={17} /> Salvar rotina</button>
          </div>
        </Modal>
      ) : null}

      {modal === "config" ? (
        <Modal title="Configuração" description="Ajuste rápido da área selecionada." onClose={closeModal} size="lg">
          {configModal === "permissions" ? (
            <div className="rh-module-list">
              {employees.map((employee) => (
                <button key={employee.id} type="button" className="rh-module-row" onClick={() => openPermissionsModal(employee)}>
                  <KeyRound size={20} />
                  <span><strong>{employee.name}</strong><small>{employee.permissions.length} permissões liberadas</small></span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          ) : null}
          {configModal === "integration" ? (
            <div className="rh-integration-box">
              <UploadCloud size={34} />
              <h3>Integrar com HappyCash</h3>
              <p>Prepara o caminho para migrar colaboradores, fotos, cargos, funções, escalas e permissões.</p>
              <ol className="rh-check-list">
                <li><CheckCircle2 size={18} /><span>Mapear colaboradores já cadastrados.</span></li>
                <li><CheckCircle2 size={18} /><span>Importar foto, função, unidade e escala básica.</span></li>
                <li><CheckCircle2 size={18} /><span>Converter acessos existentes em permissões de RH.</span></li>
              </ol>
              <button type="button" onClick={prepareIntegration}><RefreshCw size={17} /> Preparar caminho de integração</button>
              {data.integrationPrepared ? <strong>Caminho criado no teste local.</strong> : null}
            </div>
          ) : null}
          {configModal && !["permissions", "integration"].includes(configModal) ? (
            <div className="rh-settings-detail">
              <FileSearch size={32} />
              <h3>{configDetails[configModal as Exclude<ConfigModalKey, "permissions" | "integration">].title}</h3>
              <p>{configDetails[configModal as Exclude<ConfigModalKey, "permissions" | "integration">].description}</p>
              <div className="rh-blueprint-grid">
                {configDetails[configModal as Exclude<ConfigModalKey, "permissions" | "integration">].items.map((item) => (
                  <span key={item}><CheckCircle2 size={15} /> {item}</span>
                ))}
              </div>
              <div className="rh-report-grid">
                {[
                  ["Parâmetros", "Ativo", "Configurável por empresa, unidade e perfil."],
                  ["Validações", "Ativo", "Bloqueios antes de fechamento e envio."],
                  ["Histórico", `${data.auditLogs.length}`, "Registros com data, ator e entidade."],
                ].map(([item, value, description]) => (
                  <button key={item} type="button" className="rh-report-card">
                    <span>{item}</span>
                    <strong>{value}</strong>
                    <small>{description}</small>
                  </button>
                ))}
              </div>
              <div className="rh-inline-actions">
                {configModal === "rubrics" ? <button type="button" onClick={() => setModal("payroll")}><Banknote size={16} /> Calcular folha</button> : null}
                {configModal === "esocial" ? <button type="button" onClick={() => setModal("esocial")}><Landmark size={16} /> Gerar evento</button> : null}
                {configModal === "sst" ? <button type="button" onClick={() => openRoutineModal("training")}><Stethoscope size={16} /> Registrar controle SST</button> : null}
                {configModal === "audit" ? <button type="button" onClick={() => openRoutineModal("lgpd")}><ShieldCheck size={16} /> Nova solicitação LGPD</button> : null}
              </div>
            </div>
          ) : null}
        </Modal>
      ) : null}
    </main>
  );
};

export default App;
