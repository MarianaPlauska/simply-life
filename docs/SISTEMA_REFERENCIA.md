# Simply-Life — Referência do Sistema (Jarvis)

Documento mestre para orientar desenvolvimento, design e agentes de IA.  
**Stack:** React + Vite + TypeScript + Zustand + **Supabase** (Auth, Postgres, RLS, Realtime) + APIs Vercel (`/api/*`).

**Projeto Supabase:** `zuxkqmooxvnulgllduhr`

---

## 1. Visão do produto

Orquestrador ativo de vida (estilo Jarvis): triagem autônoma, score de urgência, saúde, finanças e gamificação RPG — **não** um TODO passivo.

O sistema diz *o que executar agora* e silencia o resto, em vez de exigir que o usuário organize tudo manualmente.

### Hierarquia de score

| Faixa | Score | Exemplos |
|-------|-------|----------|
| Saúde (máxima) | 200+ | Medicamento atrasado >1h |
| Compromissos / finanças críticas | 100+ | Reunião, vencimento, coluna “Fazer em 1h” |
| Trabalho / comunicação | 0–100 | E-mail, GitHub, manual |
| Ruído | negativo / baixo | Newsletter, spam |

---

## 2. Design System Premium (Minimalista)

Filosofia: **alta densidade de dados**, sem “cara de template genérico de IA” (caixas, bordas pesadas, sombras exageradas, espaçamento infantil).

### 2.1 Fundo (Canvas)

- **Preto puro:** `bg-black` / `#000000`
- Sem cinzas intermediários no canvas — contraste infinito e economia de bateria em OLED (mobile)
- Tailwind: `colors.fundo` = `#000000`

### 2.2 Cards e blocos (data containers)

- Tons **roxo-cinza ultracescuros:** `bg-zinc-950`, `#090514` (`colors.card`)
- Integração suave ao fundo, **sem sombras gigantes**
- Cantos **sutis:** `rounded-md` (4–6px), não “pill” amador

### 2.3 Acentos (Roxo Jarvis)

- Roxo **profundo e nobre:** `purple-600`, `indigo-500`, `violet-500` (sem neon)
- Uso restrito a: botões principais, links, barras de XP, ícones de status ativo
- Progresso e IA: violeta contido, nunca saturado infantil

### 2.4 Densidade visual — “Tudo é linha”

- Tarefa no Kanban temporal = **linha compacta**, não card com borda pesada
- Prioridade = **traço colorido na borda esquerda** (`border-l-2`)
- Meta de densidade: ~10 e-mails / 15 transações visíveis sem scroll infinito
- Hover discreto: `hover:bg-zinc-950/80`, sem elevação 3D

### 2.5 Modo Academia (exclusivo saúde/treino)

- Interface **100% monocromática:** preto puro + branco nobre
- Sem roxo ou cores distratoras no bloco de treino
- Componente: `WorkoutTrackerCard` com `data-academy-mode`
- Foco: cronômetro, séries, check-in de consistência

### 2.6 Mobile-first

- Kanban mobile: lista compacta + **tabs/swipe** entre colunas temporais (planejado/refinar)
- Modais de detalhe: **bottom sheets** (gavetas de baixo para cima)
- Jarvis no bolso: alertas de saúde e medicamento com prioridade máxima

---

## 3. Os quatro pilares

### PILAR 1 — Produtividade e Kanban inteligente

**Orquestrador ativo** consome Gmail, Google Agenda, GitHub, anotações manuais (futuro: Outlook/Teams) e unifica em `tarefas_unificadas`.

**Triagem autônoma (alma do Jarvis):**

- `POST /api/ingest-tasks` — Gemini + score matemático
- `POST /api/webhook-ingest` — HMAC + score (M2M)
- Motor: `api/_lib/triageScore.js`, `api/_lib/keywordBoost.js` (+50), `activeOrchestratorService.ts`

**Kanban temporal (hábito do usuário):**

| Coluna | Critério (modo temporal) |
|--------|-------------------------|
| Fazer em 1h | `pendente` + score ≥ 60 |
| Fazer Hoje | `em_progresso` |
| Nesta Semana | `pendente` + score < 60 |

