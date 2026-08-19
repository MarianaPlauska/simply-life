import type { HealthSection, CuidadosTab } from '../../lib/healthRoute'

export function healthHeaderSubtitle(
  section: HealthSection,
  cuidados: CuidadosTab,
  stats: { ritualPct: number; ritualDone: number; ritualTotal: number },
): string
{
  if (section === 'hoje')
  {
    return `${stats.ritualDone}/${stats.ritualTotal} cuidados hoje · ${stats.ritualPct}% do ritual`
  }
  if (section === 'diario')
  {
    return 'Humor, notas e histórico'
  }

  const labels: Record<CuidadosTab, string> = {
    hidratacao: 'Hidratação · meta alinhada ao ritual do dashboard',
    alimentacao: 'Alimentação · proteína e refeições do dia',
    academia: 'Academia · treino de hoje ou configurar plano',
    medicamentos: 'Medicamentos · doses e lembretes no horário',
  }
  return labels[cuidados]
}
