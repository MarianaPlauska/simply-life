import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { parseLifeDump, type DumpCard } from '../../lib/lifeDumpParse'
import { markDumpConflicts } from '../../lib/lifeDumpConflict'
import { commitLifeDump } from '../../lib/commitLifeDump'
import { useTaskStore } from '../../store/useTaskStore'
import { DumpConfirmList } from '../capture/DumpConfirmList'
import { AXEL_BTN_PRIMARY, AXEL_TOUCH_PRESS } from '../../constants/axelSurfaces'

interface AxelDumpProposalsProps
{
  question: string
}

export function AxelDumpProposals({ question }: AxelDumpProposalsProps)
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const parsed = useMemo(
    () => markDumpConflicts(parseLifeDump(question), tarefas),
    [question, tarefas],
  )
  const [cards, setCards] = useState<DumpCard[] | null>(null)

  useEffect(() =>
  {
    setCards(null)
  }, [question])
  const [saving, setSaving] = useState(false)

  if (parsed.length === 0) return null
  const worth = parsed.length > 1 || parsed.some((c) => c.kind !== 'intencao' || parsed.length === 1)
  if (!worth) return null

  const shown = cards ?? parsed

  const commit = async () =>
  {
    setSaving(true)
    try
    {
      await commitLifeDump(shown)
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
    <div className="rounded-sl border border-line bg-chrome/40 p-3 space-y-2">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-accent">
        Colocar na vida
      </p>
      <DumpConfirmList
        cards={shown}
        onToggle={(id) =>
        {
          setCards(markDumpConflicts(
            shown.map((c) => (c.id === id ? { ...c, kept: !c.kept } : c)),
            tarefas,
          ))
        }}
      />
      <button
        type="button"
        disabled={saving || !shown.some((c) => c.kept)}
        onClick={() => void commit()}
        className={`w-full min-h-11 text-[13px] ${AXEL_BTN_PRIMARY} ${AXEL_TOUCH_PRESS}`}
      >
        Confirmar lote
      </button>
    </div>
  )
}
