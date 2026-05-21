// vista gantt simplificada — barras horizontais por prazo
import { useMemo } from 'react';
import type { TarefaUnificada } from '../../types';
import { STATUS_CONFIG, PRIORIDADE_CONFIG } from '../../constants/kanbanConfig';

interface GanttViewProps {
  tarefas: TarefaUnificada[];
  onSelectTarefa: (t: TarefaUnificada) => void;
}

function formatDay (iso: string): string
{
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function GanttView ({ tarefas, onSelectTarefa }: GanttViewProps)
{
  const comPrazo = useMemo(() =>
    tarefas
      .filter((t) => t.data_vencimento && t.status !== 'concluida')
      .sort((a, b) => new Date(a.data_vencimento!).getTime() - new Date(b.data_vencimento!).getTime()),
    [tarefas],
  );

  const semPrazo = useMemo(() =>
    tarefas.filter((t) => !t.data_vencimento && t.status !== 'concluida'),
    [tarefas],
  );

  // janela de tempo: de hoje até o prazo mais distante
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = useMemo(() =>
  {
    const memoToday = new Date();
    memoToday.setHours(0, 0, 0, 0);
    if ( comPrazo.length === 0 ) return new Date(memoToday.getTime() + 30 * 86400000);
    const dates = comPrazo.map((t) => new Date(t.data_vencimento!));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    // mínimo de 14 dias de janela
    const min14 = new Date(memoToday.getTime() + 14 * 86400000);
    return max > min14 ? max : min14;
  }, [comPrazo]);

  const totalDays = Math.ceil((maxDate.getTime() - today.getTime()) / 86400000) + 1;

  // cabeçalho de datas: uma marca a cada N dias
  const step = totalDays <= 14 ? 1 : totalDays <= 30 ? 3 : 7;
  const headers: Date[] = [];
  for ( let i = 0; i <= totalDays; i += step )
  {
    headers.push(new Date(today.getTime() + i * 86400000));
  }

  function barLeftByDeadline (vencimento: Date): number
  {
    const diff = vencimento.getTime() - today.getTime();
    const pct = (diff / 86400000 / totalDays) * 100;
    return Math.max(0, Math.min(98, pct));
  }

  function barColor (t: TarefaUnificada): string
  {
    const deadline = new Date(t.data_vencimento!);
    const daysLeft = (deadline.getTime() - today.getTime()) / 86400000;
    if ( daysLeft < 0 ) return 'bg-red-500';
    if ( daysLeft <= 2 ) return 'bg-amber-500';
    return t.prioridade === 'critica' ? 'bg-red-400' : t.prioridade === 'alta' ? 'bg-orange-400' : 'bg-violet-500';
  }

  return (
    <div className="px-4 py-6 space-y-6">

      {/* legenda rápida */}
      <div className="flex items-center gap-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" />Atrasada</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" />≤2 dias</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-500" />No prazo</span>
      </div>

      {comPrazo.length === 0 && (
        <p className="text-[13px] text-zinc-600">Nenhuma tarefa pendente com prazo definido.</p>
      )}

      {comPrazo.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">

            {/* cabeçalho de datas */}
            <div className="flex mb-2 ml-[200px] relative">
              {headers.map((d, i) => (
                <div
                  key={i}
                  className="absolute text-[10px] text-zinc-500 -translate-x-1/2"
                  style={{ left: `${(i * step / totalDays) * 100}%` }}
                >
                  {formatDay(d.toISOString())}
                </div>
              ))}
              {/* linha de hoje */}
              <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-violet-500/50" style={{ left: '0%' }} />
            </div>

            {/* linhas de tarefa */}
            <div className="space-y-2 mt-6">
              {comPrazo.map((t) => (
                <div key={t.id} className="flex items-center gap-3 h-9">
                  {/* nome da tarefa */}
                  <button
                    onClick={() => onSelectTarefa(t)}
                    className="w-[200px] shrink-0 text-left text-[12px] text-zinc-300 truncate hover:text-violet-300 transition-colors pr-2"
                    title={t.titulo}
                  >
                    {t.titulo}
                  </button>

                  {/* trilha */}
                  <div className="flex-1 relative h-3 bg-zinc-800/50 rounded-full">
                    {/* linha de hoje */}
                    <div className="absolute top-0 bottom-0 w-px bg-violet-500/50" style={{ left: '0%' }} />
                    {/* barra — posicionada no prazo */}
                    <button
                      onClick={() => onSelectTarefa(t)}
                      className={`absolute top-0 h-full rounded-full cursor-pointer hover:opacity-80 transition-opacity ${barColor(t)}`}
                      style={{
                        left: `${barLeftByDeadline(new Date(t.data_vencimento!))}%`,
                        width: '2%',
                        minWidth: '8px',
                      }}
                      title={`Prazo: ${formatDay(t.data_vencimento!)}`}
                    />
                  </div>

                  {/* badge status */}
                  <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_CONFIG[t.status]?.bg} ${STATUS_CONFIG[t.status]?.color}`}>
                    {STATUS_CONFIG[t.status]?.label}
                  </span>
                  {/* prazo */}
                  <span className="shrink-0 text-[11px] text-zinc-500 w-16 text-right">
                    {formatDay(t.data_vencimento!)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* sem prazo */}
      {semPrazo.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-zinc-600 mb-2">Sem prazo definido ({semPrazo.length})</p>
          <div className="space-y-1.5">
            {semPrazo.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTarefa(t)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors text-left"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORIDADE_CONFIG[t.prioridade]?.color.replace('text-', 'bg-')}`} />
                <span className="flex-1 text-[13px] text-zinc-300 truncate">{t.titulo}</span>
                <span className={`text-[10px] ${PRIORIDADE_CONFIG[t.prioridade]?.color}`}>
                  {PRIORIDADE_CONFIG[t.prioridade]?.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
