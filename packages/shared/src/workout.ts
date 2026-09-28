/**
 * Registro de treino (estilo Hevy, sem limites): catálogo, rotinas, sessões,
 * volume, recordes (1RM estimado por Epley) e "da última vez".
 * Lógica pura: sem IO, sem relógio implícito (datas entram como parâmetro).
 */

export type MuscleGroup =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'antebraco'
  | 'quadriceps'
  | 'posterior'
  | 'gluteos'
  | 'panturrilha'
  | 'abdomen'
  | 'corpo'
  | 'cardio'

export const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebraco: 'Antebraço',
  quadriceps: 'Quadríceps',
  posterior: 'Posterior de coxa',
  gluteos: 'Glúteos',
  panturrilha: 'Panturrilha',
  abdomen: 'Abdômen',
  corpo: 'Corpo todo',
  cardio: 'Cardio',
}

export const MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  'peito',
  'costas',
  'ombros',
  'biceps',
  'triceps',
  'antebraco',
  'quadriceps',
  'posterior',
  'gluteos',
  'panturrilha',
  'abdomen',
  'corpo',
  'cardio',
]

export type WorkoutCatalogExercise = {
  id: string
  name: string
  group: MuscleGroup
  /** Peso do corpo: carga é opcional (só o que for adicionado, ex.: colete). */
  bodyweight: boolean
}

const ex = (id: string, name: string, group: MuscleGroup, bodyweight = false): WorkoutCatalogExercise =>
  ({ id, name, group, bodyweight })

