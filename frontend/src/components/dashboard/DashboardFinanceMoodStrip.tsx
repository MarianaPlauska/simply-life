import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { FinanceGlobalMoodBanner } from '../Finance/FinanceGlobalMoodBanner'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// Mascote financeiro no dashboard — humor do mês + atalho para Finanças

export function DashboardFinanceMoodStrip()
{
  const transactions = useTaskStore((s) => s.transactions)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const fetchTransactions = useTaskStore((s) => s.fetchTransactions)
  const fetchCashAccount = useTaskStore((s) => s.fetchCashAccount)
  const fetchReservedBills = useTaskStore((s) => s.fetchReservedBills)
  const fetchContasFixas = useTaskStore((s) => s.fetchContasFixas)

  useEffect(() =>
  {
    void fetchTransactions()
    void fetchCashAccount()
    void fetchReservedBills()
    void fetchContasFixas()
  }, [fetchTransactions, fetchCashAccount, fetchReservedBills, fetchContasFixas])

  const monthLabel = useMemo(() =>
  {
    const now = new Date()
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  }, [])

  const monthTx = useMemo(() =>
  {
    const now = new Date()
    const m = now.getMonth()
    const y = now.getFullYear()
    return transactions.filter((t) =>
    {
      const d = new Date(`${t.data}T12:00:00`)
      return d.getMonth() === m && d.getFullYear() === y
    })
  }, [transactions])

  return (
    <div className="relative group">
      <FinanceGlobalMoodBanner
        monthLabel={monthLabel}
        monthOffset={0}
        monthTransactions={monthTx}
        allTransactions={transactions}
        saldoInicial={cashAccount.saldo_inicial}
        billAlertHref="/financeiro?aba=faturas"
      />
      <Link
        to="/financeiro"
        className="absolute top-2 right-2 inline-flex items-center gap-0.5 font-mono text-[9px] uppercase text-accent hover:underline opacity-80 group-hover:opacity-100"
      >
        Finanças
        <ArrowRight size={10} />
      </Link>
    </div>
  )
}
