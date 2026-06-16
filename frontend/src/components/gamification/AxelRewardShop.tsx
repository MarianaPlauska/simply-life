import { useState } from 'react'
import { Shield, Sparkles, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_ROW_HOVER, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

const STREAK_FREEZE_COST = 500

export function AxelRewardShop()
{
  const getTotalXp = useTaskStore((s) => s.getTotalXp)
  const streakFreezes = useTaskStore((s) => s.streakFreezes)
  const purchaseStreakFreeze = useTaskStore((s) => s.purchaseStreakFreeze)
  const [loading, setLoading] = useState(false)

  const totalXp = getTotalXp()

  const buyShield = async () =>
  {
    setLoading(true)
    try
    {
      const res = await purchaseStreakFreeze()
      if (res.ok)
      {
        toast.success(res.message)
      }
      else
      {
        toast.error(res.message)
      }
    }
    finally
    {
      setLoading(false)
    }
  }

  return (
    <section className={`border border-line rounded-sl bg-card p-4 ${AXEL_ROW_HOVER}`}>
      <header className="flex items-center gap-2 mb-3">
        <ShoppingBag size={14} className="text-accent" />
        <h3 className={`font-mono text-[10px] uppercase tracking-[0.14em] ${AXEL_TEXT_SECONDARY}`}>
          Loja AXEL
        </h3>
        <span className={`ml-auto font-mono text-[10px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
          {totalXp} XP
        </span>
      </header>

      <div className="space-y-2">
        <button
          type="button"
          disabled={loading || totalXp < STREAK_FREEZE_COST}
          onClick={() => void buyShield()}
          className="w-full flex items-center gap-3 p-3 rounded-sl border border-line hover:border-accent/40 hover:bg-chrome/30 disabled:opacity-50 text-left transition-colors"
        >
          <div className="p-2 rounded-sl bg-sky-500/10">
            <Shield size={18} className="text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>Escudo extra (500 XP)</p>
            <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              1 grátis/mês no perfil · você tem {streakFreezes}
            </p>
          </div>
          <span className="font-mono text-[10px] text-accent shrink-0">{STREAK_FREEZE_COST} XP</span>
        </button>

        <div className="flex items-center gap-3 p-3 rounded-sl border border-dashed border-line">
          <div className="p-2 rounded-sl bg-chrome/40">
            <Sparkles size={18} className="text-accent" />
          </div>
          <div className="flex-1">
            <p className={`text-sm ${AXEL_TEXT_PRIMARY}`}>Mais cosméticos</p>
            <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
              Veja a Coleção AXEL acima — skins, tons de IA e molduras
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
