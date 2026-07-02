import { useMemo } from 'react'
import { CalendarClock, Plus } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { transactionDayKey } from '../../lib/financeLedger'
import { transactionBusinessKey } from '../../lib/financeTransactionDedup'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtBr = (iso: string) =>
{
  const key = transactionDayKey(iso)
  return key.split('-').reverse().join('/')
}

interface FinanceExtrasTabProps
{
  onNewTransaction: () => void
  embedded?: boolean
}

/** Gastos avulsos e futuros — fora da fatura do cartão */
export function FinanceExtrasTab({ onNewTransaction, embedded = false }: FinanceExtrasTabProps)
{
  const transactions = useTaskStore((s) => s.transactions)
  const markTransactionPaid = useTaskStore((s) => s.markTransactionPaid)

  const extras = useMemo(() =>
  {
    const raw = transactions
      .filter((t) =>
      {
        if (t.tipo !== 'despesa') return false
        const status = t.status_pagamento ?? 'pendente'
        if (status !== 'agendado' && status !== 'pendente') return false
        if (t.fatura_reserva_id != null) return false
        return true
      })

    const byKey = new Map<string, typeof raw[number]>()
    for (const t of raw)
    {
      const key = transactionBusinessKey(t)
      const prev = byKey.get(key)
      if (!prev || t.id < prev.id)
      {
        byKey.set(key, t)
      }
    }

    return [...byKey.values()]
      .sort((a, b) => transactionDayKey(a.data).localeCompare(transactionDayKey(b.data)))
  }, [transactions])

  const total = useMemo(
    () => extras.reduce((s, t) => s + t.valor, 0),
    [extras],
  )

  return (
    <div className={embedded ? 'pt-5 mt-5 border-t border-line space-y-3' : 'space-y-4'}>
      <header className={embedded ? 'mb-2' : 'mb-3'}>
        <div>
          <h2 className={embedded ? 'font-sans text-sm font-semibold tracking-tight text-ink' : 'font-mono text-[10px] uppercase tracking-wide text-accent'}>
            Extras
          </h2>
          <p className={`text-[11px] sm:text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
            Contas futuras e avulsos fora da fatura do cartão.
          </p>
        </div>
      </header>

      <div className={`${AXEL_BORDERLESS_PANEL} flex items-center justify-between gap-3 p-2.5 sm:p-3`}>
        <div>
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Total previsto</p>
          <p className={`text-lg font-display tabular-nums ${AXEL_TEXT_PRIMARY}`}>{fmt(total)}</p>
        </div>
        <p className={`text-[10px] sm:text-[11px] text-right max-w-[11rem] ${AXEL_TEXT_SECONDARY}`}>
          {extras.length} lançamento{extras.length !== 1 ? 's' : ''} pendente{extras.length !== 1 ? 's' : ''} ou agendado{extras.length !== 1 ? 's' : ''}
        </p>
      </div>

      {extras.length === 0 ? (
        <div className="rounded-sl border border-dashed border-line py-8 text-center px-4">
          <CalendarClock className="w-6 h-6 text-ink-muted mx-auto mb-2" aria-hidden />
          <p className={`text-[12px] ${AXEL_TEXT_PRIMARY}`}>Nenhum gasto extra</p>
          <p className={`text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
            Use <strong className="text-ink">Novo</strong> no canto para registrar receita ou conta futura.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {extras.map((t) =>
          {
            const status = t.status_pagamento ?? 'pendente'
            return (
              <li
                key={t.id}
                className="flex items-center gap-2.5 py-2 px-2.5 rounded-sl border border-line bg-chrome/30"
              >
                <div className="w-8 h-8 rounded-sl bg-card border border-line flex items-center justify-center shrink-0">
                  <CalendarClock className="w-3.5 h-3.5 text-accent" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[12px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                    {t.descricao}
                  </p>
                  <p className={`text-[10px] font-mono ${AXEL_TEXT_SECONDARY}`}>
                    {fmtBr(t.data)}
                    {' · '}
                    {status === 'agendado' ? 'Agendado' : 'Pendente'}
                    {t.card_id ? ' · Cartão' : ' · Conta corrente'}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="font-mono text-[12px] tabular-nums text-urgente">
                    −{fmt(t.valor)}
                  </p>
                  {status !== 'pago' && (
                    <button
                      type="button"
                      onClick={() => void markTransactionPaid(t.id)}
                      className="font-mono text-[9px] uppercase text-accent hover:underline"
                    >
                      Marcar pago
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {!embedded && (
        <button
          type="button"
          onClick={onNewTransaction}
          className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-3 z-40 inline-flex items-center justify-center gap-1 min-h-[40px] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wide shadow-md ${AXEL_BTN_PRIMARY}`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Nova entrada</span>
          <span className="sm:hidden">Novo</span>
        </button>
      )}
    </div>
  )
}
