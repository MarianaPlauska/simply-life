import { useMemo, useState } from 'react'
import {
  X,
  CheckCircle2,
  CalendarClock,
  TrendingUp,
  PiggyBank,
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
  AXEL_BTN_PRIMARY,
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { useFinancePurchaseCheck } from '../../hooks/useFinancePurchaseCheck'
import { useMoodOrchestration } from '../../hooks/useMoodOrchestration'
import { FinancePurchaseCheckStep } from './overview/FinancePurchaseCheckStep'
import {
  FinanceExtraIncomeSection,
  type ReceitaCreditoQuando,
} from './FinanceExtraIncomeSection'

type LancamentoModo = 'imediato' | 'futuro'
type LancamentoTipo = 'despesa' | 'receita' | 'investimento'

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
  const cards = useTaskStore((s) => s.cards)
  const categories = useTaskStore((s) => s.categories)
  const transactions = useTaskStore((s) => s.transactions)
  const budgetLimits = useTaskStore((s) => s.budgetLimits)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const addTransaction = useTaskStore((s) => s.addTransaction)
  const removeCategory = useTaskStore((s) => s.removeCategory)
  const registerInteraction = useTaskStore((s) => s.registerInteraction)
  const { loading: checkLoading, verdict, iaAtiva, checkPurchase, reset: resetCheck } = useFinancePurchaseCheck()
  const mood = useMoodOrchestration()

  const [showCatModal, setShowCatModal] = useState(false)
  const [catModalParentId, setCatModalParentId] = useState<number | null>(null)
  const [modo, setModo] = useState<LancamentoModo>('imediato')
  const [phase, setPhase] = useState<'form' | 'axel'>('form')
  const [receitaCreditoQuando, setReceitaCreditoQuando] = useState<ReceitaCreditoQuando>('agora')
  const reservedBills = useTaskStore((s) => s.reservedBills)

  const [form, setForm] = useState({
    descricao: '',
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

  const handleRemoveCategory = async (id: number) =>
  {
    if (!confirm('Remover esta categoria?')) return
    await removeCategory(id)
    if (form.categoria_id === id)
    {
      setForm((f) => ({ ...f, categoria_id: '' }))
    }
    toast.success('Categoria removida')
  }

  if (!isOpen) return null

  const resetAndClose = () =>
  {
    setForm({
      descricao: '',
      valor: '',
      tipo: 'despesa',
      categoria_id: '',
      data: '',
      payment: DEFAULT_EXPENSE_PAYMENT,
      fatura_reserva_id: '',
    })
    setModo('imediato')
    setReceitaCreditoQuando('agora')
    setPhase('form')
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
    const val = parseFloat(form.valor.replace(',', '.'))
    if (!form.descricao.trim() || Number.isNaN(val) || val <= 0) return null
    return val
  }

  const needsAxelCheck = (): boolean =>
  {
    return form.tipo === 'despesa' && modo === 'imediato'
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

  const openCategories = (parentId: number | null = null) =>
  {
    setCatModalParentId(parentId)
    setShowCatModal(true)
  }

  const selectedCatLabel = formatCategoryPath(
    categories,
    form.categoria_id !== '' ? form.categoria_id : undefined,
  )

  const saveLabel = form.tipo === 'receita'
    ? 'receita'
    : form.tipo === 'investimento'
      ? 'investimento'
      : modo === 'futuro'
        ? 'conta futura'
        : 'gasto'

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={resetAndClose}
        aria-label="Fechar"
      />

      <div
        className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50 flex flex-col w-full sm:max-w-md max-h-[min(92vh,100dvh)] sm:max-h-none sm:h-full border border-line bg-card shadow-2xl rounded-t-sl sm:rounded-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="finance-tx-title"
      >
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-line">
          <div className="min-w-0 pr-2">
            <h3 id="finance-tx-title" className={`text-sm font-display uppercase tracking-wide ${AXEL_TEXT_PRIMARY}`}>
              Novo lançamento
            </h3>
            <p className={`text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              {TIPO_HINTS[form.tipo]}
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
              valor={parseFloat(form.valor.replace(',', '.'))}
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
          <div className="grid grid-cols-3 gap-1 p-1 rounded-sl border border-line bg-chrome/40">
            {(['despesa', 'receita', 'investimento'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`py-2 px-1 rounded-sl font-mono text-[9px] sm:text-[10px] uppercase ${
                  form.tipo === t ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
                }`}
              >
                {TIPO_LABELS[t]}
              </button>
            ))}
          </div>

          {form.tipo === 'despesa' && (
            <div className="space-y-1.5">
              <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Quando</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setModo('imediato')}
                  className={`py-2 px-2 rounded-sl font-mono text-[10px] uppercase ${
                    modo === 'imediato' ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
                  }`}
                >
                  Já gastei
                </button>
                <button
                  type="button"
                  onClick={() => setModo('futuro')}
                  className={`py-2 px-2 rounded-sl font-mono text-[10px] uppercase ${
                    modo === 'futuro' ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
                  }`}
                >
                  Conta futura
                </button>
              </div>
            </div>
          )}

          {form.tipo === 'receita' && (
            <div className={`flex items-start gap-2 rounded-sl border px-3 py-2 text-[10px] border-concluido/35 bg-concluido/10 text-concluido`}>
              <TrendingUp size={14} className="shrink-0 mt-0.5" />
              <span>
                {receitaCreditoQuando === 'proximo-mes'
                  ? 'Agendado para o próximo mês — ainda não entra no saldo de hoje.'
                  : 'Soma ao saldo da conta corrente agora.'}
              </span>
            </div>
          )}

          {form.tipo === 'receita' && (
            <FinanceExtraIncomeSection
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

          {form.tipo === 'investimento' && (
            <div className={`flex items-start gap-2 rounded-sl border px-3 py-2 text-[10px] border-accent/35 bg-accent/10 text-accent`}>
              <PiggyBank size={14} className="shrink-0 mt-0.5" />
              <span>Sai do caixa e vai para poupança/reserva — separado dos gastos do dia a dia.</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Descrição</label>
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
            <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Valor (R$)</label>
            <input
              inputMode="decimal"
              placeholder="0,00"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              className="w-full border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm font-mono text-ink outline-none focus:border-accent/50"
            />
          </div>

          {form.tipo === 'receita' && (
            <>
            <div className="space-y-2">
              <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Recebeu via</label>
              <PaymentMethodPicker
                cards={cards}
                value={form.payment}
                onChange={(payment) => setForm({ ...form, payment })}
                variant="receita"
              />
            </div>
            <div className="space-y-2">
              <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                Origem (opcional)
              </label>
              <CategoryPicker
                categories={categories}
                tipo="receita"
                value={form.categoria_id}
                onChange={(id) => setForm({ ...form, categoria_id: id })}
                compact
                onAddCategory={() => openCategories(null)}
                onRemoveCategory={(id) => void handleRemoveCategory(id)}
              />
            </div>
            </>
          )}

          {form.tipo === 'despesa' && (
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
                  onAddCategory={() => openCategories(null)}
                  onAddSubcategory={(parentId) => openCategories(parentId)}
                  onRemoveCategory={(id) => void handleRemoveCategory(id)}
                />
              </div>

              <div className="space-y-2">
                <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Pagar com</label>
                <PaymentMethodPicker
                  cards={cards}
                  value={form.payment}
                  onChange={(payment) => setForm({ ...form, payment })}
                  variant="despesa"
                />
                {isCardPaymentSelection(form.payment, cards) && modo === 'imediato' && (
                  <p className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                    Abate o limite do cartão — sincronizado com seus cartões cadastrados.
                  </p>
                )}
                {!isCardPaymentSelection(form.payment, cards) && form.payment === 'pix' && (
                  <p className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                    PIX — desconta da conta corrente na hora.
                  </p>
                )}
              </div>

              {openBills.length > 0 && (
                <div className="space-y-2">
                  <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                    Abater de fatura reservada (opcional)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, fatura_reserva_id: '' })}
                      className={`uppercase max-w-full truncate ${
                        form.fatura_reserva_id === '' ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
                      }`}
                    >
                      Nenhuma
                    </button>
                    {openBills.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setForm({ ...form, fatura_reserva_id: b.id })}
                        className={`uppercase max-w-full truncate ${
                          form.fatura_reserva_id === b.id ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
                        }`}
                      >
                        {b.titulo}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={`flex items-start gap-2 rounded-sl border px-3 py-2 text-[10px] ${
                modo === 'futuro'
                  ? 'border-atencao/35 bg-atencao/10 text-atencao'
                  : 'border-concluido/35 bg-concluido/10 text-concluido'
              }`}>
                {modo === 'futuro' ? <CalendarClock size={14} className="shrink-0" /> : <CheckCircle2 size={14} className="shrink-0" />}
                <span>
                  {modo === 'futuro'
                    ? 'Agendado — aparece em próximas contas.'
                    : isCardPaymentSelection(form.payment, cards)
                      ? 'Pago no cartão — abate a fatura.'
                      : 'Pago — desconta da conta corrente.'}
                  {form.fatura_reserva_id !== '' && ' · Valor abate da reserva da fatura.'}
                </span>
              </div>
            </>
          )}

          {form.tipo === 'investimento' && (
            <div className="space-y-2">
              <label className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                Destino (opcional)
              </label>
              <CategoryPicker
                categories={categories}
                value={form.categoria_id}
                onChange={(id) => setForm({ ...form, categoria_id: id })}
                compact
                onAddCategory={() => openCategories(null)}
                onRemoveCategory={(id) => void handleRemoveCategory(id)}
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
        </div>

        {phase === 'form' && (
        <div className="shrink-0 border-t border-line px-4 sm:px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] space-y-2">
          {needsAxelCheck() && (
            <button
              type="button"
              onClick={() => void runAxelCheck()}
              disabled={!form.descricao.trim() || !form.valor}
              className="w-full py-3 font-mono text-[11px] uppercase rounded-sl border border-accent/40 bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors disabled:opacity-40"
            >
              Perguntar ao Axel
            </button>
          )}
          <button
            type="button"
            onClick={() =>
            {
              if (needsAxelCheck())
              {
                void runAxelCheck()
              }
              else
              {
                void handleAdd()
              }
            }}
            disabled={!form.descricao.trim() || !form.valor}
            className={`w-full py-3 font-mono text-[11px] uppercase ${AXEL_BTN_PRIMARY} disabled:opacity-40`}
          >
            {needsAxelCheck() ? 'Salvar e consultar Axel' : `Salvar ${saveLabel}`}
          </button>
        </div>
        )}
      </div>

      {showCatModal && (
        <FinanceCategories
          defaultParentId={catModalParentId}
          onClose={() =>
          {
            setShowCatModal(false)
            setCatModalParentId(null)
          }}
        />
      )}
    </>
  )
}
