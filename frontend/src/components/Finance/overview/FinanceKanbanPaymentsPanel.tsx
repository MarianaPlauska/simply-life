import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useTaskStore } from '../../../store/useTaskStore'
import { settlementCanonicalKey } from '../../../lib/financeBillTaskDedup'
import { FinanceReconcileButton } from '../FinanceReconcileButton'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'
import type { FinanceBillSettlement } from '../../../store/storeTypes'

const PAGE_SIZE = 10

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtWhen = (iso: string) =>
{
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface FinanceKanbanPaymentsPanelProps
{
  compact?: boolean
  monthLabel?: string
  viewYear?: number
  viewMonth?: number
}

function monthKeyFromIso(iso: string): string
{
  return iso.slice(0, 7)
}

function dedupeSettlements(rows: FinanceBillSettlement[]): FinanceBillSettlement[]
{
  const seen = new Set<string>()
  const out: FinanceBillSettlement[] = []
  for (const row of rows)
  {
    const key = settlementCanonicalKey(row)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return out
}

/** Histórico permanente de boletos e contas marcados como pagos */
export function FinanceKanbanPaymentsPanel({
  monthLabel,
  viewYear,
  viewMonth,
}: FinanceKanbanPaymentsPanelProps)
{
  const billSettlements = useTaskStore((s) => s.billSettlements)
  const fetchBillSettlements = useTaskStore((s) => s.fetchBillSettlements)
  const [query, setQuery] = useState('')
  const [filterDay, setFilterDay] = useState('')
  const [page, setPage] = useState(0)

  const selectedMonthKey = viewYear != null && viewMonth != null
    ? `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    : null

  useEffect(() =>
  {
    void fetchBillSettlements()
  }, [fetchBillSettlements])

  const deduped = useMemo(() => dedupeSettlements(billSettlements), [billSettlements])

  const monthRows = useMemo(() =>
  {
    if (!selectedMonthKey) return deduped
    return deduped.filter((row) => monthKeyFromIso(row.pago_em) === selectedMonthKey)
  }, [deduped, selectedMonthKey])

  const filtered = useMemo(() =>
  {
    const q = query.trim().toLowerCase()
    let rows = monthRows

    if (filterDay)
    {
      rows = rows.filter((row) => row.pago_em.slice(0, 10) === filterDay)
    }

    if (!q) return rows
    return rows.filter((row) =>
      row.titulo.toLowerCase().includes(q)
      || row.origem.toLowerCase().includes(q)
      || String(row.valor).includes(q),
    )
  }, [monthRows, query, filterDay])

  const totalMes = useMemo(
    () => monthRows.reduce((sum, row) => sum + row.valor, 0),
    [monthRows],
  )

  const totalFiltrado = useMemo(
    () => filtered.reduce((sum, row) => sum + row.valor, 0),
    [filtered],
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() =>
  {
    setPage(0)
  }, [query, filterDay, selectedMonthKey])

  useEffect(() =>
  {
    if (page > pageCount - 1)
    {
      setPage(Math.max(0, pageCount - 1))
    }
  }, [page, pageCount])

  const pageRows = useMemo(() =>
  {
    const start = page * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} p-0 overflow-hidden`}>
      <header className="px-3 py-2.5 border-b border-line bg-chrome/30 space-y-2.5">
        <div className="flex items-start gap-2">
          <CheckCircle2 size={14} className="text-urgente shrink-0 mt-0.5" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
              Pagos — registro permanente
            </p>
            <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
              {monthLabel
                ? `${monthLabel} — boletos quitados no Kanban ou em Finanças`
                : 'Data, horário e valor — Kanban ou Marcar pago'}
            </p>
            <p className="font-mono text-[10px] mt-1 text-urgente tabular-nums">
              {selectedMonthKey
                ? `Total do mês: ${fmtBRL(totalMes)}`
                : `Total geral: ${fmtBRL(deduped.reduce((s, r) => s + r.valor, 0))}`}
              {filtered.length !== monthRows.length && (
                <span className="text-ink-muted ml-1">
                  · filtro: {fmtBRL(totalFiltrado)}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="font-mono text-[10px] text-ink-muted tabular-nums">
              {monthRows.length}
              {monthRows.length !== billSettlements.length
                ? ` / ${billSettlements.length}`
                : ''}
            </span>
            <FinanceReconcileButton />
          </div>
        </div>

        <label className="relative block">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, valor ou origem…"
            className="w-full pl-8 pr-3 py-1.5 rounded-sl border border-line bg-card text-[12px] text-ink placeholder:text-ink-muted"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-muted">
            <span className="uppercase tracking-wide">Dia</span>
            <input
              type="date"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="rounded-sl border border-line bg-card px-2 py-1 text-[11px] text-ink min-h-[32px]"
            />
          </label>
          {filterDay && (
            <button
              type="button"
              onClick={() => setFilterDay('')}
              className="font-mono text-[9px] uppercase text-ink-muted hover:text-urgente"
            >
              Limpar dia
            </button>
          )}
        </div>
      </header>

      {filtered.length === 0 ? (
        <p className={`px-3 py-6 text-[12px] text-center ${AXEL_TEXT_SECONDARY}`}>
          {monthRows.length === 0
            ? selectedMonthKey
              ? `Nenhum pagamento em ${monthLabel ?? 'este mês'}.`
              : 'Nenhum pagamento registrado ainda.'
            : 'Nenhum resultado para busca ou filtro.'}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-line max-h-[min(480px,55dvh)] overflow-y-auto custom-scrollbar">
            {pageRows.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-3 px-3 py-2.5 bg-card/40"
              >
                <div className="min-w-0">
                  <p className="text-[13px] text-ink truncate">{row.titulo}</p>
                  <p className={`font-mono text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                    {fmtWhen(row.pago_em)}
                    {row.origem === 'kanban' ? ' · Kanban' : row.origem === 'financeiro' ? ' · Finanças' : ''}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[12px] tabular-nums text-urgente">
                  {fmtBRL(row.valor)}
                </span>
              </li>
            ))}
          </ul>

          {filtered.length > PAGE_SIZE && (
            <footer className="flex items-center justify-between gap-2 px-3 py-2 border-t border-line bg-chrome/30">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-ink-muted hover:text-accent disabled:opacity-40 min-h-[44px] px-2"
              >
                <ChevronLeft size={14} aria-hidden />
                Anterior
              </button>
              <span className="font-mono text-[10px] text-ink-muted tabular-nums">
                {page + 1} / {pageCount}
                <span className="text-ink-muted/70 ml-1">
                  · {filtered.length} itens
                </span>
              </span>
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-ink-muted hover:text-accent disabled:opacity-40 min-h-[44px] px-2"
              >
                Próxima
                <ChevronRight size={14} aria-hidden />
              </button>
            </footer>
          )}
        </>
      )}
    </section>
  )
}
