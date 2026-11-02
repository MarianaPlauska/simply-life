import { Pressable, View } from 'react-native'
import { BODY_CHECKS, localTodayIso, type BodyCheckId } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useCareExtrasStore } from '../../store/careExtrasStore'

/** Quatro toques. Não grava humor e não cria tarefa. */
export function BodyCheckRow()
{
  const { colors, space, radius } = useTheme()
  const today = localTodayIso()
  const day = useCareExtrasStore((s) => s.bodyByDay[today])
  const toggle = useCareExtrasStore((s) => s.toggleBody)

  return (
    <View style={{ gap: space.sm }}>
      <Text variant="caption" muted>Checagem do corpo</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {BODY_CHECKS.map((item) =>
        {
          const on = day?.[item.id] === true
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => toggle(item.id as BodyCheckId)}
              style={{
                minHeight: 44,
                paddingHorizontal: 14,
                borderRadius: radius.control,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: on ? colors.axel : colors.hairline,
                backgroundColor: on ? colors.axelMuted : colors.surface,
              }}
            >
              <Text variant="body">{item.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
