import { useState } from 'react'
import { X, CreditCard } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import type { VirtualCard } from '../../store/storeTypes'
import { toast } from 'sonner'
import {
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface AddCardFormProps
{
  onClose: () => void
}

const GRADIENT_OPTIONS: VirtualCard['tipo_gradiente'][] = [
  'purple', 'obsidian', 'sunset', 'ocean', 'mint',
]

export function AddCardForm({ onClose }: AddCardFormProps)
{
  const addCard = useTaskStore((s) => s.addCard)

  const [form, setForm] = useState({
    nome: '',
    titular: 'MARIANA PLAUSKA',
    tipo_gradiente: 'obsidian' as VirtualCard['tipo_gradiente'],
    bandeira: 'mastercard' as 'visa' | 'mastercard',
    limite: '5000',
    dia_fechamento: '5',
    dia_vencimento: '12',
  })

  const handleAddCard = (e: React.FormEvent) =>
  {
    e.preventDefault()
    if (!form.nome.trim())
    {
      toast.error('Informe um nome para o cartão')
      return
    }

    const lastDigits = Math.floor(1000 + Math.random() * 9000)
    const mockNumber = `•••• •••• •••• ${lastDigits}`
    const expiryMonth = String(new Date().getMonth() + 1).padStart(2, '0')
    const expiryYear = String(new Date().getFullYear() + 4).slice(-2)

    addCard({
      nome: form.nome.trim(),
      titular: form.titular.toUpperCase(),
      numero: mockNumber,
      validade: `${expiryMonth}/${expiryYear}`,
      cvv: String(Math.floor(100 + Math.random() * 900)),
      limite: parseFloat(form.limite) || 5000,
      dia_fechamento: parseInt(form.dia_fechamento, 10) || 5,
      dia_vencimento: parseInt(form.dia_vencimento, 10) || 12,
      tipo_gradiente: form.tipo_gradiente,
      bandeira: form.bandeira,
      status: 'ativo',
    })

    onClose()
    toast.success('Cartão cadastrado')
  }

  return (
    <form
      onSubmit={handleAddCard}
      className="border border-line rounded-sl bg-card p-4 space-y-4 w-full max-w-xl"
    >
      <div className="flex items-center justify-between border-b border-line pb-2">
        <h3 className={`font-mono text-[10px] uppercase tracking-wide flex items-center gap-2 ${AXEL_TEXT_SECONDARY}`}>
          <CreditCard size={14} className="text-accent" />
          Novo cartão
        </h3>
        <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink p-1">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Apelido</span>
          <input
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Nubank, Inter, Itaú..."
            className="border border-line rounded-sl bg-chrome px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Limite (R$)</span>
          <input
            type="number"
            value={form.limite}
            onChange={(e) => setForm({ ...form, limite: e.target.value })}
            className="border border-line rounded-sl bg-chrome px-3 py-2 text-sm font-mono text-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Titular</span>
          <input
            value={form.titular}
            onChange={(e) => setForm({ ...form, titular: e.target.value })}
            className="border border-line rounded-sl bg-chrome px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Dia fechamento</span>
          <input
            type="number"
            min={1}
            max={28}
            value={form.dia_fechamento}
            onChange={(e) => setForm({ ...form, dia_fechamento: e.target.value })}
            className="border border-line rounded-sl bg-chrome px-3 py-2 text-sm font-mono text-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Dia vencimento</span>
          <input
            type="number"
            min={1}
            max={28}
            value={form.dia_vencimento}
            onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })}
            className="border border-line rounded-sl bg-chrome px-3 py-2 text-sm font-mono text-ink"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5">
          {GRADIENT_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setForm({ ...form, tipo_gradiente: g })}
              className={`w-7 h-7 rounded-sl border ${
                form.tipo_gradiente === g ? 'border-accent ring-1 ring-accent/40' : 'border-line'
              }`}
              style={{
                background: g === 'purple' ? '#4c1d95' :
                  g === 'obsidian' ? '#27272a' :
                  g === 'sunset' ? '#9f1239' :
                  g === 'ocean' ? '#1e40af' : '#065f46',
              }}
              aria-label={g}
            />
          ))}
        </div>
        <div className="flex gap-1.5 ml-auto">
          {(['visa', 'mastercard'] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setForm({ ...form, bandeira: b })}
              className={`px-2.5 py-1 rounded-sl font-mono text-[10px] uppercase border ${
                form.bandeira === b
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-line text-ink-muted'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className={`w-full py-2.5 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}>
        Cadastrar cartão
      </button>
    </form>
  )
}
