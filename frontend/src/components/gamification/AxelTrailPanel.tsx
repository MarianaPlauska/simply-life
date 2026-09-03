import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Lock, Check, ChevronRight, Zap, Heart, Wallet } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { computeGamificationProfile, XP_PER_LEVEL } from '../../lib/gamificationProfile'
import {
  XP_SOURCE_RULES,
  TRAIL_MILESTONES,
  TRAIL_SKILL_PATH,
  getNextMilestone,
  arquetipoLabel,
  moduleLabel,
  type XpModule,
} from '../../lib/axelTrail'
import { computeUnlockedCosmeticIds } from '../../lib/axelCosmetics'
import { AXEL_ICON_STROKE, resolveAxelIcon } from '../../lib/axelIconMap'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_PROGRESS,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const MODULE_ICON: Record<XpModule, typeof Zap> = {
  foco: Zap,
  vitalidade: Heart,
  estabilidade: Wallet,
}

interface AxelTrailPanelProps
{
  compact?: boolean
}

export function AxelTrailPanel({ compact = false }: AxelTrailPanelProps)
{
  const userStats = useTaskStore((s) => s.userStats)
  const streakCount = useTaskStore((s) => s.streakCount)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)

  const profile = computeGamificationProfile(userStats)
  const next = getNextMilestone(profile.level)
  const unlockedCosmetics = useMemo(
    () => new Set([
      ...workspacePrefs.unlocked_cosmetics,
      ...computeUnlockedCosmeticIds({ level: profile.level, streakCount }),
    ]),
    [workspacePrefs.unlocked_cosmetics, profile.level, streakCount],
  )

  const xpByModule = {
    foco: userStats?.xp_foco ?? 0,
    vitalidade: userStats?.xp_vitalidade ?? 0,
    estabilidade: userStats?.xp_estabilidade ?? 0,
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={`${AXEL_BORDERLESS_PANEL} ${compact ? 'p-3' : ''}`}>
        <header className="mb-4">
          <p className={AXEL_SECTION_TITLE}>
            <Sparkles size={10} className="inline mr-1.5 text-accent" />
            Sua trilha
          </p>
          <div className="flex flex-wrap items-baseline gap-2 mt-1">
            <h2 className={`text-lg font-display ${AXEL_TEXT_PRIMARY}`}>
              Nível {profile.level}
            </h2>
            <span className="text-sm text-accent font-medium">{arquetipoLabel(profile.level)}</span>
          </div>
          <p className={`text-[13px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
            {profile.totalXp} XP total · {profile.xpInLevel}/{profile.xpToNextLevel} para o próximo nível
            <span className="block text-[12px] mt-0.5 text-ink-muted">Teto: 90 XP/dia · 500 XP por nível</span>
          </p>
          <div className={`mt-3 h-2 rounded-full overflow-hidden ${AXEL_PROGRESS}`}>
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${profile.xpPct}%` }}
            />
          </div>
          {next && (
            <p className={`text-[13px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
              Próximo ({next.level}): <span className="text-ink">{next.reward}</span>
            </p>
          )}
        </header>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['foco', 'vitalidade', 'estabilidade'] as XpModule[]).map((mod) =>
          {
            const Icon = MODULE_ICON[mod]
            const val = xpByModule[mod]
            const subLevel = Math.floor(val / XP_PER_LEVEL) + 1
            return (
              <div key={mod} className="p-2.5 rounded-sl border border-line bg-chrome/30 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <Icon size={11} className="text-accent shrink-0" />
                  <span className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                    {moduleLabel(mod)}
                  </span>
                </div>
                <p className={`text-base font-display tabular-nums ${AXEL_TEXT_PRIMARY}`}>
                  {val}
                </p>
                <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>Nv {subLevel}</p>
              </div>
            )
          })}
        </div>
      </section>

      {!compact && (
        <section className={AXEL_BORDERLESS_PANEL}>
          <h3 className={`text-sm font-display mb-3 ${AXEL_TEXT_PRIMARY}`}>
            Como ganhar XP
          </h3>
          <ul className="space-y-2">
            {XP_SOURCE_RULES.map((rule) =>
            {
              const Icon = MODULE_ICON[rule.module]
              const RuleIcon = resolveAxelIcon(rule.icon)
              return (
                <li
                  key={rule.id}
                  className="flex gap-3 p-2.5 rounded-sl border border-line/80 bg-chrome/20"
                >
                  <RuleIcon className="w-5 h-5 shrink-0 text-ink-muted mt-0.5" strokeWidth={AXEL_ICON_STROKE} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>
                        {rule.action}
                      </p>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent/15 text-accent font-mono text-[10px]">
                        <Icon size={9} />
                        {rule.xp}
                      </span>
                    </div>
                    <p className={`text-[12px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>{rule.hint}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className={AXEL_BORDERLESS_PANEL}>
        <h3 className={`text-sm font-display mb-3 ${AXEL_TEXT_PRIMARY}`}>
          Caminho de habilidades
        </h3>
        <ol className="relative border-l-2 border-line ml-3 pl-4 space-y-3">
          {TRAIL_SKILL_PATH.map((node) =>
          {
            const unlocked = profile.level >= node.level
            const Icon = MODULE_ICON[node.module]
            const NodeIcon = resolveAxelIcon(node.icon)
            return (
              <li key={`${node.level}-${node.skill}`} className="relative">
                <span
                  className={`absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full border-2 ${
                    unlocked ? 'bg-accent border-accent' : 'bg-card border-line'
                  }`}
                  aria-hidden
                />
                <div className={`p-2.5 rounded-sl border ${unlocked ? 'border-accent/30 bg-accent/5' : 'border-line bg-chrome/20 opacity-80'}`}>
                  <div className="flex items-center gap-2">
                    <NodeIcon className="w-5 h-5 shrink-0 text-ink-muted" strokeWidth={AXEL_ICON_STROKE} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>
                        Nv {node.level} · {node.skill}
                      </p>
                      <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>{node.unlock}</p>
                    </div>
                    <Icon size={12} className={unlocked ? 'text-accent' : 'text-ink-muted'} />
                    {unlocked ? <Check size={12} className="text-concluido" /> : <Lock size={12} className="text-ink-muted" />}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section className={AXEL_BORDERLESS_PANEL}>
        <h3 className={`text-sm font-display mb-3 ${AXEL_TEXT_PRIMARY}`}>
          Marcos da trilha
        </h3>
        <ol className="space-y-2">
          {TRAIL_MILESTONES.map((m) =>
          {
            const reached = profile.level >= m.level
            const isCurrent = profile.level === m.level
            const cosmeticsOk = (m.cosmeticIds ?? []).every((id) => unlockedCosmetics.has(id))

            return (
              <li
                key={m.level}
                className={`flex gap-3 p-3 rounded-sl border ${
                  isCurrent
                    ? 'border-accent/50 bg-accent/5'
                    : reached
                      ? 'border-line bg-chrome/15'
                      : 'border-line/60 bg-chrome/10 opacity-80'
                }`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    reached ? 'bg-ink text-fundo' : 'bg-chrome border border-line text-ink-muted'
                  }`}
                >
                  {reached ? <Check size={14} /> : m.level}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>
                      Nv {m.level} - {m.title}
                    </p>
                    {!reached && <Lock size={11} className="text-ink-muted" />}
                  </div>
                  <p className={`text-[13px] mt-0.5 text-accent`}>{m.reward}</p>
                  <p className={`text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>{m.funCopy}</p>
                  {reached && m.cosmeticIds && m.cosmeticIds.length > 0 && (
                    <p className={`text-[11px] mt-1 font-mono ${cosmeticsOk ? 'text-concluido' : AXEL_TEXT_SECONDARY}`}>
                      {cosmeticsOk ? '✓ Recompensas na coleção' : 'Recompensas liberadas'}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
        {!compact && (
          <Link
            to="/perfil"
            className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase text-accent hover:underline"
          >
            Coleção e loja
            <ChevronRight size={12} />
          </Link>
        )}
      </section>
    </div>
  )
}
