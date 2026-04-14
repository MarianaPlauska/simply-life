import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, Coffee, Sunset } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export function FocusModeView() {
  const tarefas = useTaskStore((s) => s.tarefas);
  const timerConfig = useTaskStore((s) => s.timerConfig);

  const presets = useMemo(() => [
    { label: 'Foco', minutes: timerConfig.pomodoroTime, icon: Play },
    { label: 'Pausa Curta', minutes: timerConfig.shortBreak, icon: Coffee },
    { label: 'Pausa Longa', minutes: timerConfig.longBreak, icon: Sunset },
  ], [timerConfig]);

  const maisUrgente = tarefas.length
    ? [...tarefas].sort((a, b) => b.score_urgencia - a.score_urgencia)[0]
    : null;

  const [totalSeconds, setTotalSeconds] = useState(timerConfig.pomodoroTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync timer when config changes (only if not running)
  useEffect(() => {
    if (!isRunning) {
      setTotalSeconds(presets[activePreset].minutes * 60);
    }
  }, [timerConfig, activePreset, presets, isRunning]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTotalSeconds((prev) => {
        if (prev <= 1) { stop(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, stop]);

  function selectPreset(idx: number) {
    stop();
    setActivePreset(idx);
    setTotalSeconds(presets[idx].minutes * 60);
  }

  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  const progress = 1 - totalSeconds / (presets[activePreset].minutes * 60);
  const circumference = 2 * Math.PI * 140;
  const strokeOffset = circumference * (1 - progress);

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] gap-10 pb-12">

      {/* Timer Ring */}
      <div className="relative flex items-center justify-center">
        {/* Radial Glow */}
        <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-ia/20 to-transparent blur-3xl opacity-60" />
        <div className="absolute w-72 h-72 rounded-full bg-ia/5 blur-2xl" />

        <svg width="320" height="320" className="relative -rotate-90">
          {/* Track */}
          <circle
            cx="160" cy="160" r="140"
            fill="none"
            stroke="currentColor"
            className="text-zinc-800/40"
            strokeWidth="4"
          />
          {/* Progress */}
          <circle
            cx="160" cy="160" r="140"
            fill="none"
            stroke="currentColor"
            className="text-ia transition-all duration-1000"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
          />
        </svg>

        {/* Time Display */}
        <div className="absolute flex flex-col items-center">
          <span className="text-6xl font-extralight tracking-widest text-white tabular-nums">
            {mins}:{secs}
          </span>
          <span className="text-xs text-zinc-500 mt-2 uppercase tracking-widest">
            {presets[activePreset].label}
          </span>
        </div>
      </div>

      {/* Preset Controls */}
      <div className="flex items-center gap-3">
        {presets.map((preset, idx) => {
          const Icon = preset.icon;
          const isActive = activePreset === idx;
          return (
            <button
              key={preset.label}
              onClick={() => selectPreset(idx)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all border-t ${
                isActive
                  ? 'bg-zinc-800 text-white border-white/10 border border-zinc-700/50'
                  : 'text-zinc-500 hover:text-zinc-300 border-transparent border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {preset.label}
              <span className="text-zinc-600 text-[11px]">{preset.minutes}m</span>
            </button>
          );
        })}
      </div>

      {/* Start / Pause */}
      <button
        onClick={() => setIsRunning((r) => !r)}
        className="px-8 py-3 rounded-full bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-[0_0_30px_-5px_rgba(255,255,255,0.15)]"
      >
        {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isRunning ? 'Pausar' : 'Iniciar Foco'}
      </button>

      {/* Tarefa Atual */}
      {maisUrgente && (
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl px-6 py-4 max-w-md w-full text-center">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Tarefa em foco</p>
          <p className="text-sm font-medium text-white">{maisUrgente.titulo}</p>
          <p className="text-xs text-zinc-500 mt-1">Score de urgência: {maisUrgente.score_urgencia}</p>
        </div>
      )}
    </div>
  );
}
