import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { buildCashflowProjection } from '../../lib/financeCashflowProjection'
import { computeCashPosition } from '../../lib/financeReservedBills'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_ROW_HOVER,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function CashflowForecast()
{
  const transactions = useTaskStore((s) => s.transactions)
  const recurringIncomes = useTaskStore((s) => s.recurringIncomes)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)

  const saldoAtual = useMemo(() =>
  {
    const position = computeCashPosition(
      transactions,
      cashAccount.saldo_inicial,
      reservedBills,
    )
    return position.saldoDisponivel
  }, [transactions, cashAccount.saldo_inicial, reservedBills])

  const projectionData = useMemo(
    () => buildCashflowProjection(
      transactions,
      recurringIncomes,
      contasFixas,
      saldoAtual,
    ),
    [transactions, recurringIncomes, contasFixas, saldoAtual],
  )

  const usesRecorrentes = recurringIncomes.some((r) => r.ativa)
  const usesFixas = contasFixas.some((c) => c.ativa)

  return (
    <section className={AXEL_BORDERLESS_PANEL}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between pb-4 border-b border-line">
        <div>
          <h2 className={AXEL_SECTION_TITLE}>Previsão de caixa</h2>
          <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Projeção para os próximos 6 meses
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sl border border-line bg-chrome self-start">
          <Info className={`w-3 h-3 shrink-0 ${AXEL_TEXT_SECONDARY}`} />
          <span className={`text-[9px] font-mono uppercase ${AXEL_TEXT_SECONDARY}`}>
            {usesRecorrentes || usesFixas ? 'Recorrentes + histórico' : 'Média histórica'}
          </span>
        </div>
      </div>

      {/* Cards mobile */}
      <div className="mt-3 md:hidden space-y-2">
        {projectionData.map((proj) =>
        {
          const positive = proj.saldo >= 0
          return (
            <div
              key={proj.mes}
              className={`rounded-sl border border-line p-3 ${AXEL_ROW_HOVER}`}
            >
              <p className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>{proj.mes}</p>
              <div className="grid grid-cols-1 gap-2 mt-2 text-[11px] font-mono">
                <div className="flex justify-between gap-2">
                  <span className={AXEL_TEXT_SECONDARY}>Receitas est.</span>
                  <span className="text-concluido tabular-nums shrink-0">+{fmt(proj.receita)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className={AXEL_TEXT_SECONDARY}>Despesas est.</span>
                  <span className={`tabular-nums shrink-0 ${AXEL_TEXT_SECONDARY}`}>-{fmt(proj.despesa)}</span>
                </div>
                <div className="flex justify-between gap-2 pt-1 border-t border-line">
                  <span className={AXEL_TEXT_SECONDARY}>Saldo projetado</span>
                  <span className={`font-medium tabular-nums shrink-0 ${positive ? 'text-accent' : 'text-urgente'}`}>
                    {fmt(proj.saldo)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabela desktop */}
      <div className="mt-3 hidden md:block overflow-x-auto">
        <div className="min-w-[520px]">
          <div className={`grid grid-cols-[1fr_110px_110px_120px] gap-3 py-2 border-b border-line text-[10px] font-mono uppercase ${AXEL_TEXT_SECONDARY}`}>
            <span>Período</span>
            <span className="text-right">Receitas est.</span>
            <span className="text-right">Despesas est.</span>
            <span className="text-right">Saldo projetado</span>
          </div>

          <div className="divide-y divide-line">
            {projectionData.map((proj) =>
            {
              const positive = proj.saldo >= 0
              return (
                <div
                  key={proj.mes}
                  className={`grid grid-cols-[1fr_110px_110px_120px] gap-3 items-center py-3 ${AXEL_ROW_HOVER}`}
                >
                  <span className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>{proj.mes}</span>
                  <span className="text-[12px] text-concluido font-mono text-right flex items-center justify-end gap-1">
                    <TrendingUp className="w-3 h-3 opacity-70" />
                    +{fmt(proj.receita)}
                  </span>
                  <span className={`text-[12px] font-mono text-right flex items-center justify-end gap-1 ${AXEL_TEXT_SECONDARY}`}>
                    <TrendingDown className="w-3 h-3 opacity-50" />
                    -{fmt(proj.despesa)}
                  </span>
                  <span className={`text-[12px] font-mono font-medium text-right tabular-nums ${
                    positive ? 'text-accent' : 'text-urgente'
                  }`}
                  >
                    {fmt(proj.saldo)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
