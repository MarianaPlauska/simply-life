# Centro de Execução AXEL — Redesign do Kanban

Documento de arquitetura e plano de implementação.  
**Estado atual:** `KanbanView.tsx` — painel Hoje + colunas Semana/Backlog; orquestração por score (`temporalHorizon.ts`).

---

## 1. Pesquisa e síntese

### 1.1 Experience Hubs

Sistemas maduros (Notion, Linear, Monday) centralizam **uma fonte de verdade** com **múltiplas projeções** da mesma entidade. O usuário não re-digita tarefas ao mudar de vista; muda apenas a lente (lista, calendário, timeline).

**Lições para o Simply-Life:**
- Uma tarefa (`tarefas_unificadas`) → N vistas (Planejador, Calendário, Gantt).
- Hub de execução = `/kanban` como **home operacional**, não como cópia do dashboard.
- AXEL como camada de inteligência transversal (brief, log, score) em todas as vistas. 

### 1.2 User Controls

Padrões que reduzem confusão:
- **Um eixo primário por tela** — não misturar “quando vence” com “o que executar agora” na mesma coluna.
- **WIP limits visíveis** — Hoje com cap (já existe `dailyScoreCap`).
- **Feedback imediato** — drag com rótulo do que mudou (prazo vs execução).
- **Progressive disclosure** — Concluído colapsado; analytics fora do fluxo principal.

### 1.3 Kanban — metodologia e armadilhas

| Boa prática | Armadilha atual no produto |
|-------------|---------------------------|
| Colunas = estágios claros do fluxo | Hoje/Semana/Backlog misturam prazo e prioridade IA |
| WIP limitado | Painel Hoje + colunas podem mostrar a mesma demanda em lógicas diferentes |
| Políticas explícitas | Orquestrador decide sem eixo “Vencido” dedicado |
| Pull system | Push por score sem faixa de prazo iminente |

### 1.4 Orchestrators

Orquestradores (AXEL + `orchestratePipeline.ts`) devem:
- **Sugerir** posição em “Em execução”, não reescrever prazos silenciosamente.
- Respeitar **pin manual**, dependências (`blockedBy`), decay e cap de carga.
- Expor **log explicável** (já iniciado em `KanbanDecisionLog`).

Separação de responsabilidades:
- **Prazo** = `data_vencimento` → faixas temporais.
- **Execução** = score + WIP → fila “Executar agora”.
- **Estado** = `status` → Concluído / em progresso.

### 1.5 Análise competitiva (resumo)

| Sistema | Força | Fraqueza | Oportunidade AXEL |
|---------|-------|----------|-------------------|
| **Trello** | Simples, drag intuitivo | Sem prazo forte, sem IA | Prazo + execução + IA local |
| **Asana** | Lista + Calendário + Timeline | UI densa, muitas abas | Mesmas vistas, menos ruído (Instrumento) |
| **Linear** | Foco, velocidade | Pouco “vida pessoal” | Holístico + execução séria |
| **Motion** | Auto-agendamento IA | Caixa preta, caro | AXEL transparente (log + razão) |
| **Bitrix24** | Prazos + Kanban | Pesado, enterprise confuso | Faixas de prazo claras, denso mas legível |

**Diferencial:** orquestrador **explicável** + dois eixos ortogonais (Prazo × Execução) num hub único.

---

## 2. Problema raiz da confusão atual

1. **Dois modelos mentais colapsados:** `TemporalHorizon` (hoje/semana/backlog) usa score *e* prazo na mesma função (`resolveTemporalHorizon`).
2. **Vistas desalinhadas:** Board / Lista / Timeline no `KanbanViewSwitcher` não correspondem a Planejador / Calendário / Gantt; `CalendarView` e `GanttView` vivem em rotas/componentes separados (`KanbanBoard.tsx` legado).
3. **Sem faixa “Vencido”** — tarefas atrasadas competem visualmente com backlog.
4. **Drag ambíguo** — mover para “Hoje” altera score e horizonte; usuário não sabe se mudou prazo ou prioridade de execução.

---

## 3. Modelo de dados proposto

### 3.1 Dimensões ortogonais

```
TarefaUnificada
├── Prazo (DueBucket)     ← derivado de data_vencimento
├── Execução (ExecQueue)  ← derivado de score + pin + AXEL
├── Status (workflow)     ← pendente | em_progresso | concluida
└── Meta AXEL             ← score, rationale, blockedBy, manualOverrides
```

### 3.2 DueBucket (Prazo)

| ID | Rótulo | Regra |
|----|--------|-------|
| `vencido` | Vencido | `data_vencimento` < hoje ∧ não concluída |
| `hoje` | Vencimento hoje | vence hoje |
| `esta_semana` | Esta semana | vence em 1–7 dias |
| `proxima_semana` | Próxima semana | vence em 8–14 dias |
| `sem_prazo` | Sem prazo | `data_vencimento` null |
| `concluido` | Concluído | `status === concluida` |

Implementação sugerida: `lib/dueBucket.ts` (substitui/complementa agrupamento em `temporalHorizon.ts` para **visualização por prazo**).

### 3.3 ExecQueue (Execução — WIP)

- Fila **Executar agora** (máx. N itens, cap em pontos).
- Preenchida por AXEL (`assignOrchestratedHorizons` evoluído).
- **Pin** impede remoção automática.
- Independente de DueBucket (tarefa vencida pode estar em execução).

### 3.4 Cinco “Listas” (vistas)

