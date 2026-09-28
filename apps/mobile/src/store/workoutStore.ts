import { create } from 'zustand'
import {
  buildSessionExercise,
  defaultWorkoutId,
  finalizeWorkoutSession,
  nextSetFrom,
  sessionFromRoutine,
  sessionPRs,
  type WorkoutCatalogExercise,
  type WorkoutPR,
  type WorkoutRoutine,
  type WorkoutSession,
  type WorkoutSet,
} from '@simply-life/shared'
import {
  deleteWorkoutRoutine,
  deleteWorkoutSession,
  fetchWorkoutRoutines,
  fetchWorkoutSessions,
  insertWorkoutSession,
  readWorkoutSnapshot,
  upsertWorkoutRoutine,
  writeWorkoutSnapshot,
} from '../lib/sync/workouts'

export type RestTimer = { endsAt: number; totalSec: number; exerciseName: string }

export type WorkoutSummary = { session: WorkoutSession; prs: WorkoutPR[] }

type State = {
  hydrated: boolean
  syncing: boolean
  /** Finalizadas, mais recente primeiro. */
  sessions: WorkoutSession[]
  routines: WorkoutRoutine[]
  active: WorkoutSession | null
  rest: RestTimer | null
  deletedRoutineIds: string[]

  hydrate: (isGuest: boolean) => Promise<void>
  sync: (isGuest: boolean) => Promise<void>

  saveRoutine: (routine: WorkoutRoutine, isGuest: boolean) => Promise<void>
  deleteRoutine: (id: string, isGuest: boolean) => Promise<void>

  startSession: (routine: WorkoutRoutine | null) => WorkoutSession
  addExercise: (ex: WorkoutCatalogExercise) => void
  removeExercise: (exId: string) => void
  addSet: (exId: string) => void
  removeSet: (exId: string, setId: string) => void
  updateSet: (exId: string, setId: string, patch: Partial<WorkoutSet>) => void
  /** Marca/desmarca; ao marcar, liga o descanso do exercício. */
  toggleSetDone: (exId: string, setId: string) => boolean
  setRestSec: (exId: string, sec: number) => void
  adjustRest: (deltaSec: number) => void
  skipRest: () => void
  renameActive: (title: string) => void
  finishSession: (isGuest: boolean, habitoId?: string | number | null) => WorkoutSummary | null
  discardSession: () => void
  deleteSession: (id: string, isGuest: boolean) => Promise<void>
}

const sortDesc = (list: WorkoutSession[]) =>
  [...list].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))

function mapActive(
  s: WorkoutSession | null,
  exId: string,
  fn: (e: WorkoutSession['exercises'][number]) => WorkoutSession['exercises'][number] | null,
): WorkoutSession | null
{
  if (!s) return s
  const exercises = s.exercises
    .map((e) => (e.id === exId ? fn(e) : e))
    .filter((e): e is WorkoutSession['exercises'][number] => e != null)
  return { ...s, exercises }
}

