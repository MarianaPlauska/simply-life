import { View, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Icon } from '../../ui/Icon'
import {
  minutesToLabel,
  taskMarkColor,
  timelineIconForTask,
  type MobileTask,
} from '@simply-life/shared'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useKanbanListsStore } from '../../store/kanbanListsStore'

function statusLabel(task: MobileTask): string
{
  if (task.status === 'done') return 'Concluída'
  if (task.status === 'doing') return 'Em andamento'
  return 'A fazer'
}

type Props = {
  task: MobileTask
  onToggle: () => void
}

/** Linha da timeline do dia (a cor do botão = urgência/pasta). */
export function KanbanDayCard({ task, onToggle }: Props)
{
  const { colors, chart } = useTheme()
  const router = useRouter()
  const lists = useKanbanListsStore((s) => s.lists)
  const mark = taskMarkColor(task, lists, colors.danger, chart)
  const icon = timelineIconForTask(task) as keyof typeof Icon.glyphMap
  const pct = Math.round((task.progresso ?? 0) * 100)

  const done = task.status === 'done'
  // linha direto no fundo: botão redondo na cor da marca, texto e uma barra fina de progresso
  return (
    <Pressable
      onPress={() => router.push(`/task/${task.id}`)}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 64,
        paddingVertical: 10,
        backgroundColor: pressed ? colors.fill : 'transparent',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.hairline,
      })}
    >
      <PressableScale
        accessibilityLabel={done ? 'Reabrir' : 'Concluir'}
        onPress={onToggle}
        hitSlop={8}
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          backgroundColor: done ? colors.health : `${mark}2E`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={done ? 'checkmark' : icon} size={16} color={done ? colors.canvas : mark} />
      </PressableScale>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text
          variant="bodyStrong"
          numberOfLines={2}
          style={{ color: done ? colors.inkMuted : colors.ink, textDecorationLine: done ? 'line-through' : 'none' }}
        >
          {task.titulo}
        </Text>
        <Text variant="caption" muted numberOfLines={1}>
          {[task.horaMinutos != null ? minutesToLabel(task.horaMinutos) : 'Sem horário', statusLabel(task), `${pct}%`].join(' · ')}
        </Text>
        {pct > 0 && !done ? (
          <View style={{ height: 2, borderRadius: 999, backgroundColor: colors.hairline, overflow: 'hidden', marginTop: 2 }}>
            <View style={{ width: `${pct}%`, height: '100%', backgroundColor: mark }} />
          </View>
        ) : null}
      </View>
    </Pressable>
  )
}
