import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar, Receipt, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { toast } from 'sonner'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_ROW_HOVER,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

function getDaysUntilDue(diaVencimento: number): number
{
  const today = new Date()
  const currentDay = today.getDate()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  let diff = diaVencimento - currentDay
  if (diff < 0) diff += daysInMonth
  return diff
}

const CATEGORIAS = [
  { id: 'aluguel', label: 'Aluguel & Moradia' },
  { id: 'luz', label: 'Energia & Água' },
  { id: 'internet', label: 'Internet & Telefone' },
  { id: 'assinaturas', label: 'Assinaturas & SaaS' },
  { id: 'outros', label: 'Outros' },
] as const

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function ContasFixasTab()
{
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const fetchContasFixas = useTaskStore((s) => s.fetchContasFixas)
  const addContaFixa = useTaskStore((s) => s.addContaFixa)
  const removeContaFixa = useTaskStore((s) => s.removeContaFixa)
  const toggleContaFixa = useTaskStore((s) => s.toggleContaFixa)
  const runFinanceCheck = useTaskStore((s) => s.runFinanceCheck)

  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    valor: '',
    dia_vencimento: '10',
    categoria: 'outros',
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

    await addContaFixa({
      nome: form.nome.trim(),
      valor: valorNum,
      dia_vencimento: diaNum,
      categoria: form.categoria,
      ativa: true,
    })

    setForm({ nome: '', valor: '', dia_vencimento: '10', categoria: 'outros' })
    setShowAddForm(false)
    runFinanceCheck()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className={AXEL_SECTION_TITLE}>Contas fixas</h2>
          <p className={`text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
            Recorrentes monitoradas — alertas automáticos de vencimento
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 font-mono text-[10px] uppercase w-full sm:w-auto ${AXEL_BTN_PRIMARY}`}
        >
          <Plus className="w-3.5 h-3.5" />
          Nova recorrência
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddConta} className={`${AXEL_BORDERLESS_PANEL} space-y-4`}>
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
              <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Categoria</span>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm text-ink min-h-[44px]"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>
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
      )}

      <section className={`${AXEL_BORDERLESS_PANEL} p-0 overflow-hidden`}>
        {contasFixas.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Receipt className="w-8 h-8 text-ink-muted mx-auto mb-2" />
            <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>Nenhuma conta fixa cadastrada</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-2 font-mono text-[10px] uppercase text-accent hover:underline min-h-[44px] px-4"
            >
              Cadastrar primeira conta
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {contasFixas.map((conta) =>
            {
              const daysUntil = getDaysUntilDue(conta.dia_vencimento)
              const catLabel = CATEGORIAS.find((c) => c.id === conta.categoria)?.label ?? 'Outros'
              const isClose = conta.ativa && daysUntil <= 3
              const isToday = conta.ativa && daysUntil === 0

              return (
                <li
                  key={conta.id}
                  className={`p-3 sm:p-4 space-y-3 ${!conta.ativa ? 'opacity-50' : ''} ${
                    isClose ? 'bg-urgente/5' : AXEL_ROW_HOVER
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-sl flex items-center justify-center border shrink-0 ${
                      isClose ? 'border-urgente/30 bg-urgente/10 text-urgente' : 'border-line bg-chrome text-ink-muted'
                    }`}
                    >
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[13px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                          {conta.nome}
                        </span>
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sl border border-line text-ink-muted">
                          {catLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 font-mono text-[11px] text-ink-muted">
                        <span className="tabular-nums">{fmt(conta.valor)}</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Dia {conta.dia_vencimento}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    {conta.ativa && (
                      <div>
                        {isToday ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-urgente bg-urgente/10 border border-urgente/25 px-2 py-1 rounded-sl">
                            <AlertCircle className="w-3 h-3" />
                            Vence hoje
                          </span>
                        ) : isClose ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-atencao bg-atencao/10 border border-atencao/25 px-2 py-1 rounded-sl">
                            <AlertCircle className="w-3 h-3" />
                            Vence em {daysUntil}d
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-ink-muted">
                            <CheckCircle2 className="w-3 h-3 text-concluido" />
                            Próximo em {daysUntil} dias
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 sm:ml-auto">
                      <button
                        type="button"
                        onClick={() =>
                        {
                          toggleContaFixa(conta.id)
                          runFinanceCheck()
                        }}
                        className={`min-h-[40px] px-3 font-mono text-[10px] uppercase rounded-sl border ${
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
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center text-ink-muted hover:text-urgente hover:bg-urgente/10 rounded-sl"
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
    </div>
  )
}
