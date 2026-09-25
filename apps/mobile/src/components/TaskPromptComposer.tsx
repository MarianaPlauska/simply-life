import { useEffect, useMemo, useRef, useState } from 'react'
import { View, ScrollView, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  applyTaskMeta,
  busyMinutesByDay,
  describeDayPt,
  formatBRL,
  formatMinutesPt,
  parseBrlNumber,
  planTaskDrafts,
  selectedOption,
  stampTaskSidecar,
  summarizePlan,
  FINANCE_CATEGORY_LABELS,
  ORCHESTRATOR_STYLES,
  TASK_PROMPT_CATEGORIES,
  weekdayOfIso,
  type DraftPlan,
  type PlacementStrategy,
  type TaskEnergy,
  type TaskPromptDraft,
  type TaskSignal,
  type TaskStatus,
} from '@simply-life/shared'
import { Text, Field, PrimaryButton } from '../ui'
import { useTheme } from '../theme/ThemeProvider'
import { useDataStore } from '../store/dataStore'
import { useKanbanListsStore } from '../store/kanbanListsStore'
import { useAuthStore } from '../store/authStore'
import { useOrchestratorPrefsStore } from '../store/orchestratorPrefsStore'
import { readTaskPromptLocally, refineTaskPromptWithAi, type TaskPromptResult } from '../lib/taskPromptApi'
import { SelectChip } from './CaptureTaskForm'
import { buildOrchestratorContext, type FullOrchestratorContext } from '../lib/orchestratorContext'
import { useCalendarStore } from '../store/calendarStore'
import { useNeuroStore } from '../store/neuroStore'
import { useTimeLearning } from '../lib/timeLearning'
import { nextSalaryPayday, useSalaryStore } from '../store/salaryStore'

export type TaskPromptState = {
  prompt: string
  result: TaskPromptResult | null
  drafts: TaskPromptDraft[]
  chosen: Record<string, PlacementStrategy>
  excluded: Record<string, boolean>
  /** IA refinando a leitura local em segundo plano */
  refining: boolean
  /** usuário já mexeu nos cartões: a IA não sobrescreve, só oferece */
  touched: boolean
  /** leitura da IA que chegou depois de o usuário mexer */
  pendingAi: TaskPromptResult | null
}

export function emptyTaskPromptState(): TaskPromptState
{
  return {
    prompt: '',
    result: null,
    drafts: [],
    chosen: {},
    excluded: {},
    refining: false,
    touched: false,
    pendingAi: null,
  }
}

export type TaskPromptSaveItem = {
  titulo: string
  notas: string
  extra: {
    dataVencimento: string | null
    horaMinutos: number | null
    estimativaMinutos: number
    prioridade: 1 | 2 | 3
    status: TaskStatus
    checklist: string[]
  }
}

const CAPACITY_CHOICES = [120, 240, 360, 480]
const EFFORT_CHOICES = [5, 15, 30, 60, 90, 120, 180]
const ENERGY_LABEL: Record<TaskEnergy, string> = { baixa: 'Leve', media: 'Média', alta: 'Pesada' }
const WEEKDAY_LETTERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/** Contexto do orquestrador a partir dos stores (tarefas, humor, saldo, fixas, cartões). */
export function useOrchestratorContext(): FullOrchestratorContext
{
  const tasks = useDataStore((s) => s.tasks)
  const humor = useDataStore((s) => s.humor)
  const finance = useDataStore((s) => s.finance)
  const fixas = useDataStore((s) => s.contasFixas)
  const cards = useDataStore((s) => s.financeCards)
  const cash = useDataStore((s) => s.cashAccount)
  const lists = useKanbanListsStore((s) => s.lists)
  const style = useOrchestratorPrefsStore((s) => s.style)
  const capacityMinutes = useOrchestratorPrefsStore((s) => s.capacityMinutes)
  const calendarEvents = useCalendarStore((s) => s.events)
  const estimateFactor = useNeuroStore((s) => s.estimateFactor)
  const learning = useTimeLearning()
  const salary = useSalaryStore((s) => s.salary)

  return useMemo(
    () => buildOrchestratorContext({
      tasks,
      humor,
      finance,
      fixas,
      cards,
      cash,
      lists: lists.map((l) => ({ id: l.id, name: l.name })),
      style,
      capacityMinutes,
      busyByDay: busyMinutesByDay(calendarEvents),
      estimateFactor,
      learning,
      proximaReceitaIso: nextSalaryPayday(salary),
    }),
    [tasks, humor, finance, fixas, cards, cash, lists, style, capacityMinutes, calendarEvents, estimateFactor, learning, salary],
  )
}

