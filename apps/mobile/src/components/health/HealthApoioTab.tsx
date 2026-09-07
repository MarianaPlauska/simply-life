import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { TCC_JOURNEYS } from '@simply-life/shared'
import { Card, Text, SectionHeader, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { CrisisSupportCard } from './CrisisSupportCard'
import { HealthNeuroFocusPanel } from './HealthNeuroFocusPanel'
import { loadRecentTccItems, type TccRecentItem } from '../../lib/tccPersist'

function recentLabel(item: TccRecentItem): string
{
  if (item.kind === 'thought')
  {
    return item.entry.automaticThought.trim() || item.entry.situation.trim() || 'Registro de pensamento'
  }
  if (item.kind === 'behavior')
  {
    return item.entry.action.trim() || 'Ativação comportamental'
  }
  const step = item.entry.steps.find((s) => s.id === item.entry.chosenStepId)
  return step?.label.trim() || item.entry.situation.trim() || 'Exposição gradual'
}

function recentKindLabel(item: TccRecentItem): string
{
  if (item.kind === 'thought') return 'Pensamento'
  if (item.kind === 'behavior') return 'Ativação'
  return 'Exposição'
}

/** Saúde → Apoio: crise, foco/TDAH e exercícios de TCC. */
export function HealthApoioTab()
{
  const { colors, space, radius } = useTheme()
  const router = useRouter()
  const [recent, setRecent] = useState<TccRecentItem[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () =>
  {
    setLoading(true)
    setRecent(await loadRecentTccItems(8))
    setLoading(false)
  }, [])

  useEffect(() =>
  {
    void reload()
  }, [reload])

  return (
    <View style={{ gap: space.md }}>
      <Card tone="elevated" style={{ gap: space.sm, borderRadius: 18 }}>
        <Text variant="caption" color={colors.health} style={{ fontWeight: '700' }}>
          Apoio emocional
        </Text>
        <Text variant="body" muted>
          Exercícios de TCC são opt-in e organizam o pensamento. Não substituem psicoterapia,
          psiquiatria nem diagnóstico. Em sofrimento intenso, use o CVV abaixo.
        </Text>
      </Card>

      <CrisisSupportCard />

      <HealthNeuroFocusPanel />

      <Card tone="elevated" style={{ gap: space.md, borderRadius: 18 }}>
        <SectionHeader
          title="Exercícios de TCC"
          subtitle="Jornadas curtas; ativação comportamental cria tarefa no Kanban"
        />
        {TCC_JOURNEYS.map((journey) => (
          <PressableScale
            key={journey.id}
            onPress={() => router.push(journey.route as '/tcc/thought-record' | '/tcc/behavioral-activation' | '/tcc/gradual-exposure')}
            style={{
              minHeight: 56,
              padding: space.md,
              borderRadius: radius.lg,
              gap: 4,
              backgroundColor: colors.axelMuted,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <Text variant="bodyStrong">{journey.title}</Text>
            <Text variant="caption" muted>
              {journey.subtitle}
            </Text>
            <Text variant="caption" color={colors.axel}>
              ~{journey.durationMin} min · {journey.steps} passos
            </Text>
          </PressableScale>
        ))}
      </Card>

      <Card tone="elevated" style={{ gap: space.sm, borderRadius: 18 }}>
        <SectionHeader title="Registros recentes" subtitle="Últimos exercícios concluídos" />
        {loading ? (
          <Text variant="caption" muted>Carregando…</Text>
        ) : recent.length === 0 ? (
          <Text variant="caption" muted>
            Nenhum exercício ainda. Comece por registro de pensamento ou ativação comportamental.
          </Text>
        ) : (
          recent.map((row) => (
            <View
              key={`${row.kind}-${row.entry.id}`}
              style={{
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: colors.hairline,
                gap: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text variant="caption" muted>
                  {new Date(row.entry.createdAt).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text variant="caption" color={colors.health}>
                  {recentKindLabel(row)}
                </Text>
              </View>
              <Text variant="body" numberOfLines={2}>
                {recentLabel(row)}
              </Text>
            </View>
          ))
        )}
      </Card>
    </View>
  )
}
