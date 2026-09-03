import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { bucketByDueDate } from '../../lib/dueBucket'
import { AXEL_LINK, AXEL_TEXT_PRIMARY } from '../../constants/axelSurfaces'

export function IntentionStrip()
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const count = useMemo(
    () => bucketByDueDate(tarefas).sem_prazo.filter((t) => t.status !== 'concluida').length,
    [tarefas],
  )

  if (count === 0) return null

  return (
    <section aria-label="Intenções sem hora">
      <p className="sl-section-label">Sem hora</p>
      <p className={`mt-1 text-[15px] ${AXEL_TEXT_PRIMARY}`}>
        {count === 1 ? '1 coisa no Kanban sem prazo.' : `${count} coisas no Kanban sem prazo.`}
      </p>
      <Link
        to="/kanban"
        className={`inline-flex items-center min-h-[44px] text-[13px] font-medium ${AXEL_LINK}`}
      >
        Abrir no Kanban
      </Link>
    </section>
  )
}
