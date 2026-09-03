# Paridade mobile — checklist

## Shell vs hub

| Camada | Status |
|--------|--------|
| Login Welcome + Form | Feito |
| Login Google / OAuth (`/auth/callback`) | Feito |
| Reset de senha (`/reset-password`) | Feito |
| Join friend (`/join/[code]`) | Feito |
| MFA challenge no login + enroll no Perfil | Feito |
| Perfil / Admin | Feito |
| Configurações (Gmail IMAP, Google OAuth, webhooks, sistema) | Feito |
| Setup AXEL obrigatório + Histórico AXEL | Feito |
| Tabs + FAB com notch | Feito |
| Dashboard glances (humor, água, proteína, tarefas, gastos) | Feito |
| Kanban colunas / lista / timeline / calendário / Gantt | Feito |
| Orquestrador + decision log + mover coluna + drawer | Feito |
| Sync Gmail (quando integração ligada) | Feito |
| Finanças donut + categorias | Feito |
| **Finanças shell** (Início / Movimentos / Contas / Análise) | Feito |
| **Contas sub-abas** (Conta / Cartões / A pagar / Fixas) | Feito |
| Planilha + CSV import/export | Feito |
| Metas wizard + coach / forecast / 50-30-20 | Feito |
| Fatura / quick spend nos cartões | Feito |
| **Saúde shell** (Hoje / Cuidados / Diário) | Feito |
| **Saúde hub** (Hidratação / Alimentação / Academia / Medicamentos em Cuidados) | Feito |
| Academy Mode (sessão + séries) | Feito |
| Medicamentos CRUD | Feito |
| Diário: revisão semanal + heatmap | Feito |
| Gamificação XP / conquistas / loja / celebrações | Feito |
| Sync humor / tarefas / gastos | Feito |
| Sync hábitos (`habitos_diarios`) | Feito (fallback demo) |
| Push nativo Expo | Feito (device + migration 052) |

## Critérios de aceite por onda

### Onda 0 — Fundação

- [x] Login Google + callback `/auth/callback`
- [x] Callback de integração `/google-callback`
- [x] Reset password
- [x] Join friend
- [x] MFA enroll (Perfil) e challenge (login)
- [x] Perfil + admin (se `is_admin_user` / cartão público)
- [x] Configurações: Gmail IMAP, Google OAuth, webhooks, sistema
- [x] Setup AXEL (`setup_completed_at`) + guard
- [x] Histórico AXEL navegável

### Onda 1A — Kanban

- [x] Cinco modos: colunas, lista, timeline, calendário, Gantt
- [x] Orquestrador + decision log
- [x] Mover entre colunas (long-press / drawer)
- [x] Drawer de tarefa (timer, checklist, notas, concluir)
- [x] Sincronizar Gmail

### Onda 1B — Finanças + Saúde

- [x] Planilha + CSV
- [x] Metas criáveis
- [x] Coach / forecast / 50-30-20
- [x] Fatura / quick spend
- [x] Academy utilizável
- [x] Meds CRUD
- [x] Revisão semanal + heatmap no diário

### Onda 2 — Gamificação

- [x] XP persiste (storage local)
- [x] Conquistas desbloqueiam em tarefa / humor / água / gasto / ofensiva
- [x] Shop consome moedas
- [x] Celebração em ações-chave
- [x] Entrada em Perfil + Configurações

## Shared

Lógica crítica em `packages/shared`: auth (MFA/OAuth/join), integrações, CSV, regras 50/30/20, academy, medicamentos, orquestração, decision log, trilha XP.

## Tokens

Fonte: `packages/ui-tokens` alinhada a `frontend/src/design/identityTokens` (módulos health/finance/tasks, elevação canvas/surface/elevated/hero).

## Fora deste ciclo (salvo pedido)

Superhuman, Drive vault, Realtime, páginas legais.

## Prova visual

Screenshots em `docs/screenshots/redesign-restore/` (Expo web `390×844`, light/dark).

| Fase | Evidência |
|------|-----------|
| A | `fase-A-after-light.png` / `fase-A-after-dark.png` — swatches canvas/surface/elevated + módulos + MoodFace |
| B | `fase-B-welcome-*`, `fase-B-form-*`, `fase-B-tabbar-*` — Welcome/Form + FAB notch |
| C | `fase-C-saude-*` — chips Água/Comida/Humor/Meds/Treino + frase AXEL pós-humor |
| D | `fase-D-inicio-*`, `fase-D-financas-*`, `fase-D-tarefas-*` — hero, glances, KPI módulo |
| E | `fase-E-collage-light-dark.png` — collage final |

Checklist de aceite visual: humor → frase AXEL por nível; água/proteína no hub e glances; zero emoji humor; elevação hero perceptível; KPIs com cor de módulo; pressed/haptics nos controles-chave.

Reproduzir: Expo em `:8082` + `E2E_BASE_URL=http://localhost:8082 npx playwright test e2e/redesign-restore-screenshots.spec.ts`
