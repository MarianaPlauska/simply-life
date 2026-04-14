import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  wipLimit: number;
  dotColor: string;
  children: ReactNode;
}

export function KanbanColumn({ id, title, count, wipLimit, dotColor, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const overLimit = count > wipLimit;

  return (
    <section
      ref={setNodeRef}
      aria-label={`Coluna ${title}, ${count} de ${wipLimit} tarefas`}
      className={`w-80 shrink-0 flex flex-col rounded-xl border transition-colors ${
        isOver ? 'border-violet-500/40 bg-violet-500/[0.02]' : 'border-zinc-800/40 bg-zinc-900/20'
      }`}
    >
      {/* Sticky Column Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-sm px-4 py-3 border-b border-zinc-800/30 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColor}`} aria-hidden="true" />
            <h3 className="text-[13px] font-semibold text-zinc-200">{title}</h3>
          </div>
          <span
            className={`text-[11px] font-medium tabular-nums px-2 py-0.5 rounded-md ${
              overLimit
                ? 'text-red-400 bg-red-500/10'
                : 'text-zinc-500 bg-zinc-800/50'
            }`}
            aria-label={`${count} de ${wipLimit} tarefas`}
          >
            {count}/{wipLimit}
          </span>
        </div>
        {/* WIP progress bar */}
        <div className="mt-2 h-0.5 rounded-full bg-zinc-800/40 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${overLimit ? 'bg-red-500' : dotColor}`}
            style={{ width: `${Math.min((count / wipLimit) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Scrollable card area */}
      <div
        className="flex-1 p-3.5 flex flex-col gap-3 overflow-y-auto min-h-[120px] max-h-[calc(100vh-260px)]"
        role="list"
      >
        {children}
      </div>
    </section>
  );
}
