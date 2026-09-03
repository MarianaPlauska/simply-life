import { ActivityIndicator, Pressable, type PressableProps } from 'react-native'
import { COMPONENT_SPEC } from '@simply-life/ui-tokens'
import { Text } from './Text'
import { useTheme } from '../theme/ThemeProvider'

type Variant = 'primary' | 'secondary' | 'ghost' | 'link'
type Size = 'md' | 'sm'

type Props = PressableProps & {
  label: string
  loading?: boolean
  variant?: Variant
  size?: Size
}

export function PrimaryButton({
  label,
  loading,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  ...rest
}: Props)
{
  const { colors } = useTheme()
  const minHeight = size === 'sm' ? 40 : COMPONENT_SPEC.PrimaryButton.minHeight
  const radius = COMPONENT_SPEC.PrimaryButton.radius
  const isLink = variant === 'link'
  const isGhost = variant === 'ghost'
  const isSecondary = variant === 'secondary'
  const isPrimary = variant === 'primary'

  // Só a variante primary usa cobre - secondary/ghost/link ficam neutros
  const bg = isPrimary
    ? colors.axel
    : isSecondary
      ? colors.surface
      : 'transparent'

  const fg = isPrimary
    ? colors.axelOnFill
    : isLink
      ? colors.inkMuted
      : colors.ink

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          minHeight: isLink ? 44 : minHeight,
          borderRadius: radius,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: isLink ? 4 : 16,
          backgroundColor: bg,
          borderWidth: isGhost || isSecondary ? 1 : 0,
          borderColor: colors.hairlineStrong,
          opacity: disabled || loading ? 0.45 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !disabled && !loading ? 0.97 : 1 }],
        },
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text
          variant={isLink || size === 'sm' ? 'label' : 'bodyStrong'}
          color={fg}
          style={{ letterSpacing: isPrimary ? 0.2 : 0 }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}
