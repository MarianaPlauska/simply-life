import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value?: string
  onPress?: () => void
  danger?: boolean
  /** Cor do ícone/badge (pastéis da ref) */
  accent?: string
  iconNode?: ReactNode
}

/** Linha de settings estilo perfil (ref: Dados / Настройки) */
export function ProfileSettingsRow({ icon, label, value, onPress, danger, accent, iconNode }: Props)
{
  const { colors } = useTheme()
  const tint = danger ? colors.danger : (accent ?? colors.axel)
  const badgeBg = danger
    ? 'rgba(224,122,106,0.12)'
    : accent
      ? `${accent}22`
      : colors.axelMuted

  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 52,
        paddingVertical: 10,
        paddingHorizontal: 4,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: badgeBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {iconNode ?? <Ionicons name={icon} size={18} color={tint} />}
      </View>
      <Text
        variant="bodyStrong"
        style={{ flex: 1, fontSize: 15, color: danger ? colors.danger : colors.ink }}
      >
        {label}
      </Text>
      {value ? (
        <Text variant="caption" muted numberOfLines={1} style={{ maxWidth: 140, textAlign: 'right' }}>
          {value}
        </Text>
      ) : null}
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
      ) : null}
    </PressableScale>
  )
}

export function ProfileSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
})
{
  const { colors, space } = useTheme()
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        gap: 2,
        shadowColor: colors.ink,
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      <Text
        variant="caption"
        muted
        style={{
          fontWeight: '700',
          paddingTop: 8,
          paddingBottom: 4,
          paddingHorizontal: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          fontSize: 11,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  )
}
