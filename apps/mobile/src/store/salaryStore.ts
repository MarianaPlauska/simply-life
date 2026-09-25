import { create } from 'zustand'
import {
  competenciaForPayday,
  computeSalaryForecast,
  currentCompetencia,
  divisorFromWeeklyHours,
  learnDiscountRate,
  localTodayIso,
  payDate,
  payPeriod,
  weeklyHoursFromSchedule,
  type OvertimeEntry,
  type SalaryForecast,
} from '@simply-life/shared'
import { readLocalJson, writeLocalJson } from '../lib/localJsonStore'
import { supabaseConfigured } from '../lib/supabase'
import {
  deleteOvertime,
  fetchConfirmations,
  fetchOvertime,
  fetchSalary,
  insertOvertime,
  saveSalary,
  upsertConfirmation,
  type SalaryConfirmation,
  type StoredSalary,
} from '../lib/sync/salary'
import { useAuthStore } from './authStore'
import { useDataStore } from './dataStore'

const KEY = 'simply-life-salary-v1'
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

type Cache = {
  salary: StoredSalary | null
  entries: OvertimeEntry[]
  confirmations: SalaryConfirmation[]
  /** dia em que o salário foi cadastrado: não pergunta de pagamentos anteriores */
  since: string | null
  /** "ainda não caiu": não perguntar de novo neste dia */
  snoozedDay: string | null
}

type State = Cache & {
  hydrated: boolean
  saving: boolean
  error: string | null
  hydrate: () => Promise<void>
  save: (s: StoredSalary) => Promise<boolean>
  addOvertime: (e: OvertimeEntry) => Promise<boolean>
  removeOvertime: (id: string | number) => Promise<void>
  /** previsão da competência (padrão: a que está em andamento) */
  forecast: (competencia?: string) => SalaryForecast | null
  /** salário que já deveria ter caído e ainda não foi confirmado */
  pending: () => { competencia: string; forecast: SalaryForecast; previsto: number; label: string } | null
  confirm: (valorReal: number) => Promise<{ ok: boolean; error?: string }>
  snooze: () => void
}

const remote = () => supabaseConfigured && !useAuthStore.getState().isGuest

export function emptySalary(): StoredSalary
{
  return {
    id: null,
    titulo: 'Salário',
    base: 0,
    horasSemanais: 40,
    entrada: '08:00',
    saida: '17:00',
    intervaloMin: 60,
    diasSemana: 5,
    heUtilPct: 50,
    heFolgaPct: 100,
    noturnoPct: null,
    dsrSobreHe: true,
    diaFechamento: null,
    quintoDiaUtil: true,
    diaRecebimento: 5,
    taxaDesconto: null,
    feriadosLocais: [],
  }
}

export function competenciaLabel(comp: string): string
{
  const [y, m] = comp.split('-').map(Number)
  return `${MONTHS[m - 1]} de ${y}`
}

function persist(c: Cache): void
{
  void writeLocalJson(KEY, c)
}

