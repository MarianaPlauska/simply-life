import { View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Icon } from '../../ui/Icon'
import {
  inferLifeCategory,
  minutesToLabel,
  taskMarkColor,
  timelineIconForTask,
  type MobileTask,
} from '@simply-life/shared'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useKanbanListsStore } from '../../store/kanbanListsStore'

type TintKey = 'brandMuted' | 'healthMuted' | 'financeMuted' | 'tasksMuted'

/** Fundo suave por categoria de vida (tokens do tema, claro e escuro). */
const CATEGORY_TINT: Record<string, TintKey> = {
  importante: 'brandMuted',
  saude: 'healthMuted',
  crescimento: 'financeMuted',
  carreira: 'tasksMuted',
}

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

/** Card pastel da timeline do dia (marca esquerda = urgência/pasta). */
export function KanbanDayCard({ task, onToggle }: Props)
{
  const { colors, chart, mode } = useTheme()
  const router = useRouter()
  const lists = useKanbanListsStore((s) => s.lists)
  const cat = inferLifeCategory(task)
  const bg = colors[CATEGORY_TINT[cat] ?? 'tasksMuted']
  const mark = taskMarkColor(task, lists, colors.danger, chart)
  const icon = timelineIconForTask(task) as keyof typeof Icon.glyphMap
  const pct = Math.round((task.progresso ?? 0) * 100)

  return (
    <Pressable
      onPress={() => router.push(`/task/${task.id}`)}
      style={{
        flex: 1,
        flexDirection: 'row',
        borderRadius: 20,
        backgroundColor: bg,
        overflow: 'hidden',
        minHeight: 88,
      }}
    >
      <View style={{ width: 5, backgroundColor: mark }} />
      <View style={{ flex: 1, padding: 12, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="micro" style={{ fontWeight: '700', color: colors.inkMuted }}>
            {statusLabel(task)}
          </Text>
          <Text variant="micro" muted>
            {pct}%
          </Text>
        </View>
        <View
          style={{
            height: 3,
            borderRadius: 999,
            backgroundColor: colors.hairline,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.max(6, pct)}%`,
              height: '100%',
              backgroundColor: colors.ink,
              borderRadius: 999,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <PressableScale
            accessibilityLabel={task.status === 'done' ? 'Reabrir' : 'Concluir'}
            onPress={onToggle}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: mode === 'dark' ? colors.elevated : colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={task.status === 'done' ? 'checkmark' : icon} size={16} color={colors.ink} />
          </PressableScale>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={2} style={{ fontSize: 14 }}>
              {task.titulo}
            </Text>
            <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 11 }}>
              {task.horaMinutos != null ? minutesToLabel(task.horaMinutos) : 'Sem horário'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}