export const WORKOUT_CATALOG: WorkoutCatalogExercise[] = [
  // Peito
  ex('supino-reto-barra', 'Supino reto com barra', 'peito'),
  ex('supino-reto-halter', 'Supino reto com halteres', 'peito'),
  ex('supino-inclinado-barra', 'Supino inclinado com barra', 'peito'),
  ex('supino-inclinado-halter', 'Supino inclinado com halteres', 'peito'),
  ex('supino-declinado', 'Supino declinado', 'peito'),
  ex('crucifixo-halter', 'Crucifixo com halteres', 'peito'),
  ex('crossover', 'Crossover na polia', 'peito'),
  ex('peck-deck', 'Voador (peck deck)', 'peito'),
  ex('flexao', 'Flexão de braço', 'peito', true),
  ex('supino-maquina', 'Supino na máquina', 'peito'),
  // Costas
  ex('barra-fixa', 'Barra fixa', 'costas', true),
  ex('puxada-frente', 'Puxada na frente', 'costas'),
  ex('remada-curvada', 'Remada curvada com barra', 'costas'),
  ex('remada-unilateral', 'Remada unilateral com halter', 'costas'),
  ex('remada-baixa', 'Remada baixa na polia', 'costas'),
  ex('remada-maquina', 'Remada na máquina', 'costas'),
  ex('pulldown-braco-reto', 'Pulldown com braço reto', 'costas'),
  ex('levantamento-terra', 'Levantamento terra', 'costas'),
  ex('hiperextensao', 'Hiperextensão lombar', 'costas', true),
  // Ombros
  ex('desenvolvimento-barra', 'Desenvolvimento com barra', 'ombros'),
  ex('desenvolvimento-halter', 'Desenvolvimento com halteres', 'ombros'),
  ex('elevacao-lateral', 'Elevação lateral', 'ombros'),
  ex('elevacao-frontal', 'Elevação frontal', 'ombros'),
  ex('crucifixo-inverso', 'Crucifixo inverso', 'ombros'),
  ex('face-pull', 'Face pull', 'ombros'),
  ex('encolhimento', 'Encolhimento de ombros', 'ombros'),
  // Bíceps
  ex('rosca-direta', 'Rosca direta com barra', 'biceps'),
  ex('rosca-alternada', 'Rosca alternada com halteres', 'biceps'),
  ex('rosca-martelo', 'Rosca martelo', 'biceps'),
  ex('rosca-scott', 'Rosca Scott', 'biceps'),
  ex('rosca-polia', 'Rosca na polia', 'biceps'),
  // Tríceps
  ex('triceps-polia', 'Tríceps na polia', 'triceps'),
  ex('triceps-corda', 'Tríceps corda', 'triceps'),
  ex('triceps-testa', 'Tríceps testa', 'triceps'),
  ex('triceps-frances', 'Tríceps francês', 'triceps'),
  ex('mergulho', 'Mergulho nas paralelas', 'triceps', true),
  ex('supino-fechado', 'Supino fechado', 'triceps'),
  // Antebraço
  ex('rosca-punho', 'Rosca de punho', 'antebraco'),
  // Quadríceps
  ex('agachamento-livre', 'Agachamento livre', 'quadriceps'),
  ex('agachamento-goblet', 'Agachamento goblet', 'quadriceps'),
  ex('agachamento-smith', 'Agachamento no Smith', 'quadriceps'),
  ex('agachamento-hack', 'Agachamento hack', 'quadriceps'),
  ex('leg-press', 'Leg press', 'quadriceps'),
  ex('cadeira-extensora', 'Cadeira extensora', 'quadriceps'),
  ex('afundo', 'Afundo', 'quadriceps'),
  ex('bulgaro', 'Agachamento búlgaro', 'quadriceps'),
  ex('agachamento-peso-corpo', 'Agachamento com peso do corpo', 'quadriceps', true),
  // Posterior
  ex('stiff', 'Stiff', 'posterior'),
  ex('mesa-flexora', 'Mesa flexora', 'posterior'),
  ex('cadeira-flexora', 'Cadeira flexora', 'posterior'),
  ex('terra-romeno', 'Levantamento terra romeno', 'posterior'),
  // Glúteos
  ex('elevacao-pelvica', 'Elevação pélvica', 'gluteos'),
  ex('cadeira-abdutora', 'Cadeira abdutora', 'gluteos'),
  ex('gluteo-polia', 'Glúteo na polia', 'gluteos'),
  ex('ponte-gluteo', 'Ponte de glúteo', 'gluteos', true),
  // Panturrilha
  ex('panturrilha-pe', 'Panturrilha em pé', 'panturrilha'),
  ex('panturrilha-sentado', 'Panturrilha sentado', 'panturrilha'),
  // Abdômen
  ex('prancha', 'Prancha', 'abdomen', true),
  ex('abdominal-crunch', 'Abdominal crunch', 'abdomen', true),
  ex('elevacao-pernas', 'Elevação de pernas', 'abdomen', true),
  ex('abdominal-polia', 'Abdominal na polia', 'abdomen'),
  ex('russian-twist', 'Rotação russa', 'abdomen', true),
  // Corpo todo e cardio
  ex('kettlebell-swing', 'Kettlebell swing', 'corpo'),
  ex('burpee', 'Burpee', 'corpo', true),
  ex('remo-ergometro', 'Remo ergômetro', 'cardio', true),
  ex('bicicleta', 'Bicicleta ergométrica', 'cardio', true),
]

export function findCatalogExercise(id: string): WorkoutCatalogExercise | undefined
{
  return WORKOUT_CATALOG.find((e) => e.id === id)
}

