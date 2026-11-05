import { Pressable, View } from 'react-native'
import { BODY_CHECKS, localTodayIso, type BodyCheckId } from '@simply-life/shared'
import { Icon, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useCareExtrasStore } from '../../store/careExtrasStore'
import { hapticLight } from '../../lib/haptics'

/** Quatro toques. Não grava humor e não cria tarefa. */
export function BodyCheckRow()
{
  const { colors, space } = useTheme()
  const today = localTodayIso()
  const day = useCareExtrasStore((s) => s.bodyByDay[today])
  const toggle = useCareExtrasStore((s) => s.toggleBody)

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong">Como está seu corpo?</Text>
        <Text variant="caption" muted>Marque o que faz sentido agora. Sem certo ou errado.</Text>
      </View>
      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.elevated, overflow: 'hidden' }}>
        {[0, 1].map((row) =>
        {
          const rowItems = BODY_CHECKS.slice(row * 2, row * 2 + 2)
          return (
            <View key={row} style={{ flexDirection: 'row', borderTopWidth: row ? 1 : 0, borderTopColor: colors.hairline }}>
              {rowItems.map((item, column) =>
              {
                const on = day?.[item.id] === true
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    onPress={() =>
                    {
                      hapticLight()
                      toggle(item.id as BodyCheckId)
                    }}
                    style={({ pressed }) => ({
                      minHeight: 46,
                      flex: 1,
                      paddingHorizontal: 12,
                      borderRightWidth: column === 0 ? 1 : 0,
                      borderRightColor: colors.hairline,
                      flexDirection: 'row',
                      gap: 8,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: on ? colors.axelMuted : pressed ? colors.fill : 'transparent',
                    })}
                  >
                    <Text variant="caption" style={{ flex: 1, fontSize: 14 }}>{item.label}</Text>
                    {on ? <Icon name="checkmark-circle" size={17} color={colors.axel} /> : <View style={{ width: 17 }} />}
                  </Pressable>
                )
              })}
            </View>
          )
        })}
      </View>
    </View>
  )
}
