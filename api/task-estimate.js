// POST /api/task-estimate — estimativa de esforço via Groq/Gemini (fallback local)

import { estimateTaskEffort } from './_lib/taskEstimateServer.js'

function cors(res)
{
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export default async function handler(req, res)
{
  cors(res)

  if (req.method === 'OPTIONS')
  {
    return res.status(204).end()
  }

  if (req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body || {}

  if (!body.titulo && !body.task)
  {
    return res.status(400).json({ error: 'titulo ou task obrigatório' })
  }

  const task = body.task || {}
  const payload = {
    titulo: String(body.titulo || task.titulo || ''),
    descricao: String(body.descricao ?? task.notas_locais ?? task.descricao ?? ''),
    prioridade: String(body.prioridade ?? task.prioridade ?? 'media'),
    status: String(body.status ?? task.status ?? 'pendente'),
    subtarefas: Array.isArray(body.subtarefas) ? body.subtarefas : (task.subtarefas || []),
    activityEntryCount: Number(body.activityEntryCount ?? 0),
    elapsedFocusMinutes: Number(body.elapsedFocusMinutes ?? 0),
    difficultySignal: Boolean(body.difficultySignal),
    score_urgencia: Number(body.score_urgencia ?? task.score_urgencia ?? 0),
  }

  const result = await estimateTaskEffort(payload)
  return res.status(200).json(result)
}
