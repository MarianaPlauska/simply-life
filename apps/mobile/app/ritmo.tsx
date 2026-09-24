import { useEffect, useMemo, useState } from 'react'
import { Pressable, Share, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  DAY_PLAN_MODE_COPY,
  addDaysIso,
  buildRhythmReport,
  formatMinutesPt,
  localTodayIso,
  rhythmReportToText,
} from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { SelectChip } from '../src/components/CaptureTaskForm'
import { CrisisSupportCard } from '../src/components/health/CrisisSupportCard'
import { RhythmColumns, RhythmLine, StatTile } from '../src/components/rhythm/RhythmCharts'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useDataStore } from '../src/store/dataStore'
import { usePlanLogStore } from '../src/store/planLogStore'
import { useBoardReplanStore } from '../src/store/boardReplanStore'
import { fetchDecisionEvents } from '../src/lib/sync/decisionLog'
import { safeBack } from '../src/lib/safeBack'

const MOVE_KINDS = new Set(['rescued_overdue', 'deferred_load', 'pulled_forward'])

/** Meu ritmo: plano da noite × feito, humor e o que ajudou. Sem julgamento. */
export default function RhythmScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const humor = useDataStore((s) => s.humor) ?? []
  const source = useDataStore((s) => s.source)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const plans = usePlanLogStore((s) => s.plans)
  const completions = usePlanLogStore((s) => s.completions)
  const worries = usePlanLogStore((s) => s.worries)
  const resolveWorry = usePlanLogStore((s) => s.resolveWorry)
  const hydrateLog = usePlanLogStore((s) => s.hydrate)
  const lastBatch = useBoardReplanStore((s) => s.lastBatch)
  const [days, setDays] = useState<7 | 28>(7)
  const [remoteMoves, setRemoteMoves] = useState<number | null>(null)
  const [doneMetric, setDoneMetric] = useState<'tarefas' | 'tempo'>('tarefas')

  useEffect(() =>
  {
    void hydrateLog()
    if (source === 'idle') void refreshAll({ isGuest })
  }, [hydrateLog, source, refreshAll, isGuest])

  useEffect(() =>
  {
    if (isGuest) return
    const since = new Date(`${addDaysIso(localTodayIso(), -(days - 1))}T00:00:00`).toISOString()
    void fetchDecisionEvents(since, 500).then((ev) =>
      setRemoteMoves(ev.filter((e) => MOVE_KINDS.has(e.kind) && !e.undone_at).length))
  }, [days, isGuest])

  const localMoves = lastBatch ? lastBatch.moves.length - lastBatch.undone.length : 0
  const report = useMemo(
    () => buildRhythmReport({ plans, completions, tasks, humor, axelMoves: remoteMoves ?? localMoves, days }),
    [plans, completions, tasks, humor, remoteMoves, localMoves, days],
  )
  const openWorries = worries.filter((w) => !w.resolved)
  const t = report.totals
  const labelOf = (iso: string, label: string) => (days === 7 ? label : `${iso.slice(8, 10)}`)

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Meu ritmo" subtitle="O que foi planejado, o que foi feito e como você estava" />
      <View style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SelectChip label="7 dias" active={days === 7} onPress={() => setDays(7)} />
          <SelectChip label="4 semanas" active={days === 28} onPress={() => setDays(28)} />
        </View>

        {report.care.level !== 'none' ? (
          <Card tone="elevated" style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <Ionicons name="heart-outline" size={18} color={colors.axel} style={{ marginTop: 2 }} />
              <Text variant="body" style={{ flex: 1 }}>{report.care.text}</Text>
            </View>
            {report.care.level === 'concern' ? <CrisisSupportCard compact /> : null}
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <StatTile label="Noites planejadas" value={`${t.nightsPlanned}`} sub={`de ${report.days.length}`} />
          <StatTile
            label="Essenciais feitos"
            value={t.essentials ? `${t.essentialsDone}/${t.essentials}` : '–'}
            sub={t.essentials ? `${Math.round((t.essentialsDone / t.essentials) * 100)}%` : 'planeje uma noite para ver'}
          />
          <StatTile label="Tarefas concluídas" value={`${t.doneCount}`} />
          <StatTile label="Tempo dedicado" value={formatMinutesPt(t.doneMinutes)} />
        </View>

        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">O que foi planejado × feito</Text>
          <Text variant="caption" muted>Essenciais escolhidos na noite anterior, por dia.</Text>
          <RhythmColumns
            accessibilityLabel="Essenciais planejados e feitos por dia"
            legend={{ value: 'Feitos', track: 'Planejados' }}
            data={report.days.map((d) => ({
              label: labelOf(d.iso, d.label),
              value: d.essentialsDone,
              track: d.essentials,
              detail: d.planned
                ? `${d.label} ${d.iso.slice(8, 10)}/${d.iso.slice(5, 7)} · ${DAY_PLAN_MODE_COPY[d.mode!].label}: ${d.essentialsDone} de ${d.essentials} essenciais`
                : `${d.label} ${d.iso.slice(8, 10)}/${d.iso.slice(5, 7)} · sem plano`,
            }))}
          />
        </Card>

        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">O que você fez</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SelectChip label="Tarefas" active={doneMetric === 'tarefas'} onPress={() => setDoneMetric('tarefas')} />
            <SelectChip label="Tempo" active={doneMetric === 'tempo'} onPress={() => setDoneMetric('tempo')} />
          </View>
          <RhythmColumns
            accessibilityLabel={doneMetric === 'tarefas' ? 'Tarefas concluídas por dia' : 'Tempo dedicado por dia'}
            formatTick={doneMetric === 'tempo' ? (v) => (v >= 60 ? `${Math.round(v / 60)}h` : `${v}`) : undefined}
            data={report.days.map((d) => ({
              label: labelOf(d.iso, d.label),
              value: doneMetric === 'tarefas' ? d.doneCount : d.doneMinutes,
              detail: `${d.label} ${d.iso.slice(8, 10)}/${d.iso.slice(5, 7)} · ${d.doneCount} ${d.doneCount === 1 ? 'tarefa' : 'tarefas'} · ${formatMinutesPt(d.doneMinutes)}`,
            }))}
          />
        </Card>

        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">Como você estava</Text>
          <Text variant="caption" muted>
            Humor de 1 a 5{report.moodAvg != null ? ` · média ${report.moodAvg.toFixed(1).replace('.', ',')}` : ''}
          </Text>
          <RhythmLine
            accessibilityLabel="Humor por dia, de 1 a 5"
            data={report.days.map((d) => ({
              label: labelOf(d.iso, d.label),
              value: d.mood,
              detail: `${d.label} ${d.iso.slice(8, 10)}/${d.iso.slice(5, 7)} · ${d.mood != null ? `humor ${String(d.mood).replace('.', ',')}` : 'sem registro'}`,
            }))}
          />
        </Card>

        {report.insights.length ? (
          <Card tone="elevated" style={{ gap: 10 }}>
            <Text variant="section">O que o Axel percebeu</Text>
            {report.insights.map((i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                <Ionicons name="sparkles-outline" size={14} color={colors.axel} style={{ marginTop: 3 }} />
                <Text variant="body" style={{ flex: 1, fontSize: 14 }}>{i}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {openWorries.length ? (
          <Card tone="elevated" style={{ gap: 8 }}>
            <Text variant="section">Preocupações estacionadas</Text>
            <Text variant="caption" muted>
              Só neste aparelho. Muitas perdem o peso com o tempo; marque as que já passaram.
            </Text>
            {openWorries.slice(0, 8).map((w) => (
              <View key={w.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Text variant="body" style={{ flex: 1, fontSize: 14 }}>· {w.text}</Text>
                <Pressable onPress={() => resolveWorry(w.id)} accessibilityRole="button" hitSlop={8}>
                  <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>Já passou</Text>
                </Pressable>
              </View>
            ))}
          </Card>
        ) : null}

        <PrimaryButton label="Planejar amanhã" onPress={() => router.push('/planejar-amanha')} />
        <PrimaryButton
          label="Compartilhar resumo"
          variant="secondary"
          onPress={() => void Share.share({ message: rhythmReportToText(report), title: 'Meu ritmo' })}
        />
        <Text variant="micro" muted>
          O resumo compartilhado leva números e humor, nunca suas preocupações ou anotações.
          Registro pessoal de organização, não é avaliação clínica.
        </Text>
        <PrimaryButton label="Voltar" variant="ghost" onPress={() => safeBack(router, '/(tabs)')} />
      </View>
    </Screen>
  )
}
