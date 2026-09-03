// serviço de clima usando Open-Meteo (100% gratuito, sem API key)
// https://open-meteo.com - sem limites para uso pessoal

export interface WeatherData
{
  temperature: number;       // °C
  description: string;       // "ensolarado", "nublado", etc
  icon: string;              // emoji
  isRaining: boolean;
  windSpeed: number;         // km/h
  city?: string;
}

// mapa de WMO weather codes para descrição em PT-BR + emoji
const WMO_CODES: Record<number, { desc: string; icon: string; rain: boolean }> = {
  0:  { desc: 'Céu limpo',        icon: '☀️', rain: false },
  1:  { desc: 'Quase limpo',      icon: '🌤️', rain: false },
  2:  { desc: 'Parcialmente nublado', icon: '⛅', rain: false },
  3:  { desc: 'Nublado',          icon: '☁️', rain: false },
  45: { desc: 'Nevoeiro',         icon: '🌫️', rain: false },
  48: { desc: 'Nevoeiro gelado',  icon: '🌫️', rain: false },
  51: { desc: 'Garoa leve',       icon: '🌦️', rain: true },
  53: { desc: 'Garoa',            icon: '🌦️', rain: true },
  55: { desc: 'Garoa forte',      icon: '🌧️', rain: true },
  61: { desc: 'Chuva leve',       icon: '🌧️', rain: true },
  63: { desc: 'Chuva',            icon: '🌧️', rain: true },
  65: { desc: 'Chuva forte',      icon: '⛈️', rain: true },
  71: { desc: 'Neve leve',        icon: '🌨️', rain: false },
  73: { desc: 'Neve',             icon: '❄️', rain: false },
  75: { desc: 'Neve forte',       icon: '❄️', rain: false },
  80: { desc: 'Pancadas de chuva', icon: '🌦️', rain: true },
  81: { desc: 'Pancadas moderadas', icon: '🌧️', rain: true },
  82: { desc: 'Pancadas fortes',  icon: '⛈️', rain: true },
  95: { desc: 'Tempestade',       icon: '⛈️', rain: true },
  96: { desc: 'Tempestade com granizo', icon: '⛈️', rain: true },
  99: { desc: 'Tempestade forte com granizo', icon: '⛈️', rain: true },
};

function getWeatherInfo(code: number)
{
  return WMO_CODES[code] || { desc: 'Indisponível', icon: '🌡️', rain: false };
}

// busca geolocalização do browser
export function getUserLocation(): Promise<{ lat: number; lon: number }>
{
  return new Promise((resolve, reject) =>
  {
    if (!navigator.geolocation)
    {
      reject(new Error('Geolocalização não suportada'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 10000, maximumAge: 300000 } // cache de 5 min
    );
  });
}

// reverse geocoding gratuito via BigDataCloud
async function reverseGeocode(lat: number, lon: number): Promise<string>
{
  try
  {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
    );
    if (!res.ok) return '';
    const data = await res.json();
    return data.city || data.locality || data.principalSubdivision || '';
  }
  catch
  {
    return '';
  }
}

// busca clima atual via Open-Meteo (100% grátis, sem key)
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData>
{
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
  );

  if (!res.ok) throw new Error(`Weather API: ${res.status}`);

  const data = await res.json();
  const cw = data.current_weather;
  const info = getWeatherInfo(cw.weathercode);
  const city = await reverseGeocode(lat, lon);

  return {
    temperature: Math.round(cw.temperature),
    description: info.desc,
    icon: info.icon,
    isRaining: info.rain,
    windSpeed: Math.round(cw.windspeed),
    city: city || undefined,
  };
}

// gera saudação contextual cruzando dados do dashboard + clima
export function generateLocalGreeting(weather: WeatherData | null, context: {
  emailsUrgentes: number;
  medsPendentes: number;
  tarefasCriticas: number;
  streak: number;
}): string
{
  const h = new Date().getHours();
  const periodo = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';

  const parts: string[] = [];

  // clima
  if (weather)
  {
    if (weather.isRaining)
    {
      parts.push(`${weather.icon} ${weather.description} lá fora (${weather.temperature}°C). Leve guarda-chuva!`);
    }
    else
    {
      parts.push(`${weather.icon} ${weather.temperature}°C, ${weather.description.toLowerCase()}${weather.city ? ` em ${weather.city}` : ''}.`);
    }
  }

  // e-mails urgentes
  if (context.emailsUrgentes > 0)
  {
    parts.push(`📧 ${context.emailsUrgentes} e-mail${context.emailsUrgentes > 1 ? 's' : ''} urgente${context.emailsUrgentes > 1 ? 's' : ''} te esperando.`);
  }

  // meds
  if (context.medsPendentes > 0)
  {
    parts.push(`${context.medsPendentes} medicamento${context.medsPendentes > 1 ? 's' : ''} pendente${context.medsPendentes > 1 ? 's' : ''}.`);
  }

  // tarefas críticas
  if (context.tarefasCriticas > 0)
  {
    parts.push(`${context.tarefasCriticas} tarefa${context.tarefasCriticas > 1 ? 's' : ''} crítica${context.tarefasCriticas > 1 ? 's' : ''} no Kanban.`);
  }

  // streak positivo
  if (context.streak >= 5 && parts.length < 3)
  {
    parts.push(`${context.streak} dias de streak - mantenha o ritmo.`);
  }

  // monta a saudação final (max 2 destaques)
  const highlights = parts.slice(0, 2).join(' ');
  return highlights
    ? `${periodo}! ${highlights}`
    : `${periodo}! Tudo tranquilo por aqui. Bora produzir? 💪`;
}
