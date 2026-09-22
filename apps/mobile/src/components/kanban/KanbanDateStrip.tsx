import { useEffect, useRef } from 'react'
import { ScrollView, Pressable } from 'react-native'
import { localTodayIso } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

export type DateStripDay = {
  iso: string
  dayNum: number
  weekday: string
  isToday: boolean
  isPast: boolean
}

function toStripDay(d: Date): DateStripDay
{
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = localTodayIso()
  return {
    iso,
    dayNum: d.getDate(),
    weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    isToday: iso === today,
    isPast: iso < today,
  }
}

/** Próximos N dias a partir de hoje (legado). */
export function buildForwardDays(count = 7): DateStripDay[]
{
  return Array.from({ length: count }).map((_, i) =>
  {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() + i)
    return toStripDay(d)
  })
}

/** Faixa rolável: dias para trás e para frente (padrão ±15). */
export function buildDayRange(back = 15, forward = 15): DateStripDay[]
{
  const days: DateStripDay[] = []
  for (let offset = -back; offset <= forward; offset += 1)
  {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() + offset)
    days.push(toStripDay(d))
  }
  return days
}

type Props = {
  days: DateStripDay[]
  selectedIso: string
  onSelect: (iso: string) => void
}

const CHIP_W = 56
const CHIP_GAP = 8

/** Faixa de dias — selecionado em AXEL, demais em gelo. */
export function KanbanDateStrip({ days, selectedIso, onSelect }: Props)
{
  const { colors } = useTheme()
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() =>
  {
    const idx = days.findIndex((d) => d.iso === selectedIso)
    if (idx < 0) return
    const x = Math.max(0, idx * (CHIP_W + CHIP_GAP) - CHIP_W)
    scrollRef.current?.scrollTo({ x, animated: false })
  }, [days, selectedIso])

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: CHIP_GAP, paddingVertical: 4 }}
    >
      {days.map((d) =>
      {
        const active = d.iso === selectedIso
        return (
          <Pressable
            key={d.iso}
            onPress={() => onSelect(d.iso)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              minWidth: CHIP_W,
              minHeight: 68,
              paddingHorizontal: 10,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              backgroundColor: active ? colors.axel : colors.elevated,
              opacity: d.isPast && !active ? 0.72 : 1,
            }}
          >
            <Text
              variant="micro"
              style={{
                color: active ? colors.axelOnFill : colors.inkMuted,
                textTransform: 'capitalize',
                fontWeight: '600',
              }}
            >
              {d.weekday}
            </Text>
            <Text
              variant="bodyStrong"
              style={{
                fontSize: 18,
                color: active ? colors.axelOnFill : colors.ink,
              }}
            >
              {d.dayNum}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
