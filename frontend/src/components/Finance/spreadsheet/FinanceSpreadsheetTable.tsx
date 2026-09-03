import {
  formatSpreadsheetDate,
  resolvePaymentDate,
  resolveSpreadsheetAccount,
  resolveSpreadsheetPaymentMethod,
  spreadsheetTipoLabel,
} from '../../../lib/financeSpreadsheetColumns'
import type { SpreadsheetLedgerRow } from '../../../lib/financeSpreadsheetAnalytics'
import type { VirtualCard } from '../../../store/storeTypes'
import {
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const HEAD =
  'px-2 py-2 font-mono text-[9px] uppercase tracking-wide text-white whitespace-nowrap'

interface FinanceSpreadsheetTableProps
{
  rows: SpreadsheetLedgerRow[]
  cards: VirtualCard[]
}

export function FinanceSpreadsheetTable({ rows, cards }: FinanceSpreadsheetTableProps)
{
  return (
    <div className="w-full">
      {/* Lista em coluna única - mobile */}
      <ul className="md:hidden border border-line rounded-sl divide-y divide-line w-full">
        {rows.length === 0 && (
          <li className="px-3 py-12 text-center text-ink-muted bg-card text-[12px]">
            Nenhum lançamento no período - use &quot;Novo lançamento&quot; para começar.
          </li>
        )}
        {rows.map((row) =>
        {
          const t = row.transaction
          const isRec = t.tipo === 'receita'

          return (
            <li key={t.id} className={`px-3 py-3 space-y-2 bg-card ${AXEL_ROW_HOVER}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-medium break-words ${AXEL_TEXT_PRIMARY}`}>
                    {t.descricao}
                  </p>
                  <p className={`font-mono text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                    {formatSpreadsheetDate(t.data)}
                    {' · '}
                    {row.categoriaNome}
                  </p>
                </div>
                <span className={`font-mono tabular-nums font-semibold shrink-0 text-[13px] ${
                  isRec ? 'text-concluido' : 'text-urgente'
                }`}
                >
                  {fmt(t.valor)}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-ink-muted">
                <span>{spreadsheetTipoLabel(t.tipo)}</span>
                <span>{resolveSpreadsheetAccount(t, cards)}</span>
                <span>{resolveSpreadsheetPaymentMethod(t)}</span>
                <span className={row.acumulado >= 0 ? 'text-ink' : 'text-urgente'}>
                  Acum. {fmt(row.acumulado)}
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Tabela - desktop */}
      <div className="hidden md:block border border-line rounded-sl overflow-x-auto shadow-sm w-full">
        <table className="w-full min-w-[980px] text-left border-collapse text-[11px]">
          <thead className="sticky top-0 z-10 bg-[#217346]">
            <tr>
              <th className={HEAD}>Data</th>
              <th className={HEAD}>Tipo</th>
              <th className={HEAD}>Classificação</th>
              <th className={HEAD}>Descrição</th>
              <th className={HEAD}>Conta</th>
              <th className={HEAD}>Forma de pgto</th>
              <th className={`${HEAD} text-right`}>Valor</th>
              <th className={HEAD}>Data do pgto</th>
              <th className={`${HEAD} text-right`}>Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-ink-muted bg-card">
                  Nenhum lançamento no período - use &quot;Novo lançamento&quot; para começar.
                </td>
              </tr>
            )}

            {rows.map((row, i) =>
            {
              const t = row.transaction
              const isRec = t.tipo === 'receita'
              const zebra = i % 2 === 1 ? 'bg-chrome/35' : 'bg-card'

              return (
                <tr key={t.id} className={`border-b border-line/80 ${zebra} hover:bg-accent/5`}>
                  <td className="px-2 py-1.5 font-mono text-[10px] text-ink-muted whitespace-nowrap">
                    {formatSpreadsheetDate(t.data)}
                  </td>
                  <td className={`px-2 py-1.5 font-medium ${isRec ? 'text-concluido' : 'text-urgente'}`}>
                    {spreadsheetTipoLabel(t.tipo)}
                  </td>
                  <td className="px-2 py-1.5 text-ink-muted">{row.categoriaNome}</td>
                  <td className="px-2 py-1.5 text-ink max-w-[180px] truncate">{t.descricao}</td>
                  <td className="px-2 py-1.5 text-ink-muted">{resolveSpreadsheetAccount(t, cards)}</td>
                  <td className="px-2 py-1.5 text-ink-muted">{resolveSpreadsheetPaymentMethod(t)}</td>
                  <td className={`px-2 py-1.5 text-right font-mono tabular-nums font-semibold ${
                    isRec ? 'text-concluido' : 'text-urgente'
                  }`}
                  >
                    {fmt(t.valor)}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[10px] text-ink-muted">
                    {resolvePaymentDate(t)}
                  </td>
                  <td className={`px-2 py-1.5 text-right font-mono tabular-nums font-medium ${
                    row.acumulado >= 0 ? 'text-ink' : 'text-urgente'
                  }`}
                  >
                    {fmt(row.acumulado)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
