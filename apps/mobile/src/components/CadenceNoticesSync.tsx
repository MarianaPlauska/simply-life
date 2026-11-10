import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { addDaysToIso, cadencePlan, expandBlocos, resumoDia, todayIso, type NotifyCadence } from '@simply-life/shared'
import { useDataStore } from '../store/dataStore'
import { useMeuMundoStore } from '../store/meuMundoStore'
import { useLifePatterns } from '../hooks/useLifePatterns'
import { scheduleCadenceAlerts } from '../lib/pushNotifications'

/** Remonta os avisos do ritmo (9h/15h/21h ou o resumo de segunda) quando o dia, as tarefas ou os blocos mudam. */
export function CadenceNoticesSync({ cadence }: { cadence: NotifyCadence })
{
  const tasks = useDataStore((s) => s.tasks)
  const blocos = useMeuMundoStore((s) => s.blocos)
  const marcas = useMeuMundoStore((s) => s.marcas)
  const events = useMeuMundoStore((s) => s.phoneEvents)
  const { patterns, loading } = useLifePatterns()
  const [tick, setTick] = useState(0)
  const descoberta = loading ? null : patterns[0]?.text ?? null

  useEffect(() =>
  {
    const sub = AppState.addEventListener('change', (state) =>
    {
      if (state === 'active') setTick((t) => t + 1)
    })
    return () => sub.remove()
  }, [])

  useEffect(() =>
  {
    const timer = setTimeout(() =>
    {
      const hoje = todayIso()
      const ate = addDaysToIso(hoje, 14)
      const ocorrencias = expandBlocos(blocos, marcas, hoje, ate)
      const livre: Record<string, { inicio: number; fim: number } | null> = {}
      for (let d = 0; d < 3; d++)
      {
        const dia = addDaysToIso(hoje, d)
        livre[dia] = resumoDia(dia, ocorrencias, events).livre
      }
      const plan = cadencePlan(cadence, new Date(), { tarefas: tasks ?? [], ocorrencias, livre, descoberta })
      void scheduleCadenceAlerts(cadence, plan).catch(() => undefined)
    }, 1500)
    return () => clearTimeout(timer)
  }, [cadence, tasks, blocos, marcas, events, descoberta, tick])

  return null
}
