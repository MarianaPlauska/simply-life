import type { TemporalHorizon } from './temporalHorizon'
import type { Subtarefa, TarefaUnificada } from '../types'

export type TaskCreateManualPriority = 'alta' | 'normal' | 'quando_der'

// Rascunho local de nova demanda - persiste ao fechar drawer ou trocar de tela

const STORAGE_KEY = 'simply-life:task-create-draft-v1'

export interface TaskCreateDraft
{
  title: string
  desc: string
  deadline: string | null
  semPrazo: boolean
  plannedStart: string | null
  manualPriority: TaskCreateManualPriority
  draftContexto: { id?: number; titulo: string; cor: string } | null
  draftLabels: NonNullable<TarefaUnificada['labels']>
  draftSubs: Subtarefa[]
  temporalHorizon: TemporalHorizon
  savedAt: string
}

export function loadTaskCreateDraft(): TaskCreateDraft | null
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TaskCreateDraft
    if (!parsed || typeof parsed !== 'object') return null
    return {
      title: String(parsed.title ?? ''),
      desc: String(parsed.desc ?? ''),
      deadline: parsed.semPrazo ? null : (parsed.deadline ?? null),
      semPrazo: Boolean(parsed.semPrazo),
      plannedStart: parsed.plannedStart ?? null,
      manualPriority: parsed.manualPriority ?? 'normal',
      draftContexto: parsed.draftContexto ?? null,
      draftLabels: Array.isArray(parsed.draftLabels) ? parsed.draftLabels : [],
      draftSubs: Array.isArray(parsed.draftSubs) ? parsed.draftSubs : [],
      temporalHorizon: parsed.temporalHorizon ?? 'backlog',
      savedAt: String(parsed.savedAt ?? ''),
    }
  }
  catch
  {
    return null
  }
}

export function saveTaskCreateDraft(draft: Omit<TaskCreateDraft, 'savedAt'>): void
{
  try
  {
    const payload: TaskCreateDraft = { ...draft, savedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }
  catch { /* quota */ }
}

export function clearTaskCreateDraft(): void
{
  try
  {
    localStorage.removeItem(STORAGE_KEY)
  }
  catch { /* ignore */ }
}

export function hasTaskCreateDraft(): boolean
{
  const d = loadTaskCreateDraft()
  if (!d) return false
  return Boolean(
    d.title.trim()
    || d.desc.trim()
    || d.deadline
    || d.plannedStart
    || d.draftContexto
    || d.draftLabels.length > 0
    || d.draftSubs.length > 0,
  )
}
