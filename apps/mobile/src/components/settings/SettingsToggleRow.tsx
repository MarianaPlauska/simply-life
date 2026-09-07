import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle: string
  value?: boolean
  onValueChange?: (next: boolean) => void
  onPress?: () => void
}

/** Interruptor com check / X, no recorte da referência de ajustes. */
function SettingsSwitch({
  value,
  onValueChange,
}: {
  value: boolean
  onValueChange: (next: boolean) => void
})
{
  const { colors } = useTheme()
  return (
    <PressableScale
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={{
        width: 52,
        height: 32,
        borderRadius: 999,
        paddingHorizontal: 3,
        justifyContent: 'center',
        alignItems: value ? 'flex-end' : 'flex-start',
        backgroundColor: value ? colors.axel : colors.hairline,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Ionicons
          name={value ? 'checkmark' : 'close'}
          size={14}
          color={value ? colors.axel : colors.inkMuted}
        />
      </View>
    </PressableScale>
  )
}

/** Card de ajuste: ícone, título, descrição e switch. */
export function SettingsToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  onPress,
}: Props)
{
  const { colors, mode } = useTheme()
  const card = mode === 'dark' ? colors.elevated : '#FFFFFF'
  const interactive = Boolean(onPress) && onValueChange == null
  const body = (
    <>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.axelMuted,
        }}
      >
        <Ionicons name={icon} size={20} color={colors.axel} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="bodyStrong" style={{ fontSize: 15 }}>
          {title}
        </Text>
        <Text variant="caption" muted numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      {onValueChange != null ? (
        <SettingsSwitch value={Boolean(value)} onValueChange={onValueChange} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
      )}
    </>
  )

  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    minHeight: 72,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: card,
  }

  if (interactive)
  {
    return (
      <PressableScale onPress={onPress} style={rowStyle}>
        {body}
      </PressableScale>
    )
  }

  return <View style={rowStyle}>{body}</View>
}
