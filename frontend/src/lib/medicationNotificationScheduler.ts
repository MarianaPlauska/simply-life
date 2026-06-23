import type { Medicamento, MedicamentoTomada } from '../store/storeTypes'
import { localTodayIso } from './healthDayBoundary'
import {
  buildDosesHoje,
  mensagemGentilDose,
  tomadaParaDose,
  type DoseHoje,
} from './medicamentosSchedule'

const SENT_PREFIX = 'simply-life:med-notif:'

function sentKey(dose: DoseHoje, today: string): string
{
  return `${SENT_PREFIX}${today}:${dose.medicamentoId}:${dose.horario}`
}

function wasSent(key: string): boolean
{
  try
  {
    return localStorage.getItem(key) === '1'
  }
  catch
  {
    return false
  }
}

function markSent(key: string): void
{
  try
  {
    localStorage.setItem(key, '1')
  }
  catch { /* quota */ }
}

function delayAteHorario(minutos: number, now: Date): number | null
{
  const target = new Date(now)
  target.setHours(Math.floor(minutos / 60), minutos % 60, 0, 0)
  const ms = target.getTime() - now.getTime()
  if (ms < 0)
  {
    return null
  }
  return ms
}

export interface MedicationScheduleCallbacks
{
  onDose: (dose: DoseHoje, body: string) => void
}

/** Agenda notificações locais no horário exato de cada dose (hoje) */
export function scheduleMedicationNotifications(
  medicamentos: Medicamento[],
  tomadas: MedicamentoTomada[],
  callbacks: MedicationScheduleCallbacks,
): () => void
{
  const timeouts: number[] = []
  const now = new Date()
  const today = localTodayIso()
  const doses = buildDosesHoje(medicamentos, tomadas, now)

  for (const dose of doses)
  {
    if (dose.status === 'tomado')
    {
      continue
    }

    const key = sentKey(dose, today)
    if (wasSent(key))
    {
      continue
    }

    const fire = () =>
    {
      if (tomadaParaDose(tomadas, dose.medicamentoId, dose.horario, today))
      {
        return
      }
      if (wasSent(key))
      {
        return
      }
      markSent(key)
      callbacks.onDose(dose, mensagemGentilDose(dose))
    }

    if (dose.status === 'janela' || dose.status === 'atrasado')
    {
      const id = window.setTimeout(fire, 1500)
      timeouts.push(id)
      continue
    }

    if (dose.status === 'futuro')
    {
      const delay = delayAteHorario(dose.minutos, now)
      if (delay !== null && delay < 24 * 60 * 60 * 1000)
      {
        const id = window.setTimeout(fire, delay)
        timeouts.push(id)
      }
    }
  }

  return () =>
  {
    for (const id of timeouts)
    {
      window.clearTimeout(id)
    }
  }
}
