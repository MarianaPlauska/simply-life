import { useEffect, useMemo, useState } from 'react'
import { View, TextInput, ScrollView } from 'react-native'
import {
  LIFE_CATEGORIES,
  billsDueOnIso,
  filterByLifeCategory,
  filterByUserList,
  isTaskPinnedToDay,
  localTodayIso,
  sortByDayTime,
  type LifeCategoryId,
  type MobileTask,
} from '@simply-life/shared'
import { Text, Chip, EmptyState, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useCaptureStore } from '../../store/captureStore'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import { useDuePaidStore } from '../../store/duePaidStore'
import { Ionicons } from '@expo/vector-icons'
import { KanbanTaskRow } from './KanbanTaskRow'
import { KanbanDateStrip, buildForwardDays } from './KanbanDateStrip'
import { KanbanDayTaskCard } from './KanbanDayTaskCard'
import { DayBillCard } from './DayBillCard'

type Props = {
  tasks: MobileTask[]
  onSeeDone?: () => void
}

const PRI: { id: 1 | 2 | 3; label: string; tint: string; ink: string }[] = [
  { id: 1, label: 'Alta', tint: 'rgba(232, 115, 74, 0.16)', ink: '#E8734A' },
  { id: 2, label: 'Média', tint: 'rgba(212, 184, 150, 0.22)', ink: '#B8956B' },
  { id: 3, label: 'Baixa', tint: 'rgba(154, 168, 181, 0.18)', ink: '#9AA8B5' },
]

type Filter = { kind: 'life'; id: LifeCategoryId } | { kind: 'user'; id: string }

