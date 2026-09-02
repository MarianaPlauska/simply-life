import { useMemo, useState, useEffect } from 'react'
import { View, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { minutesToLabel } from '@simply-life/shared'
import { Screen, Text, Card, PillTabs, PrimaryButton, ListRow } from '../../src/ui'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useDataStore } from '../../src/store/dataStore'
import { useAuthStore } from '../../src/store/authStore'

type DetailTab = 'status' | 'detalhes' | 'anotacoes'

export default function TaskDetailScreen()
{
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors, space } = useTheme()
  const tasks = useDataStore((s) => s.tasks)
  const toggleTaskCheck = useDataStore((s) => s.toggleTaskCheck)
  const isGuest = useAuthStore((s) => s.isGuest)
  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id])
  const [tab, setTab] = useState<DetailTab>('status')
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() =>
  {
    if (!running) return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [running])

  if (!task)
  {
    return (
      <Screen>
        <Text variant="section">Tarefa não encontrada</Text>
        <PrimaryButton label="Voltar" onPress={() => router.back()} />
      </Screen>
    )
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <Screen scroll>
      <View style={{ gap: space.lg, paddingTop: space.md }}>
        <Pressable onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text variant="label" color={colors.axel}>
            Fechar
          </Text>
        </Pressable>

        <View>
          <Text variant="caption" muted>
            {task.horaMinutos != null ? minutesToLabel(task.horaMinutos) : 'Sem horário'}
          </Text>
          <Text variant="hero">{task.titulo}</Text>
        </View>

        <PillTabs
          tabs={[
            { id: 'status', label: 'Status' },
            { id: 'detalhes', label: 'Detalhes' },
            { id: 'anotacoes', label: 'Anotações' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'status' && (
          <Card style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xl }}>
            <Text variant="caption" muted>
              Temporizador
            </Text>
            <Text variant="hero" style={{ fontVariant: ['tabular-nums'] }}>
              {mm}:{ss}
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm, width: '100%' }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={running ? 'Pausar' : 'Iniciar'}
                  onPress={() => setRunning((r) => !r)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Zerar"
                  variant="ghost"
                  onPress={() =>
                  {
                    setRunning(false)
                    setSeconds(0)
                  }}
                />
              </View>
            </View>
          </Card>
        )}

        {tab === 'detalhes' && (
          <Card style={{ gap: space.sm, paddingVertical: space.sm }}>
            <Text variant="section" style={{ paddingHorizontal: space.md, paddingTop: space.sm }}>
              Checklist
            </Text>
            {task.checklist.length === 0 ? (
              <Text variant="body" muted style={{ padding: space.md }}>
                Sem itens ainda.
              </Text>
            ) : (
              task.checklist.map((c) => (
                <ListRow
                  key={c.id}
                  title={c.texto}
                  subtitle={c.feito ? 'Feito' : 'Pendente'}
                  onPress={() => void toggleTaskCheck(task.id, c.id, !c.feito, isGuest)}
                />
              ))
            )}
            <View style={{ padding: space.md }}>
              <Text variant="caption" muted>
                Estimativa: {task.estimativaMinutos} min · Prioridade {task.prioridade}
              </Text>
            </View>
          </Card>
        )}

        {tab === 'anotacoes' && (
          <Card>
            <Text variant="section">Anotação</Text>
            <Text variant="body" style={{ marginTop: space.md }}>
              {task.anotacao || 'Nenhuma anotação ainda.'}
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  )
}
