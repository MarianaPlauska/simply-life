# Layout UI/UX — próximo passo (Kanban + Dashboard + Finanças)

**Foco atual:** organizador financeiro como pilar do Simply-Life + polish mobile do dashboard.  
Referências: `docs/KANBAN_REDESIGN.md` · `docs/GAMIFICACAO_RETENCAO.md` · `docs/SETUP_EMAIL_GRATIS.md` (pausado)

---

## Roadmap UI/UX — Kanban & Dashboard

| Etapa | Nome | Status |
|-------|------|--------|
| **1** | Hierarquia & leitura em 5s | **Concluída** |
| **2** | Interação & densidade inteligente | **Concluída** |
| **3** | Polish Instrumento + mobile-first | Planejada |

Ordem geral: `Kanban/Dashboard Etapa 3` → **Finanças F2–F5** → Gmail

---

## Finanças AXEL — roadmap (novo)

**Visão:** orquestrador de vida — gastos diários, planejamento multi-mês, cartão visual, previsão “consumir vs esperar”, aba planilha/Excel com gráficos, integrado ao Kanban (contas viram tarefas).

### Benchmark de mercado (pesquisa web, 2025–2026)

| Produto | O que faz bem | Lição para Simply-Life |
|---------|---------------|------------------------|
| **[YNAB](https://www.ynab.com)** | Orçamento **proativo** (cada real tem trabalho), não só relatório passado | Saldo projetado + “desconta ou só anota” no diário |
| **[Monarch Money](https://www.monarchmoney.com)** | Visão casal/geral, investimentos, UX limpa | Dashboard financeiro unificado no `/financeiro` |
| **[Copilot Money](https://copilot.money)** | Visual premium, categorização, Apple Card | Cartão desenhado + densidade editorial Instrumento |
| **[PocketSmith](https://www.pocketsmith.com)** | **Forecast diário** de caixa (6–30 meses) | Evoluir `CashflowForecast` com dados reais, não mock |
| **[CalendarBudget](https://calendarbudget.com)** | Calendário visual — dinheiro no **futuro**, não só passado | Timeline mensal + contas fixas no calendário |
| **[Quicken Simplifi](https://www.quicken.com/simplifi)** | Fluxo de caixa projetado + categorias custom | Aba Planilha + gráficos + limites por categoria |
| **[Notion Finance OS](https://www.notion.com/templates/finance-os-848)** | Life OS: finanças + tarefas + hábitos num lugar | **Orquestrador**: boleto no Kanban ↔ lançamento no financeiro |
| **Lunch Money** | API aberta, tags, multi-moeda | Categorias anotáveis + export CSV (futuro) |

**Diferencial Simply-Life:** único produto que cruza **urgência de tarefas** (score AXEL) com **folga financeira** (“pode comprar hoje ou esperar 5 dias?”).

---

### Fases de implementação

| Fase | Nome | Entregável | Status |
|------|------|------------|--------|
| **F1** | Diário + saldo + planilha | Lançamento rápido, saldo corrente/projetado, conselho AXEL, aba Planilha com extrato Excel + gráficos | **Concluída** |
| **F2** | Cartão + layout Instrumento | Fatura por ciclo, visual do cartão, pagamento no caixa, shell Finanças unificado | **Em produção** |
| **F3** | Planejamento multi-mês | Calendário de caixa 3–6 meses, contas fixas projetadas, cenários | Planejada |
| **F4** | Orquestrador financeiro | Regra “consumir / cautela / esperar” com valor da compra; criar tarefa Kanban a partir de conta | Planejada |
| **F5** | Power-user | Export CSV, filtros pivot, tema Instrumento no módulo inteiro, mobile FAB | Planejada |
| **F6** | Integração vida | Main Quest ignora gasto? · alerta dashboard · webhook boleto → despesa | Planejada |

---

### F1 — Diário + saldo + planilha ✅ (esta sessão)

**Kanban financeiro no código:**

- [x] `lib/financeLedger.ts` — extrato com saldo após cada linha; pago desconta, pendente/agendado só projeta
- [x] `lib/financeSpendAdvice.ts` — heurística consumir / cautela / esperar
- [x] Aba **Diário** — anotação rápida, categorias, toggle “desconta saldo” vs “só anotar”
- [x] Aba **Planilha** — tabela densa + KPIs + gráfico saldo + barras categoria/dia
- [x] Tabs mobile com scroll horizontal no `FinancePlannerView`

**Critério de aceite F1:**
- [x] Lançar gasto do dia em ≤3 campos
- [x] Ver saldo corrente vs projetado no mesmo painel
- [x] Extrato mensal com coluna “Saldo após” estilo Excel

---

### F2 — Cartão + layout Instrumento ✅ (esta sessão)

**Layout (tema Instrumento no módulo):**
- [x] `FinancePlannerShell` — header, tabs pílula, FAB accent, safe-area mobile
- [x] Abas Finanças alinhadas ao dashboard (`border-line`, `text-ink`, `accent`)
- [x] Cartões, formulário e fatura com tokens `axelSurfaces` (sem zinc legado na aba Cartões)

**E1 — Painel assistente (esta sessão):**
- [x] Categorias com grupos Casa/Contas/Futuro + seed automático
- [x] Saldo caixa/cartão verde · amarelo · vermelho
- [x] Gráficos maiores gastos da semana + por cartão
- [x] Diário: conta corrente vs cartão + seletor visual de categoria
- Roadmap completo: `docs/FINANCAS_ASSISTENTE.md`

**Início + atalhos:**
- [x] Aba **Início** — hero saldo, conselho AXEL, atalhos de navegação
- [x] **Gastos pré-cadastrados** — grid 1 toque + editor (localStorage)
- [x] Valor fixo = lança direto; sem valor = popup rápido

**Cartão de crédito:**
- [x] `lib/financeCardCycle.ts` — ciclo fechamento → vencimento, fatura aberta
- [x] `CreditCardVisual` — desenho do cartão + barra fatura/limite + datas
- [x] `CardInvoicePanel` — compras do ciclo, editar fechamento/vencimento, **Pagar fatura**
- [x] Compras no cartão → fatura (status pendente); caixa só no pagamento (`affectsCashBalance`)
- [x] Migration `014_fin_cartoes_fechamento.sql` — coluna `dia_fechamento`
- [ ] Parcelas (N×) — F2b

**Critério de aceite F2:**
- [x] Ver fatura aberta e dias até fechar/vencer no cartão
- [x] Lançar no cartão não reduz saldo corrente até “Pagar fatura”
- [x] Módulo `/financeiro` com shell visual consistente com o resto do app

---

### F3 — Planejamento multi-mês

- [ ] Substituir estimativas fixas em `CashflowForecast` por média móvel real + contas fixas
- [ ] Vista calendário (estilo CalendarBudget) — barras por dia/semana
- [ ] Cenário otimista / base / pessimista

---

### F4 — Orquestrador AXEL

- [ ] Input “Quanto quero gastar?” no Diário → resposta com dias sugeridos
- [ ] Conta fixa vencendo → tarefa automática no Kanban (score por valor + proximidade)
- [ ] Dashboard: KPI “folga do mês” clicável → `/financeiro?tab=diario`

---

### F5 — Planilha avançada

- [ ] Export CSV / copiar para clipboard
- [ ] Filtros pivot (categoria × mês × cartão)
- [ ] Refatorar `FinancePlannerView` para tokens Instrumento (`border-line`, `text-ink`)

---

## Kanban & Dashboard (histórico)

### Etapas 1–2 ✅
Legenda, ribbon, pulse drill-down, drag semântico, Main Quest compacto, hero sem coluna vazia, loja em Configurações.

### Etapa 3 — Polish (pendente)
Empty states, Gantt duração, presets layout dashboard, mobile stack.

---

## Ordem de execução global

```
Dashboard Etapa 3  →  Finanças F2b (parcelas)  →  F3 (multi-mês)  →  F4 (orquestrador)  →  Gmail
```

---

*Atualizado — F1 concluída; F2 cartão + layout Instrumento implementados.*
