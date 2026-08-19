import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAvatar } from '@dicebear/core'
import { pixelArt } from '@dicebear/collection'
import { Flame, Trophy } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { StatusGaugeCircular } from './StatusGaugeCircular'

// SEU STATUS — painel lateral estilo Axel
// Avatar pixel-art + nivel/XP + 3 gauges + ofensiva + conquistas

export function StatusPanel()
{
  const navigate = useNavigate()
  const userStats = useTaskStore((s) => s.userStats)
  const achievements = useTaskStore((s) => s.achievements)
  const userProfile = useTaskStore((s) => s.userProfile)
  const fetchGamificacaoStats = useTaskStore((s) => s.fetchGamificacaoStats)
  const fetchAchievements = useTaskStore((s) => s.fetchAchievements)

  useEffect(() =>
  {
    fetchGamificacaoStats()
    fetchAchievements()
  }, [fetchGamificacaoStats, fetchAchievements])

  const avatarSvg = useMemo(() =>
  {
    const seed = userProfile?.email || userProfile?.nome || 'jarvis-recruta'
    return createAvatar(pixelArt, {
      seed,
      backgroundColor: ['09051400'],
      clothingColor: ['6366f1', '8b5cf6', '4f46e5', '7c3aed', '5b21b6'],
      hatColor: ['6366f1', '4f46e5'],
    }).toString()
  }, [userProfile?.email, userProfile?.nome])

  const stats = userStats || { level: 1, xp_foco: 0, xp_vitalidade: 0, xp_estabilidade: 0, streak_saude: 0, streak_foco: 0 }
  const totalXP = stats.xp_foco + stats.xp_vitalidade + stats.xp_estabilidade
  // XP necessario do nivel = 250 * nivel (Allman + comentario PT)
  const xpNivel = stats.level * 250
  const xpAtual = totalXP % (xpNivel || 1) || totalXP
  const xpPct = Math.min(100, (xpAtual / (xpNivel || 1)) * 100)

  return (
    <aside className="bg-card border border-zinc-900 rounded-md flex flex-col overflow-hidden">
      <header className="px-3 py-2.5 border-b border-zinc-900 flex items-center justify-between bg-gradient-to-r from-violet-500/5 to-transparent">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3 bg-violet-500 rounded-sm" />
          <span className="text-[11px] font-bold text-violet-300 uppercase tracking-[0.2em]">Seu Status</span>
        </div>
        <button
          onClick={() => navigate('/perfil')}
          className="text-[12px] text-zinc-500 hover:text-violet-300 transition-colors"
        >
          Ver perfil →
        </button>
      </header>

      {/* avatar pixel-art com aura sutil */}
      <div className="px-3 pt-4 pb-3 flex flex-col items-center gap-2">
        <div className="relative">
          {/* aura — gradiente radial sutil atras */}
          <div className="absolute inset-0 -m-3 rounded-full bg-violet-500/10 blur-xl" />
          <div
            className="relative w-28 h-28 rounded-md bg-gradient-to-br from-violet-900/30 via-black to-black border border-violet-500/30 p-1.5 [&_svg]:w-full [&_svg]:h-full shadow-[0_0_20px_rgba(139,92,246,0.15)]"
            dangerouslySetInnerHTML={{ __html: avatarSvg }}
          />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-semibold text-white">
            {userProfile?.nome?.split(' ')[0] || 'Convidado'}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">
            Nível {stats.level} · Jarvis
          </p>
        </div>
      </div>

      {/* nivel + barra XP */}
      <div className="px-3 pb-3">
        <div className="flex justify-between items-center text-[12px] mb-1.5">
          <span className="text-zinc-300 font-semibold">XP</span>
          <span className="text-zinc-500 font-mono tabular-nums">{xpAtual.toLocaleString('pt-BR')} / {xpNivel.toLocaleString('pt-BR')}</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-700 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      {/* 3 gauges */}
      <div className="px-3 py-3 border-t border-zinc-900 grid grid-cols-3 gap-2">
        <StatusGaugeCircular label="Foco"          value={stats.xp_foco}          color="#8b5cf6" />
        <StatusGaugeCircular label="Vitalidade"    value={stats.xp_vitalidade}    color="#ec4899" />
        <StatusGaugeCircular label="Estabilidade"  value={stats.xp_estabilidade}  color="#f59e0b" />
      </div>

      {/* ofensiva — sempre visivel, com numero grande */}
      <div className="px-3 py-2.5 border-t border-zinc-900 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <Flame className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="text-[15px] font-bold text-white leading-none">
            {Math.max(stats.streak_saude, stats.streak_foco, 0)} <span className="text-[12px] font-medium text-zinc-400">dias</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Ofensiva · seguidos de consistência</div>
        </div>
      </div>

      {/* conquistas — fileira de 5 quadradinhos */}
      <div className="px-3 py-2.5 border-t border-zinc-900">
        <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">
          Conquistas · {achievements.length}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 5 }).map((_, i) =>
          {
            const ach = achievements[i]
            return (
              <div
                key={i}
                title={ach ? `${ach.titulo} — ${ach.descricao}` : 'Conquista bloqueada'}
                className={`aspect-square rounded flex items-center justify-center transition-all ${
                  ach
                    ? 'bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/40 hover:border-violet-400/60'
                    : 'bg-black border border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <Trophy className={`w-3.5 h-3.5 ${ach ? 'text-violet-300' : 'text-zinc-800'}`} />
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
