# Roadmap — Modo Academia + Relatórios de Saúde

Plano de execução em 4 fases para transformar o módulo de academia em um auxiliar completo (estilo Hevy/Strong/JEFIT), integrado aos relatórios do Simply-Life.

---

## Estado atual (baseline)

| Já existe | Gap |
|-----------|-----|
| `sessoes_treino` (início/fim, duração, concluído) | Sem JSON de exercícios/séries na sessão |
| `historico_cargas` no config do hábito treino | Não agrega volume nem PRs |
| `plano_semana` / `exercicios_por_dia` | Sem ID estável mensal (Treino A/B) |
| `AcademyModeView` + descanso + supersets | Sem progressive overload automático |
| `ExerciseBarChart` (UI) | Dados mock vazios |
| `bemEstarSlice.treinoPorDia` | Não exposto em Relatórios |

---

## Fase 1 — Dados que alimentam relatórios

**Objetivo:** cada treino finalizado vira um registro analítico completo.

### 1.1 Migration `040_academy_session_detail.sql`

```sql
ALTER TABLE sessoes_treino
  ADD COLUMN IF NOT EXISTS treino_codigo TEXT,          -- ex: "A", "B", "01"
  ADD COLUMN IF NOT EXISTS volume_kg NUMERIC,           -- Σ(carga × reps)
  ADD COLUMN IF NOT EXISTS detalhe JSONB DEFAULT '{}';  -- exercícios + séries
```

`detalhe` (tipo TypeScript `AcademySessionDetail`):

```typescript
{
  treino_codigo: string
  treino_titulo: string
  exercicios: {
    id: string
    nome: string
    series: { serie: number; peso_kg: number; reps: number; rpe?: number }[]
  }[]
  volume_kg: number
  series_totais: number
  reps_totais: number
}
```

### 1.2 Numeração estável de treinos

- Arquivo: `frontend/src/lib/academyTreinoCodes.ts`
- Regras:
  - Cada slot do `plano_semana` ganha `codigo` persistente (`A`…`G` ou `01`…`31`).
  - Ao criar/editar plano em `AcademyDayBuilder`, gerar código se ausente.
  - Exibir no UI: **Treino A — Peito/Tríceps**.
- Não muda no meio do mês salvo edição explícita do usuário.

### 1.3 Finalizar sessão estruturada

- Arquivo: `frontend/src/lib/academySessionDetail.ts`
- Em `finalizarTreino` (`saudeSlice`):
  1. Receber `completedSets` do `useAcademySession` (já existe `AcademyCompletedSet[]`).
  2. Montar `AcademySessionDetail`.
  3. Calcular `volume_kg = Σ(peso_kg × reps)`.
  4. Persistir em `sessoes_treino.detalhe` + colunas resumo.

### 1.4 Volume por sessão / dia

- `computeSessionVolume(sets)` → número único reutilizável.
- Índice Supabase: `(user_id, date(finalizado_em))` para queries mensais.

**Entregável Fase 1:** treino finalizado gera linha rica no banco; APIs `fetchSessoesTreinoMes` retornam volume e código.

**Estimativa:** 2–3 PRs · ~400 linhas + migration.

---

## Fase 2 — Relatórios de saúde

**Objetivo:** gráficos e tabelas reais na aba Relatórios / Analytics.

### 2.1 Camada de analytics

- Arquivo: `frontend/src/lib/academyAnalytics.ts`
- Funções:
  - `sessionsPerWeek(sessoes, refDate)` → `AnalyticsChartRow[]` para `ExerciseBarChart`
  - `maxLoadByExercise(sessoes, month)` → série temporal por exercício
  - `monthlyPRs(sessoes, month)` → `{ exercicio, carga_kg, data }[]`
  - `trainingHeatmap(sessoes, year)` → `{ date, count, volume }[]`
  - `consistencyPct(sessoes, days)` → % dias com treino

### 2.2 Substituir mock

