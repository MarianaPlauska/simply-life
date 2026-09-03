import { useEffect, useMemo, useState } from 'react'
import { Bell, ChevronRight, FolderOpen, Link2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { ContextoCombobox } from './ContextoCombobox'
import {
  setTaskContexto,
  type ContextoRow,
} from '../../lib/taskContextService'
import { loadTaskDrawerPrefs, saveTaskDrawerPrefs } from '../../lib/taskDrawerPrefs'
import type { TarefaUnificada } from '../../types'

// Cores pré-definidas para pasta e flags (máx. 5 flags por tarefa)

export const DRAWER_FLAG_COLORS = [
  '#38B2AC',
  '#4A7C59',
  '#5B7FA6',
  '#9B2C2C',
  '#7C5A9E',
] as const

const MAX_FLAGS = 3

function normalizeCor(cor: string): string
{
  return cor.trim().toUpperCase()
}

type ManualPriority = 'alta' | 'normal' | 'quando_der'

const PRIORITY_OPTIONS: { id: ManualPriority; label: string; db: TarefaUnificada['prioridade'] }[] = [
  { id: 'alta', label: 'Alta', db: 'alta' },
  { id: 'normal', label: 'Normal', db: 'media' },
  { id: 'quando_der', label: 'Quando der', db: 'baixa' },
]

interface AxelDrawerOrganizationSectionProps
{
  tarefa: TarefaUnificada
  allTasks: TarefaUnificada[]
  canPersist: boolean
  isCreatingNew: boolean
  manualPriority: ManualPriority
  onManualPriorityChange: (p: ManualPriority) => void
  draftContexto: { id?: number; titulo: string; cor: string } | null
  onDraftContextoChange: (ctx: { id?: number; titulo: string; cor: string } | null) => void
  draftLabels?: TarefaUnificada['labels']
  onDraftLabelsChange?: (labels: TarefaUnificada['labels']) => void
}

export function AxelDrawerOrganizationSection({
  tarefa,
  allTasks,
  canPersist,
  isCreatingNew,
  manualPriority,
  onManualPriorityChange,
  draftContexto,
  onDraftContextoChange,
  draftLabels = [],
  onDraftLabelsChange,
}: AxelDrawerOrganizationSectionProps)
{
  const labels = useTaskStore((s) => s.labels)
  const fetchLabels = useTaskStore((s) => s.fetchLabels)
  const createLabel = useTaskStore((s) => s.createLabel)
  const addLabelToTarefa = useTaskStore((s) => s.addLabelToTarefa)
  const removeLabelFromTarefa = useTaskStore((s) => s.removeLabelFromTarefa)
  const updateTarefa = useTaskStore((s) => s.updateTarefa)
  const patchTarefaLocal = useTaskStore((s) => s.patchTarefaLocal)

  const [pastaInput, setPastaInput] = useState('')
  const [pastaColor, setPastaColor] = useState<string>(DRAWER_FLAG_COLORS[0])
  const [newFlagName, setNewFlagName] = useState('')
  const [newFlagColor, setNewFlagColor] = useState<string>(DRAWER_FLAG_COLORS[0])
  const [blockedId, setBlockedId] = useState<number | ''>('')
  const [lembrete, setLembrete] = useState(false)
  const [open, setOpen] = useState(false)

  const taskLabels = isCreatingNew ? draftLabels : (tarefa.labels ?? [])
  const activeContexto = isCreatingNew
    ? draftContexto
    : tarefa.contexto ?? null

  const coresEmUsoLista = useMemo(() =>
  {
    const list: string[] = []
    const seen = new Set<string>()
    for (const l of taskLabels)
    {
      const key = normalizeCor(l.cor)
      if (seen.has(key)) continue
      seen.add(key)
      list.push(l.cor)
    }
    if (activeContexto?.cor)
    {
      const key = normalizeCor(activeContexto.cor)
      if (!seen.has(key))
      {
        list.push(activeContexto.cor)
      }
    }
    return list
  }, [taskLabels, activeContexto?.cor])

  const coresDisponiveis = useMemo(
    () => DRAWER_FLAG_COLORS.filter(
      (c) => !coresEmUsoLista.some((u) => normalizeCor(u) === normalizeCor(c)),
    ),
    [coresEmUsoLista],
  )

  useEffect(() =>
  {
    if (coresDisponiveis.length === 0) return
    const ok = coresDisponiveis.some((c) => normalizeCor(c) === normalizeCor(newFlagColor))
    if (!ok)
    {
      setNewFlagColor(coresDisponiveis[0])
    }
  }, [coresDisponiveis, newFlagColor])

  const blockerOptions = useMemo(
    () => allTasks.filter((t) => t.id !== tarefa.id && t.status !== 'concluida'),
    [allTasks, tarefa.id],
  )

  useEffect(() =>
  {
    void fetchLabels()
  }, [fetchLabels])

  useEffect(() =>
  {
    if (isCreatingNew) return
    const prefs = loadTaskDrawerPrefs(tarefa.id)
    setBlockedId(prefs.blockedBy[0] ?? '')
    setLembrete(prefs.lembreteNoPrazo)
    const dep = prefs.blockedBy.map(String)
    if (dep.length > 0)
    {
      patchTarefaLocal(tarefa.id, { blockedBy: dep })
    }
  }, [isCreatingNew, tarefa.id, patchTarefaLocal])

  useEffect(() =>
  {
    if (activeContexto?.titulo)
    {
      setPastaInput(activeContexto.titulo)
      setPastaColor(activeContexto.cor)
    }
  }, [activeContexto?.titulo, activeContexto?.cor])

  const syncFolderFlag = async (ctx: ContextoRow) =>
  {
    const already = taskLabels.some((l) => l.nome.toLowerCase() === ctx.titulo.toLowerCase())
    if (already) return

    if (taskLabels.length >= MAX_FLAGS)
    {
      toast.message(`Máximo de ${MAX_FLAGS} flags - remova uma para usar a pasta como flag`)
      return
    }

    let label = labels.find((l) => l.nome.toLowerCase() === ctx.titulo.toLowerCase())
    if (!label)
    {
      await createLabel(ctx.titulo, ctx.cor)
      label = useTaskStore.getState().labels.find((l) => l.nome.toLowerCase() === ctx.titulo.toLowerCase())
    }
    if (!label) return

    if (isCreatingNew)
    {
      onDraftLabelsChange?.([...taskLabels, label])
    }
    else if (canPersist && !taskLabels.some((l) => l.id === label!.id))
    {
      await addLabelToTarefa(tarefa.id, label.id)
    }
  }

  const applyContexto = async (ctx: ContextoRow | null) =>
  {
    if (isCreatingNew)
    {
      onDraftContextoChange(ctx ? { id: ctx.id, titulo: ctx.titulo, cor: ctx.cor } : null)
      return
    }
    if (!canPersist) return

    const ok = await setTaskContexto(tarefa.id, ctx)
    if (!ok)
    {
      toast.error('Não foi possível atualizar a pasta')
      return
    }
    patchTarefaLocal(tarefa.id, { contexto: ctx ? { titulo: ctx.titulo, cor: ctx.cor } : undefined })
  }

  const handlePastaSelect = async (ctx: ContextoRow | null) =>
  {
    if (ctx)
    {
      setPastaInput(ctx.titulo)
      setPastaColor(ctx.cor)
      await applyContexto(ctx)
      await syncFolderFlag(ctx)
      return
    }
    if (!pastaInput.trim())
    {
      await applyContexto(null)
    }
  }

  const handlePriority = async (opt: typeof PRIORITY_OPTIONS[number]) =>
  {
    onManualPriorityChange(opt.id)
    if (isCreatingNew || !canPersist) return
    await updateTarefa(tarefa.id, { prioridade: opt.db })
  }

  const handleAddFlag = async () =>
  {
    const nome = newFlagName.trim()
    if (!nome) return
    if (taskLabels.length >= MAX_FLAGS)
    {
      toast.message(`Máximo de ${MAX_FLAGS} flags`)
      return
    }

    let label = labels.find((l) => l.nome.toLowerCase() === nome.toLowerCase())
    if (!label)
    {
      await createLabel(nome, newFlagColor)
      label = useTaskStore.getState().labels.find((l) => l.nome.toLowerCase() === nome.toLowerCase())
    }
    if (!label) return

    if (isCreatingNew)
    {
      onDraftLabelsChange?.([...taskLabels, label])
    }
    else if (canPersist && !taskLabels.some((l) => l.id === label!.id))
    {
      await addLabelToTarefa(tarefa.id, label.id)
    }
    setNewFlagName('')
  }

  const handleRemoveFlag = async (labelId: number) =>
  {
    if (isCreatingNew)
    {
      onDraftLabelsChange?.(taskLabels.filter((l) => l.id !== labelId))
      return
    }
    if (canPersist) await removeLabelFromTarefa(tarefa.id, labelId)
  }

  const handleBlockedChange = (raw: string) =>
  {
    const id = raw ? Number(raw) : ''
    setBlockedId(id)
    const blockedBy = id ? [String(id)] : []
    if (!isCreatingNew && canPersist)
    {
      saveTaskDrawerPrefs(tarefa.id, { blockedBy: id ? [id] : [] })
      patchTarefaLocal(tarefa.id, { blockedBy })
    }
  }

  const handleLembreteToggle = () =>
  {
    const next = !lembrete
    setLembrete(next)
    if (!isCreatingNew && canPersist)
    {
      saveTaskDrawerPrefs(tarefa.id, { lembreteNoPrazo: next })
    }
    if (next && !tarefa.data_vencimento)
    {
      toast.message('Defina um prazo para o lembrete funcionar')
    }
  }

  const priorityLabel = PRIORITY_OPTIONS.find((o) => o.id === manualPriority)?.label ?? 'Normal'

  return (
    <section className="min-w-0 border-t border-line pt-4" aria-label="Organização">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-left group"
        aria-expanded={open}
      >
        <ChevronRight
          size={14}
          className={`text-ink-muted shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
          aria-hidden
        />
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted flex-1">
          Organização
        </h3>
        {!open && (
          <span className="font-mono text-[10px] text-ink-muted truncate max-w-[55%]">
            {[activeContexto?.titulo, priorityLabel, taskLabels.length ? `${taskLabels.length} flags` : null]
              .filter(Boolean)
              .join(' · ') || 'Opcional'}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3 pl-5">
          <div className="rounded-sl border border-line/80 bg-chrome/10 p-3 space-y-3">
            <div className="flex items-center gap-2 text-ink-muted">
              <FolderOpen size={12} aria-hidden />
              <span className="font-mono text-[10px] uppercase tracking-wider">Pasta & flags</span>
            </div>

            <div className="space-y-1.5">
              <span className="font-mono text-[9px] uppercase text-ink-muted">Pasta</span>
              <ContextoCombobox
                value={pastaInput}
                color={pastaColor}
                onValueChange={setPastaInput}
                onColorChange={setPastaColor}
                onSelect={(ctx) => void handlePastaSelect(ctx)}
              />
            </div>

            <div className="space-y-1.5 pt-1 border-t border-line/60">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-ink-muted">
                  <Tag size={12} aria-hidden />
                  <span className="font-mono text-[9px] uppercase tracking-wider">Flags</span>
                </div>
                <span className="font-mono text-[9px] text-ink-muted tabular-nums">
                  {taskLabels.length}/{MAX_FLAGS}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {taskLabels.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => void handleRemoveFlag(l.id)}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-sl border"
                    style={{ borderColor: l.cor, color: l.cor }}
                    title="Remover flag"
                  >
                    {l.nome} ×
                  </button>
                ))}
              </div>
              {taskLabels.length < MAX_FLAGS && (
                <>
                  {coresEmUsoLista.length > 0 && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[8px] uppercase text-ink-muted shrink-0 w-12">
                        Em uso
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {coresEmUsoLista.map((cor) => (
                          <span
                            key={`uso-${cor}`}
                            className="w-4 h-4 rounded-full border-2 border-ink shrink-0"
                            style={{ backgroundColor: cor }}
                            title="Cor da pasta ou flag já aplicada"
                            aria-hidden
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {coresDisponiveis.length > 0 && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[8px] uppercase text-ink-muted shrink-0 w-12">
                        Próxima
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {coresDisponiveis.map((cor) =>
                        {
                          const selecionada = normalizeCor(newFlagColor) === normalizeCor(cor)
                          return (
                            <button
                              key={`flag-${cor}`}
                              type="button"
                              onClick={() => setNewFlagColor(cor)}
                              className={`w-4 h-4 rounded-full border-2 transition-transform ${
                                selecionada ? 'border-ink scale-110' : 'border-transparent hover:border-ink/40'
                              }`}
                              style={{ backgroundColor: cor }}
                              aria-label={`Cor da próxima flag ${cor}`}
                              aria-pressed={selecionada}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={newFlagName}
                      onChange={(e) => setNewFlagName(e.target.value)}
                      onKeyDown={(e) =>
                      {
                        if (e.key === 'Enter') void handleAddFlag()
                      }}
                      placeholder="Nova flag…"
                      className="flex-1 min-w-0 text-sm border border-line rounded-sl px-2.5 py-1.5 bg-transparent outline-none focus:border-accent/40"
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddFlag()}
                      className="shrink-0 px-2.5 py-1.5 text-xs font-mono uppercase border border-line rounded-sl text-ink-muted hover:text-accent"
                    >
                      +
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Prioridade manual
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => void handlePriority(opt)}
              className={`px-2.5 py-1.5 rounded-sl text-[11px] font-mono border transition-colors ${
                manualPriority === opt.id
                  ? 'bg-accent-muted border-accent/40 text-accent'
                  : 'border-line text-ink-muted hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
          </div>

          <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-ink-muted">
          <Link2 size={12} aria-hidden />
          <span className="font-mono text-[10px] uppercase tracking-wider">Bloqueado por</span>
        </div>
        <select
          value={blockedId}
          onChange={(e) => handleBlockedChange(e.target.value)}
          className="w-full text-xs border border-line rounded-sl px-2.5 py-1.5 bg-chrome/25 text-ink outline-none focus:border-accent/40"
          aria-label="Tarefa predecessora"
        >
          <option value="">Nenhuma</option>
          {blockerOptions.map((t) => (
            <option key={t.id} value={t.id}>
              #{t.id} · {t.titulo.slice(0, 48)}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
        <input
          type="checkbox"
          checked={lembrete}
          onChange={handleLembreteToggle}
          className="h-4 w-4 rounded border-line accent-accent"
        />
        <Bell size={14} className="text-ink-muted shrink-0" aria-hidden />
        <span className="text-sm text-ink">Notificar no prazo</span>
      </label>
        </div>
      )}
    </section>
  )
}

export function manualPriorityToDb(p: ManualPriority): TarefaUnificada['prioridade']
{
  const opt = PRIORITY_OPTIONS.find((o) => o.id === p)
  return opt?.db ?? 'media'
}

export type { ManualPriority }
