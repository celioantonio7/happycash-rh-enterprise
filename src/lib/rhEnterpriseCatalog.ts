import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardCheck,
  Cloud,
  DatabaseZap,
  FileBadge,
  FileClock,
  FilePenLine,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  MailCheck,
  Menu,
  Megaphone,
  Puzzle,
  ReceiptText,
  Scale,
  Send,
  Settings2,
  ShieldCheck,
  Stethoscope,
  UserRoundCheck,
  UsersRound,
  Workflow,
} from "lucide-react";

export const enterpriseModules = [
  {
    title: "Cadastro de colaboradores",
    icon: UsersRound,
    description: "Dados pessoais, organograma, CBO, contrato, salário, dependentes, documentos e histórico.",
  },
  {
    title: "Admissão digital",
    icon: UserRoundCheck,
    description: "Checklist, envio de documentos, validação, assinatura de contratos e onboarding.",
  },
  {
    title: "Ponto e jornada",
    icon: Fingerprint,
    description: "Entrada, saída, intervalo, horas extras, atrasos, faltas, banco de horas e espelho.",
  },
  {
    title: "Escalas e turnos",
    icon: CalendarCheck,
    description: "Jornadas por dia, tolerâncias, folgas, equipe por unidade, gestor e setor.",
  },
  {
    title: "Férias e afastamentos",
    icon: FileClock,
    description: "Período aquisitivo, férias vencidas, licenças, atestados, abonos e aprovações.",
  },
  {
    title: "Folha de pagamento",
    icon: Banknote,
    description: "Eventos, verbas, bases, descontos, adicionais, encargos, fechamento e auditoria.",
  },
  {
    title: "Holerites",
    icon: ReceiptText,
    description: "Geração, liberação ao colaborador, aceite, PDF e histórico por competência.",
  },
  {
    title: "eSocial",
    icon: Landmark,
    description: "Eventos, XML, protocolo, recibo, rejeições, retificação e fila por ambiente.",
  },
  {
    title: "Benefícios",
    icon: HeartPulse,
    description: "VT, VR, VA, saúde, odontológico, seguro, dependentes e descontos em folha.",
  },
  {
    title: "Recrutamento",
    icon: BriefcaseBusiness,
    description: "Vagas, candidatos, currículo, etapas, entrevistas, banco de talentos e conversão em colaborador.",
  },
  {
    title: "Caça-talentos",
    icon: Workflow,
    description: "Campanhas, canais de captação, metas, origem de candidatos e funil para alto volume.",
  },
  {
    title: "Treinamentos",
    icon: GraduationCap,
    description: "Cursos obrigatórios, certificados, trilhas, validade e presença.",
  },
  {
    title: "Desempenho",
    icon: BadgeCheck,
    description: "Ciclos, metas, feedback 360, autoavaliação, PDI e comparação entre períodos.",
  },
  {
    title: "Comunicação interna",
    icon: Megaphone,
    description: "Avisos, políticas, ciência obrigatória, aniversariantes, eventos e pesquisas.",
  },
  {
    title: "Portal do colaborador",
    icon: FileBadge,
    description: "Holerite, ponto, férias, atestado, dados pessoais, comunicados e solicitações.",
  },
  {
    title: "Portal do gestor",
    icon: ClipboardCheck,
    description: "Aprovação de ponto, férias, equipe, metas, alterações e indicadores por setor.",
  },
  {
    title: "LGPD e auditoria",
    icon: LockKeyhole,
    description: "Controle de acesso, logs, consentimentos, retenção, exportação e dados sensíveis.",
  },
  {
    title: "Relatórios legais",
    icon: FileText,
    description: "Turnover, absenteísmo, encargos, férias, custos, distribuição salarial e auditoria.",
  },
  {
    title: "Tabela cruzada inteligente",
    icon: BarChart3,
    description: "Análises com linhas, colunas, métricas, filtros, totais e recortes por empresa.",
  },
  {
    title: "Gerador de relatórios",
    icon: FileSpreadsheet,
    description: "Modelos salvos, colunas, quebras, subtotais, PDF, impressão e paisagem/retrato.",
  },
  {
    title: "Compliance trabalhista",
    icon: Scale,
    description: "Regras versionadas, conferência, alertas e validações antes de folha/eSocial.",
  },
  {
    title: "Segurança Enterprise",
    icon: ShieldCheck,
    description: "Perfis, sessões, MFA, backup, trilha de acesso, segregação por empresa e unidade.",
  },
  {
    title: "SST ocupacional",
    icon: Stethoscope,
    description: "PGR, PCMSO, ASO, EPI, CIPA, CAT, exames, vencimentos e alertas.",
  },
  {
    title: "Rescisão TRCT",
    icon: FilePenLine,
    description: "Saldo, aviso, férias, 13º, FGTS, verbas rescisórias e memória de cálculo.",
  },
  {
    title: "13º salário",
    icon: CalendarCheck,
    description: "Primeira parcela, segunda parcela, proporcional, rescisório, INSS e IRRF.",
  },
  {
    title: "Obrigações acessórias",
    icon: Send,
    description: "RAIS, DIRF, CAGED, informe de rendimentos, histórico de arquivos e protocolo.",
  },
  {
    title: "Documentos inteligentes",
    icon: MailCheck,
    description: "Templates, contratos, termos, assinatura eletrônica, ciência e envio por e-mail.",
  },
  {
    title: "Assistente IA de RH",
    icon: Bot,
    description: "Dúvidas internas, simulações, alertas de inconsistência e apoio ao fechamento.",
  },
  {
    title: "Menu personalizável",
    icon: Menu,
    description: "Ordem de módulos, favoritos, atalhos por perfil e tela inicial por equipe.",
  },
  {
    title: "Multiempresa",
    icon: LayoutDashboard,
    description: "Empresas, unidades e permissões isoladas em um só painel administrativo.",
  },
  {
    title: "Integrações e API",
    icon: Puzzle,
    description: "Contabilidade, bancos, assinatura digital, relógio de ponto, e-mail e WhatsApp.",
  },
  {
    title: "Nuvem e backups",
    icon: Cloud,
    description: "Backup, retenção, exportação, restauração e disponibilidade para equipes distribuídas.",
  },
  {
    title: "Motor de regras",
    icon: DatabaseZap,
    description: "Regras legais versionadas por competência, empresa, sindicato e tipo de contrato.",
  },
  {
    title: "Configuração avançada",
    icon: Settings2,
    description: "Rubricas, bases, fórmulas, sindicatos, permissões, campos extras e políticas internas.",
  },
] as const;

export const payrollPipeline = [
  "Coletar ponto, afastamentos, férias e benefícios",
  "Calcular verbas, descontos, bases e encargos por competência",
  "Conferir divergências com trilha de auditoria",
  "Fechar folha e liberar holerites",
  "Gerar XML e fila de eventos eSocial",
  "Armazenar protocolo, recibo, rejeição e retificação",
];

export const implementationPhases = [
  "Fundação: empresas, unidades, usuários, colaboradores e permissões",
  "Operação: ponto, escalas, férias, documentos e portal do colaborador",
  "Departamento pessoal: eventos de folha, holerite, benefícios e relatórios",
  "eSocial: leiautes, XML, fila de envio, recibos, rejeições e auditoria",
  "Enterprise: integrações, gestor, recrutamento, BI, retenção e segurança avançada",
];
