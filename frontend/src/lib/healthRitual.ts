// Ritual diário de saúde · claro o que importa, sem culpa por ausência

export type RitualItemId = 'humor' | 'agua' | 'medicamentos'

/** Ritual conta engajamento · 80%+ da meta já vale como cuidado do dia */
export const AGUA_RITUAL_THRESHOLD = 0.8

export interface RitualItem
{
  id: RitualItemId
  label: string
  done: boolean
  /** Se false, não conta no total obrigatório (ex.: sem meds cadastrados) */
  applies: boolean
  detail: string
  path: string
  /** 0–1 para barra de progresso parcial */
  progress: number
}

export interface HealthRitualSnapshot
{
  items: RitualItem[]
  doneCount: number
  totalApplicable: number
  percent: number
  moodLoggedToday: boolean
  allCoreDone: boolean
}

export function isAguaRitualComplete(copos: number, meta: number): boolean
{
  if (meta <= 0) return false
  if (copos >= meta) return true
  return copos / meta >= AGUA_RITUAL_THRESHOLD
}

/** Copos mínimos para o ritual diário de hidratação (80% da meta) */
export function aguaRitualMetaCopos(meta: number): number
{
  if (meta <= 0)
  {
    return 0
  }
  return Math.ceil(meta * AGUA_RITUAL_THRESHOLD)
}

export interface AguaDisplaySnapshot
{
  copos: number
  meta: number
  ritualCopos: number
  ritualPct: number
  metaPct: number
  ritualOk: boolean
}

/** KPI unificado · dashboard e Saúde usam a mesma base (ritual 80%) */
export function aguaDisplaySnapshot(copos: number, meta: number): AguaDisplaySnapshot
{
  const ritualCopos = aguaRitualMetaCopos(meta)
  const ritualPct = ritualCopos > 0
    ? Math.min(100, Math.round((copos / ritualCopos) * 100))
    : 0
  const metaPct = meta > 0
    ? Math.min(100, Math.round((copos / meta) * 100))
    : 0
  return {
    copos,
    meta,
    ritualCopos,
    ritualPct,
    metaPct,
    ritualOk: isAguaRitualComplete(copos, meta),
  }
}

export function aguaRitualPercentLabel(): string
{
  return `${Math.round(AGUA_RITUAL_THRESHOLD * 100)}%`
}

export function buildHealthRitual(opts: {
  humorHojeCount: number
  aguaCopos: number
  aguaMeta: number
  medicamentosTotal: number
  medicamentosTomados: number
}): HealthRitualSnapshot
{
  const moodLoggedToday = opts.humorHojeCount > 0
  const aguaRatio = opts.aguaMeta > 0 ? opts.aguaCopos / opts.aguaMeta : 0
  const aguaDone = isAguaRitualComplete(opts.aguaCopos, opts.aguaMeta)
  const medsApply = opts.medicamentosTotal > 0
  const medsRatio = medsApply ? opts.medicamentosTomados / opts.medicamentosTotal : 0
  const medsDone = !medsApply || opts.medicamentosTomados >= opts.medicamentosTotal

  const items: RitualItem[] = [
    {
      id: 'humor',
      label: 'Humor',
      done: moodLoggedToday,
      applies: true,
      progress: moodLoggedToday ? 1 : 0,
      detail: moodLoggedToday
        ? `${opts.humorHojeCount} registro${opts.humorHojeCount !== 1 ? 's' : ''} hoje`
        : 'Registre como você está se sentindo',
      path: '/saude#diario',
    },
    {
      id: 'agua',
      label: 'Hidratação',
      done: aguaDone,
      applies: true,
      progress: Math.min(1, aguaRatio),
      detail: opts.aguaMeta > 0
        ? `${opts.aguaCopos}/${opts.aguaMeta} copos`
        : `${opts.aguaCopos} copos`,
      path: '/saude#hidratacao',
    },
    {
      id: 'medicamentos',
      label: 'Medicamentos',
      done: medsDone,
      applies: medsApply,
      progress: medsApply ? Math.min(1, medsRatio) : 0,
      detail: medsApply
        ? `${opts.medicamentosTomados}/${opts.medicamentosTotal} tomados`
        : 'Cadastre se usar rotina fixa',
      path: '/saude#medicamentos',
    },
  ]

  const applicable = items.filter((i) => i.applies)
  const doneCount = applicable.filter((i) => i.done).length
  const totalApplicable = applicable.length
  const percent = totalApplicable > 0
    ? Math.round(
      (applicable.reduce((s, i) => s + i.progress, 0) / totalApplicable) * 100,
    )
    : 0

  return {
    items,
    doneCount,
    totalApplicable,
    percent,
    moodLoggedToday,
    allCoreDone: doneCount === totalApplicable && totalApplicable > 0,
  }
}

export function ritualHeadline(snapshot: HealthRitualSnapshot): string
{
  if (snapshot.allCoreDone)
  {
    return 'Ritual de hoje completo · seus registros estão guardados.'
  }
  if (!snapshot.moodLoggedToday)
  {
    return 'Comece pelo humor: é o que mais ajuda o AXEL a te acolher hoje.'
  }

  const agua = snapshot.items.find((i) => i.id === 'agua')
  if (agua && !agua.done && agua.progress >= 0.5)
  {
    const restante = agua.detail.includes('/')
      ? Math.max(0, parseInt(agua.detail.split('/')[1], 10) - parseInt(agua.detail.split('/')[0], 10))
      : 0
    if (restante === 1)
    {
      return 'Quase lá · mais 1 copo e o ritual de hoje fecha.'
    }
    if (restante > 1)
    {
      return `Hidratação no ritmo (${agua.detail}) · sem pressa.`
    }
  }

  const pending = snapshot.items.filter((i) => i.applies && !i.done)
  if (pending.length === 1)
  {
    return `Falta só ${pending[0].label.toLowerCase()} para fechar o ritual de hoje.`
  }
  return `${pending.length} cuidados ainda pendentes hoje · no seu ritmo.`
}