- `analyticsMockData.ts` → `buildAnalyticsBundle(store, timeframe)` lendo store + Supabase.
- `DashboardAnalyticsPanel` e futura seção Saúde em `RelatoriosView`.

### 2.3 Componentes novos

| Componente | Dados |
|------------|-------|
| `ExerciseBarChart` (existente) | minutos/semana reais |
| `AcademyLoadTrendChart` (novo) | carga máxima/mês por exercício |
| `AcademyPRTable` (novo) | PRs do mês |
| `AcademyHeatmap` (novo) | dias treinados |

### 2.4 Relatórios View

- Nova aba **Saúde & Academia** em `RelatoriosView` ou seção em `DashboardAnalyticsPanel`.
- Filtro 7d / 30d / 6m (reutilizar `AnalyticsTimeframe`).

**Entregável Fase 2:** usuário vê desempenho mensal sem sair do app.

**Estimativa:** 3 PRs · ~600 linhas.

---

## Fase 3 — Experiência premium

### 3.1 Progressive overload (+2,5 kg)

- `suggestNextLoad(exercicioId, historico, repsAlvo)` em `academyWorkouts.ts`
- Regra JEFIT-like: se últimas 2 sessões bateram `reps_alvo` com RPE ≤ 8 → `+2.5 kg` (halter) ou `+5 kg` (barra).
- Mostrar chip **“Sugerido: 32,5 kg”** no `AcademyModeView`.

### 3.2 Comparativo mês anterior

- `compareVolumeMonth(current, previous)` → `{ deltaPct, label }`
- Card: **“+12% volume vs março”** no histórico da academia.

### 3.3 Correlação humor × treino

- Estender `wellbeingAnalytics.ts`:
  - Cruzar `treinoPorDia` com `humorSemanaAgregado`.
  - Scatter ou tabela: dias com treino vs humor médio.
- Painel em Relatórios Bem-estar.

**Entregável Fase 3:** app sugere carga e explica tendência.

**Estimativa:** 2 PRs · ~350 linhas.

---

## Fase 4 — Resumo mensal (Groq opcional)

### 4.1 Pipeline

1. `buildAcademyMonthFacts(userId, month)` → JSON factual (volume, PRs, faltas, top exercícios).
2. Edge function `academy-month-summary` ou rota existente Jarvis.
3. Prompt Groq: **só narrar fatos do JSON** — proibir inventar números.
4. Cache em `workspace_prefs` ou tabela `relatorios_cache`.

### 4.2 UI

- Botão **“Resumo AXEL do mês”** na aba histórico da academia.
- Fallback offline: template estático com os mesmos fatos.

**Entregável Fase 4:** texto humano mensal sem alucinação.

**Estimativa:** 1 PR backend + 1 PR frontend.

---

## Ordem de execução recomendada

```
Fase 1.1 migration
  → 1.2 códigos treino
  → 1.3 finalizar com detalhe
  → 1.4 volume
Fase 2.1 analytics lib
  → 2.2 wire charts
  → 2.3–2.4 UI relatórios
Fase 3.1 overload
  → 3.2 comparativo
  → 3.3 humor×treino
Fase 4 Groq (quando 1–3 estáveis)
```

Paralelo (prioridade UX): **cache ritual saúde** (água/humor/meds) — ver `healthRitualCache.ts`.

---

## Critérios de aceite globais

- [ ] Finalizar treino grava JSON auditável no Supabase
- [ ] Relatório 30d mostra sessões/semana com dados reais
- [ ] PR e heatmap batem com sessões do mês
- [ ] Sugestão de carga aparece após 2 sessões consistentes
- [ ] Dashboard não “pisca” ritual vazio após F5
- [ ] Groq (se ativo) só reformula fatos já calculados

---

## Referências de produto

- **Hevy / Strong:** log set×rep×kg, gráficos de progressão, PRs
- **JEFIT:** progressive overload, volume tracking, biblioteca grande
- **Fitbod:** programação automática (futuro, fora deste roadmap)
