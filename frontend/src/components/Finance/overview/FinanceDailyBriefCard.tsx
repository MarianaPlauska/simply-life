import { useMemo } from 'react'
import { Sparkles, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../../store/useTaskStore'
import { buildFinanceDailyBrief } from '../../../lib/financeDailyBrief'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'

interface FinanceDailyBriefCardProps
{
  compact?: boolean
}

export function FinanceDailyBriefCard({ compact = false }: FinanceDailyBriefCardProps)
{
  const navigate = useNavigate()
  const transactions = useTaskStore((s) => s.transactions)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const cards = useTaskStore((s) => s.cards)
  const categories = useTaskStore((s) => s.categories)
  const budgetLimits = useTaskStore((s) => s.budgetLimits)

  const brief = useMemo(
    () => buildFinanceDailyBrief({
      transactions,
      saldoInicial: cashAccount.saldo_inicial,
      reservedBills,
      contasFixas,
      cards,
      categories,
      budgetLimits,
    }),
    [transactions, cashAccount.saldo_inicial, reservedBills, contasFixas, cards, categories, budgetLimits],
  )

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} border-l-[3px] border-l-accent bg-gradient-to-br from-accent/8 to-transparent`}>
      <button
        type="button"
        onClick={() => navigate('/financeiro')}
        className="w-full text-left"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 rounded-sl border border-line bg-chrome/50 flex items-center justify-center">
            <Sparkles size={14} className="text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
              Axel · resumo de hoje
            </p>
            <p className={`${compact ? 'text-sm' : 'text-base'} font-medium mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
              {brief.headline}
            </p>
            <p className={`text-[11px] mt-1 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
              {brief.detail}
            </p>
            {!compact && (
              <p className={`inline-flex items-center gap-1 font-mono text-[10px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
                <Wallet size={11} />
                Toque para abrir Finanças
              </p>
            )}
          </div>
        </div>
      </button>
    </section>
  )
}
