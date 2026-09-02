import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import {
  AXEL_BTN_LG,
  AXEL_BTN_PRIMARY,
  AXEL_FORM_SEG_ACTIVE,
  AXEL_FORM_SEG_IDLE,
} from '../../constants/axelSurfaces'

type ListaHorizon = 'hoje' | 'semana' | 'backlog'

interface CaptureTaskSheetProps
{
  open: boolean
  onClose: () => void
}

const LISTAS: { id: ListaHorizon; label: string }[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'backlog', label: 'Sem hora' },
]

function todayIsoDate(): string
{
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function CaptureTaskSheet({ open, onClose }: CaptureTaskSheetProps)
{
  const createTarefa = useTaskStore((s) => s.createTarefa)
  const labels = useTaskStore((s) => s.labels)
  const fetchLabels = useTaskStore((s) => s.fetchLabels)
  const addLabelToTarefa = useTaskStore((s) => s.addLabelToTarefa)
  const [titulo, setTitulo] = useState('')
  const [notas, setNotas] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [lista, setLista] = useState<ListaHorizon>('hoje')
  const [labelIds, setLabelIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() =>
  {
    if (!open) return
    setTitulo('')
    setNotas('')
    setData('')
    setHora('')
    setLista('hoje')
    setLabelIds([])
    void fetchLabels()
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [open, fetchLabels])

  if (!open)
  {
    return null
  }

  const toggleLabel = (id: number) =>
  {
    setLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

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
      let dataVencimento: string | undefined
      if (data)
      {
        const time = hora || '12:00'
        dataVencimento = new Date(`${data}T${time}`).toISOString()
      }
      else if (lista === 'hoje')
      {
        dataVencimento = new Date(`${todayIsoDate()}T12:00:00`).toISOString()
      }

      const id = await createTarefa(trimmed, notas.trim() || undefined, {
        data_vencimento: dataVencimento,
        origem: 'manual',
        horizon_override: lista,
      })
      if (id)
      {
        for (const labelId of labelIds)
        {
          await addLabelToTarefa(id, labelId)
        }
      }
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
      <div className="relative w-full sm:max-w-md max-h-[min(90dvh,640px)] overflow-y-auto border border-line bg-card rounded-t-sl sm:rounded-sl shadow-2xl p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <p className="sl-section-label">Captura</p>
        <h2 className="sl-page-title text-[1.25rem] mt-0.5">Nova tarefa</h2>

        <label className="block mt-3 sl-section-label" htmlFor="capture-titulo">
          Título
        </label>
        <input
          id="capture-titulo"
          ref={inputRef}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={(e) =>
          {
            if (e.key === 'Escape') onClose()
          }}
          placeholder="O que precisa ser feito?"
          className="w-full mt-1 border border-line rounded-sl bg-chrome px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-muted outline-none focus:border-ink/40 min-h-11"
        />

        <label className="block mt-3 sl-section-label" htmlFor="capture-notas">
          Descrição
        </label>
        <textarea
          id="capture-notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          placeholder="Contexto, o que conta como feito…"
          className="w-full mt-1 border border-line rounded-sl bg-chrome px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-muted outline-none focus:border-ink/40 min-h-[72px] resize-none"
        />

        <p className="mt-3 sl-section-label">Lista</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {LISTAS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLista(item.id)}
              className={lista === item.id ? AXEL_FORM_SEG_ACTIVE : AXEL_FORM_SEG_IDLE}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="block sl-section-label" htmlFor="capture-data">
              Data
            </label>
            <input
              id="capture-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full mt-1 border border-line rounded-sl bg-chrome px-2 py-2 text-[13px] text-ink min-h-11"
            />
          </div>
          <div>
            <label className="block sl-section-label" htmlFor="capture-hora">
              Hora
            </label>
            <input
              id="capture-hora"
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full mt-1 border border-line rounded-sl bg-chrome px-2 py-2 text-[13px] text-ink min-h-11"
            />
          </div>
        </div>

        {labels.length > 0 && (
          <>
            <p className="mt-3 sl-section-label">Etiquetas</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {labels.map((lab) =>
              {
                const on = labelIds.includes(lab.id)
                return (
                  <button
                    key={lab.id}
                    type="button"
                    onClick={() => toggleLabel(lab.id)}
                    className={on ? AXEL_FORM_SEG_ACTIVE : AXEL_FORM_SEG_IDLE}
                  >
                    {lab.nome}
                  </button>
                )
              })}
            </div>
          </>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className={`mt-4 ${AXEL_BTN_LG} ${AXEL_BTN_PRIMARY} disabled:opacity-40`}
        >
          {saving ? 'Salvando…' : 'Capturar'}
        </button>
      </div>
    </div>
  )
}
