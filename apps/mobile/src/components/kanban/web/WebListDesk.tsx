import { useEffect, useMemo, useState } from 'react'
import { View, TextInput } from 'react-native'
import {
  KANBAN_LIFE_FILTERS,
  LIFE_CATEGORIES,
  billsDueOnIso,
  filterByLifeCategory,
  filterByUserList,
  formatBRL,
  inferLifeCategory,
  isTaskPinnedToDay,
  localTodayIso,
  minutesToLabel,
  sortByDayTime,
  taskListId,
  type LifeCategoryId,
  type MobileTask,
} from '@simply-life/shared'
import { Text } from '../../../ui'
import { Icon, type IconName } from '../../../ui/Icon'
import { Panel } from '../../../ui/Panel'
import { useTheme } from '../../../theme/ThemeProvider'
import { useWorkspace } from '../../../layout/useWorkspace'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { useCaptureStore } from '../../../store/captureStore'
import { useKanbanListsStore } from '../../../store/kanbanListsStore'
import { useDuePaidStore } from '../../../store/duePaidStore'
import { useTaskEvolveStore } from '../../../store/taskEvolveStore'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { WEB_DISPLAY_FONT } from '../../dashboard/web/webTypography'
import { WebDateNav } from './WebDateNav'
import { WebKanbanRow, type WebRowTag } from './WebKanbanRow'
import { WebNextUp } from './WebNextUp'
import { LEX, SECTION_LABEL, useRowHover } from './kanbanWeb'
import { ListSurface, SectionHead, SideRow } from './WebListParts'

type Filter = { kind: 'life'; id: LifeCategoryId } | { kind: 'user'; id: string }

type Props = {
  tasks: MobileTask[]
  onSeeDone?: () => void
}

function shortDate(iso: string): string
{
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
}

/** valor curto para o resumo: cabe em meia coluna */
function moneyShort(v: number): string
{
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')} mil`
  return formatBRL(v)
}

