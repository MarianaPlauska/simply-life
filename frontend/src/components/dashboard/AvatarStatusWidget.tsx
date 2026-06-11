import { useEffect, useMemo } from 'react'
import { createAvatar } from '@dicebear/core'
import { pixelArt } from '@dicebear/collection'
import { Brain, HeartPulse, ShieldCheck, Trophy, Flame } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'

// USER STATUS — bloco lateral estilo Axel
// Avatar pixel-art via @dicebear/collection (pixelArt) — biblioteca real
// 3 atributos circulares (Foco/Vitalidade/Estabilidade), barra de XP, inventario

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

  // seed estavel — usuario sempre ve o mesmo avatar
  const avatarSvg = useMemo(() =>
  {
    const seed = userStats?.id || 'jarvis-recruta'
    return createAvatar(pixelArt, {
      seed,
      // paleta minimalista deep purple/indigo (sem # nas cores) §2.3
      backgroundColor: ['09051400'],
      clothingColor: ['6366f1', '8b5cf6', '4f46e5', '7c3aed', '5b21b6'],
      hatColor: ['6366f1', '4f46e5'],
    }).toString()
  }, [userStats?.id])

  if (!userStats) return null

  const totalXP = userStats.xp_foco + userStats.xp_vitalidade + userStats.xp_estabilidade
  const currentLevelXP = totalXP % 100
  const xpPct = Math.min(100, Math.max(0, currentLevelXP))

  // titulo conforme atributo dominante
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
        <span className="text-[10px] font-bold text-violet-300 uppercase tracking-widest">User Status</span>
        <span className="text-[10px] text-zinc-600 font-mono">lv {userStats.level}</span>
      </header>

      {/* avatar — pixel-art via dicebear */}
      <div className="px-3 py-3 flex flex-col items-center gap-2">
        <div
          className="w-24 h-24 rounded bg-black border border-violet-500/20 p-1 [&_svg]:w-full [&_svg]:h-full"
          dangerouslySetInnerHTML={{ __html: avatarSvg }}
        />
        <div className="text-center">
          <p className="text-[13px] font-semibold text-zinc-100">{roleTitle}</p>
          <p className="text-[10px] text-zinc-500 font-mono">{totalXP} XP total</p>
        </div>
      </div>

      {/* atributos — 3 medalhoes circulares estilo AXEL */}
      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
        <Attribute Icon={Brain}       label="Foco"          value={userStats.xp_foco}         ring="ring-violet-500/40"  color="text-violet-300" />
        <Attribute Icon={HeartPulse}  label="Vitalidade"    value={userStats.xp_vitalidade}   ring="ring-emerald-500/40" color="text-emerald-300" />
        <Attribute Icon={ShieldCheck} label="Estabilidade"  value={userStats.xp_estabilidade} ring="ring-amber-500/40"   color="text-amber-300" />
      </div>

      {/* barra de XP */}
      <div className="px-3 pb-2 border-t border-zinc-900 pt-2">
        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
          <span>Nível {userStats.level}</span>
          <span className="font-mono text-zinc-300">{currentLevelXP}/100</span>
        </div>
        <div className="h-1 rounded-full bg-zinc-900 overflow-hidden">
          <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      {/* streaks */}
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

      {/* inventario de conquistas */}
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

interface AttributeProps
{
  Icon: typeof Brain
  label: string
  value: number
  ring: string
  color: string
}

// Medalhao circular para atributo — como na imagem Axel
function Attribute({ Icon, label, value, ring, color }: AttributeProps)
{
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative w-10 h-10 rounded-full bg-black ring-1 ${ring} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`text-[11px] font-mono font-semibold ${color}`}>{value}</span>
    </div>
  )
}