**Visão compacta:** `KanbanCard` com `flat={true}` → layout em linha.

**Realtime (sem F5):**

- Hook: `useRealtimeSync.ts` — filtro `user_id`, toast “Jarvis: nova tarefa triada”
- Migration: `011_realtime_tarefas.sql` — publication `supabase_realtime`

**UI:** `KanbanBoard`, `SuperhumanView`, `DevIngestaoModal`, `BurnoutAura`, keywords em Settings.

---

### PILAR 2 — Saúde, rotina e Modo Academia

- **Medicamentos:** score máximo no Kanban; overlay global >1h (`MedicationLockOverlay`)
- **Água / Proteína:** `WaterTrackerCard`, `ProteinGoalCard`
- **Treinos:** `sessoes_treino`, cronômetro início/fim, completo se ≥80% da meta (`WorkoutTrackerCard` + Modo Academia)
- **Bem-estar:** humor, diário, revisão semanal
- View: `HealthView`

---

### PILAR 3 — Finanças premium

- Planilha densa: `FinanceTransactionsTab`
- **50-30-20 real:** `utils/rule503020.ts` — quest ao cumprir regra (`financeiroRule503020.ts` + `useFinancePlannerInit`)
- Cartões glassmorphism: `VirtualCardItem`
- Fluxo 6 meses: `CashflowForecast`
- View: `FinancePlannerView`

---

### PILAR 4 — Gamificação RPG

**Atributos:** Foco (produtividade), Vitalidade (saúde), Estabilidade (finanças).

**Mecânicas:**

| Ação | XP |
|------|-----|
| Tarefa normal | +15 Foco |
| Tarefa urgente | +25 Foco |
| Deep Work matinal (3× score>80 antes 12h) | +50 Foco |
| Medicamento | +20 Vitalidade (streak 3d ×2) |
| Transação | +10 Estabilidade |
| Meta financeira | +50 Estabilidade |

**Debuffs / alertas:**

- Burnout: >5 tarefas score>100 em pendente / fazer 1h
- Overlay medicamento
- Avatar “cansado” (planejado visual)

**Dados:** `user_stats`, `achievements`, `user_quests` (migration `008`).

**Deep Work:** `utils/deepWork.ts` + `tarefasCompletionRewards.ts` — apenas **antes das 12h**.

---

## 4. Estado global (Zustand)

Hub: `frontend/src/store/useTaskStore.ts`

| Slice | Responsabilidade |
|-------|------------------|
| `tarefasSlice` | CRUD, move, ingest, XP, Deep Work |
| `financeiroSlice` | Transações, 50-30-20, cartões |
| `saudeSlice` | Meds, hábitos, treinos |
| `gamificacaoSlice` | XP, quests, conquistas |
| `triagemSlice` / `inboxSlice` | Inbox IA |
| `dashboardSlice` | Resumo executivo |

---

## 5. APIs serverless

| Rota | Função |
|------|--------|
| `/api/ingest-tasks` | Gemini + score + keywords (+50) + insert |
| `/api/webhook-ingest` | HMAC + score + keywords (+50) + insert |
| `/api/generate-greeting` | Saudação Jarvis |

**Webhooks:** Settings → **Webhooks Jarvis** → `user_webhook_secrets` (migration `010`).

---

## 6. Migrations Supabase

| # | Arquivo | Conteúdo |
|---|---------|----------|
| 008 | `008_jarvis_gamification.sql` | RPG tables |
| 009 | `009_saude_treinos_sessoes.sql` | Treinos (índice sem `::date`) |
| 010 | `010_user_webhook_secrets.sql` | Secret M2M |
| 011 | `011_realtime_tarefas.sql` | Realtime Kanban |

Todas idempotentes para o SQL Editor.

---

## 7. Roadmap — status

### Feito (Fase 0–1)

- [x] Overlays saúde + burnout globais
- [x] Gamificação Supabase + UI
- [x] Água, proteína, treinos + Modo Academia (visual)
- [x] 50-30-20 quest real + webhooks
- [x] Realtime Kanban (código + migration 011)
- [x] Deep Work só de manhã
- [x] Kanban linha compacta (`flat`)
- [x] Fundo true black (base)

