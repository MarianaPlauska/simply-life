import type { Medicamento } from '../store/storeTypes';

const IGNORE_PREFIX = 'jarvis_med_ignore_';

function todayKey(): string
{
  return new Date().toISOString().split('T')[0];
}

export function isMedicationIgnored(medId: number): boolean
{
  try
  {
    return sessionStorage.getItem(`${IGNORE_PREFIX}${medId}_${todayKey()}`) === '1';
  }
  catch
  {
    return false;
  }
}

export function ignoreMedicationForToday(medId: number): void
{
  try
  {
    sessionStorage.setItem(`${IGNORE_PREFIX}${medId}_${todayKey()}`, '1');
  }
  catch { /* private mode */ }
}

export function clearMedicationIgnore(medId: number): void
{
  try
  {
    sessionStorage.removeItem(`${IGNORE_PREFIX}${medId}_${todayKey()}`);
  }
  catch { /* private mode */ }
}

export function getMedicationDelayMinutes(horario: string, now = new Date()): number | null
{
  try
  {
    const [hours, minutes] = horario.split(':').map(Number);
    const medTime = new Date();
    medTime.setHours(hours, minutes, 0, 0);
    return (now.getTime() - medTime.getTime()) / (1000 * 60);
  }
  catch
  {
    return null;
  }
}

export function getOverdueMedications(medicamentos: Medicamento[], minDelayMinutes = 60): Medicamento[]
{
  return medicamentos.filter((med) =>
  {
    if (med.tomado) return false;
    if (isMedicationIgnored(med.id)) return false;

    const diffMin = getMedicationDelayMinutes(med.horario);
    if (diffMin === null) return false;

    return diffMin > minDelayMinutes;
  });
}
