import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { findHabit, habitPct, aguaMlPorCopo } from '@simply-life/shared'
import { PrimaryButton, PressableScale } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { WaterGoalEditor } from '../../dashboard/WaterGoalEditor'
import { HealthPanelHero } from '../HealthPanelHero'

export function HydrationPanel()
{
  const { colors, space } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const addWaterCup = useDataStore((s) => s.addWaterCup)
  const removeWaterCup = useDataStore((s) => s.removeWaterCup)
  const isGuest = useAuthStore((s) => s.isGuest)
  const agua = findHabit(habits, 'agua')
  const pillBtn = { borderRadius: 999 as const }
  const [edit, setEdit] = useState(false)
  const ml = aguaMlPorCopo(agua)

  const pct = habitPct(agua)
  const atual = agua?.progressoAtual ?? 0
  const meta = agua?.metaDiaria ?? 10

  return (
    <View style={{ gap: space.md }}>
      <HealthPanelHero
        icon="water"
        kicker="Hidratação"
        headline={`${atual}/${meta} copos`}
        detail={`${ml} ml por copo`}
        pillLabel={`${pct}% da meta`}
        pillColor={colors.health}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {Array.from({ length: meta }).map((_, i) =>
        {
          const filled = i < atual
          return (
            <PressableScale
              key={i}
              accessibilityLabel={filled ? `Remover até o copo ${i + 1}` : `Registrar copo ${i + 1}`}
              onPress={() =>
              {
                if (filled)
                {
                  if (i === atual - 1) void removeWaterCup(isGuest)
                }
                else if (i === atual)
                {
                  void addWaterCup(isGuest)
                }
              }}
              style={{
                width: 44,
                height: 48,
                borderRadius: 10,
                backgroundColor: filled ? colors.healthMuted : colors.hairline,
                borderWidth: filled ? 0 : StyleSheet.hairlineWidth,
                borderColor: colors.hairline,
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
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <PrimaryButton
          label="− Copo"
          variant="secondary"
          onPress={() => void removeWaterCup(isGuest)}
          disabled={atual <= 0}
          style={[pillBtn, { flex: 1 }]}
        />
        <PrimaryButton
          label={`+ Copo (${ml} ml)`}
          onPress={() => void addWaterCup(isGuest)}
          style={[pillBtn, { flex: 1 }]}
        />
      </View>
      <PrimaryButton
        label={edit ? 'Fechar meta' : 'Editar ml e litros'}
        variant="link"
        onPress={() => setEdit((v) => !v)}
        style={{ alignSelf: 'flex-start', marginTop: -4 }}
      />
      {edit ? <WaterGoalEditor /> : null}
    </View>
  )
}
