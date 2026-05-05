import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Sunset, Bell, CloudRain, Cloud, Thermometer } from 'lucide-react';
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

function getWeatherIcon(weather: WeatherData | null): React.ElementType {
  if (!weather) return Thermometer;
  if (weather.isRaining) return CloudRain;
  if (weather.description.includes('ublado')) return Cloud;
  return Sun;
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
        // fallback sem clima — saudação funciona sem
      }
    };
    
    loadWeather();
    return () => { cancelled = true; };
  }, []);

  // gera saudação contextual quando dados chegam
  useEffect(() =>
  {
    const medsPendentes = (medicamentos ?? []).filter((m) => !m.tomado).length;
    const criticas = tarefas.filter((t) => t.prioridade === 'critica' && t.status !== 'concluida').length;

    const greeting = generateLocalGreeting(weather, {
      emailsUrgentes: 0, // será alimentado pelo inbox real
      medsPendentes,
      tarefasCriticas: criticas,
      streak: streakAtual,
    });

    setSmartGreeting(greeting);
  }, [weather, medicamentos, tarefas, streakAtual]);

  const WeatherIcon = getWeatherIcon(weather);

  return (
    <motion.div {...fadeUp}>
      <div className="relative overflow-hidden bg-zinc-950/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-10 shadow-2xl">
        {/* Radial glow overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.12),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.06),transparent_60%)] pointer-events-none" />

        <div className="relative flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Greeting + Weather chip */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/10">
                <GreetIcon className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-medium text-violet-300 tracking-wide uppercase">
                  {getGreeting()}
                </span>
              </div>

              {/* weather badge — só aparece se tiver dados reais */}
              {weather && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/10"
                >
                  <WeatherIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] font-medium text-cyan-300">
                    {weather.temperature}°C {weather.description.toLowerCase()}
                  </span>
                  {weather.city && (
                    <span className="text-[10px] text-zinc-500">
                      · {weather.city}
                    </span>
                  )}
                </motion.div>
              )}
            </div>

            {/* saudação inteligente JARVIS */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tighter leading-[1.15]">
              {smartGreeting.split('!')[0] || getGreeting()}!
            </h1>

            {smartGreeting.includes('!') && (
              <p className="text-[14px] text-zinc-400 mt-3 leading-relaxed max-w-2xl">
                {smartGreeting.split('!').slice(1).join('!').trim()}
              </p>
            )}

            {/* Quick stats row */}
            {resumo && (
              <div className="flex items-center gap-6 mt-6">
                <QuickStat value={resumo.tarefas_criticas} label="Críticas" accent={resumo.tarefas_criticas > 0 ? 'text-red-400' : 'text-emerald-400'} />
                <div className="w-px h-6 bg-white/5" />
                <QuickStat value={resumo.tarefas_pendentes} label="Pendentes" accent="text-violet-400" />
                <div className="w-px h-6 bg-white/5" />
                <QuickStat value={resumo.tarefas_concluidas} label="Concluídas" accent="text-emerald-400" />
                {weather && (
                  <>
                    <div className="w-px h-6 bg-white/5" />
                    <QuickStat value={weather.temperature} label={weather.icon} accent="text-cyan-400" />
                  </>
                )}
              </div>
            )}
          </div>

          <button className="relative p-3 rounded-[1rem] bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-violet-500/20 transition-all duration-300 shrink-0 group">
            <Bell className="w-5 h-5 text-zinc-400 group-hover:text-zinc-300 transition-colors" />
            {naoLidas > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 ring-2 ring-zinc-950">
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </button>
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
