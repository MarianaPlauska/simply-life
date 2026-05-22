import { useMemo } from 'react';
import { Beef, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import { PROTEINA_PRESET } from '../../constants/healthPresets';

export function ProteinGoalCard()
{
  const habitos = useTaskStore((s) => s.habitos);
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit);
  const incrementHabito = useTaskStore((s) => s.incrementHabito);
  const updateHabitoMeta = useTaskStore((s) => s.updateHabitoMeta);

  const proteina = useMemo(() => habitos.find((h) => h.tipo === 'proteina'), [habitos]);
  const step = proteina?.config?.incremento ?? 10;
  const pct = proteina && proteina.meta_diaria > 0
    ? Math.min(100, (proteina.progresso_atual / proteina.meta_diaria) * 100)
    : 0;
  const done = proteina ? proteina.progresso_atual >= proteina.meta_diaria : false;

  const handleActivate = async () =>
  {
    await ensureHealthHabit(PROTEINA_PRESET);
    toast.success('Meta de proteína ativada — 120g/dia');
  };

  const handleAdd = async () =>
  {
    const ensured = proteina ?? await ensureHealthHabit(PROTEINA_PRESET);
    if (!ensured) return;
    const h = ensured;
    if (h.progresso_atual >= h.meta_diaria)
    {
      toast.info('Meta de proteína já atingida!');
      return;
    }
    await incrementHabito(h.id);
    toast.success(`+${step}g de proteína`);
  };

  return (
    <section className="rounded-xl border border-amber-500/15 bg-zinc-900/50 backdrop-blur-md p-5 hover:border-amber-500/25 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <Beef className="w-4 h-4 text-amber-400" />
        <h2 className="text-[13px] font-semibold text-zinc-100">Proteína</h2>
        {proteina && (
          <span className="ml-auto text-[11px] text-zinc-500 tabular-nums">
            {proteina.progresso_atual}/{proteina.meta_diaria}g
          </span>
        )}
      </div>

      {!proteina ? (
        <button
          type="button"
          onClick={handleActivate}
          className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wide hover:bg-amber-500/20 transition-all"
        >
          Ativar meta de proteína (120g)
        </button>
      ) : (
        <>
          <div className="h-2 rounded-full bg-zinc-800/60 overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-amber-400' : 'bg-amber-600'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={done}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600/30 text-amber-200 font-bold text-xs uppercase tracking-wide disabled:opacity-40 transition-all"
          >
            <Plus className="w-4 h-4" />
            +{step}g
          </button>
          <div className="flex items-center justify-between mt-3 text-[10px] text-zinc-500">
            <label className="flex items-center gap-1">
              Meta diária:
              <input
                type="number"
                min={50}
                max={300}
                step={10}
                value={proteina.meta_diaria}
                onChange={(e) => updateHabitoMeta(proteina.id, Math.max(50, parseInt(e.target.value, 10) || 120))}
                className="w-14 bg-zinc-950 border border-zinc-700 rounded px-1 text-zinc-300 text-center"
              />
              g
            </label>
            {done && <span className="text-amber-400 font-semibold">Meta ✓</span>}
          </div>
        </>
      )}
    </section>
  );
}
