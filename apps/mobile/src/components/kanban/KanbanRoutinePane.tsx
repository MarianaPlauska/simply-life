import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Icon } from '../../ui/Icon'
import { confirmDestructive } from '../../lib/confirmDestructive'
import {
  buildRoutineWeek,
  childrenOf,
  findHabit,
  groupCompleteToday,
  habitMetOn,
  isWaterRoutineHabit,
  localTodayIso,
  mondayOfLocalWeek,
  routineWeekTitle,
  waterRoutineGate,
  type RoutineHabit,
} from '@simply-life/shared'
import { Text, PrimaryButton, PressableScale, EmptyState, PillTabs, PaneTitle } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useRoutineStore } from '../../store/routineStore'
import { useDataStore } from '../../store/dataStore'
import { RoutineWeekStrip } from './RoutineWeekStrip'
import { RoutineHabitCard } from './RoutineHabitCard'
import { RoutineEditorSheet } from './RoutineEditorSheet'
import { RoutineReportPane } from './RoutineReportPane'
import { useWebDesk } from '../dashboard/web/webBox'
import { WebHoverable } from '../dashboard/web/WebHoverable'
import { webStyle } from '../dashboard/web/webStyle'
import { WebSegmented } from './web/WebListParts'
import { LEX, useRowHover } from './web/kanbanWeb'

type RoutineView = 'hoje' | 'relatorio'

