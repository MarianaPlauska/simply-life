/** Exposição gradual (TCC) — hierarquia de evitação e um passo no Kanban. */

export type ExposureHierarchyStep = {
  id: string
  label: string
  /** 0–10 subjetivo */
  anxiety: number
}

export type GradualExposureDraft = {
  situation: string
  steps: ExposureHierarchyStep[]
  chosenStepId: string
}

export type GradualExposureEntry = GradualExposureDraft & {
  id: string
  createdAt: string
}

export function emptyGradualExposureDraft(): GradualExposureDraft
{
  return {
    situation: '',
    steps: [],
    chosenStepId: '',
  }
}

export function newExposureStep(label = '', anxiety = 5): ExposureHierarchyStep
{
  return {
    id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    anxiety,
  }
}

export function sortExposureSteps(steps: ExposureHierarchyStep[]): ExposureHierarchyStep[]
{
  return [...steps].sort((a, b) => a.anxiety - b.anxiety || a.label.localeCompare(b.label))
}

export function pickDefaultExposureStep(steps: ExposureHierarchyStep[]): ExposureHierarchyStep | null
{
  const sorted = sortExposureSteps(steps.filter((s) => s.label.trim()))
  return sorted[0] ?? null
}

export function gradualExposureTaskNotes(entry: GradualExposureDraft, stepLabel: string): string
{
  const lines = ['[TCC · Exposição gradual]']
  if (entry.situation.trim())
  {
    lines.push(`Situação: ${entry.situation.trim()}`)
  }
  lines.push(`Passo de hoje: ${stepLabel}`)
  return lines.join('\n')
}

export function gradualExposureToMarkdown(entry: GradualExposureEntry): string
{
  const chosen = entry.steps.find((s) => s.id === entry.chosenStepId)
  const hierarchy = sortExposureSteps(entry.steps)
    .map((s) => `- ${s.label.trim()} (ansiedade ${s.anxiety}/10)${s.id === entry.chosenStepId ? ' ← passo escolhido' : ''}`)
    .join('\n')

  return [
    '# Exposição gradual (TCC)',
    '',
    `**Data:** ${new Date(entry.createdAt).toLocaleString('pt-BR')}`,
    '',
    '## Situação evitada',
    entry.situation.trim() || '—',
    '',
    '## Hierarquia',
    hierarchy || '—',
    '',
    '## Passo de hoje',
    chosen?.label.trim() || '—',
    '',
    '_Um passo foi adicionado às tarefas. Avance no seu ritmo — não substitui psicoterapia._',
  ].join('\n')
}

export function gradualExposureDiaryTitle(entry: GradualExposureEntry): string
{
  const step = entry.steps.find((s) => s.id === entry.chosenStepId)
  const snippet = step?.label.trim().slice(0, 44) ?? entry.situation.trim().slice(0, 44)
  return snippet
    ? `TCC exposição: ${snippet}${(step?.label.length ?? 0) > 44 ? '…' : ''}`
    : 'Exposição gradual'
}
