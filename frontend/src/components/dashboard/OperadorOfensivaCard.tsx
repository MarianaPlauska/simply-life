import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Shield, Zap, TrendingUp } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { computeGamificationProfile, XP_PER_LEVEL } from '../../lib/gamificationProfile'
import { STREAK_MIN_SCORE } from '../../lib/proofOfWork'
import { ProductivityHeatmap } from './ProductivityHeatmap'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_PROGRESS,
  AXEL_PROGRESS_THICK,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

// Momentum AXEL — prova de trabalho, não RPG no dashboard

interface AtributoChip
{
  key: 'foco' | 'vitalidade' | 'estabilidade'
  label: string
  hint: string
  Icon: typeof Zap
  iconClass: string
}

const ATRIBUTOS: AtributoChip[] = [
  { key: 'foco', label: 'Foco', hint: 'timer + execução', Icon: Zap, iconClass: 'text-accent' },
  { key: 'vitalidade', label: 'Vitalidade', hint: 'saúde e hábitos', Icon: Flame, iconClass: 'text-atencao' },
  { key: 'estabilidade', label: 'Estabilidade', hint: 'consistência', Icon: Shield, iconClass: 'text-ink-muted' },
]

function arquetipo(level: number): string
{
  if (level >= 20) return 'Mestre'
  if (level >= 10) return 'Veterano'
  if (level >= 5) return 'Operador'
  return 'Recruta'
}

export function OperadorOfensivaCard()
{
  const navigate = useNavigate()
  const userStats = useTaskStore((s) => s.userStats)
  const streakCount = useTaskStore((s) => s.streakCount)
  const hasCompletedTaskToday = useTaskStore((s) => s.hasCompletedTaskToday)
  const streakFreezes = useTaskStore((s) => s.streakFreezes)
  const focusMinutesByDate = useTaskStore((s) => s.focusMinutesByDate)
  const fetchGamificacaoStats = useTaskStore((s) => s.fetchGamificacaoStats)
  const fetchAchievements = useTaskStore((s) => s.fetchAchievements)
  const fetchQuests = useTaskStore((s) => s.fetchQuests)

  useEffect(() =>
  {
    fetchGamificacaoStats?.()
    fetchAchievements?.()
    fetchQuests?.()
  }, [fetchGamificacaoStats, fetchAchievements, fetchQuests])

  const profile = computeGamificationProfile(userStats)
  const attrLevels = {
    foco: Math.floor((userStats?.xp_foco ?? 0) / XP_PER_LEVEL) + 1,
    vitalidade: Math.floor((userStats?.xp_vitalidade ?? 0) / XP_PER_LEVEL) + 1,
    estabilidade: Math.floor((userStats?.xp_estabilidade ?? 0) / XP_PER_LEVEL) + 1,
  }

  const proofLabel = hasCompletedTaskToday
    ? 'Prova de trabalho validada hoje'
    : `Hoje: score > ${STREAK_MIN_SCORE} + ${15} min de foco na tarefa`

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} flex flex-col`} aria-labelledby="momentum-heading">
      <div className="flex items-start gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.75} />
        <div>
          <h2 id="momentum-heading" className={AXEL_SECTION_TITLE}>
            Momentum AXEL
          </h2>
          <p className={`text-[13px] mt-1 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
            {proofLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-sl border border-line bg-chrome/30">
          <p className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>Ofensiva</p>
          <p className="text-2xl font-display tabular-nums text-atencao mt-1">
            {streakCount}
            <span className="text-sm text-ink-muted ml-1">dias</span>
          </p>
          {streakFreezes > 0 && (
            <p className={`font-mono text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              {streakFreezes} escudo{streakFreezes > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="p-3 rounded-sl border border-line bg-chrome/30">
          <p className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            Nível {profile.level}
          </p>
          <p className={`text-sm font-display mt-1 ${AXEL_TEXT_PRIMARY}`}>{arquetipo(profile.level)}</p>
          <p className={`font-mono text-[11px] tabular-nums mt-1 ${AXEL_TEXT_SECONDARY}`}>
            {profile.xpInLevel}/{profile.xpToNextLevel} XP
          </p>
        </div>
      </div>

      <div className={AXEL_PROGRESS_THICK}>
        <div
          className={`h-full rounded-sl transition-all duration-500 ease-out ${AXEL_PROGRESS}`}
          style={{ width: `${profile.xpPct}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
        {ATRIBUTOS.map((a) =>
        {
          const Icon = a.Icon
          return (
            <div key={a.key} className="text-center py-1">
              <Icon className={`w-4 h-4 mx-auto ${a.iconClass}`} strokeWidth={1.75} />
              <p className={`text-lg font-display tabular-nums mt-1 ${AXEL_TEXT_PRIMARY}`}>
                {attrLevels[a.key]}
              </p>
              <p className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>{a.label}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-line">
        <ProductivityHeatmap focusMinutesByDate={focusMinutesByDate} compact />
      </div>

      <button
        type="button"
        onClick={() => navigate('/kanban')}
        className={`mt-4 w-full font-mono text-[11px] uppercase tracking-wide py-2.5 ${AXEL_BTN_PRIMARY}`}
      >
        Ganhar XP executando
      </button>
    </section>
  )
}
