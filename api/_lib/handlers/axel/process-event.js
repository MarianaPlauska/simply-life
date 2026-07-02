// POST /api/process-event — triagem de evento via IA (servidor)
// Exige JWT Supabase

import { applyCors } from '../../cors.js';
import { getUserFromBearer } from '../../supabaseUser.js';

export default async function handler(req, res)
{
  applyCors(req, res, {
    methods: 'POST, OPTIONS',
    headers: 'Content-Type, Authorization',
  });

  if (req.method === 'OPTIONS')
  {
    return res.status(204).end();
  }

  if (req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUserFromBearer(req);
  if (!user)
  {
    return res.status(401).json({ error: 'Não autenticado — envie Authorization: Bearer <jwt>' });
  }

  const { sender, subject, body, userKeywords } = req.body;

  if (!subject && !body)
  {
    return res.status(400).json({ error: 'subject ou body obrigatório' });
  }

  try
  {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey)
    {
      throw new Error('Chave de API do Gemini não configurada. Configure GEMINI_API_KEY nas variáveis de ambiente.');
    }

    const keywordsList = (userKeywords || []).join(', ');

    const systemInstruction = `Você é um assistente de triagem de e-mails do Simply-Life OS (um sistema JARVIS autônomo). Analise a mensagem recebida e retorne um JSON estruturado seguindo exatamente este formato:
{
  "resumo": "resumo em 1 frase em PT-BR informal e direto",
  "idioma_detectado": "código ISO do idioma original (en, pt, es, etc)",
  "acao": "responder|fazer|agendar|ignorar",
  "score_urgencia": número de 0 a 100,
  "keywords_detectadas": ["keyword1", "keyword2"]
}

Regras de pontuação do score_urgencia (soma cumulativa, máx 100):
- Presença de palavras de urgência explícita ("urgente", "urgência", "ASAP", "deadline", "urgência", "bloqueado", "impedimento", "imediato") = +30
- Remetente parece ser chefe, diretor, gerente, cliente importante ou órgão oficial = +20  
- Menção a prazos explícitos de entrega ("amanhã", "hoje", "sexta", "até as X horas", "dia DD/MM") = +20
- Solicitação explícita de aprovação, feedback urgente ou tomada de decisão crucial = +15
- Mensagem informativa (FYI), newsletter, notificação automática, aviso geral = -40
- Spam óbvio, propaganda, marketing de massa = score fixado em 0

Keywords do usuário para detectar e incluir no array "keywords_detectadas" se encontradas no assunto ou corpo: [${keywordsList || 'nenhuma definida'}]`;

    const userPrompt = `De: ${sender || 'Desconhecido'}
Assunto: ${subject || '(sem assunto)'}
Corpo: ${(body || '').substring(0, 1000)}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok)
    {
      const errText = await response.text();
      throw new Error(`Erro na API do Gemini (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let result;
    try
    {
      result = JSON.parse(text.trim());
    }
    catch
    {
      result = {
        resumo: `Mensagem de ${sender || 'alguém'}: ${(subject || body || '').substring(0, 100)}`,
        idioma_detectado: 'pt',
        acao: 'ignorar',
        score_urgencia: 30,
        keywords_detectadas: [],
      };
    }

    return res.status(200).json(result);
  }
  catch (err)
  {
    console.error('Gemini Triagem error:', err);
    return res.status(500).json({ error: 'Falha no processamento da IA com Gemini', details: err.message });
  }
}
