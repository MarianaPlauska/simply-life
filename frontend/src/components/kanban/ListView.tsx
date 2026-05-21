// C1: Vista lista (table view) alternativa ao board
import { useState } from 'react';
import {
  ChevronDown, ChevronUp, Zap,
  Pencil, Trash2, Copy, MoreHorizontal, CheckSquare, Square,
} from 'lucide-react';
import type { TarefaUnificada } from '../../types';
import { STATUS_CONFIG as STATUS_BADGE, PRIO_BADGE, getOrigin } from '../../constants/kanbanConfig';
import { compareValue } from '../../utils/kanbanHelpers';

interface ListViewProps {
  tarefas: TarefaUnificada[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onEdit: (tarefa: TarefaUnificada) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
}

type SortKey = 'titulo' | 'prioridade' | 'status' | 'score_urgencia' | 'created_at';
type SortDir = 'asc' | 'desc';

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir })
{
  if (sortKey !== col)
  {
    return <ChevronDown className="w-3 h-3 text-zinc-700" />;
  }
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-violet-400" />
    : <ChevronDown className="w-3 h-3 text-violet-400" />;
}

export function ListView ({ tarefas, selectedIds, onToggleSelect, onSelectAll, onEdit, onDelete, onDuplicate }: ListViewProps)
{
  const [sortKey, setSortKey] = useState<SortKey>('score_urgencia');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const sorted = [...tarefas].sort((a, b) =>
  {
    const cmp = compareValue(a, b, sortKey);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const allSelected = tarefas.length > 0 && selectedIds.size === tarefas.length;

  function toggleSort (key: SortKey)
  {
    if ( sortKey === key ) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl overflow-hidden">
      {/* header row */}
      <div className="grid grid-cols-[40px_1fr_110px_100px_90px_80px_60px] gap-2 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800/30 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
        <div className="flex items-center justify-center">
          <button onClick={onSelectAll} className="p-0.5">
            {allSelected
              ? <CheckSquare className="w-4 h-4 text-violet-400" />
              : <Square className="w-4 h-4 text-zinc-600" />
            }
          </button>
        </div>
        <button className="flex items-center gap-1 text-left" onClick={() => toggleSort('titulo')}>
          Título <SortIcon col="titulo" sortKey={sortKey} sortDir={sortDir} />
        </button>
        <button className="flex items-center gap-1" onClick={() => toggleSort('status')}>
          Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
        </button>
        <button className="flex items-center gap-1" onClick={() => toggleSort('prioridade')}>
          Prioridade <SortIcon col="prioridade" sortKey={sortKey} sortDir={sortDir} />
        </button>
        <button className="flex items-center gap-1" onClick={() => toggleSort('score_urgencia')}>
          Score <SortIcon col="score_urgencia" sortKey={sortKey} sortDir={sortDir} />
        </button>
        <button className="flex items-center gap-1" onClick={() => toggleSort('created_at')}>
          Data <SortIcon col="created_at" sortKey={sortKey} sortDir={sortDir} />
        </button>
        <span />
      </div>

      {/* rows */}
      {sorted.length === 0 && (
        <div className="text-center py-10 text-zinc-600 text-[13px]">Nenhuma tarefa encontrada</div>
      )}
      {sorted.map((t) =>
      {
        const isSelected = selectedIds.has(t.id);
        const sBadge = STATUS_BADGE[t.status] || STATUS_BADGE.pendente;
        const pBadge = PRIO_BADGE[t.prioridade] || PRIO_BADGE.media;
        const origin = getOrigin(t.origem || 'manual');
        const OriginIcon = origin.Icon;
        const subs = t.subtarefas || [];
        const subsDone = subs.filter((s) => s.concluida).length;

        return (
          <div
            key={t.id}
            className={[
              'grid grid-cols-[40px_1fr_110px_100px_90px_80px_60px] gap-2 px-4 py-2.5 items-center border-b border-zinc-800/20',
              'hover:bg-zinc-800/20 transition-colors group',
              isSelected ? 'bg-violet-500/5' : '',
            ].join(' ')}
          >
            {/* checkbox */}
            <div className="flex items-center justify-center">
              <button onClick={() => onToggleSelect(t.id)} className="p-0.5">
                {isSelected
                  ? <CheckSquare className="w-4 h-4 text-violet-400" />
                  : <Square className="w-4 h-4 text-zinc-600" />
                }
              </button>
            </div>

            {/* titulo + labels + subtasks */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <OriginIcon className={`w-3.5 h-3.5 shrink-0 ${origin.color}`} />
                <span
                  className="text-[13px] text-zinc-200 font-medium truncate cursor-pointer hover:text-violet-300 transition-colors"
                  onClick={() => onEdit(t)}
                >
                  {t.titulo}
                </span>
                <span className="text-[10px] text-zinc-700 font-mono">#{t.id}</span>
              </div>
              {/* labels + subtask count inline */}
              <div className="flex items-center gap-2 mt-0.5">
                {(t.labels || []).map((lb) => (
                  <span
                    key={lb.id}
                    className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border"
                    style={{ color: lb.cor, backgroundColor: `${lb.cor}15`, borderColor: `${lb.cor}30` }}
                  >
                    {lb.nome}
                  </span>
                ))}
                {subs.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <CheckSquare className="w-3 h-3" /> {subsDone}/{subs.length}
                  </span>
                )}
              </div>
            </div>

            {/* status */}
            <span className={`text-[11px] font-medium px-2 py-1 rounded-md text-center ${sBadge.bg} ${sBadge.color}`}>
              {sBadge.label}
            </span>

            {/* prioridade */}
            <span className={`text-[11px] font-medium px-2 py-1 rounded-md text-center ${pBadge.bg} ${pBadge.color}`}>
              <Zap className="w-3 h-3 inline mr-0.5" />{pBadge.label}
            </span>

            {/* score */}
            <span className={`text-[12px] font-bold tabular-nums text-center ${
              t.score_urgencia > 80 ? 'text-red-400' :
              t.score_urgencia > 40 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {t.score_urgencia}
            </span>

            {/* data */}
            <span className="text-[11px] text-zinc-500">
              {t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}
            </span>

            {/* ações */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === t.id ? null : t.id)}
                className="p-1 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {openMenu === t.id && (
                <div className="absolute right-0 top-7 z-20 w-40 bg-zinc-900 border border-zinc-700/60 rounded-lg shadow-xl py-1">
                  <button
                    onClick={() => { setOpenMenu(null); onEdit(t); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); onDuplicate(t.id); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Duplicar
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); onDelete(t.id); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Arquivar
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
