import { useEffect } from 'react'
import { View } from 'react-native'
import {
  findHabit,
  formatSleepHours,
  habitPct,
  SONO_META_H,
} from '@simply-life/shared'
import {
  Card,
  Text,
  SectionHeader,
  PrimaryButton,
  IconBadge,
  StatusPill,
  MiniBarChart,
  Chip,
} from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { last7Iso, useBodyWeekStore } from '../../../store/bodyWeekStore'

const QUICK = [6, 6.5, 7, 7.5, 8, 8.5, 9]

/** Registrar horas da última noite — meta 7–9h. */
export function SleepPanel()
{
  const { colors, space } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const setSleepHours = useDataStore((s) => s.setSleepHours)
  const isGuest = useAuthStore((s) => s.isGuest)
  const sleepHours = useBodyWeekStore((s) => s.sleepHours)
  const hydrateBody = useBodyWeekStore((s) => s.hydrate)

  useEffect(() =>
  {
    hydrateBody()
  }, [hydrateBody])
  const sono = findHabit(habits, 'sono')
  const atual = sono?.progressoAtual ?? 0
  const meta = sono?.metaDiaria || SONO_META_H
  const pct = habitPct(sono)
  const done = atual >= meta * 0.9
  const weekRaw = last7Iso()
  const week = weekRaw.map((iso, i) =>
    i === weekRaw.length - 1 ? atual : (sleepHours[iso] ?? 0),
  )
  const pillBtn = { borderRadius: 999 as const }

  return (
    <Card tone="elevated" style={{ gap: space.md, borderRadius: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <IconBadge name="moon" color="#C4A574" size={44} iconSize={22} />
        <View style={{ flex: 1, gap: 6 }}>
          <SectionHeader
            title="Sono"
            subtitle={atual > 0 ? `${formatSleepHours(atual)} · meta ${meta}h` : `Meta ${meta}h`}
          />
          <StatusPill
            label={done ? 'Noite ok' : atual > 0 ? `${pct}% da meta` : 'Sem registro'}
            color={done ? colors.health : colors.axel}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Text variant="hero" style={{ fontSize: 36, lineHeight: 40 }}>
          {atual > 0 ? formatSleepHours(atual) : '—'}
        </Text>
        <MiniBarChart
          values={week.map((v) => v || 0.4)}
          highlightIndex={6}
          color="#C4A574"
          width={120}
          height={56}
        />
      </View>
      <Text variant="caption" muted>
        Semana — a barra mais escura é hoje.
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {QUICK.map((h) => (
          <Chip
            key={h}
            label={formatSleepHours(h)}
            active={Math.abs(atual - h) < 0.05}
            onPress={() => void setSleepHours(h, isGuest)}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <PrimaryButton
          label="− 30 min"
          variant="secondary"
          onPress={() => void setSleepHours(Math.max(0, atual - 0.5), isGuest)}
          disabled={atual <= 0}
          style={[pillBtn, { flex: 1 }]}
        />
        <PrimaryButton
          label="+ 30 min"
          onPress={() => void setSleepHours(Math.min(16, atual + 0.5), isGuest)}
          style={[pillBtn, { flex: 1 }]}
        />
      </View>
    </Card>
  )
}