function fold(s: string): string
{
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** Busca por nome ou grupo, sem acento. Vazio devolve o catálogo inteiro. */
export function searchWorkoutCatalog(
  query: string,
  catalog: WorkoutCatalogExercise[] = WORKOUT_CATALOG,
): WorkoutCatalogExercise[]
{
  const q = fold(query)
  if (!q) return catalog
  return catalog.filter((e) =>
    fold(e.name).includes(q) || fold(MUSCLE_GROUP_LABEL[e.group]).includes(q))
}

/* ------------------------------------------------------------------ */
/* Tipos de rotina e sessão                                            */
/* ------------------------------------------------------------------ */

export type WorkoutSet = {
  id: string
  cargaKg: number
  reps: number
  rpe?: number | null
  done: boolean
}

export type WorkoutSessionExercise = {
  /** Id da instância na sessão (o mesmo exercício pode aparecer duas vezes). */
  id: string
  exerciseId: string
  name: string
  group: MuscleGroup
  bodyweight?: boolean
  restSec: number
  sets: WorkoutSet[]
}

export type WorkoutSession = {
  id: string
  /** Id em sessoes_treino, quando já sincronizada. */
  remoteId?: number | null
  routineId?: string | null
  title: string
  startedAt: string
  finishedAt: string | null
  exercises: WorkoutSessionExercise[]
}

export type WorkoutRoutineExercise = {
  exerciseId: string
  name: string
  group: MuscleGroup
  bodyweight?: boolean
  sets: number
  reps: number
  cargaKg?: number
  restSec: number
}

export type WorkoutRoutine = {
  id: string
  remoteId?: string | null
  name: string
  exercises: WorkoutRoutineExercise[]
  createdAt: string
  updatedAt: string
}

export const DEFAULT_REST_SEC = 90

/* ------------------------------------------------------------------ */
/* Volume                                                              */
/* ------------------------------------------------------------------ */

function num(n: unknown): number
{
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? v : 0
}

/** Volume de uma série: carga × reps (kg). Série não feita vale 0. */
export function workoutSetVolume(set: Pick<WorkoutSet, 'cargaKg' | 'reps' | 'done'>): number
{
  if (!set.done) return 0
  return num(set.cargaKg) * num(set.reps)
}

export function workoutSessionVolume(session: Pick<WorkoutSession, 'exercises'>): number
{
  let total = 0
  for (const e of session.exercises)
  {
    for (const s of e.sets) total += workoutSetVolume(s)
  }
  return Math.round(total * 10) / 10
}

export function workoutSessionTotals(session: Pick<WorkoutSession, 'exercises'>): {
  sets: number
  reps: number
  volumeKg: number
  exercises: number
}
{
  let sets = 0
  let reps = 0
  let exercises = 0
  for (const e of session.exercises)
  {
    const done = e.sets.filter((s) => s.done)
    if (done.length) exercises += 1
    sets += done.length
    for (const s of done) reps += num(s.reps)
  }
  return { sets, reps, volumeKg: workoutSessionVolume(session), exercises }
}

/** Minutos inteiros entre início e fim (mínimo 0). */
export function workoutDurationMin(session: Pick<WorkoutSession, 'startedAt' | 'finishedAt'>, now = new Date()): number
{
  const start = Date.parse(session.startedAt)
  const end = session.finishedAt ? Date.parse(session.finishedAt) : now.getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0
  return Math.max(0, Math.round((end - start) / 60000))
}

/* ------------------------------------------------------------------ */
/* Semana                                                              */
/* ------------------------------------------------------------------ */

function localIso(d: Date): string
{
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Dia civil local (YYYY-MM-DD) de um instante ISO. */
export function workoutLocalDay(iso: string): string
{
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : localIso(d)
}

/** Segunda a domingo da semana local de ref, em YYYY-MM-DD. */
export function workoutWeekRange(ref = new Date()): { from: string; to: string }
{
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  const dow = (d.getDay() + 6) % 7
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow)
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6)
  return { from: localIso(mon), to: localIso(sun) }
}

/** Sessões finalizadas cujo dia local cai em [from, to] (inclusivo, YYYY-MM-DD). */
export function workoutSessionsInRange<T extends Pick<WorkoutSession, 'startedAt' | 'finishedAt'>>(
  sessions: T[],
  from: string,
  to: string,
): T[]
{
  return sessions.filter((s) =>
  {
    if (!s.finishedAt) return false
    const day = workoutLocalDay(s.startedAt)
    return day >= from && day <= to
  })
}

export type MuscleGroupVolume = {
  group: MuscleGroup
  label: string
  sets: number
  volumeKg: number
}

/**
 * Volume por grupo muscular na semana de ref: séries feitas e kg.
 * Só grupos com pelo menos uma série, na ordem de MUSCLE_GROUP_ORDER.
 */
