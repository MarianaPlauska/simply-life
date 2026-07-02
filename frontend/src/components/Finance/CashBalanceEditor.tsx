import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface BalanceFields
{
  disponivel: string
  corrente: string
  reservado: string
  projetado: string
}

interface CashBalanceEditorProps
{
  open: boolean
  onClose: () => void
  computed: {
    disponivel: number
    corrente: number
    reservado: number
    projetado: number
  }
  manualActive: boolean
  onSaveManual: (fields: {
    disponivel: number
    corrente: number
    reservado: number
    projetado: number
  }) => Promise<void>
  onClearManual: () => Promise<void>
}

function fieldsFromNumbers(values: {
  disponivel: number
  corrente: number
  reservado: number
  projetado: number
}): BalanceFields
{
  return {
    disponivel: String(values.disponivel),
    corrente: String(values.corrente),
    reservado: String(values.reservado),
    projetado: String(values.projetado),
  }
}

function parseField(value: string, label: string): number | null
{
  const n = parseFloat(value.replace(/\./g, '').replace(',', '.'))
  if (Number.isNaN(n))
  {
    toast.error(`${label}: valor inválido`)
    return null
  }
  return n
}

export function CashBalanceEditor({
  open,
  onClose,
  computed,
  manualActive,
  onSaveManual,
  onClearManual,
}: CashBalanceEditorProps)
{
  const [fields, setFields] = useState<BalanceFields>(() => fieldsFromNumbers(computed))
  const [saving, setSaving] = useState(false)

  useEffect(() =>
  {
    if (open)
    {
      setFields(fieldsFromNumbers(computed))
    }
  }, [open, computed])

  if (!open) return null

  const setField = (key: keyof BalanceFields, value: string) =>
  {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  const useComputed = () =>
  {
    setFields(fieldsFromNumbers(computed))
  }

  const save = async () =>
  {
    const disponivel = parseField(fields.disponivel, 'Disponível')
    const corrente = parseField(fields.corrente, 'Corrente')
    const reservado = parseField(fields.reservado, 'Reservado')
    const projetado = parseField(fields.projetado, 'Projetado livre')
    if (disponivel == null || corrente == null || reservado == null || projetado == null) return

    setSaving(true)
    try
    {
      await onSaveManual({ disponivel, corrente, reservado, projetado })
      onClose()
    }
    finally
    {
      setSaving(false)
    }
  }

  const clearManual = async () =>
  {
    setSaving(true)
    try
    {
      await onClearManual()
      onClose()
    }
    finally
    {
      setSaving(false)
    }
  }

  const rows: Array<{ key: keyof BalanceFields; label: string; hint?: string }> = [
    { key: 'disponivel', label: 'Disponível', hint: 'O que você vê no app do banco hoje' },
    { key: 'corrente', label: 'Corrente', hint: 'Saldo bruto antes das reservas' },
    { key: 'reservado', label: 'Reservado', hint: 'Valor separado para faturas futuras' },
    { key: 'projetado', label: 'Projetado livre', hint: 'Após fixas e agendados do mês' },
  ]

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md rounded-t-sl sm:rounded-sl border border-line bg-card shadow-xl max-h-[min(92dvh,640px)] overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-[1] flex items-start justify-between gap-2 px-4 py-3 border-b border-line bg-card/95 backdrop-blur-sm">
          <div>
            <p className={`text-[14px] font-semibold ${AXEL_TEXT_PRIMARY}`}>Ajustar saldos</p>
            <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              Informe os valores reais da sua conta. O app fixa estes números até você voltar ao automático.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome/60 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fechar editor"
          >
            <X size={16} />
          </button>
        </header>

        <div className="px-4 py-3 space-y-3">
          {rows.map(({ key, label, hint }) => (
            <label key={key} className="block space-y-1">
              <span className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
                {label}
              </span>
              {hint && (
                <span className={`block text-[10px] ${AXEL_TEXT_SECONDARY}`}>{hint}</span>
              )}
              <input
                inputMode="decimal"
                value={fields[key]}
                onChange={(e) => setField(key, e.target.value)}
                className="w-full border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm font-mono tabular-nums min-h-[44px] text-ink"
              />
              <span className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
                Calculado agora: {fmt(computed[key])}
              </span>
            </label>
          ))}

          <button
            type="button"
            onClick={useComputed}
            className="font-mono text-[9px] uppercase text-accent hover:underline min-h-[36px]"
          >
            Preencher com valores calculados
          </button>
        </div>

        <footer className="sticky bottom-0 flex flex-col sm:flex-row gap-2 px-4 py-3 border-t border-line bg-card/95 backdrop-blur-sm">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className={`flex-1 min-h-[44px] font-mono text-[10px] uppercase px-4 py-2.5 ${AXEL_BTN_PRIMARY} disabled:opacity-50`}
          >
            {saving ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                <Loader2 size={12} className="animate-spin" aria-hidden />
                Salvando…
              </span>
            ) : (
              'Fixar estes valores'
            )}
          </button>
          {manualActive && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void clearManual()}
              className="min-h-[44px] font-mono text-[10px] uppercase px-4 py-2.5 border border-line rounded-sl text-ink-muted hover:text-urgente disabled:opacity-50"
            >
              Voltar ao automático
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
