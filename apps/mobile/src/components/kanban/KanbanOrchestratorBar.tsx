import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { MobileTask } from '@simply-life/shared'
import { Icon } from '../../ui/Icon'
import { GroupedList, GroupedRow, PressableScale, RowGlyph, Text } from '../../ui'
import { Modal } from '../../ui/Modal'
import { useTheme } from '../../theme/ThemeProvider'
import { useBoardReplanStore } from '../../store/boardReplanStore'
import { useOrchestratorPrefsStore } from '../../store/orchestratorPrefsStore'

type Props = { tasks: MobileTask[] }

/** Ícone na linha do título: abre as ações do quadro numa ficha (reorganizar, planejar amanhã, automático). */
export function KanbanOrchestratorBar({ tasks }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const running = useBoardReplanStore((s) => s.running)
  const run = useBoardReplanStore((s) => s.run)
  const autoReplan = useOrchestratorPrefsStore((s) => s.autoReplan)
  const patchPrefs = useOrchestratorPrefsStore((s) => s.patch)
  if (!tasks.some((t) => t.status !== 'done')) return null

  return (
    <>
      <PressableScale
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Ações do quadro"
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.elevated,
        }}
      >
        <Icon name={running ? 'hourglass-outline' : 'sparkles-outline'} size={20} color={colors.axel} />
      </PressableScale>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityLabel="Fechar"
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.canvas,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: space.lg,
              paddingBottom: Math.max(insets.bottom, space.lg),
              gap: space.md,
            }}
          >
            <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.hairline }} />
            <Text variant="section">Quadro</Text>
            <GroupedList>
              <GroupedRow
                leading={<RowGlyph name="sparkles" color={colors.axel} />}
                title={running ? 'Reorganizando...' : 'Reorganizar quadro'}
                subtitle="O Axel encaixa as tarefas no seu dia"
                onPress={running ? undefined : () =>
                {
                  setOpen(false)
                  void run('manual')
                }}
              />
              <GroupedRow
                leading={<RowGlyph name="moon" color={colors.tasks} />}
                title="Planejar amanhã"
                onPress={() =>
                {
                  setOpen(false)
                  router.push('/planejar-amanha')
                }}
                chevron
              />
              <GroupedRow
                leading={<RowGlyph name="repeat" color={colors.health} />}
                title="Reorganizar sozinho"
                subtitle={autoReplan ? 'Ligado' : 'Desligado'}
                onPress={() => patchPrefs({ autoReplan: !autoReplan })}
                trailing={
                  <Icon
                    name={autoReplan ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={autoReplan ? colors.axel : colors.inkMuted}
                  />
                }
              />
            </GroupedList>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
