import type { HealthSection, CuidadosTab } from '../../lib/healthRoute'

export function healthHeaderSubtitle(
  section: HealthSection,
  cuidados: CuidadosTab,
  stats: { ritualPct: number; ritualDone: number; ritualTotal: number },
  nut?: { gramas: number; kcal: number },
): string
{
  if (section === 'hoje')
  {
    const ritual = `${stats.ritualDone} de ${stats.ritualTotal} cuidados hoje`
    if (nut && (nut.gramas > 0 || nut.kcal > 0))
    {
      return `${ritual} · ${nut.gramas}g proteína · ${nut.kcal} kcal`
    }
    return ritual
  }
  if (section === 'diario')
  {
    return 'Humor, notas e histórico'
  }

  const labels: Record<CuidadosTab, string> = {
    hidratacao: 'Hidratação · meta alinhada ao ritual do dashboard',
    alimentacao: nut && (nut.gramas > 0 || nut.kcal > 0)
      ? `Alimentação · ${nut.gramas}g proteína · ${nut.kcal} kcal`
      : 'Alimentação · proteína e refeições do dia',
    academia: 'Academia · treino de hoje ou configurar plano',
    medicamentos: 'Medicamentos · doses e lembretes no horário',
  }
  return labels[cuidados]
}
