import {
  WORKOUT_CATALOG,
  bestSetForExercise,
  buildSessionExercise,
  epley1RM,
  finalizeWorkoutSession,
  lastTimeSets,
  routineFromSession,
  searchWorkoutCatalog,
  sessionFromRoutine,
  sessionPRs,
  weeklyVolumeByGroup,
  workoutFromSessaoRow,
  workoutSessionTotals,
  workoutSessionVolume,
  workoutSessionsInRange,
  workoutToDetalhe,
  workoutWeekRange,
  type WorkoutRoutine,
  type WorkoutSession,
} from '../workout'

let n = 0
const id = () => `id${n++}`

function session(
  sid: string,
  startedAt: string,
  exercises: { exerciseId: string; group?: WorkoutSession['exercises'][number]['group']; sets: [number, number, boolean?][] }[],
  finished = true,
): WorkoutSession
{
  return {
    id: sid,
    title: 'Treino',
    startedAt,
    finishedAt: finished ? startedAt : null,
    exercises: exercises.map((e, i) => ({
      id: `${sid}-e${i}`,
      exerciseId: e.exerciseId,
      name: e.exerciseId,
      group: e.group ?? 'peito',
      restSec: 90,
      sets: e.sets.map(([kg, reps, done = true], j) => ({ id: `${sid}-${i}-${j}`, cargaKg: kg, reps, done })),
    })),
  }
}

describe('catálogo', () =>
{
  it('tem uns 60 exercícios com ids únicos', () =>
  {
    expect(WORKOUT_CATALOG.length).toBeGreaterThanOrEqual(55)
    expect(new Set(WORKOUT_CATALOG.map((e) => e.id)).size).toBe(WORKOUT_CATALOG.length)
  })

  it('busca sem acento e por grupo', () =>
  {
    expect(searchWorkoutCatalog('triceps').some((e) => e.id === 'triceps-corda')).toBe(true)
    expect(searchWorkoutCatalog('supino').every((e) => e.name.toLowerCase().includes('supino'))).toBe(true)
    expect(searchWorkoutCatalog('')).toHaveLength(WORKOUT_CATALOG.length)
  })

  it('nomes sem travessões', () =>
  {
    expect(WORKOUT_CATALOG.some((e) => /[—–−]/.test(e.name))).toBe(false)
  })
})

describe('volume', () =>
{
  it('soma carga × reps só das séries feitas', () =>
  {
    const s = session('a', '2026-09-28T10:00:00', [
      { exerciseId: 'supino-reto-barra', sets: [[60, 10], [60, 8], [60, 8, false]] },
      { exerciseId: 'flexao', sets: [[0, 15]] },
    ])
    expect(workoutSessionVolume(s)).toBe(1080)
    expect(workoutSessionTotals(s)).toEqual({ sets: 3, reps: 33, volumeKg: 1080, exercises: 2 })
  })

  it('volume semanal por grupo, semana de segunda a domingo', () =>
  {
    const ref = new Date(2026, 8, 30) // quarta 30/09/2026
    expect(workoutWeekRange(ref)).toEqual({ from: '2026-09-28', to: '2026-10-04' })
    const all = [
      session('a', '2026-09-28T10:00:00', [
        { exerciseId: 'supino-reto-barra', group: 'peito', sets: [[50, 10], [50, 10]] },
        { exerciseId: 'puxada-frente', group: 'costas', sets: [[40, 12]] },
      ]),
      session('b', '2026-09-30T18:00:00', [{ exerciseId: 'crucifixo-halter', group: 'peito', sets: [[10, 12]] }]),
      session('old', '2026-09-20T10:00:00', [{ exerciseId: 'supino-reto-barra', sets: [[80, 5]] }]),
      session('open', '2026-09-29T10:00:00', [{ exerciseId: 'supino-reto-barra', sets: [[80, 5]] }], false),
    ]
    expect(weeklyVolumeByGroup(all, ref)).toEqual([
      { group: 'peito', label: 'Peito', sets: 3, volumeKg: 1120 },
      { group: 'costas', label: 'Costas', sets: 1, volumeKg: 480 },
    ])
    expect(workoutSessionsInRange(all, '2026-09-28', '2026-10-04').map((s) => s.id)).toEqual(['a', 'b'])
  })
})

