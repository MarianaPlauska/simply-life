import { Modal, Pressable, View } from 'react-native'
import type { TaskStatus } from '@simply-life/shared'
import { Card, Text, Chip, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

const OPTIONS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'A fazer' },
  { id: 'doing', label: 'Fazendo' },
  { id: 'done', label: 'Feito' },
]

type Props = {
  visible: boolean
  onClose: () => void
  onPick: (status: TaskStatus) => void
}

export function MoveStatusSheet({ visible, onClose, onPick }: Props)
{
  const { space } = useTheme()

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(26, 24, 22, 0.72)',
          justifyContent: 'center',
          padding: space.lg,
        }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Mover no board</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {OPTIONS.map((opt) => (
                <Chip
                  key={opt.id}
                  label={opt.label}
                  onPress={() =>
                  {
                    onPick(opt.id)
                    onClose()
                  }}
                />
              ))}
            </View>
            <PrimaryButton label="Cancelar" variant="ghost" onPress={onClose} />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
