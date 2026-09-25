/**
 * Salário com hora extra (CLT) — previsão e confirmação.
 *
 * Fluxo: a pessoa cadastra o salário base (sem HE) e o horário; lança as horas extras
 * no período; o app mostra a previsão; no dia do pagamento aparece "Confirmar salário"
 * (valor editável). Só o valor confirmado entra no saldo.
 *
 * Regras usadas (CLT, art. 59, 64, 67, 73; Súmula 172 do TST):
 *  - divisor mensal = horas semanais ÷ 6 × 30   (44h → 220, 40h → 200, 36h → 180, 30h → 150)
 *  - valor da hora = salário base ÷ divisor
 *  - HE em dia útil: + adicional (mínimo 50%); domingo/feriado: normalmente 100%
 *  - adicional noturno (22h–5h): + 20% sobre a hora (só o adicional, a hora já foi paga)
 *  - DSR sobre HE = total de HE ÷ dias úteis do período × (domingos + feriados)
 *    (dias úteis = segunda a sábado não feriados, como a Justiça do Trabalho costuma contar)
 * O líquido é estimativa: taxa de desconto informada ou aprendida das confirmações.
 * Convenções coletivas podem ter percentuais diferentes — tudo é configurável.
 */
import { addDaysIso, weekdayOfIso } from './taskPrompt'
import { localTodayIso } from './dates'

export type WorkSchedule = {
  /** "08:00" */
  entrada: string
  /** "17:00" */
  saida: string
  /** intervalo (almoço) em minutos */
  intervaloMin: number
  /** dias trabalhados por semana */
  diasSemana: number
}

export type SalaryConfig = {
  titulo: string
  /** salário bruto sem horas extras */
  base: number
  /** horas semanais contratadas (ex.: 40) */
  horasSemanais: number
  /** % de adicional em dia útil (50 = 50%) */
  heUtilPct: number
  /** % de adicional em domingo/feriado */
  heFolgaPct: number
  /** % de adicional noturno (null = não usa) */
  noturnoPct: number | null
  dsrSobreHe: boolean
  /** dia do fechamento do ponto (null = mês calendário) */
  diaFechamento: number | null
  /** true = paga no 5º dia útil do mês seguinte; false = dia fixo (diaRecebimento) */
  quintoDiaUtil: boolean
  diaRecebimento: number
  /** fração de desconto (INSS/IRRF/outros) sobre o bruto; null = sem estimativa de líquido */
  taxaDesconto: number | null
  /** feriados locais extras (YYYY-MM-DD) */
  feriadosLocais?: string[]
}

export type OvertimeKind = 'util' | 'folga' | 'noturno'

export type OvertimeEntry = {
  id?: string | number
  /** dia em que a hora extra foi feita */
  data: string
  minutos: number
  tipo: OvertimeKind
  nota?: string | null
}

export type SalaryForecast = {
  competencia: string
  periodo: { inicio: string; fim: string }
  divisor: number
  valorHora: number
  horas: Record<OvertimeKind, number>
  valores: { heUtil: number; heFolga: number; noturno: number; dsr: number }
  totalHe: number
  bruto: number
  /** null quando não há taxa de desconto configurada/aprendida */
  liquido: number | null
  diasUteis: number
  descansos: number
  pagamento: string
}

const round2 = (n: number) => Math.round(n * 100) / 100

function toMin(hhmm: string): number | null
{
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!m) return null
  const h = Number(m[1])
  const mi = Number(m[2])
  return h <= 23 && mi <= 59 ? h * 60 + mi : null
}

/** 08:00–17:00 com 1h de almoço, 5 dias → 40h */
export function weeklyHoursFromSchedule(s: WorkSchedule): number | null
{
  const a = toMin(s.entrada)
  const b = toMin(s.saida)
  if (a == null || b == null || b <= a) return null
  const perDay = (b - a - Math.max(0, s.intervaloMin)) / 60
  if (perDay <= 0) return null
  return Math.round(perDay * Math.max(1, Math.min(7, s.diasSemana)) * 100) / 100
}

/** Divisor mensal da CLT: horas semanais ÷ 6 × 30 (44h → 220, 40h → 200). */
export function divisorFromWeeklyHours(h: number): number
{
  return Math.round((h / 6) * 30)
}

// ---------------------------------------------------------------------------
// Feriados nacionais (Lei 662/49, 6.802/80, 14.759/23) + Sexta-feira Santa
// ---------------------------------------------------------------------------

