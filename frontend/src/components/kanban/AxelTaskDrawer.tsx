import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { X, Plus, Pin, CalendarClock, CheckCircle2, Trash2 } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useTaskActivityLog, migrateTaskActivityLog, appendTaskActivityLog } from '../../hooks/useTaskActivityLog'
import { useDraftActivityLog } from '../../hooks/useDraftActivityLog'
import { usePersistedTaskActivityLog } from '../../hooks/usePersistedTaskActivityLog'
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
import {
  clearTaskCreateDraft,
  loadTaskCreateDraft,
  saveTaskCreateDraft,
} from '../../lib/taskCreateDraft'
import { axelCompleteTask } from '../../lib/axelTaskCompletion'
import { calcSubtaskProgress, clearLocalSubtasks, resolveEffectiveSubtasks } from '../../lib/subtaskProgress'
import { HORIZON_LABELS, type TemporalHorizon } from '../../lib/temporalHorizon'
import { AxelDrawerOrganizationSection, manualPriorityToDb, type ManualPriority } from './AxelDrawerOrganizationSection'
import { setTaskContexto, createContexto } from '../../lib/taskContextService'
import { loadTaskDrawerPrefs, saveTaskDrawerPrefs } from '../../lib/taskDrawerPrefs'
import { AXEL_BTN_PRIMARY, AXEL_DRAWER_FOOTER_PB_MOBILE, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { toggleExecutionPin, isExecutionPinned } from '../../lib/kanbanExecutionPrefs'
import type { Subtarefa, TarefaUnificada } from '../../types'

const CREATE_SUBTASK_SENTINEL = -1

function startOfRegistrationDay(iso?: string | null): string
{
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) return new Date().toISOString()
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}

