import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { TCC_JOURNEYS } from '@simply-life/shared'
import { Text, Card, GroupedList, GroupedRow, RowGlyph } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { CrisisSupportCard } from './CrisisSupportCard'
import { HealthCalmSection } from './HealthCalmSection'
import { HealthFocusSection } from './HealthFocusSection'
import { HealthNeuroFocusPanel } from './HealthNeuroFocusPanel'
import { loadRecentTccItems, type TccRecentItem } from '../../lib/tccPersist'
import { recentKindLabel, recentLabel } from './web/tccRecent'
import { useWebDesk } from '../dashboard/web/webBox'
import { HealthApoioDesk } from './web/HealthApoioDesk'

/** Saúde → Apoio: CVV no topo, ações de agora, depois TCC e ajustes recolhidos. */
export function HealthApoioTab()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const [recent, setRecent] = useState<TccRecentItem[]>([])
  const [loading, setLoading] = useState(true)
  const desk = useWebDesk()

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

  // computador: grade de painéis, tudo à vista
  if (desk) return <HealthApoioDesk />

  return (
    <View style={{ gap: space.lg }}>
      {/* 1. Urgente: CVV sempre no topo */}
      <CrisisSupportCard />

      {/* 2. Ações de agora: acalmar e focar */}
      <View style={{ gap: space.md }}>
        <HealthCalmSection />
        <HealthFocusSection />
      </View>

      {/* 3. Exercícios e registros como listas do sistema, à vista */}
      <View style={{ gap: 8 }}>
        <Text variant="caption" muted style={{ marginLeft: 4 }}>Exercícios de TCC</Text>
        <GroupedList>
          {TCC_JOURNEYS.map((journey) => (
            <GroupedRow
              key={journey.id}
              leading={<RowGlyph name="sparkles" color={colors.axelFill} />}
              title={journey.title}
              subtitle={`~${journey.durationMin} min · ${journey.steps} passos`}
              onPress={() => router.push(journey.route as '/tcc/thought-record' | '/tcc/behavioral-activation' | '/tcc/gradual-exposure')}
            />
          ))}
        </GroupedList>
        <Text variant="caption" muted style={{ marginHorizontal: 4 }}>
          Jornadas curtas e opcionais. Organizam o pensamento, não substituem psicoterapia nem diagnóstico.
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted style={{ marginLeft: 4 }}>Registros recentes</Text>
        <GroupedList>
          {loading ? (
            <GroupedRow title="Carregando…" />
          ) : recent.length === 0 ? (
            <GroupedRow
              title="Nenhum exercício ainda"
              subtitle="Comece por registro de pensamento ou ativação comportamental"
              subtitleLines={2}
            />
          ) : (
            recent.map((row) => (
              <GroupedRow
                key={`${row.kind}-${row.entry.id}`}
                title={recentLabel(row)}
                subtitle={`${recentKindLabel(row)} · ${new Date(row.entry.createdAt).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`}
              />
            ))
          )}
        </GroupedList>
      </View>

      <Card tone="elevated" style={{ padding: 16 }}>
        <HealthNeuroFocusPanel bare />
      </Card>
    </View>
  )
}
