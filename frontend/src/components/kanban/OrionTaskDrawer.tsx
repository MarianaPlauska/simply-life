import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { X, Plus } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useTaskActivityLog } from '../../hooks/useTaskActivityLog'
import { useLocalSubtasks } from '../../hooks/useLocalSubtasks'
import { OrionAiContextBreakdown } from './OrionAiContextBreakdown'
import { OrionAiDecisionLog } from './OrionAiDecisionLog'
import { OrionUrgencyReasonCard } from './OrionUrgencyReasonCard'
import { analyzeTaskIntent } from '../../lib/intentAnalyzer'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { OrionDrawerDetailsStrip } from './OrionDrawerDetailsStrip'
import { OrionActivityEventPanel } from './OrionActivityEventPanel'
import { OrionDrawerQuickInput } from './OrionDrawerQuickInput'
import { ActivityEventIcon } from './orionActivityIcons'
import type { ActivityEventKind } from '../../hooks/useTaskActivityLog'
import { createEmptyTaskDraft } from '../../lib/orionDrawerDraft'
import { orionCompleteTask } from '../../lib/orionTaskCompletion'
import { calcSubtaskProgress, resolveEffectiveSubtasks } from '../../lib/subtaskProgress'
import { getProjectTag } from '../../lib/contextRationale'
import { HORIZON_LABELS, type TemporalHorizon } from '../../lib/temporalHorizon'
import type { TarefaUnificada } from '../../types'

// Drawer — coluna única, título sempre visível, modo criação, rodapé fixo

const DRAWER_SHELL =
  'relative w-full sm:w-[42vw] max-w-2xl h-screen flex flex-col overflow-hidden bg-[#0B0C14] border-l border-white/[0.04]'

interface OrionTaskDrawerProps
{
  tarefa?: TarefaUnificada | null
  temporalHorizon?: TemporalHorizon
  isCreatingNew?: boolean
  onClose: () => void
  onCreated?: (task: TarefaUnificada) => void
}

