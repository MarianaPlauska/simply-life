import { useEffect, useState } from 'react'
import { Frown, Annoyed, Meh, Smile, Laugh, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'

// Check-in de saúde mental ao entrar — 1x por dia

const MOODS = [
  { value: 1, icon: Frown, label: 'Péssimo', color: 'border-red-500/40 bg-red-500/10 text-red-400' },
  { value: 2, icon: Annoyed, label: 'Ruim', color: 'border-orange-500/40 bg-orange-500/10 text-orange-400' },
  { value: 3, icon: Meh, label: 'Neutro', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
  { value: 4, icon: Smile, label: 'Bom', color: 'border-sky-500/40 bg-sky-500/10 text-sky-400' },
  { value: 5, icon: Laugh, label: 'Ótimo', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' },
]

function dismissKey(): string
{
  return `axel-mood-check-${new Date().toISOString().slice(0, 10)}`
}

export function MentalHealthCheckIn()
{
  const humorHoje = useTaskStore((s) => s.humorHoje)
  const fetchHumorHoje = useTaskStore((s) => s.fetchHumorHoje)
  const registrarHumor = useTaskStore((s) => s.registrarHumor)

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() =>
  {
    void fetchHumorHoje().finally(() => setLoaded(true))
  }, [fetchHumorHoje])

  useEffect(() =>
  {
    if (!loaded) return
    if (humorHoje) return
    if (sessionStorage.getItem(dismissKey()) === '1') return
    const t = window.setTimeout(() => setOpen(true), 600)
    return () => clearTimeout(t)
  }, [loaded, humorHoje])

  const close = () =>
  {
    sessionStorage.setItem(dismissKey(), '1')
    setOpen(false)
  }

  const save = async (value: number, label: string) =>
  {
    setSaving(true)
    try
    {
      await registrarHumor(value, label, '')
      toast.success(`Humor registrado: ${label}`)
      close()
    }
    finally
    {
      setSaving(false)
    }
  }

  if (!open)
  {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[190] flex items-end sm:items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal
      aria-labelledby="mood-check-title"
    >
      <div className="w-full max-w-md rounded-sl border border-line bg-card p-5 shadow-xl achievement-pop-in">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
              Check-in AXEL
            </p>
            <h2 id="mood-check-title" className="font-display text-lg text-ink mt-1">
              Como está sua saúde mental hoje?
            </h2>
            <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
              Leva 3 segundos. O sistema adapta sugestões de carga e ritmo.
            </p>
          </div>
          <button type="button" onClick={close} className="p-1 text-ink-muted hover:text-ink" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {MOODS.map((m) =>
          {
            const Icon = m.icon
            return (
              <button
                key={m.value}
                type="button"
                disabled={saving}
                onClick={() => void save(m.value, m.label)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-sl border transition-transform hover:scale-[1.03] active:scale-[0.98] ${m.color}`}
              >
                <Icon size={20} strokeWidth={1.75} />
                <span className="font-mono text-[8px] uppercase tracking-wide">{m.label}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={close}
          className="mt-4 w-full text-center font-mono text-[10px] text-ink-muted hover:text-ink uppercase tracking-wide"
        >
          Responder depois
        </button>
      </div>
    </div>
  )
}
