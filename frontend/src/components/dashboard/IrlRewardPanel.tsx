import { useState } from 'react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import {
  addIrlReward,
  claimIrlReward,
  readIrlRewards,
  undoIrlClaim,
} from '../../lib/irlRewards'
import {
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
  AXEL_TOUCH_PRESS,
  AXEL_BTN_PRIMARY,
  AXEL_BTN_GHOST,
} from '../../constants/axelSurfaces'

export function IrlRewardPanel()
{
  const ouro = useTaskStore((s) => s.userStats?.ouro ?? 0)
  const spendGold = useTaskStore((s) => s.spendGold)
  const addGold = useTaskStore((s) => s.addGold)
  const [, bump] = useState(0)
  const [titulo, setTitulo] = useState('')
  const [custo, setCusto] = useState('30')
  const [adding, setAdding] = useState(false)
  const rewards = readIrlRewards()

  const claim = async (id: string, cost: number) =>
  {
    const ok = await spendGold(cost)
    if (!ok)
    {
      toast.error('Ouro insuficiente')
      return
    }
    claimIrlReward(id)
    bump((n) => n + 1)
    toast.success('Recompensa da vida real — vá viver isso')
  }

  const undo = async (id: string, cost: number) =>
  {
    undoIrlClaim(id)
    await addGold(cost)
    bump((n) => n + 1)
  }

  return (
    <section aria-label="Recompensas da vida real">
      <p className="text-[13px] font-medium text-ink-muted">
        Recompensas · {ouro} ouro
      </p>
      {rewards.length === 0 && !adding && (
        <p className={`mt-1.5 text-[13px] ${AXEL_TEXT_SECONDARY}`}>
          Troque ouro por algo da vida real — um episódio, um café.
        </p>
      )}
      <ul className="mt-2 space-y-1.5">
        {rewards.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-2">
            <span className={`text-[13px] ${AXEL_TEXT_PRIMARY}`}>
              {r.titulo} · {r.custo}g
              {r.claimed > 0 ? ` · ${r.claimed}x` : ''}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void claim(r.id, r.custo)}
                className={`text-[13px] font-medium text-ink min-h-11 ${AXEL_TOUCH_PRESS}`}
              >
                Resgatar
              </button>
              {r.claimed > 0 && (
                <button
                  type="button"
                  onClick={() => void undo(r.id, r.custo)}
                  className={`text-[13px] text-ink-muted min-h-11 ${AXEL_TOUCH_PRESS}`}
                >
                  Desfazer
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {adding ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: episódio, pizza"
            className="flex-1 min-w-[8rem] min-h-11 border border-line rounded-sl bg-chrome px-2 text-[13px] text-ink"
          />
          <input
            value={custo}
            onChange={(e) => setCusto(e.target.value)}
            inputMode="numeric"
            className="w-16 min-h-11 border border-line rounded-sl bg-chrome px-2 text-[13px] text-ink"
            aria-label="Custo em ouro"
          />
          <button
            type="button"
            className={`min-h-11 px-3 text-[13px] ${AXEL_BTN_PRIMARY}`}
            onClick={() =>
            {
              if (!titulo.trim()) return
              addIrlReward(titulo, Number(custo) || 30)
              setTitulo('')
              setAdding(false)
              bump((n) => n + 1)
              toast.success('Recompensa criada')
            }}
          >
            Criar
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`mt-2 ${AXEL_BTN_GHOST}`}
          onClick={() => setAdding(true)}
        >
          Nova recompensa
        </button>
      )}
    </section>
  )
}
