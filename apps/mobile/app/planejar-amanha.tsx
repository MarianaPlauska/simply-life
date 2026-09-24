import { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  ANXIETY_LABELS,
  CARRY_LABELS,
  DAY_PLAN_MODE_COPY,
  addDaysIso,
  applyTaskMeta,
  buildTomorrowPlan,
  carryOverTasks,
  defaultCarryDecision,
  describeDayPt,
  formatHourPt,
  formatMinutesPt,
  localTodayIso,
  planModeFor,
  stampTaskSidecar,
  type AnxietyLevel,
  type CarryDecision,
  type EveningCheckin,
  type PlanItem,
  type TaskEnergy,
  type TaskPromptDraft,
  type TomorrowPlan,
} from '@simply-life/shared'
import { Screen, Text, Card, Field, PrimaryButton } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { MoodFaceRow } from '../src/components/MoodFace'
import { SelectChip } from '../src/components/CaptureTaskForm'
import { CrisisSupportCard } from '../src/components/health/CrisisSupportCard'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useDataStore } from '../src/store/dataStore'
import { usePlanLogStore } from '../src/store/planLogStore'
import { useCalendarStore } from '../src/store/calendarStore'
import { useOrchestratorContext } from '../src/components/TaskPromptComposer'
import { readTaskPromptLocally, refineTaskPromptWithAi } from '../src/lib/taskPromptApi'
import { insertDecisionEvents } from '../src/lib/sync/decisionLog'
import { scheduleMorningFirstStep } from '../src/lib/pushNotifications'
import { safeBack } from '../src/lib/safeBack'
import { hapticLight } from '../src/lib/haptics'

const STEPS = ['Como você está', 'Amanhã', 'Seu plano', 'Pronto'] as const
const ENERGY: { id: TaskEnergy; label: string }[] = [
  { id: 'baixa', label: 'Pouca' },
  { id: 'media', label: 'Média' },
  { id: 'alta', label: 'Boa' },
]
const REMINDER_HOURS = [20, 21, 22]

