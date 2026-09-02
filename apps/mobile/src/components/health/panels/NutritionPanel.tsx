import { View } from 'react-native'
import { findHabit, habitPct } from '@simply-life/shared'
import { Card, Text, SectionHeader, PrimaryButton } from '../../../ui'
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
  const pillBtn = { borderRadius: 999 as const }

  return (
    <Card tone="elevated" style={{ gap: space.md }}>
      <SectionHeader
        title="Alimentação"
        subtitle={`${proteina?.progressoAtual ?? 0}g / ${proteina?.metaDiaria ?? 120}g proteína`}
      />
      <Text variant="hero" color={colors.health}>
        {habitPct(proteina)}%
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
