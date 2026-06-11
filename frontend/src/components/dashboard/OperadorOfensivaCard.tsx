import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Shield, Zap } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { computeGamificationProfile } from '../../lib/gamificationProfile'
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

// Ofensiva, XP e atributos — mora no Perfil, não no dashboard de comando

interface AtributoChip
{
  key: 'foco' | 'vitalidade' | 'estabilidade'
  label: string
  Icon: typeof Zap
  iconClass: string
}

const ATRIBUTOS: AtributoChip[] = [
  { key: 'foco', label: 'Foco', Icon: Zap, iconClass: 'text-accent' },
  { key: 'vitalidade', label: 'Vitalidade', Icon: Flame, iconClass: 'text-atencao' },
  { key: 'estabilidade', label: 'Estabilidade', Icon: Shield, iconClass: 'text-ink-muted' },
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
    foco: Math.floor((userStats?.xp_foco ?? 0) / 100) + 1,
    vitalidade: Math.floor((userStats?.xp_vitalidade ?? 0) / 100) + 1,
    estabilidade: Math.floor((userStats?.xp_estabilidade ?? 0) / 100) + 1,
  }

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} flex flex-col`} aria-labelledby="ofensiva-heading">
      <h2 id="ofensiva-heading" className={`${AXEL_SECTION_TITLE} mb-1`}>
        Ofensiva &amp; progresso
      </h2>
      <p className={`text-[12px] mb-4 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
        Apoio · aceleração · execução · log — seu ritmo de prova de trabalho.
      </p>

      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <p className={`font-mono text-[10px] uppercase tracking-wider ${AXEL_TEXT_SECONDARY}`}>
            Nível {profile.level} · {arquetipo(profile.level)}
          </p>
          <p className={`text-2xl font-display tabular-nums mt-1 ${AXEL_TEXT_PRIMARY}`}>
            {profile.xpInLevel}
            <span className={`text-sm ${AXEL_TEXT_SECONDARY}`}>/{profile.xpToNextLevel} XP</span>
          </p>
        </div>
        <div className="text-right">
          <p className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>Ofensiva</p>
          <p className="text-xl font-display tabular-nums text-atencao">{streakCount}d</p>
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
            <div key={a.key} className="flex flex-col items-center gap-1 py-2">
              <Icon className={`w-4 h-4 ${a.iconClass}`} strokeWidth={1.75} />
              <span className={`text-lg font-display tabular-nums ${AXEL_TEXT_PRIMARY}`}>
                {attrLevels[a.key]}
              </span>
              <span className={`font-mono text-[9px] uppercase tracking-wider ${AXEL_TEXT_SECONDARY}`}>
                {a.label}
              </span>
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
        className={`mt-4 w-full font-mono text-[10px] uppercase tracking-wide py-2.5 ${AXEL_BTN_PRIMARY}`}
      >
        Voltar à execução
      </button>
    </section>
  )
}
