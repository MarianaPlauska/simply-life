import { useEffect, useMemo } from 'react'
import { buildCircleOverview, type CircleOverview } from '@simply-life/shared'
import { useCircleStore } from '../store/circleStore'
import { useSharedGoalsStore } from '../store/sharedGoalsStore'
import { useTaskWaitStore } from '../store/taskWaitStore'
import { useDataStore } from '../store/dataStore'

/** Junta amigos, metas juntos e esperas num resumo por pessoa. */
export function useCircleOverview(): CircleOverview & { loading: boolean }
{
  const friends = useCircleStore((s) => s.friends)
  const loadFriends = useCircleStore((s) => s.load)
  const friendsLoading = useCircleStore((s) => s.loading)
  const goals = useSharedGoalsStore((s) => s.goals)
  const progress = useSharedGoalsStore((s) => s.progress)
  const members = useSharedGoalsStore((s) => s.members)
  const goalsLoaded = useSharedGoalsStore((s) => s.loaded)
  const loadGoals = useSharedGoalsStore((s) => s.load)
  const loadMembers = useSharedGoalsStore((s) => s.loadMembers)
  const waits = useTaskWaitStore((s) => s.waits)
  const hydrateWaits = useTaskWaitStore((s) => s.hydrate)
  const tasks = useDataStore((s) => s.tasks) ?? []

  useEffect(() =>
  {
    void loadFriends()
    void hydrateWaits()
    if (!goalsLoaded) void loadGoals()
  }, [loadFriends, hydrateWaits, goalsLoaded, loadGoals])

  // pessoas de cada meta ainda não carregadas
  const missing = useMemo(() => goals.filter((g) => !members[g.id]).map((g) => g.id), [goals, members])
  useEffect(() =>
  {
    if (missing.length) void loadMembers(missing)
  }, [missing.join('|'), loadMembers])

  const overview = useMemo(
    () =>
      buildCircleOverview({
        friends: friends.map((f) => ({ userId: f.userId, displayName: f.displayName, accent: f.accent, avatarStyle: f.avatarStyle })),
        goals,
        progress,
        members,
        waits,
        tasks,
      }),
    [friends, goals, progress, members, waits, tasks],
  )

  return { ...overview, loading: friendsLoading || !goalsLoaded }
}
