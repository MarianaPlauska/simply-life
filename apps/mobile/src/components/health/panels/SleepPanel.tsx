import { useEffect } from 'react'
import { View } from 'react-native'
import {
  findHabit,
  formatSleepHours,
  habitPct,
  SONO_META_H,
} from '@simply-life/shared'
import {
  Text,
  PrimaryButton,
  MiniBarChart,
  Chip,
} from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { last7Iso, useBodyWeekStore } from '../../../store/bodyWeekStore'
import { HealthPanelHero } from '../HealthPanelHero'

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
  const headline = atual > 0 ? formatSleepHours(atual) : '—'

  return (
    <View style={{ gap: space.md }}>
      <HealthPanelHero
        icon="moon"
        iconColor="#C4A574"
        kicker="Sono"
        headline={headline}
        detail={atual > 0 ? `Meta ${meta}h` : `Meta ${meta}h · sem registro`}
        pillLabel={done ? 'Noite ok' : atual > 0 ? `${pct}% da meta` : 'Sem registro'}
        pillColor={done ? colors.health : colors.axel}
      />

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <MiniBarChart
          values={week.map((v) => v || 0.4)}
          highlightIndex={6}
          color="#C4A574"
          width={160}
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
    </View>
  )
}
