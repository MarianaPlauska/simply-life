import { useCallback, useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { TCC_JOURNEYS } from '@simply-life/shared'
import { Text, SectionHeader, PressableScale } from '../../ui'
import { HomeCollapsible } from '../dashboard/HomeCollapsible'
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

      {/* 3. Consulta e ajustes: um bloco recolhido */}
      <HomeCollapsible
        title="Mais apoio"
        subtitle="Exercícios de TCC, registros e foco"
        pill="abrir"
        pillColor={colors.health}
      >
        <View style={{ gap: space.lg, paddingTop: space.sm }}>
          <View style={{ gap: space.md }}>
            <SectionHeader
              title="Exercícios de TCC"
              subtitle="Jornadas curtas e opcionais. Organizam o pensamento, não substituem psicoterapia nem diagnóstico."
            />
            {TCC_JOURNEYS.map((journey) => (
              <PressableScale
                key={journey.id}
                onPress={() => router.push(journey.route as '/tcc/thought-record' | '/tcc/behavioral-activation' | '/tcc/gradual-exposure')}
                style={{
                  minHeight: 56,
                  padding: space.md,
                  borderRadius: 14,
                  gap: 6,
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
          </View>

          <View
            style={{
              gap: space.sm,
              paddingTop: space.md,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.hairline,
            }}
          >
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
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
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
          </View>

          <View
            style={{
              paddingTop: space.md,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.hairline,
            }}
          >
            <HealthNeuroFocusPanel bare />
          </View>
        </View>
      </HomeCollapsible>
    </View>
  )
}
