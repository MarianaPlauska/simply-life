import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Flame, ListChecks, Clock, Heart, Sparkles, ChevronRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { buildWeeklyEpisode } from '../../lib/weeklyEpisode'
import { computeGamificationProfile } from '../../lib/gamificationProfile'
import { resolveEpisodeFrameClass } from '../../lib/axelCosmetics'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

// Recap semanal — episódio narrativo no perfil e dashboard

interface WeeklyEpisodeCardProps
{
  embedded?: boolean
}

function StatPill({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: typeof Flame
  label: string
  value: string
  iconClass: string
})
{
  return (
    <div className="flex flex-col gap-1 p-3 rounded-sl border border-line bg-chrome/25 min-w-0">
      <div className="flex items-center gap-1.5">
        <Icon size={12} className={iconClass} strokeWidth={1.75} />
        <span className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          {label}
        </span>
      </div>
      <p className={`text-lg font-display tabular-nums leading-none ${AXEL_TEXT_PRIMARY}`}>
        {value}
      </p>
    </div>
  )
}

export function WeeklyEpisodeCard({ embedded = false }: WeeklyEpisodeCardProps)
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const streakSavedDays = useTaskStore((s) => s.streakSavedDays)
  const focusMinutesByDate = useTaskStore((s) => s.focusMinutesByDate)
  const humorSemana = useTaskStore((s) => s.humorSemana)
  const userQuests = useTaskStore((s) => s.userQuests)
  const userStats = useTaskStore((s) => s.userStats)
  const getTotalXp = useTaskStore((s) => s.getTotalXp)
  const fetchHumorSemana = useTaskStore((s) => s.fetchHumorSemana)
  const fetchQuests = useTaskStore((s) => s.fetchQuests)
  const fetchGamificacaoStats = useTaskStore((s) => s.fetchGamificacaoStats)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const streakCount = useTaskStore((s) => s.streakCount)

  useEffect(() =>
  {
    void fetchHumorSemana()
    void fetchQuests()
    void fetchGamificacaoStats?.()
  }, [fetchHumorSemana, fetchQuests, fetchGamificacaoStats])

  const profile = computeGamificationProfile(userStats)
  const frameClass = resolveEpisodeFrameClass(
    workspacePrefs.active_cosmetics.frame,
    { level: profile.level, streakCount },
    workspacePrefs.unlocked_cosmetics,
  )
  const episode = useMemo(
    () => buildWeeklyEpisode({
      streakSavedDays,
      focusMinutesByDate,
      tarefas,
      humorSemana,
      userQuests,
      xpTotal: getTotalXp(),
      nivel: profile.level,
    }),
    [
      streakSavedDays,
      focusMinutesByDate,
      tarefas,
      humorSemana,
      userQuests,
      getTotalXp,
      profile.level,
    ],
  )

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} ${frameClass}`} aria-labelledby="weekly-episode-title">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className={AXEL_SECTION_TITLE}>
            <Sparkles size={10} className="inline mr-1.5 text-accent" />
            Seu episódio
          </p>
          <h2 id="weekly-episode-title" className={`${embedded ? 'text-sm' : 'text-base'} font-display mt-1 ${AXEL_TEXT_PRIMARY}`}>
            {episode.headline}
          </h2>
          <p className={`font-mono text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            {episode.periodo}
          </p>
        </div>
        {embedded && (
          <Link
            to="/perfil"
            className="shrink-0 inline-flex items-center gap-0.5 font-mono text-[9px] uppercase text-accent hover:underline"
          >
            Perfil
            <ChevronRight size={12} />
          </Link>
        )}
      </header>

      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${embedded ? 'mb-3' : 'mb-4'}`}>
        <StatPill
          icon={Flame}
          label="Ofensivas"
          value={String(episode.ofensivasSalvas)}
          iconClass="text-orange-500"
        />
        <StatPill
          icon={ListChecks}
          label="Tarefas"
          value={String(episode.tarefasConcluidas)}
          iconClass="text-accent"
        />
        <StatPill
          icon={Clock}
          label="Foco"
          value={`${episode.focoMinutos}m`}
          iconClass="text-ink-muted"
        />
        <StatPill
          icon={Heart}
          label="Humor"
          value={episode.humorMedio > 0 ? episode.humorMedio.toFixed(1) : '—'}
          iconClass="text-atencao"
        />
      </div>

      <p className={`text-[13px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
        {episode.resumo}
      </p>
    </section>
  )
}
