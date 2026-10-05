import { useMemo } from 'react'
import { calcularElo, localTodayIso, type EloResumo } from '@simply-life/shared'
import { actionIsos, useActivityStore } from '../store/activityStore'

/**
 * O elo canônico (shared/elo.ts) a partir dos dias deste aparelho, já
 * juntados com os do servidor por useEloSync. Toda tela que mostra elo,
 * sequência ou recorde usa este hook. O store é hidratado no layout raiz.
 */
export function useElo(): EloResumo
{
  const days = useActivityStore((s) => s.days)
  const recorde = useActivityStore((s) => s.recorde)
  // muda à meia-noite local: recalcula mesmo sem ação nova
  const hoje = localTodayIso()

  return useMemo(
    () => calcularElo(actionIsos(days), { recordeSalvo: recorde }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, recorde, hoje],
  )
}
