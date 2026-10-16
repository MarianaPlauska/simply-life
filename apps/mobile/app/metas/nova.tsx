import { useMemo, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import {
  SHARED_GOAL_BODY_PRESETS,
  SHARED_GOAL_DURATIONS,
  SHARED_GOAL_METRICAS,
  diffDaysIso,
  localTodayIso,
  sharedGoalAlvoLabel,
  sharedGoalDuration,
  sharedGoalMetricaSpec,
  validateSharedGoalDraft,
  type SharedGoalDraft,
  type SharedGoalDurationKey,
  type SharedGoalExibicao,
  type SharedGoalMetrica,
  type SharedGoalModo,
  type SharedGoalPreset,
} from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, Field, Icon, PressableScale } from '../../src/ui'
import { DateField } from '../../src/ui/DateField'
import { StackHeader } from '../../src/components/layout/StackHeader'
import { SelectPill } from '../../src/components/sharedGoals/SelectPill'
import { GuestGoalsState } from '../../src/components/sharedGoals/GuestGoalsState'
import { SHARED_GOAL_METRIC_ICON } from '../../src/components/sharedGoals/metricIcon'
import { SugarLimitNote } from '../../src/components/sharedGoals/SugarLimitNote'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useSharedGoalsStore } from '../../src/store/sharedGoalsStore'
import { createSharedGoal } from '../../src/lib/sync/sharedGoals'
import { goalHref } from '../../src/lib/sharedGoalRoutes'

function formatNumber(n: number): string
{
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10).replace('.', ',')
}

function suggestedAlvo(metrica: SharedGoalMetrica, days: number, modo: SharedGoalModo, preset?: SharedGoalPreset | null): number
{
  const spec = sharedGoalMetricaSpec(metrica)
  const weeks = Math.max(1, Math.round(days / 7))
  const people = modo === 'pote' ? 2 : 1
  const base = preset ? preset.alvoSemana * weeks : spec.alvoSemana * weeks * people
  // nunca mais do que cabe no período (ex.: 5 dias numa semana que só tem 4)
  const capped = Math.min(base, days * spec.maxPorDia * people)
  return spec.step >= 25 ? Math.max(spec.step, Math.round(capped / spec.step) * spec.step) : Math.max(1, Math.round(capped))
}

