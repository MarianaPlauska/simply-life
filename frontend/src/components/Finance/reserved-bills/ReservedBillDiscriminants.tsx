import { useState } from 'react'
import { AlertTriangle, Flag, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  formatParcelaLabel,
  resolveBillItemHighlight,
} from '../../../lib/financeBillItems'
import {
  AXEL_BTN_PRIMARY,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'
import { MoneyInput } from '../../ui/MoneyInput'
import { parseMoneyInputToNumber } from '../../../lib/currencyInput'
import type { ReservedBill, ReservedBillItem } from '../../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const ITEM_STYLE: Record<string, { row: string; text: string }> = {
  erro: {
    row: 'border-urgente/15 bg-urgente/[0.04]',
    text: 'text-urgente/80',
  },
  acabando: {
    row: 'border-atencao/15 bg-atencao/[0.04]',
    text: 'text-atencao/80',
  },
  ultima: {
    row: 'border-line bg-chrome/30',
    text: 'text-ink-muted',
  },
}

interface ReservedBillDiscriminantsProps
{
  bill: ReservedBill
  items: ReservedBillItem[]
  onAddItem: (billId: number, payload: Omit<ReservedBillItem, 'id' | 'fatura_reserva_id'>) => Promise<void>
  onRemoveItem: (id: number) => Promise<void>
  compact?: boolean
}

export function ReservedBillDiscriminants({
  bill,
  items,
  onAddItem,
  onRemoveItem,
  compact = false,
}: ReservedBillDiscriminantsProps)
{
  const [showForm, setShowForm] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [parcelaAtual, setParcelaAtual] = useState('')
  const [parcelaTotal, setParcelaTotal] = useState('')
  const [marcarErro, setMarcarErro] = useState(false)

  const resetForm = () =>
  {
    setDescricao('')
    setValor('')
    setParcelaAtual('')
    setParcelaTotal('')
    setMarcarErro(false)
    setShowForm(false)
  }

  const handleAdd = async () =>
  {
    const v = parseMoneyInputToNumber(valor)
    if (!descricao.trim() || Number.isNaN(v) || v <= 0)
    {
      toast.error('Informe descrição e valor')
      return
    }

    const pa = parcelaAtual ? parseInt(parcelaAtual, 10) : undefined
    const pt = parcelaTotal ? parseInt(parcelaTotal, 10) : undefined

    await onAddItem(bill.id, {
      descricao: descricao.trim(),
      valor: v,
      parcela_atual: pa,
      parcela_total: pt,
      destaque: marcarErro ? 'erro' : null,
    })

    resetForm()
    toast.success('Item adicionado à fatura')
  }

  return (
    <div className={compact ? 'space-y-2' : 'mt-3 border-t border-line pt-3 space-y-2'}>
      <div className="flex items-center justify-between gap-2">
        <p className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>
          Discriminantes
        </p>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-accent hover:underline"
        >
          <Plus size={11} />
          Item
        </button>
      </div>

      {items.length === 0 && !showForm && (
        <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
          Lance gastos vinculados ou adicione parcelas
        </p>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-line border border-line rounded-sl overflow-hidden">
          {items.map((item) =>
          {
            const highlight = resolveBillItemHighlight(item)
            const parcela = formatParcelaLabel(item)
            const tone = highlight ? ITEM_STYLE[highlight] : null

            return (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-3 px-3 py-2 ${tone?.row ?? 'bg-chrome/25'} ${AXEL_ROW_HOVER}`}
              >
                <div className="min-w-0 flex items-center gap-2">
                  {highlight === 'erro' && <Flag size={13} className="text-urgente shrink-0" />}
                  {highlight === 'acabando' && <AlertTriangle size={13} className="text-atencao shrink-0" />}
                  <div className="min-w-0">
                    <p className={`text-[12px] sm:text-sm truncate ${AXEL_TEXT_PRIMARY}`}>
                      {item.descricao}
                    </p>
                    <p className={`font-mono text-[10px] ${tone?.text ?? AXEL_TEXT_SECONDARY}`}>
                      {parcela && `Parcela ${parcela}`}
                      {parcela && highlight === 'ultima' && ' · última'}
                      {parcela && highlight === 'acabando' && ' · acabando'}
                      {highlight === 'erro' && (parcela ? ' · ' : '') + 'Gasto atípico'}
                      {!parcela && !highlight && (item.despesa_id ? 'Lançamento' : 'Manual')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-sm tabular-nums font-medium">{fmt(item.valor)}</span>
                  {!item.despesa_id && (
                    <button
                      type="button"
                      onClick={() => void onRemoveItem(item.id)}
                      className="p-1 text-ink-muted hover:text-urgente"
                      aria-label="Remover item"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {showForm && (
        <div className="border border-line rounded-sl bg-chrome/30 p-3 space-y-2">
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Netflix, IPVA parcela..."
            className="w-full border border-line rounded-sl bg-card px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-3 gap-2">
            <MoneyInput
              value={valor}
              onChange={setValor}
              placeholder="Valor"
              className="text-sm"
            />
            <input
              inputMode="numeric"
              value={parcelaAtual}
              onChange={(e) => setParcelaAtual(e.target.value)}
              placeholder="Parc. atual"
              className="border border-line rounded-sl bg-card px-2 py-2 text-sm font-mono"
            />
            <input
              inputMode="numeric"
              value={parcelaTotal}
              onChange={(e) => setParcelaTotal(e.target.value)}
              placeholder="Total"
              className="border border-line rounded-sl bg-card px-2 py-2 text-sm font-mono"
            />
          </div>
          <label className="flex items-center gap-2 text-[11px] text-ink-muted cursor-pointer">
            <input
              type="checkbox"
              checked={marcarErro}
              onChange={(e) => setMarcarErro(e.target.checked)}
              className="rounded border-line"
            />
            Gasto errado / fora do esperado
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleAdd()}
              className={`flex-1 py-2 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}
            >
              Salvar item
            </button>
            <button type="button" onClick={resetForm} className="px-2 text-ink-muted">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
