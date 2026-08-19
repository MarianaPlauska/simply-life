import { useEffect, useState } from 'react'
import { HeartPulse } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { MoodQuickPicker } from '../wellbeing/MoodQuickPicker'
import { moodLabel } from '../../lib/moodConstants'
import { MoodWeekSparkline } from '../wellbeing/MoodWeekSparkline'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

/** Humor do dia + resumo da semana — topo da aba Anotações */
export function NotesMoodStrip()
{
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const humorSemanaAgregado = useTaskStore((s) => s.humorSemanaAgregado)
  const fetchHumorResumo = useTaskStore((s) => s.fetchHumorResumo)
  const registrarHumor = useTaskStore((s) => s.registrarHumor)

  const [pendingMood, setPendingMood] = useState<{ value: number; label: string } | null>(null)
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() =>
  {
    void fetchHumorResumo()
  }, [fetchHumorResumo])

  const ultimo = humorHojeLista[humorHojeLista.length - 1] ?? null

  const confirmMood = async () =>
  {
    if (!pendingMood) return
    setSaving(true)
    try
    {
      const texto = nota.trim()
      await registrarHumor(pendingMood.value, pendingMood.label, texto)
      setNota('')
      setPendingMood(null)
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <section className="sl-panel p-3 sm:p-4 space-y-3 shrink-0">
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse className="w-4 h-4 text-accent shrink-0" strokeWidth={1.75} />
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
              Bem-estar
            </p>
          </div>
          <h3 className={`font-display text-base sm:text-lg ${AXEL_TEXT_PRIMARY}`}>
            {ultimo ? `Hoje: ${moodLabel(ultimo.humor)}` : 'Como você está agora?'}
          </h3>
          {ultimo?.nota && (
            <p className={`text-[12px] mt-1 line-clamp-2 ${AXEL_TEXT_SECONDARY}`}>
              “{ultimo.nota}”
            </p>
          )}

          <div className="mt-3">
            <MoodQuickPicker
              compact
              disabled={saving}
              selected={pendingMood?.value ?? null}
              onSelect={(value, label) => setPendingMood({ value, label })}
            />
          </div>

          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota rápida (opcional). Vai junto com o humor de hoje"
            rows={2}
            disabled={saving}
            className="mt-2 w-full bg-chrome border border-line rounded-sl px-3 py-2 text-[13px] text-ink resize-none min-h-[48px] disabled:opacity-50"
          />

          <button
            type="button"
            disabled={saving || !pendingMood}
            onClick={() => void confirmMood()}
            className="mt-2 w-full sm:w-auto px-4 py-2 rounded-sl bg-accent text-white font-mono text-[10px] uppercase disabled:opacity-40"
          >
            {saving ? 'Salvando…' : pendingMood ? `Registrar · ${pendingMood.label}` : 'Escolha o humor'}
          </button>
        </div>

        {humorSemanaAgregado.length > 0 && (
          <div className="lg:w-52 shrink-0 rounded-sl border border-line bg-chrome/30 p-3">
            <MoodWeekSparkline dias={humorSemanaAgregado} />
          </div>
        )}
      </div>
    </section>
  )
}
