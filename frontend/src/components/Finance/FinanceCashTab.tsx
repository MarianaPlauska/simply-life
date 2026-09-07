import { FinanceCashAccountCard } from './FinanceCashAccountCard'
import { FinanceExtrasTab } from './FinanceExtrasTab'
import { InvitePartnerPanel } from './partner/InvitePartnerPanel'

interface FinanceCashTabProps
{
  saldoDisponivel: number
  reservaRestante: number
  saldoProjetadoDisponivel: number
  saldoInicial: number
  receitasPagas: number
  despesasPagas: number
  compromissosFixas?: number
  computedDisponivel?: number
  computedReservado?: number
  computedProjetado?: number
  onNewExtraIncome?: () => void
}

export function FinanceCashTab({
  saldoDisponivel,
  reservaRestante,
  saldoProjetadoDisponivel,
  saldoInicial,
  receitasPagas,
  despesasPagas,
  compromissosFixas = 0,
  computedDisponivel,
  computedReservado,
  computedProjetado,
  onNewExtraIncome,
}: FinanceCashTabProps)
{
  return (
    <div className="space-y-4">
      <FinanceCashAccountCard
        saldoDisponivel={saldoDisponivel}
        reservaRestante={reservaRestante}
        saldoProjetadoDisponivel={saldoProjetadoDisponivel}
        saldoInicial={saldoInicial}
        receitasPagas={receitasPagas}
        despesasPagas={despesasPagas}
        compromissosFixas={compromissosFixas}
        computedDisponivel={computedDisponivel}
        computedReservado={computedReservado}
        computedProjetado={computedProjetado}
      />
      <InvitePartnerPanel />
      {onNewExtraIncome && (
        <FinanceExtrasTab onNewTransaction={onNewExtraIncome} embedded />
      )}
    </div>
  )
}
