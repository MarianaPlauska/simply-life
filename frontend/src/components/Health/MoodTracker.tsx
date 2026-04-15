import { useState } from 'react';
import { SmilePlus, Check, Frown, Annoyed, Meh, Smile, Laugh } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import type { HumorRegistro } from '../../store/slices/bemEstarSlice';

/* opções de humor com cor de destaque */
const MOODS = [
  { value: 1, icon: Frown,   label: 'Péssimo', color: '#ef4444' },
  { value: 2, icon: Annoyed, label: 'Ruim',    color: '#f97316' },
  { value: 3, icon: Meh,     label: 'Neutro',  color: '#eab308' },
  { value: 4, icon: Smile,   label: 'Bom',     color: '#22d3ee' },
  { value: 5, icon: Laugh,   label: 'Ótimo',   color: '#06b6d4' },
];

/* cor de cada nível de humor para os pixels */
const MOOD_PIXEL_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22d3ee',
  5: '#06b6d4',
};

/* sparkline dos últimos 7 dias — linha com preenchimento gradiente */
function MiniSparkline ({ data }: { data: HumorRegistro[] })
{
  if (data.length < 2) return null;
  const w = 160, h = 40, pad = 4;
  const values = data.map((d) => d.humor);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const range = max - min || 1;
  /* stepX: divide o espaço disponível entre os pontos */
  const stepX = (w - pad * 2) / (values.length - 1);

  const points = values.map((v, i) =>
  {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const gradId = 'spark-grad-cyan';

  return (
    <svg width={w} height={h} className="opacity-90">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pad},${h - pad} ${points.join(' ')} ${pad + (values.length - 1) * stepX},${h - pad}`}
        fill={`url(#${gradId})`}
      />
      <polyline
        points={points.join(' ')}
        fill="none" stroke="#22d3ee" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {points.map((pt, i) => {
        const [cx, cy] = pt.split(',');
        return <circle key={i} cx={cx} cy={cy} r="3" fill="#22d3ee" stroke="#18181b" strokeWidth="1.5" />;
      })}
    </svg>
  );
}

/* grid de pixels coloridos — mostra os últimos 30 dias de humor de um jeito bem visual, tipo calendário de cores */
function MonthPixels ({ data }: { data: HumorRegistro[] })
{
  const today = new Date();
  const days: Array<{ dateStr: string; humor: number | null }> = [];

  /* monta os 30 dias em ordem do mais antigo para hoje */
  for (let i = 29; i >= 0; i--)
  {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const reg = data.find((r) => r.data === dateStr);
    days.push({ dateStr, humor: reg ? reg.humor : null });
  }

  return (
    <div className="pt-2 border-t border-zinc-800/30">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-2">
        últimos 30 dias
      </span>
      <div className="flex flex-wrap gap-1">
        {days.map(({ dateStr, humor }) => (
          <div
            key={dateStr}
            title={humor ? `${dateStr}: ${MOODS[humor - 1]?.label}` : dateStr}
            className="w-4 h-4 rounded-sm transition-transform duration-200 hover:scale-125 cursor-default"
            style={{
              backgroundColor: humor ? MOOD_PIXEL_COLORS[humor] : '#27272a',
              opacity: humor ? 0.9 : 0.4,
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <div key={v} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: MOOD_PIXEL_COLORS[v] }} />
            <span className="text-[9px] text-zinc-600">{MOODS[v - 1].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* componente principal do rastreador de humor */
export function MoodTracker ()
{
  const humorHoje    = useTaskStore((s) => s.humorHoje);
  const humorSemana  = useTaskStore((s) => s.humorSemana);
  const humorMes     = useTaskStore((s) => s.humorMes);
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
    <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-md p-5 space-y-4
                        shadow-[0_-1px_0_rgba(34,211,238,0.15),0_0_30px_rgba(34,211,238,0.04)]
                        hover:border-cyan-500/20 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SmilePlus className="w-4 h-4 text-cyan-400" />
          <h2 className="text-[13px] font-semibold bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent">
            Como você está hoje?
          </h2>
        </div>
        {jaRegistrou && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <Check className="w-3 h-3" />Registrado
          </span>
        )}
      </div>

      {/* seletor de humor — cards maiores com glow na cor selecionada */}
      <div className="flex items-center justify-center gap-2">
        {MOODS.map((m) =>
        {
          const isActive = selected === m.value || (jaRegistrou && humorHoje?.humor === m.value && !selected);
          const MIcon = m.icon;
          return (
            <button
              key={m.value}
              onClick={() => setSelected(m.value)}
              className={`
                w-[60px] h-[60px] rounded-xl flex flex-col items-center justify-center gap-1
                transition-all duration-200 border
                ${isActive
                  ? 'scale-110 border-cyan-500/50'
                  : 'border-zinc-800/50 bg-zinc-900/60 hover:border-zinc-700 hover:scale-105'}
              `}
              style={isActive ? {
                backgroundColor: `${m.color}18`,
                boxShadow: `0 0 20px ${m.color}30, 0 0 8px ${m.color}20`,
              } : {}}
              title={m.label}
            >
              <MIcon className="w-6 h-6 transition-colors duration-200" style={{ color: isActive ? m.color : '#71717a' }} />
              <span className="text-[9px] font-medium transition-colors duration-200" style={{ color: isActive ? m.color : '#52525b' }}>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* nota opcional ao registrar */}
      {(selected || jaRegistrou) && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Uma nota rápida... (opcional)"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-lg px-3 py-2
                       text-[13px] text-white placeholder:text-zinc-600
                       outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all"
          />
          {selected && (
            <button
              onClick={handleSave}
              disabled={salvando}
              className="px-4 py-2 text-[12px] font-medium bg-cyan-600 text-white rounded-lg
                         hover:bg-cyan-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {salvando ? 'Salvando...' : jaRegistrou ? 'Atualizar Humor' : 'Registrar Humor'}
            </button>
          )}
        </div>
      )}

      {/* sparkline da semana */}
      {humorSemana.length >= 2 && (
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/30">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">últimos 7 dias</span>
          <MiniSparkline data={humorSemana} />
        </div>
      )}

      {/* grade de pixels dos últimos 30 dias */}
      <MonthPixels data={humorMes} />
    </section>
  );
}
