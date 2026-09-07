import { useMemo } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../../store/useTaskStore'
import { buildFinanceDailyBrief } from '../../../lib/financeDailyBrief'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_METRIC_HAIRLINE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'

interface FinanceDailyBriefCardProps
{
  compact?: boolean
}

// Resumo + lançamento + gasto no cartão - um único bloco no dashboard

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

  const shell = compact
    ? `${AXEL_METRIC_HAIRLINE} flex flex-col`
    : `${AXEL_BORDERLESS_PANEL} border-l-[3px] border-l-accent bg-gradient-to-br from-accent/8 to-transparent flex flex-col`

  return (
    <div id="dashboard-finance-launch" className="flex flex-col gap-2 min-w-0 scroll-mt-20">
      <section className={shell}>
        <button
          type="button"
          onClick={() => navigate('/financeiro')}
          className="w-full text-left"
        >
          <div className="flex items-start gap-3">
            {!compact && (
              <div className="shrink-0 w-8 h-8 rounded-sl border border-line bg-chrome/50 flex items-center justify-center">
                <Sparkles size={14} className="text-accent" />
              </div>
            )}
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
              {brief.hojeLines.length > 0 && (
                <div className="mt-2 rounded-sl border border-accent/30 bg-accent/8 px-2.5 py-2">
                  <p className="font-mono text-[9px] uppercase tracking-wide text-accent">
                    Alerta Hoje
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {brief.hojeLines.slice(0, 3).map((line) => (
                      <li key={line} className={`text-[11px] ${AXEL_TEXT_PRIMARY}`}>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
            onClick={() => navigate('/financeiro?aba=orcamentos')}
            className="shrink-0 min-h-[40px] px-3 rounded-sl border border-line font-mono text-[10px] uppercase text-ink-muted hover:bg-chrome"
          >
            Orçamentos
          </button>
        </div>
      </section>
    </div>
  )
}
