import type { Medicamento, MedicamentoTomada } from '../store/storeTypes'
import { localTodayIso } from './healthDayBoundary'

// Agenda de medicamentos - horários, tomadas e tom acolhedor (sem culpa)

export interface DoseHoje
{
  medicamentoId: number
  nome: string
  horario: string
  minutos: number
  tomada: MedicamentoTomada | null
  status: 'futuro' | 'janela' | 'atrasado' | 'tomado'
}

const JANELA_ANTES_MIN = 30
const JANELA_DEPOIS_MIN = 120

export function parseHorarioMin(horario: string): number | null
{
  const parts = horario.trim().split(':')
  if (parts.length < 2) return null
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function formatHorarioDisplay(horario: string): string
{
  return horario.trim().slice(0, 5)
}

/** Horários do remédio - config.horarios ou legado horario único */
export function horariosDoMedicamento(med: Medicamento): string[]
{
  const fromConfig = med.config?.horarios?.filter(Boolean) ?? []
  if (fromConfig.length > 0)
  {
    return [...fromConfig].sort((a, b) => (parseHorarioMin(a) ?? 0) - (parseHorarioMin(b) ?? 0))
  }
  if (med.horario?.trim())
  {
    return [med.horario.trim()]
  }
  return []
}

export function tomadaParaDose(
  tomadas: MedicamentoTomada[],
  medicamentoId: number,
  horario: string,
  today = localTodayIso(),
): MedicamentoTomada | null
{
  return tomadas.find((t) =>
    t.medicamento_id === medicamentoId
    && t.horario_previsto === horario
    && t.tomado_em.slice(0, 10) === today,
  ) ?? null
}

function medicamentoAtivoHoje(med: Medicamento, today: string, dayOfWeek: number): boolean
{
  const dias = med.config?.dias_semana ?? []
  if (dias.length > 0 && !dias.includes(dayOfWeek))
  {
    return false
  }
  const inicio = med.config?.inicio_tratamento
  if (inicio && today < inicio)
  {
    return false
  }
  const fim = med.config?.fim_tratamento
  if (fim && today > fim)
  {
    return false
  }
  return true
}

export function medicamentoCompletoHoje(med: Medicamento, tomadas: MedicamentoTomada[], today = localTodayIso()): boolean
{
  const slots = horariosDoMedicamento(med)
  if (slots.length === 0) return med.tomado
  return slots.every((h) => tomadaParaDose(tomadas, med.id, h, today) !== null)
}

function statusDose(minutos: number, nowMin: number, tomada: boolean): DoseHoje['status']
{
  if (tomada) return 'tomado'
  if (nowMin < minutos - JANELA_ANTES_MIN) return 'futuro'
  if (nowMin <= minutos + JANELA_DEPOIS_MIN) return 'janela'
  return 'atrasado'
}

export function buildDosesHoje(
  medicamentos: Medicamento[],
  tomadas: MedicamentoTomada[],
  now = new Date(),
): DoseHoje[]
{
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const today = localTodayIso()
  const dayOfWeek = now.getDay()
  const doses: DoseHoje[] = []

  for (const med of medicamentos)
  {
    if (!medicamentoAtivoHoje(med, today, dayOfWeek))
    {
      continue
    }
    for (const horario of horariosDoMedicamento(med))
    {
      const minutos = parseHorarioMin(horario)
      if (minutos === null) continue
      const tomada = tomadaParaDose(tomadas, med.id, horario, today)
      doses.push({
        medicamentoId: med.id,
        nome: med.nome,
        horario: formatHorarioDisplay(horario),
        minutos,
        tomada,
        status: statusDose(minutos, nowMin, tomada !== null),
      })
    }
  }

  return doses.sort((a, b) => a.minutos - b.minutos)
}

export function mensagemGentilDose(dose: DoseHoje): string
{
  if (dose.status === 'tomado' && dose.tomada)
  {
    const hora = new Date(dose.tomada.tomado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return `${dose.nome} (${dose.horario}) - registrado às ${hora}.`
  }
  if (dose.status === 'futuro')
  {
    return `${dose.nome} às ${dose.horario} - ainda não é hora, sem pressa.`
  }
  if (dose.status === 'janela')
  {
    return `Já tomou ${dose.nome} (${dose.horario})? Um toque registra - sem julgamento.`
  }
  return `Passou do horário de ${dose.nome} (${dose.horario}). Quando puder, registre aqui.`
}

export function proximaDosePendente(doses: DoseHoje[]): DoseHoje | null
{
  return doses.find((d) => d.status !== 'tomado' && d.status !== 'futuro') ?? null
}

export function countDoseProgress(
  medicamentos: Medicamento[],
  tomadas: MedicamentoTomada[],
  now = new Date(),
): { tomados: number; total: number }
{
  const doses = buildDosesHoje(medicamentos, tomadas, now)
  return {
    tomados: doses.filter((d) => d.status === 'tomado').length,
    total: doses.length,
  }
}