export function weeklyVolumeByGroup(
  sessions: WorkoutSession[],
  ref = new Date(),
): MuscleGroupVolume[]
{
  const { from, to } = workoutWeekRange(ref)
  const acc = new Map<MuscleGroup, MuscleGroupVolume>()
  for (const s of workoutSessionsInRange(sessions, from, to))
  {
    for (const e of s.exercises)
    {
      const done = e.sets.filter((x) => x.done)
      if (!done.length) continue
      const row = acc.get(e.group) ?? { group: e.group, label: MUSCLE_GROUP_LABEL[e.group] ?? e.group, sets: 0, volumeKg: 0 }
      row.sets += done.length
      for (const x of done) row.volumeKg += workoutSetVolume(x)
      acc.set(e.group, row)
    }
  }
  return MUSCLE_GROUP_ORDER.filter((g) => acc.has(g)).map((g) =>
  {
    const r = acc.get(g)!
    return { ...r, volumeKg: Math.round(r.volumeKg * 10) / 10 }
  })
}

/* ------------------------------------------------------------------ */
/* Recordes e última vez                                               */
/* ------------------------------------------------------------------ */

/** 1RM estimado (Epley): carga × (1 + reps / 30). Uma repetição devolve a carga. */
export function epley1RM(cargaKg: number, reps: number): number
{
  const c = num(cargaKg)
  const r = num(reps)
  if (!c || !r) return 0
  if (r === 1) return c
  return Math.round(c * (1 + r / 30) * 10) / 10
}

export type WorkoutBestSet = {
  cargaKg: number
  reps: number
  /** 1RM estimado; para peso do corpo sem carga, é 0 e vale reps. */
  e1rm: number
  sessionId: string
  date: string
}

function better(a: { e1rm: number; reps: number }, b: { e1rm: number; reps: number } | null): boolean
{
  if (!b) return true
  if (a.e1rm !== b.e1rm) return a.e1rm > b.e1rm
  return a.e1rm === 0 && a.reps > b.reps
}

function bestInSession(session: WorkoutSession, exerciseId: string): WorkoutBestSet | null
{
  let best: WorkoutBestSet | null = null
  for (const e of session.exercises)
  {
    if (e.exerciseId !== exerciseId) continue
    for (const s of e.sets)
    {
      if (!s.done || num(s.reps) <= 0) continue
      const cand: WorkoutBestSet = {
        cargaKg: num(s.cargaKg),
        reps: num(s.reps),
        e1rm: epley1RM(s.cargaKg, s.reps),
        sessionId: session.id,
        date: session.startedAt,
      }
      if (better(cand, best)) best = cand
    }
  }
  return best
}

/** Melhor série de sempre do exercício (maior 1RM estimado; sem carga, mais reps). */
export function bestSetForExercise(sessions: WorkoutSession[], exerciseId: string): WorkoutBestSet | null
{
  let best: WorkoutBestSet | null = null
  for (const s of sessions)
  {
    if (!s.finishedAt) continue
    const b = bestInSession(s, exerciseId)
    if (b && better(b, best)) best = b
  }
  return best
}

export type WorkoutPR = {
  exerciseId: string
  name: string
  best: WorkoutBestSet
  previous: WorkoutBestSet
}

/**
 * Recordes desta sessão contra o histórico anterior a ela.
 * Primeira vez num exercício não conta como recorde (não há com o que comparar).
 */
export function sessionPRs(session: WorkoutSession, history: WorkoutSession[]): WorkoutPR[]
{
  const before = history.filter((h) =>
    h.id !== session.id && h.finishedAt && Date.parse(h.startedAt) < Date.parse(session.startedAt))
  const seen = new Set<string>()
  const out: WorkoutPR[] = []
  for (const e of session.exercises)
  {
    if (seen.has(e.exerciseId)) continue
    seen.add(e.exerciseId)
    const now = bestInSession(session, e.exerciseId)
    const prev = bestSetForExercise(before, e.exerciseId)
    if (now && prev && better(now, prev)) out.push({ exerciseId: e.exerciseId, name: e.name, best: now, previous: prev })
  }
  return out
}