export function KanbanListPane({ tasks, onSeeDone }: Props)
{
  const { space, colors } = useTheme()
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
  const [filter, setFilter] = useState<Filter>({ kind: 'life', id: 'todos' })
  const [draft, setDraft] = useState('')
  const [naming, setNaming] = useState(false)
  const days = useMemo(() => buildForwardDays(7), [])
  const [dayIso, setDayIso] = useState(days[0]?.iso ?? '')
  const today = localTodayIso()

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
    () =>
      tasks
        .filter((t) => isTaskPinnedToDay(t, dayIso, today))
        .sort(sortByDayTime),
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
        return dayIso === days[0]?.iso
      }),
    [scoped, dayIso, days],
  )

  const restOpenDay = dayTasks
    .filter((t) => t.status !== 'done' && !pinnedIds.has(t.id))
    .sort(sortByDayTime)
  const agendaIds = new Set([...pinned, ...restOpenDay].map((t) => t.id))
  const open = scoped.filter((t) => t.status !== 'done' && !agendaIds.has(t.id))
  const doneDay = dayTasks.filter((t) => t.status === 'done')
  const activeListId = filter.kind === 'user' ? filter.id : null
  const selected = days.find((d) => d.iso === dayIso)
  const dateTitle = selected
    ? new Date(`${selected.iso}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    : 'Hoje'
  const dayCount = restOpenDay.length + pinned.length + dueBills.length
  const lockedBills = dueBills.filter((b) => b.locked)
  const soonBills = dueBills.filter((b) => !b.locked)
  const hasNow = lockedBills.length > 0 || pinned.length > 0

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="hero" style={{ fontSize: 28, letterSpacing: -0.8 }}>
          Hoje
        </Text>
        <Text variant="caption" muted>
          {dayCount} em aberto · {dateTitle}
        </Text>
        <Text variant="caption" muted>
          A caixinha conclui e guarda em Feitas.
        </Text>
      </View>

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingRight: 8,
        }}
      >
        {LIFE_CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            label={c.id === 'crescimento' ? 'Crescimento' : c.label}
            active={filter.kind === 'life' && filter.id === c.id}
            onPress={() => setFilter({ kind: 'life', id: c.id })}
            count={filterByLifeCategory(tasks, c.id).filter((t) => t.status !== 'done').length}
          />
        ))}
        {lists.map((l) => (
          <Chip
            key={l.id}
            label={l.name}
            active={filter.kind === 'user' && filter.id === l.id}
            onPress={() => setFilter({ kind: 'user', id: l.id })}
            count={filterByUserList(tasks, l.id).filter((t) => t.status !== 'done').length}
          />
        ))}
        <Chip label="+ Pasta" onPress={() => setNaming(true)} />
      </ScrollView>

      {naming ? (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Nome da pasta"
            placeholderTextColor={colors.inkFaint}
            autoFocus
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 16,
              paddingHorizontal: 14,
              color: colors.ink,
              backgroundColor: colors.surface,
              fontSize: 15,
            }}
            onSubmitEditing={() =>
            {
              const created = addList(draft)
              setDraft('')
              setNaming(false)
              if (created) setFilter({ kind: 'user', id: created.id })
            }}
          />
          <PressableScale
            accessibilityLabel="Cancelar"
            onPress={() =>
            {
              setNaming(false)
              setDraft('')
            }}
            style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}
          >
            <Text variant="caption" muted>
              Cancelar
            </Text>
          </PressableScale>
        </View>
      ) : null}

      <KanbanDateStrip days={days} selectedIso={dayIso} onSelect={setDayIso} />

      {hasNow ? (
        <Text variant="caption" muted>
          Entregar agora
        </Text>
      ) : null}
      {lockedBills.map((bill) => (
        <DayBillCard
          key={bill.key}
          bill={bill}
          onToggle={() =>
          {
            if (bill.kind === 'apagar')
            {
              void markContaAPagar(Number(bill.sourceId), true, isGuest)
              return
            }
            setPaid(bill.key, true)
          }}
        />
      ))}
      {pinned.map((t) => (
        <KanbanDayTaskCard
          key={t.id}
          task={t}
          onToggle={() => void toggleTaskDone(t.id, isGuest)}
        />
      ))}
      {soonBills.length > 0 ? (
        <Text variant="caption" muted>
          Contas a vencer (5 dias)
        </Text>
      ) : null}
      {soonBills.map((bill) => (
        <DayBillCard
          key={bill.key}
          bill={bill}
          onToggle={() =>
          {
            if (bill.kind === 'apagar')
            {
              void markContaAPagar(Number(bill.sourceId), true, isGuest)
              return
            }
            setPaid(bill.key, true)
          }}
        />
      ))}

      {restOpenDay.map((t) => (
        <KanbanDayTaskCard
          key={t.id}
          task={t}
          onToggle={() => void toggleTaskDone(t.id, isGuest)}
        />
      ))}
      {doneDay.length > 0 && onSeeDone ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`${doneDay.length} feitas neste dia`}
          onPress={onSeeDone}
          style={{
            minHeight: 44,
            paddingHorizontal: 14,
            borderRadius: 16,
            backgroundColor: colors.surface,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <Text variant="caption" muted>
            {doneDay.length} feita{doneDay.length === 1 ? '' : 's'} neste dia
          </Text>
          <Text variant="caption" style={{ color: colors.axel, fontWeight: '600' }}>
            Ver Feitas
          </Text>
        </PressableScale>
      ) : null}
      {pinned.length === 0 && restOpenDay.length === 0 && dueBills.length === 0 ? (
        <EmptyState
          title={doneDay.length > 0 ? 'Tudo feito neste dia' : 'Dia livre'}
          body={
            doneDay.length > 0
              ? 'As concluídas estão na aba Feitas. Toque no check lá para reabrir.'
              : 'Nada com prazo neste dia.'
          }
          icon="sunny-outline"
        />
      ) : null}

      {PRI.map((p) =>
      {
        const list = open.filter((t) => t.prioridade === p.id)
        if (list.length === 0) return null
        return (
          <View key={p.id} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: p.tint,
                }}
              >
                <Text variant="caption" style={{ color: p.ink, fontWeight: '700', fontSize: 11 }}>
                  {p.label} ({list.length})
                </Text>
              </View>
              <View style={{ flex: 1 }} />
              <PressableScale
                accessibilityLabel={`Nova tarefa ${p.label}`}
                onPress={() =>
                  openCapture('task', activeListId, { studio: true, prioridade: p.id })
                }
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface,
                }}
              >
                <Ionicons name="add" size={16} color={colors.inkMuted} />
              </PressableScale>
            </View>
            {list.map((t) => (
              <KanbanTaskRow
                key={t.id}
                task={t}
                onToggle={() => void toggleTaskDone(t.id, isGuest)}
              />
            ))}
          </View>
        )
      })}
    </View>
  )
}
