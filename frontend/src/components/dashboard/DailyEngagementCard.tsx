import { useEffect, useRef, useState } from 'react'
import { Flame, Target, ChevronRight, Check, Circle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { buildOffensiveChecklist } from '../../lib/offensiveToday'
import { AxelCareMoment, useAxelCareMomentKey } from '../axel/AxelCareMoment'
import { AXEL_PROGRESS, AXEL_PROGRESS_THICK, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Loop diário — ofensiva + missão (Duolingo-style: 1 ação salva o dia)

interface DailyEngagementCardProps
{
  /** strip = faixa horizontal no topo do hero; card = bloco vertical legado */
  variant?: 'card' | 'strip'
}

export function DailyEngagementCard({ variant = 'card' }: DailyEngagementCardProps)
{
  const navigate = useNavigate()
  const streakCount = useTaskStore((s) => s.streakCount)
  const hasCompletedTaskToday = useTaskStore((s) => s.hasCompletedTaskToday)
  const hasWellbeingToday = useTaskStore((s) => s.hasWellbeingToday)
  const syncStreakCalendarDay = useTaskStore((s) => s.syncStreakCalendarDay)
  const userQuests = useTaskStore((s) => s.userQuests)
  const fetchQuests = useTaskStore((s) => s.fetchQuests)
  const userStats = useTaskStore((s) => s.userStats)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const userProfile = useTaskStore((s) => s.userProfile)
  const { key: streakCareKey, trigger: triggerStreakCare } = useAxelCareMomentKey()
  const [showStreakCare, setShowStreakCare] = useState(false)
  const wasSafeRef = useRef(false)

  const displayName = workspacePrefs.axel_calls_you
    || workspacePrefs.display_name
    || userProfile?.nome
    || ''

  useEffect(() =>
  {
    syncStreakCalendarDay()
    void fetchQuests()
  }, [syncStreakCalendarDay, fetchQuests])

  const offensive = buildOffensiveChecklist(
    hasCompletedTaskToday,
    hasWellbeingToday,
    streakCount,
  )

  useEffect(() =>
  {
    if (!wasSafeRef.current && offensive.safe)
    {
      setShowStreakCare(true)
      triggerStreakCare()
    }
    wasSafeRef.current = offensive.safe
  }, [offensive.safe, triggerStreakCare])

  const dailyQuest = userQuests.find((q) => q.tipo === 'diaria' && !q.concluida)
    ?? userQuests.find((q) => !q.concluida)
  const questPct = dailyQuest && dailyQuest.meta > 0
    ? Math.min(100, Math.round((dailyQuest.progresso / dailyQuest.meta) * 100))
    : 0

  const level = userStats?.level ?? 1
  const xpFoco = userStats?.xp_foco ?? 0
  const xpInLevel = xpFoco % 100

  const checklist = [
    {
      id: 'task',
      label: '1 tarefa',
      done: offensive.taskDone,
      path: '/kanban',
    },
    {
      id: 'wellbeing',
      label: 'Humor / ritual',
      done: offensive.wellbeingDone,
      path: '/#dashboard-wellbeing',
    },
  ]

  if (variant === 'strip')
  {
    return (
      <>
      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 px-3 sm:px-4 py-3 border-b border-line"
        aria-label="Ofensiva diária"
      >
        <div className="flex items-center gap-2.5 shrink-0">
          <div className={`p-1.5 rounded-sl ${offensive.safe ? 'bg-accent-muted' : 'bg-chrome'}`}>
            <Flame
              className={`w-5 h-5 ${offensive.safe ? 'text-accent' : 'text-ink-muted'}`}
              strokeWidth={1.75}
            />
          </div>
          <div>
            <p className={`text-xl font-display tabular-nums leading-none ${AXEL_TEXT_PRIMARY}`}>
              {streakCount}
              <span className="text-xs font-normal text-ink-muted ml-1">dias</span>
            </p>
            <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
              {offensive.safe ? 'Dia salvo' : 'Salve o dia com 1 ação'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {checklist.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sl border text-[12px] transition-colors ${
                item.done
                  ? 'border-concluido/30 bg-concluido/8 text-concluido'
                  : 'border-line bg-card hover:bg-chrome/50 text-ink'
              }`}
            >
              {item.done ? <Check size={12} /> : <Circle size={12} className="opacity-40" />}
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:min-w-[140px] sm:max-w-[200px] shrink-0">
          <Target size={12} className="text-accent shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className={`text-[11px] font-medium ${AXEL_TEXT_PRIMARY}`}>Nv {level}</span>
              <span className={`font-mono text-[10px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
                {xpInLevel}/100
              </span>
            </div>
            <div className={`${AXEL_PROGRESS_THICK} h-1.5`}>
              <div className={`h-full rounded-sl ${AXEL_PROGRESS}`} style={{ width: `${xpInLevel}%` }} />
            </div>
            {dailyQuest && (
              <p className={`text-[10px] mt-0.5 truncate ${AXEL_TEXT_SECONDARY}`}>
                {dailyQuest.titulo} · {questPct}%
              </p>
            )}
          </div>
        </div>
      </div>
      {showStreakCare && (
        <AxelCareMoment
          key={streakCareKey}
          avatarStyle={workspacePrefs.avatar_style}
          displayName={displayName}
          streak
          className="mx-3 mb-2"
          onDone={() => setShowStreakCare(false)}
        />
      )}
      </>
    )
  }

  return (
    <section
      className="w-full flex flex-col border border-line rounded-sl bg-card p-4"
      aria-label="Ofensiva diária"
    >
      <header className="flex items-center justify-between gap-2 mb-3">
        <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${AXEL_TEXT_SECONDARY}`}>
          Ofensiva
        </span>
        {offensive.safe && (
          <span className="font-mono text-[9px] uppercase text-concluido">Dia salvo</span>
        )}
      </header>

      <div className="flex items-center gap-3 p-3 rounded-sl border border-orange-500/25 bg-orange-500/5 mb-3">
        <div className={`p-2 rounded-sl ${offensive.safe ? 'bg-orange-500/20' : 'bg-chrome/40'}`}>
          <Flame
            className={`w-6 h-6 ${offensive.safe ? 'text-orange-500' : 'text-ink-muted'}`}
            strokeWidth={1.75}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-2xl font-display tabular-nums leading-none ${AXEL_TEXT_PRIMARY}`}>
            {streakCount}
            <span className="text-sm font-normal text-ink-muted ml-1">dias</span>
          </p>
          <p className={`text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
            {offensive.safe
              ? 'Volte amanhã para continuar a sequência'
              : 'Faça 1 item abaixo para manter a ofensiva'}
          </p>
        </div>
      </div>

      <ul className="space-y-1.5 mb-3">
        {checklist.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-sl border text-left text-[12px] transition-colors ${
                item.done
                  ? 'border-concluido/30 bg-concluido/8 text-concluido'
                  : 'border-line bg-chrome/30 hover:bg-chrome/50 text-ink'
              }`}
            >
              {item.done ? <Check size={14} /> : <Circle size={14} className="opacity-40" />}
              <span className="flex-1">{item.label}</span>
              <ChevronRight size={12} className="opacity-50" />
            </button>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-accent shrink-0" />
          <span className={`text-xs font-medium ${AXEL_TEXT_PRIMARY}`}>Nível {level}</span>
          <span className={`ml-auto font-mono text-[11px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
            {xpInLevel}/100 XP
          </span>
        </div>
        <div className={AXEL_PROGRESS_THICK}>
          <div className={`h-full rounded-sl ${AXEL_PROGRESS}`} style={{ width: `${xpInLevel}%` }} />
        </div>

        {dailyQuest && (
          <p className={`text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
            Missão: {dailyQuest.titulo} (+{dailyQuest.recompensa_xp} XP) · {questPct}%
          </p>
        )}
      </div>
    </section>
  )
}
