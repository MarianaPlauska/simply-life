import { FinanceCashAccountCard } from './FinanceCashAccountCard'
import { FinanceExtrasTab } from './FinanceExtrasTab'

interface FinanceCashTabProps
{
  saldoDisponivel: number
  saldoCorrente: number
  reservaRestante: number
  saldoProjetadoDisponivel: number
  compromissosFixas?: number
  onNewExtraIncome?: () => void
}

export function FinanceCashTab({
  saldoDisponivel,
  saldoCorrente,
  reservaRestante,
  saldoProjetadoDisponivel,
  compromissosFixas = 0,
  onNewExtraIncome,
}: FinanceCashTabProps)
{
  return (
    <div className="space-y-4">
      <FinanceCashAccountCard
        saldoDisponivel={saldoDisponivel}
        saldoCorrente={saldoCorrente}
        reservaRestante={reservaRestante}
        saldoProjetadoDisponivel={saldoProjetadoDisponivel}
        compromissosFixas={compromissosFixas}
      />
      {onNewExtraIncome && (
        <FinanceExtrasTab onNewTransaction={onNewExtraIncome} embedded />
      )}
    </div>
  )
}
