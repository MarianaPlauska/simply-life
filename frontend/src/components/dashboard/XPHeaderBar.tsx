import { useTaskStore } from '../../store/useTaskStore'

// Barra de XP global — fica logo abaixo da topbar no Dashboard

export function XPHeaderBar()
{
  const userStats = useTaskStore((s) => s.userStats)
  // XP total = soma dos 3 atributos. Cada 100 XP = 1 nivel global.
  const totalXp = (userStats?.xp_foco ?? 0) + (userStats?.xp_vitalidade ?? 0) + (userStats?.xp_estabilidade ?? 0)
  const level = userStats?.level || Math.floor(totalXp / 100) + 1
  const xpAtual = totalXp % 100
  const xpProximo = 100
  const pct = Math.min(100, Math.round((xpAtual / xpProximo) * 100))

  return (
    <div className="flex items-center gap-3 px-1 py-1">
      <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
        Nível {level}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/60">
        <div
          className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 shadow-[0_0_8px_rgba(139,92,246,0.6)] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-mono tabular-nums text-zinc-500">
        {xpAtual}/{xpProximo} XP
      </span>
      <span className="text-[11px] text-zinc-600 ml-2">Jarvis</span>
    </div>
  )
}
