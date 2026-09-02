import { useEffect, useMemo } from 'react'
import { createAvatar } from '@dicebear/core'
import { pixelArt } from '@dicebear/collection'
import { Brain, HeartPulse, ShieldCheck, Trophy, Flame } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { XP_PER_LEVEL, xpProgressInLevel } from '../../lib/xpEconomy'

// Status do usuário — avatar + Foco / Vitalidade / Estabilidade

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

  const avatarSvg = useMemo(() =>
  {
    const seed = userStats?.id || 'simply-life'
    return createAvatar(pixelArt, {
      seed,
      backgroundColor: ['1E1E1E'],
      clothingColor: ['8B9BA8', '7FA37A', 'C9A15C', '3C3C3C', 'D4D4D4'],
      hatColor: ['8B9BA8', '7FA37A'],
    }).toString()
  }, [userStats?.id])

  if (!userStats) return null

  const totalXP = userStats.xp_foco + userStats.xp_vitalidade + userStats.xp_estabilidade
  const { xpInLevel, pct: xpPct } = xpProgressInLevel(totalXP)

  let roleTitle = 'Começando'
  if (userStats.level >= 2)
  {
    const maxVal = Math.max(userStats.xp_foco, userStats.xp_vitalidade, userStats.xp_estabilidade)
    if (maxVal === userStats.xp_foco) roleTitle = 'Foco em alta'
    else if (maxVal === userStats.xp_vitalidade) roleTitle = 'Vitalidade em alta'
    else roleTitle = 'Estabilidade em alta'
  }

  return (
    <aside className="bg-card border border-line rounded-sl flex flex-col">
      <header className="px-3 py-2 border-b border-line flex items-center justify-between">
        <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Status</span>
        <span className="text-[11px] text-ink-faint font-mono">nv {userStats.level}</span>
      </header>

      <div className="px-3 py-3 flex flex-col items-center gap-2">
        <div
          className="w-24 h-24 rounded-sl bg-fundo border border-line p-1 [&_svg]:w-full [&_svg]:h-full"
          dangerouslySetInnerHTML={{ __html: avatarSvg }}
        />
        <div className="text-center">
          <p className="text-[13px] font-semibold text-ink">{roleTitle}</p>
          <p className="text-[11px] text-ink-muted font-mono">{totalXP} XP total</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
        <Attribute Icon={Brain} label="Foco" value={userStats.xp_foco} ring="ring-tasks/40" color="text-tasks" />
        <Attribute Icon={HeartPulse} label="Vitalidade" value={userStats.xp_vitalidade} ring="ring-health/40" color="text-health" />
        <Attribute Icon={ShieldCheck} label="Estabilidade" value={userStats.xp_estabilidade} ring="ring-finance/40" color="text-finance" />
      </div>

      <div className="px-3 pb-2 border-t border-line pt-2">
        <div className="flex justify-between text-[11px] text-ink-muted mb-1">
          <span>Nível {userStats.level} · {userStats.ouro ?? 0} ouro</span>
          <span className="font-mono text-ink">{xpInLevel}/{XP_PER_LEVEL}</span>
        </div>
        <div className="h-1 rounded-full bg-chrome overflow-hidden">
          <div className="h-full bg-ink transition-all duration-500" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      {(userStats.streak_saude > 0 || userStats.streak_foco > 0) && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {userStats.streak_saude > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sl text-[11px] font-medium text-health bg-health-muted border border-health/20">
              <Flame className="w-3 h-3" /> Saúde {userStats.streak_saude}d
            </span>
          )}
          {userStats.streak_foco > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sl text-[11px] font-medium text-tasks bg-tasks-muted border border-tasks/20">
              <Flame className="w-3 h-3" /> Foco {userStats.streak_foco}/3
            </span>
          )}
        </div>
      )}

      <div className="border-t border-line px-3 py-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-1.5">
          <Trophy className="w-3 h-3 text-finance" />
          Inventário · {achievements.length}
        </div>
        {achievements.length === 0 ? (
          <p className="text-[12px] text-ink-muted">Nenhuma conquista ainda.</p>
        ) : (
          <div className="grid grid-cols-5 gap-1">
            {achievements.slice(0, 10).map((ach) => (
              <div
                key={ach.id}
                title={`${ach.titulo} — ${ach.descricao}`}
                className="aspect-square rounded-sl bg-chrome border border-line flex items-center justify-center hover:border-finance/40 cursor-help"
              >
                <Trophy className="w-3 h-3 text-finance" />
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

interface AttributeProps
{
  Icon: typeof Brain
  label: string
  value: number
  ring: string
  color: string
}

function Attribute({ Icon, label, value, ring, color }: AttributeProps)
{
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative w-10 h-10 rounded-full bg-chrome ring-1 ${ring} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">{label}</span>
      <span className={`text-[12px] font-mono font-semibold ${color}`}>{value}</span>
    </div>
  )
}
