import type { AcademyPR } from '../../../lib/academyAnalytics'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'

interface AcademyPRTableProps
{
  prs: AcademyPR[]
}

function formatarData(iso: string): string
{
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function AcademyPRTable({ prs }: AcademyPRTableProps)
{
  if (prs.length === 0)
  {
    return (
      <p className={`text-[12px] py-2 ${AXEL_TEXT_SECONDARY}`}>
        Nenhum recorde novo neste período — continue registrando séries.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left text-ink-muted font-mono uppercase text-[10px] border-b border-line">
            <th className="pb-2 pr-2 font-normal">Exercício</th>
            <th className="pb-2 pr-2 font-normal">Carga</th>
            <th className="pb-2 font-normal">Data</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {prs.slice(0, 8).map((pr) => (
            <tr key={`${pr.exercicio_id}-${pr.data}`}>
              <td className={`py-2 pr-2 truncate max-w-[140px] ${AXEL_TEXT_PRIMARY}`}>
                {pr.exercicio}
              </td>
              <td className="py-2 pr-2 font-mono tabular-nums text-accent">
                {pr.carga_kg} kg
              </td>
              <td className={`py-2 font-mono tabular-nums ${AXEL_TEXT_SECONDARY}`}>
                {formatarData(pr.data)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
