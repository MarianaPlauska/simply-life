import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, ListChecks, Clock, Heart, Sparkles, ChevronRight, Share2, Trophy, AlertTriangle, Leaf } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { buildWeeklyEpisode, type EpisodeMomentType } from '../../lib/weeklyEpisode'
import { computeGamificationProfile } from '../../lib/gamificationProfile'
import { resolveEpisodeFrameClass } from '../../lib/axelCosmetics'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface WeeklyEpisodeCardProps
{
  embedded?: boolean
  compact?: boolean
}

const MOMENT_ICON: Record<EpisodeMomentType, typeof Trophy> = {
  conquista: Trophy,
  susto: AlertTriangle,
  cuidado: Leaf,
}

const MOMENT_TONE: Record<EpisodeMomentType, string> = {
  conquista: 'text-concluido',
  susto: 'text-atencao',
  cuidado: 'text-accent',
}

const PANEL = AXEL_BORDERLESS_PANEL

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
    <div className="sl-stat-chip flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1">
        <Icon size={11} className={iconClass} strokeWidth={1.75} />
        <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
          {label}
        </span>
      </div>
      <p className={`text-sm font-display tabular-nums leading-none ${AXEL_TEXT_PRIMARY}`}>
        {value}
      </p>
    </div>
  )
}

export function WeeklyEpisodeCard({ embedded = false, compact = false }: WeeklyEpisodeCardProps)
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
  const isStreakSafeToday = useTaskStore((s) => s.isStreakSafeToday)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const transactions = useTaskStore((s) => s.transactions)
  const billSettlements = useTaskStore((s) => s.billSettlements)

  const [sharing, setSharing] = useState(false)
  const [expanded, setExpanded] = useState(!compact)

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
      streakCount,
      isStreakSafeToday: isStreakSafeToday(),
      contasFixas,
      transactions,
      billSettlements,
    }),
    [
      streakSavedDays,
      focusMinutesByDate,
      tarefas,
      humorSemana,
      userQuests,
      getTotalXp,
      profile.level,
      streakCount,
      isStreakSafeToday,
      contasFixas,
      transactions,
      billSettlements,
    ],
  )

  const handleShare = async () =>
  {
    setSharing(true)
    try
    {
      if (navigator.share)
      {
        await navigator.share({
          title: episode.capituloTitulo,
          text: episode.shareText,
        })
        return
      }
      await navigator.clipboard.writeText(episode.shareText)
      toast.success('Resumo copiado')
    }
    catch
    {
      try
      {
        await navigator.clipboard.writeText(episode.shareText)
        toast.success('Resumo copiado')
      }
      catch
      {
        toast.error('Não foi possível compartilhar agora')
      }
    }
    finally
    {
      setSharing(false)
    }
  }

  if (compact && !expanded)
  {
    return (
      <section className={`${PANEL} ${frameClass} p-2.5 sm:p-3`} aria-labelledby="weekly-episode-title">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="min-w-0 flex-1 text-left"
          >
            <p className="font-mono text-[11px] uppercase tracking-wide text-accent">
              Episódio AXEL
            </p>
            <h2 id="weekly-episode-title" className="text-[14px] font-display mt-0.5 truncate text-ink">
              {episode.headline}
            </h2>
            <p className="font-mono text-[12px] mt-0.5 truncate text-ink-muted">
              {episode.cliffhanger}
            </p>
          </button>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Link
              to="/perfil"
              className="font-mono text-[10px] uppercase text-accent hover:underline"
            >
              Abrir
            </Link>
            <button
              type="button"
              onClick={() => void handleShare()}
              disabled={sharing}
              className="p-1 rounded-sl border border-line bg-chrome text-ink-muted hover:text-ink"
              aria-label="Compartilhar episódio"
            >
              <Share2 size={11} />
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`${PANEL} ${frameClass} ${compact ? 'p-2.5 sm:p-3' : ''}`} aria-labelledby="weekly-episode-title-full">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className={AXEL_SECTION_TITLE}>
            <Sparkles size={10} className="inline mr-1.5 text-accent" />
            Episódio AXEL
          </p>
          <h2 id="weekly-episode-title-full" className={`text-sm font-display mt-1 ${AXEL_TEXT_PRIMARY}`}>
            {episode.capituloTitulo}
          </h2>
          <p className={`font-mono text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            {episode.periodo}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {embedded && (
            <Link
              to="/perfil"
              className="inline-flex items-center gap-0.5 font-mono text-[10px] uppercase text-accent hover:underline"
            >
              Perfil
              <ChevronRight size={12} />
            </Link>
          )}
          {compact && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="font-mono text-[10px] uppercase text-ink-muted hover:text-ink"
            >
              Recolher
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={sharing}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-sl border border-line bg-chrome font-mono text-[10px] uppercase text-ink-muted hover:text-ink"
          >
            <Share2 size={11} />
            Share
          </button>
        </div>
      </header>

      {episode.momentos.length > 0 && (
        <div className="space-y-2 mb-3">
          {episode.momentos.map((mom, i) =>
          {
            const Icon = MOMENT_ICON[mom.tipo]
            const tone = MOMENT_TONE[mom.tipo]
            return (
              <article key={i} className="flex gap-2.5 p-2 rounded-sl border border-line bg-chrome">
                <div className="sl-icon-box">
                  <Icon size={14} className={tone} />
                </div>
                <div className="min-w-0">
                  <p className={`font-mono text-[10px] uppercase ${tone}`}>{mom.titulo}</p>
                  <p className="text-[13px] mt-0.5 leading-relaxed text-ink-muted">
                    {mom.texto}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        <StatPill icon={Flame} label="Ofens." value={String(episode.ofensivasSalvas)} iconClass="text-orange-500" />
        <StatPill icon={ListChecks} label="Tarefas" value={String(episode.tarefasConcluidas)} iconClass="text-accent" />
        <StatPill icon={Clock} label="Foco" value={`${episode.focoMinutos}m`} iconClass="text-ink-muted" />
        <StatPill icon={Heart} label="Humor" value={episode.humorMedio > 0 ? episode.humorMedio.toFixed(1) : '—'} iconClass="text-atencao" />
      </div>

      <div className="p-2.5 rounded-sl border border-dashed border-accent/40 bg-accent/5">
        <p className="font-mono text-[10px] uppercase text-accent mb-0.5">Cliffhanger</p>
        <p className="text-[13px] leading-relaxed text-ink">{episode.cliffhanger}</p>
      </div>
    </section>
  )
}
