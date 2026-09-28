import { useMemo, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import {
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
} from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, Field, Icon } from '../../src/ui'
import { StackHeader } from '../../src/components/layout/StackHeader'
import { SelectPill } from '../../src/components/sharedGoals/SelectPill'
import { GuestGoalsState } from '../../src/components/sharedGoals/GuestGoalsState'
import { SHARED_GOAL_METRIC_ICON } from '../../src/components/sharedGoals/metricIcon'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useSharedGoalsStore } from '../../src/store/sharedGoalsStore'
import { createSharedGoal } from '../../src/lib/sync/sharedGoals'
import { goalHref } from '../../src/lib/sharedGoalRoutes'

/** "05/10" ou "05/10/2026" para YYYY-MM-DD */
function parseDayMonth(text: string, today: string): string | null
{
  const m = text.trim().match(/^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?$/)
  if (!m) return null
  const d = Number(m[1])
  const mo = Number(m[2])
  let y = m[3] ? Number(m[3]) : Number(today.slice(0, 4))
  if (y < 100) y += 2000
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null
  const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  // sem ano: se já passou, é do ano que vem
  if (!m[3] && diffDaysIso(today, iso) < 0) return `${y + 1}${iso.slice(4)}`
  return iso
}

function formatNumber(n: number): string
{
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10).replace('.', ',')
}

function suggestedAlvo(metrica: SharedGoalMetrica, days: number, modo: SharedGoalModo): number
{
  const spec = sharedGoalMetricaSpec(metrica)
  const weeks = Math.max(1, Math.round(days / 7))
  const base = spec.alvoSemana * weeks * (modo === 'pote' ? 2 : 1)
  return spec.step >= 25 ? Math.round(base / spec.step) * spec.step : Math.round(base)
}

export default function NovaMetaScreen()
{
  const { colors, space, radius } = useTheme()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const load = useSharedGoalsStore((s) => s.load)
  const today = useMemo(() => localTodayIso(), [])

  const [metrica, setMetrica] = useState<SharedGoalMetrica>('agua')
  const [titulo, setTitulo] = useState('')
  const [unidade, setUnidade] = useState('')
  const [modo, setModo] = useState<SharedGoalModo>('pote')
  const [exibicao, setExibicao] = useState<SharedGoalExibicao>('faixas')
  const [duracao, setDuracao] = useState<SharedGoalDurationKey>('esta_semana')
  const [inicioTxt, setInicioTxt] = useState('')
  const [fimTxt, setFimTxt] = useState('')
  const [alvoTxt, setAlvoTxt] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const spec = sharedGoalMetricaSpec(metrica)
  const custom = duracao === 'datas'
    ? {
        inicio: parseDayMonth(inicioTxt, today) ?? today,
        fim: parseDayMonth(fimTxt, today) ?? '',
      }
    : undefined
  const period = sharedGoalDuration(duracao, today, custom && custom.fim ? { inicio: custom.inicio, fim: custom.fim } : undefined)
  const days = period.fim ? diffDaysIso(period.inicio, period.fim) + 1 : 7
  const autoAlvo = suggestedAlvo(metrica, days, modo)
  const alvo = alvoTxt == null ? autoAlvo : Number(alvoTxt.replace(',', '.'))
  const unit = metrica === 'livre' ? unidade.trim() : spec.unidade
  const nomeSugerido = metrica === 'livre' ? '' : `${spec.label} juntos`

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

  const bump = (dir: 1 | -1) =>
  {
    const next = Math.max(spec.step, (Number.isFinite(alvo) ? alvo : autoAlvo) + dir * spec.step)
    setAlvoTxt(formatNumber(next))
  }

  const submit = async () =>
  {
    if (duracao === 'datas' && (!parseDayMonth(inicioTxt, today) || !parseDayMonth(fimTxt, today)))
    {
      setErr('Escreva as datas como dia/mês, por exemplo 05/10')
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
                  setAlvoTxt(null)
                }}
              />
            ))}
          </View>
          <Text variant="caption" muted>
            {spec.hint}
          </Text>
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
              hint="Todos somam para um total"
              active={modo === 'pote'}
              onPress={() =>
              {
                setModo('pote')
                setAlvoTxt(null)
              }}
            />
            <SelectPill
              label="Cada um a sua"
              hint="Cada pessoa tem a própria meta"
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
                <Field label="Começa" value={inicioTxt} onChangeText={setInicioTxt} placeholder="dd/mm" keyboardType="numbers-and-punctuation" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Termina" value={fimTxt} onChangeText={setFimTxt} placeholder="dd/mm" keyboardType="numbers-and-punctuation" />
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
              hint="O pote enche em quartos"
              active={exibicao === 'faixas'}
              onPress={() => setExibicao('faixas')}
            />
            <SelectPill
              label="Só o ritmo"
              hint="No ritmo, atrás ou à frente"
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
