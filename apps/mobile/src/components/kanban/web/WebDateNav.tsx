import { useMemo } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { localTodayIso } from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'

const WEEKDAY = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function toIso(d: Date): string
{
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fromIso(iso: string): Date
{
  const d = new Date(`${iso}T12:00:00`)
  return d
}

function startOfWeek(iso: string): Date
{
  const d = fromIso(iso)
  d.setDate(d.getDate() - d.getDay())
  return d
}

type Props = {
  selectedIso: string
  onSelect: (iso: string) => void
}

/**
 * Navegador de datas compacto — uma semana por vez, sem faixa infinita de
 * chips de toque. Cabe numa coluna estreita e usa clique/atalho, não swipe.
 */
export function WebDateNav({ selectedIso, onSelect }: Props)
{
  const { colors } = useTheme()
  const today = localTodayIso()
  const weekStart = useMemo(() => startOfWeek(selectedIso), [selectedIso])
  const days = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) =>
      {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + i)
        return { iso: toIso(d), num: d.getDate(), weekday: WEEKDAY[d.getDay()] }
      }),
    [weekStart],
  )
  const monthLabel = fromIso(selectedIso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const shiftWeek = (dir: 1 | -1) =>
  {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + dir * 7 + (fromIso(selectedIso).getDay()))
    onSelect(toIso(d))
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="micro" muted numberOfLines={1} style={{ textTransform: 'capitalize', fontSize: 11 }}>
          {monthLabel}
        </Text>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          <WebHoverable
            onPress={() => shiftWeek(-1)}
            accessibilityLabel="Semana anterior"
            style={webStyle({ padding: 4, cursor: 'pointer' })}
          >
            <Ionicons name="chevron-back" size={13} color={colors.inkMuted} />
          </WebHoverable>
          <WebHoverable
            onPress={() => onSelect(today)}
            accessibilityLabel="Hoje"
            style={webStyle({ paddingHorizontal: 6, paddingVertical: 4, cursor: 'pointer' })}
          >
            <Text variant="micro" style={{ color: colors.axel, fontWeight: '700', fontSize: 10 }}>
              HOJE
            </Text>
          </WebHoverable>
          <WebHoverable
            onPress={() => shiftWeek(1)}
            accessibilityLabel="Próxima semana"
            style={webStyle({ padding: 4, cursor: 'pointer' })}
          >
            <Ionicons name="chevron-forward" size={13} color={colors.inkMuted} />
          </WebHoverable>
        </View>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {days.map((d) =>
        {
          const active = d.iso === selectedIso
          const isToday = d.iso === today
          return (
            <WebHoverable
              key={d.iso}
              onPress={() => onSelect(d.iso)}
              accessibilityLabel={`Dia ${d.num}`}
              style={webStyle({
                flex: 1,
                alignItems: 'center',
                gap: 4,
                paddingVertical: 8,
                cursor: 'pointer',
              })}
            >
              <Text variant="micro" muted style={{ fontSize: 10 }}>
                {d.weekday}
              </Text>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors.axel : 'transparent',
                }}
              >
                <Text
                  variant="micro"
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: active ? '#FFFFFF' : isToday ? colors.axel : colors.ink,
                  }}
                >
                  {d.num}
                </Text>
              </View>
            </WebHoverable>
          )
        })}
      </View>
    </View>
  )
}
