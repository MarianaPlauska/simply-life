import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Sunset, Bell } from 'lucide-react';
import { fadeUp } from './DashboardPrimitives';
import type { DashboardResumo } from '../../store/useTaskStore';
import { useTaskStore } from '../../store/useTaskStore';
import {
  fetchWeather, getUserLocation, generateLocalGreeting,
  type WeatherData,
} from '../../services/weatherService';

function getGreetIcon(): React.ElementType {
  const h = new Date().getHours();
  if (h < 12) return Sun;
  if (h < 18) return Sunset;
  return Moon;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}



export function HeroSection({
  resumo,
  naoLidas,
}: {
  resumo: DashboardResumo | null;
  naoLidas: number;
}) {
  const GreetIcon = getGreetIcon();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [smartGreeting, setSmartGreeting] = useState<string>('');

  // pega dados do store pra contexto da saudação
  const medicamentos = useTaskStore((s) => s.medicamentos);
  const tarefas = useTaskStore((s) => s.tarefas);
  const streakAtual = 0; // será alimentado pelo profiles.streak_atual

  // busca clima real na montagem
  useEffect(() =>
  {
    let cancelled = false;
    
    const loadWeather = async () =>
    {
      try
      {
        const pos = await getUserLocation();
        const data = await fetchWeather(pos.lat, pos.lon);
        if (!cancelled) setWeather(data);
      }
      catch (err)
      {
        console.warn('[Weather] Geoloc indisponível, usando fallback:', err);
      }
    };
    
    loadWeather();
    return () => { cancelled = true; };
  }, []);

  // gera saudação — tenta Groq (JARVIS), fallback local
  useEffect(() =>
  {
    let cancelled = false;
    const medsPendentes = (medicamentos ?? []).filter((m) => !m.tomado).length;
    const criticas = tarefas.filter((t) => t.prioridade === 'critica' && t.status !== 'concluida').length;

    // saudação local imediata (não espera a IA)
    const localGreeting = generateLocalGreeting(weather, {
      emailsUrgentes: 0,
      medsPendentes,
      tarefasCriticas: criticas,
      streak: streakAtual,
    });
    setSmartGreeting(localGreeting);

    // tenta Groq em background (upgrade da saudação)
    const tryGroq = async () =>
    {
      try
      {
        let lat: number | undefined;
        let lon: number | undefined;
        try {
          const pos = await getUserLocation();
          lat = pos.lat;
          lon = pos.lon;
        } catch { /* sem geoloc, segue sem */ }

        const { generateGreetingIA } = await import('../../services/jarvisApi');
        const result = await generateGreetingIA({
          lat, lon,
          emailsUrgentes: 0,
          medsPendentes,
          tarefasCriticas: criticas,
          streak: streakAtual,
          saldoMes: resumo?.saldo_mes ?? 0,
        });

        if (!cancelled && result.greeting)
        {
          setSmartGreeting(result.greeting);
        }
      }
      catch (err)
      {
        console.warn('[JARVIS] Groq indisponível, usando saudação local:', err);
      }
    };

    tryGroq();
    return () => { cancelled = true; };
  }, [weather, medicamentos, tarefas, streakAtual, resumo]);

  return (
    <motion.div {...fadeUp} className="w-full">
      <div className="relative py-6 border-b border-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Greeting + Category Tag */}
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/10">
                <GreetIcon className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-semibold text-violet-300 tracking-wide uppercase">
                  {getGreeting()}
                </span>
              </div>
            </div>

            {/* smart greeting */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">
              {smartGreeting.split('!')[0] || getGreeting()}!
            </h1>

            {smartGreeting.includes('!') && (
              <p className="text-[13px] text-zinc-400 mt-2.5 leading-relaxed max-w-xl font-light">
                {smartGreeting.split('!').slice(1).join('!').trim()}
              </p>
            )}

            {/* Quick stats row */}
            {resumo && (
              <div className="flex items-center gap-5 mt-5">
                <QuickStat value={resumo.tarefas_criticas} label="Críticas" accent={resumo.tarefas_criticas > 0 ? 'text-red-400' : 'text-emerald-400'} />
                <div className="w-px h-5 bg-white/5" />
                <QuickStat value={resumo.tarefas_pendentes} label="Pendentes" accent="text-violet-400" />
                <div className="w-px h-5 bg-white/5" />
                <QuickStat value={resumo.tarefas_concluidas} label="Concluídas" accent="text-emerald-400" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 shrink-0 self-start md:self-center">
            {/* Weather Widget Panel on the right */}
            {weather && (
              <div className="flex items-center gap-4 pl-0 md:pl-6 md:border-l border-white/5 min-w-[180px]">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-4xl font-extralight text-white tracking-tighter">{weather.temperature}</span>
                  <span className="text-lg font-light text-zinc-500">°C</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{weather.icon}</span>
                    <span className="text-xs font-medium text-zinc-300 leading-none">{weather.description}</span>
                  </div>
                  {weather.city && (
                    <span className="text-[11px] text-zinc-500 mt-1 font-light">{weather.city}</span>
                  )}
                  <span className="text-[10px] text-zinc-500 font-light mt-0.5">Vento: {weather.windSpeed} km/h</span>
                </div>
              </div>
            )}

            <button className="relative p-2.5 rounded-lg bg-zinc-900/60 border border-white/5 hover:border-violet-500/20 hover:bg-zinc-850 transition-all duration-300 group">
              <Bell className="w-4 h-4 text-zinc-400 group-hover:text-zinc-300 transition-colors" />
              {naoLidas > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1 ring-2 ring-zinc-950">
                  {naoLidas > 9 ? '9+' : naoLidas}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickStat({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <div className="flex flex-col">
      <span className={`text-2xl font-black tabular-nums tracking-tighter ${accent}`}>{value}</span>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}
