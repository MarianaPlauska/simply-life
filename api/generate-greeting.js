// GET /api/generate-greeting?lat=X&lon=Y
// Gera saudação contextual JARVIS cruzando clima + dados do user via Google Gemini
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // aceita dados via query (GET) ou body (POST)
  const data = req.method === 'POST' ? req.body : req.query;
  const {
    lat, lon,
    emailsUrgentes = 0,
    medsPendentes = 0,
    tarefasCriticas = 0,
    streak = 0,
    saldoMes = 0,
    proximoEvento = '',
  } = data;

  try {
    // 1. buscar clima real via Open-Meteo (grátis, sem key)
    let clima = null;
    if (lat && lon) {
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
        );
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          const cw = weatherData.current_weather;
          clima = {
            temperatura: Math.round(cw.temperature),
            codigo: cw.weathercode,
            chovendo: [51,53,55,61,63,65,80,81,82,95,96,99].includes(cw.weathercode),
          };
        }
      } catch { /* clima indisponível, segue sem */ }
    }

    // 2. determinar período do dia
    const hora = new Date().getHours();
    const periodo = hora < 12 ? 'manhã' : hora < 18 ? 'tarde' : 'noite';

    // 3. gerar saudação via Gemini
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Chave de API do Gemini não configurada. Configure GEMINI_API_KEY.');
    }

    const systemInstruction = `Você é o JARVIS, o assistente pessoal proativo, ultra tecnológico e empático do Simply-Life OS.
Gere uma saudação curta e marcante de EXATAMENTE 2 frases em PT-BR informal e natural.

Regras absolutas:
- Seja caloroso, empático e inteligente, como um assistente de ficção científica (Jarvis real)
- Priorize a informação mais urgente ou relevante no contexto fornecido
- Use no máximo 1 emoji temático
- Nunca ultrapasse 2 frases (curtas e diretas)
- Se está chovendo, mencione sutilmente para levar guarda-chuva ou ter cuidado
- Se há e-mails urgentes, mencione com tom de eficiência que você já filtrou/organizou a triagem
- Se o saldo financeiro mensal está negativo, avise de forma discreta, amigável e empática
- Se o streak de hábitos do usuário está alto, dê um breve incentivo energético para continuar
- Comece com "Bom dia!", "Boa tarde!" ou "Boa noite!" de acordo com o período indicado`;

    const userPrompt = `Contexto atual do usuário:
- Período: ${periodo}
- Clima atual: ${clima ? `${clima.temperatura}°C, ${clima.chovendo ? 'chovendo' : 'sem chuva'}` : 'indisponível'}
- E-mails urgentes a serem respondidos: ${emailsUrgentes}
- Medicamentos pendentes hoje: ${medsPendentes}
- Tarefas de prioridade crítica ativas: ${tarefasCriticas}
- Streak de hábitos saudáveis: ${streak} dias consecutivos
- Saldo financeiro do mês: R$ ${saldoMes}
- Próximo compromisso na agenda: ${proximoEvento || 'nenhum compromisso agendado'}`;

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
              parts: [{ text: userPrompt }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro na API do Gemini (${response.status}): ${errText}`);
    }

    const dataRes = await response.json();
    const greeting = dataRes.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      greeting: greeting.trim(),
      weather: clima,
      periodo,
    });
  } catch (err) {
    console.error('Greeting error with Gemini:', err);
    // fallback local sem IA
    const h = new Date().getHours();
    const fallback = h < 12 ? 'Bom dia! O Simply-Life OS está online. Bora produzir? 💪' : h < 18 ? 'Boa tarde! Vamos manter o foco e a produtividade.' : 'Boa noite! Pronto para revisar o dia e relaxar?';
    return res.status(200).json({ 
      greeting: fallback, 
      weather: null, 
      periodo: h < 12 ? 'manhã' : h < 18 ? 'tarde' : 'noite' 
    });
  }
}
