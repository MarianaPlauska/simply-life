import { useMemo, useState, useEffect } from 'react'
import { View, Pressable, Alert, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Svg, { Circle } from 'react-native-svg'
import {
  minutesToLabel,
  classifyDueBucket,
  applyTaskList,
  mergeEvoTags,
  stripTaskDisplayNotes,
  taskListId,
  taskProgressPct,
  type DueBucket,
} from '@simply-life/shared'
import { Screen, Text, Card, PillTabs, PrimaryButton, Field } from '../../src/ui'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useDataStore } from '../../src/store/dataStore'
import { useAuthStore } from '../../src/store/authStore'
import { MoveTaskSheet } from '../../src/components/kanban/MoveTaskSheet'
import { TaskDetailEditor } from '../../src/components/kanban/TaskDetailEditor'
import { TaskTimerPanel } from '../../src/components/kanban/TaskTimerPanel'

type DetailTab = 'analise' | 'status' | 'detalhes' | 'anotacoes'

/** Anel pontilhado - ref dashboard 22% minimalista */
function DottedProgressRing({
  progress,
  size = 220,
  color,
  track,
}: {
  progress: number
  size?: number
  color: string
  track: string
})
{
  const dots = 60
  const r = size / 2 - 14
  const cx = size / 2
  const cy = size / 2
  const filled = Math.round((Math.max(0, Math.min(100, progress)) / 100) * dots)

  return (
    <Svg width={size} height={size}>
      {Array.from({ length: dots }).map((_, i) =>
      {
        const angle = (i / dots) * Math.PI * 2 - Math.PI / 2
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        const on = i < filled
        return (
          <Circle
            key={`d-${i}`}
            cx={x}
            cy={y}
            r={on ? 2.6 : 1.8}
            fill={on ? color : track}
            opacity={on ? 1 : 0.28}
          />
        )
      })}
    </Svg>
  )
}

