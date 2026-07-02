import { useEffect, useMemo, useRef, useState } from 'react'
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
}

const MOMENT_ICON: Record<EpisodeMomentType, typeof Trophy> = {
  conquista: Trophy,
  susto: AlertTriangle,
  cuidado: Leaf,
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
  const isStreakSafeToday = useTaskStore((s) => s.isStreakSafeToday)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const transactions = useTaskStore((s) => s.transactions)
  const billSettlements = useTaskStore((s) => s.billSettlements)

  const shareRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)

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
      toast.success('Resumo copiado — cole onde quiser compartilhar')
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

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} ${frameClass}`} aria-labelledby="weekly-episode-title">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className={AXEL_SECTION_TITLE}>
            <Sparkles size={10} className="inline mr-1.5 text-accent" />
            Episódio AXEL
          </p>
          <h2 id="weekly-episode-title" className={`${embedded ? 'text-sm' : 'text-base'} font-display mt-1 ${AXEL_TEXT_PRIMARY}`}>
            {episode.capituloTitulo}
          </h2>
          <p className={`font-mono text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            {episode.periodo} · {episode.headline}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {embedded && (
            <Link
              to="/perfil"
              className="inline-flex items-center gap-0.5 font-mono text-[9px] uppercase text-accent hover:underline"
            >
              Perfil
              <ChevronRight size={12} />
            </Link>
          )}
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={sharing}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-sl border border-line bg-chrome hover:bg-elevated font-mono text-[9px] uppercase text-ink-muted hover:text-ink transition-colors"
          >
            <Share2 size={11} />
            Share
          </button>
        </div>
      </header>

      <div ref={shareRef} className="space-y-3 mb-4">
        {episode.momentos.map((mom, i) =>
        {
          const Icon = MOMENT_ICON[mom.tipo]
          const tone = mom.tipo === 'conquista'
            ? 'text-concluido'
            : mom.tipo === 'susto'
              ? 'text-atencao'
              : 'text-accent'
          return (
            <article key={i} className="flex gap-3 p-3 rounded-sl border border-line bg-chrome/20">
              <Icon size={16} className={`shrink-0 mt-0.5 ${tone}`} />
              <div className="min-w-0">
                <p className={`font-mono text-[9px] uppercase ${tone}`}>{mom.titulo}</p>
                <p className={`text-[13px] mt-0.5 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
                  {mom.texto}
                </p>
              </div>
            </article>
          )
        })}
      </div>

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

      <div className="p-3 rounded-sl border border-dashed border-accent/40 bg-accent/5">
        <p className="font-mono text-[9px] uppercase text-accent mb-1">Cliffhanger</p>
        <p className={`text-[13px] leading-relaxed ${AXEL_TEXT_PRIMARY}`}>
          {episode.cliffhanger}
        </p>
      </div>

      <p className={`text-[12px] mt-3 ${AXEL_TEXT_SECONDARY}`}>
        {episode.resumo}
      </p>
    </section>
  )
}
