import { Modal, Pressable, View } from 'react-native'
import { Icon, PrimaryButton, Text } from '../ui'
import { useTheme } from '../theme/ThemeProvider'
import { useConfirmStore } from '../store/confirmStore'
import { hapticLight } from '../lib/haptics'

/** Diálogo único de "tem certeza?" do app. Montado uma vez no layout raiz. */
export function ConfirmDialogHost()
{
  const { colors, space, radius, elevation } = useTheme()
  const request = useConfirmStore((s) => s.request)
  const close = useConfirmStore((s) => s.close)

  const confirm = () =>
  {
    const run = request?.onConfirm
    close()
    hapticLight()
    run?.()
  }

  return (
    <Modal visible={request != null} transparent animationType="fade" onRequestClose={close}>
      <Pressable
        accessibilityLabel="Fechar"
        onPress={close}
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          padding: space.lg,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="alert"
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: colors.elevated,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: colors.cardRim,
            padding: space.lg,
            gap: space.md,
            ...elevation.fab,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              backgroundColor: `${colors.danger}1F`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="trash-outline" size={24} color={colors.danger} weight="duotone" />
          </View>
          <View style={{ gap: 6 }}>
            <Text variant="section">{request?.title ?? ''}</Text>
            <Text variant="body" muted>{request?.message ?? ''}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.xs }}>
            <PrimaryButton label="Cancelar" variant="ghost" onPress={close} style={{ flex: 1 }} />
            <PrimaryButton
              label={request?.confirmLabel ?? 'Excluir'}
              variant="danger"
              onPress={confirm}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
