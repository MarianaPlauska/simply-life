import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RotateCcw, Coffee, Sunset, Flame, Zap, Trophy,
  Volume2, VolumeX, ChevronRight, Target, Minimize2,
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

function useAmbientSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ gain: GainNode; source: AudioBufferSourceNode } | null>(null);
  const [playing, setPlaying] = useState(false);

  const start = useCallback(() => {
    if (nodesRef.current) return;
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * white) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0.12;

    source.connect(gain).connect(ctx.destination);
    source.start();
    nodesRef.current = { gain, source };
    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    nodesRef.current?.source.stop();
    nodesRef.current = null;
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    playing ? stop() : start();
  }, [playing, start, stop]);

  useEffect(() => () => { nodesRef.current?.source.stop(); }, []);

  return { playing, toggle, start, stop };
}

/* ── Confetti burst (canvas) ───────────────────────────── */
function fireConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD'];
  const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }[] = [];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -14 - 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 2,
      life: 1,
    });
  }

  let frame = 0;
  function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life -= 0.012;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    frame++;
    if (alive && frame < 180) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

/* ── XP Pop Animation ──────────────────────────────────── */
function XpPopup({ xp }: { xp: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: -40, scale: 1.2 }}
      exit={{ opacity: 0, y: -80 }}
      transition={{ duration: 0.8 }}
      className="absolute text-amber-400 font-bold text-2xl pointer-events-none"
    >
      +{xp} XP
    </motion.div>
  );
}

