import { useState } from 'react'
import { LifeGoalMicroLine, LifeGoalSheet } from './LifeGoalSheet'

/** Metas da vida, fora do cartão de progresso. O convite e o avanço continuam na Home. */
export function HomeLifeGoals()
{
  const [open, setOpen] = useState(false)
  return (
    <>
      <LifeGoalSheet visible={open} onClose={() => setOpen(false)} />
      <LifeGoalMicroLine onPress={() => setOpen(true)} />
    </>
  )
}
