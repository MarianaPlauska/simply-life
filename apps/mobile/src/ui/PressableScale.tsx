import { Pressable, type PressableProps, type ViewStyle } from 'react-native'
import { usePrefsStore } from '../store/prefsStore'

type Props = PressableProps & {
  /** Escala quando pressionado - padrão 0.97 */
  pressedScale?: number
  style?: ViewStyle | ViewStyle[]
}

/** Feedback visual de toque - escala + opacidade */
export function PressableScale({
  children,
  pressedScale = 0.97,
  style,
  disabled,
  ...rest
}: Props)
{
  const reduceMotion = usePrefsStore((s) => s.prefs.a11y_reduce_motion)
  const scale = reduceMotion ? 1 : pressedScale

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        {
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !disabled ? scale : 1 }],
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  )
}