export const useWorkoutStore = create<State>((set, get) =>
{
  const persist = () =>
  {
    const { sessions, routines, active, deletedRoutineIds } = get()
    void writeWorkoutSnapshot({ sessions, routines, active, deletedRoutineIds })
  }

  const patchActive = (next: WorkoutSession | null) =>
  {
    set({ active: next })
    persist()
  }

  return {
    hydrated: false,
    syncing: false,
    sessions: [],
    routines: [],
    active: null,
    rest: null,
    deletedRoutineIds: [],

    hydrate: async (isGuest) =>
    {
      if (!get().hydrated)
      {
        const snap = await readWorkoutSnapshot()
        if (snap)
        {
          set({
            sessions: sortDesc(snap.sessions),
            routines: snap.routines,
            // não substitui uma sessão aberta nesta execução
            active: get().active ?? snap.active,
            deletedRoutineIds: snap.deletedRoutineIds ?? [],
          })
        }
        set({ hydrated: true })
      }
      await get().sync(isGuest)
    },

    sync: async (isGuest) =>
    {
      if (isGuest || get().syncing) return
      set({ syncing: true })
      try
      {
        // 1. envia o que ficou offline
        for (const localId of get().deletedRoutineIds)
        {
          await deleteWorkoutRoutine(localId)
          set({ deletedRoutineIds: get().deletedRoutineIds.filter((x) => x !== localId) })
        }
        for (const r of get().routines.filter((x) => !x.remoteId))
        {
          const remoteId = await upsertWorkoutRoutine(r)
          if (remoteId) set({ routines: get().routines.map((x) => (x.id === r.id ? { ...x, remoteId } : x)) })
        }
        for (const s of get().sessions.filter((x) => x.remoteId == null))
        {
          const remoteId = await insertWorkoutSession(s)
          if (remoteId != null)
          {
            set({ sessions: get().sessions.map((x) => (x.id === s.id ? { ...x, remoteId } : x)) })
          }
        }
        // 2. servidor é a fonte do histórico; mantém locais ainda sem id remoto
        const [remoteSessions, remoteRoutines] = await Promise.all([fetchWorkoutSessions(), fetchWorkoutRoutines()])
        const pending = get().sessions.filter((x) => x.remoteId == null)
        const seen = new Set(remoteSessions.map((s) => s.id))
        const pendingRoutines = get().routines.filter((x) => !x.remoteId && !remoteRoutines.some((r) => r.id === x.id))
        set({
          sessions: sortDesc([...remoteSessions, ...pending.filter((p) => !seen.has(p.id))]),
          routines: [...remoteRoutines, ...pendingRoutines],
        })
        persist()
      }
      catch
      {
        /* offline ou tabela ausente: segue com o local */
        persist()
      }
      finally
      {
        set({ syncing: false })
      }
    },

    saveRoutine: async (routine, isGuest) =>
    {
      const now = new Date().toISOString()
      const next = { ...routine, updatedAt: now, createdAt: routine.createdAt || now }
      const exists = get().routines.some((r) => r.id === routine.id)
      set({
        routines: exists ? get().routines.map((r) => (r.id === routine.id ? next : r)) : [next, ...get().routines],
      })
      persist()
      if (isGuest) return
      try
      {
        const remoteId = await upsertWorkoutRoutine(next)
        if (remoteId)
        {
          set({ routines: get().routines.map((r) => (r.id === next.id ? { ...r, remoteId } : r)) })
          persist()
        }
      }
      catch
      {
        /* fica pendente para o próximo sync */
        set({ routines: get().routines.map((r) => (r.id === next.id ? { ...r, remoteId: null } : r)) })
        persist()
      }
    },

    deleteRoutine: async (id, isGuest) =>
    {
      const target = get().routines.find((r) => r.id === id)
      set({ routines: get().routines.filter((r) => r.id !== id) })
      persist()
      if (isGuest || !target?.remoteId) return
      try
      {
        await deleteWorkoutRoutine(id)
      }
      catch
      {
        set({ deletedRoutineIds: [...get().deletedRoutineIds, id] })
        persist()
      }
    },

    startSession: (routine) =>
    {
      const s = sessionFromRoutine(routine, get().sessions, new Date().toISOString())
      set({ rest: null })
      patchActive(s)
      return s
    },

    addExercise: (ex) =>
    {
      const a = get().active
      if (!a) return
      const e = buildSessionExercise(
        { exerciseId: ex.id, name: ex.name, group: ex.group, bodyweight: ex.bodyweight },
        get().sessions,
      )
      patchActive({ ...a, exercises: [...a.exercises, e] })
    },

    removeExercise: (exId) =>
    {
      patchActive(mapActive(get().active, exId, () => null))
    },

    addSet: (exId) =>
    {
      patchActive(mapActive(get().active, exId, (e) => ({
        ...e,
        sets: [...e.sets, nextSetFrom(e.sets[e.sets.length - 1])],
      })))
    },

    removeSet: (exId, setId) =>
    {
      patchActive(mapActive(get().active, exId, (e) => ({ ...e, sets: e.sets.filter((s) => s.id !== setId) })))
    },

    updateSet: (exId, setId, patch) =>
    {
      patchActive(mapActive(get().active, exId, (e) => ({
        ...e,
        sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
      })))
    },

    toggleSetDone: (exId, setId) =>
    {
      const ex = get().active?.exercises.find((e) => e.id === exId)
      const cur = ex?.sets.find((s) => s.id === setId)
      if (!ex || !cur) return false
      const done = !cur.done
      get().updateSet(exId, setId, { done })
      if (done && ex.restSec > 0)
      {
        set({ rest: { endsAt: Date.now() + ex.restSec * 1000, totalSec: ex.restSec, exerciseName: ex.name } })
      }
      else if (!done)
      {
        set({ rest: null })
      }
      return done
    },

    setRestSec: (exId, sec) =>
    {
      patchActive(mapActive(get().active, exId, (e) => ({ ...e, restSec: Math.max(0, Math.min(600, sec)) })))
    },

    adjustRest: (deltaSec) =>
    {
      const r = get().rest
      if (!r) return
      const endsAt = r.endsAt + deltaSec * 1000
      if (endsAt <= Date.now()) set({ rest: null })
      else set({ rest: { ...r, endsAt, totalSec: Math.max(1, r.totalSec + deltaSec) } })
    },

    skipRest: () => set({ rest: null }),

    renameActive: (title) =>
    {
      const a = get().active
      if (a) patchActive({ ...a, title })
    },

    finishSession: (isGuest, habitoId) =>
    {
      const a = get().active
      if (!a) return null
      const done = finalizeWorkoutSession(a, new Date().toISOString())
      set({ active: null, rest: null })
      if (!done.exercises.length)
      {
        persist()
        return null
      }
      const prs = sessionPRs(done, get().sessions)
      set({ sessions: sortDesc([done, ...get().sessions]) })
      persist()
      if (!isGuest)
      {
        void insertWorkoutSession(done, habitoId)
          .then((remoteId) =>
          {
            if (remoteId == null) return
            set({ sessions: get().sessions.map((s) => (s.id === done.id ? { ...s, remoteId } : s)) })
            persist()
          })
          .catch(() => undefined)
      }
      return { session: done, prs }
    },

    discardSession: () =>
    {
      set({ rest: null })
      patchActive(null)
    },

    deleteSession: async (id, isGuest) =>
    {
      const target = get().sessions.find((s) => s.id === id)
      set({ sessions: get().sessions.filter((s) => s.id !== id) })
      persist()
      if (isGuest || target?.remoteId == null) return
      try
      {
        await deleteWorkoutSession(target.remoteId)
      }
      catch
      {
        /* volta se o servidor recusou, para não sumir só aqui */
        set({ sessions: sortDesc([...get().sessions, target]) })
        persist()
      }
    },
  }
})

/** Id novo para rotinas criadas na tela. */
export const newWorkoutId = defaultWorkoutId
