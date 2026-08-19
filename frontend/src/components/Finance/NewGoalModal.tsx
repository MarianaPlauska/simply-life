import { useState } from 'react'
import { X } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { toast } from 'sonner'
import {
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { MoneyInput } from '../ui/MoneyInput'
import { parseMoneyInputToNumber } from '../../lib/currencyInput'

interface NewGoalModalProps
{
  isOpen: boolean
  onClose: () => void
}

const CORES = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export function NewGoalModal({ isOpen, onClose }: NewGoalModalProps)
{
  const addGoal = useTaskStore((s) => s.addGoal)
  const [goalForm, setGoalForm] = useState({
    titulo: '',
    valor_alvo: '',
    prazo: '',
    icone: 'Target',
    cor: '#8b5cf6',
  })

  if (!isOpen) return null

  const handleAddGoal = async () =>
  {
    const valorAlvo = parseMoneyInputToNumber(goalForm.valor_alvo)
    if (!goalForm.titulo.trim() || valorAlvo <= 0) return

    await addGoal({
      titulo: goalForm.titulo,
      valor_alvo: valorAlvo,
      valor_atual: 0,
      prazo: goalForm.prazo || undefined,
      icone: goalForm.icone,
      cor: goalForm.cor,
      concluida: false,
    })

    setGoalForm({ titulo: '', valor_alvo: '', prazo: '', icone: 'Target', cor: '#8b5cf6' })
    onClose()
    toast.success('Meta criada!')
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-line rounded-sl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className={`text-[15px] font-semibold ${AXEL_TEXT_PRIMARY}`}>Nova meta</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-chrome rounded-sl transition-colors"
          >
            <X className="w-4 h-4 text-ink-muted" />
          </button>
        </div>

        <div>
          <label className={`block text-[11px] font-mono uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
            Título
          </label>
          <input
            type="text"
            placeholder="Ex: Viagem Japão, reserva de emergência…"
            value={goalForm.titulo}
            onChange={(e) => setGoalForm({ ...goalForm, titulo: e.target.value })}
            className="w-full bg-chrome border border-line rounded-sl px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted outline-none focus:border-accent/50 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-[11px] font-mono uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
              Valor alvo (R$)
            </label>
            <MoneyInput
              value={goalForm.valor_alvo}
              onChange={(v) => setGoalForm({ ...goalForm, valor_alvo: v })}
              className="w-full text-[13px]"
            />
          </div>
          <div>
            <label className={`block text-[11px] font-mono uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
              Prazo (opcional)
            </label>
            <input
              type="date"
              value={goalForm.prazo}
              onChange={(e) => setGoalForm({ ...goalForm, prazo: e.target.value })}
              className="w-full bg-chrome border border-line rounded-sl px-4 py-2.5 text-[13px] text-ink font-mono outline-none focus:border-accent/50 transition"
            />
          </div>
        </div>

        <div>
          <label className={`block text-[11px] font-mono uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
            Cor
          </label>
          <div className="flex flex-wrap gap-2">
            {CORES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setGoalForm({ ...goalForm, cor: c })}
                className={`w-7 h-7 rounded-full border-2 ${
                  goalForm.cor === c ? 'border-accent' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddGoal}
          disabled={!goalForm.titulo.trim() || parseMoneyInputToNumber(goalForm.valor_alvo) <= 0}
          className={`w-full py-2.5 rounded-sl text-[13px] font-medium disabled:opacity-40 ${AXEL_BTN_PRIMARY}`}
        >
          Criar meta
        </button>
      </div>
    </div>
  )
}
