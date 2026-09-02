import { useState } from 'react';
import { Check, SmilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import { MoodQuickPicker } from '../wellbeing/MoodQuickPicker';
import { MOOD_CONTEXT_TAGS } from '../../lib/moodConstants';
import { mediaHumor } from '../../lib/moodInsights';

interface MoodTrackerProps
{
  /** Diário desktop — menos altura e ruído visual */
  dense?: boolean
}

export function MoodTracker({ dense = false }: MoodTrackerProps)
{
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista);
  const registrarHumor = useTaskStore((s) => s.registrarHumor);
  const completeOnboardingStep = useTaskStore((s) => s.completeOnboardingStep);

  const [nota, setNota] = useState('');
  const [contexto, setContexto] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const temRegistroHoje = humorHojeLista.length > 0;

  const toggleContexto = (id: string) =>
  {
    setContexto((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleSave = async (value: number, label: string) =>
  {
    setSalvando(true);
    await registrarHumor(value, label, nota, contexto.length ? { contexto } : undefined);
    completeOnboardingStep('register_mood');
    toast.success(label);
    setNota('');
    setContexto([]);
    setSalvando(false);
  };

  return (
    <section className={`sl-panel space-y-3 border border-line/80 ${dense ? 'p-3 sm:p-4' : 'p-4 sm:p-5 border-rose-400/15 bg-gradient-to-br from-rose-500/[0.06] to-transparent'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {!dense && (
            <div className="p-1.5 rounded-sl bg-rose-500/10 border border-rose-400/20 shrink-0">
              <SmilePlus className="w-4 h-4 text-rose-300" strokeWidth={1.75} />
            </div>
          )}
          <h2 className={`font-sans font-semibold text-ink ${dense ? 'text-[15px]' : 'font-display text-base'}`}>
            Humor agora
          </h2>
        </div>
        {temRegistroHoje && (
          <span className="flex items-center gap-1 text-[10px] text-concluido font-mono tabular-nums">
            <Check className="w-3 h-3" />
            {humorHojeLista.length} · {mediaHumor(humorHojeLista)}/5
          </span>
        )}
      </div>

      <MoodQuickPicker
        disabled={salvando}
        compact={dense}
        onSelect={(v, l) => void handleSave(v, l)}
      />

      <div className={`flex flex-wrap gap-1.5 ${dense ? 'max-w-md' : ''}`}>
        {MOOD_CONTEXT_TAGS.map((tag) =>
        {
          const on = contexto.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleContexto(tag.id)}
              className={`px-2.5 py-1 rounded-pill font-mono text-[9px] uppercase border transition-colors ${dense ? 'min-h-[28px]' : 'min-h-[32px]'} ${
                on
                  ? 'border-rose-400/40 bg-rose-500/10 text-rose-200'
                  : 'border-line/70 text-ink-muted hover:text-ink hover:border-line'
              }`}
            >
              {tag.label}
            </button>
          );
        })}
      </div>

      <input
        type="text"
        placeholder="Nota rápida (opcional)"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        className={`w-full bg-card/50 border border-line/80 rounded-sl px-3 text-[13px] text-ink placeholder:text-ink-muted outline-none focus:border-rose-400/35 transition-colors ${dense ? 'py-2 min-h-[40px]' : 'py-2.5 min-h-[44px]'}`}
      />
    </section>
  );
}
