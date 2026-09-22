import { View } from 'react-native'
import {
  formatRestClock,
  type AcademyExercise,
  type AcademySetStep,
} from '@simply-life/shared'
import { Text } from '../../../ui'
import type { AcademyPhase } from '../../../store/academySessionStore'

type Props = {
  phase: AcademyPhase
  step?: AcademySetStep
  upcoming?: AcademySetStep
  restLeft: number
  workLeft: number
  setElapsed: number
  elapsedSec: number
  plan?: AcademyExercise[]
  dayLabel?: string
}

/** Blocos de texto do treino (pronto / série / descanso / fim). */
export function AcademySessionStage({
  phase,
  step,
  upcoming,
  restLeft,
  workLeft,
  setElapsed,
  elapsedSec,
  plan = [],
  dayLabel,
}: Props)
{
  const sessionClock = (
    <Text variant="caption" style={{ color: '#8A8580' }}>
      Treino {formatRestClock(elapsedSec)}
    </Text>
  )

  if (phase === 'ready')
  {
    const restDay = plan.length === 0
    return (
      <View style={{ gap: 14, flex: 1 }}>
        <Text variant="hero" style={{ color: '#E8E4DF', fontSize: 32 }}>
          {restDay ? 'Folga hoje' : 'Modo treino'}
        </Text>
        <Text variant="body" style={{ color: '#8A8580' }}>
          {restDay
            ? `${dayLabel ?? 'Hoje'} não tem exercícios no padrão. Edite a semana ou descanse.`
            : `${dayLabel ?? 'Hoje'} no calendário. O cronômetro corre sozinho.`}
        </Text>
        {plan.map((ex) => (
          <Text key={ex.id} variant="body" style={{ color: '#C4BEB8' }}>
            {ex.name} · {ex.sets}× {ex.reps} · descanso {ex.restSec}s
          </Text>
        ))}
      </View>
    )
  }

  if (phase === 'work' && step)
  {
    const timed = Boolean(step.workSec)
    return (
      <View style={{ gap: 12, flex: 1, justifyContent: 'center', alignItems: timed ? 'center' : 'flex-start' }}>
        {sessionClock}
        <Text variant="caption" style={{ color: '#8A8580' }}>
          Série {step.setIndex} de {step.setTotal}
        </Text>
        <Text variant="hero" style={{ color: '#E8E4DF', fontSize: 36, letterSpacing: -1 }}>
          {step.name}
        </Text>
        {timed ? (
          <Text variant="hero" style={{ color: '#E8734A', fontSize: 72, letterSpacing: -2 }}>
            {formatRestClock(workLeft)}
          </Text>
        ) : (
          <Text variant="hero" style={{ color: '#E8734A', fontSize: 56, letterSpacing: -2 }}>
            {formatRestClock(setElapsed)}
          </Text>
        )}
        <Text variant="body" style={{ color: '#C4BEB8', textAlign: timed ? 'center' : 'left' }}>
          {timed ? `Segura até ${step.reps}. O tempo cai sozinho.` : `${step.reps} · o relógio sobe sozinho`}
        </Text>
        {step.restSec > 0 ? (
          <Text variant="caption" style={{ color: '#8A8580' }}>
            Depois: {formatRestClock(step.restSec)} de descanso
          </Text>
        ) : (
          <Text variant="caption" style={{ color: '#8A8580' }}>Última série</Text>
        )}
      </View>
    )
  }

  if (phase === 'rest')
  {
    return (
      <View style={{ gap: 12, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {sessionClock}
        <Text variant="caption" style={{ color: '#8A8580' }}>Descanso</Text>
        <Text variant="hero" style={{ color: '#7BC9A0', fontSize: 72, letterSpacing: -2 }}>
          {formatRestClock(restLeft)}
        </Text>
        {upcoming ? (
          <Text variant="body" style={{ color: '#C4BEB8', textAlign: 'center' }}>
            Próximo: {upcoming.name} · série {upcoming.setIndex}/{upcoming.setTotal}
          </Text>
        ) : null}
      </View>
    )
  }

  if (phase === 'done')
  {
    return (
      <View style={{ gap: 14, flex: 1, justifyContent: 'center' }}>
        <Text variant="hero" style={{ color: '#E8E4DF', fontSize: 32 }}>Treino concluído</Text>
        <Text variant="body" style={{ color: '#8A8580' }}>
          {formatRestClock(elapsedSec)} no total. Pode marcar o dia e voltar.
        </Text>
      </View>
    )
  }

  return <View style={{ flex: 1 }} />
}
