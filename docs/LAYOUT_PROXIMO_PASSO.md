# Layout UI/UX — próximo passo (Kanban + Dashboard)

**Foco atual:** visualização clara para o usuário — sem integração Gmail até layout 100%.  
Referências: `docs/KANBAN_REDESIGN.md` · `docs/GAMIFICACAO_RETENCAO.md` · `docs/SETUP_EMAIL_GRATIS.md` (pausado)

---

## Roadmap UI/UX — 3 etapas

| Etapa | Nome | Objetivo | Status |
|-------|------|----------|--------|
| **1** | Hierarquia & leitura em 5s | Usuário entende o quadro sem tutorial | **Concluída** |
| **2** | Interação & densidade inteligente | Menos scroll, mais ação direta | **Concluída** |
| **3** | Polish Instrumento + mobile-first | Consistência visual e uso no celular | **Próxima** |

---

## Etapa 1 — Hierarquia & leitura em 5s ✅

**Princípio UX:** padrão **Z** — olho vai do KPI → decisão (Main Quest) → contexto (prazo/ofensiva/água).

### Kanban
- [x] **Legenda visual** `KanbanBoardLegend` — Executar agora vs Prazo com ícones e contagem
- [x] **Faixa de status** `KanbanStatusRibbon` — Atrasadas · Hoje · Semana · Sem data · Executar (clicável → rola à faixa)
- [x] Brief matinal **só quando relevante** (atrasadas ou vencimento hoje)
- [x] Painel Métricas/AXEL **recolhido por padrão** (`KanbanInsightsPanel`)
- [x] Workspace altura fixa · Executar estreito · Prazo com mapa + “ver mais”

### Dashboard
- [x] **Pulso do dia** `DashboardPulseStrip` — 4 KPIs grandes clicáveis (hoje, atrasadas, ofensiva, hidratação)
- [x] **Main Quest** em destaque (col-span 7) — Z-pattern, botão executar
- [x] Água + loop diário empilhados à direita (col-span 5)
- [x] Módulos do sistema recolhidos em `<details>`
- [x] Gamificação: confetti, loja, lembrete 18h, check-in humor

---

## Etapa 2 — Interação & densidade inteligente ✅ (esta sessão)

**Objetivo:** power-user sem perder o iniciante — ações com 1 clique, listas filtráveis, drag com significado.

### Kanban
- [x] **Drag semântico** — overlay “Mover prazo” vs “Priorizar execução” (`KanbanDragSemantics` + badge no `DragOverlay`)
- [x] **Filtros na Lista** — faixa, projeto, status (chips acima da tabela em `AxelKanbanListView`)
- [x] **FAB mobile** — botão “+” fixo para nova demanda (`KanbanMobileBoardShell`)
- [x] **Swipe** entre abas Executar | Prazo no mobile (gesto horizontal)
- [x] Ribbon “Executar” foca painel esquerdo no mobile
- [x] **Deep-link** — `?bucket=vencido` · `?panel=executar` rola/foca a seção certa

### Dashboard
- [x] **Drill-down** — Pulse abre `/kanban?bucket=…` ou `?panel=executar`; hidratação rola até `#dashboard-water`
- [x] **Inbox IA** resumida — 1 item + “+N na fila” (`InboxIACard`)
- [x] **Analytics recolhido** — `HolisticAnalyticsSection` em `<details>` por padrão
- [x] **Main Quest** → drawer direto via `?task=id` + “Executar agora” inicia foco sem ir ao board

### Arquivos novos / alterados
| Componente | Caminho |
|------------|---------|
| Semântica drag | `frontend/src/components/kanban/KanbanDragSemantics.tsx` |
| Mobile shell | `frontend/src/components/kanban/KanbanMobileBoardShell.tsx` |
| Drawer no dashboard | `frontend/src/components/layout/DashboardView.tsx` |

### Critério de aceite
- [x] Main Quest em ≤3 cliques (título ou Executar → drawer → concluir)
- [x] KPI do Pulse leva à faixa filtrada no Kanban

---

## Etapa 3 — Polish Instrumento + mobile-first (próxima)

**Objetivo:** produto “premium denso” — mesma linguagem visual em 100% dos cards, mobile como primeira classe.

### Kanban
- [ ] Empty states com **1 CTA** por painel (sem competição de botões)
- [ ] Gantt: barras com duração estimada + dependências visuais
- [ ] Calendário: densidade por semana com badge de carga
- [ ] Reduzir ruído no header — modo foco esconde insights permanentemente
- [ ] Feedback háptico/visual ao soltar card na faixa correta (micro-animação)

### Dashboard
- [ ] **Presets de layout:** Executivo (só KPIs + Main Quest) · Operacional (atual) · Saúde (hero água)
- [ ] **Mobile stack** — Pulse → Main Quest → Água → 3 KPIs → “Ver mais”
- [ ] Alturas equalizadas nos cards da grade 03 (finanças · inbox · atividade)
- [ ] Streak hidratação ao lado do `WaterWaveCard`
- [ ] Splash micro-animação ao registrar copo
- [ ] Transição suave Pulse → Kanban (highlight temporário na faixa alvo)

### Critério de aceite
- Lighthouse acessibilidade ≥90 no dashboard
- Nenhum card com tokens `zinc-*` legados fora de Saúde legado
- Teste em viewport 390px sem scroll horizontal involuntário

---

## Já entregue (histórico)

### Kanban base (B–D)
- [x] Executar agora + Prazo por faixas · mobile tabs · lista ordenável · Gantt espaçado
- [x] `DueBucketMap` · seções vazias ocultas · limite “ver mais” por faixa

### Dashboard base (E–G parcial)
- [x] `WaterWaveCard` hero · `DailyEngagementCard` · `StreakEveningBanner` · `AxelRewardShop`
- [x] `MentalHealthCheckIn` ao entrar · celebrações e Main Quest +50% XP

---

## Ordem de execução

```
Etapa 1 ✅  →  Etapa 2 ✅  →  Etapa 3 (polish)  →  Gmail
```

---

## Benchmark rápido

| Referência | Etapa 1 | Etapa 2 |
|------------|---------|---------|
| Linear | KPI → ribbon | Lista filtrável + deep-link |
| Motion | Leitura em 5s | Drag com intenção explícita |
| Superhuman | Z-pattern hero | Main Quest → drawer sem board |
| Apple HIG | Bento assimétrico | FAB + swipe no mobile |

---

*Atualizado — Etapas 1 e 2 UI/UX implementadas; Etapa 3 documentada como próximo passo.*
