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

const PAGE_SIZE = 5

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtWhen = (iso: string) =>
{
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', {
    weekday: 'short',
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

  const periodLabel = monthLabel
    ? `${monthLabel} — quitados no Kanban ou em Finanças`
    : 'Data, horário e valor — Kanban ou Marcar pago'

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} p-0 overflow-hidden`}>
      <header className="px-4 py-5 sm:py-6 border-b border-line bg-chrome/30 space-y-4">
        <div className="flex flex-col items-center text-center gap-2 max-w-lg mx-auto">
          <CheckCircle2 size={28} className="text-concluido shrink-0" strokeWidth={1.75} aria-hidden />
          <div>
            <p className={`font-mono text-[11px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
              Pagos
            </p>
            <p className={`text-base sm:text-lg font-medium mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
              Registro permanente
            </p>
            <p className={`text-[12px] sm:text-[13px] mt-1 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
              {periodLabel}
            </p>
          </div>
          <div className="pt-1">
            <p className="text-xl sm:text-2xl font-display tabular-nums text-ink">
              {selectedMonthKey ? fmtBRL(totalMes) : fmtBRL(deduped.reduce((s, r) => s + r.valor, 0))}
            </p>
            <p className={`font-mono text-[10px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              {selectedMonthKey ? `Total de ${monthLabel ?? 'mês'}` : 'Total geral'}
              {filtered.length !== monthRows.length && (
                <span className="text-ink-muted">
                  {' '}· filtro {fmtBRL(totalFiltrado)}
                </span>
              )}
            </p>
            <p className={`font-mono text-[10px] mt-0.5 tabular-nums ${AXEL_TEXT_SECONDARY}`}>
              {monthRows.length} pagamento{monthRows.length === 1 ? '' : 's'}
              {monthRows.length !== billSettlements.length
                ? ` de ${billSettlements.length} no histórico`
                : ''}
            </p>
          </div>
          <FinanceReconcileButton />
        </div>

        <label className="relative block max-w-md mx-auto w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, valor ou origem…"
            className="w-full pl-9 pr-3 py-2.5 rounded-sl border border-line bg-card text-[13px] text-ink placeholder:text-ink-muted min-h-[44px]"
          />
        </label>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <label className="inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-muted">
            <span className="uppercase tracking-wide">Dia</span>
            <input
              type="date"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="rounded-sl border border-line bg-card px-2.5 py-2 text-[12px] text-ink min-h-[44px]"
            />
          </label>
          {filterDay && (
            <button
              type="button"
              onClick={() => setFilterDay('')}
              className="font-mono text-[9px] uppercase text-ink-muted hover:text-urgente min-h-[44px] px-2"
            >
              Limpar dia
            </button>
          )}
        </div>
      </header>

      {filtered.length === 0 ? (
        <p className={`px-4 py-10 text-[13px] text-center ${AXEL_TEXT_SECONDARY}`}>
          {monthRows.length === 0
            ? selectedMonthKey
              ? `Nenhum pagamento em ${monthLabel ?? 'este mês'}.`
              : 'Nenhum pagamento registrado ainda.'
            : 'Nenhum resultado para busca ou filtro.'}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {pageRows.map((row) =>
            {
              const display = describeSettlement(row)
              const titulo = cleanSettlementTitle(row.titulo)

              return (
                <li
                  key={row.id}
                  className="flex items-start justify-between gap-4 px-4 py-3.5 sm:py-4 bg-card/40"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[14px] sm:text-[15px] font-medium text-ink break-words">
                      {titulo}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center rounded-sl border border-line bg-chrome/50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-accent">
                        {display.channel}
                      </span>
                      <span className={`font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                        {fmtWhen(row.pago_em)}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-snug ${AXEL_TEXT_SECONDARY}`}>
                      {display.detail}
                    </p>
                    {display.note && (
                      <p className={`text-[11px] leading-snug text-ink-muted italic`}>
                        {display.note}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-display text-base sm:text-lg tabular-nums text-urgente pt-0.5">
                    {fmtBRL(row.valor)}
                  </span>
                </li>
              )
            })}
          </ul>

          {filtered.length > PAGE_SIZE && (
            <footer className="flex items-center justify-between gap-2 px-4 py-3 border-t border-line bg-chrome/30">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-ink-muted hover:text-accent disabled:opacity-40 min-h-[44px] px-2 rounded-sl border border-line bg-card"
              >
                <ChevronLeft size={14} aria-hidden />
                Anterior
              </button>
              <span className="font-mono text-[10px] text-ink-muted tabular-nums text-center">
                Página {page + 1} de {pageCount}
                <span className="block text-ink-muted/70 mt-0.5">
                  {filtered.length} itens
                </span>
              </span>
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-ink-muted hover:text-accent disabled:opacity-40 min-h-[44px] px-2 rounded-sl border border-line bg-card"
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
