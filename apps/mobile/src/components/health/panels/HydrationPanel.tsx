import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { findHabit, habitPct } from '@simply-life/shared'
import {
  Card,
  Text,
  SectionHeader,
  PrimaryButton,
  PressableScale,
} from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'

export function HydrationPanel()
{
  const { colors, space } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const addWaterCup = useDataStore((s) => s.addWaterCup)
  const isGuest = useAuthStore((s) => s.isGuest)
  const agua = findHabit(habits, 'agua')
  const pillBtn = { borderRadius: 999 as const }

  return (
    <Card tone="elevated" style={{ gap: space.md }}>
      <SectionHeader title="Hidratação" subtitle={`${habitPct(agua)}% da meta`} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {Array.from({ length: agua?.metaDiaria ?? 10 }).map((_, i) =>
        {
          const filled = i < (agua?.progressoAtual ?? 0)
          return (
            <PressableScale
              key={i}
              onPress={() =>
              {
                if (!filled) void addWaterCup(isGuest)
              }}
              style={{
                width: 44,
                height: 48,
                borderRadius: 10,
                backgroundColor: filled ? colors.healthMuted : colors.surface,
                borderWidth: 1,
                borderColor: filled ? colors.health : colors.hairline,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="water"
                size={20}
                color={filled ? colors.health : colors.inkFaint}
              />
            </PressableScale>
          )
        })}
      </View>
      <PrimaryButton
        label="+ 1 copo"
        onPress={() => void addWaterCup(isGuest)}
        style={pillBtn}
      />
    </Card>
  )
}
