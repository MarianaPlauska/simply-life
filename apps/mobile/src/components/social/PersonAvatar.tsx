import { View } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/** Avatar de pessoa do Círculo: inicial sobre a cor salva no cartão (ou petróleo). */
export function PersonAvatar({
  name,
  accent,
  size = 40,
  ring,
}: {
  name: string
  accent?: string
  size?: number
  /** contorno para empilhar avatares */
  ring?: boolean
})
{
  const { colors } = useTheme()
  const bg = accent && /^#[0-9a-f]{3,8}$/i.test(accent) ? accent : colors.brand
  const initial = (name.trim().slice(0, 1) || '?').toUpperCase()
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
      <Text variant={size >= 40 ? 'bodyStrong' : 'label'} color={colors.onBrand}>
        {initial}
      </Text>
    </View>
  )
}