export default function NovaMetaScreen()
{
  const { colors, space, radius, mode } = useTheme()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const load = useSharedGoalsStore((s) => s.load)
  const today = useMemo(() => localTodayIso(), [])

  const [metrica, setMetrica] = useState<SharedGoalMetrica>('agua')
  const [presetKey, setPresetKey] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [unidade, setUnidade] = useState('')
  const [modo, setModo] = useState<SharedGoalModo>('pote')
  const [exibicao, setExibicao] = useState<SharedGoalExibicao>('faixas')
  const [duracao, setDuracao] = useState<SharedGoalDurationKey>('esta_semana')
  // datas escolhidas (AAAA-MM-DD); vazio = ainda não escolhida
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [alvoTxt, setAlvoTxt] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const spec = sharedGoalMetricaSpec(metrica)
  const custom = duracao === 'datas'
    ? {
        inicio: inicio || today,
        fim,
      }
    : undefined
  const period = sharedGoalDuration(duracao, today, custom && custom.fim ? { inicio: custom.inicio, fim: custom.fim } : undefined)
  const days = period.fim ? diffDaysIso(period.inicio, period.fim) + 1 : 7
  // o atalho vale enquanto a pessoa não troca a métrica ou o jeito de contar
  const preset = SHARED_GOAL_BODY_PRESETS.find((p) => p.key === presetKey && p.metrica === metrica && p.modo === modo) ?? null
  const autoAlvo = suggestedAlvo(metrica, days, modo, preset)
  const alvo = alvoTxt == null ? autoAlvo : Number(alvoTxt.replace(',', '.'))
  const unit = metrica === 'livre' ? unidade.trim() : spec.unidade
  const nomeSugerido = metrica === 'livre' ? '' : preset ? preset.label : `${spec.label} juntos`

  const draft: SharedGoalDraft = {
    titulo: titulo.trim() || nomeSugerido,
    metrica,
    unidade: unit,
    alvo,
    modo,
    exibicao,
    inicio: period.inicio,
    fim: period.fim,
    ciclo: period.ciclo,
  }

  if (!userId) return <Redirect href="/login" />

  const applyPreset = (p: SharedGoalPreset) =>
  {
    setPresetKey(p.key)
    setMetrica(p.metrica)
    setModo(p.modo)
    setExibicao(p.exibicao)
    setAlvoTxt(null)
    setErr(null)
  }

  const bump = (dir: 1 | -1) =>
  {
    const next = Math.max(spec.step, (Number.isFinite(alvo) ? alvo : autoAlvo) + dir * spec.step)
    setAlvoTxt(formatNumber(next))
  }

  const submit = async () =>
  {
    if (duracao === 'datas' && (!inicio || !fim))
    {
      setErr('Escolha o dia em que a meta começa e o dia em que termina')
      return
    }
    if (duracao === 'datas' && fim < inicio)
    {
      setErr('O dia do fim vem antes do começo')
      return
    }
    const invalid = validateSharedGoalDraft(draft)
    if (invalid)
    {
      setErr(invalid)
      return
    }
    setErr(null)
    setBusy(true)
    const r = await createSharedGoal(draft)
    setBusy(false)
    if (!r.ok || !r.goal_id)
    {
      setErr(r.message ?? 'Não deu para criar agora')
      return
    }
    void load()
    router.replace(goalHref(String(r.goal_id), { convidar: true }))
  }

  if (isGuest)
  {
    return (
      <Screen scroll tabBarInset={false}>
        <StackHeader title="Nova meta" />
        <GuestGoalsState />
      </Screen>
    )
  }

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Nova meta" subtitle="De 2 a 5 pessoas, por link" />

      <View style={{ gap: space.md }}>
        <Card style={{ gap: space.sm }}>
          <Text variant="section">Cuidar do corpo juntos</Text>
          <Text variant="caption" muted>
            Um toque e está pronto. Cada um conta pelo que já anota no app, e ninguém vê o número de ninguém.
          </Text>
          <View style={{ gap: space.sm }}>
            {SHARED_GOAL_BODY_PRESETS.map((p) =>
            {
              const on = preset?.key === p.key
              const fg = on ? (mode === 'dark' ? colors.chrome : colors.onBrand) : colors.ink
              return (
                <PressableScale
                  key={p.key}
                  onPress={() => applyPreset(p)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${p.label}. ${p.hint}`}
                  style={{
                    minHeight: 56,
                    paddingHorizontal: space.md,
                    paddingVertical: space.sm,
                    borderRadius: radius.control,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                    backgroundColor: on ? (mode === 'dark' ? colors.brandInk : colors.brand) : colors.elevated,
                  }}
                >
                  <Icon name={SHARED_GOAL_METRIC_ICON[p.metrica]} size={22} color={fg} />
                  <View style={{ flex: 1 }}>
                    <Text variant="label" color={fg}>
                      {p.label}
                    </Text>
                    <Text variant="caption" color={on ? fg : colors.inkMuted}>
                      {p.hint}
                    </Text>
                  </View>
                  {on ? <Icon name="checkmark" size={18} color={fg} /> : null}
                </PressableScale>
              )
            })}
          </View>
        </Card>

        <Card style={{ gap: space.sm }}>
          <Text variant="section">O quê</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {SHARED_GOAL_METRICAS.map((m) => (
              <SelectPill
                key={m.key}
                label={m.label}
                icon={SHARED_GOAL_METRIC_ICON[m.key]}
                active={metrica === m.key}
                onPress={() =>
                {
                  setMetrica(m.key)
                  setPresetKey(null)
                  setAlvoTxt(null)
                }}
              />
            ))}
          </View>
          <Text variant="caption" muted>
            {spec.hint}
          </Text>
          {metrica === 'acucar_ok' ? <SugarLimitNote /> : null}
          {metrica === 'livre' ? (
            <Field
              label="O que vão contar"
              value={unidade}
              onChangeText={setUnidade}
              maxLength={24}
              placeholder="páginas, minutos de caminhada, dias sem tela"
            />
          ) : null}
          <Field
            label="Nome da meta"
            value={titulo}
            onChangeText={setTitulo}
            maxLength={60}
            placeholder={nomeSugerido || 'Ler juntos'}
          />
        </Card>

        <Card style={{ gap: space.sm }}>
          <Text variant="section">Como conta</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            <SelectPill
              label="Pote juntos"
              hint="Todos somam para um total."
              active={modo === 'pote'}
              onPress={() =>
              {
                setModo('pote')
                setAlvoTxt(null)
              }}
            />
            <SelectPill
              label="Cada um a sua"
              hint="Cada pessoa tem a própria meta."
              active={modo === 'cada_um'}
              onPress={() =>
              {
                setModo('cada_um')
                setAlvoTxt(null)
              }}
            />
          </View>
        </Card>

        <Card style={{ gap: space.sm }}>
          <Text variant="section">Por quanto tempo</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {SHARED_GOAL_DURATIONS.map((d) => (
              <SelectPill
                key={d.key}
                label={d.label}
                active={duracao === d.key}
                onPress={() =>
                {
                  setDuracao(d.key)
                  setAlvoTxt(null)
                }}
              />
            ))}
          </View>
          {duracao === 'datas' ? (
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <DateField label="Começa" value={inicio} min={today} onChange={setInicio} />
              </View>
              <View style={{ flex: 1 }}>
                <DateField label="Termina" value={fim} min={inicio || today} onChange={setFim} />
              </View>
            </View>
          ) : null}
          {duracao === 'sem_fim' ? (
            <Text variant="caption" muted>
              Sem data para acabar. A meta recomeça a cada 7 dias, e cada semana conta sozinha.
            </Text>
          ) : null}
        </Card>

        <Card style={{ gap: space.sm }}>
          <Text variant="section">Quanto</Text>
          <Text variant="caption" muted>
            {modo === 'pote'
              ? period.ciclo === 'semanal' ? 'Somando todo mundo, em cada semana' : 'Somando todo mundo, no período todo'
              : period.ciclo === 'semanal' ? 'Para cada pessoa, em cada semana' : 'Para cada pessoa, no período todo'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Diminuir"
              onPress={() => bump(-1)}
              style={{ width: 48, height: 48, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.elevated }}
            >
              <Icon name="remove" size={20} color={colors.ink} />
            </Pressable>
            <TextInput
              value={alvoTxt ?? formatNumber(autoAlvo)}
              onChangeText={(t) => setAlvoTxt(t.replace(/[^0-9.,]/g, ''))}
              keyboardType="decimal-pad"
              accessibilityLabel="Alvo"
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: radius.control,
                backgroundColor: colors.elevated,
                color: colors.ink,
                textAlign: 'center',
                fontFamily: 'Lexend_600SemiBold',
                fontSize: 20,
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Aumentar"
              onPress={() => bump(1)}
              style={{ width: 48, height: 48, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.elevated }}
            >
              <Icon name="add" size={20} color={colors.ink} />
            </Pressable>
          </View>
          <Text variant="caption" style={{ textAlign: 'center' }}>
            {Number.isFinite(alvo) && alvo > 0 ? sharedGoalAlvoLabel({ ...draft, alvo }) : ' '}
          </Text>
        </Card>

        <Card style={{ gap: space.sm }}>
          <Text variant="section">Como o progresso aparece</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            <SelectPill
              label="Faixas"
              hint="O pote enche em quartos."
              active={exibicao === 'faixas'}
              onPress={() => setExibicao('faixas')}
            />
            <SelectPill
              label="Só o ritmo"
              hint="No ritmo, atrás ou à frente."
              active={exibicao === 'ritmo'}
              onPress={() => setExibicao('ritmo')}
            />
          </View>
          <Text variant="caption" muted>
            Nunca aparece número exato. Numa dupla, o total entregaria o número do outro.
          </Text>
        </Card>

        {err ? (
          <Text variant="caption" color={colors.danger}>
            {err}
          </Text>
        ) : null}

        <PrimaryButton label="Criar e chamar pessoas" loading={busy} onPress={() => void submit()} />
      </View>
    </Screen>
  )
}
