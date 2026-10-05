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

/**
 * Meta do dia em ml, como a pessoa escolheu (config.meta_ml). Fica separada do copo:
 * 2 L com copo de 350 ml continua 2 L (são ~6 copos). Sem escolha salva, vem de copos × ml.
 */
export function aguaMetaMl(h: HabitoDiario | undefined): number
{
  const n = Number(h?.config?.meta_ml)
  if (Number.isFinite(n) && n >= 250) return Math.round(n)
  return (h?.metaDiaria ?? AGUA_META_COPOS) * aguaMlPorCopo(h)
}

const AGUA_FRASES: Record<'inicio' | 'ritmo' | 'meio' | 'quase' | 'feito', string[]> = {
  inicio: [
    'Comece com um copo agora. O corpo agradece.',
    'Um gole para acordar o dia.',
    'Primeiro copo do dia: o mais fácil de esquecer.',
    'Deixe a garrafa à vista. Ajuda a lembrar.',
    'Cansaço e dor de cabeça às vezes são só sede.',
  ],
  ritmo: [
    'Bom começo. Mais um copo e o ritmo pega.',
    'Um copo a cada pausa já resolve.',
    'Água antes do café conta pontos.',
    'Seu cérebro funciona melhor hidratado.',
    'Siga no ritmo. Um copo agora ajuda.',
  ],
  meio: [
    'Metade do caminho. Está indo bem.',
    'Já passou da metade. Continue assim.',
    'Meio da meta, meio do dia. Bom par.',
    'Mais uns copos e a meta chega sozinha.',
  ],
  quase: [
    'Quase lá. {n} para fechar o dia.',
    'Falta pouco: {n}.',
    'Reta final da água: {n}.',
    'Só {n} e a meta de hoje está feita.',
  ],
  feito: [
    'Meta de hoje feita. Boa!',
    'Hidratação em dia. Seu corpo agradece.',
    'Água do dia cumprida. Pode relaxar.',
    'Meta batida. Mais um copo é bônus.',
  ],
}

/** Frase curta para o card da água. Muda com o progresso e varia ao longo do dia (sem repetir toda hora). */
export function aguaCoachLine(pct: number, left: number, seed = new Date().getHours()): string
{
  const faixa = pct >= 100 ? 'feito' : pct >= 70 ? 'quase' : pct >= 45 ? 'meio' : pct >= 15 ? 'ritmo' : 'inicio'
  const lista = AGUA_FRASES[faixa]
  const n = `${left} copo${left === 1 ? '' : 's'}`
  return lista[Math.abs(seed + left) % lista.length].replace('{n}', n)
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