/** Ritual da noite: o Axel deixa o amanhã do tamanho certo. */
export default function PlanTomorrowScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const humor = useDataStore((s) => s.humor) ?? []
  const source = useDataStore((s) => s.source)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const addTask = useDataStore((s) => s.addTask)
  const patchTask = useDataStore((s) => s.patchTask)
  const setTaskStatus = useDataStore((s) => s.setTaskStatus)
  const addHumor = useDataStore((s) => s.addHumor)
  const hydrateLog = usePlanLogStore((s) => s.hydrate)
  const savePlan = usePlanLogStore((s) => s.savePlan)
  const parkWorries = usePlanLogStore((s) => s.parkWorries)
  const reminder = usePlanLogStore((s) => s.reminder)
  const setReminder = usePlanLogStore((s) => s.setReminder)
  const ctx = useOrchestratorContext()
  const calendarEvents = useCalendarStore((s) => s.events)

  const today = localTodayIso()
  const tomorrow = addDaysIso(today, 1)
  const moodToday = [...humor].reverse().find((h) => h.data?.slice(0, 10) === today)?.humor ?? null

  const [step, setStep] = useState(0)
  const [checkin, setCheckin] = useState<EveningCheckin>({ mood: moodToday, energia: 'media', ansiedade: 1 })
  const [worriesText, setWorriesText] = useState('')
  const [carry, setCarry] = useState<Record<string, CarryDecision>>({})
  const [promptText, setPromptText] = useState('')
  const [drafts, setDrafts] = useState<TaskPromptDraft[]>([])
  const [refining, setRefining] = useState(false)
  const [lighter, setLighter] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<TomorrowPlan | null>(null)
  const alive = useRef(true)

  useEffect(() =>
  {
    void hydrateLog()
    // aberto direto pela notificação: garante os dados carregados
    if (source === 'idle') void refreshAll({ isGuest })
    return () =>
    {
      alive.current = false
    }
  }, [hydrateLog, source, refreshAll, isGuest])

  const mode = planModeFor(checkin)
  const carryList = useMemo(() => carryOverTasks(tasks), [tasks])
  const alreadyTomorrow = useMemo(
    () => tasks.filter((t) => t.status !== 'done' && t.dataVencimento?.slice(0, 10) === tomorrow),
    [tasks, tomorrow],
  )
  const plan = useMemo(
    () => buildTomorrowPlan({ tasks, drafts, carry, checkin, ctx, lighter, events: calendarEvents }),
    [tasks, drafts, carry, checkin, ctx, lighter, calendarEvents],
  )

  const addFromPrompt = async () =>
  {
    const text = promptText.trim()
    if (text.length < 2) return
    const local = readTaskPromptLocally(text, ctx.promptCtx)
    // sem data = amanhã (é o ritual de amanhã); "quando der" continua sem data
    const withTomorrow = (list: TaskPromptDraft[]) => list.map((d) =>
      (d.dataVencimento || d.prioridade === 3 ? d : { ...d, dataVencimento: tomorrow }))
    const localDrafts = withTomorrow(local.drafts)
    setDrafts((prev) => [...prev, ...localDrafts])
    setPromptText('')
    hapticLight()
    if (isGuest) return
    setRefining(true)
    const refined = await refineTaskPromptWithAi(text, ctx.promptCtx, local, { isGuest })
    if (!alive.current) return
    setRefining(false)
    if (refined.source !== 'local')
    {
      const keys = new Set(localDrafts.map((d) => d.key))
      setDrafts((prev) => [...prev.filter((d) => !keys.has(d.key)), ...withTomorrow(refined.drafts)])
    }
  }

  const confirm = async () =>
  {
    setSaving(true)
    setError(null)
    try
    {
      const created = new Map<string, string>() // draftKey → taskId
      const createDraft = async (d: TaskPromptDraft, due: string | null) =>
      {
        const notas = applyTaskMeta(
          stampTaskSidecar(d.descricao, { financeiro: d.financeiro, energia: d.energia, prazoRigido: d.prazoRigido }),
          d.listId,
          null,
        )
        await addTask(d.titulo, isGuest, notas, {
          dataVencimento: due,
          horaMinutos: d.horaMinutos,
          estimativaMinutos: d.estimativaMinutos,
          prioridade: d.prioridade,
          checklist: d.checklist,
        })
        const newest = useDataStore.getState().tasks[0]
        if (newest) created.set(d.key, newest.id)
      }
      const draftByKey = new Map(drafts.map((d) => [d.key, d]))
      const placeOnDay = async (item: PlanItem, day: string) =>
      {
        if (item.draftKey)
        {
          const d = draftByKey.get(item.draftKey)
          if (d) await createDraft(d, day)
          return
        }
        const t = tasks.find((x) => x.id === item.taskId)
        if (t && t.dataVencimento?.slice(0, 10) !== day)
        {
          await patchTask(t.id, { dataVencimento: day }, isGuest)
        }
      }

      for (const i of [...plan.compromissos, ...plan.essentials, ...plan.ifEnergy]) await placeOnDay(i, tomorrow)
      for (const l of plan.later) await placeOnDay(l.item, l.to)
      // rascunhos com data própria (depois de amanhã) e "quando der"
      const placed = new Set([...plan.compromissos, ...plan.essentials, ...plan.ifEnergy, ...plan.later.map((l) => l.item)]
        .map((i) => i.draftKey).filter(Boolean))
      for (const d of drafts)
      {
        if (!placed.has(d.key)) await createDraft(d, d.dataVencimento)
      }
      // o que ficou de hoje: já fiz / soltar (nada é apagado: soltar vai para Intenções)
      for (const t of carryList)
      {
        const decision = carry[t.id] ?? defaultCarryDecision(t, mode)
        if (decision === 'feito') await setTaskStatus(t.id, 'done', isGuest)
        if (decision === 'soltar') await patchTask(t.id, { dataVencimento: null }, isGuest)
      }

      const idOf = (i: PlanItem) => i.taskId ?? (i.draftKey ? created.get(i.draftKey) ?? null : null)
      const worries = worriesText.split(/\n+/).map((w) => w.trim()).filter(Boolean)
      parkWorries(worries)
      if (checkin.mood != null && moodToday == null) await addHumor(checkin.mood, undefined, isGuest)

      await savePlan({
        date: tomorrow,
        mode: plan.mode,
        mood: checkin.mood,
        energy: checkin.energia,
        anxiety: checkin.ansiedade,
        essentialIds: plan.essentials.map(idOf).filter((x): x is string => Boolean(x)),
        plannedIds: [...plan.compromissos, ...plan.essentials, ...plan.ifEnergy]
          .map(idOf).filter((x): x is string => Boolean(x)),
        capacityMin: plan.capacity,
        plannedMin: plan.plannedMinutes,
        worriesCount: worries.length,
        createdAt: new Date().toISOString(),
      })

      if (!isGuest)
      {
        const batchId = crypto_uuid()
        void insertDecisionEvents(plan.later
          .filter((l) => l.item.taskId)
          .map((l) => ({
            taskId: l.item.taskId!,
            kind: 'deferred_load' as const,
            rationale: `Plano da noite: ${l.reason}`,
            batchId,
            trigger: 'evening',
            from: tasks.find((t) => t.id === l.item.taskId)?.dataVencimento ?? null,
            to: l.to,
          })))
      }

      const firstItem = firstPlanItem(plan)
      const firstStep = firstItem ? `${firstItem.titulo}: ${firstItem.firstStep}` : plan.selfCare
      if (reminder.enabled)
      {
        const [y, m, d] = tomorrow.split('-').map(Number)
        void scheduleMorningFirstStep(new Date(y, m - 1, d, 8, 30), firstStep)
      }
      setApplied(plan)
      setStep(3)
    }
    catch (e)
    {
      setError(e instanceof Error ? e.message : 'Não consegui salvar o plano. Tente de novo.')
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Planejar amanhã" subtitle="Um amanhã do tamanho certo, com pausas" />
      <View style={{ gap: space.md }}>
        <StepDots step={step} />

        {step === 0 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Como você está chegando ao fim do dia?</Text>
            <MoodFaceRow value={checkin.mood} onChange={(mood) => setCheckin({ ...checkin, mood })} />
            <View style={{ gap: 6 }}>
              <Text variant="caption" muted>Energia que você espera ter amanhã</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ENERGY.map((e) => (
                  <SelectChip
                    key={e.id}
                    label={e.label}
                    active={checkin.energia === e.id}
                    onPress={() => setCheckin({ ...checkin, energia: e.id })}
                  />
                ))}
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <Text variant="caption" muted>Sua cabeça está acelerada?</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {([0, 1, 2, 3] as AnxietyLevel[]).map((a) => (
                  <SelectChip
                    key={a}
                    label={ANXIETY_LABELS[a]}
                    active={checkin.ansiedade === a}
                    onPress={() => setCheckin({ ...checkin, ansiedade: a })}
                  />
                ))}
              </View>
            </View>
            <Field
              tone="sand"
              label="Algo te preocupando? Estacione aqui (opcional)"
              placeholder="Uma preocupação por linha. Fica guardada só neste aparelho; amanhã você decide o que fazer com ela."
              multiline
              value={worriesText}
              onChangeText={setWorriesText}
              style={{ minHeight: 90, textAlignVertical: 'top', paddingTop: 14 }}
            />
            <ModeBadge mode={mode} />
            <PrimaryButton label="Continuar" onPress={() => setStep(1)} />
          </Card>
        ) : null}

        {step === 1 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">O que tem para amanhã?</Text>
            {alreadyTomorrow.length ? (
              <View style={{ gap: 4 }}>
                <Text variant="caption" muted>Já está em {describeDayPt(tomorrow).toLowerCase()}</Text>
                {alreadyTomorrow.map((t) => (
                  <Text key={t.id} variant="body" style={{ fontSize: 14 }}>
                    · {t.titulo}{t.horaMinutos != null ? ` (${formatHourPt(t.horaMinutos)})` : ''}
                  </Text>
                ))}
              </View>
            ) : null}

            {carryList.length ? (
              <View style={{ gap: 10 }}>
                <Text variant="caption" muted>
                  Ficou de hoje. Tudo bem: escolha o que fazer com cada uma.
                </Text>
                {carryList.map((t) =>
                {
                  const decision = carry[t.id] ?? defaultCarryDecision(t, mode)
                  return (
                    <View key={t.id} style={{ gap: 6 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 14 }}>{t.titulo}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {(Object.keys(CARRY_LABELS) as CarryDecision[]).map((c) => (
                          <SelectChip
                            key={c}
                            label={CARRY_LABELS[c]}
                            active={decision === c}
                            onPress={() => setCarry({ ...carry, [t.id]: c })}
                          />
                        ))}
                      </View>
                    </View>
                  )
                })}
                <Text variant="micro" muted>“Soltar” não apaga: guarda em Intenções, sem data.</Text>
              </View>
            ) : null}

            <Field
              tone="sand"
              label="Mais alguma coisa para amanhã?"
              placeholder="Escreva solto: ligar pro dentista, comprar remédio, estudar 1h..."
              multiline
              value={promptText}
              onChangeText={setPromptText}
              style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: 14 }}
            />
            <PrimaryButton
              label="Adicionar"
              variant="secondary"
              size="sm"
              disabled={promptText.trim().length < 2}
              onPress={() => void addFromPrompt()}
            />
            {refining ? <Text variant="caption" muted>A IA do Axel está refinando…</Text> : null}
            {drafts.map((d) => (
              <View key={d.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text variant="body" style={{ flex: 1, fontSize: 14 }}>
                  + {d.titulo} · {formatMinutesPt(d.estimativaMinutos)}
                  {d.dataVencimento && d.dataVencimento !== tomorrow ? ` · ${describeDayPt(d.dataVencimento)}` : ''}
                </Text>
                <Pressable
                  onPress={() => setDrafts(drafts.filter((x) => x.key !== d.key))}
                  accessibilityLabel={`Remover ${d.titulo}`}
                  hitSlop={10}
                >
                  <Ionicons name="close" size={18} color={colors.inkMuted} />
                </Pressable>
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PrimaryButton label="Voltar" variant="ghost" onPress={() => setStep(0)} style={{ flex: 1 }} />
              <PrimaryButton label="Montar meu amanhã" onPress={() => setStep(2)} style={{ flex: 2 }} />
            </View>
          </Card>
        ) : null}

        {step === 2 ? (
          <View style={{ gap: space.md }}>
            <Card tone="elevated" style={{ gap: space.sm }}>
              <ModeBadge mode={plan.mode} />
              <Text variant="body">{plan.message}</Text>
              <CapacityMeter planned={plan.plannedMinutes} capacity={plan.capacity} />
            </Card>

            {plan.showSupport ? <CrisisSupportCard compact /> : null}

            {plan.compromissos.length ? (
              <Card tone="elevated" style={{ gap: 8 }}>
                <Text variant="caption" muted>Compromissos</Text>
                {plan.compromissos.map((i) => (
                  <Text key={i.key} variant="bodyStrong" style={{ fontSize: 14 }}>
                    {formatHourPt(i.hora ?? 0)} · {i.titulo}
                  </Text>
                ))}
              </Card>
            ) : null}

            <Card tone="elevated" style={{ gap: 12 }}>
              <Text variant="caption" muted>
                {plan.essentials.length === 0 ? 'Essenciais' : plan.essentials.length === 1 ? 'O essencial' : `Os ${plan.essentials.length} essenciais`}
              </Text>
              {plan.essentials.length === 0 ? (
                <Text variant="body">
                  {plan.compromissos.length
                    ? 'Nenhuma tarefa obrigatória além dos compromissos. Descansar também é plano.'
                    : 'Nada obrigatório amanhã. Descansar também é plano.'}
                </Text>
              ) : null}
              {plan.essentials.map((i) => (
                <View key={i.key} style={{ gap: 4, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: colors.axel }}>
                  <Text variant="bodyStrong">{i.titulo}</Text>
                  <Text variant="caption" muted>{i.why} · {formatMinutesPt(i.minutos)}</Text>
                  <Text variant="caption" color={colors.ink}>Primeiro passo: {i.firstStep}</Text>
                </View>
              ))}
              {plan.essentials.length > 1 ? (
                <PrimaryButton
                  label="Deixar mais leve"
                  variant="ghost"
                  size="sm"
                  onPress={() => setLighter(lighter + 1)}
                />
              ) : null}
            </Card>

            {plan.ifEnergy.length ? (
              <Card tone="elevated" style={{ gap: 6 }}>
                <Text variant="caption" muted>Só se sobrar energia (sem cobrança)</Text>
                {plan.ifEnergy.map((i) => (
                  <Text key={i.key} variant="body" style={{ fontSize: 14 }}>· {i.titulo}</Text>
                ))}
              </Card>
            ) : null}

            {plan.later.length ? (
              <Card tone="elevated" style={{ gap: 6 }}>
                <Text variant="caption" muted>Fica para depois, já com dia</Text>
                {plan.later.map((l) => (
                  <Text key={l.item.key} variant="body" style={{ fontSize: 14 }}>
                    · {l.item.titulo} → {describeDayPt(l.to)}
                  </Text>
                ))}
              </Card>
            ) : null}

            {plan.sequence.length ? (
              <Card tone="elevated" style={{ gap: 8 }}>
                <Text variant="caption" muted>Um jeito de encaixar o dia (horários são sugestão)</Text>
                {plan.sequence.map((s, idx) => (
                  <View key={`${s.kind}-${idx}`} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <Text variant="caption" muted style={{ width: 44 }}>{formatHourPt(s.inicio)}</Text>
                    <Ionicons
                      name={s.kind === 'pausa' ? 'cafe-outline' : s.kind === 'cuidado' ? 'heart-outline' : s.kind === 'compromisso' ? 'time-outline' : 'ellipse-outline'}
                      size={14}
                      color={s.kind === 'tarefa' ? colors.axel : colors.inkMuted}
                    />
                    <Text variant="body" style={{ flex: 1, fontSize: 14 }} muted={s.kind === 'pausa'}>
                      {s.label} · {formatMinutesPt(s.minutos)}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : null}

            {error ? <Text variant="caption" color={colors.danger}>{error}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PrimaryButton label="Voltar" variant="ghost" onPress={() => setStep(1)} style={{ flex: 1 }} />
              <PrimaryButton label="Confirmar plano" loading={saving} onPress={() => void confirm()} style={{ flex: 2 }} />
            </View>
          </View>
        ) : null}

        {step === 3 && applied ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Ionicons name="moon-outline" size={28} color={colors.axel} />
            <Text variant="section">Amanhã está organizado. Agora é descanso.</Text>
            <Text variant="body" muted>
              {firstPlanItem(applied)
                ? `Quando acordar, é só começar por: ${firstPlanItem(applied)!.firstStep.toLowerCase()}.`
                : 'Nada obrigatório amanhã. Cuide de você.'}
            </Text>
            {Platform.OS !== 'web' ? (
              <View style={{ gap: 6 }}>
                <Text variant="caption" muted>
                  Lembrete diário para planejar {reminder.enabled ? `(ativo às ${reminder.hour}h)` : '(desligado)'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {REMINDER_HOURS.map((h) => (
                    <SelectChip
                      key={h}
                      label={`${h}h`}
                      active={reminder.enabled && reminder.hour === h}
                      onPress={() => void setReminder({ enabled: true, hour: h, minute: 0 })}
                    />
                  ))}
                  <SelectChip
                    label="Sem lembrete"
                    active={!reminder.enabled}
                    onPress={() => void setReminder({ ...reminder, enabled: false })}
                  />
                </View>
              </View>
            ) : null}
            <PrimaryButton label="Respirar 1 minuto antes de dormir" variant="secondary" onPress={() => router.push('/calm/box-breathing')} />
            <PrimaryButton label="Ver meu ritmo da semana" variant="ghost" onPress={() => router.push('/ritmo')} />
            <PrimaryButton label="Fechar" variant="ghost" onPress={() => safeBack(router, '/(tabs)')} />
          </Card>
        ) : null}
      </View>
    </Screen>
  )
}

/** O primeiro item da sequência sugerida (a "vitória rápida" nos dias leves). */
function firstPlanItem(plan: TomorrowPlan): PlanItem | null
{
  const firstTask = plan.sequence.find((s) => s.kind === 'tarefa')
  return plan.essentials.find((e) => e.key === firstTask?.itemKey) ?? plan.essentials[0] ?? null
}

function crypto_uuid(): string
{
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) =>
  {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function StepDots({ step }: { step: number })
{
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }} accessibilityLabel={`Passo ${step + 1} de ${STEPS.length}: ${STEPS[step]}`}>
      {STEPS.map((label, i) => (
        <View
          key={label}
          style={{
            height: 6,
            flex: 1,
            borderRadius: 3,
            backgroundColor: i <= step ? colors.axel : colors.hairline,
          }}
        />
      ))}
    </View>
  )
}

function ModeBadge({ mode }: { mode: TomorrowPlan['mode'] })
{
  const { colors } = useTheme()
  const copy = DAY_PLAN_MODE_COPY[mode]
  const icon = mode === 'cuidado' ? 'heart' : mode === 'gentil' ? 'leaf-outline' : 'sunny-outline'
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <Ionicons name={icon} size={18} color={colors.axel} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{copy.label}</Text>
        <Text variant="caption" muted>{copy.hint}</Text>
      </View>
    </View>
  )
}

/** Medidor: quanto do seu tempo livre de amanhã já está ocupado. */
function CapacityMeter({ planned, capacity }: { planned: number; capacity: number })
{
  const { colors } = useTheme()
  const pct = Math.min(1, capacity ? planned / capacity : 0)
  const over = planned > capacity
  return (
    <View style={{ gap: 6 }} accessibilityLabel={`${formatMinutesPt(planned)} planejados de ${formatMinutesPt(capacity)} de tempo livre`}>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.hairline, overflow: 'hidden' }}>
        <View style={{ width: `${Math.round(pct * 100)}%`, height: 8, borderRadius: 4, backgroundColor: over ? colors.attention : colors.axel }} />
      </View>
      <Text variant="caption" muted>
        {formatMinutesPt(planned)} de {formatMinutesPt(capacity)} do seu tempo livre
        {over ? ' · passou um pouco por causa de prazo ou compromisso' : ''}
      </Text>
    </View>
  )
}
