import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COMPONENT_SPEC } from '@simply-life/ui-tokens'
import { Text } from './Text'
import { useTheme } from '../theme/ThemeProvider'

/**
 * Hierarquia (heurística de ação):
 * primary — comprometer (salvar, criar, confirmar)
 * secondary — caminho paralelo (editar, alternativa)
 * ghost — recuar com borda (cancelar)
 * dismiss — fechar: gelo/gelo (nunca vermelho; vermelho é só excluir)
 * link — terciário
 * danger — destruir (excluir, apagar)
 * success — conclusão positiva pontual (raro; preferir primary)
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger' | 'success' | 'dismiss'
type Size = 'md' | 'sm'

type Props = PressableProps & {
  label: string
  loading?: boolean
  variant?: ButtonVariant
  size?: Size
  icon?: keyof typeof Ionicons.glyphMap
}

export function PrimaryButton({
  label,
  loading,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  style,
  ...rest
}: Props)
{
  const { colors, mode } = useTheme()
  const minHeight = size === 'sm' ? 44 : Math.max(44, COMPONENT_SPEC.PrimaryButton.minHeight)
  const radius = COMPONENT_SPEC.PrimaryButton.radius
  const isLink = variant === 'link'
  const isGhost = variant === 'ghost'
  const isSecondary = variant === 'secondary'
  const isPrimary = variant === 'primary'
  const isDanger = variant === 'danger'
  const isSuccess = variant === 'success'
  const isDismiss = variant === 'dismiss'
  const iconSize = size === 'sm' ? 16 : 18

  const iceFill = mode === 'dark' ? 'rgba(245, 241, 236, 0.14)' : 'rgba(255, 255, 255, 0.72)'
  const iceLine = mode === 'dark' ? 'rgba(245, 241, 236, 0.45)' : 'rgba(42, 38, 34, 0.18)'

  const bg = isPrimary
    ? colors.axel
    : isDanger
      ? colors.danger
      : isSuccess
        ? colors.done
        : isSecondary
          ? colors.elevated
          : isDismiss
            ? iceFill
            : 'transparent'

  const fg = isPrimary || isDanger || isSuccess
    ? colors.axelOnFill
    : isLink
      ? colors.inkMuted
      : isDismiss || isGhost
        ? colors.ink
        : colors.ink

  const borderWidth = isGhost || isDismiss ? 1 : 0
  const borderColor = isDismiss ? iceLine : isGhost ? iceLine : 'transparent'
  const filled = isPrimary || isDanger || isSuccess

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
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: isLink ? 4 : size === 'sm' ? 14 : 18,
          backgroundColor: bg,
          borderWidth,
          borderColor,
          opacity: disabled || loading ? 0.45 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed && !disabled && !loading ? 0.98 : 1 }],
        },
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon ? <Ionicons name={icon} size={iconSize} color={fg} /> : null}
          <Text
            variant={isLink || size === 'sm' ? 'label' : 'bodyStrong'}
            color={fg}
            style={{
              letterSpacing: filled ? 0.15 : 0,
              fontWeight: filled ? '600' : '500',
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  )
}
