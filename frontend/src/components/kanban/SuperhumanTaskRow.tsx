import { useState } from 'react'
import { Circle } from 'lucide-react'
import { toast } from 'sonner'
import type { TarefaUnificada } from '../../types'
import { PRIO_LABELS } from '../../constants/kanbanConfig'
import { TaskLineRow } from './TaskLineRow'

interface SuperhumanTaskRowProps
{
  tarefa: TarefaUnificada
  onComplete: (t: TarefaUnificada) => Promise<void>
  onUpdate: (
    id: number,
    dados: {
      titulo?: string
      status?: string
      notas_locais?: string
      prioridade?: string
    },
  ) => Promise<void>
  onArchive: (id: number) => Promise<void>
}

const PRIO_CYCLE = ['baixa', 'media', 'alta', 'critica'] as const

const PRIO_CHIP: Record<string, string> = {
  critica: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  alta: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  media: 'text-task bg-task/10 border-task/20',
  baixa: 'text-ink-muted bg-chrome/40 border-line',
}

export function SuperhumanTaskRow({ tarefa, onComplete, onUpdate, onArchive }: SuperhumanTaskRowProps)
{
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(tarefa.notas_locais || '')

  const cyclePriority = async () =>
  {
    const idx = PRIO_CYCLE.indexOf(tarefa.prioridade as typeof PRIO_CYCLE[number])
    const next = PRIO_CYCLE[(idx + 1) % PRIO_CYCLE.length]
    await onUpdate(tarefa.id, { prioridade: next })
    toast.info(`Prioridade: ${PRIO_LABELS[next]}`)
  }

  const saveNotes = async () =>
  {
    await onUpdate(tarefa.id, { notas_locais: notes.trim() || undefined })
    setEditingNotes(false)
  }

  const trailing = (
    <>
      {editingNotes ? (
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => { void saveNotes() }}
          onKeyDown={(e) =>
          {
            if (e.key === 'Enter') void saveNotes()
            if (e.key === 'Escape') setEditingNotes(false)
          }}
          onClick={(e) => e.stopPropagation()}
          className="hidden md:block w-40 bg-chrome border border-line rounded-md px-2 py-0.5 text-[10px] text-ink outline-none"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={(e) =>
          {
            e.stopPropagation()
            setEditingNotes(true)
          }}
          className="hidden md:block max-w-[140px] truncate text-[10px] text-ink-muted hover:text-ink"
        >
          {tarefa.notas_locais || 'Nota…'}
        </button>
      )}
      <button
        type="button"
        onClick={(e) =>
        {
          e.stopPropagation()
          void cyclePriority()
        }}
        className={`shrink-0 px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded border ${PRIO_CHIP[tarefa.prioridade] || PRIO_CHIP.media}`}
      >
        {PRIO_LABELS[tarefa.prioridade] || 'Média'}
      </button>
      <button
        type="button"
        onClick={(e) =>
        {
          e.stopPropagation()
          void onComplete(tarefa)
        }}
        className="p-1 text-ink-muted hover:text-health"
        title="Concluir"
      >
        <Circle className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={(e) =>
        {
          e.stopPropagation()
          void onArchive(tarefa.id)
        }}
        className="text-[10px] text-ink-muted hover:text-danger opacity-0 group-hover:opacity-100"
      >
        Arquivar
      </button>
    </>
  )

  return (
    <TaskLineRow
      tarefa={tarefa}
      onOpen={() =>
      {
        setEditingNotes(true)
      }}
      trailing={trailing}
    />
  )
}
