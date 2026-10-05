import {
  cardFaturaAbertaDisplay,
  computeSaldoDisponivel,
  localTodayIso,
  monthEndProjection,
  type MonthProjection,
} from '@simply-life/shared'
import { useDataStore } from '../store/dataStore'
import { useDuePaidStore } from '../store/duePaidStore'
import { useSalaryStore } from '../store/salaryStore'
import { useBillAnswersStore } from '../store/billAnswersStore'

/** Competência anterior à de hoje: é ela que paga o salário deste mês. */
function prevCompetencia(ref = new Date()): string
{
  const y = ref.getMonth() === 0 ? ref.getFullYear() - 1 : ref.getFullYear()
  const m = ref.getMonth() === 0 ? 12 : ref.getMonth()
  return `${y}-${String(m).padStart(2, '0')}`
}

/** Projeção do fim do mês com o que está nos stores agora (Carteira, Coach e checagem de compra). */
export function currentMonthProjection(): MonthProjection
{
  const { finance: txs, contasFixas: fixas, financeCards: cards, cashAccount: cash } = useDataStore.getState()
  const paidKeys = useDuePaidStore.getState().keys
  const { salary, confirmations, forecast } = useSalaryStore.getState()
  const emAberto = useBillAnswersStore.getState().emAberto

  const saldo = computeSaldoDisponivel(cash, txs, fixas).disponivel
  const faturas = cards.map((c) => ({
    cardId: c.id,
    nome: c.nome,
    valor: cardFaturaAbertaDisplay(c, txs),
    diaVencimento: c.diaVencimento,
  }))
  // salário que ainda cai neste mês e não foi confirmado
  const receitas: { label: string; valor: number; data: string }[] = []
  if (salary)
  {
    const prevComp = prevCompetencia()
    const f = forecast(prevComp)
    if (f && !confirmations.some((c) => c.competencia === prevComp && c.confirmadoEm))
    {
      receitas.push({ label: `${salary.titulo} (previsto)`, valor: f.liquido ?? f.bruto, data: f.pagamento })
    }
  }
  const ym = localTodayIso().slice(0, 7)
  return monthEndProjection({ saldoDisponivel: saldo, txs, fixas, paidKeys, faturas, receitas, vencidasEmAberto: emAberto[ym] ?? [] })
}

/**
 * Quanto entra por mês, para avaliar parcelas nos meses seguintes.
 * Salário cadastrado (líquido previsto, ou bruto) ou, sem ele, a média das receitas dos últimos 3 meses.
 */
export function expectedMonthlyIncome(): number | null
{
  const { salary, forecast } = useSalaryStore.getState()
  if (salary && salary.base > 0)
  {
    const f = forecast(prevCompetencia())
    if (f) return f.liquido ?? f.bruto
  }
  const thisYm = localTodayIso().slice(0, 7)
  const byYm = new Map<string, number>()
  for (const t of useDataStore.getState().finance)
  {
    if (t.tipo !== 'receita') continue
    const ym = String(t.data).slice(0, 7)
    if (ym >= thisYm) continue
    byYm.set(ym, (byYm.get(ym) ?? 0) + t.valor)
  }
  const last = [...byYm.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 3)
  if (!last.length) return null
  return Math.round((last.reduce((a, [, v]) => a + v, 0) / last.length) * 100) / 100
}

/** Lê do aparelho o que a projeção usa (salário, contas pagas, respostas "ainda não"). */
export async function hydrateProjectionStores(): Promise<void>
{
  useDuePaidStore.getState().hydrate()
  await Promise.all([useSalaryStore.getState().hydrate(), useBillAnswersStore.getState().hydrate()])
}
