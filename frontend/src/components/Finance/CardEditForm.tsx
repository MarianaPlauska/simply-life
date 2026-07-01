import { useState } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { CARD_CHIP_STYLES } from '../../lib/financeCardTheme'
import type { VirtualCard } from '../../store/storeTypes'
import { AXEL_BTN_PRIMARY } from '../../constants/axelSurfaces'

const GRADIENTS: VirtualCard['tipo_gradiente'][] = [
  'purple', 'obsidian', 'sunset', 'ocean', 'mint',
]

interface CardEditFormProps
{
  card: VirtualCard
  onDone: () => void
  onCancel: () => void
}

export function CardEditForm({ card, onDone, onCancel }: CardEditFormProps)
{
  const updateCardProfile = useTaskStore((s) => s.updateCardProfile)

  const [draft, setDraft] = useState({
    nome: card.nome,
    limite: String(card.limite),
    dia_fechamento: String(card.dia_fechamento ?? ''),
    dia_vencimento: String(card.dia_vencimento ?? ''),
    tipo_gradiente: card.tipo_gradiente,
  })

  const save = async () =>
  {
    const limite = parseFloat(draft.limite.replace(',', '.'))
    if (!draft.nome.trim() || Number.isNaN(limite) || limite <= 0)
    {
      toast.error('Nome e limite válidos são obrigatórios')
      return
    }

    await updateCardProfile(card.id, {
      nome: draft.nome.trim(),
      limite,
      dia_fechamento: draft.dia_fechamento
        ? parseInt(draft.dia_fechamento, 10) || undefined
        : undefined,
      dia_vencimento: draft.dia_vencimento
        ? parseInt(draft.dia_vencimento, 10) || undefined
        : undefined,
      tipo_gradiente: draft.tipo_gradiente,
    })
    toast.success('Cartão atualizado')
    onDone()
  }

  return (
    <div className="border border-line rounded-sl p-3 space-y-2 bg-chrome/30">
      <p className="font-mono text-[9px] uppercase text-ink-muted">Editar cartão</p>
      <input
        value={draft.nome}
        onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
        className="w-full border border-line rounded-sl bg-card px-3 py-2.5 text-sm min-h-[44px]"
        placeholder="Nome do cartão"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          inputMode="decimal"
          value={draft.limite}
          onChange={(e) => setDraft((d) => ({ ...d, limite: e.target.value }))}
          className="border border-line rounded-sl bg-card px-3 py-2.5 text-sm font-mono min-h-[44px]"
          placeholder="Limite R$"
        />
        <input
          inputMode="numeric"
          value={draft.dia_fechamento}
          onChange={(e) => setDraft((d) => ({ ...d, dia_fechamento: e.target.value }))}
          className="border border-line rounded-sl bg-card px-3 py-2.5 text-sm font-mono min-h-[44px]"
          placeholder="Fecha dia"
        />
      </div>
      <input
        inputMode="numeric"
        value={draft.dia_vencimento}
        onChange={(e) => setDraft((d) => ({ ...d, dia_vencimento: e.target.value }))}
        className="w-full border border-line rounded-sl bg-card px-3 py-2.5 text-sm font-mono min-h-[44px]"
        placeholder="Vence dia"
      />
      <div className="flex flex-wrap gap-1.5">
        {GRADIENTS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setDraft((d) => ({ ...d, tipo_gradiente: g }))}
            className={`w-9 h-9 rounded-full border-2 min-h-[44px] min-w-[44px] ${CARD_CHIP_STYLES[g].dot} ${
              draft.tipo_gradiente === g ? 'ring-2 ring-accent' : 'opacity-60'
            }`}
            aria-label={`Cor ${g}`}
          />
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => void save()}
          className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-2.5 min-h-[44px] text-[10px] uppercase font-mono ${AXEL_BTN_PRIMARY}`}
        >
          <Check className="w-3.5 h-3.5" />
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2.5 min-h-[44px] text-[10px] uppercase font-mono border border-line rounded-sl text-ink-muted"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
