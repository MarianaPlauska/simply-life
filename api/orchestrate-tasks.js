// POST /api/orchestrate-tasks — priorização em lote com IA (Groq/Gemini no servidor)

import { orchestrateTasksBatch } from './_lib/urgencyOrchestrator.js';

function cors(res)
{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function hasServerAiKeys()
{
  return Boolean(
    process.env.GROQ_API_KEY
    || process.env.GEMINI_API_KEY
    || process.env.GOOGLE_API_KEY,
  );
}

export default async function handler(req, res)
{
  cors(res);

  if (req.method === 'OPTIONS')
  {
    return res.status(204).end();
  }

  if (req.method === 'GET')
  {
    return res.status(200).json({
      intelligence: hasServerAiKeys() ? 'ai_ready' : 'local_only',
      providers: {
        groq: Boolean(process.env.GROQ_API_KEY),
        gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      },
    });
  }

  if (req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try
  {
    const { tasks } = req.body ?? {};

    if (!Array.isArray(tasks) || tasks.length === 0)
    {
      return res.status(400).json({ error: 'Campo tasks (array) é obrigatório' });
    }

    const capped = tasks.slice(0, 80);
    const result = await orchestrateTasksBatch(capped);

    return res.status(200).json({
      scores: result.scores,
      source: result.source,
      intelligence: result.source === 'ai' ? 'ai' : 'local',
    });
  }
  catch (err)
  {
    console.error('[orchestrate-tasks]', err);
    return res.status(500).json({ error: err?.message || 'Falha na orquestração' });
  }
}
