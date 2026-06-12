import { DollarSign, Wallet } from 'lucide-react'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_ROW_HOVER,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'
import { FINANCE_CATEGORY_ICONS } from '../financeCategoryIcons'
import type { Category, Transaction } from '../../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function fmtDate(iso: string): string
{
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

interface FinanceRecentTransactionsProps
{
  monthTx: Transaction[]
  activeCategories: Category[]
  onViewAll: () => void
}

export function FinanceRecentTransactions({
  monthTx,
  activeCategories,
  onViewAll,
}: FinanceRecentTransactionsProps)
{
  const recent = [...monthTx]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 5)

  return (
    <section className={AXEL_BORDERLESS_PANEL}>
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <h2 className={AXEL_SECTION_TITLE}>Últimos lançamentos</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="text-[10px] font-mono uppercase text-accent hover:underline"
        >
          Ver todos
        </button>
      </div>

      <div className="divide-y divide-line mt-1">
        {recent.length === 0 && (
          <p className={`text-[12px] py-8 text-center ${AXEL_TEXT_SECONDARY}`}>
            Nenhum lançamento este mês
          </p>
        )}

        {recent.map((t) =>
        {
          const cat = activeCategories.find((c) => c.id === t.categoria_id)
          const CatIcon = cat ? (FINANCE_CATEGORY_ICONS[cat.icone] ?? Wallet) : DollarSign
          const isRec = t.tipo === 'receita'

          return (
            <div key={t.id} className={`flex items-center gap-3 py-3 ${AXEL_ROW_HOVER}`}>
              <div
                className="w-8 h-8 rounded-sl flex items-center justify-center border border-line bg-chrome shrink-0"
                style={{ color: isRec ? undefined : cat?.cor }}
              >
                <CatIcon className={`w-3.5 h-3.5 ${isRec ? 'text-concluido' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                  {t.descricao}
                </p>
                <p className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>{fmtDate(t.data)}</p>
              </div>
              <span className={`text-[12px] font-mono tabular-nums shrink-0 ${
                isRec ? 'text-concluido' : AXEL_TEXT_PRIMARY
              }`}
              >
                {isRec ? '+' : '-'}{fmt(t.valor)}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
