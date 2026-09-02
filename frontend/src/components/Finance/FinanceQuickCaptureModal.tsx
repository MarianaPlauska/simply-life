import { useEffect, useMemo, useState } from 'react'
import { X, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import {
  guessCategoryId,
  looksLikeFinanceCapture,
  parseFinanceQuickCapture,
  type ParsedFinanceCapture,
} from '../../lib/financeQuickCapture'
import { findCategory } from '../../lib/financeCategoryTree'
import { useFinancePurchaseCheck } from '../../hooks/useFinancePurchaseCheck'
import { useMoodOrchestration } from '../../hooks/useMoodOrchestration'
import { FinancePurchaseCheckStep } from './overview/FinancePurchaseCheckStep'
import { deferPurchaseToKanban } from '../../lib/deferPurchaseToKanban'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import {
  DEFAULT_EXPENSE_PAYMENT,
  DEFAULT_INCOME_PAYMENT,
  resolvePaymentFromSelection,
} from '../../lib/financePaymentMethod'
import {
  AXEL_BTN_LG,
  AXEL_BTN_PRIMARY,
  AXEL_FORM_SEG_ACTIVE,
  AXEL_FORM_SEG_IDLE,
} from '../../constants/axelSurfaces'

/** Gastos acima deste valor passam pelo E11 antes de salvar */
const E11_QUICK_CAPTURE_THRESHOLD = 50

const TIPOS: { id: ParsedFinanceCapture['tipo']; label: string }[] = [
  { id: 'despesa', label: 'Gasto' },
  { id: 'receita', label: 'Ganho' },
  { id: 'investimento', label: 'Investimento' },
]

function todayIsoDate(): string
{
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function tipoLabel(tipo: ParsedFinanceCapture['tipo']): string
{
  if (tipo === 'receita') return 'Receita'
  if (tipo === 'investimento') return 'Investimento'
  return 'Gasto'
}

export function FinanceQuickCaptureModal()
{
  const isOpen = useTaskStore((s) => s.isFinanceQuickCaptureOpen)
  const setOpen = useTaskStore((s) => s.setFinanceQuickCaptureOpen)
  const seed = useTaskStore((s) => s.financeQuickCaptureSeed)
  const setSeed = useTaskStore((s) => s.setFinanceQuickCaptureSeed)
  const addTransaction = useTaskStore((s) => s.addTransaction)
  const addReservedBill = useTaskStore((s) => s.addReservedBill)
  const categories = useTaskStore((s) => s.categories)
  const transactions = useTaskStore((s) => s.transactions)
  const budgetLimits = useTaskStore((s) => s.budgetLimits)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const cards = useTaskStore((s) => s.cards)
  const registerInteraction = useTaskStore((s) => s.registerInteraction)

  const mood = useMoodOrchestration()
  const { loading: checkLoading, verdict, iaAtiva, checkPurchase, reset: resetCheck } = useFinancePurchaseCheck()

  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [phase, setPhase] = useState<'form' | 'axel'>('form')
  const [pendingParsed, setPendingParsed] = useState<ParsedFinanceCapture | null>(null)
  const [tipoOverride, setTipoOverride] = useState<ParsedFinanceCapture['tipo'] | null>(null)
  const [data, setData] = useState(todayIsoDate)
  const [payment, setPayment] = useState(DEFAULT_EXPENSE_PAYMENT)
  const [viraConta, setViraConta] = useState(false)
  const [ehFixo, setEhFixo] = useState(false)

  useEffect(() =>
  {
    if (isOpen)
    {
      setText(seed)
      setPhase('form')
      setPendingParsed(null)
      setTipoOverride(null)
      setData(todayIsoDate())
      setPayment(DEFAULT_EXPENSE_PAYMENT)
      setViraConta(false)
      setEhFixo(false)
      resetCheck()
    }
  }, [isOpen, seed, resetCheck])

  const parsed = parseFinanceQuickCapture(text)
  const tipo = tipoOverride ?? parsed?.tipo ?? 'despesa'

  useEffect(() =>
  {
    if (tipo === 'despesa')
    {
      setPayment((p) => p || DEFAULT_EXPENSE_PAYMENT)
      return
    }
    setPayment(DEFAULT_INCOME_PAYMENT)
  }, [tipo])

  const monthTransactions = useMemo(() =>
  {
    const now = new Date()
    const m = now.getMonth()
    const y = now.getFullYear()
    return transactions.filter((t) =>
    {
      const d = new Date(`${t.data.slice(0, 10)}T12:00:00`)
      return d.getMonth() === m && d.getFullYear() === y
    })
  }, [transactions])

  if (!isOpen)
  {
    return null
  }

  const close = () =>
  {
    setText('')
    setSeed('')
    setPhase('form')
    setPendingParsed(null)
    setTipoOverride(null)
    resetCheck()
    setOpen(false)
  }

  const withTipo = (p: ParsedFinanceCapture): ParsedFinanceCapture =>
    ({ ...p, tipo })

  const needsE11 = (p: ParsedFinanceCapture) =>
    p.tipo === 'despesa' && p.valor > E11_QUICK_CAPTURE_THRESHOLD

  const commitTransaction = async (p: ParsedFinanceCapture) =>
  {
    const resolved = withTipo(p)
    const catId = guessCategoryId(resolved.descricao, categories, resolved.tipo)
    const cat = catId ? findCategory(categories, catId) : undefined
    const pay = resolvePaymentFromSelection(payment, cards)
    const cardId = resolved.tipo === 'despesa' ? pay.card_id : undefined

    await addTransaction({
      descricao: resolved.descricao,
      valor: resolved.valor,
      tipo: resolved.tipo,
      categoria:
        resolved.tipo === 'receita'
          ? (cat?.nome ?? 'receita')
          : resolved.tipo === 'investimento'
            ? (cat?.nome ?? 'investimento')
            : (cat?.nome ?? 'outros'),
      categoria_id: catId,
      data,
      status_pagamento: viraConta ? 'pendente' : 'pago',
      forma_pagamento: pay.forma_pagamento ?? 'pix',
      card_id: cardId,
    })

    if (ehFixo)
    {
      await addReservedBill({
        titulo: resolved.descricao,
        valor_alocado: resolved.valor,
        data_vencimento: data,
        card_id: cardId,
        categoria_id: catId,
      })
    }

    registerInteraction('financeiro')
    toast.success(
      ehFixo
        ? `${tipoLabel(resolved.tipo)} lançado · conta marcada como fixa`
        : `${tipoLabel(resolved.tipo)} ${resolved.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} lançado`,
    )
    close()
  }

  const runAxelGate = async (p: ParsedFinanceCapture) =>
  {
    const resolved = withTipo(p)
    const catId = guessCategoryId(resolved.descricao, categories, resolved.tipo)
    setPendingParsed(resolved)
    setPhase('axel')
    await checkPurchase({
      descricao: resolved.descricao,
      valor: resolved.valor,
      categoriaId: catId,
      formaPagamento: resolvePaymentFromSelection(payment, cards).forma_pagamento ?? 'pix',
      transactions,
      monthTransactions,
      categories,
      budgetLimits,
      saldoInicial: cashAccount.saldo_inicial,
      reservedBills,
      cards,
      moodProfile: mood.profile,
    })
  }

  const save = async () =>
  {
    if (!parsed)
    {
      toast.error('Ex: gastei 45 almoço · ganhei 2000 salário · guardei 200 reserva')
      return
    }

    const resolved = withTipo(parsed)
    if (needsE11(resolved))
    {
      await runAxelGate(resolved)
      return
    }

    setSaving(true)
    try
    {
      await commitTransaction(resolved)
    }
    catch
    {
      toast.error('Erro ao lançar')
    }
    finally
    {
      setSaving(false)
    }
  }

  const confirmAfterAxel = async () =>
  {
    if (!pendingParsed) return
    setSaving(true)
    try
    {
      await commitTransaction(pendingParsed)
    }
    catch
    {
      toast.error('Erro ao lançar')
    }
    finally
    {
      setSaving(false)
    }
  }

  const deferAfterAxel = async () =>
  {
    if (!pendingParsed || !verdict) return
    setSaving(true)
    try
    {
      await deferPurchaseToKanban({
        descricao: pendingParsed.descricao,
        valor: pendingParsed.valor,
        verdict,
      })
      toast.success('Tarefa no Kanban · o AXEL cobra a revisão')
      close()
    }
    catch
    {
      toast.error('Não foi possível criar a tarefa')
    }
    finally
    {
      setSaving(false)
    }
  }

  const axelDescricao = pendingParsed?.descricao ?? parsed?.descricao ?? ''
  const axelValor = pendingParsed?.valor ?? parsed?.valor ?? 0
  const resolvedPreview = parsed ? withTipo(parsed) : null

  return (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} aria-label="Fechar" />

      <div className="relative w-full sm:max-w-md max-h-[min(90dvh,680px)] overflow-y-auto border border-line bg-card rounded-t-sl sm:rounded-sl shadow-2xl p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-finance" />
            <h2 className="text-[15px] font-semibold text-ink">
              {phase === 'axel' ? 'Consulta AXEL' : 'Lançamento rápido'}
            </h2>
          </div>
          <button type="button" onClick={close} className="p-2 min-h-11 min-w-11 text-ink-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>

        {phase === 'axel' ? (
          <FinancePurchaseCheckStep
            descricao={axelDescricao}
            valor={axelValor}
            verdict={verdict}
            loading={checkLoading}
            iaAtiva={iaAtiva}
            onConfirm={() => void confirmAfterAxel()}
            onCancel={close}
            onDefer={() => void deferAfterAxel()}
            onBack={() =>
            {
              setPhase('form')
              setPendingParsed(null)
              resetCheck()
            }}
          />
        ) : (
          <>
            <p className="sl-section-label">Tipo</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TIPOS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTipoOverride(item.id)}
                  className={tipo === item.id ? AXEL_FORM_SEG_ACTIVE : AXEL_FORM_SEG_IDLE}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="block mt-3 sl-section-label" htmlFor="finance-quick-text">
              O que aconteceu
            </label>
            <input
              id="finance-quick-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) =>
              {
                if (e.key === 'Enter') void save()
              }}
              placeholder="gastei 45 almoço · ganhei 3000 salário · guardei 200"
              className="w-full mt-1 border border-line rounded-sl bg-chrome px-3 py-3 text-[15px] text-ink placeholder:text-ink-muted outline-none focus:border-ink/40 min-h-11"
              autoFocus
            />

            <label className="block mt-3 sl-section-label" htmlFor="finance-quick-data">
              Data
            </label>
            <input
              id="finance-quick-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full mt-1 border border-line rounded-sl bg-chrome px-3 py-2 text-[15px] text-ink min-h-11"
            />

            {tipo === 'despesa' && (
              <div className="mt-3">
                <PaymentMethodPicker
                  cards={cards}
                  value={payment}
                  onChange={setPayment}
                  variant="despesa"
                />
              </div>
            )}

            {tipo !== 'despesa' && (
              <div className="mt-3">
                <PaymentMethodPicker
                  cards={cards}
                  value={payment}
                  onChange={setPayment}
                  variant="receita"
                />
              </div>
            )}

            <div className="mt-3 space-y-1">
              <label className="flex items-center gap-2 min-h-11 text-[15px] text-ink">
                <input
                  type="checkbox"
                  checked={viraConta}
                  onChange={(e) => setViraConta(e.target.checked)}
                  className="size-4 accent-ink"
                />
                Vira conta (ainda não saiu)
              </label>
              <label className="flex items-center gap-2 min-h-11 text-[15px] text-ink">
                <input
                  type="checkbox"
                  checked={ehFixo}
                  onChange={(e) => setEhFixo(e.target.checked)}
                  className="size-4 accent-ink"
                />
                Fixo / reserva mensal
              </label>
            </div>

            {resolvedPreview && (
              <p className="mt-3 text-[13px] text-ink-muted leading-relaxed">
                {tipoLabel(resolvedPreview.tipo)}{' '}
                <span className="text-ink tabular-nums">
                  {resolvedPreview.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                {' · '}{resolvedPreview.descricao}
                {looksLikeFinanceCapture(text) && !viraConta && ' · pago'}
                {viraConta && ' · pendente'}
                {ehFixo && ' · fixo'}
                {needsE11(resolvedPreview) && (
                  <span className="block mt-1">Acima de R$ {E11_QUICK_CAPTURE_THRESHOLD} · AXEL consulta antes.</span>
                )}
              </p>
            )}

            <button
              type="button"
              disabled={saving || !parsed}
              onClick={() => void save()}
              className={`mt-4 ${AXEL_BTN_LG} ${AXEL_BTN_PRIMARY} disabled:opacity-40`}
            >
              {saving ? 'Salvando…' : parsed && needsE11(withTipo(parsed)) ? 'Consultar e lançar' : 'Lançar agora'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
