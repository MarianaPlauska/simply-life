import { useMemo, useState } from 'react'
import { CopyX } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { countDuplicateBillTasks } from '../../lib/financeBillTaskDedup'

export function KanbanBillDuplicatesBar()
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const cleanupDuplicateBillTasks = useTaskStore((s) => s.cleanupDuplicateBillTasks)
  const [cleaning, setCleaning] = useState(false)

  const duplicateCount = useMemo(
    () => countDuplicateBillTasks(tarefas),
    [tarefas],
  )

  if (duplicateCount === 0) return null

  const handleCleanup = async () =>
  {
    setCleaning(true)
    try
    {
      const removed = await cleanupDuplicateBillTasks()
      if (removed > 0)
      {
        toast.success(
          removed === 1
            ? '1 lembrete duplicado removido'
            : `${removed} lembretes duplicados removidos`,
        )
      }
      else
      {
        toast.info('Nenhuma duplicata para remover')
      }
    }
    catch
    {
      toast.error('Não foi possível limpar as duplicatas')
    }
    finally
    {
      setCleaning(false)
    }
  }

  return (
    <div className="rounded-sl border border-atencao/35 bg-atencao/10 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-ink">
          {duplicateCount} lembrete{duplicateCount !== 1 ? 's' : ''} de boleto repetido{duplicateCount !== 1 ? 's' : ''}
        </p>
        <p className="text-[11px] text-ink-muted mt-0.5">
          Mantemos só um aviso por conta - o restante pode sair.
        </p>
      </div>
      <button
        type="button"
        disabled={cleaning}
        onClick={() => void handleCleanup()}
        className="shrink-0 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 font-mono text-[10px] uppercase tracking-wide border border-atencao/40 rounded-sl text-atencao hover:bg-atencao/15 disabled:opacity-50 transition-colors"
      >
        <CopyX className="w-3.5 h-3.5" />
        Limpar duplicatas
      </button>
    </div>
  )
}
