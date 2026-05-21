import Groq from 'groq-sdk';

// POST /api/process-event
// Recebe um evento raw e retorna resumo + score + ação sugerida
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sender, subject, body, userKeywords } = req.body;

  if (!subject && !body) {
    return res.status(400).json({ error: 'subject ou body obrigatório' });
  }

  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const keywordsList = (userKeywords || []).join(', ');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente de triagem de e-mails. Analise a mensagem e retorne APENAS um JSON válido (sem markdown, sem backticks):
{
  "resumo": "resumo em 1 frase em PT-BR informal",
  "idioma_detectado": "código ISO do idioma original (en, pt, es, etc)",
  "acao": "responder|fazer|agendar|ignorar",
  "score_urgencia": número de 0 a 100,
  "keywords_detectadas": ["keyword1", "keyword2"]
}

Regras de score:
- Palavras como "urgente", "ASAP", "deadline", "bloqueado" = +30
- Remetente parece ser chefe/diretor/gerente = +20  
- Tem prazo explícito (amanhã, sexta, até dia X) = +20
- Pede aprovação ou decisão = +15
- É FYI, newsletter, notificação automática = -40
- É spam ou marketing = score 0

Keywords do usuário para detectar: ${keywordsList || 'nenhuma definida'}

IMPORTANTE: Retorne APENAS o JSON, sem texto extra.`
        },
        {
          role: 'user',
          content: `De: ${sender || 'Desconhecido'}
Assunto: ${subject || '(sem assunto)'}
Corpo: ${(body || '').substring(0, 800)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    
    // tenta parsear o JSON, com fallback seguro
    let result;
    try {
      // remove possíveis backticks markdown
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = {
        resumo: `Mensagem de ${sender || 'alguém'}: ${(subject || body || '').substring(0, 100)}`,
        idioma_detectado: 'pt',
        acao: 'ignorar',
        score_urgencia: 30,
        keywords_detectadas: [],
      };
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Groq error:', err);
    return res.status(500).json({ error: 'Falha no processamento IA', details: err.message });
  }
}
