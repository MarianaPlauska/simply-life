import type { NotifyCadence } from './axelVoice'

/**
 * Política de alertas baseada em Fitz et al. (2019, Computers in Human Behavior).
 * Agrupar em horários previsíveis reduz estresse; silêncio total aumenta ansiedade/FOMO.
 */

/** Janelas do estudo: 9h, 15h e 21h (horário local). */
export const NOTIFY_BATCH_HOURS = [9, 15, 21] as const

/** Uma leitura por dia: meio da manhã. */
export const NOTIFY_ONCE_HOUR = 11

/** Sem alertas de bem-estar/finanças entre 22h e 8h. */
export const NOTIFY_QUIET_START = 22
export const NOTIFY_QUIET_END = 8

/** Frases frias — sem urgência, sem culpa, sem streak. */
export const NOTIFY_COPY = {
  moodTitle: 'AXEL · Bem-estar',
  moodBody: 'Quando quiser, o humor do dia cabe em um toque.',
  digestTitle: 'AXEL · Resumo do dia',
  digestBody: 'O essencial está organizado. Abra quando fizer sentido.',
  billBody: (label: string) => `Quando puder: ${label}.`,
  medBody: (label: string) => `Lembrete de cuidado: ${label}.`,
} as const

export function isQuietNotifyHour(hour: number): boolean
{
  return hour >= NOTIFY_QUIET_START || hour < NOTIFY_QUIET_END
}

/** Cron roda a cada hora; aceita a janela atual ±1h. */
export function isBatchWindowHour(hour: number): boolean
{
  return NOTIFY_BATCH_HOURS.some((h) => Math.abs(hour - h) <= 1)
}

export function isOnceWindowHour(hour: number): boolean
{
  return hour >= NOTIFY_ONCE_HOUR - 1 && hour <= NOTIFY_ONCE_HOUR + 1
}

export function canSendWellbeingPush(cadence: NotifyCadence | undefined, hour: number): boolean
{
  if (cadence === 'off' || isQuietNotifyHour(hour)) return false
  if (cadence === 'batch3') return isBatchWindowHour(hour)
  if (cadence === 'once') return isOnceWindowHour(hour)
  return false
}

export function canSendFinancePush(cadence: NotifyCadence | undefined, hour: number): boolean
{
  return canSendWellbeingPush(cadence, hour)
}
