import type { HealthSection, CuidadosTab } from '../../lib/healthRoute'

export function healthHeaderSubtitle(
  section: HealthSection,
  cuidados: CuidadosTab,
  stats: { ritualPct: number; ritualDone: number; ritualTotal: number },
  nut?: { gramas: number; kcal: number },
): string
{
  if (section === 'hoje' || section === 'cuidados')
  {
    return 'Um passo de cada vez — o AXEL cuida com você.'
  }
  if (section === 'diario')
  {
    return 'Humor, notas e histórico'
  }

  const labels: Record<CuidadosTab, string> = {
    hidratacao: 'Água quando fizer sentido',
    alimentacao: nut && (nut.gramas > 0 || nut.kcal > 0)
      ? `Comida · ${nut.gramas}g proteína hoje`
      : 'Comida no seu ritmo',
    academia: 'Movimento leve também conta',
    medicamentos: 'Lembretes gentis, sem cobrança',
  }
  return labels[cuidados]
}
