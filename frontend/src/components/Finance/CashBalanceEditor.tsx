import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { MoneyInput } from '../ui/MoneyInput'
import { formatCentsToBrl, parseMoneyInputToNumber } from '../../lib/currencyInput'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface BalanceFields
{
  disponivel: string
  projetado: string
}

interface CashBalanceEditorProps
{
  open: boolean
  onClose: () => void
  computed: {
    disponivel: number
    reservado: number
    projetado: number
  }
  manualActive: boolean
  onSaveManual: (fields: {
    disponivel: number
    reservado: number
    projetado: number
    corrente?: number
  }) => Promise<void>
  onClearManual: () => Promise<void>
}

function fieldsFromNumbers(values: {
  disponivel: number
  projetado: number
}): BalanceFields
{
  return {
    disponivel: formatCentsToBrl(Math.round(values.disponivel * 100)),
    projetado: formatCentsToBrl(Math.round(values.projetado * 100)),
  }
}

function parseField(value: string, label: string): number | null
{
  const n = parseMoneyInputToNumber(value)
  if (!Number.isFinite(n))
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
    const disponivel = parseField(fields.disponivel, 'Disponível agora')
    const projetado = parseField(fields.projetado, 'Projetado livre')
    if (disponivel == null || projetado == null) return

    setSaving(true)
    try
    {
      await onSaveManual({
        disponivel,
        reservado: computed.reservado,
        projetado,
      })
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
    {
      key: 'disponivel',
      label: 'Disponível agora',
      hint: 'Quanto você tem livre hoje — igual ao app do banco, já descontando o que está reservado',
    },
    {
      key: 'projetado',
      label: 'Projetado livre',
      hint: 'Quanto sobra após fixas, faturas e agendados do mês',
    },
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
              Informe o disponível real. O comprometido vem das reservas e contas em aberto.
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
          <div className="rounded-sl border border-line bg-chrome/30 px-3 py-2.5">
            <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Comprometido (calculado)</p>
            <p className="text-base font-display tabular-nums text-atencao mt-0.5">{fmt(computed.reservado)}</p>
            <p className={`text-[10px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              Reservas e boletos ainda não pagos no caixa
            </p>
          </div>

          {rows.map(({ key, label, hint }) => (
            <label key={key} className="block space-y-1">
              <span className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
                {label}
              </span>
              {hint && (
                <span className={`block text-[10px] ${AXEL_TEXT_SECONDARY}`}>{hint}</span>
              )}
              <MoneyInput
                value={fields[key]}
                onChange={(v) => setField(key, v)}
                className="w-full tabular-nums min-h-[44px] text-sm"
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