### Pilar 1 — Produtividade/Kanban (foco 100%)

| Item | Status |
|------|--------|
| Realtime E2E (`useRealtimeSync`, migration `011`, indicador Ao vivo) | ✅ código |
| Design linha compartilhado (`TaskLineRow`) | ✅ |
| Kanban temporal padrão + persistência `jarvis_kanban_style` | ✅ |
| Superhuman alinhado ao Kanban (lista por score) | ✅ |
| Migration `011` rodada no Supabase | ⚠️ validar no projeto |
| Swipe/tabs mobile entre colunas temporais | 🔲 |
| Teste manual: webhook → tarefa sem F5 | 🔲 checklist QA |

### Outros (após Pilar 1)

- [ ] Treino abandonado (sessão aberta >2h)
- [ ] Tabela financeira densa (design linha)

### Fase 2+

- [ ] Edge Function cron (fantasmas 24/7)
- [ ] Agrupamento semântico e-mail + issue
- [ ] Shadow drafting
- [ ] Tokens OAuth Fernet

---

## 8. Arquitetura modular e Clean Code (obrigatório)

Padrão de **Staff Engineer**: evitar monólitos, acoplamento e código com “cara de IA genérica”. Todo código novo deve respeitar esta divisão.

### 8.1 Frontend (React / Vite / TypeScript)

| Regra | Detalhe |
|-------|---------|
| **Tamanho de arquivo** | Componentes com **no máximo 100–150 linhas**. Se crescer, extrair subcomponentes. |
| **Hooks** | Estado complexo, `useEffect` e chamadas API → **custom hooks** em `frontend/src/hooks/` (ex.: `useFinancePlannerInit`, `useRealtimeSync`, `useUnifiedTasks`). O componente só consome o hook e renderiza JSX. |
| **Tipagem** | TypeScript estrito (`interface` / `type`). **Evitar `any`**. |
| **Slices finos** | Lógica de domínio pesada em arquivos auxiliares do slice (ex.: `financeiroRule503020.ts`), não dentro do componente. |

### 8.2 APIs serverless (Vercel / Node)

| Camada | Pasta / arquivo | Responsabilidade |
|--------|-----------------|------------------|
| Handler | `api/*.js` | Orquestração HTTP fina (< ~100 linhas) |
| Motor de score | `api/_lib/triageScore.js` | Funções puras de urgência |
| Keywords | `api/_lib/keywordBoost.js` | Busca termos do usuário, match +50 |
| Auth webhook | `api/_lib/webhookAuth.js` | HMAC |
| Persistência | `api/_lib/insertTriagedTask.js`, `supabaseAdmin.js` | Insert Supabase |

### 8.3 Back-end Python (FastAPI — evolução / workers)

Quando houver rotas Python ativas, separar rigidamente:

- **Routes** — endpoints HTTP
- **Services** — regras de negócio
- **Repositories / Models** — acesso ao banco

Motor de score e workers Celery: **funções pequenas, puras e testáveis** (como em `backend/logic/scoring.py`).

### 8.4 Convenções gerais

- Chaves **Allman** (sempre): `if`, `for`, funções e blocos com `{` na linha seguinte — nunca estilo K&R na mesma linha
- **Comentários em português (PT-BR)** em código novo ou alterado (explicam regra de negócio, não o óbvio)
- Utils reutilizáveis: `rule503020.ts`, `deepWork.ts`, `medicationLock.ts`, `burnoutTasks.ts`, `healthPresets.ts`
- Libs compartilhadas de API: `api/_lib/*` — nunca duplicar fórmula de score nos handlers

---

## 9. Deploy e env

- Vercel → `frontend/dist`
- `VITE_SUPABASE_*`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WEBHOOK_INGEST_SECRET` (opcional)

---

## 10. Como usar este doc com o agente

Exemplos:

- “Leia `docs/SISTEMA_REFERENCIA.md` §2 e refatore o Kanban para linhas densas.”
- “Implemente roadmap §7 item keywords no webhook.”
- “Respeite Modo Academia §2.5 ao editar treinos.”

**Última atualização:** Pilar 1 — Realtime reforçado, `TaskLineRow`, Superhuman + Kanban temporal alinhados.
