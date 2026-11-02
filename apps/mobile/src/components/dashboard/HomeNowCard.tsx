import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { classifyDueBucket, type MobileTask } from '@simply-life/shared'
import { GroupedList, GroupedRow, RowGlyph, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useCaptureStore } from '../../store/captureStore'

const EVENING_HOUR = 18

function hourLabel(total: number): string
{
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function taskSubtitle(task: MobileTask): string
{
  if (classifyDueBucket(task.dataVencimento, task.status) === 'vencido')
  {
    return 'Passou da data'
  }
  if (task.horaMinutos != null)
  {
    return `Hoje às ${hourLabel(task.horaMinutos)}`
  }
  return 'Para hoje'
}

/**
 * Uma linha só: a próxima tarefa, ou um convite para planejar.
 * Sem anel de 0% e sem cartão vazio.
 */
export function HomeNowCard({ task }: { task: MobileTask | null })
{
  const { colors } = useTheme()
  const router = useRouter()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const evening = new Date().getHours() >= EVENING_HOUR

  return (
    <View style={{ gap: 8 }}>
      <Text variant="section">Agora</Text>
      <GroupedList>
        {task ? (
          <GroupedRow
            leading={<RowGlyph name="today" color={colors.tasks} />}
            title={task.titulo}
            subtitle={taskSubtitle(task)}
            onPress={() => router.push(`/task/${task.id}`)}
          />
        ) : evening ? (
          <GroupedRow
            leading={<RowGlyph name="moon" color={colors.tasks} />}
            title="Planejar amanhã"
            subtitle="Uns 3 minutos com o Axel"
            onPress={() => router.push('/planejar-amanha')}
          />
        ) : (
          <GroupedRow
            leading={<RowGlyph name="add" color={colors.tasks} />}
            title="Planejar o dia"
            subtitle="Escolha a próxima coisa para fazer"
            onPress={() => openCapture('task')}
          />
        )}
      </GroupedList>
    </View>
  )
}
