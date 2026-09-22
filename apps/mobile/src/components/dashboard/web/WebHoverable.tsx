import { useState, type ReactNode } from 'react'
import { Pressable, type ViewStyle } from 'react-native'

type Props = {
  onPress?: () => void
  disabled?: boolean
  accessibilityLabel?: string
  children: ReactNode | ((hovered: boolean) => ReactNode)
  style?: ViewStyle | ((hovered: boolean) => ViewStyle)
}

/** Pressable com estado de hover explícito — react-native-web não expõe `hovered` no callback de style. */
export function WebHoverable({ onPress, disabled, accessibilityLabel, children, style }: Props)
{
  const [hovered, setHovered] = useState(false)
  const resolvedStyle = typeof style === 'function' ? style(hovered) : style

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={resolvedStyle}
    >
      {typeof children === 'function' ? children(hovered) : children}
    </Pressable>
  )
}
