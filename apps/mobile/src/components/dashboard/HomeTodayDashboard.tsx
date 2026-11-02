import { useMemo, useState, type ReactNode } from 'react'
import { View, TextInput, Pressable, ScrollView } from 'react-native'
import { Icon } from '../../ui/Icon'
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass'
import { useRouter } from 'expo-router'
import {
  searchHomeItems,
  type FinanceTx,
  type MobileTask,
} from '@simply-life/shared'
import { Text, ProgressRing } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useElo } from '../../hooks/useElo'
import { useWebBox } from './web/webBox'
import { useInPanel } from '../../ui/Panel'
import { LifeGoalMicroLine, LifeGoalSheet } from './LifeGoalSheet'

type Props = {
  tasks: MobileTask[]
  finance: FinanceTx[]
  pending: number
  doneToday: number
  /** Ritual da manhã — após os três quadrados de resumo. */
  ritualSlot?: ReactNode
}

/** Bloco principal do Início — busca, progresso, glances e ritual. */
export function HomeTodayDashboard({
  tasks,
  finance,
  pending,
  doneToday,
  ritualSlot,
}: Props)
{
  const { colors, elevation, mode } = useTheme()
  const inPanel = useInPanel()
  const webBox = useWebBox()
  // dentro de um Panel (grade da web) a caixa é do Panel
  const box = inPanel ? { borderRadius: 0, padding: 0, backgroundColor: 'transparent' } : webBox
  const router = useRouter()
  const elo = useElo()
  const [query, setQuery] = useState('')
  const [goalOpen, setGoalOpen] = useState(false)

  const todayTotal = pending + doneToday
  const pct = todayTotal > 0 ? Math.round((doneToday / todayTotal) * 100) : 0

  const hits = useMemo(
    () => searchHomeItems(query, tasks, finance, 16),
    [query, tasks, finance],
  )

  const searching = query.trim().length > 0

  const cancelSearch = () => setQuery('')

  const openHit = (hit: ReturnType<typeof searchHomeItems>[number]) =>
  {
    if (hit.kind === 'task')
    {
      router.push(`/task/${hit.id}`)
      return
    }
    router.push('/(tabs)/financeiro')
  }

  return (
    <View style={{ gap: 16 }}>
      <LifeGoalSheet visible={goalOpen} onClose={() => setGoalOpen(false)} />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 44,
          borderRadius: 12,
          paddingHorizontal: 12,
          gap: 8,
          backgroundColor: colors.fill,
          ...(inPanel
            ? { borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, minHeight: 40 }
            : box ? { ...box, paddingVertical: 0, minHeight: 44 } : null),
        }}
      >
        <MagnifyingGlassIcon size={18} color={colors.inkMuted} />
        <TextInput
          placeholder="Buscar tarefas, gastos…"
          placeholderTextColor={colors.inkFaint}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={{
            flex: 1,
            fontSize: 15,
            color: colors.ink,
            paddingVertical: 10,
          }}
        />
        {searching ? (
          <Pressable
            onPress={cancelSearch}
            accessibilityLabel="Cancelar busca"
            hitSlop={8}
          >
            <Icon name="close" size={20} color={colors.inkMuted} />
          </Pressable>
        ) : null}
      </View>

      {searching ? (
        <View
          style={{
            borderRadius: 20,
            padding: 20,
            gap: 16,
            backgroundColor: colors.featureBg,
            minHeight: 200,
            ...box,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="caption" style={{ color: colors.featureMuted }}>
              {hits.length > 0 ? `${hits.length} resultado(s)` : 'Busca'}
            </Text>
            <Pressable onPress={cancelSearch} accessibilityLabel="Fechar busca" hitSlop={8}>
              <Icon name="close-circle" size={22} color={colors.featureMuted} />
            </Pressable>
          </View>

          {hits.length === 0 ? (
            <Text variant="title" style={{ color: colors.featureInk, fontSize: 18 }}>
              Nenhum resultado para “{query.trim()}”
            </Text>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 360 }}>
              {hits.map((hit) => (
                <Pressable
                  key={`${hit.kind}-${hit.id}`}
                  onPress={() => openHit(hit)}
                  style={{
                    minHeight: 52,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.hairline,
                    gap: 6,
                  }}
                >
                  <Text variant="bodyStrong" style={{ color: colors.featureInk }} numberOfLines={1}>
                    {hit.title}
                  </Text>
                  <Text variant="caption" style={{ color: colors.featureMuted }} numberOfLines={1}>
                    {hit.subtitle}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        <>
          <View
            style={{
              borderRadius: 16,
              padding: 16,
              gap: 16,
              backgroundColor: colors.elevated,
              ...(inPanel ? null : elevation.card),
              ...box,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <ProgressRing
                progress={pct}
                size={64}
                strokeWidth={7}
                color={colors.axelFill}
                trackColor={colors.fill}
                centerLabel={`${pct}%`}
                labelColor={colors.ink}
              />
              <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                <Text variant="caption" muted>Hoje</Text>
                <Text variant="bodyStrong" style={{ fontSize: 18, lineHeight: 24 }} numberOfLines={1}>
                  {todayTotal > 0
                    ? `${doneToday} de ${todayTotal} concluídas`
                    : pending > 0
                      ? `${pending} em aberto`
                      : 'Nenhuma tarefa para hoje'}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopColor: colors.hairline,
                paddingTop: 12,
              }}
            >
              {[
                { value: pending, label: 'Abertas' },
                { value: doneToday, label: 'Feitas' },
                { value: elo.atual, label: elo.atual === 1 ? 'Dia de elo' : 'Dias de elo' },
              ].map((s, i) => (
                <View
                  key={s.label}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    gap: 2,
                    paddingLeft: i === 0 ? 0 : 12,
                    borderLeftWidth: i === 0 ? 0 : 1,
                    borderLeftColor: colors.hairline,
                  }}
                >
                  <Text variant="bodyStrong" style={{ fontSize: 20, lineHeight: 26 }}>
                    {s.value}
                  </Text>
                  <Text variant="micro" muted numberOfLines={1}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
            <LifeGoalMicroLine onPress={() => setGoalOpen(true)} />
          </View>

          {/* Os três quadradinhos (pendentes, feitas, hábitos) saíram: repetiam o progresso acima. */}
          {ritualSlot}
        </>
      )}
    </View>
  )
}
