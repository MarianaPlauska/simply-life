import { useState } from 'react';
import { SmilePlus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import { MoodQuickPicker } from '../wellbeing/MoodQuickPicker';
import { MoodDayTimeline } from '../wellbeing/MoodDayTimeline';
import { MoodWeekSparkline } from '../wellbeing/MoodWeekSparkline';
import { MoodMonthHeatmap } from '../wellbeing/MoodMonthHeatmap';
import { MOOD_CONTEXT_TAGS } from '../../lib/moodConstants';
import { mediaHumor } from '../../lib/moodInsights';

export function MoodTracker()
{
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista);
  const humorSemanaAgregado = useTaskStore((s) => s.humorSemanaAgregado);
  const humorMesAgregado = useTaskStore((s) => s.humorMesAgregado);
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
    toast.success(`${label} guardado no seu diário`, { description: nota || undefined });
    setNota('');
    setContexto([]);
    setSalvando(false);
  };

  return (
    <section className="sl-panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SmilePlus className="w-4 h-4 text-accent" />
          <h2 className="font-display text-base text-ink">
            Como você está agora?
          </h2>
        </div>
        {temRegistroHoje && (
          <span className="flex items-center gap-1 text-[10px] text-concluido font-medium">
            <Check className="w-3 h-3" />
            {humorHojeLista.length} hoje · média {mediaHumor(humorHojeLista)}
          </span>
        )}
      </div>

      <p className="text-[12px] text-ink-muted leading-relaxed">
        Toque no humor que combina com agora. Pode registrar de novo quando mudar — cada momento fica guardado no seu histórico.
      </p>

      <MoodQuickPicker disabled={salvando} onSelect={(v, l) => void handleSave(v, l)} />

      <div className="flex flex-wrap gap-1.5">
        {MOOD_CONTEXT_TAGS.map((tag) =>
        {
          const on = contexto.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleContexto(tag.id)}
              className={`px-2 py-1 rounded-sl font-mono text-[9px] uppercase border transition-colors ${
                on
                  ? 'border-accent/50 bg-accent-muted text-accent'
                  : 'border-line text-ink-muted hover:text-ink'
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
        className="w-full bg-chrome border border-line rounded-sl px-3 py-2 text-[13px] text-ink placeholder:text-ink-muted outline-none focus:border-accent transition-colors"
      />

      <MoodDayTimeline entries={humorHojeLista} />
      <MoodWeekSparkline dias={humorSemanaAgregado} />
      <MoodMonthHeatmap agregados={humorMesAgregado} />
    </section>
  );
}
