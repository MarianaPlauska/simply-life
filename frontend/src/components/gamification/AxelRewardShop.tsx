import { Sparkles, ShoppingBag } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_ROW_HOVER, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

export function AxelRewardShop()
{
  const getTotalXp = useTaskStore((s) => s.getTotalXp)

  const totalXp = getTotalXp()


  return (
    <section className={`border border-line rounded-sl bg-card p-4 ${AXEL_ROW_HOVER}`}>
      <header className="flex items-center gap-2 mb-3">
        <ShoppingBag size={14} className="text-accent" />
        <h3 className={`font-mono text-[11px] uppercase tracking-[0.14em] ${AXEL_TEXT_SECONDARY}`}>
          Loja AXEL
        </h3>
        <span className={`ml-auto font-mono text-[11px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
          {totalXp} XP
        </span>
      </header>

      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-sl border border-dashed border-line">
          <div className="p-2 rounded-sl bg-chrome/40">
            <Sparkles size={18} className="text-accent" />
          </div>
          <div className="flex-1">
            <p className={`text-sm ${AXEL_TEXT_PRIMARY}`}>Mais cosméticos</p>
            <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>
              Veja a Coleção AXEL acima - skins, tons de IA e molduras
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
