import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Icon } from '../../../ui/Icon'
import { localTodayIso } from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { LEX, useRowHover } from './kanbanWeb'

const WEEKDAY = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function toIso(d: Date): string
{
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fromIso(iso: string): Date
{
  return new Date(`${iso}T12:00:00`)
}

type Props = {
  selectedIso: string
  onSelect: (iso: string) => void
  /** dias com tarefa ou conta em aberto: ganham um ponto */
  marked?: Set<string>
}

/**
 * Mini calendário do mês, como em agenda de computador: o mês inteiro à vista,
 * clique no dia, setas para o mês ao lado. Pontos mostram onde há coisa marcada.
 */
export function WebDateNav({ selectedIso, onSelect, marked }: Props)
{
  const { colors, mode } = useTheme()
  const hoverBg = useRowHover()
  const today = localTodayIso()
  const [monthAnchor, setMonthAnchor] = useState(() => selectedIso.slice(0, 7))

  // escolher um dia de outro mês (ex.: botão Hoje) leva o calendário junto
  useEffect(() =>
  {
    setMonthAnchor(selectedIso.slice(0, 7))
  }, [selectedIso])

  const first = fromIso(`${monthAnchor}-01`)
  const cells = useMemo(() =>
  {
    const start = new Date(first)
    start.setDate(1 - first.getDay())
    const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
    const weeks = Math.ceil((first.getDay() + lastDay) / 7)
    return Array.from({ length: weeks * 7 }).map((_, i) =>
    {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return { iso: toIso(d), num: d.getDate(), inMonth: d.getMonth() === first.getMonth() }
    })
  }, [monthAnchor])

  const monthName = first.toLocaleDateString('pt-BR', { month: 'long' })
  const monthLabel = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${first.getFullYear()}`

  const shiftMonth = (dir: 1 | -1) =>
  {
    const d = new Date(first.getFullYear(), first.getMonth() + dir, 1, 12)
    setMonthAnchor(toIso(d).slice(0, 7))
  }

  const arrow = (dir: 1 | -1) => (
    <WebHoverable
      onPress={() => shiftMonth(dir)}
      accessibilityLabel={dir < 0 ? 'Mês anterior' : 'Próximo mês'}
      style={(hovered) => webStyle({
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hovered ? hoverBg : 'transparent',
        cursor: 'pointer',
      })}
    >
      <Icon name={dir < 0 ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.inkMuted} />
    </WebHoverable>
  )

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text numberOfLines={1} style={[LEX.medium, { flex: 1, fontSize: 15, lineHeight: 22, color: colors.ink }]}>
          {monthLabel}
        </Text>
        {arrow(-1)}
        {arrow(1)}
      </View>

      <View style={webStyle({ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', rowGap: 2 })}>
        {WEEKDAY.map((w, i) => (
          <Text key={`w${i}`} style={[LEX.regular, { textAlign: 'center', fontSize: 13, lineHeight: 28, color: colors.inkFaint }]}>
            {w}
          </Text>
        ))}
        {cells.map((c) =>
        {
          const active = c.iso === selectedIso
          const isToday = c.iso === today
          const busy = Boolean(marked?.has(c.iso))
          // alto contraste: dia escolhido cheio em petróleo, dia com coisa marcada preenchido,
          // hoje com anel coral; o resto do mês fica só no número
          const fill = active ? colors.brand : busy && c.inMonth ? `${colors.brand}24` : 'transparent'
          return (
            <View key={c.iso} style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <WebHoverable
                onPress={() => onSelect(c.iso)}
                accessibilityLabel={`Dia ${c.num}`}
                style={(hovered) => webStyle({
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: isToday && !active ? colors.axelFill : 'transparent',
                  backgroundColor: !active && hovered ? hoverBg : fill,
                  cursor: 'pointer',
                })}
              >
                <Text
                  style={[
                    active || busy || isToday ? LEX.semibold : LEX.regular,
                    {
                      fontSize: 14,
                      lineHeight: 18,
                      color: active
                        ? colors.onBrand
                        : !c.inMonth
                          ? colors.inkFaint
                          : busy
                            ? (mode === 'dark' ? colors.ink : colors.brand)
                            : colors.inkMuted,
                    },
                  ]}
                >
                  {c.num}
                </Text>
              </WebHoverable>
            </View>
          )
        })}
      </View>

      {/* legenda dos círculos */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingTop: 2 }}>
        {[
          { label: 'Com tarefa', fill: `${colors.brand}24`, ring: 'transparent' },
          { label: 'Hoje', fill: 'transparent', ring: colors.axelFill },
          { label: 'Escolhido', fill: colors.brand, ring: 'transparent' },
        ].map((l) => (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: l.fill, borderWidth: 2, borderColor: l.ring }} />
            <Text style={[LEX.regular, { fontSize: 13, lineHeight: 18, color: colors.inkMuted }]}>{l.label}</Text>
          </View>
        ))}
      </View>

      {selectedIso !== today ? (
        <WebHoverable
          onPress={() => onSelect(today)}
          accessibilityLabel="Voltar para hoje"
          style={webStyle({ alignSelf: 'flex-start', paddingVertical: 4, cursor: 'pointer' })}
        >
          <Text style={[LEX.medium, { fontSize: 14, lineHeight: 20, color: colors.axel }]}>Voltar para hoje</Text>
        </WebHoverable>
      ) : null}
    </View>
  )
}
