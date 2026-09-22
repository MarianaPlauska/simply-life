import { useEffect, useMemo, useState } from 'react'
import { View, TextInput } from 'react-native'
import {
  KANBAN_LIFE_FILTERS,
  billsDueOnIso,
  filterByLifeCategory,
  filterByUserList,
  formatBRL,
  isTaskPinnedToDay,
  localTodayIso,
  minutesToLabel,
  sortByDayTime,
  type LifeCategoryId,
  type MobileTask,
} from '@simply-life/shared'
import { Text, EmptyState } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useCaptureStore } from '../../store/captureStore'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import { useDuePaidStore } from '../../store/duePaidStore'
import { useTaskEvolveStore } from '../../store/taskEvolveStore'
import { Ionicons } from '@expo/vector-icons'
import { WebHoverable } from '../dashboard/web/WebHoverable'
import { webStyle } from '../dashboard/web/webStyle'
import { WEB_DISPLAY_FONT } from '../dashboard/web/webTypography'
import { WebDateNav } from './web/WebDateNav'
import { WebKanbanRow } from './web/WebKanbanRow'

type Props = {
  tasks: MobileTask[]
  onSeeDone?: () => void
}

const PRI: { id: 1 | 2 | 3; label: string; color: string }[] = [
  { id: 1, label: 'Alta', color: '#E8734A' },
  { id: 2, label: 'Média', color: '#B8956B' },
  { id: 3, label: 'Baixa', color: '#9AA8B5' },
]

type Filter = { kind: 'life'; id: LifeCategoryId } | { kind: 'user'; id: string }

/**
 * Lista de tarefas — build web. Mesmas regras de negócio de KanbanListPane,
 * apresentadas como navegador de semana + lista densa em vez da faixa de
 * dias com scroll infinito e cartões grandes do mobile. App nativo continua
 * usando KanbanListPane.tsx sem alteração.
 */
