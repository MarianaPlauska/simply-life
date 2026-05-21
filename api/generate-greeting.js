import Groq from 'groq-sdk';

// GET /api/generate-greeting?lat=X&lon=Y
// Gera saudação contextual JARVIS cruzando clima + dados do user
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

    // 3. gerar saudação via Groq
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `Você é o JARVIS, o assistente pessoal proativo do Simply-Life OS.
Gere uma saudação de EXATAMENTE 2 frases em PT-BR informal.

Regras:
- Seja caloroso e empático, como um melhor amigo
- Priorize a informação mais urgente ou relevante
- Use no máximo 1 emoji
- Nunca mais de 2 frases
- Se está chovendo, sugira guarda-chuva ou vitamina C
- Se tem e-mails urgentes, mencione que traduziu/processou
- Se o saldo está negativo, avise com empatia
- Se tem streak alto, motive a continuar
- Comece com "Bom dia!", "Boa tarde!" ou "Boa noite!" conforme o período`
        },
        {
          role: 'user',
          content: `Contexto agora:
- Período: ${periodo}
- Clima: ${clima ? `${clima.temperatura}°C, ${clima.chovendo ? 'chovendo' : 'sem chuva'}` : 'indisponível'}
- E-mails urgentes: ${emailsUrgentes}
- Medicamentos pendentes: ${medsPendentes}
- Tarefas críticas: ${tarefasCriticas}
- Streak de hábitos: ${streak} dias
- Saldo mensal: R$ ${saldoMes}
- Próximo compromisso: ${proximoEvento || 'nenhum'}`
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const greeting = completion.choices[0]?.message?.content || '';

    return res.status(200).json({
      greeting: greeting.trim(),
      weather: clima,
      periodo,
    });
  } catch (err) {
    console.error('Greeting error:', err);
    // fallback local sem IA
    const h = new Date().getHours();
    const fallback = h < 12 ? 'Bom dia! Bora produzir? 💪' : h < 18 ? 'Boa tarde! Vamos manter o ritmo.' : 'Boa noite! Hora de revisar o dia.';
    return res.status(200).json({ greeting: fallback, weather: null, periodo: h < 12 ? 'manhã' : h < 18 ? 'tarde' : 'noite' });
  }
}