/** Domingo de Páscoa (algoritmo de Meeus/Butcher). */
function easter(year: number): string
{
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function nationalHolidays(year: number): string[]
{
  const fixed = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25']
  if (year >= 2024) fixed.push('11-20') // Consciência Negra (Lei 14.759/2023)
  return [...fixed.map((md) => `${year}-${md}`), addDaysIso(easter(year), -2)].sort()
}

function holidaySet(fromYear: number, toYear: number, extra: string[] = []): Set<string>
{
  const s = new Set(extra)
  for (let y = fromYear; y <= toYear; y += 1) nationalHolidays(y).forEach((d) => s.add(d))
  return s
}

// ---------------------------------------------------------------------------
// Período, pagamento, contagem de dias
// ---------------------------------------------------------------------------

/** Competência "2026-10": período de apuração das horas extras. */
export function payPeriod(competencia: string, diaFechamento: number | null): { inicio: string; fim: string }
{
  const [y, m] = competencia.split('-').map(Number)
  if (!diaFechamento)
  {
    const last = new Date(y, m, 0).getDate()
    return { inicio: `${competencia}-01`, fim: `${competencia}-${String(last).padStart(2, '0')}` }
  }
  // fechamento dia 20: de 21 do mês anterior a 20 deste
  const clamp = (yy: number, mm: number, dd: number) =>
  {
    const last = new Date(yy, mm, 0).getDate()
    const d = Math.min(dd, last)
    const date = new Date(yy, mm - 1, d, 12)
    return localTodayIso(date)
  }
  const fim = clamp(y, m, diaFechamento)
  const prevFim = clamp(m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1, diaFechamento)
  return { inicio: addDaysIso(prevFim, 1), fim }
}

export function countWorkDays(inicio: string, fim: string, extraHolidays: string[] = []): { diasUteis: number; descansos: number }
{
  const hol = holidaySet(Number(inicio.slice(0, 4)), Number(fim.slice(0, 4)), extraHolidays)
  let uteis = 0
  let descansos = 0
  for (let d = inicio; d <= fim; d = addDaysIso(d, 1))
  {
    if (weekdayOfIso(d) === 0 || hol.has(d)) descansos += 1
    else uteis += 1
  }
  return { diasUteis: uteis, descansos }
}

/** Dia do pagamento da competência (5º dia útil do mês seguinte, contando sábado; ou dia fixo). */
export function payDate(competencia: string, cfg: Pick<SalaryConfig, 'quintoDiaUtil' | 'diaRecebimento' | 'feriadosLocais'>): string
{
  const [y, m] = competencia.split('-').map(Number)
  const ny = m === 12 ? y + 1 : y
  const nm = m === 12 ? 1 : m + 1
  if (!cfg.quintoDiaUtil)
  {
    const last = new Date(ny, nm, 0).getDate()
    const d = Math.min(Math.max(1, cfg.diaRecebimento), last)
    return `${ny}-${String(nm).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  const hol = holidaySet(ny, ny, cfg.feriadosLocais)
  let d = `${ny}-${String(nm).padStart(2, '0')}-01`
  let count = 0
  for (let i = 0; i < 31; i += 1)
  {
    // CLT (art. 459): sábado conta como dia útil; domingo e feriado não
    if (weekdayOfIso(d) !== 0 && !hol.has(d))
    {
      count += 1
      if (count === 5) return d
    }
    d = addDaysIso(d, 1)
  }
  return d
}

/** Competência cujo pagamento cai hoje ou já passou mais recentemente. */
export function competenciaForPayday(today: string, cfg: Pick<SalaryConfig, 'quintoDiaUtil' | 'diaRecebimento' | 'feriadosLocais'>): string
{
  const [y, m] = today.split('-').map(Number)
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
  const prev2 = m <= 2 ? `${y - 1}-${String(m + 10).padStart(2, '0')}` : `${y}-${String(m - 2).padStart(2, '0')}`
  return payDate(prev, cfg) <= today ? prev : prev2
}

/** Competência em andamento (a que recebe as horas de hoje). */
export function currentCompetencia(today: string, diaFechamento: number | null): string
{
  const ym = today.slice(0, 7)
  if (!diaFechamento) return ym
  const day = Number(today.slice(8, 10))
  if (day <= diaFechamento) return ym
  const [y, m] = ym.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Previsão
// ---------------------------------------------------------------------------

export function computeSalaryForecast(cfg: SalaryConfig, entries: OvertimeEntry[], competencia: string): SalaryForecast
{
  const periodo = payPeriod(competencia, cfg.diaFechamento)
  const divisor = Math.max(1, divisorFromWeeklyHours(cfg.horasSemanais))
  const valorHora = cfg.base / divisor
  const inPeriod = entries.filter((e) => e.data >= periodo.inicio && e.data <= periodo.fim)
  const horas: Record<OvertimeKind, number> = { util: 0, folga: 0, noturno: 0 }
  for (const e of inPeriod) horas[e.tipo] += e.minutos / 60

  const heUtil = valorHora * (1 + cfg.heUtilPct / 100) * horas.util
  const heFolga = valorHora * (1 + cfg.heFolgaPct / 100) * horas.folga
  const noturno = cfg.noturnoPct ? valorHora * (cfg.noturnoPct / 100) * horas.noturno : 0
  const totalHe = heUtil + heFolga + noturno
  const { diasUteis, descansos } = countWorkDays(periodo.inicio, periodo.fim, cfg.feriadosLocais)
  const dsr = cfg.dsrSobreHe && diasUteis > 0 ? (totalHe / diasUteis) * descansos : 0
  const bruto = cfg.base + totalHe + dsr
  return {
    competencia,
    periodo,
    divisor,
    valorHora: round2(valorHora),
    horas: { util: round2(horas.util), folga: round2(horas.folga), noturno: round2(horas.noturno) },
    valores: { heUtil: round2(heUtil), heFolga: round2(heFolga), noturno: round2(noturno), dsr: round2(dsr) },
    totalHe: round2(totalHe + dsr),
    bruto: round2(bruto),
    liquido: cfg.taxaDesconto != null ? round2(bruto * (1 - cfg.taxaDesconto)) : null,
    diasUteis,
    descansos,
    pagamento: payDate(competencia, cfg),
  }
}

/** Taxa de desconto aprendida das confirmações (mediana de 1 − líquido/bruto). */
export function learnDiscountRate(confirmations: { bruto: number; real: number }[]): number | null
{
  const rates = confirmations
    .filter((c) => c.bruto > 0 && c.real > 0 && c.real <= c.bruto * 1.2)
    .map((c) => Math.max(0, Math.min(0.6, 1 - c.real / c.bruto)))
    .sort((a, b) => a - b)
  if (!rates.length) return null
  const mid = Math.floor(rates.length / 2)
  return Math.round((rates.length % 2 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2) * 10000) / 10000
}

// ---------------------------------------------------------------------------
// Lançar horas em texto: "fiz 2h30 extra ontem", "3h domingo", "1h noturna"
// ---------------------------------------------------------------------------

const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']

export function parseOvertimeText(text: string, ref = new Date()): OvertimeEntry | null
{
  const t = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  let minutos = 0
  let m: RegExpExecArray | null
  if ((m = /(\d+)\s*h\s*(\d{1,2})\b/.exec(t))) minutos = Number(m[1]) * 60 + Number(m[2])
  else if ((m = /(\d+)[.,](\d+)\s*h/.exec(t))) minutos = Math.round(Number(`${m[1]}.${m[2]}`) * 60)
  else if ((m = /(\d+)\s*(?:h|hora|horas)\b/.exec(t))) minutos = Number(m[1]) * 60
  else if ((m = /(\d+)\s*(?:min|minutos)\b/.exec(t))) minutos = Number(m[1])
  if (minutos <= 0 || minutos > 16 * 60) return null

  const today = localTodayIso(ref)
  let data = today
  if (/\banteontem\b/.test(t)) data = addDaysIso(today, -2)
  else if (/\bontem\b/.test(t)) data = addDaysIso(today, -1)
  else if ((m = /\b(\d{1,2})\/(\d{1,2})\b/.exec(t)))
  {
    const y = Number(today.slice(0, 4))
    const iso = `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
    data = iso > today ? `${y - 1}${iso.slice(4)}` : iso
  }
  else
  {
    const wd = WEEKDAYS.findIndex((w) => new RegExp(`\\b${w}`).test(t))
    if (wd >= 0)
    {
      // o último dia com esse nome (hoje incluso)
      let d = today
      for (let i = 0; i < 7 && weekdayOfIso(d) !== wd; i += 1) d = addDaysIso(d, -1)
      data = d
    }
  }
  const hol = new Set(nationalHolidays(Number(data.slice(0, 4))))
  let tipo: OvertimeKind = 'util'
  if (/\bnoturn|\bmadrugada|\bnoite\b/.test(t)) tipo = 'noturno'
  else if (/\bdomingo\b|\bferiado\b/.test(t) || weekdayOfIso(data) === 0 || hol.has(data)) tipo = 'folga'
  return { data, minutos, tipo }
}
