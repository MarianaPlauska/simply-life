import { FinanceCashAccountCard } from './FinanceCashAccountCard'

interface FinanceCashTabProps
{
  saldoDisponivel: number
  saldoCorrente: number
  reservaRestante: number
  saldoProjetadoDisponivel: number
}

export function FinanceCashTab({
  saldoDisponivel,
  saldoCorrente,
  reservaRestante,
  saldoProjetadoDisponivel,
}: FinanceCashTabProps)
{
  return (
    <FinanceCashAccountCard
      saldoDisponivel={saldoDisponivel}
      saldoCorrente={saldoCorrente}
      reservaRestante={reservaRestante}
      saldoProjetadoDisponivel={saldoProjetadoDisponivel}
    />
  )
}
