import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { X, Plus, Pin, CalendarClock, CheckCircle2 } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useTaskActivityLog } from '../../hooks/useTaskActivityLog'
import { useLocalSubtasks } from '../../hooks/useLocalSubtasks'
import { AxelAiContextBreakdown } from './AxelAiContextBreakdown'
import { AxelAiDecisionLog } from './AxelAiDecisionLog'
import { AxelUrgencyReasonCard } from './AxelUrgencyReasonCard'
import { analyzeTaskIntent } from '../../lib/intentAnalyzer'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { AxelDeadlineProposalBanner } from './AxelDeadlineProposalBanner'
import { AxelDrawerDetailsStrip } from './AxelDrawerDetailsStrip'
import { AxelActivityEventPanel } from './AxelActivityEventPanel'
import { AxelDrawerQuickInput } from './AxelDrawerQuickInput'
import { ActivityEventIcon } from './axelActivityIcons'
import type { ActivityEventKind } from '../../hooks/useTaskActivityLog'
import { createEmptyTaskDraft } from '../../lib/axelDrawerDraft'
import { axelCompleteTask } from '../../lib/axelTaskCompletion'
import { calcSubtaskProgress, resolveEffectiveSubtasks } from '../../lib/subtaskProgress'
import { getProjectTag } from '../../lib/contextRationale'
import { HORIZON_LABELS, type TemporalHorizon } from '../../lib/temporalHorizon'
import { AXEL_BTN_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { toggleExecutionPin, isExecutionPinned } from '../../lib/kanbanExecutionPrefs'
import type { TarefaUnificada } from '../../types'

// Drawer — coluna única, título sempre visível, modo criação, rodapé fixo

const DRAWER_SHELL =
  'relative w-full sm:w-[42vw] max-w-2xl h-screen flex flex-col overflow-hidden bg-card border-l border-line'

interface AxelTaskDrawerProps
{
  tarefa?: TarefaUnificada | null
  temporalHorizon?: TemporalHorizon
  isCreatingNew?: boolean
  onClose: () => void
  onCreated?: (task: TarefaUnificada) => void
}

export function AxelTaskDrawer({
  tarefa: tarefaProp,
  temporalHorizon = 'backlog',
  isCreatingNew = false,
  onClose,
  onCreated,
}: AxelTaskDrawerProps)
{
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const allTasks = mergeDashboardTasks(storeTarefas)
  const createTarefa = useTaskStore((s) => s.createTarefa)
  const updateTarefa = useTaskStore((s) => s.updateTarefa)
  const createSubtarefa = useTaskStore((s) => s.createSubtarefa)
  const updateSubtarefa = useTaskStore((s) => s.updateSubtarefa)
  const getDeadlineProposal = useTaskStore((s) => s.getDeadlineProposal)
  const acceptDeadlineProposal = useTaskStore((s) => s.acceptDeadlineProposal)
  const rejectDeadlineProposal = useTaskStore((s) => s.rejectDeadlineProposal)
  const pushAiDecision = useTaskStore((s) => s.pushAiDecision)

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
  const [pinned, setPinned] = useState(() =>
    tarefaProp ? isExecutionPinned(tarefaProp.id) : false,
  )
  const [proposalLoading, setProposalLoading] = useState(false)

  const deadlineProposal = !isCreatingNew && live.id > 0
    ? getDeadlineProposal(live.id)
    : null

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

  const handleComplete = () =>
  {
    if (isCreatingNew || live.status === 'concluida') return
    void axelCompleteTask({ ...live, subtarefas: subs })
    addEntry('Tarefa concluída manualmente', 'progress')
    onClose()
  }

  const handlePin = () =>
  {
    if (isCreatingNew) return
    const next = toggleExecutionPin(live.id)
    setPinned(next.includes(live.id))
    pushAiDecision(
      next.includes(live.id)
        ? `Fixada em Executar agora: ${live.titulo}`
        : `Removida da fila fixa: ${live.titulo}`,
    )
    window.dispatchEvent(new Event('axel-exec-pins-changed'))
  }

  const handleSnoozeDay = async () =>
  {
    if (isCreatingNew || !canPersistServer) return
    const base = live.data_vencimento ? new Date(live.data_vencimento) : new Date()
    base.setDate(base.getDate() + 1)
    const next = base.toISOString()
    await updateTarefa(live.id, { data_vencimento: next })
    setDeadline(next)
    pushAiDecision(`Prazo adiado +1 dia: ${live.titulo}`)
    addEntry('Prazo adiado +1 dia', 'progress')
    toast.info('Prazo adiado para amanhã')
  }

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
    void axelCompleteTask({ ...live, subtarefas: nextSubs })
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
        <div className="shrink-0 flex items-center justify-between gap-2 px-5 py-2 border-b border-line bg-chrome/40">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="font-mono text-[10px] uppercase tracking-wide text-accent px-1.5 py-0.5 rounded-sl border border-line">
              {tag}
            </span>
            <span className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>
              {HORIZON_LABELS[temporalHorizon]}
            </span>
            {isCreatingNew && (
              <span className="font-mono text-[10px] uppercase text-accent px-1.5 py-0.5 rounded-sl border border-accent/30">
                Nova demanda
              </span>
            )}
            {inProgress && (
              <span className="font-mono text-[10px] uppercase text-accent px-1.5 py-0.5 rounded-sl border border-accent/30">
                Em progresso
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sl text-ink-muted hover:text-ink shrink-0"
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
              className="w-full min-w-0 box-border text-xl font-display font-semibold text-ink bg-transparent border-none outline-none focus:ring-0 placeholder:text-ink-muted"
              aria-label="Título da tarefa"
            />

            <AxelDrawerDetailsStrip
              tarefa={scorePreviewTask}
              deadline={deadline}
              canPersist={canPersistServer}
              isCreatingNew={isCreatingNew}
              onDeadlineChange={setDeadline}
            />

            {deadlineProposal && (
              <AxelDeadlineProposalBanner
                proposal={deadlineProposal}
                loading={proposalLoading}
                onAccept={() =>
                {
                  setProposalLoading(true)
                  const accepted = acceptDeadlineProposal(live.id)
                  if (!accepted)
                  {
                    setProposalLoading(false)
                    return
                  }
                  setDeadline(accepted.proposedDue)
                  if (canPersistServer)
                  {
                    void updateTarefa(live.id, { data_vencimento: accepted.proposedDue })
                      .then(() =>
                      {
                        pushAiDecision(`Prazo aceito · ${live.titulo.slice(0, 40)}`)
                        toast.success('Novo prazo aplicado')
                      })
                      .finally(() => setProposalLoading(false))
                  }
                  else
                  {
                    pushAiDecision(`Prazo aceito · ${live.titulo.slice(0, 40)}`)
                    setProposalLoading(false)
                  }
                }}
                onReject={() =>
                {
                  rejectDeadlineProposal(live.id)
                  pushAiDecision(`Prazo mantido · ${live.titulo.slice(0, 40)}`)
                }}
              />
            )}

            <section className="min-w-0">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted mb-2">
                Descrição
              </h3>
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={() => void saveDescription()}
                rows={4}
                placeholder="Contexto, critérios de aceite, links…"
                className="w-full min-w-0 max-w-full box-border bg-chrome/30 border border-line rounded-sl p-3 text-sm text-ink min-h-[100px] resize-y outline-none placeholder:text-ink-muted focus:border-accent/40 focus:ring-0 break-words"
              />
            </section>

            <AxelUrgencyReasonCard
              tarefa={scorePreviewTask}
              isCreatingNew={isCreatingNew}
            />

            <AxelAiContextBreakdown
              tarefa={scorePreviewTask}
              allTasks={allTasks}
              isCreatingNew={isCreatingNew}
              defaultCollapsed
            />

            <AxelAiDecisionLog defaultCollapsed />

            <section className="min-w-0 border-t border-line pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                  Checklist
                </h3>
                <span className="font-mono text-[11px] text-ink-muted tabular-nums">
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
                        className="h-4 w-4 shrink-0 rounded border-line accent-accent"
                      />
                      <span
                        className={`flex-1 text-sm leading-snug min-w-0 break-words ${
                          sub.concluida ? 'line-through text-ink-muted' : 'text-ink'
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
                className="w-full min-w-0 box-border text-sm border border-line rounded-sl px-2.5 py-1.5 text-ink bg-transparent outline-none focus:border-accent/40 focus:ring-0"
              />
              <button
                type="button"
                onClick={() => void handleAddSub()}
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-accent"
              >
                <Plus size={14} strokeWidth={1.5} />
                Adicionar sub-etapa
              </button>
            </section>
          </div>
        </div>

        <footer className="shrink-0 border-t border-line bg-card px-5 py-3 min-w-0">
          {isCreatingNew ? (
            <button
              type="button"
              disabled={submitting || !titleDraft.trim()}
              onClick={() => void handleCreateDemand()}
              className={`w-full h-10 text-sm font-mono uppercase tracking-wide ${AXEL_BTN_PRIMARY} disabled:opacity-40`}
            >
              {submitting ? 'Criando…' : 'Criar Demanda'}
            </button>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={live.status === 'concluida'}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sl bg-concluido/15 text-concluido font-mono text-[9px] uppercase"
                >
                  <CheckCircle2 size={12} />
                  Concluir
                </button>
                <button
                  type="button"
                  onClick={handlePin}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sl border font-mono text-[9px] uppercase ${
                    pinned ? 'border-accent text-accent bg-accent/10' : 'border-line text-ink-muted'
                  }`}
                >
                  <Pin size={12} />
                  {pinned ? 'Fixada' : 'Fixar'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSnoozeDay()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sl border border-line text-ink-muted font-mono text-[9px] uppercase"
                >
                  <CalendarClock size={12} />
                  +1 dia
                </button>
              </div>

              <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted mb-2">
                Log de atividades
              </h3>
              <div
                ref={logScrollRef}
                className="max-h-[140px] overflow-y-auto custom-scrollbar mb-2 space-y-1.5 min-w-0"
              >
                {entries.length === 0 && (
                  <p className="text-xs text-ink-muted py-1">Nenhum evento.</p>
                )}
                {entries.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-2 py-1 border-b border-line last:border-0 min-w-0"
                  >
                    {e.kind && (
                      <ActivityEventIcon kind={e.kind as ActivityEventKind} size={14} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink-muted leading-snug break-words">{e.text}</p>
                      <time className="text-[10px] font-mono text-ink-muted tabular-nums">
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

              <AxelDrawerQuickInput
                onSubmit={(text) => addEntry(text, 'progress')}
              />

              <div className="mt-3 pt-3 border-t border-line">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted mb-1.5">
                  Eventos rápidos
                </p>
                <AxelActivityEventPanel
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
