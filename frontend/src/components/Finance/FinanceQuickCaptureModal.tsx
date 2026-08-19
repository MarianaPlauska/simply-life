import { useEffect, useMemo, useState } from 'react'
import { X, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import {
  guessCategoryId,
  looksLikeFinanceCapture,
  parseFinanceQuickCapture,
} from '../../lib/financeQuickCapture'
import { findCategory } from '../../lib/financeCategoryTree'
import { useFinancePurchaseCheck } from '../../hooks/useFinancePurchaseCheck'
import { useMoodOrchestration } from '../../hooks/useMoodOrchestration'
import { FinancePurchaseCheckStep } from './overview/FinancePurchaseCheckStep'
import { deferPurchaseToKanban } from '../../lib/deferPurchaseToKanban'
import { AXEL_BTN_PRIMARY } from '../../constants/axelSurfaces'

/** Gastos acima deste valor passam pelo E11 antes de salvar */
const E11_QUICK_CAPTURE_THRESHOLD = 50

export function FinanceQuickCaptureModal()
{
  const isOpen = useTaskStore((s) => s.isFinanceQuickCaptureOpen)
  const setOpen = useTaskStore((s) => s.setFinanceQuickCaptureOpen)
  const seed = useTaskStore((s) => s.financeQuickCaptureSeed)
  const setSeed = useTaskStore((s) => s.setFinanceQuickCaptureSeed)
  const addTransaction = useTaskStore((s) => s.addTransaction)
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
  const [pendingParsed, setPendingParsed] = useState<ReturnType<typeof parseFinanceQuickCapture>>(null)

  useEffect(() =>
  {
    if (isOpen)
    {
      setText(seed)
      setPhase('form')
      setPendingParsed(null)
      resetCheck()
    }
  }, [isOpen, seed, resetCheck])

  const parsed = parseFinanceQuickCapture(text)

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

  if (!isOpen) return null

  const close = () =>
  {
    setText('')
    setSeed('')
    setPhase('form')
    setPendingParsed(null)
    resetCheck()
    setOpen(false)
  }

  const needsE11 = (p: NonNullable<typeof parsed>) =>
    p.tipo === 'despesa' && p.valor > E11_QUICK_CAPTURE_THRESHOLD

  const commitTransaction = async (p: NonNullable<typeof parsed>) =>
  {
    const catId = guessCategoryId(p.descricao, categories, p.tipo)
    const cat = catId ? findCategory(categories, catId) : undefined

    await addTransaction({
      descricao: p.descricao,
      valor: p.valor,
      tipo: p.tipo,
      categoria: p.tipo === 'receita' ? (cat?.nome ?? 'receita') : (cat?.nome ?? 'outros'),
      categoria_id: catId,
      data: new Date().toISOString().slice(0, 10),
      status_pagamento: 'pago',
      forma_pagamento: 'pix',
    })

    registerInteraction('financeiro')
    toast.success(
      p.tipo === 'receita'
        ? `Receita ${p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} lançada`
        : `Gasto lançado · saldo atualizado`,
    )
    close()
  }

  const runAxelGate = async (p: NonNullable<typeof parsed>) =>
  {
    const catId = guessCategoryId(p.descricao, categories, p.tipo)
    setPendingParsed(p)
    setPhase('axel')
    await checkPurchase({
      descricao: p.descricao,
      valor: p.valor,
      categoriaId: catId,
      formaPagamento: 'pix',
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
      toast.error('Ex: gastei 45 almoço · recebi 2000 salário')
      return
    }

    if (needsE11(parsed))
    {
      await runAxelGate(parsed)
      return
    }

    setSaving(true)
    try
    {
      await commitTransaction(parsed)
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

  return (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} aria-label="Fechar" />

      <div className="relative w-full sm:max-w-md border border-line bg-card rounded-t-sl sm:rounded-sl shadow-2xl p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-accent" />
            <h2 className="text-sm font-display uppercase tracking-wide text-ink">
              {phase === 'axel' ? 'Consulta AXEL' : 'Lançar gasto rápido'}
            </h2>
          </div>
          <button type="button" onClick={close} className="p-2 text-ink-muted hover:text-ink">
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
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) =>
              {
                if (e.key === 'Enter') void save()
              }}
              placeholder="gastei 45 almoço · recebi 3000 salário"
              className="w-full border border-line rounded-sl bg-chrome px-3 py-3 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-accent/50"
              autoFocus
            />

            {parsed && (
              <div className="mt-3 flex items-start gap-2 rounded-sl border border-accent/30 bg-accent/5 px-3 py-2">
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  {parsed.tipo === 'receita' ? 'Receita' : 'Gasto'}{' '}
                  <span className="text-ink font-mono tabular-nums">
                    {parsed.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  {' · '}{parsed.descricao}
                  {looksLikeFinanceCapture(text) && ' · desconta do caixa (PIX pago)'}
                  {needsE11(parsed) && (
                    <span className="block mt-1 text-accent">
                      Acima de R$ {E11_QUICK_CAPTURE_THRESHOLD} · AXEL consulta antes de lançar.
                    </span>
                  )}
                </p>
              </div>
            )}

            <p className="text-[10px] text-ink-muted mt-2 font-mono">
              Atalho: Ctrl+K → digite o gasto → Enter
            </p>

            <button
              type="button"
              disabled={saving || !parsed}
              onClick={() => void save()}
              className={`w-full mt-4 py-3 font-mono text-[11px] uppercase ${AXEL_BTN_PRIMARY} disabled:opacity-40`}
            >
              {saving ? 'Salvando…' : parsed && needsE11(parsed) ? 'Consultar e lançar' : 'Lançar agora'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
