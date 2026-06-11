import { useEffect, useMemo, useState } from 'react'
import { Droplets, Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { AGUA_PRESET } from '../../constants/healthPresets'
import { AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Hidratação hero — recipiente com ondas em camadas + bolhas (estilo Waterllama)

interface WaterWaveCardProps
{
  hero?: boolean
  className?: string
}

export function WaterWaveCard({ hero = true, className = '' }: WaterWaveCardProps)
{
  const navigate = useNavigate()
  const habitos = useTaskStore((s) => s.habitos)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const incrementHabito = useTaskStore((s) => s.incrementHabito)

  const [splashing, setSplashing] = useState(false)

  useEffect(() =>
  {
    void fetchHabitos()
  }, [fetchHabitos])

  const agua = useMemo(() => habitos.find((h) => h.tipo === 'agua'), [habitos])
  const current = agua?.progresso_atual ?? 0
  const goal = agua?.meta_diaria ?? 8
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0
  const done = current >= goal && goal > 0
  // Nível visual mínimo para as ondas sempre aparecerem
  const visualPct = Math.max(done ? 100 : 14, pct)

  const triggerSplash = () =>
  {
    setSplashing(true)
    window.setTimeout(() => setSplashing(false), 650)
  }

  const handleDrink = async () =>
  {
    const h = agua ?? await ensureHealthHabit(AGUA_PRESET)
    if (!h)
    {
      return
    }
    if (h.progresso_atual >= h.meta_diaria)
    {
      toast.info('Meta de água já atingida hoje')
      return
    }
    await incrementHabito(h.id)
    triggerSplash()
    toast.success('+1 copo de água')
  }

  const handleActivate = async () =>
  {
    await ensureHealthHabit(AGUA_PRESET)
    toast.success('Meta de água ativada — 8 copos/dia')
  }

  const vesselH = hero ? 'h-44 sm:h-52' : 'h-28'

  return (
    <section
      className={`relative overflow-hidden rounded-sl border border-sky-500/25 bg-gradient-to-br from-sky-950/40 via-card to-cyan-950/30 shadow-[inset_0_1px_0_rgba(125,211,252,0.12)] ${
        hero ? 'p-4 sm:p-5 min-h-[240px] flex flex-col h-full' : 'p-4'
      } ${className}`}
      aria-label="Hidratação hoje"
    >
      <div className="absolute inset-0 pointer-events-none opacity-40" aria-hidden>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-24 rounded-full bg-cyan-500/15 blur-2xl" />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Droplets size={hero ? 18 : 14} className="text-sky-400" strokeWidth={1.75} />
            <span className={`font-mono uppercase tracking-[0.14em] text-sky-300/90 ${hero ? 'text-[10px]' : 'text-[9px]'}`}>
              Hidratação hoje
            </span>
            {done && (
              <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-sl">
                <Sparkles size={10} />
                Meta
              </span>
            )}
          </div>
          <p className={`font-display tabular-nums leading-none text-sky-50 ${hero ? 'text-4xl' : 'text-2xl'}`}>
            {current}
            <span className={`text-sky-300/70 font-normal ${hero ? 'text-lg' : 'text-sm'}`}> / {goal} copos</span>
          </p>
          <p className={`mt-1.5 ${AXEL_TEXT_SECONDARY} ${hero ? 'text-xs' : 'text-[11px]'}`}>
            {done ? 'Dia hidratado — parabéns!' : `${Math.round(pct)}% da meta · ondas ao vivo`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void (agua ? handleDrink() : handleActivate())}
          disabled={done && Boolean(agua)}
          className="shrink-0 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-2 rounded-sl border border-sky-400/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25 disabled:opacity-40 transition-all active:scale-[0.97]"
        >
          <Plus size={14} />
          {agua ? 'Bebi 1 copo' : 'Ativar meta'}
        </button>
      </div>

      <div
        className={`relative mt-4 flex-1 rounded-sl border-2 border-sky-400/20 bg-slate-950/50 overflow-hidden shadow-[inset_0_8px_24px_rgba(0,0,0,0.35)] ${vesselH} ${
          splashing ? 'water-vessel-splash' : ''
        }`}
        onClick={() => navigate('/saude#hidratacao')}
        onKeyDown={(e) =>
        {
          if (e.key === 'Enter') navigate('/saude#hidratacao')
        }}
        role="button"
        tabIndex={0}
        title="Abrir hidratação completa"
      >
        <div className="absolute inset-x-3 top-3 bottom-3 rounded-sl border border-white/5 pointer-events-none" aria-hidden />

        {/* bolhas decorativas */}
        <span className="water-bubble water-bubble-a" aria-hidden />
        <span className="water-bubble water-bubble-b" aria-hidden />
        <span className="water-bubble water-bubble-c" aria-hidden />

        <div
          className="absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out"
          style={{ height: `${visualPct}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-sky-600/85 via-cyan-500/55 to-sky-400/25" />

          <svg
            className="water-wave-layer water-wave-a absolute left-0 bottom-[calc(100%-10px)] w-[240%] h-7 text-sky-300/70"
            viewBox="0 0 1200 48"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path fill="currentColor" d="M0,24 C200,44 400,4 600,24 C800,44 1000,4 1200,24 L1200,48 L0,48 Z" />
          </svg>
          <svg
            className="water-wave-layer water-wave-b absolute left-0 bottom-[calc(100%-16px)] w-[240%] h-6 text-cyan-200/50"
            viewBox="0 0 1200 48"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path fill="currentColor" d="M0,28 C180,8 380,38 600,22 C820,6 1020,36 1200,28 L1200,48 L0,48 Z" />
          </svg>
          <svg
            className="water-wave-layer water-wave-c absolute left-0 bottom-[calc(100%-22px)] w-[240%] h-5 text-sky-100/35"
            viewBox="0 0 1200 48"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path fill="currentColor" d="M0,20 C250,36 500,8 750,22 C950,34 1100,12 1200,20 L1200,48 L0,48 Z" />
          </svg>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
          <span className={`font-display tabular-nums text-sky-100/90 drop-shadow-sm ${hero ? 'text-3xl' : 'text-xl'}`}>
            {Math.round(pct)}%
          </span>
          {current === 0 && !done && (
            <span className="font-mono text-[10px] uppercase tracking-wide text-sky-300/80">
              Toque em “Bebi 1 copo”
            </span>
          )}
        </div>
      </div>

      <p className="relative z-10 mt-2 text-center font-mono text-[9px] uppercase tracking-wider text-sky-400/80">
        Água em movimento · 3 camadas de onda
      </p>
    </section>
  )
}
