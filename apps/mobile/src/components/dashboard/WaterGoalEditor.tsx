import { View } from 'react-native'
import {
  AGUA_ML_OPTIONS,
  AGUA_LITROS_OPTIONS,
  aguaMlPorCopo,
  aguaMetaCopos,
  findHabit,
} from '@simply-life/shared'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'

/** Chips de ml do copo e meta em litros (casa / Saúde). */
export function WaterGoalEditor()
{
  const { colors } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const habits = useDataStore((s) => s.habits) ?? []
  const patchAguaHabit = useDataStore((s) => s.patchAguaHabit)
  const agua = findHabit(habits, 'agua')
  const ml = aguaMlPorCopo(agua)
  const meta = agua?.metaDiaria ?? 10
  const litrosAtuais = (meta * ml) / 1000

  return (
    <View style={{ gap: 10 }}>
      <Text variant="caption" muted>
        Tamanho do copo
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {AGUA_ML_OPTIONS.map((opt) =>
        {
          const active = ml === opt
          return (
            <PressableScale
              key={opt}
              onPress={() =>
              {
                const litros = (meta * ml) / 1000
                void patchAguaHabit(
                  { mlPorCopo: opt, metaDiaria: aguaMetaCopos(litros, opt) },
                  isGuest,
                )
              }}
              style={{
                minHeight: 40,
                paddingHorizontal: 12,
                borderRadius: 999,
                justifyContent: 'center',
                backgroundColor: active ? colors.health : colors.elevated,
              }}
            >
              <Text
                variant="caption"
                style={{ fontWeight: '700', color: active ? colors.canvas : colors.ink }}
              >
                {opt} ml
              </Text>
            </PressableScale>
          )
        })}
      </View>
      <Text variant="caption" muted>
        Meta do dia
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {AGUA_LITROS_OPTIONS.map((l) =>
        {
          const active = Math.abs(litrosAtuais - l) < 0.05
          return (
            <PressableScale
              key={l}
              onPress={() =>
                void patchAguaHabit({ metaDiaria: aguaMetaCopos(l, ml) }, isGuest)
              }
              style={{
                minHeight: 40,
                paddingHorizontal: 12,
                borderRadius: 999,
                justifyContent: 'center',
                backgroundColor: active ? colors.health : colors.elevated,
              }}
            >
              <Text
                variant="caption"
                style={{ fontWeight: '700', color: active ? colors.canvas : colors.ink }}
              >
                {String(l).replace('.', ',')} L
              </Text>
            </PressableScale>
          )
        })}
      </View>
    </View>
  )
}
