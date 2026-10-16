import { Pressable, type PressableProps, type ViewStyle } from 'react-native'
import { usePrefsStore } from '../store/prefsStore'
import { IS_ANDROID, useRipple } from './ripple'

type Props = PressableProps & {
  /** Escala quando pressionado - padrão 0.97 */
  pressedScale?: number
  style?: ViewStyle | ViewStyle[]
}

/** Feedback visual de toque: escala + opacidade; no Android, a onda de toque do sistema */
export function PressableScale({
  children,
  pressedScale = 0.97,
  style,
  disabled,
  ...rest
}: Props)
{
  const reduceMotion = usePrefsStore((s) => s.prefs.a11y_reduce_motion)
  const scale = reduceMotion || IS_ANDROID ? 1 : pressedScale
  const ripple = useRipple()

  return (
    <Pressable
      disabled={disabled}
      android_ripple={ripple}
      style={({ pressed }) => [
        {
          opacity: disabled ? 0.45 : pressed && !IS_ANDROID ? 0.88 : 1,
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