const DRAWER_SHELL =
  'relative w-full sm:w-[42vw] max-w-2xl h-[100dvh] flex flex-col overflow-hidden bg-card border-l border-white/[0.05] shadow-2xl'

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
  const deleteSubtarefa = useTaskStore((s) => s.deleteSubtarefa)
  const getDeadlineProposal = useTaskStore((s) => s.getDeadlineProposal)
  const acceptDeadlineProposal = useTaskStore((s) => s.acceptDeadlineProposal)
  const rejectDeadlineProposal = useTaskStore((s) => s.rejectDeadlineProposal)
  const pushAiDecision = useTaskStore((s) => s.pushAiDecision)
  const addLabelToTarefa = useTaskStore((s) => s.addLabelToTarefa)
  const refreshTaskEstimateFromTask = useTaskStore((s) => s.refreshTaskEstimateFromTask)

  const draftBase = tarefaProp ?? createEmptyTaskDraft()
  const live = useTaskStore((s) =>
  {
    if (isCreatingNew || !draftBase.id) return draftBase
    return s.tarefas.find((t) => t.id === draftBase.id) ?? draftBase
  })

  const serverSubs = live.subtarefas ?? []
  const { subs: persistedSubs, isLocal, addSub, toggleSub, removeSub } = useLocalSubtasks(
    isCreatingNew ? CREATE_SUBTASK_SENTINEL : live.id,
    serverSubs,
  )

  const [titleDraft, setTitleDraft] = useState(isCreatingNew ? '' : live.titulo)
  const [descDraft, setDescDraft] = useState(
    isCreatingNew ? '' : (live.descricao || live.notas_locais || ''),
  )
  const [newSub, setNewSub] = useState('')
  const [draftSubs, setDraftSubs] = useState<Subtarefa[]>([])
  const [deadline, setDeadline] = useState<string | null>(
    isCreatingNew ? null : live.data_vencimento,
  )
  const [semPrazo, setSemPrazo] = useState(false)
  const [plannedStart, setPlannedStart] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [pinned, setPinned] = useState(() =>
    tarefaProp ? isExecutionPinned(tarefaProp.id) : false,
  )
  const [proposalLoading, setProposalLoading] = useState(false)
  const [manualPriority, setManualPriority] = useState<ManualPriority>('normal')
  const [draftContexto, setDraftContexto] = useState<{ id?: number; titulo: string; cor: string } | null>(null)
  const [draftLabels, setDraftLabels] = useState<TarefaUnificada['labels']>([])
  const [draftRestored, setDraftRestored] = useState(false)
  const draftHydratedRef = useRef(false)

  const subs = isCreatingNew ? draftSubs : persistedSubs

  const deadlineProposal = !isCreatingNew && live.id > 0
    ? getDeadlineProposal(live.id)
    : null

  const taskIdForLog = isCreatingNew ? -1 : live.id
  const canPersistServer = !isCreatingNew && live.id > 0

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

  useDraftActivityLog({
    enabled: isCreatingNew,
    draftRestored,
    onLog: addEntry,
    state: {
      title: titleDraft,
      desc: descDraft,
      deadline,
      semPrazo,
      plannedStart,
      manualPriority,
      draftSubsCount: draftSubs.length,
    },
  })

  usePersistedTaskActivityLog({
    enabled: canPersistServer,
    onLog: addEntry,
    state: {
      deadline,
      semPrazo: !deadline,
      plannedStart,
      manualPriority,
    },
  })

  useEffect(() =>
  {
    if (isCreatingNew || !canPersistServer) return
    if ((live.data_vencimento ?? null) === deadline) return

    const timer = window.setTimeout(() =>
    {
      void updateTarefa(live.id, { data_vencimento: deadline })
    }, 400)

    return () => clearTimeout(timer)
  }, [deadline, isCreatingNew, canPersistServer, live.id, live.data_vencimento, updateTarefa])

  useEffect(() =>
  {
    logScrollRef.current?.scrollTo({ top: logScrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [entries.length])

  const subsDone = subs.filter((s) => s.concluida).length
  const inProgress = !isCreatingNew && live.status === 'em_progresso'

  useEffect(() =>
  {
    if (isCreatingNew || !live.id) return
    void refreshTaskEstimateFromTask(
      { ...live, subtarefas: subs },
      entries.length,
    )
  }, [
    isCreatingNew,
    live.id,
    subs.length,
    subsDone,
    entries.length,
    refreshTaskEstimateFromTask,
    live.titulo,
    live.prioridade,
    live.notas_locais,
    live.descricao,
    subs,
    live,
  ])

  useEffect(() =>
  {
    if (isCreatingNew) titleRef.current?.focus()
  }, [isCreatingNew])

  useEffect(() =>
  {
    if (!isCreatingNew || draftHydratedRef.current) return
    draftHydratedRef.current = true

    const saved = loadTaskCreateDraft()
    if (!saved)
    {
      clearLocalSubtasks(CREATE_SUBTASK_SENTINEL)
      setDraftSubs([])
      return
    }

    const hasContent = Boolean(
      saved.title.trim()
      || saved.desc.trim()
      || saved.deadline
      || saved.semPrazo
      || saved.plannedStart
      || saved.draftContexto
      || saved.draftLabels.length > 0
      || saved.draftSubs.length > 0,
    )
    if (!hasContent)
    {
      clearLocalSubtasks(CREATE_SUBTASK_SENTINEL)
      return
    }

    setTitleDraft(saved.title)
    setDescDraft(saved.desc)
    setSemPrazo(saved.semPrazo)
    setDeadline(saved.semPrazo ? null : saved.deadline)
    setPlannedStart(saved.plannedStart)
    setManualPriority(saved.manualPriority)
    setDraftContexto(saved.draftContexto)
    setDraftLabels(saved.draftLabels)
    setDraftSubs(saved.draftSubs)
    setDraftRestored(true)
  }, [isCreatingNew])

  const buildDraftPayload = () => ({
    title: titleDraft,
    desc: descDraft,
    deadline: semPrazo ? null : deadline,
    semPrazo,
    plannedStart,
    manualPriority,
    draftContexto,
    draftLabels: draftLabels ?? [],
    draftSubs,
    temporalHorizon,
  })

  const draftHasContent = () => Boolean(
    titleDraft.trim()
    || descDraft.trim()
    || semPrazo
    || deadline
    || plannedStart
    || draftContexto
    || (draftLabels?.length ?? 0) > 0
    || draftSubs.length > 0,
  )

  useEffect(() =>
  {
    if (!isCreatingNew) return

    const timer = window.setTimeout(() =>
    {
      if (!draftHasContent())
      {
        clearTaskCreateDraft()
        return
      }
      saveTaskCreateDraft(buildDraftPayload())
    }, 400)

    return () => clearTimeout(timer)
  }, [
    isCreatingNew,
    titleDraft,
    descDraft,
    deadline,
    semPrazo,
    plannedStart,
    manualPriority,
    draftContexto,
    draftLabels,
    draftSubs,
    temporalHorizon,
  ])

  const flushDraftAndClose = () =>
  {
    if (isCreatingNew && draftHasContent())
    {
      saveTaskCreateDraft(buildDraftPayload())
      toast.message('Rascunho guardado — continue quando quiser')
    }
    onClose()
  }

  const handleManualPriorityChange = (p: ManualPriority) =>
  {
    setManualPriority(p)
    if (p === 'alta' && !plannedStart)
    {
      const base = isCreatingNew ? null : live.created_at
      handlePlannedStartChange(startOfRegistrationDay(base))
    }
  }

  const handleDiscardDraft = () =>
  {
    clearTaskCreateDraft()
    clearLocalSubtasks(CREATE_SUBTASK_SENTINEL)
    setTitleDraft('')
    setDescDraft('')
    setDeadline(null)
    setSemPrazo(false)
    setPlannedStart(null)
    setManualPriority('normal')
    setDraftContexto(null)
    setDraftLabels([])
    setDraftSubs([])
    setDraftRestored(false)
    toast.message('Rascunho descartado')
  }

  const scorePreviewTask: TarefaUnificada = {
    ...live,
    titulo: titleDraft,
    descricao: descDraft,
    notas_locais: descDraft,
    data_vencimento: semPrazo ? null : deadline,
    subtarefas: subs,
    labels: isCreatingNew ? draftLabels : live.labels,
    contexto: isCreatingNew
      ? (draftContexto ?? undefined)
      : live.contexto,
    prioridade: manualPriorityToDb(manualPriority),
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
    if (isCreatingNew) return
    if (live.prioridade === 'alta' || live.prioridade === 'critica') setManualPriority('alta')
    else if (live.prioridade === 'baixa') setManualPriority('quando_der')
    else setManualPriority('normal')
  }, [isCreatingNew, live.id, live.prioridade])

  useEffect(() =>
  {
    if (isCreatingNew || !live.id) return
    const prefs = loadTaskDrawerPrefs(live.id)
    setPlannedStart(prefs.dataInicioPlanejada)
  }, [isCreatingNew, live.id])

  const handlePlannedStartChange = (iso: string | null) =>
  {
    setPlannedStart(iso)
    if (!isCreatingNew && live.id > 0)
    {
      saveTaskDrawerPrefs(live.id, { dataInicioPlanejada: iso })
    }
  }

  useEffect(() =>
  {
    const onKey = (e: KeyboardEvent) =>
    {
      if (e.key === 'Escape') flushDraftAndClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () =>
    {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, isCreatingNew, titleDraft, descDraft, deadline, semPrazo, plannedStart, draftContexto, draftLabels, draftSubs])

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
      addEntry(`Título atualizado: «${next.slice(0, 80)}»`, 'progress')
    }
  }

  const saveDescription = async () =>
  {
    if (isCreatingNew) return
    if (canPersistServer)
    {
      const next = descDraft.trim() || ''
      if (next !== (live.notas_locais || live.descricao || '').trim())
      {
        await updateTarefa(live.id, { notas_locais: next })
        addEntry('Descrição atualizada', 'progress')
      }
    }
  }

  const handleAddSub = async () =>
  {
    const titulo = newSub.trim()
    if (!titulo) return
    if (isCreatingNew)
    {
      setDraftSubs((prev) => [
        ...prev,
        {
          id: -Date.now() - prev.length,
          titulo,
          concluida: false,
          ordem: prev.length,
        },
      ])
    }
    else if (isLocal)
    {
      addSub(titulo)
    }
    else if (canPersistServer)
    {
      await createSubtarefa(live.id, titulo)
    }
    setNewSub('')
  }

  const maybeCompleteByChecklist = (nextSubs: typeof subs) =>
  {
    if (isCreatingNew || live.status === 'concluida') return
    if (nextSubs.length === 0) return
    if (calcSubtaskProgress(nextSubs) < 100) return
    void axelCompleteTask({ ...live, subtarefas: nextSubs })
  }

  const handleDeleteSub = async (subId: number) =>
  {
    if (isCreatingNew)
    {
      setDraftSubs((prev) => prev.filter((s) => s.id !== subId))
      return
    }
    if (isLocal)
    {
      removeSub(subId)
      return
    }
    if (canPersistServer)
    {
      await deleteSubtarefa(subId, live.id)
    }
  }

  const handleToggleSub = async (subId: number, checked: boolean) =>
  {
    if (isCreatingNew)
    {
      const next = draftSubs.map((s) =>
        s.id === subId ? { ...s, concluida: !checked } : s,
      )
      setDraftSubs(next)
      maybeCompleteByChecklist(next)
      return
    }
    if (isLocal)
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
    if (!semPrazo && !deadline)
    {
      toast.error('Defina um prazo ou marque «Sem prazo definido»')
      return
    }
    setSubmitting(true)
    try
    {
      await createTarefa(titulo, descDraft.trim() || undefined)
      const created = useTaskStore.getState().tarefas[0]
      if (created)
      {
        const prioridade = manualPriorityToDb(manualPriority)
        if (prioridade !== created.prioridade)
        {
          await updateTarefa(created.id, { prioridade })
        }
        if (!semPrazo && deadline)
        {
          await updateTarefa(created.id, { data_vencimento: deadline })
        }

        let inicio = plannedStart
        if (manualPriority === 'alta' && !inicio)
        {
          inicio = startOfRegistrationDay(created.created_at)
        }
        if (inicio)
        {
          saveTaskDrawerPrefs(created.id, { dataInicioPlanejada: inicio })
        }

        if (draftContexto)
        {
          const ctxRow = draftContexto.id
            ? { id: draftContexto.id, titulo: draftContexto.titulo, cor: draftContexto.cor }
            : await createContexto(draftContexto.titulo, draftContexto.cor)
          if (ctxRow)
          {
            await setTaskContexto(created.id, ctxRow)
          }
        }
        for (const label of draftLabels)
        {
          await addLabelToTarefa(created.id, label.id)
        }
        for (const sub of draftSubs)
        {
          await createSubtarefa(created.id, sub.titulo)
        }
        migrateTaskActivityLog(-1, created.id)
        appendTaskActivityLog(created.id, 'Demanda criada e salva', 'progress')
        toast.success('Demanda criada')
        clearTaskCreateDraft()
        clearLocalSubtasks(CREATE_SUBTASK_SENTINEL)
        setDraftSubs([])
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

  const drawer = (
    <div className="fixed inset-0 z-[100] flex justify-end font-display" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={flushDraftAndClose}
        aria-label="Fechar painel"
      />

      <aside className={DRAWER_SHELL}>
        <div className="shrink-0 sticky top-0 z-10 flex items-center justify-between gap-2 px-5 py-2.5 border-b border-line bg-card">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {isCreatingNew ? (
              <span className="font-mono text-[10px] uppercase text-accent">
                Nova demanda
              </span>
            ) : (
              <>
                <span className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                  {HORIZON_LABELS[temporalHorizon]}
                </span>
                {inProgress && (
                  <span className="font-mono text-[10px] uppercase text-accent px-1.5 py-0.5 rounded-sl border border-accent/30">
                    Em progresso
                  </span>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={flushDraftAndClose}
            className="p-2 -mr-1 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="flex flex-col gap-5 w-full px-5 pt-6 pb-5 sm:pt-8 min-w-0">
            <input
              ref={titleRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => void saveTitle()}
              placeholder="Título da demanda…"
              className="w-full min-w-0 box-border text-xl font-display font-semibold text-ink bg-transparent border-none outline-none focus:ring-0 placeholder:text-ink-muted"
              aria-label="Título da tarefa"
            />

            {isCreatingNew && draftRestored && (
              <p className="text-[11px] text-ink-muted font-mono -mt-2">
                Rascunho restaurado — continue ou descarte no rodapé.
              </p>
            )}

            <AxelDrawerDetailsStrip
              tarefa={scorePreviewTask}
              deadline={deadline}
              semPrazo={isCreatingNew ? semPrazo : !deadline}
              onSemPrazoChange={isCreatingNew ? setSemPrazo : undefined}
              canPersist={canPersistServer}
              isCreatingNew={isCreatingNew}
              onDeadlineChange={setDeadline}
              plannedStart={plannedStart}
              onPlannedStartChange={handlePlannedStartChange}
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
                        addEntry(`Prazo aceito: ${accepted.proposedDue ? new Date(accepted.proposedDue).toLocaleString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}`, 'progress')
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
                  <li key={sub.id} className="group flex items-center gap-1 min-w-0">
                    <label className="flex items-center gap-3 py-1.5 cursor-pointer min-w-0 flex-1">
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
                    <button
                      type="button"
                      onClick={() => void handleDeleteSub(sub.id)}
                      className="p-1.5 rounded-sl text-ink-muted hover:text-urgente opacity-60 group-hover:opacity-100 shrink-0"
                      aria-label={`Remover ${sub.titulo}`}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex gap-2 min-w-0">
                <input
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) =>
                  {
                    if (e.key === 'Enter') void handleAddSub()
                  }}
                  placeholder="Nova sub-etapa…"
                  className="flex-1 min-w-0 box-border text-sm border border-line rounded-sl px-2.5 py-1.5 text-ink bg-transparent outline-none focus:border-accent/40 focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => void handleAddSub()}
                  disabled={!newSub.trim()}
                  className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-sl border border-line text-ink-muted hover:text-accent hover:border-accent/40 disabled:opacity-40 transition-colors"
                  title="Adicionar sub-etapa"
                  aria-label="Adicionar sub-etapa"
                >
                  <Plus size={16} strokeWidth={1.5} />
                </button>
              </div>
            </section>

            <AxelDrawerOrganizationSection
              tarefa={scorePreviewTask}
              allTasks={allTasks}
              canPersist={canPersistServer}
              isCreatingNew={isCreatingNew}
              manualPriority={manualPriority}
              onManualPriorityChange={handleManualPriorityChange}
              draftContexto={draftContexto}
              onDraftContextoChange={setDraftContexto}
              draftLabels={draftLabels}
              onDraftLabelsChange={setDraftLabels}
            />
          </div>
        </div>

        <footer className={`shrink-0 border-t border-line bg-card px-5 pt-3 ${AXEL_DRAWER_FOOTER_PB_MOBILE}`}>
          {isCreatingNew ? (
            <div className="space-y-3">
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted mb-2">
                  Histórico do rascunho
                </h3>
                <div
                  ref={logScrollRef}
                  className="max-h-[120px] overflow-y-auto custom-scrollbar space-y-1.5 min-w-0"
                >
                  {entries.length === 0 && (
                    <p className="text-xs text-ink-muted py-1">
                      Alterações em título, prazo e checklist aparecem aqui.
                    </p>
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
                <div className="mt-2">
                  <AxelDrawerQuickInput
                    onSubmit={(text) => addEntry(text, 'rascunho')}
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={submitting || !titleDraft.trim()}
                onClick={() => void handleCreateDemand()}
                className={`w-full h-10 text-sm font-mono uppercase tracking-wide ${AXEL_BTN_PRIMARY} disabled:opacity-40`}
              >
                {submitting ? 'Criando…' : 'Criar Demanda'}
              </button>
              {(draftRestored || draftHasContent()) && (
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="w-full py-2 text-[11px] font-mono uppercase text-ink-muted hover:text-atencao transition-colors"
                >
                  Descartar rascunho
                </button>
              )}
            </div>
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

  return createPortal(drawer, document.body)
}
