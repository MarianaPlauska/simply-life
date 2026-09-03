import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { useTaskStore } from '../../../store/useTaskStore'
import { settlementCanonicalKey } from '../../../lib/financeBillTaskDedup'
import { FinanceReconcileButton } from '../FinanceReconcileButton'
import { AxelListRow } from '../../ui/AxelListRow'
import { AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'
import type { FinanceBillSettlement } from '../../../store/storeTypes'

const PAGE_SIZE = 5

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtWhen = (iso: string) =>
{
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
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

interface SettlementDisplay
{
  channel: string
  detail: string
  note?: string
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

function cleanSettlementTitle(titulo: string): string
{
  return titulo.replace(/\s*\[fixa:\d+\]/gi, '').trim()
}

function describeSettlement(row: FinanceBillSettlement): SettlementDisplay
{
  const titulo = cleanSettlementTitle(row.titulo)
  const notas = row.notas?.trim()
  const origem = row.origem.toLowerCase()
  const lower = titulo.toLowerCase()
  const isFixa = /\[fixa:\d+\]/i.test(row.titulo)
  const isBoleto = lower.includes('boleto')
  const isFatura = lower.includes('fatura')

  if (origem === 'kanban')
  {
    if (isBoleto)
    {
      return {
        channel: 'Boleto',
        detail: row.tarefa_id ? 'Quitado ao concluir tarefa no Kanban' : 'Quitado no Kanban',
        note: notas,
      }
    }
    if (isFixa)
    {
      return {
        channel: 'Conta fixa',
        detail: 'Pagamento via tarefa no Kanban',
        note: notas,
      }
    }
    return {
      channel: 'Kanban',
      detail: row.tarefa_id ? `Tarefa #${row.tarefa_id} concluída` : 'Tarefa concluída no quadro',
      note: notas,
    }
  }

  if (origem === 'financeiro')
  {
    if (isFixa)
    {
      return {
        channel: 'Conta fixa',
        detail: 'Marcado como pago em Finanças',
        note: notas,
      }
    }
    if (isFatura)
    {
      return {
        channel: 'Fatura',
        detail: 'Pagamento registrado em Finanças',
        note: notas,
      }
    }
    if (isBoleto)
    {
      return {
        channel: 'Boleto',
        detail: 'Marcado como pago em Finanças',
        note: notas,
      }
    }
    return {
      channel: 'Caixa / PIX',
      detail: 'Lançamento marcado como pago',
      note: notas,
    }
  }

  return {
    channel: row.origem,
    detail: 'Pagamento registrado',
    note: notas,
  }
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
  const [showFilter, setShowFilter] = useState(false)

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
    {
      const display = describeSettlement(row)
      return row.titulo.toLowerCase().includes(q)
        || row.origem.toLowerCase().includes(q)
        || display.channel.toLowerCase().includes(q)
        || display.detail.toLowerCase().includes(q)
        || (row.notas?.toLowerCase().includes(q) ?? false)
        || String(row.valor).includes(q)
    })
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

  const totalShown = selectedMonthKey
    ? totalMes
    : deduped.reduce((s, r) => s + r.valor, 0)
  const countShown = monthRows.length
  const summaryLine = `${fmtBRL(filtered.length !== monthRows.length ? totalFiltrado : totalShown)} · ${
    (filtered.length !== monthRows.length ? filtered.length : countShown)
  } pagamento${(filtered.length !== monthRows.length ? filtered.length : countShown) === 1 ? '' : 's'}`

  return (
    <section>
      <header className="flex items-center justify-between gap-2 min-h-[44px] py-1">
        <p className="text-[13px] tabular-nums text-ink truncate">
          {summaryLine}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <FinanceReconcileButton />
          <button
            type="button"
            onClick={() => setShowFilter((v) => !v)}
            className="inline-flex items-center gap-1 min-h-[44px] px-2 rounded-sl text-[12px] text-ink-muted hover:text-ink hover:bg-chrome"
            aria-expanded={showFilter}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
            Filtrar
          </button>
        </div>
      </header>

      {showFilter && (
        <div className="space-y-2 pb-2">
          <label className="relative block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, valor ou origem…"
              className="w-full pl-9 pr-3 py-2.5 rounded-sl border border-line bg-card text-[13px] text-ink placeholder:text-ink-muted min-h-[44px]"
            />
          </label>
          <label className="inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-muted">
            <span className="uppercase tracking-wide">Dia</span>
            <input
              type="date"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="rounded-sl border border-line bg-card px-2.5 py-2 text-[12px] text-ink min-h-[44px]"
            />
          </label>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className={`py-6 text-[13px] text-center ${AXEL_TEXT_SECONDARY}`}>
          {monthRows.length === 0
            ? selectedMonthKey
              ? `Nenhum pagamento em ${monthLabel ?? 'este mês'}.`
              : 'Nenhum pagamento registrado ainda.'
            : 'Nenhum resultado para busca ou filtro.'}
        </p>
      ) : (
        <>
          <ul>
            {pageRows.map((row) =>
            {
              const display = describeSettlement(row)
              const bits = [display.channel, fmtWhen(row.pago_em)]
              if (display.note) bits.push(display.note)
              return (
                <AxelListRow
                  key={row.id}
                  icon={CheckCircle2}
                  title={cleanSettlementTitle(row.titulo)}
                  subtitle={bits.join(' · ')}
                  trailing={fmtBRL(row.valor)}
                />
              )
            })}
          </ul>

          {filtered.length > PAGE_SIZE && (
            <footer className="flex items-center justify-between gap-2 py-2">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-ink-muted disabled:opacity-40 min-h-[44px] px-2"
              >
                <ChevronLeft size={14} aria-hidden />
                Anterior
              </button>
              <span className={`font-mono text-[10px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
                {page + 1}/{pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-ink-muted disabled:opacity-40 min-h-[44px] px-2"
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
