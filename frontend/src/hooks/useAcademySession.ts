import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AcademyCompletedSet,
  AcademyExercise,
  AcademySetStep,
  AcademyTreinoConfig,
} from '../lib/academyWorkouts'
import {
  DEFAULT_DESCANSO_SEG,
  flattenExercisesToSteps,
  ultimaCarga,
} from '../lib/academyWorkouts'

export type AcademyPhase = 'idle' | 'working' | 'rest' | 'finished'

interface UseAcademySessionOptions
{
  exercicios: AcademyExercise[]
  config: AcademyTreinoConfig
  sessaoAtiva: boolean
}

interface UseAcademySessionResult
{
  phase: AcademyPhase
  steps: AcademySetStep[]
  stepIndex: number
  stepAtual: AcademySetStep | null
  completed: AcademyCompletedSet[]
  restSecondsLeft: number
  pesoKg: string
  reps: string
  setPesoKg: (v: string) => void
  setReps: (v: string) => void
  iniciarFluxo: () => void
  concluirSerie: () => AcademyCompletedSet | null
  pularDescanso: () => void
  progressoCarga: string | null
}

export function useAcademySession({
  exercicios,
  config,
  sessaoAtiva,
}: UseAcademySessionOptions): UseAcademySessionResult
{
  const steps = useMemo(() => flattenExercisesToSteps(exercicios), [exercicios])
  const descansoSeg = config.descanso_segundos ?? DEFAULT_DESCANSO_SEG

  const [phase, setPhase] = useState<AcademyPhase>('idle')
  const [stepIndex, setStepIndex] = useState(0)
  const [completed, setCompleted] = useState<AcademyCompletedSet[]>([])
  const [restSecondsLeft, setRestSecondsLeft] = useState(0)
  const [pesoKg, setPesoKg] = useState('')
  const [reps, setReps] = useState('')

  const stepAtual = steps[stepIndex] ?? null

  const progressoCarga = useMemo(() =>
  {
    if (!stepAtual)
    {
      return null
    }
    const ultima = ultimaCarga(config.historico_cargas, stepAtual.exercicio_id)
    const sugerida = stepAtual.carga_sugerida_kg
    if (ultima)
    {
      return `Última vez: ${ultima.peso_kg} kg × ${ultima.reps} reps`
    }
    if (sugerida != null && sugerida > 0)
    {
      return `Sugestão inicial: ${sugerida} kg`
    }
    return null
  }, [stepAtual, config.historico_cargas])

  useEffect(() =>
  {
    if (!sessaoAtiva)
    {
      setPhase('idle')
      setStepIndex(0)
      setCompleted([])
      setRestSecondsLeft(0)
      setPesoKg('')
      setReps('')
    }
  }, [sessaoAtiva])

  useEffect(() =>
  {
    if (!stepAtual || phase === 'idle')
    {
      return
    }
    const ultima = ultimaCarga(config.historico_cargas, stepAtual.exercicio_id)
    const sugerida = stepAtual.carga_sugerida_kg
    setPesoKg(String(ultima?.peso_kg ?? sugerida ?? ''))
    const repsDefault = (ultima?.reps
      ?? parseInt(stepAtual.reps_alvo.split('-')[0], 10))
      || 10
    setReps(String(repsDefault))
  }, [stepAtual?.key, phase, config.historico_cargas])

  const avancarAposDescanso = useCallback(() =>
  {
    setStepIndex((i) =>
    {
      const next = i + 1
      if (next >= steps.length)
      {
        setPhase('finished')
        return i
      }
      setPhase('working')
      return next
    })
  }, [steps.length])

  useEffect(() =>
  {
    if (phase !== 'rest')
    {
      return
    }
    if (restSecondsLeft <= 0)
    {
      avancarAposDescanso()
      return
    }
    const id = window.setTimeout(() =>
    {
      setRestSecondsLeft((s) => s - 1)
    }, 1000)
    return () => window.clearTimeout(id)
  }, [phase, restSecondsLeft, avancarAposDescanso])

  const iniciarFluxo = useCallback(() =>
  {
    if (steps.length === 0)
    {
      return
    }
    setStepIndex(0)
    setCompleted([])
    setPhase('working')
  }, [steps.length])

  const concluirSerie = useCallback((): AcademyCompletedSet | null =>
  {
    if (!stepAtual || phase !== 'working')
    {
      return null
    }
    const peso = parseFloat(pesoKg.replace(',', '.'))
    const rep = parseInt(reps, 10)
    if (!Number.isFinite(peso) || peso < 0 || !Number.isFinite(rep) || rep <= 0)
    {
      return null
    }

    const log: AcademyCompletedSet = {
      step_key: stepAtual.key,
      exercicio_id: stepAtual.exercicio_id,
      serie: stepAtual.serie,
      peso_kg: peso,
      reps: rep,
      concluida_em: new Date().toISOString(),
    }
    setCompleted((prev) => [...prev, log])

    const isLast = stepIndex >= steps.length - 1
    if (isLast)
    {
      setPhase('finished')
      return log
    }

    if (stepAtual.pular_descanso_apos)
    {
      setStepIndex((i) => i + 1)
      setPhase('working')
      return log
    }

    setPhase('rest')
    setRestSecondsLeft(descansoSeg)
    return log
  }, [stepAtual, phase, pesoKg, reps, stepIndex, steps.length, descansoSeg])

  const pularDescanso = useCallback(() =>
  {
    if (phase !== 'rest')
    {
      return
    }
    avancarAposDescanso()
  }, [phase, avancarAposDescanso])

  return {
    phase,
    steps,
    stepIndex,
    stepAtual,
    completed,
    restSecondsLeft,
    pesoKg,
    reps,
    setPesoKg,
    setReps,
    iniciarFluxo,
    concluirSerie,
    pularDescanso,
    progressoCarga,
  }
}
