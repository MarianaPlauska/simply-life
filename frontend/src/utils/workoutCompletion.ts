/** Treino considerado completo se durou >= 80% da meta em minutos */
export function isWorkoutComplete(duracaoRealMin: number, metaMinutos: number): boolean
{
  if (metaMinutos <= 0) return duracaoRealMin >= 1;
  return duracaoRealMin >= Math.ceil(metaMinutos * 0.8);
}

export function minutesBetween(startIso: string, endIso: string): number
{
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(1, Math.round((end - start) / 60000));
}

export function formatElapsed(seconds: number): string
{
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
