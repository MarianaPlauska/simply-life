import { useEffect, useRef, useState } from 'react'
import { Wallet, Plus, Loader2, X, SlidersHorizontal } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { toast } from 'sonner'
import {
  AXEL_BTN_PRIMARY_COMPACT,
  AXEL_METRIC_HAIRLINE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { countLedgerDuplicates } from '../../lib/financeTransactionDedup'
import { resolveCashTone } from '../../lib/financeBalanceTone'
import { CashBalanceEditor } from './CashBalanceEditor'
import { FinanceStabilityMeter } from './FinanceStabilityMeter'
import { MoneyInput } from '../ui/MoneyInput'
import { parseMoneyInputToNumber } from '../../lib/currencyInput'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceCashAccountCardProps
{
  saldoDisponivel: number
  reservaRestante: number
  saldoProjetadoDisponivel: number
  saldoInicial: number
  receitasPagas: number
  despesasPagas: number
  compromissosFixas?: number
  computedDisponivel?: number
  computedReservado?: number
  computedProjetado?: number
}

const DUP_DISMISS_KEY = 'simply-life:finance-dup-warn-dismissed'

const ACTION_BTN =
  'inline-flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase text-ink-muted border border-line rounded-sl bg-card hover:border-accent/40 hover:text-ink min-h-[44px] px-3'

export function FinanceCashAccountCard({
  saldoDisponivel,
  reservaRestante,
  saldoProjetadoDisponivel,
  saldoInicial,
  receitasPagas,
  despesasPagas,
  compromissosFixas = 0,
  computedDisponivel,
  computedReservado,
  computedProjetado,
}: FinanceCashAccountCardProps)
{
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const transactions = useTaskStore((s) => s.transactions)
  const setCashInitialBalance = useTaskStore((s) => s.setCashInitialBalance)
  const alignCashToDisponivel = useTaskStore((s) => s.alignCashToDisponivel)
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
    reservado: computedReservado ?? reservaRestante,
    projetado: computedProjetado ?? saldoProjetadoDisponivel,
  }
  const cashTone = resolveCashTone(saldoDisponivel, saldoProjetadoDisponivel)

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

  const save = async () =>
  {
    const n = parseMoneyInputToNumber(val)
    if (Number.isNaN(n) || n < 0)
    {
      toast.error('Valor inválido')
      return
    }

    if (needsSetup)
    {
      await alignCashToDisponivel(n)
      setEditing(false)
      return
    }

    await setCashInitialBalance(n)
    setEditing(false)
    toast.success('Saldo inicial atualizado')
  }

  return (
    <section>
      <header className="mb-3 space-y-3">
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

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setBalanceEditorOpen(true)}
            className={ACTION_BTN}
          >
            <SlidersHorizontal size={12} />
            Ajustar saldo
          </button>
          <button
            type="button"
            onClick={() => setNewTransactionOpen(true, 'conta')}
            className={ACTION_BTN}
          >
            <Plus size={12} />
            Lançamento
          </button>
        </div>

        {dupCount > 0 && (
          <button
            type="button"
            onClick={() => void reconcileFinanceLedger()}
            disabled={financeReconciling}
            className="w-full inline-flex items-center justify-center gap-1 font-mono text-[9px] uppercase text-ink-muted border border-line rounded-sl hover:text-urgente hover:border-urgente/40 min-h-[44px] px-3 disabled:opacity-50 disabled:pointer-events-none"
          >
            {financeReconciling ? (
              <>
                <Loader2 size={10} className="animate-spin" aria-hidden />
                Recalculando…
              </>
            ) : (
              'Recalcular duplicatas'
            )}
          </button>
        )}
      </header>

      {needsSetup && (
        <div className={`${AXEL_METRIC_HAIRLINE} mb-3`}>
          <p className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>
            Quanto você tem livre na conta hoje?
          </p>
          <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Informe o <strong>disponível</strong> do app do banco (já descontando o que está reservado).
            O app recalcula o ponto de partida com base nas suas entradas e pagos.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setBalanceEditorOpen(true)}
        className="w-full text-left hover:opacity-90 transition-opacity min-h-[44px] mb-1"
      >
        <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Disponível agora</p>
        {needsSetup ? (
          <p className={`text-lg font-display mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Configure abaixo
          </p>
        ) : (
          <p className={`text-3xl sm:text-4xl font-display tabular-nums tracking-tight mt-1 ${AXEL_TEXT_PRIMARY}`}>
            {fmt(saldoDisponivel)}
          </p>
        )}
        {!needsSetup && (
          <>
            <FinanceStabilityMeter tone={cashTone} showHint className="mt-2" />
            <p className={`text-[10px] mt-1 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
              Entrou {fmt(saldoInicial + receitasPagas)} · Pagou {fmt(despesasPagas)}
              {reservaRestante > 0 && <> · Comprometido {fmt(reservaRestante)}</>}
            </p>
          </>
        )}
      </button>

      <div className={`grid grid-cols-2 ${AXEL_METRIC_HAIRLINE} mt-3`}>
        <button
          type="button"
          onClick={() => setBalanceEditorOpen(true)}
          className="text-left min-h-[44px] pr-4 border-r-[0.5px] border-line hover:opacity-90 transition-opacity"
        >
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Comprometido</p>
          <p className={`text-lg font-display tabular-nums mt-0.5 ${AXEL_TEXT_PRIMARY}`}>{fmt(reservaRestante)}</p>
        </button>
        <button
          type="button"
          onClick={() => setBalanceEditorOpen(true)}
          className="text-left min-h-[44px] pl-4 hover:opacity-90 transition-opacity"
        >
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Projetado livre</p>
          <p className={`text-lg font-display tabular-nums mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
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
            . Use <strong>Ajustar saldo</strong> para editar ou voltar ao cálculo automático.
          </>
        ) : (
          <>
            Saldo inicial {fmt(saldoInicial)} + entradas − pagos no caixa − comprometido = disponível agora.
            Fixas do mês ({fmt(compromissosFixas)}) entram no projetado.
            Se não bater com o banco, use <strong>Ajustar saldo</strong>.
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
          <MoneyInput
            value={val}
            onChange={setVal}
            placeholder="Disponível hoje, ex.: 1500,00"
            className="flex-1 min-h-[44px] text-sm"
          />
          <button type="button" onClick={() => void save()} className={`px-4 py-2.5 min-h-[44px] font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY_COMPACT}`}>
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
