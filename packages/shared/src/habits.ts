/** Hábitos diários - água / proteína / treino / sono */

export type HabitoTipo = 'agua' | 'proteina' | 'treino' | 'sono' | string

export type HabitoDiario = {
  id: string
  tipo: HabitoTipo
  nome: string
  metaDiaria: number
  progressoAtual: number
  unidade: string
  /** ml por copo (água); resto dos hábitos ignora */
  mlPorCopo?: number
  config?: Record<string, unknown>
}

export const AGUA_META_COPOS = 10
export const AGUA_ML_POR_COPO = 200
export const PROTEINA_META_G = 120
export const SONO_META_H = 8
export const AGUA_ML_OPTIONS = [150, 200, 250, 300, 500] as const
export const AGUA_LITROS_OPTIONS = [1.5, 2, 2.5, 3, 4] as const

export function aguaMlPorCopo(h: HabitoDiario | undefined): number
{
  const n = h?.mlPorCopo ?? Number(h?.config?.ml_por_copo)
  return Number.isFinite(n) && n >= 50 ? Math.round(n) : AGUA_ML_POR_COPO
}

export function aguaMetaCopos(litros: number, ml: number): number
{
  const unit = ml > 0 ? ml : AGUA_ML_POR_COPO
  return Math.max(1, Math.round((litros * 1000) / unit))
}

/** Hábitos zerados para conta real — sem progresso inventado. */
export function starterHabits(): HabitoDiario[]
{
  return demoHabits().map((h) => ({ ...h, progressoAtual: 0 }))
}

export function demoHabits(): HabitoDiario[]
{
  return [
    {
      id: 'h-agua',
      tipo: 'agua',
      nome: 'Água',
      metaDiaria: AGUA_META_COPOS,
      progressoAtual: 4,
      unidade: 'copos',
    },
    {
      id: 'h-proteina',
      tipo: 'proteina',
      nome: 'Proteína',
      metaDiaria: PROTEINA_META_G,
      progressoAtual: 45,
      unidade: 'g',
    },
    {
      id: 'h-treino',
      tipo: 'treino',
      nome: 'Treino',
      metaDiaria: 1,
      progressoAtual: 0,
      unidade: 'sessão',
    },
    {
      id: 'h-sono',
      tipo: 'sono',
      nome: 'Sono',
      metaDiaria: SONO_META_H,
      progressoAtual: 7.3,
      unidade: 'h',
    },
  ]
}

/** Garante o hábito de sono mesmo em contas antigas sem a linha no banco. */
export function ensureSonoHabit(habits: HabitoDiario[]): HabitoDiario[]
{
  if (findHabit(habits, 'sono')) return habits
  return [
    ...habits,
    {
      id: 'h-sono',
      tipo: 'sono',
      nome: 'Sono',
      metaDiaria: SONO_META_H,
      progressoAtual: 0,
      unidade: 'h',
    },
  ]
}

/** 7.5 → "7h 30min" */
export function formatSleepHours(hours: number): string
{
  const h = Math.max(0, hours)
  const whole = Math.floor(h)
  const min = Math.round((h - whole) * 60)
  if (min <= 0) return `${whole}h`
  if (min >= 60) return `${whole + 1}h`
  return `${whole}h ${String(min).padStart(2, '0')}min`
}

export function findHabit(habits: HabitoDiario[], tipo: HabitoTipo): HabitoDiario | undefined
{
  return habits.find((h) => h.tipo === tipo)
}

export function habitPct(h: HabitoDiario | undefined): number
{
  if (!h || h.metaDiaria <= 0) return 0
  return Math.min(100, Math.round((h.progressoAtual / h.metaDiaria) * 100))
}