/** Séries feitas na sessão mais recente (finalizada) que teve o exercício. */
export function lastTimeSets(
  sessions: WorkoutSession[],
  exerciseId: string,
  excludeSessionId?: string,
): WorkoutSet[]
{
  let latest: WorkoutSession | null = null
  for (const s of sessions)
  {
    if (!s.finishedAt || s.id === excludeSessionId) continue
    if (!s.exercises.some((e) => e.exerciseId === exerciseId && e.sets.some((x) => x.done))) continue
    if (!latest || Date.parse(s.startedAt) > Date.parse(latest.startedAt)) latest = s
  }
  if (!latest) return []
  const out: WorkoutSet[] = []
  for (const e of latest.exercises)
  {
    if (e.exerciseId !== exerciseId) continue
    for (const x of e.sets) if (x.done) out.push(x)
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Montagem                                                            */
/* ------------------------------------------------------------------ */

export type IdGen = () => string

let seq = 0
export const defaultWorkoutId: IdGen = () =>
  `w-${Date.now().toString(36)}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * Exercício pronto para a sessão: séries preenchidas com a última vez
 * (mesma quantidade da rotina; se faltar, repete a última série conhecida).
 */
export function buildSessionExercise(
  base: Pick<WorkoutRoutineExercise, 'exerciseId' | 'name' | 'group' | 'bodyweight'> &
    Partial<Pick<WorkoutRoutineExercise, 'sets' | 'reps' | 'cargaKg' | 'restSec'>>,
  history: WorkoutSession[],
  id: IdGen = defaultWorkoutId,
): WorkoutSessionExercise
{
  const last = lastTimeSets(history, base.exerciseId)
  const count = Math.max(1, base.sets ?? (last.length || 3))
  const sets: WorkoutSet[] = []
  for (let i = 0; i < count; i++)
  {
    const ref = last[i] ?? last[last.length - 1]
    sets.push({
      id: id(),
      cargaKg: ref ? num(ref.cargaKg) : num(base.cargaKg),
      reps: ref ? num(ref.reps) : (num(base.reps) || 10),
      rpe: null,
      done: false,
    })
  }
  return {
    id: id(),
    exerciseId: base.exerciseId,
    name: base.name,
    group: base.group,
    bodyweight: base.bodyweight,
    restSec: base.restSec ?? DEFAULT_REST_SEC,
    sets,
  }
}

export function sessionFromRoutine(
  routine: WorkoutRoutine | null,
  history: WorkoutSession[],
  startedAt: string,
  id: IdGen = defaultWorkoutId,
): WorkoutSession
{
  return {
    id: id(),
    remoteId: null,
    routineId: routine?.id ?? null,
    title: routine?.name ?? 'Treino livre',
    startedAt,
    finishedAt: null,
    exercises: (routine?.exercises ?? []).map((e) => buildSessionExercise(e, history, id)),
  }
}

/** Nova série copiando a anterior (carga e reps), ainda não feita. */
export function nextSetFrom(prev: WorkoutSet | undefined, id: IdGen = defaultWorkoutId): WorkoutSet
{
  return { id: id(), cargaKg: prev ? num(prev.cargaKg) : 0, reps: prev ? num(prev.reps) : 10, rpe: null, done: false }
}

/** Rotina a partir de uma sessão feita (salvar o treino como modelo). */
export function routineFromSession(
  session: WorkoutSession,
  name: string,
  nowIso: string,
  id: IdGen = defaultWorkoutId,
): WorkoutRoutine
{
  return {
    id: id(),
    remoteId: null,
    name: name.trim() || session.title,
    createdAt: nowIso,
    updatedAt: nowIso,
    exercises: session.exercises.map((e) =>
    {
      const done = e.sets.filter((s) => s.done)
      const ref = done[done.length - 1] ?? e.sets[e.sets.length - 1]
      return {
        exerciseId: e.exerciseId,
        name: e.name,
        group: e.group,
        bodyweight: e.bodyweight,
        sets: Math.max(1, done.length || e.sets.length),
        reps: ref ? num(ref.reps) : 10,
        cargaKg: ref ? num(ref.cargaKg) : 0,
        restSec: e.restSec,
      }
    }),
  }
}

/** Remove séries não feitas e exercícios vazios (o que vai para o histórico). */
export function finalizeWorkoutSession(session: WorkoutSession, finishedAt: string): WorkoutSession
{
  return {
    ...session,
    finishedAt,
    exercises: session.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
      .filter((e) => e.sets.length > 0),
  }
}

/* ------------------------------------------------------------------ */
/* Serialização para sessoes_treino.detalhe                            */
/* ------------------------------------------------------------------ */

export type WorkoutDetalheJson = {
  versao: 2
  fonte: 'treino'
  local_id: string
  rotina_id: string | null
  treino_codigo: string
  treino_titulo: string
  volume_kg: number
  series_totais: number
  reps_totais: number
  exercicios: {
    id: string
    catalogo_id: string
    nome: string
    grupo: MuscleGroup
    peso_corpo?: boolean
    descanso_s: number
    series: { serie: number; peso_kg: number; reps: number; rpe?: number }[]
  }[]
}

/** Detalhe compatível com o formato da web (exercicios/series/peso_kg). */
export function workoutToDetalhe(session: WorkoutSession): WorkoutDetalheJson
{
  const totals = workoutSessionTotals(session)
  return {
    versao: 2,
    fonte: 'treino',
    local_id: session.id,
    rotina_id: session.routineId ?? null,
    treino_codigo: '',
    treino_titulo: session.title,
    volume_kg: totals.volumeKg,
    series_totais: totals.sets,
    reps_totais: totals.reps,
    exercicios: session.exercises.map((e) => ({
      id: e.id,
      catalogo_id: e.exerciseId,
      nome: e.name,
      grupo: e.group,
      ...(e.bodyweight ? { peso_corpo: true } : {}),
      descanso_s: e.restSec,
      series: e.sets.filter((s) => s.done).map((s, i) => ({
        serie: i + 1,
        peso_kg: num(s.cargaKg),
        reps: num(s.reps),
        ...(s.rpe != null && Number.isFinite(s.rpe) ? { rpe: Number(s.rpe) } : {}),
      })),
    })),
  }
}

const GROUPS = new Set<string>(MUSCLE_GROUP_ORDER)

/** Lê uma linha de sessoes_treino (inclusive as da web, sem grupo) como sessão. */
export function workoutFromSessaoRow(row: Record<string, unknown>): WorkoutSession | null
{
  const started = row.iniciado_em ? String(row.iniciado_em) : row.created_at ? String(row.created_at) : ''
  if (!started) return null
  const det = (row.detalhe && typeof row.detalhe === 'object' ? row.detalhe : {}) as Record<string, unknown>
  const rawEx = Array.isArray(det.exercicios) ? (det.exercicios as Record<string, unknown>[]) : []
  const rid = row.id != null ? Number(row.id) : null
  const exercises: WorkoutSessionExercise[] = rawEx.map((e, ei) =>
  {
    const catalogId = String(e.catalogo_id ?? e.id ?? `ex-${ei}`)
    const cat = findCatalogExercise(catalogId)
    const grupo = String(e.grupo ?? cat?.group ?? 'corpo')
    const series = Array.isArray(e.series) ? (e.series as Record<string, unknown>[]) : []
    return {
      id: String(e.id ?? `ex-${ei}`),
      exerciseId: catalogId,
      name: String(e.nome ?? cat?.name ?? 'Exercício'),
      group: (GROUPS.has(grupo) ? grupo : 'corpo') as MuscleGroup,
      bodyweight: Boolean(e.peso_corpo ?? cat?.bodyweight),
      restSec: num(e.descanso_s) || DEFAULT_REST_SEC,
      sets: series.map((s, si) => ({
        id: `${rid ?? 'x'}-${ei}-${si}`,
        cargaKg: num(s.peso_kg),
        reps: num(s.reps),
        rpe: s.rpe != null ? Number(s.rpe) : null,
        done: true,
      })),
    }
  })
  return {
    id: String(det.local_id ?? `r-${rid}`),
    remoteId: rid,
    routineId: det.rotina_id ? String(det.rotina_id) : null,
    title: String(det.treino_titulo || row.tipo_treino || 'Treino'),
    startedAt: started,
    finishedAt: row.finalizado_em ? String(row.finalizado_em) : null,
    exercises,
  }
}

/** Texto curto de volume: 1.250 kg, 12,5 kg. */
export function formatWorkoutKg(kg: number): string
{
  const v = Math.round(kg * 10) / 10
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`
}
