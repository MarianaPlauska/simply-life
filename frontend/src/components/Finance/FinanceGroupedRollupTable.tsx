import { useMemo } from 'react'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_ROW_HOVER,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { buildGrupoRollup } from '../../lib/financeGroupRollup'
import type { Category, Transaction } from '../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceGroupedRollupTableProps
{
  transactions: Transaction[]
  activeCategories: Category[]
  periodLabel: string
}

export function FinanceGroupedRollupTable({
  transactions,
  activeCategories,
  periodLabel,
}: FinanceGroupedRollupTableProps)
{
  const rows = useMemo(
    () => buildGrupoRollup(transactions, activeCategories),
    [transactions, activeCategories],
  )

  const totals = useMemo(() =>
  {
    return rows.reduce(
      (acc, r) => ({
        receita: acc.receita + r.receita,
        despesa: acc.despesa + r.despesa,
        count: acc.count + r.count,
      }),
      { receita: 0, despesa: 0, count: 0 },
    )
  }, [rows])

  return (
    <section className={AXEL_BORDERLESS_PANEL}>
      <div className="pb-3 border-b border-line mb-3">
        <h2 className={AXEL_SECTION_TITLE}>Por grupo · {periodLabel}</h2>
        <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
          Casa · Contas · Organizações futuras · Geral
        </p>
      </div>

      {rows.length === 0 ? (
        <p className={`text-[12px] py-8 text-center ${AXEL_TEXT_SECONDARY}`}>
          Nenhum lançamento no período
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.grupo} className="border border-line rounded-sl overflow-hidden">
              <div className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-chrome ${AXEL_ROW_HOVER}`}>
                <div>
                  <p className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>{row.label}</p>
                  <p className={`text-[10px] font-mono ${AXEL_TEXT_SECONDARY}`}>
                    {row.count} lançamento(s)
                  </p>
                </div>
                <div className="flex items-center gap-4 font-mono text-[11px] tabular-nums">
                  {row.receita > 0 && (
                    <span className="text-concluido">+{fmt(row.receita)}</span>
                  )}
                  {row.despesa > 0 && (
                    <span className="text-urgente">−{fmt(row.despesa)}</span>
                  )}
                  <span className={row.saldo >= 0 ? 'text-accent' : 'text-urgente'}>
                    {fmt(row.saldo)}
                  </span>
                </div>
              </div>

              {row.categorias.length > 0 && (
                <div className="divide-y divide-line px-3">
                  {row.categorias.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between py-2 text-[11px]"
                    >
                      <span className={AXEL_TEXT_SECONDARY}>{cat.nome}</span>
                      <span className={`font-mono tabular-nums ${AXEL_TEXT_PRIMARY}`}>
                        {fmt(cat.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line font-mono text-[11px]">
            <span className={AXEL_TEXT_SECONDARY}>Total do período</span>
            <div className="flex items-center gap-4 tabular-nums">
              <span className="text-concluido">+{fmt(totals.receita)}</span>
              <span className="text-urgente">−{fmt(totals.despesa)}</span>
              <span className={totals.receita - totals.despesa >= 0 ? 'text-accent' : 'text-urgente'}>
                {fmt(totals.receita - totals.despesa)}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
