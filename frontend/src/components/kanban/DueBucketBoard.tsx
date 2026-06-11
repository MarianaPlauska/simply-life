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
  activeId: number | null
  onOpen: (task: TarefaUnificada) => void
}

export function DueBucketBoard({
  tarefas,
  executionQueueIds,
  activeId,
  onOpen,
}: DueBucketBoardProps)
{
  const buckets = useMemo(() => bucketByDueDate(tarefas), [tarefas])

  const visibleBuckets = useMemo(() =>
  {
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
  }, [buckets])

  const renderSection = (bucket: DueBucket) =>
  {
    const items = buckets[bucket]
    const count = items.length

    const collapseDefault = bucket === 'sem_prazo' && count > 4

    return (
      <DueBucketSection
        key={bucket}
        bucket={bucket}
        count={count}
        collapsible={collapseDefault}
        defaultCollapsed={collapseDefault}
      >
        {count === 0 ? (
          <p className="font-mono text-[10px] text-ink-muted/60 px-1 py-1 text-center">
            Vazio — use o mapa acima ou arraste tarefas
          </p>
        ) : (
          <DueBucketTaskList
            items={items}
            maxVisible={bucket === 'sem_prazo' ? 5 : 6}
            renderItem={(t) => (
              <DueBucketTaskRow
                key={t.id}
                tarefa={t}
                allTasks={tarefas}
                isDragging={activeId === t.id}
                inExecutionQueue={executionQueueIds.has(t.id)}
                onOpen={() => onOpen(t)}
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
                onOpen={() => onOpen(t)}
              />
            )}
          />
        </DueBucketSection>
      )}
    </div>
  )
}
