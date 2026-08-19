import { useMemo, useState } from 'react'
import { Check, Lock, Palette, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import {
  AXEL_COSMETICS_CATALOG,
  cosmeticsByCategory,
  getCosmeticById,
  isCosmeticUnlocked,
  type CosmeticCategory,
} from '../../lib/axelCosmetics'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const TABS: { id: CosmeticCategory; label: string }[] = [
  { id: 'accent', label: 'Cores' },
  { id: 'frame', label: 'Molduras' },
  { id: 'badge', label: 'Badges' },
  { id: 'mascot_skin', label: 'Mascote' },
  { id: 'ai_tone', label: 'Tom IA' },
  { id: 'profile_aura', label: 'Aura' },
]

function isEquipped(
  id: string,
  category: CosmeticCategory,
  accent: string,
  active: ReturnType<typeof useTaskStore.getState>['workspacePrefs']['active_cosmetics'],
): boolean
{
  if (category === 'accent')
  {
    const map: Record<string, string> = {
      accent_meridian: 'meridian',
      accent_copper: 'copper',
      accent_sky: 'sky',
      accent_forest: 'forest',
      accent_violet: 'violet',
    }
    return map[id] === accent
  }
  if (category === 'frame') return active.frame === id || (!active.frame && id === 'frame_none')
  if (category === 'badge') return active.badge === id
  if (category === 'mascot_skin') return active.mascot_skin === id
  if (category === 'ai_tone') return active.ai_tone === id
  if (category === 'profile_aura') return active.profile_aura === id || (!active.profile_aura && id === 'aura_none')
  return false
}

export function AxelCosmeticsLibrary()
{
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const userStats = useTaskStore((s) => s.userStats)
  const streakCount = useTaskStore((s) => s.streakCount)
  const equipCosmetic = useTaskStore((s) => s.equipCosmetic)
  const purchaseCosmeticWithXp = useTaskStore((s) => s.purchaseCosmeticWithXp)

  const [tab, setTab] = useState<CosmeticCategory>('accent')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const ctx = useMemo(
    () => ({ level: userStats?.level ?? 1, streakCount }),
    [userStats?.level, streakCount],
  )

  const items = cosmeticsByCategory(tab)

  const handleAction = async (id: string) =>
  {
    const item = getCosmeticById(id)
    if (!item) return

    setLoadingId(id)
    try
    {
      if (item.unlock.type === 'xp' && !workspacePrefs.unlocked_cosmetics.includes(id))
      {
        const res = await purchaseCosmeticWithXp(id)
        if (res.ok) toast.success(res.message)
        else toast.error(res.message)
        return
      }

      const ok = await equipCosmetic(id)
      if (ok) toast.success('Visual atualizado')
      else toast.error('Item bloqueado')
    }
    finally
    {
      setLoadingId(null)
    }
  }

  return (
    <section className={AXEL_BORDERLESS_PANEL}>
      <header className="flex items-center gap-2 mb-3">
        <Palette size={14} className="text-accent" />
        <h2 className={AXEL_SECTION_TITLE}>Coleção AXEL</h2>
        <span className={`ml-auto font-mono text-[11px] ${AXEL_TEXT_SECONDARY}`}>
          {workspacePrefs.unlocked_cosmetics.length}/{AXEL_COSMETICS_CATALOG.length}
        </span>
      </header>

      <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-2.5 py-1.5 rounded-sl text-[11px] font-mono uppercase border ${
              tab === t.id ? 'border-accent bg-accent/10 text-ink' : 'border-line text-ink-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {items.map((item) =>
        {
          const unlocked = isCosmeticUnlocked(item, ctx, workspacePrefs.unlocked_cosmetics)
          const equipped = isEquipped(item.id, tab, workspacePrefs.accent, workspacePrefs.active_cosmetics)
          const xpBuy = item.unlock.type === 'xp' && !unlocked

          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={loadingId === item.id}
                onClick={() => void handleAction(item.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-sl border text-left transition-colors ${
                  equipped ? 'border-accent bg-accent/8' : 'border-line hover:border-accent/30'
                } ${!unlocked && !xpBuy ? 'opacity-55' : ''}`}
              >
                <span className="w-8 h-8 rounded-sl bg-chrome border border-line flex items-center justify-center shrink-0 text-sm">
                  {item.preview
                    ? (item.preview.startsWith('#')
                      ? <span className="w-4 h-4 rounded-full" style={{ background: item.preview }} />
                      : item.preview)
                    : <Sparkles size={14} className="text-accent" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-medium flex items-center gap-1 ${AXEL_TEXT_PRIMARY}`}>
                    {item.label}
                    {equipped && <Check size={12} className="text-accent" />}
                  </p>
                  <p className={`text-[12px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>{item.description}</p>
                  {!unlocked && (
                    <p className="text-[11px] font-mono text-ink-muted mt-1 flex items-center gap-1">
                      <Lock size={10} />
                      {item.unlock.type === 'level' && `Nv ${item.unlock.minLevel}`}
                      {item.unlock.type === 'streak' && `${item.unlock.minStreak}d ofensiva`}
                      {item.unlock.type === 'xp' && `${item.unlock.costXp} XP`}
                    </p>
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
