import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AXEL_BTN_LG, AXEL_BTN_PRIMARY, AXEL_TOUCH_PRESS } from '../../constants/axelSurfaces'
import { parseLifeDump, type DumpCard } from '../../lib/lifeDumpParse'
import { markDumpConflicts } from '../../lib/lifeDumpConflict'
import { commitLifeDump } from '../../lib/commitLifeDump'
import { useTaskStore } from '../../store/useTaskStore'
import { DumpConfirmList } from './DumpConfirmList'

interface DumpSheetProps
{
  open: boolean
  onClose: () => void
  onFinance: () => void
  onWater: () => Promise<void>
  savingWater: boolean
  seed?: string
}

export function DumpSheet({
  open,
  onClose,
  onFinance,
  onWater,
  savingWater,
  seed = '',
}: DumpSheetProps)
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const [text, setText] = useState('')
  const [cards, setCards] = useState<DumpCard[] | null>(null)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() =>
  {
    if (!open) return
    setText(seed)
    setCards(null)
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [open, seed])

  if (!open) return null

  const parse = () =>
  {
    const raw = text.trim()
    if (!raw)
    {
      toast.error('Despeje o que está na cabeça')
      return
    }
    setCards(markDumpConflicts(parseLifeDump(raw), tarefas))
  }

  const toggle = (id: string) =>
  {
    setCards((prev) =>
      prev
        ? markDumpConflicts(
          prev.map((c) => (c.id === id ? { ...c, kept: !c.kept } : c)),
          tarefas,
        )
        : prev,
    )
  }

  const commit = async () =>
  {
    if (!cards) return
    setSaving(true)
    try
    {
      const n = await commitLifeDump(cards)
      if (n > 0) onClose()
    }
    catch
    {
      toast.error('Não foi possível gravar')
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[66] flex items-end sm:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div className="relative w-full sm:max-w-md border border-line bg-card rounded-t-sl sm:rounded-sl shadow-2xl p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <p className="sl-eyebrow">Despejar</p>
        <h2 className="font-sans text-[15px] font-semibold text-ink mt-0.5">
          O que está na sua cabeça?
        </h2>
        {cards == null ? (
          <>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Reunião terça 14h, pagar aluguel, ligar pra mãe um dia desses"
              className="w-full mt-2.5 border border-line rounded-sl bg-chrome px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-ink/40 min-h-24"
            />
            <button
              type="button"
              onClick={parse}
              className={`mt-3 ${AXEL_BTN_LG} ${AXEL_BTN_PRIMARY}`}
            >
              Ver o lote
            </button>
            <div className="flex gap-3 mt-2">
              <button type="button" className={`text-[13px] text-ink-muted hover:text-ink min-h-11 ${AXEL_TOUCH_PRESS}`} onClick={onFinance}>
                Gasto rápido
              </button>
              <button
                type="button"
                disabled={savingWater}
                className={`text-[13px] text-ink-muted hover:text-ink min-h-11 ${AXEL_TOUCH_PRESS}`}
                onClick={() => void onWater()}
              >
                + Água
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[12px] text-ink-muted mt-1 mb-2">
              Toque para tirar do lote. Nada grava ainda.
            </p>
            <DumpConfirmList cards={cards} onToggle={toggle} />
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => setCards(null)}
                className={`flex-1 min-h-11 border border-line rounded-sl ${AXEL_TOUCH_PRESS}`}
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={saving || !cards.some((c) => c.kept)}
                onClick={() => void commit()}
                className={`flex-1 min-h-11 ${AXEL_BTN_PRIMARY}`}
              >
                Confirmar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
