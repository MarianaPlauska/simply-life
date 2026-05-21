import { useEffect } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { GlassCard } from '../ui/GlassCard';
import { Brain, HeartPulse, ShieldCheck, Trophy, Sparkles } from 'lucide-react';

export function AvatarStatusWidget()
{
  const userStats = useTaskStore((s) => s.userStats);
  const achievements = useTaskStore((s) => s.achievements);
  const fetchGamificacaoStats = useTaskStore((s) => s.fetchGamificacaoStats);
  const fetchAchievements = useTaskStore((s) => s.fetchAchievements);

  useEffect(() =>
  {
    fetchGamificacaoStats();
    fetchAchievements();
  }, [fetchGamificacaoStats, fetchAchievements]);

  if (!userStats)
  {
    return null;
  }

  const totalXP = userStats.xp_foco + userStats.xp_vitalidade + userStats.xp_estabilidade;
  const currentLevelXP = totalXP % 100;
  const xpPercentage = Math.min(100, Math.max(0, currentLevelXP));

  // Determine avatar type/title based on highest stat
  let roleTitle = 'Recruta do Jarvis';
  let avatarGradient = 'from-zinc-500/20 to-zinc-950';
  let borderGlowColor = 'rgba(113,113,122,0.4)';

  if (userStats.level >= 2)
  {
    const maxVal = Math.max(userStats.xp_foco, userStats.xp_vitalidade, userStats.xp_estabilidade);
    if (maxVal === userStats.xp_foco)
    {
      roleTitle = 'Mestre Cognitivo';
      avatarGradient = 'from-violet-500/20 to-zinc-950';
      borderGlowColor = 'rgba(139,92,246,0.5)';
    }
    else if (maxVal === userStats.xp_vitalidade)
    {
      roleTitle = 'Guardião Vital';
      avatarGradient = 'from-emerald-500/20 to-zinc-950';
      borderGlowColor = 'rgba(16,185,129,0.5)';
    }
    else
    {
      roleTitle = 'Orquestrador Estável';
      avatarGradient = 'from-amber-500/20 to-zinc-950';
      borderGlowColor = 'rgba(245,158,11,0.5)';
    }
  }

  return (
    <GlassCard className="relative overflow-hidden flex flex-col gap-6 w-full" noGlow={false}>
      {/* Dynamic Avatar & Role Header */}
      <div className="flex items-center gap-4">
        <div 
          className={`relative flex items-center justify-center w-16 h-16 rounded-full border-2 border-white/10 bg-gradient-to-b ${avatarGradient} overflow-hidden shadow-2xl transition-all duration-500`}
          style={{ boxShadow: `0 0 20px ${borderGlowColor}` }}
        >
          <Sparkles className="w-8 h-8 text-white/40 animate-pulse" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Avatar Jarvis</span>
          <h3 className="text-lg font-bold text-zinc-100">{roleTitle}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[9px] font-extrabold uppercase">
              Nível {userStats.level}
            </span>
            <span className="text-[10px] text-zinc-500">
              {totalXP} XP Acumulado
            </span>
          </div>
        </div>
      </div>

      {/* Level XP Progress Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-[10px] font-medium text-zinc-400">
          <span>Progresso do Nível</span>
          <span className="text-zinc-300 font-bold">{currentLevelXP} / 100 XP</span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all duration-700 ease-out"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
      </div>

      {/* Attribute Stats */}
      <div className="grid grid-cols-3 gap-3">
        {/* Foco (Focus) */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-violet-500/20 transition-all duration-300">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 mb-2">
            <Brain className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Foco</span>
          <span className="text-sm font-black text-zinc-200 mt-1">{userStats.xp_foco} XP</span>
        </div>

        {/* Vitalidade (Vitality) */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-emerald-500/20 transition-all duration-300">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
            <HeartPulse className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vitalidade</span>
          <span className="text-sm font-black text-zinc-200 mt-1">{userStats.xp_vitalidade} XP</span>
        </div>

        {/* Estabilidade (Stability) */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-amber-500/20 transition-all duration-300">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Estabilidade</span>
          <span className="text-sm font-black text-zinc-200 mt-1">{userStats.xp_estabilidade} XP</span>
        </div>
      </div>

      {/* Streak information */}
      {(userStats.streak_saude > 0 || userStats.streak_foco > 0) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
          {userStats.streak_saude > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Combo Saúde: {userStats.streak_saude} Dias (x2 XP)
            </div>
          )}
          {userStats.streak_foco > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-bold text-violet-400">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Streak Foco: {userStats.streak_foco}/3 Concluídos
            </div>
          )}
        </div>
      )}

      {/* Achievements Section */}
      <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
        <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          Conquistas Desbloqueadas ({achievements.length})
        </h4>

        {achievements.length === 0 ? (
          <p className="text-[11px] text-zinc-500 italic">
            Nenhuma conquista desbloqueada ainda. Complete suas metas para liberar troféus!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-1">
            {achievements.map((ach) => (
              <div 
                key={ach.id}
                className="group relative cursor-help inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-white/5 hover:border-amber-500/30 hover:bg-zinc-900/80 transition-all duration-300"
                title={ach.descricao}
              >
                <Trophy className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-[10px] font-bold text-zinc-300 group-hover:text-zinc-100">{ach.titulo}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
