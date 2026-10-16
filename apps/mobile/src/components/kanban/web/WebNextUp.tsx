import { View } from 'react-native'
import { buildOrchestrationHints, classifyDueBucket, type MobileTask } from '@simply-life/shared'
import { Icon } from '../../../ui/Icon'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { useTaskEvolveStore } from '../../../store/taskEvolveStore'
import { useActionableTasks } from '../../../hooks/useActionableTasks'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { LEX, SECTION_LABEL } from './kanbanWeb'

/** "Agora": a próxima tarefa sugerida, com concluir e abrir à mão. Sem caixa própria (fica num Panel). */
export function WebNextUp({ tasks, inline }: { tasks: MobileTask[]; inline?: boolean })
{
  const { colors } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const openEvolve = useTaskEvolveStore((s) => s.open)
  // próxima ação nunca é algo que está esperando outra pessoa
  const actionable = useActionableTasks(tasks)
  const top = buildOrchestrationHints(actionable)[0]
  const overdue = tasks.filter(
    (t) => t.status !== 'done' && classifyDueBucket(t.dataVencimento, t.status) === 'vencido',
  ).length

  if (!top)
  {
    return (
      <View style={{ gap: 6 }}>
        <Text style={[SECTION_LABEL, { color: colors.inkMuted }]}>Agora</Text>
        <Text style={[LEX.regular, { fontSize: 15, lineHeight: 22, color: colors.ink }]}>Nada pendente. Aproveite o respiro.</Text>
      </View>
    )
  }

  const buttons = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <WebHoverable
        onPress={() => void toggleTaskDone(top.taskId, isGuest)}
        accessibilityLabel="Concluir"
        style={(hovered) => webStyle({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 34,
          paddingHorizontal: 14,
          borderRadius: 8,
          backgroundColor: colors.axelFill,
          opacity: hovered ? 0.9 : 1,
          cursor: 'pointer',
        })}
      >
        <Icon name="checkmark" size={15} color={colors.axelOnFill} />
        <Text style={[LEX.medium, { fontSize: 14, lineHeight: 20, color: colors.axelOnFill }]}>Concluir</Text>
      </WebHoverable>
      <WebHoverable
        onPress={() => openEvolve(top.taskId)}
        accessibilityLabel="Abrir tarefa"
        style={(hovered) => webStyle({
          height: 34,
          justifyContent: 'center',
          paddingHorizontal: 14,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: hovered ? colors.hairlineStrong : colors.hairline,
          cursor: 'pointer',
        })}
      >
        <Text style={[LEX.medium, { fontSize: 14, lineHeight: 20, color: colors.ink }]}>Abrir</Text>
      </WebHoverable>
    </View>
  )

  if (inline)
  {
    // tela média: uma faixa só, sem roubar a altura da lista
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Icon name="flash-outline" size={18} color={colors.axel} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={[LEX.medium, { fontSize: 16, lineHeight: 22, color: colors.ink }]} numberOfLines={1}>
            <Text style={[SECTION_LABEL, { fontSize: 14, color: colors.inkMuted }]}>Agora  </Text>
            {top.titulo}
          </Text>
          <Text style={[LEX.regular, { fontSize: 14, lineHeight: 20, color: overdue > 0 ? colors.danger : colors.inkMuted }]} numberOfLines={1}>
            {[top.rationale, overdue > 0 ? `${overdue} atrasada${overdue === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {buttons}
      </View>
    )
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="flash-outline" size={16} color={colors.axel} />
        <Text style={[SECTION_LABEL, { flex: 1, color: colors.inkMuted }]}>Agora</Text>
        {overdue > 0 ? (
          <Text style={[LEX.medium, { fontSize: 13, lineHeight: 18, color: colors.danger }]}>
            {overdue} atrasada{overdue === 1 ? '' : 's'}
          </Text>
        ) : null}
      </View>
      <View style={{ gap: 4 }}>
        <Text style={[LEX.medium, { fontSize: 17, lineHeight: 24, color: colors.ink }]} numberOfLines={2}>
          {top.titulo}
        </Text>
        {top.rationale ? (
          <Text style={[LEX.regular, { fontSize: 14, lineHeight: 20, color: colors.inkMuted }]} numberOfLines={2}>
            {top.rationale}
          </Text>
        ) : null}
      </View>
      {buttons}
    </View>
  )
}
