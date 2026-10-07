import { useEffect, useMemo, useState } from 'react'
import { Pressable, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native'
import { useRouter } from 'expo-router'
import {
  completionDays,
  eloDataPt,
  eloDetalheDoDia,
  montarMapaDeDias,
  type EloMapaCelula,
  type EloNivel,
} from '@simply-life/shared'
import { Text } from '../../ui'
import { useInPanel } from '../../ui/Panel'
import { useTheme } from '../../theme/ThemeProvider'
import { useAccents } from '../../theme/useAccents'
import { useElo } from '../../hooks/useElo'
import { useActivityStore } from '../../store/activityStore'
import { useDataStore } from '../../store/dataStore'
import { usePlanLogStore } from '../../store/planLogStore'

const LINHAS = ['Seg', '', 'Qua', '', 'Sex', '', 'Dom']
const LABEL_W = 32

type Props = {
  /** 26 na tela do elo, 12 no Início */
  semanas?: number
  /** versão do Início: título menor e toque leva à tela do elo */
  compact?: boolean
}

function faixaPt(de: string, ate: string): string
{
  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  return `${fmt(de)} a ${fmt(ate)}`
}

/**
 * Mapa de dias tipo GitHub: colunas = semanas (segunda a domingo).
 * A cor diz quanto do planejado foi feito (essenciais pesam o dobro); sem
 * plano, quantos tipos de registro o dia teve. Descanso tem marca própria.
 * Teal da paleta de gráficos, nunca o coral (que é só de ação).
 */
export function EloHeatmap({ semanas = 26, compact }: Props)
{
  const { colors } = useTheme()
  const inPanel = useInPanel()
  const accents = useAccents()
  const router = useRouter()
  const elo = useElo()
  const days = useActivityStore((s) => s.days)
  const tasks = useDataStore((s) => s.tasks)
  const plans = usePlanLogStore((s) => s.plans)
  const completions = usePlanLogStore((s) => s.completions)
  const hydratePlans = usePlanLogStore((s) => s.hydrate)
  const [width, setWidth] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() =>
  {
    void hydratePlans()
  }, [hydratePlans])

  const mapa = useMemo(() =>
  {
    const acoesPorDia: Record<string, readonly string[]> = {}
    for (const [iso, d] of Object.entries(days)) acoesPorDia[iso] = d.actions
    return montarMapaDeDias({
      elo,
      semanas,
      acoesPorDia,
      planos: plans,
      // dia local da conclusão; sem registro, a tarefa não conta (nunca o vencimento)
      concluidas: completionDays(tasks ?? [], completions, false),
    })
  }, [elo, semanas, days, plans, tasks, completions])

  const nivelCor: Record<EloNivel, string> = {
    0: colors.hairline,
    1: `${accents.data}47`,
    2: `${accents.data}80`,
    3: `${accents.data}BF`,
    4: accents.data,
  }

  const cols = mapa.colunas.length
  // 26 semanas no celular: células pequenas, espaço menor entre elas
  const GAP = cols > 16 ? 2 : 3
  const gridW = Math.max(0, width - LABEL_W)
  const passo = cols > 0 && gridW > 0 ? (gridW + GAP) / cols : 0
  const cell = Math.max(4, passo - GAP)

  const sel: EloMapaCelula | null = useMemo(() =>
  {
    const iso = selected ?? elo.hoje
    for (const col of mapa.colunas)
    {
      const hit = col.find((c) => c.iso === iso)
      if (hit) return hit
    }
    return null
  }, [mapa, selected, elo.hoje])

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)

  const onGridPress = (e: GestureResponderEvent) =>
  {
    if (passo <= 0) return
    const { locationX, locationY } = e.nativeEvent
    const c = Math.min(cols - 1, Math.max(0, Math.floor(locationX / passo)))
    const r = Math.min(6, Math.max(0, Math.floor(locationY / passo)))
    const hit = mapa.colunas[c]?.[r]
    if (hit && hit.status !== 'futuro') setSelected(hit.iso)
  }

  const cumpridos = mapa.colunas.flat().filter((c) => c.status === 'cumprido').length

  return (
    <View style={inPanel ? { gap: 16 } : { gap: 16, padding: compact ? 16 : 20, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardRim }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text variant={compact ? 'bodyStrong' : 'section'}>Mapa de dias</Text>
          <Text variant="caption" muted>
            {cumpridos} dia{cumpridos === 1 ? '' : 's'} cumprido{cumpridos === 1 ? '' : 's'} · {faixaPt(mapa.de, mapa.ate)}
          </Text>
        </View>
        {compact ? (
          <Pressable
            onPress={() => router.push('/ofensiva' as never)}
            accessibilityRole="button"
            accessibilityLabel="Ver o elo"
            style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' }}
          >
            <Text variant="label" style={{ color: accents.selectInk, fontWeight: '700' }}>
              Ver elo
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View onLayout={onLayout} style={{ flexDirection: 'row' }}>
        <View style={{ width: LABEL_W, height: passo * 7 }}>
          {passo > 0
            ? LINHAS.map((l, i) => (l ? (
              <Text
                key={l}
                variant="micro"
                muted
                style={{ position: 'absolute', left: 0, top: i * passo + cell / 2 - 8 }}
              >
                {l}
              </Text>
            ) : null))
            : null}
        </View>
        <Pressable
          onPress={onGridPress}
          accessibilityRole="button"
          accessibilityLabel={`Mapa de ${semanas} semanas. Toque num dia para ver o detalhe.`}
          style={{ flex: 1, flexDirection: 'row', gap: GAP, minHeight: 44 }}
        >
          {passo > 0
            ? mapa.colunas.map((col) => (
              <View key={col[0]?.iso} style={{ width: cell, gap: GAP }} pointerEvents="none">
                {col.map((c) =>
                {
                  const isToday = c.iso === elo.hoje
                  const isSel = sel?.iso === c.iso
                  const futuro = c.status === 'futuro'
                  return (
                    <View
                      key={c.iso}
                      style={{
                        width: cell,
                        height: cell,
                        borderRadius: Math.min(4, cell / 3),
                        backgroundColor: futuro ? 'transparent' : nivelCor[c.nivel],
                        borderWidth: isSel || isToday ? 1.5 : 0,
                        borderColor: isSel ? colors.ink : colors.inkMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {c.status === 'descanso' && c.nivel === 0 ? (
                        <View
                          style={{
                            width: Math.max(2, cell * 0.36),
                            height: Math.max(2, cell * 0.36),
                            borderRadius: 999,
                            backgroundColor: colors.inkMuted,
                          }}
                        />
                      ) : null}
                    </View>
                  )
                })}
              </View>
            ))
            : null}
        </Pressable>
      </View>

      {sel ? (
        <View style={{ gap: 2 }} accessibilityLiveRegion="polite">
          <Text variant="label" style={{ fontWeight: '700' }}>
            {sel.iso === elo.hoje ? 'Hoje' : eloDataPt(sel.iso)}
          </Text>
          <Text variant="caption" muted>
            {eloDetalheDoDia(sel)}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Text variant="micro" muted>
          Menos
        </Text>
        {([0, 1, 2, 3, 4] as EloNivel[]).map((n) => (
          <View key={n} style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: nivelCor[n] }} />
        ))}
        <Text variant="micro" muted>
          Mais
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: colors.hairline,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: colors.inkMuted }} />
          </View>
          <Text variant="micro" muted>
            Descanso
          </Text>
        </View>
      </View>
    </View>
  )
}
