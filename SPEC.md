# Simply-Life OS — Especificação do Produto

## Visão Geral

Simply-Life OS é uma aplicação Web SaaS Multi-tenant, arquitetura Event-Driven, que funciona como um assistente executivo pessoal. O coração do produto é um **funil inteligente** que se conecta ao Gmail, Outlook e Teams do usuário, lê tudo que chega, identifica palavras-chave vitais definidas pelo usuário e coloca itens urgentes em prioridade máxima na tela inicial. O restante é guardado para organização posterior.

### Módulos Nativos
- **Assistente Financeiro** (regra 50-30-20)
- **Rastreador de Saúde/Medicamentos**
- **Modo Foco** com Gamificação (XP, Streaks, Pomodoro)
- **Quadro Kanban Integrado**
- **Inbox Unificada (Backlog)**

---

## Arquitetura Técnica

### Backend
- Motor de agregação usa OAuth2 para tokens de acesso (Google Workspace + Microsoft Graph)
- Tokens armazenados com **criptografia AES-256 via Fernet**
- Serviço de Parsing em background (Polling assíncrono) consome payloads das APIs
- Algoritmo de correspondência de padrões (Regex/NLP) baseado em array de keywords por usuário
- Matches disparam eventos que roteiam dados para o topo do funil Kanban
- API RESTful protegida por **JWT** (stateless, expiração curta, Bearer header)

### Frontend
- **SPA React** com gerenciamento de estado global via **Zustand**
- Paradigma **"SaaS OS"** — não dashboard estático
- **Scrolltelling** (rolagem vertical contínua)
- Renderização Condicional Progressiva
- Animações via **framer-motion** baseadas no viewport
- CSS **Tailwind** com **Glassmorphism** avançado
- Modo Foco: State Machine no frontend para timer, sincroniza XP e streak_days via API

---

## Requisitos Funcionais

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RF01 | Autenticação OAuth2 Multicanal | Conectar, autorizar e revogar acesso a Google (Gmail/Calendar) e Microsoft (Outlook/Teams) nas configurações |
| RF02 | Motor de Palavras-Chave | Cadastrar, editar e excluir "Palavras-Chave de Foco" |
| RF03 | Triagem Automática de Caixa de Entrada | Varrer e-mails/mensagens não lidas; se contiver keyword → "Card de Tarefa Crítica" no dashboard |
| RF04 | Inbox Unificada (Backlog) | Mensagens sem keyword vão para "Para Organizar"; usuário pode arquivar ou transformar em tarefa manual |
| RF05 | Quadro Kanban Integrado | Colunas: A Fazer, Fazendo, Concluído; visualizável como linha do tempo na tela inicial |
| RF06 | Modo Foco Imersivo | Botão que oculta distrações e inicia cronômetro Pomodoro vinculado a uma tarefa |
| RF07 | Motor de Gamificação | Concluir tarefa no Modo Foco adiciona XP ao perfil do usuário |
| RF08 | Rastreador de Ofensiva (Streaks) | Monitora acessos/tarefas diárias; incrementa "Dias Seguidos"; zera após 24h sem atividade |
| RF09 | Módulo Financeiro | Registro rápido de gastos do dia; exibe saldo restante baseado na regra 50-30-20 |
| RF10 | Módulo de Saúde | Cadastro de medicamentos/hábitos; checkboxes diários de controle |

---

## Requisitos de Interface (UI)

| ID | Requisito | Descrição |
|----|-----------|-----------|
| UI01 | Composição Material (Glassmorphism) | Nenhum card com cor sólida opaca. Todos: `bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl` |
| UI02 | Arredondamento Acentuado | Containers com `rounded-[2rem]` ou `rounded-3xl`. Nunca reto ou levemente arredondado |
| UI03 | Tipografia Brutalista | Números primários: `text-4xl md:text-5xl font-black tracking-tighter`. Secundários: `text-[11px] text-zinc-400` |
| UI04 | Fundo Dinâmico (Ambient Background) | Body com `bg-zinc-950` + divs absolutas com gradientes radiais (`bg-violet-900/20 blur-[120px]`) |

## Requisitos de Experiência (UX)

| ID | Requisito | Descrição |
|----|-----------|-----------|
| UX01 | Revelação Progressiva | Elementos fora do viewport deslizam de baixo (y: 30→0) com opacidade 0→1 via `framer-motion whileInView` |
| UX02 | Interação Tátil | Cards reagem ao hover: `hover:border-white/10 hover:bg-zinc-800/40 hover:scale-[1.01] transition-all duration-500` |
| UX03 | Arquitetura em Funil | Camada 1: Saudação + tarefas bloqueantes. Camada 2: Kanban/timeline. Camada 3: Agenda, finanças, medicação |

---

## Requisitos Não-Funcionais

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RNF01 | Estética "SaaS OS" | Sem grid rígido; Scrolltelling com transições de cor suaves |
| RNF02 | Glassmorphism | Containers com fundo translúcido, backdrop-blur alto, bordas arredondadas, sombras de profundidade |
| RNF03 | Criptografia em Repouso | Tokens OAuth nunca em texto puro no banco; criptografados antes da inserção, descriptografados só em memória |
| RNF04 | Assincronicidade | Busca de e-mails/mensagens em background com Skeleton Loaders como indicadores |
| RNF05 | Segurança Stateless | Comunicação Frontend-Backend exclusivamente via JWT com expiração curta, Bearer header |

---

## Regras de Implementação

1. **Toda mudança de código deve respeitar a arquitetura descrita acima.**
2. **UI:** Sempre usar Tailwind + Glassmorphism. Nunca grid rígido. Priorizar Scrolltelling e framer-motion.
3. **Estado:** Zustand para estado global no frontend.
4. **Segurança:** JWT stateless, tokens OAuth criptografados AES-256/Fernet, nunca expor tokens em texto puro.
5. **Performance:** Operações de I/O externo (email, mensagens) sempre assíncronas e em background.
6. **Gamificação:** XP e Streaks são cidadãos de primeira classe — toda feature de conclusão de tarefa deve considerar esses sistemas.
7. **Stack:** React (SPA) + FastAPI (Python) + Supabase (PostgreSQL).
