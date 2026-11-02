import { useMemo } from 'react'
import { calcularElo, localTodayIso, protectedIsoDates, type EloResumo } from '@simply-life/shared'
import { actionIsos, useActivityStore } from '../store/activityStore'
import { useCareExtrasStore } from '../store/careExtrasStore'

/**
 * O elo canônico (shared/elo.ts) a partir dos dias deste aparelho, já
 * juntados com os do servidor por useEloSync. Toda tela que mostra elo,
 * sequência ou recorde usa este hook. O store é hidratado no layout raiz.
 * Dias de burnout entram como descanso extra e não mudam a regra de quem não ligou o modo.
 */
export function useElo(): EloResumo
{
  const days = useActivityStore((s) => s.days)
  const recorde = useActivityStore((s) => s.recorde)
  const burnoutActive = useCareExtrasStore((s) => s.burnoutActive)
  const burnoutHistory = useCareExtrasStore((s) => s.burnoutHistory)
  const hoje = localTodayIso()
  const proteger = useMemo(
    () => protectedIsoDates(burnoutActive, burnoutHistory),
    [burnoutActive, burnoutHistory],
  )

  return useMemo(
    () => calcularElo(actionIsos(days), { recordeSalvo: recorde, proteger }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, recorde, hoje, proteger],
  )
}