/** Salário com hora extra: previsão, lançamento de horas e confirmação no dia do pagamento. */
export const useSalaryStore = create<State>((set, get) =>
{
  const cache = (): Cache => ({
    salary: get().salary,
    entries: get().entries,
    confirmations: get().confirmations,
    since: get().since,
    snoozedDay: get().snoozedDay,
  })
  const commit = (partial: Partial<Cache>) =>
  {
    set(partial)
    persist(cache())
  }

  return {
    salary: null,
    entries: [],
    confirmations: [],
    since: null,
    snoozedDay: null,
    hydrated: false,
    saving: false,
    error: null,

    hydrate: async () =>
    {
      if (get().hydrated) return
      const local = await readLocalJson<Cache>(KEY)
      set({ ...(local ?? {}), hydrated: true })
      if (!remote()) return
      try
      {
        const salary = await fetchSalary()
        if (!salary?.id) return
        const since = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10)
        const [entries, confirmations] = await Promise.all([
          fetchOvertime(salary.id, since),
          fetchConfirmations(salary.id),
        ])
        commit({ salary, entries, confirmations, since: get().since ?? localTodayIso() })
      }
      catch
      {
        /* migração 061 pendente ou offline: fica o que está no aparelho */
      }
    },

    save: async (s) =>
    {
      // o divisor vem do horário (8h–17h com 1h de almoço, 5 dias = 40h → divisor 200)
      const weekly = weeklyHoursFromSchedule(s)
      const next: StoredSalary = { ...s, horasSemanais: weekly ?? s.horasSemanais }
      if (!(next.base > 0)) return (set({ error: 'Informe o salário base (sem horas extras)' }), false)
      set({ saving: true, error: null })
      try
      {
        const saved = remote() ? await saveSalary(next) : next
        commit({ salary: saved, since: get().since ?? localTodayIso() })
        return true
      }
      catch (e)
      {
        set({ error: e instanceof Error ? e.message : 'Não consegui salvar' })
        return false
      }
      finally
      {
        set({ saving: false })
      }
    },

    addOvertime: async (e) =>
    {
      const salary = get().salary
      if (!salary) return false
      const temp = { ...e, id: e.id ?? `local-${Date.now()}` }
      commit({ entries: [temp, ...get().entries] })
      if (!remote() || !salary.id) return true
      try
      {
        const saved = await insertOvertime(salary.id, e)
        commit({ entries: get().entries.map((x) => (x.id === temp.id ? saved : x)) })
        return true
      }
      catch (err)
      {
        commit({ entries: get().entries.filter((x) => x.id !== temp.id) })
        set({ error: err instanceof Error ? err.message : 'Não consegui salvar as horas' })
        return false
      }
    },

    removeOvertime: async (id) =>
    {
      const before = get().entries
      commit({ entries: before.filter((x) => x.id !== id) })
      if (!remote() || String(id).startsWith('local-')) return
      try
      {
        await deleteOvertime(String(id))
      }
      catch
      {
        commit({ entries: before })
      }
    },

    forecast: (competencia) =>
    {
      const s = get().salary
      if (!s || !(s.base > 0)) return null
      const comp = competencia ?? currentCompetencia(localTodayIso(), s.diaFechamento)
      return computeSalaryForecast(s, get().entries, comp)
    },

    pending: () =>
    {
      const s = get().salary
      if (!s || !(s.base > 0)) return null
      const today = localTodayIso()
      if (get().snoozedDay === today) return null
      const comp = competenciaForPayday(today, s)
      const day = payDate(comp, s)
      if (day > today) return null
      // cadastrou depois desse pagamento: não pergunta
      if (get().since && day < get().since!) return null
      if (get().confirmations.some((c) => c.competencia === comp && c.confirmadoEm)) return null
      const forecast = computeSalaryForecast(s, get().entries, comp)
      const previsto = forecast.liquido ?? forecast.bruto
      return { competencia: comp, forecast, previsto, label: competenciaLabel(comp) }
    },

    confirm: async (valorReal) =>
    {
      const s = get().salary
      const p = get().pending()
      if (!s || !p) return { ok: false, error: 'Nada para confirmar' }
      if (!(valorReal > 0)) return { ok: false, error: 'Informe o valor que caiu' }
      const isGuest = useAuthStore.getState().isGuest
      // entra no saldo como receita, no dia do pagamento
      const titulo = `${s.titulo} de ${MONTHS[Number(p.competencia.slice(5, 7)) - 1]}`
      const res = await useDataStore.getState().addExpenseFromText(`${titulo} ${valorReal.toFixed(2)}`, isGuest, {
        tipo: 'receita',
        data: localTodayIso() < p.forecast.pagamento ? localTodayIso() : p.forecast.pagamento,
        categoria: 'outros',
        formaPagamento: 'pix',
      })
      if (!res.ok) return { ok: false, error: res.error }
      const tx = useDataStore.getState().finance[0]
      const conf: SalaryConfirmation = {
        competencia: p.competencia,
        valorPrevisto: p.previsto,
        brutoPrevisto: p.forecast.bruto,
        valorReal,
        despesaId: tx?.id ?? null,
        confirmadoEm: new Date().toISOString(),
      }
      const confirmations = [conf, ...get().confirmations.filter((c) => c.competencia !== p.competencia)]
      // aprende o desconto real (INSS/IRRF etc.) para as próximas previsões
      const taxa = learnDiscountRate(confirmations
        .filter((c) => c.brutoPrevisto && c.valorReal)
        .map((c) => ({ bruto: c.brutoPrevisto!, real: c.valorReal! })))
      const salary = taxa != null ? { ...s, taxaDesconto: taxa } : s
      commit({ confirmations, salary })
      if (remote() && s.id)
      {
        await upsertConfirmation(s.id, conf).catch(() => undefined)
        if (taxa != null) await saveSalary(salary).catch(() => undefined)
      }
      return { ok: true }
    },

    snooze: () => commit({ snoozedDay: localTodayIso() }),
  }
})

/** Próximo dia de pagamento (>= hoje) do salário cadastrado, ou null. */
export function nextSalaryPayday(s: StoredSalary | null, today = localTodayIso()): string | null
{
  if (!s || !(s.base > 0)) return null
  const cur = currentCompetencia(today, s.diaFechamento)
  const [y, m] = cur.split('-').map(Number)
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
  const a = payDate(prev, s)
  return a >= today ? a : payDate(cur, s)
}

/** Resumo do horário para a tela: "40h por semana · divisor 200 · hora de R$ 17,50". */
export function scheduleSummary(s: StoredSalary): { semanais: number | null; divisor: number | null; valorHora: number | null }
{
  const semanais = weeklyHoursFromSchedule(s)
  if (semanais == null) return { semanais: null, divisor: null, valorHora: null }
  const divisor = divisorFromWeeklyHours(semanais)
  return { semanais, divisor, valorHora: s.base > 0 ? Math.round((s.base / divisor) * 100) / 100 : null }
}

export { payPeriod }
