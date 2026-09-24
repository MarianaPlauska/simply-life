import { View } from 'react-native'
import { findHabit, habitPct } from '@simply-life/shared'
import { PrimaryButton } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { HealthPanelHero } from '../HealthPanelHero'

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
  const atual = proteina?.progressoAtual ?? 0
  const meta = proteina?.metaDiaria ?? 120

  return (
    <View style={{ gap: space.md }}>
      <HealthPanelHero
        icon="restaurant"
        kicker="Alimentação"
        headline={`${pct}%`}
        detail={`${atual}g / ${meta}g proteína`}
        pillLabel={done ? 'Meta ok' : `${pct}% da meta`}
        pillColor={done ? colors.health : colors.axel}
      />
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
    </View>
  )
}
