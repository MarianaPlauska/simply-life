import { useMemo, useState } from 'react'
import { View, ScrollView } from 'react-native'
import {
  LIFE_CATEGORIES,
  filterByLifeCategory,
  filterByUserList,
  localTodayIso,
  sortByDayTime,
  type LifeCategoryId,
  type MobileTask,
} from '@simply-life/shared'
import { Text, Chip, EmptyState } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import { KanbanTaskRow } from './KanbanTaskRow'

type Props = { tasks: MobileTask[] }

type Filter = { kind: 'life'; id: LifeCategoryId } | { kind: 'user'; id: string }

function groupLabel(iso: string | null, today: string): string
{
  if (!iso) return 'Sem data'
  if (iso === today) return 'Hoje'
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Aba Feitas — concluir some da Lista; o check aqui devolve a tarefa. */
export function KanbanDonePane({ tasks }: Props)
{
  const { space } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const lists = useKanbanListsStore((s) => s.lists)
  const [filter, setFilter] = useState<Filter>({ kind: 'life', id: 'todos' })
  const today = localTodayIso()

  const done = useMemo(() =>
  {
    const pool = tasks.filter((t) => t.status === 'done')
    const scoped =
      filter.kind === 'user'
        ? filterByUserList(pool, filter.id)
        : filterByLifeCategory(pool, filter.id)
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
      const list = map.get(key) ?? []
      list.push(t)
      map.set(key, list)
    }
    return [...map.entries()].map(([iso, items]) => ({
      key: iso || 'sem-data',
      label: groupLabel(iso || null, today),
      items,
    }))
  }, [done, today])

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="hero" style={{ fontSize: 28, letterSpacing: -0.8 }}>
          Histórico
        </Text>
        <Text variant="caption" muted>
          {done.length} feita{done.length === 1 ? '' : 's'} · check devolve à Lista. Excluir não apaga este histórico.
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
            count={filterByLifeCategory(tasks, c.id).filter((t) => t.status === 'done').length}
          />
        ))}
        {lists.map((l) => (
          <Chip
            key={l.id}
            label={l.name}
            active={filter.kind === 'user' && filter.id === l.id}
            onPress={() => setFilter({ kind: 'user', id: l.id })}
            count={filterByUserList(tasks, l.id).filter((t) => t.status === 'done').length}
          />
        ))}
      </ScrollView>

      {done.length === 0 ? (
        <EmptyState
          title="Nada concluído ainda"
          body="Na Lista, a caixinha marca a tarefa como feita e ela aparece aqui."
          icon="checkmark-circle-outline"
        />
      ) : null}

      {groups.map((g) => (
        <View key={g.key} style={{ gap: 10 }}>
          <Text variant="caption" muted>
            {g.label}
          </Text>
          {g.items.map((t) => (
            <KanbanTaskRow
              key={t.id}
              task={t}
              onToggle={() => void toggleTaskDone(t.id, isGuest)}
            />
          ))}
        </View>
      ))}
    </View>
  )
}