describe('recordes', () =>
{
  it('Epley', () =>
  {
    expect(epley1RM(100, 1)).toBe(100)
    expect(epley1RM(100, 10)).toBe(133.3)
    expect(epley1RM(0, 10)).toBe(0)
  })

  it('melhor série e PR contra o histórico anterior', () =>
  {
    const h1 = session('h1', '2026-09-01T10:00:00', [{ exerciseId: 'agachamento-livre', sets: [[80, 8], [90, 3]] }])
    const now = session('now', '2026-09-08T10:00:00', [
      { exerciseId: 'agachamento-livre', sets: [[85, 8]] },
      { exerciseId: 'leg-press', sets: [[200, 10]] },
    ])
    expect(bestSetForExercise([h1], 'agachamento-livre')?.cargaKg).toBe(80)
    const prs = sessionPRs(now, [h1, now])
    expect(prs.map((p) => p.exerciseId)).toEqual(['agachamento-livre'])
    expect(prs[0].best.e1rm).toBe(107.7)
  })

  it('peso do corpo sem carga compara reps', () =>
  {
    const h1 = session('h1', '2026-09-01T10:00:00', [{ exerciseId: 'barra-fixa', sets: [[0, 6]] }])
    const now = session('now', '2026-09-08T10:00:00', [{ exerciseId: 'barra-fixa', sets: [[0, 8]] }])
    expect(sessionPRs(now, [h1])).toHaveLength(1)
  })
})

describe('última vez e montagem', () =>
{
  const h1 = session('h1', '2026-09-01T10:00:00', [{ exerciseId: 'remada-baixa', sets: [[40, 12], [45, 10]] }])
  const h2 = session('h2', '2026-09-05T10:00:00', [{ exerciseId: 'remada-baixa', sets: [[50, 10], [50, 9], [50, 8, false]] }])

  it('pega a sessão mais recente com o exercício, só séries feitas', () =>
  {
    expect(lastTimeSets([h1, h2], 'remada-baixa').map((s) => s.cargaKg)).toEqual([50, 50])
    expect(lastTimeSets([h1, h2], 'remada-baixa', 'h2').map((s) => s.cargaKg)).toEqual([40, 45])
    expect(lastTimeSets([h1], 'leg-press')).toEqual([])
  })

  it('preenche a partir da última vez e repete a última série', () =>
  {
    const e = buildSessionExercise(
      { exerciseId: 'remada-baixa', name: 'Remada', group: 'costas', sets: 3, reps: 12, cargaKg: 30, restSec: 60 },
      [h1, h2],
      id,
    )
    expect(e.sets.map((s) => [s.cargaKg, s.reps, s.done])).toEqual([[50, 10, false], [50, 9, false], [50, 9, false]])
    const fresh = buildSessionExercise({ exerciseId: 'leg-press', name: 'Leg', group: 'quadriceps', sets: 2, reps: 12, cargaKg: 100 }, [], id)
    expect(fresh.sets.map((s) => [s.cargaKg, s.reps])).toEqual([[100, 12], [100, 12]])
  })

  it('rotina vira sessão e sessão vira rotina', () =>
  {
    const r: WorkoutRoutine = {
      id: 'r1',
      name: 'Costas',
      createdAt: '',
      updatedAt: '',
      exercises: [{ exerciseId: 'remada-baixa', name: 'Remada', group: 'costas', sets: 2, reps: 10, restSec: 75 }],
    }
    const s = sessionFromRoutine(r, [h2], '2026-09-10T10:00:00', id)
    expect(s.title).toBe('Costas')
    expect(s.routineId).toBe('r1')
    expect(s.exercises[0].restSec).toBe(75)
    const back = routineFromSession(h2, 'Nova', '2026-09-10', id)
    expect(back.exercises[0]).toMatchObject({ exerciseId: 'remada-baixa', sets: 2, reps: 9, cargaKg: 50 })
  })

  it('finalizar remove séries não feitas', () =>
  {
    const done = finalizeWorkoutSession(h2, '2026-09-05T11:00:00')
    expect(done.exercises[0].sets).toHaveLength(2)
  })
})

describe('detalhe JSON', () =>
{
  it('ida e volta preserva séries e grupo', () =>
  {
    const s = finalizeWorkoutSession(
      session('x', '2026-09-05T10:00:00', [{ exerciseId: 'rosca-direta', group: 'biceps', sets: [[20, 10], [22, 8]] }]),
      '2026-09-05T10:40:00',
    )
    const det = workoutToDetalhe(s)
    expect(det.volume_kg).toBe(376)
    expect(det.exercicios[0].series[1]).toEqual({ serie: 2, peso_kg: 22, reps: 8 })
    const back = workoutFromSessaoRow({ id: 7, iniciado_em: s.startedAt, finalizado_em: s.finishedAt, tipo_treino: 'x', detalhe: det })
    expect(back?.id).toBe('x')
    expect(back?.remoteId).toBe(7)
    expect(back?.exercises[0].group).toBe('biceps')
    expect(workoutSessionVolume(back!)).toBe(376)
  })

  it('linha antiga da web sem grupo usa o catálogo ou corpo', () =>
  {
    const back = workoutFromSessaoRow({
      id: 3,
      iniciado_em: '2026-09-01T10:00:00Z',
      finalizado_em: '2026-09-01T11:00:00Z',
      tipo_treino: 'musculacao',
      detalhe: { exercicios: [{ id: 'squat', nome: 'Agachamento', series: [{ serie: 1, peso_kg: 60, reps: 10 }] }] },
    })
    expect(back?.exercises[0].group).toBe('corpo')
    expect(back?.title).toBe('musculacao')
  })
})
