# Finanças — Assistente pessoal (roadmap)

Visão: um **melhor amigo financeiro** — painel visual, categorias suas, caixa + cartões com cores de alerta, faturas reservadas e tabela por período.

---

## Etapas

| # | Nome | Escopo | Status |
|---|------|--------|--------|
| **E1** | **Painel + categorias + cartões + gráficos** | Categorias/subcategorias, saldo colorido, gráficos semanais, modal Instrumento, investimento vs receita vs gasto | **Concluído** |
| E2 | Conta corrente + débito | Saldo inicial configurável, disponível vs reservado, débito em tempo real | **Concluído** |
| E3 | Faturas e reservas | Faturas com valor alocado, abatimento automático/manual, barra alocado vs gasto | **Concluído** |
| E4 | Orçamento por categoria | Limites mensais, progresso, alertas 80%/100% ao lançar | **Concluído** |
| E4b | Hub Planejamento mensal | Aba Orçamentos + alerta Hoje (web/Expo) | **Concluído** |
| E4c | Parceiro financeiro | Workspace casal, convite `/parceiro/:code`, flag compartilhada (sem Open Finance) | **Concluído** |
| E5 | Receitas e recorrências | Salário, freelance, `fin_receitas_recorrentes`, projeção de caixa | **Concluído** |
| E6 | Tabela por período | Filtro semanal/quinzenal/custom, grupos Casa/Contas/Futuro na tabela | **Concluído** |
| E7 | Metas e alertas | Metas com projeção, avisos de contas e limite de orçamento | **Concluído** |
| E8 | Relatórios e export | Resumo mensal/anual, CSV/PDF | Planejado |
| E9 | UX mobile + meios de pagamento | Coluna única, PIX, previsão, hub Configurar, alertas de vencimento | **Concluído** |
| **E10** | **Coach Axel (IA)** | Conselho personalizado Groq + fallback local; sugestão e botão de limites | **Concluído** |
| **E11** | **Posso comprar?** | Axel antes de confirmar gasto — Groq + folga, categoria e cartão | **Concluído** |
| **E12** | **Reconciliação bancária** | Saldo real vs app, delta Axel, streak + XP | **Concluído** |
| **E13** | **Captura rápida global** | Ctrl+K · gastei 45 almoço · lançamento PIX pago | **Concluído** |
| **E14** | **Resumo diário Axel** | Brief no dashboard/finanças + notificação 1x/dia | **Concluído** |
| **E15** | **Ritual fim de mês** | Previsto vs real, sugestão de limites, +25 XP | **Concluído** |
| **E16** | **Receitas recorrentes auto** | Salário/freelance lançam no dia (como fixas) | **Concluído** |

---

## E1 — Detalhe funcional (esta entrega)

### 1. Categorias personalizadas
- CRUD ilimitado em **Configurar categorias** (header do planner).
- Grupos: **Casa**, **Contas**, **Organizações futuras**, **Geral**.
- Seletor visual (`CategoryPicker`) em Diário e lançamentos rápidos.
- Seed automático na primeira vez (Mercado, Aluguel, Luz, etc.).

### 2. Cartão vs conta corrente
- Lançamento com **Caixa (débito)** ou **Cartão X**.
- Gasto no cartão: abate limite/fatura aberta; **não** debita caixa até pagar fatura.
- Gasto no débito: abate saldo corrente quando status = pago.

### 3. Indicador visual de saldo
| Tom | Significado |
|-----|-------------|
| Verde | Saldo saudável / limite confortável |
| Amarelo | Atenção — pouco disponível ou muitas pendências |
| Vermelho | Negativo ou limite estourado |

### 4. Gráficos de insights
- Barras: **maiores gastos da semana** (por categoria).
- Barras: **gastos no cartão selecionado** (categoria ou descrição).

---

## Modelo de dados (evolução)

```
fin_categorias (+ grupo)
despesas (+ card_id, status_pagamento) — já existe
fin_cartoes — já existe
fin_faturas_reservas — E3 (valor_alocado, valor_gasto, vencimento)
fin_conta_corrente_saldo — E2 (saldo_inicial opcional)
fin_receitas_recorrentes — E5 (migration 019)
fin_orcamentos — E4 (limites por categoria_id)
despesas.forma_pagamento — E9 (pix | debito | dinheiro | boleto | cartao | ted | outro)
```

### E4 — Orçamento
- Painel na aba **Análise** com barras por categoria-pai (inclui subcategorias no rollup).
- `setBudgetLimit` persiste em `fin_orcamentos` por `categoria_id`.
- Toast ao lançar despesa quando atinge 80% ou estoura 100%.

### E5 — Receitas recorrentes
- CRUD na aba Análise; fallback `localStorage` offline.
- `buildCashflowProjection` usa recorrentes ativas + contas fixas + média histórica.

---

### E6 — Período e grupos
- Toolbar em **Planilha** e **Lançamentos**: mês, semana, quinzena, personalizado.
- Vista **Por grupo** (Casa · Contas · Futuro · Geral) na planilha e resumo colapsável em lançamentos.
- Filtro rápido por grupo na aba Lançamentos.

