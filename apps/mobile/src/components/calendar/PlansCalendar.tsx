import { useMemo, useState } from 'react'
import { View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  LIFE_CATEGORIES,
  countByLifeCategory,
  filterByLifeCategory,
  type LifeCategoryId,
  type MobileTask,
} from '@simply-life/shared'
import { Text, EmptyState, ListRow, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useGamificationStore } from '../../store/gamificationStore'
import { useCaptureStore } from '../../store/captureStore'

/** Amarelo da ref “Organize sua Vida / Planos” */
const PLANS_YELLOW = '#F5C518'
const PLANS_YELLOW_DEEP = '#E8B400'
const COIN_GOLD = '#F0B429'
const TROPHY_GOLD = '#D4A017'

type DayBadge = 'empty' | 'coin' | 'trophy' | 'today' | 'future'

function monthMatrix(anchor: Date)
{
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return { year, month, cells }
}

function badgeForDay(
  iso: string,
  todayIso: string,
  doneCount: number,
  openCount: number,
): DayBadge
{
  if (iso === todayIso) return 'today'
  if (iso > todayIso) return openCount > 0 ? 'coin' : 'future'
  if (doneCount > 0 && openCount === 0) return 'trophy'
  if (doneCount > 0 || openCount > 0) return 'coin'
  return 'empty'
}

type Props = {
  tasks: MobileTask[]
}

/**
 * Calendário de Planos - moedas/troféus + lista de categorias (ref amarela).
 */
