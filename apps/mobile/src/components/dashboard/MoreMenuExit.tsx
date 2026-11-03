import { Pressable, View } from 'react-native'
import { PrimaryButton, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  onClose: () => void
  onSignOut: () => void
}

/**
 * Fechar é a ação segura do menu (um botão).
 * Sair da conta fica em texto vermelho, com a consequência escrita,
 * para não parecer o mesmo tipo de toque.
 */
export function MoreMenuExit({ onClose, onSignOut }: Props)
{
  const { colors, space } = useTheme()
  return (
    <View style={{ gap: space.sm, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: colors.hairline }}>
      <Pressable
        onPress={onSignOut}
        accessibilityRole="button"
        accessibilityLabel="Sair da conta"
        style={{ minHeight: 48, justifyContent: 'center', gap: 2 }}
      >
        <Text variant="bodyStrong" color={colors.danger}>
          Sair da conta
        </Text>
        <Text variant="caption" muted>
          Encerra a sessão neste aparelho. O que você salvou continua na conta.
        </Text>
      </Pressable>
      <PrimaryButton label="Fechar" variant="dismiss" onPress={onClose} />
    </View>
  )
}
