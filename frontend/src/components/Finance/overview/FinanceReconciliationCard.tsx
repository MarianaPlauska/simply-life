import { useMemo, useState } from 'react'
import { Building2, CheckCircle2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../../store/useTaskStore'
import { buildReconciliationSnapshot } from '../../../lib/financeReconciliation'
import { getReconciliationStreak } from '../../../lib/financeGamification'
import {
  AXEL_BTN_PRIMARY,
  AXEL_BORDERLESS_PANEL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceReconciliationCardProps
{
  /** Dentro do painel de conta corrente — sem card duplicado */
  embedded?: boolean
}

export function FinanceReconciliationCard({ embedded = false }: FinanceReconciliationCardProps)
{
  const transactions = useTaskStore((s) => s.transactions)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const setBankBalance = useTaskStore((s) => s.setBankBalance)

  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')

  const snap = useMemo(
    () => buildReconciliationSnapshot(transactions, cashAccount, reservedBills),
    [transactions, cashAccount, reservedBills],
  )

  const streak = getReconciliationStreak()

  const startEdit = () =>
  {
    setVal(snap.saldoBanco != null ? String(snap.saldoBanco) : '')
    setEditing(true)
  }

  const save = async () =>
  {
    const n = parseFloat(val.replace(',', '.'))
    if (Number.isNaN(n) || n < 0)
    {
      toast.error('Informe o saldo do banco')
      return
    }
    await setBankBalance(n)
    setEditing(false)
  }

  const shell = snap.alinhado
    ? embedded
      ? ''
      : 'border-l-concluido from-concluido/8'
    : snap.saldoBanco != null
      ? embedded
        ? ''
        : 'border-l-atencao from-atencao/10'
      : embedded
        ? ''
        : 'border-l-accent from-accent/8'

  const Wrapper = embedded ? 'div' : 'section'
  const wrapperClass = embedded
    ? 'space-y-3'
    : `${AXEL_BORDERLESS_PANEL} border-l-[3px] bg-gradient-to-br to-transparent ${shell}`

  return (
    <Wrapper className={wrapperClass}>
      {!embedded && (
        <header className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-accent" />
            <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
              Reconciliar com o banco
            </p>
          </div>
          {snap.alinhado && (
            <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-concluido">
              <CheckCircle2 size={11} />
              Conferido
            </span>
          )}
        </header>
      )}

      {embedded && snap.alinhado && (
        <p className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-concluido mb-2">
          <CheckCircle2 size={11} />
          Saldo conferido com o banco
        </p>
      )}

      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 rounded-sl border border-line bg-chrome/50 flex items-center justify-center">
          <Sparkles size={14} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>{snap.axelHeadline}</p>
          <p className={`text-[11px] mt-1 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>{snap.axelDetail}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
        <div className="border border-line rounded-sl px-3 py-2 bg-chrome/30">
          <span className={AXEL_TEXT_SECONDARY}>App (disponível)</span>
          <p className={`font-mono tabular-nums mt-0.5 ${AXEL_TEXT_PRIMARY}`}>{fmt(snap.saldoDisponivel)}</p>
        </div>
        <div className="border border-line rounded-sl px-3 py-2 bg-chrome/30">
          <span className={AXEL_TEXT_SECONDARY}>Banco informado</span>
          <p className={`font-mono tabular-nums mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
            {snap.saldoBanco != null ? fmt(snap.saldoBanco) : '—'}
          </p>
        </div>
      </div>

      {snap.delta != null && !snap.alinhado && (
        <p className="font-mono text-[10px] mt-2 text-atencao tabular-nums">
          Diferença: {snap.delta > 0 ? '+' : ''}{fmt(snap.delta)}
        </p>
      )}

      {streak > 1 && (
        <p className={`font-mono text-[9px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
          Streak de reconciliação: {streak} dias · +15 XP ao conferir
        </p>
      )}

      {editing ? (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            inputMode="decimal"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Saldo no app do banco"
            className="flex-1 border border-line rounded-sl bg-chrome px-3 py-2 text-sm font-mono"
            autoFocus
          />
          <button type="button" onClick={() => void save()} className={`px-4 py-2 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}>
            Conferir
          </button>
          <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 font-mono text-[10px] uppercase border border-line rounded-sl">
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className={`mt-3 w-full py-2.5 font-mono text-[10px] uppercase rounded-sl border border-accent/40 text-accent hover:bg-accent/10`}
        >
          {snap.saldoBanco != null ? 'Atualizar saldo do banco' : 'Informar saldo do banco'}
        </button>
      )}
    </Wrapper>
  )
}