function weekLabel(ref = new Date()): string
{
  const start = new Date(ref.getFullYear(), 0, 1)
  const week = Math.ceil((((ref.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7)
  return `Semana ${week}`
}

function daysUntil(iso: string | null): number | null
{
  if (!iso) return null
  const due = new Date(`${iso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(due.getTime())) return null
  const now = new Date()
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const b = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export default function TaskDetailScreen()
{
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors, space } = useTheme()
  const tasks = useDataStore((s) => s.tasks)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const moveTaskBucket = useDataStore((s) => s.moveTaskBucket)
  const patchTaskNotes = useDataStore((s) => s.patchTaskNotes)
  const removeTask = useDataStore((s) => s.removeTask)
  const isGuest = useAuthStore((s) => s.isGuest)
  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id])
  const [tab, setTab] = useState<DetailTab>('detalhes')
  const [notes, setNotes] = useState('')
  const [moveOpen, setMoveOpen] = useState(false)

  useEffect(() =>
  {
    if (task) setNotes(stripTaskDisplayNotes(task.anotacao || ''))
  }, [task])

  if (!task)
  {
    return (
      <Screen>
        <Text variant="section">Tarefa não encontrada</Text>
        <PrimaryButton label="Voltar" variant="ghost" onPress={() => router.back()} />
      </Screen>
    )
  }

  const checklistDone = task.checklist.filter((c) => c.feito).length
  const checklistTotal = task.checklist.length
  const progress = taskProgressPct(task)

  const remaining = daysUntil(task.dataVencimento)
  const bucket = classifyDueBucket(task.dataVencimento, task.status)

  return (
    <Screen scroll>
      <View style={{ gap: space.lg, paddingTop: space.md }}>
        <Pressable onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text variant="label" color={colors.axel}>
            Fechar
          </Text>
        </Pressable>

        {tab === 'analise' ? (
          <View style={{ gap: 6 }}>
            <Text
              variant="hero"
              style={{
                fontSize: 32,
                letterSpacing: -0.8,
                fontFamily: 'Fraunces_500Medium',
              }}
            >
              Dashboard
            </Text>
            <Text variant="caption" muted>
              {task.titulo}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 4 }}>
            <Text variant="caption" muted>
              Análise da tarefa
            </Text>
            <Text variant="hero" style={{ fontSize: 28, letterSpacing: -0.6 }}>
              {task.titulo}
            </Text>
            <Text variant="caption" muted>
              {task.horaMinutos != null ? minutesToLabel(task.horaMinutos) : 'Sem horário'}
              {task.dataVencimento ? ` · ${task.dataVencimento.slice(0, 10)}` : ''}
            </Text>
          </View>
        )}

        <PillTabs
          tabs={[
            { id: 'detalhes', label: 'Detalhes' },
            { id: 'anotacoes', label: 'Notas' },
            { id: 'analise', label: 'Análise' },
            { id: 'status', label: 'Tempo' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'analise' ? (
          <View style={{ gap: space.lg, alignItems: 'center', paddingVertical: space.sm }}>
            <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: space.md }}>
              <DottedProgressRing
                progress={progress}
                size={230}
                color={colors.ink}
                track={colors.hairline}
              />
              <View style={{ position: 'absolute', alignItems: 'center', gap: 2 }}>
                <Text
                  variant="hero"
                  style={{
                    fontSize: 52,
                    letterSpacing: -2,
                    fontFamily: 'Fraunces_500Medium',
                  }}
                >
                  {progress}%
                </Text>
              </View>
            </View>

            <View style={{ alignItems: 'center', gap: 4, marginBottom: space.sm }}>
              <Text variant="caption" muted style={{ textAlign: 'center' }}>
                da tarefa concluída
              </Text>
              <Text variant="caption" muted style={{ textAlign: 'center' }}>
                {checklistTotal > 0
                  ? `${checklistDone} de ${checklistTotal} itens · prioridade ${task.prioridade}`
                  : task.status === 'done'
                    ? 'Tarefa concluída'
                    : `Status ${task.status} · prioridade ${task.prioridade}`}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <View
                style={{
                  flex: 1,
                  borderRadius: 18,
                  gap: 8,
                  padding: 16,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                }}
              >
                <Text variant="caption" muted>
                  Semana atual
                </Text>
                <Text variant="bodyStrong" style={{ fontSize: 20, letterSpacing: -0.3 }}>
                  {weekLabel()}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  borderRadius: 18,
                  gap: 8,
                  padding: 16,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                }}
              >
                <Text variant="caption" muted>
                  Dias restantes
                </Text>
                <Text
                  variant="bodyStrong"
                  style={{
                    fontSize: 20,
                    letterSpacing: -0.3,
                    color: remaining != null && remaining < 0 ? colors.danger : colors.ink,
                  }}
                >
                  {remaining == null ? '-' : remaining < 0 ? `${Math.abs(remaining)} atraso` : String(remaining)}
                </Text>
              </View>
            </View>

            <View
              style={{
                width: '100%',
                borderRadius: 18,
                gap: 8,
                padding: 16,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.hairline,
              }}
            >
              <Text variant="caption" muted>
                Próximo prazo
              </Text>
              <Text variant="bodyStrong" style={{ fontSize: 18, letterSpacing: -0.2 }}>
                {task.dataVencimento?.slice(0, 10) ?? 'Sem data definida'}
              </Text>
              <Text variant="caption" muted>
                {bucket.replace('_', ' ')}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={task.status === 'done' ? 'Reabrir' : 'Concluir'}
                  onPress={() => void toggleTaskDone(task.id, isGuest)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Mover"
                  variant="secondary"
                  onPress={() => setMoveOpen(true)}
                />
              </View>
            </View>
            <PrimaryButton
              label="Executar agora"
              variant="ghost"
              onPress={() => router.push('/foco')}
              style={{ width: '100%' }}
            />
          </View>
        ) : null}

        {tab === 'status' ? <TaskTimerPanel /> : null}

        {tab === 'detalhes' ? (
          <TaskDetailEditor task={task} isGuest={isGuest} />
        ) : null}

        {tab === 'anotacoes' ? (
          <Card style={{ gap: space.md }}>
            <Text variant="section">Anotação</Text>
            <Field
              label="Notas"
              value={notes}
              onChangeText={setNotes}
              onBlur={() =>
                patchTaskNotes(
                  task.id,
                  applyTaskList(mergeEvoTags(notes, task.anotacao), taskListId(task)),
                )
              }
              multiline
              placeholder="Contexto e decisões — não é lista de to-dos"
            />
            <PrimaryButton
              label="Salvar notas"
              onPress={() =>
                patchTaskNotes(
                  task.id,
                  applyTaskList(mergeEvoTags(notes, task.anotacao), taskListId(task)),
                )
              }
            />
          </Card>
        ) : null}

        {tab === 'detalhes' && task.status !== 'done' ? (
          <PrimaryButton
            label="Excluir tarefa"
            variant="danger"
            onPress={() =>
            {
              const go = () =>
              {
                void removeTask(task.id, isGuest)
                router.back()
              }
              if (Platform.OS === 'web')
              {
                if (typeof window !== 'undefined' && window.confirm('Sai da lista. O histórico de feitas permanece.'))
                {
                  go()
                }
                return
              }
              Alert.alert(
                'Excluir tarefa',
                'Sai da lista. O histórico de feitas permanece.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Excluir', style: 'destructive', onPress: go },
                ],
              )
            }}
          />
        ) : null}
      </View>
      <MoveTaskSheet
        visible={moveOpen}
        onClose={() => setMoveOpen(false)}
        onPick={(bucketPick: DueBucket) =>
        {
          void moveTaskBucket(task.id, bucketPick, isGuest)
        }}
      />
    </Screen>
  )
}
