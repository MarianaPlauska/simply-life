import { Modal, Pressable, ScrollView, View } from 'react-native'
import { describeDayPt, groupDecisionsByKind, type AxelDecisionEvent } from '@simply-life/shared'
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
              maxHeight: 520,
            }}
          >
            <ScrollView style={{ flexGrow: 0, maxHeight: 400 }} contentContainerStyle={{ gap: space.md }}>
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
                    <Text key={ev.id} variant="caption" muted style={ev.undone_at ? { opacity: 0.55 } : undefined}>
                      {ev.from_date !== undefined && (ev.from_date || ev.to_date)
                        ? `${describeDayPt(ev.from_date ?? null)} → ${describeDayPt(ev.to_date ?? null)} · `
                        : ''}
                      {ev.rationale ?? ev.kind}
                      {ev.undone_at ? ' (desfeita)' : ''}
                    </Text>
                  ))}
                </View>
              ))
            )}
            </ScrollView>
            <PrimaryButton label="Fechar" variant="dismiss" onPress={onClose} />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
