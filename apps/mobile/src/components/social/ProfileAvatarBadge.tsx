import { View } from 'react-native'
import { Icon, Text, type IconName } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { usePrefsStore } from '../../store/prefsStore'

/**
 * Avatar da própria pessoa com o que ela desbloqueou: ícone, cor e anel.
 * `icon`/`frame` forçam uma prévia (loja de desbloqueios).
 */
export function ProfileAvatarBadge({
  size = 44,
  icon,
  frame,
  initial,
}: {
  size?: number
  icon?: string
  frame?: string
  initial?: string
})
{
  const { colors } = useTheme()
  const prefs = usePrefsStore((s) => s.prefs)
  const tint = prefs.profile_avatar_tint || colors.axel
  const name = icon ?? prefs.profile_avatar_icon ?? 'initials'
  const ring = frame ?? prefs.profile_avatar_frame ?? 'lisa'
  const letter = (initial ?? (prefs.axel_calls_you || prefs.display_name || '?')).trim().slice(0, 1).toUpperCase() || '?'
  const inner = size - 8

  const ringStyle =
    ring === 'pontilhada'
      ? { borderWidth: 2, borderStyle: 'dashed' as const, borderColor: tint }
      : ring === 'dupla'
        ? { borderWidth: 3, borderColor: `${tint}66` }
        : ring === 'brilho'
          ? { borderWidth: 2, borderColor: tint, shadowColor: tint, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }
          : { borderWidth: 0, borderColor: 'transparent' }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        ...ringStyle,
      }}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: 999,
          backgroundColor: `${tint}28`,
          borderWidth: ring === 'dupla' ? 2 : 0,
          borderColor: tint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {name !== 'initials' ? (
          <Icon name={name as IconName} size={Math.round(inner * 0.55)} color={tint} />
        ) : (
          <Text variant="bodyStrong" style={{ color: tint, fontSize: Math.round(inner * 0.42), lineHeight: Math.round(inner * 0.55) }}>
            {letter}
          </Text>
        )}
      </View>
    </View>
  )
}
