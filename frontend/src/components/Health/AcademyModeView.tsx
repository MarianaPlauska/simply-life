import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Square, Timer, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { requestNotificationPermission } from '../../lib/healthNotifications'
import { useTaskStore } from '../../store/useTaskStore'
import { DEFAULT_TREINO_MINUTOS } from '../../constants/healthPresets'
import { formatElapsed } from '../../utils/workoutCompletion'
import { useAcademySession } from '../../hooks/useAcademySession'
import { useAcademyRestAlerts } from '../../hooks/useAcademyRestAlerts'
import { AcademyRestOverlay } from './academy/AcademyRestOverlay'
import {
  formatProgressoCarga,
  formatRestMmSs,
  melhorCarga,
  mergeAcademyConfig,
  MIN_DESCANSO_SEG,
  MAX_DESCANSO_SEG,
  resolveExerciciosHoje,
  resolvePlanoHoje,
} from '../../lib/academyWorkouts'
import type { HabitoDiarioConfig } from '../../store/storeTypes'

// Modo Academia — treino guiado com séries, descanso e evolução de carga

export function AcademyModeView()
{
  const navigate = useNavigate()
  const sessaoTreinoAtiva = useTaskStore((s) => s.sessaoTreinoAtiva)
  const habitos = useTaskStore((s) => s.habitos)
  const fetchSessaoTreinoAtiva = useTaskStore((s) => s.fetchSessaoTreinoAtiva)
  const iniciarTreino = useTaskStore((s) => s.iniciarTreino)
  const finalizarTreino = useTaskStore((s) => s.finalizarTreino)
  const registrarSerieAcademia = useTaskStore((s) => s.registrarSerieAcademia)
  const updateAcademyTreinoConfig = useTaskStore((s) => s.updateAcademyTreinoConfig)

  const [elapsedSec, setElapsedSec] = useState(0)
  const [descansoLocal, setDescansoLocal] = useState(90)

  const treinoPadrao = habitos.find((h) => h.tipo === 'treino')
  const habitConfig = treinoPadrao?.config as HabitoDiarioConfig | undefined
  const academyConfig = useMemo(
    () => mergeAcademyConfig(treinoPadrao?.config as Parameters<typeof mergeAcademyConfig>[0]),
    [treinoPadrao?.config],
  )
  const exercicios = useMemo(
    () => resolveExerciciosHoje(habitConfig),
    [habitConfig],
  )
  const temRotina = exercicios.length > 0
  const planoDia = resolvePlanoHoje(habitConfig, habitConfig?.plano_semana)
  const nomeTreino = sessaoTreinoAtiva?.tipo_treino ?? planoDia?.titulo?.trim() ?? 'Treino'
  const metaMin = sessaoTreinoAtiva?.meta_minutos
    ?? planoDia?.meta_minutos
    ?? habitConfig?.meta_minutos
    ?? DEFAULT_TREINO_MINUTOS

  const session = useAcademySession({
    exercicios,
    config: academyConfig,
    sessaoAtiva: Boolean(sessaoTreinoAtiva),
  })

  useEffect(() =>
  {
    document.documentElement.setAttribute('data-academy-mode', 'true')
    fetchSessaoTreinoAtiva()
    return () =>
    {
      document.documentElement.removeAttribute('data-academy-mode')
    }
  }, [fetchSessaoTreinoAtiva])

  useEffect(() =>
  {
    setDescansoLocal(academyConfig.descanso_segundos ?? 90)
  }, [academyConfig.descanso_segundos])

  useEffect(() =>
  {
    if (!sessaoTreinoAtiva)
    {
      setElapsedSec(0)
      return
    }
    const tick = () =>
    {
      const start = new Date(sessaoTreinoAtiva.iniciado_em).getTime()
      setElapsedSec(Math.max(0, Math.floor((Date.now() - start) / 1000)))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [sessaoTreinoAtiva])

  useEffect(() =>
  {
    if (sessaoTreinoAtiva && session.phase === 'idle' && exercicios.length > 0)
    {
      session.iniciarFluxo()
    }
  }, [sessaoTreinoAtiva?.id, exercicios.length])

  const handleIniciar = async () =>
  {
    if (sessaoTreinoAtiva)
    {
      if (session.phase === 'idle')
      {
        session.iniciarFluxo()
      }
      return
    }
    const habitoId = treinoPadrao?.id
    if (!habitoId)
    {
      toast.error('Cadastre um treino em Saúde primeiro')
      navigate('/saude#academia')
      return
    }
    if (!temRotina)
    {
      toast.message('Nenhum exercício para hoje — configure em Saúde')
      navigate('/saude#academia')
      return
    }
    void requestNotificationPermission()
    await iniciarTreino(habitoId, nomeTreino, metaMin)
    session.iniciarFluxo()
  }

  const handleConcluirSerie = async () =>
  {
    const log = session.concluirSerie()
    if (!log)
    {
      toast.error('Informe peso e repetições válidos')
      return
    }
    await registrarSerieAcademia(log.exercicio_id, log.peso_kg, log.reps)
    const anterior = melhorCarga(academyConfig.historico_cargas, log.exercicio_id)
    if (anterior != null && log.peso_kg > anterior)
    {
      toast.success('Novo recorde de carga!', {
        description: formatProgressoCarga(anterior, log.peso_kg),
      })
    }
  }

  const handleFinalizar = async () =>
  {
    if (!sessaoTreinoAtiva)
    {
      navigate('/saude#academia')
      return
    }
    await finalizarTreino(sessaoTreinoAtiva.id)
    navigate('/saude#academia')
  }

  const handleDescansoChange = async (seg: number) =>
  {
    setDescansoLocal(seg)
    await updateAcademyTreinoConfig({ descanso_segundos: seg })
  }

  const timerDisplay = session.phase === 'rest'
    ? formatRestMmSs(session.restSecondsLeft)
    : formatElapsed(elapsedSec)

  const completedKeys = new Set(session.completed.map((c) => c.step_key))

  const proximoExercicio = session.steps[session.stepIndex + 1]?.exercicio_nome
    ?? session.stepAtual?.exercicio_nome
    ?? 'Próxima série'

  useAcademyRestAlerts({
    phase: session.phase,
    restSecondsLeft: session.restSecondsLeft,
    proximoExercicio,
    enabled: Boolean(sessaoTreinoAtiva),
  })

  return (
    <>
      {sessaoTreinoAtiva && session.phase === 'rest' && (
        <AcademyRestOverlay
          secondsLeft={session.restSecondsLeft}
          proximoExercicio={proximoExercicio}
          onSkip={session.pularDescanso}
        />
      )}
    <div
      data-academy-mode
      className="min-h-[calc(100vh-2rem)] bg-black text-white flex flex-col px-4 py-6 max-w-lg mx-auto"
    >
      <header className="flex items-center justify-between mb-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Academia
        </p>
        <button
          type="button"
          onClick={() => navigate('/saude#hoje')}
          className="text-[12px] text-zinc-500 hover:text-white tracking-tight"
        >
          Sair
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <p className="text-[11px] text-zinc-500 tracking-tight mb-2 uppercase">
          {session.phase === 'rest' ? 'Descanso' : nomeTreino}
        </p>
        <time
          className={`font-mono text-[clamp(3.5rem,16vw,6.5rem)] font-medium tracking-tighter tabular-nums leading-none ${
            session.phase === 'rest' ? 'text-emerald-400' : 'text-white'
          }`}
        >
          {sessaoTreinoAtiva ? timerDisplay : '00:00'}
        </time>
        {session.stepAtual && sessaoTreinoAtiva && session.phase !== 'rest' && (
          <div className="mt-5 text-center max-w-sm">
            <p className="text-lg font-medium tracking-tight">{session.stepAtual.exercicio_nome}</p>
            <p className="text-[12px] text-zinc-500 mt-1">
              Série {session.stepAtual.serie}/{session.stepAtual.total_series} · meta {session.stepAtual.reps_alvo}
            </p>
            {session.stepAtual.superset_id && (
              <p className="text-[10px] text-emerald-500/80 font-mono uppercase mt-1">Superset</p>
            )}
            {session.progressoCarga && (
              <p className="text-[11px] text-zinc-400 mt-2 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {session.progressoCarga}
              </p>
            )}
          </div>
        )}
        {session.phase === 'rest' && session.steps[session.stepIndex + 1] && (
          <p className="text-[12px] text-zinc-500 mt-4">
            Próximo: {session.steps[session.stepIndex + 1].exercicio_nome}
          </p>
        )}
      </div>

      {sessaoTreinoAtiva && session.phase === 'working' && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className="font-mono text-[9px] uppercase text-zinc-600">Peso (kg)</span>
            <input
              type="text"
              inputMode="decimal"
              value={session.pesoKg}
              onChange={(e) => session.setPesoKg(e.target.value)}
              className="mt-1 w-full px-3 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-lg font-mono"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[9px] uppercase text-zinc-600">Reps</span>
            <input
              type="text"
              inputMode="numeric"
              value={session.reps}
              onChange={(e) => session.setReps(e.target.value)}
              className="mt-1 w-full px-3 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-lg font-mono"
            />
          </label>
        </div>
      )}

      {!sessaoTreinoAtiva && (
        <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4 text-zinc-500" />
            <span className="text-[11px] uppercase text-zinc-500">Descanso entre séries</span>
          </div>
          <input
            type="range"
            min={MIN_DESCANSO_SEG}
            max={MAX_DESCANSO_SEG}
            step={15}
            value={descansoLocal}
            onChange={(e) => void handleDescansoChange(Number(e.target.value))}
            className="w-full accent-white"
          />
          <p className="text-[12px] text-zinc-400 font-mono mt-1">{descansoLocal}s</p>
        </div>
      )}

      <div className="border-t border-white/10 pt-3 mb-4 max-h-40 overflow-y-auto">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600 mb-2">
          Rotina ({session.completed.length}/{session.steps.length})
        </p>
        {!temRotina ? (
          <p className="text-[12px] text-zinc-500 leading-relaxed py-2">
            Nenhum exercício cadastrado para hoje. Ative o plano em Saúde ou adicione exercícios na biblioteca.
          </p>
        ) : (
        <ul className="space-y-0">
          {session.steps.map((step) =>
          {
            const done = completedKeys.has(step.key)
            const ativa = session.stepAtual?.key === step.key && session.phase === 'working'
            return (
              <li
                key={step.key}
                className={`flex items-center gap-2 py-1.5 text-[12px] ${
                  ativa ? 'text-white' : done ? 'text-zinc-600' : 'text-zinc-500'
                }`}
              >
                <span className="w-4 shrink-0">
                  {done && <Check className="w-3 h-3" strokeWidth={2.5} />}
                </span>
                <span className="truncate flex-1">
                  {step.exercicio_nome}
                  {step.superset_id && (
                    <span className="ml-1 text-[9px] text-emerald-600 font-mono">SS</span>
                  )}
                </span>
                <span className="font-mono text-[10px] shrink-0">S{step.serie}</span>
              </li>
            )
          })}
        </ul>
        )}
      </div>

      <div className="flex flex-col gap-3 pb-4">
        {!sessaoTreinoAtiva ? (
          <button
            type="button"
            onClick={() => void handleIniciar()}
            disabled={!temRotina}
            className="w-full py-4 rounded-lg bg-white text-black text-[15px] font-semibold disabled:opacity-40"
          >
            {temRotina ? 'Iniciar treino' : 'Configure exercícios em Saúde'}
          </button>
        ) : session.phase === 'finished' ? (
          <button
            type="button"
            onClick={() => void handleFinalizar()}
            className="w-full py-4 rounded-lg bg-emerald-500 text-black text-[15px] font-semibold"
          >
            Treino completo — finalizar
          </button>
        ) : session.phase === 'rest' ? null : (
          <>
            <button
              type="button"
              onClick={() => void handleConcluirSerie()}
              className="w-full py-4 rounded-lg bg-white text-black text-[15px] font-semibold"
            >
              Concluir série
            </button>
            <button
              type="button"
              onClick={() => void handleFinalizar()}
              className="w-full py-3 rounded-lg border border-white/20 text-zinc-300 text-[14px] flex items-center justify-center gap-2"
            >
              <Square className="w-4 h-4" />
              Finalizar antes
            </button>
          </>
        )}
      </div>
    </div>
    </>
  )
}