/** Converte o estado do compositor em chamadas de addTask (só os incluídos). */
export function buildTaskPromptSaveItems(state: TaskPromptState, plans: DraftPlan[]): TaskPromptSaveItem[]
{
  const out: TaskPromptSaveItem[] = []
  for (const d of state.drafts)
  {
    if (state.excluded[d.key]) continue
    const plan = plans.find((p) => p.key === d.key)
    const opt = selectedOption(plan, state.chosen[d.key])
    const body = [d.descricao.trim(), d.recorrencia ? `Recorrência: ${d.recorrencia}` : '']
      .filter(Boolean)
      .join('\n')
    const withSidecar = stampTaskSidecar(body, {
      financeiro: d.financeiro,
      energia: d.energia,
      prazoRigido: d.prazoRigido,
    })
    out.push({
      titulo: d.titulo.trim(),
      notas: applyTaskMeta(withSidecar, d.listId, null),
      extra: {
        dataVencimento: opt ? opt.dataVencimento : d.dataVencimento,
        horaMinutos: opt ? opt.horaMinutos : d.horaMinutos,
        estimativaMinutos: d.estimativaMinutos,
        prioridade: d.prioridade,
        status: opt?.status ?? 'todo',
        checklist: opt?.checklist ?? d.checklist,
      },
    })
  }
  return out
}

function initialExclusions(drafts: TaskPromptDraft[]): Record<string, boolean>
{
  const ex: Record<string, boolean> = {}
  for (const d of drafts) if (d.duplicateOfId) ex[d.key] = true
  return ex
}

function sourceLabel(result: TaskPromptResult): string
{
  if (result.source === 'groq' || result.source === 'gemini') return 'Lido pela IA do Axel e conferido com seus dados'
  switch (result.localReason)
  {
    case 'guest':
      return 'Leitura local (entre na conta para usar a IA)'
    case 'quota':
      return 'Leitura local (cota de IA de hoje acabou)'
    case 'no_ai':
      return 'Leitura local (IA indisponível no servidor)'
    default:
      return 'Leitura local (sem conexão com a IA)'
  }
}

type Props = {
  state: TaskPromptState
  onChange: (next: TaskPromptState) => void
}