export function useFocusTimer() {
  const isFocusModeActive = useTaskStore((s) => s.isFocusModeActive);
  const focusState = useTaskStore((s) => s.focusState);
  const gamificacao = useTaskStore((s) => s.gamificacao);
  const timerConfig = useTaskStore((s) => s.timerConfig);
  const tickFocus = useTaskStore((s) => s.tickFocus);
  const syncFocusFromClock = useTaskStore((s) => s.syncFocusFromClock);
  const completeFocusPhase = useTaskStore((s) => s.completeFocusPhase);
  const resetFocus = useTaskStore((s) => s.resetFocus);

  const { phase, secondsLeft, totalSeconds } = focusState;

  const [lastXpGain, setLastXpGain] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPhaseRef = useRef(phase);
  const sound = useAmbientSound();

  useEffect(() => {
    if (isFocusModeActive && (phase === 'focus' || phase === 'break') && secondsLeft > 0) {
      intervalRef.current = setInterval(() => tickFocus(), 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    return undefined;
  }, [isFocusModeActive, phase, secondsLeft > 0, tickFocus]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        syncFocusFromClock();
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [syncFocusFromClock]);


  useEffect(() => {
    if ((phase === 'focus' || phase === 'break') && secondsLeft === 0 && totalSeconds > 0) {
      const prevXp = gamificacao.xp;
      completeFocusPhase().then(() => {
        const newXp = useTaskStore.getState().gamificacao.xp;
        if (newXp > prevXp) {
          setLastXpGain(newXp - prevXp);
          setTimeout(() => setLastXpGain(0), 2000);
        }
      });
      if (phase === 'focus' && canvasRef.current) {
        fireConfetti(canvasRef.current);
      }
    }
  }, [secondsLeft, phase, totalSeconds]);

  useEffect(() => {
    if (phase === 'focus' && prevPhaseRef.current !== 'focus') sound.start();
    else if (phase !== 'focus' && prevPhaseRef.current === 'focus') sound.stop();
    prevPhaseRef.current = phase;
  }, [phase, sound]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const circumference = 2 * Math.PI * 140;
  const strokeOffset = circumference * (1 - progress);
  const phaseLabel = phase === 'focus' ? 'Foco Profundo' : phase === 'break' ? 'Pausa' : phase === 'completed' ? 'Completo!' : 'Pronto para Focar';
  const phaseColor = phase === 'focus' ? 'text-ia' : phase === 'break' ? 'text-amber-400' : phase === 'completed' ? 'text-emerald-400' : 'text-zinc-400';
  const ringColor = phase === 'focus' ? 'text-ia' : phase === 'break' ? 'text-amber-400' : 'text-emerald-400';

  const handleTogglePause = () => {
    if (isFocusModeActive) useTaskStore.setState({ isFocusModeActive: false });
    else if (phase === 'focus' || phase === 'break') useTaskStore.setState({ isFocusModeActive: true });
  };

  return {
    phase, secondsLeft, totalSeconds, mins, secs, progress, circumference, strokeOffset,
    phaseLabel, phaseColor, ringColor, lastXpGain, canvasRef, sound,
    isFocusModeActive, gamificacao, timerConfig, handleTogglePause, resetFocus,
  };
}


export function FocusImmersiveOverlay() {
  const isFocusModeActive = useTaskStore((s) => s.isFocusModeActive);
  const focusState = useTaskStore((s) => s.focusState);
  const activeView = useTaskStore((s) => s.activeView);
  // Only show overlay when focus is running AND user is NOT on the dedicated /foco route
  const showOverlay = (isFocusModeActive || focusState.phase === 'focus' || focusState.phase === 'break')
    && activeView !== 'foco';

  const {
    mins, secs, circumference, strokeOffset, ringColor, phaseLabel, phaseColor,
    lastXpGain, canvasRef, sound, gamificacao, handleTogglePause, resetFocus,
  } = useFocusTimer();

  const setActiveView = useTaskStore((s) => s.setActiveView);

  if (!showOverlay) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="focus-overlay"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/95 backdrop-blur-2xl"
      >
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

        <button
          onClick={() => setActiveView('foco')}
          className="absolute top-6 right-6 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[13px]"
        >
          <Minimize2 className="w-4 h-4" />
          Ir para Modo Foco
        </button>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-ia/20 to-transparent blur-[140px] pointer-events-none" />

        {/* Glass card */}
        <div className="relative bg-zinc-900/60 border border-zinc-800/50 rounded-3xl px-12 py-10 backdrop-blur-sm flex flex-col items-center gap-6 shadow-2xl w-full max-w-sm mx-4">
          {/* XP strip */}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Zap className="w-4 h-4" /> {gamificacao.xp} XP
            </span>
            <span className="text-zinc-600">·</span>
            <span className="flex items-center gap-1.5 text-orange-400">
              <Flame className="w-4 h-4" /> {gamificacao.streak_days}d
            </span>
          </div>

        
          <div className="relative flex items-center justify-center">
            <svg width="200" height="200" className="-rotate-90">
              <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" className="text-zinc-800/40" strokeWidth="4" />
              <motion.circle
                cx="100" cy="100" r="88" fill="none" stroke="currentColor"
                className={`${ringColor} transition-colors duration-500`}
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 88}
                animate={{ strokeDashoffset: (2 * Math.PI * 88) * (1 - (1 - strokeOffset / circumference)) }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <AnimatePresence>
                {lastXpGain > 0 && <XpPopup key="xp" xp={lastXpGain} />}
              </AnimatePresence>
              <span className="text-4xl font-extralight tracking-widest text-white tabular-nums">{mins}:{secs}</span>
              <span className={`text-[10px] mt-1 uppercase tracking-widest ${phaseColor}`}>{phaseLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePause}
              className="px-6 py-2.5 rounded-full bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2"
            >
              {isFocusModeActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isFocusModeActive ? 'Pausar' : 'Continuar'}
            </button>
            <button onClick={resetFocus} className="p-2.5 rounded-full border border-zinc-800/50 text-zinc-500 hover:text-white hover:border-zinc-700 transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={sound.toggle}
              className={`p-2.5 rounded-full border transition-colors ${
                sound.playing ? 'border-ia/30 text-ia bg-ia/5' : 'border-zinc-800/50 text-zinc-500 hover:text-white hover:border-zinc-700'
              }`}
            >
              {sound.playing ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function FocusModeView() {
  const tarefas = useTaskStore((s) => s.tarefas);
  const timerConfig = useTaskStore((s) => s.timerConfig);
  const gamificacao = useTaskStore((s) => s.gamificacao);
  const focusState = useTaskStore((s) => s.focusState);
  const isFocusModeActive = useTaskStore((s) => s.isFocusModeActive);
  const startFocusSession = useTaskStore((s) => s.startFocusSession);
  const fetchGamificacao = useTaskStore((s) => s.fetchGamificacao);

  const { phase, sessionsCompleted, targetTaskId } = focusState;

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const {
    mins, secs, circumference, strokeOffset, ringColor, phaseLabel, phaseColor,
    lastXpGain, canvasRef, sound, handleTogglePause, resetFocus,
  } = useFocusTimer();

  const presets = useMemo(() => [
    { label: 'Foco', minutes: timerConfig.pomodoroTime, icon: Play },
    { label: 'Pausa Curta', minutes: timerConfig.shortBreak, icon: Coffee },
    { label: 'Pausa Longa', minutes: timerConfig.longBreak, icon: Sunset },
  ], [timerConfig]);

  const maisUrgente = useMemo(() =>
    tarefas.length ? [...tarefas].sort((a, b) => b.score_urgencia - a.score_urgencia)[0] : null,
    [tarefas]
  );

  const targetTask = useMemo(() =>
    tarefas.find((t) => t.id === (targetTaskId ?? selectedTaskId)),
    [tarefas, targetTaskId, selectedTaskId]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchGamificacao(); }, []);

  const handleStart = () => startFocusSession(selectedTaskId ?? maisUrgente?.id);

  return (
    <div className="relative max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] gap-8 pb-12">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />

      {/* Ambient glow */}
      <motion.div className="absolute inset-0 pointer-events-none" animate={{ opacity: phase === 'focus' ? 0.6 : 0.2 }} transition={{ duration: 2 }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-ia/20 to-transparent blur-[120px]" />
      </motion.div>

      {/* XP & Streak Bar */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-6 bg-zinc-900/60 border border-zinc-800/50 rounded-2xl px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">{gamificacao.xp} XP</span>
          <span className="text-xs text-zinc-500">Nível {gamificacao.nivel}</span>
        </div>
        <div className="w-px h-5 bg-zinc-700" />
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${gamificacao.streak_days > 0 ? 'text-orange-400' : 'text-zinc-600'}`} />
          <span className="text-sm font-medium text-white">{gamificacao.streak_days}d streak</span>
        </div>
        <div className="w-px h-5 bg-zinc-700" />
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-zinc-400">{sessionsCompleted} sessões</span>
        </div>
      </motion.div>

      {/* Timer Ring */}
      <div className="relative flex items-center justify-center">
        <svg width="320" height="320" className="relative -rotate-90">
          <circle cx="160" cy="160" r="140" fill="none" stroke="currentColor" className="text-zinc-800/40" strokeWidth="4" />
          <motion.circle
            cx="160" cy="160" r="140" fill="none" stroke="currentColor"
            className={`${ringColor} transition-colors duration-500`}
            strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference}
            animate={{ strokeDashoffset: strokeOffset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <AnimatePresence>
            {lastXpGain > 0 && <XpPopup key="xp" xp={lastXpGain} />}
          </AnimatePresence>
          <span className="text-6xl font-extralight tracking-widest text-white tabular-nums">
            {phase === 'idle' ? `${String(timerConfig.pomodoroTime).padStart(2, '0')}:00` : `${mins}:${secs}`}
          </span>
          <span className={`text-xs mt-2 uppercase tracking-widest ${phaseColor}`}>{phaseLabel}</span>
        </div>
      </div>

      {/* Presets (idle/completed) */}
      {(phase === 'idle' || phase === 'completed') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
          {presets.map((preset) => {
            const Icon = preset.icon;
            return (
              <div key={preset.label} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium text-zinc-500 border border-zinc-800/50">
                <Icon className="w-4 h-4" /> {preset.label}
                <span className="text-zinc-600 text-[11px]">{preset.minutes}m</span>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Task Selector (idle) */}
      {phase === 'idle' && tarefas.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-2">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 text-center">Selecione uma tarefa para focar</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {[...tarefas]
              .filter((t) => t.status !== 'concluida')
              .sort((a, b) => b.score_urgencia - a.score_urgencia)
              .slice(0, 5)
              .map((t) => (
                <button key={t.id} onClick={() => setSelectedTaskId(selectedTaskId === t.id ? null : t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    selectedTaskId === t.id ? 'border-ia/50 bg-ia/5 text-white' : 'border-zinc-800/50 bg-zinc-900/30 text-zinc-300 hover:border-zinc-700/50'
                  }`}
                >
                  <Target className={`w-4 h-4 shrink-0 ${selectedTaskId === t.id ? 'text-ia' : 'text-zinc-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{t.titulo}</p>
                    <p className="text-[11px] text-zinc-500">Score: {t.score_urgencia} · {t.prioridade}</p>
                  </div>
                  {selectedTaskId === t.id && <ChevronRight className="w-4 h-4 text-ia" />}
                </button>
              ))}
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        {phase === 'idle' || phase === 'completed' ? (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
            className="px-8 py-3 rounded-full bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-[0_0_30px_-5px_rgba(255,255,255,0.15)]"
          >
            <Play className="w-4 h-4" />
            {phase === 'completed' ? 'Nova Sessão' : 'Iniciar Foco'}
          </motion.button>
        ) : (
          <>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleTogglePause}
              className="px-8 py-3 rounded-full bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-[0_0_30px_-5px_rgba(255,255,255,0.15)]"
            >
              {isFocusModeActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isFocusModeActive ? 'Pausar' : 'Continuar'}
            </motion.button>
            <button onClick={resetFocus} className="p-3 rounded-full border border-zinc-800/50 text-zinc-500 hover:text-white hover:border-zinc-700 transition-colors" title="Reiniciar">
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        )}
        <button onClick={sound.toggle}
          className={`p-3 rounded-full border transition-colors ${
            sound.playing ? 'border-ia/30 text-ia bg-ia/5' : 'border-zinc-800/50 text-zinc-500 hover:text-white hover:border-zinc-700'
          }`}
          title={sound.playing ? 'Desligar som ambiente' : 'Ligar som ambiente'}
        >
          {sound.playing ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Active Task Card */}
      {targetTask && (phase === 'focus' || phase === 'break') && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl px-6 py-4 max-w-md w-full text-center"
        >
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Tarefa em foco</p>
          <p className="text-sm font-medium text-white">{targetTask.titulo}</p>
          <p className="text-xs text-zinc-500 mt-1">Score: {targetTask.score_urgencia} · {targetTask.prioridade}</p>
        </motion.div>
      )}

      {/* Completed celebration */}
      <AnimatePresence>
        {phase === 'completed' && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-8 py-6 text-center max-w-md"
          >
            <Trophy className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">Sessão Completa!</h3>
            <p className="text-sm text-zinc-400">
              {sessionsCompleted} sessões hoje · {gamificacao.xp} XP total · Nível {gamificacao.nivel}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
