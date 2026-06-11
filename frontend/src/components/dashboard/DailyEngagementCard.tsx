import { useEffect } from 'react'
import { Flame, Target, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_PROGRESS, AXEL_PROGRESS_THICK, AXEL_ROW_HOVER, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Loop diário — ofensiva + missão do dia (retenção estilo Duolingo/LevelUp)

export function DailyEngagementCard()
{
  const navigate = useNavigate()
  const streakCount = useTaskStore((s) => s.streakCount)
  const hasCompletedTaskToday = useTaskStore((s) => s.hasCompletedTaskToday)
  const syncStreakCalendarDay = useTaskStore((s) => s.syncStreakCalendarDay)
  const userQuests = useTaskStore((s) => s.userQuests)
  const fetchQuests = useTaskStore((s) => s.fetchQuests)
  const userStats = useTaskStore((s) => s.userStats)

  useEffect(() =>
  {
    syncStreakCalendarDay()
    void fetchQuests()
  }, [syncStreakCalendarDay, fetchQuests])

  const dailyQuest = userQuests.find((q) => q.tipo === 'diaria' && !q.concluida)
    ?? userQuests.find((q) => !q.concluida)
  const questPct = dailyQuest && dailyQuest.meta > 0
    ? Math.min(100, Math.round((dailyQuest.progresso / dailyQuest.meta) * 100))
    : 0

  const level = userStats?.level ?? 1
  const xpFoco = userStats?.xp_foco ?? 0
  const xpInLevel = xpFoco % 100

  return (
    <section
      className={`w-full h-full min-h-[240px] flex flex-col border border-line rounded-sl bg-card p-4 ${AXEL_ROW_HOVER}`}
      aria-label="Loop diário"
    >
      <header className="flex items-center justify-between gap-2 mb-3">
        <span className={`font-mono text-[9px] uppercase tracking-[0.14em] ${AXEL_TEXT_SECONDARY}`}>
          Seu dia
        </span>
        <button
          type="button"
          onClick={() => navigate('/kanban')}
          className="inline-flex items-center gap-0.5 font-mono text-[9px] uppercase text-accent hover:underline"
        >
          Executar
          <ChevronRight size={12} />
        </button>
      </header>

      <div className="flex items-center gap-3 p-3 rounded-sl border border-orange-500/25 bg-orange-500/5 mb-3">
        <div className={`p-2 rounded-sl ${hasCompletedTaskToday ? 'bg-orange-500/20' : 'bg-chrome/40'}`}>
          <Flame
            className={`w-6 h-6 ${hasCompletedTaskToday ? 'text-orange-500' : 'text-ink-muted'}`}
            strokeWidth={1.75}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-2xl font-display tabular-nums leading-none ${AXEL_TEXT_PRIMARY}`}>
            {streakCount}
            <span className="text-sm font-normal text-ink-muted ml-1">
              {streakCount === 1 ? 'dia' : 'dias'}
            </span>
          </p>
          <p className={`text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
            {hasCompletedTaskToday
              ? 'Ofensiva segura hoje — volte amanhã'
              : 'Complete 1 tarefa hoje para manter a ofensiva'}
          </p>
        </div>
      </div>

      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-accent shrink-0" />
          <span className={`text-xs font-medium ${AXEL_TEXT_PRIMARY}`}>Nível {level}</span>
          <span className={`ml-auto font-mono text-[10px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
            {xpInLevel}/100 XP foco
          </span>
        </div>
        <div className={AXEL_PROGRESS_THICK}>
          <div className={`h-full rounded-sl ${AXEL_PROGRESS}`} style={{ width: `${xpInLevel}%` }} />
        </div>

        {dailyQuest ? (
          <div className="mt-3 p-2.5 rounded-sl border border-line bg-chrome/20">
            <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
              Missão do dia
            </p>
            <p className={`text-sm mt-1 ${AXEL_TEXT_PRIMARY}`}>{dailyQuest.titulo}</p>
            <div className={`${AXEL_PROGRESS_THICK} mt-2`}>
              <div className="h-full bg-accent/80 rounded-sl" style={{ width: `${questPct}%` }} />
            </div>
            <p className={`font-mono text-[10px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              +{dailyQuest.recompensa_xp} XP · {dailyQuest.progresso}/{dailyQuest.meta}
            </p>
          </div>
        ) : (
          <p className={`text-[11px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
            Missões diárias aparecem ao usar o sistema.
          </p>
        )}
      </div>
    </section>
  )
}
