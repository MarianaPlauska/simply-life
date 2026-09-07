import { Modal, Pressable, View } from 'react-native'
import { groupDecisionsByKind, type AxelDecisionEvent } from '@simply-life/shared'
import { Card, Text, PrimaryButton, EmptyState } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  visible: boolean
  events: AxelDecisionEvent[]
  onClose: () => void
}

export function KanbanDecisionLogSheet({ visible, events, onClose }: Props)
{
  const { space } = useTheme()
  const groups = groupDecisionsByKind(events)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(26, 24, 22, 0.72)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card
            tone="elevated"
            style={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              gap: space.md,
              maxHeight: 480,
            }}
          >
            <Text variant="section">Decision log</Text>
            {groups.length === 0 ? (
              <EmptyState
                title="Sem decisões ainda"
                body="O orquestrador registra promoções e adiamentos aqui."
              />
            ) : (
              groups.map((g) => (
                <View key={g.kind} style={{ gap: 4 }}>
                  <Text variant="bodyStrong">{g.label}</Text>
                  {g.items.slice(0, 4).map((ev) => (
                    <Text key={ev.id} variant="caption" muted>
                      {ev.rationale ?? ev.kind}
                    </Text>
                  ))}
                </View>
              ))
            )}
            <PrimaryButton label="Fechar" variant="dismiss" onPress={onClose} />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