| Vista | Componente alvo | Conteúdo |
|-------|-----------------|----------|
| **Lista** | `AxelKanbanListView` refatorado | Tabela densa: prazo, score, status, projeto |
| **Prazo** | Novo `DueBucketBoard` | Seções Vencido → … → Sem prazo (modo agrupamento do Planejador) |
| **Planejador** | `KanbanView` principal | Coluna Executar agora + faixas de Prazo à direita |
| **Calendário** | Integrar `CalendarView` no hub | Drag = alterar `data_vencimento` |
| **Gantt** | Integrar `GanttView` + deps | Barras por prazo; setas `blockedBy` |

Todas leem `useTaskStore().tarefas` — **uma fonte**, cinco lentes.

---

## 4. Design de interface (Planejador — vista default)

```
┌──────────────────────────────────────────────────────────────┐
│ Command bar · Brief AXEL · Log · Reorganizar                 │
├──────────────┬───────────────────────────────────────────────┤
│ EXECUTAR     │  VENCIDO (N)                                   │
│ AGORA (WIP)  │  VENCIMENTO HOJE (N)                           │
│              │  ESTA SEMANA (N)                               │
│ [1] task     │  PRÓXIMA SEMANA (N)                            │
│ [2] task     │  SEM PRAZO (N)                                 │
│              │  ▼ Concluído (colapsado)                       │
└──────────────┴───────────────────────────────────────────────┘
```

**Switcher de vista:** Planejador | Lista | Calendário | Gantt | (opcional: só Prazo)

**Card de tarefa mostra sempre:**
- Título · ref · score
- Badge de DueBucket (cor semântica)
- Indicador “Em execução” se na fila WIP
- 1 linha de razão AXEL

**Drag:**
- Para faixa de prazo → atualiza `data_vencimento` (snap: hoje, +7d, +14d).
- Para Executar agora → pin + boost score; não altera prazo.
- Modo indicado por cursor/ghost label (“Mover prazo” vs “Priorizar execução”).

---

## 5. Integração AXEL (orquestrador)

Pipeline revisado:

1. **Ingestão** → score em lote (Groq).
2. **DueBucket** → classificação por data (determinística).
3. **ExecQueue** → AXEL escolhe até cap itens (score, deps, decay, drag learning).
4. **Alertas** — Vencido nunca oculto; AXEL pode subir score mas faixa vermelha permanece.
5. **Log** — “Movida para Executar: score 94 — cliente crítico”.

Arquivos impactados:
- `lib/orchestratePipeline.ts`
- `lib/temporalHorizon.ts` → deprecar mistura; manter `ExecHorizon` separado de `DueBucket`
- `hooks/useKanbanOrchestration.ts`

---

## 6. Controles do usuário

| Controle | Comportamento |
|----------|---------------|
| Pin | Fixa em Executar agora |
| Snooze | +N dias no prazo |
| Reorganizar tudo | Limpa overrides, rerun AXEL |
| Auto-organizar toggle | Já existe |
| Filtro por projeto/tag | Lista e Planejador |
| Concluir | Sai de todas as filas ativas |

---

## 7. Plano de implementação (fases)

### Fase 1 — Fundação (1 sprint)
- [ ] Criar `lib/dueBucket.ts` + testes unitários
- [ ] `DueBucketBoard` com 6 seções + contadores
- [ ] Separar estado: `executionQueue: number[]` vs `dueDate` only on drag
- [ ] Remover dependência visual Hoje = Due Today

### Fase 2 — Planejador unificado (1 sprint)
- [ ] Refatorar `KanbanView` layout (Executar + Prazo)
- [ ] Atualizar `KanbanViewSwitcher`: Planejador | Lista | Calendário | Gantt
- [ ] Drag dual-mode com toast explicativo
- [ ] Migrar `resolveTemporalHorizon` → só ExecQueue

### Fase 3 — Hub integration (1 sprint)
- [ ] Embutir `CalendarView` no Kanban (props shared)
- [ ] Embutir `GanttView` com `blockedBy`
- [ ] Deprecar `KanbanBoard.tsx` na rota legada se ainda referenciado

### Fase 4 — AXEL polish (1 sprint)
- [ ] Orquestrador respeita DueBucket (não “esconde” vencidos)
- [ ] Pin / Snooze UI
- [ ] Razão por faixa no header de seção

### Fase 5 — Documentação e cleanup
- [ ] Atualizar `DESIGN_SYSTEM.md` § Kanban
- [ ] Atualizar `SISTEMA_REFERENCIA.md`
- [ ] E2E: criar tarefa → vencido aparece → AXEL → executar

---

## 8. Próximos passos imediatos

1. **Validar modelo** — confirmar que Lista ≠ Prazo (Lista = tabela; Prazo = agrupamento; Planejador = composição Executar + Prazo).
2. **Implementar `dueBucket.ts`** — menor diff, maior clareza visual.
3. **Protótipo estático** — `DueBucketBoard` com mock antes de rewiring drag.
4. **Não expandir** colunas Semana/Backlog até Fase 2 completa — evita híbrido confuso.

---

## 9. Métricas de sucesso

- Usuário identifica tarefa vencida em **< 3 s** (seção Vencido no topo).
- Zero duplicação da mesma tarefa em “Hoje” por score *e* por coluna de prazo sem distinção visual.
- 100% das decisões AXEL com razão visível na fila ou log.
- Troca Planejador ↔ Calendário sem perda de contexto (mesma tarefa selecionada).

---

*Autor: arquitetura Simply-Life · AXEL · Instrumento design system*
