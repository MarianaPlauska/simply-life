import { Modal, Pressable, View } from 'react-native'
import {
  ACTIVE_DUE_BUCKETS,
  DUE_BUCKET_LABELS,
  type DueBucket,
} from '@simply-life/shared'
import { Card, Text, PrimaryButton, Chip } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  visible: boolean
  onClose: () => void
  onPick: (bucket: DueBucket) => void
}

export function MoveTaskSheet({ visible, onClose, onPick }: Props)
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
            <Text variant="section">Mover para</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ACTIVE_DUE_BUCKETS.map((id) => (
                <Chip
                  key={id}
                  label={DUE_BUCKET_LABELS[id]}
                  onPress={() =>
                  {
                    onPick(id)
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