---

### E7 — Metas e alertas
- `financeGoalProjection.ts` — sobra mensal estimada e meses até a meta (com prazo opcional).
- `financeAlerts.ts` + `useFinanceAlerts` — orçamento, faturas reservadas, contas fixas, cartões e metas.
- Aba **Metas**: `FinanceGoalCard`, `FinanceAlertsPanel`, resumo geral.
- **Início**: preview compacto dos 3 alertas mais relevantes (clique navega para a aba).
- Modal **Nova meta** com campo de prazo (coluna `prazo` em `fin_metas`).

---

### E9 — Meios de pagamento e mobile
- Coluna `forma_pagamento` em `despesas` (migration **020**).
- Seletor com **PIX** (padrão), débito, dinheiro, boleto + cartões; receitas: PIX, TED, dinheiro.
- Planilha, diário e lançamentos exibem o rótulo explícito.
- Layout mobile em coluna única (sem carrossel lateral).
- **Previsão e histórico** (`financeMonthOutlook.ts`): navegação livre (−60 a +12 meses); previsão encadeada para meses futuros; comparativo previsto vs real em mês atual e passado.
- **Aba Configurar**: saldo inicial, editar cartões (nome, limite, cor, vencimento), atalhos para fixas e faturas.
- **Próximas 3 contas** ordenadas por data + botão **Pago**; notificações no sino (≤3 dias) até confirmar pagamento.
- **Início**: hero de saldo primeiro, Axel abaixo, contas em tempo real.

---

### E11 — Posso comprar?
- Ao salvar **gasto imediato**, o Axel analisa folga, orçamento da categoria e limite do cartão.
- Botão **Perguntar ao Axel** ou fluxo automático **Salvar e consultar Axel**.
- `POST /api/finance-purchase-check` — frases personalizadas com Groq; fallback local inteligente.
- Veredito **wait** bloqueia o tom positivo; usuário pode desistir ou registrar mesmo assim.

### Sino de vencimento (global)
- Ao **entrar no sistema** (`useFinanceSystemSync` no layout), o Axel sincroniza contas ≤3 dias e insere em `notificacoes`.
- O **sino pulsa ~6s** quando há alertas financeiros não lidos ou novos alertas criados.
- Não é push nativo do celular — aparece no sino do header em qualquer página.

### Saldo disponível — como o vínculo funciona
- **Fórmula:** `saldo inicial` + receitas/despesas **pagas no caixa** − **reservas de fatura**.
- **PIX, débito, dinheiro** com status *pago* → abate o disponível na hora.
- **Cartão** → abate o *limite do cartão*; o caixa só quando você registra o pagamento da fatura.
- **Pendente / agendado** → entra no *saldo projetado*, não no corrente até marcar pago.
- **Investimento** pago → sai do caixa como despesa.

### Auto-lançamento de contas fixas
- No **dia do vencimento**, contas fixas ativas viram despesa `pendente` automaticamente (`[fixa:id]` interno).
- Evita duplicar no mês; some da lista de “conta fixa” e aparece como lançamento pendente.
- Toast discreto: “Axel lançou X — vencimento de hoje”.

### E12 — Reconciliação
- Configurar → informar saldo do app do banco; delta vs disponível calculado.
- Axel explica diferença; streak de dias conferidos; +15 XP ao alinhar.

### E13 — Captura rápida
- `Ctrl+K` → `gastei 45 almoço` ou `recebi 3000 salário` → Enter.
- Modal global em qualquer página; categoriza por palavras-chave.

### E14 — Resumo diário
- Card no Dashboard e Finanças; 1 notificação/dia no sino ao entrar.

### E15 — Ritual fim de mês
- Últimos 3 dias do mês ou primeiros 5 do seguinte; compara previsto vs real.

### E16 — Receitas recorrentes automáticas
- No dia do recebimento, cria receita paga no caixa (`[receita-recorrente:id]`).

### O que ainda NÃO está automatizado
- **Open Finance** — import automático do banco (Pluggy/Belvo).

### E10 — Coach Axel (melhor amigo financeiro)
- `financeCoachContext.ts` — analisa ritmo diário, média 3 meses por categoria, folga e limites estourados.
- `POST /api/finance-coach` — Groq (ou Gemini) personaliza o conselho com seus números reais; sem API key usa motor local.
- **Início**: card Axel com teto diário sugerido, sugestões de limite por categoria e botão **Aplicar limite**.
- Botões **Definir limites** e **Ver orçamento** → aba Análise.
- Não é frase genérica: cita R$, categorias e compara com sua média de gastos.

---

## Próximo passo

1. Rodar migration **021** (`saldo_banco`) no Supabase.
2. **E8** — relatórios mensal/anual + export CSV/PDF (quando precisar).
3. **Open Finance** — paridade com Mobills/Organizze (médio prazo).
