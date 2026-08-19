import { useState } from 'react'
import { Egg } from 'lucide-react'
import { AXEL_PROGRESS, AXEL_PROGRESS_THICK } from '../../constants/axelSurfaces'

// Bloco visual de nutrição — proteína + controle de ovos (máx. 3/dia)

const MAX_OVOS = 3

interface NutricaoProteinaBlockProps
{
  atual: number
  meta: number
  pct: number
  onNavigate: () => void
}

export function NutricaoProteinaBlock({ atual, meta, pct, onNavigate }: NutricaoProteinaBlockProps)
{
  const [ovosConsumidos, setOvosConsumidos] = useState(0)

  const toggleOvo = (index: number) =>
  {
    setOvosConsumidos((prev) =>
    {
      if (index + 1 <= prev) return index
      return Math.min(MAX_OVOS, index + 1)
    })
  }

  return (
    <div className="pt-3 mt-1">
      <button
        type="button"
        onClick={onNavigate}
        className="w-full text-left mb-3"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 tracking-tight">
            Nutrição · Proteína
          </span>
          <span className="text-[13px] text-zinc-500 tabular-nums shrink-0">
            {atual}/{meta}g
          </span>
        </div>
      </button>

      <div className={AXEL_PROGRESS_THICK} aria-hidden="true">
        <div
          className={`h-full rounded-full transition-all duration-700 ${AXEL_PROGRESS}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 mb-2">
          Ovos hoje
          <span className="text-zinc-600 normal-case tracking-tight font-normal ml-1">
            (máx. {MAX_OVOS})
          </span>
        </p>
        <div className="flex items-center gap-2" role="group" aria-label="Controle de ovos consumidos hoje">
          {Array.from({ length: MAX_OVOS }, (_, i) =>
          {
            const ativo = i < ovosConsumidos
            const noLimite = ovosConsumidos >= MAX_OVOS && !ativo

            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleOvo(i)}
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                  ativo
                    ? `${AXEL_PROGRESS} border-transparent shadow-[0_0_12px_rgba(168,85,247,0.25)]`
                    : noLimite
                      ? 'bg-zinc-100 border-zinc-200 opacity-40 cursor-not-allowed dark:bg-zinc-900/30 dark:border-zinc-800/80'
                      : 'bg-zinc-100 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-700/40 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/60'
                }`}
                aria-label={`Ovo ${i + 1}${ativo ? ', consumido' : ''}`}
                aria-pressed={ativo}
                disabled={noLimite}
              >
                <Egg className={`w-3.5 h-3.5 ${ativo ? 'text-white' : 'text-zinc-500'}`} />
              </button>
            )
          })}
          <span className="ml-1 text-[12px] text-zinc-600 tabular-nums">
            {ovosConsumidos}/{MAX_OVOS}
          </span>
        </div>
      </div>
    </div>
  )
}
