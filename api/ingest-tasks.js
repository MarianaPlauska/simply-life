// POST /api/ingest-tasks
// Motor de Triagem Ativa — recebe itens brutos, processa via Gemini IA,
// aplica o Score Matemático de Urgência e insere no Supabase como UnifiedTask.
//
// Fórmula do Score:
//   score = base_origem + modificadores_contexto + fator_temporal
//   - base_origem: reunião(50), github_issue(30), email(15), manual(10)
//   - modificadores: vip(+25), urgente(+30), bug/critico(+20), newsletter(-40)
//   - temporal: dias_desde_criacao * 2 (max +20)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// pesos base por origem
const ORIGIN_WEIGHTS = {
  meeting:      50,
  google_cal:   50,
  github_issue: 30,
  github_pr:    35,
  gmail:        15,
  email:        15,
  manual:       10,
};

// palavras que elevam o score (detectadas pela IA ou por regex local)
const URGENCY_KEYWORDS = [
  'urgente', 'urgent', 'asap', 'bloqueado', 'blocked', 'impedimento',
  'deadline', 'critical', 'critico', 'crítico', 'produção', 'production',
  'hotfix', 'p0', 'p1', 'downtime', 'fora do ar',
];

const NOISE_KEYWORDS = [
  'newsletter', 'unsubscribe', 'descadastrar', 'marketing',
  'promoção', 'promo', 'spam', 'noreply', 'no-reply',
];

function calcBaseScore(origem) {
  return ORIGIN_WEIGHTS[origem] || ORIGIN_WEIGHTS.manual;
}

function calcContextModifiers(aiFlags, rawText) {
  let mod = 0;
  const textLower = (rawText || '').toLowerCase();

  // modificadores positivos da IA
  if (aiFlags.is_urgent) mod += 30;
  if (aiFlags.is_vip)    mod += 25;
  if (aiFlags.is_bug)    mod += 20;

  // detecção local por regex (fallback e reforço)
  const hasUrgency = URGENCY_KEYWORDS.some((kw) => textLower.includes(kw));
  if (hasUrgency && !aiFlags.is_urgent) mod += 15;

  // penalidades por ruído
  const isNoise = NOISE_KEYWORDS.some((kw) => textLower.includes(kw));
  if (isNoise) mod -= 40;
  if (aiFlags.is_noise) mod -= 30;

  return mod;
}

function calcTemporalFactor(createdAtISO) {
  if (!createdAtISO) return 0;
  const diffMs = Date.now() - new Date(createdAtISO).getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return Math.min(diffDays * 2, 20); // max +20
}

function clampScore(score) {
  return Math.max(0, Math.min(100, score));
}

function mapScoreToPrioridade(score) {
  if (score >= 80) return 'critica';
  if (score >= 55) return 'alta';
  if (score >= 30) return 'media';
  return 'baixa';
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, user_id } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items[] obrigatório (array de itens brutos)' });
  }
  if (!user_id) {
    return res.status(400).json({ error: 'user_id obrigatório' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor' });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Variáveis do Supabase não configuradas' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const results = [];

    for (const item of items) {
      const { sender, subject, body, origem, created_at } = item;
      const rawText = `${sender || ''} ${subject || ''} ${body || ''}`;
      const itemOrigem = origem || 'email';

      // ── ETAPA 1: Gemini IA — extração semântica ──
      let aiResult = {
        titulo: subject || '(sem título)',
        snippet: (body || subject || '').substring(0, 100),
        is_urgent: false,
        is_vip: false,
        is_bug: false,
        is_noise: false,
        acao: 'fazer',
      };

      try {
        const systemInstruction = `Você é o motor de triagem do Simply-Life OS. Analise a mensagem e retorne APENAS um JSON puro:
{
  "titulo": "título acionável curto em PT-BR (max 80 chars)",
  "snippet": "resumo em 1 frase curta (max 100 chars)",
  "is_urgent": true/false,
  "is_vip": true/false,
  "is_bug": true/false,
  "is_noise": true/false,
  "acao": "responder|fazer|agendar|ignorar"
}

Regras:
- titulo: Deve ser uma ação clara, não o assunto do email. Ex: "Revisar contrato do cliente X" em vez de "Re: Contrato".
- is_vip: true se o remetente parece ser chefe, cliente VIP, diretor, ou stakeholder importante.
- is_bug: true se menciona bug, erro, crash, falha, incidente, hotfix.
- is_noise: true se é newsletter, marketing, notificação automática genérica, spam.
- snippet: Resumo rápido do conteúdo em linguagem natural e informal.`;

        const userPrompt = `De: ${sender || 'Desconhecido'}
Assunto: ${subject || '(vazio)'}
Corpo: ${(body || '').substring(0, 1500)}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 300,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const parsed = JSON.parse(text.trim());
          aiResult = { ...aiResult, ...parsed };
        }
      } catch (aiErr) {
        console.warn('Gemini IA fallback para item:', subject, aiErr.message);
        // segue com valores padrão — motor matemático ainda funciona
      }

      // ── ETAPA 2: Motor de Score Matemático ──
      const baseScore    = calcBaseScore(itemOrigem);
      const contextMod   = calcContextModifiers(aiResult, rawText);
      const temporalMod  = calcTemporalFactor(created_at);
      const finalScore   = clampScore(baseScore + contextMod + temporalMod);
      const prioridade   = mapScoreToPrioridade(finalScore);

      // ── ETAPA 3: Inserção no Supabase ──
      const { data: inserted, error: insertErr } = await supabase
        .from('tarefas_unificadas')
        .insert({
          user_id,
          titulo:           aiResult.titulo,
          descricao:        body || subject || null,
          snippet_100_char: (aiResult.snippet || '').substring(0, 100),
          score_urgencia:   finalScore,
          status:           'pendente',
          prioridade,
          origem:           itemOrigem,
          notas_locais:     null,
        })
        .select()
        .single();

      if (insertErr) {
        console.error('Supabase insert error:', insertErr);
        results.push({ success: false, subject, error: insertErr.message });
      } else {
        results.push({
          success: true,
          id: inserted.id,
          titulo: inserted.titulo,
          score_urgencia: finalScore,
          prioridade,
          breakdown: {
            base: baseScore,
            context: contextMod,
            temporal: temporalMod,
            origem: itemOrigem,
          },
          ai_flags: {
            is_urgent: aiResult.is_urgent,
            is_vip: aiResult.is_vip,
            is_bug: aiResult.is_bug,
            is_noise: aiResult.is_noise,
            acao: aiResult.acao,
          },
        });
      }
    }

    return res.status(200).json({
      processed: results.length,
      results,
    });
  } catch (err) {
    console.error('ingest-tasks fatal:', err);
    return res.status(500).json({ error: 'Erro no motor de triagem', details: err.message });
  }
}
