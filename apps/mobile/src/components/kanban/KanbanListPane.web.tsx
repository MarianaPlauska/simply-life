import { useEffect, useMemo, useState } from 'react'
import { View, TextInput, ScrollView } from 'react-native'
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
import { Text, Chip, EmptyState, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useCaptureStore } from '../../store/captureStore'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import { useDuePaidStore } from '../../store/duePaidStore'
import { useTaskEvolveStore } from '../../store/taskEvolveStore'
import { Ionicons } from '@expo/vector-icons'
import { KanbanTaskRow } from './KanbanTaskRow'
import { KanbanDateStrip, buildDayRange } from './KanbanDateStrip'
import { KanbanDayTaskCard } from './KanbanDayTaskCard'
import { DayBillCard } from './DayBillCard'
import { WebHoverable } from '../dashboard/web/WebHoverable'
import { webStyle } from '../dashboard/web/webStyle'
import { WEB_DISPLAY_FONT } from '../dashboard/web/webTypography'
import { WEB_CARD_BORDER, WEB_ROW_DIVIDER } from '../dashboard/web/webPalette'
import { WebDateNav } from './web/WebDateNav'
import { WebKanbanRow } from './web/WebKanbanRow'

type Props = {
  tasks: MobileTask[]
  onSeeDone?: () => void
}

const PRI_MOBILE: { id: 1 | 2 | 3; label: string; tint: string; ink: string }[] = [
  { id: 1, label: 'Alta', tint: 'rgba(232, 115, 74, 0.16)', ink: '#E8734A' },
  { id: 2, label: 'Média', tint: 'rgba(212, 184, 150, 0.22)', ink: '#B8956B' },
  { id: 3, label: 'Baixa', tint: 'rgba(154, 168, 181, 0.18)', ink: '#9AA8B5' },
]

const PRI_DESKTOP: { id: 1 | 2 | 3; label: string; color: string }[] = [
  { id: 1, label: 'Alta', color: '#E8734A' },
  { id: 2, label: 'Média', color: '#E3A855' },
  { id: 3, label: 'Baixa', color: '#7FAAD1' },
]

type Filter = { kind: 'life'; id: LifeCategoryId } | { kind: 'user'; id: string }

/**
 * Lista de tarefas — build web. Em largura estreita (o mesmo corte usado
 * pelo app nativo) renderiza exatamente a composição original de
 * KanbanListPane.tsx — é o que roda quando a build web abre num celular.
 * Só a partir de largura de desktop (showRail) usa o navegador de semana +
 * lista densa. App nativo continua usando KanbanListPane.tsx sem alteração.
 */
export function KanbanListPane({ tasks, onSeeDone }: Props)
{
  const { space, colors } = useTheme()
  const { showRail } = useWorkspace()
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
  const days = useMemo(() => buildDayRange(15, 15), [])
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
  const selected = days.find((d) => d.iso === dayIso)
  const dateTitle = selected
    ? new Date(`${selected.iso}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    : new Date(`${dayIso}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  const dayCount = restOpenDay.length + pinned.length + dueBills.length
  const lockedBills = dueBills.filter((b) => b.locked)
  const soonBills = dueBills.filter((b) => !b.locked)
  const hasNow = lockedBills.length > 0 || pinned.length > 0

  if (!showRail)
  {
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
          {KANBAN_LIFE_FILTERS.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
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

        {PRI_MOBILE.map((p) =>
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
      <View style={{ gap: 20, borderRadius: 14, backgroundColor: colors.elevated, borderWidth: 1, borderColor: WEB_CARD_BORDER, padding: 16 }}>
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

        <View style={{ borderRadius: 14, backgroundColor: colors.elevated, borderWidth: 1, borderColor: WEB_CARD_BORDER, overflow: 'hidden' }}>
          {hasNow || soonBills.length > 0 || restOpenDay.length > 0 ? (
            <>
              {lockedBills.map((bill, i) => (
                <View key={bill.key} style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: WEB_ROW_DIVIDER }}>
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
                <View key={t.id} style={{ borderTopWidth: i === 0 && lockedBills.length === 0 ? 0 : 1, borderTopColor: WEB_ROW_DIVIDER }}>
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
                  style={{ borderTopWidth: i === 0 && lockedBills.length === 0 && pinned.length === 0 ? 0 : 1, borderTopColor: WEB_ROW_DIVIDER }}
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
                    borderTopColor: WEB_ROW_DIVIDER,
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
                borderTopColor: WEB_ROW_DIVIDER,
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

        {PRI_DESKTOP.map((p) =>
        {
          const list = open.filter((t) => t.prioridade === p.id)
          if (list.length === 0) return null
          return (
            <View key={p.id} style={{ borderRadius: 14, backgroundColor: colors.elevated, borderWidth: 1, borderColor: WEB_CARD_BORDER, overflow: 'hidden' }}>
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
                <View key={t.id} style={{ borderTopWidth: i === 0 ? 1 : 1, borderTopColor: WEB_ROW_DIVIDER }}>
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
