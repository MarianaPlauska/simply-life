import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  buildRoutineWeek,
  childrenOf,
  groupCompleteToday,
  localTodayIso,
  type RoutineHabit,
} from '@simply-life/shared'
import { Text, PrimaryButton, PressableScale, EmptyState } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useRoutineStore } from '../../store/routineStore'
import { RoutineWeekStrip } from './RoutineWeekStrip'
import { RoutineHabitCard } from './RoutineHabitCard'
import { RoutineEditorSheet } from './RoutineEditorSheet'

/** Modo Rotina do Kanban — hábitos do dia, sequências e grupos. */
export function KanbanRoutinePane()
{
  const { colors, space } = useTheme()
  const items = useRoutineStore((s) => s.items)
  const logs = useRoutineStore((s) => s.logs)
  const hydrate = useRoutineStore((s) => s.hydrate)
  const tick = useRoutineStore((s) => s.tick)
  const untick = useRoutineStore((s) => s.untick)
  const completeGroup = useRoutineStore((s) => s.completeGroup)
  const addHabit = useRoutineStore((s) => s.addHabit)
  const today = localTodayIso()
  const [viewIso, setViewIso] = useState(today)
  const [editor, setEditor] = useState<'habit' | 'routine' | null>(null)
  const [parentForHabit, setParentForHabit] = useState<string | null>(null)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  useEffect(() =>
  {
    setViewIso(today)
  }, [today])

  const week = useMemo(() => buildRoutineWeek(items, logs), [items, logs])
  const roots = items.filter((h) => h.parentId == null)
  const viewingToday = viewIso === today
  const dayTitle = week.find((c) => c.iso === viewIso)
  const dayLabel = viewingToday
    ? 'Para hoje'
    : dayTitle
      ? `${dayTitle.label} ${dayTitle.dayNum}`
      : viewIso

  const onLeaf = (habit: RoutineHabit) =>
  {
    const n = logs[habit.id]?.[viewIso] ?? 0
    const cap = habit.cadence === 'weekly' ? 1 : Math.max(1, habit.dailyTarget)
    if (n >= cap)
    {
      for (let i = 0; i < n; i += 1) untick(habit.id, viewIso)
      return
    }
    tick(habit.id, viewIso)
  }

  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="hero" style={{ fontSize: 28, letterSpacing: -0.8 }}>
            Rotina
          </Text>
          <Text variant="caption" muted>
            Hábitos constantes — check e o quadriculado da sequência
          </Text>
        </View>
        <PrimaryButton
          label="Novo hábito"
          size="sm"
          variant="secondary"
          onPress={() =>
          {
            setParentForHabit(null)
            setEditor('habit')
          }}
        />
      </View>

      <RoutineWeekStrip cells={week} selectedIso={viewIso} onSelect={setViewIso} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="section" style={{ fontSize: 18 }}>
          {dayLabel}
        </Text>
        <PrimaryButton
          label="Nova rotina"
          size="sm"
          variant="ghost"
          onPress={() => setEditor('routine')}
        />
      </View>

      {roots.length === 0 ? (
        <EmptyState
          title="Sem rotina ainda"
          body="Crie um hábito diário ou uma rotina com vários passos."
          icon="sunny-outline"
        />
      ) : null}

      {roots.map((item) =>
      {
        if (!item.isGroup)
        {
          return (
            <RoutineHabitCard
              key={item.id}
              habit={item}
              logs={logs}
              iso={viewIso}
              onToggle={() => onLeaf(item)}
            />
          )
        }
        const kids = childrenOf(items, item.id)
        const expanded = openGroups[item.id] !== false
        const allDone = groupCompleteToday(items, logs, item.id, viewIso)
        return (
          <View key={item.id} style={{ gap: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <RoutineHabitCard
                  habit={item}
                  logs={logs}
                  iso={viewIso}
                  items={items}
                  checked={allDone}
                  onToggle={() =>
                  {
                    if (allDone)
                    {
                      kids.forEach((k) =>
                      {
                        const n = logs[k.id]?.[viewIso] ?? 0
                        for (let i = 0; i < n; i += 1) untick(k.id, viewIso)
                      })
                      return
                    }
                    completeGroup(item.id, viewIso)
                  }}
                />
              </View>
              <PressableScale
                accessibilityLabel={expanded ? 'Recolher rotina' : 'Abrir rotina'}
                onPress={() => setOpenGroups((s) => ({ ...s, [item.id]: !expanded }))}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={expanded ? 'chevron-down' : 'chevron-forward'}
                  size={18}
                  color={colors.inkMuted}
                />
              </PressableScale>
            </View>
            <Text variant="caption" muted style={{ paddingLeft: 42, marginTop: -8, marginBottom: 4 }}>
              {kids.length} hábito{kids.length === 1 ? '' : 's'} nesta rotina
            </Text>
            {expanded ? (
              <View>
                {kids.map((kid) => (
                  <RoutineHabitCard
                    key={kid.id}
                    habit={kid}
                    logs={logs}
                    iso={viewIso}
                    nested
                    onToggle={() => onLeaf(kid)}
                  />
                ))}
                <PressableScale
                  onPress={() =>
                  {
                    setParentForHabit(item.id)
                    setEditor('habit')
                  }}
                  style={{ minHeight: 44, paddingLeft: 42, justifyContent: 'center' }}
                >
                  <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
                    + Hábito nesta rotina
                  </Text>
                </PressableScale>
              </View>
            ) : null}
          </View>
        )
      })}

      <RoutineEditorSheet
        visible={editor != null}
        mode={editor === 'routine' ? 'routine' : 'habit'}
        onClose={() =>
        {
          setEditor(null)
          setParentForHabit(null)
        }}
        onSave={(payload) =>
        {
          addHabit(payload.title, {
            parentId: editor === 'habit' ? parentForHabit : null,
            isGroup: editor === 'routine',
            cadence: payload.cadence,
            dailyTarget: payload.dailyTarget,
            weeklyTarget: payload.weeklyTarget,
          })
        }}
      />
    </View>
  )
}
