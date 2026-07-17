# HappyCash RH Enterprise

Produto de gestão completa de RH, departamento pessoal, folha, holerite, SST, obrigações legais e eSocial.

## Estrutura

- `src/`: app web inicial com splashscreen própria e painel Enterprise.
- `vite.config.ts`: build independente do app RH.
- `supabase/`: migrations e configuração do banco dedicado do RH.

## Scripts pela raiz do repositório

```bash
npm run dev:rh
npm run build:rh
```

## Scripts dentro deste repositório

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Variáveis de ambiente

Crie `.env` a partir de `.env.example` quando for ligar no banco dedicado:

```bash
VITE_RH_SUPABASE_URL=
VITE_RH_SUPABASE_ANON_KEY=
VITE_RH_TENANT_ID=
```

Sem essas variáveis, o app roda localmente usando `localStorage`. Com elas preenchidas, o app carrega dados das tabelas `rh_*` e habilita sincronização com o Supabase RH.

## Princípio de arquitetura

O RH Enterprise usa app e banco dedicados por causa de dados sensíveis, LGPD, trilha de auditoria, folha e eventos legais.
Tudo que pertence ao produto RH fica dentro de `happycashrh/`, incluindo app, favicon, README e banco Supabase dedicado.

## Supabase dedicado

As migrations ficam em:

```bash
happycashrh/supabase/migrations
```

Elas cobrem:

- Fundação: empresas, usuários, colaboradores, permissões, ponto, folha, holerites, eSocial e auditoria.
- Enterprise: recrutamento, admissão digital, treinamento, desempenho, SST, comunicação, relatórios, IA e preferências.
- Compliance: rubricas legais, versões de regras, portal do colaborador, portal do gestor, LGPD, retenção, CNAB e conectores.
- Storage: fotos, documentos, holerites em PDF e assinatura eletrônica.

## Fluxos implementados no app inicial

- Cadastro completo de colaboradores com foto, CPF, contato, CBO, cargo, setor, unidade, admissão, salário, jornada, banco, emergência, dependentes, documentos, benefícios e histórico.
- Pasta do colaborador com dados salvos e rotinas vinculadas.
- Ponto com entrada, intervalo, retorno, saída, aprovação e auditoria.
- Folha por competência com holerites, rubricas, bases, FGTS, INSS, IRRF, status, liberação e impressão/PDF.
- eSocial com XML de teste, validação, envio, protocolo e status.
- Portal do colaborador com ponto, holerite, solicitações, atestado, férias e ciência.
- Portal do gestor com aprovações, equipe, ponto, férias, metas e treinamentos.
- Módulos Enterprise em modal: recrutamento, admissão, férias, benefícios, desempenho, treinamentos, comunicação, portais, segurança, LGPD e integrações.
