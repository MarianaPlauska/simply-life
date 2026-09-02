# Paridade mobile — checklist

## Shell vs hub

| Camada | Status |
|--------|--------|
| Login Welcome + Form | Feito |
| Tabs + FAB com notch | Feito |
| Dashboard glances (humor, água, proteína, tarefas, gastos) | Feito |
| Kanban timeline + lista | Feito |
| Finanças donut + categorias | Feito |
| **Finanças shell** (Início / Movimentos / Contas / Análise) | Feito |
| **Contas sub-abas** (Conta / Cartões / A pagar / Fixas) | Feito (dados demo + sync remoto) |
| **Saúde shell** (Hoje / Cuidados / Diário) | Feito |
| **Saúde hub** (Hidratação / Alimentação / Academia / Medicamentos em Cuidados) | Feito |
| Sync humor / tarefas / gastos | Feito |
| Sync hábitos (`habitos_diarios`) | Feito (fallback demo) |
| Push nativo Expo | Feito (device + migration 052) |

## O que ainda não é paridade web completa

- Medicamentos: lista real + marcar dose (hoje stub + nota)
- Academy Mode / planos de treino detalhados
- Estimate-protein via API
- Rotação AXEL persistida em `user_workspace_prefs` (mobile usa rotação em memória)

## Tokens

Fonte: `packages/ui-tokens` alinhada a `frontend/src/design/identityTokens` (módulos health/finance/tasks, elevação canvas/surface/elevated/hero).

## Prova visual

Screenshots em `docs/screenshots/redesign-restore/` (Expo web `390×844`, light/dark).

| Fase | Evidência |
|------|-----------|
| A | `fase-A-after-light.png` / `fase-A-after-dark.png` — swatches canvas/surface/elevated + módulos + MoodFace |
| B | `fase-B-welcome-*`, `fase-B-form-*`, `fase-B-tabbar-*` — Welcome/Form + FAB notch |
| C | `fase-C-saude-*` — chips Água/Comida/Humor/Meds/Treino + frase AXEL pós-humor |
| D | `fase-D-inicio-*`, `fase-D-financas-*`, `fase-D-tarefas-*` — hero, glances, KPI módulo |
| E | `fase-E-collage-light-dark.png` — collage final |

Checklist de aceite: humor → frase AXEL por nível; água/proteína no hub e glances; zero emoji humor; elevação hero perceptível; KPIs com cor de módulo; pressed/haptics nos controles-chave.

Reproduzir: Expo em `:8082` + `E2E_BASE_URL=http://localhost:8082 npx playwright test e2e/redesign-restore-screenshots.spec.ts`