export function PlansCalendar({ tasks }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const gold = useGamificationStore((s) => s.gold)
  const streak = useGamificationStore((s) => s.streak)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const [cursor, setCursor] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate())
  const [category, setCategory] = useState<LifeCategoryId>('todos')

  const { year, month, cells } = useMemo(() => monthMatrix(cursor), [cursor])
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const todayIso = new Date().toISOString().slice(0, 10)
  const selectedIso =
    selectedDay != null
      ? `${monthKey}-${String(selectedDay).padStart(2, '0')}`
      : null

  const dayStats = useMemo(() =>
  {
    const open: Record<string, number> = {}
    const done: Record<string, number> = {}
    for (const t of tasks)
    {
      if (!t.dataVencimento) continue
      const key = t.dataVencimento.slice(0, 10)
      if (t.status === 'done') done[key] = (done[key] ?? 0) + 1
      else open[key] = (open[key] ?? 0) + 1
    }
    return { open, done }
  }, [tasks])

  const counts = useMemo(() => countByLifeCategory(tasks), [tasks])

  const listTasks = useMemo(() =>
  {
    const base = filterByLifeCategory(tasks, category).filter((t) => t.status !== 'done')
    if (!selectedIso) return base
    const dayMatch = base.filter((t) => t.dataVencimento?.slice(0, 10) === selectedIso)
    return dayMatch.length > 0 ? dayMatch : base
  }, [tasks, category, selectedIso])

  const label = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <View style={{ gap: space.lg }}>
      {/* Header amarelo */}
      <View
        style={{
          backgroundColor: PLANS_YELLOW,
          borderRadius: 28,
          paddingTop: space.lg,
          paddingHorizontal: space.md,
          paddingBottom: space.xl + 8,
          gap: space.sm,
        }}
      >
        <Text
          variant="hero"
          style={{ fontSize: 26, color: '#1A1A1A', letterSpacing: -0.6, lineHeight: 32 }}
        >
          Organize sua Vida{'\n'}Acompanhe o Progresso
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(255,255,255,0.55)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <Ionicons name="medal" size={16} color={TROPHY_GOLD} />
            <Text variant="label" style={{ color: '#1A1A1A', fontWeight: '700' }}>
              {gold} ouro
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(255,255,255,0.55)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <Ionicons name="flame" size={16} color="#E85D4C" />
            <Text variant="label" style={{ color: '#1A1A1A', fontWeight: '700' }}>
              {streak} dias
            </Text>
          </View>
        </View>
      </View>

      {/* Card branco sobreposto - grade + categorias */}
      <View
        style={{
          marginTop: -36,
          backgroundColor: '#FFF',
          borderRadius: 28,
          padding: space.md,
          gap: space.md,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.04)',
        }}
      >
        <View
          style={{
            alignSelf: 'center',
            backgroundColor: PLANS_YELLOW,
            paddingHorizontal: 28,
            paddingVertical: 10,
            borderRadius: 999,
            marginTop: -28,
          }}
        >
          <Text variant="label" style={{ color: '#1A1A1A', fontWeight: '800', fontSize: 15 }}>
            Planos
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable
            onPress={() => setCursor(new Date(year, month - 1, 1))}
            style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={20} color="#888" />
          </Pressable>
          <Text
            variant="caption"
            style={{ textTransform: 'capitalize', color: '#666', fontWeight: '600' }}
          >
            {label}
          </Text>
          <Pressable
            onPress={() => setCursor(new Date(year, month + 1, 1))}
            style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }}
          >
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row' }}>
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <Text
              key={`${d}-${i}`}
              variant="micro"
              style={{ flex: 1, textAlign: 'center', color: '#AAA', fontWeight: '700' }}
            >
              {d}
            </Text>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((d, i) =>
          {
            if (d == null)
            {
              return <View key={`e-${i}`} style={{ width: '14.28%', height: 48 }} />
            }
            const iso = `${monthKey}-${String(d).padStart(2, '0')}`
            const badge = badgeForDay(
              iso,
              todayIso,
              dayStats.done[iso] ?? 0,
              dayStats.open[iso] ?? 0,
            )
            const selected = d === selectedDay
            return (
              <Pressable
                key={iso}
                onPress={() =>
                {
                  if (badge === 'today' && selected)
                  {
                    openCapture('dump')
                    return
                  }
                  setSelectedDay(d)
                }}
                style={{
                  width: '14.28%',
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DayCell badge={badge} day={d} selected={selected} />
              </Pressable>
            )
          })}
        </View>

        {/* Lista de categorias */}
        <View style={{ gap: 4, marginTop: space.sm }}>
          {LIFE_CATEGORIES.map((cat) =>
          {
            const active = category === cat.id
            const n = counts[cat.id]
            return (
              <PressableScale
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 52,
                  paddingHorizontal: 8,
                  borderRadius: 14,
                  backgroundColor: active ? 'rgba(245, 197, 24, 0.18)' : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${cat.accent}22`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={cat.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={cat.accent}
                  />
                </View>
                <Text variant="bodyStrong" style={{ flex: 1, color: '#1A1A1A', fontSize: 15 }}>
                  {cat.label}
                </Text>
                <Text variant="caption" muted style={{ fontWeight: '700' }}>
                  {n}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#CCC" />
              </PressableScale>
            )
          })}
        </View>
      </View>

      {/* Tarefas da categoria / dia */}
      <View
        style={{
          backgroundColor: colors.elevated,
          borderRadius: 20,
          paddingVertical: space.sm,
          overflow: 'hidden',
        }}
      >
        <View style={{ paddingHorizontal: space.md, paddingBottom: 8 }}>
          <Text variant="caption" muted>
            {LIFE_CATEGORIES.find((c) => c.id === category)?.label}
            {selectedIso ? ` · ${selectedIso.slice(8)}/${selectedIso.slice(5, 7)}` : ''}
          </Text>
        </View>
        {listTasks.length === 0 ? (
          <EmptyState title="Lista limpa" body="Nada aberto neste filtro." />
        ) : (
          listTasks.slice(0, 12).map((t, i) => (
            <ListRow
              key={t.id}
              title={t.titulo}
              subtitle={t.dataVencimento ?? 'Sem prazo'}
              showSeparator={i < Math.min(listTasks.length, 12) - 1}
              onPress={() => router.push(`/task/${t.id}`)}
            />
          ))
        )}
      </View>
    </View>
  )
}

function DayCell({
  badge,
  day,
  selected,
}: {
  badge: DayBadge
  day: number
  selected: boolean
})
{
  if (badge === 'today')
  {
    return (
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          backgroundColor: selected ? '#4C8DFF' : '#5B9BFF',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: selected ? 2 : 0,
          borderColor: '#1A1A1A',
        }}
      >
        <Ionicons name="add" size={18} color="#FFF" />
      </View>
    )
  }

  if (badge === 'trophy')
  {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            backgroundColor: PLANS_YELLOW,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: selected ? 2 : 0,
            borderColor: PLANS_YELLOW_DEEP,
          }}
        >
          <Ionicons name="trophy" size={16} color={TROPHY_GOLD} />
        </View>
      </View>
    )
  }

  if (badge === 'coin')
  {
    return (
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          backgroundColor: PLANS_YELLOW,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.95,
          borderWidth: selected ? 2 : 0,
          borderColor: '#1A1A1A',
        }}
      >
        <Ionicons name="ellipse" size={14} color={COIN_GOLD} />
      </View>
    )
  }

  if (badge === 'future')
  {
    return (
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          backgroundColor: 'rgba(245, 197, 24, 0.35)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="micro" style={{ color: '#888', fontWeight: '700' }}>
          {day}
        </Text>
      </View>
    )
  }

  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        backgroundColor: 'rgba(245, 197, 24, 0.22)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.55,
      }}
    >
      <Ionicons name="ellipse-outline" size={14} color={COIN_GOLD} />
    </View>
  )
}
