import { useMemo } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../../store/useTaskStore'
import { buildFinanceDailyBrief } from '../../../lib/financeDailyBrief'
import { CardQuickSpendStrip } from '../CardQuickSpendStrip'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'

interface FinanceDailyBriefCardProps
{
  compact?: boolean
}

// Resumo + lançamento + gasto no cartão — um único bloco no dashboard

export function FinanceDailyBriefCard({ compact = false }: FinanceDailyBriefCardProps)
{
  const navigate = useNavigate()
  const setNewTransactionOpen = useTaskStore((s) => s.setNewTransactionModalOpen)
  const transactions = useTaskStore((s) => s.transactions)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const cards = useTaskStore((s) => s.cards)
  const categories = useTaskStore((s) => s.categories)
  const budgetLimits = useTaskStore((s) => s.budgetLimits)

  const hasActiveCards = useMemo(
    () => cards.some((c) => c.status === 'ativo'),
    [cards],
  )

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
    <div id="dashboard-finance-launch" className="flex flex-col gap-3 min-w-0 scroll-mt-20">
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
                Axel · finanças
              </p>
              <p className={`${compact ? 'text-sm' : 'text-base'} font-medium mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
                {brief.headline}
              </p>
              <p className={`text-[11px] mt-1 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
                {brief.detail}
              </p>
            </div>
          </div>
        </button>

        <div className="flex gap-2 mt-3 pt-3 border-t border-line">
          <button
            type="button"
            onClick={() => setNewTransactionOpen(true)}
            className={`flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}
          >
            <Plus size={14} />
            Novo lançamento
          </button>
          <button
            type="button"
            onClick={() => navigate('/financeiro')}
            className="shrink-0 min-h-[40px] px-3 rounded-sl border border-line font-mono text-[10px] uppercase text-ink-muted hover:bg-chrome"
          >
            Ver tudo
          </button>
        </div>
      </section>

      {hasActiveCards && (
        <CardQuickSpendStrip variant="dashboard" prominent />
      )}
    </div>
  )
}