function addDays(iso: string, n: number): string
{
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Lista de tarefas no computador, no jeito de app de produtividade de mesa:
 * coluna da esquerda navega (mês e listas), o centro é a lista densa do dia
 * e do que está em aberto, e em tela larga uma terceira coluna traz o "Agora",
 * o resumo e os próximos dias.
 */
export function WebListDesk({ tasks, onSeeDone }: Props)
{
  const { colors } = useTheme()
  const { width } = useWorkspace()
  // terceira coluna só quando o centro continua confortável (lista com uns 700px)
  const threeCol = width >= 1560
  const hoverBg = useRowHover()
  const isGuest = useAuthStore((s) => s.isGuest)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const fixas = useDataStore((s) => s.contasFixas)
  const bills = useDataStore((s) => s.contasAPagar)
  const cards = useDataStore((s) => s.financeCards)
  const settleBill = useDataStore((s) => s.settleBill)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const lists = useKanbanListsStore((s) => s.lists)
  const hydrate = useKanbanListsStore((s) => s.hydrate)
  const addList = useKanbanListsStore((s) => s.addList)
  const hydratePaid = useDuePaidStore((s) => s.hydrate)
  const isPaid = useDuePaidStore((s) => s.isPaid)
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
    () => tasks.filter((t) => isTaskPinnedToDay(t, dayIso, today)),
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

  const restOpenDay = dayTasks.filter((t) => t.status !== 'done' && !pinnedIds.has(t.id))
  // no computador o dia é uma agenda só, em ordem de horário; as "para entregar" levam a marca Alta
  const dayList = [...pinned, ...restOpenDay].sort(sortByDayTime)
  const agendaIds = new Set(dayList.map((t) => t.id))
  const open = scoped.filter((t) => t.status !== 'done' && !agendaIds.has(t.id))
  const doneDay = dayTasks.filter((t) => t.status === 'done')
  const activeListId = filter.kind === 'user' ? filter.id : null
  const lockedBills = dueBills.filter((b) => b.locked)
  const soonBills = dueBills.filter((b) => !b.locked)
  const dayCount = dayList.length + dueBills.length
  const billsTotal = dueBills.reduce((sum, b) => sum + (b.valor ?? 0), 0)
  const overdueCount = tasks.filter((t) =>
  {
    const due = t.dataVencimento?.slice(0, 10)
    return t.status !== 'done' && !!due && due < today
  }).length

  const listName = (t: MobileTask): string | null =>
  {
    const id = taskListId(t)
    return id ? (lists.find((l) => l.id === id)?.name ?? null) : null
  }

  // meta discreta: pasta (ou pilar), checklist, atraso
  const metaFor = (t: MobileTask): { text?: string; urgent: boolean } =>
  {
    const parts: string[] = []
    const due = t.dataVencimento?.slice(0, 10)
    const late = !!due && due < today
    if (late) parts.push(`Atrasada desde ${shortDate(due)}`)
    const folder = listName(t)
    if (folder) parts.push(folder)
    else
    {
      const cat = inferLifeCategory(t)
      if (cat !== 'importante') parts.push(LIFE_CATEGORIES.find((c) => c.id === cat)?.label ?? '')
    }
    if (t.checklist.length > 0)
    {
      const ok = t.checklist.filter((c) => c.feito).length
      parts.push(`${ok} de ${t.checklist.length} itens`)
    }
    return { text: parts.filter(Boolean).join(' · ') || undefined, urgent: late }
  }

  const tagsFor = (t: MobileTask, withDue: boolean): WebRowTag[] =>
  {
    const tags: WebRowTag[] = []
    // progresso vem de 0 a 1
    if (t.progresso > 0 && t.progresso < 1) tags.push({ label: `${Math.round(t.progresso * 100)}%` })
    if (withDue)
    {
      const due = t.dataVencimento?.slice(0, 10)
      if (!due) tags.push({ label: 'Sem data', color: colors.inkFaint })
      else if (due < today) tags.push({ label: shortDate(due), color: colors.danger })
      else tags.push({ label: due === today ? 'Hoje' : shortDate(due) })
    }
    if (t.prioridade === 1) tags.push({ label: 'Alta', color: colors.danger })
    else if (t.prioridade === 2) tags.push({ label: 'Média', color: colors.attention })
    return tags
  }

  const marked = useMemo(() =>
  {
    const set = new Set<string>()
    for (const t of tasks)
    {
      const due = t.dataVencimento?.slice(0, 10)
      if (t.status !== 'done' && due) set.add(due)
    }
    return set
  }, [tasks])

  const nextDays = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) =>
      {
        const iso = addDays(today, i + 1)
        const n = tasks.filter((t) => t.status !== 'done' && t.dataVencimento?.slice(0, 10) === iso).length
        const d = new Date(`${iso}T12:00:00`)
        const wd = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
        return { iso, n, label: i === 0 ? 'Amanhã' : `${wd.charAt(0).toUpperCase()}${wd.slice(1)}, ${shortDate(iso)}` }
      }),
    [tasks, today],
  )

  const filterRows = [
    ...KANBAN_LIFE_FILTERS.map((c) => ({
      key: `life-${c.id}`,
      icon: c.icon as IconName,
      label: c.label,
      count: filterByLifeCategory(tasks, c.id).filter((t) => t.status !== 'done').length,
      active: filter.kind === 'life' && filter.id === c.id,
      onPress: () => setFilter({ kind: 'life', id: c.id }),
    })),
    ...lists.map((l) => ({
      key: `user-${l.id}`,
      icon: 'folder-outline' as IconName,
      label: l.name,
      count: filterByUserList(tasks, l.id).filter((t) => t.status !== 'done').length,
      active: filter.kind === 'user' && filter.id === l.id,
      onPress: () => setFilter({ kind: 'user', id: l.id }),
    })),
  ]

  const dayDate = new Date(`${dayIso}T12:00:00`)
  const longDate = dayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const dayTitle = dayIso === today ? 'Hoje' : dayIso === addDays(today, 1) ? 'Amanhã' : shortDate(dayIso)

  const settle = (bill: (typeof dueBills)[number]) =>
  {
    // fixa: lança o gasto e marca o mês · fatura: paga a fatura · a pagar: quita
    void settleBill(bill, isGuest)
  }

  const sideColumn = (
    <Panel>
      <WebDateNav selectedIso={dayIso} onSelect={setDayIso} marked={marked} />
      <View style={{ gap: 2 }}>
        <Text style={[SECTION_LABEL, { color: colors.inkMuted, marginBottom: 6 }]}>Listas</Text>
        {filterRows.map((row) => (
          <SideRow key={row.key} icon={row.icon} label={row.label} count={row.count} active={row.active} onPress={row.onPress} />
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
              marginTop: 6,
              height: 36,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.hairlineStrong,
              paddingHorizontal: 10,
              color: colors.ink,
              backgroundColor: colors.elevated,
              fontSize: 14,
              fontFamily: 'Lexend_400Regular',
            }}
          />
        ) : (
          <SideRow icon="add" label="Nova pasta" onPress={() => setNaming(true)} />
        )}
      </View>
    </Panel>
  )

  const dayRows = dayList.map((t) =>
  {
    const meta = metaFor(t)
    return (
      <WebKanbanRow
        key={t.id}
        timeColumn
        time={t.horaMinutos != null ? minutesToLabel(t.horaMinutos) : undefined}
        title={t.titulo}
        meta={meta.text}
        urgent={meta.urgent}
        tags={tagsFor(t, false)}
        done={t.status === 'done'}
        onPress={() => openEvolve(t.id)}
        onToggle={() => void toggleTaskDone(t.id, isGuest)}
      />
    )
  })

  const billRows = [...lockedBills, ...soonBills].map((bill) => (
    <WebKanbanRow
      key={bill.key}
      leadIcon="wallet-outline"
      urgent={bill.locked}
      title={bill.titulo}
      meta={bill.detalhe}
      tags={[{ label: formatBRL(bill.valor), color: bill.locked ? colors.danger : colors.ink }]}
      action={{ label: 'Marcar paga', onPress: () => settle(bill) }}
    />
  ))

  const PRI: { id: 1 | 2 | 3; label: string; color: string }[] = [
    { id: 1, label: 'Prioridade alta', color: colors.danger },
    { id: 2, label: 'Prioridade média', color: colors.attention },
    { id: 3, label: 'Prioridade baixa', color: colors.inkMuted },
  ]
  const openGroups = PRI.map((p) => ({ ...p, list: open.filter((t) => t.prioridade === p.id) })).filter((g) => g.list.length > 0)

  const center = (
    <View style={{ gap: 16, minWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16, paddingHorizontal: 4 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 28, lineHeight: 36, color: colors.ink }}>{dayTitle}</Text>
          <Text style={[LEX.regular, { fontSize: 14, lineHeight: 20, color: colors.inkMuted }]}>
            {`${longDate.charAt(0).toUpperCase()}${longDate.slice(1)}`}
            {dayCount > 0 ? ` · ${dayCount} em aberto` : ''}
          </Text>
        </View>
      </View>

      {!threeCol ? (
        <Panel>
          <WebNextUp tasks={tasks} inline />
        </Panel>
      ) : null}

      <ListSurface>
        <SectionHead
          first
          title="Agenda do dia"
          count={dayList.length}
          onAdd={() => openCapture('task', activeListId, { studio: true })}
          addLabel="Nova tarefa neste dia"
        />
        {dayRows.length > 0 ? (
          dayRows.map((row) => (
            <View key={row.key} style={{ borderTopWidth: 1, borderTopColor: colors.hairline }}>
              {row}
            </View>
          ))
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 18 }}>
            <Icon name="sunny-outline" size={18} color={colors.inkMuted} />
            <Text style={[LEX.regular, { fontSize: 15, lineHeight: 22, color: colors.inkMuted }]}>
              {doneDay.length > 0 ? 'Tudo feito neste dia.' : 'Dia livre. Nada com prazo neste dia.'}
            </Text>
          </View>
        )}
        {doneDay.length > 0 && onSeeDone ? (
          <WebHoverable
            onPress={onSeeDone}
            accessibilityLabel={`${doneDay.length} feitas neste dia`}
            style={(hovered) => webStyle({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: colors.hairline,
              backgroundColor: hovered ? hoverBg : 'transparent',
              cursor: 'pointer',
            })}
          >
            <Icon name="checkmark-circle-outline" size={18} color={colors.inkMuted} />
            <Text style={[LEX.regular, { flex: 1, fontSize: 14, lineHeight: 20, color: colors.inkMuted }]}>
              {doneDay.length} feita{doneDay.length === 1 ? '' : 's'} neste dia
            </Text>
            <Text style={[LEX.medium, { fontSize: 14, lineHeight: 20, color: colors.axel }]}>Ver feitas</Text>
          </WebHoverable>
        ) : null}

        {billRows.length > 0 ? (
          <>
            <SectionHead title="Contas" count={billRows.length} color={lockedBills.length > 0 ? colors.danger : undefined} />
            {billRows.map((row) => (
              <View key={row.key} style={{ borderTopWidth: 1, borderTopColor: colors.hairline }}>
                {row}
              </View>
            ))}
          </>
        ) : null}
      </ListSurface>

      {openGroups.length > 0 ? (
        <ListSurface>
          {openGroups.map((g, gi) => (
            <View key={g.id}>
              <SectionHead
                first={gi === 0}
                title={g.label}
                count={g.list.length}
                color={g.color}
                onAdd={() => openCapture('task', activeListId, { studio: true, prioridade: g.id })}
                addLabel={`Nova tarefa com ${g.label.toLowerCase()}`}
              />
              {g.list.map((t) =>
              {
                const meta = metaFor(t)
                return (
                  <View key={t.id} style={{ borderTopWidth: 1, borderTopColor: colors.hairline }}>
                    <WebKanbanRow
                      title={t.titulo}
                      meta={meta.text}
                      urgent={meta.urgent}
                      tags={tagsFor(t, true).filter((x) => x.label !== 'Alta' && x.label !== 'Média')}
                      done={t.status === 'done'}
                      onPress={() => openEvolve(t.id)}
                      onToggle={() => void toggleTaskDone(t.id, isGuest)}
                    />
                  </View>
                )
              })}
            </View>
          ))}
        </ListSurface>
      ) : null}
    </View>
  )

  const stat = (label: string, value: string, tone?: string) => (
    <View style={{ gap: 2 }}>
      <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 26, lineHeight: 32, color: tone ?? colors.ink }}>{value}</Text>
      <Text style={[LEX.regular, { fontSize: 13, lineHeight: 18, color: colors.inkMuted }]}>{label}</Text>
    </View>
  )

  const aside = (
    <View style={{ gap: 16 }}>
      <Panel>
        <WebNextUp tasks={tasks} />
      </Panel>
      <Panel>
        <View style={{ gap: 14 }}>
          <Text style={[SECTION_LABEL, { color: colors.inkMuted }]}>{dayIso === today ? 'Resumo de hoje' : `Resumo de ${shortDate(dayIso)}`}</Text>
          <View style={webStyle({ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', rowGap: 16, columnGap: 12 })}>
            {stat('na agenda', String(dayList.length))}
            {stat('feitas', String(doneDay.length))}
            {stat('atrasadas', String(overdueCount), overdueCount > 0 ? colors.danger : undefined)}
            {stat(dueBills.length === 1 ? 'em 1 conta' : `em ${dueBills.length} contas`, moneyShort(billsTotal))}
          </View>
        </View>
        <View style={{ gap: 2 }}>
          <Text style={[SECTION_LABEL, { color: colors.inkMuted, marginBottom: 6 }]}>Próximos dias</Text>
          {nextDays.map((d) => (
            <SideRow
              key={d.iso}
              label={d.label}
              count={d.n > 0 ? `${d.n} tarefa${d.n === 1 ? '' : 's'}` : 'livre'}
              active={d.iso === dayIso}
              onPress={() => setDayIso(d.iso)}
            />
          ))}
        </View>
      </Panel>
    </View>
  )

  return (
    <View
      style={webStyle({
        display: 'grid',
        gridTemplateColumns: threeCol ? '272px minmax(0, 1fr) 320px' : '252px minmax(0, 1fr)',
        gap: 16,
        alignItems: 'start',
      })}
    >
      {sideColumn}
      {center}
      {threeCol ? aside : null}
    </View>
  )
}
