import { useState } from 'react'
import { ACTIVITY_EVENT_META } from './axelActivityIcons'
import { useTaskStore } from '../../store/useTaskStore'
import { axelCompleteTask } from '../../lib/axelTaskCompletion'
import type { TarefaUnificada } from '../../types'

// Eventos rápidos funcionais

type PanelMode = 'idle' | 'blocker' | 'progress' | 'dependency'

const STATUS_PIPELINE: {
  id: TarefaUnificada['status']
  label: string
  phase: string
}[] = [
  { id: 'pendente', label: 'Pendente', phase: 'Backlog' },
  { id: 'em_progresso', label: 'Em Progresso', phase: 'Execução' },
  { id: 'concluida', label: 'Concluída', phase: 'Entrega' },
]

interface AxelActivityEventPanelProps
{
  task: TarefaUnificada
  canPersist: boolean
  onLog: (text: string, kind: 'blocker' | 'progress' | 'dependency') => void
}

export function AxelActivityEventPanel({
  task,
  canPersist,
  onLog,
}: AxelActivityEventPanelProps)
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const moveTask = useTaskStore((s) => s.moveTask)
  const updateTarefa = useTaskStore((s) => s.updateTarefa)
  const patchTarefaLocal = useTaskStore((s) => s.patchTarefaLocal)

  const [mode, setMode] = useState<PanelMode>('idle')
  const [blockerNote, setBlockerNote] = useState('')
  const [depTaskId, setDepTaskId] = useState<number | ''>('')

  const current = STATUS_PIPELINE.find((s) => s.id === task.status) ?? STATUS_PIPELINE[0]
  const others = tarefas.filter((t) => t.id !== task.id && t.status !== 'concluida')

  const applyStatus = async (next: TarefaUnificada['status']) =>
  {
    const nextMeta = STATUS_PIPELINE.find((s) => s.id === next)!

    if (next === 'concluida')
    {
      await axelCompleteTask(task)
    }
    else
    {
      moveTask(task.id, next)
      if (canPersist)
      {
        await updateTarefa(task.id, { status: next })
      }
      else
      {
        patchTarefaLocal(task.id, { status: next })
      }
    }

    onLog(
      `Andamento - fase: ${nextMeta.phase} (${nextMeta.label}). Anterior: ${current.phase} (${current.label}).`,
      'progress',
    )
    setMode('idle')
  }

  const submitBlocker = () =>
  {
    const note = blockerNote.trim() || 'Bloqueio registrado sem detalhe adicional.'
    onLog(`Bloqueio - ${note}`, 'blocker')
    setBlockerNote('')
    setMode('idle')
  }

  const submitDependency = () =>
  {
    const dep = others.find((t) => t.id === depTaskId)
    const label = dep ? dep.titulo : 'tarefa não especificada'
    onLog(`Dependência vinculada: ${label}`, 'dependency')
    setDepTaskId('')
    setMode('idle')
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(['blocker', 'progress', 'dependency'] as const).map((kind) =>
        {
          const meta = ACTIVITY_EVENT_META[kind]
          const Icon = meta.Icon
          return (
            <button
              key={kind}
              type="button"
              onClick={() => setMode(mode === kind ? 'idle' : kind)}
              className="inline-flex items-center gap-1.5 h-8 text-[11px] border border-white/5 bg-[#13141F] hover:bg-[#0B0C14] text-zinc-400 hover:text-zinc-200 px-2.5 rounded-md transition-colors"
            >
              <Icon size={16} strokeWidth={1.5} className={meta.color} />
              {meta.label}
            </button>
          )
        })}
      </div>

      {mode === 'progress' && (
        <div className="pt-2 border-t border-white/5 space-y-2">
          <p className="text-[10px] text-zinc-400">
            Fase atual:{' '}
            <span className="font-mono text-zinc-300">{current.phase}</span>
            {' · '}
            <span className="text-zinc-400">{current.label}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_PIPELINE.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={s.id === task.status}
                onClick={() => void applyStatus(s.id)}
                className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                  s.id === task.status
                    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 cursor-default'
                    : 'border-white/[0.04] text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'blocker' && (
        <div className="pt-2 border-t border-white/5 space-y-2">
          <input
            value={blockerNote}
            onChange={(e) => setBlockerNote(e.target.value)}
            placeholder="Descreva o bloqueio (opcional)…"
            className="w-full text-xs bg-[#09090B] border border-white/[0.04] rounded px-2 py-1.5 text-zinc-300 outline-none"
          />
          <button
            type="button"
            onClick={submitBlocker}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            Registrar bloqueio
          </button>
        </div>
      )}

      {mode === 'dependency' && (
        <div className="pt-2 border-t border-white/5 space-y-2">
          <select
            value={depTaskId}
            onChange={(e) => setDepTaskId(e.target.value ? Number(e.target.value) : '')}
            className="w-full text-xs bg-[#09090B] border border-white/[0.04] rounded px-2 py-1.5 text-zinc-300 outline-none"
          >
            <option value="">Selecionar tarefa dependência…</option>
            {others.map((t) => (
              <option key={t.id} value={t.id}>
                {t.titulo.slice(0, 60)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={submitDependency}
            disabled={!depTaskId}
            className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40"
          >
            Vincular dependência
          </button>
        </div>
      )}
    </div>
  )
}
