import { FinanceCashAccountCard } from './FinanceCashAccountCard'
import { FinanceExtrasTab } from './FinanceExtrasTab'

interface FinanceCashTabProps
{
  saldoDisponivel: number
  saldoCorrente: number
  reservaRestante: number
  saldoProjetadoDisponivel: number
  compromissosFixas?: number
  computedDisponivel?: number
  computedCorrente?: number
  computedReservado?: number
  computedProjetado?: number
  onNewExtraIncome?: () => void
}

export function FinanceCashTab({
  saldoDisponivel,
  saldoCorrente,
  reservaRestante,
  saldoProjetadoDisponivel,
  compromissosFixas = 0,
  computedDisponivel,
  computedCorrente,
  computedReservado,
  computedProjetado,
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
        computedDisponivel={computedDisponivel}
        computedCorrente={computedCorrente}
        computedReservado={computedReservado}
        computedProjetado={computedProjetado}
      />
      {onNewExtraIncome && (
        <FinanceExtrasTab onNewTransaction={onNewExtraIncome} embedded />
      )}
    </div>
  )
}
