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
  const { colors, elevation } = useTheme()
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
          minHeight: 48,
          borderRadius: 14,
          paddingHorizontal: 14,
          gap: 12,
          backgroundColor: colors.elevated,
          ...(inPanel
            ? { borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface, minHeight: 40 }
            : box ? { ...box, paddingVertical: 0, minHeight: 44 } : elevation.card),
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
              borderRadius: 20,
              padding: 20,
              gap: 16,
              backgroundColor: colors.featureBg,
              ...box,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ flex: 1, gap: 8, minWidth: 0 }}>
                <Text variant="caption" style={{ color: colors.featureMuted }}>
                  Progresso de hoje
                </Text>
                <Text variant="title" style={{ color: colors.featureInk, fontSize: 22 }}>
                  {todayTotal > 0
                    ? `${doneToday} de ${todayTotal} concluídas`
                    : pending > 0
                      ? `${pending} em aberto`
                      : 'Nada no dia ainda'}
                </Text>
                <Text variant="caption" style={{ color: colors.featureMuted }}>
                  {todayTotal > 0
                    ? `${pct}% do dia, um passo de cada vez`
                    : 'As tarefas da sua conta aparecem aqui'}
                </Text>
              </View>
              <ProgressRing
                progress={pct}
                size={72}
                strokeWidth={7}
                color={colors.axel}
                trackColor={colors.featureTrack}
                centerLabel={`${pct}%`}
                labelColor={colors.featureInk}
              />
            </View>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <Text variant="micro" style={{ color: colors.featureMuted }}>
                  Elo de {elo.atual} dia{elo.atual === 1 ? '' : 's'}
                </Text>
                <Text variant="micro" style={{ color: colors.featureMuted }}>
                  {elo.cumpridosNaSemana} dia{elo.cumpridosNaSemana === 1 ? '' : 's'} cumprido{elo.cumpridosNaSemana === 1 ? '' : 's'} nesta semana
                </Text>
              </View>
              <LifeGoalMicroLine onPress={() => setGoalOpen(true)} />
            </View>
          </View>

          {/* Os três quadradinhos (pendentes, feitas, hábitos) saíram: repetiam o progresso acima. */}
          {ritualSlot}
        </>
      )}
    </View>
  )
}
