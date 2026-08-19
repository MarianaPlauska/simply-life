import { useState } from 'react'
import { Calendar, Plus, Trash2, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../../store/useTaskStore'
import { CategoryPicker } from '../CategoryPicker'
import { FinanceCategories } from '../FinanceCategories'
import { FormFieldLabel } from '../../ui/FormFieldLabel'
import { MoneyInput } from '../../ui/MoneyInput'
import { parseMoneyInputToNumber } from '../../../lib/currencyInput'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'
import type { Category } from '../../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceRecurringIncomePanelProps
{
  activeCategories: Category[]
}

export function FinanceRecurringIncomePanel({ activeCategories }: FinanceRecurringIncomePanelProps)
{
  const recurringIncomes = useTaskStore((s) => s.recurringIncomes)
  const addRecurringIncome = useTaskStore((s) => s.addRecurringIncome)
  const removeRecurringIncome = useTaskStore((s) => s.removeRecurringIncome)
  const toggleRecurringIncome = useTaskStore((s) => s.toggleRecurringIncome)

  const [showForm, setShowForm] = useState(false)
  const [showCatModal, setShowCatModal] = useState(false)
  const [pinVersion, setPinVersion] = useState(0)
  const [form, setForm] = useState({
    titulo: '',
    valor: '',
    dia_recebimento: '5',
    categoria_id: '' as number | '',
  })

  const totalAtivo = recurringIncomes
    .filter((r) => r.ativa)
    .reduce((s, r) => s + r.valor, 0)

  const handleSubmit = async (e: React.FormEvent) =>
  {
    e.preventDefault()
    if (!form.titulo.trim())
    {
      toast.error('Informe o título da receita')
      return
    }

    const valor = parseMoneyInputToNumber(form.valor)
    if (Number.isNaN(valor) || valor <= 0)
    {
      toast.error('Informe um valor válido')
      return
    }

    const dia = parseInt(form.dia_recebimento, 10)
    if (Number.isNaN(dia) || dia < 1 || dia > 31)
    {
      toast.error('Dia de recebimento entre 1 e 31')
      return
    }

    await addRecurringIncome({
      titulo: form.titulo.trim(),
      valor,
      dia_recebimento: dia,
      categoria_id: form.categoria_id !== '' ? form.categoria_id : undefined,
      ativa: true,
    })

    setForm({ titulo: '', valor: '', dia_recebimento: '5', categoria_id: '' })
    setShowForm(false)
    toast.success('Receita recorrente adicionada')
  }

  return (
    <section className={AXEL_BORDERLESS_PANEL}>
      {showCatModal && (
        <FinanceCategories
          defaultTipo="receita"
          pinTipo="receita"
          onCategoryCreated={(cat) =>
          {
            setForm((f) => ({ ...f, categoria_id: cat.id }))
            setPinVersion((v) => v + 1)
          }}
          onClose={() =>
          {
            setShowCatModal(false)
            setPinVersion((v) => v + 1)
          }}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-line">
        <div>
          <h2 className={AXEL_SECTION_TITLE}>Receitas recorrentes</h2>
          <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Salário, freelance — alimentam a projeção de caixa
          </p>
        </div>
        <div className="text-right">
          <p className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>Total ativo</p>
          <p className="text-lg font-display tabular-nums text-concluido">{fmt(totalAtivo)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {recurringIncomes.length === 0 && !showForm && (
          <p className={`text-[12px] py-4 text-center ${AXEL_TEXT_SECONDARY}`}>
            Cadastre salário ou outras entradas fixas para melhorar a previsão.
          </p>
        )}

        {recurringIncomes.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-sl border border-transparent hover:border-line hover:bg-chrome/40 transition-colors ${
              !item.ativa ? 'opacity-50' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-sl bg-concluido/10 border border-concluido/25 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-concluido" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[12px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>{item.titulo}</p>
              <p className={`text-[10px] font-mono flex items-center gap-1 ${AXEL_TEXT_SECONDARY}`}>
                <Calendar className="w-3 h-3" />
                dia {item.dia_recebimento}
              </p>
            </div>
            <span className="font-mono text-[12px] tabular-nums text-concluido shrink-0">
              {fmt(item.valor)}
            </span>
            <button
              type="button"
              onClick={() => toggleRecurringIncome(item.id)}
              className={`text-[9px] font-mono uppercase px-2 py-1 rounded-sl border ${
                item.ativa
                  ? 'border-line text-ink-muted hover:text-ink'
                  : 'border-accent/40 text-accent bg-accent-muted'
              }`}
            >
              {item.ativa ? 'Pausar' : 'Ativar'}
            </button>
            <button
              type="button"
              onClick={() => removeRecurringIncome(item.id)}
              className="p-1.5 rounded-sl hover:bg-urgente/10 text-ink-muted hover:text-urgente"
              aria-label="Remover receita"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-line space-y-3">
          <label className="block space-y-1">
            <FormFieldLabel required className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
              Título
            </FormFieldLabel>
            <input
              type="text"
              placeholder="Ex.: Salário CLT"
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              className="w-full bg-chrome border border-line rounded-sl px-3 py-2 text-[12px] text-ink outline-none focus:border-accent/50"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <FormFieldLabel required className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                Valor (R$)
              </FormFieldLabel>
              <MoneyInput
                value={form.valor}
                onChange={(v) => setForm((f) => ({ ...f, valor: v }))}
                className="w-full text-[12px]"
              />
            </label>
            <label className="block space-y-1">
              <FormFieldLabel required className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                Dia
              </FormFieldLabel>
              <input
                type="number"
                min={1}
                max={31}
                value={form.dia_recebimento}
                onChange={(e) => setForm((f) => ({ ...f, dia_recebimento: e.target.value }))}
                className="w-full bg-chrome border border-line rounded-sl px-3 py-2 text-[12px] font-mono text-ink outline-none focus:border-accent/50"
              />
            </label>
          </div>
          <div className="space-y-1">
            <FormFieldLabel optional className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
              Origem / categoria
            </FormFieldLabel>
            <CategoryPicker
              categories={activeCategories}
              tipo="receita"
              value={form.categoria_id}
              onChange={(id) => setForm((f) => ({ ...f, categoria_id: id }))}
              pinVersion={pinVersion}
              onAddCategory={() => setShowCatModal(true)}
              onManageCategories={() => setShowCatModal(true)}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-sl bg-accent hover:bg-accent-hover text-white text-[11px] font-mono uppercase"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-sl border border-line text-[11px] font-mono uppercase text-ink-muted hover:bg-chrome"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-sl border border-dashed border-line text-[11px] font-mono uppercase text-ink-muted hover:text-accent hover:border-accent/40 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova receita recorrente
        </button>
      )}
    </section>
  )
}
