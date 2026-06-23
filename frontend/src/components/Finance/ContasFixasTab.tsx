import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Calendar, Receipt, AlertCircle } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { toast } from 'sonner'
import {
  contaFixaEfetivamenteAtiva,
  contaFixaPrazoLabel,
} from '../../lib/financeContaFixa'
import { FinanceCategoryIcon } from './financeCategoryIcons'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_FORM_SEG_ACTIVE,
  AXEL_FORM_SEG_IDLE,
  AXEL_ROW_HOVER,
  AXEL_SECTION_TITLE,
  AXEL_SEG_SHELL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const todayIso = () => new Date().toISOString().slice(0, 10)

function getDaysUntilDue(diaVencimento: number): number
{
  const today = new Date()
  const currentDay = today.getDate()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  let diff = diaVencimento - currentDay
  if (diff < 0) diff += daysInMonth
  return diff
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function ContasFixasTab()
{
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const categories = useTaskStore((s) => s.categories)
  const fetchContasFixas = useTaskStore((s) => s.fetchContasFixas)
  const addContaFixa = useTaskStore((s) => s.addContaFixa)
  const removeContaFixa = useTaskStore((s) => s.removeContaFixa)
  const toggleContaFixa = useTaskStore((s) => s.toggleContaFixa)
  const runFinanceCheck = useTaskStore((s) => s.runFinanceCheck)

  const despesaCats = useMemo(
    () => categories.filter((c) => c.tipo === 'despesa'),
    [categories],
  )

  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    valor: '',
    dia_vencimento: '10',
    categoria_id: '' as string,
    tipoPrazo: 'indeterminado' as 'indeterminado' | 'limitado',
    duracao_meses: '6',
    data_inicio: todayIso(),
  })

  useEffect(() =>
  {
    fetchContasFixas()
  }, [fetchContasFixas])

  const handleAddConta = async (e: React.FormEvent) =>
  {
    e.preventDefault()
    if (!form.nome.trim())
    {
      toast.error('Informe o nome da conta')
      return
    }
    const valorNum = parseFloat(form.valor)
    if (Number.isNaN(valorNum) || valorNum <= 0)
    {
      toast.error('Informe um valor válido maior que zero')
      return
    }
    const diaNum = parseInt(form.dia_vencimento, 10)
    if (Number.isNaN(diaNum) || diaNum < 1 || diaNum > 31)
    {
      toast.error('O dia de vencimento deve ser entre 1 e 31')
      return
    }

    const catId = form.categoria_id ? Number(form.categoria_id) : undefined
    const cat = catId ? despesaCats.find((c) => c.id === catId) : undefined
    const limitado = form.tipoPrazo === 'limitado'
    const meses = limitado ? parseInt(form.duracao_meses, 10) : null

    if (limitado && (Number.isNaN(meses!) || meses! <= 0))
    {
      toast.error('Informe quantos meses dura o contrato')
      return
    }

    await addContaFixa({
      nome: form.nome.trim(),
      valor: valorNum,
      dia_vencimento: diaNum,
      categoria: cat?.nome ?? 'outros',
      categoria_id: catId,
      duracao_meses: limitado ? meses : null,
      data_inicio: limitado ? form.data_inicio : null,
      ativa: true,
    })

    setForm({
      nome: '',
      valor: '',
      dia_vencimento: '10',
      categoria_id: '',
      tipoPrazo: 'indeterminado',
      duracao_meses: '6',
      data_inicio: todayIso(),
    })
    setShowAddForm(false)
    runFinanceCheck()
  }

  return (
    <div className="space-y-4">
      <div className="min-w-0">
        <h2 className={AXEL_SECTION_TITLE}>Contas fixas</h2>
        <p className={`text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
          Sem prazo = recorrente permanente · com prazo = contratos temporários
        </p>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
            aria-label="Fechar"
          />
          <form
            onSubmit={handleAddConta}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full sm:max-w-lg border border-line rounded-t-sl sm:rounded-sl bg-card shadow-2xl p-3 sm:p-4 space-y-4 max-h-[min(92vh,100dvh)] overflow-y-auto`}
          >
          <h3 className={`text-[12px] font-medium flex items-center gap-2 ${AXEL_TEXT_PRIMARY}`}>
            <Receipt className="w-4 h-4 text-accent" />
            Adicionar conta fixa
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Nome</span>
              <input
                type="text"
                placeholder="Aluguel, Netflix, Internet…"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm text-ink min-h-[44px]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Valor (R$)</span>
              <input
                type="number"
                step="0.01"
                placeholder="150.00"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className="w-full border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm font-mono text-ink min-h-[44px]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Dia vencimento</span>
              <input
                type="number"
                min={1}
                max={31}
                value={form.dia_vencimento}
                onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })}
                className="w-full border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm font-mono text-ink min-h-[44px]"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                Categoria de gasto (atalhos)
              </span>
              <select
                value={form.categoria_id}
                onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                className="w-full border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm text-ink min-h-[44px]"
              >
                <option value="">Sem vínculo</option>
                {despesaCats.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Duração</span>
            <div className={`grid grid-cols-2 gap-0.5 ${AXEL_SEG_SHELL}`}>
              {(['indeterminado', 'limitado'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, tipoPrazo: t })}
                  className={form.tipoPrazo === t ? AXEL_FORM_SEG_ACTIVE : AXEL_FORM_SEG_IDLE}
                >
                  {t === 'indeterminado' ? 'Sem prazo' : 'Com prazo'}
                </button>
              ))}
            </div>
            {form.tipoPrazo === 'limitado' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <label className="flex flex-col gap-1">
                  <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Meses</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={form.duracao_meses}
                    onChange={(e) => setForm({ ...form, duracao_meses: e.target.value })}
                    className="border border-line rounded-sl bg-chrome px-3 py-2 text-sm font-mono min-h-[44px]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Início</span>
                  <input
                    type="date"
                    value={form.data_inicio}
                    onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                    className="border border-line rounded-sl bg-chrome px-3 py-2 text-sm font-mono min-h-[44px]"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2.5 min-h-[44px] border border-line rounded-sl text-[11px] font-mono uppercase text-ink-muted hover:bg-chrome"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 min-h-[44px] font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}
            >
              Adicionar
            </button>
          </div>
          </form>
        </div>
      )}

      <section className={`${AXEL_BORDERLESS_PANEL} p-0 overflow-hidden`}>
        {contasFixas.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Receipt className="w-8 h-8 text-ink-muted mx-auto mb-2" />
            <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>Nenhuma conta fixa cadastrada</p>
            <p className={`text-[11px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
              Use o botão <strong className="text-ink">Nova recorrência</strong> abaixo.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {contasFixas.map((conta) =>
            {
              const efetiva = contaFixaEfetivamenteAtiva(conta)
              const daysUntil = getDaysUntilDue(conta.dia_vencimento)
              const prazoLabel = contaFixaPrazoLabel(conta)
              const catNome = conta.categoria_id
                ? despesaCats.find((c) => c.id === conta.categoria_id)?.nome ?? conta.categoria
                : conta.categoria
              const catMeta = conta.categoria_id
                ? despesaCats.find((c) => c.id === conta.categoria_id)
                : undefined
              const isClose = efetiva && daysUntil <= 3
              const isToday = efetiva && daysUntil === 0

              return (
                <li
                  key={conta.id}
                  className={`p-2.5 sm:p-3 space-y-2 ${!efetiva ? 'opacity-50' : ''} ${
                    isClose ? 'bg-urgente/5' : AXEL_ROW_HOVER
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-sl flex items-center justify-center border shrink-0 ${
                        isClose && !catMeta
                          ? 'border-urgente/30 bg-urgente/10 text-urgente'
                          : catMeta
                            ? 'border-line bg-card'
                            : 'border-line bg-chrome text-ink-muted'
                      }`}
                      style={catMeta ? { color: catMeta.cor } : undefined}
                    >
                      {catMeta ? (
                        <FinanceCategoryIcon name={catMeta.icone} className="w-3.5 h-3.5" />
                      ) : (
                        <Receipt className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[12px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                          {conta.nome}
                        </span>
                        {prazoLabel ? (
                          <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sl border border-accent/30 text-accent">
                            {prazoLabel}
                          </span>
                        ) : (
                          <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sl border border-line/60 text-ink-muted">
                            Permanente
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 font-mono text-[10px] text-ink-muted">
                        <span className="tabular-nums">{fmt(conta.valor)}</span>
                        <span className="inline-flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          Dia {conta.dia_vencimento}
                        </span>
                        {catNome && catNome !== conta.nome && (
                          <span className="truncate max-w-[6rem]">{catNome}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {efetiva && (
                        <>
                          {isToday ? (
                            <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-mono uppercase text-urgente">
                              <AlertCircle className="w-2.5 h-2.5" />
                              Hoje
                            </span>
                          ) : isClose ? (
                            <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-mono uppercase text-atencao">
                              {daysUntil}d
                            </span>
                          ) : (
                            <span className="hidden sm:inline text-[9px] font-mono text-ink-muted">
                              {daysUntil}d
                            </span>
                          )}
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                        {
                          toggleContaFixa(conta.id)
                          runFinanceCheck()
                        }}
                        className={`min-h-[32px] px-2 font-mono text-[9px] uppercase rounded-sl border ${
                          conta.ativa
                            ? 'border-line text-ink-muted hover:bg-chrome'
                            : 'border-concluido/30 text-concluido bg-concluido/10'
                        }`}
                      >
                        {conta.ativa ? 'Pausar' : 'Ativar'}
                      </button>
                      <button
                        type="button"
                        onClick={async () =>
                        {
                          if (confirm(`Excluir recorrência de "${conta.nome}"?`))
                          {
                            await removeContaFixa(conta.id)
                            runFinanceCheck()
                          }
                        }}
                        className="min-w-[32px] min-h-[32px] flex items-center justify-center text-ink-muted hover:text-urgente hover:bg-urgente/10 rounded-sl"
                        aria-label="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {!showAddForm && (
        <button
          type="button"
          onClick={() =>
          {
            setForm((f) => ({ ...f, data_inicio: todayIso() }))
            setShowAddForm(true)
          }}
          className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-3 z-40 inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 font-mono text-[10px] uppercase tracking-wide shadow-lg ${AXEL_BTN_PRIMARY}`}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova recorrência</span>
          <span className="sm:hidden">Novo</span>
        </button>
      )}
    </div>
  )
}
