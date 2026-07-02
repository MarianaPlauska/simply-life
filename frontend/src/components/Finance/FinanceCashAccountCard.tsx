import { useEffect, useRef, useState } from 'react'
import { Pencil, Wallet, Plus, Loader2, X, SlidersHorizontal } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { toast } from 'sonner'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { countLedgerDuplicates } from '../../lib/financeTransactionDedup'
import { CashBalanceEditor } from './CashBalanceEditor'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceCashAccountCardProps
{
  saldoDisponivel: number
  saldoCorrente: number
  reservaRestante: number
  saldoProjetadoDisponivel: number
  compromissosFixas?: number
  computedDisponivel?: number
  computedCorrente?: number
  computedReservado?: number
  computedProjetado?: number
}

const DUP_DISMISS_KEY = 'simply-life:finance-dup-warn-dismissed'

export function FinanceCashAccountCard({
  saldoDisponivel,
  saldoCorrente,
  reservaRestante,
  saldoProjetadoDisponivel,
  compromissosFixas = 0,
  computedDisponivel,
  computedCorrente,
  computedReservado,
  computedProjetado,
}: FinanceCashAccountCardProps)
{
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const transactions = useTaskStore((s) => s.transactions)
  const setCashInitialBalance = useTaskStore((s) => s.setCashInitialBalance)
  const setCashBalanceOverrides = useTaskStore((s) => s.setCashBalanceOverrides)
  const clearCashBalanceOverrides = useTaskStore((s) => s.clearCashBalanceOverrides)
  const setNewTransactionOpen = useTaskStore((s) => s.setNewTransactionModalOpen)
  const reconcileFinanceLedger = useTaskStore((s) => s.reconcileFinanceLedger)
  const financeReconciling = useTaskStore((s) => s.financeReconciling)

  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')
  const [balanceEditorOpen, setBalanceEditorOpen] = useState(false)
  const [dupDismissed, setDupDismissed] = useState(
    () => sessionStorage.getItem(DUP_DISMISS_KEY) === '1',
  )
  const wasReconciling = useRef(false)

  const manualActive = cashAccount.saldos_manual?.ativo === true
  const needsSetup = cashAccount.saldo_inicial <= 0 && !manualActive
  const dupCount = countLedgerDuplicates(transactions)

  const computed = {
    disponivel: computedDisponivel ?? saldoDisponivel,
    corrente: computedCorrente ?? saldoCorrente,
    reservado: computedReservado ?? reservaRestante,
    projetado: computedProjetado ?? saldoProjetadoDisponivel,
  }

  useEffect(() =>
  {
    if (dupCount === 0)
    {
      sessionStorage.removeItem(DUP_DISMISS_KEY)
      setDupDismissed(false)
    }
  }, [dupCount])

  useEffect(() =>
  {
    if (wasReconciling.current && !financeReconciling && dupCount === 0)
    {
      sessionStorage.removeItem(DUP_DISMISS_KEY)
      setDupDismissed(false)
    }
    wasReconciling.current = financeReconciling
  }, [financeReconciling, dupCount])

  const dismissDupWarning = () =>
  {
    sessionStorage.setItem(DUP_DISMISS_KEY, '1')
    setDupDismissed(true)
  }

  useEffect(() =>
  {
    if (needsSetup)
    {
      setEditing(true)
      setVal('')
    }
  }, [needsSetup])

  const startEdit = () =>
  {
    setVal(String(cashAccount.saldo_inicial || ''))
    setEditing(true)
  }

  const save = async () =>
  {
    const n = parseFloat(val.replace(/\./g, '').replace(',', '.'))
    if (Number.isNaN(n) || n < 0)
    {
      toast.error('Valor inválido')
      return
    }
    await setCashInitialBalance(n)
    setEditing(false)
    toast.success('Saldo inicial atualizado')
  }

  return (
    <section className={`${AXEL_BORDERLESS_PANEL}`}>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Wallet size={14} className="text-accent shrink-0" />
          <div className="min-w-0">
            <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
              Conta corrente
            </p>
            {manualActive && (
              <p className="font-mono text-[9px] text-accent truncate">Valores fixados manualmente</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setNewTransactionOpen(true, 'conta')}
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent hover:underline min-h-[44px] px-1"
          >
            <Plus size={10} />
            Lançamento
          </button>
          <button
            type="button"
            onClick={() => setBalanceEditorOpen(true)}
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent hover:underline min-h-[44px] px-1"
          >
            <SlidersHorizontal size={10} />
            Ajustar saldos
          </button>
          {dupCount > 0 && (
            <button
              type="button"
              onClick={() => void reconcileFinanceLedger()}
              disabled={financeReconciling}
              className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-ink-muted hover:text-urgente min-h-[44px] px-1 disabled:opacity-50 disabled:pointer-events-none"
            >
              {financeReconciling ? (
                <>
                  <Loader2 size={10} className="animate-spin" aria-hidden />
                  Recalculando…
                </>
              ) : (
                'Recalcular'
              )}
            </button>
          )}
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-ink-muted hover:underline min-h-[44px] px-1"
          >
            <Pencil size={10} />
            Saldo inicial
          </button>
        </div>
      </header>

      {needsSetup && (
        <div className="mb-3 rounded-sl border border-accent/35 bg-accent/10 px-3 py-3">
          <p className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>
            Quanto você tem na conta hoje?
          </p>
          <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Informe o saldo atual ou use <strong>Ajustar saldos</strong> para fixar Disponível, Corrente e Projetado.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setBalanceEditorOpen(true)}
          className="border border-line rounded-sl bg-chrome/40 px-3 py-2 text-left hover:border-accent/40 transition-colors min-h-[44px]"
        >
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Disponível</p>
          <p className={`text-lg font-display tabular-nums ${AXEL_TEXT_PRIMARY}`}>{fmt(saldoDisponivel)}</p>
        </button>
        <button
          type="button"
          onClick={() => setBalanceEditorOpen(true)}
          className="border border-line rounded-sl bg-chrome/40 px-3 py-2 text-left hover:border-accent/40 transition-colors min-h-[44px]"
        >
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Corrente</p>
          <p className={`text-lg font-display tabular-nums ${AXEL_TEXT_PRIMARY}`}>{fmt(saldoCorrente)}</p>
        </button>
        <button
          type="button"
          onClick={() => setBalanceEditorOpen(true)}
          className="border border-line rounded-sl bg-chrome/40 px-3 py-2 text-left hover:border-accent/40 transition-colors min-h-[44px]"
        >
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Reservado</p>
          <p className="text-lg font-display tabular-nums text-atencao">{fmt(reservaRestante)}</p>
        </button>
        <button
          type="button"
          onClick={() => setBalanceEditorOpen(true)}
          className="border border-line rounded-sl bg-chrome/40 px-3 py-2 text-left hover:border-accent/40 transition-colors min-h-[44px]"
        >
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Projetado livre</p>
          <p className={`text-lg font-display tabular-nums ${
            saldoProjetadoDisponivel < 0 ? 'text-urgente' : AXEL_TEXT_PRIMARY
          }`}>
            {fmt(saldoProjetadoDisponivel)}
          </p>
        </button>
      </div>

      <p className={`text-[10px] mt-2 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
        {manualActive ? (
          <>
            Valores fixados manualmente
            {cashAccount.saldos_manual?.atualizado_em && (
              <> em {new Date(cashAccount.saldos_manual.atualizado_em).toLocaleDateString('pt-BR')}</>
            )}
            . Use <strong>Ajustar saldos</strong> para editar ou voltar ao cálculo automático.
          </>
        ) : (
          <>
            Saldo inicial: {fmt(cashAccount.saldo_inicial)}.
            Cada receita ou gasto pago no caixa atualiza o saldo automaticamente.
            Inclui fixas do mês ({fmt(compromissosFixas)}) e agendados no projetado.
            Se não bater com o banco, use <strong>Ajustar saldos</strong>.
          </>
        )}
      </p>

      {dupCount > 0 && !dupDismissed && (
        <div className="text-[10px] mt-2 rounded-sl border border-urgente/30 bg-urgente/8 px-2.5 py-2 text-urgente leading-relaxed space-y-2 relative">
          <button
            type="button"
            onClick={dismissDupWarning}
            className="absolute top-2 right-2 p-1 rounded-sl text-urgente/70 hover:text-urgente hover:bg-urgente/10 min-w-[32px] min-h-[32px] flex items-center justify-center"
            aria-label="Fechar aviso de duplicatas"
          >
            <X size={14} />
          </button>
          <p className="pr-8">
            Detectamos {dupCount} lançamento{dupCount === 1 ? '' : 's'} duplicado{dupCount === 1 ? '' : 's'}.
            Use <strong>Recalcular</strong> para limpar — ou <strong>Ajustar saldos</strong> com seus valores reais.
          </p>
        </div>
      )}

      {(editing || needsSetup) && (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            inputMode="decimal"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Ex.: 1500,00"
            className="flex-1 border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm font-mono min-h-[44px]"
          />
          <button type="button" onClick={() => void save()} className={`px-4 py-2.5 min-h-[44px] font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}>
            Salvar saldo
          </button>
          {!needsSetup && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2.5 min-h-[44px] font-mono text-[10px] uppercase border border-line rounded-sl text-ink-muted"
            >
              Cancelar
            </button>
          )}
        </div>
      )}

      <CashBalanceEditor
        open={balanceEditorOpen}
        onClose={() => setBalanceEditorOpen(false)}
        computed={computed}
        manualActive={manualActive}
        onSaveManual={setCashBalanceOverrides}
        onClearManual={clearCashBalanceOverrides}
      />
    </section>
  )
}
