import { useNavigate } from 'react-router-dom'
import { Check, AlertCircle, Clock } from 'lucide-react'
import {
  MOCK_FINANCE_ROWS,
  type MockFinanceStatus,
} from '../../data/mockDashboardData'
import {
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

import { FinanceBalanceInsight } from './FinanceBalanceInsight'
import { Budget503020Chart } from './Budget503020Chart'

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function StatusIcon({ status }: { status: MockFinanceStatus })
{
  if (status === 'ok')
  {
    return <Check className="w-3 h-3 text-concluido" aria-label="Confirmado" />
  }
  if (status === 'alert')
  {
    return <AlertCircle className="w-3 h-3 text-atencao" aria-label="Atenção" />
  }
  return <Clock className="w-3 h-3 text-ink-muted" aria-label="Pendente" />
}

interface FinancasTabelaDensaProps
{
  embedded?: boolean
}

export function FinancasTabelaDensa({ embedded = false }: FinancasTabelaDensaProps)
{
  const navigate = useNavigate()

  const content = (
    <>
      <FinanceBalanceInsight />

      <div className="overflow-x-auto mt-3">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className={`font-mono uppercase text-[9px] tracking-wider ${AXEL_TEXT_SECONDARY} border-b border-line`}>
              <th className="pb-2 pr-3 text-left font-medium w-[52px]">Data</th>
              <th className="pb-2 pr-3 text-left font-medium">Descrição</th>
              <th className="pb-2 pr-3 text-right font-medium w-[80px]">Valor</th>
              <th className="pb-2 text-center font-medium w-[28px]" aria-label="Status" />
            </tr>
          </thead>
          <tbody>
            {MOCK_FINANCE_ROWS.map((row) =>
            {
              const negativo = row.valor < 0
              return (
                <tr
                  key={row.id}
                  className={`border-b border-line last:border-0 cursor-pointer ${AXEL_ROW_HOVER}`}
                  onClick={() => navigate('/financeiro')}
                >
                  <td className={`py-2.5 pr-3 font-mono tabular-nums align-middle ${AXEL_TEXT_SECONDARY}`}>
                    {row.data}
                  </td>
                  <td className={`py-2.5 pr-3 truncate max-w-[160px] align-middle ${AXEL_TEXT_PRIMARY}`}>
                    {row.descricao}
                  </td>
                  <td className={`py-2.5 pr-3 text-right font-mono tabular-nums align-middle ${
                    negativo ? 'text-urgente' : 'text-concluido'
                  }`}>
                    {fmtBRL(row.valor)}
                  </td>
                  <td className="py-2.5 text-center align-middle">
                    <span className="inline-flex justify-center">
                      <StatusIcon status={row.status} />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-line">
        <div className="flex items-center justify-between mb-2">
          <span className={`font-mono text-[9px] uppercase tracking-wider ${AXEL_TEXT_SECONDARY}`}>
            Regra 50 · 30 · 20
          </span>
        </div>
        <Budget503020Chart />
      </div>
    </>
  )

  if (embedded)
  {
    return <div className="w-full">{content}</div>
  }

  return (
    <section aria-labelledby="financas-resumo" className="w-full">
      {content}
    </section>
  )
}