export function KanbanListPane({ tasks, onSeeDone }: Props)
{
  const { colors } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const markContaAPagar = useDataStore((s) => s.markContaAPagar)
  const fixas = useDataStore((s) => s.contasFixas)
  const bills = useDataStore((s) => s.contasAPagar)
  const cards = useDataStore((s) => s.financeCards)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const lists = useKanbanListsStore((s) => s.lists)
  const hydrate = useKanbanListsStore((s) => s.hydrate)
  const addList = useKanbanListsStore((s) => s.addList)
  const hydratePaid = useDuePaidStore((s) => s.hydrate)
  const isPaid = useDuePaidStore((s) => s.isPaid)
  const setPaid = useDuePaidStore((s) => s.setPaid)
  const paidKeys = useDuePaidStore((s) => s.keys)
  const openEvolve = useTaskEvolveStore((s) => s.open)
  const [filter, setFilter] = useState<Filter>({ kind: 'life', id: 'todos' })
  const [draft, setDraft] = useState('')
  const [naming, setNaming] = useState(false)
  const today = localTodayIso()
  const [dayIso, setDayIso] = useState(today)

  useEffect(() =>
  {
    hydrate()
    hydratePaid()
  }, [hydrate, hydratePaid])

  const scoped = useMemo(() =>
  {
    if (filter.kind === 'user') return filterByUserList(tasks, filter.id)
    return filterByLifeCategory(tasks, filter.id)
  }, [tasks, filter])

  const pinned = useMemo(
    () => tasks.filter((t) => isTaskPinnedToDay(t, dayIso, today)).sort(sortByDayTime),
    [tasks, dayIso, today],
  )
  const pinnedIds = useMemo(() => new Set(pinned.map((t) => t.id)), [pinned])

  const dueBills = useMemo(
    () => billsDueOnIso(dayIso, fixas, bills, cards, isPaid, today),
    [dayIso, fixas, bills, cards, isPaid, today, paidKeys],
  )

  const dayTasks = useMemo(
    () =>
      scoped.filter((t) =>
      {
        const due = t.dataVencimento?.slice(0, 10)
        if (due) return due === dayIso
        return dayIso === today
      }),
    [scoped, dayIso, today],
  )

  const restOpenDay = dayTasks.filter((t) => t.status !== 'done' && !pinnedIds.has(t.id)).sort(sortByDayTime)
  const agendaIds = new Set([...pinned, ...restOpenDay].map((t) => t.id))
  const open = scoped.filter((t) => t.status !== 'done' && !agendaIds.has(t.id))
  const doneDay = dayTasks.filter((t) => t.status === 'done')
  const activeListId = filter.kind === 'user' ? filter.id : null
  const dateTitle = new Date(`${dayIso}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  const dayCount = restOpenDay.length + pinned.length + dueBills.length
  const lockedBills = dueBills.filter((b) => b.locked)
  const soonBills = dueBills.filter((b) => !b.locked)
  const hasNow = lockedBills.length > 0 || pinned.length > 0

  const filterRows: { key: string; label: string; count: number; active: boolean; onPress: () => void }[] = [
    ...KANBAN_LIFE_FILTERS.map((c) => ({
      key: `life-${c.id}`,
      label: c.label,
      count: filterByLifeCategory(tasks, c.id).filter((t) => t.status !== 'done').length,
      active: filter.kind === 'life' && filter.id === c.id,
      onPress: () => setFilter({ kind: 'life', id: c.id }),
    })),
    ...lists.map((l) => ({
      key: `user-${l.id}`,
      label: l.name,
      count: filterByUserList(tasks, l.id).filter((t) => t.status !== 'done').length,
      active: filter.kind === 'user' && filter.id === l.id,
      onPress: () => setFilter({ kind: 'user', id: l.id }),
    })),
  ]

  return (
    <View style={webStyle({ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' })}>
      <View style={{ gap: 20, borderRadius: 14, backgroundColor: colors.elevated, padding: 16 }}>
        <WebDateNav selectedIso={dayIso} onSelect={setDayIso} />

        <View style={{ gap: 2 }}>
          <Text variant="micro" muted style={{ fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>
            Listas
          </Text>
          {filterRows.map((row) => (
            <WebHoverable
              key={row.key}
              onPress={row.onPress}
              style={(hovered) => webStyle({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 7,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: row.active ? colors.axelMuted : hovered ? colors.surface : 'transparent',
                cursor: 'pointer',
              })}
            >
              <Text
                variant="caption"
                numberOfLines={1}
                style={{ flex: 1, fontSize: 13, color: row.active ? colors.axel : colors.ink, fontWeight: row.active ? '700' : '500' }}
              >
                {row.label}
              </Text>
              <Text variant="micro" muted style={{ fontSize: 11 }}>
                {row.count}
              </Text>
            </WebHoverable>
          ))}
          {naming ? (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Nome da pasta"
              placeholderTextColor={colors.inkFaint}
              autoFocus
              onSubmitEditing={() =>
              {
                const created = addList(draft)
                setDraft('')
                setNaming(false)
                if (created) setFilter({ kind: 'user', id: created.id })
              }}
              onBlur={() =>
              {
                setNaming(false)
                setDraft('')
              }}
              style={{
                marginTop: 4,
                height: 32,
                borderRadius: 8,
                paddingHorizontal: 10,
                color: colors.ink,
                backgroundColor: colors.surface,
                fontSize: 13,
              }}
            />
          ) : (
            <WebHoverable
              onPress={() => setNaming(true)}
              style={webStyle({ paddingVertical: 7, paddingHorizontal: 8, cursor: 'pointer' })}
            >
              <Text variant="caption" style={{ color: colors.axel, fontWeight: '700', fontSize: 13 }}>
                + Pasta
              </Text>
            </WebHoverable>
          )}
        </View>
      </View>

      <View style={{ gap: 16, minWidth: 0 }}>
        <View style={{ gap: 2 }}>
          <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 26, color: colors.ink }}>
            {dayIso === today ? 'Hoje' : dateTitle}
          </Text>
          <Text variant="caption" muted>
            {dayCount} em aberto · {dateTitle}
          </Text>
        </View>

        <View style={{ borderRadius: 14, backgroundColor: colors.elevated, overflow: 'hidden' }}>
          {hasNow || soonBills.length > 0 || restOpenDay.length > 0 ? (
            <>
              {lockedBills.map((bill, i) => (
                <View key={bill.key} style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.hairline }}>
                  <WebKanbanRow
                    title={bill.titulo}
                    meta={`${bill.detalhe} · atrasada`}
                    urgent
                    tagLabel={formatBRL(bill.valor)}
                    tagColor={colors.axel}
                    onPress={() =>
                    {
                      if (bill.kind === 'apagar')
                      {
                        void markContaAPagar(Number(bill.sourceId), true, isGuest)
                        return
                      }
                      setPaid(bill.key, true)
                    }}
                  />
                </View>
              ))}
              {pinned.map((t, i) => (
                <View key={t.id} style={{ borderTopWidth: i === 0 && lockedBills.length === 0 ? 0 : 1, borderTopColor: colors.hairline }}>
                  <WebKanbanRow
                    time={t.horaMinutos != null ? minutesToLabel(t.horaMinutos) : undefined}
                    title={t.titulo}
                    done={t.status === 'done'}
                    onPress={() => openEvolve(t.id)}
                    onToggle={() => void toggleTaskDone(t.id, isGuest)}
                  />
                </View>
              ))}
              {soonBills.map((bill, i) => (
                <View
                  key={bill.key}
                  style={{ borderTopWidth: i === 0 && lockedBills.length === 0 && pinned.length === 0 ? 0 : 1, borderTopColor: colors.hairline }}
                >
                  <WebKanbanRow
                    title={bill.titulo}
                    meta={`${bill.detalhe} · a vencer`}
                    tagLabel={formatBRL(bill.valor)}
                    tagColor={colors.finance}
                    onPress={() =>
                    {
                      if (bill.kind === 'apagar')
                      {
                        void markContaAPagar(Number(bill.sourceId), true, isGuest)
                        return
                      }
                      setPaid(bill.key, true)
                    }}
                  />
                </View>
              ))}
              {restOpenDay.map((t, i) => (
                <View
                  key={t.id}
                  style={{
                    borderTopWidth: i === 0 && lockedBills.length === 0 && pinned.length === 0 && soonBills.length === 0 ? 0 : 1,
                    borderTopColor: colors.hairline,
                  }}
                >
                  <WebKanbanRow
                    time={t.horaMinutos != null ? minutesToLabel(t.horaMinutos) : undefined}
                    title={t.titulo}
                    done={t.status === 'done'}
                    onPress={() => openEvolve(t.id)}
                    onToggle={() => void toggleTaskDone(t.id, isGuest)}
                  />
                </View>
              ))}
            </>
          ) : (
            <View style={{ padding: 20 }}>
              <EmptyState
                title={doneDay.length > 0 ? 'Tudo feito neste dia' : 'Dia livre'}
                body={
                  doneDay.length > 0
                    ? 'As concluídas estão na aba Feitas. Toque no check lá para reabrir.'
                    : 'Nada com prazo neste dia.'
                }
                icon="sunny-outline"
              />
            </View>
          )}
          {doneDay.length > 0 && onSeeDone ? (
            <WebHoverable
              onPress={onSeeDone}
              accessibilityLabel={`${doneDay.length} feitas neste dia`}
              style={webStyle({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderTopWidth: 1,
                borderTopColor: colors.hairline,
                cursor: 'pointer',
              })}
            >
              <Text variant="caption" muted>
                {doneDay.length} feita{doneDay.length === 1 ? '' : 's'} neste dia
              </Text>
              <Text variant="caption" style={{ color: colors.axel, fontWeight: '700' }}>
                Ver Feitas
              </Text>
            </WebHoverable>
          ) : null}
        </View>

        {PRI.map((p) =>
        {
          const list = open.filter((t) => t.prioridade === p.id)
          if (list.length === 0) return null
          return (
            <View key={p.id} style={{ borderRadius: 14, backgroundColor: colors.elevated, overflow: 'hidden' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text variant="caption" style={{ color: p.color, fontWeight: '700' }}>
                  {p.label} · {list.length}
                </Text>
                <WebHoverable
                  onPress={() => openCapture('task', activeListId, { studio: true, prioridade: p.id })}
                  accessibilityLabel={`Nova tarefa ${p.label}`}
                  style={webStyle({ padding: 4, cursor: 'pointer' })}
                >
                  <Ionicons name="add" size={15} color={colors.inkMuted} />
                </WebHoverable>
              </View>
              {list.map((t, i) => (
                <View key={t.id} style={{ borderTopWidth: i === 0 ? 1 : 1, borderTopColor: colors.hairline }}>
                  <WebKanbanRow
                    title={t.titulo}
                    done={t.status === 'done'}
                    onPress={() => openEvolve(t.id)}
                    onToggle={() => void toggleTaskDone(t.id, isGuest)}
                  />
                </View>
              ))}
            </View>
          )
        })}
      </View>
    </View>
  )
}
