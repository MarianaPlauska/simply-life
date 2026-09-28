import { useMemo, useState } from 'react'
import { View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Icon } from '../../ui/Icon'
import {
  LIFE_CATEGORIES,
  countByLifeCategory,
  lifeCategoryAccent,
  filterByLifeCategory,
  type LifeCategoryId,
  type MobileTask,
} from '@simply-life/shared'
import { Text, EmptyState, ListRow, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useGamificationStore } from '../../store/gamificationStore'
import { useCaptureStore } from '../../store/captureStore'


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
 * Calendário de Planos - moedas/troféus + lista de categorias.
 */
export function PlansCalendar({ tasks }: Props)
{
  const { colors, chart, space, radius } = useTheme()
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
      {/* Destaque em petróleo (os 30%) */}
      <View
        style={{
          backgroundColor: colors.brand,
          borderRadius: radius.card,
          paddingTop: space.lg,
          paddingHorizontal: space.md,
          paddingBottom: space.xl + 8,
          gap: space.sm,
        }}
      >
        <Text
          variant="hero"
          style={{ fontSize: 26, color: colors.onBrand, letterSpacing: -0.6, lineHeight: 32 }}
        >
          Organize sua Vida{'\n'}Acompanhe o Progresso
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: `${colors.brandInk}29`,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <Icon name="medal" size={16} color={colors.brandInk} />
            <Text variant="label" style={{ color: colors.onBrand, fontWeight: '700' }}>
              {gold} ouro
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: `${colors.brandInk}29`,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <Icon name="flame" size={16} color={colors.axelFill} />
            <Text variant="label" style={{ color: colors.onBrand, fontWeight: '700' }}>
              {streak} dias
            </Text>
          </View>
        </View>
      </View>

      {/* Card sobreposto: grade + categorias */}
      <View
        style={{
          marginTop: -36,
          backgroundColor: colors.elevated,
          borderRadius: radius.card,
          padding: space.md,
          gap: space.md,
          borderWidth: 1,
          borderColor: colors.cardRim,
        }}
      >
        <View
          style={{
            alignSelf: 'center',
            backgroundColor: colors.elevated,
            borderWidth: 1,
            borderColor: colors.hairline,
            paddingHorizontal: 28,
            paddingVertical: 10,
            borderRadius: 999,
            marginTop: -28,
          }}
        >
          <Text variant="label" style={{ color: colors.ink, fontWeight: '800', fontSize: 15 }}>
            Planos
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable
            onPress={() => setCursor(new Date(year, month - 1, 1))}
            style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }}
          >
            <Icon name="chevron-back" size={20} color={colors.inkMuted} />
          </Pressable>
          <Text
            variant="caption"
            style={{ textTransform: 'capitalize', color: colors.inkMuted, fontWeight: '600' }}
          >
            {label}
          </Text>
          <Pressable
            onPress={() => setCursor(new Date(year, month + 1, 1))}
            style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }}
          >
            <Icon name="chevron-forward" size={20} color={colors.inkMuted} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row' }}>
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <Text
              key={`${d}-${i}`}
              variant="micro"
              style={{ flex: 1, textAlign: 'center', color: colors.inkFaint, fontWeight: '700' }}
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
            const accent = lifeCategoryAccent(cat.id, chart)
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
                  borderRadius: radius.control,
                  backgroundColor: active ? colors.axelMuted : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${accent}22`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    name={cat.icon as keyof typeof Icon.glyphMap}
                    size={18}
                    color={accent}
                  />
                </View>
                <Text variant="bodyStrong" style={{ flex: 1, color: colors.ink, fontSize: 15 }}>
                  {cat.label}
                </Text>
                <Text variant="caption" muted style={{ fontWeight: '700' }}>
                  {n}
                </Text>
                <Icon name="chevron-forward" size={16} color={colors.inkFaint} />
              </PressableScale>
            )
          })}
        </View>
      </View>

      {/* Tarefas da categoria / dia */}
      <View
        style={{
          backgroundColor: colors.elevated,
          borderRadius: radius.card,
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
  const { colors } = useTheme()
  if (badge === 'today')
  {
    return (
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          backgroundColor: colors.axelFill,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: selected ? 2 : 0,
          borderColor: colors.ink,
        }}
      >
        <Icon name="add" size={18} color={colors.axelOnFill} />
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
            backgroundColor: colors.healthMuted,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: selected ? 2 : 0,
            borderColor: colors.ink,
          }}
        >
          <Icon name="trophy" size={16} color={colors.done} />
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
          backgroundColor: colors.financeMuted,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: selected ? 2 : 0,
          borderColor: colors.ink,
        }}
      >
        <Icon name="ellipse" size={14} color={colors.finance} />
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
          backgroundColor: colors.hairline,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="micro" style={{ color: colors.inkMuted, fontWeight: '700' }}>
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
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="ellipse-outline" size={14} color={colors.inkFaint} />
    </View>
  )
}
