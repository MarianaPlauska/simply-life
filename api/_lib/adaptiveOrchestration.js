// Motor de Orquestração Adaptativa — espelho do frontend (ingest/API)

import { calculateUrgency } from './relevanceEngine.js';
import { getInfluenceWeight } from './influenceMap.js';

export { DEFAULT_INFLUENCE_MAP } from './influenceMap.js';
export { calculateUrgency, analyzeTitle } from './relevanceEngine.js';

export const DEFAULT_DAILY_SCORE_CAP = 400;

export function computeDailyLoadBalancer(hojeTasks, cap = DEFAULT_DAILY_SCORE_CAP)
{
  const result = new Map();
  const active = hojeTasks.filter((t) => t.status !== 'concluida');
  const sorted = [...active].sort(
    (a, b) => (b.score_urgencia ?? b.score ?? 0) - (a.score_urgencia ?? a.score ?? 0),
  );

  let sum = 0;

  for (const task of sorted)
  {
    const score = task.score_urgencia ?? task.score ?? 0;
    if (sum + score <= cap)
    {
      sum += score;
      result.set(task.id ?? task.task_id, { snoozed: false });
    }
    else
    {
      result.set(task.id ?? task.task_id, {
        snoozed: true,
        reason: 'Excesso de carga para hoje',
      });
    }
  }

  return result;
}

export function calculateAdaptiveUrgency(task, allTasks, sender)
{
  const base = calculateUrgency(task, sender);
  const active = allTasks.find((t) => t.status === 'em_progresso');
  let boost = 0;
  const notes = [];

  if (active && active.id !== task.id)
  {
    const aTag = (active.titulo || '').toLowerCase();
    const tTag = (task.titulo || task.title || '').toLowerCase();
    if (aTag.includes('refator') && tTag.includes('refator'))
    {
      boost = 5;
      notes.push('Prioridade ajustada para evitar sobrecarga de contexto.');
    }
  }

  const adjustedScore = Math.min(100, base.score + boost);
  const floor = base.intent?.forceMinScore;
  const withFloor = floor != null ? Math.max(adjustedScore, floor) : adjustedScore;

  return {
    ...base,
    adjustedScore: withFloor,
    orchestrationNotes: notes,
  };
}

void getInfluenceWeight;
