import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { localTodayIso, minutesToLabel, type MobileTask } from '@simply-life/shared'
import { Text } from '../../../ui'
import { Icon } from '../../../ui/Icon'
import { useTheme } from '../../../theme/ThemeProvider'
import { useWorkspace } from '../../../layout/useWorkspace'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { useCaptureStore } from '../../../store/captureStore'
import { useTaskEvolveStore } from '../../../store/taskEvolveStore'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { WEB_DISPLAY_FONT } from '../../dashboard/web/webTypography'
import { WebKanbanRow } from './WebKanbanRow'
import { ListSurface, SectionHead } from './WebListParts'
import { LEX, useRowHover } from './kanbanWeb'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MAX_IN_CELL = 3

function toIso(d: Date): string
{
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Calendário no computador: o mês inteiro em grade, com as tarefas escritas
 * dentro de cada dia, e a agenda do dia escolhido ao lado.
 */
export function WebCalendarPane({ tasks }: { tasks: MobileTask[] })
{
  const { colors } = useTheme()
  const { width } = useWorkspace()
  const side = width >= 1400
  const hoverBg = useRowHover()
  const isGuest = useAuthStore((s) => s.isGuest)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const openEvolve = useTaskEvolveStore((s) => s.open)
  const today = localTodayIso()
  const [selected, setSelected] = useState(today)
  const [month, setMonth] = useState(today.slice(0, 7))

  const first = new Date(`${month}-01T12:00:00`)
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
  }, [month])

  const byDay = useMemo(() =>
  {
    const map = new Map<string, MobileTask[]>()
    for (const t of tasks)
    {
      const iso = t.dataVencimento?.slice(0, 10)
      if (!iso) continue
      map.set(iso, [...(map.get(iso) ?? []), t])
    }
    for (const list of map.values()) list.sort((a, b) => (a.horaMinutos ?? 9999) - (b.horaMinutos ?? 9999))
    return map
  }, [tasks])

  const monthName = first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const shift = (dir: 1 | -1) =>
  {
    const d = new Date(first.getFullYear(), first.getMonth() + dir, 1, 12)
    setMonth(toIso(d).slice(0, 7))
  }
  const goToday = () =>
  {
    setMonth(today.slice(0, 7))
    setSelected(today)
  }

  const dayList = byDay.get(selected) ?? []
  const selLabel = new Date(`${selected}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const navBtn = (icon: 'chevron-back' | 'chevron-forward', label: string, onPress: () => void) => (
    <WebHoverable
      onPress={onPress}
      accessibilityLabel={label}
      style={(h) => webStyle({
        width: 34,
        height: 34,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: h ? hoverBg : colors.elevated,
        cursor: 'pointer',
      })}
    >
      <Icon name={icon} size={16} color={colors.inkMuted} />
    </WebHoverable>
  )

  const grid = (
    <View style={{ gap: 12, minWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ flex: 1, fontFamily: WEB_DISPLAY_FONT, fontSize: 26, lineHeight: 34, color: colors.ink }}>
          {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
        </Text>
        <WebHoverable
          onPress={goToday}
          accessibilityLabel="Ir para hoje"
          style={(h) => webStyle({
            height: 34,
            justifyContent: 'center',
            paddingHorizontal: 14,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.hairline,
            backgroundColor: h ? hoverBg : colors.elevated,
            cursor: 'pointer',
          })}
        >
          <Text style={[LEX.medium, { fontSize: 14, lineHeight: 20, color: colors.ink }]}>Hoje</Text>
        </WebHoverable>
        {navBtn('chevron-back', 'Mês anterior', () => shift(-1))}
        {navBtn('chevron-forward', 'Próximo mês', () => shift(1))}
      </View>

      <View
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.hairline,
          backgroundColor: colors.elevated,
          overflow: 'hidden',
        }}
      >
        <View style={webStyle({ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' })}>
          {WEEKDAYS.map((w) => (
            <Text
              key={w}
              style={[LEX.medium, { fontSize: 13, lineHeight: 18, color: colors.inkMuted, paddingHorizontal: 10, paddingVertical: 10 }]}
            >
              {w}
            </Text>
          ))}
          {cells.map((c, i) =>
          {
            const items = byDay.get(c.iso) ?? []
            const isSel = c.iso === selected
            const isToday = c.iso === today
            return (
              <WebHoverable
                key={c.iso}
                onPress={() => setSelected(c.iso)}
                accessibilityLabel={`Dia ${c.num}`}
                style={(h) => webStyle({
                  minHeight: side ? 116 : 92,
                  padding: 8,
                  gap: 4,
                  borderTopWidth: 1,
                  borderLeftWidth: i % 7 === 0 ? 0 : 1,
                  borderColor: colors.hairline,
                  backgroundColor: isSel ? colors.axelMuted : h ? hoverBg : 'transparent',
                  cursor: 'pointer',
                })}
              >
                <View
                  style={{
                    alignSelf: 'flex-start',
                    minWidth: 26,
                    height: 26,
                    borderRadius: 13,
                    paddingHorizontal: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isToday ? colors.axelFill : 'transparent',
                  }}
                >
                  <Text
                    style={[
                      isToday ? LEX.semibold : LEX.regular,
                      {
                        fontSize: 14,
                        lineHeight: 18,
                        color: isToday ? colors.axelOnFill : c.inMonth ? colors.ink : colors.inkFaint,
                      },
                    ]}
                  >
                    {c.num}
                  </Text>
                </View>
                {items.slice(0, MAX_IN_CELL).map((t) =>
                {
                  const done = t.status === 'done'
                  return (
                    <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: done ? colors.inkFaint : t.prioridade === 1 ? colors.danger : colors.axel,
                        }}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          LEX.regular,
                          {
                            flex: 1,
                            fontSize: 13,
                            lineHeight: 18,
                            color: done ? colors.inkFaint : colors.ink,
                            textDecorationLine: done ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {t.horaMinutos != null ? `${minutesToLabel(t.horaMinutos)} ` : ''}
                        {t.titulo}
                      </Text>
                    </View>
                  )
                })}
                {items.length > MAX_IN_CELL ? (
                  <Text style={[LEX.medium, { fontSize: 13, lineHeight: 18, color: colors.inkMuted }]}>
                    + {items.length - MAX_IN_CELL} mais
                  </Text>
                ) : null}
              </WebHoverable>
            )
          })}
        </View>
      </View>
    </View>
  )

  const agenda = (
    <ListSurface>
      <SectionHead
        first
        title={selLabel.charAt(0).toUpperCase() + selLabel.slice(1)}
        count={dayList.length}
        onAdd={() => openCapture('task', null, { studio: true })}
        addLabel="Nova tarefa"
      />
      {dayList.length === 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 18 }}>
          <Icon name="sunny-outline" size={18} color={colors.inkMuted} />
          <Text style={[LEX.regular, { fontSize: 15, lineHeight: 22, color: colors.inkMuted }]}>Dia livre. Nada com prazo neste dia.</Text>
        </View>
      ) : (
        dayList.map((t) => (
          <View key={t.id} style={{ borderTopWidth: 1, borderTopColor: colors.hairline }}>
            <WebKanbanRow
              timeColumn
              time={t.horaMinutos != null ? minutesToLabel(t.horaMinutos) : undefined}
              title={t.titulo}
              done={t.status === 'done'}
              onPress={() => openEvolve(t.id)}
              onToggle={() => void toggleTaskDone(t.id, isGuest)}
            />
          </View>
        ))
      )}
    </ListSurface>
  )

  if (!side)
  {
    return (
      <View style={{ gap: 16 }}>
        {grid}
        {agenda}
      </View>
    )
  }

  return (
    <View style={webStyle({ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 16, alignItems: 'start' })}>
      {grid}
      {/* agenda alinhada com a grade, não com o título do mês */}
      <View style={{ marginTop: 46 }}>{agenda}</View>
    </View>
  )
}
