import { useMemo } from 'react';
import { Droplets, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import { AGUA_PRESET } from '../../constants/healthPresets';

export function WaterTrackerCard()
{
  const habitos = useTaskStore((s) => s.habitos);
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit);
  const incrementHabito = useTaskStore((s) => s.incrementHabito);
  const updateHabitoMeta = useTaskStore((s) => s.updateHabitoMeta);

  const agua = useMemo(() => habitos.find((h) => h.tipo === 'agua'), [habitos]);
  const pct = agua && agua.meta_diaria > 0
    ? Math.min(100, (agua.progresso_atual / agua.meta_diaria) * 100)
    : 0;
  const done = agua ? agua.progresso_atual >= agua.meta_diaria : false;

  const handleActivate = async () =>
  {
    await ensureHealthHabit(AGUA_PRESET);
    toast.success('Meta de água ativada — 8 copos/dia');
  };

  const handleDrink = async () =>
  {
    const ensured = agua ?? await ensureHealthHabit(AGUA_PRESET);
    if (!ensured) return;
    const h = ensured;
    if (h.progresso_atual >= h.meta_diaria)
    {
      toast.info('Meta de água já atingida hoje!');
      return;
    }
    await incrementHabito(h.id);
    toast.success('+1 copo de água');
  };

  return (
    <section className="rounded-xl border border-cyan-500/15 bg-zinc-900/50 backdrop-blur-md p-5 hover:border-cyan-500/25 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <Droplets className="w-4 h-4 text-cyan-400" />
        <h2 className="text-[13px] font-semibold text-zinc-100">Hidratação</h2>
        {agua && (
          <span className="ml-auto text-[11px] text-zinc-500 tabular-nums">
            {agua.progresso_atual}/{agua.meta_diaria} copos
          </span>
        )}
      </div>

      {!agua ? (
        <button
          type="button"
          onClick={handleActivate}
          className="w-full py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wide hover:bg-cyan-500/20 transition-all"
        >
          Ativar meta de água (8 copos)
        </button>
      ) : (
        <>
          <div className="h-2 rounded-full bg-zinc-800/60 overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-cyan-400' : 'bg-cyan-600'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            type="button"
            onClick={handleDrink}
            disabled={done}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-cyan-600/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(34,211,238,0.15)]"
          >
            <Plus className="w-5 h-5" />
            Bebi 1 copo
          </button>
          <div className="flex items-center justify-between mt-3 text-[10px] text-zinc-500">
            <label className="flex items-center gap-1">
              Meta:
              <input
                type="number"
                min={4}
                max={20}
                value={agua.meta_diaria}
                onChange={(e) => updateHabitoMeta(agua.id, Math.max(4, parseInt(e.target.value, 10) || 8))}
                className="w-12 bg-zinc-950 border border-zinc-700 rounded px-1 text-zinc-300 text-center"
              />
              copos
            </label>
            {done && <span className="text-cyan-400 font-semibold">Meta do dia ✓</span>}
          </div>
        </>
      )}
    </section>
  );
}
