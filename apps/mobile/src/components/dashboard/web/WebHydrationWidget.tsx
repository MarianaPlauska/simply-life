import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AGUA_META_COPOS, aguaMlPorCopo, findHabit, habitPct } from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { useWaterLogStore } from '../../../store/waterLogStore'
import { WaterGoalEditor } from '../WaterGoalEditor'
import { WebHoverable } from './WebHoverable'
import { webStyle } from './webStyle'
import { WEB_CARD_BORDER, WEB_ROW_DIVIDER } from './webPalette'

/** Hidratação como barra de progresso horizontal + controles compactos — sem ilustração de garrafa. */
export function WebHydrationWidget()
{
  const { colors } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const habits = useDataStore((s) => s.habits) ?? []
  const addWaterCup = useDataStore((s) => s.addWaterCup)
  const removeWaterCup = useDataStore((s) => s.removeWaterCup)
  const hydrateLog = useWaterLogStore((s) => s.hydrate)
  const [edit, setEdit] = useState(false)

  useEffect(() =>
  {
    hydrateLog()
  }, [hydrateLog])

  const agua = findHabit(habits, 'agua')
  const ml = aguaMlPorCopo(agua)
  const meta = agua?.metaDiaria ?? AGUA_META_COPOS
  const atual = agua?.progressoAtual ?? 0
  const pct = habitPct(agua)

  return (
    <View style={{ borderRadius: 14, backgroundColor: colors.elevated, borderWidth: 1, borderColor: WEB_CARD_BORDER, padding: 18, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ gap: 2 }}>
          <Text variant="section" style={{ fontSize: 16 }}>
            Hidratação
          </Text>
          <Text variant="caption" muted style={{ fontSize: 12 }}>
            {atual}/{meta} copos · {atual * ml}/{meta * ml} ml
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <WebHoverable
            onPress={() => void removeWaterCup(isGuest)}
            disabled={atual <= 0}
            accessibilityLabel="Remover copo"
            style={webStyle({
              width: 30,
              height: 30,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              opacity: atual <= 0 ? 0.4 : 1,
              cursor: atual <= 0 ? 'default' : 'pointer',
            })}
          >
            <Ionicons name="remove" size={16} color={colors.ink} />
          </WebHoverable>
          <WebHoverable
            onPress={() => void addWaterCup(isGuest)}
            accessibilityLabel={`Registrar copo de ${ml} ml`}
            style={webStyle({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              height: 30,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: colors.health,
              cursor: 'pointer',
            })}
          >
            <Ionicons name="add" size={14} color={colors.canvas} />
            <Text variant="micro" style={{ color: colors.canvas, fontWeight: '700' }}>
              Copo
            </Text>
          </WebHoverable>
          <WebHoverable
            onPress={() => setEdit((v) => !v)}
            accessibilityLabel="Editar meta de água"
            style={webStyle({
              width: 30,
              height: 30,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              cursor: 'pointer',
            })}
          >
            <Ionicons name="options-outline" size={14} color={colors.ink} />
          </WebHoverable>
        </View>
      </View>

      <View style={{ height: 6, borderRadius: 999, backgroundColor: WEB_ROW_DIVIDER, overflow: 'hidden' }}>
        <View
          style={{
            width: `${Math.min(100, pct)}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: colors.health,
          }}
        />
      </View>

      {edit ? <WaterGoalEditor /> : null}
    </View>
  )
}