/** Captura por prompt solto: o Axel interpreta, propõe alternativas e sinaliza parâmetros. */
export function TaskPromptComposer({ state, onChange }: Props)
{
  const { colors } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const hydratePrefs = useOrchestratorPrefsStore((s) => s.hydrate)
  const style = useOrchestratorPrefsStore((s) => s.style)
  const capacityMinutes = useOrchestratorPrefsStore((s) => s.capacityMinutes)
  const patchPrefs = useOrchestratorPrefsStore((s) => s.patch)
  const ctx = useOrchestratorContext()
  const [editing, setEditing] = useState<string | null>(null)
  // o estado mais recente, para a resposta da IA (assíncrona) não usar um snapshot velho
  const stateRef = useRef(state)
  stateRef.current = state
  const runId = useRef(0)
  // fechou a captura: resposta tardia da IA é descartada
  useEffect(() => () =>
  {
    runId.current += 1
  }, [])

  useEffect(() =>
  {
    void hydratePrefs()
  }, [hydratePrefs])

  const plans = useMemo(
    () => planTaskDrafts(state.drafts, ctx, state.chosen),
    [state.drafts, ctx, state.chosen],
  )
  const summary = useMemo(
    () => summarizePlan(
      state.drafts.filter((d) => !state.excluded[d.key]),
      plans,
      ctx,
      state.chosen,
    ),
    [state.drafts, state.excluded, plans, ctx, state.chosen],
  )

  const applyResult = (base: TaskPromptState, result: TaskPromptResult, refining: boolean): TaskPromptState => ({
    ...base,
    result,
    drafts: result.drafts,
    chosen: {},
    excluded: initialExclusions(result.drafts),
    refining,
    touched: false,
    pendingAi: null,
  })

  /** 1) leitura local na hora · 2) IA refina em segundo plano */
  const organize = async () =>
  {
    const prompt = state.prompt.trim()
    if (prompt.length < 2) return
    const id = ++runId.current
    const local: TaskPromptResult = {
      ...readTaskPromptLocally(prompt, ctx.promptCtx),
      localReason: isGuest ? 'guest' : undefined,
    }
    onChange(applyResult(state, local, !isGuest))
    if (isGuest) return

    const refined = await refineTaskPromptWithAi(prompt, ctx.promptCtx, local, { isGuest })
    if (id !== runId.current) return // houve outra organização no meio
    const cur = stateRef.current
    if (refined.source === 'local')
    {
      onChange({ ...cur, refining: false, result: { ...(cur.result ?? local), localReason: refined.localReason } })
    }
    else if (cur.touched)
    {
      onChange({ ...cur, refining: false, pendingAi: refined })
    }
    else
    {
      onChange(applyResult(cur, refined, false))
    }
  }

  const patchDraft = (key: string, partial: Partial<TaskPromptDraft>) =>
  {
    onChange({
      ...state,
      touched: true,
      drafts: state.drafts.map((d) => (d.key === key ? { ...d, ...partial } : d)),
    })
  }

  const styleHint = ORCHESTRATOR_STYLES.find((s) => s.id === style)?.hint

  return (
    <View style={{ gap: 14 }}>
      <Field
        tone="sand"
        label="Descreva do seu jeito"
        placeholder="Ex: renovar o seguro do carro até sexta, custa uns 1800, e ligar pro dentista quando der"
        multiline
        value={state.prompt}
        onChangeText={(prompt) => onChange({ ...state, prompt })}
        style={{ minHeight: 110, textAlignVertical: 'top', paddingTop: 14 }}
      />

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Como o Axel organiza
        </Text>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {ORCHESTRATOR_STYLES.map((s) => (
              <SelectChip
                key={s.id}
                label={s.label}
                active={style === s.id}
                onPress={() =>
                {
                  patchPrefs({ style: s.id })
                  // troca de estilo recalcula a recomendação de todas
                  onChange({ ...state, chosen: {} })
                }}
              />
            ))}
          </View>
        </ScrollView>
        {styleHint ? (
          <Text variant="caption" muted>
            {styleHint}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Tempo livre para tarefas por dia
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CAPACITY_CHOICES.map((m) => (
            <SelectChip
              key={m}
              label={formatMinutesPt(m)}
              active={capacityMinutes === m}
              onPress={() => patchPrefs({ capacityMinutes: m })}
            />
          ))}
        </View>
      </View>

      <PrimaryButton
        label={state.drafts.length ? 'Reorganizar com Axel' : 'Organizar com Axel'}
        disabled={state.prompt.trim().length < 2}
        onPress={() => void organize()}
      />

      {state.result ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons
              name={state.result.source === 'local' ? 'hardware-chip-outline' : 'sparkles'}
              size={14}
              color={colors.axel}
            />
            <Text variant="caption" muted style={{ flex: 1 }}>
              {state.refining ? 'Leitura local pronta · a IA do Axel está refinando…' : sourceLabel(state.result)}
            </Text>
          </View>

          {state.pendingAi ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="caption" muted style={{ flex: 1 }}>
                A IA terminou uma leitura diferente. Seus ajustes foram mantidos.
              </Text>
              <PrimaryButton
                label="Usar leitura da IA"
                variant="ghost"
                size="sm"
                onPress={() => state.pendingAi && onChange(applyResult(state, state.pendingAi, false))}
              />
            </View>
          ) : null}

          {state.drafts.length === 0 ? (
            <Text variant="caption" muted>
              Não encontrei tarefas nesse texto. Tente começar com um verbo: “pagar”, “ligar”, “estudar”.
            </Text>
          ) : (
            <PlanSummaryStrip summary={summary} />
          )}

          {state.result.perguntas.map((q) => (
            <View key={q} style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
              <Ionicons name="help-circle-outline" size={16} color={colors.inkMuted} />
              <Text variant="caption" muted style={{ flex: 1 }}>
                {q}
              </Text>
            </View>
          ))}

          {state.drafts.map((d) => (
            <DraftCard
              key={d.key}
              draft={d}
              plan={plans.find((p) => p.key === d.key)}
              chosen={state.chosen[d.key]}
              included={!state.excluded[d.key]}
              editing={editing === d.key}
              lists={ctx.promptCtx.lists ?? []}
              onToggleInclude={() =>
                onChange({ ...state, touched: true, excluded: { ...state.excluded, [d.key]: !state.excluded[d.key] } })}
              onChoose={(strategy) =>
                onChange({ ...state, touched: true, chosen: { ...state.chosen, [d.key]: strategy } })}
              onToggleEdit={() => setEditing(editing === d.key ? null : d.key)}
              onPatch={(partial) => patchDraft(d.key, partial)}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}

function PlanSummaryStrip({ summary }: { summary: ReturnType<typeof summarizePlan> })
{
  const { colors } = useTheme()
  const max = Math.max(...summary.dias.map((d) => Math.max(d.minutos, d.capacidade)), 1)
  const parts = [
    `${summary.count} ${summary.count === 1 ? 'tarefa' : 'tarefas'}`,
    formatMinutesPt(summary.totalMinutes),
    summary.gastosPrevistos > 0 ? `${formatBRL(summary.gastosPrevistos)} previstos` : null,
    summary.alertas > 0 ? `${summary.alertas} ${summary.alertas === 1 ? 'alerta' : 'alertas'}` : null,
  ].filter(Boolean)

  return (
    <View
      style={{
        gap: 10,
        padding: 12,
        borderRadius: 14,
        backgroundColor: colors.hairline,
      }}
    >
      <Text variant="bodyStrong" style={{ fontSize: 14 }}>
        {parts.join(' · ')}
      </Text>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 64 }}
        accessibilityLabel="Carga dos próximos 7 dias"
      >
        {summary.dias.map((d, i) =>
        {
          const over = d.minutos > d.capacidade
          const h = Math.max(3, Math.round((d.minutos / max) * 48))
          const capY = Math.round((d.capacidade / max) * 48)
          return (
            <View key={d.iso} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{ height: 48, width: '100%', justifyContent: 'flex-end' }}>
                <View
                  style={{
                    position: 'absolute',
                    bottom: capY,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: colors.inkFaint,
                  }}
                />
                <View
                  style={{
                    height: h,
                    borderRadius: 4,
                    backgroundColor: over ? colors.danger : colors.axel,
                    opacity: over ? 0.9 : 0.75,
                  }}
                />
              </View>
              <Text variant="micro" muted numberOfLines={1}>
                {i === 0 ? 'Hoje' : WEEKDAY_LETTERS[weekdayOfIso(d.iso)]}
              </Text>
            </View>
          )
        })}
      </View>
      <Text variant="micro" muted>
        Barras: carga com as novas tarefas · linha: seu tempo livre por dia
      </Text>
    </View>
  )
}

function SignalRow({ signal }: { signal: TaskSignal })
{
  const { colors } = useTheme()
  const color = signal.tone === 'danger' ? colors.danger : signal.tone === 'warn' ? colors.attention : colors.inkMuted
  const icon = signal.tone === 'danger' ? 'alert-circle' : signal.tone === 'warn' ? 'warning-outline' : 'information-circle-outline'
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
      <Ionicons name={icon} size={14} color={color} style={{ marginTop: 2 }} />
      <Text variant="caption" color={color} style={{ flex: 1 }}>
        {signal.label}
      </Text>
    </View>
  )
}

type DraftCardProps = {
  draft: TaskPromptDraft
  plan: DraftPlan | undefined
  chosen: PlacementStrategy | undefined
  included: boolean
  editing: boolean
  lists: { id: string; name: string }[]
  onToggleInclude: () => void
  onChoose: (strategy: PlacementStrategy) => void
  onToggleEdit: () => void
  onPatch: (partial: Partial<TaskPromptDraft>) => void
}

function DraftCard({
  draft,
  plan,
  chosen,
  included,
  editing,
  lists,
  onToggleInclude,
  onChoose,
  onToggleEdit,
  onPatch,
}: DraftCardProps)
{
  const { colors } = useTheme()
  const opt = selectedOption(plan, chosen)
  const [valorText, setValorText] = useState(
    draft.financeiro?.valor != null ? String(draft.financeiro.valor).replace('.', ',') : '',
  )
  const listName = lists.find((l) => l.id === draft.listId)?.name

  const meta = [
    formatMinutesPt(draft.estimativaMinutos),
    ENERGY_LABEL[draft.energia],
    draft.prioridade === 1 ? 'Prioridade alta' : draft.prioridade === 3 ? 'Sem pressa' : null,
    draft.financeiro?.valor != null
      ? `${formatBRL(draft.financeiro.valor)} · ${FINANCE_CATEGORY_LABELS[draft.financeiro.categoria] ?? draft.financeiro.categoria}`
      : draft.financeiro ? 'Envolve gasto' : null,
    listName ? `Pasta ${listName}` : null,
    draft.checklist.length ? `${draft.checklist.length} passos` : null,
  ].filter(Boolean)

  return (
    <View
      style={{
        gap: 10,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: included ? colors.hairlineStrong : colors.hairline,
        backgroundColor: colors.elevated,
        opacity: included ? 1 : 0.55,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <Pressable
          onPress={onToggleInclude}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: included }}
          accessibilityLabel={included ? 'Não criar esta tarefa' : 'Criar esta tarefa'}
          hitSlop={10}
          style={{ minWidth: 28, minHeight: 28, justifyContent: 'center' }}
        >
          <Ionicons
            name={included ? 'checkbox' : 'square-outline'}
            size={22}
            color={included ? colors.axel : colors.inkMuted}
          />
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="bodyStrong">{draft.titulo}</Text>
          <Text variant="caption" muted>
            {meta.join(' · ')}
          </Text>
        </View>
        <Pressable
          onPress={onToggleEdit}
          accessibilityRole="button"
          accessibilityLabel={editing ? 'Fechar ajustes' : 'Ajustar tarefa'}
          hitSlop={10}
          style={{ minWidth: 44, minHeight: 32, alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>
            {editing ? 'Pronto' : 'Ajustar'}
          </Text>
        </Pressable>
      </View>

      {plan && plan.options.length > 0 ? (
        <View style={{ gap: 8 }}>
          {/* key remonta a faixa quando as alternativas mudam, senão ela fica rolada no vazio */}
          <ScrollView
            key={plan.options.map((o) => o.strategy).join('|')}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
          >
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {plan.options.map((o) => (
                <SelectChip
                  key={o.strategy}
                  label={o.strategy === plan.recommended ? `★ ${o.label}` : o.label}
                  active={opt?.strategy === o.strategy}
                  onPress={() => onChoose(o.strategy)}
                />
              ))}
            </View>
          </ScrollView>
          {opt ? (
            <Text variant="caption" muted>
              {opt.rationale}
            </Text>
          ) : null}
        </View>
      ) : null}

      {plan?.signals.length ? (
        <View style={{ gap: 4 }}>
          {plan.signals.map((s) => (
            <SignalRow key={`${s.kind}-${s.label}`} signal={s} />
          ))}
        </View>
      ) : null}

      {editing ? (
        <View style={{ gap: 12, paddingTop: 4 }}>
          <Field
            tone="sand"
            label="Título"
            value={draft.titulo}
            onChangeText={(titulo) => onPatch({ titulo })}
          />
          <View style={{ gap: 6 }}>
            <Text variant="caption" muted>
              Quanto tempo leva
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {EFFORT_CHOICES.map((m) => (
                <SelectChip
                  key={m}
                  label={formatMinutesPt(m)}
                  active={draft.estimativaMinutos === m}
                  onPress={() => onPatch({ estimativaMinutos: m })}
                />
              ))}
            </View>
          </View>
          <View style={{ gap: 6 }}>
            <Text variant="caption" muted>
              Prioridade e energia
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {([1, 2, 3] as const).map((p) => (
                <SelectChip
                  key={`p${p}`}
                  label={p === 1 ? 'Alta' : p === 2 ? 'Média' : 'Sem pressa'}
                  tone={p === 1 ? 'danger' : 'axel'}
                  active={draft.prioridade === p}
                  onPress={() => onPatch({ prioridade: p })}
                />
              ))}
              {(['baixa', 'media', 'alta'] as const).map((e) => (
                <SelectChip
                  key={`e${e}`}
                  label={ENERGY_LABEL[e]}
                  active={draft.energia === e}
                  onPress={() => onPatch({ energia: e })}
                />
              ))}
            </View>
          </View>
          <View style={{ gap: 6 }}>
            <Text variant="caption" muted>
              Prazo {draft.dataVencimento ? describeDayPt(draft.dataVencimento).toLowerCase() : 'não definido'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <SelectChip
                label="Prazo firme"
                active={draft.prazoRigido}
                onPress={() => onPatch({ prazoRigido: !draft.prazoRigido })}
              />
              <SelectChip
                label="Sem prazo"
                active={!draft.dataVencimento}
                onPress={() => onPatch({ dataVencimento: null, prazoRigido: false, horaMinutos: null })}
              />
            </View>
          </View>
          <View style={{ gap: 6 }}>
            <Field
              tone="sand"
              label="Custo (R$)"
              placeholder="Deixe vazio se não envolve dinheiro"
              keyboardType="decimal-pad"
              value={valorText}
              onChangeText={(t) =>
              {
                setValorText(t)
                const valor = parseBrlNumber(t)
                if (!t.trim())
                {
                  onPatch({ financeiro: draft.financeiro ? { ...draft.financeiro, valor: null } : null })
                  return
                }
                onPatch({
                  financeiro: {
                    valor,
                    categoria: draft.financeiro?.categoria ?? 'outros',
                    tipo: draft.financeiro?.tipo ?? 'despesa',
                    fixaId: draft.financeiro?.fixaId ?? null,
                    cardId: draft.financeiro?.cardId ?? null,
                  },
                })
              }}
            />
            {draft.financeiro ? (
              <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {TASK_PROMPT_CATEGORIES.map((c) => (
                    <SelectChip
                      key={c}
                      label={FINANCE_CATEGORY_LABELS[c] ?? c}
                      active={draft.financeiro?.categoria === c}
                      onPress={() =>
                        onPatch({ financeiro: { ...draft.financeiro!, categoria: c } })}
                    />
                  ))}
                </View>
              </ScrollView>
            ) : null}
          </View>
          {lists.length ? (
            <View style={{ gap: 6 }}>
              <Text variant="caption" muted>
                Pasta
              </Text>
              <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <SelectChip label="Nenhuma" active={!draft.listId} onPress={() => onPatch({ listId: null })} />
                  {lists.map((l) => (
                    <SelectChip
                      key={l.id}
                      label={l.name}
                      active={draft.listId === l.id}
                      onPress={() => onPatch({ listId: l.id })}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : null}
          {draft.trecho && draft.trecho !== draft.titulo ? (
            <Text variant="micro" muted>
              Trecho original: “{draft.trecho}”
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
