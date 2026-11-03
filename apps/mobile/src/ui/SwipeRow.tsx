import { useRef, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import { Icon, type IconName } from './Icon'
import { Text } from './Text'
import { useTheme } from '../theme/ThemeProvider'
import { hapticSelect } from '../lib/haptics'

type Action = {
  label: string
  icon: IconName
  color: string
  onPress: () => void
}

/**
 * Linha que desliza, como nos apps nativos.
 * Deslizar para a esquerda mostra `right` (ex.: apagar); para a direita mostra `left` (ex.: concluir).
 */
export function SwipeRow({ children, left, right }: { children: ReactNode; left?: Action; right?: Action })
{
  const { colors } = useTheme()
  const ref = useRef<Swipeable>(null)

  const render = (a: Action, side: 'left' | 'right') => () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a.label}
      onPress={() =>
      {
        hapticSelect()
        ref.current?.close()
        a.onPress()
      }}
      style={{
        width: 88,
        backgroundColor: a.color,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        alignSelf: side === 'left' ? 'flex-start' : 'flex-end',
        height: '100%',
      }}
    >
      <Icon name={a.icon} size={20} color={'#FFFFFF'} />
      <Text variant="micro" color={'#FFFFFF'}>{a.label}</Text>
    </Pressable>
  )

  return (
    <Swipeable
      ref={ref}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={left ? render(left, 'left') : undefined}
      renderRightActions={right ? render(right, 'right') : undefined}
      onSwipeableWillOpen={() => hapticSelect()}
    >
      <View style={{ backgroundColor: colors.canvas }}>{children}</View>
    </Swipeable>
  )
}
