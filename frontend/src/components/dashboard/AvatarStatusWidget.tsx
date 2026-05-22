import { useEffect } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { Brain, HeartPulse, ShieldCheck, Trophy, Flame } from 'lucide-react'

// AvatarStatusWidget — bloco USER STATUS estilo Orion
// Sem gradientes/sombras pesadas, paleta deep purple/indigo

export function AvatarStatusWidget()
{
  const userStats = useTaskStore((s) => s.userStats)
  const achievements = useTaskStore((s) => s.achievements)
  const fetchGamificacaoStats = useTaskStore((s) => s.fetchGamificacaoStats)
  const fetchAchievements = useTaskStore((s) => s.fetchAchievements)

  useEffect(() =>
  {
    fetchGamificacaoStats()
    fetchAchievements()
  }, [fetchGamificacaoStats, fetchAchievements])

  if (!userStats) return null

  const totalXP = userStats.xp_foco + userStats.xp_vitalidade + userStats.xp_estabilidade
  const currentLevelXP = totalXP % 100
  const xpPercentage = Math.min(100, Math.max(0, currentLevelXP))

  // titulo conforme atributo dominante (Allman + comentario PT)
  let roleTitle = 'Recruta do Jarvis'
  if (userStats.level >= 2)
  {
    const maxVal = Math.max(userStats.xp_foco, userStats.xp_vitalidade, userStats.xp_estabilidade)
    if (maxVal === userStats.xp_foco) roleTitle = 'Mestre Cognitivo'
    else if (maxVal === userStats.xp_vitalidade) roleTitle = 'Guardião Vital'
    else roleTitle = 'Orquestrador Estável'
  }

  return (
    <aside className="bg-card border border-zinc-900 rounded-md flex flex-col">
      <header className="px-3 py-2 border-b border-zinc-900 flex items-center justify-between">
        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">User Status</span>
        <span className="text-[10px] text-zinc-600 font-mono">lv {userStats.level}</span>
      </header>

      {/* avatar — quadrado pixel-like, sem glow */}
      <div className="px-3 py-3 flex flex-col items-center gap-2">
        <div className="relative w-20 h-20 rounded bg-black border border-violet-500/30 flex items-center justify-center overflow-hidden">
          <PixelAvatar level={userStats.level} />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-semibold text-zinc-100">{roleTitle}</p>
          <p className="text-[10px] text-zinc-500 font-mono">{totalXP} XP total</p>
        </div>
      </div>

      {/* atributos — 3 pilares densos */}
      <div className="grid grid-cols-3 divide-x divide-zinc-900 border-y border-zinc-900">
        <StatPill Icon={Brain}      label="Foco"          value={userStats.xp_foco}          color="text-violet-400" />
        <StatPill Icon={HeartPulse} label="Vitalidade"    value={userStats.xp_vitalidade}    color="text-emerald-400" />
        <StatPill Icon={ShieldCheck} label="Estabilidade" value={userStats.xp_estabilidade}  color="text-amber-400" />
      </div>

      {/* barra de XP — fina, deep purple */}
      <div className="px-3 py-2">
        <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-1">
          <span>Nível {userStats.level}</span>
          <span className="font-mono text-zinc-300">{currentLevelXP}/100</span>
        </div>
        <div className="h-1 rounded-full bg-zinc-900 overflow-hidden">
          <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${xpPercentage}%` }} />
        </div>
      </div>

      {/* streaks — chips minimalistas */}
      {(userStats.streak_saude > 0 || userStats.streak_foco > 0) && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {userStats.streak_saude > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-emerald-300 bg-emerald-500/5 border border-emerald-500/15">
              <Flame className="w-3 h-3" /> Saúde {userStats.streak_saude}d
            </span>
          )}
          {userStats.streak_foco > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-violet-300 bg-violet-500/5 border border-violet-500/15">
              <Flame className="w-3 h-3" /> Foco {userStats.streak_foco}/3
            </span>
          )}
        </div>
      )}

      {/* conquistas — inventario compacto */}
      <div className="border-t border-zinc-900 px-3 py-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
          <Trophy className="w-3 h-3 text-amber-500" />
          Inventário · {achievements.length}
        </div>
        {achievements.length === 0 ? (
          <p className="text-[11px] text-zinc-600">Nenhuma conquista ainda.</p>
        ) : (
          <div className="grid grid-cols-5 gap-1">
            {achievements.slice(0, 10).map((ach) => (
              <div
                key={ach.id}
                title={`${ach.titulo} — ${ach.descricao}`}
                className="aspect-square rounded bg-black border border-zinc-900 flex items-center justify-center hover:border-amber-500/40 cursor-help"
              >
                <Trophy className="w-3 h-3 text-amber-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

interface StatPillProps
{
  Icon: typeof Brain
  label: string
  value: number
  color: string
}

function StatPill({ Icon, label, value, color }: StatPillProps)
{
  return (
    <div className="flex flex-col items-center justify-center py-2 px-1">
      <Icon className={`w-3.5 h-3.5 ${color} mb-1`} />
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="text-[12px] font-mono font-semibold text-zinc-200 mt-0.5">{value}</span>
    </div>
  )
}

// PixelAvatar — silhueta simples desenhada em SVG, evolui com o nivel
function PixelAvatar({ level }: { level: number })
{
  // cores deep purple/indigo conforme design system (sem neons)
  const accent = level >= 5 ? '#8b5cf6' : level >= 2 ? '#6366f1' : '#4f46e5'

  return (
    <svg viewBox="0 0 16 16" className="w-14 h-14" shapeRendering="crispEdges">
      {/* cabeca */}
      <rect x="5" y="2" width="6" height="5" fill={accent} />
      {/* olhos */}
      <rect x="6" y="4" width="1" height="1" fill="#000" />
      <rect x="9" y="4" width="1" height="1" fill="#000" />
      {/* corpo */}
      <rect x="4" y="7" width="8" height="6" fill={accent} opacity="0.85" />
      {/* bracos */}
      <rect x="3" y="8" width="1" height="3" fill={accent} opacity="0.7" />
      <rect x="12" y="8" width="1" height="3" fill={accent} opacity="0.7" />
      {/* pernas */}
      <rect x="5" y="13" width="2" height="2" fill={accent} opacity="0.6" />
      <rect x="9" y="13" width="2" height="2" fill={accent} opacity="0.6" />
    </svg>
  )
}
