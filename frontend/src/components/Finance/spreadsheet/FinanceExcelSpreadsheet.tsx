import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { SpreadsheetLedgerRow, SpreadsheetPeriodSummary } from '../../../lib/financeSpreadsheetAnalytics'
import {
  formatSpreadsheetDate,
  resolveSpreadsheetAccount,
  spreadsheetTipoLabel,
} from '../../../lib/financeSpreadsheetColumns'
import type { VirtualCard } from '../../../store/storeTypes'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

interface FinanceExcelSpreadsheetProps
{
  periodLabel: string
  summary: SpreadsheetPeriodSummary
  rows: SpreadsheetLedgerRow[]
  cards: VirtualCard[]
}

export function FinanceExcelSpreadsheet({
  periodLabel,
  summary,
  rows,
  cards,
}: FinanceExcelSpreadsheetProps)
{
  const [selectedRow, setSelectedRow] = useState(0)

  const selected = rows[selectedRow]
  const formulaBar = useMemo(() =>
  {
    if (!selected) return ''
    const t = selected.transaction
    return `${formatSpreadsheetDate(t.data)} · ${t.descricao} · ${fmt(t.valor)}`
  }, [selected])

  const cellRef = selected ? `E${selectedRow + 2}` : 'A1'

  return (
    <div className="rounded-sl border border-[#b4b4b4] overflow-hidden bg-[#f3f3f3] shadow-sm">
      <div className="flex items-center gap-2 px-2 py-1.5 bg-[#217346] text-white border-b border-[#1a5c38]">
        <span className="font-mono text-[10px] uppercase tracking-wide opacity-90">Planilha</span>
        <span className="font-mono text-[10px] opacity-75">· {periodLabel}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#d4d4d4] border-b border-[#d4d4d4]">
        {[
          { label: 'Entradas', value: summary.receitas, tone: 'text-[#217346]' },
          { label: 'Saídas', value: summary.despesas, tone: 'text-[#c00000]' },
          { label: 'Saldo início', value: summary.saldoInicio, tone: 'text-ink' },
          { label: 'Saldo final', value: summary.saldoFinal, tone: summary.saldoFinal >= 0 ? 'text-ink' : 'text-[#c00000]' },
        ].map(({ label, value, tone }) => (
          <div key={label} className="bg-[#fff2cc] px-3 py-2 border-r border-[#e8d48a] last:border-r-0">
            <p className="font-mono text-[8px] uppercase text-[#7a6a2e]">{label}</p>
            <p className={`font-mono text-xs sm:text-sm tabular-nums font-semibold ${tone}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-stretch border-b border-[#d4d4d4] bg-white">
        <div className="shrink-0 w-12 sm:w-14 flex items-center justify-center border-r border-[#d4d4d4] bg-[#f3f3f3] font-mono text-[9px] sm:text-[10px] text-[#217346] font-semibold">
          {cellRef}
        </div>
        <div className="flex-1 flex items-center px-2 py-1.5 min-h-[32px] font-mono text-[10px] sm:text-[11px] text-ink truncate bg-white">
          {formulaBar || 'Toque numa linha'}
        </div>
      </div>

      <p className="md:hidden px-3 py-1.5 font-mono text-[9px] uppercase text-ink-muted bg-[#f3f3f3] border-b border-[#d4d4d4]">
        Lista · {rows.length} linha{rows.length !== 1 ? 's' : ''}
      </p>

      {/* Mobile — cards empilhados */}
      <ul className="md:hidden divide-y divide-[#d4d4d4] max-h-[min(55vh,480px)] overflow-y-auto bg-white">
        {rows.length === 0 && (
          <li className="px-4 py-10 text-center text-ink-muted text-[12px]">
            Planilha vazia — use Novo lançamento.
          </li>
        )}
        {rows.map((row, i) =>
        {
          const t = row.transaction
          const isRec = t.tipo === 'receita'
          const active = selectedRow === i
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelectedRow(i)}
                className={`w-full text-left px-3 py-3 flex items-center gap-2 ${
                  active ? 'bg-[#d4edda] ring-1 ring-inset ring-[#217346]/40' : 'hover:bg-[#e8f5ee]'
                }`}
              >
                <span className="shrink-0 w-6 font-mono text-[10px] text-ink-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>{t.descricao}</p>
                  <p className={`font-mono text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                    {formatSpreadsheetDate(t.data)} · {row.categoriaNome}
                  </p>
                  <p className={`font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                    Acum. {fmt(row.acumulado)}
                  </p>
                </div>
                <span className={`shrink-0 font-mono text-[12px] tabular-nums font-semibold ${
                  isRec ? 'text-[#217346]' : 'text-[#c00000]'
                }`}>
                  {isRec ? '+' : '−'}{fmt(t.valor)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              </button>
            </li>
          )
        })}
      </ul>

      {/* Desktop — grade Excel com scroll horizontal */}
      <div className="hidden md:block overflow-x-auto max-h-[min(60vh,520px)] overflow-y-auto">
        <p className="sticky left-0 px-2 py-1 font-mono text-[9px] text-ink-muted bg-[#f3f3f3] border-b border-[#d4d4d4]">
          Deslize horizontalmente para ver todas as colunas →
        </p>
        <table className="w-full min-w-[900px] border-collapse text-[11px] font-['Segoe_UI',system-ui,sans-serif]">
          <thead className="sticky top-0 z-20">
            <tr className="bg-[#f3f3f3]">
              <th className="w-10 border border-[#d4d4d4] bg-[#f3f3f3] p-0" />
              {COLS.map((col) => (
                <th
                  key={col}
                  className="border border-[#d4d4d4] bg-[#f3f3f3] px-1 py-1 font-mono text-[10px] text-ink-muted font-normal text-center min-w-[72px]"
                >
                  {col}
                </th>
              ))}
            </tr>
            <tr className="bg-[#217346] text-white">
              <th className="border border-[#1a5c38] bg-[#217346] px-1 py-1.5 font-mono text-[9px] text-center">#</th>
              <th className="border border-[#1a5c38] px-2 py-1.5 font-mono text-[9px] uppercase text-left whitespace-nowrap">Data</th>
              <th className="border border-[#1a5c38] px-2 py-1.5 font-mono text-[9px] uppercase text-left">Tipo</th>
              <th className="border border-[#1a5c38] px-2 py-1.5 font-mono text-[9px] uppercase text-left">Categoria</th>
              <th className="border border-[#1a5c38] px-2 py-1.5 font-mono text-[9px] uppercase text-left min-w-[140px]">Descrição</th>
              <th className="border border-[#1a5c38] px-2 py-1.5 font-mono text-[9px] uppercase text-left">Conta</th>
              <th className="border border-[#1a5c38] px-2 py-1.5 font-mono text-[9px] uppercase text-right">Valor</th>
              <th className="border border-[#1a5c38] px-2 py-1.5 font-mono text-[9px] uppercase text-right">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="border border-[#d4d4d4] bg-white px-4 py-10 text-center text-ink-muted text-[12px]">
                  Planilha vazia — use Novo lançamento para adicionar linhas.
                </td>
              </tr>
            )}
            {rows.map((row, i) =>
            {
              const t = row.transaction
              const isRec = t.tipo === 'receita'
              const zebra = i % 2 === 0 ? 'bg-[#e8f5ee]' : 'bg-white'
              const selectedBg = selectedRow === i ? 'ring-2 ring-inset ring-[#217346]/60' : ''

              return (
                <tr
                  key={t.id}
                  onClick={() => setSelectedRow(i)}
                  className={`cursor-pointer hover:bg-[#d4edda] ${zebra} ${selectedBg}`}
                >
                  <td className="border border-[#d4d4d4] bg-[#f3f3f3] px-1 py-1 text-center font-mono text-[10px] text-ink-muted">
                    {i + 1}
                  </td>
                  <td className="border border-[#d4d4d4] px-2 py-1 font-mono text-[10px] whitespace-nowrap">
                    {formatSpreadsheetDate(t.data)}
                  </td>
                  <td className={`border border-[#d4d4d4] px-2 py-1 font-medium ${isRec ? 'text-[#217346]' : 'text-[#c00000]'}`}>
                    {spreadsheetTipoLabel(t.tipo)}
                  </td>
                  <td className="border border-[#d4d4d4] px-2 py-1 text-ink-muted truncate max-w-[100px]">
                    {row.categoriaNome}
                  </td>
                  <td className="border border-[#d4d4d4] px-2 py-1 truncate max-w-[180px]">{t.descricao}</td>
                  <td className="border border-[#d4d4d4] px-2 py-1 text-ink-muted text-[10px]">
                    {resolveSpreadsheetAccount(t, cards)}
                  </td>
                  <td className={`border border-[#d4d4d4] px-2 py-1 text-right font-mono tabular-nums font-semibold ${isRec ? 'text-[#217346]' : 'text-[#c00000]'}`}>
                    {isRec ? '' : '−'}{fmt(t.valor)}
                  </td>
                  <td className={`border border-[#d4d4d4] px-2 py-1 text-right font-mono tabular-nums ${row.acumulado >= 0 ? 'text-ink' : 'text-[#c00000]'}`}>
                    {fmt(row.acumulado)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-0 border-t border-[#d4d4d4] bg-[#f3f3f3] overflow-x-auto scrollbar-none">
        {['DADOS', 'PAINEL', 'PLANILHA', periodLabel.slice(0, 3).toUpperCase()].map((tab, idx) => (
          <span
            key={tab}
            className={`shrink-0 px-3 py-1.5 font-mono text-[9px] uppercase border-r border-[#d4d4d4] ${
              idx === 2 ? 'bg-white text-[#217346] font-semibold border-t-2 border-t-[#217346]' : 'text-ink-muted'
            }`}
          >
            {tab}
          </span>
        ))}
      </div>
    </div>
  )
}
