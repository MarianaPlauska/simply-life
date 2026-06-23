import { useState, useEffect } from 'react'
import { X, CreditCard } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import type { CardModalidade, VirtualCard } from '../../store/storeTypes'
import { toast } from 'sonner'
import {
  CARD_MODALIDADE_OPTIONS,
  cardTemCicloFatura,
} from '../../lib/financeCardModalidade'
import {
  AXEL_BTN_PRIMARY,
  AXEL_FORM_SEG_ACTIVE,
  AXEL_FORM_SEG_IDLE,
  AXEL_SEG_SHELL,
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
  const titularPadrao = useTaskStore((s) => s.userProfile.nome?.trim().toUpperCase() ?? '')

  const [form, setForm] = useState({
    nome: '',
    titular: titularPadrao,
    modalidade: 'credito' as CardModalidade,
    tipo_gradiente: 'obsidian' as VirtualCard['tipo_gradiente'],
    bandeira: 'mastercard' as 'visa' | 'mastercard',
    limite: '5000',
    dia_fechamento: '5',
    dia_vencimento: '12',
  })

  const temFatura = cardTemCicloFatura(form.modalidade)
  const mostraBandeira = form.modalidade === 'credito' || form.modalidade === 'debito'

  useEffect(() =>
  {
    if (!titularPadrao) return
    setForm((f) => (f.titular.trim() ? f : { ...f, titular: titularPadrao }))
  }, [titularPadrao])

  const setModalidade = (modalidade: CardModalidade) =>
  {
    const opt = CARD_MODALIDADE_OPTIONS.find((o) => o.id === modalidade)
    setForm((f) => ({
      ...f,
      modalidade,
      nome: f.nome.trim() ? f.nome : (opt?.nomeSugerido ?? ''),
    }))
  }

  const handleAddCard = async (e: React.FormEvent) =>
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

    const ok = await addCard({
      nome: form.nome.trim(),
      titular: form.titular.toUpperCase(),
      numero: mockNumber,
      validade: `${expiryMonth}/${expiryYear}`,
      cvv: String(Math.floor(100 + Math.random() * 900)),
      limite: parseFloat(form.limite) || 5000,
      dia_fechamento: temFatura ? (parseInt(form.dia_fechamento, 10) || 5) : undefined,
      dia_vencimento: temFatura ? (parseInt(form.dia_vencimento, 10) || 12) : undefined,
      modalidade: form.modalidade,
      tipo_gradiente: form.tipo_gradiente,
      bandeira: form.bandeira,
      status: 'ativo',
    })

    if (!ok)
    {
      toast.error('Não foi possível cadastrar o cartão')
      return
    }

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

      <div className="space-y-1.5">
        <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Tipo</span>
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-0.5 ${AXEL_SEG_SHELL}`}>
          {CARD_MODALIDADE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setModalidade(opt.id)}
              className={form.modalidade === opt.id ? AXEL_FORM_SEG_ACTIVE : AXEL_FORM_SEG_IDLE}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Apelido</span>
          <input
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder={
              form.modalidade === 'vr'
                ? 'VR, Alelo, Sodexo…'
                : form.modalidade === 'alimentacao'
                  ? 'iFood Benefícios, Flash…'
                  : 'Nubank, Inter, Itaú…'
            }
            className="border border-line rounded-sl bg-chrome px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            {form.modalidade === 'credito' ? 'Limite (R$)' : 'Saldo / limite (R$)'}
          </span>
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
        {temFatura && (
          <>
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
          </>
        )}
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
        {mostraBandeira && (
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
        )}
      </div>

      <button type="submit" className={`w-full py-2.5 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}>
        {form.modalidade === 'credito' ? 'Cadastrar cartão' : 'Cadastrar'}
      </button>
    </form>
  )
}
