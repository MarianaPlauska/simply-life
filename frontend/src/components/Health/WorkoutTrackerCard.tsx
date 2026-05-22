import { useEffect, useState } from 'react';
import { Dumbbell, Play, Square, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import { DEFAULT_TREINO_MINUTOS } from '../../constants/healthPresets';
import { formatElapsed } from '../../utils/workoutCompletion';

export function WorkoutTrackerCard()
{
  const habitos = useTaskStore((s) => s.habitos);
  const sessaoTreinoAtiva = useTaskStore((s) => s.sessaoTreinoAtiva);
  const sessoesTreinoHoje = useTaskStore((s) => s.sessoesTreinoHoje);
  const fetchSessaoTreinoAtiva = useTaskStore((s) => s.fetchSessaoTreinoAtiva);
  const fetchSessoesTreinoHoje = useTaskStore((s) => s.fetchSessoesTreinoHoje);
  const addTreinoHabito = useTaskStore((s) => s.addTreinoHabito);
  const iniciarTreino = useTaskStore((s) => s.iniciarTreino);
  const finalizarTreino = useTaskStore((s) => s.finalizarTreino);

  const treinos = habitos.filter((h) => h.tipo === 'treino');
  const [novoTipo, setNovoTipo] = useState('');
  const [metaMin, setMetaMin] = useState(String(DEFAULT_TREINO_MINUTOS));
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() =>
  {
    fetchSessaoTreinoAtiva();
    fetchSessoesTreinoHoje();
  }, [fetchSessaoTreinoAtiva, fetchSessoesTreinoHoje]);

  useEffect(() =>
  {
    if (!sessaoTreinoAtiva)
    {
      setElapsedSec(0);
      return;
    }

    const tick = () =>
    {
      const start = new Date(sessaoTreinoAtiva.iniciado_em).getTime();
      setElapsedSec(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessaoTreinoAtiva]);

  const handleAddTreino = async () =>
  {
    if (!novoTipo.trim())
    {
      toast.error('Informe o tipo de treino (ex: Musculação, Corrida)');
      return;
    }
    const mins = parseInt(metaMin, 10) || DEFAULT_TREINO_MINUTOS;
    await addTreinoHabito(novoTipo.trim(), mins);
    setNovoTipo('');
    toast.success('Meta de treino cadastrada');
  };

  const handleStart = async (habitoId: number, nome: string, mins: number) =>
  {
    await iniciarTreino(habitoId, nome, mins);
  };

  const handleStop = async () =>
  {
    if (!sessaoTreinoAtiva) return;
    await finalizarTreino(sessaoTreinoAtiva.id);
  };

  const concluidasHoje = sessoesTreinoHoje.filter((s) => s.concluido).length;

  return (
    <section
      data-academy-mode
      className="rounded-md border border-white/10 bg-black p-5 lg:col-span-2 text-white [&_.text-violet-400]:text-white [&_.text-violet-300]:text-zinc-300 [&_button]:border-white/20"
    >
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="w-4 h-4 text-white" />
        <h2 className="text-[13px] font-semibold text-white uppercase tracking-widest">Modo Academia</h2>
        <span className="ml-auto text-[10px] text-zinc-500">
          {concluidasHoje} completo{concluidasHoje !== 1 ? 's' : ''} hoje
        </span>
      </div>

      {sessaoTreinoAtiva ? (
        <div className="rounded-md border border-white/15 bg-white/[0.03] p-5 mb-4">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Em andamento</p>
          <p className="text-lg font-black text-white mb-1">{sessaoTreinoAtiva.tipo_treino}</p>
          <p className="text-xs text-zinc-500 mb-4">
            Meta: {sessaoTreinoAtiva.meta_minutos} min · Jarvis valida ao finalizar (≥80% da meta)
          </p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-mono font-bold text-white tabular-nums">
              {formatElapsed(elapsedSec)}
            </span>
            <button
              type="button"
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-xs font-bold uppercase"
            >
              <Square className="w-4 h-4" />
              Finalizar
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-zinc-500 mb-4 italic">
          Inicie o cronômetro ao começar. O Jarvis compara duração real vs meta para marcar treino completo.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={novoTipo}
          onChange={(e) => setNovoTipo(e.target.value)}
          placeholder="Tipo: HIIT, Musculação…"
          className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600"
        />
        <input
          type="number"
          min={10}
          max={180}
          value={metaMin}
          onChange={(e) => setMetaMin(e.target.value)}
          className="w-20 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200"
          title="Minutos"
        />
        <button
          type="button"
          onClick={handleAddTreino}
          className="flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {treinos.length === 0 && (
          <p className="text-xs text-zinc-600">Nenhum treino cadastrado ainda.</p>
        )}
        {treinos.map((t) =>
        {
          const mins = t.config?.meta_minutos ?? DEFAULT_TREINO_MINUTOS;
          const busy = Boolean(sessaoTreinoAtiva);
          return (
            <div
              key={t.id}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-white/5"
            >
              <div>
                <p className="text-xs font-bold text-zinc-200">{t.nome_exibicao}</p>
                <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  Meta {mins} min/dia
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleStart(t.id, t.nome_exibicao, mins)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-black hover:bg-zinc-200 disabled:opacity-40 text-[10px] font-bold uppercase"
              >
                <Play className="w-3.5 h-3.5" />
                Iniciar
              </button>
            </div>
          );
        })}
      </div>

      {sessoesTreinoHoje.filter((s) => s.finalizado_em).length > 0 && (
        <ul className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
          {sessoesTreinoHoje
            .filter((s) => s.finalizado_em)
            .slice(0, 4)
            .map((s) => (
              <li key={s.id} className="text-[10px] text-zinc-500 flex justify-between">
                <span>{s.tipo_treino}</span>
                <span className={s.concluido ? 'text-emerald-400' : 'text-amber-500'}>
                  {s.duracao_real_min ?? '?'} min · {s.concluido ? 'completo' : 'parcial'}
                </span>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
