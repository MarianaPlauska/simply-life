import { useMemo } from 'react'
import { DueBucketMap } from './DueBucketMap'
import { DueBucketSection } from './DueBucketSection'
import { DueBucketTaskList } from './DueBucketTaskList'
import { DueBucketTaskRow } from './DueBucketTaskRow'
import {
  ACTIVE_DUE_BUCKETS,
  bucketByDueDate,
  DUE_BUCKET_ALWAYS_VISIBLE,
  type DueBucket,
} from '../../lib/dueBucket'
import type { TarefaUnificada } from '../../types'

interface DueBucketBoardProps
{
  tarefas: TarefaUnificada[]
  executionQueueIds: Set<number>
  executingId: number | null
  activeId: number | null
  onOpen: (task: TarefaUnificada) => void
  onStartExecute?: (task: TarefaUnificada) => void
  /** stack = mobile; columns = board desktop de largura fixa */
  layout?: 'stack' | 'columns'
}

export function DueBucketBoard({
  tarefas,
  executionQueueIds,
  executingId,
  activeId,
  onOpen,
  onStartExecute,
  layout = 'stack',
}: DueBucketBoardProps)
{
  const buckets = useMemo(() => bucketByDueDate(tarefas), [tarefas])
  const asColumns = layout === 'columns'

  const visibleBuckets = useMemo(() =>
  {
    if (asColumns)
    {
      return ACTIVE_DUE_BUCKETS
    }

    const set = new Set<DueBucket>()

    for (const b of DUE_BUCKET_ALWAYS_VISIBLE)
    {
      set.add(b)
    }

    for (const b of ACTIVE_DUE_BUCKETS)
    {
      if (buckets[b].length > 0)
      {
        set.add(b)
      }
    }

    return ACTIVE_DUE_BUCKETS.filter((b) => set.has(b))
  }, [asColumns, buckets])

  const renderSection = (bucket: DueBucket) =>
  {
    const items = buckets[bucket]
    const count = items.length
    const collapseDefault = !asColumns && bucket === 'sem_prazo' && count > 4

    return (
      <DueBucketSection
        key={bucket}
        bucket={bucket}
        count={count}
        layout={asColumns ? 'column' : 'stack'}
        collapsible={collapseDefault}
        defaultCollapsed={collapseDefault}
      >
        {count === 0 ? (
          <p className="font-mono text-[10px] text-ink-muted/60 px-1 py-2 text-center">
            Nenhuma tarefa nesta faixa
          </p>
        ) : (
          <DueBucketTaskList
            items={items}
            maxVisible={asColumns ? 24 : bucket === 'sem_prazo' ? 5 : 6}
            renderItem={(t) => (
              <DueBucketTaskRow
                key={t.id}
                tarefa={t}
                allTasks={tarefas}
                isDragging={activeId === t.id}
                inExecutionQueue={executionQueueIds.has(t.id)}
                isExecuting={executingId === t.id}
                onOpen={() => onOpen(t)}
                onStartExecute={onStartExecute}
              />
            )}
          />
        )}
      </DueBucketSection>
    )
  }

  const countRecord = useMemo(() =>
  {
    const out = {} as Record<DueBucket, number>
    for (const b of ACTIVE_DUE_BUCKETS)
    {
      out[b] = buckets[b].length
    }
    out.concluido = buckets.concluido.length
    return out
  }, [buckets])

  if (asColumns)
  {
    return (
      <div
        className="hidden lg:flex flex-1 min-h-[min(68vh,720px)] flex-row w-full items-stretch overflow-x-auto pb-2 custom-scrollbar custom-scrollbar-x"
        role="region"
        aria-label="Quadro por prazo"
      >
        {visibleBuckets.map((bucket) => renderSection(bucket))}
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <DueBucketMap counts={countRecord} />

      {visibleBuckets.map((bucket) => renderSection(bucket))}

      {buckets.concluido.length > 0 && (
        <DueBucketSection
          bucket="concluido"
          count={buckets.concluido.length}
          collapsible
          defaultCollapsed
        >
          <DueBucketTaskList
            items={buckets.concluido}
            maxVisible={4}
            renderItem={(t) => (
              <DueBucketTaskRow
                key={t.id}
                tarefa={t}
                allTasks={tarefas}
                isDragging={activeId === t.id}
                inExecutionQueue={executionQueueIds.has(t.id)}
                isExecuting={executingId === t.id}
                onOpen={() => onOpen(t)}
                onStartExecute={onStartExecute}
              />
            )}
          />
        </DueBucketSection>
      )}
    </div>
  )
}
