import { useEffect, useMemo, useState } from 'react'
import {
  X,
  TrendingUp,
  PiggyBank,
  Wallet,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { toast } from 'sonner'
import { FinanceCategories } from './FinanceCategories'
import { CategoryPicker } from './CategoryPicker'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import { findCategory, formatCategoryPath } from '../../lib/financeCategoryTree'
import {
  DEFAULT_EXPENSE_PAYMENT,
  DEFAULT_INCOME_PAYMENT,
  isCardPaymentSelection,
  resolvePaymentFromSelection,
} from '../../lib/financePaymentMethod'
import {
  AXEL_BTN_PRIMARY_COMPACT,
  AXEL_SEG_ACTIVE,
  AXEL_SEG_IDLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { useFinancePurchaseCheck } from '../../hooks/useFinancePurchaseCheck'
import { useMoodOrchestration } from '../../hooks/useMoodOrchestration'
import { FinancePurchaseCheckStep } from './overview/FinancePurchaseCheckStep'
import { FinanceExtraIncomeSection, type ReceitaCreditoQuando } from './FinanceExtraIncomeSection'
import { MoneyInput } from '../ui/MoneyInput'
import { parseMoneyInputToNumber } from '../../lib/currencyInput'
import { FormFieldLabel } from '../ui/FormFieldLabel'

type LancamentoModo = 'imediato' | 'futuro'
type LancamentoTipo = 'despesa' | 'receita' | 'investimento'
type ContaAcao = 'saldo' | 'entrada'

interface NewTransactionModalProps
{
  isOpen: boolean
  onClose: () => void
}

const TIPO_LABELS: Record<LancamentoTipo, string> = {
  despesa: 'Gasto',
  receita: 'Receita',
  investimento: 'Investimento',
}

const TIPO_HINTS: Record<LancamentoTipo, string> = {
  despesa: 'Dinheiro que saiu — compras, contas, consumo.',
  receita: 'Dinheiro que entrou — salário, PIX recebido, freelance.',
  investimento: 'Dinheiro guardado — poupança, CDB, ações, reserva.',
}

export function NewTransactionModal({ isOpen, onClose }: NewTransactionModalProps)
{
  const mode = useTaskStore((s) => s.newTransactionModalMode)
  const cards = useTaskStore((s) => s.cards)
  const categories = useTaskStore((s) => s.categories)
  const transactions = useTaskStore((s) => s.transactions)
  const budgetLimits = useTaskStore((s) => s.budgetLimits)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const addTransaction = useTaskStore((s) => s.addTransaction)
  const setCashInitialBalance = useTaskStore((s) => s.setCashInitialBalance)
  const registerInteraction = useTaskStore((s) => s.registerInteraction)
  const { loading: checkLoading, verdict, iaAtiva, checkPurchase, reset: resetCheck } = useFinancePurchaseCheck()
  const mood = useMoodOrchestration()

  const [showCatModal, setShowCatModal] = useState(false)
  const [catModalParentId, setCatModalParentId] = useState<number | null>(null)
  const [catModalDefaultTipo, setCatModalDefaultTipo] = useState<'receita' | 'despesa'>('despesa')
  const [pinVersion, setPinVersion] = useState(0)
  const [showInvestimento, setShowInvestimento] = useState(false)
  const [modo, setModo] = useState<LancamentoModo>('imediato')
  const [phase, setPhase] = useState<'form' | 'axel'>('form')
  const [receitaCreditoQuando, setReceitaCreditoQuando] = useState<ReceitaCreditoQuando>('agora')
  const [contaAcao, setContaAcao] = useState<ContaAcao>('saldo')
  const [saldoValor, setSaldoValor] = useState('')
  const reservedBills = useTaskStore((s) => s.reservedBills)

  const [form, setForm] = useState({
    descricao: '',
    observacao: '',
    valor: '',
    tipo: 'despesa' as LancamentoTipo,
    categoria_id: '' as number | '',
    data: '',
    payment: DEFAULT_EXPENSE_PAYMENT as string,
    fatura_reserva_id: '' as number | '',
  })

  const investCatId = useMemo(() =>
  {
    const inv = categories.find(
      (c) => c.tipo === 'despesa' && c.nome.toLowerCase().includes('invest'),
    )
    return inv?.id
  }, [categories])

  const openBills = useMemo(
    () => reservedBills.filter((b) => b.status === 'aberta'),
    [reservedBills],
  )

  const somenteReceita = mode === 'receita' || (mode === 'conta' && contaAcao === 'entrada')
  const isContaSaldo = mode === 'conta' && contaAcao === 'saldo'

  useEffect(() =>
  {
    if (!isOpen) return

    if (mode === 'receita' || mode === 'conta')
    {
      setForm((f) => ({
        ...f,
        tipo: 'receita',
        payment: DEFAULT_INCOME_PAYMENT,
        fatura_reserva_id: '',
      }))
      setModo('imediato')
      setReceitaCreditoQuando('agora')
    }

    if (mode === 'conta')
    {
      setContaAcao('saldo')
      setSaldoValor(cashAccount.saldo_inicial > 0 ? String(cashAccount.saldo_inicial) : '')
    }
  }, [isOpen, mode, cashAccount.saldo_inicial])

  if (!isOpen) return null

  const resetAndClose = () =>
  {
    setForm({
      descricao: '',
      observacao: '',
      valor: '',
      tipo: 'despesa',
      categoria_id: '',
      data: '',
      payment: DEFAULT_EXPENSE_PAYMENT,
      fatura_reserva_id: '',
    })
    setModo('imediato')
    setReceitaCreditoQuando('agora')
    setContaAcao('saldo')
    setSaldoValor('')
    setPhase('form')
    setShowInvestimento(false)
    resetCheck()
    onClose()
  }

  const setTipo = (tipo: LancamentoTipo) =>
  {
    setForm({
      ...form,
      tipo,
      categoria_id: tipo === 'investimento' && investCatId ? investCatId : '',
      payment: tipo === 'receita' ? DEFAULT_INCOME_PAYMENT : DEFAULT_EXPENSE_PAYMENT,
      fatura_reserva_id: '',
    })
    if (tipo !== 'despesa') setModo('imediato')
  }

  const resolveStatus = (): 'pago' | 'pendente' | 'agendado' =>
  {
    if (form.tipo === 'receita')
    {
      return receitaCreditoQuando === 'proximo-mes' ? 'agendado' : 'pago'
    }
    if (form.tipo === 'investimento') return 'pago'
    if (modo === 'futuro') return 'agendado'
    return 'pago'
  }

  const parseValor = (): number | null =>
  {
    const val = parseMoneyInputToNumber(form.valor)
    if (!form.descricao.trim() || !Number.isFinite(val) || val <= 0) return null
    return val
  }

  const needsAxelCheck = (): boolean =>
  {
    if (mode !== 'full') return false
    return form.tipo === 'despesa' && modo === 'imediato'
  }

  const saveSaldoInicial = async () =>
  {
    const n = parseMoneyInputToNumber(saldoValor)
    if (!Number.isFinite(n) || n < 0)
    {
      toast.error('Informe um saldo válido')
      return
    }
    await setCashInitialBalance(n)
    registerInteraction('financeiro')
    toast.success('Saldo da conta atualizado')
    resetAndClose()
  }

  const modalTitle = (): string =>
  {
    if (mode === 'conta') return 'Conta corrente'
    if (mode === 'receita') return 'Entrada no caixa'
    return 'Novo lançamento'
  }

  const modalHint = (): string =>
  {
    if (isContaSaldo)
    {
      return 'Defina quanto você tem na conta hoje — base para Disponível e Projetado.'
    }
    if (somenteReceita)
    {
      return 'Registra dinheiro que entrou e atualiza o saldo na hora.'
    }
    return TIPO_HINTS[form.tipo]
  }

  const runAxelCheck = async () =>
  {
    const val = parseValor()
    if (val == null)
    {
      toast.error('Preencha descrição e valor')
      return
    }

    const paymentResolved = resolvePaymentFromSelection(form.payment, cards)
    const now = new Date()
    const monthTx = transactions.filter((t) =>
    {
      const d = new Date(`${t.data.slice(0, 10)}T12:00:00`)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    setPhase('axel')
    await checkPurchase({
      descricao: form.descricao.trim(),
      valor: val,
      categoriaId: form.categoria_id !== '' ? form.categoria_id : undefined,
      cardId: paymentResolved.card_id,
      formaPagamento: paymentResolved.forma_pagamento,
      transactions,
      monthTransactions: monthTx,
      categories,
      budgetLimits,
      saldoInicial: cashAccount.saldo_inicial,
      reservedBills,
      cards,
      moodProfile: mood.profile,
    })
  }

  const handleAdd = async () =>
  {
    const val = parseValor()
    if (val == null)
    {
      toast.error('Preencha descrição e valor')
      return
    }

    const paymentResolved = resolvePaymentFromSelection(form.payment, cards)
    const cardId = form.tipo === 'despesa' ? paymentResolved.card_id : undefined
    const formaPagamento = form.tipo === 'investimento'
      ? undefined
      : paymentResolved.forma_pagamento

    if (cardId)
    {
      const selectedCard = cards.find((c) => c.id === cardId)
      if (selectedCard?.status === 'bloqueado')
      {
        toast.error('Cartão bloqueado')
        return
      }
    }

    const cat = form.categoria_id !== ''
      ? findCategory(categories, form.categoria_id)
      : undefined

    await addTransaction({
      descricao: form.descricao.trim(),
      observacao: form.observacao.trim() || undefined,
      valor: val,
      tipo: form.tipo,
      categoria: form.tipo === 'receita'
        ? (cat?.nome ?? '-')
        : (cat?.nome ?? (form.tipo === 'investimento' ? 'investimentos' : 'outros')),
      categoria_id: form.categoria_id !== ''
        ? form.categoria_id
        : form.tipo === 'investimento'
          ? investCatId
          : undefined,
      data: form.data || new Date().toISOString().slice(0, 10),
      status_pagamento: resolveStatus(),
      forma_pagamento: formaPagamento,
      card_id: cardId,
      fatura_reserva_id: form.fatura_reserva_id !== '' ? form.fatura_reserva_id : undefined,
    })

    registerInteraction('financeiro')
    toast.success(
      form.tipo === 'receita'
        ? 'Receita lançada no caixa'
        : form.tipo === 'investimento'
          ? 'Investimento registrado'
          : modo === 'futuro'
            ? 'Conta futura registrada'
            : cardId
              ? 'Gasto lançado no cartão'
              : 'Gasto lançado na conta corrente',
    )
    resetAndClose()
  }

  const openCategories = (
    parentId: number | null = null,
    tipo: 'receita' | 'despesa' = form.tipo === 'receita' ? 'receita' : 'despesa',
  ) =>
  {
    setCatModalParentId(parentId)
    setCatModalDefaultTipo(tipo)
    setShowCatModal(true)
  }

  const selectedCatLabel = formatCategoryPath(
    categories,
    form.categoria_id !== '' ? form.categoria_id : undefined,
  )

  const saveHint = isContaSaldo
    ? 'Saldo da conta'
    : form.tipo === 'receita'
      ? 'Receita'
      : form.tipo === 'investimento'
        ? 'Investimento'
        : modo === 'futuro'
          ? 'Conta futura'
          : 'Gasto'

  const paymentHint = form.tipo === 'despesa'
    ? modo === 'futuro'
      ? 'Agendado — aparece em próximas contas, sem descontar o saldo agora.'
      : isCardPaymentSelection(form.payment, cards)
        ? 'Abate o limite do cartão — entra na fatura.'
        : 'Desconta da conta corrente na hora (PIX, débito, dinheiro…).'
    : undefined

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={resetAndClose}
        aria-label="Fechar"
      />

      <div
        className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto z-[70] flex flex-col w-full sm:max-w-md max-h-[min(92vh,100dvh)] sm:max-h-none sm:h-full border border-line bg-card shadow-2xl rounded-t-sl sm:rounded-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="finance-tx-title"
      >
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-line">
          <div className="min-w-0 pr-2">
            <h3 id="finance-tx-title" className={`text-sm font-display uppercase tracking-wide ${AXEL_TEXT_PRIMARY}`}>
              {modalTitle()}
            </h3>
            <p className={`text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              {modalHint()}
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-2 rounded-sl hover:bg-chrome text-ink-muted shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {phase === 'axel' ? (
            <FinancePurchaseCheckStep
              descricao={form.descricao.trim()}
              valor={parseMoneyInputToNumber(form.valor)}
              verdict={verdict}
              loading={checkLoading}
              iaAtiva={iaAtiva}
              onConfirm={() => void handleAdd()}
              onCancel={resetAndClose}
              onBack={() =>
              {
                setPhase('form')
                resetCheck()
              }}
            />
          ) : (
          <>
          {mode === 'conta' && (
            <div className="grid grid-cols-2 gap-0.5 p-0.5 rounded-sl border border-line bg-chrome/40">
              <button
                type="button"
                onClick={() => setContaAcao('saldo')}
                className={contaAcao === 'saldo' ? AXEL_SEG_ACTIVE : AXEL_SEG_IDLE}
              >
                Atualizar saldo
              </button>
              <button
                type="button"
                onClick={() => setContaAcao('entrada')}
                className={contaAcao === 'entrada' ? AXEL_SEG_ACTIVE : AXEL_SEG_IDLE}
              >
                Registrar entrada
              </button>
            </div>
          )}

          {mode === 'full' && (
          <div className="space-y-1.5">
            <div className={`grid gap-0.5 p-0.5 rounded-sl border border-line bg-chrome/40 ${
              showInvestimento ? 'grid-cols-3' : 'grid-cols-2'
            }`}>
              {((showInvestimento
                ? ['despesa', 'receita', 'investimento']
                : ['despesa', 'receita']) as LancamentoTipo[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={form.tipo === t ? AXEL_SEG_ACTIVE : AXEL_SEG_IDLE}
                >
                  {TIPO_LABELS[t]}
                </button>
              ))}
            </div>
            {!showInvestimento && form.tipo !== 'investimento' && (
              <button
                type="button"
                onClick={() =>
                {
                  setShowInvestimento(true)
                  setTipo('investimento')
                }}
                className="text-[10px] font-mono text-ink-muted hover:text-accent underline-offset-2 hover:underline"
              >
                Registrar investimento (poupança, CDB…)
              </button>
            )}
          </div>
          )}

          {isContaSaldo && (
            <>
              <div className={`flex items-start gap-2 rounded-sl border px-3 py-2 text-[10px] border-accent/35 bg-accent/10 text-ink`}>
                <Wallet size={14} className="shrink-0 mt-0.5 text-accent" />
                <span>
                  Use quando abrir o app ou quiser corrigir o total.
                  Lançamentos pagos no caixa continuam atualizando o saldo automaticamente.
                </span>
              </div>
              <div className="space-y-1.5">
                <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                  Saldo atual na conta (R$) <span className="text-urgente">*</span>
                </label>
                <MoneyInput
                  value={saldoValor}
                  onChange={setSaldoValor}
                  className="w-full border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm outline-none focus:border-accent/50"
                />
              </div>
            </>
          )}

          {!isContaSaldo && (
          <>
          {mode === 'full' && form.tipo === 'despesa' && (
            <div className="space-y-1">
              <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Quando</p>
              <div className="grid grid-cols-2 gap-0.5 p-0.5 rounded-sl border border-line bg-chrome/40">
                <button
                  type="button"
                  onClick={() => setModo('imediato')}
                  className={modo === 'imediato' ? AXEL_SEG_ACTIVE : AXEL_SEG_IDLE}
                >
                  Já gastei
                </button>
                <button
                  type="button"
                  onClick={() => setModo('futuro')}
                  className={modo === 'futuro' ? AXEL_SEG_ACTIVE : AXEL_SEG_IDLE}
                >
                  Conta futura
                </button>
              </div>
            </div>
          )}

          {(form.tipo === 'receita' || somenteReceita) && (
            <div className={`flex items-start gap-2 rounded-sl border px-3 py-2 text-[10px] border-concluido/35 bg-concluido/10 text-concluido`}>
              <TrendingUp size={14} className="shrink-0 mt-0.5" />
              <span>Soma ao saldo da conta corrente agora.</span>
            </div>
          )}

          {mode === 'full' && form.tipo === 'investimento' && (
            <div className={`flex items-start gap-2 rounded-sl border px-3 py-2 text-[10px] border-accent/35 bg-accent/10 text-accent`}>
              <PiggyBank size={14} className="shrink-0 mt-0.5" />
              <span>Sai do caixa e vai para poupança/reserva — separado dos gastos do dia a dia.</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block">
              <FormFieldLabel required className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                Descrição
              </FormFieldLabel>
            </label>
            <input
              type="text"
              placeholder={
                form.tipo === 'receita'
                  ? 'Ex: Salário, PIX cliente, freelance...'
                  : form.tipo === 'investimento'
                    ? 'Ex: Aporte Tesouro, CDB, reserva emergência...'
                    : 'Ex: Almoço, Netflix, aluguel...'
              }
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-accent/50"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="block">
              <FormFieldLabel required className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                Valor (R$)
              </FormFieldLabel>
            </label>
            <MoneyInput
              value={form.valor}
              onChange={(v) => setForm({ ...form, valor: v })}
              className="w-full border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm outline-none focus:border-accent/50"
            />
          </div>

          {(form.tipo === 'receita' || somenteReceita) && (
            <div className="space-y-1.5">
              <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                Detalhe (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Salário de junho, PIX do cliente X, hora extra do plantão..."
                value={form.observacao}
                onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                className="w-full border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-accent/50 resize-none"
              />
              <p className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                Toque no nome do lançamento depois para ver esta nota na movimentação e na análise.
              </p>
            </div>
          )}

          {(form.tipo === 'receita' || somenteReceita) && (
            <FinanceExtraIncomeSection
              somenteAgora={somenteReceita}
              onPatch={(patch) =>
              {
                setForm((f) => ({
                  ...f,
                  ...(patch.descricao !== undefined ? { descricao: patch.descricao } : {}),
                  ...(patch.valor !== undefined ? { valor: patch.valor } : {}),
                  ...(patch.data !== undefined ? { data: patch.data } : {}),
                }))
                if (patch.creditoQuando)
                {
                  setReceitaCreditoQuando(patch.creditoQuando)
                }
              }}
            />
          )}

          {(form.tipo === 'receita' || somenteReceita) && (
            <div className="space-y-2">
              <label className="block">
                <FormFieldLabel optional className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                  Categoria
                </FormFieldLabel>
              </label>
              <CategoryPicker
                categories={categories}
                tipo="receita"
                value={form.categoria_id}
                onChange={(id) => setForm({ ...form, categoria_id: id })}
                compact
                pinVersion={pinVersion}
                onAddCategory={() => openCategories(null, 'receita')}
                onManageCategories={() => openCategories(null, 'receita')}
              />
            </div>
          )}

          {mode === 'full' && form.tipo === 'despesa' && (
            <>
              <div className="space-y-2">
                <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                  Categoria {form.categoria_id !== '' && (
                    <span className="text-accent normal-case">· {selectedCatLabel}</span>
                  )}
                </label>
                <CategoryPicker
                  categories={categories}
                  value={form.categoria_id}
                  onChange={(id) => setForm({ ...form, categoria_id: id })}
                  compact
                  pinVersion={pinVersion}
                  onAddCategory={() => openCategories(null)}
                  onAddSubcategory={(parentId) => openCategories(parentId)}
                  onManageCategories={() => openCategories(null)}
                />
              </div>

              <div className="space-y-2">
                <PaymentMethodPicker
                  cards={cards}
                  value={form.payment}
                  onChange={(payment) => setForm({ ...form, payment })}
                  variant="despesa"
                  hint={
                    form.fatura_reserva_id !== ''
                      ? `${paymentHint} Valor abate da reserva da fatura.`
                      : paymentHint
                  }
                />
              </div>

              {openBills.length > 0 && (
                <div className="space-y-1.5">
                  <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                    Abater de fatura reservada (opcional)
                  </label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, fatura_reserva_id: '' })}
                      className={form.fatura_reserva_id === '' ? AXEL_SEG_ACTIVE : AXEL_SEG_IDLE}
                    >
                      Nenhuma
                    </button>
                    {openBills.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setForm({ ...form, fatura_reserva_id: b.id })}
                        className={`max-w-full truncate ${
                          form.fatura_reserva_id === b.id ? AXEL_SEG_ACTIVE : AXEL_SEG_IDLE
                        }`}
                      >
                        {b.titulo}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'full' && form.tipo === 'investimento' && (
            <div className="space-y-2">
              <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                Destino (opcional)
              </label>
              <CategoryPicker
                categories={categories}
                value={form.categoria_id}
                onChange={(id) => setForm({ ...form, categoria_id: id })}
                compact
                pinVersion={pinVersion}
                onAddCategory={() => openCategories(null)}
                onManageCategories={() => openCategories(null)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
              {modo === 'futuro' ? 'Data do vencimento' : 'Data do lançamento'}
            </label>
            <input
              type="date"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
              className="w-full border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm font-mono text-ink outline-none focus:border-accent/50"
            />
          </div>
          </>
          )}
          </>
          )}
        </div>

        {phase === 'form' && (
        <div className="shrink-0 border-t border-line bg-card shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-4 sm:px-6 pt-2.5 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:pb-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void (isContaSaldo ? saveSaldoInicial() : handleAdd())}
            disabled={
              isContaSaldo
                ? !saldoValor.trim()
                : !form.descricao.trim() || !form.valor
            }
            title={`Salvar ${saveHint.toLowerCase()}`}
            className={`w-full py-1.5 px-3 ${AXEL_BTN_PRIMARY_COMPACT} disabled:opacity-40`}
          >
            Salvar
          </button>
          <p className={`text-center font-mono text-[8px] uppercase tracking-wide -mt-1 ${AXEL_TEXT_SECONDARY}`}>
            {saveHint}
          </p>
          {needsAxelCheck() && (
            <button
              type="button"
              onClick={() => void runAxelCheck()}
              disabled={!form.descricao.trim() || !form.valor}
              className="w-full py-1.5 font-mono text-[9px] uppercase rounded-sl border border-line text-ink-muted hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-40"
            >
              Consultar Axel
            </button>
          )}
        </div>
        )}
      </div>

      {showCatModal && (
        <FinanceCategories
          defaultParentId={catModalParentId}
          defaultTipo={catModalDefaultTipo}
          autoOpenAdd={catModalParentId === null}
          initialGrupo="geral"
          pinTipo={catModalDefaultTipo}
          onCategoryCreated={(cat) =>
          {
            setForm((f) => ({ ...f, categoria_id: cat.id }))
            setPinVersion((v) => v + 1)
          }}
          onClose={() =>
          {
            setShowCatModal(false)
            setCatModalParentId(null)
            setPinVersion((v) => v + 1)
          }}
        />
      )}
    </>
  )
}
