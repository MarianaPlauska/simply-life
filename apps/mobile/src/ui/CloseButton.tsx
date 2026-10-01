import { Pressable } from 'react-native'
import { Icon } from './Icon'
import { useTheme } from '../theme/ThemeProvider'

/**
 * Botão de fechar do app inteiro. Em repouso é neutro, para não disputar
 * atenção com o conteúdo. A cor de "dispensar" (ameixa) só aparece no toque:
 * é a confirmação visual de que você está saindo dali.
 */
export function CloseButton({
  onPress,
  label = 'Fechar',
  size = 40,
}: {
  onPress: () => void
  label?: string
  size?: number
})
{
  const { colors } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.dismissMuted : colors.elevated,
        borderWidth: 1,
        borderColor: pressed ? colors.dismiss : colors.hairline,
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      {({ pressed }) => (
        <Icon name="close" size={Math.round(size * 0.45)} color={pressed ? colors.dismiss : colors.inkMuted} />
      )}
    </Pressable>
  )
}