/** Modo Rotina do Kanban — hábitos do dia, sequências e grupos. */
export function KanbanRoutinePane()
{
  const { colors, space } = useTheme()
  // computador: uma barra de ferramentas só (modo, semana, criar); celular sem mudança
  const desk = useWebDesk()
  const hoverBg = useRowHover()
  const items = useRoutineStore((s) => s.items)
  const logs = useRoutineStore((s) => s.logs)
  const hydrate = useRoutineStore((s) => s.hydrate)
  const tick = useRoutineStore((s) => s.tick)
  const untick = useRoutineStore((s) => s.untick)
  const addHabit = useRoutineStore((s) => s.addHabit)
  const update = useRoutineStore((s) => s.update)
  const remove = useRoutineStore((s) => s.remove)
  const healthHabits = useDataStore((s) => s.habits)
  const agua = findHabit(healthHabits, 'agua')
  const today = localTodayIso()
  const [view, setView] = useState<RoutineView>('hoje')
  const [weekOffset, setWeekOffset] = useState(0)
  const [viewIso, setViewIso] = useState(today)
  const [editor, setEditor] = useState<'habit' | 'routine' | null>(null)
  const [editing, setEditing] = useState<RoutineHabit | null>(null)
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

  const week = useMemo(() => buildRoutineWeek(items, logs, new Date(), weekOffset), [items, logs, weekOffset])
  const weekTitle = useMemo(() => routineWeekTitle(weekOffset), [weekOffset])
  const roots = items.filter((h) => h.parentId == null)
  const viewingToday = viewIso === today
  const dayTitle = week.find((c) => c.iso === viewIso)
  const dayLabel = viewingToday
    ? 'Para hoje'
    : dayTitle
      ? `${dayTitle.label} ${dayTitle.dayNum}`
      : viewIso

  const openCreate = (kind: 'habit' | 'routine', parentId: string | null = null) =>
  {
    setEditing(null)
    setParentForHabit(parentId)
    setEditor(kind)
  }

  const openEdit = (habit: RoutineHabit) =>
  {
    setEditing(habit)
    setParentForHabit(habit.parentId)
    setEditor(habit.isGroup ? 'routine' : 'habit')
  }

  const closeEditor = () =>
  {
    setEditor(null)
    setEditing(null)
    setParentForHabit(null)
  }

  const confirmRemove = (habit: RoutineHabit, childCount = 0) =>
  {
    const isGroup = habit.isGroup
    const title = isGroup ? 'Excluir rotina' : 'Excluir hábito'
    const message = isGroup
      ? `Remove "${habit.title}" e ${childCount} hábito${childCount === 1 ? '' : 's'} dentro dela. Não tem volta.`
      : `Remove "${habit.title}" e o histórico de checks. Não tem volta.`
    confirmDestructive(title, message, () => remove(habit.id))
  }

  const waterLockFor = (habit: RoutineHabit): { locked: boolean; hint: string } =>
  {
    if (!isWaterRoutineHabit(habit) || viewIso !== today)
    {
      return { locked: false, hint: '' }
    }
    const gate = waterRoutineGate(agua?.progressoAtual ?? 0, agua?.metaDiaria ?? 10)
    return { locked: gate.locked, hint: gate.progressLabel }
  }

  const onLeaf = (habit: RoutineHabit) =>
  {
    const n = logs[habit.id]?.[viewIso] ?? 0
    const cap = habit.cadence === 'weekly' ? 1 : Math.max(1, habit.dailyTarget)
    const done = habitMetOn(habit, logs, viewIso)
    const { locked } = waterLockFor(habit)
    if (locked && !done)
    {
      return
    }
    if (n >= cap)
    {
      for (let i = 0; i < n; i += 1) untick(habit.id, viewIso)
      return
    }
    tick(habit.id, viewIso)
  }

  const waterCardProps = (habit: RoutineHabit) =>
  {
    const { locked, hint } = waterLockFor(habit)
    const done = habitMetOn(habit, logs, viewIso)
    return {
      locked: locked && !done,
      lockHint: locked && !done ? hint : undefined,
    }
  }

  const renderRoot = (item: RoutineHabit) =>
  {
    if (!item.isGroup)
    {
      return (
        <RoutineHabitCard
          key={item.id}
          habit={item}
          logs={logs}
          iso={viewIso}
          {...waterCardProps(item)}
          onToggle={() => onLeaf(item)}
          onEdit={() => openEdit(item)}
        />
      )
    }
    const kids = childrenOf(items, item.id)
    const expanded = openGroups[item.id] !== false
    const allDone = groupCompleteToday(items, logs, item.id, viewIso)
    return (
      <View key={item.id} style={{ gap: 12 }}>
        <RoutineHabitCard
          habit={item}
          logs={logs}
          iso={viewIso}
          items={items}
          isGroupHeader
          childCount={kids.length}
          expanded={expanded}
          checked={allDone}
          onExpand={() => setOpenGroups((s) => ({ ...s, [item.id]: !expanded }))}
          onEdit={() => openEdit(item)}
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
            kids.forEach((k) =>
            {
              const done = habitMetOn(k, logs, viewIso)
              const { locked } = waterLockFor(k)
              if (locked && !done) return
              const n = logs[k.id]?.[viewIso] ?? 0
              const cap = k.cadence === 'weekly' ? 1 : Math.max(1, k.dailyTarget)
              if (n < cap) tick(k.id, viewIso)
            })
          }}
        />
        {expanded ? (
          <View
            style={{
              marginLeft: 14,
              paddingLeft: 14,
              borderLeftWidth: 2,
              borderLeftColor: colors.hairline,
              gap: 12,
            }}
          >
            {kids.map((kid) => (
              <RoutineHabitCard
                key={kid.id}
                habit={kid}
                logs={logs}
                iso={viewIso}
                nested
                {...waterCardProps(kid)}
                onToggle={() => onLeaf(kid)}
                onEdit={() => openEdit(kid)}
              />
            ))}
            <PressableScale
              onPress={() => openCreate('habit', item.id)}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
                + Hábito nesta rotina
              </Text>
            </PressableScale>
          </View>
        ) : null}
      </View>
    )
  }

  const editorSheet = (
    <RoutineEditorSheet
      visible={editor != null}
      mode={editor === 'routine' ? 'routine' : 'habit'}
      editing={editing}
      onClose={closeEditor}
      onDelete={editing ? () => confirmRemove(editing, editing.isGroup ? childrenOf(items, editing.id).length : 0) : undefined}
      onSave={(payload) =>
      {
        if (editing)
        {
          update(editing.id, payload)
          return
        }
        addHabit(payload.title, {
          parentId: editor === 'habit' ? parentForHabit : null,
          isGroup: editor === 'routine',
          cadence: payload.cadence,
          dailyTarget: payload.dailyTarget,
          weeklyTarget: payload.weeklyTarget,
        })
      }}
    />
  )

  const shiftWeek = (dir: 1 | -1) =>
  {
    const next = weekOffset + dir
    setWeekOffset(next)
    const monday = mondayOfLocalWeek(new Date())
    monday.setDate(monday.getDate() + next * 7)
    setViewIso(localTodayIso(monday))
  }

  const deskBtn = (label: string, onPress: () => void, fill?: boolean) => (
    <WebHoverable
      onPress={onPress}
      accessibilityLabel={label}
      style={(h) => webStyle({
        height: 36,
        justifyContent: 'center',
        paddingHorizontal: 14,
        borderRadius: 8,
        borderWidth: fill ? 0 : 1,
        borderColor: colors.hairline,
        backgroundColor: fill ? colors.axelFill : h ? hoverBg : colors.elevated,
        opacity: fill && h ? 0.9 : 1,
        cursor: 'pointer',
      })}
    >
      <Text style={[LEX.medium, { fontSize: 14, lineHeight: 20, color: fill ? colors.axelOnFill : colors.ink }]}>{label}</Text>
    </WebHoverable>
  )

  const deskArrow = (dir: 1 | -1) => (
    <WebHoverable
      onPress={() => shiftWeek(dir)}
      accessibilityLabel={dir < 0 ? 'Semana anterior' : 'Próxima semana'}
      style={(h) => webStyle({
        width: 34,
        height: 34,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: h ? hoverBg : 'transparent',
        cursor: 'pointer',
      })}
    >
      <Icon name={dir < 0 ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.inkMuted} />
    </WebHoverable>
  )

  if (desk)
  {
    return (
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <WebSegmented
            options={[
              { id: 'hoje', label: 'Dia a dia' },
              { id: 'relatorio', label: 'Relatório' },
            ]}
            value={view}
            onChange={setView}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {deskArrow(-1)}
            <Text style={[LEX.medium, { fontSize: 15, lineHeight: 22, color: colors.ink, minWidth: 180, textAlign: 'center' }]}>
              {weekTitle.charAt(0).toUpperCase() + weekTitle.slice(1)}
            </Text>
            {deskArrow(1)}
            {weekOffset !== 0 ? (
              <WebHoverable
                onPress={() =>
                {
                  setWeekOffset(0)
                  setViewIso(today)
                }}
                accessibilityLabel="Voltar para esta semana"
                style={webStyle({ paddingHorizontal: 8, cursor: 'pointer' })}
              >
                <Text style={[LEX.medium, { fontSize: 14, lineHeight: 20, color: colors.axel }]}>Esta semana</Text>
              </WebHoverable>
            ) : null}
          </View>
          <View style={{ flex: 1 }} />
          {view === 'hoje' ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {deskBtn('Nova rotina', () => openCreate('routine'))}
              {deskBtn('Novo hábito', () => openCreate('habit'), true)}
            </View>
          ) : null}
        </View>

        {view === 'hoje' ? <RoutineWeekStrip cells={week} selectedIso={viewIso} onSelect={setViewIso} /> : null}
        {view === 'relatorio' ? <RoutineReportPane items={items} logs={logs} weekOffset={weekOffset} /> : null}

        {view === 'hoje' ? (
          <View style={{ gap: 12 }}>
            <Text style={[LEX.medium, { fontSize: 17, lineHeight: 24, color: colors.ink }]}>{dayLabel}</Text>
            {roots.length === 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  backgroundColor: colors.elevated,
                }}
              >
                <Icon name="sunny-outline" size={18} color={colors.inkMuted} />
                <Text style={[LEX.regular, { flex: 1, fontSize: 15, lineHeight: 22, color: colors.inkMuted }]}>
                  Sem rotina ainda. Crie um hábito diário ou uma rotina com vários passos.
                </Text>
                {deskBtn('Novo hábito', () => openCreate('habit'), true)}
              </View>
            ) : null}
            {roots.map((item) => renderRoot(item))}
          </View>
        ) : null}
        {editorSheet}
      </View>
    )
  }

  return (
    <View style={{ gap: space.md }}>
      <PaneTitle title="Rotina" subtitle="Marque o que fez hoje. A semana mostra a sequência." />
      {/* criar fica num lugar só, no topo */}
      {view === 'hoje' ? (
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: -4 }}>
          <PrimaryButton label="Novo hábito" size="sm" variant="secondary" onPress={() => openCreate('habit')} />
          <PrimaryButton label="Nova rotina" size="sm" variant="ghost" onPress={() => openCreate('routine')} />
        </View>
      ) : null}

      <PillTabs
        tabs={[
          { id: 'hoje', label: 'Hoje' },
          { id: 'relatorio', label: 'Relatório' },
        ]}
        value={view}
        onChange={setView}
      />

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <PressableScale
            accessibilityLabel="Semana anterior"
            onPress={() =>
            {
              const next = weekOffset - 1
              setWeekOffset(next)
              const monday = mondayOfLocalWeek(new Date())
              monday.setDate(monday.getDate() + next * 7)
              setViewIso(localTodayIso(monday))
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.elevated,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="chevron-back" size={18} color={colors.inkMuted} />
          </PressableScale>
          <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Text variant="bodyStrong" style={{ textAlign: 'center' }}>
              {weekTitle.charAt(0).toUpperCase() + weekTitle.slice(1)}
            </Text>
            {weekOffset !== 0 ? (
              <PressableScale
                accessibilityLabel="Voltar para esta semana"
                onPress={() =>
                {
                  setWeekOffset(0)
                  setViewIso(today)
                }}
              >
                <Text variant="micro" color={colors.axel} style={{ fontWeight: '700' }}>
                  Esta semana
                </Text>
              </PressableScale>
            ) : null}
          </View>
          <PressableScale
            accessibilityLabel="Próxima semana"
            onPress={() =>
            {
              const next = weekOffset + 1
              setWeekOffset(next)
              const monday = mondayOfLocalWeek(new Date())
              monday.setDate(monday.getDate() + next * 7)
              setViewIso(localTodayIso(monday))
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.elevated,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="chevron-forward" size={18} color={colors.inkMuted} />
          </PressableScale>
        </View>
        {view === 'hoje' ? (
          <RoutineWeekStrip cells={week} selectedIso={viewIso} onSelect={setViewIso} />
        ) : null}
      </View>

      {view === 'relatorio' ? (
        <RoutineReportPane items={items} logs={logs} weekOffset={weekOffset} />
      ) : null}

      {view === 'hoje' ? (
      <View style={{ gap: space.md }}>
      <Text variant="section">
        {dayLabel}
      </Text>

      {roots.length === 0 ? (
        <EmptyState
          title="Sem rotina ainda"
          body="Crie um hábito diário ou uma rotina com vários passos."
          icon="sunny-outline"
        />
      ) : null}

      {roots.map((item) => renderRoot(item))}
      </View>
      ) : null}

      {editorSheet}
    </View>
  )
}
