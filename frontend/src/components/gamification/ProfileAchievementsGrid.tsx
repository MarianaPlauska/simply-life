import { Trophy } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

// Conquistas desbloqueadas — vitrine no perfil

export function ProfileAchievementsGrid()
{
  const achievements = useTaskStore((s) => s.achievements)

  if (achievements.length === 0)
  {
    return (
      <section className={AXEL_BORDERLESS_PANEL}>
        <header className="flex items-center gap-2 mb-2">
          <Trophy size={14} className="text-atencao" />
          <h2 className={AXEL_SECTION_TITLE}>Conquistas</h2>
        </header>
        <p className={`text-[13px] ${AXEL_TEXT_SECONDARY}`}>
          Complete missões e mantenha a ofensiva — badges aparecem aqui.
        </p>
      </section>
    )
  }

  return (
    <section className={AXEL_BORDERLESS_PANEL} aria-labelledby="achievements-title">
      <header className="flex items-center gap-2 mb-3">
        <Trophy size={14} className="text-atencao" />
        <h2 id="achievements-title" className={AXEL_SECTION_TITLE}>
          Conquistas
        </h2>
        <span className={`ml-auto font-mono text-[11px] ${AXEL_TEXT_SECONDARY}`}>
          {achievements.length}
        </span>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {achievements.map((a) => (
          <li
            key={a.id}
            className="flex gap-3 p-3 rounded-sl border border-line bg-chrome/20"
          >
            <span className="text-lg shrink-0" aria-hidden>
              🏅
            </span>
            <div className="min-w-0">
              <p className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>
                {a.titulo}
              </p>
              <p className={`text-[12px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                {a.descricao}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
