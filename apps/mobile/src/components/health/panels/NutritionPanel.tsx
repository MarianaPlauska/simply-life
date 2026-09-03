import { View } from 'react-native'
import { findHabit, habitPct } from '@simply-life/shared'
import {
  Card,
  Text,
  SectionHeader,
  PrimaryButton,
  IconBadge,
  StatusPill,
} from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'

export function NutritionPanel()
{
  const { colors, space } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const addProteinGrams = useDataStore((s) => s.addProteinGrams)
  const isGuest = useAuthStore((s) => s.isGuest)
  const proteina = findHabit(habits, 'proteina')
  const pct = habitPct(proteina)
  const done = Boolean(proteina && proteina.progressoAtual >= proteina.metaDiaria)
  const pillBtn = { borderRadius: 999 as const }

  return (
    <Card tone="elevated" style={{ gap: space.md, borderRadius: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <IconBadge name="restaurant" color={colors.health} size={44} iconSize={22} />
        <View style={{ flex: 1, gap: 6 }}>
          <SectionHeader
            title="Alimentação"
            subtitle={`${proteina?.progressoAtual ?? 0}g / ${proteina?.metaDiaria ?? 120}g proteína`}
          />
          <StatusPill
            label={done ? 'Meta ok' : `${pct}% da meta`}
            color={done ? colors.health : colors.axel}
          />
        </View>
      </View>
      <Text variant="hero" color={colors.health}>
        {pct}%
      </Text>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {[10, 20, 30].map((g) => (
          <View key={g} style={{ flex: 1 }}>
            <PrimaryButton
              label={`+${g}g`}
              variant="secondary"
              size="sm"
              onPress={() => void addProteinGrams(g, isGuest)}
              style={pillBtn}
            />
          </View>
        ))}
      </View>
      <PrimaryButton
        label="Registrar refeição rápida (+25g)"
        variant="ghost"
        onPress={() => void addProteinGrams(25, isGuest)}
        style={pillBtn}
      />
    </Card>
  )
}
