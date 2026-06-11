# Cronograma AXEL — Próximas fases

Documento de execução alinhado à especificação AI Kanban e ao `KANBAN_REDESIGN.md`.

| Fase | Entrega | Status |
|------|---------|--------|
| **C** | Chip de dias restantes nas linhas de Prazo | ✅ |
| **B** | Proposta de prazo (sugerir → aceitar/rejeitar) | ✅ |
| **E** | Endpoint `/api/morning-brief` + UI no Kanban | ✅ |
| **D** | Wizard de onboarding em Configurações | ✅ |
| **A** | Ingestão de e-mail com Groq estruturado | ✅ (demo + API) |

## Fase C — Dias restantes

- `frontend/src/lib/daysRemaining.ts` — cálculo e rótulos PT-BR
- `frontend/src/components/kanban/DueDateChip.tsx` — chip reutilizável
- `DueBucketTaskRow` — exibe chip em vez de só data formatada

## Fase B — Proposta de prazo

- `frontend/src/lib/deadlineProposal.ts` — regras (carga, bloqueio, atraso)
- `frontend/src/store/slices/axelDeadlineProposalSlice.ts` — persistência local
- `AxelDeadlineProposalBanner` — aceitar / manter no drawer
- Integração em `useKanbanOrchestration` após pipeline

## Fase E — Brief matinal

- `api/morning-brief.js` — Groq/Gemini + fallback determinístico
- `frontend/src/lib/morningBriefApi.ts` — cliente HTTP
- `KanbanMorningBrief` — consome API com fallback local
- `KanbanView` — brief visível no modo board

## Fase D — Onboarding em Settings

- `AxelOnboardingWizard.tsx` — 5 passos guiados
- Aba Integrações em `SettingsView` — wizard no topo
- Novos passos: webhook, cap diário, keywords

## Fase A — E-mail + Groq

- `api/_lib/emailGroqParser.js` — JSON: score, due_at, intent, rationale
- `api/ingest-email.js` — `POST /api/ingest-email`
- `urgencyOrchestrator.js` — due_at na ingestão webhook
- `triagemSlice.sincronizarGmail` — demo ingest ou FastAPI se `VITE_API_URL`

## Sprint 2 — OAuth, Supabase, Cron ✅

| Entrega | Arquivos |
|---------|----------|
| OAuth Google (Calendar + Gmail) | `api/integrations/google/*`, `googleIntegrationApi.ts`, `GoogleCallbackView.tsx`, `calendarSlice.ts` |
| `deadline_proposals` no Supabase | `migrations/012_*`, `deadlineProposalApi.ts`, slice híbrido local+remoto |
| Cron sync Gmail (6h) | `api/cron/gmail-sync.js`, `vercel.json` crons |

### Variáveis necessárias

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `SUPABASE_SERVICE_ROLE_KEY` (API server-side)
- `GROQ_API_KEY` (triagem na ingestão)
- `CRON_SECRET` (proteção do cron)

### Fluxo OAuth

1. Configurações → Conectar Google → `/api/integrations/google/url`
2. Callback em `/google-callback` → `/api/integrations/google/callback` → `oauth_tokens`
3. Sync manual: `/api/integrations/gmail/sync` ou wizard “Sincronizar demo” (fallback)

## Próximo sprint

- Planejador / Gantt unificados no `KanbanViewSwitcher`
- Calendário Google no `fetchCalendarEvents`
- Dedup de e-mails por `message_id` em `unified_events`
