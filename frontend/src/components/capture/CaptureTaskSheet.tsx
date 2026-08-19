import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_BTN_PRIMARY } from '../../constants/axelSurfaces'

interface CaptureTaskSheetProps
{
  open: boolean
  onClose: () => void
}

export function CaptureTaskSheet({ open, onClose }: CaptureTaskSheetProps)
{
  const createTarefa = useTaskStore((s) => s.createTarefa)
  const [titulo, setTitulo] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() =>
  {
    if (!open) return
    setTitulo('')
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open) return null

  const save = async () =>
  {
    const trimmed = titulo.trim()
    if (!trimmed)
    {
      toast.error('Escreva um título')
      return
    }
    setSaving(true)
    try
    {
      await createTarefa(trimmed)
      toast.success('Tarefa capturada')
      onClose()
    }
    catch
    {
      toast.error('Não foi possível criar a tarefa')
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[66] flex items-end sm:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div className="relative w-full sm:max-w-md border border-line bg-card rounded-t-sl sm:rounded-sl shadow-2xl p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <p className="sl-eyebrow">Captura</p>
        <h2 className="font-sans text-[15px] font-semibold text-ink mt-0.5">Nova tarefa</h2>
        <input
          ref={inputRef}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={(e) =>
          {
            if (e.key === 'Enter') void save()
            if (e.key === 'Escape') onClose()
          }}
          placeholder="O que precisa ser feito?"
          className="w-full mt-2.5 border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-ink/40 min-h-11"
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className={`w-full mt-3 py-2.5 min-h-11 ${AXEL_BTN_PRIMARY} disabled:opacity-40`}
        >
          {saving ? 'Salvando…' : 'Capturar'}
        </button>
      </div>
    </div>
  )
}