export function OrionTaskDrawer({
  tarefa: tarefaProp,
  temporalHorizon = 'backlog',
  isCreatingNew = false,
  onClose,
  onCreated,
}: OrionTaskDrawerProps)
{
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const allTasks = mergeDashboardTasks(storeTarefas)
  const createTarefa = useTaskStore((s) => s.createTarefa)
  const updateTarefa = useTaskStore((s) => s.updateTarefa)
  const createSubtarefa = useTaskStore((s) => s.createSubtarefa)
  const updateSubtarefa = useTaskStore((s) => s.updateSubtarefa)

  const draftBase = tarefaProp ?? createEmptyTaskDraft()
  const live = useTaskStore((s) =>
  {
    if (isCreatingNew || !draftBase.id) return draftBase
    return s.tarefas.find((t) => t.id === draftBase.id) ?? draftBase
  })

  const serverSubs = live.subtarefas ?? []
  const { subs, isLocal, addSub, toggleSub } = useLocalSubtasks(
    isCreatingNew ? -1 : live.id,
    serverSubs,
  )

  const [titleDraft, setTitleDraft] = useState(isCreatingNew ? '' : live.titulo)
  const [descDraft, setDescDraft] = useState(
    isCreatingNew ? '' : (live.descricao || live.notas_locais || ''),
  )
  const [newSub, setNewSub] = useState('')
  const [deadline, setDeadline] = useState<string | null>(
    isCreatingNew ? null : live.data_vencimento,
  )
  const [submitting, setSubmitting] = useState(false)

  const taskIdForLog = isCreatingNew ? -1 : live.id

  useEffect(() =>
  {
    if (isCreatingNew || !live.id) return
    const intent = analyzeTaskIntent(live)
    if (intent.flowAlert)
    {
      toast.warning(intent.flowAlert, {
        id: `flow-block-${live.id}`,
        duration: 4500,
        className: 'text-sm',
        description: intent.urgencyReason,
      })
    }
  }, [live.id, live.titulo, live.remetente, isCreatingNew])
  const { entries, addEntry } = useTaskActivityLog(taskIdForLog)
  const titleRef = useRef<HTMLInputElement>(null)
  const logScrollRef = useRef<HTMLDivElement>(null)

  const tag = isCreatingNew ? 'NOVA' : getProjectTag(live)
  const subsDone = subs.filter((s) => s.concluida).length
  const canPersistServer = !isCreatingNew && live.id > 0
  const inProgress = !isCreatingNew && live.status === 'em_progresso'

  const scorePreviewTask: TarefaUnificada = {
    ...live,
    titulo: titleDraft,
    descricao: descDraft,
    notas_locais: descDraft,
    data_vencimento: deadline,
    subtarefas: subs,
  }

  useEffect(() =>
  {
    if (!isCreatingNew)
    {
      setTitleDraft(live.titulo)
      setDescDraft(live.descricao || live.notas_locais || '')
      setDeadline(live.data_vencimento)
    }
  }, [isCreatingNew, live.id, live.titulo, live.descricao, live.notas_locais, live.data_vencimento])

  useEffect(() =>
  {
    if (isCreatingNew) titleRef.current?.focus()
  }, [isCreatingNew])

  useEffect(() =>
  {
    const onKey = (e: KeyboardEvent) =>
    {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () =>
    {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const saveTitle = async () =>
  {
    if (isCreatingNew) return
    const next = titleDraft.trim()
    if (next && next !== live.titulo && canPersistServer)
    {
      await updateTarefa(live.id, { titulo: next })
    }
  }

  const saveDescription = async () =>
  {
    if (isCreatingNew) return
    if (canPersistServer)
    {
      await updateTarefa(live.id, { notas_locais: descDraft.trim() || '' })
    }
  }

  const handleAddSub = async () =>
  {
    if (!newSub.trim()) return
    if (isCreatingNew || isLocal) addSub(newSub.trim())
    else if (canPersistServer) await createSubtarefa(live.id, newSub.trim())
    setNewSub('')
  }

  const maybeCompleteByChecklist = (nextSubs: typeof subs) =>
  {
    if (isCreatingNew || live.status === 'concluida') return
    if (nextSubs.length === 0) return
    if (calcSubtaskProgress(nextSubs) < 100) return
    void orionCompleteTask({ ...live, subtarefas: nextSubs })
  }

  const handleToggleSub = async (subId: number, checked: boolean) =>
  {
    if (isCreatingNew || isLocal)
    {
      const next = subs.map((s) =>
        s.id === subId ? { ...s, concluida: !checked } : s,
      )
      toggleSub(subId)
      maybeCompleteByChecklist(next)
      return
    }
    if (canPersistServer)
    {
      await updateSubtarefa(subId, { concluida: !checked })
      const next = resolveEffectiveSubtasks(live.id, serverSubs).map((s) =>
        s.id === subId ? { ...s, concluida: !checked } : s,
      )
      maybeCompleteByChecklist(next)
    }
  }

  const handleCreateDemand = async () =>
  {
    const titulo = titleDraft.trim()
    if (!titulo)
    {
      toast.error('Informe o título da demanda')
      titleRef.current?.focus()
      return
    }
    setSubmitting(true)
    try
    {
      await createTarefa(titulo, descDraft.trim() || undefined)
      const created = useTaskStore.getState().tarefas[0]
      if (created)
      {
        toast.success('Demanda criada')
        onCreated?.(created)
        onClose()
      }
    }
    catch
    {
      toast.error('Não foi possível criar a demanda')
    }
    finally
    {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex justify-end font-display" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Fechar painel"
      />

      <aside className={DRAWER_SHELL}>
        <div className="shrink-0 flex items-center justify-between gap-2 px-5 py-2 border-b border-white/[0.04] bg-[#121420]">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 px-1.5 py-0.5 rounded border border-white/[0.04]">
              {tag}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono uppercase">
              {HORIZON_LABELS[temporalHorizon]}
            </span>
            {isCreatingNew && (
              <span className="text-[10px] font-mono uppercase text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                Nova demanda
              </span>
            )}
            {inProgress && (
              <span className="text-[10px] font-mono uppercase text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                IN PROGRESS
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 shrink-0"
            aria-label="Fechar"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="flex flex-col gap-5 w-full px-5 py-4 min-w-0">
            <input
              ref={titleRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => void saveTitle()}
              placeholder="Título da demanda…"
              className="w-full min-w-0 box-border text-xl font-bold text-zinc-100 bg-transparent border-none outline-none focus:ring-0 placeholder:text-zinc-600"
              aria-label="Título da tarefa"
            />

            <OrionDrawerDetailsStrip
              tarefa={scorePreviewTask}
              deadline={deadline}
              canPersist={canPersistServer}
              isCreatingNew={isCreatingNew}
              onDeadlineChange={setDeadline}
            />

            <OrionUrgencyReasonCard
              tarefa={scorePreviewTask}
              isCreatingNew={isCreatingNew}
            />

            <section className="min-w-0">
              <h3 className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                Descrição
              </h3>
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={() => void saveDescription()}
                rows={4}
                placeholder="Contexto, critérios de aceite, links…"
                className="w-full min-w-0 max-w-full box-border bg-zinc-900/30 border border-white/5 rounded-md p-3 text-sm text-zinc-300 min-h-[100px] resize-y outline-none placeholder:text-zinc-500 focus:border-indigo-500/50 focus:ring-0 break-words"
              />
            </section>

            <OrionAiContextBreakdown
              tarefa={scorePreviewTask}
              allTasks={allTasks}
              isCreatingNew={isCreatingNew}
            />

            <OrionAiDecisionLog />

            <section className="min-w-0 border-t border-white/[0.04] pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                  Checklist
                </h3>
                <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                  {subsDone}/{subs.length}
                </span>
              </div>

              <ul className="mb-2 min-w-0">
                {subs.map((sub) => (
                  <li key={sub.id}>
                    <label className="flex items-center gap-3 py-1.5 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={sub.concluida}
                        onChange={() => void handleToggleSub(sub.id, sub.concluida)}
                        className="h-4 w-4 shrink-0 rounded border-zinc-600 accent-indigo-500"
                      />
                      <span
                        className={`flex-1 text-sm leading-snug min-w-0 break-words ${
                          sub.concluida ? 'line-through text-zinc-400' : 'text-zinc-300'
                        }`}
                      >
                        {sub.titulo}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              <input
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) =>
                {
                  if (e.key === 'Enter') void handleAddSub()
                }}
                placeholder="Nova sub-etapa…"
                className="w-full min-w-0 box-border text-sm border border-white/[0.04] rounded-md px-2.5 py-1.5 text-zinc-300 bg-transparent outline-none focus:border-indigo-500/40 focus:ring-0"
              />
              <button
                type="button"
                onClick={() => void handleAddSub()}
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                <Plus size={14} strokeWidth={1.5} />
                Adicionar sub-etapa
              </button>
            </section>
          </div>
        </div>

        <footer className="shrink-0 border-t border-white/[0.04] bg-[#0B0C14] px-5 py-3 min-w-0">
          {isCreatingNew ? (
            <button
              type="button"
              disabled={submitting || !titleDraft.trim()}
              onClick={() => void handleCreateDemand()}
              className="w-full h-10 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors disabled:opacity-40 shadow-lg shadow-indigo-900/25"
            >
              {submitting ? 'Criando…' : 'Criar Demanda'}
            </button>
          ) : (
            <>
              <h3 className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                Log de atividades
              </h3>
              <div
                ref={logScrollRef}
                className="max-h-[140px] overflow-y-auto custom-scrollbar mb-2 space-y-1.5 min-w-0"
              >
                {entries.length === 0 && (
                  <p className="text-xs text-zinc-400 py-1">Nenhum evento.</p>
                )}
                {entries.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-2 py-1 border-b border-white/[0.04] last:border-0 min-w-0"
                  >
                    {e.kind && (
                      <ActivityEventIcon kind={e.kind as ActivityEventKind} size={14} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-400 leading-snug break-words">{e.text}</p>
                      <time className="text-[10px] font-mono text-zinc-400 tabular-nums">
                        {new Date(e.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                  </div>
                ))}
              </div>

              <OrionDrawerQuickInput
                onSubmit={(text) => addEntry(text, 'progress')}
              />

              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                  Eventos rápidos
                </p>
                <OrionActivityEventPanel
                  task={live}
                  canPersist={canPersistServer}
                  onLog={(text, kind) => addEntry(text, kind)}
                />
              </div>
            </>
          )}
        </footer>
      </aside>
    </div>
  )
}
