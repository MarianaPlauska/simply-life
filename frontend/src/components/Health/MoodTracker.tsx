import { useState } from 'react';
import { SmilePlus, Check, Frown, Annoyed, Meh, Smile, Laugh } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import type { HumorRegistro } from '../../store/slices/bemEstarSlice';

/* ── emojis do mood ────────────────────────────────────────── */
const MOODS = [
  { value: 1, icon: Frown,   label: 'Péssimo', color: '#ef4444' },
  { value: 2, icon: Annoyed, label: 'Ruim',    color: '#f97316' },
  { value: 3, icon: Meh,     label: 'Neutro',  color: '#eab308' },
  { value: 4, icon: Smile,   label: 'Bom',     color: '#22c55e' },
  { value: 5, icon: Laugh,   label: 'Ótimo',   color: '#8b5cf6' },
];

/* ── sparkline svg puro (sem lib) ────────────────────────── */
function MiniSparkline({ data }: { data: HumorRegistro[] })
{
  if ( data.length < 2 ) return null;
  const w = 160, h = 40, pad = 4;
  const values = data.map((d) => d.humor);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (values.length - 1);

  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const gradId = 'spark-grad';

  return (
    <svg width={w} height={h} className="opacity-80">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* area fill */}
      <polygon
        points={`${pad},${h - pad} ${points.join(' ')} ${pad + (values.length - 1) * stepX},${h - pad}`}
        fill={`url(#${gradId})`}
      />
      {/* line */}
      <polyline
        points={points.join(' ')}
        fill="none" stroke="#8b5cf6" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* dots */}
      {points.map((pt, i) => {
        const [cx, cy] = pt.split(',');
        return <circle key={i} cx={cx} cy={cy} r="3" fill="#8b5cf6" stroke="#18181b" strokeWidth="1.5" />;
      })}
    </svg>
  );
}


/* ── componente principal ────────────────────────────────── */
export function MoodTracker()
{
  const humorHoje = useTaskStore((s) => s.humorHoje);
  const humorSemana = useTaskStore((s) => s.humorSemana);
  const registrarHumor = useTaskStore((s) => s.registrarHumor);

  const [selected, setSelected] = useState<number | null>(null);
  const [nota, setNota] = useState('');
  const [salvando, setSalvando] = useState(false);

  const jaRegistrou = !!humorHoje;

  const handleSave = async () =>
  {
    if ( !selected ) return;
    setSalvando(true);
    const mood = MOODS.find((m) => m.value === selected);
    await registrarHumor(selected, mood?.label || '', nota);
    toast.success(`Humor registrado: ${mood?.label}`, { description: nota || undefined });
    setNota('');
    setSelected(null);
    setSalvando(false);
  };

  return (
    <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5 space-y-4 shadow-[0_0_30px_rgba(139,92,246,0.03)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SmilePlus className="w-4 h-4 text-violet-400" />
          <h2 className="text-[13px] font-semibold text-white">Como você está hoje?</h2>
        </div>
        {jaRegistrou && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <Check className="w-3 h-3" />Registrado
          </span>
        )}
      </div>

      {/* emoji selector */}
      <div className="flex items-center justify-center gap-3">
        {MOODS.map((m) => {
          const isActive = selected === m.value || (jaRegistrou && humorHoje?.humor === m.value && !selected);
          const MIcon = m.icon;
          return (
            <button
              key={m.value}
              onClick={() => setSelected(m.value)}
              className={`
                w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5
                transition-all duration-200 border
                ${isActive
                  ? 'border-violet-500/50 bg-violet-500/10 scale-110 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                  : 'border-zinc-800/50 bg-zinc-900/60 hover:border-zinc-700 hover:scale-105'}
              `}
              title={m.label}
            >
              <MIcon className="w-5 h-5" style={{ color: isActive ? m.color : '#71717a' }} />
              <span className="text-[8px] font-medium" style={{ color: isActive ? m.color : '#52525b' }}>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* input de nota */}
      {(selected || jaRegistrou) && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Uma nota rápida... (opcional)"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-lg px-3 py-2
                       text-[13px] text-white placeholder:text-zinc-600
                       outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
          />
          {selected && (
            <button
              onClick={handleSave}
              disabled={salvando}
              className="px-4 py-2 text-[12px] font-medium bg-violet-600 text-white rounded-lg
                         hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {salvando ? 'Salvando...' : jaRegistrou ? 'Atualizar Humor' : 'Registrar Humor'}
            </button>
          )}
        </div>
      )}

      {/* sparkline dos últimos 7 dias */}
      {humorSemana.length >= 2 && (
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/30">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">últimos 7 dias</span>
          <MiniSparkline data={humorSemana} />
        </div>
      )}
    </section>
  );
}
