import { View } from 'react-native'
import { Icon, Text, type IconName } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/** Ícone escolhido nos desbloqueios: avatar_style 'icon:<nome>' ou o próprio nome. */
export function avatarIconOf(style: string | null | undefined): string | null
{
  if (!style || style === 'initials') return null
  return style.startsWith('icon:') ? style.slice(5) : style
}

/** Avatar de pessoa do Círculo: inicial (ou o ícone desbloqueado) sobre a cor salva no cartão. */
export function PersonAvatar({
  name,
  accent,
  size = 40,
  ring,
  avatarStyle,
}: {
  name: string
  accent?: string
  size?: number
  /** contorno para empilhar avatares */
  ring?: boolean
  /** 'initials' ou 'icon:<nome>' (desbloqueios) */
  avatarStyle?: string
})
{
  const { colors } = useTheme()
  const bg = accent && /^#[0-9a-f]{3,8}$/i.test(accent) ? accent : colors.brand
  const initial = (name.trim().slice(0, 1) || '?').toUpperCase()
  const icon = avatarIconOf(avatarStyle)
  return (
    <View
      accessibilityLabel={name}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 2 : 0,
        borderColor: colors.surface,
      }}
    >
      {icon ? (
        <Icon name={icon as IconName} size={Math.round(size * 0.55)} color={colors.onBrand} />
      ) : (
        <Text variant={size >= 40 ? 'bodyStrong' : 'label'} color={colors.onBrand}>
          {initial}
        </Text>
      )}
    </View>
  )
}
