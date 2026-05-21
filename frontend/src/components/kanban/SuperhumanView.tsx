import { useState, useEffect } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import type { TarefaUnificada } from '../../types';
import { 
  Zap, Circle, Inbox, GitBranch, Calendar, Mail, 
  Search, ArrowUpDown, Loader2, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Mapeador de Ícones de Origem ─────────────────────────── */
function getOriginIcon (origem: string)
{
  switch (origem?.toLowerCase())
  {
    case 'github':
      return { Icon: GitBranch, color: 'text-violet-400', label: 'GitHub' };
    case 'email':
    case 'gmail':
      return { Icon: Mail, color: 'text-cyan-400', label: 'E-mail' };
    case 'agenda':
    case 'calendar':
      return { Icon: Calendar, color: 'text-emerald-400', label: 'Agenda' };
    default:
      return { Icon: Inbox, color: 'text-zinc-400', label: 'Manual' };
  }
}

export function SuperhumanView ()
{
  const { tarefas, isLoading, fetchTarefas, updateTarefa, deleteTarefa } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() =>
  {
    fetchTarefas();
  }, [fetchTarefas]);

  // Filtra e ordena estritamente por Score Urgência decrescente
  const filteredAndSorted = [...tarefas]
    .filter((t) =>
    {
      if (t.status === 'concluida') return false; // Apenas tarefas ativas no Superhuman
      const query = searchQuery.toLowerCase();
      return (
        t.titulo.toLowerCase().includes(query) ||
        (t.notas_locais || '').toLowerCase().includes(query) ||
        (t.snippet_100_char || '').toLowerCase().includes(query)
      );
    })
    .sort((a, b) => (b.score_urgencia || 0) - (a.score_urgencia || 0));

  const handleToggleComplete = async (t: TarefaUnificada) =>
  {
    toast.success('Tarefa concluída! Bom trabalho.');
    await updateTarefa(t.id, { status: 'concluida' });
  };

  const handleStartEdit = (t: TarefaUnificada) =>
  {
    setEditingId(t.id);
    setEditTitle(t.titulo);
  };

  const handleSaveTitle = async (id: number) =>
  {
    if (!editTitle.trim())
    {
      setEditingId(null);
      return;
    }
    await updateTarefa(id, { titulo: editTitle.trim() });
    setEditingId(null);
  };

  const handleStartEditNotes = (t: TarefaUnificada) =>
  {
    setEditingNotesId(t.id);
    setEditNotes(t.notas_locais || '');
  };

  const handleSaveNotes = async (id: number) =>
  {
    await updateTarefa(id, { notas_locais: editNotes.trim() || undefined });
    setEditingNotesId(null);
  };

  const handleChangePriority = async (id: number, currentPrio: string) =>
  {
    const prios = ['baixa', 'media', 'alta', 'critica'];
    const nextIdx = (prios.indexOf(currentPrio) + 1) % prios.length;
    const nextPrio = prios[nextIdx];
    await updateTarefa(id, { prioridade: nextPrio });
    toast.info(`Prioridade atualizada para ${nextPrio.toUpperCase()}`);
  };

  return (
    <div className="max-w-7xl mx-auto w-full pb-16 px-1">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-400 fill-violet-400/20" />
            Modo Superhuman
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
              Foco Extremo
            </span>
          </h1>
          <p className="text-[12px] text-zinc-500 mt-1">
            Lista de alta densidade ordenada estritamente pelo Score de Urgência matemático.
          </p>
        </div>

        {/* Busca minimalista */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar tarefas instantaneamente..."
            className="w-72 bg-zinc-900/40 border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-[12px] text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>
      </div>

      {/* Tabela Notion/Linear style */}
      <div className="bg-zinc-950/40 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-xl">
        {/* Cabeçalho das Colunas */}
        <div className="grid grid-cols-[50px_70px_80px_1fr_250px_120px_100px] gap-4 px-5 py-3 bg-white/[0.02] border-b border-white/[0.04] text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          <div className="text-center">Foco</div>
          <div className="text-center flex items-center justify-center gap-1">
            Score <ArrowUpDown className="w-3 h-3 text-zinc-650" />
          </div>
          <div>Origem</div>
          <div>Título (Clique para editar)</div>
          <div>Notas Rápidas</div>
          <div>Prioridade</div>
          <div className="text-right">Ação</div>
        </div>

        {/* Linhas de tarefas */}
        {isLoading && filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-medium">Priorizando demandas...</span>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900/60 border border-white/[0.04] flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-zinc-600" />
            </div>
            <p className="text-zinc-300 font-medium text-sm">Inbox Zero!</p>
            <p className="text-zinc-600 text-[12px] mt-1 max-w-sm">
              Nenhuma tarefa ativa necessita de sua atenção no momento. Que tal tirar uma folga?
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {filteredAndSorted.map((t) =>
            {
              const { Icon: OriginIcon, color: originColor, label: originLabel } = getOriginIcon(t.origem);
              
              // Cores do Score
              const scoreColor = 
                t.score_urgencia >= 80 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                t.score_urgencia >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

              // Cores de prioridade
              const prioLabels: Record<string, string> = {
                critica: 'Crítica',
                alta: 'Alta',
                media: 'Média',
                baixa: 'Baixa'
              };
              const prioColors: Record<string, string> = {
                critica: 'text-rose-400 bg-rose-500/10 border-rose-500/10',
                alta: 'text-amber-400 bg-amber-500/10 border-amber-500/10',
                media: 'text-violet-400 bg-violet-500/10 border-violet-500/10',
                baixa: 'text-zinc-500 bg-zinc-800/20 border-zinc-700/10'
              };

              return (
                <div
                  key={t.id}
                  className="grid grid-cols-[50px_70px_80px_1fr_250px_120px_100px] gap-4 px-5 py-2.5 items-center hover:bg-white/[0.01] transition-colors group"
                >
                  {/* Checkbox de Conclusão */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleToggleComplete(t)}
                      className="p-1 rounded-md text-zinc-650 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      title="Marcar como concluída"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Score de Urgência */}
                  <div className="text-center flex justify-center">
                    <span className={`w-10 py-0.5 text-[11px] font-bold font-mono rounded-md border text-center ${scoreColor}`}>
                      {t.score_urgencia || 0}
                    </span>
                  </div>

                  {/* Origem */}
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                    <OriginIcon className={`w-3.5 h-3.5 ${originColor}`} />
                    <span className="text-[11px] font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors">
                      {originLabel}
                    </span>
                  </div>

                  {/* Título Inline Edit */}
                  <div className="min-w-0 pr-4">
                    {editingId === t.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(t.id)}
                        onKeyDown={(e) =>
                        {
                          if (e.key === 'Enter') handleSaveTitle(t.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full bg-zinc-900 border border-violet-500/30 rounded-lg px-2.5 py-1 text-[13px] text-zinc-200 outline-none focus:ring-1 focus:ring-violet-500/20"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => handleStartEdit(t)}
                        className="text-[13px] text-zinc-300 font-medium truncate block cursor-text hover:text-white transition-colors py-1"
                      >
                        {t.titulo}
                      </span>
                    )}
                  </div>

                  {/* Notas Rápidas Inline Edit */}
                  <div className="min-w-0 pr-4">
                    {editingNotesId === t.id ? (
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        onBlur={() => handleSaveNotes(t.id)}
                        onKeyDown={(e) =>
                        {
                          if (e.key === 'Enter') handleSaveNotes(t.id);
                          if (e.key === 'Escape') setEditingNotesId(null);
                        }}
                        placeholder="Adicionar nota..."
                        className="w-full bg-zinc-900 border border-violet-500/30 rounded-lg px-2.5 py-1 text-[11px] text-zinc-200 outline-none placeholder-zinc-700"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => handleStartEditNotes(t)}
                        className="text-[11px] text-zinc-500 truncate block cursor-text hover:text-zinc-300 transition-colors py-1 min-h-[20px]"
                      >
                        {t.notas_locais || <span className="text-zinc-700 italic">Adicionar nota...</span>}
                      </span>
                    )}
                  </div>

                  {/* Prioridade Picker */}
                  <div>
                    <button
                      onClick={() => handleChangePriority(t.id, t.prioridade)}
                      className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border transition-all ${
                        prioColors[t.prioridade] || prioColors.media
                      }`}
                    >
                      {prioLabels[t.prioridade] || 'Média'}
                    </button>
                  </div>

                  {/* Ações (Arquivar) */}
                  <div className="text-right">
                    <button
                      onClick={async () =>
                      {
                        await deleteTarefa(t.id);
                        toast.success('Tarefa arquivada');
                      }}
                      className="text-[11px] text-zinc-650 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 rounded-md transition-all opacity-0 group-hover:opacity-100"
                    >
                      Arquivar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
