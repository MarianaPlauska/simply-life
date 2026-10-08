import { useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  KANBAN_LIFE_FILTERS,
  filterByLifeCategory,
  filterByUserList,
  localTodayIso,
  minutesToLabel,
  sortByDayTime,
  type LifeCategoryId,
  type MobileTask,
} from '@simply-life/shared'
import { Text } from '../../../ui'
import { Icon, type IconName } from '../../../ui/Icon'
import { Panel } from '../../../ui/Panel'
import { useTheme } from '../../../theme/ThemeProvider'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { useKanbanListsStore } from '../../../store/kanbanListsStore'
import { useTaskEvolveStore } from '../../../store/taskEvolveStore'
import { WebKanbanRow } from './WebKanbanRow'
import { ListSurface, SectionHead, SideRow } from './WebListParts'
import { LEX, SECTION_LABEL } from './kanbanWeb'

type Filter = { kind: 'life'; id: LifeCategoryId } | { kind: 'user'; id: string }

function groupLabel(iso: string | null, today: string): string
{
  if (!iso) return 'Sem data'
  if (iso === today) return 'Hoje'
  const d = new Date(`${iso}T12:00:00`)
  const s = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}`
}

/** Feitas no computador: filtros numa coluna, histórico agrupado por dia numa lista densa. */
export function WebDonePane({ tasks }: { tasks: MobileTask[] })
{
  const { colors } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const openEvolve = useTaskEvolveStore((s) => s.open)
  const lists = useKanbanListsStore((s) => s.lists)
  const [filter, setFilter] = useState<Filter>({ kind: 'life', id: 'todos' })
  const today = localTodayIso()

  const done = useMemo(() =>
  {
    const pool = tasks.filter((t) => t.status === 'done')
    const scoped = filter.kind === 'user' ? filterByUserList(pool, filter.id) : filterByLifeCategory(pool, filter.id)
    return [...scoped].sort((a, b) =>
    {
      const da = a.dataVencimento?.slice(0, 10) ?? ''
      const db = b.dataVencimento?.slice(0, 10) ?? ''
      if (da !== db) return db.localeCompare(da)
      return sortByDayTime(a, b)
    })
  }, [tasks, filter])

  const groups = useMemo(() =>
  {
    const map = new Map<string, MobileTask[]>()
    for (const t of done)
    {
      const key = t.dataVencimento?.slice(0, 10) ?? ''
      map.set(key, [...(map.get(key) ?? []), t])
    }
    return [...map.entries()].map(([iso, items]) => ({ key: iso || 'sem-data', label: groupLabel(iso || null, today), items }))
  }, [done, today])

  const rows = [
    ...KANBAN_LIFE_FILTERS.map((c) => ({
      key: `life-${c.id}`,
      icon: c.icon as IconName,
      label: c.label,
      count: filterByLifeCategory(tasks, c.id).filter((t) => t.status === 'done').length,
      active: filter.kind === 'life' && filter.id === c.id,
      onPress: () => setFilter({ kind: 'life', id: c.id }),
    })),
    ...lists.map((l) => ({
      key: `user-${l.id}`,
      icon: 'folder-outline' as IconName,
      label: l.name,
      count: filterByUserList(tasks, l.id).filter((t) => t.status === 'done').length,
      active: filter.kind === 'user' && filter.id === l.id,
      onPress: () => setFilter({ kind: 'user', id: l.id }),
    })),
  ]

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
      <View style={{ width: 252 }}>
        <Panel>
          <View style={{ gap: 2 }}>
            <Text style={[SECTION_LABEL, { color: colors.inkMuted, marginBottom: 6 }]}>Listas</Text>
            {rows.map((r) => (
              <SideRow key={r.key} icon={r.icon} label={r.label} count={r.count} active={r.active} onPress={r.onPress} />
            ))}
          </View>
          <Text style={[LEX.regular, { fontSize: 14, lineHeight: 20, color: colors.inkMuted }]}>
            A caixinha devolve a tarefa para a Lista. Excluir uma tarefa não apaga o histórico daqui.
          </Text>
        </Panel>
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: 16 }}>
        <Text style={[LEX.regular, { fontSize: 15, lineHeight: 22, color: colors.inkMuted, paddingHorizontal: 4 }]}>
          {done.length} feita{done.length === 1 ? '' : 's'}
        </Text>
        <ListSurface>
          {done.length === 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
              <Icon name="checkmark-circle-outline" size={18} color={colors.inkMuted} />
              <Text style={[LEX.regular, { fontSize: 15, lineHeight: 22, color: colors.inkMuted }]}>
                Nada concluído ainda. Na Lista, a caixinha marca a tarefa como feita e ela aparece aqui.
              </Text>
            </View>
          ) : null}
          {groups.map((g, gi) => (
            <View key={g.key}>
              <SectionHead first={gi === 0} title={g.label} count={g.items.length} />
              {g.items.map((t) => (
                <View key={t.id} style={{ borderTopWidth: 1, borderTopColor: colors.hairline }}>
                  <WebKanbanRow
                    timeColumn
                    time={t.horaMinutos != null ? minutesToLabel(t.horaMinutos) : undefined}
                    title={t.titulo}
                    done
                    onPress={() => openEvolve(t.id)}
                    onToggle={() => void toggleTaskDone(t.id, isGuest)}
                  />
                </View>
              ))}
            </View>
          ))}
        </ListSurface>
      </View>
    </View>
  )
}
