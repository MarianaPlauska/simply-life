import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Receipt } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { getUpcomingBills } from '../../lib/financeBillOrchestrator'
import { AXEL_ROW_HOVER, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Alerta de boletos/contas a vencer no dashboard

export function FinanceBillsAlertCard()
{
  const navigate = useNavigate()
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const cards = useTaskStore((s) => s.cards)
  const transactions = useTaskStore((s) => s.transactions)

  const bills = useMemo(
    () => getUpcomingBills({ contasFixas, reservedBills, cards, transactions, windowDays: 7 }),
    [contasFixas, reservedBills, cards, transactions],
  )

  const urgent = bills.filter((b) => b.urgente)
  if (bills.length === 0) return null

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <section
      className={`rounded-sl border p-3 sm:p-4 ${
        urgent.length > 0
          ? 'border-atencao/40 bg-atencao/5'
          : 'border-line bg-card'
      } ${AXEL_ROW_HOVER}`}
      aria-label="Contas a vencer"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-sl shrink-0 ${urgent.length > 0 ? 'bg-atencao/15' : 'bg-chrome/40'}`}>
          {urgent.length > 0 ? (
            <AlertTriangle className="w-5 h-5 text-atencao" />
          ) : (
            <Receipt className="w-5 h-5 text-accent" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>
            {urgent.length > 0
              ? `${urgent.length} conta${urgent.length > 1 ? 's' : ''} urgente${urgent.length > 1 ? 's' : ''}`
              : `${bills.length} conta${bills.length > 1 ? 's' : ''} esta semana`}
          </p>
          <ul className={`mt-2 space-y-1 text-[13px] ${AXEL_TEXT_SECONDARY}`}>
            {bills.slice(0, 3).map((b) => (
              <li key={b.id} className="flex justify-between gap-2">
                <span className="truncate">{b.nome}</span>
                <span className="shrink-0 tabular-nums">
                  {fmt(b.valor)} · {b.diasRestantes === 0 ? 'hoje' : `${b.diasRestantes}d`}
                </span>
              </li>
            ))}
          </ul>
          <p className={`text-[12px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
            Tarefas de pagamento foram criadas no Kanban automaticamente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/financeiro?aba=faturas')}
          className="shrink-0 font-mono text-[10px] uppercase text-accent hover:underline"
        >
          Ver
        </button>
      </div>
    </section>
  )
}
